import React, { useState } from 'react'
import { ShoppingCart, GitMerge, Replace, Server, X, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useCart } from '../contexts/CartContext'
import { MergeStrategy } from '../types'

interface MergeOption {
    strategy: MergeStrategy
    icon: React.ReactNode
    title: string
    description: string
    highlight?: boolean
}

type MergeStatus = 'idle' | 'loading' | 'success' | 'error'

export const CartMergeDialog: React.FC = () => {
    const { showMergeDialog, dismissMergeDialog, mergeLocalCart, localItemCount, serverItemCount } = useCart()
    const [mergeStatus, setMergeStatus] = useState<MergeStatus>('idle')
    const [errorMessage, setErrorMessage] = useState('')
    const [activeStrategy, setActiveStrategy] = useState<MergeStrategy | null>(null)

    if (!showMergeDialog) return null

    const effectiveLocalCount = localItemCount > 0 ? localItemCount : 0
    const isLoading = mergeStatus === 'loading'

    const options: MergeOption[] = [
        {
            strategy: 'merge',
            icon: <GitMerge className="h-6 w-6" />,
            title: '合并购物车',
            description: `将本地 ${effectiveLocalCount} 件商品与服务端 ${serverItemCount} 件商品合并，相同商品数量累加`,
            highlight: true,
        },
        {
            strategy: 'replace',
            icon: <Replace className="h-6 w-6" />,
            title: '替换服务端',
            description: `用本地 ${effectiveLocalCount} 件商品替换服务端购物车`,
        },
        {
            strategy: 'keep_server',
            icon: <Server className="h-6 w-6" />,
            title: '保留服务端',
            description: `保留服务端 ${serverItemCount} 件商品，丢弃本地购物车`,
        },
    ]

    const handleSelect = async (strategy: MergeStrategy) => {
        if (isLoading) return

        setActiveStrategy(strategy)
        setMergeStatus('loading')
        setErrorMessage('')

        try {
            console.log('[CartMergeDialog] Starting merge with strategy:', strategy)
            await mergeLocalCart(strategy)
            console.log('[CartMergeDialog] Merge succeeded')
            setMergeStatus('success')
            setTimeout(() => {
                setMergeStatus('idle')
                setActiveStrategy(null)
            }, 800)
        } catch (error: any) {
            console.error('[CartMergeDialog] Merge failed:', error)
            setMergeStatus('error')
            setErrorMessage(error?.message || '同步失败，请稍后重试')
            setTimeout(() => {
                setMergeStatus('idle')
                setActiveStrategy(null)
                setErrorMessage('')
            }, 3000)
        }
    }

    return (
        <div className="fixed inset-0 bg-secondary-900/60 backdrop-blur-xl z-[300] flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="bg-white rounded-[3rem] p-10 max-w-lg w-full shadow-3xl border border-white animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center">
                            <ShoppingCart className="h-7 w-7 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-secondary-900 tracking-tighter italic">购物车同步</h2>
                            <p className="text-sm text-secondary-400 font-bold">检测到本地有 {effectiveLocalCount} 件商品</p>
                        </div>
                    </div>
                    <button
                        onClick={dismissMergeDialog}
                        disabled={isLoading}
                        className="p-2 hover:bg-secondary-50 rounded-xl transition-colors text-secondary-400 hover:text-secondary-700 disabled:opacity-50"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {errorMessage && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                        <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
                        <p className="text-sm font-bold text-red-600">{errorMessage}</p>
                    </div>
                )}

                {mergeStatus === 'success' && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                        <p className="text-sm font-bold text-green-600">购物车同步成功！</p>
                    </div>
                )}

                <p className="text-sm text-secondary-500 font-bold mb-8 leading-relaxed">
                    您在未登录时添加了 {effectiveLocalCount} 件商品到购物车。
                    请选择如何处理这些商品：
                </p>

                <div className="space-y-4 mb-8">
                    {options.map((option) => {
                        const isActive = activeStrategy === option.strategy
                        const showLoading = isLoading && isActive
                        return (
                            <button
                                key={option.strategy}
                                onClick={() => handleSelect(option.strategy)}
                                disabled={isLoading}
                                className={`w-full p-6 rounded-2xl text-left transition-all group disabled:opacity-60 relative overflow-hidden ${
                                    isActive && mergeStatus === 'success'
                                        ? 'bg-green-50 border-2 border-green-300'
                                        : option.highlight
                                        ? 'bg-primary/5 border-2 border-primary/30 hover:bg-primary/10 hover:border-primary'
                                        : 'bg-secondary-50 border-2 border-transparent hover:bg-secondary-100 hover:border-secondary-200'
                                }`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                                        isActive && mergeStatus === 'success'
                                            ? 'bg-green-500 text-white'
                                            : option.highlight
                                            ? 'bg-primary text-white'
                                            : 'bg-white text-secondary-400 group-hover:text-primary'
                                    }`}>
                                        {showLoading ? (
                                            <Loader2 className="h-6 w-6 animate-spin" />
                                        ) : isActive && mergeStatus === 'success' ? (
                                            <CheckCircle2 className="h-6 w-6" />
                                        ) : (
                                            option.icon
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className={`font-black text-lg mb-1 ${
                                            isActive && mergeStatus === 'success'
                                                ? 'text-green-600'
                                                : option.highlight
                                                ? 'text-primary'
                                                : 'text-secondary-900'
                                        }`}>
                                            {option.title}
                                        </h3>
                                        <p className="text-sm text-secondary-500 font-bold leading-relaxed">
                                            {option.description}
                                        </p>
                                    </div>
                                </div>
                            </button>
                        )
                    })}
                </div>

                <button
                    onClick={dismissMergeDialog}
                    disabled={isLoading}
                    className="w-full py-4 bg-secondary-100 text-secondary-600 rounded-2xl font-black text-sm hover:bg-secondary-200 transition-all uppercase tracking-[0.2em] disabled:opacity-50"
                >
                    稍后处理
                </button>

                <p className="text-[10px] text-secondary-300 font-bold text-center mt-6 uppercase tracking-widest">
                    您可以随时在购物车页面手动同步
                </p>
            </div>
        </div>
    )
}
