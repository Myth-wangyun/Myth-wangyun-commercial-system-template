/**
 * 移动端首页
 * 提供快捷入口卡片导航
 */
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Typography } from 'antd'
import {
  FormOutlined,
  UnorderedListOutlined,
  BarChartOutlined,
  TeamOutlined,
  CalendarOutlined,
  BellOutlined,
  AuditOutlined,
  MessageOutlined,
} from '@ant-design/icons'
import { useAuthStore } from '@/stores/authStore'
import { useCampusStore } from '@/stores/campusStore'
import dayjs from 'dayjs'
import './MobileHome.css'

const { Title, Text } = Typography

const MobileHome: React.FC = () => {
  const { user } = useAuthStore()
  const { currentCampus } = useCampusStore()
  const navigate = useNavigate()

  const quickActions = [
    {
      icon: <FormOutlined />,
      title: '咨询量录入',
      desc: '快速录入咨询记录',
      color: '#1677ff',
      path: '/m/consult',
    },
    {
      icon: <UnorderedListOutlined />,
      title: '我的咨询量',
      desc: '查看我的咨询量',
      color: '#52c41a',
      path: '/m/consult/my',
    },
    {
      icon: <MessageOutlined />,
      title: '咨询记录',
      desc: '沟通记录管理',
      color: '#722ed1',
      path: '/m/consult/records',
    },
    {
      icon: <BarChartOutlined />,
      title: '数据统计',
      desc: '查看数据概览',
      color: '#fa8c16',
      path: '/m/stats',
    },
    {
      icon: <TeamOutlined />,
      title: '人员管理',
      desc: '查看部门人员',
      color: '#722ed1',
      path: '/m/staff',
    },
    {
      icon: <BellOutlined />,
      title: '通知公告',
      desc: '系统通知消息',
      color: '#13c2c2',
      path: '/m/notifications',
    },
    {
      icon: <AuditOutlined />,
      title: '全部功能',
      desc: '查看所有功能模块',
      color: '#eb2f96',
      path: '/m/functions',
    },
  ]

  return (
    <div className="m-home">
      {/* 欢迎横幅 */}
      <div className="m-home-banner">
        <div className="m-home-greeting">
          <Title level={4} style={{ color: '#fff', margin: 0 }}>
            {getGreeting()}，{user?.name || '用户'}
          </Title>
          <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>
            <CalendarOutlined style={{ marginRight: 4 }} />
            {dayjs().format('YYYY年MM月DD日 dddd')}
          </Text>
          {currentCampus && (
            <Text
              style={{
                color: 'rgba(255,255,255,0.75)',
                fontSize: 12,
                display: 'block',
                marginTop: 2,
              }}
            >
              当前神殿：{currentCampus}
            </Text>
          )}
        </div>
      </div>

      {/* 快捷操作 */}
      <div className="m-home-section">
        <div className="m-home-section-title">常用功能</div>
        <div className="m-home-grid">
          {quickActions.map((action, idx) => (
            <div key={idx} className="m-home-action-card" onClick={() => navigate(action.path)}>
              <div className="m-home-action-icon" style={{ background: action.color }}>
                {action.icon}
              </div>
              <div className="m-home-action-title">{action.title}</div>
              <div className="m-home-action-desc">{action.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 系统公告 */}
      <div className="m-home-section">
        <div className="m-home-section-title">
          <BellOutlined style={{ marginRight: 4 }} /> 系统公告
        </div>
        <Card size="small" className="m-home-notice-card">
          <Text type="secondary" style={{ fontSize: 13 }}>
            移动端已全面升级，新增数据统计、人员管理、通知公告、审批中心等功能模块。
          </Text>
        </Card>
      </div>
    </div>
  )
}

function getGreeting(): string {
  const h = dayjs().hour()
  if (h < 6) return '凌晨好'
  if (h < 9) return '早上好'
  if (h < 12) return '上午好'
  if (h < 14) return '中午好'
  if (h < 18) return '下午好'
  return '晚上好'
}

export default MobileHome
