import React from 'react'
import { Product, ProductSpec } from '../types'
import { Tag } from 'lucide-react'

export const extractSpecs = (specs: ProductSpec[] | Record<string, string[]> | null): Record<string, string> => {
    if (!specs) return {}
    const result: Record<string, string> = {}

    if (Array.isArray(specs)) {
        for (const spec of specs) {
            if (!spec || typeof spec !== 'object') continue
            if (typeof spec.name !== 'string' || !Array.isArray(spec.values)) continue
            const firstVal = spec.values[0]
            result[spec.name] = (firstVal && typeof firstVal === 'object' && 'value' in firstVal) ? firstVal.value : (typeof firstVal === 'string' ? firstVal : '')
        }
    } else if (typeof specs === 'object') {
        for (const [name, values] of Object.entries(specs)) {
            if (Array.isArray(values) && values.length > 0) {
                result[name] = values[0]
            }
        }
    }
    return result
}

export interface SpecEntry {
    name: string
    values: { value: string }[]
}

export const safeSpecEntries = (specs: ProductSpec[] | Record<string, string[]> | null): SpecEntry[] => {
    if (!specs) return []
    const result: SpecEntry[] = []

    if (Array.isArray(specs)) {
        for (const spec of specs) {
            if (!spec || typeof spec !== 'object') continue
            if (typeof spec.name !== 'string') continue
            if (!spec.values || !Array.isArray(spec.values)) continue

            const values: { value: string }[] = []
            for (const v of spec.values) {
                if (v == null) continue
                if (typeof v === 'object' && typeof v.value === 'string') {
                    values.push({ value: v.value })
                } else if (typeof v === 'string') {
                    values.push({ value: v })
                }
            }

            if (values.length > 0) {
                result.push({ name: spec.name, values })
            }
        }
    } else if (typeof specs === 'object') {
        for (const [name, values] of Object.entries(specs)) {
            if (!Array.isArray(values)) continue
            const cleanedValues: { value: string }[] = []
            for (const v of values) {
                if (typeof v === 'string') {
                    cleanedValues.push({ value: v })
                }
            }
            if (cleanedValues.length > 0) {
                result.push({ name, values: cleanedValues })
            }
        }
    }
    return result
}

export type ProductSortType = 'default' | 'newest' | 'hot' | 'discount'

export const sortProducts = (products: Product[], sortType: ProductSortType): Product[] => {
    switch (sortType) {
        case 'newest':
            return [...products].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        case 'hot':
            return [...products].sort((a, b) => b.sales - a.sales)
        case 'discount':
            return [...products]
                .filter(p => p.original_price !== null && p.original_price > p.price)
                .sort((a, b) => {
                    const discountA = a.original_price! - a.price
                    const discountB = b.original_price! - b.price
                    return discountB - discountA
                })
        default:
            return products
    }
}

export const filterProductsByQuery = (products: Product[], query: string): Product[] => {
    if (!query) return products
    const q = query.toLowerCase()
    return products.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
    )
}

export const formatSpecsTags = (specs: Record<string, string>): React.ReactNode[] => {
    return Object.entries(specs).map(([key, val]) => (
        React.createElement('span', {
            key: `${key}-${val}`,
            className: 'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-bold bg-primary/5 text-primary border-primary/20'
        }, React.createElement(Tag, { className: 'h-3 w-3' }), `${key}：${val}`)
    ))
}
