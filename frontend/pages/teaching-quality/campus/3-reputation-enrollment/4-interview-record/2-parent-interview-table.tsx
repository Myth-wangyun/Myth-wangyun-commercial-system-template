/**
 * 家长访谈记录表
 */

import React, { useEffect, useState } from 'react'
import { App, Card, Table, Button, Space, Select, Input } from 'antd'
import {
  ReloadOutlined,
  DownloadOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SaveOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useCampusStore } from '@/stores/campusStore'
import dayjs from 'dayjs'

import { buildApiUrl } from '@/utils/apiBase'

const { Option } = Select
const { TextArea } = Input

// 家长访谈记录接口（按月份展示12列：每月一格，记录简要文字）
interface ParentInterviewRecord {
  key: string
  serialNumber: number // 序号
  studentName: string // 学员姓名
  monthNotes: string[] // 12个月备注（索引0对应1月）
}

const ParentInterviewTable: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus, getAllCampuses } = useCampusStore()
  const campuses = getAllCampuses()
  const [selectedCampus, setSelectedCampus] = useState<string>(currentCampus || '')
  const [selectedYear, setSelectedYear] = useState<number>(2024)
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1)
  const [loading, setLoading] = useState(false)
  const [editMode, setEditMode] = useState(false)

  // 初始化数据
  const [dataSource, setDataSource] = useState<ParentInterviewRecord[]>([
    {
      key: '1',
      serialNumber: 1,
      studentName: '',
      monthNotes: Array(12).fill(''),
    },
  ])

  // 生成月份列
  const monthColumns = Array.from({ length: 12 }, (_, i) => ({
    title: `${selectedYear}年${i + 1}月`,
    key: `month-${i}`,
    width: 180,
    align: 'left' as const,
    render: (_: any, record: ParentInterviewRecord) => renderMonthCell(record, i),
  }))

  // 表格列配置
  const columns: ColumnsType<ParentInterviewRecord> = [
    {
      title: '序号',
      dataIndex: 'serialNumber',
      key: 'serialNumber',
      width: 60,
      align: 'center',
      fixed: 'left',
    },
    {
      title: '姓名',
      dataIndex: 'studentName',
      key: 'studentName',
      width: 120,
      align: 'center',
      fixed: 'left',
      render: (text, record) => renderEditableCell(text, record, 'studentName'),
    },
    ...monthColumns,
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 80,
      align: 'center' as const,
      render: (_: any, record: ParentInterviewRecord) =>
        editMode ? (
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.key)}
            size="small"
          />
        ) : null,
    },
  ]

  // 渲染可编辑单元格（仅用于姓名）
  const renderEditableCell = (
    text: string,
    record: ParentInterviewRecord,
    field: keyof ParentInterviewRecord,
    isTextArea: boolean = false,
  ) => {
    if (!editMode) {
      return <div style={{ whiteSpace: 'pre-wrap' }}>{text || '-'}</div>
    }

    return (
      <Input
        value={text}
        onChange={(e) => handleCellChange(record.key, field, e.target.value)}
        style={{ fontSize: '12px' }}
      />
    )
  }

  // 渲染月份格
  const renderMonthCell = (record: ParentInterviewRecord, monthIndex: number) => {
    const value = record.monthNotes?.[monthIndex] || ''
    if (!editMode) return <div style={{ whiteSpace: 'pre-wrap' }}>{value}</div>
    return (
      <TextArea
        value={value}
        onChange={(e) => handleMonthNoteChange(record.key, monthIndex, e.target.value)}
        autoSize={{ minRows: 1, maxRows: 4 }}
        style={{ fontSize: '12px' }}
        placeholder={`${selectedYear}.${monthIndex + 1} 记录...`}
      />
    )
  }

  // 处理单元格编辑（仅姓名）
  const handleCellChange = (key: string, field: keyof ParentInterviewRecord, value: string) => {
    const newData = dataSource.map((item) => (item.key === key ? { ...item, [field]: value } : item))
    setDataSource(newData)
  }

  // 编辑月份内容
  const handleMonthNoteChange = (key: string, monthIndex: number, value: string) => {
    setDataSource((prev) =>
      prev.map((item) => {
        if (item.key !== key) return item
        const notes = [...(item.monthNotes || Array(12).fill(''))]
        notes[monthIndex] = value
        return { ...item, monthNotes: notes }
      }),
    )
  }

  // 添加新行
  const handleAdd = () => {
    const newRecord: ParentInterviewRecord = {
      key: `${Date.now()}`,
      serialNumber: dataSource.length + 1,
      studentName: '',
      monthNotes: Array(12).fill(''),
    }
    setDataSource([...dataSource, newRecord])
    message.success('已添加新行')
  }

  // 删除行
  const handleDelete = (key: string) => {
    const newData = dataSource.filter((item) => item.key !== key)
    const reNumbered = newData.map((item, index) => ({
      ...item,
      serialNumber: index + 1,
    }))
    setDataSource(reNumbered)
    message.success('已删除')
  }


  // 从后端加载数据
  const loadData = async () => {
    if (!selectedCampus || !selectedYear) return
    try {
      setLoading(true)
      const params = new URLSearchParams({
        campus: selectedCampus,
        year: String(selectedYear),
      })
      const res = await fetch(`${buildApiUrl('/teaching-quality/parent-interview-record')}?${params.toString()}`)
      if (!res.ok) throw new Error(await res.text())
      const data = (await res.json()) as {
        行列表: Array<{ 序号: number; 姓名?: string; 访谈记录?: string[] }>
      }
      const rows: ParentInterviewRecord[] = (data.行列表 || []).map((r) => ({
        key: String(r.序号 ?? Math.random()),
        serialNumber: r.序号 ?? 0,
        studentName: r.姓名 || '',
        monthNotes: r.访谈记录 || Array(12).fill(''),
      }))

      if (rows.length === 0) {
        setDataSource([
          {
            key: '1',
            serialNumber: 1,
            studentName: '',
            monthNotes: Array(12).fill(''),
          },
        ])
      } else {
        setDataSource(rows)
      }
    } catch (e: any) {
      console.error(e)
      message.error('加载数据失败: ' + (e?.message || '未知错误'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedCampus, selectedYear])

  // 处理刷新
  const handleRefresh = () => {
    loadData()
    message.success('数据已刷新')
  }

  // 处理导出
  const handleExport = () => {
    message.info('导出功能开发中...')
  }

  // 处理保存
  const handleSave = async () => {
    if (!selectedCampus || !selectedYear) {
      message.error('请先选择神殿和年份')
      return
    }
    try {
      setLoading(true)
      const res = await fetch(buildApiUrl('/teaching-quality/parent-interview-record'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          campus: selectedCampus,
          year: selectedYear,
          rows: dataSource.map((row) => ({
            序号: row.serialNumber,
            姓名: row.studentName,
            访谈记录: row.monthNotes,
          })),
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      message.success('保存成功')
      setEditMode(false)
      loadData() // 重新加载数据以显示最新状态
    } catch (e: any) {
      console.error(e)
      message.error('保存失败: ' + (e?.message || '未知错误'))
    } finally {
      setLoading(false)
    }
  }

  // 处理编辑模式切换
  const handleEditToggle = () => {
    setEditMode(!editMode)
  }

  return (
    <Card
      title={`${selectedCampus || 'XX神殿'}家长访谈记录表`}
      extra={
        <Space>
          <Select
            style={{ width: 150 }}
            value={selectedCampus}
            onChange={setSelectedCampus}
            placeholder="选择神殿"
          >
            {campuses.map((campus) => (
              <Option key={campus.id} value={campus.name}>
                {campus.name}
              </Option>
            ))}
          </Select>
          <Select style={{ width: 120 }} value={selectedYear} onChange={setSelectedYear}>
            <Option value={2023}>2023年</Option>
            <Option value={2024}>2024年</Option>
            <Option value={2025}>2025年</Option>
          </Select>
          <Select style={{ width: 100 }} value={selectedMonth} onChange={setSelectedMonth}>
            {Array.from({ length: 12 }, (_, i) => (
              <Option key={i + 1} value={i + 1}>
                {i + 1}月
              </Option>
            ))}
          </Select>
          <Button type="dashed" icon={<PlusOutlined />} onClick={handleAdd}>
            添加
          </Button>
          {editMode ? (
            <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>
              保存
            </Button>
          ) : (
            <Button icon={<EditOutlined />} onClick={handleEditToggle}>
              编辑
            </Button>
          )}
          <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={loading}>
            刷新
          </Button>
          <Button icon={<DownloadOutlined />} onClick={handleExport}>
            导出
          </Button>
        </Space>
      }
    >
      <Table
        columns={columns}
        dataSource={dataSource}
        loading={loading}
        pagination={false}
        bordered
        scroll={{ x: 1900 }}
        size="small"
        rowKey="key"
      />

      <style>{`
        .ant-table-cell {
          padding: 8px 4px !important;
          font-size: 12px;
        }
      `}</style>


    </Card>
  )
}

export default ParentInterviewTable
