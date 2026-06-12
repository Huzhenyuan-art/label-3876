import React, { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Check, MessageCircle, Star, Heart, Search } from 'lucide-react'
import { Header } from '../components/Header'
import { Product, Shop } from '../types'
import { shopApi } from '../api'
import { useFavorites } from '../contexts/FavoritesContext'

const MOCK_SHOPS: Shop[] = [
  { id: 1, name: '极客数码旗舰店', logo: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=100&h=100&fit=crop', description: '专注高端数码配件，为您提供极致科技体验。', rating: 4.9, follower_count: 12500, created_at: '2023-01-01' },
]

const MOCK_PRODUCTS: Product[] = [
  {
    id: 1, name: '降噪无线蓝牙耳机 Pro', description: '采用主动降噪技术，为您带来沉浸式听觉盛宴。', price: 1299, original_price: 1599, stock: 50, sales: 1200,
    main_image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=600',
    images: { gallery: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e', 'https://images.unsplash.com/photo-1484704849700-f032a568e944'] },
    specs: { '颜色': ['月岩灰', '暗夜黑'], '配置': ['标准版', 'Pro版'] }, shop_id: 1, created_at: '2024-01-01'
  }
]

export default function ShopDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [shop, setShop] = useState<Shop | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const { toggleFavorite, isFavorite } = useFavorites()
  const [isFollowed, setIsFollowed] = useState(false)
  const [followers, setFollowers] = useState(0)
  const [activeCategory, setActiveCategory] = useState('全部商品')

  useEffect(() => {
    if (id) loadShopData(parseInt(id))
  }, [id])

  const loadShopData = async (shopId: number) => {
    try {
      const [shopRes, productsRes] = await Promise.all([shopApi.getById(shopId), shopApi.getProducts(shopId)])
      setShop(shopRes.data)
      setProducts(productsRes.data)
      setFollowers(shopRes.data.follower_count)
    } catch (error) {
      console.error(error)
      const mockShop = MOCK_SHOPS.find(s => s.id === shopId) || MOCK_SHOPS[0]
      setShop(mockShop)
      setProducts(MOCK_PRODUCTS.filter(p => p.shop_id === mockShop.id))
      setFollowers(mockShop.follower_count)
    } finally { setLoading(false) }
  }

  const filteredProducts = useMemo(() => {
    switch (activeCategory) {
      case '上新推荐':
        return [...products].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      case '本周热销':
        return [...products].sort((a, b) => b.sales - a.sales)
      case '优惠专区':
        return [...products]
          .filter(p => p.original_price !== null && p.original_price > p.price)
          .sort((a, b) => {
            const discountA = a.original_price! - a.price
            const discountB = b.original_price! - b.price
            return discountB - discountA
          })
      default:
        return products
    }
  }, [products, activeCategory])

  const toggleFollow = () => {
    setIsFollowed(!isFollowed)
    setFollowers(prev => isFollowed ? prev - 1 : prev + 1)
  }

  if (loading) return <div className="min-h-screen bg-secondary-50 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>
  if (!shop) return <div className="min-h-screen bg-secondary-50 flex items-center justify-center"><div><h2>店铺不存在</h2><button onClick={() => navigate('/')}>返回首页</button></div></div>

  return (
    <div className="min-h-screen bg-secondary-100/30">
      <Header />
      <div className="bg-secondary-900 text-white relative overflow-hidden">
        <div className="max-w-[1600px] mx-auto px-6 py-12 relative z-10">
          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-10">
            <img src={shop.logo} alt="" className="w-32 h-32 rounded-3xl object-cover shadow-2xl ring-4 ring-white/10" />
            <div className="flex-1 text-center lg:text-left">
              <h1 className="text-4xl font-black tracking-tighter mb-4 italic uppercase">{shop.name}</h1>
              <p className="text-secondary-400 font-medium mb-8 max-w-2xl text-sm leading-relaxed">{shop.description}</p>
              <div className="flex items-center justify-center lg:justify-start gap-10">
                <div className="flex flex-col"><span className="text-2xl font-black text-white">{followers.toLocaleString()}</span><span className="text-[10px] text-secondary-500 font-black uppercase tracking-widest mt-1">关注粉丝</span></div>
                <div className="flex flex-col"><span className="text-2xl font-black text-white">{products.length}</span><span className="text-[10px] text-secondary-500 font-black uppercase tracking-widest mt-1">在售商品</span></div>
              </div>
            </div>
            <div className="flex gap-4">
              <button
                onClick={toggleFollow}
                className={`px-8 py-4 rounded-2xl font-black text-xs transition-all flex items-center gap-2 ${isFollowed ? 'bg-secondary-800 text-secondary-400' : 'bg-white text-secondary-900 hover:bg-primary hover:text-white'}`}
              >
                {isFollowed ? <Check className="h-4 w-4" /> : null}
                {isFollowed ? '已关注' : '关注店铺'}
              </button>
              <Link to={`/chat/${shop.id}`} className="px-8 py-4 bg-primary text-white rounded-2xl font-black text-xs hover:bg-primary-600 transition-all flex items-center gap-2 shadow-xl shadow-primary/20"><MessageCircle className="h-4 w-4" />联系客服</Link>
            </div>
          </div>
        </div>
      </div>
      <main className="max-w-[1600px] mx-auto px-6 py-12">
        <div className="flex flex-col lg:flex-row gap-10 items-start">
          <aside className="w-full lg:w-64 shrink-0 space-y-8 lg:sticky lg:top-28">
            <div className="bg-white rounded-3xl p-6 shadow-xl border border-secondary-50">
              <nav className="flex flex-col gap-2">
                {['全部商品', '上新推荐', '本周热销', '优惠专区'].map(name => (
                  <button key={name} onClick={() => setActiveCategory(name)} className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-black text-xs transition-all ${activeCategory === name ? 'bg-primary text-white shadow-xl' : 'text-secondary-600 hover:text-primary'}`}>{name}</button>
                ))}
              </nav>
            </div>
          </aside>
          <div className="flex-1 min-w-0">
            {filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 text-secondary-400">
                <p className="text-lg font-black">{activeCategory}暂无商品</p>
                <p className="text-xs mt-2">换个分类看看吧</p>
              </div>
            ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredProducts.map(product => (
                <Link key={product.id} to={`/product/${product.id}`} className="group bg-white rounded-3xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 border border-secondary-50 flex flex-col">
                  <div className="relative overflow-hidden aspect-[4/5] shrink-0">
                    <img src={product.main_image} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(product); }}
                      className={`absolute top-4 right-4 p-2 rounded-xl backdrop-blur-md transition-all duration-300 z-10 ${isFavorite(product.id) ? 'bg-primary text-white scale-110 shadow-lg shadow-primary/30' : 'bg-white/20 text-white hover:bg-white hover:text-primary'}`}
                    >
                      <Heart className={`h-3.5 w-3.5 ${isFavorite(product.id) ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <h3 className="font-black text-secondary-900 mb-4 line-clamp-2 text-xs uppercase tracking-tight leading-tight">{product.name}</h3>
                    <div className="flex items-center justify-between"><span className="text-2xl font-black text-primary tracking-tighter italic">¥{product.price.toFixed(2)}</span><div className="bg-secondary-50 p-2.5 rounded-xl"><Search className="h-3.5 w-3.5" /></div></div>
                  </div>
                </Link>
              ))}
            </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
