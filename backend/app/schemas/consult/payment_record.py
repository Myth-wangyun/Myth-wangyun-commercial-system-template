"""
咨询缴费记录Schema定义
与咨询量深度绑定，为教质班主任提供细节信息
"""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field

# ==================== 缴费记录 Schema ====================


class 缴费记录创建(BaseModel):
    """创建缴费记录（与咨询量一对一绑定）"""

    记录ID: int = Field(..., description="关联的咨询量明细记录ID（唯一）")
    对象ID: Optional[int] = Field(
        None, description="关联的咨询对象ID（可自动从记录ID获取）"
    )

    # 应交金额
    应交金额: int = Field(0, ge=0, description="应交金额（元）")

    # 首款信息
    首款金额: int = Field(0, ge=0, description="首款金额（元）")
    首款时间: Optional[datetime] = Field(None, description="首款时间")
    首款方式: Optional[str] = Field(None, max_length=50, description="首款方式")
    首款收款人: Optional[str] = Field(None, max_length=50, description="首款收款人")
    首款备注: Optional[str] = Field(None, max_length=500, description="首款备注")

    # 教质班主任相关
    班主任: Optional[str] = Field(None, max_length=50, description="班主任")
    班级: Optional[str] = Field(None, max_length=100, description="班级")

    model_config = ConfigDict(
        from_attributes=True,
    )


class 缴费记录更新(BaseModel):
    """更新缴费记录"""

    应交金额: Optional[int] = Field(None, ge=0)
    首款金额: Optional[int] = Field(None, ge=0)
    首款时间: Optional[datetime] = None
    首款方式: Optional[str] = None
    首款收款人: Optional[str] = None
    首款备注: Optional[str] = None
    班主任: Optional[str] = None
    班级: Optional[str] = None
    催缴状态: Optional[str] = None
    催缴备注: Optional[str] = None

    model_config = ConfigDict(
        from_attributes=True,
    )


class 缴费记录响应(BaseModel):
    """缴费记录响应"""

    缴费ID: int
    记录ID: int
    对象ID: int
    应交金额: int
    首款金额: int
    首款时间: Optional[datetime]
    首款方式: Optional[str]
    首款收款人: Optional[str]
    首款备注: Optional[str]
    已交总额: int
    欠费金额: int
    缴费状态: str
    后续缴费次数: int
    班主任: Optional[str]
    班级: Optional[str]
    催缴状态: Optional[str]
    催缴备注: Optional[str]
    最后催缴时间: Optional[datetime]
    创建人: Optional[str]
    创建时间: Optional[datetime]
    更新时间: Optional[datetime]

    model_config = ConfigDict(
        from_attributes=True,
    )


# ==================== 缴费明细 Schema ====================


class 缴费明细创建(BaseModel):
    """创建缴费明细（后续缴费）"""

    缴费ID: int = Field(..., description="关联的缴费记录ID")
    缴费金额: int = Field(..., gt=0, description="本次缴费金额（元）")
    缴费时间: datetime = Field(..., description="缴费时间")
    缴费方式: Optional[str] = Field(None, max_length=50, description="缴费方式")
    收款人: Optional[str] = Field(None, max_length=50, description="收款人")
    凭证号: Optional[str] = Field(None, max_length=100, description="收据/凭证号")
    备注: Optional[str] = Field(None, max_length=500, description="备注")

    model_config = ConfigDict(
        from_attributes=True,
    )


class 缴费明细响应(BaseModel):
    """缴费明细响应"""

    明细ID: int
    缴费ID: int
    缴费金额: int
    缴费时间: Optional[datetime]
    缴费方式: Optional[str]
    收款人: Optional[str]
    凭证号: Optional[str]
    备注: Optional[str]
    创建人: Optional[str]
    创建时间: Optional[datetime]

    model_config = ConfigDict(
        from_attributes=True,
    )


# ==================== 完整缴费信息 Schema ====================


class 缴费完整信息响应(BaseModel):
    """缴费完整信息响应（记录+明细列表）"""

    缴费记录: Optional[缴费记录响应] = Field(None, description="缴费记录汇总")
    后续缴费明细: List[缴费明细响应] = Field(
        default_factory=list, description="后续缴费明细列表"
    )

    # 附加咨询量信息（方便教质班主任查看）
    咨询者姓名: Optional[str] = None
    电话: Optional[str] = None
    报名专业: Optional[str] = None
    神殿: Optional[str] = None
    咨询师: Optional[str] = None
    报名时间: Optional[datetime] = None

    model_config = ConfigDict(
        from_attributes=True,
    )


# ==================== 教质班主任视图 Schema ====================


class 班主任缴费列表项(BaseModel):
    """班主任查看的缴费列表项"""

    缴费ID: int
    记录ID: int
    咨询者姓名: Optional[str]
    电话: Optional[str]
    班级: Optional[str]
    应交金额: int
    已交总额: int
    欠费金额: int
    缴费状态: str
    催缴状态: Optional[str]
    报名专业: Optional[str]
    报名时间: Optional[datetime]

    model_config = ConfigDict(
        from_attributes=True,
    )


class 班主任缴费统计(BaseModel):
    """班主任缴费统计"""

    总学员数: int
    已缴清人数: int
    部分缴费人数: int
    未缴费人数: int
    应收总额: int
    已收总额: int
    欠费总额: int

    model_config = ConfigDict(
        from_attributes=True,
    )


# ==================== 兼容旧接口的 Schema ====================


class 缴费汇总创建(缴费记录创建):
    """兼容旧接口"""

    pass


class 缴费汇总更新(缴费记录更新):
    """兼容旧接口"""

    pass
