/**
 * 核心数据功能标签栏组件
 * 用于在核心数据相关页面之间导航，或在单页内切换视图
 */

import React from 'react'
import { Card, Tabs } from 'antd'
import { useNavigate, useLocation } from 'react-router-dom'
import { useCampusStore } from '@/stores/campusStore'

export interface CoreDataTabsProps {
  /**
   * 在单页模式下，外部控制当前激活的 Tab key
   * 如果未提供，则根据当前路由自动推断
   */
  activeKeyOverride?: string
  /**
   * 在单页模式下，点击 Tab 的回调
   * 提供后会在内部优先触发
   */
  onTabChange?: (key: string) => void
  /**
   * 是否禁用路由跳转，仅用于单页模式
   * 默认启用路由跳转（兼容旧用法）
   */
  disableRouteNav?: boolean
}

const CoreDataTabs: React.FC<CoreDataTabsProps> = ({
  activeKeyOverride,
  onTabChange,
  disableRouteNav,
}) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { currentCampus } = useCampusStore()

  const coreLabel = currentCampus ? `${currentCampus}教质累计核心数据` : '核心数据'

  // 处理标签点击 - 跳转到对应汇总页面或交给上层处理
  const handleTabClick = (key: string) => {
    if (onTabChange) {
      onTabChange(key)
    }
    if (disableRouteNav) {
      return
    }

    const routeMap: Record<string, string> = {
      'core-data': '/academic/campus/core-data-summary',
      employment: '/campus/employment-summary',
      contract: '/campus/contract-summary',
      reputation: '/campus/reputation-summary',
      stability: '/campus/stability-summary',
      promotion: '/campus/promotion-summary',
      fluctuation: '/campus/fluctuation-summary',
      dormitory: '/campus/dormitory-summary',
      enrollment: '/campus/enrollment-summary',
    }

    const route = routeMap[key]
    if (route) {
      navigate(route)
    }
  }

  // 根据当前路径确定激活的标签
  const getActiveKey = () => {
    if (activeKeyOverride) {
      return activeKeyOverride
    }

    const pathToKeyMap: Record<string, string> = {
      '/academic/campus/core-data-summary': 'core-data',
      '/campus/employment-summary': 'employment',
      '/campus/contract-summary': 'contract',
      '/campus/reputation-summary': 'reputation',
      '/campus/stability-summary': 'stability',
      '/campus/promotion-summary': 'promotion',
      '/campus/fluctuation-summary': 'fluctuation',
      '/campus/dormitory-summary': 'dormitory',
      '/campus/enrollment-summary': 'enrollment',
    }

    return pathToKeyMap[location.pathname] || 'core-data'
  }

  // 定义标签项
  const tabItems = [
    {
      key: 'core-data',
      label: coreLabel,
    },
    {
      key: 'employment',
      label: '就业目标与结果汇总表',
    },
    {
      key: 'contract',
      label: '企业签约',
    },
    {
      key: 'reputation',
      label: '口碑统计',
    },
    {
      key: 'stability',
      label: '新生维稳',
    },
    {
      key: 'promotion',
      label: '升学',
    },
    {
      key: 'fluctuation',
      label: '异动',
    },
    {
      key: 'dormitory',
      label: '宿舍管理',
    },
    {
      key: 'enrollment',
      label: '学籍管理',
    },
  ]

  return (
    <div style={{ marginBottom: 24 }}>
      <Card style={{ backgroundColor: '#fff' }}>
        <Tabs
          activeKey={getActiveKey()}
          type="card"
          size="large"
          items={tabItems}
          onTabClick={handleTabClick}
        />
      </Card>
    </div>
  )
}

export default CoreDataTabs
