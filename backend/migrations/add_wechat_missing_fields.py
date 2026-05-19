"""
添加微信平台缺失的字段
- 数据诊断结果均值
- 完播率
- 平均播放时长
- 3s以上播放率
- 推荐人数
- 留言条数
"""
import sys
import os

# 添加项目根目录到 Python 路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text, Column, Numeric, Integer
from app.core.config import settings

def add_wechat_missing_fields():
    """添加微信平台表缺失的字段"""
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as conn:
        # 开始事务
        trans = conn.begin()
        
        try:
            table_name = '市场部免费推广微信平台日度数据表'
            
            # 检查表是否存在（PostgreSQL使用CURRENT_SCHEMA()）
            check_table = text(f"""
                SELECT COUNT(*) as count 
                FROM information_schema.tables 
                WHERE table_schema = 'market'
                AND table_name = :table_name
            """)
            result = conn.execute(check_table, {"table_name": table_name}).fetchone()
            
            if result[0] == 0:
                print(f"表 {table_name} 不存在，跳过")
                trans.rollback()
                return
            
            print(f"开始为表 {table_name} 添加缺失字段...")
            
            # 要添加的字段列表
            fields_to_add = [
                {
                    'name': '视频号数据诊断结果均值',
                    'type': 'DECIMAL(10,2)',
                    'comment': '微信视频号数据诊断结果均值'
                },
                {
                    'name': '视频号完播率',
                    'type': 'DECIMAL(10,2)',
                    'comment': '微信视频号完播率'
                },
                {
                    'name': '视频号平均播放时长',
                    'type': 'DECIMAL(10,2)',
                    'comment': '微信视频号平均播放时长(秒)'
                },
                {
                    'name': '视频号3s以上播放率',
                    'type': 'DECIMAL(10,2)',
                    'comment': '微信视频号3s以上播放率'
                },
                {
                    'name': '公众号推荐数',
                    'type': 'INT',
                    'comment': '公众号推荐人数',
                    'default': '0'
                },
                {
                    'name': '公众号留言数',
                    'type': 'INT',
                    'comment': '公众号留言条数',
                    'default': '0'
                }
            ]
            
            # 检查并添加每个字段
            for field in fields_to_add:
                # 检查字段是否已存在（PostgreSQL）
                check_column = text(f"""
                    SELECT COUNT(*) as count 
                    FROM information_schema.columns 
                    WHERE table_schema = 'market'
                    AND table_name = :table_name 
                    AND column_name = :column_name
                """)
                result = conn.execute(check_column, {
                    "table_name": table_name,
                    "column_name": field['name']
                }).fetchone()
                
                if result[0] > 0:
                    print(f"  字段 {field['name']} 已存在，跳过")
                    continue
                
                # 构建 ALTER TABLE 语句（PostgreSQL语法）
                default_clause = f"DEFAULT {field['default']}" if 'default' in field else ""
                alter_sql = text(f"""
                    ALTER TABLE market."{table_name}" 
                    ADD COLUMN "{field['name']}" {field['type']} {default_clause}
                """)
                
                conn.execute(alter_sql)
                print(f"  √ 成功添加字段: {field['name']}")
            
            # 提交事务
            trans.commit()
            print(f"\n[OK] 所有字段添加完成！")
            
        except Exception as e:
            trans.rollback()
            print(f"\n[ERROR] 添加字段失败: {str(e)}")
            raise

if __name__ == "__main__":
    print("=" * 60)
    print("添加微信平台表缺失字段")
    print("=" * 60)
    add_wechat_missing_fields()
    print("=" * 60)

