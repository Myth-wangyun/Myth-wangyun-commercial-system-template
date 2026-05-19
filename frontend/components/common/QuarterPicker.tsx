import React from 'react'
import { DatePicker } from 'antd'
import dayjs from 'dayjs'

const { QuarterPicker } = DatePicker

interface CustomQuarterPickerProps {
  value?: string | Date | dayjs.Dayjs
  defaultValue?: string | Date | dayjs.Dayjs
  placeholder?: string
  size?: 'small' | 'middle' | 'large'
  disabled?: boolean
  readOnly?: boolean
  allowClear?: boolean
  format?: string
  onChange?: (date: dayjs.Dayjs | null, dateString: string) => void
  onFocus?: () => void
  onBlur?: () => void
  style?: React.CSSProperties
  className?: string
}

const CustomQuarterPicker: React.FC<CustomQuarterPickerProps> = ({
  value,
  defaultValue,
  placeholder = '请选择季度',
  size = 'middle',
  disabled = false,
  readOnly = false,
  allowClear = true,
  format = 'YYYY-[Q]Q',
  onChange,
  onFocus,
  onBlur,
  style,
  className,
}) => {
  const handleChange = (date: dayjs.Dayjs | null, dateString: string) => {
    if (onChange) {
      onChange(date, dateString)
    }
  }

  return (
    <QuarterPicker
      value={value ? dayjs(value) : undefined}
      defaultValue={defaultValue ? dayjs(defaultValue) : undefined}
      placeholder={placeholder}
      size={size}
      disabled={disabled}
      readOnly={readOnly}
      allowClear={allowClear}
      format={format}
      onChange={handleChange}
      onFocus={onFocus}
      onBlur={onBlur}
      style={style}
      className={className}
    />
  )
}

export default CustomQuarterPicker
