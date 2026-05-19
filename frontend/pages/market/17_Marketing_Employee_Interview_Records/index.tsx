import React, { useEffect, useMemo, useState } from 'react'
import { App, Button, Card, DatePicker, Input, Space, Table } from 'antd'
import {
  DeleteOutlined,
  PlusOutlined,
  ReloadOutlined,
  SaveOutlined,
  FileTextOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { Dayjs } from 'dayjs'
import { apiService } from '@/services/api'

const { TextArea } = Input

interface InterviewRecord {
  id: number | string
  index: number
  interview_date: string
  interviewee: string
  jan_interviewer: string
  jan_content: string
  feb_interviewer: string
  feb_content: string
  mar_interviewer: string
  mar_content: string
  apr_interviewer: string
  apr_content: string
  may_interviewer: string
  may_content: string
  jun_interviewer: string
  jun_content: string
  jul_interviewer: string
  jul_content: string
  aug_interviewer: string
  aug_content: string
  sep_interviewer: string
  sep_content: string
  oct_interviewer: string
  oct_content: string
  nov_interviewer: string
  nov_content: string
  dec_interviewer: string
  dec_content: string
}

const emptyRow = (index: number): InterviewRecord => ({
  id: `temp-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  index,
  interview_date: dayjs().format('YYYY-MM-DD'),
  interviewee: '',
  jan_interviewer: '',
  jan_content: '',
  feb_interviewer: '',
  feb_content: '',
  mar_interviewer: '',
  mar_content: '',
  apr_interviewer: '',
  apr_content: '',
  may_interviewer: '',
  may_content: '',
  jun_interviewer: '',
  jun_content: '',
  jul_interviewer: '',
  jul_content: '',
  aug_interviewer: '',
  aug_content: '',
  sep_interviewer: '',
  sep_content: '',
  oct_interviewer: '',
  oct_content: '',
  nov_interviewer: '',
  nov_content: '',
  dec_interviewer: '',
  dec_content: '',
})

const months = [
  { key: 'jan', label: '1月' },
  { key: 'feb', label: '2月' },
  { key: 'mar', label: '3月' },
  { key: 'apr', label: '4月' },
  { key: 'may', label: '5月' },
  { key: 'jun', label: '6月' },
  { key: 'jul', label: '7月' },
  { key: 'aug', label: '8月' },
  { key: 'sep', label: '9月' },
  { key: 'oct', label: '10月' },
  { key: 'nov', label: '11月' },
  { key: 'dec', label: '12月' },
] as const

type EditingField = keyof InterviewRecord | ''

const MarketingEmployeeInterviewRecordsPage: React.FC = () => {
  const { message } = App.useApp()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [tableData, setTableData] = useState<InterviewRecord[]>([])
  const [selectedYear, setSelectedYear] = useState<Dayjs>(dayjs())

  const [editingRowId, setEditingRowId] = useState<number | string>('')
  const [editingField, setEditingField] = useState<EditingField>('')

  const yearNumber = selectedYear.year()

  const loadData = async () => {
    setLoading(true)
    try {
      const response = await apiService.get<{ items: Array<Record<string, unknown>> }>(
        `/market/employee-interview-records?year=${yearNumber}`,
      )
      const resData = response as unknown as { items?: Array<Record<string, unknown>> }
      const items = resData.items || []

      const normalized: InterviewRecord[] = items.map((item: Record<string, unknown>, idx: number) => {
        const base = emptyRow(idx + 1)
        return {
          ...base,
          id: (item.id as number) ?? base.id,
          interview_date: (item.interview_date as string) || base.interview_date,
          interviewee: (item.interviewee as string) || '',
          ...months.reduce((acc, month) => {
            const interviewerKey = `${month.key}_interviewer`
            const contentKey = `${month.key}_content`
            return {
              ...acc,
              [interviewerKey]: (item[interviewerKey] as string) || '',
              [contentKey]: (item[contentKey] as string) || '',
            }
          }, {} as Record<string, string>),
        }
      })

      setTableData(normalized.length ? normalized : [emptyRow(1)])
      setDirty(false)
      setEditingRowId('')
      setEditingField('')
    } catch (e) {
      console.error('加载数据失败:', e)
      setTableData([emptyRow(1)])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yearNumber])

  const saveData = async () => {
    if (!dirty) return

    setSaving(true)
    try {
      const rows = tableData.map((row) => ({
        id: typeof row.id === 'number' ? row.id : undefined,
        year: yearNumber,
        interview_date: row.interview_date,
        interviewee: row.interviewee,
        ...months.reduce((acc, month) => {
          const interviewerKey = `${month.key}_interviewer` as keyof InterviewRecord
          const contentKey = `${month.key}_content` as keyof InterviewRecord
          return {
            ...acc,
            [interviewerKey]: row[interviewerKey],
            [contentKey]: row[contentKey],
          }
        }, {} as Record<string, unknown>),
      }))

      await apiService.post('/market/employee-interview-records/bulk-save', { rows })
      message.success('保存成功')
      setDirty(false)
      setEditingRowId('')
      setEditingField('')
      loadData()
    } catch (e) {
      console.error('保存失败:', e)
      message.error('保存失败')
    } finally {
      setSaving(false)
    }
  }

  const updateCell = (rowId: number | string, key: keyof InterviewRecord, value: string) => {
    setTableData((prev) => prev.map((r) => (r.id === rowId ? { ...r, [key]: value } : r)))
    setDirty(true)
  }

  const startEdit = (rowId: number | string, field: keyof InterviewRecord) => {
    setEditingRowId(rowId)
    setEditingField(field)
  }

  const stopEdit = () => {
    setEditingRowId('')
    setEditingField('')
  }

  const handleAddRow = () => {
    setTableData((prev) => [...prev, emptyRow(prev.length + 1)])
    setDirty(true)
  }

  const handleDeleteRow = (row: InterviewRecord) => {
    if (tableData.length <= 1) {
      message.warning('至少保留一行数据')
      return
    }

    if (typeof row.id === 'number') {
      apiService.delete(`/market/employee-interview-records/${row.id}`).catch(console.error)
    }

    setTableData((prev) => {
      const newData = prev.filter((r) => r.id !== row.id).map((r, idx) => ({ ...r, index: idx + 1 }))
      return newData.length ? newData : [emptyRow(1)]
    })
    setDirty(true)
  }

  const renderCell = (
    record: InterviewRecord,
    field: keyof InterviewRecord,
    placeholder: string,
    type: 'input' | 'textarea' = 'input',
  ) => {
    const isEditing = editingRowId === record.id && editingField === field
    const value = (record[field] as string) || ''

    if (isEditing) {
      if (type === 'textarea') {
        return (
          <TextArea
            value={value}
            onChange={(e) => updateCell(record.id, field, e.target.value)}
            onBlur={stopEdit}
            autoSize={{ minRows: 2, maxRows: 3 }}
            autoFocus
            size="small"
          />
        )
      }

      return (
        <Input
          value={value}
          onChange={(e) => updateCell(record.id, field, e.target.value)}
          onBlur={stopEdit}
          autoFocus
          size="small"
        />
      )
    }

    return (
      <div
        onClick={() => startEdit(record.id, field)}
        style={{
          cursor: 'pointer',
          minHeight: '32px',
          padding: '4px',
          fontSize: '12px',
          whiteSpace: type === 'textarea' ? 'pre-wrap' : 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
        title={value || placeholder}
      >
        {value}
      </div>
    )
  }

  const columns: ColumnsType<InterviewRecord> = useMemo(() => {
    const monthColumns = months.map((month) => {
      const interviewerKey = `${month.key}_interviewer` as keyof InterviewRecord
      const contentKey = `${month.key}_content` as keyof InterviewRecord

      return {
        title: month.label,
        key: `month-${month.key}`,
        align: 'center' as const,
        children: [
          {
            title: '访谈人',
            key: `interviewer-${month.key}`,
            width: 140,
            align: 'center' as const,
            render: (_: unknown, record: InterviewRecord) =>
              renderCell(record, interviewerKey, '访谈人', 'input'),
          },
          {
            title: '访谈内容',
            key: `content-${month.key}`,
            width: 180,
            align: 'center' as const,
            render: (_: unknown, record: InterviewRecord) =>
              renderCell(record, contentKey, '访谈内容', 'textarea'),
          },
        ],
      }
    })

    return [
      {
        title: '序号',
        dataIndex: 'index',
        key: 'index',
        width: 60,
        align: 'center' as const,
        fixed: 'left',
      },
      {
        title: '访谈对象',
        dataIndex: 'interviewee',
        key: 'interviewee',
        width: 140,
        align: 'center' as const,
        fixed: 'left',
        render: (_: unknown, record: InterviewRecord) =>
          renderCell(record, 'interviewee', '输入姓名', 'input'),
      },
      ...monthColumns,
      {
        title: '操作',
        key: 'action',
        width: 100,
        align: 'center' as const,
        fixed: 'right',
        render: (_: unknown, record: InterviewRecord) => (
          <Space size="small">
            <Button
              type="link"
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteRow(record)}
            >
              删除
            </Button>
          </Space>
        ),
      },
    ]
  }, [editingRowId, editingField, yearNumber, tableData])

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          marginBottom: 24,
          textAlign: 'center',
          fontSize: '20px',
          fontWeight: 'bold',
          padding: '16px',
          backgroundColor: '#fff1f0',
          borderRadius: 4,
          border: '1px solid #ffccc7',
        }}
      >
        <FileTextOutlined style={{ marginRight: 8 }} />
        市场部员工访谈记录表
      </div>

      <Card>
        <div
          style={{
            marginBottom: 16,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Space>
            <span>年份：</span>
            <DatePicker
              picker="year"
              value={selectedYear}
              onChange={(d) => d && setSelectedYear(d)}
              style={{ width: 140 }}
            />
          </Space>
          <Space>
            <Button icon={<PlusOutlined />} type="primary" onClick={handleAddRow}>
              新增
            </Button>
            <Button
              icon={<SaveOutlined />}
              type="primary"
              ghost
              onClick={saveData}
              disabled={!dirty}
              loading={saving}
            >
              保存
            </Button>
            <Button icon={<ReloadOutlined />} onClick={loadData} loading={loading}>
              加载
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={tableData}
          pagination={false}
          scroll={{ x: 'max-content', y: 600 }}
          bordered
          size="small"
          rowKey="id"
          components={{
            header: {
              cell: (props: any) => {
                const { children, ...restProps } = props
                const isMonthHeader = children && typeof children === 'string' && /月$/.test(children)
                const mergedProps = {
                  ...restProps,
                  style: {
                    ...props.style,
                    backgroundColor: isMonthHeader ? '#d4edda' : '#fffacd',
                    fontWeight: 'bold',
                    textAlign: 'center',
                  },
                }
                return <th {...mergedProps}>{children}</th>
              },
            },
          }}
        />
        <style>{`
          .ant-table-thead > tr > th { background-color: #fffacd !important; font-weight: bold; text-align: center; }
          .ant-table-thead > tr:first-child > th { background-color: #fffacd !important; }
          .ant-table-thead > tr:first-child > th[colspan] { background-color: #d4edda !important; }
          .ant-table-thead > tr:last-child > th { background-color: #fff !important; }
          .ant-table-cell { padding: 8px 4px !important; }
        `}</style>
      </Card>
    </div>
  )
}

export default MarketingEmployeeInterviewRecordsPage
