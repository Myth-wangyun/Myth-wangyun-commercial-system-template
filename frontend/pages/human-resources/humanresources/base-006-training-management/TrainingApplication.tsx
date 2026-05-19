import React, { useEffect, useMemo, useState } from 'react'
import {
  App,
  Button,
  Card,
  Checkbox,
  Col,
  DatePicker,
  Divider,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Result,
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
  ReloadOutlined,
  SearchOutlined,
  SendOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { useAuthStore } from '@/stores/authStore'
import { useCampusStore } from '@/stores/campusStore'
import { fetchEmployeeDepartments } from '@/services/configMaster'
import { canAccessTrainingApplication } from '@/utils/trainingApplicationAccess'
import {
  approveTrainingApplication,
  createTrainingApplication,
  deleteTrainingApplication,
  listTrainingApplicationsPaged,
  previewTrainingApplicationApprovers,
  rejectTrainingApplication,
  submitTrainingApplication,
  type ExamMethod,
  type TrainingApplicationApprovalFlowStep,
  type TrainingApplicationApprovalPreviewStage,
  type TrainingApplicationPayload,
  type TrainingApplicationRecord,
  type TrainingCategory,
  type TrainingFormat,
  updateTrainingApplication,
} from '@/services/humanresources/trainingApplication'
import {
  ApproverSelectionSection,
  mergeApproverSelections,
  normalizeSelectedApproverMap,
} from '@/components/human-resources/ApproverSelectionSection'

const { Text, Title } = Typography
const { TextArea } = Input

const CATEGORY_OPTIONS: TrainingCategory[] = ['思想', '业务', '管理']
const FORMAT_OPTIONS: TrainingFormat[] = ['线上', '线下', '线上+线下']
const EXAM_OPTIONS: ExamMethod[] = ['理论', '实操', '理论+实操']
const HR_ADMIN_KEYWORDS = ['人事', '人力', '人资', '行政']
const CAMPUS_VALUE_SEPARATOR = '、'
const AUTO_CHAIRMAN_THRESHOLD = 500

type TrainingApplicationProps = {
  onFollowupRecordsGenerated?: () => void
}

const STATUS_COLOR_MAP: Record<string, string> = {
  draft: 'default',
  pending: 'processing',
  approved: 'success',
  rejected: 'error',
}

type ErrorWithResponse = {
  response?: { data?: { detail?: string } }
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

const getTotalAmount = (record: Pick<TrainingApplicationRecord, 'costTotal' | 'costOther'>) =>
  Number(record.costTotal || 0) + Number(record.costOther || 0)

const isHrAdministrativeUser = (department?: string | null, position?: string | null) => {
  const normalizedDepartment = (department || '').replace(/\s+/g, '').trim()
  const normalizedPosition = (position || '').replace(/\s+/g, '').trim()
  return HR_ADMIN_KEYWORDS.some(
    (keyword) => normalizedDepartment.includes(keyword) || normalizedPosition.includes(keyword),
  )
}

const splitCampusValue = (value?: string | null) =>
  (value || '')
    .split(/[、,，;；\n]+/)
    .map((item) => item.trim())
    .filter(Boolean)

const toCampusSubmitValue = (value: string | string[] | null | undefined) => {
  if (Array.isArray(value)) {
    return Array.from(new Set(value.map((item) => item.trim()).filter(Boolean))).join(CAMPUS_VALUE_SEPARATOR)
  }
  return (value || '').trim()
}

type EditModalProps = {
  open: boolean
  loading: boolean
  campus?: string
  department?: string | null
  campusOptions: Array<{ label: string; value: string }>
  departmentOptions: Array<{ label: string; value: string }>
  allowMultiCampus: boolean
  editingRecord: TrainingApplicationRecord | null
  onCancel: () => void
  onOk: (payload: TrainingApplicationPayload) => Promise<void>
}

const EditModal: React.FC<EditModalProps> = ({
  open,
  loading,
  campus,
  department,
  campusOptions,
  departmentOptions,
  allowMultiCampus,
  editingRecord,
  onCancel,
  onOk,
}) => {
  const [form] = Form.useForm()
  const selectedCampus = Form.useWatch('campus', form)
  const selectedDepartment = Form.useWatch('department', form)
  const selectedCategory = Form.useWatch('category', form)
  const isInternalTraining = Form.useWatch('isInternalTraining', form)
  const isKeyStaffTraining = Form.useWatch('isKeyStaffTraining', form)
  const includeChairmanApproval = Form.useWatch('includeChairmanApproval', form)
  const costPerPerson = Form.useWatch('costPerPerson', form)
  const costCount = Form.useWatch('costCount', form)
  const costOther = Form.useWatch('costOther', form)
  const [approverPreview, setApproverPreview] = useState<TrainingApplicationApprovalPreviewStage[]>([])
  const [approverPreviewLoading, setApproverPreviewLoading] = useState(false)

  const totalAmount = Number(costPerPerson || 0) * Number(costCount || 0) + Number(costOther || 0)
  const normalizedSelectedCampus = toCampusSubmitValue(selectedCampus)
  const autoChairmanApproval = normalizedSelectedCampus.includes('最高议事厅') && totalAmount > AUTO_CHAIRMAN_THRESHOLD

  useEffect(() => {
    if (!open) {
      form.resetFields()
      return
    }

    if (editingRecord) {
      const parsedCampuses = splitCampusValue(editingRecord.campus)
      form.setFieldsValue({
        campus: allowMultiCampus ? parsedCampuses : parsedCampuses[0] || editingRecord.campus,
        department: editingRecord.department,
        category: editingRecord.category,
        objective: editingRecord.objective,
        trainees: editingRecord.trainees,
        content: editingRecord.content,
        startDate: editingRecord.startDate ? dayjs(editingRecord.startDate) : undefined,
        endDate: editingRecord.endDate ? dayjs(editingRecord.endDate) : undefined,
        totalHours: editingRecord.totalHours,
        format: editingRecord.format,
        examMethod: editingRecord.examMethod,
        trainer: editingRecord.trainer,
        expectedPassRate: editingRecord.expectedPassRate,
        costPerPerson: editingRecord.costPerPerson,
        costCount: editingRecord.costCount,
        costOther: editingRecord.costOther,
        isInternalTraining: editingRecord.isInternalTraining,
        isKeyStaffTraining: editingRecord.isKeyStaffTraining,
        includeChairmanApproval: editingRecord.includeChairmanApproval,
        remark: editingRecord.remark,
        selectedApproverUserIds: editingRecord.selectedApproverUserIds || {},
      })
      return
    }

    form.setFieldsValue({
      campus: allowMultiCampus ? (campus ? [campus] : undefined) : campus || undefined,
      department: department || undefined,
      startDate: dayjs(),
      endDate: dayjs(),
      totalHours: 0,
      expectedPassRate: 80,
      costPerPerson: 0,
      costCount: 0,
      costOther: 0,
      isInternalTraining: true,
      isKeyStaffTraining: false,
      includeChairmanApproval: false,
      selectedApproverUserIds: {},
    })
  }, [allowMultiCampus, campus, department, editingRecord, form, open])

  useEffect(() => {
    if (!open) {
      return
    }
    if (autoChairmanApproval) {
      form.setFieldValue('includeChairmanApproval', true)
    }
  }, [autoChairmanApproval, form, open])

  useEffect(() => {
    if (!open) {
      setApproverPreview([])
      setApproverPreviewLoading(false)
      return
    }

    const normalizedCampus = toCampusSubmitValue(selectedCampus)
    const normalizedDepartment = typeof selectedDepartment === 'string' ? selectedDepartment.trim() : ''

    if (!normalizedCampus || !normalizedDepartment || !selectedCategory) {
      setApproverPreview([])
      form.setFieldValue(
        'selectedApproverUserIds',
        normalizeSelectedApproverMap(form.getFieldValue('selectedApproverUserIds')),
      )
      return
    }

    let active = true
    setApproverPreviewLoading(true)
    previewTrainingApplicationApprovers({
      campus: normalizedCampus,
      department: normalizedDepartment,
      category: selectedCategory,
      isInternalTraining: !!isInternalTraining,
      isKeyStaffTraining: !!isKeyStaffTraining,
      includeChairmanApproval: !!includeChairmanApproval,
      totalAmount,
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
        console.error('加载培训申请审批人失败', error)
        message.error(getErrorMessage(error, '加载培训申请审批人失败'))
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
    editingRecord?.selectedApproverUserIds,
    form,
    isInternalTraining,
    isKeyStaffTraining,
    includeChairmanApproval,
    open,
    selectedCampus,
    selectedCategory,
    selectedDepartment,
    totalAmount,
  ])

  const handleOk = async () => {
    const values = await form.validateFields()
    await onOk({
      campus: toCampusSubmitValue(values.campus),
      department: values.department,
      category: values.category,
      objective: values.objective,
      trainees: values.trainees,
      content: values.content,
      startDate: values.startDate.format('YYYY-MM-DD'),
      endDate: values.endDate.format('YYYY-MM-DD'),
      totalHours: Number(values.totalHours || 0),
      format: values.format,
      examMethod: values.examMethod,
      trainer: values.trainer || undefined,
      expectedPassRate: values.expectedPassRate ?? undefined,
      costPerPerson: Number(values.costPerPerson || 0),
      costCount: Number(values.costCount || 0),
      costTotal: Number(values.costPerPerson || 0) * Number(values.costCount || 0),
      costOther: Number(values.costOther || 0),
      isInternalTraining: !!values.isInternalTraining,
      isKeyStaffTraining: !!values.isKeyStaffTraining,
      includeChairmanApproval: !!values.includeChairmanApproval,
      remark: values.remark || undefined,
      selectedApproverUserIds: values.selectedApproverUserIds || {},
    })
  }

  return (
    <Modal
      title={editingRecord ? '编辑培训申请表' : '新增培训申请表'}
      open={open}
      onCancel={onCancel}
      onOk={() => void handleOk()}
      confirmLoading={loading}
      okText="保存"
      cancelText="取消"
      width={980}
      destroyOnClose
      styles={{ body: { maxHeight: '74vh', overflowY: 'auto' } }}
    >
      <Form form={form} layout="vertical">
        <Card size="small" title="基本信息" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="campus" label="神殿" rules={[{ required: true, message: '请选择神殿' }]}>
                <Select
                  mode={allowMultiCampus ? 'multiple' : undefined}
                  showSearch
                  allowClear
                  optionFilterProp="label"
                  placeholder={allowMultiCampus ? '请选择一个或多个神殿' : '请选择神殿'}
                  options={campusOptions}
                  maxTagCount="responsive"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="department" label="申请部门" rules={[{ required: true, message: '请选择申请部门' }]}>
                <Select
                  showSearch
                  allowClear
                  optionFilterProp="label"
                  placeholder="请选择申请部门"
                  options={departmentOptions}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="category" label="培训类别" rules={[{ required: true, message: '请选择培训类别' }]}>
                <Select options={CATEGORY_OPTIONS.map((item) => ({ label: item, value: item }))} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="trainer" label="培训讲师">
                <Input placeholder="请填写培训讲师" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="isInternalTraining" valuePropName="checked" label=" ">
                <Checkbox>神殿内部培训</Checkbox>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="isKeyStaffTraining" valuePropName="checked" label=" ">
                <Checkbox>干部及骨干员工培训</Checkbox>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="includeChairmanApproval" valuePropName="checked" label=" ">
                <Checkbox disabled={autoChairmanApproval}>启用董事长审批</Checkbox>
              </Form.Item>
            </Col>
          </Row>
          {autoChairmanApproval ? (
            <Text type="warning">当前神殿为最高议事厅且总费用超过 {AUTO_CHAIRMAN_THRESHOLD} 元，系统将自动追加董事长审批。</Text>
          ) : null}

          <Form.Item name="objective" label="培训目标" rules={[{ required: true, message: '请填写培训目标' }]}>
            <TextArea rows={2} placeholder="请填写培训目标" />
          </Form.Item>
          <Form.Item name="trainees" label="参训人员" rules={[{ required: true, message: '请填写参训人员' }]}>
            <TextArea rows={2} placeholder="请填写参训人员" />
          </Form.Item>
          <Form.Item name="content" label="培训内容" rules={[{ required: true, message: '请填写培训内容' }]}>
            <TextArea rows={3} placeholder="请填写培训内容" />
          </Form.Item>
        </Card>

        <Card size="small" title="培训安排" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="startDate" label="开始日期" rules={[{ required: true, message: '请选择开始日期' }]}>
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="endDate" label="结束日期" rules={[{ required: true, message: '请选择结束日期' }]}>
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="totalHours" label="共计小时" rules={[{ required: true, message: '请填写课时' }]}>
                <InputNumber min={0} step={0.5} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="expectedPassRate" label="拟定通过率(%)">
                <InputNumber min={0} max={100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="format" label="培训形式" rules={[{ required: true, message: '请选择培训形式' }]}>
                <Select options={FORMAT_OPTIONS.map((item) => ({ label: item, value: item }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="examMethod" label="考试方式" rules={[{ required: true, message: '请选择考试方式' }]}>
                <Select options={EXAM_OPTIONS.map((item) => ({ label: item, value: item }))} />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Card size="small" title="费用信息" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="costPerPerson" label="培训费(每人/元)">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="costCount" label="人数">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="培训费总计">
                <InputNumber
                  disabled
                  value={Number(costPerPerson || 0) * Number(costCount || 0)}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="costOther" label="其他费用(元)">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Text type="secondary">当前总费用：{totalAmount.toFixed(2)} 元</Text>
        </Card>

        <ApproverSelectionSection
          previewStages={approverPreview}
          loading={approverPreviewLoading}
          title="审批链设置"
          description={`最高议事厅总费用超过 ${AUTO_CHAIRMAN_THRESHOLD} 元时系统会自动追加董事长审批；其余情况可按需启用。`}
          emptyText="请先填写神殿、申请部门、培训类别和费用信息，系统会预填审批链。"
        />

        <Divider />
        <Form.Item name="remark" label="备注">
          <TextArea rows={2} placeholder="可选备注" />
        </Form.Item>
      </Form>
    </Modal>
  )
}

const PreviewModal: React.FC<{
  open: boolean
  record: TrainingApplicationRecord | null
  onCancel: () => void
}> = ({ open, record, onCancel }) => {
  if (!record) return null

  const handlePrint = () => window.print()
  const totalAmount = getTotalAmount(record)
  const flowMap = record.approvalFlow.reduce<Record<string, TrainingApplicationApprovalFlowStep>>(
    (result, item) => {
      result[item.stage] = item
      return result
    },
    {},
  )
  const opinionRows = [
    [flowMap.department_head, flowMap.principal].filter(
      (item): item is TrainingApplicationApprovalFlowStep => Boolean(item),
    ),
    [flowMap.group_department, flowMap.hr].filter(
      (item): item is TrainingApplicationApprovalFlowStep => Boolean(item),
    ),
  ].filter((row) => row.length > 0)
  const chairmanStep = flowMap.chairman

  const renderApprovalCell = (step?: TrainingApplicationApprovalFlowStep) => {
    if (!step) return <Text type="secondary">-</Text>
    const color =
      step.status === 'completed' ? 'green' : step.status === 'rejected' ? 'red' : 'gold'
    const fallbackText =
      step.status === 'completed'
        ? '审批通过'
        : step.status === 'rejected'
          ? '审批驳回'
          : step.status === 'current'
            ? '待当前审批'
            : '待流转'
    return (
      <div>
        <Tag color={color}>{step.statusLabel}</Tag>
        <div style={{ marginTop: 4 }}>{step.comment || fallbackText}</div>
        <div style={{ marginTop: 4, color: '#8c8c8c', fontSize: 12 }}>
          {step.actedByName || step.approvers.map((item) => item.name).join('、') || '-'}
        </div>
      </div>
    )
  }

  const cellStyle: React.CSSProperties = {
    padding: '8px 10px',
    border: '1px solid #d9d9d9',
    fontSize: 13,
    verticalAlign: 'top',
  }
  const labelStyle: React.CSSProperties = {
    ...cellStyle,
    fontWeight: 'bold',
    background: '#fafafa',
    width: 120,
    textAlign: 'center',
  }

  return (
    <Modal
      title="打印预览 - 培训申请表"
      open={open}
      onCancel={onCancel}
      width={940}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          关闭
        </Button>,
        <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>
          打印
        </Button>,
      ]}
    >
      <div className="print-area" style={{ padding: '0 8px' }}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <Title level={3} style={{ margin: 0 }}>
            培训需求申请表
          </Title>
          <Text type="secondary">单号：{record.applicationNo}</Text>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={labelStyle}>神殿</td>
              <td style={cellStyle}>{record.campus}</td>
              <td style={labelStyle}>申请部门</td>
              <td style={cellStyle}>{record.department}</td>
              <td style={labelStyle}>培训类别</td>
              <td style={cellStyle}>{record.category}</td>
            </tr>
            <tr>
              <td style={labelStyle}>培训目标</td>
              <td style={cellStyle} colSpan={5}>{record.objective}</td>
            </tr>
            <tr>
              <td style={labelStyle}>参训人员</td>
              <td style={cellStyle} colSpan={5}>{record.trainees}</td>
            </tr>
            <tr>
              <td style={labelStyle}>培训内容</td>
              <td style={cellStyle} colSpan={5}>{record.content}</td>
            </tr>
            <tr>
              <td style={labelStyle}>培训时间</td>
              <td style={cellStyle} colSpan={3}>
                {record.startDate} 至 {record.endDate}，共 {record.totalHours} 小时
              </td>
              <td style={labelStyle}>培训讲师</td>
              <td style={cellStyle}>{record.trainer || '-'}</td>
            </tr>
            <tr>
              <td style={labelStyle}>培训形式</td>
              <td style={cellStyle}>{record.format}</td>
              <td style={labelStyle}>考试方式</td>
              <td style={cellStyle}>{record.examMethod}</td>
              <td style={labelStyle}>拟定通过率</td>
              <td style={cellStyle}>{record.expectedPassRate ?? '-'}%</td>
            </tr>
            <tr>
              <td style={labelStyle}>费用</td>
              <td style={cellStyle} colSpan={5}>
                培训费：每人 {record.costPerPerson} 元，共 {record.costCount} 人，总计 {record.costTotal} 元；
                其他费用 {record.costOther} 元；总费用 {totalAmount} 元。
              </td>
            </tr>
            <tr>
              <td style={labelStyle}>规则标记</td>
              <td style={cellStyle} colSpan={5}>
                <Space>
                  <Tag color={record.isInternalTraining ? 'green' : 'default'}>
                    {record.isInternalTraining ? '神殿内部培训' : '非神殿内部培训'}
                  </Tag>
                  <Tag color={record.isKeyStaffTraining ? 'volcano' : 'default'}>
                    {record.isKeyStaffTraining ? '干部及骨干员工培训' : '普通培训'}
                  </Tag>
                  <Tag color={record.includeChairmanApproval ? 'gold' : 'default'}>
                    {record.includeChairmanApproval
                      ? '启用董事长审批'
                      : record.campus.includes('最高议事厅') && record.costTotal + record.costOther > AUTO_CHAIRMAN_THRESHOLD
                        ? `应自动触发董事长审批（超过 ${AUTO_CHAIRMAN_THRESHOLD} 元）`
                        : '未启用董事长审批'}
                  </Tag>
                </Space>
              </td>
            </tr>
            {opinionRows.map((row, rowIndex) => (
              <tr key={`opinion-row-${rowIndex}`}>
                {row.map((item) => (
                  <React.Fragment key={item.stage}>
                    <td style={labelStyle}>{item.stageLabel}</td>
                    <td style={cellStyle} colSpan={2}>{renderApprovalCell(item)}</td>
                  </React.Fragment>
                ))}
                {row.length === 1 ? (
                  <>
                    <td style={labelStyle}></td>
                    <td style={cellStyle} colSpan={2}></td>
                  </>
                ) : null}
              </tr>
            ))}
            {chairmanStep ? (
              <tr>
                <td style={labelStyle}>董事长意见</td>
                <td style={cellStyle} colSpan={5}>{renderApprovalCell(chairmanStep)}</td>
              </tr>
            ) : null}
            <tr>
              <td style={labelStyle}>备注</td>
              <td style={cellStyle} colSpan={5}>
                1. 最高议事厅申请单总费用超过 {AUTO_CHAIRMAN_THRESHOLD} 元时，系统会自动追加董事长审批；
                <br />
                2. 其他场景下可按需启用董事长审批，未启用时流程默认截止到人事部意见；
                {record.remark ? (
                  <>
                    <br />
                    {record.remark}
                  </>
                ) : null}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Modal>
  )
}

const TrainingApplication: React.FC<TrainingApplicationProps> = ({ onFollowupRecordsGenerated }) => {
  const { currentCampus: selectedCampus, getAllCampuses, getFilteredCampuses } = useCampusStore()
  const { user, permissions, accessibleCampuses, campusRestricted } = useAuthStore()
  const [data, setData] = useState<TrainingApplicationRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<TrainingApplicationRecord | null>(null)
  const [previewRecord, setPreviewRecord] = useState<TrainingApplicationRecord | null>(null)
  const [searchText, setSearchText] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [departmentOptions, setDepartmentOptions] = useState<Array<{ label: string; value: string }>>([])
  const [actionModal, setActionModal] = useState<{
    open: boolean
    type: 'approve' | 'reject'
    record: TrainingApplicationRecord | null
  }>({ open: false, type: 'approve', record: null })
  const [actionComment, setActionComment] = useState('')
  const allowMultiCampus = isHrAdministrativeUser(user?.department, user?.position)
  const canAccess = canAccessTrainingApplication({
    campus: user?.campus,
    department: user?.department,
    position: user?.position,
    role: user?.role,
    isSuperuser: user?.is_superuser,
    permissions,
  })

  if (!canAccess) {
    return (
      <div style={{ padding: 24 }}>
        <Result
          status="403"
          title="403"
          subTitle="当前账号没有访问培训申请表的权限，请联系管理员确认部门和职位配置。"
          extra={
            <Button type="primary" onClick={() => window.history.back()}>
              返回
            </Button>
          }
        />
      </div>
    )
  }

  const campusOptions = useMemo(() => {
    const visibleCampuses = allowMultiCampus || !campusRestricted || accessibleCampuses.length === 0
      ? getAllCampuses()
      : getFilteredCampuses(accessibleCampuses)

    return visibleCampuses.map((campus) => ({
      label: campus.name,
      value: campus.name,
    }))
  }, [accessibleCampuses, allowMultiCampus, campusRestricted, getAllCampuses, getFilteredCampuses])

  const loadData = async (params?: { page?: number; pageSize?: number; search?: string }) => {
    setLoading(true)
    try {
      const result = await listTrainingApplicationsPaged({
        search: params?.search ?? (searchText.trim() || undefined),
        page: params?.page ?? currentPage,
        pageSize: params?.pageSize ?? pageSize,
      })
      setData(result.items)
      setTotal(result.total)
    } catch (error) {
      message.error(getErrorMessage(error, '加载培训申请表失败'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [currentPage, pageSize, searchText])

  useEffect(() => {
    let active = true

    fetchEmployeeDepartments()
      .then((departments) => {
        if (!active) return
        const options = Array.from(new Set((departments || []).map((item) => item.trim()).filter(Boolean)))
          .sort((a, b) => a.localeCompare(b, 'zh-CN'))
          .map((item) => ({ label: item, value: item }))
        setDepartmentOptions(options)
      })
      .catch((error) => {
        if (!active) return
        console.error('加载部门选项失败', error)
        message.error(getErrorMessage(error, '加载部门选项失败'))
      })

    return () => {
      active = false
    }
  }, [])

  const handleSave = async (payload: TrainingApplicationPayload) => {
    setSubmitting(true)
    try {
      if (editingRecord) {
        await updateTrainingApplication(editingRecord.id, payload)
      } else {
        await createTrainingApplication(payload)
      }
      setEditModalOpen(false)
      setEditingRecord(null)
      if (!editingRecord && currentPage !== 1) {
        setCurrentPage(1)
      } else {
        await loadData()
      }
      message.success(editingRecord ? '编辑成功' : '新增成功')
    } catch (error) {
      message.error(getErrorMessage(error, editingRecord ? '编辑失败' : '新增失败'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (record: TrainingApplicationRecord) => {
    try {
      await deleteTrainingApplication(record.id)
      setPreviewRecord((prev) => (prev?.id === record.id ? null : prev))
      await loadData()
      message.success('删除成功')
    } catch (error) {
      message.error(getErrorMessage(error, '删除失败'))
    }
  }

  const handleSubmit = async (record: TrainingApplicationRecord) => {
    try {
      await submitTrainingApplication(record.id)
      await loadData()
      message.success('提交成功')
    } catch (error) {
      message.error(getErrorMessage(error, '提交失败'))
    }
  }

  const handleApprovalAction = async () => {
    if (!actionModal.record) return
    if (actionModal.type === 'reject' && !actionComment.trim()) {
      message.warning('驳回时请填写审批意见')
      return
    }

    try {
      setSubmitting(true)
      if (actionModal.type === 'approve') {
        await approveTrainingApplication(actionModal.record.id, actionComment.trim() || undefined)
        onFollowupRecordsGenerated?.()
      } else {
        await rejectTrainingApplication(actionModal.record.id, actionComment.trim())
      }
      setActionModal({ open: false, type: 'approve', record: null })
      setActionComment('')
      await loadData()
      message.success(actionModal.type === 'approve' ? '审批通过' : '审批驳回成功')
    } catch (error) {
      if (isApprovalStateChangedError(error)) {
        await loadData()
      }
      message.error(getErrorMessage(error, '审批操作失败'))
    } finally {
      setSubmitting(false)
    }
  }

  const columns: ColumnsType<TrainingApplicationRecord> = [
    {
      title: '神殿',
      dataIndex: 'campus',
      width: 100,
    },
    {
      title: '申请部门',
      dataIndex: 'department',
      width: 120,
    },
    {
      title: '培训类别',
      dataIndex: 'category',
      width: 100,
      render: (value: TrainingCategory) => {
        const colorMap: Record<TrainingCategory, string> = {
          思想: 'purple',
          业务: 'blue',
          管理: 'orange',
        }
        return <Tag color={colorMap[value]}>{value}</Tag>
      },
    },
    {
      title: '培训时间',
      width: 220,
      render: (_, record) => (
        <span>
          {record.startDate} ~ {record.endDate}
          <br />
          <Text type="secondary">共 {record.totalHours} 小时</Text>
        </span>
      ),
    },
    {
      title: '形式/考试',
      width: 150,
      render: (_, record) => (
        <Space size={4} wrap>
          <Tag color={record.format === '线上' ? 'cyan' : 'green'}>{record.format}</Tag>
          <Tag>{record.examMethod}</Tag>
        </Space>
      ),
    },
    {
      title: '总费用',
      width: 110,
      align: 'right',
      render: (_, record) => `¥${getTotalAmount(record).toLocaleString()}`,
      sorter: (a, b) => getTotalAmount(a) - getTotalAmount(b),
    },
    {
      title: '状态',
      width: 120,
      align: 'center',
      render: (_, record) => <Tag color={STATUS_COLOR_MAP[record.status]}>{record.statusLabel}</Tag>,
    },
    {
      title: '当前环节',
      dataIndex: 'currentStageLabel',
      width: 140,
      render: (value: string | null | undefined) => value || '-',
    },
    {
      title: '操作',
      width: 290,
      fixed: 'right',
      render: (_, record) => (
        <Space size={4} wrap>
          <Tooltip title="预览">
            <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => setPreviewRecord(record)} />
          </Tooltip>
          {record.canEdit ? (
            <Tooltip title="编辑">
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => {
                  setEditingRecord(record)
                  setEditModalOpen(true)
                }}
              />
            </Tooltip>
          ) : null}
          {record.canDelete ? (
            <Popconfirm title="确认删除该申请？" onConfirm={() => void handleDelete(record)}>
              <Tooltip title="删除">
                <Button type="link" size="small" danger icon={<DeleteOutlined />} />
              </Tooltip>
            </Popconfirm>
          ) : null}
          {record.canSubmit ? (
            <Tooltip title="提交审批">
              <Button type="link" size="small" icon={<SendOutlined />} onClick={() => void handleSubmit(record)} />
            </Tooltip>
          ) : null}
          {record.canApprove ? (
            <>
              <Tooltip title="审批通过">
                <Button
                  type="link"
                  size="small"
                  icon={<CheckOutlined />}
                  onClick={() => {
                    setActionModal({ open: true, type: 'approve', record })
                    setActionComment('通过')
                  }}
                />
              </Tooltip>
              <Tooltip title="审批驳回">
                <Button
                  type="link"
                  size="small"
                  danger
                  icon={<CloseOutlined />}
                  onClick={() => {
                    setActionModal({ open: true, type: 'reject', record })
                    setActionComment('')
                  }}
                />
              </Tooltip>
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
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingRecord(null)
                  setEditModalOpen(true)
                }}
              >
                新增培训申请
              </Button>
              <Button icon={<ReloadOutlined />} onClick={() => void loadData()}>
                刷新
              </Button>
            </Space>
          </Col>
          <Col flex="320px">
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder="搜索神殿/部门/讲师/人员/内容..."
              value={searchText}
              onChange={(event) => {
                setCurrentPage(1)
                setSearchText(event.target.value)
              }}
            />
          </Col>
        </Row>
      </Card>

      <Card>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={data}
          loading={loading}
          bordered
          pagination={{
            current: currentPage,
            pageSize,
            total,
            showSizeChanger: true,
            onChange: (page, size) => {
              setCurrentPage(page)
              setPageSize(size)
            },
          }}
          scroll={{ x: 1500 }}
        />
      </Card>

      <EditModal
        open={editModalOpen}
        loading={submitting}
        campus={selectedCampus || user?.campus || undefined}
        department={user?.department || undefined}
        campusOptions={campusOptions}
        departmentOptions={departmentOptions}
        allowMultiCampus={allowMultiCampus}
        editingRecord={editingRecord}
        onCancel={() => {
          setEditModalOpen(false)
          setEditingRecord(null)
        }}
        onOk={handleSave}
      />

      <PreviewModal open={!!previewRecord} record={previewRecord} onCancel={() => setPreviewRecord(null)} />

      <Modal
        title={actionModal.type === 'approve' ? '审批通过' : '审批驳回'}
        open={actionModal.open}
        confirmLoading={submitting}
        onCancel={() => setActionModal({ open: false, type: 'approve', record: null })}
        onOk={() => void handleApprovalAction()}
        okText={actionModal.type === 'approve' ? '通过' : '驳回'}
        cancelText="取消"
      >
        <TextArea
          rows={4}
          value={actionComment}
          onChange={(event) => setActionComment(event.target.value)}
          placeholder={actionModal.type === 'approve' ? '可填写审批意见' : '请填写驳回原因'}
        />
      </Modal>
    </div>
  )
}

export default TrainingApplication