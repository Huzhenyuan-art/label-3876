import React, { createContext, useContext, useState } from 'react'
import { Product } from '../types'

interface FavoritesContextType {
    favorites: Product[]
    toggleFavorite: (product: Product) => void
    isFavorite: (id: number) => boolean
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined)

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
    const [favorites, setFavorites] = useState<Product[]>([])

    const toggleFavorite = (product: Product) => {
        setFavorites((prev) => {
            const exists = prev.find((p) => p.id === product.id)
            if (exists) {
                return prev.filter((p) => p.id !== product.id)
            }
            return [...prev, product]
        })
    }

    const isFavorite = (id: number) => favorites.some((p) => p.id === id)

    return (
        <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite }}>
            {children}
        </FavoritesContext.Provider>
    )
}

export function useFavorites() {
    const context = useContext(FavoritesContext)
    if (!context) throw new Error('useFavorites must be used within a FavoritesProvider')
    return context
}
