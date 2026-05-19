import React, { memo, useCallback, useMemo } from 'react'
import { Tooltip } from 'antd'

interface OptimizedTooltipProps {
  title: React.ReactNode
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

const OptimizedTooltip: React.FC<OptimizedTooltipProps> = memo(
  ({
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

    const tooltipProps = useMemo(
      () => ({
        title,
        placement,
        trigger,
        open,
        onOpenChange: handleOpenChange,
        style,
        className,
      }),
      [title, placement, trigger, open, handleOpenChange, style, className],
    )

    return <Tooltip {...tooltipProps}>{children}</Tooltip>
  },
)

OptimizedTooltip.displayName = 'OptimizedTooltip'

export default OptimizedTooltip
