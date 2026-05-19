"""
直接测试API逻辑 - 检查市场部表数据
"""
import sys
sys.path.append('D:/Documents/Desktop/qm-system/backend')

from sqlalchemy import create_engine, and_
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# 创建数据库连接
engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True, pool_recycle=3600)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

print("=" * 60)
print("测试1: 检查市场部年度网络计划表")
print("=" * 60)

try:
    from app.models.market.network_plan import MarketNetworkPlan
    
    # 查询所有2026年的数据
    all_plans = db.query(MarketNetworkPlan).filter(
        MarketNetworkPlan.year == "2026"
    ).all()
    
    print(f"\n找到 {len(all_plans)} 条2026年的记录")
    
    if all_plans:
        print("\n所有神殿名称:")
        campus_names = set([p.campus for p in all_plans])
        for name in campus_names:
            print(f"  - {name}")
        
        # 显示第一条记录的详细信息
        first = all_plans[0]
        print(f"\n第一条记录示例:")
        print(f"  年份: {first.year} (类型: {type(first.year).__name__})")
        print(f"  神殿: {first.campus}")
        print(f"  月份: {first.month}")
        print(f"  SEM计划收入: {first.sem_plan_income}")
        print(f"  SEM计划招生: {first.sem_plan_signup}")
        print(f"  新媒体计划收入: {first.newmedia_plan_income}")
        print(f"  新媒体计划招生: {first.newmedia_plan_signup}")
    
    # 测试具体查询（主神殿）
    print("\n" + "=" * 60)
    print("测试2: 查询主神殿的数据")
    print("=" * 60)
    
    test_campus = "主神殿"
    campus_plans = db.query(MarketNetworkPlan).filter(
        and_(
            MarketNetworkPlan.year == "2026",
            MarketNetworkPlan.campus == test_campus
        )
    ).all()
    
    print(f"\n精确匹配 '{test_campus}': {len(campus_plans)} 条记录")
    
    if campus_plans:
        for plan in campus_plans[:3]:  # 显示前3条
            print(f"  月份{plan.month}: SEM收入={plan.sem_plan_income}, SEM招生={plan.sem_plan_signup}")
    
    # 模糊匹配测试
    print("\n" + "=" * 60)
    print("测试3: 模糊匹配包含'盛邦'的神殿")
    print("=" * 60)
    
    fuzzy_plans = db.query(MarketNetworkPlan).filter(
        and_(
            MarketNetworkPlan.year == "2026",
            MarketNetworkPlan.campus.like("%盛邦%")
        )
    ).all()
    
    print(f"\n模糊匹配结果: {len(fuzzy_plans)} 条记录")
    if fuzzy_plans:
        campus_names = set([p.campus for p in fuzzy_plans])
        print("匹配到的神殿名称:")
        for name in campus_names:
            print(f"  - {name}")

except Exception as e:
    print(f"❌ 错误: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 60)
print("测试4: 检查市场部口碑月度计划表")
print("=" * 60)

try:
    from app.models.market.monthly_plan_data import 市场部口碑月度计划表
    
    reputation_plans = db.query(市场部口碑月度计划表).filter(
        市场部口碑月度计划表.year == "2026"
    ).all()
    
    print(f"\n找到 {len(reputation_plans)} 条2026年的记录")
    
    if reputation_plans:
        campus_names = set([p.campus for p in reputation_plans])
        print("\n所有神殿名称:")
        for name in campus_names:
            print(f"  - {name}")

except Exception as e:
    print(f"❌ 错误: {e}")

print("\n" + "=" * 60)
print("测试5: 检查市场部网络合作伙伴月度计划表")
print("=" * 60)

try:
    from app.models.market.monthly_plan_data import 市场部网络合作伙伴月度计划表
    
    partner_plans = db.query(市场部网络合作伙伴月度计划表).filter(
        市场部网络合作伙伴月度计划表.year == "2026"
    ).all()
    
    print(f"\n找到 {len(partner_plans)} 条2026年的记录")
    
    if partner_plans:
        campus_names = set([p.campus for p in partner_plans])
        print("\n所有神殿名称:")
        for name in campus_names:
            print(f"  - {name}")

except Exception as e:
    print(f"❌ 错误: {e}")

db.close()
print("\n✅ 测试完成")

