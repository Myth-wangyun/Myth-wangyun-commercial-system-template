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
  LogoutOutlined,
  PlusOutlined,
  PrinterOutlined,
  SearchOutlined,
  SendOutlined,
} from '@ant-design/icons'
import dayjs, { type Dayjs } from 'dayjs'
import { useAuthStore } from '@/stores/authStore'
import { useCampusStore } from '@/stores/campusStore'
import {
  approveResignationApproval,
  createResignationApproval,
  deleteResignationApproval,
  getResignationApproval,
  listResignationApprovals,
  previewResignationApproverCandidates,
  rejectResignationApproval,
  submitResignationApproval,
  type ResignationApprovalActionPayload,
  type ResignationApprovalFlowStep,
  type ResignationApprovalPayload,
  type ResignationApprovalPreviewStage,
  type ResignationApprovalRecord,
  type ResignationApprovalStatus,
  updateResignationApproval,
} from '@/services/humanresources/resignationApproval'
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
const LEAVE_TYPE_OPTIONS = ['辞职', '合同到期不续签', '其他']

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

const formatSalaryEndDate = (value?: string | null) =>
  value ? dayjs(value).format('YYYY年MM月DD日') : '____年____月____日'

type EditModalProps = {
  open: boolean
  loading: boolean
  campus?: string | null
  currentUserName?: string | null
  currentUserDepartment?: string | null
  currentUserPosition?: string | null
  editingRecord: ResignationApprovalRecord | null
  users: UserPermissionInfo[]
  onCancel: () => void
  onOk: (payload: ResignationApprovalPayload) => Promise<void>
}

const EditModal: React.FC<EditModalProps> = ({
  open,
  loading,
  campus,
  currentUserName,
  currentUserDepartment,
  currentUserPosition,
  editingRecord,
  users,
  onCancel,
  onOk,
}) => {
  const [form] = Form.useForm()
  const selectedCampus = Form.useWatch('campus', form)
  const selectedDepartment = Form.useWatch('department', form)
  const selectedPosition = Form.useWatch('position', form)
  const selectedLeaveType = Form.useWatch('leaveType', form)
  const [approverPreview, setApproverPreview] = useState<ResignationApprovalPreviewStage[]>([])
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
        entryDate: editingRecord.entryDate ? dayjs(editingRecord.entryDate) : undefined,
        contractEndDate: editingRecord.contractEndDate
          ? dayjs(editingRecord.contractEndDate)
          : undefined,
        leaveDate: dayjs(editingRecord.leaveDate),
        leaveType: editingRecord.leaveType,
        leaveTypeOther: editingRecord.leaveTypeOther || undefined,
        reason: editingRecord.reason,
        employeeSign: editingRecord.employeeSign || undefined,
        employeeSignDate: editingRecord.employeeSignDate
          ? dayjs(editingRecord.employeeSignDate)
          : undefined,
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
      leaveType: '辞职',
      employeeSign: currentUserName || undefined,
      employeeSignDate: dayjs(),
      selectedApproverUserIds: {},
    })
  }, [
    campus,
    currentUserDepartment,
    currentUserName,
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
    previewResignationApproverCandidates({
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
        console.error('加载离职审批单审批人候选失败', error)
        message.error(getErrorMessage(error, '加载离职审批单审批人候选失败'))
        setApproverPreview([])
      })
      .finally(() => {
        if (active) setApproverPreviewLoading(false)
      })

    return () => {
      active = false
    }
  }, [editingRecord?.id, form, open, selectedCampus, selectedDepartment, selectedPosition])

  const fmtDate = (value?: Dayjs | null) => (value ? value.format('YYYY-MM-DD') : undefined)

  const handleSubmit = async () => {
    const values = await form.validateFields()
    await onOk({
      fillDate: (values.fillDate as Dayjs).format('YYYY-MM-DD'),
      campus: values.campus,
      name: values.name,
      gender: values.gender || undefined,
      department: values.department,
      position: values.position,
      entryDate: fmtDate(values.entryDate),
      contractEndDate: fmtDate(values.contractEndDate),
      leaveDate: (values.leaveDate as Dayjs).format('YYYY-MM-DD'),
      leaveType: values.leaveType,
      leaveTypeOther: values.leaveTypeOther || undefined,
      reason: values.reason,
      employeeSign: values.employeeSign || undefined,
      employeeSignDate: fmtDate(values.employeeSignDate),
      selectedApproverUserIds: normalizeSelectedApproverMap(values.selectedApproverUserIds),
    })
  }

  return (
    <Modal
      title={editingRecord ? '编辑离职审批单' : '新建离职审批单'}
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
            <Form.Item name="gender" label="性别">
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
              label="岗位"
              rules={[{ required: true, message: '请输入岗位' }]}
            >
              <AutoComplete
                options={positionOptions}
                placeholder="支持输入或选择岗位"
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
            <Form.Item name="entryDate" label="入职日期">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="contractEndDate" label="合同到期日">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="leaveDate"
              label="离职日期"
              rules={[{ required: true, message: '请选择离职日期' }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="leaveType"
              label="离职种类"
              rules={[{ required: true, message: '请选择离职种类' }]}
            >
              <Radio.Group>
                {LEAVE_TYPE_OPTIONS.map((item) => (
                  <Radio key={item} value={item} style={{ marginRight: 24 }}>
                    {item}
                  </Radio>
                ))}
              </Radio.Group>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="leaveTypeOther"
              label="其他说明"
              rules={
                selectedLeaveType === '其他'
                  ? [{ required: true, message: '选择“其他”时请填写说明' }]
                  : undefined
              }
            >
              <Input placeholder="选择其他时填写" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="reason"
          label="离职原因"
          rules={[{ required: true, message: '请填写离职原因' }]}
        >
          <TextArea rows={5} placeholder="请详细说明离职原因" />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="employeeSign" label="员工签字">
              <Input placeholder="请输入员工签字" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="employeeSignDate" label="员工签字日期">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

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
  record: ResignationApprovalRecord | null
  onCancel: () => void
  onOk: (payload: ResignationApprovalActionPayload) => Promise<void>
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
  const [salaryEndDate, setSalaryEndDate] = useState<Dayjs | null>(null)

  const needsSalaryEndDate =
    type === 'approve' && ['department_head', 'hr'].includes(record?.currentStage || '')

  useEffect(() => {
    if (open) {
      setComment(type === 'approve' ? '通过' : '')
      setSalaryEndDate(null)
    }
  }, [open, type, record?.id])

  return (
    <Modal
      title={type === 'approve' ? '审批通过' : '审批驳回'}
      open={open}
      onCancel={onCancel}
      onOk={() =>
        void onOk({
          comment,
          salaryEndDate: salaryEndDate ? salaryEndDate.format('YYYY-MM-DD') : undefined,
        })
      }
      confirmLoading={loading}
      okText={type === 'approve' ? '确认通过' : '确认驳回'}
      cancelText="取消"
      destroyOnClose
    >
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        <Text>
          当前单据：{record?.applicationNo || '-'} / {record?.name || '-'}
        </Text>
        {needsSalaryEndDate ? (
          <DatePicker
            style={{ width: '100%' }}
            placeholder="请选择工资结算至日期"
            value={salaryEndDate}
            onChange={(value) => setSalaryEndDate(value)}
          />
        ) : null}
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

const renderFlowCards = (
  flow: ResignationApprovalFlowStep[],
  actions: ResignationApprovalRecord['approvalActions'],
) => (
  <>
    <Card size="small" title="审批流程轨迹">
      <List
        dataSource={flow}
        locale={{ emptyText: '暂无流程轨迹' }}
        renderItem={(item) => {
          const statusColor =
            item.status === 'completed'
              ? 'success'
              : item.status === 'rejected'
                ? 'error'
                : item.status === 'current'
                  ? 'processing'
                  : 'default'
          return (
            <List.Item>
              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Space wrap>
                  <Tag>{item.stageLabel}</Tag>
                  <Tag color={statusColor}>{item.statusLabel}</Tag>
                  <Text>
                    审批人：
                    {item.approvers.length
                      ? item.approvers.map((approver) => approver.name).join('、')
                      : '未配置'}
                  </Text>
                </Space>
                {item.actedByName || item.comment ? (
                  <Text>
                    {item.actedByName ? `处理人：${item.actedByName}` : ''}
                    {item.actionLabel ? `  动作：${item.actionLabel}` : ''}
                    {item.actedAt ? `  时间：${item.actedAt}` : ''}
                    {item.comment?.trim() ? `  意见：${item.comment.trim()}` : ''}
                  </Text>
                ) : null}
              </Space>
            </List.Item>
          )
        }}
      />
    </Card>
    <Card size="small" title="审批流转记录">
      <List
        dataSource={actions}
        locale={{ emptyText: '暂无审批记录' }}
        renderItem={(item) => {
          const actionColor =
            item.action === 'approve'
              ? 'success'
              : item.action === 'reject'
                ? 'error'
                : 'processing'
          return (
            <List.Item>
              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Space wrap>
                  <Tag>{item.stageLabel}</Tag>
                  <Tag color={actionColor}>{getActionLabel(item.action)}</Tag>
                  <Text>{item.approverName || '-'}</Text>
                  <Text type="secondary">{item.createdAt}</Text>
                </Space>
                <Text>
                  审批意见：
                  {item.comment?.trim() || (item.action === 'submit' ? '提交审批' : '无')}
                </Text>
              </Space>
            </List.Item>
          )
        }}
      />
    </Card>
  </>
)

const DetailModal: React.FC<{
  open: boolean
  record: ResignationApprovalRecord | null
  onCancel: () => void
}> = ({ open, record, onCancel }) => {
  if (!record) return null

  const approvalResults = [
    record.approvalFlow.some((item) => item.stage === 'department_head')
      ? `部门负责人：${record.departmentHeadPassed == null ? '待处理' : record.departmentHeadPassed ? '通过' : '未通过'}`
      : null,
    record.approvalFlow.some((item) => item.stage === 'hr')
      ? `人力资源部：${record.hrPassed == null ? '待处理' : record.hrPassed ? '通过' : '未通过'}`
      : null,
    record.approvalFlow.some((item) => item.stage === 'principal')
      ? `校长：${record.principalPassed == null ? '待处理' : record.principalPassed ? '通过' : '未通过'}`
      : null,
    record.approvalFlow.some((item) => item.stage === 'operations_reviewer')
      ? `最高议事厅运营部总监：${record.operationsReviewPassed == null ? '待处理' : record.operationsReviewPassed ? '通过' : '未通过'}`
      : null,
    record.approvalFlow.some((item) => item.stage === 'chairman')
      ? `董事长：${record.chairmanPassed == null ? '待处理' : record.chairmanPassed ? '通过' : '未通过'}`
      : null,
  ]
    .filter(Boolean)
    .join(' / ')

  return (
    <Modal
      title="离职审批单详情"
      open={open}
      onCancel={onCancel}
      footer={null}
      width={980}
      destroyOnClose
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Descriptions
          bordered
          size="small"
          column={2}
          items={[
            { key: 'applicationNo', label: '申请单号', children: record.applicationNo },
            { key: 'status', label: '状态', children: record.statusLabel },
            { key: 'fillDate', label: '填表日期', children: record.fillDate },
            { key: 'campus', label: '所属神殿', children: record.campus || '-' },
            { key: 'name', label: '姓名', children: record.name },
            { key: 'gender', label: '性别', children: record.gender || '-' },
            { key: 'department', label: '部门', children: record.department },
            { key: 'position', label: '岗位', children: record.position },
            { key: 'entryDate', label: '入职日期', children: record.entryDate || '-' },
            {
              key: 'contractEndDate',
              label: '合同到期日',
              children: record.contractEndDate || '-',
            },
            { key: 'leaveDate', label: '离职日期', children: record.leaveDate },
            { key: 'leaveType', label: '离职种类', children: record.leaveType || '-' },
            {
              key: 'leaveTypeOther',
              label: '其他说明',
              children: record.leaveTypeOther || '-',
              span: 2,
            },
            { key: 'reason', label: '离职原因', children: record.reason || '-', span: 2 },
            {
              key: 'employeeSign',
              label: '员工签字',
              children: `${record.employeeSign || '-'} / ${record.employeeSignDate || '-'}`,
              span: 2,
            },
            {
              key: 'approvalResults',
              label: '审批结果',
              children: approvalResults || '-',
              span: 2,
            },
            {
              key: 'departmentHeadOpinion',
              label: '部门负责人意见',
              children: `${record.departmentHeadOpinion || '-'} / 工资结算至：${record.departmentHeadSalaryEndDate || '-'}`,
              span: 2,
            },
            {
              key: 'hrOpinion',
              label: '人力资源部意见',
              children: `${record.hrOpinion || '-'} / 工资结算至：${record.hrSalaryEndDate || '-'}`,
              span: 2,
            },
            {
              key: 'principalOpinion',
              label: '校长意见',
              children: record.principalOpinion || '-',
              span: 2,
            },
            ...(record.approvalFlow.some((item) => item.stage === 'operations_reviewer')
              ? [
                  {
                    key: 'operationsReviewOpinion',
                    label: '最高议事厅运营部总监意见',
                    children: record.operationsReviewOpinion || '-',
                    span: 2,
                  },
                ]
              : []),
            ...(record.approvalFlow.some((item) => item.stage === 'chairman')
              ? [
                  {
                    key: 'chairmanOpinion',
                    label: '董事长意见',
                    children: record.chairmanOpinion || '-',
                    span: 2,
                  },
                ]
              : []),
            {
              key: 'currentApprovers',
              label: '当前审批人',
              children: record.currentApprovers.length
                ? record.currentApprovers.map((item) => item.name).join('、')
                : '-',
              span: 2,
            },
            {
              key: 'currentStage',
              label: '当前审批阶段',
              children: record.currentStageLabel || '-',
              span: 2,
            },
            {
              key: 'rejectionReason',
              label: '驳回原因',
              children: record.rejectionReason || '-',
              span: 2,
            },
          ]}
        />
        {renderFlowCards(record.approvalFlow, record.approvalActions)}
      </Space>
    </Modal>
  )
}

const PrintPreview: React.FC<{ record: ResignationApprovalRecord }> = ({ record }) => {
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
  const check = (value: boolean) => (value ? '☑' : '☐')
  const flowMap = Object.fromEntries(record.approvalFlow.map((item) => [item.stage, item]))

  const renderApprovalRow = (
    title: string,
    flowStep: ResignationApprovalFlowStep | undefined,
    opinion?: string | null,
    salaryEndDate?: string | null,
  ) => (
    <tr>
      <td style={{ ...labelCell, width: '15%' }}>{title}</td>
      <td colSpan={7} style={{ ...cell, minHeight: 80 }}>
        <div style={{ whiteSpace: 'pre-wrap', minHeight: 32 }}>{opinion || ''}</div>
        {salaryEndDate !== undefined ? (
          <div style={{ marginTop: 8 }}>工资结算至：{formatSalaryEndDate(salaryEndDate)}</div>
        ) : null}
        <div style={{ textAlign: 'right', marginTop: 8 }}>
          <span>签字：{flowStep?.actedByName || '________'}</span>
          <br />
          <span>日期：{formatDate(flowStep?.actedAt) || '________'}</span>
        </div>
      </td>
    </tr>
  )

  return (
    <div style={{ padding: '16px 24px', fontFamily: 'SimSun, serif' }}>
      <div style={{ textAlign: 'center', marginBottom: 4 }}>
        <Title level={4} style={{ margin: 0 }}>
          离 职 审 批 单
        </Title>
      </div>
      <div style={{ textAlign: 'right', marginBottom: 8, fontSize: 13 }}>
        填表日期：{formatDate(record.fillDate)}
      </div>

      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          border: '2px solid #333',
          tableLayout: 'fixed',
        }}
      >
        <tbody>
          <tr>
            <td style={{ ...labelCell, width: '15%' }}>姓名</td>
            <td style={{ ...cell, width: '15%' }}>{record.name}</td>
            <td style={{ ...labelCell, width: '10%' }}>性别</td>
            <td style={{ ...cell, width: '10%' }}>{record.gender || '-'}</td>
            <td style={{ ...labelCell, width: '10%' }}>部门</td>
            <td style={{ ...cell, width: '15%' }}>{record.department}</td>
            <td style={{ ...labelCell, width: '10%' }}>岗位</td>
            <td style={{ ...cell, width: '15%' }}>{record.position}</td>
          </tr>
          <tr>
            <td style={labelCell}>入职日期</td>
            <td style={cell}>{formatDate(record.entryDate)}</td>
            <td colSpan={2} style={labelCell}>
              合同到期日
            </td>
            <td colSpan={2} style={cell}>
              {formatDate(record.contractEndDate)}
            </td>
            <td style={labelCell}>离职日期</td>
            <td style={cell}>{formatDate(record.leaveDate)}</td>
          </tr>
          <tr>
            <td style={labelCell}>离职种类</td>
            <td colSpan={7} style={cell}>
              <span style={{ marginRight: 24 }}>{check(record.leaveType === '辞职')} 辞职</span>
              <span style={{ marginRight: 24 }}>
                {check(record.leaveType === '合同到期不续签')} 合同到期不续签
              </span>
              <span>{check(record.leaveType === '其他')} 其他</span>
              {record.leaveTypeOther ? (
                <span style={{ marginLeft: 16 }}>（{record.leaveTypeOther}）</span>
              ) : null}
            </td>
          </tr>
          <tr>
            <td style={labelCell}>离职原因</td>
            <td colSpan={7} style={{ ...cell, minHeight: 100 }}>
              <div style={{ whiteSpace: 'pre-wrap', minHeight: 60 }}>{record.reason || ''}</div>
              <div style={{ textAlign: 'right', marginTop: 12 }}>
                <span>员工签字：{record.employeeSign || '________'}</span>
                <br />
                <span>日期：{formatDate(record.employeeSignDate) || '________'}</span>
              </div>
            </td>
          </tr>

          {record.approvalFlow.some((item) => item.stage === 'department_head')
            ? renderApprovalRow(
                '部门负责人意见',
                flowMap.department_head,
                record.departmentHeadOpinion,
                record.departmentHeadSalaryEndDate,
              )
            : null}
          {record.approvalFlow.some((item) => item.stage === 'hr')
            ? renderApprovalRow(
                '人力资源部意见',
                flowMap.hr,
                record.hrOpinion,
                record.hrSalaryEndDate,
              )
            : null}
          {record.approvalFlow.some((item) => item.stage === 'principal')
            ? renderApprovalRow('校长意见', flowMap.principal, record.principalOpinion)
            : null}
          {record.approvalFlow.some((item) => item.stage === 'operations_reviewer')
            ? renderApprovalRow(
                '最高议事厅运营部总监意见',
                flowMap.operations_reviewer,
                record.operationsReviewOpinion,
              )
            : null}
          {record.approvalFlow.some((item) => item.stage === 'chairman')
            ? renderApprovalRow('董事长意见', flowMap.chairman, record.chairmanOpinion)
            : null}
        </tbody>
      </table>
    </div>
  )
}

const ResignationApprovalPage: React.FC = () => {
  const { user: currentUser } = useAuthStore()
  const { currentCampus } = useCampusStore()
  const [loading, setLoading] = useState(false)
  const [records, setRecords] = useState<ResignationApprovalRecord[]>([])
  const [users, setUsers] = useState<UserPermissionInfo[]>([])
  const [statusFilter, setStatusFilter] = useState<ResignationApprovalStatus | undefined>()
  const [keyword, setKeyword] = useState('')
  const [editOpen, setEditOpen] = useState(false)
  const [editLoading, setEditLoading] = useState(false)
  const [editingRecord, setEditingRecord] = useState<ResignationApprovalRecord | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailRecord, setDetailRecord] = useState<ResignationApprovalRecord | null>(null)
  const [printOpen, setPrintOpen] = useState(false)
  const [printLoading, setPrintLoading] = useState(false)
  const [printRecord, setPrintRecord] = useState<ResignationApprovalRecord | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionState, setActionState] = useState<{
    open: boolean
    type: 'approve' | 'reject'
    record: ResignationApprovalRecord | null
  }>({
    open: false,
    type: 'approve',
    record: null,
  })

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [recordList, permissionUsers] = await Promise.all([
        listResignationApprovals({
          campus: currentCampus || undefined,
          status: statusFilter,
        }),
        fetchUserPermissions().catch(() => []),
      ])
      setRecords(recordList)
      setUsers(permissionUsers)
    } catch (error) {
      console.error('加载离职审批单失败', error)
      message.error(getErrorMessage(error, '加载离职审批单失败'))
    } finally {
      setLoading(false)
    }
  }, [currentCampus, statusFilter])

  useEffect(() => {
    loadData()
  }, [loadData])

  const filteredRecords = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase()
    return records.filter((item) => {
      if (!normalizedKeyword) return true
      return [
        item.applicationNo,
        item.name,
        item.department,
        item.position,
        item.currentStageLabel,
        item.leaveType,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedKeyword))
    })
  }, [keyword, records])

  const openCreateModal = () => {
    setEditingRecord(null)
    setEditOpen(true)
  }

  const openEditModal = (record: ResignationApprovalRecord) => {
    setEditingRecord(record)
    setEditOpen(true)
  }

  const handleSave = async (payload: ResignationApprovalPayload) => {
    try {
      setEditLoading(true)
      if (editingRecord) {
        await updateResignationApproval(editingRecord.id, payload)
        message.success('离职审批单已更新')
      } else {
        await createResignationApproval(payload)
        message.success('离职审批单已创建')
      }
      setEditOpen(false)
      setEditingRecord(null)
      await loadData()
    } catch (error) {
      message.error(
        getErrorMessage(error, editingRecord ? '更新离职审批单失败' : '创建离职审批单失败'),
      )
    } finally {
      setEditLoading(false)
    }
  }

  const handleDelete = async (record: ResignationApprovalRecord) => {
    try {
      await deleteResignationApproval(record.id)
      message.success('离职审批单已删除')
      await loadData()
    } catch (error) {
      message.error(getErrorMessage(error, '删除离职审批单失败'))
    }
  }

  const openDetailModal = async (record: ResignationApprovalRecord) => {
    try {
      setDetailLoading(true)
      const detail = await getResignationApproval(record.id)
      setDetailRecord(detail)
      setDetailOpen(true)
    } catch (error) {
      message.error(getErrorMessage(error, '加载详情失败'))
    } finally {
      setDetailLoading(false)
    }
  }

  const openPrintModal = async (record: ResignationApprovalRecord) => {
    try {
      setPrintLoading(true)
      const detail = await getResignationApproval(record.id)
      setPrintRecord(detail)
      setPrintOpen(true)
    } catch (error) {
      message.error(getErrorMessage(error, '加载打印详情失败'))
    } finally {
      setPrintLoading(false)
    }
  }

  const handleSubmit = async (record: ResignationApprovalRecord) => {
    try {
      await submitResignationApproval(record.id)
      message.success('离职审批单已提交审批')
      await loadData()
    } catch (error) {
      message.error(getErrorMessage(error, '提交离职审批单失败'))
    }
  }

  const handleAction = async (payload: ResignationApprovalActionPayload) => {
    const actionRecord = actionState.record
    if (!actionRecord) return
    if (actionState.type === 'reject' && !payload.comment?.trim()) {
      message.warning('驳回时请填写审批意见')
      return
    }

    try {
      setActionLoading(true)
      if (actionState.type === 'approve') {
        await approveResignationApproval(actionRecord.id, payload)
        message.success('审批已通过')
      } else {
        await rejectResignationApproval(actionRecord.id, payload)
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

  const columns: ColumnsType<ResignationApprovalRecord> = [
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
      title: '岗位',
      dataIndex: 'position',
      width: 140,
    },
    {
      title: '所属神殿',
      dataIndex: 'campus',
      width: 120,
    },
    {
      title: '离职日期',
      dataIndex: 'leaveDate',
      width: 120,
    },
    {
      title: '离职种类',
      width: 180,
      render: (_, record) =>
        record.leaveType === '其他' && record.leaveTypeOther
          ? `其他（${record.leaveTypeOther}）`
          : record.leaveType,
    },
    {
      title: '当前阶段',
      dataIndex: 'currentStageLabel',
      width: 180,
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
      width: 300,
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
            <Popconfirm title="确认删除该离职审批单？" onConfirm={() => handleDelete(record)}>
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
              <LogoutOutlined style={{ fontSize: 18 }} />
              <Title level={5} style={{ margin: 0 }}>
                离职审批单
              </Title>
              <Text type="secondary">当前神殿：{currentCampus || '全部'}</Text>
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
                placeholder="搜索单号/姓名/部门/岗位"
                prefix={<SearchOutlined />}
                style={{ width: 260 }}
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
              />
              <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
                新建离职审批单
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
          scroll={{ x: 1900 }}
          locale={{ emptyText: '暂无离职审批单' }}
        />
      </Card>

      <EditModal
        open={editOpen}
        loading={editLoading}
        campus={currentCampus}
        currentUserName={currentUser?.name}
        currentUserDepartment={currentUser?.department}
        currentUserPosition={currentUser?.position}
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
        title="离职审批单打印预览"
        open={printOpen}
        onCancel={() => setPrintOpen(false)}
        footer={[
          <Button key="close" onClick={() => setPrintOpen(false)}>
            关闭
          </Button>,
          <Button key="print" type="primary" onClick={() => window.print()}>
            打印
          </Button>,
        ]}
        width={980}
        destroyOnClose
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

export default ResignationApprovalPage