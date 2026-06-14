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

interface ErrorBoundaryState {
    hasError: boolean
    error: Error | null
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
    constructor(props: { children: React.ReactNode }) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('[ErrorBoundary] Uncaught rendering error:', error, errorInfo)
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null })
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-secondary-50 dark:bg-secondary-950 flex items-center justify-center p-8">
                    <div className="bg-white dark:bg-secondary-900 rounded-3xl p-12 max-w-md w-full text-center shadow-2xl border border-secondary-100 dark:border-secondary-800">
                        <div className="w-20 h-20 bg-red-50 dark:bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="text-4xl">⚠️</span>
                        </div>
                        <h2 className="text-2xl font-black text-secondary-900 dark:text-white mb-3 tracking-tighter">页面出了点问题</h2>
                        <p className="text-sm text-secondary-400 dark:text-secondary-500 mb-2 leading-relaxed">渲染过程中发生了错误，请尝试刷新页面。</p>
                        {this.state.error && (
                            <p className="text-xs text-secondary-300 dark:text-secondary-600 mb-6 bg-secondary-50 dark:bg-secondary-800 p-3 rounded-xl overflow-auto max-h-32 font-mono">
                                {this.state.error.message}
                            </p>
                        )}
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={this.handleReset}
                                className="px-8 py-4 bg-primary text-white rounded-2xl font-black text-sm hover:bg-primary-600 transition-all active:scale-95 shadow-xl shadow-primary/20"
                            >
                                重试
                            </button>
                            <button
                                onClick={() => window.location.href = '/'}
                                className="px-8 py-4 bg-secondary-100 dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300 rounded-2xl font-black text-sm hover:bg-secondary-200 dark:hover:bg-secondary-700 transition-all active:scale-95"
                            >
                                返回首页
                            </button>
                        </div>
                    </div>
                </div>
            )
        }
        return this.props.children
    }
}

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <ThemeProvider>
                    <CartProvider>
                        <FavoritesProvider>
                            <ErrorBoundary>
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
                            </ErrorBoundary>
                        </FavoritesProvider>
                    </CartProvider>
                </ThemeProvider>
            </AuthProvider>
        </BrowserRouter>
    )
}
