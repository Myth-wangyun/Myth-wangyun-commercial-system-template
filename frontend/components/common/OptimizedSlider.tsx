import React, { memo, useCallback } from 'react'
import { Slider } from 'antd'

interface OptimizedSliderProps {
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

const OptimizedSlider: React.FC<OptimizedSliderProps> = memo(
  ({
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
    const handleChange = useCallback(
      (value: number | number[]) => {
        onChange?.(value)
      },
      [onChange],
    )

    const handleAfterChange = useCallback(
      (value: number | number[]) => {
        onAfterChange?.(value)
      },
      [onAfterChange],
    )

    if (range) {
      return (
        <Slider
          value={value as number[] | undefined}
          defaultValue={defaultValue as number[] | undefined}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          range={true}
          vertical={vertical}
          marks={marks}
          tooltip={tooltip}
          onChange={handleChange}
          onAfterChange={handleAfterChange}
          style={style}
          className={className}
        />
      )
    }

    return (
      <Slider
        value={value as number | undefined}
        defaultValue={defaultValue as number | undefined}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        range={false}
        vertical={vertical}
        marks={marks}
        tooltip={tooltip}
        onChange={handleChange}
        onAfterChange={handleAfterChange}
        style={style}
        className={className}
      />
    )
  },
)

OptimizedSlider.displayName = 'OptimizedSlider'

export default OptimizedSlider
