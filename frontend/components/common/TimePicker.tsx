import React from 'react'
import { TimePicker } from 'antd'
import dayjs from 'dayjs'

interface CustomTimePickerProps {
  value?: string | Date | dayjs.Dayjs
  defaultValue?: string | Date | dayjs.Dayjs
  placeholder?: string
  size?: 'small' | 'middle' | 'large'
  disabled?: boolean
  readOnly?: boolean
  allowClear?: boolean
  format?: string
  onChange?: (time: dayjs.Dayjs | null, timeString: string) => void
  onFocus?: () => void
  onBlur?: () => void
  style?: React.CSSProperties
  className?: string
}

const CustomTimePicker: React.FC<CustomTimePickerProps> = ({
  value,
  defaultValue,
  placeholder = '请选择时间',
  size = 'middle',
  disabled = false,
  readOnly = false,
  allowClear = true,
  format = 'HH:mm:ss',
  onChange,
  onFocus,
  onBlur,
  style,
  className,
}) => {
  const handleChange = (time: dayjs.Dayjs | null, timeString: string) => {
    if (onChange) {
      onChange(time, timeString)
    }
  }

  return (
    <TimePicker
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

export default CustomTimePicker
