// 学术->学术经理->管理表格 教员课时统计表（按月份/按周展示）
import React, { useEffect, useMemo, useState, useRef } from 'react'
import { App,
  Card,
  DatePicker,
  Calendar,
  Typography,
  Space,
  Alert,
  Table,
  InputNumber,
  Input,
  ConfigProvider,
  Button,
  Spin,
  Select,
  Modal,
} from 'antd'
import { FileExcelOutlined, CopyOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { Dayjs } from 'dayjs'
import zhCN from 'antd/locale/zh_CN'
import 'dayjs/locale/zh-cn'
import * as XLSX from 'xlsx'
import { useCampusStore } from '@/stores/campusStore'
import { useAuthStore } from '@/stores/authStore'
import { fetchTeacherHourStats, saveTeacherHourStats } from '@/services/teacherHourStats'
import { fetchTeachers } from '@/services/configMaster'

const { TextArea } = Input

dayjs.locale('zh-cn')

const { Title, Text } = Typography

type SessionRowKey = 'morning' | 'afternoon' | 'evening' | 'summary'

interface DaySchedule {
  key: string // YYYY-MM-DD
  dateLabel: string // 03/01
  weekLabel: string // 星期五
}

interface MonthlyWeek {
  id: string
  title: string // 周区间显示
  days: DaySchedule[]
}

interface SessionRow {
  rowKey: SessionRowKey
  timeSlot: string // 上午/下午/晚上/合计
  [key: string]: string | number
}

type ScheduleData = {
  weeks: MonthlyWeek[]
  rows: Record<string, SessionRow[]> // weekId -> rows
  totals: { regular: number; makeup: number; project: number; tutoring: number }
}

interface TeacherOption {
  label: string
  value: string
}

const SESSIONS: Array<{ key: SessionRowKey; label: string }> = [
  { key: 'morning', label: '上午' },
  { key: 'afternoon', label: '下午' },
  { key: 'evening', label: '晚上' },
]

const SUMMARY_SESSION = { key: 'summary' as SessionRowKey, label: '合计' }

// 生成空行
const emptyRowsForWeek = (days: DaySchedule[]): SessionRow[] => {
  const base = [...SESSIONS, SUMMARY_SESSION]
  return base.map(({ key, label }) => {
    const row: SessionRow = { rowKey: key, timeSlot: label }
    days.forEach((d) => {
      row[`${d.key}-regular`] = 0
      row[`${d.key}-makeup`] = 0
      row[`${d.key}-project`] = 0
      row[`${d.key}-tutor`] = 0
      row[`${d.key}-detail`] = ''
    })
    if (key === 'summary') {
      row['weekly-regular-total'] = 0
      row['weekly-makeup-total'] = 0
      row['weekly-project-total'] = 0
      row['weekly-tutor-total'] = 0
    }
    return row
  })
}

// 根据月份生成周结构（周日作为每周起始）
const buildMonthWeeks = (month: Dayjs): MonthlyWeek[] => {
  const start = month.startOf('month').startOf('week')
  const end = month.endOf('month').endOf('week')
  const weeks: MonthlyWeek[] = []
  let cursor = start
  let index = 1
  while (cursor.isBefore(end) || cursor.isSame(end, 'day')) {
    const days: DaySchedule[] = Array.from({ length: 7 }).map((_, i) => {
      const d = cursor.add(i, 'day')
      const weekNames = '日一二三四五六'
      return {
        key: d.format('YYYY-MM-DD'),
        dateLabel: d.format('MM/DD'),
        weekLabel: `星期${weekNames[d.day()]}`,
      }
    })
    weeks.push({
      id: `${month.format('YYYY-MM')}-week-${index}`,
      title: `${days[0].dateLabel} - ${days[6].dateLabel}`,
      days,
    })
    cursor = cursor.add(1, 'week')
    index += 1
  }
  return weeks
}

// 重新计算每周合计（包含：每天合计行 + 每周合计列）
const recalcWeekTotals = (rows: SessionRow[], days: DaySchedule[]): SessionRow[] => {
  const next = rows.map((r) => ({ ...r }))

  // 1) 计算“合计”行：按天汇总（上午/下午/晚上 -> 合计）
  const summaryRow = next.find((r) => r.rowKey === 'summary')
  if (summaryRow) {
    days.forEach((d) => {
      ;(['regular', 'makeup', 'project', 'tutor'] as const).forEach((field) => {
        const sum = next
          .filter((r) => r.rowKey !== 'summary')
          .reduce((acc, r) => acc + Number(r[`${d.key}-${field}`] || 0), 0)
        summaryRow[`${d.key}-${field}`] = sum
      })
    })
  }

  // 2) 计算右侧“每周合计列”：合计本周所有天、所有时段
  if (!summaryRow) return next
  let regular = 0,
    makeup = 0,
    project = 0,
    tutor = 0

  next.forEach((r) => {
    if (r.rowKey === 'summary') return
    days.forEach((d) => {
      regular += Number(r[`${d.key}-regular`] || 0)
      makeup += Number(r[`${d.key}-makeup`] || 0)
      project += Number(r[`${d.key}-project`] || 0)
      tutor += Number(r[`${d.key}-tutor`] || 0)
    })
  })

  summaryRow['weekly-regular-total'] = regular
  summaryRow['weekly-makeup-total'] = makeup
  summaryRow['weekly-project-total'] = project
  summaryRow['weekly-tutor-total'] = tutor
  return next
}

// 重新计算整月合计
const recalcMonthTotals = (schedule: ScheduleData): ScheduleData => {
  let regular = 0,
    makeup = 0,
    project = 0,
    tutoring = 0
  schedule.weeks.forEach((w) => {
    const rows = schedule.rows[w.id] || []
    const s = rows.find((r) => r.rowKey === 'summary')
    if (s) {
      regular += Number(s['weekly-regular-total'] || 0)
      makeup += Number(s['weekly-makeup-total'] || 0)
      project += Number(s['weekly-project-total'] || 0)
      tutoring += Number(s['weekly-tutor-total'] || 0)
    }
  })
  return { ...schedule, totals: { regular, makeup, project, tutoring } }
}

const TeacherHourStatsPage: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore()
  const { user, hasPermission, roles } = useAuthStore()
  const [selectedMonth, setSelectedMonth] = useState<Dayjs>(dayjs())
  const [scheduleMap, setScheduleMap] = useState<Record<string, ScheduleData>>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [teacherOptions, setTeacherOptions] = useState<TeacherOption[]>([])
  const [selectedTeacher, setSelectedTeacher] = useState<string | undefined>(undefined)
  const [canEditOthers, setCanEditOthers] = useState(true)
  
  // 导入相关状态
  const [importModalVisible, setImportModalVisible] = useState(false)
  const [importType, setImportType] = useState<'excel' | 'paste'>('excel')
  const [pasteText, setPasteText] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const campusName = currentCampus || '主神殿'
  const teacherKey = selectedTeacher || '未选择教员'
  const cacheKey = `${campusName}-${teacherKey}-${selectedMonth.format('YYYY-MM')}`
  const schedule = scheduleMap[cacheKey]

  // 检查用户是否只能查看自己的数据
  useEffect(() => {
    const checkPermissions = async () => {
      const hasViewPermission = hasPermission('academic.teacher.hours.view')
      
      if (hasViewPermission && user) {
        // 通过角色判断：只有 teacher（学术教员）角色的用户只能看自己
        // 其他角色（chairman、academic_director、principal、academic_manager、academic_deputy_manager）可以看全部
        const isTeacher = roles.includes('teacher')
        const hasHigherRole = roles.some(role => 
          ['chairman', 'academic_director', 'principal', 'academic_manager', 'academic_deputy_manager'].includes(role)
        )
        
        if (isTeacher && !hasHigherRole) {
          // 纯教员角色，只能看自己
          setCanEditOthers(false)
          if (!selectedTeacher) {
            setSelectedTeacher(user.name)
          }
        } else {
          setCanEditOthers(true)
        }
      }
    }
    checkPermissions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, roles])

  useEffect(() => {
    const loadTeacherOptions = async () => {
      try {
        const list = await fetchTeachers({ active: true })
        const options = list.map((teacher) => ({
          label: teacher.name,
          value: teacher.name,
        }))
        setTeacherOptions(options)
        
        // 如果还没选择教员，根据权限自动选择
        if (!selectedTeacher) {
          if (!canEditOthers && user) {
            // 普通教员，自动选择自己
            setSelectedTeacher(user.name)
          } else if (options.length > 0) {
            // 管理员，选择第一个
            setSelectedTeacher(options[0].value)
          }
        }
      } catch (error) {
        console.warn('加载教员列表失败', error)
      }
    }
    loadTeacherOptions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const buildEmptySchedule = (month: Dayjs): ScheduleData => {
    const weeks = buildMonthWeeks(month)
    const rows: Record<string, SessionRow[]> = {}
    weeks.forEach((w) => (rows[w.id] = emptyRowsForWeek(w.days)))
    return recalcMonthTotals({
      weeks,
      rows,
      totals: { regular: 0, makeup: 0, project: 0, tutoring: 0 },
    })
  }

  const loadMonthData = async () => {
    if (!selectedTeacher) {
      return
    }
    setLoading(true)
    try {
      const year = selectedMonth.year()
      const month = selectedMonth.month() + 1
      const res = await fetchTeacherHourStats({
        campus: campusName,
        year,
        month,
        teacher: selectedTeacher,
      })
      let scheduleData: ScheduleData =
        res.schedule && Object.keys(res.schedule).length
          ? (res.schedule as ScheduleData)
          : buildEmptySchedule(selectedMonth)
      scheduleData = recalcMonthTotals(scheduleData)
      setScheduleMap((prev) => ({
        ...prev,
        [cacheKey]: scheduleData,
      }))
      setSelectedTeacher(res.teacher || selectedTeacher)
    } catch (error: any) {
      console.error('加载课时统计失败', error)
      
      // 如果是权限错误，显示友好提示
      if (error?.response?.status === 403) {
        const errorMsg = error?.response?.data?.detail || '您没有权限访问此数据'
        message.error(errorMsg)
        
        // 如果是普通教员尝试访问他人数据，自动切换回自己
        if (!canEditOthers && user) {
          setSelectedTeacher(user.name)
          return
        }
      } else {
        message.error('加载课时统计失败，请稍后重试')
      }
      
      // 只有非权限错误时才创建空表格
      if (error?.response?.status !== 403) {
        setScheduleMap((prev) => ({
          ...prev,
          [cacheKey]: buildEmptySchedule(selectedMonth),
        }))
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMonthData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey])

  const handleMonthChange = (value: Dayjs | null) => {
    if (value) setSelectedMonth(value.startOf('month'))
  }

  const updateCell = (
    weekId: string,
    rowKey: SessionRowKey,
    dayKey: string,
    field: 'regular' | 'makeup' | 'project' | 'tutor' | 'detail',
    value: number | string,
  ) => {
    setScheduleMap((prev) => {
      const current = prev[cacheKey]
      if (!current) return prev
      const weeks = current.weeks
      const rowsMap = { ...current.rows }
      const rows = (rowsMap[weekId] || []).map((r) => ({ ...r }))
      const target = rows.find((r) => r.rowKey === rowKey)
      if (!target) return prev
      const key = `${dayKey}-${field}`
      ;(target as any)[key] = value as any
      const week = weeks.find((w) => w.id === weekId)!
      const recalced = recalcWeekTotals(rows, week.days)
      rowsMap[weekId] = recalced
      const nextSchedule = recalcMonthTotals({ weeks, rows: rowsMap, totals: current.totals })
      return { ...prev, [cacheKey]: nextSchedule }
    })
  }

  const renderWeekTable = (week: MonthlyWeek, rows: SessionRow[]) => {
    const columns: ColumnsType<SessionRow> = [
      {
        title: '时间',
        dataIndex: 'timeSlot',
        key: 'timeSlot',
        fixed: 'left',
        width: 100,
        align: 'center',
      },
    ]

    week.days.forEach((day) => {
      columns.push({
        title: (
          <div>
            <div>{day.weekLabel}</div>
            <div style={{ fontWeight: 400 }}>{day.dateLabel}</div>
          </div>
        ),
        children: [
          {
            title: '正课',
            dataIndex: `${day.key}-regular`,
            key: `${day.key}-regular`,
            align: 'center',
            width: 70,
            render: (val, record) =>
              record.rowKey !== 'summary' ? (
                <InputNumber
                  size="small"
                  min={0}
                  value={Number(val || 0)}
                  onChange={(v) =>
                    updateCell(week.id, record.rowKey, day.key, 'regular', Number(v || 0))
                  }
                />
              ) : (
                <span>{val as number}</span>
              ),
          },
          {
            title: '补课',
            dataIndex: `${day.key}-makeup`,
            key: `${day.key}-makeup`,
            align: 'center',
            width: 70,
            render: (val, record) =>
              record.rowKey !== 'summary' ? (
                <InputNumber
                  size="small"
                  min={0}
                  value={Number(val || 0)}
                  onChange={(v) =>
                    updateCell(week.id, record.rowKey, day.key, 'makeup', Number(v || 0))
                  }
                />
              ) : (
                <span>{val as number}</span>
              ),
          },
          {
            title: '项目',
            dataIndex: `${day.key}-project`,
            key: `${day.key}-project`,
            align: 'center',
            width: 70,
            render: (val, record) =>
              record.rowKey !== 'summary' ? (
                <InputNumber
                  size="small"
                  min={0}
                  value={Number(val || 0)}
                  onChange={(v) =>
                    updateCell(week.id, record.rowKey, day.key, 'project', Number(v || 0))
                  }
                />
              ) : (
                <span>{val as number}</span>
              ),
          },
          {
            title: '辅导',
            dataIndex: `${day.key}-tutor`,
            key: `${day.key}-tutor`,
            align: 'center',
            width: 70,
            render: (val, record) =>
              record.rowKey !== 'summary' ? (
                <InputNumber
                  size="small"
                  min={0}
                  value={Number(val || 0)}
                  onChange={(v) =>
                    updateCell(week.id, record.rowKey, day.key, 'tutor', Number(v || 0))
                  }
                />
              ) : (
                <span>{val as number}</span>
              ),
          },
          {
            title: '班级-课程-章节',
            dataIndex: `${day.key}-detail`,
            key: `${day.key}-detail`,
            align: 'center',
            width: 220,
            render: (val, record) =>
              record.rowKey !== 'summary' ? (
                <Input
                  size="small"
                  value={(val as string) || ''}
                  onChange={(e) =>
                    updateCell(week.id, record.rowKey, day.key, 'detail', e.target.value)
                  }
                />
              ) : null,
          },
        ],
      })
    })

    // 右侧合计列（每周）
    columns.push({
      title: '正课合计',
      dataIndex: 'weekly-regular-total',
      key: 'weekly-regular-total',
      align: 'center',
      width: 100,
    })
    columns.push({
      title: '补课合计',
      dataIndex: 'weekly-makeup-total',
      key: 'weekly-makeup-total',
      align: 'center',
      width: 100,
    })
    columns.push({
      title: '项目合计',
      dataIndex: 'weekly-project-total',
      key: 'weekly-project-total',
      align: 'center',
      width: 100,
    })
    columns.push({
      title: '辅导合计',
      dataIndex: 'weekly-tutor-total',
      key: 'weekly-tutor-total',
      align: 'center',
      width: 100,
    })

    return (
      <Table<SessionRow>
        key={week.id}
        bordered
        columns={columns}
        dataSource={rows.map((row) => ({ ...row, key: row.rowKey }))}
        pagination={false}
        scroll={{ x: 'max-content' }}
        size="small"
        style={{ marginBottom: 24 }}
      />
    )
  }

  const handleSave = async () => {
    if (!schedule) {
      message.warning('暂无可保存的数据')
      return
    }
    if (!selectedTeacher) {
      message.warning('请选择授课教员')
      return
    }
    setSaving(true)
    try {
      await saveTeacherHourStats({
        campus: campusName,
        year: selectedMonth.year(),
        month: selectedMonth.month() + 1,
        schedule,
        teacher: selectedTeacher,
      })
      message.success('已保存至后端')
    } catch (error) {
      console.error('保存课时统计失败', error)
      message.error('保存失败，请稍后重试')
    } finally {
      setSaving(false)
    }
  }

  // 将Excel日期序列号转换为dayjs对象
  // Excel日期序列号是从1900年1月1日开始的序列号
  // Excel认为1900年是闰年（实际上不是），所以从1900-03-01开始需要减1
  const parseExcelSerialDate = (serial: number): Dayjs | null => {
    // Excel的日期序列号：1900-01-01 是序列号 1
    // 但Excel错误地将1900年视为闰年，所以从1900-03-01开始需要减1
    // 更准确的计算：使用1899-12-30作为基准（Excel的epoch）
    const excelEpoch = dayjs('1899-12-30') // Excel的基准日期（1900-01-01的前一天）
    const date = excelEpoch.add(serial, 'day')
    
    if (!date.isValid()) {
      console.warn(`[Excel解析] Excel序列号无效:`, serial)
      return null
    }
    
    return date
  }

  // 解析日期字符串（如"12/01 一"）或Excel序列号为dayjs对象
  // 如果没有年份信息，默认使用用户选择的年份
  const parseDateString = (dateValue: string | number, year: number, month: number): Dayjs | null => {
    // 如果是数字，可能是Excel日期序列号
    if (typeof dateValue === 'number') {
      const date = parseExcelSerialDate(dateValue)
      if (date && date.isValid()) {
        console.log(`[Excel解析] Excel序列号解析: ${dateValue} -> ${date.format('YYYY-MM-DD')}`)
        return date
      }
      return null
    }

    // 支持多种日期格式：12/01、12/01 一、12/01一
    const dateStr = String(dateValue)
    const match = dateStr.match(/(\d{1,2})\/(\d{1,2})/)
    if (!match) {
      console.warn(`[Excel解析] 日期格式不匹配:`, dateStr)
      return null
    }
    const [, m, d] = match
    const dateMonth = parseInt(m, 10)
    const dateDay = parseInt(d, 10)
    
    // 如果没有年份信息，默认使用用户选择的年份
    let actualYear = year
    let actualMonth = month
    
    // 处理跨月情况（如11/24在12月份统计表中）
    if (dateMonth > month) {
      // 可能是上一年（如12月统计表中出现11月）
      if (dateMonth === 11 && month === 12) {
        actualYear = year
        actualMonth = dateMonth
      } else {
        actualYear = year - 1
        actualMonth = dateMonth
      }
    } else if (dateMonth < month) {
      // 可能是下一年（12月统计表中出现1月）
      if (dateMonth === 1 && month === 12) {
        actualYear = year + 1
        actualMonth = dateMonth
      } else {
        // 同一年内的跨月（如1月统计表中出现12月，应该是上一年）
        actualYear = year - 1
        actualMonth = dateMonth
      }
    } else {
      // 同一个月
      actualMonth = dateMonth
    }
    
    const dateStr_full = `${actualYear}-${String(actualMonth).padStart(2, '0')}-${String(dateDay).padStart(2, '0')}`
    const date = dayjs(dateStr_full)
    
    if (!date.isValid()) {
      console.warn(`[Excel解析] 日期无效:`, dateStr_full)
      return null
    }
    
    console.log(`[Excel解析] 日期解析: "${dateStr}" -> ${dateStr_full} (年份: ${actualYear}, 月份: ${actualMonth})`)
    return date
  }

  // Excel原始数据JSON格式（更接近Excel结构）
  interface ExcelWeekData {
    weekIndex: number
    weekTitle: string
    days: Array<{
      date: string // YYYY-MM-DD
      dateLabel: string // MM/DD
      weekLabel: string // 星期X
      sessions: {
        morning: { regular: number; makeup: number; project: number; tutor: number; detail: string }
        afternoon: { regular: number; makeup: number; project: number; tutor: number; detail: string }
        evening: { regular: number; makeup: number; project: number; tutor: number; detail: string }
      }
      dailyTotals: { regular: number; makeup: number; project: number; tutor: number }
    }>
    weeklyTotals: { regular: number; makeup: number; project: number; tutor: number }
  }

  interface ExcelScheduleJSON {
    year: number
    month: number
    weeks: ExcelWeekData[]
    monthlyTotals: { regular: number; makeup: number; project: number; tutor: number }
  }

  // 将Excel原始数据转换为JSON格式（保留Excel结构）
  const parseExcelToJSON = (excelData: any[][]): ExcelScheduleJSON => {
    if (!excelData || excelData.length < 5) {
      throw new Error('数据格式不正确：至少需要表头行和数据行')
    }

    console.log('[Excel解析] 开始解析，总行数:', excelData.length)
    console.log('[Excel解析] 前10行数据:', excelData.slice(0, 10).map((row, idx) => ({
      行号: idx,
      数据: row.slice(0, 20).map((cell, cIdx) => `[${cIdx}]:${String(cell || '').trim()}`)
    })))

    // 从第一行提取月份信息
    const firstRow = excelData[0] || []
    // 默认使用用户选择的年份和月份
    let year = selectedMonth.year()
    let month = selectedMonth.month() + 1
    
    console.log('[Excel解析] 默认年份:', year, '默认月份:', month, '用户选择的月份:', selectedMonth.format('YYYY-MM'))
    
    // 尝试从标题中提取月份（如"12月份 课时统计表"）
    const titleText = firstRow.join(' ')
    console.log('[Excel解析] 标题行:', titleText)
    const monthMatch = titleText.match(/(\d{1,2})月份/)
    if (monthMatch) {
      month = parseInt(monthMatch[1], 10)
      console.log('[Excel解析] 从标题提取月份:', month)
    }
    
    // 如果没有年份信息，始终使用用户选择的年份
    console.log('[Excel解析] 最终使用年份:', year, '月份:', month)

    const weeks: ExcelWeekData[] = []
    let weekIndex = 0
    let i = 0

    // 查找所有"时间"行，每行标识新的一周
    while (i < excelData.length) {
      const row = excelData[i]
      if (!row || row.length === 0) {
        i++
        continue
      }

      // 检查整行是否包含"时间"
      const rowText = row.map(c => String(c || '').trim()).join(' ')
      const firstCell = String(row[0] || '').trim()
      
      // 识别"时间"行，表示新的一周开始
      // 更宽松的匹配：第一列是"时间"，或者整行包含"时间"且第一列不为空且不是日期格式
      const isTimeRow = firstCell === '时间' || 
                       (rowText.includes('时间') && firstCell && 
                        !firstCell.match(/\d{1,2}\/\d{1,2}/) && 
                        !firstCell.match(/星期/) &&
                        !firstCell.match(/^\d+$/))
      
      if (isTimeRow) {
        console.log(`[Excel解析] 找到"时间"行，第${i}行，第一列:`, firstCell, '整行前100字符:', rowText.substring(0, 100))
        weekIndex++
        
        // 读取日期行（下一行）
        if (i + 1 >= excelData.length) {
          console.log(`[Excel解析] 第${i}行后没有更多行`)
          i++
          continue
        }

        const dateRow = excelData[i + 1]
        if (!dateRow || dateRow.length === 0) {
          console.log(`[Excel解析] 日期行为空，第${i + 1}行`)
          i++
          continue
        }

        console.log(`[Excel解析] 日期行（第${i + 1}行）:`, dateRow.slice(0, 20))

        // 读取表头行（再下一行）
        const headerRow = i + 2 < excelData.length ? excelData[i + 2] : []
        console.log(`[Excel解析] 表头行（第${i + 2}行）:`, headerRow.slice(0, 20))
        
        // 解析所有日期
        // 根据Excel格式，每天的数据块结构是：
        // - 日期行：空列、日期（如"11/24 一"）、空列、空列、空列、空列、日期（如"11/25 二"）...
        // - 表头行：空列、正课、补课、项目、辅导、班级-课程-章节、正课、补课、项目、辅导、班级-课程-章节...
        // 所以每个日期对应5列数据（正课、补课、项目、辅导、班级-课程-章节）
        
        const dayData: ExcelWeekData['days'] = []
        
        // 先找到所有"正课"列的位置，然后推断日期列
        const regularCols: number[] = []
        for (let c = 0; c < headerRow.length; c++) {
          const headerCell = String(headerRow[c] || '').trim()
          if (headerCell === '正课') {
            regularCols.push(c)
            console.log(`[Excel解析] 找到"正课"列，位置:`, c)
          }
        }

        if (regularCols.length === 0) {
          console.warn(`[Excel解析] 未找到任何"正课"列，表头行:`, headerRow.slice(0, 30))
        }

        // 为每个"正课"列查找对应的日期
        for (let regIdx = 0; regIdx < regularCols.length; regIdx++) {
          const regularCol = regularCols[regIdx]
          
          // 在"正课"列的前面查找日期（日期通常在"正课"列的前面几列）
          // 根据日志，日期可能在"正课"列的同一列或前面几列
          let dateCol = -1
          let dateValue: string | number = ''
          
          // 扩大搜索范围：从"正课"列的前10列开始，到"正课"列本身
          // 因为日期可能在"正课"列的同一列（如果Excel格式不同）
          // 优先查找最近的日期（从"正课"列向前查找）
          for (let c = regularCol; c >= Math.max(0, regularCol - 10); c--) {
            const cell = dateRow[c]
            
            // 检查是否是Excel日期序列号（数字，通常在40000-50000范围内）
            if (typeof cell === 'number' && cell > 1 && cell < 100000) {
              // 可能是Excel日期序列号（1900年后的日期通常在1-100000范围内）
              // 更精确的判断：1900-01-01是1，2025-12-31大约是45291
              // 45985 大约是 2025-11-24
              dateCol = c
              dateValue = cell
              console.log(`[Excel解析] 找到Excel日期序列号 [${i + 1}, ${dateCol}]:`, cell, `对应"正课"列 [${i + 2}, ${regularCol}]`)
              break
            }
            
            // 检查是否是日期字符串格式
            const cellStr = String(cell || '').trim()
            if (cellStr && cellStr.match(/\d{1,2}\/\d{1,2}/)) {
              dateCol = c
              dateValue = cellStr
              console.log(`[Excel解析] 找到日期字符串 [${i + 1}, ${dateCol}]:`, cellStr, `对应"正课"列 [${i + 2}, ${regularCol}]`)
              break
            }
          }

          if (dateCol >= 0 && dateValue) {
            console.log(`[Excel解析] 找到日期单元格 [${i + 1}, ${dateCol}]:`, dateValue, `对应"正课"列 [${i + 2}, ${regularCol}]`)
            const date = parseDateString(dateValue, year, month)
            if (date && date.isValid()) {
              console.log(`[Excel解析] 解析日期成功:`, date.format('YYYY-MM-DD'))

              const weekNames = '日一二三四五六'
              const dayKey = date.format('YYYY-MM-DD')
              
              // 初始化该天的数据
              const dayInfo = {
                date: dayKey,
                dateLabel: date.format('MM/DD'),
                weekLabel: `星期${weekNames[date.day()]}`,
                sessions: {
                  morning: { regular: 0, makeup: 0, project: 0, tutor: 0, detail: '' },
                  afternoon: { regular: 0, makeup: 0, project: 0, tutor: 0, detail: '' },
                  evening: { regular: 0, makeup: 0, project: 0, tutor: 0, detail: '' },
                },
                dailyTotals: { regular: 0, makeup: 0, project: 0, tutor: 0 },
              }

                // 解析数据行（从表头行之后开始）
                let dataRowIndex = i + 3
                console.log(`[Excel解析] 开始解析数据行，从第${dataRowIndex}行开始`)
                while (dataRowIndex < excelData.length) {
                  const dataRow = excelData[dataRowIndex]
                  if (!dataRow || dataRow.length === 0) {
                    dataRowIndex++
                    continue
                  }

                  const timeSlot = String(dataRow[0] || '').trim()
                  console.log(`[Excel解析] 数据行${dataRowIndex}，时间段:`, timeSlot)
                  
                  // 如果遇到下一个"时间"行，停止解析当前周
                  if (timeSlot === '时间' || timeSlot.includes('时间')) {
                    console.log(`[Excel解析] 遇到下一个"时间"行，停止解析当前周`)
                    break
                  }

                  let sessionKey: 'morning' | 'afternoon' | 'evening' | null = null
                  if (timeSlot === '上午') {
                    sessionKey = 'morning'
                  } else if (timeSlot === '下午') {
                    sessionKey = 'afternoon'
                  } else if (timeSlot === '晚自习' || timeSlot === '晚上') {
                    sessionKey = 'evening'
                  } else if (timeSlot === '合计') {
                    // 合计行跳过，后面会计算
                    console.log(`[Excel解析] 跳过合计行`)
                    dataRowIndex++
                    continue
                  }

                  if (sessionKey) {
                    // 解析该天的课程数据（5列：正课、补课、项目、辅导、班级-课程-章节）
                    const regular = parseFloat(String(dataRow[regularCol] || 0)) || 0
                    const makeup = parseFloat(String(dataRow[regularCol + 1] || 0)) || 0
                    const project = parseFloat(String(dataRow[regularCol + 2] || 0)) || 0
                    const tutor = parseFloat(String(dataRow[regularCol + 3] || 0)) || 0
                    const detail = String(dataRow[regularCol + 4] || '').trim()
                    
                    console.log(`[Excel解析] ${timeSlot}数据 [列${regularCol}-${regularCol + 4}]:`, {
                      regular,
                      makeup,
                      project,
                      tutor,
                      detail,
                    })

                    dayInfo.sessions[sessionKey] = {
                      regular,
                      makeup,
                      project,
                      tutor,
                      detail,
                    }
                  }

                  dataRowIndex++
                }

              // 计算该天的合计
              dayInfo.dailyTotals = {
                regular: dayInfo.sessions.morning.regular + dayInfo.sessions.afternoon.regular + dayInfo.sessions.evening.regular,
                makeup: dayInfo.sessions.morning.makeup + dayInfo.sessions.afternoon.makeup + dayInfo.sessions.evening.makeup,
                project: dayInfo.sessions.morning.project + dayInfo.sessions.afternoon.project + dayInfo.sessions.evening.project,
                tutor: dayInfo.sessions.morning.tutor + dayInfo.sessions.afternoon.tutor + dayInfo.sessions.evening.tutor,
              }

              dayData.push(dayInfo)
              console.log(`[Excel解析] 成功解析一天数据:`, dayInfo.date, dayInfo.dateLabel)
            } else {
              console.warn(`[Excel解析] 日期解析失败:`, dateValue)
            }
          } else {
            console.warn(`[Excel解析] 未找到"正课"列 ${regularCol} 对应的日期`)
          }
        }

        console.log(`[Excel解析] 本周解析出 ${dayData.length} 天的数据`)

        if (dayData.length > 0) {
          // 计算周合计
          const weeklyTotals = dayData.reduce(
            (acc, day) => ({
              regular: acc.regular + day.dailyTotals.regular,
              makeup: acc.makeup + day.dailyTotals.makeup,
              project: acc.project + day.dailyTotals.project,
              tutor: acc.tutor + day.dailyTotals.tutor,
            }),
            { regular: 0, makeup: 0, project: 0, tutor: 0 }
          )

          const weekStart = dayData[0].dateLabel
          const weekEnd = dayData[dayData.length - 1].dateLabel

          weeks.push({
            weekIndex,
            weekTitle: `${weekStart} - ${weekEnd}`,
            days: dayData,
            weeklyTotals,
          })
        }
      }

      i++
    }

    console.log(`[Excel解析] 总共解析出 ${weeks.length} 周数据`)

    if (weeks.length === 0) {
      console.error('[Excel解析] 解析失败详情:')
      console.error('- 总行数:', excelData.length)
      console.error('- 前10行:', excelData.slice(0, 10))
      throw new Error('未能解析出任何周数据，请检查数据格式。提示：请确保Excel中包含"时间"行和日期行（如"12/01 一"）')
    }

    // 计算月合计
    const monthlyTotals = weeks.reduce(
      (acc, week) => ({
        regular: acc.regular + week.weeklyTotals.regular,
        makeup: acc.makeup + week.weeklyTotals.makeup,
        project: acc.project + week.weeklyTotals.project,
        tutor: acc.tutor + week.weeklyTotals.tutor,
      }),
      { regular: 0, makeup: 0, project: 0, tutor: 0 }
    )

    return {
      year,
      month,
      weeks,
      monthlyTotals,
    }
  }

  // 将Excel JSON格式转换为前端ScheduleData格式
  const convertJSONToScheduleData = (jsonData: ExcelScheduleJSON): ScheduleData => {
    const targetMonth = dayjs(`${jsonData.year}-${String(jsonData.month).padStart(2, '0')}-01`)
    const weeks = buildMonthWeeks(targetMonth)
    const rows: Record<string, SessionRow[]> = {}

    // 创建日期映射
    const dateToWeekMap = new Map<string, { week: MonthlyWeek; day: DaySchedule }>()
    weeks.forEach((week) => {
      week.days.forEach((day) => {
        dateToWeekMap.set(day.key, { week, day })
      })
    })

    // 初始化所有周的行数据
    weeks.forEach((week) => {
      rows[week.id] = emptyRowsForWeek(week.days)
    })

    // 将JSON数据填充到ScheduleData
    jsonData.weeks.forEach((excelWeek) => {
      excelWeek.days.forEach((excelDay) => {
        const dayInfo = dateToWeekMap.get(excelDay.date)
        if (dayInfo) {
          const { week, day } = dayInfo
          const weekRows = rows[week.id]

          // 填充上午数据
          const morningRow = weekRows.find((r) => r.rowKey === 'morning')
          if (morningRow) {
            morningRow[`${day.key}-regular`] = excelDay.sessions.morning.regular
            morningRow[`${day.key}-makeup`] = excelDay.sessions.morning.makeup
            morningRow[`${day.key}-project`] = excelDay.sessions.morning.project
            morningRow[`${day.key}-tutor`] = excelDay.sessions.morning.tutor
            morningRow[`${day.key}-detail`] = excelDay.sessions.morning.detail
          }

          // 填充下午数据
          const afternoonRow = weekRows.find((r) => r.rowKey === 'afternoon')
          if (afternoonRow) {
            afternoonRow[`${day.key}-regular`] = excelDay.sessions.afternoon.regular
            afternoonRow[`${day.key}-makeup`] = excelDay.sessions.afternoon.makeup
            afternoonRow[`${day.key}-project`] = excelDay.sessions.afternoon.project
            afternoonRow[`${day.key}-tutor`] = excelDay.sessions.afternoon.tutor
            afternoonRow[`${day.key}-detail`] = excelDay.sessions.afternoon.detail
          }

          // 填充晚上数据
          const eveningRow = weekRows.find((r) => r.rowKey === 'evening')
          if (eveningRow) {
            eveningRow[`${day.key}-regular`] = excelDay.sessions.evening.regular
            eveningRow[`${day.key}-makeup`] = excelDay.sessions.evening.makeup
            eveningRow[`${day.key}-project`] = excelDay.sessions.evening.project
            eveningRow[`${day.key}-tutor`] = excelDay.sessions.evening.tutor
            eveningRow[`${day.key}-detail`] = excelDay.sessions.evening.detail
          }
        }
      })
    })

    // 重新计算所有周的合计
    weeks.forEach((week) => {
      rows[week.id] = recalcWeekTotals(rows[week.id], week.days)
    })

    return recalcMonthTotals({
      weeks,
      rows,
      totals: {
        regular: jsonData.monthlyTotals.regular,
        makeup: jsonData.monthlyTotals.makeup,
        project: jsonData.monthlyTotals.project,
        tutoring: jsonData.monthlyTotals.tutor,
      },
    })
  }

  // 从Excel数据解析课时统计（转换为JSON格式存储，然后转换为ScheduleData展示）
  const parseExcelData = (excelData: any[][]): ScheduleData | null => {
    // 第一步：将Excel数据解析为JSON格式（保留Excel原始结构）
    const jsonData = parseExcelToJSON(excelData)
    
    // 第二步：将JSON格式转换为前端ScheduleData格式用于展示
    return convertJSONToScheduleData(jsonData)
  }

  // 从剪贴板文本解析课时统计
  const parsePasteData = (text: string): ScheduleData | null => {
    const lines = text.split('\n').map((line) => line.trim())
    if (lines.length < 5) {
      throw new Error('数据格式不正确：至少需要表头行和数据行')
    }

    // 转换为二维数组
    const excelData: any[][] = lines.map((line) => {
      // 支持制表符和多个空格分隔
      let cells = line.split(/\t+/)
      if (cells.length === 1 && line.includes('  ')) {
        cells = line.split(/\s{2,}/)
      }
      return cells.map((c) => c.trim())
    })

    return parseExcelData(excelData)
  }

  // 处理Excel文件上传
  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: 'array' })

      const firstSheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[firstSheetName]
      const excelData = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: '' })

      // 第一步：解析为JSON格式（保留Excel原始结构）
      const jsonData = parseExcelToJSON(excelData)
      
      // 第二步：转换为ScheduleData格式用于前端展示
      const importedSchedule = convertJSONToScheduleData(jsonData)

      if (!importedSchedule) {
        throw new Error('未能解析出有效数据')
      }

      // 注意：这里存储的是ScheduleData格式，但JSON格式的数据已经包含在其中
      // 如果需要，可以将jsonData单独存储，或者将jsonData作为schedule的一部分
      // 更新当前月份的schedule
      setScheduleMap((prev) => ({
        ...prev,
        [cacheKey]: importedSchedule,
      }))

      console.log('导入的JSON数据:', jsonData)
      message.success(`Excel数据导入成功，共 ${jsonData.weeks.length} 周数据`)
      setImportModalVisible(false)

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error: any) {
      console.error('Excel导入失败', error)
      message.error(`导入失败：${error.message || '数据格式不正确'}`)
    }
  }

  // 处理剪贴板粘贴
  const handlePasteImport = () => {
    if (!pasteText.trim()) {
      message.warning('请先粘贴数据')
      return
    }

    try {
      const importedSchedule = parsePasteData(pasteText)

      if (!importedSchedule) {
        throw new Error('未能解析出有效数据')
      }

      // 更新当前月份的schedule
      setScheduleMap((prev) => ({
        ...prev,
        [cacheKey]: importedSchedule,
      }))

      setImportModalVisible(false)
      setPasteText('')
      message.success('剪贴板数据导入成功')
    } catch (error: any) {
      console.error('剪贴板导入失败', error)
      message.error(`导入失败：${error.message || '数据格式不正确'}`)
    }
  }

  return (
    <ConfigProvider locale={zhCN}>
      <Card variant="outlined" style={{ backgroundColor: '#f5f7fa' }}>
        <Space align="center" style={{ justifyContent: 'space-between', width: '100%' }}>
          <div>
            <Title level={4} style={{ marginBottom: 4 }}>
              {selectedMonth.format('M月份')} 课时统计表
            </Title>
            <Text type="secondary">按周录入“正课/补课/项目/辅导”，系统自动汇总周合计与月合计</Text>
          </div>
          <Space direction="vertical" align="end">
            <Select
              allowClear={canEditOthers}
              disabled={!canEditOthers}
              placeholder="选择授课教员"
              value={selectedTeacher}
              onChange={(value) => setSelectedTeacher(value || undefined)}
              options={teacherOptions}
              style={{ minWidth: 260 }}
              showSearch
              optionFilterProp="label"
            />
            <Space>
              <Button
                icon={<FileExcelOutlined />}
                onClick={() => {
                  setImportType('excel')
                  setImportModalVisible(true)
                }}
              >
                从Excel导入
              </Button>
              <Button
                icon={<CopyOutlined />}
                onClick={() => {
                  setImportType('paste')
                  setImportModalVisible(true)
                }}
              >
                从剪贴板粘贴
              </Button>
              <DatePicker
                picker="month"
                value={selectedMonth}
                onChange={handleMonthChange}
                allowClear={false}
                format="YYYY年MM月"
              />
              <Button type="primary" onClick={handleSave} loading={saving} disabled={!schedule}>
                保存
              </Button>
            </Space>
          </Space>
        </Space>

        <div style={{ marginTop: 16, marginBottom: 16 }}>
          <Calendar
            fullscreen={false}
            value={selectedMonth}
            onSelect={(value) => handleMonthChange(value)}
            onPanelChange={(value) => handleMonthChange(value)}
          />
        </div>

        <Spin spinning={loading}>
          {!schedule ? (
            <Alert
              type="info"
              message="首次进入该月份时，系统已自动生成可编辑的空表。请选择任意单元格录入数据。"
            />
          ) : (
            <>
              <Alert
                type="success"
                showIcon
                style={{ marginBottom: 16 }}
                message={<span style={{ fontSize: 16, fontWeight: 600 }}>{`神殿：${campusName} — 月度课时合计`}</span>}
                description={
                  <Space size="large" wrap style={{ fontSize: 18, fontWeight: 700 }}>
                    <span>
                      正课合计：<span style={{ fontSize: 22, fontWeight: 800 }}>{schedule.totals.regular}</span>
                    </span>
                    <span>
                      补课合计：<span style={{ fontSize: 22, fontWeight: 800 }}>{schedule.totals.makeup}</span>
                    </span>
                    <span>
                      项目合计：<span style={{ fontSize: 22, fontWeight: 800 }}>{schedule.totals.project}</span>
                    </span>
                    <span>
                      辅导合计：<span style={{ fontSize: 22, fontWeight: 800 }}>{schedule.totals.tutoring}</span>
                    </span>
                  </Space>
                }
              />

              {schedule.weeks.map((week) => renderWeekTable(week, schedule.rows[week.id] || []))}
            </>
          )}
        </Spin>

        {/* 导入Modal */}
        <Modal
          title={importType === 'excel' ? '从Excel导入' : '从剪贴板粘贴'}
          open={importModalVisible}
          onOk={importType === 'excel' ? undefined : handlePasteImport}
          onCancel={() => {
            setImportModalVisible(false)
            setPasteText('')
            if (fileInputRef.current) {
              fileInputRef.current.value = ''
            }
          }}
          okText="导入"
          cancelText="取消"
          width={800}
        >
          {importType === 'excel' ? (
            <div>
              <Alert
                message="Excel导入说明"
                description={
                  <div>
                    <p>• 请选择包含课时统计数据的Excel文件（.xlsx或.xls格式）</p>
                    <p>• 文件应包含表头行（"时间"、"星期一"等）和数据行</p>
                    <p>• 支持按周组织的表格格式，每周以"时间"行开始</p>
                    <p>• 导入的数据会替换当前月份的所有数据</p>
                    <p>• 系统会自动识别月份和日期，并计算周合计和月合计</p>
                  </div>
                }
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleExcelUpload}
                style={{ display: 'block', width: '100%' }}
              />
            </div>
          ) : (
            <div>
              <Alert
                message="剪贴板粘贴说明"
                description={
                  <div>
                    <p>• 从Excel或其他表格中复制数据，然后粘贴到下方文本框</p>
                    <p>• 支持制表符分隔或空格分隔的数据</p>
                    <p>• 数据应包含表头行（"时间"、"星期一"等）和数据行</p>
                    <p>• 支持按周组织的表格格式，每周以"时间"行开始</p>
                    <p>• 导入的数据会替换当前月份的所有数据</p>
                    <p>• 系统会自动识别月份和日期，并计算周合计和月合计</p>
                  </div>
                }
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
              <TextArea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder="请粘贴表格数据（从Excel中复制后直接粘贴）"
                rows={15}
                style={{ fontFamily: 'monospace', fontSize: 12 }}
              />
            </div>
          )}
        </Modal>
      </Card>
    </ConfigProvider>
  )
}

export default TeacherHourStatsPage
