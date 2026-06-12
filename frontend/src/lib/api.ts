import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8876'

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
})

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
}

export const productApi = {
  getAll: () => api.get<Product[]>('/products'),
  getById: (id: number) => api.get<Product>(`/products/${id}`),
}

export const shopApi = {
  getById: (id: number) => api.get<Shop>(`/shops/${id}`),
  getProducts: (id: number) => api.get<Product[]>(`/shops/${id}/products`),
}

export const chatApi = {
  getMessages: (shopId: number) => api.get<ChatMessage[]>(`/chat/${shopId}`),
  sendMessage: (shopId: number, content: string, sender: string = 'buyer') =>
    api.post<ChatMessage>(`/chat/${shopId}`, { content, sender }),
}
