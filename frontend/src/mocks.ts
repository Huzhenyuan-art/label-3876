import { Product, Sku, Order, OrderStatus } from './types'

const generateProductSpecs = (specs: { name: string; values: string[] }[]) => {
    return specs.map(spec => ({
        name: spec.name,
        values: spec.values.map(value => ({ value }))
    }))
}

type SkuPriceEntry = {
    price: number
    original_price: number
    stock: number
}

const generateSkusFromPriceMap = (
    specs: { name: string; values: string[] }[],
    priceMap: Record<string, SkuPriceEntry>,
    defaultEntry: SkuPriceEntry
): Sku[] => {
    const combinations: Record<string, string>[] = []
    const generate = (index: number, current: Record<string, string>) => {
        if (index === specs.length) {
            combinations.push({ ...current })
            return
        }
        for (const value of specs[index].values) {
            generate(index + 1, { ...current, [specs[index].name]: value })
        }
    }
    generate(0, {})

    return combinations.map((specs, idx) => {
        const key = Object.values(specs).join('/')
        const entry = priceMap[key] || defaultEntry
        return {
            id: idx + 1,
            sku_code: `SKU-${String(idx + 1).padStart(6, '0')}`,
            specs,
            price: entry.price,
            original_price: entry.original_price,
            stock: entry.stock,
        }
    })
}

const product1Specs = [{ name: '颜色', values: ['月岩灰', '暗夜黑'] }, { name: '配置', values: ['标准版', 'Pro版'] }]
const product1Skus = generateSkusFromPriceMap(product1Specs, {
    '月岩灰/标准版': { price: 1299, original_price: 1599, stock: 50 },
    '月岩灰/Pro版': { price: 1688, original_price: 1999, stock: 30 },
    '暗夜黑/标准版': { price: 1299, original_price: 1599, stock: 45 },
    '暗夜黑/Pro版': { price: 1688, original_price: 1999, stock: 25 },
}, { price: 1299, original_price: 1599, stock: 40 })

const product2Specs = [{ name: '表带', values: ['氟橡胶', '真皮'] }, { name: '尺寸', values: ['41mm', '45mm'] }]
const product2Skus = generateSkusFromPriceMap(product2Specs, {
    '氟橡胶/41mm': { price: 899, original_price: 1099, stock: 100 },
    '氟橡胶/45mm': { price: 1099, original_price: 1299, stock: 80 },
    '真皮/41mm': { price: 1199, original_price: 1399, stock: 60 },
    '真皮/45mm': { price: 1399, original_price: 1699, stock: 50 },
}, { price: 899, original_price: 1099, stock: 70 })

const product3Specs = [{ name: '轴体', values: ['青轴', '茶轴', '红轴'] }]
const product3Skus = generateSkusFromPriceMap(product3Specs, {
    '青轴': { price: 499, original_price: 599, stock: 30 },
    '茶轴': { price: 529, original_price: 629, stock: 25 },
    '红轴': { price: 549, original_price: 649, stock: 20 },
}, { price: 499, original_price: 599, stock: 25 })

const product4Specs = [{ name: '尺码', values: ['M', 'L', 'XL', 'XXL'] }, { name: '颜色', values: ['潮酷黑', '活力橘'] }]
const product4Skus = generateSkusFromPriceMap(product4Specs, {
    'M/潮酷黑': { price: 299, original_price: 399, stock: 200 },
    'M/活力橘': { price: 299, original_price: 399, stock: 180 },
    'L/潮酷黑': { price: 299, original_price: 399, stock: 190 },
    'L/活力橘': { price: 299, original_price: 399, stock: 170 },
    'XL/潮酷黑': { price: 319, original_price: 419, stock: 150 },
    'XL/活力橘': { price: 319, original_price: 419, stock: 130 },
    'XXL/潮酷黑': { price: 329, original_price: 429, stock: 100 },
    'XXL/活力橘': { price: 329, original_price: 429, stock: 90 },
}, { price: 299, original_price: 399, stock: 150 })

const product5Specs = [{ name: '规格', values: ['50ml', '100ml'] }]
const product5Skus = generateSkusFromPriceMap(product5Specs, {
    '50ml': { price: 588, original_price: 688, stock: 80 },
    '100ml': { price: 988, original_price: 1188, stock: 40 },
}, { price: 588, original_price: 688, stock: 60 })

const product6Specs = [{ name: '尺码', values: ['40', '41', '42', '43', '44'] }]
const product6Skus = generateSkusFromPriceMap(product6Specs, {
    '40': { price: 799, original_price: 999, stock: 40 },
    '41': { price: 799, original_price: 999, stock: 35 },
    '42': { price: 799, original_price: 999, stock: 30 },
    '43': { price: 799, original_price: 999, stock: 25 },
    '44': { price: 799, original_price: 999, stock: 20 },
}, { price: 799, original_price: 999, stock: 30 })

export const MOCK_PRODUCTS: Product[] = [
    {
        id: 1, name: '降噪无线蓝牙耳机 Pro', description: '采用主动降噪技术，为您带来沉浸式听觉盛宴。', price: 1299, original_price: 1599, stock: 50, sales: 1200,
        main_image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=600',
        images: { gallery: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e', 'https://images.unsplash.com/photo-1484704849700-f032a568e944'] },
        specs: generateProductSpecs(product1Specs),
        skus: product1Skus,
        shop_id: 1, category_id: null, created_at: '2024-01-01'
    },
    {
        id: 2, name: '智能运动手表 S3', description: '全天候心率监测，精准记录每一份运动汗水。', price: 899, original_price: 1099, stock: 100, sales: 850,
        main_image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=600',
        images: { gallery: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30', 'https://images.unsplash.com/photo-1508685096489-7aac29683950'] },
        specs: generateProductSpecs(product2Specs),
        skus: product2Skus,
        shop_id: 1, category_id: null, created_at: '2024-01-02'
    },
    {
        id: 3, name: '机械键盘 C1', description: '青轴质感，清脆回弹，码字如飞。', price: 499, original_price: 599, stock: 30, sales: 600,
        main_image: 'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?auto=format&fit=crop&q=80&w=600',
        images: { gallery: ['https://images.unsplash.com/photo-1511467687858-23d96c32e4ae'] },
        specs: generateProductSpecs(product3Specs),
        skus: product3Skus,
        shop_id: 1, category_id: null, created_at: '2024-01-03'
    },
    {
        id: 4, name: '潮流印花卫衣', description: '纯棉材质，亲肤舒适，街头风格。', price: 299, original_price: 399, stock: 200, sales: 3000,
        main_image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=600',
        images: { gallery: ['https://images.unsplash.com/photo-1556821840-3a63f95609a7'] },
        specs: generateProductSpecs(product4Specs),
        skus: product4Skus,
        shop_id: 1, category_id: null, created_at: '2024-01-04'
    },
    {
        id: 5, name: '精华修复面霜', description: '深层滋养，修护屏障，焕发肌肤活力。', price: 588, original_price: 688, stock: 80, sales: 1500,
        main_image: 'https://images.unsplash.com/photo-1542459742-1e7658c42a66?auto=format&fit=crop&q=80&w=600',
        images: { gallery: ['https://images.unsplash.com/photo-1542459742-1e7658c42a66'] },
        specs: generateProductSpecs(product5Specs),
        skus: product5Skus,
        shop_id: 1, category_id: null, created_at: '2024-01-05'
    },
    {
        id: 6, name: '高性能登山鞋', description: '强力抓地，防滑耐磨，专业级户外体验。', price: 799, original_price: 999, stock: 40, sales: 400,
        main_image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=600',
        images: { gallery: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff'] },
        specs: generateProductSpecs(product6Specs),
        skus: product6Skus,
        shop_id: 1, category_id: null, created_at: '2024-01-06'
    }
]

const createOrderItem = (
    id: number,
    orderId: number,
    productId: number,
    productName: string,
    productImage: string,
    price: number,
    quantity: number,
    specs: Record<string, string> | null = null,
    createdAt: string
) => ({
    id,
    order_id: orderId,
    product_id: productId,
    product_name: productName,
    product_image: productImage,
    price,
    quantity,
    specs,
    created_at: createdAt,
})

const createOrder = (
    id: number,
    orderNo: string,
    status: OrderStatus,
    items: ReturnType<typeof createOrderItem>[],
    createdAt: string,
    updatedAt: string
): Order => {
    const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    return {
        id,
        order_no: orderNo,
        user_id: 1,
        status,
        total_amount: totalAmount,
        shipping_address: '北京市朝阳区建国路88号SOHO现代城A座1201室',
        contact_name: '张三',
        contact_phone: '13800138000',
        payment_method: '微信支付',
        shipping_method: '顺丰速运',
        created_at: createdAt,
        updated_at: updatedAt,
        items,
    }
}

export const MOCK_ORDERS: Order[] = [
    createOrder(
        101,
        'ORD202406100001',
        'pending',
        [
            createOrderItem(1001, 101, 1, '降噪无线蓝牙耳机 Pro', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=600', 1299, 1, { '颜色': '月岩灰', '配置': 'Pro版' }, '2024-06-10T10:30:00Z'),
        ],
        '2024-06-10T10:30:00Z',
        '2024-06-10T10:30:00Z'
    ),
    createOrder(
        102,
        'ORD202406090002',
        'paid',
        [
            createOrderItem(1002, 102, 2, '智能运动手表 S3', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=600', 1099, 1, { '表带': '真皮', '尺寸': '45mm' }, '2024-06-09T14:20:00Z'),
            createOrderItem(1003, 102, 3, '机械键盘 C1', 'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?auto=format&fit=crop&q=80&w=600', 549, 1, { '轴体': '红轴' }, '2024-06-09T14:20:00Z'),
        ],
        '2024-06-09T14:20:00Z',
        '2024-06-09T14:35:00Z'
    ),
    createOrder(
        103,
        'ORD202406080003',
        'shipped',
        [
            createOrderItem(1004, 103, 4, '潮流印花卫衣', 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=600', 299, 2, { '尺码': 'L', '颜色': '活力橘' }, '2024-06-08T09:15:00Z'),
        ],
        '2024-06-08T09:15:00Z',
        '2024-06-08T18:00:00Z'
    ),
    createOrder(
        104,
        'ORD202406050004',
        'delivered',
        [
            createOrderItem(1005, 104, 5, '精华修复面霜', 'https://images.unsplash.com/photo-1542459742-1e7658c42a66?auto=format&fit=crop&q=80&w=600', 988, 1, { '规格': '100ml' }, '2024-06-05T16:45:00Z'),
        ],
        '2024-06-05T16:45:00Z',
        '2024-06-07T10:00:00Z'
    ),
    createOrder(
        105,
        'ORD202406010005',
        'completed',
        [
            createOrderItem(1006, 105, 6, '高性能登山鞋', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=600', 799, 1, { '尺码': '42' }, '2024-06-01T11:00:00Z'),
            createOrderItem(1007, 105, 1, '降噪无线蓝牙耳机 Pro', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=600', 1299, 1, { '颜色': '暗夜黑', '配置': '标准版' }, '2024-06-01T11:00:00Z'),
        ],
        '2024-06-01T11:00:00Z',
        '2024-06-04T15:30:00Z'
    ),
    createOrder(
        106,
        'ORD202406070006',
        'cancelled',
        [
            createOrderItem(1008, 106, 3, '机械键盘 C1', 'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?auto=format&fit=crop&q=80&w=600', 499, 1, { '轴体': '青轴' }, '2024-06-07T20:10:00Z'),
        ],
        '2024-06-07T20:10:00Z',
        '2024-06-07T21:00:00Z'
    ),
]
