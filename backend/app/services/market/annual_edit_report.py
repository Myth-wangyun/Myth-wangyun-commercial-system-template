"""市场部剪辑年度汇报表 - Service

从剪辑月度表汇总数据生成年度报表（只有合计行）
"""

from typing import Dict, List, TypedDict

from app.models.market.monthly_edit_report import 市场部剪辑月度汇报表
from app.models.market.weekly_edit_report import 市场部剪辑周度汇报表
from app.schemas.market.annual_edit_report import AnnualEditReportBase
from sqlalchemy.orm import Session


class AnnualTotals(TypedDict):
    audienceTypeCount: str
    plannedArticles: int
    actualArticles: int
    plannedEditDemand: int
    completedEditDemand: int
    actualShootVideos: int
    shootCompletionProgress: str
    monthlyEditPlans: int
    completedEarlyPlans: int
    actualEditedVideos: int
    editProgressRate: str
    auditPassVideoCount: int
    auditPassRate: str
    groupActivity: str


def get_annual_edit_report_list(db: Session, year: int, force_regenerate: bool = False) -> List[AnnualEditReportBase]:
    """获取剪辑年度汇报列表（从月度表汇总，只有合计行）
    
    Args:
        db: 数据库会话
        year: 年份
        force_regenerate: 是否强制从周度表重新生成（默认False，从月度表读取）
    """
    # 如果强制重新生成，直接从周度表汇总
    if force_regenerate:
        return generate_from_weekly(db, year)
    
    # 查询该年度所有月度数据的合计行
    monthly_data = db.query(市场部剪辑月度汇报表).filter(
        市场部剪辑月度汇报表.year == year,
        市场部剪辑月度汇报表.row_type == 'summary'  # 只取合计行
    ).order_by(市场部剪辑月度汇报表.month).all()
    
    # 如果没有月度数据，尝试从周度表生成
    if not monthly_data:
        return generate_from_weekly(db, year)
    
    # 按月份组织数据
    monthly_map: Dict[int, 市场部剪辑月度汇报表] = {}
    for record in monthly_data:
        if record.month > 0:  # 排除 month=0 的记录
            monthly_map[record.month] = record
    
    # 生成年度报表数据
    result_list: List[AnnualEditReportBase] = []
    
    # 1. 生成1-12月的行
    for month in range(1, 13):
        if month in monthly_map:
            record = monthly_map[month]
            result_list.append(AnnualEditReportBase(
                key=str(month),
                period=str(month),
                periodLabel=f'{month}月',
                campus='合计',
                audienceTypeCount=record.audience_type_count or '',
                plannedArticles=record.planned_articles or 0,
                actualArticles=record.actual_articles or 0,
                plannedEditDemand=record.planned_edit_demand or 0,
                completedEditDemand=record.completed_edit_demand or 0,
                actualShootVideos=record.actual_shoot_videos or 0,
                shootCompletionProgress=record.shoot_completion_progress or '#DIV/0!',
                monthlyEditPlans=record.monthly_edit_plans or 0,
                completedEarlyPlans=record.completed_early_plans or 0,
                actualEditedVideos=record.actual_edited_videos or 0,
                editProgressRate=record.edit_progress_rate or '#DIV/0!',
                auditPassVideoCount=record.audit_pass_video_count or 0,
                auditPassRate=record.audit_pass_rate or '#DIV/0!',
                groupActivity=record.group_activity or ''
            ))
        else:
            # 如果某月没有数据，添加空行
            result_list.append(AnnualEditReportBase(
                key=str(month),
                period=str(month),
                periodLabel=f'{month}月',
                campus='合计',
                audienceTypeCount='',
                plannedArticles=0,
                actualArticles=0,
                plannedEditDemand=0,
                completedEditDemand=0,
                actualShootVideos=0,
                shootCompletionProgress='#DIV/0!',
                monthlyEditPlans=0,
                completedEarlyPlans=0,
                actualEditedVideos=0,
                editProgressRate='#DIV/0!',
                auditPassVideoCount=0,
                auditPassRate='#DIV/0!',
                groupActivity=''
            ))
    
    # 2. 生成全年度合计行
    yearly_totals = calculate_yearly_totals(monthly_map)
    result_list.insert(0, AnnualEditReportBase(
        key='all-year',
        period='all-year',
        periodLabel='全年度',
        campus='合计',
        **yearly_totals
    ))
    
    return result_list


def calculate_yearly_totals(monthly_map: Dict[int, 市场部剪辑月度汇报表]) -> AnnualTotals:
    """计算全年合计数据"""
    totals: AnnualTotals = {
        'audienceTypeCount': '',
        'plannedArticles': 0,
        'actualArticles': 0,
        'plannedEditDemand': 0,
        'completedEditDemand': 0,
        'actualShootVideos': 0,
        'shootCompletionProgress': '#DIV/0!',
        'monthlyEditPlans': 0,
        'completedEarlyPlans': 0,
        'actualEditedVideos': 0,
        'editProgressRate': '#DIV/0!',
        'auditPassVideoCount': 0,
        'auditPassRate': '#DIV/0!',
        'groupActivity': ''
    }
    
    # 计算全年人群类别平均值（排除0和空值）
    audience_values = []
    
    for month, record in monthly_map.items():
        totals['plannedArticles'] += record.planned_articles or 0
        totals['actualArticles'] += record.actual_articles or 0
        totals['plannedEditDemand'] += record.planned_edit_demand or 0
        totals['completedEditDemand'] += record.completed_edit_demand or 0
        totals['actualShootVideos'] += record.actual_shoot_videos or 0
        totals['monthlyEditPlans'] += record.monthly_edit_plans or 0
        totals['completedEarlyPlans'] += record.completed_early_plans or 0
        totals['actualEditedVideos'] += record.actual_edited_videos or 0
        totals['auditPassVideoCount'] += record.audit_pass_video_count or 0
        
        # 收集人群类别值
        if record.audience_type_count:
            try:
                val = float(record.audience_type_count)
                if val > 0:
                    audience_values.append(val)
            except ValueError:
                pass
    
    # 计算人群类别平均值
    if audience_values:
        totals['audienceTypeCount'] = str(round(sum(audience_values) / len(audience_values), 1))
    
    # 计算比率
    totals['shootCompletionProgress'] = calc_rate(totals['actualShootVideos'], totals['plannedEditDemand'])
    totals['editProgressRate'] = calc_rate(totals['actualEditedVideos'], totals['monthlyEditPlans'])
    totals['auditPassRate'] = calc_rate(totals['auditPassVideoCount'], totals['actualEditedVideos'])
    
    return totals


def calc_rate(num, den):
    """计算比率"""
    if not den:
        return '#DIV/0!'
    return f"{int((num / den) * 100)}%"


def generate_from_weekly(db: Session, year: int) -> List[AnnualEditReportBase]:
    """直接从周度表汇总生成年度报表数据
    
    这个函数跳过月度表，直接从周度表读取数据并汇总
    """
    # 获取该年度所有周度数据的月合计行（row_type='month-summary'）
    weekly_month_summaries = db.query(市场部剪辑周度汇报表).filter(
        市场部剪辑周度汇报表.year == year,
        市场部剪辑周度汇报表.row_type == 'month-summary'
    ).order_by(市场部剪辑周度汇报表.month).all()
    
    if not weekly_month_summaries:
        return []
    
    # 按月份组织数据
    monthly_map: Dict[int, 市场部剪辑周度汇报表] = {}
    for record in weekly_month_summaries:
        if record.month > 0:  # 排除 month=0 的记录
            monthly_map[record.month] = record
    
    # 生成年度报表数据
    result_list: List[AnnualEditReportBase] = []
    
    # 1. 生成1-12月的行
    for month in range(1, 13):
        if month in monthly_map:
            record = monthly_map[month]
            result_list.append(AnnualEditReportBase(
                key=str(month),
                period=str(month),
                periodLabel=f'{month}月',
                campus='合计',
                audienceTypeCount=str(record.audience_type_count) if record.audience_type_count else '',
                plannedArticles=record.planned_articles or 0,
                actualArticles=record.actual_articles or 0,
                plannedEditDemand=record.planned_edit_demand or 0,
                completedEditDemand=record.completed_edit_demand or 0,
                actualShootVideos=record.actual_shoot_videos or 0,
                shootCompletionProgress=record.shoot_completion_progress or '#DIV/0!',
                monthlyEditPlans=record.monthly_edit_plans or 0,
                completedEarlyPlans=record.completed_early_plans or 0,
                actualEditedVideos=record.actual_edited_videos or 0,
                editProgressRate=record.edit_progress_rate or '#DIV/0!',
                auditPassVideoCount=record.audit_pass_video_count or 0,
                auditPassRate=record.audit_pass_rate or '#DIV/0!',
                groupActivity=record.group_activity or ''
            ))
        else:
            # 如果某月没有数据，添加空行
            result_list.append(AnnualEditReportBase(
                key=str(month),
                period=str(month),
                periodLabel=f'{month}月',
                campus='合计',
                audienceTypeCount='',
                plannedArticles=0,
                actualArticles=0,
                plannedEditDemand=0,
                completedEditDemand=0,
                actualShootVideos=0,
                shootCompletionProgress='#DIV/0!',
                monthlyEditPlans=0,
                completedEarlyPlans=0,
                actualEditedVideos=0,
                editProgressRate='#DIV/0!',
                auditPassVideoCount=0,
                auditPassRate='#DIV/0!',
                groupActivity=''
            ))
    
    # 2. 生成全年度合计行
    yearly_totals = calculate_yearly_totals_from_weekly(monthly_map)
    result_list.insert(0, AnnualEditReportBase(
        key='all-year',
        period='all-year',
        periodLabel='全年度',
        campus='合计',
        **yearly_totals
    ))
    
    return result_list


def calculate_yearly_totals_from_weekly(monthly_map: Dict[int, 市场部剪辑周度汇报表]) -> AnnualTotals:
    """从周度表的月合计数据计算全年合计"""
    totals: AnnualTotals = {
        'audienceTypeCount': '',
        'plannedArticles': 0,
        'actualArticles': 0,
        'plannedEditDemand': 0,
        'completedEditDemand': 0,
        'actualShootVideos': 0,
        'shootCompletionProgress': '#DIV/0!',
        'monthlyEditPlans': 0,
        'completedEarlyPlans': 0,
        'actualEditedVideos': 0,
        'editProgressRate': '#DIV/0!',
        'auditPassVideoCount': 0,
        'auditPassRate': '#DIV/0!',
        'groupActivity': ''
    }
    
    # 计算全年人群类别平均值（排除0和空值）
    audience_values = []
    
    for month, record in monthly_map.items():
        totals['plannedArticles'] += record.planned_articles or 0
        totals['actualArticles'] += record.actual_articles or 0
        totals['plannedEditDemand'] += record.planned_edit_demand or 0
        totals['completedEditDemand'] += record.completed_edit_demand or 0
        totals['actualShootVideos'] += record.actual_shoot_videos or 0
        totals['monthlyEditPlans'] += record.monthly_edit_plans or 0
        totals['completedEarlyPlans'] += record.completed_early_plans or 0
        totals['actualEditedVideos'] += record.actual_edited_videos or 0
        totals['auditPassVideoCount'] += record.audit_pass_video_count or 0
        
        # 收集人群类别值
        if record.audience_type_count:
            try:
                val = float(record.audience_type_count)
                if val > 0:
                    audience_values.append(val)
            except (ValueError, TypeError):
                pass
    
    # 计算人群类别平均值
    if audience_values:
        totals['audienceTypeCount'] = str(round(sum(audience_values) / len(audience_values), 1))
    
    # 计算比率
    totals['shootCompletionProgress'] = calc_rate(totals['actualShootVideos'], totals['plannedEditDemand'])
    totals['editProgressRate'] = calc_rate(totals['actualEditedVideos'], totals['monthlyEditPlans'])
    totals['auditPassRate'] = calc_rate(totals['auditPassVideoCount'], totals['actualEditedVideos'])
    
    return totals
