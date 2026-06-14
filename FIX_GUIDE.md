# 购物车功能修复指南

## 修复日期
2026-06-14

## 问题清单与修复方案

---

### 问题 1：用户登录后购物车同步，选择"稍后处理"之后就再也没有其他地方可以处理

#### 问题描述
用户登录时弹出购物车同步对话框，如果用户点击"稍后处理"按钮，对话框关闭后没有任何入口可以重新触发同步操作，导致本地购物车商品无法同步到服务端。

#### 根本原因
1. `dismissMergeDialog` 方法在关闭对话框时同时清空了 `pendingLocalCart.current`，导致待合并数据丢失
2. 没有提供手动打开合并对话框的 API
3. 没有追踪"是否有待合并购物车"的状态
4. 购物车页面虽然底部提示"您可以随时在购物车页面手动同步"，但并没有实际的同步按钮

#### 修复方案

**文件：`frontend/src/contexts/CartContext.tsx`**

1. 新增 localStorage 持久化标志 `cart_pending_merge`，用于跨页面/刷新追踪待同步状态
2. 新增状态 `hasPendingMerge` 表示当前是否有待合并的本地购物车
3. 新增方法 `openMergeDialog()` 允许手动打开合并对话框
4. 修改 `dismissMergeDialog()` 不再清空 `pendingLocalCart.current`，只关闭对话框
5. 修改 `mergeLocalCart()` 所有策略（包括 `keep_server`）在成功后：
   - 清空本地购物车 `localItems`
   - 清除 `hasPendingMerge` 状态和持久化标志
   - 清空 `pendingLocalCart.current`
6. 当 `localItems` 变化时自动更新 `hasPendingMerge` 状态

**文件：`frontend/src/pages/CartPage.tsx`**

1. 引入 `GitMerge` 图标
2. 从 `useCart` 解构 `hasPendingMerge`、`openMergeDialog`、`localItemCount`、`isLoading`
3. 在页面标题区域添加同步按钮：
   - 仅当 `isAuthenticated && hasPendingMerge && localItemCount > 0` 时显示
   - 显示本地购物车商品数量
   - 带有呼吸动画吸引用户注意
   - 点击后调用 `openMergeDialog()` 打开合并对话框

**文件：`frontend/src/components/CartMergeDialog.tsx`**

1. 在 `handleSelect` 中添加 try-catch 错误处理
2. 使用 `effectiveLocalCount` 保证显示数量不为负数

---

### 问题 2：点击合并购物车没有反应

#### 问题描述
用户在合并对话框中点击"合并购物车"按钮后，没有任何反应，购物车没有被合并。

#### 根本原因
1. `mergeLocalCart` 方法在 catch 块中只打印了错误日志，没有重新抛出，导致调用方无法感知错误
2. `mergeLocalCart` 没有做空数据校验，如果待合并数据为空，会发送无效请求
3. `keep_server` 策略只关闭对话框，没有清空本地购物车和待合并标志，导致状态不一致
4. 合并成功后只有 `replace` 策略清空了本地购物车，`merge` 策略没有清空，导致本地购物车残留

#### 修复方案

**文件：`frontend/src/contexts/CartContext.tsx`**

修改 `mergeLocalCart()` 方法：

1. **空数据校验**：首先检查 `itemsToMerge.length === 0`，如果为空直接关闭对话框并清除状态
2. **`keep_server` 策略完善**：保留服务端时也需要：
   - 清空本地购物车 `setLocalItems([])`
   - 清除 `hasPendingMerge` 状态和持久化标志
   - 清空 `pendingLocalCart.current`
3. **所有策略统一清空本地**：无论 `merge` 还是 `replace` 策略，成功后都清空 `localItems`，避免数据残留
4. **错误抛出**：在 catch 块中 `throw error`，让调用方可以感知失败并处理
5. **清除所有状态**：合并成功后统一清除 `hasPendingMerge`、持久化标志和 `pendingLocalCart.current`

---

## 核心修复点总结

| 模块 | 变更类型 | 说明 |
|------|----------|------|
| `CartContext.tsx` | 新增 | `hasPendingMerge` 状态 + localStorage 持久化 |
| `CartContext.tsx` | 新增 | `openMergeDialog()` 手动打开对话框方法 |
| `CartContext.tsx` | 修改 | `dismissMergeDialog()` 不再清空待合并数据 |
| `CartContext.tsx` | 修改 | `mergeLocalCart()` 增加空数据校验、错误抛出、状态清理 |
| `CartPage.tsx` | 新增 | 购物车页面顶部同步按钮（待合并时显示） |
| `CartMergeDialog.tsx` | 修改 | 添加错误处理，显示更准确的商品数量 |

---

## 验证步骤

1. **未登录添加商品**：未登录状态下添加几件商品到购物车
2. **登录触发合并对话框**：登录后应自动弹出购物车同步对话框
3. **测试稍后处理**：点击"稍后处理"，对话框关闭
4. **验证手动同步入口**：进入购物车页面，应看到顶部显示"同步本地购物车 (N件)"按钮
5. **测试手动同步**：点击同步按钮，应重新弹出合并对话框
6. **测试合并功能**：
   - 点击"合并购物车"，应成功合并并清空本地购物车
   - 同步按钮应消失
   - 刷新页面后同步按钮不应再出现
7. **测试保留服务端策略**：重复步骤1-4，选择"保留服务端"，应清空本地购物车
