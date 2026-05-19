import React from 'react'
import { Switch } from 'antd'

interface CustomSwitchProps {
  checked?: boolean
  defaultChecked?: boolean
  disabled?: boolean
  loading?: boolean
  size?: 'small' | 'default'
  checkedChildren?: React.ReactNode
  unCheckedChildren?: React.ReactNode
  onChange?: (checked: boolean) => void
  onClick?: (checked: boolean, event: React.MouseEvent<HTMLButtonElement>) => void
  style?: React.CSSProperties
  className?: string
}

const CustomSwitch: React.FC<CustomSwitchProps> = ({
  checked,
  defaultChecked = false,
  disabled = false,
  loading = false,
  size = 'default',
  checkedChildren,
  unCheckedChildren,
  onChange,
  onClick,
  style,
  className,
}) => {
  return (
    <Switch
      checked={checked}
      defaultChecked={defaultChecked}
      disabled={disabled}
      loading={loading}
      size={size}
      checkedChildren={checkedChildren}
      unCheckedChildren={unCheckedChildren}
      onChange={onChange}
      onClick={onClick}
      style={style}
      className={className}
    />
  )
}

export default CustomSwitch
