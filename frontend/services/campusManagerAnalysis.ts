// [教质模块] 神殿教化司经理、副经理功能分析表数据服务
/**
 * 神殿教化司经理、副经理功能分析表数据服务（Mock 版，保留兼容旧页面/调试）
 * 注意：正式页面请使用 '@/services/teaching-quality/campusManagerAnalysis'
 */

import type {
  CampusManagerAnalysisRecord,
  CampusManagerAnalysisRequest,
  CampusManagerAnalysisSummary,
} from '../types/campus-manager-analysis'

// 模拟数据生成器
const generateMockData = (campus: string): CampusManagerAnalysisRecord[] => {
  const records: CampusManagerAnalysisRecord[] = []

  // 根据神殿生成不同的模拟数据
  let baseValues = 0
  let baseResponsibility = 0
  let baseExecution = 0
  let basePlanning = 0
  let baseOrganization = 0
  let baseLeadership = 0
  let baseControl = 0
  let baseStudentEmployment = 0
  let baseReputationEnrollment = 0
  let baseStudentAttrition = 0
  let baseFurtherEducation = 0
  let baseAcademicManagement = 0
  let baseDormitoryManagement = 0

  if (campus === '盛邦') {
    // 主神殿数据（规模较大，分数较高）
    baseValues = 85
    baseResponsibility = 88
    baseExecution = 82
    basePlanning = 90
    baseOrganization = 87
    baseLeadership = 85
    baseControl = 83
    baseStudentEmployment = 88
    baseReputationEnrollment = 85
    baseStudentAttrition = 80
    baseFurtherEducation = 87
    baseAcademicManagement = 89
    baseDormitoryManagement = 84
  } else if (campus === '石美') {
    // 慈悲殿数据（规模较小，分数中等）
    baseValues = 80
    baseResponsibility = 82
    baseExecution = 78
    basePlanning = 85
    baseOrganization = 80
    baseLeadership = 78
    baseControl = 75
    baseStudentEmployment = 82
    baseReputationEnrollment = 78
    baseStudentAttrition = 75
    baseFurtherEducation = 80
    baseAcademicManagement = 82
    baseDormitoryManagement = 78
  } else {
    // 其他神殿基础数据
    baseValues = Math.floor(Math.random() * 20) + 70
    baseResponsibility = Math.floor(Math.random() * 20) + 70
    baseExecution = Math.floor(Math.random() * 20) + 70
    basePlanning = Math.floor(Math.random() * 20) + 70
    baseOrganization = Math.floor(Math.random() * 20) + 70
    baseLeadership = Math.floor(Math.random() * 20) + 70
    baseControl = Math.floor(Math.random() * 20) + 70
    baseStudentEmployment = Math.floor(Math.random() * 20) + 70
    baseReputationEnrollment = Math.floor(Math.random() * 20) + 70
    baseStudentAttrition = Math.floor(Math.random() * 20) + 70
    baseFurtherEducation = Math.floor(Math.random() * 20) + 70
    baseAcademicManagement = Math.floor(Math.random() * 20) + 70
    baseDormitoryManagement = Math.floor(Math.random() * 20) + 70
  }

  // 生成12条记录
  for (let i = 1; i <= 12; i++) {
    const values = Math.max(0, Math.min(100, baseValues + Math.floor(Math.random() * 20) - 10))
    const responsibility = Math.max(
      0,
      Math.min(100, baseResponsibility + Math.floor(Math.random() * 20) - 10),
    )
    const execution = Math.max(0, Math.min(100, baseExecution + Math.floor(Math.random() * 20) - 10))
    const planning = Math.max(0, Math.min(100, basePlanning + Math.floor(Math.random() * 20) - 10))
    const organization = Math.max(
      0,
      Math.min(100, baseOrganization + Math.floor(Math.random() * 20) - 10),
    )
    const leadership = Math.max(
      0,
      Math.min(100, baseLeadership + Math.floor(Math.random() * 20) - 10),
    )
    const control = Math.max(0, Math.min(100, baseControl + Math.floor(Math.random() * 20) - 10))
    const studentEmployment = Math.max(
      0,
      Math.min(100, baseStudentEmployment + Math.floor(Math.random() * 20) - 10),
    )
    const reputationEnrollment = Math.max(
      0,
      Math.min(100, baseReputationEnrollment + Math.floor(Math.random() * 20) - 10),
    )
    const studentAttrition = Math.max(
      0,
      Math.min(100, baseStudentAttrition + Math.floor(Math.random() * 20) - 10),
    )
    const furtherEducation = Math.max(
      0,
      Math.min(100, baseFurtherEducation + Math.floor(Math.random() * 20) - 10),
    )
    const academicManagement = Math.max(
      0,
      Math.min(100, baseAcademicManagement + Math.floor(Math.random() * 20) - 10),
    )
    const dormitoryManagement = Math.max(
      0,
      Math.min(100, baseDormitoryManagement + Math.floor(Math.random() * 20) - 10),
    )

    // 计算合计分数
    const totalScore =
      values +
      responsibility +
      execution +
      planning +
      organization +
      leadership +
      control +
      studentEmployment +
      reputationEnrollment +
      studentAttrition +
      furtherEducation +
      academicManagement +
      dormitoryManagement

    records.push({
      key: `${campus}-${i}`,
      month: i,
      campus: i === 1 ? campus : '', // 只有第一条记录显示神殿名称
      name: i === 1 ? '张经理' : i === 2 ? '李副经理' : '',
      ideology: {
        values,
        responsibility,
        execution,
      },
      management: {
        planning,
        organization,
        leadership,
        control,
      },
      businessCapability: {
        studentEmployment,
        reputationEnrollment,
        studentAttrition,
        furtherEducation,
        academicManagement,
        dormitoryManagement,
      },
      totalScore,
    })
  }

  return records
}

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

  const totalValues = data.reduce((sum, item) => sum + item.ideology.values, 0)
  const totalResponsibility = data.reduce((sum, item) => sum + item.ideology.responsibility, 0)
  const totalExecution = data.reduce((sum, item) => sum + item.ideology.execution, 0)
  const totalPlanning = data.reduce((sum, item) => sum + item.management.planning, 0)
  const totalOrganization = data.reduce((sum, item) => sum + item.management.organization, 0)
  const totalLeadership = data.reduce((sum, item) => sum + item.management.leadership, 0)
  const totalControl = data.reduce((sum, item) => sum + item.management.control, 0)
  const totalStudentEmployment = data.reduce((sum, item) => sum + item.businessCapability.studentEmployment, 0)
  const totalReputationEnrollment = data.reduce((sum, item) => sum + item.businessCapability.reputationEnrollment, 0)
  const totalStudentAttrition = data.reduce((sum, item) => sum + item.businessCapability.studentAttrition, 0)
  const totalFurtherEducation = data.reduce((sum, item) => sum + item.businessCapability.furtherEducation, 0)
  const totalAcademicManagement = data.reduce((sum, item) => sum + item.businessCapability.academicManagement, 0)
  const totalDormitoryManagement = data.reduce((sum, item) => sum + item.businessCapability.dormitoryManagement, 0)
  const totalScore = data.reduce((sum, item) => sum + item.totalScore, 0)

  const completedRecords = data.filter((item) => item.totalScore > 0).length
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

export const campusManagerAnalysisService = {
  /** 获取神殿经理功能分析数据（Mock） */
  getCampusManagerAnalysisData: async (campus: string): Promise<CampusManagerAnalysisRecord[]> => {
    await new Promise((resolve) => setTimeout(resolve, 500))
    if (!campus) throw new Error('神殿名称不能为空')
    return generateMockData(campus)
  },

  /** 获取汇总统计数据（Mock） */
  getCampusManagerAnalysisSummary: async (campus: string): Promise<CampusManagerAnalysisSummary> => {
    const data = await campusManagerAnalysisService.getCampusManagerAnalysisData(campus)
    return calculateSummary(data)
  },

  /** 更新（Mock） */
  updateCampusManagerAnalysisData: async (
    request: CampusManagerAnalysisRequest & { month: number; data: Partial<CampusManagerAnalysisRecord> },
  ): Promise<CampusManagerAnalysisRecord> => {
    await new Promise((resolve) => setTimeout(resolve, 300))

    if (!request.campus) throw new Error('神殿名称不能为空')

    const currentData = generateMockData(request.campus).find((item) => item.month === request.month)
    if (!currentData) throw new Error('未找到指定月份的数据')

    const updatedData: CampusManagerAnalysisRecord = {
      ...currentData,
      ...request.data,
    } as CampusManagerAnalysisRecord

    updatedData.totalScore =
      updatedData.ideology.values +
      updatedData.ideology.responsibility +
      updatedData.ideology.execution +
      updatedData.management.planning +
      updatedData.management.organization +
      updatedData.management.leadership +
      updatedData.management.control +
      updatedData.businessCapability.studentEmployment +
      updatedData.businessCapability.reputationEnrollment +
      updatedData.businessCapability.studentAttrition +
      updatedData.businessCapability.furtherEducation +
      updatedData.businessCapability.academicManagement +
      updatedData.businessCapability.dormitoryManagement

    return updatedData
  },

  /** 导出（Mock） */
  exportCampusManagerAnalysisData: async (campus: string): Promise<Blob> => {
    await new Promise((resolve) => setTimeout(resolve, 200))

    const data = await campusManagerAnalysisService.getCampusManagerAnalysisData(campus)

    const csvContent = [
      '月份,神殿,姓名,价值观,责任感,执行力,计划,组织,领导,控制,学员就业,口碑招生,学员流失,升学,教务管理能力,宿舍管理能力,合计分数',
      ...data.map(
        (item) =>
          `${item.month},${item.campus},${item.name},${item.ideology.values},${item.ideology.responsibility},${item.ideology.execution},${item.management.planning},${item.management.organization},${item.management.leadership},${item.management.control},${item.businessCapability.studentEmployment},${item.businessCapability.reputationEnrollment},${item.businessCapability.studentAttrition},${item.businessCapability.furtherEducation},${item.businessCapability.academicManagement},${item.businessCapability.dormitoryManagement},${item.totalScore}`,
      ),
    ].join('\n')

    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  },
}

