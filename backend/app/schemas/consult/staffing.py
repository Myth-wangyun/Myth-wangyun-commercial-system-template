"""
祈福司职数相关 Pydantic Schema
"""

from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field

# ==================== 祈福司职数汇总表 Schema ====================


class 祈福司职数汇总表Base(BaseModel):
    """祈福司职数汇总表基础模型"""

    年份: int = Field(..., ge=2000, le=2100, description="年份")
    神殿: str = Field(..., max_length=50, description="神殿名称")

    咨询总职数: Optional[int] = Field(default=0, ge=0, description="咨询总职数")
    咨询干部职数: Optional[int] = Field(default=0, ge=0, description="咨询干部职数")
    咨询员工职数: Optional[int] = Field(default=0, ge=0, description="咨询员工职数")

    渠道总职数: Optional[int] = Field(default=0, ge=0, description="渠道总职数")
    县办: Optional[int] = Field(default=0, ge=0, description="县办职数")
    乡办: Optional[int] = Field(default=0, ge=0, description="乡办职数")
    信息员: Optional[int] = Field(default=0, ge=0, description="信息员职数")


class 祈福司职数汇总表创建(祈福司职数汇总表Base):
    """创建祈福司职数汇总表"""

    pass


class 祈福司职数汇总表更新(BaseModel):
    """更新祈福司职数汇总表"""

    咨询总职数: Optional[int] = Field(default=None, ge=0)
    咨询干部职数: Optional[int] = Field(default=None, ge=0)
    咨询员工职数: Optional[int] = Field(default=None, ge=0)
    渠道总职数: Optional[int] = Field(default=None, ge=0)
    县办: Optional[int] = Field(default=None, ge=0)
    乡办: Optional[int] = Field(default=None, ge=0)
    信息员: Optional[int] = Field(default=None, ge=0)


class 祈福司职数汇总表响应(祈福司职数汇总表Base):
    """祈福司职数汇总表响应"""

    记录ID: int
    创建时间: Optional[str] = None
    更新时间: Optional[str] = None

    model_config = ConfigDict(
        from_attributes=True,
    )


# ==================== 咨询师人员明细表 Schema ====================


class 咨询师人员明细表Base(BaseModel):
    """咨询师人员明细表基础模型"""

    年份: int = Field(..., ge=2000, le=2100, description="年份")
    神殿: str = Field(..., max_length=50, description="神殿名称")
    序号: int = Field(..., ge=1, description="序号")

    姓名: Optional[str] = Field(default=None, max_length=50, description="姓名")
    岗位: Optional[str] = Field(default=None, max_length=100, description="岗位")
    思想: Optional[str] = Field(default=None, description="思想")
    管理: Optional[str] = Field(default=None, description="管理")
    业务: Optional[str] = Field(default=None, description="业务")


class 咨询师人员明细表创建(咨询师人员明细表Base):
    """创建咨询师人员明细表"""

    pass


class 咨询师人员明细表更新(BaseModel):
    """更新咨询师人员明细表"""

    姓名: Optional[str] = Field(default=None, max_length=50)
    岗位: Optional[str] = Field(default=None, max_length=100)
    思想: Optional[str] = Field(default=None)
    管理: Optional[str] = Field(default=None)
    业务: Optional[str] = Field(default=None)


class 咨询师人员明细表响应(咨询师人员明细表Base):
    """咨询师人员明细表响应"""

    记录ID: int
    创建时间: Optional[str] = None
    更新时间: Optional[str] = None

    model_config = ConfigDict(
        from_attributes=True,
    )


# ==================== 渠道人员明细表 Schema ====================


class 渠道人员明细表Base(BaseModel):
    """渠道人员明细表基础模型"""

    年份: int = Field(..., ge=2000, le=2100, description="年份")
    神殿: str = Field(..., max_length=50, description="神殿名称")
    序号: int = Field(..., ge=1, description="序号")

    姓名: Optional[str] = Field(default=None, max_length=50, description="姓名")
    岗位: Optional[str] = Field(default=None, max_length=100, description="岗位")
    思想: Optional[str] = Field(default=None, description="思想")
    管理: Optional[str] = Field(default=None, description="管理")
    业务: Optional[str] = Field(default=None, description="业务")


class 渠道人员明细表创建(渠道人员明细表Base):
    """创建渠道人员明细表"""

    pass


class 渠道人员明细表更新(BaseModel):
    """更新渠道人员明细表"""

    姓名: Optional[str] = Field(default=None, max_length=50)
    岗位: Optional[str] = Field(default=None, max_length=100)
    思想: Optional[str] = Field(default=None)
    管理: Optional[str] = Field(default=None)
    业务: Optional[str] = Field(default=None)


class 渠道人员明细表响应(渠道人员明细表Base):
    """渠道人员明细表响应"""

    记录ID: int
    创建时间: Optional[str] = None
    更新时间: Optional[str] = None

    model_config = ConfigDict(
        from_attributes=True,
    )


# ==================== 批量操作 Schema ====================


class 神殿职数明细保存请求(BaseModel):
    """保存神殿职数明细（包括汇总和人员明细）"""

    年份: int = Field(..., ge=2000, le=2100)
    神殿: str = Field(..., max_length=50)

    # 汇总数据
    汇总数据: 祈福司职数汇总表更新

    # 咨询师明细列表
    咨询师明细: List[咨询师人员明细表创建]

    # 渠道人员明细列表
    渠道人员明细: List[渠道人员明细表创建]


class 神殿职数明细响应(BaseModel):
    """神殿职数明细响应"""

    汇总数据: 祈福司职数汇总表响应
    咨询师明细: List[咨询师人员明细表响应]
    渠道人员明细: List[渠道人员明细表响应]
