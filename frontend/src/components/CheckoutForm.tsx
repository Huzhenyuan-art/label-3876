import React from 'react'
import { X, Zap } from 'lucide-react'

interface CheckoutFormProps {
    shippingForm: {
        contact_name: string
        contact_phone: string
        shipping_address: string
        payment_method: string
        shipping_method: string
    }
    setShippingForm: (form: CheckoutFormProps['shippingForm']) => void
    orderError: string
    isProcessing: boolean
    selectedTotalPrice: number
    onSubmit: () => void
    onClose: () => void
}

export const CheckoutForm: React.FC<CheckoutFormProps> = ({
    shippingForm,
    setShippingForm,
    orderError,
    isProcessing,
    selectedTotalPrice,
    onSubmit,
    onClose,
}) => {
    return (
        <div className="fixed inset-0 bg-secondary-900/60 backdrop-blur-xl z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="bg-white rounded-[3rem] p-10 max-w-lg w-full shadow-3xl border border-white animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-black text-secondary-900 tracking-tighter italic uppercase">确认订单信息</h2>
                    <button onClick={() => { onClose() }} className="p-2 hover:bg-secondary-50 rounded-xl transition-colors text-secondary-400 hover:text-secondary-700"><X className="h-5 w-5" /></button>
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
                            onClick={() => { onClose() }}
                            disabled={isProcessing}
                            className="flex-1 py-5 rounded-2xl border-2 border-secondary-100 text-secondary-600 font-black text-sm hover:bg-secondary-50 transition-all uppercase tracking-[0.2em] disabled:opacity-50"
                        >
                            取消
                        </button>
                        <button
                            onClick={onSubmit}
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
    )
}
