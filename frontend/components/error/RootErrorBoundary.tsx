import React from 'react'
import { Result, Button } from 'antd'

interface RootErrorBoundaryState {
  hasError: boolean
  error?: Error
}

class RootErrorBoundary extends React.Component<React.PropsWithChildren, RootErrorBoundaryState> {
  state: RootErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(error: Error): RootErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error('Global React Error Boundary Caught:', error, errorInfo)
    }
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <Result
          status="500"
          title="应用发生错误"
          subTitle={this.state.error?.message || '未知错误'}
          extra={
            <Button type="primary" onClick={this.handleReload}>
              重新加载
            </Button>
          }
        />
      )
    }
    return this.props.children
  }
}

export default RootErrorBoundary
