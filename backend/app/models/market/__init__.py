"""
市场模块数据库模型
"""

from datetime import date, datetime
from decimal import Decimal
from typing import TypeAlias, cast

from sqlalchemy import DECIMAL, Date, DateTime, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from .account_sentiment import MarketAccountSentimentRegister
from .base import MarketBase
from .bilibili_daily_data import 市场部B站日度数据表
from .campus_core_annual_data import 神殿核心年度数据表
from .daily_reputation_data import 市场部口碑日度数据表
from .douyin_daily_data import 市场部抖音日度数据表
from .employee_interview_records import MarketEmployeeInterviewRecord
from .kuaishou_daily_data import 市场部快手日度数据表
from .meeting_record import MarketMeetingRecord
from .monthly_edit_report import 市场部剪辑月度汇报表
from .monthly_plan_data import (
    市场部免费推广月度计划表,
    市场部口碑月度计划表,
    市场部网络合作伙伴月度计划表,
)
from .monthly_training import MarketMonthlyTraining
from .network_consultant_chat_rate import 网络咨询师A组聊出率表, 网络咨询师B组聊出率表
from .network_plan import MarketNetworkPlan
from .newmedia_platform_plan import 新媒体平台计划表
from .online_partner_daily import 市场部网络合作伙伴日度数据表
from .partner_contacts import MarketPartnerContact
from .sem_daily_data import 市场部SEM其他平台日度数据表, 市场部SEM百度推广日度数据表
from .shooting_detail import 市场部月拍摄明细表
from .staff_function_analysis import (
    市场部AI研发功能分析表,
    市场部中层功能分析权重表,
    市场部中层功能分析表,
    市场部功能分析员工表,
    市场部网推功能分析表,
    市场部网聊功能分析表,
)
from .summary_training import MarketSummaryTraining
from .video_production_detail import 市场部视频制作明细表
from .wechat_video_daily_data import 市场部微信视频号日度数据表
from .weekly_edit_report import 市场部剪辑周度汇报表
from .weekly_training import MarketWeeklyTraining
from .xiaohongshu_daily_data import 市场部小红书日度数据表

# 延迟导入避免循环依赖
def _get_baidu_marketing_models():
    from app.services.market.baidu_marketing.models import (
        BaiduMarketingApp,
        BaiduMarketingAuthLog,
        BaiduMarketingToken,
    )
    return BaiduMarketingApp, BaiduMarketingAuthLog, BaiduMarketingToken

投放明细序列化值: TypeAlias = int | float | str | None


class 投放明细模型基类(MarketBase):
    """神殿投放明细模型共享字段。"""

    __abstract__ = True

    明细ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="明细ID")

    日期: Mapped[date] = mapped_column(Date, nullable=False, comment="日期(年月日)")
    媒体来源: Mapped[str] = mapped_column(String(10), nullable=False, comment="媒体来源")
    消费金额: Mapped[Decimal] = mapped_column(
        DECIMAL(10, 2),
        nullable=False,
        default=Decimal("0.00"),
        comment="消费金额(元)",
    )

    展现量: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment="展现量")
    点击量: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment="点击量")
    IP: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment="IP")
    PV: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment="PV")

    对话量: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment="对话量")
    有效对话: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment="有效对话")
    咨询量: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment="咨询量")

    创建时间: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.current_timestamp(),
        comment="创建时间",
    )
    更新时间: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.current_timestamp(),
        onupdate=func.current_timestamp(),
        comment="更新时间",
    )

    def __repr__(self) -> str:
        class_name = self.__class__.__name__
        return f"<{class_name}(明细ID={self.明细ID}, 日期={self.日期}, 媒体来源={self.媒体来源})>"

    def to_dict(self) -> dict[str, 投放明细序列化值]:
        """转换为字典格式。"""
        return {
            "明细ID": self.明细ID,
            "日期": self.日期.isoformat() if self.日期 else None,
            "媒体来源": self.媒体来源,
            "消费金额": float(self.消费金额) if self.消费金额 else 0.0,
            "展现量": self.展现量,
            "点击量": self.点击量,
            "IP": self.IP,
            "PV": self.PV,
            "对话量": self.对话量,
            "有效对话": self.有效对话,
            "咨询量": self.咨询量,
            "创建时间": self.创建时间.isoformat() if self.创建时间 else None,
            "更新时间": self.更新时间.isoformat() if self.更新时间 else None,
        }


class 投放明细表(投放明细模型基类):
    """投放明细表 - 对应SQL中的投放明细表"""

    __tablename__ = "投放明细表"
    __table_args__ = (
        Index('idx_日期', '日期'),
        Index('idx_媒体来源', '媒体来源'),
    )


# =====================================# 各神殿投放明细表模型
# =====================================
def create_campus_table_class(table_name: str, campus_name: str) -> type[投放明细模型基类]:
    """创建神殿投放明细表类。"""
    index_prefix = f"idx_{table_name}"
    attrs: dict[str, object] = {
        "__module__": __name__,
        "__tablename__": table_name,
        "__doc__": f"{campus_name}投放明细表",
        "__table_args__": (
            Index(f"{index_prefix}_日期", "日期"),
            Index(f"{index_prefix}_媒体来源", "媒体来源"),
        ),
    }
    return cast(type[投放明细模型基类], type(table_name, (投放明细模型基类,), attrs))


# 创建各神殿投放明细表类
盛邦投放明细表 = create_campus_table_class("盛邦投放明细表", "主神殿")
冀美投放明细表 = create_campus_table_class("冀美投放明细表", "永恒殿")
石美投放明细表 = create_campus_table_class("石美投放明细表", "慈悲殿")
晋美投放明细表 = create_campus_table_class("晋美投放明细表", "李大殿")
原美投放明细表 = create_campus_table_class("原美投放明细表", "智慧阁")
太美投放明细表 = create_campus_table_class("太美投放明细表", "光明殿")
桂美投放明细表 = create_campus_table_class("桂美投放明细表", "神恩殿")


__all__ = [
    'MarketBase',
    'MarketAccountSentimentRegister',
    'MarketMeetingRecord',
    'MarketEmployeeInterviewRecord',
    'MarketPartnerContact',
    'MarketWeeklyTraining',
    'MarketMonthlyTraining',
    'MarketSummaryTraining',
    'MarketNetworkPlan',
    '市场部功能分析员工表',
    '市场部中层功能分析表',
    '市场部中层功能分析权重表',
    '市场部网推功能分析表',
    '市场部网聊功能分析表',
    '市场部AI研发功能分析表',
    '市场部视频制作明细表',
    '市场部月拍摄明细表',
    '市场部剪辑周度汇报表',
    '市场部剪辑月度汇报表',
    '市场部免费推广月度计划表',
    '市场部口碑月度计划表',
    '市场部网络合作伙伴月度计划表',
    '市场部口碑日度数据表',
    '市场部网络合作伙伴日度数据表',
    '市场部SEM百度推广日度数据表',
    '市场部SEM其他平台日度数据表',
    '市场部快手日度数据表',
    '市场部抖音日度数据表',
    '市场部B站日度数据表',
    '市场部小红书日度数据表',
    '市场部微信视频号日度数据表',
    '网络咨询师A组聊出率表',
    '网络咨询师B组聊出率表',
    '新媒体平台计划表',
    '投放明细表',
    '盛邦投放明细表',
    '冀美投放明细表',
    '石美投放明细表',
    '晋美投放明细表',
    '原美投放明细表',
    '太美投放明细表',
    '桂美投放明细表',
    'create_campus_table_class',
    '神殿核心年度数据表',
]

# 动态添加百度营销模型到 __all__（避免循环导入）
def __getattr__(name):
    if name in ('BaiduMarketingApp', 'BaiduMarketingToken', 'BaiduMarketingAuthLog'):
        models = _get_baidu_marketing_models()
        if name == 'BaiduMarketingApp':
            return models[0]
        elif name == 'BaiduMarketingToken':
            return models[1]
        elif name == 'BaiduMarketingAuthLog':
            return models[2]
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")
