import React, { memo, useMemo } from 'react'
import { Badge } from 'antd'

interface OptimizedBadgeProps {
  count?: number
  showZero?: boolean
  overflowCount?: number
  dot?: boolean
  status?: 'success' | 'processing' | 'default' | 'error' | 'warning'
  text?: string
  color?: string
  children?: React.ReactNode
  style?: React.CSSProperties
  className?: string
}

const OptimizedBadge: React.FC<OptimizedBadgeProps> = memo(
  ({
    count,
    showZero = false,
    overflowCount = 99,
    dot = false,
    status,
    text,
    color,
    children,
    style,
    className,
  }) => {
    const badgeProps = useMemo(
      () => ({
        count,
        showZero,
        overflowCount,
        dot,
        status,
        text,
        color,
        style,
        className,
      }),
      [count, showZero, overflowCount, dot, status, text, color, style, className],
    )

    return <Badge {...badgeProps}>{children}</Badge>
  },
)

OptimizedBadge.displayName = 'OptimizedBadge'

export default OptimizedBadge
