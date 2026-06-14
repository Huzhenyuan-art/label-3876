import type { Product, Shop, User, Category, Order, OrderItem } from '../types'

export const mockCategory: Category = {
  id: 1,
  name: '智能数码',
  icon: '📱',
  description: '智能数码产品',
  sort_order: 1,
  created_at: '2024-01-01T00:00:00Z',
}

export const mockShop: Shop = {
  id: 1,
  name: '潮流数码旗舰店',
  logo: 'https://example.com/shop.jpg',
  description: '专注高品质数码产品',
  rating: 4.8,
  follower_count: 12580,
  created_at: '2024-01-01T00:00:00Z',
}

export const mockProduct1: Product = {
  id: 1,
  name: '无线蓝牙耳机',
  description: '主动降噪，超长续航',
  price: 299,
  original_price: 599,
  stock: 100,
  sales: 50,
  main_image: 'https://example.com/product1.jpg',
  images: { gallery: ['https://example.com/product1.jpg'] },
  specs: { 颜色: ['黑色', '白色'], 版本: ['标准版', '降噪版'] } as any,
  skus: null,
  shop_id: 1,
  category_id: 1,
  shop: mockShop,
  category: mockCategory,
  created_at: '2024-01-01T00:00:00Z',
}

export const mockProduct2: Product = {
  id: 2,
  name: '智能手表',
  description: '健康监测，运动追踪',
  price: 1299,
  original_price: 1899,
  stock: 50,
  sales: 30,
  main_image: 'https://example.com/product2.jpg',
  images: { gallery: ['https://example.com/product2.jpg'] },
  specs: { 颜色: ['黑色', '银色'] } as any,
  skus: null,
  shop_id: 1,
  category_id: 1,
  shop: mockShop,
  category: mockCategory,
  created_at: '2024-01-01T00:00:00Z',
}

export const mockUser: User = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  avatar: 'https://example.com/avatar.jpg',
  nickname: '测试用户',
  created_at: '2024-01-01T00:00:00Z',
}

export const mockAuthResponse = {
  access_token: 'mock-access-token-12345',
  token_type: 'bearer',
  user: mockUser,
}

export const mockOrderItem: OrderItem = {
  id: 1,
  order_id: 1,
  product_id: 1,
  product_name: '无线蓝牙耳机',
  product_image: 'https://example.com/product1.jpg',
  price: 299,
  quantity: 2,
  specs: { 颜色: '黑色' },
  created_at: '2024-01-01T00:00:00Z',
}

export const mockOrder: Order = {
  id: 1,
  order_no: 'ORD-20240101120000-ABC12345',
  user_id: 1,
  status: 'pending',
  total_amount: 598,
  shipping_address: '北京市朝阳区建国路88号',
  contact_name: '张三',
  contact_phone: '13800138000',
  payment_method: '支付宝',
  shipping_method: '顺丰特快',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  items: [mockOrderItem],
}

export const createMockProducts = (count: number): Product[] => {
  return Array.from({ length: count }, (_, i) => ({
    ...mockProduct1,
    id: i + 1,
    name: `商品${i + 1}`,
    price: 99 + i * 10,
    stock: 100 - i * 5,
  }))
}
