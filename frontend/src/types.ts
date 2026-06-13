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
