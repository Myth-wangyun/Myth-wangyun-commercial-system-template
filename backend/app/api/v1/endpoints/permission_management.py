"""
权限划分 API
提供用户权限管理的完整 CRUD 接口，支持批量操作。
全部使用 SQLAlchemy ORM，写操作自动被审计日志中间件捕获。
"""
from __future__ import annotations

import logging
import re
from pathlib import Path
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel
from sqlalchemy import distinct
from sqlalchemy.orm import Session, selectinload

from app.core.auth import get_current_admin_user
from app.core.database import get_db
from app.logs.context import get_audit_logger
from app.models.permission_route_map import PermissionRouteMap
from app.models.user import User, utcnow
from app.models.user_permission import UserPermissionDirect

logger = logging.getLogger(__name__)

router = APIRouter(dependencies=[Depends(get_current_admin_user)])


# ======================== Schemas ========================

class PermissionNode(BaseModel):
    """权限树节点"""
    key: str
    title: str
    children: list[PermissionNode] | None = None


class FilterOptions(BaseModel):
    """筛选选项"""
    campuses: list[str] = []
    departments: list[str] = []
    positions: list[str] = []


class SetUserPermissionsRequest(BaseModel):
    """设置单个用户权限"""
    user_id: int
    permissions: list[str]


class BatchSetPermissionsRequest(BaseModel):
    """批量设置权限"""
    user_ids: list[int]
    permissions: list[str]


# ======================== 权限树定义 ========================

def get_permission_tree() -> list[dict[str, Any]]:
    """
    获取系统所有功能的权限树，严格按照前端 menuItems.tsx 的菜单层级组织。
    每个叶子节点的 key 与前端路由 routeKey 一致。
    """
    return [
        # ==================== 最高议事厅 ====================
        {
            "key": "_mgmt",
            "title": "最高议事厅",
            "children": [
                # 最高议事厅 -> 智慧司
                {
                    "key": "_mgmt-academic",
                    "title": "智慧司",
                    "children": [
                        {"key": "academic-mgnt-core-business-summary-all", "title": "核心业务数据汇总"},
                        {"key": "mgmt-core-summary", "title": "01 核心业务数据汇总"},
                        {"key": "mgmt-employment-summary", "title": "02 后端学员就业汇总表"},
                        {"key": "mgmt-enrollment-summary", "title": "03 招生统计汇总表"},
                        {"key": "mgmt-student-stability", "title": "04 新生维稳汇总表"},
                        {"key": "mgmt-teacher-staffing", "title": "05 师资配比表"},
                        {"key": "mgmt-onboarding-offboarding", "title": "06 入职离职汇总表"},
                        {"key": "mgmt-training-summary", "title": "07 培训计划与成绩汇总表"},
                        {"key": "mgmt-manager-analysis", "title": "08 经理功能分析表"},
                        {"key": "mgmt-network-survey", "title": "09 网络调查汇总表"},
                        {"key": "mgmt-enterprise-survey", "title": "10 企业调查汇总表"},
                        {"key": "mgmt-position-analysis", "title": "11 岗位分析报告汇总表"},
                        {"key": "mgmt-courseware-writing", "title": "12 课件编写汇总表"},
                        {"key": "mgmt-questionbank-writing", "title": "13 题库编写汇总表"},
                        {"key": "mgmt-manager-evaluation", "title": "14 学术经理功能评价表"},
                    ],
                },
                # 最高议事厅 -> 教化司
                {
                    "key": "_mgmt-tq",
                    "title": "教化司",
                    "children": [
                        {"key": "teaching-quality-mgnt-core-business-summary-all", "title": "核心业务数据汇总"},
                    ],
                },
                # 最高议事厅 -> 市场部
                {
                    "key": "_mgmt-market",
                    "title": "市场部",
                    "children": [
                        # 01.核心数据
                        {
                            "key": "_mgmt-market-01",
                            "title": "01.核心数据",
                            "children": [
                                {"key": "market-yearly-summary", "title": "核心业务(年度)汇总表"},
                            ],
                        },
                        # 02.网推数据
                        {
                            "key": "_mgmt-market-02",
                            "title": "02.网推数据",
                            "children": [
                                {"key": "market-monthly-data", "title": "月度数据表"},
                                {"key": "market-online-promotion-stage-report", "title": "网推阶段业务汇报表"},
                                {"key": "market-monthly-business-progress", "title": "本月业务推进表"},
                                {"key": "market-sem-daily-data", "title": "SEM日度数据表"},
                                {"key": "market-online-partner-daily-data", "title": "网络合作伙伴日度数据表"},
                                {"key": "market-daily-reputation-data", "title": "口碑日度数据表"},
                                {"key": "market-free-promotion-daily-data", "title": "免费推广日度数据表"},
                            ],
                        },
                        # 03.新媒体
                        {
                            "key": "_mgmt-market-03",
                            "title": "03.新媒体",
                            "children": [
                                {"key": "market-newmedia-edit-report", "title": "新媒体剪辑汇报表"},
                                {"key": "market-newmedia-phase-report", "title": "新媒体阶段业务汇报表"},
                                {"key": "market-newmedia-daily-data", "title": "新媒体日度数据表"},
                            ],
                        },
                        # 04.网聊数据
                        {
                            "key": "_mgmt-market-04",
                            "title": "04.网聊数据",
                            "children": [
                                {"key": "market-network-consultant-report", "title": "网络咨询师汇报表"},
                            ],
                        },
                        # 05.管理数据
                        {
                            "key": "_mgmt-market-05",
                            "title": "05.管理数据",
                            "children": [
                                {"key": "market-staff-function-analysis", "title": "全员功能分析"},
                                {"key": "market-network-plan", "title": "年度网络计划表"},
                                {"key": "market-monthly-detail-plan", "title": "月度详细计划"},
                                {"key": "market-partner-contacts", "title": "合作方联系信息"},
                                {"key": "market-employee-interview-records", "title": "员工访谈记录表"},
                                {"key": "market-meeting-record", "title": "会议记录表"},
                                {"key": "market-account-sentiment", "title": "各校新媒体账号舆情登记表"},
                            ],
                        },
                        # 06.企业文化及培训
                        {
                            "key": "_mgmt-market-06",
                            "title": "06.企业文化及培训",
                            "children": [
                                {"key": "market-training-summary", "title": "培训汇总表"},
                            ],
                        },
                    ],
                },
                # 最高议事厅 -> 祈福司
                {
                    "key": "_mgmt-consult",
                    "title": "祈福司",
                    "children": [
                        {"key": "consult-mgnt-center-dashboard", "title": "001最高议事厅祈福司核心业务数据汇总表"},
                    ],
                },
                # 最高议事厅 -> 人资部
                {
                    "key": "_mgmt-hr",
                    "title": "人资部",
                    "children": [
                        {"key": "humanresources-000-personal-info-dashboard", "title": "000集团个人信息数据看板"},
                        {"key": "humanresources-001-annual-comprehensive-dashboard", "title": "001集团人力资源年度综合看板"},
                        {"key": "humanresources-hq-002-annual-dashboard", "title": "002最高议事厅年度核心数据看板"},
                        {"key": "humanresources-hq-003-monthly-dashboard", "title": "003最高议事厅月度核心数据看板"},
                        {"key": "humanresources-hq-004-daily-dashboard", "title": "004最高议事厅日度核心数据看板"},
                        {"key": "humanresources-hq-005-employee-archive", "title": "005最高议事厅员工档案表"},
                        {"key": "humanresources-online-002-annual-dashboard", "title": "002线上年度核心数据看板"},
                        {"key": "humanresources-online-003-monthly-dashboard", "title": "003线上月度核心数据看板"},
                        {"key": "humanresources-online-004-daily-dashboard", "title": "004线上日度核心数据看板"},
                        {"key": "humanresources-online-005-employee-archive", "title": "005线上员工档案表"},
                        {"key": "humanresources-offline-002-annual-dashboard", "title": "002线下年度核心数据看板"},
                        {"key": "humanresources-offline-003-monthly-dashboard", "title": "003线下月度核心数据看板"},
                        {"key": "humanresources-offline-004-daily-dashboard", "title": "004线下日度核心数据看板"},
                        {"key": "humanresources-offline-005-employee-archive", "title": "005线下员工档案表"},
                        {"key": "humanresources-base-006-training-management", "title": "006集团人资基础培训管理"},
                        {"key": "humanresources-base-006-hr-planning", "title": "006集团人资基础人力资源规划"},
                        {"key": "humanresources-base-006-social-insurance", "title": "006集团人资基础社保"},
                        {"key": "humanresources-base-006-recruitment-onboarding", "title": "006集团人资基础招聘入职"},
                    ],
                },
                # 最高议事厅 -> 配置中心
                {
                    "key": "_mgmt-config",
                    "title": "配置中心",
                    "children": [
                        {"key": "system-config-master", "title": "神殿/班级配置"},
                        {"key": "system-config-employee", "title": "员工管理"},
                        {"key": "system-config-media-source", "title": "咨询配置"},
                        {"key": "system-config-permission", "title": "权限划分"},
                    ],
                },
            ],
        },
        # ==================== 神殿 -> 祈福司 ====================
        {
            "key": "_campus-consult",
            "title": "神殿·祈福司",
            "children": [
                # 01.神殿核心数据
                {
                    "key": "_campus-consult-01",
                    "title": "01.神殿核心数据",
                    "children": [
                        {"key": "consult-campus-yearly-monthly-media", "title": "002神殿-年月表-各媒体来源"},
                        {"key": "consult-consultant-data-summary-v3", "title": "003神殿各咨询师数据汇总"},
                        {"key": "consult-population-data-summary", "title": "004神殿各类人群数据汇总"},
                        {"key": "consult-daily-consulting-summary-new", "title": "005神殿每日咨询量汇总表"},
                    ],
                },
                {"key": "consult-type-count-system", "title": "咨询量录入系统"},
                {"key": "consult-my-consultations", "title": "我的咨询量"},
                {"key": "consult-my-channel-consultations", "title": "我的渠道咨询量"},
                {"key": "consult-consultation-records", "title": "咨询记录"},
                {"key": "consult-export-approval", "title": "咨询量导出审批"},
                # 02.神殿基础数据
                {
                    "key": "_campus-consult-02",
                    "title": "02.神殿基础数据",
                    "children": [
                        {"key": "consult-daily-consulting-register", "title": "006神殿每日咨询量登记表"},
                    ],
                },
                # 03.管理数据
                {
                    "key": "_campus-consult-03",
                    "title": "03.管理数据",
                    "children": [
                        {"key": "consult-mgnt-center-core-data", "title": "007财务收入和退费"},
                        {"key": "consult-hr-basic-table", "title": "008前端人力资源基础表"},
                        {"key": "consult-staff-function", "title": "009员工职数和功能分析"},
                        {"key": "consult-channel-staffing", "title": "010咨询和渠道职数"},
                        {"key": "consult-entry-exit-summary", "title": "011祈福司入职离职汇总表"},
                        {"key": "consult-staff-interview", "title": "012祈福司员工访谈记录表"},
                        {"key": "consult-meeting-record", "title": "013祈福司会议记录表"},
                        {"key": "consult-mgmt-data-phone-check", "title": "014电话标准化检查"},
                        {"key": "consult-mgmt-data-face-to-face-check", "title": "015当面标准化检查"},
                    ],
                },
                # 04.企业文化及培训
                {
                    "key": "_campus-consult-04",
                    "title": "04.企业文化及培训",
                    "children": [
                        {"key": "consult-culture-training-summary", "title": "016祈福司培训汇总表"},
                    ],
                },
            ],
        },
        # ==================== 神殿 -> 智慧司 ====================
        {
            "key": "_campus-academic",
            "title": "神殿·智慧司",
            "children": [
                # 核心数据
                {
                    "key": "_campus-academic-core",
                    "title": "核心数据",
                    "children": [
                        {"key": "campus-core-data-summary", "title": "核心数据汇总表"},
                        {"key": "campus-employment-goals-results-tabs", "title": "就业目标与结果汇总"},
                        {"key": "campus-reputation-goals-results", "title": "口碑招生目标与结果汇总表"},
                        {"key": "campus-stability-stats", "title": "新生维稳统计表"},
                    ],
                },
                # 学员就业
                {
                    "key": "_campus-academic-employment",
                    "title": "学员就业",
                    "children": [
                        {"key": "campus-class-employment-detail", "title": "班级就业明细表"},
                        {"key": "campus-project-plan", "title": "智慧司项目计划表"},
                        {"key": "campus-class-salary-estimate", "title": "班薪资预估表"},
                        {"key": "campus-class-course-schedule", "title": "班排课表"},
                        {"key": "campus-class-assignment-score", "title": "班作业成绩表"},
                        {"key": "campus-class-exam-score", "title": "班考试成绩表"},
                        {"key": "campus-class-project-score", "title": "班项目成绩表"},
                        {"key": "campus-class-pressure-interview-score", "title": "班压力面试成绩表"},
                        {"key": "campus-student-satisfaction-score", "title": "学员满意度成绩表"},
                        {"key": "campus-class-lecture-score", "title": "听课成绩表"},
                    ],
                },
                # 口碑招生
                {
                    "key": "_campus-academic-reputation",
                    "title": "口碑招生",
                    "children": [
                        {"key": "campus-reputation-work-self-check", "title": "口碑招生计划与执行统计表"},
                        {"key": "campus-reputation-keypoint-summary", "title": "口碑招生关键点结果汇总表"},
                        {"key": "campus-student-interview-record", "title": "学员访谈记录表"},
                    ],
                },
                # 新生维稳
                {
                    "key": "_campus-academic-stability",
                    "title": "新生维稳",
                    "children": [
                        {"key": "campus-daily-new-student-schedule", "title": "后端每日新生安排表"},
                    ],
                },
                # 管理数据
                {
                    "key": "_campus-academic-mgmt",
                    "title": "管理数据",
                    "children": [
                        {"key": "campus-academic-staff-kpi-plan", "title": "教员kpi计划表"},
                        {"key": "campus-academic-staff-performance-reward-punishment", "title": "教员业绩奖惩表"},
                        {"key": "academic-campus-05-manage-data-21-academic-staff-class-hour-summary", "title": "教员课时汇总表"},
                        {"key": "academic-campus-05-manage-data-22-academic-staff-class-hour-stats-4-teacher-hour-stats", "title": "教员课时统计表"},
                        {"key": "academic-campus-05-manage-data-23-academic-staff-interview-record", "title": "教员访谈记录表"},
                        {"key": "campus-academic-staff-standard-check", "title": "教员标准化检查表"},
                        {"key": "academic-campus-05-manage-data-25-academic-staff-daily-work-order-7-daily-work-summary", "title": "教员日工单"},
                        {"key": "academic-campus-05-manage-data-26-academic-metting-record", "title": "会议记录表"},
                        {"key": "academic-campus-05-manage-data-27-academic-teacher-function-analysis", "title": "教员功能分析总表"},
                    ],
                },
                # 企业文化
                {
                    "key": "_campus-academic-culture",
                    "title": "企业文化",
                    "children": [
                        {"key": "academic-campus-06-enterprise-culture-1-culture-presentation-plan", "title": "企业文化宣讲计划表"},
                        {"key": "academic-campus-06-enterprise-culture-2-culture-exam-plan", "title": "企业文化考试计划表"},
                    ],
                },
            ],
        },
        # ==================== 神殿 -> 教化司 ====================
        {
            "key": "_campus-tq",
            "title": "神殿·教化司",
            "children": [
                # 核心数据
                {
                    "key": "_campus-tq-core",
                    "title": "核心数据",
                    "children": [
                        {"key": "campus-test-core-data-002", "title": "核心业务数据汇总表"},
                        {"key": "campus-tq-employment-goals-results", "title": "学员就业目标与结果汇总表"},
                        {"key": "campus-tq-reputation-goals-results", "title": "教化司口碑招生目标与结果汇总表"},
                        {"key": "campus-tq-stability-stats", "title": "新生维稳统计表"},
                        {"key": "campus-tq-promotion-plan", "title": "升学计划表"},
                        {"key": "campus-tq-student-movement", "title": "学员异动表"},
                        {"key": "campus-tq-dormitory-statistics", "title": "宿舍统计表"},
                        {"key": "campus-tq-enrollment-statistics", "title": "学籍管理表"},
                    ],
                },
                # 学员就业
                {
                    "key": "_campus-tq-employment",
                    "title": "学员就业",
                    "children": [
                        {"key": "campus-tq-class-employment-detail", "title": "班级就业明细表"},
                        {"key": "campus-tq-employment-period-plan-supervision", "title": "就业期计划与监督表"},
                        {"key": "campus-tq-intensify-period-plan-supervision", "title": "强化期计划与监督表"},
                        {"key": "campus-tq-class-salary-estimate", "title": "班薪资预估表"},
                        {"key": "campus-tq-class-file-record", "title": "班档案表"},
                        {"key": "campus-tq-handover-list", "title": "咨询量交接列表"},
                        {"key": "campus-tq-class-thousand-score", "title": "班千分制"},
                        {"key": "campus-tq-class-status", "title": "班级情况表"},
                        {"key": "campus-tq-student-movement-application", "title": "学员异动申请表"},
                        {"key": "campus-tq-dorm-fee-notice-self-check", "title": "住宿费交款通知及自查表"},
                        {"key": "campus-tq-pressure-interview-score", "title": "压力面试成绩表"},
                        {"key": "campus-tq-pressure-interview-rating", "title": "压力面试打分表"},
                    ],
                },
                # 口碑招生
                {
                    "key": "_campus-tq-reputation",
                    "title": "口碑招生",
                    "children": [
                        {"key": "campus-tq-reputation-work-self-check", "title": "口碑招生计划与执行统计表"},
                        {"key": "campus-tq-reputation-keypoint-summary", "title": "口碑关键点结果汇总/明细"},
                        {"key": "campus-tq-activity-plan-arrangement", "title": "活动计划安排表"},
                        {"key": "campus-tq-student-interview-record", "title": "学员访谈记录表"},
                    ],
                },
                # 新生维稳
                {
                    "key": "_campus-tq-stability",
                    "title": "新生维稳",
                    "children": [
                        {"key": "campus-tq-daily-new-student-schedule", "title": "后端每日新生安排表"},
                    ],
                },
                # 提升升学
                {
                    "key": "_campus-tq-promotion",
                    "title": "提升升学",
                    "children": [
                        {"key": "campus-tq-promotion-upgrade-plan", "title": "升学计划表"},
                    ],
                },
                # 管理数据
                {
                    "key": "_campus-tq-mgmt",
                    "title": "管理数据",
                    "children": [
                        {"key": "campus-tq-employee-function-analysis", "title": "员工功能分析表"},
                        {"key": "campus-tq-employee-kpi-plan", "title": "员工KPI计划表"},
                        {"key": "campus-tq-employee-interview-form", "title": "员工访谈表"},
                        {"key": "campus-tq-meeting-record", "title": "会议记录表"},
                        {"key": "campus-tq-homeroom-teacher-standardization", "title": "班主任标准化检查表"},
                        {"key": "campus-tq-homeroom-teacher-daily-work", "title": "班主任日工单"},
                        {"key": "campus-tq-training-plan-score-detail", "title": "教化司培训计划与成绩明细表"},
                    ],
                },
                # 企业文化
                {
                    "key": "_campus-tq-culture",
                    "title": "企业文化",
                    "children": [
                        {"key": "campus-tq-culture-presentation-plan", "title": "企业文化宣讲计划表"},
                        {"key": "campus-tq-culture-exam-score", "title": "企业文化考试计划表"},
                    ],
                },
            ],
        },
        # ==================== 系统工具 ====================
        {
            "key": "_system",
            "title": "系统工具",
            "children": [
                {"key": "system-logs", "title": "日志中心"},
            ],
        },
    ]


# ======================== API 端点 ========================

@router.get("/permission-tree", summary="获取权限树")
def get_permission_tree_api() -> list[dict[str, Any]]:
    """获取系统所有功能的权限树，按菜单/部门组织"""
    return get_permission_tree()


@router.get("/filter-options", response_model=FilterOptions, summary="获取筛选选项")
def get_filter_options(db: Session = Depends(get_db)) -> FilterOptions:
    """获取神殿、部门、岗位筛选选项"""
    campuses = [
        r[0] for r in db.query(distinct(User.campus))
        .filter(User.campus.isnot(None), User.campus != "")
        .order_by(User.campus).all()
    ]
    departments = [
        r[0] for r in db.query(distinct(User.department))
        .filter(User.department.isnot(None), User.department != "")
        .order_by(User.department).all()
    ]
    positions = [
        r[0] for r in db.query(distinct(User.position))
        .filter(User.position.isnot(None), User.position != "")
        .order_by(User.position).all()
    ]
    return FilterOptions(campuses=campuses, departments=departments, positions=positions)


@router.get("/users", summary="获取用户列表(含权限)")
def get_users_with_permissions(
    campus: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    position: Optional[str] = Query(None),
    name: Optional[str] = Query(None),
    db: Session = Depends(get_db),
) -> list[dict[str, Any]]:
    """获取用户列表并附带每个用户的权限代码列表（selectinload 消除 N+1）"""
    query = db.query(User).options(selectinload(User.permissions))

    if campus:
        query = query.filter(User.campus == campus)
    if department:
        query = query.filter(User.department == department)
    if position:
        query = query.filter(User.position == position)
    if name:
        query = query.filter(User.real_name.contains(name))

    users = query.order_by(User.campus, User.department, User.real_name).all()

    return [
        {
            "user_id": u.user_id,
            "username": u.username,
            "real_name": u.real_name,
            "department": u.department,
            "position": u.position,
            "campus": u.campus,
            "status": u.status.value if u.status else None,
            "permissions": [p.permission_code for p in u.permissions],
        }
        for u in users
    ]


@router.get("/users/{user_id}/permissions", summary="获取单个用户权限")
def get_user_permissions(user_id: int, db: Session = Depends(get_db)) -> list[str]:
    """获取指定用户的权限代码列表"""
    perms = (
        db.query(UserPermissionDirect.permission_code)
        .filter(UserPermissionDirect.user_id == user_id)
        .all()
    )
    return [p[0] for p in perms]


@router.put("/users/{user_id}/permissions", summary="设置单个用户权限")
def set_user_permissions(
    user_id: int,
    req: SetUserPermissionsRequest,
    request: Request,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """设置指定用户的权限（全量覆盖）"""
    if req.user_id != user_id:
        raise HTTPException(status_code=400, detail="路径 user_id 与请求体 user_id 不一致")

    # 删除旧权限（ORM 会被 before_flush 审计捕获）
    db.query(UserPermissionDirect).filter(UserPermissionDirect.user_id == user_id).delete()

    # 批量插入新权限
    now = utcnow()
    for code in req.permissions:
        db.add(UserPermissionDirect(user_id=user_id, permission_code=code, created_at=now))

    db.commit()

    # 补充业务审计元数据（供中间件写入日志时附加）
    audit_logger = get_audit_logger(request)
    audit_logger.set_action(
        action="permission.user.set",
        action_display="设置单个用户权限",
        action_category="write",
        module="permission_management",
        extra={"user_id": user_id, "permission_count": len(req.permissions)},
    )
    return {"message": "权限设置成功", "count": len(req.permissions)}


@router.post("/batch-set-permissions", summary="批量设置权限")
def batch_set_permissions(
    req: BatchSetPermissionsRequest,
    request: Request,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """批量为多个用户设置相同的权限（全量覆盖）"""
    now = utcnow()
    for uid in req.user_ids:
        db.query(UserPermissionDirect).filter(UserPermissionDirect.user_id == uid).delete()
        for code in req.permissions:
            db.add(UserPermissionDirect(user_id=uid, permission_code=code, created_at=now))

    db.commit()

    audit_logger = get_audit_logger(request)
    audit_logger.set_action(
        action="permission.users.batch_set",
        action_display="批量设置用户权限",
        action_category="write",
        module="permission_management",
        extra={"user_count": len(req.user_ids), "permission_count": len(req.permissions)},
    )
    return {
        "message": f"已为 {len(req.user_ids)} 个用户设置权限",
        "user_count": len(req.user_ids),
        "permission_count": len(req.permissions),
    }


@router.post("/batch-add-permissions", summary="批量追加权限")
def batch_add_permissions(
    req: BatchSetPermissionsRequest,
    request: Request,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """批量为多个用户追加权限（不删除已有的，仅新增）"""
    now = utcnow()
    added = 0
    for uid in req.user_ids:
        existing: set[str] = {
            r[0] for r in db.query(UserPermissionDirect.permission_code)
            .filter(UserPermissionDirect.user_id == uid).all()
        }
        for code in req.permissions:
            if code not in existing:
                db.add(UserPermissionDirect(user_id=uid, permission_code=code, created_at=now))
                added += 1

    db.commit()

    audit_logger = get_audit_logger(request)
    audit_logger.set_action(
        action="permission.users.batch_add",
        action_display="批量追加用户权限",
        action_category="write",
        module="permission_management",
        extra={"user_count": len(req.user_ids), "permission_count": len(req.permissions), "added": added},
    )
    return {"message": f"已为 {len(req.user_ids)} 个用户追加权限", "added": added}


@router.post("/batch-remove-permissions", summary="批量移除权限")
def batch_remove_permissions(
    req: BatchSetPermissionsRequest,
    request: Request,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """批量为多个用户移除指定权限"""
    db.query(UserPermissionDirect).filter(
        UserPermissionDirect.user_id.in_(req.user_ids),
        UserPermissionDirect.permission_code.in_(req.permissions),
    ).delete(synchronize_session="fetch")

    db.commit()

    audit_logger = get_audit_logger(request)
    audit_logger.set_action(
        action="permission.users.batch_remove",
        action_display="批量移除用户权限",
        action_category="write",
        module="permission_management",
        extra={"user_count": len(req.user_ids), "permission_count": len(req.permissions)},
    )
    return {"message": f"已为 {len(req.user_ids)} 个用户移除指定权限"}


@router.post("/route-permission-map/sync", summary="同步 routeKey 权限映射")
def sync_route_permission_map(
    request: Request,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """
    从前端 menuItems.tsx 中的 permissions 配置读取 routeKey -> permissions 映射并写入数据库。
    """
    repo_root = Path(__file__).resolve().parents[5]
    menu_items_path = repo_root / "frontend" / "config" / "ui" / "menuItems.tsx"
    if not menu_items_path.exists():
        raise HTTPException(status_code=404, detail=f"未找到菜单配置文件: {menu_items_path}")

    menu_items_content = menu_items_path.read_text(encoding="utf-8")

    # 解析 menuItems.tsx：提取 routeKey + permissions
    mappings: list[tuple[str, str]] = []
    current_key: str | None = None
    current_has_perm = False
    route_key_re = re.compile(r"routeKey\s*:\s*['\"]([^'\"]+)['\"]")
    permissions_re = re.compile(r"permissions\s*:\s*\[([^\]]*)\]")
    perm_item_re = re.compile(r"['\"]([^'\"]+)['\"]")
    pending_route_key = False
    seen_keys: set[str] = set()

    def infer_permission(route_key: str) -> str:
        if route_key.startswith("market-"):
            return "marketing.*"
        if route_key.startswith("consult-"):
            return "consult.*"
        if route_key.startswith("campus-tq-") or route_key.startswith("teaching-quality-"):
            return "tq.*"
        if route_key.startswith("campus-") or route_key.startswith("academic-"):
            return "academic.*"
        if route_key.startswith("mgmt-"):
            return "academic.*"
        if route_key.startswith("system-"):
            return "system.*"
        return "common.*"

    for line in menu_items_content.splitlines():
        line_stripped = line.strip()
        route_match = route_key_re.search(line_stripped)
        if route_match:
            if current_key and not current_has_perm:
                mappings.append((current_key, infer_permission(current_key)))
            current_key = route_match.group(1)
            seen_keys.add(current_key)  # type: ignore[arg-type]
            current_has_perm = False
            pending_route_key = False
        elif "routeKey" in line_stripped and ":" in line_stripped and "'" not in line_stripped and '"' not in line_stripped:
            pending_route_key = True
        elif pending_route_key:
            next_match = perm_item_re.search(line_stripped)
            if next_match:
                if current_key and not current_has_perm:
                    mappings.append((current_key, infer_permission(current_key)))
                current_key = next_match.group(1)
                seen_keys.add(current_key)  # type: ignore[arg-type]
                current_has_perm = False
                pending_route_key = False

        perms_match = permissions_re.search(line_stripped)
        if perms_match and current_key:
            raw_perms = perms_match.group(1)
            perms = perm_item_re.findall(raw_perms)
            for perm in perms:
                mappings.append((current_key, perm))
            current_has_perm = True

        if line_stripped.startswith("},") and current_key:
            if not current_has_perm:
                mappings.append((current_key, infer_permission(current_key)))
            current_key = None
            current_has_perm = False
            pending_route_key = False

    # 补充 routes.ts 中未在 menuItems 中出现的 routeKey
    routes_path = repo_root / "frontend" / "config" / "router" / "routes.ts"
    if routes_path.exists():
        routes_content = routes_path.read_text(encoding="utf-8")
        for line in routes_content.splitlines():
            key_match = re.search(r"key\s*:\s*['\"]([^'\"]+)['\"]", line.strip())
            if key_match:
                route_key = key_match.group(1)
                if route_key not in seen_keys:
                    mappings.append((route_key, infer_permission(route_key)))

    # ORM 写入 -- 清空后逐条插入
    db.query(PermissionRouteMap).delete()
    seen_pairs: set[tuple[str, str]] = set()
    for route_key, permission_code in mappings:
        pair = (route_key, permission_code)
        if pair in seen_pairs:
            continue
        seen_pairs.add(pair)
        db.add(PermissionRouteMap(route_key=route_key, permission_code=permission_code))

    db.commit()

    route_key_count = len({m[0] for m in mappings})
    mapping_count = len(seen_pairs)

    audit_logger = get_audit_logger(request)
    audit_logger.set_action(
        action="permission.route_map.sync",
        action_display="同步路由权限映射",
        action_category="write",
        module="permission_management",
        extra={"route_key_count": route_key_count, "mapping_count": mapping_count},
    )
    return {
        "message": "routeKey 权限映射同步完成",
        "route_key_count": route_key_count,
        "mapping_count": mapping_count,
    }