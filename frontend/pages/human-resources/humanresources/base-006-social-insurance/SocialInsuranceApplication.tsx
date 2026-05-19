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
  PlusOutlined,
  PrinterOutlined,
  SearchOutlined,
  SendOutlined,
} from '@ant-design/icons'
import dayjs, { type Dayjs } from 'dayjs'
import { useCampusStore } from '@/stores/campusStore'
import {
  approveSocialInsuranceApplication,
  createSocialInsuranceApplication,
  deleteSocialInsuranceApplication,
  getSocialInsuranceApplication,
  listSocialInsuranceApplicationsPaged,
  previewSocialInsuranceApproverCandidates,
  rejectSocialInsuranceApplication,
  submitSocialInsuranceApplication,
  type SocialInsuranceApplicationPayload,
  type SocialInsuranceApplicationRecord,
  type SocialInsuranceApprovalActionPayload,
  type SocialInsuranceApprovalPreviewStage,
  type SocialInsuranceStatus,
  updateSocialInsuranceApplication,
} from '@/services/humanresources/socialInsuranceApplication'
import {
  ApproverSelectionSection,
  mergeApproverSelections,
  normalizeSelectedApproverMap,
} from '@/components/human-resources/ApproverSelectionSection'
import {
  fetchCampuses,
  fetchCampusOptions,
  fetchUserPermissions,
  type UserPermissionInfo,
} from '@/services/configMaster'

const { Text, Title } = Typography
const { TextArea } = Input

const STATUS_COLOR_MAP: Record<string, string> = {
  draft: 'default',
  pending: 'processing',
  approved: 'success',
  rejected: 'error',
}

const HOUSEHOLD_OPTIONS = ['本市城镇', '外埠城镇', '本市农业', '外埠农业']
const INSURANCE_TYPE_OPTIONS = [
  { label: '五险', value: '五险', desc: '养老、失业、工伤、医疗、生育' },
  { label: '三险', value: '三险', desc: '养老、失业、工伤' },
]
const MANAGEMENT_CENTER_ALIASES = ['最高议事厅', '最高议事厅神殿']

const isManagementCampus = (value?: string | null) =>
  typeof value === 'string' && MANAGEMENT_CENTER_ALIASES.some((alias) => value.includes(alias))

const getActionLabel = (value?: string | null) => {
  const actionMap: Record<string, string> = {
    submit: '提交',
    approve: '通过',
    reject: '驳回',
  }
  return actionMap[value || ''] || value || '-'
}

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

const mergeCampusOptions = (
  currentCampus: string | undefined,
  configCampuses: Array<{ name: string }> = [],
  campusOptions: string[] = [],
) => {
  const values = new Set<string>()
  configCampuses.forEach((item) => item?.name && values.add(item.name))
  campusOptions.forEach((item) => item && values.add(item))
  if (currentCampus) {
    values.add(currentCampus)
  }
  MANAGEMENT_CENTER_ALIASES.forEach((item) => values.add(item))
  return Array.from(values).sort((a, b) => a.localeCompare(b, 'zh-CN'))
}

const getStageDecision = (
  record: SocialInsuranceApplicationRecord,
  stage: 'department_head' | 'hr' | 'principal' | 'chairman',
) => {
  const action = [...record.approvalActions]
    .reverse()
    .find((item) => item.stage === stage && ['approve', 'reject'].includes(item.action))

  const commentMap: Record<string, string | undefined | null> = {
    department_head: record.deptManagerOpinion,
    hr: record.hrOpinion,
    principal: record.principalOpinion,
    chairman: record.chairmanOpinion,
  }

  if (action) {
    return {
      opinion: action.comment || commentMap[stage] || '',
      status: action.action === 'approve' ? '已同意' : '已拒绝',
      approver: action.approverName || '',
      date: action.createdAt || '',
    }
  }

  if (record.status === 'pending' && record.currentStage === stage) {
    return {
      opinion: commentMap[stage] || '',
      status: '待审批',
      approver: record.currentApprovers.map((item) => item.name).join('、'),
      date: '',
    }
  }

  return {
    opinion: commentMap[stage] || '',
    status: '',
    approver: '',
    date: '',
  }
}

const hasStage = (record: SocialInsuranceApplicationRecord, stage: string) =>
  record.approvalFlow.some((item) => item.stage === stage)

const isDirectChairmanFlowRecord = (record: SocialInsuranceApplicationRecord) =>
  record.approvalFlow.length === 1 && record.approvalFlow[0]?.stage === 'chairman'

interface EditModalProps {
  open: boolean
  loading: boolean
  campus?: string
  campusOptions: string[]
  users: UserPermissionInfo[]
  editingRecord: SocialInsuranceApplicationRecord | null
  onCancel: () => void
  onOk: (payload: SocialInsuranceApplicationPayload) => Promise<void>
}

const EditModal: React.FC<EditModalProps> = ({
  open,
  loading,
  campus,
  campusOptions,
  users,
  editingRecord,
  onCancel,
  onOk,
}) => {
  const [form] = Form.useForm()
  const selectedCampus = Form.useWatch('campus', form)
  const selectedDepartment = Form.useWatch('department', form)
  const selectedPosition = Form.useWatch('position', form)
  const isEdit = !!editingRecord
  const [approverPreview, setApproverPreview] = useState<SocialInsuranceApprovalPreviewStage[]>([])
  const [approverPreviewLoading, setApproverPreviewLoading] = useState(false)

  const filteredUsers = useMemo(() => {
    if (!selectedCampus) return users
    if (isManagementCampus(selectedCampus)) {
      return users.filter((item) => !item.campus || isManagementCampus(item.campus))
    }
    return users.filter((item) => !item.campus || item.campus === selectedCampus)
  }, [selectedCampus, users])

  const departmentOptions = useMemo(
    () =>
      Array.from(
        new Set<string>(
          filteredUsers
            .map((item) => item.department?.trim())
            .filter((item): item is string => !!item),
        ),
      ).sort((a, b) => a.localeCompare(b, 'zh-CN')),
    [filteredUsers],
  )

  const positionOptions = useMemo(() => {
    const normalizedDepartment =
      typeof selectedDepartment === 'string' ? selectedDepartment.trim() : ''
    const scopedUsers = normalizedDepartment
      ? filteredUsers.filter((item) => item.department?.trim() === normalizedDepartment)
      : filteredUsers

    return Array.from(
      new Set<string>(
        scopedUsers.map((item) => item.position?.trim()).filter((item): item is string => !!item),
      ),
    ).sort((a, b) => a.localeCompare(b, 'zh-CN'))
  }, [filteredUsers, selectedDepartment])

  useEffect(() => {
    if (!open) return
    if (editingRecord) {
      form.setFieldsValue({
        fillDate: editingRecord.fillDate ? dayjs(editingRecord.fillDate) : undefined,
        campus: editingRecord.campus || campus,
        accountNo: editingRecord.accountNo,
        name: editingRecord.name,
        department: editingRecord.department,
        position: editingRecord.position,
        phone: editingRecord.phone,
        idNumber: editingRecord.idNumber,
        householdType: editingRecord.householdType,
        idExpiry: editingRecord.idExpiry ? dayjs(editingRecord.idExpiry) : undefined,
        hireDate: editingRecord.hireDate ? dayjs(editingRecord.hireDate) : undefined,
        registeredAddress: editingRecord.registeredAddress,
        prevPaymentPlace: editingRecord.prevPaymentPlace,
        prevPaymentType: editingRecord.prevPaymentType,
        prevPaymentBase: editingRecord.prevPaymentBase,
        insuranceType: editingRecord.insuranceType,
        remark: editingRecord.remark,
        selectedApproverUserIds: editingRecord.selectedApproverUserIds || {},
      })
      return
    }

    form.resetFields()
    form.setFieldsValue({
      fillDate: dayjs(),
      campus: campus || campusOptions.find((item) => isManagementCampus(item)) || '最高议事厅神殿',
      insuranceType: '五险',
      selectedApproverUserIds: {},
    })
  }, [campus, campusOptions, editingRecord, form, open])

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
    previewSocialInsuranceApproverCandidates({
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
        console.error('加载社保审批人预填写失败', error)
        message.error(getErrorMessage(error, '加载社保审批人预填写失败'))
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
      accountNo: values.accountNo,
      name: values.name,
      department: values.department,
      position: values.position,
      phone: values.phone,
      idNumber: values.idNumber,
      householdType: values.householdType,
      idExpiry: (values.idExpiry as Dayjs).format('YYYY-MM-DD'),
      hireDate: (values.hireDate as Dayjs).format('YYYY-MM-DD'),
      registeredAddress: values.registeredAddress,
      prevPaymentPlace: values.prevPaymentPlace,
      prevPaymentType: values.prevPaymentType,
      prevPaymentBase: values.prevPaymentBase,
      insuranceType: values.insuranceType,
      remark: values.remark,
      selectedApproverUserIds: normalizeSelectedApproverMap(values.selectedApproverUserIds),
    })
  }

  return (
    <Modal
      title={isEdit ? '编辑员工社保办理申请表' : '新增员工社保办理申请表'}
      open={open}
      onCancel={onCancel}
      onOk={handleSubmit}
      okText="保存草稿"
      cancelText="取消"
      confirmLoading={loading}
      width={960}
      destroyOnClose
      styles={{ body: { maxHeight: '72vh', overflowY: 'auto' } }}
    >
      <Form form={form} layout="vertical">
        <Card size="small" title="表头信息" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="fillDate"
                label="填单日期"
                rules={[{ required: true, message: '请选择填单日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="campus"
                label="所属神殿"
                rules={[{ required: true, message: '请选择所属神殿' }]}
              >
                <Select
                  showSearch
                  placeholder="请选择所属神殿"
                  options={campusOptions.map((item) => ({ label: item, value: item }))}
                  optionFilterProp="label"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="accountNo"
                label="户号"
                rules={[{ required: true, message: '请填写户号' }]}
              >
                <Input placeholder="社保户号" />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Card size="small" title="员工个人填写" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请填写姓名' }]}>
                <Input placeholder="请填写姓名" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="department"
                label="部门"
                rules={[{ required: true, message: '请填写部门' }]}
              >
                <AutoComplete
                  options={departmentOptions.map((item) => ({ value: item }))}
                  placeholder="可选择已有部门或自定义填写"
                  filterOption={(inputValue, option) =>
                    String(option?.value || '').toLowerCase().includes(inputValue.toLowerCase())
                  }
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="position"
                label="职位"
                rules={[{ required: true, message: '请填写职位' }]}
              >
                <AutoComplete
                  options={positionOptions.map((item) => ({ value: item }))}
                  placeholder="可选择已有职位或自定义填写"
                  filterOption={(inputValue, option) =>
                    String(option?.value || '').toLowerCase().includes(inputValue.toLowerCase())
                  }
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="手机号（本人名下）"
                rules={[{ required: true, message: '请填写手机号' }]}
              >
                <Input placeholder="本人名下手机号" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="idNumber"
                label="身份证号"
                rules={[{ required: true, message: '请填写身份证号' }]}
              >
                <Input placeholder="18位身份证号" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="householdType"
                label="户口性质"
                rules={[{ required: true, message: '请选择户口性质' }]}
              >
                <Select
                  options={HOUSEHOLD_OPTIONS.map((item) => ({ label: item, value: item }))}
                  placeholder="请选择"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="idExpiry"
                label="身份证有效期"
                rules={[{ required: true, message: '请填写身份证有效期' }]}
              >
                <DatePicker style={{ width: '100%' }} placeholder="请选择身份证有效期" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="hireDate"
                label="入职时间"
                rules={[{ required: true, message: '请选择入职时间' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="registeredAddress"
            label="户籍所在地"
            rules={[{ required: true, message: '请填写户籍所在地' }]}
            extra="精确到市即可，无需填写详细到区县或街道。"
          >
            <Input placeholder="请填写到市，例如：石家庄市" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="prevPaymentPlace" label="原缴费地">
                <Input placeholder="原缴费地（无则留空）" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="prevPaymentType" label="原缴费类型">
                <Input placeholder="原缴费类型" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="prevPaymentBase" label="原缴费基数">
                <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="insuranceType"
            label="缴费类型"
            rules={[{ required: true, message: '请选择缴费类型' }]}
          >
            <Radio.Group>
              {INSURANCE_TYPE_OPTIONS.map((item) => (
                <Radio key={item.value} value={item.value}>
                  {item.label}
                  <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                    （{item.desc}）
                  </Text>
                </Radio>
              ))}
            </Radio.Group>
          </Form.Item>
        </Card>

        <Card size="small" title="备注信息">
          <Form.Item name="remark" label="备注">
            <TextArea rows={3} placeholder="可选备注" />
          </Form.Item>
        </Card>

        <ApproverSelectionSection
          previewStages={approverPreview}
          loading={approverPreviewLoading}
          title="审批人预填写"
          description="社保申请会优先读取配置中心默认模板；未命中模板时，系统会按神殿、部门、职位预填写部门主管，再进入人事部，最后流转到校长或董事长。"
          emptyText="请先确认所属神殿、部门和职位，系统会自动预填写审批环节。"
        />
      </Form>
    </Modal>
  )
}

interface ApprovalModalProps {
  open: boolean
  loading: boolean
  type: 'approve' | 'reject'
  record: SocialInsuranceApplicationRecord | null
  onCancel: () => void
  onOk: (payload: SocialInsuranceApprovalActionPayload) => Promise<void>
}

const ApprovalModal: React.FC<ApprovalModalProps> = ({
  open,
  loading,
  type,
  record,
  onCancel,
  onOk,
}) => {
  const [form] = Form.useForm()
  const isHrStage = record?.currentStage === 'hr'

  useEffect(() => {
    if (!open) return
    form.resetFields()
    form.setFieldsValue({
      comment: type === 'approve' ? '通过' : '',
    })
  }, [form, open, type])

  const handleSubmit = async () => {
    const values = await form.validateFields()
    await onOk({
      comment: values.comment,
      hrPaymentContent: values.hrPaymentContent,
      hrPaymentBase: values.hrPaymentBase,
      hrStartDate: values.hrStartDate ? (values.hrStartDate as Dayjs).format('YYYY-MM-DD') : undefined,
      hrInsurancePlace: values.hrInsurancePlace,
    })
  }

  return (
    <Modal
      title={type === 'approve' ? '审批通过' : '驳回申请'}
      open={open}
      onCancel={onCancel}
      onOk={handleSubmit}
      okText={type === 'approve' ? '确认通过' : '确认驳回'}
      cancelText="取消"
      confirmLoading={loading}
      destroyOnClose
      width={isHrStage && type === 'approve' ? 760 : 520}
    >
      <Form form={form} layout="vertical">
        {isHrStage && type === 'approve' ? (
          <>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="hrPaymentContent"
                  label="缴费内容"
                  rules={[{ required: true, message: '请填写缴费内容' }]}
                >
                  <Input placeholder="如：养老、失业、工伤、医疗、生育" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="hrPaymentBase"
                  label="缴费基数"
                  rules={[{ required: true, message: '请填写缴费基数' }]}
                >
                  <InputNumber min={0} style={{ width: '100%' }} placeholder="如 4500" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="hrStartDate"
                  label="缴费起始日期"
                  rules={[{ required: true, message: '请选择缴费起始日期' }]}
                >
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="hrInsurancePlace"
                  label="社保办理地"
                  rules={[{ required: true, message: '请填写社保办理地' }]}
                >
                  <Input placeholder="如 石家庄市" />
                </Form.Item>
              </Col>
            </Row>
          </>
        ) : null}
        <Form.Item
          name="comment"
          label={type === 'approve' ? '审批意见' : '驳回原因'}
          rules={type === 'reject' ? [{ required: true, message: '请填写驳回原因' }] : undefined}
        >
          <TextArea rows={4} placeholder={type === 'approve' ? '审批意见（可选）' : '请填写驳回原因'} />
        </Form.Item>
      </Form>
    </Modal>
  )
}

interface DetailModalProps {
  open: boolean
  record: SocialInsuranceApplicationRecord | null
  onCancel: () => void
}

const DetailModal: React.FC<DetailModalProps> = ({ open, record, onCancel }) => {
  if (!record) return null
  const hasHrStage = hasStage(record, 'hr')
  return (
    <Modal title="社保申请详情" open={open} onCancel={onCancel} footer={null} width={980}>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Descriptions
          bordered
          size="small"
          column={2}
          items={[
            { key: 'applicationNo', label: '申请单号', children: record.applicationNo },
            { key: 'status', label: '状态', children: record.statusLabel },
            { key: 'campus', label: '所属神殿', children: record.campus },
            { key: 'creator', label: '申请人', children: record.createdByName || '-' },
            { key: 'fillDate', label: '填单日期', children: record.fillDate },
            { key: 'accountNo', label: '户号', children: record.accountNo || '-' },
            { key: 'name', label: '姓名', children: record.name },
            { key: 'department', label: '部门', children: record.department },
            { key: 'position', label: '职位', children: record.position },
            { key: 'phone', label: '手机号', children: record.phone },
            { key: 'idNumber', label: '身份证号', children: record.idNumber, span: 2 },
            { key: 'householdType', label: '户口性质', children: record.householdType },
            { key: 'idExpiry', label: '身份证有效期', children: record.idExpiry },
            { key: 'hireDate', label: '入职时间', children: record.hireDate },
            { key: 'insuranceType', label: '缴费类型', children: record.insuranceType },
            { key: 'registeredAddress', label: '户籍所在地', children: record.registeredAddress, span: 2 },
            { key: 'prevPlace', label: '原缴费地', children: record.prevPaymentPlace || '-' },
            { key: 'prevType', label: '原缴费类型', children: record.prevPaymentType || '-' },
            {
              key: 'prevBase',
              label: '原缴费基数',
              children: record.prevPaymentBase != null ? String(record.prevPaymentBase) : '-',
            },
            {
              key: 'currentApprovers',
              label: '当前审批人',
              children: record.currentApprovers.length
                ? record.currentApprovers.map((item) => item.name).join('、')
                : '-',
              span: 2,
            },
            ...(hasHrStage
              ? [
                  {
                    key: 'hrPaymentContent',
                    label: '人事部缴费内容',
                    children: record.hrPaymentContent || '-',
                    span: 2,
                  },
                  {
                    key: 'hrFinance',
                    label: '人事部办理信息',
                    children: `缴费基数：${record.hrPaymentBase ?? '-'} / 缴费起始日期：${record.hrStartDate || '-'} / 社保办理地：${record.hrInsurancePlace || '-'}`,
                    span: 2,
                  },
                ]
              : []),
            { key: 'remark', label: '备注', children: record.remark || '-', span: 2 },
            {
              key: 'rejectionReason',
              label: '驳回原因',
              children: record.rejectionReason || '-',
              span: 2,
            },
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

interface PrintPreviewModalProps {
  open: boolean
  record: SocialInsuranceApplicationRecord | null
  onCancel: () => void
}

const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({ open, record, onCancel }) => {
  if (!record) return null

  const handlePrint = () => window.print()
  const cellStyle: React.CSSProperties = {
    padding: '8px 10px',
    border: '1px solid #d9d9d9',
    fontSize: 13,
    verticalAlign: 'middle',
  }
  const labelStyle: React.CSSProperties = {
    ...cellStyle,
    fontWeight: 'bold',
    background: '#fafafa',
    textAlign: 'center',
    whiteSpace: 'nowrap',
    width: 120,
  }
  const sectionLabelStyle: React.CSSProperties = {
    ...cellStyle,
    fontWeight: 'bold',
    background: '#fafafa',
    textAlign: 'center',
    width: 120,
    verticalAlign: 'middle',
  }
  const approvalCellStyle: React.CSSProperties = {
    ...cellStyle,
    minHeight: 60,
    height: 60,
  }

  const renderApproval = (node: { opinion: string; status: string; approver: string; date: string }) => {
    if (!node.status && !node.opinion) {
      return <span style={{ color: '#bbb' }}>（待审批）</span>
    }
    return (
      <div>
        {node.opinion && <div>{node.opinion}</div>}
        {node.status ? (
          <Tag
            color={
              node.status === '已同意' ? 'green' : node.status === '已拒绝' ? 'red' : 'gold'
            }
            style={{ marginTop: 4 }}
          >
            {node.status}
          </Tag>
        ) : null}
        {node.approver ? (
          <div style={{ marginTop: 4, fontSize: 12, color: '#888' }}>
            {node.approver} {node.date}
          </div>
        ) : null}
      </div>
    )
  }

  const householdSymbol = () =>
    HOUSEHOLD_OPTIONS.map((item) =>
      item === record.householdType ? `■${item}` : `□${item}`,
    ).join('  ')

  const isDirectChairmanFlow = isDirectChairmanFlowRecord(record)
  const hasDepartmentHeadStage = hasStage(record, 'department_head')
  const hasHrStage = hasStage(record, 'hr')
  const hasChairmanStage = hasStage(record, 'chairman')
  const finalStage = hasChairmanStage ? 'chairman' : 'principal'
  const finalStageTitle = hasChairmanStage ? '董事长审批' : '校长审批'
  const deptDecision = hasDepartmentHeadStage ? getStageDecision(record, 'department_head') : null
  const hrDecision = hasHrStage ? getStageDecision(record, 'hr') : null
  const finalDecision = getStageDecision(record, finalStage)

  return (
    <Modal
      title="打印预览 - 员工社保办理申请表"
      open={open}
      onCancel={onCancel}
      width={960}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          关闭
        </Button>,
        <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>
          打印
        </Button>,
      ]}
    >
      <div style={{ padding: '0 8px' }}>
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <Title level={3} style={{ margin: 0 }}>
            员工社保办理申请表
          </Title>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 12,
            fontSize: 13,
          }}
        >
          <span>
            <Text strong>填单日期：</Text>
            {record.fillDate}
          </span>
          <span>
            <Text strong>所属神殿：</Text>
            {record.campus}
          </span>
          <span>
            <Text strong>户号：</Text>
            {record.accountNo || '-'}
          </span>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid #333' }}>
          <tbody>
            <tr>
              <td style={sectionLabelStyle} rowSpan={7}>
                <Text strong>员工个人填写</Text>
              </td>
              <td style={labelStyle}>姓名</td>
              <td style={cellStyle}>{record.name}</td>
              <td style={labelStyle}>部门</td>
              <td style={cellStyle}>{record.department}</td>
              <td style={labelStyle}>职位</td>
              <td style={cellStyle}>{record.position}</td>
            </tr>
            <tr>
              <td style={labelStyle}>手机号（本人名下）</td>
              <td style={cellStyle}>{record.phone}</td>
              <td style={labelStyle}>身份证号</td>
              <td style={cellStyle} colSpan={3}>
                {record.idNumber}
              </td>
            </tr>
            <tr>
              <td style={labelStyle}>户口性质</td>
              <td style={cellStyle}>{householdSymbol()}</td>
              <td style={labelStyle}>身份证有效期</td>
              <td style={cellStyle} colSpan={3}>
                {record.idExpiry}
              </td>
            </tr>
            <tr>
              <td style={labelStyle}>入职时间</td>
              <td style={cellStyle}>{record.hireDate}</td>
              <td style={labelStyle}>户籍所在地</td>
              <td style={cellStyle} colSpan={3}>
                {record.registeredAddress}
              </td>
            </tr>
            <tr>
              <td style={labelStyle}>原缴费地</td>
              <td style={cellStyle}>{record.prevPaymentPlace || '-'}</td>
              <td style={labelStyle}>原缴费类型</td>
              <td style={cellStyle}>{record.prevPaymentType || '-'}</td>
              <td style={labelStyle}>原缴费基数</td>
              <td style={cellStyle}>{record.prevPaymentBase != null ? record.prevPaymentBase : '-'}</td>
            </tr>
            <tr>
              <td style={labelStyle} rowSpan={2}>
                缴费类型
              </td>
              <td style={cellStyle} colSpan={2}>
                {record.insuranceType === '五险' ? '■' : '□'} 五险
              </td>
              <td style={cellStyle} colSpan={4}>
                {record.insuranceType === '三险' ? '■' : '□'} 三险
              </td>
            </tr>
            <tr>
              <td style={{ ...cellStyle, fontSize: 12, color: '#666' }} colSpan={2}>
                养老、失业、工伤、医疗、生育
              </td>
              <td style={{ ...cellStyle, fontSize: 12, color: '#666' }} colSpan={4}>
                养老、失业、工伤
              </td>
            </tr>
            {hasDepartmentHeadStage || hasHrStage ? (
              <>
                {hasDepartmentHeadStage ? (
                  <tr style={{ borderTop: '2px solid #333' }}>
                    <td style={sectionLabelStyle}>
                      <Text strong>部门主管审批</Text>
                    </td>
                    <td style={labelStyle}>部门主管意见</td>
                    <td style={approvalCellStyle} colSpan={5}>
                      {deptDecision ? renderApproval(deptDecision) : null}
                    </td>
                  </tr>
                ) : null}
                {hasHrStage ? (
                  <>
                    <tr style={{ borderTop: '2px solid #333' }}>
                      <td style={sectionLabelStyle} rowSpan={3}>
                        <Text strong>人事部审批</Text>
                      </td>
                      <td style={labelStyle}>缴费内容</td>
                      <td style={cellStyle} colSpan={2}>
                        {record.hrPaymentContent || '-'}
                      </td>
                      <td style={labelStyle}>缴费基数</td>
                      <td style={cellStyle} colSpan={2}>
                        {record.hrPaymentBase ?? '-'}
                      </td>
                    </tr>
                    <tr>
                      <td style={labelStyle}>缴费起始日期</td>
                      <td style={cellStyle} colSpan={2}>
                        {record.hrStartDate || '-'}
                      </td>
                      <td style={labelStyle}>社保办理地</td>
                      <td style={cellStyle} colSpan={2}>
                        {record.hrInsurancePlace || '-'}
                      </td>
                    </tr>
                    <tr>
                      <td style={labelStyle}>人事部意见</td>
                      <td style={approvalCellStyle} colSpan={5}>
                        {hrDecision ? renderApproval(hrDecision) : null}
                      </td>
                    </tr>
                  </>
                ) : null}
              </>
            ) : null}
            <tr style={{ borderTop: '2px solid #333' }}>
              <td style={sectionLabelStyle}>
                <Text strong>{finalStageTitle}</Text>
              </td>
              <td style={labelStyle}>{finalStageTitle}意见</td>
              <td style={approvalCellStyle} colSpan={5}>
                {renderApproval(finalDecision)}
              </td>
            </tr>
          </tbody>
        </table>
        <div style={{ marginTop: 12, fontSize: 13, color: '#666' }}>
          <Text strong>备注：</Text>
          {'默认按部门主管规则命中后进入人事部审批，最高议事厅最终走董事长审批，各分校最终走校长审批。'}
          {record.remark ? (
            <>
              <br />
              {record.remark}
            </>
          ) : null}
        </div>
      </div>
    </Modal>
  )
}

const SocialInsuranceApplication: React.FC = () => {
  const { currentCampus } = useCampusStore()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [records, setRecords] = useState<SocialInsuranceApplicationRecord[]>([])
  const [users, setUsers] = useState<UserPermissionInfo[]>([])
  const [campusOptions, setCampusOptions] = useState<string[]>([])
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<SocialInsuranceApplicationRecord | null>(null)
  const [detailRecord, setDetailRecord] = useState<SocialInsuranceApplicationRecord | null>(null)
  const [printRecord, setPrintRecord] = useState<SocialInsuranceApplicationRecord | null>(null)
  const [statusFilter, setStatusFilter] = useState<SocialInsuranceStatus>()
  const [searchText, setSearchText] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [actionRecord, setActionRecord] = useState<SocialInsuranceApplicationRecord | null>(null)
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve')
  const [actionModalOpen, setActionModalOpen] = useState(false)

  const loadBaseOptions = useCallback(async () => {
    const [campusProfiles, campusList, userList] = await Promise.all([
      fetchCampuses(),
      fetchCampusOptions(),
      fetchUserPermissions(),
    ])
    setCampusOptions(mergeCampusOptions(currentCampus, campusProfiles, campusList))
    setUsers(userList.filter((item) => item.status === 'active'))
  }, [currentCampus])

  const loadRecords = useCallback(async () => {
    try {
      setLoading(true)
      const data = await listSocialInsuranceApplicationsPaged({
        campus: currentCampus || undefined,
        status: statusFilter,
        search: searchText.trim() || undefined,
        page: currentPage,
        pageSize,
      })
      setRecords(data.items)
      setTotal(data.total)
    } catch (error) {
      console.error('加载社保申请失败', error)
      message.error(getErrorMessage(error, '加载社保申请失败'))
    } finally {
      setLoading(false)
    }
  }, [currentCampus, statusFilter, searchText, currentPage, pageSize])

  useEffect(() => {
    loadBaseOptions()
  }, [loadBaseOptions])

  useEffect(() => {
    loadRecords()
  }, [loadRecords])

  const refreshRecordDetail = useCallback(async (recordId: number) => {
    const detail = await getSocialInsuranceApplication(recordId)
    return detail
  }, [])

  const openCreate = () => {
    setEditingRecord(null)
    setEditModalOpen(true)
  }

  const openEdit = async (record: SocialInsuranceApplicationRecord) => {
    try {
      const detail = await refreshRecordDetail(record.id)
      setEditingRecord(detail)
      setEditModalOpen(true)
    } catch (error) {
      message.error(getErrorMessage(error, '加载申请详情失败'))
    }
  }

  const openDetail = async (record: SocialInsuranceApplicationRecord) => {
    try {
      const detail = await refreshRecordDetail(record.id)
      setDetailRecord(detail)
    } catch (error) {
      message.error(getErrorMessage(error, '加载申请详情失败'))
    }
  }

  const openPrint = async (record: SocialInsuranceApplicationRecord) => {
    try {
      const detail = await refreshRecordDetail(record.id)
      setPrintRecord(detail)
    } catch (error) {
      message.error(getErrorMessage(error, '加载打印详情失败'))
    }
  }

  const handleSave = async (payload: SocialInsuranceApplicationPayload) => {
    try {
      setSaving(true)
      if (editingRecord) {
        await updateSocialInsuranceApplication(editingRecord.id, payload)
        message.success('社保申请已更新')
      } else {
        await createSocialInsuranceApplication(payload)
        message.success('社保申请已创建')
      }
      setEditModalOpen(false)
      setEditingRecord(null)
      await loadRecords()
    } catch (error) {
      message.error(getErrorMessage(error, '保存社保申请失败'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (record: SocialInsuranceApplicationRecord) => {
    try {
      await deleteSocialInsuranceApplication(record.id)
      message.success('社保申请已删除')
      await loadRecords()
    } catch (error) {
      message.error(getErrorMessage(error, '删除社保申请失败'))
    }
  }

  const handleSubmit = async (record: SocialInsuranceApplicationRecord) => {
    try {
      await submitSocialInsuranceApplication(record.id)
      message.success('社保申请已提交审批')
      await loadRecords()
    } catch (error) {
      message.error(getErrorMessage(error, '提交审批失败'))
    }
  }

  const openActionModal = async (
    type: 'approve' | 'reject',
    record: SocialInsuranceApplicationRecord,
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

  const handleActionSubmit = async (payload: SocialInsuranceApprovalActionPayload) => {
    if (!actionRecord) return
    try {
      setSaving(true)
      if (actionType === 'approve') {
        await approveSocialInsuranceApplication(actionRecord.id, payload)
        message.success('审批已通过')
      } else {
        await rejectSocialInsuranceApplication(actionRecord.id, payload.comment?.trim() || '')
        message.success('审批已驳回')
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

  const columns: ColumnsType<SocialInsuranceApplicationRecord> = [
    {
      title: '申请单号',
      dataIndex: 'applicationNo',
      width: 220,
      fixed: 'left',
    },
    {
      title: '填单日期',
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
      title: '职位',
      dataIndex: 'position',
      width: 120,
    },
    {
      title: '缴费类型',
      dataIndex: 'insuranceType',
      width: 100,
      render: (value) => <Tag color={value === '五险' ? 'blue' : 'cyan'}>{value}</Tag>,
    },
    {
      title: '申请人',
      dataIndex: 'createdByName',
      width: 100,
      render: (value) => value || '-',
    },
    {
      title: '状态',
      width: 120,
      render: (_, record) => (
        <Tag color={STATUS_COLOR_MAP[record.status] || 'default'}>{record.statusLabel}</Tag>
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
        record.currentApprovers.length ? record.currentApprovers.map((item) => item.name).join('、') : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 300,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small" wrap>
          <Tooltip title="详情">
            <Button size="small" type="link" icon={<EyeOutlined />} onClick={() => openDetail(record)} />
          </Tooltip>
          <Tooltip title="打印预览">
            <Button size="small" type="link" icon={<PrinterOutlined />} onClick={() => openPrint(record)} />
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
              <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                新增社保申请
              </Button>
              <Text type="secondary">当前神殿：{currentCampus || '未选择'}</Text>
            </Space>
          </Col>
          <Col>
            <Space>
              <Select
                allowClear
                placeholder="按状态筛选"
                style={{ width: 160 }}
                value={statusFilter}
                onChange={(value) => {
                  setCurrentPage(1)
                  setStatusFilter(value)
                }}
                options={[
                  { label: '草稿', value: 'draft' },
                  { label: '审批中', value: 'pending' },
                  { label: '已通过', value: 'approved' },
                  { label: '已驳回', value: 'rejected' },
                ]}
              />
              <Input
                placeholder="搜索单号/姓名/部门/职位/申请人"
                prefix={<SearchOutlined />}
                allowClear
                style={{ width: 280 }}
                value={searchText}
                onChange={(e) => {
                  setCurrentPage(1)
                  setSearchText(e.target.value)
                }}
              />
            </Space>
          </Col>
        </Row>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={records}
          rowKey="id"
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
          scroll={{ x: 1900 }}
        />
      </Card>

      <EditModal
        open={editModalOpen}
        loading={saving}
        campus={currentCampus}
        campusOptions={campusOptions}
        users={users}
        editingRecord={editingRecord}
        onCancel={() => {
          setEditModalOpen(false)
          setEditingRecord(null)
        }}
        onOk={handleSave}
      />

      <ApprovalModal
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
      <PrintPreviewModal open={!!printRecord} record={printRecord} onCancel={() => setPrintRecord(null)} />
    </div>
  )
}

export default SocialInsuranceApplication
