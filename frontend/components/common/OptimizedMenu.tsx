import React, { memo, useCallback, useMemo } from 'react'
import { Menu } from 'antd'
import type { MenuProps } from 'antd'

interface OptimizedMenuProps {
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

const OptimizedMenu: React.FC<OptimizedMenuProps> = memo(
  ({
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
    const handleSelect = useCallback(
      (info: { key: string; keyPath: string[]; selectedKeys: string[] }) => {
        onSelect?.(info)
      },
      [onSelect],
    )

    const handleOpenChange = useCallback(
      (openKeys: string[]) => {
        onOpenChange?.(openKeys)
      },
      [onOpenChange],
    )

    const menuProps = useMemo(
      () => ({
        items,
        mode,
        theme,
        selectedKeys,
        defaultSelectedKeys,
        openKeys,
        defaultOpenKeys,
        onSelect: handleSelect,
        onOpenChange: handleOpenChange,
        style,
        className,
      }),
      [
        items,
        mode,
        theme,
        selectedKeys,
        defaultSelectedKeys,
        openKeys,
        defaultOpenKeys,
        handleSelect,
        handleOpenChange,
        style,
        className,
      ],
    )

    return <Menu {...menuProps} />
  },
)

OptimizedMenu.displayName = 'OptimizedMenu'

export default OptimizedMenu
