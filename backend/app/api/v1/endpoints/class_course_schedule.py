"""
班排课表API端点
"""

import base64
from datetime import date
from typing import List, Optional
from urllib.parse import unquote

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ....core.database import get_db
from ....crud import class_course_schedule as schedule_crud
from ....schemas.class_course_schedule import (
    班排课表创建,
    班排课表响应,
    班排课表批量创建,
    班排课表批量创建响应,
    班排课表更新,
)

router = APIRouter()


def get_campus_from_header(x_campus: Optional[str] = Header(None, alias="X-Campus")) -> Optional[str]:
    """从请求头获取神殿信息"""
    if not x_campus:
        return None
    try:
        decoded = base64.b64decode(x_campus).decode('utf-8')
        return unquote(decoded)
    except Exception:
        return None


@router.post("/batch", response_model=班排课表批量创建响应, summary="批量创建班排课表记录")
async def batch_create_class_course_schedules(
    request: 班排课表批量创建,
    campus: Optional[str] = Depends(get_campus_from_header),
    db: Session = Depends(get_db)
):
    """
    批量创建班排课表记录
    """
    success_count = 0
    fail_count = 0
    fail_details = []
    
    for idx, schedule in enumerate(request.课程列表):
        try:
            # 使用header中的神殿，如果没有则使用请求体中的神殿
            target_campus = campus if campus else schedule.神殿
            
            schedule_crud.创建班排课表(
                db=db,
                神殿=target_campus,
                班级代码=schedule.班级代码,
                日期=schedule.日期,
                课程名称=schedule.课程名称,
                课程编号=schedule.课程编号,
                授课教师=schedule.授课教师,
                颜色=schedule.颜色,
                类型=schedule.类型,
                备注=schedule.备注,
            )
            success_count += 1
        except IntegrityError:
            fail_count += 1
            fail_details.append(f"第{idx+1}条: {schedule.班级代码} {schedule.日期} - 重复记录")
            db.rollback()
        except Exception as e:
            fail_count += 1
            fail_details.append(f"第{idx+1}条: {schedule.班级代码} {schedule.日期} - {str(e)}")
            db.rollback()
    
    # 提交所有成功的记录
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"批量创建失败: {str(e)}") from e
    
    return {
        "成功数量": success_count,
        "失败数量": fail_count,
        "失败详情": fail_details[:10]  # 最多返回前10条失败信息
    }


@router.post("/", response_model=班排课表响应, summary="创建班排课表记录")
async def create_class_course_schedule(
    schedule: 班排课表创建,
    campus: Optional[str] = Depends(get_campus_from_header),
    db: Session = Depends(get_db)
):
    """
    创建班排课表记录
    """
    try:
        # 使用header中的神殿，如果没有则使用请求体中的神殿
        target_campus = campus if campus else schedule.神殿
        
        db_schedule = schedule_crud.创建班排课表(
            db=db,
            神殿=target_campus,
            班级代码=schedule.班级代码,
            日期=schedule.日期,
            课程名称=schedule.课程名称,
            课程编号=schedule.课程编号,
            授课教师=schedule.授课教师,
            颜色=schedule.颜色,
            类型=schedule.类型,
            备注=schedule.备注,
        )
        
        return db_schedule.to_dict()
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail="该时段已存在课程安排，请勿重复添加") from e
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"创建班排课表记录失败: {str(e)}") from e


@router.get("/", response_model=List[班排课表响应], summary="获取班排课表列表")
async def get_class_course_schedules(
    神殿: Optional[str] = Query(None, description="神殿名称"),
    班级代码: Optional[str] = Query(None, description="班级代码"),
    日期_开始: Optional[date] = Query(None, description="开始日期"),
    日期_结束: Optional[date] = Query(None, description="结束日期"),
    类型: Optional[str] = Query(None, description="课程类型"),
    campus: Optional[str] = Depends(get_campus_from_header),
    db: Session = Depends(get_db)
):
    """
    获取班排课表列表
    支持按神殿、班级、日期范围、类型筛选
    """
    try:
        # 使用header中的神殿，如果没有则使用query参数
        target_campus = campus if campus else 神殿
        
        schedules = schedule_crud.获取班排课表列表(
            db=db,
            神殿=target_campus,
            班级代码=班级代码,
            日期_开始=日期_开始,
            日期_结束=日期_结束,
            类型=类型,
        )
        
        return [s.to_dict() for s in schedules]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取班排课表列表失败: {str(e)}") from e


@router.get("/{course_id}", response_model=班排课表响应, summary="获取班排课表详情")
async def get_class_course_schedule(
    course_id: int,
    db: Session = Depends(get_db)
):
    """
    根据ID获取班排课表详情
    """
    try:
        schedule = schedule_crud.获取班排课表(db=db, 课程ID=course_id)
        if not schedule:
            raise HTTPException(status_code=404, detail="班排课表记录未找到")
        return schedule.to_dict()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取班排课表详情失败: {str(e)}") from e


@router.put("/{course_id}", response_model=班排课表响应, summary="更新班排课表记录")
async def update_class_course_schedule(
    course_id: int,
    schedule: 班排课表更新,
    campus: Optional[str] = Depends(get_campus_from_header),
    db: Session = Depends(get_db)
):
    """
    更新班排课表记录
    """
    try:
        update_data = schedule.model_dump(exclude_unset=True)
        
        # 如果请求体中包含神殿，使用header中的神殿覆盖
        if campus:
            update_data['神殿'] = campus
        
        db_schedule = schedule_crud.更新班排课表(db=db, 课程ID=course_id, 更新数据=update_data)
        if not db_schedule:
            raise HTTPException(status_code=404, detail="班排课表记录未找到")
        return db_schedule.to_dict()
    except HTTPException:
        raise
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail="更新失败：该时段已存在课程安排") from e
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"更新班排课表记录失败: {str(e)}") from e


@router.delete("/{course_id}", summary="删除班排课表记录")
async def delete_class_course_schedule(
    course_id: int,
    db: Session = Depends(get_db)
):
    """
    删除班排课表记录
    """
    try:
        success = schedule_crud.删除班排课表(db=db, 课程ID=course_id)
        if not success:
            raise HTTPException(status_code=404, detail="班排课表记录未找到")
        return {"message": "删除成功", "课程ID": course_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"删除班排课表记录失败: {str(e)}") from e

