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
  deleteSocialInsuranceApprovalConfig,
  listSocialInsuranceApprovalConfigs,
  type SocialInsuranceApprovalConfig,
  type SocialInsuranceApprovalConfigPayload,
  type SocialInsuranceStage,
  upsertSocialInsuranceApprovalConfig,
} from '@/services/humanresources/socialInsuranceApplication'

const STAGE_OPTIONS: Array<{ label: string; value: SocialInsuranceStage }> = [
  { label: '部门主管', value: 'department_head' },
  { label: '人事部', value: 'hr' },
  { label: '校长', value: 'principal' },
  { label: '董事长', value: 'chairman' },
]

const SPECIAL_APPLY_POSITIONS = ['神殿校长']

const MANAGEMENT_CENTER_CAMPUS_VALUES = ['最高议事厅', '最高议事厅神殿']

const isManagementCenterCampus = (campus?: string | null) =>
  !!campus && MANAGEMENT_CENTER_CAMPUS_VALUES.includes(campus.trim())

const isHrAdminDepartment = (department?: string | null) =>
  !!department && department.replace(/\s+/g, '').includes('人资行政')

const isChairmanPosition = (position?: string | null) => !!position && position.trim() === '董事长'

const normalizeText = (value?: string | null) => (value || '').replace(/\s+/g, '')

const isDepartmentManagerPosition = (position?: string | null) =>
  ['主管', '经理', '总监', '部长', '主任', '负责人'].some((keyword) =>
    normalizeText(position).includes(keyword),
  )

const isSchoolLeaderPosition = (position?: string | null) =>
  ['校长', '副校长', '执行校长'].some((keyword) => normalizeText(position).includes(keyword))

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

const SocialInsuranceApprovalConfigPanel: React.FC = () => {
  const { message } = App.useApp()
  const [configs, setConfigs] = useState<SocialInsuranceApprovalConfig[]>([])
  const [users, setUsers] = useState<UserPermissionInfo[]>([])
  const [campuses, setCampuses] = useState<string[]>([])
  const [departments, setDepartments] = useState<string[]>([])
  const [positions, setPositions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingConfig, setEditingConfig] = useState<SocialInsuranceApprovalConfig | null>(null)
  const [form] = Form.useForm()

  const loadData = async () => {
    try {
      setLoading(true)
      const [configRes, userRes, campusRes, deptRes, posRes] = await Promise.all([
        listSocialInsuranceApprovalConfigs(),
        fetchUserPermissions(),
        fetchCampusOptions(),
        fetchDepartmentOptions(),
        fetchPositionOptions(),
      ])
      setConfigs(configRes)
      setUsers(userRes.filter((item) => item.status === 'active'))
      setCampuses(campusRes)
      setDepartments(deptRes)
      setPositions(posRes)
    } catch (error) {
      console.error('加载社保审批配置失败', error)
      message.error('加载社保审批配置失败')
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

  const openEdit = (record: SocialInsuranceApprovalConfig) => {
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
  const isSpecialChairmanScope =
    isManagementCenterCampus(selectedCampus) ||
    (selectedDepartment ? selectedDepartment.replace(/\s+/g, '').includes('市场') : false) ||
    (selectedPosition ? selectedPosition.replace(/\s+/g, '').includes('校长') : false)

  const filteredUsers = useMemo(() => {
    if (selectedStage === 'chairman') {
      return users.filter((item) => item.status === 'active' && isChairmanPosition(item.position))
    }

    if (selectedStage === 'hr') {
      return users.filter(
        (item) =>
          item.status === 'active' &&
          isManagementCenterCampus(item.campus) &&
          isHrAdminDepartment(item.department),
      )
    }

    const campusScopedUsers = !selectedCampus
      ? users
      : isManagementCenterCampus(selectedCampus)
        ? users.filter((item) => !item.campus || isManagementCenterCampus(item.campus))
        : users.filter((item) => !item.campus || item.campus === selectedCampus)

    if (selectedStage === 'department_head') {
      const normalizedPosition = normalizeText(selectedPosition)
      const normalizedDepartment = normalizeText(selectedDepartment)
      const positionNeedsSchoolLeader =
        !!normalizedPosition &&
        (isDepartmentManagerPosition(normalizedPosition) || isSchoolLeaderPosition(normalizedPosition))

      if (positionNeedsSchoolLeader) {
        return campusScopedUsers.filter(
          (item) => item.status === 'active' && isSchoolLeaderPosition(item.position),
        )
      }

      if (normalizedDepartment) {
        const sameDepartmentManagers = campusScopedUsers.filter(
          (item) =>
            item.status === 'active' &&
            normalizeText(item.department) === normalizedDepartment &&
            isDepartmentManagerPosition(item.position),
        )
        if (sameDepartmentManagers.length) {
          return sameDepartmentManagers
        }
      }

      return campusScopedUsers.filter(
        (item) =>
          item.status === 'active' &&
          (isDepartmentManagerPosition(item.position) || isSchoolLeaderPosition(item.position)),
      )
    }

    if (!selectedCampus) return users
    if (isManagementCenterCampus(selectedCampus)) {
      return users.filter((item) => !item.campus || isManagementCenterCampus(item.campus))
    }
    return users.filter((item) => !item.campus || item.campus === selectedCampus)
  }, [selectedCampus, selectedDepartment, selectedPosition, selectedStage, users])

  const filteredDepartments = useMemo(() => {
    if (!selectedCampus) return departments
    const campusDepartments = Array.from(
      new Set(
        users
          .filter((item) => item.status === 'active')
          .filter((item) =>
            isManagementCenterCampus(selectedCampus)
              ? !item.campus || isManagementCenterCampus(item.campus)
              : !item.campus || item.campus === selectedCampus,
          )
          .map((item) => item.department?.trim())
          .filter((item): item is string => !!item),
      ),
    ).sort((a, b) => a.localeCompare(b, 'zh-CN'))
    return campusDepartments.length ? campusDepartments : departments
  }, [departments, selectedCampus, users])

  const filteredPositions = useMemo(() => {
    const scopedUsers = users
      .filter((item) => item.status === 'active')
      .filter((item) => {
        if (!selectedCampus) return true
        if (isManagementCenterCampus(selectedCampus)) {
          return !item.campus || isManagementCenterCampus(item.campus)
        }
        return !item.campus || item.campus === selectedCampus
      })

    const departmentScopedUsers = selectedDepartment
      ? scopedUsers.filter((item) => item.department === selectedDepartment)
      : scopedUsers

    const scopedPositions = Array.from(
      new Set(
        [...departmentScopedUsers.map((item) => item.position?.trim()), ...SPECIAL_APPLY_POSITIONS].filter(
          (item): item is string => !!item,
        ),
      ),
    ).sort((a, b) => a.localeCompare(b, 'zh-CN'))

    if (scopedPositions.length) return scopedPositions
    if (selectedDepartment) return SPECIAL_APPLY_POSITIONS
    return Array.from(new Set([...positions, ...SPECIAL_APPLY_POSITIONS])).sort((a, b) =>
      a.localeCompare(b, 'zh-CN'),
    )
  }, [positions, selectedCampus, selectedDepartment, users])

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

  const userOptions = filteredUsers.map((item) => ({
    label: `${item.name} / ${item.campus || '未设神殿'} / ${item.department || '未设部门'} / ${item.position || '未设岗位'}`,
    value: item.user_id,
  }))

  const submit = async () => {
    try {
      const values = await form.validateFields()
      const payload: SocialInsuranceApprovalConfigPayload = {
        campus: values.campus,
        applyDepartment: values.applyDepartment || undefined,
        applyPosition: values.applyPosition || undefined,
        stage: values.stage,
        approverUserIds: values.approverUserIds,
        isActive: values.isActive,
      }

      if (values.stage === 'chairman') {
        const allowedUserIds = new Set(filteredUsers.map((item) => item.user_id))
        const hasInvalidApprover = values.approverUserIds.some(
          (item: number) => !allowedUserIds.has(item),
        )
        if (hasInvalidApprover) {
          message.error('董事长阶段只能选择 public.users 中职位为“董事长”的人员作为审批人')
          return
        }
      }

      if (values.stage === 'hr') {
        const allowedUserIds = new Set(filteredUsers.map((item) => item.user_id))
        const hasInvalidApprover = values.approverUserIds.some(
          (item: number) => !allowedUserIds.has(item),
        )
        if (hasInvalidApprover) {
          message.error('人事部阶段只能选择最高议事厅人资行政部人员作为审批人')
          return
        }
      }

      if (values.stage === 'department_head') {
        const allowedUserIds = new Set(filteredUsers.map((item) => item.user_id))
        const hasInvalidApprover = values.approverUserIds.some(
          (item: number) => !allowedUserIds.has(item),
        )
        if (hasInvalidApprover) {
          message.error('部门主管阶段只能选择当前岗位逻辑范围内的主管级审批人')
          return
        }
      }

      await upsertSocialInsuranceApprovalConfig(payload)
      message.success(editingConfig ? '审批配置更新成功' : '审批配置创建成功')
      setModalOpen(false)
      await loadData()
    } catch (error) {
      if (isFormError(error)) return
      console.error('保存社保审批配置失败', error)
      message.error(getErrorDetail(error, '保存社保审批配置失败'))
    }
  }

  const handleDelete = async (record: SocialInsuranceApprovalConfig) => {
    try {
      await deleteSocialInsuranceApprovalConfig(record.id)
      message.success('审批配置已删除')
      await loadData()
    } catch (error) {
      console.error('删除社保审批配置失败', error)
      message.error(getErrorDetail(error, '删除社保审批配置失败'))
    }
  }

  const columns: ColumnsType<SocialInsuranceApprovalConfig> = [
    {
      title: '神殿',
      dataIndex: 'campus',
      width: 140,
    },
    {
      title: '申请部门',
      dataIndex: 'applyDepartment',
      width: 160,
      render: (value?: string | null) => value || <Tag>全部部门</Tag>,
    },
    {
      title: '申请职位',
      dataIndex: 'applyPosition',
      width: 180,
      render: (value?: string | null) => value || <Tag>全部职位</Tag>,
    },
    {
      title: '审批阶段',
      dataIndex: 'stageLabel',
      width: 120,
    },
    {
      title: '审批人',
      key: 'approvers',
      width: 360,
      render: (_, record) => (
        <Space wrap>
          {record.approvers.map((item) => (
            <Tag key={item.id} color="blue">
              {item.approverName}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      width: 80,
      render: (value: boolean) => (
        <Tag color={value ? 'green' : 'default'}>{value ? '启用' : '停用'}</Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button size="small" type="link" onClick={() => openEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确认删除该审批配置？" onConfirm={() => handleDelete(record)}>
            <Button size="small" type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Alert
            type="info"
            showIcon
            message="社保审批默认模板"
            description="这里配置的是社保申请的默认审批人模板。申请人在填单时会先按模板和 public.users 的神殿、部门、职位规则自动预填写审批人，之后仍可在申请单里搜索并调整每个环节的审批人。默认流程为：部门主管 -> 人事部 -> 校长；市场部 / 最高议事厅 / 校长岗位提交后直接进入【董事长】审批。董事长阶段只允许从 public.users 中职位为董事长的人员中选择。"
          />
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              新增审批配置
            </Button>
          </Space>
          <Table
            rowKey="id"
            columns={columns}
            dataSource={configs}
            loading={loading}
            bordered
            pagination={{ pageSize: 10, showSizeChanger: true }}
            scroll={{ x: 1200 }}
          />
        </Space>
      </Card>

      <Modal
        title={editingConfig ? '编辑社保审批配置' : '新增社保审批配置'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={submit}
        okText="确定"
        cancelText="取消"
        destroyOnClose
        width={720}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="campus" label="神殿" rules={[{ required: true, message: '请选择神殿' }]}>
            <Select showSearch options={campuses.map((item) => ({ label: item, value: item }))} />
          </Form.Item>
          <Form.Item name="applyDepartment" label="申请部门" extra="留空表示全部部门">
            <Select
              allowClear
              showSearch
              options={filteredDepartments.map((item) => ({ label: item, value: item }))}
            />
          </Form.Item>
          <Form.Item name="applyPosition" label="申请职位" extra="留空表示全部职位">
            <AutoComplete
              allowClear
              options={filteredPositions.map((item) => ({ value: item }))}
              placeholder={selectedDepartment ? '可输入或选择当前部门职位，支持神殿校长' : '可输入或选择职位'}
              filterOption={(inputValue, option) =>
                String(option?.value || '')
                  .toLowerCase()
                  .includes(inputValue.trim().toLowerCase())
              }
            />
          </Form.Item>
          <Form.Item name="stage" label="审批阶段" rules={[{ required: true, message: '请选择审批阶段' }]}>
            <Select options={STAGE_OPTIONS} />
          </Form.Item>
          {isSpecialChairmanScope ? (
            <Alert
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
              message="当前范围命中特殊规则"
              description="市场部、最高议事厅、校长岗位的社保申请会直接进入董事长审批。当前范围下，只有【董事长】阶段配置会参与实际流转。"
            />
          ) : null}
          <Form.Item
            name="approverUserIds"
            label="审批人"
            rules={[{ required: true, message: '请至少选择一个审批人' }]}
            extra={
              selectedStage === 'hr'
                ? '人事部阶段只允许配置最高议事厅人资行政部人员；同一阶段支持配置多个审批人，当前实现为任一审批人通过即可继续流转。'
                : selectedStage === 'department_head'
                ? '部门主管阶段会根据申请岗位自动收敛候选审批人：普通岗位优先显示本部门主管岗，主管岗/校长岗优先显示校长岗。审批人必须绑定真实用户，支持输入关键字进行联想搜索。'
                : '同一阶段支持配置多个审批人；当前实现为同阶段任一审批人通过即可继续流转。'
            }
          >
            <Select
              mode="multiple"
              showSearch
              optionFilterProp="label"
              filterOption={(input, option) =>
                String(option?.label || '')
                  .toLowerCase()
                  .includes(input.trim().toLowerCase())
              }
              options={userOptions}
              placeholder={
                selectedStage === 'hr'
                  ? '请选择最高议事厅人资行政部审批人'
                  : selectedStage === 'department_head'
                  ? '请输入姓名/神殿/部门/岗位搜索审批人'
                  : '请选择审批人'
              }
            />
          </Form.Item>
          <Form.Item name="isActive" label="启用状态" valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="停用" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default SocialInsuranceApprovalConfigPanel
