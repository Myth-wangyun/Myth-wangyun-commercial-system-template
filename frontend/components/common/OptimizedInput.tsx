import React, { memo, useCallback, useMemo } from 'react'
import { Input } from 'antd'

interface OptimizedInputProps {
  value?: string
  defaultValue?: string
  placeholder?: string
  size?: 'small' | 'middle' | 'large'
  disabled?: boolean
  readOnly?: boolean
  maxLength?: number
  showCount?: boolean
  prefix?: React.ReactNode
  suffix?: React.ReactNode
  addonBefore?: React.ReactNode
  addonAfter?: React.ReactNode
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  onPressEnter?: (e: React.KeyboardEvent<HTMLInputElement>) => void
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void
  style?: React.CSSProperties
  className?: string
}

const OptimizedInput: React.FC<OptimizedInputProps> = memo(
  ({
    value,
    defaultValue,
    placeholder,
    size = 'middle',
    disabled = false,
    readOnly = false,
    maxLength,
    showCount = false,
    prefix,
    suffix,
    addonBefore,
    addonAfter,
    onChange,
    onPressEnter,
    onFocus,
    onBlur,
    style,
    className,
  }) => {
    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange?.(e)
      },
      [onChange],
    )

    const handlePressEnter = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        onPressEnter?.(e)
      },
      [onPressEnter],
    )

    const handleFocus = useCallback(
      (e: React.FocusEvent<HTMLInputElement>) => {
        onFocus?.(e)
      },
      [onFocus],
    )

    const handleBlur = useCallback(
      (e: React.FocusEvent<HTMLInputElement>) => {
        onBlur?.(e)
      },
      [onBlur],
    )

    const inputProps = useMemo(
      () => ({
        value,
        defaultValue,
        placeholder,
        size,
        disabled,
        readOnly,
        maxLength,
        showCount,
        prefix,
        suffix,
        addonBefore,
        addonAfter,
        onChange: handleChange,
        onPressEnter: handlePressEnter,
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
        maxLength,
        showCount,
        prefix,
        suffix,
        addonBefore,
        addonAfter,
        handleChange,
        handlePressEnter,
        handleFocus,
        handleBlur,
        style,
        className,
      ],
    )

    return <Input {...inputProps} />
  },
)

OptimizedInput.displayName = 'OptimizedInput'

export default OptimizedInput
