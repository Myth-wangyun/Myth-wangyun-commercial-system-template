"""
祈福司人力资源基础信息表 Pydantic Schema
"""

from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class 人员基础信息Base(BaseModel):
    """人员基础信息基础模型"""

    年份: int = Field(..., ge=2000, le=2100, description="年份")
    序号: Optional[int] = Field(default=None, description="序号")
    员工ID: Optional[str] = Field(default=None, max_length=50, description="员工ID")
    神殿: str = Field(..., max_length=50, description="神殿名称")
    部门: Optional[str] = Field(default="祈福司", max_length=50, description="部门")
    岗位: Optional[str] = Field(default=None, max_length=50, description="岗位")
    岗位类别: Optional[str] = Field(default=None, max_length=50, description="岗位类别")
    姓名: str = Field(..., max_length=50, description="姓名")
    性别: Optional[str] = Field(default=None, max_length=10, description="性别")
    民族: Optional[str] = Field(default=None, max_length=20, description="民族")
    联系电话: Optional[str] = Field(default=None, max_length=50, description="联系电话")
    籍贯: Optional[str] = Field(default=None, max_length=100, description="籍贯")


class 人员基础信息创建(人员基础信息Base):
    """创建人员基础信息"""

    第一学历: Optional[str] = Field(default=None, max_length=50, description="第一学历")
    第一学历专业: Optional[str] = Field(
        default=None, max_length=100, description="第一学历所学专业"
    )
    第一学历院校: Optional[str] = Field(
        default=None, max_length=200, description="第一学历毕业院校"
    )
    第二学历: Optional[str] = Field(default=None, max_length=50, description="第二学历")
    第二学历专业: Optional[str] = Field(
        default=None, max_length=100, description="第二学历所学专业"
    )
    第二学历院校: Optional[str] = Field(
        default=None, max_length=200, description="第二学历毕业院校"
    )
    备注: Optional[str] = Field(default=None, description="备注")


class 人员基础信息更新(BaseModel):
    """更新人员基础信息"""

    序号: Optional[int] = Field(default=None, description="序号")
    员工ID: Optional[str] = Field(default=None, max_length=50)
    神殿: Optional[str] = Field(default=None, max_length=50)
    部门: Optional[str] = Field(default=None, max_length=50)
    岗位: Optional[str] = Field(default=None, max_length=50)
    岗位类别: Optional[str] = Field(default=None, max_length=50)
    姓名: Optional[str] = Field(default=None, max_length=50)
    性别: Optional[str] = Field(default=None, max_length=10)
    民族: Optional[str] = Field(default=None, max_length=20)
    联系电话: Optional[str] = Field(default=None, max_length=50)
    籍贯: Optional[str] = Field(default=None, max_length=100)
    第一学历: Optional[str] = Field(default=None, max_length=50)
    第一学历专业: Optional[str] = Field(default=None, max_length=100)
    第一学历院校: Optional[str] = Field(default=None, max_length=200)
    第二学历: Optional[str] = Field(default=None, max_length=50)
    第二学历专业: Optional[str] = Field(default=None, max_length=100)
    第二学历院校: Optional[str] = Field(default=None, max_length=200)
    备注: Optional[str] = Field(default=None)


class 人员基础信息响应(人员基础信息创建):
    """人员基础信息响应"""

    记录ID: int
    创建时间: Optional[str] = None
    更新时间: Optional[str] = None

    model_config = ConfigDict(
        from_attributes=True,
    )


class 人员基础信息批量创建(BaseModel):
    """批量创建人员基础信息"""

    records: List[人员基础信息创建]


class 人员基础信息批量响应(BaseModel):
    """批量操作响应"""

    success: int = 0
    failed: int = 0
    message: str = ""
    records: List[人员基础信息响应] = []
