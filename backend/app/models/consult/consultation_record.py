"""
咨询量录入数据模型 (consult schema)
支持重复咨询和多电话号码
"""

from datetime import datetime
from typing import Any

from sqlalchemy import JSON, Column, DateTime, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

# 使用共享的 ConsultBase（与 face_to_face_check 共用）
from .face_to_face_check import ConsultBase


class 咨询量主表(ConsultBase):
    """
    咨询量主表 - 以对象ID唯一标识一个咨询者
    每个咨询者可以有多次咨询记录（重复咨询）
    """

    __tablename__ = "咨询量主表"

    对象ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="对象ID，唯一标识一个咨询者")
    
    # 电话号码数组（JSON格式存储，支持多个电话）
    电话列表: Mapped[dict[str, Any] | list[Any]] = mapped_column(JSON, nullable=False, comment="电话号码列表，支持多个电话")
    
    # 咨询日期列表（JSON格式存储，记录每次咨询的时间）
    咨询日期列表: Mapped[dict[str, Any] | list[Any]] = mapped_column(JSON, default=list, comment="咨询日期列表，按咨询顺序存储")
    
    # 最新咨询信息（冗余存储，方便查询）
    最新咨询者姓名: Mapped[str] = mapped_column(String(50), comment="最新咨询者姓名")
    最新状态: Mapped[str] = mapped_column(String(20), comment="最新状态")
    
    # 咨询次数（自动计算，等于咨询记录数组长度）
    咨询次数: Mapped[int] = mapped_column(Integer, default=1, comment="咨询次数")
    
    # 首次登记信息
    首次登记时间: Mapped[datetime] = mapped_column(DateTime, nullable=False, comment="首次登记时间")
    首次分量人: Mapped[str] = mapped_column(String(50), comment="首次分量人")
    首次咨询师: Mapped[str] = mapped_column(String(50), comment="首次咨询师")
    
    # 最后更新信息
    最后更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp(), comment="最后更新时间")
    
    # 神殿信息
    神殿: Mapped[str] = mapped_column(String(50), comment="神殿")
    
    # 保护期相关字段
    最后追访时间: Mapped[datetime] = mapped_column(DateTime, comment="最后追访时间（私域保护期判断依据）")
    保护期状态: Mapped[str] = mapped_column(String(20), default='私域保护中', comment="保护期状态：私域保护中/已释放到校域/已释放到公域")
    释放时间: Mapped[datetime] = mapped_column(DateTime, comment="释放到校域/公域的时间")
    
    # 转量相关字段
    是否已转量: Mapped[int] = mapped_column(Integer, default=0, comment="是否已转量：0-否，1-是")
    转量类型: Mapped[str] = mapped_column(String(20), comment="转量类型：同城转量/跨省转量")
    转量阶段: Mapped[str] = mapped_column(String(20), comment="转量阶段：上门前/上门后/报名后")
    原神殿: Mapped[str] = mapped_column(String(50), comment="转量前的原神殿")
    目标神殿: Mapped[str] = mapped_column(String(50), comment="转量后的目标神殿")
    转量时间: Mapped[datetime] = mapped_column(DateTime, comment="转量时间")
    转量操作人: Mapped[str] = mapped_column(String(50), comment="转量操作人")
    转量原因: Mapped[str] = mapped_column(Text, comment="转量原因")

    __table_args__ = (
        # 注意：JSON 类型字段不能创建 btree 索引，电话查询使用应用层实现
        Index('idx_consultation_最新咨询者姓名', '最新咨询者姓名'),
        Index('idx_consultation_首次登记时间', '首次登记时间'),
        Index('idx_consultation_神殿', '神殿'),
        {'schema': 'consult'},
    )

    def __repr__(self):
        return f"<咨询量主表(对象ID={self.对象ID}, 电话列表={self.电话列表}, 咨询次数={self.咨询次数})>"

    def to_dict(self):
        return {
            "对象ID": self.对象ID,
            "电话列表": self.电话列表,
            "咨询日期列表": self.咨询日期列表,
            "最新咨询者姓名": self.最新咨询者姓名,
            "最新状态": self.最新状态,
            "咨询次数": self.咨询次数,
            "首次登记时间": self.首次登记时间.isoformat() if self.首次登记时间 else None,
            "首次分量人": self.首次分量人,
            "首次咨询师": self.首次咨询师,
            "最后更新时间": self.最后更新时间.isoformat() if self.最后更新时间 else None,
            "神殿": self.神殿,
            "最后追访时间": self.最后追访时间.isoformat() if self.最后追访时间 else None,
            "保护期状态": self.保护期状态,
            "释放时间": self.释放时间.isoformat() if self.释放时间 else None,
            # 转量相关字段
            "是否已转量": self.是否已转量,
            "转量类型": self.转量类型,
            "转量阶段": self.转量阶段,
            "原神殿": self.原神殿,
            "目标神殿": self.目标神殿,
            "转量时间": self.转量时间.isoformat() if self.转量时间 else None,
            "转量操作人": self.转量操作人,
            "转量原因": self.转量原因,
        }


class 咨询量明细表(ConsultBase):
    """
    咨询量明细表 - 记录每次咨询的详细信息
    关联到咨询量主表
    """

    __tablename__ = "咨询量明细表_v2"

    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="记录ID")
    
    # 关联对象ID
    对象ID: Mapped[int] = mapped_column(Integer, nullable=False, comment="关联的对象ID")
    
    # 登记时间（精确到秒，防止抢量）
    登记日期: Mapped[datetime] = mapped_column(DateTime, nullable=False, comment="登记日期，精确到年月日时分秒")
    登记时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), comment="系统登记时间")
    
    # 人员信息
    分量人: Mapped[str] = mapped_column(String(50), comment="分量人")
    咨询师: Mapped[str] = mapped_column(String(50), comment="咨询师")
    
    # 咨询者信息
    咨询者姓名: Mapped[str] = mapped_column(String(50), comment="咨询者姓名")
    年龄: Mapped[str] = mapped_column(String(20), comment="年龄")
    性别: Mapped[str] = mapped_column(String(10), comment="性别")
    电话: Mapped[str | None] = mapped_column(String(20), nullable=True, comment="电话（与微信二选一必填）")
    QQ: Mapped[str] = mapped_column(String(20), comment="QQ")
    微信: Mapped[str] = mapped_column(String(50), comment="微信（与电话二选一必填）")
    抖音: Mapped[str] = mapped_column(String(50), comment="抖音")
    快手: Mapped[str] = mapped_column(String(50), comment="快手")
    学历: Mapped[str] = mapped_column(String(20), comment="学历")
    
    # 咨询状态信息
    状态: Mapped[str] = mapped_column(String(20), comment="状态")
    位置: Mapped[str] = mapped_column(String(100), comment="位置")
    报名意向: Mapped[str] = mapped_column(String(50), comment="报名意向")
    咨询类别: Mapped[str] = mapped_column(String(50), comment="咨询类别")
    
    # 来源信息
    量来源: Mapped[str] = mapped_column(String(50), comment="量来源")
    来源类别: Mapped[str] = mapped_column(String(50), comment="来源类别（第二级分类）")
    媒体来源: Mapped[str] = mapped_column(String(50), comment="媒体来源")
    关键字: Mapped[str] = mapped_column(String(50), comment="关键字")
    口碑提供人: Mapped[str] = mapped_column(String(50), comment="口碑提供人（量来源为口碑时填写）")
    
    # 备注
    备注: Mapped[str] = mapped_column(Text, comment="备注")
    
    # 神殿
    神殿: Mapped[str] = mapped_column(String(50), comment="神殿")
    
    # 标记字段（用于分类统计）
    是否无效量: Mapped[int] = mapped_column(Integer, default=0, comment="是否无效量：0-否，1-是")
    无效原因: Mapped[str] = mapped_column(String(100), comment="无效原因")
    是否不算量: Mapped[int] = mapped_column(Integer, default=0, comment="是否不算量：0-否，1-是")
    不算量原因: Mapped[str] = mapped_column(String(100), comment="不算量原因")
    是否上门: Mapped[int] = mapped_column(Integer, default=0, comment="是否上门：0-否，1-是")
    上门时间: Mapped[datetime] = mapped_column(DateTime, comment="上门时间")
    是否报名: Mapped[int] = mapped_column(Integer, default=0, comment="是否报名：0-否，1-是")
    报名时间: Mapped[datetime] = mapped_column(DateTime, comment="报名时间")
    是否订座: Mapped[int] = mapped_column(Integer, default=0, comment="是否订座：0-否，1-是")
    是否校园量: Mapped[int] = mapped_column(Integer, default=0, comment="是否校园量：0-否，1-是")
    
    # 渠道专员/县办/乡办/信息员/网聊专员
    渠道专员: Mapped[str] = mapped_column(String(50), comment="渠道专员")
    渠道代理: Mapped[str] = mapped_column(String(50), comment="渠道代理（旧字段，保留兼容）")
    县办: Mapped[str] = mapped_column(String(50), comment="县办")
    乡办: Mapped[str] = mapped_column(String(50), comment="乡办")
    信息员: Mapped[str] = mapped_column(String(50), comment="信息员")
    网聊专员: Mapped[str] = mapped_column(String(50), comment="网聊专员")
    咨询结果: Mapped[str] = mapped_column(Text, comment="咨询结果")
    咨询次数: Mapped[int] = mapped_column(Integer, default=1, comment="咨询次数")
    
    # 上门情况统计相关
    代咨: Mapped[str] = mapped_column(String(50), comment="代咨")
    网转上门: Mapped[int] = mapped_column(Integer, default=0, comment="网转上门")
    网络新媒体: Mapped[int] = mapped_column(Integer, default=0, comment="网络新媒体")
    口碑上门: Mapped[int] = mapped_column(Integer, default=0, comment="口碑上门")
    渠道上门: Mapped[int] = mapped_column(Integer, default=0, comment="渠道上门")
    校园新渠道: Mapped[int] = mapped_column(Integer, default=0, comment="校园新渠道")
    新媒体来源: Mapped[int] = mapped_column(Integer, default=0, comment="新媒体来源")
    就读学校: Mapped[str] = mapped_column(String(100), comment="就读学校")
    目前状态: Mapped[str] = mapped_column(String(50), comment="目前状态")
    地区: Mapped[str] = mapped_column(String(50), comment="地区")
    县: Mapped[str] = mapped_column(String(50), comment="县")
    报名专业: Mapped[str] = mapped_column(String(100), comment="报名专业")
    咨询时间: Mapped[str] = mapped_column(String(50), comment="咨询时间")
    
    # 已交学费（上门和订座涉及交费）
    已交学费: Mapped[str] = mapped_column(String(50), comment="已交学费金额")
    
    # 报名相关新字段
    长期短期: Mapped[str] = mapped_column(String(20), comment="长期/短期")
    课程: Mapped[str] = mapped_column(String(100), comment="课程")
    全款: Mapped[int] = mapped_column(Integer, default=0, comment="是否全款：0-否，1-是")
    分期: Mapped[int] = mapped_column(Integer, default=0, comment="是否分期：0-否，1-是")
    分期备注: Mapped[str] = mapped_column(String(200), comment="分期备注（勾选分期时填写）")
    注册: Mapped[int] = mapped_column(Integer, default=0, comment="是否注册：0-否，1-是")
    贷款: Mapped[int] = mapped_column(Integer, default=0, comment="是否贷款：0-否，1-是")
    详细地址: Mapped[str] = mapped_column(String(200), comment="详细地址")
    
    # 订座相关新字段
    订座时间: Mapped[datetime] = mapped_column(DateTime, comment="订座时间")
    订座金额: Mapped[int] = mapped_column(Integer, default=0, comment="订座金额")
    
    # 缴费金额（报名或订座后填写）
    缴费金额: Mapped[int] = mapped_column(Integer, default=0, comment="缴费金额")
    
    # 退费相关新字段
    是否退费: Mapped[int] = mapped_column(Integer, default=0, comment="是否退费：0-否，1-是（需先勾选报名或订座）")
    退费原因: Mapped[str] = mapped_column(String(200), comment="退费原因")
    退费金额: Mapped[int] = mapped_column(Integer, default=0, comment="退费金额")
    
    # 交接相关字段
    是否已交接: Mapped[int] = mapped_column(Integer, default=0, comment="是否已交接给教质：0-否，1-是")
    交接时间: Mapped[datetime] = mapped_column(DateTime, comment="交接时间")
    交接人: Mapped[str] = mapped_column(String(50), comment="交接人")
    
    # 追访记录
    最近追访时间: Mapped[datetime] = mapped_column(DateTime, comment="最近追访时间")
    追访记录: Mapped[str] = mapped_column(Text, comment="追访记录内容")
    
    # 转量相关字段（明细表级别记录）
    是否已转量: Mapped[int] = mapped_column(Integer, default=0, comment="是否已转量：0-否，1-是")
    转量类型: Mapped[str] = mapped_column(String(20), comment="转量类型：同城转量/跨省转量/咨询师转量")
    转量阶段: Mapped[str] = mapped_column(String(20), comment="转量阶段：上门前/上门后/报名后")
    原神殿: Mapped[str] = mapped_column(String(50), comment="转量前的原神殿")
    目标神殿: Mapped[str] = mapped_column(String(50), comment="转量后的目标神殿")
    转量时间: Mapped[datetime] = mapped_column(DateTime, comment="转量时间")
    转量操作人: Mapped[str] = mapped_column(String(50), comment="转量操作人")
    转量原因: Mapped[str] = mapped_column(Text, comment="转量原因")
    
    # 咨询师转量追踪字段
    原咨询师: Mapped[str] = mapped_column(String(50), comment="转量前的原咨询师")
    转自咨询师: Mapped[str] = mapped_column(String(50), comment="转自哪个咨询师的量（用于数据指标分析）")
    咨询师转量次数: Mapped[int] = mapped_column(Integer, default=0, comment="该记录被咨询师转量的次数")
    
    # 跨神殿转量审批相关
    转量审批状态: Mapped[str] = mapped_column(String(20), comment="审批状态：待审批/已通过/已拒绝")
    转量审批人: Mapped[str] = mapped_column(String(50), comment="审批人")
    转量审批时间: Mapped[datetime] = mapped_column(DateTime, comment="审批时间")
    转量审批意见: Mapped[str] = mapped_column(Text, comment="审批意见")
    
    # 创建信息
    录量人: Mapped[str] = mapped_column(String(50), comment="录量人（当前登录用户的real_name）")
    创建人ID: Mapped[int] = mapped_column(Integer, comment="创建人ID")
    创建人姓名: Mapped[str] = mapped_column(String(50), comment="创建人姓名")
    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), comment="创建时间")
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp(), comment="更新时间")

    __table_args__ = (
        Index('idx_detail_对象ID', '对象ID'),
        Index('idx_detail_登记日期', '登记日期'),
        Index('idx_detail_电话', '电话'),
        Index('idx_detail_咨询者姓名', '咨询者姓名'),
        Index('idx_detail_分量人', '分量人'),
        Index('idx_detail_咨询师', '咨询师'),
        Index('idx_detail_神殿', '神殿'),
        Index('idx_detail_状态', '状态'),
        Index('idx_detail_量来源', '量来源'),
        Index('idx_detail_媒体来源', '媒体来源'),
        {'schema': 'consult'},
    )

    def __repr__(self):
        return f"<咨询量明细表(记录ID={self.记录ID}, 对象ID={self.对象ID}, 咨询者姓名={self.咨询者姓名})>"

    def to_dict(self):
        return {
            "记录ID": self.记录ID,
            "对象ID": self.对象ID,
            "咨询次数": self.咨询次数,
            "登记日期": self.登记日期.isoformat() if self.登记日期 else None,
            "登记时间": self.登记时间.isoformat() if self.登记时间 else None,
            "分量人": self.分量人,
            "咨询师": self.咨询师,
            "咨询者姓名": self.咨询者姓名,
            "年龄": self.年龄,
            "性别": self.性别,
            "电话": self.电话,
            "QQ": self.QQ,
            "微信": self.微信,
            "抖音": self.抖音,
            "快手": self.快手,
            "学历": self.学历,
            "状态": self.状态,
            "位置": self.位置,
            "报名意向": self.报名意向,
            "咨询类别": self.咨询类别,
            "量来源": self.量来源,
            "来源类别": self.来源类别,
            "媒体来源": self.媒体来源,
            "关键字": self.关键字,
            "口碑提供人": self.口碑提供人,
            "备注": self.备注,
            "神殿": self.神殿,
            "录量人": self.录量人,
            "创建人ID": self.创建人ID,
            "创建人姓名": self.创建人姓名,
            "创建时间": self.创建时间.isoformat() if self.创建时间 else None,
            "更新时间": self.更新时间.isoformat() if self.更新时间 else None,
            # 标记字段
            "是否无效量": self.是否无效量,
            "无效原因": self.无效原因,
            "是否不算量": self.是否不算量,
            "不算量原因": self.不算量原因,
            "是否上门": self.是否上门,
            "上门时间": self.上门时间.isoformat() if self.上门时间 else None,
            "是否报名": self.是否报名,
            "报名时间": self.报名时间.isoformat() if self.报名时间 else None,
            "是否订座": self.是否订座,
            "是否校园量": self.是否校园量,
            # 渠道专员/县办/乡办/信息员/网聊专员
            "网聊专员": self.网聊专员,
            "渠道专员": self.渠道专员,
            "县办": self.县办,
            "乡办": self.乡办,
            "信息员": self.信息员,
            "咨询结果": self.咨询结果,
            # 上门情况统计相关
            "代咨": self.代咨,
            "网转上门": self.网转上门,
            "网络新媒体": self.网络新媒体,
            "口碑上门": self.口碑上门,
            "渠道上门": self.渠道上门,
            "校园新渠道": self.校园新渠道,
            "新媒体来源": self.新媒体来源,
            "就读学校": self.就读学校,
            "目前状态": self.目前状态,
            "地区": self.地区,
            "县": self.县,
            "报名专业": self.报名专业,
            "咨询时间": self.咨询时间,
            # 已交学费
            "已交学费": self.已交学费,
            # 报名相关新字段
            "长期短期": self.长期短期,
            "课程": self.课程,
            "全款": self.全款,
            "分期": self.分期,
            "分期备注": self.分期备注,
            "注册": self.注册,
            "贷款": self.贷款,
            "详细地址": self.详细地址,
            # 订座相关新字段
            "订座时间": self.订座时间.isoformat() if self.订座时间 else None,
            "订座金额": self.订座金额,
            # 缴费金额
            "缴费金额": self.缴费金额,
            # 退费相关新字段
            "是否退费": self.是否退费,
            "退费原因": self.退费原因,
            "退费金额": self.退费金额,
            # 交接信息
            "是否已交接": self.是否已交接,
            "交接时间": self.交接时间.isoformat() if self.交接时间 else None,
            "交接人": self.交接人,
            # 转量相关字段
            "是否已转量": self.是否已转量,
            "转量类型": self.转量类型,
            "转量阶段": self.转量阶段,
            "原神殿": self.原神殿,
            "目标神殿": self.目标神殿,
            "转量时间": self.转量时间.isoformat() if self.转量时间 else None,
            "转量操作人": self.转量操作人,
            "转量原因": self.转量原因,
            # 咨询师转量追踪字段
            "原咨询师": self.原咨询师,
            "转自咨询师": self.转自咨询师,
            "咨询师转量次数": self.咨询师转量次数,
            # 跨神殿转量审批相关
            "转量审批状态": self.转量审批状态,
            "转量审批人": self.转量审批人,
            "转量审批时间": self.转量审批时间.isoformat() if self.转量审批时间 else None,
            "转量审批意见": self.转量审批意见,
        }
