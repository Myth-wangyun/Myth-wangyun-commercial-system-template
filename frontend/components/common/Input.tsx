import React from 'react'
import { Input } from 'antd'

interface CustomInputProps {
  value?: string
  defaultValue?: string
  placeholder?: string
  size?: 'small' | 'middle' | 'large'
  disabled?: boolean
  readOnly?: boolean
  maxLength?: number
  showCount?: boolean
  prefix?: React.ReactNode
  suffix?: React.ReactNode
  addonBefore?: React.ReactNode
  addonAfter?: React.ReactNode
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  onPressEnter?: (e: React.KeyboardEvent<HTMLInputElement>) => void
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void
  style?: React.CSSProperties
  className?: string
}

const CustomInput: React.FC<CustomInputProps> = ({
  value,
  defaultValue,
  placeholder,
  size = 'middle',
  disabled = false,
  readOnly = false,
  maxLength,
  showCount = false,
  prefix,
  suffix,
  addonBefore,
  addonAfter,
  onChange,
  onPressEnter,
  onFocus,
  onBlur,
  style,
  className,
}) => {
  return (
    <Input
      value={value}
      defaultValue={defaultValue}
      placeholder={placeholder}
      size={size}
      disabled={disabled}
      readOnly={readOnly}
      maxLength={maxLength}
      showCount={showCount}
      prefix={prefix}
      suffix={suffix}
      addonBefore={addonBefore}
      addonAfter={addonAfter}
      onChange={onChange}
      onPressEnter={onPressEnter}
      onFocus={onFocus}
      onBlur={onBlur}
      style={style}
      className={className}
    />
  )
}

export default CustomInput
