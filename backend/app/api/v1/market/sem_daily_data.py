import calendar
from datetime import date, datetime, timedelta
from decimal import Decimal
from typing import Protocol, TypedDict, cast

from app.core.database import get_db
from app.models.market import 市场部SEM其他平台日度数据表, 市场部SEM百度推广日度数据表
from app.models.market.network_plan import MarketNetworkPlan
from fastapi import APIRouter, Body, Depends, HTTPException, Query
from sqlalchemy.orm import Session

router = APIRouter()


class SemRecordDict(TypedDict, total=False):
    id: int
    campus: str
    date: str | None
    baidu_income: float
    refund_count: int
    net_signup: int
    gross_total: int
    order_count: int
    visit_count: int
    baidu_consult_count: int
    baidu_consumption: float
    baidu_form: int
    center_come_in: int
    baidu_chat_out: int
    total_consult_count: int
    valid_consult_count: int
    baidu_total_dialogue: int
    valid_dialogue: int
    impression_count: int
    click_count: int
    consumption: float
    other_income: float
    other_consult_count: int
    other_consumption: float
    campus_website_visit: int
    geo: int
    created_at: str | None
    updated_at: str | None


class BaiduDailyRecord(Protocol):
    日期: date
    百度收入: Decimal
    退费数: int
    净报名: int
    毛报数: int
    订座数: int
    上门人数: int
    百度咨询量: int
    百度消费: Decimal
    百度表单: int
    中心来电: int
    百度聊出: int
    总咨询量: int
    有效咨询量: int
    百度总对话: int
    有效对话: int
    展现: int
    点击: int
    消费: Decimal

    def to_dict(self) -> SemRecordDict: ...


class OtherDailyRecord(Protocol):
    日期: date
    其他收入: Decimal
    退费数: int
    净报名: int
    毛报数: int
    订座数: int
    上门人数: int
    其他咨询量: int
    其他消费: Decimal
    神殿网站直接访问: int
    GEO: int

    def to_dict(self) -> SemRecordDict: ...


class MarketPlanRecord(Protocol):
    month: int
    sem_plan_income: Decimal
    sem_plan_signup: int
    sem_plan_consult: int
    sem_plan_cost: Decimal


class MonthlyCostData(TypedDict):
    sem_consumption: float
    consult_count: int


class PlanSummaryData(TypedDict):
    plan_income: float
    plan_signup: int
    plan_consult: int
    plan_cost: float


class SourceSummaryData(TypedDict):
    actual_income: float
    refund_count: int
    net_signup: int
    gross_total: int
    order_count: int
    visit_count: int
    consult_count: int
    consumption: float


class YearlySourceGroup(TypedDict):
    baidu: SourceSummaryData
    campus_website: SourceSummaryData
    geo: SourceSummaryData


def _as_baidu_record(record: 市场部SEM百度推广日度数据表) -> BaiduDailyRecord:
    return cast(BaiduDailyRecord, record)


def _as_other_record(record: 市场部SEM其他平台日度数据表) -> OtherDailyRecord:
    return cast(OtherDailyRecord, record)


def _as_market_plan(record: MarketNetworkPlan) -> MarketPlanRecord:
    return cast(MarketPlanRecord, record)


def _to_int(value: int | float | str | Decimal | None, default: int = 0) -> int:
    if value is None or value == "":
        return default
    if isinstance(value, Decimal):
        return int(value)
    return int(value)


def _to_decimal(value: object) -> Decimal:
    if value in (None, ""):
        return Decimal("0")
    return Decimal(str(value))


def _to_float(value: Decimal | int | float | None) -> float:
    if value is None:
        return 0.0
    return float(value)


def _empty_monthly_cost_data() -> MonthlyCostData:
    return {
        'sem_consumption': 0.0,
        'consult_count': 0,
    }


def _empty_source_data() -> SourceSummaryData:
    return {
        'actual_income': 0.0,
        'refund_count': 0,
        'net_signup': 0,
        'gross_total': 0,
        'order_count': 0,
        'visit_count': 0,
        'consult_count': 0,
        'consumption': 0.0,
    }


@router.get(
    '/sem-daily/baidu',
    summary='获取百度推广日度数据列表',
)
def get_baidu_daily_data(
    campus: str = Query(..., description='神殿名称'),
    month: str = Query(..., description='月份(YYYY-MM格式)'),
    db: Session = Depends(get_db),
):
    """
    获取指定神殿、月份的百度推广日度数据列表
    """
    try:
        # 解析月份
        year, month_num = map(int, month.split('-'))
        start_date = datetime(year, month_num, 1).date()
        
        # 计算月末日期
        last_day = calendar.monthrange(year, month_num)[1]
        end_date = datetime(year, month_num, last_day).date()
        
        # 查询数据
        items = cast(list[BaiduDailyRecord], db.query(市场部SEM百度推广日度数据表).filter(
            市场部SEM百度推广日度数据表.神殿 == campus,
            市场部SEM百度推广日度数据表.日期 >= start_date,
            市场部SEM百度推广日度数据表.日期 <= end_date
        ).order_by(市场部SEM百度推广日度数据表.日期).all())
        
        return {
            'success': True,
            'items': [item.to_dict() for item in items]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'查询失败: {str(e)}') from e


@router.post(
    '/sem-daily/baidu/bulk-save',
    summary='批量保存百度推广日度数据',
)
def bulk_save_baidu_daily_data(
    data: dict[str, object] = Body(...),
    db: Session = Depends(get_db),
):
    """
    批量保存百度推广日度数据
    
    请求体格式:
    {
        "campus": "神殿名称",
        "month": "YYYY-MM",
        "rows": [
            {
                "date": "YYYY-MM-DD",
                "baidu_income": 0,
                "refund_count": 0,
                "net_signup": 0,
                "gross_total": 0,
                "order_count": 0,
                "visit_count": 0,
                "baidu_consult_count": 0,
                "baidu_consumption": 0,
                "baidu_form": 0,
                "center_come_in": 0,
                "baidu_chat_out": 0,
                "total_consult_count": 0,
                "valid_consult_count": 0,
                "baidu_total_dialogue": 0,
                "valid_dialogue": 0,
                "impression_count": 0,
                "click_count": 0,
                "consumption": 0
            }
        ]
    }
    """
    try:
        campus = data.get('campus')
        month = data.get('month')
        rows = data.get('rows', [])
        
        if not campus or not month:
            raise HTTPException(status_code=400, detail='缺少必要参数: campus, month')
        
        saved_count = 0
        saved_items: list[市场部SEM百度推广日度数据表] = []
        
        for row in rows if isinstance(rows, list) else []:
            if not isinstance(row, dict):
                continue

            date_str = row.get('date')
            if not date_str:
                continue
            
            # 解析日期
            row_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            
            # 查找或创建记录
            existing = db.query(市场部SEM百度推广日度数据表).filter(
                市场部SEM百度推广日度数据表.神殿 == campus,
                市场部SEM百度推广日度数据表.日期 == row_date
            ).first()
            
            if existing:
                # 更新现有记录
                existing_record = _as_baidu_record(existing)
                existing_record.百度收入 = _to_decimal(row.get('baidu_income'))
                existing_record.退费数 = _to_int(row.get('refund_count'))
                existing_record.净报名 = _to_int(row.get('net_signup'))
                existing_record.毛报数 = _to_int(row.get('gross_total'))
                existing_record.订座数 = _to_int(row.get('order_count'))
                existing_record.上门人数 = _to_int(row.get('visit_count'))
                existing_record.百度咨询量 = _to_int(row.get('baidu_consult_count'))
                existing_record.百度消费 = _to_decimal(row.get('baidu_consumption'))
                existing_record.百度表单 = _to_int(row.get('baidu_form'))
                existing_record.中心来电 = _to_int(row.get('center_come_in'))
                existing_record.百度聊出 = _to_int(row.get('baidu_chat_out'))
                existing_record.总咨询量 = _to_int(row.get('total_consult_count'))
                existing_record.有效咨询量 = _to_int(row.get('valid_consult_count'))
                existing_record.百度总对话 = _to_int(row.get('baidu_total_dialogue'))
                existing_record.有效对话 = _to_int(row.get('valid_dialogue'))
                existing_record.展现 = _to_int(row.get('impression_count'))
                existing_record.点击 = _to_int(row.get('click_count'))
                existing_record.消费 = _to_decimal(row.get('consumption'))
                saved_items.append(existing)
            else:
                # 创建新记录
                new_item = 市场部SEM百度推广日度数据表(
                    神殿=campus,
                    日期=row_date,
                    百度收入=_to_decimal(row.get('baidu_income')),
                    退费数=_to_int(row.get('refund_count')),
                    净报名=_to_int(row.get('net_signup')),
                    毛报数=_to_int(row.get('gross_total')),
                    订座数=_to_int(row.get('order_count')),
                    上门人数=_to_int(row.get('visit_count')),
                    百度咨询量=_to_int(row.get('baidu_consult_count')),
                    百度消费=_to_decimal(row.get('baidu_consumption')),
                    百度表单=_to_int(row.get('baidu_form')),
                    中心来电=_to_int(row.get('center_come_in')),
                    百度聊出=_to_int(row.get('baidu_chat_out')),
                    总咨询量=_to_int(row.get('total_consult_count')),
                    有效咨询量=_to_int(row.get('valid_consult_count')),
                    百度总对话=_to_int(row.get('baidu_total_dialogue')),
                    有效对话=_to_int(row.get('valid_dialogue')),
                    展现=_to_int(row.get('impression_count')),
                    点击=_to_int(row.get('click_count')),
                    消费=_to_decimal(row.get('consumption'))
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
        raise HTTPException(status_code=500, detail=f'保存失败: {str(e)}') from e


@router.get(
    '/sem-daily/other',
    summary='获取其他平台日度数据列表',
)
def get_other_daily_data(
    campus: str = Query(..., description='神殿名称'),
    month: str = Query(..., description='月份(YYYY-MM格式)'),
    db: Session = Depends(get_db),
):
    """
    获取指定神殿、月份的其他平台日度数据列表
    """
    try:
        # 解析月份
        year, month_num = map(int, month.split('-'))
        start_date = datetime(year, month_num, 1).date()
        
        # 计算月末日期
        last_day = calendar.monthrange(year, month_num)[1]
        end_date = datetime(year, month_num, last_day).date()
        
        # 查询数据
        items = cast(list[OtherDailyRecord], db.query(市场部SEM其他平台日度数据表).filter(
            市场部SEM其他平台日度数据表.神殿 == campus,
            市场部SEM其他平台日度数据表.日期 >= start_date,
            市场部SEM其他平台日度数据表.日期 <= end_date
        ).order_by(市场部SEM其他平台日度数据表.日期).all())
        
        return {
            'success': True,
            'items': [item.to_dict() for item in items]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'查询失败: {str(e)}') from e


@router.post(
    '/sem-daily/other/bulk-save',
    summary='批量保存其他平台日度数据',
)
def bulk_save_other_daily_data(
    data: dict[str, object] = Body(...),
    db: Session = Depends(get_db),
):
    """
    批量保存其他平台日度数据
    
    请求体格式:
    {
        "campus": "神殿名称",
        "month": "YYYY-MM",
        "rows": [
            {
                "date": "YYYY-MM-DD",
                "other_income": 0,
                "refund_count": 0,
                "net_signup": 0,
                "gross_total": 0,
                "order_count": 0,
                "visit_count": 0,
                "other_consult_count": 0,
                "other_consumption": 0,
                "campus_website_visit": 0,
                "geo": 0
            }
        ]
    }
    """
    try:
        campus = data.get('campus')
        month = data.get('month')
        rows = data.get('rows', [])
        
        if not campus or not month:
            raise HTTPException(status_code=400, detail='缺少必要参数: campus, month')
        
        saved_count = 0
        saved_items: list[市场部SEM其他平台日度数据表] = []
        
        for row in rows if isinstance(rows, list) else []:
            if not isinstance(row, dict):
                continue

            date_str = row.get('date')
            if not date_str:
                continue
            
            # 解析日期
            row_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            
            # 查找或创建记录
            existing = db.query(市场部SEM其他平台日度数据表).filter(
                市场部SEM其他平台日度数据表.神殿 == campus,
                市场部SEM其他平台日度数据表.日期 == row_date
            ).first()
            
            if existing:
                # 更新现有记录
                existing_record = _as_other_record(existing)
                existing_record.其他收入 = _to_decimal(row.get('other_income'))
                existing_record.退费数 = _to_int(row.get('refund_count'))
                existing_record.净报名 = _to_int(row.get('net_signup'))
                existing_record.毛报数 = _to_int(row.get('gross_total'))
                existing_record.订座数 = _to_int(row.get('order_count'))
                existing_record.上门人数 = _to_int(row.get('visit_count'))
                existing_record.其他咨询量 = _to_int(row.get('other_consult_count'))
                existing_record.其他消费 = _to_decimal(row.get('other_consumption'))
                existing_record.神殿网站直接访问 = _to_int(row.get('campus_website_visit'))
                existing_record.GEO = _to_int(row.get('geo'))
                saved_items.append(existing)
            else:
                # 创建新记录
                new_item = 市场部SEM其他平台日度数据表(
                    神殿=campus,
                    日期=row_date,
                    其他收入=_to_decimal(row.get('other_income')),
                    退费数=_to_int(row.get('refund_count')),
                    净报名=_to_int(row.get('net_signup')),
                    毛报数=_to_int(row.get('gross_total')),
                    订座数=_to_int(row.get('order_count')),
                    上门人数=_to_int(row.get('visit_count')),
                    其他咨询量=_to_int(row.get('other_consult_count')),
                    其他消费=_to_decimal(row.get('other_consumption')),
                    神殿网站直接访问=_to_int(row.get('campus_website_visit')),
                    GEO=_to_int(row.get('geo'))
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
        raise HTTPException(status_code=500, detail=f'保存失败: {str(e)}') from e


@router.get(
    '/sem-daily/summary',
    summary='获取汇总数据（从百度推广和其他平台自动汇总）',
)
def get_summary_data(
    campus: str = Query(..., description='神殿名称'),
    month: str = Query(..., description='月份(YYYY-MM格式)'),
    db: Session = Depends(get_db),
):
    """
    获取指定神殿、月份的汇总数据
    汇总数据从百度推广和其他平台自动计算得出
    """
    try:
        # 解析月份
        year, month_num = map(int, month.split('-'))
        start_date = datetime(year, month_num, 1).date()
        
        # 计算月末日期
        last_day = calendar.monthrange(year, month_num)[1]
        end_date = datetime(year, month_num, last_day).date()
        
        # 查询百度推广数据
        baidu_items = cast(list[BaiduDailyRecord], db.query(市场部SEM百度推广日度数据表).filter(
            市场部SEM百度推广日度数据表.神殿 == campus,
            市场部SEM百度推广日度数据表.日期 >= start_date,
            市场部SEM百度推广日度数据表.日期 <= end_date
        ).all())
        
        # 查询其他平台数据
        other_items = cast(list[OtherDailyRecord], db.query(市场部SEM其他平台日度数据表).filter(
            市场部SEM其他平台日度数据表.神殿 == campus,
            市场部SEM其他平台日度数据表.日期 >= start_date,
            市场部SEM其他平台日度数据表.日期 <= end_date
        ).all())
        
        # 构建日期到数据的映射
        baidu_map: dict[date, BaiduDailyRecord] = {item.日期: item for item in baidu_items}
        other_map: dict[date, OtherDailyRecord] = {item.日期: item for item in other_items}
        
        # 生成汇总数据
        summary_items = []
        current_date = start_date
        while current_date <= end_date:
            baidu_data = baidu_map.get(current_date)
            other_data = other_map.get(current_date)
            
            # 汇总计算
            sem_actual_income = 0.0
            refund_count = 0
            net_signup = 0
            gross_total = 0
            order_count = 0
            visit_count = 0
            actual_consult_count = 0
            sem_consumption = 0.0
            
            if baidu_data:
                sem_actual_income += _to_float(baidu_data.百度收入)
                refund_count += baidu_data.退费数
                net_signup += baidu_data.净报名
                gross_total += baidu_data.毛报数
                order_count += baidu_data.订座数
                visit_count += baidu_data.上门人数
                actual_consult_count += baidu_data.百度咨询量
                sem_consumption += _to_float(baidu_data.百度消费)
            
            if other_data:
                sem_actual_income += _to_float(other_data.其他收入)
                refund_count += other_data.退费数
                net_signup += other_data.净报名
                gross_total += other_data.毛报数
                order_count += other_data.订座数
                visit_count += other_data.上门人数
                actual_consult_count += other_data.其他咨询量
                sem_consumption += _to_float(other_data.其他消费)
            
            summary_items.append({
                'date': current_date.isoformat(),
                'sem_actual_income': sem_actual_income,
                'refund_count': refund_count,
                'net_signup': net_signup,
                'gross_total': gross_total,
                'order_count': order_count,
                'visit_count': visit_count,
                'actual_consult_count': actual_consult_count,
                'sem_consumption': sem_consumption,
            })
            
            # 移动到下一天
            current_date += timedelta(days=1)
        
        return {
            'success': True,
            'items': summary_items
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'查询失败: {str(e)}') from e


@router.get(
    '/sem-daily/monthly-summary',
    summary='获取SEM月度成本汇总（用于咨询量成本计算）',
)
def get_monthly_cost_summary(
    campus: str = Query(..., description='神殿名称'),
    year: int = Query(..., description='年份'),
    db: Session = Depends(get_db),
):
    """
    获取指定神殿、年份的SEM月度成本汇总
    用于祈福司门计算费用投入 = 咨询量成本 × 咨询总量
    
    返回数据结构:
    {
        "success": true,
        "data": [
            {
                "month": 1,
                "sem_consumption": 10000,  # SEM消费（百度+其他）
                "consult_count": 100,      # SEM咨询量
                "consult_cost": 100        # 咨询量成本 = 消费/咨询量
            }
        ]
    }
    """
    try:
        start_date = datetime(year, 1, 1).date()
        end_date = datetime(year, 12, 31).date()
        
        # 查询百度推广数据
        baidu_items = cast(list[BaiduDailyRecord], db.query(市场部SEM百度推广日度数据表).filter(
            市场部SEM百度推广日度数据表.神殿 == campus,
            市场部SEM百度推广日度数据表.日期 >= start_date,
            市场部SEM百度推广日度数据表.日期 <= end_date
        ).all())
        
        # 查询其他平台数据
        other_items = cast(list[OtherDailyRecord], db.query(市场部SEM其他平台日度数据表).filter(
            市场部SEM其他平台日度数据表.神殿 == campus,
            市场部SEM其他平台日度数据表.日期 >= start_date,
            市场部SEM其他平台日度数据表.日期 <= end_date
        ).all())
        
        # 按月汇总
        monthly_data: dict[int, MonthlyCostData] = {
            month: _empty_monthly_cost_data() for month in range(1, 13)
        }
        
        # 处理百度推广数据
        for baidu_item in baidu_items:
            month = baidu_item.日期.month
            monthly_data[month]['sem_consumption'] += _to_float(baidu_item.百度消费)
            monthly_data[month]['consult_count'] += baidu_item.百度咨询量
        
        # 处理其他平台数据
        for other_item in other_items:
            month = other_item.日期.month
            monthly_data[month]['sem_consumption'] += _to_float(other_item.其他消费)
            monthly_data[month]['consult_count'] += other_item.其他咨询量
        
        # 计算咨询量成本
        result_data = []
        for month in range(1, 13):
            data = monthly_data[month]
            consult_cost = 0.0
            if data['consult_count'] > 0:
                consult_cost = round(data['sem_consumption'] / data['consult_count'], 2)
            
            result_data.append({
                'month': month,
                'sem_consumption': round(data['sem_consumption'], 2),
                'consult_count': data['consult_count'],
                'consult_cost': consult_cost,
            })
        
        return {
            'success': True,
            'data': result_data,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'查询失败: {str(e)}') from e


@router.get(
    '/sem-daily/yearly-summary',
    summary='获取年度SEM汇总数据（按月汇总，用于SEM推广看板）',
)
def get_yearly_summary_data(
    campus: str = Query(..., description='神殿名称'),
    year: int = Query(..., description='年份'),
    db: Session = Depends(get_db),
):
    """
    获取指定神殿、年份的年度汇总数据（按月汇总）
    用于填充SEM推广数据看板01和02
    
    返回数据结构:
    {
        "items": [
            {
                "month": 1,
                "plan": { ... },  # 计划数据（来自市场部年度网络计划表）
                "total": { ... },  # 总计（百度+神殿网站+GEO）
                "baidu": { ... },  # 百度数据
                "campus_website": { ... },  # 神殿网站数据
                "geo": { ... }  # GEO数据
            },
            ...
        ]
    }
    """
    try:
        start_date = datetime(year, 1, 1).date()
        end_date = datetime(year, 12, 31).date()
        
        # 查询市场部年度网络计划表数据（获取SEM计划数据）
        plan_items = cast(list[MarketPlanRecord], db.query(MarketNetworkPlan).filter(
            MarketNetworkPlan.year == str(year),
            MarketNetworkPlan.campus == campus
        ).all())
        
        # 构建计划数据映射（按月份）
        plan_data: dict[int, PlanSummaryData] = {
            month: {
                'plan_income': 0.0,
                'plan_signup': 0,
                'plan_consult': 0,
                'plan_cost': 0.0,
            }
            for month in range(1, 13)
        }
        
        for plan_item in plan_items:
            month = plan_item.month
            if month and 1 <= month <= 12:
                plan_data[month]['plan_income'] = _to_float(plan_item.sem_plan_income)
                plan_data[month]['plan_signup'] = plan_item.sem_plan_signup
                plan_data[month]['plan_consult'] = plan_item.sem_plan_consult
                plan_data[month]['plan_cost'] = _to_float(plan_item.sem_plan_cost)
        
        # 查询百度推广数据
        baidu_items = cast(list[BaiduDailyRecord], db.query(市场部SEM百度推广日度数据表).filter(
            市场部SEM百度推广日度数据表.神殿 == campus,
            市场部SEM百度推广日度数据表.日期 >= start_date,
            市场部SEM百度推广日度数据表.日期 <= end_date
        ).all())
        
        # 查询其他平台数据
        other_items = cast(list[OtherDailyRecord], db.query(市场部SEM其他平台日度数据表).filter(
            市场部SEM其他平台日度数据表.神殿 == campus,
            市场部SEM其他平台日度数据表.日期 >= start_date,
            市场部SEM其他平台日度数据表.日期 <= end_date
        ).all())
        
        # 按月份分组数据
        monthly_data: dict[int, YearlySourceGroup] = {
            month: {
                'baidu': _empty_source_data(),
                'campus_website': _empty_source_data(),
                'geo': _empty_source_data(),
            }
            for month in range(1, 13)
        }
        
        # 处理百度推广数据
        for baidu_item in baidu_items:
            month = baidu_item.日期.month
            monthly_data[month]['baidu']['actual_income'] += _to_float(baidu_item.百度收入)
            monthly_data[month]['baidu']['refund_count'] += baidu_item.退费数
            monthly_data[month]['baidu']['net_signup'] += baidu_item.净报名
            monthly_data[month]['baidu']['gross_total'] += baidu_item.毛报数
            monthly_data[month]['baidu']['order_count'] += baidu_item.订座数
            monthly_data[month]['baidu']['visit_count'] += baidu_item.上门人数
            monthly_data[month]['baidu']['consult_count'] += baidu_item.百度咨询量
            monthly_data[month]['baidu']['consumption'] += _to_float(baidu_item.百度消费)
        
        # 处理其他平台数据（神殿网站和GEO）
        for other_item in other_items:
            month = other_item.日期.month
            
            # 神殿网站直接访问数据
            campus_website_count = other_item.神殿网站直接访问
            geo_count = other_item.GEO
            # 按比例分配其他平台的数据到神殿网站和GEO（除了消费）
            if campus_website_count + geo_count > 0:
                cw_ratio = campus_website_count / (campus_website_count + geo_count)
                geo_ratio = geo_count / (campus_website_count + geo_count)
            else:
                cw_ratio = 0.5
                geo_ratio = 0.5
            
            # 神殿网站（消费始终为0）
            monthly_data[month]['campus_website']['actual_income'] += _to_float(other_item.其他收入) * cw_ratio
            monthly_data[month]['campus_website']['refund_count'] += int(other_item.退费数 * cw_ratio)
            monthly_data[month]['campus_website']['net_signup'] += int(other_item.净报名 * cw_ratio)
            monthly_data[month]['campus_website']['gross_total'] += int(other_item.毛报数 * cw_ratio)
            monthly_data[month]['campus_website']['order_count'] += int(other_item.订座数 * cw_ratio)
            monthly_data[month]['campus_website']['visit_count'] += int(other_item.上门人数 * cw_ratio)
            monthly_data[month]['campus_website']['consult_count'] += campus_website_count
            # 神殿网站消费始终为0
            monthly_data[month]['campus_website']['consumption'] += 0.0
            
            # GEO（所有其他消费都分配给GEO）
            monthly_data[month]['geo']['actual_income'] += _to_float(other_item.其他收入) * geo_ratio
            monthly_data[month]['geo']['refund_count'] += int(other_item.退费数 * geo_ratio)
            monthly_data[month]['geo']['net_signup'] += int(other_item.净报名 * geo_ratio)
            monthly_data[month]['geo']['gross_total'] += int(other_item.毛报数 * geo_ratio)
            monthly_data[month]['geo']['order_count'] += int(other_item.订座数 * geo_ratio)
            monthly_data[month]['geo']['visit_count'] += int(other_item.上门人数 * geo_ratio)
            monthly_data[month]['geo']['consult_count'] += geo_count
            # GEO获得所有其他消费
            monthly_data[month]['geo']['consumption'] += _to_float(other_item.其他消费)
        
        # 构建返回结果
        result_items = []
        for month in range(1, 13):
            data = monthly_data[month]
            
            # 计算总计
            total = _empty_source_data()
            baidu_source = data['baidu']
            campus_source = data['campus_website']
            geo_source = data['geo']
            total['actual_income'] += (
                baidu_source['actual_income']
                + campus_source['actual_income']
                + geo_source['actual_income']
            )
            total['refund_count'] += (
                baidu_source['refund_count']
                + campus_source['refund_count']
                + geo_source['refund_count']
            )
            total['net_signup'] += (
                baidu_source['net_signup']
                + campus_source['net_signup']
                + geo_source['net_signup']
            )
            total['gross_total'] += (
                baidu_source['gross_total']
                + campus_source['gross_total']
                + geo_source['gross_total']
            )
            total['order_count'] += (
                baidu_source['order_count']
                + campus_source['order_count']
                + geo_source['order_count']
            )
            total['visit_count'] += (
                baidu_source['visit_count']
                + campus_source['visit_count']
                + geo_source['visit_count']
            )
            total['consult_count'] += (
                baidu_source['consult_count']
                + campus_source['consult_count']
                + geo_source['consult_count']
            )
            total['consumption'] += (
                baidu_source['consumption']
                + campus_source['consumption']
                + geo_source['consumption']
            )
            
            result_items.append({
                'month': month,
                'plan': plan_data[month],  # 计划数据来自市场部年度网络计划表
                'total': total,
                'baidu': data['baidu'],
                'campus_website': data['campus_website'],
                'geo': data['geo'],
            })
        
        return {
            'success': True,
            'items': result_items,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'查询失败: {str(e)}') from e
