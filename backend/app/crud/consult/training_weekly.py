"""
祈福司培训周度表 CRUD 操作
"""

from decimal import Decimal
from typing import List, Optional

from sqlalchemy import and_, extract, func
from sqlalchemy.orm import Session

from app.models.consult.training_weekly import 祈福司培训周度表
from app.schemas.consult.training_weekly import (
    祈福司培训周度表创建,
    祈福司培训周度表更新,
)


class CRUDTrainingWeekly:
    """祈福司培训周度表 CRUD"""

    def get_by_id(self, db: Session, record_id: int) -> Optional[祈福司培训周度表]:
        """根据ID获取记录"""
        return db.query(祈福司培训周度表).filter(祈福司培训周度表.记录ID == record_id).first()

    def get_by_year(
        self,
        db: Session,
        year: int,
        skip: int = 0,
        limit: int = 100,
        position: Optional[str] = None,
        campus: Optional[str] = None,
    ) -> tuple[List[祈福司培训周度表], int]:
        """根据年份获取记录列表"""
        query = db.query(祈福司培训周度表).filter(祈福司培训周度表.年份 == year)

        if position:
            query = query.filter(祈福司培训周度表.岗位 == position)

        if campus:
            query = query.filter(祈福司培训周度表.神殿 == campus)

        total = query.count()
        records = query.order_by(
            祈福司培训周度表.培训时间.desc().nullslast(),
            祈福司培训周度表.创建时间.desc(),
        ).offset(skip).limit(limit).all()

        return records, total

    def get_by_year_month(
        self,
        db: Session,
        year: int,
        month: int,
        skip: int = 0,
        limit: int = 100,
    ) -> tuple[List[祈福司培训周度表], int]:
        """根据年月获取记录列表"""
        query = db.query(祈福司培训周度表).filter(
            and_(
                祈福司培训周度表.年份 == year,
                extract('month', 祈福司培训周度表.培训时间) == month,
            )
        )

        total = query.count()
        records = query.order_by(
            祈福司培训周度表.培训时间.desc().nullslast(),
            祈福司培训周度表.创建时间.desc(),
        ).offset(skip).limit(limit).all()

        return records, total

    def create(
        self,
        db: Session,
        obj_in: 祈福司培训周度表创建,
    ) -> 祈福司培训周度表:
        """创建记录"""
        # 自动计算合格率
        if obj_in.培训人次 and obj_in.培训人次 > 0:
            pass_rate = (obj_in.合格人数 or 0) / obj_in.培训人次 * 100
            obj_in.考试合格率 = Decimal(str(round(pass_rate, 2)))
        
        db_obj = 祈福司培训周度表(**obj_in.model_dump())
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(
        self,
        db: Session,
        record_id: int,
        obj_in: 祈福司培训周度表更新,
    ) -> Optional[祈福司培训周度表]:
        """更新记录"""
        db_obj = self.get_by_id(db, record_id)
        if not db_obj:
            return None

        update_data = obj_in.model_dump(exclude_unset=True, exclude={"记录ID"})
        
        # 自动计算合格率
        trainees = update_data.get("培训人次", db_obj.培训人次)
        qualified = update_data.get("合格人数", db_obj.合格人数)
        if trainees and trainees > 0:
            pass_rate = (qualified or 0) / trainees * 100
            update_data["考试合格率"] = round(pass_rate, 2)

        for field, value in update_data.items():
            setattr(db_obj, field, value)

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

    def batch_create(
        self,
        db: Session,
        obj_in_list: List[祈福司培训周度表创建],
    ) -> List[祈福司培训周度表]:
        """批量创建记录"""
        db_objs = []
        for obj_in in obj_in_list:
            # 自动计算合格率
            if obj_in.培训人次 and obj_in.培训人次 > 0:
                pass_rate = (obj_in.合格人数 or 0) / obj_in.培训人次 * 100
                obj_in.考试合格率 = Decimal(str(round(pass_rate, 2)))
            
            db_obj = 祈福司培训周度表(**obj_in.model_dump())
            db_objs.append(db_obj)

        db.add_all(db_objs)
        db.commit()
        for db_obj in db_objs:
            db.refresh(db_obj)
        return db_objs

    def get_statistics_by_year(self, db: Session, year: int) -> dict:
        """获取年度统计数据"""
        query = db.query(
            func.count(祈福司培训周度表.记录ID).label('total_records'),
            func.sum(祈福司培训周度表.培训人次).label('total_trainees'),
            func.sum(祈福司培训周度表.合格人数).label('total_qualified'),
            func.avg(祈福司培训周度表.平均成绩).label('avg_score'),
        ).filter(祈福司培训周度表.年份 == year)

        result = query.first()
        
        total_trainees = result.total_trainees or 0
        total_qualified = result.total_qualified or 0
        pass_rate = (total_qualified / total_trainees * 100) if total_trainees > 0 else 0

        return {
            'total_records': result.total_records or 0,
            'total_trainees': total_trainees,
            'total_qualified': total_qualified,
            'overall_pass_rate': round(pass_rate, 2),
            'avg_score': round(float(result.avg_score), 2) if result.avg_score else 0,
        }


crud_training_weekly = CRUDTrainingWeekly()
