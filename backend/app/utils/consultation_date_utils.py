"""
咨询量日期计算工具模块
======================
根据「咨询量计算时段配置」将 "业务日期" 转换为数据库查询的实际 datetime 区间。

核心规则：
    某天的咨询量 = 前一天截止时间 → 当天截止时间 之间录入的记录

举例（冬季，截止17:30）：
    查 2025-01-15 的咨询量 → 2025-01-14 17:30:00 ~ 2025-01-15 17:30:00

当没有任何配置记录时，回退到传统的 00:00 ~ 23:59:59 规则以保证兼容。
"""

from datetime import date, datetime, time, timedelta
from typing import Optional, Tuple

from app.models.consultation_schedule_config import ConsultationScheduleConfig
from sqlalchemy.orm import Session

# 缓存: {db_id: (configs_list, last_fetched_at)}
_config_cache: dict = {}
_CACHE_TTL_SECONDS = 300  # 5分钟缓存


def _get_all_active_configs(db: Session) -> list:
    """获取所有启用的时段配置，带简单内存缓存"""
    cache_key = id(db.get_bind())
    now = datetime.now()

    if cache_key in _config_cache:
        configs, fetched_at = _config_cache[cache_key]
        if (now - fetched_at).total_seconds() < _CACHE_TTL_SECONDS:
            return configs

    configs = (
        db.query(ConsultationScheduleConfig)
        .filter(ConsultationScheduleConfig.is_active == True)
        .order_by(ConsultationScheduleConfig.period_start)
        .all()
    )
    _config_cache[cache_key] = (configs, now)
    return configs


def invalidate_schedule_cache():
    """清除缓存（配置变更后调用）"""
    global _config_cache
    _config_cache = {}


def get_cutoff_time_for_date(target_date: date, db: Session) -> Optional[time]:
    """
    获取指定日期的截止时间。

    Returns:
        time 对象（如 time(17, 30)），如果没有匹配的配置则返回 None。
    """
    configs = _get_all_active_configs(db)
    for cfg in configs:
        if cfg.period_start <= target_date <= cfg.period_end:
            return time(cfg.cutoff_hour, cfg.cutoff_minute)
    return None


def get_business_day_range(
    target_date: date, db: Session
) -> Tuple[datetime, datetime]:
    """
    获取某个"业务日期"对应的实际 datetime 查询区间。

    如果 target_date = 2025-01-15，冬季截止 17:30，则返回：
        (datetime(2025, 1, 14, 17, 30), datetime(2025, 1, 15, 17, 30))

    如果没有匹配配置，回退到传统规则：
        (datetime(2025, 1, 15, 0, 0), datetime(2025, 1, 15, 23, 59, 59))
    """
    cutoff = get_cutoff_time_for_date(target_date, db)
    if cutoff is None:
        # 无配置 → 传统整天范围
        return (
            datetime.combine(target_date, time.min),
            datetime.combine(target_date, time(23, 59, 59)),
        )

    # 前一天的截止时间需要根据前一天的配置来确定
    prev_date = target_date - timedelta(days=1)
    prev_cutoff = get_cutoff_time_for_date(prev_date, db)
    if prev_cutoff is None:
        # 前一天没有配置（极端情况），使用当天截止时间
        prev_cutoff = cutoff

    start_dt = datetime.combine(prev_date, prev_cutoff)
    end_dt = datetime.combine(target_date, cutoff)
    return (start_dt, end_dt)


def get_business_month_range(
    month_start: date, month_end: date, db: Session
) -> Tuple[datetime, datetime]:
    """
    获取月度范围的实际 datetime 查询区间。

    月初第一天的咨询量从前一天截止时间开始算起，
    月末最后一天的咨询量到当天截止时间结束。

    如果没有配置，回退到传统规则。
    """
    # 月初：使用 month_start 的 business day 的 start
    start_dt, _ = get_business_day_range(month_start, db)

    # 月末：使用 month_end 的 business day 的 end
    _, end_dt = get_business_day_range(month_end, db)

    return (start_dt, end_dt)


def has_schedule_config(db: Session) -> bool:
    """检查是否存在任何启用的配置"""
    configs = _get_all_active_configs(db)
    return len(configs) > 0


def get_default_schedule_configs(year: int) -> list:
    """
    生成指定年份的默认配置数据（用于初始化）。
    
    默认规则：
    - 1月1日~4月30日：冬季，17:30
    - 5月1日~9月30日：夏季，18:00
    - 10月1日~12月31日：冬季，17:30
    """
    return [
        {
            "period_name": "冬季",
            "period_start": date(year, 1, 1),
            "period_end": date(year, 4, 30),
            "cutoff_hour": 17,
            "cutoff_minute": 30,
            "description": f"{year}年冬季作息时间（1月-4月）",
        },
        {
            "period_name": "夏季",
            "period_start": date(year, 5, 1),
            "period_end": date(year, 9, 30),
            "cutoff_hour": 18,
            "cutoff_minute": 0,
            "description": f"{year}年夏季作息时间（5月-9月）",
        },
        {
            "period_name": "冬季",
            "period_start": date(year, 10, 1),
            "period_end": date(year, 12, 31),
            "cutoff_hour": 17,
            "cutoff_minute": 30,
            "description": f"{year}年冬季作息时间（10月-12月）",
        },
    ]
