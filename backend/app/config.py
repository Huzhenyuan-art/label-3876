from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://ecommerce:ecommerce123@db:5432/ecommerce"
    REDIS_URL: str = "redis://redis:6379/0"
    CORS_ORIGINS: str = "http://localhost:3876,http://localhost:5173,http://127.0.0.1:3876,http://127.0.0.1:5173"
    SECRET_KEY: str = "your-secret-key-change-in-production-keep-it-safe"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7

    class Config:
        env_file = ".env"


settings = Settings()
