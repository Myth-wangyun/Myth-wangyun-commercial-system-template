import React from 'react'
import { Menu } from 'antd'
import type { MenuProps } from 'antd'

interface CustomMenuProps {
  items: MenuProps['items']
  mode?: 'horizontal' | 'vertical' | 'inline'
  theme?: 'light' | 'dark'
  selectedKeys?: string[]
  defaultSelectedKeys?: string[]
  openKeys?: string[]
  defaultOpenKeys?: string[]
  onSelect?: (info: { key: string; keyPath: string[]; selectedKeys: string[] }) => void
  onOpenChange?: (openKeys: string[]) => void
  style?: React.CSSProperties
  className?: string
}

const CustomMenu: React.FC<CustomMenuProps> = ({
  items,
  mode = 'horizontal',
  theme = 'light',
  selectedKeys,
  defaultSelectedKeys,
  openKeys,
  defaultOpenKeys,
  onSelect,
  onOpenChange,
  style,
  className,
}) => {
  return (
    <Menu
      items={items}
      mode={mode}
      theme={theme}
      selectedKeys={selectedKeys}
      defaultSelectedKeys={defaultSelectedKeys}
      openKeys={openKeys}
      defaultOpenKeys={defaultOpenKeys}
      onSelect={onSelect}
      onOpenChange={onOpenChange}
      style={style}
      className={className}
    />
  )
}

export default CustomMenu
