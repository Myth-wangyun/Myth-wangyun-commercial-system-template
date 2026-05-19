/**
 * 全局年份选择器组件
 * 
 * 功能：
 * - 支持选择任意年份（可直接输入）
 * - 提供常用年份快速选择（默认2020-2030）
 * - 可配置最小/最大年份范围
 * - 统一所有页面的年份选择体验
 * 
 * 使用示例：
 * ```tsx
 * <GlobalYearSelector 
 *   value={selectedYear} 
 *   onChange={setSelectedYear} 
 * />
 * ```
 */

import React, { useMemo } from 'react'
import { Select, InputNumber } from 'antd'
import type { SelectProps } from 'antd'

const { Option } = Select

export interface GlobalYearSelectorProps {
  /** 当前选中的年份 */
  value?: number
  /** 默认年份 */
  defaultValue?: number
  /** 年份变化回调 */
  onChange?: (year: number) => void
  /** 最小年份（默认：2000） */
  minYear?: number
  /** 最大年份（默认：2100） */
  maxYear?: number
  /** 是否显示常用年份快速选择（默认：true） */
  showQuickSelect?: boolean
  /** 常用年份范围（默认：2020-2030） */
  quickSelectRange?: [number, number]
  /** 样式 */
  style?: React.CSSProperties
  /** 宽度 */
  width?: number | string
  /** 尺寸 */
  size?: 'small' | 'middle' | 'large'
  /** 是否禁用 */
  disabled?: boolean
  /** 占位符 */
  placeholder?: string
  /** 是否允许清除 */
  allowClear?: boolean
  /** 类名 */
  className?: string
  /** 使用InputNumber模式（直接输入，不显示下拉列表） */
  useInputNumber?: boolean
}

const GlobalYearSelector: React.FC<GlobalYearSelectorProps> = ({
  value,
  defaultValue,
  onChange,
  minYear = 2000,
  maxYear = 2100,
  showQuickSelect = true,
  quickSelectRange = [2020, 2030],
  style,
  width = 120,
  size = 'middle',
  disabled = false,
  placeholder = '选择年份',
  allowClear = true,
  className,
  useInputNumber = false,
}) => {
  // 生成常用年份列表
  const quickSelectYears = useMemo(() => {
    if (!showQuickSelect) return []
    const [start, end] = quickSelectRange
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }, [showQuickSelect, quickSelectRange])

  // 如果使用InputNumber模式，直接返回InputNumber
  if (useInputNumber) {
    return (
      <InputNumber
        value={value}
        defaultValue={defaultValue}
        onChange={(val) => {
          if (val !== null && val >= minYear && val <= maxYear) {
            onChange?.(val)
          }
        }}
        min={minYear}
        max={maxYear}
        precision={0}
        style={{ width, ...style }}
        size={size}
        disabled={disabled}
        placeholder={placeholder}
        className={className}
      />
    )
  }

  // 处理Select选择变化
  const handleSelectChange = (selectedValue: string | number) => {
    const year = typeof selectedValue === 'string' ? parseInt(selectedValue, 10) : selectedValue
    if (!isNaN(year) && year >= minYear && year <= maxYear) {
      onChange?.(year)
    }
  }

  // 处理搜索输入（支持直接输入年份）
  const handleSearch = (searchValue: string) => {
    const year = parseInt(searchValue, 10)
    if (!isNaN(year) && year >= minYear && year <= maxYear) {
      onChange?.(year)
    }
  }

  const selectProps: SelectProps = {
    value: value?.toString(),
    defaultValue: defaultValue?.toString(),
    onChange: handleSelectChange,
    onSearch: handleSearch,
    style: { width, ...style },
    size,
    disabled,
    placeholder,
    allowClear,
    className,
    showSearch: true,
    filterOption: (input, option) => {
      // 如果输入的是纯数字，允许直接输入
      if (/^\d+$/.test(input)) {
        const inputYear = parseInt(input, 10)
        if (inputYear >= minYear && inputYear <= maxYear) {
          return true
        }
      }
      // 否则按选项值过滤
      const optionValue = option?.value?.toString() || ''
      return optionValue.includes(input)
    },
    notFoundContent: null, // 允许输入不在列表中的年份
  }

  return (
    <Select {...selectProps}>
      {showQuickSelect &&
        quickSelectYears.map((year) => (
          <Option key={year} value={year.toString()}>
            {year}
          </Option>
        ))}
    </Select>
  )
}

export default GlobalYearSelector

