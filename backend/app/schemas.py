from pydantic import BaseModel
from datetime import datetime


class ShopBase(BaseModel):
    name: str
    logo: str = ""
    description: str = ""
    rating: float = 5.0
    follower_count: int = 0


class ShopResponse(ShopBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class ProductBase(BaseModel):
    name: str
    description: str = ""
    price: float
    original_price: float | None = None
    stock: int = 0
    sales: int = 0
    main_image: str = ""
    images: dict | None = None
    specs: dict | None = None
    shop_id: int


class ProductResponse(ProductBase):
    id: int
    created_at: datetime
    shop: ShopResponse | None = None

    class Config:
        from_attributes = True


class ChatMessageBase(BaseModel):
    shop_id: int
    sender: str
    content: str
    msg_type: str = "text"


class ChatMessageResponse(ChatMessageBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class ChatMessageCreate(BaseModel):
    content: str
    sender: str = "buyer"
