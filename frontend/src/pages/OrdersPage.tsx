import React, { useState, useEffect } from 'react'
import { ArrowLeft, Package, Clock, CheckCircle2, Truck, Loader2, ShoppingCart, CreditCard, XCircle, Zap } from 'lucide-react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { Order, ORDER_STATUS_MAP, OrderStatus } from '../types'
import { orderApi, productApi, extractApiError } from '../api'
import { MOCK_ORDERS, MOCK_PRODUCTS } from '../mocks'
import { formatDate, getStatusIcon, buildFallbackProduct } from '../lib/order'

type TabKey = 'all' | OrderStatus

interface TabConfig {
    key: TabKey
    label: string
    emptyTitle: string
    emptyDesc: string
    emptyIcon: React.ReactNode
    emptyAction: string
    emptyActionLink: string
}

const TABS: TabConfig[] = [
    {
        key: 'all',
        label: '全部',
        emptyTitle: '暂无订单',
        emptyDesc: '您还没有在本店下单过，快去逛逛吧',
        emptyIcon: <Package className="h-16 w-16 text-secondary-100 mx-auto mb-6" />,
        emptyAction: '去逛逛',
        emptyActionLink: '/',
    },
    {
        key: 'pending',
        label: '待支付',
        emptyTitle: '暂无待支付订单',
        emptyDesc: '没有等待付款的订单，去挑选心仪的商品吧',
        emptyIcon: <CreditCard className="h-16 w-16 text-secondary-100 mx-auto mb-6" />,
        emptyAction: '去购物',
        emptyActionLink: '/',
    },
    {
        key: 'paid',
        label: '待发货',
        emptyTitle: '暂无待发货订单',
        emptyDesc: '没有等待发货的订单',
        emptyIcon: <Package className="h-16 w-16 text-secondary-100 mx-auto mb-6" />,
        emptyAction: '去逛逛',
        emptyActionLink: '/',
    },
    {
        key: 'shipped',
        label: '待收货',
        emptyTitle: '暂无待收货订单',
        emptyDesc: '没有正在运输中的订单',
        emptyIcon: <Truck className="h-16 w-16 text-secondary-100 mx-auto mb-6" />,
        emptyAction: '去逛逛',
        emptyActionLink: '/',
    },
    {
        key: 'completed',
        label: '已完成',
        emptyTitle: '暂无已完成订单',
        emptyDesc: '完成的订单会显示在这里',
        emptyIcon: <CheckCircle2 className="h-16 w-16 text-secondary-100 mx-auto mb-6" />,
        emptyAction: '去购物',
        emptyActionLink: '/',
    },
    {
        key: 'cancelled',
        label: '已取消',
        emptyTitle: '暂无已取消订单',
        emptyDesc: '取消的订单会显示在这里',
        emptyIcon: <XCircle className="h-16 w-16 text-secondary-100 mx-auto mb-6" />,
        emptyAction: '去逛逛',
        emptyActionLink: '/',
    },
]

export default function OrdersPage() {
    const navigate = useNavigate()
    const { isAuthenticated } = useAuth()
    const { addToCart } = useCart()
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [activeTab, setActiveTab] = useState<TabKey>('all')
    const [buyingAgainOrderId, setBuyingAgainOrderId] = useState<number | null>(null)

    const fetchOrders = async () => {
        if (!isAuthenticated) {
            setLoading(false)
            return
        }
        setLoading(true)
        setError('')
        try {
            const { data } = await orderApi.getMyOrders()
            if (Array.isArray(data) && data.length > 0) {
                setOrders(data)
            } else {
                setOrders(MOCK_ORDERS)
            }
        } catch (err: any) {
            setOrders(MOCK_ORDERS)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchOrders()
    }, [isAuthenticated])

    const handleBuyAgain = async (order: Order) => {
        if (!order || order.items.length === 0) return
        setBuyingAgainOrderId(order.id)
        try {
            const products = await Promise.all(
                order.items.map(async (item) => {
                    try {
                        const { data } = await productApi.getById(item.product_id)
                        return data
                    } catch {
                        return MOCK_PRODUCTS.find(p => p.id === item.product_id) || buildFallbackProduct(item)
                    }
                })
            )
            for (const [i, product] of products.entries()) {
                const item = order.items[i]
                await addToCart(product, item.quantity, item.specs || {})
            }
            navigate('/cart')
        } catch (err: any) {
            console.error('再次购买失败:', err)
            alert('添加购物车失败，请稍后重试')
        } finally {
            setBuyingAgainOrderId(null)
        }
    }

    const handlePayOrder = async (orderId: number) => {
        try {
            const { data } = await orderApi.pay(orderId)
            setOrders(prev => prev.map(o => o.id === orderId ? data : o))
        } catch (err: any) {
            alert(extractApiError(err, '支付失败'))
        }
    }

    const handleCancelOrder = async (orderId: number) => {
        if (!confirm('确定要取消该订单吗？')) return
        try {
            const { data } = await orderApi.cancel(orderId)
            setOrders(prev => prev.map(o => o.id === orderId ? data : o))
        } catch (err: any) {
            alert(extractApiError(err, '取消订单失败'))
        }
    }

    const handleReceiveOrder = async (orderId: number) => {
        if (!confirm('确认已收到商品吗？')) return
        try {
            const { data } = await orderApi.receive(orderId)
            setOrders(prev => prev.map(o => o.id === orderId ? data : o))
        } catch (err: any) {
            alert(extractApiError(err, '确认收货失败'))
        }
    }

    const filteredOrders = activeTab === 'all'
        ? orders
        : orders.filter(o => o.status === activeTab)

    const activeTabConfig = TABS.find(t => t.key === activeTab) || TABS[0]

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

            <div className="sticky top-[73px] z-40 bg-white/80 backdrop-blur-xl border-b border-secondary-50">
                <div className="max-w-4xl mx-auto px-6">
                    <div className="flex gap-2 overflow-x-auto py-3 scrollbar-hide">
                        {TABS.map((tab) => {
                            const isActive = activeTab === tab.key
                            const count = tab.key === 'all'
                                ? orders.length
                                : orders.filter(o => o.status === tab.key).length
                            return (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`flex-shrink-0 px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                                        isActive
                                            ? 'bg-secondary-900 text-white shadow-lg shadow-secondary-900/20'
                                            : 'bg-secondary-50 text-secondary-500 hover:bg-secondary-100 hover:text-secondary-700'
                                    }`}
                                >
                                    {tab.label}
                                    <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] ${
                                        isActive
                                            ? 'bg-white/20 text-white'
                                            : 'bg-white text-secondary-400'
                                    }`}>
                                        {count}
                                    </span>
                                </button>
                            )
                        })}
                    </div>
                </div>
            </div>

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
                ) : filteredOrders.length === 0 ? (
                    <div className="text-center py-24 bg-white rounded-[2.5rem] border-2 border-dashed border-secondary-200">
                        {activeTabConfig.emptyIcon}
                        <h3 className="text-xl font-black text-secondary-900 mb-2 italic">{activeTabConfig.emptyTitle}</h3>
                        <p className="text-secondary-400 font-bold mb-8">{activeTabConfig.emptyDesc}</p>
                        <Link to={activeTabConfig.emptyActionLink} className="inline-block px-10 py-4 bg-primary text-white rounded-2xl font-black text-xs hover:bg-primary-600 transition-all shadow-xl shadow-primary/20 uppercase tracking-widest">
                            {activeTabConfig.emptyAction}
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {filteredOrders.map((order) => {
                            const isBuyingAgain = buyingAgainOrderId === order.id
                            return (
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
                                                <Link to={`/product/${item.product_id}`} className="shrink-0">
                                                    <img src={item.product_image} alt="" className="w-20 h-20 rounded-2xl object-cover border border-secondary-100 shadow-sm hover:scale-105 transition-transform" />
                                                </Link>
                                                <div className="flex-1">
                                                    <Link to={`/product/${item.product_id}`}>
                                                        <h3 className="font-black text-secondary-900 italic tracking-tighter mb-1 uppercase hover:text-primary transition-colors">{item.product_name}</h3>
                                                    </Link>
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

                                    <div className="px-10 py-8 bg-secondary-50/50 border-t border-secondary-50">
                                        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-xs font-black text-secondary-400 uppercase tracking-widest">实付款</span>
                                                <span className="text-2xl font-black text-secondary-900 italic tracking-tighter">¥{order.total_amount.toFixed(2)}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-3 justify-end">
                                            <button
                                                onClick={() => navigate(`/orders/${order.id}`)}
                                                className="px-6 py-2.5 rounded-xl border-2 border-secondary-100 text-secondary-600 font-black text-xs hover:bg-white hover:border-secondary-200 transition-all uppercase tracking-widest"
                                            >
                                                查看详情
                                            </button>
                                            {order.status === 'pending' && (
                                                <>
                                                    <button
                                                        onClick={() => handleCancelOrder(order.id)}
                                                        className="px-6 py-2.5 rounded-xl border-2 border-red-100 text-red-500 font-black text-xs hover:bg-red-50 transition-all uppercase tracking-widest"
                                                    >
                                                        取消订单
                                                    </button>
                                                    <button
                                                        onClick={() => handlePayOrder(order.id)}
                                                        className="px-6 py-2.5 bg-primary text-white rounded-xl font-black text-xs hover:bg-primary-600 transition-all shadow-lg shadow-primary/20 uppercase tracking-widest flex items-center gap-2"
                                                    >
                                                        <Zap className="h-3 w-3 fill-white" />
                                                        立即支付
                                                    </button>
                                                </>
                                            )}
                                            {order.status === 'shipped' && (
                                                <button
                                                    onClick={() => handleReceiveOrder(order.id)}
                                                    className="px-6 py-2.5 bg-secondary-900 text-white rounded-xl font-black text-xs hover:bg-primary transition-all shadow-lg shadow-secondary-900/10 uppercase tracking-widest"
                                                >
                                                    确认收货
                                                </button>
                                            )}
                                            {order.status !== 'cancelled' && (
                                                <button
                                                    onClick={() => handleBuyAgain(order)}
                                                    disabled={isBuyingAgain}
                                                    className="px-6 py-2.5 bg-primary text-white rounded-xl font-black text-xs hover:bg-primary-600 transition-all shadow-lg shadow-primary/20 uppercase tracking-widest flex items-center gap-2 disabled:opacity-50"
                                                >
                                                    {isBuyingAgain ? (
                                                        <Loader2 className="h-3 w-3 animate-spin" />
                                                    ) : (
                                                        <ShoppingCart className="h-3 w-3" />
                                                    )}
                                                    再次购买
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </main>
        </div>
    )
}
