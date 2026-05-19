/**
 * 缴费记录管理组件
 * 显示缴费汇总和缴费明细（首款+后续交费）
 */

import React, { useState, useEffect, useCallback } from 'react'
import { 
  App,
  Modal, 
  Card, 
  Descriptions, 
  Table, 
  Button, 
  Tag, 
  Space, 
  Popconfirm, 
  InputNumber,
  Statistic,
  Row,
  Col,
  Empty,
  Spin,
  Divider
} from 'antd'
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  DollarOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import type { PaymentInfo, PaymentRecord, PaymentSummary } from './paymentApi'
import { 
  getPaymentInfo, 
  deletePaymentRecord, 
  updatePaymentSummary,
  formatMoney,
  getPaymentStatusColor,
  getPaymentTypeColor
} from './paymentApi'
import PaymentRecordForm from './PaymentRecordForm'

interface PaymentHistoryProps {
  visible: boolean
  onClose: () => void
  recordId: number
  objectId: number
  consultantName?: string
  onUpdate?: () => void  // 用于通知父组件数据已更新
}

const PaymentHistory: React.FC<PaymentHistoryProps> = ({
  visible,
  onClose,
  recordId,
  objectId,
  consultantName,
  onUpdate
}) => {
  const { message, notification } = App.useApp()
  const [loading, setLoading] = useState(false)
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null)
  const [formVisible, setFormVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<PaymentRecord | null>(null)
  const [paymentType, setPaymentType] = useState<'首款' | '后续交费'>('首款')
  
  // 修改应交金额相关状态
  const [editingAmount, setEditingAmount] = useState(false)
  const [tempAmount, setTempAmount] = useState<number>(0)

  // 加载缴费信息
  const loadPaymentInfo = useCallback(async () => {
    if (!recordId) return
    
    setLoading(true)
    try {
      const data = await getPaymentInfo(recordId)
      setPaymentInfo(data)
    } catch (error) {
      console.error('加载缴费信息失败:', error)
      message.error('加载缴费信息失败')
    } finally {
      setLoading(false)
    }
  }, [recordId])

  useEffect(() => {
    if (visible && recordId) {
      loadPaymentInfo()
    }
  }, [visible, recordId, loadPaymentInfo])

  // 添加首款
  const handleAddFirstPayment = () => {
    setEditingRecord(null)
    setPaymentType('首款')
    setFormVisible(true)
  }

  // 添加后续交费
  const handleAddSubsequentPayment = () => {
    setEditingRecord(null)
    setPaymentType('后续交费')
    setFormVisible(true)
  }

  // 编辑缴费记录
  const handleEdit = (record: PaymentRecord) => {
    setEditingRecord(record)
    setFormVisible(true)
  }

  // 删除缴费记录
  const handleDelete = async (paymentId: number) => {
    try {
      await deletePaymentRecord(paymentId)
      message.success('删除成功')
      loadPaymentInfo()
      onUpdate?.()
    } catch (error) {
      console.error('删除失败:', error)
      message.error('删除失败')
    }
  }

  // 表单提交成功后刷新
  const handleFormSuccess = () => {
    loadPaymentInfo()
    onUpdate?.()
  }

  // 开始编辑应交金额
  const handleEditAmount = () => {
    setTempAmount(paymentInfo?.summary?.应交金额 || 0)
    setEditingAmount(true)
  }

  // 保存应交金额
  const handleSaveAmount = async () => {
    try {
      await updatePaymentSummary(recordId, { 应交金额: tempAmount })
      message.success('应交金额已更新')
      setEditingAmount(false)
      loadPaymentInfo()
      onUpdate?.()
    } catch (error) {
      console.error('更新失败:', error)
      message.error('更新应交金额失败')
    }
  }

  // 获取状态图标
  const getStatusIcon = (status: string) => {
    switch (status) {
      case '已缴清':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />
      case '部分缴费':
        return <ExclamationCircleOutlined style={{ color: '#faad14' }} />
      default:
        return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
    }
  }

  // 合并首款和后续交费为表格数据
  const getTableData = (): PaymentRecord[] => {
    const records: PaymentRecord[] = []
    if (paymentInfo?.first_payment) {
      records.push(paymentInfo.first_payment)
    }
    if (paymentInfo?.subsequent_payments) {
      records.push(...paymentInfo.subsequent_payments)
    }
    return records
  }

  // 表格列定义
  const columns: ColumnsType<PaymentRecord> = [
    {
      title: '缴费类型',
      dataIndex: '缴费类型',
      key: '缴费类型',
      width: 100,
      render: (type: string) => (
        <Tag color={getPaymentTypeColor(type)}>{type}</Tag>
      )
    },
    {
      title: '缴费金额',
      dataIndex: '缴费金额',
      key: '缴费金额',
      width: 120,
      render: (amount: number) => (
        <span style={{ color: '#1890ff', fontWeight: 500 }}>
          {formatMoney(amount)}
        </span>
      )
    },
    {
      title: '缴费时间',
      dataIndex: '缴费时间',
      key: '缴费时间',
      width: 150,
      render: (time: string) => time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-'
    },
    {
      title: '缴费方式',
      dataIndex: '缴费方式',
      key: '缴费方式',
      width: 100,
      render: (method: string) => method || '-'
    },
    {
      title: '收款人',
      dataIndex: '收款人',
      key: '收款人',
      width: 100,
      render: (name: string) => name || '-'
    },
    {
      title: '凭证号',
      dataIndex: '凭证号',
      key: '凭证号',
      width: 120,
      ellipsis: true,
      render: (no: string) => no || '-'
    },
    {
      title: '备注',
      dataIndex: '备注',
      key: '备注',
      ellipsis: true,
      render: (remark: string) => remark || '-'
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="link" 
            size="small" 
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除这条缴费记录吗？"
            description="删除后缴费汇总将自动重新计算"
            onConfirm={() => handleDelete(record.缴费ID)}
            okText="确定"
            cancelText="取消"
          >
            <Button 
              type="link" 
              size="small" 
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  const summary = paymentInfo?.summary
  const hasFirstPayment = !!paymentInfo?.first_payment

  return (
    <>
      <Modal
        title={
          <Space>
            <DollarOutlined />
            <span>缴费记录管理</span>
            {consultantName && <Tag>{consultantName}</Tag>}
          </Space>
        }
        open={visible}
        onCancel={onClose}
        footer={null}
        width={1000}
        destroyOnClose
      >
        <Spin spinning={loading}>
          {/* 缴费汇总卡片 */}
          <Card 
            title="缴费汇总" 
            size="small" 
            style={{ marginBottom: 16 }}
            extra={
              summary && (
                <Space>
                  {getStatusIcon(summary.缴费状态)}
                  <Tag color={getPaymentStatusColor(summary.缴费状态)}>
                    {summary.缴费状态}
                  </Tag>
                </Space>
              )
            }
          >
            <Row gutter={24}>
              <Col span={5}>
                {editingAmount ? (
                  <div>
                    <div style={{ marginBottom: 8, color: 'rgba(0, 0, 0, 0.45)', fontSize: 14 }}>
                      <Space>
                        <span>应交金额</span>
                      </Space>
                    </div>
                    <Space>
                      <InputNumber
                        size="small"
                        value={tempAmount}
                        onChange={(v) => setTempAmount(v || 0)}
                        min={0}
                        precision={2}
                        style={{ width: 100 }}
                      />
                      <Button size="small" type="primary" onClick={handleSaveAmount}>保存</Button>
                      <Button size="small" onClick={() => setEditingAmount(false)}>取消</Button>
                    </Space>
                  </div>
                ) : (
                  <Statistic
                    title={
                      <Space>
                        <span>应交金额</span>
                        <Button 
                          type="link" 
                          size="small" 
                          onClick={handleEditAmount}
                          style={{ padding: 0 }}
                        >
                          修改
                        </Button>
                      </Space>
                    }
                    value={summary?.应交金额 || 0}
                    precision={2}
                    prefix="¥"
                  />
                )}
              </Col>
              <Col span={5}>
                <Statistic
                  title="首款金额"
                  value={summary?.首款金额 || 0}
                  precision={2}
                  prefix="¥"
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col span={5}>
                <Statistic
                  title="已交金额"
                  value={summary?.已交金额 || 0}
                  precision={2}
                  prefix="¥"
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col span={5}>
                <Statistic
                  title="欠费金额"
                  value={summary?.欠费金额 || 0}
                  precision={2}
                  prefix="¥"
                  valueStyle={{ color: summary?.欠费金额 > 0 ? '#ff4d4f' : undefined }}
                />
              </Col>
              <Col span={4}>
                <Statistic
                  title="后续交费次数"
                  value={summary?.后续交费次数 || 0}
                  suffix="次"
                />
              </Col>
            </Row>
          </Card>

          {/* 操作按钮 */}
          <Space style={{ marginBottom: 16 }}>
            {!hasFirstPayment && (
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={handleAddFirstPayment}
              >
                添加首款
              </Button>
            )}
            <Button 
              icon={<PlusOutlined />}
              onClick={handleAddSubsequentPayment}
            >
              添加后续交费
            </Button>
          </Space>

          <Divider style={{ margin: '12px 0' }} />

          {/* 缴费记录表格 */}
          {getTableData().length > 0 ? (
            <Table
              columns={columns}
              dataSource={getTableData()}
              rowKey="缴费ID"
              size="small"
              pagination={false}
              scroll={{ x: 1000 }}
            />
          ) : (
            <Empty 
              description="暂无缴费记录"
              style={{ padding: '40px 0' }}
            >
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={handleAddFirstPayment}
              >
                添加首款
              </Button>
            </Empty>
          )}
        </Spin>
      </Modal>

      {/* 缴费记录表单 */}
      <PaymentRecordForm
        visible={formVisible}
        onClose={() => setFormVisible(false)}
        onSuccess={handleFormSuccess}
        recordId={recordId}
        objectId={objectId}
        editingRecord={editingRecord}
        paymentType={paymentType}
        hasFirstPayment={hasFirstPayment}
        paymentSummary={paymentInfo?.summary}
      />
    </>
  )
}

export default PaymentHistory
