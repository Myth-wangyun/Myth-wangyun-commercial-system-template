import React from 'react'
import { Tooltip } from 'antd'

interface CustomTooltipProps {
  title: string
  children: React.ReactNode
  placement?:
    | 'top'
    | 'left'
    | 'right'
    | 'bottom'
    | 'topLeft'
    | 'topRight'
    | 'bottomLeft'
    | 'bottomRight'
    | 'leftTop'
    | 'leftBottom'
    | 'rightTop'
    | 'rightBottom'
  trigger?: 'hover' | 'focus' | 'click' | 'contextMenu'
  open?: boolean
  onOpenChange?: (open: boolean) => void
  color?: string
  overlayStyle?: React.CSSProperties
  overlayClassName?: string
  style?: React.CSSProperties
  className?: string
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({
  title,
  children,
  placement = 'top',
  trigger = 'hover',
  open,
  onOpenChange,
  color,
  overlayStyle,
  overlayClassName,
  style,
  className,
}) => {
  return (
    <Tooltip
      title={title}
      placement={placement}
      trigger={trigger}
      open={open}
      onOpenChange={onOpenChange}
      color={color}
      overlayStyle={overlayStyle}
      overlayClassName={overlayClassName}
      style={style}
      className={className}
    >
      {children}
    </Tooltip>
  )
}

export default CustomTooltip
