// [教质模块] 教员功能分析总表服务
/**
 * 教员功能分析总表服务
 */

import { api } from './api'

export interface TeacherFunctionRow {
  key?: string
  index: number
  name?: string
  employmentRate?: number
  employmentSalary?: number
  reputationCount?: number
  reputationIncome?: number
  newStudentCount?: number
  newStudentLoss?: number
  homeworkSubmit?: number
  homeworkPass?: number
  examPass?: number
  projectSubmit?: number
  projectPass?: number
  satisfaction?: number
  violation?: number
  superiorAudit?: number
  teacherAvg?: number
  rowType?: 'avg'
}

export interface TeacherFunctionPlan {
  神殿名称: string
  年份: number
  月份: number
  行数据: Array<{
    记录ID?: number
    序号: number
    姓名?: string
    就业率?: number
    就业薪资?: number
    口碑人数?: number
    口碑收入?: number
    带新生人数?: number
    新生流失人数?: number
    作业提交率?: number
    作业合格率?: number
    考试合格率?: number
    项目提交率?: number
    项目合格率?: number
    学员满意度?: number
    学员违纪?: number
    上级听课?: number
    教员平均?: number
  }>
  创建时间?: string
  更新时间?: string
}

const hasContent = (row: TeacherFunctionRow) =>
  Boolean(
    row.name ||
      row.employmentRate ||
      row.employmentSalary ||
      row.reputationCount ||
      row.reputationIncome ||
      row.newStudentCount ||
      row.newStudentLoss ||
      row.homeworkSubmit ||
      row.homeworkPass ||
      row.examPass ||
      row.projectSubmit ||
      row.projectPass ||
      row.satisfaction ||
      row.violation ||
      row.superiorAudit ||
      row.teacherAvg,
  )

export const getTeacherFunctionPlan = async (
  campus: string,
  year: number,
  month: number,
): Promise<TeacherFunctionPlan> => {
  try {
    const res = await api.get<TeacherFunctionPlan>(
      `/teacher-function-analysis/${encodeURIComponent(campus)}/${year}/${month}`,
    )
    return res.data
  } catch (error: any) {
    if (error.response?.status === 404 || error.response?.status === 500) {
      return { 神殿名称: campus, 年份: year, 月份: month, 行数据: [] }
    }
    throw error
  }
}

export const saveTeacherFunctionPlan = async (
  campus: string,
  year: number,
  month: number,
  rows: TeacherFunctionRow[],
): Promise<TeacherFunctionPlan> => {
  const 行数据 = rows
    .filter((r) => r.rowType !== 'avg')
    .filter(hasContent)
    .map((row) => ({
      序号: row.index,
      姓名: row.name || undefined,
      就业率: row.employmentRate ?? undefined,
      就业薪资: row.employmentSalary ?? undefined,
      口碑人数: row.reputationCount ?? undefined,
      口碑收入: row.reputationIncome ?? undefined,
      带新生人数: row.newStudentCount ?? undefined,
      新生流失人数: row.newStudentLoss ?? undefined,
      作业提交率: row.homeworkSubmit ?? undefined,
      作业合格率: row.homeworkPass ?? undefined,
      考试合格率: row.examPass ?? undefined,
      项目提交率: row.projectSubmit ?? undefined,
      项目合格率: row.projectPass ?? undefined,
      学员满意度: row.satisfaction ?? undefined,
      学员违纪: row.violation ?? undefined,
      上级听课: row.superiorAudit ?? undefined,
      教员平均: row.teacherAvg ?? undefined,
    }))

  const payload = { 神殿名称: campus, 年份: year, 月份: month, 行数据 }

  try {
    const existing = await getTeacherFunctionPlan(campus, year, month)
    if (existing.行数据 && existing.行数据.length > 0) {
      const res = await api.put<TeacherFunctionPlan>(
        `/teacher-function-analysis/${encodeURIComponent(campus)}/${year}/${month}`,
        { 行数据 },
      )
      return res.data
    }
    const res = await api.post<TeacherFunctionPlan>('/teacher-function-analysis/', payload)
    return res.data
  } catch (error: any) {
    if (error.response?.status === 404 || error.response?.status === 500) {
      const res = await api.post<TeacherFunctionPlan>('/teacher-function-analysis/', payload)
      return res.data
    }
    throw error
  }
}

export const deleteTeacherFunctionPlan = async (campus: string, year: number, month: number) =>
  api.delete(`/teacher-function-analysis/${encodeURIComponent(campus)}/${year}/${month}`)
