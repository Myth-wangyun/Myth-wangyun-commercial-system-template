import React, { useEffect, useMemo, useState } from 'react'
import { App,
  Alert,
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
  deleteRecruitmentApprovalConfig,
  listRecruitmentApprovalConfigs,
  type RecruitmentApprovalConfig,
  type RecruitmentApprovalConfigPayload,
  type RecruitmentStage,
  upsertRecruitmentApprovalConfig,
} from '@/services/humanresources/recruitmentRequest'

const STAGE_OPTIONS: Array<{ label: string; value: RecruitmentStage }> = [
  { label: '部门负责人', value: 'department_head' },
  { label: '校长', value: 'principal' },
  { label: '人资总监', value: 'hr_director' },
  { label: '董事长', value: 'chairman' },
]

const MANAGEMENT_CENTER_CAMPUS_VALUES = ['最高议事厅', '最高议事厅神殿']

const isManagementCenterCampus = (campus?: string | null) =>
  !!campus && MANAGEMENT_CENTER_CAMPUS_VALUES.includes(campus.trim())

const isHrAdminDepartment = (department?: string | null) =>
  !!department && department.replace(/\s+/g, '').includes('人资行政')

const isChairmanPosition = (position?: string | null) => !!position && position.trim() === '董事长'

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

const RecruitmentApprovalConfigPanel: React.FC = () => {
  const { message } = App.useApp()
  const [configs, setConfigs] = useState<RecruitmentApprovalConfig[]>([])
  const [users, setUsers] = useState<UserPermissionInfo[]>([])
  const [campuses, setCampuses] = useState<string[]>([])
  const [departments, setDepartments] = useState<string[]>([])
  const [positions, setPositions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingConfig, setEditingConfig] = useState<RecruitmentApprovalConfig | null>(null)
  const [form] = Form.useForm()

  const loadData = async () => {
    try {
      setLoading(true)
      const [configRes, userRes, campusRes, deptRes, posRes] = await Promise.all([
        listRecruitmentApprovalConfigs(),
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
      console.error('加载招聘审批配置失败', error)
      message.error('加载招聘审批配置失败')
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
    form.setFieldsValue({
      isActive: true,
      approverUserIds: [],
    })
    setModalOpen(true)
  }

  const openEdit = (record: RecruitmentApprovalConfig) => {
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
  const filteredUsers = useMemo(() => {
    if (selectedStage === 'hr_director') {
      return users.filter(
        (item) =>
          item.status === 'active' &&
          isManagementCenterCampus(item.campus) &&
          isHrAdminDepartment(item.department),
      )
    }

    if (selectedStage === 'chairman') {
      return users.filter((item) => item.status === 'active' && isChairmanPosition(item.position))
    }

    if (!selectedCampus) return users
    return users.filter((item) => !item.campus || item.campus === selectedCampus)
  }, [selectedCampus, selectedStage, users])

  const filteredDepartments = useMemo(() => {
    if (!selectedCampus) return departments
    const campusDepartments = Array.from(
      new Set(
        users
          .filter((item) => item.status === 'active')
          .filter((item) => !item.campus || item.campus === selectedCampus)
          .map((item) => item.department?.trim())
          .filter((item): item is string => !!item),
      ),
    ).sort((a, b) => a.localeCompare(b, 'zh-CN'))
    return campusDepartments.length ? campusDepartments : departments
  }, [departments, selectedCampus, users])

  const filteredPositions = useMemo(() => {
    const scopedUsers = users
      .filter((item) => item.status === 'active')
      .filter((item) => !selectedCampus || !item.campus || item.campus === selectedCampus)

    const departmentScopedUsers = selectedDepartment
      ? scopedUsers.filter((item) => item.department === selectedDepartment)
      : scopedUsers

    const scopedPositions = Array.from(
      new Set(
        departmentScopedUsers
          .map((item) => item.position?.trim())
          .filter((item): item is string => !!item),
      ),
    ).sort((a, b) => a.localeCompare(b, 'zh-CN'))

    if (scopedPositions.length) {
      return scopedPositions
    }

    if (selectedDepartment) {
      return []
    }

    return positions
  }, [positions, selectedCampus, selectedDepartment, users])

  useEffect(() => {
    if (!selectedPosition) return
    if (!filteredPositions.includes(selectedPosition)) {
      form.setFieldValue('applyPosition', undefined)
    }
  }, [filteredPositions, form, selectedPosition])

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
      const payload: RecruitmentApprovalConfigPayload = {
        campus: values.campus,
        applyDepartment: values.applyDepartment || undefined,
        applyPosition: values.applyPosition || undefined,
        stage: values.stage,
        approverUserIds: values.approverUserIds,
        isActive: values.isActive,
      }

      if (values.stage === 'hr_director') {
        const allowedUserIds = new Set(filteredUsers.map((item) => item.user_id))
        const hasInvalidApprover = values.approverUserIds.some(
          (item: number) => !allowedUserIds.has(item),
        )
        if (hasInvalidApprover) {
          message.error('人资总监阶段只能选择最高议事厅人资行政部门人员作为审批人')
          return
        }
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

      await upsertRecruitmentApprovalConfig(payload)
      message.success(editingConfig ? '审批配置更新成功' : '审批配置创建成功')
      setModalOpen(false)
      await loadData()
    } catch (error) {
      if (isFormError(error)) return
      console.error('保存招聘审批配置失败', error)
      message.error(getErrorDetail(error, '保存招聘审批配置失败'))
    }
  }

  const handleDelete = async (record: RecruitmentApprovalConfig) => {
    try {
      await deleteRecruitmentApprovalConfig(record.id)
      message.success('审批配置已删除')
      await loadData()
    } catch (error) {
      console.error('删除招聘审批配置失败', error)
      message.error(getErrorDetail(error, '删除招聘审批配置失败'))
    }
  }

  const columns: ColumnsType<RecruitmentApprovalConfig> = [
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
          <Popconfirm
            title="确认删除该审批配置？"
            onConfirm={() => handleDelete(record)}
            okText="确认"
            cancelText="取消"
          >
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
            message="招聘审批默认模板"
            description="这里配置的是招聘需求申请的默认审批人模板。申请人在填单时会先按模板和 public.users 的神殿、部门、职位规则自动预填写审批人，之后仍可在申请单里搜索并调整每个环节的审批人。申请部门或申请职位留空时，表示该阶段对当前神殿全部部门/职位生效；最高议事厅的招聘申请会优先按发起人的 department 和 position 自动判断流程；人资总监阶段只允许从最高议事厅人资相关部门中职位包含“总监”的人员选择，董事长阶段只允许从 public.users 中职位为“董事长”的人员选择。"
          />

          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              新增审批配置
            </Button>
          </Space>

          <Table
            rowKey="id"
            columns={columns}
            dataSource={configs}
            loading={loading}
            scroll={{ x: 1100 }}
            pagination={{
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条`,
            }}
          />
        </Space>
      </Card>

      <Modal
        title={editingConfig ? '编辑招聘审批配置' : '新增招聘审批配置'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={submit}
        destroyOnClose
        width={720}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="campus" label="神殿" rules={[{ required: true, message: '请选择神殿' }]}>
            <Select
              placeholder="请选择神殿"
              options={[
                { label: '最高议事厅', value: '最高议事厅' },
                ...campuses.map((item) => ({ label: item, value: item })),
              ]}
            />
          </Form.Item>

          <Form.Item name="applyDepartment" label="申请部门" extra="留空表示全部部门">
            <Select
              showSearch
              allowClear
              placeholder="请选择或留空"
              options={filteredDepartments.map((item) => ({ label: item, value: item }))}
            />
          </Form.Item>

          <Form.Item name="applyPosition" label="申请职位" extra="留空表示全部职位">
            <Select
              showSearch
              allowClear
              placeholder={selectedDepartment ? '请选择当前部门下的职位或留空' : '请选择或留空'}
              options={filteredPositions.map((item) => ({ label: item, value: item }))}
              notFoundContent={selectedDepartment ? '当前部门下暂无职位数据' : '暂无职位数据'}
            />
          </Form.Item>

          <Form.Item
            name="stage"
            label="审批阶段"
            rules={[{ required: true, message: '请选择审批阶段' }]}
          >
            <Select options={STAGE_OPTIONS} />
          </Form.Item>

          <Form.Item
            name="approverUserIds"
            label="审批人"
            rules={[{ required: true, message: '请至少选择一个审批人' }]}
            extra={
              selectedStage === 'hr_director'
                ? '人资总监阶段只允许配置最高议事厅人资相关部门中职位包含“总监”的人员；同一阶段支持配置多个审批人，当前实现为任一审批人通过即可流转到下一阶段。'
                : selectedStage === 'chairman'
                  ? '董事长阶段只允许配置 public.users 中职位为“董事长”的人员；如果系统中只有 1 名董事长，会自动预填。'
                  : '同一阶段支持配置多个审批人；当前实现为同阶段任一审批人通过即可流转到下一阶段。'
            }
          >
            <Select
              mode="multiple"
              showSearch
              placeholder={
                selectedStage === 'hr_director'
                  ? '请选择最高议事厅人资行政部门审批人'
                  : selectedStage === 'chairman'
                    ? '请选择职位为董事长的审批人'
                    : '请选择审批人'
              }
              options={userOptions}
              optionFilterProp="label"
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

export default RecruitmentApprovalConfigPanel
