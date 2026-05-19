"""
测试渠道代理数据API

使用方法:
python backend/test_channel_agent_api.py
"""
import sys
import os

# 添加项目根目录到路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from app.core.config import settings


def test_table_exists():
    """测试表是否存在"""
    engine = create_engine(settings.DATABASE_URL)
    
    check_sql = text("""
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'academic' 
            AND table_name = '渠道代理数据'
        );
    """)
    
    with engine.connect() as conn:
        result = conn.execute(check_sql)
        exists = result.scalar()
        
        if exists:
            print("✅ 表 academic.渠道代理数据 已存在")
            
            # 查询表结构
            columns_sql = text("""
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns
                WHERE table_schema = 'academic' 
                AND table_name = '渠道代理数据'
                ORDER BY ordinal_position;
            """)
            
            result = conn.execute(columns_sql)
            columns = result.fetchall()
            
            print("\n表结构:")
            for col in columns:
                print(f"  {col[0]}: {col[1]} {'NULL' if col[2] == 'YES' else 'NOT NULL'}")
        else:
            print("❌ 表 academic.渠道代理数据 不存在")
            print("\n请运行以下命令创建表:")
            print('python -c "from backend.migrations.create_channel_agent_data_table import create_table; create_table()"')


if __name__ == "__main__":
    test_table_exists()
