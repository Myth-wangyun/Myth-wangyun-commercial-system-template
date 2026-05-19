"""班级就业总结CRUD操作"""

from typing import Any, Dict, List, Optional, Set

from sqlalchemy import and_, case, func, or_
from sqlalchemy.orm import Session

from ..models.class_employment_summary import 班级就业总结表


def _normalize_campus_variations(campus: str) -> Set[str]:
    """生成用于匹配的神殿名称变体，保证“测试神殿”与“测试”均能命中"""

    trimmed = (campus or "").strip()
    base = trimmed.replace("神殿", "").strip()
    variants = {trimmed, base, f"{base}神殿"}
    return {name for name in variants if name}


def _apply_campus_filter(query, campus: Optional[str]):
    if not campus:
        return query

    variants = _normalize_campus_variations(campus)
    return query.filter(or_(*[班级就业总结表.神殿 == name for name in variants]))


def 创建班级就业总结(
    db: Session,
    神殿: str,
    班级名称: str,
    年份: int,
    月份: int,
    档案人数: int = 0,
    需就业人数: int = 0,
    目标就业人数: int = 0,
    实际就业人数: int = 0,
    目标就业率: float = 100,
    实际就业率: float = 0,
    目标需就业率: float = 100,
    实际需就业率: float = 0,
    目标平均薪资: float = 0,
    实际平均薪资: float = 0,
    备注: Optional[str] = None,
) -> 班级就业总结表:
    """创建班级就业总结记录"""

    db_summary = 班级就业总结表(
        神殿=神殿,
        班级名称=班级名称,
        年份=年份,
        月份=月份,
        档案人数=档案人数,
        需就业人数=需就业人数,
        目标就业人数=目标就业人数,
        实际就业人数=实际就业人数,
        目标就业率=目标就业率,
        实际就业率=实际就业率,
        目标需就业率=目标需就业率,
        实际需就业率=实际需就业率,
        目标平均薪资=目标平均薪资,
        实际平均薪资=实际平均薪资,
        备注=备注,
    )

    db.add(db_summary)
    db.commit()
    db.refresh(db_summary)
    return db_summary


def 获取班级就业总结列表(
    db: Session,
    神殿: Optional[str] = None,
    班级名称: Optional[str] = None,
    年份: Optional[int] = None,
    月份: Optional[int] = None,
) -> List[班级就业总结表]:
    """获取班级就业总结列表"""

    query = db.query(班级就业总结表)
    query = _apply_campus_filter(query, 神殿)

    if 班级名称:
        query = query.filter(班级就业总结表.班级名称 == 班级名称)
    if 年份:
        query = query.filter(班级就业总结表.年份 == 年份)
    if 月份:
        query = query.filter(班级就业总结表.月份 == 月份)

    return query.order_by(
        班级就业总结表.年份.desc(),
        班级就业总结表.月份.desc(),
        班级就业总结表.神殿,
        班级就业总结表.班级名称,
    ).all()


def 获取班级就业总结(
    db: Session,
    总结ID: int,
) -> Optional[班级就业总结表]:
    """根据ID获取班级就业总结"""
    try:
        result = db.query(班级就业总结表).filter(班级就业总结表.总结ID == 总结ID).first()
        return result
    except Exception as e:
        print(f"[获取班级就业总结] 查询异常: 总结ID={总结ID}, 错误={str(e)}")
        raise


def 更新班级就业总结(
    db: Session,
    总结ID: int,
    更新数据: Dict[str, Any],
) -> Optional[班级就业总结表]:
    """更新班级就业总结"""

    db_summary = db.query(班级就业总结表).filter(班级就业总结表.总结ID == 总结ID).first()
    if not db_summary:
        return None

    for key, value in 更新数据.items():
        if hasattr(db_summary, key) and value is not None:
            setattr(db_summary, key, value)

    db.commit()
    db.refresh(db_summary)
    return db_summary


def 删除班级就业总结(
    db: Session,
    总结ID: int,
) -> bool:
    """删除班级就业总结"""
    try:
        # 先查询记录是否存在
        db_summary = db.query(班级就业总结表).filter(班级就业总结表.总结ID == 总结ID).first()
        if not db_summary:
            print(f"[删除班级就业总结] 未找到记录: 总结ID={总结ID}")
            return False

        print(f"[删除班级就业总结] 找到记录: 总结ID={总结ID}, 神殿={db_summary.神殿}, 班级名称={db_summary.班级名称}")
        
        db.delete(db_summary)
        db.commit()
        print(f"[删除班级就业总结] 删除成功: 总结ID={总结ID}")
        return True
    except Exception as e:
        print(f"[删除班级就业总结] 删除失败: 总结ID={总结ID}, 错误={str(e)}")
        db.rollback()
        raise


def 根据业务键删除班级就业总结(
    db: Session,
    神殿: str,
    班级名称: str,
    年份: int,
    月份: int,
) -> bool:
    """根据业务键（神殿+班级名称+年份+月份）删除班级就业总结"""
    try:
        # 支持神殿名称变体匹配
        variants = _normalize_campus_variations(神殿)
        
        db_summary = db.query(班级就业总结表).filter(
            and_(
                or_(*[班级就业总结表.神殿 == name for name in variants]),
                班级就业总结表.班级名称 == 班级名称,
                班级就业总结表.年份 == 年份,
                班级就业总结表.月份 == 月份,
            )
        ).first()
        
        if not db_summary:
            print(f"[根据业务键删除] 未找到记录: 神殿={神殿}, 班级名称={班级名称}, 年份={年份}, 月份={月份}")
            return False

        总结ID = db_summary.总结ID
        print(f"[根据业务键删除] 找到记录: 总结ID={总结ID}, 神殿={db_summary.神殿}, 班级名称={db_summary.班级名称}")
        
        db.delete(db_summary)
        db.commit()
        print(f"[根据业务键删除] 删除成功: 总结ID={总结ID}")
        return True
    except Exception as e:
        print(f"[根据业务键删除] 删除失败: 神殿={神殿}, 班级名称={班级名称}, 错误={str(e)}")
        db.rollback()
        raise


def 获取或创建班级就业总结(
    db: Session,
    神殿: str,
    班级名称: str,
    年份: int,
    月份: int,
) -> 班级就业总结表:
    """获取或创建班级就业总结（如果不存在则创建）"""

    existing = db.query(班级就业总结表).filter(
        and_(
            班级就业总结表.神殿 == 神殿,
            班级就业总结表.班级名称 == 班级名称,
            班级就业总结表.年份 == 年份,
            班级就业总结表.月份 == 月份,
        )
    ).first()

    if existing:
        return existing

    return 创建班级就业总结(
        db=db,
        神殿=神殿,
        班级名称=班级名称,
        年份=年份,
        月份=月份,
    )


def 聚合神殿就业目标结果(
    db: Session,
    神殿: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """按神殿聚合就业目标与结果数据"""

    query = db.query(
        班级就业总结表.神殿.label("campus"),
        func.count(班级就业总结表.总结ID).label("class_count"),
        func.sum(班级就业总结表.档案人数).label("archive_count"),
        func.sum(班级就业总结表.目标就业人数).label("target_employment_count"),
        func.sum(班级就业总结表.实际就业人数).label("actual_employment_count"),
        func.avg(班级就业总结表.目标平均薪资).label("avg_target_salary"),
        func.avg(班级就业总结表.实际平均薪资).label("avg_actual_salary"),
        func.avg(
            case(
                (
                    班级就业总结表.目标平均薪资 != 0,
                    班级就业总结表.实际平均薪资 / 班级就业总结表.目标平均薪资 * 100,
                ),
                else_=0,
            )
        ).label("avg_attainment_rate"),
        func.avg(
            case(
                (
                    班级就业总结表.档案人数 != 0,
                    班级就业总结表.实际就业人数 / 班级就业总结表.档案人数 * 100,
                ),
                else_=0,
            )
        ).label("avg_employment_rate"),
    )

    query = _apply_campus_filter(query, 神殿)

    rows = (
        query.group_by(班级就业总结表.神殿)
        .order_by(班级就业总结表.神殿)
        .all()
    )

    results: List[Dict[str, Any]] = []
    for row in rows:
        campus_raw = row.campus or ""
        campus_name = campus_raw.replace("神殿", "").strip() or campus_raw
        results.append(
            {
                "campus": campus_name,
                "classCount": int(row.class_count or 0),
                "archiveCount": int(row.archive_count or 0),
                "targetEmploymentCount": int(row.target_employment_count or 0),
                "actualEmploymentCount": int(row.actual_employment_count or 0),
                "averageTargetSalary": float(row.avg_target_salary or 0),
                "averageActualSalary": float(row.avg_actual_salary or 0),
                "averageAttainmentRate": float(row.avg_attainment_rate or 0),
                "averageEmploymentRate": float(row.avg_employment_rate or 0),
                "salaryOverTenThousand": 0,
                "recordCount": int(row.class_count or 0),
            }
        )

    return results


def 获取可用年份列表(
    db: Session,
    神殿: Optional[str] = None,
) -> List[int]:
    """获取可用的年份列表"""
    query = db.query(班级就业总结表.年份).distinct()
    query = _apply_campus_filter(query, 神殿)
    results = query.order_by(班级就业总结表.年份.desc()).all()
    return [r.年份 for r in results if r.年份]


def 获取历史汇总数据(
    db: Session,
    神殿: Optional[str] = None,
) -> Dict[str, Any]:
    """获取历史汇总数据（所有年份合计）"""
    query = db.query(
        func.count(班级就业总结表.总结ID).label("class_count"),
        func.sum(班级就业总结表.档案人数).label("archive_count"),
        func.sum(班级就业总结表.目标就业人数).label("target_employment_count"),
        func.sum(班级就业总结表.实际就业人数).label("actual_employment_count"),
        func.avg(班级就业总结表.目标平均薪资).label("avg_target_salary"),
        func.avg(班级就业总结表.实际平均薪资).label("avg_actual_salary"),
    )
    query = _apply_campus_filter(query, 神殿)
    result = query.first()
    
    if not result or result.class_count is None:
        return {
            "totalClasses": 0,
            "totalArchiveCount": 0,
            "totalTargetEmployment": 0,
            "totalActualEmployment": 0,
            "avgTargetSalary": 0.0,
            "avgActualSalary": 0.0,
            "avgEmploymentRate": 0.0,
            "avgAchievementRate": 0.0,
        }
    
    total_target = int(result.target_employment_count or 0)
    total_actual = int(result.actual_employment_count or 0)
    avg_target_salary = float(result.avg_target_salary or 0)
    avg_actual_salary = float(result.avg_actual_salary or 0)
    
    employment_rate = (total_actual / total_target * 100) if total_target > 0 else 0
    achievement_rate = (avg_actual_salary / avg_target_salary * 100) if avg_target_salary > 0 else 0
    
    return {
        "totalClasses": int(result.class_count or 0),
        "totalArchiveCount": int(result.archive_count or 0),
        "totalTargetEmployment": total_target,
        "totalActualEmployment": total_actual,
        "avgTargetSalary": avg_target_salary,
        "avgActualSalary": avg_actual_salary,
        "avgEmploymentRate": employment_rate,
        "avgAchievementRate": achievement_rate,
    }