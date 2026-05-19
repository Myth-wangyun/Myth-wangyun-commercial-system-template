import React from 'react'
import { Checkbox } from 'antd'

const { Group } = Checkbox

interface CheckboxOption {
  value: string | number
  label: string
  disabled?: boolean
}

interface CustomCheckboxProps {
  value?: (string | number)[]
  defaultValue?: (string | number)[]
  disabled?: boolean
  options?: CheckboxOption[]
  direction?: 'horizontal' | 'vertical'
  onChange?: (checkedValues: (string | number)[]) => void
  style?: React.CSSProperties
  className?: string
}

const CustomCheckbox: React.FC<CustomCheckboxProps> = ({
  value,
  defaultValue,
  disabled = false,
  options = [],
  direction = 'horizontal',
  onChange,
  style,
  className,
}) => {
  return (
    <Group
      value={value}
      defaultValue={defaultValue}
      disabled={disabled}
      onChange={onChange}
      style={{
        display: 'flex',
        flexDirection: direction === 'vertical' ? 'column' : 'row',
        ...style,
      }}
      className={className}
    >
      {options.map((option) => (
        <Checkbox key={option.value} value={option.value} disabled={option.disabled}>
          {option.label}
        </Checkbox>
      ))}
    </Group>
  )
}

export default CustomCheckbox
