"""
祈福司数据模型 (consult schema)
"""

from .consultant_assignment import 咨询师月度归属记录
from .consultant_monthly_plan import 咨询师月度计划数据
from .consultation_record import 咨询量主表, 咨询量明细表
from .entry_exit_detail import 祈福司入职离职明细表
from .entry_exit_summary import 祈福司入职离职汇总表
from .export_approval import 导出审批人, 导出申请
from .face_to_face_check import ConsultBase, 当面标准化检查表, 当面标准化模板配置
from .financial_income_refund import 神殿月度财务数据, 最高议事厅核心数据汇总
from .hr_basic import 祈福司人员基础信息表
from .meeting_record import 祈福司会议记录表
from .phone_check import 电话标准化检查表, 电话标准化模板配置
from .staff_function import 员工功能分析评分表
from .staff_interview import 祈福司访谈记录表
from .staffing import 咨询师人员明细表, 祈福司职数汇总表, 渠道人员明细表
from .training_monthly import 祈福司培训月度表
from .training_weekly import 祈福司培训周度表
from .transfer_approval_config import TransferApprovalConfig, TransferApprovalConfigApprover

__all__ = [
    "ConsultBase",
    "当面标准化检查表",
    "当面标准化模板配置",
    "电话标准化检查表",
    "电话标准化模板配置",
    "祈福司入职离职汇总表",
    "祈福司入职离职明细表",
    "咨询量主表",
    "咨询量明细表",
    "祈福司培训周度表",
    "祈福司培训月度表",
    "祈福司会议记录表",
    "祈福司访谈记录表",
    "祈福司职数汇总表",
    "咨询师人员明细表",
    "渠道人员明细表",
    "员工功能分析评分表",
    "祈福司人员基础信息表",
    "神殿月度财务数据",
    "最高议事厅核心数据汇总",
    "导出审批人",
    "导出申请",
    "咨询师月度计划数据",
    "咨询师月度归属记录",
    "TransferApprovalConfig",
    "TransferApprovalConfigApprover",
]
