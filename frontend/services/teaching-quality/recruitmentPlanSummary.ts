/**
 * 神殿教化司招聘计划与总结汇总表数据服务
 */

import type { RecruitmentPlanSummaryRecord } from '../../types/recruitment-plan-summary'

// 模拟数据生成器
const generateMockData = (campus: string): RecruitmentPlanSummaryRecord[] => {
  const records: RecruitmentPlanSummaryRecord[] = []

  // 岗位类型
  const positions = ['班主任', '教务老师', '就业老师', '招生顾问', '市场专员']

  // 生成12条记录
  for (let i = 1; i <= 12; i++) {
    const hasRecruitment = Math.random() > 0.3 // 70%概率有招聘
    const hasDeparture = Math.random() > 0.5 // 50%概率有离职

    let plannedPositionName = ''
    let plannedCount = 0
    let actualPositionName = ''
    let actualCount = 0
    let newHireNames = ''
    let departureCount = 0
    let departureNames = ''

    if (hasRecruitment) {
      plannedPositionName = positions[Math.floor(Math.random() * positions.length)]
      plannedCount = Math.floor(Math.random() * 3) + 1
      actualPositionName = plannedPositionName
      actualCount = plannedCount - Math.floor(Math.random() * 2)
      newHireNames = actualCount > 0 ? `新员工${actualCount > 1 ? '1,新员工2' : '1'}` : ''
    }

    if (hasDeparture) {
      departureCount = Math.floor(Math.random() * 2) + 1
      departureNames = departureCount > 1 ? `离职员工1,离职员工2` : '离职员工1'
    }

    records.push({
      id: `${campus}-${i}`,
      month: i,
      campus,
      plannedPositionName,
      plannedRecruitmentCount: plannedCount,
      actualPositionName,
      actualRecruitmentCount: actualCount,
      newHireNames,
      departureCount,
      departureNames,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }

  return records
}

export const recruitmentPlanSummaryService = {
  /**
   * 获取招聘计划数据
   * @param campus 神殿名称
   * @returns Promise<RecruitmentPlanSummaryRecord[]>
   */
  getRecruitmentPlanData: async (campus: string): Promise<RecruitmentPlanSummaryRecord[]> => {
    // 模拟API延迟
    await new Promise((resolve) => setTimeout(resolve, 500))

    if (!campus) {
      throw new Error('神殿名称不能为空')
    }

    return generateMockData(campus)
  },

  /**
   * 更新招聘计划数据
   * @param id 记录ID
   * @param data 更新数据
   * @returns Promise<RecruitmentPlanSummaryRecord>
   */
  updateRecruitmentPlanData: async (
    id: string,
    data: Partial<RecruitmentPlanSummaryRecord>,
  ): Promise<RecruitmentPlanSummaryRecord> => {
    await new Promise((resolve) => setTimeout(resolve, 300))
    return { ...generateMockData('盛邦')[0], ...data, id, updatedAt: new Date().toISOString() }
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
