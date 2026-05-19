import React, { useEffect, useRef } from 'react'
import { App, Card, Form, Input, Button, Checkbox, Typography, Spin } from 'antd'
import {
  UserOutlined,
  LockOutlined,
  EyeTwoTone,
  EyeInvisibleOutlined,
  CrownOutlined,
} from '@ant-design/icons'
import { useAuthStore } from '@/stores/authStore'
import { useNavigate, useLocation } from 'react-router-dom'
import './Login.css'

const { Title, Text } = Typography

const Login: React.FC = () => {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const login = useAuthStore((state) => state.login)
  const loading = useAuthStore((state) => state.loading)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!isAuthenticated) return

    const state = location.state as { from?: Location } | null
    const fromState = state?.from
    const storedRedirect = sessionStorage.getItem('auth.redirect')
    const redirectPath = fromState
      ? `${fromState.pathname}${fromState.search}${fromState.hash}`
      : storedRedirect

    if (redirectPath) {
      sessionStorage.removeItem('auth.redirect')
    }
    navigate(redirectPath || '/', { replace: true })
  }, [isAuthenticated, navigate, location.state])

  const handleLogin = async (values: {
    username: string
    password: string
    remember?: boolean
  }) => {
    try {
      await login(values.username, values.password, values.remember)
      message.success('登录成功')
      // 强制跳转避免页面停留
      setTimeout(() => navigate('/'), 100)
    } catch (err: any) {
      message.error(err?.message || '登录失败，请稍后重试')
    }
  }

  return (
    <div className="login-container">
      {/* 科技光芒效果 */}
      <div className="login-glow-orb login-glow-orb-1" />
      <div className="login-glow-orb login-glow-orb-2" />
      <div className="login-glow-orb login-glow-orb-3" />
      
      <Card className="login-card" bordered={false}>
        {/* Logo 区域 */}
        <div className="login-logo-area">
          <div className="login-logo-row">
            <CrownOutlined className="login-logo-icon" />
            <Title level={2} className="login-title">诸神殿</Title>
          </div>
          <Text className="login-subtitle">神祇管理系统</Text>
        </div>

        {/* 登录表单 */}
        <Form
          form={form}
          name="login"
          onFinish={handleLogin}
          className="login-form"
          layout="vertical"
          requiredMark={false}
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              prefix={<UserOutlined style={{ color: 'rgba(255,255,255,0.4)' }} />}
              placeholder="用户名"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: 'rgba(255,255,255,0.4)' }} />}
              placeholder="密码"
              size="large"
              iconRender={(visible) =>
                visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
              }
            />
          </Form.Item>

          <Form.Item>
            <div className="login-remember-row">
              <Form.Item name="remember" valuePropName="checked" noStyle>
                <Checkbox>记住密码</Checkbox>
              </Form.Item>
              <a className="login-forget-link">忘记密码？</a>
            </div>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              className="login-submit-btn"
              loading={loading}
              block
            >
              登 录
            </Button>
          </Form.Item>
        </Form>

        {/* 底部信息 */}
        <div className="login-footer">
          © 2024 诸神殿 · 神祇管理系统
        </div>
      </Card>
    </div>
  )
}

export default Login
