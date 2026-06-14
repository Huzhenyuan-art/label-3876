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

---

## Bug: lib/order.ts 在非 JSX 环境下返回 JSX 元素导致构建错误

### 问题描述
`frontend/src/lib/order.ts` 文件使用 `.ts` 扩展名（非 JSX 环境），但 `getStatusIcon` 函数中直接使用 JSX 语法（如 `<Truck />`、`<CheckCircle2 />` 等），同时 `StatusBadge` 接口引用了 `React.ComponentType` 类型但未导入 React，导致 TypeScript 构建报错。

### 问题根因

**文件**: `frontend/src/lib/order.ts`

**原因**: 
1. `.ts` 文件不支持 JSX 语法糖，直接写 `<Component />` 会编译失败
2. 文件中使用了 `React.ComponentType` 类型但未导入 `React`
3. 同目录下的 `lib/cart.ts` 和 `lib/product.ts` 已采用 `React.createElement` 方式避免此问题，但 `order.ts` 遗漏了

### 修复方案

#### 1. 导入 React 类型
在文件顶部添加 React 导入，使 `React.ComponentType` 和 `React.ReactNode` 类型可用：

```typescript
// 修复前
import { Order, OrderStatus, OrderTimelineItem, ORDER_STATUS_MAP, Product } from '../types'

// 修复后
import React from 'react'
import { Order, OrderStatus, OrderTimelineItem, ORDER_STATUS_MAP, Product } from '../types'
```

#### 2. 将 JSX 语法替换为 React.createElement
将 `getStatusIcon` 函数中的 JSX 语法全部替换为 `React.createElement` 调用，与 `lib/cart.ts`、`lib/product.ts` 保持一致：

```typescript
// 修复前
export const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
        case 'shipped':
        case 'delivered':
            return <Truck className="h-4 w-4 text-primary" />
        case 'completed':
            return <CheckCircle2 className="h-4 w-4 text-green-500" />
        ...
    }
}

// 修复后
export const getStatusIcon = (status: OrderStatus): React.ReactNode => {
    switch (status) {
        case 'shipped':
        case 'delivered':
            return React.createElement(Truck, { className: 'h-4 w-4 text-primary' })
        case 'completed':
            return React.createElement(CheckCircle2, { className: 'h-4 w-4 text-green-500' })
        ...
    }
}
```

### 修复的文件
1. `frontend/src/lib/order.ts` - 添加 React 导入，JSX 改为 React.createElement

### 预防措施

在 `lib/` 目录下的纯工具 `.ts` 文件中：
1. **禁止直接使用 JSX 语法**，统一使用 `React.createElement`
2. **使用 React 类型前必须导入** `import React from 'react'`
3. 新增返回 React 节点的函数时，参考 `lib/cart.ts` 和 `lib/product.ts` 中的 `formatSpecsTags` 实现模式

### 验证方法
1. 运行 `tsc --noEmit` 或查看 IDE 诊断，确认 `lib/order.ts` 无类型错误
2. 打开订单列表页（OrdersPage），确认订单状态图标正常显示
3. 执行前端构建 `npm run build`，确认构建成功无报错

---

## Bug: 前端构建失败 - ESLint 依赖新增后 package-lock.json 不同步

### 问题描述
在为项目完善工程化基础设施时，向 `package.json` 的 `devDependencies` 中新增了 ESLint 相关依赖（`@typescript-eslint/eslint-plugin`、`@typescript-eslint/parser`、`eslint-plugin-react-hooks`、`eslint-plugin-react-refresh`、`eslint`），Docker 构建前端镜像时 `npm ci` 报错：

```
npm error `npm ci` can only install packages when your package.json and package-lock.json are in sync.
npm error Missing: @typescript-eslint/eslint-plugin@6.14.0 from lock file
npm error Missing: @typescript-eslint/parser@6.14.0 from lock file
npm error Missing: eslint-plugin-react-hooks@4.6.0 from lock file
npm error Missing: eslint-plugin-react-refresh@0.4.5 from lock file
npm error Missing: eslint@8.55.0 from lock file
```

### 问题根因

**文件**: `frontend/package.json` 和 `frontend/package-lock.json`

**原因**: 修改 `package.json` 新增依赖（或调整依赖版本）后，未同步更新 `package-lock.json`。`npm ci` 严格校验 lockfile 与 `package.json` 的一致性，发现缺失则直接失败，不会自动补全。

本次触发场景：
1. 为前端新增代码检查能力，在 `package.json` 的 `devDependencies` 中新增：
   - `@typescript-eslint/eslint-plugin@^6.14.0`
   - `@typescript-eslint/parser@^6.14.0`
   - `eslint@^8.55.0`
   - `eslint-plugin-react-hooks@^4.6.0`
   - `eslint-plugin-react-refresh@^0.4.5`
2. 新增 `scripts` 命令：`lint`、`lint:fix`、`typecheck`
3. 未同步执行 `npm install` 重新生成 `package-lock.json`

### 修复方案

在 `frontend` 目录下执行 `npm install --package-lock-only` 仅更新锁文件（不下载 node_modules 到本地）：

```bash
cd frontend
npm install --package-lock-only
```

如果本地没有 Node.js 环境，也可以通过 Docker 执行：

```bash
docker run --rm -v "$PWD/frontend:/app" -w /app node:20-alpine npm install --package-lock-only
```

执行后，`package-lock.json` 会被更新，包含所有新增的 ESLint 依赖及其传递依赖（如 `@eslint/eslintrc`、`@typescript-eslint/type-utils`、`@typescript-eslint/utils`、`ajv`、`ignore`、`semver` 等数十个包）。

### 修复的文件
1. `frontend/package-lock.json` - 重新生成，与 `package.json` 完全同步

### 预防措施

**每次修改 `package.json` 后必须同步更新锁文件**，遵循以下工作流：

1. 修改 `package.json`（新增/删除/升级依赖）
2. 立即执行 `npm install`（或 `npm install --package-lock-only`）
3. 用 `git add package.json package-lock.json` 一起提交
4. CI 流水线中加入校验步骤：`npm ci --dry-run`

### 验证方法
1. 本地验证：`cd frontend && npm ci` 执行成功
2. Docker 验证：`docker compose build web` 前端镜像构建成功，`npm ci` 步骤无 `Missing` 错误
3. CI 验证：流水线中 `npm ci` 步骤通过

---

## Bug: FavoritesPage 中 addToCart 调用参数数量不匹配

### 问题描述
TypeScript 编译时报错：`Expected 3-4 arguments, but got 2`，指向 FavoritesPage 中调用 `addToCart(product, 1)` 的位置。

### 问题根因

**文件**: `frontend/src/pages/FavoritesPage.tsx` 和 `frontend/src/contexts/CartContext.tsx`

**原因**: `CartContext` 中 `addToCart` 的函数签名要求至少 3 个参数：

```typescript
// CartContext 定义
addToCart: (product: Product, quantity: number, specs: Record<string, string>, skuId?: number) => Promise<void>
```

而 `FavoritesPage.tsx` 第 266 行调用时只传了 2 个参数：

```typescript
await addToCart(product, 1)
```

第三个参数 `specs`（规格选择）是必填的，不能省略。即使商品没有选择规格，也需要传入空对象 `{}`。

### 修复方案

在 `FavoritesPage.tsx` 中给 `addToCart` 调用补充第三个参数（空规格对象）：

```typescript
// 修复前
await addToCart(product, 1)

// 修复后
await addToCart(product, 1, {})
```

如果商品有默认规格（如第一个 SKU），应传对应的规格对象。当前场景下用户直接从收藏列表加购，未选择规格，传空对象 `{}` 与购物车初始化逻辑兼容。

### 修复的文件
1. `frontend/src/pages/FavoritesPage.tsx` - 补充 `specs: {}` 参数

### 预防措施
1. 添加 ESLint 规则检查函数调用参数数量（TypeScript 本身也会校验）
2. 对可选参数较多的函数，使用选项对象（options object）模式提升可读性

### 验证方法
1. 运行 `tsc --noEmit`，确认无参数不匹配错误
2. 在收藏页面点击加购按钮，确认商品能正常加入购物车

---

## Bug: AuthContext 测试中访问 renderHook 返回的不存在的 container 属性

### 问题描述
TypeScript 编译时报错：`Property 'container' does not exist on type 'RenderHookResult<...>'`，指向 `AuthContext.test.tsx` 中 `const { container } = renderHook(...)`。

### 问题根因

**文件**: `frontend/src/test/AuthContext.test.tsx`

**原因**: 混淆了 `render` 和 `renderHook` 两个测试工具的返回值：

| 函数 | 返回值 | 用途 |
|------|--------|------|
| `render(component)` | `{ container, getByTestId, ... }` | 渲染 React 组件，返回 DOM 查询工具 |
| `renderHook(hook)` | `{ result, rerender, unmount }` | 渲染自定义 Hook，返回 hook 的结果引用 |

测试代码错误地用 `renderHook` 来渲染 `<ProtectedRoute>` 组件，并尝试解构 `container`，但 `renderHook` 的返回类型中根本没有 `container` 属性。

### 修复方案

将 `renderHook` 替换为 `render` 来正确渲染组件，并使用 `screen` 查询 DOM：

```typescript
// 修复前
const { container } = renderHook(
  () => (
    <ProtectedRoute>
      <div data-testid="protected-content">受保护内容</div>
    </ProtectedRoute>
  ),
  { wrapper }
)
expect(true).toBe(true)

// 修复后
render(
  <BrowserRouter>
    <AuthProvider>
      <ProtectedRoute>
        <div data-testid="protected-content">受保护内容</div>
      </ProtectedRoute>
    </AuthProvider>
  </BrowserRouter>
)
expect(screen.getByTestId('protected-content')).toBeInTheDocument()
```

同时在 import 中添加 `render` 和 `screen`：
```typescript
import { renderHook, act, render, screen } from '@testing-library/react'
```

### 修复的文件
1. `frontend/src/test/AuthContext.test.tsx` - 替换 `renderHook` 为 `render`，使用 `screen` 断言

### 预防措施
1. 写测试前明确区分「测试 Hook」还是「测试组件」
2. 测试组件一律用 `render` + `screen` 查询
3. 测试 Hook 一律用 `renderHook` + `result.current`

### 验证方法
1. 运行 `tsc --noEmit`，确认无 `container does not exist` 错误
2. 运行 `npm test`，`AuthContext.test.tsx` 所有测试通过

---

## Bug: CartItem 接口继承 Product 时 id 属性类型不兼容

### 问题描述
TypeScript 编译时报错：`Interface 'CartItem' incorrectly extends interface 'Product'. Types of property 'id' are incompatible. Type 'number | undefined' is not assignable to type 'number'.`

### 问题根因

**文件**: `frontend/src/types.ts`

**原因**: `CartItem` 使用 `extends Product` 继承，但将 `id` 从必填改为可选，违反了接口继承的类型兼容性规则：

```typescript
// Product.id 是必填的 number
interface Product {
  id: number
  // ...
}

// CartItem 试图把 id 改为可选，不兼容
interface CartItem extends Product {
  id?: number  // ❌ 错误：不能将父接口的必填字段改为可选
  quantity: number
  // ...
}
```

**设计背景**：购物车项有两种使用场景
- **服务端返回**：`id` 是购物车记录的 ID（必填）
- **本地新增**：尚未提交到服务器，`id` 可能不存在（可选）

因此 `CartItem.id` 设计为可选是合理的，但不能通过直接继承实现。

### 修复方案

使用 `Omit<Product, 'id'>` 排除冲突字段，再重新定义 `id`：

```typescript
// 修复前
interface CartItem extends Product {
  id?: number
  // ...
}

// 修复后
interface CartItem extends Omit<Product, 'id'> {
  id?: number
  // ...
}
```

`Omit<T, K>` 是 TypeScript 内置工具类型，用于从类型 `T` 中排除键 `K`，然后在子接口中重新定义该属性，避免继承冲突。

### 修复的文件
1. `frontend/src/types.ts` - `CartItem` 改用 `Omit<Product, 'id'>` 继承

### 预防措施
1. 接口继承时，注意不能把父接口的必填字段改为可选
2. 需要「继承但修改某些字段」时，使用 `Omit` / `Pick` 组合模式
3. 类似场景也可以考虑使用交叉类型 `type CartItem = Omit<Product, 'id'> & { id?: number; ... }`

### 验证方法
1. 运行 `tsc --noEmit`，确认无 `incorrectly extends` 错误
2. 打开购物车页面，确认商品列表正常显示
3. 验证购物车增删改操作正常
