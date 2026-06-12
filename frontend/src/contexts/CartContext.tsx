import React, { createContext, useContext, useState, useEffect } from 'react'
import { Product, CartItem } from '../types'

interface CartContextType {
  items: CartItem[]
  addToCart: (product: Product, quantity: number, specs?: Record<string, string>) => void
  removeFromCart: (productId: number, specs?: Record<string, string>) => void
  updateQuantity: (productId: number, quantity: number, specs?: Record<string, string>) => void
  clearCart: () => void
  totalItems: number
  totalPrice: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('cart')
    return saved ? JSON.parse(saved) : []
  })

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items))
  }, [items])

  const addToCart = (product: Product, quantity: number, specs?: Record<string, string>) => {
    setItems((prev) => {
      const existingItemIndex = prev.findIndex(
        (item) =>
          item.id === product.id &&
          JSON.stringify(item.selectedSpecs) === JSON.stringify(specs)
      )

      if (existingItemIndex > -1) {
        const newItems = [...prev]
        newItems[existingItemIndex].quantity += quantity
        return newItems
      }

      return [...prev, { ...product, quantity, selectedSpecs: specs }]
    })
  }

  const removeFromCart = (productId: number, specs?: Record<string, string>) => {
    setItems((prev) =>
      prev.filter(
        (item) =>
          !(item.id === productId && JSON.stringify(item.selectedSpecs) === JSON.stringify(specs))
      )
    )
  }

  const updateQuantity = (productId: number, quantity: number, specs?: Record<string, string>) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === productId && JSON.stringify(item.selectedSpecs) === JSON.stringify(specs)
          ? { ...item, quantity: Math.max(1, quantity) }
          : item
      )
    )
  }

  const clearCart = () => setItems([])

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
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
