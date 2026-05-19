import React, { memo, useCallback, useMemo } from 'react'
import { DatePicker } from 'antd'
import dayjs from 'dayjs'

const { MonthPicker } = DatePicker

interface OptimizedMonthPickerProps {
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

const OptimizedMonthPicker: React.FC<OptimizedMonthPickerProps> = memo(
  ({
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

    const monthPickerProps = useMemo(
      () => ({
        value: value ? dayjs(value) : undefined,
        defaultValue: defaultValue ? dayjs(defaultValue) : undefined,
        placeholder,
        size,
        disabled,
        readOnly,
        allowClear,
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
        format,
        handleChange,
        handleFocus,
        handleBlur,
        style,
        className,
      ],
    )

    return <MonthPicker {...monthPickerProps} />
  },
)

OptimizedMonthPicker.displayName = 'OptimizedMonthPicker'

export default OptimizedMonthPicker
