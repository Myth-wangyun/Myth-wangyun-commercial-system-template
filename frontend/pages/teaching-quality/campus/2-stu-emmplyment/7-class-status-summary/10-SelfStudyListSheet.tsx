// 自习签到表 · SelfStudyListSheet（按班级+年月）
// 新增：班级/年份/月选择、刷新/保存；按班级档案渲染等量行；
// 日期部分：根据选择的"年份、月份"自动生成该月全部日期的 M.DD 文本；
// 交互：单击空白置"√"、再点清空，可继续输入文字；输入框宽度适配两个字。

import React, { useEffect, useMemo, useState } from 'react'
import { App, Card, Table, Input, Select, Button, Space, Modal } from 'antd'
import { ImportOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { buildApiUrl } from '@/utils/apiBase'
import { useCampusStore } from '@/stores/campusStore'

interface SelfStudyRow {
  key: string
  serialNumber: number
  name: string
  slots: Record<string, string | null>
}

// 后端 API（中文键名）
interface ApiRow {
  序号: number
  姓名: string
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

const slotKey = (index: number, type: 'arrive' | 'leave') => `slot-${index}-${type}`

const createEmptyRow = (serial: number, overrides: Partial<SelfStudyRow> = {}): SelfStudyRow => ({
  key: String(serial),
  serialNumber: serial,
  name: '',
  slots: {},
  ...overrides,
})

const fromApiRow = (r: ApiRow): SelfStudyRow => ({
  key: `${r.序号}__${r.姓名}`,
  serialNumber: r.序号,
  name: (r.姓名 || '').trim(),
  slots: r.slots || {},
})

const toApiRow = (r: SelfStudyRow): ApiRow => ({
  序号: r.serialNumber,
  姓名: r.name,
  slots: r.slots || {},
})

const SelfStudyListSheet: React.FC = () => {
  const { message } = App.useApp()
  const today = new Date()
  const currentCampus = useCampusStore((state) => state.currentCampus)

  const [classes, setClasses] = useState<Array<{ label: string; value: string }>>([])
  const [selectedCampus, setSelectedCampus] = useState<string>('')
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [year, setYear] = useState<number>(today.getFullYear())
  const [month, setMonth] = useState<number>(today.getMonth() + 1)

  const [dataSource, setDataSource] = useState<SelfStudyRow[]>([])
  const [loading, setLoading] = useState<boolean>(false)

  // 导入数据相关状态
  const [importModalVisible, setImportModalVisible] = useState<boolean>(false)
  const [importText, setImportText] = useState<string>('')

  // 解析Excel复制的TSV数据（支持带引号的多行单元格）
  const parseTsvWithQuotes = (text: string): string[][] => {
    const result: string[][] = []
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
            result.push(currentRow)
          }
          currentRow = []
          currentCell = ''
          i += (char === '\r' && nextChar === '\n') ? 2 : 1
        } else if (char === '\r') {
          currentRow.push(currentCell)
          if (currentRow.some(cell => cell.trim())) {
            result.push(currentRow)
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
        result.push(currentRow)
      }
    }

    return result
  }

  // 解析导入的签到数据
  // 格式：序号	姓名	1日到	1日退	2日到	2日退	...（每天两列：到/退）
  const parseImportData = (text: string): SelfStudyRow[] => {
    const parsedRows = parseTsvWithQuotes(text)
    if (parsedRows.length === 0) return []

    const result: SelfStudyRow[] = []

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

      // 解析签到数据：从第3列开始，每两列为一天（到/退）
      const slots: Record<string, string | null> = {}
      let dayIndex = 1 // 从1号开始

      for (let i = 2; i < cells.length; i += 2) {
        const arriveValue = (cells[i] || '').trim()
        const leaveValue = (cells[i + 1] || '').trim()

        if (dayIndex <= 31) {
          const kArrive = slotKey(dayIndex, 'arrive')
          const kLeave = slotKey(dayIndex, 'leave')

          // 转换数字1为√
          if (arriveValue) {
            slots[kArrive] = arriveValue === '1' ? '√' : arriveValue
          }
          if (leaveValue) {
            slots[kLeave] = leaveValue === '1' ? '√' : leaveValue
          }
        }
        dayIndex++
      }

      result.push(createEmptyRow(serialNumber, {
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

    setDataSource(parsedRows)
    setImportModalVisible(false)
    setImportText('')
    message.success(`成功导入 ${parsedRows.length} 条数据`)
  }

  // 根据选择的年/月自动生成日期标签（M.DD），包含该月的全部日期
  const slotLabels: string[] = useMemo(() => {
    const daysInMonth = new Date(year, month, 0).getDate()
    return Array.from({ length: daysInMonth }, (_, i) => {
      const d = i + 1
      return `${month}.${String(d).padStart(2, '0')}`
    })
  }, [year, month])

  // 动态计算该月的天数，用于生成列
  const slotCount = slotLabels.length

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
      const [roster, resSignin] = await Promise.all([
        fetchRoster(campus, klass),
        fetch(buildApiUrl(`/teaching-quality/self-study-signin?campus=${encodeURIComponent(campus)}&class=${encodeURIComponent(klass)}&year=${y}&month=${m}`)),
      ])

      let apiRows: ApiRow[] = []
      if (resSignin.ok) {
        const data = (await resSignin.json()) as ApiList
        apiRows = data.行列表 || []
      } else {
        console.warn('读取自习签到失败：', await resSignin.text())
      }

      const apiMap = new Map<string, ApiRow>()
      apiRows.forEach((r) => apiMap.set(`${r.序号}__${(r.姓名 || '').trim()}`, r))

      let merged: SelfStudyRow[]
      if (roster.length > 0) {
        merged = roster.map((r) => {
          const hit = apiMap.get(`${r.序号}__${r.姓名}`)
          return createEmptyRow(r.序号, { name: r.姓名, slots: hit?.slots || {} })
        })
      } else {
        merged = apiRows.map(fromApiRow)
        if (merged.length === 0) {
          merged = Array.from({ length: 15 }, (_, i) => createEmptyRow(i + 1))
        }
      }

      setDataSource(merged)
    } catch (e) {
      console.error(e)
      message.warning('未能读取自习签到表')
      setDataSource(Array.from({ length: 15 }, (_, i) => createEmptyRow(i + 1)))
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

  const handleNameChange = (key: string, value: string) => {
    setDataSource((prev) => prev.map((row) => (row.key === key ? { ...row, name: value } : row)))
  }

  const handleSlotChange = (key: string, slotKeyStr: string, value: string) => {
    setDataSource((prev) =>
      prev.map((row) => (row.key === key ? { ...row, slots: { ...(row.slots || {}), [slotKeyStr]: value || null } } : row)),
    )
  }

  // 出勤状态选项
  const attendanceOptions = [
    { label: '√', value: '√' },
    { label: '迟到', value: '迟到' },
    { label: '早退', value: '早退' },
    { label: '请假', value: '请假' },
    { label: '旷课', value: '旷课' },
  ]

  // 一键签到：将当天所有学生的到/退都标记为"√"
  const handleOneClickCheckIn = () => {
    if (!selectedCampus || !selectedClass) {
      message.warning('请先选择班级')
      return
    }
    if (dataSource.length === 0) {
      message.warning('暂无学生数据')
      return
    }
    const todayDay = today.getDate()
    const todayMonth = today.getMonth() + 1
    const todayYear = today.getFullYear()
    
    // 只有当前选择的年月与今天一致时，才使用今天的日期；否则默认签到当月1号
    const targetDay = (year === todayYear && month === todayMonth) ? todayDay : 1
    
    const arriveKey = slotKey(targetDay, 'arrive')
    const leaveKey = slotKey(targetDay, 'leave')
    
    setDataSource((prev) => prev.map((r) => ({
      ...r,
      slots: {
        ...(r.slots || {}),
        [arriveKey]: '√',
        [leaveKey]: '√',
      },
    })))
    message.success(`已为全部学生签到 ${month}.${String(targetDay).padStart(2, '0')} 的到/退`)
  }

  const anyContentFilled = (r: SelfStudyRow) => Object.values(r.slots || {}).some((v) => !!v)

  const columns: ColumnsType<SelfStudyRow> = useMemo(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return [
      {
        title: '姓名',
        dataIndex: 'name',
        key: 'name',
        width: 120,
        fixed: 'left',
        align: 'center',
        render: (text, record) => (
          <Input value={text} onChange={(e) => handleNameChange(record.key, e.target.value)} />
        ),
      },
      {
        title: '时间',
        children: Array.from({ length: slotCount }, (_, idx) => {
          const index = idx + 1
          const label = slotLabels[idx]
          return {
            title: <span style={{ display: 'inline-block', width: 80, textAlign: 'center' }}>{label}</span>,
            children: [
              {
                title: '到',
                key: slotKey(index, 'arrive'),
                width: 120,
                align: 'center' as const,
                render: (_: unknown, record: SelfStudyRow) => {
                  const k = slotKey(index, 'arrive')
                  const v = (record.slots || {})[k] || ''
                  return (
                    <Select
                      value={v || undefined}
                      placeholder="选择"
                      onChange={(value) => handleSlotChange(record.key, k, value)}
                      allowClear
                      options={attendanceOptions}
                      style={{ width: '100%' }}
                      size="small"
                    />
                  )
                },
              },
              {
                title: '退',
                key: slotKey(index, 'leave'),
                width: 120,
                align: 'center' as const,
                render: (_: unknown, record: SelfStudyRow) => {
                  const k = slotKey(index, 'leave')
                  const v = (record.slots || {})[k] || ''
                  return (
                    <Select
                      value={v || undefined}
                      placeholder="选择"
                      onChange={(value) => handleSlotChange(record.key, k, value)}
                      allowClear
                      options={attendanceOptions}
                      style={{ width: '100%' }}
                      size="small"
                    />
                  )
                },
              },
            ],
          }
        }),
      },
    ]
  }, [slotLabels, slotCount])

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={
          <Space>
            <span>自习签到表</span>
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
                const payloadRows: ApiRow[] = dataSource
                  .filter((r) => anyContentFilled(r))
                  .map((r) => toApiRow(r))
                if (payloadRows.length === 0) {
                  message.warning('没有需要保存的数据')
                  return
                }
                try {
                  const res = await fetch(buildApiUrl('/teaching-quality/self-study-signin'), {
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
        <Table<SelfStudyRow>
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
        title="导入自习签到数据"
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
            请粘贴从Excel或其他表格复制的数据，格式为：序号、姓名、然后是每天的到/退签到状态（每天两列）
          </p>
          <p style={{ color: '#999', fontSize: 12 }}>
            示例：1	陀锦旗	√	√	√	迟到	...（第1天到、第1天退、第2天到、第2天退...）
          </p>
          <p style={{ color: '#999', fontSize: 12 }}>
            签到状态可以是：√、1（签到）、迟到、请假、空白（未签到）等
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

export default SelfStudyListSheet
