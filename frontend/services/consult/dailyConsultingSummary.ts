/**
 * 005神殿每日咨询量汇总表 - 前端服务
 * 调用 /api/v1/consult/consultation/daily-summary 等接口
 */
import api from '../api'

// ==================== 类型定义 ====================

/** 咨询师汇总数据 */
export interface ConsultantSummary {
  consultant_name: string      // 咨询师姓名
  daily_consult: number        // 日咨询量
  daily_visit: number          // 日上门量
  daily_enrolled: number       // 日报名数
  daily_booked: number         // 日订座数
  monthly_consult: number      // 月咨询量
  monthly_visit: number        // 月上门量
  monthly_enrolled: number     // 月报名数
  monthly_booked: number       // 月订座数
  monthly_refund: number       // 月退费数
  visit_rate: number           // 上门率
  enroll_rate: number          // 转化率(咨询量)
  face_enroll_rate: number     // 当面转化率(上门量)
}

/** 媒体来源汇总数据 */
export interface MediaSourceSummary {
  source_name: string          // 来源名称
  daily_consult: number
  daily_visit: number
  daily_enrolled: number
  daily_booked: number
  monthly_consult: number
  monthly_visit: number
  monthly_enrolled: number
  monthly_booked: number
  visit_rate: number
  enroll_rate: number
  face_enroll_rate: number
}

/** 口碑提供人汇总数据 */
export interface ReputationProviderSummary {
  provider_name: string        // 口碑提供人
  daily_consult: number
  daily_visit: number
  daily_enrolled: number
  daily_booked: number
  monthly_consult: number
  monthly_visit: number
  monthly_enrolled: number
  monthly_booked: number
  visit_rate: number
  enroll_rate: number
  face_enroll_rate: number
}

/** 渠道专员汇总数据 */
export interface ChannelStaffSummary {
  staff_name: string           // 渠道专员
  daily_consult: number
  daily_visit: number
  daily_enrolled: number
  daily_booked: number
  monthly_consult: number
  monthly_visit: number
  monthly_enrolled: number
  monthly_booked: number
  visit_rate: number
  enroll_rate: number
  face_enroll_rate: number
}

/** 汇总统计 */
export interface SectionTotals {
  daily_consult: number
  daily_visit: number
  daily_enrolled: number
  daily_enrolled_short: number    // 日报名数_短期
  daily_enrolled_long: number     // 日报名数_长期
  daily_enrolled_3year: number    // 日报名数_学三
  daily_enrolled_2year: number    // 日报名数_学二
  daily_booked: number
  monthly_consult: number
  monthly_visit: number
  monthly_enrolled: number
  monthly_enrolled_short: number  // 月报名数_短期
  monthly_enrolled_long: number   // 月报名数_长期
  monthly_enrolled_3year: number  // 月报名数_学三
  monthly_enrolled_2year: number  // 月报名数_学二
  monthly_booked: number
  monthly_refund: number
  monthly_invalid: number         // 月无效量数量
  monthly_invalid_rate: number    // 月无效率
  refund_rate: number             // 月退费率
  visit_rate: number
  enroll_rate: number
  face_enroll_rate: number
}

/** 区块数据 */
export interface SectionData {
  section_type: string
  section_name: string
  data: any[]  // 灵活类型，根据section_type不同可能是不同的数据类型
  totals: SectionTotals
  sub_sections?: Record<string, {
    data: MediaSourceSummary[]
    totals: SectionTotals
  }>
}

/** 完整汇总响应 */
export interface DailySummaryResponse {
  success: boolean
  date: string
  month_start: string
  campus: string | null
  sections: SectionData[]
  grand_totals: {
    network_sem: SectionTotals
    network_newmedia: SectionTotals
    network_total: SectionTotals
    reputation: SectionTotals
    reputation_newmedia: SectionTotals
    channel: SectionTotals
    consultant: SectionTotals
    all_total: SectionTotals
  }
}

// ==================== 后端响应转换 ====================

type BackendConsultantStats = {
  咨询师: string
  日咨询量: number
  日上门量: number
  日报名: number
  月总咨询量: number
  月总上门量: number
  月总报名: number
  月上门率?: number | null
  月总转化率?: number | null
  月当面转化率?: number | null
  订座: number
}

type BackendSectionSummary = {
  月咨询总量: number
  月总上门量: number
  月报名数_短期: number
  月报名数_长期: number
  月报名数_学三: number
  月报名数_学二: number
  月报名数_合计: number
  月无效量数量: number
  月无效率?: number | null
  月电话上门转化率?: number | null
  月度总转化率?: number | null
  月退费人数: number
  月退费率?: number | null
  日咨询量: number
  日上门量: number
  日报名数_短期: number
  日报名数_长期: number
  日报名数_学三: number
  日报名数_学二: number
}

type BackendSectionData = {
  section_name: string
  summary: BackendSectionSummary
  consultants: BackendConsultantStats[]
  total: BackendConsultantStats
}

type BackendDailySummaryResponse = {
  success: boolean
  campus: string | null
  month: string
  current_date: string
  sections: Record<string, BackendSectionData>
  grand_total: Record<string, any>
}

const toSectionTotals = (summary: BackendSectionSummary): SectionTotals => {
  const dailyEnrolledShort = summary.日报名数_短期 || 0
  const dailyEnrolledLong = summary.日报名数_长期 || 0
  const dailyEnrolled3Year = summary.日报名数_学三 || 0
  const dailyEnrolled2Year = summary.日报名数_学二 || 0
  const dailyEnrolled = dailyEnrolledShort + dailyEnrolledLong + dailyEnrolled3Year + dailyEnrolled2Year
  const monthlyEnrolled = summary.月报名数_合计 || 0
  const monthlyConsult = summary.月咨询总量 || 0
  const monthlyVisit = summary.月总上门量 || 0
  const monthlyInvalid = summary.月无效量数量 || 0
  const totalWithInvalid = monthlyConsult + monthlyInvalid
  
  return {
    daily_consult: summary.日咨询量 || 0,
    daily_visit: summary.日上门量 || 0,
    daily_enrolled: dailyEnrolled,
    daily_enrolled_short: dailyEnrolledShort,
    daily_enrolled_long: dailyEnrolledLong,
    daily_enrolled_3year: dailyEnrolled3Year,
    daily_enrolled_2year: dailyEnrolled2Year,
    daily_booked: 0,
    monthly_consult: monthlyConsult,
    monthly_visit: monthlyVisit,
    monthly_enrolled: monthlyEnrolled,
    monthly_enrolled_short: summary.月报名数_短期 || 0,
    monthly_enrolled_long: summary.月报名数_长期 || 0,
    monthly_enrolled_3year: summary.月报名数_学三 || 0,
    monthly_enrolled_2year: summary.月报名数_学二 || 0,
    monthly_booked: 0,
    monthly_refund: summary.月退费人数 || 0,
    monthly_invalid: monthlyInvalid,
    monthly_invalid_rate: totalWithInvalid > 0 ? (monthlyInvalid / totalWithInvalid * 100) : 0,
    refund_rate: monthlyEnrolled > 0 ? (summary.月退费人数 / monthlyEnrolled * 100) : 0,
    visit_rate: (summary.月电话上门转化率 || 0) * 100,
    enroll_rate: (summary.月度总转化率 || 0) * 100,
    face_enroll_rate: monthlyVisit > 0 ? (monthlyEnrolled / monthlyVisit * 100) : 0,
  }
}

const mapConsultantRow = (
  row: BackendConsultantStats,
  nameKey: 'consultant_name' | 'source_name' | 'provider_name' | 'staff_name'
): ConsultantSummary | MediaSourceSummary | ReputationProviderSummary | ChannelStaffSummary => {
  const base = {
    daily_consult: row.日咨询量 || 0,
    daily_visit: row.日上门量 || 0,
    daily_enrolled: row.日报名 || 0,
    daily_booked: row.订座 || 0,
    monthly_consult: row.月总咨询量 || 0,
    monthly_visit: row.月总上门量 || 0,
    monthly_enrolled: row.月总报名 || 0,
    monthly_booked: row.订座 || 0,
    monthly_refund: 0,
    visit_rate: (row.月上门率 || 0) * 100,
    enroll_rate: (row.月总转化率 || 0) * 100,
    face_enroll_rate: (row.月当面转化率 || 0) * 100,
  }
  
  switch (nameKey) {
    case 'consultant_name':
      return { ...base, consultant_name: row.咨询师 || '未分配' } as ConsultantSummary
    case 'source_name':
      return { ...base, source_name: row.咨询师 || '未分配' } as MediaSourceSummary
    case 'provider_name':
      return { ...base, provider_name: row.咨询师 || '未分配' } as ReputationProviderSummary
    case 'staff_name':
      return { ...base, staff_name: row.咨询师 || '未分配' } as ChannelStaffSummary
  }
}

const buildSection = (
  sectionType: string,
  backendSection?: BackendSectionData
): SectionData | null => {
  if (!backendSection) return null

  let nameKey: 'consultant_name' | 'source_name' | 'provider_name' | 'staff_name' = 'consultant_name'
  if (sectionType === 'network_sem' || sectionType === 'network_newmedia') {
    nameKey = 'consultant_name'
  } else if (sectionType === 'reputation') {
    nameKey = 'provider_name'
  } else if (sectionType === 'channel') {
    nameKey = 'staff_name'
  }

  return {
    section_type: sectionType,
    section_name: backendSection.section_name,
    data: backendSection.consultants.map((row) => mapConsultantRow(row, nameKey)),
    totals: toSectionTotals(backendSection.summary),
  }
}

const normalizeBackendResponse = (raw: BackendDailySummaryResponse): DailySummaryResponse => {
  const sectionsMap = raw.sections || {}

  const sectionPairs: Array<[string, string]> = [
    ['network_sem', '传统大搜'],
    ['network_newmedia', '新媒体'],
    ['reputation', '口碑'],
    ['channel', '渠道'],
    ['consultant', '咨询师汇总'],
  ]

  const sections: SectionData[] = sectionPairs
    .map(([type, key]) => buildSection(type, sectionsMap[key]))
    .filter((s): s is SectionData => Boolean(s))

  const allMonthlyConsult = Number(raw.grand_total?.['月咨询总量'] || 0)
  const allMonthlyVisit = Number(raw.grand_total?.['月总上门量'] || 0)
  const allMonthlyEnrolled = Number(raw.grand_total?.['月总报名数'] || 0)
  const allMonthlyBooked = Number(raw.grand_total?.['月总订座数'] || 0)

  const allTotals: SectionTotals = {
    daily_consult: 0,
    daily_visit: 0,
    daily_enrolled: 0,
    daily_enrolled_short: 0,
    daily_enrolled_long: 0,
    daily_enrolled_3year: 0,
    daily_enrolled_2year: 0,
    daily_booked: 0,
    monthly_consult: allMonthlyConsult,
    monthly_visit: allMonthlyVisit,
    monthly_enrolled: allMonthlyEnrolled,
    monthly_enrolled_short: 0,
    monthly_enrolled_long: 0,
    monthly_enrolled_3year: 0,
    monthly_enrolled_2year: 0,
    monthly_booked: allMonthlyBooked,
    monthly_refund: 0,
    monthly_invalid: 0,
    monthly_invalid_rate: 0,
    refund_rate: 0,
    visit_rate: allMonthlyConsult > 0 ? (allMonthlyVisit / allMonthlyConsult * 100) : 0,
    enroll_rate: allMonthlyConsult > 0 ? (allMonthlyEnrolled / allMonthlyConsult * 100) : 0,
    face_enroll_rate: allMonthlyVisit > 0 ? (allMonthlyEnrolled / allMonthlyVisit * 100) : 0,
  }

  const networkSemTotals = sectionsMap['传统大搜'] ? toSectionTotals(sectionsMap['传统大搜'].summary) : allTotals
  const networkNewTotals = sectionsMap['新媒体'] ? toSectionTotals(sectionsMap['新媒体'].summary) : allTotals
  const reputationTotals = sectionsMap['口碑'] ? toSectionTotals(sectionsMap['口碑'].summary) : allTotals
  const channelTotals = sectionsMap['渠道'] ? toSectionTotals(sectionsMap['渠道'].summary) : allTotals
  const consultantTotals = sectionsMap['咨询师汇总'] ? toSectionTotals(sectionsMap['咨询师汇总'].summary) : allTotals

  return {
    success: raw.success,
    date: raw.current_date,
    month_start: raw.month,
    campus: raw.campus,
    sections,
    grand_totals: {
      network_sem: networkSemTotals,
      network_newmedia: networkNewTotals,
      network_total: networkSemTotals,
      reputation: reputationTotals,
      reputation_newmedia: reputationTotals,
      channel: channelTotals,
      consultant: consultantTotals,
      all_total: allTotals,
    },
  }
}

/** 来源配置响应 */
export interface SourceConfigResponse {
  success: boolean
  traditional_sem_sources: string[]
  newmedia_sources: string[]
  source_to_category: Record<string, string>
}

/** 单区块响应 */
export interface SingleSectionResponse {
  success: boolean
  section: SectionData
}

// ==================== API 调用函数 ====================

/**
 * 获取每日咨询量汇总（完整数据）
 * @param date 查询日期，默认今天
 * @param campus 神殿，不传则返回所有神殿汇总
 */
export async function getDailySummary(
  date?: string,
  campus?: string
): Promise<DailySummaryResponse> {
  const params: Record<string, string> = {}
  if (date) params.date = date
  if (campus) params.campus = campus
  
  const response = await api.get<DailySummaryResponse | BackendDailySummaryResponse>(
    '/consult/consultation/daily-summary',
    { params }
  )
  const raw = response.data as any
  if (Array.isArray(raw?.sections)) {
    return raw as DailySummaryResponse
  }
  return normalizeBackendResponse(raw as BackendDailySummaryResponse)
}

/**
 * 获取指定区块数据
 * @param sectionType 区块类型：network_sem, network_newmedia, reputation, reputation_newmedia, channel, consultant, grand_total
 * @param date 查询日期
 * @param campus 神殿
 */
export async function getSectionData(
  sectionType: string,
  date?: string,
  campus?: string
): Promise<SingleSectionResponse> {
  const params: Record<string, string> = {}
  if (date) params.date = date
  if (campus) params.campus = campus
  
  const response = await api.get<SingleSectionResponse>(
    `/consult/consultation/daily-summary/section/${sectionType}`,
    { params }
  )
  return response.data
}

/**
 * 获取来源分类配置
 */
export async function getSourceConfig(): Promise<SourceConfigResponse> {
  const response = await api.get<SourceConfigResponse>(
    '/consult/consultation/source-config'
  )
  return response.data
}

// ==================== 分析规划师（咨询师）数据汇总 ====================

/** 分析规划师统计数据 */
export interface AnalystPlannerStats {
  分析规划师: string
  日咨询量: number
  日上门量: number
  日报名: number
  月总咨询量: number
  月总上门量: number
  月总报名: number
  月上门率: string
  月总转化率: string
  月当面转化率: string
  订座: number
}

/** 分析规划师汇总响应 */
export interface AnalystPlannerSummaryResponse {
  success: boolean
  campus: string
  month: string
  current_date: string
  analysts: AnalystPlannerStats[]
  total: AnalystPlannerStats
}

/**
 * 获取分析规划师（咨询师）数据汇总
 */
export async function getAnalystPlannerSummary(
  campus: string,
  targetDate?: string
): Promise<AnalystPlannerSummaryResponse> {
  const params: Record<string, string> = { campus }
  if (targetDate) params.target_date = targetDate
  
  const response = await api.get<AnalystPlannerSummaryResponse>(
    '/consult/consultation/analyst-planner-summary',
    { params }
  )
  return response.data
}

// ==================== 来源分区子表（汇总+分析规划师明细） ====================

/** 来源分区汇总数据 */
export interface SourceSectionSummary {
  月咨询总量: number
  月总上门量: number
  月报名数_短期: number
  月报名数_长期: number
  月报名数_学三: number
  月报名数_学二: number
  月报名数_合计: number
  月无效量数量: number
  月无效率: string
  月电话上门转化率: string
  月度总转化率: string
  月退费人数: number
  月退费率: string
  日咨询量: number
  日上门量: number
  日报名数_短期: number
  日报名数_长期: number
  日报名数_学三: number
  日报名数_学二: number
}

/** 来源分区完整响应 */
export interface SourceSectionResponse {
  success: boolean
  campus: string
  month: string
  current_date: string
  section_name: string
  summary: SourceSectionSummary
  analysts: AnalystPlannerStats[]
  total: AnalystPlannerStats
}

/**
 * 获取传统大搜子表数据（汇总+分析规划师明细）
 */
export async function getTraditionalSearchSummary(
  campus: string,
  targetDate?: string
): Promise<SourceSectionResponse> {
  const params: Record<string, string> = { campus }
  if (targetDate) params.target_date = targetDate
  
  const response = await api.get<SourceSectionResponse>(
    '/consult/consultation/traditional-search-summary',
    { params }
  )
  return response.data
}

/**
 * 获取新媒体子表数据（汇总+分析规划师明细）
 */
export async function getNewmediaSummary(
  campus: string,
  targetDate?: string
): Promise<SourceSectionResponse> {
  const params: Record<string, string> = { campus }
  if (targetDate) params.target_date = targetDate
  
  const response = await api.get<SourceSectionResponse>(
    '/consult/consultation/newmedia-summary',
    { params }
  )
  return response.data
}

// ==================== 口碑子表（按口碑提供人分组） ====================

/** 口碑提供人统计数据 */
export interface ReputationProviderStats {
  口碑来源: string
  日口碑量: number
  日上门量: number
  日报名: number
  月口碑量: number
  月上门量: number
  月报名量: number
  月上门率: string
  月总转化率: string
  月当面转化率: string
  订座: number
}

/** 口碑子表响应 */
export interface ReputationSummaryResponse {
  success: boolean
  campus: string
  month: string
  current_date: string
  section_name: string
  summary: SourceSectionSummary
  providers: ReputationProviderStats[]
  total: ReputationProviderStats
}

/**
 * 获取口碑子表数据（汇总+口碑提供人明细）
 */
export async function getReputationSummary(
  campus: string,
  targetDate?: string
): Promise<ReputationSummaryResponse> {
  const params: Record<string, string> = { campus }
  if (targetDate) params.target_date = targetDate
  
  const response = await api.get<ReputationSummaryResponse>(
    '/consult/consultation/reputation-summary',
    { params }
  )
  return response.data
}

// ==================== 口碑咨询师分配子表 ====================

/** 口碑咨询师分配统计数据 */
export interface ReputationConsultantStats {
  分析规划师: string
  日口碑量: number
  日上门量: number
  日报名: number
  月口碑量: number
  月上门量: number
  月报名量: number
  月上门率: string
  月总转化率: string
  月当面转化率: string
  订座: number
}

/** 口碑咨询师分配子表响应 */
export interface ReputationConsultantSummaryResponse {
  success: boolean
  campus: string
  month: string
  current_date: string
  section_name: string
  consultants: ReputationConsultantStats[]
  total: ReputationConsultantStats
}

/**
 * 获取口碑咨询师分配子表数据
 */
export async function getReputationConsultantSummary(
  campus: string,
  targetDate?: string
): Promise<ReputationConsultantSummaryResponse> {
  const params: Record<string, string> = { campus }
  if (targetDate) params.target_date = targetDate
  
  const response = await api.get<ReputationConsultantSummaryResponse>(
    '/consult/consultation/reputation-consultant-summary',
    { params }
  )
  return response.data
}

// ==================== 辅助函数 ====================

/**
 * 格式化百分比
 */
export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

/**
 * 计算率值
 */
export function calcRate(numerator: number, denominator: number): number {
  if (denominator === 0) return 0
  return (numerator / denominator) * 100
}

// ==================== 神殿新媒体子表 ====================

/** 神殿新媒体介绍人统计数据 */
export interface CampusNewMediaReferrerStats {
  新媒体介绍人: string
  日提供量: number
  日上门量: number
  日报名: number
  总提供量: number
  总上门量: number
  总报名: number
  总转化率: string
  当面转化率: string
  订座: number
}

/** 神殿新媒体咨询师分配统计数据 */
export interface CampusNewMediaConsultantStats {
  分析规划师: string
  日咨询量: number
  日上门量: number
  日报名: number
  总咨询量: number
  总上门量: number
  总报名: number
  总转化率: string
  当面转化率: string
  订座: number
}

/** 神殿新媒体子表响应 */
export interface CampusNewMediaSummaryResponse {
  success: boolean
  campus: string
  month: string
  current_date: string
  section_name: string
  summary: {
    月咨询总量: number
    日咨询量: number
    月总上门量: number
    日上门量: number
    月报名数: string
    日报报名量: string
  }
  referrers: CampusNewMediaReferrerStats[]
  referrer_total: CampusNewMediaReferrerStats
  consultants: CampusNewMediaConsultantStats[]
  consultant_total: CampusNewMediaConsultantStats
}

/**
 * 获取神殿新媒体子表数据
 */
export async function getCampusNewMediaSummary(
  campus: string,
  targetDate?: string
): Promise<CampusNewMediaSummaryResponse> {
  const params: Record<string, string> = { campus }
  if (targetDate) params.target_date = targetDate
  
  const response = await api.get<CampusNewMediaSummaryResponse>(
    '/consult/consultation/campus-newmedia-summary',
    { params }
  )
  return response.data
}

// ==================== 渠道子表 ====================

/** 渠道代理统计数据 */
export interface ChannelAgentStats {
  渠道代理: string
  日信息量: number
  日上门量: number
  日报名: number
  月信息量: number
  月上门量: number
  月报名量: number
  月上门率: string
  月总转化率: string
  月当面转化率: string
  订座: number
}

/** 渠道量咨询老师分配统计数据 */
export interface ChannelConsultantStats {
  分析规划师: string
  日信息量: number
  日上门量: number
  日报名: number
  月信息量: number
  月上门量: number
  月报名量: number
  月上门率: string
  月总转化率: string
  月当面转化率: string
  订座: number
}

/** 渠道子表汇总 */
export interface ChannelSummary {
  '渠道-月咨询总量': number
  月总上门量: number
  月报名数: string
  日咨询量: number
  日上门量: number
  日报报名量: string
  月电话总上门转化率: string
  月度总转化率: string
  月退费人数: number
  月退费率: string
}

/** 渠道子表响应 */
export interface ChannelSummaryResponse {
  success: boolean
  campus: string
  month: string
  current_date: string
  section_name: string
  summary: ChannelSummary
  agents: ChannelAgentStats[]
  agent_total: ChannelAgentStats
  consultants: ChannelConsultantStats[]
  consultant_total: ChannelConsultantStats
}

/**
 * 获取渠道子表数据
 */
export async function getChannelSummary(
  campus: string,
  targetDate?: string
): Promise<ChannelSummaryResponse> {
  const params: Record<string, string> = { campus }
  if (targetDate) params.target_date = targetDate
  
  const response = await api.get<ChannelSummaryResponse>(
    '/consult/consultation/channel-summary',
    { params }
  )
  return response.data
}


// ==================== 全来源咨询师汇总子表（传统大搜+新媒体+口碑+渠道） ====================

/** 全来源咨询师统计数据 */
export interface AllSourceConsultantStats {
  分析规划师: string
  日咨询量: number
  日上门量: number
  日报名: number
  总咨询量: number
  总上门量: number
  总报名: number
  总上门率: string
  总转化率: string
  当面转化率: string
  订座: number
}

/** 全来源咨询师汇总响应 */
export interface AllSourceConsultantSummaryResponse {
  success: boolean
  campus: string
  month: string
  current_date: string
  section_name: string
  consultants: AllSourceConsultantStats[]
  consultant_total: AllSourceConsultantStats
}

/**
 * 获取全来源咨询师汇总数据（传统大搜+新媒体+口碑+渠道）
 */
export async function getAllSourceConsultantSummary(
  campus: string,
  targetDate?: string
): Promise<AllSourceConsultantSummaryResponse> {
  const params: Record<string, string> = { campus }
  if (targetDate) params.target_date = targetDate
  
  const response = await api.get<AllSourceConsultantSummaryResponse>(
    '/consult/consultation/all-source-consultant-summary',
    { params }
  )
  return response.data
}
