// 晚自习出勤表 · EveningSelfStudyAttendanceSheet（按班级+年月）
// 变更：去掉"日期"列；表头显示当月全部日期（每列含"上/下"两个半天）。
// 支持：选择班级/年月、自动带出班级档案名单并回填当月出勤、刷新与保存；单击空白置"√"、再点清空。

import React, { useEffect, useMemo, useState } from 'react'
import { App, Card, Table, Input, Select, Button, Space, Modal } from 'antd'
import { ImportOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { buildApiUrl } from '@/utils/apiBase'
import { useCampusStore } from '@/stores/campusStore'

interface Row {
  key: string
  serialNumber: number
  name: string
  dateRemark: string
  slots: Record<string, string | null>
}

// API 类型（中文键名）
interface ApiRow {
  序号: number
  姓名: string
  日期备注?: string | null
  slots: Record<string, string | null>
}

interface ApiList {
  神殿名称?: string | null
  班级名称: string
  年份: number
  月份: number
  行列表: ApiRow[]
}

interface ClassListItem { 班级名称: string; 神殿: string }
interface ClassFileRow { serialNumber?: number; name?: string }
interface ClassFileList { 行列表: ClassFileRow[] }

// key 方案：保存时使用全日期键（YYYY-MM-DD-am/pm）；
// 为兼容历史数据（API读取返回 M.DD-am/pm），显示时优先取全日期键，其次取 M.DD 键。
const fullKey = (y: number, m: number, d: number, half: 'am' | 'pm') => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}-${half}`
const mdKey = (m: number, d: number, half: 'am' | 'pm') => `${m}.${String(d).padStart(2, '0')}-${half}`

const createRow = (serial: number, overrides: Partial<Row> = {}): Row => ({
  key: String(serial),
  serialNumber: serial,
  name: '',
  dateRemark: '',
  slots: {},
  ...overrides,
})

const fromApiRow = (r: ApiRow): Row => ({
  key: `${r.序号}__${r.姓名}`,
  serialNumber: r.序号,
  name: (r.姓名 || '').trim(),
  dateRemark: (r.日期备注 || '').trim(),
  slots: r.slots || {},
})

const toApiRow = (r: Row): ApiRow => ({
  序号: r.serialNumber,
  姓名: r.name,
  日期备注: r.dateRemark || undefined,
  slots: r.slots || {},
})

const EveningSelfStudyAttendanceSheet: React.FC = () => {
  const { message } = App.useApp()
  const today = new Date()
  const currentCampus = useCampusStore((state) => state.currentCampus)
  
  const [classes, setClasses] = useState<Array<{ label: string; value: string }>>([])
  const [selectedCampus, setSelectedCampus] = useState<string>('')
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [year, setYear] = useState<number>(today.getFullYear())
  const [month, setMonth] = useState<number>(today.getMonth() + 1)

  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState<boolean>(false)

  // 导入数据相关状态
  const [importModalVisible, setImportModalVisible] = useState<boolean>(false)
  const [importText, setImportText] = useState<string>('')

  // 解析Excel复制的TSV数据（支持带引号的多行单元格）
  const parseTsvWithQuotes = (text: string): string[][] => {
    const rows: string[][] = []
    let currentRow: string[] = []
    let currentCell = ''
    let inQuotes = false
    let i = 0

    while (i < text.length) {
      const char = text[i]
      const nextChar = text[i + 1]

      if (inQuotes) {
        if (char === '"') {
          if (nextChar === '"') {
            currentCell += '"'
            i += 2
          } else {
            inQuotes = false
            i++
          }
        } else {
          currentCell += char
          i++
        }
      } else {
        if (char === '"') {
          inQuotes = true
          i++
        } else if (char === '\t') {
          currentRow.push(currentCell)
          currentCell = ''
          i++
        } else if (char === '\n' || (char === '\r' && nextChar === '\n')) {
          currentRow.push(currentCell)
          if (currentRow.some(cell => cell.trim())) {
            rows.push(currentRow)
          }
          currentRow = []
          currentCell = ''
          i += (char === '\r' && nextChar === '\n') ? 2 : 1
        } else if (char === '\r') {
          currentRow.push(currentCell)
          if (currentRow.some(cell => cell.trim())) {
            rows.push(currentRow)
          }
          currentRow = []
          currentCell = ''
          i++
        } else {
          currentCell += char
          i++
        }
      }
    }

    if (currentCell || currentRow.length > 0) {
      currentRow.push(currentCell)
      if (currentRow.some(cell => cell.trim())) {
        rows.push(currentRow)
      }
    }

    return rows
  }

  // 解析导入的出勤数据
  // 格式：序号	姓名	1日上	1日下	2日上	2日下	...（每天两列：上/下半场）
  const parseImportData = (text: string): Row[] => {
    const parsedRows = parseTsvWithQuotes(text)
    if (parsedRows.length === 0) return []

    const result: Row[] = []

    for (const cells of parsedRows) {
      // 跳过表头行
      const firstCell = (cells[0] || '').trim()
      if (firstCell === '序号' || firstCell === '编号' || 
          (cells[1] || '').trim() === '姓名') continue

      // 解析序号
      const serialNumber = parseInt(firstCell, 10)
      if (isNaN(serialNumber)) continue

      // 解析姓名
      const name = (cells[1] || '').trim()
      if (!name) continue

      // 解析出勤数据：从第3列开始，每两列为一天（上/下）
      const slots: Record<string, string | null> = {}
      let dayIndex = 1 // 从1号开始

      for (let i = 2; i < cells.length; i += 2) {
        const amValue = (cells[i] || '').trim()
        const pmValue = (cells[i + 1] || '').trim()

        if (dayIndex <= 31) {
          const kFullAm = fullKey(year, month, dayIndex, 'am')
          const kMdAm = mdKey(month, dayIndex, 'am')
          const kFullPm = fullKey(year, month, dayIndex, 'pm')
          const kMdPm = mdKey(month, dayIndex, 'pm')

          if (amValue) {
            slots[kFullAm] = amValue
            slots[kMdAm] = amValue
          }
          if (pmValue) {
            slots[kFullPm] = pmValue
            slots[kMdPm] = pmValue
          }
        }
        dayIndex++
      }

      result.push(createRow(serialNumber, {
        name,
        slots,
      }))
    }

    return result
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

    setRows(parsedRows)
    setImportModalVisible(false)
    setImportText('')
    message.success(`成功导入 ${parsedRows.length} 条数据`)
  }

  // 当月天数（1..N）
  const days = useMemo(() => Array.from({ length: new Date(year, month, 0).getDate() }, (_, i) => i + 1), [year, month])

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

  // 读取并合并：以班级档案名单为准，回填当月已有出勤
  const loadData = async (campus: string, klass: string, y: number, m: number) => {
    setLoading(true)
    try {
      const [roster, resAtt] = await Promise.all([
        fetchRoster(campus, klass),
        fetch(buildApiUrl(`/teaching-quality/evening-self-study-attendance?campus=${encodeURIComponent(campus)}&class=${encodeURIComponent(klass)}&year=${y}&month=${m}`)),
      ])

      let apiRows: ApiRow[] = []
      if (resAtt.ok) {
        const data = (await resAtt.json()) as ApiList
        apiRows = data.行列表 || []
      } else {
        console.warn('读取晚自习出勤失败：', await resAtt.text())
      }

      const apiMap = new Map<string, ApiRow>()
      apiRows.forEach((r) => apiMap.set(`${r.序号}__${(r.姓名 || '').trim()}`, r))

      let merged: Row[]
      if (roster.length > 0) {
        merged = roster.map((r) => {
          const hit = apiMap.get(`${r.序号}__${r.姓名}`)
          return createRow(r.序号, {
            name: r.姓名,
            dateRemark: hit?.日期备注?.trim() || '',
            slots: hit?.slots || {},
          })
        })
      } else {
        merged = apiRows.map(fromApiRow)
      }

      setRows(merged)
    } catch (e) {
      console.error(e)
      message.warning('未能读取晚自习出勤')
      setRows([])
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

  // 更新单元格：设置全日期键，同时为兼容显示，同步设置 M.DD 键
  const updateSlot = (rowKey: string, day: number, half: 'am' | 'pm', value?: string) => {
    const kFull = fullKey(year, month, day, half)
    const kMd = mdKey(month, day, half)
    const v = value ?? ''
    setRows((prev) => prev.map((r) => (
      r.key === rowKey
        ? { ...r, slots: { ...(r.slots || {}), [kFull]: v || null, [kMd]: v || null } }
        : r
    )))
  }

  // 出勤状态选项
  const attendanceOptions = [
    { label: '√', value: '√' },
    { label: '迟到', value: '迟到' },
    { label: '早退', value: '早退' },
    { label: '请假', value: '请假' },
    { label: '旷课', value: '旷课' },
  ]

  // 一键签到：将当天所有学生的上/下半场都标记为"√"
  const handleOneClickCheckIn = () => {
    if (!selectedCampus || !selectedClass) {
      message.warning('请先选择班级')
      return
    }
    if (rows.length === 0) {
      message.warning('暂无学生数据')
      return
    }
    const todayDay = today.getDate()
    const todayMonth = today.getMonth() + 1
    const todayYear = today.getFullYear()
    
    // 只有当前选择的年月与今天一致时，才使用今天的日期；否则默认签到当月1号
    const targetDay = (year === todayYear && month === todayMonth) ? todayDay : 1
    
    setRows((prev) => prev.map((r) => {
      const kFullAm = fullKey(year, month, targetDay, 'am')
      const kMdAm = mdKey(month, targetDay, 'am')
      const kFullPm = fullKey(year, month, targetDay, 'pm')
      const kMdPm = mdKey(month, targetDay, 'pm')
      return {
        ...r,
        slots: {
          ...(r.slots || {}),
          [kFullAm]: '√',
          [kMdAm]: '√',
          [kFullPm]: '√',
          [kMdPm]: '√',
        },
      }
    }))
    message.success(`已为全部学生签到 ${month}.${targetDay} 的上/下半场`)
  }

  const columns: ColumnsType<Row> = [
    { title: '编号', dataIndex: 'serialNumber', key: 'serialNumber', width: 70, fixed: 'left', align: 'center' },
    { title: '姓名', dataIndex: 'name', key: 'name', width: 110, fixed: 'left', align: 'center',
      render: (text, record) => (
        <Input value={text} onChange={(e) => setRows((prev)=>prev.map(r=>r.key===record.key?{...r,name:e.target.value}:r))} />
      )
    },
    {
      title: `${month}月`,
      children: days.map((d) => ({
        title: `${month}.${d}`,
        children: [
          {
            title: '上',
            key: `d-${d}-am`,
            width: 120,
            align: 'center',
            render: (_: unknown, record: Row) => {
              const kF = fullKey(year, month, d, 'am')
              const kM = mdKey(month, d, 'am')
              const v = (record.slots || {})[kF] ?? (record.slots || {})[kM] ?? ''
              return (
                <Select
                  value={v || undefined}
                  placeholder="选择"
                  onChange={(value) => updateSlot(record.key, d, 'am', value)}
                  allowClear
                  options={attendanceOptions}
                  style={{ width: '100%' }}
                  size="small"
                />
              )
            },
          },
          {
            title: '下',
            key: `d-${d}-pm`,
            width: 120,
            align: 'center',
            render: (_: unknown, record: Row) => {
              const kF = fullKey(year, month, d, 'pm')
              const kM = mdKey(month, d, 'pm')
              const v = (record.slots || {})[kF] ?? (record.slots || {})[kM] ?? ''
              return (
                <Select
                  value={v || undefined}
                  placeholder="选择"
                  onChange={(value) => updateSlot(record.key, d, 'pm', value)}
                  allowClear
                  options={attendanceOptions}
                  style={{ width: '100%' }}
                  size="small"
                />
              )
            },
          },
        ],
      })),
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={
          <Space>
            <span>晚自习出勤表</span>
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
            <Button onClick={handleOneClickCheckIn} style={{ backgroundColor: '#52c41a', borderColor: '#52c41a', color: '#fff' }}>
              一键签到
            </Button>
            <Button onClick={() => selectedCampus && selectedClass && loadData(selectedCampus, selectedClass, year, month)}>刷新</Button>
            <Button
              type="primary"
              onClick={async () => {
                if (!selectedCampus || !selectedClass) {
                  message.warning('请先选择班级')
                  return
                }
                const payloadRows = rows
                  .filter((r) => (r.name && r.name.trim()) || (r.dateRemark && r.dateRemark.trim()) || Object.values(r.slots||{}).some(v=>!!v))
                  .map((r) => toApiRow(r))
                if (payloadRows.length === 0) {
                  message.warning('没有需要保存的数据')
                  return
                }
                try {
                  const res = await fetch(buildApiUrl('/teaching-quality/evening-self-study-attendance'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 神殿名称: selectedCampus, 班级名称: selectedClass, 年份: year, 月份: month, 行列表: payloadRows }),
                  })
                  if (!res.ok) throw new Error(await res.text())
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
        <Table<Row>
          bordered
          size="small"
          columns={columns}
          dataSource={rows}
          loading={loading}
          pagination={false}
          rowKey="key"
          scroll={{ x: 'max-content' }}
        />
      </Card>

      {/* 导入数据弹窗 */}
      <Modal
        title="导入晚自习出勤数据"
        open={importModalVisible}
        onOk={handleImport}
        onCancel={() => {
          setImportModalVisible(false)
          setImportText('')
        }}
        okText="导入"
        cancelText="取消"
        width={800}
      >
        <div style={{ marginBottom: 12 }}>
          <p style={{ color: '#666', marginBottom: 8 }}>
            请粘贴从Excel或其他表格复制的数据，格式为：序号、姓名、然后是每天的上/下半场出勤状态（每天两列）
          </p>
          <p style={{ color: '#999', fontSize: 12 }}>
            示例：1	陀锦旗	√	√	√	迟到	...（第1天上、第1天下、第2天上、第2天下...）
          </p>
          <p style={{ color: '#999', fontSize: 12 }}>
            出勤状态可以是：√（出勤）、迟到、请假、空白（未记录）等
          </p>
        </div>
        <Input.TextArea
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          placeholder="在此粘贴数据..."
          rows={14}
          style={{ fontFamily: 'monospace' }}
        />
      </Modal>
    </div>
  )
}

export default EveningSelfStudyAttendanceSheet
