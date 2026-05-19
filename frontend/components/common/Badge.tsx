import React from 'react'
import { Badge } from 'antd'

interface CustomBadgeProps {
  count?: number
  showZero?: boolean
  overflowCount?: number
  dot?: boolean
  status?: 'success' | 'processing' | 'default' | 'error' | 'warning'
  text?: string
  color?: string
  size?: 'default' | 'small'
  offset?: [number, number]
  children?: React.ReactNode
  style?: React.CSSProperties
  className?: string
}

const CustomBadge: React.FC<CustomBadgeProps> = ({
  count,
  showZero = false,
  overflowCount = 99,
  dot = false,
  status,
  text,
  color,
  size = 'default',
  offset,
  children,
  style,
  className,
}) => {
  return (
    <Badge
      count={count}
      showZero={showZero}
      overflowCount={overflowCount}
      dot={dot}
      status={status}
      text={text}
      color={color}
      size={size}
      offset={offset}
      style={style}
      className={className}
    >
      {children}
    </Badge>
  )
}

export default CustomBadge
