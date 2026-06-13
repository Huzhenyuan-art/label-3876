import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, User, Lock, Mail, ChevronRight, Zap, ShieldCheck, AlertCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { AxiosError } from 'axios'

export default function LoginPage() {
    const navigate = useNavigate()
    const { login, register } = useAuth()
    const [isLogin, setIsLogin] = useState(true)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        email: ''
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            if (isLogin) {
                await login({
                    username: formData.username,
                    password: formData.password
                })
            } else {
                await register({
                    username: formData.username,
                    email: formData.email,
                    password: formData.password
                })
            }
            navigate('/')
        } catch (err) {
            const axiosError = err as AxiosError<{ detail?: string }>
            const errorMessage = axiosError.response?.data?.detail ||
                (isLogin ? '登录失败，请检查用户名和密码' : '注册失败，请稍后重试')
            setError(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-secondary-900 flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/20 rounded-full blur-[120px]" />
            </div>

            <div className="max-w-md w-full relative z-10 animate-in fade-in zoom-in-95 duration-700">
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 text-secondary-400 hover:text-white transition-colors mb-12 group font-black uppercase tracking-widest text-[10px]"
                >
                    <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" /> 返回首页
                </button>

                <div className="bg-white/10 backdrop-blur-3xl p-12 rounded-[3.5rem] border border-white/10 shadow-3xl">
                    <div className="text-center mb-12">
                        <div className="w-20 h-20 bg-primary rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-primary/20 rotate-3 group hover:rotate-6 transition-transform">
                            <Zap className="h-10 w-10 text-white fill-white" />
                        </div>
                        <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase mb-2">
                            {isLogin ? '欢迎回来' : '开启探索'}
                        </h1>
                        <p className="text-secondary-400 font-bold text-xs uppercase tracking-[0.2em]">
                            {isLogin ? 'Login to your account' : 'Create a new account'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="relative group">
                            <User className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary-500 group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                placeholder="用户名 / Username"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-16 pr-6 text-white font-bold text-sm focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-secondary-600"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                required
                            />
                        </div>

                        {!isLogin && (
                            <div className="relative group animate-in slide-in-from-top-4 duration-500">
                                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary-500 group-focus-within:text-primary transition-colors" />
                                <input
                                    type="email"
                                    placeholder="电子邮箱 / Email"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-16 pr-6 text-white font-bold text-sm focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-secondary-600"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                            </div>
                        )}

                        <div className="relative group">
                            <Lock className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary-500 group-focus-within:text-primary transition-colors" />
                            <input
                                type="password"
                                placeholder="密码 / Password"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-16 pr-6 text-white font-bold text-sm focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-secondary-600"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                            />
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 px-4 py-3 rounded-xl animate-in slide-in-from-top-2 duration-300">
                                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                <span className="font-bold">{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-5 bg-white text-secondary-900 rounded-2xl font-black text-sm hover:bg-primary hover:text-white transition-all active:scale-95 shadow-2xl flex items-center justify-center gap-3 group disabled:opacity-50 uppercase tracking-[0.2em]"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-secondary-900 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    {isLogin ? '立即登录' : '立即注册'}
                                    <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <button
                            type="button"
                            onClick={() => {
                                setIsLogin(!isLogin)
                                setError('')
                            }}
                            className="text-secondary-400 hover:text-white font-bold text-xs uppercase tracking-[0.2em] transition-colors"
                        >
                            {isLogin ? '还没有账号？立即注册' : '已有账号？立即登录'}
                        </button>
                    </div>

                </div>

                <div className="mt-12 flex items-center justify-center gap-2 opacity-30">
                    <ShieldCheck className="h-4 w-4 text-white" />
                    <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">SECURE ACCESS BY SHIELDPLATE</span>
                </div>
            </div>
        </div>
    )
}
