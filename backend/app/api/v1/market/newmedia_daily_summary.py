from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal
from typing import Protocol, cast

from app.core.database import get_db
from app.models.market.bilibili_daily_data import 市场部B站日度数据表
from app.models.market.douyin_daily_data import 市场部抖音日度数据表
from app.models.market.kuaishou_daily_data import 市场部快手日度数据表
from app.models.market.wechat_video_daily_data import 市场部微信视频号日度数据表
from app.models.market.xiaohongshu_daily_data import 市场部小红书日度数据表
from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

router = APIRouter()


# 神殿映射：统一神殿名称
CAMPUS_MAPPING = {
    '河北主神殿': '盛邦',
    '河北永恒殿': '冀美',
    '河北慈悲殿': '石美',
    '山西李大殿': '晋美',
    '山西智慧阁': '原美',
    '山西光明殿': '太美',
    '广西神恩殿': '桂美',
    '贵州天威殿': '黔美',
    '广西邕美神殿': '邕美',
}

NumericValue = Decimal | float | int | None


class SummaryMetricsRow(Protocol):
    consumption: NumericValue
    consult_count: NumericValue
    visit_count: NumericValue
    net_signup: NumericValue
    actual_income: NumericValue


class CampusSummaryMetricsRow(SummaryMetricsRow, Protocol):
    神殿: str


class DouyinSummaryRow(SummaryMetricsRow, Protocol):
    display_count: NumericValue
    click_count: NumericValue


class CampusDouyinSummaryRow(CampusSummaryMetricsRow, DouyinSummaryRow, Protocol):
    pass


class KuaishouSummaryRow(SummaryMetricsRow, Protocol):
    material_display_count: NumericValue
    action_count: NumericValue
    seal_cover_count: NumericValue
    seal_click_count: NumericValue


class CampusKuaishouSummaryRow(CampusSummaryMetricsRow, KuaishouSummaryRow, Protocol):
    pass


class AvgCostRow(Protocol):
    avg_cost: NumericValue


class MonthlySummaryRow(Protocol):
    month: NumericValue
    income: NumericValue
    refund: NumericValue
    gross: NumericValue
    net: NumericValue
    order_count: NumericValue
    visit: NumericValue
    consult: NumericValue
    cost: NumericValue


def _to_int(value: NumericValue) -> int:
    if value is None:
        return 0
    return int(value)


def _to_float(value: NumericValue) -> float:
    if value is None:
        return 0.0
    return float(value)


@dataclass
class BaseCampusSummary:
    campus: str
    actual_consumption: float = 0.0
    actual_consult_count: int = 0
    visit_count: int = 0
    actual_registration: int = 0
    actual_income: float = 0.0

    def add_metrics(self, row: SummaryMetricsRow) -> None:
        self.actual_consumption += _to_float(row.consumption)
        self.actual_consult_count += _to_int(row.consult_count)
        self.visit_count += _to_int(row.visit_count)
        self.actual_registration += _to_int(row.net_signup)
        self.actual_income += _to_float(row.actual_income)

    def add_summary(self, other: "BaseCampusSummary") -> None:
        self.actual_consumption += other.actual_consumption
        self.actual_consult_count += other.actual_consult_count
        self.visit_count += other.visit_count
        self.actual_registration += other.actual_registration
        self.actual_income += other.actual_income

    def to_payload(self) -> dict[str, object]:
        return {
            'campus': self.campus,
            'actual_consumption': self.actual_consumption,
            'actual_consult_count': self.actual_consult_count,
            'visit_count': self.visit_count,
            'actual_registration': self.actual_registration,
            'actual_income': self.actual_income,
        }


@dataclass
class DouyinCampusSummary(BaseCampusSummary):
    display_count: int = 0
    click_count: int = 0
    avg_thousand_display_cost: float = 0.0

    def add_platform_metrics(self, row: DouyinSummaryRow) -> None:
        self.add_metrics(row)
        self.display_count += _to_int(row.display_count)
        self.click_count += _to_int(row.click_count)

    def add_summary(self, other: BaseCampusSummary) -> None:
        super().add_summary(other)
        if isinstance(other, DouyinCampusSummary):
            self.display_count += other.display_count
            self.click_count += other.click_count

    def to_payload(self) -> dict[str, object]:
        payload = super().to_payload()
        payload.update(
            {
                'display_count': self.display_count,
                'click_count': self.click_count,
                'avg_thousand_display_cost': self.avg_thousand_display_cost,
            }
        )
        return payload


@dataclass
class KuaishouCampusSummary(BaseCampusSummary):
    material_display_count: int = 0
    action_count: int = 0
    seal_cover_count: int = 0
    seal_click_count: int = 0

    def add_platform_metrics(self, row: KuaishouSummaryRow) -> None:
        self.add_metrics(row)
        self.material_display_count += _to_int(row.material_display_count)
        self.action_count += _to_int(row.action_count)
        self.seal_cover_count += _to_int(row.seal_cover_count)
        self.seal_click_count += _to_int(row.seal_click_count)

    def add_summary(self, other: BaseCampusSummary) -> None:
        super().add_summary(other)
        if isinstance(other, KuaishouCampusSummary):
            self.material_display_count += other.material_display_count
            self.action_count += other.action_count
            self.seal_cover_count += other.seal_cover_count
            self.seal_click_count += other.seal_click_count

    def to_payload(self) -> dict[str, object]:
        payload = super().to_payload()
        payload.update(
            {
                'material_display_count': self.material_display_count,
                'action_count': self.action_count,
                'seal_cover_count': self.seal_cover_count,
                'seal_click_count': self.seal_click_count,
            }
        )
        return payload


@dataclass
class MonthlySummary:
    month: int
    actual_income: float = 0.0
    refund_count: int = 0
    gross_enrollment: int = 0
    net_enrollment: int = 0
    order_count: int = 0
    visit_count: int = 0
    actual_consult_volume: int = 0
    actual_cost: float = 0.0

    def add_row(self, row: MonthlySummaryRow) -> None:
        self.actual_income += _to_float(row.income)
        self.refund_count += _to_int(row.refund)
        self.gross_enrollment += _to_int(row.gross)
        self.net_enrollment += _to_int(row.net)
        self.order_count += _to_int(row.order_count)
        self.visit_count += _to_int(row.visit)
        self.actual_consult_volume += _to_int(row.consult)
        self.actual_cost += _to_float(row.cost)

    def to_payload(self) -> dict[str, object]:
        return {
            'month': self.month,
            'actual_income': self.actual_income,
            'refund_count': self.refund_count,
            'gross_enrollment': self.gross_enrollment,
            'net_enrollment': self.net_enrollment,
            'order_count': self.order_count,
            'visit_count': self.visit_count,
            'actual_consult_volume': self.actual_consult_volume,
            'actual_cost': self.actual_cost,
        }


def _monthly_platform_payload(
    month: int,
    platform: str,
    row: MonthlySummaryRow | None,
) -> dict[str, object]:
    if row is None:
        return {
            'month': month,
            'platform': platform,
            'actual_income': 0.0,
            'refund_count': 0,
            'gross_enrollment': 0,
            'net_enrollment': 0,
            'order_count': 0,
            'visit_count': 0,
            'actual_consult_volume': 0,
            'actual_cost': 0.0,
        }

    return {
        'month': month,
        'platform': platform,
        'actual_income': _to_float(row.income),
        'refund_count': _to_int(row.refund),
        'gross_enrollment': _to_int(row.gross),
        'net_enrollment': _to_int(row.net),
        'order_count': _to_int(row.order_count),
        'visit_count': _to_int(row.visit),
        'actual_consult_volume': _to_int(row.consult),
        'actual_cost': _to_float(row.cost),
    }


def normalize_campus_name(campus: str) -> str:
    """标准化神殿名称"""
    return CAMPUS_MAPPING.get(campus, campus)


@router.get(
    '/douyin-platform-summary',
    summary='获取抖音平台数据汇总（按日期范围和神殿）',
)
def get_douyin_platform_summary(
    start_date: str = Query(..., description='开始日期，格式 YYYY-MM-DD'),
    end_date: str = Query(..., description='结束日期，格式 YYYY-MM-DD'),
    db: Session = Depends(get_db),
):
    """
    汇总抖音平台的日度数据
    按神殿分组，返回指定日期范围内的汇总数据
    
    返回字段：
    - campus: 神殿名称
    - actual_consumption: 实际消费（抖音花费）
    - actual_consult_count: 实际咨询量（抖音咨询量）
    - visit_count: 上门人数
    - actual_registration: 实际报名（净报名）
    - actual_income: 实际收入（抖音实际收入）
    - display_count: 展示次数
    - click_count: 点击次数
抖音平台数据分析    - avg_thousand_display_cost: 平均千次展示费用（取最新记录的值）
    """
    try:
        # 解析日期
        start = datetime.strptime(start_date, '%Y-%m-%d').date()
        end = datetime.strptime(end_date, '%Y-%m-%d').date()
        
        # 存储各神殿的汇总数据
        campus_summary: dict[str, DouyinCampusSummary] = {}
        
        # 获取所有神殿列表
        campus_list = cast(list[tuple[str]], db.query(市场部抖音日度数据表.神殿).filter(
            市场部抖音日度数据表.日期 >= start,
            市场部抖音日度数据表.日期 <= end,
        ).distinct().all())
        
        for (campus_name,) in campus_list:
            # 汇总该神殿的数据
            summary = cast(DouyinSummaryRow | None, db.query(
                func.sum(市场部抖音日度数据表.抖音花费).label('consumption'),
                func.sum(市场部抖音日度数据表.抖音咨询量).label('consult_count'),
                func.sum(市场部抖音日度数据表.上门人数).label('visit_count'),
                func.sum(市场部抖音日度数据表.净报名).label('net_signup'),
                func.sum(市场部抖音日度数据表.抖音实际收入).label('actual_income'),
                func.sum(市场部抖音日度数据表.展示次数).label('display_count'),
                func.sum(市场部抖音日度数据表.点击次数).label('click_count'),
            ).filter(
                市场部抖音日度数据表.神殿 == campus_name,
                市场部抖音日度数据表.日期 >= start,
                市场部抖音日度数据表.日期 <= end,
            ).first())
            
            # 单独计算平均千次展示费用（只计算有效记录，排除0值）
            avg_cost_result = cast(AvgCostRow | None, db.query(
                func.avg(市场部抖音日度数据表.平均千次展示费用).label('avg_cost'),
            ).filter(
                市场部抖音日度数据表.神殿 == campus_name,
                市场部抖音日度数据表.日期 >= start,
                市场部抖音日度数据表.日期 <= end,
                市场部抖音日度数据表.平均千次展示费用 > 0,  # 只计算有效记录
            ).first())
            
            # 获取平均千次展示费用的平均值
            avg_cost = _to_float(avg_cost_result.avg_cost) if avg_cost_result else 0.0
            if summary is None:
                continue
            
            campus = normalize_campus_name(campus_name)
            campus_item = DouyinCampusSummary(campus=campus)
            campus_item.add_platform_metrics(summary)
            campus_item.avg_thousand_display_cost = avg_cost
            campus_summary[campus] = campus_item
        
        # 计算总计
        total_summary = DouyinCampusSummary(campus='合计')
        
        # 用于计算各神殿千次展示费用的简单平均
        campus_cost_sum = 0.0
        campus_cost_count = 0
        
        for campus_data in campus_summary.values():
            total_summary.add_summary(campus_data)
            
            # 计算简单平均：所有神殿的千次展示费用相加后除以神殿数
            if campus_data.avg_thousand_display_cost > 0:
                campus_cost_sum += campus_data.avg_thousand_display_cost
                campus_cost_count += 1
        
        # 计算总计的平均千次展示费用（简单平均）
        if campus_cost_count > 0:
            total_summary.avg_thousand_display_cost = campus_cost_sum / campus_cost_count
        
        # 返回结果：总计 + 各神殿数据
        result = [total_summary.to_payload()] + [item.to_payload() for item in campus_summary.values()]
        
        return {
            'success': True,
            'data': result,
            'start_date': start_date,
            'end_date': end_date,
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'data': [],
        }


@router.get(
    '/kuaishou-platform-summary',
    summary='获取快手平台数据汇总（按日期范围和神殿）',
)
def get_kuaishou_platform_summary(
    start_date: str = Query(..., description='开始日期，格式 YYYY-MM-DD'),
    end_date: str = Query(..., description='结束日期，格式 YYYY-MM-DD'),
    db: Session = Depends(get_db),
):
    """
    汇总快手平台的日度数据
    按神殿分组，返回指定日期范围内的汇总数据
    
    返回字段：
    - campus: 神殿名称
    - actual_consumption: 实际消费（快手花费）
    - actual_consult_count: 实际咨询量（快手咨询量）
    - visit_count: 上门人数
    - actual_registration: 实际报名（净报名）
    - actual_income: 实际收入（快手实际收入）
    - material_display_count: 素材曝光数
    - action_count: 行为数（行为点击数）
    - seal_cover_count: 封面曝光数
    - seal_click_count: 封面点击数
    """
    try:
        # 解析日期
        start = datetime.strptime(start_date, '%Y-%m-%d').date()
        end = datetime.strptime(end_date, '%Y-%m-%d').date()
        
        # 存储各神殿的汇总数据
        campus_summary: dict[str, KuaishouCampusSummary] = {}
        
        # 获取所有神殿列表
        campus_list = cast(list[tuple[str]], db.query(市场部快手日度数据表.神殿).filter(
            市场部快手日度数据表.日期 >= start,
            市场部快手日度数据表.日期 <= end,
        ).distinct().all())
        
        for (campus_name,) in campus_list:
            # 汇总该神殿的数据
            summary = cast(KuaishouSummaryRow | None, db.query(
                func.sum(市场部快手日度数据表.快手花费).label('consumption'),
                func.sum(市场部快手日度数据表.快手咨询量).label('consult_count'),
                func.sum(市场部快手日度数据表.上门人数).label('visit_count'),
                func.sum(市场部快手日度数据表.净报名).label('net_signup'),
                func.sum(市场部快手日度数据表.快手实际收入).label('actual_income'),
                func.sum(市场部快手日度数据表.素材曝光数).label('material_display_count'),
                func.sum(市场部快手日度数据表.行为数).label('action_count'),
                func.sum(市场部快手日度数据表.封面曝光数).label('seal_cover_count'),
                func.sum(市场部快手日度数据表.封面点击数).label('seal_click_count'),
            ).filter(
                市场部快手日度数据表.神殿 == campus_name,
                市场部快手日度数据表.日期 >= start,
                市场部快手日度数据表.日期 <= end,
            ).first())
            if summary is None:
                continue
            
            campus = normalize_campus_name(campus_name)
            campus_item = KuaishouCampusSummary(campus=campus)
            campus_item.add_platform_metrics(summary)
            campus_summary[campus] = campus_item
        
        # 计算总计
        total_summary = KuaishouCampusSummary(campus='合计')
        
        for campus_data in campus_summary.values():
            total_summary.add_summary(campus_data)
        
        # 返回结果：总计 + 各神殿数据
        result = [total_summary.to_payload()] + [item.to_payload() for item in campus_summary.values()]
        
        return {
            'success': True,
            'data': result,
            'start_date': start_date,
            'end_date': end_date,
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'data': [],
        }


@router.get(
    '/newmedia-daily-summary',
    summary='获取新媒体日度数据汇总（按日期范围和神殿）',
)
def get_newmedia_daily_summary(
    start_date: str = Query(..., description='开始日期，格式 YYYY-MM-DD'),
    end_date: str = Query(..., description='结束日期，格式 YYYY-MM-DD'),
    db: Session = Depends(get_db),
):
    """
    汇总所有新媒体平台（抖音、快手、小红书、视频号、B站）的日度数据
    按神殿分组，返回指定日期范围内的汇总数据
    
    返回字段：
    - campus: 神殿名称
    - actual_consumption: 实际消费（所有平台花费总和）
    - actual_consult_count: 实际咨询量（所有平台咨询量总和）
    - visit_count: 上门人数（所有平台上门人数总和）
    - actual_registration: 实际报名（所有平台净报名总和）
    - actual_income: 实际收入（所有平台实际收入总和）
    """
    try:
        # 解析日期
        start = datetime.strptime(start_date, '%Y-%m-%d').date()
        end = datetime.strptime(end_date, '%Y-%m-%d').date()
        
        # 存储各神殿的汇总数据
        campus_summary: dict[str, BaseCampusSummary] = {}
        
        # 1. 汇总抖音数据
        douyin_data = cast(list[CampusSummaryMetricsRow], db.query(
            市场部抖音日度数据表.神殿,
            func.sum(市场部抖音日度数据表.抖音花费).label('consumption'),
            func.sum(市场部抖音日度数据表.抖音咨询量).label('consult_count'),
            func.sum(市场部抖音日度数据表.上门人数).label('visit_count'),
            func.sum(市场部抖音日度数据表.净报名).label('net_signup'),
            func.sum(市场部抖音日度数据表.抖音实际收入).label('actual_income'),
        ).filter(
            市场部抖音日度数据表.日期 >= start,
            市场部抖音日度数据表.日期 <= end,
        ).group_by(市场部抖音日度数据表.神殿).all())
        
        for row in douyin_data:
            campus = normalize_campus_name(row.神殿)
            campus_summary.setdefault(campus, BaseCampusSummary(campus=campus)).add_metrics(row)
        
        # 2. 汇总快手数据
        kuaishou_data = cast(list[CampusSummaryMetricsRow], db.query(
            市场部快手日度数据表.神殿,
            func.sum(市场部快手日度数据表.快手花费).label('consumption'),
            func.sum(市场部快手日度数据表.快手咨询量).label('consult_count'),
            func.sum(市场部快手日度数据表.上门人数).label('visit_count'),
            func.sum(市场部快手日度数据表.净报名).label('net_signup'),
            func.sum(市场部快手日度数据表.快手实际收入).label('actual_income'),
        ).filter(
            市场部快手日度数据表.日期 >= start,
            市场部快手日度数据表.日期 <= end,
        ).group_by(市场部快手日度数据表.神殿).all())
        
        for row in kuaishou_data:
            campus = normalize_campus_name(row.神殿)
            campus_summary.setdefault(campus, BaseCampusSummary(campus=campus)).add_metrics(row)
        
        # 3. 汇总小红书数据
        xiaohongshu_data = cast(list[CampusSummaryMetricsRow], db.query(
            市场部小红书日度数据表.神殿,
            func.sum(市场部小红书日度数据表.小红书消费).label('consumption'),
            func.sum(市场部小红书日度数据表.小红书总量).label('consult_count'),
            func.sum(市场部小红书日度数据表.上门人数).label('visit_count'),
            func.sum(市场部小红书日度数据表.净报名).label('net_signup'),
            func.sum(市场部小红书日度数据表.小红书实际收入).label('actual_income'),
        ).filter(
            市场部小红书日度数据表.日期 >= start,
            市场部小红书日度数据表.日期 <= end,
        ).group_by(市场部小红书日度数据表.神殿).all())
        
        for row in xiaohongshu_data:
            campus = normalize_campus_name(row.神殿)
            campus_summary.setdefault(campus, BaseCampusSummary(campus=campus)).add_metrics(row)
        
        # 4. 汇总视频号数据
        wechat_data = cast(list[CampusSummaryMetricsRow], db.query(
            市场部微信视频号日度数据表.神殿,
            func.sum(市场部微信视频号日度数据表.微信视频号消费).label('consumption'),
            func.sum(市场部微信视频号日度数据表.微信视频号总量).label('consult_count'),
            func.sum(市场部微信视频号日度数据表.上门人数).label('visit_count'),
            func.sum(市场部微信视频号日度数据表.净报名).label('net_signup'),
            func.sum(市场部微信视频号日度数据表.微信视频号实际收入).label('actual_income'),
        ).filter(
            市场部微信视频号日度数据表.日期 >= start,
            市场部微信视频号日度数据表.日期 <= end,
        ).group_by(市场部微信视频号日度数据表.神殿).all())
        
        for row in wechat_data:
            campus = normalize_campus_name(row.神殿)
            campus_summary.setdefault(campus, BaseCampusSummary(campus=campus)).add_metrics(row)
        
        # 5. 汇总B站数据
        bilibili_data = cast(list[CampusSummaryMetricsRow], db.query(
            市场部B站日度数据表.神殿,
            func.sum(市场部B站日度数据表.B站花费).label('consumption'),
            func.sum(市场部B站日度数据表.B站咨询量).label('consult_count'),
            func.sum(市场部B站日度数据表.上门人数).label('visit_count'),
            func.sum(市场部B站日度数据表.净报名).label('net_signup'),
            func.sum(市场部B站日度数据表.B站实际收入).label('actual_income'),
        ).filter(
            市场部B站日度数据表.日期 >= start,
            市场部B站日度数据表.日期 <= end,
        ).group_by(市场部B站日度数据表.神殿).all())
        
        for row in bilibili_data:
            campus = normalize_campus_name(row.神殿)
            campus_summary.setdefault(campus, BaseCampusSummary(campus=campus)).add_metrics(row)
        
        # 计算总计
        total_summary = BaseCampusSummary(campus='合计')
        
        for campus_data in campus_summary.values():
            total_summary.add_summary(campus_data)
        
        # 返回结果：总计 + 各神殿数据
        result = [total_summary.to_payload()] + [item.to_payload() for item in campus_summary.values()]
        
        return {
            'success': True,
            'data': result,
            'start_date': start_date,
            'end_date': end_date,
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'data': [],
        }


@router.get(
    '/newmedia-monthly-summary',
    summary='获取新媒体月度汇总数据（按月份汇总，用于01看板）',
)
def get_newmedia_monthly_summary(
    year: str = Query(..., description='年份，格式 YYYY'),
    campus: str = Query(..., description='神殿名称'),
    db: Session = Depends(get_db),
):
    """
    汇总指定神殿、指定年份各月份的新媒体数据
    用于01市场部新媒体核心数据综合数据看板
    
    返回字段（按月份汇总所有平台）：
    - month: 月份（1-12）
    - actual_income: 实际收入
    - refund_count: 退费数
    - gross_enrollment: 毛报总数
    - net_enrollment: 净报名
    - order_count: 订座数
    - visit_count: 上门人数
    - actual_consult_volume: 实际咨询量
    - actual_cost: 实际消费
    """
    try:
        year_int = int(year)
        
        # 月度汇总数据
        monthly_data: dict[int, MonthlySummary] = {m: MonthlySummary(month=m) for m in range(1, 13)}
        
        # 1. 汇总抖音数据
        douyin_data = cast(list[MonthlySummaryRow], db.query(
            func.extract('month', 市场部抖音日度数据表.日期).label('month'),
            func.sum(市场部抖音日度数据表.抖音实际收入).label('income'),
            func.sum(市场部抖音日度数据表.退费数).label('refund'),
            func.sum(市场部抖音日度数据表.毛报总数).label('gross'),
            func.sum(市场部抖音日度数据表.净报名).label('net'),
            func.sum(市场部抖音日度数据表.订座数).label('order_count'),
            func.sum(市场部抖音日度数据表.上门人数).label('visit'),
            func.sum(市场部抖音日度数据表.抖音咨询量).label('consult'),
            func.sum(市场部抖音日度数据表.抖音花费).label('cost'),
        ).filter(
            市场部抖音日度数据表.神殿 == campus,
            func.extract('year', 市场部抖音日度数据表.日期) == year_int,
        ).group_by(func.extract('month', 市场部抖音日度数据表.日期)).all())
        
        for row in douyin_data:
            m = _to_int(row.month)
            if m in monthly_data:
                monthly_data[m].add_row(row)
        
        # 2. 汇总快手数据
        kuaishou_data = cast(list[MonthlySummaryRow], db.query(
            func.extract('month', 市场部快手日度数据表.日期).label('month'),
            func.sum(市场部快手日度数据表.快手实际收入).label('income'),
            func.sum(市场部快手日度数据表.退费数).label('refund'),
            func.sum(市场部快手日度数据表.毛报总数).label('gross'),
            func.sum(市场部快手日度数据表.净报名).label('net'),
            func.sum(市场部快手日度数据表.订座数).label('order_count'),
            func.sum(市场部快手日度数据表.上门人数).label('visit'),
            func.sum(市场部快手日度数据表.快手咨询量).label('consult'),
            func.sum(市场部快手日度数据表.快手花费).label('cost'),
        ).filter(
            市场部快手日度数据表.神殿 == campus,
            func.extract('year', 市场部快手日度数据表.日期) == year_int,
        ).group_by(func.extract('month', 市场部快手日度数据表.日期)).all())
        
        for row in kuaishou_data:
            m = _to_int(row.month)
            if m in monthly_data:
                monthly_data[m].add_row(row)
        
        # 3. 汇总小红书数据
        xiaohongshu_data = cast(list[MonthlySummaryRow], db.query(
            func.extract('month', 市场部小红书日度数据表.日期).label('month'),
            func.sum(市场部小红书日度数据表.小红书实际收入).label('income'),
            func.sum(市场部小红书日度数据表.退费数).label('refund'),
            func.sum(市场部小红书日度数据表.毛报总数).label('gross'),
            func.sum(市场部小红书日度数据表.净报名).label('net'),
            func.sum(市场部小红书日度数据表.订座数).label('order_count'),
            func.sum(市场部小红书日度数据表.上门人数).label('visit'),
            func.sum(市场部小红书日度数据表.小红书总量).label('consult'),
            func.sum(市场部小红书日度数据表.小红书消费).label('cost'),
        ).filter(
            市场部小红书日度数据表.神殿 == campus,
            func.extract('year', 市场部小红书日度数据表.日期) == year_int,
        ).group_by(func.extract('month', 市场部小红书日度数据表.日期)).all())
        
        for row in xiaohongshu_data:
            m = _to_int(row.month)
            if m in monthly_data:
                monthly_data[m].add_row(row)
        
        # 4. 汇总视频号数据
        wechat_data = cast(list[MonthlySummaryRow], db.query(
            func.extract('month', 市场部微信视频号日度数据表.日期).label('month'),
            func.sum(市场部微信视频号日度数据表.微信视频号实际收入).label('income'),
            func.sum(市场部微信视频号日度数据表.退费数).label('refund'),
            func.sum(市场部微信视频号日度数据表.毛报总数).label('gross'),
            func.sum(市场部微信视频号日度数据表.净报名).label('net'),
            func.sum(市场部微信视频号日度数据表.订座数).label('order_count'),
            func.sum(市场部微信视频号日度数据表.上门人数).label('visit'),
            func.sum(市场部微信视频号日度数据表.微信视频号总量).label('consult'),
            func.sum(市场部微信视频号日度数据表.微信视频号消费).label('cost'),
        ).filter(
            市场部微信视频号日度数据表.神殿 == campus,
            func.extract('year', 市场部微信视频号日度数据表.日期) == year_int,
        ).group_by(func.extract('month', 市场部微信视频号日度数据表.日期)).all())
        
        for row in wechat_data:
            m = _to_int(row.month)
            if m in monthly_data:
                monthly_data[m].add_row(row)
        
        # 5. 汇总B站数据
        bilibili_data = cast(list[MonthlySummaryRow], db.query(
            func.extract('month', 市场部B站日度数据表.日期).label('month'),
            func.sum(市场部B站日度数据表.B站实际收入).label('income'),
            func.sum(市场部B站日度数据表.退费数).label('refund'),
            func.sum(市场部B站日度数据表.毛报总数).label('gross'),
            func.sum(市场部B站日度数据表.净报名).label('net'),
            func.sum(市场部B站日度数据表.订座数).label('order_count'),
            func.sum(市场部B站日度数据表.上门人数).label('visit'),
            func.sum(市场部B站日度数据表.B站咨询量).label('consult'),
            func.sum(市场部B站日度数据表.B站花费).label('cost'),
        ).filter(
            市场部B站日度数据表.神殿 == campus,
            func.extract('year', 市场部B站日度数据表.日期) == year_int,
        ).group_by(func.extract('month', 市场部B站日度数据表.日期)).all())
        
        for row in bilibili_data:
            m = _to_int(row.month)
            if m in monthly_data:
                monthly_data[m].add_row(row)
        
        return {
            'success': True,
            'data': [item.to_payload() for item in monthly_data.values()],
            'year': year,
            'campus': campus,
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'data': [],
        }


@router.get(
    '/newmedia-monthly-platform-summary',
    summary='获取新媒体月度平台分组数据（按月份和平台分组，用于02看板）',
)
def get_newmedia_monthly_platform_summary(
    year: str = Query(..., description='年份，格式 YYYY'),
    campus: str = Query(..., description='神殿名称'),
    db: Session = Depends(get_db),
):
    """
    汇总指定神殿、指定年份各月份、各平台的新媒体数据
    用于02市场部新媒体数据看板（按平台分解）
    
    返回字段：
    - month: 月份（1-12）
    - platform: 平台名称（抖音/快手/B站/小红书/微信视频号）
    - actual_income: 实际收入
    - refund_count: 退费数
    - gross_enrollment: 毛报总数
    - net_enrollment: 净报名
    - order_count: 订座数
    - visit_count: 上门人数
    - actual_consult_volume: 实际咨询量
    - actual_cost: 实际消费
    """
    try:
        year_int = int(year)
        
        # 月度平台汇总数据
        result_data: list[dict[str, object]] = []
        
        for m in range(1, 13):
            # 抖音数据
            douyin_row = cast(MonthlySummaryRow | None, db.query(
                func.sum(市场部抖音日度数据表.抖音实际收入).label('income'),
                func.sum(市场部抖音日度数据表.退费数).label('refund'),
                func.sum(市场部抖音日度数据表.毛报总数).label('gross'),
                func.sum(市场部抖音日度数据表.净报名).label('net'),
                func.sum(市场部抖音日度数据表.订座数).label('order_count'),
                func.sum(市场部抖音日度数据表.上门人数).label('visit'),
                func.sum(市场部抖音日度数据表.抖音咨询量).label('consult'),
                func.sum(市场部抖音日度数据表.抖音花费).label('cost'),
            ).filter(
                市场部抖音日度数据表.神殿 == campus,
                func.extract('year', 市场部抖音日度数据表.日期) == year_int,
                func.extract('month', 市场部抖音日度数据表.日期) == m,
            ).first())
            
            result_data.append(_monthly_platform_payload(m, '抖音', douyin_row))
            
            # 快手数据
            kuaishou_row = cast(MonthlySummaryRow | None, db.query(
                func.sum(市场部快手日度数据表.快手实际收入).label('income'),
                func.sum(市场部快手日度数据表.退费数).label('refund'),
                func.sum(市场部快手日度数据表.毛报总数).label('gross'),
                func.sum(市场部快手日度数据表.净报名).label('net'),
                func.sum(市场部快手日度数据表.订座数).label('order_count'),
                func.sum(市场部快手日度数据表.上门人数).label('visit'),
                func.sum(市场部快手日度数据表.快手咨询量).label('consult'),
                func.sum(市场部快手日度数据表.快手花费).label('cost'),
            ).filter(
                市场部快手日度数据表.神殿 == campus,
                func.extract('year', 市场部快手日度数据表.日期) == year_int,
                func.extract('month', 市场部快手日度数据表.日期) == m,
            ).first())
            
            result_data.append(_monthly_platform_payload(m, '快手', kuaishou_row))
            
            # B站数据
            bilibili_row = cast(MonthlySummaryRow | None, db.query(
                func.sum(市场部B站日度数据表.B站实际收入).label('income'),
                func.sum(市场部B站日度数据表.退费数).label('refund'),
                func.sum(市场部B站日度数据表.毛报总数).label('gross'),
                func.sum(市场部B站日度数据表.净报名).label('net'),
                func.sum(市场部B站日度数据表.订座数).label('order_count'),
                func.sum(市场部B站日度数据表.上门人数).label('visit'),
                func.sum(市场部B站日度数据表.B站咨询量).label('consult'),
                func.sum(市场部B站日度数据表.B站花费).label('cost'),
            ).filter(
                市场部B站日度数据表.神殿 == campus,
                func.extract('year', 市场部B站日度数据表.日期) == year_int,
                func.extract('month', 市场部B站日度数据表.日期) == m,
            ).first())
            
            result_data.append(_monthly_platform_payload(m, 'B站', bilibili_row))
            
            # 小红书数据
            xiaohongshu_row = cast(MonthlySummaryRow | None, db.query(
                func.sum(市场部小红书日度数据表.小红书实际收入).label('income'),
                func.sum(市场部小红书日度数据表.退费数).label('refund'),
                func.sum(市场部小红书日度数据表.毛报总数).label('gross'),
                func.sum(市场部小红书日度数据表.净报名).label('net'),
                func.sum(市场部小红书日度数据表.订座数).label('order_count'),
                func.sum(市场部小红书日度数据表.上门人数).label('visit'),
                func.sum(市场部小红书日度数据表.小红书总量).label('consult'),
                func.sum(市场部小红书日度数据表.小红书消费).label('cost'),
            ).filter(
                市场部小红书日度数据表.神殿 == campus,
                func.extract('year', 市场部小红书日度数据表.日期) == year_int,
                func.extract('month', 市场部小红书日度数据表.日期) == m,
            ).first())
            
            result_data.append(_monthly_platform_payload(m, '小红书', xiaohongshu_row))
            
            # 微信视频号数据
            wechat_row = cast(MonthlySummaryRow | None, db.query(
                func.sum(市场部微信视频号日度数据表.微信视频号实际收入).label('income'),
                func.sum(市场部微信视频号日度数据表.退费数).label('refund'),
                func.sum(市场部微信视频号日度数据表.毛报总数).label('gross'),
                func.sum(市场部微信视频号日度数据表.净报名).label('net'),
                func.sum(市场部微信视频号日度数据表.订座数).label('order_count'),
                func.sum(市场部微信视频号日度数据表.上门人数).label('visit'),
                func.sum(市场部微信视频号日度数据表.微信视频号总量).label('consult'),
                func.sum(市场部微信视频号日度数据表.微信视频号消费).label('cost'),
            ).filter(
                市场部微信视频号日度数据表.神殿 == campus,
                func.extract('year', 市场部微信视频号日度数据表.日期) == year_int,
                func.extract('month', 市场部微信视频号日度数据表.日期) == m,
            ).first())
            
            result_data.append(_monthly_platform_payload(m, '微信视频号', wechat_row))
        
        return {
            'success': True,
            'data': result_data,
            'year': year,
            'campus': campus,
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'data': [],
        }
