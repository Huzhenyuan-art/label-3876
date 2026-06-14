import { Order, OrderStatus, OrderTimelineItem, ORDER_STATUS_MAP, Product } from '../types'
import { Truck, CheckCircle2, Clock, XCircle, Package } from 'lucide-react'

export const formatDate = (dateStr: string): string => {
    try {
        const d = new Date(dateStr)
        const pad = (n: number) => n.toString().padStart(2, '0')
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
    } catch {
        return dateStr
    }
}

export const addHours = (dateStr: string, hours: number): string => {
    try {
        const d = new Date(dateStr)
        d.setHours(d.getHours() + hours)
        return formatDate(d.toISOString())
    } catch {
        return dateStr
    }
}

export const maskPhone = (phone: string): string => {
    if (!phone || phone.length < 7) return phone || ''
    return phone.slice(0, 3) + '****' + phone.slice(-4)
}

export const generateTimeline = (order: Order): OrderTimelineItem[] => {
    const timeline: OrderTimelineItem[] = []
    const created = order.created_at
    const updated = order.updated_at
    const statusFlow: OrderStatus[] = ['pending', 'paid', 'shipped', 'delivered', 'completed']
    const statusIndex = statusFlow.indexOf(order.status)

    if (order.status === 'cancelled') {
        timeline.push({ status: '订单已取消', time: formatDate(updated), desc: '您的订单已取消', active: true })
        timeline.push({ status: '已下单', time: formatDate(created), desc: '您的订单已提交成功', active: false })
        return timeline
    }

    if (statusIndex >= 4) {
        timeline.push({ status: '订单已完成', time: formatDate(updated), desc: '感谢您的购买，期待再次光临', active: true })
    }
    if (statusIndex >= 3) {
        timeline.push({ status: '已确认收货', time: statusIndex === 3 ? formatDate(updated) : addHours(created, 96), desc: statusIndex === 3 ? '您已确认收货，订单即将完成' : '您已确认签收商品', active: statusIndex === 3 })
    }
    if (statusIndex >= 2) {
        timeline.push({ status: '派送中', time: addHours(created, 72), desc: `【${order.shipping_method || '快递'}】快递员正在为您派送，请保持电话畅通`, active: false })
    }
    if (statusIndex >= 2) {
        timeline.push({ status: '运输中', time: addHours(created, 36), desc: '您的包裹已到达转运中心，正在分拣中', active: false })
    }
    if (statusIndex >= 2) {
        timeline.push({ status: '已发货', time: statusIndex === 2 ? formatDate(updated) : addHours(created, 24), desc: statusIndex === 2 ? '卖家已发货，包裹正在快马加鞭送往您身边' : '卖家已将包裹交由快递公司', active: statusIndex === 2 })
    }
    if (statusIndex >= 1) {
        timeline.push({ status: '已支付', time: addHours(created, 0.1), desc: statusIndex === 1 ? '支付成功，等待卖家发货' : '您已完成支付', active: statusIndex === 1 })
    }
    if (statusIndex >= 0) {
        timeline.push({ status: '已下单', time: formatDate(created), desc: statusIndex === 0 ? '订单提交成功，请尽快完成支付' : '您的订单已提交成功', active: statusIndex === 0 })
    }

    return timeline
}

export interface StatusBadge {
    text: string
    icon: React.ComponentType<{ className?: string }>
    color: string
}

export const getStatusBadge = (status: OrderStatus): StatusBadge => {
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

export const getStatusIcon = (status: OrderStatus) => {
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

export const buildFallbackProduct = (item: { product_id: number; product_name: string; product_image: string; price: number; created_at: string }): Product => ({
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
})
