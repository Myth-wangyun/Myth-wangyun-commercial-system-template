"""
教学质量模块 - QT班级薪资预估表
Schema: teaching_quality

说明：
- “考试成绩/项目成绩/答辩成绩/老师综合评价”为不固定字段，统一使用 JSONB 存储。
- 支持“维度配置”表，存放考试科目、项目/答辩列、教师列及 meta。

唯一维度：神殿名称 + 班级名称 + 年份 + 月份 + 序号（行表）
"""
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy import Column, DateTime, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, Session, mapped_column
from sqlalchemy.sql import func

from app.core.database import TQBase as AccountBase
from app.core.database import engine, ensure_teaching_quality_schema


class QT班级薪资预估表(AccountBase):
    __tablename__ = "QT班级薪资预估表"

    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    神殿名称: Mapped[str] = mapped_column(String(50), nullable=False)
    班级名称: Mapped[str] = mapped_column(String(100), nullable=False)
    年份: Mapped[int] = mapped_column(Integer, nullable=False)
    月份: Mapped[int] = mapped_column(Integer, nullable=False)
    序号: Mapped[int] = mapped_column(Integer, nullable=False)

    姓名: Mapped[str | None] = mapped_column(String(50), nullable=True)
    性别: Mapped[str | None] = mapped_column(String(10), nullable=True)
    出生年月: Mapped[str | None] = mapped_column(String(20), nullable=True)
    学历: Mapped[str | None] = mapped_column(String(50), nullable=True)
    专业: Mapped[str | None] = mapped_column(String(100), nullable=True)
    毕业学校: Mapped[str | None] = mapped_column(String(100), nullable=True)
    籍贯: Mapped[str | None] = mapped_column(String(100), nullable=True)

    QT专业名称: Mapped[str | None] = mapped_column(String(100), nullable=True)
    QT班主任姓名: Mapped[str | None] = mapped_column(String(50), nullable=True)
    QT强化教员姓名: Mapped[str | None] = mapped_column(String(50), nullable=True)

    QT考试成绩: Mapped[dict[str, Any] | list[Any] | None] = mapped_column(JSONB, nullable=True)      # 行维度 JSON（建议包含 scores）
    QT项目成绩: Mapped[dict[str, Any] | list[Any] | None] = mapped_column(JSONB, nullable=True)      # 行维度 JSON（建议包含 scores）
    QT答辩成绩: Mapped[dict[str, Any] | list[Any] | None] = mapped_column(JSONB, nullable=True)      # 行维度 JSON（建议包含 scores）
    QT老师综合评价: Mapped[dict[str, Any] | list[Any] | None] = mapped_column(JSONB, nullable=True)  # 行维度 JSON（evaluations: { teacherId: text }）

    出勤率: Mapped[int | None] = mapped_column(Integer, nullable=True)          # 百分比整数或小数*100
    课堂表现评价: Mapped[str | None] = mapped_column(Text, nullable=True)
    COT活动成绩: Mapped[int | None] = mapped_column(Integer, nullable=True)
    千分制: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # 旧的固定教师评价列（兼容保留）
    班主任评价: Mapped[str | None] = mapped_column(Text, nullable=True)
    教员闫梦雷评价: Mapped[str | None] = mapped_column(Text, nullable=True)
    教员杨再军评价: Mapped[str | None] = mapped_column(Text, nullable=True)
    教员伍瑶评价: Mapped[str | None] = mapped_column(Text, nullable=True)

    预估薪资: Mapped[str | None] = mapped_column(String(50), nullable=True)

    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp())
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp())

    __table_args__ = (
        UniqueConstraint("神殿名称", "班级名称", "年份", "月份", "序号", name="uq_QT薪资预估_维度序号"),
        # Index 移至 _migrate() 中手动创建，避免重复定义导致 DuplicateTable 错误
        Index("idx_QT薪资预估_维度", "神殿名称", "班级名称", "年份", "月份"),
        {"schema": "teaching_quality", "extend_existing": True},
    )

class QT班级薪资预估配置(AccountBase):
    __tablename__ = "QT班级薪资预估配置"

    配置ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    神殿名称: Mapped[str] = mapped_column(String(50), nullable=False)
    班级名称: Mapped[str] = mapped_column(String(100), nullable=False)
    年份: Mapped[int] = mapped_column(Integer, nullable=False)
    月份: Mapped[int] = mapped_column(Integer, nullable=False)

    考试科目: Mapped[dict[str, Any] | list[Any] | None] = mapped_column(JSONB, nullable=True)   # [{id,title}]
    项目列: Mapped[dict[str, Any] | list[Any] | None] = mapped_column(JSONB, nullable=True)     # [{id,title}]
    答辩列: Mapped[dict[str, Any] | list[Any] | None] = mapped_column(JSONB, nullable=True)     # [{id,title}]
    教师列: Mapped[dict[str, Any] | list[Any] | None] = mapped_column(JSONB, nullable=True)     # [{id,title}]
    元信息: Mapped[dict[str, Any] | list[Any] | None] = mapped_column(JSONB, nullable=True)     # { majorName, homeroomTeacher, reinforcementTeacher, ... }

    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp())

    __table_args__ = (
        UniqueConstraint("神殿名称", "班级名称", "年份", "月份", name="uq_QT薪资预估_配置维度"),
        {"schema": "teaching_quality", "extend_existing": True},
    )

def _migrate_columns():

    # 配置表
    with engine.begin() as conn:
        try:
            AccountBase.metadata.create_all(bind=engine, tables=[QT班级薪资预估配置.__table__])
        except Exception as e:
            print(f"[QT薪资预估] 配置表创建警告: {e}")

def _migrate():
    from app.core.database import _tq_batch_migrated
    if _tq_batch_migrated:
        return
    ensure_teaching_quality_schema()
    AccountBase.metadata.create_all(bind=engine, tables=[QT班级薪资预估表.__table__])
    _migrate_columns()

def init_qt_salary_estimate_tables():
    _migrate()

def fetch_qt_salary_rows(
    db: Session, *, 神殿名称: str, 班级名称: str, 年份: int, 月份: int
) -> List[QT班级薪资预估表]:
    _migrate()
    return (
        db.query(QT班级薪资预估表)
        .filter(
            QT班级薪资预估表.神殿名称 == 神殿名称,
            QT班级薪资预估表.班级名称 == 班级名称,
            QT班级薪资预估表.年份 == 年份,
            QT班级薪资预估表.月份 == 月份,
        )
        .order_by(QT班级薪资预估表.序号)
        .all()
    )

def _upsert_config(
    db: Session,
    *,
    神殿名称: str,
    班级名称: str,
    年份: int,
    月份: int,
    考试科目: Optional[List[Dict[str, Any]]] = None,
    项目列: Optional[List[Dict[str, Any]]] = None,
    答辩列: Optional[List[Dict[str, Any]]] = None,
    教师列: Optional[List[Dict[str, Any]]] = None,
    元信息: Optional[Dict[str, Any]] = None,
):
    _migrate()
    cfg = (
        db.query(QT班级薪资预估配置)
        .filter(
            QT班级薪资预估配置.神殿名称 == 神殿名称,
            QT班级薪资预估配置.班级名称 == 班级名称,
            QT班级薪资预估配置.年份 == 年份,
            QT班级薪资预估配置.月份 == 月份,
        )
        .first()
    )
    if cfg:
        if 考试科目 is not None:
            cfg.考试科目 = 考试科目
        if 项目列 is not None:
            cfg.项目列 = 项目列
        if 答辩列 is not None:
            cfg.答辩列 = 答辩列
        if 教师列 is not None:
            cfg.教师列 = 教师列
        if 元信息 is not None:
            cfg.元信息 = 元信息
    else:
        cfg = QT班级薪资预估配置(
            神殿名称=神殿名称,
            班级名称=班级名称,
            年份=年份,
            月份=月份,
            考试科目=考试科目,
            项目列=项目列,
            答辩列=答辩列,
            教师列=教师列,
            元信息=元信息,
        )
        db.add(cfg)
    db.flush()

def _fetch_config(
    db: Session, *, 神殿名称: str, 班级名称: str, 年份: int, 月份: int
) -> Optional[QT班级薪资预估配置]:
    _migrate()
    return (
        db.query(QT班级薪资预估配置)
        .filter(
            QT班级薪资预估配置.神殿名称 == 神殿名称,
            QT班级薪资预估配置.班级名称 == 班级名称,
            QT班级薪资预估配置.年份 == 年份,
            QT班级薪资预估配置.月份 == 月份,
        )
        .first()
    )

def replace_qt_salary_rows(
    db: Session,
    *,
    神殿名称: str,
    班级名称: str,
    年份: int,
    月份: int,
    行列表: List[Dict[str, Any]],
):
    """兼容旧结构：覆盖写入指定维度的明细行（行里直接带三个JSON）。"""
    _migrate()
    db.query(QT班级薪资预估表).filter(
        QT班级薪资预估表.神殿名称 == 神殿名称,
        QT班级薪资预估表.班级名称 == 班级名称,
        QT班级薪资预估表.年份 == 年份,
        QT班级薪资预估表.月份 == 月份,
    ).delete()

    def _to_int(v):
        try:
            if v is None or v == "":
                return None
            return int(float(v))
        except Exception:
            return None

    for r in sorted(行列表, key=lambda x: x.get("序号") or x.get("serialNumber") or 0):
        序号 = _to_int(r.get("序号") or r.get("serialNumber")) or 0
        姓名 = (r.get("姓名") or r.get("name") or "").strip()
        性别 = (r.get("性别") or r.get("gender") or "").strip()
        出生年月 = (r.get("出生年月") or r.get("birthDate") or "").strip()
        学历 = (r.get("学历") or r.get("education") or "").strip()
        专业 = (r.get("专业") or r.get("major") or "").strip()
        毕业学校 = (r.get("毕业学校") or r.get("graduatedSchool") or "").strip()
        籍贯 = (r.get("籍贯") or r.get("nativePlace") or "").strip()

        QT专业名称 = (r.get("QT专业名称") or r.get("qtMajorName") or "").strip()
        QT班主任姓名 = (r.get("QT班主任姓名") or r.get("qtHomeroomTeacher") or "").strip()
        QT强化教员姓名 = (r.get("QT强化教员姓名") or r.get("qtReinforcementTeacher") or "").strip()

        QT考试成绩 = r.get("QT考试成绩") or r.get("examScores") or None
        QT项目成绩 = r.get("QT项目成绩") or r.get("projectScores") or None
        QT答辩成绩 = r.get("QT答辩成绩") or r.get("defenseScores") or None
        QT老师综合评价 = r.get("QT老师综合评价") or r.get("teacherEvaluations") or None

        出勤率 = _to_int(r.get("出勤率") or r.get("attendanceRate"))
        课堂表现评价 = r.get("课堂表现评价") or r.get("classroomPerformanceEvaluation") or None
        COT活动成绩 = _to_int(r.get("COT活动成绩") or r.get("cotActivityScore"))
        千分制 = _to_int(r.get("千分制") or r.get("thousandPointScore"))

        班主任评价 = r.get("班主任评价") or r.get("homeroomTeacherEvaluation") or None
        教员闫梦雷评价 = r.get("教员闫梦雷评价") or r.get("teacherYanMengLeiEvaluation") or None
        教员杨再军评价 = r.get("教员杨再军评价") or r.get("teacherYangZaiJunEvaluation") or None
        教员伍瑶评价 = r.get("教员伍瑶评价") or r.get("teacherWuYaoEvaluation") or None

        预估薪资 = r.get("预估薪资") or r.get("estimatedSalary") or None

        db.add(
            QT班级薪资预估表(
                神殿名称=神殿名称,
                班级名称=班级名称,
                年份=年份,
                月份=月份,
                序号=序号,
                姓名=姓名,
                性别=性别,
                出生年月=出生年月,
                学历=学历,
                专业=专业,
                毕业学校=毕业学校,
                籍贯=籍贯,
                QT专业名称=QT专业名称,
                QT班主任姓名=QT班主任姓名,
                QT强化教员姓名=QT强化教员姓名,
                QT考试成绩=QT考试成绩,
                QT项目成绩=QT项目成绩,
                QT答辩成绩=QT答辩成绩,
                QT老师综合评价=QT老师综合评价,
                出勤率=出勤率,
                课堂表现评价=课堂表现评价,
                COT活动成绩=COT活动成绩,
                千分制=千分制,
                班主任评价=班主任评价,
                教员闫梦雷评价=教员闫梦雷评价,
                教员杨再军评价=教员杨再军评价,
                教员伍瑶评价=教员伍瑶评价,
                预估薪资=预估薪资,
            )
        )

    db.flush()

def replace_qt_salary_by_blocks(
    db: Session,
    *,
    神殿名称: str,
    班级名称: str,
    年份: int,
    月份: int,
    考试块: Dict[str, Any],
    项目块: Dict[str, Any],
    答辩块: Dict[str, Any],
    教师块: Optional[Dict[str, Any]] = None,
    元信息: Optional[Dict[str, Any]] = None,
):
    """新结构：来自前端四块+meta，覆盖写入。
    - 行数据以各块 rows 中的 {serialNumber, name, scores/evaluations} 为准。
    - 维度级的 subjects/items/evaluations 的列定义和 meta 保存到配置表。
    """
    _migrate()

    # 更新配置
    _upsert_config(
        db,
        神殿名称=神殿名称,
        班级名称=班级名称,
        年份=年份,
        月份=月份,
        考试科目=考试块.get("subjects"),
        项目列=项目块.get("items"),
        答辩列=答辩块.get("items"),
        教师列=(教师块 or {}).get("items"),
        元信息=元信息 or {},
    )

    # 覆盖行
    db.query(QT班级薪资预估表).filter(
        QT班级薪资预估表.神殿名称 == 神殿名称,
        QT班级薪资预估表.班级名称 == 班级名称,
        QT班级薪资预估表.年份 == 年份,
        QT班级薪资预估表.月份 == 月份,
    ).delete()

    def _to_int(v):
        try:
            if v is None or v == "":
                return None
            return int(float(v))
        except Exception:
            return None

    # 构建一个名字->行数据的合并器
    rows_index: Dict[Tuple[int, str], Dict[str, Any]] = {}
    for blk, key in [
        (考试块, "scores"),
        (项目块, "scores"),
        (答辩块, "scores"),
    ]:
        for r in blk.get("rows", []) or []:
            sn = _to_int(r.get("serialNumber")) or 0
            name = (r.get("name") or "").strip()
            rows_index.setdefault((sn, name), {"serialNumber": sn, "name": name})
            rows_index[(sn, name)][key if blk is 考试块 else ("projectScores" if blk is 项目块 else "defenseScores")] = r.get("scores") or {}

    if 教师块:
        for r in 教师块.get("rows", []) or []:
            sn = _to_int(r.get("serialNumber")) or 0
            name = (r.get("name") or "").strip()
            rows_index.setdefault((sn, name), {"serialNumber": sn, "name": name})
            rows_index[(sn, name)]["teacherEvaluations"] = r.get("evaluations") or {}

    for (sn, name), r in sorted(rows_index.items(), key=lambda x: x[0][0]):
        db.add(
            QT班级薪资预估表(
                神殿名称=神殿名称,
                班级名称=班级名称,
                年份=年份,
                月份=月份,
                序号=sn,
                姓名=name,
                QT专业名称=(元信息 or {}).get("majorName"),
                QT班主任姓名=(元信息 or {}).get("homeroomTeacher"),
                QT强化教员姓名=(元信息 or {}).get("reinforcementTeacher"),
                QT考试成绩={"scores": r.get("scores", {})},
                QT项目成绩={"scores": r.get("projectScores", {})},
                QT答辩成绩={"scores": r.get("defenseScores", {})},
                QT老师综合评价={"evaluations": r.get("teacherEvaluations", {})},
            )
        )

    db.flush()

def fetch_qt_salary_as_blocks(
    db: Session,
    *,
    神殿名称: str,
    班级名称: str,
    年份: int,
    月份: int,
) -> Dict[str, Any]:
    _migrate()
    cfg = _fetch_config(db, 神殿名称=神殿名称, 班级名称=班级名称, 年份=年份, 月份=月份)
    rows = fetch_qt_salary_rows(db, 神殿名称=神殿名称, 班级名称=班级名称, 年份=年份, 月份=月份)

    # 组装 subjects/items
    subjects = (cfg.考试科目 if cfg and cfg.考试科目 else None)
    proj_items = (cfg.项目列 if cfg and cfg.项目列 else None)
    def_items = (cfg.答辩列 if cfg and cfg.答辩列 else None)
    teacher_items = (cfg.教师列 if cfg and cfg.教师列 else None)

    # 如无配置，尽量从行里推导
    if subjects is None:
        keys = set()
        for r in rows:
            s = (r.QT考试成绩 or {}).get("scores") or {}
            keys.update(list(s.keys()))
        subjects = [{"id": k, "title": k} for k in sorted(keys)]

    if proj_items is None:
        keys = set()
        for r in rows:
            s = (r.QT项目成绩 or {}).get("scores") or {}
            keys.update(list(s.keys()))
        proj_items = [{"id": k, "title": k} for k in sorted(keys)]

    if def_items is None:
        keys = set()
        for r in rows:
            s = (r.QT答辩成绩 or {}).get("scores") or {}
            keys.update(list(s.keys()))
        def_items = [{"id": k, "title": k} for k in sorted(keys)]

    if teacher_items is None:
        keys = set()
        for r in rows:
            s = (r.QT老师综合评价 or {}).get("evaluations") or {}
            keys.update(list(s.keys()))
        teacher_items = [{"id": k, "title": k} for k in sorted(keys)]

    def avg(vals: List[Optional[float]]) -> Optional[float]:
        nums = [v for v in vals if isinstance(v, (int, float))]
        if not nums:
            return None
        return round(sum(nums) / len(nums), 2)

    exam_rows = []
    proj_rows = []
    def_rows = []
    teacher_rows = []
    for r in rows:
        es = (r.QT考试成绩 or {}).get("scores") or {}
        ps = (r.QT项目成绩 or {}).get("scores") or {}
        ds = (r.QT答辩成绩 or {}).get("scores") or {}
        ts = (r.QT老师综合评价 or {}).get("evaluations") or {}

        exam_rows.append({
            "serialNumber": r.序号,
            "name": r.姓名,
            "scores": es,
            "average": avg([es.get(s["id"]) for s in (subjects or [])]) if subjects else None,
        })
        proj_rows.append({
            "serialNumber": r.序号,
            "name": r.姓名,
            "scores": ps,
            "average": avg(list(ps.values())) if ps else None,
        })
        def_rows.append({
            "serialNumber": r.序号,
            "name": r.姓名,
            "scores": ds,
            "average": avg(list(ds.values())) if ds else None,
        })
        teacher_rows.append({
            "serialNumber": r.序号,
            "name": r.姓名,
            "evaluations": ts,
        })

    return {
        "QT考试成绩": {"subjects": subjects or [], "rows": exam_rows},
        "QT项目成绩": {"items": proj_items or [], "rows": proj_rows},
        "QT答辩成绩": {"items": def_items or [], "rows": def_rows},
        "QT老师综合评价": {"items": teacher_items or [], "rows": teacher_rows},
        "meta": (cfg.元信息 if cfg and cfg.元信息 else {}),
    }
