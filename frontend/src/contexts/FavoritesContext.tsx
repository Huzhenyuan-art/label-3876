import React, { createContext, useContext, useState, useEffect } from 'react'
import { Product } from '../types'

interface FavoritesContextType {
    favorites: Product[]
    toggleFavorite: (product: Product) => void
    isFavorite: (id: number) => boolean
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined)

const STORAGE_KEY = 'favorites'

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
    const [favorites, setFavorites] = useState<Product[]>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY)
            return saved ? JSON.parse(saved) : []
        } catch (error) {
            console.error('Failed to parse favorites from localStorage:', error)
            return []
        }
    })

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites))
        } catch (error) {
            console.error('Failed to save favorites to localStorage:', error)
        }
    }, [favorites])

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
