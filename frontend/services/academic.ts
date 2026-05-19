// [学术模块] 学术研究基础服务 - 论文、会议、科研项目
import { api } from './api'
import type {
  HomeworkSubmission,
  CreateHomeworkSubmissionRequest,
  UpdateHomeworkSubmissionRequest,
  HomeworkSubmissionQueryParams,
  HomeworkSubmissionPageResponse,
  HomeworkSubmissionStats,
} from '../types/academic'

// 学术统计数据接口
export interface AcademicStats {
  academicPapers: number
  academicConferences: number
  researchProjects: number
  industryPartnerships: number
  totalPublications: number
  activeProjects: number
  completedProjects: number
  collaborationCount: number
}

// 学术论文接口
export interface AcademicPaper {
  id: string
  title: string
  authors: string[]
  journal: string
  publishDate: string
  impactFactor?: number
  citations: number
  keywords: string[]
  abstract: string
  doi?: string
  status: 'published' | 'submitted' | 'under_review' | 'rejected'
  campusId: string
  createdAt: string
  updatedAt: string
}

// 学术会议接口
export interface AcademicConference {
  id: string
  name: string
  location: string
  startDate: string
  endDate: string
  type: 'international' | 'national' | 'regional' | 'local'
  participants: number
  presentations: number
  campusId: string
  description?: string
  website?: string
  createdAt: string
  updatedAt: string
}

// 科研项目接口
export interface ResearchProject {
  id: string
  title: string
  principalInvestigator: string
  fundingSource: string
  budget: number
  startDate: string
  endDate: string
  status: 'planning' | 'active' | 'completed' | 'suspended' | 'cancelled'
  progress: number // 0-100
  description: string
  objectives: string[]
  deliverables: string[]
  campusId: string
  createdAt: string
  updatedAt: string
}

// 校企合作接口
export interface IndustryPartnership {
  id: string
  companyName: string
  contactPerson: string
  contactEmail: string
  contactPhone: string
  partnershipType: 'research' | 'training' | 'consulting' | 'internship' | 'other'
  startDate: string
  endDate?: string
  status: 'active' | 'completed' | 'suspended' | 'planned'
  description: string
  benefits: string[]
  campusId: string
  createdAt: string
  updatedAt: string
}

// 查询参数接口
export interface AcademicQueryParams {
  campusId?: string
  search?: string
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  startDate?: string
  endDate?: string
  status?: string
}

// 学术服务类
export class AcademicService {
  // 获取学术统计数据
  async getStats(campusId?: string): Promise<AcademicStats> {
    const params = campusId ? { campusId } : {}
    const response = await api.get('/academic/stats', { params })
    return response.data
  }

  // 获取学术论文列表
  async getPapers(params: AcademicQueryParams = {}): Promise<{
    data: AcademicPaper[]
    total: number
    page: number
    pageSize: number
  }> {
    const response = await api.get('/academic/papers', { params })
    return response.data
  }

  // 获取学术会议列表
  async getConferences(params: AcademicQueryParams = {}): Promise<{
    data: AcademicConference[]
    total: number
    page: number
    pageSize: number
  }> {
    const response = await api.get('/academic/conferences', { params })
    return response.data
  }

  // 获取科研项目列表
  async getProjects(params: AcademicQueryParams = {}): Promise<{
    data: ResearchProject[]
    total: number
    page: number
    pageSize: number
  }> {
    const response = await api.get('/academic/projects', { params })
    return response.data
  }

  // 获取校企合作列表
  async getPartnerships(params: AcademicQueryParams = {}): Promise<{
    data: IndustryPartnership[]
    total: number
    page: number
    pageSize: number
  }> {
    const response = await api.get('/academic/partnerships', { params })
    return response.data
  }

  // 创建学术论文
  async createPaper(data: Partial<AcademicPaper>): Promise<AcademicPaper> {
    const response = await api.post('/academic/papers', data)
    return response.data
  }

  // 更新学术论文
  async updatePaper(id: string, data: Partial<AcademicPaper>): Promise<AcademicPaper> {
    const response = await api.put(`/academic/papers/${id}`, data)
    return response.data
  }

  // 删除学术论文
  async deletePaper(id: string): Promise<void> {
    await api.delete(`/academic/papers/${id}`)
  }

  // 创建学术会议
  async createConference(data: Partial<AcademicConference>): Promise<AcademicConference> {
    const response = await api.post('/academic/conferences', data)
    return response.data
  }

  // 更新学术会议
  async updateConference(
    id: string,
    data: Partial<AcademicConference>,
  ): Promise<AcademicConference> {
    const response = await api.put(`/academic/conferences/${id}`, data)
    return response.data
  }

  // 删除学术会议
  async deleteConference(id: string): Promise<void> {
    await api.delete(`/academic/conferences/${id}`)
  }

  // 创建科研项目
  async createProject(data: Partial<ResearchProject>): Promise<ResearchProject> {
    const response = await api.post('/academic/projects', data)
    return response.data
  }

  // 更新科研项目
  async updateProject(id: string, data: Partial<ResearchProject>): Promise<ResearchProject> {
    const response = await api.put(`/academic/projects/${id}`, data)
    return response.data
  }

  // 删除科研项目
  async deleteProject(id: string): Promise<void> {
    await api.delete(`/academic/projects/${id}`)
  }

  // 创建校企合作
  async createPartnership(data: Partial<IndustryPartnership>): Promise<IndustryPartnership> {
    const response = await api.post('/academic/partnerships', data)
    return response.data
  }

  // 更新校企合作
  async updatePartnership(
    id: string,
    data: Partial<IndustryPartnership>,
  ): Promise<IndustryPartnership> {
    const response = await api.put(`/academic/partnerships/${id}`, data)
    return response.data
  }

  // 删除校企合作
  async deletePartnership(id: string): Promise<void> {
    await api.delete(`/academic/partnerships/${id}`)
  }

  // 获取作业提交率列表
  async getHomeworkSubmissions(
    params: HomeworkSubmissionQueryParams = {},
  ): Promise<HomeworkSubmissionPageResponse<HomeworkSubmission>> {
    const response = await api.get('/academic/homework-submission', { params })
    return response.data
  }

  // 创建作业提交率记录
  async createHomeworkSubmission(
    data: CreateHomeworkSubmissionRequest,
  ): Promise<HomeworkSubmission> {
    const response = await api.post('/academic/homework-submission', data)
    return response.data
  }

  // 更新作业提交率记录
  async updateHomeworkSubmission(
    id: string,
    data: UpdateHomeworkSubmissionRequest,
  ): Promise<HomeworkSubmission> {
    const response = await api.put(`/academic/homework-submission/${id}`, data)
    return response.data
  }

  // 删除作业提交率记录
  async deleteHomeworkSubmission(id: string): Promise<void> {
    await api.delete(`/academic/homework-submission/${id}`)
  }

  // 获取作业提交率统计
  async getHomeworkSubmissionStats(year?: number): Promise<HomeworkSubmissionStats> {
    const params = year ? { year } : {}
    const response = await api.get('/academic/homework-submission/stats', { params })
    return response.data
  }
}

// 导出服务实例
export const academicService = new AcademicService()

// 导出工具函数
export const academicUtils = {
  // 格式化日期
  formatDate: (date: string | Date): string => {
    const d = new Date(date)
    return d.toLocaleDateString('zh-CN')
  },

  // 格式化金额
  formatCurrency: (amount: number): string => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
    }).format(amount)
  },

  // 获取状态颜色
  getStatusColor: (status: string): string => {
    const statusColors: Record<string, string> = {
      published: '#52c41a',
      submitted: '#1890ff',
      under_review: '#faad14',
      rejected: '#ff4d4f',
      active: '#52c41a',
      completed: '#1890ff',
      suspended: '#faad14',
      cancelled: '#ff4d4f',
      planning: '#722ed1',
    }
    return statusColors[status] || '#d9d9d9'
  },

  // 获取状态文本
  getStatusText: (status: string): string => {
    const statusTexts: Record<string, string> = {
      published: '已发表',
      submitted: '已提交',
      under_review: '审稿中',
      rejected: '已拒绝',
      active: '进行中',
      completed: '已完成',
      suspended: '已暂停',
      cancelled: '已取消',
      planning: '计划中',
    }
    return statusTexts[status] || status
  },

  // 格式化百分比
  formatPercentage: (value: number): string => {
    return `${value.toFixed(1)}%`
  },

  // 格式化数字
  formatNumber: (value: number): string => {
    return new Intl.NumberFormat('zh-CN').format(value)
  },

  // 验证教员绩效数据
  validateInstructorPerformance: (data: any): string[] => {
    const errors: string[] = []
    if (!data.name) errors.push('姓名不能为空')
    if (data.studentSatisfaction < 0 || data.studentSatisfaction > 100) {
      errors.push('学员满意度必须在0-100之间')
    }
    return errors
  },

  // 计算平均分
  calculateAverageScore: (data: any): number => {
    const scores = [
      data.studentSatisfaction || 0,
      data.homeworkSubmissionRate || 0,
      data.homeworkPassRate || 0,
      data.examPassRate || 0,
    ]
    return scores.reduce((sum, score) => sum + score, 0) / scores.length
  },
}
