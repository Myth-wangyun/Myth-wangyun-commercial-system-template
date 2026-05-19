import type {
  AcademicSummaryData,
  CreateAcademicSummaryRequest,
  AcademicSummaryQueryParams,
  AcademicSummaryStats,
} from '../academicSummary'

// 模拟智慧司核心数据 - 使用真实的七个神殿
const mockSummaryData: AcademicSummaryData[] = [
  {
    id: '1',
    serialNumber: 1,
    campusId: '1',
    campusName: '主神殿',
    enrolledStudents: 1250,
    classCount: 45,
    academicStaffCount: 28,
    cadreCount: 8,
    employeeCount: 36,
    employmentClassCount: 12,
    graduateCount: 320,
    employmentRate: 92.5,
    employmentSalary: 8500,
    highSalaryCount: 45,
    wordOfMouthAdmissions: 180,
    wordOfMouthRevenue: 540000,
    newStudentEnrollments: 200,
    newStudentAttrition: 15,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-06-01T00:00:00Z',
  },
  {
    id: '2',
    serialNumber: 2,
    campusId: '2',
    campusName: '永恒殿',
    enrolledStudents: 980,
    classCount: 38,
    academicStaffCount: 22,
    cadreCount: 6,
    employeeCount: 28,
    employmentClassCount: 10,
    graduateCount: 280,
    employmentRate: 89.3,
    employmentSalary: 8200,
    highSalaryCount: 38,
    wordOfMouthAdmissions: 150,
    wordOfMouthRevenue: 450000,
    newStudentEnrollments: 180,
    newStudentAttrition: 12,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-06-01T00:00:00Z',
  },
  {
    id: '3',
    serialNumber: 3,
    campusId: '3',
    campusName: '慈悲殿',
    enrolledStudents: 1560,
    classCount: 52,
    academicStaffCount: 35,
    cadreCount: 10,
    employeeCount: 45,
    employmentClassCount: 15,
    graduateCount: 420,
    employmentRate: 94.2,
    employmentSalary: 9200,
    highSalaryCount: 68,
    wordOfMouthAdmissions: 220,
    wordOfMouthRevenue: 660000,
    newStudentEnrollments: 250,
    newStudentAttrition: 18,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-06-01T00:00:00Z',
  },
  {
    id: '4',
    serialNumber: 4,
    campusId: '4',
    campusName: '李大殿',
    enrolledStudents: 780,
    classCount: 28,
    academicStaffCount: 18,
    cadreCount: 5,
    employeeCount: 23,
    employmentClassCount: 8,
    graduateCount: 200,
    employmentRate: 87.5,
    employmentSalary: 7800,
    highSalaryCount: 28,
    wordOfMouthAdmissions: 120,
    wordOfMouthRevenue: 360000,
    newStudentEnrollments: 150,
    newStudentAttrition: 10,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-06-01T00:00:00Z',
  },
  {
    id: '5',
    serialNumber: 5,
    campusId: '5',
    campusName: '智慧阁',
    enrolledStudents: 650,
    classCount: 24,
    academicStaffCount: 15,
    cadreCount: 4,
    employeeCount: 19,
    employmentClassCount: 6,
    graduateCount: 160,
    employmentRate: 85.6,
    employmentSalary: 7500,
    highSalaryCount: 22,
    wordOfMouthAdmissions: 100,
    wordOfMouthRevenue: 300000,
    newStudentEnrollments: 130,
    newStudentAttrition: 8,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-06-01T00:00:00Z',
  },
  {
    id: '6',
    serialNumber: 6,
    campusId: '6',
    campusName: '光明殿',
    enrolledStudents: 720,
    classCount: 26,
    academicStaffCount: 16,
    cadreCount: 4,
    employeeCount: 20,
    employmentClassCount: 7,
    graduateCount: 180,
    employmentRate: 88.2,
    employmentSalary: 7600,
    highSalaryCount: 25,
    wordOfMouthAdmissions: 110,
    wordOfMouthRevenue: 330000,
    newStudentEnrollments: 140,
    newStudentAttrition: 9,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-06-01T00:00:00Z',
  },
  {
    id: '7',
    serialNumber: 7,
    campusId: '7',
    campusName: '神恩殿',
    enrolledStudents: 890,
    classCount: 32,
    academicStaffCount: 20,
    cadreCount: 6,
    employeeCount: 26,
    employmentClassCount: 9,
    graduateCount: 240,
    employmentRate: 90.8,
    employmentSalary: 8100,
    highSalaryCount: 35,
    wordOfMouthAdmissions: 140,
    wordOfMouthRevenue: 420000,
    newStudentEnrollments: 170,
    newStudentAttrition: 11,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-06-01T00:00:00Z',
  },
]

// 模拟统计数据 - 七个神殿的汇总
const mockStats: AcademicSummaryStats = {
  totalCampuses: 7,
  totalEnrolledStudents: 6770,
  totalClasses: 245,
  totalAcademicStaff: 154,
  totalGraduates: 1800,
  averageEmploymentRate: 89.8,
  averageSalary: 8100,
  totalRevenue: 3060000,
}

// 模拟API延迟
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// 智慧司核心数据模拟服务类
export class AcademicSummaryMockService {
  // 获取智慧司核心数据列表
  async getSummaryData(params: AcademicSummaryQueryParams = {}): Promise<{
    data: AcademicSummaryData[]
    total: number
    page: number
    pageSize: number
  }> {
    await delay(800)
    console.log('📊 获取智慧司核心数据列表', params)

    let filteredData = [...mockSummaryData]

    // 神殿过滤
    if (params.campusId) {
      filteredData = filteredData.filter((item) => item.campusId === params.campusId)
    }

    // 日期过滤
    if (params.startDate || params.endDate) {
      filteredData = filteredData.filter((item) => {
        const itemDate = new Date(item.createdAt)
        if (params.startDate && itemDate < new Date(params.startDate)) {
          return false
        }
        if (params.endDate && itemDate > new Date(params.endDate)) {
          return false
        }
        return true
      })
    }

    const page = params.page || 1
    const pageSize = params.pageSize || 20
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize

    return {
      data: filteredData.slice(startIndex, endIndex),
      total: filteredData.length,
      page,
      pageSize,
    }
  }

  // 获取统计数据
  async getStats(campusId?: string): Promise<AcademicSummaryStats> {
    await delay(500)
    console.log('📈 获取智慧司统计数据', { campusId })

    if (campusId) {
      // 返回特定神殿的统计数据
      const campusData = mockSummaryData.find((item) => item.campusId === campusId)
      if (campusData) {
        return {
          totalCampuses: 1,
          totalEnrolledStudents: campusData.enrolledStudents,
          totalClasses: campusData.classCount,
          totalAcademicStaff: campusData.academicStaffCount,
          totalGraduates: campusData.graduateCount,
          averageEmploymentRate: campusData.employmentRate,
          averageSalary: campusData.employmentSalary,
          totalRevenue: campusData.wordOfMouthRevenue,
        }
      }
    }

    // 返回所有神殿的统计数据
    return { ...mockStats }
  }

  // 创建智慧司核心数据
  async createSummaryData(data: CreateAcademicSummaryRequest): Promise<AcademicSummaryData> {
    await delay(1000)
    console.log('📝 创建智慧司核心数据', data)

    const newRecord: AcademicSummaryData = {
      id: Date.now().toString(),
      serialNumber: mockSummaryData.length + 1,
      campusName: this.getCampusName(data.campusId),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    mockSummaryData.push(newRecord)
    return newRecord
  }

  // 更新智慧司核心数据
  async updateSummaryData(
    id: string,
    data: Partial<CreateAcademicSummaryRequest>,
  ): Promise<AcademicSummaryData> {
    await delay(800)
    console.log('✏️ 更新智慧司核心数据', { id, data })

    const index = mockSummaryData.findIndex((item) => item.id === id)
    if (index === -1) {
      throw new Error('数据不存在')
    }

    mockSummaryData[index] = {
      ...mockSummaryData[index],
      ...data,
      campusName: data.campusId
        ? this.getCampusName(data.campusId)
        : mockSummaryData[index].campusName,
      updatedAt: new Date().toISOString(),
    }

    return mockSummaryData[index]
  }

  // 删除智慧司核心数据
  async deleteSummaryData(id: string): Promise<void> {
    await delay(500)
    console.log('🗑️ 删除智慧司核心数据', { id })

    const index = mockSummaryData.findIndex((item) => item.id === id)
    if (index === -1) {
      throw new Error('数据不存在')
    }

    mockSummaryData.splice(index, 1)

    // 重新分配序号
    mockSummaryData.forEach((item, index) => {
      item.serialNumber = index + 1
    })
  }

  // 批量导入数据
  async importSummaryData(file: File): Promise<{
    success: number
    failed: number
    errors: string[]
  }> {
    await delay(2000)
    console.log('📥 批量导入智慧司核心数据', { fileName: file.name })

    // 模拟导入结果
    return {
      success: 3,
      failed: 1,
      errors: ['第2行数据格式错误：就业率超出范围'],
    }
  }

  // 导出数据
  async exportSummaryData(params: AcademicSummaryQueryParams = {}): Promise<Blob> {
    await delay(1000)
    console.log('📤 导出智慧司核心数据', params)

    // 模拟导出文件
    const csvContent = [
      '序号,神殿,在校生人数,班级数量,智慧司人数,干部人数,员工人数,就业班级数量,毕业生人数,就业率,就业薪资,薪资过万人数,口碑招生人数,口碑招生收入,新生入学人数,新生流失人数',
      ...mockSummaryData.map((item) =>
        [
          item.serialNumber,
          item.campusName,
          item.enrolledStudents,
          item.classCount,
          item.academicStaffCount,
          item.cadreCount,
          item.employeeCount,
          item.employmentClassCount,
          item.graduateCount,
          `${item.employmentRate}%`,
          item.employmentSalary,
          item.highSalaryCount,
          item.wordOfMouthAdmissions,
          item.wordOfMouthRevenue,
          item.newStudentEnrollments,
          item.newStudentAttrition,
        ].join(','),
      ),
    ].join('\n')

    return new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  }

  // 获取神殿名称
  private getCampusName(campusId: string): string {
    const campusNames: Record<string, string> = {
      '1': '主神殿',
      '2': '永恒殿',
      '3': '慈悲殿',
      '4': '李大殿',
      '5': '智慧阁',
      '6': '光明殿',
      '7': '神恩殿',
    }
    return campusNames[campusId] || '未知神殿'
  }

  // 获取所有数据（用于调试）
  getAllData(): AcademicSummaryData[] {
    return [...mockSummaryData]
  }

  // 重置数据（用于调试）
  resetData(): void {
    mockSummaryData.length = 0
    mockSummaryData.push(
      ...[
        {
          id: '1',
          serialNumber: 1,
          campusId: '1',
          campusName: '主神殿',
          enrolledStudents: 1250,
          classCount: 45,
          academicStaffCount: 28,
          cadreCount: 8,
          employeeCount: 36,
          employmentClassCount: 12,
          graduateCount: 320,
          employmentRate: 92.5,
          employmentSalary: 8500,
          highSalaryCount: 45,
          wordOfMouthAdmissions: 180,
          wordOfMouthRevenue: 540000,
          newStudentEnrollments: 200,
          newStudentAttrition: 15,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-06-01T00:00:00Z',
        },
        {
          id: '2',
          serialNumber: 2,
          campusId: '2',
          campusName: '永恒殿',
          enrolledStudents: 980,
          classCount: 38,
          academicStaffCount: 22,
          cadreCount: 6,
          employeeCount: 28,
          employmentClassCount: 10,
          graduateCount: 280,
          employmentRate: 89.3,
          employmentSalary: 8200,
          highSalaryCount: 38,
          wordOfMouthAdmissions: 150,
          wordOfMouthRevenue: 450000,
          newStudentEnrollments: 180,
          newStudentAttrition: 12,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-06-01T00:00:00Z',
        },
        {
          id: '3',
          serialNumber: 3,
          campusId: '3',
          campusName: '慈悲殿',
          enrolledStudents: 1560,
          classCount: 52,
          academicStaffCount: 35,
          cadreCount: 10,
          employeeCount: 45,
          employmentClassCount: 15,
          graduateCount: 420,
          employmentRate: 94.2,
          employmentSalary: 9200,
          highSalaryCount: 68,
          wordOfMouthAdmissions: 220,
          wordOfMouthRevenue: 660000,
          newStudentEnrollments: 250,
          newStudentAttrition: 18,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-06-01T00:00:00Z',
        },
        {
          id: '4',
          serialNumber: 4,
          campusId: '4',
          campusName: '李大殿',
          enrolledStudents: 780,
          classCount: 28,
          academicStaffCount: 18,
          cadreCount: 5,
          employeeCount: 23,
          employmentClassCount: 8,
          graduateCount: 200,
          employmentRate: 87.5,
          employmentSalary: 7800,
          highSalaryCount: 28,
          wordOfMouthAdmissions: 120,
          wordOfMouthRevenue: 360000,
          newStudentEnrollments: 150,
          newStudentAttrition: 10,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-06-01T00:00:00Z',
        },
        {
          id: '5',
          serialNumber: 5,
          campusId: '5',
          campusName: '智慧阁',
          enrolledStudents: 650,
          classCount: 24,
          academicStaffCount: 15,
          cadreCount: 4,
          employeeCount: 19,
          employmentClassCount: 6,
          graduateCount: 160,
          employmentRate: 85.6,
          employmentSalary: 7500,
          highSalaryCount: 22,
          wordOfMouthAdmissions: 100,
          wordOfMouthRevenue: 300000,
          newStudentEnrollments: 130,
          newStudentAttrition: 8,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-06-01T00:00:00Z',
        },
        {
          id: '6',
          serialNumber: 6,
          campusId: '6',
          campusName: '光明殿',
          enrolledStudents: 720,
          classCount: 26,
          academicStaffCount: 16,
          cadreCount: 4,
          employeeCount: 20,
          employmentClassCount: 7,
          graduateCount: 180,
          employmentRate: 88.2,
          employmentSalary: 7600,
          highSalaryCount: 25,
          wordOfMouthAdmissions: 110,
          wordOfMouthRevenue: 330000,
          newStudentEnrollments: 140,
          newStudentAttrition: 9,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-06-01T00:00:00Z',
        },
        {
          id: '7',
          serialNumber: 7,
          campusId: '7',
          campusName: '神恩殿',
          enrolledStudents: 890,
          classCount: 32,
          academicStaffCount: 20,
          cadreCount: 6,
          employeeCount: 26,
          employmentClassCount: 9,
          graduateCount: 240,
          employmentRate: 90.8,
          employmentSalary: 8100,
          highSalaryCount: 35,
          wordOfMouthAdmissions: 140,
          wordOfMouthRevenue: 420000,
          newStudentEnrollments: 170,
          newStudentAttrition: 11,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-06-01T00:00:00Z',
        },
      ],
    )
  }
}

// 导出服务实例
export const academicSummaryMockService = new AcademicSummaryMockService()
