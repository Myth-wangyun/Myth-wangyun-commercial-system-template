"""
神殿后端新生维稳月度汇总表 CRUD
"""

from typing import List

from sqlalchemy import and_, func
from sqlalchemy.orm import Session

from app.models.student_stability_monthly_summary import 神殿后端新生维稳月度汇总表
from app.models.student_stability_personal_monthly import 神殿后端新生维稳个人按月汇总表
from app.schemas.student_stability_monthly_summary import 月度汇总行数据


def 获取月度汇总数据(
    db: Session, 神殿名称: str, 年份: int
) -> List[神殿后端新生维稳月度汇总表]:
    """获取月度汇总数据"""
    return (
        db.query(神殿后端新生维稳月度汇总表)
        .filter(
            and_(
                神殿后端新生维稳月度汇总表.神殿名称 == 神殿名称,
                神殿后端新生维稳月度汇总表.年份 == 年份,
            )
        )
        .order_by(神殿后端新生维稳月度汇总表.月份)
        .all()
    )


def 聚合个人月度数据(db: Session, 神殿名称: str, 年份: int) -> List[月度汇总行数据]:
    """从个人月度表聚合生成月度汇总"""
    aggregated = (
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
    return [
        月度汇总行数据(
          月份=row.月份,
          交接人数=row.交接人数 or 0,
          入学人数=row.入学人数 or 0,
          退费人数=row.退费人数 or 0,
        )
        for row in aggregated
    ]


def 保存月度汇总数据(
    db: Session,
    神殿名称: str,
    年份: int,
    行列表: List[月度汇总行数据],
) -> List[神殿后端新生维稳月度汇总表]:
    """保存月度汇总（覆盖写入）"""
    if not 神殿名称 or not 年份:
        raise ValueError("神殿名称和年份不能为空")

    # 删除旧数据
    db.query(神殿后端新生维稳月度汇总表).filter(
        and_(
            神殿后端新生维稳月度汇总表.神殿名称 == 神殿名称,
            神殿后端新生维稳月度汇总表.年份 == 年份,
        )
    ).delete(synchronize_session=False)

    valid_rows: List[月度汇总行数据] = []
    for 行 in 行列表:
        if 行.月份 < 1 or 行.月份 > 12:
            continue
        valid_rows.append(行)

    if not valid_rows:
        db.commit()
        return []

    new_rows: List[神殿后端新生维稳月度汇总表] = []
    for 行 in valid_rows:
        row = 神殿后端新生维稳月度汇总表(
            神殿名称=神殿名称,
            年份=年份,
            月份=行.月份,
            交接人数=行.交接人数 or 0,
            入学人数=行.入学人数 or 0,
            退费人数=行.退费人数 or 0,
        )
        db.add(row)
        new_rows.append(row)

    db.commit()
    for r in new_rows:
        db.refresh(r)
    return new_rows


def 获取神殿年度统计(db: Session, 神殿名称: str, 年份: int) -> dict:
    """获取指定神殿指定年份的汇总统计数据"""
    rows = 获取月度汇总数据(db, 神殿名称, 年份)
    if not rows:
        # 尝试从个人月度表聚合
        aggregated = 聚合个人月度数据(db, 神殿名称, 年份)
        if aggregated:
            total_交接 = sum(r.交接人数 or 0 for r in aggregated)
            total_入学 = sum(r.入学人数 or 0 for r in aggregated)
            total_退费 = sum(r.退费人数 or 0 for r in aggregated)
        else:
            total_交接 = total_入学 = total_退费 = 0
    else:
        total_交接 = sum(r.交接人数 or 0 for r in rows)
        total_入学 = sum(r.入学人数 or 0 for r in rows)
        total_退费 = sum(r.退费人数 or 0 for r in rows)
    
    退费率 = (total_退费 / total_入学 * 100) if total_入学 > 0 else 0
    维稳率 = 100 - 退费率
    
    return {
        "神殿名称": 神殿名称,
        "年份": 年份,
        "交接人数": total_交接,
        "入学人数": total_入学,
        "退费人数": total_退费,
        "退费率": round(退费率, 2),
        "维稳率": round(维稳率, 2),
    }


def 获取神殿累计统计(db: Session, 神殿名称: str) -> dict:
    """获取指定神殿所有年份的累计统计数据"""
    # 从月度汇总表获取所有数据
    all_rows = (
        db.query(神殿后端新生维稳月度汇总表)
        .filter(神殿后端新生维稳月度汇总表.神殿名称 == 神殿名称)
        .all()
    )
    
    if all_rows:
        total_交接 = sum(r.交接人数 or 0 for r in all_rows)
        total_入学 = sum(r.入学人数 or 0 for r in all_rows)
        total_退费 = sum(r.退费人数 or 0 for r in all_rows)
    else:
        # 从个人月度表聚合所有年份
        aggregated = (
            db.query(
                func.sum(神殿后端新生维稳个人按月汇总表.交接人数).label("交接人数"),
                func.sum(神殿后端新生维稳个人按月汇总表.入学人数).label("入学人数"),
                func.sum(神殿后端新生维稳个人按月汇总表.退费人数).label("退费人数"),
            )
            .filter(神殿后端新生维稳个人按月汇总表.神殿名称 == 神殿名称)
            .first()
        )
        if aggregated:
            total_交接 = aggregated.交接人数 or 0
            total_入学 = aggregated.入学人数 or 0
            total_退费 = aggregated.退费人数 or 0
        else:
            total_交接 = total_入学 = total_退费 = 0
    
    退费率 = (total_退费 / total_入学 * 100) if total_入学 > 0 else 0
    维稳率 = 100 - 退费率
    
    return {
        "神殿名称": 神殿名称,
        "交接人数": total_交接,
        "入学人数": total_入学,
        "退费人数": total_退费,
        "退费率": round(退费率, 2),
        "维稳率": round(维稳率, 2),
    }


def 获取所有神殿年度汇总(db: Session, 年份: int) -> list:
    """获取所有神殿的年度汇总数据（按神殿聚合全年数据）"""
    # 从月度汇总表按神殿聚合
    results = (
        db.query(
            神殿后端新生维稳月度汇总表.神殿名称,
            func.sum(神殿后端新生维稳月度汇总表.交接人数).label('交接人数'),
            func.sum(神殿后端新生维稳月度汇总表.入学人数).label('入学人数'),
            func.sum(神殿后端新生维稳月度汇总表.退费人数).label('退费人数'),
        )
        .filter(神殿后端新生维稳月度汇总表.年份 == 年份)
        .group_by(神殿后端新生维稳月度汇总表.神殿名称)
        .all()
    )
    
    # 如果月度汇总表没有数据，尝试从个人月度表聚合
    if not results:
        results = (
            db.query(
                神殿后端新生维稳个人按月汇总表.神殿名称,
                func.sum(神殿后端新生维稳个人按月汇总表.交接人数).label('交接人数'),
                func.sum(神殿后端新生维稳个人按月汇总表.入学人数).label('入学人数'),
                func.sum(神殿后端新生维稳个人按月汇总表.退费人数).label('退费人数'),
            )
            .filter(神殿后端新生维稳个人按月汇总表.年份 == 年份)
            .group_by(神殿后端新生维稳个人按月汇总表.神殿名称)
            .all()
        )
    
    output = []
    for r in results:
        交接人数 = int(r.交接人数 or 0)
        入学人数 = int(r.入学人数 or 0)
        退费人数 = int(r.退费人数 or 0)
        退费率 = round((退费人数 / 入学人数 * 100), 2) if 入学人数 > 0 else 0
        
        output.append({
            "神殿名称": r.神殿名称,
            "交接人数": 交接人数,
            "入学人数": 入学人数,
            "退费人数": 退费人数,
            "退费率": 退费率,
        })
    
    return output
