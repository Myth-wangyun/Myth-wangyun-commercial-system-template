import React from 'react'
import { Tabs } from 'antd'

interface TabItem {
  key: string
  label: string
  children: React.ReactNode
  icon?: React.ReactNode
  disabled?: boolean
  closable?: boolean
}

interface CustomTabsProps {
  items: TabItem[]
  activeKey?: string
  onChange?: (key: string) => void
  type?: 'line' | 'card' | 'editable-card'
  size?: 'small' | 'middle' | 'large'
  tabPosition?: 'top' | 'right' | 'bottom' | 'left'
  centered?: boolean
  style?: React.CSSProperties
  className?: string
}

const CustomTabs: React.FC<CustomTabsProps> = ({
  items,
  activeKey,
  onChange,
  type = 'line',
  size = 'middle',
  tabPosition = 'top',
  centered = false,
  style,
  className,
}) => {
  const tabItems = items.map((item) => ({
    key: item.key,
    label: (
      <span>
        {item.icon && <span style={{ marginRight: 4 }}>{item.icon}</span>}
        {item.label}
      </span>
    ),
    children: item.children,
    disabled: item.disabled,
    closable: item.closable,
  }))

  return (
    <Tabs
      items={tabItems}
      activeKey={activeKey}
      onChange={onChange}
      type={type}
      size={size}
      tabPosition={tabPosition}
      centered={centered}
      style={style}
      className={className}
    />
  )
}

export default CustomTabs
