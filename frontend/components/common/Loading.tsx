import React from 'react'
import { Spin, Card } from 'antd'
import { LoadingOutlined } from '@ant-design/icons'

interface LoadingProps {
  loading: boolean
  children?: React.ReactNode
  tip?: string
  size?: 'small' | 'default' | 'large'
  style?: React.CSSProperties
  className?: string
  spinning?: boolean
}

const Loading: React.FC<LoadingProps> = ({
  loading,
  children,
  tip = '加载中...',
  size = 'default',
  style,
  className,
  spinning = true,
}) => {
  const antIcon = <LoadingOutlined style={{ fontSize: 24 }} spin />

  if (children) {
    return (
      <Spin
        spinning={loading && spinning}
        tip={tip}
        size={size}
        indicator={antIcon}
        style={style}
        className={className}
      >
        {children}
      </Spin>
    )
  }

  return (
    <Card
      style={{
        textAlign: 'center',
        padding: '60px 0',
        ...style,
      }}
      className={className}
    >
      <Spin spinning={loading} tip={tip} size={size} indicator={antIcon} />
    </Card>
  )
}

export default Loading
