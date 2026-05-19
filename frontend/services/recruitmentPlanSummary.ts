// [教质模块] 神殿教化司招聘计划与总结汇总表数据服务
/**
 * 神殿教化司招聘计划与总结汇总表数据服务
 * 已接入后端 API：/api/v1/teaching-quality/recruitment-plan-summary
 */

import type { RecruitmentPlanSummaryRecord } from '../types/recruitment-plan-summary'

// API响应数据类型
interface ApiRecruitmentPlanData {
  id: number
  campus: string
  year: number
  month: number
  planned_recruitment: number
  actual_onboarded: number
  resigned: number
  planned_position_name?: string
  actual_position_name?: string
  new_hire_names?: string
  departure_names?: string
}

// 将API响应转换为前端数据格式
const transformApiToRecord = (item: ApiRecruitmentPlanData): RecruitmentPlanSummaryRecord => ({
  id: String(item.id),
  month: item.month,
  campus: item.campus,
  plannedPositionName: item.planned_position_name || '',
  plannedRecruitmentCount: item.planned_recruitment || 0,
  actualPositionName: item.actual_position_name || '',
  actualRecruitmentCount: item.actual_onboarded || 0,
  newHireNames: item.new_hire_names || '',
  departureCount: item.resigned || 0,
  departureNames: item.departure_names || '',
})

// 将前端数据转换为API请求格式
const transformRecordToApi = (record: RecruitmentPlanSummaryRecord, year: number) => ({
  campus: record.campus,
  year,
  month: record.month,
  planned_recruitment: record.plannedRecruitmentCount,
  actual_onboarded: record.actualRecruitmentCount,
  resigned: record.departureCount,
  planned_position_name: record.plannedPositionName,
  actual_position_name: record.actualPositionName,
  new_hire_names: record.newHireNames,
  departure_names: record.departureNames,
})

export const recruitmentPlanSummaryService = {
  /**
   * 获取招聘计划数据
   * @param campus 神殿名称
   * @param year 年份（可选，默认当前年）
   * @returns Promise<RecruitmentPlanSummaryRecord[]>
   */
  getRecruitmentPlanData: async (campus: string, year?: number): Promise<RecruitmentPlanSummaryRecord[]> => {
    if (!campus) {
      throw new Error('神殿名称不能为空')
    }

    const currentYear = year || new Date().getFullYear()
    
    try {
      const response = await fetch(
        `/api/v1/teaching-quality/recruitment-plan-summary/campus/${encodeURIComponent(campus)}?year=${currentYear}`
      )
      
      if (!response.ok) {
        throw new Error('获取数据失败')
      }
      
      const data: ApiRecruitmentPlanData[] = await response.json()
      
      // 创建12个月的完整数据（如果API返回不足12个月）
      const records: RecruitmentPlanSummaryRecord[] = []
      for (let month = 1; month <= 12; month++) {
        const existing = data.find(item => item.month === month)
        if (existing) {
          records.push(transformApiToRecord(existing))
        } else {
          // 创建空记录
          records.push({
            id: `new-${campus}-${month}`,
            month,
            campus,
            plannedPositionName: '',
            plannedRecruitmentCount: 0,
            actualPositionName: '',
            actualRecruitmentCount: 0,
            newHireNames: '',
            departureCount: 0,
            departureNames: '',
          })
        }
      }
      
      return records
    } catch (error) {
      console.error('获取招聘计划数据失败:', error)
      // 返回空的12个月数据
      return Array.from({ length: 12 }, (_, i) => ({
        id: `new-${campus}-${i + 1}`,
        month: i + 1,
        campus,
        plannedPositionName: '',
        plannedRecruitmentCount: 0,
        actualPositionName: '',
        actualRecruitmentCount: 0,
        newHireNames: '',
        departureCount: 0,
        departureNames: '',
      }))
    }
  },

  /**
   * 批量保存招聘计划数据
   * @param records 要保存的记录数组
   * @param year 年份
   * @returns Promise<RecruitmentPlanSummaryRecord[]>
   */
  saveRecruitmentPlanData: async (
    records: RecruitmentPlanSummaryRecord[],
    year?: number
  ): Promise<RecruitmentPlanSummaryRecord[]> => {
    const currentYear = year || new Date().getFullYear()
    
    const apiData = records.map(record => transformRecordToApi(record, currentYear))
    
    const response = await fetch('/api/v1/teaching-quality/recruitment-plan-summary/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apiData),
    })
    
    if (!response.ok) {
      throw new Error('保存数据失败')
    }
    
    const savedData: ApiRecruitmentPlanData[] = await response.json()
    return savedData.map(transformApiToRecord)
  },

  /**
   * 更新单条招聘计划数据
   * @param record 要更新的记录
   * @param year 年份
   * @returns Promise<RecruitmentPlanSummaryRecord>
   */
  updateRecruitmentPlanData: async (
    record: RecruitmentPlanSummaryRecord,
    year?: number
  ): Promise<RecruitmentPlanSummaryRecord> => {
    const results = await recruitmentPlanSummaryService.saveRecruitmentPlanData([record], year)
    return results[0]
  },

  /**
   * 导出招聘计划数据
   * @param campus 神殿名称
   * @returns Promise<Blob>
   */
  exportRecruitmentPlanData: async (campus: string): Promise<Blob> => {
    const data = await recruitmentPlanSummaryService.getRecruitmentPlanData(campus)

    // 生成CSV内容
    const headers = [
      '月份',
      '神殿',
      '计划招聘岗位名称',
      '计划招聘人数',
      '实际招聘岗位名称',
      '实际招聘人数',
      '入职者姓名',
      '离职人数',
      '离职者姓名',
    ]
    const csvContent = [
      headers.join(','),
      ...data.map(
        (item) =>
          `${item.month},${item.campus},${item.plannedPositionName},${item.plannedRecruitmentCount},${item.actualPositionName},${item.actualRecruitmentCount},${item.newHireNames},${item.departureCount},${item.departureNames}`,
      ),
    ].join('\n')

    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  },
}
