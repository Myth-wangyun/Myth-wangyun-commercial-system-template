"""
神殿智慧司员工业绩逐月统计表 - 就业数据自动获取

依据 academic."神殿后端教员就业汇总表" 聚合计算每位教员在指定年份的就业率与平均就业薪资。
聚合逻辑：
- 过滤条件：神殿必填；毕业时间包含年份（YYYY 或 YYYY-MM）可选。
- 按教员姓名 + 月份分组：
  * 月份来自 "毕业时间" 字段（支持 "YYYY-MM" 或 "YYYY-MM-DD"）；解析失败则跳过。
  * 就业率 = 实际就业人数之和 / 目标就业人数之和 * 100（分母为 0 返回 None）。
  * 平均就业薪资：取实际平均就业薪资非空值的均值（简单均值；如需加权可再扩展）。
返回字段：teacher_name, month (1-12), employment_rate, employment_salary, actual_count, target_count
"""

from typing import Dict, List, Optional, TypedDict

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ....core.database import get_db
from ....models.teacher_employment_summary import 神殿后端教员就业汇总表

class _MonthRec(TypedDict):
    actual_sum: float
    target_sum: float
    salary_list: list[float]


router = APIRouter()


def parse_month(value: Optional[str]) -> Optional[int]:
    if not value:
        return None
    try:
        parts = value.strip().split("-")
        if len(parts) >= 2:
            month = int(parts[1])
            if 1 <= month <= 12:
                return month
    except Exception:
        return None
    return None


@router.get("/", summary="获取教员月度就业统计")
def get_staff_monthly_employment_stats(
    神殿: Optional[str] = Query(None, description="神殿名称", alias="神殿"),
    campus: Optional[str] = Query(None, description="神殿名称（英文参数）", alias="campus"),
    年份: Optional[int] = Query(None, description="年份，如 2025", alias="year"),
    db: Session = Depends(get_db),
) -> List[Dict]:
    try:
        target_campus = 神殿 or campus
        if not target_campus:
            raise HTTPException(status_code=400, detail="缺少神殿参数")

        # 支持神殿名称模糊匹配（带"神殿"后缀或不带）
        campus_variants = [target_campus]
        if target_campus.endswith("神殿"):
            campus_variants.append(target_campus[:-2])  # 去掉"神殿"后缀
        else:
            campus_variants.append(f"{target_campus}神殿")  # 添加"神殿"后缀

        from sqlalchemy import or_
        query = db.query(神殿后端教员就业汇总表).filter(
            or_(*[神殿后端教员就业汇总表.神殿 == v for v in campus_variants])
        )
        if 年份:
            prefix = f"{年份}"
            query = query.filter(神殿后端教员就业汇总表.毕业时间.like(f"{prefix}%"))

        rows = query.all()
        agg: Dict[str, Dict[int, _MonthRec]] = {}

        for row in rows:
            month = parse_month(row.毕业时间)
            if month is None:
                continue
            teacher = row.教员姓名 or ""
            if not teacher:
                continue
            teacher_map = agg.setdefault(teacher, {})
            rec = teacher_map.setdefault(month, _MonthRec(
                actual_sum=0.0,
                target_sum=0.0,
                salary_list=[],
            ))

            if row.实际就业人数 is not None:
                rec["actual_sum"] += float(row.实际就业人数)
            if row.目标就业人数 is not None:
                rec["target_sum"] += float(row.目标就业人数)
            if row.实际平均就业薪资 is not None:
                rec["salary_list"].append(float(row.实际平均就业薪资))

        result: List[Dict] = []
        for teacher, month_map in agg.items():
            for month, rec in month_map.items():
                actual = rec["actual_sum"]
                target = rec["target_sum"]
                rate = None
                if target > 0:
                    rate = round((actual / target) * 100, 2)
                salary = None
                if rec["salary_list"]:
                    salary = round(sum(rec["salary_list"]) / len(rec["salary_list"]), 2)
                result.append({
                    "teacher_name": teacher,
                    "month": month,
                    "employment_rate": rate,
                    "employment_salary": salary,
                    "actual_employment_count": actual,
                    "target_employment_count": target,
                })

        # 按教员、月份排序
        result.sort(key=lambda x: (x["teacher_name"], x["month"]))
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取教员月度就业统计失败: {str(e)}")
