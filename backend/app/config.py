import os
import warnings
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://ecommerce:ecommerce123@localhost:5876/ecommerce"
    REDIS_URL: str = "redis://localhost:6876/0"
    CORS_ORIGINS: str = "http://localhost:3876,http://localhost:5173"
    SECRET_KEY: str = ""
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()

_INSECURE_KEYS = {
    "your-secret-key-change-in-production-keep-it-safe",
    "dev-only-secret-key-do-not-use-in-production",
    "",
}

if settings.SECRET_KEY in _INSECURE_KEYS:
    if os.getenv("ENVIRONMENT", "development") == "production":
        raise ValueError(
            "SECRET_KEY 未设置或使用了不安全的默认值，生产环境必须设置强随机密钥。"
            "生成方式：python -c \"import secrets; print(secrets.token_urlsafe(32))\""
        )
    warnings.warn(
        "SECRET_KEY 未设置或使用了不安全的默认值，仅允许在开发环境使用。"
        "生产环境请通过环境变量设置强随机密钥。",
        UserWarning,
        stacklevel=2,
    )
