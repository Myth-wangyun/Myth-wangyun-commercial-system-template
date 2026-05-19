/**
 * 移动端通知公告页
 * 展示系统通知、审批消息等
 */
import React, { useState, useMemo } from 'react'
import { Typography, Modal } from 'antd'
import {
  BellOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons'
import { useCampusStore } from '@/stores/campusStore'
import dayjs from 'dayjs'
import './MobileNotifications.css'

const { Title, Text } = Typography

interface Notification {
  id: number
  title: string
  content: string
  type: 'info' | 'warning' | 'success'
  read: boolean
  time: string
  from: string
}

// 示例通知数据（后续可换为真实 API）
const generateNotifications = (campus: string): Notification[] => [
  {
    id: 1,
    title: '系统公告：移动端功能升级',
    content: '移动端新增数据统计、人员管理、通知公告功能模块，请及时体验并反馈使用问题。',
    type: 'info',
    read: false,
    time: dayjs().subtract(1, 'hour').format('YYYY-MM-DD HH:mm'),
    from: '系统管理员',
  },
  {
    id: 2,
    title: `${campus}神殿月度数据提醒`,
    content: `请${campus}神殿各部门在本月底前完成核心数据填报，包括学生人数、就业率、口碑招生等关键指标。`,
    type: 'warning',
    read: false,
    time: dayjs().subtract(3, 'hour').format('YYYY-MM-DD HH:mm'),
    from: '教务处',
  },
  {
    id: 3,
    title: '咨询量录入数据审核通过',
    content: '您提交的本周咨询量录入数据已通过审核，请及时查看统计结果。',
    type: 'success',
    read: true,
    time: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm'),
    from: '数据审核组',
  },
  {
    id: 4,
    title: '员工考勤异常提醒',
    content: '检测到本周有3名员工考勤异常，请相关部门负责人及时核实处理。',
    type: 'warning',
    read: true,
    time: dayjs().subtract(2, 'day').format('YYYY-MM-DD HH:mm'),
    from: '人事部',
  },
  {
    id: 5,
    title: '季度绩效考核通知',
    content: '本季度绩效考核评分工作将于下周一启动，请各部门提前准备相关材料。',
    type: 'info',
    read: true,
    time: dayjs().subtract(3, 'day').format('YYYY-MM-DD HH:mm'),
    from: '人事部',
  },
  {
    id: 6,
    title: '学生满意度调查结果公布',
    content: `${campus}神殿本月学生满意度调查结果已出，综合满意度达92.5%，较上月提升1.3个百分点。`,
    type: 'success',
    read: true,
    time: dayjs().subtract(5, 'day').format('YYYY-MM-DD HH:mm'),
    from: '教化司',
  },
]

const tabs = [
  { key: 'all', label: '全部' },
  { key: 'unread', label: '未读' },
  { key: 'info', label: '通知' },
  { key: 'warning', label: '提醒' },
]

const MobileNotifications: React.FC = () => {
  const { currentCampus } = useCampusStore()
  const [activeTab, setActiveTab] = useState('all')
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>(() =>
    generateNotifications(currentCampus || '盛邦'),
  )

  const filteredNotifications = useMemo(() => {
    switch (activeTab) {
      case 'unread':
        return notifications.filter((n) => !n.read)
      case 'info':
        return notifications.filter((n) => n.type === 'info')
      case 'warning':
        return notifications.filter((n) => n.type === 'warning')
      default:
        return notifications
    }
  }, [notifications, activeTab])

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications])

  const handleNotificationClick = (notification: Notification) => {
    // 标记已读
    setNotifications((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n)),
    )
    setSelectedNotification(notification)
  }

  const getTypeTag = (type: string) => {
    switch (type) {
      case 'warning':
        return { label: '提醒', className: 'warning' }
      case 'success':
        return { label: '完成', className: 'success' }
      default:
        return { label: '通知', className: '' }
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <ExclamationCircleOutlined style={{ color: '#fa8c16' }} />
      case 'success':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />
      default:
        return <InfoCircleOutlined style={{ color: '#1677ff' }} />
    }
  }

  return (
    <div className="m-notifications">
      {/* 头部 */}
      <div className="m-notifications-header">
        <Title level={4} className="m-notifications-header-title">
          <BellOutlined style={{ marginRight: 8 }} />
          通知公告
        </Title>
        <Text className="m-notifications-header-desc">
          {unreadCount > 0 ? `${unreadCount} 条未读消息` : '暂无未读消息'}
        </Text>
      </div>

      {/* 标签页 */}
      <div className="m-notifications-tabs">
        {tabs.map((tab) => (
          <div
            key={tab.key}
            className={`m-notifications-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            {tab.key === 'unread' && unreadCount > 0 && ` (${unreadCount})`}
          </div>
        ))}
      </div>

      {/* 通知列表 */}
      {filteredNotifications.length === 0 ? (
        <div className="m-notifications-empty">
          <div className="m-notifications-empty-icon">
            <BellOutlined />
          </div>
          <Text type="secondary">暂无通知</Text>
        </div>
      ) : (
        <div className="m-notifications-list">
          {filteredNotifications.map((n) => {
            const tag = getTypeTag(n.type)
            return (
              <div
                key={n.id}
                className={`m-notification-card ${!n.read ? 'unread' : ''}`}
                onClick={() => handleNotificationClick(n)}
              >
                <div className="m-notification-top">
                  <span className="m-notification-title">{n.title}</span>
                  {!n.read && <span className="m-notification-badge" />}
                </div>
                <div className="m-notification-content">{n.content}</div>
                <div className="m-notification-footer">
                  <span className="m-notification-time">
                    <ClockCircleOutlined style={{ marginRight: 4 }} />
                    {n.time}
                  </span>
                  <span className={`m-notification-type-tag ${tag.className}`}>{tag.label}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 通知详情弹窗 */}
      <Modal
        open={!!selectedNotification}
        onCancel={() => setSelectedNotification(null)}
        footer={null}
        closable
        centered
        width="90%"
        style={{ maxWidth: 400 }}
        title={selectedNotification?.title}
      >
        {selectedNotification && (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              {getTypeIcon(selectedNotification.type)}
              <Text type="secondary" style={{ fontSize: 13 }}>
                来自：{selectedNotification.from}
              </Text>
            </div>
            <Text style={{ fontSize: 14, lineHeight: 1.8, display: 'block' }}>
              {selectedNotification.content}
            </Text>
            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {selectedNotification.time}
              </Text>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default MobileNotifications
