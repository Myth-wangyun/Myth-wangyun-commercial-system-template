import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  App,
  AutoComplete,
  Button,
  Card,
  Checkbox,
  Col,
  DatePicker,
  Descriptions,
  Divider,
  Form,
  Input,
  InputNumber,
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
  InteractionOutlined,
  PlusOutlined,
  PrinterOutlined,
  SearchOutlined,
  SendOutlined,
} from '@ant-design/icons'
import dayjs, { type Dayjs } from 'dayjs'
import { useAuthStore } from '@/stores/authStore'
import { useCampusStore } from '@/stores/campusStore'
import {
  approveWorkHandover,
  createWorkHandover,
  deleteWorkHandover,
  getWorkHandover,
  listWorkHandovers,
  previewWorkHandoverApproverCandidates,
  previewWorkHandoverFormAssignees,
  rejectWorkHandover,
  submitWorkHandover,
  type WorkHandoverApprovalFlowStep,
  type WorkHandoverApprovalPreviewStage,
  type WorkHandoverDepartmentSection,
  type WorkHandoverFinanceSection,
  type WorkHandoverHrSection,
  type WorkHandoverPayload,
  type WorkHandoverRecord,
  type WorkHandoverStatus,
  updateWorkHandover,
} from '@/services/humanresources/workHandover'
import {
  ApproverSelectionSection,
  mergeApproverSelections,
  normalizeSelectedApproverMap,
} from '@/components/human-resources/ApproverSelectionSection'
import { fetchUserPermissions, type UserPermissionInfo } from '@/services/configMaster'

const { Text, Title } = Typography
const { TextArea } = Input

const STATUS_COLOR_MAP: Record<WorkHandoverStatus, string> = {
  draft: 'default',
  pending: 'processing',
  approved: 'success',
  rejected: 'error',
}

const MANAGEMENT_CENTER_CAMPUS_VALUES = ['最高议事厅', '最高议事厅神殿']
const LEAVE_TYPES = ['自动离职', '劝退', '合同期满', '其他']
const LEAVE_REASONS = ['个人发展', '公司管理', '岗位调配', '薪酬福利', '其他']

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

const defaultDeptHandover: WorkHandoverDepartmentSection = {
  workHandover: '',
  materialsHandover: '',
  pendingItems: '',
  workCompleted: false,
  noIssues: false,
  managerSign: '',
  managerDate: undefined,
  lastMonth: '',
  lastDay: '',
  salarySign: '',
  salaryDate: undefined,
  receiver: '',
  handleDate: undefined,
}

const defaultFinanceHandover: WorkHandoverFinanceSection = {
  hasDebt: false,
  debtAmount: undefined,
  receiptSubmitted: false,
  receiptCount: undefined,
  financeItems: '',
  cashierSign: '',
  cashierDate: undefined,
  accountCleared: false,
  itemsCompleted: false,
  managerSign: '',
  managerDate: undefined,
}

const defaultHrHandover: WorkHandoverHrSection = {
  fixedAssets: '',
  officeSupplies: '',
  fingerprint: '',
  insurance: '',
  receiver: '',
  handleDate: undefined,
  completed: false,
  salaryNormal: false,
  salaryEndYear: '',
  salaryEndMonth: '',
  salaryEndDay: '',
  managerSign: '',
  managerDate: undefined,
}

type EditModalProps = {
  open: boolean
  loading: boolean
  campus?: string | null
  currentUserName?: string | null
  currentUserDepartment?: string | null
  currentUserPosition?: string | null
  currentUserEmail?: string | null
  currentUserPhone?: string | null
  editingRecord: WorkHandoverRecord | null
  users: UserPermissionInfo[]
  onCancel: () => void
  onOk: (payload: WorkHandoverPayload) => Promise<void>
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
  const [approverPreview, setApproverPreview] = useState<WorkHandoverApprovalPreviewStage[]>([])
  const [approverPreviewLoading, setApproverPreviewLoading] = useState(false)
  const [principalSignRequired, setPrincipalSignRequired] = useState(true)

  const campusUsers = useMemo(
    () => users.filter((item) => campusMatchesScope(item.campus, selectedCampus || campus)),
    [campus, selectedCampus, users],
  )

  const departmentOptions = useMemo(() => {
    const values = new Set<string>()
    campusUsers.forEach((item) => item.department && values.add(item.department))
    if (currentUserDepartment) values.add(currentUserDepartment)
    if (editingRecord?.department) values.add(editingRecord.department)
    return Array.from(values)
      .sort((a, b) => a.localeCompare(b, 'zh-CN'))
      .map((value) => ({ value }))
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
        campus: editingRecord.campus,
        name: editingRecord.name,
        department: editingRecord.department,
        position: editingRecord.position,
        entryDate: editingRecord.entryDate ? dayjs(editingRecord.entryDate) : undefined,
        phone: editingRecord.phone || undefined,
        email: editingRecord.email || undefined,
        leaveDate: dayjs(editingRecord.leaveDate),
        leaveType: editingRecord.leaveType || undefined,
        leaveTypeOther: editingRecord.leaveTypeOther || undefined,
        leaveReason: editingRecord.leaveReason,
        leaveReasonOther: editingRecord.leaveReasonOther || undefined,
        address: editingRecord.address || undefined,
        deptHandover: {
          ...editingRecord.deptHandover,
          handleDate: editingRecord.deptHandover.handleDate
            ? dayjs(editingRecord.deptHandover.handleDate)
            : undefined,
          managerDate: editingRecord.deptHandover.managerDate
            ? dayjs(editingRecord.deptHandover.managerDate)
            : undefined,
          salaryDate: editingRecord.deptHandover.salaryDate
            ? dayjs(editingRecord.deptHandover.salaryDate)
            : undefined,
        },
        financeHandover: {
          ...editingRecord.financeHandover,
          cashierDate: editingRecord.financeHandover.cashierDate
            ? dayjs(editingRecord.financeHandover.cashierDate)
            : undefined,
          managerDate: editingRecord.financeHandover.managerDate
            ? dayjs(editingRecord.financeHandover.managerDate)
            : undefined,
        },
        hrHandover: {
          ...editingRecord.hrHandover,
          handleDate: editingRecord.hrHandover.handleDate
            ? dayjs(editingRecord.hrHandover.handleDate)
            : undefined,
          managerDate: editingRecord.hrHandover.managerDate
            ? dayjs(editingRecord.hrHandover.managerDate)
            : undefined,
        },
        allCompleted: editingRecord.allCompleted,
        principalSign: editingRecord.principalSign || undefined,
        principalDate: editingRecord.principalDate ? dayjs(editingRecord.principalDate) : undefined,
        selectedApproverUserIds: editingRecord.selectedApproverUserIds || {},
      })
      setPrincipalSignRequired(editingRecord.principalSignRequired)
      return
    }

    form.setFieldsValue({
      campus: campus || undefined,
      name: currentUserName || undefined,
      department: currentUserDepartment || undefined,
      position: currentUserPosition || undefined,
      phone: currentUserPhone || undefined,
      email: currentUserEmail || undefined,
      leaveReason: [],
      deptHandover: defaultDeptHandover,
      financeHandover: defaultFinanceHandover,
      hrHandover: defaultHrHandover,
      allCompleted: false,
      selectedApproverUserIds: {},
    })
    setPrincipalSignRequired(true)
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
      setPrincipalSignRequired(true)
      return
    }

    const normalizedCampus = typeof selectedCampus === 'string' ? selectedCampus.trim() : ''
    const normalizedDepartment =
      typeof selectedDepartment === 'string' ? selectedDepartment.trim() : ''
    const normalizedPosition = typeof selectedPosition === 'string' ? selectedPosition.trim() : ''

    if (!normalizedCampus || !normalizedDepartment || !normalizedPosition) {
      setApproverPreview([])
      setPrincipalSignRequired(editingRecord?.principalSignRequired ?? true)
      form.setFieldValue(
        'selectedApproverUserIds',
        normalizeSelectedApproverMap(form.getFieldValue('selectedApproverUserIds')),
      )
      return
    }

    let active = true
    setApproverPreviewLoading(true)
    Promise.all([
      previewWorkHandoverApproverCandidates({
        campus: normalizedCampus,
        department: normalizedDepartment,
        position: normalizedPosition,
      }),
      previewWorkHandoverFormAssignees({
        campus: normalizedCampus,
        department: normalizedDepartment,
        position: normalizedPosition,
      }),
    ])
      .then(([stages, assigneePreview]) => {
        if (!active) return
        setApproverPreview(stages)
        setPrincipalSignRequired(assigneePreview.principalSignRequired)
        form.setFieldValue(
          'selectedApproverUserIds',
          mergeApproverSelections(
            stages,
            form.getFieldValue('selectedApproverUserIds'),
            editingRecord?.selectedApproverUserIds,
            { includeRecommended: false },
          ),
        )

        const setFieldValueIfEmpty = (path: (string | number)[], value?: string | null) => {
          if (!value) return
          const currentValue = String(form.getFieldValue(path) ?? '').trim()
          if (!currentValue) {
            form.setFieldValue(path, value)
          }
        }

        setFieldValueIfEmpty(
          ['deptHandover', 'receiver'],
          assigneePreview.departmentReceiver.recommendedName,
        )
        setFieldValueIfEmpty(
          ['financeHandover', 'cashierSign'],
          assigneePreview.financeCashier.recommendedName,
        )
        setFieldValueIfEmpty(
          ['financeHandover', 'managerSign'],
          assigneePreview.financeManager.recommendedName,
        )
        setFieldValueIfEmpty(
          ['hrHandover', 'receiver'],
          assigneePreview.hrReceiver.recommendedName,
        )

        if (!assigneePreview.principalSignRequired) {
          form.setFieldValue('principalSign', undefined)
          form.setFieldValue('principalDate', undefined)
        }
      })
      .catch((error) => {
        if (!active) return
        console.error('加载工作交接规则预览失败', error)
        message.error(getErrorMessage(error, '加载工作交接规则预览失败'))
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
      campus: values.campus,
      name: values.name,
      department: values.department,
      position: values.position,
      entryDate: fmtDate(values.entryDate),
      phone: values.phone || undefined,
      email: values.email || undefined,
      leaveDate: (values.leaveDate as Dayjs).format('YYYY-MM-DD'),
      leaveType: values.leaveType || undefined,
      leaveTypeOther: values.leaveTypeOther || undefined,
      leaveReason: values.leaveReason || [],
      leaveReasonOther: values.leaveReasonOther || undefined,
      address: values.address || undefined,
      deptHandover: {
        ...defaultDeptHandover,
        ...(values.deptHandover || {}),
        handleDate: fmtDate(values.deptHandover?.handleDate),
        managerDate: fmtDate(values.deptHandover?.managerDate),
        salaryDate: fmtDate(values.deptHandover?.salaryDate),
      },
      financeHandover: {
        ...defaultFinanceHandover,
        ...(values.financeHandover || {}),
        cashierDate: fmtDate(values.financeHandover?.cashierDate),
        managerDate: fmtDate(values.financeHandover?.managerDate),
      },
      hrHandover: {
        ...defaultHrHandover,
        ...(values.hrHandover || {}),
        handleDate: fmtDate(values.hrHandover?.handleDate),
        managerDate: fmtDate(values.hrHandover?.managerDate),
      },
      allCompleted: Boolean(values.allCompleted),
      principalSign: principalSignRequired ? values.principalSign || undefined : undefined,
      principalDate: principalSignRequired ? fmtDate(values.principalDate) : undefined,
      selectedApproverUserIds: normalizeSelectedApproverMap(values.selectedApproverUserIds),
    })
  }

  return (
    <Modal
      title={editingRecord ? '编辑工作交接表' : '新建工作交接表'}
      open={open}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={loading}
      okText="保存"
      cancelText="取消"
      width={1080}
      destroyOnClose
    >
      <div style={{ maxHeight: '72vh', overflowY: 'auto', paddingRight: 8 }}>
        <Form form={form} layout="vertical">
          <Row gutter={16}>
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
              <Form.Item
                name="name"
                label="姓名"
                rules={[{ required: true, message: '请输入姓名' }]}
              >
                <Input placeholder="请输入姓名" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="department"
                label="原部门"
                rules={[{ required: true, message: '请输入原部门' }]}
              >
                <AutoComplete
                  options={departmentOptions}
                  placeholder="支持输入或选择部门"
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
                name="position"
                label="原职务"
                rules={[{ required: true, message: '请输入原职务' }]}
              >
                <AutoComplete
                  options={positionOptions}
                  placeholder="支持输入或选择职务"
                  filterOption={(inputValue, option) =>
                    String(option?.value || '')
                      .toLowerCase()
                      .includes(inputValue.toLowerCase())
                  }
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="entryDate" label="入职时间">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="leaveDate"
                label="离职时间"
                rules={[{ required: true, message: '请选择离职时间' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="phone" label="联系方式">
                <Input placeholder="请输入联系方式" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="email" label="常用邮箱">
                <Input placeholder="请输入常用邮箱" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="leaveType" label="离职类型">
                <Select
                  allowClear
                  placeholder="请选择离职类型"
                  options={LEAVE_TYPES.map((value) => ({ value, label: value }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="leaveTypeOther" label="离职类型（其他说明）">
                <Input placeholder='选择"其他"时填写' />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="leaveReason" label="离职原因（可多选）">
                <Checkbox.Group options={LEAVE_REASONS} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="leaveReasonOther" label="离职原因（其他说明）">
            <Input placeholder='选择"其他"时填写' />
          </Form.Item>

          <Form.Item name="address" label="联系地址">
            <Input placeholder="请输入联系地址" />
          </Form.Item>

          <Card title="一、所属部门工作交接" size="small" style={{ marginBottom: 16 }}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 12, fontSize: 12 }}>
              交接项目（请另附纸质详细交接清单）
            </Text>
            <Form.Item name={['deptHandover', 'workHandover']} label="工作交接">
              <TextArea rows={3} placeholder="请填写工作交接内容" />
            </Form.Item>
            <Form.Item name={['deptHandover', 'materialsHandover']} label="资料用品移交">
              <TextArea rows={3} placeholder="请填写资料用品移交内容" />
            </Form.Item>
            <Form.Item name={['deptHandover', 'pendingItems']} label="未完及代办事项">
              <TextArea rows={3} placeholder="请填写未完及代办事项" />
            </Form.Item>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name={['deptHandover', 'receiver']}
                  label="接收人"
                  extra="系统根据神殿、部门、岗位自动带出"
                >
                  <Input disabled placeholder="系统自动带出接收人" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name={['deptHandover', 'handleDate']} label="办理日期">
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>

            <Divider dashed style={{ margin: '8px 0' }} />
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name={['deptHandover', 'workCompleted']}
                  valuePropName="checked"
                  style={{ marginBottom: 0 }}
                >
                  <Checkbox>工作交接完毕</Checkbox>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name={['deptHandover', 'noIssues']}
                  valuePropName="checked"
                  style={{ marginBottom: 0 }}
                >
                  <Checkbox>无遗留问题</Checkbox>
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16} style={{ marginTop: 8 }}>
              <Col span={12}>
                <Form.Item name={['deptHandover', 'managerSign']} label="部门负责人确认签字">
                  <Input placeholder="签字" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name={['deptHandover', 'managerDate']} label="日期">
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>

            <Divider dashed style={{ margin: '4px 0 8px' }} />
            <Text type="secondary" style={{ fontSize: 12 }}>
              该同事在岗工作时间至____月____日止，请按此时间计薪。
            </Text>
            <Row gutter={16} style={{ marginTop: 8 }}>
              <Col span={4}>
                <Form.Item name={['deptHandover', 'lastMonth']} label="截止月">
                  <Input placeholder="月" addonAfter="月" />
                </Form.Item>
              </Col>
              <Col span={4}>
                <Form.Item name={['deptHandover', 'lastDay']} label="截止日">
                  <Input placeholder="日" addonAfter="日" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name={['deptHandover', 'salarySign']} label="签字">
                  <Input placeholder="签字" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name={['deptHandover', 'salaryDate']} label="日期">
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Card title="二、神藏司" size="small" style={{ marginBottom: 16 }}>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>
              出纳
            </Text>
            <Row gutter={16} align="middle">
              <Col span={6}>
                <Form.Item
                  name={['financeHandover', 'hasDebt']}
                  label="有无公司欠款"
                  style={{ marginBottom: 8 }}
                >
                  <Radio.Group>
                    <Radio value={false}>无</Radio>
                    <Radio value={true}>有</Radio>
                  </Radio.Group>
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name={['financeHandover', 'debtAmount']} label="金额（人民币）">
                  <InputNumber
                    min={0}
                    precision={2}
                    style={{ width: '100%' }}
                    placeholder="0.00"
                    addonAfter="元"
                  />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item
                  name={['financeHandover', 'receiptSubmitted']}
                  label="未报销票据是否提交"
                  style={{ marginBottom: 8 }}
                >
                  <Radio.Group>
                    <Radio value={false}>未提交</Radio>
                    <Radio value={true}>已提交</Radio>
                  </Radio.Group>
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name={['financeHandover', 'receiptCount']} label="票据张数">
                  <InputNumber
                    min={0}
                    precision={0}
                    style={{ width: '100%' }}
                    placeholder="0"
                    addonAfter="张"
                  />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name={['financeHandover', 'financeItems']} label="财务类物品交接">
              <TextArea rows={2} placeholder="请填写财务类物品交接明细" />
            </Form.Item>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name={['financeHandover', 'cashierSign']}
                  label="出纳签字"
                  extra="系统根据神殿、部门、岗位自动带出"
                >
                  <Input disabled placeholder="系统自动带出财务签字人" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name={['financeHandover', 'cashierDate']} label="日期">
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>

            <Divider dashed style={{ margin: '4px 0 8px' }} />
            <Text strong>部门负责人确认</Text>
            <Row gutter={16} style={{ marginTop: 8 }}>
              <Col span={12}>
                <Form.Item
                  name={['financeHandover', 'accountCleared']}
                  valuePropName="checked"
                  style={{ marginBottom: 0 }}
                >
                  <Checkbox>相关财务账款已清</Checkbox>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name={['financeHandover', 'itemsCompleted']}
                  valuePropName="checked"
                  style={{ marginBottom: 0 }}
                >
                  <Checkbox>财务类物品交接完毕</Checkbox>
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16} style={{ marginTop: 8 }}>
              <Col span={12}>
                <Form.Item
                  name={['financeHandover', 'managerSign']}
                  label="签字"
                  extra="系统根据神殿、部门、岗位自动带出"
                >
                  <Input disabled placeholder="系统自动带出财务负责人" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name={['financeHandover', 'managerDate']} label="日期">
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Card title="三、人事行政部" size="small" style={{ marginBottom: 16 }}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 12, fontSize: 12 }}>
              交接项目（如交接内容较多，请另附工作交接表）
            </Text>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name={['hrHandover', 'fixedAssets']} label="固定资产">
                  <TextArea rows={2} placeholder="请填写固定资产交接明细" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name={['hrHandover', 'officeSupplies']} label="办公用品">
                  <TextArea rows={2} placeholder="请填写办公用品交接明细" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name={['hrHandover', 'fingerprint']} label="指纹、QQ群">
                  <TextArea rows={2} placeholder="请填写指纹、QQ群等注销/退出情况" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name={['hrHandover', 'insurance']} label="五险">
                  <TextArea rows={2} placeholder="请填写五险停缴/转移情况" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name={['hrHandover', 'receiver']}
                  label="接收人签字"
                  extra="系统根据人事行政部接收规则自动带出"
                >
                  <Input disabled placeholder="系统自动带出" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name={['hrHandover', 'handleDate']} label="办理日期">
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>

            <Divider dashed style={{ margin: '4px 0 8px' }} />
            <Text strong>部门负责人确认</Text>
            <Row gutter={16} style={{ marginTop: 8 }}>
              <Col span={12}>
                <Form.Item
                  name={['hrHandover', 'completed']}
                  valuePropName="checked"
                  style={{ marginBottom: 4 }}
                >
                  <Checkbox>交接手续已完成，无遗留问题</Checkbox>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name={['hrHandover', 'salaryNormal']}
                  valuePropName="checked"
                  style={{ marginBottom: 4 }}
                >
                  <Checkbox>可以正常发放工资</Checkbox>
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16} align="middle">
              <Col span={8}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  薪资截止日为：
                </Text>
              </Col>
              <Col span={5}>
                <Form.Item name={['hrHandover', 'salaryEndYear']} style={{ marginBottom: 8 }}>
                  <Input placeholder="年" addonAfter="年" />
                </Form.Item>
              </Col>
              <Col span={5}>
                <Form.Item name={['hrHandover', 'salaryEndMonth']} style={{ marginBottom: 8 }}>
                  <Input placeholder="月" addonAfter="月" />
                </Form.Item>
              </Col>
              <Col span={5}>
                <Form.Item name={['hrHandover', 'salaryEndDay']} style={{ marginBottom: 8 }}>
                  <Input placeholder="日" addonAfter="日" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name={['hrHandover', 'managerSign']} label="签字">
                  <Input placeholder="签字" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name={['hrHandover', 'managerDate']} label="日期">
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Card size="small" style={{ background: '#fffbe6', borderColor: '#ffe58f' }}>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>
              {principalSignRequired
                ? '离职人员办理好所有手续后，需经中心校长签字确认，方为离职交接手续完毕。'
                : '当前所属神殿、部门或岗位无需校长签字，办理完毕后勾选完成即可。'}
            </Text>
            <Row gutter={16} align="middle">
              <Col span={8}>
                <Form.Item name="allCompleted" valuePropName="checked" style={{ marginBottom: 0 }}>
                  <Checkbox>离职交接手续办理完毕</Checkbox>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="principalSign" label="校长签字" style={{ marginBottom: 0 }}>
                  <Input
                    disabled={!principalSignRequired}
                    placeholder={principalSignRequired ? '校长签字' : '当前无需填写'}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="principalDate" label="日期" style={{ marginBottom: 0 }}>
                  <DatePicker disabled={!principalSignRequired} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <div style={{ marginTop: 16 }}>
            <ApproverSelectionSection
              previewStages={approverPreview}
              loading={approverPreviewLoading}
              title="审批人选择"
              description="系统会根据神殿、部门和岗位列出候选审批人；请逐环节选择实际审批人。"
              emptyText="请先确认所属神殿、原部门和原职务，系统会自动列出候选审批人。"
              recommendedHintMode="candidate"
            />
          </div>
        </Form>
      </div>
    </Modal>
  )
}

type ApprovalActionModalProps = {
  open: boolean
  loading: boolean
  type: 'approve' | 'reject'
  record: WorkHandoverRecord | null
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
  }, [open, record?.id, type])

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

const SectionSummaryCard: React.FC<{
  title: string
  items: Array<{ label: string; value?: React.ReactNode }>
}> = ({ title, items }) => (
  <Card size="small" title={title}>
    <Descriptions bordered size="small" column={2}>
      {items.map((item) => (
        <Descriptions.Item key={item.label} label={item.label} span={item.label.length > 8 ? 2 : 1}>
          {item.value ?? '-'}
        </Descriptions.Item>
      ))}
    </Descriptions>
  </Card>
)

const DetailModal: React.FC<{
  open: boolean
  record: WorkHandoverRecord | null
  onCancel: () => void
}> = ({ open, record, onCancel }) => (
  <Modal
    title="工作交接表详情"
    open={open}
    onCancel={onCancel}
    footer={null}
    width={1040}
    destroyOnClose
  >
    {!record ? null : (
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Descriptions bordered size="small" column={2}>
          <Descriptions.Item label="申请单号">{record.applicationNo}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={STATUS_COLOR_MAP[record.status]}>{record.statusLabel}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="申请人">
            {record.createdByName || record.name}
          </Descriptions.Item>
          <Descriptions.Item label="当前阶段">{record.currentStageLabel || '-'}</Descriptions.Item>
          <Descriptions.Item label="姓名">{record.name}</Descriptions.Item>
          <Descriptions.Item label="所属神殿">{record.campus}</Descriptions.Item>
          <Descriptions.Item label="原部门">{record.department}</Descriptions.Item>
          <Descriptions.Item label="原职务">{record.position}</Descriptions.Item>
          <Descriptions.Item label="入职时间">{formatDate(record.entryDate)}</Descriptions.Item>
          <Descriptions.Item label="离职时间">{formatDate(record.leaveDate)}</Descriptions.Item>
          <Descriptions.Item label="联系方式">{record.phone || '-'}</Descriptions.Item>
          <Descriptions.Item label="常用邮箱">{record.email || '-'}</Descriptions.Item>
          <Descriptions.Item label="离职类型">
            {record.leaveType || '-'}
            {record.leaveTypeOther ? `（${record.leaveTypeOther}）` : ''}
          </Descriptions.Item>
          <Descriptions.Item label="离职原因">
            {record.leaveReason.length ? record.leaveReason.join('、') : '-'}
            {record.leaveReasonOther ? `（${record.leaveReasonOther}）` : ''}
          </Descriptions.Item>
          <Descriptions.Item label="联系地址" span={2}>
            {record.address || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="校长签字">
            {record.principalSignRequired ? record.principalSign || '-' : '无需签字'}
          </Descriptions.Item>
          <Descriptions.Item label="校长签字日期">
            {record.principalSignRequired ? formatDate(record.principalDate) : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="全部手续办理完毕">
            {record.allCompleted ? '是' : '否'}
          </Descriptions.Item>
          <Descriptions.Item label="驳回原因">{record.rejectionReason || '-'}</Descriptions.Item>
        </Descriptions>

        <SectionSummaryCard
          title="所属部门工作交接"
          items={[
            { label: '工作交接', value: record.deptHandover.workHandover || '-' },
            { label: '资料用品移交', value: record.deptHandover.materialsHandover || '-' },
            { label: '未完及代办事项', value: record.deptHandover.pendingItems || '-' },
            { label: '接收人', value: record.deptHandover.receiver || '-' },
            { label: '办理日期', value: formatDate(record.deptHandover.handleDate) },
            { label: '工作交接完毕', value: record.deptHandover.workCompleted ? '是' : '否' },
            { label: '无遗留问题', value: record.deptHandover.noIssues ? '是' : '否' },
            { label: '部门负责人签字', value: record.deptHandover.managerSign || '-' },
            { label: '部门负责人日期', value: formatDate(record.deptHandover.managerDate) },
            {
              label: '在岗截止',
              value: `${record.deptHandover.lastMonth || '-'}月 ${record.deptHandover.lastDay || '-'}日`,
            },
            { label: '计薪确认签字', value: record.deptHandover.salarySign || '-' },
            { label: '计薪确认日期', value: formatDate(record.deptHandover.salaryDate) },
          ]}
        />

        <SectionSummaryCard
          title="神藏司"
          items={[
            { label: '有无公司欠款', value: record.financeHandover.hasDebt ? '有' : '无' },
            { label: '欠款金额', value: record.financeHandover.debtAmount ?? '-' },
            {
              label: '票据是否提交',
              value: record.financeHandover.receiptSubmitted ? '已提交' : '未提交',
            },
            { label: '票据张数', value: record.financeHandover.receiptCount ?? '-' },
            { label: '财务类物品交接', value: record.financeHandover.financeItems || '-' },
            { label: '出纳签字', value: record.financeHandover.cashierSign || '-' },
            { label: '出纳日期', value: formatDate(record.financeHandover.cashierDate) },
            {
              label: '相关财务账款已清',
              value: record.financeHandover.accountCleared ? '是' : '否',
            },
            {
              label: '财务类物品交接完毕',
              value: record.financeHandover.itemsCompleted ? '是' : '否',
            },
            { label: '部门负责人签字', value: record.financeHandover.managerSign || '-' },
            { label: '部门负责人日期', value: formatDate(record.financeHandover.managerDate) },
          ]}
        />

        <SectionSummaryCard
          title="人事行政部"
          items={[
            { label: '固定资产', value: record.hrHandover.fixedAssets || '-' },
            { label: '办公用品', value: record.hrHandover.officeSupplies || '-' },
            { label: '指纹、QQ群', value: record.hrHandover.fingerprint || '-' },
            { label: '五险', value: record.hrHandover.insurance || '-' },
            { label: '接收人签字', value: record.hrHandover.receiver || '-' },
            { label: '办理日期', value: formatDate(record.hrHandover.handleDate) },
            {
              label: '交接手续已完成',
              value: record.hrHandover.completed ? '是' : '否',
            },
            { label: '可以正常发放工资', value: record.hrHandover.salaryNormal ? '是' : '否' },
            {
              label: '薪资截止日',
              value: `${record.hrHandover.salaryEndYear || '-'}年 ${record.hrHandover.salaryEndMonth || '-'}月 ${record.hrHandover.salaryEndDay || '-'}日`,
            },
            { label: '部门负责人签字', value: record.hrHandover.managerSign || '-' },
            { label: '部门负责人日期', value: formatDate(record.hrHandover.managerDate) },
          ]}
        />

        <Card size="small" title="审批流">
          <List
            dataSource={record.approvalFlow}
            renderItem={(item: WorkHandoverApprovalFlowStep) => (
              <List.Item>
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                  <Space wrap>
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

const PrintPreview: React.FC<{ record: WorkHandoverRecord }> = ({ record }) => {
  const cell: React.CSSProperties = {
    border: '1px solid #333',
    padding: '6px 8px',
    fontSize: 12,
    lineHeight: 1.8,
    verticalAlign: 'top',
  }
  const labelCell: React.CSSProperties = {
    ...cell,
    background: '#f5f5f5',
    fontWeight: 600,
    textAlign: 'center',
  }
  const check = (value?: boolean) => (value ? '☑' : '☐')
  const flowMap = record.approvalFlow.reduce<Record<string, WorkHandoverApprovalFlowStep>>(
    (result, item) => {
      result[item.stage] = item
      return result
    },
    {},
  )

  const renderApprovalRow = (title: string, step?: WorkHandoverApprovalFlowStep) => (
    <tr key={title}>
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
    <div style={{ padding: '12px 20px', fontFamily: 'SimSun, serif' }}>
      <div style={{ textAlign: 'center', marginBottom: 10 }}>
        <Title level={4} style={{ margin: 0 }}>
          工作交接表
        </Title>
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
            <td style={{ ...labelCell, width: '12%' }}>姓 名</td>
            <td style={{ ...cell, width: '18%' }}>{record.name}</td>
            <td style={{ ...labelCell, width: '12%' }}>所属神殿</td>
            <td style={{ ...cell, width: '24%' }}>{record.campus}</td>
            <td style={{ ...labelCell, width: '12%' }}>原部门</td>
            <td style={{ ...cell, width: '22%' }}>{record.department}</td>
          </tr>
          <tr>
            <td style={labelCell}>原职务</td>
            <td style={cell}>{record.position}</td>
            <td style={labelCell}>入职时间</td>
            <td style={cell}>{formatDate(record.entryDate)}</td>
            <td style={labelCell}>联系方式</td>
            <td style={cell}>{record.phone || '-'}</td>
          </tr>
          <tr>
            <td style={labelCell}>常用邮箱</td>
            <td style={cell}>{record.email || '-'}</td>
            <td style={labelCell}>离职时间</td>
            <td colSpan={3} style={cell}>
              {formatDate(record.leaveDate)}离职，自此本人与用人单位的劳动关系解除。
            </td>
          </tr>
          <tr>
            <td style={labelCell}>离职类型</td>
            <td colSpan={5} style={cell}>
              {LEAVE_TYPES.map((item) => (
                <span key={item} style={{ marginRight: 16 }}>
                  {check(record.leaveType === item)}
                  {item}
                </span>
              ))}
              {record.leaveTypeOther ? <span>（{record.leaveTypeOther}）</span> : null}
            </td>
          </tr>
          <tr>
            <td style={labelCell}>离职原因</td>
            <td colSpan={5} style={cell}>
              {LEAVE_REASONS.map((item) => (
                <span key={item} style={{ marginRight: 16 }}>
                  {check(record.leaveReason.includes(item))}
                  {item}
                </span>
              ))}
              {record.leaveReasonOther ? <span>（{record.leaveReasonOther}）</span> : null}
            </td>
          </tr>
          <tr>
            <td style={labelCell}>联系地址</td>
            <td colSpan={5} style={cell}>
              {record.address || '-'}
            </td>
          </tr>
          <tr>
            <td style={{ ...labelCell, width: '12%' }}>部 门</td>
            <td colSpan={5} style={{ ...labelCell }}>
              交接情况
            </td>
          </tr>

          <tr>
            <td rowSpan={8} style={{ ...labelCell, writingMode: 'vertical-rl', letterSpacing: 3 }}>
              所属部门工作交接
            </td>
            <td colSpan={3} style={{ ...cell, fontWeight: 600 }}>
              交接项目（请另附纸质详细交接清单）
            </td>
            <td style={labelCell}>接收人</td>
            <td style={labelCell}>办理日期</td>
          </tr>
          <tr>
            <td colSpan={3} style={cell}>
              <div style={{ fontWeight: 600, marginBottom: 2 }}>工作交接</div>
              <div style={{ whiteSpace: 'pre-wrap', minHeight: 24 }}>
                {record.deptHandover.workHandover}
              </div>
            </td>
            <td rowSpan={3} style={{ ...cell, textAlign: 'center' }}>
              {record.deptHandover.receiver}
            </td>
            <td rowSpan={3} style={{ ...cell, textAlign: 'center' }}>
              {formatDate(record.deptHandover.handleDate)}
            </td>
          </tr>
          <tr>
            <td colSpan={3} style={cell}>
              <div style={{ fontWeight: 600, marginBottom: 2 }}>资料用品移交</div>
              <div style={{ whiteSpace: 'pre-wrap', minHeight: 24 }}>
                {record.deptHandover.materialsHandover}
              </div>
            </td>
          </tr>
          <tr>
            <td colSpan={3} style={cell}>
              <div style={{ fontWeight: 600, marginBottom: 2 }}>未完及代办事项</div>
              <div style={{ whiteSpace: 'pre-wrap', minHeight: 24 }}>
                {record.deptHandover.pendingItems}
              </div>
            </td>
          </tr>
          <tr>
            <td colSpan={5} style={cell}>
              <span style={{ marginRight: 24 }}>
                {check(record.deptHandover.workCompleted)}工作交接完毕
              </span>
              <span>{check(record.deptHandover.noIssues)}无遗留问题</span>
            </td>
          </tr>
          <tr>
            <td colSpan={5} style={cell}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>部门负责人确认</div>
              <div style={{ textAlign: 'right' }}>
                签字：{record.deptHandover.managerSign || '________'}
                <span style={{ marginLeft: 24 }}>
                  日期：{formatDate(record.deptHandover.managerDate) || '________'}
                </span>
              </div>
            </td>
          </tr>
          <tr>
            <td colSpan={5} style={cell}>
              该同事在岗工作时间至{record.deptHandover.lastMonth || '____'}月
              {record.deptHandover.lastDay || '____'}日止，请按此时间计薪。
              <div style={{ textAlign: 'right' }}>
                签字：{record.deptHandover.salarySign || '________'}
                <span style={{ marginLeft: 24 }}>
                  日期：{formatDate(record.deptHandover.salaryDate) || '________'}
                </span>
              </div>
            </td>
          </tr>

          <tr>
            <td rowSpan={2} style={{ ...labelCell, writingMode: 'vertical-rl', letterSpacing: 3 }}>
              神藏司
            </td>
            <td colSpan={5} style={cell}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>出纳</div>
              <div>
                有无公司欠款：{check(!record.financeHandover.hasDebt)}无{' '}
                {check(record.financeHandover.hasDebt)}有，金额：人民币
                {record.financeHandover.debtAmount ?? '________'}元
              </div>
              <div>
                未报销票据是否提交：{check(!record.financeHandover.receiptSubmitted)}未提交{' '}
                {check(record.financeHandover.receiptSubmitted)}已提交，票据
                {record.financeHandover.receiptCount ?? '________'}张
              </div>
              <div>财务类物品交接：{record.financeHandover.financeItems || ''}</div>
              <div style={{ textAlign: 'right', marginTop: 4 }}>
                签字：{record.financeHandover.cashierSign || '________'}
                <span style={{ marginLeft: 24 }}>
                  日期：{formatDate(record.financeHandover.cashierDate) || '________'}
                </span>
              </div>
            </td>
          </tr>
          <tr>
            <td colSpan={5} style={cell}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>部门负责人确认</div>
              <span style={{ marginRight: 24 }}>
                {check(record.financeHandover.accountCleared)}相关财务账款已清
              </span>
              <span>{check(record.financeHandover.itemsCompleted)}财务类物品交接完毕</span>
              <div style={{ textAlign: 'right', marginTop: 4 }}>
                签字：{record.financeHandover.managerSign || '________'}
                <span style={{ marginLeft: 24 }}>
                  日期：{formatDate(record.financeHandover.managerDate) || '________'}
                </span>
              </div>
            </td>
          </tr>

          <tr>
            <td rowSpan={3} style={{ ...labelCell, writingMode: 'vertical-rl', letterSpacing: 3 }}>
              人事行政部
            </td>
            <td colSpan={3} style={{ ...cell, fontWeight: 600, fontSize: 11 }}>
              交接项目（如交接内容较多，请另附工作交接表）
            </td>
            <td style={labelCell}>接收人签字</td>
            <td style={labelCell}>办理日期</td>
          </tr>
          <tr>
            <td colSpan={3} style={cell}>
              <div>固定资产：{record.hrHandover.fixedAssets}</div>
              <div>办公用品：{record.hrHandover.officeSupplies}</div>
              <div>指纹、QQ群：{record.hrHandover.fingerprint}</div>
              <div>五险：{record.hrHandover.insurance}</div>
            </td>
            <td style={{ ...cell, textAlign: 'center' }}>{record.hrHandover.receiver}</td>
            <td style={{ ...cell, textAlign: 'center' }}>
              {formatDate(record.hrHandover.handleDate)}
            </td>
          </tr>
          <tr>
            <td colSpan={5} style={cell}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>部门负责人确认</div>
              <span style={{ marginRight: 16 }}>
                {check(record.hrHandover.completed)}交接手续已完成，无遗留问题
              </span>
              <span>
                {check(record.hrHandover.salaryNormal)}可以正常发放工资，薪资截止日为：
                {record.hrHandover.salaryEndYear || '____'}年
                {record.hrHandover.salaryEndMonth || '____'}月
                {record.hrHandover.salaryEndDay || '____'}日
              </span>
              <div style={{ textAlign: 'right', marginTop: 4 }}>
                签字：{record.hrHandover.managerSign || '________'}
                <span style={{ marginLeft: 24 }}>
                  日期：{formatDate(record.hrHandover.managerDate) || '________'}
                </span>
              </div>
            </td>
          </tr>

          <tr>
            <td colSpan={6} style={{ ...cell, background: '#fffbe6', fontWeight: 600 }}>
              {record.principalSignRequired
                ? '离职人员办理好所有手续后，需经中心校长签字确认，方为离职交接手续完毕。'
                : '当前所属神殿、部门或岗位无需校长签字。'}
            </td>
          </tr>
          <tr>
            <td colSpan={6} style={cell}>
              <span style={{ marginRight: 24 }}>
                {check(record.allCompleted)}离职交接手续办理完毕
              </span>
              <span style={{ marginRight: 24 }}>
                校长签字：{record.principalSignRequired ? record.principalSign || '________' : '无需签字'}
              </span>
              <span>
                日期：{record.principalSignRequired ? formatDate(record.principalDate) || '________' : '-'}
              </span>
            </td>
          </tr>

          {record.approvalFlow.some((item) => item.stage === 'department_head')
            ? renderApprovalRow('部门负责人意见', flowMap.department_head)
            : null}
          {record.approvalFlow.some((item) => item.stage === 'operations_reviewer')
            ? renderApprovalRow('最高议事厅运营部总监意见', flowMap.operations_reviewer)
            : null}
          {record.approvalFlow.some((item) => item.stage === 'academic_reviewer')
            ? renderApprovalRow('最高议事厅智慧司总监意见', flowMap.academic_reviewer)
            : null}
          {record.approvalFlow.some((item) => item.stage === 'teaching_quality_reviewer')
            ? renderApprovalRow('最高议事厅教化司总监意见', flowMap.teaching_quality_reviewer)
            : null}
          {record.approvalFlow.some((item) => item.stage === 'chairman')
            ? renderApprovalRow('董事长意见', flowMap.chairman)
            : null}
        </tbody>
      </table>
    </div>
  )
}

const WorkHandoverPage: React.FC = () => {
  const { user: currentUser } = useAuthStore()
  const { currentCampus } = useCampusStore()
  const [loading, setLoading] = useState(false)
  const [records, setRecords] = useState<WorkHandoverRecord[]>([])
  const [users, setUsers] = useState<UserPermissionInfo[]>([])
  const [statusFilter, setStatusFilter] = useState<WorkHandoverStatus | undefined>()
  const [keyword, setKeyword] = useState('')
  const [editOpen, setEditOpen] = useState(false)
  const [editLoading, setEditLoading] = useState(false)
  const [editingRecord, setEditingRecord] = useState<WorkHandoverRecord | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailRecord, setDetailRecord] = useState<WorkHandoverRecord | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [printOpen, setPrintOpen] = useState(false)
  const [printRecord, setPrintRecord] = useState<WorkHandoverRecord | null>(null)
  const [printLoading, setPrintLoading] = useState(false)
  const [actionState, setActionState] = useState<{
    open: boolean
    type: 'approve' | 'reject'
    record: WorkHandoverRecord | null
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
        listWorkHandovers({
          campus: activeCampus || undefined,
          status: statusFilter,
        }),
        fetchUserPermissions(),
      ])
      setRecords(list)
      setUsers(campusUsers.filter((item) => item.status === 'active'))
    } catch (error) {
      console.error('加载工作交接表失败', error)
      message.error(getErrorMessage(error, '加载工作交接表失败'))
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

  const openEditModal = (record: WorkHandoverRecord) => {
    setEditingRecord(record)
    setEditOpen(true)
  }

  const handleSave = async (payload: WorkHandoverPayload) => {
    try {
      setEditLoading(true)
      if (editingRecord) {
        await updateWorkHandover(editingRecord.id, payload)
        message.success('工作交接表已更新')
      } else {
        await createWorkHandover(payload)
        message.success('工作交接表已创建')
      }
      setEditOpen(false)
      setEditingRecord(null)
      await loadData()
    } catch (error) {
      message.error(
        getErrorMessage(error, editingRecord ? '更新工作交接表失败' : '创建工作交接表失败'),
      )
    } finally {
      setEditLoading(false)
    }
  }

  const handleDelete = async (record: WorkHandoverRecord) => {
    try {
      await deleteWorkHandover(record.id)
      message.success('工作交接表已删除')
      await loadData()
    } catch (error) {
      message.error(getErrorMessage(error, '删除工作交接表失败'))
    }
  }

  const openDetailModal = async (record: WorkHandoverRecord) => {
    try {
      setDetailLoading(true)
      const detail = await getWorkHandover(record.id)
      setDetailRecord(detail)
      setDetailOpen(true)
    } catch (error) {
      message.error(getErrorMessage(error, '加载详情失败'))
    } finally {
      setDetailLoading(false)
    }
  }

  const openPrintModal = async (record: WorkHandoverRecord) => {
    try {
      setPrintLoading(true)
      const detail = await getWorkHandover(record.id)
      setPrintRecord(detail)
      setPrintOpen(true)
    } catch (error) {
      message.error(getErrorMessage(error, '加载打印详情失败'))
    } finally {
      setPrintLoading(false)
    }
  }

  const handleSubmit = async (record: WorkHandoverRecord) => {
    try {
      await submitWorkHandover(record.id)
      message.success('工作交接表已提交审批')
      await loadData()
    } catch (error) {
      message.error(getErrorMessage(error, '提交工作交接表失败'))
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
        await approveWorkHandover(actionRecord.id, comment.trim() || undefined)
        message.success('审批已通过')
      } else {
        await rejectWorkHandover(actionRecord.id, comment.trim())
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

  const columns: ColumnsType<WorkHandoverRecord> = [
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
      title: '原职务',
      dataIndex: 'position',
      width: 140,
    },
    {
      title: '所属神殿',
      dataIndex: 'campus',
      width: 120,
    },
    {
      title: '离职时间',
      dataIndex: 'leaveDate',
      width: 120,
    },
    {
      title: '当前阶段',
      dataIndex: 'currentStageLabel',
      width: 160,
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
            <Popconfirm title="确认删除该工作交接表？" onConfirm={() => handleDelete(record)}>
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
              <InteractionOutlined style={{ fontSize: 18 }} />
              <Title level={5} style={{ margin: 0 }}>
                工作交接表
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
                placeholder="搜索单号/姓名/部门/职务"
                prefix={<SearchOutlined />}
                style={{ width: 260 }}
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
              <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
                新建工作交接表
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
          locale={{ emptyText: '暂无工作交接表' }}
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
        title="工作交接表打印预览"
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
        width={1000}
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

export default WorkHandoverPage