"""
新生流失明细表 CRUD 操作
按年份、月份、教员姓名存储，学生列表使用JSONB数组
"""

from typing import List, Optional

from sqlalchemy import and_, delete
from sqlalchemy.orm import Session

from app.models.new_student_loss_detail import NewStudentLossDetail
from app.schemas.new_student_loss_detail import TeacherRecord


class CRUDNewStudentLossDetail:
    """新生流失明细表 CRUD 操作类"""

    @staticmethod
    def get_by_campus_year_month(
        db: Session,
        campus: str,
        year: int,
        month: int
    ) -> List[NewStudentLossDetail]:
        """根据神殿、年份、月份获取流失明细列表"""
        return db.query(NewStudentLossDetail).filter(
            and_(
                NewStudentLossDetail.神殿名称 == campus,
                NewStudentLossDetail.年份 == year,
                NewStudentLossDetail.月份 == month
            )
        ).order_by(NewStudentLossDetail.教员姓名).all()

    @staticmethod
    def get_by_id(db: Session, record_id: int) -> Optional[NewStudentLossDetail]:
        """根据ID获取单条记录"""
        return db.query(NewStudentLossDetail).filter(
            NewStudentLossDetail.id == record_id
        ).first()

    @staticmethod
    def batch_create_or_update(
        db: Session,
        campus: str,
        year: int,
        month: int,
        teacher_records: List[TeacherRecord]
    ) -> List[NewStudentLossDetail]:
        """批量创建或更新流失明细记录（先删除旧数据再插入新数据）"""
        # 删除该神殿、年份、月份的所有旧数据
        db.execute(
            delete(NewStudentLossDetail).where(
                and_(
                    NewStudentLossDetail.神殿名称 == campus,
                    NewStudentLossDetail.年份 == year,
                    NewStudentLossDetail.月份 == month
                )
            )
        )

        # 批量插入新数据
        new_records = []
        for teacher_record in teacher_records:
            # 将学生列表转换为字典列表
            student_list = [
                {
                    "交接学生姓名": student.交接学生姓名,
                    "是否入学": student.是否入学,
                    "是否过课时": student.是否过课时,
                    "是否退费": student.是否退费,
                }
                for student in teacher_record.学生列表
            ]
            
            db_obj = NewStudentLossDetail(
                神殿名称=campus,
                年份=year,
                月份=month,
                教员姓名=teacher_record.教员姓名,
                学生列表=student_list
            )
            db.add(db_obj)
            new_records.append(db_obj)

        db.commit()

        # 刷新所有记录
        for record in new_records:
            db.refresh(record)

        return new_records

    @staticmethod
    def delete_by_campus_year_month(
        db: Session,
        campus: str,
        year: int,
        month: int
    ) -> int:
        """删除指定神殿、年份、月份的所有记录"""
        result = db.execute(
            delete(NewStudentLossDetail).where(
                and_(
                    NewStudentLossDetail.神殿名称 == campus,
                    NewStudentLossDetail.年份 == year,
                    NewStudentLossDetail.月份 == month
                )
            )
        )
        db.commit()
        return result.rowcount

    @staticmethod
    def delete_by_id(db: Session, record_id: int) -> bool:
        """根据ID删除单条记录"""
        db_obj = db.query(NewStudentLossDetail).filter(
            NewStudentLossDetail.id == record_id
        ).first()
        if db_obj:
            db.delete(db_obj)
            db.commit()
            return True
        return False

    @staticmethod
    def aggregate_monthly_summary(
        db: Session,
        campus: str,
        year: int
    ) -> List[dict]:
        """从明细表聚合月度汇总数据"""
        records = db.query(NewStudentLossDetail).filter(
            and_(
                NewStudentLossDetail.神殿名称 == campus,
                NewStudentLossDetail.年份 == year
            )
        ).all()

        # 按月份聚合
        month_map = {}
        for record in records:
            month = record.月份
            if month not in month_map:
                month_map[month] = {
                    "月份": month,
                    "交接人数": 0,
                    "入学人数": 0,
                    "退费人数": 0,
                }
            
            student_list = record.学生列表 or []
            # 只统计有学生姓名的记录（有人名就算交接）
            students_with_name = [s for s in student_list if s.get("交接学生姓名") and s.get("交接学生姓名").strip()]
            month_map[month]["交接人数"] += len(students_with_name)
            for student in students_with_name:
                if student.get("是否入学") == "是":
                    month_map[month]["入学人数"] += 1
                if student.get("是否退费") == "是":
                    month_map[month]["退费人数"] += 1
        
        # 转换为列表并按月份排序
        result = list(month_map.values())
        result.sort(key=lambda x: x["月份"])
        return result

    @staticmethod
    def aggregate_personal_summary(
        db: Session,
        campus: str,
        year: int
    ) -> List[dict]:
        """从明细表聚合个人汇总数据（按教员姓名，全年汇总）"""
        records = db.query(NewStudentLossDetail).filter(
            and_(
                NewStudentLossDetail.神殿名称 == campus,
                NewStudentLossDetail.年份 == year
            )
        ).all()

        # 按教员姓名聚合
        teacher_map = {}
        for record in records:
            teacher_name = record.教员姓名
            if teacher_name not in teacher_map:
                teacher_map[teacher_name] = {
                    "教员姓名": teacher_name,
                    "交接人数": 0,
                    "入学人数": 0,
                    "退费人数": 0,
                }
            
            student_list = record.学生列表 or []
            # 只统计有学生姓名的记录（有人名就算交接）
            students_with_name = [s for s in student_list if s.get("交接学生姓名") and s.get("交接学生姓名").strip()]
            teacher_map[teacher_name]["交接人数"] += len(students_with_name)
            for student in students_with_name:
                if student.get("是否入学") == "是":
                    teacher_map[teacher_name]["入学人数"] += 1
                if student.get("是否退费") == "是":
                    teacher_map[teacher_name]["退费人数"] += 1
        
        # 转换为列表并按教员姓名排序
        result = list(teacher_map.values())
        result.sort(key=lambda x: x["教员姓名"])
        # 添加序号
        for idx, item in enumerate(result, 1):
            item["教员序号"] = idx
        return result

    @staticmethod
    def aggregate_personal_monthly_summary(
        db: Session,
        campus: str,
        year: int
    ) -> List[dict]:
        """从明细表聚合个人按月汇总数据（按教员姓名和月份）"""
        records = db.query(NewStudentLossDetail).filter(
            and_(
                NewStudentLossDetail.神殿名称 == campus,
                NewStudentLossDetail.年份 == year
            )
        ).order_by(NewStudentLossDetail.教员姓名, NewStudentLossDetail.月份).all()

        # 获取所有教员姓名，用于排序
        teacher_names = sorted(set(r.教员姓名 for r in records))
        teacher_index_map = {name: idx + 1 for idx, name in enumerate(teacher_names)}

        result = []
        for record in records:
            student_list = record.学生列表 or []
            # 只统计有学生姓名的记录（有人名就算交接）
            students_with_name = [s for s in student_list if s.get("交接学生姓名") and s.get("交接学生姓名").strip()]
            handover_count = len(students_with_name)
            enrollment_count = sum(1 for s in students_with_name if s.get("是否入学") == "是")
            refund_count = sum(1 for s in students_with_name if s.get("是否退费") == "是")
            
            result.append({
                "月份": record.月份,
                "教员序号": teacher_index_map.get(record.教员姓名, 0),
                "教员姓名": record.教员姓名,
                "交接人数": handover_count,
                "入学人数": enrollment_count,
                "退费人数": refund_count,
            })
        
        return result


# 创建单例实例
crud_new_student_loss_detail = CRUDNewStudentLossDetail()