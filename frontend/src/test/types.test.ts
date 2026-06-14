import { describe, it, expect } from 'vitest'
import {
  findSkuBySpecs,
  getProductPriceAndStock,
  calculateDiscount,
  LOW_STOCK_THRESHOLD,
  ORDER_STATUS_MAP,
} from '../types'
import type { Product, Sku, OrderStatus } from '../types'
import { mockProduct1 } from './mocks'

describe('类型工具函数 - 商品价格与库存计算', () => {
  const mockSkus: Sku[] = [
    {
      id: 1,
      sku_code: 'SKU001',
      specs: { 颜色: '黑色', 版本: '标准版' },
      price: 199,
      original_price: 299,
      stock: 50,
    },
    {
      id: 2,
      sku_code: 'SKU002',
      specs: { 颜色: '白色', 版本: '标准版' },
      price: 199,
      original_price: 299,
      stock: 30,
    },
    {
      id: 3,
      sku_code: 'SKU003',
      specs: { 颜色: '黑色', 版本: '降噪版' },
      price: 299,
      original_price: 599,
      stock: 10,
    },
  ]

  const productWithSkus: Product = {
    ...mockProduct1,
    skus: mockSkus,
    price: 199,
    original_price: 299,
    stock: 100,
  }

  describe('findSkuBySpecs', () => {
    it('可以根据规格找到对应的 SKU', () => {
      const sku = findSkuBySpecs(productWithSkus, { 颜色: '黑色', 版本: '降噪版' })
      expect(sku).not.toBeUndefined()
      expect(sku?.id).toBe(3)
      expect(sku?.price).toBe(299)
    })

    it('规格不匹配时返回 undefined', () => {
      const sku = findSkuBySpecs(productWithSkus, { 颜色: '红色', 版本: '标准版' })
      expect(sku).toBeUndefined()
    })

    it('部分规格匹配时返回 undefined', () => {
      const sku = findSkuBySpecs(productWithSkus, { 颜色: '黑色' })
      expect(sku).toBeUndefined()
    })

    it('没有 SKU 的商品返回 undefined', () => {
      const sku = findSkuBySpecs(mockProduct1, { 颜色: '黑色' })
      expect(sku).toBeUndefined()
    })
  })

  describe('getProductPriceAndStock', () => {
    it('有 SKU 时返回 SKU 的价格和库存', () => {
      const result = getProductPriceAndStock(productWithSkus, { 颜色: '黑色', 版本: '降噪版' })
      expect(result.price).toBe(299)
      expect(result.original_price).toBe(599)
      expect(result.stock).toBe(10)
      expect(result.skuId).toBe(3)
    })

    it('没有匹配的 SKU 时返回商品默认价格和库存', () => {
      const result = getProductPriceAndStock(productWithSkus, { 颜色: '不存在的颜色' })
      expect(result.price).toBe(199)
      expect(result.original_price).toBe(299)
      expect(result.stock).toBe(100)
      expect(result.skuId).toBeUndefined()
    })

    it('没有 SKU 的商品返回默认价格和库存', () => {
      const result = getProductPriceAndStock(mockProduct1, {})
      expect(result.price).toBe(mockProduct1.price)
      expect(result.original_price).toBe(mockProduct1.original_price)
      expect(result.stock).toBe(mockProduct1.stock)
    })
  })

  describe('calculateDiscount', () => {
    it('正确计算折扣', () => {
      const discount = calculateDiscount(299, 599)
      expect(discount).toBe(5.0)
    })

    it('原价小于等于现价时返回 null', () => {
      expect(calculateDiscount(299, 299)).toBeNull()
      expect(calculateDiscount(399, 299)).toBeNull()
    })

    it('原价为 null 时返回 null', () => {
      expect(calculateDiscount(299, null)).toBeNull()
    })

    it('原价为 0 时返回 null', () => {
      expect(calculateDiscount(299, 0)).toBeNull()
    })

    it('折扣保留一位小数', () => {
      const discount = calculateDiscount(99, 199)
      expect(discount).toBeCloseTo(5.0, 1)
    })
  })

  describe('LOW_STOCK_THRESHOLD', () => {
    it('低库存阈值为 20', () => {
      expect(LOW_STOCK_THRESHOLD).toBe(20)
    })
  })
})

describe('订单状态映射', () => {
  it('所有订单状态都有对应的中文显示', () => {
    const statuses: OrderStatus[] = ['pending', 'paid', 'shipped', 'delivered', 'completed', 'cancelled']
    
    statuses.forEach((status) => {
      expect(ORDER_STATUS_MAP[status]).toBeDefined()
      expect(typeof ORDER_STATUS_MAP[status]).toBe('string')
      expect(ORDER_STATUS_MAP[status].length).toBeGreaterThan(0)
    })
  })

  it('各状态显示文本正确', () => {
    expect(ORDER_STATUS_MAP.pending).toBe('待支付')
    expect(ORDER_STATUS_MAP.paid).toBe('待发货')
    expect(ORDER_STATUS_MAP.shipped).toBe('待收货')
    expect(ORDER_STATUS_MAP.delivered).toBe('已送达')
    expect(ORDER_STATUS_MAP.completed).toBe('已完成')
    expect(ORDER_STATUS_MAP.cancelled).toBe('已取消')
  })
})
