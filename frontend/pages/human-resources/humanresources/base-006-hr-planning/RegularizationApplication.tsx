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
} from '@ant-design/icons'
import dayjs, { type Dayjs } from 'dayjs'
import { useAuthStore } from '@/stores/authStore'
import { useCampusStore } from '@/stores/campusStore'
import {
  approveRegularizationApplication,
  createRegularizationApplication,
  deleteRegularizationApplication,
  getRegularizationApplication,
  listRegularizationApplications,
  previewRegularizationApproverCandidates,
  rejectRegularizationApplication,
  submitRegularizationApplication,
  type RegularizationApprovalPreviewStage,
  type RegularizationApplicationPayload,
  type RegularizationApplicationRecord,
  type RegularizationStatus,
  updateRegularizationApplication,
} from '@/services/humanresources/regularizationApplication'
import { type WorkReportStatus } from '@/services/humanresources/workReport'
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

const MAIN_WORK_MIN_LENGTH = 120
const SELF_EVALUATION_MIN_LENGTH = 50

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

const getDecisionLabel = (value?: boolean | null) => {
  if (value == null) return '待处理'
  return value ? '通过' : '未通过'
}

const renderDecisionTag = (value?: boolean | null) => {
  if (value == null) {
    return <Tag>待处理</Tag>
  }
  return <Tag color={value ? 'success' : 'error'}>{value ? '通过' : '未通过'}</Tag>
}

const countMeaningfulCharacters = (value?: string) => (value || '').replace(/\s+/g, '').length

const createMinLengthRule = (label: string, minLength: number) => ({
  validator: async (_: unknown, value?: string) => {
    if (!value?.trim()) {
      return
    }
    if (countMeaningfulCharacters(value) < minLength) {
      throw new Error(`${label}不能少于${minLength}字`)
    }
  },
})

type RegularizationApplicationProps = {
  workReportStatus: WorkReportStatus
  workReportStatusLoading: boolean
}

type EditModalProps = {
  open: boolean
  loading: boolean
  campus?: string | null
  currentUserCampus?: string | null
  currentUserName?: string | null
  currentUserDepartment?: string | null
  currentUserPosition?: string | null
  editingRecord: RegularizationApplicationRecord | null
  users: UserPermissionInfo[]
  onCancel: () => void
  onOk: (payload: RegularizationApplicationPayload) => Promise<void>
}

const EditModal: React.FC<EditModalProps> = ({
  open,
  loading,
  campus,
  currentUserCampus,
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
  const [approverPreview, setApproverPreview] = useState<RegularizationApprovalPreviewStage[]>([])
  const [approverPreviewLoading, setApproverPreviewLoading] = useState(false)

  const campusUsers = useMemo(() => {
    if (!campus) return users
    return users.filter((item) => item.campus === campus)
  }, [campus, users])

  const departmentOptions = useMemo(() => {
    const values = new Set<string>()
    campusUsers.forEach((item) => item.department && values.add(item.department))
    if (currentUserDepartment) {
      values.add(currentUserDepartment)
    }
    if (editingRecord?.department) {
      values.add(editingRecord.department)
    }
    return Array.from(values).sort((a, b) => a.localeCompare(b, 'zh-CN'))
  }, [campusUsers, currentUserDepartment, editingRecord])

  const positionOptions = useMemo(() => {
    const values = new Set<string>()
    campusUsers.forEach((item) => {
      if (!item.position) return
      if (!selectedDepartment || item.department === selectedDepartment) {
        values.add(item.position)
      }
    })
    if (currentUserPosition) {
      values.add(currentUserPosition)
    }
    if (editingRecord?.position) {
      values.add(editingRecord.position)
    }
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
        campus: currentUserCampus || editingRecord.campus,
        name: currentUserName || editingRecord.name,
        department: currentUserDepartment || editingRecord.department,
        position: currentUserPosition || editingRecord.position,
        gender: editingRecord.gender || undefined,
        entryDate: dayjs(editingRecord.entryDate),
        regularSalary: editingRecord.regularSalary ?? undefined,
        probationRange: [
          dayjs(editingRecord.probationStart),
          dayjs(editingRecord.probationEnd),
        ],
        probationSalary: editingRecord.probationSalary ?? undefined,
        mainWork: editingRecord.mainWork,
        suggestion: editingRecord.suggestion || undefined,
        selfEvaluation: editingRecord.selfEvaluation,
        selectedApproverUserIds: editingRecord.selectedApproverUserIds || {},
      })
      return
    }

    form.setFieldsValue({
      fillDate: dayjs(),
      campus: currentUserCampus || campus || undefined,
      name: currentUserName || undefined,
      department: currentUserDepartment || undefined,
      position: currentUserPosition || undefined,
      selectedApproverUserIds: {},
    })
  }, [
    campus,
    currentUserCampus,
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
    previewRegularizationApproverCandidates({
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
          ),
        )
      })
      .catch((error) => {
        if (!active) return
        console.error('加载转正审批人预填写失败', error)
        message.error(getErrorMessage(error, '加载转正审批人预填写失败'))
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
    const probationRange = values.probationRange as [Dayjs, Dayjs]
    await onOk({
      fillDate: (values.fillDate as Dayjs).format('YYYY-MM-DD'),
      campus: values.campus,
      name: values.name,
      department: values.department,
      position: values.position,
      gender: values.gender || undefined,
      entryDate: (values.entryDate as Dayjs).format('YYYY-MM-DD'),
      regularSalary: values.regularSalary ?? undefined,
      probationStart: probationRange[0].format('YYYY-MM-DD'),
      probationEnd: probationRange[1].format('YYYY-MM-DD'),
      probationSalary: values.probationSalary ?? undefined,
      mainWork: values.mainWork,
      suggestion: values.suggestion || undefined,
      selfEvaluation: values.selfEvaluation,
      selectedApproverUserIds: normalizeSelectedApproverMap(values.selectedApproverUserIds),
    })
  }

  return (
    <Modal
      title={editingRecord ? '编辑转正申请' : '新建转正申请'}
      open={open}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={loading}
      okText="保存"
      cancelText="取消"
      width={960}
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
              extra="由当前登录账号自动带出，不可修改"
              rules={[{ required: true, message: '请填写所属神殿' }]}
            >
              <Input disabled placeholder="当前神殿" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="name"
              label="姓名"
              extra="需转正员工账号本人填写，不可修改"
              rules={[{ required: true, message: '请输入姓名' }]}
            >
              <Input disabled placeholder="当前账号姓名" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="department"
              label="所在部门"
              extra="由当前登录账号自动带出，不可修改"
              rules={[{ required: true, message: '请输入所在部门' }]}
            >
              <AutoComplete
                disabled
                options={departmentOptions.map((value) => ({ value }))}
                placeholder="支持输入或选择所在部门"
                filterOption={(inputValue, option) =>
                  String(option?.value || '').toLowerCase().includes(inputValue.toLowerCase())
                }
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="position"
              label="试用岗位"
              extra="由当前登录账号自动带出，不可修改"
              rules={[{ required: true, message: '请输入试用岗位' }]}
            >
              <AutoComplete
                disabled
                options={positionOptions}
                placeholder="支持输入或选择岗位"
                filterOption={(inputValue, option) =>
                  String(option?.value || '').toLowerCase().includes(inputValue.toLowerCase())
                }
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="gender" label="性别">
              <Select
                allowClear
                placeholder="请选择性别"
                options={[
                  { label: '男', value: '男' },
                  { label: '女', value: '女' },
                ]}
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
            <Form.Item
              name="probationRange"
              label="试用期"
              rules={[{ required: true, message: '请选择试用期' }]}
            >
              <DatePicker.RangePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="probationSalary" label="试用期工资">
              <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入试用期工资" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="regularSalary" label="转正工资">
              <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入转正工资" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="mainWork"
          label="试用期主要工作"
          extra={`不少于${MAIN_WORK_MIN_LENGTH}字`}
          rules={[
            { required: true, message: '请填写试用期主要工作' },
            createMinLengthRule('试用期主要工作', MAIN_WORK_MIN_LENGTH),
          ]}
        >
          <TextArea rows={6} placeholder="请填写试用期主要工作" />
        </Form.Item>

        <Form.Item name="suggestion" label="对学校有何建议" extra="不限字数">
          <TextArea rows={4} placeholder="不限字数，可选填" />
        </Form.Item>

        <Form.Item
          name="selfEvaluation"
          label="自我鉴定"
          extra={`不少于${SELF_EVALUATION_MIN_LENGTH}字`}
          rules={[
            { required: true, message: '请填写自我鉴定' },
            createMinLengthRule('自我鉴定', SELF_EVALUATION_MIN_LENGTH),
          ]}
        >
          <TextArea rows={5} placeholder="请填写自我鉴定" />
        </Form.Item>

        <ApproverSelectionSection
          previewStages={approverPreview}
          loading={approverPreviewLoading}
          title="审批人预填写"
          description="转正申请会先读取配置中心的默认模板，再按 public.users 的神殿、部门、职位规则给出候选审批人；你可以逐环节搜索并调整。"
          emptyText="请先确认所属神殿、所在部门和试用岗位，系统会自动预填写审批环节。"
        />
      </Form>
    </Modal>
  )
}

type ApprovalActionModalProps = {
  open: boolean
  loading: boolean
  type: 'approve' | 'reject'
  record: RegularizationApplicationRecord | null
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
  const [comment, setComment] = useState('')

  useEffect(() => {
    if (open) {
      setComment(type === 'approve' ? '通过' : '')
    }
  }, [open, type])

  return (
    <Modal
      title={type === 'approve' ? '审批通过' : '审批驳回'}
      open={open}
      onCancel={onCancel}
      onOk={() => onOk(comment)}
      okText={type === 'approve' ? '确认通过' : '确认驳回'}
      cancelText="取消"
      confirmLoading={loading}
      destroyOnClose
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <Text type="secondary">
          当前审批阶段：{record?.currentStageLabel || '-'}
        </Text>
        <TextArea
          rows={4}
          placeholder={type === 'approve' ? '可填写审批意见（选填）' : '驳回时请填写审批意见'}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </Space>
    </Modal>
  )
}

type DetailModalProps = {
  open: boolean
  record: RegularizationApplicationRecord | null
  onCancel: () => void
}

const DetailModal: React.FC<DetailModalProps> = ({ open, record, onCancel }) => {
  if (!record) return null
  const flowStageSet = new Set(record.approvalFlow.map((item) => item.stage))
  const hasDepartmentHeadStage = flowStageSet.has('department_head')
  const hasVicePrincipalStage = flowStageSet.has('vice_principal')
  const hasPrincipalStage = flowStageSet.has('principal')
  const hasHrStage = flowStageSet.has('hr')
  const hasChairmanStage = flowStageSet.has('chairman')

  return (
    <Modal
      title="转正申请详情"
      open={open}
      onCancel={onCancel}
      footer={[
        <Button key="close" onClick={onCancel}>
          关闭
        </Button>,
      ]}
      width={1000}
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Descriptions
          bordered
          size="small"
          column={2}
          items={[
            { key: 'applicationNo', label: '申请单号', children: record.applicationNo },
            { key: 'status', label: '状态', children: <Tag color={STATUS_COLOR_MAP[record.status]}>{record.statusLabel}</Tag> },
            { key: 'campus', label: '所属神殿', children: record.campus || '-' },
            { key: 'creator', label: '申请人', children: record.createdByName || '-' },
            { key: 'fillDate', label: '填表日期', children: record.fillDate },
            { key: 'name', label: '姓名', children: record.name },
            { key: 'department', label: '所在部门', children: record.department },
            { key: 'position', label: '试用岗位', children: record.position },
            { key: 'gender', label: '性别', children: record.gender || '-' },
            { key: 'entryDate', label: '入职时间', children: record.entryDate },
            {
              key: 'probationRange',
              label: '试用期',
              children: `${record.probationStart} 至 ${record.probationEnd}`,
              span: 2,
            },
            {
              key: 'salary',
              label: '薪资信息',
              children: `试用期工资：${record.probationSalary ?? '-'} / 转正工资：${record.regularSalary ?? '-'}`,
              span: 2,
            },
            { key: 'mainWork', label: '试用期主要工作', children: record.mainWork || '-', span: 2 },
            { key: 'suggestion', label: '对学校建议', children: record.suggestion || '-', span: 2 },
            { key: 'selfEvaluation', label: '自我鉴定', children: record.selfEvaluation || '-', span: 2 },
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
            {
              key: 'result',
              label: '最终结果',
              children: renderDecisionTag(record.isPassed),
            },
            {
              key: 'rejectionReason',
              label: '驳回原因',
              children: record.rejectionReason || '-',
            },
            ...(hasDepartmentHeadStage
              ? [
                  {
                    key: 'deptDecision',
                    label: '部门负责人结果',
                    children: renderDecisionTag(record.departmentHeadPassed),
                  },
                ]
              : []),
            ...(hasVicePrincipalStage
              ? [
                  {
                    key: 'vicePrincipalDecision',
                    label: '副校长结果',
                    children: renderDecisionTag(record.vicePrincipalPassed),
                  },
                ]
              : []),
            ...(hasPrincipalStage
              ? [
                  {
                    key: 'principalDecision',
                    label: '校长结果',
                    children: renderDecisionTag(record.principalPassed),
                  },
                ]
              : []),
            ...(hasHrStage
              ? [
                  {
                    key: 'hrDecision',
                    label: '集团人力资源部结果',
                    children: renderDecisionTag(record.hrPassed),
                  },
                ]
              : []),
            ...(hasChairmanStage
              ? [
                  {
                    key: 'chairmanDecision',
                    label: '董事长结果',
                    children: renderDecisionTag(record.chairmanPassed),
                  },
                ]
              : []),
            ...(hasDepartmentHeadStage
              ? [
                  {
                    key: 'deptOpinion',
                    label: '部门负责人意见',
                    children: record.departmentHeadOpinion || '-',
                    span: 2,
                  },
                ]
              : []),
            ...(hasVicePrincipalStage
              ? [
                  {
                    key: 'vicePrincipalOpinion',
                    label: '副校长意见',
                    children: record.vicePrincipalOpinion || '-',
                    span: 2,
                  },
                ]
              : []),
            ...(hasPrincipalStage
              ? [
                  {
                    key: 'principalOpinion',
                    label: '校长意见',
                    children: record.principalOpinion || '-',
                    span: 2,
                  },
                ]
              : []),
            ...(hasHrStage
              ? [
                  {
                    key: 'hrOpinion',
                    label: '集团人力资源部意见',
                    children: record.hrOpinion || '-',
                    span: 2,
                  },
                ]
              : []),
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

        <Card size="small" title="审批流程轨迹">
          <List
            dataSource={record.approvalFlow}
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
            dataSource={record.approvalActions}
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
      </Space>
    </Modal>
  )
}

type PrintPreviewProps = {
  record: RegularizationApplicationRecord
}

const PrintPreview: React.FC<PrintPreviewProps> = ({ record }) => {
  const flowStageSet = new Set(record.approvalFlow.map((item) => item.stage))
  const hasDepartmentHeadStage = flowStageSet.has('department_head')
  const hasVicePrincipalStage = flowStageSet.has('vice_principal')
  const hasPrincipalStage = flowStageSet.has('principal')
  const hasHrStage = flowStageSet.has('hr')
  const hasChairmanStage = flowStageSet.has('chairman')
  const cellStyle: React.CSSProperties = {
    border: '1px solid #333',
    padding: '8px 12px',
    fontSize: 14,
    lineHeight: 1.8,
  }
  const labelStyle: React.CSSProperties = {
    ...cellStyle,
    background: '#f5f5f5',
    fontWeight: 600,
    textAlign: 'center',
    whiteSpace: 'nowrap',
  }

  return (
    <div style={{ padding: '20px 32px', fontFamily: 'SimSun, serif' }}>
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <Title level={3} style={{ margin: 0 }}>
          员工转正申请表
        </Title>
      </div>
      <div style={{ textAlign: 'right', marginBottom: 8, fontSize: 14 }}>
        填表日期：{record.fillDate || '______'}
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
            <td style={{ ...labelStyle, width: '14%' }}>姓　名</td>
            <td style={{ ...cellStyle, width: '19%' }}>{record.name}</td>
            <td style={{ ...labelStyle, width: '14%' }}>部　门</td>
            <td style={{ ...cellStyle, width: '19%' }}>{record.department}</td>
            <td style={{ ...labelStyle, width: '14%' }}>岗　位</td>
            <td style={{ ...cellStyle, width: '20%' }}>{record.position}</td>
          </tr>
          <tr>
            <td style={labelStyle}>性　别</td>
            <td style={cellStyle}>{record.gender || '-'}</td>
            <td style={labelStyle}>入职时间</td>
            <td style={cellStyle}>{record.entryDate}</td>
            <td style={labelStyle}>转正工资</td>
            <td style={cellStyle}>{record.regularSalary ?? '-'}</td>
          </tr>
          <tr>
            <td style={labelStyle}>试用期</td>
            <td colSpan={3} style={cellStyle}>
              {record.probationStart} 至 {record.probationEnd}
            </td>
            <td style={labelStyle}>试用期工资</td>
            <td style={cellStyle}>{record.probationSalary ?? '-'}</td>
          </tr>
          <tr>
            <td
              rowSpan={2}
              style={{
                ...labelStyle,
                writingMode: 'vertical-rl',
                letterSpacing: 8,
              }}
            >
              评核内容
            </td>
            <td style={labelStyle}>试用期主要工作</td>
            <td colSpan={4} style={{ ...cellStyle, minHeight: 120 }}>
              <div style={{ whiteSpace: 'pre-wrap', minHeight: 100 }}>{record.mainWork || ''}</div>
            </td>
          </tr>
          <tr>
            <td style={labelStyle}>对学校有何建议</td>
            <td colSpan={4} style={{ ...cellStyle, minHeight: 90 }}>
              <div style={{ whiteSpace: 'pre-wrap', minHeight: 70 }}>{record.suggestion || ''}</div>
            </td>
          </tr>
          <tr>
            <td colSpan={2} style={labelStyle}>
              自我鉴定
            </td>
            <td colSpan={4} style={{ ...cellStyle, minHeight: 100 }}>
              <div style={{ whiteSpace: 'pre-wrap', minHeight: 80 }}>{record.selfEvaluation || ''}</div>
            </td>
          </tr>
          {hasDepartmentHeadStage ? (
            <tr>
              <td colSpan={2} style={{ ...labelStyle, height: 90 }}>
                部门负责人意见
              </td>
              <td colSpan={4} style={cellStyle}>
                <div style={{ whiteSpace: 'pre-wrap', minHeight: 40 }}>
                  {record.departmentHeadOpinion || ''}
                </div>
                <div style={{ textAlign: 'right', marginTop: 8 }}>
                  审批结果：{getDecisionLabel(record.departmentHeadPassed)}
                </div>
              </td>
            </tr>
          ) : null}
          {hasVicePrincipalStage ? (
            <tr>
              <td colSpan={2} style={{ ...labelStyle, height: 90 }}>
                副校长意见
              </td>
              <td colSpan={4} style={cellStyle}>
                <div style={{ whiteSpace: 'pre-wrap', minHeight: 40 }}>
                  {record.vicePrincipalOpinion || ''}
                </div>
                <div style={{ textAlign: 'right', marginTop: 8 }}>
                  审批结果：{getDecisionLabel(record.vicePrincipalPassed)}
                </div>
              </td>
            </tr>
          ) : null}
          {hasPrincipalStage ? (
            <tr>
              <td colSpan={2} style={{ ...labelStyle, height: 90 }}>
                校长意见
              </td>
              <td colSpan={4} style={cellStyle}>
                <div style={{ whiteSpace: 'pre-wrap', minHeight: 40 }}>
                  {record.principalOpinion || ''}
                </div>
                <div style={{ textAlign: 'right', marginTop: 8 }}>
                  审批结果：{getDecisionLabel(record.principalPassed)}
                </div>
              </td>
            </tr>
          ) : null}
          {hasHrStage ? (
            <tr>
              <td colSpan={2} style={{ ...labelStyle, height: 90 }}>
                集团人力资源部意见
              </td>
              <td colSpan={4} style={cellStyle}>
                <div style={{ whiteSpace: 'pre-wrap', minHeight: 40 }}>{record.hrOpinion || ''}</div>
                <div style={{ textAlign: 'right', marginTop: 8 }}>
                  审批结果：{getDecisionLabel(record.hrPassed)}
                </div>
              </td>
            </tr>
          ) : null}
          {hasChairmanStage ? (
            <tr>
              <td colSpan={2} style={{ ...labelStyle, height: 90 }}>
                董事长意见
              </td>
              <td colSpan={4} style={cellStyle}>
                <div style={{ whiteSpace: 'pre-wrap', minHeight: 40 }}>
                  {record.chairmanOpinion || ''}
                </div>
                <div style={{ textAlign: 'right', marginTop: 8 }}>
                  审批结果：{getDecisionLabel(record.chairmanPassed)}
                </div>
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  )
}

type PrintModalProps = {
  open: boolean
  record: RegularizationApplicationRecord | null
  onCancel: () => void
}

const PrintModal: React.FC<PrintModalProps> = ({ open, record, onCancel }) => {
  if (!record) return null

  return (
    <Modal
      title="转正申请打印预览"
      open={open}
      onCancel={onCancel}
      footer={[
        <Button key="close" onClick={onCancel}>
          关闭
        </Button>,
        <Button key="print" type="primary" onClick={() => window.print()}>
          打印
        </Button>,
      ]}
      width={920}
    >
      <PrintPreview record={record} />
    </Modal>
  )
}

const RegularizationApplication: React.FC<RegularizationApplicationProps> = ({
  workReportStatus,
  workReportStatusLoading,
}) => {
  const { currentCampus } = useCampusStore()
  const currentUser = useAuthStore((state) => state.user)
  const applicantCampus = currentUser?.campus?.trim() || undefined
  const activeCampus = applicantCampus || currentCampus || undefined
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [records, setRecords] = useState<RegularizationApplicationRecord[]>([])
  const [users, setUsers] = useState<UserPermissionInfo[]>([])
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<RegularizationApplicationRecord | null>(null)
  const [detailRecord, setDetailRecord] = useState<RegularizationApplicationRecord | null>(null)
  const [printRecord, setPrintRecord] = useState<RegularizationApplicationRecord | null>(null)
  const [statusFilter, setStatusFilter] = useState<RegularizationStatus>()
  const [searchText, setSearchText] = useState('')
  const [actionRecord, setActionRecord] = useState<RegularizationApplicationRecord | null>(null)
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve')
  const [actionModalOpen, setActionModalOpen] = useState(false)

  const loadUsers = useCallback(async () => {
    try {
      const data = await fetchUserPermissions()
      setUsers(data.filter((item) => item.status === 'active'))
    } catch (error) {
      console.error('加载用户选项失败', error)
    }
  }, [])

  const loadRecords = useCallback(async () => {
    try {
      setLoading(true)
      const data = await listRegularizationApplications({
        campus: activeCampus,
        status: statusFilter,
      })
      setRecords(data)
    } catch (error) {
      console.error('加载转正申请失败', error)
      message.error(getErrorMessage(error, '加载转正申请失败'))
    } finally {
      setLoading(false)
    }
  }, [activeCampus, statusFilter])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  useEffect(() => {
    loadRecords()
  }, [loadRecords])

  const refreshRecordDetail = useCallback(async (applicationId: number) => {
    return getRegularizationApplication(applicationId)
  }, [])

  const filteredRecords = useMemo(() => {
    const keyword = searchText.trim().toLowerCase()
    if (!keyword) return records
    return records.filter((item) =>
      [
        item.applicationNo,
        item.name,
        item.department,
        item.position,
        item.createdByName,
        item.statusLabel,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword)),
    )
  }, [records, searchText])

  const openCreate = () => {
    if (!workReportStatus.hasCompletedReport) {
      message.warning('请先填写述职报告后再填写转正申请表')
      return
    }
    setEditingRecord(null)
    setEditModalOpen(true)
  }

  const openEdit = async (record: RegularizationApplicationRecord) => {
    try {
      const detail = await refreshRecordDetail(record.id)
      setEditingRecord(detail)
      setEditModalOpen(true)
    } catch (error) {
      message.error(getErrorMessage(error, '加载申请详情失败'))
    }
  }

  const openDetail = async (record: RegularizationApplicationRecord) => {
    try {
      const detail = await refreshRecordDetail(record.id)
      setDetailRecord(detail)
    } catch (error) {
      message.error(getErrorMessage(error, '加载申请详情失败'))
    }
  }

  const openPrint = async (record: RegularizationApplicationRecord) => {
    try {
      const detail = await refreshRecordDetail(record.id)
      setPrintRecord(detail)
    } catch (error) {
      message.error(getErrorMessage(error, '加载打印详情失败'))
    }
  }

  const handleSave = async (payload: RegularizationApplicationPayload) => {
    try {
      setSaving(true)
      const normalizedPayload = {
        ...payload,
        campus: applicantCampus || payload.campus || currentCampus || '',
        name: currentUser?.name?.trim() || payload.name,
        department: currentUser?.department?.trim() || payload.department,
        position: currentUser?.position?.trim() || payload.position,
      }
      if (!normalizedPayload.campus) {
        message.warning('请先选择当前神殿')
        return
      }
      if (!editingRecord && !workReportStatus.hasCompletedReport) {
        message.warning('请先填写述职报告后再填写转正申请表')
        return
      }

      if (editingRecord) {
        await updateRegularizationApplication(editingRecord.id, normalizedPayload)
        message.success('转正申请已更新')
      } else {
        await createRegularizationApplication(normalizedPayload)
        message.success('转正申请已创建')
      }
      setEditModalOpen(false)
      setEditingRecord(null)
      await loadRecords()
    } catch (error) {
      message.error(getErrorMessage(error, '保存转正申请失败'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (record: RegularizationApplicationRecord) => {
    try {
      await deleteRegularizationApplication(record.id)
      message.success('转正申请已删除')
      await loadRecords()
    } catch (error) {
      message.error(getErrorMessage(error, '删除转正申请失败'))
    }
  }

  const handleSubmit = async (record: RegularizationApplicationRecord) => {
    try {
      await submitRegularizationApplication(record.id)
      message.success('转正申请已提交审批')
      await loadRecords()
    } catch (error) {
      message.error(getErrorMessage(error, '提交审批失败'))
    }
  }

  const openActionModal = async (
    type: 'approve' | 'reject',
    record: RegularizationApplicationRecord,
  ) => {
    try {
      const detail = await refreshRecordDetail(record.id)
      setActionType(type)
      setActionRecord(detail)
      setActionModalOpen(true)
    } catch (error) {
      message.error(getErrorMessage(error, '加载审批详情失败'))
    }
  }

  const handleActionSubmit = async (comment: string) => {
    if (!actionRecord) return
    if (actionType === 'reject' && !comment.trim()) {
      message.warning('驳回时请填写审批意见')
      return
    }
    try {
      setSaving(true)
      if (actionType === 'approve') {
        await approveRegularizationApplication(actionRecord.id, comment.trim() || undefined)
        message.success('审批已通过')
      } else {
        await rejectRegularizationApplication(actionRecord.id, comment.trim())
        message.success('申请已驳回')
      }
      setActionModalOpen(false)
      setActionRecord(null)
      await loadRecords()
    } catch (error) {
      if (isApprovalStateChangedError(error)) {
        message.warning('该申请的审批状态已变化，正在刷新最新数据')
        setActionModalOpen(false)
        setActionRecord(null)
        await loadRecords()
        return
      }
      message.error(getErrorMessage(error, '审批操作失败'))
    } finally {
      setSaving(false)
    }
  }

  const columns: ColumnsType<RegularizationApplicationRecord> = [
    {
      title: '申请单号',
      dataIndex: 'applicationNo',
      width: 220,
      fixed: 'left',
    },
    {
      title: '填表日期',
      dataIndex: 'fillDate',
      width: 120,
    },
    {
      title: '神殿',
      dataIndex: 'campus',
      width: 140,
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
      title: '试用岗位',
      dataIndex: 'position',
      width: 140,
    },
    {
      title: '试用期',
      width: 220,
      render: (_, record) => `${record.probationStart} 至 ${record.probationEnd}`,
    },
    {
      title: '申请人',
      dataIndex: 'createdByName',
      width: 120,
      render: (value) => value || '-',
    },
    {
      title: '状态',
      width: 120,
      render: (_, record) => (
        <Tooltip title={record.rejectionReason || ''}>
          <Tag color={STATUS_COLOR_MAP[record.status] || 'default'}>{record.statusLabel}</Tag>
        </Tooltip>
      ),
    },
    {
      title: '当前阶段',
      dataIndex: 'currentStageLabel',
      width: 120,
      render: (value) => value || '-',
    },
    {
      title: '当前审批人',
      width: 180,
      render: (_, record) =>
        record.currentApprovers.length
          ? record.currentApprovers.map((item) => item.name).join('、')
          : '-',
    },
    {
      title: '最终结果',
      width: 120,
      render: (_, record) => renderDecisionTag(record.isPassed),
    },
    {
      title: '操作',
      key: 'action',
      width: 320,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small" wrap>
          <Tooltip title="详情">
            <Button size="small" type="link" icon={<EyeOutlined />} onClick={() => openDetail(record)} />
          </Tooltip>
          <Tooltip title="打印预览">
            <Button
              size="small"
              type="link"
              icon={<PrinterOutlined />}
              onClick={() => openPrint(record)}
            />
          </Tooltip>
          {record.canEdit ? (
            <Tooltip title="编辑">
              <Button size="small" type="link" icon={<EditOutlined />} onClick={() => openEdit(record)} />
            </Tooltip>
          ) : null}
          {record.canSubmit ? (
            <Tooltip title="提交审批">
              <Button size="small" type="link" icon={<SendOutlined />} onClick={() => handleSubmit(record)} />
            </Tooltip>
          ) : null}
          {record.canApprove ? (
            <>
              <Tooltip title="通过">
                <Button
                  size="small"
                  type="link"
                  icon={<CheckOutlined />}
                  onClick={() => openActionModal('approve', record)}
                />
              </Tooltip>
              <Tooltip title="驳回">
                <Button
                  size="small"
                  type="link"
                  danger
                  icon={<CloseOutlined />}
                  onClick={() => openActionModal('reject', record)}
                />
              </Tooltip>
            </>
          ) : null}
          {record.canDelete ? (
            <Popconfirm title="确认删除该申请？" onConfirm={() => handleDelete(record)}>
              <Tooltip title="删除">
                <Button size="small" type="link" danger icon={<DeleteOutlined />} />
              </Tooltip>
            </Popconfirm>
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
              <Tooltip
                title={
                  workReportStatus.hasCompletedReport
                    ? undefined
                    : '请先填写述职报告后再新增转正申请'
                }
              >
                <span>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={openCreate}
                    disabled={!workReportStatus.hasCompletedReport || workReportStatusLoading}
                    loading={workReportStatusLoading}
                  >
                    新增转正申请
                  </Button>
                </span>
              </Tooltip>
              <Text type="secondary">申请归属神殿：{activeCampus || '未识别'}</Text>
              <Text type={workReportStatus.hasCompletedReport ? 'secondary' : 'danger'}>
                {workReportStatus.hasCompletedReport
                  ? `述职报告已完成${workReportStatus.latestReportDate ? `（最近填写：${workReportStatus.latestReportDate}）` : ''}`
                  : '请先填写述职报告，再发起转正申请'}
              </Text>
            </Space>
          </Col>
          <Col>
            <Space>
              <Select
                allowClear
                placeholder="按状态筛选"
                style={{ width: 160 }}
                value={statusFilter}
                onChange={(value) => setStatusFilter(value)}
                options={[
                  { label: '草稿', value: 'draft' },
                  { label: '审批中', value: 'pending' },
                  { label: '已通过', value: 'approved' },
                  { label: '已驳回', value: 'rejected' },
                ]}
              />
              <Input
                placeholder="搜索单号/姓名/部门/岗位/申请人"
                prefix={<SearchOutlined />}
                allowClear
                style={{ width: 300 }}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </Space>
          </Col>
        </Row>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={filteredRecords}
          rowKey="id"
          loading={loading}
          bordered
          pagination={{ pageSize: 10, showSizeChanger: true }}
          scroll={{ x: 1900 }}
        />
      </Card>

      <EditModal
        open={editModalOpen}
        loading={saving}
        campus={editingRecord?.campus || activeCampus}
        currentUserCampus={currentUser?.campus}
        currentUserName={currentUser?.name}
        currentUserDepartment={currentUser?.department}
        currentUserPosition={currentUser?.position}
        editingRecord={editingRecord}
        users={users}
        onCancel={() => {
          setEditModalOpen(false)
          setEditingRecord(null)
        }}
        onOk={handleSave}
      />

      <ApprovalActionModal
        open={actionModalOpen}
        loading={saving}
        type={actionType}
        record={actionRecord}
        onCancel={() => {
          setActionModalOpen(false)
          setActionRecord(null)
        }}
        onOk={handleActionSubmit}
      />

      <DetailModal open={!!detailRecord} record={detailRecord} onCancel={() => setDetailRecord(null)} />
      <PrintModal open={!!printRecord} record={printRecord} onCancel={() => setPrintRecord(null)} />
    </div>
  )
}

export default RegularizationApplication