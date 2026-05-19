import React, { memo, useCallback, useMemo } from 'react'
import { Radio } from 'antd'
import type { RadioChangeEvent } from 'antd'

const { Group } = Radio

interface RadioOption {
  value: string | number
  label: string
  disabled?: boolean
}

interface OptimizedRadioProps {
  value?: string | number
  defaultValue?: string | number
  disabled?: boolean
  options?: RadioOption[]
  direction?: 'horizontal' | 'vertical'
  size?: 'small' | 'middle' | 'large'
  onChange?: (e: RadioChangeEvent) => void
  style?: React.CSSProperties
  className?: string
}

const OptimizedRadio: React.FC<OptimizedRadioProps> = memo(
  ({
    value,
    defaultValue,
    disabled = false,
    options = [],
    direction = 'horizontal',
    size = 'middle',
    onChange,
    style,
    className,
  }) => {
    const handleChange = useCallback(
      (e: RadioChangeEvent) => {
        onChange?.(e)
      },
      [onChange],
    )

    const groupStyle: React.CSSProperties = {
      display: 'flex',
      flexDirection: direction === 'vertical' ? 'column' : 'row',
      ...style,
    }

    const radioProps = useMemo(
      () => ({
        value,
        defaultValue,
        disabled,
        size,
        onChange: handleChange,
        style: groupStyle,
        className,
      }),
      [value, defaultValue, disabled, size, handleChange, groupStyle, className],
    )

    return (
      <Group {...radioProps}>
        {options.map((option) => (
          <Radio key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </Radio>
        ))}
      </Group>
    )
  },
)

OptimizedRadio.displayName = 'OptimizedRadio'

export default OptimizedRadio
