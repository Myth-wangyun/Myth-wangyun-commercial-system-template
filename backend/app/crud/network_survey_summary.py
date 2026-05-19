"""
网络调查汇总表 CRUD
"""

from typing import Optional, TypedDict

from sqlalchemy.orm import Session

from app.models.network_survey_summary import 网络调查汇总表
from app.schemas.network_survey_summary import (
    CityConfig,
    NetworkSurveySummaryCreate,
    NetworkSurveySummaryUpdate,
    PlatformConfig,
    RowData,
)


class 平台配置载荷(TypedDict):
    key: str
    label: str


class 城市配置载荷(TypedDict):
    key: str
    label: str


class 行数据载荷(TypedDict):
    campus: str
    major: str
    data: dict[str, int]

# 默认平台配置
DEFAULT_PLATFORMS: list[平台配置载荷] = [
    {"key": "boss", "label": "Boss直聘"},
    {"key": "zhilian", "label": "智联招聘"},
]

# 默认城市配置
DEFAULT_CITIES: list[城市配置载荷] = [
    {"key": "beijing", "label": "北京"},
    {"key": "shanghai", "label": "上海"},
    {"key": "guangzhou", "label": "广州"},
    {"key": "shijiazhuang", "label": "石家庄"},
    {"key": "taiyuan", "label": "太原"},
    {"key": "nanning", "label": "南宁"},
]

# 默认神殿列表
DEFAULT_CAMPUSES = ['盛邦', '冀美', '石美', '晋美', '原美', '太美', '桂美']


def _copy_platforms(platforms: list[平台配置载荷]) -> list[平台配置载荷]:
    return [{"key": platform["key"], "label": platform["label"]} for platform in platforms]


def _copy_cities(cities: list[城市配置载荷]) -> list[城市配置载荷]:
    return [{"key": city["key"], "label": city["label"]} for city in cities]


def _copy_rows(rows: list[行数据载荷]) -> list[行数据载荷]:
    return [
        {
            "campus": row["campus"],
            "major": row["major"],
            "data": dict(row["data"]),
        }
        for row in rows
    ]


def _platform_to_payload(platform: PlatformConfig) -> 平台配置载荷:
    return {"key": platform.key, "label": platform.label}


def _city_to_payload(city: CityConfig) -> 城市配置载荷:
    return {"key": city.key, "label": city.label}


def _row_to_payload(row: RowData) -> 行数据载荷:
    return {
        "campus": row.campus,
        "major": row.major,
        "data": dict(row.data),
    }


def _normalize_platforms(raw: object) -> list[平台配置载荷]:
    if not isinstance(raw, list):
        return []

    platforms: list[平台配置载荷] = []
    for item in raw:
        if not isinstance(item, dict):
            continue
        key = item.get("key")
        label = item.get("label")
        if isinstance(key, str) and isinstance(label, str):
            platforms.append({"key": key, "label": label})
    return platforms


def _normalize_cities(raw: object) -> list[城市配置载荷]:
    if not isinstance(raw, list):
        return []

    cities: list[城市配置载荷] = []
    for item in raw:
        if not isinstance(item, dict):
            continue
        key = item.get("key")
        label = item.get("label")
        if isinstance(key, str) and isinstance(label, str):
            cities.append({"key": key, "label": label})
    return cities


def _normalize_metric_map(raw: object) -> dict[str, int]:
    if not isinstance(raw, dict):
        return {}

    metrics: dict[str, int] = {}
    for key, value in raw.items():
        if isinstance(key, str) and isinstance(value, int) and not isinstance(value, bool):
            metrics[key] = value
    return metrics


def _normalize_rows(raw: object) -> list[行数据载荷]:
    if not isinstance(raw, list):
        return []

    rows: list[行数据载荷] = []
    for item in raw:
        if not isinstance(item, dict):
            continue
        campus = item.get("campus")
        major = item.get("major")
        if not isinstance(campus, str):
            continue
        rows.append(
            {
                "campus": campus,
                "major": major if isinstance(major, str) else "",
                "data": _normalize_metric_map(item.get("data")),
            }
        )
    return rows


def get_by_year(db: Session, year: int) -> Optional[网络调查汇总表]:
    """根据年份获取记录"""
    return db.query(网络调查汇总表).filter(网络调查汇总表.年份 == year).first()


def get_by_id(db: Session, record_id: int) -> Optional[网络调查汇总表]:
    """根据ID获取记录"""
    return db.query(网络调查汇总表).filter(网络调查汇总表.id == record_id).first()


def get_all(db: Session, skip: int = 0, limit: int = 100) -> list[网络调查汇总表]:
    """获取所有记录"""
    return db.query(网络调查汇总表).offset(skip).limit(limit).all()


def create(db: Session, data: NetworkSurveySummaryCreate) -> 网络调查汇总表:
    """创建记录"""
    db_obj = 网络调查汇总表(
        年份=data.年份,
        platforms=[_platform_to_payload(platform) for platform in data.platforms] if data.platforms else _copy_platforms(DEFAULT_PLATFORMS),
        cities=[_city_to_payload(city) for city in data.cities] if data.cities else _copy_cities(DEFAULT_CITIES),
        rows=[_row_to_payload(row) for row in data.rows] if data.rows else [],
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def update(db: Session, db_obj: 网络调查汇总表, data: NetworkSurveySummaryUpdate) -> 网络调查汇总表:
    """更新记录"""
    if data.年份 is not None:
        db_obj.年份 = data.年份
    if data.platforms is not None:
        db_obj.platforms = [_platform_to_payload(platform) for platform in data.platforms]
    if data.cities is not None:
        db_obj.cities = [_city_to_payload(city) for city in data.cities]
    if data.rows is not None:
        db_obj.rows = [_row_to_payload(row) for row in data.rows]
    
    db.commit()
    db.refresh(db_obj)
    return db_obj


def delete(db: Session, record_id: int) -> bool:
    """删除记录"""
    db_obj = get_by_id(db, record_id)
    if db_obj:
        db.delete(db_obj)
        db.commit()
        return True
    return False


def upsert_by_year(db: Session, data: NetworkSurveySummaryCreate) -> 网络调查汇总表:
    """根据年份插入或更新记录"""
    existing = get_by_year(db, data.年份)
    if existing:
        update_data = NetworkSurveySummaryUpdate(
            platforms=data.platforms,
            cities=data.cities,
            rows=data.rows,
        )
        return update(db, existing, update_data)
    else:
        return create(db, data)


def create_default_for_year(db: Session, year: int) -> 网络调查汇总表:
    """为指定年份创建默认数据"""
    # 生成默认行数据
    default_rows: list[行数据载荷] = []
    for campus in DEFAULT_CAMPUSES:
        row_data: 行数据载荷 = {"campus": campus, "major": "", "data": {}}
        for platform in DEFAULT_PLATFORMS:
            for city in DEFAULT_CITIES:
                key = f"{platform['key']}_{city['key']}"
                row_data["data"][key] = 0
        default_rows.append(row_data)
    
    db_obj = 网络调查汇总表(
        年份=year,
        platforms=_copy_platforms(DEFAULT_PLATFORMS),
        cities=_copy_cities(DEFAULT_CITIES),
        rows=default_rows,
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def add_platform(db: Session, record_id: int, platform_key: str, platform_label: str) -> Optional[网络调查汇总表]:
    """添加平台"""
    db_obj = get_by_id(db, record_id)
    if not db_obj:
        return None
    
    # 检查是否已存在
    platforms = _normalize_platforms(db_obj.platforms)
    if any(p['key'] == platform_key for p in platforms):
        return db_obj
    
    # 添加新平台
    platforms.append({"key": platform_key, "label": platform_label})
    db_obj.platforms = platforms
    
    # 更新所有行数据，添加新平台的城市数据
    cities = _normalize_cities(db_obj.cities)
    rows = _normalize_rows(db_obj.rows)
    for row in rows:
        for city in cities:
            key = f"{platform_key}_{city['key']}"
            if key not in row.get('data', {}):
                row['data'][key] = 0
    db_obj.rows = rows
    
    db.commit()
    db.refresh(db_obj)
    return db_obj


def remove_platform(db: Session, record_id: int, platform_key: str) -> Optional[网络调查汇总表]:
    """删除平台"""
    db_obj = get_by_id(db, record_id)
    if not db_obj:
        return None
    
    # 删除平台
    platforms = [platform for platform in _normalize_platforms(db_obj.platforms) if platform['key'] != platform_key]
    db_obj.platforms = platforms
    
    # 删除行数据中该平台的数据
    cities = _normalize_cities(db_obj.cities)
    rows = _normalize_rows(db_obj.rows)
    for row in rows:
        data = dict(row['data'])
        for city in cities:
            key = f"{platform_key}_{city['key']}"
            data.pop(key, None)
        row['data'] = data
    db_obj.rows = rows
    
    db.commit()
    db.refresh(db_obj)
    return db_obj


def add_city(db: Session, record_id: int, city_key: str, city_label: str) -> Optional[网络调查汇总表]:
    """添加城市"""
    db_obj = get_by_id(db, record_id)
    if not db_obj:
        return None
    
    # 检查是否已存在
    cities = _normalize_cities(db_obj.cities)
    if any(c['key'] == city_key for c in cities):
        return db_obj
    
    # 添加新城市
    cities.append({"key": city_key, "label": city_label})
    db_obj.cities = cities
    
    # 更新所有行数据，添加新城市的平台数据
    platforms = _normalize_platforms(db_obj.platforms)
    rows = _normalize_rows(db_obj.rows)
    for row in rows:
        for platform in platforms:
            key = f"{platform['key']}_{city_key}"
            if key not in row.get('data', {}):
                row['data'][key] = 0
    db_obj.rows = rows
    
    db.commit()
    db.refresh(db_obj)
    return db_obj


def remove_city(db: Session, record_id: int, city_key: str) -> Optional[网络调查汇总表]:
    """删除城市"""
    db_obj = get_by_id(db, record_id)
    if not db_obj:
        return None
    
    # 删除城市
    cities = [city for city in _normalize_cities(db_obj.cities) if city['key'] != city_key]
    db_obj.cities = cities
    
    # 删除行数据中该城市的数据
    platforms = _normalize_platforms(db_obj.platforms)
    rows = _normalize_rows(db_obj.rows)
    for row in rows:
        data = dict(row['data'])
        for platform in platforms:
            key = f"{platform['key']}_{city_key}"
            data.pop(key, None)
        row['data'] = data
    db_obj.rows = rows
    
    db.commit()
    db.refresh(db_obj)
    return db_obj
