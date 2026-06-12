import React from 'react'
import { ArrowLeft, Heart, ShoppingCart, X } from 'lucide-react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useFavorites } from '../contexts/FavoritesContext'
import { useCart } from '../contexts/CartContext'

export default function FavoritesPage() {
    const navigate = useNavigate()
    const { favorites, toggleFavorite } = useFavorites()
    const { addToCart } = useCart()

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
                </div>

                {favorites.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
                        {favorites.map((product) => (
                            <div key={product.id} className="group bg-white rounded-[2rem] shadow-xl border border-secondary-50 overflow-hidden hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 flex flex-col">
                                <Link to={`/product/${product.id}`} className="relative aspect-[4/5] overflow-hidden">
                                    <img src={product.main_image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                                    <div className="absolute top-4 right-4">
                                        <button
                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(product); }}
                                            className="w-10 h-10 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center text-primary shadow-lg border border-white hover:bg-white transition-all transform hover:scale-110 active:scale-90"
                                        >
                                            <Heart className="h-5 w-5 fill-primary" />
                                        </button>
                                    </div>
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
