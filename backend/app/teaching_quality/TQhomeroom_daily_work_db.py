"""
教学质量模块 - 班主任日工单  028文件 

说明：
- 使用 SQLAlchemy + PostgreSQL,在 teaching_quality schema 下创建三张表：
  1) 班主任日工单组表：对应前端按“日期/星期/执行人”合并的组
  2) 班主任日工单备注表：按“神殿/日期”保存备注
  3) 班主任日工单明细表：对应组内每一条任务（序号、任务名称、描述、目标、执行时间、权重、结果）
- 与前端页面 frontend/pages/teaching-quality/campus/6-management-data/28-homeroom-teacher-daily-work 对应

使用方式：
- 作为模块被 main/init 中调用，或直接在命令行运行本文件以创建表并插入一条示例数据：
    python -m app.teaching-quality.homeroom_daily_work_db

"""

from datetime import date
from typing import List, Optional

from sqlalchemy.orm import Session

from app.core.database import SessionLocal, TQBase, engine, ensure_teaching_quality_schema

# 直接导入模型类
from app.teaching_quality.TQhomeroom_daily_work import (
    班主任日工单备注表,
    班主任日工单明细表,
    班主任日工单组表,
)


def init_homeroom_daily_work_tables() -> None:
    """创建班主任日工单相关的数据表（teaching_quality schema）"""
    # 确保 schema 存在
    ensure_teaching_quality_schema()
    # 仅创建本模块相关的表（索引已在模型 __table_args__ 中定义）
    TQBase.metadata.create_all(
        bind=engine,
        tables=[班主任日工单组表.__table__, 班主任日工单备注表.__table__, 班主任日工单明细表.__table__],
    )
    print("[成功] 班主任日工单相关表已创建/已存在 (teaching_quality schema)")

def upsert_group(
    db: Session,
    *,
    神殿名称: str,
    日期: date,
    执行人: str,
    星期: Optional[str] = None,
    班主任: Optional[str] = None,
    备注: Optional[str] = None,
) -> 班主任日工单组表:
    """按唯一键(神殿+日期+执行人)查找或新建一个组"""
    group = (
        db.query(班主任日工单组表)
        .filter(
            班主任日工单组表.神殿名称 == 神殿名称,
            班主任日工单组表.日期 == 日期,
            班主任日工单组表.执行人 == 执行人,
        )
        .first()
    )
    if group:
        if 星期 is not None:
            group.星期 = 星期
        if 班主任 is not None:
            group.班主任 = 班主任
        if 备注 is not None:
            group.备注 = 备注
        return group
    group = 班主任日工单组表(
        神殿名称=神殿名称,
        日期=日期,
        执行人=执行人,
        星期=星期,
        班主任=班主任,
        备注=备注,
    )
    db.add(group)
    db.flush()  # 立即获取组ID
    return group

def add_or_replace_group_details(
    db: Session,
    *,
    组: 班主任日工单组表,
    明细列表数据: List[dict],
) -> None:
    """替换某个组下的所有明细（按序号排序后插入）
    明细列表数据元素示例：
    {
      "序号": 1,
      "任务名称": "",
      "任务描述": "",
      "任务目标": "",
      "执行时间": "",
      "权重": "",
      "结果": "",
    }
    """
    # 先删除旧明细
    db.query(班主任日工单明细表).filter(班主任日工单明细表.组ID == 组.组ID).delete()
    # 排序后插入新明细
    for item in sorted(明细列表数据, key=lambda x: x.get("序号", 0)):
        db.add(
            班主任日工单明细表(
                组ID=组.组ID,
                序号=item.get("序号"),
                任务名称=item.get("任务名称"),
                任务描述=item.get("任务描述"),
                任务目标=item.get("任务目标"),
                执行时间=item.get("执行时间"),
                权重=item.get("权重"),
                结果=item.get("结果"),
            )
        )

def insert_sample_data() -> None:
    """插入一条示例数据，便于联调前端"""
    db = SessionLocal()
    try:
        group = upsert_group(
            db,
            神殿名称="总部",
            日期=date.today(),
            执行人="张三",
            星期="周二",
        )
        # 示例：6条明细（与当前前端初始行数一致）
        details = [
            {"序号": i + 1, "任务名称": "", "任务描述": "", "任务目标": "", "执行时间": "", "权重": "", "结果": ""}
            for i in range(6)
        ]
        add_or_replace_group_details(db, 组=group, 明细列表数据=details)
        db.commit()
        print(f"[成功] 已插入示例数据：组ID={group.组ID}, 明细数={len(details)}")
    except Exception as e:
        db.rollback()
        print(f"[错误] 插入示例数据失败: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    init_homeroom_daily_work_tables()
    insert_sample_data()
