import React, { useState, useEffect } from 'react'
import { Input } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { useDebounce } from '../../hooks/useDebounce'

interface DebouncedSearchProps {
  placeholder?: string
  delay?: number
  onSearch: (value: string) => void
  onClear?: () => void
  style?: React.CSSProperties
  className?: string
  size?: 'small' | 'middle' | 'large'
  disabled?: boolean
}

const DebouncedSearch: React.FC<DebouncedSearchProps> = ({
  placeholder = '请输入搜索关键词',
  delay = 300,
  onSearch,
  onClear,
  style,
  className,
  size = 'middle',
  disabled = false,
}) => {
  const [value, setValue] = useState('')
  const debouncedValue = useDebounce(value, delay)

  useEffect(() => {
    if (debouncedValue) {
      onSearch(debouncedValue)
    } else if (debouncedValue === '' && onClear) {
      onClear()
    }
  }, [debouncedValue, onSearch, onClear])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value)
  }

  const handleClear = () => {
    setValue('')
    if (onClear) {
      onClear()
    }
  }

  return (
    <Input
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      prefix={<SearchOutlined />}
      allowClear
      onClear={handleClear}
      style={style}
      className={className}
      size={size}
      disabled={disabled}
    />
  )
}

export default DebouncedSearch
