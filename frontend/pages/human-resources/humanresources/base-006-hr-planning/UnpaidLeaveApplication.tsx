import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  App,
  AutoComplete,
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Form,
  Input,
  List,
  Modal,
  Popconfirm,
  Radio,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  CheckOutlined,
  CloseOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PauseCircleOutlined,
  PlusOutlined,
  PrinterOutlined,
  SearchOutlined,
  SendOutlined,
} from '@ant-design/icons'
import dayjs, { type Dayjs } from 'dayjs'
import { useAuthStore } from '@/stores/authStore'
import { useCampusStore } from '@/stores/campusStore'
import {
  approveUnpaidLeaveApplication,
  createUnpaidLeaveApplication,
  deleteUnpaidLeaveApplication,
  getUnpaidLeaveApplication,
  listUnpaidLeaveApplications,
  previewUnpaidLeaveApproverCandidates,
  rejectUnpaidLeaveApplication,
  submitUnpaidLeaveApplication,
  type UnpaidLeaveApplicationPayload,
  type UnpaidLeaveApplicationRecord,
  type UnpaidLeaveApprovalFlowStep,
  type UnpaidLeaveApprovalPreviewStage,
  type UnpaidLeaveStatus,
  updateUnpaidLeaveApplication,
} from '@/services/humanresources/unpaidLeaveApplication'
import {
  ApproverSelectionSection,
  mergeApproverSelections,
  normalizeSelectedApproverMap,
} from '@/components/human-resources/ApproverSelectionSection'
import { fetchUserPermissions, type UserPermissionInfo } from '@/services/configMaster'

const { Text, Title } = Typography
const { TextArea } = Input

const STATUS_COLOR_MAP: Record<string, string> = {
  draft: 'default',
  pending: 'processing',
  approved: 'success',
  rejected: 'error',
}

const MANAGEMENT_CENTER_CAMPUS_VALUES = ['最高议事厅', '最高议事厅神殿']

type ErrorWithResponse = {
  response?: {
    data?: {
      detail?: string
    }
  }
  message?: string
}

const getErrorMessage = (error: unknown, fallback: string) => {
  const maybeError = error as ErrorWithResponse
  return maybeError.response?.data?.detail || maybeError.message || fallback
}

const isApprovalStateChangedError = (error: unknown) => {
  const detail = getErrorMessage(error, '')
  return ['当前用户不是本阶段审批人', '当前用户已处理过本阶段审批', '当前申请不在审批中'].some(
    (messageText) => detail.includes(messageText),
  )
}

const getActionLabel = (value?: string | null) => {
  const actionMap: Record<string, string> = {
    submit: '提交',
    approve: '通过',
    reject: '驳回',
  }
  return actionMap[value || ''] || value || '-'
}

const normalizeText = (value?: string | null) => (value || '').replace(/\s+/g, '')

const isManagementCenterCampus = (campus?: string | null) =>
  !!campus && MANAGEMENT_CENTER_CAMPUS_VALUES.includes(campus.trim())

const campusMatchesScope = (userCampus?: string | null, selectedCampus?: string | null) => {
  if (!selectedCampus) return true
  if (!userCampus) return true
  if (isManagementCenterCampus(selectedCampus)) return isManagementCenterCampus(userCampus)
  return userCampus === selectedCampus
}

const formatDate = (value?: string | null, pattern = 'YYYY-MM-DD') =>
  value ? dayjs(value).format(pattern) : '-'

type EditModalProps = {
  open: boolean
  loading: boolean
  campus?: string | null
  currentUserName?: string | null
  currentUserDepartment?: string | null
  currentUserPosition?: string | null
  currentUserEmail?: string | null
  currentUserPhone?: string | null
  editingRecord: UnpaidLeaveApplicationRecord | null
  users: UserPermissionInfo[]
  onCancel: () => void
  onOk: (payload: UnpaidLeaveApplicationPayload) => Promise<void>
}

const EditModal: React.FC<EditModalProps> = ({
  open,
  loading,
  campus,
  currentUserName,
  currentUserDepartment,
  currentUserPosition,
  currentUserEmail,
  currentUserPhone,
  editingRecord,
  users,
  onCancel,
  onOk,
}) => {
  const [form] = Form.useForm()
  const selectedCampus = Form.useWatch('campus', form)
  const selectedDepartment = Form.useWatch('department', form)
  const selectedPosition = Form.useWatch('position', form)
  const [approverPreview, setApproverPreview] = useState<UnpaidLeaveApprovalPreviewStage[]>([])
  const [approverPreviewLoading, setApproverPreviewLoading] = useState(false)

  const campusUsers = useMemo(
    () => users.filter((item) => campusMatchesScope(item.campus, selectedCampus || campus)),
    [campus, selectedCampus, users],
  )

  const departmentOptions = useMemo(() => {
    const values = new Set<string>()
    campusUsers.forEach((item) => item.department && values.add(item.department))
    if (currentUserDepartment) values.add(currentUserDepartment)
    if (editingRecord?.department) values.add(editingRecord.department)
    return Array.from(values).sort((a, b) => a.localeCompare(b, 'zh-CN'))
  }, [campusUsers, currentUserDepartment, editingRecord])

  const positionOptions = useMemo(() => {
    const values = new Set<string>()
    campusUsers.forEach((item) => {
      if (!item.position) return
      if (
        !selectedDepartment ||
        normalizeText(item.department) === normalizeText(selectedDepartment)
      ) {
        values.add(item.position)
      }
    })
    if (currentUserPosition) values.add(currentUserPosition)
    if (editingRecord?.position) values.add(editingRecord.position)
    return Array.from(values)
      .sort((a, b) => a.localeCompare(b, 'zh-CN'))
      .map((value) => ({ value }))
  }, [campusUsers, currentUserPosition, editingRecord, selectedDepartment])

  useEffect(() => {
    if (!open) {
      form.resetFields()
      return
    }

    if (editingRecord) {
      form.setFieldsValue({
        fillDate: dayjs(editingRecord.fillDate),
        campus: editingRecord.campus,
        name: editingRecord.name,
        gender: editingRecord.gender || undefined,
        department: editingRecord.department,
        position: editingRecord.position,
        entryDate: dayjs(editingRecord.entryDate),
        birthDate: editingRecord.birthDate ? dayjs(editingRecord.birthDate) : undefined,
        phone: editingRecord.phone || undefined,
        email: editingRecord.email || undefined,
        homeAddress: editingRecord.homeAddress || undefined,
        currentAddress: editingRecord.currentAddress || undefined,
        reason: editingRecord.reason,
        selectedApproverUserIds: editingRecord.selectedApproverUserIds || {},
      })
      return
    }

    form.setFieldsValue({
      fillDate: dayjs(),
      campus: campus || undefined,
      name: currentUserName || undefined,
      department: currentUserDepartment || undefined,
      position: currentUserPosition || undefined,
      entryDate: undefined,
      birthDate: undefined,
      phone: currentUserPhone || undefined,
      email: currentUserEmail || undefined,
      selectedApproverUserIds: {},
    })
  }, [
    campus,
    currentUserDepartment,
    currentUserEmail,
    currentUserName,
    currentUserPhone,
    currentUserPosition,
    editingRecord,
    form,
    open,
  ])

  useEffect(() => {
    if (!open) {
      setApproverPreview([])
      setApproverPreviewLoading(false)
      return
    }

    const normalizedCampus = typeof selectedCampus === 'string' ? selectedCampus.trim() : ''
    const normalizedDepartment =
      typeof selectedDepartment === 'string' ? selectedDepartment.trim() : ''
    const normalizedPosition = typeof selectedPosition === 'string' ? selectedPosition.trim() : ''

    if (!normalizedCampus || !normalizedDepartment || !normalizedPosition) {
      setApproverPreview([])
      form.setFieldValue(
        'selectedApproverUserIds',
        normalizeSelectedApproverMap(form.getFieldValue('selectedApproverUserIds')),
      )
      return
    }

    let active = true
    setApproverPreviewLoading(true)
    previewUnpaidLeaveApproverCandidates({
      campus: normalizedCampus,
      department: normalizedDepartment,
      position: normalizedPosition,
    })
      .then((stages) => {
        if (!active) return
        setApproverPreview(stages)
        form.setFieldValue(
          'selectedApproverUserIds',
          mergeApproverSelections(
            stages,
            form.getFieldValue('selectedApproverUserIds'),
            editingRecord?.selectedApproverUserIds,
            { includeRecommended: false },
          ),
        )
      })
      .catch((error) => {
        if (!active) return
        console.error('加载停薪留职审批人候选失败', error)
        message.error(getErrorMessage(error, '加载停薪留职审批人候选失败'))
        setApproverPreview([])
      })
      .finally(() => {
        if (active) {
          setApproverPreviewLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [editingRecord?.id, form, open, selectedCampus, selectedDepartment, selectedPosition])

  const handleSubmit = async () => {
    const values = await form.validateFields()
    await onOk({
      fillDate: (values.fillDate as Dayjs).format('YYYY-MM-DD'),
      campus: values.campus,
      name: values.name,
      gender: values.gender || undefined,
      department: values.department,
      position: values.position,
      entryDate: (values.entryDate as Dayjs).format('YYYY-MM-DD'),
      birthDate: values.birthDate
        ? (values.birthDate as Dayjs).startOf('month').format('YYYY-MM-DD')
        : undefined,
      phone: values.phone || undefined,
      email: values.email || undefined,
      homeAddress: values.homeAddress || undefined,
      currentAddress: values.currentAddress || undefined,
      reason: values.reason,
      selectedApproverUserIds: normalizeSelectedApproverMap(values.selectedApproverUserIds),
    })
  }

  return (
    <Modal
      title={editingRecord ? '编辑停薪留职申请' : '新建停薪留职申请'}
      open={open}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={loading}
      okText="保存"
      cancelText="取消"
      width={980}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="fillDate"
              label="填表日期"
              rules={[{ required: true, message: '请选择填表日期' }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="campus"
              label="所属神殿"
              rules={[{ required: true, message: '请填写所属神殿' }]}
            >
              <Input disabled placeholder="当前神殿" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
              <Input placeholder="请输入姓名" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="gender"
              label="性别"
              rules={[{ required: true, message: '请选择性别' }]}
            >
              <Radio.Group>
                <Radio value="男">男</Radio>
                <Radio value="女">女</Radio>
              </Radio.Group>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="department"
              label="部门"
              rules={[{ required: true, message: '请输入部门' }]}
            >
              <AutoComplete
                options={departmentOptions.map((value) => ({ value }))}
                placeholder="支持输入或选择部门"
                filterOption={(inputValue, option) =>
                  String(option?.value || '')
                    .toLowerCase()
                    .includes(inputValue.toLowerCase())
                }
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="position"
              label="职位"
              rules={[{ required: true, message: '请输入职位' }]}
            >
              <AutoComplete
                options={positionOptions}
                placeholder="支持输入或选择职位"
                filterOption={(inputValue, option) =>
                  String(option?.value || '')
                    .toLowerCase()
                    .includes(inputValue.toLowerCase())
                }
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="entryDate"
              label="入职时间"
              rules={[{ required: true, message: '请选择入职时间' }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="birthDate" label="出生年月">
              <DatePicker picker="month" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="phone" label="联系方式">
              <Input placeholder="请输入联系方式" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="email" label="电子邮箱">
              <Input placeholder="请输入电子邮箱" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="homeAddress" label="家庭住址">
              <Input placeholder="请输入家庭住址" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="currentAddress" label="现住址">
          <Input placeholder="请输入现住址" />
        </Form.Item>

        <Form.Item
          name="reason"
          label="申请停薪留职的理由以及期限"
          rules={[{ required: true, message: '请填写申请理由及期限' }]}
        >
          <TextArea rows={5} placeholder="请详细说明申请停薪留职的理由以及期限" />
        </Form.Item>

        <ApproverSelectionSection
          previewStages={approverPreview}
          loading={approverPreviewLoading}
          title="审批人选择"
          description="系统会根据部门、岗位和组织层级列出候选审批人；请逐环节选择实际审批人。"
          emptyText="请先确认部门和岗位，系统会自动列出候选审批人。"
          recommendedHintMode="candidate"
        />
      </Form>
    </Modal>
  )
}

type ApprovalActionModalProps = {
  open: boolean
  loading: boolean
  type: 'approve' | 'reject'
  record: UnpaidLeaveApplicationRecord | null
  onCancel: () => void
  onOk: (comment: string) => Promise<void>
}

const ApprovalActionModal: React.FC<ApprovalActionModalProps> = ({
  open,
  loading,
  type,
  record,
  onCancel,
  onOk,
}) => {
  const [comment, setComment] = useState(type === 'approve' ? '通过' : '')

  useEffect(() => {
    if (open) {
      setComment(type === 'approve' ? '通过' : '')
    }
  }, [open, type, record?.id])

  return (
    <Modal
      title={type === 'approve' ? '审批通过' : '审批驳回'}
      open={open}
      onCancel={onCancel}
      onOk={() => void onOk(comment)}
      confirmLoading={loading}
      okText={type === 'approve' ? '确认通过' : '确认驳回'}
      cancelText="取消"
      destroyOnClose
    >
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        <Text>
          当前单据：{record?.applicationNo || '-'} / {record?.name || '-'}
        </Text>
        <TextArea
          rows={5}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder={type === 'approve' ? '可填写审批意见' : '请填写驳回原因'}
        />
      </Space>
    </Modal>
  )
}

const DetailModal: React.FC<{
  open: boolean
  record: UnpaidLeaveApplicationRecord | null
  onCancel: () => void
}> = ({ open, record, onCancel }) => (
  <Modal
    title="停薪留职申请详情"
    open={open}
    onCancel={onCancel}
    footer={null}
    width={960}
    destroyOnClose
  >
    {!record ? null : (
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Descriptions bordered size="small" column={2}>
          <Descriptions.Item label="申请单号">{record.applicationNo}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={STATUS_COLOR_MAP[record.status]}>{record.statusLabel}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="姓名">{record.name}</Descriptions.Item>
          <Descriptions.Item label="性别">{record.gender || '-'}</Descriptions.Item>
          <Descriptions.Item label="所属神殿">{record.campus}</Descriptions.Item>
          <Descriptions.Item label="部门/职位">
            {record.department} / {record.position}
          </Descriptions.Item>
          <Descriptions.Item label="填表日期">{formatDate(record.fillDate)}</Descriptions.Item>
          <Descriptions.Item label="入职时间">{formatDate(record.entryDate)}</Descriptions.Item>
          <Descriptions.Item label="出生年月">
            {formatDate(record.birthDate, 'YYYY-MM')}
          </Descriptions.Item>
          <Descriptions.Item label="联系方式">{record.phone || '-'}</Descriptions.Item>
          <Descriptions.Item label="电子邮箱">{record.email || '-'}</Descriptions.Item>
          <Descriptions.Item label="当前阶段">{record.currentStageLabel || '-'}</Descriptions.Item>
          <Descriptions.Item label="家庭住址" span={2}>
            {record.homeAddress || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="现住址" span={2}>
            {record.currentAddress || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="申请理由及期限" span={2}>
            {record.reason}
          </Descriptions.Item>
          <Descriptions.Item label="驳回原因" span={2}>
            {record.rejectionReason || '-'}
          </Descriptions.Item>
        </Descriptions>

        <Card size="small" title="审批流">
          <List
            dataSource={record.approvalFlow}
            renderItem={(item: UnpaidLeaveApprovalFlowStep) => (
              <List.Item>
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                  <Space>
                    <Text strong>{item.stageLabel}</Text>
                    <Tag
                      color={
                        item.status === 'completed'
                          ? 'success'
                          : item.status === 'rejected'
                            ? 'error'
                            : item.status === 'current'
                              ? 'processing'
                              : 'default'
                      }
                    >
                      {item.statusLabel}
                    </Tag>
                  </Space>
                  <Text type="secondary">
                    审批人：{item.approvers.map((approver) => approver.name).join('、') || '-'}
                  </Text>
                  <Text type="secondary">处理结果：{item.actionLabel || '-'}</Text>
                  <Text type="secondary">审批意见：{item.comment || '-'}</Text>
                  <Text type="secondary">处理人：{item.actedByName || '-'}</Text>
                  <Text type="secondary">处理时间：{formatDate(item.actedAt || undefined)}</Text>
                </Space>
              </List.Item>
            )}
          />
        </Card>

        <Card size="small" title="审批动作记录">
          <List
            dataSource={record.approvalActions}
            renderItem={(item) => (
              <List.Item>
                <Space direction="vertical" size={4}>
                  <Text strong>
                    {item.stageLabel} / {getActionLabel(item.action)}
                  </Text>
                  <Text type="secondary">审批人：{item.approverName || '-'}</Text>
                  <Text type="secondary">审批意见：{item.comment || '-'}</Text>
                  <Text type="secondary">时间：{formatDate(item.createdAt)}</Text>
                </Space>
              </List.Item>
            )}
          />
        </Card>
      </Space>
    )}
  </Modal>
)

const PrintPreview: React.FC<{ record: UnpaidLeaveApplicationRecord }> = ({ record }) => {
  const cell: React.CSSProperties = {
    border: '1px solid #333',
    padding: '8px 10px',
    fontSize: 13,
    lineHeight: 1.8,
    verticalAlign: 'top',
  }
  const labelCell: React.CSSProperties = {
    ...cell,
    background: '#f5f5f5',
    fontWeight: 600,
    textAlign: 'center',
  }

  const flowMap = record.approvalFlow.reduce<Record<string, UnpaidLeaveApprovalFlowStep>>(
    (result, item) => {
      result[item.stage] = item
      return result
    },
    {},
  )

  const renderApprovalRow = (title: string, step?: UnpaidLeaveApprovalFlowStep) => (
    <tr>
      <td style={{ ...labelCell, width: '15%' }}>{title}</td>
      <td colSpan={5} style={{ ...cell, minHeight: 80 }}>
        <div style={{ whiteSpace: 'pre-wrap', minHeight: 40 }}>{step?.comment || ''}</div>
        <div style={{ textAlign: 'right', marginTop: 12 }}>
          <span>负责人：{step?.actedByName || '________'}</span>
          <br />
          <span>日期：{step?.actedAt ? dayjs(step.actedAt).format('YYYY-MM-DD') : '________'}</span>
        </div>
      </td>
    </tr>
  )

  return (
    <div style={{ padding: 16, background: '#fff' }}>
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>
          停薪留职申请表
        </Title>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <tbody>
          <tr>
            <td style={labelCell}>姓名</td>
            <td style={cell}>{record.name}</td>
            <td style={labelCell}>性别</td>
            <td style={cell}>{record.gender || '-'}</td>
            <td style={labelCell}>填表日期</td>
            <td style={cell}>{formatDate(record.fillDate)}</td>
          </tr>
          <tr>
            <td style={labelCell}>所属神殿</td>
            <td style={cell}>{record.campus}</td>
            <td style={labelCell}>部门</td>
            <td style={cell}>{record.department}</td>
            <td style={labelCell}>职位</td>
            <td style={cell}>{record.position}</td>
          </tr>
          <tr>
            <td style={labelCell}>入职时间</td>
            <td style={cell}>{formatDate(record.entryDate)}</td>
            <td style={labelCell}>出生年月</td>
            <td style={cell}>{formatDate(record.birthDate, 'YYYY-MM')}</td>
            <td style={labelCell}>联系方式</td>
            <td style={cell}>{record.phone || '-'}</td>
          </tr>
          <tr>
            <td style={labelCell}>电子邮箱</td>
            <td colSpan={2} style={cell}>
              {record.email || '-'}
            </td>
            <td style={labelCell}>家庭住址</td>
            <td colSpan={2} style={cell}>
              {record.homeAddress || '-'}
            </td>
          </tr>
          <tr>
            <td style={labelCell}>现住址</td>
            <td colSpan={5} style={cell}>
              {record.currentAddress || '-'}
            </td>
          </tr>
          <tr>
            <td style={labelCell}>申请停薪留职的理由以及期限</td>
            <td colSpan={5} style={{ ...cell, minHeight: 120, whiteSpace: 'pre-wrap' }}>
              {record.reason}
            </td>
          </tr>
          {renderApprovalRow('部门主管意见', flowMap.department_head)}
          {renderApprovalRow('业务条线总监意见', flowMap.biz_director)}
          {renderApprovalRow('人资部意见', flowMap.hr)}
          {renderApprovalRow('董事长意见', flowMap.chairman)}
        </tbody>
      </table>
    </div>
  )
}

const UnpaidLeaveApplicationPage: React.FC = () => {
  const { user: currentUser } = useAuthStore()
  const { currentCampus } = useCampusStore()
  const [loading, setLoading] = useState(false)
  const [records, setRecords] = useState<UnpaidLeaveApplicationRecord[]>([])
  const [users, setUsers] = useState<UserPermissionInfo[]>([])
  const [statusFilter, setStatusFilter] = useState<UnpaidLeaveStatus | undefined>()
  const [keyword, setKeyword] = useState('')
  const [editOpen, setEditOpen] = useState(false)
  const [editLoading, setEditLoading] = useState(false)
  const [editingRecord, setEditingRecord] = useState<UnpaidLeaveApplicationRecord | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailRecord, setDetailRecord] = useState<UnpaidLeaveApplicationRecord | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [printOpen, setPrintOpen] = useState(false)
  const [printRecord, setPrintRecord] = useState<UnpaidLeaveApplicationRecord | null>(null)
  const [printLoading, setPrintLoading] = useState(false)
  const [actionState, setActionState] = useState<{
    open: boolean
    type: 'approve' | 'reject'
    record: UnpaidLeaveApplicationRecord | null
  }>({
    open: false,
    type: 'approve',
    record: null,
  })
  const [actionLoading, setActionLoading] = useState(false)

  const activeCampus = currentCampus || currentUser?.campus || undefined

  const currentUserInfo = useMemo(
    () => users.find((item) => String(item.user_id) === currentUser?.id),
    [currentUser?.id, users],
  )

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [list, campusUsers] = await Promise.all([
        listUnpaidLeaveApplications({
          campus: activeCampus || undefined,
          status: statusFilter,
        }),
        fetchUserPermissions(),
      ])
      setRecords(list)
      setUsers(campusUsers.filter((item) => item.status === 'active'))
    } catch (error) {
      console.error('加载停薪留职申请失败', error)
      message.error(getErrorMessage(error, '加载停薪留职申请失败'))
    } finally {
      setLoading(false)
    }
  }, [activeCampus, statusFilter])

  useEffect(() => {
    loadData()
  }, [loadData])

  const filteredRecords = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase()
    if (!normalizedKeyword) return records
    return records.filter((item) =>
      [
        item.applicationNo,
        item.name,
        item.department,
        item.position,
        item.campus,
        item.phone,
        item.currentStageLabel,
        item.statusLabel,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedKeyword)),
    )
  }, [keyword, records])

  const openCreateModal = () => {
    setEditingRecord(null)
    setEditOpen(true)
  }

  const openEditModal = (record: UnpaidLeaveApplicationRecord) => {
    setEditingRecord(record)
    setEditOpen(true)
  }

  const handleSave = async (payload: UnpaidLeaveApplicationPayload) => {
    try {
      setEditLoading(true)
      if (editingRecord) {
        await updateUnpaidLeaveApplication(editingRecord.id, payload)
        message.success('停薪留职申请已更新')
      } else {
        await createUnpaidLeaveApplication(payload)
        message.success('停薪留职申请已创建')
      }
      setEditOpen(false)
      setEditingRecord(null)
      await loadData()
    } catch (error) {
      message.error(
        getErrorMessage(error, editingRecord ? '更新停薪留职申请失败' : '创建停薪留职申请失败'),
      )
    } finally {
      setEditLoading(false)
    }
  }

  const handleDelete = async (record: UnpaidLeaveApplicationRecord) => {
    try {
      await deleteUnpaidLeaveApplication(record.id)
      message.success('停薪留职申请已删除')
      await loadData()
    } catch (error) {
      message.error(getErrorMessage(error, '删除停薪留职申请失败'))
    }
  }

  const openDetailModal = async (record: UnpaidLeaveApplicationRecord) => {
    try {
      setDetailLoading(true)
      const detail = await getUnpaidLeaveApplication(record.id)
      setDetailRecord(detail)
      setDetailOpen(true)
    } catch (error) {
      message.error(getErrorMessage(error, '加载详情失败'))
    } finally {
      setDetailLoading(false)
    }
  }

  const openPrintModal = async (record: UnpaidLeaveApplicationRecord) => {
    try {
      setPrintLoading(true)
      const detail = await getUnpaidLeaveApplication(record.id)
      setPrintRecord(detail)
      setPrintOpen(true)
    } catch (error) {
      message.error(getErrorMessage(error, '加载打印详情失败'))
    } finally {
      setPrintLoading(false)
    }
  }

  const handleSubmit = async (record: UnpaidLeaveApplicationRecord) => {
    try {
      await submitUnpaidLeaveApplication(record.id)
      message.success('停薪留职申请已提交审批')
      await loadData()
    } catch (error) {
      message.error(getErrorMessage(error, '提交停薪留职申请失败'))
    }
  }

  const handleAction = async (comment: string) => {
    const actionRecord = actionState.record
    if (!actionRecord) return
    if (actionState.type === 'reject' && !comment.trim()) {
      message.warning('驳回时请填写审批意见')
      return
    }

    try {
      setActionLoading(true)
      if (actionState.type === 'approve') {
        await approveUnpaidLeaveApplication(actionRecord.id, comment.trim() || undefined)
        message.success('审批已通过')
      } else {
        await rejectUnpaidLeaveApplication(actionRecord.id, comment.trim())
        message.success('审批已驳回')
      }
      setActionState({ open: false, type: 'approve', record: null })
      await loadData()
    } catch (error) {
      if (isApprovalStateChangedError(error)) {
        await loadData()
      }
      message.error(getErrorMessage(error, '审批操作失败'))
    } finally {
      setActionLoading(false)
    }
  }

  const columns: ColumnsType<UnpaidLeaveApplicationRecord> = [
    {
      title: '申请单号',
      dataIndex: 'applicationNo',
      width: 220,
      fixed: 'left',
    },
    {
      title: '姓名',
      dataIndex: 'name',
      width: 100,
    },
    {
      title: '部门',
      dataIndex: 'department',
      width: 120,
    },
    {
      title: '职位',
      dataIndex: 'position',
      width: 140,
    },
    {
      title: '所属神殿',
      dataIndex: 'campus',
      width: 120,
    },
    {
      title: '填表日期',
      dataIndex: 'fillDate',
      width: 120,
    },
    {
      title: '当前阶段',
      dataIndex: 'currentStageLabel',
      width: 140,
      render: (value) => value || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (_, record) => (
        <Tag color={STATUS_COLOR_MAP[record.status]}>{record.statusLabel}</Tag>
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      width: 180,
    },
    {
      title: '操作',
      width: 280,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small" wrap>
          <Tooltip title="详情">
            <Button size="small" icon={<EyeOutlined />} onClick={() => openDetailModal(record)} />
          </Tooltip>
          <Tooltip title="打印预览">
            <Button
              size="small"
              icon={<PrinterOutlined />}
              onClick={() => openPrintModal(record)}
            />
          </Tooltip>
          {record.canEdit ? (
            <Tooltip title="编辑">
              <Button size="small" icon={<EditOutlined />} onClick={() => openEditModal(record)} />
            </Tooltip>
          ) : null}
          {record.canDelete ? (
            <Popconfirm title="确认删除该申请？" onConfirm={() => handleDelete(record)}>
              <Tooltip title="删除">
                <Button size="small" danger icon={<DeleteOutlined />} />
              </Tooltip>
            </Popconfirm>
          ) : null}
          {record.canSubmit ? (
            <Button
              size="small"
              type="primary"
              icon={<SendOutlined />}
              onClick={() => handleSubmit(record)}
            >
              提交
            </Button>
          ) : null}
          {record.canApprove ? (
            <>
              <Button
                size="small"
                type="primary"
                icon={<CheckOutlined />}
                onClick={() => setActionState({ open: true, type: 'approve', record })}
              >
                通过
              </Button>
              <Button
                size="small"
                danger
                icon={<CloseOutlined />}
                onClick={() => setActionState({ open: true, type: 'reject', record })}
              >
                驳回
              </Button>
            </>
          ) : null}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle" gutter={16}>
          <Col>
            <Space>
              <PauseCircleOutlined style={{ fontSize: 18 }} />
              <Title level={5} style={{ margin: 0 }}>
                停薪留职申请表
              </Title>
              <Text type="secondary">当前神殿：{activeCampus || '全部'}</Text>
            </Space>
          </Col>
          <Col>
            <Space>
              <Select
                allowClear
                placeholder="按状态筛选"
                style={{ width: 180 }}
                value={statusFilter}
                onChange={(value) => setStatusFilter(value)}
                options={[
                  { value: 'draft', label: '草稿' },
                  { value: 'pending', label: '审批中' },
                  { value: 'approved', label: '已通过' },
                  { value: 'rejected', label: '已驳回' },
                ]}
              />
              <Input
                placeholder="搜索单号/姓名/部门/职位"
                prefix={<SearchOutlined />}
                style={{ width: 260 }}
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
              <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
                新建停薪留职申请
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredRecords}
          loading={loading}
          bordered
          pagination={{ pageSize: 10, showSizeChanger: true }}
          scroll={{ x: 1800 }}
          locale={{ emptyText: '暂无停薪留职申请' }}
        />
      </Card>

      <EditModal
        open={editOpen}
        loading={editLoading}
        campus={activeCampus}
        currentUserName={currentUser?.name}
        currentUserDepartment={currentUser?.department}
        currentUserPosition={currentUser?.position}
        currentUserEmail={currentUser?.email}
        currentUserPhone={currentUserInfo?.phone}
        editingRecord={editingRecord}
        users={users}
        onCancel={() => {
          setEditOpen(false)
          setEditingRecord(null)
        }}
        onOk={handleSave}
      />

      <ApprovalActionModal
        open={actionState.open}
        loading={actionLoading}
        type={actionState.type}
        record={actionState.record}
        onCancel={() => setActionState({ open: false, type: 'approve', record: null })}
        onOk={handleAction}
      />

      {detailLoading && detailOpen ? (
        <Modal open footer={null} onCancel={() => setDetailOpen(false)} width={480}>
          <Card loading />
        </Modal>
      ) : (
        <DetailModal
          open={detailOpen}
          record={detailRecord}
          onCancel={() => setDetailOpen(false)}
        />
      )}

      <Modal
        title="停薪留职申请打印预览"
        open={printOpen}
        onCancel={() => setPrintOpen(false)}
        width={960}
        footer={[
          <Button key="close" onClick={() => setPrintOpen(false)}>
            关闭
          </Button>,
          <Button key="print" type="primary" onClick={() => window.print()}>
            打印
          </Button>,
        ]}
      >
        {printLoading ? (
          <Card loading />
        ) : printRecord ? (
          <PrintPreview record={printRecord} />
        ) : null}
      </Modal>
    </div>
  )
}

export default UnpaidLeaveApplicationPage