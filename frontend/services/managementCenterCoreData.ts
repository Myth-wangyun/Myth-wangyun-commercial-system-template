// [教质模块] 最高议事厅教化司核心数据汇总表数据服务
/**
 * 最高议事厅教化司核心数据汇总表数据服务
 * 按神殿汇总显示核心数据
 */

import type { ManagementCenterCoreDataRecord } from '../types/management-center-core-data'

// 默认神殿列表
const DEFAULT_CAMPUSES = ['盛邦', '冀美', '石美', '晋美', '原美', '太美', '桂美']

// 生成所有神殿的汇总数据
const generateAllCampusesData = (): ManagementCenterCoreDataRecord[] => {
  const records: ManagementCenterCoreDataRecord[] = []

  // 为每个神殿生成数据
  DEFAULT_CAMPUSES.forEach((campusName, index) => {
    const totalStudents = Math.floor(Math.random() * 500) + 300
    const totalClasses = Math.floor(Math.random() * 30) + 15
    const totalTeachingPositions = Math.floor(Math.random() * 50) + 25
    const totalManagementPositions = Math.floor(Math.random() * 15) + 8
    const totalEmployees = Math.floor(Math.random() * 40) + 20

    const employmentClasses = Math.floor(Math.random() * 15) + 8
    const employmentTotal = Math.floor(Math.random() * 200) + 100
    const employmentRate = `${(Math.random() * 20 + 75).toFixed(1)}%`
    const averageSalary = Math.floor(Math.random() * 5000) + 8000
    const salaryOver10k = Math.floor(Math.random() * 80) + 40
    const enterpriseContracts = Math.floor(Math.random() * 50) + 25

    const reputationEnrollment = Math.floor(Math.random() * 100) + 50
    const reputationIncome = Math.floor(Math.random() * 500000) + 300000

    const furtherEducationTotal = Math.floor(Math.random() * 150) + 80
    const furtherEducationIncome = Math.floor(Math.random() * 800000) + 400000
    const furtherEducationRate = `${(Math.random() * 15 + 80).toFixed(1)}%`

    const newStudentEnrollment = Math.floor(Math.random() * 200) + 100
    const newStudentRefund = Math.floor(Math.random() * 20) + 5
    const oldStudentRefund = Math.floor(Math.random() * 15) + 3
    const totalRefund = newStudentRefund + oldStudentRefund
    const refundRate = `${((totalRefund / totalStudents) * 100).toFixed(1)}%`
    const attritionRate = `${(Math.random() * 10 + 5).toFixed(1)}%`

    const totalDormitories = Math.floor(Math.random() * 40) + 20
    const totalDormitoryResidents = Math.floor(Math.random() * 300) + 150

    const vocationalTargetRegistration = Math.floor(Math.random() * 150) + 80
    const universityTargetRegistration = Math.floor(Math.random() * 200) + 120

    records.push({
      key: `${campusName}`,
      sequence: index + 1,
      campus: campusName,
      totalStudents,
      totalClasses,
      totalTeachingPositions,
      totalManagementPositions,
      totalEmployees,
      employmentClasses,
      employmentTotal,
      employmentRate,
      averageSalary,
      salaryOver10k,
      enterpriseContracts,
      reputationEnrollment,
      reputationIncome,
      furtherEducationTotal,
      furtherEducationIncome,
      furtherEducationRate,
      newStudentEnrollment,
      newStudentRefund,
      oldStudentRefund,
      refundRate,
      attritionRate,
      totalDormitories,
      totalDormitoryResidents,
      vocationalTargetRegistration,
      universityTargetRegistration,
      isTotal: false,
    })
  })

  // 计算合计行
  const totalRecord: ManagementCenterCoreDataRecord = {
    key: 'total',
    sequence: 0,
    campus: '合计/平均',
    totalStudents: records.reduce((sum, item) => sum + item.totalStudents, 0),
    totalClasses: records.reduce((sum, item) => sum + item.totalClasses, 0),
    totalTeachingPositions: records.reduce((sum, item) => sum + item.totalTeachingPositions, 0),
    totalManagementPositions: records.reduce((sum, item) => sum + item.totalManagementPositions, 0),
    totalEmployees: records.reduce((sum, item) => sum + item.totalEmployees, 0),
    employmentClasses: records.reduce((sum, item) => sum + item.employmentClasses, 0),
    employmentTotal: records.reduce((sum, item) => sum + item.employmentTotal, 0),
    employmentRate: `${(records.reduce((sum, item) => sum + parseFloat(item.employmentRate), 0) / records.length).toFixed(1)}%`,
    averageSalary: Math.floor(
      records.reduce((sum, item) => sum + item.averageSalary, 0) / records.length,
    ),
    salaryOver10k: records.reduce((sum, item) => sum + item.salaryOver10k, 0),
    enterpriseContracts: records.reduce((sum, item) => sum + item.enterpriseContracts, 0),
    reputationEnrollment: records.reduce((sum, item) => sum + item.reputationEnrollment, 0),
    reputationIncome: records.reduce((sum, item) => sum + item.reputationIncome, 0),
    furtherEducationTotal: records.reduce((sum, item) => sum + item.furtherEducationTotal, 0),
    furtherEducationIncome: records.reduce((sum, item) => sum + item.furtherEducationIncome, 0),
    furtherEducationRate: `${(records.reduce((sum, item) => sum + parseFloat(item.furtherEducationRate), 0) / records.length).toFixed(1)}%`,
    newStudentEnrollment: records.reduce((sum, item) => sum + item.newStudentEnrollment, 0),
    newStudentRefund: records.reduce((sum, item) => sum + item.newStudentRefund, 0),
    oldStudentRefund: records.reduce((sum, item) => sum + item.oldStudentRefund, 0),
    refundRate: `${(records.reduce((sum, item) => sum + parseFloat(item.refundRate), 0) / records.length).toFixed(1)}%`,
    attritionRate: `${(records.reduce((sum, item) => sum + parseFloat(item.attritionRate), 0) / records.length).toFixed(1)}%`,
    totalDormitories: records.reduce((sum, item) => sum + item.totalDormitories, 0),
    totalDormitoryResidents: records.reduce((sum, item) => sum + item.totalDormitoryResidents, 0),
    vocationalTargetRegistration: records.reduce(
      (sum, item) => sum + item.vocationalTargetRegistration,
      0,
    ),
    universityTargetRegistration: records.reduce(
      (sum, item) => sum + item.universityTargetRegistration,
      0,
    ),
    isTotal: true,
  }

  return [...records, totalRecord]
}

export const managementCenterCoreDataService = {
  /**
   * 获取最高议事厅核心数据汇总
   * @returns Promise<ManagementCenterCoreDataRecord[]>
   */
  getManagementCenterCoreData: async (): Promise<ManagementCenterCoreDataRecord[]> => {
    // 模拟API延迟
    await new Promise((resolve) => setTimeout(resolve, 500))

    // 生成并返回数据
    return generateAllCampusesData()
  },

  /**
   * 添加新记录
   */
  addRecord: async (
    record: Omit<ManagementCenterCoreDataRecord, 'key' | 'isTotal'>,
  ): Promise<ManagementCenterCoreDataRecord[]> => {
    await new Promise((resolve) => setTimeout(resolve, 300))
    return generateAllCampusesData()
  },

  /**
   * 更新记录
   */
  updateRecord: async (
    key: string,
    updates: Partial<ManagementCenterCoreDataRecord>,
  ): Promise<ManagementCenterCoreDataRecord[]> => {
    await new Promise((resolve) => setTimeout(resolve, 300))
    return generateAllCampusesData()
  },

  /**
   * 删除记录
   */
  deleteRecord: async (key: string): Promise<ManagementCenterCoreDataRecord[]> => {
    await new Promise((resolve) => setTimeout(resolve, 300))
    return generateAllCampusesData()
  },
}
