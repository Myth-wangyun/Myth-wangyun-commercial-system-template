import React, { memo, useCallback, useMemo } from 'react'
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

interface OptimizedTreeSelectProps {
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

const OptimizedTreeSelect: React.FC<OptimizedTreeSelectProps> = memo(
  ({
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
    const handleChange = useCallback(
      (...args: Parameters<NonNullable<TreeSelectProps<TreeValue>['onChange']>>) => {
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

    const treeSelectProps = useMemo(
      () => ({
        value,
        defaultValue,
        placeholder,
        size,
        disabled,
        loading,
        allowClear,
        showSearch,
        multiple,
        treeCheckable,
        treeData,
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
        multiple,
        treeCheckable,
        treeData,
        handleChange,
        handleSearch,
        handleFocus,
        handleBlur,
        style,
        className,
      ],
    )

    return <TreeSelect {...treeSelectProps} />
  },
)

OptimizedTreeSelect.displayName = 'OptimizedTreeSelect'

export default OptimizedTreeSelect
