import React from 'react'
import { Rate } from 'antd'

interface CustomRateProps {
  value?: number
  defaultValue?: number
  count?: number
  allowHalf?: boolean
  allowClear?: boolean
  disabled?: boolean
  character?: React.ReactNode
  tooltips?: string[]
  onChange?: (value: number) => void
  onHoverChange?: (value: number) => void
  style?: React.CSSProperties
  className?: string
}

const CustomRate: React.FC<CustomRateProps> = ({
  value,
  defaultValue,
  count = 5,
  allowHalf = false,
  allowClear = true,
  disabled = false,
  character,
  tooltips,
  onChange,
  onHoverChange,
  style,
  className,
}) => {
  return (
    <Rate
      value={value}
      defaultValue={defaultValue}
      count={count}
      allowHalf={allowHalf}
      allowClear={allowClear}
      disabled={disabled}
      character={character}
      tooltips={tooltips}
      onChange={onChange}
      onHoverChange={onHoverChange}
      style={style}
      className={className}
    />
  )
}

export default CustomRate
