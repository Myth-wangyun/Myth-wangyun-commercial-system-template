import React, { useState } from 'react'
import { DatePicker, Input, Table, Tabs } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import WeeklyTrainingToolbar from './WeeklyTrainingToolbar'
import WeeklyTrainingTable, { type WeeklyTrainingRow } from './WeeklyTrainingTable'
import dayjs from 'dayjs'

export type TrainingTabKey = 'summary' | 'monthly' | 'weekly'

export interface TrainingSummaryRow {
  id: number | string
  index: number | string
  position: string
  training_sessions: string
  trainees_count: string
  qualified_count: string
  pass_rate: string
  remarks: string
}

type MonthlyCategoryKey = 'values' | 'campusSpecialty' | 'jobKnowledge' | 'professionalism'

type MonthlyMetricKey = 'sessions' | 'trainees' | 'qualified' | 'passRate'

export interface MonthlyRow {
  id: string
  time: string
  project: string
  position: string
  values_sessions: string
  values_trainees: string
  values_qualified: string
  values_passRate: string
  campusSpecialty_sessions: string
  campusSpecialty_trainees: string
  campusSpecialty_qualified: string
  campusSpecialty_passRate: string
  jobKnowledge_sessions: string
  jobKnowledge_trainees: string
  jobKnowledge_qualified: string
  jobKnowledge_passRate: string
  professionalism_sessions: string
  professionalism_trainees: string
  professionalism_qualified: string
  professionalism_passRate: string
  remarks: string
}

export interface TrainingTabsProps {
  activeTab: TrainingTabKey
  onChangeTab: (key: TrainingTabKey) => void
  summaryColumns: ColumnsType<TrainingSummaryRow>
  summaryData: TrainingSummaryRow[]
  onSummaryRemarkChange?: (rowId: string | number, remarks: string) => void
  monthlyColumns: ColumnsType<MonthlyRow>
  monthlyRows: MonthlyRow[]
  onMonthlyRemarkChange?: (rowId: string, remarks: string) => void
  weeklyMonth: string
  onChangeWeeklyMonth: (value: string) => void
  weeklyData: WeeklyTrainingRow[]
  onWeeklyDataChange?: (nextData: WeeklyTrainingRow[]) => void
  summaryYear: string
  onChangeSummaryYear: (value: string) => void
  monthlyYear: string
  onChangeMonthlyYear: (value: string) => void
}

// 可编辑备注单元格组件
const EditableRemarkCell: React.FC<{
  value: string
  rowId: string | number
  onChange?: (rowId: string | number, value: string) => void
}> = ({ value, rowId, onChange }) => {
  const [editing, setEditing] = useState(false)
  const [localValue, setLocalValue] = useState(value)

  React.useEffect(() => {
    setLocalValue(value)
  }, [value])

  if (editing) {
    return (
      <Input
        value={localValue}
        size="small"
        autoFocus
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={() => {
          setEditing(false)
          if (localValue !== value && onChange) {
            onChange(rowId, localValue)
          }
        }}
        onPressEnter={() => {
          setEditing(false)
          if (localValue !== value && onChange) {
            onChange(rowId, localValue)
          }
        }}
      />
    )
  }

  return (
    <div
      onClick={() => setEditing(true)}
      style={{ cursor: 'pointer', minHeight: 22, padding: '2px 4px' }}
    >
      {value || <span style={{ color: '#ccc' }}>点击编辑</span>}
    </div>
  )
}

const TrainingTabs: React.FC<TrainingTabsProps> = ({
  activeTab,
  onChangeTab,
  summaryColumns,
  summaryData,
  onSummaryRemarkChange,
  monthlyColumns,
  monthlyRows,
  onMonthlyRemarkChange,
  weeklyMonth,
  onChangeWeeklyMonth,
  weeklyData,
  onWeeklyDataChange,
  summaryYear,
  onChangeSummaryYear,
  monthlyYear,
  onChangeMonthlyYear,
}) => {
  // 为汇总表添加可编辑备注列
  const summaryColumnsWithEditableRemarks = React.useMemo(() => {
    return summaryColumns.map((col) => {
      if (col.key === 'remarks') {
        return {
          ...col,
          render: (_: unknown, record: TrainingSummaryRow) => (
            <EditableRemarkCell
              value={record.remarks || ''}
              rowId={record.id}
              onChange={onSummaryRemarkChange}
            />
          ),
        }
      }
      return col
    })
  }, [summaryColumns, onSummaryRemarkChange])

  // 为月度表添加可编辑备注列
  const monthlyColumnsWithEditableRemarks = React.useMemo(() => {
    return monthlyColumns.map((col) => {
      if (col.key === 'remarks') {
        return {
          ...col,
          render: (_: unknown, record: MonthlyRow) => (
            <EditableRemarkCell
              value={record.remarks || ''}
              rowId={record.id}
              onChange={onMonthlyRemarkChange}
            />
          ),
        }
      }
      return col
    })
  }, [monthlyColumns, onMonthlyRemarkChange])
  return (
    <>
      <Tabs
        activeKey={activeTab}
        onChange={(k) => onChangeTab(k as TrainingTabKey)}
        items={[
          { key: 'summary', label: '培训汇总表' },
          { key: 'monthly', label: '培训月度表' },
          { key: 'weekly', label: '培训周度表' },
        ]}
        style={{ marginBottom: 12 }}
      />

      {activeTab === 'monthly' ? (
        <>
          <div style={{ marginBottom: 12 }}>
            <span style={{ marginRight: 8 }}>年份：</span>
            <DatePicker
              picker="year"
              value={monthlyYear ? dayjs(monthlyYear, 'YYYY') : null}
              onChange={(date) => onChangeMonthlyYear(date ? date.format('YYYY') : '')}
              placeholder="请选择年份"
              allowClear
            />
          </div>
          <Table
            columns={monthlyColumnsWithEditableRemarks}
            dataSource={monthlyRows}
            pagination={false}
            scroll={{ x: 'max-content', y: 600 }}
            bordered
            size="small"
            rowKey="id"
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
                  <td
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
        </>
      ) : activeTab === 'weekly' ? (
        <>
          <WeeklyTrainingToolbar value={weeklyMonth} onChange={onChangeWeeklyMonth} />
          <WeeklyTrainingTable data={weeklyData} onChange={onWeeklyDataChange} />
        </>
      ) : (
        <>
          <div style={{ marginBottom: 12 }}>
            <span style={{ marginRight: 8 }}>年份：</span>
            <DatePicker
              picker="year"
              value={summaryYear ? dayjs(summaryYear, 'YYYY') : null}
              onChange={(date) => onChangeSummaryYear(date ? date.format('YYYY') : '')}
              placeholder="请选择年份"
              allowClear
            />
          </div>
          <Table
            columns={summaryColumnsWithEditableRemarks}
            dataSource={summaryData}
            pagination={false}
            scroll={{ x: 'max-content', y: 600 }}
            bordered
            size="small"
            rowKey="id"
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
                  <td
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
        </>
      )}
    </>
  )
}

export default TrainingTabs
