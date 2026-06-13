import asyncio
import logging
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import engine, Base, async_session
from app.models import Shop, Product, ChatMessage, Category, User
from app.auth import get_password_hash

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def seed_data():
    logger.info("Creating database tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    logger.info("Seeding data...")
    async with async_session() as session:
        # 创建分类
        categories = [
            Category(
                name="潮流服装",
                icon="👕",
                description="时尚潮流服装，引领穿搭新风尚",
                sort_order=1,
            ),
            Category(
                name="智能数码",
                icon="📱",
                description="前沿智能数码产品，科技改变生活",
                sort_order=2,
            ),
            Category(
                name="美妆护肤",
                icon="💄",
                description="专业美妆护肤，焕发光彩肌肤",
                sort_order=3,
            ),
            Category(
                name="居家生活",
                icon="🏠",
                description="品质居家好物，打造温馨生活",
                sort_order=4,
            ),
            Category(
                name="图书文具",
                icon="📚",
                description="精选图书文具，助力学习工作",
                sort_order=5,
            ),
            Category(
                name="户外运动",
                icon="🏃",
                description="专业户外运动装备，畅享健康生活",
                sort_order=6,
            ),
        ]
        session.add_all(categories)
        await session.flush()

        cat_map = {cat.name: cat.id for cat in categories}

        # 创建店铺
        shop1 = Shop(
            name="潮流数码旗舰店",
            logo="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=200",
            description="专注高品质数码产品，正品保障",
            rating=4.8,
            follower_count=12580,
        )
        shop2 = Shop(
            name="时尚服饰精品店",
            logo="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200",
            description="引领时尚潮流，品质生活",
            rating=4.9,
            follower_count=8960,
        )
        session.add_all([shop1, shop2])
        await session.flush()

        # 创建商品
        products = [
            Product(
                name="无线蓝牙耳机 Pro Max - 降噪版",
                description="主动降噪，超长续航，HiFi音质，舒适佩戴",
                price=299.00,
                original_price=599.00,
                stock=156,
                sales=2380,
                main_image="https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600",
                images={
                    "gallery": [
                        "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600",
                        "https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7?w=600",
                        "https://images.unsplash.com/photo-1613040809024-b4ef7ba99bc3?w=600",
                    ]
                },
                specs={
                    "颜色": ["星空黑", "珍珠白", "玫瑰金"],
                    "版本": ["标准版", "降噪版"],
                },
                shop_id=shop1.id,
                category_id=cat_map["智能数码"],
            ),
            Product(
                name="智能手表 Ultra - 运动健康版",
                description="全天候健康监测，50米防水，超长续航",
                price=1299.00,
                original_price=1899.00,
                stock=89,
                sales=1560,
                main_image="https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=600",
                images={
                    "gallery": [
                        "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=600",
                        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600",
                    ]
                },
                specs={
                    "颜色": ["午夜黑", "星光银"],
                    "表带": ["运动表带", "皮质表带", "金属表带"],
                },
                shop_id=shop1.id,
                category_id=cat_map["智能数码"],
            ),
            Product(
                name="机械键盘 RGB 青轴版",
                description="Cherry青轴，RGB背光，全键无冲，电竞级体验",
                price=459.00,
                original_price=699.00,
                stock=234,
                sales=890,
                main_image="https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600",
                images={
                    "gallery": [
                        "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600",
                        "https://images.unsplash.com/photo-1595225476474-87563907a212?w=600",
                    ]
                },
                specs={
                    "轴体": ["青轴", "红轴", "茶轴"],
                    "配列": ["87键", "104键"],
                },
                shop_id=shop1.id,
                category_id=cat_map["智能数码"],
            ),
            Product(
                name="纯棉休闲T恤 - 夏季新款",
                description="100%精梳棉，透气舒适，多色可选",
                price=89.00,
                original_price=159.00,
                stock=567,
                sales=3420,
                main_image="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600",
                images={
                    "gallery": [
                        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600",
                        "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600",
                    ]
                },
                specs={
                    "颜色": ["白色", "黑色", "灰色", "蓝色"],
                    "尺码": ["S", "M", "L", "XL", "XXL"],
                },
                shop_id=shop2.id,
                category_id=cat_map["潮流服装"],
            ),
            Product(
                name="牛仔裤 修身款 - 经典蓝",
                description="弹力面料，修身显瘦，经典百搭",
                price=199.00,
                original_price=399.00,
                stock=345,
                sales=1890,
                main_image="https://images.unsplash.com/photo-1542272604-787c3835535d?w=600",
                images={
                    "gallery": [
                        "https://images.unsplash.com/photo-1542272604-787c3835535d?w=600",
                        "https://images.unsplash.com/photo-1475178626620-a4d074967452?w=600",
                    ]
                },
                specs={
                    "颜色": ["经典蓝", "深蓝", "浅蓝"],
                    "尺码": ["27", "28", "29", "30", "31", "32"],
                },
                shop_id=shop2.id,
                category_id=cat_map["潮流服装"],
            ),
            Product(
                name="连帽卫衣 宽松版 - 秋季新款",
                description="加绒加厚，保暖舒适，街头潮流风格",
                price=259.00,
                original_price=459.00,
                stock=423,
                sales=2150,
                main_image="https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600",
                images={
                    "gallery": [
                        "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600",
                    ]
                },
                specs={
                    "颜色": ["黑色", "灰色", "卡其色"],
                    "尺码": ["S", "M", "L", "XL", "XXL"],
                },
                shop_id=shop2.id,
                category_id=cat_map["潮流服装"],
            ),
            Product(
                name="运动休闲鞋 透气网面款",
                description="轻量透气，缓震舒适，日常运动两用",
                price=329.00,
                original_price=599.00,
                stock=278,
                sales=1680,
                main_image="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600",
                images={
                    "gallery": [
                        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600",
                    ]
                },
                specs={
                    "颜色": ["白色", "黑色", "灰色"],
                    "尺码": ["39", "40", "41", "42", "43", "44"],
                },
                shop_id=shop2.id,
                category_id=cat_map["潮流服装"],
            ),
            Product(
                name="玻尿酸精华液 - 深层补水",
                description="高浓度玻尿酸，深层补水，改善肌肤干燥",
                price=168.00,
                original_price=298.00,
                stock=345,
                sales=2890,
                main_image="https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?w=600",
                images={
                    "gallery": [
                        "https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?w=600",
                    ]
                },
                specs={
                    "规格": ["30ml", "50ml", "100ml"],
                },
                shop_id=shop2.id,
                category_id=cat_map["美妆护肤"],
            ),
            Product(
                name="修复面霜 滋养抗皱版",
                description="深层滋养，修护屏障，淡化细纹",
                price=398.00,
                original_price=598.00,
                stock=189,
                sales=1250,
                main_image="https://images.unsplash.com/photo-1542459742-1e7658c42a66?w=600",
                images={
                    "gallery": [
                        "https://images.unsplash.com/photo-1542459742-1e7658c42a66?w=600",
                    ]
                },
                specs={
                    "规格": ["50ml", "100ml"],
                    "版本": ["清爽型", "滋润型"],
                },
                shop_id=shop2.id,
                category_id=cat_map["美妆护肤"],
            ),
            Product(
                name="口红礼盒 哑光丝绒系列",
                description="哑光丝绒质地，显色持久，多色可选",
                price=258.00,
                original_price=398.00,
                stock=456,
                sales=3200,
                main_image="https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=600",
                images={
                    "gallery": [
                        "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=600",
                    ]
                },
                specs={
                    "色号": ["正红色", "豆沙色", "番茄红", "奶茶色"],
                    "规格": ["单支装", "三支装礼盒"],
                },
                shop_id=shop2.id,
                category_id=cat_map["美妆护肤"],
            ),
            Product(
                name="北欧简约台灯 - 护眼LED款",
                description="无频闪护眼LED，三档调光，北欧简约设计",
                price=129.00,
                original_price=259.00,
                stock=234,
                sales=980,
                main_image="https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600",
                images={
                    "gallery": [
                        "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600",
                    ]
                },
                specs={
                    "颜色": ["白色", "黑色", "原木色"],
                    "光源": ["暖光", "白光", "自然光"],
                },
                shop_id=shop2.id,
                category_id=cat_map["居家生活"],
            ),
            Product(
                name="纯棉四件套 简约条纹款",
                description="100%精梳棉，亲肤透气，简约条纹设计",
                price=359.00,
                original_price=699.00,
                stock=156,
                sales=780,
                main_image="https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600",
                images={
                    "gallery": [
                        "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600",
                    ]
                },
                specs={
                    "颜色": ["灰条纹", "蓝条纹", "米白"],
                    "尺寸": ["1.5m床", "1.8m床", "2.0m床"],
                },
                shop_id=shop2.id,
                category_id=cat_map["居家生活"],
            ),
            Product(
                name="智能香薰机 超声波静音版",
                description="超声波雾化，静音设计，七彩氛围灯",
                price=199.00,
                original_price=359.00,
                stock=289,
                sales=1450,
                main_image="https://images.unsplash.com/photo-1602928321679-560bb453f190?w=600",
                images={
                    "gallery": [
                        "https://images.unsplash.com/photo-1602928321679-560bb453f190?w=600",
                    ]
                },
                specs={
                    "颜色": ["白色", "木纹"],
                    "容量": ["300ml", "500ml"],
                },
                shop_id=shop2.id,
                category_id=cat_map["居家生活"],
            ),
            Product(
                name="畅销小说套装 年度精选",
                description="精选年度畅销小说，精装典藏版",
                price=168.00,
                original_price=298.00,
                stock=312,
                sales=2100,
                main_image="https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600",
                images={
                    "gallery": [
                        "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600",
                    ]
                },
                specs={
                    "套装": ["悬疑推理套装", "言情小说套装", "文学经典套装"],
                },
                shop_id=shop1.id,
                category_id=cat_map["图书文具"],
            ),
            Product(
                name="高档钢笔礼盒 商务款",
                description="精工打造，书写流畅，商务送礼首选",
                price=299.00,
                original_price=499.00,
                stock=178,
                sales=560,
                main_image="https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=600",
                images={
                    "gallery": [
                        "https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=600",
                    ]
                },
                specs={
                    "颜色": ["黑色", "银色", "金色"],
                    "笔尖": ["0.5mm", "0.7mm"],
                },
                shop_id=shop1.id,
                category_id=cat_map["图书文具"],
            ),
            Product(
                name="手账本套装 创意可爱风",
                description="优质纸张，丰富贴纸，记录美好生活",
                price=89.00,
                original_price=159.00,
                stock=456,
                sales=3200,
                main_image="https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=600",
                images={
                    "gallery": [
                        "https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=600",
                    ]
                },
                specs={
                    "款式": ["粉色少女", "蓝色清新", "绿色森林"],
                    "尺寸": ["A5", "A6"],
                },
                shop_id=shop1.id,
                category_id=cat_map["图书文具"],
            ),
            Product(
                name="专业跑步鞋 轻量竞速款",
                description="轻量设计，专业缓震，透气网面",
                price=599.00,
                original_price=899.00,
                stock=234,
                sales=1680,
                main_image="https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600",
                images={
                    "gallery": [
                        "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600",
                    ]
                },
                specs={
                    "颜色": ["黑白", "蓝橙", "红黑"],
                    "尺码": ["39", "40", "41", "42", "43", "44", "45"],
                },
                shop_id=shop1.id,
                category_id=cat_map["户外运动"],
            ),
            Product(
                name="登山背包 大容量防水款",
                description="大容量设计，防水面料，多口袋收纳",
                price=359.00,
                original_price=599.00,
                stock=167,
                sales=890,
                main_image="https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600",
                images={
                    "gallery": [
                        "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600",
                    ]
                },
                specs={
                    "颜色": ["黑色", "军绿", "深蓝"],
                    "容量": ["30L", "40L", "50L"],
                },
                shop_id=shop1.id,
                category_id=cat_map["户外运动"],
            ),
            Product(
                name="瑜伽垫 加厚防滑款",
                description="加厚设计，防滑材质，环保无味",
                price=129.00,
                original_price=259.00,
                stock=389,
                sales=2450,
                main_image="https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=600",
                images={
                    "gallery": [
                        "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=600",
                    ]
                },
                specs={
                    "颜色": ["紫色", "粉色", "蓝色", "绿色"],
                    "厚度": ["6mm", "8mm", "10mm"],
                },
                shop_id=shop1.id,
                category_id=cat_map["户外运动"],
            ),
        ]
        session.add_all(products)
        await session.flush()

        # 创建聊天消息
        messages = [
            ChatMessage(
                shop_id=shop1.id,
                sender="buyer",
                content="你好，请问这款耳机支持iOS系统吗？",
            ),
            ChatMessage(
                shop_id=shop1.id,
                sender="seller",
                content="您好！完全支持的，iOS和Android都可以使用，连接非常稳定。",
            ),
            ChatMessage(
                shop_id=shop1.id,
                sender="buyer",
                content="降噪效果怎么样？",
            ),
            ChatMessage(
                shop_id=shop1.id,
                sender="seller",
                content="降噪效果非常好，采用主动降噪技术，可以有效隔绝90%以上的环境噪音，非常适合通勤和办公使用。",
            ),
            ChatMessage(
                shop_id=shop1.id,
                sender="buyer",
                content="好的，谢谢！",
            ),
            ChatMessage(
                shop_id=shop2.id,
                sender="buyer",
                content="这件T恤会缩水吗？",
            ),
            ChatMessage(
                shop_id=shop2.id,
                sender="seller",
                content="您好！我们的T恤都经过预缩处理，正常洗涤不会明显缩水。建议冷水手洗或机洗轻柔模式，自然晾干。",
            ),
        ]
        session.add_all(messages)

        # 创建测试用户
        admin_password = "admin123"
        test_password = "123456"
        test_users = [
            User(
                username="testuser",
                email="test@example.com",
                hashed_password=get_password_hash(test_password),
                avatar="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
                nickname="测试用户"
            ),
            User(
                username="admin",
                email="admin@example.com",
                hashed_password=get_password_hash(admin_password),
                avatar="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
                nickname="管理员"
            ),
        ]
        session.add_all(test_users)

        await session.commit()
        logger.info("=" * 60)
        logger.info("Seed data created successfully!")
        logger.info("")
        logger.info("测试账号：")
        logger.info(f"  管理员账号: admin / {admin_password}")
        logger.info(f"  普通用户账号: testuser / {test_password}")
        logger.info("")
        logger.info("=" * 60)


if __name__ == "__main__":
    asyncio.run(seed_data())
