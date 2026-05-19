/**
 * 咨询量导出审批页面
 * 仅审批人可见
 */

import React, { useState, useEffect, useCallback } from 'react'
import { App,
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Descriptions,
  Input,
  Select,
  DatePicker,
  Row,
  Col,
  Tabs,
  Badge,
  Popconfirm,
  Alert,
  Empty,
} from 'antd'
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  DownloadOutlined,
  ReloadOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import * as exportApi from '../type-count-system/exportApi'
import type { ExportRequest } from '../type-count-system/exportApi'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker

const ExportApprovalPage: React.FC = () => {
  const { message } = App.useApp()
  const [loading, setLoading] = useState(false)
  const [requests, setRequests] = useState<ExportRequest[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending')
  
  // 筛选条件
  const [statusFilter, setStatusFilter] = useState<string | undefined>()
  const [applicantFilter, setApplicantFilter] = useState('')
  
  // 详情弹窗
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [detailData, setDetailData] = useState<ExportRequest | null>(null)
  
  // 驳回弹窗
  const [rejectModalVisible, setRejectModalVisible] = useState(false)
  const [rejectRequestId, setRejectRequestId] = useState<number | null>(null)
  const [rejectComment, setRejectComment] = useState('')
  const [rejectLoading, setRejectLoading] = useState(false)
  
  // 待审批数量
  const [pendingCount, setPendingCount] = useState(0)

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      let result
      if (activeTab === 'pending') {
        result = await exportApi.getPendingExportRequests({
          page,
          page_size: pageSize,
        })
      } else {
        result = await exportApi.getAllExportRequests({
          page,
          page_size: pageSize,
          status: statusFilter as any,
          applicant_name: applicantFilter || undefined,
        })
      }
      setRequests(result.data)
      setTotal(result.total)
    } catch (error) {
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }, [activeTab, page, pageSize, statusFilter, applicantFilter])

  // 加载待审批数量
  const loadPendingCount = useCallback(async () => {
    try {
      const result = await exportApi.getPendingExportRequests({ page: 1, page_size: 1 })
      setPendingCount(result.total)
    } catch (error) {
      console.error('加载待审批数量失败', error)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    loadPendingCount()
  }, [loadPendingCount])

  // 查看详情
  const handleViewDetail = (record: ExportRequest) => {
    setDetailData(record)
    setDetailModalVisible(true)
  }

  // 审批通过
  const handleApprove = async (requestId: number) => {
    try {
      await exportApi.approveExportRequest(requestId, { comment: '审批通过' })
      message.success('审批通过')
      loadData()
      loadPendingCount()
    } catch (error: any) {
      message.error('审批失败: ' + (error.response?.data?.detail || error.message))
    }
  }

  // 打开驳回弹窗
  const handleOpenReject = (requestId: number) => {
    setRejectRequestId(requestId)
    setRejectComment('')
    setRejectModalVisible(true)
  }

  // 提交驳回
  const handleReject = async () => {
    if (!rejectRequestId) return
    if (!rejectComment.trim()) {
      message.warning('请填写驳回原因')
      return
    }
    
    setRejectLoading(true)
    try {
      await exportApi.rejectExportRequest(rejectRequestId, { comment: rejectComment })
      message.success('已驳回')
      setRejectModalVisible(false)
      loadData()
      loadPendingCount()
    } catch (error: any) {
      message.error('驳回失败: ' + (error.response?.data?.detail || error.message))
    } finally {
      setRejectLoading(false)
    }
  }

  // 状态颜色映射
  const statusConfig: Record<string, { color: string; text: string; icon: React.ReactNode }> = {
    pending: { color: 'processing', text: '待审批', icon: <ClockCircleOutlined /> },
    approved: { color: 'success', text: '已通过', icon: <CheckCircleOutlined /> },
    rejected: { color: 'error', text: '已驳回', icon: <CloseCircleOutlined /> },
  }

  // 表格列
  const columns: ColumnsType<ExportRequest> = [
    {
      title: '申请ID',
      dataIndex: 'id',
      width: 80,
    },
    {
      title: '申请人',
      dataIndex: 'applicant_name',
      width: 100,
    },
    {
      title: '申请人神殿',
      dataIndex: 'applicant_campus',
      width: 100,
      render: (val) => val || '-',
    },
    {
      title: '记录数',
      dataIndex: 'total_records',
      width: 100,
      render: (val) => <Tag color="blue">{val} 条</Tag>,
    },
    {
      title: '申请原因',
      dataIndex: 'reason',
      width: 200,
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status: string) => {
        const config = statusConfig[status]
        return config ? (
          <Tag color={config.color} icon={config.icon}>
            {config.text}
          </Tag>
        ) : status
      },
    },
    {
      title: '申请时间',
      dataIndex: 'created_at',
      width: 160,
      render: (val) => dayjs(val).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '审批人',
      dataIndex: 'approver_name',
      width: 100,
      render: (val) => val || '-',
    },
    {
      title: '审批时间',
      dataIndex: 'approval_time',
      width: 160,
      render: (val) => val ? dayjs(val).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '操作',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          {record.status === 'pending' && (
            <>
              <Popconfirm
                title="确定审批通过？"
                description="通过后申请人可以下载数据"
                onConfirm={() => handleApprove(record.id)}
              >
                <Button type="link" size="small" style={{ color: '#52c41a' }}>
                  通过
                </Button>
              </Popconfirm>
              <Button
                type="link"
                size="small"
                danger
                onClick={() => handleOpenReject(record.id)}
              >
                驳回
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <Card
        title="咨询量导出审批"
        extra={
          <Button icon={<ReloadOutlined />} onClick={() => { loadData(); loadPendingCount(); }}>
            刷新
          </Button>
        }
      >
        <Tabs
          activeKey={activeTab}
          onChange={(key) => {
            setActiveTab(key as 'pending' | 'all')
            setPage(1)
          }}
          items={[
            {
              key: 'pending',
              label: (
                <span>
                  待审批
                  {pendingCount > 0 && (
                    <Badge count={pendingCount} style={{ marginLeft: 8 }} />
                  )}
                </span>
              ),
            },
            {
              key: 'all',
              label: '全部申请',
            },
          ]}
        />

        {/* 筛选条件（仅在全部申请标签显示） */}
        {activeTab === 'all' && (
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={6}>
              <Select
                placeholder="状态筛选"
                value={statusFilter}
                onChange={setStatusFilter}
                allowClear
                style={{ width: '100%' }}
              >
                <Select.Option value="pending">待审批</Select.Option>
                <Select.Option value="approved">已通过</Select.Option>
                <Select.Option value="rejected">已驳回</Select.Option>
              </Select>
            </Col>
            <Col span={6}>
              <Input
                placeholder="申请人姓名"
                value={applicantFilter}
                onChange={(e) => setApplicantFilter(e.target.value)}
                allowClear
              />
            </Col>
            <Col span={4}>
              <Button type="primary" onClick={() => { setPage(1); loadData(); }}>
                搜索
              </Button>
            </Col>
          </Row>
        )}

        <Table
          columns={columns}
          dataSource={requests}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1400 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: (p, ps) => {
              setPage(p)
              setPageSize(ps)
            },
          }}
        />
      </Card>

      {/* 详情弹窗 */}
      <Modal
        title="导出申请详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
          detailData?.status === 'pending' && (
            <Popconfirm
              key="approve"
              title="确定审批通过？"
              onConfirm={() => {
                handleApprove(detailData!.id)
                setDetailModalVisible(false)
              }}
            >
              <Button type="primary">
                通过
              </Button>
            </Popconfirm>
          ),
          detailData?.status === 'pending' && (
            <Button
              key="reject"
              danger
              onClick={() => {
                setDetailModalVisible(false)
                handleOpenReject(detailData!.id)
              }}
            >
              驳回
            </Button>
          ),
        ].filter(Boolean)}
        width={700}
      >
        {detailData && (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="申请ID">{detailData.id}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={statusConfig[detailData.status]?.color}>
                {statusConfig[detailData.status]?.text}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="申请人">{detailData.applicant_name}</Descriptions.Item>
            <Descriptions.Item label="申请人神殿">{detailData.applicant_campus || '-'}</Descriptions.Item>
            <Descriptions.Item label="数据量">
              <Tag color="blue">{detailData.total_records} 条</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="申请时间">
              {dayjs(detailData.created_at).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
            <Descriptions.Item label="申请原因" span={2}>
              {detailData.reason}
            </Descriptions.Item>
            <Descriptions.Item label="筛选条件" span={2}>
              <pre style={{ margin: 0, fontSize: 12, maxHeight: 150, overflow: 'auto' }}>
                {JSON.stringify(detailData.filters, null, 2)}
              </pre>
            </Descriptions.Item>
            {detailData.approver_name && (
              <>
                <Descriptions.Item label="审批人">{detailData.approver_name}</Descriptions.Item>
                <Descriptions.Item label="审批时间">
                  {detailData.approval_time ? dayjs(detailData.approval_time).format('YYYY-MM-DD HH:mm:ss') : '-'}
                </Descriptions.Item>
              </>
            )}
            {detailData.approval_comment && (
              <Descriptions.Item label="审批意见" span={2}>
                {detailData.approval_comment}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>

      {/* 驳回弹窗 */}
      <Modal
        title="驳回导出申请"
        open={rejectModalVisible}
        onCancel={() => setRejectModalVisible(false)}
        onOk={handleReject}
        confirmLoading={rejectLoading}
        okText="确认驳回"
        okButtonProps={{ danger: true }}
      >
        <Alert
          message="驳回后申请人将无法下载数据"
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Input.TextArea
          rows={4}
          value={rejectComment}
          onChange={(e) => setRejectComment(e.target.value)}
          placeholder="请填写驳回原因..."
          maxLength={500}
          showCount
        />
      </Modal>
    </div>
  )
}

export default ExportApprovalPage
