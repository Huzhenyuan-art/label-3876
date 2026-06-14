import React, { useState, useMemo } from 'react'
import { ArrowLeft, Heart, ShoppingCart, X, Check, TrendingUp, TrendingDown, Hash } from 'lucide-react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useFavorites } from '../contexts/FavoritesContext'
import { useCart } from '../contexts/CartContext'

type SortType = 'default' | 'price-asc' | 'price-desc' | 'sales-asc' | 'sales-desc'

export default function FavoritesPage() {
    const navigate = useNavigate()
    const { favorites, toggleFavorite, isFavorite, removeFavorites } = useFavorites()
    const { addToCart } = useCart()
    const [sortType, setSortType] = useState<SortType>('default')
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
    const [isBatchMode, setIsBatchMode] = useState(false)

    const sortedFavorites = useMemo(() => {
        const list = [...favorites]
        switch (sortType) {
            case 'price-asc':
                return list.sort((a, b) => a.price - b.price)
            case 'price-desc':
                return list.sort((a, b) => b.price - a.price)
            case 'sales-asc':
                return list.sort((a, b) => a.sales - b.sales)
            case 'sales-desc':
                return list.sort((a, b) => b.sales - a.sales)
            default:
                return list
        }
    }, [favorites, sortType])

    const toggleSelect = (id: number) => {
        setSelectedIds(prev => {
            const next = new Set(prev)
            if (next.has(id)) {
                next.delete(id)
            } else {
                next.add(id)
            }
            return next
        })
    }

    const toggleSelectAll = () => {
        if (selectedIds.size === sortedFavorites.length) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(sortedFavorites.map(p => p.id)))
        }
    }

    const handleBatchRemove = () => {
        if (selectedIds.size === 0) return
        removeFavorites(Array.from(selectedIds))
        setSelectedIds(new Set())
        setIsBatchMode(false)
    }

    const exitBatchMode = () => {
        setIsBatchMode(false)
        setSelectedIds(new Set())
    }

    return (
        <div className="min-h-screen bg-secondary-50/30">
            <header className="bg-white/80 backdrop-blur-xl sticky top-0 z-50 border-b border-secondary-50 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-secondary-50 rounded-xl transition-colors">
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <h1 className="text-xl font-black text-secondary-900 tracking-tighter italic">收藏关注</h1>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-12">
                <div className="flex items-center justify-between mb-10">
                    <div>
                        <h2 className="text-3xl font-black text-secondary-900 tracking-tighter italic uppercase">我的收藏 / {favorites.length} ITEMS</h2>
                        <div className="h-1.5 w-12 bg-primary rounded-full mt-2" />
                    </div>
                    {favorites.length > 0 && !isBatchMode && (
                        <button
                            onClick={() => setIsBatchMode(true)}
                            className="px-6 py-3 bg-secondary-50 text-secondary-600 rounded-xl font-black text-xs hover:bg-secondary-100 transition-all uppercase tracking-widest active:scale-95"
                        >
                            批量管理
                        </button>
                    )}
                </div>

                {isBatchMode && (
                    <div className="bg-white rounded-2xl p-4 mb-6 shadow-lg border border-secondary-100 flex items-center justify-between animate-in slide-in-from-top-4 duration-300">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={toggleSelectAll}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-xs transition-all ${selectedIds.size === sortedFavorites.length ? 'bg-primary text-white' : 'bg-secondary-50 text-secondary-600 hover:bg-secondary-100'}`}
                            >
                                <Check className="h-4 w-4" />
                                {selectedIds.size === sortedFavorites.length ? '取消全选' : '全选'}
                            </button>
                            <span className="text-sm font-bold text-secondary-400">
                                已选 {selectedIds.size} / {sortedFavorites.length} 件
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={exitBatchMode}
                                className="px-4 py-2 text-secondary-400 font-black text-xs hover:text-secondary-600 transition-all uppercase tracking-widest"
                            >
                                取消
                            </button>
                            <button
                                onClick={handleBatchRemove}
                                disabled={selectedIds.size === 0}
                                className={`px-6 py-2 bg-red-500 text-white rounded-xl font-black text-xs hover:bg-red-600 transition-all uppercase tracking-widest active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
                            >
                                <X className="h-4 w-4" />
                                取消收藏 ({selectedIds.size})
                            </button>
                        </div>
                    </div>
                )}

                {favorites.length > 0 && !isBatchMode && (
                    <div className="flex items-center gap-3 mb-8">
                        <span className="text-xs font-black text-secondary-400 uppercase tracking-widest">排序：</span>
                        <button
                            onClick={() => setSortType('default')}
                            className={`px-4 py-2 rounded-xl font-black text-xs transition-all flex items-center gap-2 ${sortType === 'default' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-secondary-50 text-secondary-600 hover:bg-secondary-100'}`}
                        >
                            <Hash className="h-3.5 w-3.5" />
                            默认
                        </button>
                        <button
                            onClick={() => setSortType('price-asc')}
                            className={`px-4 py-2 rounded-xl font-black text-xs transition-all flex items-center gap-2 ${sortType === 'price-asc' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-secondary-50 text-secondary-600 hover:bg-secondary-100'}`}
                        >
                            <TrendingUp className="h-3.5 w-3.5" />
                            价格低到高
                        </button>
                        <button
                            onClick={() => setSortType('price-desc')}
                            className={`px-4 py-2 rounded-xl font-black text-xs transition-all flex items-center gap-2 ${sortType === 'price-desc' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-secondary-50 text-secondary-600 hover:bg-secondary-100'}`}
                        >
                            <TrendingDown className="h-3.5 w-3.5" />
                            价格高到低
                        </button>
                        <button
                            onClick={() => setSortType('sales-desc')}
                            className={`px-4 py-2 rounded-xl font-black text-xs transition-all flex items-center gap-2 ${sortType === 'sales-desc' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-secondary-50 text-secondary-600 hover:bg-secondary-100'}`}
                        >
                            <TrendingDown className="h-3.5 w-3.5" />
                            销量高到低
                        </button>
                        <button
                            onClick={() => setSortType('sales-asc')}
                            className={`px-4 py-2 rounded-xl font-black text-xs transition-all flex items-center gap-2 ${sortType === 'sales-asc' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-secondary-50 text-secondary-600 hover:bg-secondary-100'}`}
                        >
                            <TrendingUp className="h-3.5 w-3.5" />
                            销量低到高
                        </button>
                    </div>
                )}

                {favorites.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
                        {sortedFavorites.map((product) => (
                            <div key={product.id} className={`group bg-white rounded-[2rem] shadow-xl border overflow-hidden hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 flex flex-col relative ${selectedIds.has(product.id) ? 'border-primary ring-4 ring-primary/20' : 'border-secondary-50'}`}>
                                {isBatchMode && (
                                    <button
                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleSelect(product.id); }}
                                        className={`absolute top-4 left-4 z-20 w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 transition-all ${selectedIds.has(product.id) ? 'bg-primary text-white border-primary' : 'bg-white/80 backdrop-blur-md border-white hover:bg-white'}`}
                                    >
                                        <Check className={`h-4 w-4 transition-all ${selectedIds.has(product.id) ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`} />
                                    </button>
                                )}
                                <Link to={`/product/${product.id}`} className="relative aspect-[4/5] overflow-hidden">
                                    <img src={product.main_image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                                    {!isBatchMode && (
                                        <div className="absolute top-4 right-4">
                                            <button
                                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(product); }}
                                                className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg border transition-all transform hover:scale-110 active:scale-90 ${isFavorite(product.id) ? 'bg-primary text-white scale-110 shadow-primary/30 border-white' : 'bg-white/80 backdrop-blur-md text-primary border-white hover:bg-white'}`}
                                            >
                                                <Heart className={`h-5 w-5 ${isFavorite(product.id) ? 'fill-current' : ''}`} />
                                            </button>
                                        </div>
                                    )}
                                </Link>
                                <div className="p-6 flex-1 flex flex-col justify-between bg-white">
                                    <Link to={`/product/${product.id}`} className="font-black text-secondary-900 mb-4 line-clamp-2 text-xs leading-relaxed group-hover:text-primary transition-colors h-8 uppercase tracking-tight">
                                        {product.name}
                                    </Link>
                                    <div className="flex items-center justify-between mt-auto">
                                        <div className="flex flex-col">
                                            <span className="text-lg font-black text-primary italic tracking-tighter">¥{product.price.toFixed(2)}</span>
                                            <span className="text-[10px] font-bold text-secondary-400 uppercase tracking-widest mt-1">销量 {product.sales}+</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => addToCart(product, 1)}
                                                className="p-3 bg-secondary-50 text-secondary-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all shadow-sm active:scale-75"
                                            >
                                                <ShoppingCart className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[3rem] border-2 border-dashed border-secondary-100 shadow-sm animate-in fade-in zoom-in duration-700">
                        <div className="w-24 h-24 bg-secondary-50 rounded-full flex items-center justify-center mb-8 border border-secondary-100">
                            <Heart className="h-10 w-10 text-secondary-200" />
                        </div>
                        <h3 className="text-2xl font-black text-secondary-900 mb-2 italic uppercase">收藏夹是空的</h3>
                        <p className="text-secondary-400 font-bold mb-10 uppercase tracking-widest text-[10px]">发现心仪的商品，点击红心收藏它们吧</p>
                        <Link to="/" className="px-12 py-4 bg-primary text-white rounded-2xl font-black text-xs hover:bg-primary-600 transition-all shadow-xl shadow-primary/20 uppercase tracking-[0.2em] active:scale-95">
                            立即去逛逛
                        </Link>
                    </div>
                )}
            </main>
        </div>
    )
}
