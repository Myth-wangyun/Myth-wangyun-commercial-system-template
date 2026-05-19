"""
市场咨询配置API - 媒体来源管理
管理量来源、媒体来源、细分媒体的三级配置
"""

from typing import Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Path, Query, Request
from pydantic import BaseModel, ConfigDict
from sqlalchemy import text
from sqlalchemy.orm import Session

from ....core.auth import get_current_admin_user
from ....core.database import get_db
from ....logs.context import get_audit_logger
from ....models.media_source_config import MediaCategory, MediaDetail, MediaSource
from ....models.user import User

router = APIRouter(prefix="/media-source-config", tags=["市场咨询配置"])


# ==================== Pydantic 模型 ====================


class MediaCategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None
    sort_order: int = 0
    is_active: bool = True


class MediaCategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None


class MediaCategoryResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    sort_order: int
    is_active: bool

    model_config = ConfigDict(
        from_attributes=True,
    )


class MediaSourceCreate(BaseModel):
    media_category_id: int
    name: str
    description: Optional[str] = None
    sort_order: int = 0
    is_active: bool = True
    is_important: bool = False


class MediaSourceUpdate(BaseModel):
    media_category_id: Optional[int] = None
    name: Optional[str] = None
    description: Optional[str] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None
    is_important: Optional[bool] = None


class MediaSourceResponse(BaseModel):
    id: int
    media_category_id: int
    name: str
    description: Optional[str]
    sort_order: int
    is_active: bool
    is_important: bool

    model_config = ConfigDict(
        from_attributes=True,
    )


class MediaDetailCreate(BaseModel):
    media_source_id: int
    name: str
    description: Optional[str] = None
    sort_order: int = 0
    is_active: bool = True
    is_important: bool = False


class MediaDetailUpdate(BaseModel):
    media_source_id: Optional[int] = None
    name: Optional[str] = None
    description: Optional[str] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None
    is_important: Optional[bool] = None


class MediaDetailResponse(BaseModel):
    id: int
    media_source_id: int
    name: str
    description: Optional[str]
    sort_order: int
    is_active: bool
    is_important: bool

    model_config = ConfigDict(
        from_attributes=True,
    )


# ==================== 量来源 API ====================


@router.get("/media-categories", summary="获取所有量来源")
def get_media_categories(
    is_active: Optional[bool] = Query(None, description="是否只获取启用的"),
    db: Session = Depends(get_db),
):
    """获取所有量来源列表"""
    query = db.query(MediaCategory)
    if is_active is not None:
        query = query.filter(MediaCategory.is_active == is_active)
    categories = query.order_by(MediaCategory.sort_order, MediaCategory.id).all()
    return {
        "data": [
            MediaCategoryResponse.model_validate(c).model_dump() for c in categories
        ]
    }


@router.post("/media-categories", summary="创建量来源")
def create_media_category(
    data: MediaCategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """创建新的量来源"""
    # 检查名称是否已存在
    existing = db.query(MediaCategory).filter(MediaCategory.name == data.name).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"量来源名称 '{data.name}' 已存在")

    category = MediaCategory(**data.model_dump())
    db.add(category)
    db.commit()
    db.refresh(category)
    return {
        "success": True,
        "message": "创建成功",
        "data": MediaCategoryResponse.model_validate(category).model_dump(),
    }


@router.put("/media-categories/{category_id}", summary="更新量来源")
def update_media_category(
    category_id: int = Path(..., description="量来源ID"),
    data: MediaCategoryUpdate = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """更新量来源"""
    category = db.query(MediaCategory).filter(MediaCategory.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="量来源不存在")

    # 检查名称是否与其他记录冲突
    if data.name and data.name != category.name:
        existing = (
            db.query(MediaCategory)
            .filter(MediaCategory.name == data.name, MediaCategory.id != category_id)
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=400, detail=f"量来源名称 '{data.name}' 已存在"
            )

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(category, key, value)

    db.commit()
    db.refresh(category)
    return {
        "success": True,
        "message": "更新成功",
        "data": MediaCategoryResponse.model_validate(category).model_dump(),
    }


@router.delete("/media-categories/{category_id}", summary="删除量来源")
def delete_media_category(
    category_id: int = Path(..., description="量来源ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """删除量来源（会级联删除下属的媒体来源和细分媒体）"""
    category = db.query(MediaCategory).filter(MediaCategory.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="量来源不存在")

    db.delete(category)
    db.commit()
    return {"success": True, "message": "删除成功"}


# ==================== 媒体来源 API ====================


@router.get("/media-sources", summary="获取所有媒体来源")
def get_media_sources(
    media_category_id: Optional[int] = Query(None, description="按量来源ID筛选"),
    is_active: Optional[bool] = Query(None, description="是否只获取启用的"),
    db: Session = Depends(get_db),
):
    """获取所有媒体来源列表"""
    query = db.query(MediaSource)
    if media_category_id is not None:
        query = query.filter(MediaSource.media_category_id == media_category_id)
    if is_active is not None:
        query = query.filter(MediaSource.is_active == is_active)
    sources = query.order_by(MediaSource.sort_order, MediaSource.id).all()
    return {
        "data": [MediaSourceResponse.model_validate(s).model_dump() for s in sources]
    }


@router.post("/media-sources", summary="创建媒体来源")
def create_media_source(
    data: MediaSourceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """创建新的媒体来源"""
    # 检查量来源是否存在
    category = (
        db.query(MediaCategory)
        .filter(MediaCategory.id == data.media_category_id)
        .first()
    )
    if not category:
        raise HTTPException(status_code=400, detail="所选量来源不存在")

    # 检查名称是否在同一量来源下已存在
    existing = (
        db.query(MediaSource)
        .filter(
            MediaSource.media_category_id == data.media_category_id,
            MediaSource.name == data.name,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=400, detail=f"在该量来源下，媒体来源名称 '{data.name}' 已存在"
        )

    source = MediaSource(**data.model_dump())
    db.add(source)
    db.commit()
    db.refresh(source)
    return {
        "success": True,
        "message": "创建成功",
        "data": MediaSourceResponse.model_validate(source).model_dump(),
    }


@router.put("/media-sources/{source_id}", summary="更新媒体来源")
def update_media_source(
    source_id: int = Path(..., description="媒体来源ID"),
    data: MediaSourceUpdate = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """更新媒体来源"""
    source = db.query(MediaSource).filter(MediaSource.id == source_id).first()
    if not source:
        raise HTTPException(status_code=404, detail="媒体来源不存在")

    # 检查名称是否与同一量来源下的其他记录冲突
    category_id = (
        data.media_category_id if data.media_category_id else source.media_category_id
    )
    if data.name and (data.name != source.name or data.media_category_id):
        existing = (
            db.query(MediaSource)
            .filter(
                MediaSource.media_category_id == category_id,
                MediaSource.name == data.name if data.name else source.name,
                MediaSource.id != source_id,
            )
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=400, detail="在该量来源下，媒体来源名称已存在"
            )

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(source, key, value)

    db.commit()
    db.refresh(source)
    return {
        "success": True,
        "message": "更新成功",
        "data": MediaSourceResponse.model_validate(source).model_dump(),
    }


@router.delete("/media-sources/{source_id}", summary="删除媒体来源")
def delete_media_source(
    source_id: int = Path(..., description="媒体来源ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """删除媒体来源（会级联删除下属的细分媒体）"""
    source = db.query(MediaSource).filter(MediaSource.id == source_id).first()
    if not source:
        raise HTTPException(status_code=404, detail="媒体来源不存在")

    db.delete(source)
    db.commit()
    return {"success": True, "message": "删除成功"}


# ==================== 细分媒体 API ====================


@router.get("/media-details", summary="获取所有细分媒体")
def get_media_details(
    media_source_id: Optional[int] = Query(None, description="按媒体来源ID筛选"),
    is_active: Optional[bool] = Query(None, description="是否只获取启用的"),
    db: Session = Depends(get_db),
):
    """获取所有细分媒体列表"""
    query = db.query(MediaDetail)
    if media_source_id is not None:
        query = query.filter(MediaDetail.media_source_id == media_source_id)
    if is_active is not None:
        query = query.filter(MediaDetail.is_active == is_active)
    details = query.order_by(MediaDetail.sort_order, MediaDetail.id).all()
    return {
        "data": [MediaDetailResponse.model_validate(d).model_dump() for d in details]
    }


@router.post("/media-details", summary="创建细分媒体")
def create_media_detail(
    data: MediaDetailCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """创建新的细分媒体"""
    # 检查媒体来源是否存在
    source = (
        db.query(MediaSource).filter(MediaSource.id == data.media_source_id).first()
    )
    if not source:
        raise HTTPException(status_code=400, detail="所选媒体来源不存在")

    # 检查名称是否在同一媒体来源下已存在
    existing = (
        db.query(MediaDetail)
        .filter(
            MediaDetail.media_source_id == data.media_source_id,
            MediaDetail.name == data.name,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=400, detail=f"在该媒体来源下，细分媒体名称 '{data.name}' 已存在"
        )

    detail = MediaDetail(**data.model_dump())
    db.add(detail)
    db.commit()
    db.refresh(detail)
    return {
        "success": True,
        "message": "创建成功",
        "data": MediaDetailResponse.model_validate(detail).model_dump(),
    }


@router.put("/media-details/{detail_id}", summary="更新细分媒体")
def update_media_detail(
    detail_id: int = Path(..., description="细分媒体ID"),
    data: MediaDetailUpdate = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """更新细分媒体"""
    detail = db.query(MediaDetail).filter(MediaDetail.id == detail_id).first()
    if not detail:
        raise HTTPException(status_code=404, detail="细分媒体不存在")

    # 检查名称是否与同一媒体来源下的其他记录冲突
    source_id = data.media_source_id if data.media_source_id else detail.media_source_id
    if data.name and (data.name != detail.name or data.media_source_id):
        existing = (
            db.query(MediaDetail)
            .filter(
                MediaDetail.media_source_id == source_id,
                MediaDetail.name == data.name if data.name else detail.name,
                MediaDetail.id != detail_id,
            )
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=400, detail="在该媒体来源下，细分媒体名称已存在"
            )

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(detail, key, value)

    db.commit()
    db.refresh(detail)
    return {
        "success": True,
        "message": "更新成功",
        "data": MediaDetailResponse.model_validate(detail).model_dump(),
    }


@router.delete("/media-details/{detail_id}", summary="删除细分媒体")
def delete_media_detail(
    detail_id: int = Path(..., description="细分媒体ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """删除细分媒体"""
    detail = db.query(MediaDetail).filter(MediaDetail.id == detail_id).first()
    if not detail:
        raise HTTPException(status_code=404, detail="细分媒体不存在")

    db.delete(detail)
    db.commit()
    return {"success": True, "message": "删除成功"}


# ==================== 综合查询 API ====================


@router.get("/tree", summary="获取完整树形结构")
def get_media_source_tree(
    is_active: Optional[bool] = Query(None, description="是否只获取启用的"),
    db: Session = Depends(get_db),
):
    """获取量来源->媒体来源->细分媒体的完整树形结构"""

    # 构建查询条件
    category_query = db.query(MediaCategory)
    media_query = db.query(MediaSource)
    detail_query = db.query(MediaDetail)

    if is_active is not None:
        category_query = category_query.filter(MediaCategory.is_active == is_active)
        media_query = media_query.filter(MediaSource.is_active == is_active)
        detail_query = detail_query.filter(MediaDetail.is_active == is_active)

    categories = category_query.order_by(
        MediaCategory.sort_order, MediaCategory.id
    ).all()
    media_sources = media_query.order_by(MediaSource.sort_order, MediaSource.id).all()
    details = detail_query.order_by(MediaDetail.sort_order, MediaDetail.id).all()

    # 构建细分媒体映射
    detail_map: dict[int, list[dict[str, object]]] = {}
    for d in details:
        if d.media_source_id not in detail_map:
            detail_map[d.media_source_id] = []
        detail_map[d.media_source_id].append(
            {
                "id": d.id,
                "name": d.name,
                "description": d.description,
                "sort_order": d.sort_order,
                "is_active": d.is_active,
                "is_important": getattr(d, "is_important", False),
            }
        )

    # 构建媒体来源映射
    source_map: dict[int, list[dict[str, object]]] = {}
    for s in media_sources:
        if s.media_category_id not in source_map:
            source_map[s.media_category_id] = []
        source_map[s.media_category_id].append(
            {
                "id": s.id,
                "name": s.name,
                "description": s.description,
                "sort_order": s.sort_order,
                "is_active": s.is_active,
                "is_important": getattr(s, "is_important", False),
                "children": detail_map.get(s.id, []),
            }
        )

    # 构建完整树
    tree = []
    for c in categories:
        tree.append(
            {
                "id": c.id,
                "name": c.name,
                "description": c.description,
                "sort_order": c.sort_order,
                "is_active": c.is_active,
                "children": source_map.get(c.id, []),
            }
        )

    return {"data": tree}


@router.get("/flat-options", summary="获取扁平化选项列表")
def get_flat_options(
    db: Session = Depends(get_db),
):
    """获取扁平化的媒体来源选项，用于下拉框（按分组）"""
    categories = (
        db.query(MediaCategory)
        .filter(MediaCategory.is_active == True)
        .order_by(MediaCategory.sort_order)
        .all()
    )
    media_sources = (
        db.query(MediaSource)
        .filter(MediaSource.is_active == True)
        .order_by(MediaSource.sort_order)
        .all()
    )

    # 按量来源分组
    result = {}
    source_map: dict[int, list[str]] = {}
    for s in media_sources:
        if s.media_category_id not in source_map:
            source_map[s.media_category_id] = []
        source_map[s.media_category_id].append(s.name)

    for c in categories:
        result[c.name] = source_map.get(c.id, [])

    return {"data": result}


@router.post("/init-default-data", summary="初始化默认数据")
def init_default_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """初始化默认的媒体来源配置数据"""

    # 检查是否已有数据
    existing = db.query(MediaCategory).first()
    if existing:
        return {"success": False, "message": "已存在配置数据，请勿重复初始化"}

    # 默认数据：三级结构
    # 量来源(MediaCategory) -> 媒体来源(MediaSource) -> 细分媒体(MediaDetail)
    default_data: dict[str, dict[str, list[str]]] = {
        "常规SEM平台": {
            "百度推广": ["百度信息流", "百度搜索", "百度网盟"],
            "中心来电": [],
            "在线报名/直接访问": [],
            "TQ": [],
            "表单": [],
            "市场口碑": [],
        },
        "新媒体平台": {
            "抖音": ["抖音信息流", "抖音搜索"],
            "快手": ["快手信息流", "快手搜索"],
            "小红书": ["小红书信息流", "小红书搜索"],
            "B站": ["B站信息流", "B站搜索"],
            "腾讯视频号": [],
        },
        "网络合作伙伴": {"百教网": [], "91搜客": [], "知了好学": [], "坦途网": []},
        "免费网络": {"其他": []},
    }

    category_order = 0
    for category_name, media_sources_data in default_data.items():
        # 创建量来源
        category = MediaCategory(name=category_name, sort_order=category_order)
        db.add(category)
        db.flush()  # 获取ID

        # 创建媒体来源和细分媒体
        source_order = 0
        for source_name, details in media_sources_data.items():
            # 创建媒体来源
            source = MediaSource(
                media_category_id=category.id, name=source_name, sort_order=source_order
            )
            db.add(source)
            db.flush()  # 获取ID

            # 创建细分媒体
            if details:
                for detail_order, detail_name in enumerate(details):
                    detail = MediaDetail(
                        media_source_id=source.id,
                        name=detail_name,
                        sort_order=detail_order,
                    )
                    db.add(detail)

            source_order += 1

        category_order += 1

    db.commit()
    return {"success": True, "message": "默认数据初始化成功（三级结构）"}


@router.post("/recreate-tables")
def recreate_tables(
    http_request: Request,
    db: Session = Depends(get_db), current_user: User = Depends(get_current_admin_user)
):
    """
    删除并重新创建媒体来源配置表（管理员专用）
    """
    sql_script = """
-- 删除旧表（如果存在）
DROP TABLE IF EXISTS config.media_details CASCADE;
DROP TABLE IF EXISTS config.media_sources CASCADE;
DROP TABLE IF EXISTS config.source_categories CASCADE;
DROP TABLE IF EXISTS config.media_categories CASCADE;

-- 创建媒体来源配置表（三级结构）
-- 量来源 -> 媒体来源 -> 细分媒体

-- 1. 创建量来源表
CREATE TABLE config.media_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(500),
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. 创建媒体来源表
CREATE TABLE config.media_sources (
    id SERIAL PRIMARY KEY,
    media_category_id INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_media_sources_category FOREIGN KEY (media_category_id) 
        REFERENCES config.media_categories(id) ON DELETE CASCADE,
    CONSTRAINT uq_media_sources_category_name UNIQUE (media_category_id, name)
);

CREATE INDEX idx_media_sources_category_id ON config.media_sources(media_category_id);

-- 3. 创建细分媒体表
CREATE TABLE config.media_details (
    id SERIAL PRIMARY KEY,
    media_source_id INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_media_details_source FOREIGN KEY (media_source_id) 
        REFERENCES config.media_sources(id) ON DELETE CASCADE,
    CONSTRAINT uq_media_details_source_name UNIQUE (media_source_id, name)
);

CREATE INDEX idx_media_details_media_source_id ON config.media_details(media_source_id);

-- 4. 初始化默认数据

-- 4.1 常规SEM平台
INSERT INTO config.media_categories (name, sort_order) VALUES ('常规SEM平台', 0);

INSERT INTO config.media_sources (media_category_id, name, sort_order) VALUES
    ((SELECT id FROM config.media_categories WHERE name = '常规SEM平台'), '百度推广', 0),
    ((SELECT id FROM config.media_categories WHERE name = '常规SEM平台'), '中心来电', 1),
    ((SELECT id FROM config.media_categories WHERE name = '常规SEM平台'), '在线报名/直接访问', 2),
    ((SELECT id FROM config.media_categories WHERE name = '常规SEM平台'), 'TQ', 3),
    ((SELECT id FROM config.media_categories WHERE name = '常规SEM平台'), '表单', 4),
    ((SELECT id FROM config.media_categories WHERE name = '常规SEM平台'), '市场口碑', 5);

INSERT INTO config.media_details (media_source_id, name, sort_order) VALUES
    ((SELECT id FROM config.media_sources WHERE name = '百度推广' AND media_category_id = (SELECT id FROM config.media_categories WHERE name = '常规SEM平台')), '百度信息流', 0),
    ((SELECT id FROM config.media_sources WHERE name = '百度推广' AND media_category_id = (SELECT id FROM config.media_categories WHERE name = '常规SEM平台')), '百度搜索', 1),
    ((SELECT id FROM config.media_sources WHERE name = '百度推广' AND media_category_id = (SELECT id FROM config.media_categories WHERE name = '常规SEM平台')), '百度网盟', 2);

-- 4.2 新媒体平台
INSERT INTO config.media_categories (name, sort_order) VALUES ('新媒体平台', 1);

INSERT INTO config.media_sources (media_category_id, name, sort_order) VALUES
    ((SELECT id FROM config.media_categories WHERE name = '新媒体平台'), '抖音', 0),
    ((SELECT id FROM config.media_categories WHERE name = '新媒体平台'), '快手', 1),
    ((SELECT id FROM config.media_categories WHERE name = '新媒体平台'), '小红书', 2),
    ((SELECT id FROM config.media_categories WHERE name = '新媒体平台'), 'B站', 3),
    ((SELECT id FROM config.media_categories WHERE name = '新媒体平台'), '腾讯视频号', 4);

INSERT INTO config.media_details (media_source_id, name, sort_order) VALUES
    ((SELECT id FROM config.media_sources WHERE name = '抖音' AND media_category_id = (SELECT id FROM config.media_categories WHERE name = '新媒体平台')), '抖音粉丝通', 0),
    ((SELECT id FROM config.media_sources WHERE name = '抖音' AND media_category_id = (SELECT id FROM config.media_categories WHERE name = '新媒体平台')), '抖音本地推', 1),
    ((SELECT id FROM config.media_sources WHERE name = '抖音' AND media_category_id = (SELECT id FROM config.media_categories WHERE name = '新媒体平台')), '抖音搜索', 2);

-- 4.3 网络合作伙伴
INSERT INTO config.media_categories (name, sort_order) VALUES ('网络合作伙伴', 2);

INSERT INTO config.media_sources (media_category_id, name, sort_order) VALUES
    ((SELECT id FROM config.media_categories WHERE name = '网络合作伙伴'), '公众号', 0),
    ((SELECT id FROM config.media_categories WHERE name = '网络合作伙伴'), '知乎', 1),
    ((SELECT id FROM config.media_categories WHERE name = '网络合作伙伴'), '大众点评', 2),
    ((SELECT id FROM config.media_categories WHERE name = '网络合作伙伴'), '美团', 3);

-- 4.4 免费网络
INSERT INTO config.media_categories (name, sort_order) VALUES ('免费网络', 3);

INSERT INTO config.media_sources (media_category_id, name, sort_order) VALUES
    ((SELECT id FROM config.media_categories WHERE name = '免费网络'), '自然流量', 0),
    ((SELECT id FROM config.media_categories WHERE name = '免费网络'), 'SEO优化', 1);
"""

    try:
        # 执行SQL脚本
        db.execute(text(sql_script))
        db.commit()
        
        audit_logger = get_audit_logger(http_request)
        audit_logger.set_action(
            action="media_config.recreate_tables",
            action_display="重建媒体来源配置表",
            action_category="admin",
            module="media_config",
            extra={"operator": current_user.real_name},
        )
        audit_logger.add_resource(
            schema_name="config", table_name="media_categories+media_sources+media_details",
            op="RECREATE", biz_key="all-tables",
        )
        
        return {"success": True, "message": "表重建成功，数据初始化完成"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"执行失败: {str(e)}")
