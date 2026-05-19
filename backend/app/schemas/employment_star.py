"""
神殿后端就业明星汇总表 Schemas
"""

from typing import List, Optional

from pydantic import BaseModel, Field


class 就业明星响应(BaseModel):
    """就业明星记录响应模型（用于自动生成结果）"""

    serialNumber: int = Field(..., description="序号")
    studentName: str = Field(..., description="学员姓名")
    gender: str = Field(..., description="性别")
    graduationAge: int = Field(..., description="毕业年龄")
    highestEducation: str = Field(..., description="最高学历")
    major: str = Field(..., description="专业")
    programLength: str = Field(..., description="学制")
    className: str = Field(..., description="班级名称")
    entryTime: str = Field(..., description="入职时间（YYYY-MM-DD）")
    employmentRegion: str = Field(..., description="就业地区")
    employer: str = Field(..., description="就业单位")
    jobPosition: str = Field(..., description="就业岗位")
    employmentSalary: float = Field(..., description="就业薪资(元)")
    campus: str = Field(..., description="神殿")


class 就业明星保存项(BaseModel):
  """前端提交的就业明星记录（用于保存到后端表）"""

  serialNumber: int = Field(..., description="序号")
  studentName: str = Field(..., description="学员姓名")
  gender: Optional[str] = Field(None, description="性别")
  graduationAge: Optional[int] = Field(None, description="毕业年龄")
  highestEducation: Optional[str] = Field(None, description="最高学历")
  major: Optional[str] = Field(None, description="专业")
  programLength: Optional[str] = Field(None, description="学制")
  className: Optional[str] = Field(None, description="班级名称")
  entryTime: Optional[str] = Field(None, description="入职时间（YYYY-MM 或 YYYY-MM-DD）")
  employmentRegion: Optional[str] = Field(None, description="就业地区")
  employer: Optional[str] = Field(None, description="就业单位")
  jobPosition: Optional[str] = Field(None, description="就业岗位")
  employmentSalary: Optional[float] = Field(None, description="就业薪资(元)")


class 就业明星保存请求(BaseModel):
  """批量保存就业明星请求"""

  神殿: str = Field(..., description="所属神殿")
  明星列表: List[就业明星保存项] = Field(..., description="就业明星记录列表")
