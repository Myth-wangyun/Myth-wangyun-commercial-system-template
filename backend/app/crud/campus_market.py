"""
神殿感知的市场数据CRUD操作
根据用户选择的神殿操作对应的投放明细表
"""

from datetime import date, datetime
from decimal import Decimal
from typing import Optional, TypeAlias

from sqlalchemy import text
from sqlalchemy.orm import Session

from ..core.campus_database import campus_db_manager

SqlParamValue: TypeAlias = str | int | Decimal | date | None
MarketRecordValue: TypeAlias = str | int | Decimal | date | datetime | None


def _close_session(db: Session | None) -> None:
    if db is not None:
        db.close()


def _lastrowid(result: object) -> int | None:
    value = getattr(result, "lastrowid", None)
    return value if isinstance(value, int) else None


def _rowcount(result: object) -> int:
    value = getattr(result, "rowcount", 0)
    return value if isinstance(value, int) else 0


def 创建投放明细_神殿(
    campus: str,
    日期: date,
    媒体来源: str,
    关键词: Optional[str] = None,
    展现次数: int = 0,
    点击次数: int = 0,
    消费金额: Decimal = Decimal('0.00'),
    咨询次数: int = 0,
    转化次数: int = 0,
    备注: Optional[str] = None
) -> dict[str, MarketRecordValue] | None:
    """
    创建投放明细记录（按神殿分表）
    
    Args:
        campus: 神殿名称
        日期: 投放日期
        媒体来源: 媒体来源
        关键词: 关键词
        展现次数: 展现次数
        点击次数: 点击次数
        消费金额: 消费金额
        咨询次数: 咨询次数
        转化次数: 转化次数
        备注: 备注
    
    Returns:
        创建的投放明细记录
    """
    db: Session | None = None
    try:
        db = campus_db_manager.get_market_session(campus)
        table_name = campus_db_manager.get_campus_table_name("投放明细表", campus)
        
        # 构建插入SQL
        insert_sql = f"""
        INSERT INTO `{table_name}` (
            日期, 神殿, 媒体来源, 关键词, 展现次数, 点击次数, 消费金额,
            咨询次数, 转化次数, 备注
        ) VALUES (
            :日期, :神殿, :媒体来源, :关键词, :展现次数, :点击次数, :消费金额,
            :咨询次数, :转化次数, :备注
        )
        """
        
        result = db.execute(text(insert_sql), {
            '日期': 日期,
            '神殿': campus,
            '媒体来源': 媒体来源,
            '关键词': 关键词,
            '展现次数': 展现次数,
            '点击次数': 点击次数,
            '消费金额': 消费金额,
            '咨询次数': 咨询次数,
            '转化次数': 转化次数,
            '备注': 备注
        })
        
        db.commit()
        
        inserted_id = _lastrowid(result)
        if inserted_id is not None:
            select_sql = f"SELECT * FROM `{table_name}` WHERE 投放ID = :投放ID"
            record = db.execute(text(select_sql), {'投放ID': inserted_id}).fetchone()
        else:
            select_sql = f"SELECT * FROM `{table_name}` ORDER BY 投放ID DESC LIMIT 1"
            record = db.execute(text(select_sql)).fetchone()
        
        return dict(record._mapping) if record else None
    except Exception:
        if db is not None:
            db.rollback()
        raise
    finally:
        _close_session(db)

def 获取投放明细列表_神殿(
    campus: str,
    跳过: int = 0,
    限制: int = 100,
    日期_开始: Optional[date] = None,
    日期_结束: Optional[date] = None,
    媒体来源: Optional[str] = None
) -> list[dict[str, MarketRecordValue]]:
    """
    获取投放明细列表（按神殿分表）
    
    Args:
        campus: 神殿名称
        跳过: 跳过的记录数
        限制: 限制返回的记录数
        日期_开始: 开始日期筛选
        日期_结束: 结束日期筛选
        媒体来源: 媒体来源筛选
    
    Returns:
        投放明细列表
    """
    db: Session | None = None
    try:
        db = campus_db_manager.get_market_session(campus)
        table_name = campus_db_manager.get_campus_table_name("投放明细表", campus)
        
        # 构建查询SQL
        where_conditions = []
        params: dict[str, SqlParamValue] = {}
        
        if 日期_开始:
            where_conditions.append("日期 >= :日期_开始")
            params['日期_开始'] = 日期_开始
        
        if 日期_结束:
            where_conditions.append("日期 <= :日期_结束")
            params['日期_结束'] = 日期_结束
        
        if 媒体来源:
            where_conditions.append("媒体来源 LIKE :媒体来源")
            params['媒体来源'] = f"%{媒体来源}%"
        
        where_clause = " AND ".join(where_conditions) if where_conditions else "1=1"
        
        select_sql = f"""
        SELECT * FROM `{table_name}` 
        WHERE {where_clause}
        ORDER BY 日期 DESC, 投放ID DESC
        LIMIT :限制 OFFSET :跳过
        """
        
        params.update({'限制': 限制, '跳过': 跳过})
        
        result = db.execute(text(select_sql), params)
        records = result.fetchall()
        
        return [dict(record._mapping) for record in records]
    except Exception:
        if db is not None:
            db.rollback()
        raise
    finally:
        _close_session(db)

def 获取投放明细_神殿(
    campus: str,
    投放ID: int
) -> Optional[dict[str, MarketRecordValue]]:
    """
    根据ID获取投放明细（按神殿分表）
    
    Args:
        campus: 神殿名称
        投放ID: 投放ID
    
    Returns:
        投放明细记录
    """
    db: Session | None = None
    try:
        db = campus_db_manager.get_market_session(campus)
        table_name = campus_db_manager.get_campus_table_name("投放明细表", campus)
        
        select_sql = f"SELECT * FROM `{table_name}` WHERE 投放ID = :投放ID"
        result = db.execute(text(select_sql), {'投放ID': 投放ID})
        record = result.fetchone()
        
        return dict(record._mapping) if record else None
    except Exception:
        if db is not None:
            db.rollback()
        raise
    finally:
        _close_session(db)

def 更新投放明细_神殿(
    campus: str,
    投放ID: int,
    **kwargs
) -> Optional[dict[str, MarketRecordValue]]:
    """
    更新投放明细记录（按神殿分表）
    
    Args:
        campus: 神殿名称
        投放ID: 投放ID
        **kwargs: 要更新的字段
    
    Returns:
        更新后的投放明细记录
    """
    db: Session | None = None
    try:
        db = campus_db_manager.get_market_session(campus)
        table_name = campus_db_manager.get_campus_table_name("投放明细表", campus)
        
        # 构建更新SQL
        set_clauses = []
        params: dict[str, object] = {'投放ID': 投放ID}
        
        for key, value in kwargs.items():
            if value is not None:
                set_clauses.append(f"{key} = :{key}")
                params[key] = value
        
        if not set_clauses:
            return None
        
        update_sql = f"""
        UPDATE `{table_name}` 
        SET {', '.join(set_clauses)}
        WHERE 投放ID = :投放ID
        """
        
        result = db.execute(text(update_sql), params)
        db.commit()
        
        if _rowcount(result) > 0:
            # 获取更新后的记录
            select_sql = f"SELECT * FROM `{table_name}` WHERE 投放ID = :投放ID"
            record = db.execute(text(select_sql), {'投放ID': 投放ID}).fetchone()
            return dict(record._mapping) if record else None
        return None
    except Exception:
        if db is not None:
            db.rollback()
        raise
    finally:
        _close_session(db)

def 删除投放明细_神殿(
    campus: str,
    投放ID: int
) -> bool:
    """
    删除投放明细记录（按神殿分表）
    
    Args:
        campus: 神殿名称
        投放ID: 投放ID
    
    Returns:
        是否删除成功
    """
    db: Session | None = None
    try:
        db = campus_db_manager.get_market_session(campus)
        table_name = campus_db_manager.get_campus_table_name("投放明细表", campus)
        
        delete_sql = f"DELETE FROM `{table_name}` WHERE 投放ID = :投放ID"
        result = db.execute(text(delete_sql), {'投放ID': 投放ID})
        db.commit()
        
        return _rowcount(result) > 0
    except Exception:
        if db is not None:
            db.rollback()
        raise
    finally:
        _close_session(db)

def 获取投放统计_神殿(
    campus: str,
    日期_开始: Optional[date] = None,
    日期_结束: Optional[date] = None
) -> dict:
    """
    获取投放统计信息（按神殿分表）
    
    Args:
        campus: 神殿名称
        日期_开始: 开始日期
        日期_结束: 结束日期
    
    Returns:
        统计信息
    """
    db: Session | None = None
    try:
        db = campus_db_manager.get_market_session(campus)
        table_name = campus_db_manager.get_campus_table_name("投放明细表", campus)
        
        # 构建查询条件
        where_conditions = []
        params: dict[str, SqlParamValue] = {}
        
        if 日期_开始:
            where_conditions.append("日期 >= :日期_开始")
            params['日期_开始'] = 日期_开始
        
        if 日期_结束:
            where_conditions.append("日期 <= :日期_结束")
            params['日期_结束'] = 日期_结束
        
        where_clause = " AND ".join(where_conditions) if where_conditions else "1=1"
        
        stats_sql = f"""
        SELECT 
            COUNT(*) as 总记录数,
            SUM(展现次数) as 总展现次数,
            SUM(点击次数) as 总点击次数,
            SUM(消费金额) as 总消费金额,
            SUM(咨询次数) as 总咨询次数,
            SUM(转化次数) as 总转化次数,
            AVG(消费金额) as 平均消费金额,
            MAX(消费金额) as 最高消费金额,
            MIN(消费金额) as 最低消费金额
        FROM `{table_name}` 
        WHERE {where_clause}
        """
        
        result = db.execute(text(stats_sql), params)
        stats = result.fetchone()
        
        return dict(stats._mapping) if stats else {}
    except Exception:
        if db is not None:
            db.rollback()
        raise
    finally:
        _close_session(db)
