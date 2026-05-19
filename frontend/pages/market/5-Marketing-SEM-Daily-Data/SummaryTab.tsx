import React, { useCallback, useMemo } from 'react'
import { InputNumber, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { Dayjs } from 'dayjs'

export type SummaryRow = {
  key: string
  weekday: string
  dateText: string
  semActualIncome: number
  semSignupConversionRate: string
  refundCount: number
  netSignup: number
  grossTotal: number
  orderCount: number
  visitCount: number
  actualConsultCount: number
  consultCost: string
  semConsumption: number
}

type EditableField = keyof Omit<
  SummaryRow,
  'key' | 'weekday' | 'dateText' | 'semSignupConversionRate' | 'consultCost'
>

interface SummaryTabProps {
  data: SummaryRow[]
  loading: boolean
  onUpdate: (rowKey: string, field: EditableField, value: number) => void
  readonly?: boolean
}

// 将样式对象移到组件外部
const weekdayHeaderStyle: React.CSSProperties = {
  backgroundColor: '#00B050',
  color: '#000',
  fontWeight: 'bold',
  textAlign: 'center',
}

const dateHeaderStyle: React.CSSProperties = {
  backgroundColor: '#92D050',
  color: '#000',
  fontWeight: 'bold',
  textAlign: 'center',
}

const metricHeaderStyle: React.CSSProperties = {
  backgroundColor: '#FCE4D6',
  color: '#C00000',
  fontWeight: 'bold',
  textAlign: 'center',
}

const boldStyle: React.CSSProperties = { fontWeight: 'bold' }

const SummaryTab: React.FC<SummaryTabProps> = React.memo(({ data, loading, onUpdate, readonly = false }) => {
  const renderEditableNumber = useCallback((record: SummaryRow, field: EditableField) => {
    const value = record[field]
    const isZero = value === 0
    
    // 判断是否需要显示两位小数（SEM消费字段）
    const needDecimal = field === 'semActualIncome' || field === 'semConsumption'
    const displayValue = needDecimal ? (typeof value === 'number' ? value.toFixed(2) : value) : value
    
    // 汇总行始终只读
    if (record.key === 'summary') {
      return <span style={{ fontWeight: 'bold', color: isZero ? '#999' : 'inherit' }}>{displayValue}</span>
    }

    // 如果是只读模式
    if (readonly) {
      return <span style={{ color: isZero ? '#999' : 'inherit' }}>{displayValue}</span>
    }

    return (
      <InputNumber
        value={value}
        min={0}
        precision={needDecimal ? 2 : 0}
        step={needDecimal ? 0.01 : 1}
        style={{ width: '100%' }}
        controls={false}
        onChange={(val) => onUpdate(record.key, field, typeof val === 'number' ? val : 0)}
      />
    )
  }, [readonly, onUpdate])

  const columns: ColumnsType<SummaryRow> = useMemo(
    () => [
      {
        title: '星期',
        dataIndex: 'weekday',
        width: 80,
        align: 'center',
        fixed: 'left',
        onHeaderCell: () => ({ style: weekdayHeaderStyle }),
        render: (val: string, record: SummaryRow) => {
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
        onHeaderCell: () => ({ style: dateHeaderStyle }),
        render: (val: string, record: SummaryRow) => {
          if (record.key === 'summary') {
            return <span style={{ fontWeight: 'bold' }}>{val}</span>
          }
          return val
        },
      },
      {
        title: 'SEM实际收入',
        dataIndex: 'semActualIncome',
        width: 110,
        align: 'center',
        onHeaderCell: () => ({ style: metricHeaderStyle }),
        render: (_: unknown, record: SummaryRow) => renderEditableNumber(record, 'semActualIncome'),
      },
      {
        title: 'SEM报名转化率',
        dataIndex: 'semSignupConversionRate',
        width: 110,
        align: 'center',
        onHeaderCell: () => ({ style: metricHeaderStyle }),
        render: (val: string, record: SummaryRow) => {
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
        onHeaderCell: () => ({ style: metricHeaderStyle }),
        render: (_: unknown, record: SummaryRow) => renderEditableNumber(record, 'refundCount'),
      },
      {
        title: '净报名',
        dataIndex: 'netSignup',
        width: 80,
        align: 'center',
        onHeaderCell: () => ({ style: metricHeaderStyle }),
        render: (_: unknown, record: SummaryRow) => renderEditableNumber(record, 'netSignup'),
      },
      {
        title: '毛报数',
        dataIndex: 'grossTotal',
        width: 80,
        align: 'center',
        onHeaderCell: () => ({ style: metricHeaderStyle }),
        render: (_: unknown, record: SummaryRow) => renderEditableNumber(record, 'grossTotal'),
      },
      {
        title: '订座数',
        dataIndex: 'orderCount',
        width: 80,
        align: 'center',
        onHeaderCell: () => ({ style: metricHeaderStyle }),
        render: (_: unknown, record: SummaryRow) => renderEditableNumber(record, 'orderCount'),
      },
      {
        title: '上门总数',
        dataIndex: 'visitCount',
        width: 80,
        align: 'center',
        onHeaderCell: () => ({ style: metricHeaderStyle }),
        render: (_: unknown, record: SummaryRow) => renderEditableNumber(record, 'visitCount'),
      },
      {
        title: '实际总咨询量',
        dataIndex: 'actualConsultCount',
        width: 110,
        align: 'center',
        onHeaderCell: () => ({ style: metricHeaderStyle }),
        render: (_: unknown, record: SummaryRow) => renderEditableNumber(record, 'actualConsultCount'),
      },
      {
        title: '咨询量成本',
        dataIndex: 'consultCost',
        width: 100,
        align: 'center',
        onHeaderCell: () => ({ style: metricHeaderStyle }),
        render: (val: string, record: SummaryRow) => {
          const isZero = val === '¥0.00' || val === '¥0'
          const displayVal = isZero ? <span style={{ color: '#999' }}>{val}</span> : val
          
          if (record.key === 'summary') {
            return <span style={{ fontWeight: 'bold' }}>{displayVal}</span>
          }
          return displayVal
        },
      },
      {
        title: 'SEM消费',
        dataIndex: 'semConsumption',
        width: 100,
        align: 'center',
        onHeaderCell: () => ({ style: metricHeaderStyle }),
        render: (_: unknown, record: SummaryRow) => renderEditableNumber(record, 'semConsumption'),
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
          SEM推广 全平台核心数据汇总
        </div>
      )}
    />
  )
})

SummaryTab.displayName = 'SummaryTab'

export default SummaryTab

