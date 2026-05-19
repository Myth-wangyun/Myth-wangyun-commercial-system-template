"""
教学质量模块 - 口碑招生关键点年度明细 API
路由：/api/v1/teaching-quality/reputation-keypoint-yearly
"""
from collections import defaultdict
from typing import List

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_teaching_quality_db as get_db
from app.teaching_quality.TQreputation_keypoint_summary_db import (
    init_reputation_keypoint_tables,
    replace_reputation_keypoint_rows,
)
from app.teaching_quality.TQreputation_keypoint_yearly_db import (
    fetch_reputation_keypoint_yearly_rows,
    init_reputation_keypoint_yearly_tables,
    replace_reputation_keypoint_yearly_rows,
)

router = APIRouter()


# ===== Schemas =====
class YearlyRow(BaseModel):
    月份: int
    类别: str  # 老生/新生/毕业生
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


class YearlyList(BaseModel):
    神殿名称: str
    年份: int
    行列表: List[YearlyRow] = Field(default_factory=list)


@router.get("/reputation-keypoint-yearly", response_model=YearlyList, summary="获取口碑招生关键点年度明细")
def get_yearly_keypoints(
    campus: str = Query(..., alias="campus"),
    year: int = Query(..., alias="year"),
    db: Session = Depends(get_db),
):
    print(f"[reputation-keypoint-yearly] 开始获取: 神殿={campus}, 年份={year}")
    init_reputation_keypoint_yearly_tables()
    rows = fetch_reputation_keypoint_yearly_rows(db, 神殿名称=campus, 年份=year)
    print(f"[reputation-keypoint-yearly] 数据库查询到 {len(rows)} 行数据")
    out = [
        YearlyRow(
            月份=r.月份,
            类别=r.类别,
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
        )
        for r in rows
    ]
    response_data = YearlyList(神殿名称=campus, 年份=year, 行列表=out)
    print(f"[reputation-keypoint-yearly] 准备返回 {len(out)} 行数据给前端")
    return response_data


class YearlySavePayload(BaseModel):
    神殿名称: str
    年份: int
    行列表: List[YearlyRow] = Field(default_factory=list)


@router.post("/reputation-keypoint-yearly", response_model=YearlyList, summary="保存口碑招生关键点年度明细（按年覆盖写入，并同步写入月度汇总表）")
def save_yearly_keypoints(payload: YearlySavePayload, db: Session = Depends(get_db)):
    try:
        print(f"[reputation-keypoint-yearly] 开始保存: 神殿={payload.神殿名称}, 年份={payload.年份}, 行数={len(payload.行列表)}")
        
        # 1) 保存年度明细
        init_reputation_keypoint_yearly_tables()
        replace_reputation_keypoint_yearly_rows(
            db,
            神殿名称=payload.神殿名称,
            年份=payload.年份,
            行列表=[row.model_dump() for row in payload.行列表],
        )
        print("[reputation-keypoint-yearly] 年度明细保存完成，先行提交...")
        # 先提交年度明细，确保即使后续汇总失败也不会回滚
        db.commit()
        print("[reputation-keypoint-yearly] 年度明细提交完成")

        # 2) 从年度明细（本次 payload）按"月份+类别(教师)"聚合，写入月度汇总表（单独事务）
        try:
            init_reputation_keypoint_tables()
        except Exception as e:
            print(f"[reputation-keypoint-yearly] 初始化汇总表失败: {e}")
            pass

        # 聚合器: {月份: {教师: 指标字典}}
        agg_by_month: dict[int, dict[str, dict[str, int]]] = defaultdict(lambda: defaultdict(lambda: {
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
        }))

        for item in payload.行列表:
            m = int(item.月份 or 0)
            if m < 1 or m > 12:
                continue  # 跳过无效月份
            t = (item.类别 or "").strip() or "合计"
            agg = agg_by_month[m][t]
            agg["朋友圈数量"] += int(item.朋友圈数量 or 0)
            agg["抖音数量"] += int(item.抖音数量 or 0)
            agg["快手数量"] += int(item.快手数量 or 0)
            agg["小红书数量"] += int(item.小红书数量 or 0)
            agg["在校生访谈"] += int(item.在校生访谈 or 0)
            agg["毕业生访谈"] += int(item.毕业生访谈 or 0)
            agg["家长访谈"] += int(item.家长访谈 or 0)
            agg["活动次数"] += int(item.活动次数 or 0)
            agg["比赛次数"] += int(item.比赛次数 or 0)
            agg["送考报名次"] += int(item.送考报名次 or 0)

        # 逐月覆盖写入汇总表
        print(f"[reputation-keypoint-yearly] 开始写入月度汇总表，共 {len(agg_by_month)} 个月")
        for m, teacher_map in sorted(agg_by_month.items()):
            if not teacher_map:
                continue
            rows_for_month = []
            for idx, (teacher, vals) in enumerate(sorted(teacher_map.items(), key=lambda x: x[0]), start=1):
                rows_for_month.append({
                    "序号": idx,
                    "班主任姓名": teacher,
                    "朋友圈数量": vals["朋友圈数量"],
                    "抖音数量": vals["抖音数量"],
                    "快手数量": vals["快手数量"],
                    "小红书数量": vals["小红书数量"],
                    "在校生访谈": vals["在校生访谈"],
                    "毕业生访谈": vals["毕业生访谈"],
                    "家长访谈": vals["家长访谈"],
                    "活动次数": vals["活动次数"],
                    "比赛次数": vals["比赛次数"],
                    "送考报名次": vals["送考报名次"],
                    "行类型": "data",
                })
            print(f"[reputation-keypoint-yearly] 写入第 {m} 月汇总，共 {len(rows_for_month)} 行")
            replace_reputation_keypoint_rows(
                db,
                神殿名称=payload.神殿名称,
                年份=payload.年份,
                月份=int(m),
                行列表=rows_for_month,
            )

        # 一次性提交（年度明细 + 各月汇总）
        db.commit()
        print("[reputation-keypoint-yearly] 数据库提交成功")
        
        # 返回保存的数据（确保正确序列化）
        result = YearlyList(
            神殿名称=payload.神殿名称, 
            年份=payload.年份, 
            行列表=[YearlyRow(**row.model_dump()) for row in payload.行列表]
        )
        print("[reputation-keypoint-yearly] 准备返回响应")
        return result
        
    except Exception as e:
        db.rollback()
        print(f"[reputation-keypoint-yearly] 保存失败: {e}")
        import traceback
        traceback.print_exc()
        raise
