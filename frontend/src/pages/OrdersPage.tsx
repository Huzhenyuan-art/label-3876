import React from 'react'
import { ArrowLeft, Package, Clock, CheckCircle2, Truck } from 'lucide-react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { Product } from '../types'

const MOCK_ORDERS = [
    {
        id: 'ORD-20240301-001',
        date: '2024-03-01 14:30',
        status: '待收货',
        totalPrice: 1299.00,
        items: [
            { id: 1, name: '降噪无线蓝牙耳机 Pro', price: 1299.00, quantity: 1, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=200', description: '采用主动降噪技术，为您带来沉浸式听觉盛宴。', stock: 50, sales: 1200, main_image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e', shop_id: 1, created_at: '2024-01-01' }
        ]
    },
    {
        id: 'ORD-20240228-042',
        date: '2024-02-28 09:15',
        status: '已完成',
        totalPrice: 499.00,
        items: [
            { id: 3, name: '机械键盘 C1', price: 499.00, quantity: 1, image: 'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?auto=format&fit=crop&q=80&w=200', description: '青轴质感，清脆回弹，码字如飞。', stock: 30, sales: 600, main_image: 'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae', shop_id: 1, created_at: '2024-01-03' }
        ]
    }
]

export default function OrdersPage() {
    const navigate = useNavigate()
    const { addToCart } = useCart()

    const getStatusIcon = (status: string) => {
        switch (status) {
            case '待收货': return <Truck className="h-4 w-4 text-primary" />
            case '已完成': return <CheckCircle2 className="h-4 w-4 text-green-500" />
            default: return <Clock className="h-4 w-4 text-secondary-400" />
        }
    }

    const handleBuyAgain = (items: any[]) => {
        items.forEach(item => {
            const product: Product = {
                id: item.id,
                name: item.name,
                description: item.description,
                price: item.price,
                original_price: null,
                stock: item.stock,
                sales: item.sales,
                main_image: item.main_image,
                images: null,
                specs: null,
                shop_id: item.shop_id,
                created_at: item.created_at
            }
            addToCart(product, item.quantity)
        })
        navigate('/cart')
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
                <div className="space-y-6">
                    {MOCK_ORDERS.map((order) => (
                        <div key={order.id} className="bg-white rounded-[2.5rem] shadow-xl border border-secondary-50 overflow-hidden hover:shadow-2xl transition-all duration-500">
                            <div className="px-10 py-6 border-b border-secondary-50 bg-secondary-50/20 flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white rounded-2xl shadow-sm flex items-center justify-center border border-secondary-100">
                                        <Package className="h-5 w-5 text-secondary-400" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-secondary-400 uppercase tracking-widest">订单号：{order.id}</p>
                                        <p className="text-xs font-bold text-secondary-500">{order.date}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-secondary-100 shadow-sm">
                                    {getStatusIcon(order.status)}
                                    <span className="text-xs font-black text-secondary-900">{order.status}</span>
                                </div>
                            </div>

                            <div className="p-10 space-y-6">
                                {order.items.map((item) => (
                                    <div key={item.id} className="flex gap-6 items-center">
                                        <img src={item.image} alt="" className="w-20 h-20 rounded-2xl object-cover border border-secondary-100 shadow-sm" />
                                        <div className="flex-1">
                                            <h3 className="font-black text-secondary-900 italic tracking-tighter mb-1 uppercase">{item.name}</h3>
                                            <p className="text-xs font-bold text-secondary-400 uppercase tracking-widest">数量：{item.quantity}</p>
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
                                    <span className="text-2xl font-black text-secondary-900 italic tracking-tighter">¥{order.totalPrice.toFixed(2)}</span>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => navigate(`/orders/${order.id}`)}
                                        className="px-6 py-2.5 rounded-xl border-2 border-secondary-100 text-secondary-600 font-black text-xs hover:bg-white hover:border-secondary-200 transition-all uppercase tracking-widest"
                                    >
                                        查看详情
                                    </button>
                                    <button
                                        onClick={() => handleBuyAgain(order.items)}
                                        className="px-6 py-2.5 bg-secondary-900 text-white rounded-xl font-black text-xs hover:bg-primary transition-all shadow-lg shadow-secondary-900/10 uppercase tracking-widest"
                                    >
                                        再次购买
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {MOCK_ORDERS.length === 0 && (
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
            </main>
        </div>
    )
}
