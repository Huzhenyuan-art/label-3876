import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { CartProvider, useCart } from '../contexts/CartContext'
import { AuthProvider } from '../contexts/AuthContext'
import { mockProduct1, mockProduct2, mockAuthResponse } from './mocks'
import type { Product } from '../types'
import React from 'react'
import * as apiModule from '../api'

vi.mock('../api', () => ({
  api: {
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
  setAuthLogoutHandler: vi.fn(),
  authApi: {
    login: vi.fn(),
    register: vi.fn(),
    getCurrentUser: vi.fn(),
    updateProfile: vi.fn(),
  },
  cartApi: {
    getCart: vi.fn(),
    addItem: vi.fn(),
    updateItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    merge: vi.fn(),
  },
  getToken: vi.fn(),
  setToken: vi.fn(),
  removeToken: vi.fn(),
}))

const createWrapper = () => {
  return ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>
      <CartProvider>{children}</CartProvider>
    </AuthProvider>
  )
}

describe('CartContext - 购物车联动（本地模式）', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('未登录时初始购物车为空', () => {
    const Wrapper = createWrapper()
    const { result } = renderHook(() => useCart(), { wrapper: Wrapper })

    expect(result.current.items).toEqual([])
    expect(result.current.totalItems).toBe(0)
    expect(result.current.totalPrice).toBe(0)
    expect(result.current.isLoading).toBe(false)
  })

  it('未登录时可以添加商品到本地购物车', () => {
    const Wrapper = createWrapper()
    const { result } = renderHook(() => useCart(), { wrapper: Wrapper })

    act(() => {
      result.current.addToCart(mockProduct1 as Product, 2, { 颜色: '黑色' })
    })

    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0].id).toBe(mockProduct1.id)
    expect(result.current.items[0].quantity).toBe(2)
    expect(result.current.totalItems).toBe(2)
    expect(result.current.totalPrice).toBe(mockProduct1.price * 2)
  })

  it('未登录时添加相同商品会累加数量', () => {
    const Wrapper = createWrapper()
    const { result } = renderHook(() => useCart(), { wrapper: Wrapper })

    act(() => {
      result.current.addToCart(mockProduct1 as Product, 2, { 颜色: '黑色' })
    })
    act(() => {
      result.current.addToCart(mockProduct1 as Product, 3, { 颜色: '黑色' })
    })

    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0].quantity).toBe(5)
    expect(result.current.totalItems).toBe(5)
  })

  it('不同规格的同一商品算作不同条目', () => {
    const Wrapper = createWrapper()
    const { result } = renderHook(() => useCart(), { wrapper: Wrapper })

    act(() => {
      result.current.addToCart(mockProduct1 as Product, 1, { 颜色: '黑色' })
    })
    act(() => {
      result.current.addToCart(mockProduct1 as Product, 2, { 颜色: '白色' })
    })

    expect(result.current.items).toHaveLength(2)
    expect(result.current.totalItems).toBe(3)
  })

  it('未登录时可以更新商品数量', () => {
    const Wrapper = createWrapper()
    const { result } = renderHook(() => useCart(), { wrapper: Wrapper })

    act(() => {
      result.current.addToCart(mockProduct1 as Product, 2, { 颜色: '黑色' })
    })

    act(() => {
      result.current.updateQuantity(mockProduct1.id, 5, { 颜色: '黑色' })
    })

    expect(result.current.items[0].quantity).toBe(5)
    expect(result.current.totalPrice).toBe(mockProduct1.price * 5)
  })

  it('未登录时可以移除商品', () => {
    const Wrapper = createWrapper()
    const { result } = renderHook(() => useCart(), { wrapper: Wrapper })

    act(() => {
      result.current.addToCart(mockProduct1 as Product, 1, { 颜色: '黑色' })
      result.current.addToCart(mockProduct2 as Product, 2, {})
    })
    expect(result.current.items).toHaveLength(2)

    act(() => {
      result.current.removeFromCart(mockProduct1.id, { 颜色: '黑色' })
    })

    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0].id).toBe(mockProduct2.id)
  })

  it('未登录时可以清空购物车', () => {
    const Wrapper = createWrapper()
    const { result } = renderHook(() => useCart(), { wrapper: Wrapper })

    act(() => {
      result.current.addToCart(mockProduct1 as Product, 1, {})
      result.current.addToCart(mockProduct2 as Product, 2, {})
    })
    expect(result.current.items).toHaveLength(2)

    act(() => {
      result.current.clearCart()
    })

    expect(result.current.items).toHaveLength(0)
    expect(result.current.totalItems).toBe(0)
    expect(result.current.totalPrice).toBe(0)
  })

  it('本地购物车数据持久化到 localStorage', () => {
    const Wrapper = createWrapper()
    const { result, unmount } = renderHook(() => useCart(), { wrapper: Wrapper })

    act(() => {
      result.current.addToCart(mockProduct1 as Product, 2, { 颜色: '黑色' })
    })

    unmount()

    const stored = localStorage.getItem('cart')
    expect(stored).not.toBeNull()
    const parsed = JSON.parse(stored!)
    expect(parsed).toHaveLength(1)
    expect(parsed[0].quantity).toBe(2)
  })

  it('可以从 localStorage 恢复本地购物车', () => {
    const cartData = [
      { ...mockProduct1, quantity: 3, selectedSpecs: { 颜色: '黑色' }, selected: true },
    ]
    localStorage.setItem('cart', JSON.stringify(cartData))

    const Wrapper = createWrapper()
    const { result } = renderHook(() => useCart(), { wrapper: Wrapper })

    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0].quantity).toBe(3)
  })
})

describe('CartContext - 购物车选择功能', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('新增商品默认为选中状态', () => {
    const Wrapper = createWrapper()
    const { result } = renderHook(() => useCart(), { wrapper: Wrapper })

    act(() => {
      result.current.addToCart(mockProduct1 as Product, 1, {})
    })

    expect(result.current.items[0].selected).toBe(true)
    expect(result.current.selectedItems).toBe(1)
    expect(result.current.selectedTotalPrice).toBe(mockProduct1.price)
  })

  it('toggleSelect 可以切换选中状态', () => {
    const Wrapper = createWrapper()
    const { result } = renderHook(() => useCart(), { wrapper: Wrapper })

    act(() => {
      result.current.addToCart(mockProduct1 as Product, 1, {})
    })
    expect(result.current.items[0].selected).toBe(true)

    act(() => {
      result.current.toggleSelect(mockProduct1.id, {})
    })

    expect(result.current.items[0].selected).toBe(false)
    expect(result.current.selectedItems).toBe(0)
    expect(result.current.selectedTotalPrice).toBe(0)
  })

  it('toggleSelectAll 可以全选和取消全选', () => {
    const Wrapper = createWrapper()
    const { result } = renderHook(() => useCart(), { wrapper: Wrapper })

    act(() => {
      result.current.addToCart(mockProduct1 as Product, 1, {})
      result.current.addToCart(mockProduct2 as Product, 2, {})
    })
    expect(result.current.isAllSelected).toBe(true)

    act(() => {
      result.current.toggleSelectAll(false)
    })
    expect(result.current.isAllSelected).toBe(false)
    expect(result.current.selectedItems).toBe(0)

    act(() => {
      result.current.toggleSelectAll(true)
    })
    expect(result.current.isAllSelected).toBe(true)
    expect(result.current.selectedItems).toBe(3)
  })

  it('removeSelected 可以移除选中的商品', () => {
    const Wrapper = createWrapper()
    const { result } = renderHook(() => useCart(), { wrapper: Wrapper })

    act(() => {
      result.current.addToCart(mockProduct1 as Product, 1, {})
      result.current.addToCart(mockProduct2 as Product, 2, {})
    })

    act(() => {
      result.current.toggleSelect(mockProduct1.id, {})
    })

    act(() => {
      result.current.removeSelected()
    })

    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0].id).toBe(mockProduct2.id)
  })
})

describe('CartContext - 本地购物车统计计算', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('正确计算总价和总数量', () => {
    const Wrapper = createWrapper()
    const { result } = renderHook(() => useCart(), { wrapper: Wrapper })

    act(() => {
      result.current.addToCart(mockProduct1 as Product, 2, {})
      result.current.addToCart(mockProduct2 as Product, 3, {})
    })

    const expectedTotal = mockProduct1.price * 2 + mockProduct2.price * 3
    expect(result.current.totalItems).toBe(5)
    expect(result.current.totalPrice).toBe(expectedTotal)
  })

  it('正确计算选中商品的总价和数量', () => {
    const Wrapper = createWrapper()
    const { result } = renderHook(() => useCart(), { wrapper: Wrapper })

    act(() => {
      result.current.addToCart(mockProduct1 as Product, 2, {})
      result.current.addToCart(mockProduct2 as Product, 3, {})
    })

    act(() => {
      result.current.toggleSelect(mockProduct1.id, {})
    })

    expect(result.current.selectedItems).toBe(3)
    expect(result.current.selectedTotalPrice).toBe(mockProduct2.price * 3)
  })

  it('空购物车时统计都为0', () => {
    const Wrapper = createWrapper()
    const { result } = renderHook(() => useCart(), { wrapper: Wrapper })

    expect(result.current.totalItems).toBe(0)
    expect(result.current.totalPrice).toBe(0)
    expect(result.current.selectedItems).toBe(0)
    expect(result.current.selectedTotalPrice).toBe(0)
    expect(result.current.isAllSelected).toBe(false)
  })
})
