import React from 'react'
import { DatePicker } from 'antd'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker

interface CustomWeekRangePickerProps {
  value?: [string | Date | dayjs.Dayjs, string | Date | dayjs.Dayjs]
  defaultValue?: [string | Date | dayjs.Dayjs, string | Date | dayjs.Dayjs]
  placeholder?: [string, string]
  size?: 'small' | 'middle' | 'large'
  disabled?: boolean
  readOnly?: boolean
  allowClear?: boolean
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

const CustomWeekRangePicker: React.FC<CustomWeekRangePickerProps> = ({
  value,
  defaultValue,
  placeholder = ['开始周', '结束周'],
  size = 'middle',
  disabled = false,
  readOnly = false,
  allowClear = true,
  format = 'YYYY-[W]ww',
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
      picker="week"
      format={format}
      onChange={handleChange}
      onFocus={onFocus}
      onBlur={onBlur}
      style={style}
      className={className}
    />
  )
}

export default CustomWeekRangePicker
