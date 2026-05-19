// [学术模块] 智慧司核心数据汇总表服务
import { api } from './api'

// 智慧司核心数据汇总表接口
export interface AcademicSummaryData {
  id: string
  serialNumber: number
  campusId: string
  campusName: string
  enrolledStudents: number // 在校生人数
  classCount: number // 班级数量
  academicStaffCount: number // 智慧司人数
  cadreCount: number // 干部人数
  employeeCount: number // 员工人数
  employmentClassCount: number // 就业班级数量
  graduateCount: number // 毕业生人数
  employmentRate: number // 就业率 (百分比)
  employmentSalary: number // 就业薪资 (平均薪资)
  highSalaryCount: number // 薪资过万人数
  wordOfMouthAdmissions: number // 口碑招生人数
  wordOfMouthRevenue: number // 口碑招生收入
  newStudentEnrollments: number // 新生入学人数
  newStudentAttrition: number // 新生流失人数
  createdAt: string
  updatedAt: string
}

// 查询参数接口
export interface AcademicSummaryQueryParams {
  campusId?: string
  startDate?: string
  endDate?: string
  page?: number
  pageSize?: number
}

// 统计数据接口
export interface AcademicSummaryStats {
  totalCampuses: number
  totalEnrolledStudents: number
  totalClasses: number
  totalAcademicStaff: number
  totalGraduates: number
  averageEmploymentRate: number
  averageSalary: number
  totalRevenue: number
}

// 创建请求接口
export interface CreateAcademicSummaryRequest {
  campusId: string
  enrolledStudents: number
  classCount: number
  academicStaffCount: number
  cadreCount: number
  employeeCount: number
  employmentClassCount: number
  graduateCount: number
  employmentRate: number
  employmentSalary: number
  highSalaryCount: number
  wordOfMouthAdmissions: number
  wordOfMouthRevenue: number
  newStudentEnrollments: number
  newStudentAttrition: number
}

// 更新请求接口
export interface UpdateAcademicSummaryRequest extends Partial<CreateAcademicSummaryRequest> {
  id: string
}

// 智慧司核心数据服务类
export class AcademicSummaryService {
  // 获取智慧司核心数据列表
  async getSummaryData(params: AcademicSummaryQueryParams = {}): Promise<{
    data: AcademicSummaryData[]
    total: number
    page: number
    pageSize: number
  }> {
    const response = await api.get('/academic/summary', { params })
    return response.data
  }

  // 获取统计数据
  async getStats(campusId?: string): Promise<AcademicSummaryStats> {
    const params = campusId ? { campusId } : {}
    const response = await api.get('/academic/summary/stats', { params })
    return response.data
  }

  // 创建智慧司核心数据
  async createSummaryData(data: CreateAcademicSummaryRequest): Promise<AcademicSummaryData> {
    const response = await api.post('/academic/summary', data)
    return response.data
  }

  // 更新智慧司核心数据
  async updateSummaryData(
    id: string,
    data: Partial<CreateAcademicSummaryRequest>,
  ): Promise<AcademicSummaryData> {
    const response = await api.put(`/academic/summary/${id}`, data)
    return response.data
  }

  // 删除智慧司核心数据
  async deleteSummaryData(id: string): Promise<void> {
    await api.delete(`/academic/summary/${id}`)
  }

  // 批量导入数据
  async importSummaryData(file: File): Promise<{
    success: number
    failed: number
    errors: string[]
  }> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await api.post('/academic/summary/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  }

  // 导出数据
  async exportSummaryData(params: AcademicSummaryQueryParams = {}): Promise<Blob> {
    const response = await api.get('/academic/summary/export', {
      params,
      responseType: 'blob',
    })
    return response.data
  }
}

// 导出服务实例
export const academicSummaryService = new AcademicSummaryService()

// 导出工具函数
export const academicSummaryUtils = {
  // 格式化数字
  formatNumber: (num: number): string => {
    if (num === 0) return '0'
    return new Intl.NumberFormat('zh-CN').format(num)
  },

  // 格式化货币
  formatCurrency: (amount: number): string => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
    }).format(amount)
  },

  // 格式化百分比
  formatPercentage: (value: number): string => {
    return `${value.toFixed(1)}%`
  },

  // 计算流失率
  calculateAttritionRate: (enrollments: number, attrition: number): number => {
    if (enrollments === 0) return 0
    return (attrition / enrollments) * 100
  },

  // 计算就业率
  calculateEmploymentRate: (graduates: number, employed: number): number => {
    if (graduates === 0) return 0
    return (employed / graduates) * 100
  },

  // 导出到Excel
  exportToExcel: (data: AcademicSummaryData[], filename: string = '智慧司核心数据汇总表') => {
    // 这里可以集成实际的Excel导出库，如xlsx
    console.log('导出Excel数据:', { data, filename })

    // 模拟导出功能
    const csvContent = [
      '序号,神殿,在校生人数,班级数量,智慧司人数,干部人数,员工人数,就业班级数量,毕业生人数,就业率,就业薪资,薪资过万人数,口碑招生人数,口碑招生收入,新生入学人数,新生流失人数',
      ...data.map((item) =>
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

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  },

  // 验证数据
  validateData: (data: CreateAcademicSummaryRequest): string[] => {
    const errors: string[] = []

    if (!data.campusId) {
      errors.push('神殿不能为空')
    }

    if (data.enrolledStudents < 0) {
      errors.push('在校生人数不能为负数')
    }

    if (data.classCount < 0) {
      errors.push('班级数量不能为负数')
    }

    if (data.employmentRate < 0 || data.employmentRate > 100) {
      errors.push('就业率必须在0-100之间')
    }

    if (data.employmentSalary < 0) {
      errors.push('就业薪资不能为负数')
    }

    if (data.newStudentAttrition > data.newStudentEnrollments) {
      errors.push('新生流失人数不能大于新生入学人数')
    }

    return errors
  },

  // 生成序号
  generateSerialNumber: (existingData: AcademicSummaryData[]): number => {
    if (existingData.length === 0) return 1
    const maxSerial = Math.max(...existingData.map((item) => item.serialNumber))
    return maxSerial + 1
  },
}
