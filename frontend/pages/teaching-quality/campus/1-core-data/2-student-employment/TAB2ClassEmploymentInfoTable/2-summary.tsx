import React, { useState } from 'react'
import { Card, Table, Input, InputNumber } from 'antd'
import type { ColumnsType } from 'antd/es/table'

interface ClassEmploymentSummaryRow {
  key: string
  className: string
  archiveCount: number
  needEmploymentCount: number
  actualEmploymentCount: number
  actualEmploymentRate: number
  actualNeedEmploymentRate: number
  targetAverageSalary: number
  actualAverageSalary: number
  achievementRate: number
  teacherName: string
  classTeacherName: string
}

const createInitialRow = (): ClassEmploymentSummaryRow => ({
  key: '1',
  className: '',
  archiveCount: 20,
  needEmploymentCount: 20,
  actualEmploymentCount: 18,
  actualEmploymentRate: 90,
  actualNeedEmploymentRate: 90,
  targetAverageSalary: 0,
  actualAverageSalary: 0,
  achievementRate: 0,
  teacherName: '',
  classTeacherName: '',
})

const formatRate = (numerator: number, denominator: number) => {
  if (!denominator) return '0%'
  const rate = (numerator / denominator) * 100
  const fixed = rate.toFixed(1)
  const text = fixed.endsWith('.0') ? fixed.slice(0, -2) : fixed
  return `${text}%`
}

const ClassEmploymentSummary: React.FC = () => {
  const [row, setRow] = useState<ClassEmploymentSummaryRow>(createInitialRow)

  const updateField = <K extends keyof ClassEmploymentSummaryRow>(
    field: K,
    value: ClassEmploymentSummaryRow[K],
  ) => {
    setRow((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const dataSource = [row]

  const columns: ColumnsType<ClassEmploymentSummaryRow> = [
    {
      title: '班级',
      dataIndex: 'className',
      key: 'className',
      width: 120,
      align: 'center',
      render: (text) => (
        <Input value={text} onChange={(e) => updateField('className', e.target.value)} />
      ),
    },
    {
      title: '档案人数',
      dataIndex: 'archiveCount',
      key: 'archiveCount',
      width: 100,
      align: 'center',
      render: (value: number) => (
        <InputNumber
          min={0}
          value={value}
          style={{ width: '100%' }}
          onChange={(v) => updateField('archiveCount', v ?? 0)}
        />
      ),
    },
    {
      title: '需就业人数',
      dataIndex: 'needEmploymentCount',
      key: 'needEmploymentCount',
      width: 120,
      align: 'center',
      render: (value: number) => (
        <InputNumber
          min={0}
          value={value}
          style={{ width: '100%' }}
          onChange={(v) => updateField('needEmploymentCount', v ?? 0)}
        />
      ),
    },
    {
      title: '实际就业人数',
      dataIndex: 'actualEmploymentCount',
      key: 'actualEmploymentCount',
      width: 120,
      align: 'center',
      render: (value: number) => (
        <InputNumber
          min={0}
          value={value}
          style={{ width: '100%' }}
          onChange={(v) => updateField('actualEmploymentCount', v ?? 0)}
        />
      ),
    },
    {
      title: '实际就业率',
      dataIndex: 'actualEmploymentRate',
      key: 'actualEmploymentRate',
      width: 120,
      align: 'center',
      render: (_: number, record) =>
        formatRate(record.actualEmploymentCount || 0, record.archiveCount || 0),
    },
    {
      title: '实际需就业率',
      dataIndex: 'actualNeedEmploymentRate',
      key: 'actualNeedEmploymentRate',
      width: 130,
      align: 'center',
      render: (_: number, record) =>
        formatRate(record.actualEmploymentCount || 0, record.needEmploymentCount || 0),
    },
    {
      title: '目标平均薪资',
      dataIndex: 'targetAverageSalary',
      key: 'targetAverageSalary',
      width: 130,
      align: 'center',
      render: (value: number) => (
        <InputNumber
          min={0}
          value={value}
          style={{ width: '100%' }}
          onChange={(v) => updateField('targetAverageSalary', v ?? 0)}
        />
      ),
    },
    {
      title: '实际平均薪资',
      dataIndex: 'actualAverageSalary',
      key: 'actualAverageSalary',
      width: 130,
      align: 'center',
      render: (value: number) => (
        <InputNumber
          min={0}
          value={value}
          style={{ width: '100%' }}
          onChange={(v) => updateField('actualAverageSalary', v ?? 0)}
        />
      ),
    },
    {
      title: '就业达标率',
      dataIndex: 'achievementRate',
      key: 'achievementRate',
      width: 120,
      align: 'center',
      render: (_: number, record) =>
        formatRate(record.actualAverageSalary || 0, record.targetAverageSalary || 0),
    },
    {
      title: '教员',
      dataIndex: 'teacherName',
      key: 'teacherName',
      width: 120,
      align: 'center',
      render: (text) => (
        <Input value={text} onChange={(e) => updateField('teacherName', e.target.value)} />
      ),
    },
    {
      title: '班主任',
      dataIndex: 'classTeacherName',
      key: 'classTeacherName',
      width: 120,
      align: 'center',
      render: (text) => (
        <Input value={text} onChange={(e) => updateField('classTeacherName', e.target.value)} />
      ),
    },
    {
      title: '',
      dataIndex: 'empty1',
      key: 'empty1',
      width: 120,
      align: 'center',
      render: () => null,
    },
    {
      title: '',
      dataIndex: 'empty2',
      key: 'empty2',
      width: 120,
      align: 'center',
      render: () => null,
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <Card title="班级就业信息汇总">
        <Table<ClassEmploymentSummaryRow>
          bordered
          size="small"
          columns={columns}
          dataSource={dataSource}
          pagination={false}
          rowKey="key"
          scroll={{ x: 'max-content' }}
          tableLayout="fixed"
          className="class-employment-summary-table"
        />
        <style>{`
          /* 让汇总表单元格内容尽量单行展示 */
          .class-employment-summary-table .ant-table-thead > tr > th,
          .class-employment-summary-table .ant-table-tbody > tr > td {
            white-space: nowrap;
          }
          /* 输入框/数字输入框在单元格内不换行并占满宽度 */
          .class-employment-summary-table .ant-input,
          .class-employment-summary-table .ant-input-number {
            width: 100%;
          }
          .class-employment-summary-table .ant-input-number-input {
            text-align: center;
          }
        `}</style>
      </Card>
    </div>
  )
}

export default ClassEmploymentSummary