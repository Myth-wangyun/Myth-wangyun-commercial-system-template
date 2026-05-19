import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from app.core.database import SessionLocal
from app.crud.market import 删除日投放数据, 获取日投放数据
from app.models.market import 投放明细表

# 创建数据库会话
db = SessionLocal()

try:
    # 1. 检查记录是否存在
    print("=== 检查记录1是否存在 ===")
    record = 获取日投放数据(db, 1)
    if record:
        print(f"找到记录: ID={record.明细ID}, 日期={record.日期}, 媒体来源={record.媒体来源}")
    else:
        print("记录1不存在")
    
    # 2. 尝试删除记录
    print("\n=== 尝试删除记录1 ===")
    result = 删除日投放数据(db, 1)
    print(f"删除结果: {result}")
    
    # 3. 再次检查记录
    print("\n=== 删除后再次检查 ===")
    record2 = 获取日投放数据(db, 1)
    if record2:
        print(f"记录仍存在: ID={record2.明细ID}")
    else:
        print("记录已被删除")
        
finally:
    db.close()

