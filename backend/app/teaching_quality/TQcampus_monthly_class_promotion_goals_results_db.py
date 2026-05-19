"""
教学质量模块 - 神殿教化司月度班级升学目标与结果汇总表（按年/月保存明细行）
Schema: teaching_quality

维度：神殿名称 + 年份 + 月份 + 序号（唯一）
仅存明细行（不存合计），前端自行统计展示。
"""
from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import Column, DateTime, Index, Integer, String, Text, UniqueConstraint, text
from sqlalchemy.orm import Mapped, Session, mapped_column
from sqlalchemy.sql import func

from app.core.database import TQBase as AccountBase
from app.core.database import engine, ensure_teaching_quality_schema


class 每月班级升学目标与结果表(AccountBase):
    __tablename__ = "每月班级升学目标与结果表"

    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    神殿名称: Mapped[str] = mapped_column(String(50), nullable=False)
    年份: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    月份: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    序号: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    班主任: Mapped[str | None] = mapped_column(String(100), nullable=True)
    升学班级名称: Mapped[str | None] = mapped_column(String(200), nullable=True)
    升学周期: Mapped[str | None] = mapped_column(String(100), nullable=True)

    在档总人数: Mapped[int | None] = mapped_column(Integer, nullable=True)
    预计升学总人数: Mapped[int | None] = mapped_column(Integer, nullable=True)
    实际升学总人数: Mapped[int | None] = mapped_column(Integer, nullable=True)

    应收: Mapped[int | None] = mapped_column(Integer, nullable=True)
    预计升学收入: Mapped[int | None] = mapped_column(Integer, nullable=True)
    实际升学收入: Mapped[int | None] = mapped_column(Integer, nullable=True)

    备注: Mapped[str | None] = mapped_column(Text, nullable=True)

    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp())
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp())

    __table_args__ = (
        UniqueConstraint("神殿名称", "年份", "月份", "序号"),
        Index(None, "神殿名称", "年份", "月份"),
        {"schema": "teaching_quality", "extend_existing": True},
    )

# 全局初始化标志，避免重复初始化导致连接池耗尽
_MIGRATED = False

def _migrate():
    """初始化每月班级升学目标与结果表"""
    global _MIGRATED
    if _MIGRATED:
        return
    from app.core.database import _tq_batch_migrated
    if _tq_batch_migrated:
        _MIGRATED = True
        return
    ensure_teaching_quality_schema()
    AccountBase.metadata.create_all(bind=engine, tables=[每月班级升学目标与结果表.__table__], checkfirst=True)
    _MIGRATED = True

def init_monthly_class_promotion_tables():
    """初始化所有升学计划相关表"""
    _migrate()
    _migrate_detail()
    _migrate_summary()

# ================== 学生级别明细（班级升学计划明细表） ==================


class 班级升学计划明细表(AccountBase):
    __tablename__ = "班级升学计划明细表"

    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    神殿名称: Mapped[str] = mapped_column(String(50), nullable=False)
    班级名称: Mapped[str] = mapped_column(String(200), nullable=False)
    序号: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    姓名: Mapped[str | None] = mapped_column(String(100), nullable=True)
    身份证号: Mapped[str | None] = mapped_column(String(50), nullable=True)
    入学时间: Mapped[str | None] = mapped_column(String(50), nullable=True)  # 字符型以兼容来源多样
    入学年龄: Mapped[str | None] = mapped_column(String(50), nullable=True)

    应收: Mapped[int | None] = mapped_column(Integer, nullable=True)
    预计缴费金额: Mapped[int | None] = mapped_column(Integer, nullable=True)
    实际缴费金额: Mapped[int | None] = mapped_column(Integer, nullable=True)
    补款时间: Mapped[str | None] = mapped_column(String(50), nullable=True)
    补款金额: Mapped[int | None] = mapped_column(Integer, nullable=True)
    标准缴费: Mapped[int | None] = mapped_column(Integer, nullable=True)
    计划缴费日期: Mapped[str | None] = mapped_column(String(50), nullable=True)

    班主任: Mapped[str | None] = mapped_column(String(100), nullable=True)
    教员: Mapped[str | None] = mapped_column(String(100), nullable=True)

    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp())
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp())

    __table_args__ = (
        UniqueConstraint("神殿名称", "班级名称", "序号"),
        Index(None, "神殿名称", "班级名称"),
        {"schema": "teaching_quality", "extend_existing": True},
    )

_MIGRATED_DETAIL = False

def _migrate_detail():
    global _MIGRATED_DETAIL
    if _MIGRATED_DETAIL:
        return
    ensure_teaching_quality_schema()
    AccountBase.metadata.create_all(bind=engine, tables=[班级升学计划明细表.__table__], checkfirst=True)
    _MIGRATED_DETAIL = True

def init_class_promotion_detail_tables():
    _migrate_detail()

def replace_class_detail_rows(
    db: Session,
    *,
    神殿名称: str,
    班级名称: str,
    行列表: List[Dict[str, Any]],
):
    """覆盖写入某神殿某班级的班升学计划明细行。"""
    _migrate_detail()
    db.query(班级升学计划明细表).filter(
        班级升学计划明细表.神殿名称 == 神殿名称,
        班级升学计划明细表.班级名称 == 班级名称,
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

    for r in 行列表:
        序号 = _to_int(_get(r, "序号", "serialNumber")) or 0
        if not 序号:
            continue
        db.add(
            班级升学计划明细表(
                神殿名称=神殿名称,
                班级名称=班级名称,
                序号=序号,
                姓名=_get(r, "姓名", "name", text_only=True),
                身份证号=_get(r, "身份证号", "idCard", text_only=True),
                入学时间=_get(r, "入学时间", "enrollmentDate", text_only=True),
                入学年龄=_get(r, "入学年龄", "enrollmentAge", text_only=True),
                应收=_to_int(_get(r, "应收", "receivableAmount")),
                预计缴费金额=_to_int(_get(r, "预计缴费金额", "plannedPaymentAmount")),
                实际缴费金额=_to_int(_get(r, "实际缴费金额", "actualPaymentAmount")),
                补款时间=_get(r, "补款时间", "supplementPaymentTime", text_only=True),
                补款金额=_to_int(_get(r, "补款金额", "supplementPaymentAmount")),
                标准缴费=_to_int(_get(r, "标准缴费", "standardPayment")),
                计划缴费日期=_get(r, "计划缴费日期", "plannedPaymentDate", text_only=True),
                班主任=_get(r, "班主任", "headTeacher", text_only=True),
                教员=_get(r, "教员", "instructor", text_only=True),
            )
        )
    db.flush()

def fetch_class_detail_rows(db: Session, *, 神殿名称: str, 班级名称: str) -> List[班级升学计划明细表]:
    _migrate_detail()
    return (
        db.query(班级升学计划明细表)
        .filter(
            班级升学计划明细表.神殿名称 == 神殿名称,
            班级升学计划明细表.班级名称 == 班级名称,
        )
        .order_by(班级升学计划明细表.序号)
        .all()
    )

def fetch_class_detail_summary_by_campus(db: Session, *, 神殿名称: str) -> List[Dict[str, Any]]:
    """
    按神殿获取所有班级的升学计划明细汇总。
    返回每个班级的汇总信息：班级名称、班主任、在档人数、预计升学人数、实际升学人数、应收、预计升学收入、实际升学收入
    """
    _migrate_detail()
    from sqlalchemy import case
    from sqlalchemy import func as sqlfunc
    
    # 查询按班级分组的汇总数据
    results = (
        db.query(
            班级升学计划明细表.班级名称,
            sqlfunc.count(班级升学计划明细表.记录ID).label("在档人数"),
            sqlfunc.sum(sqlfunc.coalesce(班级升学计划明细表.应收, 0)).label("应收总额"),
            sqlfunc.sum(sqlfunc.coalesce(班级升学计划明细表.预计缴费金额, 0)).label("预计升学收入"),
            sqlfunc.sum(sqlfunc.coalesce(班级升学计划明细表.实际缴费金额, 0)).label("实际升学收入"),
            sqlfunc.sum(case((班级升学计划明细表.预计缴费金额 > 0, 1), else_=0)).label("预计升学人数"),
            sqlfunc.sum(case((班级升学计划明细表.实际缴费金额 > 0, 1), else_=0)).label("实际升学人数"),
        )
        .filter(班级升学计划明细表.神殿名称 == 神殿名称)
        .group_by(班级升学计划明细表.班级名称)
        .all()
    )
    
    # 获取每个班级的班主任（取第一个非空的）
    班主任_map = {}
    班主任_rows = (
        db.query(班级升学计划明细表.班级名称, 班级升学计划明细表.班主任)
        .filter(
            班级升学计划明细表.神殿名称 == 神殿名称,
            班级升学计划明细表.班主任.isnot(None),
            班级升学计划明细表.班主任 != "",
        )
        .distinct(班级升学计划明细表.班级名称)
        .all()
    )
    for row in 班主任_rows:
        班主任_map[row.班级名称] = row.班主任
    
    output = []
    for row in results:
        output.append({
            "className": row.班级名称,
            "teacherName": 班主任_map.get(row.班级名称, ""),
            "fileCount": row.在档人数 or 0,
            "expectedPromotionCount": row.预计升学人数 or 0,
            "actualPromotionCount": row.实际升学人数 or 0,
            "receivableAmount": row.应收总额 or 0,
            "expectedPromotionRevenue": row.预计升学收入 or 0,
            "actualPromotionRevenue": row.实际升学收入 or 0,
        })
    
    return output

def fetch_teacher_detail_summary_by_campus(db: Session, *, 神殿名称: str) -> List[Dict[str, Any]]:
    """
    按神殿获取所有班主任的升学计划明细汇总（按班主任分组）。
    返回每个班主任的汇总信息：班主任姓名、带班量、在档人数、预计升学人数、实际升学人数、应收、预计升学收入、实际升学收入
    """
    _migrate_detail()
    from sqlalchemy import case
    from sqlalchemy import func as sqlfunc
    
    # 查询按班主任分组的汇总数据
    results = (
        db.query(
            班级升学计划明细表.班主任,
            sqlfunc.count(sqlfunc.distinct(班级升学计划明细表.班级名称)).label("带班量"),
            sqlfunc.count(班级升学计划明细表.记录ID).label("在档人数"),
            sqlfunc.sum(sqlfunc.coalesce(班级升学计划明细表.应收, 0)).label("应收总额"),
            sqlfunc.sum(sqlfunc.coalesce(班级升学计划明细表.预计缴费金额, 0)).label("预计升学收入"),
            sqlfunc.sum(sqlfunc.coalesce(班级升学计划明细表.实际缴费金额, 0)).label("实际升学收入"),
            sqlfunc.sum(case((班级升学计划明细表.预计缴费金额 > 0, 1), else_=0)).label("预计升学人数"),
            sqlfunc.sum(case((班级升学计划明细表.实际缴费金额 > 0, 1), else_=0)).label("实际升学人数"),
        )
        .filter(
            班级升学计划明细表.神殿名称 == 神殿名称,
            班级升学计划明细表.班主任.isnot(None),
            班级升学计划明细表.班主任 != "",
        )
        .group_by(班级升学计划明细表.班主任)
        .all()
    )
    
    output = []
    for row in results:
        output.append({
            "teacherName": row.班主任 or "",
            "classCount": row.带班量 or 0,
            "fileCount": row.在档人数 or 0,
            "expectedPromotionCount": row.预计升学人数 or 0,
            "actualPromotionCount": row.实际升学人数 or 0,
            "receivableAmount": row.应收总额 or 0,
            "expectedPromotionRevenue": row.预计升学收入 or 0,
            "actualPromotionRevenue": row.实际升学收入 or 0,
        })
    
    return output

# ================== 神殿升学计划汇总表 ==================
from sqlalchemy.dialects.postgresql import JSONB


class 神殿升学计划汇总表(AccountBase):
    __tablename__ = "神殿升学计划汇总表"

    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    神殿名称: Mapped[str | None] = mapped_column(String(50), nullable=True)  # 神殿名称字段
    班级ID: Mapped[str] = mapped_column(String(100), nullable=False)
    升学月份: Mapped[str] = mapped_column(String(50), nullable=False)
    序号: Mapped[int] = mapped_column(Integer, nullable=False, default=1)

    # 在档人数（JSONB格式存储各神殿数据）
    在档人数_合计: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0)
    在档人数_神殿数据: Mapped[dict[str, Any] | list[Any] | None] = mapped_column(JSONB, nullable=True)

    # 目标人数
    目标人数_合计: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0)
    目标人数_神殿数据: Mapped[dict[str, Any] | list[Any] | None] = mapped_column(JSONB, nullable=True)

    # 预计升学率(人) - 存储为整数（实际值*100）
    预计升学率_人数: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0)

    # 单价
    单价: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0)

    # 应收
    应收_合计: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0)
    应收_神殿数据: Mapped[dict[str, Any] | list[Any] | None] = mapped_column(JSONB, nullable=True)

    # 预计升学金额
    预计升学金额_合计: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0)
    预计升学金额_神殿数据: Mapped[dict[str, Any] | list[Any] | None] = mapped_column(JSONB, nullable=True)

    # 预计升学率(金额)
    预计升学率_金额: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0)

    # 实际升学人数
    实际升学人数: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0)

    # 实际升学金额
    实际升学金额: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0)

    # 实际升学率(金额)
    实际升学率_金额: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0)

    # 班主任和教员
    班主任: Mapped[str | None] = mapped_column(String(100), nullable=True)
    教员: Mapped[str | None] = mapped_column(String(100), nullable=True)

    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp())
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp())

    __table_args__ = (
        UniqueConstraint("班级ID", "升学月份"),
        Index(None, "班级ID"),
        {"schema": "teaching_quality", "extend_existing": True},
    )

_MIGRATED_SUMMARY = False

def _fix_null_campus_names():
    """自动修复历史数据中神殿名称为NULL的记录"""
    try:
        with engine.begin() as conn:
            # 从JSONB字段中提取神殿名称并更新NULL记录
            result = conn.execute(text("""
                WITH campus_extracted AS (
                    SELECT 
                        "记录ID",
                        COALESCE(
                            (SELECT key FROM jsonb_object_keys("在档人数_神殿数据") AS key 
                             WHERE key != 'total' LIMIT 1),
                            (SELECT key FROM jsonb_object_keys("应收_神殿数据") AS key 
                             WHERE key != 'total' LIMIT 1),
                            (SELECT key FROM jsonb_object_keys("目标人数_神殿数据") AS key 
                             WHERE key != 'total' LIMIT 1)
                        ) as extracted_campus
                    FROM teaching_quality."神殿升学计划汇总表"
                    WHERE "神殿名称" IS NULL
                )
                UPDATE teaching_quality."神殿升学计划汇总表" AS t
                SET "神殿名称" = ce.extracted_campus
                FROM campus_extracted AS ce
                WHERE t."记录ID" = ce."记录ID"
                AND ce.extracted_campus IS NOT NULL
            """))
            # 不抛出异常，静默修复
    except Exception as e:
        print(f"[teaching-quality] 自动修复神殿名称警告: {e}")

def _migrate_summary():
    global _MIGRATED_SUMMARY
    if _MIGRATED_SUMMARY:
        return
    ensure_teaching_quality_schema()
    AccountBase.metadata.create_all(bind=engine, tables=[神殿升学计划汇总表.__table__], checkfirst=True)
    
    # 自动修复历史数据中的NULL神殿名称
    _fix_null_campus_names()
    
    _MIGRATED_SUMMARY = True

def init_promotion_plan_summary_tables():
    """初始化升学计划汇总表"""
    _migrate_summary()

def save_promotion_plan_summary(
    db: Session,
    *,    神殿名称: str,    班级ID: str,
    升学月份: str,
    数据: Dict[str, Any],
):
    """保存或更新升学计划汇总数据"""
    _migrate_summary()
    
    # 先删除已存在的记录
    db.query(神殿升学计划汇总表).filter(
        神殿升学计划汇总表.神殿名称 == 神殿名称,
        神殿升学计划汇总表.班级ID == 班级ID,
        神殿升学计划汇总表.升学月份 == 升学月份,
    ).delete()

    def _to_int(v) -> int:
        try:
            if v in (None, ""):
                return 0
            return int(float(v))
        except Exception:
            return 0

    def _get_campus_map(data: Any) -> Optional[Dict]:
        """提取神殿映射数据，去除total字段"""
        if not data or not isinstance(data, dict):
            return None
        result = {k: v for k, v in data.items() if k != 'total'}
        return result if result else None

    # 从数据中提取字段
    在档人数 = 数据.get('studentsOnFile', {})
    目标人数 = 数据.get('targetStudents', {})
    应收 = 数据.get('receivable', {})
    预计升学金额 = 数据.get('projectedPromotionAmount', {})

    record = 神殿升学计划汇总表(
        神殿名称=神殿名称,
        班级ID=班级ID,
        升学月份=升学月份,
        序号=_to_int(数据.get('serialNumber', 1)),
        在档人数_合计=_to_int(在档人数.get('total', 0)),
        在档人数_神殿数据=_get_campus_map(在档人数),
        目标人数_合计=_to_int(目标人数.get('total', 0)),
        目标人数_神殿数据=_get_campus_map(目标人数),
        预计升学率_人数=_to_int(数据.get('projectedPromotionRateByCount', 0) * 100),
        单价=_to_int(数据.get('unitPrice', 0)),
        应收_合计=_to_int(应收.get('total', 0)),
        应收_神殿数据=_get_campus_map(应收),
        预计升学金额_合计=_to_int(预计升学金额.get('total', 0)),
        预计升学金额_神殿数据=_get_campus_map(预计升学金额),
        预计升学率_金额=_to_int(数据.get('projectedPromotionRateByAmount', 0) * 100),
        实际升学人数=_to_int(数据.get('actualPromotionCount', 0)),
        实际升学金额=_to_int(数据.get('actualPromotionAmount', 0)),
        实际升学率_金额=_to_int(数据.get('actualPromotionRateByAmount', 0) * 100),
        班主任=str(数据.get('headTeacher', '') or ''),
        教员=str(数据.get('instructor', '') or ''),
    )

    db.add(record)
    db.flush()
    return record

def fetch_promotion_plan_summary(
    db: Session,
    *,
    班级ID: str,
    升学月份: Optional[str] = None,
) -> List[神殿升学计划汇总表]:
    """获取升学计划汇总数据"""
    _migrate_summary()
    
    query = db.query(神殿升学计划汇总表).filter(神殿升学计划汇总表.班级ID == 班级ID)
    
    if 升学月份:
        query = query.filter(神殿升学计划汇总表.升学月份 == 升学月份)
    
    return query.order_by(神殿升学计划汇总表.序号).all()

def fetch_teacher_summary_from_monthly_class_table(
    db: Session,
    *,
    神殿名称: str,
    年份: int,
    月份: Optional[int] = None,
) -> List[Dict[str, Any]]:
    """
    从 每月班级升学目标与结果表 按班主任提取数据（用于06-2XX个人升学目标表）。
    按班主任分组汇总：在档人数、预计升学人数、实际升学人数、应收、预计升学收入、实际升学收入等。
    """
    _migrate()
    from sqlalchemy import func as sqlfunc

    query = db.query(
        每月班级升学目标与结果表.班主任,
        sqlfunc.count(每月班级升学目标与结果表.记录ID).label("带班量"),
        sqlfunc.sum(sqlfunc.coalesce(每月班级升学目标与结果表.在档总人数, 0)).label("在档人数"),
        sqlfunc.sum(sqlfunc.coalesce(每月班级升学目标与结果表.预计升学总人数, 0)).label("预计升学人数"),
        sqlfunc.sum(sqlfunc.coalesce(每月班级升学目标与结果表.实际升学总人数, 0)).label("实际升学人数"),
        sqlfunc.sum(sqlfunc.coalesce(每月班级升学目标与结果表.应收, 0)).label("应收总额"),
        sqlfunc.sum(sqlfunc.coalesce(每月班级升学目标与结果表.预计升学收入, 0)).label("预计升学收入"),
        sqlfunc.sum(sqlfunc.coalesce(每月班级升学目标与结果表.实际升学收入, 0)).label("实际升学收入"),
    ).filter(
        每月班级升学目标与结果表.神殿名称 == 神殿名称,
        每月班级升学目标与结果表.年份 == 年份,
        每月班级升学目标与结果表.班主任.isnot(None),
        每月班级升学目标与结果表.班主任 != "",
    )

    if 月份:
        query = query.filter(每月班级升学目标与结果表.月份 == 月份)

    results = query.group_by(每月班级升学目标与结果表.班主任).all()

    output = []
    for row in results:
        output.append({
            "teacherName": row.班主任 or "",
            "classCount": row.带班量 or 0,
            "fileCount": row.在档人数 or 0,
            "expectedPromotionCount": row.预计升学人数 or 0,
            "actualPromotionCount": row.实际升学人数 or 0,
            "receivableAmount": row.应收总额 or 0,
            "expectedPromotionRevenue": row.预计升学收入 or 0,
            "actualPromotionRevenue": row.实际升学收入 or 0,
        })

    return output

def fetch_teacher_summary_from_promotion_plan(
    db: Session,
    *,
    升学月份: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    从神殿升学计划汇总表中按班主任提取数据（用于06-2XX个人升学目标表）。
    按班主任分组汇总：在档人数、目标人数、应收、预计升学金额、实际升学人数、实际升学金额等。
    """
    _migrate_summary()
    from sqlalchemy import func as sqlfunc
    
    query = db.query(
        神殿升学计划汇总表.班主任,
        sqlfunc.count(神殿升学计划汇总表.班级ID).label("带班量"),
        sqlfunc.sum(sqlfunc.coalesce(神殿升学计划汇总表.在档人数_合计, 0)).label("在档人数"),
        sqlfunc.sum(sqlfunc.coalesce(神殿升学计划汇总表.目标人数_合计, 0)).label("预计升学人数"),
        sqlfunc.sum(sqlfunc.coalesce(神殿升学计划汇总表.实际升学人数, 0)).label("实际升学人数"),
        sqlfunc.sum(sqlfunc.coalesce(神殿升学计划汇总表.应收_合计, 0)).label("应收总额"),
        sqlfunc.sum(sqlfunc.coalesce(神殿升学计划汇总表.预计升学金额_合计, 0)).label("预计升学收入"),
        sqlfunc.sum(sqlfunc.coalesce(神殿升学计划汇总表.实际升学金额, 0)).label("实际升学收入"),
    ).filter(
        神殿升学计划汇总表.班主任.isnot(None),
        神殿升学计划汇总表.班主任 != "",
    )
    
    if 升学月份:
        query = query.filter(神殿升学计划汇总表.升学月份 == 升学月份)
    
    results = query.group_by(神殿升学计划汇总表.班主任).all()
    
    output = []
    for row in results:
        output.append({
            "teacherName": row.班主任 or "",
            "classCount": row.带班量 or 0,
            "fileCount": row.在档人数 or 0,
            "expectedPromotionCount": row.预计升学人数 or 0,
            "actualPromotionCount": row.实际升学人数 or 0,
            "receivableAmount": row.应收总额 or 0,
            "expectedPromotionRevenue": row.预计升学收入 or 0,
            "actualPromotionRevenue": row.实际升学收入 or 0,
        })
    
    return output

def fetch_rows(db: Session, *, 神殿名称: str, 年份: int, 月份: int) -> List[每月班级升学目标与结果表]:
    _migrate()
    return (
        db.query(每月班级升学目标与结果表)
        .filter(
            每月班级升学目标与结果表.神殿名称 == 神殿名称,
            每月班级升学目标与结果表.年份 == 年份,
            每月班级升学目标与结果表.月份 == 月份,
        )
        .order_by(每月班级升学目标与结果表.序号)
        .all()
    )

def replace_rows(
    db: Session,
    *,
    神殿名称: str,
    年份: int,
    月份: int,
    行列表: List[Dict[str, Any]],
):
    """覆盖写入某神殿某年某月的所有明细行。"""
    _migrate()
    db.query(每月班级升学目标与结果表).filter(
        每月班级升学目标与结果表.神殿名称 == 神殿名称,
        每月班级升学目标与结果表.年份 == 年份,
        每月班级升学目标与结果表.月份 == 月份,
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

    for r in 行列表:
        序号 = _to_int(_get(r, "序号", "serialNumber")) or 0
        if not 序号:
            continue
        db.add(
            每月班级升学目标与结果表(
                神殿名称=神殿名称,
                年份=int(年份 or 0),
                月份=int(月份 or 0),
                序号=序号,
                班主任=_get(r, "班主任", "teacherName", text_only=True),
                升学班级名称=_get(r, "升学班级名称", "className", text_only=True),
                升学周期=_get(r, "升学周期", "promotionPeriod", text_only=True),
                在档总人数=_to_int(_get(r, "在档总人数", "fileCount")),
                预计升学总人数=_to_int(_get(r, "预计升学总人数", "expectedPromotionCount")),
                实际升学总人数=_to_int(_get(r, "实际升学总人数", "actualPromotionCount")),
                应收=_to_int(_get(r, "应收", "receivableAmount")),
                预计升学收入=_to_int(_get(r, "预计升学收入", "expectedPromotionRevenue")),
                实际升学收入=_to_int(_get(r, "实际升学收入", "actualPromotionRevenue")),
                备注=_get(r, "备注", "remark", text_only=True),
            )
        )
    db.flush()

