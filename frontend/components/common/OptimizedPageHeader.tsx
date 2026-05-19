import React, { memo } from 'react'
import { Typography } from 'antd'

interface OptimizedPageHeaderProps {
  title: string
  subtitle?: string
  extra?: React.ReactNode
  breadcrumb?: React.ReactNode
  onBack?: () => void
  style?: React.CSSProperties
  className?: string
}

const OptimizedPageHeader: React.FC<OptimizedPageHeaderProps> = memo(
  ({ title, subtitle, extra, style, className }) => {
    return (
      <div style={style} className={className}>
        <Typography.Title level={2}>{title}</Typography.Title>
        {subtitle && <Typography.Text type="secondary">{subtitle}</Typography.Text>}
        {extra && <div style={{ marginTop: 16 }}>{extra}</div>}
      </div>
    )
  },
)

OptimizedPageHeader.displayName = 'OptimizedPageHeader'

export default OptimizedPageHeader
