import React, { memo, useMemo } from 'react'
import { Spin } from 'antd'

interface OptimizedLoadingProps {
  spinning?: boolean
  size?: 'small' | 'default' | 'large'
  tip?: string
  delay?: number
  children?: React.ReactNode
  style?: React.CSSProperties
  className?: string
}

const OptimizedLoading: React.FC<OptimizedLoadingProps> = memo(
  ({ spinning = true, size = 'default', tip, delay = 0, children, style, className }) => {
    const spinProps = useMemo(
      () => ({
        spinning,
        size,
        tip,
        delay,
        style,
        className,
      }),
      [spinning, size, tip, delay, style, className],
    )

    return <Spin {...spinProps}>{children}</Spin>
  },
)

OptimizedLoading.displayName = 'OptimizedLoading'

export default OptimizedLoading
