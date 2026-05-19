import React, { useEffect, useMemo, useState } from 'react'
import { DatePicker, Input, Select, Table } from 'antd'
import type { ColumnsType, ColumnType } from 'antd/es/table'
import dayjs from 'dayjs'

export interface WeeklyTrainingRow {
  id: string
  index: number | string
  position: string
  training_time: string
  training_project: string
  main_content: string
  training_method: string
  organizer: string
  trainee_count: string
  qualified_count: string
  pass_rate: string
  avg_score: string
}

interface WeeklyTrainingTableProps {
  data: WeeklyTrainingRow[]
  loading?: boolean
  onChange?: (nextData: WeeklyTrainingRow[]) => void
}

type WeeklyTrainingDataIndex = keyof WeeklyTrainingRow

type EditableCellProps = {
  record: WeeklyTrainingRow
  dataIndex: WeeklyTrainingDataIndex
  children: React.ReactNode
  onValueChange: (id: string, dataIndex: WeeklyTrainingDataIndex, value: string) => void
  isTotalRow?: boolean
} & React.TdHTMLAttributes<HTMLTableCellElement> & {
  rowSpan?: number
  colSpan?: number
}

const POSITION_OPTIONS = ['网推', '网聊', 'AI研发', '线上', '全部员工'] as const
const TRAINING_PROJECT_OPTIONS = ['价值观', '神殿专业知识培训', '岗位知识培训', '职业素养'] as const
const TRAINING_METHOD_OPTIONS = ['演讲', '互动', '授课'] as const

// 合计行可显示但不可编辑的字段
const TOTAL_ROW_DISPLAY_FIELDS: WeeklyTrainingDataIndex[] = ['trainee_count', 'qualified_count', 'pass_rate', 'avg_score']

// 数据行中自动计算的字段（不可编辑）
const AUTO_CALC_FIELDS: WeeklyTrainingDataIndex[] = ['pass_rate']

const EditableCell: React.FC<EditableCellProps> = ({
  record,
  dataIndex,
  children,
  onValueChange,
  isTotalRow,
  ...restProps
}) => {
  const externalValue = ((record as any)?.[dataIndex] ?? '') as unknown as string
  const [localValue, setLocalValue] = useState(externalValue)

  // 当外部数据变化时同步本地状态
  useEffect(() => {
    setLocalValue(externalValue)
  }, [externalValue])

  if (!record || !dataIndex || typeof onValueChange !== 'function') {
    return <td {...restProps}>{children}</td>
  }

  // 合计行：只显示统计字段的值，其他字段显示空或固定值
  if (isTotalRow) {
    if (dataIndex === 'index') {
      return <td {...restProps} style={{ ...restProps.style, fontWeight: 'bold' }}>合计</td>
    }
    if (TOTAL_ROW_DISPLAY_FIELDS.includes(dataIndex)) {
      return <td {...restProps} style={{ ...restProps.style, fontWeight: 'bold' }}>{externalValue}</td>
    }
    // 其他字段显示为空，不可编辑
    return <td {...restProps}></td>
  }

  // 数据行中自动计算的字段（只读显示）
  if (AUTO_CALC_FIELDS.includes(dataIndex)) {
    return <td {...restProps}>{externalValue}</td>
  }

  let editor: React.ReactNode = null

  if (dataIndex === 'position') {
    editor = (
      <Select
        value={localValue || undefined}
        style={{ width: '100%' }}
        options={POSITION_OPTIONS.map((v) => ({ value: v, label: v }))}
        onChange={(v) => {
          const newValue = String(v ?? '')
          setLocalValue(newValue)
          onValueChange(record.id, dataIndex, newValue)
        }}
        allowClear
      />
    )
  } else if (dataIndex === 'training_project') {
    editor = (
      <Select
        value={localValue || undefined}
        style={{ width: '100%' }}
        options={TRAINING_PROJECT_OPTIONS.map((v) => ({ value: v, label: v }))}
        onChange={(v) => {
          const newValue = String(v ?? '')
          setLocalValue(newValue)
          onValueChange(record.id, dataIndex, newValue)
        }}
        allowClear
      />
    )
  } else if (dataIndex === 'training_method') {
    editor = (
      <Select
        value={localValue || undefined}
        style={{ width: '100%' }}
        options={TRAINING_METHOD_OPTIONS.map((v) => ({ value: v, label: v }))}
        onChange={(v) => {
          const newValue = String(v ?? '')
          setLocalValue(newValue)
          onValueChange(record.id, dataIndex, newValue)
        }}
        allowClear
      />
    )
  } else if (dataIndex === 'training_time') {
    const d = localValue ? dayjs(localValue) : null
    editor = (
      <DatePicker
        value={d && d.isValid() ? d : null}
        style={{ width: '100%' }}
        format="YYYY-MM-DD"
        onChange={(next) => {
          const newValue = next ? next.format('YYYY-MM-DD') : ''
          setLocalValue(newValue)
          onValueChange(record.id, dataIndex, newValue)
        }}
        allowClear
      />
    )
  } else {
    editor = (
      <Input
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={() => {
          if (localValue !== externalValue) {
            onValueChange(record.id, dataIndex, localValue)
          }
        }}
        onPressEnter={() => {
          if (localValue !== externalValue) {
            onValueChange(record.id, dataIndex, localValue)
          }
        }}
      />
    )
  }

  return <td {...restProps}>{editor ?? children}</td>
}

// 计算合计行的统计数据
const calculateTotals = (rows: WeeklyTrainingRow[]): { trainee_count: string; qualified_count: string; pass_rate: string; avg_score: string } => {
  // 过滤掉合计行，只统计数据行
  const dataRows = rows.filter((r) => r.id !== 'weekly-total' && typeof r.index === 'number')
  
  if (dataRows.length === 0) {
    return {
      trainee_count: '0',
      qualified_count: '0',
      pass_rate: '#DIV/0!',
      avg_score: '#DIV/0!',
    }
  }

  // 培训人次、合格人数：求和
  let totalQualified = 0
  let totalTrainees = 0
  let totalScore = 0
  let scoreCount = 0

  dataRows.forEach((row) => {
    const qualified = parseFloat(row.qualified_count) || 0
    const trainees = parseFloat(row.trainee_count) || 0
    const score = parseFloat(row.avg_score)

    totalQualified += qualified
    totalTrainees += trainees
    
    if (!isNaN(score) && row.avg_score !== '') {
      totalScore += score
      scoreCount++
    }
  })

  // 考试合格率 = 合格人数 / 培训人次
  const passRate = totalTrainees > 0 
    ? `${((totalQualified / totalTrainees) * 100).toFixed(2)}%`
    : '#DIV/0!'

  // 平均成绩 = 所有平均成绩的平均值
  const avgScore = scoreCount > 0
    ? (totalScore / scoreCount).toFixed(2)
    : '#DIV/0!'

  return {
    trainee_count: String(totalTrainees),
    qualified_count: String(totalQualified),
    pass_rate: passRate,
    avg_score: avgScore,
  }
}

// 计算单行的考试合格率
const calculateRowPassRate = (traineeCount: string, qualifiedCount: string): string => {
  const trainees = parseFloat(traineeCount) || 0
  const qualified = parseFloat(qualifiedCount) || 0
  
  if (trainees <= 0) {
    return ''
  }
  
  return `${((qualified / trainees) * 100).toFixed(2)}%`
}

const WeeklyTrainingTable: React.FC<WeeklyTrainingTableProps> = ({ data, loading = false, onChange }) => {
  const updateCell = React.useCallback((id: string, dataIndex: WeeklyTrainingDataIndex, value: string) => {
    // 不允许编辑合计行
    if (id === 'weekly-total') return
    
    let next = data.map((row) => {
      if (row.id !== id) return row
      
      const updatedRow = { ...row, [dataIndex]: value }
      
      // 如果修改的是培训人次或合格人数，自动计算该行的考试合格率
      if (dataIndex === 'trainee_count' || dataIndex === 'qualified_count') {
        const traineeCount = dataIndex === 'trainee_count' ? value : row.trainee_count
        const qualifiedCount = dataIndex === 'qualified_count' ? value : row.qualified_count
        updatedRow.pass_rate = calculateRowPassRate(traineeCount, qualifiedCount)
      }
      
      return updatedRow
    })
    
    // 重新计算合计行
    const totals = calculateTotals(next)
    const finalData = next.map((row) => 
      row.id === 'weekly-total' 
        ? { ...row, ...totals }
        : row
    )
    
    onChange?.(finalData)
  }, [data, onChange])

  const columns = useMemo<ColumnsType<WeeklyTrainingRow>>(
    () => [
      {
        title: '序号',
        dataIndex: 'index',
        key: 'index',
        width: 70,
        align: 'center',
      },
      {
        title: '岗位',
        dataIndex: 'position',
        key: 'position',
        width: 90,
        align: 'center',
        onCell: (record: WeeklyTrainingRow) =>
          ({ record, dataIndex: 'position', onValueChange: updateCell, isTotalRow: record.id === 'weekly-total' } as any),
      } as ColumnType<WeeklyTrainingRow>,
      {
        title: '培训时间（年-月-日）',
        dataIndex: 'training_time',
        key: 'training_time',
        width: 160,
        align: 'center',
        onCell: (record: WeeklyTrainingRow) =>
          ({ record, dataIndex: 'training_time', onValueChange: updateCell, isTotalRow: record.id === 'weekly-total' } as any),
      } as ColumnType<WeeklyTrainingRow>,
      {
        title: '培训项目',
        dataIndex: 'training_project',
        key: 'training_project',
        width: 160,
        align: 'center',
        onCell: (record: WeeklyTrainingRow) =>
          ({ record, dataIndex: 'training_project', onValueChange: updateCell, isTotalRow: record.id === 'weekly-total' } as any),
      } as ColumnType<WeeklyTrainingRow>,
      {
        title: '主要内容',
        dataIndex: 'main_content',
        key: 'main_content',
        width: 200,
        align: 'center',
        onCell: (record: WeeklyTrainingRow) =>
          ({ record, dataIndex: 'main_content', onValueChange: updateCell, isTotalRow: record.id === 'weekly-total' } as any),
      } as ColumnType<WeeklyTrainingRow>,
      {
        title: '培训方式',
        dataIndex: 'training_method',
        key: 'training_method',
        width: 120,
        align: 'center',
        onCell: (record: WeeklyTrainingRow) =>
          ({ record, dataIndex: 'training_method', onValueChange: updateCell, isTotalRow: record.id === 'weekly-total' } as any),
      } as ColumnType<WeeklyTrainingRow>,
      {
        title: '组织负责人',
        dataIndex: 'organizer',
        key: 'organizer',
        width: 120,
        align: 'center',
        onCell: (record: WeeklyTrainingRow) =>
          ({ record, dataIndex: 'organizer', onValueChange: updateCell, isTotalRow: record.id === 'weekly-total' } as any),
      } as ColumnType<WeeklyTrainingRow>,
      {
        title: '培训人次',
        dataIndex: 'trainee_count',
        key: 'trainee_count',
        width: 110,
        align: 'center',
        onCell: (record: WeeklyTrainingRow) =>
          ({ record, dataIndex: 'trainee_count', onValueChange: updateCell, isTotalRow: record.id === 'weekly-total' } as any),
      } as ColumnType<WeeklyTrainingRow>,
      {
        title: '合格人数',
        dataIndex: 'qualified_count',
        key: 'qualified_count',
        width: 110,
        align: 'center',
        onCell: (record: WeeklyTrainingRow) =>
          ({ record, dataIndex: 'qualified_count', onValueChange: updateCell, isTotalRow: record.id === 'weekly-total' } as any),
      } as ColumnType<WeeklyTrainingRow>,
      {
        title: '考试合格率',
        dataIndex: 'pass_rate',
        key: 'pass_rate',
        width: 120,
        align: 'center',
        onCell: (record: WeeklyTrainingRow) =>
          ({ record, dataIndex: 'pass_rate', onValueChange: updateCell, isTotalRow: record.id === 'weekly-total' } as any),
      } as ColumnType<WeeklyTrainingRow>,
      {
        title: '平均成绩',
        dataIndex: 'avg_score',
        key: 'avg_score',
        width: 120,
        align: 'center',
        onCell: (record: WeeklyTrainingRow) =>
          ({ record, dataIndex: 'avg_score', onValueChange: updateCell, isTotalRow: record.id === 'weekly-total' } as any),
      } as ColumnType<WeeklyTrainingRow>,
    ],
    [updateCell]
  )

  return (
    <Table
      columns={columns}
      dataSource={data}
      rowKey="id"
      pagination={false}
      scroll={{ x: 'max-content', y: 600 }}
      bordered
      size="small"
      loading={loading}
      components={{
        header: {
          cell: (props: any) => (
            <th
              {...props}
              style={{
                ...props.style,
                backgroundColor: '#c6e0b4',
                fontWeight: 'bold',
                textAlign: 'center',
                borderColor: '#000',
              }}
            />
          ),
        },
        body: {
          cell: (props: any) => (
            <EditableCell
              {...props}
              style={{
                ...props.style,
                borderColor: '#000',
                textAlign: 'center',
              }}
            />
          ),
        },
      }}
    />
  )
}

export default WeeklyTrainingTable