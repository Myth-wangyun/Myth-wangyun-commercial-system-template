"""
祈福司人力资源基础信息表 CRUD 操作
"""

from typing import List, Optional

from sqlalchemy import and_
from sqlalchemy.orm import Session

from app.models.consult.hr_basic import 祈福司人员基础信息表
from app.schemas.consult.hr_basic import 人员基础信息创建, 人员基础信息更新


class 人员基础信息CRUD:
    """人员基础信息表 CRUD 操作"""

    @staticmethod
    def get_by_id(db: Session, record_id: int) -> Optional[祈福司人员基础信息表]:
        """根据ID获取记录"""
        return db.query(祈福司人员基础信息表).filter(祈福司人员基础信息表.记录ID == record_id).first()

    @staticmethod
    def get_by_year_campus_name(db: Session, year: int, campus: str, name: str) -> Optional[祈福司人员基础信息表]:
        """根据年份、神殿和姓名获取记录"""
        return db.query(祈福司人员基础信息表).filter(
            and_(
                祈福司人员基础信息表.年份 == year,
                祈福司人员基础信息表.神殿 == campus,
                祈福司人员基础信息表.姓名 == name
            )
        ).first()

    @staticmethod
    def get_by_year_campus(db: Session, year: int, campus: str) -> List[祈福司人员基础信息表]:
        """获取指定年份和神殿的所有人员记录"""
        return db.query(祈福司人员基础信息表).filter(
            and_(祈福司人员基础信息表.年份 == year, 祈福司人员基础信息表.神殿 == campus)
        ).order_by(祈福司人员基础信息表.序号).all()

    @staticmethod
    def get_by_year(db: Session, year: int) -> List[祈福司人员基础信息表]:
        """获取指定年份的所有记录"""
        return db.query(祈福司人员基础信息表).filter(
            祈福司人员基础信息表.年份 == year
        ).order_by(祈福司人员基础信息表.神殿, 祈福司人员基础信息表.序号).all()

    @staticmethod
    def create(db: Session, data: 人员基础信息创建) -> 祈福司人员基础信息表:
        """创建记录"""
        db_obj = 祈福司人员基础信息表(**data.model_dump())
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    @staticmethod
    def update(db: Session, record_id: int, data: 人员基础信息更新) -> Optional[祈福司人员基础信息表]:
        """更新记录"""
        db_obj = 人员基础信息CRUD.get_by_id(db, record_id)
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
    def upsert(db: Session, data: 人员基础信息创建) -> 祈福司人员基础信息表:
        """创建或更新记录（根据年份、神殿、姓名唯一约束）"""
        existing = 人员基础信息CRUD.get_by_year_campus_name(
            db, data.年份, data.神殿, data.姓名
        )
        
        if existing:
            # 更新现有记录
            update_dict = data.model_dump(exclude={'年份', '神殿', '姓名'})
            for field, value in update_dict.items():
                if value is not None:
                    setattr(existing, field, value)
            db.commit()
            db.refresh(existing)
            return existing
        else:
            # 创建新记录
            return 人员基础信息CRUD.create(db, data)

    @staticmethod
    def batch_upsert(db: Session, records: List[人员基础信息创建]) -> dict:
        """批量创建或更新记录"""
        success = 0
        failed = 0
        results = []
        
        for data in records:
            try:
                result = 人员基础信息CRUD.upsert(db, data)
                results.append(result)
                success += 1
            except Exception as e:
                failed += 1
                print(f"批量保存人员基础信息失败: {e}")
        
        return {
            "success": success,
            "failed": failed,
            "records": results
        }

    @staticmethod
    def delete(db: Session, record_id: int) -> bool:
        """删除记录"""
        db_obj = 人员基础信息CRUD.get_by_id(db, record_id)
        if not db_obj:
            return False
        
        db.delete(db_obj)
        db.commit()
        return True

    @staticmethod
    def delete_by_year_campus(db: Session, year: int, campus: str) -> int:
        """删除指定年份和神殿的所有记录"""
        count = db.query(祈福司人员基础信息表).filter(
            and_(祈福司人员基础信息表.年份 == year, 祈福司人员基础信息表.神殿 == campus)
        ).delete()
        db.commit()
        return count

    @staticmethod
    def delete_by_year(db: Session, year: int) -> int:
        """删除指定年份的所有记录"""
        count = db.query(祈福司人员基础信息表).filter(
            祈福司人员基础信息表.年份 == year
        ).delete()
        db.commit()
        return count
