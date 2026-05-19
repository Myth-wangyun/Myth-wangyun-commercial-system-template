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
  deleteRegularizationApprovalConfig,
  listRegularizationApprovalConfigs,
  type RegularizationApprovalConfig,
  type RegularizationApprovalConfigPayload,
  type RegularizationStage,
  upsertRegularizationApprovalConfig,
} from '@/services/humanresources/regularizationApplication'

const STAGE_OPTIONS: Array<{ label: string; value: RegularizationStage }> = [
  { label: '部门负责人', value: 'department_head' },
  { label: '副校长', value: 'vice_principal' },
  { label: '校长', value: 'principal' },
  { label: '集团人力资源部', value: 'hr' },
  { label: '董事长', value: 'chairman' },
]

const MANAGEMENT_CENTER_CAMPUS_VALUES = ['最高议事厅', '最高议事厅神殿']
const HR_ADMIN_DEPARTMENT_KEYWORDS = ['人资', '人力资源', '人事']

const normalizeText = (value?: string | null) => (value || '').replace(/\s+/g, '')
const toOptions = (values: string[]) => values.map((value) => ({ value }))

const isManagementCenterCampus = (campus?: string | null) =>
  !!campus && MANAGEMENT_CENTER_CAMPUS_VALUES.includes(campus.trim())

const isHrAdminDepartment = (department?: string | null) =>
  HR_ADMIN_DEPARTMENT_KEYWORDS.some((keyword) => normalizeText(department).includes(keyword))

const isChairmanPosition = (position?: string | null) => (position || '').trim() === '董事长'

const isVicePrincipalPosition = (position?: string | null) => normalizeText(position).includes('副校长')

const isDepartmentManagerPosition = (position?: string | null) =>
  ['主管', '经理', '总监', '部长', '主任', '负责人'].some((keyword) =>
    normalizeText(position).includes(keyword),
  )

const resolveCampusBucket = (campus?: string | null) => {
  const normalized = normalizeText(campus)
  if (!normalized) return ''
  if (isManagementCenterCampus(campus)) return 'management_center'
  if (normalized.includes('盛邦')) return 'shengbang'
  if (normalized.includes('冀美')) return 'jimei'
  if (normalized.includes('石美')) return 'shimei'
  if (normalized.includes('晋美')) return 'jinmei'
  if (normalized.includes('原美')) return 'yuanmei'
  if (normalized.includes('太美')) return 'taimei'
  if (normalized.includes('桂美')) return 'guimei'
  return ''
}

const isPrincipalPosition = (campus?: string | null, position?: string | null) => {
  const normalizedPosition = normalizeText(position)
  if (!normalizedPosition) return false

  const campusBucket = resolveCampusBucket(campus)
  if (campusBucket === 'jimei' && normalizedPosition === '副总监') {
    return true
  }
  if (campusBucket === 'yuanmei' && normalizedPosition === '执行副校长') {
    return true
  }
  return normalizedPosition.includes('校长') && !normalizedPosition.includes('副校长')
}

const campusMatchesScope = (userCampus?: string | null, selectedCampus?: string | null) => {
  if (!selectedCampus) return true
  if (!userCampus) return true
  if (isManagementCenterCampus(selectedCampus)) return isManagementCenterCampus(userCampus)
  return userCampus === selectedCampus
}

const shouldRequireChairman = (
  campus?: string | null,
  _department?: string | null,
  position?: string | null,
) => {
  if (isManagementCenterCampus(campus)) return true
  return isPrincipalPosition(campus, position)
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

const RegularizationApprovalConfigPanel: React.FC = () => {
  const { message } = App.useApp()
  const [configs, setConfigs] = useState<RegularizationApprovalConfig[]>([])
  const [users, setUsers] = useState<UserPermissionInfo[]>([])
  const [campuses, setCampuses] = useState<string[]>([])
  const [departments, setDepartments] = useState<string[]>([])
  const [positions, setPositions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingConfig, setEditingConfig] = useState<RegularizationApprovalConfig | null>(null)
  const [form] = Form.useForm()

  const loadData = async () => {
    try {
      setLoading(true)
      const [configRes, userRes, campusRes, departmentRes, positionRes] = await Promise.all([
        listRegularizationApprovalConfigs(),
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
      console.error('加载转正审批配置失败', error)
      message.error('加载转正审批配置失败')
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

  const openEdit = (record: RegularizationApprovalConfig) => {
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

  const stageOptions = useMemo(
    () =>
      selectedCampusIsManagementCenter
        ? STAGE_OPTIONS.filter(
            (item) => item.value !== 'vice_principal' && item.value !== 'principal',
          )
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
      ? scopedUsers.filter((item) => normalizeText(item.department) === normalizeText(selectedDepartment))
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
      return users.filter((item) => isChairmanPosition(item.position))
    }

    if (selectedStage === 'hr') {
      return users.filter(
        (item) =>
          isManagementCenterCampus(item.campus) &&
          isHrAdminDepartment(item.department) &&
          normalizeText(item.position).includes('总监'),
      )
    }

    if (selectedStage === 'vice_principal') {
      return scopedUsers.filter((item) => isVicePrincipalPosition(item.position))
    }

    if (selectedStage === 'principal') {
      return scopedUsers.filter((item) => isPrincipalPosition(selectedCampus, item.position))
    }

    if (selectedStage === 'department_head') {
      const normalizedDepartment = normalizeText(selectedDepartment)
      const normalizedPosition = normalizeText(selectedPosition)
      const targetNeedsSchoolLeader =
        !!normalizedPosition &&
        (isDepartmentManagerPosition(normalizedPosition) ||
          isVicePrincipalPosition(normalizedPosition) ||
          isPrincipalPosition(selectedCampus, normalizedPosition))

      if (targetNeedsSchoolLeader) {
        return scopedUsers.filter(
          (item) => isVicePrincipalPosition(item.position) || isPrincipalPosition(selectedCampus, item.position),
        )
      }

      if (normalizedDepartment) {
        const sameDepartmentManagers = scopedUsers.filter(
          (item) =>
            normalizeText(item.department) === normalizedDepartment &&
            isDepartmentManagerPosition(item.position),
        )
        if (sameDepartmentManagers.length) {
          return sameDepartmentManagers
        }
      }

      return scopedUsers.filter(
        (item) =>
          isDepartmentManagerPosition(item.position) ||
          isVicePrincipalPosition(item.position) ||
          isPrincipalPosition(selectedCampus, item.position),
      )
    }

    return scopedUsers
  }, [scopedUsers, selectedDepartment, selectedPosition, selectedStage, users])

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
    if (selectedStage !== 'chairman') return
    if (selectedApproverIds?.length) return
    if (filteredUsers.length !== 1) return
    form.setFieldValue('approverUserIds', [filteredUsers[0].user_id])
  }, [filteredUsers, form, selectedStage])

  useEffect(() => {
    if (
      !selectedCampusIsManagementCenter ||
      !['vice_principal', 'principal'].includes(selectedStage || '')
    ) {
      return
    }
    form.setFieldValue('stage', undefined)
  }, [form, selectedCampusIsManagementCenter, selectedStage])

  const approverOptions = filteredUsers.map((item) => ({
    label: `${item.name} / ${item.campus || '未设神殿'} / ${item.department || '未设部门'} / ${item.position || '未设岗位'}`,
    value: item.user_id,
  }))

  const submit = async () => {
    try {
      const values = await form.validateFields()
      const payload: RegularizationApprovalConfigPayload = {
        campus: values.campus,
        applyDepartment: values.applyDepartment || undefined,
        applyPosition: values.applyPosition || undefined,
        stage: values.stage,
        approverUserIds: values.approverUserIds,
        isActive: values.isActive,
      }
      await upsertRegularizationApprovalConfig(payload)
      message.success(editingConfig ? '转正审批配置已更新' : '转正审批配置已创建')
      setModalOpen(false)
      setEditingConfig(null)
      form.resetFields()
      await loadData()
    } catch (error) {
      if (isFormError(error)) return
      console.error('保存转正审批配置失败', error)
      message.error(getErrorDetail(error, '保存转正审批配置失败'))
    }
  }

  const handleDelete = async (record: RegularizationApprovalConfig) => {
    try {
      await deleteRegularizationApprovalConfig(record.id)
      message.success('转正审批配置已删除')
      await loadData()
    } catch (error) {
      console.error('删除转正审批配置失败', error)
      message.error(getErrorDetail(error, '删除转正审批配置失败'))
    }
  }

  const columns: ColumnsType<RegularizationApprovalConfig> = [
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
      width: 120,
      render: (value, record) => (
        <Space>
          <Tag color={record.stage === 'chairman' ? 'gold' : 'blue'}>{value}</Tag>
          {shouldRequireChairman(record.campus, record.applyDepartment, record.applyPosition) &&
          record.stage !== 'chairman' ? (
            <Tag color="orange">末尾董事长</Tag>
          ) : null}
        </Space>
      ),
    },
    {
      title: '审批人',
      width: 320,
      render: (_, record) =>
        record.approvers.length
          ? record.approvers.map((item) => item.approverName).join('、')
          : '未配置',
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
      title="转正审批配置"
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
          message="这里配置的是转正申请的默认审批人模板。申请人提交前可在申请单里逐环节搜索并调整审批人，系统会先按模板和 public.users 的神殿、部门、岗位规则预填写。默认审批链为：普通神殿 = 部门负责人 -> 副校长（命中部门规则时） -> 校长 -> 集团人力资源部；最高议事厅 = 部门负责人 -> 集团人力资源部 -> 董事长。最高议事厅申请和校长岗位申请会在末尾进入董事长审批。"
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
        title={editingConfig ? '编辑转正审批配置' : '新增转正审批配置'}
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

          {selectedCampusIsManagementCenter && selectedStage !== 'chairman' ? (
            <Alert
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
              message="最高议事厅转正审批固定为：部门负责人 -> 集团人力资源部 -> 董事长，不走副校长或校长环节。"
            />
          ) : null}

          {!selectedCampusIsManagementCenter &&
          shouldRequireChairman(selectedCampus, selectedDepartment, selectedPosition) &&
          selectedStage !== 'chairman' ? (
            <Alert
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
              message="当前范围命中董事长规则。即使这里配置的是前置审批阶段，实际流转时仍会在末尾追加董事长审批。"
            />
          ) : null}

          <Form.Item
            name="approverUserIds"
            label="审批人"
            rules={[{ required: true, message: '请至少选择一个审批人' }]}
            extra={
              selectedStage === 'chairman'
                ? '董事长阶段只能选择职位为“董事长”的人员。'
                : selectedStage === 'vice_principal'
                  ? '副校长阶段建议选择当前神殿副校长岗位人员，最终仍以后端神殿/部门规则校验为准。'
                : selectedStage === 'hr'
                  ? '集团人力资源部阶段只能选择最高议事厅人资总监。'
                  : selectedStage === 'principal'
                    ? '校长阶段只能选择当前神殿校长岗位人员。'
                    : '部门负责人阶段会按神殿、部门和岗位范围筛选负责人岗位人员。'
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

export default RegularizationApprovalConfigPanel
