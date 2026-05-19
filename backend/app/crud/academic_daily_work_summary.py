"""
智慧司日工作总结表 CRUD
"""

from typing import List, Optional

from sqlalchemy import and_
from sqlalchemy.orm import Session

from app.models.academic_daily_work_summary import 智慧司日工作总结表
from app.schemas.academic_daily_work_summary import 日总结创建, 日总结更新


def 获取(
    db: Session,
    神殿名称: str,
    日期,
    执行人: Optional[str] = None,
    班级: Optional[str] = None,
) -> List[智慧司日工作总结表]:
    query = (
        db.query(智慧司日工作总结表)
        .filter(and_(智慧司日工作总结表.神殿名称 == 神殿名称, 智慧司日工作总结表.日期 == 日期))
    )
    if 执行人 is not None:
        query = query.filter(智慧司日工作总结表.执行人 == 执行人)
    if 班级 is not None:
        query = query.filter(智慧司日工作总结表.班级 == 班级)
    return (
        query.order_by(智慧司日工作总结表.执行人, 智慧司日工作总结表.班级, 智慧司日工作总结表.序号)
        .all()
    )


def 获取全部(db: Session, 神殿名称: str) -> List[智慧司日工作总结表]:
    return (
        db.query(智慧司日工作总结表)
        .filter(智慧司日工作总结表.神殿名称 == 神殿名称)
        .order_by(
            智慧司日工作总结表.日期,
            智慧司日工作总结表.执行人,
            智慧司日工作总结表.班级,
            智慧司日工作总结表.序号,
        )
        .all()
    )


def 获取范围(
    db: Session,
    神殿名称: str,
    开始日期,
    结束日期,
    执行人: Optional[str] = None,
    班级: Optional[str] = None,
) -> List[智慧司日工作总结表]:
    """
    获取指定日期范围内的智慧司日工作总结
    严格按照 academic.智慧司日工作总结表.日期 字段进行筛选
    """
    from datetime import date as date_type
    
    # 确保开始日期和结束日期是 date 类型
    if not isinstance(开始日期, date_type):
        raise ValueError(f"开始日期必须是 date 类型，当前类型: {type(开始日期)}")
    if not isinstance(结束日期, date_type):
        raise ValueError(f"结束日期必须是 date 类型，当前类型: {type(结束日期)}")
    
    # 严格按照日期字段筛选：日期 >= 开始日期 AND 日期 <= 结束日期
    query = (
        db.query(智慧司日工作总结表)
        .filter(
            and_(
                智慧司日工作总结表.神殿名称 == 神殿名称,
                智慧司日工作总结表.日期 >= 开始日期,  # 大于等于开始日期
                智慧司日工作总结表.日期 <= 结束日期,  # 小于等于结束日期
            )
        )
    )
    if 执行人 is not None:
        query = query.filter(智慧司日工作总结表.执行人 == 执行人)
    if 班级 is not None:
        query = query.filter(智慧司日工作总结表.班级 == 班级)
    
    # 按日期、执行人、班级、序号排序，确保结果有序
    return (
        query.order_by(
            智慧司日工作总结表.日期.asc(),  # 明确指定升序
            智慧司日工作总结表.执行人.asc(),
            智慧司日工作总结表.班级.asc(),
            智慧司日工作总结表.序号.asc(),
        )
        .all()
    )


def _批量创建(db: Session, 数据: 日总结创建):
    新行列表 = []
    for 行数据 in 数据.行数据:
        行日期 = 行数据.日期 or 数据.日期
        新行 = 智慧司日工作总结表(
            神殿名称=数据.神殿名称,
            日期=行日期,
            星期=数据.星期,
            执行人=行数据.执行人 or 数据.执行人,
            班级=行数据.班级 or 数据.班级,
            备注=数据.备注,
            序号=行数据.序号,
            任务名称=行数据.任务名称,
            任务描述=行数据.任务描述,
            任务目标=行数据.任务目标,
            执行时间=行数据.执行时间,
            最后完成期限=行数据.最后完成期限,
            权重=行数据.权重,
            结果=行数据.结果,
        )
        db.add(新行)
        新行列表.append(新行)
    db.commit()
    for 行 in 新行列表:
        db.refresh(行)
    return 新行列表


def 创建(db: Session, 数据: 日总结创建):
    相关日期 = {行.日期 or 数据.日期 for 行 in 数据.行数据}
    相关日期.discard(None)
    if not 相关日期 and 数据.日期:
        相关日期.add(数据.日期)
    for d in 相关日期:
        删除(db, 数据.神殿名称, d, 数据.执行人, 数据.班级)
    return _批量创建(db, 数据)


def 更新(db: Session, 神殿名称: str, 日期, 数据: 日总结更新):
    相关日期 = {行.日期 or 日期 for 行 in 数据.行数据}
    相关日期.discard(None)
    if not 相关日期:
        相关日期.add(日期)
    for d in 相关日期:
        删除(db, 神殿名称, d, 数据.执行人, 数据.班级)
    创建数据 = 日总结创建(
        神殿名称=神殿名称,
        日期=日期,
        星期=数据.星期,
        执行人=数据.执行人,
        班级=数据.班级,
        备注=数据.备注,
        行数据=数据.行数据,
    )
    return _批量创建(db, 创建数据)


def 删除(
    db: Session,
    神殿名称: str,
    日期,
    执行人: Optional[str] = None,
    班级: Optional[str] = None,
) -> int:
    query = db.query(智慧司日工作总结表).filter(
        and_(智慧司日工作总结表.神殿名称 == 神殿名称, 智慧司日工作总结表.日期 == 日期)
    )
    if 执行人 is not None:
        query = query.filter(智慧司日工作总结表.执行人 == 执行人)
    if 班级 is not None:
        query = query.filter(智慧司日工作总结表.班级 == 班级)
    deleted = query.delete(synchronize_session=False)
    db.commit()
    return deleted
