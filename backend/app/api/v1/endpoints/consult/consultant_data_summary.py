"""
003神殿各咨询师数据汇总新版 API
按咨询师聚合统计数据，自动从咨询量录入系统获取

数据来源：
- 实际数据：consult.咨询量明细表_v2
- 计划数据：consult.咨询师月度计划数据

计算逻辑：
- 咨询量：统计记录数
- 上门量：是否上门=1的记录数
- 实际招生：是否报名=1的记录数
- 实际收入：报名记录的缴费金额总和
- 退费数：是否退费=1的记录数
- 各率计算：
  - 总转化率 = 实际招生 / 咨询量
  - 电转门率 = 上门量 / 咨询量
  - 当面转化率 = 实际招生 / 上门量
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import case, extract, func, or_
from sqlalchemy.orm import Session

from .....core.auth import get_current_active_user
from .....core.database import get_db
from .....models.consult.consultation_record import 咨询量明细表
from .....models.user import User

router = APIRouter()


# ==================== 数据模型定义 ====================

class ConsultantSourceStats(BaseModel):
    """咨询师单个来源统计"""
    收入数: float = 0
    招生总数: int = 0
    上门量: int = 0
    咨询量: int = 0


class ConsultantMonthData(BaseModel):
    """咨询师月度数据"""
    咨询师: str
    月份: int
    # 所有媒体来源汇总
    计划收入: float = 0
    实际收入: float = 0
    计划招生: int = 0
    实际招生: int = 0
    退费数: int = 0
    上门总量: int = 0
    咨询总量: int = 0
    # 分来源统计
    SEM: ConsultantSourceStats = ConsultantSourceStats()
    新媒体: ConsultantSourceStats = ConsultantSourceStats()
    市场口碑: ConsultantSourceStats = ConsultantSourceStats()
    合作伙伴: ConsultantSourceStats = ConsultantSourceStats()
    口碑: ConsultantSourceStats = ConsultantSourceStats()
    渠道: ConsultantSourceStats = ConsultantSourceStats()
    # 转化率
    总转化率: Optional[float] = None
    电转门率: Optional[float] = None
    当面转化率: Optional[float] = None


class ConsultantYearlyResponse(BaseModel):
    """咨询师年度统计响应"""
    神殿: str
    年份: int
    咨询师列表: List[str]
    数据列表: List[ConsultantMonthData]


class MonthlyConsultantSummary(BaseModel):
    """月度咨询师汇总"""
    月份: int
    咨询师数据: List[ConsultantMonthData]
    月度合计: ConsultantMonthData


class CampusMonthlyResponse(BaseModel):
    """神殿月度响应"""
    神殿: str
    年份: int
    月度汇总列表: List[MonthlyConsultantSummary]


# ==================== API 端点 ====================

@router.get("/by-consultant", response_model=ConsultantYearlyResponse)
async def get_consultant_data_summary(
    year: int = Query(..., description="年份"),
    campus: str = Query(..., description="神殿名称"),
    month: Optional[int] = Query(None, ge=1, le=12, description="月份（可选，不传则返回全年）"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    获取神殿各咨询师数据汇总
    
    - 按咨询师聚合统计各月数据
    - 分来源统计（SEM、新媒体、市场口碑、合作伙伴、口碑、渠道）
    - 自动计算各类转化率
    """
    # 基础查询条件
    base_conditions = [
        extract('year', 咨询量明细表.登记日期) == year,
        咨询量明细表.神殿 == campus,
        咨询量明细表.是否无效量 == 0,  # 排除无效量
    ]
    
    if month:
        base_conditions.append(extract('month', 咨询量明细表.登记日期) == month)
    
    # 查询所有咨询师
    consultants_query = db.query(
        咨询量明细表.咨询师
    ).filter(*base_conditions).distinct()
    
    consultant_list = [r[0] for r in consultants_query.all() if r[0]]
    
    # 聚合查询
    # 网络来源映射到分类
    source_mapping = {
        'SEM': ['百度推广', '百教网', '知了好学', '坦途网'],
        '新媒体': ['抖音', '快手', '微信视频号', 'B站', '小红书', '腾讯视频号', '视频号'],
        '市场口碑': ['市场口碑'],
        '合作伙伴': ['合作伙伴'],
        '免费推广': ['免费推广', 'TQ', '表单', '中心来电'],
    }
    
    # 主聚合查询
    query = db.query(
        咨询量明细表.咨询师,
        extract('month', 咨询量明细表.登记日期).label('月份'),
        咨询量明细表.量来源,
        咨询量明细表.媒体来源,
        func.count(咨询量明细表.记录ID).label('咨询量'),
        func.sum(case((咨询量明细表.是否上门 == 1, 1), else_=0)).label('上门量'),
        func.sum(case((咨询量明细表.是否报名 == 1, 1), else_=0)).label('实际招生'),
        func.sum(case((咨询量明细表.是否报名 == 1, 咨询量明细表.缴费金额), else_=0)).label('实际收入'),
        func.sum(case((咨询量明细表.是否退费 == 1, 1), else_=0)).label('退费数'),
    ).filter(*base_conditions).group_by(
        咨询量明细表.咨询师,
        extract('month', 咨询量明细表.登记日期),
        咨询量明细表.量来源,
        咨询量明细表.媒体来源,
    )
    
    results = query.all()
    
    # 整理数据
    data_dict = {}  # key: (咨询师, 月份)
    
    for row in results:
        consultant = row.咨询师 or '未分配'
        month_num = int(row.月份)
        source = row.量来源 or ''
        media = row.媒体来源 or ''
        
        key = (consultant, month_num)
        if key not in data_dict:
            data_dict[key] = ConsultantMonthData(
                咨询师=consultant,
                月份=month_num
            )
        
        stats = ConsultantSourceStats(
            收入数=float(row.实际收入 or 0),
            招生总数=int(row.实际招生 or 0),
            上门量=int(row.上门量 or 0),
            咨询量=int(row.咨询量 or 0),
        )
        
        item = data_dict[key]
        
        # 汇总到总量
        item.咨询总量 += stats.咨询量
        item.上门总量 += stats.上门量
        item.实际招生 += stats.招生总数
        item.实际收入 += stats.收入数
        item.退费数 += int(row.退费数 or 0)
        
        # 分类统计
        if source == '网络':
            # 根据媒体来源分类
            matched = False
            for category, keywords in source_mapping.items():
                if any(kw in media for kw in keywords):
                    target = getattr(item, category.replace('免费推广', 'SEM'))  # 免费推广归入SEM
                    target.收入数 += stats.收入数
                    target.招生总数 += stats.招生总数
                    target.上门量 += stats.上门量
                    target.咨询量 += stats.咨询量
                    matched = True
                    break
            if not matched:
                # 默认归入新媒体
                item.新媒体.收入数 += stats.收入数
                item.新媒体.招生总数 += stats.招生总数
                item.新媒体.上门量 += stats.上门量
                item.新媒体.咨询量 += stats.咨询量
        elif source == '口碑':
            item.口碑.收入数 += stats.收入数
            item.口碑.招生总数 += stats.招生总数
            item.口碑.上门量 += stats.上门量
            item.口碑.咨询量 += stats.咨询量
        elif source == '渠道':
            item.渠道.收入数 += stats.收入数
            item.渠道.招生总数 += stats.招生总数
            item.渠道.上门量 += stats.上门量
            item.渠道.咨询量 += stats.咨询量
    
    # 计算转化率
    for item in data_dict.values():
        if item.咨询总量 > 0:
            item.总转化率 = round(item.实际招生 / item.咨询总量 * 100, 2)
            item.电转门率 = round(item.上门总量 / item.咨询总量 * 100, 2)
        if item.上门总量 > 0:
            item.当面转化率 = round(item.实际招生 / item.上门总量 * 100, 2)
    
    return ConsultantYearlyResponse(
        神殿=campus,
        年份=year,
        咨询师列表=consultant_list,
        数据列表=list(data_dict.values())
    )


@router.get("/monthly-summary", response_model=CampusMonthlyResponse)
async def get_monthly_consultant_summary(
    year: int = Query(..., description="年份"),
    campus: str = Query(..., description="神殿名称"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    获取神殿月度咨询师汇总
    
    - 按月份分组
    - 每月包含各咨询师数据和月度合计
    """
    # 获取全年数据
    yearly_data = await get_consultant_data_summary(
        year=year, 
        campus=campus, 
        month=None,
        db=db, 
        current_user=current_user
    )
    
    # 按月份分组
    monthly_dict: dict[int, list[ConsultantMonthData]] = {}
    for item in yearly_data.数据列表:
        if item.月份 not in monthly_dict:
            monthly_dict[item.月份] = []
        monthly_dict[item.月份].append(item)
    
    # 生成月度汇总
    result = []
    for month_num in sorted(monthly_dict.keys()):
        consultant_data = monthly_dict[month_num]
        
        # 计算月度合计
        total = ConsultantMonthData(
            咨询师='合计',
            月份=month_num
        )
        for item in consultant_data:
            total.计划收入 += item.计划收入
            total.实际收入 += item.实际收入
            total.计划招生 += item.计划招生
            total.实际招生 += item.实际招生
            total.退费数 += item.退费数
            total.上门总量 += item.上门总量
            total.咨询总量 += item.咨询总量
            
            # 分来源汇总
            for source in ['SEM', '新媒体', '市场口碑', '合作伙伴', '口碑', '渠道']:
                src_item = getattr(item, source)
                src_total = getattr(total, source)
                src_total.收入数 += src_item.收入数
                src_total.招生总数 += src_item.招生总数
                src_total.上门量 += src_item.上门量
                src_total.咨询量 += src_item.咨询量
        
        # 计算合计转化率
        if total.咨询总量 > 0:
            total.总转化率 = round(total.实际招生 / total.咨询总量 * 100, 2)
            total.电转门率 = round(total.上门总量 / total.咨询总量 * 100, 2)
        if total.上门总量 > 0:
            total.当面转化率 = round(total.实际招生 / total.上门总量 * 100, 2)
        
        result.append(MonthlyConsultantSummary(
            月份=month_num,
            咨询师数据=consultant_data,
            月度合计=total
        ))
    
    return CampusMonthlyResponse(
        神殿=campus,
        年份=year,
        月度汇总列表=result
    )


@router.get("/consultant-list")
async def get_consultant_list(
    campus: str = Query(..., description="神殿名称"),
    year: Optional[int] = Query(None, description="年份（可选）"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    获取神殿咨询师列表
    
    - 从 public.users 表获取祈福司员工（排除分析规划师助理）
    """
    from app.models.user import UserStatus
    
    # 标准化神殿名称用于模糊匹配
    campus_base = campus.replace("神殿", "").strip()
    for province in ["河北", "山西", "广西", "贵州", "山东", "河南", "湖北"]:
        campus_base = campus_base.replace(province, "")
    campus_base = campus_base.strip()
    
    query = db.query(User.real_name).filter(
        User.status == UserStatus.ACTIVE,
        User.department == "祈福司",
        or_(User.position.is_(None), User.position != '分析规划师助理'),
        User.campus.like(f"%{campus_base}%"),
        User.real_name.isnot(None),
        User.real_name != '',
    ).distinct()
    
    consultant_list = [r[0] for r in query.all()]
    
    return {
        "神殿": campus,
        "咨询师列表": sorted(consultant_list)
    }
