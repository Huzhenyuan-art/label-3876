import axios from 'axios'
import { Product, Shop, ChatMessage, Category } from './types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8876'

export const api = axios.create({
    baseURL: `${API_BASE_URL}/api`,
    headers: { 'Content-Type': 'application/json' },
})

export const categoryApi = {
    getAll: () => api.get<Category[]>('/categories'),
    getById: (id: number) => api.get<Category>(`/categories/${id}`),
}

export const productApi = {
    getAll: (categoryId?: number) => api.get<Product[]>('/products', { params: { category_id: categoryId } }),
    getById: (id: number) => api.get<Product>(`/products/${id}`),
    getRecommended: async (categoryId: number | null, shopId: number, excludeId: number): Promise<Product[]> => {
        const results: Product[] = []
        const seen = new Set<number>()
        const fetchAndMerge = async (fetcher: () => Promise<{ data: Product[] }>, priority: number) => {
            try {
                const { data } = await fetcher()
                for (const p of data) {
                    if (p.id !== excludeId && !seen.has(p.id)) {
                        seen.add(p.id)
                        results.push({ ...p, _priority: priority } as Product & { _priority: number })
                    }
                }
            } catch { /* fallback to empty */ }
        }
        await Promise.all([
            fetchAndMerge(() => productApi.getAll(categoryId ?? undefined), 0),
            fetchAndMerge(() => shopApi.getProducts(shopId), 1),
        ])
        results.sort((a, b) => ((a as any)._priority ?? 0) - ((b as any)._priority ?? 0))
        return results.map(({ _priority, ...rest }: any) => rest)
    },
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
