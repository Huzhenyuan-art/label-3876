import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

// Contexts
import { AuthProvider, ProtectedRoute } from '../contexts/AuthContext'
import { CartProvider } from '../contexts/CartContext'
import { FavoritesProvider } from '../contexts/FavoritesContext'
import { ThemeProvider } from '../contexts/ThemeContext'

// Pages
import HomePage from './HomePage'
import ProductDetailPage from './ProductDetailPage'
import ShopDetailPage from './ShopDetailPage'
import ChatPage from './ChatPage'
import CartPage from './CartPage'
import LoginPage from './LoginPage'
import ProfilePage from './ProfilePage'
import OrdersPage from './OrdersPage'
import FavoritesPage from './FavoritesPage'
import SettingsPage from './SettingsPage'
import OrderDetailPage from './OrderDetailPage'
import NotFoundPage from './NotFoundPage'

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <ThemeProvider>
                    <CartProvider>
                        <FavoritesProvider>
                            <Routes>
                                <Route path="/" element={<HomePage />} />
                                <Route path="/login" element={<LoginPage />} />
                                <Route path="/search" element={<HomePage />} />
                                <Route path="/product/:id" element={<ProductDetailPage />} />
                                <Route path="/shop/:id" element={<ShopDetailPage />} />
                                <Route path="/chat/:shopId" element={<ChatPage />} />
                                <Route path="/cart" element={<CartPage />} />
                                <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                                <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
                                <Route path="/orders/:id" element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />
                                <Route path="/favorites" element={<ProtectedRoute><FavoritesPage /></ProtectedRoute>} />
                                <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
                                <Route path="*" element={<NotFoundPage />} />
                            </Routes>
                        </FavoritesProvider>
                    </CartProvider>
                </ThemeProvider>
            </AuthProvider>
        </BrowserRouter>
    )
}
