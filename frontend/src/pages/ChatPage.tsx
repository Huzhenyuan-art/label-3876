import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Star, ShieldCheck, Smile, Send, AlertCircle, RefreshCw } from 'lucide-react'
import { Header } from '../components/Header'
import { ChatMessage, Shop } from '../types'
import { chatApi, shopApi } from '../api'
import axios from 'axios'

function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status
    const detail = (err.response?.data as { detail?: string })?.detail
    switch (status) {
      case 400:
        return detail || '消息内容无效，请重新输入'
      case 404:
        return '店铺不存在或已下线'
      case 500:
        return detail || '服务器异常，请稍后重试'
      default:
        if (!err.response) return '网络连接失败，请检查网络'
        return detail || '消息发送失败，请点击重试'
    }
  }
  return '消息发送失败，请点击重试'
}

export default function ChatPage() {
  const { shopId } = useParams<{ shopId: string }>()
  const navigate = useNavigate()
  const [shop, setShop] = useState<Shop | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pendingClientIds = useRef<Set<string>>(new Set())

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const loadMessages = useCallback(async (shopIdNum: number, showLoading = false) => {
    if (showLoading) setIsRefreshing(true)
    try {
      const res = await chatApi.getMessages(shopIdNum)
      const serverMessages = res.data.map(m => ({ ...m, status: 'sent' as const }))
      setMessages(prev => {
        const serverClientIds = new Set(
          serverMessages.filter(m => m.client_id).map(m => m.client_id!)
        )
        const serverIdSet = new Set(serverMessages.map(m => m.id))
        const localPending = prev.filter(m => {
          if (m.status === 'sent') return false
          if (m.status !== 'sending' && m.status !== 'failed') return false
          if (m.client_id && serverClientIds.has(m.client_id)) return false
          if (m.id > 0 && serverIdSet.has(m.id)) return false
          return true
        })
        const merged = [...serverMessages, ...localPending]
        merged.sort((a, b) => {
          const tA = new Date(a.created_at).getTime()
          const tB = new Date(b.created_at).getTime()
          if (tA !== tB) return tA - tB
          if (a.id < 0 && b.id > 0) return 1
          if (a.id > 0 && b.id < 0) return -1
          return 0
        })
        return merged
      })
      setError(null)
    } catch (err) {
      setError('加载消息失败，请检查网络连接')
    } finally {
      if (showLoading) setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    if (shopId) {
      const id = parseInt(shopId)
      shopApi.getById(id).then(res => setShop(res.data))
      loadMessages(id)
    }
  }, [shopId, loadMessages])

  const sendToBackend = useCallback(async (
    shopIdNum: number,
    clientId: string,
    content: string
  ) => {
    try {
      const res = await chatApi.sendMessage(shopIdNum, content, 'buyer', clientId)
      setMessages(prev => prev.map(m =>
        m.client_id === clientId
          ? { ...res.data, status: 'sent' as const, client_id: clientId }
          : m
      ))
      setIsTyping(true)
      setTimeout(async () => {
        const sellerReply = "感谢您的咨询，亲！这款商品目前库存充足，今天下单最快明天就能发货哦。请问还有其他可以帮您的吗？"
        const sellerClientId = `seller_msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
        try {
          await chatApi.sendMessage(shopIdNum, sellerReply, 'seller', sellerClientId)
          await loadMessages(shopIdNum)
        } catch {
          setMessages(prev => [...prev, {
            id: Date.now(),
            shop_id: shopIdNum,
            sender: 'seller',
            content: sellerReply,
            msg_type: 'text',
            created_at: new Date().toISOString(),
            status: 'sent',
            client_id: sellerClientId,
          }])
        }
        setIsTyping(false)
      }, 1500)
    } catch (err) {
      setMessages(prev => prev.map(m =>
        m.client_id === clientId ? { ...m, status: 'failed' as const } : m
      ))
      setError(getErrorMessage(err))
    } finally {
      pendingClientIds.current.delete(clientId)
      if (pendingClientIds.current.size === 0) {
        setIsSending(false)
      }
    }
  }, [loadMessages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = inputValue.trim()
    if (!trimmed || !shopId || isSending) return

    const shopIdNum = parseInt(shopId)
    const clientId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

    pendingClientIds.current.add(clientId)
    setIsSending(true)
    setError(null)

    const optimisticMsg: ChatMessage = {
      id: -Date.now(),
      shop_id: shopIdNum,
      sender: 'buyer',
      content: trimmed,
      msg_type: 'text',
      created_at: new Date().toISOString(),
      status: 'sending',
      client_id: clientId,
    }

    setMessages(prev => [...prev, optimisticMsg])
    setInputValue('')

    await sendToBackend(shopIdNum, clientId, trimmed)
  }

  const handleRetry = async (clientId: string) => {
    if (pendingClientIds.current.has(clientId)) return
    const msg = messages.find(m => m.client_id === clientId)
    if (!msg || !shopId) return

    const shopIdNum = parseInt(shopId)
    pendingClientIds.current.add(clientId)
    setIsSending(true)
    setError(null)

    setMessages(prev => prev.map(m =>
      m.client_id === clientId ? { ...m, status: 'sending' as const } : m
    ))

    await sendToBackend(shopIdNum, clientId, msg.content)
  }

  const handleRefresh = async () => {
    if (!shopId || isRefreshing) return
    setError(null)
    await loadMessages(parseInt(shopId), true)
  }

  return (
    <div className="min-h-screen bg-secondary-100/30 flex flex-col h-screen">
      <Header showSearch={false} />
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-8 flex flex-col h-[calc(100vh-80px)]">
        <div className="bg-white shadow-2xl rounded-[2.5rem] flex flex-col overflow-hidden border border-white h-full">
          <div className="bg-secondary-900 p-6 text-white flex items-center justify-between border-b border-white/5 relative overflow-hidden shrink-0">
            <div className="flex items-center gap-4 relative z-10">
              <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/10 rounded-xl transition-colors"><ArrowLeft className="h-5 w-5" /></button>
              <div className="w-12 h-12 rounded-2xl border-2 border-white/20 overflow-hidden shadow-xl"><img src={shop?.logo} alt="" className="w-full h-full object-cover" /></div>
              <div><h2 className="font-black text-lg tracking-tight flex items-center gap-2">{shop?.name}<span className="inline-block w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse border-2 border-green-950"></span></h2><div className="flex items-center gap-2 text-[10px] font-black text-secondary-500 uppercase tracking-widest leading-none mt-1"><Star className="h-3 w-3 text-primary fill-primary" />{shop?.rating} · 在线客服</div></div>
            </div>
            <button onClick={handleRefresh} className={`p-2 hover:bg-white/10 rounded-xl transition-colors ${isRefreshing ? 'animate-spin' : ''}`} disabled={isRefreshing} title="刷新消息">
              <RefreshCw className="h-5 w-5" />
            </button>
          </div>
          {error && (
            <div className="bg-red-50 border-b border-red-100 px-6 py-3 flex items-center gap-3">
              <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
              <span className="text-sm font-medium text-red-700">{error}</span>
            </div>
          )}
          <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-secondary-50/50 no-scrollbar">
            <div className="flex justify-center mb-10"><div className="bg-secondary-100/80 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 border border-white shadow-sm"><ShieldCheck className="h-3.5 w-3.5 text-accent" /><span className="text-[10px] font-black text-secondary-400 uppercase tracking-[0.2em]">End-to-end Encrypted</span></div></div>
            {messages.map((msg, i) => (
              <div key={msg.client_id || msg.id || i} className={`flex ${msg.sender === 'buyer' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
                <div className={`max-w-[75%] p-5 rounded-[1.75rem] shadow-xl relative group ${msg.sender === 'buyer' ? 'bg-primary text-white rounded-tr-none shadow-primary/20' : 'bg-white text-secondary-900 rounded-tl-none shadow-secondary-200/20 border border-secondary-50'} ${msg.status === 'failed' ? 'ring-2 ring-red-400' : ''} ${msg.status === 'sending' ? 'opacity-60' : ''}`}>
                  <p className="text-sm font-medium leading-relaxed">{msg.content}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-[9px] font-black opacity-40 uppercase tracking-widest`}>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {msg.status === 'sending' && msg.sender === 'buyer' && (
                      <span className="text-[9px] font-black opacity-60 uppercase tracking-widest">发送中...</span>
                    )}
                    {msg.status === 'failed' && msg.sender === 'buyer' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRetry(msg.client_id!) }}
                        className="text-[9px] font-black uppercase tracking-widest underline hover:opacity-100 opacity-80"
                      >
                        点击重试
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {isTyping && <div className="flex justify-start animate-pulse"><div className="bg-white px-5 py-3 rounded-2xl shadow-xl flex gap-1 items-center border border-secondary-50"><div className="w-1.5 h-1.5 bg-secondary-300 rounded-full animate-bounce"></div><div className="w-1.5 h-1.5 bg-secondary-400 rounded-full animate-bounce delay-75"></div><div className="w-1.5 h-1.5 bg-secondary-300 rounded-full animate-bounce delay-150"></div></div></div>}
            <div ref={messagesEndRef} />
          </div>
          <div className="p-8 bg-white border-t border-secondary-50 shrink-0">
            <form onSubmit={handleSendMessage} className="bg-secondary-50 p-2 rounded-[2rem] border-2 border-secondary-100 flex items-center gap-3 shadow-inner group transition-all focus-within:border-primary/30 focus-within:ring-8 focus-within:ring-primary/5">
              <button type="button" className="p-4 text-secondary-300 hover:text-primary transition-colors"><Smile className="h-6 w-6" /></button>
              <input
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                placeholder="输入您想咨询的内容..."
                disabled={isSending}
                className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-bold text-secondary-900 placeholder:text-secondary-300 px-2 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isSending}
                className="h-14 w-14 bg-secondary-900 text-white rounded-full flex items-center justify-center hover:bg-primary transition-all active:scale-90 shadow-xl shadow-secondary-900/10 disabled:opacity-20 disabled:cursor-not-allowed"
              >
                <Send className="h-5 w-5" />
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
