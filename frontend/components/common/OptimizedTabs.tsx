import React, { memo, useCallback, useMemo } from 'react'
import { Tabs } from 'antd'

interface TabItem {
  key: string
  label: string
  children: React.ReactNode
  disabled?: boolean
  closable?: boolean
  icon?: React.ReactNode
}

interface OptimizedTabsProps {
  activeKey?: string
  defaultActiveKey?: string
  type?: 'line' | 'card' | 'editable-card'
  size?: 'small' | 'middle' | 'large'
  tabPosition?: 'top' | 'right' | 'bottom' | 'left'
  items: TabItem[]
  onChange?: (activeKey: string) => void
  onEdit?: (targetKey: string, action: 'add' | 'remove') => void
  style?: React.CSSProperties
  className?: string
}

const OptimizedTabs: React.FC<OptimizedTabsProps> = memo(
  ({
    activeKey,
    defaultActiveKey,
    type = 'line',
    size = 'middle',
    tabPosition = 'top',
    items,
    onChange,
    onEdit,
    style,
    className,
  }) => {
    const handleChange = useCallback(
      (activeKey: string) => {
        onChange?.(activeKey)
      },
      [onChange],
    )

    const handleEdit = useCallback(
      (targetKey: string, action: 'add' | 'remove') => {
        onEdit?.(targetKey, action)
      },
      [onEdit],
    )

    const tabsProps = useMemo(
      () => ({
        activeKey,
        defaultActiveKey,
        type,
        size,
        tabPosition,
        onChange: handleChange,
        onEdit: handleEdit,
        style,
        className,
      }),
      [
        activeKey,
        defaultActiveKey,
        type,
        size,
        tabPosition,
        handleChange,
        handleEdit,
        style,
        className,
      ],
    )

    return (
      <Tabs
        {...tabsProps}
        items={items.map((item) => ({
          key: item.key,
          label: item.label,
          disabled: item.disabled,
          closable: item.closable,
          children: item.children,
        }))}
      />
    )
  },
)

OptimizedTabs.displayName = 'OptimizedTabs'

export default OptimizedTabs
