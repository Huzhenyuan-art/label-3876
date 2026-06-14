export interface Category {
    id: number
    name: string
    icon: string
    description: string
    sort_order: number
    created_at: string
}

export interface Shop {
    id: number
    name: string
    logo: string
    description: string
    rating: number
    follower_count: number
    created_at: string
}

export interface ProductSpecValue {
    id?: number
    value: string
    image?: string
}

export interface ProductSpec {
    id?: number
    name: string
    values: ProductSpecValue[]
}

export interface Sku {
    id: number
    sku_code?: string
    specs: Record<string, string>
    price: number
    original_price?: number | null
    stock: number
    image?: string
}

export interface Product {
    id: number
    name: string
    description: string
    price: number
    original_price: number | null
    stock: number
    sales: number
    main_image: string
    images: { gallery?: string[] } | null
    specs: ProductSpec[] | Record<string, string[]> | null
    skus: Sku[] | null
    shop_id: number
    category_id: number | null
    shop?: Shop
    category?: Category
    created_at: string
}

export const findSkuBySpecs = (product: Product, specs: Record<string, string>): Sku | undefined => {
    if (!product.skus) return undefined
    return product.skus.find(sku => {
        return Object.entries(specs).every(([key, value]) => sku.specs[key] === value)
    })
}

export const LOW_STOCK_THRESHOLD = 20

export const getProductPriceAndStock = (product: Product, specs: Record<string, string>): { price: number; original_price: number | null; stock: number; skuId?: number } => {
    const sku = findSkuBySpecs(product, specs)
    if (sku) {
        return { price: sku.price, original_price: sku.original_price ?? product.original_price, stock: sku.stock, skuId: sku.id }
    }
    return { price: product.price, original_price: product.original_price, stock: product.stock }
}

export const calculateDiscount = (price: number, originalPrice: number | null): number | null => {
    if (!originalPrice || originalPrice <= price || originalPrice <= 0) return null
    const discount = (price / originalPrice) * 10
    return Math.round(discount * 10) / 10
}

export interface ChatMessage {
    id: number
    shop_id: number
    sender: string
    content: string
    msg_type: string
    created_at: string
    status?: 'sending' | 'sent' | 'failed'
    client_id?: string
}

export interface User {
    id: number
    username: string
    email: string
    avatar: string
    nickname: string
    created_at: string
}

export interface LoginCredentials {
    username: string
    password: string
}

export interface RegisterCredentials {
    username: string
    email: string
    password: string
    nickname?: string
}

export interface AuthResponse {
    access_token: string
    token_type: string
    user: User
}

export interface CartItem extends Omit<Product, 'id'> {
    id?: number
    quantity: number
    selectedSpecs: Record<string, string>
    skuId?: number
    selected?: boolean
}

export interface ServerCartItem {
    id: number
    cart_id: number
    product_id: number
    quantity: number
    specs: Record<string, string> | null
    sku_id: number | null
    created_at: string
    updated_at: string
    product: Product
}

export interface ServerCart {
    id: number
    user_id: number
    created_at: string
    updated_at: string
    items: ServerCartItem[]
}

export type MergeStrategy = 'merge' | 'replace' | 'keep_server'

export interface CartMergeRequest {
    items: Array<{
        product_id: number
        quantity: number
        specs: Record<string, string> | null
        sku_id: number | null
    }>
    merge_strategy: MergeStrategy
}

export interface OrderItem {
    id: number
    order_id: number
    product_id: number
    product_name: string
    product_image: string
    price: number
    quantity: number
    specs: Record<string, string> | null
    created_at: string
}

export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'completed' | 'cancelled'

export const ORDER_STATUS_MAP: Record<OrderStatus, string> = {
    pending: '待支付',
    paid: '待发货',
    shipped: '待收货',
    delivered: '已送达',
    completed: '已完成',
    cancelled: '已取消'
}

export interface Order {
    id: number
    order_no: string
    user_id: number
    status: OrderStatus
    total_amount: number
    shipping_address: string
    contact_name: string
    contact_phone: string
    payment_method: string
    shipping_method: string
    created_at: string
    updated_at: string
    items: OrderItem[]
}

export interface OrderItemCreate {
    product_id: number
    product_name: string
    product_image?: string
    price: number
    quantity: number
    specs?: Record<string, string> | null
}

export interface OrderCreate {
    items: OrderItemCreate[]
    shipping_address?: string
    contact_name?: string
    contact_phone?: string
    payment_method?: string
    shipping_method?: string
}

export interface OrderTimelineItem {
    status: string
    time: string
    desc: string
    active: boolean
}

export interface ShopFollowStatus {
    is_following: boolean
    follower_count: number
}

export interface ShopFollow {
    id: number
    user_id: number
    shop_id: number
    created_at: string
    shop: Shop
}
