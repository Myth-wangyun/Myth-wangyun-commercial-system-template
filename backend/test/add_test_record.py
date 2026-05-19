import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from app.core.database import SessionLocal
from app.models.market import 投放明细表
from datetime import date

# 创建数据库会话
db = SessionLocal()

try:
    # 添加一条测试记录
    new_record = 投放明细表(
        日期=date.today(),
        媒体来源="测试渠道",
        消费金额=100.0,
        展现量=1000,
        点击量=50,
        IP=30,
        PV=40,
        对话量=10,
        有效对话=8,
        咨询量=5
    )
    db.add(new_record)
    db.commit()
    db.refresh(new_record)
    print(f"成功添加测试记录，ID={new_record.明细ID}")
finally:
    db.close()


