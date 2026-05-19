"""
咨询沟通记录CRUD操作
"""

from datetime import date, datetime
from typing import List, Optional, Tuple, TypedDict

from sqlalchemy import and_, desc, extract, func
from sqlalchemy.orm import Session

from app.models.consult.consultation_communication import 咨询沟通记录表
from app.schemas.consult.consultation_communication import (
    咨询沟通记录创建,
    咨询沟通记录更新,
)


class CommunicationStats(TypedDict, total=False):
    日期: str
    咨询师: str
    月份: int
    年份: int
    电话量: int
    网聊量: int
    当面量: int
    总沟通量: int
    总用时: float
    联系失败量: int
    平均用时: float
    联系成功量: int


def _base_stats() -> CommunicationStats:
    return {
        "电话量": 0,
        "网聊量": 0,
        "当面量": 0,
        "总沟通量": 0,
        "总用时": 0.0,
        "联系失败量": 0,
    }


class 咨询沟通记录CRUD:
    """咨询沟通记录CRUD操作"""

    @staticmethod
    def create(db: Session, obj_in: 咨询沟通记录创建, 创建人: Optional[str] = None) -> 咨询沟通记录表:
        """创建咨询沟通记录"""
        db_obj = 咨询沟通记录表(
            记录ID=obj_in.记录ID,
            对象ID=obj_in.对象ID,
            沟通时间=obj_in.沟通时间,
            用时=obj_in.用时 or 0,
            咨询师=obj_in.咨询师,
            沟通方式=obj_in.沟通方式,
            需求点=obj_in.需求点,
            关注点=obj_in.关注点,
            抗拒点=obj_in.抗拒点,
            咨询内容=obj_in.咨询内容,
            咨询结果=obj_in.咨询结果,
            报名意愿=obj_in.报名意愿,
            有需求=obj_in.有需求 or 0,
            有钱=obj_in.有钱 or 0,
            有时间=obj_in.有时间 or 0,
            有支持=obj_in.有支持 or 0,
            具备条件=obj_in.具备条件,
            课程意向=obj_in.课程意向,
            联系不上=obj_in.联系不上 or 0,
            预定回访时间=obj_in.预定回访时间,
            创建人=创建人,
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    @staticmethod
    def get_by_id(db: Session, 沟通ID: int) -> Optional[咨询沟通记录表]:
        """根据沟通ID获取记录"""
        return db.query(咨询沟通记录表).filter(咨询沟通记录表.沟通ID == 沟通ID).first()

    @staticmethod
    def get_by_record_id(db: Session, 记录ID: int) -> List[咨询沟通记录表]:
        """根据咨询量明细记录ID获取所有沟通记录"""
        return db.query(咨询沟通记录表).filter(
            咨询沟通记录表.记录ID == 记录ID
        ).order_by(desc(咨询沟通记录表.沟通时间)).all()

    @staticmethod
    def get_by_object_id(db: Session, 对象ID: int) -> List[咨询沟通记录表]:
        """根据咨询对象ID获取所有沟通记录"""
        return db.query(咨询沟通记录表).filter(
            咨询沟通记录表.对象ID == 对象ID
        ).order_by(desc(咨询沟通记录表.沟通时间)).all()

    @staticmethod
    def get_multi(
        db: Session,
        记录ID: Optional[int] = None,
        对象ID: Optional[int] = None,
        咨询师: Optional[str] = None,
        沟通方式: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        skip: int = 0,
        limit: int = 20
    ) -> Tuple[List[咨询沟通记录表], int]:
        """获取咨询沟通记录列表"""
        query = db.query(咨询沟通记录表)

        conditions = []
        
        if 记录ID:
            conditions.append(咨询沟通记录表.记录ID == 记录ID)
        
        if 对象ID:
            conditions.append(咨询沟通记录表.对象ID == 对象ID)
        
        if 咨询师:
            conditions.append(咨询沟通记录表.咨询师 == 咨询师)
        
        if 沟通方式:
            conditions.append(咨询沟通记录表.沟通方式 == 沟通方式)
        
        if start_date:
            conditions.append(咨询沟通记录表.沟通时间 >= start_date)
        
        if end_date:
            conditions.append(咨询沟通记录表.沟通时间 <= end_date)

        if conditions:
            query = query.filter(and_(*conditions))

        total = query.count()
        records = query.order_by(desc(咨询沟通记录表.沟通时间)).offset(skip).limit(limit).all()

        return records, total

    @staticmethod
    def update(db: Session, 沟通ID: int, obj_in: 咨询沟通记录更新) -> Optional[咨询沟通记录表]:
        """更新咨询沟通记录"""
        db_obj = db.query(咨询沟通记录表).filter(咨询沟通记录表.沟通ID == 沟通ID).first()
        if not db_obj:
            return None
        
        update_data = obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if hasattr(db_obj, field):
                setattr(db_obj, field, value)
        
        db.commit()
        db.refresh(db_obj)
        return db_obj

    @staticmethod
    def delete(db: Session, 沟通ID: int) -> bool:
        """删除咨询沟通记录"""
        db_obj = db.query(咨询沟通记录表).filter(咨询沟通记录表.沟通ID == 沟通ID).first()
        if not db_obj:
            return False
        db.delete(db_obj)
        db.commit()
        return True

    @staticmethod
    def count_by_record_id(db: Session, 记录ID: int) -> int:
        """统计某咨询量的沟通记录数"""
        return db.query(咨询沟通记录表).filter(咨询沟通记录表.记录ID == 记录ID).count()


class 电话量统计服务:
    """电话量统计服务"""

    @staticmethod
    def 按日期统计(
        db: Session,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        咨询师: Optional[str] = None,
        神殿: Optional[str] = None,
    ) -> List[CommunicationStats]:
        """按日期统计电话量/沟通量"""
        from app.models.consult.consultation_record import 咨询量明细表
        
        query = db.query(
            func.date(咨询沟通记录表.沟通时间).label('日期'),
            咨询沟通记录表.沟通方式,
            func.count(咨询沟通记录表.沟通ID).label('数量'),
            func.sum(咨询沟通记录表.用时).label('总用时'),
            func.sum(咨询沟通记录表.联系不上).label('联系失败数'),
        ).join(
            咨询量明细表, 咨询沟通记录表.记录ID == 咨询量明细表.记录ID
        )

        conditions = []
        
        if start_date:
            conditions.append(func.date(咨询沟通记录表.沟通时间) >= start_date)
        if end_date:
            conditions.append(func.date(咨询沟通记录表.沟通时间) <= end_date)
        if 咨询师:
            conditions.append(咨询沟通记录表.咨询师 == 咨询师)
        if 神殿:
            conditions.append(咨询量明细表.神殿 == 神殿)

        if conditions:
            query = query.filter(and_(*conditions))

        results = query.group_by(
            func.date(咨询沟通记录表.沟通时间),
            咨询沟通记录表.沟通方式
        ).all()

        # 汇总按日期
        date_stats: dict[str, CommunicationStats] = {}
        for row in results:
            date_key = str(row.日期)
            if date_key not in date_stats:
                date_stats[date_key] = {"日期": date_key, **_base_stats()}
            
            if row.沟通方式 == '电话':
                date_stats[date_key]['电话量'] = row.数量
            elif row.沟通方式 == '网聊':
                date_stats[date_key]['网聊量'] = row.数量
            elif row.沟通方式 == '当面':
                date_stats[date_key]['当面量'] = row.数量
            
            date_stats[date_key]['总沟通量'] += row.数量
            date_stats[date_key]['总用时'] += float(row.总用时 or 0)
            date_stats[date_key]['联系失败量'] += row.联系失败数 or 0

        # 计算平均用时
        for key in date_stats:
            total = date_stats[key]['总沟通量']
            if total > 0:
                date_stats[key]['平均用时'] = round(date_stats[key]['总用时'] / total, 2)
            else:
                date_stats[key]['平均用时'] = 0
            date_stats[key]['联系成功量'] = total - date_stats[key]['联系失败量']

        return list(date_stats.values())

    @staticmethod
    def 按咨询师统计(
        db: Session,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        神殿: Optional[str] = None,
    ) -> List[CommunicationStats]:
        """按咨询师统计电话量/沟通量"""
        from app.models.consult.consultation_record import 咨询量明细表
        
        query = db.query(
            咨询沟通记录表.咨询师,
            咨询沟通记录表.沟通方式,
            func.count(咨询沟通记录表.沟通ID).label('数量'),
            func.sum(咨询沟通记录表.用时).label('总用时'),
            func.sum(咨询沟通记录表.联系不上).label('联系失败数'),
        ).join(
            咨询量明细表, 咨询沟通记录表.记录ID == 咨询量明细表.记录ID
        )

        conditions = []
        
        if start_date:
            conditions.append(func.date(咨询沟通记录表.沟通时间) >= start_date)
        if end_date:
            conditions.append(func.date(咨询沟通记录表.沟通时间) <= end_date)
        if 神殿:
            conditions.append(咨询量明细表.神殿 == 神殿)

        if conditions:
            query = query.filter(and_(*conditions))

        results = query.group_by(
            咨询沟通记录表.咨询师,
            咨询沟通记录表.沟通方式
        ).all()

        # 汇总按咨询师
        consultant_stats: dict[str, CommunicationStats] = {}
        for row in results:
            name = row.咨询师 or '未知'
            if name not in consultant_stats:
                consultant_stats[name] = {"咨询师": name, **_base_stats()}
            
            if row.沟通方式 == '电话':
                consultant_stats[name]['电话量'] = row.数量
            elif row.沟通方式 == '网聊':
                consultant_stats[name]['网聊量'] = row.数量
            elif row.沟通方式 == '当面':
                consultant_stats[name]['当面量'] = row.数量
            
            consultant_stats[name]['总沟通量'] += row.数量
            consultant_stats[name]['总用时'] += float(row.总用时 or 0)
            consultant_stats[name]['联系失败量'] += row.联系失败数 or 0

        # 计算平均用时和联系成功量
        for name in consultant_stats:
            total = consultant_stats[name]['总沟通量']
            if total > 0:
                consultant_stats[name]['平均用时'] = round(consultant_stats[name]['总用时'] / total, 2)
            else:
                consultant_stats[name]['平均用时'] = 0
            consultant_stats[name]['联系成功量'] = total - consultant_stats[name]['联系失败量']

        return list(consultant_stats.values())

    @staticmethod
    def 按月份统计(
        db: Session,
        year: int,
        咨询师: Optional[str] = None,
        神殿: Optional[str] = None,
    ) -> List[CommunicationStats]:
        """按月份统计电话量/沟通量"""
        from app.models.consult.consultation_record import 咨询量明细表
        
        query = db.query(
            extract('month', 咨询沟通记录表.沟通时间).label('月份'),
            咨询沟通记录表.沟通方式,
            func.count(咨询沟通记录表.沟通ID).label('数量'),
            func.sum(咨询沟通记录表.用时).label('总用时'),
            func.sum(咨询沟通记录表.联系不上).label('联系失败数'),
        ).join(
            咨询量明细表, 咨询沟通记录表.记录ID == 咨询量明细表.记录ID
        ).filter(
            extract('year', 咨询沟通记录表.沟通时间) == year
        )

        conditions = []
        if 咨询师:
            conditions.append(咨询沟通记录表.咨询师 == 咨询师)
        if 神殿:
            conditions.append(咨询量明细表.神殿 == 神殿)

        if conditions:
            query = query.filter(and_(*conditions))

        results = query.group_by(
            extract('month', 咨询沟通记录表.沟通时间),
            咨询沟通记录表.沟通方式
        ).all()

        # 初始化12个月的数据
        monthly_stats: dict[int, CommunicationStats] = {}
        for m in range(1, 13):
            monthly_stats[m] = {"月份": m, "年份": year, **_base_stats()}

        for row in results:
            m = int(row.月份)
            if row.沟通方式 == '电话':
                monthly_stats[m]['电话量'] = row.数量
            elif row.沟通方式 == '网聊':
                monthly_stats[m]['网聊量'] = row.数量
            elif row.沟通方式 == '当面':
                monthly_stats[m]['当面量'] = row.数量
            
            monthly_stats[m]['总沟通量'] += row.数量
            monthly_stats[m]['总用时'] += float(row.总用时 or 0)
            monthly_stats[m]['联系失败量'] += row.联系失败数 or 0

        # 计算平均用时和联系成功量
        for m in monthly_stats:
            total = monthly_stats[m]['总沟通量']
            if total > 0:
                monthly_stats[m]['平均用时'] = round(monthly_stats[m]['总用时'] / total, 2)
            else:
                monthly_stats[m]['平均用时'] = 0
            monthly_stats[m]['联系成功量'] = total - monthly_stats[m]['联系失败量']

        return list(monthly_stats.values())

    @staticmethod
    def 按神殿年度统计(
        db: Session,
        year: int,
    ) -> List[dict]:
        """按神殿统计年度电话量/沟通量"""
        from app.models.consult.consultation_record import 咨询量明细表
        
        query = db.query(
            咨询量明细表.神殿,
            咨询沟通记录表.沟通方式,
            func.count(咨询沟通记录表.沟通ID).label('数量'),
            func.sum(咨询沟通记录表.用时).label('总用时'),
            func.sum(咨询沟通记录表.联系不上).label('联系失败数'),
        ).join(
            咨询量明细表, 咨询沟通记录表.记录ID == 咨询量明细表.记录ID
        ).filter(
            extract('year', 咨询沟通记录表.沟通时间) == year
        ).filter(
            咨询量明细表.神殿.isnot(None)
        ).group_by(
            咨询量明细表.神殿,
            咨询沟通记录表.沟通方式
        )
        
        results = query.all()

        # 按神殿汇总
        campus_stats = {}
        for row in results:
            campus = row.神殿
            if campus not in campus_stats:
                campus_stats[campus] = {
                    '神殿': campus,
                    '年份': year,
                    '电话量': 0,
                    '网聊量': 0,
                    '当面量': 0,
                    '总沟通量': 0,
                    '总用时': 0,
                    '联系失败量': 0,
                }
            
            if row.沟通方式 == '电话':
                campus_stats[campus]['电话量'] = row.数量
            elif row.沟通方式 == '网聊':
                campus_stats[campus]['网聊量'] = row.数量
            elif row.沟通方式 == '当面':
                campus_stats[campus]['当面量'] = row.数量
            
            campus_stats[campus]['总沟通量'] += row.数量
            campus_stats[campus]['总用时'] += row.总用时 or 0
            campus_stats[campus]['联系失败量'] += row.联系失败数 or 0

        # 计算平均用时和联系成功量
        for campus in campus_stats:
            total = campus_stats[campus]['总沟通量']
            if total > 0:
                campus_stats[campus]['平均用时'] = round(campus_stats[campus]['总用时'] / total, 2)
            else:
                campus_stats[campus]['平均用时'] = 0
            campus_stats[campus]['联系成功量'] = total - campus_stats[campus]['联系失败量']

        return list(campus_stats.values())
