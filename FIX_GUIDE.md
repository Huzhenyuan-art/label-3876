# Bug 修复记录

## Bug: 用户关注店铺后再次进入页面关注状态消失

### 问题描述
用户在店铺详情页点击关注按钮，关注成功后状态显示正常。但当用户离开页面再次进入（或刷新页面）时，关注按钮又显示为"关注"而不是"已关注"。

### 问题根因

#### 1. 后端认证问题
**文件**: `backend/app/auth.py` 中的 `get_current_user_optional` 函数

**原因**: 使用了 `OAuth2PasswordBearer` 作为依赖项，即使设置了 `auto_error=False`，当请求中包含 `Authorization` header 但 token 格式不正确或无效时，`OAuth2PasswordBearer` 仍然会抛出 401 异常，导致 `/shops/{shop_id}/follow-status` API 调用失败。

#### 2. 前端错误处理问题
**文件**: `frontend/src/pages/ShopDetailPage.tsx` 中的 `loadShopData` 函数

**原因**: 调用 `shopApi.getFollowStatus(shopId)` 的 catch 块是空的，当 API 调用失败时：
- 没有错误日志，难以调试
- `isFollowed` 状态保持默认值 `false`
- 用户看到错误的关注状态

### 修复方案

#### 1. 后端修复
重写 `get_current_user_optional` 函数，不再依赖 `OAuth2PasswordBearer`，而是直接从 request headers 中手动提取和验证 token：

```python
# 修复前
async def get_current_user_optional(
    token: Optional[str] = Depends(OAuth2PasswordBearer(tokenUrl="api/auth/login", auto_error=False)),
    db: AsyncSession = Depends(get_db)
) -> Optional[User]:
    if not token:
        return None
    # ... token 验证逻辑

# 修复后
async def get_current_user_optional(
    request: Request,
    db: AsyncSession = Depends(get_db)
) -> Optional[User]:
    authorization: str = request.headers.get("Authorization")
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization[len("Bearer "):]
    # ... token 验证逻辑（捕获所有异常并返回 None）
```

#### 2. 前端修复
在 `loadShopData` 函数中，给空的 catch 块添加错误日志：

```typescript
// 修复前
try {
  const followRes = await shopApi.getFollowStatus(shopId)
  setIsFollowed(followRes.data.is_following)
  setFollowers(followRes.data.follower_count)
} catch {
}

// 修复后
try {
  const followRes = await shopApi.getFollowStatus(shopId)
  setIsFollowed(followRes.data.is_following)
  setFollowers(followRes.data.follower_count)
} catch (e) {
  console.error('Failed to load follow status:', e)
}
```

### 修复的文件
1. `backend/app/auth.py` - 修复可选认证逻辑
2. `frontend/src/pages/ShopDetailPage.tsx` - 添加错误日志

### 验证方法
1. 登录账号
2. 进入任意店铺详情页
3. 点击关注按钮，确认状态变为"已关注"
4. 刷新页面或导航离开再返回
5. 确认关注状态仍然显示为"已关注"
6. 打开浏览器控制台，确认没有 `Failed to load follow status` 相关错误

---

## Bug: Docker 构建失败 - npm ci 报 package-lock.json 不同步

### 问题描述
执行 `docker compose build` 时，前端构建阶段 `npm ci` 报错，提示 `package.json` 与 `package-lock.json` 不同步：

```
#13 [web builder 4/6] RUN npm config set registry https://registry.npmmirror.com && npm ci
#13 22.85 npm error `npm ci` can only install packages when your package.json and package-lock.json are in sync.
#13 22.85 npm error Missing: @testing-library/jest-dom@6.9.1 from lock file
#13 22.85 npm error Missing: @testing-library/react@14.3.1 from lock file
#13 22.85 npm error Missing: vitest@1.6.1 from lock file
#13 22.85 npm error Missing: jsdom@23.2.0 from lock file
#13 22.85 ... (数十个缺失的依赖包)
```

### 问题根因

**文件**: `frontend/package.json` 和 `frontend/package-lock.json`

**原因**: 在为项目添加自动化测试时，向 `package.json` 的 `devDependencies` 中添加了测试相关依赖（vitest、@testing-library/react、@testing-library/jest-dom、jsdom 等），但没有同步更新 `package-lock.json`。

`npm ci` 命令要求 `package-lock.json` 必须与 `package.json` 完全一致，它会严格校验 lock file 中是否包含 `package.json` 声明的每一个依赖。当发现新增的依赖在 lock file 中缺失时，直接报错退出，不会自动安装。

Dockerfile 中的构建流程：
```dockerfile
COPY package*.json ./
RUN npm config set registry https://registry.npmmirror.com && \
    npm ci
```

`npm ci` 读取 `package.json` 和 `package-lock.json`，发现新增的测试依赖在 lock file 中不存在，构建失败。

### 修复方案

在 `frontend` 目录下执行 `npm install` 重新生成与 `package.json` 同步的 `package-lock.json`：

```bash
cd frontend
npm install --registry https://registry.npmmirror.com
```

执行后 `package-lock.json` 会被自动更新，包含所有新增的测试依赖及其子依赖：

- `vitest@^1.2.0` 及其依赖（@vitest/coverage-v8、magic-string、magicast 等）
- `@testing-library/react@^14.1.2` 及其依赖（@testing-library/dom、aria-query 等）
- `@testing-library/jest-dom@^6.2.0` 及其依赖
- `@testing-library/user-event@^14.5.2`
- `jsdom@^23.2.0` 及其依赖（cssstyle、parse5、saxes、tough-cookie、ws 等）

### 修复的文件
1. `frontend/package-lock.json` - 重新生成，与 package.json 同步

### 预防措施

以后修改 `package.json` 添加或删除依赖时，必须同步执行 `npm install` 更新 `package-lock.json`，确保两者一致后再提交。可以遵循以下规则：

1. **修改依赖后立即执行** `npm install` 更新 lock file
2. **提交前检查**：`git diff package-lock.json` 确认有变更
3. **CI/CD 流水线**：可添加 `npm ci --dry-run` 检查步骤，提前发现不同步问题

### 验证方法
1. 执行 `docker compose build web` 构建前端镜像
2. 确认 `npm ci` 步骤成功完成，不再报 `Missing: xxx from lock file` 错误
3. 确认后续 `npm run build` 步骤成功执行
4. 确认前端容器正常启动
