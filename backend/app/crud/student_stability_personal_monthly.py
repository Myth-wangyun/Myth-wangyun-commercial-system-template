"""
神殿后端新生维稳个人按月汇总表 CRUD
"""

from typing import List

from sqlalchemy import and_, func
from sqlalchemy.orm import Session

from app.crud import student_stability_monthly_summary as monthly_summary_crud
from app.crud import student_stability_personal_summary as summary_crud
from app.models.student_stability_personal_monthly import 神殿后端新生维稳个人按月汇总表
from app.schemas.student_stability_monthly_summary import 月度汇总行数据
from app.schemas.student_stability_personal_monthly import 个人按月行数据
from app.schemas.student_stability_personal_summary import 个人汇总行数据


def 获取个人按月数据(
    db: Session, 神殿名称: str, 年份: int
) -> List[神殿后端新生维稳个人按月汇总表]:
    """获取个人按月数据"""
    return (
        db.query(神殿后端新生维稳个人按月汇总表)
        .filter(
            and_(
                神殿后端新生维稳个人按月汇总表.神殿名称 == 神殿名称,
                神殿后端新生维稳个人按月汇总表.年份 == 年份,
            )
        )
        .order_by(
            神殿后端新生维稳个人按月汇总表.月份,
            神殿后端新生维稳个人按月汇总表.教员序号
        )
        .all()
    )


def 保存个人按月数据(
    db: Session,
    神殿名称: str,
    年份: int,
    行列表: List[个人按月行数据],
) -> List[神殿后端新生维稳个人按月汇总表]:
    """保存个人按月数据（按神殿年份覆盖写入）"""
    if not 神殿名称 or not 年份:
        raise ValueError("神殿名称和年份不能为空")
    
    if not 行列表:
        # 如果没有数据，只删除旧记录
        db.query(神殿后端新生维稳个人按月汇总表).filter(
            and_(
                神殿后端新生维稳个人按月汇总表.神殿名称 == 神殿名称,
                神殿后端新生维稳个人按月汇总表.年份 == 年份,
            )
        ).delete(synchronize_session=False)
        db.commit()
        return []
    
    # 验证和过滤数据
    valid_rows = []
    for 行数据 in 行列表:
        教员姓名 = 行数据.教员姓名.strip() if 行数据.教员姓名 else ''
        if not 教员姓名:
            continue  # 跳过教员姓名为空的记录
        
        if 行数据.月份 < 1 or 行数据.月份 > 12:
            continue  # 跳过无效月份
        
        if 行数据.教员序号 < 1:
            continue  # 跳过无效教员序号
        
        valid_rows.append(行数据)
    
    if not valid_rows:
        # 如果没有有效数据，只删除旧记录
        db.query(神殿后端新生维稳个人按月汇总表).filter(
            and_(
                神殿后端新生维稳个人按月汇总表.神殿名称 == 神殿名称,
                神殿后端新生维稳个人按月汇总表.年份 == 年份,
            )
        ).delete(synchronize_session=False)
        db.commit()
        return []
    
    # 删除该神殿、年份的所有记录
    db.query(神殿后端新生维稳个人按月汇总表).filter(
        and_(
            神殿后端新生维稳个人按月汇总表.神殿名称 == 神殿名称,
            神殿后端新生维稳个人按月汇总表.年份 == 年份,
        )
    ).delete(synchronize_session=False)

    # 插入新记录
    新行列表 = []
    for 行数据 in valid_rows:
        新行 = 神殿后端新生维稳个人按月汇总表(
            神殿名称=神殿名称,
            年份=年份,
            月份=行数据.月份,
            教员序号=行数据.教员序号,
            教员姓名=行数据.教员姓名.strip(),
            交接人数=行数据.交接人数 or 0,
            入学人数=行数据.入学人数 or 0,
            退费人数=行数据.退费人数 or 0,
        )
        db.add(新行)
        新行列表.append(新行)
    
    db.commit()
    for 行 in 新行列表:
        db.refresh(行)

    # 同步更新年度汇总：按教员姓名聚合
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

    汇总行列表 = [
        个人汇总行数据(
            教员序号=index + 1,
            教员姓名=row.教员姓名 or "",
            交接人数=row.交接人数 or 0,
            入学人数=row.入学人数 or 0,
            退费人数=row.退费人数 or 0,
        )
        for index, row in enumerate(aggregated)
    ]
    summary_crud.保存个人汇总数据(db, 神殿名称=神殿名称, 年份=年份, 行列表=汇总行列表)

    # 同步更新月度汇总：按月份聚合
    aggregated_month = (
        db.query(
            神殿后端新生维稳个人按月汇总表.月份.label("月份"),
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
        .group_by(神殿后端新生维稳个人按月汇总表.月份)
        .order_by(神殿后端新生维稳个人按月汇总表.月份)
        .all()
    )
    月度汇总行列表 = [
        月度汇总行数据(
            月份=row.月份,
            交接人数=row.交接人数 or 0,
            入学人数=row.入学人数 or 0,
            退费人数=row.退费人数 or 0,
        )
        for row in aggregated_month
    ]
    monthly_summary_crud.保存月度汇总数据(db, 神殿名称=神殿名称, 年份=年份, 行列表=月度汇总行列表)

    return 新行列表
