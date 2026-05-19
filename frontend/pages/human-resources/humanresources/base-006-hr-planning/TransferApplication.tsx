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
  InputNumber,
  List,
  Modal,
  Popconfirm,
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
  PlusOutlined,
  PrinterOutlined,
  SearchOutlined,
  SendOutlined,
  SwapOutlined,
} from '@ant-design/icons'
import dayjs, { type Dayjs } from 'dayjs'
import { useAuthStore } from '@/stores/authStore'
import { useCampusStore } from '@/stores/campusStore'
import {
  approveTransferApplication,
  createTransferApplication,
  deleteTransferApplication,
  getTransferApplication,
  listTransferApplications,
  previewTransferApproverCandidates,
  rejectTransferApplication,
  submitTransferApplication,
  type TransferApprovalActionPayload,
  type TransferApprovalFlowStep,
  type TransferApprovalPreviewStage,
  type TransferApplicationPayload,
  type TransferApplicationRecord,
  type TransferStatus,
  updateTransferApplication,
} from '@/services/humanresources/transferApplication'
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
const TRANSFER_REASON_MIN_LENGTH = 30

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

const renderDecisionTag = (value?: boolean | null) => {
  if (value == null) return <Tag>待处理</Tag>
  return <Tag color={value ? 'success' : 'error'}>{value ? '通过' : '未通过'}</Tag>
}

const normalizeText = (value?: string | null) => (value || '').replace(/\s+/g, '')
const getEffectiveTextLength = (value?: string | null) => normalizeText(value).length

const validateTransferReason = async (_rule: unknown, value?: string) => {
  if (!value?.trim()) {
    throw new Error('请填写调岗原因')
  }
  if (getEffectiveTextLength(value) < TRANSFER_REASON_MIN_LENGTH) {
    throw new Error(`调岗原因不少于${TRANSFER_REASON_MIN_LENGTH}字`)
  }
}

const computeTransferSalaryTotal = (
  baseSalary?: number | null,
  performanceSalary?: number | null,
  totalSalary?: number | null,
) => {
  if (baseSalary == null && performanceSalary == null) return totalSalary ?? null
  return (baseSalary ?? 0) + (performanceSalary ?? 0)
}

const isManagementCenterCampus = (campus?: string | null) =>
  !!campus && MANAGEMENT_CENTER_CAMPUS_VALUES.includes(campus.trim())

const campusMatchesScope = (userCampus?: string | null, selectedCampus?: string | null) => {
  if (!selectedCampus) return true
  if (!userCampus) return true
  if (isManagementCenterCampus(selectedCampus)) return isManagementCenterCampus(userCampus)
  return userCampus === selectedCampus
}

type EditModalProps = {
  open: boolean
  loading: boolean
  campus?: string | null
  currentUserName?: string | null
  currentUserDepartment?: string | null
  currentUserPosition?: string | null
  editingRecord: TransferApplicationRecord | null
  users: UserPermissionInfo[]
  onCancel: () => void
  onOk: (payload: TransferApplicationPayload) => Promise<void>
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
  const targetDepartment = Form.useWatch('targetDepartment', form)
  const targetPosition = Form.useWatch('targetPosition', form)
  const [approverPreview, setApproverPreview] = useState<TransferApprovalPreviewStage[]>([])
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
    if (editingRecord?.targetDepartment) values.add(editingRecord.targetDepartment)
    return Array.from(values).sort((a, b) => a.localeCompare(b, 'zh-CN'))
  }, [campusUsers, currentUserDepartment, editingRecord])

  const buildPositionOptions = useCallback(
    (departmentValue?: string) => {
      const values = new Set<string>()
      campusUsers.forEach((item) => {
        if (!item.position) return
        if (!departmentValue || normalizeText(item.department) === normalizeText(departmentValue)) {
          values.add(item.position)
        }
      })
      if (currentUserPosition) values.add(currentUserPosition)
      if (editingRecord?.position) values.add(editingRecord.position)
      if (editingRecord?.targetPosition) values.add(editingRecord.targetPosition)
      return Array.from(values)
        .sort((a, b) => a.localeCompare(b, 'zh-CN'))
        .map((value) => ({ value }))
    },
    [campusUsers, currentUserPosition, editingRecord],
  )

  const positionOptions = useMemo(
    () => buildPositionOptions(selectedDepartment),
    [buildPositionOptions, selectedDepartment],
  )
  const targetPositionOptions = useMemo(
    () => buildPositionOptions(targetDepartment),
    [buildPositionOptions, targetDepartment],
  )

  useEffect(() => {
    if (!open) {
      form.resetFields()
      return
    }

    if (editingRecord) {
      form.setFieldsValue({
        applyDate: dayjs(editingRecord.applyDate),
        campus: editingRecord.campus,
        name: editingRecord.name,
        department: editingRecord.department,
        position: editingRecord.position,
        entryDate: dayjs(editingRecord.entryDate),
        originalSalary: editingRecord.originalSalary ?? undefined,
        targetDepartment: editingRecord.targetDepartment,
        targetPosition: editingRecord.targetPosition,
        newBaseSalary: editingRecord.newBaseSalary ?? editingRecord.newSalary ?? undefined,
        newPerformanceSalary: editingRecord.newPerformanceSalary ?? undefined,
        reason: editingRecord.reason,
        applicantName: editingRecord.applicantName || editingRecord.createdByName || undefined,
        selectedApproverUserIds: editingRecord.selectedApproverUserIds || {},
      })
      return
    }

    form.setFieldsValue({
      applyDate: dayjs(),
      campus: campus || undefined,
      name: currentUserName || undefined,
      department: currentUserDepartment || undefined,
      position: currentUserPosition || undefined,
      applicantName: currentUserName || undefined,
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
    const normalizedTargetDepartment =
      typeof targetDepartment === 'string' ? targetDepartment.trim() : ''
    const normalizedTargetPosition = typeof targetPosition === 'string' ? targetPosition.trim() : ''

    if (
      !normalizedCampus ||
      !normalizedDepartment ||
      !normalizedPosition ||
      !normalizedTargetDepartment ||
      !normalizedTargetPosition
    ) {
      setApproverPreview([])
      form.setFieldValue(
        'selectedApproverUserIds',
        normalizeSelectedApproverMap(form.getFieldValue('selectedApproverUserIds')),
      )
      return
    }

    let active = true
    setApproverPreviewLoading(true)
    previewTransferApproverCandidates({
      campus: normalizedCampus,
      department: normalizedDepartment,
      position: normalizedPosition,
      targetDepartment: normalizedTargetDepartment,
      targetPosition: normalizedTargetPosition,
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
        console.error('加载调岗审批人预填写失败', error)
        message.error(getErrorMessage(error, '加载调岗审批人预填写失败'))
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
  }, [
    editingRecord?.id,
    form,
    open,
    selectedCampus,
    selectedDepartment,
    selectedPosition,
    targetDepartment,
    targetPosition,
  ])

  const handleSubmit = async () => {
    const values = await form.validateFields()
    await onOk({
      applyDate: (values.applyDate as Dayjs).format('YYYY-MM-DD'),
      campus: values.campus,
      name: values.name,
      department: values.department,
      position: values.position,
      entryDate: (values.entryDate as Dayjs).format('YYYY-MM-DD'),
      originalSalary: values.originalSalary ?? undefined,
      targetDepartment: values.targetDepartment,
      targetPosition: values.targetPosition,
      newBaseSalary: values.newBaseSalary ?? undefined,
      newPerformanceSalary: values.newPerformanceSalary ?? undefined,
      reason: values.reason,
      applicantName: values.applicantName || undefined,
      selectedApproverUserIds: normalizeSelectedApproverMap(values.selectedApproverUserIds),
    })
  }

  return (
    <Modal
      title={editingRecord ? '编辑调岗申请' : '新建调岗申请'}
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
              name="applyDate"
              label="申请日期"
              rules={[{ required: true, message: '请选择申请日期' }]}
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
              name="department"
              label="原部门"
              rules={[{ required: true, message: '请输入原部门' }]}
            >
              <AutoComplete
                options={departmentOptions.map((value) => ({ value }))}
                placeholder="支持输入或选择原部门"
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
              label="原岗位"
              rules={[{ required: true, message: '请输入原岗位' }]}
            >
              <AutoComplete
                options={positionOptions}
                placeholder="支持输入或选择原岗位"
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
              name="entryDate"
              label="入职日期"
              rules={[{ required: true, message: '请选择入职日期' }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="originalSalary" label="原工资（元/月）">
              <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入原工资" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="targetDepartment"
              label="调入部门"
              rules={[{ required: true, message: '请输入调入部门' }]}
            >
              <AutoComplete
                options={departmentOptions.map((value) => ({ value }))}
                placeholder="支持输入或选择调入部门"
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
              name="targetPosition"
              label="调入岗位"
              rules={[{ required: true, message: '请输入调入岗位' }]}
            >
              <AutoComplete
                options={targetPositionOptions}
                placeholder="支持输入或选择调入岗位"
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
            <Form.Item name="newBaseSalary" label="基础薪资（元/月）">
              <InputNumber
                min={0}
                style={{ width: '100%' }}
                placeholder="可预填基础薪资，也可由审批人补录"
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="newPerformanceSalary" label="绩效薪资（元/月）">
              <InputNumber
                min={0}
                style={{ width: '100%' }}
                placeholder="可预填绩效薪资，也可由审批人补录"
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="applicantName" label="申请人签名">
              <Input placeholder="申请人签名" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="reason"
          label="调岗原因"
          rules={[{ validator: validateTransferReason }]}
        >
          <TextArea rows={5} placeholder="请填写调岗原因、调岗后的工作安排及说明，不少于30字" />
        </Form.Item>

        <Card size="small" style={{ marginBottom: 16 }}>
          <Text type="secondary">
            本人自愿调岗并愿意接受所调新岗位的职责和薪资标准。新工资可由申请人预填，也可由当前审批人在签批时补录；未补齐不会流转到下一审批环节。校长、主管、经理、总监等管理层岗位会自动追加董事长审批环节。
          </Text>
        </Card>

        <ApproverSelectionSection
          previewStages={approverPreview}
          loading={approverPreviewLoading}
          title="审批人选择"
          description="系统会根据原部门/原岗位、调入部门/调入岗位以及岗位层级列出候选审批人；请逐环节选择实际审批人。"
          emptyText="请先确认原部门、原岗位、调入部门和调入岗位，系统会自动列出候选审批人。"
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
  record: TransferApplicationRecord | null
  onCancel: () => void
  onOk: (payload: TransferApprovalActionPayload) => Promise<void>
}

const ApprovalActionModal: React.FC<ApprovalActionModalProps> = ({
  open,
  loading,
  type,
  record,
  onCancel,
  onOk,
}) => {
  const [form] = Form.useForm()
  const newBaseSalary = Form.useWatch('newBaseSalary', form)
  const newPerformanceSalary = Form.useWatch('newPerformanceSalary', form)
  const newSalaryTotal = useMemo(
    () =>
      computeTransferSalaryTotal(newBaseSalary, newPerformanceSalary, record?.newSalary),
    [newBaseSalary, newPerformanceSalary, record?.newSalary],
  )

  useEffect(() => {
    if (!open) {
      form.resetFields()
      return
    }

    form.setFieldsValue({
      comment: type === 'approve' ? '通过' : '',
      newBaseSalary: record?.newBaseSalary ?? record?.newSalary ?? undefined,
      newPerformanceSalary: record?.newPerformanceSalary ?? undefined,
    })
  }, [form, open, record, type])

  const handleSubmit = async () => {
    const values = await form.validateFields()
    if (type === 'approve' && newSalaryTotal == null) {
      form.setFields([
        {
          name: ['newBaseSalary'],
          errors: ['请填写新工资，系统会自动按基础薪资 + 绩效薪资汇总'],
        },
      ])
      return
    }

    await onOk({
      comment: values.comment?.trim() || undefined,
      newBaseSalary: values.newBaseSalary ?? undefined,
      newPerformanceSalary: values.newPerformanceSalary ?? undefined,
      newSalary: newSalaryTotal ?? undefined,
    })
  }

  return (
    <Modal
      title={type === 'approve' ? '审批通过' : '审批驳回'}
      open={open}
      onCancel={onCancel}
      onOk={handleSubmit}
      okText={type === 'approve' ? '确认通过' : '确认驳回'}
      cancelText="取消"
      confirmLoading={loading}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text type="secondary">当前审批阶段：{record?.currentStageLabel || '-'}</Text>
          {type === 'approve' ? (
            <Text type="secondary">
              新工资未补齐时，系统不会流转到下一审批环节，建议由当前签批人同步补齐。
            </Text>
          ) : null}
        </Space>

        <Form.Item
          name="comment"
          label="审批意见"
          rules={type === 'reject' ? [{ required: true, message: '驳回时请填写审批意见' }] : []}
        >
          <TextArea
            rows={4}
            placeholder={type === 'approve' ? '可填写审批意见（选填）' : '驳回时请填写审批意见'}
          />
        </Form.Item>

        {type === 'approve' ? (
          <>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="newBaseSalary" label="调岗后基础薪资">
                  <InputNumber min={0} style={{ width: '100%' }} placeholder="请填写调岗后基础薪资" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="newPerformanceSalary" label="调岗后绩效薪资">
                  <InputNumber min={0} style={{ width: '100%' }} placeholder="可补充调岗后绩效薪资" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item label="新工资">
              <InputNumber
                value={newSalaryTotal ?? undefined}
                disabled
                style={{ width: '100%' }}
                placeholder="系统按基础薪资 + 绩效薪资自动汇总"
              />
            </Form.Item>
          </>
        ) : null}
      </Form>
    </Modal>
  )
}

const renderFlowCards = (
  flow: TransferApprovalFlowStep[],
  actions: TransferApplicationRecord['approvalActions'],
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
                  审批意见：{item.comment?.trim() || (item.action === 'submit' ? '提交审批' : '无')}
                </Text>
              </Space>
            </List.Item>
          )
        }}
      />
    </Card>
  </>
)

type DetailModalProps = {
  open: boolean
  record: TransferApplicationRecord | null
  onCancel: () => void
}

const DetailModal: React.FC<DetailModalProps> = ({ open, record, onCancel }) => {
  if (!record) return null
  const hasChairmanStage = record.approvalFlow.some((item) => item.stage === 'chairman')

  return (
    <Modal
      title="调岗申请详情"
      open={open}
      onCancel={onCancel}
      footer={[
        <Button key="close" onClick={onCancel}>
          关闭
        </Button>,
      ]}
      width={1040}
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Descriptions
          bordered
          size="small"
          column={2}
          items={[
            { key: 'applicationNo', label: '申请单号', children: record.applicationNo },
            {
              key: 'status',
              label: '状态',
              children: <Tag color={STATUS_COLOR_MAP[record.status]}>{record.statusLabel}</Tag>,
            },
            { key: 'campus', label: '所属神殿', children: record.campus || '-' },
            {
              key: 'creator',
              label: '申请人',
              children: record.createdByName || record.applicantName || '-',
            },
            { key: 'applyDate', label: '申请日期', children: record.applyDate },
            { key: 'name', label: '姓名', children: record.name },
            { key: 'department', label: '原部门', children: record.department },
            { key: 'position', label: '原岗位', children: record.position },
            { key: 'entryDate', label: '入职日期', children: record.entryDate },
            {
              key: 'salary',
              label: '薪资调整',
              children: `原工资：${record.originalSalary ?? '-'} / 基础薪资：${record.newBaseSalary ?? record.newSalary ?? '-'} / 绩效薪资：${record.newPerformanceSalary ?? '-'}`,
              span: 2,
            },
            { key: 'targetDepartment', label: '调入部门', children: record.targetDepartment },
            { key: 'targetPosition', label: '调入岗位', children: record.targetPosition },
            { key: 'reason', label: '调岗原因', children: record.reason || '-', span: 2 },
            {
              key: 'currentStage',
              label: '当前审批阶段',
              children: record.currentStageLabel || '-',
            },
            {
              key: 'currentApprovers',
              label: '当前审批人',
              children: record.currentApprovers.length
                ? record.currentApprovers.map((item) => item.name).join('、')
                : '-',
            },
            { key: 'result', label: '最终结果', children: renderDecisionTag(record.isPassed) },
            { key: 'rejectionReason', label: '驳回原因', children: record.rejectionReason || '-' },
            {
              key: 'outDepartmentManagerPassed',
              label: '调出部门主管结果',
              children: renderDecisionTag(record.outDepartmentManagerPassed),
            },
            {
              key: 'hrFirstReviewPassed',
              label: '人资初审结果',
              children: renderDecisionTag(record.hrFirstReviewPassed),
            },
            {
              key: 'inDepartmentManagerPassed',
              label: '调入部门结果',
              children: renderDecisionTag(record.inDepartmentManagerPassed),
            },
            {
              key: 'bizDirectorPassed',
              label: '业务条线总监结果',
              children: renderDecisionTag(record.bizDirectorPassed),
            },
            {
              key: 'hrFinalReviewPassed',
              label: '人资终审结果',
              children: renderDecisionTag(record.hrFinalReviewPassed),
            },
            ...(hasChairmanStage
              ? [
                  {
                    key: 'chairmanPassed',
                    label: '董事长结果',
                    children: renderDecisionTag(record.chairmanPassed),
                  },
                ]
              : []),
            {
              key: 'outDepartmentManagerOpinion',
              label: '调出部门主管意见',
              children: record.outDepartmentManagerOpinion || '-',
              span: 2,
            },
            {
              key: 'hrFirstReviewOpinion',
              label: '人资初审意见',
              children: record.hrFirstReviewOpinion || '-',
              span: 2,
            },
            {
              key: 'inDepartmentManagerOpinion',
              label: '调入部门意见',
              children: record.inDepartmentManagerOpinion || '-',
              span: 2,
            },
            {
              key: 'bizDirectorOpinion',
              label: '业务条线总监意见',
              children: record.bizDirectorOpinion || '-',
              span: 2,
            },
            {
              key: 'hrFinalReviewOpinion',
              label: '人资终审意见',
              children: record.hrFinalReviewOpinion || '-',
              span: 2,
            },
            ...(hasChairmanStage
              ? [
                  {
                    key: 'chairmanOpinion',
                    label: '董事长意见',
                    children: record.chairmanOpinion || '-',
                    span: 2,
                  },
                ]
              : []),
          ]}
        />
        {renderFlowCards(record.approvalFlow, record.approvalActions)}
      </Space>
    </Modal>
  )
}

const PrintPreview: React.FC<{ record: TransferApplicationRecord }> = ({ record }) => {
  const hasChairmanStage = record.approvalFlow.some((item) => item.stage === 'chairman')
  const flowMap = record.approvalFlow.reduce<Record<string, TransferApprovalFlowStep>>(
    (result, item) => {
      result[item.stage] = item
      return result
    },
    {},
  )
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

  const renderApprovalRow = (title: string, stage?: TransferApprovalFlowStep) => (
    <tr>
      <td colSpan={8} style={{ ...cell, minHeight: 70 }}>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>{title}：</div>
        <div style={{ whiteSpace: 'pre-wrap', minHeight: 32 }}>{stage?.comment || ''}</div>
        <div style={{ textAlign: 'right', marginTop: 8 }}>
          <span>签字：{stage?.actedByName || '________'}</span>
          <span style={{ marginLeft: 32 }}>
            {stage?.actedAt
              ? `${dayjs(stage.actedAt).format('YYYY')}年${dayjs(stage.actedAt).format('MM')}月${dayjs(stage.actedAt).format('DD')}日`
              : '________年________月________日'}
          </span>
        </div>
      </td>
    </tr>
  )

  return (
    <div style={{ padding: '16px 24px', fontFamily: 'SimSun, serif' }}>
      <div style={{ textAlign: 'center', marginBottom: 4 }}>
        <Title level={4} style={{ margin: 0 }}>
          员工调岗表
        </Title>
      </div>
      <div style={{ textAlign: 'right', marginBottom: 8, fontSize: 13 }}>
        {record.applyDate
          ? `${dayjs(record.applyDate).format('YYYY')}年${dayjs(record.applyDate).format('MM')}月${dayjs(record.applyDate).format('DD')}日`
          : '________年________月________日'}
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
            <td style={{ ...labelCell, width: '10%' }}>姓 名</td>
            <td style={{ ...cell, width: '15%' }}>{record.name}</td>
            <td style={{ ...labelCell, width: '10%' }}>部 门</td>
            <td style={{ ...cell, width: '15%' }}>{record.department}</td>
            <td style={{ ...labelCell, width: '10%' }}>岗位</td>
            <td style={{ ...cell, width: '15%' }}>{record.position}</td>
            <td style={{ ...labelCell, width: '10%' }}>入职日期</td>
            <td style={{ ...cell, width: '15%' }}>{record.entryDate}</td>
          </tr>
          <tr>
            <td style={labelCell}>原工资</td>
            <td style={cell}>
              {record.originalSalary != null ? `${record.originalSalary}元/月` : ''}
            </td>
            <td style={labelCell}>调入部门</td>
            <td style={cell}>{record.targetDepartment}</td>
            <td style={labelCell}>岗位</td>
            <td style={cell}>{record.targetPosition}</td>
            <td style={labelCell}>基础薪资</td>
            <td style={cell}>
              {record.newBaseSalary != null
                ? `${record.newBaseSalary}元/月`
                : record.newSalary != null
                  ? `${record.newSalary}元/月`
                  : ''}
            </td>
          </tr>
          <tr>
            <td style={labelCell}>绩效薪资</td>
            <td colSpan={7} style={cell}>
              {record.newPerformanceSalary != null ? `${record.newPerformanceSalary}元/月` : ''}
            </td>
          </tr>
          <tr>
            <td style={{ ...labelCell }} rowSpan={2}>
              调岗原因
            </td>
            <td colSpan={7} style={{ ...cell, minHeight: 80 }}>
              <div style={{ whiteSpace: 'pre-wrap', minHeight: 48 }}>{record.reason || ''}</div>
              <div
                style={{
                  padding: '8px 0',
                  borderTop: '1px dashed #ccc',
                  marginTop: 8,
                  fontSize: 12,
                }}
              >
                本人自愿调岗并愿意接受所调新岗位的职责和薪资标准。
              </div>
              <div style={{ textAlign: 'right' }}>
                <span>申请人：{record.applicantName || record.createdByName || '________'}</span>
              </div>
            </td>
          </tr>
          <tr>
            <td
              colSpan={7}
              style={{ ...cell, textAlign: 'right', padding: '4px 10px', fontSize: 12 }}
            >
              {record.applyDate
                ? `${dayjs(record.applyDate).format('YYYY')}年${dayjs(record.applyDate).format('MM')}月${dayjs(record.applyDate).format('DD')}日`
                : '________年________月________日'}
            </td>
          </tr>
          {renderApprovalRow('调出部门主管', flowMap.out_department_manager)}
          {renderApprovalRow('人资部初审', flowMap.hr_first_review)}
          {renderApprovalRow('调入部门意见', flowMap.in_department_manager)}
          {renderApprovalRow('业务条线总监意见', flowMap.biz_director)}
          {renderApprovalRow('人资部终审', flowMap.hr_final_review)}
          {hasChairmanStage ? renderApprovalRow('董事长意见', flowMap.chairman) : null}
        </tbody>
      </table>
    </div>
  )
}

const TransferApplicationPage: React.FC = () => {
  const { user: currentUser } = useAuthStore()
  const { currentCampus } = useCampusStore()
  const [loading, setLoading] = useState(false)
  const [records, setRecords] = useState<TransferApplicationRecord[]>([])
  const [users, setUsers] = useState<UserPermissionInfo[]>([])
  const [statusFilter, setStatusFilter] = useState<TransferStatus | undefined>()
  const [keyword, setKeyword] = useState('')
  const [editOpen, setEditOpen] = useState(false)
  const [editLoading, setEditLoading] = useState(false)
  const [editingRecord, setEditingRecord] = useState<TransferApplicationRecord | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailRecord, setDetailRecord] = useState<TransferApplicationRecord | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [printOpen, setPrintOpen] = useState(false)
  const [printRecord, setPrintRecord] = useState<TransferApplicationRecord | null>(null)
  const [printLoading, setPrintLoading] = useState(false)
  const [actionState, setActionState] = useState<{
    open: boolean
    type: 'approve' | 'reject'
    record: TransferApplicationRecord | null
  }>({
    open: false,
    type: 'approve',
    record: null,
  })
  const [actionLoading, setActionLoading] = useState(false)

  const activeCampus = currentCampus || currentUser?.campus || undefined

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [list, campusUsers] = await Promise.all([
        listTransferApplications({
          campus: activeCampus || undefined,
          status: statusFilter,
        }),
        fetchUserPermissions(),
      ])
      setRecords(list)
      setUsers(campusUsers.filter((item) => item.status === 'active'))
    } catch (error) {
      console.error('加载调岗申请失败', error)
      message.error(getErrorMessage(error, '加载调岗申请失败'))
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
        item.targetDepartment,
        item.targetPosition,
        item.campus,
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

  const openEditModal = (record: TransferApplicationRecord) => {
    setEditingRecord(record)
    setEditOpen(true)
  }

  const handleSave = async (payload: TransferApplicationPayload) => {
    try {
      setEditLoading(true)
      if (editingRecord) {
        await updateTransferApplication(editingRecord.id, payload)
        message.success('调岗申请已更新')
      } else {
        await createTransferApplication(payload)
        message.success('调岗申请已创建')
      }
      setEditOpen(false)
      setEditingRecord(null)
      await loadData()
    } catch (error) {
      message.error(getErrorMessage(error, editingRecord ? '更新调岗申请失败' : '创建调岗申请失败'))
    } finally {
      setEditLoading(false)
    }
  }

  const handleDelete = async (record: TransferApplicationRecord) => {
    try {
      await deleteTransferApplication(record.id)
      message.success('调岗申请已删除')
      await loadData()
    } catch (error) {
      message.error(getErrorMessage(error, '删除调岗申请失败'))
    }
  }

  const openDetailModal = async (record: TransferApplicationRecord) => {
    try {
      setDetailLoading(true)
      const detail = await getTransferApplication(record.id)
      setDetailRecord(detail)
      setDetailOpen(true)
    } catch (error) {
      message.error(getErrorMessage(error, '加载详情失败'))
    } finally {
      setDetailLoading(false)
    }
  }

  const openPrintModal = async (record: TransferApplicationRecord) => {
    try {
      setPrintLoading(true)
      const detail = await getTransferApplication(record.id)
      setPrintRecord(detail)
      setPrintOpen(true)
    } catch (error) {
      message.error(getErrorMessage(error, '加载打印详情失败'))
    } finally {
      setPrintLoading(false)
    }
  }

  const handleSubmit = async (record: TransferApplicationRecord) => {
    try {
      await submitTransferApplication(record.id)
      message.success('调岗申请已提交审批')
      await loadData()
    } catch (error) {
      message.error(getErrorMessage(error, '提交调岗申请失败'))
    }
  }

  const handleAction = async (payload: TransferApprovalActionPayload) => {
    const actionRecord = actionState.record
    if (!actionRecord) return
    if (actionState.type === 'reject' && !payload.comment?.trim()) {
      message.warning('驳回时请填写审批意见')
      return
    }

    try {
      setActionLoading(true)
      if (actionState.type === 'approve') {
        await approveTransferApplication(actionRecord.id, payload)
        message.success('审批已通过')
      } else {
        await rejectTransferApplication(actionRecord.id, payload.comment!.trim())
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

  const columns: ColumnsType<TransferApplicationRecord> = [
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
      title: '原部门',
      dataIndex: 'department',
      width: 120,
    },
    {
      title: '原岗位',
      dataIndex: 'position',
      width: 140,
    },
    {
      title: '调入部门',
      dataIndex: 'targetDepartment',
      width: 120,
    },
    {
      title: '调入岗位',
      dataIndex: 'targetPosition',
      width: 140,
    },
    {
      title: '薪资变动',
      width: 120,
      render: (_, record) => {
        if (record.originalSalary == null) return '-'
        const hasSplitSalary =
          record.newBaseSalary != null || record.newPerformanceSalary != null
        const totalNewSalary =
          record.newSalary ??
          (hasSplitSalary
            ? (record.newBaseSalary ?? 0) + (record.newPerformanceSalary ?? 0)
            : null)
        if (totalNewSalary == null) return '-'
        const diff = totalNewSalary - record.originalSalary
        if (diff > 0) return <Tag color="success">+{diff}</Tag>
        if (diff < 0) return <Tag color="error">{diff}</Tag>
        return <Tag>不变</Tag>
      },
    },
    {
      title: '所属神殿',
      dataIndex: 'campus',
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
              <SwapOutlined style={{ fontSize: 18 }} />
              <Title level={5} style={{ margin: 0 }}>
                员工调岗申请表
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
                placeholder="搜索单号/姓名/部门/岗位"
                prefix={<SearchOutlined />}
                style={{ width: 260 }}
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
              <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
                新建调岗申请
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
          locale={{ emptyText: '暂无调岗申请' }}
        />
      </Card>

      <EditModal
        open={editOpen}
        loading={editLoading}
        campus={activeCampus}
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
        title="调岗申请打印预览"
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

export default TransferApplicationPage
