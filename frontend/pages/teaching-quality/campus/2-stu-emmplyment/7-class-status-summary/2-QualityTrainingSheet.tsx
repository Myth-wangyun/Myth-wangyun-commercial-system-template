// 素质训练：QualityTrainingSheet.tsx · 素质训练登记表（按班级+年月）。支持选择班级/年月、刷新、保存。

import React, { useEffect, useState } from 'react'
import { App, Card, Table, Input, Select, Button, Space, DatePicker, Modal } from 'antd'
import { ImportOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { buildApiUrl } from '@/utils/apiBase'
import { useCampusStore } from '@/stores/campusStore'
import dayjs from 'dayjs'

const normalizePercentInput = (raw: string) => {
  const s = String(raw ?? '').trim()
  if (!s) return ''

  // Accept: "95", "95%", "95.5", "0.955", "0.955%".
  const numText = s.endsWith('%') ? s.slice(0, -1).trim() : s
  if (!numText) return ''

  const n = Number(numText)
  if (Number.isNaN(n)) return s

  // If user input is between 0 and 1, treat it as a ratio and convert to percent.
  const percent = n > 0 && n <= 1 ? n * 100 : n
  const fixed = Number.isInteger(percent) ? String(percent) : String(Number(percent.toFixed(2)))
  return `${fixed}%`
}

const isPercentText = (value: string) => {
  const s = String(value ?? '').trim()
  if (!s) return true
  return /^\d+(?:\.\d+)?%$/.test(s)
}

interface QualityTrainingRow {
  key: string
  serialNumber: number
  date: string
  content: string
  lessonCount: string
  homeworkSubmitRate: string
  examPassRate: string
  issuesSummary: string
}

interface ApiQTRow {
  序号: number
  时间?: string | null
  内容?: string | null
  几节课?: string | null
  作业提交率?: string | null
  考试合格率?: string | null
  问题汇总?: string | null
}

interface ApiQTList {
  神殿名称: string
  班级名称: string
  年份: number
  月份: number
  行列表: ApiQTRow[]
}

interface ClassListItem { 班级名称: string; 神殿: string }

const createRow = (
  serial: number,
  overrides: Partial<QualityTrainingRow> = {},
): QualityTrainingRow => ({
  key: String(serial),
  serialNumber: serial,
  date: '',
  content: '',
  lessonCount: '',
  homeworkSubmitRate: '',
  examPassRate: '',
  issuesSummary: '',
  ...overrides,
})

const DEFAULT_ROWS_COUNT = 15

const initialData: QualityTrainingRow[] = Array.from({ length: DEFAULT_ROWS_COUNT }, (_, i) => createRow(i + 1))

const normalizeMonthDayText = (value: string) => {
  const text = (value || '').trim()
  if (!text) return ''
  const fullMatch = text.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})$/)
  if (fullMatch) {
    const month = Number(fullMatch[2])
    const day = Number(fullMatch[3])
    return `${month}.${day}`
  }
  const mdMatch = text.match(/^(\d{1,2})[./-](\d{1,2})$/)
  if (mdMatch) {
    const month = Number(mdMatch[1])
    const day = Number(mdMatch[2])
    return `${month}.${day}`
  }
  return text
}

const parseMonthDay = (value: string, fallbackYear: number) => {
  const text = (value || '').trim()
  if (!text) return null
  const fullMatch = text.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})$/)
  if (fullMatch) {
    const d = dayjs(`${fullMatch[1]}-${String(fullMatch[2]).padStart(2, '0')}-${String(fullMatch[3]).padStart(2, '0')}`)
    return d.isValid() ? d : null
  }
  const mdMatch = text.match(/^(\d{1,2})[./-](\d{1,2})$/)
  if (mdMatch) {
    const d = dayjs(`${fallbackYear}-${String(mdMatch[1]).padStart(2, '0')}-${String(mdMatch[2]).padStart(2, '0')}`)
    return d.isValid() ? d : null
  }
  return null
}

const fromApiRow = (r: ApiQTRow): QualityTrainingRow => ({
  key: String(r.序号),
  serialNumber: r.序号,
  date: normalizeMonthDayText(r.时间 || ''),
  content: (r.内容 || '').trim(),
  lessonCount: (r.几节课 || '').trim(),
  homeworkSubmitRate: (r.作业提交率 || '').trim(),
  examPassRate: (r.考试合格率 || '').trim(),
  issuesSummary: (r.问题汇总 || '').trim(),
})

const toApiRow = (r: QualityTrainingRow): ApiQTRow => ({
  序号: r.serialNumber,
  时间: r.date || undefined,
  内容: r.content || undefined,
  几节课: r.lessonCount || undefined,
  作业提交率: r.homeworkSubmitRate || undefined,
  考试合格率: r.examPassRate || undefined,
  问题汇总: r.issuesSummary || undefined,
})

const QualityTrainingSheet: React.FC = () => {
  const { message } = App.useApp()
  const today = new Date()
  const currentCampus = useCampusStore((state) => state.currentCampus)
  const [classes, setClasses] = useState<Array<{ label: string; value: string }>>([])
  const [selectedCampus, setSelectedCampus] = useState<string>('')
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [year, setYear] = useState<number>(today.getFullYear())
  const [month, setMonth] = useState<number>(today.getMonth() + 1)

  const [dataSource, setDataSource] = useState<QualityTrainingRow[]>(initialData)
  const [loading, setLoading] = useState<boolean>(false)

  // 导入数据相关状态
  const [importModalVisible, setImportModalVisible] = useState<boolean>(false)
  const [importText, setImportText] = useState<string>('')

  // 解析粘贴的数据
  const parseImportData = (text: string): QualityTrainingRow[] => {
    const lines = text.trim().split('\n').filter(line => line.trim())
    if (lines.length === 0) return []

    const rows: QualityTrainingRow[] = []
    
    for (const line of lines) {
      // 按制表符或多个空格分割
      const cells = line.split(/\t+|\s{2,}/).map(cell => cell.trim())
      
      // 跳过表头行（包含"序号"、"时间"等标题）
      if (cells[0] === '序号' || cells[1] === '时间') continue
      
      // 解析序号
      const serialNumber = parseInt(cells[0], 10)
      if (isNaN(serialNumber)) continue

      const row: QualityTrainingRow = {
        key: String(serialNumber),
        serialNumber,
        date: normalizeMonthDayText(cells[1] || ''),
        content: (cells[2] || '').trim(),
        lessonCount: (cells[3] || '').trim(),
        homeworkSubmitRate: normalizePercentInput(cells[4] || ''),
        examPassRate: normalizePercentInput(cells[5] || ''),
        issuesSummary: (cells[6] || '').trim(),
      }
      rows.push(row)
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

  const ensureDefaultRows = (rows: QualityTrainingRow[]): QualityTrainingRow[] => {
    if (rows.length >= DEFAULT_ROWS_COUNT) return rows
    const maxSerial = rows.reduce((m, r) => Math.max(m, r.serialNumber), 0)
    const extras = Array.from({ length: DEFAULT_ROWS_COUNT - rows.length }, (_, i) => createRow(maxSerial + i + 1))
    return [...rows, ...extras]
  }

  const loadData = async (campus: string, klass: string, y: number, m: number) => {
    setLoading(true)
    try {
      const res = await fetch(
        buildApiUrl(`/teaching-quality/quality-training?campus=${encodeURIComponent(campus)}&class=${encodeURIComponent(klass)}&year=${y}&month=${m}`),
      )
      if (!res.ok) throw new Error(await res.text())
      const data = (await res.json()) as ApiQTList
      const rows = (data.行列表 || []).map(fromApiRow)
      setDataSource(rows.length ? ensureDefaultRows(rows) : initialData)
    } catch (e) {
      console.error(e)
      message.warning('未能读取素质训练登记表，使用默认空白行')
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

  const handleChange = (key: string, field: keyof QualityTrainingRow, value: string) => {
    setDataSource((prev) => prev.map((row) => (row.key === key ? { ...row, [field]: value } : row)))
  }

  const columns: ColumnsType<QualityTrainingRow> = [
    {
      title: '序号',
      dataIndex: 'serialNumber',
      key: 'serialNumber',
      width: 70,
      align: 'center',
      fixed: 'left',
    },
    {
      title: '时间',
      dataIndex: 'date',
      key: 'date',
      width: 100,
      align: 'center',
      render: (text, record) => (
        <DatePicker
          value={parseMonthDay(text, year)}
          format="M.D"
          placeholder="选择月日"
          onChange={(date) => handleChange(record.key, 'date' as const, date ? date.format('M.D') : '')}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: '内容',
      dataIndex: 'content',
      key: 'content',
      width: 200,
      align: 'left',
      render: (text, record) => (
        <Input value={text} onChange={(e) => handleChange(record.key, 'content' as const, e.target.value)} />
      ),
    },
    {
      title: '几节课',
      dataIndex: 'lessonCount',
      key: 'lessonCount',
      width: 100,
      align: 'center',
      render: (text, record) => (
        <Input value={text} onChange={(e) => handleChange(record.key, 'lessonCount' as const, e.target.value)} />
      ),
    },
    {
      title: '作业提交率',
      dataIndex: 'homeworkSubmitRate',
      key: 'homeworkSubmitRate',
      width: 140,
      align: 'center',
      render: (text, record) => (
        <Input
          value={text}
          placeholder="如：100%"
          status={isPercentText(text) ? undefined : 'error'}
          onBlur={(e) => handleChange(record.key, 'homeworkSubmitRate' as const, normalizePercentInput(e.target.value))}
          onChange={(e) => handleChange(record.key, 'homeworkSubmitRate' as const, e.target.value)}
        />
      ),
    },
    {
      title: '考试合格率',
      dataIndex: 'examPassRate',
      key: 'examPassRate',
      width: 140,
      align: 'center',
      render: (text, record) => (
        <Input
          value={text}
          placeholder="如：95%"
          status={isPercentText(text) ? undefined : 'error'}
          onBlur={(e) => handleChange(record.key, 'examPassRate' as const, normalizePercentInput(e.target.value))}
          onChange={(e) => handleChange(record.key, 'examPassRate' as const, e.target.value)}
        />
      ),
    },
    {
      title: '问题汇总',
      dataIndex: 'issuesSummary',
      key: 'issuesSummary',
      width: 260,
      align: 'left',
      render: (text, record) => (
        <Input.TextArea
          autoSize={{ minRows: 1, maxRows: 3 }}
          value={text}
          onChange={(e) => handleChange(record.key, 'issuesSummary' as const, e.target.value)}
        />
      ),
    },
  ]

  const anyContentFilled = (r: QualityTrainingRow) =>
    !!(
      (r.date && r.date.trim()) ||
      (r.content && r.content.trim()) ||
      (r.lessonCount && r.lessonCount.trim()) ||
      (r.homeworkSubmitRate && r.homeworkSubmitRate.trim()) ||
      (r.examPassRate && r.examPassRate.trim()) ||
      (r.issuesSummary && r.issuesSummary.trim())
    )

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={
          <Space>
            <span>素质训练登记表</span>
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
                const payloadRows = dataSource
                  .filter((r) => anyContentFilled(r))
                  .map((r) => toApiRow(r))

                try {
                  const res = await fetch(buildApiUrl('/teaching-quality/quality-training'), {
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
                  const data = (await res.json()) as ApiQTList
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
        <Table<QualityTrainingRow>
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
        title="导入素质训练数据"
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
            请粘贴从Excel或其他表格复制的数据，格式为：序号、时间、内容、几节课、作业提交率、考试合格率、问题汇总（用制表符分隔）
          </p>
          <p style={{ color: '#999', fontSize: 12 }}>
            示例：1	11.2	弟子规总序	三节课	98	80	无
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

export default QualityTrainingSheet
