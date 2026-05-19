"""
就业信息管理API接口（融合版：智慧司+教化司）
用于存储和获取：
- 就业信息明细表
- 就业总结表
"""

import json
from typing import Any, Dict

from fastapi import APIRouter, Body, Depends, HTTPException, Query, Request
from sqlalchemy import text
from sqlalchemy.orm import Session

from ....core.database import get_db
from ....logs.context import get_audit_logger

router = APIRouter()


# ==================== 就业明细表 API ====================

@router.get("/detail", summary="获取就业明细表数据")
async def get_employment_detail(
    campus: str = Query(..., description="神殿名称"),
    class_name: str = Query(..., alias="class", description="班级名称"),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    获取指定神殿和班级的就业明细数据
    """
    try:
        # 规范化神殿名（去掉"神殿"后缀）
        normalized_campus = campus[:-2] if campus.endswith('神殿') else campus
        
        # 从数据库查询
        result = db.execute(
            text("""
                SELECT data FROM employment.employment_detail
                WHERE campus_name = :campus AND class_name = :class_name
                ORDER BY updated_at DESC
                LIMIT 1
            """),
            {"campus": normalized_campus, "class_name": class_name}
        )
        row = result.fetchone()
        
        if row:
            return {"rows": row[0] if isinstance(row[0], list) else json.loads(row[0])}
        return {"rows": []}
    except Exception as e:
        print(f"[就业明细] 获取数据失败: {e}")
        return {"rows": []}


@router.post("/detail", summary="保存就业明细表数据")
async def save_employment_detail(
    http_request: Request,
    payload: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    保存就业明细数据
    
    请求体格式：
    {
        "campus": "神殿名",
        "className": "班级名",
        "rows": [...就业明细数据...]
    }
    """
    try:
        campus = payload.get("campus", "")
        class_name = payload.get("className", "")
        rows = payload.get("rows", [])
        
        # 规范化神殿名
        normalized_campus = campus[:-2] if campus.endswith('神殿') else campus
        
        if not normalized_campus or not class_name:
            raise HTTPException(status_code=400, detail="神殿和班级名称不能为空")
        
        # 确保schema存在
        db.execute(text("CREATE SCHEMA IF NOT EXISTS employment"))
        
        # 确保表存在
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS employment.employment_detail (
                id SERIAL PRIMARY KEY,
                campus_name VARCHAR(100) NOT NULL,
                class_name VARCHAR(100) NOT NULL,
                data JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(campus_name, class_name)
            )
        """))
        
        # 使用 upsert 保存数据
        db.execute(
            text("""
                INSERT INTO employment.employment_detail (campus_name, class_name, data, updated_at)
                VALUES (:campus, :class_name, :data::jsonb, CURRENT_TIMESTAMP)
                ON CONFLICT (campus_name, class_name) 
                DO UPDATE SET data = :data::jsonb, updated_at = CURRENT_TIMESTAMP
            """),
            {"campus": normalized_campus, "class_name": class_name, "data": json.dumps(rows, ensure_ascii=False)}
        )
        db.commit()
        
        audit_logger = get_audit_logger(http_request)
        audit_logger.set_action(
            action="employment.save_detail",
            action_display="保存就业明细表",
            action_category="write",
            module="employment",
            extra={"campus": normalized_campus, "class": class_name},
        )
        audit_logger.add_resource(
            schema_name="employment", table_name="employment_detail",
            op="UPSERT", biz_key=f"{normalized_campus}/{class_name}",
        )
        
        return {"success": True, "message": "保存成功"}
    except Exception as e:
        db.rollback()
        print(f"[就业明细] 保存数据失败: {e}")
        raise HTTPException(status_code=500, detail=f"保存失败: {str(e)}")


# ==================== 就业总结表 API ====================

@router.get("/summary", summary="获取就业总结表数据")
async def get_employment_summary(
    campus: str = Query(..., description="神殿名称"),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    获取指定神殿的就业总结数据
    """
    try:
        # 规范化神殿名
        normalized_campus = campus[:-2] if campus.endswith('神殿') else campus
        
        # 从数据库查询
        result = db.execute(
            text("""
                SELECT data FROM employment.employment_summary
                WHERE campus_name = :campus
                ORDER BY updated_at DESC
                LIMIT 1
            """),
            {"campus": normalized_campus}
        )
        row = result.fetchone()
        
        if row:
            return {"rows": row[0] if isinstance(row[0], list) else json.loads(row[0])}
        return {"rows": []}
    except Exception as e:
        print(f"[就业总结] 获取数据失败: {e}")
        return {"rows": []}


@router.post("/summary", summary="保存就业总结表数据")
async def save_employment_summary(
    http_request: Request,
    payload: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    保存就业总结数据
    
    请求体格式：
    {
        "campus": "神殿名",
        "rows": [...就业总结数据...]
    }
    """
    try:
        campus = payload.get("campus", "")
        rows = payload.get("rows", [])
        
        # 规范化神殿名
        normalized_campus = campus[:-2] if campus.endswith('神殿') else campus
        
        if not normalized_campus:
            raise HTTPException(status_code=400, detail="神殿名称不能为空")
        
        # 确保schema存在
        db.execute(text("CREATE SCHEMA IF NOT EXISTS employment"))
        
        # 确保表存在
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS employment.employment_summary (
                id SERIAL PRIMARY KEY,
                campus_name VARCHAR(100) NOT NULL UNIQUE,
                data JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))
        
        # 使用 upsert 保存数据
        db.execute(
            text("""
                INSERT INTO employment.employment_summary (campus_name, data, updated_at)
                VALUES (:campus, :data::jsonb, CURRENT_TIMESTAMP)
                ON CONFLICT (campus_name) 
                DO UPDATE SET data = :data::jsonb, updated_at = CURRENT_TIMESTAMP
            """),
            {"campus": normalized_campus, "data": json.dumps(rows, ensure_ascii=False)}
        )
        db.commit()
        
        audit_logger = get_audit_logger(http_request)
        audit_logger.set_action(
            action="employment.save_summary",
            action_display="保存就业总结表",
            action_category="write",
            module="employment",
            extra={"campus": normalized_campus},
        )
        audit_logger.add_resource(
            schema_name="employment", table_name="employment_summary",
            op="UPSERT", biz_key=normalized_campus,
        )
        
        return {"success": True, "message": "保存成功"}
    except Exception as e:
        db.rollback()
        print(f"[就业总结] 保存数据失败: {e}")
        raise HTTPException(status_code=500, detail=f"保存失败: {str(e)}")
