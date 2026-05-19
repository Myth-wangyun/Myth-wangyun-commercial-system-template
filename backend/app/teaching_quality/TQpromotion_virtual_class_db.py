"""
教学质量模块 - 升学计划（虚拟升学班 + 学生关联）DB
只影响 teaching_quality 模块；不修改智慧司任何文件。

两张表：
1) 虚拟升学班 tq_promotion_virtual_class
2) 虚拟升学班-学生 tq_promotion_virtual_class_student

提供基础 CRUD 与汇总查询，供 API 层调用。
"""
from datetime import date, datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional

from sqlalchemy import (
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, Session, mapped_column
from sqlalchemy.sql import func

from app.core.database import TQBase, engine, ensure_teaching_quality_schema


class 虚拟升学班(TQBase):
    __tablename__ = "tq_promotion_virtual_class"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    # 地区可为空（地区层需要汇总再补全）；不强依赖智慧司
    region_code: Mapped[str | None] = mapped_column(String(20), nullable=True)
    campus_code: Mapped[str | None] = mapped_column(String(50), nullable=True)
    campus_name: Mapped[str | None] = mapped_column(String(50), nullable=True)  # 冗余：前端传入的神殿中文名

    year: Mapped[int] = mapped_column(Integer, nullable=False)
    month: Mapped[int] = mapped_column(Integer, nullable=False)

    virtual_class_name: Mapped[str] = mapped_column(String(100), nullable=False)  # 人工输入
    from_class_code: Mapped[str | None] = mapped_column(String(50), nullable=True)       # 来源班级（可选）

    target_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    remark: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.current_timestamp()
    )

    __table_args__ = (
        UniqueConstraint(
            "campus_name", "year", "month", "virtual_class_name",
            name="uq_promotion_vc_campus_year_month_vcname",
        ),
        # Index 移至 _migrate() 中手动创建，避免重复定义导致 DuplicateTable 错误
        Index("idx_promotion_vc_region_year_month", "region_code", "year", "month"),
        Index("idx_promotion_vc_campus_year_month", "campus_name", "year", "month"),
        {"schema": "teaching_quality", "extend_existing": True},
    )

class 虚拟升学班学生(TQBase):
    __tablename__ = "tq_promotion_virtual_class_student"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    virtual_class_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("teaching_quality.tq_promotion_virtual_class.id", ondelete="CASCADE"),
        nullable=False,
    )
    student_key: Mapped[str] = mapped_column(String(64), nullable=False)  # 学生唯一键（使用班级档案里的身份证号 idCard）

    enroll_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    enroll_age: Mapped[int | None] = mapped_column(Integer, nullable=True)

    receivable_amount: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    expected_pay_amount: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    actual_pay_amount: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    supplement_time: Mapped[date | None] = mapped_column(Date, nullable=True)

    remark: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.current_timestamp()
    )

    __table_args__ = (
        UniqueConstraint("virtual_class_id", "student_key", name="uq_promotion_vc_student"),
        # Index 移至 _migrate() 中手动创建，避免重复定义导致 DuplicateTable 错误
        Index("idx_promotion_vc_student_vcid", "virtual_class_id"),
        Index("idx_promotion_vc_student_skey", "student_key"),
        {"schema": "teaching_quality", "extend_existing": True},
    )

    # 移除 relationship 定义以避免重复导入时的冲突
    # 如果需要关联查询，可以在查询时使用 join
    # virtual_class = relationship(
    #     "app.teaching_quality.TQpromotion_virtual_class_db.虚拟升学班",
    #     backref="students",
    #     primaryjoin="app.teaching_quality.TQpromotion_virtual_class_db.虚拟升学班学生.virtual_class_id == app.teaching_quality.TQpromotion_virtual_class_db.虚拟升学班.id",
    #     foreign_keys="[app.teaching_quality.TQpromotion_virtual_class_db.虚拟升学班学生.virtual_class_id]"
    # )

# --- 初始化 ---

_MIGRATED = False

def _migrate():
    global _MIGRATED
    if _MIGRATED:
        return
    from app.core.database import _tq_batch_migrated
    if _tq_batch_migrated:
        _MIGRATED = True
        return
    ensure_teaching_quality_schema()
    TQBase.metadata.create_all(
        bind=engine,
        tables=[虚拟升学班.__table__, 虚拟升学班学生.__table__],
    )
    _MIGRATED = True

def init_promotion_tables():
    _migrate()

# --- CRUD & 查询 ---

def create_virtual_class(
    db: Session,
    *,
    campus_name: str,
    year: int,
    month: int,
    virtual_class_name: str,
    region_code: Optional[str] = None,
    campus_code: Optional[str] = None,
    from_class_code: Optional[str] = None,
    target_count: Optional[int] = 0,
    remark: Optional[str] = None,
) -> 虚拟升学班:
    _migrate()
    vc = 虚拟升学班(
        region_code=region_code,
        campus_code=campus_code,
        campus_name=campus_name,
        year=int(year),
        month=int(month),
        virtual_class_name=virtual_class_name.strip(),
        from_class_code=from_class_code,
        target_count=int(target_count or 0),
        remark=remark,
    )
    db.add(vc)
    db.flush()
    return vc

def update_virtual_class(
    db: Session,
    *,
    id: int,
    virtual_class_name: Optional[str] = None,
    from_class_code: Optional[str] = None,
    target_count: Optional[int] = None,
    remark: Optional[str] = None,
) -> Optional[虚拟升学班]:
    _migrate()
    vc: Optional[虚拟升学班] = db.query(虚拟升学班).get(id)
    if not vc:
        return None
    if virtual_class_name is not None:
        vc.virtual_class_name = virtual_class_name
    if from_class_code is not None:
        vc.from_class_code = from_class_code
    if target_count is not None:
        vc.target_count = int(target_count)
    if remark is not None:
        vc.remark = remark
    db.flush()
    return vc

def list_virtual_classes(db: Session, *, campus_name: str, year: int, month: int) -> List[Dict[str, Any]]:
    _migrate()
    rows: List[虚拟升学班] = (
        db.query(虚拟升学班)
        .filter(
            虚拟升学班.campus_name == campus_name,
            虚拟升学班.year == int(year),
            虚拟升学班.month == int(month),
        )
        .order_by(虚拟升学班.id.asc())
        .all()
    )
    # 统计学生数
    result: List[Dict[str, Any]] = []
    for r in rows:
        in_file_count = (
            db.query(虚拟升学班学生).filter(虚拟升学班学生.virtual_class_id == r.id).count()
        )
        result.append(
            {
                "id": r.id,
                "campus": r.campus_name,
                "year": r.year,
                "month": r.month,
                "virtualClassName": r.virtual_class_name,
                "fromClassCode": r.from_class_code,
                "targetCount": r.target_count or 0,
                "inFileCount": in_file_count,
                "remark": r.remark,
            }
        )
    return result

def add_students(
    db: Session,
    *,
    virtual_class_id: int,
    students: List[Dict[str, Any]],
) -> int:
    _migrate()
    added = 0
    for s in students:
        skey = str(s.get("studentKey") or s.get("idCard") or "").strip()
        if not skey:
            continue
        exists = (
            db.query(虚拟升学班学生)
            .filter(
                虚拟升学班学生.virtual_class_id == virtual_class_id,
                虚拟升学班学生.student_key == skey,
            )
            .first()
        )
        if exists:
            continue
        row = 虚拟升学班学生(
            virtual_class_id=virtual_class_id,
            student_key=skey,
            enroll_date=s.get("enrollDate"),
            enroll_age=s.get("enrollAge"),
            receivable_amount=s.get("receivableAmount"),
            expected_pay_amount=s.get("expectedPayAmount"),
            actual_pay_amount=s.get("actualPayAmount"),
            supplement_time=s.get("supplementTime"),
            remark=s.get("remark"),
        )
        db.add(row)
        added += 1
    db.flush()
    return added

def list_students(db: Session, *, virtual_class_id: int) -> List[Dict[str, Any]]:
    _migrate()
    rows = (
        db.query(虚拟升学班学生)
        .filter(虚拟升学班学生.virtual_class_id == virtual_class_id)
        .order_by(虚拟升学班学生.id.asc())
        .all()
    )
    out: List[Dict[str, Any]] = []
    for r in rows:
        out.append(
            {
                "id": r.id,
                "studentKey": r.student_key,
                "enrollDate": r.enroll_date,
                "enrollAge": r.enroll_age,
                "receivableAmount": float(r.receivable_amount or 0),
                "expectedPayAmount": float(r.expected_pay_amount or 0),
                "actualPayAmount": float(r.actual_pay_amount or 0),
                "supplementTime": r.supplement_time,
                "remark": r.remark,
            }
        )
    return out

def remove_student(db: Session, *, virtual_class_id: int, student_key: str) -> int:
    _migrate()
    cnt = (
        db.query(虚拟升学班学生)
        .filter(
            虚拟升学班学生.virtual_class_id == virtual_class_id,
            虚拟升学班学生.student_key == str(student_key),
        )
        .delete()
    )
    return cnt

def region_summary(db: Session, *, region_code: str, year: int) -> List[Dict[str, Any]]:
    _migrate()
    # 简单做法：逐条查学生数（量级小足够；量大可改子查询聚合）
    rows: List[虚拟升学班] = (
        db.query(虚拟升学班)
        .filter(虚拟升学班.region_code == region_code, 虚拟升学班.year == int(year))
        .order_by(虚拟升学班.month.asc(), 虚拟升学班.campus_name.asc())
        .all()
    )
    out: List[Dict[str, Any]] = []
    for r in rows:
        in_file = (
            db.query(虚拟升学班学生).filter(虚拟升学班学生.virtual_class_id == r.id).count()
        )
        out.append(
            {
                "region": r.region_code,
                "campus": r.campus_name,
                "year": r.year,
                "month": r.month,
                "virtualClassId": r.id,
                "virtualClassName": r.virtual_class_name,
                "inFileCount": in_file,
                "targetCount": r.target_count or 0,
            }
        )
    return out

# 初始化
try:
    _migrate()
except Exception as e:
    print(f"[promotion] init tables failed: {e}")

