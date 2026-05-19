/**
 * 转量列表组件 - 咨询师之间批量转量
 * 
 * 功能：
 * 1. 批量把某个咨询师的所有咨询量转给另一个咨询师
 * 2. 标记转量来源（转自谁谁谁的量），方便后续分析数据指标
 * 3. 跨神殿转量需要审批
 */

import React, { useState, useEffect, useCallback } from 'react'
import {
  App,
  Card,
  Row,
  Col,
  Select,
  AutoComplete,
  Button,
  Table,
  Space,
  Modal,
  Tag,
  Alert,
  Tabs,
  Form,
  Input,
  Statistic,
  Badge,
  Popconfirm,
  Descriptions,
} from 'antd'
import {
  SwapOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  HistoryOutlined,
  ExclamationCircleOutlined,
  UserSwitchOutlined,
  AuditOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import type {
  ConsultantInfo,
  TransferPreviewResponse,
  PendingApprovalRecord,
  TransferRecordHistory,
  TransferStatisticsData,
} from './types'
import * as api from './api'
import { useCampusStore } from '@/stores/campusStore'

const { TextArea } = Input

interface Props {
  refreshKey?: number
  campus?: string | null
  currentUserRealName?: string
}

export default function TransferList({ refreshKey, campus, currentUserRealName }: Props) {
  const { message, notification } = App.useApp()
  const { campuses } = useCampusStore()
  const [activeTab, setActiveTab] = useState('transfer')
  
  // 转量操作状态
  const [consultants, setConsultants] = useState<ConsultantInfo[]>([])
  const [sourceConsultant, setSourceConsultant] = useState<string | undefined>()
  const [targetConsultant, setTargetConsultant] = useState<string | undefined>()
  const [targetCampus, setTargetCampus] = useState<string | undefined>()
  const [previewData, setPreviewData] = useState<TransferPreviewResponse | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [transferLoading, setTransferLoading] = useState(false)
  const [transferReason, setTransferReason] = useState('')
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  
  // 审批状态
  const [pendingApprovals, setPendingApprovals] = useState<PendingApprovalRecord[]>([])
  const [pendingLoading, setPendingLoading] = useState(false)
  const [selectedApprovalIds, setSelectedApprovalIds] = useState<number[]>([])
  const [approvalTargetConsultant, setApprovalTargetConsultant] = useState<string>('')
  const [approvalOpinion, setApprovalOpinion] = useState('')
  
  // 历史记录状态
  const [historyRecords, setHistoryRecords] = useState<TransferRecordHistory[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  
  // 统计数据
  const [statistics, setStatistics] = useState<TransferStatisticsData | null>(null)
  const [statisticsLoading, setStatisticsLoading] = useState(false)
  
  // 单个转量状态
  const [singleRecordId, setSingleRecordId] = useState<string>('')
  const [singleSourceConsultant, setSingleSourceConsultant] = useState<string | undefined>()
  const [singleTargetConsultant, setSingleTargetConsultant] = useState<string | undefined>()
  const [singleTargetCampus, setSingleTargetCampus] = useState<string | undefined>()
  const [singleTransferReason, setSingleTransferReason] = useState('')
  const [singleTransferLoading, setSingleTransferLoading] = useState(false)
  const [singleShowConfirmModal, setSingleShowConfirmModal] = useState(false)
  
  // 加载咨询师列表
  const loadConsultants = useCallback(async () => {
    try {
      const data = await api.getConsultantList(campus || undefined)
      setConsultants(data)
    } catch (error) {
      console.error('加载咨询师列表失败:', error)
    }
  }, [campus])
  
  // 加载待审批记录
  const loadPendingApprovals = useCallback(async () => {
    setPendingLoading(true)
    try {
      const data = await api.getPendingApprovals(campus || undefined)
      setPendingApprovals(data)
    } catch (error) {
      console.error('加载待审批记录失败:', error)
    } finally {
      setPendingLoading(false)
    }
  }, [campus])
  
  // 加载历史记录
  const loadHistory = useCallback(async () => {
    setHistoryLoading(true)
    try {
      const data = await api.getTransferHistory({
        campus: campus || undefined,
        page: 1,
        page_size: 100,
      })
      setHistoryRecords(data)
    } catch (error) {
      console.error('加载历史记录失败:', error)
    } finally {
      setHistoryLoading(false)
    }
  }, [campus])
  
  // 加载统计数据
  const loadStatistics = useCallback(async () => {
    setStatisticsLoading(true)
    try {
      const data = await api.getConsultantTransferStatistics({
        campus: campus || undefined,
      })
      setStatistics(data)
    } catch (error) {
      console.error('加载统计数据失败:', error)
    } finally {
      setStatisticsLoading(false)
    }
  }, [campus])
  
  // 初始化加载
  useEffect(() => {
    loadConsultants()
    loadPendingApprovals()
    loadStatistics()
  }, [loadConsultants, loadPendingApprovals, loadStatistics, refreshKey])
  
  // 切换TAB时加载对应数据
  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory()
    }
  }, [activeTab, loadHistory])
  
  // 预览转量
  const handlePreview = async () => {
    if (!sourceConsultant || !targetConsultant) {
      message.warning('请选择原咨询师和目标咨询师')
      return
    }
    
    if (sourceConsultant === targetConsultant) {
      message.warning('原咨询师和目标咨询师不能相同')
      return
    }
    
    setPreviewLoading(true)
    try {
      const data = await api.previewConsultantTransfer(
        sourceConsultant,
        targetConsultant,
        targetCampus
      )
      setPreviewData(data)
    } catch (error) {
      console.error('预览失败:', error)
      message.error('预览失败')
    } finally {
      setPreviewLoading(false)
    }
  }
  
  // 执行转量
  const handleTransfer = async () => {
    if (!sourceConsultant || !targetConsultant || !transferReason) {
      message.warning('请填写完整的转量信息')
      return
    }
    
    setTransferLoading(true)
    try {
      const result = await api.batchConsultantTransfer({
        source_consultant: sourceConsultant,
        target_consultant: targetConsultant,
        target_campus: targetCampus,
        reason: transferReason,
      })
      
      if (result.success) {
        notification.success({ message: '转量成功', description: `已转量 ${result.transferred_count} 条${result.pending_approval_count > 0 ? `，${result.pending_approval_count} 条待审批` : ''}`, placement: 'topRight', duration: 4 })
        setShowConfirmModal(false)
        setPreviewData(null)
        setSourceConsultant(undefined)
        setTargetConsultant(undefined)
        setTargetCampus(undefined)
        setTransferReason('')
        loadConsultants()
        loadPendingApprovals()
        loadStatistics()
      } else {
        notification.error({ message: '转量失败', description: result.message, placement: 'topRight', duration: 4 })
      }
    } catch (error: any) {
      console.error('转量失败:', error)
      notification.error({ message: '转量失败', description: error.response?.data?.detail || '请检查网络连接或联系管理员', placement: 'topRight', duration: 4 })
    } finally {
      setTransferLoading(false)
    }
  }
  
  // 执行单个转量
  const handleSingleTransfer = async () => {
    if (!singleRecordId || !singleRecordId.trim()) {
      message.warning('请输入记录ID')
      return
    }
    
    if (!singleSourceConsultant || !singleTargetConsultant) {
      message.warning('请选择原咨询师和目标咨询师')
      return
    }
    
    if (singleSourceConsultant === singleTargetConsultant) {
      message.warning('原咨询师和目标咨询师不能相同')
      return
    }
    
    if (!singleTransferReason.trim()) {
      message.warning('请填写转量原因')
      return
    }
    
    setSingleTransferLoading(true)
    try {
      const recordIds = singleRecordId.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
      
      if (recordIds.length === 0) {
        message.warning('请输入有效的记录ID')
        return
      }
      
      const result = await api.batchConsultantTransfer({
        source_consultant: singleSourceConsultant,
        target_consultant: singleTargetConsultant,
        target_campus: singleTargetCampus,
        reason: singleTransferReason,
        record_ids: recordIds,
      })
      
      if (result.success) {
        notification.success({ message: '转量成功', description: `已转量 ${result.transferred_count} 条${result.pending_approval_count > 0 ? `，${result.pending_approval_count} 条待审批` : ''}`, placement: 'topRight', duration: 4 })
        setSingleShowConfirmModal(false)
        setSingleRecordId('')
        setSingleSourceConsultant(undefined)
        setSingleTargetConsultant(undefined)
        setSingleTargetCampus(undefined)
        setSingleTransferReason('')
        loadConsultants()
        loadPendingApprovals()
        loadStatistics()
      } else {
        notification.error({ message: '转量失败', description: result.message, placement: 'topRight', duration: 4 })
      }
    } catch (error: any) {
      console.error('转量失败:', error)
      notification.error({ message: '转量失败', description: error.response?.data?.detail || '请检查网络连接或联系管理员', placement: 'topRight', duration: 4 })
    } finally {
      setSingleTransferLoading(false)
    }
  }
  
  // 审批通过
  const handleApprove = async () => {
    if (selectedApprovalIds.length === 0) {
      message.warning('请选择要审批的记录')
      return
    }
    
    if (!approvalTargetConsultant) {
      message.warning('请输入目标咨询师')
      return
    }
    
    try {
      const result = await api.approveTransfer(
        {
          record_ids: selectedApprovalIds,
          approved: true,
          opinion: approvalOpinion || '同意',
        },
        approvalTargetConsultant
      )
      
      notification.success({ message: '审批完成', description: `已通过 ${result.approved_count} 条`, placement: 'topRight', duration: 3 })
      setSelectedApprovalIds([])
      setApprovalOpinion('')
      setApprovalTargetConsultant('')
      loadPendingApprovals()
      loadStatistics()
    } catch (error: any) {
      notification.error({ message: '审批失败', description: error.response?.data?.detail || '请检查网络连接或联系管理员', placement: 'topRight', duration: 4 })
    }
  }
  
  // 审批拒绝
  const handleReject = async () => {
    if (selectedApprovalIds.length === 0) {
      message.warning('请选择要审批的记录')
      return
    }
    
    if (!approvalOpinion) {
      message.warning('请填写拒绝原因')
      return
    }
    
    try {
      const result = await api.approveTransfer(
        {
          record_ids: selectedApprovalIds,
          approved: false,
          opinion: approvalOpinion,
        },
        ''
      )
      
      notification.success({ message: '已拒绝', description: `已拒绝 ${result.rejected_count} 条`, placement: 'topRight', duration: 3 })
      setSelectedApprovalIds([])
      setApprovalOpinion('')
      loadPendingApprovals()
    } catch (error: any) {
      notification.error({ message: '操作失败', description: error.response?.data?.detail || '请检查网络连接或联系管理员', placement: 'topRight', duration: 4 })
    }
  }
  
  // 预览表格列
  const previewColumns: ColumnsType<any> = [
    { title: '记录ID', dataIndex: '记录ID', width: 80 },
    { title: '电话', dataIndex: '电话', width: 120 },
    { title: '姓名', dataIndex: '咨询者姓名', width: 100 },
    { title: '神殿', dataIndex: '神殿', width: 100 },
    { 
      title: '登记日期', 
      dataIndex: '登记日期', 
      width: 120,
      render: (v) => v ? dayjs(v).format('YYYY-MM-DD') : '-'
    },
    { title: '状态', dataIndex: '状态', width: 80 },
  ]
  
  // 待审批表格列
  const pendingColumns: ColumnsType<PendingApprovalRecord> = [
    { title: '记录ID', dataIndex: 'record_id', width: 80 },
    { title: '电话', dataIndex: 'phone', width: 120 },
    { title: '姓名', dataIndex: 'name', width: 100 },
    { title: '原咨询师', dataIndex: 'source_consultant', width: 100 },
    { 
      title: '原神殿', 
      dataIndex: 'source_campus', 
      width: 100,
      render: (v) => <Tag color="blue">{v}</Tag>
    },
    { 
      title: '目标神殿', 
      dataIndex: 'target_campus', 
      width: 100,
      render: (v) => <Tag color="green">{v}</Tag>
    },
    { 
      title: '申请时间', 
      dataIndex: 'apply_time', 
      width: 120,
      render: (v) => v ? dayjs(v).format('MM-DD HH:mm') : '-'
    },
    { title: '申请人', dataIndex: 'applicant', width: 80 },
    { title: '原因', dataIndex: 'reason', ellipsis: true },
  ]
  
  // 历史记录表格列
  const historyColumns: ColumnsType<TransferRecordHistory> = [
    { title: '记录ID', dataIndex: 'record_id', width: 80 },
    { title: '电话', dataIndex: 'phone', width: 120 },
    { title: '姓名', dataIndex: 'name', width: 100 },
    { 
      title: '原咨询师', 
      dataIndex: 'original_consultant', 
      width: 100,
      render: (v) => <Tag color="orange">{v}</Tag>
    },
    { 
      title: '现咨询师', 
      dataIndex: 'target_consultant', 
      width: 100,
      render: (v) => <Tag color="green">{v}</Tag>
    },
    { 
      title: '转量时间', 
      dataIndex: 'transfer_time', 
      width: 140,
      render: (v) => v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-'
    },
    { title: '操作人', dataIndex: 'operator', width: 80 },
    { 
      title: '类型', 
      dataIndex: 'transfer_type', 
      width: 100,
      render: (v) => (
        <Tag color={v === '跨神殿咨询师转量' ? 'red' : 'blue'}>{v}</Tag>
      )
    },
    { title: '原因', dataIndex: 'reason', ellipsis: true },
  ]
  
  // 渲染转量操作面板
  const renderTransferPanel = () => (
    <Card title="批量转量" size="small">
      <Alert
        message="转量说明"
        description={
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li>批量把某个咨询师的所有咨询量转给另一个咨询师</li>
            <li>转量后会标记"转自XXX"，方便后续分析数据指标</li>
            <li>同神殿转量直接执行，跨神殿转量需要审批</li>
          </ul>
        }
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />
      
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <div style={{ marginBottom: 8 }}>原咨询师</div>
          <AutoComplete
            style={{ width: '100%' }}
            placeholder="选择或输入原咨询师"
            value={sourceConsultant}
            onChange={setSourceConsultant}
            filterOption={(inputValue, option) =>
              (option?.label as string)?.toLowerCase().includes(inputValue.toLowerCase()) ?? false
            }
            options={consultants.map(c => {
              const campusLabel = c.campus || '未分配'
              const countLabel = typeof c.record_count === 'number' ? ` - ${c.record_count}条` : ''
              return {
                value: c.name,
                label: `${c.name} (${campusLabel})${countLabel}`,
              }
            })}
          />
        </Col>
        
        <Col span={2} style={{ textAlign: 'center', paddingTop: 32 }}>
          <SwapOutlined style={{ fontSize: 20 }} />
        </Col>
        
        <Col span={6}>
          <div style={{ marginBottom: 8 }}>目标咨询师</div>
          <AutoComplete
            style={{ width: '100%' }}
            placeholder="选择或输入目标咨询师"
            value={targetConsultant}
            onChange={setTargetConsultant}
            filterOption={(inputValue, option) =>
              (option?.label as string)?.toLowerCase().includes(inputValue.toLowerCase()) ?? false
            }
            options={consultants
              .filter(c => c.name !== sourceConsultant)
              .map(c => {
                const campusLabel = c.campus || '未分配'
                const countLabel = typeof c.record_count === 'number' ? ` - ${c.record_count}条` : ''
                return {
                  value: c.name,
                  label: `${c.name} (${campusLabel})${countLabel}`,
                }
              })}
          />
        </Col>
        
        <Col span={5}>
          <div style={{ marginBottom: 8 }}>目标神殿（可选）</div>
          <Select
            style={{ width: '100%' }}
            placeholder="跨神殿转量时选择"
            value={targetCampus}
            onChange={setTargetCampus}
            allowClear
          >
            {campuses.map(c => (
              <Select.Option key={c.id} value={c.name}>{c.name}</Select.Option>
            ))}
          </Select>
        </Col>
        
        <Col span={5} style={{ paddingTop: 24 }}>
          <Button
            type="primary"
            icon={<UserSwitchOutlined />}
            onClick={handlePreview}
            loading={previewLoading}
          >
            预览转量
          </Button>
        </Col>
      </Row>
      
      {previewData && (
        <Card size="small" title={`预览结果 (共 ${previewData.total_count} 条)`}>
          {previewData.is_cross_campus && (
            <Alert
              message="跨神殿转量"
              description="检测到跨神殿转量，提交后需要目标神殿审批人审批通过后才会生效"
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}
          
          <Table
            columns={previewColumns}
            dataSource={previewData.records}
            rowKey="记录ID"
            size="small"
            scroll={{ y: 300 }}
            pagination={false}
          />
          
          <div style={{ marginTop: 16 }}>
            <Button
              type="primary"
              danger
              icon={<SwapOutlined />}
              onClick={() => setShowConfirmModal(true)}
              disabled={previewData.total_count === 0}
            >
              确认转量
            </Button>
          </div>
        </Card>
      )}
      
      <Modal
        title="确认转量"
        open={showConfirmModal}
        onCancel={() => setShowConfirmModal(false)}
        onOk={handleTransfer}
        okText="确认转量"
        cancelText="取消"
        confirmLoading={transferLoading}
      >
        <Descriptions column={1} size="small">
          <Descriptions.Item label="原咨询师">{sourceConsultant}</Descriptions.Item>
          <Descriptions.Item label="目标咨询师">{targetConsultant}</Descriptions.Item>
          {targetCampus && (
            <Descriptions.Item label="目标神殿">{targetCampus}</Descriptions.Item>
          )}
          <Descriptions.Item label="转量数量">{previewData?.total_count || 0} 条</Descriptions.Item>
        </Descriptions>
        
        <div style={{ marginTop: 16 }}>
          <div style={{ marginBottom: 8 }}>转量原因 <span style={{ color: 'red' }}>*</span></div>
          <TextArea
            value={transferReason}
            onChange={e => setTransferReason(e.target.value)}
            placeholder="请输入转量原因"
            rows={3}
          />
        </div>
      </Modal>
    </Card>
  )
  
  // 渲染单个转量面板
  const renderSingleTransferPanel = () => (
    <Card title="单个转量" size="small">
      <Alert
        message="单个转量说明"
        description={
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li>通过记录ID转量指定的咨询量给其他咨询师</li>
            <li>支持多个记录ID，用逗号分隔（例如：123,456,789）</li>
            <li>转量后会标记"转自XXX"，方便后续分析数据指标</li>
            <li>同神殿转量直接执行，跨神殿转量需要审批</li>
          </ul>
        }
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />
      
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={24}>
          <div style={{ marginBottom: 8 }}>记录ID（必填，多个ID用逗号分隔）</div>
          <Input
            placeholder="例如：123 或 123,456,789"
            value={singleRecordId}
            onChange={(e) => setSingleRecordId(e.target.value)}
          />
        </Col>
      </Row>
      
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <div style={{ marginBottom: 8 }}>原咨询师</div>
          <AutoComplete
            style={{ width: '100%' }}
            placeholder="选择或输入原咨询师"
            value={singleSourceConsultant}
            onChange={setSingleSourceConsultant}
            filterOption={(inputValue, option) =>
              (option?.label as string)?.toLowerCase().includes(inputValue.toLowerCase()) ?? false
            }
            options={consultants.map(c => {
              const campusLabel = c.campus || '未分配'
              const countLabel = typeof c.record_count === 'number' ? ` - ${c.record_count}条` : ''
              return {
                value: c.name,
                label: `${c.name} (${campusLabel})${countLabel}`,
              }
            })}
          />
        </Col>
        
        <Col span={2} style={{ textAlign: 'center', paddingTop: 32 }}>
          <SwapOutlined style={{ fontSize: 20 }} />
        </Col>
        
        <Col span={8}>
          <div style={{ marginBottom: 8 }}>目标咨询师</div>
          <AutoComplete
            style={{ width: '100%' }}
            placeholder="选择或输入目标咨询师"
            value={singleTargetConsultant}
            onChange={setSingleTargetConsultant}
            filterOption={(inputValue, option) =>
              (option?.label as string)?.toLowerCase().includes(inputValue.toLowerCase()) ?? false
            }
            options={consultants
              .filter(c => c.name !== singleSourceConsultant)
              .map(c => {
                const campusLabel = c.campus || '未分配'
                const countLabel = typeof c.record_count === 'number' ? ` - ${c.record_count}条` : ''
                return {
                  value: c.name,
                  label: `${c.name} (${campusLabel})${countLabel}`,
                }
              })}
          />
        </Col>
        
        <Col span={6}>
          <div style={{ marginBottom: 8 }}>目标神殿（可选）</div>
          <Select
            style={{ width: '100%' }}
            placeholder="跨神殿转量时选择"
            value={singleTargetCampus}
            onChange={setSingleTargetCampus}
            allowClear
          >
            {campuses.map(c => (
              <Select.Option key={c.name} value={c.name}>{c.name}</Select.Option>
            ))}
          </Select>
        </Col>
      </Row>
      
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={24}>
          <div style={{ marginBottom: 8 }}>转量原因</div>
          <TextArea
            value={singleTransferReason}
            onChange={e => setSingleTransferReason(e.target.value)}
            placeholder="请输入转量原因"
            rows={3}
          />
        </Col>
      </Row>
      
      <Button
        type="primary"
        icon={<SwapOutlined />}
        onClick={handleSingleTransfer}
        loading={singleTransferLoading}
      >
        执行转量
      </Button>
    </Card>
  )
  
  // 渲染审批面板
  const renderApprovalPanel = () => (
    <Card 
      title={
        <Space>
          待审批记录
          <Badge count={pendingApprovals.length} />
        </Space>
      } 
      size="small"
    >
      <Table
        columns={pendingColumns}
        dataSource={pendingApprovals}
        rowKey="record_id"
        size="small"
        loading={pendingLoading}
        rowSelection={{
          selectedRowKeys: selectedApprovalIds,
          onChange: (keys) => setSelectedApprovalIds(keys as number[]),
        }}
        pagination={{ pageSize: 10 }}
      />
      
      {selectedApprovalIds.length > 0 && (
        <Card size="small" style={{ marginTop: 16 }}>
          <Row gutter={16} align="middle">
            <Col span={6}>
              <div style={{ marginBottom: 4 }}>目标咨询师</div>
              <Input
                value={approvalTargetConsultant}
                onChange={e => setApprovalTargetConsultant(e.target.value)}
                placeholder="输入目标咨询师姓名"
              />
            </Col>
            <Col span={10}>
              <div style={{ marginBottom: 4 }}>审批意见</div>
              <Input
                value={approvalOpinion}
                onChange={e => setApprovalOpinion(e.target.value)}
                placeholder="输入审批意见"
              />
            </Col>
            <Col span={8}>
              <Space style={{ marginTop: 20 }}>
                <Popconfirm
                  title={`确认通过 ${selectedApprovalIds.length} 条转量申请？`}
                  onConfirm={handleApprove}
                >
                  <Button type="primary" icon={<CheckCircleOutlined />}>
                    批准 ({selectedApprovalIds.length})
                  </Button>
                </Popconfirm>
                <Popconfirm
                  title={`确认拒绝 ${selectedApprovalIds.length} 条转量申请？`}
                  onConfirm={handleReject}
                >
                  <Button danger icon={<CloseCircleOutlined />}>
                    拒绝 ({selectedApprovalIds.length})
                  </Button>
                </Popconfirm>
              </Space>
            </Col>
          </Row>
        </Card>
      )}
    </Card>
  )
  
  // 渲染历史记录面板
  const renderHistoryPanel = () => (
    <Card title="转量历史" size="small">
      <Table
        columns={historyColumns}
        dataSource={historyRecords}
        rowKey="record_id"
        size="small"
        loading={historyLoading}
        pagination={{ pageSize: 20 }}
      />
    </Card>
  )
  
  // 渲染统计面板
  const renderStatisticsPanel = () => (
    <Card title="转量统计" size="small" loading={statisticsLoading}>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Statistic
            title="总转量次数"
            value={statistics?.total_transfers || 0}
            suffix="次"
          />
        </Col>
      </Row>
      
      <Row gutter={16}>
        <Col span={12}>
          <Card size="small" title="转出统计（按原咨询师）">
            {statistics?.transfer_out.map(item => (
              <div key={item.consultant} style={{ marginBottom: 4 }}>
                <Tag color="orange">{item.consultant}</Tag>
                <span style={{ marginLeft: 8 }}>{item.count} 条</span>
              </div>
            ))}
          </Card>
        </Col>
        <Col span={12}>
          <Card size="small" title="转入统计（按现咨询师）">
            {statistics?.transfer_in.map(item => (
              <div key={item.consultant} style={{ marginBottom: 4 }}>
                <Tag color="green">{item.consultant}</Tag>
                <span style={{ marginLeft: 8 }}>{item.count} 条</span>
              </div>
            ))}
          </Card>
        </Col>
      </Row>
    </Card>
  )
  
  const tabItems = [
    {
      key: 'transfer',
      label: (
        <span>
          <SwapOutlined />
          批量转量
        </span>
      ),
      children: renderTransferPanel(),
    },
    {
      key: 'single',
      label: (
        <span>
          <UserSwitchOutlined />
          单个转量
        </span>
      ),
      children: renderSingleTransferPanel(),
    },
    {
      key: 'approval',
      label: (
        <span>
          <AuditOutlined />
          审批管理
          {pendingApprovals.length > 0 && (
            <Badge count={pendingApprovals.length} style={{ marginLeft: 8 }} />
          )}
        </span>
      ),
      children: renderApprovalPanel(),
    },
    {
      key: 'history',
      label: (
        <span>
          <HistoryOutlined />
          转量历史
        </span>
      ),
      children: renderHistoryPanel(),
    },
    {
      key: 'statistics',
      label: (
        <span>
          <ExclamationCircleOutlined />
          转量统计
        </span>
      ),
      children: renderStatisticsPanel(),
    },
  ]
  
  return (
    <div>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
      />
    </div>
  )
}
