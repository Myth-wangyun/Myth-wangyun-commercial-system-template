import React from 'react'
import { DatePicker } from 'antd'
import dayjs from 'dayjs'

const { MonthPicker } = DatePicker

interface CustomMonthPickerProps {
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

const CustomMonthPicker: React.FC<CustomMonthPickerProps> = ({
  value,
  defaultValue,
  placeholder = '请选择月份',
  size = 'middle',
  disabled = false,
  readOnly = false,
  allowClear = true,
  format = 'YYYY-MM',
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
    <MonthPicker
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

export default CustomMonthPicker
