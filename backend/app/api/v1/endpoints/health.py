"""
健康检查和数据库连接池监控端点
"""

from app.core.database import SessionLocal, engine
from fastapi import APIRouter
from sqlalchemy import text
from sqlalchemy.pool import QueuePool

router = APIRouter()


@router.get("/pool-status")
async def get_pool_status():
    """
    获取数据库连接池状态
    用于监控连接池使用情况，排查连接泄漏问题
    """
    pool = engine.pool
    if not isinstance(pool, QueuePool):
        return {"error": "连接池不是 QueuePool 类型"}
    return {
        "pool_size": pool.size(),
        "checked_in": pool.checkedin(),
        "checked_out": pool.checkedout(),
        "overflow": pool.overflow(),
        "total_connections": pool.size() + pool.overflow(),
        "max_overflow": pool._max_overflow,
        "pool_timeout": pool._timeout,
    }


@router.get("/db-check")
async def check_database_connection():
    """
    检查数据库连接是否正常
    """
    db = SessionLocal()
    try:
        result = db.execute(text("SELECT 1"))
        result.fetchone()
        return {"status": "healthy", "message": "数据库连接正常"}
    except Exception as e:
        return {"status": "unhealthy", "message": f"数据库连接异常: {str(e)}"}
    finally:
        db.close()
