"""
教学质量模块 - 口碑招生关键点年度明细【自动聚合】API

目的：
- 解决前端年度明细表加载时 12 * N 次请求导致卡顿的问题
- 从“口碑招生计划与执行统计表（工作自查表）”数据源（reputation-self-check）按年聚合

路由：/api/v1/teaching-quality/reputation-keypoint-yearly-aggregate
"""

from __future__ import annotations

from collections import defaultdict
from typing import List, Optional, Set, Tuple

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_teaching_quality_db as get_db
from app.teaching_quality.TQreputation_self_check_db import (
    init_reputation_self_check_tables,
)
from app.teaching_quality.TQreputation_self_check_db import (
    口碑工作自查表 as SelfCheckTable,
)

router = APIRouter()


class AggRow(BaseModel):
    月份: int
    类别: str  # 班主任姓名
    朋友圈数量: int = 0
    抖音数量: int = 0
    快手数量: int = 0
    小红书数量: int = 0
    在校生访谈: int = 0
    毕业生访谈: int = 0
    家长访谈: int = 0
    活动次数: int = 0
    比赛次数: int = 0
    送考报名次: int = 0


class AggList(BaseModel):
    神殿名称: str
    年份: int
    行列表: List[AggRow] = Field(default_factory=list)

# Manually rebuild the model to resolve forward references, as suggested by Pydantic error
AggList.model_rebuild()


def _to_int(v: Optional[str]) -> int:
    if v is None:
        return 0
    s = str(v).strip()
    if not s:
        return 0
    try:
        # 兼容 "1" / "1.0" / " 2 "
        return int(float(s))
    except Exception:
        return 0


@router.get(
    "/reputation-keypoint-yearly-aggregate",
    response_model=AggList,
    summary="按年从工作自查表自动聚合生成口碑招生关键点年度明细（用于前端快速加载）",
)
def get_yearly_aggregate(
    campus: str = Query(..., alias="campus"),
    year: int = Query(..., alias="year"),
    db: Session = Depends(get_db),
):
    """一次性聚合全年。

    注意：TQreputation_self_check_db.fetch_reputation_self_check_rows 要求必须传 月份/班主任姓名，
    因此这里直接用 SQLAlchemy 查询表模型，按维度聚合。
    """

    import traceback

    try:
        init_reputation_self_check_tables()

        # 一次性取出该神殿该年的所有单元格记录
        recs = (
            db.query(SelfCheckTable)
            .filter(SelfCheckTable.神殿名称 == campus, SelfCheckTable.年份 == year)
            .all()
        )

        # 统计活动次数需要“日”去重：key=(month, teacher, day)
        activity_days: Set[Tuple[int, str, int]] = set()

        # 聚合器：month -> teacher -> metrics
        agg: defaultdict[int, defaultdict[str, dict[str, int]]] = defaultdict(
            lambda: defaultdict(
                lambda: {
                    "朋友圈数量": 0,
                    "抖音数量": 0,
                    "快手数量": 0,
                    "小红书数量": 0,
                    "在校生访谈": 0,
                    "毕业生访谈": 0,
                    "家长访谈": 0,
                    "比赛次数": 0,
                    "送考报名次": 0,
                    # 活动次数单独用 activity_days 统计
                }
            )
        )

        for r in recs:
            m = int(getattr(r, "月份", 0) or 0)
            teacher = str(getattr(r, "班主任姓名", "") or "").strip()
            event = str(getattr(r, "事件", "") or "").strip()
            detail = str(getattr(r, "详细内容", "") or "").strip()
            day = int(getattr(r, "日序号", 0) or 0)
            val = getattr(r, "填写内容", None)

            if not (1 <= m <= 12) or not teacher:
                continue

            # 线上宣传四平台（数值累加）
            if event == "线上宣传" and detail in {"朋友圈数量", "抖音数量", "快手数量", "小红书数量"}:
                agg[m][teacher][detail] += _to_int(val)
                continue

            # 访谈数量（数值累加）
            if event == "访谈":
                if detail == "访谈新生数量" or detail == "访谈老生数量":
                    agg[m][teacher]["在校生访谈"] += _to_int(val)
                    continue
                if detail == "访谈毕业生数量":
                    agg[m][teacher]["毕业生访谈"] += _to_int(val)
                    continue
                if detail == "家长访谈数量":
                    agg[m][teacher]["家长访谈"] += _to_int(val)
                    continue

            # 活动次数：以“活动时间/地点”当日单元格非空 => 计 1 次（按天去重）
            if event == "活动" and detail == "活动时间/地点":
                if str(val or "").strip() and 1 <= day <= 31:
                    activity_days.add((m, teacher, day))
                continue

            # 比赛次数（数值累加）
            if event == "活动" and detail == "比赛次数":
                agg[m][teacher]["比赛次数"] += _to_int(val)
                continue

            # 送喜报人次（数值累加）
            if event == "活动" and detail == "送喜报人次":
                agg[m][teacher]["送考报名次"] += _to_int(val)
                continue

        out: List[AggRow] = []
        for m in sorted(agg.keys()):
            for teacher in sorted(agg[m].keys()):
                metrics = agg[m][teacher]
                act_cnt = sum(1 for (mm, tt, _d) in activity_days if mm == m and tt == teacher)

                out.append(
                    AggRow(
                        月份=m,
                        类别=teacher,
                        朋友圈数量=int(metrics["朋友圈数量"]),
                        抖音数量=int(metrics["抖音数量"]),
                        快手数量=int(metrics["快手数量"]),
                        小红书数量=int(metrics["小红书数量"]),
                        在校生访谈=int(metrics["在校生访谈"]),
                        毕业生访谈=int(metrics["毕业生访谈"]),
                        家长访谈=int(metrics["家长访谈"]),
                        活动次数=int(act_cnt),
                        比赛次数=int(metrics["比赛次数"]),
                        送考报名次=int(metrics["送考报名次"]),
                    )
                )

        return AggList(神殿名称=campus, 年份=year, 行列表=out)

    except Exception as e:
        print(
            f"[reputation-keypoint-yearly-aggregate] 500 error: campus={campus}, year={year}, err={e}"
        )
        traceback.print_exc()
        raise
