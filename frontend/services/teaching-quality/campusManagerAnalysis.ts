/**
 * 神殿教化司经理、副经理功能分析表数据服务（对接 teaching-quality 后端）
 */

import type {
  CampusManagerAnalysisRecord,
  CampusManagerAnalysisRequest,
  CampusManagerAnalysisSummary,
} from '../../types/campus-manager-analysis'
import { apiService } from '../api'

// 计算汇总统计数据
const calculateSummary = (data: CampusManagerAnalysisRecord[]): CampusManagerAnalysisSummary => {
  if (data.length === 0) {
    return {
      totalValues: 0,
      totalResponsibility: 0,
      totalExecution: 0,
      totalPlanning: 0,
      totalOrganization: 0,
      totalLeadership: 0,
      totalControl: 0,
      totalStudentEmployment: 0,
      totalReputationEnrollment: 0,
      totalStudentAttrition: 0,
      totalFurtherEducation: 0,
      totalAcademicManagement: 0,
      totalDormitoryManagement: 0,
      totalScore: 0,
      averageScore: 0,
      completedRecords: 0,
      totalRecords: 0,
    }
  }

  const totalValues = data.reduce((sum, item) => sum + (item.ideology.values || 0), 0)
  const totalResponsibility = data.reduce((sum, item) => sum + (item.ideology.responsibility || 0), 0)
  const totalExecution = data.reduce((sum, item) => sum + (item.ideology.execution || 0), 0)
  const totalPlanning = data.reduce((sum, item) => sum + (item.management.planning || 0), 0)
  const totalOrganization = data.reduce((sum, item) => sum + (item.management.organization || 0), 0)
  const totalLeadership = data.reduce((sum, item) => sum + (item.management.leadership || 0), 0)
  const totalControl = data.reduce((sum, item) => sum + (item.management.control || 0), 0)
  const totalStudentEmployment = data.reduce((sum, item) => sum + (item.businessCapability.studentEmployment || 0), 0)
  const totalReputationEnrollment = data.reduce((sum, item) => sum + (item.businessCapability.reputationEnrollment || 0), 0)
  const totalStudentAttrition = data.reduce((sum, item) => sum + (item.businessCapability.studentAttrition || 0), 0)
  const totalFurtherEducation = data.reduce((sum, item) => sum + (item.businessCapability.furtherEducation || 0), 0)
  const totalAcademicManagement = data.reduce((sum, item) => sum + (item.businessCapability.academicManagement || 0), 0)
  const totalDormitoryManagement = data.reduce((sum, item) => sum + (item.businessCapability.dormitoryManagement || 0), 0)
  const totalScore = data.reduce((sum, item) => sum + (item.totalScore || 0), 0)

  const completedRecords = data.filter((item) => (item.totalScore || 0) > 0).length
  const totalRecords = data.length

  const averageScore = totalRecords > 0 ? totalScore / totalRecords : 0

  return {
    totalValues,
    totalResponsibility,
    totalExecution,
    totalPlanning,
    totalOrganization,
    totalLeadership,
    totalControl,
    totalStudentEmployment,
    totalReputationEnrollment,
    totalStudentAttrition,
    totalFurtherEducation,
    totalAcademicManagement,
    totalDormitoryManagement,
    totalScore,
    averageScore,
    completedRecords,
    totalRecords,
  }
}

const mapRowToRecord = (campus: string, row: any): CampusManagerAnalysisRecord => {
  // 优先使用后端返回的行级神殿名称（row.campus 或 row.神殿名称），否则回退为查询参数 campus
  const campusName = String(row?.campus || row?.神殿名称 || campus || '')
  // row 可能来自两种结构：
  // 1) 旧结构：{ month, name, values, ... }
  // 2) 新结构：MonthData.names[i]，已在上层补充了 month
  const sum =
    (Number(row.values || 0)) +
    (Number(row.responsibility || 0)) +
    (Number(row.execution || 0)) +
    (Number(row.planning || 0)) +
    (Number(row.organization || 0)) +
    (Number(row.leadership || 0)) +
    (Number(row.control || 0)) +
    (Number(row.studentEmployment || 0)) +
    (Number(row.reputationEnrollment || 0)) +
    (Number(row.studentAttrition || 0)) +
    (Number(row.furtherEducation || 0)) +
    (Number(row.academicManagement || 0)) +
    (Number(row.dormitoryManagement || 0))

  return {
    key: `${campusName}-${row.month}-${row.name || ''}`,
    month: Number(row.month),
    campus: campusName,
    name: row.name || '',
    ideology: {
      values: Number(row.values || 0),
      responsibility: Number(row.responsibility || 0),
      execution: Number(row.execution || 0),
    },
    management: {
      planning: Number(row.planning || 0),
      organization: Number(row.organization || 0),
      leadership: Number(row.leadership || 0),
      control: Number(row.control || 0),
    },
    businessCapability: {
      studentEmployment: Number(row.studentEmployment || 0),
      reputationEnrollment: Number(row.reputationEnrollment || 0),
      studentAttrition: Number(row.studentAttrition || 0),
      furtherEducation: Number(row.furtherEducation || 0),
      academicManagement: Number(row.academicManagement || 0),
      dormitoryManagement: Number(row.dormitoryManagement || 0),
    },
    totalScore: Number(sum || 0),
  }
}

export const campusManagerAnalysisService = {
  /**
   * 获取神殿经理功能分析数据（后端 teaching-quality）
   */
  getCampusManagerAnalysisData: async (
    campus: string,
    year: number = new Date().getFullYear(),
    position: 'manager' | 'deputy' = 'manager',
  ): Promise<CampusManagerAnalysisRecord[]> => {
    if (!campus) throw new Error('神殿名称不能为空')

    console.log(`[getCampusManagerAnalysisData] 开始请求: campus=${campus}, year=${year}, position=${position}`)
    console.log(`[getCampusManagerAnalysisData] 请求URL: /teaching-quality/campus-manager-analysis`)
    console.log(`[getCampusManagerAnalysisData] 请求参数:`, { campus, year, position })

    const res = await apiService.get<{ campus: string; year: number; rows: any[] }>(
      '/teaching-quality/campus-manager-analysis',
      {
        params: { campus, year, position },
      },
    )

    console.log(`[getCampusManagerAnalysisData] 收到响应: position=${position}, status=${(res as any)?.status}`)
    console.log(`[getCampusManagerAnalysisData] 响应数据:`, res)

    const payload: any = (res as any)?.data || (res as any) || {}

    const makeFlat = (rowsIn: any[]): any[] => {
      const rows: any[] = Array.isArray(rowsIn) ? rowsIn : []
      let flat: any[] = []
      if (rows.some((r: any) => Array.isArray(r?.names))) {
        rows.forEach((m: any) => {
          const month = Number(m?.month || m?.月份 || 0)
          const names: any[] = Array.isArray(m?.names) ? m.names : []
          if (names.length > 0) {
            names.forEach((p) => flat.push({ ...p, month }))
          } else {
            // 前端规则：每个月两行（经理一行、副经理一行）。
            // 若后端该月没有任何数据，则在前端补两条空行，方便直接录入。
            flat.push({ month, name: '', values: 0, responsibility: 0, execution: 0, planning: 0, organization: 0, leadership: 0, control: 0, studentEmployment: 0, reputationEnrollment: 0, studentAttrition: 0, furtherEducation: 0, academicManagement: 0, dormitoryManagement: 0 })
            flat.push({ month, name: '', values: 0, responsibility: 0, execution: 0, planning: 0, organization: 0, leadership: 0, control: 0, studentEmployment: 0, reputationEnrollment: 0, studentAttrition: 0, furtherEducation: 0, academicManagement: 0, dormitoryManagement: 0 })
          }
        })
      } else {
        const byMonth = new Map<number, any[]>()
        rows.forEach((r) => {
          const month = Number(r?.month || r?.月份 || 0)
          if (!month) return
          const list = byMonth.get(month) || []
          list.push(r)
          byMonth.set(month, list)
        })

        flat = []
        for (let m = 1; m <= 12; m++) {
          const monthRows = byMonth.get(m) || []
          // 保留所有记录，不限制数量（支持同月多人，如"郭彩兰"和"姜楠"）
          if (monthRows.length > 0) {
            flat.push(...monthRows)
          } else {
            // 如果该月没有任何数据，补两条空行（方便录入）
            flat.push({ month: m, name: '', values: 0, responsibility: 0, execution: 0, planning: 0, organization: 0, leadership: 0, control: 0, studentEmployment: 0, reputationEnrollment: 0, studentAttrition: 0, furtherEducation: 0, academicManagement: 0, dormitoryManagement: 0 })
            flat.push({ month: m, name: '', values: 0, responsibility: 0, execution: 0, planning: 0, organization: 0, leadership: 0, control: 0, studentEmployment: 0, reputationEnrollment: 0, studentAttrition: 0, furtherEducation: 0, academicManagement: 0, dormitoryManagement: 0 })
          }
        }
      }
      return flat
    }

    // 当前神殿数据
    const rowsPrimary: any[] = Array.isArray(payload.rows) ? payload.rows : []
    let flatRows: any[] = makeFlat(rowsPrimary)

    // 调试：打印处理后的数据
    console.log(`[campusManagerAnalysis] position=${position}, 原始rows数量=${rowsPrimary.length}, 扁平化后数量=${flatRows.length}`)
    if (flatRows.length > 0) {
      console.log(`[campusManagerAnalysis] 前3条扁平化记录:`, flatRows.slice(0, 3).map(r => ({
        month: r.month,
        name: r.name,
        values: r.values,
      })))
    }

    // 兼容"盛邦"与"主神殿"归一：额外拉取同义神殿并合并去重（month+name）
    // 后端已经支持神殿名称变体查询，不需要额外请求

    // 过滤掉 month === 0 的无效数据
    flatRows = flatRows.filter((r) => Number(r?.month || 0) > 0)

    console.log(`[campusManagerAnalysis] 过滤后数量=${flatRows.length}`)

    // 统一排序：按月份升序，其次按姓名。
    // 注意：若姓名为空，为了保持“每月两行”的稳定顺序，不要靠姓名排序打乱顺序。
    // 所以：空姓名排在最后；且当两条都为空时保持原有顺序。
    flatRows.sort((a, b) => {
      const ma = Number(a?.month || 0)
      const mb = Number(b?.month || 0)
      if (ma !== mb) return ma - mb

      const na = String(a?.name || '')
      const nb = String(b?.name || '')
      if (!na && nb) return 1
      if (na && !nb) return -1
      if (!na && !nb) return 0
      return na.localeCompare(nb)
    })

    const mapped = flatRows.map((r) => mapRowToRecord(campus, r))

    // 追加合计行（最后一行用于表格“合计”展示）
    if (mapped.length > 0) {
      const sumRecord: CampusManagerAnalysisRecord = mapped.reduce((acc, cur) => {
        acc.ideology.values += cur.ideology.values || 0
        acc.ideology.responsibility += cur.ideology.responsibility || 0
        acc.ideology.execution += cur.ideology.execution || 0
        acc.management.planning += cur.management.planning || 0
        acc.management.organization += cur.management.organization || 0
        acc.management.leadership += cur.management.leadership || 0
        acc.management.control += cur.management.control || 0
        acc.businessCapability.studentEmployment += cur.businessCapability.studentEmployment || 0
        acc.businessCapability.reputationEnrollment += cur.businessCapability.reputationEnrollment || 0
        acc.businessCapability.studentAttrition += cur.businessCapability.studentAttrition || 0
        acc.businessCapability.furtherEducation += cur.businessCapability.furtherEducation || 0
        acc.businessCapability.academicManagement += cur.businessCapability.academicManagement || 0
        acc.businessCapability.dormitoryManagement += cur.businessCapability.dormitoryManagement || 0
        acc.totalScore += cur.totalScore || 0
        return acc
      }, {
        key: `${campus}-total`,
        month: 13,
        campus: '',
        name: '',
        ideology: { values: 0, responsibility: 0, execution: 0 },
        management: { planning: 0, organization: 0, leadership: 0, control: 0 },
        businessCapability: {
          studentEmployment: 0,
          reputationEnrollment: 0,
          studentAttrition: 0,
          furtherEducation: 0,
          academicManagement: 0,
          dormitoryManagement: 0,
        },
        totalScore: 0,
      } as CampusManagerAnalysisRecord)
      mapped.push(sumRecord)
    }

    return mapped
  },

  /** 获取汇总统计数据 */
  getCampusManagerAnalysisSummary: async (
    campus: string,
    year: number = new Date().getFullYear(),
  ): Promise<CampusManagerAnalysisSummary> => {
    const data = await campusManagerAnalysisService.getCampusManagerAnalysisData(campus, year)
    return calculateSummary(data)
  },

  /**
   * 更新单月数据（后端 upsert）
   */
  updateCampusManagerAnalysisData: async (
    request: CampusManagerAnalysisRequest & {
      month: number
      data: Partial<CampusManagerAnalysisRecord>
      year?: number
      position?: 'manager' | 'deputy'
    },
  ): Promise<CampusManagerAnalysisRecord> => {
    const year = request.year || new Date().getFullYear()
    const campus = request.campus
    if (!campus) throw new Error('神殿名称不能为空')
    const position = request.position || 'manager'

    const row = request.data
    const payload = {
      month: request.month,
      campus,
      name: row?.name,
      values: row?.ideology?.values ?? 0,
      responsibility: row?.ideology?.responsibility ?? 0,
      execution: row?.ideology?.execution ?? 0,
      planning: row?.management?.planning ?? 0,
      organization: row?.management?.organization ?? 0,
      leadership: row?.management?.leadership ?? 0,
      control: row?.management?.control ?? 0,
      studentEmployment: row?.businessCapability?.studentEmployment ?? 0,
      reputationEnrollment: row?.businessCapability?.reputationEnrollment ?? 0,
      studentAttrition: row?.businessCapability?.studentAttrition ?? 0,
      furtherEducation: row?.businessCapability?.furtherEducation ?? 0,
      academicManagement: row?.businessCapability?.academicManagement ?? 0,
      dormitoryManagement: row?.businessCapability?.dormitoryManagement ?? 0,
    }

    const res = await apiService.put<any>(
      `/teaching-quality/campus-manager-analysis/${year}/${request.month}?position=${position}`,
      payload,
    )

    const saved: any = (res as any)?.data || (res as any) || payload
    return mapRowToRecord(campus, saved)
  },

  /** 批量保存（覆盖当年所有月份） */
  saveCampusManagerAnalysisData: async (
    campus: string,
    records: CampusManagerAnalysisRecord[],
    year: number = new Date().getFullYear(),
    position: 'manager' | 'deputy' = 'manager',
  ): Promise<void> => {
    const rows = (records || [])
      .filter((r) => r && r.month !== 13)
      .map((r) => ({
        month: r.month,
        campus,
        name: r.name,
        values: r.ideology?.values || 0,
        responsibility: r.ideology?.responsibility || 0,
        execution: r.ideology?.execution || 0,
        planning: r.management?.planning || 0,
        organization: r.management?.organization || 0,
        leadership: r.management?.leadership || 0,
        control: r.management?.control || 0,
        studentEmployment: r.businessCapability?.studentEmployment || 0,
        reputationEnrollment: r.businessCapability?.reputationEnrollment || 0,
        studentAttrition: r.businessCapability?.studentAttrition || 0,
        furtherEducation: r.businessCapability?.furtherEducation || 0,
        academicManagement: r.businessCapability?.academicManagement || 0,
        dormitoryManagement: r.businessCapability?.dormitoryManagement || 0,
      }))

    // 批量保存操作使用更长的超时时间（60秒）
    await apiService.post(
      `/teaching-quality/campus-manager-analysis?position=${position}`,
      {
        神殿名称: campus,
        年份: year,
        行列表: rows,
      },
      {
        timeout: 60000, // 60秒超时，适合批量操作
      }
    )
  },

  /** 导出（前端拼 CSV） */
  exportCampusManagerAnalysisData: async (
    campus: string,
    year: number = new Date().getFullYear(),
  ): Promise<Blob> => {
    const data = await campusManagerAnalysisService.getCampusManagerAnalysisData(campus, year)

    const csvContent = [
      '月份,神殿,姓名,价值观,责任感,执行力,计划,组织,领导,控制,学员就业,口碑招生,学员流失,升学,教务管理能力,宿舍管理能力,合计分数',
      ...data.map(
        (item) =>
          `${item.month},${campus},${item.name},${item.ideology.values},${item.ideology.responsibility},${item.ideology.execution},${item.management.planning},${item.management.organization},${item.management.leadership},${item.management.control},${item.businessCapability.studentEmployment},${item.businessCapability.reputationEnrollment},${item.businessCapability.studentAttrition},${item.businessCapability.furtherEducation},${item.businessCapability.academicManagement},${item.businessCapability.dormitoryManagement},${item.totalScore}`,
      ),
    ].join('\n')

    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  },
}
