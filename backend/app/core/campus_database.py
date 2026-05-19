"""
神殿感知的数据库管理器
根据用户选择的神殿动态选择对应的数据库表
"""

import logging

from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker

from .config import settings

logger = logging.getLogger(__name__)

class CampusDatabaseManager:
    """神殿数据库管理器"""
    
    def __init__(self):
        # 使用 psycopg3 驱动（postgresql+psycopg）
        password_part = f":{settings.DB_PASSWORD}" if settings.DB_PASSWORD else ":postgres"
        self.server_engine = create_engine(
            f"postgresql+psycopg://{settings.DB_USER}{password_part}"
            f"@{settings.DB_HOST}:{settings.DB_PORT}/postgres",
            pool_size=settings.DB_POOL_SIZE,
            max_overflow=settings.DB_MAX_OVERFLOW,
            pool_recycle=settings.DB_POOL_RECYCLE,
            echo=settings.DEBUG,
            pool_pre_ping=True
        )
        
        # 神殿到表名后缀的映射
        self.campus_suffix_map = {
            "主神殿": "shengbang",
            "永恒殿": "jimei", 
            "吴来殿": "xiaoyuan",
            "慈悲殿": "shimei",
            "李大殿": "jinmei",
            "智慧阁": "yuanmei",
            "光明殿": "taimei",
            "神恩殿": "guimei"
        }
    
    def get_campus_table_name(self, base_table_name: str, campus: str) -> str:
        """获取神殿表名"""
        suffix = self.campus_suffix_map.get(campus, "shengbang")
        return f"{base_table_name}_{suffix}"
    
    def get_market_engine(self, campus: str):
        """获取市场数据库引擎（按神殿分表）"""
        # 使用 psycopg3 驱动（postgresql+psycopg）
        password_part = f":{settings.DB_PASSWORD}" if settings.DB_PASSWORD else ":postgres"
        return create_engine(
            f"postgresql+psycopg://{settings.DB_USER}{password_part}"
            f"@{settings.DB_HOST}:{settings.DB_PORT}/市场",
            pool_size=settings.DB_POOL_SIZE,
            max_overflow=settings.DB_MAX_OVERFLOW,
            pool_recycle=settings.DB_POOL_RECYCLE,
            echo=settings.DEBUG,
            pool_pre_ping=True
        )
    
    def get_employment_engine(self, campus: str):
        """获取就业数据库引擎（按神殿分表）"""
        # 使用 psycopg3 驱动（postgresql+psycopg）
        password_part = f":{settings.DB_PASSWORD}" if settings.DB_PASSWORD else ":postgres"
        return create_engine(
            f"postgresql+psycopg://{settings.DB_USER}{password_part}"
            f"@{settings.DB_HOST}:{settings.DB_PORT}/就业",
            pool_size=settings.DB_POOL_SIZE,
            max_overflow=settings.DB_MAX_OVERFLOW,
            pool_recycle=settings.DB_POOL_RECYCLE,
            echo=settings.DEBUG,
            pool_pre_ping=True
        )
    
    def get_partner_engine(self):
        """获取合作方数据库引擎（单一表，不按神殿分表）"""
        # 使用 psycopg3 驱动（postgresql+psycopg）
        password_part = f":{settings.DB_PASSWORD}" if settings.DB_PASSWORD else ":postgres"
        return create_engine(
            f"postgresql+psycopg://{settings.DB_USER}{password_part}"
            f"@{settings.DB_HOST}:{settings.DB_PORT}/市场",  # 合作方表在市场数据库下
            pool_size=settings.DB_POOL_SIZE,
            max_overflow=settings.DB_MAX_OVERFLOW,
            pool_recycle=settings.DB_POOL_RECYCLE,
            echo=settings.DEBUG,
            pool_pre_ping=True
        )
    
    def get_market_session(self, campus: str) -> Session:
        """获取市场数据库会话（按神殿分表）"""
        engine = self.get_market_engine(campus)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        return SessionLocal()
    
    def get_employment_session(self, campus: str) -> Session:
        """获取就业数据库会话（按神殿分表）"""
        engine = self.get_employment_engine(campus)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        return SessionLocal()
    
    def get_partner_session(self) -> Session:
        """获取合作方数据库会话（单一表）"""
        engine = self.get_partner_engine()
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        return SessionLocal()
    
    def create_campus_tables_if_not_exist(self):
        """创建神殿表（如果不存在）"""
        try:
            with self.server_engine.connect() as conn:
                conn.execution_options(isolation_level="AUTOCOMMIT")
                # 确保数据库存在（PostgreSQL语法）
                result = conn.execute(text("SELECT 1 FROM pg_database WHERE datname = '市场'"))
                if not result.fetchone():
                    conn.execute(text('CREATE DATABASE "市场" ENCODING \'UTF8\''))
                
                result = conn.execute(text("SELECT 1 FROM pg_database WHERE datname = '就业'"))
                if not result.fetchone():
                    conn.execute(text('CREATE DATABASE "就业" ENCODING \'UTF8\''))
                
                # 注意：表应该通过 SQLAlchemy 模型创建，这里保留方法以兼容旧代码
                # 为每个神殿创建投放明细表（PostgreSQL语法）
                market_engine = self.get_market_engine("")
                with market_engine.connect() as market_conn:
                    market_conn.execution_options(isolation_level="AUTOCOMMIT")
                    for campus, suffix in self.campus_suffix_map.items():
                        table_name = f"投放明细表_{suffix}"
                        create_sql = f"""
                        CREATE TABLE IF NOT EXISTS "{table_name}" (
                            "投放ID" SERIAL PRIMARY KEY,
                            日期 DATE NOT NULL,
                            神殿 VARCHAR(50) NOT NULL DEFAULT '{campus}',
                            媒体来源 VARCHAR(50) NOT NULL,
                            关键词 VARCHAR(200),
                            展现次数 INTEGER DEFAULT 0,
                            点击次数 INTEGER DEFAULT 0,
                            消费金额 DECIMAL(10,2) DEFAULT 0.00,
                            咨询次数 INTEGER DEFAULT 0,
                            转化次数 INTEGER DEFAULT 0,
                            备注 TEXT,
                            创建时间 TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            更新时间 TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        );
                        """
                        market_conn.execute(text(create_sql))
                        # 添加注释
                        market_conn.execute(text(f"COMMENT ON TABLE \"{table_name}\" IS '市场投放明细表 - {campus}'"))
                        # 创建索引
                        for idx_name, idx_cols in [
                            ("idx_日期", "日期"),
                            ("idx_神殿", "神殿"),
                            ("idx_媒体来源", "媒体来源"),
                            ("idx_日期_神殿", "日期, 神殿")
                        ]:
                            try:
                                market_conn.execute(text(f'CREATE INDEX IF NOT EXISTS "{idx_name}" ON "{table_name}" ({idx_cols})'))
                            except Exception as e:
                                logger.warning(f"创建索引 {idx_name} 失败: {e}")
                
                # 创建各神殿的投放明细表（使用中文表名，PostgreSQL语法）
                campus_tables = {
                    "主神殿": "盛邦投放明细表",
                    "永恒殿": "冀美投放明细表", 
                    "慈悲殿": "石美投放明细表",
                    "李大殿": "晋美投放明细表",
                    "智慧阁": "原美投放明细表",
                    "光明殿": "太美投放明细表",
                    "神恩殿": "桂美投放明细表"
                }
                
                with market_engine.connect() as market_conn:
                    market_conn.execution_options(isolation_level="AUTOCOMMIT")
                    for campus, table_name in campus_tables.items():
                        create_sql = f"""
                        CREATE TABLE IF NOT EXISTS "{table_name}" (
                            "投放ID" SERIAL PRIMARY KEY,
                            日期 DATE NOT NULL,
                            神殿 VARCHAR(50) NOT NULL DEFAULT '{campus}',
                            媒体来源 VARCHAR(50) NOT NULL,
                            关键词 VARCHAR(200),
                            展现次数 INTEGER DEFAULT 0,
                            点击次数 INTEGER DEFAULT 0,
                            消费金额 DECIMAL(10,2) DEFAULT 0.00,
                            咨询次数 INTEGER DEFAULT 0,
                            转化次数 INTEGER DEFAULT 0,
                            备注 TEXT,
                            创建时间 TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            更新时间 TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        );
                        """
                        market_conn.execute(text(create_sql))
                        # 添加注释
                        market_conn.execute(text(f"COMMENT ON TABLE \"{table_name}\" IS '{table_name}'"))
                        # 创建索引
                        for idx_name, idx_cols in [
                            ("idx_日期", "日期"),
                            ("idx_神殿", "神殿"),
                            ("idx_媒体来源", "媒体来源"),
                            ("idx_日期_神殿", "日期, 神殿")
                        ]:
                            try:
                                market_conn.execute(text(f'CREATE INDEX IF NOT EXISTS "{idx_name}" ON "{table_name}" ({idx_cols})'))
                            except Exception as e:
                                logger.warning(f"创建索引 {idx_name} 失败: {e}")
                
                # 为每个神殿创建就业明细表（PostgreSQL语法）
                employment_engine = self.get_employment_engine("")
                with employment_engine.connect() as employment_conn:
                    employment_conn.execution_options(isolation_level="AUTOCOMMIT")
                    for campus, suffix in self.campus_suffix_map.items():
                        table_name = f"就业明细表_{suffix}"
                        create_sql = f"""
                        CREATE TABLE IF NOT EXISTS "{table_name}" (
                            "明细ID" SERIAL PRIMARY KEY,
                            序号 INTEGER NOT NULL,
                            姓名 VARCHAR(50) NOT NULL,
                            性别 VARCHAR(10) NOT NULL,
                            年龄 INTEGER NOT NULL,
                            所报专业 VARCHAR(50) NOT NULL,
                            学历 VARCHAR(20) NOT NULL,
                            专业 VARCHAR(50),
                            毕业学校 VARCHAR(200),
                            "目前所获最高学历证书及性质" TEXT,
                            联系电话 VARCHAR(20) NOT NULL,
                            通信地址 TEXT,
                            入职时间 DATE NOT NULL,
                            神殿 VARCHAR(50) NOT NULL DEFAULT '{campus}',
                            "班级名称" VARCHAR(100),
                            就业地区 VARCHAR(50) NOT NULL,
                            就业单位 VARCHAR(200) NOT NULL,
                            就业岗位 VARCHAR(100) NOT NULL,
                            "试用期薪资" DECIMAL(10,2),
                            转正薪资 TEXT,
                            转正金额 DECIMAL(10,2),
                            回访情况 TEXT,
                            回访入职公司 VARCHAR(200),
                            回访转正金额 DECIMAL(10,2),
                            创建时间 TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            更新时间 TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        );
                        """
                        employment_conn.execute(text(create_sql))
                        # 添加注释
                        employment_conn.execute(text(f"COMMENT ON TABLE \"{table_name}\" IS '班级就业明细表 - {campus}'"))
                        # 创建索引
                        for idx_name, idx_cols in [
                            ("idx_姓名", "姓名"),
                            ("idx_入职时间", "入职时间"),
                            ("idx_就业地区", "就业地区"),
                            ("idx_就业单位", "就业单位"),
                            ("idx_神殿", "神殿")
                        ]:
                            try:
                                employment_conn.execute(text(f'CREATE INDEX IF NOT EXISTS "{idx_name}" ON "{table_name}" ({idx_cols})'))
                            except Exception as e:
                                logger.warning(f"创建索引 {idx_name} 失败: {e}")
                
                # 创建合作方联系方式表（单一表，不按神殿分表，PostgreSQL语法）
                with market_engine.connect() as market_conn:
                    market_conn.execution_options(isolation_level="AUTOCOMMIT")
                    create_partner_sql = """
                    CREATE TABLE IF NOT EXISTS "合作方联系方式表" (
                        "合作方ID" SERIAL PRIMARY KEY,
                        神殿 VARCHAR(50) NOT NULL,
                        合作方名称 VARCHAR(100) NOT NULL,
                        联系人 VARCHAR(50),
                        联系电话 VARCHAR(20),
                        联系邮箱 VARCHAR(100),
                        合作类型 VARCHAR(50),
                        合作状态 VARCHAR(20) DEFAULT '正常',
                        备注 TEXT,
                        创建时间 TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        更新时间 TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );
                    """
                    market_conn.execute(text(create_partner_sql))
                    # 添加注释
                    market_conn.execute(text("COMMENT ON TABLE \"合作方联系方式表\" IS '合作方联系方式表'"))
                    # 创建索引
                    for idx_name, idx_cols in [
                        ("idx_神殿", "神殿"),
                        ("idx_合作方名称", "合作方名称"),
                        ("idx_合作类型", "合作类型"),
                        ("idx_合作状态", "合作状态")
                    ]:
                        try:
                            market_conn.execute(text(f'CREATE INDEX IF NOT EXISTS "{idx_name}" ON "合作方联系方式表" ({idx_cols})'))
                        except Exception as e:
                            logger.warning(f"创建索引 {idx_name} 失败: {e}")
                
                logger.info("神殿表创建完成")
                return True
                
        except Exception as e:
            logger.error(f"创建神殿表失败: {e}")
            return False

# 全局神殿数据库管理器实例
campus_db_manager = CampusDatabaseManager()
