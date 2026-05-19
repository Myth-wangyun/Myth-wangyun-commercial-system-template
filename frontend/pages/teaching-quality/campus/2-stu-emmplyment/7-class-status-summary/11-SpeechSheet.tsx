// 班级演讲评分表：SpeechSheet.tsx（按班级+年月）
// 支持：选择班级/年月、按班级档案渲染等量行、读取/刷新/保存。

import React, { useEffect, useMemo, useState } from 'react'
import { App, Card, Table, Input, InputNumber, Select, Button, Space, DatePicker, Modal } from 'antd'
import { ImportOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { buildApiUrl } from '@/utils/apiBase'
import { useCampusStore } from '@/stores/campusStore'
import dayjs from 'dayjs'

interface SpeechRow {
  key: string
  serialNumber: number
  name: string
  date: string
  topic: string
  score: number | null
}

// API（中文键名）
interface ApiRow {
  序号: number
  姓名?: string | null
  日期?: string | null
  演讲主题?: string | null
  评分?: number | null
}

interface ApiList {
  神殿名称: string
  班级名称: string
  年份: number
  月份: number
  行列表: ApiRow[]
}

interface ClassListItem { 班级名称: string; 神殿: string }
interface ClassFileRow { serialNumber?: number; name?: string }
interface ClassFileList { 行列表: ClassFileRow[] }

const createRow = (serial: number, overrides: Partial<SpeechRow> = {}): SpeechRow => ({
  key: String(serial),
  serialNumber: serial,
  name: '',
  date: '',
  topic: '',
  score: null,
  ...overrides,
})

const fromApiRow = (r: ApiRow): SpeechRow => ({
  key: `${r.序号}__${r.姓名 || ''}`,
  serialNumber: r.序号,
  name: (r.姓名 || '').trim(),
  date: (r.日期 || '').trim(),
  topic: (r.演讲主题 || '').trim(),
  score: typeof r.评分 === 'number' ? r.评分 : null,
})

const toApiRow = (r: SpeechRow): ApiRow => ({
  序号: r.serialNumber,
  姓名: r.name || undefined,
  日期: r.date || undefined,
  演讲主题: r.topic || undefined,
  评分: typeof r.score === 'number' ? r.score : undefined,
})

const SpeechSheet: React.FC = () => {
  const { message } = App.useApp()
  const today = new Date()
  const currentCampus = useCampusStore((state) => state.currentCampus)
  const [classes, setClasses] = useState<Array<{ label: string; value: string }>>([])
  const [selectedCampus, setSelectedCampus] = useState<string>('')
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [year, setYear] = useState<number>(today.getFullYear())
  const [month, setMonth] = useState<number>(today.getMonth() + 1)

  const [dataSource, setDataSource] = useState<SpeechRow[]>(Array.from({ length: 25 }, (_, i) => createRow(i + 1)))
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
  // 格式：序号	姓名	日期	演讲主题	评分
  const parseImportData = (text: string): SpeechRow[] => {
    const lines = text.trim().split('\n').filter(line => line.trim())
    if (lines.length === 0) return []

    const rows: SpeechRow[] = []

    for (const line of lines) {
      // 按制表符分割
      const cells = line.split(/\t/).map(cell => cell.trim())

      // 跳过表头行
      if (cells[0] === '序号' || cells[1] === '姓名') continue

      // 解析序号
      const serialNumber = parseInt(cells[0], 10)
      if (isNaN(serialNumber)) continue

      // 解析姓名
      const name = (cells[1] || '').trim()

      // 解析日期
      const date = normalizeDateText(cells[2] || '')

      // 解析演讲主题
      const topic = (cells[3] || '').trim()

      // 解析评分
      const scoreNum = parseFloat(cells[4] || '')
      const score = isNaN(scoreNum) ? null : scoreNum

      rows.push(createRow(serialNumber, {
        name,
        date,
        topic,
        score,
      }))
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

    setDataSource(parsedRows)
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

  // 拉取班级档案 -> 学生名单（序号+姓名）
  const fetchRoster = async (campus: string, klass: string): Promise<Array<{ 序号: number; 姓名: string }>> => {
    try {
      const res = await fetch(buildApiUrl(`/teaching-quality/class-file?campus=${encodeURIComponent(campus)}&class=${encodeURIComponent(klass)}`))
      if (!res.ok) throw new Error('读取班级档案失败')
      const cf = (await res.json()) as ClassFileList
      return (cf.行列表 || [])
        .map((r, idx) => ({ 序号: Number(r.serialNumber ?? idx + 1), 姓名: (r.name || '').trim() }))
        .filter((r) => !!r.姓名)
        .sort((a, b) => a.序号 - b.序号)
    } catch (e) {
      console.warn('未能读取班级档案名单', e)
      return []
    }
  }

  const loadData = async (campus: string, klass: string, y: number, m: number) => {
    setLoading(true)
    try {
      const [roster, resScore] = await Promise.all([
        fetchRoster(campus, klass),
        fetch(buildApiUrl(`/teaching-quality/speech-score?campus=${encodeURIComponent(campus)}&class=${encodeURIComponent(klass)}&year=${y}&month=${m}`)),
      ])

      let apiRows: ApiRow[] = []
      if (resScore.ok) {
        const data = (await resScore.json()) as ApiList
        apiRows = data.行列表 || []
      } else {
        console.warn('读取演讲评分失败：', await resScore.text())
      }

      const apiMap = new Map<string, ApiRow>()
      apiRows.forEach((r) => apiMap.set(`${r.序号}__${(r.姓名 || '').trim()}`, r))

      let merged: SpeechRow[]
      if (roster.length > 0) {
        merged = roster.map((r) => {
          const hit = apiMap.get(`${r.序号}__${r.姓名}`)
          return createRow(r.序号, {
            name: r.姓名,
            date: hit?.日期?.trim() || '',
            topic: hit?.演讲主题?.trim() || '',
            score: typeof hit?.评分 === 'number' ? hit!.评分! : null,
          })
        })
      } else {
        merged = apiRows.map(fromApiRow)
        if (merged.length === 0) merged = Array.from({ length: 25 }, (_, i) => createRow(i + 1))
      }

      setDataSource(merged)
    } catch (e) {
      console.error(e)
      message.warning('未能读取演讲评分表，使用空白行')
      setDataSource(Array.from({ length: 25 }, (_, i) => createRow(i + 1)))
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

  const handleChange = (key: string, field: keyof SpeechRow, value: string | number | null) => {
    setDataSource((prev) => prev.map((row) => (row.key === key ? { ...row, [field]: value } : row)))
  }

  const anyContentFilled = (r: SpeechRow) => !!((r.name && r.name.trim()) || (r.date && r.date.trim()) || (r.topic && r.topic.trim()) || typeof r.score === 'number')

  const columns: ColumnsType<SpeechRow> = [
    { title: '序号', dataIndex: 'serialNumber', key: 'serialNumber', width: 70, align: 'center', fixed: 'left' },
    { title: '姓名', dataIndex: 'name', key: 'name', width: 120, align: 'center', render: (text, record) => (
        <Input value={text} onChange={(e) => handleChange(record.key, 'name', e.target.value)} />
      ) },
    { title: '日期', dataIndex: 'date', key: 'date', width: 160, align: 'center', render: (text, record) => (
        <DatePicker
          format="YYYY-MM-DD"
          value={text ? dayjs(text) : null}
          onChange={(date) => handleChange(record.key, 'date', date ? date.format('YYYY-MM-DD') : '')}
          style={{ width: '100%' }}
        />
      ) },
    { title: '演讲主题', dataIndex: 'topic', key: 'topic', width: 260, align: 'left', render: (text, record) => (
        <Input value={text} onChange={(e) => handleChange(record.key, 'topic', e.target.value)} />
      ) },
    { title: '评分', dataIndex: 'score', key: 'score', width: 120, align: 'center', render: (value, record) => (
        <InputNumber min={0} max={100} style={{ width: '100%' }} value={value as number | null} onChange={(v) => handleChange(record.key, 'score', v ?? null)} />
      ) },
  ]

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={
          <Space>
            <span>班级演讲评分表</span>
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
                const payloadRows = dataSource.filter(anyContentFilled).map((r) => toApiRow(r))
                if (payloadRows.length === 0) {
                  message.warning('没有需要保存的数据')
                  return
                }
                try {
                  const res = await fetch(buildApiUrl('/teaching-quality/speech-score'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 神殿名称: selectedCampus, 班级名称: selectedClass, 年份: year, 月份: month, 行列表: payloadRows }),
                  })
                  if (!res.ok) throw new Error(await res.text())
                  const data = (await res.json()) as ApiList
                  const rows = (data.行列表 || []).map(fromApiRow)
                  // 保存后按当前名单映射更新字段
                  setDataSource((prev) => {
                    const byKey = new Map(rows.map((r) => [`${r.serialNumber}__${r.name}`, r]))
                    return prev.map((p) => byKey.get(`${p.serialNumber}__${p.name}`) || p)
                  })
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
        <Table<SpeechRow>
          bordered
          size="small"
          columns={columns}
          dataSource={dataSource}
          pagination={false}
          rowKey="key"
          scroll={{ x: 'max-content' }}
          loading={loading}
        />
      </Card>

      {/* 导入数据弹窗 */}
      <Modal
        title="导入班级演讲评分数据"
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
            请粘贴从Excel或其他表格复制的数据，格式为：序号、姓名、日期、演讲主题、评分（用制表符分隔）
          </p>
          <p style={{ color: '#999', fontSize: 12 }}>
            示例：1	李奕韬	2026.1.1	哈哈	23
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

export default SpeechSheet
