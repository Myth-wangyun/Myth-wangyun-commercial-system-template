"""
就业明细API接口
"""

from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ....core.database import get_employment_db
from ....crud import employment as employment_crud
from ....schemas.employment import (
    专业就业统计响应,
    地区就业统计响应,
    就业明细创建,
    就业明细响应,
    就业明细更新,
    就业统计响应,
)

router = APIRouter()


@router.post("/", response_model=就业明细响应, summary="创建就业明细")
async def create_employment_detail(
    就业明细: 就业明细创建,
    db: Session = Depends(get_employment_db)
):
    """
    创建新的就业明细记录
    
    - **序号**: 序号
    - **姓名**: 学生姓名
    - **性别**: 性别
    - **年龄**: 年龄
    - **所报专业**: 所报专业
    - **学历**: 学历
    - **联系电话**: 联系电话
    - **入职时间**: 入职时间
    - **就业地区**: 就业地区
    - **就业单位**: 就业单位
    - **就业岗位**: 就业岗位
    - **转正薪资**: 转正薪资详情（可选）
    - **转正金额**: 转正金额（可选）
    - **回访情况**: 回访情况（可选）
    - **回访入职公司**: 回访入职公司（可选）
    - **回访转正金额**: 回访转正金额（可选）
    """
    try:
        db_employment = employment_crud.创建就业明细(
            db=db,
            序号=就业明细.序号,
            姓名=就业明细.姓名,
            性别=就业明细.性别,
            年龄=就业明细.年龄,
            所报专业=就业明细.所报专业,
            学历=就业明细.学历,
            联系电话=就业明细.联系电话,
            入职时间=就业明细.入职时间,
            神殿=就业明细.神殿,
            就业地区=就业明细.就业地区,
            就业单位=就业明细.就业单位,
            就业岗位=就业明细.就业岗位,
            转正薪资=就业明细.转正薪资,
            转正金额=就业明细.转正金额,
            回访情况=就业明细.回访情况,
            回访入职公司=就业明细.回访入职公司,
            回访转正金额=就业明细.回访转正金额
        )
        
        return db_employment
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"创建就业明细失败: {str(e)}") from e


@router.get("/", response_model=List[就业明细响应], summary="获取就业明细列表")
async def get_employment_details(
    跳过: int = Query(0, description="跳过的记录数"),
    限制: int = Query(100, description="限制返回的记录数"),
    姓名: Optional[str] = Query(None, description="按姓名筛选"),
    所报专业: Optional[str] = Query(None, description="按所报专业筛选"),
    神殿: Optional[str] = Query(None, description="按神殿筛选"),
    就业地区: Optional[str] = Query(None, description="按就业地区筛选"),
    就业单位: Optional[str] = Query(None, description="按就业单位筛选"),
    db: Session = Depends(get_employment_db)
):
    """
    获取就业明细列表，支持多种筛选条件
    
    - **跳过**: 分页跳过的记录数
    - **限制**: 每页返回的记录数
    - **姓名**: 按姓名模糊搜索
    - **所报专业**: 按所报专业筛选
    - **就业地区**: 按就业地区筛选
    - **就业单位**: 按就业单位模糊搜索
    """
    try:
        employment_details = employment_crud.获取就业明细列表(
            db=db,
            跳过=跳过,
            限制=限制,
            姓名=姓名,
            所报专业=所报专业,
            神殿=神殿,
            就业地区=就业地区,
            就业单位=就业单位
        )
        
        return employment_details
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取就业明细列表失败: {str(e)}") from e


@router.get("/{employment_id}", response_model=就业明细响应, summary="获取就业明细详情")
async def get_employment_detail(
    employment_id: int,
    db: Session = Depends(get_employment_db)
):
    """
    根据ID获取就业明细详情
    
    - **明细ID**: 就业明细ID
    """
    try:
        employment_detail = employment_crud.获取就业明细(db=db, 明细ID=employment_id)
        
        if not employment_detail:
            raise HTTPException(status_code=404, detail="就业明细不存在")
        
        return employment_detail
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取就业明细详情失败: {str(e)}") from e


@router.put("/{employment_id}", response_model=就业明细响应, summary="更新就业明细")
async def update_employment_detail(
    employment_id: int,
    就业明细: 就业明细更新,
    db: Session = Depends(get_employment_db)
):
    """
    更新就业明细记录
    
    - **明细ID**: 就业明细ID
    - **就业明细**: 要更新的数据
    """
    try:
        # 将Pydantic模型转换为字典，排除None值
        更新数据 = 就业明细.model_dump(exclude_unset=True)
        
        db_employment = employment_crud.更新就业明细(
            db=db,
            明细ID=employment_id,
            更新数据=更新数据
        )
        
        if not db_employment:
            raise HTTPException(status_code=404, detail="就业明细不存在")
        
        return db_employment
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"更新就业明细失败: {str(e)}") from e


@router.delete("/{employment_id}", summary="删除就业明细")
async def delete_employment_detail(
    employment_id: int,
    db: Session = Depends(get_employment_db)
):
    """
    删除就业明细记录
    
    - **明细ID**: 就业明细ID
    """
    try:
        success = employment_crud.删除就业明细(db=db, 明细ID=employment_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="就业明细不存在")
        
        return {
            "success": True,
            "message": "就业明细删除成功"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"删除就业明细失败: {str(e)}") from e


@router.post("/batch", summary="批量创建就业明细")
async def batch_create_employment_details(
    就业明细列表: List[就业明细创建],
    db: Session = Depends(get_employment_db)
):
    """
    批量创建就业明细记录
    
    - **就业明细列表**: 就业明细数据列表
    """
    try:
        # 转换为字典格式
        明细数据列表 = [detail.model_dump() for detail in 就业明细列表]
        
        created_records = employment_crud.批量创建就业明细(
            db=db,
            就业明细列表=明细数据列表
        )
        
        return {
            "success": True,
            "message": f"批量创建成功，共创建 {len(created_records)} 条记录",
            "data": [record.to_dict() for record in created_records]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"批量创建就业明细失败: {str(e)}") from e


@router.get("/statistics/overview", response_model=就业统计响应, summary="获取就业统计概览")
async def get_employment_statistics(
    开始日期: Optional[date] = Query(None, description="统计开始日期"),
    结束日期: Optional[date] = Query(None, description="统计结束日期"),
    所报专业: Optional[str] = Query(None, description="按所报专业筛选"),
    就业地区: Optional[str] = Query(None, description="按就业地区筛选"),
    db: Session = Depends(get_employment_db)
):
    """
    获取就业统计概览信息
    
    - **开始日期**: 统计开始日期（可选）
    - **结束日期**: 统计结束日期（可选）
    - **所报专业**: 按所报专业筛选（可选）
    - **就业地区**: 按就业地区筛选（可选）
    """
    try:
        statistics = employment_crud.获取就业统计信息(
            db=db,
            开始日期=开始日期,
            结束日期=结束日期,
            所报专业=所报专业,
            就业地区=就业地区
        )
        
        return statistics
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取就业统计失败: {str(e)}") from e


@router.get("/statistics/major", response_model=List[专业就业统计响应], summary="获取专业就业统计")
async def get_major_employment_statistics(
    db: Session = Depends(get_employment_db)
):
    """
    获取各专业就业统计信息
    """
    try:
        statistics = employment_crud.获取专业就业统计(db=db)
        
        return statistics
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取专业就业统计失败: {str(e)}") from e


@router.get("/statistics/region", response_model=List[地区就业统计响应], summary="获取地区就业统计")
async def get_region_employment_statistics(
    db: Session = Depends(get_employment_db)
):
    """
    获取各地区就业统计信息
    """
    try:
        statistics = employment_crud.获取地区就业统计(db=db)
        
        return statistics
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取地区就业统计失败: {str(e)}") from e
