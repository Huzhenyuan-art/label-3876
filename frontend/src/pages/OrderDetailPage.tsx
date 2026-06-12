import { useAuth } from '../contexts/AuthContext'
import { ArrowLeft, Package, Truck, CheckCircle2, MapPin, CreditCard, Clock } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

const MOCK_ORDER_DETAIL = {
    id: 'ORD-20240301-001',
    date: '2024-03-01 14:30',
    status: '待收货',
    totalPrice: 1299.00,
    shippingAddress: {
        name: 'PREMIUM USER',
        phone: '138****8888',
        address: '北京市 朝阳区 建国门外大街 1号院'
    },
    paymentMethod: '支付宝',
    shippingMethod: '顺丰特快',
    items: [
        { id: 1, name: '降噪无线蓝牙耳机 Pro', price: 1299.00, quantity: 1, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=200' }
    ],
    timeline: [
        { status: '订单已收货', time: '2024-03-02 10:00', desc: '您的订单已签收', active: false },
        { status: '派送中', time: '2024-03-02 08:30', desc: '【北京市】顺丰快递员 正在为您派送', active: true },
        { status: '运输中', time: '2024-03-01 22:00', desc: '您的订单已到达【北京转运中心】', active: false },
        { status: '已发货', time: '2024-03-01 18:00', desc: '卖家已发货', active: false },
        { status: '已下单', time: '2024-03-01 14:30', desc: '您的订单已提交成功', active: false }
    ]
}

export default function OrderDetailPage() {
    const navigate = useNavigate()
    const { id } = useParams()

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

            <main className="max-w-4xl mx-auto px-6 py-12">
                <div className="space-y-6">
                    {/* Status Card */}
                    <div className="bg-secondary-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] -mr-32 -mt-32" />
                        <div className="relative z-10">
                            <h2 className="text-3xl font-black italic tracking-tighter mb-2 uppercase">订单{MOCK_ORDER_DETAIL.status}</h2>
                            <p className="text-secondary-400 font-bold uppercase tracking-widest text-xs">订单编号：{id}</p>
                        </div>
                    </div>

                    {/* Timeline & Address */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 space-y-6">
                            <section className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-secondary-50">
                                <h3 className="text-xs font-black text-secondary-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                                    <Truck className="h-3 w-3" /> 物流动态
                                </h3>
                                <div className="space-y-8">
                                    {MOCK_ORDER_DETAIL.timeline.map((item, idx) => (
                                        <div key={idx} className="flex gap-6 relative">
                                            {idx !== MOCK_ORDER_DETAIL.timeline.length - 1 && (
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
                                    {MOCK_ORDER_DETAIL.items.map((item) => (
                                        <div key={item.id} className="flex gap-6 items-center">
                                            <img src={item.image} alt="" className="w-24 h-24 rounded-2xl object-cover border border-secondary-100 shadow-sm" />
                                            <div className="flex-1">
                                                <h4 className="font-black text-secondary-900 italic tracking-tighter mb-1 uppercase">{item.name}</h4>
                                                <p className="text-xs font-bold text-secondary-400 uppercase tracking-widest">数量：{item.quantity}</p>
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
                                        <p className="text-sm font-black text-secondary-900 uppercase italic tracking-tighter">{MOCK_ORDER_DETAIL.shippingAddress.name}</p>
                                        <p className="text-xs font-bold text-secondary-500">{MOCK_ORDER_DETAIL.shippingAddress.phone}</p>
                                    </div>
                                    <p className="text-xs font-bold text-secondary-500 leading-relaxed">{MOCK_ORDER_DETAIL.shippingAddress.address}</p>
                                </div>
                            </section>

                            <section className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-secondary-50">
                                <h3 className="text-xs font-black text-secondary-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                    <CreditCard className="h-3 w-3" /> 支付信息
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-secondary-500">支付方式</span>
                                        <span className="text-xs font-black text-secondary-900 uppercase">{MOCK_ORDER_DETAIL.paymentMethod}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-secondary-500">配送方式</span>
                                        <span className="text-xs font-black text-secondary-900 uppercase">{MOCK_ORDER_DETAIL.shippingMethod}</span>
                                    </div>
                                    <div className="h-px bg-secondary-50 my-2" />
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-secondary-500">商品总额</span>
                                        <span className="text-sm font-black text-secondary-900 tabular-nums">¥{MOCK_ORDER_DETAIL.totalPrice.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-secondary-500">运费</span>
                                        <span className="text-sm font-black text-secondary-900 tabular-nums">¥0.00</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-2">
                                        <span className="text-xs font-black text-primary uppercase tracking-widest">实付款</span>
                                        <span className="text-xl font-black text-primary italic tracking-tighter tabular-nums">¥{MOCK_ORDER_DETAIL.totalPrice.toFixed(2)}</span>
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
