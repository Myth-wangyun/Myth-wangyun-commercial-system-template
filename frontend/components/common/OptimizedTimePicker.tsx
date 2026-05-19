import React, { memo, useCallback, useMemo } from 'react'
import { TimePicker } from 'antd'
import dayjs from 'dayjs'

interface OptimizedTimePickerProps {
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

const OptimizedTimePicker: React.FC<OptimizedTimePickerProps> = memo(
  ({
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
    const handleChange = useCallback(
      (time: dayjs.Dayjs | null, timeString: string | string[]) => {
        const timeStr = Array.isArray(timeString) ? timeString[0] : timeString
        onChange?.(time, timeStr)
      },
      [onChange],
    )

    const handleFocus = useCallback(() => {
      onFocus?.()
    }, [onFocus])

    const handleBlur = useCallback(() => {
      onBlur?.()
    }, [onBlur])

    const timePickerProps = useMemo(
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

    return <TimePicker {...timePickerProps} />
  },
)

OptimizedTimePicker.displayName = 'OptimizedTimePicker'

export default OptimizedTimePicker
