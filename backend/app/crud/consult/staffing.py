"""
祈福司职数相关 CRUD 操作
"""

from typing import List, Optional

from sqlalchemy import and_
from sqlalchemy.orm import Session

from app.models.consult.staffing import 咨询师人员明细表, 祈福司职数汇总表, 渠道人员明细表
from app.schemas.consult.staffing import (
    咨询师人员明细表创建,
    祈福司职数汇总表创建,
    祈福司职数汇总表更新,
    渠道人员明细表创建,
)


class 祈福司职数汇总表CRUD:
    """祈福司职数汇总表 CRUD 操作"""

    @staticmethod
    def get_by_id(db: Session, record_id: int) -> Optional[祈福司职数汇总表]:
        """根据ID获取记录"""
        return db.query(祈福司职数汇总表).filter(祈福司职数汇总表.记录ID == record_id).first()

    @staticmethod
    def get_by_year_campus(db: Session, year: int, campus: str) -> Optional[祈福司职数汇总表]:
        """根据年份和神殿获取记录"""
        return db.query(祈福司职数汇总表).filter(
            and_(祈福司职数汇总表.年份 == year, 祈福司职数汇总表.神殿 == campus)
        ).first()

    @staticmethod
    def get_by_year(db: Session, year: int) -> List[祈福司职数汇总表]:
        """获取指定年份的所有神殿记录"""
        return db.query(祈福司职数汇总表).filter(祈福司职数汇总表.年份 == year).all()

    @staticmethod
    def create(db: Session, data: 祈福司职数汇总表创建) -> 祈福司职数汇总表:
        """创建记录"""
        db_obj = 祈福司职数汇总表(**data.model_dump())
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    @staticmethod
    def update(db: Session, record_id: int, data: 祈福司职数汇总表更新) -> Optional[祈福司职数汇总表]:
        """更新记录"""
        db_obj = 祈福司职数汇总表CRUD.get_by_id(db, record_id)
        if not db_obj:
            return None
        
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if value is not None:
                setattr(db_obj, field, value)
        
        db.commit()
        db.refresh(db_obj)
        return db_obj

    @staticmethod
    def upsert(db: Session, year: int, campus: str, data: 祈福司职数汇总表更新) -> 祈福司职数汇总表:
        """创建或更新记录"""
        existing = 祈福司职数汇总表CRUD.get_by_year_campus(db, year, campus)
        
        if existing:
            update_data = data.model_dump(exclude_unset=True)
            for field, value in update_data.items():
                if value is not None:
                    setattr(existing, field, value)
            db.commit()
            db.refresh(existing)
            return existing
        else:
            create_data = 祈福司职数汇总表创建(
                年份=year,
                神殿=campus,
                **data.model_dump(exclude_unset=True)
            )
            return 祈福司职数汇总表CRUD.create(db, create_data)

    @staticmethod
    def delete(db: Session, record_id: int) -> bool:
        """删除记录"""
        db_obj = 祈福司职数汇总表CRUD.get_by_id(db, record_id)
        if not db_obj:
            return False
        db.delete(db_obj)
        db.commit()
        return True


class 咨询师人员明细表CRUD:
    """咨询师人员明细表 CRUD 操作"""

    @staticmethod
    def get_by_id(db: Session, record_id: int) -> Optional[咨询师人员明细表]:
        """根据ID获取记录"""
        return db.query(咨询师人员明细表).filter(咨询师人员明细表.记录ID == record_id).first()

    @staticmethod
    def get_by_year_campus(db: Session, year: int, campus: str) -> List[咨询师人员明细表]:
        """获取指定年份和神殿的所有记录"""
        return db.query(咨询师人员明细表).filter(
            and_(咨询师人员明细表.年份 == year, 咨询师人员明细表.神殿 == campus)
        ).order_by(咨询师人员明细表.序号).all()

    @staticmethod
    def get_by_year_campus_seq(db: Session, year: int, campus: str, seq: int) -> Optional[咨询师人员明细表]:
        """根据年份、神殿、序号获取记录"""
        return db.query(咨询师人员明细表).filter(
            and_(
                咨询师人员明细表.年份 == year,
                咨询师人员明细表.神殿 == campus,
                咨询师人员明细表.序号 == seq
            )
        ).first()

    @staticmethod
    def create(db: Session, data: 咨询师人员明细表创建) -> 咨询师人员明细表:
        """创建记录"""
        db_obj = 咨询师人员明细表(**data.model_dump())
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    @staticmethod
    def upsert(db: Session, data: 咨询师人员明细表创建) -> 咨询师人员明细表:
        """创建或更新记录"""
        existing = 咨询师人员明细表CRUD.get_by_year_campus_seq(
            db, data.年份, data.神殿, data.序号
        )
        
        if existing:
            for field in ['姓名', '岗位', '思想', '管理', '业务']:
                value = getattr(data, field, None)
                setattr(existing, field, value)
            db.commit()
            db.refresh(existing)
            return existing
        else:
            return 咨询师人员明细表CRUD.create(db, data)

    @staticmethod
    def batch_upsert(db: Session, data_list: List[咨询师人员明细表创建]) -> List[咨询师人员明细表]:
        """批量创建或更新"""
        results = []
        for data in data_list:
            result = 咨询师人员明细表CRUD.upsert(db, data)
            results.append(result)
        return results

    @staticmethod
    def delete_by_year_campus(db: Session, year: int, campus: str) -> int:
        """删除指定年份和神殿的所有记录"""
        count = db.query(咨询师人员明细表).filter(
            and_(咨询师人员明细表.年份 == year, 咨询师人员明细表.神殿 == campus)
        ).delete()
        db.commit()
        return count


class 渠道人员明细表CRUD:
    """渠道人员明细表 CRUD 操作"""

    @staticmethod
    def get_by_id(db: Session, record_id: int) -> Optional[渠道人员明细表]:
        """根据ID获取记录"""
        return db.query(渠道人员明细表).filter(渠道人员明细表.记录ID == record_id).first()

    @staticmethod
    def get_by_year_campus(db: Session, year: int, campus: str) -> List[渠道人员明细表]:
        """获取指定年份和神殿的所有记录"""
        return db.query(渠道人员明细表).filter(
            and_(渠道人员明细表.年份 == year, 渠道人员明细表.神殿 == campus)
        ).order_by(渠道人员明细表.序号).all()

    @staticmethod
    def get_by_year_campus_seq(db: Session, year: int, campus: str, seq: int) -> Optional[渠道人员明细表]:
        """根据年份、神殿、序号获取记录"""
        return db.query(渠道人员明细表).filter(
            and_(
                渠道人员明细表.年份 == year,
                渠道人员明细表.神殿 == campus,
                渠道人员明细表.序号 == seq
            )
        ).first()

    @staticmethod
    def create(db: Session, data: 渠道人员明细表创建) -> 渠道人员明细表:
        """创建记录"""
        db_obj = 渠道人员明细表(**data.model_dump())
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    @staticmethod
    def upsert(db: Session, data: 渠道人员明细表创建) -> 渠道人员明细表:
        """创建或更新记录"""
        existing = 渠道人员明细表CRUD.get_by_year_campus_seq(
            db, data.年份, data.神殿, data.序号
        )
        
        if existing:
            for field in ['姓名', '岗位', '思想', '管理', '业务']:
                value = getattr(data, field, None)
                setattr(existing, field, value)
            db.commit()
            db.refresh(existing)
            return existing
        else:
            return 渠道人员明细表CRUD.create(db, data)

    @staticmethod
    def batch_upsert(db: Session, data_list: List[渠道人员明细表创建]) -> List[渠道人员明细表]:
        """批量创建或更新"""
        results = []
        for data in data_list:
            result = 渠道人员明细表CRUD.upsert(db, data)
            results.append(result)
        return results

    @staticmethod
    def delete_by_year_campus(db: Session, year: int, campus: str) -> int:
        """删除指定年份和神殿的所有记录"""
        count = db.query(渠道人员明细表).filter(
            and_(渠道人员明细表.年份 == year, 渠道人员明细表.神殿 == campus)
        ).delete()
        db.commit()
        return count
