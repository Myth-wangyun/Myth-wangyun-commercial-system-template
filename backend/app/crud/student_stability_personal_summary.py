"""
神殿后端新生维稳个人汇总表 CRUD
"""

from typing import List

from sqlalchemy import and_, func
from sqlalchemy.orm import Session

from app.models.student_stability_personal_monthly import 神殿后端新生维稳个人按月汇总表
from app.models.student_stability_personal_summary import 神殿后端新生维稳个人汇总表
from app.schemas.student_stability_personal_summary import 个人汇总行数据


def 获取个人汇总数据(
    db: Session, 神殿名称: str, 年份: int
) -> List[神殿后端新生维稳个人汇总表]:
    """获取个人年度汇总数据"""
    return (
        db.query(神殿后端新生维稳个人汇总表)
        .filter(
            and_(
                神殿后端新生维稳个人汇总表.神殿名称 == 神殿名称,
                神殿后端新生维稳个人汇总表.年份 == 年份,
            )
        )
        .order_by(神殿后端新生维稳个人汇总表.教员序号)
        .all()
    )


def 汇总或回填月度数据(db: Session, 神殿名称: str, 年份: int) -> List[个人汇总行数据]:
    """优先返回保存的汇总；若没有，则从月度表自动汇总"""
    existing = 获取个人汇总数据(db, 神殿名称, 年份)
    if existing:
        return [
            个人汇总行数据(
                教员序号=r.教员序号,
                教员姓名=r.教员姓名,
                交接人数=r.交接人数 or 0,
                入学人数=r.入学人数 or 0,
                退费人数=r.退费人数 or 0,
            )
            for r in existing
        ]

    # 回填：按月度表汇总
    aggregated = (
        db.query(
            神殿后端新生维稳个人按月汇总表.教员姓名.label("教员姓名"),
            func.sum(神殿后端新生维稳个人按月汇总表.交接人数).label("交接人数"),
            func.sum(神殿后端新生维稳个人按月汇总表.入学人数).label("入学人数"),
            func.sum(神殿后端新生维稳个人按月汇总表.退费人数).label("退费人数"),
        )
        .filter(
            and_(
                神殿后端新生维稳个人按月汇总表.神殿名称 == 神殿名称,
                神殿后端新生维稳个人按月汇总表.年份 == 年份,
            )
        )
        .group_by(神殿后端新生维稳个人按月汇总表.教员姓名)
        .all()
    )

    return [
        个人汇总行数据(
            教员序号=index + 1,
            教员姓名=row.教员姓名 or "",
            交接人数=row.交接人数 or 0,
            入学人数=row.入学人数 or 0,
            退费人数=row.退费人数 or 0,
        )
        for index, row in enumerate(aggregated)
    ]


def 保存个人汇总数据(
    db: Session,
    神殿名称: str,
    年份: int,
    行列表: List[个人汇总行数据],
) -> List[神殿后端新生维稳个人汇总表]:
    """保存个人年度汇总数据（覆盖写入）"""
    if not 神殿名称 or not 年份:
        raise ValueError("神殿名称和年份不能为空")

    # 过滤有效记录
    valid_rows = []
    for 行数据 in 行列表:
        教员姓名 = 行数据.教员姓名.strip() if 行数据.教员姓名 else ""
        if not 教员姓名 or 行数据.教员序号 < 1:
            continue
        valid_rows.append(行数据)

    # 删除旧数据
    db.query(神殿后端新生维稳个人汇总表).filter(
        and_(
            神殿后端新生维稳个人汇总表.神殿名称 == 神殿名称,
            神殿后端新生维稳个人汇总表.年份 == 年份,
        )
    ).delete(synchronize_session=False)

    if not valid_rows:
        db.commit()
        return []

    # 写入新数据
    new_rows: List[神殿后端新生维稳个人汇总表] = []
    for 行数据 in valid_rows:
        row = 神殿后端新生维稳个人汇总表(
            神殿名称=神殿名称,
            年份=年份,
            教员序号=行数据.教员序号,
            教员姓名=行数据.教员姓名.strip(),
            交接人数=行数据.交接人数 or 0,
            入学人数=行数据.入学人数 or 0,
            退费人数=行数据.退费人数 or 0,
        )
        db.add(row)
        new_rows.append(row)

    db.commit()
    for r in new_rows:
        db.refresh(r)
    return new_rows
