import React, { useState, useEffect } from 'react'
import { ArrowLeft, Package, Clock, CheckCircle2, Truck, Loader2 } from 'lucide-react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { Product, Order, ORDER_STATUS_MAP, OrderStatus } from '../types'
import { orderApi } from '../api'

const formatDate = (dateStr: string): string => {
    try {
        const d = new Date(dateStr)
        const pad = (n: number) => n.toString().padStart(2, '0')
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
    } catch {
        return dateStr
    }
}

const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
        case 'shipped':
        case 'delivered':
            return <Truck className="h-4 w-4 text-primary" />
        case 'completed':
            return <CheckCircle2 className="h-4 w-4 text-green-500" />
        case 'cancelled':
            return <Clock className="h-4 w-4 text-red-400" />
        default:
            return <Clock className="h-4 w-4 text-secondary-400" />
    }
}

export default function OrdersPage() {
    const navigate = useNavigate()
    const { isAuthenticated } = useAuth()
    const { addToCart } = useCart()
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const fetchOrders = async () => {
        if (!isAuthenticated) {
            setLoading(false)
            return
        }
        setLoading(true)
        setError('')
        try {
            const { data } = await orderApi.getMyOrders()
            setOrders(data)
        } catch (err: any) {
            const detail = err?.response?.data?.detail || '加载订单失败，请稍后重试'
            setError(typeof detail === 'string' ? detail : '加载订单失败，请稍后重试')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchOrders()
    }, [isAuthenticated])

    const handleBuyAgain = (order: Order) => {
        order.items.forEach(async (item) => {
            try {
                const product: Product = {
                    id: item.product_id,
                    name: item.product_name,
                    description: '',
                    price: item.price,
                    original_price: null,
                    stock: 0,
                    sales: 0,
                    main_image: item.product_image,
                    images: null,
                    specs: null,
                    shop_id: 1,
                    category_id: null,
                    created_at: item.created_at,
                }
                addToCart(product, item.quantity, item.specs || undefined)
            } catch {
                // ignore
            }
        })
        navigate('/cart')
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-secondary-50/30">
                <header className="bg-white/80 backdrop-blur-xl sticky top-0 z-50 border-b border-secondary-50 shadow-sm">
                    <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="p-2 hover:bg-secondary-50 rounded-xl transition-colors">
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <h1 className="text-xl font-black text-secondary-900 tracking-tighter italic">我的订单</h1>
                    </div>
                </header>
                <main className="max-w-4xl mx-auto px-6 py-24 text-center">
                    <Package className="h-16 w-16 text-secondary-100 mx-auto mb-6" />
                    <h3 className="text-xl font-black text-secondary-900 mb-2 italic">请先登录</h3>
                    <p className="text-secondary-400 font-bold mb-8">登录后即可查看您的订单</p>
                    <Link to="/login" className="inline-block px-10 py-4 bg-primary text-white rounded-2xl font-black text-xs hover:bg-primary-600 transition-all shadow-xl shadow-primary/20 uppercase tracking-widest">
                        去登录
                    </Link>
                </main>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-secondary-50/30">
            <header className="bg-white/80 backdrop-blur-xl sticky top-0 z-50 border-b border-secondary-50 shadow-sm">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-secondary-50 rounded-xl transition-colors">
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <h1 className="text-xl font-black text-secondary-900 tracking-tighter italic">我的订单</h1>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-12">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24">
                        <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
                        <p className="text-secondary-400 font-bold uppercase tracking-widest text-xs">加载订单中...</p>
                    </div>
                ) : error ? (
                    <div className="text-center py-24 bg-white rounded-[2.5rem] border-2 border-red-50">
                        <p className="text-red-500 font-bold mb-6">{error}</p>
                        <button onClick={fetchOrders} className="px-8 py-3 bg-primary text-white rounded-2xl font-black text-xs hover:bg-primary-600 transition-all shadow-xl shadow-primary/20 uppercase tracking-widest">
                            重新加载
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {orders.map((order) => (
                            <div key={order.id} className="bg-white rounded-[2.5rem] shadow-xl border border-secondary-50 overflow-hidden hover:shadow-2xl transition-all duration-500">
                                <div className="px-10 py-6 border-b border-secondary-50 bg-secondary-50/20 flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-white rounded-2xl shadow-sm flex items-center justify-center border border-secondary-100">
                                            <Package className="h-5 w-5 text-secondary-400" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-secondary-400 uppercase tracking-widest">订单号：{order.order_no}</p>
                                            <p className="text-xs font-bold text-secondary-500">{formatDate(order.created_at)}</p>
                                        </div>
                                    </div>
                                    <div className={`flex items-center gap-2 px-4 py-2 bg-white rounded-full border shadow-sm ${
                                        order.status === 'cancelled' ? 'border-red-100' :
                                        order.status === 'completed' ? 'border-green-100' :
                                        'border-secondary-100'
                                    }`}>
                                        {getStatusIcon(order.status)}
                                        <span className={`text-xs font-black ${
                                            order.status === 'cancelled' ? 'text-red-500' :
                                            order.status === 'completed' ? 'text-green-600' :
                                            'text-secondary-900'
                                        }`}>{ORDER_STATUS_MAP[order.status] || order.status}</span>
                                    </div>
                                </div>

                                <div className="p-10 space-y-6">
                                    {order.items.map((item) => (
                                        <div key={item.id} className="flex gap-6 items-center">
                                            <img src={item.product_image} alt="" className="w-20 h-20 rounded-2xl object-cover border border-secondary-100 shadow-sm" />
                                            <div className="flex-1">
                                                <h3 className="font-black text-secondary-900 italic tracking-tighter mb-1 uppercase">{item.product_name}</h3>
                                                <p className="text-xs font-bold text-secondary-400 uppercase tracking-widest">数量：{item.quantity}</p>
                                                {item.specs && Object.keys(item.specs).length > 0 && (
                                                    <p className="text-[10px] font-bold text-secondary-300 mt-1">
                                                        {Object.entries(item.specs).map(([k, v]) => `${k}: ${v}`).join(' / ')}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xl font-black text-primary italic tracking-tighter">¥{item.price.toFixed(2)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="px-10 py-8 bg-secondary-50/50 border-t border-secondary-50 flex justify-between items-center">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-xs font-black text-secondary-400 uppercase tracking-widest">实付款</span>
                                        <span className="text-2xl font-black text-secondary-900 italic tracking-tighter">¥{order.total_amount.toFixed(2)}</span>
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => navigate(`/orders/${order.id}`)}
                                            className="px-6 py-2.5 rounded-xl border-2 border-secondary-100 text-secondary-600 font-black text-xs hover:bg-white hover:border-secondary-200 transition-all uppercase tracking-widest"
                                        >
                                            查看详情
                                        </button>
                                        <button
                                            onClick={() => handleBuyAgain(order)}
                                            className="px-6 py-2.5 bg-secondary-900 text-white rounded-xl font-black text-xs hover:bg-primary transition-all shadow-lg shadow-secondary-900/10 uppercase tracking-widest"
                                        >
                                            再次购买
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {orders.length === 0 && (
                            <div className="text-center py-24 bg-white rounded-[2.5rem] border-2 border-dashed border-secondary-200">
                                <Package className="h-16 w-16 text-secondary-100 mx-auto mb-6" />
                                <h3 className="text-xl font-black text-secondary-900 mb-2 italic">暂无订单</h3>
                                <p className="text-secondary-400 font-bold mb-8">您还没有在本店下单过，快去逛逛吧</p>
                                <Link to="/" className="inline-block px-10 py-4 bg-primary text-white rounded-2xl font-black text-xs hover:bg-primary-600 transition-all shadow-xl shadow-primary/20 uppercase tracking-widest">
                                    去逛逛
                                </Link>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    )
}
