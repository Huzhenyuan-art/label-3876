# FIX_GUIDE

---

## 首页商品加载异常 & 登录请求异常

### 问题描述

进入首页商品加载异常（一直转圈或显示 fallback mock 数据），进入登录页面点击登录同样报错，所有 API 请求均无法正常工作。

### 根因分析

在认证体系重构过程中，`API_BASE_URL` 的默认值被错误地修改为空字符串：

```typescript
// 错误代码 — 默认值为空字符串，导致请求发到前端自身域名
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''
```

当 `VITE_API_BASE_URL` 环境变量未设置时，`API_BASE_URL` 为空字符串，axios 的 `baseURL` 变成 `/api`，所有请求被发送到前端开发服务器域名（如 `http://localhost:3876/api/...`）而非后端 API 服务 `http://localhost:8876/api/...`，导致全部请求 404 或 CORS 失败。

### 修复方案

将 `API_BASE_URL` 的 fallback 默认值恢复为 `'http://localhost:8876'`：

```typescript
// 修复后
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8876'
```

### 修复涉及文件

| 文件 | 改动 |
|------|------|
| `frontend/src/api.ts` | 第 4 行：`''` → `'http://localhost:8876'` |
| `frontend/src/lib/api.ts` | 第 4 行：`''` → `'http://localhost:8876'` |

### 预防措施

- 修改 API 基础配置时务必检查 fallback 默认值
- 可在 `vite.config.ts` 中通过 `define` 注入默认值，避免多处硬编码

---

# FIX_GUIDE — 同类推荐未按分类过滤

## 问题描述

商品详情页底部「同类推荐」区块展示了全部商品，未按 `category_id` 过滤，导致不同品类的商品混在一起，分不清推荐依据。

## 根因分析

共发现 **3 个关联问题**：

### 1. 推荐加载时机错误 — 使用 MOCK_PRODUCTS 而非真实商品数据

**文件**: `frontend/src/pages/ProductDetailPage.tsx`

`loadRecommended` 从 `MOCK_PRODUCTS` 中查找当前商品的 `category_id`，但 MOCK_PRODUCTS 中未设置 `category_id` 字段，导致 `catId` 始终为 `null`。

```typescript
// 修复前 — 从 MOCK 取 category_id，永远拿到 null
const current = MOCK_PRODUCTS.find(p => p.id === productId)
const catId = current?.category_id ?? null   // ← null
```

**修复**: 将 `loadRecommended` 改为在 `loadProduct` 成功后调用，直接使用 API 返回的真实 `category_id` 和 `shop_id`。

```typescript
// 修复后 — loadProduct 成功后用真实数据触发推荐
const p = response.data
loadRecommended(p.category_id, p.shop_id, productId)
```

### 2. productApi.getRecommended 在 categoryId 为 null 时拉取全量商品

**文件**: `frontend/src/api.ts`

当 `categoryId` 为 `null` 时，`categoryId ?? undefined` 变为 `undefined`，而 `productApi.getAll(undefined)` 不带分类参数，返回所有商品。

```typescript
// 修复前 — null → undefined → 请求全量
fetchAndMerge(() => productApi.getAll(categoryId ?? undefined), 0)
```

**修复**: 当 `categoryId` 为 `null` 时，跳过分类维度查询，仅使用同店铺维度。

```typescript
// 修复后 — categoryId 有值才查分类维度
if (categoryId != null) {
    tasks.push(fetchAndMerge(() => productApi.getAll(categoryId), 0))
}
tasks.push(fetchAndMerge(() => shopApi.getProducts(shopId), 1))
```

### 3. Mock 回退数据未按分类过滤

**文件**: `frontend/src/pages/ProductDetailPage.tsx`

API 请求失败时，回退数据 `MOCK_PRODUCTS.filter(p => p.id !== productId)` 仅排除了当前商品，未按 `category_id` 或 `shop_id` 过滤。

```typescript
// 修复前 — 回退显示全部
setRecommended(MOCK_PRODUCTS.filter(p => p.id !== productId))
```

**修复**: 回退数据同样按 `category_id`（优先）或 `shop_id` 过滤。

```typescript
// 修复后 — 回退也按分类/店铺过滤
const fallback = MOCK_PRODUCTS.filter(p => p.id !== productId)
setRecommended(catId != null
    ? fallback.filter(p => p.category_id === catId)
    : fallback.filter(p => p.shop_id === shopId))
```

## 修复涉及文件

| 文件 | 改动要点 |
|------|----------|
| `frontend/src/api.ts` | `getRecommended` 增加 `categoryId != null` 判断，避免无分类时全量拉取 |
| `frontend/src/pages/ProductDetailPage.tsx` | `loadRecommended` 改为接收 `catId/shopId` 参数，由 `loadProduct` 成功后传入真实值；回退数据增加分类/店铺过滤 |

## 推荐优先级逻辑（修复后）

1. **同 category_id 商品**（priority=0，最高优先级，排在前）
2. **同 shop_id 但不同 category_id 商品**（priority=1，补充展示）
3. 去重：同商品仅出现一次
4. 排除当前商品
