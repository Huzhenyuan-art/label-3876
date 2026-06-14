from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
import time

from sqlalchemy import text

from app.config import settings
from app.routes import router
from app.cache import init_redis, close_redis, redis_client
from app.database import engine

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

start_time = time.time()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_redis()
    yield
    await close_redis()


app = FastAPI(title="E-commerce API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")


@app.get("/")
async def root():
    return {"message": "E-commerce API is running"}


@app.get("/health")
async def health():
    checks = {"status": "healthy", "uptime_seconds": round(time.time() - start_time, 1)}

    db_status = "healthy"
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {e}"
        checks["status"] = "degraded"
    checks["database"] = db_status

    redis_status = "healthy"
    try:
        if redis_client:
            await redis_client.ping()
        else:
            redis_status = "unhealthy: client not initialized"
            checks["status"] = "degraded"
    except Exception as e:
        redis_status = f"unhealthy: {e}"
        checks["status"] = "degraded"
    checks["redis"] = redis_status

    return checks
