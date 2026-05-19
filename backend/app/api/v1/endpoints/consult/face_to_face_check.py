"""
当面标准化检查表API路由
"""

from typing import List, Optional

from app.crud.consult.face_to_face_check import (
    当面标准化检查表CRUD,
    当面标准化模板配置CRUD,
)
from app.schemas.consult.face_to_face_check import (
    当面标准化检查表分页响应,
    当面标准化检查表创建,
    当面标准化检查表响应,
    当面标准化检查表更新,
    当面标准化模板配置分页响应,
    当面标准化模板配置创建,
    当面标准化模板配置响应,
    当面标准化模板配置更新,
)
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from .....core.database import get_db

router = APIRouter()


# ==================== 当面标准化检查表 API ====================

@router.post("/face-to-face-check", response_model=当面标准化检查表响应, summary="创建当面标准化检查表")
def create_face_to_face_check(
    obj_in: 当面标准化检查表创建,
    db: Session = Depends(get_db)
):
    """
    创建当面标准化检查表
    
    - **记录类型**: 预案或复盘
    - **咨询步骤内容**: JSON格式，包含步骤序号、步骤名称、内容、思路关键点等
    """
    try:
        record = 当面标准化检查表CRUD.create(db, obj_in)
        return record
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"创建失败: {str(e)}") from e


@router.get("/face-to-face-check/{record_id}", response_model=当面标准化检查表响应, summary="获取当面标准化检查表详情")
def get_face_to_face_check(
    record_id: int,
    db: Session = Depends(get_db)
):
    """根据记录ID获取当面标准化检查表详情"""
    record = 当面标准化检查表CRUD.get_by_id(db, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="记录不存在")
    return record


@router.get("/face-to-face-check", response_model=当面标准化检查表分页响应, summary="获取当面标准化检查表列表")
def get_face_to_face_check_list(
    record_type: Optional[str] = Query(None, description="记录类型（预案/复盘）"),
    student_name: Optional[str] = Query(None, description="学员姓名"),
    start_date: Optional[str] = Query(None, description="开始日期 YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="结束日期 YYYY-MM-DD"),
    campus: Optional[str] = Query(None, description="神殿"),
    creator_id: Optional[int] = Query(None, description="创建人ID"),
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量"),
    db: Session = Depends(get_db)
):
    """获取当面标准化检查表列表（支持分页和筛选）"""
    from datetime import datetime
    
    # 转换日期格式
    start_date_obj = datetime.strptime(start_date, "%Y-%m-%d") if start_date else None
    end_date_obj = datetime.strptime(end_date, "%Y-%m-%d") if end_date else None
    
    skip = (page - 1) * page_size
    
    records, total = 当面标准化检查表CRUD.get_multi(
        db,
        record_type=record_type,
        student_name=student_name,
        start_date=start_date_obj,
        end_date=end_date_obj,
        campus=campus,
        creator_id=creator_id,
        skip=skip,
        limit=page_size
    )
    
    total_pages = (total + page_size - 1) // page_size if total > 0 else 0
    
    return 当面标准化检查表分页响应(
        总记录数=total,
        总页数=total_pages,
        当前页=page,
        每页数量=page_size,
        数据列表=[
            当面标准化检查表响应.model_validate(record, from_attributes=True)
            for record in records
        ],
    )


@router.put("/face-to-face-check", response_model=当面标准化检查表响应, summary="更新当面标准化检查表")
def update_face_to_face_check(
    obj_in: 当面标准化检查表更新,
    db: Session = Depends(get_db)
):
    """更新当面标准化检查表"""
    record = 当面标准化检查表CRUD.get_by_id(db, obj_in.记录ID)
    if not record:
        raise HTTPException(status_code=404, detail="记录不存在")
    
    try:
        updated_record = 当面标准化检查表CRUD.update(db, record, obj_in)
        return updated_record
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"更新失败: {str(e)}") from e


@router.delete("/face-to-face-check/{record_id}", summary="删除当面标准化检查表")
def delete_face_to_face_check(
    record_id: int,
    db: Session = Depends(get_db)
):
    """删除当面标准化检查表"""
    success = 当面标准化检查表CRUD.delete(db, record_id)
    if not success:
        raise HTTPException(status_code=404, detail="记录不存在")
    return {"success": True, "message": "删除成功"}


@router.get("/face-to-face-check/plan/{plan_id}/reviews", response_model=List[当面标准化检查表响应], summary="获取预案的复盘记录")
def get_plan_reviews(
    plan_id: int,
    db: Session = Depends(get_db)
):
    """根据预案ID获取所有复盘记录"""
    reviews = 当面标准化检查表CRUD.get_by_plan_id(db, plan_id)
    return reviews


# ==================== 当面标准化模板配置 API ====================

@router.post("/face-to-face-template", response_model=当面标准化模板配置响应, summary="创建当面标准化模板")
def create_face_to_face_template(
    obj_in: 当面标准化模板配置创建,
    db: Session = Depends(get_db)
):
    """
    创建当面标准化模板
    
    - **模板类型**: 预案或复盘
    - **咨询步骤配置**: JSON格式，包含步骤序号、步骤名称、内容、思路关键点等
    - **基本信息字段配置**: JSON格式，配置基本信息的字段
    """
    try:
        template = 当面标准化模板配置CRUD.create(db, obj_in)
        return template
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"创建失败: {str(e)}") from e


@router.get("/face-to-face-template/{template_id}", response_model=当面标准化模板配置响应, summary="获取模板详情")
def get_face_to_face_template(
    template_id: int,
    db: Session = Depends(get_db)
):
    """根据模板ID获取详情"""
    template = 当面标准化模板配置CRUD.get_by_id(db, template_id)
    if not template:
        raise HTTPException(status_code=404, detail="模板不存在")
    return template


@router.get("/face-to-face-template", response_model=当面标准化模板配置分页响应, summary="获取模板列表")
def get_face_to_face_template_list(
    template_type: Optional[str] = Query(None, description="模板类型（预案/复盘）"),
    is_enabled: Optional[int] = Query(None, description="是否启用（0-禁用 1-启用）"),
    campus: Optional[str] = Query(None, description="神殿"),
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量"),
    db: Session = Depends(get_db)
):
    """获取当面标准化模板列表（支持分页和筛选）"""
    skip = (page - 1) * page_size
    
    templates, total = 当面标准化模板配置CRUD.get_multi(
        db,
        template_type=template_type,
        is_enabled=is_enabled,
        campus=campus,
        skip=skip,
        limit=page_size
    )
    
    total_pages = (total + page_size - 1) // page_size if total > 0 else 0
    
    return 当面标准化模板配置分页响应(
        总记录数=total,
        总页数=total_pages,
        当前页=page,
        每页数量=page_size,
        数据列表=[
            当面标准化模板配置响应.model_validate(template, from_attributes=True)
            for template in templates
        ],
    )


@router.get("/face-to-face-template/default", response_model=当面标准化模板配置响应, summary="获取默认模板")
def get_default_face_to_face_template(
    template_type: str = Query(..., description="模板类型（预案/复盘）"),
    campus: Optional[str] = Query(None, description="神殿"),
    db: Session = Depends(get_db)
):
    """获取指定类型的默认模板"""
    template = 当面标准化模板配置CRUD.get_default_template(db, template_type, campus)
    if not template:
        raise HTTPException(status_code=404, detail="未找到默认模板")
    return template


@router.put("/face-to-face-template", response_model=当面标准化模板配置响应, summary="更新模板")
def update_face_to_face_template(
    obj_in: 当面标准化模板配置更新,
    db: Session = Depends(get_db)
):
    """更新当面标准化模板"""
    template = 当面标准化模板配置CRUD.get_by_id(db, obj_in.模板ID)
    if not template:
        raise HTTPException(status_code=404, detail="模板不存在")
    
    try:
        updated_template = 当面标准化模板配置CRUD.update(db, template, obj_in)
        return updated_template
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"更新失败: {str(e)}") from e


@router.delete("/face-to-face-template/{template_id}", summary="删除模板")
def delete_face_to_face_template(
    template_id: int,
    db: Session = Depends(get_db)
):
    """删除当面标准化模板（默认模板不能删除）"""
    try:
        success = 当面标准化模板配置CRUD.delete(db, template_id)
        if not success:
            raise HTTPException(status_code=404, detail="模板不存在")
        return {"success": True, "message": "删除成功"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"删除失败: {str(e)}") from e


@router.put("/face-to-face-template/{template_id}/set-default", response_model=当面标准化模板配置响应, summary="设置为默认模板")
def set_default_face_to_face_template(
    template_id: int,
    db: Session = Depends(get_db)
):
    """将指定模板设置为默认模板"""
    template = 当面标准化模板配置CRUD.set_default(db, template_id)
    if not template:
        raise HTTPException(status_code=404, detail="模板不存在")
    return template


# ==================== 初始化默认模板 ====================

@router.post("/face-to-face-template/init-default", summary="初始化默认模板")
def init_default_templates(
    db: Session = Depends(get_db)
):
    """
    初始化默认的当面标准化模板
    
    创建预案和复盘的默认模板，包含16个标准咨询步骤
    """
    # 默认咨询步骤配置
    default_steps = [
        {"步骤序号": 1, "步骤名称": "寒暄暖场", "内容": "", "思路关键点": ""},
        {"步骤序号": 2, "步骤名称": "广泛提问挖掘需求", "内容": "", "思路关键点": ""},
        {"步骤序号": 3, "步骤名称": "分析诊断总结", "内容": "", "思路关键点": ""},
        {"步骤序号": 4, "步骤名称": "愿景引领（提升认知）", "内容": "", "思路关键点": ""},
        {"步骤序号": 5, "步骤名称": "专业引导（打破思维，上台阶）", "内容": "", "思路关键点": ""},
        {"步骤序号": 6, "步骤名称": "清美学校定位", "内容": "", "思路关键点": ""},
        {"步骤序号": 7, "步骤名称": "清美适合他专业介绍", "内容": "", "思路关键点": ""},
        {"步骤序号": 8, "步骤名称": "清美优势（满足需求）", "内容": "", "思路关键点": ""},
        {"步骤序号": 9, "步骤名称": "堵退路（贯穿学生案例）", "内容": "", "思路关键点": ""},
        {"步骤序号": 10, "步骤名称": "谋求认同", "内容": "", "思路关键点": ""},
        {"步骤序号": 11, "步骤名称": "再次解除抗拒", "内容": "", "思路关键点": ""},
        {"步骤序号": 12, "步骤名称": "铺垫价位（投资者重要性）", "内容": "", "思路关键点": ""},
        {"步骤序号": 13, "步骤名称": "报价关单", "内容": "", "思路关键点": ""},
        {"步骤序号": 14, "步骤名称": "再次解除抗拒关单（至少7次）", "内容": "", "思路关键点": ""},
        {"步骤序号": 15, "步骤名称": "远程视频连线", "内容": "", "思路关键点": ""},
        {"步骤序号": 16, "步骤名称": "成交后交接班主任", "内容": "", "思路关键点": ""},
    ]
    
    # 基本信息字段配置
    basic_info_fields = [
        {"字段名": "姓名", "字段类型": "text", "是否必填": True, "显示顺序": 1},
        {"字段名": "性别", "字段类型": "select", "选项": ["男", "女"], "是否必填": False, "显示顺序": 2},
        {"字段名": "年龄", "字段类型": "text", "是否必填": False, "显示顺序": 3},
        {"字段名": "状态", "字段类型": "text", "是否必填": False, "显示顺序": 4},
        {"字段名": "需求", "字段类型": "textarea", "是否必填": False, "显示顺序": 5},
        {"字段名": "关注点", "字段类型": "textarea", "是否必填": False, "显示顺序": 6},
        {"字段名": "抗拒点", "字段类型": "textarea", "是否必填": False, "显示顺序": 7},
        {"字段名": "陪同人", "字段类型": "text", "是否必填": False, "显示顺序": 8},
        {"字段名": "决策人", "字段类型": "text", "是否必填": False, "显示顺序": 9},
    ]
    
    try:
        # 检查是否已存在默认模板
        existing_plan = 当面标准化模板配置CRUD.get_default_template(db, "预案", None)
        existing_review = 当面标准化模板配置CRUD.get_default_template(db, "复盘", None)
        
        results = []
        
        if not existing_plan:
            plan_template = 当面标准化模板配置创建(
                模板名称="默认预案模板",
                模板类型="预案",
                咨询步骤配置=default_steps,
                基本信息字段配置=basic_info_fields,
                是否启用=1,
                是否默认=1,
                排序序号=1,
                备注="系统默认的预案模板",
                创建人ID=None,
                创建人姓名=None,
                神殿=None,
            )
            plan_obj = 当面标准化模板配置CRUD.create(db, plan_template)
            results.append({"预案模板": plan_obj.模板ID})
        
        if not existing_review:
            review_template = 当面标准化模板配置创建(
                模板名称="默认复盘模板",
                模板类型="复盘",
                咨询步骤配置=default_steps,
                基本信息字段配置=basic_info_fields,
                是否启用=1,
                是否默认=1,
                排序序号=1,
                备注="系统默认的复盘模板",
                创建人ID=None,
                创建人姓名=None,
                神殿=None,
            )
            review_obj = 当面标准化模板配置CRUD.create(db, review_template)
            results.append({"复盘模板": review_obj.模板ID})
        
        return {
            "success": True,
            "message": "默认模板初始化成功",
            "data": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"初始化失败: {str(e)}") from e
