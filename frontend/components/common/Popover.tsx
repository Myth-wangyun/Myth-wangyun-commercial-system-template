import React from 'react'
import { Popover } from 'antd'

interface CustomPopoverProps {
  content: React.ReactNode
  title?: string
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
  overlayStyle?: React.CSSProperties
  overlayClassName?: string
  style?: React.CSSProperties
  className?: string
}

const CustomPopover: React.FC<CustomPopoverProps> = ({
  content,
  title,
  children,
  placement = 'top',
  trigger = 'hover',
  open,
  onOpenChange,
  overlayStyle,
  overlayClassName,
  style,
  className,
}) => {
  return (
    <Popover
      content={content}
      title={title}
      placement={placement}
      trigger={trigger}
      open={open}
      onOpenChange={onOpenChange}
      overlayStyle={overlayStyle}
      overlayClassName={overlayClassName}
      style={style}
      className={className}
    >
      {children}
    </Popover>
  )
}

export default CustomPopover
