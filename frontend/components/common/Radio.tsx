import React from 'react'
import { Radio } from 'antd'
import type { RadioChangeEvent } from 'antd'

const { Group } = Radio

interface RadioOption {
  value: string | number
  label: string
  disabled?: boolean
}

interface CustomRadioProps {
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

const CustomRadio: React.FC<CustomRadioProps> = ({
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
  return (
    <Group
      value={value}
      defaultValue={defaultValue}
      disabled={disabled}
      onChange={onChange}
      size={size}
      style={{
        display: 'flex',
        flexDirection: direction === 'vertical' ? 'column' : 'row',
        ...style,
      }}
      className={className}
    >
      {options.map((option) => (
        <Radio key={option.value} value={option.value} disabled={option.disabled}>
          {option.label}
        </Radio>
      ))}
    </Group>
  )
}

export default CustomRadio
