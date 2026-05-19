"""
媒体来源配置模型
层级关系：量来源 -> 媒体来源 -> 细分媒体
"""

from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.models.user import Base as AccountBase


class MediaCategory(AccountBase):
    """量来源（一级分类）"""

    __tablename__ = "media_categories"
    __table_args__ = (
        UniqueConstraint("name", name="uq_media_categories_name"),
        {"schema": "config"},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="主键ID")
    name: Mapped[str] = mapped_column(String(100), nullable=False, comment="量来源名称")
    description: Mapped[str | None] = mapped_column(String(500), nullable=True, comment="描述说明")
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment="排序序号")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, comment="是否启用")
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now(), comment="创建时间"
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
        comment="更新时间",
    )

    # 关联媒体来源
    media_sources: Mapped[list["MediaSource"]] = relationship("MediaSource", back_populates="media_category", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<MediaCategory(id={self.id}, name={self.name})>"


class MediaSource(AccountBase):
    """媒体来源（二级分类）"""

    __tablename__ = "media_sources"
    __table_args__ = (
        UniqueConstraint("media_category_id", "name", name="uq_media_sources_category_name"),
        Index("idx_media_sources_category_id", "media_category_id"),
        {"schema": "config"},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="主键ID")
    media_category_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("config.media_categories.id", ondelete="CASCADE"),
        nullable=False,
        comment="所属量来源ID",
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False, comment="媒体来源名称")
    description: Mapped[str | None] = mapped_column(String(500), nullable=True, comment="描述说明")
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment="排序序号")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, comment="是否启用")
    is_important: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, comment="是否重要来源（在统计表中单独显示列）")
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now(), comment="创建时间"
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
        comment="更新时间",
    )

    # 关联
    media_category: Mapped["MediaCategory"] = relationship("MediaCategory", back_populates="media_sources")
    media_details: Mapped[list["MediaDetail"]] = relationship("MediaDetail", back_populates="media_source", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<MediaSource(id={self.id}, name={self.name})>"


class MediaDetail(AccountBase):
    """细分媒体（三级分类）"""

    __tablename__ = "media_details"
    __table_args__ = (
        UniqueConstraint("media_source_id", "name", name="uq_media_details_source_name"),
        Index("idx_media_details_media_source_id", "media_source_id"),
        {"schema": "config"},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="主键ID")
    media_source_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("config.media_sources.id", ondelete="CASCADE"),
        nullable=False,
        comment="所属媒体来源ID",
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False, comment="细分媒体名称")
    description: Mapped[str | None] = mapped_column(String(500), nullable=True, comment="描述说明")
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment="排序序号")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, comment="是否启用")
    is_important: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, comment="是否重要来源（在统计表中单独显示列）")
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now(), comment="创建时间"
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
        comment="更新时间",
    )

    # 关联
    media_source: Mapped["MediaSource"] = relationship("MediaSource", back_populates="media_details")

    def __repr__(self) -> str:
        return f"<MediaDetail(id={self.id}, name={self.name})>"
