import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
  approvePromotionApplication,
  type PromotionApprovalActionPayload,
  createPromotionApplication,
  deletePromotionApplication,
  getPromotionApplication,
  listPromotionApplications,
  previewPromotionApproverCandidates,
  rejectPromotionApplication,
  submitPromotionApplication,
  type PromotionApprovalPreviewStage,
  type PromotionApplicationPayload,
  type PromotionApplicationRecord,
  type PromotionApprovalFlowStep,
  type PromotionStatus,
  updatePromotionApplication,
} from '@/services/humanresources/promotionApplication'
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

type PromotionSalaryLike = Pick<
  PromotionApplicationRecord,
  | 'originalLevel'
  | 'originalSalary'
  | 'promotedLevel'
  | 'promotedBaseSalary'
  | 'promotedPerformanceSalary'
  | 'promotedSalary'
>

const getErrorMessage = (error: unknown, fallback: string) => {
  const maybeError = error as ErrorWithResponse
  return maybeError.response?.data?.detail || maybeError.message || fallback
}

const getEffectiveTextLength = (value: unknown) => String(value ?? '').replace(/\s+/g, '').length

const createMinTextLengthRule = (label: string, minLength: number) => ({
  validator: async (_rule: unknown, value: unknown) => {
    const text = String(value ?? '').trim()
    if (!text) {
      throw new Error(`请填写${label}`)
    }
    if (getEffectiveTextLength(text) < minLength) {
      throw new Error(`${label}不少于${minLength}字`)
    }
  },
})

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

const resolveCampusBucket = (campus?: string | null) => {
  const normalized = normalizeText(campus)
  if (!normalized) return undefined
  if (isManagementCenterCampus(campus)) return 'management_center'
  if (normalized.includes('盛邦')) return 'shengbang'
  if (normalized.includes('冀美')) return 'jimei'
  if (normalized.includes('石美')) return 'shimei'
  if (normalized.includes('晋美')) return 'jinmei'
  if (normalized.includes('原美')) return 'yuanmei'
  if (normalized.includes('太美')) return 'taimei'
  if (normalized.includes('桂美')) return 'guimei'
  return normalized
}

const computePromotedSalaryTotal = (
  baseSalary?: number | null,
  performanceSalary?: number | null,
  totalSalary?: number | null,
) => {
  if (baseSalary == null && performanceSalary == null) return totalSalary ?? null
  return (baseSalary ?? 0) + (performanceSalary ?? 0)
}

const formatPromotionSalarySummary = (record: PromotionSalaryLike) => {
  const promotedSalaryTotal = computePromotedSalaryTotal(
    record.promotedBaseSalary,
    record.promotedPerformanceSalary,
    record.promotedSalary,
  )
  const splitNote =
    record.promotedBaseSalary != null || record.promotedPerformanceSalary != null
      ? `（基础薪资：${record.promotedBaseSalary ?? '-'} / 绩效薪资：${record.promotedPerformanceSalary ?? '-'}）`
      : ''
  return `原职级：${record.originalLevel || '-'} / 原薪资标准：${record.originalSalary ?? '-'} / 晋升职级：${record.promotedLevel || '-'} / 晋升后薪资标准：${promotedSalaryTotal ?? '-'}${splitNote}`
}

const formatPrintValue = (value?: string | number | null) => {
  if (value == null || value === '') return ' '
  return String(value)
}

const formatPrintDate = (value?: string | null) => {
  if (!value) return '年  月  日'
  const parsed = dayjs(value)
  if (!parsed.isValid()) return value
  return `${parsed.format('YYYY')} 年 ${parsed.format('MM')} 月 ${parsed.format('DD')} 日`
}

const formatRecordDate = (value?: string | null) => {
  if (!value) return ' '
  const parsed = dayjs(value)
  if (!parsed.isValid()) return value
  return parsed.format('YYYY-MM-DD')
}

type PromotionApprovalSectionConfig = {
  stage: string
  title: string
  signerLabel: string
  resultLabel: string
  opinionLabel: string
  getOpinion: (record: PromotionApplicationRecord) => string | null | undefined
  getPassed: (record: PromotionApplicationRecord) => boolean | null | undefined
}

const PROMOTION_APPROVAL_SECTIONS: PromotionApprovalSectionConfig[] = [
  {
    stage: 'department_manager',
    title: '部门经理评语与意见',
    signerLabel: '部门经理',
    resultLabel: '部门经理结果',
    opinionLabel: '部门经理意见',
    getOpinion: (record) => record.departmentManagerOpinion,
    getPassed: (record) => record.departmentManagerPassed,
  },
  {
    stage: 'principal',
    title: '校长评语与意见',
    signerLabel: '校长',
    resultLabel: '校长结果',
    opinionLabel: '校长意见',
    getOpinion: (record) => record.principalOpinion,
    getPassed: (record) => record.principalPassed,
  },
  {
    stage: 'biz_director',
    title: '业务条线总监评语与意见',
    signerLabel: '业务条线总监',
    resultLabel: '业务条线总监结果',
    opinionLabel: '业务条线总监意见',
    getOpinion: (record) => record.bizDirectorOpinion,
    getPassed: (record) => record.bizDirectorPassed,
  },
  {
    stage: 'hr_director',
    title: '人资总监评语与意见',
    signerLabel: '人资总监',
    resultLabel: '人资总监结果',
    opinionLabel: '人资总监意见',
    getOpinion: (record) => record.hrDirectorOpinion,
    getPassed: (record) => record.hrDirectorPassed,
  },
  {
    stage: 'chairman',
    title: '董事长评语与意见',
    signerLabel: '董事长',
    resultLabel: '董事长结果',
    opinionLabel: '董事长意见',
    getOpinion: (record) => record.chairmanOpinion,
    getPassed: (record) => record.chairmanPassed,
  },
]

const PROMOTION_APPLICATION_PRINT_STYLE = `
  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    background: #fff;
    color: #111;
    font-family: SimSun, "Songti SC", serif;
  }

  .promotion-print {
    background: #fff;
    color: #111;
    padding: 16px;
  }

  .promotion-print-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    border: 1.5px solid #111;
  }

  .promotion-print-table td {
    border: 1px solid #111;
    padding: 6px 8px;
    font-size: 14px;
    line-height: 1.6;
    vertical-align: middle;
    word-break: break-word;
  }

  .promotion-brand-cell {
    padding: 8px 10px 6px;
    vertical-align: middle;
  }

  .promotion-brand-cn {
    color: #1f9fd7;
    font-size: 28px;
    line-height: 1;
    font-weight: 700;
    letter-spacing: 1px;
  }

  .promotion-brand-en {
    margin-top: 2px;
    padding-left: 54px;
    font-size: 11px;
    line-height: 1;
    font-weight: 700;
    letter-spacing: 0.5px;
  }

  .promotion-title-cell {
    text-align: center;
    font-size: 18px !important;
    font-weight: 700;
    letter-spacing: 1px;
  }

  .promotion-label {
    text-align: center;
    font-weight: 700;
    white-space: nowrap;
  }

  .promotion-section-title {
    padding: 4px 8px !important;
    text-align: center;
    font-size: 15px !important;
    font-weight: 700;
    letter-spacing: 1px;
  }

  .promotion-subtitle {
    padding: 4px 8px !important;
    font-weight: 700;
  }

  .promotion-allow-top {
    vertical-align: top !important;
  }

  .promotion-salary-tag {
    text-align: center;
    font-weight: 700;
  }

  .promotion-write-area,
  .promotion-approval-area {
    min-height: 106px;
    white-space: pre-wrap;
    line-height: 28px;
    background-image: linear-gradient(to bottom, transparent 27px, #d7d7d7 28px);
    background-size: 100% 28px;
    background-position-y: 2px;
  }

  .promotion-write-area.tall,
  .promotion-approval-area {
    min-height: 142px;
  }

  .promotion-signature-row {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 8px;
    margin-top: 10px;
    font-size: 14px;
  }

  .promotion-signature-line {
    display: inline-flex;
    align-items: flex-end;
    min-width: 150px;
    min-height: 18px;
    padding: 0 4px 2px;
    border-bottom: 1px solid #4d79ff;
  }

  .promotion-date-row {
    margin-top: 6px;
  }

  .promotion-remark {
    vertical-align: top !important;
    font-size: 13px !important;
    line-height: 1.85 !important;
  }

  .promotion-salary-note {
    margin-top: 4px;
    font-size: 12px;
    line-height: 1.5;
    color: #555;
  }

  @media print {
    .promotion-print {
      padding: 0;
    }
  }
`

const isManagementCenterCampus = (campus?: string | null) =>
  !!campus && MANAGEMENT_CENTER_CAMPUS_VALUES.includes(campus.trim())

const campusMatchesScope = (userCampus?: string | null, selectedCampus?: string | null) => {
  if (!selectedCampus) return true
  if (!userCampus) return true
  if (isManagementCenterCampus(selectedCampus)) return isManagementCenterCampus(userCampus)
  const selectedBucket = resolveCampusBucket(selectedCampus)
  const userBucket = resolveCampusBucket(userCampus)
  if (selectedBucket && userBucket) return selectedBucket === userBucket
  return userCampus === selectedCampus
}

type EditModalProps = {
  open: boolean
  loading: boolean
  campus?: string | null
  currentUserName?: string | null
  currentUserDepartment?: string | null
  currentUserPosition?: string | null
  editingRecord: PromotionApplicationRecord | null
  users: UserPermissionInfo[]
  onCancel: () => void
  onOk: (payload: PromotionApplicationPayload) => Promise<void>
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
  const promotedBaseSalary = Form.useWatch('promotedBaseSalary', form)
  const promotedPerformanceSalary = Form.useWatch('promotedPerformanceSalary', form)
  const [approverPreview, setApproverPreview] = useState<PromotionApprovalPreviewStage[]>([])
  const [approverPreviewLoading, setApproverPreviewLoading] = useState(false)
  const promotedSalaryTotal = useMemo(
    () => computePromotedSalaryTotal(promotedBaseSalary, promotedPerformanceSalary),
    [promotedBaseSalary, promotedPerformanceSalary],
  )

  const campusUsers = useMemo(
    () => users.filter((item) => campusMatchesScope(item.campus, campus)),
    [campus, users],
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
        campus: campus || editingRecord.campus,
        name: currentUserName || editingRecord.name,
        nativePlace: editingRecord.nativePlace || undefined,
        age: editingRecord.age ?? undefined,
        entryDate: dayjs(editingRecord.entryDate),
        department: currentUserDepartment || editingRecord.department,
        position: currentUserPosition || editingRecord.position,
        workOverview: editingRecord.workOverview,
        promotionReason: editingRecord.promotionReason,
        confidenceAndExpectation: editingRecord.confidenceAndExpectation,
        originalLevel: editingRecord.originalLevel || undefined,
        originalSalary: editingRecord.originalSalary ?? undefined,
        promotedLevel: editingRecord.promotedLevel || undefined,
        promotedBaseSalary:
          editingRecord.promotedBaseSalary ?? editingRecord.promotedSalary ?? undefined,
        promotedPerformanceSalary: editingRecord.promotedPerformanceSalary ?? undefined,
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
    previewPromotionApproverCandidates({
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
        console.error('加载晋升审批人预填写失败', error)
        message.error(getErrorMessage(error, '加载晋升审批人预填写失败'))
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
    const promotedSalary = computePromotedSalaryTotal(
      values.promotedBaseSalary ?? undefined,
      values.promotedPerformanceSalary ?? undefined,
    )
    await onOk({
      fillDate: (values.fillDate as Dayjs).format('YYYY-MM-DD'),
      campus: values.campus,
      name: values.name,
      nativePlace: values.nativePlace || undefined,
      age: values.age ?? undefined,
      entryDate: (values.entryDate as Dayjs).format('YYYY-MM-DD'),
      department: values.department,
      position: values.position,
      workOverview: values.workOverview,
      promotionReason: values.promotionReason,
      confidenceAndExpectation: values.confidenceAndExpectation,
      originalLevel: values.originalLevel || undefined,
      originalSalary: values.originalSalary ?? undefined,
      promotedLevel: values.promotedLevel || undefined,
      promotedBaseSalary: values.promotedBaseSalary ?? undefined,
      promotedPerformanceSalary: values.promotedPerformanceSalary ?? undefined,
      promotedSalary: promotedSalary ?? undefined,
      selectedApproverUserIds: normalizeSelectedApproverMap(values.selectedApproverUserIds),
    })
  }

  return (
    <Modal
      title={editingRecord ? '编辑晋升申请' : '新建晋升申请'}
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
          <Col span={6}>
            <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
              <Input disabled placeholder="当前登录员工姓名" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="nativePlace" label="籍贯" extra="精确到市即可。">
              <Input placeholder="请输入到市，例如：石家庄市" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="age" label="年龄">
              <InputNumber min={0} max={100} style={{ width: '100%' }} placeholder="请输入年龄" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              name="entryDate"
              label="入职时间"
              rules={[{ required: true, message: '请选择入职时间' }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={6}>
            <Form.Item
              name="department"
              label="部门"
              rules={[{ required: true, message: '请输入所在部门' }]}
            >
              <AutoComplete
                disabled
                options={departmentOptions.map((value) => ({ value }))}
                placeholder="当前登录员工所在部门"
                filterOption={(inputValue, option) =>
                  String(option?.value || '')
                    .toLowerCase()
                    .includes(inputValue.toLowerCase())
                }
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              name="position"
              label="岗位"
              rules={[{ required: true, message: '请输入当前岗位' }]}
            >
              <AutoComplete
                disabled
                options={positionOptions}
                placeholder="当前登录员工岗位"
                filterOption={(inputValue, option) =>
                  String(option?.value || '')
                    .toLowerCase()
                    .includes(inputValue.toLowerCase())
                }
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              name="campus"
              label="所属神殿"
              rules={[{ required: true, message: '请填写所属神殿' }]}
            >
              <Input disabled placeholder="当前神殿" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              name="fillDate"
              label="申请日期"
              rules={[{ required: true, message: '请选择申请日期' }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item style={{ marginTop: -8 }}>
          <Text type="secondary">
            此表按新版模板填写，姓名、部门、岗位、所属神殿会自动跟随当前登录账号，申请日期默认当天。
          </Text>
        </Form.Item>

        <Form.Item style={{ marginBottom: 12 }}>
          <Text strong>薪酬待遇</Text>
          <br />
          <Text type="secondary">
            打印版仅展示原薪资标准与晋升后薪资标准，系统内部仍保留基础薪资与绩效薪资拆分。
          </Text>
        </Form.Item>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="originalLevel" label="原职级">
              <Input placeholder="请输入原职级" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="originalSalary" label="原薪资标准">
              <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入原薪资" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="promotedLevel" label="晋升职级">
              <Input placeholder="请输入晋升职级" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="promotedBaseSalary" label="晋升后基础薪资">
              <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入晋升后基础薪资" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="promotedPerformanceSalary" label="晋升后绩效薪资">
              <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入晋升后绩效薪资" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="晋升后薪资标准">
              <InputNumber
                value={promotedSalaryTotal ?? undefined}
                disabled
                style={{ width: '100%' }}
                placeholder="系统按基础薪资 + 绩效薪资自动汇总"
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item style={{ marginBottom: 12 }}>
          <Text strong>个人总结于晋升申请（本人填写）</Text>
        </Form.Item>

        <Form.Item
          name="workOverview"
          label="一、工作概况"
          rules={[{ required: true, message: '请填写工作概况' }]}
        >
          <TextArea rows={4} placeholder="请填写现任职务及现任工作情况介绍" />
        </Form.Item>

        <Form.Item
          name="promotionReason"
          label="1、申请晋升的理由"
          rules={[createMinTextLengthRule('申请晋升的理由', 50)]}
          extra="请围绕业绩表现、晋升后的工作计划与发展目标填写，不少于50字。"
        >
          <TextArea rows={5} placeholder="请填写业绩表现、晋升后的工作计划与发展目标" showCount />
        </Form.Item>

        <Form.Item
          name="confidenceAndExpectation"
          label="2、对晋升后的信心与期望"
          rules={[createMinTextLengthRule('对晋升后的信心与期望', 50)]}
          extra="不少于50字。"
        >
          <TextArea rows={4} placeholder="请填写对晋升后的信心与期望" showCount />
        </Form.Item>

        <ApproverSelectionSection
          previewStages={approverPreview}
          loading={approverPreviewLoading}
          title="审批人预填写"
          description="晋升申请会优先读取配置中心默认模板，再按 public.users 的神殿、部门、职位规则给出候选审批人；你可以逐环节搜索并调整。"
          emptyText="请先确认所属神殿、所在部门和当前岗位，系统会自动预填写审批环节。"
        />
      </Form>
    </Modal>
  )
}

type ApprovalActionModalProps = {
  open: boolean
  loading: boolean
  type: 'approve' | 'reject'
  record: PromotionApplicationRecord | null
  onCancel: () => void
  onOk: (payload: PromotionApprovalActionPayload) => Promise<void>
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
  const promotedBaseSalary = Form.useWatch('promotedBaseSalary', form)
  const promotedPerformanceSalary = Form.useWatch('promotedPerformanceSalary', form)
  const promotedSalaryTotal = useMemo(
    () =>
      computePromotedSalaryTotal(
        promotedBaseSalary,
        promotedPerformanceSalary,
        record?.promotedSalary,
      ),
    [promotedBaseSalary, promotedPerformanceSalary, record?.promotedSalary],
  )

  useEffect(() => {
    if (!open) {
      form.resetFields()
      return
    }

    form.setFieldsValue({
      comment: type === 'approve' ? '通过' : '',
      originalLevel: record?.originalLevel || undefined,
      originalSalary: record?.originalSalary ?? undefined,
      promotedLevel: record?.promotedLevel || undefined,
      promotedBaseSalary: record?.promotedBaseSalary ?? record?.promotedSalary ?? undefined,
      promotedPerformanceSalary: record?.promotedPerformanceSalary ?? undefined,
    })
  }, [form, open, record, type])

  const handleSubmit = async () => {
    const values = await form.validateFields()
    if (type === 'approve') {
      const fieldErrors: Array<{ name: string[]; errors: string[] }> = []
      if (values.originalSalary == null) {
        fieldErrors.push({ name: ['originalSalary'], errors: ['请填写原薪资标准'] })
      }
      if (promotedSalaryTotal == null) {
        fieldErrors.push({
          name: ['promotedBaseSalary'],
          errors: ['请填写晋升后基础薪资或绩效薪资，系统将自动汇总晋升后薪资标准'],
        })
      }
      if (fieldErrors.length > 0) {
        form.setFields(fieldErrors)
        return
      }
    }

    await onOk({
      comment: values.comment?.trim() || undefined,
      originalLevel: values.originalLevel || undefined,
      originalSalary: values.originalSalary ?? undefined,
      promotedLevel: values.promotedLevel || undefined,
      promotedBaseSalary: values.promotedBaseSalary ?? undefined,
      promotedPerformanceSalary: values.promotedPerformanceSalary ?? undefined,
      promotedSalary: promotedSalaryTotal ?? undefined,
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
              原薪资标准与晋升后薪资标准未补完整时，系统不会流转到下一审批环节，建议由当前签批人同步补齐。
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
                <Form.Item name="originalLevel" label="原职级">
                  <Input placeholder="可补充原职级" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="originalSalary" label="原薪资标准">
                  <InputNumber min={0} style={{ width: '100%' }} placeholder="请填写原薪资标准" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item name="promotedLevel" label="晋升职级">
                  <Input placeholder="可补充晋升职级" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="promotedBaseSalary" label="晋升后基础薪资">
                  <InputNumber
                    min={0}
                    style={{ width: '100%' }}
                    placeholder="请填写晋升后基础薪资"
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="promotedPerformanceSalary" label="晋升后绩效薪资">
                  <InputNumber
                    min={0}
                    style={{ width: '100%' }}
                    placeholder="可补充晋升后绩效薪资"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item label="晋升后薪资标准">
              <InputNumber
                value={promotedSalaryTotal ?? undefined}
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
  flow: PromotionApprovalFlowStep[],
  actions: PromotionApplicationRecord['approvalActions'],
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
  record: PromotionApplicationRecord | null
  onCancel: () => void
}

const DetailModal: React.FC<DetailModalProps> = ({ open, record, onCancel }) => {
  if (!record) return null
  const approvalItems = PROMOTION_APPROVAL_SECTIONS.flatMap((section) => [
    {
      key: `${section.stage}Passed`,
      label: section.resultLabel,
      children: renderDecisionTag(section.getPassed(record)),
    },
    {
      key: `${section.stage}Opinion`,
      label: section.opinionLabel,
      children: section.getOpinion(record) || '-',
      span: 2 as const,
    },
  ])

  return (
    <Modal
      title="晋升申请详情"
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
            { key: 'creator', label: '申请人', children: record.createdByName || '-' },
            { key: 'fillDate', label: '申请日期', children: record.fillDate },
            { key: 'name', label: '姓名', children: record.name },
            { key: 'nativePlace', label: '籍贯', children: record.nativePlace || '-' },
            { key: 'age', label: '年龄', children: record.age ?? '-' },
            { key: 'entryDate', label: '入职时间', children: record.entryDate },
            { key: 'department', label: '部门', children: record.department },
            { key: 'position', label: '岗位', children: record.position },
            {
              key: 'salary',
              label: '薪酬调整',
              children: formatPromotionSalarySummary(record),
              span: 2,
            },
            {
              key: 'workOverview',
              label: '一、工作概况',
              children: record.workOverview || '-',
              span: 2,
            },
            {
              key: 'promotionReason',
              label: '1、申请晋升的理由',
              children: record.promotionReason || '-',
              span: 2,
            },
            {
              key: 'confidence',
              label: '2、对晋升后的信心与期望',
              children: record.confidenceAndExpectation || '-',
              span: 2,
            },
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
            ...approvalItems,
          ]}
        />
        {renderFlowCards(record.approvalFlow, record.approvalActions)}
      </Space>
    </Modal>
  )
}

const PrintPreview: React.FC<{ record: PromotionApplicationRecord }> = ({ record }) => {
  const flowMap = record.approvalFlow.reduce<Record<string, PromotionApprovalFlowStep>>(
    (result, item) => {
      result[item.stage] = item
      return result
    },
    {},
  )
  const promotedSalaryTotal = computePromotedSalaryTotal(
    record.promotedBaseSalary,
    record.promotedPerformanceSalary,
    record.promotedSalary,
  )
  const applicantName = record.createdByName || record.name

  const renderSignature = (
    label: string,
    signerName?: string | null,
    dateValue?: string | null,
  ) => (
    <>
      <div className="promotion-signature-row">
        <span>{label}：</span>
        <span className="promotion-signature-line">{formatPrintValue(signerName)}</span>
      </div>
      <div className="promotion-signature-row promotion-date-row">
        <span>申请日期：</span>
        <span>{formatPrintDate(dateValue)}</span>
      </div>
    </>
  )

  const renderApprovalBlock = (
    title: string,
    signerLabel: string,
    comment?: string | null,
    signerName?: string | null,
    actedAt?: string | null,
  ) => (
    <>
      <tr>
        <td colSpan={8} className="promotion-subtitle">
          {title}
        </td>
      </tr>
      <tr>
        <td colSpan={8} className="promotion-allow-top">
          <div className="promotion-approval-area">{comment || ' '}</div>
          {renderSignature(signerLabel, signerName, actedAt)}
        </td>
      </tr>
    </>
  )

  return (
    <div className="promotion-print">
      <style>{PROMOTION_APPLICATION_PRINT_STYLE}</style>

      <table className="promotion-print-table">
        <colgroup>
          <col style={{ width: '11%' }} />
          <col style={{ width: '12%' }} />
          <col style={{ width: '11%' }} />
          <col style={{ width: '18%' }} />
          <col style={{ width: '11%' }} />
          <col style={{ width: '12%' }} />
          <col style={{ width: '11%' }} />
          <col style={{ width: '14%' }} />
        </colgroup>
        <tbody>
          <tr>
            <td colSpan={2} className="promotion-brand-cell">
              <div className="promotion-brand-cn">清美教育</div>
              <div className="promotion-brand-en">LANCY</div>
            </td>
            <td colSpan={6} className="promotion-title-cell">
              {record.campus || 'XX神殿'}
              {record.department || 'XX部门'}员工晋升申请表
            </td>
          </tr>

          <tr>
            <td className="promotion-label">姓名</td>
            <td>{formatPrintValue(record.name)}</td>
            <td className="promotion-label">籍贯</td>
            <td>{formatPrintValue(record.nativePlace)}</td>
            <td className="promotion-label">年龄</td>
            <td>{formatPrintValue(record.age)}</td>
            <td className="promotion-label">入职时间</td>
            <td>{formatRecordDate(record.entryDate)}</td>
          </tr>

          <tr>
            <td className="promotion-label">部门</td>
            <td>{formatPrintValue(record.department)}</td>
            <td className="promotion-label">岗位</td>
            <td>{formatPrintValue(record.position)}</td>
            <td className="promotion-label">所属神殿</td>
            <td colSpan={3}>{formatPrintValue(record.campus)}</td>
          </tr>

          <tr>
            <td rowSpan={2} className="promotion-salary-tag">
              薪酬待遇
            </td>
            <td className="promotion-label">原职级</td>
            <td colSpan={3}>{formatPrintValue(record.originalLevel)}</td>
            <td className="promotion-label">原薪资标准</td>
            <td colSpan={2}>{formatPrintValue(record.originalSalary)}</td>
          </tr>

          <tr>
            <td className="promotion-label">晋升职级</td>
            <td colSpan={3}>{formatPrintValue(record.promotedLevel)}</td>
            <td className="promotion-label">晋升后薪资标准</td>
            <td colSpan={2}>{formatPrintValue(promotedSalaryTotal)}</td>
          </tr>

          <tr>
            <td colSpan={8} className="promotion-section-title">
              个人总结于晋升申请（本人填写）
            </td>
          </tr>

          <tr>
            <td colSpan={8} className="promotion-subtitle">
              一、工作概况（现任职务及现任工作情况介绍）
            </td>
          </tr>

          <tr>
            <td colSpan={8} className="promotion-allow-top">
              <div className="promotion-write-area">{record.workOverview || ' '}</div>
            </td>
          </tr>

          <tr>
            <td colSpan={8} className="promotion-allow-top">
              <div className="promotion-subtitle">
                1、申请晋升的理由：①业绩表现、②晋升后的工作计划与发展目标
              </div>
              <div className="promotion-write-area tall">{record.promotionReason || ' '}</div>
            </td>
          </tr>

          <tr>
            <td colSpan={8} className="promotion-allow-top">
              <div className="promotion-subtitle">2、对晋升后的信心与期望</div>
              <div className="promotion-write-area tall">
                {record.confidenceAndExpectation || ' '}
              </div>
              {renderSignature('申请人', applicantName, record.fillDate)}
            </td>
          </tr>

          {PROMOTION_APPROVAL_SECTIONS.map((section) => {
            const flowItem = flowMap[section.stage]
            return (
              <React.Fragment key={section.stage}>
                {renderApprovalBlock(
                  section.title,
                  section.signerLabel,
                  section.getOpinion(record) || flowItem?.comment,
                  flowItem?.actedByName,
                  flowItem?.actedAt,
                )}
              </React.Fragment>
            )
          })}

          <tr>
            <td className="promotion-label promotion-allow-top">备注</td>
            <td colSpan={7} className="promotion-remark">
              1、此表适用于公司试用期结束后所有员工；
              <br />
              2、职位与工资级别参考公司正式员工工资标准表执行；
              <br />
              3、晋升职位在审核通过后，即时办理交接转岗；晋级工资按晋升审核通过日的下一个月起计算发放；
              <br />
              4、此表审批程序按公司授权执行；
              <br />
              5、此表由人资部统一核准、归档与管理。
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

const PromotionApplicationPage: React.FC = () => {
  const { user: currentUser } = useAuthStore()
  const { currentCampus } = useCampusStore()
  const printRef = useRef<HTMLDivElement | null>(null)
  const [loading, setLoading] = useState(false)
  const [records, setRecords] = useState<PromotionApplicationRecord[]>([])
  const [users, setUsers] = useState<UserPermissionInfo[]>([])
  const [statusFilter, setStatusFilter] = useState<PromotionStatus | undefined>()
  const [keyword, setKeyword] = useState('')
  const [editOpen, setEditOpen] = useState(false)
  const [editLoading, setEditLoading] = useState(false)
  const [editingRecord, setEditingRecord] = useState<PromotionApplicationRecord | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailRecord, setDetailRecord] = useState<PromotionApplicationRecord | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [printOpen, setPrintOpen] = useState(false)
  const [printRecord, setPrintRecord] = useState<PromotionApplicationRecord | null>(null)
  const [printLoading, setPrintLoading] = useState(false)
  const [actionState, setActionState] = useState<{
    open: boolean
    type: 'approve' | 'reject'
    record: PromotionApplicationRecord | null
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
        listPromotionApplications({
          campus: activeCampus || undefined,
          status: statusFilter,
        }),
        fetchUserPermissions(),
      ])
      setRecords(list)
      setUsers(campusUsers.filter((item) => item.status === 'active'))
    } catch (error) {
      console.error('加载晋升申请失败', error)
      message.error(getErrorMessage(error, '加载晋升申请失败'))
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

  const openEditModal = (record: PromotionApplicationRecord) => {
    setEditingRecord(record)
    setEditOpen(true)
  }

  const handleSave = async (payload: PromotionApplicationPayload) => {
    try {
      setEditLoading(true)
      if (editingRecord) {
        await updatePromotionApplication(editingRecord.id, payload)
        message.success('晋升申请已更新')
      } else {
        await createPromotionApplication(payload)
        message.success('晋升申请已创建')
      }
      setEditOpen(false)
      setEditingRecord(null)
      await loadData()
    } catch (error) {
      message.error(getErrorMessage(error, editingRecord ? '更新晋升申请失败' : '创建晋升申请失败'))
    } finally {
      setEditLoading(false)
    }
  }

  const handleDelete = async (record: PromotionApplicationRecord) => {
    try {
      await deletePromotionApplication(record.id)
      message.success('晋升申请已删除')
      await loadData()
    } catch (error) {
      message.error(getErrorMessage(error, '删除晋升申请失败'))
    }
  }

  const openDetailModal = async (record: PromotionApplicationRecord) => {
    try {
      setDetailLoading(true)
      const detail = await getPromotionApplication(record.id)
      setDetailRecord(detail)
      setDetailOpen(true)
    } catch (error) {
      message.error(getErrorMessage(error, '加载详情失败'))
    } finally {
      setDetailLoading(false)
    }
  }

  const openPrintModal = async (record: PromotionApplicationRecord) => {
    try {
      setPrintLoading(true)
      const detail = await getPromotionApplication(record.id)
      setPrintRecord(detail)
      setPrintOpen(true)
    } catch (error) {
      message.error(getErrorMessage(error, '加载打印详情失败'))
    } finally {
      setPrintLoading(false)
    }
  }

  const handlePrint = useCallback(() => {
    if (!printRef.current) {
      message.error('打印内容未加载完成')
      return
    }

    const printWindow = window.open('', '_blank', 'width=1120,height=1400')
    if (!printWindow) {
      message.error('无法打开打印窗口')
      return
    }

    const title = printRecord
      ? `${printRecord.campus || 'XX神殿'}${printRecord.department || 'XX部门'}员工晋升申请表`
      : '员工晋升申请表'

    printWindow.document.open()
    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>${PROMOTION_APPLICATION_PRINT_STYLE}</style>
        </head>
        <body>${printRef.current.innerHTML}</body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    window.setTimeout(() => {
      printWindow.print()
    }, 200)
  }, [printRecord])

  const handleSubmit = async (record: PromotionApplicationRecord) => {
    try {
      await submitPromotionApplication(record.id)
      message.success('晋升申请已提交审批')
      await loadData()
    } catch (error) {
      message.error(getErrorMessage(error, '提交晋升申请失败'))
    }
  }

  const handleAction = async (payload: PromotionApprovalActionPayload) => {
    const actionRecord = actionState.record
    if (!actionRecord) return
    const comment = payload.comment?.trim() || ''
    if (actionState.type === 'reject' && !comment) {
      message.warning('驳回时请填写审批意见')
      return
    }

    try {
      setActionLoading(true)
      if (actionState.type === 'approve') {
        await approvePromotionApplication(actionRecord.id, {
          ...payload,
          comment: comment || undefined,
        })
        message.success('审批已通过')
      } else {
        await rejectPromotionApplication(actionRecord.id, comment)
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

  const columns: ColumnsType<PromotionApplicationRecord> = [
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
      title: '当前岗位',
      dataIndex: 'position',
      width: 140,
    },
    {
      title: '所属神殿',
      dataIndex: 'campus',
      width: 120,
    },
    {
      title: '晋升职级',
      dataIndex: 'promotedLevel',
      width: 120,
      render: (value) => value || '-',
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
              <Title level={5} style={{ margin: 0 }}>
                晋升申请表
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
                  { label: '草稿', value: 'draft' },
                  { label: '审批中', value: 'pending' },
                  { label: '已通过', value: 'approved' },
                  { label: '已驳回', value: 'rejected' },
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
                新建晋升申请
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
          scroll={{ x: 1700 }}
          locale={{ emptyText: '暂无晋升申请' }}
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
        title="晋升申请打印预览"
        open={printOpen}
        onCancel={() => setPrintOpen(false)}
        width={1080}
        footer={[
          <Button key="close" onClick={() => setPrintOpen(false)}>
            关闭
          </Button>,
          <Button
            key="print"
            type="primary"
            onClick={handlePrint}
            disabled={printLoading || !printRecord}
          >
            打印
          </Button>,
        ]}
        destroyOnClose
      >
        <div ref={printRef}>
          {printLoading ? (
            <Card loading />
          ) : printRecord ? (
            <PrintPreview record={printRecord} />
          ) : null}
        </div>
      </Modal>
    </div>
  )
}

export default PromotionApplicationPage
