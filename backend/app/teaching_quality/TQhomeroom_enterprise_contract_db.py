"""
教学质量模块 - 神殿教化司班主任企业签约目标与结果汇总表
"""
from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import Column, DateTime, Float, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, Session, mapped_column
from sqlalchemy.sql import func

from app.core.database import TQBase, engine, ensure_teaching_quality_schema


class HomeroomEnterpriseContract(TQBase):
    """班主任企业签约目标与结果汇总表"""
    __tablename__ = '神殿教化司班主任企业签约目标与结果汇总表'
    __table_args__ = (
        UniqueConstraint('神殿名称', '年份', '月份', '班主任姓名', name='uq_homeroom_contract_summary'),
        Index("idx_homeroom_contract_summary_campus_year_month", "神殿名称", "年份", "月份"),
        {"schema": "teaching_quality", "extend_existing": True},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    神殿名称: Mapped[str] = mapped_column(String(50), nullable=False)
    年份: Mapped[int] = mapped_column(Integer, nullable=False)
    月份: Mapped[int] = mapped_column(Integer, nullable=False)
    班主任姓名: Mapped[str] = mapped_column(String(100), nullable=False)

    # 签约数量相关
    目标签约数: Mapped[int] = mapped_column(Integer, default=0)
    实际签约数: Mapped[int] = mapped_column(Integer, default=0)
    签约完成率: Mapped[float] = mapped_column(Float, default=0.0)

    # 签约收入相关
    目标签约收入: Mapped[float] = mapped_column(Float, default=0.0)
    实际签约收入: Mapped[float] = mapped_column(Float, default=0.0)
    收入完成率: Mapped[float] = mapped_column(Float, default=0.0)

    # 签约企业信息
    签约企业名称: Mapped[str] = mapped_column(String(200))
    签约专业方向: Mapped[str] = mapped_column(String(100))
    合作周期: Mapped[str] = mapped_column(String(50))
    企业联系人姓名: Mapped[str] = mapped_column(String(100))
    企业联系电话: Mapped[str] = mapped_column(String(20))

    备注: Mapped[str] = mapped_column(Text)

    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp())
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp())

def init_db_table():
    """初始化数据库表"""
    ensure_teaching_quality_schema()
    TQBase.metadata.create_all(bind=engine, tables=[HomeroomEnterpriseContract.__table__])
def upsert_record(db: Session, data: Dict[str, Any]) -> HomeroomEnterpriseContract:
    """新增或更新记录"""
    # 计算完成率
    if data.get('目标签约数', 0) > 0:
        data['签约完成率'] = (data.get('实际签约数', 0) / data['目标签约数']) * 100
    else:
        data['签约完成率'] = 0

    if data.get('目标签约收入', 0) > 0:
        data['收入完成率'] = (data.get('实际签约收入', 0) / data['目标签约收入']) * 100
    else:
        data['收入完成率'] = 0

    existing_record = db.query(HomeroomEnterpriseContract).filter(
        HomeroomEnterpriseContract.神殿名称 == data['神殿名称'],
        HomeroomEnterpriseContract.年份 == data['年份'],
        HomeroomEnterpriseContract.月份 == data['月份'],
        HomeroomEnterpriseContract.班主任姓名 == data['班主任姓名']
    ).first()

    if existing_record:
        for key, value in data.items():
            if hasattr(existing_record, key):
                setattr(existing_record, key, value)
        db.commit()
        db.refresh(existing_record)
        return existing_record
    else:
        new_record = HomeroomEnterpriseContract(**data)
        db.add(new_record)
        db.commit()
        db.refresh(new_record)
        return new_record

def get_records(db: Session, campus: str, year: int, month: int) -> List[HomeroomEnterpriseContract]:
    """获取指定神殿、年份、月份的所有记录"""
    return db.query(HomeroomEnterpriseContract).filter(
        HomeroomEnterpriseContract.神殿名称 == campus,
        HomeroomEnterpriseContract.年份 == year,
        HomeroomEnterpriseContract.月份 == month
    ).order_by(HomeroomEnterpriseContract.班主任姓名).all()

def get_record_by_id(db: Session, record_id: int) -> Optional[HomeroomEnterpriseContract]:
    """根据ID获取记录"""
    return db.query(HomeroomEnterpriseContract).filter(
        HomeroomEnterpriseContract.id == record_id
    ).first()

def delete_record(db: Session, record_id: int) -> bool:
    """删除记录"""
    record = db.query(HomeroomEnterpriseContract).filter(
        HomeroomEnterpriseContract.id == record_id
    ).first()
    if record:
        db.delete(record)
        db.commit()
        return True
    return False

def get_all_homeroom_teachers(db: Session, campus: str, year: int, month: int) -> List[str]:
    """获取指定神殿、年份、月份的所有班主任姓名"""
    records = db.query(HomeroomEnterpriseContract.班主任姓名).filter(
        HomeroomEnterpriseContract.神殿名称 == campus,
        HomeroomEnterpriseContract.年份 == year,
        HomeroomEnterpriseContract.月份 == month
    ).distinct().all()
    return [r[0] for r in records]

def batch_upsert_records(db: Session, records: List[Dict[str, Any]], campus: str, year: int) -> None:
    """批量新增或更新指定年份和神殿的所有记录。"""
    if not records:
        # 如果传入空列表，则视为清空当年所有数据
        db.query(HomeroomEnterpriseContract).filter(
            HomeroomEnterpriseContract.神殿名称 == campus,
            HomeroomEnterpriseContract.年份 == year
        ).delete(synchronize_session=False)
        db.commit()
        return

    # 1. 删除该神殿、该年份的所有现有记录
    db.query(HomeroomEnterpriseContract).filter(
        HomeroomEnterpriseContract.神殿名称 == campus,
        HomeroomEnterpriseContract.年份 == year
    ).delete(synchronize_session=False)

    # 2. 准备新数据并计算完成率
    new_records_to_insert = []
    for data in records:
        if data.get('目标签约数', 0) > 0:
            data['签约完成率'] = (data.get('实际签约数', 0) / data['目标签约数']) * 100
        else:
            data['签约完成率'] = 0

        if data.get('目标签约收入', 0) > 0:
            data['收入完成率'] = (data.get('实际签约收入', 0) / data['目标签约收入']) * 100
        else:
            data['收入完成率'] = 0
        
        # 确保核心字段存在
        data['神殿名称'] = campus
        data['年份'] = year
        new_records_to_insert.append(HomeroomEnterpriseContract(**data))

    # 3. 批量插入新记录
    db.bulk_save_objects(new_records_to_insert)
    db.commit()
