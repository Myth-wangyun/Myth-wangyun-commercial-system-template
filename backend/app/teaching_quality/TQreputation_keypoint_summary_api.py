"""
教学质量模块 - 口碑招生关键点结果汇总表 API
路由：/api/v1/teaching-quality/reputation-keypoint-summary
"""
from typing import Dict, List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.database import get_teaching_quality_db as get_db
from app.teaching_quality.TQreputation_keypoint_summary_db import (
    fetch_reputation_keypoint_rows,
    init_reputation_keypoint_tables,
)
from app.teaching_quality.TQreputation_keypoint_yearly_db import (
    init_reputation_keypoint_yearly_tables,
)
from app.teaching_quality.TQreputation_self_check_db import init_reputation_self_check_tables

router = APIRouter()


# ===== Schemas =====
class KeypointRow(BaseModel):
    序号: int
    班主任姓名: Optional[str] = None
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
    行类型: str = "data"


class KeypointList(BaseModel):
    神殿名称: str
    年份: int
    月份: Optional[int] = None
    行列表: List[KeypointRow] = Field(default_factory=list)


@router.get("/reputation-keypoint-summary", response_model=KeypointList, summary="获取口碑招生关键点结果汇总表（只读，来自自查明细统计）")
def get_keypoint_summary(
    campus: str = Query(..., alias="campus"),
    year: int = Query(..., alias="year"),
    month: int | None = Query(None, alias="month"),
    db: Session = Depends(get_db),
):
    init_reputation_keypoint_tables()
    # 确保明细表存在
    try:
        init_reputation_self_check_tables()
    except Exception:
        pass
    try:
        init_reputation_keypoint_yearly_tables()
    except Exception:
        pass

    # 若传入了月份，优先读取该月的已保存汇总（作为权威展示）；若未传入月份，则按整年统计
    if month is not None:
        existing = fetch_reputation_keypoint_rows(db, 神殿名称=campus, 年份=year, 月份=month)
        if existing:
            out = [
                KeypointRow(
                    序号=r.序号,
                    班主任姓名=r.班主任姓名,
                    朋友圈数量=r.朋友圈数量 or 0,
                    抖音数量=r.抖音数量 or 0,
                    快手数量=r.快手数量 or 0,
                    小红书数量=r.小红书数量 or 0,
                    在校生访谈=r.在校生访谈 or 0,
                    毕业生访谈=r.毕业生访谈 or 0,
                    家长访谈=r.家长访谈 or 0,
                    活动次数=r.活动次数 or 0,
                    比赛次数=r.比赛次数 or 0,
                    送考报名次=r.送考报名次 or 0,
                    行类型=r.行类型 or "data",
                )
                for r in existing
            ]
            return KeypointList(神殿名称=campus, 年份=year, 月份=month, 行列表=out)

    def _calc_rows() -> List[KeypointRow]:
        # 1) 优先：年度明细表（很多库已有数据）
        yearly_rows = []
        try:
            if month is None:
                yearly_sql = text(
                    'SELECT 类别 AS 班主任姓名,'
                    ' COALESCE(SUM(朋友圈数量),0) AS 朋友圈数量,'
                    ' COALESCE(SUM(抖音数量),0) AS 抖音数量,'
                    ' COALESCE(SUM(快手数量),0) AS 快手数量,'
                    ' COALESCE(SUM(小红书数量),0) AS 小红书数量,'
                    ' COALESCE(SUM(在校生访谈),0) AS 在校生访谈,'
                    ' COALESCE(SUM(毕业生访谈),0) AS 毕业生访谈,'
                    ' COALESCE(SUM(家长访谈),0) AS 家长访谈,'
                    ' COALESCE(SUM(活动次数),0) AS 活动次数,'
                    ' COALESCE(SUM(比赛次数),0) AS 比赛次数,'
                    ' COALESCE(SUM(送考报名次),0) AS 送考报名次'
                    ' FROM teaching_quality."口碑招生关键点年度明细表"'
                    ' WHERE 神殿名称 = :campus AND 年份 = :year'
                    ' GROUP BY 类别'
                )
                yearly_rows = db.execute(yearly_sql, {"campus": campus, "year": year}).mappings().all()
            else:
                yearly_sql = text(
                    'SELECT 类别 AS 班主任姓名,'
                    ' COALESCE(SUM(朋友圈数量),0) AS 朋友圈数量,'
                    ' COALESCE(SUM(抖音数量),0) AS 抖音数量,'
                    ' COALESCE(SUM(快手数量),0) AS 快手数量,'
                    ' COALESCE(SUM(小红书数量),0) AS 小红书数量,'
                    ' COALESCE(SUM(在校生访谈),0) AS 在校生访谈,'
                    ' COALESCE(SUM(毕业生访谈),0) AS 毕业生访谈,'
                    ' COALESCE(SUM(家长访谈),0) AS 家长访谈,'
                    ' COALESCE(SUM(活动次数),0) AS 活动次数,'
                    ' COALESCE(SUM(比赛次数),0) AS 比赛次数,'
                    ' COALESCE(SUM(送考报名次),0) AS 送考报名次'
                    ' FROM teaching_quality."口碑招生关键点年度明细表"'
                    ' WHERE 神殿名称 = :campus AND 年份 = :year AND 月份 = :month'
                    ' GROUP BY 类别'
                )
                yearly_rows = db.execute(yearly_sql, {"campus": campus, "year": year, "month": month}).mappings().all()
        except Exception:
            yearly_rows = []
        if yearly_rows:
            rows = [
                KeypointRow(
                    序号=i + 1,
                    班主任姓名=(r.get('班主任姓名') or '').strip() or '合计',
                    朋友圈数量=int(r.get('朋友圈数量') or 0),
                    抖音数量=int(r.get('抖音数量') or 0),
                    快手数量=int(r.get('快手数量') or 0),
                    小红书数量=int(r.get('小红书数量') or 0),
                    在校生访谈=int(r.get('在校生访谈') or 0),
                    毕业生访谈=int(r.get('毕业生访谈') or 0),
                    家长访谈=int(r.get('家长访谈') or 0),
                    活动次数=int(r.get('活动次数') or 0),
                    比赛次数=int(r.get('比赛次数') or 0),
                    送考报名次=int(r.get('送考报名次') or 0),
                    行类型="data",
                )
                for i, r in enumerate(sorted(yearly_rows, key=lambda x: (x.get('班主任姓名') or '')))
            ]
            return rows

        # 2) 次选：口碑工作自查表（单元格明细汇总）
        try:
            if month is None:
                detail_sql = text(
                    'SELECT 班主任姓名, 事件, 详细内容, 填写内容 '
                    'FROM teaching_quality."口碑工作自查表" '
                    'WHERE 神殿名称 = :campus AND 年份 = :year'
                )
                result = db.execute(detail_sql, {"campus": campus, "year": year})
            else:
                detail_sql = text(
                    'SELECT 班主任姓名, 事件, 详细内容, 填写内容 '
                    'FROM teaching_quality."口碑工作自查表" '
                    'WHERE 神殿名称 = :campus AND 年份 = :year AND 月份 = :month'
                )
                result = db.execute(detail_sql, {"campus": campus, "year": year, "month": month})
            detail_rows = result.mappings().all()
        except Exception:
            detail_rows = []

        def _to_int(v) -> int:
            try:
                if v is None:
                    return 0
                s = str(v).strip()
                if s == "":
                    return 0
                # 仅保留数字和小数点
                import re
                s2 = re.sub(r"[^0-9\.]+", "", s)
                if s2 == "":
                    return 0
                if "." in s2:
                    from decimal import Decimal
                    try:
                        return int(Decimal(s2).quantize(0))
                    except Exception:
                        return 0
                return int(s2)
            except Exception:
                return 0

        def _norm(s: str) -> str:
            return (s or "").strip()

        agg: Dict[str, Dict[str, int]] = {}
        for r in detail_rows:
            t = _norm(r.get("班主任姓名"))
            if not t:
                # 跳过无班主任记录
                continue
            ev = _norm(r.get("事件"))
            de = _norm(r.get("详细内容"))
            val = _to_int(r.get("填写内容"))
            row = agg.setdefault(
                t,
                {
                    "朋友圈数量": 0,
                    "抖音数量": 0,
                    "快手数量": 0,
                    "小红书数量": 0,
                    "在校生访谈": 0,
                    "毕业生访谈": 0,
                    "家长访谈": 0,
                    "活动次数": 0,
                    "比赛次数": 0,
                    "送考报名次": 0,
                },
            )
            # 线上宣传
            if "线上" in ev or "宣传" in ev:
                if "朋友圈" in de:
                    row["朋友圈数量"] += val
                elif "抖音" in de:
                    row["抖音数量"] += val
                elif "快手" in de:
                    row["快手数量"] += val
                elif "小红书" in de:
                    row["小红书数量"] += val
            # 访谈
            if "访谈" in ev:
                if "在校" in de or "在校生" in de:
                    row["在校生访谈"] += val
                elif "毕业" in de or "毕业生" in de:
                    row["毕业生访谈"] += val
                elif "家长" in de:
                    row["家长访谈"] += val
            # 活动
            if "活动" in ev:
                if "活动次数" in de or ("活动" in de and "次数" in de):
                    row["活动次数"] += val if val > 0 else 1
                if "比赛" in de:
                    row["比赛次数"] += val if val > 0 else 1
                if "送考报名" in de or "送喜报" in de:
                    row["送考报名次"] += val if val > 0 else 1

        rows = [
            KeypointRow(
                序号=i + 1,
                班主任姓名=name,
                朋友圈数量=v["朋友圈数量"],
                抖音数量=v["抖音数量"],
                快手数量=v["快手数量"],
                小红书数量=v["小红书数量"],
                在校生访谈=v["在校生访谈"],
                毕业生访谈=v["毕业生访谈"],
                家长访谈=v["家长访谈"],
                活动次数=v["活动次数"],
                比赛次数=v["比赛次数"],
                送考报名次=v["送考报名次"],
                行类型="data",
            )
            for i, (name, v) in enumerate(sorted(agg.items(), key=lambda x: x[0]))
        ]
        return rows

    try:
        rows = _calc_rows()
    except Exception as e:
        # 避免500，记录后返回空列表
        print(f"[reputation-keypoint-summary] 统计失败: {e}")
        rows = []
    return KeypointList(神殿名称=campus, 年份=year, 月份=month, 行列表=rows)


class KeypointSavePayload(BaseModel):
    神殿名称: str
    年份: int
    月份: int
    行列表: List[KeypointRow] = Field(default_factory=list)


@router.post("/reputation-keypoint-summary", response_model=KeypointList, summary="保存口碑招生关键点结果汇总表（只读：返回明细统计结果）")
def save_keypoint_summary(payload: KeypointSavePayload, db: Session = Depends(get_db)):
    # 彻底只读：不再写入汇总表，直接按明细统计并返回
    init_reputation_keypoint_tables()
    try:
        init_reputation_self_check_tables()
    except Exception:
        pass

    # 复用与 GET 相同的统计逻辑
    def _calc_rows() -> List[KeypointRow]:
        try:
            detail_sql = text(
                'SELECT 班主任姓名, 事件, 详细内容, 填写内容 '
                'FROM teaching_quality."口碑工作自查表" '
                'WHERE 神殿名称 = :campus AND 年份 = :year AND 月份 = :month'
            )
            result = db.execute(detail_sql, {"campus": payload.神殿名称, "year": payload.年份, "month": payload.月份})
            detail_rows = result.mappings().all()
        except Exception:
            detail_rows = []

        def _to_int(v) -> int:
            try:
                if v is None:
                    return 0
                s = str(v).strip()
                if s == "":
                    return 0
                import re
                s2 = re.sub(r"[^0-9\.]+", "", s)
                if s2 == "":
                    return 0
                if "." in s2:
                    from decimal import Decimal
                    try:
                        return int(Decimal(s2).quantize(0))
                    except Exception:
                        return 0
                return int(s2)
            except Exception:
                return 0

        def _norm(s: str) -> str:
            return (s or "").strip()

        agg: Dict[str, Dict[str, int]] = {}
        for r in detail_rows:
            t = _norm(r.get("班主任姓名"))
            if not t:
                continue
            ev = _norm(r.get("事件"))
            de = _norm(r.get("详细内容"))
            val = _to_int(r.get("填写内容"))
            row = agg.setdefault(
                t,
                {
                    "朋友圈数量": 0,
                    "抖音数量": 0,
                    "快手数量": 0,
                    "小红书数量": 0,
                    "在校生访谈": 0,
                    "毕业生访谈": 0,
                    "家长访谈": 0,
                    "活动次数": 0,
                    "比赛次数": 0,
                    "送考报名次": 0,
                },
            )
            if "线上" in ev or "宣传" in ev:
                if "朋友圈" in de:
                    row["朋友圈数量"] += val
                elif "抖音" in de:
                    row["抖音数量"] += val
                elif "快手" in de:
                    row["快手数量"] += val
                elif "小红书" in de:
                    row["小红书数量"] += val
            if "访谈" in ev:
                if "在校" in de or "在校生" in de:
                    row["在校生访谈"] += val
                elif "毕业" in de or "毕业生" in de:
                    row["毕业生访谈"] += val
                elif "家长" in de:
                    row["家长访谈"] += val
            if "活动" in ev:
                if "活动次数" in de or ("活动" in de and "次数" in de):
                    row["活动次数"] += val if val > 0 else 1
                if "比赛" in de:
                    row["比赛次数"] += val if val > 0 else 1
                if "送考报名" in de or "送喜报" in de:
                    row["送考报名次"] += val if val > 0 else 1

        rows: List[KeypointRow] = [
            KeypointRow(
                序号=i + 1,
                班主任姓名=name,
                朋友圈数量=v["朋友圈数量"],
                抖音数量=v["抖音数量"],
                快手数量=v["快手数量"],
                小红书数量=v["小红书数量"],
                在校生访谈=v["在校生访谈"],
                毕业生访谈=v["毕业生访谈"],
                家长访谈=v["家长访谈"],
                活动次数=v["活动次数"],
                比赛次数=v["比赛次数"],
                送考报名次=v["送考报名次"],
                行类型="data",
            )
            for i, (name, v) in enumerate(sorted(agg.items(), key=lambda x: x[0]))
        ]
        return rows

    rows = _calc_rows()
    return KeypointList(神殿名称=payload.神殿名称, 年份=payload.年份, 月份=payload.月份, 行列表=rows)

