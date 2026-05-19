"""
CRUD for enterprise survey summary
企业调研汇总表 CRUD 操作 - 支持动态列
"""

from typing import Any, List, Optional

from sqlalchemy.orm import Session

JsonObject = dict[str, Any]
JsonArray = list[JsonObject]

from app.models.enterprise_survey_summary import 企业调研汇总表

# 7个固定神殿
CAMPUSES = ['盛邦', '冀美', '石美', '晋美', '原美', '太美', '桂美']

# 默认列配置（城市）
DEFAULT_COLUMNS = [
    {"key": "beijing", "label": "北京"},
    {"key": "shanghai", "label": "上海"},
    {"key": "guangzhou", "label": "广州"},
    {"key": "shijiazhuang", "label": "石家庄"},
    {"key": "taiyuan", "label": "太原"},
    {"key": "nanning", "label": "南宁"},
]


def list_records(db: Session, 年份: Optional[int] = None) -> List[企业调研汇总表]:
    """获取企业调研汇总记录列表"""
    query = db.query(企业调研汇总表)
    if 年份 is not None:
        query = query.filter(企业调研汇总表.年份 == 年份)
    return query.order_by(企业调研汇总表.年份.desc()).all()


def get_record_by_year(db: Session, 年份: int) -> Optional[企业调研汇总表]:
    """根据年份获取记录"""
    return db.query(企业调研汇总表).filter(
        企业调研汇总表.年份 == 年份
    ).first()


def get_record(db: Session, record_id: int) -> Optional[企业调研汇总表]:
    """根据ID获取单条记录"""
    return db.query(企业调研汇总表).filter_by(id=record_id).first()


def create_record(
    db: Session,
    年份: int,
    columns: JsonArray,
    rows: JsonArray
) -> 企业调研汇总表:
    """创建新记录"""
    new_obj = 企业调研汇总表(
        年份=年份,
        columns=columns,
        rows=rows,
    )
    db.add(new_obj)
    db.commit()
    db.refresh(new_obj)
    return new_obj


def update_record(
    db: Session,
    record_id: int,
    columns: Optional[JsonArray] = None,
    rows: Optional[JsonArray] = None
) -> Optional[企业调研汇总表]:
    """更新记录"""
    obj = get_record(db, record_id)
    if not obj:
        return None
    
    if columns is not None:
        obj.columns = columns
    if rows is not None:
        obj.rows = rows
    
    db.commit()
    db.refresh(obj)
    return obj


def upsert_record(
    db: Session,
    年份: int,
    columns: JsonArray,
    rows: JsonArray
) -> 企业调研汇总表:
    """更新或创建记录（根据年份）"""
    existing = get_record_by_year(db, 年份)
    
    if existing:
        updated = update_record(db, existing.id, columns, rows)
        if updated is None:
            raise RuntimeError("existing enterprise survey summary disappeared during update")
        return updated
    else:
        return create_record(db, 年份, columns, rows)


def delete_record(db: Session, record_id: int) -> bool:
    """删除记录"""
    obj = get_record(db, record_id)
    if not obj:
        return False
    db.delete(obj)
    db.commit()
    return True


def add_column(
    db: Session,
    record_id: int,
    key: str,
    label: str
) -> Optional[企业调研汇总表]:
    """添加列"""
    obj = get_record(db, record_id)
    if not obj:
        return None
    
    # 检查列是否已存在
    existing_keys = [col["key"] for col in obj.columns]
    if key in existing_keys:
        return obj  # 列已存在，返回原对象
    
    # 添加新列
    new_columns = list(obj.columns) + [{"key": key, "label": label}]
    obj.columns = new_columns
    
    # 为所有行初始化新列数据
    new_rows = []
    for row in obj.rows:
        new_data = dict(row["data"])
        new_data[key] = 0
        new_rows.append({"campus": row["campus"], "data": new_data})
    obj.rows = new_rows
    
    db.commit()
    db.refresh(obj)
    return obj


def remove_column(
    db: Session,
    record_id: int,
    key: str
) -> Optional[企业调研汇总表]:
    """删除列"""
    obj = get_record(db, record_id)
    if not obj:
        return None
    
    # 移除列配置
    new_columns = [col for col in obj.columns if col["key"] != key]
    obj.columns = new_columns
    
    # 移除所有行中该列的数据
    new_rows = []
    for row in obj.rows:
        new_data = {k: v for k, v in row["data"].items() if k != key}
        new_rows.append({"campus": row["campus"], "data": new_data})
    obj.rows = new_rows
    
    db.commit()
    db.refresh(obj)
    return obj


def get_or_create_default(db: Session, 年份: int) -> 企业调研汇总表:
    """获取或创建默认记录"""
    existing = get_record_by_year(db, 年份)
    if existing:
        return existing
    
    # 创建默认记录
    default_rows: JsonArray = []
    for campus in CAMPUSES:
        data = {}
        for col in DEFAULT_COLUMNS:
            data[col['key']] = 0
        default_rows.append({"campus": campus, "data": data})
    
    return create_record(db, 年份, DEFAULT_COLUMNS, default_rows)
