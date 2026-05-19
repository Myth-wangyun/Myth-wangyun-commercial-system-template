import React, { memo, useMemo } from 'react'
import { Progress } from 'antd'

interface OptimizedProgressProps {
  percent?: number
  status?: 'success' | 'exception' | 'active' | 'normal'
  strokeColor?: string | string[]
  trailColor?: string
  strokeWidth?: number
  size?: 'small' | 'default'
  format?: (percent?: number) => React.ReactNode
  showInfo?: boolean
  type?: 'line' | 'circle' | 'dashboard'
  width?: number
  style?: React.CSSProperties
  className?: string
}

const OptimizedProgress: React.FC<OptimizedProgressProps> = memo(
  ({
    percent = 0,
    status = 'normal',
    strokeColor,
    trailColor,
    strokeWidth,
    size = 'default',
    format,
    showInfo = true,
    type = 'line',
    width,
    style,
    className,
  }) => {
    const progressProps = useMemo(
      () => ({
        percent,
        status,
        strokeColor,
        trailColor,
        strokeWidth,
        size,
        format,
        showInfo,
        type,
        width,
        style,
        className,
      }),
      [
        percent,
        status,
        strokeColor,
        trailColor,
        strokeWidth,
        size,
        format,
        showInfo,
        type,
        width,
        style,
        className,
      ],
    )

    return <Progress {...progressProps} />
  },
)

OptimizedProgress.displayName = 'OptimizedProgress'

export default OptimizedProgress
