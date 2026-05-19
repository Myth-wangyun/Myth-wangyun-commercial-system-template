"""
神殿后端就业明星汇总表 CRUD 操作
"""

from datetime import date
from typing import Any, Dict, List, Optional

from sqlalchemy import extract, func
from sqlalchemy.orm import Session

from ..models.employment_star_summary import 神殿后端就业明星汇总表


def 获取就业明星列表(
    db: Session,
    神殿: Optional[str] = None,
    年份: Optional[int] = None,
) -> List[神殿后端就业明星汇总表]:
    """
    获取指定神殿的就业明星列表
    支持按年份筛选（根据入职时间）
    """
    query = db.query(神殿后端就业明星汇总表)
    if 神殿:
        query = query.filter(神殿后端就业明星汇总表.神殿 == 神殿)
    if 年份:
        query = query.filter(extract('year', 神殿后端就业明星汇总表.入职时间) == 年份)
    return query.order_by(
        神殿后端就业明星汇总表.班级名称.asc(),
        神殿后端就业明星汇总表.学员姓名.asc(),
    ).all()


def 获取就业明星可用年份列表(
    db: Session,
    神殿: Optional[str] = None,
) -> List[int]:
    """
    获取就业明星表的可用年份列表（从入职时间字段提取）
    """
    query = db.query(
        extract('year', 神殿后端就业明星汇总表.入职时间).label('year')
    ).filter(
        神殿后端就业明星汇总表.入职时间.isnot(None)
    )
    if 神殿:
        query = query.filter(神殿后端就业明星汇总表.神殿 == 神殿)
    
    years = query.distinct().all()
    year_list = [int(y.year) for y in years if y.year is not None]
    year_list.sort(reverse=True)
    
    # 如果没有数据，返回当前年份
    if not year_list:
        from datetime import datetime
        year_list = [datetime.now().year]
    
    return year_list


def 获取就业明星历史汇总数据(
    db: Session,
    神殿: Optional[str] = None,
) -> Dict[str, Any]:
    """
    获取就业明星历史汇总数据（所有年份合计）
    """
    query = db.query(
        func.count(神殿后端就业明星汇总表.明星ID).label("total_stars"),
        func.avg(神殿后端就业明星汇总表.就业薪资).label("avg_salary"),
        func.max(神殿后端就业明星汇总表.就业薪资).label("max_salary"),
        func.min(神殿后端就业明星汇总表.就业薪资).label("min_salary"),
    )
    if 神殿:
        query = query.filter(神殿后端就业明星汇总表.神殿 == 神殿)
    
    result = query.first()
    
    if not result or result.total_stars is None:
        return {
            "totalStars": 0,
            "avgSalary": 0.0,
            "maxSalary": 0.0,
            "minSalary": 0.0,
        }
    
    return {
        "totalStars": int(result.total_stars or 0),
        "avgSalary": float(result.avg_salary or 0),
        "maxSalary": float(result.max_salary or 0),
        "minSalary": float(result.min_salary or 0),
    }


def 保存就业明星列表(
    db: Session,
    神殿: str,
    明星列表: List[dict],
) -> List[神殿后端就业明星汇总表]:
    """
    覆盖保存指定神殿的就业明星列表：
    - 先删除该神殿已有记录
    - 再按提交的数据重新插入
    """
    # 删除旧数据
    db.query(神殿后端就业明星汇总表).filter(
        神殿后端就业明星汇总表.神殿 == 神殿
    ).delete(synchronize_session=False)

    created: List[神殿后端就业明星汇总表] = []
    for item in 明星列表:
        # 入职时间字符串转 Date（允许为空）
        entry_date: Optional[date] = None
        entry_time_str = item.get("entryTime") or item.get("入职时间")
        if entry_time_str:
            try:
                # entryTime 可能是 YYYY-MM 或 YYYY-MM-DD，这里统一按 YYYY-MM-DD 处理
                from datetime import datetime

                if len(entry_time_str) == 7:
                    entry_time_str = entry_time_str + "-01"
                entry_date = datetime.strptime(entry_time_str, "%Y-%m-%d").date()
            except Exception:
                entry_date = None

        star = 神殿后端就业明星汇总表(
            神殿=神殿,
            学员姓名=item.get("studentName") or item.get("学员姓名") or "",
            性别=item.get("gender") or item.get("性别"),
            毕业年龄=item.get("graduationAge") or item.get("毕业年龄"),
            最高学历=item.get("highestEducation") or item.get("最高学历"),
            专业=item.get("major") or item.get("专业"),
            学制=item.get("programLength") or item.get("学制"),
            班级名称=item.get("className") or item.get("班级名称"),
            入职时间=entry_date,
            就业地区=item.get("employmentRegion") or item.get("就业地区"),
            就业单位=item.get("employer") or item.get("就业单位"),
            就业岗位=item.get("jobPosition") or item.get("就业岗位"),
            就业薪资=item.get("employmentSalary") or item.get("就业薪资"),
        )
        db.add(star)
        created.append(star)

    db.commit()

    for s in created:
        db.refresh(s)

    return created

