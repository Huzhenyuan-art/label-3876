from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Product, Shop, ChatMessage
from app.schemas import ProductResponse, ShopResponse, ChatMessageResponse, ChatMessageCreate

router = APIRouter()


@router.get("/products", response_model=list[ProductResponse])
async def get_products(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Product))
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
    new_message = ChatMessage(
        shop_id=shop_id, sender=message.sender, content=message.content
    )
    db.add(new_message)
    await db.commit()
    await db.refresh(new_message)
    return new_message
