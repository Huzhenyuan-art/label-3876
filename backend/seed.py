import asyncio
import logging
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import engine, Base, async_session
from app.models import Shop, Product, ChatMessage

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def seed_data():
    logger.info("Creating database tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    logger.info("Seeding data...")
    async with async_session() as session:
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

        await session.commit()
        logger.info("Seed data created successfully!")


if __name__ == "__main__":
    asyncio.run(seed_data())
