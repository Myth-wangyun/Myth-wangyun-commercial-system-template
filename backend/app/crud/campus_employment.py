"""
神殿感知的就业数据CRUD操作
根据用户选择的神殿操作对应的就业明细表
"""

from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional, TypeAlias

from sqlalchemy import text
from sqlalchemy.orm import Session

from ..core.campus_database import campus_db_manager

SqlParamValue: TypeAlias = str | int | Decimal | date | datetime | None
EmploymentRecordValue: TypeAlias = str | int | Decimal | date | datetime | None


def _close_session(db: Session | None) -> None:
    if db is not None:
        db.close()


def _lastrowid(result: object) -> int | None:
    value = getattr(result, "lastrowid", None)
    return value if isinstance(value, int) else None


def _rowcount(result: object) -> int:
    value = getattr(result, "rowcount", 0)
    return value if isinstance(value, int) else 0


def 创建就业明细_神殿(
    campus: str,
    序号: int,
    姓名: str,
    性别: str,
    年龄: int,
    所报专业: str,
    学历: str,
    联系电话: str,
    入职时间: date,
    就业地区: str,
    就业单位: str,
    就业岗位: str,
    转正薪资: Optional[str] = None,
    转正金额: Optional[Decimal] = None,
    回访情况: Optional[str] = None,
    回访入职公司: Optional[str] = None,
    回访转正金额: Optional[Decimal] = None,
    专业: Optional[str] = None,
    毕业学校: Optional[str] = None,
    目前所获最高学历证书及性质: Optional[str] = None,
    通信地址: Optional[str] = None,
    试用期薪资: Optional[Decimal] = None,
    班级名称: Optional[str] = None
) -> dict[str, EmploymentRecordValue] | None:
    """
    创建就业明细记录（按神殿分表）
    
    Args:
        campus: 神殿名称
        序号: 序号
        姓名: 姓名
        性别: 性别
        年龄: 年龄
        所报专业: 所报专业
        学历: 学历
        联系电话: 联系电话
        入职时间: 入职时间
        就业地区: 就业地区
        就业单位: 就业单位
        就业岗位: 就业岗位
        转正薪资: 转正薪资详情
        转正金额: 转正金额
        回访情况: 回访情况
        回访入职公司: 回访入职公司
        回访转正金额: 回访转正金额
    
    Returns:
        创建的就业明细记录
    """
    db: Session | None = None
    try:
        db = campus_db_manager.get_employment_session(campus)
        table_name = campus_db_manager.get_campus_table_name("就业明细表", campus)
        
        # 构建插入SQL（PostgreSQL使用双引号，不是反引号）
        insert_sql = f"""
        INSERT INTO "{table_name}" (
            序号, 姓名, 性别, 年龄, 所报专业, 学历, 专业, 毕业学校, 目前所获最高学历证书及性质,
            联系电话, 通信地址, 入职时间, 神殿, 班级名称,
            就业地区, 就业单位, 就业岗位, 试用期薪资, 转正薪资, 转正金额, 回访情况, 
            回访入职公司, 回访转正金额
        ) VALUES (
            :序号, :姓名, :性别, :年龄, :所报专业, :学历, :专业, :毕业学校, :目前所获最高学历证书及性质,
            :联系电话, :通信地址, :入职时间, :神殿, :班级名称,
            :就业地区, :就业单位, :就业岗位, :试用期薪资, :转正薪资, :转正金额, :回访情况,
            :回访入职公司, :回访转正金额
        )
        """
        
        result = db.execute(text(insert_sql), {
            '序号': 序号,
            '姓名': 姓名,
            '性别': 性别,
            '年龄': 年龄,
            '所报专业': 所报专业,
            '学历': 学历,
            '专业': 专业,
            '毕业学校': 毕业学校,
            '目前所获最高学历证书及性质': 目前所获最高学历证书及性质,
            '联系电话': 联系电话,
            '通信地址': 通信地址,
            '入职时间': 入职时间,
            '神殿': campus,
            '班级名称': 班级名称,
            '就业地区': 就业地区,
            '就业单位': 就业单位,
            '就业岗位': 就业岗位,
            '试用期薪资': 试用期薪资,
            '转正薪资': 转正薪资,
            '转正金额': 转正金额,
            '回访情况': 回访情况,
            '回访入职公司': 回访入职公司,
            '回访转正金额': 回访转正金额
        })
        
        db.commit()
        
        inserted_id = _lastrowid(result)
        if inserted_id is not None:
            select_sql = f'SELECT * FROM "{table_name}" WHERE "明细ID" = :明细ID'
            record = db.execute(text(select_sql), {'明细ID': inserted_id}).fetchone()
        else:
            select_sql = f'SELECT * FROM "{table_name}" ORDER BY "明细ID" DESC LIMIT 1'
            record = db.execute(text(select_sql)).fetchone()
        
        _close_session(db)
        
        return dict(record._mapping) if record else None
        
    except Exception as e:
        _close_session(db)
        raise e

def 获取就业明细列表_神殿(
    campus: str,
    跳过: int = 0,
    限制: int = 100,
    姓名: Optional[str] = None,
    所报专业: Optional[str] = None,
    就业地区: Optional[str] = None,
    就业单位: Optional[str] = None,
    班级名称: Optional[str] = None
) -> List[dict[str, EmploymentRecordValue]]:
    """
    获取就业明细列表（按神殿分表）
    
    Args:
        campus: 神殿名称
        跳过: 跳过的记录数
        限制: 限制返回的记录数
        姓名: 按姓名筛选
        所报专业: 按所报专业筛选
        就业地区: 按就业地区筛选
        就业单位: 按就业单位筛选
    
    Returns:
        就业明细列表
    """
    db: Session | None = None
    try:
        db = campus_db_manager.get_employment_session(campus)
        table_name = campus_db_manager.get_campus_table_name("就业明细表", campus)
        
        # 构建查询条件
        where_conditions = []
        params: dict[str, SqlParamValue] = {}
        
        if 姓名:
            where_conditions.append("姓名 LIKE :姓名")
            params['姓名'] = f"%{姓名}%"
        
        if 所报专业:
            where_conditions.append("所报专业 LIKE :所报专业")
            params['所报专业'] = f"%{所报专业}%"
        
        if 就业地区:
            where_conditions.append("就业地区 LIKE :就业地区")
            params['就业地区'] = f"%{就业地区}%"
        
        if 就业单位:
            where_conditions.append("就业单位 LIKE :就业单位")
            params['就业单位'] = f"%{就业单位}%"
        
        if 班级名称:
            where_conditions.append("班级名称 = :班级名称")
            params['班级名称'] = 班级名称
        
        where_clause = " AND ".join(where_conditions) if where_conditions else "1=1"
        
        select_sql = f"""
        SELECT * FROM "{table_name}" 
        WHERE {where_clause}
        ORDER BY 序号 ASC, "明细ID" ASC
        LIMIT :限制 OFFSET :跳过
        """
        
        params.update({'限制': 限制, '跳过': 跳过})
        
        result = db.execute(text(select_sql), params)
        records = result.fetchall()
        
        _close_session(db)
        
        return [dict(record._mapping) for record in records]
        
    except Exception as e:
        _close_session(db)
        raise e

def 获取就业明细_神殿(
    campus: str,
    明细ID: int
) -> Optional[dict[str, EmploymentRecordValue]]:
    """
    根据ID获取就业明细（按神殿分表）
    
    Args:
        campus: 神殿名称
        明细ID: 明细ID
    
    Returns:
        就业明细记录
    """
    db: Session | None = None
    try:
        db = campus_db_manager.get_employment_session(campus)
        table_name = campus_db_manager.get_campus_table_name("就业明细表", campus)
        
        select_sql = f'SELECT * FROM "{table_name}" WHERE "明细ID" = :明细ID'
        result = db.execute(text(select_sql), {'明细ID': 明细ID})
        record = result.fetchone()
        
        _close_session(db)
        
        return dict(record._mapping) if record else None
        
    except Exception as e:
        _close_session(db)
        raise e

def 更新就业明细_神殿(
    campus: str,
    明细ID: int,
    **kwargs
) -> Optional[dict[str, EmploymentRecordValue]]:
    """
    更新就业明细记录（按神殿分表）
    
    Args:
        campus: 神殿名称
        明细ID: 明细ID
        **kwargs: 要更新的字段
    
    Returns:
        更新后的就业明细记录
    """
    db: Session | None = None
    try:
        db = campus_db_manager.get_employment_session(campus)
        table_name = campus_db_manager.get_campus_table_name("就业明细表", campus)
        
        # 构建更新SQL
        set_clauses = []
        params: dict[str, object] = {'明细ID': 明细ID}
        
        for key, value in kwargs.items():
            if value is not None:
                set_clauses.append(f"{key} = :{key}")
                params[key] = value
        
        if not set_clauses:
            return None
        
        update_sql = f"""
        UPDATE "{table_name}" 
        SET {', '.join(set_clauses)}
        WHERE "明细ID" = :明细ID
        """
        
        result = db.execute(text(update_sql), params)
        db.commit()
        
        if _rowcount(result) > 0:
            # 获取更新后的记录
            select_sql = f'SELECT * FROM "{table_name}" WHERE "明细ID" = :明细ID'
            record = db.execute(text(select_sql), {'明细ID': 明细ID}).fetchone()
            _close_session(db)
            return dict(record._mapping) if record else None
        else:
            _close_session(db)
            return None
            
    except Exception as e:
        _close_session(db)
        raise e

def 删除就业明细_神殿(
    campus: str,
    明细ID: int
) -> bool:
    """
    删除就业明细记录（按神殿分表）
    
    Args:
        campus: 神殿名称
        明细ID: 明细ID
    
    Returns:
        是否删除成功
    """
    db: Session | None = None
    try:
        db = campus_db_manager.get_employment_session(campus)
        table_name = campus_db_manager.get_campus_table_name("就业明细表", campus)
        
        delete_sql = f'DELETE FROM "{table_name}" WHERE "明细ID" = :明细ID'
        result = db.execute(text(delete_sql), {'明细ID': 明细ID})
        db.commit()
        
        success = _rowcount(result) > 0
        _close_session(db)
        
        return success
        
    except Exception as e:
        _close_session(db)
        raise e

def 获取就业统计_神殿(
    campus: str,
    日期_开始: Optional[date] = None,
    日期_结束: Optional[date] = None
) -> dict:
    """
    获取就业统计信息（按神殿分表）
    
    Args:
        campus: 神殿名称
        日期_开始: 开始日期
        日期_结束: 结束日期
    
    Returns:
        统计信息
    """
    db: Session | None = None
    try:
        db = campus_db_manager.get_employment_session(campus)
        table_name = campus_db_manager.get_campus_table_name("就业明细表", campus)
        
        # 构建查询条件
        where_conditions = []
        params: dict[str, SqlParamValue] = {}
        
        if 日期_开始:
            where_conditions.append("入职时间 >= :日期_开始")
            params['日期_开始'] = 日期_开始
        
        if 日期_结束:
            where_conditions.append("入职时间 <= :日期_结束")
            params['日期_结束'] = 日期_结束
        
        where_clause = " AND ".join(where_conditions) if where_conditions else "1=1"
        
        stats_sql = f"""
        SELECT 
            COUNT(*) as 总人数,
            COUNT(DISTINCT 所报专业) as 专业数量,
            COUNT(DISTINCT 就业地区) as 就业地区数量,
            COUNT(DISTINCT 就业单位) as 就业单位数量,
            AVG(转正金额) as 平均转正金额,
            MAX(转正金额) as 最高转正金额,
            MIN(转正金额) as 最低转正金额,
            AVG(回访转正金额) as 平均回访转正金额
        FROM "{table_name}" 
        WHERE {where_clause}
        """
        
        result = db.execute(text(stats_sql), params)
        stats = result.fetchone()
        
        _close_session(db)
        
        return dict(stats._mapping) if stats else {}
        
    except Exception as e:
        _close_session(db)
        raise e
