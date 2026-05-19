"""
当面标准化检查表数据模式
"""

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field

# ==================== 咨询步骤相关模式 ====================

class 咨询步骤内容(BaseModel):
    """咨询步骤内容"""
    步骤序号: int = Field(..., description="步骤序号")
    步骤名称: str = Field(..., description="步骤名称")
    内容: Optional[str] = Field(None, description="内容（可编辑）")
    思路关键点: Optional[str] = Field(None, description="思路关键点/领导指正（可编辑）")

    model_config = ConfigDict(from_attributes=True)


# ==================== 当面标准化检查表主表模式 ====================

class 当面标准化检查表创建(BaseModel):
    """创建当面标准化检查表"""
    咨询日期: datetime = Field(..., description="咨询日期")
    学员姓名: str = Field(..., max_length=50, description="学员姓名")
    性别: Optional[str] = Field(None, max_length=10, description="性别")
    年龄: Optional[str] = Field(None, max_length=10, description="年龄")
    状态: Optional[str] = Field(None, max_length=20, description="状态")
    需求: Optional[str] = Field(None, description="需求")
    关注点: Optional[str] = Field(None, description="关注点")
    抗拒点: Optional[str] = Field(None, description="抗拒点")
    陪同人: Optional[str] = Field(None, max_length=50, description="陪同人")
    决策人: Optional[str] = Field(None, max_length=50, description="决策人")
    地区: Optional[str] = Field(None, max_length=100, description="地区")
    记录类型: str = Field(..., max_length=20, description="记录类型（预案/复盘）")
    关联预案ID: Optional[int] = Field(None, description="关联的预案ID")
    咨询步骤内容: Optional[List[Dict[str, Any]]] = Field(None, description="咨询步骤内容")
    自我总结: Optional[str] = Field(None, description="自我总结")
    领导指正: Optional[str] = Field(None, description="领导指正")
    创建人ID: Optional[int] = Field(None, description="创建人ID")
    创建人姓名: Optional[str] = Field(None, max_length=50, description="创建人姓名")
    神殿: Optional[str] = Field(None, max_length=50, description="神殿")

    model_config = ConfigDict(
        json_encoders={datetime: lambda v: v.isoformat()}
    )


class 当面标准化检查表更新(BaseModel):
    """更新当面标准化检查表"""
    记录ID: int = Field(..., description="记录ID")
    咨询日期: Optional[datetime] = Field(None, description="咨询日期")
    学员姓名: Optional[str] = Field(None, max_length=50, description="学员姓名")
    性别: Optional[str] = Field(None, max_length=10, description="性别")
    年龄: Optional[str] = Field(None, max_length=10, description="年龄")
    状态: Optional[str] = Field(None, max_length=20, description="状态")
    需求: Optional[str] = Field(None, description="需求")
    关注点: Optional[str] = Field(None, description="关注点")
    抗拒点: Optional[str] = Field(None, description="抗拒点")
    陪同人: Optional[str] = Field(None, max_length=50, description="陪同人")
    决策人: Optional[str] = Field(None, max_length=50, description="决策人")
    地区: Optional[str] = Field(None, max_length=100, description="地区")
    记录类型: Optional[str] = Field(None, max_length=20, description="记录类型")
    关联预案ID: Optional[int] = Field(None, description="关联的预案ID")
    咨询步骤内容: Optional[List[Dict[str, Any]]] = Field(None, description="咨询步骤内容")
    自我总结: Optional[str] = Field(None, description="自我总结")
    领导指正: Optional[str] = Field(None, description="领导指正")
    神殿: Optional[str] = Field(None, max_length=50, description="神殿")

    model_config = ConfigDict(
        json_encoders={datetime: lambda v: v.isoformat()}
    )


class 当面标准化检查表响应(BaseModel):
    """当面标准化检查表响应"""
    记录ID: int = Field(..., description="记录ID")
    咨询日期: Optional[datetime] = Field(None, description="咨询日期")
    学员姓名: str = Field(..., description="学员姓名")
    性别: Optional[str] = Field(None, description="性别")
    年龄: Optional[str] = Field(None, description="年龄")
    状态: Optional[str] = Field(None, description="状态")
    需求: Optional[str] = Field(None, description="需求")
    关注点: Optional[str] = Field(None, description="关注点")
    抗拒点: Optional[str] = Field(None, description="抗拒点")
    陪同人: Optional[str] = Field(None, description="陪同人")
    决策人: Optional[str] = Field(None, description="决策人")
    地区: Optional[str] = Field(None, description="地区")
    记录类型: str = Field(..., description="记录类型")
    关联预案ID: Optional[int] = Field(None, description="关联预案ID")
    咨询步骤内容: Optional[List[Dict[str, Any]]] = Field(None, description="咨询步骤内容")
    自我总结: Optional[str] = Field(None, description="自我总结")
    领导指正: Optional[str] = Field(None, description="领导指正")
    创建人ID: Optional[int] = Field(None, description="创建人ID")
    创建人姓名: Optional[str] = Field(None, description="创建人姓名")
    神殿: Optional[str] = Field(None, description="神殿")
    创建时间: Optional[datetime] = Field(None, description="创建时间")
    更新时间: Optional[datetime] = Field(None, description="更新时间")

    model_config = ConfigDict(
        json_encoders={datetime: lambda v: v.isoformat()},
        from_attributes=True
    )


# ==================== 模板配置相关模式 ====================

class 当面标准化模板配置创建(BaseModel):
    """创建当面标准化模板配置"""
    模板名称: str = Field(..., max_length=100, description="模板名称")
    模板类型: str = Field(..., max_length=20, description="模板类型（预案/复盘）")
    咨询步骤配置: List[Dict[str, Any]] = Field(..., description="咨询步骤配置")
    基本信息字段配置: Optional[List[Dict[str, Any]]] = Field(None, description="基本信息字段配置")
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


class 当面标准化模板配置更新(BaseModel):
    """更新当面标准化模板配置"""
    模板ID: int = Field(..., description="模板ID")
    模板名称: Optional[str] = Field(None, max_length=100, description="模板名称")
    模板类型: Optional[str] = Field(None, max_length=20, description="模板类型")
    咨询步骤配置: Optional[List[Dict[str, Any]]] = Field(None, description="咨询步骤配置")
    基本信息字段配置: Optional[List[Dict[str, Any]]] = Field(None, description="基本信息字段配置")
    是否启用: Optional[int] = Field(None, description="是否启用")
    是否默认: Optional[int] = Field(None, description="是否默认模板")
    排序序号: Optional[int] = Field(None, description="排序序号")
    备注: Optional[str] = Field(None, description="备注")
    神殿: Optional[str] = Field(None, max_length=50, description="神殿")

    model_config = ConfigDict(
        json_encoders={datetime: lambda v: v.isoformat()}
    )


class 当面标准化模板配置响应(BaseModel):
    """当面标准化模板配置响应"""
    模板ID: int = Field(..., description="模板ID")
    模板名称: str = Field(..., description="模板名称")
    模板类型: str = Field(..., description="模板类型")
    咨询步骤配置: List[Dict[str, Any]] = Field(..., description="咨询步骤配置")
    基本信息字段配置: Optional[List[Dict[str, Any]]] = Field(None, description="基本信息字段配置")
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

class 当面标准化检查表查询参数(BaseModel):
    """当面标准化检查表查询参数"""
    记录类型: Optional[str] = Field(None, description="记录类型")
    学员姓名: Optional[str] = Field(None, description="学员姓名")
    开始日期: Optional[datetime] = Field(None, description="开始日期")
    结束日期: Optional[datetime] = Field(None, description="结束日期")
    神殿: Optional[str] = Field(None, description="神殿")
    创建人ID: Optional[int] = Field(None, description="创建人ID")
    页码: int = Field(1, ge=1, description="页码")
    每页数量: int = Field(20, ge=1, le=100, description="每页数量")


class 当面标准化模板配置查询参数(BaseModel):
    """当面标准化模板配置查询参数"""
    模板类型: Optional[str] = Field(None, description="模板类型")
    是否启用: Optional[int] = Field(None, description="是否启用")
    神殿: Optional[str] = Field(None, description="神殿")
    页码: int = Field(1, ge=1, description="页码")
    每页数量: int = Field(20, ge=1, le=100, description="每页数量")


# ==================== 分页响应 ====================

class 当面标准化检查表分页响应(BaseModel):
    """当面标准化检查表分页响应"""
    总记录数: int = Field(..., description="总记录数")
    总页数: int = Field(..., description="总页数")
    当前页: int = Field(..., description="当前页")
    每页数量: int = Field(..., description="每页数量")
    数据列表: List[当面标准化检查表响应] = Field(..., description="数据列表")


class 当面标准化模板配置分页响应(BaseModel):
    """当面标准化模板配置分页响应"""
    总记录数: int = Field(..., description="总记录数")
    总页数: int = Field(..., description="总页数")
    当前页: int = Field(..., description="当前页")
    每页数量: int = Field(..., description="每页数量")
    数据列表: List[当面标准化模板配置响应] = Field(..., description="数据列表")
