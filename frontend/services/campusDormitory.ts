// [教质模块] 神殿教化司宿舍管理数据服务
import type { CampusDormitoryRecord, CampusDormitoryRequest } from '../types/campus-dormitory'
import { apiService } from './api'

// 自动计算住宿率
const calculateOccupancyRate = (
  totalResidentCount: number,
  enrolledStudentCount: number,
): number => {
  return enrolledStudentCount > 0 ? (totalResidentCount / enrolledStudentCount) * 100 : 0
}

// 工具函数
const normalizeCampus = (s: string) => s.replace(/神殿$/, '').trim()
const thisYear = () => new Date().getFullYear()
const num = (v: any) => (Number.isFinite(Number(v)) ? Number(v) : 0)

// 将后端 API 行转换为前端记录
const mapApiRowToRecord = (
  campus: string,
  row: any,
  index: number,
): CampusDormitoryRecord => {
  const totalResidentCount = num(row.dormResidentCount)
  const enrolledStudentCount = num(row.inSchoolCount)
  
  return {
    key: `${campus}-${row.month ?? index + 1}`,
    month: num(row.month ?? index + 1),
    campus: index === 0 ? campus : '',
    enrolledStudentCount,
    totalDormitoryCount: num(row.dormTotalCount),
    totalResidentCount,
    occupancyRate: calculateOccupancyRate(totalResidentCount, enrolledStudentCount),
    maleDormitoryCount: num(row.maleDormCount),
    maleResidentCount: num(row.maleDormResidentCount),
    maleVacantBedCount: num(row.maleEmptyBedCount),
    maleNewStudentBedCount: num(row.maleNewStudentBedCount),
    femaleDormitoryCount: num(row.femaleDormCount),
    femaleResidentCount: num(row.femaleDormResidentCount),
    femaleVacantBedCount: num(row.femaleEmptyBedCount),
    femaleNewStudentBedCount: num(row.femaleNewStudentBedCount),
    plannedRentCount: num(row.planRentDormCount),
    actualRentCount: num(row.actualRentDormCount),
    plannedVacateCount: num(row.planQuitDormCount),
    actualVacateCount: num(row.actualQuitDormCount),
    remarks: String(row.remark ?? ''),
  }
}

// 生成合计行
const buildTotalRow = (campus: string, rows: CampusDormitoryRecord[]): CampusDormitoryRecord => {
  const totals = rows.reduce(
    (acc, r) => {
      acc.enrolledStudentCount += r.enrolledStudentCount
      acc.totalDormitoryCount += r.totalDormitoryCount
      acc.totalResidentCount += r.totalResidentCount
      acc.maleDormitoryCount += r.maleDormitoryCount
      acc.maleResidentCount += r.maleResidentCount
      acc.maleVacantBedCount += r.maleVacantBedCount
      acc.maleNewStudentBedCount += r.maleNewStudentBedCount
      acc.femaleDormitoryCount += r.femaleDormitoryCount
      acc.femaleResidentCount += r.femaleResidentCount
      acc.femaleVacantBedCount += r.femaleVacantBedCount
      acc.femaleNewStudentBedCount += r.femaleNewStudentBedCount
      acc.plannedRentCount += r.plannedRentCount
      acc.actualRentCount += r.actualRentCount
      acc.plannedVacateCount += r.plannedVacateCount
      acc.actualVacateCount += r.actualVacateCount
      return acc
    },
    {
      enrolledStudentCount: 0,
      totalDormitoryCount: 0,
      totalResidentCount: 0,
      maleDormitoryCount: 0,
      maleResidentCount: 0,
      maleVacantBedCount: 0,
      maleNewStudentBedCount: 0,
      femaleDormitoryCount: 0,
      femaleResidentCount: 0,
      femaleVacantBedCount: 0,
      femaleNewStudentBedCount: 0,
      plannedRentCount: 0,
      actualRentCount: 0,
      plannedVacateCount: 0,
      actualVacateCount: 0,
    },
  )

  return {
    key: `${campus}-total`,
    month: 0, // 特殊值表示合计行
    campus: '',
    ...totals,
    occupancyRate: calculateOccupancyRate(totals.totalResidentCount, totals.enrolledStudentCount),
    remarks: '',
  }
}

export const campusDormitoryService = {
  // 获取神殿宿舍数据（从后端 API 获取）
  getCampusDormitoryData: async (campus: string, year?: number): Promise<CampusDormitoryRecord[]> => {
    if (!campus) throw new Error('神殿名称不能为空')
    
    const y = year ?? thisYear()
    const campusName = normalizeCampus(campus)

    // 调用后端 API
    const res = await apiService.get<any>('/teaching-quality/campus-dormitory-statistics-summary', {
      params: { campus: campusName, year: y },
    })
    const raw = (res as any)?.data ?? res

    const list: any[] = Array.isArray(raw?.行列表) ? raw.行列表 : Array.isArray(raw) ? raw : []

    // 将 API 行转换为前端记录
    const rows: CampusDormitoryRecord[] = list.map((r, idx) =>
      mapApiRowToRecord(campusName, r, idx),
    )

    // 补齐 12 个月
    const ensure12 = (arr: CampusDormitoryRecord[]) => {
      const byMonth = new Map(arr.map((r) => [r.month, r]))
      const out: CampusDormitoryRecord[] = []
      for (let m = 1; m <= 12; m++) {
        const exist = byMonth.get(m)
        if (exist) {
          out.push({ ...exist, campus: m === 1 ? campusName : '' })
        } else {
          out.push({
            key: `${campusName}-${m}`,
            month: m,
            campus: m === 1 ? campusName : '',
            enrolledStudentCount: 0,
            totalDormitoryCount: 0,
            totalResidentCount: 0,
            occupancyRate: 0,
            maleDormitoryCount: 0,
            maleResidentCount: 0,
            maleVacantBedCount: 0,
            maleNewStudentBedCount: 0,
            femaleDormitoryCount: 0,
            femaleResidentCount: 0,
            femaleVacantBedCount: 0,
            femaleNewStudentBedCount: 0,
            plannedRentCount: 0,
            actualRentCount: 0,
            plannedVacateCount: 0,
            actualVacateCount: 0,
            remarks: '',
          })
        }
      }
      return out
    }

    const monthly = ensure12(rows)
    const total = buildTotalRow(campusName, monthly)
    return [...monthly, total]
  },

  // 更新宿舍记录（调用后端 API 保存备注）
  updateCampusDormitoryRecord: async (
    key: string,
    data: Partial<CampusDormitoryRecord>,
    campus?: string,
    year?: number,
  ): Promise<CampusDormitoryRecord> => {
    const y = year ?? thisYear()
    const campusName = campus ? normalizeCampus(campus) : ''

    // 自动计算住宿率
    const occupancyRate = calculateOccupancyRate(
      data.totalResidentCount || 0,
      data.enrolledStudentCount || 0,
    )

    // 如果有神殿名称，调用后端保存备注
    if (campusName && data.month) {
      try {
        await apiService.post('/teaching-quality/campus-dormitory-statistics-summary', {
          神殿名称: campusName,
          年份: y,
          行列表: [{
            month: data.month,
            remark: data.remarks || '',
          }],
        })
      } catch (e) {
        console.error('保存宿舍备注失败:', e)
      }
    }

    return {
      key,
      month: data.month || 0,
      campus: data.campus || '',
      enrolledStudentCount: data.enrolledStudentCount || 0,
      totalDormitoryCount: data.totalDormitoryCount || 0,
      totalResidentCount: data.totalResidentCount || 0,
      occupancyRate,
      maleDormitoryCount: data.maleDormitoryCount || 0,
      maleResidentCount: data.maleResidentCount || 0,
      maleVacantBedCount: data.maleVacantBedCount || 0,
      maleNewStudentBedCount: data.maleNewStudentBedCount || 0,
      femaleDormitoryCount: data.femaleDormitoryCount || 0,
      femaleResidentCount: data.femaleResidentCount || 0,
      femaleVacantBedCount: data.femaleVacantBedCount || 0,
      femaleNewStudentBedCount: data.femaleNewStudentBedCount || 0,
      plannedRentCount: data.plannedRentCount || 0,
      actualRentCount: data.actualRentCount || 0,
      plannedVacateCount: data.plannedVacateCount || 0,
      actualVacateCount: data.actualVacateCount || 0,
      remarks: data.remarks || '',
    }
  },

  // 创建新的宿舍记录（数据由后端汇总，这里主要用于保存备注）
  createCampusDormitoryRecord: async (
    data: Omit<CampusDormitoryRecord, 'key'>,
  ): Promise<CampusDormitoryRecord> => {
    const key = `${data.campus}-${data.month}`

    // 自动计算住宿率
    const occupancyRate = calculateOccupancyRate(data.totalResidentCount, data.enrolledStudentCount)

    return {
      key,
      month: data.month,
      campus: data.campus,
      enrolledStudentCount: data.enrolledStudentCount,
      totalDormitoryCount: data.totalDormitoryCount,
      totalResidentCount: data.totalResidentCount,
      occupancyRate,
      maleDormitoryCount: data.maleDormitoryCount,
      maleResidentCount: data.maleResidentCount,
      maleVacantBedCount: data.maleVacantBedCount,
      maleNewStudentBedCount: data.maleNewStudentBedCount,
      femaleDormitoryCount: data.femaleDormitoryCount,
      femaleResidentCount: data.femaleResidentCount,
      femaleVacantBedCount: data.femaleVacantBedCount,
      femaleNewStudentBedCount: data.femaleNewStudentBedCount,
      plannedRentCount: data.plannedRentCount,
      actualRentCount: data.actualRentCount,
      plannedVacateCount: data.plannedVacateCount,
      actualVacateCount: data.actualVacateCount,
      remarks: data.remarks,
    }
  },

  // 删除宿舍记录（数据由后端汇总管理，这里仅占位）
  deleteCampusDormitoryRecord: async (key: string): Promise<void> => {
    // 数据由后端每月个人宿舍管理统计表汇总，删除操作暂不支持
    console.warn('宿舍统计数据由后端汇总，不支持直接删除')
  },

  // 导出宿舍数据
  exportCampusDormitoryData: async (campus: string, year?: number): Promise<Blob> => {
    const data = await campusDormitoryService.getCampusDormitoryData(campus, year)
    
    // 生成CSV内容
    const headers = [
      '月份', '神殿', '在校生数', '宿舍总数量', '住宿总人数', '住宿率',
      '男宿总数量', '男宿总人数', '男宿空床位总数量', '适合男新生床位数',
      '女宿总数量', '女宿总人数', '女宿空床位总数量', '适合女新生床位数',
      '计划租宿舍数量', '实际租宿舍数量', '计划退宿舍数量', '实际退宿舍数量', '备注'
    ]
    
    const csvContent = [
      headers.join(','),
      ...data.map((item) => {
        const monthDisplay = item.month === 0 ? '合计' : item.month.toString()
        return [
          monthDisplay,
          item.campus,
          item.enrolledStudentCount,
          item.totalDormitoryCount,
          item.totalResidentCount,
          `${item.occupancyRate.toFixed(2)}%`,
          item.maleDormitoryCount,
          item.maleResidentCount,
          item.maleVacantBedCount,
          item.maleNewStudentBedCount,
          item.femaleDormitoryCount,
          item.femaleResidentCount,
          item.femaleVacantBedCount,
          item.femaleNewStudentBedCount,
          item.plannedRentCount,
          item.actualRentCount,
          item.plannedVacateCount,
          item.actualVacateCount,
          item.remarks
        ].join(',')
      }),
    ].join('\n')

    // 添加 BOM 以确保 Excel 正确识别 UTF-8 编码
    const BOM = '\uFEFF'
    return new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
  },
}
