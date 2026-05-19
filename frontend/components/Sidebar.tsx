import React, { useEffect } from 'react'
import { Layout, Menu, Button, type MenuProps } from 'antd'
import { useLocation, useNavigate } from 'react-router-dom'
import { BankOutlined, MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons'
import { useAppStore } from '../stores/appStore'
import { useAuthStore } from '../stores/authStore'
import { convertToAntMenuItemsWithPermissionsAndDepartment, ALL_MENU_ITEMS } from '../config/ui/menuItems'
import { generateRouteMap } from '../config/ui/menuRoutes'
import { printDiagnosis } from '../utils/diagnoseMenuAccess'

const { Sider } = Layout

const Sidebar: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { sidebarCollapsed, toggleSidebar } = useAppStore()
  const { permissions, permissionsLoaded, fetchPermissions, user, isAuthenticated } = useAuthStore()

  // 首次加载或登录后获取权限
  useEffect(() => {
    if (isAuthenticated && !permissionsLoaded) {
      fetchPermissions()
    }
  }, [isAuthenticated, permissionsLoaded, fetchPermissions])

  // 判断是否是管理员
  const isAdmin = user?.role === 'admin'

  // 获取用户的部门和职位
  const userDepartment = user?.department
  const userPosition = user?.position
  const userCampus = user?.campus
  
  // DEBUG: 打印用户部门信息和诊断
  useEffect(() => {
    console.log('[Sidebar] 用户信息:', {
      name: user?.name,
      role: user?.role,
      department: userDepartment,
      position: userPosition,
      isAdmin
    })
    
    // 如果用户已登录，执行诊断
    if (user && userDepartment !== undefined) {
      printDiagnosis(userDepartment, userPosition, isAdmin)
    }
  }, [user, userDepartment, userPosition, isAdmin])

  // 路由映射（完全由配置生成）
  const routeMap: Record<string, string> = React.useMemo(
    () => ({
      campuses: '/', // 神殿信息首页
      ...generateRouteMap(),
    }),
    [],
  )

  // 根据用户权限和部门过滤菜单
  const menuItems = React.useMemo<MenuProps['items']>(
    () => [
      { key: 'campuses', icon: <BankOutlined />, label: '神殿信息' },
      ...convertToAntMenuItemsWithPermissionsAndDepartment(ALL_MENU_ITEMS, permissions, userDepartment, isAdmin, userPosition, userCampus),
    ],
    [permissions, isAdmin, userDepartment, userPosition, userCampus],
  )

  const handleMenuClick = ({ key }: { key: string }) => {
    // 对于未绑定路由的菜单项或分组，不进行导航
    const route = routeMap[key]
    if (!route) return

    // 添加唯一 state，确保同路径也会触发刷新
    navigate(route, {
      state: {
        navigationKey: `${key}-${Date.now()}`,
        from: location.pathname,
      },
    })
  }

  const getSelectedKeys = () => {
    const full = `${location.pathname}${location.search || ''}`
    const exact = (Object.entries(routeMap) as Array<[string, string]>).find(([, p]) => p === full)
    if (exact) return [exact[0]]
    const loose = (Object.entries(routeMap) as Array<[string, string]>).find(
      ([, p]) => (p || '').split('?')[0] === location.pathname,
    )
    if (loose) return [loose[0]]
    if (location.pathname === '/') return ['campuses']
    return []
  }

  return (
    <Sider
      width={256}
      collapsible
      collapsed={sidebarCollapsed}
      trigger={null}
      className="layout-sider"
      style={{
        background: '#fff',
        borderRight: '1px solid #f0f0f0',
        position: 'sticky',
        top: 0,
        height: '100vh',
        alignSelf: 'flex-start',
      }}
    >
      <style>{`
        .layout-sider {
          display: flex;
          flex-direction: column;
        }
        .layout-sider .ant-layout-sider-children {
          display: flex;
          flex-direction: column;
          height: 100%;
          overflow: hidden;
        }
        .layout-sider .ant-menu {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          border-right: 0;
        }
        /* 第4级：左移18px + 收紧内边距 + 略降字号 + 压缩图标空隙 */
        .layout-sider .ant-menu-inline .ant-menu-sub .ant-menu-sub .ant-menu-sub .ant-menu-item,
        .layout-sider .ant-menu-inline .ant-menu-sub .ant-menu-sub .ant-menu-sub .ant-menu-submenu-title {
          margin-inline-start: -18px;             /* 负缩进 */
          padding-inline-start: 8px !important;   /* 左内边距最小化 */
          padding-inline-end: 8px !important;     /* 右内边距最小化 */
          height: auto;                           /* 行高自适应 */
          line-height: 20px;
        }
        .layout-sider .ant-menu-inline .ant-menu-sub .ant-menu-sub .ant-menu-sub .ant-menu-title-content {
          font-size: 13px;                        /* 降低字号，提升有效宽度 */
        }
        .layout-sider .ant-menu-inline .ant-menu-sub .ant-menu-sub .ant-menu-sub .ant-menu-item .ant-menu-item-icon,
        .layout-sider .ant-menu-inline .ant-menu-sub .ant-menu-sub .ant-menu-sub .ant-menu-submenu-title .ant-menu-item-icon {
          margin-inline-end: 6px;                 /* 压缩图标与文字间距 */
        }
      `}</style>
      <div style={{ padding: '16px 8px', borderBottom: '1px solid #f0f0f0' }}>
        <Button
          type="text"
          icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={toggleSidebar}
          style={{ width: '100%' }}
        />
      </div>
      <Menu
        mode="inline"
        selectedKeys={getSelectedKeys()}
        onClick={handleMenuClick}
        defaultOpenKeys={['campus']}
        items={menuItems}
      />
    </Sider>
  )
}

export default Sidebar
