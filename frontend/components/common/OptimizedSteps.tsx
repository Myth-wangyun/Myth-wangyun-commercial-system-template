import React, { memo, useCallback, useMemo } from 'react'
import { Steps } from 'antd'

const { Step } = Steps

interface StepItem {
  title: string
  description?: string
  icon?: React.ReactNode
  status?: 'wait' | 'process' | 'finish' | 'error'
  disabled?: boolean
}

interface OptimizedStepsProps {
  current?: number
  status?: 'wait' | 'process' | 'finish' | 'error'
  direction?: 'horizontal' | 'vertical'
  size?: 'default' | 'small'
  items: StepItem[]
  onChange?: (current: number) => void
  style?: React.CSSProperties
  className?: string
}

const OptimizedSteps: React.FC<OptimizedStepsProps> = memo(
  ({
    current = 0,
    status = 'process',
    direction = 'horizontal',
    size = 'default',
    items,
    onChange,
    style,
    className,
  }) => {
    const handleChange = useCallback(
      (current: number) => {
        onChange?.(current)
      },
      [onChange],
    )

    const stepsProps = useMemo(
      () => ({
        current,
        status,
        direction,
        size,
        onChange: handleChange,
        style,
        className,
      }),
      [current, status, direction, size, handleChange, style, className],
    )

    return (
      <Steps {...stepsProps}>
        {items.map((item, index) => (
          <Step
            key={index}
            title={item.title}
            description={item.description}
            icon={item.icon}
            status={item.status}
            disabled={item.disabled}
          />
        ))}
      </Steps>
    )
  },
)

OptimizedSteps.displayName = 'OptimizedSteps'

export default OptimizedSteps
