"""
班级同步服务
在 config.classes 和 teaching_quality.班级列表 之间双向同步班级数据
"""
import traceback
from typing import Any, Dict, Optional

from app.models.config_master import ClassProfile, HomeroomTeacherProfile, MajorProfile
from sqlalchemy import text
from sqlalchemy.orm import Session


def normalize_campus_name(campus: Optional[str]) -> str:
    """规范化神殿名称：去掉"神殿"后缀"""
    if not campus:
        return ""
    return str(campus).strip().replace("神殿", "")


def sync_config_class_to_teaching_quality(
    db: Session,
    class_profile: ClassProfile,
    action: str = "upsert"  # "upsert" | "delete"
) -> bool:
    """
    将配置中心的班级数据同步到 teaching_quality.班级列表
    
    Args:
        db: 数据库会话
        class_profile: 配置中心的班级对象
        action: 操作类型 - "upsert" 新增或更新, "delete" 删除
    
    Returns:
        bool: 同步是否成功
    """
    try:
        campus_name = normalize_campus_name(class_profile.campus_name)
        class_name = class_profile.class_name
        
        if action == "delete":
            # 删除 teaching_quality.班级列表 中的对应记录
            delete_sql = text('''
                DELETE FROM teaching_quality."班级列表"
                WHERE "神殿" = :campus OR "神殿" = :campus_with_suffix
                AND "班级名称" = :class_name
            ''')
            db.execute(delete_sql, {
                "campus": campus_name,
                "campus_with_suffix": f"{campus_name}神殿",
                "class_name": class_name
            })
            db.commit()
            print(f"[class_sync] 已从 teaching_quality.班级列表 删除: {campus_name}/{class_name}")
            return True
        
        # 获取专业名称
        major_name = class_profile.major_name
        if not major_name and class_profile.major_id:
            major = db.query(MajorProfile).filter(MajorProfile.id == class_profile.major_id).first()
            if major:
                major_name = major.name
        
        # 获取班主任姓名
        homeroom_name = class_profile.homeroom_teacher_name
        if not homeroom_name and class_profile.homeroom_teacher_id:
            homeroom = db.query(HomeroomTeacherProfile).filter(
                HomeroomTeacherProfile.id == class_profile.homeroom_teacher_id
            ).first()
            if homeroom:
                homeroom_name = homeroom.name
        
        # 检查是否已存在
        check_sql = text('''
            SELECT id FROM teaching_quality."班级列表"
            WHERE ("神殿" = :campus OR "神殿" = :campus_with_suffix)
            AND "班级名称" = :class_name
            LIMIT 1
        ''')
        result = db.execute(check_sql, {
            "campus": campus_name,
            "campus_with_suffix": f"{campus_name}神殿",
            "class_name": class_name
        }).fetchone()
        
        if result:
            # 更新现有记录
            update_sql = text('''
                UPDATE teaching_quality."班级列表"
                SET "班主任" = :homeroom_teacher,
                    "专业" = :major,
                    "学制" = :program_length,
                    "开班时间" = :start_date,
                    "学生人数" = :student_count,
                    "备注" = :notes,
                    "更新时间" = CURRENT_TIMESTAMP
                WHERE ("神殿" = :campus OR "神殿" = :campus_with_suffix)
                AND "班级名称" = :class_name
            ''')
            db.execute(update_sql, {
                "homeroom_teacher": homeroom_name,
                "major": major_name,
                "program_length": class_profile.program_length,
                "start_date": class_profile.start_date,
                "student_count": class_profile.student_capacity or 0,
                "notes": class_profile.notes,
                "campus": campus_name,
                "campus_with_suffix": f"{campus_name}神殿",
                "class_name": class_name
            })
            print(f"[class_sync] 已更新 teaching_quality.班级列表: {campus_name}/{class_name}")
        else:
            # 插入新记录
            insert_sql = text('''
                INSERT INTO teaching_quality."班级列表"
                ("班级名称", "神殿", "班主任", "专业", "学制", "开班时间", "学生人数", "备注", "创建时间", "更新时间")
                VALUES (:class_name, :campus, :homeroom_teacher, :major, :program_length, :start_date, :student_count, :notes, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ''')
            db.execute(insert_sql, {
                "class_name": class_name,
                "campus": campus_name,
                "homeroom_teacher": homeroom_name,
                "major": major_name,
                "program_length": class_profile.program_length,
                "start_date": class_profile.start_date,
                "student_count": class_profile.student_capacity or 0,
                "notes": class_profile.notes
            })
            print(f"[class_sync] 已新增 teaching_quality.班级列表: {campus_name}/{class_name}")
        
        db.commit()
        return True
        
    except Exception as e:
        print(f"[class_sync] 同步到 teaching_quality 失败: {e}")
        traceback.print_exc()
        db.rollback()
        return False


def sync_teaching_quality_class_to_config(
    config_db: Session,
    class_data: Dict[str, Any],
    action: str = "upsert"  # "upsert" | "delete"
) -> bool:
    """
    将 teaching_quality.班级列表 的数据同步到 config.classes
    
    Args:
        config_db: 配置库的数据库会话
        class_data: 班级档案表的数据字典，包含：班级名称, 神殿, 班主任, 专业, 学制, 开班时间, 学生人数, 备注
        action: 操作类型 - "upsert" 新增或更新, "delete" 删除
    
    Returns:
        bool: 同步是否成功
    """
    try:
        campus_name = normalize_campus_name(class_data.get("神殿"))
        class_name = class_data.get("班级名称")
        
        if not campus_name or not class_name:
            print("[class_sync] 缺少神殿或班级名称，跳过同步")
            return False
        
        if action == "delete":
            # 删除 config.classes 中的对应记录
            existing = config_db.query(ClassProfile).filter(
                ClassProfile.campus_name == campus_name,
                ClassProfile.class_name == class_name
            ).first()
            if existing:
                config_db.delete(existing)
                config_db.commit()
                print(f"[class_sync] 已从 config.classes 删除: {campus_name}/{class_name}")
            return True
        
        # 查找或创建班级记录
        existing = config_db.query(ClassProfile).filter(
            ClassProfile.campus_name == campus_name,
            ClassProfile.class_name == class_name
        ).first()
        
        # 查找班主任 ID（通过姓名）
        homeroom_teacher_id = None
        homeroom_teacher_name = class_data.get("班主任")
        if homeroom_teacher_name:
            homeroom = config_db.query(HomeroomTeacherProfile).filter(
                HomeroomTeacherProfile.name == homeroom_teacher_name,
                HomeroomTeacherProfile.campus_name == campus_name
            ).first()
            if homeroom:
                homeroom_teacher_id = homeroom.id
        
        # 查找专业 ID（通过名称）
        major_id = None
        major_name = class_data.get("专业")
        if major_name:
            major = config_db.query(MajorProfile).filter(
                MajorProfile.name == major_name,
                MajorProfile.campus_name == campus_name
            ).first()
            if major:
                major_id = major.id
        
        if existing:
            # 更新现有记录
            existing.homeroom_teacher_id = homeroom_teacher_id
            existing.homeroom_teacher_name = homeroom_teacher_name
            existing.major_id = major_id
            existing.major_name = major_name
            existing.program_length = class_data.get("学制")
            existing.start_date = class_data.get("开班时间")
            existing.student_capacity = class_data.get("学生人数") or 0
            existing.notes = class_data.get("备注")
            existing.is_active = True
            print(f"[class_sync] 已更新 config.classes: {campus_name}/{class_name}")
        else:
            # 创建新记录
            new_class = ClassProfile(
                class_name=class_name,
                campus_name=campus_name,
                homeroom_teacher_id=homeroom_teacher_id,
                homeroom_teacher_name=homeroom_teacher_name,
                major_id=major_id,
                major_name=major_name,
                program_length=class_data.get("学制"),
                start_date=class_data.get("开班时间"),
                student_capacity=class_data.get("学生人数") or 0,
                notes=class_data.get("备注"),
                is_active=True
            )
            config_db.add(new_class)
            print(f"[class_sync] 已新增 config.classes: {campus_name}/{class_name}")
        
        config_db.commit()
        return True
        
    except Exception as e:
        print(f"[class_sync] 同步到 config.classes 失败: {e}")
        traceback.print_exc()
        config_db.rollback()
        return False


def sync_all_from_teaching_quality_to_config(config_db: Session, tq_db: Session) -> int:
    """
    批量同步：将 teaching_quality.班级列表 的所有记录同步到 config.classes
    
    Returns:
        int: 成功同步的记录数
    """
    try:
        # 获取所有班级档案表的记录
        sql = text('''
            SELECT "班级名称", "神殿", "班主任", "专业", "学制", "开班时间", "学生人数", "备注"
            FROM teaching_quality."班级列表"
        ''')
        rows = tq_db.execute(sql).mappings().all()
        
        count = 0
        for row in rows:
            class_data = {
                "班级名称": row.get("班级名称"),
                "神殿": row.get("神殿"),
                "班主任": row.get("班主任"),
                "专业": row.get("专业"),
                "学制": row.get("学制"),
                "开班时间": row.get("开班时间"),
                "学生人数": row.get("学生人数"),
                "备注": row.get("备注"),
            }
            if sync_teaching_quality_class_to_config(config_db, class_data):
                count += 1
        
        print(f"[class_sync] 批量同步完成，共同步 {count}/{len(rows)} 条记录")
        return count
        
    except Exception as e:
        print(f"[class_sync] 批量同步失败: {e}")
        traceback.print_exc()
        return 0


def sync_all_from_config_to_teaching_quality(config_db: Session, tq_db: Session) -> int:
    """
    批量同步：将 config.classes 的所有记录同步到 teaching_quality.班级列表
    
    Returns:
        int: 成功同步的记录数
    """
    try:
        classes = config_db.query(ClassProfile).filter(ClassProfile.is_active == True).all()
        
        count = 0
        for cls in classes:
            if sync_config_class_to_teaching_quality(tq_db, cls):
                count += 1
        
        print(f"[class_sync] 批量同步完成，共同步 {count}/{len(classes)} 条记录")
        return count
        
    except Exception as e:
        print(f"[class_sync] 批量同步失败: {e}")
        traceback.print_exc()
        return 0
