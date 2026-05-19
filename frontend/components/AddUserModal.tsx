import React, { useState } from 'react'
import { Modal, Form, Input, Select, App, Row, Col, DatePicker } from 'antd'
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons'
import api from '@/services/api'
import dayjs from 'dayjs'

const { Option } = Select

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (typeof error === 'object' && error !== null) {
    const maybeError = error as {
      message?: string
      response?: { data?: { detail?: string } }
    }
    return maybeError.response?.data?.detail || maybeError.message || fallback
  }
  return fallback
}

interface AddUserModalProps {
  open: boolean
  onCancel: () => void
  onSuccess?: () => void
}

interface CreateUserForm {
  username: string
  password: string
  confirm_password: string
  real_name: string
  email?: string
  phone?: string
  department?: string
  position?: string
  campus?: string
  role: string
  gender?: string
  entry_date?: dayjs.Dayjs
}

const AddUserModal: React.FC<AddUserModalProps> = ({ open, onCancel, onSuccess }) => {
  const [form] = Form.useForm<CreateUserForm>()
  const [loading, setLoading] = useState(false)
  const { message } = App.useApp()

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)

      // 构建请求数据
      const requestData = {
        username: values.username,
        password: values.password,
        real_name: values.real_name,
        email: values.email || null,
        phone: values.phone || null,
        department: values.department || null,
        position: values.position || null,
        campus: values.campus || null,
        role: values.role,
        gender: values.gender || null,
        entry_date: values.entry_date ? values.entry_date.format('YYYY-MM-DD') : null,
      }

      await api.post('/auth/users', requestData)

      message.success('用户创建成功！')
      form.resetFields()
      onCancel()
      onSuccess?.()
    } catch (error: unknown) {
      message.error(getErrorMessage(error, '用户创建失败，请重试'))
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    form.resetFields()
    onCancel()
  }

  return (
    <Modal
      title="添加用户账户"
      open={open}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText="创建用户"
      cancelText="取消"
      destroyOnClose
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        autoComplete="off"
        style={{ marginTop: 24 }}
        initialValues={{
          role: 'user',
        }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="用户名"
              name="username"
              rules={[
                { required: true, message: '请输入用户名' },
                { min: 3, message: '用户名至少3个字符' },
                { max: 50, message: '用户名不能超过50个字符' },
                { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线' },
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="请输入用户名"
                autoComplete="off"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="真实姓名"
              name="real_name"
              rules={[
                { required: true, message: '请输入真实姓名' },
                { max: 50, message: '姓名不能超过50个字符' },
              ]}
            >
              <Input placeholder="请输入真实姓名" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="密码"
              name="password"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 6, message: '密码长度至少6位' },
                { max: 128, message: '密码长度不能超过128位' },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="请输入密码（至少6位）"
                autoComplete="new-password"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="确认密码"
              name="confirm_password"
              dependencies={['password']}
              rules={[
                { required: true, message: '请确认密码' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve()
                    }
                    return Promise.reject(new Error('两次输入的密码不一致'))
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="请再次输入密码"
                autoComplete="new-password"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="角色"
              name="role"
              rules={[{ required: true, message: '请选择角色' }]}
            >
              <Select placeholder="请选择角色">
                <Option value="user">普通用户</Option>
                <Option value="manager">经理</Option>
                <Option value="admin">管理员</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="性别"
              name="gender"
            >
              <Select placeholder="请选择性别" allowClear>
                <Option value="男">男</Option>
                <Option value="女">女</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="神殿"
              name="campus"
            >
              <Select placeholder="请选择神殿" allowClear>
                <Option value="最高议事厅">最高议事厅</Option>
                <Option value="主神殿">主神殿</Option>
                <Option value="永恒殿">永恒殿</Option>
                <Option value="慈悲殿">慈悲殿</Option>
                <Option value="李大殿">李大殿</Option>
                <Option value="神恩殿">神恩殿</Option>
                <Option value="台美神殿">台美神殿</Option>
                <Option value="智慧阁">智慧阁</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="部门"
              name="department"
            >
              <Select placeholder="请选择部门" allowClear>
                <Option value="最高议事厅">最高议事厅</Option>
                <Option value="教学部">教学部</Option>
                <Option value="智慧司">智慧司</Option>
                <Option value="招生部">招生部</Option>
                <Option value="就业部">就业部</Option>
                <Option value="神藏司">神藏司</Option>
                <Option value="人事部">人事部</Option>
                <Option value="后勤部">后勤部</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="职位"
              name="position"
            >
              <Input placeholder="请输入职位" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="入职日期"
              name="entry_date"
            >
              <DatePicker style={{ width: '100%' }} placeholder="请选择入职日期" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="邮箱"
              name="email"
              rules={[
                { type: 'email', message: '请输入有效的邮箱地址' },
              ]}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder="请输入邮箱"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="手机号"
              name="phone"
              rules={[
                { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' },
              ]}
            >
              <Input
                prefix={<PhoneOutlined />}
                placeholder="请输入手机号"
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  )
}

export default AddUserModal
