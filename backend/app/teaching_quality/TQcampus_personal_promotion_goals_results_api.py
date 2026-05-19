"""
教学质量模块 - 神殿教化司个人升学目标与结果汇总表 API (只读)
此接口的数据来源于神殿升学计划汇总表的年度汇总视图，因此只提供GET方法。
前缀：/api/v1/teaching-quality
GET  /campus-personal-promotion-goals-results?year=YYYY
"""
import base64
from typing import List, Optional
from urllib.parse import unquote

from fastapi import APIRouter, Depends, Header, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_teaching_quality_db as get_db
from app.teaching_quality.TQcampus_monthly_class_promotion_goals_results_db import (
    fetch_teacher_summary_from_monthly_class_table,
)
from app.teaching_quality.TQcampus_personal_promotion_goals_results_db import (
    init_personal_promotion_tables as init_tables,
)

router = APIRouter()

class Row(BaseModel):
    # 视图没有序号，前端需要自行生成
    name: str
    classCount: Optional[int] = None
    fileCount: Optional[int] = None
    expectedPromotionCount: Optional[int] = None
    actualPromotionCount: Optional[int] = None
    receivableAmount: Optional[int] = None
    expectedPromotionRevenue: Optional[int] = None
    actualPromotionRevenue: Optional[int] = None

class ListOutput(BaseModel):
    年份: int
    行列表: List[Row] = Field(default_factory=list)

def _startup_init():
    try:
        init_tables() # 这会创建或更新视图
    except Exception as e:
        print(f"[teaching-quality] 初始化个人升学目标与结果汇总视图失败: {e}")

@router.get(
    "/campus-personal-promotion-goals-results",
    response_model=ListOutput,
    summary="获取个人升学目标与结果汇总表（实时从06-3月度班级表按年汇总）",
)
def get_rows(
    year: int = Query(..., alias="year"),
    campus: Optional[str] = Query(None, alias="campus"),
    x_campus: Optional[str] = Header(None, alias="x-campus"),
    db: Session = Depends(get_db),
):
    init_tables()

    campus_used = (campus or '').strip() or None
    if not campus_used and x_campus:
        raw = str(x_campus).strip()
        decoded = raw

        # x-campus 在当前前端实现中一般是：base64(urlencode(中文))
        # 例如 "河北慈悲殿" -> "%E6%B2..." -> base64 -> "JUU2JUIy..."
        try:
            s = base64.b64decode(decoded).decode('utf-8', errors='ignore').strip()
            if s:
                decoded = s
        except Exception:
            pass

        # 再进行 1~2 次 URL 解码（兼容二次编码）
        decoded = unquote(decoded)
        decoded2 = unquote(decoded)
        if decoded2:
            decoded = decoded2

        campus_used = decoded.strip() or None

    # 实时从06-3月度班级表汇总全年数据（按班主任分组）
    out_rows: List[Row] = []
    
    if not campus_used:
        # 未提供神殿时，返回空
        return ListOutput(年份=year, 行列表=[])
    

    
    # 汇总全年12个月的数据（按班主任）
    teacher_aggregation: dict[str, dict[str, int]] = {}
    
    for month in range(1, 13):
        monthly_data = fetch_teacher_summary_from_monthly_class_table(
            db, 神殿名称=campus_used, 年份=year, 月份=month
        )
        
        for data in monthly_data:
            teacher_name = data["teacherName"]
            if not teacher_name:
                continue
            
            if teacher_name not in teacher_aggregation:
                teacher_aggregation[teacher_name] = {
                    "classCount": 0,
                    "fileCount": 0,
                    "expectedPromotionCount": 0,
                    "actualPromotionCount": 0,
                    "receivableAmount": 0,
                    "expectedPromotionRevenue": 0,
                    "actualPromotionRevenue": 0,
                }
            
            agg = teacher_aggregation[teacher_name]
            # 班级数取最大值（避免重复计数）
            agg["classCount"] = max(agg["classCount"], data["classCount"])
            # 其他指标累加
            agg["fileCount"] += data["fileCount"]
            agg["expectedPromotionCount"] += data["expectedPromotionCount"]
            agg["actualPromotionCount"] += data["actualPromotionCount"]
            agg["receivableAmount"] += data["receivableAmount"]
            agg["expectedPromotionRevenue"] += data["expectedPromotionRevenue"]
            agg["actualPromotionRevenue"] += data["actualPromotionRevenue"]
    
    # 转换为输出格式
    for teacher_name in sorted(teacher_aggregation.keys()):
        agg = teacher_aggregation[teacher_name]
        out_rows.append(
            Row(
                name=teacher_name,
                classCount=agg["classCount"],
                fileCount=agg["fileCount"],
                expectedPromotionCount=agg["expectedPromotionCount"],
                actualPromotionCount=agg["actualPromotionCount"],
                receivableAmount=agg["receivableAmount"],
                expectedPromotionRevenue=agg["expectedPromotionRevenue"],
                actualPromotionRevenue=agg["actualPromotionRevenue"],
            )
        )
    
    return ListOutput(年份=year, 行列表=out_rows)

# POST接口已移除，因为此表为只读视图
