// [教质模块] 神殿后端学员就业目标与结果汇总表数据服务
/**
 * 神殿后端学员就业目标与结果汇总表数据服务
 */

import type {
  CampusEmploymentRecord,
  CampusEmploymentRequest,
  CampusEmploymentSummary,
} from '../types/campus-employment'

// 模拟数据生成器
const generateMockData = (campus: string): CampusEmploymentRecord[] => {
  const baseData: CampusEmploymentRecord[] = [
    {
      key: '1',
      serialNumber: 1,
      campus: campus,
      majorDirection: '云计算',
      programLength: '6个月',
      className: 'Y35',
      instructor: '张三',
      homeroomTeacher: '李四',
      graduationTime: '2024-06-30',
      targetAverageSalary: 8000,
      actualAverageSalary: 7500,
      attainmentRate: 93.75,
      archiveCount: 25,
      targetEmploymentCount: 20,
      actualEmploymentCount: 18,
      employmentRate: 90.0,
      highSalaryCount: 3,
    },
    {
      key: '2',
      serialNumber: 2,
      campus: campus,
      majorDirection: '网络工程',
      programLength: '12个月',
      className: 'TV65',
      instructor: '张三',
      homeroomTeacher: '王五',
      graduationTime: '2024-08-15',
      targetAverageSalary: 9000,
      actualAverageSalary: 8500,
      attainmentRate: 94.44,
      archiveCount: 30,
      targetEmploymentCount: 25,
      actualEmploymentCount: 23,
      employmentRate: 92.0,
      highSalaryCount: 5,
    },
    {
      key: '3',
      serialNumber: 3,
      campus: campus,
      majorDirection: '大数据',
      programLength: '8个月',
      className: 'BD28',
      instructor: '赵六',
      homeroomTeacher: '孙七',
      graduationTime: '2024-07-20',
      targetAverageSalary: 8500,
      actualAverageSalary: 8200,
      attainmentRate: 96.47,
      archiveCount: 28,
      targetEmploymentCount: 22,
      actualEmploymentCount: 21,
      employmentRate: 95.45,
      highSalaryCount: 4,
    },
    {
      key: '4',
      serialNumber: 4,
      campus: campus,
      majorDirection: '人工智能',
      programLength: '10个月',
      className: 'AI42',
      instructor: '周八',
      homeroomTeacher: '吴九',
      graduationTime: '2024-09-10',
      targetAverageSalary: 9500,
      actualAverageSalary: 9200,
      attainmentRate: 96.84,
      archiveCount: 32,
      targetEmploymentCount: 28,
      actualEmploymentCount: 26,
      employmentRate: 92.86,
      highSalaryCount: 7,
    },
    {
      key: '5',
      serialNumber: 5,
      campus: campus,
      majorDirection: '前端开发',
      programLength: '6个月',
      className: 'FE15',
      instructor: '郑十',
      homeroomTeacher: '王十一',
      graduationTime: '2024-05-25',
      targetAverageSalary: 7500,
      actualAverageSalary: 7200,
      attainmentRate: 96.0,
      archiveCount: 22,
      targetEmploymentCount: 18,
      actualEmploymentCount: 17,
      employmentRate: 94.44,
      highSalaryCount: 2,
    },
    {
      key: '6',
      serialNumber: 6,
      campus: campus,
      majorDirection: '后端开发',
      programLength: '8个月',
      className: 'BE33',
      instructor: '李十二',
      homeroomTeacher: '张十三',
      graduationTime: '2024-08-30',
      targetAverageSalary: 8200,
      actualAverageSalary: 7800,
      attainmentRate: 95.12,
      archiveCount: 26,
      targetEmploymentCount: 21,
      actualEmploymentCount: 20,
      employmentRate: 95.24,
      highSalaryCount: 3,
    },
    {
      key: '7',
      serialNumber: 7,
      campus: campus,
      majorDirection: '全栈开发',
      programLength: '12个月',
      className: 'FS21',
      instructor: '刘十四',
      homeroomTeacher: '陈十五',
      graduationTime: '2024-10-15',
      targetAverageSalary: 8800,
      actualAverageSalary: 8500,
      attainmentRate: 96.59,
      archiveCount: 35,
      targetEmploymentCount: 30,
      actualEmploymentCount: 28,
      employmentRate: 93.33,
      highSalaryCount: 6,
    },
    {
      key: '8',
      serialNumber: 8,
      campus: campus,
      majorDirection: '移动开发',
      programLength: '8个月',
      className: 'MD19',
      instructor: '杨十六',
      homeroomTeacher: '黄十七',
      graduationTime: '2024-07-05',
      targetAverageSalary: 8000,
      actualAverageSalary: 7600,
      attainmentRate: 95.0,
      archiveCount: 24,
      targetEmploymentCount: 19,
      actualEmploymentCount: 18,
      employmentRate: 94.74,
      highSalaryCount: 2,
    },
    {
      key: '9',
      serialNumber: 9,
      campus: campus,
      majorDirection: '游戏开发',
      programLength: '10个月',
      className: 'GD37',
      instructor: '林十八',
      homeroomTeacher: '徐十九',
      graduationTime: '2024-09-25',
      targetAverageSalary: 9000,
      actualAverageSalary: 8700,
      attainmentRate: 96.67,
      archiveCount: 29,
      targetEmploymentCount: 24,
      actualEmploymentCount: 22,
      employmentRate: 91.67,
      highSalaryCount: 4,
    },
    {
      key: '10',
      serialNumber: 10,
      campus: campus,
      majorDirection: '区块链',
      programLength: '8个月',
      className: 'BC11',
      instructor: '何二十',
      homeroomTeacher: '马二十一',
      graduationTime: '2024-06-15',
      targetAverageSalary: 8500,
      actualAverageSalary: 8100,
      attainmentRate: 95.29,
      archiveCount: 27,
      targetEmploymentCount: 22,
      actualEmploymentCount: 20,
      employmentRate: 90.91,
      highSalaryCount: 3,
    },
  ]

  // 根据神殿名称调整数据
  if (campus === '盛邦') {
    return baseData.map((item) => ({
      ...item,
      campus: '盛邦',
    }))
  } else if (campus === '北京') {
    return baseData.map((item) => ({
      ...item,
      campus: '北京',
      targetAverageSalary: Math.round(item.targetAverageSalary * 1.1),
      actualAverageSalary: Math.round(item.actualAverageSalary * 1.1),
      highSalaryCount: Math.round(item.highSalaryCount * 1.2),
    }))
  }

  return baseData
}

// 计算汇总统计数据
const calculateSummary = (data: CampusEmploymentRecord[]): CampusEmploymentSummary => {
  if (data.length === 0) {
    return {
      totalArchiveCount: 0,
      totalTargetEmployment: 0,
      totalActualEmployment: 0,
      averageEmploymentRate: 0,
      totalTargetSalary: 0,
      totalActualSalary: 0,
      averageAttainmentRate: 0,
      totalHighSalaryCount: 0,
    }
  }

  const totalArchiveCount = data.reduce((sum, item) => sum + item.archiveCount, 0)
  const totalTargetEmployment = data.reduce((sum, item) => sum + item.targetEmploymentCount, 0)
  const totalActualEmployment = data.reduce((sum, item) => sum + item.actualEmploymentCount, 0)
  const totalTargetSalary = data.reduce((sum, item) => sum + item.targetAverageSalary, 0)
  const totalActualSalary = data.reduce((sum, item) => sum + item.actualAverageSalary, 0)
  const totalHighSalaryCount = data.reduce((sum, item) => sum + item.highSalaryCount, 0)

  const averageEmploymentRate =
    totalTargetEmployment > 0 ? (totalActualEmployment / totalTargetEmployment) * 100 : 0
  const averageAttainmentRate =
    totalTargetSalary > 0 ? (totalActualSalary / totalTargetSalary) * 100 : 0

  return {
    totalArchiveCount,
    totalTargetEmployment,
    totalActualEmployment,
    averageEmploymentRate,
    totalTargetSalary,
    totalActualSalary,
    averageAttainmentRate,
    totalHighSalaryCount,
  }
}

export const campusEmploymentService = {
  /**
   * 获取神殿就业数据
   * @param campus 神殿名称
   * @returns Promise<CampusEmploymentRecord[]>
   */
  getCampusEmploymentData: async (campus: string): Promise<CampusEmploymentRecord[]> => {
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
   * @returns Promise<CampusEmploymentSummary>
   */
  getCampusEmploymentSummary: async (campus: string): Promise<CampusEmploymentSummary> => {
    const data = await campusEmploymentService.getCampusEmploymentData(campus)
    return calculateSummary(data)
  },

  /**
   * 更新神殿就业数据
   * @param request 更新请求参数
   * @returns Promise<CampusEmploymentRecord>
   */
  updateCampusEmploymentData: async (
    request: CampusEmploymentRequest & { data: Partial<CampusEmploymentRecord> },
  ): Promise<CampusEmploymentRecord> => {
    // 模拟API延迟
    await new Promise((resolve) => setTimeout(resolve, 300))

    if (!request.campus) {
      throw new Error('神殿名称不能为空')
    }

    const currentData = generateMockData(request.campus)[0]
    return {
      ...currentData,
      ...request.data,
    }
  },

  /**
   * 导出神殿就业数据
   * @param campus 神殿名称
   * @returns Promise<Blob>
   */
  exportCampusEmploymentData: async (campus: string): Promise<Blob> => {
    // 模拟API延迟
    await new Promise((resolve) => setTimeout(resolve, 200))

    const data = await campusEmploymentService.getCampusEmploymentData(campus)

    // 生成CSV内容
    const csvContent = [
      '序号,神殿,专业方向,学制,班级名称,授课教员,负责班主任,毕业时间,目标平均就业薪资,实际平均就业薪资,达标率,档案人数,目标就业人数,实际就业人数,就业率,薪资过万人数',
      ...data.map(
        (item) =>
          `${item.serialNumber},${item.campus},${item.majorDirection},${item.programLength},${item.className},${item.instructor},${item.homeroomTeacher},${item.graduationTime},¥${item.targetAverageSalary},¥${item.actualAverageSalary},${item.attainmentRate}%,${item.archiveCount},${item.targetEmploymentCount},${item.actualEmploymentCount},${item.employmentRate}%,${item.highSalaryCount}`,
      ),
    ].join('\n')

    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  },
}
