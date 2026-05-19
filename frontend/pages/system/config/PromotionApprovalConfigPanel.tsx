import React, { useEffect, useMemo, useState } from 'react'
import { App,
  Alert,
  AutoComplete,
  Button,
  Card,
  Form,
  Modal,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tag,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import {
  fetchCampusOptions,
  fetchDepartmentOptions,
  fetchPositionOptions,
  fetchUserPermissions,
  type UserPermissionInfo,
} from '@/services/configMaster'
import {
  deletePromotionApprovalConfig,
  listPromotionApprovalConfigs,
  type PromotionApprovalConfig,
  type PromotionApprovalConfigPayload,
  type PromotionStage,
  upsertPromotionApprovalConfig,
} from '@/services/humanresources/promotionApplication'

const STAGE_OPTIONS: Array<{ label: string; value: PromotionStage }> = [
  { label: '部门主管', value: 'department_manager' },
  { label: '校长', value: 'principal' },
  { label: '业务条线总监', value: 'biz_director' },
  { label: '人资总监', value: 'hr_director' },
  { label: '董事长', value: 'chairman' },
]

const MANAGEMENT_CENTER_CAMPUS_VALUES = ['最高议事厅', '最高议事厅神殿']
const MANAGEMENT_ROLE_KEYWORDS = ['主管', '经理', '总监', '部长', '主任', '负责人', '校长']
const DEPARTMENT_MANAGER_RULES = {
  management_center: [
    { departmentKeywords: ['市场'], positionPatterns: [[['经理'], ['副经理']]] },
    { departmentKeywords: ['财务'], positionPatterns: [[['总监'], []]] },
    { departmentKeywords: ['学术'], positionPatterns: [[['副总监'], []], [['总监'], []]] },
    { departmentKeywords: ['教质'], positionPatterns: [[['经理'], []], [['总监'], []]] },
    { departmentKeywords: ['运营'], positionPatterns: [[['总监'], []]] },
    { departmentKeywords: ['人资', '人力', '人事', '行政'], positionPatterns: [[['总监'], []]] },
  ],
  branch: [
    { departmentKeywords: ['咨询'], positionPatterns: [[['分析规划师主管'], []]] },
    { departmentKeywords: ['学术'], positionPatterns: [[['学术经理'], []], [['学术副经理'], []]] },
    { departmentKeywords: ['教质'], positionPatterns: [[['教化司经理'], []], [['教化司副经理'], []]] },
    { departmentKeywords: ['渠道'], positionPatterns: [[['渠道部经理'], []], [['渠道部副校长'], []], [['渠道部校长'], []]] },
  ],
} as const
const LINE_DEPARTMENT_KEYWORDS: Record<string, string[]> = {
  咨询: ['咨询'],
  教质: ['教质'],
  学术: ['学术'],
  市场: ['市场'],
  财务: ['财务'],
  人资行政: ['人资', '人力', '行政'],
  运营: ['运营'],
  渠道: ['渠道'],
  线上事业部: ['线上事业部', '线上'],
  线下事业部: ['线下事业部', '线下'],
}

type FormError = {
  errorFields?: unknown[]
}

type ErrorWithResponse = {
  response?: {
    data?: {
      detail?: string
    }
  }
}

const isFormError = (error: unknown): error is FormError =>
  typeof error === 'object' && error !== null && 'errorFields' in error

const getErrorDetail = (error: unknown, fallback: string) => {
  const maybeError = error as ErrorWithResponse
  return maybeError.response?.data?.detail || fallback
}

const normalizeText = (value?: string | null) => (value || '').replace(/\s+/g, '')
const toOptions = (values: string[]) => values.map((value) => ({ value }))

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

const isManagementRolePosition = (position?: string | null) =>
  MANAGEMENT_ROLE_KEYWORDS.some((keyword) => normalizeText(position).includes(keyword))

const isDirectorPosition = (position?: string | null) => normalizeText(position).includes('总监')

const isSchoolLeaderPosition = (position?: string | null) => normalizeText(position).includes('校长')

const isPrincipalPosition = (campus?: string | null, position?: string | null) => {
  const normalized = normalizeText(position)
  if (!normalized) return false
  if (!normalized.includes('校长')) return false
  const principalIndex = normalized.indexOf('校长')
  const viceIndex = normalized.indexOf('副')
  return viceIndex === -1 || viceIndex > principalIndex
}

const isChairmanPosition = (position?: string | null) => (position || '').trim() === '董事长'

const isHrAdminDepartment = (department?: string | null) => {
  const normalized = normalizeText(department)
  return ['人资行政', '人事行政', '人力资源', '人事部', '人资部', '人资'].some((item) =>
    normalized.includes(item),
  )
}

const isHrDirectorCandidate = (user: UserPermissionInfo) =>
  user.status === 'active' &&
  isManagementCenterCampus(user.campus) &&
  isHrAdminDepartment(user.department) &&
  isDirectorPosition(user.position)

const shouldRequireChairman = (campus?: string | null, position?: string | null) =>
  isManagementCenterCampus(campus) || isPrincipalPosition(campus, position)

const normalizeDepartmentKey = (department?: string | null) => {
  const normalized = normalizeText(department)
  const key = Object.keys(LINE_DEPARTMENT_KEYWORDS).find((item) => normalized.includes(item))
  return key || normalized
}

const getLineKeywords = (department?: string | null, position?: string | null) => {
  const normalizedDepartment = normalizeText(department)
  const normalizedPosition = normalizeText(position)
  const values: string[] = []
  Object.entries(LINE_DEPARTMENT_KEYWORDS).forEach(([marker, keywords]) => {
    if (normalizedDepartment.includes(marker) || normalizedPosition.includes(marker)) {
      values.push(...keywords)
    }
  })
  return values.length ? Array.from(new Set(values)) : normalizedDepartment ? [normalizedDepartment] : []
}

const departmentMatches = (userDepartment?: string | null, applyDepartment?: string | null) =>
  !!normalizeDepartmentKey(userDepartment) &&
  normalizeDepartmentKey(userDepartment) === normalizeDepartmentKey(applyDepartment)

const isSameDepartmentScope = (userDepartment?: string | null, applyDepartment?: string | null) => {
  const normalizedUser = normalizeText(userDepartment)
  const normalizedApply = normalizeText(applyDepartment)
  if (!normalizedUser || !normalizedApply) return false
  return (
    normalizedUser === normalizedApply ||
    normalizedUser.includes(normalizedApply) ||
    normalizedApply.includes(normalizedUser)
  )
}

const matchesPositionPattern = (
  position?: string | null,
  includeKeywords: readonly string[] = [],
  excludeKeywords: readonly string[] = [],
) => {
  const normalized = normalizeText(position)
  if (!normalized || !includeKeywords.some((keyword) => normalized.includes(keyword))) return false
  return !excludeKeywords.some((keyword) => normalized.includes(keyword))
}

const matchesAnyPositionPatterns = (
  position?: string | null,
  patterns: ReadonlyArray<readonly [readonly string[], readonly string[]]> = [],
) => patterns.some(([includeKeywords, excludeKeywords]) => matchesPositionPattern(position, includeKeywords, excludeKeywords))

const getDepartmentManagerRule = (campus?: string | null, applyDepartment?: string | null) => {
  const campusBucket = resolveCampusBucket(campus)
  if (!campusBucket) return undefined
  const ruleGroup = campusBucket === 'management_center' ? DEPARTMENT_MANAGER_RULES.management_center : DEPARTMENT_MANAGER_RULES.branch
  return ruleGroup.find((rule) => rule.departmentKeywords.some((keyword) => normalizeText(applyDepartment).includes(keyword)))
}

const isDepartmentHeadCandidatePosition = (position?: string | null) => {
  const normalized = normalizeText(position)
  if (!normalized || normalized === '董事长') return false
  return isManagementRolePosition(position) || normalized.includes('校长')
}

const matchesLineKeywords = (
  userDepartment?: string | null,
  userPosition?: string | null,
  keywords: string[] = [],
) => {
  if (!keywords.length) return false
  const haystack = `${normalizeText(userDepartment)}|${normalizeText(userPosition)}`
  return keywords.some((keyword) => haystack.includes(keyword))
}

const isBizDirectorCandidate = (
  user: UserPermissionInfo,
  applyDepartment?: string | null,
  applyPosition?: string | null,
) => {
  if (user.status !== 'active') return false
  if (!isManagementCenterCampus(user.campus) || !isManagementRolePosition(user.position)) return false
  if (departmentMatches(user.department, applyDepartment)) return true
  return matchesLineKeywords(user.department, user.position, getLineKeywords(applyDepartment, applyPosition))
}

const isDepartmentManagerCandidate = (
  user: UserPermissionInfo,
  campus?: string | null,
  applyDepartment?: string | null,
  applyPosition?: string | null,
) => {
  if (user.status !== 'active' || !campusMatchesScope(user.campus, campus)) return false
  const targetIsManagementRole = isManagementRolePosition(applyPosition)
  if (targetIsManagementRole) {
    if (isManagementCenterCampus(campus)) {
      return isBizDirectorCandidate(user, applyDepartment, applyPosition)
    }
    return isPrincipalPosition(campus, user.position)
  }

  const rule = getDepartmentManagerRule(campus, applyDepartment)
  if (rule && isSameDepartmentScope(user.department, applyDepartment)) {
    if (matchesAnyPositionPatterns(user.position, rule.positionPatterns)) {
      return true
    }
    return normalizeText(user.position).includes('校长')
  }

  return isSameDepartmentScope(user.department, applyDepartment) && isDepartmentHeadCandidatePosition(user.position)
}

const PromotionApprovalConfigPanel: React.FC = () => {
  const { message } = App.useApp()
  const [configs, setConfigs] = useState<PromotionApprovalConfig[]>([])
  const [users, setUsers] = useState<UserPermissionInfo[]>([])
  const [campuses, setCampuses] = useState<string[]>([])
  const [departments, setDepartments] = useState<string[]>([])
  const [positions, setPositions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingConfig, setEditingConfig] = useState<PromotionApprovalConfig | null>(null)
  const [form] = Form.useForm()

  const loadData = async () => {
    try {
      setLoading(true)
      const [configRes, userRes, campusRes, departmentRes, positionRes] = await Promise.all([
        listPromotionApprovalConfigs(),
        fetchUserPermissions(),
        fetchCampusOptions(),
        fetchDepartmentOptions(),
        fetchPositionOptions(),
      ])
      setConfigs(configRes)
      setUsers(userRes.filter((item) => item.status === 'active'))
      setCampuses(campusRes)
      setDepartments(departmentRes)
      setPositions(positionRes)
    } catch (error) {
      console.error('加载晋升审批配置失败', error)
      message.error('加载晋升审批配置失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const openCreate = () => {
    setEditingConfig(null)
    form.resetFields()
    form.setFieldsValue({ isActive: true, approverUserIds: [] })
    setModalOpen(true)
  }

  const openEdit = (record: PromotionApprovalConfig) => {
    setEditingConfig(record)
    form.setFieldsValue({
      campus: record.campus,
      applyDepartment: record.applyDepartment,
      applyPosition: record.applyPosition,
      stage: record.stage,
      approverUserIds: record.approvers.map((item) => item.approverUserId),
      isActive: record.isActive,
    })
    setModalOpen(true)
  }

  const selectedCampus = Form.useWatch('campus', form)
  const selectedDepartment = Form.useWatch('applyDepartment', form)
  const selectedPosition = Form.useWatch('applyPosition', form)
  const selectedStage = Form.useWatch('stage', form)
  const selectedCampusIsManagementCenter = isManagementCenterCampus(selectedCampus)
  const selectedScopeRequiresChairman = shouldRequireChairman(selectedCampus, selectedPosition)

  const stageOptions = useMemo(
    () =>
      selectedCampusIsManagementCenter
        ? STAGE_OPTIONS.filter((item) => item.value !== 'principal')
        : STAGE_OPTIONS,
    [selectedCampusIsManagementCenter],
  )

  const scopedUsers = useMemo(
    () =>
      users.filter((item) =>
        campusMatchesScope(item.campus, typeof selectedCampus === 'string' ? selectedCampus : undefined),
      ),
    [selectedCampus, users],
  )

  const filteredDepartments = useMemo(() => {
    const scopedValues = Array.from(
      new Set(
        scopedUsers
          .map((item) => item.department?.trim())
          .filter((item): item is string => !!item),
      ),
    ).sort((a, b) => a.localeCompare(b, 'zh-CN'))
    return scopedValues.length ? scopedValues : departments
  }, [departments, scopedUsers])

  const filteredPositions = useMemo(() => {
    const departmentScopedUsers = selectedDepartment
      ? scopedUsers.filter((item) => departmentMatches(item.department, selectedDepartment))
      : scopedUsers
    const scopedValues = Array.from(
      new Set(
        departmentScopedUsers
          .map((item) => item.position?.trim())
          .filter((item): item is string => !!item),
      ),
    ).sort((a, b) => a.localeCompare(b, 'zh-CN'))
    return scopedValues.length ? scopedValues : positions
  }, [positions, scopedUsers, selectedDepartment])

  const filteredUsers = useMemo(() => {
    if (selectedStage === 'chairman') {
      return users.filter((item) => item.status === 'active' && isChairmanPosition(item.position))
    }
    if (selectedStage === 'hr_director') {
      return users.filter(isHrDirectorCandidate)
    }
    if (selectedStage === 'principal') {
      return scopedUsers.filter((item) => isPrincipalPosition(selectedCampus, item.position))
    }
    if (selectedStage === 'biz_director') {
      return users.filter((item) => isBizDirectorCandidate(item, selectedDepartment, selectedPosition))
    }
    if (selectedStage === 'department_manager') {
      return users.filter((item) =>
        isDepartmentManagerCandidate(item, selectedCampus, selectedDepartment, selectedPosition),
      )
    }
    return scopedUsers
  }, [scopedUsers, selectedCampus, selectedDepartment, selectedPosition, selectedStage, users])

  useEffect(() => {
    const selectedApproverIds = form.getFieldValue('approverUserIds') as number[] | undefined
    if (!selectedApproverIds?.length) return
    const validUserIds = new Set(filteredUsers.map((item) => item.user_id))
    const nextApproverIds = selectedApproverIds.filter((item) => validUserIds.has(item))
    if (nextApproverIds.length !== selectedApproverIds.length) {
      form.setFieldValue('approverUserIds', nextApproverIds)
    }
  }, [filteredUsers, form])

  useEffect(() => {
    const selectedApproverIds = form.getFieldValue('approverUserIds') as number[] | undefined
    if (!selectedStage || selectedApproverIds?.length) return
    if (!['chairman', 'hr_director'].includes(selectedStage)) return
    if (filteredUsers.length !== 1) return
    form.setFieldValue('approverUserIds', [filteredUsers[0].user_id])
  }, [filteredUsers, form, selectedStage])

  useEffect(() => {
    if (!selectedCampusIsManagementCenter || selectedStage !== 'principal') return
    form.setFieldValue('stage', undefined)
  }, [form, selectedCampusIsManagementCenter, selectedStage])

  const approverOptions = filteredUsers.map((item) => ({
    label: `${item.name} / ${item.campus || '未设神殿'} / ${item.department || '未设部门'} / ${item.position || '未设岗位'}`,
    value: item.user_id,
  }))

  const submit = async () => {
    try {
      const values = await form.validateFields()
      const payload: PromotionApprovalConfigPayload = {
        campus: values.campus,
        applyDepartment: values.applyDepartment || undefined,
        applyPosition: values.applyPosition || undefined,
        stage: values.stage,
        approverUserIds: values.approverUserIds,
        isActive: values.isActive,
      }
      if (payload.stage === 'chairman' && !shouldRequireChairman(payload.campus, payload.applyPosition)) {
        message.error('董事长阶段只允许配置最高议事厅或校长岗位范围')
        return
      }
      await upsertPromotionApprovalConfig(payload)
      message.success(editingConfig ? '晋升审批配置已更新' : '晋升审批配置已创建')
      setModalOpen(false)
      setEditingConfig(null)
      form.resetFields()
      await loadData()
    } catch (error) {
      if (isFormError(error)) return
      console.error('保存晋升审批配置失败', error)
      message.error(getErrorDetail(error, '保存晋升审批配置失败'))
    }
  }

  const handleDelete = async (record: PromotionApprovalConfig) => {
    try {
      await deletePromotionApprovalConfig(record.id)
      message.success('晋升审批配置已删除')
      await loadData()
    } catch (error) {
      console.error('删除晋升审批配置失败', error)
      message.error(getErrorDetail(error, '删除晋升审批配置失败'))
    }
  }

  const columns: ColumnsType<PromotionApprovalConfig> = [
    {
      title: '神殿',
      dataIndex: 'campus',
      width: 160,
    },
    {
      title: '申请部门',
      dataIndex: 'applyDepartment',
      width: 160,
      render: (value) => value || <Tag>全部部门</Tag>,
    },
    {
      title: '申请职位',
      dataIndex: 'applyPosition',
      width: 180,
      render: (value) => value || <Tag>全部职位</Tag>,
    },
    {
      title: '审批阶段',
      dataIndex: 'stageLabel',
      width: 140,
      render: (value, record) => <Tag color={record.stage === 'chairman' ? 'gold' : 'blue'}>{value}</Tag>,
    },
    {
      title: '审批人',
      width: 320,
      render: (_, record) =>
        record.approvers.length ? record.approvers.map((item) => item.approverName).join('、') : '未配置',
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      width: 100,
      render: (value: boolean) => <Tag color={value ? 'success' : 'default'}>{value ? '启用' : '停用'}</Tag>,
    },
    {
      title: '操作',
      width: 160,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button size="small" type="link" onClick={() => openEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确认删除该配置？" onConfirm={() => handleDelete(record)}>
            <Button size="small" type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <Card
      title="晋升审批配置"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          新增配置
        </Button>
      }
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Alert
          type="info"
          showIcon
          message="这里配置的是晋升申请的默认审批人模板。申请人提交前可在申请单里逐环节搜索并调整审批人，系统会先按模板和 public.users 的神殿、部门、职位规则预填写。默认审批链：普通神殿 = 部门主管 -> 校长 -> 业务条线总监 -> 人资总监；其中校长岗位会在末尾追加董事长；最高议事厅 = 部门主管 -> 业务条线总监 -> 人资总监 -> 董事长。"
        />

        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={configs}
          bordered
          pagination={{ pageSize: 10, showSizeChanger: true }}
          scroll={{ x: 1200 }}
        />
      </Space>

      <Modal
        title={editingConfig ? '编辑晋升审批配置' : '新增晋升审批配置'}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false)
          setEditingConfig(null)
        }}
        onOk={submit}
        destroyOnClose
        width={760}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="campus" label="神殿" rules={[{ required: true, message: '请输入神殿' }]}>
            <AutoComplete
              options={toOptions(campuses)}
              placeholder="支持输入或选择神殿"
              filterOption={(inputValue, option) =>
                String(option?.value || '').toLowerCase().includes(inputValue.toLowerCase())
              }
            />
          </Form.Item>

          <Form.Item name="applyDepartment" label="申请部门" extra="留空表示全部部门">
            <AutoComplete
              options={toOptions(filteredDepartments)}
              placeholder="支持输入或选择申请部门"
              filterOption={(inputValue, option) =>
                String(option?.value || '').toLowerCase().includes(inputValue.toLowerCase())
              }
            />
          </Form.Item>

          <Form.Item name="applyPosition" label="申请职位" extra="留空表示全部职位">
            <AutoComplete
              options={toOptions(filteredPositions)}
              placeholder="支持输入或选择申请职位"
              filterOption={(inputValue, option) =>
                String(option?.value || '').toLowerCase().includes(inputValue.toLowerCase())
              }
            />
          </Form.Item>

          <Form.Item name="stage" label="审批阶段" rules={[{ required: true, message: '请选择审批阶段' }]}>
            <Select options={stageOptions} />
          </Form.Item>

          {selectedCampusIsManagementCenter ? (
            <Alert
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
              message="最高议事厅晋升审批不经过校长环节，默认链路为：部门主管 -> 业务条线总监 -> 人资总监 -> 董事长。"
            />
          ) : null}

          {selectedStage === 'chairman' && !selectedScopeRequiresChairman ? (
            <Alert
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
              message="当前范围不命中董事长审批规则。董事长阶段仅适用于最高议事厅，或申请职位为校长的配置范围。"
            />
          ) : null}

          <Form.Item
            name="approverUserIds"
            label="审批人"
            rules={[{ required: true, message: '请至少选择一个审批人' }]}
            extra={
              selectedStage === 'chairman'
                ? '董事长阶段仅用于最高议事厅或校长岗位范围，且只能选择职位为“董事长”的人员。'
                : selectedStage === 'hr_director'
                  ? '人资总监阶段只能选择最高议事厅人资相关部门中职位包含“总监”的人员。'
                  : selectedStage === 'biz_director'
                    ? '业务条线总监阶段只能选择最高议事厅对应条线的管理岗人员。'
                    : selectedStage === 'principal'
                      ? '校长阶段只能选择当前神殿校长岗，不含副校长。'
                      : '部门主管阶段默认按当前部门负责人规则筛选；管理岗晋升时自动上提到上一级审批岗。'
            }
          >
            <Select
              mode="multiple"
              showSearch
              placeholder="请选择审批人"
              options={approverOptions}
              filterOption={(input, option) =>
                String(option?.label || '').toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>

          <Form.Item name="isActive" label="启用状态" valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="停用" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}

export default PromotionApprovalConfigPanel
