"""
神殿感知的市场数据API
根据用户选择的神殿操作对应的投放明细表
"""

from datetime import date
from decimal import Decimal
from typing import Optional
from urllib.parse import unquote

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request
from pydantic import BaseModel, Field

from ....crud.campus_market_tables import (
    创建投放明细_神殿表,
    删除投放明细_神殿表,
    更新投放明细_神殿表,
    获取投放明细_神殿表,
    获取投放明细列表_神殿表,
    获取投放统计_神殿表,
)
from ....logs.context import get_audit_logger

router = APIRouter()
VALID_CAMPUSES = ('主神殿', '永恒殿', '慈悲殿', '李大殿', '智慧阁', '光明殿', '神恩殿')

class 投放明细创建(BaseModel):
    """创建投放明细模型"""
    日期: date = Field(..., description="投放日期")
    媒体来源: str = Field(..., description="媒体来源")
    消费金额: Decimal = Field(Decimal('0.00'), description="消费金额")
    展现量: int = Field(0, description="展现量")
    点击量: int = Field(0, description="点击量")
    IP: int = Field(0, description="IP")
    PV: int = Field(0, description="PV")
    对话量: int = Field(0, description="对话量")
    有效对话: int = Field(0, description="有效对话")
    咨询量: int = Field(0, description="咨询量")

class 投放明细更新(BaseModel):
    """更新投放明细模型"""
    日期: Optional[date] = Field(None, description="投放日期")
    媒体来源: Optional[str] = Field(None, description="媒体来源")
    消费金额: Optional[Decimal] = Field(None, description="消费金额")
    展现量: Optional[int] = Field(None, description="展现量")
    点击量: Optional[int] = Field(None, description="点击量")
    IP: Optional[int] = Field(None, description="IP")
    PV: Optional[int] = Field(None, description="PV")
    对话量: Optional[int] = Field(None, description="对话量")
    有效对话: Optional[int] = Field(None, description="有效对话")
    咨询量: Optional[int] = Field(None, description="咨询量")

def get_campus_from_header(x_campus: Optional[str] = Header(None)) -> str:
    """从请求头获取神殿信息"""
    if not x_campus:
        raise HTTPException(status_code=400, detail="缺少神殿信息，请在请求头中提供 X-Campus")

    decoded_campus = unquote(x_campus)
    if decoded_campus not in VALID_CAMPUSES:
        raise HTTPException(status_code=400, detail=f"无效的神殿: {decoded_campus}")

    return decoded_campus

@router.post("/", summary="创建投放明细")
async def create_market_detail(
    投放明细: 投放明细创建,
    http_request: Request,
    campus: str = Depends(get_campus_from_header)
):
    """
    创建投放明细记录
    
    根据用户选择的神殿插入到对应的投放明细表中
    """
    try:
        result = 创建投放明细_神殿表(
            campus=campus,
            日期=投放明细.日期,
            媒体来源=投放明细.媒体来源,
            消费金额=投放明细.消费金额,
            展现量=投放明细.展现量,
            点击量=投放明细.点击量,
            IP=投放明细.IP,
            PV=投放明细.PV,
            对话量=投放明细.对话量,
            有效对话=投放明细.有效对话,
            咨询量=投放明细.咨询量
        )
        
        if result:
            return result
        else:
            raise HTTPException(status_code=500, detail="创建投放明细失败")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"创建投放明细失败: {str(e)}") from e

@router.get("/", summary="获取投放明细列表")
async def get_market_details(
    跳过: int = Query(0, description="跳过的记录数"),
    限制: int = Query(100, description="限制返回的记录数"),
    日期_开始: Optional[date] = Query(None, description="开始日期筛选"),
    日期_结束: Optional[date] = Query(None, description="结束日期筛选"),
    媒体来源: Optional[str] = Query(None, description="媒体来源筛选"),
    campus: str = Depends(get_campus_from_header)
):
    """
    获取投放明细列表
    
    根据用户选择的神殿从对应的投放明细表中获取数据
    """
    try:
        results = 获取投放明细列表_神殿表(
            campus=campus,
            跳过=跳过,
            限制=限制,
            日期_开始=日期_开始,
            日期_结束=日期_结束,
            媒体来源=媒体来源
        )
        
        return results
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取投放明细列表失败: {str(e)}") from e

@router.get("/{id}", summary="获取投放明细详情")
async def get_market_detail(
    id: int,
    campus: str = Depends(get_campus_from_header)
):
    """
    根据ID获取投放明细详情
    
    - **id**: 投放明细ID
    """
    try:
        result = 获取投放明细_神殿表(campus=campus, 投放ID=id)
        
        if not result:
            raise HTTPException(status_code=404, detail="投放明细不存在")
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取投放明细详情失败: {str(e)}") from e

@router.put("/{id}", summary="更新投放明细")
async def update_market_detail(
    id: int,
    投放明细: 投放明细更新,
    http_request: Request,
    campus: str = Depends(get_campus_from_header)
):
    """
    更新投放明细记录
    
    - **id**: 投放明细ID
    """
    try:
        # 过滤掉None值
        update_data = 投放明细.model_dump(exclude_none=True)
        
        if not update_data:
            raise HTTPException(status_code=400, detail="没有提供要更新的数据")
        
        result = 更新投放明细_神殿表(
            campus=campus,
            投放ID=id,
            **update_data
        )
        
        if result:
            audit_logger = get_audit_logger(http_request)
            audit_logger.set_action(
                action="market.update_detail",
                action_display="更新投放明细",
                action_category="write",
                module="campus_market",
                extra={"campus": campus, "id": id},
            )
            return result
        else:
            raise HTTPException(status_code=404, detail="投放明细不存在或更新失败")
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"更新投放明细失败: {str(e)}") from e

@router.delete("/{id}", summary="删除投放明细")
async def delete_market_detail(
    id: int,
    http_request: Request,
    campus: str = Depends(get_campus_from_header)
):
    """
    删除投放明细记录
    
    - **id**: 投放明细ID
    """
    try:
        success = 删除投放明细_神殿表(campus=campus, 投放ID=id)
        
        if success:
            audit_logger = get_audit_logger(http_request)
            audit_logger.set_action(
                action="market.delete_detail",
                action_display="删除投放明细",
                action_category="write",
                module="campus_market",
                extra={"campus": campus, "id": id},
            )
            return {"message": "删除成功"}
        else:
            raise HTTPException(status_code=404, detail="投放明细不存在")
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"删除投放明细失败: {str(e)}") from e

@router.get("/statistics/overview", summary="获取投放统计概览")
async def get_market_statistics(
    日期_开始: Optional[date] = Query(None, description="开始日期"),
    日期_结束: Optional[date] = Query(None, description="结束日期"),
    campus: str = Depends(get_campus_from_header)
):
    """
    获取投放统计概览
    
    根据用户选择的神殿统计对应的投放明细数据
    """
    try:
        stats = 获取投放统计_神殿表(
            campus=campus,
            日期_开始=日期_开始,
            日期_结束=日期_结束
        )
        
        return stats
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取投放统计失败: {str(e)}") from e
