"""
简化版测试脚本：快速检查市场部表数据
"""
import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

print("1. 加载配置...")
from app.core.config import settings

print(f"2. 数据库信息: {settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME}")

print("3. 创建数据库连接...")
from sqlalchemy import create_engine, text

DATABASE_URL = f"mysql+pymysql://{settings.DB_USER}:{settings.DB_PASSWORD}@{settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME}?charset=utf8mb4&connect_timeout=10"
engine = create_engine(DATABASE_URL, echo=False)

print("4. 测试连接...")
with engine.connect() as conn:
    result = conn.execute(text("SELECT 1"))
    print(f"   连接成功: {result.fetchone()}")

print("\n5. 检查市场部年度网络计划表...")
with engine.connect() as conn:
    # 检查表是否存在
    result = conn.execute(text("SHOW TABLES LIKE '市场部网络计划表'"))
    if result.fetchone():
        print("   ✓ 表存在")
        
        # 统计数据
        result = conn.execute(text("SELECT COUNT(*) as cnt FROM 市场部网络计划表"))
        count = result.fetchone()[0]
        print(f"   数据总数: {count}")
        
        if count > 0:
            # 查询神殿
            result = conn.execute(text("SELECT DISTINCT campus FROM 市场部网络计划表 WHERE campus != '' LIMIT 10"))
            campuses = [row[0] for row in result.fetchall()]
            print(f"   神殿列表: {campuses}")
            
            # 查询2026年主神殿的数据
            result = conn.execute(text("""
                SELECT month, sem_plan_income, sem_plan_signup, newmedia_plan_income, newmedia_plan_signup 
                FROM 市场部网络计划表 
                WHERE year='2026' AND campus LIKE '%盛邦%' 
                LIMIT 5
            """))
            rows = result.fetchall()
            if rows:
                print(f"   2026年主神殿数据样例:")
                for row in rows:
                    print(f"     月份{row[0]}: SEM收入={row[1]}, SEM报名={row[2]}, 新媒体收入={row[3]}, 新媒体报名={row[4]}")
            else:
                print("   ⚠️ 没有找到2026年主神殿的数据")
    else:
        print("   ✗ 表不存在")

print("\n6. 检查市场部口碑月度计划表...")
with engine.connect() as conn:
    result = conn.execute(text("SHOW TABLES LIKE '市场部口碑月度计划表'"))
    if result.fetchone():
        print("   ✓ 表存在")
        result = conn.execute(text("SELECT COUNT(*) FROM 市场部口碑月度计划表"))
        count = result.fetchone()[0]
        print(f"   数据总数: {count}")
    else:
        print("   ✗ 表不存在")

print("\n7. 检查市场部网络合作伙伴月度计划表...")
with engine.connect() as conn:
    result = conn.execute(text("SHOW TABLES LIKE '市场部网络合作伙伴月度计划表'"))
    if result.fetchone():
        print("   ✓ 表存在")
        result = conn.execute(text("SELECT COUNT(*) FROM 市场部网络合作伙伴月度计划表"))
        count = result.fetchone()[0]
        print(f"   数据总数: {count}")
    else:
        print("   ✗ 表不存在")

print("\n✓ 检查完成")

