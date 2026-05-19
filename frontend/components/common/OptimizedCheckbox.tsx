import React, { memo, useCallback, useMemo } from 'react'
import { Checkbox } from 'antd'

const { Group } = Checkbox

interface CheckboxOption {
  value: string | number
  label: string
  disabled?: boolean
}

interface OptimizedCheckboxProps {
  value?: (string | number)[]
  defaultValue?: (string | number)[]
  disabled?: boolean
  options?: CheckboxOption[]
  direction?: 'horizontal' | 'vertical'
  onChange?: (checkedValues: (string | number)[]) => void
  style?: React.CSSProperties
  className?: string
}

const OptimizedCheckbox: React.FC<OptimizedCheckboxProps> = memo(
  ({
    value,
    defaultValue,
    disabled = false,
    options = [],
    direction = 'horizontal',
    onChange,
    style,
    className,
  }) => {
    const handleChange = useCallback(
      (checkedValues: (string | number)[]) => {
        onChange?.(checkedValues)
      },
      [onChange],
    )

    const groupStyle: React.CSSProperties = {
      display: 'flex',
      flexDirection: direction === 'vertical' ? 'column' : 'row',
      ...style,
    }

    const checkboxProps = useMemo(
      () => ({
        value,
        defaultValue,
        disabled,
        onChange: handleChange,
        style: groupStyle,
        className,
      }),
      [value, defaultValue, disabled, handleChange, groupStyle, className],
    )

    return (
      <Group {...checkboxProps}>
        {options.map((option) => (
          <Checkbox key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </Checkbox>
        ))}
      </Group>
    )
  },
)

OptimizedCheckbox.displayName = 'OptimizedCheckbox'

export default OptimizedCheckbox
