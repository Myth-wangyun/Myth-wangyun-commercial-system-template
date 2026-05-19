// 班会情况：ClassMeetingStatusSheet.tsx · 班会情况表（按班级+年月）
// 支持：选择班级/年月、读取/刷新、编辑与保存。

import React, { useEffect, useState } from 'react'
import { App, Card, Table, Input, Select, Button, Space, DatePicker, Modal } from 'antd'
import { ImportOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { buildApiUrl } from '@/utils/apiBase'
import { useCampusStore } from '@/stores/campusStore'
import dayjs from 'dayjs'

interface ClassMeetingRow {
  key: string
  serialNumber: number // 行序号，仅用于后端唯一约束
  time: string
  location: string
  participants: string
  topic: string
  keyPoints: string
}

// API 类型（中文键名）
interface ApiMeetingRow {
  序号: number
  时间?: string | null
  地点?: string | null
  参与人?: string | null
  主题?: string | null
  把控关键点?: string | null
}

interface ApiMeetingList {
  神殿名称: string
  班级名称: string
  年份: number
  月份: number
  行列表: ApiMeetingRow[]
}

interface ClassListItem { 班级名称: string; 神殿: string }

const createRow = (
  serial: number,
  overrides: Partial<ClassMeetingRow> = {},
): ClassMeetingRow => ({
  key: String(serial),
  serialNumber: serial,
  time: '',
  location: '',
  participants: '',
  topic: '',
  keyPoints: '',
  ...overrides,
})

const DEFAULT_ROWS_COUNT = 12

const initialData: ClassMeetingRow[] = Array.from({ length: DEFAULT_ROWS_COUNT }, (_, i) => createRow(i + 1))

const fromApiRow = (r: ApiMeetingRow): ClassMeetingRow => ({
  key: String(r.序号),
  serialNumber: r.序号,
  time: (r.时间 || '').trim(),
  location: (r.地点 || '').trim(),
  participants: (r.参与人 || '').trim(),
  topic: (r.主题 || '').trim(),
  keyPoints: (r.把控关键点 || '').trim(),
})

const toApiRow = (r: ClassMeetingRow): ApiMeetingRow => ({
  序号: r.serialNumber,
  时间: r.time || undefined,
  地点: r.location || undefined,
  参与人: r.participants || undefined,
  主题: r.topic || undefined,
  把控关键点: r.keyPoints || undefined,
})

const ClassMeetingStatusSheet: React.FC = () => {
  const { message } = App.useApp()
  const today = new Date()
  const currentCampus = useCampusStore((state) => state.currentCampus)
  const [classes, setClasses] = useState<Array<{ label: string; value: string }>>([])
  const [selectedCampus, setSelectedCampus] = useState<string>('')
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [year, setYear] = useState<number>(today.getFullYear())
  const [month, setMonth] = useState<number>(today.getMonth() + 1)

  const [dataSource, setDataSource] = useState<ClassMeetingRow[]>(initialData)
  const [loading, setLoading] = useState<boolean>(false)

  // 导入数据相关状态
  const [importModalVisible, setImportModalVisible] = useState<boolean>(false)
  const [importText, setImportText] = useState<string>('')

  // 规范化日期格式：2026.1.1 -> 2026-01-01
  const normalizeDateText = (text: string): string => {
    const s = (text || '').trim()
    if (!s) return ''
    
    // 匹配 YYYY.M.D 或 YYYY-M-D 或 YYYY/M/D 格式
    const match = s.match(/^(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})$/)
    if (match) {
      const year = match[1]
      const month = String(match[2]).padStart(2, '0')
      const day = String(match[3]).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
    return s
  }

  // 解析粘贴的数据
  const parseImportData = (text: string): ClassMeetingRow[] => {
    const lines = text.trim().split('\n').filter(line => line.trim())
    if (lines.length === 0) return []

    const rows: ClassMeetingRow[] = []
    let serialCounter = 1

    for (const line of lines) {
      // 按制表符分割
      const cells = line.split(/\t/).map(cell => cell.trim())

      // 跳过表头行
      if (cells[0] === '时间' || cells[1] === '地点') continue

      // 解析数据行
      const time = normalizeDateText(cells[0] || '')
      const location = (cells[1] || '').trim()
      const participants = (cells[2] || '').trim()
      const topic = (cells[3] || '').trim()
      const keyPoints = (cells[4] || '').trim()

      // 至少有一个字段有值才添加
      if (time || location || participants || topic || keyPoints) {
        rows.push(createRow(serialCounter++, {
          time,
          location,
          participants,
          topic,
          keyPoints,
        }))
      }
    }

    return rows
  }

  // 处理导入
  const handleImport = () => {
    if (!importText.trim()) {
      message.warning('请粘贴要导入的数据')
      return
    }

    const parsedRows = parseImportData(importText)
    if (parsedRows.length === 0) {
      message.error('未能解析出有效数据，请检查数据格式')
      return
    }

    setDataSource(ensureDefaultRows(parsedRows))
    setImportModalVisible(false)
    setImportText('')
    message.success(`成功导入 ${parsedRows.length} 条数据`)
  }

  // 加载班级列表（只显示当前神殿的班级）
  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch(buildApiUrl('/teaching-quality/class-list'))
        if (!res.ok) throw new Error('加载班级列表失败')
        const list = (await res.json()) as ClassListItem[]
        const norm = (s: string) => (s || '').replace(/神殿$/, '').trim()
        const currentCampusNorm = norm(currentCampus || '')
        
        // 过滤只显示当前神殿的班级
        const filteredList = currentCampusNorm 
          ? list.filter((it) => norm(it.神殿) === currentCampusNorm)
          : list
        
        const options = filteredList.map((it) => ({ 
          label: `${norm(it.神殿)} - ${it.班级名称}`, 
          value: `${norm(it.神殿)}||${it.班级名称}` 
        }))
        const unique = Array.from(new Map(options.map((o) => [o.value, o])).values())
        setClasses(unique)
      } catch (e) {
        console.error(e)
        message.error('加载班级列表失败')
      }
    })()
  }, [currentCampus])

  const ensureDefaultRows = (rows: ClassMeetingRow[]): ClassMeetingRow[] => {
    if (rows.length >= DEFAULT_ROWS_COUNT) return rows.map((r, idx) => ({ ...r, serialNumber: idx + 1, key: String(idx + 1) }))
    const base = rows.map((r, idx) => ({ ...r, serialNumber: idx + 1, key: String(idx + 1) }))
    const extras = Array.from({ length: DEFAULT_ROWS_COUNT - rows.length }, (_, i) => createRow(base.length + i + 1))
    return [...base, ...extras]
  }

  const loadData = async (campus: string, klass: string, y: number, m: number) => {
    setLoading(true)
    try {
      const res = await fetch(
        buildApiUrl(`/teaching-quality/class-meeting-status?campus=${encodeURIComponent(campus)}&class=${encodeURIComponent(klass)}&year=${y}&month=${m}`),
      )
      if (!res.ok) throw new Error(await res.text())
      const data = (await res.json()) as ApiMeetingList
      const rows = (data.行列表 || []).map(fromApiRow)
      setDataSource(rows.length ? ensureDefaultRows(rows) : initialData)
    } catch (e) {
      console.error(e)
      message.warning('未能读取班会情况，使用默认空白行')
      setDataSource(initialData)
    } finally {
      setLoading(false)
    }
  }

  const onSelectClass = async (val: string) => {
    const [campus, klass] = String(val).split('||')
    const campusNorm = (campus || '').trim()
    const classNorm = (klass || '').trim()
    setSelectedCampus(campusNorm)
    setSelectedClass(classNorm)
    await loadData(campusNorm, classNorm, year, month)
  }

  const handleChange = (key: string, field: keyof ClassMeetingRow, value: string) => {
    setDataSource((prev) => prev.map((row) => (row.key === key ? { ...row, [field]: value } : row)))
  }

  const columns: ColumnsType<ClassMeetingRow> = [
    {
      title: '时间',
      dataIndex: 'time',
      key: 'time',
      width: 200,
      align: 'center',
      render: (text, record) => (
        <DatePicker
          showTime
          format="YYYY-MM-DD HH:mm"
          value={text ? dayjs(text) : null}
          onChange={(date) => {
            const formattedTime = date ? date.format('YYYY-MM-DD HH:mm') : ''
            handleChange(record.key, 'time', formattedTime)
          }}
          style={{ width: '100%' }}
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
          placeholder="如：全体同学、班主任、辅导员等"
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
          placeholder="如：班级纪律教育、安全教育等"
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
          placeholder="如：重点强调哪些内容、学生反馈情况等"
          onChange={(e) => handleChange(record.key, 'keyPoints', e.target.value)}
        />
      ),
    },
  ]

  const anyContentFilled = (r: ClassMeetingRow) => !!((r.time && r.time.trim()) || (r.location && r.location.trim()) || (r.participants && r.participants.trim()) || (r.topic && r.topic.trim()) || (r.keyPoints && r.keyPoints.trim()))

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={
          <Space>
            <span>班会情况表</span>
            <Select
              placeholder={classes.length ? '选择班级' : '暂无班级'}
              value={selectedCampus && selectedClass ? `${selectedCampus}||${selectedClass}` : undefined}
              options={classes}
              onChange={onSelectClass}
              style={{ width: 260 }}
              showSearch
            />
            <Select
              value={year}
              onChange={async (y) => {
                setYear(y)
                if (selectedCampus && selectedClass) await loadData(selectedCampus, selectedClass, y, month)
              }}
              options={Array.from({ length: 6 }).map((_, i) => ({ label: `${today.getFullYear() - i}年`, value: today.getFullYear() - i }))}
              style={{ width: 110 }}
            />
            <Select
              value={month}
              onChange={async (m) => {
                setMonth(m)
                if (selectedCampus && selectedClass) await loadData(selectedCampus, selectedClass, year, m)
              }}
              options={Array.from({ length: 12 }).map((_, i) => ({ label: `${i + 1}月`, value: i + 1 }))}
              style={{ width: 90 }}
            />
          </Space>
        }
        extra={
          <Space>
            <Button icon={<ImportOutlined />} onClick={() => setImportModalVisible(true)}>导入数据</Button>
            <Button onClick={() => selectedCampus && selectedClass && loadData(selectedCampus, selectedClass, year, month)}>刷新</Button>
            <Button
              type="primary"
              onClick={async () => {
                if (!selectedCampus || !selectedClass) {
                  message.warning('请先选择班级')
                  return
                }
                const payloadRows: ApiMeetingRow[] = dataSource
                  .filter((r) => anyContentFilled(r))
                  .map((r, idx) => toApiRow({ ...r, serialNumber: idx + 1 }))

                try {
                  const res = await fetch(buildApiUrl('/teaching-quality/class-meeting-status'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      神殿名称: selectedCampus,
                      班级名称: selectedClass,
                      年份: year,
                      月份: month,
                      行列表: payloadRows,
                    }),
                  })
                  if (!res.ok) throw new Error(await res.text())
                  const data = (await res.json()) as ApiMeetingList
                  const rows = (data.行列表 || []).map(fromApiRow)
                  setDataSource(rows.length ? ensureDefaultRows(rows) : initialData)
                  message.success('保存成功')
                } catch (e) {
                  console.error(e)
                  message.error('保存失败')
                }
              }}
            >
              保存
            </Button>
          </Space>
        }
      >
        <Table<ClassMeetingRow>
          bordered
          size="small"
          columns={columns}
          dataSource={dataSource}
          loading={loading}
          pagination={false}
          rowKey="key"
          scroll={{ x: 'max-content' }}
        />
      </Card>

      {/* 导入数据弹窗 */}
      <Modal
        title="导入班会情况数据"
        open={importModalVisible}
        onOk={handleImport}
        onCancel={() => {
          setImportModalVisible(false)
          setImportText('')
        }}
        okText="导入"
        cancelText="取消"
        width={700}
      >
        <div style={{ marginBottom: 12 }}>
          <p style={{ color: '#666', marginBottom: 8 }}>
            请粘贴从Excel或其他表格复制的数据，格式为：时间、地点、参与人、主题、把控关键点（用制表符分隔）
          </p>
          <p style={{ color: '#999', fontSize: 12 }}>
            示例：2026.1.1	会议室	李涵芝	爱	无
          </p>
        </div>
        <Input.TextArea
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          placeholder="在此粘贴数据..."
          rows={12}
          style={{ fontFamily: 'monospace' }}
        />
      </Modal>
    </div>
  )
}

export default ClassMeetingStatusSheet
