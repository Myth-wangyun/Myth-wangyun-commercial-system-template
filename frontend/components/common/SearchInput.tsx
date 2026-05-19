import React from 'react'
import { Input, Button, Space } from 'antd'
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  onSearch?: (value: string) => void
  onReset?: () => void
  placeholder?: string
  loading?: boolean
  showReset?: boolean
  showSearch?: boolean
  style?: React.CSSProperties
  size?: 'small' | 'middle' | 'large'
}

const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  onSearch,
  onReset,
  placeholder = '请输入搜索关键词',
  loading = false,
  showReset = true,
  showSearch = true,
  style,
  size = 'middle',
}) => {
  const handleSearch = () => {
    if (onSearch) {
      onSearch(value)
    }
  }

  const handleReset = () => {
    onChange('')
    if (onReset) {
      onReset()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <Space.Compact style={style}>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder={placeholder}
        size={size}
        style={{ width: 200 }}
      />
      {showSearch && (
        <Button
          type="primary"
          icon={<SearchOutlined />}
          onClick={handleSearch}
          loading={loading}
          size={size}
        >
          搜索
        </Button>
      )}
      {showReset && (
        <Button icon={<ReloadOutlined />} onClick={handleReset} size={size}>
          重置
        </Button>
      )}
    </Space.Compact>
  )
}

export default SearchInput
