import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { Product, Shop, ChatMessage, Category, LoginCredentials, RegisterCredentials, AuthResponse, User, Order, OrderCreate, ServerCart, CartMergeRequest, ShopFollowStatus, ShopFollow } from './types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8876'
const TOKEN_KEY = 'token'

export const api = axios.create({
    baseURL: `${API_BASE_URL}/api`,
    headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem(TOKEN_KEY)
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => Promise.reject(error)
)

let authLogoutHandler: (() => void) | null = null

export const setAuthLogoutHandler = (handler: (() => void) | null) => {
    authLogoutHandler = handler
}

api.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        if (error.response?.status === 401) {
            localStorage.removeItem(TOKEN_KEY)
            localStorage.removeItem('user')
            authLogoutHandler?.()
        }
        return Promise.reject(error)
    }
)

export interface UpdateProfileData {
    nickname?: string
    email?: string
    username?: string
}

export const authApi = {
    login: (credentials: LoginCredentials) =>
        api.post<AuthResponse>('/auth/login', credentials),

    register: (credentials: RegisterCredentials) =>
        api.post<AuthResponse>('/auth/register', credentials),

    getCurrentUser: () =>
        api.get<User>('/auth/me'),

    updateProfile: (data: UpdateProfileData) =>
        api.put<User>('/auth/me', data),
}

export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const setToken = (token: string) => localStorage.setItem(TOKEN_KEY, token)
export const removeToken = () => localStorage.removeItem(TOKEN_KEY)

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
        const tasks: Promise<void>[] = []
        if (categoryId != null) {
            tasks.push(fetchAndMerge(() => productApi.getAll(categoryId), 0))
        }
        tasks.push(fetchAndMerge(() => shopApi.getProducts(shopId), 1))
        await Promise.all(tasks)
        results.sort((a, b) => ((a as any)._priority ?? 0) - ((b as any)._priority ?? 0))
        return results.map(({ _priority, ...rest }: any) => rest)
    },
}

export const shopApi = {
    getById: (id: number) => api.get<Shop>(`/shops/${id}`),
    getProducts: (id: number) => api.get<Product[]>(`/shops/${id}/products`),
    getFollowStatus: (id: number) => api.get<ShopFollowStatus>(`/shops/${id}/follow-status`),
    follow: (id: number) => api.post<ShopFollowStatus>(`/shops/${id}/follow`),
    unfollow: (id: number) => api.delete<ShopFollowStatus>(`/shops/${id}/follow`),
}

export const userApi = {
    getFollowedShops: () => api.get<ShopFollow[]>('/user/followed-shops'),
}

export const chatApi = {
    getMessages: (shopId: number) => api.get<ChatMessage[]>(`/chat/${shopId}`),
    sendMessage: (shopId: number, content: string, sender: string = 'buyer', clientId?: string) =>
        api.post<ChatMessage>(`/chat/${shopId}`, { content, sender, client_id: clientId }),
}

export const orderApi = {
    create: (data: OrderCreate) =>
        api.post<Order>('/orders', data),

    getMyOrders: () =>
        api.get<Order[]>('/orders'),

    getById: (orderId: number) =>
        api.get<Order>(`/orders/${orderId}`),

    cancel: (orderId: number) =>
        api.put<Order>(`/orders/${orderId}/cancel`),

    pay: (orderId: number) =>
        api.put<Order>(`/orders/${orderId}/pay`),

    ship: (orderId: number) =>
        api.put<Order>(`/orders/${orderId}/ship`),

    receive: (orderId: number) =>
        api.put<Order>(`/orders/${orderId}/receive`),

    complete: (orderId: number) =>
        api.put<Order>(`/orders/${orderId}/complete`),
}

export const cartApi = {
    getCart: () =>
        api.get<ServerCart>('/cart'),

    addItem: (productId: number, quantity: number, specs?: Record<string, string>, skuId?: number) =>
        api.post<ServerCart>('/cart/items', { product_id: productId, quantity, specs, sku_id: skuId }),

    updateItem: (itemId: number, quantity: number) =>
        api.put<ServerCart>(`/cart/items/${itemId}`, { quantity }),

    removeItem: (itemId: number) =>
        api.delete<ServerCart>(`/cart/items/${itemId}`),

    clear: () =>
        api.delete<ServerCart>('/cart/clear'),

    merge: (data: CartMergeRequest) =>
        api.post<ServerCart>('/cart/merge', data),
}
