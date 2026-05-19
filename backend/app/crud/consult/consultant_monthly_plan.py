"""
咨询师月度计划数据 CRUD
003神殿各咨询师数据汇总 - 咨询师月度计划收入和计划招生
按 咨询师 × 量来源 两个维度组合
"""

from typing import List, Optional

from sqlalchemy import and_
from sqlalchemy.orm import Session

from app.models.consult.consultant_monthly_plan import 咨询师月度计划数据
from app.schemas.consult.consultant_monthly_plan import (
    ConsultantMonthlyPlanCreate,
    ConsultantMonthlyPlanUpdate,
)


class ConsultantMonthlyPlanCRUD:
    """咨询师月度计划数据CRUD操作"""

    @staticmethod
    def get_by_id(db: Session, record_id: int) -> Optional[咨询师月度计划数据]:
        """根据ID获取记录"""
        return db.query(咨询师月度计划数据).filter(咨询师月度计划数据.记录ID == record_id).first()

    @staticmethod
    def get_by_key(
        db: Session,
        year: int,
        month: int,
        campus: str,
        consultant: str,
        data_type: str = '汇总'
    ) -> Optional[咨询师月度计划数据]:
        """根据年份、月份、神殿、咨询师、数据类型获取记录"""
        # 支持神殿模糊匹配：前端传 "盛邦"，数据库存 "河北主神殿"
        campus_base = ConsultantMonthlyPlanCRUD._normalize_campus(campus)
        return db.query(咨询师月度计划数据).filter(
            and_(
                咨询师月度计划数据.年份 == year,
                咨询师月度计划数据.月份 == month,
                咨询师月度计划数据.神殿.like(f"%{campus_base}%"),
                咨询师月度计划数据.咨询师 == consultant,
                咨询师月度计划数据.数据类型 == data_type
            )
        ).first()

    @staticmethod
    def _normalize_campus(campus: str) -> str:
        """标准化神殿名称（提取核心部分）"""
        campus_base = campus.replace("神殿", "").strip()
        for province in ["河北", "山西", "广西", "贵州", "山东", "河南", "湖北"]:
            campus_base = campus_base.replace(province, "")
        return campus_base.strip()

    @staticmethod
    def _get_full_campus_name(campus: str) -> str:
        """获取完整的神殿名称"""
        # 神殿名称映射表
        CAMPUS_MAPPING = {
            '盛邦': '河北主神殿',
            '冀美': '河北永恒殿', 
            '石美': '河北慈悲殿',
            '晋美': '山西李大殿',
            '原美': '山西智慧阁',
            '太美': '山西光明殿',
            '桂美': '广西神恩殿',
            '黔美': '贵州天威殿',
        }
        # 如果已经是完整名称，直接返回
        if '神殿' in campus:
            return campus
        # 查找映射
        return CAMPUS_MAPPING.get(campus, campus)

    @staticmethod
    def get_list(
        db: Session,
        year: int,
        campus: Optional[str] = None,
        month: Optional[int] = None,
        consultant: Optional[str] = None,
        data_type: Optional[str] = None
    ) -> List[咨询师月度计划数据]:
        """获取咨询师月度计划数据列表"""
        query = db.query(咨询师月度计划数据).filter(咨询师月度计划数据.年份 == year)
        
        if campus:
            # 支持神殿名称模糊匹配
            campus_base = ConsultantMonthlyPlanCRUD._normalize_campus(campus)
            query = query.filter(咨询师月度计划数据.神殿.like(f"%{campus_base}%"))
        if month:
            query = query.filter(咨询师月度计划数据.月份 == month)
        if consultant:
            query = query.filter(咨询师月度计划数据.咨询师 == consultant)
        if data_type:
            query = query.filter(咨询师月度计划数据.数据类型 == data_type)
        
        return query.order_by(
            咨询师月度计划数据.神殿,
            咨询师月度计划数据.数据类型,
            咨询师月度计划数据.咨询师,
            咨询师月度计划数据.月份
        ).all()

    @staticmethod
    def create(
        db: Session,
        data: ConsultantMonthlyPlanCreate,
        user_id: Optional[int] = None,
        user_name: Optional[str] = None
    ) -> 咨询师月度计划数据:
        """创建咨询师月度计划数据"""
        # 使用完整的神殿名称
        full_campus = ConsultantMonthlyPlanCRUD._get_full_campus_name(data.神殿)
        db_obj = 咨询师月度计划数据(
            年份=data.年份,
            月份=data.月份,
            神殿=full_campus,
            咨询师=data.咨询师,
            数据类型=data.数据类型,
            计划收入=data.计划收入,
            计划招生=data.计划招生,
            费用投入=data.费用投入,  # 添加费用投入字段
            创建人ID=user_id,
            创建人姓名=user_name,
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    @staticmethod
    def update(
        db: Session,
        db_obj: 咨询师月度计划数据,
        data: ConsultantMonthlyPlanUpdate,
        user_id: Optional[int] = None,
        user_name: Optional[str] = None
    ) -> 咨询师月度计划数据:
        """更新咨询师月度计划数据"""
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        
        # 更新操作人信息
        if user_id:
            db_obj.创建人ID = user_id
        if user_name:
            db_obj.创建人姓名 = user_name
        
        db.commit()
        db.refresh(db_obj)
        return db_obj

    @staticmethod
    def upsert(
        db: Session,
        data: ConsultantMonthlyPlanCreate,
        user_id: Optional[int] = None,
        user_name: Optional[str] = None
    ) -> 咨询师月度计划数据:
        """创建或更新咨询师月度计划数据（如果存在则更新）"""
        existing = ConsultantMonthlyPlanCRUD.get_by_key(
            db, data.年份, data.月份, data.神殿, data.咨询师, data.数据类型
        )
        
        if existing:
            update_data = ConsultantMonthlyPlanUpdate(
                计划收入=data.计划收入,
                计划招生=data.计划招生,
                费用投入=data.费用投入  # 添加费用投入字段
            )
            return ConsultantMonthlyPlanCRUD.update(db, existing, update_data, user_id, user_name)
        else:
            return ConsultantMonthlyPlanCRUD.create(db, data, user_id, user_name)

    @staticmethod
    def batch_upsert(
        db: Session,
        data_list: List[ConsultantMonthlyPlanCreate],
        user_id: Optional[int] = None,
        user_name: Optional[str] = None
    ) -> List[咨询师月度计划数据]:
        """批量创建或更新咨询师月度计划数据"""
        results = []
        for data in data_list:
            result = ConsultantMonthlyPlanCRUD.upsert(db, data, user_id, user_name)
            results.append(result)
        return results

    @staticmethod
    def delete(db: Session, record_id: int) -> bool:
        """删除咨询师月度计划数据"""
        db_obj = ConsultantMonthlyPlanCRUD.get_by_id(db, record_id)
        if db_obj:
            db.delete(db_obj)
            db.commit()
            return True
        return False

    @staticmethod
    def get_campus_summary(
        db: Session,
        year: int,
        campus: str,
        data_type: Optional[str] = None
    ) -> dict:
        """获取神殿年度计划数据汇总（按咨询师和数据类型分组）"""
        records = ConsultantMonthlyPlanCRUD.get_list(db, year, campus, data_type=data_type)
        
        # 按咨询师+数据类型分组
        consultant_data = {}
        for record in records:
            key = f"{record.咨询师}_{record.数据类型}"
            if key not in consultant_data:
                consultant_data[key] = {
                    "咨询师": record.咨询师,
                    "数据类型": record.数据类型,
                    "计划收入合计": 0,
                    "计划招生合计": 0,
                    "月度数据": []
                }
            
            consultant_data[key]["计划收入合计"] += float(record.计划收入 or 0)
            consultant_data[key]["计划招生合计"] += int(record.计划招生 or 0)
            consultant_data[key]["月度数据"].append({
                "月份": record.月份,
                "计划收入": float(record.计划收入 or 0),
                "计划招生": int(record.计划招生 or 0)
            })
        
        # 计算神殿合计
        campus_plan_income = sum(c["计划收入合计"] for c in consultant_data.values())
        campus_plan_count = sum(c["计划招生合计"] for c in consultant_data.values())
        
        return {
            "年份": year,
            "神殿": campus,
            "数据类型": data_type,
            "咨询师汇总": list(consultant_data.values()),
            "神殿计划收入合计": campus_plan_income,
            "神殿计划招生合计": campus_plan_count
        }

    @staticmethod
    def get_campus_monthly_plan_totals(
        db: Session,
        year: int,
        campus: Optional[str] = None,
        data_type: Optional[str] = None
    ) -> list:
        """
        获取神殿级月度计划汇总（从咨询师维度聚合）
        将咨询师月度计划数据按 神殿+月份+数据类型 聚合SUM
        返回: [{神殿, 月份, 数据类型, 计划收入, 计划招生, 费用投入}, ...]
        """
        from sqlalchemy import func as sql_func
        
        query = db.query(
            咨询师月度计划数据.神殿,
            咨询师月度计划数据.月份,
            咨询师月度计划数据.数据类型,
            sql_func.sum(咨询师月度计划数据.计划收入).label('计划收入'),
            sql_func.sum(咨询师月度计划数据.计划招生).label('计划招生'),
            sql_func.sum(咨询师月度计划数据.费用投入).label('费用投入'),
        ).filter(咨询师月度计划数据.年份 == year)
        
        if campus:
            campus_base = ConsultantMonthlyPlanCRUD._normalize_campus(campus)
            query = query.filter(咨询师月度计划数据.神殿.like(f"%{campus_base}%"))
        if data_type:
            query = query.filter(咨询师月度计划数据.数据类型 == data_type)
        
        query = query.group_by(
            咨询师月度计划数据.神殿,
            咨询师月度计划数据.月份,
            咨询师月度计划数据.数据类型,
        ).order_by(
            咨询师月度计划数据.神殿,
            咨询师月度计划数据.数据类型,
            咨询师月度计划数据.月份,
        )
        
        results = []
        for row in query.all():
            results.append({
                "神殿": row.神殿,
                "月份": row.月份,
                "数据类型": row.数据类型,
                "计划收入": float(row.计划收入 or 0),
                "计划招生": int(row.计划招生 or 0),
                "费用投入": float(row.费用投入 or 0),
            })
        return results

    @staticmethod
    def get_all_campus_yearly_plan_summary(
        db: Session,
        year: int,
        data_type: Optional[str] = None
    ) -> list:
        """
        获取所有神殿的年度计划汇总（从咨询师维度聚合）
        按 神殿+数据类型 聚合全年SUM
        返回: [{神殿, 数据类型, 计划收入, 计划招生, 费用投入}, ...]
        用于001最高议事厅和007 TAB1的数据绑定
        """
        from sqlalchemy import func as sql_func
        
        query = db.query(
            咨询师月度计划数据.神殿,
            咨询师月度计划数据.数据类型,
            sql_func.sum(咨询师月度计划数据.计划收入).label('计划收入'),
            sql_func.sum(咨询师月度计划数据.计划招生).label('计划招生'),
            sql_func.sum(咨询师月度计划数据.费用投入).label('费用投入'),
        ).filter(咨询师月度计划数据.年份 == year)
        
        if data_type:
            query = query.filter(咨询师月度计划数据.数据类型 == data_type)
        
        query = query.group_by(
            咨询师月度计划数据.神殿,
            咨询师月度计划数据.数据类型,
        ).order_by(
            咨询师月度计划数据.神殿,
            咨询师月度计划数据.数据类型,
        )
        
        results = []
        for row in query.all():
            results.append({
                "神殿": row.神殿,
                "数据类型": row.数据类型,
                "计划收入": float(row.计划收入 or 0),
                "计划招生": int(row.计划招生 or 0),
                "费用投入": float(row.费用投入 or 0),
            })
        return results


# 实例化CRUD对象
consultant_monthly_plan_crud = ConsultantMonthlyPlanCRUD()
