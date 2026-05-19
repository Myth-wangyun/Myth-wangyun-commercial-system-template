"""
祈福司培训月度表 CRUD 操作
"""

from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.consult.training_monthly import 祈福司培训月度表
from app.schemas.consult.training_monthly import (
    祈福司培训月度表创建,
    祈福司培训月度表更新,
)


class CRUDTrainingMonthly:
    """祈福司培训月度表 CRUD"""

    def get_by_id(self, db: Session, record_id: int) -> Optional[祈福司培训月度表]:
        """根据ID获取记录"""
        return db.query(祈福司培训月度表).filter(祈福司培训月度表.记录ID == record_id).first()

    def get_by_year_position(
        self,
        db: Session,
        year: int,
        position: str,
    ) -> Optional[祈福司培训月度表]:
        """根据年份和岗位获取记录"""
        return db.query(祈福司培训月度表).filter(
            祈福司培训月度表.年份 == year,
            祈福司培训月度表.岗位 == position,
        ).first()

    def get_by_year(
        self,
        db: Session,
        year: int,
    ) -> List[祈福司培训月度表]:
        """根据年份获取所有岗位的记录"""
        return db.query(祈福司培训月度表).filter(
            祈福司培训月度表.年份 == year
        ).order_by(祈福司培训月度表.岗位).all()

    def create(
        self,
        db: Session,
        obj_in: 祈福司培训月度表创建,
    ) -> 祈福司培训月度表:
        """创建记录"""
        db_obj = 祈福司培训月度表(**obj_in.model_dump())
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(
        self,
        db: Session,
        record_id: int,
        obj_in: 祈福司培训月度表更新,
    ) -> Optional[祈福司培训月度表]:
        """更新记录"""
        db_obj = self.get_by_id(db, record_id)
        if not db_obj:
            return None

        update_data = obj_in.model_dump(exclude_unset=True, exclude={"记录ID"})

        for field, value in update_data.items():
            setattr(db_obj, field, value)

        db.commit()
        db.refresh(db_obj)
        return db_obj

    def create_or_update(
        self,
        db: Session,
        year: int,
        position: str,
        monthly_data: dict,
    ) -> 祈福司培训月度表:
        """创建或更新记录（根据年份和岗位）"""
        existing = self.get_by_year_position(db, year, position)
        
        if existing:
            # 更新现有记录
            existing.月度数据 = monthly_data
            db.commit()
            db.refresh(existing)
            return existing
        else:
            # 创建新记录
            db_obj = 祈福司培训月度表(
                年份=year,
                岗位=position,
                月度数据=monthly_data,
            )
            db.add(db_obj)
            db.commit()
            db.refresh(db_obj)
            return db_obj

    def delete(self, db: Session, record_id: int) -> bool:
        """删除记录"""
        db_obj = self.get_by_id(db, record_id)
        if not db_obj:
            return False

        db.delete(db_obj)
        db.commit()
        return True


crud_training_monthly = CRUDTrainingMonthly()
