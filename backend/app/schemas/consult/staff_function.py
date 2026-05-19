"""
祈福司员工功能分析 Pydantic Schema
"""

from typing import Dict, List, Optional, TypedDict

from pydantic import BaseModel, ConfigDict, Field

# ==================== 评分项目定义 ====================


class _ScoreItem(TypedDict):
    no: int
    category: str
    item: str
    field: str
    maxScore: int


SCORE_ITEMS: list[_ScoreItem] = [
    {
        "no": 1,
        "category": "核心业务能力",
        "item": "招生收入",
        "field": "招生收入",
        "maxScore": 10,
    },
    {
        "no": 2,
        "category": "核心业务能力",
        "item": "面转率",
        "field": "面转率",
        "maxScore": 5,
    },
    {
        "no": 3,
        "category": "核心业务能力",
        "item": "上门率",
        "field": "上门率",
        "maxScore": 10,
    },
    {
        "no": 4,
        "category": "核心业务能力",
        "item": "总转率",
        "field": "总转率",
        "maxScore": 10,
    },
    {
        "no": 5,
        "category": "一般业务能力",
        "item": "宣讲",
        "field": "宣讲",
        "maxScore": 5,
    },
    {
        "no": 6,
        "category": "一般业务能力",
        "item": "电话量",
        "field": "电话量",
        "maxScore": 5,
    },
    {
        "no": 7,
        "category": "一般业务能力",
        "item": "退费率",
        "field": "退费率",
        "maxScore": 5,
    },
    {
        "no": 8,
        "category": "一般业务能力",
        "item": "数据分析",
        "field": "数据分析",
        "maxScore": 5,
    },
    {"no": 9, "category": "价值观", "item": "责任心", "field": "责任心", "maxScore": 5},
    {
        "no": 10,
        "category": "价值观",
        "item": "执行力",
        "field": "执行力",
        "maxScore": 5,
    },
    {
        "no": 11,
        "category": "价值观",
        "item": "吃苦耐劳",
        "field": "吃苦耐劳",
        "maxScore": 5,
    },
    {
        "no": 12,
        "category": "价值观",
        "item": "团队精神",
        "field": "团队精神",
        "maxScore": 5,
    },
    {
        "no": 13,
        "category": "价值观",
        "item": "职业化",
        "field": "职业化",
        "maxScore": 5,
    },
    {
        "no": 14,
        "category": "价值观",
        "item": "向内归因",
        "field": "向内归因",
        "maxScore": 5,
    },
    {
        "no": 15,
        "category": "价值观",
        "item": "结果导向",
        "field": "结果导向",
        "maxScore": 5,
    },
    {
        "no": 16,
        "category": "价值观",
        "item": "情绪管理",
        "field": "情绪管理",
        "maxScore": 5,
    },
    {
        "no": 17,
        "category": "价值观",
        "item": "沟通能力",
        "field": "沟通能力",
        "maxScore": 5,
    },
    {
        "no": 18,
        "category": "附加",
        "item": "可异地调度",
        "field": "可异地调度",
        "maxScore": 20,
    },
]

SCORE_FIELD_TO_NO = {item["field"]: item["no"] for item in SCORE_ITEMS}
SCORE_NO_TO_FIELD = {item["no"]: item["field"] for item in SCORE_ITEMS}


# ==================== 员工功能分析评分表 Schema ====================


class 员工功能分析评分Base(BaseModel):
    """员工功能分析评分基础模型"""

    年份: int = Field(..., ge=2000, le=2100, description="年份")
    神殿: str = Field(..., max_length=50, description="神殿名称")
    员工ID: str = Field(..., max_length=50, description="员工ID")
    员工姓名: str = Field(..., max_length=50, description="员工姓名")
    员工岗位: Optional[str] = Field(default=None, max_length=50, description="员工岗位")
    员工角色: Optional[str] = Field(default=None, max_length=20, description="员工角色")


class 员工功能分析评分创建(员工功能分析评分Base):
    """创建员工功能分析评分"""

    招生收入: Optional[int] = Field(default=0, ge=0, le=10, description="招生收入评分")
    面转率: Optional[int] = Field(default=0, ge=0, le=5, description="面转率评分")
    上门率: Optional[int] = Field(default=0, ge=0, le=10, description="上门率评分")
    总转率: Optional[int] = Field(default=0, ge=0, le=10, description="总转率评分")
    宣讲: Optional[int] = Field(default=0, ge=0, le=5, description="宣讲评分")
    电话量: Optional[int] = Field(default=0, ge=0, le=5, description="电话量评分")
    退费率: Optional[int] = Field(default=0, ge=0, le=5, description="退费率评分")
    数据分析: Optional[int] = Field(default=0, ge=0, le=5, description="数据分析评分")
    责任心: Optional[int] = Field(default=0, ge=0, le=5, description="责任心评分")
    执行力: Optional[int] = Field(default=0, ge=0, le=5, description="执行力评分")
    吃苦耐劳: Optional[int] = Field(default=0, ge=0, le=5, description="吃苦耐劳评分")
    团队精神: Optional[int] = Field(default=0, ge=0, le=5, description="团队精神评分")
    职业化: Optional[int] = Field(default=0, ge=0, le=5, description="职业化评分")
    向内归因: Optional[int] = Field(default=0, ge=0, le=5, description="向内归因评分")
    结果导向: Optional[int] = Field(default=0, ge=0, le=5, description="结果导向评分")
    情绪管理: Optional[int] = Field(default=0, ge=0, le=5, description="情绪管理评分")
    沟通能力: Optional[int] = Field(default=0, ge=0, le=5, description="沟通能力评分")
    可异地调度: Optional[int] = Field(
        default=0, ge=0, le=20, description="可异地调度评分"
    )
    备注: Optional[str] = Field(default=None, description="备注")


class 员工功能分析评分更新(BaseModel):
    """更新员工功能分析评分"""

    员工姓名: Optional[str] = Field(default=None, max_length=50)
    员工岗位: Optional[str] = Field(default=None, max_length=50)
    员工角色: Optional[str] = Field(default=None, max_length=20)
    招生收入: Optional[int] = Field(default=None, ge=0, le=10)
    面转率: Optional[int] = Field(default=None, ge=0, le=5)
    上门率: Optional[int] = Field(default=None, ge=0, le=10)
    总转率: Optional[int] = Field(default=None, ge=0, le=10)
    宣讲: Optional[int] = Field(default=None, ge=0, le=5)
    电话量: Optional[int] = Field(default=None, ge=0, le=5)
    退费率: Optional[int] = Field(default=None, ge=0, le=5)
    数据分析: Optional[int] = Field(default=None, ge=0, le=5)
    责任心: Optional[int] = Field(default=None, ge=0, le=5)
    执行力: Optional[int] = Field(default=None, ge=0, le=5)
    吃苦耐劳: Optional[int] = Field(default=None, ge=0, le=5)
    团队精神: Optional[int] = Field(default=None, ge=0, le=5)
    职业化: Optional[int] = Field(default=None, ge=0, le=5)
    向内归因: Optional[int] = Field(default=None, ge=0, le=5)
    结果导向: Optional[int] = Field(default=None, ge=0, le=5)
    情绪管理: Optional[int] = Field(default=None, ge=0, le=5)
    沟通能力: Optional[int] = Field(default=None, ge=0, le=5)
    可异地调度: Optional[int] = Field(default=None, ge=0, le=20)
    备注: Optional[str] = Field(default=None)


class 员工功能分析评分响应(员工功能分析评分Base):
    """员工功能分析评分响应"""

    记录ID: int
    招生收入: Optional[int] = 0
    面转率: Optional[int] = 0
    上门率: Optional[int] = 0
    总转率: Optional[int] = 0
    宣讲: Optional[int] = 0
    电话量: Optional[int] = 0
    退费率: Optional[int] = 0
    数据分析: Optional[int] = 0
    责任心: Optional[int] = 0
    执行力: Optional[int] = 0
    吃苦耐劳: Optional[int] = 0
    团队精神: Optional[int] = 0
    职业化: Optional[int] = 0
    向内归因: Optional[int] = 0
    结果导向: Optional[int] = 0
    情绪管理: Optional[int] = 0
    沟通能力: Optional[int] = 0
    可异地调度: Optional[int] = 0
    总分: Optional[int] = 0
    备注: Optional[str] = None
    创建时间: Optional[str] = None
    更新时间: Optional[str] = None

    model_config = ConfigDict(
        from_attributes=True,
    )


# ==================== API请求/响应 Schema ====================


class StaffInfo(BaseModel):
    """员工信息"""

    id: str
    name: str
    position: Optional[str] = None
    role: Optional[str] = None


class CampusStaffResponse(BaseModel):
    """神殿员工列表响应"""

    campus: str
    principal: Optional[StaffInfo] = None
    managers: List[StaffInfo] = []
    consultants: List[StaffInfo] = []
    manager_count: int = 0
    consultant_count: int = 0
    total_count: int = 0


class StaffScoreItem(BaseModel):
    """单项评分"""

    员工ID: str
    项目序号: int  # 1-18
    分数: int


class BatchScoreUpdate(BaseModel):
    """批量更新评分"""

    年份: int
    神殿: str
    scores: List[StaffScoreItem]


class CampusScoresResponse(BaseModel):
    """神殿评分响应"""

    年份: int
    神殿: str
    staff_scores: List[员工功能分析评分响应]
    # 以 {staffId}_{itemNo}: score 格式返回，方便前端直接使用
    score_map: Dict[str, int] = {}


class SaveAllScoresRequest(BaseModel):
    """保存全部评分请求"""

    年份: int
    神殿: str
    # {员工ID: {项目字段名: 分数, ...}, ...}
    scores: Dict[str, Dict[str, int]]
