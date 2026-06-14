import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
    Search, ShoppingCart, User, Zap, LogOut, Settings,
    Heart, ShoppingBag, ChevronRight, X, Minus, Plus, Trash2
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { CartItem } from '../types'
import { formatSpecsLabel } from '../lib/cart'

export const Header = React.memo(({ showSearch = true }: { showSearch?: boolean }) => {
    const navigate = useNavigate()
    const { items, totalItems, totalPrice, updateQuantity, removeFromCart } = useCart()
    const { user, isAuthenticated, logout } = useAuth()
    const [searchParams] = useSearchParams()
    const [query, setQuery] = useState(searchParams.get('q') || '')
    const [showUserMenu, setShowUserMenu] = useState(false)
    const [showCartPanel, setShowCartPanel] = useState(false)
    const menuRef = React.useRef<HTMLDivElement>(null)
    const cartPanelRef = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
        setQuery(searchParams.get('q') || '')
    }, [searchParams])

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowUserMenu(false)
            }
            if (cartPanelRef.current && !cartPanelRef.current.contains(event.target as Node)) {
                setShowCartPanel(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        const category = searchParams.get('category')
        const params = new URLSearchParams()
        params.set('q', query)
        if (category) {
            params.set('category', category)
        }
        navigate(`/search?${params.toString()}`)
    }

    return (
        <header className="sticky top-0 z-[100] w-full bg-white/80 dark:bg-secondary-900/80 backdrop-blur-2xl border-b border-secondary-100/50 dark:border-secondary-800 shadow-sm transition-colors">
            <div className="max-w-[1600px] mx-auto px-6 h-20 flex items-center justify-between gap-8">
                <Link to="/" className="flex items-center gap-2 group">
                    <div className="w-10 h-10 bg-secondary-900 dark:bg-primary rounded-xl flex items-center justify-center group-hover:bg-primary dark:group-hover:bg-white transition-all duration-500 shadow-lg shadow-secondary-900/10 rotate-3 group-hover:rotate-0">
                        <Zap className="h-6 w-6 text-white dark:text-secondary-900 fill-current" />
                    </div>
                    <span className="text-xl font-black text-secondary-900 dark:text-white tracking-tighter italic uppercase hidden md:block transition-colors">Shield<span className="text-primary group-hover:text-secondary-900 dark:group-hover:text-primary transition-colors">Plate</span></span>
                </Link>

                {showSearch && (
                    <form onSubmit={handleSearch} className="flex-1 max-w-2xl relative group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-400 group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="搜索您心仪的高端尖货..."
                            className="w-full bg-secondary-50 dark:bg-secondary-800 border-2 border-transparent focus:border-primary/20 focus:bg-white dark:focus:bg-secondary-700 rounded-2xl py-3.5 pl-14 pr-6 text-sm font-bold text-secondary-900 dark:text-white placeholder:text-secondary-400 dark:placeholder:text-secondary-500 transition-all shadow-inner focus:shadow-2xl focus:shadow-primary/5"
                        />
                    </form>
                )}

                <div className="flex items-center gap-6">
                    <div className="relative" ref={cartPanelRef}>
                        <button
                            onClick={() => setShowCartPanel(!showCartPanel)}
                            className={`relative p-3 text-secondary-500 dark:text-secondary-400 hover:text-primary dark:hover:text-primary hover:bg-primary/5 rounded-xl transition-all group ${showCartPanel ? 'text-primary bg-primary/5' : ''}`}
                        >
                            <ShoppingCart className="h-5 w-5 group-hover:scale-110 transition-transform" />
                            {totalItems > 0 && (
                                <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-lg shadow-primary/20 ring-2 ring-white dark:ring-secondary-900 animate-in zoom-in">{totalItems}</span>
                            )}
                        </button>

                        {showCartPanel && (
                            <div className="absolute top-full right-0 w-96 bg-white/95 dark:bg-secondary-800/95 backdrop-blur-xl rounded-[2rem] shadow-3xl border border-secondary-100/50 dark:border-secondary-700 overflow-hidden z-[110] mt-2 animate-in fade-in slide-in-from-top-4 duration-300 transition-colors">
                                <div className="flex items-center justify-between p-5 border-b border-secondary-100 dark:border-secondary-700">
                                    <div>
                                        <p className="text-xs font-black text-secondary-900 dark:text-white uppercase tracking-widest">购物车</p>
                                        <p className="text-[11px] font-bold text-secondary-400 dark:text-secondary-500 mt-0.5">{totalItems} 件商品</p>
                                    </div>
                                    <button
                                        onClick={() => setShowCartPanel(false)}
                                        className="p-1.5 text-secondary-300 hover:text-secondary-500 hover:bg-secondary-100 dark:hover:bg-secondary-700 rounded-xl transition-colors"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>

                                {items.length === 0 ? (
                                    <div className="py-16 text-center">
                                        <ShoppingBag className="h-14 w-14 text-secondary-100 dark:text-secondary-700 mx-auto mb-4" />
                                        <p className="text-sm font-bold text-secondary-300 dark:text-secondary-600">购物车是空的</p>
                                        <button
                                            onClick={() => { setShowCartPanel(false); navigate('/') }}
                                            className="mt-4 text-xs font-black text-primary hover:text-primary-600 uppercase tracking-widest"
                                        >
                                            去逛逛 →
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="max-h-80 overflow-y-auto">
                                            {items.slice(0, 5).map((item: CartItem) => {
                                                const itemKey = `${item.id}-${JSON.stringify(item.selectedSpecs || {})}-${item.skuId || ''}`
                                                return (
                                                    <div key={itemKey} className="flex gap-4 p-4 border-b border-secondary-50 dark:border-secondary-700/50 last:border-0 group hover:bg-secondary-50/50 dark:hover:bg-secondary-700/30 transition-colors">
                                                        <Link
                                                            to={`/product/${item.id}`}
                                                            onClick={() => setShowCartPanel(false)}
                                                            className="shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-secondary-100 dark:bg-secondary-700 shadow-sm"
                                                        >
                                                            <img src={item.main_image} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                                        </Link>
                                                        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                                                            <Link
                                                                to={`/product/${item.id}`}
                                                                onClick={() => setShowCartPanel(false)}
                                                                className="text-sm font-black text-secondary-900 dark:text-white hover:text-primary transition-colors truncate"
                                                            >
                                                                {item.name}
                                                            </Link>
                                                            {item.selectedSpecs && Object.keys(item.selectedSpecs).length > 0 && (
                                                                <p className="text-[10px] font-bold text-secondary-400 dark:text-secondary-500 truncate mt-0.5">
                                                                    {formatSpecsLabel(item.selectedSpecs)}
                                                                </p>
                                                            )}
                                                            <div className="flex items-center justify-between mt-2">
                                                                <span className="text-sm font-black text-primary">¥{item.price.toFixed(2)}</span>
                                                                <div className="flex items-center gap-2 bg-secondary-50 dark:bg-secondary-700/50 rounded-lg p-0.5">
                                                                    <button
                                                                        onClick={async () => { try { await updateQuantity(item.id!, item.quantity - 1, item.selectedSpecs, item.skuId) } catch (e) { console.error(e) } }}
                                                                        disabled={item.quantity <= 1}
                                                                        className="w-6 h-6 bg-white dark:bg-secondary-600 rounded-md shadow-sm hover:text-primary disabled:opacity-30 transition-all active:scale-75"
                                                                    >
                                                                        <Minus className="h-3 w-3 mx-auto" />
                                                                    </button>
                                                                    <span className="w-5 text-center text-xs font-black text-secondary-900 dark:text-white tabular-nums">{item.quantity}</span>
                                                                    <button
                                                                        onClick={async () => { try { await updateQuantity(item.id!, item.quantity + 1, item.selectedSpecs, item.skuId) } catch (e) { console.error(e) } }}
                                                                        className="w-6 h-6 bg-white dark:bg-secondary-600 rounded-md shadow-sm hover:text-primary transition-all active:scale-75"
                                                                    >
                                                                        <Plus className="h-3 w-3 mx-auto" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={async () => { try { await removeFromCart(item.id!, item.selectedSpecs, item.skuId) } catch (e) { console.error(e) } }}
                                                            className="shrink-0 p-1.5 text-secondary-200 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                )
                                            })}
                                            {items.length > 5 && (
                                                <div className="p-3 text-center">
                                                    <span className="text-[11px] font-bold text-secondary-300 dark:text-secondary-600">还有 {items.length - 5} 件商品...</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="p-5 bg-secondary-50/50 dark:bg-secondary-900/50 border-t border-secondary-100 dark:border-secondary-700">
                                            <div className="flex items-center justify-between mb-4">
                                                <span className="text-xs font-bold text-secondary-400 dark:text-secondary-500 uppercase tracking-widest">合计</span>
                                                <span className="text-xl font-black text-primary tracking-tighter italic">¥{totalPrice.toFixed(2)}</span>
                                            </div>
                                            <Link
                                                to="/cart"
                                                onClick={() => setShowCartPanel(false)}
                                                className="flex items-center justify-center gap-2 w-full bg-secondary-900 dark:bg-primary text-white py-3.5 rounded-2xl font-black text-xs hover:bg-primary dark:hover:bg-primary-600 transition-all active:scale-95 shadow-xl shadow-secondary-900/10 uppercase tracking-[0.2em] group"
                                            >
                                                查看购物车
                                                <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                            </Link>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {isAuthenticated ? (
                        <div className="relative" ref={menuRef}>
                            <button
                                onClick={() => setShowUserMenu(!showUserMenu)}
                                className={`flex items-center gap-3 p-1 pr-3 bg-secondary-50 dark:bg-secondary-800 hover:bg-white dark:hover:bg-secondary-700 border-2 transition-all group shadow-sm rounded-2xl ${showUserMenu ? 'border-primary/40 bg-white dark:bg-secondary-700 ring-4 ring-primary/10' : 'border-transparent'}`}
                            >
                                <div className="w-10 h-10 rounded-xl border-2 border-white dark:border-secondary-600 shadow-xl overflow-hidden bg-secondary-200 dark:bg-secondary-700">
                                    <img src={user?.avatar} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                </div>
                                <div className="hidden lg:block text-left">
                                    <p className="text-[10px] font-black text-secondary-400 dark:text-secondary-500 uppercase tracking-widest leading-none mb-1">Authenticated</p>
                                    <p className="text-xs font-black text-secondary-900 dark:text-white tracking-tight">{user?.nickname}</p>
                                </div>
                            </button>

                            {showUserMenu && (
                                <div className="absolute top-full right-0 w-72 bg-white/95 dark:bg-secondary-800/95 backdrop-blur-xl rounded-[2.5rem] shadow-3xl border border-secondary-100/50 dark:border-secondary-700 p-3 animate-in fade-in slide-in-from-top-4 duration-300 overflow-hidden z-[110] mt-2 transition-colors">
                                    <div className="p-6 bg-secondary-900 dark:bg-secondary-950 rounded-[2rem] text-white mb-3 shadow-2xl relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/20 rounded-full blur-3xl -mr-8 -mt-8 px-2" />
                                        <p className="text-[10px] font-black text-secondary-400 dark:text-secondary-500 uppercase tracking-widest mb-1 relative z-10">Premium Member</p>
                                        <p className="text-xl font-black italic tracking-tighter truncate relative z-10">{user?.nickname}</p>
                                        <div className="mt-4 flex items-center gap-2 bg-white/10 w-fit px-3 py-1 rounded-full relative z-10">
                                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                                            <span className="text-[9px] font-black uppercase tracking-[0.1em]">Online now</span>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        {[
                                            { icon: User, label: '个人中心', sub: 'Details & Profile', path: '/profile' },
                                            { icon: ShoppingBag, label: '我的订单', sub: 'Order History', path: '/orders' },
                                            { icon: Heart, label: '收藏关注', sub: 'Wishlist items', path: '/favorites' },
                                            { icon: Settings, label: '账号设置', sub: 'App Settings', path: '/settings' },
                                        ].map((item, idx) => (
                                            <Link key={idx} to={item.path} onClick={() => setShowUserMenu(false)} className="flex items-center gap-4 p-4 rounded-[1.5rem] hover:bg-secondary-50 dark:hover:bg-secondary-700 transition-all group">
                                                <div className="w-10 h-10 bg-secondary-50 dark:bg-secondary-700/50 group-hover:bg-white dark:group-hover:bg-secondary-600 rounded-xl flex items-center justify-center transition-all shadow-sm">
                                                    <item.icon className="h-4 w-4 text-secondary-400 group-hover:text-primary transition-colors" />
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-xs font-black text-secondary-900 dark:text-white">{item.label}</p>
                                                    <p className="text-[9px] font-bold text-secondary-400 dark:text-secondary-500 uppercase tracking-widest">{item.sub}</p>
                                                </div>
                                                <ChevronRight className="h-3 w-3 ml-auto text-secondary-200 dark:text-secondary-600 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                            </Link>
                                        ))}
                                    </div>
                                    <div className="h-px bg-secondary-100 dark:bg-secondary-700 mx-4 my-3" />
                                    <button
                                        onClick={() => { logout(); setShowUserMenu(false); }}
                                        className="w-full flex items-center gap-4 p-4 rounded-[1.5rem] hover:bg-red-50 dark:hover:bg-red-500/10 transition-all group text-red-500"
                                    >
                                        <div className="w-10 h-10 bg-red-50 dark:bg-red-500/10 group-hover:bg-white dark:group-hover:bg-red-500/20 rounded-xl flex items-center justify-center transition-all shadow-sm">
                                            <LogOut className="h-4 w-4" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-xs font-black">退出登录</p>
                                            <p className="text-[9px] font-bold opacity-60 uppercase tracking-widest">Sign Out session</p>
                                        </div>
                                    </button>
                                </div>
                            )
                            }
                        </div>
                    ) : (
                        <button
                            onClick={() => navigate('/login')}
                            className="bg-secondary-900 dark:bg-primary text-white px-8 py-3.5 rounded-2xl font-black text-xs hover:bg-primary dark:hover:bg-primary-600 transition-all active:scale-95 shadow-xl shadow-secondary-900/10 uppercase tracking-[0.2em] flex items-center gap-2 group"
                        >
                            立即登录 <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                    )}
                </div>
            </div>
        </header>
    )
})
