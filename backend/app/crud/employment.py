"""
就业明细CRUD操作
"""

from datetime import date
from typing import Dict, List, Optional

from sqlalchemy import or_, text
from sqlalchemy.orm import Session

from ..models.class_employment_summary import 班级就业总结表
from ..models.employment import 班级就业明细表


def 创建就业明细(
    db: Session,
    序号: int,
    姓名: str,
    性别: str,
    年龄: int,
    所报专业: str,
    学历: str,
    联系电话: str,
    入职时间: date,
    神殿: str,
    就业地区: str,
    就业单位: str,
    就业岗位: str,
    转正薪资: Optional[str] = None,
    转正金额: Optional[float] = None,
    回访情况: Optional[str] = None,
    回访入职公司: Optional[str] = None,
    回访转正金额: Optional[float] = None,
    专业: Optional[str] = None,
    毕业学校: Optional[str] = None,
    目前所获最高学历证书及性质: Optional[str] = None,
    通信地址: Optional[str] = None,
    试用期薪资: Optional[float] = None,
    班级名称: Optional[str] = None
) -> 班级就业明细表:
    """
    创建就业明细记录
    
    Args:
        db: 数据库会话
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
    db_employment = 班级就业明细表(
        序号=序号,
        姓名=姓名,
        性别=性别,
        年龄=年龄,
        所报专业=所报专业,
        学历=学历,
        专业=专业,
        毕业学校=毕业学校,
        目前所获最高学历证书及性质=目前所获最高学历证书及性质,
        联系电话=联系电话,
        通信地址=通信地址,
        入职时间=入职时间,
        神殿=神殿,
        班级名称=班级名称,
        就业地区=就业地区,
        就业单位=就业单位,
        就业岗位=就业岗位,
        试用期薪资=试用期薪资,
        转正薪资=转正薪资,
        转正金额=转正金额,
        回访情况=回访情况,
        回访入职公司=回访入职公司,
        回访转正金额=回访转正金额
    )
    
    db.add(db_employment)
    db.commit()
    db.refresh(db_employment)
    return db_employment


def 获取就业明细列表(
    db: Session,
    跳过: int = 0,
    限制: int = 100,
    姓名: Optional[str] = None,
    所报专业: Optional[str] = None,
    神殿: Optional[str] = None,
    就业地区: Optional[str] = None,
    就业单位: Optional[str] = None,
    班级名称: Optional[str] = None
) -> List[班级就业明细表]:
    """
    获取就业明细列表
    
    Args:
        db: 数据库会话
        跳过: 跳过的记录数
        限制: 限制返回的记录数
        姓名: 按姓名筛选
        所报专业: 按所报专业筛选
        神殿: 按神殿筛选
        就业地区: 按就业地区筛选
        就业单位: 按就业单位筛选
    
    Returns:
        就业明细列表
    """
    query = db.query(班级就业明细表)
    
    # 应用筛选条件
    if 姓名:
        query = query.filter(班级就业明细表.姓名.contains(姓名))
    if 所报专业:
        query = query.filter(班级就业明细表.所报专业.contains(所报专业))
    if 神殿:
        query = query.filter(班级就业明细表.神殿 == 神殿)
    if 就业地区:
        query = query.filter(班级就业明细表.就业地区.contains(就业地区))
    if 就业单位:
        query = query.filter(班级就业明细表.就业单位.contains(就业单位))
    if 班级名称:
        query = query.filter(班级就业明细表.班级名称 == 班级名称)
    
    return query.order_by(班级就业明细表.序号.asc()).offset(跳过).limit(限制).all()


def 获取就业明细(
    db: Session,
    明细ID: int
) -> Optional[班级就业明细表]:
    """
    根据ID获取就业明细
    
    Args:
        db: 数据库会话
        明细ID: 明细ID
    
    Returns:
        就业明细记录
    """
    return db.query(班级就业明细表).filter(班级就业明细表.明细ID == 明细ID).first()


def 更新就业明细(
    db: Session,
    明细ID: int,
    更新数据: dict
) -> Optional[班级就业明细表]:
    """
    更新就业明细
    
    Args:
        db: 数据库会话
        明细ID: 明细ID
        更新数据: 要更新的数据字典
    
    Returns:
        更新后的就业明细记录
    """
    db_employment = db.query(班级就业明细表).filter(班级就业明细表.明细ID == 明细ID).first()
    
    if not db_employment:
        return None
    
    for field, value in 更新数据.items():
        if hasattr(db_employment, field):
            setattr(db_employment, field, value)
    
    db.commit()
    db.refresh(db_employment)
    return db_employment


def 删除就业明细(
    db: Session,
    明细ID: int
) -> bool:
    """
    删除就业明细
    
    Args:
        db: 数据库会话
        明细ID: 明细ID
    
    Returns:
        是否删除成功
    """
    db_employment = db.query(班级就业明细表).filter(班级就业明细表.明细ID == 明细ID).first()
    
    if not db_employment:
        return False
    
    db.delete(db_employment)
    db.commit()
    return True


def 批量创建就业明细(
    db: Session,
    就业明细列表: List[dict]
) -> List[班级就业明细表]:
    """
    批量创建就业明细记录
    
    Args:
        db: 数据库会话
        就业明细列表: 就业明细数据列表
    
    Returns:
        创建的就业明细记录列表
    """
    created_records = []
    
    for 明细数据 in 就业明细列表:
        db_employment = 班级就业明细表(**明细数据)
        db.add(db_employment)
        created_records.append(db_employment)
    
    db.commit()
    
    for record in created_records:
        db.refresh(record)
    
    return created_records


def 获取就业统计信息(
    db: Session,
    开始日期: Optional[date] = None,
    结束日期: Optional[date] = None,
    所报专业: Optional[str] = None,
    就业地区: Optional[str] = None,
    神殿: Optional[str] = None
) -> dict:
    """
    获取就业统计信息
    
    Args:
        db: 数据库会话
        开始日期: 统计开始日期
        结束日期: 统计结束日期
        所报专业: 按所报专业筛选
        就业地区: 按就业地区筛选
        神殿: 按神殿筛选
    
    Returns:
        统计信息字典
    """
    # 使用ORM查询而不是原始SQL
    query = db.query(班级就业明细表)
    
    if 开始日期:
        query = query.filter(班级就业明细表.入职时间 >= 开始日期)
    
    if 结束日期:
        query = query.filter(班级就业明细表.入职时间 <= 结束日期)
    
    if 所报专业:
        query = query.filter(班级就业明细表.所报专业 == 所报专业)
    
    if 就业地区:
        query = query.filter(班级就业明细表.就业地区 == 就业地区)
    
    if 神殿:
        query = query.filter(班级就业明细表.神殿 == 神殿)
    
    # 使用ORM聚合函数
    from sqlalchemy import func
    
    stats = query.with_entities(
        func.count(班级就业明细表.明细ID).label('总人数'),
        func.count(func.distinct(班级就业明细表.所报专业)).label('专业数量'),
        func.count(func.distinct(班级就业明细表.就业地区)).label('就业地区数量'),
        func.count(func.distinct(班级就业明细表.就业单位)).label('就业单位数量'),
        func.coalesce(func.avg(班级就业明细表.转正金额), 0).label('平均转正金额'),
        func.coalesce(func.max(班级就业明细表.转正金额), 0).label('最高转正金额'),
        func.coalesce(func.min(班级就业明细表.转正金额), 0).label('最低转正金额'),
        func.coalesce(func.avg(班级就业明细表.回访转正金额), 0).label('平均回访转正金额')
    ).first()
    
    if not stats:
        return {
            "总人数": 0,
            "专业数量": 0,
            "就业地区数量": 0,
            "就业单位数量": 0,
            "平均转正金额": 0.0,
            "最高转正金额": 0.0,
            "最低转正金额": 0.0,
            "平均回访转正金额": 0.0
        }
    
    return {
        "总人数": stats.总人数 or 0,
        "专业数量": stats.专业数量 or 0,
        "就业地区数量": stats.就业地区数量 or 0,
        "就业单位数量": stats.就业单位数量 or 0,
        "平均转正金额": float(stats.平均转正金额) if stats.平均转正金额 else 0.0,
        "最高转正金额": float(stats.最高转正金额) if stats.最高转正金额 else 0.0,
        "最低转正金额": float(stats.最低转正金额) if stats.最低转正金额 else 0.0,
        "平均回访转正金额": float(stats.平均回访转正金额) if stats.平均回访转正金额 else 0.0
    }


def 获取专业就业统计(
    db: Session
) -> List[dict]:
    """
    获取各专业就业统计
    
    Args:
        db: 数据库会话
    
    Returns:
        专业就业统计列表
    """
    from sqlalchemy import text
    
    sql = """
        SELECT 
            所报专业,
            COUNT(*) as 就业人数,
            COALESCE(AVG(转正金额), 0) as 平均转正金额,
            COALESCE(MAX(转正金额), 0) as 最高转正金额,
            COALESCE(MIN(转正金额), 0) as 最低转正金额
        FROM 班级就业明细表
        GROUP BY 所报专业
        ORDER BY 就业人数 DESC
    """
    
    results = db.execute(text(sql)).fetchall()
    
    return [
        {
            "所报专业": row[0],
            "就业人数": row[1],
            "平均转正金额": float(row[2]) if row[2] else 0.0,
            "最高转正金额": float(row[3]) if row[3] else 0.0,
            "最低转正金额": float(row[4]) if row[4] else 0.0
        }
        for row in results
    ]


def 获取地区就业统计(
    db: Session
) -> List[dict]:
    """
    获取各地区就业统计
    
    Args:
        db: 数据库会话
    
    Returns:
        地区就业统计列表
    """
    from sqlalchemy import text
    
    sql = """
        SELECT 
            就业地区,
            COUNT(*) as 就业人数,
            COALESCE(AVG(转正金额), 0) as 平均转正金额,
            COALESCE(MAX(转正金额), 0) as 最高转正金额,
            COALESCE(MIN(转正金额), 0) as 最低转正金额
        FROM 班级就业明细表
        GROUP BY 就业地区
        ORDER BY 就业人数 DESC
    """
    
    results = db.execute(text(sql)).fetchall()
    
    return [
        {
            "就业地区": row[0],
            "就业人数": row[1],
            "平均转正金额": float(row[2]) if row[2] else 0.0,
            "最高转正金额": float(row[3]) if row[3] else 0.0,
            "最低转正金额": float(row[4]) if row[4] else 0.0
        }
        for row in results
    ]


def 自动计算班级就业总结(
    db: Session,
    神殿: str,
    班级名称: str
) -> Dict:
    """
    根据班级就业明细表自动计算就业总结数据
    档案人数从班级档案表获取
    需就业人数 = 档案人数 - 退费人数（从退费明细表获取）
    就业薪资使用回访转正金额，如果没有则使用转正金额
    目标就业人数优先从班级就业总结表获取，如果不存在则使用需就业人数
    
    Args:
        db: 数据库会话
        神殿: 神殿名称
        班级名称: 班级名称
    
    Returns:
        就业总结数据字典
    """
    # 从班级档案表获取档案人数和学生身份证号列表
    # 神殿名称需要模糊匹配（支持"盛邦"和"主神殿"）
    normalized_campus = 神殿.rstrip('神殿').strip()
    
    # 获取档案人数
    archive_count_query = text("""
        SELECT COUNT(*) FROM teaching_quality.班级档案表
        WHERE 班级名称 = :班级名称
        AND (神殿名称 = :神殿 OR 神殿名称 = :normalized OR 神殿名称 = :with_suffix)
        AND 姓名 IS NOT NULL AND 姓名 != ''
    """)
    archive_count_result = db.execute(archive_count_query, {
        "班级名称": 班级名称,
        "神殿": 神殿,
        "normalized": normalized_campus,
        "with_suffix": f"{normalized_campus}神殿"
    }).scalar()
    archive_count = archive_count_result or 0
    
    # 获取该班级学生的身份证号列表（用于匹配退费明细）
    student_id_cards_query = text("""
        SELECT 身份证号 FROM teaching_quality.班级档案表
        WHERE 班级名称 = :班级名称
        AND (神殿名称 = :神殿 OR 神殿名称 = :normalized OR 神殿名称 = :with_suffix)
        AND 姓名 IS NOT NULL AND 姓名 != ''
        AND 身份证号 IS NOT NULL AND 身份证号 != ''
    """)
    student_id_cards_result = db.execute(student_id_cards_query, {
        "班级名称": 班级名称,
        "神殿": 神殿,
        "normalized": normalized_campus,
        "with_suffix": f"{normalized_campus}神殿"
    }).fetchall()
    student_id_cards = [row[0] for row in student_id_cards_result if row[0]]
    
    # 从退费明细表中查询该班级学生的退费人数（通过身份证号匹配）
    refund_count = 0
    if student_id_cards:
        # 使用 IN 查询匹配退费明细表中的学生
        refund_count_query = text("""
            SELECT COUNT(DISTINCT 身份证号) FROM teaching_quality.退费明细表
            WHERE 身份证号 = ANY(:id_cards)
            AND (神殿名称 = :神殿 OR 神殿名称 = :normalized OR 神殿名称 = :with_suffix)
            AND 姓名 IS NOT NULL AND 姓名 != ''
        """)
        refund_count_result = db.execute(refund_count_query, {
            "id_cards": student_id_cards,
            "神殿": 神殿,
            "normalized": normalized_campus,
            "with_suffix": f"{normalized_campus}神殿"
        }).scalar()
        refund_count = refund_count_result or 0
    
    # 查询该班级的所有就业明细（神殿需要模糊匹配，支持"盛邦"和"主神殿"）
    query = db.query(班级就业明细表).filter(
        or_(
            班级就业明细表.神殿 == 神殿,
            班级就业明细表.神殿 == normalized_campus,
            班级就业明细表.神殿 == f"{normalized_campus}神殿"
        ),
        班级就业明细表.班级名称 == 班级名称
    )
    
    records = query.all()
    
    # 先尝试从班级就业总结表获取已保存的目标就业人数（神殿模糊匹配）
    existing_summary = db.query(班级就业总结表).filter(
        or_(
            班级就业总结表.神殿 == 神殿,
            班级就业总结表.神殿 == normalized_campus,
            班级就业总结表.神殿 == f"{normalized_campus}神殿"
        ),
        班级就业总结表.班级名称 == 班级名称
    ).first()
    
    # 需就业人数 = 档案人数 - 退费人数
    need_employment_count = max(0, archive_count - refund_count)
    
    # 目标就业人数 = 需就业人数（两者是同一个数字）
    # 这样目标需就业率 = 目标就业人数/需就业人数 = 100%
    target_employment_count = need_employment_count
    
    if not records:
        # 目标就业率 = 目标就业人数/档案人数
        target_employment_rate = round((target_employment_count / archive_count * 100), 1) if archive_count > 0 else 0
        # 目标需就业率 = 目标就业人数/需就业人数
        target_need_employment_rate = round((target_employment_count / need_employment_count * 100), 1) if need_employment_count > 0 else 0
        return {
            "神殿": 神殿,
            "班级名称": 班级名称,
            "档案人数": archive_count,
            "需就业人数": need_employment_count,
            "目标就业人数": target_employment_count,
            "实际就业人数": 0,
            "目标就业率": target_employment_rate,
            "实际就业率": 0,
            "目标需就业率": target_need_employment_rate,
            "实际需就业率": 0,
            "目标平均就业薪资": 0,
            "实际平均就业薪资": 0,
            "薪资过万人数": 0,
        }
    
    # 计算实际就业人数 - 薪资为0的不参与计算（需要有就业单位且薪资>0）
    # 薪资优先取回访转正金额，如果没有则取转正金额
    # 获取薪资：只使用回访转正金额判断（离职后薪资变0或未回访）
    def get_salary(r):
        # 只使用回访转正金额，不使用转正金额
        if r.回访转正金额 is not None:
            return float(r.回访转正金额)
        return None
    
    # 实际就业人数：有就业单位且回访转正金额>0（离职或未回访不算）
    actual_employment_count = len([
        r for r in records 
        if r.就业单位 and r.就业单位.strip() and (sal := get_salary(r)) is not None and sal > 0
    ])
    
    # 计算实际平均薪资 = SUM(回访转正金额) / 需就业人数
    # 回访转正金额=0的也参与计算（离职的算0）
    total_salary = sum(
        float(r.回访转正金额) for r in records 
        if r.回访转正金额 is not None
    )
    actual_average_salary = int(total_salary / need_employment_count) if need_employment_count > 0 else 0
    
    # 目标平均薪资（比实际高5%）
    target_average_salary = int(actual_average_salary * 1.05) if actual_average_salary > 0 else 0
    
    # 计算薪资过万人数 - 只使用回访转正金额
    high_salary_count = len([
        r for r in records
        if r.回访转正金额 is not None and float(r.回访转正金额) >= 10000
    ])
    
    # 计算就业率
    # 目标就业率 = 目标就业人数/档案人数（因学员中途流失，可能不是100%）
    # 实际就业率 = 实际就业人数/档案人数
    target_employment_rate = round((target_employment_count / archive_count * 100), 1) if archive_count > 0 else 0
    actual_employment_rate = round((actual_employment_count / archive_count * 100), 1) if archive_count > 0 else 0
    
    # 计算需就业率
    # 目标需就业率 = 目标就业人数/需就业人数 = 100%（因为两者是同一个数字）
    # 实际需就业率 = 实际就业人数/需就业人数
    target_need_employment_rate = round((target_employment_count / need_employment_count * 100), 1) if need_employment_count > 0 else 0
    actual_need_employment_rate = round((actual_employment_count / need_employment_count * 100), 1) if need_employment_count > 0 else 0
    
    return {
        "神殿": 神殿,
        "班级名称": 班级名称,
        "档案人数": archive_count,
        "需就业人数": need_employment_count,
        "目标就业人数": target_employment_count,
        "实际就业人数": actual_employment_count,
        "目标就业率": target_employment_rate,
        "实际就业率": actual_employment_rate,
        "目标需就业率": target_need_employment_rate,
        "实际需就业率": actual_need_employment_rate,
        "目标平均就业薪资": target_average_salary,
        "实际平均就业薪资": actual_average_salary,
        "薪资过万人数": high_salary_count,
    }
