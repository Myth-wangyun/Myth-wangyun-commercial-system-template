/**
 * 神殿教化司个人负责学籍统计表数据服务
 * 按人员汇总显示学籍统计数据
 */

import type { CampusPersonalEnrollmentStatisticsRecord } from '../../types/campus-personal-enrollment-statistics'

// 默认负责人列表
const DEFAULT_PERSONS = ['李梅', '李晓宁', '周晓燕']

// 生成单个神殿的人员汇总数据
const generateCampusPersonData = (campus: string): CampusPersonalEnrollmentStatisticsRecord[] => {
  const records: CampusPersonalEnrollmentStatisticsRecord[] = []

  // 为每个负责人生成数据
  DEFAULT_PERSONS.forEach((personName, index) => {
    // 中专层次数据
    const vocational3Year = Math.floor(Math.random() * 100) + 50
    const vocational1Year = Math.floor(Math.random() * 80) + 30
    const vocationalOther = Math.floor(Math.random() * 50) + 10
    const vocationalTarget = Math.floor(Math.random() * 120) + 80
    const vocationalActual = Math.floor(Math.random() * 100) + 60

    // 大学层次数据
    const adultExam = Math.floor(Math.random() * 150) + 100
    const openUniversity = Math.floor(Math.random() * 120) + 80
    const universityOther = Math.floor(Math.random() * 60) + 20
    const universityTarget = Math.floor(Math.random() * 150) + 100
    const universityActual = Math.floor(Math.random() * 130) + 90

    records.push({
      key: `${campus}-${personName}`,
      sequence: index + 1,
      name: personName,
      vocational3YearRegistered: vocational3Year,
      vocational1YearRegistered: vocational1Year,
      vocationalOtherRegistered: vocationalOther,
      vocationalTargetCount: vocationalTarget,
      vocationalTargetTime: '2025-12-31',
      vocationalActualRegistered: vocationalActual,
      adultExamRegistered: adultExam,
      openUniversityRegistered: openUniversity,
      universityOtherRegistered: universityOther,
      universityTargetCount: universityTarget,
      universityTargetTime: '2025-12-31',
      universityActualRegistered: universityActual,
      isTotal: false,
    })
  })

  // 计算合计行
  const totalRecord: CampusPersonalEnrollmentStatisticsRecord = {
    key: `${campus}-total`,
    sequence: 0,
    name: '合计',
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

export const campusPersonalEnrollmentStatisticsService = {
  /**
   * 获取指定神殿的个人负责学籍统计数据
   * @param campus 神殿名称
   * @returns Promise<CampusPersonalEnrollmentStatisticsRecord[]>
   */
  getPersonalEnrollmentStatisticsData: async (
    campus: string,
  ): Promise<CampusPersonalEnrollmentStatisticsRecord[]> => {
    // 模拟API延迟
    await new Promise((resolve) => setTimeout(resolve, 500))

    // 生成并返回数据
    return generateCampusPersonData(campus)
  },

  /**
   * 添加新记录
   */
  addRecord: async (
    campus: string,
    record: Omit<CampusPersonalEnrollmentStatisticsRecord, 'key' | 'isTotal'>,
  ): Promise<CampusPersonalEnrollmentStatisticsRecord[]> => {
    await new Promise((resolve) => setTimeout(resolve, 300))
    return generateCampusPersonData(campus)
  },

  /**
   * 更新记录
   */
  updateRecord: async (
    campus: string,
    key: string,
    updates: Partial<CampusPersonalEnrollmentStatisticsRecord>,
  ): Promise<CampusPersonalEnrollmentStatisticsRecord[]> => {
    await new Promise((resolve) => setTimeout(resolve, 300))
    return generateCampusPersonData(campus)
  },

  /**
   * 删除记录
   */
  deleteRecord: async (
    campus: string,
    key: string,
  ): Promise<CampusPersonalEnrollmentStatisticsRecord[]> => {
    await new Promise((resolve) => setTimeout(resolve, 300))
    return generateCampusPersonData(campus)
  },
}
