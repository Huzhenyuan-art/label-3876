import asyncio
import logging
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import engine, async_session
from app.models import User
from app.auth import get_password_hash

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def fix_admin_password():
    """修复 admin 用户密码，确保可以正常登录"""
    logger.info("开始检查并修复 admin 用户密码...")

    async with async_session() as session:
        result = await session.execute(select(User).where(User.username == "admin"))
        admin_user = result.scalar_one_or_none()

        new_password = "admin123"

        if admin_user:
            logger.info(f"找到 admin 用户，更新密码为: {new_password}")
            admin_user.hashed_password = get_password_hash(new_password)
            await session.commit()
            logger.info("✅ admin 用户密码已更新！")
        else:
            logger.info("未找到 admin 用户，正在创建...")
            default_avatar = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop"
            new_admin = User(
                username="admin",
                email="admin@example.com",
                hashed_password=get_password_hash(new_password),
                avatar=default_avatar,
                nickname="管理员"
            )
            session.add(new_admin)
            try:
                await session.commit()
                await session.refresh(new_admin)
                logger.info(f"✅ admin 用户已创建！ID: {new_admin.id}")
            except Exception as e:
                await session.rollback()
                logger.error(f"❌ 创建 admin 用户失败: {e}")
                return

        logger.info("")
        logger.info("=" * 60)
        logger.info("修复完成！请使用以下账号登录：")
        logger.info(f"  用户名: admin")
        logger.info(f"  密码: {new_password}")
        logger.info("=" * 60)


if __name__ == "__main__":
    asyncio.run(fix_admin_password())
