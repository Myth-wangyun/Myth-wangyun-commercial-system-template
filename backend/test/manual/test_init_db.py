"""
测试祈福司入职离职明细表创建
"""
import sys
sys.path.insert(0, 'C:/Users/xzw65/Desktop/qm-system/backend')

from app.core.database import init_db

if __name__ == '__main__':
    print("开始初始化数据库...")
    init_db()
    print("数据库初始化完成！")
