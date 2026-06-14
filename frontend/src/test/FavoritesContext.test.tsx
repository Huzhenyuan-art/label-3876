import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { FavoritesProvider, useFavorites } from '../contexts/FavoritesContext'
import { mockProduct1, mockProduct2 } from './mocks'
import type { Product } from '../types'
import React from 'react'

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <FavoritesProvider>{children}</FavoritesProvider>
)

describe('FavoritesContext - 收藏切换功能', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('初始状态收藏列表为空', () => {
    const { result } = renderHook(() => useFavorites(), { wrapper })
    expect(result.current.favorites).toEqual([])
    expect(result.current.isFavorite(mockProduct1.id)).toBe(false)
  })

  it('toggleFavorite 可以添加收藏', () => {
    const { result } = renderHook(() => useFavorites(), { wrapper })

    act(() => {
      result.current.toggleFavorite(mockProduct1 as Product)
    })

    expect(result.current.favorites).toHaveLength(1)
    expect(result.current.favorites[0].id).toBe(mockProduct1.id)
    expect(result.current.isFavorite(mockProduct1.id)).toBe(true)
  })

  it('toggleFavorite 可以取消收藏', () => {
    const { result } = renderHook(() => useFavorites(), { wrapper })

    act(() => {
      result.current.toggleFavorite(mockProduct1 as Product)
    })
    expect(result.current.isFavorite(mockProduct1.id)).toBe(true)

    act(() => {
      result.current.toggleFavorite(mockProduct1 as Product)
    })
    expect(result.current.isFavorite(mockProduct1.id)).toBe(false)
    expect(result.current.favorites).toHaveLength(0)
  })

  it('isFavorite 正确判断收藏状态', () => {
    const { result } = renderHook(() => useFavorites(), { wrapper })

    act(() => {
      result.current.toggleFavorite(mockProduct1 as Product)
    })

    expect(result.current.isFavorite(mockProduct1.id)).toBe(true)
    expect(result.current.isFavorite(mockProduct2.id)).toBe(false)
    expect(result.current.isFavorite(999)).toBe(false)
  })

  it('removeFavorite 可以移除单个收藏', () => {
    const { result } = renderHook(() => useFavorites(), { wrapper })

    act(() => {
      result.current.toggleFavorite(mockProduct1 as Product)
      result.current.toggleFavorite(mockProduct2 as Product)
    })
    expect(result.current.favorites).toHaveLength(2)

    act(() => {
      result.current.removeFavorite(mockProduct1.id)
    })
    expect(result.current.favorites).toHaveLength(1)
    expect(result.current.isFavorite(mockProduct1.id)).toBe(false)
    expect(result.current.isFavorite(mockProduct2.id)).toBe(true)
  })

  it('removeFavorites 可以批量移除收藏', () => {
    const { result } = renderHook(() => useFavorites(), { wrapper })

    act(() => {
      result.current.toggleFavorite(mockProduct1 as Product)
      result.current.toggleFavorite(mockProduct2 as Product)
    })
    expect(result.current.favorites).toHaveLength(2)

    act(() => {
      result.current.removeFavorites([mockProduct1.id, mockProduct2.id])
    })
    expect(result.current.favorites).toHaveLength(0)
  })

  it('收藏数据持久化到 localStorage', () => {
    const { result, unmount } = renderHook(() => useFavorites(), { wrapper })

    act(() => {
      result.current.toggleFavorite(mockProduct1 as Product)
    })

    const stored = localStorage.getItem('favorites')
    expect(stored).not.toBeNull()
    const parsed = JSON.parse(stored!)
    expect(parsed).toHaveLength(1)
    expect(parsed[0].id).toBe(mockProduct1.id)

    unmount()
  })

  it('从 localStorage 恢复收藏数据', () => {
    localStorage.setItem('favorites', JSON.stringify([mockProduct1, mockProduct2]))

    const { result } = renderHook(() => useFavorites(), { wrapper })

    expect(result.current.favorites).toHaveLength(2)
    expect(result.current.isFavorite(mockProduct1.id)).toBe(true)
    expect(result.current.isFavorite(mockProduct2.id)).toBe(true)
  })

  it('localStorage 数据异常时优雅降级', () => {
    localStorage.setItem('favorites', 'invalid-json')

    const { result } = renderHook(() => useFavorites(), { wrapper })

    expect(result.current.favorites).toEqual([])
  })

  it('多次切换同一个商品不会重复添加', () => {
    const { result } = renderHook(() => useFavorites(), { wrapper })

    act(() => {
      result.current.toggleFavorite(mockProduct1 as Product)
      result.current.toggleFavorite(mockProduct1 as Product)
      result.current.toggleFavorite(mockProduct1 as Product)
    })

    expect(result.current.favorites).toHaveLength(1)
  })

  it('收藏列表保持添加顺序', () => {
    const { result } = renderHook(() => useFavorites(), { wrapper })

    act(() => {
      result.current.toggleFavorite(mockProduct1 as Product)
      result.current.toggleFavorite(mockProduct2 as Product)
    })

    expect(result.current.favorites[0].id).toBe(mockProduct1.id)
    expect(result.current.favorites[1].id).toBe(mockProduct2.id)
  })
})
