import React, { createContext, useContext, useState, useEffect } from 'react'
import { Product, CartItem } from '../types'

interface CartContextType {
  items: CartItem[]
  addToCart: (product: Product, quantity: number, specs: Record<string, string>, skuId?: number) => void
  removeFromCart: (productId: number, specs?: Record<string, string>, skuId?: number) => void
  updateQuantity: (productId: number, quantity: number, specs?: Record<string, string>, skuId?: number) => void
  clearCart: () => void
  toggleSelect: (productId: number, specs?: Record<string, string>, skuId?: number) => void
  toggleSelectAll: (selected: boolean) => void
  removeSelected: () => void
  totalItems: number
  totalPrice: number
  selectedItems: number
  selectedTotalPrice: number
  isAllSelected: boolean
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('cart')
    if (saved) {
      const parsed = JSON.parse(saved) as CartItem[]
      return parsed.map((item) => ({
        ...item,
        selected: item.selected !== false,
        selectedSpecs: item.selectedSpecs || {}
      }))
    }
    return []
  })

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items))
  }, [items])

  const getItemKey = (productId: number, specs?: Record<string, string>, skuId?: number): string => {
    if (skuId) return `${productId}-sku-${skuId}`
    return `${productId}-${JSON.stringify(specs || {})}`
  }

  const addToCart = (product: Product, quantity: number, specs: Record<string, string>, skuId?: number) => {
    setItems((prev) => {
      const itemKey = getItemKey(product.id, specs, skuId)
      const existingItemIndex = prev.findIndex(
        (item) => getItemKey(item.id, item.selectedSpecs, item.skuId) === itemKey
      )

      if (existingItemIndex > -1) {
        const newItems = [...prev]
        newItems[existingItemIndex] = {
          ...newItems[existingItemIndex],
          quantity: newItems[existingItemIndex].quantity + quantity,
        }
        return newItems
      }

      return [...prev, { ...product, quantity, selectedSpecs: specs, skuId, selected: true }]
    })
  }

  const removeFromCart = (productId: number, specs?: Record<string, string>, skuId?: number) => {
    const itemKey = getItemKey(productId, specs, skuId)
    setItems((prev) =>
      prev.filter((item) => getItemKey(item.id, item.selectedSpecs, item.skuId) !== itemKey)
    )
  }

  const updateQuantity = (productId: number, quantity: number, specs?: Record<string, string>, skuId?: number) => {
    const itemKey = getItemKey(productId, specs, skuId)
    setItems((prev) =>
      prev.map((item) =>
        getItemKey(item.id, item.selectedSpecs, item.skuId) === itemKey
          ? { ...item, quantity: Math.max(1, quantity) }
          : item
      )
    )
  }

  const clearCart = () => setItems([])

  const toggleSelect = (productId: number, specs?: Record<string, string>, skuId?: number) => {
    const itemKey = getItemKey(productId, specs, skuId)
    setItems((prev) =>
      prev.map((item) =>
        getItemKey(item.id, item.selectedSpecs, item.skuId) === itemKey
          ? { ...item, selected: !item.selected }
          : item
      )
    )
  }

  const toggleSelectAll = (selected: boolean) => {
    setItems((prev) => prev.map((item) => ({ ...item, selected })))
  }

  const removeSelected = () => {
    setItems((prev) => prev.filter((item) => !item.selected))
  }

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const selectedItems = items.filter((item) => item.selected).reduce((sum, item) => sum + item.quantity, 0)
  const selectedTotalPrice = items.filter((item) => item.selected).reduce((sum, item) => sum + item.price * item.quantity, 0)
  const isAllSelected = items.length > 0 && items.every((item) => item.selected)

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        toggleSelect,
        toggleSelectAll,
        removeSelected,
        totalItems,
        totalPrice,
        selectedItems,
        selectedTotalPrice,
        isAllSelected,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
