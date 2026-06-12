import { Product } from './types'

export const MOCK_PRODUCTS: Product[] = [
    {
        id: 1, name: '降噪无线蓝牙耳机 Pro', description: '采用主动降噪技术，为您带来沉浸式听觉盛宴。', price: 1299, original_price: 1599, stock: 50, sales: 1200,
        main_image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=600',
        images: { gallery: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e', 'https://images.unsplash.com/photo-1484704849700-f032a568e944'] },
        specs: { '颜色': ['月岩灰', '暗夜黑'], '配置': ['标准版', 'Pro版'] }, shop_id: 1, created_at: '2024-01-01'
    },
    {
        id: 2, name: '智能运动手表 S3', description: '全天候心率监测，精准记录每一份运动汗水。', price: 899, original_price: 1099, stock: 100, sales: 850,
        main_image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=600',
        images: { gallery: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30', 'https://images.unsplash.com/photo-1508685096489-7aac29683950'] },
        specs: { '表带': ['氟橡胶', '真皮'], '尺寸': ['41mm', '45mm'] }, shop_id: 1, created_at: '2024-01-02'
    },
    {
        id: 3, name: '机械键盘 C1', description: '青轴质感，清脆回弹，码字如飞。', price: 499, original_price: 599, stock: 30, sales: 600,
        main_image: 'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?auto=format&fit=crop&q=80&w=600',
        images: { gallery: ['https://images.unsplash.com/photo-1511467687858-23d96c32e4ae'] },
        specs: { '轴体': ['青轴', '茶轴', '红轴'] }, shop_id: 1, created_at: '2024-01-03'
    },
    {
        id: 4, name: '潮流印花卫衣', description: '纯棉材质，亲肤舒适，街头风格。', price: 299, original_price: 399, stock: 200, sales: 3000,
        main_image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=600',
        images: { gallery: ['https://images.unsplash.com/photo-1556821840-3a63f95609a7'] },
        specs: { '尺码': ['M', 'L', 'XL', 'XXL'], '颜色': ['潮酷黑', '活力橘'] }, shop_id: 1, created_at: '2024-01-04'
    },
    {
        id: 5, name: '精华修复面霜', description: '深层滋养，修护屏障，焕发肌肤活力。', price: 588, original_price: 688, stock: 80, sales: 1500,
        main_image: 'https://images.unsplash.com/photo-1542459742-1e7658c42a66?auto=format&fit=crop&q=80&w=600',
        images: { gallery: ['https://images.unsplash.com/photo-1542459742-1e7658c42a66'] },
        specs: { '规格': ['50ml', '100ml'] }, shop_id: 1, created_at: '2024-01-05'
    },
    {
        id: 6, name: '高性能登山鞋', description: '强力抓地，防滑耐磨，专业级户外体验。', price: 799, original_price: 999, stock: 40, sales: 400,
        main_image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=600',
        images: { gallery: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff'] },
        specs: { '尺码': ['40', '41', '42', '43', '44'] }, shop_id: 1, created_at: '2024-01-06'
    }
]
