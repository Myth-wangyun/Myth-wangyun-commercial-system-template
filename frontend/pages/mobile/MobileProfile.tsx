/**
 * 移动端个人中心页
 */
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Typography, Avatar } from 'antd'
import {
  UserOutlined,
  LogoutOutlined,
  DesktopOutlined,
  InfoCircleOutlined,
  BellOutlined,
  AuditOutlined,
  BarChartOutlined,
  TeamOutlined,
  FormOutlined,
  RightOutlined,
} from '@ant-design/icons'
import { useAuthStore } from '@/stores/authStore'
import { useCampusStore } from '@/stores/campusStore'
import './MobileProfile.css'

const { Title, Text } = Typography

const MobileProfile: React.FC = () => {
  const { user, logout } = useAuthStore()
  const { currentCampus } = useCampusStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleSwitchToDesktop = () => {
    window.location.href = '/?force_desktop=1'
  }

  const functionItems = [
    {
      icon: <FormOutlined />,
      title: '咨询量录入',
      onClick: () => navigate('/m/consult'),
    },
    {
      icon: <BarChartOutlined />,
      title: '数据统计',
      onClick: () => navigate('/m/stats'),
    },
    {
      icon: <TeamOutlined />,
      title: '人员管理',
      onClick: () => navigate('/m/staff'),
    },
    {
      icon: <BellOutlined />,
      title: '通知公告',
      onClick: () => navigate('/m/notifications'),
    },
    {
      icon: <AuditOutlined />,
      title: '审批中心',
      onClick: () => navigate('/m/approvals'),
    },
  ]

  const settingItems = [
    {
      icon: <DesktopOutlined />,
      title: '切换到桌面版',
      onClick: handleSwitchToDesktop,
    },
    {
      icon: <InfoCircleOutlined />,
      title: '关于系统',
      onClick: () => {},
    },
  ]

  return (
    <div className="m-profile">
      {/* 用户信息卡 */}
      <div className="m-profile-header">
        <Avatar size={64} icon={<UserOutlined />} className="m-profile-avatar" />
        <Title level={4} style={{ marginTop: 12, marginBottom: 2, color: '#fff' }}>
          {user?.name || '未登录'}
        </Title>
        <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>
          {user?.department || ''} {user?.position || ''}
        </Text>
        {currentCampus && (
          <Text
            style={{
              color: 'rgba(255,255,255,0.65)',
              fontSize: 12,
              display: 'block',
              marginTop: 4,
            }}
          >
            当前神殿：{currentCampus}
          </Text>
        )}
      </div>

      {/* 功能菜单 */}
      <div className="m-profile-menu">
        {functionItems.map((item, idx) => (
          <div key={idx} className="m-profile-menu-item" onClick={item.onClick}>
            <span className="m-profile-menu-icon">{item.icon}</span>
            <span className="m-profile-menu-title">{item.title}</span>
            <span className="m-profile-menu-arrow">
              <RightOutlined />
            </span>
          </div>
        ))}
      </div>

      {/* 设置菜单 */}
      <div className="m-profile-menu" style={{ marginTop: 12 }}>
        {settingItems.map((item, idx) => (
          <div key={idx} className="m-profile-menu-item" onClick={item.onClick}>
            <span className="m-profile-menu-icon">{item.icon}</span>
            <span className="m-profile-menu-title">{item.title}</span>
            <span className="m-profile-menu-arrow">
              <RightOutlined />
            </span>
          </div>
        ))}
      </div>

      {/* 退出按钮 */}
      <div className="m-profile-logout">
        <Button
          block
          size="large"
          danger
          icon={<LogoutOutlined />}
          onClick={handleLogout}
          className="m-profile-logout-btn"
        >
          退出登录
        </Button>
      </div>

      {/* 版本信息 */}
      <div className="m-profile-footer">
        <Text type="secondary" style={{ fontSize: 12 }}>
          诸神殿神祇管理系统 v2.0 · 移动版
        </Text>
      </div>
    </div>
  )
}

export default MobileProfile
