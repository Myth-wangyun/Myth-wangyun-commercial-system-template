"""
祈福司员工功能分析 CRUD 操作
"""

from typing import Dict, List, Optional

from sqlalchemy import and_, text
from sqlalchemy.orm import Session

from app.models.consult.staff_function import 员工功能分析评分表
from app.schemas.consult.staff_function import (
    SCORE_NO_TO_FIELD,
    员工功能分析评分创建,
    员工功能分析评分更新,
)


class 员工功能分析评分CRUD:
    """员工功能分析评分表 CRUD 操作"""

    @staticmethod
    def get_by_id(db: Session, record_id: int) -> Optional[员工功能分析评分表]:
        """根据ID获取记录"""
        return db.query(员工功能分析评分表).filter(员工功能分析评分表.记录ID == record_id).first()

    @staticmethod
    def get_by_year_campus_staff(db: Session, year: int, campus: str, staff_id: str) -> Optional[员工功能分析评分表]:
        """根据年份、神殿和员工ID获取记录"""
        return db.query(员工功能分析评分表).filter(
            and_(
                员工功能分析评分表.年份 == year,
                员工功能分析评分表.神殿 == campus,
                员工功能分析评分表.员工ID == staff_id
            )
        ).first()

    @staticmethod
    def get_by_year_campus(db: Session, year: int, campus: str) -> List[员工功能分析评分表]:
        """获取指定年份和神殿的所有员工评分记录"""
        return db.query(员工功能分析评分表).filter(
            and_(员工功能分析评分表.年份 == year, 员工功能分析评分表.神殿 == campus)
        ).all()

    @staticmethod
    def get_by_year(db: Session, year: int) -> List[员工功能分析评分表]:
        """获取指定年份的所有神殿记录"""
        return db.query(员工功能分析评分表).filter(员工功能分析评分表.年份 == year).all()

    @staticmethod
    def create(db: Session, data: 员工功能分析评分创建) -> 员工功能分析评分表:
        """创建记录"""
        db_obj = 员工功能分析评分表(**data.model_dump())
        db_obj.calculate_total()
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    @staticmethod
    def update(db: Session, record_id: int, data: 员工功能分析评分更新) -> Optional[员工功能分析评分表]:
        """更新记录"""
        db_obj = 员工功能分析评分CRUD.get_by_id(db, record_id)
        if not db_obj:
            return None
        
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if value is not None:
                setattr(db_obj, field, value)
        
        db_obj.calculate_total()
        db.commit()
        db.refresh(db_obj)
        return db_obj

    @staticmethod
    def upsert(db: Session, year: int, campus: str, staff_id: str, 
               staff_name: str, staff_position: str, staff_role: str,
               scores: Dict[str, int]) -> 员工功能分析评分表:
        """创建或更新员工评分记录"""
        existing = 员工功能分析评分CRUD.get_by_year_campus_staff(db, year, campus, staff_id)
        
        if existing:
            # 更新现有记录
            existing.员工姓名 = staff_name
            existing.员工岗位 = staff_position
            existing.员工角色 = staff_role
            
            for field, score in scores.items():
                if hasattr(existing, field):
                    setattr(existing, field, score)
            
            existing.calculate_total()
            db.commit()
            db.refresh(existing)
            return existing
        else:
            # 创建新记录
            create_data = {
                "年份": year,
                "神殿": campus,
                "员工ID": staff_id,
                "员工姓名": staff_name,
                "员工岗位": staff_position,
                "员工角色": staff_role,
                **scores
            }
            db_obj = 员工功能分析评分表(**create_data)
            db_obj.calculate_total()
            db.add(db_obj)
            db.commit()
            db.refresh(db_obj)
            return db_obj

    @staticmethod
    def update_single_score(db: Session, year: int, campus: str, staff_id: str, 
                           item_no: int, score: int) -> Optional[员工功能分析评分表]:
        """更新单个评分项"""
        existing = 员工功能分析评分CRUD.get_by_year_campus_staff(db, year, campus, staff_id)
        
        if not existing:
            return None
        
        field_name = SCORE_NO_TO_FIELD.get(item_no)
        if not field_name:
            return None
        
        setattr(existing, field_name, score)
        existing.calculate_total()
        db.commit()
        db.refresh(existing)
        return existing

    @staticmethod
    def delete(db: Session, record_id: int) -> bool:
        """删除记录"""
        db_obj = 员工功能分析评分CRUD.get_by_id(db, record_id)
        if not db_obj:
            return False
        db.delete(db_obj)
        db.commit()
        return True

    @staticmethod
    def delete_by_year_campus(db: Session, year: int, campus: str) -> int:
        """删除指定年份和神殿的所有记录"""
        count = db.query(员工功能分析评分表).filter(
            and_(员工功能分析评分表.年份 == year, 员工功能分析评分表.神殿 == campus)
        ).delete()
        db.commit()
        return count

    @staticmethod
    def get_campus_staff_from_users(db: Session, campus: str) -> Dict:
        """
        从 public.users 表获取指定神殿祈福司的员工列表
        返回分类后的员工：校长、干部、咨询师
        """
        query = text("""
            SELECT 
                user_id,
                real_name,
                position,
                role,
                campus
            FROM public.users
            WHERE campus LIKE :campus_pattern
            AND department = '祈福司'
            AND status = 'ACTIVE'
            ORDER BY 
                CASE 
                    WHEN position LIKE '%校长%' THEN 1
                    WHEN position LIKE '%经理%' OR position LIKE '%主管%' THEN 2
                    WHEN position LIKE '%干部%' THEN 3
                    ELSE 4
                END,
                real_name
        """)
        
        result = db.execute(query, {"campus_pattern": f"%{campus}%"})
        rows = result.fetchall()
        
        principals = []
        managers = []
        consultants = []
        
        for row in rows:
            staff = {
                "id": str(row.user_id),
                "name": row.real_name,
                "position": row.position,
                "role": row.role
            }
            
            position = row.position or ''
            role = row.role or ''
            
            if '校长' in position:
                principals.append(staff)
            elif '经理' in position or '主管' in position or role == 'MANAGER':
                managers.append(staff)
            else:
                consultants.append(staff)
        
        return {
            "campus": campus,
            "principal": principals[0] if principals else None,
            "managers": managers,
            "consultants": consultants,
            "manager_count": len(managers),
            "consultant_count": len(consultants),
            "total_count": len(managers) + len(consultants)
        }

    @staticmethod
    def build_score_map(records: List[员工功能分析评分表]) -> Dict[str, int]:
        """
        将评分记录转换为 {staffId}_{itemNo}: score 的映射格式
        方便前端直接使用
        """
        score_map = {}
        
        for record in records:
            staff_id = record.员工ID
            
            for item_no, field_name in SCORE_NO_TO_FIELD.items():
                score = getattr(record, field_name, 0) or 0
                # 格式与前端一致: staffId_itemNo
                key = f"{staff_id}_{item_no}"
                score_map[key] = score
        
        return score_map
