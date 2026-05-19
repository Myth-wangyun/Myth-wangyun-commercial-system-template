"""
网络咨询师报表 API 端点
"""

from datetime import date
from typing import List, Optional, TypedDict

from app.core.database import get_db
from app.crud.market.network_consultant_chat_rate import (
    batch_create_or_update_group_a,
    batch_create_or_update_group_b,
    # A组操作
    delete_group_a_chat_rate,
    delete_group_b_chat_rate,
    get_group_a_chat_rate_by_id,
    get_group_a_chat_rate_by_month,
    get_group_a_chat_rate_list,
    get_group_a_monthly_summary,
    get_group_b_chat_rate_by_id,
    get_group_b_chat_rate_by_month,
    get_group_b_chat_rate_list,
    get_group_b_monthly_summary,
)
from app.models.market.network_consultant_chat_rate import 网络咨询师组别人员配置表
from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session

router = APIRouter()


class _GroupSummary(TypedDict):
    employee_name: str
    group: str
    incoming_calls: int
    total_dialogs: int
    invalid_dialogs: int
    valid_intervention_dialogs: int
    chat_output: int


# ==================== Pydantic 模型 ====================


class ChatRateRecordBase(BaseModel):
    """聊出率记录基础模型"""

    日期: date = Field(..., description="日期")
    星期: Optional[str] = Field(None, description="星期几")
    班次: Optional[str] = Field(None, description="班次")
    网聊姓名: str = Field(..., description="网聊姓名")
    进线量: int = Field(0, description="进线量")
    总对话: int = Field(0, description="总对话")
    无效对话量: int = Field(0, description="无效对话量")
    有效干预对话量: int = Field(0, description="有效干预对话量")
    聊出量: int = Field(0, description="聊出量")
    是否汇总: int = Field(0, description="是否汇总")


class ChatRateRecordResponse(BaseModel):
    """聊出率记录响应模型"""

    id: int
    year: int
    month: int
    date: str
    week_day: Optional[str]
    shift: Optional[str]
    employee_name: str
    incoming_calls: int
    total_dialogs: int
    invalid_dialogs: int
    valid_dialogs: int
    valid_dialog_rate: Optional[float]
    valid_intervention_dialogs: int
    intervention_dialog_rate: Optional[float]
    chat_output: int
    chat_output_rate: Optional[float]
    is_summary: bool
    created_at: Optional[str]
    updated_at: Optional[str]

    model_config = ConfigDict(
        from_attributes=True,
    )


class BatchSaveRequest(BaseModel):
    """批量保存请求模型"""

    year: int = Field(..., description="年份")
    month: int = Field(..., description="月份")
    records: List[ChatRateRecordBase] = Field(..., description="记录列表")


class EmployeeConfigRequest(BaseModel):
    """人员配置请求模型"""

    employees: List[str] = Field(..., description="员工姓名列表")


class EmployeeConfigResponse(BaseModel):
    """人员配置响应模型"""

    year: int
    month: int
    group: str
    employees: List[str]


class MonthlySummaryResponse(BaseModel):
    """月度汇总响应模型"""

    total_incoming_calls: int
    total_dialogs: int
    total_invalid_dialogs: int
    total_valid_dialogs: int
    total_valid_intervention_dialogs: int
    total_chat_output: int
    valid_dialog_rate: Optional[float]
    intervention_dialog_rate: Optional[float]
    chat_output_rate: Optional[float]


# ==================== A组 API 端点 ====================


@router.get("/group-a", response_model=List[ChatRateRecordResponse])
def get_group_a_records(
    year: Optional[int] = Query(None, description="年份"),
    month: Optional[int] = Query(None, description="月份"),
    employee_name: Optional[str] = Query(None, description="员工姓名"),
    is_summary: Optional[bool] = Query(None, description="是否汇总"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
):
    """获取A组聊出率记录列表"""
    records = get_group_a_chat_rate_list(
        db=db,
        year=year,
        month=month,
        employee_name=employee_name,
        is_summary=is_summary,
        skip=skip,
        limit=limit,
    )
    return [record.to_dict() for record in records]


@router.get("/group-a/{record_id}", response_model=ChatRateRecordResponse)
def get_group_a_record(
    record_id: int,
    db: Session = Depends(get_db),
):
    """获取A组单条记录"""
    record = get_group_a_chat_rate_by_id(db, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="记录不存在")
    return record.to_dict()


@router.get(
    "/group-a/month/{year}/{month}", response_model=List[ChatRateRecordResponse]
)
def get_group_a_month_records(
    year: int,
    month: int,
    db: Session = Depends(get_db),
):
    """获取A组指定月份的所有记录"""
    records = get_group_a_chat_rate_by_month(db, year, month)
    return [record.to_dict() for record in records]


@router.post("/group-a/batch")
def batch_save_group_a(
    request: BatchSaveRequest = Body(...),
    db: Session = Depends(get_db),
):
    """批量保存A组记录"""
    try:
        records_data = [record.model_dump() for record in request.records]
        results = batch_create_or_update_group_a(
            db=db,
            year=request.year,
            month=request.month,
            records=records_data,
        )
        return {
            "success": True,
            "message": f"成功保存 {len(results)} 条记录",
            "count": len(results),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"保存失败: {str(e)}")


@router.delete("/group-a/{record_id}")
def delete_group_a_record(
    record_id: int,
    db: Session = Depends(get_db),
):
    """删除A组记录"""
    success = delete_group_a_chat_rate(db, record_id)
    if not success:
        raise HTTPException(status_code=404, detail="记录不存在")
    return {"success": True, "message": "删除成功"}


@router.get("/group-a/summary/{year}/{month}", response_model=MonthlySummaryResponse)
def get_group_a_summary(
    year: int,
    month: int,
    db: Session = Depends(get_db),
):
    """获取A组月度汇总"""
    summary = get_group_a_monthly_summary(db, year, month)
    return summary


@router.get("/group-a/config/{year}/{month}", response_model=EmployeeConfigResponse)
def get_group_a_employee_config(
    year: int,
    month: int,
    db: Session = Depends(get_db),
):
    """获取A组人员配置"""
    configs = (
        db.query(网络咨询师组别人员配置表)
        .filter(
            网络咨询师组别人员配置表.年份 == year,
            网络咨询师组别人员配置表.月份 == month,
            网络咨询师组别人员配置表.组别 == "A组",
        )
        .order_by(网络咨询师组别人员配置表.排序序号)
        .all()
    )

    employees = [config.员工姓名 for config in configs]

    return {"year": year, "month": month, "group": "A组", "employees": employees}


@router.post("/group-a/config/{year}/{month}")
def save_group_a_employee_config(
    year: int,
    month: int,
    request: EmployeeConfigRequest = Body(...),
    db: Session = Depends(get_db),
):
    """保存A组人员配置"""
    try:
        # 删除旧配置
        db.query(网络咨询师组别人员配置表).filter(
            网络咨询师组别人员配置表.年份 == year,
            网络咨询师组别人员配置表.月份 == month,
            网络咨询师组别人员配置表.组别 == "A组",
        ).delete()

        # 添加新配置
        for index, employee_name in enumerate(request.employees):
            config = 网络咨询师组别人员配置表(
                年份=year,
                月份=month,
                组别="A组",
                员工姓名=employee_name,
                排序序号=index,
            )
            db.add(config)

        db.commit()

        return {
            "success": True,
            "message": f"成功保存 {len(request.employees)} 名员工配置",
            "employees": request.employees,
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"保存失败: {str(e)}")


# ==================== B组 API 端点 ====================


@router.get("/group-b", response_model=List[ChatRateRecordResponse])
def get_group_b_records(
    year: Optional[int] = Query(None, description="年份"),
    month: Optional[int] = Query(None, description="月份"),
    employee_name: Optional[str] = Query(None, description="员工姓名"),
    is_summary: Optional[bool] = Query(None, description="是否汇总"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
):
    """获取B组聊出率记录列表"""
    records = get_group_b_chat_rate_list(
        db=db,
        year=year,
        month=month,
        employee_name=employee_name,
        is_summary=is_summary,
        skip=skip,
        limit=limit,
    )
    return [record.to_dict() for record in records]


@router.get("/group-b/{record_id}", response_model=ChatRateRecordResponse)
def get_group_b_record(
    record_id: int,
    db: Session = Depends(get_db),
):
    """获取B组单条记录"""
    record = get_group_b_chat_rate_by_id(db, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="记录不存在")
    return record.to_dict()


@router.get(
    "/group-b/month/{year}/{month}", response_model=List[ChatRateRecordResponse]
)
def get_group_b_month_records(
    year: int,
    month: int,
    db: Session = Depends(get_db),
):
    """获取B组指定月份的所有记录"""
    records = get_group_b_chat_rate_by_month(db, year, month)
    return [record.to_dict() for record in records]


@router.post("/group-b/batch")
def batch_save_group_b(
    request: BatchSaveRequest = Body(...),
    db: Session = Depends(get_db),
):
    """批量保存B组记录"""
    try:
        records_data = [record.model_dump() for record in request.records]
        results = batch_create_or_update_group_b(
            db=db,
            year=request.year,
            month=request.month,
            records=records_data,
        )
        return {
            "success": True,
            "message": f"成功保存 {len(results)} 条记录",
            "count": len(results),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"保存失败: {str(e)}")


@router.delete("/group-b/{record_id}")
def delete_group_b_record(
    record_id: int,
    db: Session = Depends(get_db),
):
    """删除B组记录"""
    success = delete_group_b_chat_rate(db, record_id)
    if not success:
        raise HTTPException(status_code=404, detail="记录不存在")
    return {"success": True, "message": "删除成功"}


@router.get("/group-b/summary/{year}/{month}", response_model=MonthlySummaryResponse)
def get_group_b_summary(
    year: int,
    month: int,
    db: Session = Depends(get_db),
):
    """获取B组月度汇总"""
    summary = get_group_b_monthly_summary(db, year, month)
    return summary


@router.get("/group-b/config/{year}/{month}", response_model=EmployeeConfigResponse)
def get_group_b_employee_config(
    year: int,
    month: int,
    db: Session = Depends(get_db),
):
    """获取B组人员配置"""
    configs = (
        db.query(网络咨询师组别人员配置表)
        .filter(
            网络咨询师组别人员配置表.年份 == year,
            网络咨询师组别人员配置表.月份 == month,
            网络咨询师组别人员配置表.组别 == "B组",
        )
        .order_by(网络咨询师组别人员配置表.排序序号)
        .all()
    )

    employees = [config.员工姓名 for config in configs]

    return {"year": year, "month": month, "group": "B组", "employees": employees}


@router.post("/group-b/config/{year}/{month}")
def save_group_b_employee_config(
    year: int,
    month: int,
    request: EmployeeConfigRequest = Body(...),
    db: Session = Depends(get_db),
):
    """保存B组人员配置"""
    try:
        # 删除旧配置
        db.query(网络咨询师组别人员配置表).filter(
            网络咨询师组别人员配置表.年份 == year,
            网络咨询师组别人员配置表.月份 == month,
            网络咨询师组别人员配置表.组别 == "B组",
        ).delete()

        # 添加新配置
        for index, employee_name in enumerate(request.employees):
            config = 网络咨询师组别人员配置表(
                年份=year,
                月份=month,
                组别="B组",
                员工姓名=employee_name,
                排序序号=index,
            )
            db.add(config)

        db.commit()

        return {
            "success": True,
            "message": f"成功保存 {len(request.employees)} 名员工配置",
            "employees": request.employees,
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"保存失败: {str(e)}")


# ==================== 年度和月度统计汇总 API ====================


@router.get("/annual-statistics/{year}")
def get_annual_statistics(
    year: int,
    db: Session = Depends(get_db),
):
    """获取年度统计数据（从A组和B组汇总）"""
    result = []

    # 获取12个月的数据
    for month in range(1, 13):
        # 获取A组月度汇总
        group_a_summary = get_group_a_monthly_summary(db, year, month)
        # 获取B组月度汇总
        group_b_summary = get_group_b_monthly_summary(db, year, month)

        # 合并A组和B组的数据
        total_incoming_calls = (
            group_a_summary["total_incoming_calls"]
            + group_b_summary["total_incoming_calls"]
        )
        total_dialogs = (
            group_a_summary["total_dialogs"] + group_b_summary["total_dialogs"]
        )
        total_invalid_dialogs = (
            group_a_summary["total_invalid_dialogs"]
            + group_b_summary["total_invalid_dialogs"]
        )
        total_valid_dialogs = (
            group_a_summary["total_valid_dialogs"]
            + group_b_summary["total_valid_dialogs"]
        )
        total_valid_intervention_dialogs = (
            group_a_summary["total_valid_intervention_dialogs"]
            + group_b_summary["total_valid_intervention_dialogs"]
        )
        total_chat_output = (
            group_a_summary["total_chat_output"] + group_b_summary["total_chat_output"]
        )

        # 计算比率
        valid_dialog_rate = (
            (total_valid_dialogs / total_dialogs * 100) if total_dialogs > 0 else None
        )
        intervention_dialog_rate = (
            (total_valid_intervention_dialogs / total_valid_dialogs * 100)
            if total_valid_dialogs > 0
            else None
        )
        chat_output_rate = (
            (total_chat_output / total_valid_intervention_dialogs * 100)
            if total_valid_intervention_dialogs > 0
            else None
        )

        result.append(
            {
                "month": month,
                "total_incoming_calls": total_incoming_calls,
                "total_dialogs": total_dialogs,
                "total_invalid_dialogs": total_invalid_dialogs,
                "total_valid_dialogs": total_valid_dialogs,
                "valid_dialog_rate": valid_dialog_rate,
                "total_valid_intervention_dialogs": total_valid_intervention_dialogs,
                "intervention_dialog_rate": intervention_dialog_rate,
                "total_chat_output": total_chat_output,
                "chat_output_rate": chat_output_rate,
            }
        )

    return result


@router.get("/monthly-statistics/{year}/{month}")
def get_monthly_statistics(
    year: int,
    month: int,
    db: Session = Depends(get_db),
):
    """获取月度统计数据（从A组和B组按员工汇总）"""
    # 获取A组配置的员工列表
    group_a_configs = (
        db.query(网络咨询师组别人员配置表)
        .filter(
            网络咨询师组别人员配置表.年份 == year,
            网络咨询师组别人员配置表.月份 == month,
            网络咨询师组别人员配置表.组别 == "A组",
        )
        .order_by(网络咨询师组别人员配置表.排序序号)
        .all()
    )

    # 获取B组配置的员工列表
    group_b_configs = (
        db.query(网络咨询师组别人员配置表)
        .filter(
            网络咨询师组别人员配置表.年份 == year,
            网络咨询师组别人员配置表.月份 == month,
            网络咨询师组别人员配置表.组别 == "B组",
        )
        .order_by(网络咨询师组别人员配置表.排序序号)
        .all()
    )

    # 如果没有配置，返回空列表（不使用默认员工）
    group_a_employee_names = (
        [config.员工姓名 for config in group_a_configs] if group_a_configs else []
    )
    group_b_employee_names = (
        [config.员工姓名 for config in group_b_configs] if group_b_configs else []
    )

    # 获取A组数据
    group_a_records = get_group_a_chat_rate_by_month(db, year, month)
    # 获取B组数据
    group_b_records = get_group_b_chat_rate_by_month(db, year, month)

    # 按员工汇总A组数据（只包含配置的员工）
    group_a_summary: dict[str, _GroupSummary] = {}
    for emp_name in group_a_employee_names:
        group_a_summary[emp_name] = _GroupSummary(
            employee_name=emp_name,
            group="A组",
            incoming_calls=0,
            total_dialogs=0,
            invalid_dialogs=0,
            valid_intervention_dialogs=0,
            chat_output=0,
        )

    for record in group_a_records:
        emp_name = record.网聊姓名
        if emp_name in group_a_summary:
            group_a_summary[emp_name]["incoming_calls"] += record.进线量 or 0
            group_a_summary[emp_name]["total_dialogs"] += record.总对话 or 0
            group_a_summary[emp_name]["invalid_dialogs"] += record.无效对话量 or 0
            group_a_summary[emp_name]["valid_intervention_dialogs"] += (
                record.有效干预对话量 or 0
            )
            group_a_summary[emp_name]["chat_output"] += record.聊出量 or 0

    # 按员工汇总B组数据（只包含配置的员工）
    group_b_summary: dict[str, _GroupSummary] = {}
    for emp_name in group_b_employee_names:
        group_b_summary[emp_name] = _GroupSummary(
            employee_name=emp_name,
            group="B组",
            incoming_calls=0,
            total_dialogs=0,
            invalid_dialogs=0,
            valid_intervention_dialogs=0,
            chat_output=0,
        )

    for record in group_b_records:
        emp_name = record.网聊姓名
        if emp_name in group_b_summary:
            group_b_summary[emp_name]["incoming_calls"] += record.进线量 or 0
            group_b_summary[emp_name]["total_dialogs"] += record.总对话 or 0
            group_b_summary[emp_name]["invalid_dialogs"] += record.无效对话量 or 0
            group_b_summary[emp_name]["valid_intervention_dialogs"] += (
                record.有效干预对话量 or 0
            )
            group_b_summary[emp_name]["chat_output"] += record.聊出量 or 0

    # 计算比率
    def calculate_rates(data):
        valid_dialogs = data["total_dialogs"] - data["invalid_dialogs"]
        valid_dialog_rate = (
            (valid_dialogs / data["total_dialogs"] * 100)
            if data["total_dialogs"] > 0
            else None
        )
        intervention_dialog_rate = (
            (data["valid_intervention_dialogs"] / valid_dialogs * 100)
            if valid_dialogs > 0
            else None
        )
        chat_output_rate = (
            (data["chat_output"] / data["valid_intervention_dialogs"] * 100)
            if data["valid_intervention_dialogs"] > 0
            else None
        )

        return {
            **data,
            "valid_dialogs": valid_dialogs,
            "valid_dialog_rate": valid_dialog_rate,
            "intervention_dialog_rate": intervention_dialog_rate,
            "chat_output_rate": chat_output_rate,
        }

    # 组合结果（按配置的顺序）
    result = {
        "group_a": [
            calculate_rates(group_a_summary[emp_name])
            for emp_name in group_a_employee_names
        ],
        "group_b": [
            calculate_rates(group_b_summary[emp_name])
            for emp_name in group_b_employee_names
        ],
    }

    return result
