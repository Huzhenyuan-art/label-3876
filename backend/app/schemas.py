from pydantic import BaseModel, EmailStr
from datetime import datetime


class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    nickname: str = ""


class UserLogin(BaseModel):
    username: str
    password: str


class UserUpdate(BaseModel):
    nickname: str | None = None
    email: EmailStr | None = None
    username: str | None = None


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    avatar: str
    nickname: str
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenData(BaseModel):
    user_id: int | None = None


class CategoryBase(BaseModel):
    name: str
    icon: str = ""
    description: str = ""
    sort_order: int = 0


class CategoryResponse(CategoryBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


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
    category_id: int | None = None


class ProductResponse(ProductBase):
    id: int
    created_at: datetime
    shop: ShopResponse | None = None
    category: CategoryResponse | None = None

    class Config:
        from_attributes = True


class ChatMessageBase(BaseModel):
    shop_id: int
    sender: str
    content: str
    msg_type: str = "text"
    client_id: str | None = None


class ChatMessageResponse(ChatMessageBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class ChatMessageCreate(BaseModel):
    content: str
    sender: str = "buyer"
    client_id: str | None = None


class OrderItemCreate(BaseModel):
    product_id: int
    product_name: str
    product_image: str = ""
    price: float
    quantity: int
    specs: dict | None = None


class OrderItemResponse(BaseModel):
    id: int
    order_id: int
    product_id: int
    product_name: str
    product_image: str
    price: float
    quantity: int
    specs: dict | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class OrderCreate(BaseModel):
    items: list[OrderItemCreate]
    shipping_address: str = ""
    contact_name: str = ""
    contact_phone: str = ""
    payment_method: str = ""
    shipping_method: str = ""


class OrderResponse(BaseModel):
    id: int
    order_no: str
    user_id: int
    status: str
    total_amount: float
    shipping_address: str
    contact_name: str
    contact_phone: str
    payment_method: str
    shipping_method: str
    created_at: datetime
    updated_at: datetime
    items: list[OrderItemResponse] = []

    class Config:
        from_attributes = True


class CartItemCreate(BaseModel):
    product_id: int
    quantity: int = 1
    specs: dict | None = None
    sku_id: int | None = None


class CartItemUpdate(BaseModel):
    quantity: int


class CartItemResponse(BaseModel):
    id: int
    cart_id: int
    product_id: int
    quantity: int
    specs: dict | None = None
    sku_id: int | None = None
    created_at: datetime
    updated_at: datetime
    product: ProductResponse

    class Config:
        from_attributes = True


class CartResponse(BaseModel):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    items: list[CartItemResponse] = []

    class Config:
        from_attributes = True


class CartMergeItem(BaseModel):
    product_id: int
    quantity: int
    specs: dict | None = None
    sku_id: int | None = None


class CartMergeRequest(BaseModel):
    items: list[CartMergeItem]
    merge_strategy: str = "merge"  # "merge" 合并数量, "replace" 替换, "keep_server" 保留服务端


class ShopFollowResponse(BaseModel):
    id: int
    user_id: int
    shop_id: int
    created_at: datetime
    shop: ShopResponse | None = None

    class Config:
        from_attributes = True


class ShopFollowStatusResponse(BaseModel):
    is_following: bool
    follower_count: int
