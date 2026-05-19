import React, { useState, useEffect } from 'react'
import {
  Card,
  Form,
  Input,
  Button,
  Typography,
  Space,
  Result,
  message,
  Divider,
  Alert
} from 'antd'
import { LockOutlined, DatabaseOutlined, LoginOutlined } from '@ant-design/icons'
import { adminLogin, saveAdminToken, isAdminLoggedIn, clearAdminToken } from '@/services/god'
import './AdminLogin.css'

const { Title, Text, Paragraph } = Typography

const AdminLogin: React.FC = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (values: { username: string; password: string }) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await adminLogin(values.username, values.password)
      saveAdminToken(response.access_token)
      message.success(`欢迎回来，${response.admin.nickname}`)
      // 刷新页面以更新状态
      window.location.reload()
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || '登录失败，请检查账号密码'
      setError(errorMsg)
      message.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-login-container">
      <Card className="login-card">
        <div className="login-header">
          <DatabaseOutlined className="login-icon" />
          <Title level={3}>管理员登录</Title>
          <Text type="secondary">请输入管理员账号和密码</Text>
        </div>
        
        {error && (
          <Alert
            type="error"
            message={error}
            showIcon
            style={{ marginBottom: 24 }}
          />
        )}
        
        <Form
          form={form}
          layout="vertical"
          onFinish={handleLogin}
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入管理员账号' }]}
          >
            <Input
              prefix={<LockOutlined />}
              placeholder="管理员账号"
              autoComplete="username"
            />
          </Form.Item>
          
          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
              autoComplete="current-password"
            />
          </Form.Item>
          
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={<LoginOutlined />}
              block
            >
              登录
            </Button>
          </Form.Item>
        </Form>
        
        <Divider plain>
          <Text type="secondary" style={{ fontSize: 12 }}>原始数据管理</Text>
        </Divider>
        
        <Paragraph type="secondary" style={{ textAlign: 'center', fontSize: 12 }}>
          此区域用于访问数据库原始数据，需要管理员权限
        </Paragraph>
      </Card>
    </div>
  )
}

// 登出组件
export const AdminLogout: React.FC = () => {
  const handleLogout = () => {
    clearAdminToken()
    message.success('已退出管理员登录')
    window.location.reload()
  }

  return (
    <Button
      danger
      icon={<LockOutlined />}
      onClick={handleLogout}
      size="small"
    >
      退出管理
    </Button>
  )
}

export default AdminLogin
