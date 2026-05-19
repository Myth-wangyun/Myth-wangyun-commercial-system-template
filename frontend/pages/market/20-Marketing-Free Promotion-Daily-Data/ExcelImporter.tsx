import React, { useState } from 'react'
import { Upload, Button, App, Modal, Table, Tabs, Tag } from 'antd'
import { UploadOutlined, FileExcelOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import type { UploadFile } from 'antd/es/upload/interface'
import * as XLSX from 'xlsx'
import dayjs from 'dayjs'

interface ExcelImporterProps {
  campusId: string
  campusName: string
  onImportSuccess: (data: ImportedData) => void
}

// ==================== 数据类型定义 ====================

export interface ImportedData {
  month: string // YYYY-MM格式
  // 数据看板
  summaryData: SummaryDailyData[]
  socialMediaData: SocialMediaDailyData[]
  qaData: QADailyData[]
  classifiedData: ClassifiedDailyData[]
  mapData: MapDailyData[]
  wechatData: WechatDailyData[]
  videoData: VideoDailyData[]
  // 登记明细
  socialMediaRegister: RegisterDetailData[]
  qaRegister: RegisterDetailData[]
  classifiedRegister: RegisterDetailData[]
  wechatRegister: RegisterDetailData[]
  videoRegister: RegisterDetailData[]
}

// 汇总数据（总表）
export interface SummaryDailyData {
  date: string
  actualIncome: number
  signupConversionRate: number | null
  refundCount: number
  netSignup: number
  grossTotal: number
  orderCount: number
  visitCount: number
  consultCount: number
  consultCost: number | null
  consumption: number
}

// 社交新媒体数据看板
export interface SocialMediaDailyData {
  date: string
  actualIncome: number
  refundCount: number
  netSignup: number
  grossTotal: number
  orderCount: number
  visitCount: number
  consultCount: number
  consumption: number
  // 抖音数据
  douyinValidCount: number
  douyinPlayCount: number
  douyinLikeCount: number
  douyinCommentCount: number
  douyinShareCount: number
  douyinCollectCount: number
  douyinConsultCount: number
  douyinCompletionRate: number | null
  douyin2sExitRate: number | null
  douyinAvgViewTime: number | null
  douyin5sCompletionRate: number | null
  douyinAvgPlayRate: number | null
  douyinLikeRate: number | null
  douyinCommentRate: number | null
  douyinShareRate: number | null
  douyinCollectRate: number | null
  douyinNotInterestedRate: number | null
  // 快手数据
  kuaishouValidCount: number
  kuaishouLoveScore: number | null
  kuaishouQuality: number | null
  kuaishouTitleQuality: number | null
  kuaishouConsultCount: number
  kuaishouPlayCount: number
  kuaishouAvgPlayTime: number | null
  kuaishouCoverClickRate: number | null
  kuaishou2sExitRate: number | null
  kuaishou5sCompletionRate: number | null
  kuaishouCompletionRate: number | null
  kuaishouLikeCount: number
  kuaishouCommentCount: number
  kuaishouShareCount: number
  kuaishouCollectCount: number
  kuaishouFansGrowth: number
}

// 问答数据看板
export interface QADailyData {
  date: string
  actualIncome: number
  refundCount: number
  netSignup: number
  grossTotal: number
  orderCount: number
  visitCount: number
  consultCount: number
  consumption: number
  // 百度知道
  baiduValidCount: number
  baiduViewCount: number
  baiduLikeCount: number
  baiduValidNumber: number
  baiduConsultCount: number
  // 知乎
  zhihuValidCount: number
  zhihuViewCount: number
  zhihuLikeCount: number
  zhihuValidNumber: number
  zhihuConsultCount: number
}

// 分类信息数据看板
export interface ClassifiedDailyData {
  date: string
  actualIncome: number
  refundCount: number
  netEnrollment: number
  grossEnrollment: number
  reservationCount: number
  visitCount: number
  consultationCount: number
  expense: number
  // 58同城
  city58ValidCount: number
  city58ViewCount: number
  city58ConsultCount: number
  // 百姓网
  baixingValidCount: number
  baixingViewCount: number
  baixingConsultCount: number
  // 赶集网
  ganjiValidCount: number
  ganjiViewCount: number
  ganjiConsultCount: number
}

// 地图数据看板
export interface MapDailyData {
  date: string
  actualIncome: number
  refundCount: number
  netEnrollment: number
  grossEnrollment: number
  reservationCount: number
  visitCount: number
  mapTotal: number
  mapExpense: number
  // 高德
  gaodeValidCount: number
  gaodeViewCount: number
  gaodeConsultCount: number
  // 百度地图
  baiduMapValidCount: number
  baiduMapViewCount: number
  baiduMapConsultCount: number
  // 腾讯地图
  tencentMapValidCount: number
  tencentMapViewCount: number
  tencentMapConsultCount: number
}

// 微信平台数据看板
export interface WechatDailyData {
  date: string
  actualIncome: number
  refundCount: number
  netEnrollment: number
  grossEnrollment: number
  reservationCount: number
  visitCount: number
  videoTotal: number
  expense: number
  // 公众号
  gongzhonghaoValidCount: number
  gongzhonghaoViewCount: number
  gongzhonghaoConsultCount: number
  // 视频号
  shipinhaoValidCount: number
  shipinhaoViewCount: number
  shipinhaoConsultCount: number
  // 小程序
  xiaochengxuValidCount: number
  xiaochengxuViewCount: number
  xiaochengxuConsultCount: number
}

// 视频数据看板
export interface VideoDailyData {
  date: string
  actualIncome: number
  refundCount: number
  netEnrollment: number
  grossEnrollment: number
  reservationCount: number
  visitCount: number
  videoTotal: number
  expense: number
  // B站
  bilibiliValidCount: number
  bilibiliViewCount: number
  bilibiliConsultCount: number
  // 西瓜视频
  xiguaValidCount: number
  xiguaViewCount: number
  xiguaConsultCount: number
  // 好看视频
  haokanValidCount: number
  haokanViewCount: number
  haokanConsultCount: number
}

// 登记明细数据
export interface RegisterDetailData {
  date: string
  platform: string
  coverageGroup: string
  topic: string
  videoName: string
  duration: number
  videoLink: string
  validCount: number
  notes: string
}

// Sheet解析结果
interface SheetParseResult {
  sheetName: string
  sheetType: 'summary' | 'socialMedia' | 'qa' | 'classified' | 'map' | 'wechat' | 'video' | 
             'socialMediaRegister' | 'qaRegister' | 'classifiedRegister' | 'wechatRegister' | 'videoRegister' | 'unknown'
  dataCount: number
  success: boolean
  error?: string
}

const ExcelImporter: React.FC<ExcelImporterProps> = ({ campusId, campusName, onImportSuccess }) => {
  const [uploading, setUploading] = useState(false)
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [previewVisible, setPreviewVisible] = useState(false)
  const [parseResults, setParseResults] = useState<SheetParseResult[]>([])
  const [importedData, setImportedData] = useState<ImportedData | null>(null)
  const { message } = App.useApp()

  // ==================== 辅助函数 ====================

  // 解析日期列（支持多种格式）
  const parseDate = (dateValue: any, yearHint: number): string | null => {
    if (!dateValue) return null

    // 如果是Excel日期序列号
    if (typeof dateValue === 'number') {
      try {
        const date = XLSX.SSF.parse_date_code(dateValue)
        if (date && date.y && date.m && date.d) {
          return dayjs(`${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`).format('YYYY-MM-DD')
        }
      } catch (e) {
        console.warn('解析Excel日期序列号失败:', dateValue)
      }
    }

    // 如果是字符串格式的日期
    if (typeof dateValue === 'string') {
      const dateStr = dateValue.trim()
      
      // 匹配 "10月18日" 或 "10月1日" 格式
      const match1 = dateStr.match(/(\d{1,2})月(\d{1,2})日/)
      if (match1) {
        const month = parseInt(match1[1])
        const day = parseInt(match1[2])
        return dayjs(`${yearHint}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`).format('YYYY-MM-DD')
      }

      // 匹配 "2025-10-18" 格式
      const match2 = dateStr.match(/(\d{4})-(\d{1,2})-(\d{1,2})/)
      if (match2) {
        return dayjs(dateStr).format('YYYY-MM-DD')
      }

      // 匹配 "2025/10/18" 格式
      const match3 = dateStr.match(/(\d{4})\/(\d{1,2})\/(\d{1,2})/)
      if (match3) {
        return dayjs(dateStr.replace(/\//g, '-')).format('YYYY-MM-DD')
      }

      // 尝试直接解析
      const parsed = dayjs(dateStr)
      if (parsed.isValid()) {
        return parsed.format('YYYY-MM-DD')
      }
    }

    return null
  }

  // 解析数值（处理空值、#DIV/0!、百分比等）
  const parseNumber = (value: any): number => {
    if (value === null || value === undefined || value === '') return 0
    if (typeof value === 'number') return isNaN(value) ? 0 : value
    if (typeof value === 'string') {
      // 跳过错误值
      if (value.includes('#DIV') || value.includes('#VALUE') || value.includes('#REF')) return 0
      // 移除货币符号、百分号和其他非数字字符（保留小数点和负号）
      const cleaned = value.replace(/[^\d.-]/g, '')
      const num = parseFloat(cleaned)
      return isNaN(num) ? 0 : num
    }
    return 0
  }

  // 解析百分比（可能为 null）
  const parsePercentage = (value: any): number | null => {
    if (value === null || value === undefined || value === '') return null
    if (typeof value === 'string' && (value.includes('#DIV') || value.includes('#VALUE'))) return null
    const num = parseNumber(value)
    return num === 0 ? null : num
  }

  // 识别sheet类型
  const identifySheetType = (sheetName: string): SheetParseResult['sheetType'] => {
    const name = sheetName.toLowerCase()
    
    // 汇总
    if (name.includes('汇总') || name.includes('总表')) return 'summary'
    
    // 数据看板 - 登记判断要在前面
    if (name.includes('登记') || name.includes('明细')) {
      if (name.includes('社交') || name.includes('新媒体') || name.includes('01')) return 'socialMediaRegister'
      if (name.includes('问答') || name.includes('02')) return 'qaRegister'
      if (name.includes('分类') || name.includes('03')) return 'classifiedRegister'
      if (name.includes('微信') || name.includes('05')) return 'wechatRegister'
      if (name.includes('视频') || name.includes('06')) return 'videoRegister'
    }
    
    // 数据看板
    if (name.includes('社交') || name.includes('新媒体') || (name.includes('01') && !name.includes('登记'))) return 'socialMedia'
    if (name.includes('问答') || (name.includes('02') && !name.includes('登记'))) return 'qa'
    if (name.includes('分类') || (name.includes('03') && !name.includes('登记'))) return 'classified'
    if (name.includes('地图') || (name.includes('04') && !name.includes('登记'))) return 'map'
    if (name.includes('微信') || (name.includes('05') && !name.includes('登记'))) return 'wechat'
    if (name.includes('视频') || (name.includes('06') && !name.includes('登记'))) return 'video'
    
    return 'unknown'
  }

  // 找到数据起始行（跳过标题行）
  const findDataStartRow = (worksheet: XLSX.WorkSheet): number => {
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
    
    // 查找"汇总"或日期数据开始的行
    for (let row = 0; row <= Math.min(range.e.r, 10); row++) {
      const cellA = worksheet[XLSX.utils.encode_cell({ r: row, c: 0 })]
      const cellB = worksheet[XLSX.utils.encode_cell({ r: row, c: 1 })]
      
      // 如果A列是星期，B列是日期，说明这是数据行（可能是汇总行）
      if (cellA?.v && String(cellA.v).includes('星期')) {
        return row
      }
      // 如果B列包含"汇总"
      if (cellB?.v && String(cellB.v).includes('汇总')) {
        return row
      }
    }
    
    return 2 // 默认从第3行开始（0-indexed）
  }

  // ==================== Sheet解析函数 ====================

  // 解析社交新媒体数据看板
  const parseSocialMediaSheet = (worksheet: XLSX.WorkSheet, yearHint: number): SocialMediaDailyData[] => {
    const data: SocialMediaDailyData[] = []
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
    const startRow = findDataStartRow(worksheet)
    
    for (let row = startRow; row <= range.e.r; row++) {
      const weekdayCell = worksheet[XLSX.utils.encode_cell({ r: row, c: 0 })] // A列：星期
      const dateCell = worksheet[XLSX.utils.encode_cell({ r: row, c: 1 })] // B列：发布日期
      
      // 跳过空行
      if (!dateCell?.v && !weekdayCell?.v) continue
      
      // 跳过汇总行
      const cellValue = String(dateCell?.v || weekdayCell?.v || '')
      if (cellValue.includes('汇总')) continue
      
      const date = parseDate(dateCell?.v, yearHint)
      if (!date) continue

      const rowData: SocialMediaDailyData = {
        date,
        // C-L列：社交化新媒体-汇总数据
        actualIncome: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 2 })]?.v),
        refundCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 4 })]?.v),
        netSignup: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 5 })]?.v),
        grossTotal: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 6 })]?.v),
        orderCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 7 })]?.v),
        visitCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 8 })]?.v),
        consultCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 9 })]?.v),
        consumption: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 11 })]?.v),
        // M-S列：抖音-总览
        douyinValidCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 12 })]?.v),
        douyinPlayCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 13 })]?.v),
        douyinLikeCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 14 })]?.v),
        douyinCommentCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 15 })]?.v),
        douyinShareCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 16 })]?.v),
        douyinCollectCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 17 })]?.v),
        douyinConsultCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 18 })]?.v),
        // T-X列：抖音-内容吸引力
        douyinCompletionRate: parsePercentage(worksheet[XLSX.utils.encode_cell({ r: row, c: 19 })]?.v),
        douyin2sExitRate: parsePercentage(worksheet[XLSX.utils.encode_cell({ r: row, c: 20 })]?.v),
        douyinAvgViewTime: parsePercentage(worksheet[XLSX.utils.encode_cell({ r: row, c: 21 })]?.v),
        douyin5sCompletionRate: parsePercentage(worksheet[XLSX.utils.encode_cell({ r: row, c: 22 })]?.v),
        douyinAvgPlayRate: parsePercentage(worksheet[XLSX.utils.encode_cell({ r: row, c: 23 })]?.v),
        // Y-AC列：抖音-观众参与度
        douyinLikeRate: parsePercentage(worksheet[XLSX.utils.encode_cell({ r: row, c: 24 })]?.v),
        douyinCommentRate: parsePercentage(worksheet[XLSX.utils.encode_cell({ r: row, c: 25 })]?.v),
        douyinShareRate: parsePercentage(worksheet[XLSX.utils.encode_cell({ r: row, c: 26 })]?.v),
        douyinCollectRate: parsePercentage(worksheet[XLSX.utils.encode_cell({ r: row, c: 27 })]?.v),
        douyinNotInterestedRate: parsePercentage(worksheet[XLSX.utils.encode_cell({ r: row, c: 28 })]?.v),
        // AD-AH列：快手-喜爱分诊断
        kuaishouValidCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 29 })]?.v),
        kuaishouLoveScore: parsePercentage(worksheet[XLSX.utils.encode_cell({ r: row, c: 30 })]?.v),
        kuaishouQuality: parsePercentage(worksheet[XLSX.utils.encode_cell({ r: row, c: 31 })]?.v),
        kuaishouTitleQuality: parsePercentage(worksheet[XLSX.utils.encode_cell({ r: row, c: 32 })]?.v),
        kuaishouConsultCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 33 })]?.v),
        // AI-AN列：快手-播放数据
        kuaishouPlayCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 34 })]?.v),
        kuaishouAvgPlayTime: parsePercentage(worksheet[XLSX.utils.encode_cell({ r: row, c: 35 })]?.v),
        kuaishouCoverClickRate: parsePercentage(worksheet[XLSX.utils.encode_cell({ r: row, c: 36 })]?.v),
        kuaishou2sExitRate: parsePercentage(worksheet[XLSX.utils.encode_cell({ r: row, c: 37 })]?.v),
        kuaishou5sCompletionRate: parsePercentage(worksheet[XLSX.utils.encode_cell({ r: row, c: 38 })]?.v),
        kuaishouCompletionRate: parsePercentage(worksheet[XLSX.utils.encode_cell({ r: row, c: 39 })]?.v),
        // AO-AS列：快手-互动效果
        kuaishouLikeCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 40 })]?.v),
        kuaishouCommentCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 41 })]?.v),
        kuaishouShareCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 42 })]?.v),
        kuaishouCollectCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 43 })]?.v),
        kuaishouFansGrowth: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 44 })]?.v),
      }

      data.push(rowData)
    }

    return data
  }

  // 解析问答数据看板
  const parseQASheet = (worksheet: XLSX.WorkSheet, yearHint: number): QADailyData[] => {
    const data: QADailyData[] = []
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
    const startRow = findDataStartRow(worksheet)
    
    for (let row = startRow; row <= range.e.r; row++) {
      const weekdayCell = worksheet[XLSX.utils.encode_cell({ r: row, c: 0 })]
      const dateCell = worksheet[XLSX.utils.encode_cell({ r: row, c: 1 })]
      
      if (!dateCell?.v && !weekdayCell?.v) continue
      const cellValue = String(dateCell?.v || weekdayCell?.v || '')
      if (cellValue.includes('汇总')) continue
      
      const date = parseDate(dateCell?.v, yearHint)
      if (!date) continue

      const rowData: QADailyData = {
        date,
        actualIncome: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 2 })]?.v),
        refundCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 4 })]?.v),
        netSignup: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 5 })]?.v),
        grossTotal: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 6 })]?.v),
        orderCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 7 })]?.v),
        visitCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 8 })]?.v),
        consultCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 9 })]?.v),
        consumption: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 11 })]?.v),
        // 百度知道
        baiduValidCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 12 })]?.v),
        baiduViewCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 13 })]?.v),
        baiduLikeCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 14 })]?.v),
        baiduValidNumber: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 15 })]?.v),
        baiduConsultCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 16 })]?.v),
        // 知乎
        zhihuValidCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 17 })]?.v),
        zhihuViewCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 18 })]?.v),
        zhihuLikeCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 19 })]?.v),
        zhihuValidNumber: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 20 })]?.v),
        zhihuConsultCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 21 })]?.v),
      }

      data.push(rowData)
    }

    return data
  }

  // 解析分类信息数据看板
  const parseClassifiedSheet = (worksheet: XLSX.WorkSheet, yearHint: number): ClassifiedDailyData[] => {
    const data: ClassifiedDailyData[] = []
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
    const startRow = findDataStartRow(worksheet)
    
    for (let row = startRow; row <= range.e.r; row++) {
      const weekdayCell = worksheet[XLSX.utils.encode_cell({ r: row, c: 0 })]
      const dateCell = worksheet[XLSX.utils.encode_cell({ r: row, c: 1 })]
      
      if (!dateCell?.v && !weekdayCell?.v) continue
      const cellValue = String(dateCell?.v || weekdayCell?.v || '')
      if (cellValue.includes('汇总')) continue
      
      const date = parseDate(dateCell?.v, yearHint)
      if (!date) continue

      const rowData: ClassifiedDailyData = {
        date,
        actualIncome: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 2 })]?.v),
        refundCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 4 })]?.v),
        netEnrollment: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 5 })]?.v),
        grossEnrollment: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 6 })]?.v),
        reservationCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 7 })]?.v),
        visitCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 8 })]?.v),
        consultationCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 9 })]?.v),
        expense: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 11 })]?.v),
        // 58同城
        city58ValidCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 12 })]?.v),
        city58ViewCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 13 })]?.v),
        city58ConsultCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 14 })]?.v),
        // 百姓网
        baixingValidCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 15 })]?.v),
        baixingViewCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 16 })]?.v),
        baixingConsultCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 17 })]?.v),
        // 赶集网
        ganjiValidCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 18 })]?.v),
        ganjiViewCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 19 })]?.v),
        ganjiConsultCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 20 })]?.v),
      }

      data.push(rowData)
    }

    return data
  }

  // 解析地图数据看板
  const parseMapSheet = (worksheet: XLSX.WorkSheet, yearHint: number): MapDailyData[] => {
    const data: MapDailyData[] = []
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
    const startRow = findDataStartRow(worksheet)
    
    for (let row = startRow; row <= range.e.r; row++) {
      const weekdayCell = worksheet[XLSX.utils.encode_cell({ r: row, c: 0 })]
      const dateCell = worksheet[XLSX.utils.encode_cell({ r: row, c: 1 })]
      
      if (!dateCell?.v && !weekdayCell?.v) continue
      const cellValue = String(dateCell?.v || weekdayCell?.v || '')
      if (cellValue.includes('汇总')) continue
      
      const date = parseDate(dateCell?.v, yearHint)
      if (!date) continue

      const rowData: MapDailyData = {
        date,
        actualIncome: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 2 })]?.v),
        refundCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 4 })]?.v),
        netEnrollment: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 5 })]?.v),
        grossEnrollment: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 6 })]?.v),
        reservationCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 7 })]?.v),
        visitCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 8 })]?.v),
        mapTotal: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 9 })]?.v),
        mapExpense: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 11 })]?.v),
        // 高德
        gaodeValidCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 12 })]?.v),
        gaodeViewCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 13 })]?.v),
        gaodeConsultCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 14 })]?.v),
        // 百度地图
        baiduMapValidCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 15 })]?.v),
        baiduMapViewCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 16 })]?.v),
        baiduMapConsultCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 17 })]?.v),
        // 腾讯地图
        tencentMapValidCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 18 })]?.v),
        tencentMapViewCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 19 })]?.v),
        tencentMapConsultCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 20 })]?.v),
      }

      data.push(rowData)
    }

    return data
  }

  // 解析微信平台数据看板
  const parseWechatSheet = (worksheet: XLSX.WorkSheet, yearHint: number): WechatDailyData[] => {
    const data: WechatDailyData[] = []
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
    const startRow = findDataStartRow(worksheet)
    
    for (let row = startRow; row <= range.e.r; row++) {
      const weekdayCell = worksheet[XLSX.utils.encode_cell({ r: row, c: 0 })]
      const dateCell = worksheet[XLSX.utils.encode_cell({ r: row, c: 1 })]
      
      if (!dateCell?.v && !weekdayCell?.v) continue
      const cellValue = String(dateCell?.v || weekdayCell?.v || '')
      if (cellValue.includes('汇总')) continue
      
      const date = parseDate(dateCell?.v, yearHint)
      if (!date) continue

      const rowData: WechatDailyData = {
        date,
        actualIncome: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 2 })]?.v),
        refundCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 4 })]?.v),
        netEnrollment: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 5 })]?.v),
        grossEnrollment: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 6 })]?.v),
        reservationCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 7 })]?.v),
        visitCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 8 })]?.v),
        videoTotal: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 9 })]?.v),
        expense: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 11 })]?.v),
        // 公众号
        gongzhonghaoValidCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 12 })]?.v),
        gongzhonghaoViewCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 13 })]?.v),
        gongzhonghaoConsultCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 14 })]?.v),
        // 视频号
        shipinhaoValidCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 15 })]?.v),
        shipinhaoViewCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 16 })]?.v),
        shipinhaoConsultCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 17 })]?.v),
        // 小程序
        xiaochengxuValidCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 18 })]?.v),
        xiaochengxuViewCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 19 })]?.v),
        xiaochengxuConsultCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 20 })]?.v),
      }

      data.push(rowData)
    }

    return data
  }

  // 解析视频数据看板
  const parseVideoSheet = (worksheet: XLSX.WorkSheet, yearHint: number): VideoDailyData[] => {
    const data: VideoDailyData[] = []
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
    const startRow = findDataStartRow(worksheet)
    
    for (let row = startRow; row <= range.e.r; row++) {
      const weekdayCell = worksheet[XLSX.utils.encode_cell({ r: row, c: 0 })]
      const dateCell = worksheet[XLSX.utils.encode_cell({ r: row, c: 1 })]
      
      if (!dateCell?.v && !weekdayCell?.v) continue
      const cellValue = String(dateCell?.v || weekdayCell?.v || '')
      if (cellValue.includes('汇总')) continue
      
      const date = parseDate(dateCell?.v, yearHint)
      if (!date) continue

      const rowData: VideoDailyData = {
        date,
        actualIncome: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 2 })]?.v),
        refundCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 4 })]?.v),
        netEnrollment: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 5 })]?.v),
        grossEnrollment: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 6 })]?.v),
        reservationCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 7 })]?.v),
        visitCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 8 })]?.v),
        videoTotal: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 9 })]?.v),
        expense: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 11 })]?.v),
        // B站
        bilibiliValidCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 12 })]?.v),
        bilibiliViewCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 13 })]?.v),
        bilibiliConsultCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 14 })]?.v),
        // 西瓜视频
        xiguaValidCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 15 })]?.v),
        xiguaViewCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 16 })]?.v),
        xiguaConsultCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 17 })]?.v),
        // 好看视频
        haokanValidCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 18 })]?.v),
        haokanViewCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 19 })]?.v),
        haokanConsultCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 20 })]?.v),
      }

      data.push(rowData)
    }

    return data
  }

  // 解析汇总sheet
  const parseSummarySheet = (worksheet: XLSX.WorkSheet, yearHint: number): SummaryDailyData[] => {
    const data: SummaryDailyData[] = []
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
    const startRow = findDataStartRow(worksheet)
    
    for (let row = startRow; row <= range.e.r; row++) {
      const weekdayCell = worksheet[XLSX.utils.encode_cell({ r: row, c: 0 })]
      const dateCell = worksheet[XLSX.utils.encode_cell({ r: row, c: 1 })]
      
      if (!dateCell?.v && !weekdayCell?.v) continue
      const cellValue = String(dateCell?.v || weekdayCell?.v || '')
      if (cellValue.includes('汇总')) continue
      
      const date = parseDate(dateCell?.v, yearHint)
      if (!date) continue

      const rowData: SummaryDailyData = {
        date,
        actualIncome: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 2 })]?.v),
        signupConversionRate: parsePercentage(worksheet[XLSX.utils.encode_cell({ r: row, c: 3 })]?.v),
        refundCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 4 })]?.v),
        netSignup: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 5 })]?.v),
        grossTotal: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 6 })]?.v),
        orderCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 7 })]?.v),
        visitCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 8 })]?.v),
        consultCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 9 })]?.v),
        consultCost: parsePercentage(worksheet[XLSX.utils.encode_cell({ r: row, c: 10 })]?.v),
        consumption: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 11 })]?.v),
      }

      data.push(rowData)
    }

    return data
  }

  // 解析登记明细sheet
  const parseRegisterSheet = (worksheet: XLSX.WorkSheet, yearHint: number): RegisterDetailData[] => {
    const data: RegisterDetailData[] = []
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
    
    // 登记明细通常从第4行开始（前3行是标题）
    for (let row = 3; row <= range.e.r; row++) {
      const seqCell = worksheet[XLSX.utils.encode_cell({ r: row, c: 0 })] // A列：序号
      const dateCell = worksheet[XLSX.utils.encode_cell({ r: row, c: 1 })] // B列：日期
      
      // 跳过空行
      if (!seqCell?.v && !dateCell?.v) continue
      
      const date = parseDate(dateCell?.v, yearHint)
      if (!date) continue

      const rowData: RegisterDetailData = {
        date,
        platform: String(worksheet[XLSX.utils.encode_cell({ r: row, c: 2 })]?.v || ''),
        coverageGroup: String(worksheet[XLSX.utils.encode_cell({ r: row, c: 3 })]?.v || ''),
        topic: String(worksheet[XLSX.utils.encode_cell({ r: row, c: 4 })]?.v || ''),
        videoName: String(worksheet[XLSX.utils.encode_cell({ r: row, c: 5 })]?.v || ''),
        duration: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 6 })]?.v),
        videoLink: String(worksheet[XLSX.utils.encode_cell({ r: row, c: 7 })]?.v || ''),
        validCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 8 })]?.v),
        notes: String(worksheet[XLSX.utils.encode_cell({ r: row, c: 9 })]?.v || ''),
      }

      data.push(rowData)
    }

    return data
  }

  // ==================== 主处理逻辑 ====================

  // 处理Excel文件
  const handleFileUpload = async (file: File) => {
    if (!campusId) {
      message.error('请先选择神殿')
      return false
    }

    setUploading(true)

    try {
      console.log('开始解析Excel文件:', file.name)
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: 'array' })

      console.log('Excel Sheet列表:', workbook.SheetNames)

      // 推断年份
      let yearHint = dayjs().year()
      const fileNameMatch = file.name.match(/(\d{4})/)
      if (fileNameMatch) {
        yearHint = parseInt(fileNameMatch[1])
      }

      // 初始化导入数据
      const data: ImportedData = {
        month: '',
        summaryData: [],
        socialMediaData: [],
        qaData: [],
        classifiedData: [],
        mapData: [],
        wechatData: [],
        videoData: [],
        socialMediaRegister: [],
        qaRegister: [],
        classifiedRegister: [],
        wechatRegister: [],
        videoRegister: [],
      }

      const results: SheetParseResult[] = []
      let detectedMonth: string | null = null

      // 解析各个sheet
      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName]
        const sheetType = identifySheetType(sheetName)
        
        console.log(`解析 Sheet: ${sheetName}, 类型: ${sheetType}`)
        
        let dataCount = 0
        let success = true
        let error: string | undefined

        try {
          switch (sheetType) {
            case 'summary':
              data.summaryData = parseSummarySheet(worksheet, yearHint)
              dataCount = data.summaryData.length
              if (dataCount > 0 && !detectedMonth) {
                detectedMonth = dayjs(data.summaryData[0].date).format('YYYY-MM')
              }
              break
            case 'socialMedia':
              data.socialMediaData = parseSocialMediaSheet(worksheet, yearHint)
              dataCount = data.socialMediaData.length
              if (dataCount > 0 && !detectedMonth) {
                detectedMonth = dayjs(data.socialMediaData[0].date).format('YYYY-MM')
              }
              break
            case 'qa':
              data.qaData = parseQASheet(worksheet, yearHint)
              dataCount = data.qaData.length
              break
            case 'classified':
              data.classifiedData = parseClassifiedSheet(worksheet, yearHint)
              dataCount = data.classifiedData.length
              break
            case 'map':
              data.mapData = parseMapSheet(worksheet, yearHint)
              dataCount = data.mapData.length
              break
            case 'wechat':
              data.wechatData = parseWechatSheet(worksheet, yearHint)
              dataCount = data.wechatData.length
              break
            case 'video':
              data.videoData = parseVideoSheet(worksheet, yearHint)
              dataCount = data.videoData.length
              break
            case 'socialMediaRegister':
              data.socialMediaRegister = parseRegisterSheet(worksheet, yearHint)
              dataCount = data.socialMediaRegister.length
              break
            case 'qaRegister':
              data.qaRegister = parseRegisterSheet(worksheet, yearHint)
              dataCount = data.qaRegister.length
              break
            case 'classifiedRegister':
              data.classifiedRegister = parseRegisterSheet(worksheet, yearHint)
              dataCount = data.classifiedRegister.length
              break
            case 'wechatRegister':
              data.wechatRegister = parseRegisterSheet(worksheet, yearHint)
              dataCount = data.wechatRegister.length
              break
            case 'videoRegister':
              data.videoRegister = parseRegisterSheet(worksheet, yearHint)
              dataCount = data.videoRegister.length
              break
            case 'unknown':
              success = false
              error = '无法识别的Sheet类型'
              break
          }
        } catch (e) {
          success = false
          error = e instanceof Error ? e.message : '解析错误'
          console.error(`解析 ${sheetName} 失败:`, e)
        }

        results.push({
          sheetName,
          sheetType,
          dataCount,
          success,
          error,
        })
      }

      // 设置月份
      data.month = detectedMonth || dayjs().format('YYYY-MM')

      console.log('解析完成，导入数据:', data)
      console.log('解析结果:', results)

      setParseResults(results)
      setImportedData(data)
      setPreviewVisible(true)
      
    } catch (error) {
      console.error('解析Excel文件失败:', error)
      message.error(`解析Excel文件失败：${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setUploading(false)
      setFileList([])
    }

    return false // 阻止自动上传
  }

  // 确认导入
  const handleConfirmImport = () => {
    if (!importedData) return
    
    try {
      onImportSuccess(importedData)
      message.success('数据导入成功！')
      setPreviewVisible(false)
      setImportedData(null)
      setParseResults([])
    } catch (error) {
      console.error('导入数据失败:', error)
      message.error('导入数据失败')
    }
  }

  // 取消导入
  const handleCancelImport = () => {
    setPreviewVisible(false)
    setImportedData(null)
    setParseResults([])
  }

  // Sheet类型名称映射
  const sheetTypeNames: Record<string, string> = {
    summary: '汇总总表',
    socialMedia: '社交新媒体看板',
    qa: '问答看板',
    classified: '分类信息看板',
    map: '地图看板',
    wechat: '微信平台看板',
    video: '视频看板',
    socialMediaRegister: '社交新媒体登记',
    qaRegister: '问答登记',
    classifiedRegister: '分类信息登记',
    wechatRegister: '微信平台登记',
    videoRegister: '视频登记',
    unknown: '未识别',
  }

  // 渲染解析结果表格
  const resultColumns = [
    {
      title: 'Sheet名称',
      dataIndex: 'sheetName',
      key: 'sheetName',
    },
    {
      title: '识别类型',
      dataIndex: 'sheetType',
      key: 'sheetType',
      render: (type: string) => sheetTypeNames[type] || type,
    },
    {
      title: '数据条数',
      dataIndex: 'dataCount',
      key: 'dataCount',
    },
    {
      title: '状态',
      dataIndex: 'success',
      key: 'success',
      render: (success: boolean, record: SheetParseResult) => 
        success ? (
          <Tag color="success" icon={<CheckCircleOutlined />}>成功</Tag>
        ) : (
          <Tag color="error" icon={<CloseCircleOutlined />}>{record.error || '失败'}</Tag>
        ),
    },
  ]

  // 计算统计信息
  const getStats = () => {
    if (!importedData) return { dashboardCount: 0, registerCount: 0 }
    
    const dashboardCount = 
      importedData.summaryData.length +
      importedData.socialMediaData.length +
      importedData.qaData.length +
      importedData.classifiedData.length +
      importedData.mapData.length +
      importedData.wechatData.length +
      importedData.videoData.length
    
    const registerCount = 
      importedData.socialMediaRegister.length +
      importedData.qaRegister.length +
      importedData.classifiedRegister.length +
      importedData.wechatRegister.length +
      importedData.videoRegister.length

    return { dashboardCount, registerCount }
  }

  const stats = getStats()

  return (
    <>
      <Upload
        fileList={fileList}
        beforeUpload={handleFileUpload}
        onChange={({ fileList }) => setFileList(fileList)}
        accept=".xlsx,.xls"
        maxCount={1}
        showUploadList={false}
      >
        <Button
          icon={<UploadOutlined />}
          loading={uploading}
          type="default"
        >
          <FileExcelOutlined /> 导入Excel
        </Button>
      </Upload>

      <Modal
        title="Excel文件解析结果"
        open={previewVisible}
        onOk={handleConfirmImport}
        onCancel={handleCancelImport}
        width={800}
        okText="确认导入"
        cancelText="取消"
      >
        {importedData && (
          <div>
            <div style={{ marginBottom: 16, padding: '12px 16px', background: '#f5f5f5', borderRadius: 4 }}>
              <p style={{ margin: 0 }}>
                <strong>数据月份：</strong>{importedData.month}
                <span style={{ marginLeft: 24 }}>
                  <strong>数据看板：</strong>{stats.dashboardCount} 条
                </span>
                <span style={{ marginLeft: 24 }}>
                  <strong>登记明细：</strong>{stats.registerCount} 条
                </span>
              </p>
            </div>
            
            <Tabs
              items={[
                {
                  key: 'sheets',
                  label: 'Sheet解析结果',
                  children: (
                    <Table
                      columns={resultColumns}
                      dataSource={parseResults.map((r, i) => ({ ...r, key: i }))}
                      size="small"
                      pagination={false}
                    />
                  ),
                },
                {
                  key: 'preview',
                  label: '数据预览',
                  children: (
                    <div style={{ maxHeight: 300, overflow: 'auto' }}>
                      <Tabs
                        size="small"
                        items={[
                          importedData.socialMediaData.length > 0 && {
                            key: 'socialMedia',
                            label: `社交新媒体 (${importedData.socialMediaData.length})`,
                            children: (
                              <Table
                                columns={[
                                  { title: '日期', dataIndex: 'date', width: 100 },
                                  { title: '实际收入', dataIndex: 'actualIncome', width: 100 },
                                  { title: '净报名', dataIndex: 'netSignup', width: 80 },
                                  { title: '咨询量', dataIndex: 'consultCount', width: 80 },
                                  { title: '抖音有效条数', dataIndex: 'douyinValidCount', width: 100 },
                                  { title: '快手有效条数', dataIndex: 'kuaishouValidCount', width: 100 },
                                ]}
                                dataSource={importedData.socialMediaData.slice(0, 5).map((r, i) => ({ ...r, key: i }))}
                                size="small"
                                pagination={false}
                              />
                            ),
                          },
                          importedData.qaData.length > 0 && {
                            key: 'qa',
                            label: `问答 (${importedData.qaData.length})`,
                            children: (
                              <Table
                                columns={[
                                  { title: '日期', dataIndex: 'date', width: 100 },
                                  { title: '实际收入', dataIndex: 'actualIncome', width: 100 },
                                  { title: '净报名', dataIndex: 'netSignup', width: 80 },
                                  { title: '百度有效条数', dataIndex: 'baiduValidCount', width: 100 },
                                  { title: '知乎有效条数', dataIndex: 'zhihuValidCount', width: 100 },
                                ]}
                                dataSource={importedData.qaData.slice(0, 5).map((r, i) => ({ ...r, key: i }))}
                                size="small"
                                pagination={false}
                              />
                            ),
                          },
                          importedData.socialMediaRegister.length > 0 && {
                            key: 'socialMediaReg',
                            label: `社交新媒体登记 (${importedData.socialMediaRegister.length})`,
                            children: (
                              <Table
                                columns={[
                                  { title: '日期', dataIndex: 'date', width: 100 },
                                  { title: '平台', dataIndex: 'platform', width: 100 },
                                  { title: '主题', dataIndex: 'topic', width: 150 },
                                  { title: '有效数', dataIndex: 'validCount', width: 80 },
                                ]}
                                dataSource={importedData.socialMediaRegister.slice(0, 5).map((r, i) => ({ ...r, key: i }))}
                                size="small"
                                pagination={false}
                              />
                            ),
                          },
                        ].filter(Boolean) as any}
                      />
                    </div>
                  ),
                },
              ]}
            />
            
            <p style={{ color: '#ff4d4f', marginTop: 16 }}>
              注意：导入将覆盖当前月份 ({importedData.month}) 的现有数据
            </p>
          </div>
        )}
      </Modal>
    </>
  )
}

export default ExcelImporter
