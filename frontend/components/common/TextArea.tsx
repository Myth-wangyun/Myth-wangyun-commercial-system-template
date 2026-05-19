import React from 'react'
import { Input } from 'antd'

const { TextArea } = Input

interface CustomTextAreaProps {
  value?: string
  defaultValue?: string
  placeholder?: string
  size?: 'small' | 'middle' | 'large'
  disabled?: boolean
  readOnly?: boolean
  maxLength?: number
  showCount?: boolean
  rows?: number
  autoSize?: boolean | { minRows: number; maxRows: number }
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  onPressEnter?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  onFocus?: (e: React.FocusEvent<HTMLTextAreaElement>) => void
  onBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void
  style?: React.CSSProperties
  className?: string
}

const CustomTextArea: React.FC<CustomTextAreaProps> = ({
  value,
  defaultValue,
  placeholder,
  size = 'middle',
  disabled = false,
  readOnly = false,
  maxLength,
  showCount = false,
  rows = 4,
  autoSize = false,
  onChange,
  onPressEnter,
  onFocus,
  onBlur,
  style,
  className,
}) => {
  return (
    <TextArea
      value={value}
      defaultValue={defaultValue}
      placeholder={placeholder}
      size={size}
      disabled={disabled}
      readOnly={readOnly}
      maxLength={maxLength}
      showCount={showCount}
      rows={rows}
      autoSize={autoSize}
      onChange={onChange}
      onPressEnter={onPressEnter}
      onFocus={onFocus}
      onBlur={onBlur}
      style={style}
      className={className}
    />
  )
}

export default CustomTextArea
