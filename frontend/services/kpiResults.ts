// [教质模块] KPI 结果服务
import { api } from './api'

export interface KpiTemplate {
  id: number
  role: string
  indicator: string
  formula?: string | null
  dataSource?: string | null
  defaultWeight?: number | null
  orderIndex: number
}

export interface KpiResultRow {
  templateId?: number | null
  indicator: string
  formula?: string | null
  dataSource?: string | null
  weight?: number | null
  score?: number | null
  kpiValue?: number | null
  orderIndex?: number | null
}

export interface KpiResultEntry {
  teacherId?: number | null
  teacherName: string
  role?: string | null
  rows: KpiResultRow[]
}

export interface FetchKpiResultParams {
  campus: string
  year: number
  month: number
}

export const fetchKpiTemplates = async (role?: string) => {
  const res = await api.get<{ templates: any[] }>('/kpi-results/templates', {
    params: role ? { role } : undefined,
  })
  return res.data.templates.map((tpl) => ({
    id: tpl.id,
    role: tpl.role,
    indicator: tpl.indicator,
    formula: tpl.formula,
    dataSource: tpl.data_source,
    defaultWeight: tpl.default_weight,
    orderIndex: tpl.order_index,
  })) as KpiTemplate[]
}

export const fetchKpiResults = async (params: FetchKpiResultParams) => {
  const res = await api.get<{ campus: string; year: number; month: number; entries: any[] }>(
    '/kpi-results',
    { params },
  )
  return {
    campus: res.data.campus,
    year: res.data.year,
    month: res.data.month,
    entries: (res.data.entries || []).map((entry) => ({
      teacherId: entry.teacher_id,
      teacherName: entry.teacher_name,
      role: entry.role,
      rows: (entry.rows || []).map((row: any) => ({
        templateId: row.template_id,
        indicator: row.indicator,
        formula: row.formula,
        dataSource: row.data_source,
        weight: row.weight,
        score: row.score,
        kpiValue: row.kpiValue ?? row.kpi_value,
        orderIndex: row.orderIndex ?? row.order_index,
      })),
    })) as KpiResultEntry[],
  }
}

export const saveKpiResults = async (payload: {
  campus: string
  year: number
  month: number
  entries: KpiResultEntry[]
}) => {
  const res = await api.post('/kpi-results', {
    campus: payload.campus,
    year: payload.year,
    month: payload.month,
    entries: payload.entries.map((entry) => ({
      teacher_id: entry.teacherId,
      teacher_name: entry.teacherName,
      role: entry.role,
      rows: entry.rows.map((row) => ({
        template_id: row.templateId,
        indicator: row.indicator,
        formula: row.formula,
        data_source: row.dataSource,
        weight: row.weight,
        score: row.score,
        kpi_value: row.kpiValue,
        order_index: row.orderIndex,
      })),
    })),
  })
  return res.data
}

export interface KpiAssessmentRecord {
  name: string
  departmentPerformance: number | string | null
  assignmentSubmitRate: number | string | null
  assignmentPassRate: number | string | null
  examPassRate: number | string | null
  employmentCount: number | string | null
  employmentSalary: number | string | null
  attendanceRate: number | string | null
  oldStudentLoss: number | string | null
  newStudentLoss: number | string | null
  satisfaction: number | string | null
  recruitmentCompletion: number | string | null
  wechatMoments: number | string | null
  kuaishouShares: number | string | null
  douyinShares: number | string | null
  newMediaTotal: number | string | null
  leaderReview: number | string | null
}

export const saveKpiAssessment = async (payload: {
  campus: string
  year: number
  month: number
  records: KpiAssessmentRecord[]
}) => {
  const res = await api.post('/kpi-results/assessment', {
    campus: payload.campus,
    year: payload.year,
    month: payload.month,
    records: payload.records.map((record) => ({
      name: record.name,
      department_performance: record.departmentPerformance,
      assignment_submit_rate: record.assignmentSubmitRate,
      assignment_pass_rate: record.assignmentPassRate,
      exam_pass_rate: record.examPassRate,
      employment_count: record.employmentCount,
      employment_salary: record.employmentSalary,
      attendance_rate: record.attendanceRate,
      old_student_loss: record.oldStudentLoss,
      new_student_loss: record.newStudentLoss,
      satisfaction: record.satisfaction,
      recruitment_completion: record.recruitmentCompletion,
      wechat_moments: record.wechatMoments,
      kuaishou_shares: record.kuaishouShares,
      douyin_shares: record.douyinShares,
      new_media_total: record.newMediaTotal,
      leader_review: record.leaderReview,
    })),
  })
  return res.data
}

export const fetchKpiAssessment = async (params: {
  campus: string
  year: number
  month: number
}) => {
  const res = await api.get<{ campus: string; year: number; month: number; records: any[] }>(
    '/kpi-results/assessment',
    { params },
  )
  return res.data
}
