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
