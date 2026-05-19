import React, { memo, useCallback, useMemo } from 'react'
import { TimePicker } from 'antd'
import dayjs from 'dayjs'

const { RangePicker } = TimePicker

interface OptimizedTimeRangePickerProps {
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

const OptimizedTimeRangePicker: React.FC<OptimizedTimeRangePickerProps> = memo(
  ({
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
    const handleChange = useCallback(
      (times: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null, timeStrings: [string, string]) => {
        onChange?.(times, timeStrings)
      },
      [onChange],
    )

    const handleFocus = useCallback(() => {
      onFocus?.()
    }, [onFocus])

    const handleBlur = useCallback(() => {
      onBlur?.()
    }, [onBlur])

    const rangePickerProps = useMemo(
      () => ({
        value: value
          ? ([dayjs(value[0]), dayjs(value[1])] as [dayjs.Dayjs, dayjs.Dayjs])
          : undefined,
        defaultValue: defaultValue
          ? ([dayjs(defaultValue[0]), dayjs(defaultValue[1])] as [dayjs.Dayjs, dayjs.Dayjs])
          : undefined,
        placeholder: placeholder as [string, string],
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

    return <RangePicker {...rangePickerProps} />
  },
)

OptimizedTimeRangePicker.displayName = 'OptimizedTimeRangePicker'

export default OptimizedTimeRangePicker
