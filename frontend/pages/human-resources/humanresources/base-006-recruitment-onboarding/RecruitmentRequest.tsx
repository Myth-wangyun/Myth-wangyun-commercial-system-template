import React, { useEffect, useMemo, useState } from 'react'
import {
  App,
  AutoComplete,
  Button,
  Card,
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
import type { ColumnsType } from 'antd/es/table'
import dayjs, { type Dayjs } from 'dayjs'
import { useCampusStore } from '@/stores/campusStore'
import {
  approveRecruitmentRequest,
  createRecruitmentRequest,
  deleteRecruitmentRequest,
  listRecruitmentRequestsPaged,
  previewRecruitmentApproverCandidates,
  rejectRecruitmentRequest,
  submitRecruitmentRequest,
  type RecruitmentApprovalPreviewStage,
  type RecruitmentRequestPayload,
  type RecruitmentRequestRecord,
  updateRecruitmentRequest,
} from '@/services/humanresources/recruitmentRequest'
import {
  ApproverSelectionSection,
  mergeApproverSelections,
  normalizeSelectedApproverMap,
} from '@/components/human-resources/ApproverSelectionSection'
import {
  fetchCampuses,
  fetchCampusOptions,
  fetchEmployeeDepartments,
  fetchEmployeePositions,
  fetchUserPermissions,
  type CampusProfile,
  type UserPermissionInfo,
} from '@/services/configMaster'

const { Text } = Typography
const { TextArea } = Input

const STATUS_COLOR_MAP: Record<string, string> = {
  draft: 'default',
  pending: 'processing',
  approved: 'success',
  rejected: 'error',
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

const MANAGEMENT_CENTER_ALIASES = ['最高议事厅', '最高议事厅神殿', '总部']
const MANAGEMENT_CENTER_FINANCE_POSITIONS = ['神藏司专员', '神藏司总监']
const MANAGEMENT_CENTER_TEACHING_QUALITY_POSITIONS = ['班主任', '教化司副经理', '教化司经理']

const isManagementCampus = (value?: string | null) =>
  typeof value === 'string' && MANAGEMENT_CENTER_ALIASES.some((alias) => value.includes(alias))

/** 无法通过前/后缀规则推断的明确别名映射 */
const CAMPUS_ALIAS_MAP: Record<string, string> = {
  总部: '最高议事厅神殿',
}

const getCampusDisplayScore = (name: string) => {
  let score = name.length
  if (name.includes('神殿')) score += 100
  if (name === '最高议事厅神殿') score += 200
  if (name.includes('最高议事厅')) score += 50
  return score
}

const pickPreferredCampusName = (candidates: string[]) => {
  const uniqueCandidates = Array.from(new Set(candidates.filter(Boolean)))
  return uniqueCandidates.sort((a, b) => {
    const scoreDiff = getCampusDisplayScore(b) - getCampusDisplayScore(a)
    if (scoreDiff !== 0) return scoreDiff
    const lengthDiff = b.length - a.length
    if (lengthDiff !== 0) return lengthDiff
    return a.localeCompare(b, 'zh-CN')
  })[0]
}

const buildCampusAliasMap = (profiles: CampusProfile[]) => {
  const names = Array.from(
    new Set(profiles.map((item) => item.name?.trim()).filter((item): item is string => !!item)),
  )
  const groups = new Map<string, Set<string>>()

  const addToGroup = (groupKey: string, value: string) => {
    const normalizedValue = value.trim()
    if (!normalizedValue) return
    if (!groups.has(groupKey)) {
      groups.set(groupKey, new Set<string>())
    }
    groups.get(groupKey)?.add(normalizedValue)
  }

  MANAGEMENT_CENTER_ALIASES.forEach((alias) => addToGroup('management-center', alias))
  names.filter((name) => isManagementCampus(name)).forEach((name) => addToGroup('management-center', name))

  profiles.forEach((profile) => {
    const shortName = profile.short_name?.trim()
    if (!shortName) return
    const groupKey = `short:${shortName}`
    addToGroup(groupKey, shortName)
    addToGroup(groupKey, `${shortName}神殿`)
    names.filter((name) => name.includes(shortName)).forEach((name) => addToGroup(groupKey, name))
  })

  const aliasMap: Record<string, string> = { ...CAMPUS_ALIAS_MAP }
  names.forEach((name) => {
    aliasMap[name] = name
  })

  groups.forEach((values) => {
    const preferredName = pickPreferredCampusName(Array.from(values))
    values.forEach((value) => {
      aliasMap[value] = preferredName
    })
  })

  return aliasMap
}

/**
 * 将别名/简称归一化为规范全称。
 * 优先级：明确映射 → endsWith 匹配 → startsWith 匹配 → 原样返回。
 * 例如："总部" → "最高议事厅神殿"；"神恩殿" → "广西神恩殿"；"最高议事厅" → "最高议事厅神殿"
 */
const normalizeCampusName = (
  name: string,
  canonicalList: string[],
  aliasMap: Record<string, string> = CAMPUS_ALIAS_MAP,
): string => {
  const normalizedName = name.trim()
  if (!normalizedName) return normalizedName
  if (aliasMap[normalizedName]) return aliasMap[normalizedName]
  if (canonicalList.includes(normalizedName)) return normalizedName
  const endMatch = canonicalList.find((c) => c.endsWith(normalizedName))
  if (endMatch) return endMatch
  const startMatch = canonicalList.find((c) => c.startsWith(normalizedName))
  return startMatch ?? normalizedName
}

interface EditModalProps {
  open: boolean
  loading: boolean
  campus?: string
  editingRecord: RecruitmentRequestRecord | null
  campusOptions: string[]
  departmentOptions: string[]
  positionOptions: string[]
  users: UserPermissionInfo[]
  onCancel: () => void
  onOk: (payload: RecruitmentRequestPayload) => Promise<void>
}

const EditModal: React.FC<EditModalProps> = ({
  open,
  loading,
  campus,
  editingRecord,
  campusOptions,
  departmentOptions: employeeDepartmentOptions,
  positionOptions: employeePositionOptions,
  users,
  onCancel,
  onOk,
}) => {
  const [form] = Form.useForm()
  const isEdit = !!editingRecord
  const hasCandidate = Form.useWatch('hasCandidate', form)
  const selectedCampus = Form.useWatch('campus', form)
  const selectedDepartment = Form.useWatch('department', form)
  const selectedPosition = Form.useWatch('position', form)
  const [approverPreview, setApproverPreview] = useState<RecruitmentApprovalPreviewStage[]>([])
  const [approverPreviewLoading, setApproverPreviewLoading] = useState(false)

  const filteredUsers = useMemo(() => {
    if (!selectedCampus) return users
    if (isManagementCampus(selectedCampus)) {
      return users.filter((item) => !item.campus || isManagementCampus(item.campus))
    }
    return users.filter((item) => item.campus === selectedCampus)
  }, [selectedCampus, users])

  const departmentOptions = useMemo(() => {
    const values = new Set<string>()
    employeeDepartmentOptions.forEach((item) => item && values.add(item.trim()))
    filteredUsers.forEach((item) => item.department?.trim() && values.add(item.department.trim()))
    if (editingRecord?.department) values.add(editingRecord.department.trim())
    return Array.from(values).filter(Boolean).sort((a, b) => a.localeCompare(b, 'zh-CN'))
  }, [editingRecord?.department, employeeDepartmentOptions, filteredUsers])

  const filteredPositionOptions = useMemo(() => {
    if (isManagementCampus(selectedCampus) && selectedDepartment?.trim() === '神藏司') {
      const values = new Set<string>(MANAGEMENT_CENTER_FINANCE_POSITIONS)
      if (editingRecord?.position) values.add(editingRecord.position.trim())
      return Array.from(values).filter(Boolean).sort((a, b) => a.localeCompare(b, 'zh-CN'))
    }

    if (isManagementCampus(selectedCampus) && selectedDepartment?.trim() === '教化司') {
      const values = new Set<string>(MANAGEMENT_CENTER_TEACHING_QUALITY_POSITIONS)
      if (editingRecord?.position) values.add(editingRecord.position.trim())
      return Array.from(values).filter(Boolean).sort((a, b) => a.localeCompare(b, 'zh-CN'))
    }

    const values = new Set<string>()
    employeePositionOptions.forEach((item) => item && values.add(item.trim()))
    filteredUsers.forEach((item) => item.position?.trim() && values.add(item.position.trim()))
    if (editingRecord?.position) values.add(editingRecord.position.trim())
    return Array.from(values).filter(Boolean).sort((a, b) => a.localeCompare(b, 'zh-CN'))
  }, [editingRecord?.position, employeePositionOptions, filteredUsers, selectedDepartment])

  useEffect(() => {
    if (!open) return

    if (editingRecord) {
      form.setFieldsValue({
        campus: normalizeCampusName(editingRecord.campus || campus || '', campusOptions),
        // normalizeCampusName 将历史短名称（如"神恩殿"）自动映射到规范全称（如"广西神恩殿"）
        applyDate: editingRecord.applyDate ? dayjs(editingRecord.applyDate) : undefined,
        department: editingRecord.department,
        position: editingRecord.position,
        headcount: editingRecord.headcount,
        reason: editingRecord.reason,
        expectedDate: editingRecord.expectedDate ? dayjs(editingRecord.expectedDate) : undefined,
        gender: editingRecord.gender || '不限',
        age: editingRecord.age,
        maritalStatus: editingRecord.maritalStatus || '不限',
        education: editingRecord.education || '本科',
        major: editingRecord.major,
        skillsExperience: editingRecord.skillsExperience,
        suggestedSalary: editingRecord.suggestedSalary,
        jobResponsibilities: editingRecord.jobResponsibilities,
        analysisAndReason: editingRecord.analysisAndReason,
        hasCandidate: editingRecord.internalCandidate.hasCandidate,
        candidateDept: editingRecord.internalCandidate.department,
        candidateName: editingRecord.internalCandidate.name,
        selectedApproverUserIds: editingRecord.selectedApproverUserIds || {},
      })
      return
    }

    form.resetFields()
    form.setFieldsValue({
      campus:
        normalizeCampusName(campus || '', campusOptions) ||
        campusOptions.find((item) => isManagementCampus(item)) ||
        '最高议事厅神殿',
      applyDate: dayjs(),
      headcount: 1,
      gender: '不限',
      maritalStatus: '不限',
      education: '本科',
      hasCandidate: false,
      selectedApproverUserIds: {},
    })
  }, [campus, campusOptions, editingRecord, form, open])

  useEffect(() => {
    if (!open) {
      setApproverPreview([])
      setApproverPreviewLoading(false)
      return
    }

    const normalizedDepartment =
      typeof selectedDepartment === 'string' ? selectedDepartment.trim() : ''
    const normalizedPosition = typeof selectedPosition === 'string' ? selectedPosition.trim() : ''
    const normalizedCampus = typeof selectedCampus === 'string' ? selectedCampus.trim() : ''

    if (!normalizedDepartment || !normalizedPosition) {
      setApproverPreview([])
      form.setFieldValue(
        'selectedApproverUserIds',
        normalizeSelectedApproverMap(form.getFieldValue('selectedApproverUserIds')),
      )
      return
    }

    let active = true
    setApproverPreviewLoading(true)
    previewRecruitmentApproverCandidates({
      campus: normalizedCampus || undefined,
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
            {
              recommendedSelectionMode: 'single-candidate-only',
            },
          ),
        )
      })
      .catch((error) => {
        if (!active) return
        console.error('加载招聘审批人预填写失败', error)
        message.error(getErrorMessage(error, '加载招聘审批人预填写失败'))
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
      campus: normalizeCampusName(values.campus, campusOptions),
      applyDate: (values.applyDate as Dayjs).format('YYYY-MM-DD'),
      department: values.department,
      position: values.position,
      headcount: values.headcount,
      reason: values.reason,
      expectedDate: (values.expectedDate as Dayjs).format('YYYY-MM-DD'),
      gender: values.gender,
      age: values.age,
      maritalStatus: values.maritalStatus,
      education: values.education,
      major: values.major,
      skillsExperience: values.skillsExperience,
      suggestedSalary: values.suggestedSalary,
      jobResponsibilities: values.jobResponsibilities,
      analysisAndReason: values.analysisAndReason,
      internalCandidate: {
        hasCandidate: !!values.hasCandidate,
        department: values.candidateDept,
        name: values.candidateName,
      },
      selectedApproverUserIds: normalizeSelectedApproverMap(values.selectedApproverUserIds),
    })
  }

  return (
    <Modal
      title={isEdit ? '编辑招聘需求申请' : '新增招聘需求申请'}
      open={open}
      onCancel={onCancel}
      onOk={handleSubmit}
      okText="保存草稿"
      cancelText="取消"
      confirmLoading={loading}
      width={920}
      destroyOnClose
      styles={{ body: { maxHeight: '72vh', overflowY: 'auto' } }}
    >
      <Form form={form} layout="vertical">
        <Card size="small" title="基本信息" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="campus"
                label="当前神殿"
                rules={[{ required: true, message: '请选择当前神殿' }]}
              >
                <Select
                  showSearch
                  placeholder="请选择当前神殿"
                  options={campusOptions.map((item) => ({ label: item, value: item }))}
                  optionFilterProp="label"
                />
              </Form.Item>
            </Col>
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
                name="expectedDate"
                label="希望到职日期"
                rules={[{ required: true, message: '请选择希望到职日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="department"
                label="申请部门"
                rules={[{ required: true, message: '请填写申请部门' }]}
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
                label="申请职位"
                rules={[{ required: true, message: '请填写申请职位' }]}
              >
                <AutoComplete
                  options={filteredPositionOptions.map((item) => ({ value: item }))}
                  placeholder="可选择已有职位或自定义填写"
                  filterOption={(inputValue, option) =>
                    String(option?.value || '').toLowerCase().includes(inputValue.toLowerCase())
                  }
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="headcount"
                label="申请人数"
                rules={[{ required: true, message: '请填写申请人数' }]}
              >
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="reason"
            label="申请原因"
            rules={[{ required: true, message: '请选择申请原因' }]}
          >
            <Select
              options={[
                { label: '辞职补充备人力', value: '辞职补充备人力' },
                { label: '部门增员', value: '部门增员' },
                { label: '储备短期需求', value: '储备短期需求' },
              ]}
            />
          </Form.Item>
        </Card>

        <Card size="small" title="资格条件" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="gender" label="性别">
                <Radio.Group>
                  <Radio value="男">男</Radio>
                  <Radio value="女">女</Radio>
                  <Radio value="不限">不限</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="age" label="年龄">
                <Input placeholder="如 25-35" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="maritalStatus" label="婚否">
                <Select
                  options={[
                    { label: '已婚', value: '已婚' },
                    { label: '未婚', value: '未婚' },
                    { label: '不限', value: '不限' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="education" label="学历">
                <Select
                  options={[
                    { label: '大专', value: '大专' },
                    { label: '本科', value: '本科' },
                    { label: '本科以上', value: '本科以上' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="major" label="专业">
                <Input placeholder="专业要求" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="skillsExperience"
                label="具备技能及工作经验"
                rules={[{ required: true, message: '请填写具备技能及工作经验' }]}
              >
                <TextArea rows={3} placeholder="具备技能及工作经验" />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Card size="small" title="岗位信息">
          <Form.Item
            name="suggestedSalary"
            label="建议薪金"
            rules={[{ required: true, message: '请填写建议薪金' }]}
          >
            <Input placeholder="如 5000-8000元/月" />
          </Form.Item>

          <Form.Item
            name="jobResponsibilities"
            label="增加人员岗位职责"
            rules={[
              { required: true, message: '请填写增加人员岗位职责' },
              { min: 50, message: '增加人员岗位职责不少于50字' },
            ]}
          >
            <TextArea rows={3} placeholder="增加人员岗位职责" />
          </Form.Item>

          <Form.Item
            name="analysisAndReason"
            label="本职位工作分析及增员理由"
            rules={[
              { required: true, message: '请填写本职位工作分析及增员理由' },
              { min: 20, message: '本职位工作分析及增员理由不少于20字' },
            ]}
          >
            <TextArea rows={4} placeholder="本职位工作分析及增员理由" />
          </Form.Item>

          <Divider style={{ margin: '12px 0' }} />

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="hasCandidate" label="公司内部有无合适人选">
                <Radio.Group>
                  <Radio value={true}>有</Radio>
                  <Radio value={false}>无</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>
            {hasCandidate && (
              <>
                <Col span={8}>
                  <Form.Item name="candidateDept" label="部门">
                    <Input placeholder="候选人部门" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="candidateName" label="姓名">
                    <Input placeholder="候选人姓名" />
                  </Form.Item>
                </Col>
              </>
            )}
          </Row>
        </Card>

        <ApproverSelectionSection
          previewStages={approverPreview}
          loading={approverPreviewLoading}
          title="审批人候选列表"
          description="系统会按配置中心模板和 public.users 的神殿、部门、职位匹配规则生成各环节候选审批人。最高议事厅招聘需求默认链路为：部门负责人（仅副职发起时出现） -> 人资总监 -> 董事长。默认不自动选中；只有某个审批环节当前候选人仅有 1 人时，系统才会自动预填写。"
          emptyText="请先填写当前神殿、申请部门和申请职位，系统会自动生成各审批环节的候选审批人。"
          recommendedHintMode="candidate"
        />
      </Form>
    </Modal>
  )
}

interface PreviewModalProps {
  open: boolean
  record: RecruitmentRequestRecord | null
  onCancel: () => void
}

const PreviewModal: React.FC<PreviewModalProps> = ({ open, record, onCancel }) => {
  if (!record) return null

  return (
    <Modal
      title="招聘需求申请详情"
      open={open}
      onCancel={onCancel}
      width={980}
      footer={[
        <Button key="close" onClick={onCancel}>
          关闭
        </Button>,
        <Button key="print" icon={<PrinterOutlined />} onClick={() => window.print()}>
          打印
        </Button>,
      ]}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Descriptions
          title="申请概览"
          bordered
          size="small"
          column={2}
          items={[
            { key: 'requestNo', label: '申请单号', children: record.requestNo },
            { key: 'campus', label: '神殿', children: record.campus || '-' },
            { key: 'applyDate', label: '申请日期', children: record.applyDate },
            { key: 'expectedDate', label: '希望到职日期', children: record.expectedDate },
            { key: 'department', label: '申请部门', children: record.department },
            { key: 'position', label: '申请职位', children: record.position },
            { key: 'headcount', label: '申请人数', children: `${record.headcount}人` },
            { key: 'reason', label: '申请原因', children: record.reason },
            {
              key: 'status',
              label: '状态',
              children: <Tag color={STATUS_COLOR_MAP[record.status]}>{record.statusLabel}</Tag>,
            },
            { key: 'stage', label: '当前阶段', children: record.currentStageLabel || '-' },
            { key: 'creator', label: '创建人', children: record.createdByName || '-' },
            { key: 'rejection', label: '驳回原因', children: record.rejectionReason || '-' },
          ]}
        />

        <Descriptions
          title="资格条件"
          bordered
          size="small"
          column={2}
          items={[
            { key: 'gender', label: '性别', children: record.gender || '-' },
            { key: 'age', label: '年龄', children: record.age || '-' },
            { key: 'maritalStatus', label: '婚否', children: record.maritalStatus || '-' },
            { key: 'education', label: '学历', children: record.education || '-' },
            { key: 'major', label: '专业', children: record.major || '-' },
            { key: 'suggestedSalary', label: '建议薪金', children: record.suggestedSalary || '-' },
            {
              key: 'skillsExperience',
              label: '具备技能及工作经验',
              children: record.skillsExperience || '-',
              span: 2,
            },
            {
              key: 'jobResponsibilities',
              label: '增加人员岗位职责',
              children: record.jobResponsibilities || '-',
              span: 2,
            },
            {
              key: 'analysisAndReason',
              label: '本职位工作分析及增员理由',
              children: record.analysisAndReason || '-',
              span: 2,
            },
            {
              key: 'internalCandidate',
              label: '内部候选人',
              children: record.internalCandidate.hasCandidate
                ? `${record.internalCandidate.department || '-'} / ${record.internalCandidate.name || '-'}`
                : '无',
              span: 2,
            },
          ]}
        />

        <Descriptions
          title="审批意见"
          bordered
          size="small"
          column={1}
          items={[
            {
              key: 'deptManagerOpinion',
              label: '部门负责人意见',
              children: record.deptManagerOpinion || '-',
            },
            {
              key: 'principalOpinion',
              label: '校长意见',
              children: record.principalOpinion || '-',
            },
            {
              key: 'hrDirectorOpinion',
              label: '人资总监意见',
              children: record.hrDirectorOpinion || '-',
            },
            {
              key: 'chairmanApproval',
              label: '董事长签批',
              children: record.chairmanApproval || '-',
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
                  ? 'green'
                  : item.status === 'rejected'
                    ? 'red'
                    : item.status === 'current'
                      ? 'blue'
                      : 'default'
              return (
                <List.Item>
                  <List.Item.Meta
                    title={
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
                    }
                    description={
                      item.actedByName || item.comment
                        ? `${item.actedByName ? `处理人：${item.actedByName}` : ''}${item.actionLabel ? `  动作：${item.actionLabel}` : ''}${item.actedAt ? `  时间：${item.actedAt}` : ''}${item.comment?.trim() ? `  意见：${item.comment.trim()}` : ''}`
                        : '当前环节暂无处理记录'
                    }
                  />
                </List.Item>
              )
            }}
          />
        </Card>

        <Card size="small" title="审批流转记录">
          <List
            dataSource={record.approvalActions}
            locale={{ emptyText: '暂无审批记录' }}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  title={
                    <Space>
                      <Tag>{item.stageLabel}</Tag>
                      <Tag
                        color={
                          item.action === 'approve'
                            ? 'green'
                            : item.action === 'reject'
                              ? 'red'
                              : 'default'
                        }
                      >
                        {item.action === 'approve'
                          ? '通过'
                          : item.action === 'reject'
                            ? '驳回'
                            : '提交'}
                      </Tag>
                      <Text>{item.approverName || '-'}</Text>
                    </Space>
                  }
                  description={`${item.createdAt}  ${item.comment || ''}`}
                />
              </List.Item>
            )}
          />
        </Card>
      </Space>
    </Modal>
  )
}

interface ApprovalActionModalProps {
  open: boolean
  type: 'approve' | 'reject'
  loading: boolean
  onCancel: () => void
  onOk: (comment: string) => Promise<void>
}

const ApprovalActionModal: React.FC<ApprovalActionModalProps> = ({
  open,
  type,
  loading,
  onCancel,
  onOk,
}) => {
  const [comment, setComment] = useState('')

  useEffect(() => {
    if (open) setComment('')
  }, [open])

  return (
    <Modal
      title={type === 'approve' ? '审批通过' : '审批驳回'}
      open={open}
      onCancel={onCancel}
      onOk={() => onOk(comment)}
      okText={type === 'approve' ? '确认通过' : '确认驳回'}
      cancelText="取消"
      confirmLoading={loading}
    >
      <TextArea
        rows={4}
        placeholder={type === 'approve' ? '可填写审批意见（选填）' : '请填写驳回原因'}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
    </Modal>
  )
}

const RecruitmentRequest: React.FC = () => {
  const { currentCampus } = useCampusStore()
  const [data, setData] = useState<RecruitmentRequestRecord[]>([])
  const [campusOptions, setCampusOptions] = useState<string[]>([])
  const [departmentOptions, setDepartmentOptions] = useState<string[]>([])
  const [positionOptions, setPositionOptions] = useState<string[]>([])
  const [users, setUsers] = useState<UserPermissionInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<RecruitmentRequestRecord | null>(null)
  const [previewRecord, setPreviewRecord] = useState<RecruitmentRequestRecord | null>(null)
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | undefined>()
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [approvalModal, setApprovalModal] = useState<{
    open: boolean
    type: 'approve' | 'reject'
    record: RecruitmentRequestRecord | null
  }>({
    open: false,
    type: 'approve',
    record: null,
  })

  const loadData = async () => {
    try {
      setLoading(true)
      const records = await listRecruitmentRequestsPaged({
        campus: currentCampus || undefined,
        status: statusFilter as any,
        search: searchText.trim() || undefined,
        page: currentPage,
        pageSize,
      })
      setData(records.items)
      setTotal(records.total)
    } catch (error) {
      console.error('加载招聘需求申请失败', error)
      message.error(getErrorMessage(error, '加载招聘需求申请失败'))
    } finally {
      setLoading(false)
    }
  }

  const loadUserDimensionOptions = async () => {
    try {
      const [rawUsers, rawCampusList, rawCampusProfiles, rawDepartments, rawPositions] = await Promise.all([
        fetchUserPermissions(),
        fetchCampusOptions(),
        fetchCampuses(),
        fetchEmployeeDepartments(),
        fetchEmployeePositions(),
      ])
      const activeUsers = rawUsers.filter((item) => item.status === 'active')
      setUsers(activeUsers)
      setDepartmentOptions(
        Array.from(new Set((rawDepartments || []).map((item) => item.trim()).filter(Boolean)))
          .sort((a, b) => a.localeCompare(b, 'zh-CN')),
      )
      setPositionOptions(
        Array.from(new Set((rawPositions || []).map((item) => item.trim()).filter(Boolean)))
          .sort((a, b) => a.localeCompare(b, 'zh-CN')),
      )
      const campusAliasMap = buildCampusAliasMap(rawCampusProfiles)
      const canonicalNames = Array.from(
        new Set(Object.values(campusAliasMap).filter(Boolean)),
      )
      const normalizedFromUsers = rawCampusList
        .filter(Boolean)
        .map((name) => normalizeCampusName(name, canonicalNames, campusAliasMap))
      const normalizedCurrentCampus = normalizeCampusName(
        currentCampus || '',
        canonicalNames,
        campusAliasMap,
      )
      setCampusOptions(
        Array.from(
          new Set(
            [
              ...canonicalNames,
              ...normalizedFromUsers,
              normalizedCurrentCampus,
              '最高议事厅神殿', // 兜底：确保最高议事厅始终存在
            ].filter(Boolean),
          ),
        ).sort((a, b) => a.localeCompare(b, 'zh-CN')),
      )
    } catch (error) {
      console.error('加载神殿、部门和职位选项失败', error)
    }
  }

  useEffect(() => {
    loadData()
  }, [currentCampus, statusFilter, searchText, currentPage, pageSize])

  useEffect(() => {
    loadUserDimensionOptions()
  }, [currentCampus])

  const handleAdd = () => {
    setEditingRecord(null)
    setEditModalOpen(true)
  }

  const handleEdit = (record: RecruitmentRequestRecord) => {
    setEditingRecord(record)
    setEditModalOpen(true)
  }

  const handleSave = async (payload: RecruitmentRequestPayload) => {
    try {
      setSaving(true)
      if (editingRecord) {
        await updateRecruitmentRequest(editingRecord.id, payload)
        message.success('招聘需求申请已更新')
      } else {
        await createRecruitmentRequest(payload)
        message.success('招聘需求申请草稿已创建')
      }
      setEditModalOpen(false)
      await loadData()
    } catch (error) {
      console.error('保存招聘需求申请失败', error)
      message.error(getErrorMessage(error, '保存招聘需求申请失败'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (record: RecruitmentRequestRecord) => {
    try {
      await deleteRecruitmentRequest(record.id)
      message.success('招聘需求申请已删除')
      await loadData()
    } catch (error) {
      console.error('删除招聘需求申请失败', error)
      message.error(getErrorMessage(error, '删除招聘需求申请失败'))
    }
  }

  const handleSubmit = async (record: RecruitmentRequestRecord) => {
    try {
      await submitRecruitmentRequest(record.id)
      message.success('招聘需求申请已提交审批')
      await loadData()
    } catch (error) {
      console.error('提交招聘需求申请失败', error)
      message.error(getErrorMessage(error, '提交招聘需求申请失败'))
    }
  }

  const handleApproval = async (comment: string) => {
    if (!approvalModal.record) return
    try {
      setSaving(true)
      if (approvalModal.type === 'approve') {
        await approveRecruitmentRequest(approvalModal.record.id, comment)
        message.success('审批已通过')
      } else {
        if (!comment.trim()) {
          message.warning('驳回时必须填写审批意见')
          return
        }
        await rejectRecruitmentRequest(approvalModal.record.id, comment.trim())
        message.success('申请已驳回')
      }
      setApprovalModal({ open: false, type: 'approve', record: null })
      await loadData()
    } catch (error) {
      console.error('审批处理失败', error)
      if (isApprovalStateChangedError(error)) {
        message.info('该申请的审批状态已变化，正在刷新最新数据')
        setApprovalModal({ open: false, type: 'approve', record: null })
        await loadData()
        return
      }
      message.error(getErrorMessage(error, '审批处理失败'))
    } finally {
      setSaving(false)
    }
  }

  const columns: ColumnsType<RecruitmentRequestRecord> = [
    {
      title: '申请单号',
      dataIndex: 'requestNo',
      width: 180,
      fixed: 'left',
    },
    {
      title: '神殿',
      dataIndex: 'campus',
      width: 120,
      render: (value?: string | null) => value || '-',
    },
    {
      title: '申请日期',
      dataIndex: 'applyDate',
      width: 120,
    },
    {
      title: '申请部门',
      dataIndex: 'department',
      width: 120,
    },
    {
      title: '申请职位',
      dataIndex: 'position',
      width: 140,
    },
    {
      title: '申请人数',
      dataIndex: 'headcount',
      width: 90,
      align: 'center',
    },
    {
      title: '申请原因',
      dataIndex: 'reason',
      width: 140,
    },
    {
      title: '希望到职日期',
      dataIndex: 'expectedDate',
      width: 120,
    },
    {
      title: '当前阶段',
      dataIndex: 'currentStageLabel',
      width: 120,
      render: (value?: string | null) => value || '-',
    },
    {
      title: '当前审批人',
      key: 'currentApprovers',
      width: 260,
      render: (_, record) =>
        record.currentApprovers.length ? (
          <Space wrap>
            {record.currentApprovers.map((item) => (
              <Tag key={item.userId} color="blue">
                {item.name}
              </Tag>
            ))}
          </Space>
        ) : (
          '-'
        ),
    },
    {
      title: '状态',
      dataIndex: 'statusLabel',
      width: 100,
      render: (_, record) => (
        <Tooltip title={record.rejectionReason || ''}>
          <Tag color={STATUS_COLOR_MAP[record.status] || 'default'}>{record.statusLabel}</Tag>
        </Tooltip>
      ),
    },
    {
      title: '创建人',
      dataIndex: 'createdByName',
      width: 120,
      render: (value?: string | null) => value || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small" wrap>
          <Tooltip title="查看">
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => setPreviewRecord(record)}
            />
          </Tooltip>

          {record.canEdit && (
            <Tooltip title="编辑">
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
              />
            </Tooltip>
          )}

          {record.canSubmit && (
            <Tooltip title="提交审批">
              <Button
                type="link"
                size="small"
                icon={<SendOutlined />}
                onClick={() => handleSubmit(record)}
              />
            </Tooltip>
          )}

          {record.canApprove && (
            <>
              <Tooltip title="审批通过">
                <Button
                  type="link"
                  size="small"
                  icon={<CheckOutlined />}
                  onClick={() =>
                    setApprovalModal({
                      open: true,
                      type: 'approve',
                      record,
                    })
                  }
                />
              </Tooltip>
              <Tooltip title="审批驳回">
                <Button
                  type="link"
                  size="small"
                  danger
                  icon={<CloseOutlined />}
                  onClick={() =>
                    setApprovalModal({
                      open: true,
                      type: 'reject',
                      record,
                    })
                  }
                />
              </Tooltip>
            </>
          )}

          {record.canDelete && (
            <Popconfirm
              title="确认删除该申请？"
              onConfirm={() => handleDelete(record)}
              okText="确认"
              cancelText="取消"
            >
              <Tooltip title="删除">
                <Button type="link" size="small" danger icon={<DeleteOutlined />} />
              </Tooltip>
            </Popconfirm>
          )}
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
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                新增招聘需求
              </Button>
              <Text type="secondary">当前神殿：{currentCampus || '未选择'}</Text>
            </Space>
          </Col>
          <Col>
            <Space>
              <Select
                allowClear
                placeholder="按状态筛选"
                style={{ width: 140 }}
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
                placeholder="搜索单号/部门/职位/创建人"
                prefix={<SearchOutlined />}
                value={searchText}
                allowClear
                style={{ width: 300 }}
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
          rowKey="id"
          bordered
          loading={loading}
          columns={columns}
          dataSource={data}
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
        campus={editingRecord?.campus || currentCampus}
        editingRecord={editingRecord}
        campusOptions={campusOptions}
        departmentOptions={departmentOptions}
        positionOptions={positionOptions}
        users={users}
        onCancel={() => setEditModalOpen(false)}
        onOk={handleSave}
      />

      <PreviewModal
        open={!!previewRecord}
        record={previewRecord}
        onCancel={() => setPreviewRecord(null)}
      />

      <ApprovalActionModal
        open={approvalModal.open}
        type={approvalModal.type}
        loading={saving}
        onCancel={() => setApprovalModal({ open: false, type: 'approve', record: null })}
        onOk={handleApproval}
      />
    </div>
  )
}

export default RecruitmentRequest