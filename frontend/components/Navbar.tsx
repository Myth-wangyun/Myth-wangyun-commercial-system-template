import React, { useState, useMemo, useEffect } from 'react'
import {
  Layout,
  Select,
  Input,
  Button,
  Space,
  Typography,
  Avatar,
  Dropdown,
  Badge,
  App,
} from 'antd'
import type { MenuProps } from 'antd'
import {
  SearchOutlined,
  MenuOutlined,
  UserOutlined,
  HomeOutlined,
  InfoCircleOutlined,
  ContactsOutlined,
  LogoutOutlined,
  KeyOutlined,
  UserAddOutlined,
  SettingOutlined,
  DatabaseOutlined,
  AuditOutlined,
  TeamOutlined,
  SafetyOutlined,
  CrownOutlined,
} from '@ant-design/icons'
import { useCampusStore } from '@/stores/campusStore'
import { useAppStore } from '../stores/appStore'
import { useAuthStore } from '../stores/authStore'
import { useNavigate, useLocation } from 'react-router-dom'
import { ALL_MENU_ITEMS, type MenuItemConfig } from '@/config/ui/menuItems'
import { generateRouteMap } from '@/config/ui/menuRoutes'
const ChangePasswordModal = React.lazy(() => import('./ChangePasswordModal'))
const AddUserModal = React.lazy(() => import('./AddUserModal'))
import {
  getApprovalReminderSummary,
  subscribeApprovalReminderSummary,
} from '@/services/approvalCenter'
import { normalizeCampusSelectionName } from '@/stores/campusStore'

const { Header } = Layout
const { Option } = Select
const { Text } = Typography

const Navbar: React.FC = () => {
  const { message, modal } = App.useApp()
  const { currentCampus, setCampus, getAllCampuses, getFilteredCampuses } = useCampusStore()
  const { searchTerm, setSearchTerm, toggleSidebar } = useAppStore()
  const { user, logout, accessibleCampuses, campusRestricted } = useAuthStore()

  // 根据用户权限获取可访问的神殿列表
  const campuses =
    campusRestricted && accessibleCampuses.length > 0
      ? getFilteredCampuses(accessibleCampuses)
      : getAllCampuses()

  const navigate = useNavigate()
  const location = useLocation()
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false)
  const [addUserModalOpen, setAddUserModalOpen] = useState(false)
  const [pendingApprovalCount, setPendingApprovalCount] = useState(0)
  const [approvalNotificationCount, setApprovalNotificationCount] = useState(0)

  const loadPendingApprovalCount = React.useCallback(async () => {
    if (!user) {
      setPendingApprovalCount(0)
      return
    }
    try {
      const summary = await getApprovalReminderSummary()
      setPendingApprovalCount(summary.total)
      setApprovalNotificationCount(summary.notificationCount)
    } catch (error) {
      console.error('加载待审批数量失败', error)
    }
  }, [user])

  // 当用户有神殿限制且当前选择的神殿不在可访问列表中时，自动切换到第一个可访问的神殿
  useEffect(() => {
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

  useEffect(() => {
    loadPendingApprovalCount()
  }, [loadPendingApprovalCount])

  useEffect(() => {
    const handleApprovalUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<{ total?: number; notificationCount?: number }>
      if (typeof customEvent.detail?.total === 'number') {
        setPendingApprovalCount(customEvent.detail.total)
        if (typeof customEvent.detail?.notificationCount === 'number') {
          setApprovalNotificationCount(customEvent.detail.notificationCount)
        }
      } else {
        loadPendingApprovalCount()
      }
    }

    const unsubscribe = subscribeApprovalReminderSummary(
      (summary) => {
        setPendingApprovalCount(summary.total)
        setApprovalNotificationCount(summary.notificationCount)
      },
      () => loadPendingApprovalCount(),
    )

    window.addEventListener('approval-center:updated', handleApprovalUpdated)

    return () => {
      unsubscribe()
      window.removeEventListener('approval-center:updated', handleApprovalUpdated)
    }
  }, [loadPendingApprovalCount])

  useEffect(() => {
    if (!user) return
    const promptKey = `approval-center-prompt:${user.id}`
    const attentionTotal = pendingApprovalCount + approvalNotificationCount
    if (attentionTotal <= 0) {
      sessionStorage.removeItem(promptKey)
      return
    }
    const promptedCount = Number(sessionStorage.getItem(promptKey) || '0')
    if (promptedCount >= attentionTotal) return

    sessionStorage.setItem(promptKey, String(attentionTotal))
    const segments = []
    if (pendingApprovalCount > 0) {
      segments.push(`${pendingApprovalCount} 项待审批`)
    }
    if (approvalNotificationCount > 0) {
      segments.push(`${approvalNotificationCount} 条审批通知`)
    }
    modal.confirm({
      title: '审批提醒',
      content: `你当前有 ${segments.join('，')}，建议立即处理。`,
      okText: '去审批',
      cancelText: '稍后处理',
      onOk: () => navigate('/approvals'),
    })
  }, [approvalNotificationCount, navigate, pendingApprovalCount, user])

  // 只有 wangzexi 用户且在开发模式下可以添加用户
  const canAddUser = useMemo(
    () => import.meta.env.DEV && user?.username === 'wangzexi',
    [user?.username],
  )

  const routeMap = React.useMemo(
    () => ({
      campuses: '/',
      ...generateRouteMap(),
    }),
    [],
  )

  const flattenMenu = React.useCallback(
    (items: MenuItemConfig[]): Array<{ key: string; label: string }> => {
      const result: Array<{ key: string; label: string }> = []
      items.forEach((item) => {
        if (!item) return
        let labelText = ''
        if (typeof item.label === 'string') {
          labelText = item.label
        } else if (React.isValidElement(item.label)) {
          const element = item.label as React.ReactElement<{ children?: React.ReactNode }>
          if (typeof element.props?.children === 'string') {
            labelText = element.props.children
          }
        }
        if (item.key && labelText && routeMap[item.key]) {
          result.push({ key: item.key, label: labelText })
        }
        if (item.children?.length) {
          result.push(...flattenMenu(item.children))
        }
      })
      return result
    },
    [routeMap],
  )

  const menuEntries = React.useMemo(() => {
    const entries = flattenMenu(ALL_MENU_ITEMS)
    return [
      { key: 'campuses', label: '神殿信息' },
      ...entries.map((entry, index) => ({
        ...entry,
        key: entry.key || `menu-entry-${index}`,
      })),
    ]
  }, [flattenMenu])

  const handleCampusChange = (value: string) => {
    setCampus(value)
  }

  const handleLogout = async () => {
    await logout()
    window.location.href = '/login'
  }

  const handleSearchSubmit = (value?: string) => {
    const keyword = (value ?? searchTerm).trim()
    if (!keyword) {
      message.info('请输入要搜索的模块名称')
      return
    }
    const matcher = keyword.toLowerCase()
    const match = menuEntries.find((entry) => entry.label.toLowerCase().includes(matcher))
    if (!match) {
      message.warning('未找到匹配的功能模块')
      return
    }
    const route = routeMap[match.key]
    if (!route) {
      message.warning('该模块尚未配置路由')
      return
    }
    if (route === location.pathname) {
      // 重新导航以触发刷新
      navigate(route, { replace: true })
    } else {
      navigate(route)
    }
  }

  const handleHomeClick = () => {
    const target = '/logs'
    if (location.pathname === target) {
      navigate(target, { replace: true })
    } else {
      navigate(target)
    }
  }

  const handleUserMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'logout') {
      handleLogout()
    } else if (key === 'change-password') {
      setChangePasswordModalOpen(true)
    } else if (key === 'add-user') {
      setAddUserModalOpen(true)
    } else if (key === 'approval-center') {
      navigate('/approvals')
    }
  }

  const userMenuItems: MenuProps['items'] = useMemo(() => {
    const attentionTotal = pendingApprovalCount + approvalNotificationCount
    const items: MenuProps['items'] = [
      {
        key: 'approval-center',
        icon: <AuditOutlined />,
        label: (
          <Space>
            <span>审批中心</span>
            {attentionTotal > 0 ? <Badge count={attentionTotal} size="small" /> : null}
          </Space>
        ),
      },
      {
        key: 'profile',
        icon: <UserOutlined />,
        label: '个人资料',
      },
      {
        key: 'change-password',
        icon: <KeyOutlined />,
        label: '修改密码',
      },
    ]

    // 只有 wangzexi 用户可以看到添加用户选项
    if (canAddUser) {
      items.push({
        key: 'add-user',
        icon: <UserAddOutlined />,
        label: '添加用户',
      })
    }

    items.push(
      {
        key: 'settings',
        icon: <InfoCircleOutlined />,
        label: '设置',
      },
      {
        type: 'divider',
      },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: '退出登录',
      },
    )

    return items
  }, [approvalNotificationCount, canAddUser, pendingApprovalCount])

  const userMenu: MenuProps = {
    items: userMenuItems,
    onClick: handleUserMenuClick,
  }
  const attentionTotal = pendingApprovalCount + approvalNotificationCount

  const configMenuItems: MenuProps['items'] = [
    {
      key: 'config-master',
      icon: <DatabaseOutlined />,
      label: '神殿/班级配置',
    },
    {
      key: 'config-employee',
      icon: <TeamOutlined />,
      label: '员工管理',
    },
    {
      key: 'config-media-source',
      icon: <DatabaseOutlined />,
      label: '咨询配置',
    },
    {
      key: 'config-permission',
      icon: <SafetyOutlined />,
      label: '权限划分',
    },
  ]

  const configPathMap: Record<string, string> = {
    'config-master': '/system/config/master-data',
    'config-employee': '/system/config/employee-manage',
    'config-media-source': '/system/config/media-source',
    'config-permission': '/system/config/permission',
  }

  const handleConfigMenuClick: MenuProps['onClick'] = ({ key }) => {
    const path = configPathMap[key]
    if (path) navigate(path)
  }

  const configMenu: MenuProps = {
    items: configMenuItems,
    onClick: handleConfigMenuClick,
  }

  return (
    <Header className="layout-header" style={{ padding: '0 24px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '100%',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Button
            type="text"
            icon={<MenuOutlined />}
            onClick={toggleSidebar}
            style={{ color: 'white' }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fas fa-graduation-cap" style={{ color: 'white', fontSize: '20px' }}></i>
            <Text style={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}>诸神殿</Text>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fas fa-building" style={{ color: 'white' }}></i>
            <Text style={{ color: 'white', fontSize: '14px' }}>神殿:</Text>
            <Select
              value={currentCampus}
              onChange={handleCampusChange}
              placeholder="请选择神殿"
              style={{ width: 140 }}
              size="small"
            >
              {campuses.map((campus) => (
                <Option key={campus.id} value={campus.name}>
                  {campus.name}
                </Option>
              ))}
            </Select>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Input
            placeholder="搜索功能模块..."
            prefix={<SearchOutlined />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onPressEnter={(e) => handleSearchSubmit(e.currentTarget.value)}
            allowClear
            style={{ width: 250 }}
            size="small"
          />

          <Space size="middle" style={{ color: 'white' }}>
            <Button
              type="text"
              icon={<HomeOutlined />}
              style={{ color: 'white' }}
              onClick={handleHomeClick}
            >
              历史记录
            </Button>
            <Dropdown menu={configMenu} placement="bottomRight">
              <Button type="text" icon={<SettingOutlined />} style={{ color: 'white' }}>
                配置
              </Button>
            </Dropdown>
            <Button type="text" icon={<ContactsOutlined />} style={{ color: 'white' }}>
              联系
            </Button>

            <Badge count={attentionTotal} size="small">
              <Button
                type="text"
                icon={<AuditOutlined />}
                style={{ color: 'white' }}
                onClick={() => navigate('/approvals')}
              >
                审批中心
              </Button>
            </Badge>

            <Button
              type="text"
              icon={<CrownOutlined />}
              style={{ color: '#ffd700' }}
              onClick={() => navigate('/god-temple')}
              title="诸神殿"
            >
              诸神殿
            </Button>

            <Button
              type="link"
              size="small"
              icon={<DatabaseOutlined />}
              onClick={() => navigate('/raw-data')}
              style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}
            >
              原始
            </Button>

            <Dropdown menu={userMenu} placement="bottomRight">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <Badge dot={attentionTotal > 0}>
                  <Avatar size="small" icon={<UserOutlined />} />
                </Badge>
                <Text style={{ color: 'white', fontSize: '14px' }}>{user?.name || 'admin'}</Text>
              </div>
            </Dropdown>
          </Space>
        </div>
      </div>

      {changePasswordModalOpen && (
        <React.Suspense fallback={null}>
          <ChangePasswordModal
            open={changePasswordModalOpen}
            onCancel={() => setChangePasswordModalOpen(false)}
          />
        </React.Suspense>
      )}

      {addUserModalOpen && (
        <React.Suspense fallback={null}>
          <AddUserModal open={addUserModalOpen} onCancel={() => setAddUserModalOpen(false)} />
        </React.Suspense>
      )}
    </Header>
  )
}

export default Navbar
