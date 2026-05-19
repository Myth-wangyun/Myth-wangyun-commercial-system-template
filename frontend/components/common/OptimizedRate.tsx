import React, { memo, useCallback, useMemo } from 'react'
import { Rate } from 'antd'

interface OptimizedRateProps {
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

const OptimizedRate: React.FC<OptimizedRateProps> = memo(
  ({
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
    const handleChange = useCallback(
      (value: number) => {
        onChange?.(value)
      },
      [onChange],
    )

    const handleHoverChange = useCallback(
      (value: number) => {
        onHoverChange?.(value)
      },
      [onHoverChange],
    )

    const rateProps = useMemo(
      () => ({
        value,
        defaultValue,
        count,
        allowHalf,
        allowClear,
        disabled,
        character,
        tooltips,
        onChange: handleChange,
        onHoverChange: handleHoverChange,
        style,
        className,
      }),
      [
        value,
        defaultValue,
        count,
        allowHalf,
        allowClear,
        disabled,
        character,
        tooltips,
        handleChange,
        handleHoverChange,
        style,
        className,
      ],
    )

    return <Rate {...rateProps} />
  },
)

OptimizedRate.displayName = 'OptimizedRate'

export default OptimizedRate
