import React from 'react'
import { DatePicker } from 'antd'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker

interface CustomDateRangePickerProps {
  value?: [string | Date | dayjs.Dayjs, string | Date | dayjs.Dayjs]
  defaultValue?: [string | Date | dayjs.Dayjs, string | Date | dayjs.Dayjs]
  placeholder?: [string, string]
  size?: 'small' | 'middle' | 'large'
  disabled?: boolean
  readOnly?: boolean
  allowClear?: boolean
  showTime?: boolean
  format?: string
  onChange?: (
    dates: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null,
    dateStrings: [string, string],
  ) => void
  onFocus?: () => void
  onBlur?: () => void
  style?: React.CSSProperties
  className?: string
}

const CustomDateRangePicker: React.FC<CustomDateRangePickerProps> = ({
  value,
  defaultValue,
  placeholder = ['开始日期', '结束日期'],
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
  const handleChange = (
    dates: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null,
    dateStrings: [string, string],
  ) => {
    if (onChange) {
      onChange(dates, dateStrings)
    }
  }

  return (
    <RangePicker
      value={value ? [dayjs(value[0]), dayjs(value[1])] : undefined}
      defaultValue={defaultValue ? [dayjs(defaultValue[0]), dayjs(defaultValue[1])] : undefined}
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

export default CustomDateRangePicker
