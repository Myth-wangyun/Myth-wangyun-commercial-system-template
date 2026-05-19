import React from 'react'
import { DatePicker } from 'antd'
import dayjs from 'dayjs'

interface CustomDatePickerProps {
  value?: string | Date | dayjs.Dayjs
  defaultValue?: string | Date | dayjs.Dayjs
  placeholder?: string
  size?: 'small' | 'middle' | 'large'
  disabled?: boolean
  readOnly?: boolean
  allowClear?: boolean
  showTime?: boolean
  format?: string
  onChange?: (date: dayjs.Dayjs | null, dateString: string) => void
  onFocus?: () => void
  onBlur?: () => void
  style?: React.CSSProperties
  className?: string
}

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  value,
  defaultValue,
  placeholder = '请选择日期',
  size = 'middle',
  disabled = false,
  readOnly = false,
  allowClear = true,
  showTime = false,
  format = 'YYYY-MM-DD',
  onChange,
  onFocus,
  onBlur,
  style,
  className,
}) => {
  const handleChange = (date: dayjs.Dayjs | null, dateString: string | string[]) => {
    if (onChange) {
      const dateStr = Array.isArray(dateString) ? dateString[0] : dateString
      onChange(date, dateStr)
    }
  }

  return (
    <DatePicker
      value={value ? dayjs(value) : undefined}
      defaultValue={defaultValue ? dayjs(defaultValue) : undefined}
      placeholder={placeholder}
      size={size}
      disabled={disabled}
      readOnly={readOnly}
      allowClear={allowClear}
      showTime={showTime}
      format={format}
      onChange={handleChange}
      onFocus={onFocus}
      onBlur={onBlur}
      style={style}
      className={className}
    />
  )
}

export default CustomDatePicker
