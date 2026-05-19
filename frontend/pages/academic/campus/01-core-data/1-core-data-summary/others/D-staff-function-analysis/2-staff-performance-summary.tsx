import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { App, Card, Table, Typography, InputNumber, Input, Button, Space, Spin } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useCampusStore } from '@/stores/campusStore'
import { normalizeCampus } from '@/pages/academic/teaching-content/shared/campusStorage'
import { buildApiUrl } from '@/utils/apiBase'
import { getTeacherEmploymentSummaries } from '@/services/teacherEmploymentSummary'

const { Title, Text } = Typography

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

interface StaffPerformanceRow {
  id: number
  teacherName: string
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

// 逐月统计表记录类型
interface MonthlyRecord {
  id: string
  month: number
  teacher: string
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

const FALLBACK_NAMES = ['张三', '李四', '王五', '赵六']
const RATE_FIELDS: MetricKey[] = [
  'homeworkSubmissionRate',
  'homeworkPassRate',
  'examPassRate',
  'projectPassRate',
  'studentSatisfaction',
  'employmentRate',
]
const INTEGER_FIELDS: MetricKey[] = [
  'studentViolations',
  'reputationEnrollment',
  'newStudentCount',
  'refundCount',
]
const SUM_FIELDS: MetricKey[] = [
  'studentViolations',
  'reputationEnrollment',
  'reputationIncome',
  'newStudentCount',
  'refundCount',
]

const buildDefaultRows = (names: string[]): StaffPerformanceRow[] =>
  names.map((name, idx) => ({
    id: idx + 1,
    teacherName: name,
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
  }))

// 从逐月数据计算年度汇总
const aggregateMonthlyToYearly = (
  monthlyRecords: MonthlyRecord[],
  teacherNames: string[],
): StaffPerformanceRow[] => {
  const teacherMap = new Map<string, MonthlyRecord[]>()
  
  // 按教员分组
  monthlyRecords.forEach((record) => {
    const name = (record.teacher || '').trim()
    if (!name) return
    const list = teacherMap.get(name) || []
    list.push(record)
    teacherMap.set(name, list)
  })
  
  // 计算每个教员的年度汇总
  return teacherNames.map((name, idx) => {
    const records = teacherMap.get(name) || []
    const monthCount = records.length || 1
    
    // 率类字段取平均，数量类字段取累计
    const sumField = (field: MetricKey) =>
      records.reduce((acc, r) => acc + (r[field] || 0), 0)
    
    const avgOrSum = (field: MetricKey) => {
      const total = sumField(field)
      if (SUM_FIELDS.includes(field)) {
        return total // 累计
      }
      return Number((total / monthCount).toFixed(2)) // 平均
    }
    
    return {
      id: idx + 1,
      teacherName: name,
      homeworkSubmissionRate: avgOrSum('homeworkSubmissionRate'),
      homeworkPassRate: avgOrSum('homeworkPassRate'),
      examPassRate: avgOrSum('examPassRate'),
      projectPassRate: avgOrSum('projectPassRate'),
      studentSatisfaction: avgOrSum('studentSatisfaction'),
      studentViolations: avgOrSum('studentViolations'),
      employmentRate: avgOrSum('employmentRate'),
      employmentSalary: avgOrSum('employmentSalary'),
      reputationEnrollment: avgOrSum('reputationEnrollment'),
      reputationIncome: avgOrSum('reputationIncome'),
      newStudentCount: avgOrSum('newStudentCount'),
      refundCount: avgOrSum('refundCount'),
    }
  })
}

const StaffPerformanceSummaryTable: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus, getAllCampuses } = useCampusStore()
  const resolvedCampus = normalizeCampus(currentCampus ?? getAllCampuses()[0]?.name ?? '主神殿')

  const [teacherNames, setTeacherNames] = useState<string[]>(FALLBACK_NAMES)
  const [rows, setRows] = useState<StaffPerformanceRow[]>(buildDefaultRows(FALLBACK_NAMES))
  const [loading, setLoading] = useState(false)
  const [year, setYear] = useState<number>(new Date().getFullYear())
  const [autoFillStatus, setAutoFillStatus] = useState<string>('')

  const ensureRowCount = useCallback(
    (names: string[], prev: StaffPerformanceRow[]) => {
      const base = buildDefaultRows(names)
      const merged = base.map((row, idx) => {
        const match = prev.find((p) => p.teacherName === row.teacherName) || prev[idx]
        return match ? { ...row, ...match, teacherName: row.teacherName, id: row.id } : row
      })
      return merged
    },
    [],
  )

  // 远端拉取教员列表
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
            setRows((prev) => ensureRowCount(names, prev))
            return
          }
        }
        // 兜底：全局教员列表
        const resAll = await fetch(buildApiUrl('/config/teachers'))
        if (resAll.ok) {
          const data: { name?: string }[] = await resAll.json()
          const names = data.map((t) => (t.name || '').trim()).filter(Boolean)
          if (names.length) {
            setTeacherNames(names)
            setRows((prev) => ensureRowCount(names, prev))
            return
          }
        }
        message.warning('未获取到教员列表，使用默认姓名')
      } catch (error) {
        console.error('[员工业绩汇总] 加载教员列表失败:', error)
      } finally {
        setLoading(false)
      }
    }
    loadTeachers()
  }, [ensureRowCount, resolvedCampus])

  // 从逐月统计表获取数据并汇总
  const fetchAndAggregateFromMonthly = useCallback(async () => {
    if (!teacherNames.length) return
    
    setLoading(true)
    setAutoFillStatus('正在从逐月统计表获取数据...')
    
    try {
      // 1. 先尝试从后端获取逐月统计表数据
      const res = await fetch(
        buildApiUrl(`/staff-monthly-performance?campus=${encodeURIComponent(resolvedCampus)}&year=${year}`),
      )
      
      let monthlyRecords: MonthlyRecord[] = []
      
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          monthlyRecords = data
          setAutoFillStatus('已从逐月统计表获取数据，正在计算汇总...')
        }
      }
      
      // 2. 如果没有数据，需要触发自动获取各项指标
      if (monthlyRecords.length === 0) {
        setAutoFillStatus('逐月统计表无数据，正在自动获取各项指标...')
        
        // 创建默认的逐月记录
        const defaultMonthlyRecords: MonthlyRecord[] = []
        for (let month = 1; month <= 12; month++) {
          for (const teacher of teacherNames) {
            defaultMonthlyRecords.push({
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
          }
        }
        
        // 自动获取各项数据
        const normalize = (t: string) => (t || '').trim()
        
        // 获取作业率
        setAutoFillStatus('正在获取作业提交率/合格率...')
        try {
          const assignmentRes = await fetch(
            buildApiUrl(`/assignment-stats/assignment-monthly?campus=${encodeURIComponent(resolvedCampus)}&year=${year}`),
          )
          if (assignmentRes.ok) {
            const data = await assignmentRes.json()
            if (Array.isArray(data)) {
              data.forEach((item: any) => {
                const record = defaultMonthlyRecords.find(
                  (r) => r.month === item.month && normalize(r.teacher) === normalize(item.teacher_name),
                )
                if (record) {
                  record.homeworkSubmissionRate = item.submit_rate || 0
                  record.homeworkPassRate = item.pass_rate || 0
                }
              })
            }
          }
        } catch (e) {
          console.error('获取作业率失败:', e)
        }
        
        // 获取考试合格率
        setAutoFillStatus('正在获取考试合格率...')
        try {
          const examRes = await fetch(
            buildApiUrl(`/exam-stats/exam-monthly?campus=${encodeURIComponent(resolvedCampus)}&year=${year}`),
          )
          if (examRes.ok) {
            const data = await examRes.json()
            if (Array.isArray(data)) {
              data.forEach((item: any) => {
                const record = defaultMonthlyRecords.find(
                  (r) => r.month === item.month && normalize(r.teacher) === normalize(item.teacher_name),
                )
                if (record) {
                  record.examPassRate = item.pass_rate || 0
                }
              })
            }
          }
        } catch (e) {
          console.error('获取考试合格率失败:', e)
        }
        
        // 获取项目合格率
        setAutoFillStatus('正在获取项目合格率...')
        try {
          const projectRes = await fetch(
            buildApiUrl(`/project-stats/project-monthly?campus=${encodeURIComponent(resolvedCampus)}&year=${year}`),
          )
          if (projectRes.ok) {
            const data = await projectRes.json()
            if (Array.isArray(data)) {
              data.forEach((item: any) => {
                const record = defaultMonthlyRecords.find(
                  (r) => r.month === item.month && normalize(r.teacher) === normalize(item.teacher_name),
                )
                if (record) {
                  record.projectPassRate = item.pass_rate || 0
                }
              })
            }
          }
        } catch (e) {
          console.error('获取项目合格率失败:', e)
        }
        
        // 获取满意度
        setAutoFillStatus('正在获取学员满意度...')
        try {
          const satisfactionRes = await fetch(
            buildApiUrl(`/satisfaction-stats/satisfaction-monthly?campus=${encodeURIComponent(resolvedCampus)}&year=${year}`),
          )
          if (satisfactionRes.ok) {
            const data = await satisfactionRes.json()
            if (Array.isArray(data)) {
              data.forEach((item: any) => {
                const record = defaultMonthlyRecords.find(
                  (r) => r.month === item.month && normalize(r.teacher) === normalize(item.teacher_name),
                )
                if (record) {
                  record.studentSatisfaction = (item.score || 0) * 20
                }
              })
            }
          }
        } catch (e) {
          console.error('获取满意度失败:', e)
        }
        
        // 获取违纪
        setAutoFillStatus('正在获取学员违纪...')
        try {
          const violationRes = await fetch(
            buildApiUrl(`/violation-stats/violation-monthly?campus=${encodeURIComponent(resolvedCampus)}&year=${year}`),
          )
          if (violationRes.ok) {
            const data = await violationRes.json()
            if (Array.isArray(data)) {
              data.forEach((item: any) => {
                const record = defaultMonthlyRecords.find(
                  (r) => r.month === item.month && normalize(r.teacher) === normalize(item.teacher_name),
                )
                if (record) {
                  record.studentViolations = item.count || 0
                }
              })
            }
          }
        } catch (e) {
          console.error('获取违纪失败:', e)
        }
        
        // 获取就业数据：口径按“班级平均”（教员教多个班 => 就业率/就业薪资取各班的算术平均）
        // 注意：这里不直接写入 defaultMonthlyRecords，避免后续年度汇总再做 12 个月平均导致口径错误。
        // 就业字段会在年度汇总 aggregatedRows 阶段统一覆盖。
        
        // 获取口碑数据
        setAutoFillStatus('正在获取口碑数据...')
        try {
          const reputationRes = await fetch(
            buildApiUrl(`/reputation-stats/monthly?campus=${encodeURIComponent(resolvedCampus)}&year=${year}`),
          )
          if (reputationRes.ok) {
            const data = await reputationRes.json()
            if (Array.isArray(data)) {
              data.forEach((item: any) => {
                const record = defaultMonthlyRecords.find(
                  (r) => r.month === item.month && normalize(r.teacher) === normalize(item.teacher_name),
                )
                if (record) {
                  record.reputationEnrollment = item.reputation_enrollment || 0
                  record.reputationIncome = item.reputation_income || 0
                }
              })
            }
          }
        } catch (e) {
          console.error('获取口碑数据失败:', e)
        }
        
        // 获取带新生人数
        setAutoFillStatus('正在获取带新生人数...')
        try {
          const newStudentRes = await fetch(
            buildApiUrl(`/reputation-stats/new-students-monthly?campus=${encodeURIComponent(resolvedCampus)}&year=${year}`),
          )
          if (newStudentRes.ok) {
            const data = await newStudentRes.json()
            if (Array.isArray(data)) {
              data.forEach((item: any) => {
                const record = defaultMonthlyRecords.find(
                  (r) => r.month === item.month && normalize(r.teacher) === normalize(item.teacher_name),
                )
                if (record) {
                  record.newStudentCount = item.new_student_count || 0
                }
              })
            }
          }
        } catch (e) {
          console.error('获取带新生人数失败:', e)
        }
        
        // 获取退费人数
        setAutoFillStatus('正在获取退费人数...')
        try {
          const refundRes = await fetch(
            buildApiUrl(`/reputation-stats/refunds-monthly?campus=${encodeURIComponent(resolvedCampus)}&year=${year}`),
          )
          if (refundRes.ok) {
            const data = await refundRes.json()
            if (Array.isArray(data)) {
              data.forEach((item: any) => {
                const record = defaultMonthlyRecords.find(
                  (r) => r.month === item.month && normalize(r.teacher) === normalize(item.teacher_name),
                )
                if (record) {
                  record.refundCount = item.refund_count || 0
                }
              })
            }
          }
        } catch (e) {
          console.error('获取退费人数失败:', e)
        }
        
        monthlyRecords = defaultMonthlyRecords
      }
      
      // 3. 计算年度汇总
      setAutoFillStatus('正在计算年度汇总...')
      const aggregatedRows = aggregateMonthlyToYearly(monthlyRecords, teacherNames)

      // 4. 就业数据强制从“神殿后端教员就业汇总表”获取并覆盖（口径：按班级算术平均）
      // 说明：即便逐月统计表有数据，也以就业汇总表为准
      try {
        setAutoFillStatus('正在从神殿后端教员就业汇总表获取就业数据...')

        const summaries = await getTeacherEmploymentSummaries(resolvedCampus, undefined, undefined, year)

        const byTeacher = new Map<string, { rateSum: number; salarySum: number; count: number }>()

        const normalizeRateToPercent = (rateRaw: any): number => {
          const n = Number(rateRaw)
          if (!Number.isFinite(n)) return 0
          // 兼容 0-1 与 0-100 两种返回
          return n > 0 && n <= 1 ? n * 100 : n
        }

        summaries.forEach((s: any) => {
          const teacherName = String(s?.教员姓名 ?? '').trim()
          if (!teacherName) return

          const rate = normalizeRateToPercent(s?.就业率)
          const salary = Number(s?.实际平均就业薪资)
          const salaryVal = Number.isFinite(salary) ? salary : 0

          const prev = byTeacher.get(teacherName) || { rateSum: 0, salarySum: 0, count: 0 }
          prev.rateSum += rate
          prev.salarySum += salaryVal
          prev.count += 1
          byTeacher.set(teacherName, prev)
        })

        aggregatedRows.forEach((row) => {
          const teacherName = String(row.teacherName || '').trim()
          const agg = byTeacher.get(teacherName)
          if (!agg || agg.count <= 0) return

          row.employmentRate = Number((agg.rateSum / agg.count).toFixed(2))
          row.employmentSalary = Number((agg.salarySum / agg.count).toFixed(2))
        })
      } catch (e) {
        console.error('获取就业数据失败:', e)
      }

      setRows(aggregatedRows)
      setAutoFillStatus('')
      message.success('数据获取完成')
      
    } catch (error) {
      console.error('[员工业绩汇总] 获取数据失败:', error)
      message.error('获取数据失败')
      setAutoFillStatus('')
    } finally {
      setLoading(false)
    }
  }, [resolvedCampus, teacherNames, year])

  // 初始化时自动获取数据
  useEffect(() => {
    if (teacherNames.length > 0 && teacherNames[0] !== FALLBACK_NAMES[0]) {
      fetchAndAggregateFromMonthly()
    }
  }, [teacherNames, year, resolvedCampus])

  const averages = useMemo(() => {
    const validRows = rows.filter((row) => row.teacherName.trim() !== '')
    const divisor = validRows.length || 1
    const sumField = (field: MetricKey) =>
      validRows.reduce((acc, row) => acc + (row[field] || 0), 0)
    const avg: Partial<Record<MetricKey, number>> = {}
    ;(
      Object.keys(rows[0] || {}).filter(
        (field) => field !== 'id' && field !== 'teacherName',
      ) as MetricKey[]
    ).forEach((key) => {
      if (SUM_FIELDS.includes(key)) {
        avg[key] = sumField(key) // 累计字段显示总和
      } else {
        avg[key] = Number((sumField(key) / divisor).toFixed(2))
      }
    })
    return { divisor, avg }
  }, [rows])

  const handleValueChange = (
    id: number,
    field: keyof StaffPerformanceRow,
    value: string | number | null,
  ) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row
        if (field === 'teacherName') {
          return { ...row, teacherName: typeof value === 'string' ? value : '' }
        }
        const metric = field as MetricKey
        const numeric = Number(value ?? 0)
        if (RATE_FIELDS.includes(metric)) {
          return { ...row, [metric]: Math.max(0, Math.min(100, Number(numeric.toFixed(2)))) }
        }
        if (INTEGER_FIELDS.includes(metric)) {
          return { ...row, [metric]: Math.max(0, Math.round(numeric)) }
        }
        return { ...row, [metric]: Number(numeric.toFixed(2)) }
      }),
    )
  }

  const handleReset = () => {
    setRows(buildDefaultRows(teacherNames))
    message.success('表格已重置')
  }

  const columns: ColumnsType<StaffPerformanceRow> = [
    { title: '序号', dataIndex: 'id', key: 'id', width: 70, align: 'center' },
    {
      title: '教员姓名',
      dataIndex: 'teacherName',
      key: 'teacherName',
      width: 140,
      render: (value: string, record) => (
        <Input
          value={value}
          onChange={(e) => handleValueChange(record.id, 'teacherName', e.target.value)}
        />
      ),
    },
    ...(
      [
        { key: 'homeworkSubmissionRate', label: '作业提交率' },
        { key: 'homeworkPassRate', label: '作业合格率' },
        { key: 'examPassRate', label: '考试合格率' },
        { key: 'projectPassRate', label: '项目合格率' },
        { key: 'studentSatisfaction', label: '学员满意度' },
        { key: 'studentViolations', label: '学员违纪' },
        { key: 'employmentRate', label: '就业率' },
        { key: 'employmentSalary', label: '就业薪资' },
        { key: 'reputationEnrollment', label: '口碑报名' },
        { key: 'reputationIncome', label: '口碑收入' },
        { key: 'newStudentCount', label: '带新生人数' },
        { key: 'refundCount', label: '退费人数' },
      ] as Array<{ key: MetricKey; label: string }>
    ).map(({ key, label }) => ({
      title: label,
      dataIndex: key,
      key,
      width: 120,
      align: 'right' as const,
      render: (value: number, record: StaffPerformanceRow) => {
        const commonProps = {
          value,
          min: 0,
          style: { width: '100%' },
          onChange: (val: number | null) => handleValueChange(record.id, key, val ?? 0),
        }
        if (RATE_FIELDS.includes(key)) {
          return <InputNumber {...commonProps} max={100} precision={2} addonAfter="%" />
        }
        if (INTEGER_FIELDS.includes(key)) {
          return <InputNumber {...commonProps} precision={0} />
        }
        return <InputNumber {...commonProps} precision={2} />
      },
    })),
  ]

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={<Title level={3}>{`${resolvedCampus}智慧司员工业绩汇总表 (${year}年)`}</Title>}
        extra={
          <Space>
            <Button onClick={handleReset}>重置数据</Button>
            <Button type="primary" onClick={fetchAndAggregateFromMonthly} loading={loading}>
              刷新数据
            </Button>
          </Space>
        }
      >
        <Space wrap style={{ marginBottom: 16 }} align="center">
          <Text>当前神殿</Text>
          <Text strong>{resolvedCampus}</Text>
          <Space>
            <Text>年份</Text>
            <InputNumber
              value={year}
              min={2000}
              max={2100}
              style={{ width: 100 }}
              onChange={(v) => setYear(Number(v) || new Date().getFullYear())}
            />
          </Space>
          {autoFillStatus && (
            <Text type="secondary" style={{ marginLeft: 16 }}>
              {autoFillStatus}
            </Text>
          )}
        </Space>
        <Spin spinning={loading}>
          <Table<StaffPerformanceRow>
            bordered
            size="small"
            columns={columns}
            dataSource={rows}
            pagination={false}
            rowKey="id"
            scroll={{ x: 1500 }}
            summary={() => (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0}>
                  <Text strong>{SUM_FIELDS.length > 0 ? '汇总' : '平均'}</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1}>
                  <Text type="secondary">
                    {averages.divisor > 0 ? `样本：${averages.divisor} 人` : '暂无数据'}
                  </Text>
                </Table.Summary.Cell>
                {(
                  Object.keys(rows[0] || {}).filter(
                    (field) => field !== 'id' && field !== 'teacherName',
                  ) as MetricKey[]
                ).map((key, idx) => (
                  <Table.Summary.Cell key={`avg-${key}`} index={idx + 2} align="right">
                    <Text strong>
                      {SUM_FIELDS.includes(key)
                        ? (averages.avg[key] ?? 0).toFixed(INTEGER_FIELDS.includes(key) ? 0 : 2)
                        : (averages.avg[key] ?? 0).toFixed(2)}
                    </Text>
                  </Table.Summary.Cell>
                ))}
              </Table.Summary.Row>
            )}
          />
        </Spin>
      </Card>
    </div>
  )
}

export default StaffPerformanceSummaryTable
