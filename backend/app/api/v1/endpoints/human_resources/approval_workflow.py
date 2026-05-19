"""
规则化审批流程与组织职责绑定 API。
"""

from typing import List, Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Path, Query
from sqlalchemy.orm import Session

from .....core.auth import get_current_active_user, get_current_admin_user
from .....core.database import get_db
from .....crud.human_resources import approval_workflow as crud
from .....models.user import User
from .....schemas.human_resources.approval_workflow import (
    ApprovalFlowPreviewInput,
    ApprovalFlowPreviewOut,
    ApprovalFlowTemplateCreate,
    ApprovalFlowTemplateOut,
    ApprovalFlowTemplateUpdate,
    OrgResponsibilityBindingCreate,
    OrgResponsibilityBindingOut,
    OrgResponsibilityBindingUpdate,
)

router = APIRouter()


@router.get(
    "/approval-workflow-templates",
    response_model=List[ApprovalFlowTemplateOut],
    summary="获取审批流程模板",
)
def list_approval_workflow_templates(
    flow_type: Optional[str] = Query(None, description="流程类型"),
    campus: Optional[str] = Query(None, description="适用神殿"),
    apply_department: Optional[str] = Query(None, description="适用部门"),
    apply_position: Optional[str] = Query(None, description="适用岗位"),
    is_active: Optional[bool] = Query(None, description="是否启用"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    del current_user
    return [
        crud.serialize_template(item)
        for item in crud.list_templates(
            db,
            flow_type=flow_type,
            campus=campus,
            apply_department=apply_department,
            apply_position=apply_position,
            is_active=is_active,
        )
    ]


@router.post(
    "/approval-workflow-templates",
    response_model=ApprovalFlowTemplateOut,
    summary="创建审批流程模板",
)
def create_approval_workflow_template(
    payload: ApprovalFlowTemplateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    del current_user
    try:
        return crud.serialize_template(crud.create_template(db, payload))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.put(
    "/approval-workflow-templates/{template_id}",
    response_model=ApprovalFlowTemplateOut,
    summary="更新审批流程模板",
)
def update_approval_workflow_template(
    template_id: int = Path(..., description="模板ID"),
    payload: ApprovalFlowTemplateUpdate = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    del current_user
    template = crud.get_template(db, template_id)
    if not template:
        raise HTTPException(status_code=404, detail="审批流程模板不存在")
    try:
        return crud.serialize_template(crud.update_template(db, template, payload))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.delete(
    "/approval-workflow-templates/{template_id}",
    summary="删除审批流程模板",
)
def delete_approval_workflow_template(
    template_id: int = Path(..., description="模板ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    del current_user
    template = crud.get_template(db, template_id)
    if not template:
        raise HTTPException(status_code=404, detail="审批流程模板不存在")
    crud.delete_template(db, template)
    return {"success": True}


@router.get(
    "/org-responsibility-bindings",
    response_model=List[OrgResponsibilityBindingOut],
    summary="获取组织职责绑定",
)
def list_org_responsibility_bindings(
    responsibility_code: Optional[str] = Query(None, description="职责编码"),
    campus_scope: Optional[str] = Query(None, description="适用神殿"),
    department_scope: Optional[str] = Query(None, description="适用部门"),
    position_scope: Optional[str] = Query(None, description="适用岗位"),
    is_active: Optional[bool] = Query(None, description="是否启用"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    del current_user
    return [
        crud.serialize_binding(item)
        for item in crud.list_bindings(
            db,
            responsibility_code=responsibility_code,
            campus_scope=campus_scope,
            department_scope=department_scope,
            position_scope=position_scope,
            is_active=is_active,
        )
    ]


@router.post(
    "/org-responsibility-bindings",
    response_model=OrgResponsibilityBindingOut,
    summary="创建组织职责绑定",
)
def create_org_responsibility_binding(
    payload: OrgResponsibilityBindingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    del current_user
    try:
        return crud.serialize_binding(crud.create_binding(db, payload))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.put(
    "/org-responsibility-bindings/{binding_id}",
    response_model=OrgResponsibilityBindingOut,
    summary="更新组织职责绑定",
)
def update_org_responsibility_binding(
    binding_id: int = Path(..., description="绑定ID"),
    payload: OrgResponsibilityBindingUpdate = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    del current_user
    binding = crud.get_binding(db, binding_id)
    if not binding:
        raise HTTPException(status_code=404, detail="组织职责绑定不存在")
    try:
        return crud.serialize_binding(crud.update_binding(db, binding, payload))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.delete(
    "/org-responsibility-bindings/{binding_id}",
    summary="删除组织职责绑定",
)
def delete_org_responsibility_binding(
    binding_id: int = Path(..., description="绑定ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    del current_user
    binding = crud.get_binding(db, binding_id)
    if not binding:
        raise HTTPException(status_code=404, detail="组织职责绑定不存在")
    crud.delete_binding(db, binding)
    return {"success": True}


@router.post(
    "/approval-workflow-preview",
    response_model=ApprovalFlowPreviewOut,
    summary="预览审批流程解析结果",
)
def preview_approval_workflow(
    payload: ApprovalFlowPreviewInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    del current_user
    try:
        return crud.build_flow_preview(
            db,
            flow_type=payload.flow_type,
            campus=payload.campus,
            department=payload.department,
            position=payload.position,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
