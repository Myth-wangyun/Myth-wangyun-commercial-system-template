import React, { memo, useCallback, useMemo } from 'react'
import { Dropdown } from 'antd'
import type { MenuProps } from 'antd'

interface OptimizedDropdownProps {
  menu: MenuProps
  children: React.ReactNode
  trigger?: ('click' | 'hover' | 'contextMenu')[]
  placement?: 'bottomLeft' | 'bottomCenter' | 'bottomRight' | 'topLeft' | 'topCenter' | 'topRight'
  disabled?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
  className?: string
}

const OptimizedDropdown: React.FC<OptimizedDropdownProps> = memo(
  ({
    menu,
    children,
    trigger = ['click'],
    placement = 'bottomLeft',
    disabled = false,
    open,
    onOpenChange,
    className,
  }) => {
    const handleOpenChange = useCallback(
      (open: boolean) => {
        onOpenChange?.(open)
      },
      [onOpenChange],
    )

    const dropdownProps = useMemo(
      () => ({
        menu,
        trigger: trigger as ('click' | 'hover' | 'contextMenu')[],
        placement,
        disabled,
        open,
        onOpenChange: handleOpenChange,
        className,
      }),
      [menu, trigger, placement, disabled, open, handleOpenChange, className],
    )

    return <Dropdown {...dropdownProps}>{children}</Dropdown>
  },
)

OptimizedDropdown.displayName = 'OptimizedDropdown'

export default OptimizedDropdown
