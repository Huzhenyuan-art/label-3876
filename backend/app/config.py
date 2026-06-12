from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://ecommerce:ecommerce123@db:5432/ecommerce"
    REDIS_URL: str = "redis://redis:6379/0"
    CORS_ORIGINS: str = "http://localhost:3876"

    class Config:
        env_file = ".env"


settings = Settings()
