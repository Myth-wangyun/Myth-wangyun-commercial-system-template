"""
测试脚本：检查市场部表中的数据
用于诊断财务收入API为什么没有从市场部读取数据
"""
import sys
from pathlib import Path

# 添加项目根目录到 Python 路径
backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

print("正在加载配置...")

try:
    from sqlalchemy import create_engine, text
    from sqlalchemy.orm import sessionmaker
    from app.core.config import settings
    print("✓ 配置加载成功")
except Exception as e:
    print(f"✗ 配置加载失败: {e}")
    sys.exit(1)

# 创建数据库连接
print(f"正在连接数据库: {settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME}")
DATABASE_URL = f"mysql+pymysql://{settings.DB_USER}:{settings.DB_PASSWORD}@{settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME}?charset=utf8mb4&connect_timeout=5"

try:
    engine = create_engine(DATABASE_URL, pool_pre_ping=True, pool_recycle=3600)
    SessionLocal = sessionmaker(bind=engine)
    print("✓ 数据库连接创建成功")
except Exception as e:
    print(f"✗ 数据库连接失败: {e}")
    sys.exit(1)

def test_market_network_plan():
    """测试市场部年度网络计划表"""
    print("\n" + "="*80)
    print("测试1: 市场部年度网络计划表")
    print("="*80)
    
    db = SessionLocal()
    try:
        print("正在查询表结构...")
        # 查询表是否存在
        result = db.execute(text("SHOW TABLES LIKE '市场部网络计划表'"))
        if not result.fetchone():
            print("⚠️ 表不存在！")
            return
        
        # 查询数据总数
        print("正在统计数据总数...")
        result = db.execute(text("SELECT COUNT(*) FROM 市场部网络计划表"))
        total = result.fetchone()[0]
        print(f"数据总数: {total}")
        
        if total == 0:
            print("⚠️ 表中没有数据！")
            return
        
        # 查询前10条数据
        print("正在查询前10条数据...")
        result = db.execute(text("SELECT id, year, month, campus, sem_plan_income, sem_plan_signup, newmedia_plan_income, newmedia_plan_signup FROM 市场部网络计划表 LIMIT 10"))
        rows = result.fetchall()
        
        print("\n前10条数据:")
        for row in rows:
            print(f"  ID={row[0]}, year={row[1]}, month={row[2]}, campus={row[3]}")
            print(f"    SEM: 收入={row[4]}, 报名={row[5]}")
            print(f"    新媒体: 收入={row[6]}, 报名={row[7]}")
        
        # 查询2026年的数据
        print("\n正在查询2026年数据...")
        result = db.execute(text("SELECT COUNT(*) FROM 市场部网络计划表 WHERE year='2026'"))
        count_2026 = result.fetchone()[0]
        print(f"2026年数据总数: {count_2026}")
        
        # 查询不同的神殿
        print("\n正在查询神殿列表...")
        result = db.execute(text("SELECT DISTINCT campus FROM 市场部网络计划表 WHERE campus != ''"))
        campuses = result.fetchall()
        print(f"神殿列表 (共{len(campuses)}个):")
        for campus in campuses:
            print(f"  - '{campus[0]}'")
            
    except Exception as e:
        print(f"\n❌ 错误: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


def test_market_monthly_plan():
    """测试市场部月度计划表"""
    print("\n" + "="*80)
    print("测试2: 市场部口碑月度计划表")
    print("="*80)
    
    db = SessionLocal()
    try:
        # 查询表结构
        result = db.execute(text("DESCRIBE 市场部口碑月度计划表"))
        print("\n表结构:")
        for row in result:
            print(f"  {row[0]}: {row[1]}")
        
        # 查询所有数据
        result = db.execute(text("SELECT * FROM 市场部口碑月度计划表 LIMIT 10"))
        rows = result.fetchall()
        print(f"\n数据总数: {len(rows)}")
        
        if rows:
            print("\n前10条数据:")
            for row in rows:
                print(f"  ID={row[0]}, year={row[1]}, month={row[2]}, campus={row[3]}, plan_income={row[4]}, plan_enrollment={row[5]}")
        else:
            print("\n⚠️ 表中没有数据！")
            
    except Exception as e:
        print(f"\n❌ 错误: {e}")
    finally:
        db.close()


def test_market_partner_plan():
    """测试市场部网络合作伙伴月度计划表"""
    print("\n" + "="*80)
    print("测试3: 市场部网络合作伙伴月度计划表")
    print("="*80)
    
    db = SessionLocal()
    try:
        # 查询表结构
        result = db.execute(text("DESCRIBE 市场部网络合作伙伴月度计划表"))
        print("\n表结构:")
        for row in result:
            print(f"  {row[0]}: {row[1]}")
        
        # 查询所有数据
        result = db.execute(text("SELECT * FROM 市场部网络合作伙伴月度计划表 LIMIT 10"))
        rows = result.fetchall()
        print(f"\n数据总数: {len(rows)}")
        
        if rows:
            print("\n前10条数据:")
            for row in rows:
                print(f"  ID={row[0]}, year={row[1]}, month={row[2]}, campus={row[3]}, partner={row[4]}, plan_income={row[5]}, plan_enrollment={row[6]}")
        else:
            print("\n⚠️ 表中没有数据！")
            
    except Exception as e:
        print(f"\n❌ 错误: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    print("\n" + "="*80)
    print("市场部数据表检查工具")
    print("="*80)
    print(f"数据库: {settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME}")
    
    test_market_network_plan()
    test_market_monthly_plan()
    test_market_partner_plan()
    
    print("\n" + "="*80)
    print("检查完成")
    print("="*80)

