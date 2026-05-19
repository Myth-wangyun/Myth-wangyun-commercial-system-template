import React, { memo, useCallback, useMemo } from 'react'
import { InputNumber } from 'antd'

interface OptimizedInputNumberProps {
  value?: number
  defaultValue?: number
  placeholder?: string
  size?: 'small' | 'middle' | 'large'
  disabled?: boolean
  readOnly?: boolean
  min?: number
  max?: number
  step?: number
  precision?: number
  formatter?: (value: number | string | undefined) => string
  parser?: (value: string | undefined) => number
  onChange?: (value: number | null) => void
  onFocus?: () => void
  onBlur?: () => void
  style?: React.CSSProperties
  className?: string
}

const OptimizedInputNumber: React.FC<OptimizedInputNumberProps> = memo(
  ({
    value,
    defaultValue,
    placeholder,
    size = 'middle',
    disabled = false,
    readOnly = false,
    min,
    max,
    step = 1,
    precision,
    formatter,
    parser,
    onChange,
    onFocus,
    onBlur,
    style,
    className,
  }) => {
    const handleChange = useCallback(
      (value: number | null) => {
        onChange?.(value)
      },
      [onChange],
    )

    const handleFocus = useCallback(() => {
      onFocus?.()
    }, [onFocus])

    const handleBlur = useCallback(() => {
      onBlur?.()
    }, [onBlur])

    const inputNumberProps = useMemo(
      () => ({
        value,
        defaultValue,
        placeholder,
        size,
        disabled,
        readOnly,
        min,
        max,
        step,
        precision,
        formatter,
        parser,
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
        min,
        max,
        step,
        precision,
        formatter,
        parser,
        handleChange,
        handleFocus,
        handleBlur,
        style,
        className,
      ],
    )

    return <InputNumber {...inputNumberProps} />
  },
)

OptimizedInputNumber.displayName = 'OptimizedInputNumber'

export default OptimizedInputNumber
