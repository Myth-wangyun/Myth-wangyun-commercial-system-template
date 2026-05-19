import React, { useState } from 'react'
import { Modal, Form, Input, App } from 'antd'
import { LockOutlined } from '@ant-design/icons'
import { authService } from '@/services/auth'

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

interface ChangePasswordModalProps {
  open: boolean
  onCancel: () => void
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ open, onCancel }) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const { message } = App.useApp()

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)

      await authService.changePassword({
        current_password: values.current_password,
        new_password: values.new_password,
      })

      message.success('密码修改成功，请牢记新密码并保管好自己的密码，下次需要用新密码完成登录哦！', 5)
      form.resetFields()
      onCancel()
    } catch (error: unknown) {
      message.error(getErrorMessage(error, '密码修改失败，请重试'))
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
      title="修改密码"
      open={open}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText="确认修改"
      cancelText="取消"
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        autoComplete="off"
        style={{ marginTop: 24 }}
      >
        <Form.Item
          label="当前密码"
          name="current_password"
          rules={[
            { required: true, message: '请输入当前密码' },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="请输入当前密码"
            autoComplete="current-password"
          />
        </Form.Item>

        <Form.Item
          label="新密码"
          name="new_password"
          rules={[
            { required: true, message: '请输入新密码' },
            { min: 6, message: '密码长度至少6位' },
            { max: 128, message: '密码长度不能超过128位' },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="请输入新密码（至少6位）"
            autoComplete="new-password"
          />
        </Form.Item>

        <Form.Item
          label="确认新密码"
          name="confirm_password"
          dependencies={['new_password']}
          rules={[
            { required: true, message: '请确认新密码' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('new_password') === value) {
                  return Promise.resolve()
                }
                return Promise.reject(new Error('两次输入的密码不一致'))
              },
            }),
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="请再次输入新密码"
            autoComplete="new-password"
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default ChangePasswordModal
