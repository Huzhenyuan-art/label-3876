import React, { useState, useEffect, useMemo, useRef } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Minus, Plus, MessageCircle, Store, ShoppingCart, Check, Heart, Sparkles, Zap, Percent, AlertTriangle } from 'lucide-react'
import { Header } from '../components/Header'
import { Product, ProductSpec, getProductPriceAndStock, calculateDiscount, LOW_STOCK_THRESHOLD } from '../types'
import { productApi } from '../api'
import { useCart } from '../contexts/CartContext'
import { useFavorites } from '../contexts/FavoritesContext'

import { MOCK_PRODUCTS } from '../mocks'

function extractSpecs(specs: ProductSpec[] | Record<string, string[]> | null): Record<string, string> {
  if (!specs) return {}
  const result: Record<string, string> = {}
  
  if (Array.isArray(specs)) {
    for (const spec of specs) {
      if (!spec || typeof spec !== 'object') continue
      if (typeof spec.name !== 'string' || !Array.isArray(spec.values)) continue
      const firstVal = spec.values[0]
      result[spec.name] = (firstVal && typeof firstVal === 'object' && 'value' in firstVal) ? firstVal.value : (typeof firstVal === 'string' ? firstVal : '')
    }
  } else if (typeof specs === 'object') {
    for (const [name, values] of Object.entries(specs)) {
      if (Array.isArray(values) && values.length > 0) {
        result[name] = values[0]
      }
    }
  }
  return result
}

function safeSpecEntries(specs: ProductSpec[] | Record<string, string[]> | null): { name: string; values: { value: string }[] }[] {
  if (!specs) return []
  const result: { name: string; values: { value: string }[] }[] = []
  
  if (Array.isArray(specs)) {
    for (const spec of specs) {
      if (!spec || typeof spec !== 'object') continue
      if (typeof spec.name !== 'string') continue
      if (!spec.values || !Array.isArray(spec.values)) continue
      
      const values: { value: string }[] = []
      for (const v of spec.values) {
        if (v == null) continue
        if (typeof v === 'object' && typeof v.value === 'string') {
          values.push({ value: v.value })
        } else if (typeof v === 'string') {
          values.push({ value: v })
        }
      }
      
      if (values.length > 0) {
        result.push({ name: spec.name, values })
      }
    }
  } else if (typeof specs === 'object') {
    for (const [name, values] of Object.entries(specs)) {
      if (!Array.isArray(values)) continue
      const cleanedValues: { value: string }[] = []
      for (const v of values) {
        if (typeof v === 'string') {
          cleanedValues.push({ value: v })
        }
      }
      if (cleanedValues.length > 0) {
        result.push({ name, values: cleanedValues })
      }
    }
  }
  return result
}

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
  const [recommended, setRecommended] = useState<Product[]>([])
  const [recLoading, setRecLoading] = useState(false)
  const mountedRef = useRef(true)

  useEffect(() => {
    return () => { mountedRef.current = false }
  }, [])

  useEffect(() => {
    setLoading(true)
    setProduct(null)
    setSelectedSpecs({})
    setQuantity(1)
    setSelectedImage(0)
    setRecommended([])
    if (id) {
      const productId = parseInt(id, 10)
      if (!isNaN(productId)) {
        loadProduct(productId)
      } else {
        setLoading(false)
      }
    } else {
      setLoading(false)
    }
  }, [id])

  const loadRecommended = async (catId: number | null, shopId: number, productId: number) => {
    setRecLoading(true)
    try {
      const list = await productApi.getRecommended(catId, shopId, productId)
      if (!mountedRef.current) return
      if (list.length > 0) {
        setRecommended(list)
      } else {
        const fallback = MOCK_PRODUCTS.filter(p => p.id !== productId)
        setRecommended(catId != null ? fallback.filter(p => p.category_id === catId) : fallback.filter(p => p.shop_id === shopId))
      }
    } catch {
      if (!mountedRef.current) return
      const fallback = MOCK_PRODUCTS.filter(p => p.id !== productId)
      setRecommended(catId != null ? fallback.filter(p => p.category_id === catId) : fallback.filter(p => p.shop_id === shopId))
    } finally {
      if (mountedRef.current) setRecLoading(false)
    }
  }

  const loadProduct = async (productId: number) => {
    try {
      const response = await productApi.getById(productId)
      if (!mountedRef.current) return
      const p = response.data
      setProduct(p)
      setSelectedSpecs(extractSpecs(p.specs))
      loadRecommended(p.category_id, p.shop_id, productId)
    } catch (error) {
      if (!mountedRef.current) return
      console.error(error)
      const mockProduct = MOCK_PRODUCTS.find(p => p.id === productId)
      if (mockProduct) {
        setProduct(mockProduct)
        setSelectedSpecs(extractSpecs(mockProduct.specs))
        loadRecommended(mockProduct.category_id, mockProduct.shop_id, productId)
      }
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }

  const { price: displayPrice, original_price: displayOriginalPrice, stock: displayStock, skuId: currentSkuId, discount, isLowStock } = useMemo(() => {
    if (!product) return { price: 0, original_price: null, stock: 0, skuId: undefined, discount: null, isLowStock: false }
    const priceInfo = getProductPriceAndStock(product, selectedSpecs)
    const discount = calculateDiscount(priceInfo.price, priceInfo.original_price)
    const isLowStock = priceInfo.stock > 0 && priceInfo.stock <= LOW_STOCK_THRESHOLD
    return { ...priceInfo, discount, isLowStock }
  }, [product, selectedSpecs])

  const specEntries = useMemo(() => safeSpecEntries(product?.specs ?? null), [product])

  const handleAddToCart = async () => {
    if (!product) return
    setIsAdding(true)
    try {
      await addToCart({ ...product, price: displayPrice, original_price: displayOriginalPrice, stock: displayStock }, quantity, selectedSpecs, currentSkuId)
      setShowToast(true)
      setTimeout(() => setShowToast(false), 3000)
    } catch (error) {
      console.error('Failed to add to cart:', error)
    } finally {
      setIsAdding(false)
    }
  }

  const handleBuyNow = async () => {
    if (!product) return
    try {
      await addToCart({ ...product, price: displayPrice, original_price: displayOriginalPrice, stock: displayStock }, quantity, selectedSpecs, currentSkuId)
      setShowToast(true)
      setTimeout(() => navigate('/cart'), 500)
    } catch (error) {
      console.error('Failed to add to cart:', error)
    }
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
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-5xl font-black text-primary tracking-tighter italic">¥{displayPrice.toFixed(2)}</span>
                  {discount !== null && (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-primary to-primary-600 text-white text-xs font-black rounded-xl shadow-lg shadow-primary/30 uppercase tracking-wider">
                      <Percent className="h-3.5 w-3.5" />
                      {discount}折
                    </span>
                  )}
                </div>
                {displayOriginalPrice && displayOriginalPrice > displayPrice && (
                  <span className="text-xl font-bold text-secondary-300 dark:text-secondary-600 line-through tracking-tighter">¥{displayOriginalPrice.toFixed(2)}</span>
                )}
                <div className="flex items-center gap-4 text-xs font-black text-secondary-400 dark:text-secondary-500 pt-4 border-t border-secondary-200/50 dark:border-secondary-700 mt-4 uppercase tracking-widest">
                  <span>月销量 {product.sales}+</span>
                  <span className="w-px h-3 bg-secondary-200 dark:bg-secondary-700" />
                  {isLowStock ? (
                    <span className="flex items-center gap-1.5 text-red-500">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      库存紧张 仅剩 {displayStock} 件
                    </span>
                  ) : (
                    <span>当前库存 {displayStock} 件</span>
                  )}
                </div>
              </div>
              {specEntries.map((spec) => (
                <div key={spec.name} className="mb-8">
                  <h3 className="text-xs font-black text-secondary-500 dark:text-secondary-400 uppercase tracking-widest mb-4">{spec.name}</h3>
                  <div className="flex flex-wrap gap-3">
                    {spec.values.map((val) => (
                      <button
                        key={val.value}
                        onClick={() => setSelectedSpecs(prev => ({ ...prev, [spec.name]: val.value }))}
                        className={`px-6 py-3 rounded-xl border-2 transition-all font-black text-xs ${selectedSpecs[spec.name] === val.value ? 'border-primary bg-primary text-white shadow-2xl scale-105' : 'border-secondary-100 dark:border-secondary-700 text-secondary-600 dark:text-secondary-400 hover:border-primary/50'}`}
                      >
                        {val.value}
                      </button>
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
        {recommended.length > 0 && (
          <section className="mt-16">
            <div className="flex items-center gap-3 mb-8">
              <Sparkles className="h-6 w-6 text-primary" />
              <h2 className="text-3xl font-black text-secondary-900 dark:text-white tracking-tighter">同类推荐</h2>
              <span className="h-1.5 w-12 bg-primary rounded-full" />
              <span className="text-sm font-bold text-secondary-400 dark:text-secondary-500 uppercase tracking-widest">Similar Products</span>
            </div>
            {recLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white dark:bg-secondary-900 rounded-2xl p-4 shadow-xl border border-secondary-50 dark:border-secondary-800 animate-pulse">
                    <div className="w-full aspect-square bg-secondary-100 dark:bg-secondary-800 rounded-xl mb-4" />
                    <div className="h-4 bg-secondary-100 dark:bg-secondary-800 rounded w-3/4 mb-3" />
                    <div className="h-6 bg-secondary-100 dark:bg-secondary-800 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {recommended.map((item) => (
                  <Link key={item.id} to={`/product/${item.id}`} className="group bg-white dark:bg-secondary-900 rounded-2xl shadow-xl shadow-secondary-200/20 dark:shadow-black/20 overflow-hidden hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 hover:-translate-y-2 border border-secondary-50 dark:border-secondary-800 flex flex-col">
                    <div className="relative overflow-hidden aspect-[4/5] shrink-0">
                      <img src={item.main_image} alt={item.name} loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-secondary-900/60 to-transparent group-hover:from-primary/60 transition-colors" />
                    </div>
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <h3 className="font-black text-secondary-900 dark:text-white mb-3 line-clamp-2 text-xs leading-tight group-hover:text-primary transition-colors uppercase tracking-tight">{item.name}</h3>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-black text-primary tracking-tighter italic"><span className="text-xs mr-0.5 not-italic">¥</span>{item.price.toFixed(2)}</span>
                        <div className="bg-secondary-50 dark:bg-secondary-800 group-hover:bg-primary group-hover:text-white p-2 rounded-xl transition-all active:scale-75 shadow-sm"><Zap className="h-3.5 w-3.5" /></div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}
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
