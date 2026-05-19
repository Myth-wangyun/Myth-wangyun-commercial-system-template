import React, { memo, useCallback, useMemo } from 'react'
import { Input } from 'antd'

const { TextArea } = Input

interface OptimizedTextAreaProps {
  value?: string
  defaultValue?: string
  placeholder?: string
  size?: 'small' | 'middle' | 'large'
  disabled?: boolean
  readOnly?: boolean
  maxLength?: number
  showCount?: boolean
  rows?: number
  autoSize?: boolean | { minRows: number; maxRows: number }
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  onPressEnter?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  onFocus?: (e: React.FocusEvent<HTMLTextAreaElement>) => void
  onBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void
  style?: React.CSSProperties
  className?: string
}

const OptimizedTextArea: React.FC<OptimizedTextAreaProps> = memo(
  ({
    value,
    defaultValue,
    placeholder,
    size = 'middle',
    disabled = false,
    readOnly = false,
    maxLength,
    showCount = false,
    rows = 4,
    autoSize = false,
    onChange,
    onPressEnter,
    onFocus,
    onBlur,
    style,
    className,
  }) => {
    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onChange?.(e)
      },
      [onChange],
    )

    const handlePressEnter = useCallback(
      (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        onPressEnter?.(e)
      },
      [onPressEnter],
    )

    const handleFocus = useCallback(
      (e: React.FocusEvent<HTMLTextAreaElement>) => {
        onFocus?.(e)
      },
      [onFocus],
    )

    const handleBlur = useCallback(
      (e: React.FocusEvent<HTMLTextAreaElement>) => {
        onBlur?.(e)
      },
      [onBlur],
    )

    const textAreaProps = useMemo(
      () => ({
        value,
        defaultValue,
        placeholder,
        size,
        disabled,
        readOnly,
        maxLength,
        showCount,
        rows,
        autoSize,
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
        rows,
        autoSize,
        handleChange,
        handlePressEnter,
        handleFocus,
        handleBlur,
        style,
        className,
      ],
    )

    return <TextArea {...textAreaProps} />
  },
)

OptimizedTextArea.displayName = 'OptimizedTextArea'

export default OptimizedTextArea
