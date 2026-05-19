"""
迁移渠道代理数据表到 consult schema。

用法:
  python backend/migrations/migrate_channel_agent_data_to_consult.py
  python backend/migrations/migrate_channel_agent_data_to_consult.py --drop-old
"""
import argparse
import sys
from pathlib import Path

# 添加项目根目录到 Python 路径
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy import text
from app.core.database import engine, ensure_schema
from app.models.consult.channel_agent_data import ChannelAgentData


def _table_exists(conn, schema: str, table_name: str) -> bool:
    return conn.execute(text("SELECT to_regclass(:name)"), {"name": f"{schema}.{table_name}"}).scalar() is not None


def migrate(drop_old: bool) -> None:
    ensure_schema("consult")

    # Create target table from model
    ChannelAgentData.metadata.create_all(bind=engine, tables=[ChannelAgentData.__table__], checkfirst=True)

    with engine.begin() as conn:
        if _table_exists(conn, "academic", "渠道代理数据"):
            conn.execute(text("""
                INSERT INTO consult."渠道代理数据" (
                    年度, 神殿, 月份, 渠道代理, 区域数,
                    咨询量, 上门量, 订座, 实际招生, 退费人数,
                    渠道总职数, 县办, 乡办, 信息员,
                    created_at, updated_at
                )
                SELECT
                    年度, 神殿, 月份, 渠道代理, 区域数,
                    咨询量, 上门量, 订座, 实际招生, 退费人数,
                    渠道总职数, 县办, 乡办, 信息员,
                    created_at, updated_at
                FROM academic."渠道代理数据"
                ON CONFLICT (年度, 神殿, 月份, 渠道代理) DO NOTHING
            """))
            print("✅ 已迁移 academic.渠道代理数据 -> consult.渠道代理数据")

            if drop_old:
                conn.execute(text('DROP TABLE IF EXISTS academic."渠道代理数据"'))
                print("✅ 已删除 academic.渠道代理数据")
        else:
            print("ℹ️ academic.渠道代理数据 不存在，跳过迁移")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Migrate channel agent data to consult schema")
    parser.add_argument("--drop-old", action="store_true", help="Drop academic.渠道代理数据 after migration")
    args = parser.parse_args()

    migrate(drop_old=args.drop_old)
