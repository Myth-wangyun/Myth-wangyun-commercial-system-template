"""
神殿管理模块
用于管理不同神殿的数据库表结构
"""

import logging
from typing import Any, Dict, List

from sqlalchemy import create_engine, text

from app.core.config import settings

logger = logging.getLogger(__name__)

# 支持的神殿列表
SUPPORTED_CAMPUSES = [
    "主神殿",
    "永恒殿", 
    "吴来殿",
    "李大殿",
    "智慧阁",
    "光明殿",
    "神恩殿"
]

class CampusManager:
    """神殿管理器"""
    
    def __init__(self):
        # 使用 psycopg3 驱动（postgresql+psycopg）
        # 如果密码为空，使用默认密码 "postgres"（仅用于开发环境）
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
    
    def get_campus_table_name(self, base_table_name: str, campus: str) -> str:
        """获取神殿表名"""
        # 将神殿名转换为安全的表名
        safe_campus = campus.replace("神殿", "").replace("美", "mei").replace("邦", "bang").replace("园", "yuan")
        return f"{base_table_name}_{safe_campus}"
    
    def create_campus_tables_for_database(self, database_name: str, table_definition: Dict[str, Any]) -> bool:
        """为指定数据库创建所有神殿的表"""
        try:
            with self.server_engine.connect() as conn:
                conn.execution_options(isolation_level="AUTOCOMMIT")
                # 确保数据库存在（PostgreSQL语法）
                result = conn.execute(text(f"SELECT 1 FROM pg_database WHERE datname = '{database_name}'"))
                if not result.fetchone():
                    conn.execute(text(f'CREATE DATABASE "{database_name}" ENCODING \'UTF8\''))
                
                # 为每个神殿创建表
                for campus in SUPPORTED_CAMPUSES:
                    table_name = self.get_campus_table_name(table_definition['base_name'], campus)
                    self._create_campus_table(conn, database_name, table_name, table_definition)
                
                logger.info(f"成功为数据库 {database_name} 创建了所有神殿表")
                return True
                
        except Exception as e:
            logger.error(f"为数据库 {database_name} 创建神殿表失败: {e}")
            return False
    
    def _create_campus_table(self, conn, database_name: str, table_name: str, table_definition: Dict[str, Any]):
        """创建单个神殿表"""
        try:
            # PostgreSQL 不能在一个连接中切换数据库，需要创建新连接
            # 使用 psycopg3 驱动（postgresql+psycopg）
            password_part = f":{settings.DB_PASSWORD}" if settings.DB_PASSWORD else ":postgres"
            db_engine = create_engine(
                f"postgresql+psycopg://{settings.DB_USER}{password_part}"
                f"@{settings.DB_HOST}:{settings.DB_PORT}/{database_name}",
                pool_size=settings.DB_POOL_SIZE,
                max_overflow=settings.DB_MAX_OVERFLOW,
                pool_recycle=settings.DB_POOL_RECYCLE,
                echo=settings.DEBUG,
                pool_pre_ping=True
            )
            
            with db_engine.connect() as db_conn:
                db_conn.execution_options(isolation_level="AUTOCOMMIT")
                
                # 构建CREATE TABLE语句（PostgreSQL语法）
                create_sql = f"""
                CREATE TABLE IF NOT EXISTS "{table_name}" (
                    {table_definition['columns']}
                );
                """
                
                db_conn.execute(text(create_sql))
                
                # 添加表注释
                if 'comment' in table_definition:
                    db_conn.execute(text(f"COMMENT ON TABLE \"{table_name}\" IS '{table_definition['comment']}'"))
                
                # 创建索引
                if 'indexes' in table_definition:
                    for index in table_definition['indexes']:
                        try:
                            db_conn.execute(text(f'CREATE INDEX IF NOT EXISTS "{index["name"]}" ON "{table_name}" ({index["columns"]})'))
                        except Exception as e:
                            logger.warning(f"创建索引 {index['name']} 失败: {e}")
            
            logger.info(f"成功创建表 {database_name}.{table_name}")
            
        except Exception as e:
            logger.error(f"创建表 {database_name}.{table_name} 失败: {e}")
            raise
    
    def get_campus_engine(self, database_name: str, campus: str):
        """获取指定神殿数据库的引擎"""
        # 使用 psycopg3 驱动（postgresql+psycopg）
        password_part = f":{settings.DB_PASSWORD}" if settings.DB_PASSWORD else ":postgres"
        return create_engine(
            f"postgresql+psycopg://{settings.DB_USER}{password_part}"
            f"@{settings.DB_HOST}:{settings.DB_PORT}/{database_name}",
            pool_size=settings.DB_POOL_SIZE,
            max_overflow=settings.DB_MAX_OVERFLOW,
            pool_recycle=settings.DB_POOL_RECYCLE,
            echo=settings.DEBUG,
            pool_pre_ping=True
        )
    
    def get_campus_table_class(self, base_model_class, campus: str):
        """为指定神殿创建表模型类"""
        table_name = self.get_campus_table_name(base_model_class.__tablename__, campus)
        
        # 创建新的模型类
        class CampusModel(base_model_class):
            __tablename__ = table_name
            __table_args__ = base_model_class.__table_args__
        
        return CampusModel
    
    def list_campus_tables(self, database_name: str, base_table_name: str) -> List[str]:
        """列出指定基础表的所有神殿表"""
        try:
            with self.server_engine.connect() as conn:
                result = conn.execute(text(f"""
                    SELECT table_name 
                    FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_catalog = '{database_name}'
                    AND table_name LIKE '{base_table_name}_%'
                    ORDER BY table_name
                """))
                return [row[0] for row in result.fetchall()]
        except Exception as e:
            logger.error(f"列出神殿表失败: {e}")
            return []
    
    def get_campus_from_table_name(self, table_name: str, base_table_name: str) -> str:
        """从表名中提取神殿名"""
        if table_name.startswith(f"{base_table_name}_"):
            suffix = table_name[len(f"{base_table_name}_"):]
            # 反向映射
            campus_mapping = {
                "shengbang": "主神殿",
                "jimei": "永恒殿",
                "xiaoyuan": "吴来殿", 
                "jinmei": "李大殿",
                "yuanmei": "智慧阁",
                "taimei": "光明殿",
                "guimei": "神恩殿"
            }
            return campus_mapping.get(suffix, "未知神殿")
        return "未知神殿"

# 全局神殿管理器实例
campus_manager = CampusManager()
