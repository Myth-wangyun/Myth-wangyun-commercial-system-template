import React, { useEffect, useMemo } from 'react'
import { Button, Card, Typography, Space, Spin } from 'antd'
import { useRouteError, isRouteErrorResponse, useNavigate } from 'react-router-dom'
import { ReloadOutlined, HomeOutlined, FileSearchOutlined } from '@ant-design/icons'

const { Title, Text, Paragraph } = Typography

/**
 * 自动恢复的路由错误页。
 *
 * 核心思路：生产环境中偶发的页面加载失败（chunk 丢失、网络抖动等）
 * 只需要一次 reload 就能恢复。因此 AppRouteError 在首次触发时会自动
 * 静默 reload，用户感知仅为短暂的加载动画。只有当自动恢复后仍然出错
 * 时，才显示手动操作的错误页面。
 *
 * 每个 pathname 独立跟踪恢复状态（30 秒冷却），互不干扰。
 */
const RECOVERY_COOLDOWN = 30_000 // 30 秒内同一路径不重复自动 reload

const AppRouteError: React.FC = () => {
  const error = useRouteError()
  const navigate = useNavigate()

  const isResp = isRouteErrorResponse(error)

  // 判断是否应该自动刷新恢复
  const canAutoRecover = useMemo(() => {
    // 真正的 404（路由不存在）不要自动刷新，否则会无限循环
    if (isResp && error.status === 404) return false

    const key = `route_error_${window.location.pathname}`
    const last = sessionStorage.getItem(key)
    const now = Date.now()
    return !last || now - parseInt(last, 10) > RECOVERY_COOLDOWN
  }, [isResp, error])

  // 自动恢复：静默 reload
  useEffect(() => {
    if (canAutoRecover) {
      const key = `route_error_${window.location.pathname}`
      sessionStorage.setItem(key, String(Date.now()))
      console.warn('[AppRouteError] 页面加载出错，自动刷新恢复...', error)
      window.location.reload()
    }
  }, [canAutoRecover, error])

  // 正在自动恢复中 —— 只显示全屏加载动画
  if (canAutoRecover) {
    return (
      <Spin
        spinning
        tip="页面加载中，请稍候..."
        size="large"
        style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(255,255,255,0.85)',
          zIndex: 9999,
        }}
      />
    )
  }

  // ── 以下为手动恢复的错误页面（仅在自动恢复失败后才会展示） ──

  const status = isResp ? error.status : undefined
  const statusText = isResp ? error.statusText : undefined

  const message = (() => {
    if (isResp) return `请求出错: ${status} ${statusText}`
    if (error instanceof Error) return error.message
    return '发生未知错误'
  })()

  const devDetails = (() => {
    if (import.meta.env.DEV) {
      if (error instanceof Error) {
        return <details style={{ whiteSpace: 'pre-wrap', marginTop: 16 }}>{error.stack}</details>
      }
      try {
        return <pre style={{ marginTop: 16 }}>{JSON.stringify(error, null, 2)}</pre>
      } catch {
        return null
      }
    }
    return null
  })()

  const handleRetry = () => {
    // 清除恢复记录，允许下次再次自动恢复
    sessionStorage.removeItem(`route_error_${window.location.pathname}`)
    window.location.reload()
  }

  return (
    <div style={{ padding: 40, display: 'flex', justifyContent: 'center' }}>
      <Card style={{ maxWidth: 720, width: '100%' }}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Title level={3} style={{ marginBottom: 0 }}>
            <FileSearchOutlined style={{ marginRight: 8 }} /> 哎呀，页面加载失败了
          </Title>
          <Text type="secondary">
            可能的原因：网络波动、系统更新后缓存未刷新、或服务器暂时不可用。
          </Text>

          <Paragraph style={{ marginBottom: 0 }}>
            <Text strong>错误信息：</Text> {message}
          </Paragraph>

          <Space>
            <Button type="primary" icon={<ReloadOutlined />} onClick={handleRetry}>
              重试加载
            </Button>
            <Button icon={<HomeOutlined />} onClick={() => navigate('/')}>
              返回首页
            </Button>
          </Space>

          <Paragraph type="secondary" style={{ fontSize: 12, marginTop: 8 }}>
            如果多次重试仍失败，请尝试：1) 清空浏览器缓存（Ctrl+Shift+Delete）
            2) 确认网络连接正常 3) 联系管理员检查系统状态。
          </Paragraph>
          {devDetails}
        </Space>
      </Card>
    </div>
  )
}

export default AppRouteError
