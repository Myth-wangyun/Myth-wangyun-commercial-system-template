import React from 'react'
import { TreeSelect } from 'antd'
import type { TreeSelectProps } from 'antd'

interface TreeNode {
  title: string
  value: string | number
  key: string | number
  children?: TreeNode[]
  disabled?: boolean
}

type TreeValue = string | number | Array<string | number>

interface CustomTreeSelectProps {
  value?: TreeValue
  defaultValue?: TreeValue
  placeholder?: string
  size?: 'small' | 'middle' | 'large'
  disabled?: boolean
  loading?: boolean
  allowClear?: boolean
  showSearch?: boolean
  multiple?: boolean
  treeCheckable?: boolean
  treeData?: TreeNode[]
  onChange?: TreeSelectProps<TreeValue>['onChange']
  onSearch?: (value: string) => void
  onFocus?: () => void
  onBlur?: () => void
  style?: React.CSSProperties
  className?: string
}

const CustomTreeSelect: React.FC<CustomTreeSelectProps> = ({
  value,
  defaultValue,
  placeholder = '请选择',
  size = 'middle',
  disabled = false,
  loading = false,
  allowClear = false,
  showSearch = false,
  multiple = false,
  treeCheckable = false,
  treeData = [],
  onChange,
  onSearch,
  onFocus,
  onBlur,
  style,
  className,
}) => {
  return (
    <TreeSelect
      value={value}
      defaultValue={defaultValue}
      placeholder={placeholder}
      size={size}
      disabled={disabled}
      loading={loading}
      allowClear={allowClear}
      showSearch={showSearch}
      multiple={multiple}
      treeCheckable={treeCheckable}
      treeData={treeData}
      onChange={onChange}
      onSearch={onSearch}
      onFocus={onFocus}
      onBlur={onBlur}
      style={style}
      className={className}
    />
  )
}

export default CustomTreeSelect
