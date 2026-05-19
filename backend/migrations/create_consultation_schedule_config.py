"""
数据库迁移脚本：创建咨询量计算时段配置表
在 config schema 下创建 consultation_schedule_config 表
"""

import asyncio
import sys
import os

# 添加项目根目录到 Python 路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from sqlalchemy import text
from app.core.database import engine


def create_schedule_config_table():
    """创建咨询量计算时段配置表"""
    
    sql = """
    -- 确保 config schema 存在
    CREATE SCHEMA IF NOT EXISTS config;
    
    -- 创建咨询量计算时段配置表
    CREATE TABLE IF NOT EXISTS config.consultation_schedule_config (
        id SERIAL PRIMARY KEY,
        period_name VARCHAR(50) NOT NULL,
        period_start DATE NOT NULL,
        period_end DATE NOT NULL,
        cutoff_hour INTEGER NOT NULL CHECK (cutoff_hour >= 0 AND cutoff_hour <= 23),
        cutoff_minute INTEGER NOT NULL DEFAULT 0 CHECK (cutoff_minute >= 0 AND cutoff_minute <= 59),
        description VARCHAR(500),
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    
    -- 创建索引
    CREATE INDEX IF NOT EXISTS idx_schedule_period 
        ON config.consultation_schedule_config (period_start, period_end);
    
    -- 添加注释
    COMMENT ON TABLE config.consultation_schedule_config IS '咨询量计算时段配置表';
    COMMENT ON COLUMN config.consultation_schedule_config.period_name IS '时段名称（冬季/夏季）';
    COMMENT ON COLUMN config.consultation_schedule_config.period_start IS '时段开始日期（含）';
    COMMENT ON COLUMN config.consultation_schedule_config.period_end IS '时段结束日期（含）';
    COMMENT ON COLUMN config.consultation_schedule_config.cutoff_hour IS '截止小时（24小时制）';
    COMMENT ON COLUMN config.consultation_schedule_config.cutoff_minute IS '截止分钟';
    COMMENT ON COLUMN config.consultation_schedule_config.is_active IS '是否启用';
    """
    
    with engine.connect() as conn:
        for statement in sql.split(';'):
            statement = statement.strip()
            if statement:
                try:
                    conn.execute(text(statement))
                except Exception as e:
                    print(f"Warning: {e}")
        conn.commit()
    
    print("✅ 咨询量计算时段配置表创建完成")


def insert_default_configs():
    """插入默认配置（2025年和2026年）"""
    
    sql = """
    -- 检查是否已有数据
    DO $$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM config.consultation_schedule_config LIMIT 1) THEN
            -- 2025年配置
            INSERT INTO config.consultation_schedule_config 
                (period_name, period_start, period_end, cutoff_hour, cutoff_minute, description, is_active)
            VALUES
                ('冬季', '2025-01-01', '2025-04-30', 17, 30, '2025年冬季作息时间（1月-4月）', true),
                ('夏季', '2025-05-01', '2025-09-30', 18, 0, '2025年夏季作息时间（5月-9月）', true),
                ('冬季', '2025-10-01', '2025-12-31', 17, 30, '2025年冬季作息时间（10月-12月）', true),
                -- 2026年配置
                ('冬季', '2026-01-01', '2026-04-30', 17, 30, '2026年冬季作息时间（1月-4月）', true),
                ('夏季', '2026-05-01', '2026-09-30', 18, 0, '2026年夏季作息时间（5月-9月）', true),
                ('冬季', '2026-10-01', '2026-12-31', 17, 30, '2026年冬季作息时间（10月-12月）', true);
            
            RAISE NOTICE '已插入 2025-2026 年默认配置';
        ELSE
            RAISE NOTICE '已存在配置数据，跳过默认插入';
        END IF;
    END $$;
    """
    
    with engine.connect() as conn:
        conn.execute(text(sql))
        conn.commit()
    
    print("✅ 默认配置数据插入完成")


if __name__ == '__main__':
    print("=" * 50)
    print("咨询量计算时段配置表迁移")
    print("=" * 50)
    
    create_schedule_config_table()
    insert_default_configs()
    
    print("\n迁移完成！")
