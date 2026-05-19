from typing import Dict, List

from app.models.config_master import CampusProfile
from app.models.market.monthly_edit_report import 市场部剪辑月度汇报表
from app.models.market.weekly_edit_report import 市场部剪辑周度汇报表
from app.schemas.market.monthly_edit_report import MonthlyEditReportBase
from sqlalchemy.orm import Session


def get_all_campuses(db: Session) -> List[str]:
    """从神殿配置表获取所有活跃神殿名称（简称，不含省份前缀和"神殿"后缀）"""
    campus_records = db.query(CampusProfile).filter(
        CampusProfile.is_active.is_(True),
        CampusProfile.name != '测试神殿'  # 排除测试神殿
    ).all()
    
    # 提取神殿名称，去除省份前缀和"神殿"后缀
    # 例如："河北主神殿" -> "盛邦"
    campus_names = []
    for c in campus_records:
        name = c.name or ''
        # 去除省份前缀（常见省份）
        prefixes = ['河北', '山西', '广西', '贵州', '山东', '河南', '四川', '湖北', '湖南', '江苏', '浙江', '福建', '广东']
        for prefix in prefixes:
            if name.startswith(prefix):
                name = name[len(prefix):]
                break
        # 去除"神殿"后缀
        if name.endswith('神殿'):
            name = name[:-2]
        if name:
            campus_names.append(name)
    
    return sorted(campus_names)


def generate_empty_structure(campuses: List[str]) -> List[MonthlyEditReportBase]:
    """当没有周度表数据时，生成一个空的默认结构"""
    result_list: List[MonthlyEditReportBase] = []
    periods = ['all-year'] + [str(i) for i in range(1, 13)]
    
    for period in periods:
        period_label = '全年度' if period == 'all-year' else f'{period}月'
        
        # 添加合计行
        summary_row = MonthlyEditReportBase(
            key=f"{period}-合计",
            row_type='summary',
            period=period,
            period_label=period_label,
            campus='合计',
            audience_type_count='',
            planned_articles=0,
            actual_articles=0,
            planned_edit_demand=0,
            completed_edit_demand=0,
            actual_shoot_videos=0,
            shoot_completion_progress='#DIV/0!',
            monthly_edit_plans=0,
            completed_early_plans=0,
            actual_edited_videos=0,
            edit_progress_rate='#DIV/0!',
            audit_pass_video_count=0,
            audit_pass_rate='#DIV/0!',
            group_activity=''
        )
        result_list.append(summary_row)
        
        # 添加各神殿行
        for campus in campuses:
            campus_row = MonthlyEditReportBase(
                key=f"{period}-{campus}",
                row_type='data',
                period=period,
                period_label=period_label,
                campus=campus,
                audience_type_count='',
                planned_articles=0,
                actual_articles=0,
                planned_edit_demand=0,
                completed_edit_demand=0,
                actual_shoot_videos=0,
                shoot_completion_progress='#DIV/0!',
                monthly_edit_plans=0,
                completed_early_plans=0,
                actual_edited_videos=0,
                edit_progress_rate='#DIV/0!',
                audit_pass_video_count=0,
                audit_pass_rate='#DIV/0!',
                group_activity=''
            )
            result_list.append(campus_row)
    
    return result_list


def get_monthly_edit_report_list(db: Session, year: int) -> List[MonthlyEditReportBase]:
    """获取剪辑月度汇报列表"""
    # 1. 尝试查询已有数据
    existing_data = db.query(市场部剪辑月度汇报表).filter(
        市场部剪辑月度汇报表.year == year
    ).all()

    if existing_data:
        results = []
        for row in existing_data:
            results.append(MonthlyEditReportBase(
                key=f"{row.period}-{row.campus}",
                row_type=row.row_type,
                period=row.period,
                period_label=row.period_label,
                campus=row.campus,
                audience_type_count=row.audience_type_count or '',
                planned_articles=row.planned_articles,
                actual_articles=row.actual_articles,
                planned_edit_demand=row.planned_edit_demand,
                completed_edit_demand=row.completed_edit_demand,
                actual_shoot_videos=row.actual_shoot_videos,
                shoot_completion_progress=row.shoot_completion_progress,
                monthly_edit_plans=row.monthly_edit_plans,
                completed_early_plans=row.completed_early_plans,
                actual_edited_videos=row.actual_edited_videos,
                edit_progress_rate=row.edit_progress_rate,
                audit_pass_video_count=row.audit_pass_video_count,
                audit_pass_rate=row.audit_pass_rate,
                group_activity=row.group_activity or ''
            ))
        return results

    # 2. 如果没有数据，从周报汇总
    return generate_from_weekly(db, year)


def generate_from_weekly(db: Session, year: int) -> List[MonthlyEditReportBase]:
    """从周报汇总数据
    
    人群类别计算规则：
    1. 单月各神殿人群类别 = 该神殿该月所有周的人群类别简单平均（排除0和空值）
    2. 单月合计人群类别 = 该月所有神殿人群类别的简单平均（排除0和空值）
    3. 全年人群类别 = 所有月份合计人群类别的简单平均（排除0和空值）
    """
    # 获取周报数据 - 神殿行用于获取神殿级别的数据
    # 注意：必须排除 week=0 的月汇总行，避免数据重复计算
    weekly_campus_records = db.query(市场部剪辑周度汇报表).filter(
        市场部剪辑周度汇报表.year == year,
        市场部剪辑周度汇报表.row_type == 'campus',
        市场部剪辑周度汇报表.week != 0  # 排除月汇总行
    ).all()
    
    # 获取周报数据 - summary行用于获取合并列的数据（计划拍摄次数、截止昨日应完成拍摄次数等）
    weekly_summary_records = db.query(市场部剪辑周度汇报表).filter(
        市场部剪辑周度汇报表.year == year,
        市场部剪辑周度汇报表.row_type == 'summary'
    ).all()

    # 获取所有神殿 (从周报数据中提取去重)
    campuses = set([r.campus for r in weekly_campus_records if r.campus])
    
    # 如果周报没有任何数据，从神殿配置表获取神殿，生成空的默认结构
    if not campuses:
        config_campuses = get_all_campuses(db)
        if not config_campuses:
            return []
        return generate_empty_structure(config_campuses)
    
    sorted_campuses = sorted(list(campuses))

    # 准备结果容器
    result_list: List[MonthlyEditReportBase] = []
    
    # 存储每个月的神殿人群类别，用于计算月合计
    # 格式: {month: {campus: audience_type_avg}}
    monthly_campus_audience: Dict[int, Dict[str, float]] = {}
    
    # 存储每个月的合计人群类别，用于计算全年
    monthly_summary_audience: Dict[int, float] = {}

    periods = ['all-year'] + [str(i) for i in range(1, 13)]

    # 第一遍：先计算各月各神殿的人群类别
    for month in range(1, 13):
        monthly_campus_audience[month] = {}
        for campus in sorted_campuses:
            # 获取该月该神殿所有周的数据（排除week=0的月汇总行）
            campus_week_records = [r for r in weekly_campus_records 
                                   if r.month == month and r.campus == campus and r.week != 0]
            # 计算该神殿该月的人群类别平均值
            valid_audience_types = [r.audience_type_count for r in campus_week_records 
                                    if r.audience_type_count is not None and r.audience_type_count > 0]
            if valid_audience_types:
                monthly_campus_audience[month][campus] = round(sum(valid_audience_types) / len(valid_audience_types), 1)
            else:
                monthly_campus_audience[month][campus] = 0
        
        # 计算该月合计的人群类别 = 该月所有神殿人群类别的简单平均
        valid_campus_audiences = [v for v in monthly_campus_audience[month].values() if v > 0]
        if valid_campus_audiences:
            monthly_summary_audience[month] = round(sum(valid_campus_audiences) / len(valid_campus_audiences), 1)
        else:
            monthly_summary_audience[month] = 0
    
    # 计算全年合计的人群类别 = 所有月份合计人群类别的简单平均
    valid_monthly_audiences = [v for v in monthly_summary_audience.values() if v > 0]
    yearly_audience_avg = round(sum(valid_monthly_audiences) / len(valid_monthly_audiences), 1) if valid_monthly_audiences else 0

    # 第二遍：生成月度报告数据
    for period in periods:
        period_label = '全年度' if period == 'all-year' else f'{period}月'

        # 从 weekly_summary_records 获取该 period 的合并列数据
        if period != 'all-year':
            month_int = int(period)
            period_summary_records = [r for r in weekly_summary_records if r.month == month_int]
        else:
            period_summary_records = weekly_summary_records
        
        # 计算该 period 的合并列总数（从周汇总行获取）
        period_planned_edit = sum(r.planned_edit_demand or 0 for r in period_summary_records)
        period_completed_edit = sum(r.completed_edit_demand or 0 for r in period_summary_records)
        period_actual_shoot = sum(r.actual_shoot_videos or 0 for r in period_summary_records)
        
        # 收集该 period 的集团活动（从周汇总行获取，用换行符连接）
        period_group_activities = [r.group_activity for r in period_summary_records if r.group_activity]
        period_group_activity = '\n'.join(period_group_activities) if period_group_activities else ''
        
        # 获取该period的人群类别
        if period == 'all-year':
            period_audience_type_avg = yearly_audience_avg
        else:
            period_audience_type_avg = monthly_summary_audience.get(int(period), 0)

        # 1. 创建 Summary 行
        summary_row = MonthlyEditReportBase(
            key=f"{period}-合计",
            row_type='summary',
            period=period,
            period_label=period_label,
            campus='合计',
            audience_type_count=str(period_audience_type_avg) if period_audience_type_avg > 0 else '',
            planned_edit_demand=period_planned_edit,
            completed_edit_demand=period_completed_edit,
            actual_shoot_videos=period_actual_shoot,
            shoot_completion_progress=calc_rate(period_actual_shoot, period_planned_edit),
            group_activity=period_group_activity
        )
        result_list.append(summary_row)

        # 2. 创建 Campus 行
        for campus in sorted_campuses:
            c_planned_articles = 0
            c_actual_articles = 0
            c_monthly_plan = 0
            c_completed_early = 0
            c_actual_edit = 0
            c_audit_pass = 0

            if period != 'all-year':
                month_int = int(period)
                matches = [r for r in weekly_campus_records if r.month == month_int and r.campus == campus]
            else:
                matches = [r for r in weekly_campus_records if r.campus == campus]

            # 累加神殿级别数据
            for m in matches:
                c_planned_articles += m.planned_articles or 0
                c_actual_articles += m.actual_articles or 0

            # 计划字段取 MAX（因为每周可能重复填写同一个月度计划值）
            if period != 'all-year':
                c_monthly_plan = max([r.monthly_edit_plans or 0 for r in matches]) if matches else 0
            else:
                # All Year: Sum of Monthly Maxes
                months_data = {}
                for r in matches:
                    m_key = r.month
                    if m_key not in months_data:
                        months_data[m_key] = 0
                    if (r.monthly_edit_plans or 0) > months_data[m_key]:
                        months_data[m_key] = r.monthly_edit_plans
                c_monthly_plan = sum(months_data.values())

            # 累加字段
            c_completed_early = sum([r.completed_early_plans or 0 for r in matches])
            c_actual_edit = sum([r.actual_edited_videos or 0 for r in matches])
            c_audit_pass = sum([r.audit_pass_video_count or 0 for r in matches])
            
            # 获取神殿的人群类别
            if period == 'all-year':
                # 全年度：该神殿所有月份人群类别的简单平均
                valid_campus_monthly = [monthly_campus_audience[m].get(campus, 0) 
                                        for m in range(1, 13) if monthly_campus_audience[m].get(campus, 0) > 0]
                c_audience_type_avg = round(sum(valid_campus_monthly) / len(valid_campus_monthly), 1) if valid_campus_monthly else 0
            else:
                # 单月：从预计算的结果获取
                c_audience_type_avg = monthly_campus_audience.get(int(period), {}).get(campus, 0)
            
            # Create Campus Row
            campus_row = MonthlyEditReportBase(
                key=f"{period}-{campus}",
                row_type='data',
                period=period,
                period_label=period_label,
                campus=campus,
                audience_type_count=str(c_audience_type_avg) if c_audience_type_avg > 0 else '',
                planned_articles=c_planned_articles,
                actual_articles=c_actual_articles,
                planned_edit_demand=0,  # 拍摄类数据在 summary 行
                completed_edit_demand=0,
                actual_shoot_videos=0,
                shoot_completion_progress='#DIV/0!',
                monthly_edit_plans=c_monthly_plan,
                completed_early_plans=c_completed_early,
                actual_edited_videos=c_actual_edit,
                edit_progress_rate=calc_rate(c_actual_edit, c_monthly_plan),
                audit_pass_video_count=c_audit_pass,
                audit_pass_rate=calc_rate(c_audit_pass, c_actual_edit),
                group_activity=''
            )
            result_list.append(campus_row)

    # 更新 Summary 行的其他累加字段
    for period in periods:
        summary_code = f"{period}-合计"
        s_row = next((r for r in result_list if r.key == summary_code), None)
        c_rows = [r for r in result_list if r.period == period and r.row_type == 'data']
        
        if s_row and c_rows:
            s_row.planned_articles = sum((r.planned_articles or 0) for r in c_rows)
            s_row.actual_articles = sum((r.actual_articles or 0) for r in c_rows)
            s_row.monthly_edit_plans = sum((r.monthly_edit_plans or 0) for r in c_rows)
            s_row.completed_early_plans = sum((r.completed_early_plans or 0) for r in c_rows)
            s_row.actual_edited_videos = sum((r.actual_edited_videos or 0) for r in c_rows)
            s_row.audit_pass_video_count = sum((r.audit_pass_video_count or 0) for r in c_rows)
            
            # Recalc rates
            s_row.edit_progress_rate = calc_rate(s_row.actual_edited_videos or 0, s_row.monthly_edit_plans or 0)
            s_row.audit_pass_rate = calc_rate(s_row.audit_pass_video_count or 0, s_row.actual_edited_videos or 0)

    return result_list


def calc_rate(num: int, den: int) -> str:
    if not den:
        return '#DIV/0!'
    return f"{int((num / den) * 100)}%"


def save_monthly_edit_report_list(db: Session, year: int, data: List[MonthlyEditReportBase]):
    """保存数据"""
    # 1. 删除旧数据
    db.query(市场部剪辑月度汇报表).filter(
        市场部剪辑月度汇报表.year == year
    ).delete()
    
    # 2. 插入新数据
    for item in data:
        db_obj = 市场部剪辑月度汇报表(
            year=year,
            month=int(item.period) if item.period != 'all-year' else 0,
            row_type=item.row_type,
            period=item.period,
            period_label=item.period_label,
            campus=item.campus,
            audience_type_count=item.audience_type_count,
            planned_articles=item.planned_articles,
            actual_articles=item.actual_articles,
            planned_edit_demand=item.planned_edit_demand,
            completed_edit_demand=item.completed_edit_demand,
            actual_shoot_videos=item.actual_shoot_videos,
            shoot_completion_progress=item.shoot_completion_progress,
            monthly_edit_plans=item.monthly_edit_plans,
            completed_early_plans=item.completed_early_plans,
            actual_edited_videos=item.actual_edited_videos,
            edit_progress_rate=item.edit_progress_rate,
            audit_pass_video_count=item.audit_pass_video_count,
            audit_pass_rate=item.audit_pass_rate,
            group_activity=item.group_activity
        )
        db.add(db_obj)
    
    db.commit()
    return True
