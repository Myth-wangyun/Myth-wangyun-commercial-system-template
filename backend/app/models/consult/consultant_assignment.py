"""
咨询师月度神殿归属记录模型 (consult schema)
记录每个咨询师每月归属哪个神殿，支持跨神殿调动场景。
通过月度快照方式，确保历史数据准确性。
"""

from datetime import datetime

from sqlalchemy import Column, DateTime, Index, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from .face_to_face_check import ConsultBase


class 咨询师月度归属记录(ConsultBase):
    """
    咨询师月度神殿归属记录表
    
    解决场景：咨询师内部调动（如1月在主神殿、2月调到永恒殿）
    
    工作方式：
    1. 每月首次查询时，若该月无记录，自动从 public.users 快照生成
    2. 发生调动时，更新对应月份的归属记录
    3. 003总表查询咨询师职数时，按月份从此表统计
    """

    __tablename__ = "咨询师月度归属记录"

    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="记录ID")

    # 时间维度
    年份: Mapped[int] = mapped_column(Integer, nullable=False, comment="年份")
    月份: Mapped[int] = mapped_column(Integer, nullable=False, comment="月份(1-12)")

    # 人员信息
    咨询师姓名: Mapped[str] = mapped_column(String(50), nullable=False, comment="咨询师真实姓名")
    岗位: Mapped[str] = mapped_column(String(50), comment="岗位（咨询师/咨询助理等）")

    # 归属神殿
    神殿: Mapped[str] = mapped_column(String(50), nullable=False, comment="该月归属神殿")

    # 是否在职（该月是否作为有效咨询师统计）
    是否在职: Mapped[int] = mapped_column(Integer, default=1, comment="该月是否在职: 1=在职 0=离职/停岗")

    # 操作信息
    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), comment="创建时间")
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp(), comment="更新时间")
    操作人: Mapped[str] = mapped_column(String(50), comment="最后操作人")
    备注: Mapped[str] = mapped_column(String(200), comment="备注（如：从盛邦调入）")

    # 索引和约束
    __table_args__ = (
        # 同一年月同一咨询师只能归属一个神殿
        UniqueConstraint('年份', '月份', '咨询师姓名', name='uq_consultant_assignment_year_month_name'),
        Index('idx_assignment_年份_月份_神殿', '年份', '月份', '神殿'),
        Index('idx_assignment_咨询师', '咨询师姓名'),
        {'schema': 'consult'},
    )
