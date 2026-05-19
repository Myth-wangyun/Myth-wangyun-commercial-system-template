"""
生产环境启动脚本 - Windows Server 2019
支持 hypercorn / uvicorn / waitress(需 asgiref) 三种服务器

推荐使用 Hypercorn（原生 ASGI，性能最佳）

示例:
    python production.py                                              # 默认 hypercorn
    python production.py --server hypercorn --host 0.0.0.0 --port 8000 --workers 4
    python production.py --server uvicorn --host 0.0.0.0 --port 8000
    python production.py --server waitress --host 0.0.0.0 --port 8000 --workers 4
"""

import argparse
import logging
import os
import sys
from pathlib import Path

# 1. 设置生产环境变量，让 main.py 用 production 的 .env
os.environ["APP_ENV"] = "production"
# 生产环境禁用在线接口文档
os.environ["DISABLE_API_DOCS"] = "1"

# 2. 确保日志目录存在
# 尝试从环境变量获取，默认为 /data/logs/myapp
LOG_DIR = Path(os.environ.get("LOG_DIR", "/data/logs/myapp"))
# Fallback to local logs if permission denied or preferred
try:
    LOG_DIR.mkdir(parents=True, exist_ok=True)
except Exception as e:
    print(f"Warning: Could not create log dir {LOG_DIR}: {e}. Falling back to local 'logs'")
    LOG_DIR = Path("logs")
    LOG_DIR.mkdir(exist_ok=True)

# 3. 配置日志
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler(LOG_DIR / "production.log", encoding="utf-8"),
    ],
)
logger = logging.getLogger(__name__)

def load_env_file(env_path: Path) -> None:
    """加载指定 .env 文件并写入环境变量"""
    if not env_path.exists():
        logger.warning(f"配置文件不存在: {env_path}，使用默认配置")
        return
    try:
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, value = line.split("=", 1)
                    os.environ[key.strip()] = value.strip()
        logger.info(f"已加载配置文件: {env_path}")
    except Exception as e:
        logger.error(f"加载配置文件失败: {e}")


def load_production_env() -> None:
    """加载生产环境配置文件 .env.production"""
    project_root = Path(__file__).resolve().parent.parent
    env_file = project_root / ".env.production"
    load_env_file(env_file)


def start_with_waitress(host: str = "0.0.0.0", port: int = 8000, workers: int = 4) -> None:
    """使用 Waitress + ASGI2WSGI 适配器启动（Windows 兼容方案）"""
    try:
        from waitress import serve
    except ImportError:
        logger.error("Waitress 未安装，请运行: pip install waitress")
        sys.exit(1)

    try:
        from asgiref.wsgi import WsgiToAsgi
    except ImportError:
        logger.error("asgiref 未安装，请运行: pip install asgiref")
        logger.error("或者改用 Hypercorn/Uvicorn: python production.py --server hypercorn")
        sys.exit(1)

    # 注意：导入 main 模块会触发 init_db()，但为了确保迁移执行，
    # 我们在 main() 函数中显式调用 run_alembic_migrations()
    try:
        from main import app  # FastAPI ASGI 应用
    except Exception as e:
        logger.error(f"导入 FastAPI 应用失败: {e}")
        sys.exit(1)

    logger.info("=" * 60)
    logger.info("使用 Waitress + ASGI2WSGI 适配器启动生产环境")
    logger.info(f"地址: http://{host}:{port}")
    logger.info(f"线程数: {workers}")
    logger.info("⚠️  注意: Waitress 不支持原生 ASGI，建议生产环境使用 Hypercorn")
    logger.info("=" * 60)

    try:
        # 将 ASGI 应用转换为 WSGI
        wsgi_app = WsgiToAsgi(app)
        
        serve(
            wsgi_app,
            host=host,
            port=port,
            threads=workers,
            url_scheme="http",
            channel_timeout=60,
            connection_limit=1000,
            cleanup_interval=30,
        )
    except Exception as e:
        logger.error(f"Waitress 启动失败: {e}")
        sys.exit(1)


def start_with_hypercorn(host: str = "0.0.0.0", port: int = 8000, workers: int = 4) -> None:
    """使用 Hypercorn 启动（多进程 / HTTP2 / WebSocket）"""
    logger.info("[DEBUG] 进入 start_with_hypercorn 函数")
    try:
        logger.info("[DEBUG] 正在导入 Hypercorn...")
        from hypercorn.asyncio import serve
        from hypercorn.config import Config
        logger.info("[DEBUG] Hypercorn 导入成功")
    except ImportError as e:
        logger.error(f"Hypercorn 未安装，请运行: python -m pip install hypercorn")
        logger.error(f"[DEBUG] ImportError 详情: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

    # 使用 CLI 模式启动，确保 workers 生效（避免 asyncio.serve 忽略 workers）
    cli_args = [
        sys.executable,
        "-m",
        "hypercorn",
        "main:app",
        "--bind",
        f"{host}:{port}",
        "--workers",
        str(workers),
        "--access-logfile",
        str(LOG_DIR / "access.log"),
        "--error-logfile",
        str(LOG_DIR / "error.log"),
        "--log-level",
        "info",
        "--backlog",
        "2048",
    ]

# trace
# debug
# info
# warning
# error
# critical
    logger.info("=" * 60)
    logger.info("使用 Hypercorn 启动生产环境")
    logger.info(f"地址: http://{host}:{port}")
    logger.info(f"工作进程数: {workers}")
    logger.info("=" * 60)

    try:
        # execv 方式替换当前进程，避免多进程下二次启动
        os.execv(sys.executable, cli_args)
    except Exception as e:
        logger.error(f"Hypercorn 启动失败: {e}")
        sys.exit(1)


def start_with_uvicorn(host: str = "0.0.0.0", port: int = 8000, workers: int = 1) -> None:
    """使用 Uvicorn 启动（Windows 建议单进程）"""
    try:
        import uvicorn
    except ImportError:
        logger.error("Uvicorn 未安装，请运行: python -m pip install uvicorn")
        sys.exit(1)

    try:
        from main import app
    except Exception as e:
        logger.error(f"导入 FastAPI 应用失败（from main import app）: {e}")
        sys.exit(1)

    logger.info("=" * 60)
    logger.info("使用 Uvicorn 启动生产环境")
    logger.info(f"地址: http://{host}:{port}")
    logger.info("⚠ Windows 上 uvicorn 多进程 workers 不稳定，这里推荐用单进程 + 线程池。")
    logger.info("=" * 60)

    try:
        uvicorn.run(
            app,
            host=host,
            port=port,
            log_level="info",
            access_log=True,
            use_colors=False,
            proxy_headers=True,
            forwarded_allow_ips="*",
        )
    except Exception as e:
        logger.error(f"Uvicorn 启动失败: {e}")
        sys.exit(1)


def main() -> None:
    load_production_env()
    # 先确保数据库存在，避免迁移时因 DB 不存在而失败
    try:
        from app.core.database import create_database_if_not_exists, ensure_required_schemas
        create_database_if_not_exists()
        ensure_required_schemas()
        logger.info("✅ 已确保数据库与 schema 存在")
    except Exception as e:
        logger.warning(f"数据库创建/初始化警告: {e}")
    
    # ============================================================
    # 迁移已停用：数据库结构由 init_db + 模型自动同步
    # ============================================================
    logger.info("=" * 60)
    logger.info("跳过数据库迁移（已停用 Alembic）")
    logger.info("=" * 60)

    parser = argparse.ArgumentParser(
        description="生产环境启动脚本 - Windows Server 2019",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
  python production.py
  python production.py --server waitress --port 8000
  python production.py --server hypercorn --host 0.0.0.0 --port 8000 --workers 4
  python production.py --server uvicorn --port 8000
        """,
    )

    parser.add_argument(
        "--server",
        type=str,
        choices=["hypercorn", "uvicorn", "waitress"],
        default="hypercorn",
        help="选择服务器 (默认: hypercorn，推荐用于生产环境)",
    )
    parser.add_argument(
        "--host",
        type=str,
        default="0.0.0.0",
        help="绑定地址 (默认: 0.0.0.0)",
    )
    parser.add_argument(
        "--port",
        type=int,
        default=8000,
        help="监听端口 (默认: 8000)",
    )
    parser.add_argument(
        "--workers",
        type=int,
        default=4,
        help="工作进程/线程数 (默认: 4)",
    )

    args = parser.parse_args()

    logger.info("准备启动生产环境...")
    logger.info(f"环境模式: {os.environ.get('APP_ENV', 'unknown')}")
    logger.info(f"选择的服务器: {args.server}")
    logger.info(f"[DEBUG] 即将调用 start_with_{args.server}()")

    try:
        if args.server == "hypercorn":
            logger.info("[DEBUG] 调用 start_with_hypercorn...")
            start_with_hypercorn(args.host, args.port, args.workers)
        elif args.server == "uvicorn":
            logger.info("[DEBUG] 调用 start_with_uvicorn...")
            start_with_uvicorn(args.host, args.port, args.workers)
        elif args.server == "waitress":
            logger.info("[DEBUG] 调用 start_with_waitress...")
            start_with_waitress(args.host, args.port, args.workers)
    except KeyboardInterrupt:
        logger.info("服务器已停止（Ctrl+C）")
    except Exception as e:
        logger.error(f"服务器运行错误: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"[FATAL] 程序崩溃: {e}")
        import traceback
        traceback.print_exc()
        input("按回车键退出...")  # 让用户能看到错误
        sys.exit(1)
