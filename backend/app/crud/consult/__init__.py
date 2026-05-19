"""
祈福司 CRUD 模块
"""

from . import transfer_approval_config
from .consultant_monthly_plan import consultant_monthly_plan_crud
from .entry_exit_summary import 祈福司入职离职汇总表CRUD
from .face_to_face_check import 当面标准化检查表CRUD, 当面标准化模板配置CRUD
from .financial_income_refund import 神殿月度财务数据CRUD, 最高议事厅核心数据汇总CRUD
from .hr_basic import 人员基础信息CRUD
from .phone_check import 电话标准化检查表CRUD, 电话标准化模板配置CRUD
from .staff_function import 员工功能分析评分CRUD

__all__ = [
    "当面标准化检查表CRUD",
    "当面标准化模板配置CRUD",
    "电话标准化检查表CRUD",
    "电话标准化模板配置CRUD",
    "祈福司入职离职汇总表CRUD",
    "员工功能分析评分CRUD",
    "人员基础信息CRUD",
    "神殿月度财务数据CRUD",
    "最高议事厅核心数据汇总CRUD",
    "consultant_monthly_plan_crud",
    "transfer_approval_config",
]
