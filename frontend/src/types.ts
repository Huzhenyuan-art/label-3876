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
    specs: Record<string, string[]> | null
    shop_id: number
    category_id: number | null
    shop?: Shop
    category?: Category
    created_at: string
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

export interface CartItem extends Product {
    quantity: number
    selectedSpecs?: Record<string, string>
    selected?: boolean
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
