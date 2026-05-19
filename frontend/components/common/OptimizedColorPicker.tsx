import React, { memo, useCallback, useMemo } from 'react'
import { ColorPicker } from 'antd'
import type { Color } from 'antd/es/color-picker'

// Ant Design 5 ColorPicker 只支持 'hex' | 'rgb' 格式
type ColorFormatType = 'hex' | 'rgb'

interface OptimizedColorPickerProps {
  value?: string
  defaultValue?: string
  disabled?: boolean
  showText?: boolean
  format?: ColorFormatType
  presets?: Array<{
    label: string
    colors: string[]
  }>
  onChange?: (color: string, hex: string) => void
  style?: React.CSSProperties
  className?: string
}

const OptimizedColorPicker: React.FC<OptimizedColorPickerProps> = memo(
  ({
    value,
    defaultValue,
    disabled = false,
    showText = true,
    format = 'hex',
    presets,
    onChange,
    style,
    className,
  }) => {
    const handleChange = useCallback(
      (color: Color) => {
        if (onChange) {
          const hex = color.toHexString()
          onChange(hex, hex)
        }
      },
      [onChange],
    )

    const colorPickerProps = useMemo(
      () => ({
        value,
        defaultValue,
        disabled,
        showText,
        format,
        presets,
        onChange: handleChange,
        style,
        className,
      }),
      [value, defaultValue, disabled, showText, format, presets, handleChange, style, className],
    )

    return <ColorPicker {...colorPickerProps} />
  },
)

OptimizedColorPicker.displayName = 'OptimizedColorPicker'

export default OptimizedColorPicker
