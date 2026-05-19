import React, { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { Result, Button } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { monitoring } from '../../utils/monitoring'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 记录错误到监控服务
    monitoring.captureError({
      message: error.message,
      stack: error.stack,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    })

    this.setState({
      error,
      errorInfo,
    })
  }

  handleReload = () => {
    window.location.reload()
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      // 自定义错误UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      // 默认错误UI
      return (
        <Result
          status="error"
          title="页面出现错误"
          subTitle="抱歉，页面遇到了一个错误。请尝试刷新页面或联系技术支持。"
          extra={[
            <Button type="primary" key="reload" icon={<ReloadOutlined />} onClick={this.handleReload}>
              刷新页面
            </Button>,
            <Button key="reset" onClick={this.handleReset}>
              重试
            </Button>,
          ]}
        >
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <div style={{ textAlign: 'left', marginTop: 20 }}>
              <details>
                <summary>错误详情 (开发模式)</summary>
                <pre
                  style={{
                    background: '#f5f5f5',
                    padding: 10,
                    borderRadius: 4,
                    overflow: 'auto',
                    maxHeight: 300,
                    fontSize: 12,
                  }}
                >
                  {this.state.error.stack}
                </pre>
                {this.state.errorInfo && (
                  <pre
                    style={{
                      background: '#f5f5f5',
                      padding: 10,
                      borderRadius: 4,
                      overflow: 'auto',
                      maxHeight: 300,
                      fontSize: 12,
                      marginTop: 10,
                    }}
                  >
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </details>
            </div>
          )}
        </Result>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
