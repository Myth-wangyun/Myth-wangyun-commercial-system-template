/**
 * 移动端审批中心页
 * 展示待审批、已审批、已驳回的审批事项
 */
import React, { useState, useMemo } from 'react'
import { App, Typography, Button, Modal } from 'antd'
import {
  FileTextOutlined,
  UserOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  AuditOutlined,
} from '@ant-design/icons'
import { useAuthStore } from '@/stores/authStore'
import { useCampusStore } from '@/stores/campusStore'
import dayjs from 'dayjs'
import './MobileApprovals.css'

const { Title, Text } = Typography

interface ApprovalItem {
  id: number
  title: string
  applicant: string
  department: string
  type: string
  status: 'pending' | 'approved' | 'rejected'
  submitTime: string
  description: string
}

// 示例审批数据（后续可换为真实 API）
const generateApprovals = (campus: string): ApprovalItem[] => [
  {
    id: 1,
    title: '咨询量数据修正申请',
    applicant: '张三',
    department: '祈福司',
    type: '数据修改',
    status: 'pending',
    submitTime: dayjs().subtract(2, 'hour').format('YYYY-MM-DD HH:mm'),
    description: '申请修正本周三咨询量录入的数据，原因：录入时选错了咨询类别。',
  },
  {
    id: 2,
    title: '学生退费审批',
    applicant: '李四',
    department: '教务部',
    type: '退费申请',
    status: 'pending',
    submitTime: dayjs().subtract(5, 'hour').format('YYYY-MM-DD HH:mm'),
    description: `${campus}神殿学生王某因个人原因申请退费，已缴学费12000元，按规定可退8400元。`,
  },
  {
    id: 3,
    title: '教师请假审批',
    applicant: '王五',
    department: '教学部',
    type: '请假申请',
    status: 'pending',
    submitTime: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm'),
    description: '因家中有事，申请请假3天（2月13日-2月15日），课程已安排代课教师。',
  },
  {
    id: 4,
    title: '招聘需求审批',
    applicant: '赵六',
    department: '人事部',
    type: '招聘申请',
    status: 'approved',
    submitTime: dayjs().subtract(3, 'day').format('YYYY-MM-DD HH:mm'),
    description: `申请为${campus}神殿祈福司补招2名咨询师，岗位薪资范围5000-8000元。`,
  },
  {
    id: 5,
    title: '物资采购审批',
    applicant: '孙七',
    department: '行政部',
    type: '采购申请',
    status: 'rejected',
    submitTime: dayjs().subtract(5, 'day').format('YYYY-MM-DD HH:mm'),
    description: '申请采购教学投影仪2台、白板3块，预算12000元。驳回原因：超出本月预算。',
  },
]

const tabs = [
  { key: 'pending', label: '待审批' },
  { key: 'approved', label: '已通过' },
  { key: 'rejected', label: '已驳回' },
]

const statusConfig = {
  pending: { label: '待审批', className: 'pending' },
  approved: { label: '已通过', className: 'approved' },
  rejected: { label: '已驳回', className: 'rejected' },
}

const MobileApprovals: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore()
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending')
  const [approvals, setApprovals] = useState<ApprovalItem[]>(() =>
    generateApprovals(currentCampus || '盛邦'),
  )
  const [selectedApproval, setSelectedApproval] = useState<ApprovalItem | null>(null)

  const filteredApprovals = useMemo(() => {
    return approvals.filter((a) => a.status === activeTab)
  }, [approvals, activeTab])

  const stats = useMemo(
    () => ({
      pending: approvals.filter((a) => a.status === 'pending').length,
      approved: approvals.filter((a) => a.status === 'approved').length,
      rejected: approvals.filter((a) => a.status === 'rejected').length,
    }),
    [approvals],
  )

  const handleApprove = (id: number) => {
    setApprovals((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'approved' as const } : a)),
    )
    setSelectedApproval(null)
    message.success('已通过审批')
  }

  const handleReject = (id: number) => {
    setApprovals((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'rejected' as const } : a)),
    )
    setSelectedApproval(null)
    message.success('已驳回')
  }

  return (
    <div className="m-approvals">
      {/* 头部 */}
      <div className="m-approvals-header">
        <Title level={4} className="m-approvals-header-title">
          <AuditOutlined style={{ marginRight: 8 }} />
          审批中心
        </Title>
        <Text className="m-approvals-header-desc">
          {currentCampus || ''} · {user?.name || ''}
        </Text>
      </div>

      {/* 统计卡片 */}
      <div className="m-approvals-stats">
        <div className="m-approvals-stat-card">
          <div className="m-approvals-stat-value" style={{ color: '#fa8c16' }}>
            {stats.pending}
          </div>
          <div className="m-approvals-stat-label">待审批</div>
        </div>
        <div className="m-approvals-stat-card">
          <div className="m-approvals-stat-value" style={{ color: '#52c41a' }}>
            {stats.approved}
          </div>
          <div className="m-approvals-stat-label">已通过</div>
        </div>
        <div className="m-approvals-stat-card">
          <div className="m-approvals-stat-value" style={{ color: '#ff4d4f' }}>
            {stats.rejected}
          </div>
          <div className="m-approvals-stat-label">已驳回</div>
        </div>
      </div>

      {/* 标签页 */}
      <div className="m-approvals-tabs">
        {tabs.map((tab) => (
          <div
            key={tab.key}
            className={`m-approvals-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() =>
              setActiveTab(tab.key as 'pending' | 'approved' | 'rejected')
            }
          >
            {tab.label}
            {tab.key === 'pending' && stats.pending > 0 && ` (${stats.pending})`}
          </div>
        ))}
      </div>

      {/* 审批列表 */}
      {filteredApprovals.length === 0 ? (
        <div className="m-approvals-empty">
          <div className="m-approvals-empty-icon">
            <FileTextOutlined />
          </div>
          <Text type="secondary">暂无{statusConfig[activeTab].label}事项</Text>
        </div>
      ) : (
        <div className="m-approvals-list">
          {filteredApprovals.map((item) => {
            const config = statusConfig[item.status]
            return (
              <div
                key={item.id}
                className="m-approval-card"
                onClick={() => setSelectedApproval(item)}
              >
                <div className="m-approval-top">
                  <span className="m-approval-title">{item.title}</span>
                  <span className={`m-approval-status ${config.className}`}>{config.label}</span>
                </div>
                <div className="m-approval-info">
                  <div className="m-approval-info-row">
                    <UserOutlined /> {item.applicant} · {item.department}
                  </div>
                  <div className="m-approval-info-row">
                    <ClockCircleOutlined /> {item.submitTime}
                  </div>
                  <div className="m-approval-info-row">
                    <FileTextOutlined /> {item.type}
                  </div>
                </div>
                {item.status === 'pending' && (
                  <div className="m-approval-actions">
                    <Button
                      size="small"
                      type="primary"
                      icon={<CheckCircleOutlined />}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleApprove(item.id)
                      }}
                      style={{ flex: 1 }}
                    >
                      通过
                    </Button>
                    <Button
                      size="small"
                      danger
                      icon={<CloseCircleOutlined />}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleReject(item.id)
                      }}
                      style={{ flex: 1 }}
                    >
                      驳回
                    </Button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* 审批详情弹窗 */}
      <Modal
        open={!!selectedApproval}
        onCancel={() => setSelectedApproval(null)}
        footer={
          selectedApproval?.status === 'pending' ? (
            <div style={{ display: 'flex', gap: 10 }}>
              <Button
                block
                danger
                onClick={() => selectedApproval && handleReject(selectedApproval.id)}
              >
                驳回
              </Button>
              <Button
                block
                type="primary"
                onClick={() => selectedApproval && handleApprove(selectedApproval.id)}
              >
                通过
              </Button>
            </div>
          ) : null
        }
        closable
        centered
        width="90%"
        style={{ maxWidth: 400 }}
        title={selectedApproval?.title}
      >
        {selectedApproval && (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <UserOutlined style={{ color: '#999' }} />
                <Text type="secondary">申请人：{selectedApproval.applicant}</Text>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <FileTextOutlined style={{ color: '#999' }} />
                <Text type="secondary">类型：{selectedApproval.type}</Text>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <ClockCircleOutlined style={{ color: '#999' }} />
                <Text type="secondary">提交时间：{selectedApproval.submitTime}</Text>
              </div>
            </div>
            <div
              style={{
                background: '#fafafa',
                borderRadius: 8,
                padding: 16,
                fontSize: 14,
                lineHeight: 1.8,
                color: '#333',
              }}
            >
              {selectedApproval.description}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default MobileApprovals
