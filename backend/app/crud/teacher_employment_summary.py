"""
神殿后端教员就业汇总表 CRUD 操作
"""

from typing import Dict, List, Optional

from sqlalchemy import and_, func
from sqlalchemy.orm import Session

from ..models.class_employment_summary import 班级就业总结表
from ..models.config_master import (
    ClassProfile,
    MajorProfile,
    TeacherClassAssignment,
    TeacherProfile,
)
from ..models.employment import 班级就业明细表
from ..models.teacher_employment_summary import 神殿后端教员就业汇总表


def 创建或更新教员就业汇总(
    db: Session,
    神殿: str,
    教员姓名: str,
    专业: str,
    学制: str,
    班级名称: str,
    毕业时间: Optional[str] = None,
    目标平均就业薪资: Optional[float] = None,
    实际平均就业薪资: Optional[float] = None,
    达标率: Optional[float] = None,
    目标就业人数: Optional[int] = None,
    实际就业人数: Optional[int] = None,
    就业率: Optional[float] = None,
    薪资过万人数: Optional[int] = None,
) -> 神殿后端教员就业汇总表:
    """
    创建或更新教员就业汇总记录（按神殿+教员姓名+专业+学制+班级名称唯一）。
    """
    existing = db.query(神殿后端教员就业汇总表).filter(
        神殿后端教员就业汇总表.神殿 == 神殿,
        神殿后端教员就业汇总表.教员姓名 == 教员姓名,
        神殿后端教员就业汇总表.专业 == 专业,
        神殿后端教员就业汇总表.学制 == 学制,
        神殿后端教员就业汇总表.班级名称 == 班级名称,
    ).first()

    if existing:
        更新数据 = {
            "毕业时间": 毕业时间,
            "目标平均就业薪资": 目标平均就业薪资,
            "实际平均就业薪资": 实际平均就业薪资,
            "达标率": 达标率,
            "目标就业人数": 目标就业人数,
            "实际就业人数": 实际就业人数,
            "就业率": 就业率,
            "薪资过万人数": 薪资过万人数,
        }
        # 仅更新非 None 的字段
        更新教员就业汇总(db, existing.汇总ID, {k: v for k, v in 更新数据.items() if v is not None})
        return existing

    db_summary = 神殿后端教员就业汇总表(
        神殿=神殿,
        教员姓名=教员姓名,
        专业=专业,
        学制=学制,
        班级名称=班级名称,
        毕业时间=毕业时间,
        目标平均就业薪资=目标平均就业薪资,
        实际平均就业薪资=实际平均就业薪资,
        达标率=达标率,
        目标就业人数=目标就业人数,
        实际就业人数=实际就业人数,
        就业率=就业率,
        薪资过万人数=薪资过万人数,
    )
    db.add(db_summary)
    db.commit()
    db.refresh(db_summary)
    return db_summary


def 获取教员就业汇总列表(
    db: Session,
    神殿: Optional[str] = None,
    教员姓名: Optional[str] = None,
    班级名称: Optional[str] = None,
    年份: Optional[int] = None,
    月份: Optional[int] = None,
    跳过: int = 0,
    限制: int = 1000,
) -> List[神殿后端教员就业汇总表]:
    """
    获取教员就业汇总列表
    
    年份和月份筛选：从毕业时间字段（YYYY-MM格式）中提取并过滤
    """
    query = db.query(神殿后端教员就业汇总表)
    
    if 神殿:
        query = query.filter(神殿后端教员就业汇总表.神殿 == 神殿)
    if 教员姓名:
        query = query.filter(神殿后端教员就业汇总表.教员姓名 == 教员姓名)
    if 班级名称:
        query = query.filter(神殿后端教员就业汇总表.班级名称 == 班级名称)
    
    # 按年份筛选（从毕业时间字段 YYYY-MM 格式中提取年份）
    if 年份:
        # 毕业时间格式为 YYYY-MM，使用 LIKE 'YYYY%' 来匹配年份
        query = query.filter(神殿后端教员就业汇总表.毕业时间.like(f"{年份}%"))
    
    # 按月份筛选（从毕业时间字段 YYYY-MM 格式中提取月份）
    if 月份:
        # 毕业时间格式为 YYYY-MM，使用 LIKE '%-MM' 来匹配月份
        month_str = f"-{月份:02d}"
        query = query.filter(神殿后端教员就业汇总表.毕业时间.like(f"%{month_str}"))
    
    return query.order_by(
        神殿后端教员就业汇总表.教员姓名.asc(),
        神殿后端教员就业汇总表.专业.asc(),
        神殿后端教员就业汇总表.班级名称.asc()
    ).offset(跳过).limit(限制).all()


def 获取教员就业汇总(
    db: Session,
    汇总ID: int
) -> Optional[神殿后端教员就业汇总表]:
    """
    根据ID获取教员就业汇总
    """
    return db.query(神殿后端教员就业汇总表).filter(神殿后端教员就业汇总表.汇总ID == 汇总ID).first()


def 更新教员就业汇总(
    db: Session,
    汇总ID: int,
    更新数据: dict
) -> Optional[神殿后端教员就业汇总表]:
    """
    更新教员就业汇总
    """
    db_summary = db.query(神殿后端教员就业汇总表).filter(神殿后端教员就业汇总表.汇总ID == 汇总ID).first()
    
    if not db_summary:
        return None
    
    for field, value in 更新数据.items():
        if hasattr(db_summary, field):
            setattr(db_summary, field, value)
    
    db.commit()
    db.refresh(db_summary)
    return db_summary


def 删除教员就业汇总(
    db: Session,
    汇总ID: int
) -> bool:
    """
    删除教员就业汇总
    """
    db_summary = db.query(神殿后端教员就业汇总表).filter(神殿后端教员就业汇总表.汇总ID == 汇总ID).first()
    
    if not db_summary:
        return False
    
    db.delete(db_summary)
    db.commit()
    return True


def 自动统计教员就业数据(
    db: Session,
    神殿: str,
    教员姓名: str,
    班级名称: str,
) -> Dict:
    """
    从班级就业明细表自动统计教员的就业数据
    
    返回统计结果：
    - 实际就业人数：该班级的就业记录数
    - 实际平均就业薪资：该班级的平均转正金额
    - 薪资过万人数：转正金额 >= 10000 的人数
    - 就业率：需要班级总人数来计算（暂时返回 None）
    """
    # 查询该班级的就业记录
    employment_records = db.query(班级就业明细表).filter(
        and_(
            班级就业明细表.神殿 == 神殿,
            班级就业明细表.班级名称 == 班级名称
        )
    ).all()
    
    if not employment_records:
        return {
            "实际就业人数": 0,
            "实际平均就业薪资": None,
            "薪资过万人数": 0,
            "就业率": None,
        }
    
    # 统计实际就业人数
    实际就业人数 = len(employment_records)
    
    # 计算平均转正金额（使用转正金额或回访转正金额）
    total_salary = 0.0
    valid_salary_count = 0
    薪资过万人数 = 0
    
    for record in employment_records:
        # 优先使用回访转正金额，如果没有则使用转正金额
        salary = record.回访转正金额 if record.回访转正金额 else record.转正金额
        
        if salary:
            total_salary += float(salary)
            valid_salary_count += 1
            if float(salary) >= 10000:
                薪资过万人数 += 1
    
    实际平均就业薪资 = total_salary / valid_salary_count if valid_salary_count > 0 else None
    
    # 就业率需要班级总人数，暂时返回 None（需要从 ClassProfile 获取）
    # 可以后续扩展，从 ClassProfile 获取班级总人数
    
    return {
        "实际就业人数": 实际就业人数,
        "实际平均就业薪资": 实际平均就业薪资,
        "薪资过万人数": 薪资过万人数,
        "就业率": None,  # 需要班级总人数来计算
    }


def 批量自动填充教员就业汇总(
    db: Session,
    神殿: str,
    教员姓名: Optional[str] = None,
    班级名称: Optional[str] = None,
) -> Dict:
    """
    批量自动填充教员就业汇总数据
    
    根据教员班级关联表和班级就业明细表，自动统计并填充数据
    """
    # 查询教员班级关联
    query = db.query(TeacherClassAssignment).join(
        TeacherProfile, TeacherClassAssignment.teacher_id == TeacherProfile.id
    ).join(
        ClassProfile, TeacherClassAssignment.class_id == ClassProfile.id
    )
    
    # 过滤条件
    if 神殿:
        # 按班级所属神殿过滤
        query = query.filter(ClassProfile.campus_name == 神殿)
    
    if 教员姓名:
        query = query.filter(TeacherProfile.name == 教员姓名)
    
    if 班级名称:
        # ClassProfile 使用 class_name 字段存储班级名称
        query = query.filter(ClassProfile.class_name == 班级名称)
    
    assignments = query.all()
    
    results = []
    for assignment in assignments:
        teacher = db.query(TeacherProfile).filter(TeacherProfile.id == assignment.teacher_id).first()
        class_info = db.query(ClassProfile).filter(ClassProfile.id == assignment.class_id).first()
        
        if not teacher or not class_info:
            continue
        
        # 获取神殿信息
        campus = class_info.campus_name or 神殿
        
        # 如果指定了神殿，需要过滤
        if 神殿 and campus != 神殿:
            continue
        
        # 获取专业信息
        major_name = ""
        if class_info.major_id:
            major = db.query(MajorProfile).filter(MajorProfile.id == class_info.major_id).first()
            if major:
                major_name = major.name
        
        # 自动统计就业数据
        stats = 自动统计教员就业数据(db, campus, teacher.name, class_info.class_name)
        
        # 检查是否已存在记录
        existing = db.query(神殿后端教员就业汇总表).filter(
            and_(
                神殿后端教员就业汇总表.神殿 == campus,
                神殿后端教员就业汇总表.教员姓名 == teacher.name,
                神殿后端教员就业汇总表.班级名称 == class_info.class_name
            )
        ).first()
        
        if existing:
            # 更新现有记录
            更新教员就业汇总(db, existing.汇总ID, {
                "实际就业人数": stats["实际就业人数"],
                "实际平均就业薪资": stats["实际平均就业薪资"],
                "薪资过万人数": stats["薪资过万人数"],
            })
            results.append({
                "汇总ID": existing.汇总ID,
                "教员姓名": teacher.name,
                "班级名称": class_info.class_name,
                "操作": "更新",
                "统计结果": stats,
            })
        else:
            # 创建新记录（学制暂时使用默认值，可以从其他地方获取或让用户填写）
            new_record = 创建或更新教员就业汇总(
                db=db,
                神殿=campus,
                教员姓名=teacher.name,
                专业=major_name,
                学制="",  # 需要从其他地方获取或让用户填写
                班级名称=class_info.class_name,
                实际就业人数=stats["实际就业人数"],
                实际平均就业薪资=stats["实际平均就业薪资"],
                薪资过万人数=stats["薪资过万人数"],
            )
            results.append({
                "汇总ID": new_record.汇总ID,
                "教员姓名": teacher.name,
                "班级名称": class_info.class_name,
                "操作": "创建",
                "统计结果": stats,
            })
    
    return {
        "处理数量": len(results),
        "结果": results,
    }


def 根据教员班级关联自动生成表格(
    db: Session,
    神殿: str,
    年份: Optional[int] = None,
    月份: Optional[int] = None,
) -> Dict:
    """
    根据教员-班级关联表自动生成教员就业汇总表格
    
    1. 从config schema的teacher_class_assignments表获取教员-班级关联关系
    2. 从academic schema的班级就业总结表获取就业数据
    3. 自动生成或更新教员就业汇总表记录
    """
    from datetime import datetime
    
    # 如果没有指定年份和月份，使用当前年月
    if not 年份:
        年份 = datetime.now().year
    if not 月份:
        月份 = datetime.now().month
    
    # 查询该神殿的教员-班级关联
    query = db.query(TeacherClassAssignment).join(
        TeacherProfile, TeacherClassAssignment.teacher_id == TeacherProfile.id
    ).join(
        ClassProfile, TeacherClassAssignment.class_id == ClassProfile.id
    ).filter(
        ClassProfile.campus_name == 神殿
    )
    
    assignments = query.all()
    
    results = []
    created_count = 0
    updated_count = 0
    
    for assignment in assignments:
        teacher = db.query(TeacherProfile).filter(TeacherProfile.id == assignment.teacher_id).first()
        class_info = db.query(ClassProfile).filter(ClassProfile.id == assignment.class_id).first()
        
        if not teacher or not class_info:
            continue
        
        # 确保神殿匹配
        if class_info.campus_name != 神殿:
            continue
        
        # 获取专业信息
        major_name = ""
        if class_info.major_id:
            major = db.query(MajorProfile).filter(MajorProfile.id == class_info.major_id).first()
            if major:
                major_name = major.name  # 注意：MajorProfile 的字段名是 name 不是 major_name
        
        # 从班级就业总结表获取数据（获取最新的记录）
        class_summary = db.query(班级就业总结表).filter(
            and_(
                班级就业总结表.神殿 == 神殿.replace('神殿',''),
                班级就业总结表.班级名称 == class_info.class_name
            )
        ).order_by(
            班级就业总结表.年份.desc(),
            班级就业总结表.月份.desc()
        ).first()
        
        # 从“班级就业明细表”统计薪资过万人数（该字段不在班级就业总结表中）
        # 注意：不影响其它字段口径，其它字段仍以 academic."班级就业总结表" 为准。
        stats_salary = 自动统计教员就业数据(db, 神殿, teacher.name, class_info.class_name)
        
        # 检查是否已存在记录
        existing = db.query(神殿后端教员就业汇总表).filter(
            and_(
                神殿后端教员就业汇总表.神殿 == 神殿,
                神殿后端教员就业汇总表.教员姓名 == teacher.name,
                神殿后端教员就业汇总表.班级名称 == class_info.class_name
            )
        ).first()
        
        # 准备数据
        data_to_save = {
            "神殿": 神殿,
            "教员姓名": teacher.name,
            "专业": major_name,
            "学制": "",  # 可以从 ClassProfile 或其他地方获取
            "班级名称": class_info.class_name,
            # 以下字段统一从“班级就业总结表”获取，不兜底
            "目标平均就业薪资": None,
            "实际平均就业薪资": None,
            "达标率": None,
            "目标就业人数": None,
            "实际就业人数": None,
            "就业率": None,
            # 薪资过万人数从班级就业明细表统计
            "薪资过万人数": stats_salary.get("薪资过万人数", 0),
        }
        
        # 如果班级就业总结表有数据，使用其中的数据
        if class_summary:
            data_to_save.update({
                "目标平均就业薪资": float(class_summary.目标平均薪资) if class_summary.目标平均薪资 else None,
                "实际平均就业薪资": float(class_summary.实际平均薪资) if class_summary.实际平均薪资 else None,
                "目标就业人数": class_summary.目标就业人数,
                "实际就业人数": class_summary.实际就业人数,
                "就业率": float(class_summary.实际就业率) if class_summary.实际就业率 is not None else None,
            })
            
            # 计算达标率：实际平均薪资 / 目标平均薪资 * 100%
            if data_to_save["目标平均就业薪资"] and data_to_save["实际平均就业薪资"] and data_to_save["目标平均就业薪资"] > 0:
                data_to_save["达标率"] = (data_to_save["实际平均就业薪资"] / data_to_save["目标平均就业薪资"]) * 100
            
            # 如果总结表中有实际就业率，优先使用总结表的值
            if class_summary.实际就业率 is not None:
                data_to_save["就业率"] = float(class_summary.实际就业率)
            # 否则根据档案人数计算
            elif class_summary.档案人数 and class_summary.档案人数 > 0:
                data_to_save["就业率"] = (class_summary.实际就业人数 / class_summary.档案人数) * 100 if class_summary.实际就业人数 else 0
        
        if existing:
            # 更新现有记录
            更新教员就业汇总(db, existing.汇总ID, data_to_save)
            updated_count += 1
            results.append({
                "汇总ID": existing.汇总ID,
                "教员姓名": teacher.name,
                "班级名称": class_info.class_name,
                "操作": "更新",
                "数据": data_to_save,
            })
        else:
            # 创建新记录
            new_record = 创建或更新教员就业汇总(
                db=db,
                神殿=data_to_save["神殿"],
                教员姓名=data_to_save["教员姓名"],
                专业=data_to_save["专业"],
                学制=data_to_save["学制"],
                班级名称=data_to_save["班级名称"],
                实际就业人数=data_to_save.get("实际就业人数"),
                实际平均就业薪资=data_to_save.get("实际平均就业薪资"),
                薪资过万人数=data_to_save.get("薪资过万人数"),
                目标就业人数=data_to_save.get("目标就业人数"),
                目标平均就业薪资=data_to_save.get("目标平均就业薪资"),
                达标率=data_to_save.get("达标率"),
                就业率=data_to_save.get("就业率"),
            )
            created_count += 1
            results.append({
                "汇总ID": new_record.汇总ID,
                "教员姓名": teacher.name,
                "班级名称": class_info.class_name,
                "操作": "创建",
                "数据": data_to_save,
            })
    
    return {
        "处理数量": len(results),
        "创建数量": created_count,
        "更新数量": updated_count,
        "结果": results,
    }


def 获取教员就业可用年份列表(
    db: Session,
    神殿: Optional[str] = None,
) -> List[int]:
    """
    获取教员就业汇总表的可用年份列表（从毕业时间字段提取）
    毕业时间格式为 YYYY-MM
    """
    query = db.query(神殿后端教员就业汇总表.毕业时间).filter(
        神殿后端教员就业汇总表.毕业时间.isnot(None),
        神殿后端教员就业汇总表.毕业时间 != "",
    )
    if 神殿:
        query = query.filter(神殿后端教员就业汇总表.神殿 == 神殿)
    
    records = query.distinct().all()
    
    # 从毕业时间字段提取年份（格式 YYYY-MM）
    years = set()
    for r in records:
        if r.毕业时间 and len(r.毕业时间) >= 4:
            try:
                year = int(r.毕业时间[:4])
                years.add(year)
            except ValueError:
                pass
    
    year_list = sorted(years, reverse=True)
    
    # 如果没有数据，返回当前年份
    if not year_list:
        from datetime import datetime
        year_list = [datetime.now().year]
    
    return year_list


def 获取教员就业历史汇总数据(
    db: Session,
    神殿: Optional[str] = None,
) -> Dict:
    """
    获取教员就业历史汇总数据（所有年份合计）
    """
    query = db.query(
        func.count(神殿后端教员就业汇总表.汇总ID).label("total_teachers"),
        func.sum(神殿后端教员就业汇总表.目标就业人数).label("total_target"),
        func.sum(神殿后端教员就业汇总表.实际就业人数).label("total_actual"),
        func.avg(神殿后端教员就业汇总表.目标平均就业薪资).label("avg_target_salary"),
        func.avg(神殿后端教员就业汇总表.实际平均就业薪资).label("avg_actual_salary"),
        func.sum(神殿后端教员就业汇总表.薪资过万人数).label("total_high_salary"),
    )
    if 神殿:
        query = query.filter(神殿后端教员就业汇总表.神殿 == 神殿)
    
    result = query.first()
    
    if not result or result.total_teachers is None:
        return {
            "totalTeachers": 0,
            "totalTargetEmployment": 0,
            "totalActualEmployment": 0,
            "avgTargetSalary": 0.0,
            "avgActualSalary": 0.0,
            "avgEmploymentRate": 0.0,
            "avgAchievementRate": 0.0,
            "totalHighSalary": 0,
        }
    
    total_target = int(result.total_target or 0)
    total_actual = int(result.total_actual or 0)
    avg_target_salary = float(result.avg_target_salary or 0)
    avg_actual_salary = float(result.avg_actual_salary or 0)
    
    employment_rate = (total_actual / total_target * 100) if total_target > 0 else 0
    achievement_rate = (avg_actual_salary / avg_target_salary * 100) if avg_target_salary > 0 else 0
    
    return {
        "totalTeachers": int(result.total_teachers or 0),
        "totalTargetEmployment": total_target,
        "totalActualEmployment": total_actual,
        "avgTargetSalary": avg_target_salary,
        "avgActualSalary": avg_actual_salary,
        "avgEmploymentRate": employment_rate,
        "avgAchievementRate": achievement_rate,
        "totalHighSalary": int(result.total_high_salary or 0),
    }