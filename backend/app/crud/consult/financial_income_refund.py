"""
财务收入和退费CRUD操作
007财务收入和退费 - 最高议事厅核心数据
"""

from decimal import Decimal
from typing import List, Optional, Tuple

from sqlalchemy import and_, desc
from sqlalchemy import func as sql_func
from sqlalchemy.orm import Session

from app.models.consult.financial_income_refund import 神殿月度财务数据, 最高议事厅核心数据汇总
from app.schemas.consult.financial_income_refund import (
    神殿月度财务数据创建,
    神殿月度财务数据更新,
    最高议事厅核心数据汇总创建,
    最高议事厅核心数据汇总更新,
)


class 神殿月度财务数据CRUD:
    """神殿月度财务数据CRUD操作"""

    @staticmethod
    def create(db: Session, obj_in: 神殿月度财务数据创建) -> 神殿月度财务数据:
        """创建记录"""
        db_obj = 神殿月度财务数据(
            年份=obj_in.年份,
            月份=obj_in.月份,
            神殿=obj_in.神殿,
            数据类型=obj_in.数据类型,
            计划收入=obj_in.计划收入 or Decimal("0"),
            实际收入=obj_in.实际收入 or Decimal("0"),
            计划招生=obj_in.计划招生 or 0,
            实际招生=obj_in.实际招生 or 0,
            退费人数=obj_in.退费人数 or 0,
            创建人ID=obj_in.创建人ID,
            创建人姓名=obj_in.创建人姓名,
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    @staticmethod
    def get_by_id(db: Session, record_id: int) -> Optional[神殿月度财务数据]:
        """根据ID获取记录"""
        return db.query(神殿月度财务数据).filter(
            神殿月度财务数据.记录ID == record_id
        ).first()

    @staticmethod
    def get_by_key(
        db: Session,
        year: int,
        month: int,
        campus: str,
        data_type: str
    ) -> Optional[神殿月度财务数据]:
        """根据年份、月份、神殿、数据类型获取唯一记录"""
        return db.query(神殿月度财务数据).filter(
            and_(
                神殿月度财务数据.年份 == year,
                神殿月度财务数据.月份 == month,
                神殿月度财务数据.神殿 == campus,
                神殿月度财务数据.数据类型 == data_type
            )
        ).first()

    @staticmethod
    def get_campus_monthly_data(
        db: Session,
        year: int,
        campus: str,
        data_type: str
    ) -> List[神殿月度财务数据]:
        """获取某神殿某年某数据类型的全年（1-12月）数据
        
        支持模糊匹配：移除省份前缀后进行匹配
        例如："河北主神殿" 会匹配 "主神殿"
        """
        # 先尝试精确匹配
        exact_result = db.query(神殿月度财务数据).filter(
            and_(
                神殿月度财务数据.年份 == year,
                神殿月度财务数据.神殿 == campus,
                神殿月度财务数据.数据类型 == data_type
            )
        ).order_by(神殿月度财务数据.月份).all()
        
        if exact_result:
            return exact_result
        
        # 如果精确匹配失败，尝试移除省份前缀后匹配
        core_name = campus.replace("神殿", "").strip()
        for prefix in ["河北", "广西", "贵州", "山西", "山东", "河南", "陕西", "甘肃", "内蒙古"]:
            if core_name.startswith(prefix):
                core_name = core_name[len(prefix):].strip()
                break
        
        # 如果移除了前缀，尝试用核心名称匹配
        if core_name != campus.replace("神殿", "").strip():
            fuzzy_campus = core_name + "神殿" if not core_name.endswith("神殿") else core_name
            return db.query(神殿月度财务数据).filter(
                and_(
                    神殿月度财务数据.年份 == year,
                    神殿月度财务数据.神殿 == fuzzy_campus,
                    神殿月度财务数据.数据类型 == data_type
                )
            ).order_by(神殿月度财务数据.月份).all()
        
        return []

    @staticmethod
    def get_campus_all_types(
        db: Session,
        year: int,
        campus: str
    ) -> List[神殿月度财务数据]:
        """获取某神殿某年所有数据类型的全部数据
        
        支持模糊匹配：移除省份前缀后进行匹配
        """
        # 先尝试精确匹配
        exact_result = db.query(神殿月度财务数据).filter(
            and_(
                神殿月度财务数据.年份 == year,
                神殿月度财务数据.神殿 == campus
            )
        ).order_by(神殿月度财务数据.数据类型, 神殿月度财务数据.月份).all()
        
        if exact_result:
            return exact_result
        
        # 如果精确匹配失败，尝试移除省份前缀后匹配
        core_name = campus.replace("神殿", "").strip()
        for prefix in ["河北", "广西", "贵州", "山西", "山东", "河南", "陕西", "甘肃", "内蒙古"]:
            if core_name.startswith(prefix):
                core_name = core_name[len(prefix):].strip()
                break
        
        if core_name != campus.replace("神殿", "").strip():
            fuzzy_campus = core_name + "神殿" if not core_name.endswith("神殿") else core_name
            return db.query(神殿月度财务数据).filter(
                and_(
                    神殿月度财务数据.年份 == year,
                    神殿月度财务数据.神殿 == fuzzy_campus
                )
            ).order_by(神殿月度财务数据.数据类型, 神殿月度财务数据.月份).all()
        
        return []

    @staticmethod
    def get_multi(
        db: Session,
        year: Optional[int] = None,
        campus: Optional[str] = None,
        data_type: Optional[str] = None,
        skip: int = 0,
        limit: int = 1000
    ) -> Tuple[List[神殿月度财务数据], int]:
        """获取记录列表（支持筛选和分页）"""
        query = db.query(神殿月度财务数据)

        conditions = []
        if year:
            conditions.append(神殿月度财务数据.年份 == year)
        if campus:
            conditions.append(神殿月度财务数据.神殿 == campus)
        if data_type:
            conditions.append(神殿月度财务数据.数据类型 == data_type)

        if conditions:
            query = query.filter(and_(*conditions))

        total = query.count()
        items = query.order_by(
            desc(神殿月度财务数据.年份),
            神殿月度财务数据.神殿,
            神殿月度财务数据.数据类型,
            神殿月度财务数据.月份
        ).offset(skip).limit(limit).all()

        return items, total

    @staticmethod
    def update(db: Session, obj_in: 神殿月度财务数据更新) -> Optional[神殿月度财务数据]:
        """更新记录"""
        db_obj = 神殿月度财务数据CRUD.get_by_id(db, obj_in.记录ID)
        if not db_obj:
            return None

        update_data = obj_in.model_dump(exclude_unset=True, exclude={'记录ID'})
        for field, value in update_data.items():
            if value is not None:
                setattr(db_obj, field, value)

        db.commit()
        db.refresh(db_obj)
        return db_obj

    @staticmethod
    def upsert(db: Session, obj_in: 神殿月度财务数据创建) -> 神殿月度财务数据:
        """创建或更新记录（根据年份、月份、神殿、数据类型）"""
        existing = 神殿月度财务数据CRUD.get_by_key(
            db, obj_in.年份, obj_in.月份, obj_in.神殿, obj_in.数据类型
        )

        if existing:
            # 更新现有记录
            if obj_in.计划收入 is not None:
                existing.计划收入 = obj_in.计划收入
            if obj_in.实际收入 is not None:
                existing.实际收入 = obj_in.实际收入
            if obj_in.计划招生 is not None:
                existing.计划招生 = obj_in.计划招生
            if obj_in.实际招生 is not None:
                existing.实际招生 = obj_in.实际招生
            if obj_in.退费人数 is not None:
                existing.退费人数 = obj_in.退费人数
            db.commit()
            db.refresh(existing)
            return existing
        else:
            # 创建新记录
            return 神殿月度财务数据CRUD.create(db, obj_in)

    @staticmethod
    def delete(db: Session, record_id: int) -> bool:
        """删除记录"""
        db_obj = 神殿月度财务数据CRUD.get_by_id(db, record_id)
        if not db_obj:
            return False
        db.delete(db_obj)
        db.commit()
        return True

    @staticmethod
    def get_yearly_summary_by_campus(
        db: Session,
        year: int,
        campus: str,
        data_type: str
    ) -> dict:
        """获取某神殿某年某数据类型的年度汇总
        
        支持模糊匹配：移除省份前缀后进行匹配
        """
        # 先尝试精确匹配
        result = db.query(
            sql_func.sum(神殿月度财务数据.计划收入).label('计划收入'),
            sql_func.sum(神殿月度财务数据.实际收入).label('实际收入'),
            sql_func.sum(神殿月度财务数据.计划招生).label('计划招生'),
            sql_func.sum(神殿月度财务数据.实际招生).label('实际招生'),
            sql_func.sum(神殿月度财务数据.退费人数).label('退费人数'),
        ).filter(
            and_(
                神殿月度财务数据.年份 == year,
                神殿月度财务数据.神殿 == campus,
                神殿月度财务数据.数据类型 == data_type
            )
        ).first()
        
        # 如果精确匹配有结果，直接返回
        if result and (result.计划收入 or result.实际收入 or result.计划招生 or result.实际招生 or result.退费人数):
            return {
                '计划收入': float(result.计划收入 or 0),
                '实际收入': float(result.实际收入 or 0),
                '计划招生': int(result.计划招生 or 0),
                '实际招生': int(result.实际招生 or 0),
                '退费人数': int(result.退费人数 or 0),
            }
        
        # 如果精确匹配失败，尝试移除省份前缀后匹配
        core_name = campus.replace("神殿", "").strip()
        for prefix in ["河北", "广西", "贵州", "山西", "山东", "河南", "陕西", "甘肃", "内蒙古"]:
            if core_name.startswith(prefix):
                core_name = core_name[len(prefix):].strip()
                break
        
        if core_name != campus.replace("神殿", "").strip():
            fuzzy_campus = core_name + "神殿" if not core_name.endswith("神殿") else core_name
            result = db.query(
                sql_func.sum(神殿月度财务数据.计划收入).label('计划收入'),
                sql_func.sum(神殿月度财务数据.实际收入).label('实际收入'),
                sql_func.sum(神殿月度财务数据.计划招生).label('计划招生'),
                sql_func.sum(神殿月度财务数据.实际招生).label('实际招生'),
                sql_func.sum(神殿月度财务数据.退费人数).label('退费人数'),
            ).filter(
                and_(
                    神殿月度财务数据.年份 == year,
                    神殿月度财务数据.神殿 == fuzzy_campus,
                    神殿月度财务数据.数据类型 == data_type
                )
            ).first()

        return {
            '计划收入': float(result.计划收入 or 0),
            '实际收入': float(result.实际收入 or 0),
            '计划招生': int(result.计划招生 or 0),
            '实际招生': int(result.实际招生 or 0),
            '退费人数': int(result.退费人数 or 0),
        }

    @staticmethod
    def get_all_campus_yearly_plan_summary(
        db: Session,
        year: int,
        data_type: str
    ) -> list:
        """获取所有神殿某年某数据类型的年度计划汇总（用于子表1神殿汇总）
        
        从神殿月度财务数据表按神殿分组聚合，返回每个神殿的年度计划收入和计划招生。
        替代原来从咨询师维度聚合的方式。
        """
        results = db.query(
            神殿月度财务数据.神殿,
            sql_func.sum(神殿月度财务数据.计划收入).label('计划收入'),
            sql_func.sum(神殿月度财务数据.计划招生).label('计划招生'),
        ).filter(
            and_(
                神殿月度财务数据.年份 == year,
                神殿月度财务数据.数据类型 == data_type
            )
        ).group_by(神殿月度财务数据.神殿).all()

        return [
            {
                '神殿': r.神殿,
                '计划收入': float(r.计划收入 or 0),
                '计划招生': int(r.计划招生 or 0),
            }
            for r in results
        ]


class 最高议事厅核心数据汇总CRUD:
    """最高议事厅核心数据汇总CRUD操作"""

    @staticmethod
    def create(db: Session, obj_in: 最高议事厅核心数据汇总创建) -> 最高议事厅核心数据汇总:
        """创建记录"""
        db_obj = 最高议事厅核心数据汇总(
            年份=obj_in.年份,
            神殿=obj_in.神殿,
            数据类型=obj_in.数据类型,
            计划收入=obj_in.计划收入 or Decimal("0"),
            实际收入=obj_in.实际收入 or Decimal("0"),
            计划招生=obj_in.计划招生 or 0,
            实际招生=obj_in.实际招生 or 0,
            退费人数=obj_in.退费人数 or 0,
            创建人ID=obj_in.创建人ID,
            创建人姓名=obj_in.创建人姓名,
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    @staticmethod
    def get_by_id(db: Session, record_id: int) -> Optional[最高议事厅核心数据汇总]:
        """根据ID获取记录"""
        return db.query(最高议事厅核心数据汇总).filter(
            最高议事厅核心数据汇总.记录ID == record_id
        ).first()

    @staticmethod
    def get_by_key(
        db: Session,
        year: int,
        campus: str,
        data_type: str
    ) -> Optional[最高议事厅核心数据汇总]:
        """根据年份、神殿、数据类型获取唯一记录"""
        return db.query(最高议事厅核心数据汇总).filter(
            and_(
                最高议事厅核心数据汇总.年份 == year,
                最高议事厅核心数据汇总.神殿 == campus,
                最高议事厅核心数据汇总.数据类型 == data_type
            )
        ).first()

    @staticmethod
    def get_by_year_and_type(
        db: Session,
        year: int,
        data_type: str
    ) -> List[最高议事厅核心数据汇总]:
        """获取某年某数据类型的所有神殿数据（用于TAB1）"""
        return db.query(最高议事厅核心数据汇总).filter(
            and_(
                最高议事厅核心数据汇总.年份 == year,
                最高议事厅核心数据汇总.数据类型 == data_type
            )
        ).order_by(最高议事厅核心数据汇总.神殿).all()

    @staticmethod
    def get_all_by_year(
        db: Session,
        year: int
    ) -> List[最高议事厅核心数据汇总]:
        """获取某年所有神殿所有数据类型的数据"""
        return db.query(最高议事厅核心数据汇总).filter(
            最高议事厅核心数据汇总.年份 == year
        ).order_by(
            最高议事厅核心数据汇总.数据类型,
            最高议事厅核心数据汇总.神殿
        ).all()

    @staticmethod
    def update(db: Session, obj_in: 最高议事厅核心数据汇总更新) -> Optional[最高议事厅核心数据汇总]:
        """更新记录"""
        db_obj = 最高议事厅核心数据汇总CRUD.get_by_id(db, obj_in.记录ID)
        if not db_obj:
            return None

        update_data = obj_in.model_dump(exclude_unset=True, exclude={'记录ID'})
        for field, value in update_data.items():
            if value is not None:
                setattr(db_obj, field, value)

        db.commit()
        db.refresh(db_obj)
        return db_obj

    @staticmethod
    def upsert(db: Session, obj_in: 最高议事厅核心数据汇总创建) -> 最高议事厅核心数据汇总:
        """创建或更新记录（根据年份、神殿、数据类型）"""
        existing = 最高议事厅核心数据汇总CRUD.get_by_key(
            db, obj_in.年份, obj_in.神殿, obj_in.数据类型
        )

        if existing:
            # 更新现有记录
            if obj_in.计划收入 is not None:
                existing.计划收入 = obj_in.计划收入
            if obj_in.实际收入 is not None:
                existing.实际收入 = obj_in.实际收入
            if obj_in.计划招生 is not None:
                existing.计划招生 = obj_in.计划招生
            if obj_in.实际招生 is not None:
                existing.实际招生 = obj_in.实际招生
            if obj_in.退费人数 is not None:
                existing.退费人数 = obj_in.退费人数
            db.commit()
            db.refresh(existing)
            return existing
        else:
            # 创建新记录
            return 最高议事厅核心数据汇总CRUD.create(db, obj_in)

    @staticmethod
    def delete(db: Session, record_id: int) -> bool:
        """删除记录"""
        db_obj = 最高议事厅核心数据汇总CRUD.get_by_id(db, record_id)
        if not db_obj:
            return False
        db.delete(db_obj)
        db.commit()
        return True

    @staticmethod
    def sync_from_monthly_data(
        db: Session,
        year: int,
        campus: str,
        data_type: str
    ) -> 最高议事厅核心数据汇总:
        """从神殿月度数据同步汇总数据"""
        # 获取年度汇总
        summary = 神殿月度财务数据CRUD.get_yearly_summary_by_campus(
            db, year, campus, data_type
        )

        # 创建或更新汇总记录
        obj_in = 最高议事厅核心数据汇总创建(
            年份=year,
            神殿=campus,
            数据类型=data_type,
            计划收入=Decimal(str(summary['计划收入'])),
            实际收入=Decimal(str(summary['实际收入'])),
            计划招生=summary['计划招生'],
            实际招生=summary['实际招生'],
            退费人数=summary['退费人数'],
        )

        return 最高议事厅核心数据汇总CRUD.upsert(db, obj_in)

    @staticmethod
    def get_total_by_year_and_type(
        db: Session,
        year: int,
        data_type: str
    ) -> dict:
        """获取某年某数据类型的所有神殿总计"""
        result = db.query(
            sql_func.sum(最高议事厅核心数据汇总.计划收入).label('计划收入'),
            sql_func.sum(最高议事厅核心数据汇总.实际收入).label('实际收入'),
            sql_func.sum(最高议事厅核心数据汇总.计划招生).label('计划招生'),
            sql_func.sum(最高议事厅核心数据汇总.实际招生).label('实际招生'),
            sql_func.sum(最高议事厅核心数据汇总.退费人数).label('退费人数'),
        ).filter(
            and_(
                最高议事厅核心数据汇总.年份 == year,
                最高议事厅核心数据汇总.数据类型 == data_type
            )
        ).first()

        return {
            '计划收入': float(result.计划收入 or 0),
            '实际收入': float(result.实际收入 or 0),
            '计划招生': int(result.计划招生 or 0),
            '实际招生': int(result.实际招生 or 0),
            '退费人数': int(result.退费人数 or 0),
        }
