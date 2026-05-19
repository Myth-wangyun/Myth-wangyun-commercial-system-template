import React from 'react'
import { Select } from 'antd'
import type { SelectProps } from 'antd'

const { Option } = Select

interface SelectOption {
  value: string | number
  label: string
  disabled?: boolean
}

type SelectValue = string | number | Array<string | number>

interface CustomSelectProps {
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

const CustomSelect: React.FC<CustomSelectProps> = ({
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
  return (
    <Select
      value={value}
      defaultValue={defaultValue}
      placeholder={placeholder}
      size={size}
      disabled={disabled}
      loading={loading}
      allowClear={allowClear}
      showSearch={showSearch}
      mode={mode}
      onChange={onChange}
      onSearch={onSearch}
      onFocus={onFocus}
      onBlur={onBlur}
      style={style}
      className={className}
    >
      {options.map((option) => (
        <Option key={option.value} value={option.value} disabled={option.disabled}>
          {option.label}
        </Option>
      ))}
    </Select>
  )
}

export default CustomSelect
