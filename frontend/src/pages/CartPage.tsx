import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ShoppingBag, Trash2, Minus, Plus, Zap, Check, ShieldCheck, Circle, X } from 'lucide-react'
import { Header } from '../components/Header'
import { useCart } from '../contexts/CartContext'
import { useAuth } from '../contexts/AuthContext'
import { orderApi } from '../api'
import { OrderItemCreate } from '../types'

export default function CartPage() {
    const navigate = useNavigate()
    const { items, updateQuantity, removeFromCart, totalPrice, totalItems, clearCart, toggleSelect, toggleSelectAll, removeSelected, selectedItems, selectedTotalPrice, isAllSelected } = useCart()
    const { isAuthenticated, user } = useAuth()
    const [isProcessing, setIsProcessing] = useState(false)
    const [showSuccess, setShowSuccess] = useState(false)
    const [showCheckoutForm, setShowCheckoutForm] = useState(false)
    const [orderError, setOrderError] = useState('')
    const [createdOrderNo, setCreatedOrderNo] = useState('')
    const [shippingForm, setShippingForm] = useState({
        contact_name: user?.nickname || user?.username || '',
        contact_phone: '',
        shipping_address: '',
        payment_method: '支付宝',
        shipping_method: '顺丰特快'
    })

    const handleCheckout = () => {
        if (!isAuthenticated) {
            navigate('/login', { state: { from: '/cart' } })
            return
        }
        if (selectedItems === 0) {
            return
        }
        setShowCheckoutForm(true)
    }

    const submitOrder = async () => {
        if (!shippingForm.contact_name.trim()) {
            setOrderError('请填写收货人姓名')
            return
        }
        if (!shippingForm.contact_phone.trim()) {
            setOrderError('请填写联系电话')
            return
        }
        if (!shippingForm.shipping_address.trim()) {
            setOrderError('请填写收货地址')
            return
        }
        setOrderError('')
        setIsProcessing(true)
        try {
            const selectedCartItems = items.filter((item) => item.selected)
            const orderItems: OrderItemCreate[] = selectedCartItems.map((item) => ({
                product_id: item.id,
                product_name: item.name,
                product_image: item.main_image,
                price: item.price,
                quantity: item.quantity,
                specs: item.selectedSpecs || null,
            }))
            const { data: createdOrder } = await orderApi.create({
                items: orderItems,
                shipping_address: shippingForm.shipping_address,
                contact_name: shippingForm.contact_name,
                contact_phone: shippingForm.contact_phone,
                payment_method: shippingForm.payment_method,
                shipping_method: shippingForm.shipping_method,
            })
            const { data: paidOrder } = await orderApi.pay(createdOrder.id)
            setCreatedOrderNo(paidOrder.order_no)
            setIsProcessing(false)
            setShowCheckoutForm(false)
            setShowSuccess(true)
            setTimeout(async () => {
                setShowSuccess(false)
                try {
                    await removeSelected()
                } catch (error) {
                    console.error('Failed to remove selected items:', error)
                }
                navigate('/orders')
            }, 4000)
        } catch (err: any) {
            setIsProcessing(false)
            const detail = err?.response?.data?.detail || '支付失败，请稍后重试'
            setOrderError(typeof detail === 'string' ? detail : '支付失败，请稍后重试')
        }
    }

    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-secondary-50/50">
                <Header showSearch={false} />
                <main className="max-w-7xl mx-auto px-4 py-16 text-center">
                    <div className="bg-white rounded-[2.5rem] p-16 shadow-2xl border border-white max-w-lg mx-auto mt-10">
                        <ShoppingBag className="h-20 w-20 text-secondary-100 mx-auto mb-8 animate-in zoom-in duration-700" />
                        <h2 className="text-3xl font-black text-secondary-900 mb-4 tracking-tighter italic">购物车是空的</h2>
                        <button onClick={() => navigate('/')} className="w-full bg-primary text-white py-5 rounded-2xl font-black text-sm hover:bg-primary-600 shadow-2xl active:scale-95 uppercase tracking-[0.2em]">去逛逛精选</button>
                    </div>
                </main>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-secondary-50/50">
            <Header showSearch={false} />
            <main className="max-w-7xl mx-auto px-6 py-10">
                <div className="flex items-center gap-6 mb-12 animate-in slide-in-from-left duration-500">
                    <button onClick={() => navigate(-1)} className="p-3 bg-white border border-secondary-100 text-secondary-400 hover:text-primary active:scale-90 rounded-2xl shadow-sm"><ArrowLeft className="h-5 w-5" /></button>
                    <h1 className="text-3xl font-black text-secondary-900 tracking-tighter italic">我的购物车 / {totalItems} ITEMS</h1>
                </div>
                <div className="flex flex-col lg:flex-row gap-10 items-start pb-32">
                    <div className="lg:col-span-2 flex-1 space-y-6">
                        <div className="flex items-center gap-4 px-2">
                            <button
                                onClick={() => toggleSelectAll(!isAllSelected)}
                                className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${isAllSelected ? 'bg-primary border-primary' : 'border-secondary-200 bg-white hover:border-primary'}`}
                            >
                                {isAllSelected && <Check className="h-4 w-4 text-white" strokeWidth={3} />}
                            </button>
                            <span className="text-sm font-black text-secondary-500 uppercase tracking-[0.15em]">全选</span>
                            <span className="text-xs text-secondary-300 font-bold ml-auto">已选 {selectedItems}/{totalItems} 件</span>
                        </div>
                        {items.map((item, idx) => (
                            <div key={`${item.id}-${idx}`} className={`bg-white rounded-3xl p-6 shadow-xl border flex gap-8 animate-in fade-in slide-in-from-bottom-4 group relative overflow-hidden transition-all ${item.selected ? 'border-primary/20' : 'border-secondary-50 opacity-60'}`}>
                                <button
                                    onClick={() => toggleSelect(item.id, item.selectedSpecs)}
                                    className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all shrink-0 mt-14 ${item.selected ? 'bg-primary border-primary' : 'border-secondary-200 bg-white hover:border-primary'}`}
                                >
                                    {item.selected && <Check className="h-4 w-4 text-white" strokeWidth={3} />}
                                </button>
                                <Link to={`/product/${item.id}`} className="shrink-0 rounded-[1.5rem] overflow-hidden shadow-2xl border border-secondary-50"><img src={item.main_image} alt="" loading="lazy" decoding="async" className="w-36 h-36 object-cover group-hover:scale-110 transition-transform" /></Link>
                                <div className="flex-1 flex flex-col justify-between py-1">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <Link to={`/product/${item.id}`} className="font-black text-secondary-900 text-xl hover:text-primary transition-colors tracking-tighter italic">{item.name}</Link>
                                            {item.selectedSpecs && Object.keys(item.selectedSpecs).length > 0 && (
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {Object.entries(item.selectedSpecs).map(([key, val]) => (
                                                        <span key={key} className="text-[10px] font-bold text-secondary-400 bg-secondary-50 px-2.5 py-1 rounded-lg border border-secondary-100">{key}: {val}</span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <button onClick={async () => { try { await removeFromCart(item.id, item.selectedSpecs) } catch (error) { console.error('Failed to remove item:', error) } }} className="p-2 text-secondary-200 hover:text-primary active:scale-75"><Trash2 className="h-5 w-5" /></button>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-2xl font-black text-primary tracking-tighter italic">¥{item.price.toFixed(2)}</span>
                                            {item.original_price && item.original_price > item.price && (
                                                <span className="text-sm font-bold text-secondary-300 line-through">¥{item.original_price.toFixed(2)}</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-5 bg-secondary-50/80 p-1.5 rounded-[1.25rem] border border-secondary-100 shadow-inner">
                                            <button onClick={async () => { try { await updateQuantity(item.id, item.quantity - 1, item.selectedSpecs) } catch (error) { console.error('Failed to update quantity:', error) } }} disabled={item.quantity <= 1} className="w-10 h-10 bg-white rounded-xl shadow-sm hover:text-primary active:scale-75 disabled:opacity-20"><Minus className="h-4 w-4" /></button>
                                            <span className="w-8 text-center font-black text-secondary-900 tabular-nums">{item.quantity}</span>
                                            <button onClick={async () => { try { await updateQuantity(item.id, item.quantity + 1, item.selectedSpecs) } catch (error) { console.error('Failed to update quantity:', error) } }} className="w-10 h-10 bg-white rounded-xl shadow-sm hover:text-primary active:scale-75"><Plus className="h-4 w-4" /></button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <aside className="w-full lg:w-[420px] shrink-0 lg:sticky lg:top-28">
                        <div className="bg-secondary-900 rounded-[2.5rem] p-12 text-white shadow-2xl relative overflow-hidden">
                            <h2 className="text-3xl font-black mb-12 tracking-tighter italic opacity-90">订单摘要</h2>
                            <div className="space-y-4 mb-8">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-black text-secondary-300 uppercase tracking-[0.15em]">全部商品</span>
                                    <span className="text-sm font-bold text-secondary-400">¥{totalPrice.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-black text-secondary-300 uppercase tracking-[0.15em]">已选商品 ({selectedItems}件)</span>
                                    <span className="text-sm font-bold text-primary">¥{selectedTotalPrice.toFixed(2)}</span>
                                </div>
                            </div>
                            <div className="space-y-6 mb-12 flex justify-between items-end border-t border-secondary-700 pt-8">
                                <span className="text-xs font-black text-secondary-300 uppercase tracking-[0.2em]">应付合计</span>
                                <div className="text-right"><div className="text-5xl font-black text-primary tracking-tighter italic">¥{selectedTotalPrice.toFixed(2)}</div></div>
                            </div>
                            <button
                                onClick={handleCheckout}
                                disabled={isProcessing || showSuccess || selectedItems === 0}
                                className="w-full bg-white text-secondary-900 py-6 rounded-2xl font-black text-sm hover:bg-primary hover:text-white transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-4 uppercase tracking-[0.3em] group disabled:opacity-50"
                            >
                                {isProcessing ? (
                                    <div className="flex items-center gap-3"><div className="w-4 h-4 border-2 border-secondary-900 border-t-transparent rounded-full animate-spin"></div> 处理中...</div>
                                ) : showSuccess ? (
                                    <div className="flex items-center gap-3 text-green-500"><Check className="h-5 w-5" /> 订单已提交</div>
                                ) : (
                                    <><Zap className="h-5 w-5 fill-primary text-primary group-hover:fill-white group-hover:text-white" /> 立即支付 ({selectedItems})</>
                                )}
                            </button>
                            <p className="text-[10px] text-secondary-500 font-bold uppercase tracking-widest text-center mt-8 opacity-50">Secure Checkout Powered by ShieldPay</p>
                        </div>
                    </aside>
                </div>

                {showSuccess && (
                    <div className="fixed inset-0 bg-secondary-900/60 backdrop-blur-xl z-[200] flex items-center justify-center p-6 animate-in fade-in duration-500">
                        <div className="bg-white rounded-[3rem] p-12 max-w-md w-full text-center shadow-3xl border border-white animate-in zoom-in-95 duration-500">
                            <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-green-500/20">
                                <Check className="h-12 w-12 text-white stroke-[3px]" />
                            </div>
                            <h2 className="text-4xl font-black text-secondary-900 mb-4 tracking-tighter italic uppercase">支付成功！</h2>
                            <p className="text-secondary-400 font-bold mb-10 leading-relaxed">您的订单已在快马加鞭处理中，<br />我们将尽快为您安排发货。</p>
                            <div className="p-6 bg-secondary-50 rounded-2xl flex items-center justify-between mb-10 border border-secondary-100">
                                <div className="text-left"><p className="text-[10px] font-black text-secondary-400 uppercase tracking-widest">实付金额</p><p className="text-2xl font-black text-primary italic tracking-tighter">¥{selectedTotalPrice.toFixed(2)}</p><p className="text-[10px] text-secondary-300 font-bold mt-1">订单号：{createdOrderNo}</p></div>
                                <ShieldCheck className="h-8 w-8 text-secondary-200" />
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => navigate('/orders')} className="flex-1 py-5 bg-white border-2 border-secondary-200 text-secondary-700 rounded-2xl font-black text-sm hover:border-secondary-300 hover:bg-secondary-50 transition-all active:scale-95 uppercase tracking-[0.2em]">查看订单</button>
                                <button onClick={() => navigate('/')} className="flex-1 py-5 bg-secondary-900 text-white rounded-2xl font-black text-sm hover:bg-primary transition-all active:scale-95 uppercase tracking-[0.2em]">返回首页</button>
                            </div>
                        </div>
                    </div>
                )}

                {showCheckoutForm && (
                    <div className="fixed inset-0 bg-secondary-900/60 backdrop-blur-xl z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
                        <div className="bg-white rounded-[3rem] p-10 max-w-lg w-full shadow-3xl border border-white animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-2xl font-black text-secondary-900 tracking-tighter italic uppercase">确认订单信息</h2>
                                <button onClick={() => { setShowCheckoutForm(false); setOrderError('') }} className="p-2 hover:bg-secondary-50 rounded-xl transition-colors text-secondary-400 hover:text-secondary-700"><X className="h-5 w-5" /></button>
                            </div>
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-[10px] font-black text-secondary-400 uppercase tracking-widest mb-2">收货人姓名</label>
                                    <input
                                        type="text"
                                        value={shippingForm.contact_name}
                                        onChange={(e) => setShippingForm({ ...shippingForm, contact_name: e.target.value })}
                                        placeholder="请输入收货人姓名"
                                        className="w-full px-5 py-4 rounded-2xl border-2 border-secondary-100 focus:border-primary focus:outline-none text-sm font-bold text-secondary-900 transition-colors bg-secondary-50/50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-secondary-400 uppercase tracking-widest mb-2">联系电话</label>
                                    <input
                                        type="tel"
                                        value={shippingForm.contact_phone}
                                        onChange={(e) => setShippingForm({ ...shippingForm, contact_phone: e.target.value })}
                                        placeholder="请输入联系电话"
                                        className="w-full px-5 py-4 rounded-2xl border-2 border-secondary-100 focus:border-primary focus:outline-none text-sm font-bold text-secondary-900 transition-colors bg-secondary-50/50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-secondary-400 uppercase tracking-widest mb-2">收货地址</label>
                                    <textarea
                                        value={shippingForm.shipping_address}
                                        onChange={(e) => setShippingForm({ ...shippingForm, shipping_address: e.target.value })}
                                        placeholder="请输入详细收货地址（省市区街道门牌号）"
                                        rows={3}
                                        className="w-full px-5 py-4 rounded-2xl border-2 border-secondary-100 focus:border-primary focus:outline-none text-sm font-bold text-secondary-900 transition-colors bg-secondary-50/50 resize-none"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-secondary-400 uppercase tracking-widest mb-2">支付方式</label>
                                        <select
                                            value={shippingForm.payment_method}
                                            onChange={(e) => setShippingForm({ ...shippingForm, payment_method: e.target.value })}
                                            className="w-full px-5 py-4 rounded-2xl border-2 border-secondary-100 focus:border-primary focus:outline-none text-sm font-bold text-secondary-900 transition-colors bg-secondary-50/50"
                                        >
                                            <option>支付宝</option>
                                            <option>微信支付</option>
                                            <option>银行卡</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-secondary-400 uppercase tracking-widest mb-2">配送方式</label>
                                        <select
                                            value={shippingForm.shipping_method}
                                            onChange={(e) => setShippingForm({ ...shippingForm, shipping_method: e.target.value })}
                                            className="w-full px-5 py-4 rounded-2xl border-2 border-secondary-100 focus:border-primary focus:outline-none text-sm font-bold text-secondary-900 transition-colors bg-secondary-50/50"
                                        >
                                            <option>顺丰特快</option>
                                            <option>顺丰标快</option>
                                            <option>中通快递</option>
                                            <option>圆通快递</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="bg-secondary-50 rounded-2xl p-5 border border-secondary-100 mt-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-black text-secondary-400 uppercase tracking-widest">应付金额</span>
                                        <span className="text-3xl font-black text-primary italic tracking-tighter">¥{selectedTotalPrice.toFixed(2)}</span>
                                    </div>
                                </div>
                                {orderError && (
                                    <div className="bg-red-50 border-2 border-red-100 text-red-600 px-5 py-3 rounded-2xl text-sm font-bold">
                                        {orderError}
                                    </div>
                                )}
                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={() => { setShowCheckoutForm(false); setOrderError('') }}
                                        disabled={isProcessing}
                                        className="flex-1 py-5 rounded-2xl border-2 border-secondary-100 text-secondary-600 font-black text-sm hover:bg-secondary-50 transition-all uppercase tracking-[0.2em] disabled:opacity-50"
                                    >
                                        取消
                                    </button>
                                    <button
                                        onClick={submitOrder}
                                        disabled={isProcessing}
                                        className="flex-1 py-5 bg-primary text-white rounded-2xl font-black text-sm hover:bg-primary-600 shadow-xl shadow-primary/20 transition-all active:scale-95 uppercase tracking-[0.2em] flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {isProcessing ? (
                                            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> 提交中...</>
                                        ) : (
                                            <><Zap className="h-4 w-4 fill-white" /> 提交订单</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}
