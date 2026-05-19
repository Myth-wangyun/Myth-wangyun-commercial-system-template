import React from 'react'
import { TimePicker } from 'antd'
import dayjs from 'dayjs'

const { RangePicker } = TimePicker

interface CustomTimeRangePickerProps {
  value?: [string | Date | dayjs.Dayjs, string | Date | dayjs.Dayjs]
  defaultValue?: [string | Date | dayjs.Dayjs, string | Date | dayjs.Dayjs]
  placeholder?: [string, string]
  size?: 'small' | 'middle' | 'large'
  disabled?: boolean
  readOnly?: boolean
  allowClear?: boolean
  format?: string
  onChange?: (
    times: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null,
    timeStrings: [string, string],
  ) => void
  onFocus?: () => void
  onBlur?: () => void
  style?: React.CSSProperties
  className?: string
}

const CustomTimeRangePicker: React.FC<CustomTimeRangePickerProps> = ({
  value,
  defaultValue,
  placeholder = ['开始时间', '结束时间'],
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
  const handleChange = (
    times: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null,
    timeStrings: [string, string],
  ) => {
    if (onChange) {
      onChange(times, timeStrings)
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
      format={format}
      onChange={handleChange}
      onFocus={onFocus}
      onBlur={onBlur}
      style={style}
      className={className}
    />
  )
}

export default CustomTimeRangePicker
