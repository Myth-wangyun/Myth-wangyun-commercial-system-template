"""
就业明细Pydantic模型
"""

from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class 就业明细基础(BaseModel):
    """就业明细基础模型"""

    序号: int = Field(..., description="序号")
    姓名: str = Field(..., description="姓名")
    性别: str = Field(..., description="性别")
    年龄: int = Field(..., description="年龄")
    所报专业: str = Field(..., description="所报专业")
    学历: str = Field(..., description="学历")
    联系电话: str = Field(..., description="联系电话")
    入职时间: date = Field(..., description="入职时间")
    神殿: str = Field(..., description="所属神殿")
    就业地区: str = Field(..., description="就业地区")
    就业单位: str = Field(..., description="就业单位")
    就业岗位: str = Field(..., description="就业岗位")
    转正薪资: Optional[str] = Field(None, description="转正薪资详情")
    转正金额: Optional[float] = Field(None, description="转正金额(元)")
    回访情况: Optional[str] = Field(None, description="回访情况")
    回访入职公司: Optional[str] = Field(None, description="回访入职公司")
    回访转正金额: Optional[float] = Field(None, description="回访转正金额(元)")


class 就业明细创建(就业明细基础):
    """创建就业明细模型"""

    pass


class 就业明细更新(BaseModel):
    """更新就业明细模型"""

    序号: Optional[int] = Field(None, description="序号")
    姓名: Optional[str] = Field(None, description="姓名")
    性别: Optional[str] = Field(None, description="性别")
    年龄: Optional[int] = Field(None, description="年龄")
    所报专业: Optional[str] = Field(None, description="所报专业")
    学历: Optional[str] = Field(None, description="学历")
    联系电话: Optional[str] = Field(None, description="联系电话")
    入职时间: Optional[date] = Field(None, description="入职时间")
    神殿: Optional[str] = Field(None, description="所属神殿")
    就业地区: Optional[str] = Field(None, description="就业地区")
    就业单位: Optional[str] = Field(None, description="就业单位")
    就业岗位: Optional[str] = Field(None, description="就业岗位")
    转正薪资: Optional[str] = Field(None, description="转正薪资详情")
    转正金额: Optional[float] = Field(None, description="转正金额(元)")
    回访情况: Optional[str] = Field(None, description="回访情况")
    回访入职公司: Optional[str] = Field(None, description="回访入职公司")
    回访转正金额: Optional[float] = Field(None, description="回访转正金额(元)")


class 就业明细响应(就业明细基础):
    """就业明细响应模型"""

    明细ID: int = Field(..., description="明细ID")
    创建时间: Optional[datetime] = Field(None, description="创建时间")
    更新时间: Optional[datetime] = Field(None, description="更新时间")

    model_config = ConfigDict(
        from_attributes=True,
    )


class 就业统计响应(BaseModel):
    """就业统计响应模型"""

    总人数: int = Field(..., description="总人数")
    专业数量: int = Field(..., description="专业数量")
    就业地区数量: int = Field(..., description="就业地区数量")
    就业单位数量: int = Field(..., description="就业单位数量")
    平均转正金额: float = Field(..., description="平均转正金额")
    最高转正金额: float = Field(..., description="最高转正金额")
    最低转正金额: float = Field(..., description="最低转正金额")
    平均回访转正金额: float = Field(..., description="平均回访转正金额")


class 专业就业统计响应(BaseModel):
    """专业就业统计响应模型"""

    所报专业: str = Field(..., description="所报专业")
    就业人数: int = Field(..., description="就业人数")
    平均转正金额: float = Field(..., description="平均转正金额")
    最高转正金额: float = Field(..., description="最高转正金额")
    最低转正金额: float = Field(..., description="最低转正金额")


class 地区就业统计响应(BaseModel):
    """地区就业统计响应模型"""

    就业地区: str = Field(..., description="就业地区")
    就业人数: int = Field(..., description="就业人数")
    平均转正金额: float = Field(..., description="平均转正金额")
    最高转正金额: float = Field(..., description="最高转正金额")
    最低转正金额: float = Field(..., description="最低转正金额")
