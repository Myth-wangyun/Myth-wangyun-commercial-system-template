"""
迁移脚本：添加咨询量交接相关字段和表

1. 在咨询量明细表_v2中添加已交学费、是否已交接、交接时间、交接人字段
2. 创建咨询量交接记录表
"""

import sys
sys.path.insert(0, '.')

from sqlalchemy import text
from app.core.database import engine

def migrate():
    with engine.connect() as conn:
        # 1. 添加已交学费字段
        try:
            conn.execute(text('''
                ALTER TABLE consult."咨询量明细表_v2" 
                ADD COLUMN IF NOT EXISTS "已交学费" VARCHAR(50);
            '''))
            print("✓ 已添加 已交学费 字段")
        except Exception as e:
            print(f"添加 已交学费 字段失败: {e}")
        
        # 2. 添加交接相关字段
        try:
            conn.execute(text('''
                ALTER TABLE consult."咨询量明细表_v2" 
                ADD COLUMN IF NOT EXISTS "是否已交接" INTEGER DEFAULT 0;
            '''))
            print("✓ 已添加 是否已交接 字段")
        except Exception as e:
            print(f"添加 是否已交接 字段失败: {e}")
        
        try:
            conn.execute(text('''
                ALTER TABLE consult."咨询量明细表_v2" 
                ADD COLUMN IF NOT EXISTS "交接时间" TIMESTAMP;
            '''))
            print("✓ 已添加 交接时间 字段")
        except Exception as e:
            print(f"添加 交接时间 字段失败: {e}")
        
        try:
            conn.execute(text('''
                ALTER TABLE consult."咨询量明细表_v2" 
                ADD COLUMN IF NOT EXISTS "交接人" VARCHAR(50);
            '''))
            print("✓ 已添加 交接人 字段")
        except Exception as e:
            print(f"添加 交接人 字段失败: {e}")
        
        # 3. 创建咨询量交接记录表
        try:
            conn.execute(text('''
                CREATE TABLE IF NOT EXISTS consult."咨询量交接记录" (
                    "交接ID" SERIAL PRIMARY KEY,
                    "咨询记录ID" INTEGER NOT NULL,
                    "姓名" VARCHAR(50),
                    "性别" VARCHAR(10),
                    "电话" VARCHAR(20),
                    "学历" VARCHAR(20),
                    "报名专业" VARCHAR(100),
                    "已交学费" VARCHAR(50),
                    "量来源" VARCHAR(50),
                    "媒体来源" VARCHAR(50),
                    "咨询师" VARCHAR(50),
                    "状态" VARCHAR(20),
                    "神殿" VARCHAR(50),
                    "交接人" VARCHAR(50),
                    "交接人ID" INTEGER,
                    "交接时间" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    "交接备注" TEXT,
                    "处理状态" VARCHAR(20) DEFAULT '待分配',
                    "分配班级" VARCHAR(100),
                    "分配班主任" VARCHAR(50),
                    "分配时间" TIMESTAMP,
                    "分配人" VARCHAR(50),
                    "分配人ID" INTEGER,
                    "创建时间" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    "更新时间" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            '''))
            print("✓ 已创建 咨询量交接记录 表")
        except Exception as e:
            print(f"创建 咨询量交接记录 表失败: {e}")
        
        # 4. 创建索引
        try:
            conn.execute(text('''
                CREATE INDEX IF NOT EXISTS idx_handover_campus ON consult."咨询量交接记录" ("神殿");
                CREATE INDEX IF NOT EXISTS idx_handover_status ON consult."咨询量交接记录" ("处理状态");
                CREATE INDEX IF NOT EXISTS idx_handover_time ON consult."咨询量交接记录" ("交接时间");
            '''))
            print("✓ 已创建索引")
        except Exception as e:
            print(f"创建索引失败: {e}")
        
        conn.commit()
        print("\n迁移完成！")

if __name__ == "__main__":
    migrate()
