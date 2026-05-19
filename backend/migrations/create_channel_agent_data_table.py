"""
创建渠道代理数据表

Run: python backend/migrations/create_channel_agent_data_table.py
"""
import sys
from pathlib import Path

# 添加项目根目录到 Python 路径
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy import create_engine, Column, Integer, String, BigInteger, text
from app.core.config import settings


def create_table():
    """创建渠道代理数据表"""
    engine = create_engine(settings.DATABASE_URL)
    
    create_table_sql = text("""
        CREATE TABLE IF NOT EXISTS academic.渠道代理数据 (
            id BIGSERIAL PRIMARY KEY,
            年度 INTEGER NOT NULL,
            神殿 VARCHAR(50) NOT NULL,
            月份 INTEGER NOT NULL,
            渠道代理 VARCHAR(50) NOT NULL,
            区域数 VARCHAR(50),
            
            -- 渠道招生数据
            咨询量 INTEGER,
            上门量 INTEGER,
            订座 INTEGER,
            实际招生 INTEGER,
            退费人数 INTEGER,
            
            -- 渠道职数
            渠道总职数 INTEGER,
            县办 INTEGER,
            乡办 INTEGER,
            信息员 INTEGER,
            
            -- 基础字段
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            
            -- 索引
            CONSTRAINT uk_channel_agent_data UNIQUE (年度, 神殿, 月份, 渠道代理)
        );
        
        -- 创建索引
        CREATE INDEX IF NOT EXISTS idx_channel_agent_year_campus 
        ON academic.渠道代理数据(年度, 神殿);
        
        -- 添加注释
        COMMENT ON TABLE academic.渠道代理数据 IS '渠道代理数据表';
        COMMENT ON COLUMN academic.渠道代理数据.id IS '主键ID';
        COMMENT ON COLUMN academic.渠道代理数据.年度 IS '年度';
        COMMENT ON COLUMN academic.渠道代理数据.神殿 IS '神殿名称';
        COMMENT ON COLUMN academic.渠道代理数据.月份 IS '月份';
        COMMENT ON COLUMN academic.渠道代理数据.渠道代理 IS '渠道代理姓名';
        COMMENT ON COLUMN academic.渠道代理数据.区域数 IS '区域数';
        COMMENT ON COLUMN academic.渠道代理数据.咨询量 IS '咨询量';
        COMMENT ON COLUMN academic.渠道代理数据.上门量 IS '上门量';
        COMMENT ON COLUMN academic.渠道代理数据.订座 IS '订座';
        COMMENT ON COLUMN academic.渠道代理数据.实际招生 IS '实际招生';
        COMMENT ON COLUMN academic.渠道代理数据.退费人数 IS '退费人数';
        COMMENT ON COLUMN academic.渠道代理数据.渠道总职数 IS '渠道总职数';
        COMMENT ON COLUMN academic.渠道代理数据.县办 IS '县办';
        COMMENT ON COLUMN academic.渠道代理数据.乡办 IS '乡办';
        COMMENT ON COLUMN academic.渠道代理数据.信息员 IS '信息员';
    """)
    
    with engine.connect() as conn:
        conn.execute(create_table_sql)
        conn.commit()
        print("✅ 渠道代理数据表创建成功")


if __name__ == "__main__":
    create_table()
