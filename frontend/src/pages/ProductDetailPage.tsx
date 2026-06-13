import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Minus, Plus, MessageCircle, Store, ShoppingCart, Check, Heart } from 'lucide-react'
import { Header } from '../components/Header'
import { Product } from '../types'
import { productApi } from '../api'
import { useCart } from '../contexts/CartContext'
import { useFavorites } from '../contexts/FavoritesContext'
import { useAuth } from '../contexts/AuthContext'

import { MOCK_PRODUCTS } from '../mocks'

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const { toggleFavorite, isFavorite } = useFavorites()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedSpecs, setSelectedSpecs] = useState<Record<string, string>>({})
  const [quantity, setQuantity] = useState(1)
  const [isAdding, setIsAdding] = useState(false)
  const [showToast, setShowToast] = useState(false)

  useEffect(() => {
    if (id) loadProduct(parseInt(id))
  }, [id])

  const loadProduct = async (productId: number) => {
    try {
      const response = await productApi.getById(productId)
      setProduct(response.data)
      if (response.data.specs) {
        const initialSpecs: Record<string, string> = {}
        Object.entries(response.data.specs).forEach(([key, values]) => { initialSpecs[key] = values[0] })
        setSelectedSpecs(initialSpecs)
      }
    } catch (error) {
      console.error(error)
      const mockProduct = MOCK_PRODUCTS.find(p => p.id === productId)
      if (mockProduct) setProduct(mockProduct)
    } finally { setLoading(false) }
  }

  const getPriceAndStock = (specs: Record<string, string>) => {
    if (!product) return { price: 0, stock: 0 }
    const specString = Object.values(specs).sort().join('-')
    let priceOffset = specString.includes('Pro') || specString.includes('1TB') ? 1000 : 0
    return { price: product.price + priceOffset, stock: product.stock }
  }

  const { price: displayPrice, stock: displayStock } = getPriceAndStock(selectedSpecs)

  const handleAddToCart = () => {
    if (!product) return
    setIsAdding(true)
    setTimeout(() => {
      addToCart({ ...product, price: displayPrice }, quantity, selectedSpecs)
      setIsAdding(false)
      setShowToast(true)
      setTimeout(() => setShowToast(false), 3000)
    }, 800)
  }

  const handleBuyNow = () => {
    if (!product) return
    addToCart({ ...product, price: displayPrice }, quantity, selectedSpecs)
    setShowToast(true)
    setTimeout(() => navigate('/cart'), 500)
  }

  if (loading) return <div className="min-h-screen bg-secondary-50 dark:bg-secondary-900 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>
  if (!product) return <div className="min-h-screen bg-secondary-50 dark:bg-secondary-900 flex items-center justify-center"><div><h2 className="dark:text-white">商品不存在</h2><button className="dark:text-primary" onClick={() => navigate('/')}>返回首页</button></div></div>

  const images = product.images?.gallery || [product.main_image]

  return (
    <div className="min-h-screen bg-secondary-50/30 dark:bg-secondary-950 transition-colors duration-500">
      <Header showSearch={false} />
      <main className="max-w-7xl mx-auto px-6 py-12 pb-32">
        <div className="flex flex-col lg:flex-row gap-12 items-start">
          <div className="w-full lg:w-[500px] shrink-0 lg:sticky lg:top-28 space-y-6">
            <div className="bg-white dark:bg-secondary-900 rounded-3xl overflow-hidden shadow-2xl border border-secondary-100 dark:border-secondary-800 aspect-square relative cursor-zoom-in transition-colors">
              <img src={images[selectedImage]} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
              <button
                onClick={() => toggleFavorite(product)}
                className={`absolute top-6 right-6 p-4 rounded-2xl backdrop-blur-md transition-all duration-300 z-10 ${isFavorite(product.id) ? 'bg-primary text-white scale-110 shadow-xl shadow-primary/30' : 'bg-white/80 dark:bg-secondary-900/80 text-secondary-400 dark:text-secondary-400 hover:text-primary hover:bg-white dark:hover:bg-secondary-800 shadow-xl'}`}
              >
                <Heart className={`h-6 w-6 ${isFavorite(product.id) ? 'fill-current' : ''}`} />
              </button>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
              {images.map((img, idx) => (
                <button key={idx} onClick={() => setSelectedImage(idx)} className={`flex-shrink-0 w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all p-1 ${selectedImage === idx ? 'border-primary ring-4 ring-primary/10' : 'border-secondary-100 dark:border-secondary-800 opacity-60'}`}>
                  <img src={img} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover rounded-xl" />
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 space-y-8 min-w-0">
            <div className="bg-white dark:bg-secondary-900 rounded-2xl p-10 shadow-xl border border-secondary-50 dark:border-secondary-800 relative overflow-hidden transition-colors">
              <h1 className="text-4xl font-black text-secondary-900 dark:text-white mb-4 tracking-tighter italic uppercase">{product.name}</h1>
              <p className="text-secondary-400 dark:text-secondary-500 mb-10 font-bold leading-relaxed italic">{product.description}</p>
              <div className="bg-secondary-50 dark:bg-secondary-800 p-8 rounded-2xl border border-secondary-100 dark:border-secondary-700 mb-10 transition-colors">
                <span className="text-5xl font-black text-primary tracking-tighter italic">¥{displayPrice.toFixed(2)}</span>
                <div className="flex items-center gap-4 text-xs font-black text-secondary-400 dark:text-secondary-500 pt-4 border-t border-secondary-200/50 dark:border-secondary-700 mt-4 uppercase tracking-widest">
                  <span>月销量 {product.sales}+</span><span className="w-px h-3 bg-secondary-200 dark:bg-secondary-700" /><span>当前库存 {displayStock} 件</span>
                </div>
              </div>
              {product.specs && Object.entries(product.specs).map(([key, values]) => (
                <div key={key} className="mb-8">
                  <h3 className="text-xs font-black text-secondary-500 dark:text-secondary-400 uppercase tracking-widest mb-4">{key}</h3>
                  <div className="flex flex-wrap gap-3">
                    {(values as string[]).map((value) => (
                      <button key={value} onClick={() => setSelectedSpecs(prev => ({ ...prev, [key]: value }))} className={`px-6 py-3 rounded-xl border-2 transition-all font-black text-xs ${selectedSpecs[key] === value ? 'border-primary bg-primary text-white shadow-2xl scale-105' : 'border-secondary-100 dark:border-secondary-700 text-secondary-600 dark:text-secondary-400 hover:border-primary/50'}`}>{value}</button>
                    ))}
                  </div>
                </div>
              ))}
              <div className="mb-10">
                <h3 className="text-xs font-black text-secondary-500 dark:text-secondary-400 mb-4 uppercase tracking-widest">购买数量</h3>
                <div className="flex items-center bg-secondary-50 dark:bg-secondary-800 w-fit p-1.5 rounded-xl border border-secondary-100 dark:border-secondary-700 shadow-inner transition-colors">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-12 h-12 rounded-lg bg-white dark:bg-secondary-700 shadow-sm flex items-center justify-center text-secondary-900 dark:text-white hover:text-primary transition-all active:scale-75 disabled:opacity-30"><Minus className="h-4 w-4" /></button>
                  <span className="w-20 text-center font-black text-secondary-900 dark:text-white">{quantity}</span>
                  <button onClick={() => setQuantity(Math.min(displayStock, quantity + 1))} className="w-12 h-12 rounded-lg bg-white dark:bg-secondary-700 shadow-sm flex items-center justify-center text-secondary-900 dark:text-white hover:text-primary transition-all active:scale-75"><Plus className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <div className="fixed bottom-0 inset-x-0 bg-white/80 dark:bg-secondary-900/80 backdrop-blur-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.08)] border-t border-secondary-50 dark:border-secondary-800 z-50 transition-colors">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
          <div className="flex items-center gap-10">
            <Link to={`/chat/${product.shop_id}`} className="flex flex-col items-center gap-1 text-secondary-400 hover:text-accent transition-all"><MessageCircle className="h-6 w-6" /><span className="text-[10px] font-black uppercase tracking-widest">联系客服</span></Link>
            <Link to={`/shop/${product.shop_id}`} className="flex flex-col items-center gap-1 text-secondary-400 hover:text-primary transition-all"><Store className="h-6 w-6" /><span className="text-[10px] font-black uppercase tracking-widest">进入店铺</span></Link>
          </div>
          <div className="flex flex-1 max-w-md gap-3">
            <button onClick={handleAddToCart} disabled={isAdding} className="flex-1 bg-secondary-900 dark:bg-secondary-800 text-white h-14 rounded-2xl font-black text-sm hover:bg-secondary-800 dark:hover:bg-secondary-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 uppercase tracking-widest transition-colors"><ShoppingCart className="h-5 w-5" />{isAdding ? '处理中...' : '加入购物车'}</button>
            <button onClick={handleBuyNow} className="flex-1 bg-primary text-white h-14 rounded-2xl font-black text-sm hover:bg-primary-600 transition-all shadow-xl shadow-primary/20 uppercase tracking-widest">立即购买</button>
          </div>
        </div>
      </div>
      {showToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-secondary-900 dark:bg-secondary-800 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-white/10 dark:border-secondary-700 backdrop-blur-xl">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center"><Check className="h-4 w-4 text-white" /></div>
            <div><p className="text-sm font-black tracking-tight">成功加入购物车！</p><Link to="/cart" className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline mt-0.5 block">立即去结算 →</Link></div>
          </div>
        </div>
      )}
    </div>
  )
}
