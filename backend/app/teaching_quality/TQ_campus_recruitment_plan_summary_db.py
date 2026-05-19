"""
教学质量模块 - 神殿教化司招聘计划与总结汇总表 数据库与辅助函数
Schema: teaching_quality
表名: 神殿教化司招聘计划与总结汇总表
"""
from datetime import date, datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional, cast

from sqlalchemy import (
    Date,
    DateTime,
    Index,
    Integer,
    Numeric,
    String,
    Table,
    Text,
    UniqueConstraint,
)
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Mapped, Session, mapped_column
from sqlalchemy.sql import func

from app.core.database import TQBase as AccountBase
from app.core.database import engine, ensure_teaching_quality_schema


class 神殿教化司招聘计划与总结汇总表(AccountBase):
    """神殿教化司招聘计划与总结汇总表"""
    __tablename__ = "神殿教化司招聘计划与总结汇总表"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    
    # 基本信息
    神殿: Mapped[str] = mapped_column(String(100), nullable=False)
    部门: Mapped[str] = mapped_column(String(100), nullable=False, default="教化司")
    
    # 招聘计划信息
    岗位名称: Mapped[str] = mapped_column(String(100), nullable=False)
    岗位类别: Mapped[str] = mapped_column(String(50))  # 如：教员、管理、其他
    计划招聘人数: Mapped[int] = mapped_column(Integer, default=0)
    计划招聘时间: Mapped[date] = mapped_column(Date)
    
    # 招聘执行信息
    实际招聘岗位名称: Mapped[str] = mapped_column(String(100))
    实际招聘人数: Mapped[int] = mapped_column(Integer, default=0)
    实际招聘时间: Mapped[date] = mapped_column(Date)
    招聘渠道: Mapped[str] = mapped_column(String(200))  # 如：校园招聘、社会招聘、推荐等
    
    # 招聘结果统计
    应聘人数: Mapped[int] = mapped_column(Integer, default=0)
    面试人数: Mapped[int] = mapped_column(Integer, default=0)
    录用人数: Mapped[int] = mapped_column(Integer, default=0)
    录用率: Mapped[Decimal] = mapped_column(Numeric(5, 2))  # 百分比

    # 入/离职信息（按你的表格需要新增字段）
    入职者姓名: Mapped[str] = mapped_column(Text)
    离职人数: Mapped[int] = mapped_column(Integer, default=0)
    离职者姓名: Mapped[str] = mapped_column(Text)
    
    # 招聘成本
    招聘成本: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)  # 单位：元
    人均成本: Mapped[Decimal] = mapped_column(Numeric(12, 2))  # 单位：元
    
    # 招聘质量评估
    入职后三个月留任率: Mapped[Decimal] = mapped_column(Numeric(5, 2))  # 百分比
    半年留任率: Mapped[Decimal] = mapped_column(Numeric(5, 2))  # 百分比
    一年留任率: Mapped[Decimal] = mapped_column(Numeric(5, 2))  # 百分比
    
    # 招聘满意度
    招聘满意度评分: Mapped[Decimal] = mapped_column(Numeric(3, 1))  # 1-10分
    招聘满意度评价: Mapped[str] = mapped_column(Text)
    
    # 总结信息
    招聘总结: Mapped[str] = mapped_column(Text)  # 招聘过程总结
    存在的问题: Mapped[str] = mapped_column(Text)  # 存在的问题
    改进措施: Mapped[str] = mapped_column(Text)  # 改进措施
    
    # 负责人信息
    招聘负责人: Mapped[str] = mapped_column(String(50))
    审核人: Mapped[str] = mapped_column(String(50))
    
    # 时间戳
    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp())
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp())
    
    # 备注
    备注: Mapped[str] = mapped_column(Text)

    __table_args__ = (
        UniqueConstraint("神殿", "岗位名称", "计划招聘时间", name="uq_神殿教化司招聘_神殿_岗位_时间"),
        # Index 移至 _migrate() 中手动创建，避免重复定义导致 DuplicateTable 错误
        Index("idx_神殿教化司招聘_神殿", "神殿"),
        Index("idx_神殿教化司招聘_岗位", "岗位名称"),
        Index("idx_神殿教化司招聘_时间", "计划招聘时间"),
        {"schema": "teaching_quality", "extend_existing": True},
    )

def _ensure_extra_columns():
    """确保新增列存在（入职者姓名、离职人数、离职者姓名）
    使用 engine.begin() 保证 DDL 自动提交，避免回滚导致列未创建。
    """
    from sqlalchemy import text as sql_text  # 避免命名冲突
    with engine.begin() as conn:  # 自动提交事务
        # information_schema 查询
        exists_sql = sql_text(
            """
            SELECT column_name FROM information_schema.columns
            WHERE table_schema = 'teaching_quality' AND table_name = :tbl
            """
        )
        rows = conn.execute(exists_sql, {"tbl": "神殿教化司招聘计划与总结汇总表"}).fetchall()
        cols = {r[0] for r in rows}
        # 逐列新增
        if '入职者姓名' not in cols:
            try:
                conn.execute(sql_text('ALTER TABLE teaching_quality."神殿教化司招聘计划与总结汇总表" ADD COLUMN "入职者姓名" TEXT'))
            except Exception:
                pass
        if '离职人数' not in cols:
            try:
                conn.execute(sql_text('ALTER TABLE teaching_quality."神殿教化司招聘计划与总结汇总表" ADD COLUMN "离职人数" INTEGER DEFAULT 0'))
            except Exception:
                pass
        if '离职者姓名' not in cols:
            try:
                conn.execute(sql_text('ALTER TABLE teaching_quality."神殿教化司招聘计划与总结汇总表" ADD COLUMN "离职者姓名" TEXT'))
            except Exception:
                pass
        if '实际招聘岗位名称' not in cols:
            try:
                conn.execute(sql_text('ALTER TABLE teaching_quality."神殿教化司招聘计划与总结汇总表" ADD COLUMN "实际招聘岗位名称" VARCHAR(100)'))
            except Exception:
                pass

def _migrate():
    """数据库迁移函数"""
    from app.core.database import _tq_batch_migrated
    if _tq_batch_migrated:
        return
    ensure_teaching_quality_schema()
    AccountBase.metadata.create_all(
        bind=engine,
        tables=[cast(Table, 神殿教化司招聘计划与总结汇总表.__table__)],
    )
    _ensure_extra_columns()

def init_db_table():
    """初始化表"""
    _migrate()

def fetch_recruitment_list(
    db: Session,
    campus: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
) -> List[神殿教化司招聘计划与总结汇总表]:
    """
    获取招聘计划列表
    
    Args:
        db: 数据库会话
        campus: 神殿（可选）
        start_date: 开始日期（可选）
        end_date: 结束日期（可选）
    
    Returns:
        招聘计划列表
    """
    q = db.query(神殿教化司招聘计划与总结汇总表)
    
    if campus:
        norm = str(campus).strip()
        norm2 = norm.replace("神殿", "") if "神殿" in norm else norm
        from sqlalchemy import or_
        q = q.filter(
            or_(
                神殿教化司招聘计划与总结汇总表.神殿 == norm,
                神殿教化司招聘计划与总结汇总表.神殿 == norm2,
                神殿教化司招聘计划与总结汇总表.神殿.ilike(f"{norm}%"),
                神殿教化司招聘计划与总结汇总表.神殿.ilike(f"{norm2}%"),
            )
        )
    
    if start_date:
        q = q.filter(神殿教化司招聘计划与总结汇总表.计划招聘时间 >= start_date)
    
    if end_date:
        q = q.filter(神殿教化司招聘计划与总结汇总表.计划招聘时间 <= end_date)
    
    return q.order_by(
        神殿教化司招聘计划与总结汇总表.神殿,
        神殿教化司招聘计划与总结汇总表.计划招聘时间.desc()
    ).all()

def get_recruitment_by_id(
    db: Session,
    recruitment_id: int
) -> Optional[神殿教化司招聘计划与总结汇总表]:
    """按ID获取招聘计划"""
    return db.query(神殿教化司招聘计划与总结汇总表).filter(
        神殿教化司招聘计划与总结汇总表.id == recruitment_id
    ).first()

def get_recruitment_by_campus_and_position(
    db: Session,
    campus: str,
    position_name: str,
    plan_date: Optional[date] = None
) -> Optional[神殿教化司招聘计划与总结汇总表]:
    """按神殿+岗位名称获取招聘计划"""
    norm = str(campus).strip()
    norm2 = norm.replace("神殿", "") if "神殿" in norm else norm
    from sqlalchemy import or_
    
    q = db.query(神殿教化司招聘计划与总结汇总表).filter(
        神殿教化司招聘计划与总结汇总表.岗位名称 == position_name,
        or_(
            神殿教化司招聘计划与总结汇总表.神殿 == norm,
            神殿教化司招聘计划与总结汇总表.神殿 == norm2,
            神殿教化司招聘计划与总结汇总表.神殿.ilike(f"{norm}%"),
            神殿教化司招聘计划与总结汇总表.神殿.ilike(f"{norm2}%"),
        ),
    )
    
    if plan_date:
        q = q.filter(神殿教化司招聘计划与总结汇总表.计划招聘时间 == plan_date)
    
    return q.first()

def create_recruitment(
    db: Session,
    recruitment_info: Dict[str, Any]
) -> 神殿教化司招聘计划与总结汇总表:
    """创建招聘计划。如果同一(神殿, 岗位名称, 计划招聘时间)已存在，则改为更新并返回最新记录。"""
    try:
        _ensure_extra_columns()
    except Exception:
        pass

    campus = recruitment_info.get("神殿")
    position = recruitment_info.get("岗位名称")
    plan_date = recruitment_info.get("计划招聘时间")

    # 先查重，存在则更新（幂等）
    if isinstance(campus, str) and isinstance(position, str) and isinstance(plan_date, date):
        existed = get_recruitment_by_campus_and_position(db, campus, position, plan_date)
        if existed:
            for k, v in recruitment_info.items():
                if k in ("id", "创建时间", "更新时间"):
                    continue
                if hasattr(existed, k):
                    setattr(existed, k, v)
            db.commit()
            db.refresh(existed)
            return existed

    # 不存在则创建
    new_recruitment = 神殿教化司招聘计划与总结汇总表(**recruitment_info)
    db.add(new_recruitment)
    try:
        db.commit()
    except IntegrityError:
        # 并发或遗漏导致唯一冲突，回滚后按查重进行更新
        db.rollback()
        if not (isinstance(campus, str) and isinstance(position, str)):
            raise
        date_filter = plan_date if isinstance(plan_date, date) else None
        existed = get_recruitment_by_campus_and_position(db, campus, position, date_filter)
        if not existed:
            raise
        for k, v in recruitment_info.items():
            if k in ("id", "创建时间", "更新时间"):
                continue
            if hasattr(existed, k):
                setattr(existed, k, v)
        db.commit()
        db.refresh(existed)
        return existed

    db.refresh(new_recruitment)
    return new_recruitment

def update_recruitment(
    db: Session,
    recruitment_id: int,
    updates: Dict[str, Any]
) -> Optional[神殿教化司招聘计划与总结汇总表]:
    """更新招聘计划"""
    db_recruitment = get_recruitment_by_id(db, recruitment_id)
    if db_recruitment:
        for key, value in updates.items():
            if hasattr(db_recruitment, key):
                setattr(db_recruitment, key, value)
        db.commit()
        db.refresh(db_recruitment)
    return db_recruitment

def delete_recruitment(
    db: Session,
    recruitment_id: int
) -> bool:
    """删除招聘计划"""
    db_recruitment = get_recruitment_by_id(db, recruitment_id)
    if db_recruitment:
        db.delete(db_recruitment)
        db.commit()
        return True
    return False

def get_recruitment_statistics(
    db: Session,
    campus: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
) -> Dict[str, Any]:
    """
    获取招聘统计数据
    
    Args:
        db: 数据库会话
        campus: 神殿（可选）
        start_date: 开始日期（可选）
        end_date: 结束日期（可选）
    
    Returns:
        统计数据字典
    """
    from sqlalchemy import func as sql_func
    
    q = db.query(神殿教化司招聘计划与总结汇总表)
    
    if campus:
        norm = str(campus).strip()
        norm2 = norm.replace("神殿", "") if "神殿" in norm else norm
        from sqlalchemy import or_
        q = q.filter(
            or_(
                神殿教化司招聘计划与总结汇总表.神殿 == norm,
                神殿教化司招聘计划与总结汇总表.神殿 == norm2,
                神殿教化司招聘计划与总结汇总表.神殿.ilike(f"{norm}%"),
                神殿教化司招聘计划与总结汇总表.神殿.ilike(f"{norm2}%"),
            )
        )
    
    if start_date:
        q = q.filter(神殿教化司招聘计划与总结汇总表.计划招聘时间 >= start_date)
    
    if end_date:
        q = q.filter(神殿教化司招聘计划与总结汇总表.计划招聘时间 <= end_date)
    
    # 计算统计数据
    stats = db.query(
        sql_func.count(神殿教化司招聘计划与总结汇总表.id).label("总招聘数"),
        sql_func.sum(神殿教化司招聘计划与总结汇总表.计划招聘人数).label("计划招聘总人数"),
        sql_func.sum(神殿教化司招聘计划与总结汇总表.实际招聘人数).label("实际招聘总人数"),
        sql_func.sum(神殿教化司招聘计划与总结汇总表.应聘人数).label("总应聘人数"),
        sql_func.sum(神殿教化司招聘计划与总结汇总表.面试人数).label("总面试人数"),
        sql_func.sum(神殿教化司招聘计划与总结汇总表.录用人数).label("总录用人数"),
        sql_func.avg(神殿教化司招聘计划与总结汇总表.录用率).label("平均录用率"),
        sql_func.sum(神殿教化司招聘计划与总结汇总表.招聘成本).label("总招聘成本"),
        sql_func.avg(神殿教化司招聘计划与总结汇总表.人均成本).label("平均人均成本"),
        sql_func.avg(神殿教化司招聘计划与总结汇总表.招聘满意度评分).label("平均满意度评分"),
    ).filter(*[f for f in [
        神殿教化司招聘计划与总结汇总表.神殿 == campus if campus else None,
        神殿教化司招聘计划与总结汇总表.计划招聘时间 >= start_date if start_date else None,
        神殿教化司招聘计划与总结汇总表.计划招聘时间 <= end_date if end_date else None,
    ] if f is not None]).first()

    if stats is None:
        return {
            "总招聘数": 0,
            "计划招聘总人数": 0.0,
            "实际招聘总人数": 0.0,
            "总应聘人数": 0.0,
            "总面试人数": 0.0,
            "总录用人数": 0.0,
            "平均录用率": 0.0,
            "总招聘成本": 0.0,
            "平均人均成本": 0.0,
            "平均满意度评分": 0.0,
        }

    return {
        "总招聘数": stats[0] or 0,
        "计划招聘总人数": float(stats[1] or 0),
        "实际招聘总人数": float(stats[2] or 0),
        "总应聘人数": float(stats[3] or 0),
        "总面试人数": float(stats[4] or 0),
        "总录用人数": float(stats[5] or 0),
        "平均录用率": float(stats[6] or 0),
        "总招聘成本": float(stats[7] or 0),
        "平均人均成本": float(stats[8] or 0),
        "平均满意度评分": float(stats[9] or 0),
    }

