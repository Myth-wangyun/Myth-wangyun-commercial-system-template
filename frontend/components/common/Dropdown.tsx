import React from 'react'
import { Dropdown } from 'antd'
import type { MenuProps } from 'antd'

interface CustomDropdownProps {
  menu: MenuProps
  children: React.ReactNode
  placement?: 'bottomLeft' | 'bottomCenter' | 'bottomRight' | 'topLeft' | 'topCenter' | 'topRight'
  trigger?: ('click' | 'hover' | 'contextMenu')[]
  open?: boolean
  onOpenChange?: (open: boolean) => void
  disabled?: boolean
  overlayStyle?: React.CSSProperties
  overlayClassName?: string
  className?: string
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({
  menu,
  children,
  placement = 'bottomLeft',
  trigger = ['click'],
  open,
  onOpenChange,
  disabled = false,
  overlayStyle,
  overlayClassName,
  className,
}) => {
  return (
    <Dropdown
      menu={menu}
      placement={placement}
      trigger={trigger}
      open={open}
      onOpenChange={onOpenChange}
      disabled={disabled}
      overlayStyle={overlayStyle}
      overlayClassName={overlayClassName}
      className={className}
    >
      {children}
    </Dropdown>
  )
}

export default CustomDropdown
