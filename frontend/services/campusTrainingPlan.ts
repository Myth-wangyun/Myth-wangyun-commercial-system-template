// [教质模块] 神殿教化司培训计划与成绩汇总表数据服务
/**
 * 神殿教化司培训计划与成绩汇总表数据服务
 */

import type {
  CampusTrainingPlanRecord,
  CampusTrainingPlanRequest,
  CampusTrainingPlanSummary,
} from '../types/campus-training-plan'

// 培训方式选项
const trainingMethods = [
  '线上培训',
  '线下培训',
  '混合式培训',
  '实践操作',
  '案例分析',
  '小组讨论',
  '专题讲座',
  '实地考察',
]

// 负责人选项
const personsInCharge = [
  '张经理',
  '李副经理',
  '王主管',
  '刘老师',
  '陈老师',
  '赵老师',
  '孙老师',
  '周老师',
]

// 培训目标选项
const trainingObjectives = [
  '提升专业技能',
  '加强团队协作',
  '提高服务质量',
  '规范操作流程',
  '增强安全意识',
  '提升沟通能力',
  '强化管理能力',
  '优化工作效率',
]

// 主要内容选项
const mainContents = [
  '业务技能培训',
  '服务标准培训',
  '安全知识培训',
  '管理技能培训',
  '沟通技巧培训',
  '团队建设培训',
  '技术更新培训',
  '质量提升培训',
]

// 模拟数据生成器
const generateMockData = (campus: string): CampusTrainingPlanRecord[] => {
  const records: CampusTrainingPlanRecord[] = []

  // 根据神殿生成不同的模拟数据
  let baseTrainingCount = 0
  let baseQualifiedCount = 0
  let baseAverageScore = 0

  if (campus === '盛邦') {
    // 主神殿数据（规模较大，培训效果较好）
    baseTrainingCount = 25
    baseQualifiedCount = 22
    baseAverageScore = 85
  } else if (campus === '石美') {
    // 慈悲殿数据（规模较小，培训效果中等）
    baseTrainingCount = 15
    baseQualifiedCount = 12
    baseAverageScore = 78
  } else {
    // 其他神殿基础数据
    baseTrainingCount = Math.floor(Math.random() * 20) + 10
    baseQualifiedCount = Math.floor(baseTrainingCount * 0.8)
    baseAverageScore = Math.floor(Math.random() * 20) + 70
  }

  // 生成12条记录
  for (let i = 1; i <= 12; i++) {
    const trainingCount = Math.max(0, baseTrainingCount + Math.floor(Math.random() * 10) - 5)
    const qualifiedCount = Math.max(
      0,
      Math.min(trainingCount, baseQualifiedCount + Math.floor(Math.random() * 8) - 4),
    )
    const averageScore = Math.max(
      0,
      Math.min(100, baseAverageScore + Math.floor(Math.random() * 20) - 10),
    )

    // 计算合格率
    const passRate = trainingCount > 0 ? (qualifiedCount / trainingCount) * 100 : 0

    records.push({
      key: `${campus}-${i}`,
      month: i,
      campus: i === 1 ? campus : '', // 只有第一条记录显示神殿名称
      trainingObjective: trainingObjectives[Math.floor(Math.random() * trainingObjectives.length)],
      mainContent: mainContents[Math.floor(Math.random() * mainContents.length)],
      trainingMethod: trainingMethods[Math.floor(Math.random() * trainingMethods.length)],
      personInCharge: personsInCharge[Math.floor(Math.random() * personsInCharge.length)],
      trainingCount,
      qualifiedCount,
      passRate,
      averageScore,
    })
  }

  return records
}

// 计算汇总统计数据
const calculateSummary = (data: CampusTrainingPlanRecord[]): CampusTrainingPlanSummary => {
  if (data.length === 0) {
    return {
      totalTrainingCount: 0,
      totalQualifiedCount: 0,
      overallPassRate: 0,
      overallAverageScore: 0,
      completedRecords: 0,
      totalRecords: 0,
      highestScore: 0,
      lowestScore: 0,
      mostEffectiveMethod: '',
      mostActivePerson: '',
    }
  }

  const totalTrainingCount = data.reduce((sum, item) => sum + item.trainingCount, 0)
  const totalQualifiedCount = data.reduce((sum, item) => sum + item.qualifiedCount, 0)
  const overallPassRate =
    totalTrainingCount > 0 ? (totalQualifiedCount / totalTrainingCount) * 100 : 0
  const overallAverageScore = data.reduce((sum, item) => sum + item.averageScore, 0) / data.length

  const completedRecords = data.filter((item) => item.trainingCount > 0).length
  const totalRecords = data.length

  const scores = data.map((item) => item.averageScore).filter((score) => score > 0)
  const highestScore = scores.length > 0 ? Math.max(...scores) : 0
  const lowestScore = scores.length > 0 ? Math.min(...scores) : 0

  // 统计最有效的培训方式
  const methodStats: Record<string, { count: number; avgScore: number }> = {}
  data.forEach((item) => {
    if (item.trainingCount > 0) {
      if (!methodStats[item.trainingMethod]) {
        methodStats[item.trainingMethod] = { count: 0, avgScore: 0 }
      }
      methodStats[item.trainingMethod].count += item.trainingCount
      methodStats[item.trainingMethod].avgScore += item.averageScore
    }
  })

  let mostEffectiveMethod = ''
  let bestAvgScore = 0
  Object.entries(methodStats).forEach(([method, stats]) => {
    const avgScore = stats.avgScore / (stats.count / 10) // 粗略估算
    if (avgScore > bestAvgScore) {
      bestAvgScore = avgScore
      mostEffectiveMethod = method
    }
  })

  // 统计最活跃的负责人
  const personStats: Record<string, number> = {}
  data.forEach((item) => {
    if (item.trainingCount > 0) {
      personStats[item.personInCharge] =
        (personStats[item.personInCharge] || 0) + item.trainingCount
    }
  })

  const mostActivePerson = Object.entries(personStats).reduce(
    (max, [person, count]) => (count > (personStats[max] || 0) ? person : max),
    Object.keys(personStats)[0] || '',
  )

  return {
    totalTrainingCount,
    totalQualifiedCount,
    overallPassRate,
    overallAverageScore,
    completedRecords,
    totalRecords,
    highestScore,
    lowestScore,
    mostEffectiveMethod,
    mostActivePerson,
  }
}

export const campusTrainingPlanService = {
  /**
   * 获取神殿培训计划与成绩汇总数据
   * @param campus 神殿名称
   * @returns Promise<CampusTrainingPlanRecord[]>
   */
  getCampusTrainingPlanData: async (campus: string): Promise<CampusTrainingPlanRecord[]> => {
    // 模拟API延迟
    await new Promise((resolve) => setTimeout(resolve, 500))

    if (!campus) {
      throw new Error('神殿名称不能为空')
    }

    return generateMockData(campus)
  },

  /**
   * 获取汇总统计数据
   * @param campus 神殿名称
   * @returns Promise<CampusTrainingPlanSummary>
   */
  getCampusTrainingPlanSummary: async (campus: string): Promise<CampusTrainingPlanSummary> => {
    const data = await campusTrainingPlanService.getCampusTrainingPlanData(campus)
    return calculateSummary(data)
  },

  /**
   * 更新神殿培训计划与成绩汇总数据
   * @param request 更新请求参数
   * @returns Promise<CampusTrainingPlanRecord>
   */
  updateCampusTrainingPlanData: async (
    request: CampusTrainingPlanRequest & { month: number; data: Partial<CampusTrainingPlanRecord> },
  ): Promise<CampusTrainingPlanRecord> => {
    // 模拟API延迟
    await new Promise((resolve) => setTimeout(resolve, 300))

    if (!request.campus) {
      throw new Error('神殿名称不能为空')
    }

    const currentData = generateMockData(request.campus).find(
      (item) => item.month === request.month,
    )
    if (!currentData) {
      throw new Error('未找到指定月份的数据')
    }

    const updatedData = {
      ...currentData,
      ...request.data,
    }

    // 重新计算合格率
    updatedData.passRate =
      updatedData.trainingCount > 0
        ? (updatedData.qualifiedCount / updatedData.trainingCount) * 100
        : 0

    return updatedData
  },

  /**
   * 导出神殿培训计划与成绩汇总数据
   * @param campus 神殿名称
   * @returns Promise<Blob>
   */
  exportCampusTrainingPlanData: async (campus: string): Promise<Blob> => {
    // 模拟API延迟
    await new Promise((resolve) => setTimeout(resolve, 200))

    const data = await campusTrainingPlanService.getCampusTrainingPlanData(campus)

    // 生成CSV内容
    const csvContent = [
      '月份,神殿,培训目标,主要内容,培训方式,负责人,培训人数,合格人数,考试合格率,平均成绩',
      ...data.map(
        (item) =>
          `${item.month},${item.campus},${item.trainingObjective},${item.mainContent},${item.trainingMethod},${item.personInCharge},${item.trainingCount},${item.qualifiedCount},${item.passRate.toFixed(2)}%,${item.averageScore}`,
      ),
    ].join('\n')

    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  },
}
