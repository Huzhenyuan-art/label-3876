import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { Product, CartItem, ServerCart, ServerCartItem, MergeStrategy } from '../types'
import { cartApi } from '../api'
import { useAuth } from './AuthContext'

interface CartContextType {
  items: CartItem[]
  addToCart: (product: Product, quantity: number, specs: Record<string, string>, skuId?: number) => Promise<void>
  removeFromCart: (productId: number, specs?: Record<string, string>, skuId?: number) => Promise<void>
  updateQuantity: (productId: number, quantity: number, specs?: Record<string, string>, skuId?: number) => Promise<void>
  clearCart: () => Promise<void>
  toggleSelect: (productId: number, specs?: Record<string, string>, skuId?: number) => void
  toggleSelectAll: (selected: boolean) => void
  removeSelected: () => Promise<void>
  mergeLocalCart: (strategy: MergeStrategy) => Promise<void>
  showMergeDialog: boolean
  openMergeDialog: () => void
  dismissMergeDialog: () => void
  hasPendingMerge: boolean
  localItemCount: number
  serverItemCount: number
  isLoading: boolean
  totalItems: number
  totalPrice: number
  selectedItems: number
  selectedTotalPrice: number
  isAllSelected: boolean
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const LOCAL_CART_KEY = 'cart'
const SELECTED_STATE_KEY = 'cart_selected'

const serverCartItemToCartItem = (serverItem: ServerCartItem, selected: boolean = true): CartItem => {
  return {
    ...serverItem.product,
    id: serverItem.id,
    quantity: serverItem.quantity,
    selectedSpecs: serverItem.specs || {},
    skuId: serverItem.sku_id || undefined,
    selected,
  }
}

const cartItemToMergeItem = (item: CartItem) => ({
  product_id: item.id,
  quantity: item.quantity,
  specs: item.selectedSpecs || null,
  sku_id: item.skuId || null,
})

const getItemKey = (productId: number, specs?: Record<string, string>, skuId?: number): string => {
  if (skuId) return `${productId}-sku-${skuId}`
  return `${productId}-${JSON.stringify(specs || {})}`
}

const loadLocalCart = (): CartItem[] => {
  try {
    const saved = localStorage.getItem(LOCAL_CART_KEY)
    if (saved) {
      const parsed = JSON.parse(saved) as CartItem[]
      return parsed.map((item) => ({
        ...item,
        selected: item.selected !== false,
        selectedSpecs: item.selectedSpecs || {}
      }))
    }
  } catch {
    localStorage.removeItem(LOCAL_CART_KEY)
  }
  return []
}

const saveLocalCart = (items: CartItem[]) => {
  localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(items))
}

const loadSelectedState = (): Record<string, boolean> => {
  try {
    const saved = localStorage.getItem(SELECTED_STATE_KEY)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch {
    localStorage.removeItem(SELECTED_STATE_KEY)
  }
  return {}
}

const saveSelectedState = (state: Record<string, boolean>) => {
  localStorage.setItem(SELECTED_STATE_KEY, JSON.stringify(state))
}

const PENDING_MERGE_KEY = 'cart_pending_merge'

const setPendingMergeFlag = (hasPending: boolean) => {
  if (hasPending) {
    localStorage.setItem(PENDING_MERGE_KEY, '1')
  } else {
    localStorage.removeItem(PENDING_MERGE_KEY)
  }
}

const hasPendingMergeFlag = (): boolean => {
  return localStorage.getItem(PENDING_MERGE_KEY) === '1'
}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const [localItems, setLocalItems] = useState<CartItem[]>(loadLocalCart)
  const [serverItems, setServerItems] = useState<CartItem[]>([])
  const [selectedState, setSelectedState] = useState<Record<string, boolean>>(loadSelectedState)
  const [showMergeDialog, setShowMergeDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [hasPendingMerge, setHasPendingMerge] = useState<boolean>(() => {
    return hasPendingMergeFlag() && loadLocalCart().length > 0
  })
  const isInitializing = useRef(true)
  const pendingLocalCart = useRef<CartItem[]>([])
  const skipLocalStorageSync = useRef(false)

  const activeItems: CartItem[] = isAuthenticated ? serverItems : localItems

  const itemsWithSelection: CartItem[] = activeItems.map(item => {
    const key = getItemKey(item.id, item.selectedSpecs, item.skuId)
    return { ...item, selected: selectedState[key] ?? item.selected ?? true }
  })

  useEffect(() => {
    if (skipLocalStorageSync.current) {
      skipLocalStorageSync.current = false
      return
    }
    saveLocalCart(localItems)
    if (isAuthenticated) {
      const hasPending = localItems.length > 0
      setHasPendingMerge(hasPending)
      setPendingMergeFlag(hasPending)
    }
  }, [localItems, isAuthenticated])

  useEffect(() => {
    saveSelectedState(selectedState)
  }, [selectedState])

  const fetchServerCart = useCallback(async () => {
    if (!isAuthenticated) return
    setIsLoading(true)
    try {
      const { data } = await cartApi.getCart()
      const newServerItems = data.items.map(serverItem => {
        const key = getItemKey(serverItem.product_id, serverItem.specs || undefined, serverItem.sku_id || undefined)
        return serverCartItemToCartItem(serverItem, selectedState[key] ?? true)
      })
      setServerItems(newServerItems)
    } catch (error) {
      console.error('Failed to fetch cart:', error)
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated, selectedState])

  useEffect(() => {
    if (authLoading) return

    if (isAuthenticated && isInitializing.current) {
      isInitializing.current = false
      const localCart = loadLocalCart()
      const hasPendingFlag = hasPendingMergeFlag()
      const shouldShowMerge = (hasPendingFlag || localCart.length > 0) && localCart.length > 0

      console.log('[CartInit] Check:', {
        localCartLength: localCart.length,
        hasPendingFlag,
        shouldShowMerge,
      })

      if (shouldShowMerge) {
        pendingLocalCart.current = localCart
        setHasPendingMerge(true)
        setPendingMergeFlag(true)
        setShowMergeDialog(true)
      } else {
        if (localCart.length === 0 && hasPendingFlag) {
          setPendingMergeFlag(false)
          setHasPendingMerge(false)
        }
      }
      fetchServerCart()
    } else if (!isAuthenticated && !isInitializing.current) {
      isInitializing.current = true
      setServerItems([])
      setShowMergeDialog(false)
      pendingLocalCart.current = []
    }
  }, [isAuthenticated, authLoading, fetchServerCart])

  const applySelectedState = (items: CartItem[], newSelectedState: Record<string, boolean>): CartItem[] => {
    return items.map(item => {
      const key = getItemKey(item.id, item.selectedSpecs, item.skuId)
      return { ...item, selected: newSelectedState[key] ?? item.selected ?? true }
    })
  }

  const clearLocalCartSync = useCallback(() => {
    saveLocalCart([])
    setPendingMergeFlag(false)
    pendingLocalCart.current = []
    skipLocalStorageSync.current = true
    setLocalItems([])
    setHasPendingMerge(false)
    console.log('[CartSync] Local cart cleared synchronously')
  }, [])

  const mergeLocalCart = useCallback(async (strategy: MergeStrategy) => {
    if (!isAuthenticated) return
    setIsLoading(true)
    try {
      const itemsToMerge = pendingLocalCart.current.length > 0 ? pendingLocalCart.current : loadLocalCart()

      if (itemsToMerge.length === 0) {
        setShowMergeDialog(false)
        clearLocalCartSync()
        return
      }

      if (strategy === 'keep_server') {
        clearLocalCartSync()
        setShowMergeDialog(false)
        return
      }

      const mergeItems = itemsToMerge.map(cartItemToMergeItem)
      console.log('[CartMerge] Sending merge request:', { strategy, items: mergeItems })

      const { data } = await cartApi.merge({
        items: mergeItems,
        merge_strategy: strategy,
      })

      console.log('[CartMerge] Merge response:', data)

      const newSelectedState = { ...selectedState }
      const newServerItems = data.items.map(serverItem => {
        const key = getItemKey(serverItem.product_id, serverItem.specs || undefined, serverItem.sku_id || undefined)
        const localItem = itemsToMerge.find(li =>
          getItemKey(li.id, li.selectedSpecs, li.skuId) === key
        )
        if (localItem) {
          newSelectedState[key] = localItem.selected ?? true
        }
        return serverCartItemToCartItem(serverItem, newSelectedState[key] ?? true)
      })

      setSelectedState(newSelectedState)
      setServerItems(newServerItems)
      clearLocalCartSync()
      setShowMergeDialog(false)
    } catch (error) {
      console.error('[CartMerge] Failed to merge cart:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated, selectedState, clearLocalCartSync])

  const openMergeDialog = useCallback(() => {
    if (!isAuthenticated) return
    const localCart = loadLocalCart()
    if (localCart.length === 0) return
    pendingLocalCart.current = localCart
    setShowMergeDialog(true)
  }, [isAuthenticated])

  const dismissMergeDialog = useCallback(() => {
    setShowMergeDialog(false)
  }, [])

  const updateSelectedState = useCallback((key: string, selected: boolean) => {
    setSelectedState(prev => ({ ...prev, [key]: selected }))
  }, [])

  const updateAllSelectedState = useCallback((items: CartItem[], selected: boolean) => {
    const newState: Record<string, boolean> = {}
    items.forEach(item => {
      const key = getItemKey(item.id, item.selectedSpecs, item.skuId)
      newState[key] = selected
    })
    setSelectedState(prev => ({ ...prev, ...newState }))
  }, [])

  const addToCart = useCallback(async (product: Product, quantity: number, specs: Record<string, string>, skuId?: number) => {
    const itemKey = getItemKey(product.id, specs, skuId)

    if (isAuthenticated) {
      setIsLoading(true)
      try {
        const { data } = await cartApi.addItem(product.id, quantity, specs, skuId)
        const newServerItems = data.items.map(si => {
          const key = getItemKey(si.product_id, si.specs || undefined, si.sku_id || undefined)
          return serverCartItemToCartItem(si, selectedState[key] ?? true)
        })
        setServerItems(newServerItems)
        setSelectedState(prev => ({ ...prev, [itemKey]: true }))
      } catch (error) {
        console.error('Failed to add to cart:', error)
        throw error
      } finally {
        setIsLoading(false)
      }
    } else {
      setLocalItems((prev) => {
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
      setSelectedState(prev => ({ ...prev, [itemKey]: true }))
    }
  }, [isAuthenticated, selectedState])

  const removeFromCart = useCallback(async (productId: number, specs?: Record<string, string>, skuId?: number) => {
    const itemKey = getItemKey(productId, specs, skuId)

    if (isAuthenticated) {
      const itemToRemove = serverItems.find(item =>
        getItemKey(item.id, item.selectedSpecs, item.skuId) === itemKey
      )
      if (itemToRemove && itemToRemove.id) {
        setIsLoading(true)
        try {
          const { data } = await cartApi.removeItem(itemToRemove.id)
          const newServerItems = data.items.map(si => {
            const key = getItemKey(si.product_id, si.specs || undefined, si.sku_id || undefined)
            return serverCartItemToCartItem(si, selectedState[key] ?? true)
          })
          setServerItems(newServerItems)
          setSelectedState(prev => {
            const newState = { ...prev }
            delete newState[itemKey]
            return newState
          })
        } catch (error) {
          console.error('Failed to remove from cart:', error)
          throw error
        } finally {
          setIsLoading(false)
        }
      }
    } else {
      setLocalItems((prev) =>
        prev.filter((item) => getItemKey(item.id, item.selectedSpecs, item.skuId) !== itemKey)
      )
      setSelectedState(prev => {
        const newState = { ...prev }
        delete newState[itemKey]
        return newState
      })
    }
  }, [isAuthenticated, serverItems, selectedState])

  const updateQuantity = useCallback(async (productId: number, quantity: number, specs?: Record<string, string>, skuId?: number) => {
    const itemKey = getItemKey(productId, specs, skuId)

    if (isAuthenticated) {
      const itemToUpdate = serverItems.find(item =>
        getItemKey(item.id, item.selectedSpecs, item.skuId) === itemKey
      )
      if (itemToUpdate && itemToUpdate.id) {
        setIsLoading(true)
        try {
          const { data } = await cartApi.updateItem(itemToUpdate.id, Math.max(1, quantity))
          const newServerItems = data.items.map(si => {
            const key = getItemKey(si.product_id, si.specs || undefined, si.sku_id || undefined)
            return serverCartItemToCartItem(si, selectedState[key] ?? true)
          })
          setServerItems(newServerItems)
        } catch (error) {
          console.error('Failed to update quantity:', error)
          throw error
        } finally {
          setIsLoading(false)
        }
      }
    } else {
      setLocalItems((prev) =>
        prev.map((item) =>
          getItemKey(item.id, item.selectedSpecs, item.skuId) === itemKey
            ? { ...item, quantity: Math.max(1, quantity) }
            : item
        )
      )
    }
  }, [isAuthenticated, serverItems, selectedState])

  const clearCart = useCallback(async () => {
    if (isAuthenticated) {
      setIsLoading(true)
      try {
        const { data } = await cartApi.clear()
        setServerItems([])
        setSelectedState({})
      } catch (error) {
        console.error('Failed to clear cart:', error)
        throw error
      } finally {
        setIsLoading(false)
      }
    } else {
      setLocalItems([])
      setSelectedState({})
    }
  }, [isAuthenticated])

  const toggleSelect = useCallback((productId: number, specs?: Record<string, string>, skuId?: number) => {
    const itemKey = getItemKey(productId, specs, skuId)
    setSelectedState(prev => ({
      ...prev,
      [itemKey]: prev[itemKey] === undefined ? false : !prev[itemKey]
    }))
  }, [])

  const toggleSelectAll = useCallback((selected: boolean) => {
    updateAllSelectedState(activeItems, selected)
  }, [activeItems, updateAllSelectedState])

  const removeSelected = useCallback(async () => {
    const selectedKeys = new Set(
      itemsWithSelection
        .filter(item => item.selected)
        .map(item => getItemKey(item.id, item.selectedSpecs, item.skuId))
    )

    if (isAuthenticated) {
      setIsLoading(true)
      try {
        const itemsToRemove = serverItems.filter(item =>
          selectedKeys.has(getItemKey(item.id, item.selectedSpecs, item.skuId))
        )

        for (const item of itemsToRemove) {
          if (item.id) {
            await cartApi.removeItem(item.id)
          }
        }

        await fetchServerCart()

        setSelectedState(prev => {
          const newState = { ...prev }
          selectedKeys.forEach(key => delete newState[key])
          return newState
        })
      } catch (error) {
        console.error('Failed to remove selected:', error)
        throw error
      } finally {
        setIsLoading(false)
      }
    } else {
      setLocalItems((prev) =>
        prev.filter((item) => !selectedKeys.has(getItemKey(item.id, item.selectedSpecs, item.skuId)))
      )
      setSelectedState(prev => {
        const newState = { ...prev }
        selectedKeys.forEach(key => delete newState[key])
        return newState
      })
    }
  }, [isAuthenticated, serverItems, itemsWithSelection, fetchServerCart])

  const localItemCount = localItems.reduce((sum, item) => sum + item.quantity, 0)
  const serverItemCount = serverItems.reduce((sum, item) => sum + item.quantity, 0)

  const totalItems = itemsWithSelection.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = itemsWithSelection.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const selectedItems = itemsWithSelection.filter((item) => item.selected).reduce((sum, item) => sum + item.quantity, 0)
  const selectedTotalPrice = itemsWithSelection.filter((item) => item.selected).reduce((sum, item) => sum + item.price * item.quantity, 0)
  const isAllSelected = itemsWithSelection.length > 0 && itemsWithSelection.every((item) => item.selected)

  return (
    <CartContext.Provider
      value={{
        items: itemsWithSelection,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        toggleSelect,
        toggleSelectAll,
        removeSelected,
        mergeLocalCart,
        showMergeDialog,
        openMergeDialog,
        dismissMergeDialog,
        hasPendingMerge,
        localItemCount,
        serverItemCount,
        isLoading,
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
