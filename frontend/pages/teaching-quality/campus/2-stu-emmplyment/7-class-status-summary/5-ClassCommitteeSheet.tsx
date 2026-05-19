// 班委会情况：ClassCommitteeSheet.tsx · 班委会情况表

import React, { useState } from 'react'
import { Card, Table, Input } from 'antd'
import type { ColumnsType } from 'antd/es/table'

interface ClassCommitteeMeetingRow {
  key: string
  time: string
  location: string
  participants: string
  topic: string
  keyPoints: string
}

const createRow = (): ClassCommitteeMeetingRow => ({
  key: String(Math.random()),
  time: '',
  location: '',
  participants: '',
  topic: '',
  keyPoints: '',
})

const initialData: ClassCommitteeMeetingRow[] = Array.from({ length: 12 }, () => createRow())

const ClassCommitteeHomeworkExamSheet: React.FC = () => {
  const [dataSource, setDataSource] = useState<ClassCommitteeMeetingRow[]>(initialData)

  const handleChange = (key: string, field: keyof ClassCommitteeMeetingRow, value: string) => {
    setDataSource((prev) => prev.map((row) => (row.key === key ? { ...row, [field]: value } : row)))
  }

  const columns: ColumnsType<ClassCommitteeMeetingRow> = [
    {
      title: '时间',
      dataIndex: 'time',
      key: 'time',
      width: 140,
      align: 'center',
      render: (text, record) => (
        <Input
          value={text}
          placeholder="如：2025-09-01 18:00"
          onChange={(e) => handleChange(record.key, 'time', e.target.value)}
        />
      ),
    },
    {
      title: '地点',
      dataIndex: 'location',
      key: 'location',
      width: 160,
      align: 'center',
      render: (text, record) => (
        <Input
          value={text}
          placeholder="如：教室A101"
          onChange={(e) => handleChange(record.key, 'location', e.target.value)}
        />
      ),
    },
    {
      title: '参与人',
      dataIndex: 'participants',
      key: 'participants',
      width: 220,
      align: 'left',
      render: (text, record) => (
        <Input
          value={text}
          placeholder="如：班主任、班委成员等"
          onChange={(e) => handleChange(record.key, 'participants', e.target.value)}
        />
      ),
    },
    {
      title: '主题',
      dataIndex: 'topic',
      key: 'topic',
      width: 260,
      align: 'left',
      render: (text, record) => (
        <Input
          value={text}
          placeholder="如：作业检查、考试安排、班级管理等"
          onChange={(e) => handleChange(record.key, 'topic', e.target.value)}
        />
      ),
    },
    {
      title: '把控关键点',
      dataIndex: 'keyPoints',
      key: 'keyPoints',
      width: 320,
      align: 'left',
      render: (text, record) => (
        <Input.TextArea
          autoSize={{ minRows: 1, maxRows: 3 }}
          value={text}
          placeholder="如：重点任务、责任分工、跟进事项等"
          onChange={(e) => handleChange(record.key, 'keyPoints', e.target.value)}
        />
      ),
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <Card title="班委会情况表">
        <Table<ClassCommitteeMeetingRow>
          bordered
          size="small"
          columns={columns}
          dataSource={dataSource}
          pagination={false}
          rowKey="key"
          scroll={{ x: 'max-content' }}
        />
      </Card>
    </div>
  )
}

export default ClassCommitteeHomeworkExamSheet
