import React from 'react'
import { Card, Typography } from 'antd'

const { Title } = Typography

interface ChartData {
  name: string
  value: number
  color?: string
}

interface SimpleChartProps {
  title?: string
  data: ChartData[]
  type: 'bar' | 'line' | 'pie'
  height?: number
  showValues?: boolean
  showLegend?: boolean
}

const SimpleChart: React.FC<SimpleChartProps> = ({
  title,
  data,
  type,
  height = 300,
  showValues = true,
  showLegend = true,
}) => {
  if (!data || data.length === 0) {
    return (
      <Card>
        {title && <Title level={4}>{title}</Title>}
        <div
          style={{
            height,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#999',
          }}
        >
          暂无数据
        </div>
      </Card>
    )
  }

  const maxValue = Math.max(...data.map((item) => item.value))
  const colors = [
    '#1890ff',
    '#52c41a',
    '#faad14',
    '#f5222d',
    '#722ed1',
    '#13c2c2',
    '#eb2f96',
    '#fa8c16',
    '#a0d911',
    '#2f54eb',
  ]

  const renderBarChart = () => {
    return (
      <div style={{ height, padding: '20px 0' }}>
        {data.map((item, index) => {
          const percentage = (item.value / maxValue) * 100
          const color = item.color || colors[index % colors.length]

          return (
            <div key={item.name} style={{ marginBottom: 16 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 4,
                  fontSize: 12,
                }}
              >
                <span>{item.name}</span>
                {showValues && <span>{item.value}</span>}
              </div>
              <div
                style={{
                  width: '100%',
                  height: 20,
                  backgroundColor: '#f0f0f0',
                  borderRadius: 10,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${percentage}%`,
                    height: '100%',
                    backgroundColor: color,
                    transition: 'width 0.3s ease',
                    borderRadius: 10,
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const renderLineChart = () => {
    const points = data
      .map((item, index) => {
        const x = (index / (data.length - 1)) * 100
        const y = 100 - (item.value / maxValue) * 100
        return `${x},${y}`
      })
      .join(' ')

    return (
      <div style={{ height, padding: '20px 0', position: 'relative' }}>
        <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
          {/* 网格线 */}
          {[0, 25, 50, 75, 100].map((y) => (
            <line
              key={y}
              x1="0"
              y1={`${y}%`}
              x2="100%"
              y2={`${y}%`}
              stroke="#f0f0f0"
              strokeWidth="1"
            />
          ))}

          {/* 数据线 */}
          <polyline points={points} fill="none" stroke="#1890ff" strokeWidth="2" />

          {/* 数据点 */}
          {data.map((item, index) => {
            const x = (index / (data.length - 1)) * 100
            const y = 100 - (item.value / maxValue) * 100
            return <circle key={index} cx={`${x}%`} cy={`${y}%`} r="4" fill="#1890ff" />
          })}
        </svg>

        {/* X轴标签 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 10,
            fontSize: 12,
            color: '#666',
          }}
        >
          {data.map((item, index) => (
            <span key={index} style={{ textAlign: 'center', flex: 1 }}>
              {item.name}
            </span>
          ))}
        </div>
      </div>
    )
  }

  const renderPieChart = () => {
    const total = data.reduce((sum, item) => sum + item.value, 0)
    let currentAngle = 0

    return (
      <div style={{ height, padding: '20px 0', position: 'relative' }}>
        <svg width="100%" height="100%" viewBox="0 0 200 200">
          {data.map((item, index) => {
            const angle = (item.value / total) * 360
            const color = item.color || colors[index % colors.length]

            const startAngle = currentAngle
            const endAngle = currentAngle + angle
            currentAngle += angle

            const startAngleRad = (startAngle - 90) * (Math.PI / 180)
            const endAngleRad = (endAngle - 90) * (Math.PI / 180)

            const x1 = 100 + 80 * Math.cos(startAngleRad)
            const y1 = 100 + 80 * Math.sin(startAngleRad)
            const x2 = 100 + 80 * Math.cos(endAngleRad)
            const y2 = 100 + 80 * Math.sin(endAngleRad)

            const largeArcFlag = angle > 180 ? 1 : 0

            const pathData = [
              `M 100 100`,
              `L ${x1} ${y1}`,
              `A 80 80 0 ${largeArcFlag} 1 ${x2} ${y2}`,
              'Z',
            ].join(' ')

            return <path key={item.name} d={pathData} fill={color} stroke="#fff" strokeWidth="2" />
          })}
        </svg>

        {/* 图例 */}
        {showLegend && (
          <div
            style={{
              position: 'absolute',
              right: 20,
              top: 20,
              fontSize: 12,
            }}
          >
            {data.map((item, index) => {
              const color = item.color || colors[index % colors.length]
              return (
                <div
                  key={item.name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: 4,
                  }}
                >
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      backgroundColor: color,
                      marginRight: 8,
                      borderRadius: 2,
                    }}
                  />
                  <span>{item.name}</span>
                  {showValues && <span style={{ marginLeft: 8 }}>({item.value})</span>}
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return renderBarChart()
      case 'line':
        return renderLineChart()
      case 'pie':
        return renderPieChart()
      default:
        return renderBarChart()
    }
  }

  return (
    <Card>
      {title && <Title level={4}>{title}</Title>}
      {renderChart()}
    </Card>
  )
}

export default SimpleChart
