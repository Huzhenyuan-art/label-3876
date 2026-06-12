import axios from 'axios'
import { Product, Shop, ChatMessage } from './types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8876'

export const api = axios.create({
    baseURL: `${API_BASE_URL}/api`,
    headers: { 'Content-Type': 'application/json' },
})

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
