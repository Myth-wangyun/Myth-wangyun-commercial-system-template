import React, { useEffect, useState } from 'react'
import { App,
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  AutoComplete,
  Tag,
  Row,
  Col,
  Alert,
  Tooltip,
  Popconfirm,
  Tabs,
} from 'antd'
import { InfoCircleOutlined, ReloadOutlined, PlusOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import {
  fetchUserPermissions,
  updateUserPermission,
  createUserEmployee,
  deleteUserEmployee,
  fetchDepartmentOptions,
  fetchPositionOptions,
  fetchCampusOptions,
  type UserPermissionInfo,
} from '@/services/configMaster'
import { useAuthStore } from '@/stores/authStore'
import RecruitmentApprovalConfigPanel from './RecruitmentApprovalConfigPanel'
import PromotionApprovalConfigPanel from './PromotionApprovalConfigPanel'
import RegularizationApprovalConfigPanel from './RegularizationApprovalConfigPanel'
import SocialInsuranceApprovalConfigPanel from './SocialInsuranceApprovalConfigPanel'

const { Option } = Select

/** 职位对应的权限说明 */
const POSITION_PERMISSION_DESC: Record<string, string> = {
  董事长: '可访问所有菜单和数据',
  学术总监: '可访问所有菜单和数据',
  教质总监: '可访问教化司及公共菜单',
}

/** 部门对应的权限说明 */
const DEPARTMENT_PERMISSION_DESC: Record<string, string> = {
  智慧司: '可访问智慧司菜单 + 公共菜单 + 教化司班档案表',
  教化司: '可访问教化司菜单 + 公共菜单',
  祈福司: '可访问祈福司菜单 + 公共菜单',
  市场部: '可访问市场部菜单 + 公共菜单',
  人资行政部: '可访问人资部菜单 + 公共菜单',
  神藏司: '可访问神藏司菜单 + 公共菜单',
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
  detail?: string
}

const isFormError = (error: unknown): error is FormError =>
  typeof error === 'object' && error !== null && 'errorFields' in error

const getErrorDetail = (error: unknown, fallback: string) => {
  const maybeError = error as ErrorWithResponse
  return maybeError.response?.data?.detail || maybeError.detail || fallback
}

const EmployeeManagePage: React.FC = () => {
  const { message, modal } = App.useApp()
  const [users, setUsers] = useState<UserPermissionInfo[]>([])
  const [departments, setDepartments] = useState<string[]>([])
  const [positions, setPositions] = useState<string[]>([])
  const [campuses, setCampuses] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [searchName, setSearchName] = useState<string>('')
  const [searchDepartment, setSearchDepartment] = useState<string | undefined>()
  const [searchPosition, setSearchPosition] = useState<string | undefined>()
  const [searchCampus, setSearchCampus] = useState<string | undefined>()
  const [editModal, setEditModal] = useState<{
    open: boolean
    record?: UserPermissionInfo
  }>({
    open: false,
  })
  const [createModal, setCreateModal] = useState<boolean>(false)

  const [editForm] = Form.useForm()
  const [createForm] = Form.useForm()

  // 获取当前登录用户的刷新方法
  const { user: currentUser, refreshUserInfo } = useAuthStore()

  const loadData = async () => {
    try {
      setLoading(true)
      const [userRes, deptRes, posRes, campusRes] = await Promise.all([
        fetchUserPermissions({
          name: searchName || undefined,
          department: searchDepartment,
          position: searchPosition,
          campus: searchCampus,
        }),
        fetchDepartmentOptions(),
        fetchPositionOptions(),
        fetchCampusOptions(),
      ])
      setUsers(userRes)
      setDepartments(deptRes)
      setPositions(posRes)
      setCampuses(campusRes)
    } catch (error) {
      console.error('加载数据失败', error)
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [searchName, searchDepartment, searchPosition, searchCampus])

  const openEditForm = (record: UserPermissionInfo) => {
    setEditModal({ open: true, record })
    editForm.setFieldsValue({
      department: record.department,
      position: record.position,
      campus: record.campus,
      phone: record.phone,
      email: record.email,
      status: record.status,
    })
  }

  const openCreateForm = () => {
    setCreateModal(true)
    createForm.resetFields()
  }

  const submitCreate = async () => {
    try {
      const values = await createForm.validateFields()
      const result = await createUserEmployee(values)
      message.success(result.message || '员工创建成功')
      setCreateModal(false)
      await loadData()
    } catch (error) {
      if (isFormError(error)) return
      console.error('创建员工失败', error)
      message.error(getErrorDetail(error, '创建员工失败'))
    }
  }

  const submitEdit = async () => {
    if (!editModal.record) return

    try {
      const values = await editForm.validateFields()
      const result = await updateUserPermission(editModal.record.user_id, values)

      message.success(result.message || '权限配置已更新')
      setEditModal({ open: false })

      // 如果修改的是当前登录用户，自动刷新用户信息
      if (currentUser && editModal.record.user_id === parseInt(currentUser.id)) {
        try {
          await refreshUserInfo()
          message.info('您的权限配置已更新，菜单已刷新')
        } catch {
          // 如果自动刷新失败，提示手动刷新
          modal.confirm({
            title: '您修改了自己的权限配置',
            content: '自动刷新失败，建议您重新登录或刷新页面以使新权限生效。',
            okText: '刷新页面',
            cancelText: '稍后处理',
            onOk: () => {
              window.location.reload()
            },
          })
        }
      }

      await loadData()
    } catch (error) {
      if (isFormError(error)) return
      message.error('保存失败')
    }
  }

  const handleDelete = async (record: UserPermissionInfo) => {
    try {
      const result = await deleteUserEmployee(record.user_id)
      message.success(result.message || '员工已删除')
      await loadData()
    } catch (error) {
      console.error('删除员工失败', error)
      message.error('删除员工失败')
    }
  }

  /** 获取权限说明文字 */
  const getPermissionDesc = (record: UserPermissionInfo): string => {
    // 先检查职位
    if (record.position && POSITION_PERMISSION_DESC[record.position]) {
      return POSITION_PERMISSION_DESC[record.position]
    }
    // 再检查部门
    if (record.department && DEPARTMENT_PERMISSION_DESC[record.department]) {
      return DEPARTMENT_PERMISSION_DESC[record.department]
    }
    return '根据部门和职位配置访问权限'
  }

  const columns: ColumnsType<UserPermissionInfo> = [
    {
      title: '员工姓名',
      dataIndex: 'name',
      width: 120,
      fixed: 'left',
    },
    {
      title: '部门',
      dataIndex: 'department',
      width: 120,
      render: (dept: string | null) => dept || <span style={{ color: '#999' }}>未设置</span>,
    },
    {
      title: '职位',
      dataIndex: 'position',
      width: 120,
      render: (pos: string | null) => {
        if (!pos) return <span style={{ color: '#999' }}>未设置</span>
        // 高级职位显示特殊颜色
        if (pos === '董事长' || pos === '学术总监') {
          return <Tag color="gold">{pos}</Tag>
        }
        return pos
      },
    },
    {
      title: '联系方式',
      dataIndex: 'phone',
      width: 130,
      render: (phone: string | null) => phone || '无',
    },
    {
      title: '神殿',
      dataIndex: 'campus',
      width: 120,
      render: (campus: string | null) => campus || <span style={{ color: '#999' }}>未设置</span>,
    },
    {
      title: (
        <span>
          访问权限说明{' '}
          <Tooltip title="根据部门和职位自动计算的菜单访问权限">
            <InfoCircleOutlined style={{ color: '#1890ff' }} />
          </Tooltip>
        </span>
      ),
      key: 'permission_desc',
      width: 250,
      render: (_, record) => (
        <span style={{ fontSize: 12, color: '#666' }}>{getPermissionDesc(record)}</span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? '在职' : '离职'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button size="small" type="link" onClick={() => openEditForm(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确认删除该员工？"
            description="删除后员工将被设置为离职状态"
            onConfirm={() => handleDelete(record)}
            okText="确认"
            cancelText="取消"
          >
            <Button size="small" type="link" danger disabled={record.is_superuser}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const employeeManageContent = (
    <div style={{ padding: 24 }}>
      <Card>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Alert
            message="员工权限管理"
            description={
              <div>
                <p style={{ marginBottom: 8 }}>
                  在此页面配置员工的<strong>部门</strong>、<strong>职位</strong>和
                  <strong>神殿</strong>， 系统会根据这些信息自动控制该员工能访问的菜单和数据范围。
                </p>
                <p style={{ marginBottom: 0 }}>
                  <strong>权限规则：</strong>
                  <ul style={{ margin: '4px 0', paddingLeft: 20 }}>
                    <li>
                      <Tag color="gold">董事长</Tag>
                      <Tag color="gold">学术总监</Tag> 可访问所有内容
                    </li>
                    <li>
                      <Tag>智慧司</Tag> 可访问智慧司菜单 + 教化司的班档案表
                    </li>
                    <li>
                      <Tag>教化司</Tag> 可访问教化司菜单
                    </li>
                    <li>其他部门：只能访问本部门菜单和公共菜单</li>
                  </ul>
                </p>
              </div>
            }
            type="info"
            showIcon
          />

          <Space style={{ marginBottom: 12 }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreateForm}>
              新增员工
            </Button>
          </Space>

          <Row gutter={16}>
            <Col span={5}>
              <Input
                placeholder="按姓名搜索"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                allowClear
              />
            </Col>
            <Col span={5}>
              <Select
                placeholder="选择部门"
                value={searchDepartment}
                onChange={setSearchDepartment}
                allowClear
                style={{ width: '100%' }}
              >
                {departments.map((dept) => (
                  <Option key={dept} value={dept}>
                    {dept}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col span={5}>
              <Select
                placeholder="选择职位"
                value={searchPosition}
                onChange={setSearchPosition}
                allowClear
                style={{ width: '100%' }}
              >
                {positions.map((pos) => (
                  <Option key={pos} value={pos}>
                    {pos}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col span={5}>
              <Select
                placeholder="选择神殿"
                value={searchCampus}
                onChange={setSearchCampus}
                allowClear
                style={{ width: '100%' }}
              >
                <Option value="最高议事厅">最高议事厅</Option>
                {campuses.map((c) => (
                  <Option key={c} value={c}>
                    {c}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col span={4}>
              <Button icon={<ReloadOutlined />} onClick={loadData}>
                刷新
              </Button>
            </Col>
          </Row>

          <Table
            rowKey="user_id"
            columns={columns}
            dataSource={users}
            loading={loading}
            scroll={{ x: 1200 }}
            pagination={{
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条`,
            }}
          />
        </Space>

        <Modal
          title={`编辑权限配置 - ${editModal.record?.name}`}
          open={editModal.open}
          onCancel={() => setEditModal({ open: false })}
          onOk={submitEdit}
          destroyOnClose
          width={500}
        >
          <Alert
            message="修改说明"
            description="修改部门或职位后，该用户的菜单访问权限会立即改变。用户需要重新登录或刷新页面才能看到更新后的菜单。"
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <Form form={editForm} layout="vertical">
            <Form.Item
              name="department"
              label="部门"
              rules={[{ required: true, message: '请选择部门' }]}
              help="部门决定用户可以访问哪些模块的菜单"
            >
              <Select placeholder="请选择部门" showSearch allowClear>
                {departments.map((dept) => (
                  <Option key={dept} value={dept}>
                    {dept}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="position"
              label="职位"
              rules={[{ required: true, message: '请输入或选择职位' }]}
              help="董事长、学术总监可访问所有内容；其他职位按部门限制"
            >
              <AutoComplete
                options={positions.map((pos) => ({ value: pos }))}
                placeholder="可自由输入或选择职位"
                allowClear
                filterOption={(inputValue, option) =>
                  (option?.value || '').toLowerCase().includes(inputValue.toLowerCase())
                }
              />
            </Form.Item>

            <Form.Item
              name="campus"
              label="所属神殿"
              help="神殿决定用户可以查看和操作哪个神殿的数据"
            >
              <Select placeholder="选择神殿" allowClear>
                <Option value="最高议事厅">最高议事厅</Option>
                {campuses.map((c) => (
                  <Option key={c} value={c}>
                    {c}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item name="phone" label="联系电话">
              <Input placeholder="请输入联系电话" />
            </Form.Item>

            <Form.Item name="email" label="邮箱">
              <Input placeholder="请输入邮箱" />
            </Form.Item>

            <Form.Item
              name="status"
              label="在职状态"
              rules={[{ required: true, message: '请选择在职状态' }]}
            >
              <Select placeholder="选择在职状态">
                <Option value="active">在职</Option>
                <Option value="inactive">离职</Option>
              </Select>
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title="新增员工"
          open={createModal}
          onCancel={() => setCreateModal(false)}
          onOk={submitCreate}
          destroyOnClose
          width={600}
        >
          <Alert
            message="创建说明"
            description="创建新员工账户，密码将使用与系统相同的加密算法存储。员工创建后默认为在职状态。"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <Form form={createForm} layout="vertical">
            <Form.Item
              name="username"
              label="用户名"
              rules={[{ required: true, message: '请输入用户名' }]}
              help="用于登录系统的账号，创建后不可修改"
            >
              <Input placeholder="请输入用户名" />
            </Form.Item>

            <Form.Item
              name="password"
              label="密码"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 6, message: '密码至少6位' },
              ]}
              help="密码至少6位，将使用加密算法存储"
            >
              <Input.Password placeholder="请输入密码" />
            </Form.Item>

            <Form.Item
              name="real_name"
              label="员工姓名"
              rules={[{ required: true, message: '请输入员工姓名' }]}
            >
              <Input placeholder="请输入员工真实姓名" />
            </Form.Item>

            <Form.Item
              name="department"
              label="部门"
              rules={[{ required: true, message: '请选择部门' }]}
            >
              <Select placeholder="请选择部门" showSearch>
                {departments.map((dept) => (
                  <Option key={dept} value={dept}>
                    {dept}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="position"
              label="职位"
              rules={[{ required: true, message: '请输入或选择职位' }]}
            >
              <AutoComplete
                options={positions.map((pos) => ({ value: pos }))}
                placeholder="可自由输入或选择职位"
                filterOption={(inputValue, option) =>
                  (option?.value || '').toLowerCase().includes(inputValue.toLowerCase())
                }
              />
            </Form.Item>

            <Form.Item name="campus" label="所属神殿">
              <Select placeholder="选择神殿" allowClear>
                <Option value="最高议事厅">最高议事厅</Option>
                {campuses.map((c) => (
                  <Option key={c} value={c}>
                    {c}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item name="phone" label="联系电话">
              <Input placeholder="请输入联系电话" />
            </Form.Item>

            <Form.Item
              name="email"
              label="邮箱"
              rules={[{ type: 'email', message: '请输入有效的邮箱地址' }]}
            >
              <Input placeholder="请输入邮箱" />
            </Form.Item>

            <Form.Item name="gender" label="性别">
              <Select placeholder="选择性别" allowClear>
                <Option value="男">男</Option>
                <Option value="女">女</Option>
              </Select>
            </Form.Item>
          </Form>
        </Modal>
      </Card>
    </div>
  )

  return (
    <Tabs
      defaultActiveKey="employee-manage"
      items={[
        {
          key: 'employee-manage',
          label: '员工管理',
          children: employeeManageContent,
        },
        {
          key: 'recruitment-approval-config',
          label: '招聘审批配置',
          children: <RecruitmentApprovalConfigPanel />,
        },
        {
          key: 'social-insurance-approval-config',
          label: '社保审批配置',
          children: <SocialInsuranceApprovalConfigPanel />,
        },
        {
          key: 'regularization-approval-config',
          label: '转正审批配置',
          children: <RegularizationApprovalConfigPanel />,
        },
        {
          key: 'promotion-approval-config',
          label: '晋升审批配置',
          children: <PromotionApprovalConfigPanel />,
        },
      ]}
    />
  )
}

export default EmployeeManagePage
