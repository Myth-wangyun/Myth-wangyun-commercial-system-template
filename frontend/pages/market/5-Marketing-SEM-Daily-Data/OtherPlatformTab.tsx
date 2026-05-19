import React, { useCallback, useMemo } from 'react'
import { InputNumber, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'

export type OtherPlatformRow = {
  key: string
  weekday: string
  dateText: string
  otherActualIncome: number
  otherConversionRate: string
  refundCount: number
  netSignup: number
  grossTotal: number
  orderCount: number
  visitCount: number
  otherConsultCount: number
  consultCost: string
  otherConsumption: number
  // 其他咨询量
  campusWebsiteVisit: number
  geo: number
}

type EditableField = keyof Omit<
  OtherPlatformRow,
  'key' | 'weekday' | 'dateText' | 'otherConversionRate' | 'consultCost'
>

interface OtherPlatformTabProps {
  data: OtherPlatformRow[]
  loading: boolean
  onUpdate: (rowKey: string, field: EditableField, value: number) => void
  readonly?: boolean
}

// 将样式对象移到组件外部
const greenHeaderStyle: React.CSSProperties = {
  backgroundColor: '#00B050',
  color: '#000',
  fontWeight: 'bold',
  textAlign: 'center',
}

const lightGreenHeaderStyle: React.CSSProperties = {
  backgroundColor: '#92D050',
  color: '#000',
  fontWeight: 'bold',
  textAlign: 'center',
}

const orangeHeaderStyle: React.CSSProperties = {
  backgroundColor: '#FCE4D6',
  color: '#C00000',
  fontWeight: 'bold',
  textAlign: 'center',
}

const yellowHeaderStyle: React.CSSProperties = {
  backgroundColor: '#FFF2CC',
  color: '#000',
  fontWeight: 'bold',
  textAlign: 'center',
}

const boldStyle: React.CSSProperties = { fontWeight: 'bold' }

const OtherPlatformTab: React.FC<OtherPlatformTabProps> = React.memo(({ data, loading, onUpdate, readonly = false }) => {
  const renderEditableNumber = useCallback((record: OtherPlatformRow, field: EditableField) => {
    const value = record[field]
    const isZero = value === 0
    
    // 判断是否需要显示两位小数
    const needDecimal = field === 'otherConsumption'
    const displayValue = needDecimal ? (typeof value === 'number' ? value.toFixed(2) : value) : value
    
    if (record.key === 'summary') {
      return <span style={{ fontWeight: 'bold', color: isZero ? '#999' : 'inherit' }}>{displayValue}</span>
    }

    if (readonly) {
      return <span style={{ color: isZero ? '#999' : 'inherit' }}>{displayValue}</span>
    }

    return (
      <InputNumber
        value={value}
        min={0}
        precision={needDecimal ? 2 : 0}
        style={{ width: '100%' }}
        controls={false}
        onChange={(val) => onUpdate(record.key, field, typeof val === 'number' ? val : 0)}
      />
    )
  }, [readonly, onUpdate])

  const columns: ColumnsType<OtherPlatformRow> = useMemo(
    () => [
      {
        title: '星期',
        dataIndex: 'weekday',
        width: 70,
        align: 'center',
        fixed: 'left',
        onHeaderCell: () => ({ style: greenHeaderStyle, rowSpan: 2 }),
        render: (val: string, record: OtherPlatformRow) => {
          if (record.key === 'summary') return ''
          return val
        },
      },
      {
        title: '日期',
        dataIndex: 'dateText',
        width: 90,
        align: 'center',
        fixed: 'left',
        onHeaderCell: () => ({ style: lightGreenHeaderStyle, rowSpan: 2 }),
        render: (val: string, record: OtherPlatformRow) => {
          if (record.key === 'summary') {
            return <span style={{ fontWeight: 'bold' }}>{val}</span>
          }
          return val
        },
      },
      // SEM推广 其他核心数据汇总
      {
        title: 'SEM推广 其他核心数据汇总',
        children: [
          {
            title: '其他收入',
            dataIndex: 'otherActualIncome',
            width: 100,
            align: 'center',
            onHeaderCell: () => ({ style: orangeHeaderStyle }),
            render: (_: unknown, record: OtherPlatformRow) => renderEditableNumber(record, 'otherActualIncome'),
          },
          {
            title: '其他报名转化率',
            dataIndex: 'otherConversionRate',
            width: 110,
            align: 'center',
            onHeaderCell: () => ({ style: orangeHeaderStyle }),
            render: (val: string, record: OtherPlatformRow) => {
              const isZero = val === '0%' || val === '0.00%'
              const displayVal = isZero ? <span style={{ color: '#999' }}>{val}</span> : val
              
              if (record.key === 'summary') {
                return <span style={{ fontWeight: 'bold' }}>{displayVal}</span>
              }
              return displayVal
            },
          },
          {
            title: '退费数',
            dataIndex: 'refundCount',
            width: 80,
            align: 'center',
            onHeaderCell: () => ({ style: orangeHeaderStyle }),
            render: (_: unknown, record: OtherPlatformRow) => renderEditableNumber(record, 'refundCount'),
          },
          {
            title: '净报名',
            dataIndex: 'netSignup',
            width: 80,
            align: 'center',
            onHeaderCell: () => ({ style: orangeHeaderStyle }),
            render: (_: unknown, record: OtherPlatformRow) => renderEditableNumber(record, 'netSignup'),
          },
          {
            title: '毛报数',
            dataIndex: 'grossTotal',
            width: 80,
            align: 'center',
            onHeaderCell: () => ({ style: orangeHeaderStyle }),
            render: (_: unknown, record: OtherPlatformRow) => renderEditableNumber(record, 'grossTotal'),
          },
          {
            title: '订座数',
            dataIndex: 'orderCount',
            width: 80,
            align: 'center',
            onHeaderCell: () => ({ style: orangeHeaderStyle }),
            render: (_: unknown, record: OtherPlatformRow) => renderEditableNumber(record, 'orderCount'),
          },
          {
            title: '上门人数',
            dataIndex: 'visitCount',
            width: 90,
            align: 'center',
            onHeaderCell: () => ({ style: orangeHeaderStyle }),
            render: (_: unknown, record: OtherPlatformRow) => renderEditableNumber(record, 'visitCount'),
          },
          {
            title: '其他咨询量',
            dataIndex: 'otherConsultCount',
            width: 100,
            align: 'center',
            onHeaderCell: () => ({ style: orangeHeaderStyle }),
            render: (_: unknown, record: OtherPlatformRow) => {
              const value = record.otherConsultCount
              const isZero = value === 0
              
              // 其他咨询量是自动计算的，显示为只读
              if (record.key === 'summary') {
                return <span style={{ fontWeight: 'bold', color: isZero ? '#999' : 'inherit' }}>{value}</span>
              }
              return <span style={{ color: isZero ? '#999' : 'inherit' }}>{value}</span>
            },
          },
          {
            title: '咨询量成本',
            dataIndex: 'consultCost',
            width: 100,
            align: 'center',
            onHeaderCell: () => ({ style: orangeHeaderStyle }),
            render: (val: string, record: OtherPlatformRow) => {
              const isZero = val === '¥0.00' || val === '¥0'
              const displayVal = isZero ? <span style={{ color: '#999' }}>{val}</span> : val
              
              if (record.key === 'summary') {
                return <span style={{ fontWeight: 'bold' }}>{displayVal}</span>
              }
              return displayVal
            },
          },
          {
            title: '其他消费',
            dataIndex: 'otherConsumption',
            width: 100,
            align: 'center',
            onHeaderCell: () => ({ style: orangeHeaderStyle }),
            render: (_: unknown, record: OtherPlatformRow) => renderEditableNumber(record, 'otherConsumption'),
          },
        ],
        onHeaderCell: () => ({ style: orangeHeaderStyle }),
      },
      // 其他咨询量
      {
        title: '其他咨询量',
        children: [
          {
            title: '神殿网站/直接访问',
            dataIndex: 'campusWebsiteVisit',
            width: 130,
            align: 'center',
            onHeaderCell: () => ({ style: yellowHeaderStyle }),
            render: (_: unknown, record: OtherPlatformRow) => renderEditableNumber(record, 'campusWebsiteVisit'),
          },
          {
            title: 'GEO',
            dataIndex: 'geo',
            width: 80,
            align: 'center',
            onHeaderCell: () => ({ style: yellowHeaderStyle }),
            render: (_: unknown, record: OtherPlatformRow) => renderEditableNumber(record, 'geo'),
          },
        ],
        onHeaderCell: () => ({ style: yellowHeaderStyle }),
      },
    ],
    [readonly, renderEditableNumber],
  )

  return (
    <Table
      columns={columns}
      dataSource={data}
      rowKey="key"
      pagination={false}
      bordered
      size="small"
      loading={loading}
      scroll={{ y: 600 }}
      sticky={{ offsetHeader: 0 }}
      rowClassName={(record) => (record.key === 'summary' ? 'summary-row' : '')}
      title={() => (
        <div
          style={{
            backgroundColor: '#FCE4D6',
            padding: '6px 12px',
            textAlign: 'center',
            fontWeight: 'bold',
            border: '1px solid #000',
            borderBottom: 'none',
          }}
        >
          SEM推广 其他核心数据汇总
        </div>
      )}
    />
  )
})

OtherPlatformTab.displayName = 'OtherPlatformTab'

export default OtherPlatformTab
