/**
 * Core-data 组件映射配置
 * 定义通过 /academic/teaching-content?menu=xxx 访问的组件
 *
 * 注意：此文件仅保留当前菜单中实际绑定的路由组件
 * 如需添加新的组件映射，请同时更新 menuItems.tsx 中的菜单配置
 */
import { lazy } from 'react'

// 学术->最高议事厅 14张表（与菜单绑定）
export const MANAGEMENT_CENTER_COMPONENTS = {
  'mgmt-core-summary': lazy(() => import('../../pages/academic/mgnt/1-core-summary/index')),
  'mgmt-employment-summary': lazy(
    () => import('../../pages/academic/mgnt/2-employment-summary/index'),
  ),
  'mgmt-enrollment-summary': lazy(
    () => import('../../pages/academic/mgnt/3-enrollment-summary/index'),
  ),
  'mgmt-student-stability': lazy(
    () => import('../../pages/academic/mgnt/4-student-stability/index'),
  ),
  'mgmt-teacher-staffing': lazy(
    () => import('../../pages/academic/mgnt/5-teacher-staffing-ratio/index'),
  ),
  'mgmt-onboarding-offboarding': lazy(
    () => import('../../pages/academic/mgnt/6-onboarding-offboarding/index'),
  ),
  'mgmt-training-summary': lazy(() => import('../../pages/academic/mgnt/7-training-summary/index')),
  'mgmt-manager-analysis': lazy(
    () => import('../../pages/academic/mgnt/8-manager-analysis/index'),
  ),
  'mgmt-network-survey': lazy(() => import('../../pages/academic/mgnt/9-network-survey/index')),
  'mgmt-enterprise-survey': lazy(
    () => import('../../pages/academic/mgnt/10-enterprise-survey/index'),
  ),
  'mgmt-position-analysis': lazy(
    () => import('../../pages/academic/mgnt/11-position-analysis/index'),
  ),
  'mgmt-courseware-writing': lazy(
    () => import('../../pages/academic/mgnt/12-courseware-writing/index'),
  ),
  'mgmt-questionbank-writing': lazy(
    () => import('../../pages/academic/mgnt/13-questionbank-writing/index'),
  ),
  'mgmt-manager-evaluation': lazy(
    () => import('../../pages/academic/mgnt/14-manager-evaluation/index'),
  ),
} as const

// 神殿->智慧司（与菜单绑定）
export const CAMPUS_COMPONENTS = {
  'campus-core-data-summary': lazy(
    () =>
      import(
        '../../pages/academic/campus/01-core-data/1-core-data-summary/AllCampusCoreBusiness.tsx'
      ),
  ),
} as const

// 合并所有 core-data 组件
export const ALL_CORE_DATA_COMPONENTS = {
  ...MANAGEMENT_CENTER_COMPONENTS,
  ...CAMPUS_COMPONENTS,
} as const

export type CoreDataComponentKey = keyof typeof ALL_CORE_DATA_COMPONENTS
