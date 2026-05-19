import React, { memo, useCallback, useMemo } from 'react'
import { DatePicker } from 'antd'
import dayjs from 'dayjs'

const { QuarterPicker } = DatePicker

interface OptimizedQuarterPickerProps {
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

const OptimizedQuarterPicker: React.FC<OptimizedQuarterPickerProps> = memo(
  ({
    value,
    defaultValue,
    placeholder = '请选择季度',
    size = 'middle',
    disabled = false,
    readOnly = false,
    allowClear = true,
    format = 'YYYY-[Q]Q',
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

    const quarterPickerProps = useMemo(
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

    return <QuarterPicker {...quarterPickerProps} />
  },
)

OptimizedQuarterPicker.displayName = 'OptimizedQuarterPicker'

export default OptimizedQuarterPicker
