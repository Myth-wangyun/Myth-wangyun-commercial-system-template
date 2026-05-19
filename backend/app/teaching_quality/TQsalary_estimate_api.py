"""
教学质量模块 - QT班级薪资预估表 API
路由：/api/v1/teaching-quality/qt-salary-estimate
"""
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Body, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_teaching_quality_db as get_db
from app.teaching_quality.TQ_salary_estimate_db import (
    fetch_qt_salary_as_blocks as fetch_as_blocks,
)
from app.teaching_quality.TQ_salary_estimate_db import (
    fetch_qt_salary_rows as fetch_rows,
)
from app.teaching_quality.TQ_salary_estimate_db import (
    init_qt_salary_estimate_tables as init_tables,
)
from app.teaching_quality.TQ_salary_estimate_db import (
    replace_qt_salary_by_blocks as replace_by_blocks,
)
from app.teaching_quality.TQ_salary_estimate_db import (
    replace_qt_salary_rows as replace_rows,
)

router = APIRouter()

JsonBlock = dict[str, Any] | list[Any]


def _require_int(value: Any, field_name: str) -> int:
    if value is None:
        raise ValueError(f"{field_name} is required")
    return int(value)


def _require_str(value: Any, field_name: str) -> str:
    if value is None:
        raise ValueError(f"{field_name} is required")
    return str(value)


def _as_block(value: Any) -> JsonBlock | None:
    if isinstance(value, (dict, list)):
        return value
    return None


def _as_mapping(value: Any) -> dict[str, Any] | None:
    return value if isinstance(value, dict) else None


class Row(BaseModel):
    序号: int
    姓名: Optional[str] = None
    性别: Optional[str] = None
    出生年月: Optional[str] = None
    学历: Optional[str] = None
    专业: Optional[str] = None
    毕业学校: Optional[str] = None
    籍贯: Optional[str] = None

    QT专业名称: Optional[str] = None
    QT班主任姓名: Optional[str] = None
    QT强化教员姓名: Optional[str] = None

    QT考试成绩: Optional[JsonBlock] = None
    QT项目成绩: Optional[JsonBlock] = None
    QT答辩成绩: Optional[JsonBlock] = None
    QT老师综合评价: Optional[JsonBlock] = None

    出勤率: Optional[int] = None
    课堂表现评价: Optional[str] = None
    COT活动成绩: Optional[int] = None
    千分制: Optional[int] = None

    班主任评价: Optional[str] = None
    教员闫梦雷评价: Optional[str] = None
    教员杨再军评价: Optional[str] = None
    教员伍瑶评价: Optional[str] = None

    预估薪资: Optional[str] = None


class ListOut(BaseModel):
    神殿名称: str
    班级名称: str
    年份: int
    月份: int
    行列表: List[Row] = Field(default_factory=list)


@router.get("/qt-salary-estimate", summary="获取QT班级薪资预估表（按班级+年月）")
def get_qt_salary(
    campus: str = Query(..., alias="campus"),
    klass: str = Query(..., alias="class"),
    year: int = Query(..., alias="year"),
    month: int = Query(..., alias="month"),
    mode: str = Query("blocks", alias="mode"),  # blocks|rows （默认blocks，兼容前端新结构）
    db: Session = Depends(get_db),
):
    init_tables()
    if mode == "rows":
        rows = fetch_rows(db, 神殿名称=campus, 班级名称=klass, 年份=year, 月份=month)
        out = [
            Row(
                序号=r.序号,
                姓名=r.姓名,
                性别=r.性别,
                出生年月=r.出生年月,
                学历=r.学历,
                专业=r.专业,
                毕业学校=r.毕业学校,
                籍贯=r.籍贯,
                QT专业名称=r.QT专业名称,
                QT班主任姓名=r.QT班主任姓名,
                QT强化教员姓名=r.QT强化教员姓名,
                QT考试成绩=_as_block(r.QT考试成绩),
                QT项目成绩=_as_block(r.QT项目成绩),
                QT答辩成绩=_as_block(r.QT答辩成绩),
                QT老师综合评价=_as_block(r.QT老师综合评价),
                出勤率=r.出勤率,
                课堂表现评价=r.课堂表现评价,
                COT活动成绩=r.COT活动成绩,
                千分制=r.千分制,
                班主任评价=r.班主任评价,
                教员闫梦雷评价=r.教员闫梦雷评价,
                教员杨再军评价=r.教员杨再军评价,
                教员伍瑶评价=r.教员伍瑶评价,
                预估薪资=r.预估薪资,
            )
            for r in rows
        ]
        return ListOut(神殿名称=campus, 班级名称=klass, 年份=year, 月份=month, 行列表=out)

    # 默认返回新结构 blocks
    return fetch_as_blocks(db, 神殿名称=campus, 班级名称=klass, 年份=year, 月份=month)


@router.post("/qt-salary-estimate", summary="保存QT班级薪资预估表（按维度覆盖写入）")
def save_qt_salary(payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    init_tables()

    # 兼容两种结构：
    # 1) 旧结构：{ 神殿名称, 班级名称, 年份, 月份, 行列表 }
    # 2) 新结构：{ campus, class, year, month, 'QT考试成绩', 'QT项目成绩', 'QT答辩成绩', 'QT老师综合评价'?, meta }

    if "行列表" in payload:
        campus = _require_str(payload.get("神殿名称"), "神殿名称")
        klass = _require_str(payload.get("班级名称"), "班级名称")
        year = _require_int(payload.get("年份"), "年份")
        month = _require_int(payload.get("月份"), "月份")
        replace_rows(
            db,
            神殿名称=campus,
            班级名称=klass,
            年份=year,
            月份=month,
            行列表=payload.get("行列表") or [],
        )
        db.commit()
        rows = fetch_rows(db, 神殿名称=campus, 班级名称=klass, 年份=year, 月份=month)
        out = [
            Row(
                序号=r.序号,
                姓名=r.姓名,
                性别=r.性别,
                出生年月=r.出生年月,
                学历=r.学历,
                专业=r.专业,
                毕业学校=r.毕业学校,
                籍贯=r.籍贯,
                QT专业名称=r.QT专业名称,
                QT班主任姓名=r.QT班主任姓名,
                QT强化教员姓名=r.QT强化教员姓名,
                QT考试成绩=_as_block(r.QT考试成绩),
                QT项目成绩=_as_block(r.QT项目成绩),
                QT答辩成绩=_as_block(r.QT答辩成绩),
                QT老师综合评价=_as_block(r.QT老师综合评价),
                出勤率=r.出勤率,
                课堂表现评价=r.课堂表现评价,
                COT活动成绩=r.COT活动成绩,
                千分制=r.千分制,
                班主任评价=r.班主任评价,
                教员闫梦雷评价=r.教员闫梦雷评价,
                教员杨再军评价=r.教员杨再军评价,
                教员伍瑶评价=r.教员伍瑶评价,
                预估薪资=r.预估薪资,
            )
            for r in rows
        ]
        return ListOut(神殿名称=campus, 班级名称=klass, 年份=year, 月份=month, 行列表=out)

    # 新结构
    campus = _require_str(payload.get("campus") or payload.get("神殿名称"), "campus")
    klass = _require_str(payload.get("class") or payload.get("班级名称"), "class")
    year = _require_int(payload.get("year") or payload.get("年份"), "year")
    month = _require_int(payload.get("month") or payload.get("月份"), "month")

    exam_block = _as_mapping(payload.get("QT考试成绩")) or {}
    project_block = _as_mapping(payload.get("QT项目成绩")) or {}
    defense_block = _as_mapping(payload.get("QT答辩成绩")) or {}
    teacher_block = _as_mapping(payload.get("QT老师综合评价"))
    meta = payload.get("meta") or {}

    replace_by_blocks(
        db,
        神殿名称=campus,
        班级名称=klass,
        年份=year,
        月份=month,
        考试块=exam_block,
        项目块=project_block,
        答辩块=defense_block,
        教师块=teacher_block,
        元信息=meta,
    )
    db.commit()

    # 返回新结构
    return fetch_as_blocks(db, 神殿名称=campus, 班级名称=klass, 年份=year, 月份=month)
