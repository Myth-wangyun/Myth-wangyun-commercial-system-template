import React from 'react'
import { Progress } from 'antd'

interface CustomProgressProps {
  percent: number
  type?: 'line' | 'circle' | 'dashboard'
  status?: 'success' | 'exception' | 'normal' | 'active'
  strokeColor?: string | string[]
  trailColor?: string
  strokeWidth?: number
  size?: number | [number, number]
  format?: (percent?: number) => React.ReactNode
  showInfo?: boolean
  style?: React.CSSProperties
  className?: string
}

const CustomProgress: React.FC<CustomProgressProps> = ({
  percent,
  type = 'line',
  status,
  strokeColor,
  trailColor,
  strokeWidth,
  size,
  format,
  showInfo = true,
  style,
  className,
}) => {
  return (
    <Progress
      percent={percent}
      type={type}
      status={status}
      strokeColor={strokeColor}
      trailColor={trailColor}
      strokeWidth={strokeWidth}
      size={size}
      format={format}
      showInfo={showInfo}
      style={style}
      className={className}
    />
  )
}

export default CustomProgress
