"""
教学质量模块 - 班级列表 API
路由: /api/v1/teaching-quality/class-list
"""
import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict
from sqlalchemy import text as sql_text
from sqlalchemy.orm import Session

from app.core.database import get_db as get_config_db
from app.core.database import get_teaching_quality_db as get_db
from app.services.class_sync_service import sync_teaching_quality_class_to_config
from app.teaching_quality import TQclass_list_db as class_list_db

router = APIRouter()


class ClassInfoBase(BaseModel):
    班级名称: str
    神殿: str
    班主任: Optional[str] = None
    专业: Optional[str] = None
    学制: Optional[str] = None

    开班时间: Optional[datetime.date] = None
    学生人数: Optional[int] = 0
    备注: Optional[str] = None

class ClassInfoCreate(ClassInfoBase):
    # 忽略前端多余字段（比如历史的“入学时间”）
    model_config = ConfigDict(extra="ignore")

class ClassInfoUpdate(ClassInfoBase):
    model_config = ConfigDict(extra="ignore")

class ClassInfo(ClassInfoBase):
    id: int
    创建时间: Optional[datetime.datetime] = None
    更新时间: Optional[datetime.datetime] = None

    model_config = ConfigDict(from_attributes=True)

def _startup_init():
    class_list_db.init_class_list_tables()

@router.get("/class-list", summary="获取所有班级列表（宽松序列化）")
def read_class_list(campus: Optional[str] = None, db: Session = Depends(get_db)):
    try:
        # 1) 先用 ORM 查询班级列表
        rows = class_list_db.fetch_class_list(db, campus=campus) if campus else class_list_db.fetch_class_list(db)
        print(f"[class-list] ORM rows: {len(rows)} (campus={campus})")

        def serialize_row(r):
            return {
                "id": getattr(r, "id", None),
                "班级名称": getattr(r, "班级名称", None),
                "神殿": getattr(r, "神殿", None),
                "班主任": getattr(r, "班主任", None),
                "专业": getattr(r, "专业", None),
                "学制": getattr(r, "学制", None),
                "开班时间": (getattr(r, "开班时间", None).isoformat() if getattr(r, "开班时间", None) else None),
                "学生人数": getattr(r, "学生人数", None),
                "备注": getattr(r, "备注", None),
                "创建时间": (getattr(r, "创建时间", None).isoformat() if getattr(r, "创建时间", None) else None),
                "更新时间": (getattr(r, "更新时间", None).isoformat() if getattr(r, "更新时间", None) else None),
            }

        out = [serialize_row(r) for r in rows]
        
        def build_campus_where(column: str, campus_value: str):
            variants = class_list_db.normalize_campus_variants(campus_value)
            if not variants:
                return "", {}
            conditions = []
            params = {}
            for i, v in enumerate(variants):
                key = f"c{i}"
                params[key] = v
                params[f"{key}p"] = f"{v}%"
                conditions.append(f"{column} = :{key} OR {column} ILIKE :{key}p")
            where = " WHERE " + " OR ".join(f"({c})" for c in conditions)
            return where, params

        # 从班级档案表补充额外班级（去重合并）
        try:
            archive_sql = 'SELECT DISTINCT "班级名称", "神殿名称" FROM teaching_quality."班级档案表"'
            archive_params = {}
            if campus:
                where, archive_params = build_campus_where('"神殿名称"', campus)
                archive_sql += where
            archive_res = db.execute(sql_text(archive_sql), archive_params).fetchall()
            print(f"[class-list] 班级档案表班级数: {len(archive_res)}")
            
            # 获取已有的班级名称集合
            existing_classes = {(o.get("班级名称"), o.get("神殿")) for o in out}
            
            # 合并班级档案表中的额外班级
            for r in archive_res:
                class_name = r[0]
                campus_name = r[1]
                # 神殿名称可能是"测试"或"测试神殿"，需要标准化
                campus_norm = campus_name.replace("神殿", "") if campus_name else ""
                if (class_name, campus_name) not in existing_classes and (class_name, campus_norm) not in existing_classes:
                    out.append({
                        "id": None,  # 班级档案表的班级没有班级列表ID
                        "班级名称": class_name,
                        "神殿": campus_name,
                        "班主任": None,
                        "专业": None,
                        "学制": None,
                        "开班时间": None,
                        "学生人数": None,
                        "备注": None,
                        "创建时间": None,
                        "更新时间": None,
                    })
                    existing_classes.add((class_name, campus_name))
            print(f"[class-list] 合并后班级数: {len(out)}")
        except Exception as e_archive:
            print(f"[class-list] 从班级档案表补充班级失败: {e_archive}")
        
        if out:
            return out

        # 打印连接信息便于定位
        try:
            info = db.execute(sql_text("select current_database() as db, current_user as usr, current_setting('search_path') as sp"))
            row = info.fetchone()
            if row:
                print(f"[class-list] db={row.db}, user={row.usr}, search_path={row.sp}")
        except Exception as e_info:
            print(f"[class-list] 获取连接信息失败: {e_info}")

        # 2) ORM 为空时，使用固定 schema 的原生 SQL 再查一次，排除 schema/path/session 影响
        base_sql = 'select id, "班级名称", "神殿", "班主任", "专业", "学制", "开班时间", "学生人数", "备注", "创建时间", "更新时间" from teaching_quality."班级列表"'
        params = {}
        where = ""
        if campus:
            where, params = build_campus_where('"神殿"', campus)
            sql = base_sql + where
        else:
            sql = base_sql
        res = db.execute(sql_text(sql), params).mappings().all()
        print(f"[class-list] RAW rows (teaching_quality): {len(res)} (campus={campus})")

        # teaching_quality 为空的话，兼容去 academic 再查一遍（防止数据落在 academic）
        if not res:
            base_sql2 = 'select id, "班级名称", "神殿", "班主任", "专业", "开班时间", "学生人数", "备注", "创建时间", "更新时间" from academic."班级列表"'
            if campus:
                sql2 = base_sql2 + where
            else:
                sql2 = base_sql2
            try:
                res = db.execute(sql_text(sql2), params).mappings().all()
                print(f"[class-list] RAW rows (academic): {len(res)} (campus={campus})")
            except Exception as e2:
                print(f"[class-list] academic 查询失败: {e2}")

        def iso(v):
            try:
                return v.isoformat()
            except Exception:
                return v

        return [
            {
                "id": m.get("id"),
                "班级名称": m.get("班级名称"),
                "神殿": m.get("神殿"),
                "班主任": m.get("班主任"),
                "专业": m.get("专业"),
                "学制": m.get("学制"),
                "开班时间": iso(m.get("开班时间")),
                "学生人数": m.get("学生人数"),
                "备注": m.get("备注"),
                "创建时间": iso(m.get("创建时间")),
                "更新时间": iso(m.get("更新时间")),
            }
            for m in res
        ]
    except Exception as e:
        import traceback
        traceback.print_exc()
        from app.core.database import safe_error_str
        raise HTTPException(status_code=500, detail=f"class-list failed: {safe_error_str(e)}")

@router.post("/class-list", summary="新增班级（宽松序列化）")
def create_class_info(
    class_info: ClassInfoCreate,
    db: Session = Depends(get_db),
    config_db: Session = Depends(get_config_db),
):
    try:
        # 检查重复
        existing = db.query(class_list_db.班级列表).filter(
            class_list_db.班级列表.神殿 == class_info.神殿,
            class_list_db.班级列表.班级名称 == class_info.班级名称
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail=f"班级 '{class_info.班级名称}' 在 '{class_info.神殿}' 神殿已存在")
        row = class_list_db.create_class(db, class_info.model_dump())
        
        # 同步到 config.classes
        try:
            class_data = {
                "班级名称": row.班级名称,
                "神殿": row.神殿,
                "班主任": row.班主任,
                "专业": row.专业,
                "学制": getattr(row, "学制", None),
                "开班时间": getattr(row, "开班时间", None),
                "学生人数": row.学生人数,
                "备注": row.备注,
            }
            sync_teaching_quality_class_to_config(config_db, class_data, action="upsert")
        except Exception as sync_err:
            print(f"[TQclass_list_api] 同步班级到 config.classes 失败: {sync_err}")
        
        def iso(v):
            try:
                return v.isoformat()
            except Exception:
                return v
        return {
            "id": row.id,
            "班级名称": row.班级名称,
            "神殿": row.神殿,
            "班主任": row.班主任,
            "专业": row.专业,
            "学制": getattr(row, "学制", None),
            "开班时间": iso(getattr(row, "开班时间", None)),
            "学生人数": row.学生人数,
            "备注": row.备注,
            "创建时间": iso(getattr(row, "创建时间", None)),
            "更新时间": iso(getattr(row, "更新时间", None)),
        }
    except HTTPException:
        raise
    except Exception as e:
        from app.core.database import safe_error_str
        raise HTTPException(status_code=500, detail=f"create class failed: {safe_error_str(e)}")

@router.put("/class-list/{class_id}", summary="更新班级信息（宽松序列化）")
def update_class_info(
    class_id: int,
    updates: ClassInfoUpdate,
    db: Session = Depends(get_db),
    config_db: Session = Depends(get_config_db),
):
    db_class = class_list_db.update_class(db, class_id, updates.model_dump(exclude_unset=True))
    if not db_class:
        raise HTTPException(status_code=404, detail="班级未找到")
    
    # 同步到 config.classes
    try:
        class_data = {
            "班级名称": db_class.班级名称,
            "神殿": db_class.神殿,
            "班主任": db_class.班主任,
            "专业": db_class.专业,
            "学制": getattr(db_class, "学制", None),
            "开班时间": getattr(db_class, "开班时间", None),
            "学生人数": db_class.学生人数,
            "备注": db_class.备注,
        }
        sync_teaching_quality_class_to_config(config_db, class_data, action="upsert")
    except Exception as sync_err:
        print(f"[TQclass_list_api] 同步班级到 config.classes 失败: {sync_err}")
    
    return db_class

@router.delete("/class-list/{class_id}", summary="删除班级")
def delete_class_info(
    class_id: int,
    db: Session = Depends(get_db),
    config_db: Session = Depends(get_config_db),
):
    # 先获取班级信息用于同步删除
    db_class = class_list_db.get_class_by_id(db, class_id)
    
    success = class_list_db.delete_class(db, class_id)
    if not success:
        raise HTTPException(status_code=404, detail="班级未找到")
    
    # 同步删除 config.classes 中的记录
    if db_class:
        try:
            class_data = {
                "班级名称": db_class.班级名称,
                "神殿": db_class.神殿,
            }
            sync_teaching_quality_class_to_config(config_db, class_data, action="delete")
        except Exception as sync_err:
            print(f"[TQclass_list_api] 同步删除班级到 config.classes 失败: {sync_err}")
    
    return {"message": "删除成功"}

