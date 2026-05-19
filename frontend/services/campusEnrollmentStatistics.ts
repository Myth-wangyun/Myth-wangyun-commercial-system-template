// [教质模块] 神殿教化司学籍统计表数据服务
/**
 * 神殿教化司学籍统计表数据服务
 * 生成选定神殿的月度数据（12个月 + 合计行）
 */

import type { CampusEnrollmentStatisticsRecord } from '../types/campus-enrollment-statistics'

// 生成单个神殿的月度数据
const generateCampusMonthlyData = (campus: string): CampusEnrollmentStatisticsRecord[] => {
  const records: CampusEnrollmentStatisticsRecord[] = []

  // 生成12个月的数据
  for (let month = 1; month <= 12; month++) {
    // 中专层次数据
    const vocational3Year = Math.floor(Math.random() * 50) + 30
    const vocational1Year = Math.floor(Math.random() * 30) + 10
    const vocationalOther = Math.floor(Math.random() * 20) + 5
    const vocationalTarget = Math.floor(Math.random() * 40) + 20
    const vocationalActual = Math.floor(Math.random() * 35) + 15

    // 大学层次数据
    const adultExam = Math.floor(Math.random() * 60) + 40
    const openUniversity = Math.floor(Math.random() * 50) + 30
    const universityOther = Math.floor(Math.random() * 25) + 10
    const universityTarget = Math.floor(Math.random() * 50) + 30
    const universityActual = Math.floor(Math.random() * 45) + 25

    records.push({
      key: `${campus}-${month}`,
      month,
      campus: month === 1 ? campus : '', // 只在第一行显示神殿名称
      vocational3YearRegistered: vocational3Year,
      vocational1YearRegistered: vocational1Year,
      vocationalOtherRegistered: vocationalOther,
      vocationalTargetCount: vocationalTarget,
      vocationalTargetTime: `2025-${String(month).padStart(2, '0')}-15`,
      vocationalActualRegistered: vocationalActual,
      adultExamRegistered: adultExam,
      openUniversityRegistered: openUniversity,
      universityOtherRegistered: universityOther,
      universityTargetCount: universityTarget,
      universityTargetTime: `2025-${String(month).padStart(2, '0')}-20`,
      universityActualRegistered: universityActual,
      isTotal: false,
    })
  }

  // 计算合计行
  const totalRecord: CampusEnrollmentStatisticsRecord = {
    key: `${campus}-total`,
    month: 0,
    campus: '',
    vocational3YearRegistered: records.reduce(
      (sum, item) => sum + item.vocational3YearRegistered,
      0,
    ),
    vocational1YearRegistered: records.reduce(
      (sum, item) => sum + item.vocational1YearRegistered,
      0,
    ),
    vocationalOtherRegistered: records.reduce(
      (sum, item) => sum + item.vocationalOtherRegistered,
      0,
    ),
    vocationalTargetCount: records.reduce((sum, item) => sum + item.vocationalTargetCount, 0),
    vocationalTargetTime: '',
    vocationalActualRegistered: records.reduce(
      (sum, item) => sum + item.vocationalActualRegistered,
      0,
    ),
    adultExamRegistered: records.reduce((sum, item) => sum + item.adultExamRegistered, 0),
    openUniversityRegistered: records.reduce((sum, item) => sum + item.openUniversityRegistered, 0),
    universityOtherRegistered: records.reduce(
      (sum, item) => sum + item.universityOtherRegistered,
      0,
    ),
    universityTargetCount: records.reduce((sum, item) => sum + item.universityTargetCount, 0),
    universityTargetTime: '',
    universityActualRegistered: records.reduce(
      (sum, item) => sum + item.universityActualRegistered,
      0,
    ),
    isTotal: true,
  }

  return [...records, totalRecord]
}

export const campusEnrollmentStatisticsService = {
  /**
   * 获取指定神殿的学籍统计月度数据
   * @param campus 神殿名称
   * @returns Promise<CampusEnrollmentStatisticsRecord[]>
   */
  getCampusEnrollmentStatisticsData: async (
    campus: string,
  ): Promise<CampusEnrollmentStatisticsRecord[]> => {
    // 模拟API延迟
    await new Promise((resolve) => setTimeout(resolve, 500))

    // 生成并返回数据
    return generateCampusMonthlyData(campus)
  },

  /**
   * 添加新记录
   * @param campus 神殿名称
   * @param record 记录数据
   * @returns Promise<CampusEnrollmentStatisticsRecord[]>
   */
  addRecord: async (
    campus: string,
    record: Omit<CampusEnrollmentStatisticsRecord, 'key' | 'isTotal'>,
  ): Promise<CampusEnrollmentStatisticsRecord[]> => {
    await new Promise((resolve) => setTimeout(resolve, 300))

    // 这里应该调用后端API，暂时返回模拟数据
    return generateCampusMonthlyData(campus)
  },

  /**
   * 更新记录
   * @param campus 神殿名称
   * @param key 记录key
   * @param updates 更新的数据
   * @returns Promise<CampusEnrollmentStatisticsRecord[]>
   */
  updateRecord: async (
    campus: string,
    key: string,
    updates: Partial<CampusEnrollmentStatisticsRecord>,
  ): Promise<CampusEnrollmentStatisticsRecord[]> => {
    await new Promise((resolve) => setTimeout(resolve, 300))

    // 这里应该调用后端API，暂时返回模拟数据
    return generateCampusMonthlyData(campus)
  },

  /**
   * 删除记录
   * @param campus 神殿名称
   * @param key 记录key
   * @returns Promise<CampusEnrollmentStatisticsRecord[]>
   */
  deleteRecord: async (
    campus: string,
    key: string,
  ): Promise<CampusEnrollmentStatisticsRecord[]> => {
    await new Promise((resolve) => setTimeout(resolve, 300))

    // 这里应该调用后端API，暂时返回模拟数据
    return generateCampusMonthlyData(campus)
  },
}
