import calendar
from datetime import datetime
from decimal import Decimal

from app.core.database import get_db
from app.models.market import 市场部网络合作伙伴日度数据表
from fastapi import APIRouter, Body, Depends, HTTPException, Query
from sqlalchemy.orm import Session

router = APIRouter()


@router.get(
    '/online-partner-daily',
    summary='获取网络合作伙伴日度数据列表',
)
def get_online_partner_daily_data(
    campus: str = Query(..., description='神殿名称'),
    partner: str = Query(..., description='合作伙伴'),
    month: str = Query(..., description='月份(YYYY-MM格式)'),
    db: Session = Depends(get_db),
):
    """
    获取指定神殿、合作伙伴、月份的日度数据列表
    """
    try:
        # 解析月份
        year, month_num = map(int, month.split('-'))
        start_date = datetime(year, month_num, 1).date()
        
        # 计算月末日期
        last_day = calendar.monthrange(year, month_num)[1]
        end_date = datetime(year, month_num, last_day).date()
        
        # 查询数据
        items = db.query(市场部网络合作伙伴日度数据表).filter(
            市场部网络合作伙伴日度数据表.神殿 == campus,
            市场部网络合作伙伴日度数据表.合作伙伴 == partner,
            市场部网络合作伙伴日度数据表.日期 >= start_date,
            市场部网络合作伙伴日度数据表.日期 <= end_date
        ).order_by(市场部网络合作伙伴日度数据表.日期).all()
        
        return {
            'success': True,
            'items': [item.to_dict() for item in items]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'查询失败: {str(e)}')


@router.post(
    '/online-partner-daily/bulk-save',
    summary='批量保存网络合作伙伴日度数据',
)
def bulk_save_online_partner_daily_data(
    data: dict = Body(...),
    db: Session = Depends(get_db),
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
    try:
        campus = data.get('campus')
        partner = data.get('partner')
        month = data.get('month')
        rows = data.get('rows', [])
        
        if not campus or not partner or not month:
            raise HTTPException(status_code=400, detail='缺少必要参数: campus, partner, month')
        
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
            'success': True,
            'saved_count': saved_count,
            'items': [item.to_dict() for item in saved_items]
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f'保存失败: {str(e)}')

