import React, { useEffect, useMemo, useState } from 'react'
import { App, Card, DatePicker, Input, Space, Table, Button } from 'antd'
import { FileTextOutlined, SaveOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import dayjs, { Dayjs } from 'dayjs'
import api from '@/services/api'
import { NoCopyContainer } from '@/components/common'

/**
 * 013祈福司会议记录表
 */

const { TextArea } = Input

// 会议记录行类型
type MeetingRow = {
  key: string
  序号: number
  时间: string // 格式: YYYY-MM-DD
  地点: string
  主持人: string
  重要领导: string
  参与人: string
  议题: string
  问题解决: string
  问题待解决: string
}

export default function ConsultMeetingRecord() {
  const { message, notification } = App.useApp()
  const currentYear = dayjs().format('YYYY')
  const [year, setYear] = useState(currentYear)
  const [rows, setRows] = useState<MeetingRow[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // 初始化12行空数据
  const createEmptyRows = (): MeetingRow[] => {
    return Array.from({ length: 12 }, (_, i) => ({
      key: String(i + 1),
      序号: i + 1,
      时间: '',
      地点: '',
      主持人: '',
      重要领导: '',
      参与人: '',
      议题: '',
      问题解决: '',
      问题待解决: '',
    }))
  }

  // 加载数据
  const loadData = async (yearValue: string) => {
    setLoading(true)
    try {
      const response = await api.get(`/consult/meeting-record/${yearValue}`)
      const data = response.data
      if (data && data.表格数据) {
        setRows(data.表格数据.map((row: any) => ({
          ...row,
          key: String(row.序号),
        })))
      } else {
        setRows(createEmptyRows())
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        setRows(createEmptyRows())
      } else {
        message.error('加载数据失败')
        console.error(error)
      }
    } finally {
      setLoading(false)
    }
  }

  // 初始加载
  useEffect(() => {
    loadData(year)
  }, [year])

  // 年份改变
  const handleYearChange = (date: Dayjs | null) => {
    if (!date) return
    const newYear = date.format('YYYY')
    setYear(newYear)
  }

  // 更新字段值
  const updateField = (index: number, field: Exclude<keyof MeetingRow, 'key' | '序号'>, value: string) => {
    setRows(prev => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  // 更新日期字段
  const updateDateField = (index: number, date: Dayjs | null) => {
    setRows(prev => {
      const next = [...prev]
      next[index].时间 = date ? date.format('YYYY-MM-DD') : ''
      return next
    })
  }

  // 添加行
  const addRow = () => {
    setRows(prev => {
      const newIndex = prev.length + 1
      return [
        ...prev,
        {
          key: String(newIndex),
          序号: newIndex,
          时间: '',
          地点: '',
          主持人: '',
          重要领导: '',
          参与人: '',
          议题: '',
          问题解决: '',
          问题待解决: '',
        },
      ]
    })
  }

  // 删除行
  const deleteRow = (index: number) => {
    if (rows.length <= 1) {
      message.warning('至少保留一行')
      return
    }
    setRows(prev => {
      const next = prev.filter((_, i) => i !== index)
      // 重新编号
      return next.map((row, idx) => ({
        ...row,
        序号: idx + 1,
        key: String(idx + 1),
      }))
    })
  }

  // 保存数据
  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        表格数据: rows.map(row => ({
          序号: row.序号,
          时间: row.时间,
          地点: row.地点,
          主持人: row.主持人,
          重要领导: row.重要领导,
          参与人: row.参与人,
          议题: row.议题,
          问题解决: row.问题解决,
          问题待解决: row.问题待解决,
        })),
      }

      // 先尝试更新，如果不存在则创建
      try {
        await api.put(`/consult/meeting-record/${year}`, payload)
      } catch (error: any) {
        if (error.response?.status === 404) {
          // 记录不存在，创建新记录
          await api.post('/consult/meeting-record/', {
            年份: parseInt(year),
            ...payload,
          })
        } else {
          throw error
        }
      }
      notification.success({
        message: '已保存',
        description: `${year}年会议记录已成功保存`,
        placement: 'topRight',
        duration: 3,
      })
    } catch (error) {
      notification.error({
        message: '保存失败',
        description: '请检查网络连接或联系管理员',
        placement: 'topRight',
        duration: 4,
      })
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  // 表格列配置
  const columns = [
    {
      title: '时间',
      dataIndex: '时间',
      key: '时间',
      width: 150,
      render: (val: string, record: MeetingRow, index: number) => (
        <DatePicker
          value={val ? dayjs(val, 'YYYY-MM-DD') : null}
          onChange={date => updateDateField(index, date)}
          size="small"
          placeholder="选择日期"
          format="YYYY-MM-DD"
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: '地点',
      dataIndex: '地点',
      key: '地点',
      width: 120,
      render: (val: string, record: MeetingRow, index: number) => (
        <Input
          value={val}
          onChange={e => updateField(index, '地点', e.target.value)}
          size="small"
          placeholder="地点"
        />
      ),
    },
    {
      title: '主持人',
      dataIndex: '主持人',
      key: '主持人',
      width: 100,
      render: (val: string, record: MeetingRow, index: number) => (
        <Input
          value={val}
          onChange={e => updateField(index, '主持人', e.target.value)}
          size="small"
          placeholder="主持人"
        />
      ),
    },
    {
      title: '重要领导',
      dataIndex: '重要领导',
      key: '重要领导',
      width: 120,
      render: (val: string, record: MeetingRow, index: number) => (
        <Input
          value={val}
          onChange={e => updateField(index, '重要领导', e.target.value)}
          size="small"
          placeholder="重要领导"
        />
      ),
    },
    {
      title: '参与人',
      dataIndex: '参与人',
      key: '参与人',
      width: 150,
      render: (val: string, record: MeetingRow, index: number) => (
        <TextArea
          value={val}
          onChange={e => updateField(index, '参与人', e.target.value)}
          size="small"
          placeholder="参与人"
          autoSize={{ minRows: 2, maxRows: 4 }}
        />
      ),
    },
    {
      title: '议题',
      dataIndex: '议题',
      key: '议题',
      width: 200,
      render: (val: string, record: MeetingRow, index: number) => (
        <TextArea
          value={val}
          onChange={e => updateField(index, '议题', e.target.value)}
          size="small"
          placeholder="议题"
          autoSize={{ minRows: 2, maxRows: 6 }}
        />
      ),
    },
    {
      title: '问题解决',
      dataIndex: '问题解决',
      key: '问题解决',
      width: 200,
      render: (val: string, record: MeetingRow, index: number) => (
        <TextArea
          value={val}
          onChange={e => updateField(index, '问题解决', e.target.value)}
          size="small"
          placeholder="问题解决"
          autoSize={{ minRows: 2, maxRows: 6 }}
        />
      ),
    },
    {
      title: '问题待解决',
      dataIndex: '问题待解决',
      key: '问题待解决',
      width: 200,
      render: (val: string, record: MeetingRow, index: number) => (
        <TextArea
          value={val}
          onChange={e => updateField(index, '问题待解决', e.target.value)}
          size="small"
          placeholder="问题待解决"
          autoSize={{ minRows: 2, maxRows: 6 }}
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      fixed: 'right' as const,
      align: 'center' as const,
      render: (_: any, record: MeetingRow, index: number) => (
        <Button
          type="link"
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => deleteRow(index)}
        >
          删除
        </Button>
      ),
    },
  ]

  return (
    <NoCopyContainer warningMessage="祈福司门数据禁止复制">
      <Card
        title={
          <Space>
            <FileTextOutlined />
            <span style={{ background: '#FFA500', color: '#fff', padding: '4px 12px' }}>
              会议记录表
            </span>
          </Space>
        }
        extra={
          <Space>
            <DatePicker
              value={dayjs(year, 'YYYY')}
              onChange={handleYearChange}
              picker="year"
              allowClear={false}
            />
            <Button type="default" icon={<PlusOutlined />} onClick={addRow}>
              添加记录
            </Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSave}
              loading={saving}
            >
              保存
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={rows}
          pagination={false}
          bordered
          size="small"
          scroll={{ x: 1400 }}
          loading={loading}
          style={{ marginTop: 16 }}
        />
      </Card>
    </NoCopyContainer>
  )
}
