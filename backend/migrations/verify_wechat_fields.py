"""验证微信平台表字段是否添加成功"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from app.core.config import settings

def verify_fields():
    """验证字段是否添加成功"""
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT column_name, data_type, character_maximum_length, numeric_precision, numeric_scale
            FROM information_schema.columns 
            WHERE table_schema = 'market'
            AND table_name = '市场部免费推广微信平台日度数据表'
            AND column_name IN (
                '视频号数据诊断结果均值',
                '视频号完播率',
                '视频号平均播放时长',
                '视频号3s以上播放率',
                '公众号推荐数',
                '公众号留言数'
            )
            ORDER BY ordinal_position
        """))
        
        rows = result.fetchall()
        
        if len(rows) == 6:
            print("\n[OK] 所有6个字段都已成功添加！\n")
            print("字段详情:")
            print("-" * 80)
            for row in rows:
                col_name = row[0]
                data_type = row[1]
                if data_type == 'numeric':
                    type_info = f"{data_type}({row[3]},{row[4]})"
                elif data_type == 'integer':
                    type_info = "integer"
                else:
                    type_info = data_type
                print(f"  {col_name:30s} | {type_info}")
            print("-" * 80)
            print("\n现在可以重启后端服务并测试前端页面了！")
        else:
            print(f"\n[WARNING] 只找到 {len(rows)} 个字段，应该有6个")
            for row in rows:
                print(f"  - {row[0]}")

if __name__ == "__main__":
    verify_fields()

