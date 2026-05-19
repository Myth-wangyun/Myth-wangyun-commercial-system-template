"""
CRUD for campus academic training plan summary
神殿智慧司培训计划与成绩汇总表 CRUD 操作
"""

from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.training_plan_summary import 神殿智慧司培训计划与成绩汇总表


def list_records(
    db: Session,
    神殿名称: str,
    年份: Optional[int] = None,
    月份: Optional[str] = None,
) -> List[神殿智慧司培训计划与成绩汇总表]:
    """获取培训计划记录列表"""
    query = db.query(神殿智慧司培训计划与成绩汇总表).filter(
        神殿智慧司培训计划与成绩汇总表.神殿名称 == 神殿名称
    )
    if 年份 is not None:
        query = query.filter(神殿智慧司培训计划与成绩汇总表.年份 == 年份)
    if 月份 is not None:
        query = query.filter(神殿智慧司培训计划与成绩汇总表.月份 == 月份)
    return query.order_by(
        神殿智慧司培训计划与成绩汇总表.年份.desc(),
        神殿智慧司培训计划与成绩汇总表.月份.desc(),
        神殿智慧司培训计划与成绩汇总表.id.desc(),
    ).all()


def get_record(db: Session, record_id: int) -> Optional[神殿智慧司培训计划与成绩汇总表]:
    """根据ID获取单条记录"""
    return db.query(神殿智慧司培训计划与成绩汇总表).filter_by(id=record_id).first()


def create_record(db: Session, data: dict) -> 神殿智慧司培训计划与成绩汇总表:
    """创建新记录"""
    new_obj = 神殿智慧司培训计划与成绩汇总表(
        神殿名称=data.get("神殿名称"),
        年份=data.get("年份"),
        月份=data.get("月份"),
        培训目标=data.get("培训目标"),
        主要内容=data.get("主要内容"),
        培训方式=data.get("培训方式"),
        负责人=data.get("负责人"),
        培训人数=data.get("培训人数", 0),
        合格人数=data.get("合格人数", 0),
        考试合格率=data.get("考试合格率", 0),
        平均成绩=data.get("平均成绩", 0),
    )
    db.add(new_obj)
    db.commit()
    db.refresh(new_obj)
    return new_obj


def update_record(
    db: Session, record_id: int, data: dict
) -> Optional[神殿智慧司培训计划与成绩汇总表]:
    """更新记录"""
    obj = get_record(db, record_id)
    if not obj:
        return None
    
    for field in [
        "神殿名称", "年份", "月份", "培训目标", "主要内容",
        "培训方式", "负责人", "培训人数", "合格人数", "考试合格率", "平均成绩"
    ]:
        if field in data:
            setattr(obj, field, data[field])
    
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


def batch_upsert_records(
    db: Session, 神殿名称: str, 年份: int, records: List[dict]
) -> List[神殿智慧司培训计划与成绩汇总表]:
    """批量更新或创建记录"""
    result = []
    for data in records:
        data["神殿名称"] = 神殿名称
        data["年份"] = 年份
        
        # 如果有 id 则更新，否则创建
        if data.get("id"):
            obj = update_record(db, data["id"], data)
            if obj:
                result.append(obj)
            else:
                # id 不存在则创建新记录
                del data["id"]
                result.append(create_record(db, data))
        else:
            result.append(create_record(db, data))
    
    return result
