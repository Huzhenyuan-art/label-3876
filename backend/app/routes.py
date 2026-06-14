import uuid
import json
import logging
from datetime import timedelta, datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError

from app.config import settings
from app.database import get_db
from app.models import Product, Shop, ChatMessage, Category, User, Order, OrderItem, Cart, CartItem
from app.schemas import (
    ProductResponse, ShopResponse, ChatMessageResponse, ChatMessageCreate,
    CategoryResponse, UserCreate, UserLogin, UserResponse, Token, UserUpdate,
    OrderCreate, OrderResponse, OrderItemResponse,
    CartResponse, CartItemCreate, CartItemUpdate, CartMergeRequest
)
from app.auth import (
    verify_password, get_password_hash, create_access_token,
    get_current_active_user, get_current_user
)
from app.cache import cache_key, delete_pattern

logger = logging.getLogger(__name__)
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
@cache_key(prefix="cache:categories:list", ttl=86400)
async def get_categories(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Category).order_by(Category.sort_order, Category.id))
    categories = result.scalars().all()
    return categories


@router.get("/categories/{category_id}", response_model=CategoryResponse)
@cache_key(prefix="cache:categories", ttl=86400)
async def get_category(category_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Category).where(Category.id == category_id))
    category = result.scalar_one_or_none()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category


@router.get("/products", response_model=list[ProductResponse])
@cache_key(prefix="cache:products:list", ttl=3600)
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
@cache_key(prefix="cache:products", ttl=3600)
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
@cache_key(prefix="cache:shops:products", ttl=3600)
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


def generate_order_no() -> str:
    now = datetime.now()
    timestamp = now.strftime("%Y%m%d%H%M%S")
    random_str = uuid.uuid4().hex[:8].upper()
    return f"ORD-{timestamp}-{random_str}"


@router.post("/orders", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    order_data: OrderCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not order_data.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="订单商品不能为空"
        )

    total_amount = sum(item.price * item.quantity for item in order_data.items)

    order_no = generate_order_no()
    for _ in range(5):
        existing = await db.execute(select(Order).where(Order.order_no == order_no))
        if not existing.scalar_one_or_none():
            break
        order_no = generate_order_no()

    new_order = Order(
        order_no=order_no,
        user_id=current_user.id,
        status="pending",
        total_amount=total_amount,
        shipping_address=order_data.shipping_address,
        contact_name=order_data.contact_name,
        contact_phone=order_data.contact_phone,
        payment_method=order_data.payment_method,
        shipping_method=order_data.shipping_method,
    )
    db.add(new_order)
    await db.flush()

    for item_data in order_data.items:
        order_item = OrderItem(
            order_id=new_order.id,
            product_id=item_data.product_id,
            product_name=item_data.product_name,
            product_image=item_data.product_image,
            price=item_data.price,
            quantity=item_data.quantity,
            specs=item_data.specs,
        )
        db.add(order_item)

    try:
        await db.commit()
        await db.refresh(new_order)
        await delete_pattern("cache:products:*")
        await delete_pattern("cache:shops:products:*")
        logger.info("Cache invalidated after order creation")
        return new_order
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="创建订单失败，请稍后重试"
        )


@router.get("/orders", response_model=list[OrderResponse])
async def get_my_orders(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Order)
        .where(Order.user_id == current_user.id)
        .order_by(desc(Order.created_at))
    )
    orders = result.scalars().all()
    return orders


@router.get("/orders/{order_id}", response_model=OrderResponse)
async def get_order_detail(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    if order.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权访问该订单"
        )
    return order


@router.put("/orders/{order_id}/cancel", response_model=OrderResponse)
async def cancel_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    if order.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权操作该订单"
        )
    if order.status not in ("pending", "paid"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="当前订单状态不允许取消"
        )
    order.status = "cancelled"
    order.updated_at = datetime.utcnow()
    try:
        await db.commit()
        await db.refresh(order)
        await delete_pattern("cache:products:*")
        await delete_pattern("cache:shops:products:*")
        logger.info("Cache invalidated after order cancellation")
        return order
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="取消订单失败"
        )


@router.put("/orders/{order_id}/pay", response_model=OrderResponse)
async def pay_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    if order.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权操作该订单"
        )
    if order.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="当前订单状态不允许支付"
        )
    order.status = "paid"
    order.updated_at = datetime.utcnow()
    try:
        await db.commit()
        await db.refresh(order)
        await delete_pattern("cache:products:*")
        await delete_pattern("cache:shops:products:*")
        logger.info("Cache invalidated after order payment")
        return order
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="支付失败，请稍后重试"
        )


async def refresh_cart(db: AsyncSession, user_id: int) -> Cart:
    result = await db.execute(select(Cart).where(Cart.user_id == user_id))
    cart = result.scalar_one_or_none()
    if not cart:
        cart = await get_or_create_cart(db, user_id)
    return cart


async def get_or_create_cart(db: AsyncSession, user_id: int) -> Cart:
    result = await db.execute(select(Cart).where(Cart.user_id == user_id))
    cart = result.scalar_one_or_none()
    if not cart:
        cart = Cart(user_id=user_id)
        db.add(cart)
        try:
            await db.commit()
            await db.refresh(cart)
        except IntegrityError:
            await db.rollback()
            result = await db.execute(select(Cart).where(Cart.user_id == user_id))
            cart = result.scalar_one_or_none()
            if not cart:
                raise
    return cart


def get_cart_item_key(product_id: int, specs: dict | None = None, sku_id: int | None = None) -> str:
    if sku_id:
        return f"{product_id}-sku-{sku_id}"
    return f"{product_id}-{json.dumps(specs or {}, sort_keys=True)}"


@router.get("/cart", response_model=CartResponse)
async def get_cart(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    cart = await get_or_create_cart(db, current_user.id)
    return cart


@router.post("/cart/items", response_model=CartResponse, status_code=status.HTTP_201_CREATED)
async def add_cart_item(
    item_data: CartItemCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    product_result = await db.execute(select(Product).where(Product.id == item_data.product_id))
    product = product_result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="商品不存在")

    if item_data.quantity <= 0:
        raise HTTPException(status_code=400, detail="数量必须大于0")

    if item_data.quantity > product.stock:
        raise HTTPException(status_code=400, detail="库存不足")

    cart = await get_or_create_cart(db, current_user.id)
    item_key = get_cart_item_key(item_data.product_id, item_data.specs, item_data.sku_id)

    existing_item = None
    for item in cart.items:
        if get_cart_item_key(item.product_id, item.specs, item.sku_id) == item_key:
            existing_item = item
            break

    if existing_item:
        new_quantity = existing_item.quantity + item_data.quantity
        if new_quantity > product.stock:
            raise HTTPException(status_code=400, detail="库存不足")
        existing_item.quantity = new_quantity
    else:
        new_item = CartItem(
            cart_id=cart.id,
            product_id=item_data.product_id,
            quantity=item_data.quantity,
            specs=item_data.specs,
            sku_id=item_data.sku_id,
        )
        db.add(new_item)

    try:
        await db.commit()
        cart = await refresh_cart(db, current_user.id)
        return cart
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="添加购物车失败"
        )


@router.put("/cart/items/{item_id}", response_model=CartResponse)
async def update_cart_item(
    item_id: int,
    item_data: CartItemUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if item_data.quantity <= 0:
        raise HTTPException(status_code=400, detail="数量必须大于0")

    result = await db.execute(
        select(CartItem)
        .join(Cart)
        .where(CartItem.id == item_id, Cart.user_id == current_user.id)
    )
    cart_item = result.scalar_one_or_none()
    if not cart_item:
        raise HTTPException(status_code=404, detail="购物车商品不存在")

    product_result = await db.execute(select(Product).where(Product.id == cart_item.product_id))
    product = product_result.scalar_one_or_none()
    if product and item_data.quantity > product.stock:
        raise HTTPException(status_code=400, detail="库存不足")

    cart_item.quantity = item_data.quantity

    try:
        await db.commit()
        cart = await refresh_cart(db, current_user.id)
        return cart
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="更新购物车失败"
        )


@router.delete("/cart/items/{item_id}", response_model=CartResponse)
async def remove_cart_item(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(CartItem)
        .join(Cart)
        .where(CartItem.id == item_id, Cart.user_id == current_user.id)
    )
    cart_item = result.scalar_one_or_none()
    if not cart_item:
        raise HTTPException(status_code=404, detail="购物车商品不存在")

    await db.delete(cart_item)
    try:
        await db.commit()
        cart = await refresh_cart(db, current_user.id)
        return cart
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="删除购物车商品失败"
        )


@router.delete("/cart/clear", response_model=CartResponse)
async def clear_cart(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    cart = await get_or_create_cart(db, current_user.id)
    for item in cart.items:
        await db.delete(item)
    try:
        await db.commit()
        cart = await refresh_cart(db, current_user.id)
        return cart
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="清空购物车失败"
        )


@router.post("/cart/merge", response_model=CartResponse)
async def merge_cart(
    merge_data: CartMergeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    cart = await get_or_create_cart(db, current_user.id)

    if merge_data.merge_strategy == "replace":
        for item in cart.items:
            await db.delete(item)
        await db.flush()
        cart.items = []

    if merge_data.merge_strategy == "keep_server":
        return cart

    for item_data in merge_data.items:
        product_result = await db.execute(select(Product).where(Product.id == item_data.product_id))
        product = product_result.scalar_one_or_none()
        if not product:
            continue

        if item_data.quantity <= 0 or item_data.quantity > product.stock:
            continue

        item_key = get_cart_item_key(item_data.product_id, item_data.specs, item_data.sku_id)
        existing_item = None
        for item in cart.items:
            if get_cart_item_key(item.product_id, item.specs, item.sku_id) == item_key:
                existing_item = item
                break

        if existing_item:
            new_quantity = existing_item.quantity + item_data.quantity
            if new_quantity > product.stock:
                new_quantity = product.stock
            existing_item.quantity = new_quantity
        else:
            new_item = CartItem(
                cart_id=cart.id,
                product_id=item_data.product_id,
                quantity=item_data.quantity,
                specs=item_data.specs,
                sku_id=item_data.sku_id,
            )
            db.add(new_item)

    try:
        await db.commit()
        cart = await refresh_cart(db, current_user.id)
        return cart
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="合并购物车失败"
        )
