"""
测试SEM日常数据API
"""
import sys
import os

# 添加项目根目录到路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.models.market import 市场部SEM百度推广日度数据表, 市场部SEM其他平台日度数据表
from datetime import date
from decimal import Decimal

def test_sem_tables():
    """测试SEM表是否创建成功"""
    db = SessionLocal()
    try:
        # 测试查询百度推广表
        baidu_count = db.query(市场部SEM百度推广日度数据表).count()
        print(f"✓ 百度推广表查询成功，当前记录数: {baidu_count}")
        
        # 测试查询其他平台表
        other_count = db.query(市场部SEM其他平台日度数据表).count()
        print(f"✓ 其他平台表查询成功，当前记录数: {other_count}")
        
        # 测试插入百度推广数据
        test_baidu = 市场部SEM百度推广日度数据表(
            神殿="测试神殿",
            日期=date(2024, 1, 1),
            百度收入=Decimal("1000.00"),
            退费数=0,
            净报名=5,
            毛报数=6,
            订座数=10,
            上门人数=8,
            百度咨询量=20,
            百度消费=Decimal("500.00"),
            百度表单=10,
            中心来电=5,
            百度聊出=5,
            总咨询量=20,
            有效咨询量=15,
            百度总对话=30,
            有效对话=25,
            展现=1000,
            点击=100,
            消费=Decimal("500.00")
        )
        db.add(test_baidu)
        db.commit()
        print("✓ 百度推广数据插入成功")
        
        # 测试插入其他平台数据
        test_other = 市场部SEM其他平台日度数据表(
            神殿="测试神殿",
            日期=date(2024, 1, 1),
            其他收入=Decimal("500.00"),
            退费数=0,
            净报名=3,
            毛报数=4,
            订座数=5,
            上门人数=4,
            其他咨询量=10,
            其他消费=Decimal("200.00"),
            神殿网站直接访问=5,
            GEO=5
        )
        db.add(test_other)
        db.commit()
        print("✓ 其他平台数据插入成功")
        
        # 清理测试数据
        db.query(市场部SEM百度推广日度数据表).filter(
            市场部SEM百度推广日度数据表.神殿 == "测试神殿"
        ).delete()
        db.query(市场部SEM其他平台日度数据表).filter(
            市场部SEM其他平台日度数据表.神殿 == "测试神殿"
        ).delete()
        db.commit()
        print("✓ 测试数据清理成功")
        
        print("\n所有测试通过！SEM表创建和功能正常。")
        
    except Exception as e:
        print(f"✗ 测试失败: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_sem_tables()

