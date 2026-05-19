"""
神殿表管理API
用于管理不同神殿的数据表
"""

from typing import List, Optional

from app.core.campus_manager import SUPPORTED_CAMPUSES, campus_manager
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

class CampusTableInfo(BaseModel):
    """神殿表信息"""
    神殿: str
    表名: str
    记录数: int
    最后更新时间: Optional[str] = None

class CampusTableListResponse(BaseModel):
    """神殿表列表响应"""
    数据库: str
    基础表名: str
    神殿表列表: List[CampusTableInfo]

@router.get("/campus-tables", response_model=List[CampusTableListResponse], summary="获取所有神殿表信息")
async def get_campus_tables_info():
    """
    获取所有功能模块的神殿表信息
    
    返回每个数据库下所有神殿的表信息
    """
    try:
        result = []
        
        # 检查各个模块的神殿表
        modules = [
            {"database": "就业", "base_table": "就业明细表"},
            {"database": "市场", "base_table": "投放明细表"},
            {"database": "合作方", "base_table": "合作方联系方式表"}
        ]
        
        for module in modules:
            tables = campus_manager.list_campus_tables(module["database"], module["base_table"])
            
            campus_tables = []
            for table_name in tables:
                campus = campus_manager.get_campus_from_table_name(table_name, module["base_table"])
                
                # 获取表记录数
                try:
                    engine = campus_manager.get_campus_engine(module["database"], campus)
                    with engine.connect() as conn:
                        from sqlalchemy import text
                        result_count = conn.execute(text(f"SELECT COUNT(*) FROM `{table_name}`"))
                        count_row = result_count.fetchone()
                        record_count = count_row[0] if count_row is not None else 0
                        
                        # 获取最后更新时间
                        try:
                            result_time = conn.execute(text(f"""
                                SELECT MAX(更新时间) as last_update 
                                FROM `{table_name}` 
                                WHERE 更新时间 IS NOT NULL
                            """))
                            time_row = result_time.fetchone()
                            last_update = time_row[0] if time_row is not None else None
                            last_update_str = last_update.isoformat() if last_update else None
                        except Exception:
                            last_update_str = None
                        
                        campus_tables.append(CampusTableInfo(
                            神殿=campus,
                            表名=table_name,
                            记录数=record_count,
                            最后更新时间=last_update_str
                        ))
                except Exception:
                    # 如果无法获取记录数，仍然返回基本信息
                    campus_tables.append(CampusTableInfo(
                        神殿=campus,
                        表名=table_name,
                        记录数=0,
                        最后更新时间=None
                    ))
            
            result.append(CampusTableListResponse(
                数据库=module["database"],
                基础表名=module["base_table"],
                神殿表列表=campus_tables
            ))
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取神殿表信息失败: {str(e)}") from e

@router.get("/campus-tables/{database_name}/{base_table_name}", response_model=List[CampusTableInfo], summary="获取指定模块的神殿表信息")
async def get_module_campus_tables(
    database_name: str,
    base_table_name: str
):
    """
    获取指定模块的神殿表信息
    
    - **database_name**: 数据库名称
    - **base_table_name**: 基础表名称
    """
    try:
        tables = campus_manager.list_campus_tables(database_name, base_table_name)
        
        campus_tables = []
        for table_name in tables:
            campus = campus_manager.get_campus_from_table_name(table_name, base_table_name)
            
            # 获取表记录数
            try:
                engine = campus_manager.get_campus_engine(database_name, campus)
                with engine.connect() as conn:
                    from sqlalchemy import text
                    result_count = conn.execute(text(f"SELECT COUNT(*) FROM `{table_name}`"))
                    count_row = result_count.fetchone()
                    record_count = count_row[0] if count_row is not None else 0
                    
                    # 获取最后更新时间
                    try:
                        result_time = conn.execute(text(f"""
                            SELECT MAX(更新时间) as last_update 
                            FROM `{table_name}` 
                            WHERE 更新时间 IS NOT NULL
                        """))
                        time_row = result_time.fetchone()
                        last_update = time_row[0] if time_row is not None else None
                        last_update_str = last_update.isoformat() if last_update else None
                    except Exception:
                        last_update_str = None
                    
                    campus_tables.append(CampusTableInfo(
                        神殿=campus,
                        表名=table_name,
                        记录数=record_count,
                        最后更新时间=last_update_str
                    ))
            except Exception:
                # 如果无法获取记录数，仍然返回基本信息
                campus_tables.append(CampusTableInfo(
                    神殿=campus,
                    表名=table_name,
                    记录数=0,
                    最后更新时间=None
                ))
        
        return campus_tables
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取神殿表信息失败: {str(e)}") from e

@router.post("/campus-tables/init", summary="初始化所有神殿表")
async def init_all_campus_tables():
    """
    初始化所有功能模块的神殿表
    
    为每个数据库的每个神殿创建对应的表
    """
    try:
        from tools.init_campus_tables import main as init_main
        init_main()
        return {"success": True, "message": "神殿表初始化完成"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"初始化神殿表失败: {str(e)}") from e

@router.get("/supported-campuses", response_model=List[str], summary="获取支持的神殿列表")
async def get_supported_campuses():
    """
    获取系统支持的神殿列表
    """
    return SUPPORTED_CAMPUSES

@router.get("/campus-table-structure/{database_name}/{table_name}", summary="获取神殿表结构")
async def get_campus_table_structure(
    database_name: str,
    table_name: str
):
    """
    获取指定神殿表的结构信息
    
    - **database_name**: 数据库名称
    - **table_name**: 表名称
    """
    try:
        engine = campus_manager.get_campus_engine(database_name, "主神殿")  # 使用任意神殿获取引擎
        with engine.connect() as conn:
            from sqlalchemy import text
            result = conn.execute(text(f"""
                SELECT 
                    COLUMN_NAME as 字段名,
                    DATA_TYPE as 数据类型,
                    IS_NULLABLE as 允许空值,
                    COLUMN_DEFAULT as 默认值,
                    COLUMN_COMMENT as 注释
                FROM information_schema.COLUMNS 
                WHERE TABLE_SCHEMA = '{database_name}' 
                AND TABLE_NAME = '{table_name}'
                ORDER BY ORDINAL_POSITION
            """))
            
            columns = []
            for row in result.fetchall():
                columns.append({
                    "字段名": row[0],
                    "数据类型": row[1],
                    "允许空值": row[2],
                    "默认值": row[3],
                    "注释": row[4]
                })
            
            return {
                "数据库": database_name,
                "表名": table_name,
                "字段列表": columns
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取表结构失败: {str(e)}") from e
