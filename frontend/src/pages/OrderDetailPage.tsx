import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { ArrowLeft, Package, Truck, CheckCircle2, MapPin, CreditCard, Clock, Loader2, AlertCircle, XCircle } from 'lucide-react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { Order, ORDER_STATUS_MAP, OrderTimelineItem, OrderStatus } from '../types'
import { orderApi } from '../api'
import { MOCK_ORDERS } from '../mocks'

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
    const statusFlow: OrderStatus[] = ['pending', 'paid', 'shipped', 'delivered', 'completed']
    const statusIndex = statusFlow.indexOf(order.status)

    if (order.status === 'cancelled') {
        timeline.push({
            status: '订单已取消',
            time: formatDate(order.updated_at),
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
            time: addHours(created, 120),
            desc: '感谢您的购买，期待再次光临',
            active: true,
        })
    }
    if (statusIndex >= 3) {
        timeline.push({
            status: '订单已收货',
            time: addHours(created, 96),
            desc: '您的订单已签收',
            active: statusIndex === 3,
        })
    }
    if (statusIndex >= 2) {
        timeline.push({
            status: '派送中',
            time: addHours(created, 72),
            desc: `【${order.shipping_method || '快递'}】快递员正在为您派送`,
            active: statusIndex === 2,
        })
    }
    if (statusIndex >= 2) {
        timeline.push({
            status: '运输中',
            time: addHours(created, 36),
            desc: '您的订单已到达转运中心',
            active: false,
        })
    }
    if (statusIndex >= 1) {
        timeline.push({
            status: '已发货',
            time: addHours(created, 24),
            desc: '卖家已发货',
            active: statusIndex === 1,
        })
    }
    if (statusIndex >= 0) {
        timeline.push({
            status: '已下单',
            time: formatDate(created),
            desc: statusIndex === 0 ? '等待支付中...' : '您的订单已提交成功',
            active: statusIndex === 0,
        })
    }

    return timeline
}

const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
        case 'completed':
            return { text: ORDER_STATUS_MAP[status], icon: CheckCircle2, color: 'text-green-400' }
        case 'shipped':
        case 'delivered':
            return { text: ORDER_STATUS_MAP[status], icon: Truck, color: 'text-primary' }
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
    const [order, setOrder] = useState<Order | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [cancelling, setCancelling] = useState(false)

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

    return (
        <div className="min-h-screen bg-secondary-50/30">
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
                            <div>
                                <h2 className="text-3xl font-black italic tracking-tighter mb-2 uppercase">{statusBadge.text}</h2>
                                <p className="text-secondary-400 font-bold uppercase tracking-widest text-xs">订单编号：{order.order_no}</p>
                                <p className="text-secondary-500 font-bold uppercase tracking-widest text-[10px] mt-1">下单时间：{formatDate(order.created_at)}</p>
                            </div>
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
                                            <img src={item.product_image} alt="" className="w-24 h-24 rounded-2xl object-cover border border-secondary-100 shadow-sm" />
                                            <div className="flex-1">
                                                <h4 className="font-black text-secondary-900 italic tracking-tighter mb-1 uppercase">{item.product_name}</h4>
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
        </div>
    )
}
