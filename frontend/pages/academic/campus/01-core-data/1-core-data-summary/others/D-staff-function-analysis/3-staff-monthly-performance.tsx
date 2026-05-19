
//TODO:实现多选筛选
import React, { useEffect, useMemo, useState, useCallback } from 'react'
import {
  App,
  Card,
  Table,
  Typography,
  Space,
  Select,
  Button,
  InputNumber,
  Segmented,
  message,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useCampusStore } from '@/stores/campusStore'
import { normalizeCampus } from '@/pages/academic/teaching-content/shared/campusStorage'
import CampusSelector from '@/components/common/CampusSelector'
import { buildApiUrl } from '@/utils/apiBase'

const { Title, Text } = Typography
const { Option } = Select

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, index) => index + 1)

type TeacherName = string

type MetricKey =
  | 'homeworkSubmissionRate'
  | 'homeworkPassRate'
  | 'examPassRate'
  | 'projectPassRate'
  | 'studentSatisfaction'
  | 'studentViolations'
  | 'employmentRate'
  | 'employmentSalary'
  | 'reputationEnrollment'
  | 'reputationIncome'
  | 'newStudentCount'
  | 'refundCount'

const RATE_KEYS: MetricKey[] = [
  'homeworkSubmissionRate',
  'homeworkPassRate',
  'examPassRate',
  'projectPassRate',
  'studentSatisfaction',
  'employmentRate',
]

const AVERAGE_KEYS: MetricKey[] = [...RATE_KEYS, 'employmentSalary', 'studentViolations']

const SUM_KEYS: MetricKey[] = [
  'reputationEnrollment',
  'reputationIncome',
  'newStudentCount',
  'refundCount',
]

const INTEGER_KEYS: MetricKey[] = [
  'studentViolations',
  'reputationEnrollment',
  'newStudentCount',
  'refundCount',
]

const METRIC_KEYS: MetricKey[] = [
  'homeworkSubmissionRate',
  'homeworkPassRate',
  'examPassRate',
  'projectPassRate',
  'studentSatisfaction',
  'studentViolations',
  'employmentRate',
  'employmentSalary',
  'reputationEnrollment',
  'reputationIncome',
  'newStudentCount',
  'refundCount',
]

interface StaffMonthlyPerformanceRecord {
  id: string
  month: number
  teacher: TeacherName
  homeworkSubmissionRate: number
  homeworkPassRate: number
  examPassRate: number
  projectPassRate: number
  studentSatisfaction: number
  studentViolations: number
  employmentRate: number
  employmentSalary: number
  reputationEnrollment: number
  reputationIncome: number
  newStudentCount: number
  refundCount: number
}

type TableRowType = 'data' | 'summary'

type TableRow = Omit<StaffMonthlyPerformanceRecord, 'teacher'> & {
  teacher: TeacherName | '平均'
  key: string
  rowType: TableRowType
  monthRowSpan?: number
  teacherRowSpan?: number
}

type ViewMode = 'month' | 'teacher'

const metricLabels: Record<MetricKey, string> = {
  homeworkSubmissionRate: '作业提交率',
  homeworkPassRate: '作业合格率',
  examPassRate: '考试合格率',
  projectPassRate: '项目合格率',
  studentSatisfaction: '学员满意度',
  studentViolations: '学员违纪',
  employmentRate: '就业率',
  employmentSalary: '就业薪资',
  reputationEnrollment: '口碑报名',
  reputationIncome: '口碑收入',
  newStudentCount: '带新生人数',
  refundCount: '退费人数',
}

type MetricCellProps = {
  value: number
  recordId: string
  metric: MetricKey
  isRate: boolean
  isInteger: boolean
  onChange: (recordId: string, metric: MetricKey, value: number | null) => void
}

const MetricCell: React.FC<MetricCellProps> = React.memo(
  ({ value, recordId, metric, isRate, isInteger, onChange }) => {
    const handleChange = useCallback(
      (val: number | null) => onChange(recordId, metric, val),
      [recordId, metric, onChange],
    )

    const commonProps = {
      min: 0,
      value,
      style: { width: '100%' },
      onChange: handleChange,
    }

    if (isRate) {
      return <InputNumber {...commonProps} max={100} precision={2} addonAfter="%" />
    }

    const precision = isInteger ? 0 : 2
    return <InputNumber {...commonProps} precision={precision} />
  },
  (prev, next) =>
    prev.value === next.value &&
    prev.recordId === next.recordId &&
    prev.metric === next.metric &&
    prev.isRate === next.isRate &&
    prev.isInteger === next.isInteger,
)

const createEmptyRecord = (month: number, teacher: TeacherName): StaffMonthlyPerformanceRecord => ({
  id: `${month}-${teacher}`,
  month,
  teacher,
  homeworkSubmissionRate: 0,
  homeworkPassRate: 0,
  examPassRate: 0,
  projectPassRate: 0,
  studentSatisfaction: 0,
  studentViolations: 0,
  employmentRate: 0,
  employmentSalary: 0,
  reputationEnrollment: 0,
  reputationIncome: 0,
  newStudentCount: 0,
  refundCount: 0,
})

const createDefaultDataset = (teacherNames: string[]): StaffMonthlyPerformanceRecord[] => {
  const rows: StaffMonthlyPerformanceRecord[] = []
  MONTH_OPTIONS.forEach((month) => {
    teacherNames.forEach((teacher) => {
      rows.push(createEmptyRecord(month, teacher))
    })
  })
  return rows
}

const sanitizeRecords = (
  incoming: StaffMonthlyPerformanceRecord[] | null | undefined,
  teacherNames: string[],
): StaffMonthlyPerformanceRecord[] => {
  const fallback = createDefaultDataset(teacherNames)
  if (!Array.isArray(incoming) || incoming.length === 0) {
    return fallback
  }

  const map = new Map<string, StaffMonthlyPerformanceRecord>()
  incoming.forEach((item) => {
    if (item && typeof item === 'object' && typeof item.id === 'string') {
      const month = Number(item.month)
      if (month >= 1 && month <= 12 && teacherNames.includes(item.teacher as TeacherName)) {
        map.set(`${month}-${item.teacher}`, {
          ...createEmptyRecord(month, item.teacher as TeacherName),
          ...item,
          id: `${month}-${item.teacher}`,
          month,
          teacher: item.teacher as TeacherName,
        })
      }
    }
  })

  return fallback.map((defaultItem) => map.get(defaultItem.id) ?? defaultItem)
}

const useSortedDataset = (
  records: StaffMonthlyPerformanceRecord[],
  teacherNames: string[],
): StaffMonthlyPerformanceRecord[] => {
  return useMemo(() => {
    const teacherOrder = new Map<TeacherName, number>()
    teacherNames.forEach((name, index) => teacherOrder.set(name, index))
    return [...records].sort((a, b) => {
      if (a.month !== b.month) {
        return a.month - b.month
      }
      const orderDiff = (teacherOrder.get(a.teacher) ?? 0) - (teacherOrder.get(b.teacher) ?? 0)
      return orderDiff !== 0 ? orderDiff : a.teacher.localeCompare(b.teacher, 'zh-CN')
    })
  }, [records])
}

const StaffMonthlyPerformanceTable: React.FC = () => {
  const { currentCampus, getAllCampuses } = useCampusStore()
  const resolvedCampus = normalizeCampus(currentCampus ?? getAllCampuses()[0]?.name ?? '主神殿')

  const [teacherNames, setTeacherNames] = useState<string[]>(['张三', '李四', '王五', '赵六'])
  const [records, setRecords] = useState<StaffMonthlyPerformanceRecord[]>(
    createDefaultDataset(['张三', '李四', '王五', '赵六']),
  )
  const [filterMonth, setFilterMonth] = useState<number | 'all'>('all')
  const [filterTeacher, setFilterTeacher] = useState<TeacherName | 'all'>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [loading, setLoading] = useState(false)
  const [autoLoading, setAutoLoading] = useState(false)
  const [year, setYear] = useState<number>(new Date().getFullYear())
  const [saving, setSaving] = useState(false)
  const [dataLoaded, setDataLoaded] = useState(false)

  // 拉取教员列表
  useEffect(() => {
    const loadTeachers = async () => {
      setLoading(true)
      try {
        const res = await fetch(
          `${buildApiUrl('/config/teachers')}?campus_name=${encodeURIComponent(resolvedCampus)}`,
        )
        if (res.ok) {
          const data: { name?: string }[] = await res.json()
          const names = data.map((t) => (t.name || '').trim()).filter(Boolean)
          if (names.length) {
            setTeacherNames(names)
            setRecords((prev) => sanitizeRecords(prev, names))
            return
          }
        }
        const resAll = await fetch(buildApiUrl('/config/teachers'))
        if (resAll.ok) {
          const data: { name?: string }[] = await resAll.json()
          const names = data.map((t) => (t.name || '').trim()).filter(Boolean)
          if (names.length) {
            setTeacherNames(names)
            setRecords((prev) => sanitizeRecords(prev, names))
            return
          }
        }
        message.warning('未获取到教员列表，使用默认姓名')
      } catch (error) {
        console.error('[员工业绩逐月] 加载教员列表失败:', error)
      } finally {
        setLoading(false)
      }
    }
    loadTeachers()
  }, [resolvedCampus])

  // 从后端加载数据
  useEffect(() => {
    const loadFromBackend = async () => {
      if (!teacherNames.length) return
      setLoading(true)
      try {
        const res = await fetch(
          buildApiUrl(`/staff-monthly-performance?campus=${encodeURIComponent(resolvedCampus)}&year=${year}`),
        )
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data) && data.length > 0) {
            // 后端有数据，转换格式
            const backendRecords: StaffMonthlyPerformanceRecord[] = data.map((item: any) => ({
              id: item.id || `${item.month}-${item.teacher}`,
              month: item.month,
              teacher: item.teacher,
              homeworkSubmissionRate: item.homeworkSubmissionRate || 0,
              homeworkPassRate: item.homeworkPassRate || 0,
              examPassRate: item.examPassRate || 0,
              projectPassRate: item.projectPassRate || 0,
              studentSatisfaction: item.studentSatisfaction || 0,
              studentViolations: item.studentViolations || 0,
              employmentRate: item.employmentRate || 0,
              employmentSalary: item.employmentSalary || 0,
              reputationEnrollment: item.reputationEnrollment || 0,
              reputationIncome: item.reputationIncome || 0,
              newStudentCount: item.newStudentCount || 0,
              refundCount: item.refundCount || 0,
            }))
            setRecords(sanitizeRecords(backendRecords, teacherNames))
            setDataLoaded(true)
            return
          }
        }
        // 后端没有数据，使用默认数据集
        setRecords(createDefaultDataset(teacherNames))
        setDataLoaded(true)
      } catch (error) {
        console.error('[员工业绩逐月] 加载后端数据失败:', error)
        setRecords(createDefaultDataset(teacherNames))
        setDataLoaded(true)
      } finally {
        setLoading(false)
      }
    }
    loadFromBackend()
  }, [resolvedCampus, teacherNames, year])

  // 保存数据到后端
  const handleSaveToBackend = useCallback(async () => {
    if (!records.length) return
    setSaving(true)
    try {
      const res = await fetch(
        buildApiUrl(`/staff-monthly-performance?campus=${encodeURIComponent(resolvedCampus)}&year=${year}`),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ records }),
        },
      )
      if (res.ok) {
        message.success('数据保存成功')
      } else {
        const error = await res.json()
        message.error(`保存失败: ${error.detail || '未知错误'}`)
      }
    } catch (error) {
      console.error('[员工业绩逐月] 保存数据失败:', error)
      message.error('保存数据失败')
    } finally {
      setSaving(false)
    }
  }, [records, resolvedCampus, year])

  // 自动填充作业提交率/合格率（按选择年份）
  useEffect(() => {
    const fillAssignmentRates = async () => {
      if (!teacherNames.length || !dataLoaded) return
      setAutoLoading(true)
      try {
        const res = await fetch(
          `${buildApiUrl('/assignment-stats/assignment-monthly')}?campus=${encodeURIComponent(resolvedCampus)}&year=${year}`,
        )
        if (!res.ok) return
        const data: Array<{
          teacher_name: string
          month: number
          submit_rate?: number
          pass_rate?: number
        }> = await res.json()
        if (!Array.isArray(data) || !data.length) return
        const normalize = (t: string) => (t || '').trim()
        const mapped = new Map<string, Record<number, { submit?: number; pass?: number }>>()
        data.forEach((item) => {
          const name = normalize(item.teacher_name)
          if (!name) return
          const m = Number(item.month)
          if (m < 1 || m > 12) return
          const entry = mapped.get(name) || {}
          entry[m] = { submit: item.submit_rate, pass: item.pass_rate }
          mapped.set(name, entry)
        })
        if (!mapped.size) return
        setRecords((prev) =>
          prev.map((rec) => {
            const teacherMap = mapped.get(normalize(rec.teacher))
            if (!teacherMap) return rec
            const rate = teacherMap[rec.month]
            if (!rate) return rec
            return {
              ...rec,
              homeworkSubmissionRate:
                rate.submit !== undefined ? Number(rate.submit) : rec.homeworkSubmissionRate,
              homeworkPassRate: rate.pass !== undefined ? Number(rate.pass) : rec.homeworkPassRate,
            }
          }),
        )
      } catch (error) {
        console.error('[员工业绩逐月] 自动填充作业率失败:', error)
      } finally {
        setAutoLoading(false)
      }
    }
    fillAssignmentRates()
  }, [resolvedCampus, teacherNames, year, dataLoaded])

  // 自动填充考试合格率（按选择年份）
  useEffect(() => {
    const fillExamPassRate = async () => {
      if (!teacherNames.length || !dataLoaded) return
      setAutoLoading(true)
      try {
        const res = await fetch(
          `${buildApiUrl('/exam-stats/exam-monthly')}?campus=${encodeURIComponent(resolvedCampus)}&year=${year}`,
        )
        if (!res.ok) return
        const data: Array<{ teacher_name: string; month: number; pass_rate?: number }> = await res.json()
        if (!Array.isArray(data) || !data.length) return
        const normalize = (t: string) => (t || '').trim()
        const mapped = new Map<string, Record<number, number | undefined>>()
        data.forEach((item) => {
          const name = normalize(item.teacher_name)
          if (!name) return
          const m = Number(item.month)
          if (m < 1 || m > 12) return
          const entry = mapped.get(name) || {}
          entry[m] = item.pass_rate
          mapped.set(name, entry)
        })
        if (!mapped.size) return
        setRecords((prev) =>
          prev.map((rec) => {
            const teacherMap = mapped.get(normalize(rec.teacher))
            if (!teacherMap) return rec
            const rate = teacherMap[rec.month]
            if (rate === undefined || rate === null) return rec
            return {
              ...rec,
              examPassRate: Number(rate),
            }
          }),
        )
      } catch (error) {
        console.error('[员工业绩逐月] 自动填充考试合格率失败:', error)
      } finally {
        setAutoLoading(false)
      }
    }
    fillExamPassRate()
  }, [resolvedCampus, teacherNames, year, dataLoaded])

  // 自动填充项目合格率（按选择年份）
  useEffect(() => {
    const fillProjectPassRate = async () => {
      if (!teacherNames.length || !dataLoaded) return
      setAutoLoading(true)
      try {
        const res = await fetch(
          `${buildApiUrl('/project-stats/project-monthly')}?campus=${encodeURIComponent(resolvedCampus)}&year=${year}`,
        )
        if (!res.ok) return
        const data: Array<{ teacher_name: string; month: number; pass_rate?: number }> = await res.json()
        if (!Array.isArray(data) || !data.length) return
        const normalize = (t: string) => (t || '').trim()
        const mapped = new Map<string, Record<number, number | undefined>>()
        data.forEach((item) => {
          const name = normalize(item.teacher_name)
          if (!name) return
          const m = Number(item.month)
          if (m < 1 || m > 12) return
          const entry = mapped.get(name) || {}
          entry[m] = item.pass_rate
          mapped.set(name, entry)
        })
        if (!mapped.size) return
        setRecords((prev) =>
          prev.map((rec) => {
            const teacherMap = mapped.get(normalize(rec.teacher))
            if (!teacherMap) return rec
            const rate = teacherMap[rec.month]
            if (rate === undefined || rate === null) return rec
            return {
              ...rec,
              projectPassRate: Number(rate),
            }
          }),
        )
      } catch (error) {
        console.error('[员工业绩逐月] 自动填充项目合格率失败:', error)
      } finally {
        setAutoLoading(false)
      }
    }
    fillProjectPassRate()
  }, [resolvedCampus, teacherNames, year, dataLoaded])

  // 自动填充学员满意度（按选择年份）
  useEffect(() => {
    const fillSatisfaction = async () => {
      if (!teacherNames.length || !dataLoaded) return
      setAutoLoading(true)
      try {
        const res = await fetch(
          `${buildApiUrl('/satisfaction-stats/satisfaction-monthly')}?campus=${encodeURIComponent(resolvedCampus)}&year=${year}`,
        )
        if (!res.ok) return
        const data: Array<{ teacher_name: string; month: number; score?: number }> = await res.json()
        if (!Array.isArray(data) || !data.length) return
          const normalize = (t: string) => (t || '').trim()
          const mapped = new Map<string, Record<number, number | undefined>>()
          data.forEach((item) => {
            const name = normalize(item.teacher_name)
            if (!name) return
            const m = Number(item.month)
            if (m < 1 || m > 12) return
            const entry = mapped.get(name) || {}
            entry[m] = item.score
            mapped.set(name, entry)
          })
        if (!mapped.size) return
        setRecords((prev) =>
          prev.map((rec) => {
            const teacherMap = mapped.get(normalize(rec.teacher))
            if (!teacherMap) return rec
            const val = teacherMap[rec.month]
            if (val === undefined || val === null) return rec
            return {
              ...rec,
              studentSatisfaction: Number(val) * 20,
            }
          }),
        )
      } catch (error) {
        console.error('[员工业绩逐月] 自动填充满意度失败:', error)
      } finally {
        setAutoLoading(false)
      }
    }
    fillSatisfaction()
  }, [resolvedCampus, teacherNames, year, dataLoaded])
  // 自动填充学员违纪（按选择年份）
  useEffect(() => {
    const fillViolations = async () => {
      if (!teacherNames.length || !dataLoaded) return
      setAutoLoading(true)
      try {
        const res = await fetch(
          `${buildApiUrl('/violation-stats/violation-monthly')}?campus=${encodeURIComponent(resolvedCampus)}&year=${year}`,
        )
        if (!res.ok) return
        const data: Array<{ teacher_name: string; month: number; count?: number }> = await res.json()
        if (!Array.isArray(data) || !data.length) return
        const normalize = (t: string) => (t || '').trim()
        const mapped = new Map<string, Record<number, number | undefined>>()
        data.forEach((item) => {
          const name = normalize(item.teacher_name)
          if (!name) return
          const m = Number(item.month)
          if (m < 1 || m > 12) return
          const entry = mapped.get(name) || {}
          entry[m] = item.count
          mapped.set(name, entry)
        })
        if (!mapped.size) return
        setRecords((prev) =>
          prev.map((rec) => {
            const teacherMap = mapped.get(normalize(rec.teacher))
            if (!teacherMap) return rec
            const val = teacherMap[rec.month]
            if (val === undefined || val === null) return rec
            return {
              ...rec,
              studentViolations: Number(val),
            }
          }),
        )
      } catch (error) {
        console.error('[员工业绩逐月] 自动填充学员违纪失败:', error)
      } finally {
        setAutoLoading(false)
      }
    }
    fillViolations()
  }, [resolvedCampus, teacherNames, year, dataLoaded])

  // 自动填充就业率/就业薪资（按选择年份）
  useEffect(() => {
    const fillEmployment = async () => {
      if (!teacherNames.length || !dataLoaded) return
      setAutoLoading(true)
      try {
        const res = await fetch(
          buildApiUrl(`/staff-employment-stats?campus=${encodeURIComponent(resolvedCampus)}&year=${year}`),
        )
        if (!res.ok) return
        const data: Array<{
          teacher_name: string
          month: number
          employment_rate?: number | null
          employment_salary?: number | null
        }> = await res.json()
        if (!Array.isArray(data) || !data.length) return

        const normalize = (t: string) => (t || '').trim()
        const mapped = new Map<string, Record<number, { rate?: number | null; salary?: number | null }>>()
        data.forEach((item) => {
          const name = normalize(item.teacher_name)
          if (!name) return
          const m = Number(item.month)
          if (m < 1 || m > 12) return
          const entry = mapped.get(name) || {}
          entry[m] = { rate: item.employment_rate, salary: item.employment_salary }
          mapped.set(name, entry)
        })
        if (!mapped.size) return

        setRecords((prev) =>
          prev.map((rec) => {
            const teacherMap = mapped.get(normalize(rec.teacher))
            if (!teacherMap) return rec
            const val = teacherMap[rec.month]
            if (!val) return rec
            return {
              ...rec,
              employmentRate:
                val.rate !== undefined && val.rate !== null ? Number(val.rate) : rec.employmentRate,
              employmentSalary:
                val.salary !== undefined && val.salary !== null ? Number(val.salary) : rec.employmentSalary,
            }
          }),
        )
      } catch (error) {
        console.error('[员工业绩逐月] 自动填充就业数据失败:', error)
      } finally {
        setAutoLoading(false)
      }
    }
    fillEmployment()
  }, [resolvedCampus, teacherNames, year, dataLoaded])

  // 自动填充口碑报名/口碑收入（按选择年份）
  useEffect(() => {
    const fillReputationStats = async () => {
      if (!teacherNames.length || !dataLoaded) return
      setAutoLoading(true)
      try {
        const res = await fetch(
          buildApiUrl(`/reputation-stats/monthly?campus=${encodeURIComponent(resolvedCampus)}&year=${year}`),
        )
        if (!res.ok) return
        const data: Array<{
          teacher_name: string
          month: number
          reputation_enrollment?: number | null
          reputation_income?: number | null
        }> = await res.json()
        if (!Array.isArray(data) || !data.length) return

        const normalize = (t: string) => (t || '').trim()
        const mapped = new Map<string, Record<number, { enrollment?: number | null; income?: number | null }>>()
        data.forEach((item) => {
          const name = normalize(item.teacher_name)
          if (!name) return
          const m = Number(item.month)
          if (m < 1 || m > 12) return
          const entry = mapped.get(name) || {}
          entry[m] = { enrollment: item.reputation_enrollment, income: item.reputation_income }
          mapped.set(name, entry)
        })
        if (!mapped.size) return

        setRecords((prev) =>
          prev.map((rec) => {
            const teacherMap = mapped.get(normalize(rec.teacher))
            if (!teacherMap) return rec
            const val = teacherMap[rec.month]
            if (!val) return rec
            return {
              ...rec,
              reputationEnrollment:
                val.enrollment !== undefined && val.enrollment !== null ? Number(val.enrollment) : rec.reputationEnrollment,
              reputationIncome:
                val.income !== undefined && val.income !== null ? Number(val.income) : rec.reputationIncome,
            }
          }),
        )
      } catch (error) {
        console.error('[员工业绩逐月] 自动填充口碑数据失败:', error)
      } finally {
        setAutoLoading(false)
      }
    }
    fillReputationStats()
  }, [resolvedCampus, teacherNames, year, dataLoaded])

  // 自动填充带新生人数（按选择年份）
  useEffect(() => {
    const fillNewStudentCount = async () => {
      if (!teacherNames.length || !dataLoaded) return
      setAutoLoading(true)
      try {
        const res = await fetch(
          buildApiUrl(`/reputation-stats/new-students-monthly?campus=${encodeURIComponent(resolvedCampus)}&year=${year}`),
        )
        if (!res.ok) return
        const data: Array<{
          teacher_name: string
          month: number
          new_student_count?: number | null
        }> = await res.json()
        if (!Array.isArray(data) || !data.length) return

        const normalize = (t: string) => (t || '').trim()
        const mapped = new Map<string, Record<number, number | null | undefined>>()
        data.forEach((item) => {
          const name = normalize(item.teacher_name)
          if (!name) return
          const m = Number(item.month)
          if (m < 1 || m > 12) return
          const entry = mapped.get(name) || {}
          entry[m] = item.new_student_count
          mapped.set(name, entry)
        })
        if (!mapped.size) return

        setRecords((prev) =>
          prev.map((rec) => {
            const teacherMap = mapped.get(normalize(rec.teacher))
            if (!teacherMap) return rec
            const val = teacherMap[rec.month]
            if (val === undefined || val === null) return rec
            return {
              ...rec,
              newStudentCount: Number(val),
            }
          }),
        )
      } catch (error) {
        console.error('[员工业绩逐月] 自动填充带新生人数失败:', error)
      } finally {
        setAutoLoading(false)
      }
    }
    fillNewStudentCount()
  }, [resolvedCampus, teacherNames, year, dataLoaded])

  // 自动填充退费人数（按选择年份）
  useEffect(() => {
    const fillRefundCount = async () => {
      if (!teacherNames.length || !dataLoaded) return
      setAutoLoading(true)
      try {
        const res = await fetch(
          buildApiUrl(`/reputation-stats/refunds-monthly?campus=${encodeURIComponent(resolvedCampus)}&year=${year}`),
        )
        if (!res.ok) return
        const data: Array<{
          teacher_name: string
          month: number
          refund_count?: number | null
        }> = await res.json()
        if (!Array.isArray(data) || !data.length) return

        const normalize = (t: string) => (t || '').trim()
        const mapped = new Map<string, Record<number, number | null | undefined>>()
        data.forEach((item) => {
          const name = normalize(item.teacher_name)
          if (!name) return
          const m = Number(item.month)
          if (m < 1 || m > 12) return
          const entry = mapped.get(name) || {}
          entry[m] = item.refund_count
          mapped.set(name, entry)
        })
        if (!mapped.size) return

        setRecords((prev) =>
          prev.map((rec) => {
            const teacherMap = mapped.get(normalize(rec.teacher))
            if (!teacherMap) return rec
            const val = teacherMap[rec.month]
            if (val === undefined || val === null) return rec
            return {
              ...rec,
              refundCount: Number(val),
            }
          }),
        )
      } catch (error) {
        console.error('[员工业绩逐月] 自动填充退费人数失败:', error)
      } finally {
        setAutoLoading(false)
      }
    }
    fillRefundCount()
  }, [resolvedCampus, teacherNames, year, dataLoaded])

  const sortedRecords = useSortedDataset(records, teacherNames)

  const filteredRecords = useMemo(() => {
    return sortedRecords.filter((record) => {
      const monthMatch = filterMonth === 'all' || record.month === filterMonth
      const teacherMatch = filterTeacher === 'all' || record.teacher === filterTeacher
      return monthMatch && teacherMatch
    })
  }, [sortedRecords, filterMonth, filterTeacher])

  const groupedRows = useMemo(() => {
    const monthMap = new Map<number, StaffMonthlyPerformanceRecord[]>()
    filteredRecords.forEach((record) => {
      const list = monthMap.get(record.month) ?? []
      list.push(record)
      monthMap.set(record.month, list)
    })
    return Array.from(monthMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([month, entries]) => ({ month, entries }))
  }, [filteredRecords])

  const monthViewRows = useMemo<TableRow[]>(() => {
    const rows: TableRow[] = []

    groupedRows.forEach(({ month, entries }) => {
      const count = entries.length + 1 // +1 for monthly summary
      entries.forEach((entry, index) => {
        rows.push({
          ...entry,
          key: entry.id,
          rowType: 'data',
          monthRowSpan: index === 0 ? count : 0,
          teacherRowSpan: 0,
        })
      })

      const aggregate = createEmptyRecord(month, teacherNames[0] ?? '')
      entries.forEach((entry) => {
        METRIC_KEYS.forEach((metric) => {
          if (AVERAGE_KEYS.includes(metric) || SUM_KEYS.includes(metric)) {
            aggregate[metric] += entry[metric]
          }
        })
      })

      const summaryRow: TableRow = {
        ...aggregate,
        id: `summary-${month}`,
        key: `summary-${month}`,
        teacher: '平均',
        rowType: 'summary',
        month,
        monthRowSpan: 0,
        teacherRowSpan: 0,
      }

      const divisor = entries.length > 0 ? entries.length : 1
      AVERAGE_KEYS.forEach((metric) => {
        summaryRow[metric] = Number((summaryRow[metric] / divisor).toFixed(2))
      })
      SUM_KEYS.forEach((metric) => {
        summaryRow[metric] = Number(summaryRow[metric].toFixed(2))
      })

      rows.push(summaryRow)
    })

    return rows
  }, [groupedRows])

  const teacherViewRows = useMemo<TableRow[]>(() => {
    const rows: TableRow[] = []
    const months = filterMonth === 'all' ? MONTH_OPTIONS : [filterMonth as number]
    const teachers =
      filterTeacher === 'all'
        ? teacherNames
        : teacherNames.filter((name) => name === filterTeacher)

    teachers.forEach((teacher) => {
      const teacherEntries = months.map((month) => {
        const match = records.find((item) => item.teacher === teacher && item.month === month)
        return match ?? createEmptyRecord(month, teacher)
      })

      teacherEntries.forEach((entry, index) => {
        rows.push({
          ...entry,
          key: `${teacher}-${entry.month}`,
          rowType: 'data',
          teacherRowSpan: index === 0 ? teacherEntries.length + 1 : 0,
          monthRowSpan: 0,
        })
      })

      const aggregate = createEmptyRecord(0, teacher)
      teacherEntries.forEach((entry) => {
        METRIC_KEYS.forEach((metric) => {
          if (AVERAGE_KEYS.includes(metric) || SUM_KEYS.includes(metric)) {
            aggregate[metric] += entry[metric]
          }
        })
      })

      const divisor = teacherEntries.length > 0 ? teacherEntries.length : 1
    const summaryRow: TableRow = {
      ...aggregate,
      id: `teacher-summary-${teacher}`,
      key: `teacher-summary-${teacher}`,
      teacher: '平均',
        rowType: 'summary',
        month: 0,
        teacherRowSpan: 0,
        monthRowSpan: 0,
      }
      AVERAGE_KEYS.forEach((metric) => {
        summaryRow[metric] = Number((summaryRow[metric] / divisor).toFixed(2))
      })
      SUM_KEYS.forEach((metric) => {
        summaryRow[metric] = Number(summaryRow[metric].toFixed(2))
      })

      rows.push(summaryRow)
    })

    return rows
  }, [records, filterMonth, filterTeacher])

  const displayRows = viewMode === 'month' ? monthViewRows : teacherViewRows

  const handleValueChange = useCallback((recordId: string, metric: MetricKey, value: number | null) => {
    setRecords((prev) =>
      prev.map((item) => {
        if (item.id !== recordId) return item
        const numeric = Number(value ?? 0)
        if (!Number.isFinite(numeric) || numeric < 0) {
          return { ...item, [metric]: 0 }
        }
        if (RATE_KEYS.includes(metric)) {
          return { ...item, [metric]: Math.max(0, Math.min(100, Number(numeric.toFixed(2)))) }
        }
        if (INTEGER_KEYS.includes(metric)) {
          return { ...item, [metric]: Math.max(0, Math.round(numeric)) }
        }
        return { ...item, [metric]: Number(numeric.toFixed(2)) }
      }),
    )
  }, [])

  const handleReset = () => {
    setRecords(createDefaultDataset(teacherNames))
    message.success('已重置为默认模板')
  }

  const columns: ColumnsType<TableRow> = [
    {
      title: '月份',
      dataIndex: 'month',
      key: 'month',
      width: 80,
      align: 'center',
      render: (value, record) => {
        if (viewMode === 'month') {
          return record.monthRowSpan && record.monthRowSpan > 0 ? `${value}月` : ''
        }
        if (record.rowType === 'summary') {
          return ''
        }
        return value ? `${value}月` : ''
      },
      onCell: (record) =>
        viewMode === 'month'
          ? {
              rowSpan: record.monthRowSpan,
            }
          : { rowSpan: 1 },
    },
    {
      title: '教员姓名',
      dataIndex: 'teacher',
      key: 'teacher',
      width: 120,
      align: 'center',
      render: (text, record) => (record.rowType === 'summary' ? <Text strong>{text}</Text> : text),
      onCell: (record) =>
        viewMode === 'teacher'
          ? {
              rowSpan:
                record.teacherRowSpan === 0
                  ? 0
                  : record.teacherRowSpan && record.teacherRowSpan > 0
                    ? record.teacherRowSpan
                    : 1,
            }
          : { rowSpan: 1 },
    },
    ...METRIC_KEYS.map((metric) => ({
      title: metricLabels[metric],
      dataIndex: metric,
      key: metric,
      width: 120,
      align: 'right' as const,
      shouldCellUpdate: (record, prev) => {
        if (record.rowType !== prev.rowType) return true
        return (record as any)[metric] !== (prev as any)[metric]
      },
      render: (value: number, record: TableRow) => {
        if (record.rowType === 'summary') {
          if (RATE_KEYS.includes(metric)) {
            return <Text strong>{value.toFixed(2)}%</Text>
          }
          if (INTEGER_KEYS.includes(metric)) {
            return <Text strong>{Math.round(value)}</Text>
          }
          return <Text strong>{value.toFixed(2)}</Text>
        }

        const isRate = RATE_KEYS.includes(metric)
        const isInteger = INTEGER_KEYS.includes(metric)
        return (
          <MetricCell
            value={value}
            recordId={record.id}
            metric={metric}
            isRate={isRate}
            isInteger={isInteger}
            onChange={handleValueChange}
          />
        )
      },
    })),
  ]

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={
          <Title
            level={3}
            style={{ margin: 0 }}
          >{`${resolvedCampus}智慧司员工业绩逐月统计表`}</Title>
        }
        extra={
          <Space>
            <Button onClick={handleReset}>重置数据</Button>
            <Button type="primary" onClick={handleSaveToBackend} loading={saving}>
              保存数据
            </Button>
          </Space>
        }
      >
        <Space wrap style={{ marginBottom: 16 }} align="center">
          <CampusSelector />
          <Segmented<ViewMode>
            value={viewMode}
            onChange={(val) => setViewMode(val as ViewMode)}
            options={[
              { label: '按月份查看', value: 'month' },
              { label: '按教员查看', value: 'teacher' },
            ]}
          />
          <Space>
            <Text>年份</Text>
            <InputNumber
              min={2000}
              max={2100}
              value={year}
              onChange={(v) => setYear(Number(v || new Date().getFullYear()))}
              style={{ width: 120 }}
            />
          </Space>
          <Space>
            <Text>筛选月份</Text>
            <Select<number | 'all'>
              value={filterMonth}
              style={{ width: 140 }}
              onChange={(value) => setFilterMonth(value)}
            >
              <Option value="all">全部月份</Option>
              {MONTH_OPTIONS.map((month) => (
                <Option key={month} value={month}>{`${month}月`}</Option>
              ))}
            </Select>
          </Space>
          <Space>
            <Text>筛选教员</Text>
            <Select<TeacherName | 'all'>
              value={filterTeacher}
              style={{ width: 140 }}
              onChange={(value) => setFilterTeacher(value)}
            >
              <Option value="all">全部教员</Option>
              {teacherNames.map((name) => (
                <Option key={name} value={name}>
                  {name}
                </Option>
              ))}
            </Select>
          </Space>
        </Space>

        <Table<TableRow>
          columns={columns}
          dataSource={displayRows}
          rowKey="key"
          pagination={false}
          bordered
          size="small"
          scroll={{ x: 1400, y: 640 }}
          loading={loading || autoLoading}
          virtual
          locale={{ emptyText: '暂无数据，请录入或调整筛选条件。' }}
        />
      </Card>
    </div>
  )
}

export default StaffMonthlyPerformanceTable