import React, { memo, useCallback, useMemo } from 'react'
import { Popover } from 'antd'

interface OptimizedPopoverProps {
  content: React.ReactNode
  title?: React.ReactNode
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
  style?: React.CSSProperties
  className?: string
}

const OptimizedPopover: React.FC<OptimizedPopoverProps> = memo(
  ({
    content,
    title,
    children,
    placement = 'top',
    trigger = 'hover',
    open,
    onOpenChange,
    style,
    className,
  }) => {
    const handleOpenChange = useCallback(
      (open: boolean) => {
        onOpenChange?.(open)
      },
      [onOpenChange],
    )

    const popoverProps = useMemo(
      () => ({
        content,
        title,
        placement,
        trigger,
        open,
        onOpenChange: handleOpenChange,
        style,
        className,
      }),
      [content, title, placement, trigger, open, handleOpenChange, style, className],
    )

    return <Popover {...popoverProps}>{children}</Popover>
  },
)

OptimizedPopover.displayName = 'OptimizedPopover'

export default OptimizedPopover
