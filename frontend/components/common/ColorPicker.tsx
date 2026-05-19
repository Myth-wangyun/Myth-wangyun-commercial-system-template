import React from 'react'
import { ColorPicker } from 'antd'
import type { Color } from 'antd/es/color-picker'

// Ant Design 5 ColorPicker 只支持 'hex' | 'rgb' 格式
type ColorFormatType = 'hex' | 'rgb'

interface CustomColorPickerProps {
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

const CustomColorPicker: React.FC<CustomColorPickerProps> = ({
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
  const handleChange = (color: Color) => {
    if (onChange) {
      const hex = color.toHexString()
      onChange(hex, hex)
    }
  }

  return (
    <ColorPicker
      value={value}
      defaultValue={defaultValue}
      disabled={disabled}
      showText={showText}
      format={format}
      presets={presets}
      onChange={handleChange}
      style={style}
      className={className}
    />
  )
}

export default CustomColorPicker
