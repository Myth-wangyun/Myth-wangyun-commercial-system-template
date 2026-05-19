"""
教学质量模块 - 学员压力面试成绩登记表 API
路由：/api/v1/teaching-quality/class-pressure-interview-score
"""
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_teaching_quality_db as get_db
from app.teaching_quality.TQclass_pressure_interview_score_db import (
    fetch_class_pressure_interview_rows as fetch_rows,
)
from app.teaching_quality.TQclass_pressure_interview_score_db import (
    init_class_pressure_interview_score_tables as init_tables,
)
from app.teaching_quality.TQclass_pressure_interview_score_db import (
    replace_class_pressure_interview_rows as replace_rows,
)

router = APIRouter()


class ProjectScore(BaseModel):
    日期: Optional[str] = None
    教员1分: Optional[float] = None
    教员2分: Optional[float] = None
    教员3分: Optional[float] = None
    班主任1分: Optional[float] = None
    班主任2分: Optional[float] = None
    平均分: Optional[float] = None


class ScoreRow(BaseModel):
    学号: str
    学员姓名: Optional[str] = None
    项目1: ProjectScore = Field(default_factory=ProjectScore)
    项目2: ProjectScore = Field(default_factory=ProjectScore)
    项目3: ProjectScore = Field(default_factory=ProjectScore)
    项目4: ProjectScore = Field(default_factory=ProjectScore)
    项目5: ProjectScore = Field(default_factory=ProjectScore)


class Header(BaseModel):
    强化人数: Optional[int] = None
    面试次数: Optional[int] = None
    应面试数量: Optional[int] = None
    实际面试数量: Optional[int] = None
    合格数量: Optional[int] = None
    教员姓名: Optional[str] = None
    班主任姓名: Optional[str] = None


class ScoreList(BaseModel):
    神殿名称: str
    专业名称: str
    班级名称: str
    课程名称: str
    年份: int
    月份: int
    表头: Header = Field(default_factory=Header)
    行列表: List[ScoreRow] = Field(default_factory=list)


@router.get("/class-pressure-interview-score", response_model=ScoreList, summary="获取学员压力面试成绩登记表")
def get_scores(
    campus: str = Query(..., alias="campus"),
    major: str = Query(..., alias="major"),
    klass: str = Query(..., alias="class"),
    course: str = Query(..., alias="course"),
    year: int = Query(..., alias="year"),
    month: int = Query(..., alias="month"),
    db: Session = Depends(get_db),
):
    init_tables()
    recs = fetch_rows(
        db,
        神殿名称=campus,
        专业名称=major,
        班级名称=klass,
        课程名称=course,
        年份=year,
        月份=month,
    )
    header = Header()
    rows: List[ScoreRow] = []
    for r in recs:
        header.强化人数 = header.强化人数 or r.强化人数
        header.面试次数 = header.面试次数 or r.面试次数
        header.应面试数量 = header.应面试数量 or r.应面试数量
        header.实际面试数量 = header.实际面试数量 or r.实际面试数量
        header.合格数量 = header.合格数量 or r.合格数量
        header.教员姓名 = header.教员姓名 or r.教员姓名
        header.班主任姓名 = header.班主任姓名 or r.班主任姓名

        rows.append(
            ScoreRow(
                学号=r.学号,
                学员姓名=r.学员姓名,
                项目1=ProjectScore(
                    日期=r.项目1日期,
                    教员1分=r.项目1教员1分,
                    教员2分=r.项目1教员2分,
                    教员3分=r.项目1教员3分,
                    班主任1分=r.项目1班主任1分,
                    班主任2分=r.项目1班主任2分,
                    平均分=r.项目1平均分,
                ),
                项目2=ProjectScore(
                    日期=r.项目2日期,
                    教员1分=r.项目2教员1分,
                    教员2分=r.项目2教员2分,
                    教员3分=r.项目2教员3分,
                    班主任1分=r.项目2班主任1分,
                    班主任2分=r.项目2班主任2分,
                    平均分=r.项目2平均分,
                ),
                项目3=ProjectScore(
                    日期=r.项目3日期,
                    教员1分=r.项目3教员1分,
                    教员2分=r.项目3教员2分,
                    教员3分=r.项目3教员3分,
                    班主任1分=r.项目3班主任1分,
                    班主任2分=r.项目3班主任2分,
                    平均分=r.项目3平均分,
                ),
                项目4=ProjectScore(
                    日期=r.项目4日期,
                    教员1分=r.项目4教员1分,
                    教员2分=r.项目4教员2分,
                    教员3分=r.项目4教员3分,
                    班主任1分=r.项目4班主任1分,
                    班主任2分=r.项目4班主任2分,
                    平均分=r.项目4平均分,
                ),
                项目5=ProjectScore(
                    日期=r.项目5日期,
                    教员1分=r.项目5教员1分,
                    教员2分=r.项目5教员2分,
                    教员3分=r.项目5教员3分,
                    班主任1分=r.项目5班主任1分,
                    班主任2分=r.项目5班主任2分,
                    平均分=r.项目5平均分,
                ),
            )
        )

    return ScoreList(
        神殿名称=campus,
        专业名称=major,
        班级名称=klass,
        课程名称=course,
        年份=year,
        月份=month,
        表头=header,
        行列表=rows,
    )


class SavePayload(BaseModel):
    神殿名称: str
    专业名称: str
    班级名称: str
    课程名称: str
    年份: int
    月份: int
    表头: Header
    行列表: List[ScoreRow] = Field(default_factory=list)


@router.post("/class-pressure-interview-score", response_model=ScoreList, summary="保存学员压力面试成绩登记表（覆盖写入）")
def save_scores(payload: SavePayload, db: Session = Depends(get_db)):
    init_tables()
    # 将行列表转换为 DB 写入结构
    def row_to_dict(r: ScoreRow) -> Dict[str, Any]:
        def p(ps: ProjectScore) -> Dict[str, Any]:
            return {
                "日期": ps.日期,
                "教员1分": ps.教员1分,
                "教员2分": ps.教员2分,
                "教员3分": ps.教员3分,
                "班主任1分": ps.班主任1分,
                "班主任2分": ps.班主任2分,
                "平均分": ps.平均分,
            }
        return {
            "学号": r.学号,
            "学员姓名": r.学员姓名,
            "项目1": p(r.项目1),
            "项目2": p(r.项目2),
            "项目3": p(r.项目3),
            "项目4": p(r.项目4),
            "项目5": p(r.项目5),
        }

    replace_rows(
        db,
        神殿名称=payload.神殿名称,
        专业名称=payload.专业名称,
        班级名称=payload.班级名称,
        课程名称=payload.课程名称,
        年份=payload.年份,
        月份=payload.月份,
        表头=payload.表头.model_dump(),
        行列表=[row_to_dict(r) for r in payload.行列表],
    )
    db.commit()

    # 回读
    return get_scores(
        campus=payload.神殿名称,
        major=payload.专业名称,
        klass=payload.班级名称,
        course=payload.课程名称,
        year=payload.年份,
        month=payload.月份,
        db=db,
    )
