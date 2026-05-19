"""
添加视频日度数据表缺失的字段
- 优酷分享量
- 优酷粉丝数
- 爱奇艺总播放时长
- 爱奇艺总播放完成率
"""
import sys
import os
from pathlib import Path

# 添加项目根目录到 Python 路径
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from sqlalchemy import text
from app.core.database import engine, SessionLocal

def add_video_missing_fields():
    """添加视频日度数据表缺失的字段"""
    
    db = SessionLocal()
    
    try:
        print("开始添加视频日度数据表缺失的字段...")
        table_exists = db.execute(
            text(
                """
                SELECT 1
                FROM information_schema.tables
                WHERE table_schema = 'market'
                  AND table_name = '市场部免费推广视频日度数据表'
                """
            )
        ).scalar()
        if not table_exists:
            print('表 market."市场部免费推广视频日度数据表" 不存在，跳过')
            return
        
        # 检查并添加字段
        fields_to_add = [
            {
                'name': '优酷分享量',
                'sql': "ALTER TABLE market.市场部免费推广视频日度数据表 ADD COLUMN IF NOT EXISTS 优酷分享量 INTEGER DEFAULT 0"
            },
            {
                'name': '优酷粉丝数',
                'sql': "ALTER TABLE market.市场部免费推广视频日度数据表 ADD COLUMN IF NOT EXISTS 优酷粉丝数 INTEGER DEFAULT 0"
            },
            {
                'name': '爱奇艺总播放时长',
                'sql': "ALTER TABLE market.市场部免费推广视频日度数据表 ADD COLUMN IF NOT EXISTS 爱奇艺总播放时长 NUMERIC(10, 2)"
            },
            {
                'name': '爱奇艺总播放完成率',
                'sql': "ALTER TABLE market.市场部免费推广视频日度数据表 ADD COLUMN IF NOT EXISTS 爱奇艺总播放完成率 NUMERIC(10, 2)"
            }
        ]
        
        for field in fields_to_add:
            try:
                print(f"添加字段: {field['name']}")
                db.execute(text(field['sql']))
                db.commit()
                print(f"✓ 成功添加字段: {field['name']}")
            except Exception as e:
                print(f"✗ 添加字段 {field['name']} 失败: {str(e)}")
                db.rollback()
        
        # 添加注释
        comments = [
            "COMMENT ON COLUMN market.市场部免费推广视频日度数据表.优酷分享量 IS '优酷分享量'",
            "COMMENT ON COLUMN market.市场部免费推广视频日度数据表.优酷粉丝数 IS '优酷粉丝数'",
            "COMMENT ON COLUMN market.市场部免费推广视频日度数据表.爱奇艺总播放时长 IS '爱奇艺总播放时长(秒)'",
            "COMMENT ON COLUMN market.市场部免费推广视频日度数据表.爱奇艺总播放完成率 IS '爱奇艺总播放完成率'"
        ]
        
        print("\n添加字段注释...")
        for comment_sql in comments:
            try:
                db.execute(text(comment_sql))
                db.commit()
            except Exception as e:
                print(f"添加注释失败: {str(e)}")
                db.rollback()
        
        print("\n✓ 所有字段添加完成！")
        
        # 验证字段是否添加成功
        print("\n验证字段...")
        result = db.execute(text("""
            SELECT column_name, data_type, column_default
            FROM information_schema.columns
            WHERE table_schema = 'market'
            AND table_name = '市场部免费推广视频日度数据表'
            AND column_name IN ('优酷分享量', '优酷粉丝数', '爱奇艺总播放时长', '爱奇艺总播放完成率')
            ORDER BY column_name
        """))
        
        fields = result.fetchall()
        if fields:
            print("\n已添加的字段:")
            for field in fields:
                print(f"  - {field[0]}: {field[1]} (默认值: {field[2]})")
        else:
            print("\n警告: 未找到添加的字段，请检查数据库")
        
    except Exception as e:
        print(f"\n错误: {str(e)}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == '__main__':
    add_video_missing_fields()
