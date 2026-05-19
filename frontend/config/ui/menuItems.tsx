/**
 * 菜单项配置
 * 基于目录结构设计的层级菜单
 */
import React from 'react'
import type { MenuProps } from 'antd'
import { Tooltip } from 'antd'
import {
  BankOutlined,
  BarChartOutlined,
  BookOutlined,
  HomeOutlined,
  SoundOutlined,
  TeamOutlined,
  TrophyOutlined,
  UserOutlined,
  FileTextOutlined,
  DatabaseOutlined,
  ShopOutlined,
  CustomerServiceOutlined,
  DollarOutlined,
  SafetyOutlined,
  GlobalOutlined,
  VideoCameraOutlined,
  MessageOutlined,
  SettingOutlined,
  ReadOutlined,
  AreaChartOutlined,
  FormOutlined,
  CheckCircleOutlined,
  SwapOutlined,
} from '@ant-design/icons'
import {
  matchesDepartmentPositionRule,
  RECRUITMENT_ONBOARDING_ACCESS_RULES,
  type DepartmentPositionAccessRule,
} from '@/utils/recruitmentOnboardingAccess'
// DailyReportMenuLabel removed - no longer used in new menu structure

export interface MenuItemConfig {
  key: string
  label: string | React.ReactNode
  icon?: React.ReactNode
  routeKey?: string // 指向 routes.ts 中的 route key（用于独立路由）
  menuKey?: string // 如果是 core-data 类型，指定 menu 参数
  children?: MenuItemConfig[]
  type?: 'group' // 用于分组标题（不可点击）
  order?: number // 排序
  permissions?: string[] // 权限控制（可选）
  department?: 'academic' | 'teaching_quality' | 'common' // 部门标识：智慧司、教化司、公共
  requiredPositions?: string[] // 职位限制：只有指定职位的用户才能访问
  departmentPositionRules?: DepartmentPositionAccessRule[] // 部门+职位联合限制
}

// ==================== 最高议事厅菜单 ====================

// 最高议事厅 -> 智慧司
export const MANAGEMENT_CENTER_ACADEMIC_MENU: MenuItemConfig[] = [
  {
    key: 'mgmt-academic-01-core-summary',
    label: '01 核心业务数据汇总',
    icon: <BarChartOutlined />,
    routeKey: 'mgmt-core-summary',
    menuKey: 'mgmt-core-summary',
  },
  {
    key: 'mgmt-academic-02-employment',
    label: '02 后端学员就业汇总表',
    icon: <TrophyOutlined />,
    routeKey: 'mgmt-employment-summary',
    menuKey: 'mgmt-employment-summary',
  },
  {
    key: 'mgmt-academic-03-enrollment',
    label: '03 招生统计汇总表',
    icon: <UserOutlined />,
    routeKey: 'mgmt-enrollment-summary',
    menuKey: 'mgmt-enrollment-summary',
  },
  {
    key: 'mgmt-academic-04-stability',
    label: '04 新生维稳汇总表',
    icon: <SafetyOutlined />,
    routeKey: 'mgmt-student-stability',
    menuKey: 'mgmt-student-stability',
  },
  {
    key: 'mgmt-academic-05-teacher-staffing',
    label: '05 师资配比表',
    icon: <TeamOutlined />,
    routeKey: 'mgmt-teacher-staffing',
    menuKey: 'mgmt-teacher-staffing',
  },
  {
    key: 'mgmt-academic-06-onboarding',
    label: '06 入职离职汇总表',
    icon: <UserOutlined />,
    routeKey: 'mgmt-onboarding-offboarding',
    menuKey: 'mgmt-onboarding-offboarding',
  },
  {
    key: 'mgmt-academic-07-training',
    label: '07 培训计划与成绩汇总表',
    icon: <BookOutlined />,
    routeKey: 'mgmt-training-summary',
    menuKey: 'mgmt-training-summary',
  },
  {
    key: 'mgmt-academic-08-manager-analysis',
    label: '08 经理功能分析表',
    icon: <UserOutlined />,
    routeKey: 'mgmt-manager-analysis',
    menuKey: 'mgmt-manager-analysis',
  },
  {
    key: 'mgmt-academic-09-network-survey',
    label: '09 网络调查汇总表',
    icon: <DatabaseOutlined />,
    routeKey: 'mgmt-network-survey',
    menuKey: 'mgmt-network-survey',
  },
  {
    key: 'mgmt-academic-10-enterprise-survey',
    label: '10 企业调查汇总表',
    icon: <ShopOutlined />,
    routeKey: 'mgmt-enterprise-survey',
    menuKey: 'mgmt-enterprise-survey',
  },
  {
    key: 'mgmt-academic-11-position-analysis',
    label: '11 岗位分析报告汇总表',
    icon: <BarChartOutlined />,
    routeKey: 'mgmt-position-analysis',
    menuKey: 'mgmt-position-analysis',
  },
  {
    key: 'mgmt-academic-12-courseware',
    label: '12 课件编写汇总表',
    icon: <FileTextOutlined />,
    routeKey: 'mgmt-courseware-writing',
    menuKey: 'mgmt-courseware-writing',
  },
  {
    key: 'mgmt-academic-13-questionbank',
    label: '13 题库编写汇总表',
    icon: <FileTextOutlined />,
    routeKey: 'mgmt-questionbank-writing',
    menuKey: 'mgmt-questionbank-writing',
  },
  {
    key: 'mgmt-academic-14-evaluation',
    label: '14 学术经理功能评价表',
    icon: <UserOutlined />,
    routeKey: 'mgmt-manager-evaluation',
    menuKey: 'mgmt-manager-evaluation',
  },
]

// 最高议事厅 -> 教化司
export const MANAGEMENT_CENTER_TEACHING_QUALITY_MENU: MenuItemConfig[] = [
  {
    key: 'mgmt-tq-x1-all',
    label: '核心业务数据汇总',
    icon: <BarChartOutlined />,
    routeKey: 'teaching-quality-mgnt-core-business-summary-all',
  },
]

// 最高议事厅主菜单
export const MANAGEMENT_CENTER_MENU: MenuItemConfig[] = [
  {
    key: 'management-center',
    label: '最高议事厅',
    icon: <BankOutlined />,
    children: [
      {
        key: 'mgmt-academic-merged',
        label: '智慧司',
        icon: <BookOutlined />,
        department: 'academic',
        children: [
          {
            key: 'mgmt-academic-core-business-all',
            label: '核心业务数据汇总',
            icon: <BarChartOutlined />,
            routeKey: 'academic-mgnt-core-business-summary-all',
            permissions: ['academic.core_dashboard.view'],  // 需要核心看板权限
            requiredPositions: ['董事长', '学术总监'],  // 只有董事长和学术总监可访问
          },
        ],
      },
      // 移除旧“智慧司”分组，统一使用整合入口
      {
        key: 'mgmt-teaching-quality',
        label: '教化司',
        icon: <SafetyOutlined />,
        department: 'teaching_quality',
        children: MANAGEMENT_CENTER_TEACHING_QUALITY_MENU,
      },
      {
        key: 'mgmt-market',
        label: '市场部',
        icon: <ShopOutlined />,
        department: 'common',
        children: [
          // 01.核心数据
          {
            key: 'mgmt-market-01-core-data',
            label: '01.核心数据',
            icon: <BarChartOutlined />,
            department: 'common',
            children: [
              {
                key: 'mgmt-market-001-yearly-summary',
                label: '核心业务(年度)汇总表',
                icon: <FileTextOutlined />,
                department: 'common',
                routeKey: 'market-yearly-summary',
              },
            ],
          },
          // 02.网推数据
          {
            key: 'mgmt-market-02-online-promotion',
            label: '02.网推数据',
            icon: <GlobalOutlined />,
            department: 'common',
            children: [
              {
                key: 'mgmt-market-002-monthly-data',
                label: '月度数据表',
                icon: <FileTextOutlined />,
                department: 'common',
                routeKey: 'market-monthly-data',
              },
              {
                key: 'mgmt-market-003-online-stage-report',
                label: '网推阶段业务汇报表',
                icon: <FileTextOutlined />,
                department: 'common',
                routeKey: 'market-online-promotion-stage-report',
              },
              {
                key: 'mgmt-market-010-monthly-business-progress',
                label: '本月业务推进表',
                icon: <FileTextOutlined />,
                department: 'common',
                routeKey: 'market-monthly-business-progress',
              },
              {
                key: 'mgmt-market-005-sem-daily-data',
                label: 'SEM日度数据表',
                icon: <FileTextOutlined />,
                department: 'common',
                routeKey: 'market-sem-daily-data',
              },
              {
                key: 'mgmt-market-006-online-partner-daily-data',
                label: '网络合作伙伴日度数据表',
                icon: <FileTextOutlined />,
                department: 'common',
                routeKey: 'market-online-partner-daily-data',
              },
              {
                key: 'mgmt-market-007-daily-reputation-data',
                label: '口碑日度数据表',
                icon: <FileTextOutlined />,
                department: 'common',
                routeKey: 'market-daily-reputation-data',
              },
              {
                key: 'mgmt-market-020-free-promotion-daily-data',
                label: '免费推广日度数据表',
                icon: <FileTextOutlined />,
                department: 'common',
                routeKey: 'market-free-promotion-daily-data',
              },
            ],
          },
          // 03.新媒体剪辑
          {
            key: 'mgmt-market-03-newmedia-editing',
            label: '03.新媒体',
            icon: <VideoCameraOutlined />,
            department: 'common',
            children: [
              {
                key: 'mgmt-market-008-newmedia-edit-report',
                label: '新媒体剪辑汇报表',
                icon: <FileTextOutlined />,
                department: 'common',
                routeKey: 'market-newmedia-edit-report',
              },
              {
                key: 'mgmt-market-003-newmedia-stage-report',
                label: '新媒体阶段业务汇报表',
                icon: <FileTextOutlined />,
                department: 'common',
                routeKey: 'market-newmedia-phase-report',
              },
              {
                key: 'mgmt-market-004-newmedia-daily-data',
                label: '新媒体日度数据表',
                icon: <FileTextOutlined />,
                department: 'common',
                routeKey: 'market-newmedia-daily-data',
              },
            ],
          },
          // 04.网聊数据
          {
            key: 'mgmt-market-04-online-chat',
            label: '04.网聊数据',
            icon: <MessageOutlined />,
            department: 'common',
            children: [
              {
                key: 'mgmt-market-009-network-consultant-report',
                label: '网络咨询师汇报表',
                icon: <FileTextOutlined />,
                department: 'common',
                routeKey: 'market-network-consultant-report',
              },
            ],
          },
          // 05.管理数据
          {
            key: 'mgmt-market-05-management-data',
            label: '05.管理数据',
            icon: <SettingOutlined />,
            department: 'common',
            children: [
              {
                key: 'mgmt-market-011-staff-function-analysis',
                label: '全员功能分析',
                icon: <FileTextOutlined />,
                department: 'common',
                routeKey: 'market-staff-function-analysis',
              },
              {
                key: 'mgmt-market-012-network-plan',
                label: '年度网络计划表',
                icon: <FileTextOutlined />,
                department: 'common',
                routeKey: 'market-network-plan',
              },
              {
                key: 'mgmt-market-013-monthly-detail-plan',
                label: '月度详细计划',
                icon: <FileTextOutlined />,
                department: 'common',
                routeKey: 'market-monthly-detail-plan',
              },
              {
                key: 'mgmt-market-016-partner-contacts',
                label: '合作方联系信息',
                icon: <FileTextOutlined />,
                department: 'common',
                routeKey: 'market-partner-contacts',
              },
              {
                key: 'mgmt-market-017-employee-interview-records',
                label: '员工访谈记录表',
                icon: <FileTextOutlined />,
                department: 'common',
                routeKey: 'market-employee-interview-records',
              },
              {
                key: 'mgmt-market-018-meeting-record',
                label: '会议记录表',
                icon: <FileTextOutlined />,
                department: 'common',
                routeKey: 'market-meeting-record',
              },
              {
                key: 'mgmt-market-019-newmedia-account-sentiment',
                label: '各校新媒体账号舆情登记表',
                icon: <FileTextOutlined />,
                department: 'common',
                routeKey: 'market-account-sentiment',
              },
            ],
          },
          // 06.企业文化及培训
          {
            key: 'mgmt-market-06-culture-training',
            label: '06.企业文化及培训',
            icon: <ReadOutlined />,
            department: 'common',
            children: [
              {
                key: 'mgmt-market-015-training-summary',
                label: '培训汇总表',
                icon: <FileTextOutlined />,
                department: 'common',
                routeKey: 'market-training-summary',
              },
            ],
          },
        ],
      },
      {
        key: 'mgmt-consulting',
        label: '祈福司',
        icon: <CustomerServiceOutlined />,
        department: 'common',
        children: [
          {
            key: 'mgmt-consulting-dashboard',
            label: '001最高议事厅祈福司核心业务数据汇总',
            icon: <BarChartOutlined />,
            routeKey: 'consult-mgnt-center-dashboard',
          },
        ],
      },
      {
        key: 'mgmt-humanresources',
        label: '人事部',
        icon: <TeamOutlined />,
        department: 'common',
        children: [
          {
            key: 'mgmt-humanresources-core',
            label: '核心数据',
            icon: <BarChartOutlined />,
            children: [
              {
                key: 'mgmt-humanresources-000-personal-info',
                label: '000 集团个人信息数据看板',
                icon: <BarChartOutlined />,
                routeKey: 'humanresources-000-personal-info-dashboard',
              },
              {
                key: 'mgmt-humanresources-001-annual-comprehensive',
                label: '001 集团人力资源年度综合看板',
                icon: <BarChartOutlined />,
                routeKey: 'humanresources-001-annual-comprehensive-dashboard',
              },
            ],
          },
          {
            key: 'mgmt-humanresources-hq',
            label: '集团总部',
            icon: <BankOutlined />,
            children: [
              {
                key: 'mgmt-humanresources-hq-002-annual',
                label: '002 最高议事厅年度核心数据看板',
                icon: <BarChartOutlined />,
                routeKey: 'humanresources-hq-002-annual-dashboard',
              },
              {
                key: 'mgmt-humanresources-hq-003-monthly',
                label: '003 最高议事厅月度核心数据看板',
                icon: <BarChartOutlined />,
                routeKey: 'humanresources-hq-003-monthly-dashboard',
              },
              {
                key: 'mgmt-humanresources-hq-004-daily',
                label: '004 最高议事厅日度核心数据看板',
                icon: <BarChartOutlined />,
                routeKey: 'humanresources-hq-004-daily-dashboard',
              },
              {
                key: 'mgmt-humanresources-hq-005-employee-archive',
                label: '005 最高议事厅-员工档案表',
                icon: <FileTextOutlined />,
                routeKey: 'humanresources-hq-005-employee-archive',
              },
            ],
          },
          {
            key: 'mgmt-humanresources-online',
            label: '线上事业部',
            icon: <GlobalOutlined />,
            children: [
              {
                key: 'mgmt-humanresources-online-002-annual',
                label: '002 线上-年度核心数据看板',
                icon: <BarChartOutlined />,
                routeKey: 'humanresources-online-002-annual-dashboard',
              },
              {
                key: 'mgmt-humanresources-online-003-monthly',
                label: '003 线上-月度核心数据看板',
                icon: <BarChartOutlined />,
                routeKey: 'humanresources-online-003-monthly-dashboard',
              },
              {
                key: 'mgmt-humanresources-online-004-daily',
                label: '004 线上-日度核心数据看板',
                icon: <BarChartOutlined />,
                routeKey: 'humanresources-online-004-daily-dashboard',
              },
              {
                key: 'mgmt-humanresources-online-005-employee-archive',
                label: '005 线上-员工档案表',
                icon: <FileTextOutlined />,
                routeKey: 'humanresources-online-005-employee-archive',
              },
            ],
          },
          {
            key: 'mgmt-humanresources-offline',
            label: '线下事业部',
            icon: <ShopOutlined />,
            children: [
              {
                key: 'mgmt-humanresources-offline-002-annual',
                label: '002 线下-年度核心数据看板',
                icon: <BarChartOutlined />,
                routeKey: 'humanresources-offline-002-annual-dashboard',
              },
              {
                key: 'mgmt-humanresources-offline-003-monthly',
                label: '003 线下-月度核心数据看板',
                icon: <BarChartOutlined />,
                routeKey: 'humanresources-offline-003-monthly-dashboard',
              },
              {
                key: 'mgmt-humanresources-offline-004-daily',
                label: '004 线下-日度核心数据看板',
                icon: <BarChartOutlined />,
                routeKey: 'humanresources-offline-004-daily-dashboard',
              },
              {
                key: 'mgmt-humanresources-offline-005-employee-archive',
                label: '005 线下-员工档案表',
                icon: <FileTextOutlined />,
                routeKey: 'humanresources-offline-005-employee-archive',
              },
            ],
          },
          {
            key: 'mgmt-humanresources-base',
            label: '基础数据',
            icon: <DatabaseOutlined />,
            children: [
              {
                key: 'mgmt-humanresources-base-006-training',
                label: '006 集团人资基础-培训管理',
                icon: <ReadOutlined />,
                routeKey: 'humanresources-base-006-training-management',
              },
              {
                key: 'mgmt-humanresources-base-006-hr-planning',
                label: '006 集团人资基础-人力资源规划',
                icon: <FormOutlined />,
                routeKey: 'humanresources-base-006-hr-planning',
              },
              {
                key: 'mgmt-humanresources-base-006-social-insurance',
                label: '006 集团人资基础-社保',
                icon: <SafetyOutlined />,
                routeKey: 'humanresources-base-006-social-insurance',
              },
              {
                key: 'mgmt-humanresources-base-006-recruitment',
                label: '006 集团人资基础-招聘入职',
                icon: <UserOutlined />,
                routeKey: 'humanresources-base-006-recruitment-onboarding',
                departmentPositionRules: RECRUITMENT_ONBOARDING_ACCESS_RULES,
              },
            ],
          },
        ],
      },
      {
        key: 'mgmt-finance',
        label: '神藏司',
        icon: <DollarOutlined />,
        department: 'common',
      },
    ],
  },
]

// ==================== 神殿级别菜单 ====================

// 神殿 -> 智慧司
export const CAMPUS_ACADEMIC_MENU: MenuItemConfig[] = [
  {
    key: 'campus-academic',
    label: '智慧司',
    icon: <BookOutlined />,
    department: 'academic',
    children: [
      {
        key: 'campus-academic-group-core',
        label: '核心数据',
        icon: <BarChartOutlined />,
        children: [
          {
            key: 'campus-academic-core-data',
            label: '核心数据汇总表',
            icon: <BarChartOutlined />,
            routeKey: 'campus-core-data-summary',
            menuKey: 'campus-core-data-summary',
            permissions: ['academic.campus_core_dashboard.view'],
          },
          {
            key: 'campus-academic-employment-target-summary',
            label: '就业目标与结果汇总',
            icon: <TrophyOutlined />,
            routeKey: 'campus-employment-goals-results-tabs',
            permissions: ['academic.employment.goals.view'],
          },
          {
            key: 'campus-academic-reputation',
            label: '口碑招生目标与结果汇总表',
            icon: <SoundOutlined />,
            routeKey: 'campus-reputation-goals-results',
            permissions: ['academic.enrollment.reputation.view'],
          },
          {
            key: 'campus-academic-stability',
            label: '新生维稳统计表',
            icon: <UserOutlined />,
            routeKey: 'campus-stability-stats',
            permissions: ['academic.stability.view'],
          },
        ],
      },
      {
        key: 'academic-campus-employment',
        label: '学员就业',
        icon: <TrophyOutlined />,
        children: [
          {
            key: 'campus-academic-class-employment-detail',
            label: '班级就业明细表',
            icon: <FileTextOutlined />,
            routeKey: 'campus-class-employment-detail',
            permissions: ['academic.employment.class_detail.view'],
          },
          {
            key: 'campus-academic-project-plan',
            label: '智慧司项目计划表',
            icon: <FileTextOutlined />,
            routeKey: 'campus-project-plan',
            permissions: ['academic.project_plan.view'],
          },
          {
            key: 'campus-academic-class-salary-estimate',
            label: '班薪资预估表',
            icon: <FileTextOutlined />,
            routeKey: 'campus-class-salary-estimate',
            permissions: ['academic.class.salary.view'],
          },
          {
            key: 'campus-academic-class-course-schedule',
            label: '班排课表',
            icon: <FileTextOutlined />,
            routeKey: 'campus-class-course-schedule',
            permissions: ['academic.class.schedule.view'],
          },
          {
            key: 'campus-academic-class-assignment-score',
            label: '班作业成绩表',
            icon: <FileTextOutlined />,
            routeKey: 'campus-class-assignment-score',
            permissions: ['academic.class.homework.view'],
          },
          {
            key: 'campus-academic-class-exam-score',
            label: '班考试成绩表',
            icon: <FileTextOutlined />,
            routeKey: 'campus-class-exam-score',
            permissions: ['academic.class.exam.view'],
          },
          {
            key: 'campus-academic-class-project-score',
            label: '班项目成绩表',
            icon: <FileTextOutlined />,
            routeKey: 'campus-class-project-score',
            permissions: ['academic.class.project.view'],
          },
          {
            key: 'campus-academic-class-pressure-interview-score',
            label: '班压力面试成绩表',
            icon: <FileTextOutlined />,
            routeKey: 'campus-class-pressure-interview-score',
            permissions: ['academic.class.pressure_interview.view'],
          },
          {
            key: 'campus-academic-student-satisfaction-score',
            label: '学员满意度成绩表',
            icon: <FileTextOutlined />,
            routeKey: 'campus-student-satisfaction-score',
            permissions: ['academic.satisfaction.view'],
          },
          {
            key: 'campus-academic-class-lecture-score',
            label: '听课成绩表',
            icon: <FileTextOutlined />,
            routeKey: 'campus-class-lecture-score',
            permissions: ['academic.audit.score.view'],
          },
        ],
      },
      {
        key: 'academic-campus-reputation-enrollment',
        label: '口碑招生',
        icon: <SoundOutlined />,
        children: [
          {
            key: 'academic-reputaion-work-self-check',
            label: '口碑招生计划与执行统计表',
            icon: <FileTextOutlined />,
            routeKey: 'campus-reputation-work-self-check',
            permissions: ['academic.enrollment.plan.view'],
          },
          {
            key: 'academic-reputation-keypoint-summary',
            label: '口碑招生关键点结果汇总表',
            icon: <FileTextOutlined />,
            routeKey: 'campus-reputation-keypoint-summary',
            permissions: ['academic.enrollment.key_results.view'],
          },
          {
            key: 'academic-student-interview-record',
            label: '学员访谈记录表',
            icon: <FileTextOutlined />,
            routeKey: 'campus-student-interview-record',
            permissions: ['academic.student.interview.view'],
          },
        ],
      },
      {
        key: 'academic-campus-student-stability',
        label: '新生维稳',
        icon: <UserOutlined />,
        children: [
          {
            key: 'academic-daily-new-student-schedule',
            label: '后端每日新生安排表',
            icon: <FileTextOutlined />,
            routeKey: 'campus-daily-new-student-schedule',
            permissions: ['academic.newbie.daily.view'],
          },
        ],
      },
      {
        key: 'academic-campus-management-data',
        label: '管理数据',
        icon: <TeamOutlined />,
        children: [
          {
            key: 'academic-academic-staff-kpi-plan',
            label: '教员kpi计划表',
            icon: <FileTextOutlined />,
            routeKey: 'campus-academic-staff-kpi-plan',
            permissions: ['academic.teacher.kpi.view'],
          },
          {
            key: 'academic-academic-staff-performance-reward-punishment',
            label: '教员业绩奖惩表',
            icon: <FileTextOutlined />,
            routeKey: 'campus-academic-staff-performance-reward-punishment',
            permissions: ['academic.teacher.reward.view'],
          },
          {
            key: 'academic-academic-staff-class-hour-summary',
            label: '教员课时汇总表',
            icon: <FileTextOutlined />,
            routeKey: 'academic-campus-05-manage-data-21-academic-staff-class-hour-summary',
            permissions: ['academic.teacher.hours_summary.view'],
          },
          {
            key: 'academic-academic-staff-class-hour-stats',
            label: '教员课时统计表',
            icon: <FileTextOutlined />,
            routeKey:
              'academic-campus-05-manage-data-22-academic-staff-class-hour-stats-4-teacher-hour-stats',
            permissions: ['academic.teacher.hours.view'],
          },
          {
            key: 'academic-academic-staff-interview-record',
            label: '教员访谈记录表',
            icon: <FileTextOutlined />,
            routeKey: 'academic-campus-05-manage-data-23-academic-staff-interview-record',
            permissions: ['academic.teacher.interview.view'],
          },
          {
            key: 'academic-academic-staff-standard-check',
            label: '教员标准化检查表',
            icon: <FileTextOutlined />,
            routeKey: 'campus-academic-staff-standard-check',
            permissions: ['academic.teacher.standardization.view'],
          },
          {
            key: 'academic-academic-staff-daily-work-order',
            label: '教员日工单',
            icon: <FileTextOutlined />,
            routeKey:
              'academic-campus-05-manage-data-25-academic-staff-daily-work-order-7-daily-work-summary',
            permissions: ['academic.teacher.daily.view'],
          },
          {
            key: 'academic-academic-meeting-record',
            label: '会议记录表',
            icon: <FileTextOutlined />,
            routeKey: 'academic-campus-05-manage-data-26-academic-metting-record',
            permissions: ['academic.meeting.view'],
          },
          {
            key: 'academic-academic-staff-function-analysis',
            label: '教员功能分析总表',
            icon: <FileTextOutlined />,
            routeKey: 'academic-campus-05-manage-data-27-academic-teacher-function-analysis',
            permissions: ['academic.teacher.analysis.view'],
          },
        ],
      },
      {
        key: 'academic-campus-corporate-culture',
        label: '企业文化',
        icon: <FileTextOutlined />,
        permissions: ['academic.enterprise_culture.*'],  // 需要企业文化相关权限才能看到
        children: [
          {
            key: 'academic-corporate-culture-promotion-plan',
            label: '企业文化宣讲计划表',
            icon: <FileTextOutlined />,
            routeKey: 'academic-campus-06-enterprise-culture-1-culture-presentation-plan',
            permissions: ['academic.enterprise_culture.presentation.view'],
          },
          {
            key: 'academic-corporate-culture-exam-score',
            label: '企业文化考试计划表',
            icon: <FileTextOutlined />,
            routeKey: 'academic-campus-06-enterprise-culture-2-culture-exam-plan',
            permissions: ['academic.enterprise_culture.exam.view'],
          },
        ],
      },
    ],
  },
]

// 神殿 -> 教化司
export const CAMPUS_TEACHING_QUALITY_MENU: MenuItemConfig[] = [
  {
    key: 'campus-teaching-quality',
    label: '教化司',
    icon: <SafetyOutlined />,
    department: 'teaching_quality',
    children: [
      {
        key: 'campus-tq-group-core',
        label: '核心数据',
        icon: <BarChartOutlined />,
        children: [
          {
            key: 'campus-tq-core-data',
            label: '核心业务数据汇总表',
            icon: <BarChartOutlined />,
            routeKey: 'campus-test-core-data-002',
          },
          {
            key: 'campus-tq-employment-goals-results',
            label: '学员就业目标与结果汇总表',
            icon: <TrophyOutlined />,
            routeKey: 'campus-tq-employment-goals-results',
          },
          {
            key: 'campus-tq-reputation-goals-results',
            label: '教化司口碑招生目标与结果汇总表',
            icon: <SoundOutlined />,
            routeKey: 'campus-tq-reputation-goals-results',
          },
          {
            key: 'campus-tq-stability-stats',
            label: '新生维稳统计表',
            icon: <UserOutlined />,
            routeKey: 'campus-tq-stability-stats',
          },
          {
            key: 'campus-tq-promotion-plan',
            label: '升学计划表',
            icon: <BookOutlined />,
            routeKey: 'campus-tq-promotion-plan',
          },
          {
            key: 'campus-tq-student-movement',
            label: '学员异动表',
            icon: <UserOutlined />,
            routeKey: 'campus-tq-student-movement',
          },
          {
            key: 'campus-tq-dormitory-statistics',
            label: '宿舍统计表',
            icon: <HomeOutlined />,
            routeKey: 'campus-tq-dormitory-statistics',
          },
          {
            key: 'campus-tq-enrollment-statistics',
            label: '学籍管理表',
            icon: <FileTextOutlined />,
            routeKey: 'campus-tq-enrollment-statistics',
          },
        ],
      },
      {
        key: 'campus-tq-group-employment',
        label: '学员就业',
        icon: <TrophyOutlined />,
        children: [
          {
            key: 'campus-tq-class-employment-detail',
            label: '班级就业明细表',
            icon: <FileTextOutlined />,
            routeKey: 'campus-tq-class-employment-detail',
          },
          {
            key: 'campus-tq-employment-period-plan-supervision',
            label: '就业期计划与监督表',
            icon: <FileTextOutlined />,
            routeKey: 'campus-tq-employment-period-plan-supervision',
          },
          {
            key: 'campus-tq-intensify-period-plan-supervision',
            label: '强化期计划与监督表',
            icon: <FileTextOutlined />,
            routeKey: 'campus-tq-intensify-period-plan-supervision',
          },
          {
            key: 'campus-tq-class-salary-estimate',
            label: '班薪资预估表',
            icon: <FileTextOutlined />,
            routeKey: 'campus-tq-class-salary-estimate',
          },
          {
            key: 'campus-tq-class-file-record',
            label: '班档案表',
            icon: <FileTextOutlined />,
            routeKey: 'campus-tq-class-file-record',
            department: 'common', // 智慧司也可以访问
          },
          {
            key: 'campus-tq-handover-list',
            label: '咨询量交接列表',
            icon: <SwapOutlined />,
            routeKey: 'campus-tq-handover-list',
          },
          {
            key: 'campus-tq-class-thousand-score',
            label: '班千分制',
            icon: <FileTextOutlined />,
            routeKey: 'campus-tq-class-thousand-score',
          },
          {
            key: 'campus-tq-class-status',
            label: '班级情况表',
            icon: <FileTextOutlined />,
            routeKey: 'campus-tq-class-status',
          },
          {
            key: 'campus-tq-student-movement-application',
            label: '学员异动申请表',
            icon: <FileTextOutlined />,
            routeKey: 'campus-tq-student-movement-application',
          },
          {
            key: 'campus-tq-dorm-fee-notice-self-check',
            label: '住宿费交款通知及自查表',
            icon: <FileTextOutlined />,
            routeKey: 'campus-tq-dorm-fee-notice-self-check',
          },
          {
            key: 'campus-tq-pressure-interview-score',
            label: '压力面试成绩表',
            icon: <FileTextOutlined />,
            routeKey: 'campus-tq-pressure-interview-score',
          },
          {
            key: 'campus-tq-pressure-interview-rating',
            label: '压力面试打分表',
            icon: <FileTextOutlined />,
            routeKey: 'campus-tq-pressure-interview-rating',
          },
        ],
      },
      {
        key: 'campus-tq-group-reputation',
        label: '口碑招生',
        icon: <SoundOutlined />,
        children: [
          {
            key: 'campus-tq-reputation-work-self-check',
            label: '口碑招生计划与执行统计表',
            icon: <FileTextOutlined />,
            routeKey: 'campus-tq-reputation-work-self-check',
          },
          {
            key: 'campus-tq-reputation-keypoint-summary',
            label: '口碑关键点结果汇总/明细',
            icon: <FileTextOutlined />,
            routeKey: 'campus-tq-reputation-keypoint-summary',
          },
          {
            key: 'campus-tq-activity-plan-arrangement',
            label: '活动计划安排表',
            icon: <FileTextOutlined />,
            routeKey: 'campus-tq-activity-plan-arrangement',
          },
          {
            key: 'campus-tq-student-interview-record',
            label: '学员访谈记录表',
            icon: <FileTextOutlined />,
            routeKey: 'campus-tq-student-interview-record',
          },
        ],
      },
      {
        key: 'campus-tq-group-stability',
        label: '新生维稳',
        icon: <UserOutlined />,
        children: [
          {
            key: 'campus-tq-daily-new-student-schedule',
            label: '后端每日新生安排表',
            icon: <FileTextOutlined />,
            routeKey: 'campus-tq-daily-new-student-schedule',
          },
        ],
      },
      {
        key: 'campus-tq-group-promotion',
        label: '提升升学',
        icon: <BookOutlined />,
        children: [
          {
            key: 'campus-tq-promotion-upgrade-plan',
            label: '升学计划表',
            icon: <FileTextOutlined />,
            routeKey: 'campus-tq-promotion-upgrade-plan',
          },
        ],
      },
      {
        key: 'campus-tq-group-management',
        label: '管理数据',
        icon: <TeamOutlined />,
        children: [
          {
            key: 'campus-tq-employee-function-analysis',
            label: '员工功能分析表',
            icon: <FileTextOutlined />,
            routeKey: 'campus-tq-employee-function-analysis',
          },
          {
            key: 'campus-tq-employee-kpi-plan',
            label: '员工KPI计划表',
            icon: <FileTextOutlined />,
            routeKey: 'campus-tq-employee-kpi-plan',
          },
          {
            key: 'campus-tq-employee-interview-form',
            label: '员工访谈表',
            icon: <FileTextOutlined />,
            routeKey: 'campus-tq-employee-interview-form',
          },
          {
            key: 'campus-tq-meeting-record',
            label: '会议记录表',
            icon: <FileTextOutlined />,
            routeKey: 'campus-tq-meeting-record',
          },
          {
            key: 'campus-tq-homeroom-teacher-standardization',
            label: '班主任标准化检查表',
            icon: <FileTextOutlined />,
            routeKey: 'campus-tq-homeroom-teacher-standardization',
          },
          {
            key: 'campus-tq-homeroom-teacher-daily-work',
            label: '班主任日工单',
            icon: <FileTextOutlined />,
            routeKey: 'campus-tq-homeroom-teacher-daily-work',
          },
          {
            key: 'campus-tq-training-plan-score-detail',
            label: '教化司培训计划与成绩明细表',
            icon: <FileTextOutlined />,
            routeKey: 'campus-tq-training-plan-score-detail',
          },
        ],
      },
      {
        key: 'campus-tq-group-culture',
        label: '企业文化',
        icon: <ShopOutlined />,
        children: [
          {
            key: 'campus-tq-culture-presentation-plan',
            label: '企业文化宣讲计划表',
            icon: <FileTextOutlined />,
            routeKey: 'campus-tq-culture-presentation-plan',
          },
          {
            key: 'campus-tq-culture-exam-score',
            label: '企业文化考试计划表',
            icon: <FileTextOutlined />,
            routeKey: 'campus-tq-culture-exam-score',
          },
        ],
      },
    ],
  },
]

// 神殿主菜单
// 重新定义“神殿”顶级菜单（与最高议事厅平级），仅提供部门分组占位
export const CAMPUS_MENU: MenuItemConfig[] = [
  {
    key: 'campus',
    label: '神殿',
    icon: <HomeOutlined />,
    children: [
      {
        key: 'campus-consulting',
        label: '祈福司',
        icon: <CustomerServiceOutlined />,
        department: 'common',
        children: [
          {
            key: 'campus-consulting-core-data',
            label: '01.核心数据',
            icon: <DatabaseOutlined />,
            children: [
              {
                key: 'campus-consulting-campus-yearly-monthly',
                label: '002神殿祈福司核心业务（月度）数据汇总',
                icon: <AreaChartOutlined />,
                routeKey: 'consult-campus-yearly-monthly-media',
              },
              {
                key: 'campus-consulting-financial-income',
                label: '007神殿祈福司财务收入和退费',
                icon: <DollarOutlined />,
                routeKey: 'consult-mgnt-center-core-data',
              },
            ],
          },
          {
            key: 'campus-consulting-dept-data',
            label: '02.部门数据',
            icon: <DatabaseOutlined />,
            children: [
              {
                key: 'campus-consulting-consultant-data-summary',
                label: '003神殿祈福司个人业务数据汇总',
                icon: <TeamOutlined />,
                routeKey: 'consult-consultant-data-summary-v3',
              },
              {
                key: 'campus-consulting-population-data-summary',
                label: '004神殿各类人群转化数据表',
                icon: <BarChartOutlined />,
                routeKey: 'consult-population-data-summary',
              },
              {
                key: 'campus-consulting-daily-consulting-summary',
                label: '005神殿祈福司前台数据汇总表',
                icon: <FileTextOutlined />,
                routeKey: 'consult-daily-consulting-summary-new',
              },
            ],
          },
          {
            key: 'campus-consulting-recording-system',
            label: '03.录量系统',
            icon: <FormOutlined />,
            children: [
              {
                key: 'campus-consulting-type-count-system',
                label: '咨询量录入系统',
                icon: <FormOutlined />,
                routeKey: 'consult-type-count-system',
              },
              {
                key: 'campus-consulting-daily-consulting-register',
                label: '006神殿每日咨询量登记表',
                icon: <FileTextOutlined />,
                routeKey: 'consult-daily-consulting-register',
              },
              {
                key: 'campus-consulting-my-consultations',
                label: '017我的咨询量',
                icon: <UserOutlined />,
                routeKey: 'consult-my-consultations',
              },
              {
                key: 'campus-consulting-consultation-records',
                label: '018咨询记录',
                icon: <MessageOutlined />,
                routeKey: 'consult-consultation-records',
              },
              {
                key: 'campus-consulting-my-channel-consultations',
                label: '019我的渠道咨询量',
                icon: <TeamOutlined />,
                routeKey: 'consult-my-channel-consultations',
              },
            ],
          },
          {
            key: 'campus-consulting-staff-info',
            label: '04.员工信息',
            icon: <UserOutlined />,
            children: [
              {
                key: 'campus-consulting-hr-basic',
                label: '008前端人力资源基础表（以人资为主）',
                icon: <UserOutlined />,
                routeKey: 'consult-hr-basic-table',
              },
              {
                key: 'campus-consulting-staff-function',
                label: '009员工职数和功能分析（以人资为主）',
                icon: <TeamOutlined />,
                routeKey: 'consult-staff-function',
              },
              {
                key: 'campus-consulting-staffing',
                label: '010咨询和渠道职数（以人资为主）',
                icon: <TeamOutlined />,
                routeKey: 'consult-channel-staffing',
              },
              {
                key: 'campus-consulting-entry-exit',
                label: '011祈福司入职离职汇总表（以人资为主）',
                icon: <FileTextOutlined />,
                routeKey: 'consult-entry-exit-summary',
              },
            ],
          },
          {
            key: 'campus-consulting-mgmt-data',
            label: '05.管理数据',
            icon: <DatabaseOutlined />,
            children: [
              {
                key: 'campus-consulting-mgmt-data-interview',
                label: '012祈福司员工访谈记录表',
                icon: <FileTextOutlined />,
                routeKey: 'consult-staff-interview',
              },
              {
                key: 'campus-consulting-mgmt-data-meeting',
                label: '013祈福司会议记录表',
                icon: <FileTextOutlined />,
                routeKey: 'consult-meeting-record',
              },
              {
                key: 'campus-consulting-mgmt-data-phone-check',
                label: '014电话标准化检查',
                icon: <CheckCircleOutlined />,
                routeKey: 'consult-mgmt-data-phone-check',
              },
              {
                key: 'campus-consulting-mgmt-data-face-to-face-check',
                label: '015当面标准化检查',
                icon: <CheckCircleOutlined />,
                routeKey: 'consult-mgmt-data-face-to-face-check',
              },
            ],
          },
          {
            key: 'campus-consulting-culture-training',
            label: '06.企业文化及培训',
            icon: <ReadOutlined />,
            children: [
              {
                key: 'campus-consulting-culture-training-summary',
                label: '016祈福司培训汇总表',
                icon: <FileTextOutlined />,
                routeKey: 'consult-culture-training-summary',
              },
            ],
          },
        ],
      },
      {
        key: 'campus-academic',
        label: '智慧司',
        icon: <BookOutlined />,
        department: 'academic',  // 智慧司门菜单
        children: CAMPUS_ACADEMIC_MENU[0]?.children || [],
      },
      {
        key: 'campus-teaching-quality',
        label: '教化司',
        icon: <SafetyOutlined />,
        department: 'teaching_quality',  // 教化司门菜单
        children: CAMPUS_TEACHING_QUALITY_MENU[0]?.children || [],
      },
      { key: 'campus-finance', label: '神藏司', icon: <DollarOutlined />, department: 'common' },

    ],
  },
]

// ==================== 测试菜单 ====================
// 测试相关功能菜单
export const TEST_MENU: MenuItemConfig[] = [
  {
    key: 'test-menu',
    label: '测试',
    icon: <SettingOutlined />,
    children: [
      {
        key: 'test-baidu-api',
        label: '百度API测试',
        routeKey: 'baidu-api-test',
      },
      {
        key: 'test-campus-selector',
        label: 'CampusSelector示例',
        routeKey: 'campus-selector-demo',
      },
    ],
  },
]

// ==================== 新增顶级 TEST 菜单（仅 A-teaching-quality/mgnt/campus-level） ====================
// 按需求清空：隐藏顶级 TEST 菜单
export const TEST_TOP_MENU: MenuItemConfig[] = []

// ==================== 合并所有菜单 ====================
export const ALL_MENU_ITEMS: MenuItemConfig[] = [
  ...MANAGEMENT_CENTER_MENU,
  ...CAMPUS_MENU,
  ...TEST_MENU,
  ...TEST_TOP_MENU,
]

// 将 MenuItemConfig 转换为 Ant Design Menu 格式
export const convertToAntMenuItems = (items: MenuItemConfig[]): MenuProps['items'] => {
  return items
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map((item) => {
      // 如果是分组类型，使用 Ant Design 的 group 类型
      if (item.type === 'group') {
        return {
          type: 'group',
          label: item.label,
          key: item.key,
        }
      }

      return {
        key: item.key,
        label: (
          <Tooltip
            placement="right"
            title={typeof item.label === 'string' ? item.label : undefined}
          >
            <span>{item.label}</span>
          </Tooltip>
        ),
        icon: item.icon,
        children: item.children ? convertToAntMenuItems(item.children) : undefined,
      }
    })
}

// 递归查找菜单项
export const findMenuItemByKey = (
  key: string,
  items: MenuItemConfig[] = ALL_MENU_ITEMS,
): MenuItemConfig | null => {
  for (const item of items) {
    if (item.key === key) return item
    if (item.children) {
      const found = findMenuItemByKey(key, item.children)
      if (found) return found
    }
  }
  return null
}

// 生成路由映射（从菜单配置中提取所有 routeKey）
export const generateRouteMap = (
  items: MenuItemConfig[] = ALL_MENU_ITEMS,
  result: Record<string, string> = {},
): Record<string, string> => {
  items.forEach((item) => {
    if (item.routeKey) {
      // 对于 core-data 类型的路由，需要带上 menu 参数
      if (item.menuKey) {
        result[item.key] = `/academic/teaching-content?menu=${item.menuKey}`
      } else {
        result[item.key] = `/${item.routeKey}`
      }
    }
    if (item.children) {
      generateRouteMap(item.children, result)
    }
  })
  return result
}
/**
 * 检查权限是否匹配（支持通配符）
 * @param userPermissions 用户拥有的权限列表
 * @param requiredPermission 需要的权限
 */
const checkPermissionMatch = (userPermissions: string[], requiredPermission: string): boolean => {
  // 完全匹配
  if (userPermissions.includes(requiredPermission)) {
    return true
  }
  
  // 通配符权限 *
  if (userPermissions.includes('*')) {
    return true
  }
  
  // 检查用户权限的通配符匹配
  // 如 user有 academic.* 可以匹配 academic.enterprise_culture.view
  for (const userPerm of userPermissions) {
    if (userPerm.endsWith('.*')) {
      const prefix = userPerm.slice(0, -2)
      if (requiredPermission.startsWith(prefix + '.')) {
        return true
      }
    }
  }
  
  // 检查菜单要求权限的通配符匹配
  // 如菜单需要 academic.enterprise_culture.* 用户有 academic.enterprise_culture.presentation.view 也算有权限
  if (requiredPermission.endsWith('.*')) {
    const prefix = requiredPermission.slice(0, -2)
    for (const userPerm of userPermissions) {
      if (userPerm.startsWith(prefix + '.') || userPerm === prefix) {
        return true
      }
    }
  }
  
  // 向上检查通配符
  const parts = requiredPermission.split('.')
  for (let i = 0; i < parts.length; i++) {
    const wildcard = parts.slice(0, i + 1).join('.') + '.*'
    if (userPermissions.includes(wildcard)) {
      return true
    }
  }
  
  return false
}

/**
 * 根据用户权限过滤菜单项
 * @param items 菜单项列表
 * @param userPermissions 用户拥有的权限列表
 * @param isAdmin 是否是管理员（管理员看到所有菜单）
 */
export const filterMenuByPermissions = (
  items: MenuItemConfig[],
  userPermissions: string[],
  isAdmin: boolean = false
): MenuItemConfig[] => {
  // 管理员看到所有菜单
  if (isAdmin) {
    return items
  }

  // 检查用户是否有 routeKey 风格的直接分配权限（来自权限划分管理页面）
  // routeKey 风格的权限码包含连字符，如 "consult-type-count-system"
  const hasDirectPermissions = userPermissions.some(p => p.includes('-'))
  
  return items
    .map((item) => {
      // 检查当前菜单项是否需要权限（RBAC 点分格式权限）
      if (item.permissions && item.permissions.length > 0) {
        // 需要满足任一权限
        const hasRequiredPermission = item.permissions.some(perm => 
          checkPermissionMatch(userPermissions, perm)
        )
        if (!hasRequiredPermission) {
          // RBAC 权限不通过时，还可以通过 routeKey 直接分配权限放行
          if (item.routeKey && userPermissions.includes(item.routeKey)) {
            // routeKey 在直接分配权限中，放行
          } else {
            return null  // 没有权限，过滤掉
          }
        }
      }

      // 如果用户有直接分配权限，检查叶子菜单的 routeKey 是否被授权
      // 只对没有 permissions 数组的叶子菜单项生效
      if (hasDirectPermissions && !item.permissions && item.routeKey && !item.children) {
        if (!userPermissions.includes(item.routeKey)) {
          return null  // routeKey 不在直接分配权限中，过滤掉
        }
      }
      
      // 如果有子菜单，递归过滤
      if (item.children && item.children.length > 0) {
        const filteredChildren = filterMenuByPermissions(item.children, userPermissions, isAdmin)
        
        // 如果过滤后没有子菜单了，也要检查当前菜单是否有路由
        if (filteredChildren.length === 0 && !item.routeKey) {
          return null  // 没有子菜单且没有自己的路由，过滤掉
        }
        
        return {
          ...item,
          children: filteredChildren.length > 0 ? filteredChildren : undefined,
        }
      }
      
      return item
    })
    .filter((item): item is MenuItemConfig => item !== null)
}

/**
 * 将 MenuItemConfig 转换为 Ant Design Menu 格式（支持权限过滤）
 * @param items 菜单项列表
 * @param userPermissions 用户权限列表（可选，不传则不过滤）
 * @param isAdmin 是否是管理员
 */
export const convertToAntMenuItemsWithPermissions = (
  items: MenuItemConfig[],
  userPermissions: string[] = [],
  isAdmin: boolean = false
): MenuProps['items'] => {
  const filteredItems = filterMenuByPermissions(items, userPermissions, isAdmin)
  return convertToAntMenuItems(filteredItems)
}

/**
 * 根据用户部门过滤菜单
 * @param items 菜单项列表
 * @param userDepartment 用户部门（智慧司、教化司等）
 * @param isAdmin 是否是管理员（管理员可以访问所有菜单）
 * @param userPosition 用户职位（用于职位限制检查）
 * @param parentDepartment 父级菜单的部门（用于继承）
 */
/**
 * 标准化部门名称（去除空格，统一格式）
 */
const normalizeDepartment = (dept: string | null | undefined): string | null => {
  if (!dept) return null
  // 去除前后空格，统一格式
  const normalized = dept.trim()
  return normalized || null
}

export const filterMenuByDepartment = (
  items: MenuItemConfig[],
  userPermissions: string[] = [],
  userDepartment: string | null | undefined,
  isAdmin: boolean = false,
  userPosition?: string | null,
  userCampus?: string | null,
  parentDepartment?: string
): MenuItemConfig[] => {
  // 标准化用户部门
  const normalizedUserDept = normalizeDepartment(userDepartment)
  
  // DEBUG: 打印过滤参数
  console.log('[filterMenuByDepartment] 参数:', { 
    userDepartment, 
    normalizedUserDept,
    isAdmin, 
    userPosition, 
    itemsCount: items.length, 
    parentDepartment 
  })
  
  // 董事长和学术总监可以访问所有内容
  const isTopLevelPosition = userPosition === '董事长' || userPosition === '学术总监'
  if (isTopLevelPosition || isAdmin) {
    console.log('[filterMenuByDepartment] 高级管理员或董事长/学术总监，返回所有菜单')
    return items
  }

  // 没有部门信息，返回所有菜单（向后兼容）
  if (!normalizedUserDept) {
    console.log('[filterMenuByDepartment] 无部门信息，返回所有菜单')
    return items
  }

  return items
    .map((item) => {
      // 确定当前项的部门（优先使用自己的department，否则继承父级）
      const itemDepartment = item.department || parentDepartment
      
      // DEBUG: 打印每个项的部门信息
      console.log(`[filterMenuByDepartment] 处理菜单项: ${item.label}, department: ${item.department}, requiredPositions: ${item.requiredPositions?.join(',')}`)
      
      // 检查职位限制
      if (item.requiredPositions && item.requiredPositions.length > 0) {
        if (!userPosition || !item.requiredPositions.includes(userPosition)) {
          console.log(`  -> ❌ 职位权限不足，过滤掉 ${item.label} (需要: ${item.requiredPositions.join('/')}, 当前: ${userPosition || '无'})`)
          return null
        }
        console.log(`  -> ✅ 职位权限通过: ${userPosition}`)
      }
      
      // 检查当前项是否应该被过滤（在处理children之前检查）
      const hasPermissionOverride = () => {
        if (userPermissions.includes('*')) return true
        if (item.permissions && item.permissions.length > 0) {
          if (item.permissions.some((perm) => checkPermissionMatch(userPermissions, perm))) {
            return true
          }
        }
        if (item.routeKey && userPermissions.includes(item.routeKey)) {
          return true
        }
        return false
      }

      const shouldKeepItem = (dept: string | undefined) => {
        if (hasPermissionOverride()) {
          console.log(`  -> shouldKeepItem: true (权限覆盖)`)
          return true
        }
        if (item.departmentPositionRules && item.departmentPositionRules.length > 0) {
          const matched = matchesDepartmentPositionRule(
            {
              campus: userCampus,
              department: normalizedUserDept,
              position: userPosition,
              rules: item.departmentPositionRules,
            },
          )
          console.log(`  -> shouldKeepItem: ${matched} (部门职位联合规则)`)
          return matched
        }
        if (!dept) {
          console.log(`  -> shouldKeepItem: true (无部门标识)`)
          return true // 没有部门标识，默认保留（向后兼容）
        }
        if (dept === 'common') {
          console.log(`  -> shouldKeepItem: true (common)`)
          return true // common 所有人可访问
        }
        // 使用标准化后的部门名称进行匹配
        if (normalizedUserDept === '智慧司' && (dept === 'academic' || dept === 'common')) {
          console.log(`  -> shouldKeepItem: true (智慧司匹配)`)
          return true
        }
        if (normalizedUserDept === '教化司' && (dept === 'teaching_quality' || dept === 'common')) {
          console.log(`  -> shouldKeepItem: true (教化司匹配)`)
          return true
        }
        console.log(`  -> shouldKeepItem: false (不匹配, userDept: ${normalizedUserDept}, itemDept: ${dept})`)
        return false
      }
      
      // 如果有子菜单，先递归过滤子菜单（重要：先检查子菜单）
      if (item.children && item.children.length > 0) {
        const filteredChildren = filterMenuByDepartment(
          item.children,
          userPermissions,
          normalizedUserDept,
          isAdmin,
          userPosition,
          userCampus,
          itemDepartment,
        )
        
        // 如果过滤后有子菜单，保留父菜单（即使父菜单本身不符合部门要求）
        if (filteredChildren.length > 0) {
          console.log(`[filterMenuByDepartment] ✅ 保留有子菜单的项: ${item.label} (有${filteredChildren.length}个可访问子项)`)
          return {
            ...item,
            children: filteredChildren,
          }
        }
        
        // 如果过滤后没有子菜单，再检查父菜单本身是否应该保留
        if (!shouldKeepItem(itemDepartment)) {
          console.log(`[filterMenuByDepartment] ❌ 过滤掉空父菜单: ${item.label} (无子菜单且不符合部门要求)`)
          return null
        }
        
        // 父菜单本身符合要求但没有子菜单，仍然保留（可能是动态加载子菜单的情况）
        console.log(`[filterMenuByDepartment] ✅ 保留空父菜单: ${item.label} (符合部门要求)`)
        return item
      }
      
      // 叶子节点，检查是否应该保留
      if (!shouldKeepItem(itemDepartment)) {
        console.log(`[filterMenuByDepartment] ❌ 过滤掉叶子: ${item.label} (department: ${itemDepartment})`)
        return null
      }
      
      console.log(`[filterMenuByDepartment] ✅ 保留叶子: ${item.label} (department: ${itemDepartment || '无'})`)
      return item
    })
    .filter((item): item is MenuItemConfig => item !== null)
}

/**
 * 同时应用权限和部门过滤
 * @param items 菜单项列表
 * @param userPermissions 用户权限列表
 * @param userDepartment 用户部门
 * @param isAdmin 是否是管理员
 * @param userPosition 用户职位
 */
export const filterMenuByPermissionsAndDepartment = (
  items: MenuItemConfig[],
  userPermissions: string[] = [],
  userDepartment: string | null | undefined,
  isAdmin: boolean = false,
  userPosition?: string | null,
  userCampus?: string | null,
): MenuItemConfig[] => {
  // 先按权限过滤
  const permissionFiltered = filterMenuByPermissions(items, userPermissions, isAdmin)
  // 再按部门和职位过滤
  return filterMenuByDepartment(permissionFiltered, userPermissions, userDepartment, isAdmin, userPosition, userCampus)
}

/**
 * 根据权限和部门过滤菜单，并转换为Ant Design Menu格式
 * @param items 菜单项列表
 * @param userPermissions 用户权限列表
 * @param userDepartment 用户部门
 * @param isAdmin 是否是管理员
 * @param userPosition 用户职位
 */
export const convertToAntMenuItemsWithPermissionsAndDepartment = (
  items: MenuItemConfig[],
  userPermissions: string[] = [],
  userDepartment: string | null | undefined,
  isAdmin: boolean = false,
  userPosition?: string | null,
  userCampus?: string | null,
): MenuProps['items'] => {
  // 按权限和部门过滤
  const filteredItems = filterMenuByPermissionsAndDepartment(items, userPermissions, userDepartment, isAdmin, userPosition, userCampus)
  // 转换为Ant Design Menu格式
  return convertToAntMenuItems(filteredItems)
}
