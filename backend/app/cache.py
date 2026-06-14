import json
import logging
from typing import Any, Callable
from datetime import datetime
from functools import wraps

import redis.asyncio as redis

from app.config import settings

logger = logging.getLogger(__name__)

redis_client: redis.Redis | None = None


class DateTimeEncoder(json.JSONEncoder):
    def default(self, obj: Any) -> Any:
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)


def datetime_decoder(dct: dict) -> dict:
    for key, value in dct.items():
        if isinstance(value, str):
            try:
                dct[key] = datetime.fromisoformat(value)
            except ValueError:
                pass
    return dct


async def init_redis() -> None:
    global redis_client
    try:
        redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
        await redis_client.ping()
        logger.info("Redis connected successfully")
    except Exception as e:
        logger.error(f"Failed to connect to Redis: {e}")
        redis_client = None


async def close_redis() -> None:
    global redis_client
    if redis_client:
        await redis_client.close()
        logger.info("Redis connection closed")
        redis_client = None


async def get_cache(key: str) -> Any | None:
    if not redis_client:
        return None
    try:
        data = await redis_client.get(key)
        if data:
            return json.loads(data, object_hook=datetime_decoder)
        return None
    except Exception as e:
        logger.warning(f"Failed to get cache for key {key}: {e}")
        return None


async def set_cache(key: str, value: Any, ttl: int = 3600) -> None:
    if not redis_client:
        return
    try:
        serialized = json.dumps(value, cls=DateTimeEncoder)
        await redis_client.setex(key, ttl, serialized)
    except Exception as e:
        logger.warning(f"Failed to set cache for key {key}: {e}")


async def delete_cache(key: str) -> None:
    if not redis_client:
        return
    try:
        await redis_client.delete(key)
    except Exception as e:
        logger.warning(f"Failed to delete cache for key {key}: {e}")


async def delete_pattern(pattern: str) -> None:
    if not redis_client:
        return
    try:
        keys = await redis_client.keys(pattern)
        if keys:
            await redis_client.delete(*keys)
            logger.info(f"Deleted {len(keys)} cache keys matching pattern: {pattern}")
    except Exception as e:
        logger.warning(f"Failed to delete cache pattern {pattern}: {e}")


async def clear_all_cache() -> None:
    await delete_pattern("cache:*")
    logger.info("All cache cleared")


def cache_key(prefix: str, ttl: int = 3600) -> Callable:
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            key_parts = [prefix]
            for k, v in sorted(kwargs.items()):
                if v is not None and k != "db" and k != "current_user":
                    key_parts.append(f"{k}_{v}")
            cache_key_str = ":".join(key_parts)

            cached = await get_cache(cache_key_str)
            if cached is not None:
                logger.debug(f"Cache hit for key: {cache_key_str}")
                return cached

            result = await func(*args, **kwargs)

            if hasattr(result, "model_dump"):
                cache_value = result.model_dump()
            elif isinstance(result, list) and result and hasattr(result[0], "model_dump"):
                cache_value = [item.model_dump() for item in result]
            else:
                cache_value = result

            await set_cache(cache_key_str, cache_value, ttl)
            logger.debug(f"Cache set for key: {cache_key_str} with TTL {ttl}s")

            return result

        return wrapper

    return decorator
