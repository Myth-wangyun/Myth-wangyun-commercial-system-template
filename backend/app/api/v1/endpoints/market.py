"""市场模块API端点 (清理重复定义)"""

from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ....core.database import get_market_db
from ....crud import market as market_crud
from ....schemas.market import (
    咨询量明细创建,
    咨询量明细响应,
    日投放数据创建,
    日投放数据响应,
    日投放数据更新,
)

router = APIRouter()


@router.get("/", summary="市场模块根路径")
async def market_root():
    return {
        "message": "市场模块API",
        "endpoints": {
            "日投放数据": "/daily",
            "咨询量明细": "/consultation",
            "统计分析": "/statistics"
        }
    }


# ============================================
# 日投放数据相关API
# ============================================

@router.get("/daily", summary="获取日投放数据列表")
async def get_daily_data(
    skip: int = Query(0, ge=0, description="跳过记录数"),
    limit: int = Query(20, ge=1, le=100, description="返回记录数"),
    投放日期: Optional[date] = Query(None, description="筛选日期"),
    投放渠道: Optional[str] = Query(None, description="筛选渠道（兼容字段）"),
    媒体来源: Optional[str] = Query(None, description="筛选媒体来源"),
    开始日期: Optional[date] = Query(None, description="筛选开始日期"),
    结束日期: Optional[date] = Query(None, description="筛选结束日期"),
    db: Session = Depends(get_market_db)
):
    """
    获取日投放数据列表
    
    - **skip**: 跳过的记录数（分页）
    - **limit**: 返回的记录数（分页）
    - **投放日期**: 可选，筛选特定日期
    - **投放渠道**: 可选，筛选特定渠道（兼容字段）
    - **媒体来源**: 可选，筛选特定媒体来源
    - **开始日期**: 可选，筛选开始日期
    - **结束日期**: 可选，筛选结束日期
    """
    数据 = market_crud.获取日投放数据列表(
        db,
        skip=skip,
        limit=limit,
        投放日期=投放日期,
        投放渠道=投放渠道,
        媒体来源=媒体来源,
        开始日期=开始日期,
        结束日期=结束日期
    )
    return {"success": True, **数据}


@router.post("/daily", response_model=日投放数据响应, summary="创建日投放数据")
async def create_daily_data(raw: dict = Body(..., description="支持中英文或英文别名字段提交"), db: Session = Depends(get_market_db)):
    mapping = {
        'date': '日期', '日期': '日期',
        'media': '媒体来源', '媒体来源': '媒体来源',
        'spend': '消费金额', '消费金额': '消费金额',
        'impressions': '展现量', '展现量': '展现量',
        'clicks': '点击量', '点击量': '点击量',
        'ip': 'IP', 'IP': 'IP',
        'pv': 'PV', 'PV': 'PV',
        'dialogues': '对话量', '对话量': '对话量',
        'validDialogues': '有效对话', '有效对话': '有效对话',
        'leads': '咨询量', '咨询量': '咨询量'
    }
    normalized = {mapping.get(k, k): v for k, v in raw.items()}
    for num_field in ['展现量','点击量','IP','PV','对话量','有效对话','咨询量']:
        normalized.setdefault(num_field, 0)
    for required in ['日期','媒体来源','消费金额']:
        if required not in normalized or normalized[required] in (None, ''):
            raise HTTPException(status_code=400, detail=f'缺少必要字段: {required}')
    try:
        data = 日投放数据创建(**normalized)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f'数据格式错误: {e}') from e
    try:
        return market_crud.创建日投放数据(db, data)
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'创建失败: {e}') from e


@router.post("/daily/bulk", summary="批量创建日投放数据")
async def bulk_create_daily_data(
    items: List[dict] = Body(..., description="数组, 每个元素支持英文或中文字段"),
    忽略重复: bool = Query(True, description="是否忽略重复(日期+媒体来源)", alias="ignoreDuplicates"),
    db: Session = Depends(get_market_db)
):
    # 复用单条创建的映射逻辑
    mapping = {
        'date': '日期', '日期': '日期',
        'media': '媒体来源', '媒体来源': '媒体来源',
        'spend': '消费金额', '消费金额': '消费金额',
        'impressions': '展现量', '展现量': '展现量',
        'clicks': '点击量', '点击量': '点击量',
        'ip': 'IP', 'IP': 'IP',
        'pv': 'PV', 'PV': 'PV',
        'dialogues': '对话量', '对话量': '对话量',
        'validDialogues': '有效对话', '有效对话': '有效对话',
        'leads': '咨询量', '咨询量': '咨询量'
    }
    converted = []
    errors = []
    for idx, raw in enumerate(items):
        norm = {mapping.get(k, k): v for k, v in raw.items()}
        for num_field in ['展现量','点击量','IP','PV','对话量','有效对话','咨询量']:
            norm.setdefault(num_field, 0)
        try:
            data = 日投放数据创建(**norm)
            converted.append(data)
        except Exception as e:
            errors.append({"index": idx, "error": str(e)})
    if converted:
        result = market_crud.批量创建日投放数据(db, converted, 忽略重复=忽略重复)
    else:
        result = {"成功": 0, "跳过": 0, "失败": 0, "总数": 0}
    return {"success": True, "result": result, "parseErrors": errors}
@router.get("/daily/{id}", response_model=日投放数据响应, summary="获取单条日投放数据")
async def get_daily_data_by_id(id: int, db: Session = Depends(get_market_db)):
    数据 = market_crud.获取日投放数据(db, id)
    if not 数据:
        raise HTTPException(status_code=404, detail="记录不存在")
    return 数据

@router.put("/daily/{id}", response_model=日投放数据响应, summary="更新日投放数据")
async def update_daily_data(id: int, data: 日投放数据更新, db: Session = Depends(get_market_db)):
    try:
        数据 = market_crud.更新日投放数据(db, id, data)
        if not 数据:
            raise HTTPException(status_code=404, detail="记录不存在")
        return 数据
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e

@router.delete("/daily/{id}", summary="删除日投放数据")
async def delete_daily_data(
    id: int,
    db: Session = Depends(get_market_db)
):
    """
    删除日投放数据记录
    """
    成功 = market_crud.删除日投放数据(db, id)
    if not 成功:
        raise HTTPException(status_code=404, detail="记录不存在")
    return {"success": True, "message": "记录删除成功", "记录ID": id}


# ============================================
# 咨询量明细相关API
# ============================================

@router.get("/consultation", response_model=List[咨询量明细响应], summary="获取咨询量明细列表")
async def get_consultation_data(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    咨询日期: Optional[date] = Query(None),
    咨询状态: Optional[str] = Query(None),
    db: Session = Depends(get_market_db)
):
    """获取咨询量明细列表"""
    数据 = market_crud.获取咨询量明细列表(
        db,
        skip=skip,
        limit=limit,
        咨询日期=咨询日期,
        咨询状态=咨询状态
    )
    return 数据


@router.post("/consultation", response_model=咨询量明细响应, summary="创建咨询记录")
async def create_consultation(
    data: 咨询量明细创建,
    db: Session = Depends(get_market_db)
):
    """创建新的咨询记录"""
    return market_crud.创建咨询量明细(db, data)


# ============================================
# 统计分析相关API
# ============================================

@router.get("/statistics/summary", summary="获取统计汇总数据")
async def get_statistics_summary(
    开始日期: Optional[date] = Query(None, description="开始日期"),
    结束日期: Optional[date] = Query(None, description="结束日期"),
    媒体来源: Optional[str] = Query(None, description="筛选媒体来源"),
    db: Session = Depends(get_market_db)
):
    """
    获取指定日期范围的统计汇总数据
    """
    汇总数据 = market_crud.获取日投放数据统计(db, 开始日期, 结束日期, 媒体来源)
    return {
        "success": True,
        "data": 汇总数据,
        "开始日期": 开始日期,
        "结束日期": 结束日期,
        "媒体来源": 媒体来源
    }


@router.get("/statistics/daily", summary="按日统计")
async def get_daily_statistics(
    天数: int = Query(30, ge=1, le=365, description="统计天数"),
    db: Session = Depends(get_market_db)
):
    """获取最近N天的统计数据"""
    统计数据 = market_crud.获取按日统计(db, 天数)
    return {
        "success": True,
        "data": 统计数据,
        "统计天数": 天数
    }


@router.get("/statistics/weekly", summary="按周统计")
async def get_weekly_statistics(
    周数: int = Query(12, ge=1, le=52, description="统计周数"),
    db: Session = Depends(get_market_db)
):
    统计数据 = market_crud.获取按周统计(db, 周数)
    return {"success": True, "data": 统计数据, "统计周数": 周数}


@router.get("/statistics/monthly", summary="按月统计")
async def get_monthly_statistics(
    月数: int = Query(12, ge=1, le=36, description="统计月数"),
    db: Session = Depends(get_market_db)
):
    统计数据 = market_crud.获取按月统计(db, 月数)
    return {"success": True, "data": 统计数据, "统计月数": 月数}


@router.get("/statistics/yearly", summary="按年统计")
async def get_yearly_statistics(
    年数: int = Query(5, ge=1, le=10, description="统计年数"),
    db: Session = Depends(get_market_db)
):
    统计数据 = market_crud.获取按年统计(db, 年数)
    return {"success": True, "data": 统计数据, "统计年数": 年数}


@router.get("/statistics/channel", summary="按渠道统计")
async def get_channel_statistics(
    开始日期: date = Query(..., description="开始日期"),
    结束日期: date = Query(..., description="结束日期"),
    db: Session = Depends(get_market_db)
):
    """获取各渠道的统计数据"""
    统计数据 = market_crud.获取按渠道统计(db, 开始日期, 结束日期)
    return {
        "success": True,
        "data": 统计数据,
        "开始日期": 开始日期,
        "结束日期": 结束日期
    }


# ============================================
# 网络投放效果汇总相关API
# ============================================

@router.get("/summary/monthly", summary="获取月度网络投放效果汇总")
async def get_monthly_network_summary(
    年份: int = Query(..., description="年份"),
    月份: int = Query(..., description="月份"),
    神殿: Optional[str] = Query(None, description="神殿筛选"),
    媒体来源: Optional[str] = Query(None, description="媒体来源筛选"),
    db: Session = Depends(get_market_db)
):
    """
    获取指定月份的详细网络投放效果汇总数据
    
    - **年份**: 统计年份
    - **月份**: 统计月份 (1-12)
    - **神殿**: 可选，筛选特定神殿
    - **媒体来源**: 可选，筛选特定媒体来源
    """
    import calendar
    from datetime import date
    
    # 计算月份的开始和结束日期
    开始日期 = date(年份, 月份, 1)
    最后一天 = calendar.monthrange(年份, 月份)[1]
    结束日期 = date(年份, 月份, 最后一天)
    
    汇总数据 = market_crud.获取月度投放效果汇总(db, 开始日期, 结束日期, 神殿, 媒体来源)
    
    return {
        "success": True,
        "data": 汇总数据,
        "年份": 年份,
        "月份": 月份,
        "神殿": 神殿,
        "媒体来源": 媒体来源,
        "开始日期": 开始日期.isoformat(),
        "结束日期": 结束日期.isoformat()
    }


@router.get("/summary/campus-list", summary="获取神殿列表")
async def get_campus_list(db: Session = Depends(get_market_db)):
    """获取所有神殿列表"""
    神殿列表 = market_crud.获取神殿列表(db)
    return {
        "success": True,
        "data": 神殿列表
    }


@router.get("/summary/media-source-list", summary="获取媒体来源列表")
async def get_media_source_list(db: Session = Depends(get_market_db)):
    """获取所有媒体来源列表"""
    媒体来源列表 = market_crud.获取媒体来源列表(db)
    return {
        "success": True,
        "data": 媒体来源列表
    }


# ============================================
# 网络合作伙伴日度数据相关API
# ============================================

@router.get("/online-partner-daily", summary="获取网络合作伙伴日度数据列表")
async def get_online_partner_daily_data(
    campus: str = Query(..., description="神殿名称"),
    partner: str = Query(..., description="合作伙伴"),
    month: str = Query(..., description="月份(YYYY-MM格式)"),
    db: Session = Depends(get_market_db)
):
    """
    获取指定神殿、合作伙伴、月份的日度数据列表
    """

    from ....models.market import 市场部网络合作伙伴日度数据表
    
    try:
        # 解析月份
        year, month_num = map(int, month.split('-'))
        start_date = date(year, month_num, 1)
        
        # 计算月末日期
        import calendar
        last_day = calendar.monthrange(year, month_num)[1]
        end_date = date(year, month_num, last_day)
        
        # 查询数据
        items = db.query(市场部网络合作伙伴日度数据表).filter(
            市场部网络合作伙伴日度数据表.神殿 == campus,
            市场部网络合作伙伴日度数据表.合作伙伴 == partner,
            市场部网络合作伙伴日度数据表.日期 >= start_date,
            市场部网络合作伙伴日度数据表.日期 <= end_date
        ).order_by(市场部网络合作伙伴日度数据表.日期).all()
        
        return {
            "success": True,
            "items": [item.to_dict() for item in items]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"查询失败: {str(e)}") from e


@router.post("/online-partner-daily/bulk-save", summary="批量保存网络合作伙伴日度数据")
async def bulk_save_online_partner_daily_data(
    data: dict = Body(...),
    db: Session = Depends(get_market_db)
):
    """
    批量保存网络合作伙伴日度数据
    
    请求体格式:
    {
        "campus": "神殿名称",
        "partner": "合作伙伴",
        "month": "YYYY-MM",
        "rows": [
            {
                "date": "YYYY-MM-DD",
                "partner_actual_income": 0,
                "refund_count": 0,
                "net_signup": 0,
                "gross_total": 0,
                "order_count": 0,
                "visit_count": 0,
                "actual_consult_count": 0,
                "partner_cost": 0
            }
        ]
    }
    """
    from datetime import datetime
    from decimal import Decimal

    from ....models.market import 市场部网络合作伙伴日度数据表
    
    try:
        campus = data.get('campus')
        partner = data.get('partner')
        month = data.get('month')
        rows = data.get('rows', [])
        
        if not campus or not partner or not month:
            raise HTTPException(status_code=400, detail="缺少必要参数: campus, partner, month")
        
        saved_count = 0
        saved_items = []
        
        for row in rows:
            date_str = row.get('date')
            if not date_str:
                continue
            
            # 解析日期
            row_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            
            # 查找或创建记录
            existing = db.query(市场部网络合作伙伴日度数据表).filter(
                市场部网络合作伙伴日度数据表.神殿 == campus,
                市场部网络合作伙伴日度数据表.合作伙伴 == partner,
                市场部网络合作伙伴日度数据表.日期 == row_date
            ).first()
            
            if existing:
                # 更新现有记录
                existing.合作伙伴实际收入 = Decimal(str(row.get('partner_actual_income', 0)))
                existing.退费数 = int(row.get('refund_count', 0))
                existing.净报名 = int(row.get('net_signup', 0))
                existing.毛报总数 = int(row.get('gross_total', 0))
                existing.订单数 = int(row.get('order_count', 0))
                existing.上门人数 = int(row.get('visit_count', 0))
                existing.实际总咨询量 = int(row.get('actual_consult_count', 0))
                existing.合作伙伴消费 = Decimal(str(row.get('partner_cost', 0)))
                saved_items.append(existing)
            else:
                # 创建新记录
                new_item = 市场部网络合作伙伴日度数据表(
                    神殿=campus,
                    合作伙伴=partner,
                    日期=row_date,
                    合作伙伴实际收入=Decimal(str(row.get('partner_actual_income', 0))),
                    退费数=int(row.get('refund_count', 0)),
                    净报名=int(row.get('net_signup', 0)),
                    毛报总数=int(row.get('gross_total', 0)),
                    订单数=int(row.get('order_count', 0)),
                    上门人数=int(row.get('visit_count', 0)),
                    实际总咨询量=int(row.get('actual_consult_count', 0)),
                    合作伙伴消费=Decimal(str(row.get('partner_cost', 0)))
                )
                db.add(new_item)
                saved_items.append(new_item)
            
            saved_count += 1
        
        db.commit()
        
        # 刷新所有保存的项目以获取最新数据
        for item in saved_items:
            db.refresh(item)
        
        return {
            "success": True,
            "saved_count": saved_count,
            "items": [item.to_dict() for item in saved_items]
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"保存失败: {str(e)}") from e
