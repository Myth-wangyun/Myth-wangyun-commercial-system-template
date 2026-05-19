"""
祈福司员工功能分析表数据模型 (consult schema)
记录各神殿祈福司员工的功能分析评分
"""

from datetime import datetime

from sqlalchemy import Column, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from .face_to_face_check import ConsultBase


class 员工功能分析评分表(ConsultBase):
    """员工功能分析评分表 - 存储每个员工在各项功能上的评分"""

    __tablename__ = "员工功能分析评分表"

    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="记录ID")
    年份: Mapped[int] = mapped_column(Integer, nullable=False, comment="年份")
    神殿: Mapped[str] = mapped_column(String(50), nullable=False, comment="神殿名称")
    
    # 员工信息
    员工ID: Mapped[str] = mapped_column(String(50), nullable=False, comment="员工ID（来自public.users）")
    员工姓名: Mapped[str] = mapped_column(String(50), nullable=False, comment="员工姓名")
    员工岗位: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="员工岗位")
    员工角色: Mapped[str | None] = mapped_column(String(20), nullable=True, comment="员工角色: principal/manager/consultant")
    
    # 核心业务能力评分 (满分35)
    招生收入: Mapped[int] = mapped_column(Integer, default=0, comment="招生收入评分(满分10)")
    面转率: Mapped[int] = mapped_column(Integer, default=0, comment="面转率评分(满分5)")
    上门率: Mapped[int] = mapped_column(Integer, default=0, comment="上门率评分(满分10)")
    总转率: Mapped[int] = mapped_column(Integer, default=0, comment="总转率评分(满分10)")
    
    # 一般业务能力评分 (满分20)
    宣讲: Mapped[int] = mapped_column(Integer, default=0, comment="宣讲评分(满分5)")
    电话量: Mapped[int] = mapped_column(Integer, default=0, comment="电话量评分(满分5)")
    退费率: Mapped[int] = mapped_column(Integer, default=0, comment="退费率评分(满分5)")
    数据分析: Mapped[int] = mapped_column(Integer, default=0, comment="数据分析评分(满分5)")
    
    # 价值观评分 (满分45)
    责任心: Mapped[int] = mapped_column(Integer, default=0, comment="责任心评分(满分5)")
    执行力: Mapped[int] = mapped_column(Integer, default=0, comment="执行力评分(满分5)")
    吃苦耐劳: Mapped[int] = mapped_column(Integer, default=0, comment="吃苦耐劳评分(满分5)")
    团队精神: Mapped[int] = mapped_column(Integer, default=0, comment="团队精神评分(满分5)")
    职业化: Mapped[int] = mapped_column(Integer, default=0, comment="职业化评分(满分5)")
    向内归因: Mapped[int] = mapped_column(Integer, default=0, comment="向内归因评分(满分5)")
    结果导向: Mapped[int] = mapped_column(Integer, default=0, comment="结果导向评分(满分5)")
    情绪管理: Mapped[int] = mapped_column(Integer, default=0, comment="情绪管理评分(满分5)")
    沟通能力: Mapped[int] = mapped_column(Integer, default=0, comment="沟通能力评分(满分5)")
    
    # 附加评分 (满分20)
    可异地调度: Mapped[int] = mapped_column(Integer, default=0, comment="可异地调度评分(满分20)")
    
    # 汇总评分 (满分120)
    总分: Mapped[int] = mapped_column(Integer, default=0, comment="总分(满分120)")
    
    # 备注
    备注: Mapped[str | None] = mapped_column(Text, nullable=True, comment="备注")

    创建时间: Mapped[str] = mapped_column(
        String(50),
        default=lambda: datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        comment="创建时间"
    )
    更新时间: Mapped[str] = mapped_column(
        String(50),
        default=lambda: datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        onupdate=lambda: datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        comment="更新时间"
    )

    __table_args__ = (
        UniqueConstraint('年份', '神殿', '员工ID', name='uq_staff_function_score_year_campus_staff'),
        Index('idx_staff_function_score_年份', '年份'),
        Index('idx_staff_function_score_神殿', '神殿'),
        Index('idx_staff_function_score_员工ID', '员工ID'),
        {"schema": "consult", "comment": "员工功能分析评分表"}
    )

    def __repr__(self):
        return f"<员工功能分析评分表(记录ID={self.记录ID}, 年份={self.年份}, 神殿={self.神殿}, 员工姓名={self.员工姓名})>"

    def calculate_total(self):
        """计算总分"""
        self.总分 = (
            (self.招生收入 or 0) + (self.面转率 or 0) + (self.上门率 or 0) + (self.总转率 or 0) +
            (self.宣讲 or 0) + (self.电话量 or 0) + (self.退费率 or 0) + (self.数据分析 or 0) +
            (self.责任心 or 0) + (self.执行力 or 0) + (self.吃苦耐劳 or 0) + (self.团队精神 or 0) +
            (self.职业化 or 0) + (self.向内归因 or 0) + (self.结果导向 or 0) + (self.情绪管理 or 0) +
            (self.沟通能力 or 0) + (self.可异地调度 or 0)
        )
        return self.总分
