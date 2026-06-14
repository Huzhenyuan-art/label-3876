import asyncio
import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.models import User, Category, Shop, Product
from app.auth import get_password_hash

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture(scope="session")
def event_loop_policy():
    import asyncio
    import sys
    if sys.platform == "win32":
        return asyncio.WindowsSelectorEventLoopPolicy()
    return asyncio.DefaultEventLoopPolicy()


@pytest.fixture(scope="session")
def event_loop(event_loop_policy):
    asyncio.set_event_loop_policy(event_loop_policy)
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
async def engine():
    engine = create_async_engine(
        TEST_DATABASE_URL,
        echo=False,
        poolclass=StaticPool,
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    await engine.dispose()


@pytest.fixture(scope="session")
async def TestingSessionLocal(engine):
    return async_sessionmaker(engine, expire_on_commit=False)


@pytest.fixture
async def db_session(TestingSessionLocal):
    async with TestingSessionLocal() as session:
        yield session
        await session.rollback()


@pytest.fixture
async def test_data(db_session):
    categories = [
        Category(name="智能数码", icon="📱", description="智能数码产品", sort_order=1),
        Category(name="潮流服装", icon="👕", description="潮流服装", sort_order=2),
    ]
    db_session.add_all(categories)
    await db_session.flush()

    shop1 = Shop(
        name="潮流数码旗舰店",
        logo="https://example.com/shop1.jpg",
        description="专注高品质数码产品",
        rating=4.8,
        follower_count=100,
    )
    shop2 = Shop(
        name="时尚服饰精品店",
        logo="https://example.com/shop2.jpg",
        description="引领时尚潮流",
        rating=4.9,
        follower_count=200,
    )
    db_session.add_all([shop1, shop2])
    await db_session.flush()

    products = [
        Product(
            name="无线蓝牙耳机",
            description="主动降噪，超长续航",
            price=299.0,
            original_price=599.0,
            stock=100,
            sales=50,
            main_image="https://example.com/product1.jpg",
            specs={"颜色": ["黑色", "白色"], "版本": ["标准版", "降噪版"]},
            shop_id=shop1.id,
            category_id=categories[0].id,
        ),
        Product(
            name="智能手表",
            description="健康监测，运动追踪",
            price=1299.0,
            original_price=1899.0,
            stock=50,
            sales=30,
            main_image="https://example.com/product2.jpg",
            specs={"颜色": ["黑色", "银色"], "表带": ["运动", "皮质"]},
            shop_id=shop1.id,
            category_id=categories[0].id,
        ),
        Product(
            name="纯棉T恤",
            description="透气舒适，多色可选",
            price=89.0,
            original_price=159.0,
            stock=200,
            sales=100,
            main_image="https://example.com/product3.jpg",
            specs={"颜色": ["白色", "黑色"], "尺码": ["M", "L"]},
            shop_id=shop2.id,
            category_id=categories[1].id,
        ),
    ]
    db_session.add_all(products)

    hashed_password = get_password_hash("test123456")
    test_user = User(
        username="testuser",
        email="test@example.com",
        hashed_password=hashed_password,
        avatar="https://example.com/avatar.jpg",
        nickname="测试用户",
    )
    db_session.add(test_user)

    await db_session.commit()
    await db_session.refresh(test_user)

    return {
        "user": test_user,
        "categories": categories,
        "shops": [shop1, shop2],
        "products": products,
    }


@pytest.fixture
async def client(db_session):
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest.fixture
async def auth_headers(client, test_data):
    response = await client.post(
        "/api/auth/login",
        json={"username": "testuser", "password": "test123456"},
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
