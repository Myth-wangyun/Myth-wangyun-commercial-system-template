"""
教学质量模块 - 神殿教化司招聘计划与总结汇总表 API
路由: /api/v1/teaching-quality/campus-recruitment-plan
"""
import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from app.core.database import get_teaching_quality_db as get_db
from app.core.database import safe_error_str
from app.teaching_quality import TQ_campus_recruitment_plan_summary_db as recruitment_db

router = APIRouter()


# ============ Pydantic 模型 ============

class RecruitmentPlanBase(BaseModel):
    """招聘计划基础模型"""
    神殿: str
    部门: Optional[str] = "教化司"
    岗位名称: str
    岗位类别: Optional[str] = None
    计划招聘人数: Optional[int] = 0
    计划招聘时间: Optional[datetime.date] = None
    
    实际招聘岗位名称: Optional[str] = None
    实际招聘人数: Optional[int] = 0
    实际招聘时间: Optional[datetime.date] = None
    招聘渠道: Optional[str] = None
    
    应聘人数: Optional[int] = 0
    面试人数: Optional[int] = 0
    录用人数: Optional[int] = 0
    录用率: Optional[float] = None
    
    招聘成本: Optional[float] = 0
    人均成本: Optional[float] = None

    # 入/离职信息
    入职者姓名: Optional[str] = None
    离职人数: Optional[int] = 0
    离职者姓名: Optional[str] = None
    
    入职后三个月留任率: Optional[float] = None
    半年留任率: Optional[float] = None
    一年留任率: Optional[float] = None
    
    招聘满意度评分: Optional[float] = None
    招聘满意度评价: Optional[str] = None
    
    招聘总结: Optional[str] = None
    存在的问题: Optional[str] = None
    改进措施: Optional[str] = None
    
    招聘负责人: Optional[str] = None
    审核人: Optional[str] = None
    
    备注: Optional[str] = None


class RecruitmentPlanCreate(RecruitmentPlanBase):
    """创建招聘计划请求"""
    model_config = ConfigDict(extra="ignore")


class RecruitmentPlanUpdate(BaseModel):
    """更新招聘计划请求"""
    神殿: Optional[str] = None
    部门: Optional[str] = None
    岗位名称: Optional[str] = None
    岗位类别: Optional[str] = None
    计划招聘人数: Optional[int] = None
    计划招聘时间: Optional[datetime.date] = None
    
    实际招聘人数: Optional[int] = None
    实际招聘时间: Optional[datetime.date] = None
    招聘渠道: Optional[str] = None
    
    应聘人数: Optional[int] = None
    面试人数: Optional[int] = None
    录用人数: Optional[int] = None
    录用率: Optional[float] = None
    
    招聘成本: Optional[float] = None
    人均成本: Optional[float] = None
    
    入职后三个月留任率: Optional[float] = None
    半年留任率: Optional[float] = None
    一年留任率: Optional[float] = None
    
    招聘满意度评分: Optional[float] = None
    招聘满意度评价: Optional[str] = None
    
    招聘总结: Optional[str] = None
    存在的问题: Optional[str] = None
    改进措施: Optional[str] = None
    
    招聘负责人: Optional[str] = None
    审核人: Optional[str] = None
    
    备注: Optional[str] = None
    
    model_config = ConfigDict(extra="ignore")


class RecruitmentPlanResponse(RecruitmentPlanBase):
    """招聘计划响应"""
    id: int
    创建时间: Optional[datetime.datetime] = None
    更新时间: Optional[datetime.datetime] = None
    
    model_config = ConfigDict(from_attributes=True)


class RecruitmentStatisticsResponse(BaseModel):
    """招聘统计响应"""
    总招聘数: int
    计划招聘总人数: float
    实际招聘总人数: float
    总应聘人数: float
    总面试人数: float
    总录用人数: float
    平均录用率: float
    总招聘成本: float
    平均人均成本: float
    平均满意度评分: float


# ============ 启动事件 ============

def _startup_init():
    """启动时初始化表"""
    try:
        recruitment_db.init_db_table()
    except Exception as e:
        print(f"[警告] 初始化神殿教化司招聘计划表失败: {safe_error_str(e)}")


# ============ API 端点 ============

@router.get(
    "/campus-recruitment-plan",
    summary="获取招聘计划列表",
    response_model=List[RecruitmentPlanResponse]
)
def read_recruitment_list(
    campus: Optional[str] = Query(None, description="神殿名称"),
    start_date: Optional[datetime.date] = Query(None, description="开始日期"),
    end_date: Optional[datetime.date] = Query(None, description="结束日期"),
    db: Session = Depends(get_db)
):
    """
    获取招聘计划列表
    
    支持按神殿、日期范围筛选
    """
    try:
        rows = recruitment_db.fetch_recruitment_list(
            db,
            campus=campus,
            start_date=start_date,
            end_date=end_date
        )
        
        def serialize_row(r):
            return {
                "id": getattr(r, "id", None),
                "神殿": getattr(r, "神殿", None),
                "部门": getattr(r, "部门", None),
                "岗位名称": getattr(r, "岗位名称", None),
                "岗位类别": getattr(r, "岗位类别", None),
                "计划招聘人数": getattr(r, "计划招聘人数", None),
                "计划招聘时间": (getattr(r, "计划招聘时间", None).isoformat() if getattr(r, "计划招聘时间", None) else None),
                "实际招聘岗位名称": getattr(r, "实际招聘岗位名称", None),
                "实际招聘人数": getattr(r, "实际招聘人数", None),
                "实际招聘时间": (getattr(r, "实际招聘时间", None).isoformat() if getattr(r, "实际招聘时间", None) else None),
                "招聘渠道": getattr(r, "招聘渠道", None),
                "应聘人数": getattr(r, "应聘人数", None),
                "面试人数": getattr(r, "面试人数", None),
                "录用人数": getattr(r, "录用人数", None),
                "录用率": float(getattr(r, "录用率", None)) if getattr(r, "录用率", None) else None,
                "招聘成本": float(getattr(r, "招聘成本", None)) if getattr(r, "招聘成本", None) else None,
                "人均成本": float(getattr(r, "人均成本", None)) if getattr(r, "人均成本", None) else None,
                # 新增：入/离职信息
                "入职者姓名": getattr(r, "入职者姓名", None),
                "离职人数": getattr(r, "离职人数", None),
                "离职者姓名": getattr(r, "离职者姓名", None),
                "入职后三个月留任率": float(getattr(r, "入职后三个月留任率", None)) if getattr(r, "入职后三个月留任率", None) else None,
                "半年留任率": float(getattr(r, "半年留任率", None)) if getattr(r, "半年留任率", None) else None,
                "一年留任率": float(getattr(r, "一年留任率", None)) if getattr(r, "一年留任率", None) else None,
                "招聘满意度评分": float(getattr(r, "招聘满意度评分", None)) if getattr(r, "招聘满意度评分", None) else None,
                "招聘满意度评价": getattr(r, "招聘满意度评价", None),
                "招聘总结": getattr(r, "招聘总结", None),
                "存在的问题": getattr(r, "存在的问题", None),
                "改进措施": getattr(r, "改进措施", None),
                "招聘负责人": getattr(r, "招聘负责人", None),
                "审核人": getattr(r, "审核人", None),
                "备注": getattr(r, "备注", None),
                "创建时间": (getattr(r, "创建时间", None).isoformat() if getattr(r, "创建时间", None) else None),
                "更新时间": (getattr(r, "更新时间", None).isoformat() if getattr(r, "更新时间", None) else None),
            }
        
        return [serialize_row(r) for r in rows]
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"获取招聘计划列表失败: {safe_error_str(e)}")


@router.get(
    "/campus-recruitment-plan/{recruitment_id}",
    summary="获取单条招聘计划",
    response_model=RecruitmentPlanResponse
)
def read_recruitment(
    recruitment_id: int,
    db: Session = Depends(get_db)
):
    """获取单条招聘计划详情"""
    try:
        recruitment = recruitment_db.get_recruitment_by_id(db, recruitment_id)
        if not recruitment:
            raise HTTPException(status_code=404, detail="招聘计划不存在")
        return recruitment
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取招聘计划失败: {safe_error_str(e)}")


@router.post(
    "/campus-recruitment-plan",
    summary="创建招聘计划",
    response_model=RecruitmentPlanResponse
)
def create_recruitment(
    recruitment_data: RecruitmentPlanCreate,
    db: Session = Depends(get_db)
):
    """创建新的招聘计划"""
    try:
        recruitment_info = recruitment_data.model_dump(exclude_unset=True)
        recruitment = recruitment_db.create_recruitment(db, recruitment_info)
        return recruitment
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"创建招聘计划失败: {safe_error_str(e)}")


@router.put(
    "/campus-recruitment-plan/{recruitment_id}",
    summary="更新招聘计划",
    response_model=RecruitmentPlanResponse
)
def update_recruitment(
    recruitment_id: int,
    recruitment_data: RecruitmentPlanUpdate,
    db: Session = Depends(get_db)
):
    """更新招聘计划信息"""
    try:
        updates = recruitment_data.model_dump(exclude_unset=True)
        recruitment = recruitment_db.update_recruitment(db, recruitment_id, updates)
        if not recruitment:
            raise HTTPException(status_code=404, detail="招聘计划不存在")
        return recruitment
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"更新招聘计划失败: {safe_error_str(e)}")


@router.delete(
    "/campus-recruitment-plan/{recruitment_id}",
    summary="删除招聘计划"
)
def delete_recruitment(
    recruitment_id: int,
    db: Session = Depends(get_db)
):
    """删除招聘计划"""
    try:
        success = recruitment_db.delete_recruitment(db, recruitment_id)
        if not success:
            raise HTTPException(status_code=404, detail="招聘计划不存在")
        return {"message": "删除成功"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"删除招聘计划失败: {safe_error_str(e)}")


@router.get(
    "/campus-recruitment-plan/statistics/summary",
    summary="获取招聘统计数据",
    response_model=RecruitmentStatisticsResponse
)
def get_recruitment_statistics(
    campus: Optional[str] = Query(None, description="神殿名称"),
    start_date: Optional[datetime.date] = Query(None, description="开始日期"),
    end_date: Optional[datetime.date] = Query(None, description="结束日期"),
    db: Session = Depends(get_db)
):
    """
    获取招聘统计数据
    
    包括：总招聘数、计划/实际招聘人数、应聘/面试/录用人数、
    录用率、招聘成本、留任率、满意度等统计指标
    """
    try:
        stats = recruitment_db.get_recruitment_statistics(
            db,
            campus=campus,
            start_date=start_date,
            end_date=end_date
        )
        return stats
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"获取招聘统计数据失败: {safe_error_str(e)}")


@router.post(
    "/campus-recruitment-plan/save",
    summary="保存招聘计划（创建或更新）"
)
def save_recruitment(
    recruitment_data: dict,
    db: Session = Depends(get_db)
):
    """
    保存招聘计划（创建或更新）
    
    如果请求体中包含 id，则更新；否则创建新记录
    """
    try:
        recruitment_id = recruitment_data.get("id")
        
        if recruitment_id:
            # 更新现有记录
            updates = {k: v for k, v in recruitment_data.items() if k != "id"}
            recruitment = recruitment_db.update_recruitment(db, recruitment_id, updates)
            if not recruitment:
                raise HTTPException(status_code=404, detail="招聘计划不存在")
            return {
                "success": True,
                "message": "更新成功",
                "data": {
                    "id": recruitment.id,
                    "神殿": recruitment.神殿,
                    "岗位名称": recruitment.岗位名称,
                }
            }
        else:
            # 创建新记录
            recruitment = recruitment_db.create_recruitment(db, recruitment_data)
            return {
                "success": True,
                "message": "创建成功",
                "data": {
                    "id": recruitment.id,
                    "神殿": recruitment.神殿,
                    "岗位名称": recruitment.岗位名称,
                }
            }
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"保存招聘计划失败: {safe_error_str(e)}")

