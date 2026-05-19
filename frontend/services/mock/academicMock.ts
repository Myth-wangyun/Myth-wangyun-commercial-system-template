import type {
  AcademicStats,
  AcademicPaper,
  AcademicConference,
  ResearchProject,
  IndustryPartnership,
  AcademicQueryParams,
} from '../academic'
import type {
  HomeworkSubmission,
  CreateHomeworkSubmissionRequest,
  UpdateHomeworkSubmissionRequest,
  HomeworkSubmissionQueryParams,
  HomeworkSubmissionPageResponse,
  HomeworkSubmissionStats,
} from '@/types/academic'

// 模拟学术统计数据
const mockAcademicStats: AcademicStats = {
  academicPapers: 156,
  academicConferences: 45,
  researchProjects: 23,
  industryPartnerships: 12,
  totalPublications: 234,
  activeProjects: 18,
  completedProjects: 5,
  collaborationCount: 8,
}

// 模拟学术论文数据
const mockPapers: AcademicPaper[] = [
  {
    id: '1',
    title: '基于深度学习的教育质量评估方法研究',
    authors: ['张教授', '李博士', '王研究员'],
    journal: '教育技术学报',
    publishDate: '2024-01-15',
    impactFactor: 2.5,
    citations: 15,
    keywords: ['深度学习', '教育质量', '评估方法'],
    abstract: '本文提出了一种基于深度学习的教育质量评估方法...',
    doi: '10.1234/example.2024.001',
    status: 'published',
    campusId: '1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
  },
  {
    id: '2',
    title: '人工智能在在线教育中的应用研究',
    authors: ['陈教授', '刘博士'],
    journal: '计算机教育',
    publishDate: '2024-02-20',
    impactFactor: 1.8,
    citations: 8,
    keywords: ['人工智能', '在线教育', '应用研究'],
    abstract: '随着人工智能技术的发展，其在在线教育中的应用越来越广泛...',
    doi: '10.1234/example.2024.002',
    status: 'published',
    campusId: '1',
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-02-20T00:00:00Z',
  },
  {
    id: '3',
    title: '教育大数据挖掘与分析技术研究',
    authors: ['赵教授', '孙博士', '周研究员'],
    journal: '大数据学报',
    publishDate: '2024-03-10',
    impactFactor: 3.2,
    citations: 22,
    keywords: ['教育大数据', '数据挖掘', '分析技术'],
    abstract: '教育大数据挖掘与分析技术是当前教育信息化的重要研究方向...',
    status: 'under_review',
    campusId: '2',
    createdAt: '2024-03-01T00:00:00Z',
    updatedAt: '2024-03-10T00:00:00Z',
  },
]

// 模拟学术会议数据
const mockConferences: AcademicConference[] = [
  {
    id: '1',
    name: '2024年国际教育技术大会',
    location: '北京',
    startDate: '2024-06-15',
    endDate: '2024-06-17',
    type: 'international',
    participants: 500,
    presentations: 120,
    campusId: '1',
    description: '国际教育技术领域的重要会议',
    website: 'https://example.com/ietc2024',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-06-15T00:00:00Z',
  },
  {
    id: '2',
    name: '全国高等教育信息化研讨会',
    location: '上海',
    startDate: '2024-08-20',
    endDate: '2024-08-22',
    type: 'national',
    participants: 300,
    presentations: 80,
    campusId: '1',
    description: '全国高等教育信息化发展的重要会议',
    website: 'https://example.com/heis2024',
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-08-20T00:00:00Z',
  },
]

// 模拟科研项目数据
const mockProjects: ResearchProject[] = [
  {
    id: '1',
    title: '智能教育平台关键技术研究',
    principalInvestigator: '张教授',
    fundingSource: '国家自然科学基金',
    budget: 500000,
    startDate: '2024-01-01',
    endDate: '2026-12-31',
    status: 'active',
    progress: 45,
    description: '研究智能教育平台的关键技术，包括个性化推荐、智能评估等',
    objectives: ['开发个性化学习推荐算法', '构建智能评估系统', '实现多模态学习分析'],
    deliverables: ['技术报告', '软件系统', '学术论文'],
    campusId: '1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-06-01T00:00:00Z',
  },
  {
    id: '2',
    title: '教育大数据隐私保护技术研究',
    principalInvestigator: '李教授',
    fundingSource: '教育部重点实验室',
    budget: 300000,
    startDate: '2024-03-01',
    endDate: '2025-12-31',
    status: 'active',
    progress: 30,
    description: '研究教育大数据环境下的隐私保护技术',
    objectives: ['设计隐私保护算法', '开发安全计算框架', '建立隐私评估体系'],
    deliverables: ['技术方案', '原型系统', '标准规范'],
    campusId: '2',
    createdAt: '2024-03-01T00:00:00Z',
    updatedAt: '2024-06-01T00:00:00Z',
  },
]

// 模拟校企合作数据
const mockPartnerships: IndustryPartnership[] = [
  {
    id: '1',
    companyName: '腾讯教育',
    contactPerson: '王总',
    contactEmail: 'wang@tencent.com',
    contactPhone: '13800138000',
    partnershipType: 'research',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    status: 'active',
    description: '合作开发智能教育平台',
    benefits: ['技术资源共享', '人才培养合作', '市场推广支持'],
    campusId: '1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-06-01T00:00:00Z',
  },
  {
    id: '2',
    companyName: '阿里巴巴教育',
    contactPerson: '李总',
    contactEmail: 'li@alibaba.com',
    contactPhone: '13900139000',
    partnershipType: 'training',
    startDate: '2024-02-01',
    status: 'active',
    description: '合作开展云计算技术培训',
    benefits: ['课程资源共享', '师资培训', '实习基地建设'],
    campusId: '2',
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-06-01T00:00:00Z',
  },
]

// 模拟作业提交率数据
const mockHomeworkSubmissions: HomeworkSubmission[] = [
  {
    id: '1',
    name: '张老师',
    january: 92.5,
    february: 95.0,
    march: 90.5,
    april: 93.2,
    may: 94.8,
    june: 91.3,
    july: 96.0,
    august: 93.5,
    september: 89.8,
    october: 92.1,
    november: 94.5,
    december: 95.2,
    average: 93.1,
    year: 2024,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-12-31T00:00:00Z',
  },
  {
    id: '2',
    name: '李老师',
    january: 88.0,
    february: 90.5,
    march: 87.8,
    april: 91.2,
    may: 89.5,
    june: 92.0,
    july: 93.5,
    august: 90.8,
    september: 88.5,
    october: 91.0,
    november: 92.5,
    december: 94.0,
    average: 90.6,
    year: 2024,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-12-31T00:00:00Z',
  },
  {
    id: '3',
    name: '王老师',
    january: 95.5,
    february: 96.0,
    march: 94.2,
    april: 97.0,
    may: 95.8,
    june: 96.5,
    july: 98.0,
    august: 96.8,
    september: 95.0,
    october: 97.5,
    november: 98.2,
    december: 99.0,
    average: 96.3,
    year: 2024,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-12-31T00:00:00Z',
  },
]

// 模拟API延迟
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// 学术模拟服务类
export class AcademicMockService {
  // 获取学术统计数据
  async getStats(campusId?: string): Promise<AcademicStats> {
    await delay(500)
    console.log('📊 获取学术统计数据', { campusId })
    return { ...mockAcademicStats }
  }

  // 获取学术论文列表
  async getPapers(params: AcademicQueryParams = {}): Promise<{
    data: AcademicPaper[]
    total: number
    page: number
    pageSize: number
  }> {
    await delay(800)
    console.log('📄 获取学术论文列表', params)

    let filteredData = [...mockPapers]

    // 神殿过滤
    if (params.campusId) {
      filteredData = filteredData.filter((item) => item.campusId === params.campusId)
    }

    // 搜索过滤
    if (params.search) {
      const searchLower = params.search.toLowerCase()
      filteredData = filteredData.filter(
        (item) =>
          item.title.toLowerCase().includes(searchLower) ||
          item.authors.some((author) => author.toLowerCase().includes(searchLower)) ||
          item.journal.toLowerCase().includes(searchLower),
      )
    }

    // 状态过滤
    if (params.status) {
      filteredData = filteredData.filter((item) => item.status === params.status)
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

  // 获取学术会议列表
  async getConferences(params: AcademicQueryParams = {}): Promise<{
    data: AcademicConference[]
    total: number
    page: number
    pageSize: number
  }> {
    await delay(600)
    console.log('🏛️ 获取学术会议列表', params)

    let filteredData = [...mockConferences]

    if (params.campusId) {
      filteredData = filteredData.filter((item) => item.campusId === params.campusId)
    }

    if (params.search) {
      const searchLower = params.search.toLowerCase()
      filteredData = filteredData.filter(
        (item) =>
          item.name.toLowerCase().includes(searchLower) ||
          item.location.toLowerCase().includes(searchLower),
      )
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

  // 获取科研项目列表
  async getProjects(params: AcademicQueryParams = {}): Promise<{
    data: ResearchProject[]
    total: number
    page: number
    pageSize: number
  }> {
    await delay(700)
    console.log('🔬 获取科研项目列表', params)

    let filteredData = [...mockProjects]

    if (params.campusId) {
      filteredData = filteredData.filter((item) => item.campusId === params.campusId)
    }

    if (params.search) {
      const searchLower = params.search.toLowerCase()
      filteredData = filteredData.filter(
        (item) =>
          item.title.toLowerCase().includes(searchLower) ||
          item.principalInvestigator.toLowerCase().includes(searchLower) ||
          item.fundingSource.toLowerCase().includes(searchLower),
      )
    }

    if (params.status) {
      filteredData = filteredData.filter((item) => item.status === params.status)
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

  // 获取校企合作列表
  async getPartnerships(params: AcademicQueryParams = {}): Promise<{
    data: IndustryPartnership[]
    total: number
    page: number
    pageSize: number
  }> {
    await delay(600)
    console.log('🤝 获取校企合作列表', params)

    let filteredData = [...mockPartnerships]

    if (params.campusId) {
      filteredData = filteredData.filter((item) => item.campusId === params.campusId)
    }

    if (params.search) {
      const searchLower = params.search.toLowerCase()
      filteredData = filteredData.filter(
        (item) =>
          item.companyName.toLowerCase().includes(searchLower) ||
          item.contactPerson.toLowerCase().includes(searchLower),
      )
    }

    if (params.status) {
      filteredData = filteredData.filter((item) => item.status === params.status)
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

  // 创建学术论文
  async createPaper(data: Partial<AcademicPaper>): Promise<AcademicPaper> {
    await delay(1000)
    console.log('📝 创建学术论文', data)

    const newPaper: AcademicPaper = {
      id: Date.now().toString(),
      title: data.title || '',
      authors: data.authors || [],
      journal: data.journal || '',
      publishDate: data.publishDate || new Date().toISOString().split('T')[0],
      impactFactor: data.impactFactor,
      citations: data.citations || 0,
      keywords: data.keywords || [],
      abstract: data.abstract || '',
      doi: data.doi,
      status: data.status || 'submitted',
      campusId: data.campusId || '1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    mockPapers.push(newPaper)
    return newPaper
  }

  // 更新学术论文
  async updatePaper(id: string, data: Partial<AcademicPaper>): Promise<AcademicPaper> {
    await delay(800)
    console.log('✏️ 更新学术论文', { id, data })

    const index = mockPapers.findIndex((paper) => paper.id === id)
    if (index === -1) {
      throw new Error('论文不存在')
    }

    mockPapers[index] = {
      ...mockPapers[index],
      ...data,
      updatedAt: new Date().toISOString(),
    }

    return mockPapers[index]
  }

  // 删除学术论文
  async deletePaper(id: string): Promise<void> {
    await delay(500)
    console.log('🗑️ 删除学术论文', { id })

    const index = mockPapers.findIndex((paper) => paper.id === id)
    if (index === -1) {
      throw new Error('论文不存在')
    }

    mockPapers.splice(index, 1)
  }

  // 计算平均值
  private calculateAverage(record: {
    january: number
    february: number
    march: number
    april: number
    may: number
    june: number
    july: number
    august: number
    september: number
    october: number
    november: number
    december: number
  }): number {
    const values = [
      record.january,
      record.february,
      record.march,
      record.april,
      record.may,
      record.june,
      record.july,
      record.august,
      record.september,
      record.october,
      record.november,
      record.december,
    ]
    return values.reduce((sum, val) => sum + val, 0) / values.length
  }

  // 获取作业提交率列表
  async getHomeworkSubmissions(
    params: HomeworkSubmissionQueryParams = {},
  ): Promise<HomeworkSubmissionPageResponse<HomeworkSubmission>> {
    await delay(800)
    console.log('📝 获取作业提交率列表', params)

    let filteredData = [...mockHomeworkSubmissions]

    // 搜索过滤
    if (params.search) {
      const searchLower = params.search.toLowerCase()
      filteredData = filteredData.filter((item) => item.name.toLowerCase().includes(searchLower))
    }

    // 年份过滤
    if (params.year) {
      filteredData = filteredData.filter((item) => item.year === params.year)
    }

    // 排序
    if (params.sortBy) {
      filteredData.sort((a, b) => {
        const aVal = a[params.sortBy as keyof HomeworkSubmission]
        const bVal = b[params.sortBy as keyof HomeworkSubmission]
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return params.sortOrder === 'desc' ? bVal - aVal : aVal - bVal
        }
        return 0
      })
    }

    // 分页
    const page = params.page || 1
    const pageSize = params.pageSize || 20
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize

    return {
      list: filteredData.slice(startIndex, endIndex),
      total: filteredData.length,
      page,
      pageSize,
      totalPages: Math.ceil(filteredData.length / pageSize),
    }
  }

  // 创建作业提交率记录
  async createHomeworkSubmission(
    data: CreateHomeworkSubmissionRequest,
  ): Promise<HomeworkSubmission> {
    await delay(1000)
    console.log('➕ 创建作业提交率记录', data)

    const average = this.calculateAverage(data)
    const newRecord: HomeworkSubmission = {
      id: Date.now().toString(),
      ...data,
      average,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    mockHomeworkSubmissions.push(newRecord)
    return newRecord
  }

  // 更新作业提交率记录
  async updateHomeworkSubmission(
    id: string,
    data: UpdateHomeworkSubmissionRequest,
  ): Promise<HomeworkSubmission> {
    await delay(800)
    console.log('✏️ 更新作业提交率记录', { id, data })

    const index = mockHomeworkSubmissions.findIndex((record) => record.id === id)
    if (index === -1) {
      throw new Error('记录不存在')
    }

    const updatedRecord = {
      ...mockHomeworkSubmissions[index],
      ...data,
      id, // 确保 id 不被覆盖
    }

    // 重新计算平均值
    if (
      data.january !== undefined ||
      data.february !== undefined ||
      data.march !== undefined ||
      data.april !== undefined ||
      data.may !== undefined ||
      data.june !== undefined ||
      data.july !== undefined ||
      data.august !== undefined ||
      data.september !== undefined ||
      data.october !== undefined ||
      data.november !== undefined ||
      data.december !== undefined
    ) {
      updatedRecord.average = this.calculateAverage(updatedRecord)
    }

    updatedRecord.updatedAt = new Date().toISOString()
    mockHomeworkSubmissions[index] = updatedRecord

    return updatedRecord
  }

  // 删除作业提交率记录
  async deleteHomeworkSubmission(id: string): Promise<void> {
    await delay(500)
    console.log('🗑️ 删除作业提交率记录', { id })

    const index = mockHomeworkSubmissions.findIndex((record) => record.id === id)
    if (index === -1) {
      throw new Error('记录不存在')
    }

    mockHomeworkSubmissions.splice(index, 1)
  }

  // 获取作业提交率统计
  async getHomeworkSubmissionStats(year?: number): Promise<HomeworkSubmissionStats> {
    await delay(600)
    console.log('📊 获取作业提交率统计', { year })

    let filteredData = mockHomeworkSubmissions
    if (year) {
      filteredData = filteredData.filter((record) => record.year === year)
    }

    if (filteredData.length === 0) {
      return {
        totalInstructors: 0,
        averageSubmissionRate: 0,
        year: year || new Date().getFullYear(),
        monthlyAverages: {
          january: 0,
          february: 0,
          march: 0,
          april: 0,
          may: 0,
          june: 0,
          july: 0,
          august: 0,
          september: 0,
          october: 0,
          november: 0,
          december: 0,
        },
      }
    }

    const monthlySums = {
      january: 0,
      february: 0,
      march: 0,
      april: 0,
      may: 0,
      june: 0,
      july: 0,
      august: 0,
      september: 0,
      october: 0,
      november: 0,
      december: 0,
    }

    filteredData.forEach((record) => {
      monthlySums.january += record.january
      monthlySums.february += record.february
      monthlySums.march += record.march
      monthlySums.april += record.april
      monthlySums.may += record.may
      monthlySums.june += record.june
      monthlySums.july += record.july
      monthlySums.august += record.august
      monthlySums.september += record.september
      monthlySums.october += record.october
      monthlySums.november += record.november
      monthlySums.december += record.december
    })

    const monthlyAverages = {
      january: monthlySums.january / filteredData.length,
      february: monthlySums.february / filteredData.length,
      march: monthlySums.march / filteredData.length,
      april: monthlySums.april / filteredData.length,
      may: monthlySums.may / filteredData.length,
      june: monthlySums.june / filteredData.length,
      july: monthlySums.july / filteredData.length,
      august: monthlySums.august / filteredData.length,
      september: monthlySums.september / filteredData.length,
      october: monthlySums.october / filteredData.length,
      november: monthlySums.november / filteredData.length,
      december: monthlySums.december / filteredData.length,
    }

    const averageSubmissionRate =
      Object.values(monthlyAverages).reduce((sum, val) => sum + val, 0) / 12

    return {
      totalInstructors: filteredData.length,
      averageSubmissionRate,
      year: year || new Date().getFullYear(),
      monthlyAverages,
    }
  }
}

// 导出服务实例
export const academicMockService = new AcademicMockService()
