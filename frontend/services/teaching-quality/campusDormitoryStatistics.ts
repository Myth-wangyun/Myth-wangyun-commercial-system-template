/**
 * 神殿教化司现有宿舍统计表数据服务
 * 数据来源：/api/v1/teaching-quality/campus-dormitory-statistics-summary
 */

import type { CampusDormitoryStatisticsRecord } from '../../types/campus-dormitory-statistics'
import { apiService } from '../api'

// 工具函数
const normalizeCampus = (s: string) => s.replace(/神殿$/, '').trim()
const thisYear = () => new Date().getFullYear()
const num = (v: any) => (Number.isFinite(Number(v)) ? Number(v) : 0)

// 将后端 API 行转换为前端记录
const mapApiRowToRecord = (
  campus: string,
  row: any,
  index: number,
): CampusDormitoryStatisticsRecord => {
  const totalResidents = num(row.dormResidentCount)
  const totalStudents = num(row.inSchoolCount)
  const occupancyRate = totalStudents > 0 
    ? `${((totalResidents / totalStudents) * 100).toFixed(2)}%` 
    : '0%'

  return {
    key: `${campus}-${row.month ?? index + 1}`,
    month: num(row.month ?? index + 1),
    campus: index === 0 ? campus : '',
    totalStudents,
    totalDormitories: num(row.dormTotalCount),
    totalResidents,
    occupancyRate,
    maleDormitories: num(row.maleDormCount),
    maleResidents: num(row.maleDormResidentCount),
    maleEmptyBeds: num(row.maleEmptyBedCount),
    maleNewStudentBeds: num(row.maleNewStudentBedCount),
    femaleDormitories: num(row.femaleDormCount),
    femaleResidents: num(row.femaleDormResidentCount),
    femaleEmptyBeds: num(row.femaleEmptyBedCount),
    femaleNewStudentBeds: num(row.femaleNewStudentBedCount),
    plannedRentDormitories: num(row.planRentDormCount),
    actualRentDormitories: num(row.actualRentDormCount),
    plannedReturnDormitories: num(row.planQuitDormCount),
    actualReturnDormitories: num(row.actualQuitDormCount),
    remarks: String(row.remark ?? ''),
    isTotal: false,
  }
}

// 生成合计行
const buildTotalRow = (campus: string, rows: CampusDormitoryStatisticsRecord[]): CampusDormitoryStatisticsRecord => {
  const totals = rows.reduce(
    (acc, r) => {
      acc.totalStudents += r.totalStudents
      acc.totalDormitories += r.totalDormitories
      acc.totalResidents += r.totalResidents
      acc.maleDormitories += r.maleDormitories
      acc.maleResidents += r.maleResidents
      acc.maleEmptyBeds += r.maleEmptyBeds
      acc.maleNewStudentBeds += r.maleNewStudentBeds
      acc.femaleDormitories += r.femaleDormitories
      acc.femaleResidents += r.femaleResidents
      acc.femaleEmptyBeds += r.femaleEmptyBeds
      acc.femaleNewStudentBeds += r.femaleNewStudentBeds
      acc.plannedRentDormitories += r.plannedRentDormitories
      acc.actualRentDormitories += r.actualRentDormitories
      acc.plannedReturnDormitories += r.plannedReturnDormitories
      acc.actualReturnDormitories += r.actualReturnDormitories
      return acc
    },
    {
      totalStudents: 0,
      totalDormitories: 0,
      totalResidents: 0,
      maleDormitories: 0,
      maleResidents: 0,
      maleEmptyBeds: 0,
      maleNewStudentBeds: 0,
      femaleDormitories: 0,
      femaleResidents: 0,
      femaleEmptyBeds: 0,
      femaleNewStudentBeds: 0,
      plannedRentDormitories: 0,
      actualRentDormitories: 0,
      plannedReturnDormitories: 0,
      actualReturnDormitories: 0,
    },
  )

  const occupancyRate = totals.totalStudents > 0
    ? `${((totals.totalResidents / totals.totalStudents) * 100).toFixed(2)}%`
    : '0%'

  return {
    key: `${campus}-total`,
    month: 0,
    campus: '',
    ...totals,
    occupancyRate,
    remarks: '',
    isTotal: true,
  }
}

export const campusDormitoryStatisticsService = {
  /**
   * 获取指定神殿的宿舍统计月度数据（从后端 API 获取）
   * @param campus 神殿名称
   * @param year 年份（可选，默认当前年）
   * @returns Promise<CampusDormitoryStatisticsRecord[]>
   */
  getCampusDormitoryStatisticsData: async (
    campus: string,
    year?: number,
  ): Promise<CampusDormitoryStatisticsRecord[]> => {
    if (!campus) {
      throw new Error('神殿名称不能为空')
    }

    const y = year ?? thisYear()
    const campusName = normalizeCampus(campus)

    // 调用后端 API
    const res = await apiService.get<any>('/teaching-quality/campus-dormitory-statistics-summary', {
      params: { campus: campusName, year: y },
    })
    const raw = (res as any)?.data ?? res

    const list: any[] = Array.isArray(raw?.行列表) ? raw.行列表 : Array.isArray(raw) ? raw : []

    // 将 API 行转换为前端记录
    const rows: CampusDormitoryStatisticsRecord[] = list.map((r, idx) =>
      mapApiRowToRecord(campusName, r, idx),
    )

    // 补齐 12 个月
    const ensure12 = (arr: CampusDormitoryStatisticsRecord[]) => {
      const byMonth = new Map(arr.map((r) => [r.month, r]))
      const out: CampusDormitoryStatisticsRecord[] = []
      for (let m = 1; m <= 12; m++) {
        const exist = byMonth.get(m)
        if (exist) {
          out.push({ ...exist, campus: m === 1 ? campusName : '' })
        } else {
          out.push({
            key: `${campusName}-${m}`,
            month: m,
            campus: m === 1 ? campusName : '',
            totalStudents: 0,
            totalDormitories: 0,
            totalResidents: 0,
            occupancyRate: '0%',
            maleDormitories: 0,
            maleResidents: 0,
            maleEmptyBeds: 0,
            maleNewStudentBeds: 0,
            femaleDormitories: 0,
            femaleResidents: 0,
            femaleEmptyBeds: 0,
            femaleNewStudentBeds: 0,
            plannedRentDormitories: 0,
            actualRentDormitories: 0,
            plannedReturnDormitories: 0,
            actualReturnDormitories: 0,
            remarks: '',
            isTotal: false,
          })
        }
      }
      return out
    }

    const monthly = ensure12(rows)
    const total = buildTotalRow(campusName, monthly)
    return [...monthly, total]
  },

  /**
   * 导出指定神殿的宿舍统计数据
   * @param campus 神殿名称
   * @param year 年份（可选）
   * @returns Promise<Blob>
   */
  exportCampusDormitoryStatisticsData: async (campus: string, year?: number): Promise<Blob> => {
    const data = await campusDormitoryStatisticsService.getCampusDormitoryStatisticsData(campus, year)

    // 生成CSV内容
    const csvContent = [
      '月份,神殿,在校生数,宿舍总数量,住宿总人数,住宿率,男宿总数量,男宿总人数,男宿空床位总数量,适合男新生床位数,女宿总数量,女宿总人数,女宿空床位总数量,适合女新生住宿床位,计划租宿舍数量,实际租宿舍数量,计划退宿舍数量,实际退宿舍数量,备注',
      ...data.map((item) => {
        const monthDisplay = item.isTotal ? '合计' : item.month.toString()
        return `${monthDisplay},${item.campus},${item.totalStudents},${item.totalDormitories},${item.totalResidents},${item.occupancyRate},${item.maleDormitories},${item.maleResidents},${item.maleEmptyBeds},${item.maleNewStudentBeds},${item.femaleDormitories},${item.femaleResidents},${item.femaleEmptyBeds},${item.femaleNewStudentBeds},${item.plannedRentDormitories},${item.actualRentDormitories},${item.plannedReturnDormitories},${item.actualReturnDormitories},${item.remarks}`
      }),
    ].join('\n')

    // 添加 BOM 以确保 Excel 正确识别 UTF-8 编码
    const BOM = '\uFEFF'
    return new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
  },
}
