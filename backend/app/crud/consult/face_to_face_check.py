"""
当面标准化检查表CRUD操作
"""

from datetime import datetime
from typing import List, Optional

from sqlalchemy import and_, desc
from sqlalchemy.orm import Session

from app.models.consult.face_to_face_check import 当面标准化检查表, 当面标准化模板配置
from app.schemas.consult.face_to_face_check import (
    当面标准化检查表创建,
    当面标准化检查表更新,
    当面标准化模板配置创建,
    当面标准化模板配置更新,
)

# ==================== 当面标准化检查表 CRUD ====================

class 当面标准化检查表CRUD:
    """当面标准化检查表CRUD操作"""

    @staticmethod
    def create(db: Session, obj_in: 当面标准化检查表创建) -> 当面标准化检查表:
        """创建记录"""
        db_obj = 当面标准化检查表(
            咨询日期=obj_in.咨询日期,
            学员姓名=obj_in.学员姓名,
            性别=obj_in.性别,
            年龄=obj_in.年龄,
            状态=obj_in.状态,
            需求=obj_in.需求,
            关注点=obj_in.关注点,
            抗拒点=obj_in.抗拒点,
            陪同人=obj_in.陪同人,
            决策人=obj_in.决策人,
            地区=obj_in.地区,
            记录类型=obj_in.记录类型,
            关联预案ID=obj_in.关联预案ID,
            咨询步骤内容=obj_in.咨询步骤内容,
            自我总结=obj_in.自我总结,
            领导指正=obj_in.领导指正,
            创建人ID=obj_in.创建人ID,
            创建人姓名=obj_in.创建人姓名,
            神殿=obj_in.神殿,
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    @staticmethod
    def get_by_id(db: Session, record_id: int) -> Optional[当面标准化检查表]:
        """根据ID获取记录"""
        return db.query(当面标准化检查表).filter(
            当面标准化检查表.记录ID == record_id
        ).first()

    @staticmethod
    def get_multi(
        db: Session,
        record_type: Optional[str] = None,
        student_name: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        campus: Optional[str] = None,
        creator_id: Optional[int] = None,
        skip: int = 0,
        limit: int = 20
    ) -> tuple[List[当面标准化检查表], int]:
        """获取记录列表"""
        query = db.query(当面标准化检查表)

        # 构建查询条件
        conditions = []
        
        if record_type:
            conditions.append(当面标准化检查表.记录类型 == record_type)
        
        if student_name:
            conditions.append(当面标准化检查表.学员姓名.like(f"%{student_name}%"))
        
        if start_date:
            conditions.append(当面标准化检查表.咨询日期 >= start_date)
        
        if end_date:
            conditions.append(当面标准化检查表.咨询日期 <= end_date)
        
        if campus:
            conditions.append(当面标准化检查表.神殿 == campus)
        
        if creator_id:
            conditions.append(当面标准化检查表.创建人ID == creator_id)

        if conditions:
            query = query.filter(and_(*conditions))

        # 获取总数
        total = query.count()

        # 分页查询
        records = query.order_by(desc(当面标准化检查表.咨询日期)).offset(skip).limit(limit).all()

        return records, total

    @staticmethod
    def update(
        db: Session,
        db_obj: 当面标准化检查表,
        obj_in: 当面标准化检查表更新
    ) -> 当面标准化检查表:
        """更新记录"""
        update_data = obj_in.model_dump(exclude_unset=True)
        
        for field, value in update_data.items():
            if hasattr(db_obj, field):
                setattr(db_obj, field, value)
        
        db.commit()
        db.refresh(db_obj)
        return db_obj

    @staticmethod
    def delete(db: Session, record_id: int) -> bool:
        """删除记录"""
        obj = db.query(当面标准化检查表).filter(
            当面标准化检查表.记录ID == record_id
        ).first()
        
        if obj:
            db.delete(obj)
            db.commit()
            return True
        return False

    @staticmethod
    def get_by_plan_id(db: Session, plan_id: int) -> List[当面标准化检查表]:
        """根据预案ID获取复盘记录"""
        return db.query(当面标准化检查表).filter(
            当面标准化检查表.关联预案ID == plan_id
        ).all()


# ==================== 当面标准化模板配置 CRUD ====================

class 当面标准化模板配置CRUD:
    """当面标准化模板配置CRUD操作"""

    @staticmethod
    def create(db: Session, obj_in: 当面标准化模板配置创建) -> 当面标准化模板配置:
        """创建模板"""
        # 如果设置为默认模板，取消同类型的其他默认模板
        if obj_in.是否默认 == 1:
            db.query(当面标准化模板配置).filter(
                and_(
                    当面标准化模板配置.模板类型 == obj_in.模板类型,
                    当面标准化模板配置.是否默认 == 1,
                    当面标准化模板配置.神殿 == obj_in.神殿 if obj_in.神殿 else True
                )
            ).update({"是否默认": 0})
        
        db_obj = 当面标准化模板配置(
            模板名称=obj_in.模板名称,
            模板类型=obj_in.模板类型,
            咨询步骤配置=obj_in.咨询步骤配置,
            基本信息字段配置=obj_in.基本信息字段配置,
            是否启用=obj_in.是否启用,
            是否默认=obj_in.是否默认,
            排序序号=obj_in.排序序号,
            备注=obj_in.备注,
            创建人ID=obj_in.创建人ID,
            创建人姓名=obj_in.创建人姓名,
            神殿=obj_in.神殿,
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    @staticmethod
    def get_by_id(db: Session, template_id: int) -> Optional[当面标准化模板配置]:
        """根据ID获取模板"""
        return db.query(当面标准化模板配置).filter(
            当面标准化模板配置.模板ID == template_id
        ).first()

    @staticmethod
    def get_multi(
        db: Session,
        template_type: Optional[str] = None,
        is_enabled: Optional[int] = None,
        campus: Optional[str] = None,
        skip: int = 0,
        limit: int = 20
    ) -> tuple[List[当面标准化模板配置], int]:
        """获取模板列表"""
        query = db.query(当面标准化模板配置)

        # 构建查询条件
        conditions = []
        
        if template_type:
            conditions.append(当面标准化模板配置.模板类型 == template_type)
        
        if is_enabled is not None:
            conditions.append(当面标准化模板配置.是否启用 == is_enabled)
        
        if campus:
            conditions.append(当面标准化模板配置.神殿 == campus)

        if conditions:
            query = query.filter(and_(*conditions))

        # 获取总数
        total = query.count()

        # 分页查询（按排序序号和创建时间排序）
        templates = query.order_by(
            当面标准化模板配置.排序序号,
            desc(当面标准化模板配置.创建时间)
        ).offset(skip).limit(limit).all()

        return templates, total

    @staticmethod
    def get_default_template(
        db: Session,
        template_type: str,
        campus: Optional[str] = None
    ) -> Optional[当面标准化模板配置]:
        """获取默认模板"""
        query = db.query(当面标准化模板配置).filter(
            and_(
                当面标准化模板配置.模板类型 == template_type,
                当面标准化模板配置.是否启用 == 1,
                当面标准化模板配置.是否默认 == 1
            )
        )
        
        if campus:
            query = query.filter(当面标准化模板配置.神殿 == campus)
        
        return query.first()

    @staticmethod
    def update(
        db: Session,
        db_obj: 当面标准化模板配置,
        obj_in: 当面标准化模板配置更新
    ) -> 当面标准化模板配置:
        """更新模板"""
        update_data = obj_in.model_dump(exclude_unset=True)
        
        # 如果设置为默认模板，取消同类型的其他默认模板
        if update_data.get("是否默认") == 1:
            template_type = update_data.get("模板类型", db_obj.模板类型)
            campus = update_data.get("神殿", db_obj.神殿)
            
            db.query(当面标准化模板配置).filter(
                and_(
                    当面标准化模板配置.模板类型 == template_type,
                    当面标准化模板配置.是否默认 == 1,
                    当面标准化模板配置.模板ID != db_obj.模板ID,
                    当面标准化模板配置.神殿 == campus if campus else True
                )
            ).update({"是否默认": 0})
        
        for field, value in update_data.items():
            if hasattr(db_obj, field):
                setattr(db_obj, field, value)
        
        db.commit()
        db.refresh(db_obj)
        return db_obj

    @staticmethod
    def delete(db: Session, template_id: int) -> bool:
        """删除模板"""
        obj = db.query(当面标准化模板配置).filter(
            当面标准化模板配置.模板ID == template_id
        ).first()
        
        if obj:
            # 如果是默认模板，不允许删除
            if obj.是否默认 == 1:
                raise ValueError("默认模板不能删除")
            
            db.delete(obj)
            db.commit()
            return True
        return False

    @staticmethod
    def set_default(db: Session, template_id: int) -> Optional[当面标准化模板配置]:
        """设置为默认模板"""
        obj = db.query(当面标准化模板配置).filter(
            当面标准化模板配置.模板ID == template_id
        ).first()
        
        if obj:
            # 取消同类型的其他默认模板
            db.query(当面标准化模板配置).filter(
                and_(
                    当面标准化模板配置.模板类型 == obj.模板类型,
                    当面标准化模板配置.是否默认 == 1,
                    当面标准化模板配置.模板ID != template_id,
                    当面标准化模板配置.神殿 == obj.神殿 if obj.神殿 else True
                )
            ).update({"是否默认": 0})
            
            # 设置为默认
            obj.是否默认 = 1
            db.commit()
            db.refresh(obj)
            return obj
        return None
