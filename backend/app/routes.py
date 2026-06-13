from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError

from app.config import settings
from app.database import get_db
from app.models import Product, Shop, ChatMessage, Category, User
from app.schemas import (
    ProductResponse, ShopResponse, ChatMessageResponse, ChatMessageCreate,
    CategoryResponse, UserCreate, UserLogin, UserResponse, Token, UserUpdate
)
from app.auth import (
    verify_password, get_password_hash, create_access_token,
    get_current_active_user, get_current_user
)
router = APIRouter()


@router.post("/auth/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.username == user_data.username))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用户名已被注册"
        )

    result = await db.execute(select(User).where(User.email == user_data.email))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="邮箱已被注册"
        )

    hashed_password = get_password_hash(user_data.password)
    default_avatar = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop"

    new_user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hashed_password,
        avatar=default_avatar,
        nickname=user_data.nickname or user_data.username.upper()
    )

    db.add(new_user)
    try:
        await db.commit()
        await db.refresh(new_user)
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="创建用户失败，请稍后重试"
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": new_user.id}, expires_delta=access_token_expires
    )

    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=new_user.id,
            username=new_user.username,
            email=new_user.email,
            avatar=new_user.avatar,
            nickname=new_user.nickname,
            created_at=new_user.created_at,
        )
    )


@router.post("/auth/login", response_model=Token)
async def login(login_data: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.username == login_data.username))
    user = result.scalar_one_or_none()

    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.id}, expires_delta=access_token_expires
    )

    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=user.id,
            username=user.username,
            email=user.email,
            avatar=user.avatar,
            nickname=user.nickname,
            created_at=user.created_at,
        )
    )


@router.get("/auth/me", response_model=UserResponse)
async def read_users_me(current_user: UserResponse = Depends(get_current_active_user)):
    return current_user


@router.put("/auth/me", response_model=UserResponse)
async def update_user_profile(
    user_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if user_data.username is not None:
        existing = await db.execute(select(User).where(User.username == user_data.username, User.id != current_user.id))
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="用户名已被使用"
            )
        current_user.username = user_data.username

    if user_data.email is not None:
        existing = await db.execute(select(User).where(User.email == user_data.email, User.id != current_user.id))
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="邮箱已被使用"
            )
        current_user.email = user_data.email

    if user_data.nickname is not None:
        current_user.nickname = user_data.nickname

    try:
        await db.commit()
        await db.refresh(current_user)
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="更新用户资料失败"
        )

    return UserResponse(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        avatar=current_user.avatar,
        nickname=current_user.nickname,
        created_at=current_user.created_at,
    )


@router.get("/categories", response_model=list[CategoryResponse])
async def get_categories(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Category).order_by(Category.sort_order, Category.id))
    categories = result.scalars().all()
    return categories


@router.get("/categories/{category_id}", response_model=CategoryResponse)
async def get_category(category_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Category).where(Category.id == category_id))
    category = result.scalar_one_or_none()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category


@router.get("/products", response_model=list[ProductResponse])
async def get_products(
    category_id: int | None = Query(None, description="Filter products by category ID"),
    db: AsyncSession = Depends(get_db)
):
    query = select(Product)
    if category_id is not None:
        query = query.where(Product.category_id == category_id)
    result = await db.execute(query)
    products = result.scalars().all()
    return products


@router.get("/products/{product_id}", response_model=ProductResponse)
async def get_product(product_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.get("/shops/{shop_id}", response_model=ShopResponse)
async def get_shop(shop_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Shop).where(Shop.id == shop_id))
    shop = result.scalar_one_or_none()
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    return shop


@router.get("/shops/{shop_id}/products", response_model=list[ProductResponse])
async def get_shop_products(shop_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Product).where(Product.shop_id == shop_id))
    products = result.scalars().all()
    return products


@router.get("/chat/{shop_id}", response_model=list[ChatMessageResponse])
async def get_chat_messages(shop_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.shop_id == shop_id)
        .order_by(ChatMessage.created_at)
    )
    messages = result.scalars().all()
    return messages


@router.post("/chat/{shop_id}", response_model=ChatMessageResponse)
async def send_message(
    shop_id: int, message: ChatMessageCreate, db: AsyncSession = Depends(get_db)
):
    shop_result = await db.execute(select(Shop).where(Shop.id == shop_id))
    if not shop_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Shop not found")

    trimmed_content = message.content.strip()
    if not trimmed_content:
        raise HTTPException(status_code=400, detail="Message content cannot be empty")

    if message.sender not in ("buyer", "seller"):
        raise HTTPException(status_code=400, detail="Invalid sender, must be 'buyer' or 'seller'")

    if message.client_id:
        existing = await db.execute(
            select(ChatMessage).where(ChatMessage.client_id == message.client_id)
        )
        existing_msg = existing.scalar_one_or_none()
        if existing_msg:
            return existing_msg

    new_message = ChatMessage(
        shop_id=shop_id,
        sender=message.sender,
        content=trimmed_content,
        client_id=message.client_id,
    )
    db.add(new_message)
    try:
        await db.commit()
        await db.refresh(new_message)
        return new_message
    except IntegrityError:
        await db.rollback()
        if message.client_id:
            retry_existing = await db.execute(
                select(ChatMessage).where(ChatMessage.client_id == message.client_id)
            )
            retry_msg = retry_existing.scalar_one_or_none()
            if retry_msg:
                return retry_msg
        raise HTTPException(
            status_code=500, detail="Failed to save message due to database conflict"
        )
