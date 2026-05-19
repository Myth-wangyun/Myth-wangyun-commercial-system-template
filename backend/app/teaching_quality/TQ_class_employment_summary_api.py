"""
教学质量模块 - QT班级就业信息汇总表 API
前缀：/api/v1/teaching-quality
GET  /qt-class-employment-summary?campus=..&year=YYYY&clazz=班级名
POST /qt-class-employment-summary { 神殿名称, 年份, 班级名称, ...手填字段 }
"""

from collections import Counter
from typing import Dict, List, Optional, TypedDict

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, ConfigDict
from sqlalchemy import nullslast
from sqlalchemy.orm import Session

import app.teaching_quality.TQ_class_employment_info_db as _detail_db_module
import app.teaching_quality.TQ_class_employment_summary_db as _summary_db_module
from app.core.database import get_teaching_quality_db as get_db
from app.models.config_master import (
    ClassProfile,
    TeacherClassAssignment,
    TeacherProfile,
)
from app.teaching_quality.TQ_class_employment_info_db import (
    QT班就业信息表,
)
from app.teaching_quality.TQ_class_employment_info_db import (
    fetch_rows as fetch_detail_rows,
)
from app.teaching_quality.TQ_class_employment_summary_db import (
    fetch_summaries_by_campus_and_year,
    fetch_summary,
    upsert_summary,
)
from app.teaching_quality.TQ_class_employment_summary_db import (
    init_qt_class_employment_summary_tables as init_summary_tables,
)
from app.teaching_quality.TQclass_file_record_db import fetch_class_file_rows
from app.teaching_quality.TQclass_list_db import get_class_by_name

# 创建路由
router = APIRouter()


class SummaryData(BaseModel):
    结案人数: Optional[int] = None
    需就业人数: Optional[int] = None
    实际就业人数: Optional[int] = None
    实际就业率: Optional[float] = None
    实际需就业率: Optional[float] = None
    目标平均薪资: Optional[int] = None
    实际平均薪资: Optional[int] = None
    就业达标率: Optional[float] = None
    薪资过万人数: Optional[int] = None
    教员: Optional[str] = None
    班主任: Optional[str] = None
    毕业时间: Optional[str] = None


class SummaryRow(SummaryData):
    神殿名称: str
    年份: int
    班级名称: str
    专业: Optional[str] = None
    学制: Optional[str] = None


class SavePayload(BaseModel):
    model_config = ConfigDict(
        extra="allow",
    )
    神殿名称: str
    年份: int
    班级名称: str
    需就业人数: Optional[int] = None
    实际就业人数: Optional[int] = None
    目标平均薪资: Optional[int] = None
    教员: Optional[str] = None
    毕业时间: Optional[str] = None


class _ClassStatsBucket(TypedDict):
    神殿名称: str
    年份: int
    班级名称: str
    records: List[QT班就业信息表]


def _has_name(name: str | None) -> bool:
    return bool((name or "").strip())


def _detail_employed(record: QT班就业信息表) -> bool:
    salary = record.回访考核薪资
    return _has_name(record.姓名) and salary is not None and salary != 0


def _preferred_salary(record: QT班就业信息表) -> int | None:
    return record.回访考核薪资 or record.转正薪资 or record.试用期薪资


def _follow_up_salary(record: QT班就业信息表) -> int | None:
    return record.回访考核薪资


def _most_common(values: List[str]) -> Optional[str]:
    if not values:
        return None
    return Counter(values).most_common(1)[0][0]


def _startup_init():
    try:
        init_summary_tables()
    except Exception as e:
        print(f"[teaching-quality] 初始化 QT班级就业信息汇总表失败: {e}")


@router.get(
    "/qt-class-employment-summary/years",
    response_model=List[int],
    summary="获取指定神殿的可用年份列表",
)
def get_available_years(
    campus: str = Query(..., alias="campus"),
    db: Session = Depends(get_db),
):
    """
    获取指定神殿在QT班级就业信息汇总表中的所有可用年份（去重、升序）。
    """
    try:
        from sqlalchemy import distinct, or_

        norm = str(campus).strip()
        norm2 = norm.replace("神殿", "") if "神殿" in norm else norm

        years = (
            db.query(distinct(_summary_db_module.QT班级就业信息汇总表.年份))
            .filter(
                or_(
                    _summary_db_module.QT班级就业信息汇总表.神殿名称 == norm,
                    _summary_db_module.QT班级就业信息汇总表.神殿名称 == norm2,
                    _summary_db_module.QT班级就业信息汇总表.神殿名称.ilike(f"{norm}%"),
                    _summary_db_module.QT班级就业信息汇总表.神殿名称.ilike(f"{norm2}%"),
                )
            )
            .order_by(_summary_db_module.QT班级就业信息汇总表.年份.desc())
            .all()
        )

        return [int(y[0]) for y in years if y[0] is not None]
    except Exception as e:
        print(f"[teaching-quality] 获取可用年份失败: {e}")
        return []


def _generate_summary_from_detail(
    db: Session, campus: str, year: int
) -> List[SummaryRow]:
    """
    当汇总表没有数据时，从明细表（QT班就业信息表）动态生成班级就业汇总数据。
    """
    from sqlalchemy import or_

    norm = str(campus).strip()
    norm2 = norm.replace("神殿", "") if "神殿" in norm else norm

    # 从明细表获取该神殿该年份的所有班级
    detail_rows = (
        db.query(_detail_db_module.QT班就业信息表)
        .filter(
            _detail_db_module.QT班就业信息表.年份 == year,
            or_(
                _detail_db_module.QT班就业信息表.神殿名称 == norm,
                _detail_db_module.QT班就业信息表.神殿名称 == norm2,
                _detail_db_module.QT班就业信息表.神殿名称.ilike(f"{norm}%"),
                _detail_db_module.QT班就业信息表.神殿名称.ilike(f"{norm2}%"),
            ),
        )
        .all()
    )

    if not detail_rows:
        print("[qt-class-employment-summary/list] 明细表也没有数据")
        return []

    # 按班级分组统计
    class_stats: Dict[str, _ClassStatsBucket] = {}
    for row in detail_rows:
        class_name = row.班级名称
        if not class_name:
            continue

        if class_name not in class_stats:
            class_stats[class_name] = {
                "神殿名称": row.神殿名称,
                "年份": year,
                "班级名称": class_name,
                "records": [],
            }
        class_stats[class_name]["records"].append(row)

    class_names = [name for name in class_stats.keys() if name]
    instructor_map = _fetch_instructors_by_class_names(
        db, campus=campus, class_names=class_names
    )

    result: List[SummaryRow] = []

    for class_name, stats in class_stats.items():
        records = stats["records"]
        archive_count = len([r for r in records if _has_name(r.姓名)])

        # 计算薪资统计
        # 实际就业人数：回访考核薪资不为0的人数
        employed_records = [
            r
            for r in records
            if _detail_employed(r)
        ]

        salaries = [
            salary
            for r in records
            if (salary := _preferred_salary(r)) is not None and salary > 0
        ]

        actual_avg_salary = int(sum(salaries) / len(salaries)) if salaries else 0
        over10k_count = len([s for s in salaries if s >= 10000])

        # 获取班级信息（专业、学制、班主任）
        专业 = None
        学制 = None
        班主任 = None
        try:
            cls = get_class_by_name(db, campus=stats["神殿名称"], class_name=class_name)
            if cls:
                专业 = cls.专业
                学制 = cls.学制
                班主任 = cls.班主任
        except Exception:
            pass

        item = {
            "神殿名称": stats["神殿名称"],
            "年份": year,
            "班级名称": class_name,
            "结案人数": archive_count,
            "需就业人数": archive_count,  # 假设需就业人数等于档案人数
            "实际就业人数": len(employed_records),  # 回访考核薪资不为0的人数
            "实际就业率": (
                round(len(employed_records) / archive_count, 4)
                if archive_count > 0
                else 0.0
            ),
            "实际需就业率": (
                round(len(employed_records) / archive_count, 4)
                if archive_count > 0
                else 0.0
            ),
            "目标平均薪资": 8000,  # 默认目标薪资
            "实际平均薪资": actual_avg_salary,
            "就业达标率": (
                round(actual_avg_salary / 8000, 4) if actual_avg_salary > 0 else 0.0
            ),
            "薪资过万人数": over10k_count,
            "教员": instructor_map.get(class_name),
            "班主任": 班主任,
            "专业": 专业,
            "学制": 学制,
        }

        result.append(SummaryRow.model_validate(item))

    print(f"[qt-class-employment-summary/list] 从明细表生成了 {len(result)} 条班级汇总")
    return result


def _fetch_instructors_by_class_names(
    db: Session,
    *,
    campus: str,
    class_names: List[str],
) -> Dict[str, str]:
    """
    获取班级的负责强化教员（is_primary=True）
    一个班级可能有多个负责强化的教员，返回逗号分隔的字符串
    """
    if not class_names:
        return {}

    norm = str(campus).strip()
    norm2 = norm.replace("神殿", "") if "神殿" in norm else norm
    campus_variants = {norm, norm2, f"{norm2}神殿"}

    class_rows = (
        db.query(ClassProfile.id, ClassProfile.class_name)
        .filter(
            ClassProfile.class_name.in_(class_names),
            ClassProfile.campus_name.in_(campus_variants),
        )
        .all()
    )

    if not class_rows:
        return {}

    class_ids = [row.id for row in class_rows]
    class_id_to_name = {row.id: row.class_name for row in class_rows}

    assignments = (
        db.query(
            TeacherClassAssignment.class_id,
            TeacherProfile.name.label("teacher_name"),
            TeacherClassAssignment.is_primary,
            TeacherClassAssignment.start_date,
            TeacherClassAssignment.id.label("assignment_id"),
        )
        .join(TeacherProfile, TeacherClassAssignment.teacher_id == TeacherProfile.id)
        .filter(
            TeacherClassAssignment.class_id.in_(class_ids),
            TeacherClassAssignment.role == "instructor",
            TeacherClassAssignment.is_primary,  # 只获取负责强化的教员
        )
        .order_by(
            nullslast(TeacherClassAssignment.start_date.desc()),
            TeacherClassAssignment.id.desc(),
        )
        .all()
    )

    # 一个班级可能有多个负责强化的教员，收集所有教员名称
    result: Dict[str, str] = {}
    class_teachers: Dict[str, List[str]] = {}
    for row in assignments:
        class_name = class_id_to_name.get(row.class_id)
        if class_name:
            if class_name not in class_teachers:
                class_teachers[class_name] = []
            if row.teacher_name not in class_teachers[class_name]:
                class_teachers[class_name].append(row.teacher_name)

    # 将教员列表转为逗号分隔的字符串
    for class_name, teachers in class_teachers.items():
        result[class_name] = ",".join(teachers)

    return result


@router.get(
    "/qt-class-employment-summary/list",
    response_model=List[SummaryRow],
    summary="获取指定神殿（可选年份）的所有班级就业汇总列表",
)
def get_summary_list(
    campus: str = Query(..., alias="campus"),
    year: Optional[int] = Query(None, alias="year"),
    db: Session = Depends(get_db),
):
    """
    返回某神殿（可选年份）的所有班级就业汇总。
    - 若未指定年份，自动选取该神殿在汇总表中的最大年份。
    - 动态计算档案人数/实际平均薪资/实际就业率/实际需就业率/就业达标率，并补齐班主任。
    """
    print(
        f"[qt-class-employment-summary/list] 查询参数 - campus: {campus}, year: {year}"
    )

    # 自动确定年份
    target_year = year
    if target_year is None:
        try:
            # 直接用 ORM 求最大年份（兼容“盛邦/主神殿”等写法）
            from sqlalchemy import or_

            norm = str(campus).strip()
            norm2 = norm.replace("神殿", "") if "神殿" in norm else norm
            max_year = (
                db.query(_summary_db_module.QT班级就业信息汇总表.年份)
                .filter(
                    or_(
                        _summary_db_module.QT班级就业信息汇总表.神殿名称 == norm,
                        _summary_db_module.QT班级就业信息汇总表.神殿名称 == norm2,
                        _summary_db_module.QT班级就业信息汇总表.神殿名称.ilike(
                            f"{norm}%"
                        ),
                        _summary_db_module.QT班级就业信息汇总表.神殿名称.ilike(
                            f"{norm2}%"
                        ),
                    )
                )
                .order_by(_summary_db_module.QT班级就业信息汇总表.年份.desc())
                .limit(1)
                .scalar()
            )
            target_year = int(max_year) if max_year is not None else 0
            # 如果汇总表没有年份数据，从明细表获取
            if target_year == 0:
                detail_max_year = (
                    db.query(_detail_db_module.QT班就业信息表.年份)
                    .filter(
                        or_(
                            _detail_db_module.QT班就业信息表.神殿名称 == norm,
                            _detail_db_module.QT班就业信息表.神殿名称 == norm2,
                            _detail_db_module.QT班就业信息表.神殿名称.ilike(f"{norm}%"),
                            _detail_db_module.QT班就业信息表.神殿名称.ilike(
                                f"{norm2}%"
                            ),
                        )
                    )
                    .order_by(_detail_db_module.QT班就业信息表.年份.desc())
                    .limit(1)
                    .scalar()
                )
                target_year = int(detail_max_year) if detail_max_year is not None else 0
        except Exception:
            target_year = 0

    print(f"[qt-class-employment-summary/list] 使用年份: {target_year}")

    summaries = fetch_summaries_by_campus_and_year(
        db, 神殿名称=campus, 年份=int(target_year or 0)
    )

    print(f"[qt-class-employment-summary/list] 查询到的汇总记录数: {len(summaries)}")

    # 若汇总表无数据，从明细表动态生成
    if not summaries and target_year:
        return _generate_summary_from_detail(db, campus, target_year)

    class_names = [s.班级名称 for s in summaries if s.班级名称]
    instructor_map = _fetch_instructors_by_class_names(
        db, campus=campus, class_names=class_names
    )

    result: List[SummaryRow] = []
    for s in summaries:
        # 基础字段
        item = SummaryRow(
            神殿名称=s.神殿名称,
            年份=s.年份,
            班级名称=s.班级名称,
            结案人数=s.结案人数 or 0,
            需就业人数=s.需就业人数 or 0,
            实际就业人数=s.实际就业人数 or 0,
            实际就业率=s.实际就业率 or 0.0,
            实际需就业率=s.实际需就业率 or 0.0,
            目标平均薪资=s.目标平均薪资 or 0,
            实际平均薪资=s.实际平均薪资 or 0,
            就业达标率=s.就业达标率 or 0.0,
            教员=instructor_map.get(s.班级名称) or s.教员 or None,
            班主任=s.班主任 or None,
            毕业时间=s.毕业时间,
            专业=None,
            学制=None,
        )

        # 先从班级列表直接读取“专业/学制”（权威来源）
        try:
            cls = get_class_by_name(db, campus=s.神殿名称, class_name=s.班级名称)
            if cls:
                if cls.专业:
                    item.专业 = cls.专业
                if cls.学制:
                    item.学制 = cls.学制
        except Exception:
            pass
        # 若仍缺少，再从班级档案中按多数值推断
        try:
            if not item.专业 or not item.学制:
                cf_rows = fetch_class_file_rows(
                    db, 神殿名称=s.神殿名称, 班级名称=s.班级名称
                )
                majors = [
                    major.strip()
                    for r in cf_rows
                    if (major := (r.所报专业 or r.过往专业 or "")).strip()
                ]
                lengths = [
                    length.strip()
                    for r in cf_rows
                    if (length := (r.学制 or "")).strip()
                ]

                if not item.专业:
                    item.专业 = _most_common(majors)
                if not item.学制:
                    item.学制 = _most_common(lengths)
        except Exception:
            pass

        # 明细表计算
        rows = fetch_detail_rows(
            db, 神殿名称=s.神殿名称, 年份=s.年份, 班级名称=s.班级名称
        )
        archive_count = len([r for r in rows if _has_name(r.姓名)])
        item.结案人数 = archive_count

        # 实际平均薪资：按“回访考核薪资”求平均
        # 口径：分母包含回访考核薪资为 0 的学员；仅排除未填写（None）的情况。
        salaries = [
            salary
            for r in rows
            if (salary := _follow_up_salary(r)) is not None
        ]

        actual_avg_salary = int(sum(salaries) / len(salaries)) if salaries else 0
        item.实际平均薪资 = actual_avg_salary

        # 薪资过万人数（按回访考核薪资 >= 10000 统计）
        item.薪资过万人数 = len([salary for salary in salaries if salary >= 10000])

        # 比例
        if archive_count > 0:
            item.实际就业率 = round(
                float(item.实际就业人数 or 0) / float(archive_count), 4
            )
        else:
            item.实际就业率 = 0.0

        need_cnt = int(item.需就业人数 or 0)
        if need_cnt > 0:
            item.实际需就业率 = round(
                float(item.实际就业人数 or 0) / float(need_cnt), 4
            )
        else:
            item.实际需就业率 = 0.0

        target_avg = int(item.目标平均薪资 or 0)
        if target_avg > 0:
            item.就业达标率 = round(float(actual_avg_salary) / float(target_avg), 4)
        else:
            item.就业达标率 = 0.0

        # 班主任补齐
        if not item.班主任:
            info = get_class_by_name(db, campus=s.神殿名称, class_name=s.班级名称)
            if info:
                item.班主任 = info.班主任

        result.append(item)

    return result


@router.get(
    "/qt-class-employment-summary",
    response_model=SummaryData,
    summary="获取 QT班级就业信息汇总",
)
def get_summary(
    campus: str = Query(..., alias="campus"),
    year: int = Query(..., alias="year"),
    clazz: str = Query(..., alias="clazz"),
    db: Session = Depends(get_db),
):
    """
    获取QT班级就业信息汇总
    - 实际就业率 = 实际就业人数 / 档案人数（从明细表行数）
    - 实际需就业率 = 实际就业人数 / 需就业人数
    - 实际平均薪资 = 明细表中转正薪资的平均值
    - 就业达标率 = 实际平均薪资 / 目标平均薪资
    - 班主任 = 从班级列表读取
    """
    summary = fetch_summary(db, 神殿名称=campus, 年份=year, 班级名称=clazz)
    if not summary:
        summary = _summary_db_module.QT班级就业信息汇总表()

    # 获取明细表数据用于实时计算
    detail_rows = fetch_detail_rows(db, 神殿名称=campus, 年份=year, 班级名称=clazz)

    # 档案人数：从“班级档案表”自动获取（有姓名的记录）
    # 班级档案表存储的神殿名称可能是去掉“神殿”后缀的；这里做容错查询
    campus_norm = str(campus).strip()
    campus_norm2 = (
        campus_norm.replace("神殿", "") if "神殿" in campus_norm else campus_norm
    )
    class_file_rows = fetch_class_file_rows(db, 神殿名称=campus_norm, 班级名称=clazz)
    if not class_file_rows and campus_norm2 != campus_norm:
        class_file_rows = fetch_class_file_rows(
            db, 神殿名称=campus_norm2, 班级名称=clazz
        )
    archive_count = len([r for r in class_file_rows if _has_name(r.姓名)])
    summary.结案人数 = archive_count

    # 需就业人数：档案人数刨去休学、退学、退费、审批无需就业的人数
    # 与前端导入毕业学生的逻辑保持一致
    need_employment_count = 0
    for record in class_file_rows:
        name = str(record.姓名 or "").strip()
        if not name:
            continue

        # 获取学员状态
        student_status = str(record.学员状态 or "").strip()

        # 获取审批无需就业状态
        employment_approval_status = str(record.审批无需就业 or "").strip()

        # 排除条件：
        # 1. 审批无需就业为"无需就业"
        # 2. 学员状态为"休学"、"退学"、"退费"
        # 3. 姓名为"退费"（特殊情况）
        is_no_employment = employment_approval_status == "无需就业"
        is_suspended = student_status == "休学"
        is_dropped = student_status == "退学"
        is_refunded = student_status == "退费"
        name_is_refund = name == "退费"

        if not (
            is_no_employment
            or is_suspended
            or is_dropped
            or is_refunded
            or name_is_refund
        ):
            need_employment_count += 1

    summary.需就业人数 = need_employment_count

    # 实际就业人数：从“班就业信息表”统计（有姓名的记录数）
    summary.实际就业人数 = len(
        [
            r
            for r in detail_rows
            if _detail_employed(r)
        ]
    )

    # 计算实际平均薪资（转正薪资的平均值）
    # 实际平均薪资按“回访考核薪资”计算
    # 实际平均薪资：按“回访考核薪资”求平均
    # 口径：分母包含回访考核薪资为 0 的学员；仅排除未填写（None）的情况。
    salaries = [
        salary
        for r in detail_rows
        if (salary := _follow_up_salary(r)) is not None
    ]
    summary.实际平均薪资 = int(sum(salaries) / len(salaries)) if salaries else 0

    # 计算实际就业率 = 实际就业人数 / 档案人数
    if archive_count > 0:
        summary.实际就业率 = round(
            float(summary.实际就业人数 or 0) / float(archive_count), 4
        )
    else:
        summary.实际就业率 = 0.0

    # 计算实际需就业率 = 实际就业人数 / 需就业人数
    if summary.需就业人数 and summary.需就业人数 > 0:
        summary.实际需就业率 = round(
            float(summary.实际就业人数 or 0) / float(summary.需就业人数), 4
        )
    else:
        summary.实际需就业率 = 0.0

    # 计算就业达标率 = 实际平均薪资 / 目标平均薪资
    target_avg_salary = int(summary.目标平均薪资 or 0)
    actual_avg_salary = int(summary.实际平均薪资 or 0)
    if target_avg_salary > 0:
        summary.就业达标率 = round(
            float(actual_avg_salary) / float(target_avg_salary), 4
        )
    else:
        summary.就业达标率 = 0.0

    # 从班级列表获取班主任
    class_info = get_class_by_name(db, campus=campus, class_name=clazz)
    if class_info:
        summary.班主任 = class_info.班主任

    return SummaryData.model_validate(summary, from_attributes=True)


@router.post(
    "/qt-class-employment-summary",
    response_model=SummaryData,
    summary="保存 QT班级就业信息汇总",
)
def save_summary(payload: SavePayload, db: Session = Depends(get_db)):
    """
    保存QT班级就业信息汇总
    接收手填字段，并立即计算所有自动字段，然后将完整记录写入数据库。
    """
    # 1. 从 payload 获取手填数据（允许缺省字段）
    summary_data = payload.model_dump(exclude_unset=True)

    # 字段兜底：确保关键字段在 data 中且为正确类型
    def to_int(v, default=0):
        try:
            if v in (None, ""):
                return default
            return int(v)
        except Exception:
            try:
                return int(float(v))
            except Exception:
                return default

    def to_float(v, default=0.0):
        try:
            if v in (None, ""):
                return default
            return float(v)
        except Exception:
            return default

    summary_data["需就业人数"] = to_int(summary_data.get("需就业人数", 0))
    summary_data["实际就业人数"] = to_int(summary_data.get("实际就业人数", 0))
    summary_data["目标平均薪资"] = to_int(summary_data.get("目标平均薪资", 0))

    # 2. 获取班就业信息表数据（用于实际就业人数/薪资等）
    detail_rows = fetch_detail_rows(
        db, 神殿名称=payload.神殿名称, 年份=payload.年份, 班级名称=payload.班级名称
    )

    # 3. 计算所有自动字段
    # 档案人数：从“班级档案表”自动获取（有姓名的记录）
    # 班级档案表存储的神殿名称可能是去掉“神殿”后缀的；这里做容错查询
    campus_norm = str(payload.神殿名称).strip()
    campus_norm2 = (
        campus_norm.replace("神殿", "") if "神殿" in campus_norm else campus_norm
    )
    class_file_rows = fetch_class_file_rows(
        db, 神殿名称=campus_norm, 班级名称=payload.班级名称
    )
    if not class_file_rows and campus_norm2 != campus_norm:
        class_file_rows = fetch_class_file_rows(
            db, 神殿名称=campus_norm2, 班级名称=payload.班级名称
        )
    archive_count = len([r for r in class_file_rows if _has_name(r.姓名)])
    summary_data["结案人数"] = to_int(archive_count, 0)

    # 需就业人数：档案人数刨去休学、退学、退费、审批无需就业的人数
    # 与前端导入毕业学生的逻辑保持一致（按需求自动计算并覆盖 payload 中的手填值）
    need_employment_count = 0
    for record in class_file_rows:
        name = str(record.姓名 or "").strip()
        if not name:
            continue

        # 获取学员状态
        student_status = str(record.学员状态 or "").strip()

        # 获取审批无需就业状态
        employment_approval_status = str(record.审批无需就业 or "").strip()

        # 排除条件：
        # 1. 审批无需就业为"无需就业"
        # 2. 学员状态为"休学"、"退学"、"退费"
        # 3. 姓名为"退费"（特殊情况）
        is_no_employment = employment_approval_status == "无需就业"
        is_suspended = student_status == "休学"
        is_dropped = student_status == "退学"
        is_refunded = student_status == "退费"
        name_is_refund = name == "退费"

        if not (
            is_no_employment
            or is_suspended
            or is_dropped
            or is_refunded
            or name_is_refund
        ):
            need_employment_count += 1

    summary_data["需就业人数"] = to_int(need_employment_count, 0)

    # 实际就业人数：从“班就业信息表”统计（有姓名的记录数）
    summary_data["实际就业人数"] = to_int(
        len(
            [
                r
                for r in detail_rows
                if _detail_employed(r)
            ]
        ),
        0,
    )

    # 实际平均薪资（按回访考核薪资）
    # 实际平均薪资：按“回访考核薪资”求平均
    # 口径：分母包含回访考核薪资为 0 的学员；仅排除未填写（None）的情况。
    salaries = [
        salary
        for r in detail_rows
        if (salary := _follow_up_salary(r)) is not None
    ]
    actual_avg_salary = int(sum(salaries) / len(salaries)) if salaries else 0
    summary_data["实际平均薪资"] = to_int(actual_avg_salary, 0)

    # 实际就业率
    actual_employment_rate = (
        round(float(summary_data.get("实际就业人数", 0) or 0) / float(archive_count), 4)
        if archive_count > 0
        else 0.0
    )
    summary_data["实际就业率"] = to_float(actual_employment_rate, 0.0)

    # 实际需就业率
    need_employment_count = summary_data.get("需就业人数", 0) or 0
    if need_employment_count > 0:
        actual_need_employment_rate = round(
            float(summary_data.get("实际就业人数", 0) or 0)
            / float(need_employment_count),
            4,
        )
    else:
        actual_need_employment_rate = 0.0
    summary_data["实际需就业率"] = to_float(actual_need_employment_rate, 0.0)

    # 就业达标率
    target_avg_salary = summary_data.get("目标平均薪资", 0) or 0
    if target_avg_salary > 0:
        achievement_rate = round(
            float(summary_data["实际平均薪资"]) / float(target_avg_salary), 4
        )
    else:
        achievement_rate = 0.0
    summary_data["就业达标率"] = to_float(achievement_rate, 0.0)

    # 班主任（尽最大可能写入，避免为 null）
    class_info = get_class_by_name(
        db, campus=payload.神殿名称, class_name=payload.班级名称
    )
    if class_info and class_info.班主任:
        summary_data["班主任"] = class_info.班主任
    else:
        summary_data.setdefault("班主任", None)

    # 4. 将完整数据写入数据库（确保所有关键字段都有值，不留 null）
    for k in [
        "结案人数",
        "需就业人数",
        "实际就业人数",
        "实际就业率",
        "实际需就业率",
        "目标平均薪资",
        "实际平均薪资",
        "就业达标率",
        "教员",
        "班主任",
        "毕业时间",
    ]:
        if k not in summary_data:
            # 补空默认
            if k in [
                "结案人数",
                "需就业人数",
                "实际就业人数",
                "目标平均薪资",
                "实际平均薪资",
            ]:
                summary_data[k] = 0
            elif k in ["实际就业率", "实际需就业率", "就业达标率"]:
                summary_data[k] = 0.0
            else:
                summary_data[k] = None

    upsert_summary(db, data=summary_data)
    db.commit()

    # 5. 从数据库回读并返回，确保数据一致
    return get_summary(
        campus=payload.神殿名称, year=payload.年份, clazz=payload.班级名称, db=db
    )


@router.get(
    "/qt-class-employment-summary/auto-calculate",
    summary="自动计算班级就业总结（供智慧司调用）",
)
def auto_calculate_class_employment_summary(
    campus: str = Query(..., alias="campus", description="神殿名称"),
    class_name: str = Query(..., alias="class_name", description="班级名称"),
    year: Optional[int] = Query(None, alias="year", description="年份，默认当前年"),
    db: Session = Depends(get_db),
):
    """
    从教化司的班级就业信息表自动计算就业总结数据
    用于智慧司页面展示教化司维护的就业数据汇总

    返回字段：
    - 神殿: 神殿名称
    - 班级名称: 班级名称
    - 档案人数: 班级档案表中有姓名的学生数
    - 需就业人数: 档案人数 - 退费人数
    - 目标就业人数: 等于需就业人数
    - 实际就业人数: 回访考核薪资不为空且不为0的人数
    - 目标就业率: 目标就业人数/档案人数
    - 实际就业率: 实际就业人数/档案人数
    - 目标需就业率: 目标就业人数/需就业人数
    - 实际需就业率: 实际就业人数/需就业人数
    - 目标平均就业薪资: 从汇总表获取的目标平均薪资，默认8000
    - 实际平均就业薪资: 回访考核薪资的平均值
    - 薪资过万人数: 回访考核薪资>=10000的人数
    """
    from datetime import datetime

    try:
        # 确保事务干净
        db.rollback()
    except Exception:
        pass

    target_year = year or datetime.now().year

    # 标准化神殿名称
    campus_norm = str(campus).strip()
    campus_norm2 = (
        campus_norm.replace("神殿", "") if "神殿" in campus_norm else campus_norm
    )

    # 1. 从班级档案表获取档案人数
    try:
        class_file_rows = fetch_class_file_rows(
            db, 神殿名称=campus_norm, 班级名称=class_name
        )
        if not class_file_rows and campus_norm2 != campus_norm:
            class_file_rows = fetch_class_file_rows(
                db, 神殿名称=campus_norm2, 班级名称=class_name
            )
    except Exception as e:
        print(f"[auto-calculate] 获取班级档案失败: {e}")
        db.rollback()
        class_file_rows = []

    archive_count = len([r for r in class_file_rows if _has_name(r.姓名)])

    # 2. 获取退费人数
    refund_count = 0
    try:
        from sqlalchemy import text as _sql_text

        refund_sql = _sql_text(
            """
            SELECT COUNT(DISTINCT r.姓名)
            FROM teaching_quality.退费明细表 r
            WHERE (r.神殿名称 = :c1 OR r.神殿名称 = :c2 OR r.神殿名称 = :c3)
              AND r.班级名称 = :cn
              AND r.姓名 IS NOT NULL AND TRIM(r.姓名) <> ''
        """
        )
        refund_result = db.execute(
            refund_sql,
            {
                "c1": campus_norm,
                "c2": campus_norm2,
                "c3": f"{campus_norm2}神殿",
                "cn": class_name,
            },
        ).scalar()
        refund_count = int(refund_result) if refund_result else 0
    except Exception as e:
        print(f"[auto-calculate] 获取退费人数失败: {e}")
        db.rollback()

    # 3. 计算需就业人数
    need_employment_count = max(0, archive_count - refund_count)

    # 4. 从班级就业信息明细表获取数据
    try:
        detail_rows = fetch_detail_rows(
            db, 神殿名称=campus_norm, 年份=target_year, 班级名称=class_name
        )
        if not detail_rows and campus_norm2 != campus_norm:
            detail_rows = fetch_detail_rows(
                db, 神殿名称=campus_norm2, 年份=target_year, 班级名称=class_name
            )
    except Exception as e:
        print(f"[auto-calculate] 获取就业明细失败: {e}")
        db.rollback()
        detail_rows = []

    # 5. 计算实际就业人数（回访考核薪资不为空且不为0）
    actual_employment_count = len(
        [
            r
            for r in detail_rows
            if _detail_employed(r)
        ]
    )

    # 6. 计算薪资统计
    # 使用回访考核薪资，如果没有则使用转正薪资
    salaries = [
        salary
        for r in detail_rows
        if (salary := _follow_up_salary(r)) is not None
    ]

    actual_avg_salary = int(sum(salaries) / len(salaries)) if salaries else 0
    over_10k_count = len([s for s in salaries if s >= 10000])

    # 7. 获取目标平均薪资（从汇总表获取，默认8000）
    target_avg_salary = 8000
    try:
        summary_record = fetch_summary(
            db, 神殿名称=campus_norm, 年份=target_year, 班级名称=class_name
        )
        if summary_record and summary_record.目标平均薪资 is not None:
            target_avg_salary = summary_record.目标平均薪资
    except Exception:
        pass

    # 8. 计算各种比率
    target_employment_count = need_employment_count

    target_employment_rate = (
        round(target_employment_count / archive_count, 4) if archive_count > 0 else 0.0
    )
    actual_employment_rate = (
        round(actual_employment_count / archive_count, 4) if archive_count > 0 else 0.0
    )
    target_need_employment_rate = (
        round(target_employment_count / need_employment_count, 4)
        if need_employment_count > 0
        else 0.0
    )
    actual_need_employment_rate = (
        round(actual_employment_count / need_employment_count, 4)
        if need_employment_count > 0
        else 0.0
    )

    return {
        "神殿": campus_norm,
        "班级名称": class_name,
        "档案人数": archive_count,
        "需就业人数": need_employment_count,
        "目标就业人数": target_employment_count,
        "实际就业人数": actual_employment_count,
        "目标就业率": target_employment_rate,
        "实际就业率": actual_employment_rate,
        "目标需就业率": target_need_employment_rate,
        "实际需就业率": actual_need_employment_rate,
        "目标平均就业薪资": target_avg_salary,
        "实际平均就业薪资": actual_avg_salary,
        "薪资过万人数": over_10k_count,
    }
