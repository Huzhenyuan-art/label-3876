import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8876'

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
})

export interface Category {
  id: number
  name: string
  icon: string
  description: string
  sort_order: number
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

export interface Shop {
  id: number
  name: string
  logo: string
  description: string
  rating: number
  follower_count: number
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

export const categoryApi = {
  getAll: () => api.get<Category[]>('/categories'),
  getById: (id: number) => api.get<Category>(`/categories/${id}`),
}

export const productApi = {
  getAll: (categoryId?: number) => api.get<Product[]>('/products', { params: { category_id: categoryId } }),
  getById: (id: number) => api.get<Product>(`/products/${id}`),
}

export const shopApi = {
  getById: (id: number) => api.get<Shop>(`/shops/${id}`),
  getProducts: (id: number) => api.get<Product[]>(`/shops/${id}/products`),
}

export const chatApi = {
  getMessages: (shopId: number) => api.get<ChatMessage[]>(`/chat/${shopId}`),
  sendMessage: (shopId: number, content: string, sender: string = 'buyer', clientId?: string) =>
    api.post<ChatMessage>(`/chat/${shopId}`, { content, sender, client_id: clientId }),
}
