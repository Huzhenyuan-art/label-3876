import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Search, Zap, TrendingUp, Sparkles, Headphones, Heart, ChevronRight, X } from 'lucide-react'
import { Header } from '../components/Header'
import { Product } from '../types'
import { productApi } from '../api'
import { useFavorites } from '../contexts/FavoritesContext'

import { MOCK_PRODUCTS } from '../mocks'

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('全部')
  const recommendRef = React.useRef<HTMLElement>(null)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const q = (searchParams.get('q') || '').toLowerCase()
  const { toggleFavorite, isFavorite } = useFavorites()

  useEffect(() => {
    loadProducts()
  }, [])

  const filteredProducts = React.useMemo(() => {
    let results = products
    if (activeCategory !== '全部') {
      const catPrefix = activeCategory.slice(0, 2)
      results = results.filter(p =>
        p.name.includes(catPrefix) ||
        p.description?.includes(catPrefix)
      )
    }
    if (q) {
      results = results.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
      )
    }
    return results
  }, [activeCategory, products, q])

  const loadProducts = async () => {
    try {
      const response = await productApi.getAll()
      if (response.data && response.data.length > 0) {
        setProducts(response.data)
      } else {
        setProducts(MOCK_PRODUCTS)
      }
    } catch (error) {
      console.error('Failed to load products:', error)
      setProducts(MOCK_PRODUCTS)
    } finally {
      setLoading(false)
    }
  }

  const scrollToRecommend = () => {
    recommendRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="min-h-screen bg-secondary-100/20 dark:bg-secondary-950 transition-colors duration-500">
      <Header />
      <main className="max-w-[1600px] mx-auto px-6 py-10 relative">
        <aside className="fixed right-6 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-40">
          <div className="bg-white/80 dark:bg-secondary-900/80 backdrop-blur-xl p-3 rounded-2xl shadow-2xl border border-white dark:border-secondary-800 flex flex-col gap-5 transition-colors">
            <button className="group relative flex flex-col items-center gap-1 text-secondary-400 dark:text-secondary-500 hover:text-primary transition-all">
              <Zap className="h-6 w-6 group-hover:scale-125 transition-transform" />
            </button>
            <button className="group relative flex flex-col items-center gap-1 text-secondary-400 dark:text-secondary-500 hover:text-accent transition-all">
              <TrendingUp className="h-6 w-6 group-hover:scale-125 transition-transform" />
            </button>
            <button className="group relative flex flex-col items-center gap-1 text-secondary-400 dark:text-secondary-500 hover:text-primary transition-all">
              <Sparkles className="h-6 w-6 group-hover:scale-125 transition-transform" />
            </button>
            <div className="h-px bg-secondary-100 dark:bg-secondary-800 mx-1" />
            <button className="group relative flex flex-col items-center gap-1 text-secondary-400 dark:text-secondary-500 hover:text-accent transition-all">
              <Headphones className="h-6 w-6 group-hover:scale-125 transition-transform" />
            </button>
          </div>
        </aside>

        <div className="flex flex-col gap-10">
          <section className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1 bg-white dark:bg-secondary-900 rounded-2xl p-6 shadow-xl shadow-secondary-200/20 border border-secondary-50 dark:border-secondary-800 transition-colors">
              <h3 className="text-sm font-black text-secondary-900 dark:text-white mb-6 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" /> 热点分类
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {['潮流服装', '智能数码', '美妆护肤', '居家生活', '图书文具', '户外运动'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat === activeCategory ? '全部' : cat)}
                    className={`flex items-center justify-center p-3 rounded-xl transition-all text-[11px] font-bold border ${activeCategory === cat ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105' : 'bg-secondary-50 dark:bg-secondary-800 text-secondary-600 dark:text-secondary-400 border-transparent dark:border-secondary-700 hover:bg-primary/5 hover:text-primary hover:border-primary/20'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <div className="lg:col-span-3 bg-primary/5 dark:bg-primary/10 rounded-2xl p-8 relative overflow-hidden group border border-primary/10 transition-colors">
              <div className="relative z-10 max-w-lg">
                <span className="inline-block px-3 py-1 bg-primary text-white text-[10px] font-black rounded-lg mb-4">限时特惠活动</span>
                <h2 className="text-5xl font-black text-secondary-900 dark:text-white leading-none tracking-tighter mb-6">超级品牌周<br /><span className="text-primary">全场5折起</span></h2>
                <button
                  onClick={scrollToRecommend}
                  className="bg-secondary-900 dark:bg-primary text-white px-8 py-3 rounded-xl font-black text-sm hover:bg-primary dark:hover:bg-primary-600 transition-all active:scale-95 shadow-2xl shadow-secondary-900/10 flex items-center gap-2 group"
                >
                  立即探索 <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
              <div className="absolute top-0 right-0 w-1/2 h-full opacity-20 group-hover:opacity-30 transition-opacity">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary rounded-full blur-[100px]" />
              </div>
            </div>
          </section>

          <section ref={recommendRef}>
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-4xl font-black text-secondary-900 dark:text-white tracking-tighter mb-2">为您推荐 {activeCategory !== '全部' && <span className="text-primary ml-2">/ {activeCategory}</span>}</h2>
                <div className="flex items-center gap-3"><span className="h-1.5 w-12 bg-primary rounded-full" /><span className="text-sm font-bold text-secondary-400 dark:text-secondary-500 uppercase tracking-widest">Recommended for You</span></div>
              </div>
              {activeCategory !== '全部' && (
                <button onClick={() => setActiveCategory('全部')} className="text-xs font-black text-secondary-400 dark:text-secondary-500 hover:text-primary transition-colors flex items-center gap-2 border-b-2 border-transparent hover:border-primary pb-1">清除重置 <X className="h-3 w-3" /></button>
              )}
            </div>

            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="bg-white dark:bg-secondary-900 rounded-2xl p-4 shadow-xl shadow-secondary-200/20 border border-secondary-50 dark:border-secondary-800 animate-pulse transition-colors">
                    <div className="w-full aspect-square bg-secondary-100 dark:bg-secondary-800 rounded-xl mb-4" />
                    <div className="h-4 bg-secondary-100 dark:bg-secondary-800 rounded w-3/4 mb-3" /><div className="h-6 bg-secondary-100 dark:bg-secondary-800 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
                {filteredProducts.map((product) => (
                  <Link key={product.id} to={`/product/${product.id}`} className="group bg-white dark:bg-secondary-900 rounded-2xl shadow-xl shadow-secondary-200/20 dark:shadow-black/20 overflow-hidden hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 hover:-translate-y-3 border border-secondary-50 dark:border-secondary-800 flex flex-col outline outline-2 outline-transparent hover:outline-primary/20 animate-in fade-in zoom-in-95 duration-500">
                    <div className="relative overflow-hidden aspect-[4/5] shrink-0">
                      <img src={product.main_image} alt={product.name} loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-secondary-900/60 to-transparent group-hover:from-primary/60 transition-colors" />
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(product); }}
                        className={`absolute top-4 right-4 p-2 rounded-xl backdrop-blur-md transition-all duration-300 z-10 ${isFavorite(product.id) ? 'bg-primary text-white scale-110 shadow-lg shadow-primary/30' : 'bg-white/20 dark:bg-secondary-900/40 text-white hover:bg-white dark:hover:bg-secondary-800'}`}
                      >
                        <Heart className={`h-4 w-4 ${isFavorite(product.id) ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                    <div className="p-6 flex-1 flex flex-col justify-between">
                      <h3 className="font-black text-secondary-900 dark:text-white mb-4 line-clamp-2 text-[11px] leading-tight group-hover:text-primary transition-colors h-8 uppercase tracking-tight">{product.name}</h3>
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-black text-primary tracking-tighter italic"><span className="text-sm mr-0.5 not-italic">¥</span>{product.price.toFixed(2)}</span>
                        <div className="bg-secondary-50 dark:bg-secondary-800 group-hover:bg-primary group-hover:text-white p-2.5 rounded-xl transition-all active:scale-75 shadow-sm"><Zap className="h-3.5 w-3.5" /></div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-secondary-900 rounded-3xl border-2 border-dashed border-secondary-100 dark:border-secondary-800 animate-in fade-in zoom-in duration-500">
                <div className="w-24 h-24 bg-secondary-50 dark:bg-secondary-800 rounded-full flex items-center justify-center mb-6">
                  <Search className="h-10 w-10 text-secondary-200 dark:text-secondary-700" />
                </div>
                <h3 className="text-xl font-black text-secondary-900 dark:text-white mb-2">未找到相关商品</h3>
                <p className="text-secondary-400 dark:text-secondary-500 text-sm font-bold">换个关键词试试，或者清除过滤条件</p>
                <button onClick={() => { setActiveCategory('全部'); navigate('/'); }} className="mt-8 px-8 py-3 bg-primary text-white rounded-xl font-black text-xs hover:bg-primary-600 transition-all shadow-lg shadow-primary/20">查看全部商品</button>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}
