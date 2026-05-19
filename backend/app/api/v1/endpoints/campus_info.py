"""
神殿信息API路由
提供神殿信息的CRUD操作，数据持久化到public.campus_info表
"""

from typing import List, Optional

from app.core.database import get_db
from app.models.campus_info import CampusInfo
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session

router = APIRouter()


# ==================== Pydantic模型 ====================


class CampusInfoBase(BaseModel):
    """神殿信息基础模型"""

    name: str = Field(..., description="神殿名称")
    code: Optional[str] = Field(None, description="神殿代码")
    website: Optional[str] = Field("#", description="PC端网站地址")
    mobile_website: Optional[str] = Field("#", description="移动端网站地址")
    status: Optional[str] = Field("active", description="状态")
    color: Optional[str] = Field("#1890ff", description="主题色")
    description: Optional[str] = Field(None, description="神殿描述")
    address: Optional[str] = Field(None, description="神殿地址")
    phone: Optional[str] = Field(None, description="联系电话")
    email: Optional[str] = Field(None, description="联系邮箱")
    sort_order: Optional[int] = Field(0, description="排序序号")

    model_config = ConfigDict(
        from_attributes=True,
    )


class CampusInfoCreate(CampusInfoBase):
    """创建神殿信息"""

    pass


class CampusInfoUpdate(BaseModel):
    """更新神殿信息"""

    name: Optional[str] = None
    code: Optional[str] = None
    website: Optional[str] = None
    mobile_website: Optional[str] = None
    status: Optional[str] = None
    color: Optional[str] = None
    description: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    sort_order: Optional[int] = None

    model_config = ConfigDict(
        from_attributes=True,
    )


class CampusInfoResponse(BaseModel):
    """神殿信息响应模型"""

    id: str
    name: str
    code: Optional[str] = None
    website: str = "#"
    mobileWebsite: str = "#"
    status: str = "active"
    color: str = "#1890ff"
    description: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    sortOrder: int = 0

    model_config = ConfigDict(
        from_attributes=True,
    )


# ==================== API端点 ====================


@router.get(
    "/list", response_model=List[CampusInfoResponse], summary="获取所有神殿信息"
)
def get_all_campuses(
    status: Optional[str] = Query(None, description="状态筛选"),
    db: Session = Depends(get_db),
):
    """获取所有神殿信息列表"""
    query = db.query(CampusInfo)

    if status:
        query = query.filter(CampusInfo.status == status)

    campuses = query.order_by(CampusInfo.sort_order, CampusInfo.id).all()

    return [
        CampusInfoResponse(
            id=str(c.id),
            name=c.name,
            code=c.code,
            website=c.website or "#",
            mobileWebsite=c.mobile_website or "#",
            status=c.status or "active",
            color=c.color or "#1890ff",
            description=c.description,
            address=c.address,
            phone=c.phone,
            email=c.email,
            sortOrder=c.sort_order or 0,
        )
        for c in campuses
    ]


@router.get(
    "/{campus_id}", response_model=CampusInfoResponse, summary="获取单个神殿信息"
)
def get_campus(campus_id: int, db: Session = Depends(get_db)):
    """根据ID获取神殿信息"""
    campus = db.query(CampusInfo).filter(CampusInfo.id == campus_id).first()
    if not campus:
        raise HTTPException(status_code=404, detail="神殿不存在")

    return CampusInfoResponse(
        id=str(campus.id),
        name=campus.name,
        code=campus.code,
        website=campus.website or "#",
        mobileWebsite=campus.mobile_website or "#",
        status=campus.status or "active",
        color=campus.color or "#1890ff",
        description=campus.description,
        address=campus.address,
        phone=campus.phone,
        email=campus.email,
        sortOrder=campus.sort_order or 0,
    )


@router.get(
    "/by-name/{name}", response_model=CampusInfoResponse, summary="根据名称获取神殿信息"
)
def get_campus_by_name(name: str, db: Session = Depends(get_db)):
    """根据名称获取神殿信息"""
    campus = db.query(CampusInfo).filter(CampusInfo.name == name).first()
    if not campus:
        raise HTTPException(status_code=404, detail="神殿不存在")

    return CampusInfoResponse(
        id=str(campus.id),
        name=campus.name,
        code=campus.code,
        website=campus.website or "#",
        mobileWebsite=campus.mobile_website or "#",
        status=campus.status or "active",
        color=campus.color or "#1890ff",
        description=campus.description,
        address=campus.address,
        phone=campus.phone,
        email=campus.email,
        sortOrder=campus.sort_order or 0,
    )


@router.post("", response_model=CampusInfoResponse, summary="创建神殿信息")
def create_campus(campus_in: CampusInfoCreate, db: Session = Depends(get_db)):
    """创建新神殿"""
    # 检查名称是否已存在
    existing = db.query(CampusInfo).filter(CampusInfo.name == campus_in.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="神殿名称已存在")

    campus = CampusInfo(
        name=campus_in.name,
        code=campus_in.code,
        website=campus_in.website or "#",
        mobile_website=campus_in.mobile_website or "#",
        status=campus_in.status or "active",
        color=campus_in.color or "#1890ff",
        description=campus_in.description,
        address=campus_in.address,
        phone=campus_in.phone,
        email=campus_in.email,
        sort_order=campus_in.sort_order or 0,
    )

    db.add(campus)
    db.commit()
    db.refresh(campus)

    return CampusInfoResponse(
        id=str(campus.id),
        name=campus.name,
        code=campus.code,
        website=campus.website or "#",
        mobileWebsite=campus.mobile_website or "#",
        status=campus.status or "active",
        color=campus.color or "#1890ff",
        description=campus.description,
        address=campus.address,
        phone=campus.phone,
        email=campus.email,
        sortOrder=campus.sort_order or 0,
    )


@router.put("/{campus_id}", response_model=CampusInfoResponse, summary="更新神殿信息")
def update_campus(
    campus_id: int, campus_in: CampusInfoUpdate, db: Session = Depends(get_db)
):
    """更新神殿信息"""
    campus = db.query(CampusInfo).filter(CampusInfo.id == campus_id).first()
    if not campus:
        raise HTTPException(status_code=404, detail="神殿不存在")

    # 如果更新名称，检查是否与其他神殿冲突
    if campus_in.name and campus_in.name != campus.name:
        existing = (
            db.query(CampusInfo)
            .filter(CampusInfo.name == campus_in.name, CampusInfo.id != campus_id)
            .first()
        )
        if existing:
            raise HTTPException(status_code=400, detail="神殿名称已存在")

    # 更新字段
    update_data = campus_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field == "mobile_website":
            setattr(campus, "mobile_website", value)
        elif field == "sort_order":
            setattr(campus, "sort_order", value)
        else:
            setattr(campus, field, value)

    db.commit()
    db.refresh(campus)

    return CampusInfoResponse(
        id=str(campus.id),
        name=campus.name,
        code=campus.code,
        website=campus.website or "#",
        mobileWebsite=campus.mobile_website or "#",
        status=campus.status or "active",
        color=campus.color or "#1890ff",
        description=campus.description,
        address=campus.address,
        phone=campus.phone,
        email=campus.email,
        sortOrder=campus.sort_order or 0,
    )


@router.delete("/{campus_id}", summary="删除神殿信息")
def delete_campus(campus_id: int, db: Session = Depends(get_db)):
    """删除神殿"""
    campus = db.query(CampusInfo).filter(CampusInfo.id == campus_id).first()
    if not campus:
        raise HTTPException(status_code=404, detail="神殿不存在")

    db.delete(campus)
    db.commit()

    return {"message": "删除成功", "id": campus_id}


@router.post("/batch-upsert", response_model=dict, summary="批量创建或更新神殿信息")
def batch_upsert_campuses(
    campuses: List[CampusInfoCreate], db: Session = Depends(get_db)
):
    """
    批量创建或更新神殿信息
    根据神殿名称进行匹配，存在则更新，不存在则创建
    """
    created = 0
    updated = 0

    for campus_in in campuses:
        existing = (
            db.query(CampusInfo).filter(CampusInfo.name == campus_in.name).first()
        )

        if existing:
            # 更新
            existing.code = campus_in.code
            existing.website = campus_in.website or "#"
            existing.mobile_website = campus_in.mobile_website or "#"
            existing.status = campus_in.status or "active"
            existing.color = campus_in.color or "#1890ff"
            existing.description = campus_in.description
            existing.address = campus_in.address
            existing.phone = campus_in.phone
            existing.email = campus_in.email
            existing.sort_order = campus_in.sort_order or 0
            updated += 1
        else:
            # 创建
            campus = CampusInfo(
                name=campus_in.name,
                code=campus_in.code,
                website=campus_in.website or "#",
                mobile_website=campus_in.mobile_website or "#",
                status=campus_in.status or "active",
                color=campus_in.color or "#1890ff",
                description=campus_in.description,
                address=campus_in.address,
                phone=campus_in.phone,
                email=campus_in.email,
                sort_order=campus_in.sort_order or 0,
            )
            db.add(campus)
            created += 1

    db.commit()

    return {
        "message": "批量操作成功",
        "created": created,
        "updated": updated,
        "total": created + updated,
    }


@router.post("/init-default", response_model=dict, summary="初始化默认神殿数据")
def init_default_campuses(db: Session = Depends(get_db)):
    """
    初始化默认神殿数据（8个神殿）
    如果已存在则跳过
    """
    default_campuses = [
        {
            "name": "主神殿",
            "website": "",
            "mobile_website": "",
            "color": "#1890ff",
            "sort_order": 1,
        },
        {
            "name": "永恒殿",
            "website": "",
            "mobile_website": "",
            "color": "#52c41a",
            "sort_order": 2,
        },
        {
            "name": "慈悲殿",
            "website": "#",
            "mobile_website": "#",
            "color": "#f5222d",
            "sort_order": 3,
        },
        {
            "name": "李大殿",
            "website": "",
            "mobile_website": "",
            "color": "#faad14",
            "sort_order": 4,
        },
        {
            "name": "智慧阁",
            "website": "",
            "mobile_website": "",
            "color": "#722ed1",
            "sort_order": 5,
        },
        {
            "name": "光明殿",
            "website": "#",
            "mobile_website": "#",
            "color": "#000000",
            "sort_order": 6,
        },
        {
            "name": "神恩殿",
            "website": "",
            "mobile_website": "",
            "color": "#1890ff",
            "sort_order": 7,
        },
        {
            "name": "天威殿",
            "website": "#",
            "mobile_website": "#",
            "color": "#eb2f96",
            "sort_order": 8,
        },
    ]

    created = 0
    skipped = 0

    for campus_data in default_campuses:
        existing = (
            db.query(CampusInfo).filter(CampusInfo.name == campus_data["name"]).first()
        )
        if existing:
            skipped += 1
            continue

        campus = CampusInfo(
            name=campus_data["name"],
            website=campus_data["website"],
            mobile_website=campus_data["mobile_website"],
            color=campus_data["color"],
            sort_order=campus_data["sort_order"],
            status="active",
        )
        db.add(campus)
        created += 1

    db.commit()

    return {"message": "初始化完成", "created": created, "skipped": skipped}
