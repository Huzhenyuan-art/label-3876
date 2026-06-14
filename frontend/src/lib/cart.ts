import React from 'react'
import { Tag } from 'lucide-react'
import { CartItem } from '../types'

export const CART_STORAGE_KEY = 'cart'
export const SELECTED_STATE_KEY = 'cart_selected'
export const PENDING_MERGE_KEY = 'cart_pending_merge'

export const getItemKey = (productId: number, specs?: Record<string, string>, skuId?: number): string => {
    if (skuId) return `${productId}-sku-${skuId}`
    return `${productId}-${JSON.stringify(specs || {})}`
}

export const formatSpecsLabel = (specs: Record<string, string>): string => {
    return Object.entries(specs).map(([key, val]) => `${key}: ${val}`).join(' / ')
}

export const formatSpecsTags = (specs: Record<string, string>): React.ReactNode[] => {
    return Object.entries(specs).map(([key, val]) => (
        React.createElement('span', {
            key: `${key}-${val}`,
            className: 'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-bold bg-primary/5 text-primary border-primary/20'
        }, React.createElement(Tag, { className: 'h-3 w-3' }), `${key}：${val}`)
    ))
}

export const loadLocalCart = (): CartItem[] => {
    try {
        const saved = localStorage.getItem(CART_STORAGE_KEY)
        if (saved) {
            const parsed = JSON.parse(saved) as CartItem[]
            return parsed.map((item) => ({
                ...item,
                selected: item.selected !== false,
                selectedSpecs: item.selectedSpecs || {}
            }))
        }
    } catch {
        localStorage.removeItem(CART_STORAGE_KEY)
    }
    return []
}

export const saveLocalCart = (items: CartItem[]) => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
}

export const loadSelectedState = (): Record<string, boolean> => {
    try {
        const saved = localStorage.getItem(SELECTED_STATE_KEY)
        if (saved) return JSON.parse(saved)
    } catch {
        localStorage.removeItem(SELECTED_STATE_KEY)
    }
    return {}
}

export const saveSelectedState = (state: Record<string, boolean>) => {
    localStorage.setItem(SELECTED_STATE_KEY, JSON.stringify(state))
}

export const setPendingMergeFlag = (hasPending: boolean) => {
    if (hasPending) {
        localStorage.setItem(PENDING_MERGE_KEY, '1')
    } else {
        localStorage.removeItem(PENDING_MERGE_KEY)
    }
}

export const hasPendingMergeFlag = (): boolean => {
    return localStorage.getItem(PENDING_MERGE_KEY) === '1'
}
