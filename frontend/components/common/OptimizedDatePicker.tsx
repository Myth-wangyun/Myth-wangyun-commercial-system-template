import React, { memo, useCallback, useMemo } from 'react'
import { DatePicker } from 'antd'
import dayjs from 'dayjs'

interface OptimizedDatePickerProps {
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

const OptimizedDatePicker: React.FC<OptimizedDatePickerProps> = memo(
  ({
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
    const handleChange = useCallback(
      (date: dayjs.Dayjs | null, dateString: string) => {
        onChange?.(date, dateString)
      },
      [onChange],
    )

    const handleFocus = useCallback(() => {
      onFocus?.()
    }, [onFocus])

    const handleBlur = useCallback(() => {
      onBlur?.()
    }, [onBlur])

    const datePickerProps = useMemo(
      () => ({
        value: value ? dayjs(value) : undefined,
        defaultValue: defaultValue ? dayjs(defaultValue) : undefined,
        placeholder,
        size,
        disabled,
        readOnly,
        allowClear,
        showTime,
        format,
        onChange: handleChange,
        onFocus: handleFocus,
        onBlur: handleBlur,
        style,
        className,
      }),
      [
        value,
        defaultValue,
        placeholder,
        size,
        disabled,
        readOnly,
        allowClear,
        showTime,
        format,
        handleChange,
        handleFocus,
        handleBlur,
        style,
        className,
      ],
    )

    return <DatePicker {...datePickerProps} />
  },
)

OptimizedDatePicker.displayName = 'OptimizedDatePicker'

export default OptimizedDatePicker
