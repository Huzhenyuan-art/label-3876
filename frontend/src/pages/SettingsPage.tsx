import React, { useState } from 'react'
import { ArrowLeft, Bell, Lock, Moon, ChevronRight, ShieldCheck, HelpCircle, X, Check, AlertTriangle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'

export default function SettingsPage() {
    const navigate = useNavigate()
    const { logout } = useAuth()
    const { darkMode, toggleDarkMode } = useTheme()

    const [notifications, setNotifications] = useState(true)
    const [twoStep, setTwoStep] = useState(true)

    const [activeModal, setActiveModal] = useState<string | null>(null)
    const [passwordForm, setPasswordForm] = useState({ old: '', new: '', confirm: '' })

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        console.log('Password changed')
        setActiveModal(null)
        setPasswordForm({ old: '', new: '', confirm: '' })
    }

    const sections = [
        {
            title: '账户安全',
            items: [
                { icon: Lock, label: '修改密码', detail: '最后修改于 30 天前', onClick: () => setActiveModal('password') },
                { icon: ShieldCheck, label: '二步验证', toggle: true, value: twoStep, setter: setTwoStep, color: 'text-green-500' },
            ]
        },
        {
            title: '偏好设置',
            items: [
                { icon: Bell, label: '消息通知', toggle: true, value: notifications, setter: setNotifications },
                { icon: Moon, label: '深色模式', toggle: true, value: darkMode, setter: toggleDarkMode },
            ]
        },
        {
            title: '关于与支持',
            items: [
                { icon: HelpCircle, label: '帮助中心', onClick: () => setActiveModal('help') },
                { icon: ShieldCheck, label: '隐私政策', onClick: () => setActiveModal('privacy') },
            ]
        }
    ]

    return (
        <div className="min-h-screen bg-secondary-50/30 dark:bg-secondary-900 transition-colors duration-500">
            <header className="bg-white/80 dark:bg-secondary-900/80 backdrop-blur-xl sticky top-0 z-50 border-b border-secondary-50 dark:border-secondary-800 shadow-sm transition-colors">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-secondary-50 dark:hover:bg-secondary-800 rounded-xl transition-colors">
                        <ArrowLeft className="h-5 w-5 dark:text-white" />
                    </button>
                    <h1 className="text-xl font-black text-secondary-900 dark:text-white tracking-tighter italic">账号设置</h1>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-12">
                <div className="space-y-12">
                    {sections.map((section, idx) => (
                        <div key={idx} className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                            <h2 className="text-[10px] font-black text-secondary-400 uppercase tracking-[0.3em] mb-6 px-4 dark:text-secondary-500">
                                {section.title}
                            </h2>
                            <div className="bg-white dark:bg-secondary-800 rounded-[2rem] shadow-xl border border-secondary-50 dark:border-secondary-700 overflow-hidden transition-colors">
                                {section.items.map((item, itemIdx) => (
                                    <div
                                        key={itemIdx}
                                        onClick={item.onClick}
                                        className={`flex items-center justify-between p-6 hover:bg-secondary-50/50 dark:hover:bg-secondary-700/50 transition-colors cursor-pointer ${itemIdx !== section.items.length - 1 ? 'border-b border-secondary-50 dark:border-secondary-700' : ''}`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-secondary-50 dark:bg-secondary-700 rounded-xl flex items-center justify-center border border-secondary-100 dark:border-secondary-600 shadow-sm">
                                                <item.icon className={`h-5 w-5 ${item.color || 'text-secondary-400 dark:text-secondary-300'}`} />
                                            </div>
                                            <span className="text-sm font-black text-secondary-900 dark:text-white">{item.label}</span>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            {item.toggle ? (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); item.setter!(!item.value); }}
                                                    className={`w-12 h-6 rounded-full transition-all duration-300 relative ${item.value ? 'bg-primary shadow-lg shadow-primary/30' : 'bg-secondary-200 dark:bg-secondary-600 shadow-inner'}`}
                                                >
                                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-sm ${item.value ? 'left-7' : 'left-1'}`} />
                                                </button>
                                            ) : (
                                                <>
                                                    {item.detail && <span className="text-xs font-bold text-secondary-400 dark:text-secondary-500 uppercase tracking-widest">{item.detail}</span>}
                                                    <ChevronRight className="h-4 w-4 text-secondary-300 dark:text-secondary-600" />
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    <div className="pt-8">
                        <button
                            onClick={() => setActiveModal('deleteAccount')}
                            className="w-full p-6 bg-red-50 dark:bg-red-900/10 text-red-500 border-2 border-dashed border-red-100 dark:border-red-900/30 rounded-[2rem] font-black text-sm hover:bg-red-500 hover:text-white hover:border-transparent transition-all shadow-sm active:scale-95 uppercase tracking-[0.2em]"
                        >
                            注销账户
                        </button>
                        <p className="text-center text-[10px] text-secondary-400 dark:text-secondary-500 font-bold uppercase tracking-widest mt-6 opacity-60">
                            Version 1.0.0 (Build 20240301)
                        </p>
                    </div>
                </div>
            </main>

            {/* Modals */}
            {activeModal === 'password' && (
                <div className="fixed inset-0 bg-secondary-900/60 dark:bg-black/60 backdrop-blur-xl z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-secondary-800 rounded-[2.5rem] p-10 max-w-lg w-full shadow-3xl border border-white dark:border-secondary-700 animate-in zoom-in-95 duration-300 relative">
                        <button onClick={() => setActiveModal(null)} className="absolute top-8 right-8 p-2 text-secondary-300 hover:text-secondary-900 dark:hover:text-white transition-colors">
                            <X className="h-6 w-6" />
                        </button>
                        <h2 className="text-3xl font-black text-secondary-900 dark:text-white mb-8 tracking-tighter italic uppercase">修改密码</h2>
                        <form onSubmit={handlePasswordSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-secondary-400 uppercase tracking-[0.2em] px-2">原密码</label>
                                <input
                                    type="password"
                                    value={passwordForm.old}
                                    onChange={e => setPasswordForm({ ...passwordForm, old: e.target.value })}
                                    className="w-full bg-secondary-50 dark:bg-secondary-700 border-2 border-secondary-100 dark:border-secondary-600 rounded-2xl p-4 font-bold text-secondary-900 dark:text-white focus:outline-none focus:border-primary/30 transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-secondary-400 uppercase tracking-[0.2em] px-2">新密码</label>
                                <input
                                    type="password"
                                    value={passwordForm.new}
                                    onChange={e => setPasswordForm({ ...passwordForm, new: e.target.value })}
                                    className="w-full bg-secondary-50 dark:bg-secondary-700 border-2 border-secondary-100 dark:border-secondary-600 rounded-2xl p-4 font-bold text-secondary-900 dark:text-white focus:outline-none focus:border-primary/30 transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-secondary-400 uppercase tracking-[0.2em] px-2">确认新密码</label>
                                <input
                                    type="password"
                                    value={passwordForm.confirm}
                                    onChange={e => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                                    className="w-full bg-secondary-50 dark:bg-secondary-700 border-2 border-secondary-100 dark:border-secondary-600 rounded-2xl p-4 font-bold text-secondary-900 dark:text-white focus:outline-none focus:border-primary/30 transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                            <button type="submit" className="w-full py-4 bg-primary text-white rounded-2xl font-black text-xs hover:bg-primary-600 transition-all shadow-xl shadow-primary/20 uppercase tracking-widest">
                                更新密码
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {activeModal === 'help' && (
                <div className="fixed inset-0 bg-secondary-900/60 dark:bg-black/60 backdrop-blur-xl z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-secondary-800 rounded-[2.5rem] p-12 max-w-2xl w-full shadow-3xl border border-white dark:border-secondary-700 animate-in zoom-in-95 duration-300 relative max-h-[80vh] overflow-y-auto">
                        <button onClick={() => setActiveModal(null)} className="absolute top-8 right-8 p-2 text-secondary-300 hover:text-secondary-900 dark:hover:text-white transition-colors">
                            <X className="h-6 w-6" />
                        </button>
                        <h2 className="text-3xl font-black text-secondary-900 dark:text-white mb-8 tracking-tighter italic uppercase">帮助中心</h2>
                        <div className="space-y-8">
                            {[
                                { q: '如何追踪我的订单？', a: '您可以在“我的订单”页面查看所有进行中的订单及其物流实时状态。' },
                                { q: '如何申请退款？', a: '在订单详情页点击“申请售后”，选择退款原因并提交，我们的客服会在 24 小时内处理。' },
                                { q: '支持哪些支付方式？', a: '我们支持支付宝、微信支付、银联以及主要信用卡支付。' },
                                { q: '如何修改收货地址？', a: '在个人资料页面可以管理您的所有收货地址。对于已下单但未发货的订单，请联系在线客服修改。' }
                            ].map((item, i) => (
                                <div key={i} className="bg-secondary-50 dark:bg-secondary-700/50 p-6 rounded-3xl border border-secondary-100 dark:border-secondary-600">
                                    <h3 className="text-sm font-black text-secondary-900 dark:text-white mb-3 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-primary rounded-full" /> {item.q}
                                    </h3>
                                    <p className="text-xs font-bold text-secondary-500 dark:text-secondary-400 leading-relaxed italic">{item.a}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeModal === 'privacy' && (
                <div className="fixed inset-0 bg-secondary-900/60 dark:bg-black/60 backdrop-blur-xl z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-secondary-800 rounded-[2.5rem] p-12 max-w-2xl w-full shadow-3xl border border-white dark:border-secondary-700 animate-in zoom-in-95 duration-300 relative max-h-[80vh] overflow-y-auto">
                        <button onClick={() => setActiveModal(null)} className="absolute top-8 right-8 p-2 text-secondary-300 hover:text-secondary-900 dark:hover:text-white transition-colors">
                            <X className="h-6 w-6" />
                        </button>
                        <h2 className="text-3xl font-black text-secondary-900 dark:text-white mb-8 tracking-tighter italic uppercase">隐私政策</h2>
                        <div className="space-y-6 text-sm font-bold text-secondary-500 dark:text-secondary-400 leading-relaxed italic">
                            <p>ShieldPlate 致力于保护您的隐私及个人数据安全。本政策说明了我们收集、使用及披露您个人信息的原则。</p>
                            <h3 className="text-secondary-900 dark:text-white uppercase tracking-widest text-xs font-black">1. 数据收集范围</h3>
                            <p>我们收集的信息包括但不限于：您的注册账号（手机号/邮箱）、收货地址、交易记录及设备访问日志。这些信息均用于提升服务体验。</p>
                            <h3 className="text-secondary-900 dark:text-white uppercase tracking-widest text-xs font-black">2. 数据用途</h3>
                            <p>您的数据将主要用于订单处理、个性化推荐、客服沟通及系统安全审计。我们绝不会在未经授权的情况下将数据出售给第三方。</p>
                            <h3 className="text-secondary-900 dark:text-white uppercase tracking-widest text-xs font-black">3. 安全防护机制</h3>
                            <p>我们采用高级加密技术（AES-256）存储核心敏感数据，并通过 SSL/TLS 协议保障传输安全。我们定期进行安全演练以防范潜在威胁。</p>
                            <h3 className="text-secondary-900 dark:text-white uppercase tracking-widest text-xs font-black">4. 您的权利</h3>
                            <p>您有权随时查阅、更正或要求删除您的个人信息。如有任何疑问，请通过在线客服或客服邮箱联系我们的数据保护官。</p>
                        </div>
                    </div>
                </div>
            )}
            {activeModal === 'deleteAccount' && (
                <div className="fixed inset-0 bg-secondary-900/60 dark:bg-black/60 backdrop-blur-xl z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-secondary-800 rounded-[2.5rem] p-10 max-w-sm w-full shadow-3xl border border-white dark:border-secondary-700 animate-in zoom-in-95 duration-300 relative text-center">
                        <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-red-100 dark:border-red-900/30">
                            <AlertTriangle className="h-10 w-10 text-red-500" />
                        </div>
                        <h2 className="text-2xl font-black text-secondary-900 dark:text-white mb-4 tracking-tighter italic uppercase">确认注销账户？</h2>
                        <p className="text-sm font-bold text-secondary-500 dark:text-secondary-400 mb-8 leading-relaxed italic">
                            此操作不可逆。一旦注销，您的所有订单记录、优惠券及个人资料将被永久删除。
                        </p>
                        <div className="space-y-3">
                            <button
                                onClick={() => { logout(); navigate('/'); }}
                                className="w-full py-4 bg-red-500 text-white rounded-2xl font-black text-xs hover:bg-red-600 transition-all shadow-xl shadow-red-500/20 uppercase tracking-widest"
                            >
                                确认注销
                            </button>
                            <button
                                onClick={() => setActiveModal(null)}
                                className="w-full py-4 bg-secondary-50 dark:bg-secondary-700 text-secondary-600 dark:text-secondary-300 rounded-2xl font-black text-xs hover:bg-secondary-100 dark:hover:bg-secondary-600 transition-all uppercase tracking-widest"
                            >
                                取消
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
