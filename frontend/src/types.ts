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
    shop?: Shop
    created_at: string
}

export interface ChatMessage {
    id: number
    shop_id: number
    sender: string
    content: string
    msg_type: string
    created_at: string
}

export interface User {
    id: number
    username: string
    email: string
    avatar: string
    nickname: string
}

export interface CartItem extends Product {
    quantity: number
    selectedSpecs?: Record<string, string>
}
