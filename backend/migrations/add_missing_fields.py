"""
数据库迁移脚本：添加咨询量明细表缺失的所有字段

执行方式：
cd backend
python migrations/add_missing_fields.py
"""

import sys
import os

# 添加项目根目录到路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from app.core.config import settings

def run_migration():
    """添加所有缺失字段到咨询量明细表"""
    
    # 创建数据库连接
    engine = create_engine(settings.DATABASE_URL)
    
    # 需要添加的所有字段（按照模型定义）
    fields_to_add = [
        # 口碑提供人
        ('口碑提供人', 'VARCHAR(50)', '口碑提供人（量来源为口碑时填写）'),
        
        # 标记字段
        ('是否无效量', 'INTEGER DEFAULT 0', '是否无效量：0-否，1-是'),
        ('无效原因', 'VARCHAR(100)', '无效原因'),
        ('是否不算量', 'INTEGER DEFAULT 0', '是否不算量：0-否，1-是'),
        ('不算量原因', 'VARCHAR(100)', '不算量原因'),
        ('是否上门', 'INTEGER DEFAULT 0', '是否上门：0-否，1-是'),
        ('上门时间', 'TIMESTAMP', '上门时间'),
        ('是否报名', 'INTEGER DEFAULT 0', '是否报名：0-否，1-是'),
        ('报名时间', 'TIMESTAMP', '报名时间'),
        ('是否订座', 'INTEGER DEFAULT 0', '是否订座：0-否，1-是'),
        ('是否校园量', 'INTEGER DEFAULT 0', '是否校园量：0-否，1-是'),
        
        # 网络专员/渠道专员
        ('网络专员', 'VARCHAR(50)', '网络专员'),
        ('渠道专员', 'VARCHAR(50)', '渠道专员'),
        ('留量时间', 'VARCHAR(50)', '留量时间'),
        ('咨询结果', 'TEXT', '咨询结果'),
        
        # 上门情况统计相关
        ('代咨', 'VARCHAR(50)', '代咨'),
        ('网转上门', 'INTEGER DEFAULT 0', '网转上门'),
        ('网络新媒体', 'INTEGER DEFAULT 0', '网络新媒体'),
        ('口碑上门', 'INTEGER DEFAULT 0', '口碑上门'),
        ('渠道上门', 'INTEGER DEFAULT 0', '渠道上门'),
        ('校园新渠道', 'INTEGER DEFAULT 0', '校园新渠道'),
        ('新媒体来源', 'INTEGER DEFAULT 0', '新媒体来源'),
        ('就读学校', 'VARCHAR(100)', '就读学校'),
        ('目前状态', 'VARCHAR(50)', '目前状态'),
        ('地区', 'VARCHAR(50)', '地区'),
        ('县', 'VARCHAR(50)', '县'),
        ('报名专业', 'VARCHAR(100)', '报名专业'),
        ('咨询时间', 'VARCHAR(50)', '咨询时间'),
        
        # 已交学费
        ('已交学费', 'VARCHAR(50)', '已交学费金额'),
        
        # 报名相关新字段
        ('长期短期', 'VARCHAR(20)', '长期/短期'),
        ('课程', 'VARCHAR(100)', '课程'),
        ('全款', 'INTEGER DEFAULT 0', '全款金额'),
        ('分期', 'INTEGER DEFAULT 0', '分期金额'),
        ('注册', 'INTEGER DEFAULT 0', '注册金额'),
        ('贷款', 'INTEGER DEFAULT 0', '贷款金额'),
        ('详细地址', 'VARCHAR(200)', '详细地址'),
        
        # 订座相关新字段
        ('订座时间', 'TIMESTAMP', '订座时间'),
        ('订座金额', 'INTEGER DEFAULT 0', '订座金额'),
        
        # 缴费金额
        ('缴费金额', 'INTEGER DEFAULT 0', '缴费金额'),
        
        # 退费相关新字段
        ('是否退费', 'INTEGER DEFAULT 0', '是否退费：0-否，1-是（需先勾选报名或订座）'),
        ('退费原因', 'VARCHAR(200)', '退费原因'),
        ('退费金额', 'INTEGER DEFAULT 0', '退费金额'),
        
        # 交接相关字段
        ('是否已交接', 'INTEGER DEFAULT 0', '是否已交接给教质：0-否，1-是'),
        ('交接时间', 'TIMESTAMP', '交接时间'),
        ('交接人', 'VARCHAR(50)', '交接人'),
        
        # 录量人
        ('录量人', 'VARCHAR(50)', '录量人（当前登录用户的real_name）'),
    ]
    
    print("开始检查并添加缺失字段...\n")
    
    added_count = 0
    skipped_count = 0
    failed_count = 0
    
    with engine.connect() as conn:
        for column_name, column_type, comment in fields_to_add:
            try:
                # 检查字段是否存在
                check_sql = text("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_schema = 'consult' 
                      AND table_name = '咨询量明细表_v2' 
                      AND column_name = :column_name
                """)
                result = conn.execute(check_sql, {'column_name': column_name})
                exists = result.fetchone()
                
                if exists:
                    print(f"⊙ 字段 '{column_name}' 已存在，跳过")
                    skipped_count += 1
                    continue
                
                # 添加字段
                add_column_sql = f"""
                    ALTER TABLE consult."咨询量明细表_v2" 
                    ADD COLUMN "{column_name}" {column_type};
                """
                conn.execute(text(add_column_sql))
                
                # 添加注释
                comment_sql = f"""
                    COMMENT ON COLUMN consult."咨询量明细表_v2"."{column_name}" IS '{comment}';
                """
                conn.execute(text(comment_sql))
                
                conn.commit()
                print(f"✓ 成功添加字段: {column_name}")
                added_count += 1
                
            except Exception as e:
                print(f"✗ 添加字段 '{column_name}' 失败: {e}")
                failed_count += 1
                conn.rollback()
    
    print("\n" + "="*60)
    print(f"迁移完成！")
    print(f"  - 新增字段: {added_count}")
    print(f"  - 已存在字段: {skipped_count}")
    print(f"  - 失败字段: {failed_count}")
    print("="*60)

if __name__ == "__main__":
    run_migration()



















