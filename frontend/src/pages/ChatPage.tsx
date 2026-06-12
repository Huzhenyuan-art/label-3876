import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Star, ShieldCheck, Smile, Send } from 'lucide-react'
import { Header } from '../components/Header'
import { ChatMessage, Shop } from '../types'
import { chatApi, shopApi } from '../api'

export default function ChatPage() {
  const { shopId } = useParams<{ shopId: string }>()
  const navigate = useNavigate()
  const [shop, setShop] = useState<Shop | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  useEffect(() => {
    if (shopId) {
      shopApi.getById(parseInt(shopId)).then(res => setShop(res.data))
      chatApi.getMessages(parseInt(shopId)).then(res => setMessages(res.data))
    }
  }, [shopId])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || !shopId) return
    const content = inputValue; setInputValue('')
    const newBuyerMsg = { id: Date.now(), shop_id: parseInt(shopId), sender: 'buyer', content, msg_type: 'text', created_at: new Date().toISOString() }
    setMessages(prev => [...prev, newBuyerMsg])
    setIsTyping(true)
    setTimeout(async () => {
      const sellerReply = "感谢您的咨询，亲！这款商品目前库存充足，今天下单最快明天就能发货哦。请问还有其他可以帮您的吗？"
      const newSellerMsg = { id: Date.now() + 1, shop_id: parseInt(shopId), sender: 'seller', content: sellerReply, msg_type: 'text', created_at: new Date().toISOString() }
      setMessages(prev => [...prev, newSellerMsg]); setIsTyping(false)
    }, 1500)
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
          </div>
          <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-secondary-50/50 no-scrollbar">
            <div className="flex justify-center mb-10"><div className="bg-secondary-100/80 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 border border-white shadow-sm"><ShieldCheck className="h-3.5 w-3.5 text-accent" /><span className="text-[10px] font-black text-secondary-400 uppercase tracking-[0.2em]">End-to-end Encrypted</span></div></div>
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.sender === 'buyer' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
                <div className={`max-w-[75%] p-5 rounded-[1.75rem] shadow-xl relative group ${msg.sender === 'buyer' ? 'bg-primary text-white rounded-tr-none shadow-primary/20' : 'bg-white text-secondary-900 rounded-tl-none shadow-secondary-200/20 border border-secondary-50'}`}>
                  <p className="text-sm font-medium leading-relaxed">{msg.content}</p>
                  <span className={`text-[9px] font-black absolute bottom-4 opacity-0 group-hover:opacity-40 transition-opacity uppercase tracking-widest ${msg.sender === 'buyer' ? '-left-16 text-primary' : '-right-16 text-secondary-900'}`}>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))}
            {isTyping && <div className="flex justify-start animate-pulse"><div className="bg-white px-5 py-3 rounded-2xl shadow-xl flex gap-1 items-center border border-secondary-50"><div className="w-1.5 h-1.5 bg-secondary-300 rounded-full animate-bounce"></div><div className="w-1.5 h-1.5 bg-secondary-400 rounded-full animate-bounce delay-75"></div><div className="w-1.5 h-1.5 bg-secondary-300 rounded-full animate-bounce delay-150"></div></div></div>}
          </div>
          <div className="p-8 bg-white border-t border-secondary-50 shrink-0">
            <form onSubmit={handleSendMessage} className="bg-secondary-50 p-2 rounded-[2rem] border-2 border-secondary-100 flex items-center gap-3 shadow-inner group transition-all focus-within:border-primary/30 focus-within:ring-8 focus-within:ring-primary/5">
              <button type="button" className="p-4 text-secondary-300 hover:text-primary transition-colors"><Smile className="h-6 w-6" /></button>
              <input type="text" value={inputValue} onChange={e => setInputValue(e.target.value)} placeholder="输入您想咨询的内容..." className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-bold text-secondary-900 placeholder:text-secondary-300 px-2" />
              <button type="submit" disabled={!inputValue.trim()} className="h-14 w-14 bg-secondary-900 text-white rounded-full flex items-center justify-center hover:bg-primary transition-all active:scale-90 shadow-xl shadow-secondary-900/10 disabled:opacity-20"><Send className="h-5 w-5" /></button>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
