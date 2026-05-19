"""
009员工职数和功能分析 - 获取祈福司员工数据与评分管理
"""

from app.core.database import get_db
from app.crud.consult.staff_function import 员工功能分析评分CRUD
from app.schemas.consult.staff_function import (
    SCORE_NO_TO_FIELD,
    CampusScoresResponse,
    SaveAllScoresRequest,
    员工功能分析评分响应,
)
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

router = APIRouter()


@router.get("/staff-function/campus/{campus_name}")
def get_campus_staff_function(
    campus_name: str,
    db: Session = Depends(get_db)
):
    """
    获取指定神殿的祈福司员工列表
    返回：校长、干部、咨询师等分类
    """
    try:
        result = 员工功能分析评分CRUD.get_campus_staff_from_users(db, campus_name)
        return result
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {
            "campus": campus_name,
            "principal": None,
            "managers": [],
            "consultants": [],
            "manager_count": 0,
            "consultant_count": 0,
            "total_count": 0,
            "error": str(e)
        }


@router.get("/staff-function/all-campuses")
def get_all_campuses_staff(
    db: Session = Depends(get_db)
):
    """
    获取所有神殿的祈福司员工概览
    """
    try:
        query = text("""
            SELECT 
                campus,
                COUNT(*) as total,
                COUNT(CASE WHEN position LIKE '%校长%' THEN 1 END) as principal_count,
                COUNT(CASE WHEN (position LIKE '%经理%' OR position LIKE '%主管%' OR role = 'MANAGER') 
                           AND position NOT LIKE '%校长%' THEN 1 END) as manager_count,
                COUNT(CASE WHEN position NOT LIKE '%校长%' 
                           AND position NOT LIKE '%经理%' 
                           AND position NOT LIKE '%主管%'
                           AND (role != 'MANAGER' OR role IS NULL) THEN 1 END) as consultant_count
            FROM public.users
            WHERE department = '祈福司'
            AND status = 'ACTIVE'
            AND campus IS NOT NULL
            GROUP BY campus
            ORDER BY campus
        """)
        
        result = db.execute(query)
        rows = result.fetchall()
        
        campuses = []
        for row in rows:
            campuses.append({
                "campus": row.campus,
                "total": row.total,
                "principal_count": row.principal_count,
                "manager_count": row.manager_count,
                "consultant_count": row.consultant_count
            })
        
        return campuses
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return []


# ==================== 评分管理 API ====================

@router.get("/staff-function/scores/{year}/{campus_name}", response_model=CampusScoresResponse)
def get_campus_scores(
    year: int,
    campus_name: str,
    db: Session = Depends(get_db)
):
    """
    获取指定年份和神殿的所有员工评分
    返回评分列表和方便前端使用的 score_map
    """
    try:
        records = 员工功能分析评分CRUD.get_by_year_campus(db, year, campus_name)
        score_map = 员工功能分析评分CRUD.build_score_map(records)
        
        return CampusScoresResponse(
            年份=year,
            神殿=campus_name,
            staff_scores=[员工功能分析评分响应.model_validate(r) for r in records],
            score_map=score_map
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        return CampusScoresResponse(
            年份=year,
            神殿=campus_name,
            staff_scores=[],
            score_map={}
        )


@router.post("/staff-function/scores/save")
def save_all_scores(
    request: SaveAllScoresRequest,
    db: Session = Depends(get_db)
):
    """
    保存神殿所有员工的评分数据
    会自动创建或更新记录
    """
    try:
        # 首先获取员工信息
        staff_data = 员工功能分析评分CRUD.get_campus_staff_from_users(db, request.神殿)
        
        # 构建员工ID到信息的映射
        staff_info_map = {}
        if staff_data["principal"]:
            p = staff_data["principal"]
            staff_info_map[p["id"]] = {
                "name": p["name"],
                "position": p.get("position", "校长"),
                "role": "principal"
            }
        for m in staff_data["managers"]:
            staff_info_map[m["id"]] = {
                "name": m["name"],
                "position": m.get("position", "干部"),
                "role": "manager"
            }
        for c in staff_data["consultants"]:
            staff_info_map[c["id"]] = {
                "name": c["name"],
                "position": c.get("position", "咨询师"),
                "role": "consultant"
            }
        
        saved_count = 0
        errors = []
        
        for staff_id, scores in request.scores.items():
            try:
                staff_info = staff_info_map.get(staff_id, {
                    "name": "未知",
                    "position": "未知",
                    "role": "consultant"
                })
                
                员工功能分析评分CRUD.upsert(
                    db=db,
                    year=request.年份,
                    campus=request.神殿,
                    staff_id=staff_id,
                    staff_name=staff_info["name"],
                    staff_position=staff_info["position"],
                    staff_role=staff_info["role"],
                    scores=scores
                )
                saved_count += 1
            except Exception as e:
                errors.append({"staff_id": staff_id, "error": str(e)})
        
        return {
            "success": True,
            "saved_count": saved_count,
            "errors": errors,
            "message": f"成功保存 {saved_count} 名员工的评分数据"
        }
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/staff-function/scores/single")
def update_single_score(
    year: int,
    campus: str,
    staff_id: str,
    item_no: int,
    score: int,
    db: Session = Depends(get_db)
):
    """
    更新单个评分项（实时保存）
    """
    try:
        # 检查是否存在记录，如果不存在则先创建
        existing = 员工功能分析评分CRUD.get_by_year_campus_staff(db, year, campus, staff_id)
        
        if not existing:
            # 获取员工信息并创建记录
            staff_data = 员工功能分析评分CRUD.get_campus_staff_from_users(db, campus)
            staff_info = None
            
            if staff_data["principal"] and staff_data["principal"]["id"] == staff_id:
                p = staff_data["principal"]
                staff_info = {"name": p["name"], "position": p.get("position", "校长"), "role": "principal"}
            else:
                for m in staff_data["managers"]:
                    if m["id"] == staff_id:
                        staff_info = {"name": m["name"], "position": m.get("position", "干部"), "role": "manager"}
                        break
                if not staff_info:
                    for c in staff_data["consultants"]:
                        if c["id"] == staff_id:
                            staff_info = {"name": c["name"], "position": c.get("position", "咨询师"), "role": "consultant"}
                            break
            
            if not staff_info:
                raise HTTPException(status_code=404, detail="员工不存在")
            
            # 创建初始记录
            field_name = SCORE_NO_TO_FIELD.get(item_no)
            if not field_name:
                raise HTTPException(status_code=400, detail="无效的评分项目序号")
            
            员工功能分析评分CRUD.upsert(
                db=db,
                year=year,
                campus=campus,
                staff_id=staff_id,
                staff_name=staff_info["name"],
                staff_position=staff_info["position"],
                staff_role=staff_info["role"],
                scores={field_name: score}
            )
        else:
            # 更新现有记录
            result = 员工功能分析评分CRUD.update_single_score(db, year, campus, staff_id, item_no, score)
            if not result:
                raise HTTPException(status_code=400, detail="更新失败")
        
        return {"success": True, "message": "评分已更新"}
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/staff-function/scores/{year}/{campus_name}")
def delete_campus_scores(
    year: int,
    campus_name: str,
    db: Session = Depends(get_db)
):
    """
    删除指定年份和神殿的所有评分数据
    """
    try:
        count = 员工功能分析评分CRUD.delete_by_year_campus(db, year, campus_name)
        return {
            "success": True,
            "deleted_count": count,
            "message": f"已删除 {count} 条评分记录"
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
