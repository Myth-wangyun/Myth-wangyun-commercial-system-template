import React from 'react'
import { Steps } from 'antd'

interface StepItem {
  title: string
  description?: string
  icon?: React.ReactNode
  status?: 'wait' | 'process' | 'finish' | 'error'
  disabled?: boolean
}

interface CustomStepsProps {
  items: StepItem[]
  current?: number
  onChange?: (current: number) => void
  direction?: 'horizontal' | 'vertical'
  size?: 'default' | 'small'
  status?: 'wait' | 'process' | 'finish' | 'error'
  type?: 'default' | 'navigation'
  style?: React.CSSProperties
  className?: string
}

const CustomSteps: React.FC<CustomStepsProps> = ({
  items,
  current,
  onChange,
  direction = 'horizontal',
  size = 'default',
  status,
  type = 'default',
  style,
  className,
}) => {
  const stepItems = items.map((item) => ({
    title: item.title,
    description: item.description,
    icon: item.icon,
    status: item.status,
    disabled: item.disabled,
  }))

  return (
    <Steps
      items={stepItems}
      current={current}
      onChange={onChange}
      direction={direction}
      size={size}
      status={status}
      type={type}
      style={style}
      className={className}
    />
  )
}

export default CustomSteps
