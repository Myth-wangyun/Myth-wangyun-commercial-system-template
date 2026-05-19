import React, { memo, useCallback, useMemo } from 'react'
import { Select } from 'antd'
import type { SelectProps } from 'antd'

const { Option } = Select

interface SelectOption {
  value: string | number
  label: string
  disabled?: boolean
}

type SelectValue = string | number | Array<string | number>

interface OptimizedSelectProps {
  value?: SelectValue
  defaultValue?: SelectValue
  placeholder?: string
  size?: 'small' | 'middle' | 'large'
  disabled?: boolean
  loading?: boolean
  allowClear?: boolean
  showSearch?: boolean
  mode?: 'multiple' | 'tags'
  options?: SelectOption[]
  onChange?: SelectProps<SelectValue>['onChange']
  onSearch?: (value: string) => void
  onFocus?: () => void
  onBlur?: () => void
  style?: React.CSSProperties
  className?: string
}

const OptimizedSelect: React.FC<OptimizedSelectProps> = memo(
  ({
    value,
    defaultValue,
    placeholder,
    size = 'middle',
    disabled = false,
    loading = false,
    allowClear = false,
    showSearch = false,
    mode,
    options = [],
    onChange,
    onSearch,
    onFocus,
    onBlur,
    style,
    className,
  }) => {
    const handleChange = useCallback(
      (...args: Parameters<NonNullable<SelectProps<SelectValue>['onChange']>>) => {
        onChange?.(...args)
      },
      [onChange],
    )

    const handleSearch = useCallback(
      (value: string) => {
        onSearch?.(value)
      },
      [onSearch],
    )

    const handleFocus = useCallback(() => {
      onFocus?.()
    }, [onFocus])

    const handleBlur = useCallback(() => {
      onBlur?.()
    }, [onBlur])

    const selectProps = useMemo(
      () => ({
        value,
        defaultValue,
        placeholder,
        size,
        disabled,
        loading,
        allowClear,
        showSearch,
        mode,
        onChange: handleChange,
        onSearch: handleSearch,
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
        loading,
        allowClear,
        showSearch,
        mode,
        handleChange,
        handleSearch,
        handleFocus,
        handleBlur,
        style,
        className,
      ],
    )

    return (
      <Select {...selectProps}>
        {options.map((option) => (
          <Option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </Option>
        ))}
      </Select>
    )
  },
)

OptimizedSelect.displayName = 'OptimizedSelect'

export default OptimizedSelect
