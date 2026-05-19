import React, { memo, useCallback, useMemo } from 'react'
import { Input } from 'antd'

interface OptimizedSearchInputProps {
  value?: string
  defaultValue?: string
  placeholder?: string
  size?: 'small' | 'middle' | 'large'
  disabled?: boolean
  loading?: boolean
  allowClear?: boolean
  enterButton?: boolean | React.ReactNode
  onSearch?: (value: string) => void
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  onPressEnter?: (e: React.KeyboardEvent<HTMLInputElement>) => void
  style?: React.CSSProperties
  className?: string
}

const OptimizedSearchInput: React.FC<OptimizedSearchInputProps> = memo(
  ({
    value,
    defaultValue,
    placeholder = '请输入搜索关键词',
    size = 'middle',
    disabled = false,
    loading = false,
    allowClear = true,
    enterButton = true,
    onSearch,
    onChange,
    onPressEnter,
    style,
    className,
  }) => {
    const handleSearch = useCallback(
      (value: string) => {
        onSearch?.(value)
      },
      [onSearch],
    )

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

    const searchProps = useMemo(
      () => ({
        value,
        defaultValue,
        placeholder,
        size,
        disabled,
        loading,
        allowClear,
        enterButton,
        onSearch: handleSearch,
        onChange: handleChange,
        onPressEnter: handlePressEnter,
        style,
        className,
      }),
      [
        value,
        defaultValue,
        placeholder,
        size,
        disabled,
        loading,
        allowClear,
        enterButton,
        handleSearch,
        handleChange,
        handlePressEnter,
        style,
        className,
      ],
    )

    return <Input.Search {...searchProps} />
  },
)

OptimizedSearchInput.displayName = 'OptimizedSearchInput'

export default OptimizedSearchInput
