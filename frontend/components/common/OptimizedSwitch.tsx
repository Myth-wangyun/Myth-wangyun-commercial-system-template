import React, { memo, useCallback, useMemo } from 'react'
import { Switch } from 'antd'

interface OptimizedSwitchProps {
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

const OptimizedSwitch: React.FC<OptimizedSwitchProps> = memo(
  ({
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
    const handleChange = useCallback(
      (checked: boolean) => {
        onChange?.(checked)
      },
      [onChange],
    )

    const handleClick = useCallback(
      (checked: boolean, event: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(checked, event)
      },
      [onClick],
    )

    const switchProps = useMemo(
      () => ({
        checked,
        defaultChecked,
        disabled,
        loading,
        size,
        checkedChildren,
        unCheckedChildren,
        onChange: handleChange,
        onClick: handleClick,
        style,
        className,
      }),
      [
        checked,
        defaultChecked,
        disabled,
        loading,
        size,
        checkedChildren,
        unCheckedChildren,
        handleChange,
        handleClick,
        style,
        className,
      ],
    )

    return <Switch {...switchProps} />
  },
)

OptimizedSwitch.displayName = 'OptimizedSwitch'

export default OptimizedSwitch
