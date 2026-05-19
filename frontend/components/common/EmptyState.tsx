import React from 'react'
import { Empty, Button } from 'antd'
import { PlusOutlined } from '@ant-design/icons'

interface EmptyStateProps {
  title?: string
  description?: string
  image?: React.ReactNode
  showAction?: boolean
  actionText?: string
  onAction?: () => void
  actionIcon?: React.ReactNode
  style?: React.CSSProperties
  className?: string
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title = '暂无数据',
  description = '当前没有数据，请添加一些数据或刷新页面',
  image,
  showAction = true,
  actionText = '添加数据',
  onAction,
  actionIcon = <PlusOutlined />,
  style,
  className,
}) => {
  const action =
    showAction && onAction ? (
      <Button type="primary" icon={actionIcon} onClick={onAction}>
        {actionText}
      </Button>
    ) : undefined

  return (
    <Empty
      image={image}
      description={
        <div>
          <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>{title}</div>
          <div style={{ color: '#666' }}>{description}</div>
        </div>
      }
      style={style}
      className={className}
    >
      {action}
    </Empty>
  )
}

export default EmptyState
