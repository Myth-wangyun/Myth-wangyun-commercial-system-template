"""
数据库迁移脚本：为咨询师月度计划数据表添加数据类型字段
直接使用 psycopg 连接，避免导入项目模块的问题

执行方式：
cd backend
python migrations/add_data_type_to_consultant_plan_direct.py
"""

import os
from dotenv import load_dotenv

# 加载环境变量
env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
if os.path.exists(env_path):
    load_dotenv(env_path)
else:
    # 尝试开发环境配置
    env_dev_path = os.path.join(os.path.dirname(__file__), '..', '.env.development')
    if os.path.exists(env_dev_path):
        load_dotenv(env_dev_path)

import psycopg


def migrate():
    """执行迁移"""
    # 从环境变量获取数据库连接信息
    db_host = os.getenv('DB_HOST', 'localhost')
    db_port = os.getenv('DB_PORT', '5432')
    db_name = os.getenv('DB_NAME', 'qmjy')
    db_user = os.getenv('DB_USER', 'postgres')
    db_password = os.getenv('DB_PASSWORD', 'qingmeijiaoyu123..')
    
    conn_string = f"host={db_host} port={db_port} dbname={db_name} user={db_user} password={db_password}"
    
    print(f"连接数据库: {db_host}:{db_port}/{db_name}")
    
    with psycopg.connect(conn_string) as conn:
        with conn.cursor() as cur:
            # 检查表是否存在
            cur.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'consult' 
                    AND table_name = '咨询师月度计划数据'
                )
            """)
            table_exists = cur.fetchone()[0]
            
            if not table_exists:
                print("表 consult.咨询师月度计划数据 不存在，请先创建表")
                return False
            
            # 检查数据类型字段是否已存在
            cur.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.columns 
                    WHERE table_schema = 'consult' 
                    AND table_name = '咨询师月度计划数据'
                    AND column_name = '数据类型'
                )
            """)
            column_exists = cur.fetchone()[0]
            
            if column_exists:
                print("字段 '数据类型' 已存在，跳过添加")
            else:
                print("添加字段 '数据类型'...")
                cur.execute("""
                    ALTER TABLE consult."咨询师月度计划数据"
                    ADD COLUMN "数据类型" VARCHAR(50) NOT NULL DEFAULT '汇总'
                """)
                print("字段添加成功")
            
            # 删除旧的唯一约束（如果存在）
            print("检查并更新唯一约束...")
            try:
                cur.execute("""
                    ALTER TABLE consult."咨询师月度计划数据"
                    DROP CONSTRAINT IF EXISTS uq_consultant_plan_year_month_campus_consultant
                """)
                print("已删除旧约束 uq_consultant_plan_year_month_campus_consultant")
            except Exception as e:
                print(f"删除旧约束时出错（可能不存在）: {e}")
            
            # 添加新的唯一约束（包含数据类型）
            try:
                cur.execute("""
                    ALTER TABLE consult."咨询师月度计划数据"
                    DROP CONSTRAINT IF EXISTS uq_consultant_plan_year_month_campus_consultant_type
                """)
                cur.execute("""
                    ALTER TABLE consult."咨询师月度计划数据"
                    ADD CONSTRAINT uq_consultant_plan_year_month_campus_consultant_type
                    UNIQUE ("年份", "月份", "神殿", "咨询师", "数据类型")
                """)
                print("已添加新约束 uq_consultant_plan_year_month_campus_consultant_type")
            except Exception as e:
                print(f"添加新约束时出错: {e}")
            
            # 添加数据类型索引
            try:
                cur.execute("""
                    CREATE INDEX IF NOT EXISTS idx_consultant_plan_年份_神殿_数据类型
                    ON consult."咨询师月度计划数据" ("年份", "神殿", "数据类型")
                """)
                print("已添加索引 idx_consultant_plan_年份_神殿_数据类型")
            except Exception as e:
                print(f"添加索引时出错: {e}")
            
            conn.commit()
            print("\n迁移完成!")
            return True


if __name__ == "__main__":
    success = migrate()
    if not success:
        exit(1)
