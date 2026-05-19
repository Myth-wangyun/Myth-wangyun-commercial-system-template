import React, { memo, useCallback, useMemo } from 'react'
import { DatePicker } from 'antd'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker

interface OptimizedWeekRangePickerProps {
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

const OptimizedWeekRangePicker: React.FC<OptimizedWeekRangePickerProps> = memo(
  ({
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
    const handleChange = useCallback(
      (dates: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null, dateStrings: [string, string]) => {
        onChange?.(dates, dateStrings)
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
        picker: 'week' as const,
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

OptimizedWeekRangePicker.displayName = 'OptimizedWeekRangePicker'

export default OptimizedWeekRangePicker
