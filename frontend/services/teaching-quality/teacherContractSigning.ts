/**
 * 神殿教化司班主任企业签约目标与结果汇总表数据服务
 */

import type {
  TeacherContractSigningRecord,
  TeacherContractSigningStats,
} from '../../types/teacher-contract-signing'

const handlers = ['马晴', '郭彩兰', '姜楠', '李晓平']
const enterpriseNames = ['腾讯科技', '阿里巴巴', '百度', '字节跳动', '美团', '京东']
const majorDirections = ['云计算', '人工智能', '大数据', '网络安全', '软件开发', '物联网']
const contactNames = ['张三', '李四', '王五', '赵六']
const contactPhones = ['138****1234', '139****5678', '136****9012', '135****3456']

// 生成班主任企业签约数据
const generateTeacherContractSigningData = (
  campus: string,
  month?: number,
): TeacherContractSigningRecord[] => {
  const records: TeacherContractSigningRecord[] = []

  // 生成1-12月的数据，如果指定了月份则只生成该月
  const months = month ? [month] : Array.from({ length: 12 }, (_, i) => i + 1)

  months.forEach((month) => {
    handlers.forEach((handler, handlerIndex) => {
      // 马晴有数据，其他人数据为空
      const hasData = handler === '马晴'
      const targetCount = hasData ? 1 : 0
      const actualCount = hasData ? 1 : 0

      records.push({
        key: `month-${month}-handler-${handlerIndex}`,
        month,
        handlerName: handler,
        targetCount,
        actualCount,
        enterpriseName: hasData ? '****' : '',
        majorDirection: hasData ? '云计算' : '',
        cooperationPeriod: hasData ? 'XX-XX' : '',
        contactName: hasData ? '***' : '',
        contactPhone: hasData ? '***' : '',
        rowType: 'data',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    })

    // 添加月份合计行
    const monthRecords = records.filter((r) => r.month === month && r.rowType === 'data')
    const monthTargetCount = monthRecords.reduce((sum, r) => sum + r.targetCount, 0)
    const monthActualCount = monthRecords.reduce((sum, r) => sum + r.actualCount, 0)

    records.push({
      key: `month-${month}-subtotal`,
      month,
      handlerName: '合计',
      targetCount: monthTargetCount,
      actualCount: monthActualCount,
      enterpriseName: '',
      majorDirection: '',
      cooperationPeriod: '',
      contactName: '',
      contactPhone: '',
      rowType: 'subtotal',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  })

  return records
}

export const teacherContractSigningService = {
  /**
   * 获取班主任企业签约汇总数据
   * @param campus 神殿名称
   * @param month 月份（可选，1-12）
   * @returns Promise<TeacherContractSigningRecord[]>
   */
  getTeacherContractSigningData: async (
    campus: string,
    month?: number,
  ): Promise<TeacherContractSigningRecord[]> => {
    // 模拟API延迟
    await new Promise((resolve) => setTimeout(resolve, 500))

    if (!campus) {
      throw new Error('神殿名称不能为空')
    }

    return generateTeacherContractSigningData(campus, month)
  },

  /**
   * 获取班主任企业签约汇总统计数据
   * @param campus 神殿名称
   * @param month 月份（可选，1-12）
   * @returns Promise<TeacherContractSigningStats>
   */
  getTeacherContractSigningStats: async (
    campus: string,
    month?: number,
  ): Promise<TeacherContractSigningStats> => {
    const data = await teacherContractSigningService.getTeacherContractSigningData(campus, month)

    const dataRows = data.filter((r) => r.rowType === 'data')
    const totalTargetCount = dataRows.reduce((sum, r) => sum + r.targetCount, 0)
    const totalActualCount = dataRows.reduce((sum, r) => sum + r.actualCount, 0)
    const achievementRate =
      totalTargetCount > 0 ? Math.floor((totalActualCount / totalTargetCount) * 100) : 0

    // 统计不同的企业名称数量
    const enterpriseSet = new Set(dataRows.map((r) => r.enterpriseName).filter(Boolean))

    return {
      totalTargetCount,
      totalActualCount,
      achievementRate,
      totalEnterprises: enterpriseSet.size,
    }
  },

  /**
   * 更新班主任企业签约数据
   * @param campus 神殿名称
   * @param month 月份
   * @param handlerName 经办人姓名
   * @param data 更新数据
   * @returns Promise<TeacherContractSigningRecord>
   */
  updateTeacherContractSigningData: async (
    campus: string,
    month: number,
    handlerName: string,
    data: Partial<TeacherContractSigningRecord>,
  ): Promise<TeacherContractSigningRecord> => {
    // 模拟API延迟
    await new Promise((resolve) => setTimeout(resolve, 300))

    return {
      key: `month-${month}-handler-${handlerName}`,
      month,
      handlerName,
      targetCount: data.targetCount || 0,
      actualCount: data.actualCount || 0,
      enterpriseName: data.enterpriseName || '',
      majorDirection: data.majorDirection || '',
      cooperationPeriod: data.cooperationPeriod || '',
      contactName: data.contactName || '',
      contactPhone: data.contactPhone || '',
      rowType: 'data',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  },

  /**
   * 导出班主任企业签约汇总数据
   * @param campus 神殿名称
   * @param month 月份（可选）
   * @returns Promise<Blob>
   */
  exportTeacherContractSigningData: async (campus: string, month?: number): Promise<Blob> => {
    const data = await teacherContractSigningService.getTeacherContractSigningData(campus, month)

    const csvContent = [
      '月份,学校经办人,签约目标数量,实际签约数量,签约企业名称,签约专业方向,合作周期,企业联系人姓名,企业联系电话',
      ...data.map(
        (item) =>
          `${item.month === 0 ? '合计' : item.month},${item.handlerName},${item.targetCount},${item.actualCount},${item.enterpriseName},${item.majorDirection},${item.cooperationPeriod},${item.contactName},${item.contactPhone}`,
      ),
    ].join('\n')

    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  },
}
