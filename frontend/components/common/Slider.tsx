import React from 'react'
import { Slider } from 'antd'

interface CustomSliderProps {
  value?: number | number[]
  defaultValue?: number | number[]
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  range?: boolean
  vertical?: boolean
  marks?: Record<number, React.ReactNode>
  tooltip?: {
    formatter?: (value: number | undefined) => React.ReactNode
    placement?: 'top' | 'bottom' | 'left' | 'right'
  }
  onChange?: (value: number | number[]) => void
  onAfterChange?: (value: number | number[]) => void
  style?: React.CSSProperties
  className?: string
}

const CustomSlider: React.FC<CustomSliderProps> = ({
  value,
  defaultValue,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  range = false,
  vertical = false,
  marks,
  tooltip,
  onChange,
  onAfterChange,
  style,
  className,
}) => {
  // Ant Design 5 要求 range 为字面量 true 时 value 必须是数组
  if (range) {
    return (
      <Slider
        value={value as number[]}
        defaultValue={defaultValue as number[]}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        range={true as const}
        vertical={vertical}
        marks={marks}
        tooltip={tooltip}
        onChange={onChange}
        onChangeComplete={onAfterChange}
        style={style}
        className={className}
      />
    )
  }

  return (
    <Slider
      value={value as number}
      defaultValue={defaultValue as number}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      vertical={vertical}
      marks={marks}
      tooltip={tooltip}
      onChange={onChange}
      onChangeComplete={onAfterChange}
      style={style}
      className={className}
    />
  )
}

export default CustomSlider
