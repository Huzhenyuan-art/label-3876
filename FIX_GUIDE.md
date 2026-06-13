# 个人资料保存失败及误登出问题修复指南

## 1. 问题概述

### 1.1 问题现象

用户在修改个人资料并点击保存按钮时，系统显示"保存失败，请稍后重试"的错误提示。当用户点击确认按钮后，系统异常跳转至登录页面。

### 1.2 影响范围

- 所有需要用户认证的 API 接口（GET/PUT /api/auth/me 等）
- 用户登录态保持（刷新页面后会被强制登出）
- 用户体验：操作失败后被错误地重定向到登录页面

## 2. 问题复现步骤

### 2.1 前置条件

1. 系统已正常启动（Docker 环境）
2. 存在可用的测试账号（如 admin/admin123）

### 2.2 复现步骤

1. 打开浏览器，访问系统首页（http://localhost:3876）
2. 使用测试账号登录系统
3. 点击右上角用户头像，进入"个人资料"页面
4. 点击"编辑资料"按钮，修改昵称或邮箱
5. 点击"保存"按钮
6. 观察到弹出"保存失败，请稍后重试"的错误提示
7. 点击"确认"按钮
8. 系统异常跳转至登录页面（预期行为：应停留在个人资料页面）

### 2.3 接口测试复现

```bash
# 1. 登录获取 token
curl -X POST http://localhost:8876/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# 2. 使用获取的 token 调用更新资料接口（返回 401 Unauthorized）
curl -X PUT http://localhost:8876/api/auth/me \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{"nickname":"测试昵称"}'
```

## 3. 错误日志分析

### 3.1 后端日志

```
INFO:     172.21.0.1:50062 - "OPTIONS /api/auth/me HTTP/1.1" 200 OK
INFO:     172.21.0.1:50062 - "PUT /api/auth/me HTTP/1.1" 401 Unauthorized
```

### 3.2 前端错误

```
Failed to update profile: Error: Request failed with status code 401
```

### 3.3 根因定位过程

1. 检查路由是否正确注册：通过 OpenAPI schema 确认 `PUT /api/auth/me` 已正确注册
2. 检查认证依赖：确认接口使用了 `get_current_user` 依赖
3. 检查 token 是否正确传递：通过浏览器开发者工具确认请求头包含有效的 Authorization
4. 容器内调试：在 Python 环境中直接测试 JWT 解码，发现关键错误

```python
from jose import jwt
from app.config import settings

token = jwt.encode({'sub': 2, 'exp': 9999999999}, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
# 解码时报错：Subject must be a string.
```

## 4. 问题根本原因

### 4.1 核心问题：JWT sub 声明类型不匹配

**原因**：`python-jose` 库（版本 3.3.0）要求 JWT 标准声明 `sub` (subject) 必须是字符串类型，但代码中传入的是整数类型的用户 ID。

**具体表现**：
- `create_access_token` 函数中 `data={"sub": new_user.id}`，`new_user.id` 是整数
- `jwt.decode` 时抛出错误："Subject must be a string."
- 错误被 `try-except JWTError` 捕获，导致 `get_current_user` 返回 401 Unauthorized

### 4.2 为什么登录看起来正常？

登录接口只负责**创建** token，不验证 token，所以登录成功。但所有需要认证的接口（需要**解码** token）都会失败。

用户登录后如果不刷新页面，由于前端使用 localStorage 缓存用户信息，界面上看起来是登录状态。但一旦调用需要认证的 API（如保存资料、刷新页面），就会返回 401。

### 4.3 为什么会跳转到登录页？

前端 axios 响应拦截器全局捕获 401 状态码，自动触发登出逻辑（清除 token、清除用户信息、跳转登录页），这是为了处理 token 过期的正常逻辑。但由于我们的 bug 导致本不该 401 的请求返回了 401，从而造成了误登出。

## 5. 解决方案

### 5.1 修复思路

在 JWT token 的编码和解码过程中，统一处理 `sub` 声明的类型转换：
- **编码时**：将整数类型的用户 ID 转换为字符串
- **解码时**：将字符串类型的 sub 转换回整数类型的用户 ID

### 5.2 为什么这是正确的方案？

1. 符合 JWT 规范：RFC 7519 中 `sub` 声明通常是字符串类型
2. 兼容现有代码：只需修改 auth.py，其他代码无需改动
3. 向后兼容：新生成的 token 使用字符串 sub，旧 token 失效需要用户重新登录（预期行为）

## 6. 代码修改点

### 6.1 修改文件：backend/app/auth.py

#### 修改 1：create_access_token 函数（第 27-37 行）

**修改前**：
```python
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt
```

**修改后**：
```python
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if "sub" in to_encode:
        to_encode["sub"] = str(to_encode["sub"])
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt
```

**修改说明**：在编码前检查并转换 `sub` 为字符串类型。

#### 修改 2：get_current_user 函数（第 40-62 行）

**修改前**：
```python
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="登录状态已失效，请重新登录",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: int = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        token_data = TokenData(user_id=user_id)
    except JWTError:
        raise credentials_exception
```

**修改后**：
```python
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="登录状态已失效，请重新登录",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        sub = payload.get("sub")
        if sub is None:
            raise credentials_exception
        user_id = int(sub)
        token_data = TokenData(user_id=user_id)
    except (JWTError, ValueError):
        raise credentials_exception
```

**修改说明**：
1. 先获取 sub 原值，再显式转换为 int
2. 捕获 ValueError（防止 sub 无法转换为整数的情况）

## 7. 测试验证方法及结果

### 7.1 后端接口测试

**测试命令**（PowerShell）：

```powershell
# 1. 登录获取 token
$body = @{username="admin"; password="admin123"} | ConvertTo-Json
$response = Invoke-RestMethod -Uri "http://localhost:8876/api/auth/login" -Method Post -Body $body -ContentType "application/json"
$token = $response.access_token
Write-Host "登录成功，token: $token"

# 2. 测试 GET /api/auth/me
$headers = @{Authorization="Bearer $token"}
$user = Invoke-RestMethod -Uri "http://localhost:8876/api/auth/me" -Method Get -Headers $headers
Write-Host "GET 成功: $($user.nickname)"

# 3. 测试 PUT /api/auth/me
$updateBody = @{nickname="测试昵称新"} | ConvertTo-Json
$updatedUser = Invoke-RestMethod -Uri "http://localhost:8876/api/auth/me" -Method Put -Body $updateBody -ContentType "application/json" -Headers $headers
Write-Host "PUT 成功: $($updatedUser.nickname)"
```

**测试结果**：

```
登录成功，token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyIiwiZXhwIjoxNzgxOTUzNzQwfQ...
--- 测试 GET /api/auth/me ---
GET 成功: 管理员
--- 测试 PUT /api/auth/me ---
PUT 成功: 测试昵称新
```

**验证点**：
- ✅ 登录成功，返回有效 token
- ✅ GET /api/auth/me 正常返回用户信息
- ✅ PUT /api/auth/me 成功更新用户资料
- ✅ Token 解码后 sub 为字符串类型（`"sub":"2"`）

### 7.2 前端功能测试

**测试步骤**：

1. 启动前端开发服务器或使用 Docker 环境
2. 使用测试账号登录
3. 进入个人资料页面
4. 点击"编辑资料"，修改昵称
5. 点击"保存"按钮
6. 验证保存成功，无错误提示
7. 刷新页面，验证资料更新后的值仍然存在
8. 检查 Header 区域的用户昵称是否同步更新

**预期结果**：
- ✅ 保存成功，无错误提示
- ✅ 页面显示更新后的资料
- ✅ Header 用户菜单昵称同步更新
- ✅ 刷新页面后保持更新状态
- ✅ 不会被异常跳转到登录页

### 7.3 边界情况测试

| 测试场景 | 预期结果 | 实际结果 |
|---------|---------|---------|
| 修改昵称 | 保存成功，昵称更新 | ✅ 通过 |
| 修改邮箱 | 保存成功，邮箱更新 | ✅ 通过 |
| 同时修改昵称和邮箱 | 保存成功，两者都更新 | ✅ 通过 |
| 使用已存在的用户名 | 返回 400 错误，提示用户名已存在 | ✅ 通过 |
| 使用已存在的邮箱 | 返回 400 错误，提示邮箱已被使用 | ✅ 通过 |
| token 过期后调用接口 | 返回 401，正常跳转登录页 | ✅ 通过 |

## 8. 实施步骤

### 8.1 开发环境

1. 修改 `backend/app/auth.py` 文件
2. 重新构建后端 Docker 镜像：
   ```bash
   docker compose up -d --build api
   ```
3. 验证 API 接口是否正常工作
4. 清除浏览器 localStorage 中的旧 token，重新登录测试

### 8.2 生产环境

1. 提交代码到版本控制
2. 部署新版本后端服务
3. 通知用户可能需要重新登录（因为旧 token 格式不兼容）
4. 监控登录和认证相关接口的错误率

### 8.3 注意事项

1. **旧 token 失效**：修复后，之前生成的 token（整数 sub）将无法使用，用户需要重新登录。这是预期行为，因为 token 格式发生了变化。
2. **前端缓存清理**：如果前端有缓存用户信息，建议用户清除浏览器缓存或强制刷新页面。
3. **数据库无需迁移**：此修复不涉及数据库结构变更，无需执行数据库迁移。

## 9. 补充说明

### 9.1 关于 401 误登出问题

用户提到"点击确认之后跳到了登录页面，不正常"。这实际上是正常的安全机制——当认证失败（401）时，前端会自动登出并跳转登录页。

但在本问题中，401 是由于 bug 导致的，而不是真正的认证过期。修复根因（JWT sub 类型问题）后，正常操作不会再出现误登出的情况。

如果未来需要优化 401 处理的用户体验，可以考虑：
- 区分"token 过期"和"token 无效"的情况
- 在特定页面（如资料编辑）捕获 401 错误，给出更友好的提示
- 增加 token 刷新机制，避免用户频繁重新登录

### 9.2 相关文件清单

| 文件路径 | 修改类型 | 说明 |
|---------|---------|------|
| backend/app/auth.py | 修改 | JWT 编码/解码时处理 sub 类型转换 |

### 9.3 历史问题回溯

此问题可能从项目一开始就存在，但由于以下原因一直未被发现：
1. 登录接口本身不验证 token，只创建 token
2. 前端使用 localStorage 缓存用户信息，登录后不刷新页面看起来正常
3. 可能大部分功能接口不需要认证，或者测试不充分
