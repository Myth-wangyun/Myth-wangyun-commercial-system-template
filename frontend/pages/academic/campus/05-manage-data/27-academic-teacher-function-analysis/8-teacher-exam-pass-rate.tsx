// 学术->学术经理->管理表格 XX神殿智慧司教员考试合格率（后端持久化）
//智慧司教员功能分析总表
import React, { useMemo, useState, useEffect } from 'react'
import { App, Card, Table, Typography, InputNumber, Space, Button, Input, Row, Col } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useCampusStore } from '@/stores/campusStore'
import {
  getTeacherFunctionPlan,
  saveTeacherFunctionPlan,
  type TeacherFunctionRow,
} from '@/services/teacherFunctionAnalysis'
import { getSubtable, saveSubtable } from '@/services/teacherFunctionSubtable'
import { fetchTeachers, type TeacherProfile } from '@/services/configMaster'
import { classAssignmentGradeService, classExamScoreService, projectGradeRegisterService, studentSatisfactionDetailService, teacherYearlyLectureScoreSummaryService, teacherLectureScoreSheetService } from '@/services/service'

import { getViolation } from '@/services/teacherViolation'
import { getSuperiorAudit } from '@/services/teacherSuperiorAudit'
import { getTeacherEmploymentSummaries } from '@/services/teacherEmploymentSummary'
import { GlobalYearSelector } from '@/components/common'
import { buildApiUrl } from '@/utils/apiBase'

const { Title } = Typography
const toFixedOrEmpty = (v?: number) =>
  typeof v === 'number' && !Number.isNaN(v) ? Number(v.toFixed(2)) : undefined

// 仅包含数值字段的键，便于类型收窄
type NumericKey =
  | 'employmentRate'
  | 'employmentSalary'
  | 'reputationCount'
  | 'reputationIncome'
  | 'newStudentCount'
  | 'newStudentLoss'
  | 'homeworkSubmit'
  | 'homeworkPass'
  | 'examPass'
  | 'projectSubmit'
  | 'projectPass'
  | 'satisfaction'
  | 'violation'
  | 'superiorAudit'

const numericKeys: NumericKey[] = [
  'employmentRate',
  'employmentSalary',
  'reputationCount',
  'reputationIncome',
  'newStudentCount',
  'newStudentLoss',
  'homeworkSubmit',
  'homeworkPass',
  'examPass',
  'projectSubmit',
  'projectPass',
  'satisfaction',
  'violation',
  'superiorAudit',
]

const buildInitial = (): TeacherFunctionRow[] => {
  const rows: TeacherFunctionRow[] = Array.from({ length: 10 }).map((_, i) => ({
    key: `r-${i + 1}`,
    index: i + 1,
    name: '',
    // 合计字段初始化为0（业务规则：没有值按0计算）
    reputationCount: 0,
    reputationIncome: 0,
    newStudentCount: 0,
    newStudentLoss: 0,
    violation: 0,
  }))
  rows.push({ key: 'avg', index: 0, name: '', rowType: 'avg' })
  return rows
}

const TeacherExamPassRatePage: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore()
  const now = new Date()
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear())
  const fixedMonth = 1
  const [rows, setRows] = useState<TeacherFunctionRow[]>(() => buildInitial())
  const [loading, setLoading] = useState(false)
  const [teacherOptions, setTeacherOptions] = useState<string[]>([])
  // 保存就业汇总数据用于计算平均值
  const [employmentSummary, setEmploymentSummary] = useState<{
    totalEmployed: number
    totalRequired: number
    totalSalary: number
    employedCount: number
  }>({ totalEmployed: 0, totalRequired: 0, totalSalary: 0, employedCount: 0 })

  const campusName = currentCampus || '主神殿'

  // 计算平均/合计行
  const dataWithAvg = useMemo(() => {
    const data = rows.filter((r) => r.rowType !== 'avg')
    const avg: TeacherFunctionRow = { key: 'avg', index: 0, name: '', rowType: 'avg' }
    
    // 定义需要合计的字段（没有值按0算）
    const sumFields: NumericKey[] = ['reputationCount', 'reputationIncome', 'newStudentCount', 'newStudentLoss', 'violation']
    // 定义需要平均的字段（没有值不参与计算）
    const avgFields: NumericKey[] = ['homeworkSubmit', 'homeworkPass', 'examPass', 'projectSubmit', 'projectPass', 'satisfaction', 'superiorAudit']
    
    numericKeys.forEach((k: NumericKey) => {
      if (sumFields.includes(k)) {
        // 合计计算：没有值按0算
        const sum = data.reduce((acc, r) => {
          const val = (r[k] as number) ?? 0
          return acc + val
        }, 0)
        avg[k] = sum as TeacherFunctionRow[NumericKey]
      } else if (k === 'employmentRate') {
        // 就业率特殊计算：总就业人数 / 总需就业人数
        if (employmentSummary.totalRequired > 0) {
          avg[k] = toFixedOrEmpty((employmentSummary.totalEmployed / employmentSummary.totalRequired) * 100) as TeacherFunctionRow[NumericKey]
        }
      } else if (k === 'employmentSalary') {
        // 就业薪资：各个教员就业薪资的简单平均
        const vals = data
          .map((r) => (r[k] as number) ?? undefined)
          .filter((v) => typeof v === 'number') as number[]
        if (vals.length) {
          const sum = vals.reduce((a, b) => a + b, 0)
          avg[k] = toFixedOrEmpty(sum / vals.length) as TeacherFunctionRow[NumericKey]
        }
        // 就业薪资特殊计算：总薪资 / 总就业人数
        //         if (employmentSummary.employedCount > 0) {
        //   avg[k] = toFixedOrEmpty(employmentSummary.totalSalary / employmentSummary.employedCount) as TeacherFunctionRow[NumericKey]
        // }
      } else if (avgFields.includes(k)) {
        // 平均计算：没有值不参与计算
        const vals = data
          .map((r) => (r[k] as number) ?? undefined)
          .filter((v) => typeof v === 'number') as number[]
        if (vals.length) {
          const sum = vals.reduce((a, b) => a + b, 0)
          avg[k] = toFixedOrEmpty(sum / vals.length) as TeacherFunctionRow[NumericKey]
        }
      }
    })
    const withoutOldAvg = rows.filter((r) => r.rowType !== 'avg')
    return [...withoutOldAvg, avg]
  }, [rows, employmentSummary])

  const mapFromApi = (list: any[]): TeacherFunctionRow[] =>
    (list || [])
      .filter((item) => item.姓名) // 只保留有姓名的数据行
      .map((item, idx) => ({
        key: `r-${idx + 1}`,
        index: idx + 1, // 重新编号从1开始
        name: item.姓名 || '',
        employmentRate: item.就业率 ?? undefined,
        employmentSalary: item.就业薪资 ?? undefined,
        // 合计字段：没有值按0计算
        reputationCount: item.口碑人数 ?? 0,
        reputationIncome: item.口碑收入 ?? 0,
        newStudentCount: item.带新生人数 ?? 0,
        newStudentLoss: item.新生流失人数 ?? 0,
        homeworkSubmit: item.作业提交率 ?? undefined,
        homeworkPass: item.作业合格率 ?? undefined,
        examPass: item.考试合格率 ?? undefined,
        projectSubmit: item.项目提交率 ?? undefined,
        projectPass: item.项目合格率 ?? undefined,
        satisfaction: item.学员满意度 ?? undefined,
        violation: item.学员违纪 ?? 0,
        superiorAudit: item.上级听课 ?? undefined,
      }))

  const mapFromSubtable = (list: any[]): TeacherFunctionRow[] =>
    (list || [])
      .filter((item: any) => item.姓名) // 只保留有姓名的数据行
      .map((item: any, idx: number) => ({
        key: `r-${idx + 1}`,
        index: idx + 1, // 重新编号从1开始
        name: item.姓名 || '',
        examPass: item.m1 ?? undefined, // 使用 m1..m12 代表1-12月听课成绩
        // 其余字段暂不使用
        projectSubmit: item.m2 ?? undefined,
        projectPass: item.m3 ?? undefined,
        homeworkSubmit: item.m4 ?? undefined,
        homeworkPass: item.m5 ?? undefined,
        employmentRate: item.m6 ?? undefined,
        employmentSalary: item.m7 ?? undefined,
        // 合计字段：没有值按0计算
        reputationCount: item.m8 ?? 0,
        reputationIncome: item.m9 ?? 0,
        newStudentCount: item.m10 ?? 0,
        newStudentLoss: item.m11 ?? 0,
        satisfaction: item.m12 ?? undefined,
      }))

  const loadData = async () => {
    setLoading(true)
    try {
      // 优先用子表接口（superior_audit），若无数据再回退旧接口
      const subtable = await getSubtable('superior_audit', campusName, selectedYear)
      if (subtable.行数据 && subtable.行数据.length > 0) {
        const mappedRows = mapFromSubtable(subtable.行数据)
        // 确保至少有10行，不足则补空行
        const padded = mappedRows
          .concat(Array(Math.max(0, 10 - mappedRows.length)).fill(null))
          .map((r, i) => r || { key: `r-${i + 1}`, index: i + 1, name: '' })
        setRows(padded)
      } else {
        const res = await getTeacherFunctionPlan(campusName, selectedYear, fixedMonth)
        if (res.行数据 && res.行数据.length > 0) {
          const mappedRows = mapFromApi(res.行数据)
          // 确保至少有10行，不足则补空行
          const padded = mappedRows
            .concat(Array(Math.max(0, 10 - mappedRows.length)).fill(null))
            .map((r, i) => r || { key: `r-${i + 1}`, index: i + 1, name: '' })
          setRows(padded)
        } else {
          setRows(buildInitial())
        }
      }
    } catch (error) {
      console.error('❌ 加载教员功能分析数据失败:', error)
      message.error('加载失败')
      setRows(buildInitial())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const loadTeachers = async () => {
      try {
        const teachers = await fetchTeachers({
          campus_name: campusName,
          active: true,
          participate_kpi: true,
        })
        const names = teachers
          .filter((t: TeacherProfile) => t.is_active !== false)
          .map((t: TeacherProfile) => t.name)
          .filter(Boolean)
        setTeacherOptions(Array.from(new Set(names)))
      } catch (error) {
        console.error('加载教员列表失败', error)
        // 即使加载失败也设置为空数组
        setTeacherOptions([])
      }
    }
    loadTeachers()
  }, [campusName])

  useEffect(() => {
    // 改进：不再依赖 teacherOptions 有值，而是直接调用 autoFill
    // autoFill 内部会从业务数据源动态发现教员
    autoFill()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campusName, selectedYear])

  const update = (idx: number, field: keyof TeacherFunctionRow, value: number | null) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: value ?? undefined } : r)))
  }

  const autoFill = async () => {
    setLoading(true)
    try {
      // 修复：优先使用配置中心的教员列表（按神殿过滤），确保只显示当前神殿的教员
      // 只有当配置中心列表为空时，才从业务数据源发现教员（且必须校验神殿）
      const configTeachers = new Set<string>()
      
      // 1. 首先使用配置中心获取的教员列表（这是按神殿过滤的权威来源）
      teacherOptions.forEach(name => {
        if (name) configTeachers.add(name)
      })
      
      console.log('[教员功能分析] 配置中心教员列表:', Array.from(configTeachers), '神殿:', campusName)

      // 2. 预先从各数据源获取业务数据（用于填充数据，而非发现教员）
      // 就业数据 - 传递年份参数以获取指定年份的数据
      let employList: any = null
      try {
        employList = await getTeacherEmploymentSummaries(campusName, undefined, undefined, selectedYear)
      } catch (err) {
        console.warn('获取就业数据失败', err)
      }

      // 作业数据
      let hwRecords: any[] = []
      try {
        const hwList: any = await classAssignmentGradeService.getList({ campus: campusName, page: 1, pageSize: 200 } as any)
        hwRecords = hwList?.list || hwList || []
      } catch (err) {
        console.warn('获取作业数据失败', err)
      }

      // 考试数据
      let examRecords: any[] = []
      try {
        const examList: any = await classExamScoreService.getList({ campus: campusName, page: 1, pageSize: 200 } as any)
        examRecords = examList?.list || examList || []
      } catch (err) {
        console.warn('获取考试数据失败', err)
      }
      
      // 3. 确定最终的教员列表
      // 如果配置中心有教员列表，使用它；否则从业务数据源发现（但要校验神殿字段）
      let finalNames: string[] = []
      if (configTeachers.size > 0) {
        // 使用配置中心的教员列表
        finalNames = Array.from(configTeachers).filter(Boolean).sort()
        console.log('[教员功能分析] 使用配置中心教员列表:', finalNames)
      } else {
        // 配置中心为空，从业务数据源发现教员（必须校验神殿字段）
        const discoveredNames = new Set<string>()
        const normalizedCampus = campusName.replace('神殿', '')
        
        // 从就业数据发现（校验神殿）
        const empList = employList?.list || employList || []
        empList.forEach((item: any) => {
          const itemCampus = (item.神殿 || item.campus || '').replace('神殿', '')
          if (itemCampus === normalizedCampus || itemCampus === campusName) {
            const name = item.teacherName || item.教员姓名
            if (name) discoveredNames.add(name)
          }
        })
        
        // 从作业数据发现（校验神殿）
        hwRecords.forEach((rec: any) => {
          const itemCampus = (rec.campusName || rec.campus_name || rec.campus || '').replace('神殿', '')
          if (itemCampus === normalizedCampus || itemCampus === campusName) {
            const teacher = rec.teacherName || rec.teacher_name
            if (teacher) discoveredNames.add(teacher)
          }
        })
        
        // 从考试数据发现（校验神殿）
        examRecords.forEach((rec: any) => {
          const itemCampus = (rec.campusName || rec.campus_name || rec.campus || '').replace('神殿', '')
          if (itemCampus === normalizedCampus || itemCampus === campusName) {
            const teacher = rec.instructorName || rec.instructor_name
            if (teacher) discoveredNames.add(teacher)
          }
        })
        
        finalNames = Array.from(discoveredNames).filter(Boolean).sort()
        console.log('[教员功能分析] 从业务数据发现的教员列表（神殿校验后）:', finalNames)
      }

      // 初始化行集合
      const baseRows =
        finalNames.length > 0
          ? finalNames.map((n, idx) => ({ 
              key: `r-${idx + 1}`, 
              index: idx + 1, 
              name: n,
              // 合计字段初始化为0（业务规则：没有值按0计算）
              reputationCount: 0,
              reputationIncome: 0,
              newStudentCount: 0,
              newStudentLoss: 0,
              violation: 0,
            }))
          : buildInitial()
      const map = new Map<string, TeacherFunctionRow>()
      baseRows.forEach((r) => map.set(r.name || `教员${r.index}`, { ...r }))

      const getRow = (name?: string) => {
        const key = name || ''
        // 只返回当前神殿已存在的教员，不自动创建新教员
        if (!map.has(key)) return null
        return map.get(key)!
      }

      const parseMonth = (d?: any) => {
        if (!d) return null
        const dt = new Date(d)
        if (Number.isNaN(dt.getTime())) return null
        return { year: dt.getFullYear(), month: dt.getMonth() + 1 }
      }

      const getMonthValues = (item: any) =>
        Array.from({ length: 12 }, (_, i) => item[`m${i + 1}`] ?? item[`M${i + 1}`])
          .filter((v) => typeof v === 'number' && !Number.isNaN(v)) as number[]

      // 就业 - 使用已获取的数据
      try {
        const list = employList?.list || employList || []
        let totalEmployed = 0
        let totalRequired = 0
        let totalSalary = 0
        let employedCount = 0
        
        list.forEach((item: any, idx: number) => {
          const name = item.teacherName || item.教员姓名 || `教员${idx + 1}`
          const r = getRow(name)
          if (!r) return // 跳过不属于当前神殿的教员
          
          // 设置教员的就业率和就业薪资
          if (typeof item.就业率 === 'number') r.employmentRate = item.就业率
          else if (typeof item.employmentRate === 'number') r.employmentRate = item.employmentRate
          if (typeof item.实际平均就业薪资 === 'number') r.employmentSalary = item.实际平均就业薪资
          else if (typeof item.actualAverageSalary === 'number') r.employmentSalary = item.actualAverageSalary
          
          // 累加汇总数据用于计算平均值
          const employed = Number(item.实际就业人数 || item.actualEmployedCount || 0)
          const required = Number(item.需就业人数 || item.requiredEmploymentCount || 0)
          const avgSalary = Number(item.实际平均就业薪资 || item.actualAverageSalary || 0)
          
          totalEmployed += employed
          totalRequired += required
          if (employed > 0 && avgSalary > 0) {
            totalSalary += avgSalary * employed
            employedCount += employed
          }
        })
        
        // 保存就业汇总数据
        setEmploymentSummary({
          totalEmployed,
          totalRequired,
          totalSalary,
          employedCount
        })
      } catch (err) {
        console.warn('就业自动填充失败', err)
      }

      // 作业 - 使用已获取的数据
      try {
        console.log('[作业] API返回的原始数据:', hwRecords)
        // 按教员收集每个班的提交率和合格率
        const byTeacher = new Map<string, { submitRates: number[]; passRates: number[] }>()
        hwRecords.forEach((rec: any) => {
          console.log('[作业] 单条记录:', { 
            teacherName: rec.teacherName, 
            expectedSubmit: rec.expectedSubmit, 
            actualSubmit: rec.actualSubmit, 
            passCount: rec.passCount,
            passRate: rec.passRate
          })
          const md = parseMonth(rec.startDate || rec.endDate || rec.createdAt || rec.updatedAt)
          if (!md || md.year !== selectedYear) return
          const teacher = rec.teacherName || rec.teacher_name
          if (!teacher) return
          
          // 计算每个班的提交率和合格率
          const expected = Number(rec.expectedSubmit || 0)
          const actual = Number(rec.actualSubmit || 0)
          const pass = Number(rec.passCount || 0)
          
          const submitRate = expected > 0 ? (actual / expected) * 100 : undefined
          const passRate = actual > 0 ? (pass / actual) * 100 : undefined
          
          if (!byTeacher.has(teacher)) byTeacher.set(teacher, { submitRates: [], passRates: [] })
          const entry = byTeacher.get(teacher)!
          if (submitRate !== undefined && !Number.isNaN(submitRate)) entry.submitRates.push(submitRate)
          if (passRate !== undefined && !Number.isNaN(passRate)) entry.passRates.push(passRate)
        })
        
        // 计算简单平均（各班级率值的平均）
        byTeacher.forEach((entry, teacher) => {
          const avgSubmitRate = entry.submitRates.length > 0
            ? Number((entry.submitRates.reduce((a, b) => a + b, 0) / entry.submitRates.length).toFixed(2))
            : undefined
          const avgPassRate = entry.passRates.length > 0
            ? Number((entry.passRates.reduce((a, b) => a + b, 0) / entry.passRates.length).toFixed(2))
            : undefined
          
          // 调试日志
          console.log(`[作业] 教员=${teacher}, 提交率数组=${entry.submitRates}, 合格率数组=${entry.passRates}, 平均提交率=${avgSubmitRate}%, 平均合格率=${avgPassRate}%`)
          
          const r = getRow(teacher)
          if (!r) return // 跳过不属于当前神殿的教员
          if (avgSubmitRate !== undefined && !Number.isNaN(avgSubmitRate)) r.homeworkSubmit = avgSubmitRate
          if (avgPassRate !== undefined && !Number.isNaN(avgPassRate)) r.homeworkPass = avgPassRate
        })
      } catch (err) {
        console.warn('作业自动填充失败', err)
      }

      // 考试 - 使用已获取的数据
      try {
        // 按教员收集每个班的合格率
        const byTeacher = new Map<string, number[]>()
        examRecords.forEach((rec: any) => {
          const md = parseMonth(rec.firstExamDate || rec.makeupExamDate || rec.createdAt || rec.updatedAt)
          if (!md || md.year !== selectedYear) return
          const teacher = rec.instructorName || rec.instructor_name
          if (!teacher) return
          
          // 计算每个班的合格率
          const classSize = Number(rec.classSize || 0)
          const passCount = Number(rec.passCount || 0)
          
          if (classSize > 0) {
            const rate = (passCount / classSize) * 100
            if (!byTeacher.has(teacher)) byTeacher.set(teacher, [])
            byTeacher.get(teacher)!.push(rate)
          }
        })
        
        // 计算简单平均（各班级率值的平均）
        byTeacher.forEach((rates, teacher) => {
          if (rates.length === 0) return
          const avgRate = Number((rates.reduce((a, b) => a + b, 0) / rates.length).toFixed(2))
          if (Number.isNaN(avgRate)) return
          const r = getRow(teacher)
          if (!r) return // 跳过不属于当前神殿的教员
          r.examPass = avgRate
        })
      } catch (err) {
        console.warn('考试自动填充失败', err)
      }

            // 项目
      // 规则：按「月份平均」口径计算（与项目TAB一致），数据源为 project_grade_registers。
      // 这里输出到“教员功能分析总表”的 projectSubmit / projectPass：取该教员全年各月份的平均值（忽略空月份）。
      try {
        // 拉全量记录（分页）
        const pageSize = 200
        const firstPage: any = await projectGradeRegisterService.getList({ page: 1, pageSize }, campusName)
        let records: any[] = firstPage?.list || []
        const totalPages = firstPage?.totalPages || 1
        if (totalPages > 1) {
          const tasks: Promise<any>[] = []
          for (let p = 2; p <= totalPages; p += 1) {
            tasks.push(projectGradeRegisterService.getList({ page: p, pageSize }, campusName))
          }
          const rest = await Promise.all(tasks)
          rest.forEach((res) => {
            records = records.concat(res?.list || [])
          })
        }

        const getMonthFromThirdAttempt = (rec: any, projectIdx: number): number | null => {
          const attemptDates: any[] = rec?.projectAttemptDates?.[projectIdx] || rec?.project_attempt_dates?.[projectIdx] || []
          const third = attemptDates?.[2]
          if (third) {
            const d = new Date(third)
            if (!Number.isNaN(d.getTime()) && d.getFullYear() === selectedYear) return d.getMonth() + 1
          }
          // fallback: last valid attempt date
          for (let j = attemptDates.length - 1; j >= 0; j--) {
            const ds = attemptDates[j]
            if (!ds) continue
            const d = new Date(ds)
            if (!Number.isNaN(d.getTime()) && d.getFullYear() === selectedYear) return d.getMonth() + 1
          }
          // fallback: createdAt
          const createdAt = rec?.createdAt || rec?.created_at
          if (createdAt) {
            const d = new Date(createdAt)
            if (!Number.isNaN(d.getTime()) && d.getFullYear() === selectedYear) return d.getMonth() + 1
          }
          return null
        }

        // teacher -> month -> rates[]
        const submitByTeacherMonth = new Map<string, Map<number, number[]>>()
        const passByTeacherMonth = new Map<string, Map<number, number[]>>()

        records.forEach((rec: any) => {
          const teacher = rec.teacherName || rec.teacher_name
          if (!teacher) return
          const projectCount = Number(rec.projectCount || rec.project_count || 0)
          const classSize = Number(rec.classSize || rec.class_size || 0)
          const students = rec.students || []

          for (let i = 0; i < projectCount; i++) {
            const month = getMonthFromThirdAttempt(rec, i)
            if (!month || month < 1 || month > 12) continue

            // 计算该项目的“提交人数/合格人数”
            // 口径：若该学生该项目任意一次尝试有 score 则视为提交；最后一次有 score 的分数>=6 视为合格。
            let submissions = 0
            let passes = 0

            students.forEach((stu: any) => {
              const pKey = `p${i + 1}`
              const scores: number[] = []
              for (let a = 1; a <= 3; a++) {
                const cell = stu?.[`${pKey}a${a}`]
                if (cell && typeof cell.score === 'number') scores.push(cell.score)
              }
              if (scores.length === 0) return
              submissions += 1
              const finalScore = scores[scores.length - 1]
              if (typeof finalScore === 'number' && finalScore >= 6) passes += 1
            })

            const submitRate = classSize > 0 ? Number(((submissions / classSize) * 100).toFixed(2)) : undefined
            const passRate = submissions > 0 ? Number(((passes / submissions) * 100).toFixed(2)) : undefined

            if (typeof submitRate === 'number' && !Number.isNaN(submitRate)) {
              if (!submitByTeacherMonth.has(teacher)) submitByTeacherMonth.set(teacher, new Map())
              const m = submitByTeacherMonth.get(teacher)!
              if (!m.has(month)) m.set(month, [])
              m.get(month)!.push(submitRate)
            }
            if (typeof passRate === 'number' && !Number.isNaN(passRate)) {
              if (!passByTeacherMonth.has(teacher)) passByTeacherMonth.set(teacher, new Map())
              const m = passByTeacherMonth.get(teacher)!
              if (!m.has(month)) m.set(month, [])
              m.get(month)!.push(passRate)
            }
          }
        })

        const avgFromByTeacherMonth = (byTeacherMonth: Map<string, Map<number, number[]>>): Map<string, number> => {
          const result = new Map<string, number>()
          byTeacherMonth.forEach((monthMap, teacher) => {
            // 规则: 先算每个项目%（保留2位）→按月平均（保留2位）→全年平均（保留2位）
            const monthAverages: number[] = []
            for (let m = 1; m <= 12; m++) {
              const projectRatesInMonth = monthMap.get(m) || []
              if (!projectRatesInMonth.length) continue
              // 1. 每个项目%已在前面 toFixed(2) 存入
              // 2. 按月平均（保留2位）
              const monthAvg = Number((projectRatesInMonth.reduce((a, b) => a + b, 0) / projectRatesInMonth.length).toFixed(2))
              monthAverages.push(monthAvg)
            }
            if (!monthAverages.length) return
            // 3. 全年平均（保留2位）
            const yearAvg = Number((monthAverages.reduce((a, b) => a + b, 0) / monthAverages.length).toFixed(2))
            result.set(teacher, yearAvg)
          })
          return result
        }

        const submitAvg = avgFromByTeacherMonth(submitByTeacherMonth)
        const passAvg = avgFromByTeacherMonth(passByTeacherMonth)

        submitAvg.forEach((avg, teacher) => {
          const r = getRow(teacher)
          if (!r) return
          r.projectSubmit = avg
        })
        passAvg.forEach((avg, teacher) => {
          const r = getRow(teacher)
          if (!r) return
          r.projectPass = avg
        })
      } catch (err) {
        console.warn('项目自动填充失败', err)
      }

      // 满意度
      try {
        const satList: any = await studentSatisfactionDetailService.getAvg(campusName, selectedYear)
        satList.forEach((item: any, idx: number) => {
          const teacher = item.teacherName || item.teacher_name || `教员${idx + 1}`
          const monthValues = getMonthValues(item)
          const avgFromMonths =
            monthValues.length > 0
              ? Number((monthValues.reduce((a, b) => a + b, 0) / monthValues.length).toFixed(2))
              : undefined
          const val = item.avg_score ?? item.satisfaction ?? avgFromMonths
          if (val === undefined || val === null) return
          const r = getRow(teacher)
          if (!r) return // 跳过不属于当前神殿的教员
          r.satisfaction = Number(val)
        })
      } catch (err) {
        console.warn('满意度自动填充失败', err)
      }

      // 违纪
      try {
        const vio = await getViolation(campusName, selectedYear)
        vio.行数据?.forEach((item, idx) => {
          const teacher = item.姓名 || `教员${item.序号 || idx + 1}`
          const monthValues = getMonthValues(item)
          // 计算合计，包括0值
          const val = monthValues.length > 0 ? monthValues.reduce((a, b) => a + b, 0) : 0
          const r = getRow(teacher)
          if (!r) return // 跳过不属于当前神殿的教员
          r.violation = Number(val)
        })
      } catch (err) {
        console.warn('违纪自动填充失败', err)
      }

      // 口碑人数和口碑收入 - 从 academic.神殿口碑招生个人目标与结果汇总表 获取
      try {
        const reputationRes = await fetch(
          buildApiUrl(`/reputation-personal?campus=${encodeURIComponent(campusName)}&year=${selectedYear}`)
        )
        if (reputationRes.ok) {
          const data = await reputationRes.json()
          const rows = data?.行列表 || []
          // 按姓名匹配，获取实际招生人数和实际口碑收入
          rows.forEach((item: any) => {
            const teacher = item.姓名 || ''
            if (!teacher) return
            const r = getRow(teacher)
            if (!r) return // 跳过不属于当前神殿的教员
            // 实际招生人数 -> 口碑人数
            if (item.实际招生人数 !== undefined && item.实际招生人数 !== null) {
              r.reputationCount = Number(item.实际招生人数) || 0
            }
            // 实际口碑收入 -> 口碑收入
            if (item.实际口碑收入 !== undefined && item.实际口碑收入 !== null) {
              r.reputationIncome = Number(item.实际口碑收入) || 0
            }
          })
        }
      } catch (err) {
        console.warn('口碑数据自动填充失败', err)
      }

      // 带新生人数和新生流失人数 - 从 academic.神殿后端新生维稳个人按月汇总表 获取
      try {
        const stabilityRes = await fetch(
          buildApiUrl(`/student-stability-personal-monthly?campus=${encodeURIComponent(campusName)}&year=${selectedYear}`)
        )
        if (stabilityRes.ok) {
          const data = await stabilityRes.json()
          const rows = data?.行列表 || []
          // 按教员姓名聚合全年数据
          const teacherMap = new Map<string, { enrollment: number; refund: number }>()
          rows.forEach((item: any) => {
            const teacher = item.教员姓名 || ''
            if (!teacher) return
            if (!teacherMap.has(teacher)) {
              teacherMap.set(teacher, { enrollment: 0, refund: 0 })
            }
            const entry = teacherMap.get(teacher)!
            entry.enrollment += Number(item.入学人数) || 0
            entry.refund += Number(item.退费人数) || 0
          })
          // 填充到对应教员（包括0值）
          teacherMap.forEach((stats, teacher) => {
            const r = getRow(teacher)
            if (!r) return // 跳过不属于当前神殿的教员
            r.newStudentCount = stats.enrollment  // 入学人数 -> 带新生人数
            r.newStudentLoss = stats.refund       // 退费人数 -> 新生流失人数
          })
        }
      } catch (err) {
        console.warn('新生维稳数据自动填充失败', err)
      }

      // 听课 - 数据源优先级: 1.年度听课汇总表 2.教员功能分析上级听课表 3.直接从听课成绩明细表计算
      try {
        let hasData = false
        
        // 1. 先尝试从年度听课汇总表获取（与上级听课TAB的"自动获取数据"相同数据源）
        try {
          const summaryRes = await teacherYearlyLectureScoreSummaryService.getByYear(selectedYear)
          if (summaryRes?.summary_data?.length > 0) {
            summaryRes.summary_data.forEach((item: any, idx: number) => {
              const teacher = item.name || item.姓名 || `教员${idx + 1}`
              const monthValues = getMonthValues(item)
              if (monthValues.length === 0) return
              const val = Number((monthValues.reduce((a, b) => a + b, 0) / monthValues.length).toFixed(2))
              const r = getRow(teacher)
              if (!r) return // 跳过不属于当前神殿的教员
              r.superiorAudit = val
              hasData = true
            })
          }
        } catch (summaryErr: any) {
          if (summaryErr?.response?.status !== 404) {
            console.warn('从年度听课汇总获取失败', summaryErr)
          }
        }
        
        // 2. 如果年度汇总没有数据，从教员功能分析上级听课表获取
        if (!hasData) {
          try {
            const audit = await getSuperiorAudit(campusName, selectedYear)
            if (audit.行数据?.length > 0) {
              audit.行数据.forEach((item, idx) => {
                const teacher = item.姓名 || `教员${item.序号 || idx + 1}`
                const monthValues = getMonthValues(item)
                if (monthValues.length === 0) return
                const val = Number((monthValues.reduce((a, b) => a + b, 0) / monthValues.length).toFixed(2))
                const r = getRow(teacher)
                if (!r) return // 跳过不属于当前神殿的教员
                r.superiorAudit = val
                hasData = true
              })
            }
          } catch (auditErr) {
            console.warn('从上级听课表获取失败', auditErr)
          }
        }
        
        // 3. 如果都没有数据，直接从听课成绩明细表计算
        if (!hasData) {
          try {
            const sheets = await teacherLectureScoreSheetService.list({ campusName, year: selectedYear })
            if (sheets?.length > 0) {
              sheets.forEach((sheet: any) => {
                const teacher = sheet.teacherName || sheet.teacher_name
                if (!teacher) return
                // 计算该教员全年总分
                const yearTotal = (sheet.rows || []).reduce((acc: number, r: any) => {
                  const monthSum = getMonthValues(r).reduce((sum, v) => sum + v, 0)
                  return acc + monthSum
                }, 0)
                if (yearTotal > 0) {
                  const r = getRow(teacher)
                  if (!r) return // 跳过不属于当前神殿的教员
                  r.superiorAudit = yearTotal
                  hasData = true
                }
              })
            }
          } catch (sheetErr) {
            console.warn('从听课成绩明细表计算失败', sheetErr)
          }
        }
        
        if (!hasData) {
          console.log('上级听课: 未找到任何数据源（当前年份:', selectedYear, '可能该年没有数据）')
        }
      } catch (err) {
        console.warn('上级听课自动填充失败', err)
      }

      const finalRows = Array.from(map.values())
        .filter((r) => r.name && r.name.trim() !== '') // 过滤掉空行
      const padded = finalRows
        .concat(Array(Math.max(0, 10 - finalRows.length)).fill(null))
        .map((r, i) => r 
          ? { ...r, key: `r-${i + 1}`, index: i + 1 }  // 重新编号所有行
          : { key: `r-${i + 1}`, index: i + 1, name: '' }
        )
      setRows(padded)
      message.success('已自动获取并填充数据')
    } catch (error) {
      console.error('自动获取数据失败', error)
      message.error('自动获取数据失败')
    } finally {
      setLoading(false)
    }
  }

  const numberCol = (title: string, dataIndex: keyof TeacherFunctionRow): any => ({
    title,
    dataIndex,
    align: 'center' as const,
    width: 120,
    render: (v: any, record: TeacherFunctionRow, index: number) =>
      record.rowType === 'avg' ? (
        <span>{typeof v === 'number' ? v : ''}</span>
      ) : (
        <InputNumber
          style={{ width: '100%' }}
          value={v as number | undefined}
          min={0}
          onChange={(val) => update(index, dataIndex, (val as number) | 0)}
        />
      ),
  })

  const columns: ColumnsType<TeacherFunctionRow> = [
    {
      title: '序号',
      dataIndex: 'index',
      width: 70,
      align: 'center',
      onCell: (record) => ({
        colSpan: record.rowType === 'avg' ? 2 : 1,
      }),
      render: (v, record) =>
        record.rowType === 'avg' ? (
          <span style={{ fontWeight: 'bold' }}>平均/合计</span>
        ) : (
          v
        ),
    },
    {
      title: '姓名',
      dataIndex: 'name',
      width: 120,
      align: 'center',
      onCell: (record) => ({
        colSpan: record.rowType === 'avg' ? 0 : 1,
      }),
      render: (v, record, index) =>
        record.rowType === 'avg' ? null : (
          <Input
            value={v}
            onChange={(e) =>
              setRows((prev) =>
                prev.map((r, i) => (i === index ? { ...r, name: e.target.value } : r)),
              )
            }
          />
        ),
    },
    numberCol('就业率', 'employmentRate'),
    numberCol('就业薪资', 'employmentSalary'),
    numberCol('口碑人数', 'reputationCount'),
    numberCol('口碑收入', 'reputationIncome'),
    numberCol('带新生人数', 'newStudentCount'),
    numberCol('新生流失人数', 'newStudentLoss'),
    numberCol('作业提交率', 'homeworkSubmit'),
    numberCol('作业合格率', 'homeworkPass'),
    numberCol('考试合格率', 'examPass'),
    numberCol('项目提交率', 'projectSubmit'),
    numberCol('项目合格率', 'projectPass'),
    numberCol('学员满意度', 'satisfaction'),
    numberCol('学员违纪', 'violation'),
    numberCol('上级听课', 'superiorAudit'),
  ]

  return (
    <Card bordered={false} style={{ backgroundColor: '#f5f7fa' }}>
      <Space style={{ marginBottom: 12, width: '100%', justifyContent: 'space-between' }}>
        <Space>
          <Title level={4} style={{ margin: 0 }}>
            {campusName}智慧司教员功能分析总表
          </Title>
          <Row gutter={12} align="middle">
            <Col><span>年份</span></Col>
            <Col>
              <GlobalYearSelector 
                value={selectedYear} 
                onChange={setSelectedYear}
                width={120}
              />
            </Col>
          </Row>
        </Space>
        <Space>
          <Button onClick={autoFill} loading={loading}>
            自动获取数据
          </Button>
          <Button
            onClick={() => {
              const nextIndex = rows.filter((r) => r.rowType !== 'avg').length + 1
              setRows((prev) => [
                ...prev.filter((r) => r.rowType !== 'avg'),
                { key: `r-${nextIndex}`, index: nextIndex, name: '' },
              ])
            }}
            disabled={loading}
          >
            新增
          </Button>
          <Button onClick={() => setRows(buildInitial())} disabled={loading}>
            清空
          </Button>
          <Button
            type="primary"
            loading={loading}
            onClick={async () => {
              setLoading(true)
              try {
                const saved = await saveTeacherFunctionPlan(campusName, selectedYear, fixedMonth, rows)
                setRows(mapFromApi(saved.行数据))
                message.success('已保存')
              } catch (error) {
                console.error('保存失败', error)
                message.error('保存失败')
              } finally {
                setLoading(false)
              }
            }}
          >
            保存
          </Button>
        </Space>
      </Space>
      <Table<TeacherFunctionRow>
        bordered
        size="small"
        columns={columns}
        dataSource={dataWithAvg}
        pagination={false}
        scroll={{ x: 'max-content' }}
        loading={loading}
        rowClassName={(r) => (r.rowType === 'avg' ? 'summary-row' : '')}
      />
    </Card>
  )
}

export default TeacherExamPassRatePage
