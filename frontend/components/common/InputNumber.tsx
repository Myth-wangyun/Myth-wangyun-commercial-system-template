import React from 'react'
import { InputNumber } from 'antd'

interface CustomInputNumberProps {
  value?: number
  defaultValue?: number
  placeholder?: string
  size?: 'small' | 'middle' | 'large'
  disabled?: boolean
  readOnly?: boolean
  min?: number
  max?: number
  step?: number
  precision?: number
  formatter?: (value: number | string | undefined) => string
  parser?: (value: string | undefined) => number
  onChange?: (value: number | null) => void
  onFocus?: () => void
  onBlur?: () => void
  style?: React.CSSProperties
  className?: string
}

const CustomInputNumber: React.FC<CustomInputNumberProps> = ({
  value,
  defaultValue,
  placeholder,
  size = 'middle',
  disabled = false,
  readOnly = false,
  min,
  max,
  step = 1,
  precision,
  formatter,
  parser,
  onChange,
  onFocus,
  onBlur,
  style,
  className,
}) => {
  return (
    <InputNumber
      value={value}
      defaultValue={defaultValue}
      placeholder={placeholder}
      size={size}
      disabled={disabled}
      readOnly={readOnly}
      min={min}
      max={max}
      step={step}
      precision={precision}
      formatter={formatter}
      parser={parser}
      onChange={onChange}
      onFocus={onFocus}
      onBlur={onBlur}
      style={style}
      className={className}
    />
  )
}

export default CustomInputNumber
