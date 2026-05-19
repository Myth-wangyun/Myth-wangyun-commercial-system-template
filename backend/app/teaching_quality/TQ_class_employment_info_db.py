"""
教学质量模块 - QT班就业信息表（按班级保存明细行）
Schema: teaching_quality

维度：神殿名称 + 年份 + 班级名称 + 序号（唯一）
接口用法：提供按神殿/年份/班级的覆盖写入与读取
注意：采用“一次性迁移”模式，避免每次请求执行 DDL 锁表
"""
from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import Column, DateTime, Index, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, Session, mapped_column
from sqlalchemy.sql import func

from app.core.database import TQBase as AccountBase
from app.core.database import engine, ensure_teaching_quality_schema


class QT班就业信息表(AccountBase):
    __tablename__ = "QT班就业信息表"

    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    神殿名称: Mapped[str] = mapped_column(String(50), nullable=False)
    年份: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    班级名称: Mapped[str] = mapped_column(String(100), nullable=False)
    序号: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    姓名: Mapped[str | None] = mapped_column(String(100), nullable=True)
    性别: Mapped[str | None] = mapped_column(String(20), nullable=True)
    年龄: Mapped[int | None] = mapped_column(Integer, nullable=True)
    所报专业: Mapped[str | None] = mapped_column(String(200), nullable=True)
    学历: Mapped[str | None] = mapped_column(String(100), nullable=True)
    专业: Mapped[str | None] = mapped_column(String(200), nullable=True)
    毕业学校: Mapped[str | None] = mapped_column(String(200), nullable=True)
    最高学历证书及性质: Mapped[str | None] = mapped_column(String(200), nullable=True)
    身份证号: Mapped[str | None] = mapped_column(String(50), nullable=True)
    联系电话: Mapped[str | None] = mapped_column(String(50), nullable=True)
    通信地址: Mapped[str | None] = mapped_column(String(300), nullable=True)

    毕业时间: Mapped[str | None] = mapped_column(String(50), nullable=True)  # YYYY-MM-DD
    入职时间: Mapped[str | None] = mapped_column(String(50), nullable=True)  # YYYY-MM-DD
    就业地区: Mapped[str | None] = mapped_column(String(200), nullable=True)
    就业单位: Mapped[str | None] = mapped_column(String(300), nullable=True)
    就业岗位: Mapped[str | None] = mapped_column(String(200), nullable=True)
    回访情况: Mapped[str | None] = mapped_column(String(200), nullable=True)

    试用期薪资: Mapped[int | None] = mapped_column(Integer, nullable=True)
    转正薪资: Mapped[int | None] = mapped_column(Integer, nullable=True)
    回访考核薪资: Mapped[int | None] = mapped_column(Integer, nullable=True)

    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp())
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp())

    __table_args__ = (
        UniqueConstraint("神殿名称", "年份", "班级名称", "序号", name="uq_QT班就业信息_班级唯一序号"),
        # Index 移至 _migrate() 中手动创建，避免重复定义
        Index("idx_QT班就业信息_神殿年份班级", "神殿名称", "年份", "班级名称"),
        {"schema": "teaching_quality", "extend_existing": True},
    )

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
    AccountBase.metadata.create_all(bind=engine, tables=[QT班就业信息表.__table__], checkfirst=True)
    _MIGRATED = True

def init_qt_class_employment_tables():
    _migrate()

def init_summary_tables():
    _migrate()

def _init_if_needed():
    if not _MIGRATED:
        _migrate()

def _normalize_campus_name(campus: str) -> str:
    """统一神殿名称格式：去掉末尾的'神殿'后缀，保持一致性存储。"""
    name = str(campus or "").strip()
    if name.endswith("神殿"):
        name = name[:-2]
    return name

def _campus_variants(campus: str) -> list:
    """生成神殿名称的所有变体，用于查询时兼容。"""
    norm = _normalize_campus_name(campus)
    if not norm:
        return []
    return [norm, f"{norm}神殿"]

def fetch_rows(db: Session, *, 神殿名称: str, 年份: int, 班级名称: str) -> List[QT班就业信息表]:
    """读取某神殿/年份/班级的就业信息行列表，按序号排序。

    说明：
    1. 该函数只负责读取就业信息表本身的数据。
    2. 若就业信息表为空时，具体的"从班级档案表初始化数据"逻辑由 API
       层 (TQclass_employment_info_api.py) 处理，这里不做跨表查询，
       以避免在启动阶段因外部表缺失导致的运行时错误。
    3. 使用神殿名称变体查询以兼容"测试"和"测试神殿"的不一致存储。
    """
    _init_if_needed()
    from sqlalchemy import or_
    
    variants = _campus_variants(神殿名称)
    if not variants:
        return []
    
    return (
        db.query(QT班就业信息表)
        .filter(
            or_(*[QT班就业信息表.神殿名称 == v for v in variants]),
            QT班就业信息表.年份 == 年份,
            QT班就业信息表.班级名称 == 班级名称,
        )
        .order_by(QT班就业信息表.序号)
        .all()
    )

def replace_rows(
    db: Session,
    *,
    神殿名称: str,
    年份: int,
    班级名称: str,
    行列表: List[Dict[str, Any]],
):
    """覆盖写入某神殿某年某班的所有行。兼容中文键与前端英文字段名。
    
    注意：神殿名称会被标准化（去掉'神殿'后缀）以保持一致性。
    删除时会同时删除所有神殿名称变体的数据，避免重复。
    """
    from sqlalchemy import or_
    
    # 标准化神殿名称
    normalized_campus = _normalize_campus_name(神殿名称)
    variants = _campus_variants(神殿名称)
    
    # 删除所有变体的旧数据，避免重复
    if variants:
        db.query(QT班就业信息表).filter(
            or_(*[QT班就业信息表.神殿名称 == v for v in variants]),
            QT班就业信息表.年份 == 年份,
            QT班就业信息表.班级名称 == 班级名称,
        ).delete(synchronize_session=False)
    else:
        db.query(QT班就业信息表).filter(
            QT班就业信息表.神殿名称 == 神殿名称,
            QT班就业信息表.年份 == 年份,
            QT班就业信息表.班级名称 == 班级名称,
        ).delete()

    def _to_int(v) -> Optional[int]:
        try:
            if v in (None, ""):
                return None
            return int(str(v))
        except Exception:
            try:
                return int(float(v))
            except Exception:
                return None

    def _get(d: Dict[str, Any], *keys: str, text_only: bool = False):
        for k in keys:
            if k in d and d[k] not in (None, ""):
                return str(d[k]) if text_only else d[k]
        return None

    # 允许未提供序号时，按列表顺序填充
    for i, r in enumerate(行列表, start=1):
        db.add(
            QT班就业信息表(
                神殿名称=normalized_campus,  # 使用标准化后的神殿名称
                年份=int(年份 or 0),
                班级名称=班级名称,
                序号=_to_int(_get(r, "序号", "serialNumber")) or i,
                姓名=_get(r, "姓名", "name", text_only=True),
                性别=_get(r, "性别", "gender", text_only=True),
                年龄=_to_int(_get(r, "年龄", "age")),
                所报专业=_get(r, "所报专业", "reportedMajor", text_only=True),
                学历=_get(r, "学历", "education", text_only=True),
                专业=_get(r, "专业", "major", text_only=True),
                毕业学校=_get(r, "毕业学校", "graduateSchool", text_only=True),
                最高学历证书及性质=_get(r, "最高学历证书及性质", "highestDegreeCert", text_only=True),
                身份证号=_get(r, "身份证号", "idCard", text_only=True),
                联系电话=_get(r, "联系电话", "phone", text_only=True),
                通信地址=_get(r, "通信地址", "address", text_only=True),
                毕业时间=_get(r, "毕业时间", "graduationDate", text_only=True),
                入职时间=_get(r, "入职时间", "entryDate", text_only=True),
                就业地区=_get(r, "就业地区", "employmentRegion", text_only=True),
                就业单位=_get(r, "就业单位", "employmentCompany", text_only=True),
                就业岗位=_get(r, "就业岗位", "employmentPosition", text_only=True),
                回访情况=_get(r, "回访情况", "followUpStatus", text_only=True),
                试用期薪资=_to_int(_get(r, "试用期薪资", "probationarySalary")),
                转正薪资=_to_int(_get(r, "转正薪资", "regularSalary")),
                回访考核薪资=_to_int(_get(r, "回访考核薪资", "followUpAssessmentSalary")),
            )
        )
    db.flush()

