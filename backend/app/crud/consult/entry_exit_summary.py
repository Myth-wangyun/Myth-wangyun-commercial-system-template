"""
祈福司入职离职汇总表CRUD操作
"""

from typing import List, Optional

from sqlalchemy import and_, desc
from sqlalchemy.orm import Session

from app.models.consult.entry_exit_summary import 祈福司入职离职汇总表
from app.schemas.consult.entry_exit_summary import (
    祈福司入职离职汇总表创建,
    祈福司入职离职汇总表更新,
)


class 祈福司入职离职汇总表CRUD:
    """祈福司入职离职汇总表CRUD操作"""

    @staticmethod
    def create(db: Session, obj_in: 祈福司入职离职汇总表创建) -> 祈福司入职离职汇总表:
        """创建记录"""
        # 计算合计
        合计 = (
            obj_in.一月 + obj_in.二月 + obj_in.三月 + obj_in.四月 +
            obj_in.五月 + obj_in.六月 + obj_in.七月 + obj_in.八月 +
            obj_in.九月 + obj_in.十月 + obj_in.十一月 + obj_in.十二月
        )

        db_obj = 祈福司入职离职汇总表(
            年份=obj_in.年份,
            岗位=obj_in.岗位,
            指标类型=obj_in.指标类型,
            一月=obj_in.一月,
            二月=obj_in.二月,
            三月=obj_in.三月,
            四月=obj_in.四月,
            五月=obj_in.五月,
            六月=obj_in.六月,
            七月=obj_in.七月,
            八月=obj_in.八月,
            九月=obj_in.九月,
            十月=obj_in.十月,
            十一月=obj_in.十一月,
            十二月=obj_in.十二月,
            合计=合计,
            神殿=obj_in.神殿,
            创建人ID=obj_in.创建人ID,
            创建人姓名=obj_in.创建人姓名,
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    @staticmethod
    def get_by_id(db: Session, record_id: int) -> Optional[祈福司入职离职汇总表]:
        """根据ID获取记录"""
        return db.query(祈福司入职离职汇总表).filter(
            祈福司入职离职汇总表.记录ID == record_id
        ).first()

    @staticmethod
    def get_by_year_position_type(
        db: Session,
        year: int,
        position: str,
        indicator_type: str,
        campus: Optional[str] = None
    ) -> Optional[祈福司入职离职汇总表]:
        """根据年份、岗位、指标类型获取记录"""
        query = db.query(祈福司入职离职汇总表).filter(
            and_(
                祈福司入职离职汇总表.年份 == year,
                祈福司入职离职汇总表.岗位 == position,
                祈福司入职离职汇总表.指标类型 == indicator_type
            )
        )

        if campus:
            query = query.filter(祈福司入职离职汇总表.神殿 == campus)

        return query.first()

    @staticmethod
    def get_multi(
        db: Session,
        year: Optional[int] = None,
        position: Optional[str] = None,
        indicator_type: Optional[str] = None,
        campus: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> tuple[List[祈福司入职离职汇总表], int]:
        """获取记录列表（支持筛选和分页）"""
        query = db.query(祈福司入职离职汇总表)

        # 构建查询条件
        conditions = []

        if year:
            conditions.append(祈福司入职离职汇总表.年份 == year)

        if position:
            conditions.append(祈福司入职离职汇总表.岗位 == position)

        if indicator_type:
            conditions.append(祈福司入职离职汇总表.指标类型 == indicator_type)

        if campus:
            conditions.append(祈福司入职离职汇总表.神殿 == campus)

        if conditions:
            query = query.filter(and_(*conditions))

        # 获取总数
        total = query.count()

        # 分页并按年份、岗位排序
        items = query.order_by(
            desc(祈福司入职离职汇总表.年份),
            祈福司入职离职汇总表.岗位,
            祈福司入职离职汇总表.指标类型
        ).offset(skip).limit(limit).all()

        return items, total

    @staticmethod
    def get_by_year(
        db: Session,
        year: int,
        campus: Optional[str] = None
    ) -> List[祈福司入职离职汇总表]:
        """获取指定年份的所有记录（用于表格展示）"""
        query = db.query(祈福司入职离职汇总表).filter(
            祈福司入职离职汇总表.年份 == year
        )

        if campus:
            query = query.filter(祈福司入职离职汇总表.神殿 == campus)

        return query.order_by(
            祈福司入职离职汇总表.岗位,
            祈福司入职离职汇总表.指标类型
        ).all()

    @staticmethod
    def update(db: Session, obj_in: 祈福司入职离职汇总表更新) -> Optional[祈福司入职离职汇总表]:
        """更新记录"""
        db_obj = 祈福司入职离职汇总表CRUD.get_by_id(db, obj_in.记录ID)
        if not db_obj:
            return None

        update_data = obj_in.model_dump(exclude_unset=True, exclude={"记录ID"})

        # 更新字段
        for field, value in update_data.items():
            if value is not None:
                setattr(db_obj, field, value)

        # 重新计算合计（如果任何月份数据被更新）
        if any(key in update_data for key in ["一月", "二月", "三月", "四月", "五月", "六月",
                                                "七月", "八月", "九月", "十月", "十一月", "十二月"]):
            db_obj.合计 = (
                db_obj.一月 + db_obj.二月 + db_obj.三月 + db_obj.四月 +
                db_obj.五月 + db_obj.六月 + db_obj.七月 + db_obj.八月 +
                db_obj.九月 + db_obj.十月 + db_obj.十一月 + db_obj.十二月
            )

        db.commit()
        db.refresh(db_obj)
        return db_obj

    @staticmethod
    def batch_update(db: Session, updates: List[祈福司入职离职汇总表更新]) -> List[祈福司入职离职汇总表]:
        """批量更新记录"""
        updated_records = []
        for update_data in updates:
            record = 祈福司入职离职汇总表CRUD.update(db, update_data)
            if record:
                updated_records.append(record)
        return updated_records

    @staticmethod
    def delete(db: Session, record_id: int) -> bool:
        """删除记录"""
        db_obj = 祈福司入职离职汇总表CRUD.get_by_id(db, record_id)
        if not db_obj:
            return False

        db.delete(db_obj)
        db.commit()
        return True

    @staticmethod
    def initialize_year_data(
        db: Session,
        year: int,
        campus: Optional[str] = None,
        creator_id: Optional[int] = None,
        creator_name: Optional[str] = None
    ) -> List[祈福司入职离职汇总表]:
        """初始化指定年份的数据（创建所有岗位和指标类型的记录）"""
        positions = ["咨询干部", "咨询", "咨询助理", "渠道"]
        indicator_types = ["实际招聘人数", "离职人数"]

        created_records = []

        for position in positions:
            for indicator_type in indicator_types:
                # 检查是否已存在
                existing = 祈福司入职离职汇总表CRUD.get_by_year_position_type(
                    db, year, position, indicator_type, campus
                )

                if not existing:
                    # 创建新记录
                    new_record = 祈福司入职离职汇总表创建(
                        年份=year,
                        岗位=position,
                        指标类型=indicator_type,
                        神殿=campus,
                        创建人ID=creator_id,
                        创建人姓名=creator_name
                    )
                    db_obj = 祈福司入职离职汇总表CRUD.create(db, new_record)
                    created_records.append(db_obj)
                else:
                    created_records.append(existing)

        return created_records
