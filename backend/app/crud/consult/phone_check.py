"""
电话标准化检查表 CRUD 操作
"""

from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import and_, asc, desc, or_
from sqlalchemy.orm import Session

from app.models.consult.phone_check import 电话标准化检查表, 电话标准化模板配置


class 电话标准化检查表CRUD:
    """电话标准化检查表 CRUD 操作类"""

    @staticmethod
    def create(db: Session, obj_in: Dict[str, Any]) -> 电话标准化检查表:
        """创建记录"""
        db_obj = 电话标准化检查表(**obj_in)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    @staticmethod
    def get_by_id(db: Session, record_id: int) -> Optional[电话标准化检查表]:
        """根据ID获取记录"""
        return db.query(电话标准化检查表).filter(
            电话标准化检查表.记录ID == record_id
        ).first()

    @staticmethod
    def get_multi(
        db: Session,
        consultant: Optional[str] = None,
        campus: Optional[str] = None,
        auditor: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        creator_id: Optional[int] = None,
        skip: int = 0,
        limit: int = 20
    ) -> tuple[List[电话标准化检查表], int]:
        """获取记录列表"""
        query = db.query(电话标准化检查表)

        # 构建查询条件
        conditions = []
        
        if consultant:
            conditions.append(电话标准化检查表.咨询师.like(f"%{consultant}%"))
        
        if campus:
            conditions.append(电话标准化检查表.神殿 == campus)
        
        if auditor:
            conditions.append(电话标准化检查表.审核人.like(f"%{auditor}%"))
        
        if start_date:
            conditions.append(电话标准化检查表.日期 >= start_date)
        
        if end_date:
            conditions.append(电话标准化检查表.日期 <= end_date)
        
        if creator_id:
            conditions.append(电话标准化检查表.创建人ID == creator_id)

        if conditions:
            query = query.filter(and_(*conditions))

        # 获取总数
        total = query.count()

        # 分页查询
        records = query.order_by(desc(电话标准化检查表.日期)).offset(skip).limit(limit).all()

        return records, total

    @staticmethod
    def update(
        db: Session,
        db_obj: 电话标准化检查表,
        obj_in: Dict[str, Any]
    ) -> 电话标准化检查表:
        """更新记录"""
        for field, value in obj_in.items():
            if hasattr(db_obj, field) and value is not None:
                setattr(db_obj, field, value)
        
        db.commit()
        db.refresh(db_obj)
        return db_obj

    @staticmethod
    def delete(db: Session, record_id: int) -> bool:
        """删除记录"""
        obj = db.query(电话标准化检查表).filter(
            电话标准化检查表.记录ID == record_id
        ).first()
        
        if obj:
            db.delete(obj)
            db.commit()
            return True
        return False

    @staticmethod
    def get_by_consultant(
        db: Session,
        consultant: str,
        skip: int = 0,
        limit: int = 50
    ) -> tuple[List[电话标准化检查表], int]:
        """根据咨询师获取记录"""
        query = db.query(电话标准化检查表).filter(
            电话标准化检查表.咨询师 == consultant
        )

        total = query.count()
        records = query.order_by(desc(电话标准化检查表.日期)).offset(skip).limit(limit).all()

        return records, total


class 电话标准化模板配置CRUD:
    """电话标准化模板配置 CRUD 操作类"""

    @staticmethod
    def create(db: Session, obj_in: Dict[str, Any]) -> 电话标准化模板配置:
        """创建模板"""
        # 如果设置为默认模板，取消其他默认模板
        if obj_in.get("是否默认") == 1:
            campus = obj_in.get("神殿")
            conditions = [电话标准化模板配置.是否默认 == 1]
            if campus:
                conditions.append(电话标准化模板配置.神殿 == campus)
            
            db.query(电话标准化模板配置).filter(and_(*conditions)).update({"是否默认": 0})
        
        db_obj = 电话标准化模板配置(**obj_in)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    @staticmethod
    def get_by_id(db: Session, template_id: int) -> Optional[电话标准化模板配置]:
        """根据ID获取模板"""
        return db.query(电话标准化模板配置).filter(
            电话标准化模板配置.模板ID == template_id
        ).first()

    @staticmethod
    def get_multi(
        db: Session,
        is_enabled: Optional[int] = None,
        campus: Optional[str] = None,
        skip: int = 0,
        limit: int = 20
    ) -> tuple[List[电话标准化模板配置], int]:
        """获取模板列表"""
        query = db.query(电话标准化模板配置)

        # 构建查询条件
        conditions = []
        
        if is_enabled is not None:
            conditions.append(电话标准化模板配置.是否启用 == is_enabled)
        
        if campus:
            conditions.append(
                or_(
                    电话标准化模板配置.神殿 == campus,
                    电话标准化模板配置.神殿.is_(None)
                )
            )

        if conditions:
            query = query.filter(and_(*conditions))

        # 获取总数
        total = query.count()

        # 分页查询（按排序序号和创建时间排序）
        templates = query.order_by(
            asc(电话标准化模板配置.排序序号),
            desc(电话标准化模板配置.创建时间)
        ).offset(skip).limit(limit).all()

        return templates, total

    @staticmethod
    def get_default_template(
        db: Session,
        campus: Optional[str] = None
    ) -> Optional[电话标准化模板配置]:
        """获取默认模板"""
        query = db.query(电话标准化模板配置).filter(
            and_(
                电话标准化模板配置.是否启用 == 1,
                电话标准化模板配置.是否默认 == 1
            )
        )
        
        if campus:
            query = query.filter(
                or_(
                    电话标准化模板配置.神殿 == campus,
                    电话标准化模板配置.神殿.is_(None)
                )
            )
        
        return query.first()

    @staticmethod
    def update(
        db: Session,
        db_obj: 电话标准化模板配置,
        obj_in: Dict[str, Any]
    ) -> 电话标准化模板配置:
        """更新模板"""
        # 如果设置为默认模板，取消其他默认模板
        if obj_in.get("是否默认") == 1:
            campus = obj_in.get("神殿", db_obj.神殿)
            conditions = [
                电话标准化模板配置.是否默认 == 1,
                电话标准化模板配置.模板ID != db_obj.模板ID
            ]
            if campus:
                conditions.append(电话标准化模板配置.神殿 == campus)
            
            db.query(电话标准化模板配置).filter(and_(*conditions)).update({"是否默认": 0})
        
        for field, value in obj_in.items():
            if hasattr(db_obj, field) and value is not None:
                setattr(db_obj, field, value)
        
        db.commit()
        db.refresh(db_obj)
        return db_obj

    @staticmethod
    def delete(db: Session, template_id: int) -> bool:
        """删除模板"""
        obj = db.query(电话标准化模板配置).filter(
            电话标准化模板配置.模板ID == template_id
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
    def set_default(db: Session, template_id: int) -> Optional[电话标准化模板配置]:
        """设置为默认模板"""
        obj = db.query(电话标准化模板配置).filter(
            电话标准化模板配置.模板ID == template_id
        ).first()
        
        if obj:
            # 取消其他默认模板
            campus = obj.神殿
            conditions = [
                电话标准化模板配置.是否默认 == 1,
                电话标准化模板配置.模板ID != template_id
            ]
            if campus:
                conditions.append(电话标准化模板配置.神殿 == campus)
            
            db.query(电话标准化模板配置).filter(and_(*conditions)).update({"是否默认": 0})
            
            # 设置为默认
            obj.是否默认 = 1
            db.commit()
            db.refresh(obj)
            return obj
        return None
