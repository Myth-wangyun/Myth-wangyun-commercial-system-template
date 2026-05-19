// 班级出勤表（单击空白切换 √，其余手写；月份默认当前月且可切换查看/保存）

import React, { useEffect, useMemo, useState, useRef } from 'react'
import { App, Card, Table, Input, Select, Button, Space, Modal } from 'antd'
import { ImportOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { buildApiUrl } from '@/utils/apiBase'
import { useCampusStore } from '@/stores/campusStore'
import * as XLSX from 'xlsx'

type Half = 'am' | 'pm'

interface Row {
  key: string
  序号: number
  name: string
  slots: Record<string, string | null>
}

// 出勤状态选项
const ATTENDANCE_STATUS_OPTIONS = [
  { label: '√', value: '√', title: '正常出勤' },
  { label: '迟到', value: '迟到' },
  { label: '早退', value: '早退' },
  { label: '请假', value: '请假' },
  { label: '旷课', value: '旷课' },
]

// 默认状态值
const DEFAULT_STATUS = '√'

interface ClassListItem { 班级名称: string; 神殿: string }

const ymdHalfKey = (y: number, m: number, d: number, half: Half) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}-${half}`
const halfKeys: Half[] = ['am', 'pm']
const absentMarkers = ['请假', '旷课', '缺勤', '病假', '事假', '早退', '迟到']
const isPresentValue = (value: string | null | undefined) => {
  const text = (value || '').trim()
  if (!text) return false
  if (text === '√') return true
  if (absentMarkers.some((marker) => text.includes(marker))) return false
  return true
}
const formatPercent = (value: number | null | undefined) => (value == null ? '' : `${Math.round(value)}%`)

const AttendanceSheet: React.FC = () => {
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
  
  // Excel 导入相关状态（这些功能暂未实现，预留接口）
  const [importLoading, setImportLoading] = useState(false)
  const [previewModalVisible, setPreviewModalVisible] = useState(false)
  const [previewData, setPreviewData] = useState<Row[]>([])
  const [pasteModalVisible, setPasteModalVisible] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

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
          const kAm = ymdHalfKey(year, month, dayIndex, 'am')
          const kPm = ymdHalfKey(year, month, dayIndex, 'pm')

          // 转换数字1为√
          slots[kAm] = amValue === '1' ? '√' : (amValue || DEFAULT_STATUS)
          slots[kPm] = pmValue === '1' ? '√' : (pmValue || DEFAULT_STATUS)
        }
        dayIndex++
      }

      result.push({
        key: String(serialNumber),
        序号: serialNumber,
        name,
        slots,
      })
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

  const daysInMonth = useMemo(() => {
    const last = new Date(year, month, 0).getDate()
    return Array.from({ length: last }, (_, i) => i + 1)
  }, [year, month])

  // 当月份或年份改变时，为所有空白单元格设置默认值√
  useEffect(() => {
    if (rows.length === 0 || !selectedClass) return
    
    const hasNewSlots = daysInMonth.some((d) => {
      for (const half of halfKeys) {
        const slotKey = ymdHalfKey(year, month, d, half)
        return rows.some((row) => row.slots[slotKey] === undefined)
      }
      return false
    })
    
    if (hasNewSlots) {
      setRows((prevRows) => {
        return prevRows.map((row) => {
          const updatedSlots = { ...row.slots }
          daysInMonth.forEach((d) => {
            halfKeys.forEach((half) => {
              const slotKey = ymdHalfKey(year, month, d, half)
              if (updatedSlots[slotKey] === undefined || updatedSlots[slotKey] === null || updatedSlots[slotKey] === '') {
                updatedSlots[slotKey] = DEFAULT_STATUS
              }
            })
          })
          return { ...row, slots: updatedSlots }
        })
      })
    }
  }, [year, month, daysInMonth, selectedClass])

  const dailyAttendanceRates = useMemo(() => {
    const validRows = rows.filter((r) => r.name && r.name.trim().length > 0)
    const totalPerHalf = validRows.length
    return daysInMonth.map((d) => {
      if (totalPerHalf === 0) return { am: null, pm: null }
      const result: { am: number | null; pm: number | null } = { am: null, pm: null }
      halfKeys.forEach((half) => {
        let present = 0
        let hasAnyValue = false
        validRows.forEach((row) => {
          const key = ymdHalfKey(year, month, d, half)
          const value = (row.slots || {})[key]
          if ((value || '').trim()) hasAnyValue = true
          if (isPresentValue(value)) present += 1
        })
        if (hasAnyValue) {
          result[half] = (present / totalPerHalf) * 100
        }
      })
      return result
    })
  }, [rows, daysInMonth, year, month])

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

  const onSelectClass = async (val: string) => {
    const [campus, klass] = String(val).split('||')
    const campusNorm = (campus || '').trim()
    const classNorm = (klass || '').trim()
    setSelectedCampus(campusNorm)
    setSelectedClass(classNorm)
    await loadAll(campusNorm, classNorm, year, month)
  }

  // 加载档案姓名 + 指定年月的出勤数据
  const loadAll = async (campus: string, klass: string, y: number, m: number) => {
    setLoading(true)
    try {
      const campusNorm = (campus || '').trim()
      const classNorm = (klass || '').trim()

      // 1) 档案 -> 姓名（排除退费、休学、退学的学员）
      let roster: Array<{ 序号: number; name: string }> = []
      try {
        const cfRes = await fetch(buildApiUrl(`/teaching-quality/class-file?campus=${encodeURIComponent(campusNorm)}&class=${encodeURIComponent(classNorm)}`))
        if (!cfRes.ok) throw new Error('读取班级档案失败')
        const cf = (await cfRes.json()) as { 行列表: Array<{ serialNumber?: number; name?: string; studentStatus?: string }> }
        roster = (cf.行列表 || [])
          .map((r, idx) => ({ 
            序号: Number(r.serialNumber ?? idx + 1), 
            name: (r.name || '').trim(),
            studentStatus: (r.studentStatus || '').trim()
          }))
          .filter((r) => {
            // 过滤掉没有姓名的学员
            if (!r.name) return false
            // 过滤掉学员状态为"退费"、"休学"、"退学"的学员
            const status = r.studentStatus
            if (status === '退费' || status === '休学' || status === '退学') {
              return false
            }
            return true
          })
          .map((r) => ({ 序号: r.序号, name: r.name })) // 移除studentStatus字段
          .sort((a, b) => a.序号 - b.序号)
      } catch (e) {
        console.error(e)
        message.warning('未能读取班级档案姓名，列表将为空')
        roster = []
      }

      // 2) 指定年月的出勤（后端支持 month 默认当前月，但这里明确带上）
      let mapSlots: Record<string, Record<string, string | null>> = {}
      try {
        const caRes = await fetch(buildApiUrl(`/teaching-quality/class-attendance?campus=${encodeURIComponent(campusNorm)}&class=${encodeURIComponent(classNorm)}&year=${y}&month=${m}`))
        if (!caRes.ok) throw new Error('读取班级出勤失败')
        const ca = (await caRes.json()) as { 行列表: Array<{ 序号: number; 姓名: string; slots: Record<string, string | null> }> }
        ;(ca.行列表 || []).forEach((r) => {
          mapSlots[`${r.序号}__${(r.姓名 || '').trim()}`] = r.slots || {}
        })
      } catch (e) {
        console.warn('未能读取当月出勤，按空出勤渲染', e)
        mapSlots = {}
      }

      // 计算当月的天数
      const lastDayOfMonth = new Date(y, m, 0).getDate()
      const monthDays = Array.from({ length: lastDayOfMonth }, (_, i) => i + 1)
      
      const merged: Row[] = roster.map((r) => {
        const key = `${r.序号}__${r.name}`
        const slots = mapSlots[key] || {}
        // 对于没有值的slot，默认设置为√
        const processedSlots: Record<string, string | null> = {}
        // 遍历当月的所有日期和上下半天
        for (const d of monthDays) {
          for (const half of halfKeys) {
            const slotKey = ymdHalfKey(y, m, d, half)
            const existingValue = slots[slotKey]
            // 如果已经有值（包括空字符串），使用原有值；否则默认为√
            processedSlots[slotKey] = existingValue !== undefined && existingValue !== null && existingValue !== '' ? existingValue : DEFAULT_STATUS
          }
        }
        // 保留非当月的数据（如果有）
        Object.keys(slots).forEach(k => {
          if (!k.startsWith(`${y}-${String(m).padStart(2, '0')}-`)) {
            processedSlots[k] = slots[k]
          }
        })
        return { key: String(r.序号), 序号: r.序号, name: r.name, slots: processedSlots }
      })

      setRows(merged.length ? merged : [{ key: '1', 序号: 1, name: '', slots: {} }])
    } finally {
      setLoading(false)
    }
  }

  const updateSlot = (rowKey: string, day: number, half: Half, value: string | null) => {
    const key = ymdHalfKey(year, month, day, half)
    // 如果值为空字符串或null，默认为√
    const v = value === null || value === '' ? DEFAULT_STATUS : value
    setRows((prev) => prev.map((r) => (r.key === rowKey ? { ...r, slots: { ...(r.slots || {}), [key]: v } } : r)))
  }

  /**
   * 标准化出勤状态值
   */
  const normalizeAttendanceValue = (value: string | null | undefined): string => {
    if (!value) return DEFAULT_STATUS
    const v = String(value).trim()
    if (!v) return DEFAULT_STATUS
    
    // 标准化映射
    const normalizeMap: Record<string, string> = {
      '√': '√',
      '✓': '√',
      '✔': '√',
      '出勤': '√',
      '正常': '√',
      '到': '√',
      '1': '√',
      '迟到': '迟到',
      '迟': '迟到',
      '早退': '早退',
      '早': '早退',
      '请假': '请假',
      '假': '请假',
      '病假': '请假',
      '事假': '请假',
      '旷课': '旷课',
      '旷': '旷课',
      '缺勤': '旷课',
      '缺': '旷课',
      '0': '旷课',
    }
    
    // 精确匹配
    if (normalizeMap[v]) return normalizeMap[v]
    
    // 模糊匹配
    for (const [key, val] of Object.entries(normalizeMap)) {
      if (v.includes(key)) return val
    }
    
    // 默认返回原值或√
    return v || DEFAULT_STATUS
  }

  /**
   * 解析 Excel 数据
   * 支持的日期格式：
   * - "1号"、"2号"、"1日"、"2日"
   * - "9.1"、"9.2"（月.日格式）
   * - "2025.9.1"（年.月.日格式）
   */
  const parseExcelData = (data: any[][]): Row[] => {
    if (data.length < 2) {
      throw new Error('数据行数不足，请确保包含表头和数据行')
    }

    console.log('[出勤导入] 开始解析，共', data.length, '行')
    console.log('[出勤导入] 前5行数据:', data.slice(0, 5))

    // 查找表头行（包含"序号"或"姓名"的行）
    let headerRowIndex = -1
    let columnMap: Record<string, number> = {}
    
    for (let i = 0; i < Math.min(10, data.length); i++) {
      const row = data[i]
      if (!row || row.length === 0) continue
      
      const map: Record<string, number> = {}
      for (let j = 0; j < row.length; j++) {
        const cellValue = String(row[j] || '').trim()
        if (!cellValue) continue
        
        // 检查序号列
        if (cellValue === '序号' || cellValue === '编号' || cellValue.includes('序号')) {
          map['序号'] = j
        }
        // 检查姓名列
        if (cellValue === '姓名' || cellValue === '名字' || cellValue.includes('姓名')) {
          map['姓名'] = j
        }
      }
      
      // 如果找到了序号或姓名列，认为是表头行
      if (map['序号'] !== undefined || map['姓名'] !== undefined) {
        headerRowIndex = i
        columnMap = map
        console.log(`[出勤导入] 找到表头行: 第${i + 1}行, 序号列:${map['序号']}, 姓名列:${map['姓名']}`)
        break
      }
    }

    if (headerRowIndex < 0) {
      throw new Error('无法找到表头行，请确保包含"序号"或"姓名"列')
    }

    // 分析日期列结构
    const headerRow = data[headerRowIndex]
    const subHeaderRow = data[headerRowIndex + 1] // 可能的子表头行（上/下）
    
    console.log('[出勤导入] 表头行:', headerRow)
    console.log('[出勤导入] 子表头行:', subHeaderRow)

    // 构建日期-列索引映射
    interface DayColumnInfo {
      day: number
      month: number
      amCol?: number
      pmCol?: number
      singleCol?: number
    }
    const dayColumns: DayColumnInfo[] = []
    
    // 检查子表头行是否包含"上"/"下"
    const hasSubHeader = subHeaderRow && subHeaderRow.some((cell: any) => {
      const v = String(cell || '').trim()
      return v === '上' || v === '下' || v === '上午' || v === '下午'
    })
    
    console.log('[出勤导入] 是否有上下半天子表头:', hasSubHeader)

    // 遍历表头，识别日期列
    for (let j = 0; j < headerRow.length; j++) {
      const cellValue = String(headerRow[j] || '').trim()
      if (!cellValue) continue
      
      let parsedDay: number | null = null
      let parsedMonth: number = month // 默认使用当前选择的月份
      
      // 格式1: "1号"、"2号"、"1日"、"2日" 或纯数字
      const dayOnlyMatch = cellValue.match(/^(\d{1,2})[号日]?$/)
      if (dayOnlyMatch) {
        parsedDay = parseInt(dayOnlyMatch[1], 10)
      }
      
      // 格式2: "9.1"、"9.2"（月.日格式）
      const monthDayMatch = cellValue.match(/^(\d{1,2})\.(\d{1,2})$/)
      if (monthDayMatch) {
        parsedMonth = parseInt(monthDayMatch[1], 10)
        parsedDay = parseInt(monthDayMatch[2], 10)
      }
      
      // 格式3: "2025.9.1"（年.月.日格式）
      const fullDateMatch = cellValue.match(/^(\d{4})\.(\d{1,2})\.(\d{1,2})$/)
      if (fullDateMatch) {
        parsedMonth = parseInt(fullDateMatch[2], 10)
        parsedDay = parseInt(fullDateMatch[3], 10)
      }
      
      // 格式4: "9/1"、"9-1"（月/日 或 月-日格式）
      const slashDateMatch = cellValue.match(/^(\d{1,2})[\/\-](\d{1,2})$/)
      if (slashDateMatch) {
        parsedMonth = parseInt(slashDateMatch[1], 10)
        parsedDay = parseInt(slashDateMatch[2], 10)
      }
      
      if (parsedDay !== null && parsedDay >= 1 && parsedDay <= 31) {
        // 只处理当前选择月份的数据
        if (parsedMonth === month) {
          if (hasSubHeader) {
            // 检查子表头的"上"/"下"
            const subCell = subHeaderRow ? String(subHeaderRow[j] || '').trim() : ''
            const nextSubCell = subHeaderRow ? String(subHeaderRow[j + 1] || '').trim() : ''
            
            // 检查当前列和下一列是否是"上"/"下"配对
            const isAm = subCell === '上' || subCell === '上午'
            const isPm = subCell === '下' || subCell === '下午'
            const nextIsAm = nextSubCell === '上' || nextSubCell === '上午'
            const nextIsPm = nextSubCell === '下' || nextSubCell === '下午'
            
            if (isAm && nextIsPm) {
              // 当前列是"上"，下一列是"下"
              dayColumns.push({ day: parsedDay, month: parsedMonth, amCol: j, pmCol: j + 1 })
              console.log(`[出勤导入] 日期列 ${parsedMonth}.${parsedDay}: 上=${j}, 下=${j+1}`)
            } else if (isAm) {
              // 只有"上"列
              dayColumns.push({ day: parsedDay, month: parsedMonth, amCol: j })
            } else if (isPm) {
              // 只有"下"列，跳过（已在上一个日期处理）
            } else {
              // 没有上下标识，作为单列处理
              dayColumns.push({ day: parsedDay, month: parsedMonth, singleCol: j })
            }
          } else {
            // 没有子表头，单列模式
            dayColumns.push({ day: parsedDay, month: parsedMonth, singleCol: j })
          }
        }
      }
    }
    
    console.log(`[出勤导入] 识别到 ${dayColumns.length} 个日期列:`, dayColumns)

    if (dayColumns.length === 0) {
      throw new Error(`未能识别日期列，请确保表头包含日期（如"1号"、"9.1"等格式），且月份与当前选择的${month}月匹配`)
    }

    // 确定数据起始行
    const dataStartRow = hasSubHeader ? headerRowIndex + 2 : headerRowIndex + 1
    console.log(`[出勤导入] 数据起始行: 第${dataStartRow + 1}行`)
    
    // 解析数据行
    const records: Row[] = []
    
    for (let i = dataStartRow; i < data.length; i++) {
      const row = data[i]
      if (!row || row.length === 0) continue
      
      // 跳过空行
      const hasData = row.some((cell: any) => cell !== null && cell !== undefined && String(cell).trim() !== '')
      if (!hasData) continue
      
      // 提取序号和姓名
      const 序号Col = columnMap['序号']
      const 姓名Col = columnMap['姓名']
      
      const 序号Value = 序号Col !== undefined ? row[序号Col] : ''
      const 姓名Value = 姓名Col !== undefined ? row[姓名Col] : ''
      
      const 序号 = parseInt(String(序号Value || '').trim(), 10) || (records.length + 1)
      const name = String(姓名Value || '').trim()
      
      // 跳过没有姓名的行
      if (!name) continue
      // 跳过包含特殊关键词的行（汇总行）
      if (name.includes('出勤率') || name.includes('合计') || name.includes('平均') || name.includes('备注')) continue
      
      // 构建 slots
      const slots: Record<string, string | null> = {}
      
      for (const dc of dayColumns) {
        if (dc.amCol !== undefined) {
          const amValue = row[dc.amCol]
          const amKey = ymdHalfKey(year, dc.month, dc.day, 'am')
          slots[amKey] = normalizeAttendanceValue(amValue)
        }
        if (dc.pmCol !== undefined) {
          const pmValue = row[dc.pmCol]
          const pmKey = ymdHalfKey(year, dc.month, dc.day, 'pm')
          slots[pmKey] = normalizeAttendanceValue(pmValue)
        }
        if (dc.singleCol !== undefined) {
          // 单列模式：同一个值应用到上下午
          const value = row[dc.singleCol]
          const normalizedValue = normalizeAttendanceValue(value)
          const amKey = ymdHalfKey(year, dc.month, dc.day, 'am')
          const pmKey = ymdHalfKey(year, dc.month, dc.day, 'pm')
          slots[amKey] = normalizedValue
          slots[pmKey] = normalizedValue
        }
      }
      
      console.log(`[出勤导入] 解析学员: ${name}, slots数量: ${Object.keys(slots).length}`)
      
      records.push({
        key: `imported-${i}-${Date.now()}`,
        序号,
        name,
        slots,
      })
    }
    
    if (records.length === 0) {
      throw new Error('未能解析出有效的学员记录，请检查数据格式')
    }
    
    console.log(`[出勤导入] 成功解析 ${records.length} 条记录`)
    return records
  }

  /**
   * 处理 Excel 文件上传
   */
  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!selectedCampus || !selectedClass) {
      message.warning('请先选择班级')
      return
    }

    try {
      setImportLoading(true)
      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: 'array' })

      // 读取第一个 Sheet
      const firstSheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[firstSheetName]
      
      const data = XLSX.utils.sheet_to_json<any[]>(sheet, { 
        header: 1, 
        defval: '',
        raw: true,
      })
      
      console.log(`[出勤导入] 读取到 ${data.length} 行数据，Sheet: ${firstSheetName}`)

      const records = parseExcelData(data)

      if (records.length === 0) {
        message.warning('未能从 Excel 中解析出有效的学员记录')
        return
      }

      // 设置预览数据
      setPreviewData(records)
      setPreviewModalVisible(true)

      // 重置文件输入
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error: any) {
      console.error('[出勤导入] 解析失败:', error)
      message.error(`Excel 导入失败：${error.message || '数据格式不正确'}`)
    } finally {
      setImportLoading(false)
    }
  }

  /**
   * 处理剪切板粘贴导入
   */
  const handlePasteDataImport = async () => {
    if (!pasteText || !pasteText.trim()) {
      message.warning('请先粘贴数据')
      return
    }

    if (!selectedCampus || !selectedClass) {
      message.warning('请先选择班级')
      return
    }

    try {
      setImportLoading(true)

      // 将粘贴文本转换为二维数组
      const lines = pasteText.split(/\r?\n/).filter(line => line.trim())
      if (lines.length < 2) {
        throw new Error('粘贴数据行数不足，请确保包含表头和数据行')
      }

      const data: any[][] = lines.map(line => {
        if (line.includes('\t')) {
          return line.split('\t').map(cell => cell.trim())
        } else if (/\s{2,}/.test(line)) {
          return line.split(/\s{2,}/).map(cell => cell.trim())
        } else {
          return line.split(/\s+/).map(cell => cell.trim())
        }
      })

      const records = parseExcelData(data)

      if (records.length === 0) {
        message.warning('未能从剪贴板中解析出有效的学员记录')
        return
      }

      // 关闭粘贴弹窗，打开预览弹窗
      setPasteModalVisible(false)
      setPasteText('')
      setPreviewData(records)
      setPreviewModalVisible(true)

    } catch (error: any) {
      console.error('[剪切板导入] 解析失败:', error)
      message.error(`剪切板导入失败：${error.message || '数据格式不正确'}`)
    } finally {
      setImportLoading(false)
    }
  }

  /**
   * 确认导入并保存到后端
   */
  const handleConfirmImport = async () => {
    if (previewData.length === 0) {
      message.warning('没有可导入的数据')
      return
    }

    try {
      setImportLoading(true)

      // 合并到现有数据（按姓名匹配）
      const existingNameMap = new Map(rows.filter(r => r.name).map(r => [r.name, r]))
      const updatedCount = { updated: 0, added: 0 }
      
      const finalRows: Row[] = [...rows]
      
      for (const newRecord of previewData) {
        const existingRow = existingNameMap.get(newRecord.name)
        if (existingRow) {
          // 更新现有记录的 slots
          const idx = finalRows.findIndex(r => r.key === existingRow.key)
          if (idx >= 0) {
            finalRows[idx] = {
              ...finalRows[idx],
              slots: { ...finalRows[idx].slots, ...newRecord.slots },
            }
            updatedCount.updated++
          }
        } else {
          // 新增记录
          finalRows.push({
            ...newRecord,
            key: String(finalRows.length + 1),
            序号: finalRows.length + 1,
          })
          updatedCount.added++
        }
      }

      // 保存到后端
      const payloadRows = finalRows
        .filter((r) => r.name && r.name.trim().length > 0)
        .map((r) => ({ 序号: r.序号, 姓名: r.name, slots: r.slots || {} }))

      if (payloadRows.length === 0) {
        message.warning('没有需要保存的数据')
        return
      }

      const res = await fetch(buildApiUrl('/teaching-quality/class-attendance'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          神殿名称: selectedCampus, 
          班级名称: selectedClass, 
          年份: year, 
          月份: month, 
          行列表: payloadRows 
        }),
      })

      if (!res.ok) throw new Error(await res.text())

      // 关闭预览弹窗
      setPreviewModalVisible(false)
      setPreviewData([])

      message.success(`成功导入并保存 ${previewData.length} 条记录（更新 ${updatedCount.updated} 条，新增 ${updatedCount.added} 条）`)

      // 重新加载数据
      await loadAll(selectedCampus, selectedClass, year, month)

    } catch (error: any) {
      console.error('[导入保存失败]', error)
      message.error(`导入保存失败：${error.message || '未知错误'}`)
    } finally {
      setImportLoading(false)
    }
  }

  const columns: ColumnsType<Row> = [
    { title: '序号', dataIndex: '序号', key: '序号', width: 70, fixed: 'left', align: 'center' },
    { title: '姓名', dataIndex: 'name', key: 'name', width: 120, fixed: 'left', align: 'center' },
    ...daysInMonth.map((d) => ({
      title: `${d}号`,
      key: `d-${d}`,
      children: [
        {
          title: '上',
          key: `d-${d}-am`,
          width: 100,
          align: 'center',
          render: (_: unknown, record: Row) => {
            const k = ymdHalfKey(year, month, d, 'am')
            const v = (record.slots || {})[k] || DEFAULT_STATUS
            return (
              <Select
                value={v || DEFAULT_STATUS}
                onChange={(val) => updateSlot(record.key, d, 'am', val)}
                options={ATTENDANCE_STATUS_OPTIONS}
                style={{ width: '100%' }}
                size="small"
                placeholder="选择状态"
              />
            )
          },
        },
        {
          title: '下',
          key: `d-${d}-pm`,
          width: 100,
          align: 'center',
          render: (_: unknown, record: Row) => {
            const k = ymdHalfKey(year, month, d, 'pm')
            const v = (record.slots || {})[k] || DEFAULT_STATUS
            return (
              <Select
                value={v || DEFAULT_STATUS}
                onChange={(val) => updateSlot(record.key, d, 'pm', val)}
                options={ATTENDANCE_STATUS_OPTIONS}
                style={{ width: '100%' }}
                size="small"
                placeholder="选择状态"
              />
            )
          },
        },
      ],
    })),
  ]

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={
          <Space>
            <span>班级出勤表</span>
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
                if (selectedCampus && selectedClass) await loadAll(selectedCampus, selectedClass, y, month)
              }}
              options={Array.from({ length: 6 }).map((_, i) => ({ label: `${today.getFullYear() - i}年`, value: today.getFullYear() - i }))}
              style={{ width: 110 }}
            />
            <Select
              value={month}
              onChange={async (m) => {
                setMonth(m)
                if (selectedCampus && selectedClass) await loadAll(selectedCampus, selectedClass, year, m)
              }}
              options={Array.from({ length: 12 }).map((_, i) => ({ label: `${i + 1}月`, value: i + 1 }))}
              style={{ width: 90 }}
            />
          </Space>
        }
        extra={
          <Space>
            <Button icon={<ImportOutlined />} onClick={() => setImportModalVisible(true)}>导入数据</Button>
            <Button onClick={() => selectedCampus && selectedClass && loadAll(selectedCampus, selectedClass, year, month)}>刷新</Button>
            <Button
              type="primary"
              onClick={async () => {
                if (!selectedCampus || !selectedClass) {
                  message.warning('请先选择班级')
                  return
                }
                const payloadRows = rows
                  .filter((r) => r.name && r.name.trim().length > 0)
                  .map((r) => ({ 序号: r.序号, 姓名: r.name, slots: r.slots || {} }))
                if (payloadRows.length === 0) {
                  message.warning('没有需要保存的数据')
                  return
                }
                try {
                  const res = await fetch(buildApiUrl('/teaching-quality/class-attendance'), {
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
        <div style={{ marginBottom: 12, padding: '8px 12px', backgroundColor: '#f0f2f5', borderRadius: 4, fontSize: 13, color: '#666' }}>
          <strong>填写说明：</strong>使用下拉选择框选择出勤状态：√（正常出勤）、迟到、早退、请假、旷课。默认全部为"√"状态。迟到不计入出勤率。
        </div>
        <Table<Row>
          bordered
          size="small"
          columns={columns}
          dataSource={rows}
          loading={loading}
          pagination={false}
          rowKey="key"
          scroll={{ x: 'max-content' }}
          summary={() => (
            <Table.Summary>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={2} align="center">
                  出勤率
                </Table.Summary.Cell>
                {daysInMonth.map((d, index) => (
                  <React.Fragment key={`attendance-rate-${d}`}>
                    <Table.Summary.Cell index={index * 2 + 2} align="center">
                      {formatPercent(dailyAttendanceRates[index]?.am || 0)}
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={index * 2 + 3} align="center">
                      {formatPercent(dailyAttendanceRates[index]?.pm || 0)}
                    </Table.Summary.Cell>
                  </React.Fragment>
                ))}
              </Table.Summary.Row>
            </Table.Summary>
          )}
        />
      </Card>

      {/* 导入数据弹窗 */}
      <Modal
        title="导入班级出勤数据"
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
            出勤状态可以是：√、1（出勤）、迟到、早退、请假、旷课、空白等
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

export default AttendanceSheet
