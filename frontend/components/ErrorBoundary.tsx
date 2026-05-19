/**
 * 全局错误边界组件
 * 仅在生产环境（npm run build）生效
 * 捕获到错误后跳转到神殿信息页面
 */
import React, { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { Result, Button } from 'antd'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

// 神殿信息页面路径
const FALLBACK_PATH = '/'

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo })
    
    // 仅在生产环境记录错误
    if (import.meta.env.PROD) {
      console.error('[ErrorBoundary] 捕获到错误:', error)
      console.error('[ErrorBoundary] 错误堆栈:', errorInfo.componentStack)
      
      // 3秒后自动跳转到神殿信息页面
      setTimeout(() => {
        this.handleRedirect()
      }, 3000)
    }
  }

  handleRedirect = () => {
    // 清除错误状态
    this.setState({ hasError: false, error: null, errorInfo: null })
    // 跳转到神殿信息页面
    window.location.href = FALLBACK_PATH
  }

  handleRetry = () => {
    // 清除错误状态并重新渲染
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (this.state.hasError) {
      // 开发环境显示详细错误信息
      if (import.meta.env.DEV) {
        return (
          <div style={{ padding: 24 }}>
            <Result
              status="error"
              title="页面发生错误（开发环境）"
              subTitle={this.state.error?.message || '未知错误'}
              extra={[
                <Button key="retry" type="primary" onClick={this.handleRetry}>
                  重试
                </Button>,
                <Button key="home" onClick={this.handleRedirect}>
                  返回首页
                </Button>,
              ]}
            />
            <div style={{ 
              padding: 16, 
              background: '#f5f5f5', 
              borderRadius: 8,
              marginTop: 16,
              maxHeight: 400,
              overflow: 'auto',
            }}>
              <h4>错误详情：</h4>
              <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {this.state.error?.stack}
              </pre>
              <h4>组件堆栈：</h4>
              <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {this.state.errorInfo?.componentStack}
              </pre>
            </div>
          </div>
        )
      }

      // 生产环境显示简洁的错误页面，3秒后自动跳转
      return (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          background: '#f0f2f5',
        }}>
          <Result
            status="error"
            title="页面发生错误"
            subTitle="系统遇到了一些问题，正在为您跳转到首页..."
            extra={[
              <Button key="home" type="primary" onClick={this.handleRedirect}>
                立即返回首页
              </Button>,
            ]}
          />
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
