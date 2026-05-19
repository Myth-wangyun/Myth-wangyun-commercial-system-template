"""
CRUD for academic position analysis report summary
智慧司岗位分析报告汇总表 CRUD 操作 - 支持动态列
"""

from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.position_analysis_summary import 智慧司岗位分析报告汇总表

# 默认列配置
DEFAULT_COLUMNS = [
    {"key": "network", "label": "网络工程"},
    {"key": "server", "label": "服务器运维"},
    {"key": "cloud", "label": "云计算"},
    {"key": "ai", "label": "人工智能"},
    {"key": "shortVideo", "label": "后期短视频"},
    {"key": "indoorOutdoor", "label": "室内外效果"},
    {"key": "game", "label": "游戏动漫"},
]

# 默认神殿列表
DEFAULT_CAMPUSES = ['盛邦', '冀美', '石美', '晋美', '原美', '太美', '桂美']


def get_record_by_year(db: Session, 年份: int) -> Optional[智慧司岗位分析报告汇总表]:
    """根据年份获取记录"""
    return db.query(智慧司岗位分析报告汇总表).filter(
        智慧司岗位分析报告汇总表.年份 == 年份
    ).first()


def list_records(db: Session, 年份: Optional[int] = None) -> List[智慧司岗位分析报告汇总表]:
    """获取记录列表"""
    query = db.query(智慧司岗位分析报告汇总表)
    if 年份 is not None:
        query = query.filter(智慧司岗位分析报告汇总表.年份 == 年份)
    return query.order_by(智慧司岗位分析报告汇总表.年份.desc()).all()


def get_record(db: Session, record_id: int) -> Optional[智慧司岗位分析报告汇总表]:
    """根据ID获取单条记录"""
    return db.query(智慧司岗位分析报告汇总表).filter_by(id=record_id).first()


def create_record(
    db: Session,
    年份: int,
    columns: list,
    rows: list,
) -> 智慧司岗位分析报告汇总表:
    """创建新记录"""
    new_obj = 智慧司岗位分析报告汇总表(
        年份=年份,
        columns=columns,
        rows=rows,
    )
    db.add(new_obj)
    db.commit()
    db.refresh(new_obj)
    return new_obj


def upsert_record(
    db: Session,
    年份: int,
    columns: list,
    rows: list,
) -> 智慧司岗位分析报告汇总表:
    """创建或更新记录（同年份唯一）"""
    existing = get_record_by_year(db, 年份)
    if existing:
        existing.columns = columns
        existing.rows = rows
        db.commit()
        db.refresh(existing)
        return existing
    return create_record(db, 年份, columns, rows)


def update_record(
    db: Session,
    record_id: int,
    columns: Optional[list] = None,
    rows: Optional[list] = None,
    年份: Optional[int] = None,
) -> Optional[智慧司岗位分析报告汇总表]:
    """更新记录"""
    obj = get_record(db, record_id)
    if not obj:
        return None
    if columns is not None:
        obj.columns = columns
    if rows is not None:
        obj.rows = rows
    if 年份 is not None:
        obj.年份 = 年份
    db.commit()
    db.refresh(obj)
    return obj


def delete_record(db: Session, record_id: int) -> bool:
    """删除记录"""
    obj = get_record(db, record_id)
    if not obj:
        return False
    db.delete(obj)
    db.commit()
    return True


def add_column(db: Session, record_id: int, key: str, label: str) -> Optional[智慧司岗位分析报告汇总表]:
    """添加新列"""
    obj = get_record(db, record_id)
    if not obj:
        return None
    
    # 检查列是否已存在
    columns = obj.columns or []
    if any(col.get("key") == key for col in columns):
        return obj  # 列已存在，直接返回
    
    # 添加新列
    columns.append({"key": key, "label": label})
    obj.columns = columns
    
    # 为所有行添加新列的默认值
    rows = obj.rows or []
    for row in rows:
        if "data" in row and key not in row["data"]:
            row["data"][key] = 0
    obj.rows = rows
    
    db.commit()
    db.refresh(obj)
    return obj


def remove_column(db: Session, record_id: int, key: str) -> Optional[智慧司岗位分析报告汇总表]:
    """删除列"""
    obj = get_record(db, record_id)
    if not obj:
        return None
    
    # 从列配置中删除
    columns = obj.columns or []
    obj.columns = [col for col in columns if col.get("key") != key]
    
    # 从所有行数据中删除该列
    rows = obj.rows or []
    for row in rows:
        if "data" in row and key in row["data"]:
            del row["data"][key]
    obj.rows = rows
    
    db.commit()
    db.refresh(obj)
    return obj


def get_or_create_default(db: Session, 年份: int) -> 智慧司岗位分析报告汇总表:
    """获取或创建默认记录"""
    existing = get_record_by_year(db, 年份)
    if existing:
        return existing
    
    # 创建默认数据
    default_rows = [
        {"campus": campus, "data": {col["key"]: 0 for col in DEFAULT_COLUMNS}}
        for campus in DEFAULT_CAMPUSES
    ]
    
    return create_record(db, 年份, DEFAULT_COLUMNS, default_rows)
