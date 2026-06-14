# FIX_GUIDE — 商品详情页空白及回退首页空白问题

## 问题描述

用户在点击查看商品详情页面时，遇到页面完全空白且无任何内容显示的问题；当用户尝试从空白的商品详情页面回退到首页时，首页同样呈现空白状态；只有在用户手动点击浏览器刷新按钮后，页面内容才恢复正常显示。

---

## 排查过程

### 1. 症状分析

三个关键现象指向同一个根因：

| 现象 | 推论 |
|------|------|
| 商品详情页完全空白（无 loading spinner、无错误提示） | 不是数据加载慢，而是组件树崩溃 |
| 从详情页回退首页也是空白 | 崩溃影响了整棵 React 树，而不仅是当前页面组件 |
| 只有浏览器刷新才恢复 | React 树已死，只有完整重建才能恢复 |

这是 React 18 中**缺少 Error Boundary 时渲染错误导致整棵组件树被卸载**的典型表现。

### 2. 代码审查

逐文件审查后发现以下问题：

#### 问题 A：全局无 Error Boundary

`pages/index.tsx` 中 `<Routes>` 没有被任何 Error Boundary 包裹。React 18 官方文档明确指出：如果渲染过程中抛出未被捕获的错误，React 会卸载整棵组件树，导致页面空白。

#### 问题 B：ProductDetailPage 路由参数变化时未重置状态

```tsx
// 旧代码 — id 变化时只调用 loadProduct，不重置任何状态
useEffect(() => {
    if (id) loadProduct(parseInt(id))
}, [id])
```

当从 `/product/1` 导航到 `/product/2` 时：
- `loading` 仍为 `false`（不会显示加载中）
- `product` 仍为旧商品数据
- `selectedSpecs` 可能与新品不匹配
- `parseInt(id)` 未做 `NaN` 检查

这会导致短暂地用旧商品数据渲染新 URL，或在新商品数据加载失败时显示脏数据。

#### 问题 C：规格渲染中 `typeof null === 'object'` 陷阱

```tsx
// 旧代码 — JavaScript 中 typeof null === 'object' 为 true！
product.specs.map((spec: any) => {
    const specName = typeof spec === 'object' ? spec.name : spec
    //                                                    ↑ 如果 spec 是 null，null.name 抛 TypeError
```

如果后端返回的 `specs` 数组中包含 `null` 元素，`typeof null === 'object'` 为 `true`，然后 `null.name` 抛出 `TypeError: Cannot read properties of null`。此错误发生在渲染阶段，直接导致组件树崩溃。

#### 问题 D：ShopDetailPage mock 数据规格格式错误

```tsx
// 旧代码 — specs 类型为 Record<string, string[]>，而非 ProductSpec[]
specs: { '颜色': ['月岩灰', '暗夜黑'], '配置': ['标准版', 'Pro版'] }
```

`Product` 类型定义 `specs: ProductSpec[] | null`，但 mock 数据用了 `Record<string, string[]>` 格式。当此 mock 数据被传入期望 `ProductSpec[]` 的渲染逻辑时，`spec.name` 和 `spec.values` 都会是 `undefined`，导致渲染崩溃。

#### 问题 E：Context Provider 中 localStorage JSON.parse 无防护

```tsx
// CartContext — 旧代码，JSON.parse 可能抛异常
const parsed = JSON.parse(saved) as CartItem[]

// ThemeContext — 旧代码，同上
return saved ? JSON.parse(saved) : false
```

如果 localStorage 中的数据被篡改或损坏（如浏览器扩展修改、存储配额截断等），`JSON.parse` 会抛出 `SyntaxError`。此异常发生在 `useState` 初始化阶段，会直接导致整个 Context Provider 崩溃，其下所有子组件（即整个应用）无法渲染。

---

## 根本原因分析

**核心根因：应用缺少 Error Boundary，任何未捕获的渲染错误都会导致整棵 React 组件树被卸载，表现为完全空白页面。**

**触发根因的多个路径：**

1. **路径 1**：后端 API 返回的 `specs` 数组含 `null` 元素 → `typeof null === 'object'` 陷阱 → 渲染时 `null.name` 抛 TypeError → 无 Error Boundary → 整棵树崩溃 → 空白页
2. **路径 2**：ShopDetailPage 的 mock 数据 `specs` 格式错误 → 传入渲染逻辑后属性访问失败 → 同上
3. **路径 3**：localStorage 数据损坏 → Context 初始化时 `JSON.parse` 抛异常 → Provider 崩溃 → 子树全部空白
4. **路径 4**：路由参数变化时状态不重置 → 旧数据与新参数不匹配 → 渲染异常

---

## 解决方案

### 修复 1：添加全局 Error Boundary（`pages/index.tsx`）

在 `<Routes>` 外层包裹 `ErrorBoundary` 类组件。当渲染错误发生时，显示友好的错误提示页面（含「重试」和「返回首页」按钮），而非空白页面。

```tsx
class ErrorBoundary extends React.Component<...> {
    static getDerivedStateFromError(error: Error) { ... }
    componentDidCatch(error, errorInfo) { console.error(...) }
    render() {
        if (this.state.hasError) return <FallbackUI />
        return this.props.children
    }
}
```

### 修复 2：ProductDetailPage 状态重置与防御性渲染（`pages/ProductDetailPage.tsx`）

**a) 路由参数变化时完整重置状态：**

```tsx
useEffect(() => {
    setLoading(true)
    setProduct(null)
    setSelectedSpecs({})
    setQuantity(1)
    setSelectedImage(0)
    setRecommended([])
    if (id) {
        const productId = parseInt(id, 10)
        if (!isNaN(productId)) loadProduct(productId)
        else setLoading(false)
    } else {
        setLoading(false)
    }
}, [id])
```

**b) 用防御性工具函数替代内联 `typeof` 检查：**

```tsx
function extractSpecs(specs: ProductSpec[] | null): Record<string, string> {
    if (!specs || !Array.isArray(specs)) return {}
    for (const spec of specs) {
        if (!spec || typeof spec !== 'object') continue   // 跳过 null
        if (!spec.name || !Array.isArray(spec.values)) continue
        // ...
    }
}

function safeSpecEntries(specs: ProductSpec[] | null) {
    return specs
        .filter(spec => spec !== null && typeof spec === 'object' && typeof spec.name === 'string')
        .map(spec => ({
            name: spec.name,
            values: spec.values.filter(v => v != null).map(v => typeof v === 'object' ? v : { value: v })
        }))
}
```

**c) 组件卸载时阻止异步状态更新：**

```tsx
const mountedRef = useRef(true)
useEffect(() => { return () => { mountedRef.current = false } }, [])
// 在每个 async 回调中检查 if (!mountedRef.current) return
```

### 修复 3：ShopDetailPage mock 数据格式纠正（`pages/ShopDetailPage.tsx`）

```tsx
// 旧：specs: { '颜色': ['月岩灰', '暗夜黑'], '配置': ['标准版', 'Pro版'] }
// 新：specs: [{ name: '颜色', values: [{ value: '月岩灰' }, { value: '暗夜黑' }] }, ...]
// 同时补充缺失的 skus: null 和 category_id: null
```

### 修复 4：Context Provider localStorage 解析防护

**CartContext：**

```tsx
const [items, setItems] = useState<CartItem[]>(() => {
    try {
        const saved = localStorage.getItem('cart')
        if (saved) {
            const parsed = JSON.parse(saved) as CartItem[]
            return parsed.map(...)
        }
    } catch {
        localStorage.removeItem('cart')  // 清除损坏数据
    }
    return []
})
```

**ThemeContext：** 同理添加 try/catch。

---

## 修改文件清单

| 文件 | 修改内容 |
|------|----------|
| `frontend/src/pages/index.tsx` | 新增 ErrorBoundary 类组件，包裹 Routes |
| `frontend/src/pages/ProductDetailPage.tsx` | 状态重置、防御性规格解析、mountedRef、移除无用 useAuth 导入 |
| `frontend/src/pages/ShopDetailPage.tsx` | mock 数据 specs 格式纠正 + 补充 skus/category_id |
| `frontend/src/contexts/CartContext.tsx` | localStorage JSON.parse 添加 try/catch |
| `frontend/src/contexts/ThemeContext.tsx` | localStorage JSON.parse 添加 try/catch |

---

## 验证步骤

1. **正常商品详情页加载**：点击首页商品卡片 → 应显示 loading → 正确渲染商品信息
2. **商品间导航**：在商品详情页点击同类推荐商品 → 应先显示 loading → 切换到新商品
3. **浏览器回退**：从商品详情页按浏览器后退 → 首页应正常显示，无空白
4. **无效商品 ID**：访问 `/product/abc` → 应显示「商品不存在」而非空白
5. **不存在的商品 ID**：访问 `/product/9999` → 应显示「商品不存在」
6. **localStorage 损坏场景**：在 DevTools 中将 `localStorage.cart` 改为无效 JSON → 刷新页面 → 应正常显示（购物车为空）而非空白
7. **后端返回异常数据**：如果后端返回 `specs: [null]` → 页面应正常渲染（规格区域不显示）而非空白
8. **Error Boundary 生效**：即使出现未预料的渲染错误，也应显示 Error Boundary 的错误提示页而非完全空白

---

# 修复记录 2：商品规格选择模块不显示

## 问题描述

商品详情页面中用于选择商品属性的规格选择模块（包括但不限于尺寸、颜色、材质等选项）已从页面中消失。商品基本信息（图片、价格、名称、描述等）正常显示，但规格选择区域完全空白，用户无法选择商品规格。

---

## 排查过程

### 1. 症状分析

| 现象 | 推论 |
|------|------|
| 商品基本信息正常显示 | 组件树未崩溃，数据加载成功 |
| 规格选择区域完全空白 | 规格数据解析失败，`specEntries` 为空数组 |
| 无 JavaScript 报错 | 不是语法或类型错误，而是逻辑过滤导致空结果 |

### 2. 代码审查

**前端 `ProductDetailPage.tsx` 中的规格解析逻辑：**

```tsx
const specEntries = useMemo(() => safeSpecEntries(product?.specs ?? null), [product])
```

`safeSpecEntries` 函数的第一行检查：
```tsx
function safeSpecEntries(specs: ProductSpec[] | null): ... {
  if (!specs || !Array.isArray(specs)) return []
  // ...
}
```

**后端数据库模型 `models.py`：**

```python
class Product(Base):
    specs: Mapped[dict | None] = mapped_column(JSON, nullable=True)
```

**后端 seed 数据 `seed.py`：**

```python
Product(
    name="无线蓝牙耳机 Pro Max - 降噪版",
    specs={
        "颜色": ["星空黑", "珍珠白", "玫瑰金"],
        "版本": ["标准版", "降噪版"],
    },
    ...
)
```

**前端类型定义 `types.ts`：**

```tsx
export interface Product {
    specs: ProductSpec[] | null
    // ...
}

export interface ProductSpec {
    name: string
    values: ProductSpecValue[]
}
```

### 3. 数据格式对比

| 来源 | 格式 | 示例 |
|------|------|------|
| 前端 mock 数据 | `ProductSpec[]` | `[{ name: '颜色', values: [{ value: '月岩灰' }] }]` |
| 后端实际返回 | `Record<string, string[]>` | `{ '颜色': ['星空黑', '珍珠白'], '版本': ['标准版', '降噪版'] }` |

前端 `safeSpecEntries` 函数期望 `Array.isArray(specs)` 为 `true`，但后端返回的是 `object`，因此函数直接返回空数组 `[]`，导致规格模块不渲染。

---

## 根本原因分析

**前后端规格数据格式不匹配**：

1. **后端存储格式**：`specs` 字段为 `JSON` 类型，实际存储为 `Record<string, string[]>`（键值对格式）
2. **前端期望格式**：`ProductSpec[]` 数组格式（`[{ name: string, values: { value: string }[] }]`）
3. **转换函数缺失**：`safeSpecEntries` 和 `extractSpecs` 函数仅处理数组格式，遇到对象格式时直接返回空结果

**触发条件**：
- 当前端通过 API 从后端获取商品数据时，返回的 `specs` 是对象格式
- `safeSpecEntries` 检查 `Array.isArray(specs)` → `false` → 返回空数组
- `specEntries.map()` 空数组无渲染输出 → 规格模块看似"消失"

---

## 解决方案

### 修复 1：扩展 `Product` 类型定义（`types.ts`）

使 `specs` 字段同时接受两种格式：

```tsx
// 旧：specs: ProductSpec[] | null
// 新：specs: ProductSpec[] | Record<string, string[]> | null
```

### 修复 2：更新 `safeSpecEntries` 函数（`ProductDetailPage.tsx`）

增加对 `Record<string, string[]>` 格式的处理：

```tsx
function safeSpecEntries(specs: ProductSpec[] | Record<string, string[]> | null) {
  if (!specs) return []
  const result = []
  
  if (Array.isArray(specs)) {
    // 原有数组格式处理逻辑
    for (const spec of specs) { ... }
  } else if (typeof specs === 'object') {
    // 新增对象格式处理逻辑
    for (const [name, values] of Object.entries(specs)) {
      if (!Array.isArray(values)) continue
      const cleanedValues = values
        .filter(v => typeof v === 'string')
        .map(v => ({ value: v }))
      if (cleanedValues.length > 0) {
        result.push({ name, values: cleanedValues })
      }
    }
  }
  return result
}
```

### 修复 3：同步更新 `extractSpecs` 函数（`ProductDetailPage.tsx`）

同样增加对对象格式的支持：

```tsx
function extractSpecs(specs: ProductSpec[] | Record<string, string[]> | null) {
  if (!specs) return {}
  const result = {}
  
  if (Array.isArray(specs)) {
    // 原有数组格式处理
  } else if (typeof specs === 'object') {
    // 新增对象格式处理
    for (const [name, values] of Object.entries(specs)) {
      if (Array.isArray(values) && values.length > 0) {
        result[name] = values[0]
      }
    }
  }
  return result
}
```

---

## 修改文件清单

| 文件 | 修改内容 |
|------|----------|
| `frontend/src/types.ts` | `Product.specs` 类型扩展为 `ProductSpec[] \| Record<string, string[]> \| null` |
| `frontend/src/pages/ProductDetailPage.tsx` | `extractSpecs` 和 `safeSpecEntries` 函数增加对象格式处理 |

---

## 验证步骤

1. **后端数据规格显示**：访问从后端 API 返回数据的商品详情页 → 规格选择模块应正常显示
2. **规格选择功能**：点击不同规格选项 → 选中状态正确切换，价格和库存正确更新
3. **mock 数据兼容**：使用前端 mock 数据的商品 → 规格选择模块仍正常显示
4. **加购功能**：选择规格后点击「加入购物车」→ 购物车中商品应正确显示已选规格标签
5. **规格数据为空**：访问无规格的商品 → 规格区域不显示，页面其他部分正常
6. **跨商品导航**：从一个商品导航到另一商品 → 规格选项正确切换为对应商品的规格
