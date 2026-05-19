"""
市场部培训周度表 Service
"""

from typing import Any, Dict, List, Optional, Tuple

from app.models.market.monthly_training import MarketMonthlyTraining
from app.models.market.summary_training import MarketSummaryTraining
from app.models.market.weekly_training import MarketWeeklyTraining
from sqlalchemy import func
from sqlalchemy.orm import Session

TrainingRow = dict[str, str | int]


def calculate_totals(rows: List[MarketWeeklyTraining]) -> dict:
    """计算合计行数据"""
    if not rows:
        return {
            'trainee_count': 0,
            'qualified_count': 0,
            'pass_rate': '#DIV/0!',
            'avg_score': '#DIV/0!',
        }

    total_trainee = sum(r.trainee_count or 0 for r in rows)
    total_qualified = sum(r.qualified_count or 0 for r in rows)
    
    # 计算考试合格率
    if total_trainee > 0:
        pass_rate = f"{(total_qualified / total_trainee * 100):.2f}%"
    else:
        pass_rate = '#DIV/0!'
    
    # 计算平均成绩（所有行平均成绩的平均值）
    scores = [r.avg_score for r in rows if r.avg_score and r.avg_score > 0]
    if scores:
        avg_score = f"{sum(scores) / len(scores):.2f}"
    else:
        avg_score = '#DIV/0!'

    return {
        'trainee_count': total_trainee,
        'qualified_count': total_qualified,
        'pass_rate': pass_rate,
        'avg_score': avg_score,
    }


def list_rows(db: Session, year_month: Optional[str] = None) -> Tuple[List[MarketWeeklyTraining], dict]:
    """
    获取培训周度表数据
    
    Args:
        db: 数据库会话
        year_month: 年月筛选，格式 YYYY-MM
        
    Returns:
        (数据行列表, 合计数据)
    """
    q = db.query(MarketWeeklyTraining)
    if year_month:
        q = q.filter(MarketWeeklyTraining.year_month == year_month)
    
    rows = q.order_by(MarketWeeklyTraining.row_index.asc()).all()
    totals = calculate_totals(rows)
    
    return rows, totals


def bulk_save(db: Session, year_month: str, rows: List[dict]) -> Tuple[List[MarketWeeklyTraining], dict]:
    """
    批量保存培训周度表数据（按年月覆盖/更新）
    
    Args:
        db: 数据库会话
        year_month: 年月，格式 YYYY-MM
        rows: 行数据列表
        
    Returns:
        (保存后的数据行列表, 合计数据)
    """
    # 获取该年月的现有数据
    existing = db.query(MarketWeeklyTraining).filter(
        MarketWeeklyTraining.year_month == year_month
    ).all()
    existing_by_id = {r.id: r for r in existing}

    seen_ids = set()
    saved: List[MarketWeeklyTraining] = []

    for idx, row in enumerate(rows):
        row_id = row.get('id')
        
        if row_id and row_id in existing_by_id:
            # 更新现有记录
            obj = existing_by_id[row_id]
            seen_ids.add(row_id)
        else:
            # 创建新记录
            obj = MarketWeeklyTraining(year_month=year_month)
            db.add(obj)

        # 更新字段
        obj.year_month = year_month
        obj.row_index = row.get('row_index', idx + 1) or (idx + 1)
        obj.position = row.get('position', '') or ''
        obj.training_time = row.get('training_time', '') or ''
        obj.training_project = row.get('training_project', '') or ''
        obj.main_content = row.get('main_content', '') or ''
        obj.training_method = row.get('training_method', '') or ''
        obj.organizer = row.get('organizer', '') or ''
        obj.trainee_count = int(row.get('trainee_count', 0) or 0)
        obj.qualified_count = int(row.get('qualified_count', 0) or 0)
        obj.avg_score = float(row.get('avg_score', 0) or 0)
        
        # 自动计算考试合格率
        if obj.trainee_count > 0:
            obj.pass_rate = round(obj.qualified_count / obj.trainee_count * 100, 2)
        else:
            obj.pass_rate = 0

        saved.append(obj)

    # 删除该年月中未包含在请求中的记录
    for obj in existing:
        if obj.id not in seen_ids:
            db.delete(obj)

    db.commit()

    # 刷新对象
    for obj in saved:
        db.refresh(obj)

    return list_rows(db, year_month)


def delete_row(db: Session, record_id: int) -> bool:
    """
    删除单条记录
    
    Args:
        db: 数据库会话
        record_id: 记录ID
        
    Returns:
        是否删除成功
    """
    obj = db.query(MarketWeeklyTraining).filter(
        MarketWeeklyTraining.id == record_id
    ).first()
    
    if not obj:
        return False
    
    db.delete(obj)
    db.commit()
    return True


# 培训项目映射（前端字段名 -> 数据库值）
PROJECT_MAPPING = {
    'values': '价值观',
    'campusSpecialty': '神殿专业知识培训',
    'jobKnowledge': '岗位知识培训',
    'professionalism': '职业素养',
}

# 岗位列表
POSITIONS = ['网推', '网聊', 'AI研发', '线上', '全部员工']

# 汇总表/月度表中展示的岗位（不包括全部员工，其数据已并入各岗位）
DISPLAY_POSITIONS = ['网推', '网聊', 'AI研发', '线上']


def _get_training_row_int(row: TrainingRow, key: str) -> int:
    value = row.get(key, 0)
    return value if isinstance(value, int) else 0


def get_monthly_summary(db: Session, year: str) -> List[Dict[str, Any]]:
    """
    从培训周度表汇总数据生成培训月度表
    
    岗位='\u5168\u90e8\u5458\u5de5'的记录会同时计入各个岗位的汇总中。
    """
    # 先获取该年份所有的备注数据
    remarks_data = get_monthly_remarks(db, year)
    remarks_map = {(r['position'], r['month']): r['remarks'] for r in remarks_data}
    
    result: list[TrainingRow] = []
    
    for pos_idx, position in enumerate(DISPLAY_POSITIONS):
        no = f"{pos_idx + 1:02d}"
        
        # 汇总行（该岗位全年汇总）
        summary_row: TrainingRow = {
            'id': f'{no}-{position}-summary',
            'time': '',
            'project': '汇总',
            'position': position,
        }
        
        for proj_key in PROJECT_MAPPING.keys():
            summary_row[f'{proj_key}_sessions'] = 0
            summary_row[f'{proj_key}_trainees'] = 0
            summary_row[f'{proj_key}_qualified'] = 0
            summary_row[f'{proj_key}_passRate'] = ''
        summary_row['remarks'] = remarks_map.get((position, 0), '')
        
        month_rows: list[TrainingRow] = []
        for month in range(1, 13):
            year_month = f"{year}-{month:02d}"
            
            month_row: TrainingRow = {
                'id': f'{no}-{position}-{month}',
                'time': f'{month}月份',
                'project': '',
                'position': '',
            }
            
            for proj_key, proj_name in PROJECT_MAPPING.items():
                # 查询该岗位 + 全部员工 的数据
                stats = db.query(
                    func.count(MarketWeeklyTraining.id).label('sessions'),
                    func.sum(MarketWeeklyTraining.trainee_count).label('trainees'),
                    func.sum(MarketWeeklyTraining.qualified_count).label('qualified'),
                ).filter(
                    MarketWeeklyTraining.year_month == year_month,
                    MarketWeeklyTraining.position.in_([position, '全部员工']),
                    MarketWeeklyTraining.training_project == proj_name,
                ).first()
                
                sessions = stats.sessions or 0
                trainees = stats.trainees or 0
                qualified = stats.qualified or 0
                
                if trainees > 0:
                    pass_rate = f"{(qualified / trainees * 100):.2f}%"
                else:
                    pass_rate = ''
                
                month_row[f'{proj_key}_sessions'] = str(sessions) if sessions > 0 else ''
                month_row[f'{proj_key}_trainees'] = str(trainees) if trainees > 0 else ''
                month_row[f'{proj_key}_qualified'] = str(qualified) if qualified > 0 else ''
                month_row[f'{proj_key}_passRate'] = pass_rate
                
                summary_row[f'{proj_key}_sessions'] = _get_training_row_int(summary_row, f'{proj_key}_sessions') + sessions
                summary_row[f'{proj_key}_trainees'] = _get_training_row_int(summary_row, f'{proj_key}_trainees') + trainees
                summary_row[f'{proj_key}_qualified'] = _get_training_row_int(summary_row, f'{proj_key}_qualified') + qualified
            
            month_row['remarks'] = remarks_map.get((position, month), '')
            month_rows.append(month_row)
        
        # 计算汇总行的合格率
        for proj_key in PROJECT_MAPPING.keys():
            trainees = _get_training_row_int(summary_row, f'{proj_key}_trainees')
            qualified = _get_training_row_int(summary_row, f'{proj_key}_qualified')
            summary_row[f'{proj_key}_passRate'] = f"{(qualified / trainees * 100):.2f}%" if trainees > 0 else ''
            sessions = _get_training_row_int(summary_row, f'{proj_key}_sessions')
            summary_row[f'{proj_key}_sessions'] = str(sessions) if sessions > 0 else ''
            summary_row[f'{proj_key}_trainees'] = str(trainees) if trainees > 0 else ''
            summary_row[f'{proj_key}_qualified'] = str(qualified) if qualified > 0 else ''
        
        result.append(summary_row)
        result.extend(month_rows)
    
    return result


# ============ 培训月度表备注相关函数 ============

def get_monthly_remarks(db: Session, year: str) -> List[Dict[str, Any]]:
    """
    获取指定年份的月度表备注数据
    
    Args:
        db: 数据库会话
        year: 年份，格式 YYYY
        
    Returns:
        备注数据列表
    """
    rows = db.query(MarketMonthlyTraining).filter(
        MarketMonthlyTraining.year == year
    ).all()
    
    return [
        {
            'id': r.id,
            'year': r.year,
            'month': r.month,
            'position': r.position,
            'remarks': r.remarks or '',
        }
        for r in rows
    ]


def save_monthly_remarks(db: Session, year: str, remarks_list: List[Dict[str, Any]]) -> int:
    """
    批量保存月度表备注
    
    Args:
        db: 数据库会话
        year: 年份，格式 YYYY
        remarks_list: 备注数据列表，每项包含 month, position, remarks
        
    Returns:
        保存的记录数
    """
    saved_count = 0
    
    for item in remarks_list:
        month = item.get('month', 0)
        position = item.get('position', '')
        remarks = item.get('remarks', '')
        
        if not position:
            continue
        
        # 查找现有记录
        existing = db.query(MarketMonthlyTraining).filter(
            MarketMonthlyTraining.year == year,
            MarketMonthlyTraining.month == month,
            MarketMonthlyTraining.position == position,
        ).first()
        
        if existing:
            # 更新现有记录
            existing.remarks = remarks
        else:
            # 创建新记录
            new_record = MarketMonthlyTraining(
                year=year,
                month=month,
                position=position,
                remarks=remarks,
            )
            db.add(new_record)
        
        saved_count += 1
    
    db.commit()
    return saved_count


# ============ 培训汇总表相关函数 ============

def get_summary_remarks(db: Session, year: str) -> Dict[str, str]:
    """
    获取指定年份的汇总表备注数据
    
    Args:
        db: 数据库会话
        year: 年份，格式 YYYY
        
    Returns:
        备注字典：position -> remarks
    """
    rows = db.query(MarketSummaryTraining).filter(
        MarketSummaryTraining.year == year
    ).all()
    
    return {r.position: r.remarks or '' for r in rows}


def save_summary_remarks(db: Session, year: str, remarks_list: List[Dict[str, Any]]) -> int:
    """
    批量保存汇总表备注
    
    Args:
        db: 数据库会话
        year: 年份，格式 YYYY
        remarks_list: 备注数据列表，每项包含 position, remarks
        
    Returns:
        保存的记录数
    """
    saved_count = 0
    
    for item in remarks_list:
        position = item.get('position', '')
        remarks = item.get('remarks', '')
        
        # position 可以为空字符串（表示合计行）
        
        # 查找现有记录
        existing = db.query(MarketSummaryTraining).filter(
            MarketSummaryTraining.year == year,
            MarketSummaryTraining.position == position,
        ).first()
        
        if existing:
            # 更新现有记录
            existing.remarks = remarks
        else:
            # 创建新记录
            new_record = MarketSummaryTraining(
                year=year,
                position=position,
                remarks=remarks,
            )
            db.add(new_record)
        
        saved_count += 1
    
    db.commit()
    return saved_count


def get_training_summary(db: Session, year: str) -> List[Dict[str, Any]]:
    """
    从培训周度表汇总数据生成培训汇总表
    
    岗位='\u5168\u90e8\u5458\u5de5'的记录会同时计入各个岗位（网推/网聊/AI研发/线上）的统计。
    合计行直接统计所有记录，每条只计一次。
    """
    remarks_map = get_summary_remarks(db, year)
    
    result = []
    
    # 按各岗位统计（包含全部员工数据）
    for idx, position in enumerate(DISPLAY_POSITIONS):
        stats = db.query(
            func.count(MarketWeeklyTraining.id).label('sessions'),
            func.sum(MarketWeeklyTraining.trainee_count).label('trainees'),
            func.sum(MarketWeeklyTraining.qualified_count).label('qualified'),
        ).filter(
            MarketWeeklyTraining.year_month.like(f"{year}-%"),
            MarketWeeklyTraining.position.in_([position, '全部员工']),
        ).first()
        
        sessions = stats.sessions or 0
        trainees = stats.trainees or 0
        qualified = stats.qualified or 0
        
        pass_rate = f"{(qualified / trainees * 100):.2f}%" if trainees > 0 else ''
        
        result.append({
            'id': idx + 1,
            'index': idx + 1,
            'position': position,
            'training_sessions': str(sessions) if sessions > 0 else '',
            'trainees_count': str(trainees) if trainees > 0 else '',
            'qualified_count': str(qualified) if qualified > 0 else '',
            'pass_rate': pass_rate,
            'remarks': remarks_map.get(position, ''),
        })
    
    # 合计行：直接统计所有记录（每条只计一次）
    total_stats = db.query(
        func.count(MarketWeeklyTraining.id).label('sessions'),
        func.sum(MarketWeeklyTraining.trainee_count).label('trainees'),
        func.sum(MarketWeeklyTraining.qualified_count).label('qualified'),
    ).filter(
        MarketWeeklyTraining.year_month.like(f"{year}-%"),
    ).first()
    
    total_sessions = total_stats.sessions or 0
    total_trainees = total_stats.trainees or 0
    total_qualified = total_stats.qualified or 0
    total_pass_rate = f"{(total_qualified / total_trainees * 100):.2f}%" if total_trainees > 0 else ''
    
    total_row = {
        'id': 'total',
        'index': '合计',
        'position': '',
        'training_sessions': str(total_sessions) if total_sessions > 0 else '',
        'trainees_count': str(total_trainees) if total_trainees > 0 else '',
        'qualified_count': str(total_qualified) if total_qualified > 0 else '',
        'pass_rate': total_pass_rate,
        'remarks': remarks_map.get('', ''),
    }
    
    return [total_row] + result
