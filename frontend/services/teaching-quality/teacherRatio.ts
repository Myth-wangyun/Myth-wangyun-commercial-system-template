/**
 * 神殿教化司师资配比表数据服务（真实数据对接 teaching-quality 模块）
 */

import type { TeacherRatioRecord } from '../../types/teacher-ratio'
import { apiService } from '../api'
import { fetchUserPermissions } from '../configMaster'

const thisYear = () => new Date().getFullYear()

// 数值兜底：未找到/为空/NaN 统一按 0 处理
const num = (v: any): number => {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

const fetchCampusJZEmployeeCounts = async (campus: string) => {
  // 口径：部门=教化司
  // - 老师：职位=班主任
  // - 中层：职位!=班主任（且有职位）
  // 员工管理里的神殿字段是“xx神殿”，这里做一次兜底转换
  const campusForEmployee = campus?.includes('神殿') ? campus : `${campus}神殿`
  const list = await fetchUserPermissions({ campus: campusForEmployee, department: '教化司' })
  const teacherCount = list.filter((e) => (e.position || '') === '班主任').length
  const middleManagementCount = list.filter((e) => {
    const p = (e.position || '').trim()
    return p !== '' && p !== '班主任'
  }).length
  return { teacherCount, middleManagementCount }
}

/**
 * 学生总人数：从“神殿教化司核心数据汇总表”接口获取。
 * 后端内部会从 teaching_quality.班级档案表 统计。
 *
 * 注意：你要求只统计学员状态为 在读/复学/升学。
 * 目前后端这段统计代码是 count(记录ID)（未按 studentStatus 过滤）。
 * 如果后端已更新为按 studentStatus 过滤，这里即可直接使用。
 */
const fetchCampusStudentTotalFromClassFile = async (campus: string, year: number): Promise<number> => {
  const res = await apiService.get<any>('/teaching-quality/campus-core-data-summary', {
    params: { campus, year },
  })
  const raw = (res as any)?.data ?? res
  return num(raw?.学生总人数 ?? raw?.在校生人数)
}

export const teacherRatioService = {
  /**
   * 从数据库读取（默认当前年）
   * 展示为年度表：固定 1~12 月 + 合计
   * - 当月：自动获取（实际老师/中层、学生总人数）
   * - 以前月份：从数据库读取
   */
  async getTeacherRatioData(campus: string, year?: number): Promise<TeacherRatioRecord[]> {
    if (!campus) throw new Error('神殿名称不能为空')

    const now = new Date()
    const currentMonth = now.getMonth() + 1

    const y = year ?? thisYear()

    // 1) 实际老师/中层：从配置中心（员工管理）取数（当月自动获取）
    let actualTeacherCountFromCfg = 0
    let actualMiddleManagementCountFromCfg = 0
    try {
      const counts = await fetchCampusJZEmployeeCounts(campus)
      actualTeacherCountFromCfg = counts.teacherCount
      actualMiddleManagementCountFromCfg = counts.middleManagementCount
    } catch {
      actualTeacherCountFromCfg = 0
      actualMiddleManagementCountFromCfg = 0
    }

    // 2) 学生总人数：从班级档案表口径的汇总接口获取（当月自动获取）
    let studentTotalFromClassFile = 0
    try {
      studentTotalFromClassFile = await fetchCampusStudentTotalFromClassFile(campus, y)
    } catch {
      studentTotalFromClassFile = 0
    }

    // 3) 历史月份：从数据库读取
    const res = await apiService.get<any>('/teaching-quality/campus-teacher-ratio', {
      params: { campus, year: y },
    })
    const raw = (res as any)?.data ?? res
    const list: any[] = Array.isArray(raw?.行列表) ? raw.行列表 : Array.isArray(raw) ? raw : []

    const dbMap = new Map<number, any>()
    for (const r of list) {
      const m = num(r.month ?? r.月份)
      if (m >= 1 && m <= 12) dbMap.set(m, r)
    }

    // 4) 固定展示 1~12 月（即使只有 1 月有数据，其余月份也显示空行）
    const rows: TeacherRatioRecord[] = []

    for (let m = 1; m <= 12; m++) {
      const isCurrent = m === currentMonth
      const db = dbMap.get(m)

      const targetTeacherCount = num(db?.targetTeacherCount ?? db?.目标老师总数)
      const targetMiddleManagementCount = num(db?.targetMiddleManagementCount ?? db?.目标中层人数)

      const targetStudentTeacherRatio = String(db?.targetStudentTeacherRatio ?? db?.目标师生配比 ?? '1:50')
      const targetMiddleManagementRatio = String(
        db?.targetMiddleManagementRatio ?? db?.目标中层与班主任配比 ?? '',
      )

      // 学生总人数：当月自动获取；历史月份从数据库取
      const studentTotal = isCurrent
        ? studentTotalFromClassFile
        : num(db?.studentTotal ?? db?.学生总人数)

      // 实际人数：当月自动获取；历史月份从数据库取
      const actualTeacherCount = isCurrent
        ? actualTeacherCountFromCfg
        : num(db?.actualTeacherCount ?? db?.实际老师数量)

      const actualMiddleManagementCount = isCurrent
        ? actualMiddleManagementCountFromCfg
        : num(db?.actualMiddleManagementCount ?? db?.实际中层人数)

      // 空缺/冗余：统一按“目标 vs 实际”计算
      const headmasterVacancy = Math.max(0, targetTeacherCount - actualTeacherCount)
      const headmasterRedundancy = Math.max(0, actualTeacherCount - targetTeacherCount)
      const middleManagementVacancy = Math.max(0, targetMiddleManagementCount - actualMiddleManagementCount)
      const middleManagementRedundancy = Math.max(0, actualMiddleManagementCount - targetMiddleManagementCount)

      rows.push({
        id: `${campus}-${m}`,
        month: m,
        statisticsTime: '',
        campus: m === 1 ? campus : '',
        studentTotal,
        targetStudentTeacherRatio,
        targetTeacherCount,
        actualTeacherCount,
        headmasterVacancy,
        headmasterRedundancy,
        targetMiddleManagementRatio,
        targetMiddleManagementCount,
        actualMiddleManagementCount,
        middleManagementVacancy,
        middleManagementRedundancy,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    }

    // 合计行（基于 1~12 行；如果你希望只合计到当月，我也可以改成 1..currentMonth）
    const totalRow: TeacherRatioRecord = {
      id: `${campus}-${y}-total`,
      month: 13,
      statisticsTime: '',
      campus: '',
      studentTotal: rows.reduce((s, r) => s + num(r.studentTotal), 0),
      targetStudentTeacherRatio: '',
      targetTeacherCount: rows.reduce((s, r) => s + num(r.targetTeacherCount), 0),
      actualTeacherCount: rows.reduce((s, r) => s + num(r.actualTeacherCount), 0),
      headmasterVacancy: rows.reduce((s, r) => s + num(r.headmasterVacancy), 0),
      headmasterRedundancy: rows.reduce((s, r) => s + num(r.headmasterRedundancy), 0),
      targetMiddleManagementRatio: '',
      targetMiddleManagementCount: rows.reduce((s, r) => s + num(r.targetMiddleManagementCount), 0),
      actualMiddleManagementCount: rows.reduce((s, r) => s + num(r.actualMiddleManagementCount), 0),
      middleManagementVacancy: rows.reduce((s, r) => s + num(r.middleManagementVacancy), 0),
      middleManagementRedundancy: rows.reduce((s, r) => s + num(r.middleManagementRedundancy), 0),
      isTotal: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    return [...rows, totalRow]
  },

  /** 保存/更新单月 */
  async saveTeacherRatioItem(
    campus: string,
    year: number,
    month: number,
    data: Partial<TeacherRatioRecord>,
  ): Promise<void> {
    await apiService.post('/teaching-quality/campus-teacher-ratio', {
      campus,
      year,
      month,
      data,
    })
  },

  /** 导出（数据库数据） */
  async exportTeacherRatioData(campus: string, year?: number): Promise<Blob> {
    const data = await this.getTeacherRatioData(campus, year)
    const csvContent = [
      '月份,神殿,学生总人数,目标师生配比,目标老师总数,实际老师数量,班主任空缺职数,班主任冗余职数,目标中层与班主任配比,目标中层人数,实际中层人数,中层空缺职数,中层冗余职数',
      ...data.map(
        (item: TeacherRatioRecord) =>
          `${num(item.month)},${item.campus || ''},${num(item.studentTotal)},${item.targetStudentTeacherRatio || ''},${num(item.targetTeacherCount)},${num(item.actualTeacherCount)},${num(item.headmasterVacancy)},${num(item.headmasterRedundancy)},${item.targetMiddleManagementRatio || ''},${num(item.targetMiddleManagementCount)},${num(item.actualMiddleManagementCount)},${num(item.middleManagementVacancy)},${num(item.middleManagementRedundancy)}`,
      ),
    ].join('\n')
    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  },
}
