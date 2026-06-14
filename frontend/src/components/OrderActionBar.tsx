import React from 'react'
import { Order } from '../types'
import { ORDER_STATUS_MAP } from '../types'
import { Zap, Loader2, Truck, PackageCheck, CheckCircle2, ShoppingCart } from 'lucide-react'

interface OrderActionBarProps {
    order: Order
    paying: boolean
    shipping: boolean
    receiving: boolean
    completing: boolean
    buyingAgain: boolean
    onPay: () => void
    onShip: () => void
    onReceive: () => void
    onComplete: () => void
    onBuyAgain: () => void
}

export const OrderActionBar: React.FC<OrderActionBarProps> = ({
    order,
    paying,
    shipping,
    receiving,
    completing,
    buyingAgain,
    onPay,
    onShip,
    onReceive,
    onComplete,
    onBuyAgain,
}) => {
    const canPay = order.status === 'pending'
    const canShip = order.status === 'paid'
    const canReceive = order.status === 'shipped'
    const canComplete = order.status === 'delivered' || order.status === 'shipped'
    const showActionBar = order.status !== 'cancelled'

    if (!showActionBar) return null

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-secondary-50 shadow-[0_-8px_32px_rgba(0,0,0,0.06)]">
            <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-3">
                <div className="flex-1">
                    <p className="text-[10px] font-black text-secondary-400 uppercase tracking-widest">应付总额</p>
                    <p className="text-2xl font-black text-primary italic tracking-tighter">¥{order.total_amount.toFixed(2)}</p>
                </div>
                <div className="flex gap-2 flex-wrap justify-end">
                    {canPay && (
                        <button onClick={onPay} disabled={paying} className="px-8 py-4 bg-primary text-white rounded-2xl font-black text-xs hover:bg-primary-600 transition-all shadow-xl shadow-primary/20 uppercase tracking-widest flex items-center gap-2 disabled:opacity-50">
                            {paying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4 fill-white" />}
                            立即支付
                        </button>
                    )}
                    {canShip && (
                        <button onClick={onShip} disabled={shipping} className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 uppercase tracking-widest flex items-center gap-2 disabled:opacity-50">
                            {shipping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />}
                            模拟发货
                        </button>
                    )}
                    {canReceive && (
                        <button onClick={onReceive} disabled={receiving} className="px-8 py-4 bg-secondary-900 text-white rounded-2xl font-black text-xs hover:bg-primary transition-all shadow-xl shadow-secondary-900/10 uppercase tracking-widest flex items-center gap-2 disabled:opacity-50">
                            {receiving ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackageCheck className="h-4 w-4" />}
                            确认收货
                        </button>
                    )}
                    {canComplete && (
                        <button onClick={onComplete} disabled={completing} className="px-8 py-4 bg-green-600 text-white rounded-2xl font-black text-xs hover:bg-green-700 transition-all shadow-xl shadow-green-600/20 uppercase tracking-widest flex items-center gap-2 disabled:opacity-50">
                            {completing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                            完成订单
                        </button>
                    )}
                    <button onClick={onBuyAgain} disabled={buyingAgain} className="px-8 py-4 border-2 border-secondary-200 text-secondary-700 rounded-2xl font-black text-xs hover:bg-secondary-50 hover:border-secondary-300 transition-all uppercase tracking-widest flex items-center gap-2 disabled:opacity-50">
                        {buyingAgain ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
                        再次购买
                    </button>
                </div>
            </div>
        </div>
    )
}
