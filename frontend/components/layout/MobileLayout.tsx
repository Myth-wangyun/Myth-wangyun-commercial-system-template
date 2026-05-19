/**
 * 移动端布局组件
 *
 * 为手机端提供简化的顶栏 + 内容区布局，
 * 不渲染侧边栏，用底部 Tab 或汉堡菜单替代。
 */
import React, { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Select, Drawer, Button, Typography, Divider } from 'antd'
import {
  MenuOutlined,
  FormOutlined,
  HomeOutlined,
  UserOutlined,
  LogoutOutlined,
  BarChartOutlined,
  TeamOutlined,
  BellOutlined,
  FileTextOutlined,
  DesktopOutlined,
  RightOutlined,
} from '@ant-design/icons'
import { useCampusStore } from '@/stores/campusStore'
import { normalizeCampusSelectionName } from '@/stores/campusStore'
import { useAuthStore } from '@/stores/authStore'

import './MobileLayout.css'

// 移动端调试工具
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  import('vconsole').then((VConsole) => {
    new VConsole.default()
  })
}

const { Header, Content } = Layout
const { Text } = Typography

const MobileLayout: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const {
    currentCampus,
    setCampus,
    loadCampusesFromConfig,
    getAllCampuses,
    getFilteredCampuses,
  } = useCampusStore()
  const { user, logout, accessibleCampuses, campusRestricted } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  React.useEffect(() => {
    loadCampusesFromConfig()
  }, [loadCampusesFromConfig])

  const campuses =
    campusRestricted && accessibleCampuses.length > 0
      ? getFilteredCampuses(accessibleCampuses)
      : getAllCampuses()

  React.useEffect(() => {
    if (campusRestricted && accessibleCampuses.length > 0) {
      const campusNames = campuses.map((campus) => campus.name)
      const normalizedCurrentCampus = normalizeCampusSelectionName(currentCampus, campusNames)
      const normalizedAccessibleCampuses = accessibleCampuses.map((campus) =>
        normalizeCampusSelectionName(campus, campusNames),
      )
      if (!normalizedCurrentCampus || !normalizedAccessibleCampuses.includes(normalizedCurrentCampus)) {
        setCampus(accessibleCampuses[0])
      }
    }
  }, [accessibleCampuses, campusRestricted, campuses, currentCampus, setCampus])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleSwitchDesktop = () => {
    window.location.href = '/?force_desktop=1'
  }

  // 底部导航项
  const bottomTabs = [
    { key: '/m', icon: <HomeOutlined />, label: '首页', exact: true },
    { key: '/m/consult', icon: <FormOutlined />, label: '咨询' },
    { key: '/m/stats', icon: <BarChartOutlined />, label: '数据' },
    { key: '/m/me', icon: <UserOutlined />, label: '我的', exact: true },
  ]

  const activeTab = (() => {
    const path = location.pathname
    // 精确匹配优先
    const exact = bottomTabs.find((t) => t.exact && path === t.key)
    if (exact) return exact.key
    // 前缀匹配
    const prefix = bottomTabs.filter((t) => !t.exact && path.startsWith(t.key))
    // 取最长匹配
    if (prefix.length > 0) {
      return prefix.sort((a, b) => b.key.length - a.key.length)[0].key
    }
    return '/m'
  })()

  // 抽屉菜单项
  const drawerMenuGroups = [
    {
      title: '常用功能',
      items: [
        { icon: <HomeOutlined />, title: '首页', path: '/m' },
        { icon: <FormOutlined />, title: '咨询量录入', path: '/m/consult' },
        { icon: <BarChartOutlined />, title: '数据统计', path: '/m/stats' },
        { icon: <TeamOutlined />, title: '人员管理', path: '/m/staff' },
      ],
    },
    {
      title: '更多功能',
      items: [
        { icon: <BellOutlined />, title: '通知公告', path: '/m/notifications' },
        { icon: <FileTextOutlined />, title: '审批中心', path: '/m/approvals' },
      ],
    },
  ]

  return (
    <Layout className="mobile-layout">
      {/* 顶栏 */}
      <Header className="mobile-header">
        <div className="mobile-header-left">
          <Button
            type="text"
            icon={<MenuOutlined />}
            onClick={() => setDrawerOpen(true)}
            className="mobile-menu-btn"
          />
          <Text strong className="mobile-title">
            诸神殿
          </Text>
        </div>
        <div className="mobile-header-right">
          <Select
            value={currentCampus || undefined}
            onChange={setCampus}
            size="small"
            className="mobile-campus-select"
            popupMatchSelectWidth={false}
            placeholder="选神殿"
          >
            {campuses.map((c) => (
              <Select.Option key={c.id} value={c.name}>
                {c.name}
              </Select.Option>
            ))}
          </Select>
        </div>
      </Header>

      {/* 内容区 */}
      <Content className="mobile-content">
        <Outlet />
      </Content>

      {/* 底部 Tab 栏 */}
      <div className="mobile-bottom-tabs">
        {bottomTabs.map((tab) => (
          <div
            key={tab.key}
            className={`mobile-tab-item ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => navigate(tab.key)}
          >
            <span className="mobile-tab-icon">{tab.icon}</span>
            <span className="mobile-tab-label">{tab.label}</span>
          </div>
        ))}
      </div>

      {/* 侧边抽屉菜单 */}
      <Drawer
        title={null}
        placement="left"
        width={280}
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        className="mobile-drawer"
        closable={false}
      >
        {/* 用户信息头部 */}
        <div className="mobile-drawer-user">
          <div className="mobile-drawer-avatar">
            <UserOutlined />
          </div>
          <div className="mobile-drawer-user-info">
            <Text strong style={{ fontSize: 16, color: '#fff' }}>
              {user?.name || '用户'}
            </Text>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>
              {user?.department || ''} {user?.position || ''}
            </Text>
          </div>
        </div>

        {/* 神殿选择（抽屉中也提供） */}
        <div className="mobile-drawer-campus">
          <Text type="secondary" style={{ fontSize: 12 }}>
            当前神殿
          </Text>
          <Select
            value={currentCampus || undefined}
            onChange={setCampus}
            size="small"
            style={{ width: '100%', marginTop: 4 }}
            placeholder="选择神殿"
          >
            {campuses.map((c) => (
              <Select.Option key={c.id} value={c.name}>
                {c.name}
              </Select.Option>
            ))}
          </Select>
        </div>

        {/* 功能菜单 */}
        {drawerMenuGroups.map((group, gIdx) => (
          <div key={gIdx} className="mobile-drawer-group">
            <div className="mobile-drawer-group-title">{group.title}</div>
            {group.items.map((item, idx) => (
              <div
                key={idx}
                className={`mobile-drawer-item ${location.pathname === item.path ? 'active' : ''}`}
                onClick={() => {
                  navigate(item.path)
                  setDrawerOpen(false)
                }}
              >
                <span className="mobile-drawer-item-icon">{item.icon}</span>
                <span className="mobile-drawer-item-title">{item.title}</span>
                <RightOutlined className="mobile-drawer-item-arrow" />
              </div>
            ))}
          </div>
        ))}

        <Divider style={{ margin: '12px 0' }} />

        {/* 底部操作 */}
        <div className="mobile-drawer-actions">
          <div className="mobile-drawer-item" onClick={handleSwitchDesktop}>
            <span className="mobile-drawer-item-icon">
              <DesktopOutlined />
            </span>
            <span className="mobile-drawer-item-title">切换桌面版</span>
            <RightOutlined className="mobile-drawer-item-arrow" />
          </div>
          <div className="mobile-drawer-item danger" onClick={handleLogout}>
            <span className="mobile-drawer-item-icon">
              <LogoutOutlined />
            </span>
            <span className="mobile-drawer-item-title">退出登录</span>
          </div>
        </div>
      </Drawer>
    </Layout>
  )
}

export default MobileLayout
