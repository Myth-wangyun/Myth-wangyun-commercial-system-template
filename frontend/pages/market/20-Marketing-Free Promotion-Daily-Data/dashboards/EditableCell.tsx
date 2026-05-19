import React, { memo } from 'react'
import { InputNumber } from 'antd'

interface EditableCellProps {
  value: number
  onChange: (value: number | null) => void
  isSummary?: boolean
  min?: number
  max?: number
  precision?: number
  formatter?: (value: number) => string
}

/**
 * 高度优化的可编辑单元格组件
 * - 使用 memo 避免不必要的重渲染
 * - 汇总行只显示文本，不渲染 InputNumber
 * - 严格的比较函数确保最小化重渲染
 */
const EditableCell: React.FC<EditableCellProps> = memo(({
  value,
  onChange,
  isSummary = false,
  min = 0,
  max,
  precision,
  formatter
}) => {
  // 汇总行直接显示格式化后的值（不创建任何组件实例）
  if (isSummary) {
    if (formatter) {
      return <span style={{ display: 'inline-block', width: '100%', textAlign: 'center' }}>{formatter(value)}</span>
    }
    if (precision !== undefined) {
      return <span style={{ display: 'inline-block', width: '100%', textAlign: 'center' }}>{value.toFixed(precision)}</span>
    }
    return <span style={{ display: 'inline-block', width: '100%', textAlign: 'center' }}>{value}</span>
  }

  // 可编辑单元格 - 使用内联样式避免样式重计算
  return (
    <InputNumber
      value={value}
      onChange={onChange}
      min={min}
      max={max}
      precision={precision}
      style={{ width: '100%' }}
      className="editable-cell-input-center"
      size="small"
      controls={false}
    />
  )
}, (prevProps, nextProps) => {
  // 严格的比较函数 - 只在值真正改变时重渲染
  if (prevProps.isSummary !== nextProps.isSummary) return false
  if (prevProps.value !== nextProps.value) return false
  if (prevProps.min !== nextProps.min) return false
  if (prevProps.max !== nextProps.max) return false
  if (prevProps.precision !== nextProps.precision) return false
  return true
})

EditableCell.displayName = 'EditableCell'

export default EditableCell

