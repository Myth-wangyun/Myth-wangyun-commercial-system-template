import React from 'react'
import { Cascader } from 'antd'

interface CascaderOption {
  value: string | number
  label: string
  children?: CascaderOption[]
  disabled?: boolean
}

interface CustomCascaderProps {
  value?: (string | number)[]
  defaultValue?: (string | number)[]
  placeholder?: string
  size?: 'small' | 'middle' | 'large'
  disabled?: boolean
  loading?: boolean
  allowClear?: boolean
  showSearch?: boolean
  multiple?: boolean
  options?: CascaderOption[]
  onChange?: (value: (string | number)[], selectedOptions?: CascaderOption[]) => void
  onSearch?: (value: string) => void
  onFocus?: () => void
  onBlur?: () => void
  style?: React.CSSProperties
  className?: string
}

const CustomCascader: React.FC<CustomCascaderProps> = ({
  value,
  defaultValue,
  placeholder = '请选择',
  size = 'middle',
  disabled = false,
  loading = false,
  allowClear = false,
  showSearch = false,
  multiple = false,
  options = [],
  onChange,
  onSearch,
  onFocus,
  onBlur,
  style,
  className,
}) => {
  // Ant Design 5 要求 multiple 为字面量 true 而非 boolean
  // 当 multiple=true 时，value 类型为 (string | number)[][]
  if (multiple) {
    return (
      <Cascader
        value={value as unknown as (string | number)[][]}
        defaultValue={defaultValue as unknown as (string | number)[][]}
        placeholder={placeholder}
        size={size}
        disabled={disabled}
        loading={loading}
        allowClear={allowClear}
        showSearch={showSearch}
        multiple={true as const}
        options={options}
        onChange={onChange as unknown as (value: (string | number)[][]) => void}
        onSearch={onSearch}
        onFocus={onFocus}
        onBlur={onBlur}
        style={style}
        className={className}
      />
    )
  }

  return (
    <Cascader
      value={value}
      defaultValue={defaultValue}
      placeholder={placeholder}
      size={size}
      disabled={disabled}
      loading={loading}
      allowClear={allowClear}
      showSearch={showSearch}
      options={options}
      onChange={onChange}
      onSearch={onSearch}
      onFocus={onFocus}
      onBlur={onBlur}
      style={style}
      className={className}
    />
  )
}

export default CustomCascader
