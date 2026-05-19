"""
电话标准化检查表数据模式
"""

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field

# ==================== 次子结构 ====================

class 次子结构项(BaseModel):
    """次子结构项"""
    名称: str = Field(..., description="次子结构名称")
    是否必选: Optional[bool] = Field(True, description="是否必选")
    可编辑: Optional[bool] = Field(True, description="是否可编辑")
    完成情况: Optional[str] = Field(None, description="完成情况：√完成，×未完成，○不需要")

    model_config = ConfigDict(from_attributes=True)


# ==================== 子结构 ====================

class 子结构项(BaseModel):
    """子结构项"""
    名称: str = Field(..., description="子结构名称")
    是否必选: Optional[bool] = Field(True, description="是否必选")
    次子结构: Optional[List[次子结构项]] = Field(default_factory=list, description="次子结构列表")
    完成情况: Optional[str] = Field(None, description="完成情况：√完成，×未完成，○不需要")

    model_config = ConfigDict(from_attributes=True)


# ==================== 步骤 ====================

class 步骤项(BaseModel):
    """步骤项"""
    步骤: str = Field(..., description="步骤名称，如：第一步：寒暄暖场")
    子结构: Optional[List[子结构项]] = Field(default_factory=list, description="子结构列表")
    完成情况: Optional[str] = Field(None, description="完成情况：√完成，×未完成，○不需要")
    纠正情况: Optional[str] = Field(None, description="纠正情况")
    备注: Optional[str] = Field(None, description="备注")

    model_config = ConfigDict(from_attributes=True)


# ==================== 电话标准化检查表主表模式 ====================

class 电话标准化检查表创建(BaseModel):
    """创建电话标准化检查表"""
    神殿: Optional[str] = Field(None, max_length=50, description="神殿")
    咨询师: str = Field(..., max_length=50, description="咨询师")
    审核人: Optional[str] = Field(None, max_length=50, description="审核人")
    日期: datetime = Field(..., description="日期")
    学员姓名: Optional[str] = Field(None, max_length=50, description="学员姓名")
    联系方式: Optional[str] = Field(None, max_length=50, description="联系方式")
    检查内容: Optional[List[Dict[str, Any]]] = Field(None, description="检查内容（步骤、子结构、次子结构）")
    总结: Optional[str] = Field(None, description="总结")
    备注: Optional[str] = Field(None, description="备注")
    总分: Optional[int] = Field(None, description="总分")
    得分: Optional[int] = Field(None, description="得分")
    创建人ID: Optional[int] = Field(None, description="创建人ID")
    创建人姓名: Optional[str] = Field(None, max_length=50, description="创建人姓名")

    model_config = ConfigDict(
        json_encoders={datetime: lambda v: v.isoformat()}
    )


class 电话标准化检查表更新(BaseModel):
    """更新电话标准化检查表"""
    神殿: Optional[str] = Field(None, max_length=50, description="神殿")
    咨询师: Optional[str] = Field(None, max_length=50, description="咨询师")
    审核人: Optional[str] = Field(None, max_length=50, description="审核人")
    日期: Optional[datetime] = Field(None, description="日期")
    学员姓名: Optional[str] = Field(None, max_length=50, description="学员姓名")
    联系方式: Optional[str] = Field(None, max_length=50, description="联系方式")
    检查内容: Optional[List[Dict[str, Any]]] = Field(None, description="检查内容")
    总结: Optional[str] = Field(None, description="总结")
    备注: Optional[str] = Field(None, description="备注")
    总分: Optional[int] = Field(None, description="总分")
    得分: Optional[int] = Field(None, description="得分")

    model_config = ConfigDict(
        json_encoders={datetime: lambda v: v.isoformat()}
    )


class 电话标准化检查表响应(BaseModel):
    """电话标准化检查表响应"""
    记录ID: int = Field(..., description="记录ID")
    神殿: Optional[str] = Field(None, description="神殿")
    咨询师: str = Field(..., description="咨询师")
    审核人: Optional[str] = Field(None, description="审核人")
    日期: Optional[datetime] = Field(None, description="日期")
    学员姓名: Optional[str] = Field(None, description="学员姓名")
    联系方式: Optional[str] = Field(None, description="联系方式")
    检查内容: Optional[List[Dict[str, Any]]] = Field(None, description="检查内容")
    总结: Optional[str] = Field(None, description="总结")
    备注: Optional[str] = Field(None, description="备注")
    总分: Optional[int] = Field(None, description="总分")
    得分: Optional[int] = Field(None, description="得分")
    创建人ID: Optional[int] = Field(None, description="创建人ID")
    创建人姓名: Optional[str] = Field(None, description="创建人姓名")
    创建时间: Optional[datetime] = Field(None, description="创建时间")
    更新时间: Optional[datetime] = Field(None, description="更新时间")

    model_config = ConfigDict(
        json_encoders={datetime: lambda v: v.isoformat()},
        from_attributes=True
    )


# ==================== 模板配置相关模式 ====================

class 电话标准化模板配置创建(BaseModel):
    """创建电话标准化模板配置"""
    模板名称: str = Field(..., max_length=100, description="模板名称")
    模板内容: List[Dict[str, Any]] = Field(..., description="模板内容（步骤、子结构、次子结构）")
    是否启用: Optional[int] = Field(1, description="是否启用（0-禁用 1-启用）")
    是否默认: Optional[int] = Field(0, description="是否默认模板（0-否 1-是）")
    排序序号: Optional[int] = Field(0, description="排序序号")
    备注: Optional[str] = Field(None, description="备注")
    创建人ID: Optional[int] = Field(None, description="创建人ID")
    创建人姓名: Optional[str] = Field(None, max_length=50, description="创建人姓名")
    神殿: Optional[str] = Field(None, max_length=50, description="神殿")

    model_config = ConfigDict(
        json_encoders={datetime: lambda v: v.isoformat()}
    )


class 电话标准化模板配置更新(BaseModel):
    """更新电话标准化模板配置"""
    模板名称: Optional[str] = Field(None, max_length=100, description="模板名称")
    模板内容: Optional[List[Dict[str, Any]]] = Field(None, description="模板内容")
    是否启用: Optional[int] = Field(None, description="是否启用")
    是否默认: Optional[int] = Field(None, description="是否默认模板")
    排序序号: Optional[int] = Field(None, description="排序序号")
    备注: Optional[str] = Field(None, description="备注")
    神殿: Optional[str] = Field(None, max_length=50, description="神殿")

    model_config = ConfigDict(
        json_encoders={datetime: lambda v: v.isoformat()}
    )


class 电话标准化模板配置响应(BaseModel):
    """电话标准化模板配置响应"""
    模板ID: int = Field(..., description="模板ID")
    模板名称: str = Field(..., description="模板名称")
    模板内容: List[Dict[str, Any]] = Field(..., description="模板内容")
    是否启用: int = Field(..., description="是否启用")
    是否默认: int = Field(..., description="是否默认")
    排序序号: int = Field(..., description="排序序号")
    备注: Optional[str] = Field(None, description="备注")
    创建人ID: Optional[int] = Field(None, description="创建人ID")
    创建人姓名: Optional[str] = Field(None, description="创建人姓名")
    神殿: Optional[str] = Field(None, description="神殿")
    创建时间: Optional[datetime] = Field(None, description="创建时间")
    更新时间: Optional[datetime] = Field(None, description="更新时间")

    model_config = ConfigDict(
        json_encoders={datetime: lambda v: v.isoformat()},
        from_attributes=True
    )


# ==================== 分页查询参数 ====================

class 电话标准化检查表查询参数(BaseModel):
    """电话标准化检查表查询参数"""
    咨询师: Optional[str] = Field(None, description="咨询师")
    神殿: Optional[str] = Field(None, description="神殿")
    审核人: Optional[str] = Field(None, description="审核人")
    开始日期: Optional[datetime] = Field(None, description="开始日期")
    结束日期: Optional[datetime] = Field(None, description="结束日期")
    创建人ID: Optional[int] = Field(None, description="创建人ID")
    页码: int = Field(1, ge=1, description="页码")
    每页数量: int = Field(20, ge=1, le=100, description="每页数量")


class 电话标准化模板配置查询参数(BaseModel):
    """电话标准化模板配置查询参数"""
    是否启用: Optional[int] = Field(None, description="是否启用")
    神殿: Optional[str] = Field(None, description="神殿")
    页码: int = Field(1, ge=1, description="页码")
    每页数量: int = Field(20, ge=1, le=100, description="每页数量")


# ==================== 分页响应 ====================

class 电话标准化检查表分页响应(BaseModel):
    """电话标准化检查表分页响应"""
    总记录数: int = Field(..., description="总记录数")
    总页数: int = Field(..., description="总页数")
    当前页: int = Field(..., description="当前页")
    每页数量: int = Field(..., description="每页数量")
    数据列表: List[电话标准化检查表响应] = Field(..., description="数据列表")


class 电话标准化模板配置分页响应(BaseModel):
    """电话标准化模板配置分页响应"""
    总记录数: int = Field(..., description="总记录数")
    总页数: int = Field(..., description="总页数")
    当前页: int = Field(..., description="当前页")
    每页数量: int = Field(..., description="每页数量")
    数据列表: List[电话标准化模板配置响应] = Field(..., description="数据列表")
