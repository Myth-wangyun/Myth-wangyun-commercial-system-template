import React, { memo, useCallback, useMemo } from 'react'
import { Card } from 'antd'

interface ChartData {
  name: string
  value: number
  color?: string
}

interface OptimizedSimpleChartProps {
  type: 'bar' | 'line' | 'pie'
  data: ChartData[]
  title?: string
  height?: number
  showLegend?: boolean
  showTooltip?: boolean
  style?: React.CSSProperties
  className?: string
}

const OptimizedSimpleChart: React.FC<OptimizedSimpleChartProps> = memo(
  ({
    type,
    data,
    title,
    height = 300,
    showLegend = true,
    showTooltip = true,
    style,
    className,
  }) => {
    void showLegend
    void showTooltip

    const chartStyle = useMemo(
      () => ({
        height,
        ...style,
      }),
      [height, style],
    )

    const renderBarChart = useCallback(() => {
      const maxValue = Math.max(...data.map((item) => item.value))

      return (
        <div style={{ display: 'flex', alignItems: 'end', height: '100%', gap: '8px' }}>
          {data.map((item, index) => (
            <div
              key={index}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
            >
              <div
                style={{
                  height: `${(item.value / maxValue) * 100}%`,
                  backgroundColor: item.color || '#1890ff',
                  width: '100%',
                  minHeight: '4px',
                  borderRadius: '4px 4px 0 0',
                  transition: 'height 0.3s ease',
                }}
              />
              <div style={{ marginTop: '8px', fontSize: '12px', textAlign: 'center' }}>
                {item.name}
              </div>
            </div>
          ))}
        </div>
      )
    }, [data])

    const renderLineChart = useCallback(() => {
      const maxValue = Math.max(...data.map((item) => item.value))
      const minValue = Math.min(...data.map((item) => item.value))
      const range = maxValue - minValue

      return (
        <div style={{ position: 'relative', height: '100%' }}>
          <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
            <polyline
              points={data
                .map((item, index) => {
                  const x = (index / (data.length - 1)) * 100
                  const y = 100 - ((item.value - minValue) / range) * 100
                  return `${x},${y}`
                })
                .join(' ')}
              fill="none"
              stroke="#1890ff"
              strokeWidth="2"
            />
            {data.map((item, index) => {
              const x = (index / (data.length - 1)) * 100
              const y = 100 - ((item.value - minValue) / range) * 100
              return <circle key={index} cx={x} cy={y} r="4" fill="#1890ff" />
            })}
          </svg>
        </div>
      )
    }, [data])

    const renderPieChart = useCallback(() => {
      const total = data.reduce((sum, item) => sum + item.value, 0)
      let currentAngle = 0

      return (
        <div style={{ position: 'relative', height: '100%' }}>
          <svg
            width="100%"
            height="100%"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          >
            {data.map((item, index) => {
              const angle = (item.value / total) * 360
              const startAngle = currentAngle
              const endAngle = currentAngle + angle
              currentAngle += angle

              const radius = 40
              const x1 = radius * Math.cos((startAngle * Math.PI) / 180)
              const y1 = radius * Math.sin((startAngle * Math.PI) / 180)
              const x2 = radius * Math.cos((endAngle * Math.PI) / 180)
              const y2 = radius * Math.sin((endAngle * Math.PI) / 180)

              const largeArcFlag = angle > 180 ? 1 : 0
              const pathData = `M 0 0 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`

              return (
                <path
                  key={index}
                  d={pathData}
                  fill={item.color || `hsl(${index * 60}, 70%, 50%)`}
                  stroke="#fff"
                  strokeWidth="1"
                />
              )
            })}
          </svg>
        </div>
      )
    }, [data])

    const renderChart = useCallback(() => {
      switch (type) {
        case 'bar':
          return renderBarChart()
        case 'line':
          return renderLineChart()
        case 'pie':
          return renderPieChart()
        default:
          return null
      }
    }, [type, renderBarChart, renderLineChart, renderPieChart])

    return (
      <Card title={title} style={chartStyle} className={className}>
        {renderChart()}
      </Card>
    )
  },
)

OptimizedSimpleChart.displayName = 'OptimizedSimpleChart'

export default OptimizedSimpleChart
