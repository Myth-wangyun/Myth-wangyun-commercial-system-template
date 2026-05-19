import React, { useCallback, useMemo } from 'react'
import { InputNumber, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'

export type BaiduPromotionRow = {
  key: string
  weekday: string
  dateText: string
  // SEM推广 百度核心数据汇总
  baiduIncome: number
  baiduConversionRate: string
  refundCount: number
  netSignup: number
  grossTotal: number
  orderCount: number
  visitCount: number
  baiduConsultCount: number
  consultCost: string
  baiduConsumption: number
  // 百度咨询量
  baiduForm: number
  centerComeIn: number
  baiduChatOut: number
  totalConsultCount: number
  validConsultCount: number
  validConsultRate: number
  validConsultCost: string
  // 百度对话
  baiduTotalDialogue: number
  validDialogue: number
  validDialogueRate: number
  // 百度基础数据
  impressionCount: number
  clickCount: number
  clickRate: number
  consumption: number
  avgPrice: string
}

type EditableField = keyof Omit<
  BaiduPromotionRow,
  | 'key'
  | 'weekday'
  | 'dateText'
  | 'baiduConversionRate'
  | 'consultCost'
  | 'validConsultCost'
  | 'validConsultRate'
  | 'validDialogueRate'
  | 'clickRate'
  | 'avgPrice'
  | 'totalConsultCount'
  | 'baiduConsultCount'
>

interface BaiduPromotionTabProps {
  data: BaiduPromotionRow[]
  loading: boolean
  onUpdate: (rowKey: string, field: EditableField, value: number) => void
  readonly?: boolean
}

// 将样式对象移到组件外部，避免每次渲染都创建新对象
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

const blueHeaderStyle: React.CSSProperties = {
  backgroundColor: '#DAEEF3',
  color: '#000',
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

const BaiduPromotionTab: React.FC<BaiduPromotionTabProps> = React.memo(({ data, loading, onUpdate, readonly = false }) => {
  const renderEditableNumber = useCallback((record: BaiduPromotionRow, field: EditableField) => {
    const value = record[field]
    const isZero = value === 0
    
    // 判断是否需要显示两位小数（消费和百度消费字段）
    const needDecimal = field === 'baiduConsumption' || field === 'consumption' || field === 'baiduIncome'
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
        step={needDecimal ? 0.01 : 1}
        style={{ width: '100%' }}
        controls={false}
        onChange={(val) => onUpdate(record.key, field, typeof val === 'number' ? val : 0)}
      />
    )
  }, [readonly, onUpdate])

  const columns: ColumnsType<BaiduPromotionRow> = useMemo(
    () => [
      {
        title: '星期',
        dataIndex: 'weekday',
        width: 60,
        align: 'center',
        fixed: 'left',
        onHeaderCell: () => ({ style: greenHeaderStyle, rowSpan: 2 }),
        render: (val: string, record: BaiduPromotionRow) => {
          if (record.key === 'summary') return ''
          return val
        },
      },
      {
        title: '日期',
        dataIndex: 'dateText',
        width: 80,
        align: 'center',
        fixed: 'left',
        onHeaderCell: () => ({ style: lightGreenHeaderStyle, rowSpan: 2 }),
        render: (val: string, record: BaiduPromotionRow) => {
          if (record.key === 'summary') {
            return <span style={{ fontWeight: 'bold' }}>{val}</span>
          }
          return val
        },
      },
      // SEM推广 百度核心数据汇总
      {
        title: 'SEM推广 百度核心数据汇总',
        children: [
          {
            title: '百度收入',
            dataIndex: 'baiduIncome',
            width: 100,
            align: 'center',
            onHeaderCell: () => ({ style: orangeHeaderStyle }),
            render: (_: unknown, record: BaiduPromotionRow) => renderEditableNumber(record, 'baiduIncome'),
          },
          {
            title: '百度报名转化率',
            dataIndex: 'baiduConversionRate',
            width: 90,
            align: 'center',
            onHeaderCell: () => ({ style: orangeHeaderStyle }),
            render: (val: string, record: BaiduPromotionRow) => {
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
            render: (_: unknown, record: BaiduPromotionRow) => renderEditableNumber(record, 'refundCount'),
          },
          {
            title: '净报名',
            dataIndex: 'netSignup',
            width: 80,
            align: 'center',
            onHeaderCell: () => ({ style: orangeHeaderStyle }),
            render: (_: unknown, record: BaiduPromotionRow) => renderEditableNumber(record, 'netSignup'),
          },
          {
            title: '毛报数',
            dataIndex: 'grossTotal',
            width: 80,
            align: 'center',
            onHeaderCell: () => ({ style: orangeHeaderStyle }),
            render: (_: unknown, record: BaiduPromotionRow) => renderEditableNumber(record, 'grossTotal'),
          },
          {
            title: '订座数',
            dataIndex: 'orderCount',
            width: 80,
            align: 'center',
            onHeaderCell: () => ({ style: orangeHeaderStyle }),
            render: (_: unknown, record: BaiduPromotionRow) => renderEditableNumber(record, 'orderCount'),
          },
          {
            title: '上门人数',
            dataIndex: 'visitCount',
            width: 80,
            align: 'center',
            onHeaderCell: () => ({ style: orangeHeaderStyle }),
            render: (_: unknown, record: BaiduPromotionRow) => renderEditableNumber(record, 'visitCount'),
          },
          {
            title: '百度咨询量',
            dataIndex: 'baiduConsultCount',
            width: 90,
            align: 'center',
            onHeaderCell: () => ({ style: orangeHeaderStyle }),
            render: (val: number, record: BaiduPromotionRow) => {
              const isZero = val === 0
              const displayVal = isZero ? <span style={{ color: '#999' }}>{val}</span> : val
              
              if (record.key === 'summary') {
                return <span style={{ fontWeight: 'bold' }}>{displayVal}</span>
              }
              return displayVal
            },
          },
          {
            title: '咨询量成本',
            dataIndex: 'consultCost',
            width: 90,
            align: 'center',
            onHeaderCell: () => ({ style: orangeHeaderStyle }),
            render: (val: string, record: BaiduPromotionRow) => {
              const isZero = val === '¥0.00' || val === '¥0'
              const displayVal = isZero ? <span style={{ color: '#999' }}>{val}</span> : val
              
              if (record.key === 'summary') {
                return <span style={{ fontWeight: 'bold' }}>{displayVal}</span>
              }
              return displayVal
            },
          },
          {
            title: '百度消费',
            dataIndex: 'baiduConsumption',
            width: 100,
            align: 'center',
            onHeaderCell: () => ({ style: orangeHeaderStyle }),
            render: (_: unknown, record: BaiduPromotionRow) => renderEditableNumber(record, 'baiduConsumption'),
          },
        ],
        onHeaderCell: () => ({ style: orangeHeaderStyle }),
      },
      // 百度咨询量
      {
        title: '百度咨询量',
        children: [
          {
            title: '百度表单',
            dataIndex: 'baiduForm',
            width: 80,
            align: 'center',
            onHeaderCell: () => ({ style: blueHeaderStyle }),
            render: (_: unknown, record: BaiduPromotionRow) => renderEditableNumber(record, 'baiduForm'),
          },
          {
            title: '中心来电',
            dataIndex: 'centerComeIn',
            width: 80,
            align: 'center',
            onHeaderCell: () => ({ style: blueHeaderStyle }),
            render: (_: unknown, record: BaiduPromotionRow) => renderEditableNumber(record, 'centerComeIn'),
          },
          {
            title: '百度聊出',
            dataIndex: 'baiduChatOut',
            width: 80,
            align: 'center',
            onHeaderCell: () => ({ style: blueHeaderStyle }),
            render: (_: unknown, record: BaiduPromotionRow) => renderEditableNumber(record, 'baiduChatOut'),
          },
          {
            title: '总咨询量',
            dataIndex: 'totalConsultCount',
            width: 80,
            align: 'center',
            onHeaderCell: () => ({ style: blueHeaderStyle }),
            render: (val: number, record: BaiduPromotionRow) => {
              const isZero = val === 0
              const displayVal = isZero ? <span style={{ color: '#999' }}>{val}</span> : val
              
              if (record.key === 'summary') {
                return <span style={{ fontWeight: 'bold' }}>{displayVal}</span>
              }
              return displayVal
            },
          },
          {
            title: '有效咨询量',
            dataIndex: 'validConsultCount',
            width: 90,
            align: 'center',
            onHeaderCell: () => ({ style: blueHeaderStyle }),
            render: (_: unknown, record: BaiduPromotionRow) => renderEditableNumber(record, 'validConsultCount'),
          },
          {
            title: '有效率',
            dataIndex: 'validConsultRate',
            width: 70,
            align: 'center',
            onHeaderCell: () => ({ style: blueHeaderStyle }),
            render: (val: number, record: BaiduPromotionRow) => {
              const isZero = val === 0
              const displayText = `${val}%`
              const displayVal = isZero ? <span style={{ color: '#999' }}>{displayText}</span> : displayText
              
              if (record.key === 'summary') {
                return <span style={{ fontWeight: 'bold' }}>{displayVal}</span>
              }
              return displayVal
            },
          },
          {
            title: '有效咨询量成本',
            dataIndex: 'validConsultCost',
            width: 100,
            align: 'center',
            onHeaderCell: () => ({ style: blueHeaderStyle }),
            render: (val: string, record: BaiduPromotionRow) => {
              const isZero = val === '¥0.00' || val === '¥0'
              const displayVal = isZero ? <span style={{ color: '#999' }}>{val}</span> : val
              
              if (record.key === 'summary') {
                return <span style={{ fontWeight: 'bold' }}>{displayVal}</span>
              }
              return displayVal
            },
          },
        ],
        onHeaderCell: () => ({ style: blueHeaderStyle }),
      },
      // 百度对话
      {
        title: '百度对话',
        children: [
          {
            title: '百度总对话',
            dataIndex: 'baiduTotalDialogue',
            width: 90,
            align: 'center',
            onHeaderCell: () => ({ style: yellowHeaderStyle }),
            render: (_: unknown, record: BaiduPromotionRow) => renderEditableNumber(record, 'baiduTotalDialogue'),
          },
          {
            title: '有效对话',
            dataIndex: 'validDialogue',
            width: 80,
            align: 'center',
            onHeaderCell: () => ({ style: yellowHeaderStyle }),
            render: (_: unknown, record: BaiduPromotionRow) => renderEditableNumber(record, 'validDialogue'),
          },
          {
            title: '有效对话率',
            dataIndex: 'validDialogueRate',
            width: 80,
            align: 'center',
            onHeaderCell: () => ({ style: yellowHeaderStyle }),
            render: (val: number, record: BaiduPromotionRow) => {
              const isZero = val === 0
              const displayText = `${val}%`
              const displayVal = isZero ? <span style={{ color: '#999' }}>{displayText}</span> : displayText
              
              if (record.key === 'summary') {
                return <span style={{ fontWeight: 'bold' }}>{displayVal}</span>
              }
              return displayVal
            },
          },
        ],
        onHeaderCell: () => ({ style: yellowHeaderStyle }),
      },
      // 百度基础数据
      {
        title: '百度基础数据',
        children: [
          {
            title: '展现',
            dataIndex: 'impressionCount',
            width: 100,
            align: 'center',
            onHeaderCell: () => ({ style: yellowHeaderStyle }),
            render: (_: unknown, record: BaiduPromotionRow) => renderEditableNumber(record, 'impressionCount'),
          },
          {
            title: '点击',
            dataIndex: 'clickCount',
            width: 80,
            align: 'center',
            onHeaderCell: () => ({ style: yellowHeaderStyle }),
            render: (_: unknown, record: BaiduPromotionRow) => renderEditableNumber(record, 'clickCount'),
          },
          {
            title: '点击率',
            dataIndex: 'clickRate',
            width: 70,
            align: 'center',
            onHeaderCell: () => ({ style: yellowHeaderStyle }),
            render: (val: number, record: BaiduPromotionRow) => {
              const isZero = val === 0
              const displayText = `${val}%`
              const displayVal = isZero ? <span style={{ color: '#999' }}>{displayText}</span> : displayText
              
              if (record.key === 'summary') {
                return <span style={{ fontWeight: 'bold' }}>{displayVal}</span>
              }
              return displayVal
            },
          },
          {
            title: '消费',
            dataIndex: 'consumption',
            width: 100,
            align: 'center',
            onHeaderCell: () => ({ style: yellowHeaderStyle }),
            render: (_: unknown, record: BaiduPromotionRow) => renderEditableNumber(record, 'consumption'),
          },
          {
            title: '均价',
            dataIndex: 'avgPrice',
            width: 80,
            align: 'center',
            onHeaderCell: () => ({ style: yellowHeaderStyle }),
            render: (val: string, record: BaiduPromotionRow) => {
              const isZero = val === '¥0.00' || val === '¥0'
              const displayVal = isZero ? <span style={{ color: '#999' }}>{val}</span> : val
              
              if (record.key === 'summary') {
                return <span style={{ fontWeight: 'bold' }}>{displayVal}</span>
              }
              return displayVal
            },
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
          SEM推广 百度核心数据汇总
        </div>
      )}
    />
  )
})

BaiduPromotionTab.displayName = 'BaiduPromotionTab'

export default BaiduPromotionTab
