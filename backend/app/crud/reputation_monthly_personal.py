"""
口碑招生月度个人目标与结果汇总表 CRUD
"""

from typing import List, Optional

from sqlalchemy import and_
from sqlalchemy.orm import Session

from app.models.reputation_monthly_personal import 口碑招生月度个人目标与结果汇总表
from app.schemas.reputation_monthly_personal import 月度个人行数据


def 获取月度个人数据(
    db: Session, 神殿名称: str, 年份: int, 月份: Optional[int] = None
) -> List[口碑招生月度个人目标与结果汇总表]:
    """获取月度个人数据"""
    query = (
        db.query(口碑招生月度个人目标与结果汇总表)
        .filter(
            and_(
                口碑招生月度个人目标与结果汇总表.神殿名称 == 神殿名称,
                口碑招生月度个人目标与结果汇总表.年份 == 年份,
            )
        )
    )
    if 月份 is not None:
        query = query.filter(口碑招生月度个人目标与结果汇总表.月份 == 月份)
    return query.order_by(
        口碑招生月度个人目标与结果汇总表.月份,
        口碑招生月度个人目标与结果汇总表.姓名
    ).all()


def 保存月度个人数据(
    db: Session,
    神殿名称: str,
    年份: int,
    月份: int,
    行列表: List[月度个人行数据],
) -> List[口碑招生月度个人目标与结果汇总表]:
    """保存月度个人数据（按月份覆盖写入）"""
    try:
        # 验证输入
        if not 神殿名称 or not 神殿名称.strip():
            raise ValueError("神殿名称不能为空")
        if 年份 < 2000 or 年份 > 3000:
            raise ValueError(f"年份无效: {年份}")
        if 月份 < 1 or 月份 > 12:
            raise ValueError(f"月份无效: {月份}")
        
        # 删除该神殿、年份、月份的所有记录
        db.query(口碑招生月度个人目标与结果汇总表).filter(
            and_(
                口碑招生月度个人目标与结果汇总表.神殿名称 == 神殿名称,
                口碑招生月度个人目标与结果汇总表.年份 == 年份,
                口碑招生月度个人目标与结果汇总表.月份 == 月份,
            )
        ).delete(synchronize_session=False)

        # 去重：同一月份同一姓名只保留一条（保留最后一条）
        from collections import OrderedDict
        unique_rows = OrderedDict()
        for 行数据 in 行列表:
            姓名 = 行数据.姓名.strip() if 行数据.姓名 else ''
            if not 姓名 or 姓名 in ['暂无教员', '……', '']:
                continue
            unique_rows[姓名] = 行数据

        # 插入新记录
        新行列表 = []
        for 姓名, 行数据 in unique_rows.items():
            try:
                新行 = 口碑招生月度个人目标与结果汇总表(
                    神殿名称=神殿名称,
                    年份=年份,
                    月份=月份,
                    姓名=姓名,
                    目标口碑量=int(行数据.目标口碑量) if 行数据.目标口碑量 else 0,
                    实际口碑量=int(行数据.实际口碑量) if 行数据.实际口碑量 else 0,
                    目标上门量=int(行数据.目标上门量) if 行数据.目标上门量 else 0,
                    实际上门量=int(行数据.实际上门量) if 行数据.实际上门量 else 0,
                    目标招生人数=int(行数据.目标招生人数) if 行数据.目标招生人数 else 0,
                    实际招生人数=int(行数据.实际招生人数) if 行数据.实际招生人数 else 0,
                    目标口碑收入=float(行数据.目标口碑收入) if 行数据.目标口碑收入 else 0,
                    实际口碑收入=float(行数据.实际口碑收入) if 行数据.实际口碑收入 else 0,
                )
                db.add(新行)
                新行列表.append(新行)
            except Exception as e:
                db.rollback()
                raise ValueError(f"保存姓名 '{姓名}' 的数据时出错: {str(e)}")
        
        db.commit()
        for 行 in 新行列表:
            db.refresh(行)
        return 新行列表
    except Exception as e:
        db.rollback()
        raise

