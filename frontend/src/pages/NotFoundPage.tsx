import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-secondary-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-9xl font-black text-primary mb-4 italic tracking-tighter shadow-sm">404</h1>
        <p className="text-xl font-black text-secondary-900 mb-8 uppercase tracking-widest">Page Not Found</p>
        <button onClick={() => navigate('/')} className="px-10 py-4 bg-secondary-900 text-white rounded-2xl font-black text-xs hover:bg-primary transition-all active:scale-95 shadow-2xl">返回首页</button>
      </div>
    </div>
  )
}
