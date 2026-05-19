// XX神殿智慧司标准化检查表
import React, { useState, useMemo, useEffect, useRef } from 'react'
import { App,
  Card,
  Table,
  Button,
  Space,
  Typography,
  DatePicker,
  Checkbox,
  ConfigProvider,
  Select,
  Input,
  Modal,
  Tooltip,
} from 'antd'
import { ReloadOutlined, DownloadOutlined, SaveOutlined, FileExcelOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { Dayjs } from 'dayjs'
import zhCN from 'antd/locale/zh_CN'
import 'dayjs/locale/zh-cn'
import { useCampusStore } from '@/stores/campusStore'
import {
  fetchStandardization,
  fetchStandardizationDates,
  saveStandardization,
} from '@/services/standardizationCheck'
import * as XLSX from 'xlsx'

dayjs.locale('zh-cn')

const { Title } = Typography

const buildEmptyDays = () =>
  Object.fromEntries(
    Array.from({ length: 31 }).map((_, i) => [`day${i + 1}`, false]),
  ) as Record<string, 'ok' | string | false>

const buildAllEnabledDays = () =>
  Object.fromEntries(Array.from({ length: 31 }).map((_, i) => [`day${i + 1}`, true])) as Record<
    string,
    boolean
  >

// 默认检查项目列表（共20项）
const DEFAULT_CHECK_ITEMS = [
  '职业装',
  '课前口号',
  '课前演讲',
  '课堂纪律',
  '按照大纲授课',
  '考试内容与形式',
  '压力面试质量',
  '排课表',
  '项目计划表',
  '作业成绩表',
  '考试成绩表',
  '项目成绩表',
  '压力面试成绩表',
  '薪资预估表',
  '学员满意度调查表',
  '日工单',
  '学术会',
  '每日就业总结会',
  '其他1',
  '其他2',
]

// 数据接口
interface CheckRecord {
  key: string
  serialNumber: number
  item: string
  days: Record<string, 'ok' | string | false> // false=未填；'ok'=对(√)；string=问题/备注
  enabledDays: Record<string, boolean> // 是否需要/允许填写 day1-day31
}

const StandardizationCheckPage: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore()
  const [selectedMonth, setSelectedMonth] = useState<Dayjs>(dayjs())
  const [availableDates, setAvailableDates] = useState<string[]>([])

  const [needDaysModalOpen, setNeedDaysModalOpen] = useState(false)
  const [editingNeedDaysRecordKey, setEditingNeedDaysRecordKey] = useState<string | null>(null)
  const [editingNeedDays, setEditingNeedDays] = useState<Record<string, boolean>>(buildAllEnabledDays())
  const [importLoading, setImportLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const buildInitialRows = (items: string[] = DEFAULT_CHECK_ITEMS) => {
    return items.map((item, index) => {
      const days: Record<string, 'ok' | string | false> = {}
      const enabledDays: Record<string, boolean> = {}
      for (let i = 1; i <= 31; i++) {
        days[`day${i}`] = false
        enabledDays[`day${i}`] = true
      }
      return {
        key: `item-${index + 1}`,
        serialNumber: index + 1,
        item,
        days,
        enabledDays,
      }
    })
  }
  const [dataSource, setDataSource] = useState<CheckRecord[]>(() => buildInitialRows())

  const campusName = currentCampus || '主神殿'

  const addNewItemRow = () => {
    setDataSource((prev) => {
      const nextSerial = prev.length ? Math.max(...prev.map((r) => r.serialNumber)) + 1 : 1
      return [
        ...prev,
        {
          key: `item-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          serialNumber: nextSerial,
          item: '',
          days: buildEmptyDays(),
          enabledDays: buildAllEnabledDays(),
        },
      ]
    })
  }

  const handleItemChange = (recordKey: string, value: string) => {
    setDataSource((prev) =>
      prev.map((record) => (record.key === recordKey ? { ...record, item: value } : record)),
    )
  }

  const openNeedDaysModal = (record: CheckRecord) => {
    setEditingNeedDaysRecordKey(record.key)
    setEditingNeedDays(record.enabledDays || buildAllEnabledDays())
    setNeedDaysModalOpen(true)
  }

  const setAllNeedDays = (need: boolean) => {
    setEditingNeedDays((prev) => {
      const next: Record<string, boolean> = { ...prev }
      for (let i = 1; i <= 31; i++) next[`day${i}`] = need
      return next
    })
  }

  const toggleNeedDay = (day: number, need: boolean) => {
    setEditingNeedDays((prev) => ({ ...prev, [`day${day}`]: need }))
  }

  const applyNeedDaysToRecord = () => {
    if (!editingNeedDaysRecordKey) return
    setDataSource((prev) =>
      prev.map((r) => {
        if (r.key !== editingNeedDaysRecordKey) return r
        // 当天不需要 => 强制清空当天“完成”勾选，避免保存脏数据
        const nextDays: Record<string, 'ok' | string | false> = { ...r.days }
        for (let i = 1; i <= 31; i++) {
          const k = `day${i}`
          if (!editingNeedDays[k]) nextDays[k] = false
        }
        return { ...r, enabledDays: { ...editingNeedDays }, days: nextDays }
      }),
    )
    setNeedDaysModalOpen(false)
    setEditingNeedDaysRecordKey(null)
  }

  const loadData = async (date: Dayjs) => {
    try {
      const key = date.format('YYYY-MM-01')
      const res = await fetchStandardization(campusName, key)
      if (res.行数据 && res.行数据.length) {
        setDataSource(
          res.行数据.map((row) => ({
            key: `item-${row.序号}`,
            serialNumber: row.序号,
            item: row.项目名称,
            days: (() => {
              // 先取后端的 问题JSON
              let 问题: Record<string, string> = {}
              const rawProblem = (row as any)?.问题JSON
              if (rawProblem) {
                try {
                  问题 = JSON.parse(rawProblem)
                } catch {
                  问题 = {}
                }
              }

              // day1~day31 仍然是 bool（对=√）
              return Object.fromEntries(
                Array.from({ length: 31 }).map((_, i) => {
                  const k = `day${i + 1}`
                  const prob = 问题?.[k]
                  if (typeof prob === 'string' && prob.trim() !== '') return [k, prob]

                  const v = (row as any)?.[k]
                  return [k, v ? 'ok' : false]
                }),
              ) as Record<string, 'ok' | string | false>
            })(),
            enabledDays: (() => {
              // 后端优先使用 JSON 字段：需要日期JSON
              // 支持两种格式：
              // 1) "{\"day1\":true,...}"  (推荐)
              // 2) "[1,2,3]" 或 "[\"day1\",\"day2\"]" (兼容)
              const raw = (row as any)?.需要日期JSON
              const all = buildAllEnabledDays()
              if (!raw) return all
              try {
                const parsed = JSON.parse(raw)
                // 形如 { day1: true, day2: false }
                if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                  return { ...all, ...parsed }
                }
                // 形如 [1,2,3] 或 ["day1","day2"]
                if (Array.isArray(parsed)) {
                  const none = Object.fromEntries(
                    Array.from({ length: 31 }).map((_, i) => [`day${i + 1}`, false]),
                  ) as Record<string, boolean>
                  parsed.forEach((v) => {
                    const key = typeof v === 'number' ? `day${v}` : String(v)
                    if (key in none) none[key] = true
                  })
                  return none
                }
                return all
              } catch {
                return all
              }
            })(),
          })),
        )
        setAvailableDates((prev) =>
          prev.includes(key) ? prev : [...prev, key].sort((a, b) => (a > b ? 1 : -1)),
        )
      } else {
        // 没有历史数据时，按默认项目初始化
        setDataSource(buildInitialRows())
      }
    } catch (error) {
      console.error('加载标准化数据失败', error)
      message.error('加载失败')
    }
  }

  useEffect(() => {
    const loadDates = async () => {
      try {
        const res = await fetchStandardizationDates(campusName)
        if (res.日期列表?.length) {
          setAvailableDates(res.日期列表.map((d) => dayjs(d).format('YYYY-MM-01')))
        }
      } catch (error) {
        console.error('加载日期列表失败', error)
      }
    }
    loadDates()
  }, [campusName])

  useEffect(() => {
    loadData(selectedMonth)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campusName, selectedMonth])

  const handleMonthChange = (date: Dayjs | null) => {
    if (date) {
      setSelectedMonth(date)
      loadData(date)
    }
  }

  const toggleDayStatus = (recordKey: string, day: string) => {
    setDataSource((prev) =>
      prev.map((record) => {
        if (record.key !== recordKey) return record
        
        const current = record.days[day]
        let next: 'ok' | string | false
        
        // 状态循环：未填 -> 打勾 -> 可输入问题
        if (current === false) next = 'ok'
        else if (current === 'ok') next = ''
        else next = false
        
        return {
          ...record,
          days: { ...record.days, [day]: next },
        }
      }),
    )
  }
  
  const handleDayTextChange = (recordKey: string, day: string, text: string) => {
    setDataSource((prev) =>
      prev.map((record) =>
        record.key === recordKey 
          ? { ...record, days: { ...record.days, [day]: text } } 
          : record
      ),
    )
  }

  // 生成列配置
  const columns: ColumnsType<CheckRecord> = useMemo(() => {
    const baseColumns: ColumnsType<CheckRecord> = [
      {
        title: '序号',
        dataIndex: 'serialNumber',
        key: 'serialNumber',
        width: 60,
        align: 'center',
        fixed: 'left',
      },
      {
        title: (
          <Space size={6}>
            <span>项目</span>
            <Button size="small" type="link" onClick={addNewItemRow}>
              +新增
            </Button>
          </Space>
        ),
        dataIndex: 'item',
        key: 'item',
        width: 220,
        align: 'center',
        fixed: 'left',
        render: (value, record) => (
          <Space direction="vertical" size={6} style={{ width: '100%' }}>
            <Input
              value={value}
              placeholder="请输入项目"
              onChange={(e) => handleItemChange(record.key, e.target.value)}
            />
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Tooltip title="设置该项目哪些日期需要检查；未选择的日期将不可勾选完成">
                <Button size="small" onClick={() => openNeedDaysModal(record)}>
                  设置需要日期
                </Button>
              </Tooltip>
            </div>
          </Space>
        ),
      },
    ]

    // 动态生成1-31日的列
    const daysInMonth = selectedMonth.daysInMonth()
    for (let day = 1; day <= 31; day++) {
      baseColumns.push({
        title: String(day),
        key: `day${day}`,
        width: 50,
        align: 'center',
        render: (_, record) => {
          const k = `day${day}`
          const cell = record.days?.[k]
          const disabled =
            day > daysInMonth ||
            (record.enabledDays ? !record.enabledDays[k] : false)

          const isOk = cell === 'ok'
          const isText = typeof cell === 'string' && cell !== 'ok'

          // 交互：点一下=对(√)；再点一下=输入问题；再点一下=清空
          return (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              {isText ? (
                <Input.TextArea
                  autoSize={{ minRows: 1, maxRows: 4 }}
                  size="small"
                  style={{ minWidth: 80 }}
                  autoFocus
                  disabled={disabled}
                  value={cell}
                  placeholder="问题"
                  onChange={(e) => handleDayTextChange(record.key, k, e.target.value)}
                  onBlur={() => {
                    const v = String(record.days?.[k] ?? '')
                    if (v.trim() === '') {
                      // 空问题 => 回到未填
                      setDataSource((prev) =>
                        prev.map((r) =>
                          r.key === record.key ? { ...r, days: { ...r.days, [k]: false } } : r,
                        ),
                      )
                    }
                  }}
                />
              ) : (
                <Button
                  size="small"
                  disabled={disabled}
                  style={{ width: 46, padding: 0 }}
                  onClick={() => toggleDayStatus(record.key, k)}
                >
                  {isOk ? '√' : ''}
                </Button>
              )}
            </div>
          )
        },
      })
    }

    return baseColumns
  }, [selectedMonth, dataSource])

  // 刷新数据
  const handleRefresh = () => {
    loadData(selectedMonth)
    message.success('数据已刷新')
  }

  const handleSave = async () => {
    try {
      const payloadRows = dataSource.map((record) => {
        // 处理问题JSON
        const 问题JSON: Record<string, string> = {}
        const days: Record<string, boolean> = {}
        
        // 分离问题文本和勾选状态
        Object.entries(record.days).forEach(([key, value]) => {
          if (typeof value === 'string' && value !== 'ok') {
            问题JSON[key] = value // 保存问题文本
            days[key] = false     // 有问题时，对应天不勾选
          } else {
            days[key] = value === 'ok' // 转换为布尔值
          }
        })
        
        return {
          序号: record.serialNumber,
          项目名称: record.item,
          日期: selectedMonth.startOf('month').format('YYYY-MM-DD'),
          需要日期JSON: JSON.stringify(record.enabledDays || buildAllEnabledDays()),
          问题JSON: Object.keys(问题JSON).length > 0 ? JSON.stringify(问题JSON) : null,
          ...days,
        }
      })
      const monthKey = selectedMonth.startOf('month').format('YYYY-MM-DD')
      await saveStandardization(campusName, monthKey, payloadRows)
      const normalized = selectedMonth.startOf('month').format('YYYY-MM-01')
      setAvailableDates((prev) =>
        prev.includes(normalized) ? prev : [...prev, normalized].sort((a, b) => (a > b ? 1 : -1)),
      )
      message.success('保存成功')
    } catch (error) {
      console.error('保存失败', error)
      message.error('保存失败')
    }
  }

  // 导出数据
  const handleExport = () => {
    message.info('导出功能开发中...')
  }

  /**
   * 解析Excel文件中的标准化检查数据
   */
  const parseExcelData = (data: any[][]): CheckRecord[] => {
    console.log('[Excel导入] 开始解析数据，总行数:', data.length)

    if (data.length < 2) {
      throw new Error('Excel数据行数不足，请确保包含表头和数据行')
    }

    // 1. 找到表头行（包含"序号"和"项目"的行）
    let headerRowIndex = -1
    let serialColIndex = -1
    let itemColIndex = -1
    const dayColumns: { day: number; colIndex: number }[] = []

    for (let i = 0; i < Math.min(10, data.length); i++) {
      const row = data[i]
      const rowStr = row.map((c) => String(c || '').trim())

      // 查找序号列
      if (serialColIndex < 0) {
        for (let j = 0; j < rowStr.length; j++) {
          if (rowStr[j].includes('序号') || rowStr[j] === '序号') {
            serialColIndex = j
            break
          }
        }
      }

      // 查找项目列
      if (itemColIndex < 0) {
        for (let j = 0; j < rowStr.length; j++) {
          if (rowStr[j].includes('项目') || rowStr[j] === '项目') {
            itemColIndex = j
            break
          }
        }
      }

      // 查找日期列（1-31）
      const dayMatches: { day: number; colIndex: number }[] = []
      for (let j = 0; j < rowStr.length; j++) {
        const cell = rowStr[j]
        // 匹配纯数字（1-31）或"1日"、"1号"等格式
        const dayMatch = cell.match(/^(\d{1,2})(?:[日号])?$/)
        if (dayMatch) {
          const dayNum = parseInt(dayMatch[1], 10)
          if (dayNum >= 1 && dayNum <= 31) {
            dayMatches.push({ day: dayNum, colIndex: j })
          }
        }
      }

      // 如果找到序号、项目列，且至少有3个日期列，认为是表头行
      if (serialColIndex >= 0 && itemColIndex >= 0 && dayMatches.length >= 3) {
        headerRowIndex = i
        dayColumns.push(...dayMatches)
        console.log('[Excel导入] 找到表头行:', i, '日期列数:', dayMatches.length)
        break
      }
    }

    // 如果没找到，尝试备用方案
    if (headerRowIndex < 0) {
      for (let i = 0; i < Math.min(10, data.length); i++) {
        const row = data[i]
        for (let j = 0; j < row.length; j++) {
          const cell = String(row[j] || '').trim()
          if (cell.includes('序号') && serialColIndex < 0) {
            serialColIndex = j
          }
          if (cell.includes('项目') && itemColIndex < 0) {
            itemColIndex = j
          }
          if (serialColIndex >= 0 && itemColIndex >= 0) {
            headerRowIndex = i
            break
          }
        }
        if (headerRowIndex >= 0) break
      }
    }

    // 默认列索引
    if (serialColIndex < 0) serialColIndex = 0
    if (itemColIndex < 0) itemColIndex = 1

    if (headerRowIndex < 0) {
      throw new Error('无法找到表头行，请确保Excel包含"序号"和"项目"列')
    }

    // 如果日期列未识别，尝试从表头行之后识别
    if (dayColumns.length === 0) {
      const headerRow = data[headerRowIndex]
      for (let j = itemColIndex + 1; j < headerRow.length; j++) {
        const cell = String(headerRow[j] || '').trim()
        const dayMatch = cell.match(/^(\d{1,2})(?:[日号])?$/)
        if (dayMatch) {
          const dayNum = parseInt(dayMatch[1], 10)
          if (dayNum >= 1 && dayNum <= 31) {
            dayColumns.push({ day: dayNum, colIndex: j })
          }
        }
      }
    }

    console.log('[Excel导入] 序号列:', serialColIndex, '项目列:', itemColIndex, '日期列:', dayColumns.length)

    // 2. 解析数据行
    const records: CheckRecord[] = []
    const dataStartRow = headerRowIndex + 1

    for (let i = dataStartRow; i < data.length; i++) {
      const row = data[i]
      if (!row || row.length === 0) continue

      // 跳过空行和合计行
      const firstCell = String(row[0] || '').trim()
      const serialCell = String(row[serialColIndex] || '').trim()

      if (!firstCell && !serialCell) continue
      if (firstCell === '合计' || firstCell === '总计' || serialCell === '合计' || serialCell === '总计') {
        continue
      }

      const serialNumber = parseInt(serialCell, 10)
      const item = String(row[itemColIndex] || '').trim()

      // 如果没有序号和项目，跳过
      if (!serialNumber && !item) continue

      if (!item) {
        console.log('[Excel导入] 跳过空项目行:', i + 1, '序号:', serialNumber)
        continue
      }

      // 构建日期数据
      const days: Record<string, 'ok' | string | false> = {}
      const enabledDays: Record<string, boolean> = {}

      // 初始化所有日期
      for (let d = 1; d <= 31; d++) {
        days[`day${d}`] = false
        enabledDays[`day${d}`] = true
      }

      // 如果有日期列配置，按配置解析
      if (dayColumns.length > 0) {
        dayColumns.forEach((dc) => {
          const cell = String(row[dc.colIndex] || '').trim()
          const dayKey = `day${dc.day}`

          // 检查是否包含√、对、是等标记，或者非空字符串
          if (cell && (cell.includes('√') || cell.includes('对') || cell.includes('是') || cell === '1' || cell === 'true')) {
            days[dayKey] = 'ok'
          } else if (cell && cell.trim() !== '') {
            // 其他文本作为问题/备注
            days[dayKey] = cell
          } else {
            days[dayKey] = false
          }
        })
      } else {
        // 备用方案：从项目列之后按顺序解析（假设每列对应一天）
        const startCol = itemColIndex + 1
        for (let col = startCol; col < row.length && col < startCol + 31; col++) {
          const day = col - startCol + 1
          const cell = String(row[col] || '').trim()
          const dayKey = `day${day}`

          if (cell && (cell.includes('√') || cell.includes('对') || cell.includes('是') || cell === '1' || cell === 'true')) {
            days[dayKey] = 'ok'
          } else if (cell && cell.trim() !== '') {
            days[dayKey] = cell
          } else {
            days[dayKey] = false
          }
        }
      }

      records.push({
        key: `excel-${i}-${Date.now()}`,
        serialNumber: serialNumber || records.length + 1,
        item,
        days,
        enabledDays,
      })

      console.log('[Excel导入] 解析记录:', records.length, item, '有数据的日期:', Object.keys(days).filter(d => days[d] !== false).length)
    }

    if (records.length === 0) {
      throw new Error('未能解析出有效的检查记录，请检查数据格式')
    }

    console.log('[Excel导入] 解析完成，记录数:', records.length)
    return records
  }

  /**
   * 处理Excel文件上传
   */
  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    console.log('[Excel导入] 开始处理文件:', file.name)

    try {
      setImportLoading(true)
      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: 'array' })

      console.log('[Excel导入] 工作簿包含', workbook.SheetNames.length, '个Sheet:', workbook.SheetNames.join(', '))

      // 读取第一个Sheet
      const firstSheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[firstSheetName]
      const data = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: '' })

      const records = parseExcelData(data)

      if (records.length === 0) {
        message.warning('未能从Excel中解析出有效的检查数据')
        return
      }

      // 直接替换数据源
      records.forEach((record, index) => {
        record.serialNumber = index + 1
      })

      setDataSource(records)
      message.success(`成功导入 ${records.length} 条记录`)

      // 重置文件输入
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error: any) {
      console.error('[Excel导入] 解析失败:', error)
      message.error(`Excel导入失败：${error.message || '数据格式不正确'}`)
    } finally {
      setImportLoading(false)
    }
  }

  return (
    <ConfigProvider locale={zhCN}>
      <div style={{ padding: 24 }}>
        <Card>
          <Modal
            title="设置需要日期"
            open={needDaysModalOpen}
            onCancel={() => {
              setNeedDaysModalOpen(false)
              setEditingNeedDaysRecordKey(null)
            }}
            onOk={applyNeedDaysToRecord}
            okText="确定"
            cancelText="取消"
            width={720}
          >
            <Space wrap style={{ marginBottom: 12 }}>
              <Button onClick={() => setAllNeedDays(true)}>全需要</Button>
              <Button danger onClick={() => setAllNeedDays(false)}>
                全不需要
              </Button>
            </Space>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {Array.from({ length: selectedMonth.daysInMonth() }).map((_, i) => {
                const day = i + 1
                return (
                  <Checkbox
                    key={day}
                    checked={Boolean(editingNeedDays[`day${day}`])}
                    onChange={(e) => toggleNeedDay(day, e.target.checked)}
                  >
                    {day}日
                  </Checkbox>
                )
              })}
            </div>
          </Modal>
          <div style={{ marginBottom: 16 }}>
            <Title level={4} style={{ marginBottom: 16 }}>
              {campusName}智慧司标准化检查表
            </Title>
            <Space style={{ marginBottom: 16 }}>
              <DatePicker
                picker="month"
                value={selectedMonth}
                onChange={handleMonthChange}
                allowClear={false}
                format="YYYY年MM月"
              />
              <Select
                placeholder="已有月份"
                style={{ width: 160 }}
                value={
                  availableDates.includes(selectedMonth.startOf('month').format('YYYY-MM-01'))
                    ? selectedMonth.startOf('month').format('YYYY-MM-01')
                    : undefined
                }
                onChange={(value) => setSelectedMonth(dayjs(value))}
                allowClear
              >
                {availableDates.map((d) => (
                  <Select.Option key={d} value={d}>
                    {dayjs(d).format('YYYY年MM月')}
                  </Select.Option>
                ))}
              </Select>
              <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
                刷新
              </Button>
              <Button icon={<SaveOutlined />} type="primary" onClick={handleSave}>
                保存
              </Button>
              <Button icon={<DownloadOutlined />} onClick={handleExport}>
                导出
              </Button>
              <Button
                icon={<FileExcelOutlined />}
                onClick={() => fileInputRef.current?.click()}
                loading={importLoading}
              >
                从Excel导入
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                style={{ display: 'none' }}
                onChange={handleExcelUpload}
              />
            </Space>
          </div>

          <Table<CheckRecord>
            columns={columns}
            dataSource={dataSource}
            pagination={false}
            scroll={{ x: 'max-content' }}
            bordered
            size="small"
            rowKey="key"
          />
        </Card>
      </div>
    </ConfigProvider>
  )
}

export default StandardizationCheckPage
