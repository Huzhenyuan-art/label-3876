import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { ArrowLeft, Package, Truck, CheckCircle2, MapPin, CreditCard, Clock, Loader2, AlertCircle, XCircle, ShoppingCart, Zap, PackageCheck } from 'lucide-react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { Order, ORDER_STATUS_MAP, OrderTimelineItem, OrderStatus, Product } from '../types'
import { orderApi, productApi } from '../api'
import { MOCK_ORDERS, MOCK_PRODUCTS } from '../mocks'

const formatDate = (dateStr: string): string => {
    try {
        const d = new Date(dateStr)
        const pad = (n: number) => n.toString().padStart(2, '0')
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
    } catch {
        return dateStr
    }
}

const addHours = (dateStr: string, hours: number): string => {
    try {
        const d = new Date(dateStr)
        d.setHours(d.getHours() + hours)
        return formatDate(d.toISOString())
    } catch {
        return dateStr
    }
}

const maskPhone = (phone: string): string => {
    if (!phone || phone.length < 7) return phone || ''
    return phone.slice(0, 3) + '****' + phone.slice(-4)
}

const generateTimeline = (order: Order): OrderTimelineItem[] => {
    const timeline: OrderTimelineItem[] = []
    const created = order.created_at
    const updated = order.updated_at
    const statusFlow: OrderStatus[] = ['pending', 'paid', 'shipped', 'delivered', 'completed']
    const statusIndex = statusFlow.indexOf(order.status)

    if (order.status === 'cancelled') {
        timeline.push({
            status: '订单已取消',
            time: formatDate(updated),
            desc: '您的订单已取消',
            active: true,
        })
        timeline.push({
            status: '已下单',
            time: formatDate(created),
            desc: '您的订单已提交成功',
            active: false,
        })
        return timeline
    }

    if (statusIndex >= 4) {
        timeline.push({
            status: '订单已完成',
            time: formatDate(updated),
            desc: '感谢您的购买，期待再次光临',
            active: true,
        })
    }
    if (statusIndex >= 3) {
        timeline.push({
            status: '已确认收货',
            time: statusIndex === 3 ? formatDate(updated) : addHours(created, 96),
            desc: statusIndex === 3 ? '您已确认收货，订单即将完成' : '您已确认签收商品',
            active: statusIndex === 3,
        })
    }
    if (statusIndex >= 2) {
        timeline.push({
            status: '派送中',
            time: addHours(created, 72),
            desc: `【${order.shipping_method || '快递'}】快递员正在为您派送，请保持电话畅通`,
            active: false,
        })
    }
    if (statusIndex >= 2) {
        timeline.push({
            status: '运输中',
            time: addHours(created, 36),
            desc: '您的包裹已到达转运中心，正在分拣中',
            active: false,
        })
    }
    if (statusIndex >= 2) {
        timeline.push({
            status: '已发货',
            time: statusIndex === 2 ? formatDate(updated) : addHours(created, 24),
            desc: statusIndex === 2 ? '卖家已发货，包裹正在快马加鞭送往您身边' : '卖家已将包裹交由快递公司',
            active: statusIndex === 2,
        })
    }
    if (statusIndex >= 1) {
        timeline.push({
            status: '已支付',
            time: addHours(created, 0.1),
            desc: statusIndex === 1 ? '支付成功，等待卖家发货' : '您已完成支付',
            active: statusIndex === 1,
        })
    }
    if (statusIndex >= 0) {
        timeline.push({
            status: '已下单',
            time: formatDate(created),
            desc: statusIndex === 0 ? '订单提交成功，请尽快完成支付' : '您的订单已提交成功',
            active: statusIndex === 0,
        })
    }

    return timeline
}

const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
        case 'completed':
            return { text: ORDER_STATUS_MAP[status], icon: CheckCircle2, color: 'text-green-400' }
        case 'delivered':
        case 'shipped':
            return { text: ORDER_STATUS_MAP[status], icon: Truck, color: 'text-primary' }
        case 'paid':
            return { text: ORDER_STATUS_MAP[status], icon: Package, color: 'text-blue-400' }
        case 'cancelled':
            return { text: ORDER_STATUS_MAP[status], icon: XCircle, color: 'text-red-400' }
        case 'pending':
            return { text: ORDER_STATUS_MAP[status], icon: Clock, color: 'text-yellow-400' }
        default:
            return { text: ORDER_STATUS_MAP[status] || status, icon: Package, color: 'text-white' }
    }
}

export default function OrderDetailPage() {
    const navigate = useNavigate()
    const { id } = useParams()
    const { isAuthenticated } = useAuth()
    const { addToCart } = useCart()
    const [order, setOrder] = useState<Order | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [cancelling, setCancelling] = useState(false)
    const [paying, setPaying] = useState(false)
    const [shipping, setShipping] = useState(false)
    const [receiving, setReceiving] = useState(false)
    const [completing, setCompleting] = useState(false)
    const [buyingAgain, setBuyingAgain] = useState(false)

    const fetchOrder = async () => {
        if (!id || !isAuthenticated) {
            setLoading(false)
            return
        }
        setLoading(true)
        setError('')
        try {
            const orderId = parseInt(id, 10)
            if (isNaN(orderId)) {
                setError('订单ID无效')
                setLoading(false)
                return
            }
            try {
                const { data } = await orderApi.getById(orderId)
                setOrder(data)
            } catch (apiErr) {
                const mockOrder = MOCK_ORDERS.find(o => o.id === orderId)
                if (mockOrder) {
                    setOrder(mockOrder)
                } else {
                    throw apiErr
                }
            }
        } catch (err: any) {
            const detail = err?.response?.data?.detail || '加载订单详情失败，请稍后重试'
            setError(typeof detail === 'string' ? detail : '加载订单详情失败，请稍后重试')
        } finally {
            setLoading(false)
        }
    }

    const handleCancel = async () => {
        if (!order) return
        if (!confirm('确定要取消该订单吗？')) return
        setCancelling(true)
        try {
            const { data } = await orderApi.cancel(order.id)
            setOrder(data)
        } catch (err: any) {
            const detail = err?.response?.data?.detail || '取消订单失败'
            alert(typeof detail === 'string' ? detail : '取消订单失败')
        } finally {
            setCancelling(false)
        }
    }

    const handlePay = async () => {
        if (!order) return
        setPaying(true)
        try {
            const { data } = await orderApi.pay(order.id)
            setOrder(data)
        } catch (err: any) {
            const detail = err?.response?.data?.detail || '支付失败'
            alert(typeof detail === 'string' ? detail : '支付失败')
        } finally {
            setPaying(false)
        }
    }

    const handleShip = async () => {
        if (!order) return
        setShipping(true)
        try {
            const { data } = await orderApi.ship(order.id)
            setOrder(data)
        } catch (err: any) {
            const detail = err?.response?.data?.detail || '发货失败'
            alert(typeof detail === 'string' ? detail : '发货失败')
        } finally {
            setShipping(false)
        }
    }

    const handleReceive = async () => {
        if (!order) return
        if (!confirm('确认已收到商品吗？')) return
        setReceiving(true)
        try {
            const { data } = await orderApi.receive(order.id)
            setOrder(data)
        } catch (err: any) {
            const detail = err?.response?.data?.detail || '确认收货失败'
            alert(typeof detail === 'string' ? detail : '确认收货失败')
        } finally {
            setReceiving(false)
        }
    }

    const handleComplete = async () => {
        if (!order) return
        setCompleting(true)
        try {
            const { data } = await orderApi.complete(order.id)
            setOrder(data)
        } catch (err: any) {
            const detail = err?.response?.data?.detail || '完成订单失败'
            alert(typeof detail === 'string' ? detail : '完成订单失败')
        } finally {
            setCompleting(false)
        }
    }

    const handleBuyAgain = async () => {
        if (!order || order.items.length === 0) return
        setBuyingAgain(true)
        try {
            for (const item of order.items) {
                let realProduct: Product | null = null
                try {
                    const { data } = await productApi.getById(item.product_id)
                    realProduct = data
                } catch {
                    realProduct = MOCK_PRODUCTS.find(p => p.id === item.product_id) || null
                }
                if (realProduct) {
                    await addToCart(realProduct, item.quantity, item.specs || {})
                } else {
                    const fallbackProduct: Product = {
                        id: item.product_id,
                        name: item.product_name,
                        description: '',
                        price: item.price,
                        original_price: null,
                        stock: 999,
                        sales: 0,
                        main_image: item.product_image,
                        images: null,
                        specs: null,
                        skus: null,
                        shop_id: 1,
                        category_id: null,
                        created_at: item.created_at,
                    }
                    await addToCart(fallbackProduct, item.quantity, item.specs || {})
                }
            }
            navigate('/cart')
        } catch (err: any) {
            console.error('再次购买失败:', err)
            alert('添加购物车失败，请稍后重试')
        } finally {
            setBuyingAgain(false)
        }
    }

    useEffect(() => {
        fetchOrder()
    }, [id, isAuthenticated])

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-secondary-50/30">
                <header className="bg-white/80 backdrop-blur-xl sticky top-0 z-50 border-b border-secondary-50 shadow-sm">
                    <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="p-2 hover:bg-secondary-50 rounded-xl transition-colors">
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <h1 className="text-xl font-black text-secondary-900 tracking-tighter italic">订单详情</h1>
                    </div>
                </header>
                <main className="max-w-4xl mx-auto px-6 py-24 text-center">
                    <Package className="h-16 w-16 text-secondary-100 mx-auto mb-6" />
                    <h3 className="text-xl font-black text-secondary-900 mb-2 italic">请先登录</h3>
                    <p className="text-secondary-400 font-bold mb-8">登录后即可查看订单详情</p>
                    <Link to="/login" className="inline-block px-10 py-4 bg-primary text-white rounded-2xl font-black text-xs hover:bg-primary-600 transition-all shadow-xl shadow-primary/20 uppercase tracking-widest">
                        去登录
                    </Link>
                </main>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-secondary-50/30">
                <header className="bg-white/80 backdrop-blur-xl sticky top-0 z-50 border-b border-secondary-50 shadow-sm">
                    <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="p-2 hover:bg-secondary-50 rounded-xl transition-colors">
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <h1 className="text-xl font-black text-secondary-900 tracking-tighter italic">订单详情</h1>
                    </div>
                </header>
                <main className="max-w-4xl mx-auto px-6 py-24">
                    <div className="flex flex-col items-center justify-center py-24">
                        <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
                        <p className="text-secondary-400 font-bold uppercase tracking-widest text-xs">加载订单详情中...</p>
                    </div>
                </main>
            </div>
        )
    }

    if (error || !order) {
        return (
            <div className="min-h-screen bg-secondary-50/30">
                <header className="bg-white/80 backdrop-blur-xl sticky top-0 z-50 border-b border-secondary-50 shadow-sm">
                    <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="p-2 hover:bg-secondary-50 rounded-xl transition-colors">
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <h1 className="text-xl font-black text-secondary-900 tracking-tighter italic">订单详情</h1>
                    </div>
                </header>
                <main className="max-w-4xl mx-auto px-6 py-24">
                    <div className="text-center py-24 bg-white rounded-[2.5rem] border-2 border-red-50">
                        <AlertCircle className="h-16 w-16 text-red-300 mx-auto mb-6" />
                        <h3 className="text-xl font-black text-secondary-900 mb-2 italic">{error || '订单不存在'}</h3>
                        <p className="text-secondary-400 font-bold mb-8">无法加载该订单信息</p>
                        <div className="flex gap-4 justify-center">
                            <button onClick={fetchOrder} className="px-8 py-3 bg-primary text-white rounded-2xl font-black text-xs hover:bg-primary-600 transition-all shadow-xl shadow-primary/20 uppercase tracking-widest">
                                重新加载
                            </button>
                            <button onClick={() => navigate('/orders')} className="px-8 py-3 border-2 border-secondary-200 text-secondary-700 rounded-2xl font-black text-xs hover:bg-secondary-50 transition-all uppercase tracking-widest">
                                返回订单列表
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        )
    }

    const timeline = generateTimeline(order)
    const statusBadge = getStatusBadge(order.status)
    const StatusIcon = statusBadge.icon
    const canCancel = order.status === 'pending' || order.status === 'paid'
    const canPay = order.status === 'pending'
    const canShip = order.status === 'paid'
    const canReceive = order.status === 'shipped'
    const canComplete = order.status === 'delivered' || order.status === 'shipped'
    const showActionBar = order.status !== 'cancelled'

    return (
        <div className="min-h-screen bg-secondary-50/30 pb-40">
            <header className="bg-white/80 backdrop-blur-xl sticky top-0 z-50 border-b border-secondary-50 shadow-sm">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-secondary-50 rounded-xl transition-colors">
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <h1 className="text-xl font-black text-secondary-900 tracking-tighter italic">订单详情</h1>
                    {canCancel && (
                        <button
                            onClick={handleCancel}
                            disabled={cancelling}
                            className="ml-auto px-5 py-2 bg-red-50 text-red-600 rounded-xl font-black text-xs hover:bg-red-100 transition-all uppercase tracking-widest border-2 border-red-100 disabled:opacity-50 flex items-center gap-2"
                        >
                            {cancelling ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
                            取消订单
                        </button>
                    )}
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-12">
                <div className="space-y-6">
                    <div className={`rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden ${
                        order.status === 'cancelled' ? 'bg-red-900' :
                        order.status === 'completed' ? 'bg-green-900' :
                        'bg-secondary-900'
                    }`}>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] -mr-32 -mt-32" />
                        <div className="relative z-10 flex items-center gap-5">
                            <StatusIcon className={`h-12 w-12 ${statusBadge.color}`} />
                            <div className="flex-1">
                                <h2 className="text-3xl font-black italic tracking-tighter mb-2 uppercase">{statusBadge.text}</h2>
                                <p className="text-secondary-400 font-bold uppercase tracking-widest text-xs">订单编号：{order.order_no}</p>
                                <p className="text-secondary-500 font-bold uppercase tracking-widest text-[10px] mt-1">下单时间：{formatDate(order.created_at)}</p>
                            </div>
                            {order.status !== 'cancelled' && (
                                <button
                                    onClick={handleBuyAgain}
                                    disabled={buyingAgain}
                                    className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-2xl font-black text-xs uppercase tracking-widest border border-white/20 transition-all disabled:opacity-50"
                                >
                                    {buyingAgain ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
                                    再次购买
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 space-y-6">
                            <section className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-secondary-50">
                                <h3 className="text-xs font-black text-secondary-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                                    <Truck className="h-3 w-3" /> 物流动态
                                </h3>
                                <div className="space-y-8">
                                    {timeline.map((item, idx) => (
                                        <div key={idx} className="flex gap-6 relative">
                                            {idx !== timeline.length - 1 && (
                                                <div className="absolute left-[7px] top-6 w-[2px] h-[calc(100%+8px)] bg-secondary-100" />
                                            )}
                                            <div className={`w-4 h-4 rounded-full mt-1.5 flex-shrink-0 z-10 border-2 ${item.active ? 'bg-primary border-primary shadow-lg shadow-primary/30' : 'bg-white border-secondary-200'}`} />
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className={`text-sm font-black italic tracking-tighter uppercase ${item.active ? 'text-primary' : 'text-secondary-900'}`}>{item.status}</span>
                                                    <span className="text-[10px] font-bold text-secondary-400">{item.time}</span>
                                                </div>
                                                <p className="text-xs font-bold text-secondary-500 leading-relaxed">{item.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-secondary-50">
                                <h3 className="text-xs font-black text-secondary-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                    <Package className="h-3 w-3" /> 商品清单
                                </h3>
                                <div className="space-y-6">
                                    {order.items.map((item) => (
                                        <div key={item.id} className="flex gap-6 items-center">
                                            <Link to={`/product/${item.product_id}`} className="shrink-0">
                                                <img src={item.product_image} alt="" className="w-24 h-24 rounded-2xl object-cover border border-secondary-100 shadow-sm hover:scale-105 transition-transform" />
                                            </Link>
                                            <div className="flex-1">
                                                <Link to={`/product/${item.product_id}`}>
                                                    <h4 className="font-black text-secondary-900 italic tracking-tighter mb-1 uppercase hover:text-primary transition-colors">{item.product_name}</h4>
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
                            </section>
                        </div>

                        <div className="space-y-6">
                            <section className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-secondary-50">
                                <h3 className="text-xs font-black text-secondary-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                    <MapPin className="h-3 w-3" /> 收货地址
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-sm font-black text-secondary-900 uppercase italic tracking-tighter">{order.contact_name || '未填写'}</p>
                                        <p className="text-xs font-bold text-secondary-500">{maskPhone(order.contact_phone) || '未填写电话'}</p>
                                    </div>
                                    <p className="text-xs font-bold text-secondary-500 leading-relaxed">{order.shipping_address || '未填写收货地址'}</p>
                                </div>
                            </section>

                            <section className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-secondary-50">
                                <h3 className="text-xs font-black text-secondary-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                    <CreditCard className="h-3 w-3" /> 支付信息
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-secondary-500">支付方式</span>
                                        <span className="text-xs font-black text-secondary-900 uppercase">{order.payment_method || '未选择'}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-secondary-500">配送方式</span>
                                        <span className="text-xs font-black text-secondary-900 uppercase">{order.shipping_method || '未选择'}</span>
                                    </div>
                                    <div className="h-px bg-secondary-50 my-2" />
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-secondary-500">商品总额</span>
                                        <span className="text-sm font-black text-secondary-900 tabular-nums">¥{order.total_amount.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-secondary-500">运费</span>
                                        <span className="text-sm font-black text-secondary-900 tabular-nums">¥0.00</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-2">
                                        <span className="text-xs font-black text-primary uppercase tracking-widest">实付款</span>
                                        <span className="text-xl font-black text-primary italic tracking-tighter tabular-nums">¥{order.total_amount.toFixed(2)}</span>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            </main>

            {showActionBar && (
                <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-secondary-50 shadow-[0_-8px_32px_rgba(0,0,0,0.06)]">
                    <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-3">
                        <div className="flex-1">
                            <p className="text-[10px] font-black text-secondary-400 uppercase tracking-widest">应付总额</p>
                            <p className="text-2xl font-black text-primary italic tracking-tighter">¥{order.total_amount.toFixed(2)}</p>
                        </div>
                        <div className="flex gap-2 flex-wrap justify-end">
                            {canPay && (
                                <button
                                    onClick={handlePay}
                                    disabled={paying}
                                    className="px-8 py-4 bg-primary text-white rounded-2xl font-black text-xs hover:bg-primary-600 transition-all shadow-xl shadow-primary/20 uppercase tracking-widest flex items-center gap-2 disabled:opacity-50"
                                >
                                    {paying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4 fill-white" />}
                                    立即支付
                                </button>
                            )}
                            {canShip && (
                                <button
                                    onClick={handleShip}
                                    disabled={shipping}
                                    className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 uppercase tracking-widest flex items-center gap-2 disabled:opacity-50"
                                >
                                    {shipping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />}
                                    模拟发货
                                </button>
                            )}
                            {canReceive && (
                                <button
                                    onClick={handleReceive}
                                    disabled={receiving}
                                    className="px-8 py-4 bg-secondary-900 text-white rounded-2xl font-black text-xs hover:bg-primary transition-all shadow-xl shadow-secondary-900/10 uppercase tracking-widest flex items-center gap-2 disabled:opacity-50"
                                >
                                    {receiving ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackageCheck className="h-4 w-4" />}
                                    确认收货
                                </button>
                            )}
                            {canComplete && (
                                <button
                                    onClick={handleComplete}
                                    disabled={completing}
                                    className="px-8 py-4 bg-green-600 text-white rounded-2xl font-black text-xs hover:bg-green-700 transition-all shadow-xl shadow-green-600/20 uppercase tracking-widest flex items-center gap-2 disabled:opacity-50"
                                >
                                    {completing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                                    完成订单
                                </button>
                            )}
                            <button
                                onClick={handleBuyAgain}
                                disabled={buyingAgain}
                                className="px-8 py-4 border-2 border-secondary-200 text-secondary-700 rounded-2xl font-black text-xs hover:bg-secondary-50 hover:border-secondary-300 transition-all uppercase tracking-widest flex items-center gap-2 disabled:opacity-50"
                            >
                                {buyingAgain ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
                                再次购买
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
