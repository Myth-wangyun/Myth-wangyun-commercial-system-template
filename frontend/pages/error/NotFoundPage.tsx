import React from 'react'
import { Button, Result } from 'antd'
import { useNavigate } from 'react-router-dom'

/**
 * 404 页面 — 当用户访问不存在的路由时显示
 */
const NotFoundPage: React.FC = () => {
  const navigate = useNavigate()

  return (
    <Result
      status="404"
      title="404"
      subTitle="抱歉，您访问的页面不存在"
      extra={
        <Button type="primary" onClick={() => navigate('/', { replace: true })}>
          返回首页
        </Button>
      }
    />
  )
}

export default NotFoundPage
