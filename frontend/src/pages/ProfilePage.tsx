import React, { useState, useEffect } from 'react'
import { ArrowLeft, Camera, Mail, User as UserIcon, Shield, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function ProfilePage() {
    const navigate = useNavigate()
    const { user: authUser, logout, updateUser } = useAuth()
    const [isEditing, setIsEditing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [user, setUser] = useState({
        name: authUser?.nickname || 'PREMIUM USER',
        username: authUser?.username || 'antigravity_dev',
        email: authUser?.email || 'lh_antigravity@dev.com',
        phone: '+86 138 **** 8888',
        gender: '神秘'
    })
    const [editForm, setEditForm] = useState({ ...user })

    useEffect(() => {
        if (authUser) {
            setUser(prev => ({
                ...prev,
                name: authUser.nickname,
                username: authUser.username,
                email: authUser.email,
            }))
        }
    }, [authUser])

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)
        try {
            await updateUser({
                nickname: editForm.name,
                username: editForm.username,
                email: editForm.email,
            })
            setIsEditing(false)
        } catch (error) {
            console.error('Failed to update profile:', error)
            alert('保存失败，请稍后重试')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="min-h-screen bg-secondary-50/30">
            <header className="bg-white/80 backdrop-blur-xl sticky top-0 z-50 border-b border-secondary-50 shadow-sm">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-secondary-50 rounded-xl transition-colors">
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <h1 className="text-xl font-black text-secondary-900 tracking-tighter italic">个人资料</h1>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-12">
                <div className="bg-white rounded-[2.5rem] shadow-xl border border-secondary-50 overflow-hidden">
                    <div className="h-48 bg-secondary-900 relative">
                        <div className="absolute -bottom-16 left-12">
                            <div className="relative group">
                                <div className="w-32 h-32 rounded-[2.5rem] border-4 border-white overflow-hidden shadow-2xl">
                                    <img
                                        src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200"
                                        alt="avatar"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <button className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-[2.5rem]">
                                    <Camera className="h-6 w-6" />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="pt-20 px-12 pb-12">
                        <div className="flex justify-between items-start mb-12">
                            <div>
                                <h2 className="text-3xl font-black text-secondary-900 tracking-tighter italic mb-1 uppercase">{user.name}</h2>
                                <p className="text-secondary-400 font-bold uppercase tracking-widest text-xs">{user.email}</p>
                            </div>
                            <button
                                onClick={() => { setEditForm({ ...user }); setIsEditing(true); }}
                                className="bg-primary text-white px-8 py-3 rounded-2xl font-black text-xs hover:bg-primary-600 transition-all shadow-lg shadow-primary/20"
                            >
                                编辑资料
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <section>
                                    <h3 className="text-xs font-black text-secondary-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                        <UserIcon className="h-3 w-3" /> 基本信息
                                    </h3>
                                    <div className="bg-secondary-50/50 rounded-2xl p-6 border border-secondary-100 space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-bold text-secondary-500">用户名</span>
                                            <span className="text-sm font-black text-secondary-900 uppercase">{user.username}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-bold text-secondary-500">性别</span>
                                            <span className="text-sm font-black text-secondary-900">{user.gender}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-bold text-secondary-500">注册日期</span>
                                            <span className="text-sm font-black text-secondary-900">2024-01-01</span>
                                        </div>
                                    </div>
                                </section>
                            </div>

                            <div className="space-y-6">
                                <section>
                                    <h3 className="text-xs font-black text-secondary-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                        <Mail className="h-3 w-3" /> 联系方式
                                    </h3>
                                    <div className="bg-secondary-50/50 rounded-2xl p-6 border border-secondary-100 space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-bold text-secondary-500">电子邮箱</span>
                                            <span className="text-sm font-black text-secondary-900">{user.email}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-bold text-secondary-500">手机号码</span>
                                            <span className="text-sm font-black text-secondary-900">{user.phone}</span>
                                        </div>
                                    </div>
                                </section>

                                <section>
                                    <h3 className="text-xs font-black text-secondary-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                        <Shield className="h-3 w-3" /> 账户安全
                                    </h3>
                                    <div className="bg-secondary-50/50 rounded-2xl p-6 border border-secondary-100 space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-bold text-secondary-500">实名认证</span>
                                            <span className="text-xs font-black text-green-500 bg-green-50 px-3 py-1 rounded-full">已认证</span>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        </div>
                        <div className="mt-12 pt-8 border-t border-secondary-50">
                            <button
                                onClick={logout}
                                className="w-full py-4 bg-red-50 text-red-500 rounded-2xl font-black text-xs hover:bg-red-500 hover:text-white transition-all active:scale-95 uppercase tracking-widest shadow-sm"
                            >
                                退出当前登录
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            {isEditing && (
                <div className="fixed inset-0 bg-secondary-900/60 backdrop-blur-xl z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] p-10 max-w-lg w-full shadow-3xl border border-white animate-in zoom-in-95 duration-300 relative overflow-hidden">
                        <button
                            onClick={() => setIsEditing(false)}
                            className="absolute top-8 right-8 p-2 text-secondary-300 hover:text-secondary-900 transition-colors"
                        >
                            <X className="h-6 w-6" />
                        </button>
                        <h2 className="text-3xl font-black text-secondary-900 mb-8 tracking-tighter italic italic uppercase">编辑个人资料</h2>

                        <form onSubmit={handleSave} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-secondary-400 uppercase tracking-[0.2em] px-2">姓名</label>
                                <input
                                    type="text"
                                    value={editForm.name}
                                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                    className="w-full bg-secondary-50 border-2 border-secondary-100 rounded-2xl p-4 font-bold text-secondary-900 focus:outline-none focus:border-primary/30 focus:ring-8 focus:ring-primary/5 transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-secondary-400 uppercase tracking-[0.2em] px-2">用户名</label>
                                <input
                                    type="text"
                                    value={editForm.username}
                                    onChange={e => setEditForm({ ...editForm, username: e.target.value })}
                                    className="w-full bg-secondary-50 border-2 border-secondary-100 rounded-2xl p-4 font-bold text-secondary-900 focus:outline-none focus:border-primary/30 focus:ring-8 focus:ring-primary/5 transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-secondary-400 uppercase tracking-[0.2em] px-2">电子邮箱</label>
                                <input
                                    type="email"
                                    value={editForm.email}
                                    onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                                    className="w-full bg-secondary-50 border-2 border-secondary-100 rounded-2xl p-4 font-bold text-secondary-900 focus:outline-none focus:border-primary/30 focus:ring-8 focus:ring-primary/5 transition-all"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-secondary-400 uppercase tracking-[0.2em] px-2">性别</label>
                                    <select
                                        value={editForm.gender}
                                        onChange={e => setEditForm({ ...editForm, gender: e.target.value })}
                                        className="w-full bg-secondary-50 border-2 border-secondary-100 rounded-2xl p-4 font-bold text-secondary-900 focus:outline-none focus:border-primary/30 focus:ring-8 focus:ring-primary/5 transition-all appearance-none"
                                    >
                                        <option value="神秘">神秘</option>
                                        <option value="男">男</option>
                                        <option value="女">女</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-secondary-400 uppercase tracking-[0.2em] px-2">手机号码</label>
                                    <input
                                        type="text"
                                        value={editForm.phone}
                                        onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                                        className="w-full bg-secondary-50 border-2 border-secondary-100 rounded-2xl p-4 font-bold text-secondary-900 focus:outline-none focus:border-primary/30 focus:ring-8 focus:ring-primary/5 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(false)}
                                    disabled={isSaving}
                                    className="flex-1 px-8 py-4 bg-secondary-50 text-secondary-400 rounded-2xl font-black text-xs hover:bg-secondary-100 transition-all uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    取消
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex-1 px-8 py-4 bg-primary text-white rounded-2xl font-black text-xs hover:bg-primary-600 transition-all shadow-xl shadow-primary/20 uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSaving ? '保存中...' : '保存修改'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

