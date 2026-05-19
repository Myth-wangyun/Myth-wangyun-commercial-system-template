/**
 * 班千分制页面
 */

import React, { useState, useEffect } from 'react'
import { App,
  Card,
  Table,
  Button,
  Space,
  Select,
  Input,
  Modal,
  Form,
  InputNumber,
  Row,
  Col,
  DatePicker,
  Upload,
  Tabs,
  Tag,
  Tooltip,
  List,
  Typography,
  Alert,
} from 'antd'
import {
  NumberOutlined,
  ReloadOutlined,
  DownloadOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  UploadOutlined,
  FileExcelOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  CommentOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useCampusStore } from '@/stores/campusStore'
import dayjs, { Dayjs } from 'dayjs'
import type * as ExcelJS from 'exceljs'

const { Option } = Select
const { TextArea } = Input
const { Text } = Typography

// 定义数据接口
interface ClassThousandPointsRecord {
  key: string
  serialNumber: number // 序号
  name: string // 姓名
  late?: number // 迟到
  lateComment?: string // 迟到批注
  earlyLeave?: number // 早退
  earlyLeaveComment?: string // 早退批注
  absent?: number // 旷课
  absentComment?: string // 旷课批注
  noListeningPass?: number // 未带听课证
  noListeningPassComment?: string // 未带听课证批注
  smoking?: number // 吸烟
  smokingComment?: string // 吸烟批注
  playingGames?: number // 玩游戏
  playingGamesComment?: string // 玩游戏批注
  watchingIrrelevantVideos?: number // 看与学习无关视频资料
  watchingIrrelevantVideosComment?: string // 看与学习无关视频资料批注
  fighting?: number // 打架斗殴
  fightingComment?: string // 打架斗殴批注
  notReturningToDorm?: number // 夜不归宿
  notReturningToDormComment?: string // 夜不归宿批注
  askingForLeave?: number // 请假
  askingForLeaveComment?: string // 请假批注
  talkingInClass?: number // 上课走动说话
  talkingInClassComment?: string // 上课走动说话批注
  sleepingInClass?: number // 上课睡觉
  sleepingInClassComment?: string // 上课睡觉批注
  other?: number // 其他
  otherComment?: string // 其他批注
  totalDeductions?: number // 总扣分
  bonusContent?: string // 加分内容
  bonusPoints?: number // 加分分数
  previousScore?: number // 上次分数
  remaining?: number // 剩余
}

// 导入的sheet数据接口
interface ImportedSheetData {
  sheetName: string // sheet名称（日期）
  date: Dayjs | null // 解析后的日期
  records: ClassThousandPointsRecord[] // 该日期的记录
  hasComments: boolean // 是否包含批注
}

// 列名映射配置 - 支持模糊匹配
const COLUMN_MAPPING: Record<string, keyof ClassThousandPointsRecord> = {
  '序号': 'serialNumber',
  '姓名': 'name',
  '迟到': 'late',
  '早退': 'earlyLeave',
  '旷课': 'absent',
  '未带听课证': 'noListeningPass',
  '未带听课': 'noListeningPass',
  '吸烟': 'smoking',
  '玩游戏': 'playingGames',
  '看与学习无关视频资料': 'watchingIrrelevantVideos',
  '看视频': 'watchingIrrelevantVideos',
  '无关视频': 'watchingIrrelevantVideos',
  '打架斗殴': 'fighting',
  '打架': 'fighting',
  '夜不归宿': 'notReturningToDorm',
  '请假': 'askingForLeave',
  '上课走动说话': 'talkingInClass',
  '走动说话': 'talkingInClass',
  '上课睡觉': 'sleepingInClass',
  '睡觉': 'sleepingInClass',
  '其他': 'other',
  '总扣分': 'totalDeductions',
  '扣分': 'totalDeductions',
  '加分内容': 'bonusContent',
  '加分': 'bonusPoints',
  '上次分数': 'previousScore',
  '上次分': 'previousScore',
  '剩余': 'remaining',
  '剩余分数': 'remaining',
}

// 模糊匹配列名
const fuzzyMatchColumn = (headerText: string): keyof ClassThousandPointsRecord | null => {
  const cleanText = headerText.replace(/\s+/g, '').trim()
  
  // 精确匹配
  if (COLUMN_MAPPING[cleanText]) {
    return COLUMN_MAPPING[cleanText]
  }
  
  // 模糊匹配
  for (const [key, value] of Object.entries(COLUMN_MAPPING)) {
    if (cleanText.includes(key) || key.includes(cleanText)) {
      return value
    }
  }
  
  // 特殊处理一些列名
  if (cleanText.includes('视频') && cleanText.includes('无关')) {
    return 'watchingIrrelevantVideos'
  }
  if (cleanText.includes('听课') && cleanText.includes('证')) {
    return 'noListeningPass'
  }
  if (cleanText.includes('走动') || cleanText.includes('说话')) {
    return 'talkingInClass'
  }
  if (cleanText.includes('归宿')) {
    return 'notReturningToDorm'
  }
  
  return null
}

// 解析日期格式的sheet名称
const parseSheetNameToDate = (sheetName: string): Dayjs | null => {
  // 处理 "2025年1月" 这种格式
  const yearMonthMatch = sheetName.match(/(\d{4})年(\d{1,2})月/)
  if (yearMonthMatch) {
    const year = parseInt(yearMonthMatch[1])
    const month = parseInt(yearMonthMatch[2])
    return dayjs().year(year).month(month - 1).date(1)
  }
  
  // 处理 "1月" 这种格式
  const monthOnlyMatch = sheetName.match(/^(\d{1,2})月$/)
  if (monthOnlyMatch) {
    const month = parseInt(monthOnlyMatch[1])
    return dayjs().month(month - 1).date(1)
  }
  
  // 尝试多种日期格式
  const formats = [
    'YYYY-MM-DD',
    'YYYY/MM/DD',
    'YYYY.MM.DD',
    'YYYY年MM月DD日',
    'YYYY年M月D日',
    'MM-DD',
    'MM/DD',
    'MM.DD',
    'M月D日',
    'MM月DD日',
    'YYYYMMDD',
    'MMDD',
  ]
  
  for (const format of formats) {
    const parsed = dayjs(sheetName, format)
    if (parsed.isValid()) {
      // 如果没有年份，使用当前年份
      if (!sheetName.includes('20') && !sheetName.includes('19')) {
        return parsed.year(dayjs().year())
      }
      return parsed
    }
  }
  
  // 尝试直接解析
  const directParsed = dayjs(sheetName)
  if (directParsed.isValid()) {
    return directParsed
  }
  
  return null
}

// 获取单元格的实际值
const getCellValue = (cell: ExcelJS.Cell): any => {
  let cellValue = cell.value
  
  // 处理富文本
  if (cellValue && typeof cellValue === 'object' && 'richText' in cellValue) {
    cellValue = (cellValue as ExcelJS.CellRichTextValue).richText
      .map((rt) => rt.text)
      .join('')
  }
  
  // 处理公式结果
  if (cellValue && typeof cellValue === 'object' && 'result' in cellValue) {
    cellValue = (cellValue as ExcelJS.CellFormulaValue).result
  }
  
  // 处理错误值（如 #DIV/0!）
  if (cellValue && typeof cellValue === 'object' && 'error' in cellValue) {
    return null
  }
  
  return cellValue
}

// 获取单元格批注
const getCellComment = (cell: ExcelJS.Cell): string => {
  const comment = cell.note
  if (!comment) return ''
  
  if (typeof comment === 'string') {
    return comment
  }
  
  if (comment && typeof comment === 'object' && 'texts' in comment) {
    return (comment as ExcelJS.Comment).texts
      ?.map((t) => (typeof t === 'string' ? t : t.text))
      .join('') || ''
  }
  
  return ''
}

// 根据班级生成不同的模拟数据
const generateMockDataByClass = (className: string): ClassThousandPointsRecord[] => {
  const classDataMap: Record<string, ClassThousandPointsRecord[]> = {
    S32106: [
      {
        key: '1',
        serialNumber: 1,
        name: '张三',
        late: 2,
        earlyLeave: 0,
        absent: 0,
        noListeningPass: 1,
        smoking: 0,
        playingGames: 1,
        watchingIrrelevantVideos: 0,
        fighting: 0,
        notReturningToDorm: 0,
        askingForLeave: 0,
        talkingInClass: 3,
        sleepingInClass: 0,
        other: 0,
        totalDeductions: 15,
        bonusContent: '积极参与活动',
        bonusPoints: 5,
        previousScore: 1000,
        remaining: 990,
      },
      {
        key: '2',
        serialNumber: 2,
        name: '李四',
        late: 0,
        earlyLeave: 1,
        absent: 0,
        noListeningPass: 0,
        smoking: 0,
        playingGames: 0,
        watchingIrrelevantVideos: 1,
        fighting: 0,
        notReturningToDorm: 0,
        askingForLeave: 2,
        talkingInClass: 2,
        sleepingInClass: 1,
        other: 0,
        totalDeductions: 18,
        bonusContent: '',
        bonusPoints: 0,
        previousScore: 1000,
        remaining: 982,
      },
      {
        key: '3',
        serialNumber: 3,
        name: '王五',
        late: 0,
        earlyLeave: 0,
        absent: 1,
        noListeningPass: 0,
        smoking: 0,
        playingGames: 0,
        watchingIrrelevantVideos: 0,
        fighting: 0,
        notReturningToDorm: 1,
        askingForLeave: 0,
        talkingInClass: 0,
        sleepingInClass: 0,
        other: 1,
        totalDeductions: 30,
        bonusContent: '',
        bonusPoints: 0,
        previousScore: 1000,
        remaining: 970,
      },
      {
        key: '4',
        serialNumber: 4,
        name: '赵六',
        late: 1,
        earlyLeave: 0,
        absent: 0,
        noListeningPass: 0,
        smoking: 1,
        playingGames: 0,
        watchingIrrelevantVideos: 0,
        fighting: 0,
        notReturningToDorm: 0,
        askingForLeave: 0,
        talkingInClass: 1,
        sleepingInClass: 0,
        other: 0,
        totalDeductions: 12,
        bonusContent: '优秀表现',
        bonusPoints: 10,
        previousScore: 1000,
        remaining: 998,
      },
      {
        key: '5',
        serialNumber: 5,
        name: '孙七',
        late: 0,
        earlyLeave: 0,
        absent: 0,
        noListeningPass: 0,
        smoking: 0,
        playingGames: 0,
        watchingIrrelevantVideos: 0,
        fighting: 0,
        notReturningToDorm: 0,
        askingForLeave: 0,
        talkingInClass: 0,
        sleepingInClass: 0,
        other: 0,
        totalDeductions: 0,
        bonusContent: '全勤奖励',
        bonusPoints: 20,
        previousScore: 1000,
        remaining: 1020,
      },
      {
        key: '6',
        serialNumber: 6,
        name: '周八',
        late: 1,
        earlyLeave: 0,
        absent: 0,
        noListeningPass: 1,
        smoking: 0,
        playingGames: 0,
        watchingIrrelevantVideos: 0,
        fighting: 0,
        notReturningToDorm: 0,
        askingForLeave: 0,
        talkingInClass: 1,
        sleepingInClass: 0,
        other: 0,
        totalDeductions: 6,
        bonusContent: '',
        bonusPoints: 0,
        previousScore: 1000,
        remaining: 994,
      },
      {
        key: '7',
        serialNumber: 7,
        name: '吴九',
        late: 0,
        earlyLeave: 2,
        absent: 0,
        noListeningPass: 0,
        smoking: 0,
        playingGames: 1,
        watchingIrrelevantVideos: 0,
        fighting: 0,
        notReturningToDorm: 0,
        askingForLeave: 1,
        talkingInClass: 2,
        sleepingInClass: 1,
        other: 0,
        totalDeductions: 16,
        bonusContent: '',
        bonusPoints: 0,
        previousScore: 1000,
        remaining: 984,
      },
      {
        key: '8',
        serialNumber: 8,
        name: '郑十',
        late: 0,
        earlyLeave: 0,
        absent: 0,
        noListeningPass: 0,
        smoking: 0,
        playingGames: 0,
        watchingIrrelevantVideos: 0,
        fighting: 0,
        notReturningToDorm: 0,
        askingForLeave: 0,
        talkingInClass: 0,
        sleepingInClass: 0,
        other: 0,
        totalDeductions: 0,
        bonusContent: '全勤奖励',
        bonusPoints: 20,
        previousScore: 1000,
        remaining: 1020,
      },
      {
        key: '9',
        serialNumber: 9,
        name: '钱十一',
        late: 3,
        earlyLeave: 1,
        absent: 0,
        noListeningPass: 2,
        smoking: 0,
        playingGames: 2,
        watchingIrrelevantVideos: 0,
        fighting: 0,
        notReturningToDorm: 0,
        askingForLeave: 0,
        talkingInClass: 3,
        sleepingInClass: 1,
        other: 0,
        totalDeductions: 24,
        bonusContent: '',
        bonusPoints: 0,
        previousScore: 1000,
        remaining: 976,
      },
      {
        key: '10',
        serialNumber: 10,
        name: '孙十二',
        late: 0,
        earlyLeave: 0,
        absent: 0,
        noListeningPass: 0,
        smoking: 0,
        playingGames: 0,
        watchingIrrelevantVideos: 1,
        fighting: 0,
        notReturningToDorm: 0,
        askingForLeave: 0,
        talkingInClass: 1,
        sleepingInClass: 0,
        other: 0,
        totalDeductions: 4,
        bonusContent: '表现良好',
        bonusPoints: 5,
        previousScore: 1000,
        remaining: 1001,
      },
      {
        key: '11',
        serialNumber: 11,
        name: '李十三',
        late: 2,
        earlyLeave: 0,
        absent: 1,
        noListeningPass: 0,
        smoking: 0,
        playingGames: 0,
        watchingIrrelevantVideos: 0,
        fighting: 0,
        notReturningToDorm: 1,
        askingForLeave: 0,
        talkingInClass: 0,
        sleepingInClass: 0,
        other: 1,
        totalDeductions: 32,
        bonusContent: '',
        bonusPoints: 0,
        previousScore: 1000,
        remaining: 968,
      },
      {
        key: '12',
        serialNumber: 12,
        name: '王十四',
        late: 0,
        earlyLeave: 0,
        absent: 0,
        noListeningPass: 0,
        smoking: 1,
        playingGames: 0,
        watchingIrrelevantVideos: 0,
        fighting: 0,
        notReturningToDorm: 0,
        askingForLeave: 0,
        talkingInClass: 0,
        sleepingInClass: 0,
        other: 0,
        totalDeductions: 10,
        bonusContent: '',
        bonusPoints: 0,
        previousScore: 1000,
        remaining: 990,
      },
      {
        key: '13',
        serialNumber: 13,
        name: '张十五',
        late: 1,
        earlyLeave: 0,
        absent: 0,
        noListeningPass: 0,
        smoking: 0,
        playingGames: 1,
        watchingIrrelevantVideos: 0,
        fighting: 0,
        notReturningToDorm: 0,
        askingForLeave: 2,
        talkingInClass: 2,
        sleepingInClass: 0,
        other: 0,
        totalDeductions: 12,
        bonusContent: '',
        bonusPoints: 0,
        previousScore: 1000,
        remaining: 988,
      },
      {
        key: '14',
        serialNumber: 14,
        name: '刘十六',
        late: 0,
        earlyLeave: 0,
        absent: 0,
        noListeningPass: 0,
        smoking: 0,
        playingGames: 0,
        watchingIrrelevantVideos: 0,
        fighting: 0,
        notReturningToDorm: 0,
        askingForLeave: 0,
        talkingInClass: 0,
        sleepingInClass: 0,
        other: 0,
        totalDeductions: 0,
        bonusContent: '全勤且表现优秀',
        bonusPoints: 30,
        previousScore: 1000,
        remaining: 1030,
      },
    ],
    S32107: [
      {
        key: '1',
        serialNumber: 1,
        name: '陈一',
        late: 3,
        earlyLeave: 1,
        absent: 0,
        noListeningPass: 2,
        smoking: 0,
        playingGames: 1,
        watchingIrrelevantVideos: 0,
        fighting: 0,
        notReturningToDorm: 0,
        askingForLeave: 1,
        talkingInClass: 4,
        sleepingInClass: 1,
        other: 0,
        totalDeductions: 25,
        bonusContent: '',
        bonusPoints: 0,
        previousScore: 1000,
        remaining: 975,
      },
      {
        key: '2',
        serialNumber: 2,
        name: '黄二',
        late: 1,
        earlyLeave: 0,
        absent: 0,
        noListeningPass: 0,
        smoking: 0,
        playingGames: 0,
        watchingIrrelevantVideos: 1,
        fighting: 0,
        notReturningToDorm: 0,
        askingForLeave: 0,
        talkingInClass: 1,
        sleepingInClass: 0,
        other: 0,
        totalDeductions: 6,
        bonusContent: '课堂表现积极',
        bonusPoints: 5,
        previousScore: 1000,
        remaining: 999,
      },
      {
        key: '3',
        serialNumber: 3,
        name: '徐三',
        late: 0,
        earlyLeave: 0,
        absent: 0,
        noListeningPass: 0,
        smoking: 0,
        playingGames: 0,
        watchingIrrelevantVideos: 0,
        fighting: 0,
        notReturningToDorm: 0,
        askingForLeave: 0,
        talkingInClass: 0,
        sleepingInClass: 0,
        other: 0,
        totalDeductions: 0,
        bonusContent: '全勤奖励',
        bonusPoints: 20,
        previousScore: 1000,
        remaining: 1020,
      },
      {
        key: '4',
        serialNumber: 4,
        name: '林四',
        late: 2,
        earlyLeave: 1,
        absent: 0,
        noListeningPass: 1,
        smoking: 0,
        playingGames: 1,
        watchingIrrelevantVideos: 0,
        fighting: 0,
        notReturningToDorm: 0,
        askingForLeave: 0,
        talkingInClass: 2,
        sleepingInClass: 0,
        other: 0,
        totalDeductions: 14,
        bonusContent: '',
        bonusPoints: 0,
        previousScore: 1000,
        remaining: 986,
      },
      {
        key: '5',
        serialNumber: 5,
        name: '胡五',
        late: 0,
        earlyLeave: 0,
        absent: 1,
        noListeningPass: 0,
        smoking: 0,
        playingGames: 0,
        watchingIrrelevantVideos: 0,
        fighting: 0,
        notReturningToDorm: 0,
        askingForLeave: 0,
        talkingInClass: 0,
        sleepingInClass: 0,
        other: 0,
        totalDeductions: 20,
        bonusContent: '',
        bonusPoints: 0,
        previousScore: 1000,
        remaining: 980,
      },
      {
        key: '6',
        serialNumber: 6,
        name: '罗六',
        late: 1,
        earlyLeave: 0,
        absent: 0,
        noListeningPass: 0,
        smoking: 0,
        playingGames: 0,
        watchingIrrelevantVideos: 0,
        fighting: 0,
        notReturningToDorm: 0,
        askingForLeave: 1,
        talkingInClass: 1,
        sleepingInClass: 0,
        other: 0,
        totalDeductions: 6,
        bonusContent: '表现良好',
        bonusPoints: 3,
        previousScore: 1000,
        remaining: 997,
      },
    ],
    S32108: [
      {
        key: '1',
        serialNumber: 1,
        name: '高七',
        late: 0,
        earlyLeave: 0,
        absent: 0,
        noListeningPass: 0,
        smoking: 0,
        playingGames: 0,
        watchingIrrelevantVideos: 0,
        fighting: 0,
        notReturningToDorm: 0,
        askingForLeave: 0,
        talkingInClass: 0,
        sleepingInClass: 0,
        other: 0,
        totalDeductions: 0,
        bonusContent: '全勤且表现优秀',
        bonusPoints: 30,
        previousScore: 1000,
        remaining: 1030,
      },
      {
        key: '2',
        serialNumber: 2,
        name: '夏八',
        late: 2,
        earlyLeave: 0,
        absent: 0,
        noListeningPass: 1,
        smoking: 0,
        playingGames: 2,
        watchingIrrelevantVideos: 0,
        fighting: 0,
        notReturningToDorm: 0,
        askingForLeave: 0,
        talkingInClass: 2,
        sleepingInClass: 0,
        other: 0,
        totalDeductions: 14,
        bonusContent: '',
        bonusPoints: 0,
        previousScore: 1000,
        remaining: 986,
      },
      {
        key: '3',
        serialNumber: 3,
        name: '梁九',
        late: 0,
        earlyLeave: 0,
        absent: 0,
        noListeningPass: 0,
        smoking: 0,
        playingGames: 0,
        watchingIrrelevantVideos: 0,
        fighting: 0,
        notReturningToDorm: 0,
        askingForLeave: 0,
        talkingInClass: 0,
        sleepingInClass: 0,
        other: 0,
        totalDeductions: 0,
        bonusContent: '全勤奖励',
        bonusPoints: 20,
        previousScore: 1000,
        remaining: 1020,
      },
      {
        key: '4',
        serialNumber: 4,
        name: '何十',
        late: 2,
        earlyLeave: 0,
        absent: 0,
        noListeningPass: 1,
        smoking: 0,
        playingGames: 1,
        watchingIrrelevantVideos: 0,
        fighting: 0,
        notReturningToDorm: 0,
        askingForLeave: 0,
        talkingInClass: 2,
        sleepingInClass: 0,
        other: 0,
        totalDeductions: 12,
        bonusContent: '',
        bonusPoints: 0,
        previousScore: 1000,
        remaining: 988,
      },
      {
        key: '5',
        serialNumber: 5,
        name: '郭十一',
        late: 0,
        earlyLeave: 1,
        absent: 0,
        noListeningPass: 0,
        smoking: 0,
        playingGames: 0,
        watchingIrrelevantVideos: 1,
        fighting: 0,
        notReturningToDorm: 0,
        askingForLeave: 0,
        talkingInClass: 1,
        sleepingInClass: 0,
        other: 0,
        totalDeductions: 6,
        bonusContent: '',
        bonusPoints: 0,
        previousScore: 1000,
        remaining: 994,
      },
      {
        key: '6',
        serialNumber: 6,
        name: '马十二',
        late: 1,
        earlyLeave: 0,
        absent: 0,
        noListeningPass: 0,
        smoking: 0,
        playingGames: 0,
        watchingIrrelevantVideos: 0,
        fighting: 0,
        notReturningToDorm: 0,
        askingForLeave: 2,
        talkingInClass: 0,
        sleepingInClass: 0,
        other: 0,
        totalDeductions: 6,
        bonusContent: '',
        bonusPoints: 0,
        previousScore: 1000,
        remaining: 994,
      },
    ],
  }

  return classDataMap[className] || classDataMap['S32106']
}

const CampusClassThousandPointsPage: React.FC = () => {
  const { message, modal } = App.useApp()
  const { currentCampus, getAllCampuses, setCampus } = useCampusStore()
  const [selectedCampus, setSelectedCampus] = useState<string>(currentCampus || '')
  const [selectedClass, setSelectedClass] = useState<string>('S32106')
  const [selectedMonth, setSelectedMonth] = useState<Dayjs>(dayjs())
  const [dataSource, setDataSource] = useState<ClassThousandPointsRecord[]>(
    generateMockDataByClass('S32106'),
  )
  const [loading, setLoading] = useState(false)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<ClassThousandPointsRecord | null>(null)
  const [form] = Form.useForm()
  const [searchText, setSearchText] = useState('')
  
  // Excel导入相关状态
  const [isImportModalVisible, setIsImportModalVisible] = useState(false)
  const [importedSheets, setImportedSheets] = useState<ImportedSheetData[]>([])
  const [selectedSheetIndex, setSelectedSheetIndex] = useState<number>(0)
  const [importLoading, setImportLoading] = useState(false)

  const campuses = getAllCampuses().map((campus) => ({
    id: campus.name.replace('神殿', ''),
    name: campus.name,
  }))

  // 计算总扣分
  const calculateTotalDeductions = (record: ClassThousandPointsRecord): number => {
    const deductions = [
      record.late || 0,
      record.earlyLeave || 0,
      record.absent || 0,
      record.noListeningPass || 0,
      record.smoking || 0,
      record.playingGames || 0,
      record.watchingIrrelevantVideos || 0,
      record.fighting || 0,
      record.notReturningToDorm || 0,
      record.askingForLeave || 0,
      record.talkingInClass || 0,
      record.sleepingInClass || 0,
      record.other || 0,
    ]
    return deductions.reduce((sum, val) => sum + val, 0)
  }

  // 计算剩余分数
  const calculateRemaining = (record: ClassThousandPointsRecord): number => {
    const previous = record.previousScore || 1000
    const deductions = calculateTotalDeductions(record)
    const bonus = record.bonusPoints || 0
    return previous - deductions + bonus
  }

  // 处理Excel文件导入
  const handleExcelImport = async (file: File) => {
    setImportLoading(true)
    try {
      const ExcelJS = await import('exceljs')
      const workbook = new ExcelJS.Workbook()
      const arrayBuffer = await file.arrayBuffer()
      await workbook.xlsx.load(arrayBuffer)
      
      const sheetsData: ImportedSheetData[] = []
      
      workbook.eachSheet((worksheet, sheetId) => {
        const sheetName = worksheet.name
        const date = parseSheetNameToDate(sheetName)
        const records: ClassThousandPointsRecord[] = []
        let hasComments = false
        
        // 智能查找表头行 - 在前10行中查找包含"序号"和"姓名"的行
        let headerRowNumber = -1
        const columnMap: Record<number, keyof ClassThousandPointsRecord> = {}
        
        for (let rowNum = 1; rowNum <= Math.min(10, worksheet.rowCount); rowNum++) {
          const row = worksheet.getRow(rowNum)
          let hasSerialNumber = false
          let hasName = false
          const tempColumnMap: Record<number, keyof ClassThousandPointsRecord> = {}
          
          row.eachCell((cell, colNumber) => {
            const cellValue = getCellValue(cell)
            const headerText = String(cellValue || '').replace(/\s+/g, '').trim()
            
            if (!headerText) return
            
            const mappedField = fuzzyMatchColumn(headerText)
            if (mappedField) {
              tempColumnMap[colNumber] = mappedField
              if (mappedField === 'serialNumber') hasSerialNumber = true
              if (mappedField === 'name') hasName = true
            }
          })
          
          // 如果找到了序号和姓名列，认为这是表头行
          if (hasSerialNumber && hasName) {
            headerRowNumber = rowNum
            Object.assign(columnMap, tempColumnMap)
            break
          }
        }
        
        if (headerRowNumber === -1) {
          console.warn(`工作表 ${sheetName} 未找到有效的表头行`)
          return
        }
        
        console.log(`工作表 ${sheetName} 表头在第 ${headerRowNumber} 行，列映射:`, columnMap)
        
        // 遍历数据行（从表头行的下一行开始）
        let recordIndex = 0
        for (let rowNum = headerRowNumber + 1; rowNum <= worksheet.rowCount; rowNum++) {
          const row = worksheet.getRow(rowNum)
          
          // 检查是否是空行或汇总行
          const firstCellValue = getCellValue(row.getCell(1))
          const firstCellStr = String(firstCellValue || '').trim()
          
          // 跳过空行
          if (!firstCellStr && !getCellValue(row.getCell(2))) {
            continue
          }
          
          // 跳过汇总行（通常包含统计数据或公式错误）
          if (firstCellStr.includes('#') || firstCellStr.includes('合计') || firstCellStr.includes('备注')) {
            continue
          }
          
          const record: ClassThousandPointsRecord = {
            key: `${sheetId}-${rowNum}`,
            serialNumber: 0,
            name: '',
          }
          
          row.eachCell((cell, colNumber) => {
            const field = columnMap[colNumber]
            if (!field) return
            
            const cellValue = getCellValue(cell)
            
            // 设置字段值
            if (field === 'name' || field === 'bonusContent') {
              const strValue = String(cellValue || '').trim()
              // 跳过错误值
              if (!strValue.includes('#DIV') && !strValue.includes('#REF') && !strValue.includes('#VALUE')) {
                ;(record as any)[field] = strValue
              }
            } else if (field === 'serialNumber') {
              const numValue = Number(cellValue)
              ;(record as any)[field] = !isNaN(numValue) && numValue > 0 ? numValue : 0
            } else {
              // 数值字段
              const numValue = Number(cellValue)
              if (!isNaN(numValue) && isFinite(numValue)) {
                ;(record as any)[field] = numValue
              } else {
                ;(record as any)[field] = 0
              }
            }
            
            // 获取单元格批注
            const commentText = getCellComment(cell)
            if (commentText) {
              hasComments = true
              // 将批注存储到对应的comment字段
              if (field !== 'serialNumber' && field !== 'name') {
                const commentField = `${field}Comment` as keyof ClassThousandPointsRecord
                ;(record as any)[commentField] = commentText
              }
            }
          })
          
          // 只添加有姓名的记录
          if (record.name && record.name.trim()) {
            recordIndex++
            // 如果序号为0，使用递增序号
            if (record.serialNumber === 0) {
              record.serialNumber = recordIndex
            }
            // 计算总扣分和剩余分数
            record.totalDeductions = calculateTotalDeductions(record)
            record.remaining = calculateRemaining(record)
            records.push(record)
          }
        }
        
        if (records.length > 0) {
          sheetsData.push({
            sheetName,
            date,
            records,
            hasComments,
          })
        }
      })
      
      if (sheetsData.length === 0) {
        message.warning('未能从Excel文件中解析出有效数据，请检查文件格式。确保表格包含"序号"和"姓名"列。')
        setImportLoading(false)
        return false
      }
      
      setImportedSheets(sheetsData)
      setSelectedSheetIndex(0)
      setIsImportModalVisible(true)
      message.success(`成功解析 ${sheetsData.length} 个工作表`)
    } catch (error) {
      console.error('Excel解析失败:', error)
      message.error('Excel文件解析失败，请检查文件格式')
    } finally {
      setImportLoading(false)
    }
    return false // 阻止自动上传
  }

  // 确认导入选中的sheet数据
  const handleConfirmImport = (sheetIndex: number) => {
    const sheet = importedSheets[sheetIndex]
    if (!sheet) {
      message.error('请选择要导入的工作表')
      return
    }
    
    // 如果sheet有日期，更新选中的月份
    if (sheet.date) {
      setSelectedMonth(sheet.date)
    }
    
    // 更新数据源
    const updatedRecords = sheet.records.map((record, index) => ({
      ...record,
      key: `imported-${Date.now()}-${index}`,
      serialNumber: index + 1,
    }))
    
    setDataSource(updatedRecords)
    setIsImportModalVisible(false)
    message.success(`已导入 ${sheet.sheetName} 的 ${updatedRecords.length} 条记录`)
  }

  // 导入所有sheet数据（合并）
  const handleImportAllSheets = () => {
    if (importedSheets.length === 0) {
      message.warning('没有可导入的数据')
      return
    }
    
    // 合并所有sheet的数据
    let allRecords: ClassThousandPointsRecord[] = []
    importedSheets.forEach((sheet) => {
      allRecords = allRecords.concat(sheet.records)
    })
    
    // 重新编号
    const updatedRecords = allRecords.map((record, index) => ({
      ...record,
      key: `imported-${Date.now()}-${index}`,
      serialNumber: index + 1,
    }))
    
    setDataSource(updatedRecords)
    setIsImportModalVisible(false)
    message.success(`已导入全部 ${importedSheets.length} 个工作表，共 ${updatedRecords.length} 条记录`)
  }

  // 渲染带批注的单元格
  const renderCellWithComment = (value: number | undefined, comment: string | undefined) => {
    const displayValue = value || 0
    if (comment) {
      return (
        <Tooltip title={<div style={{ whiteSpace: 'pre-wrap' }}>{comment}</div>}>
          <span style={{ cursor: 'help' }}>
            {displayValue}
            <CommentOutlined style={{ marginLeft: 4, color: '#faad14', fontSize: 12 }} />
          </span>
        </Tooltip>
      )
    }
    return displayValue
  }

  // 当数据源变化时，自动计算总扣分和剩余
  useEffect(() => {
    const updatedData = dataSource.map((item) => {
      const totalDeductions = calculateTotalDeductions(item)
      const remaining = calculateRemaining(item)
      return {
        ...item,
        totalDeductions,
        remaining,
      }
    })
    setDataSource(updatedData)
  }, [])

  // 当班级变化时，加载对应数据
  useEffect(() => {
    const newData = generateMockDataByClass(selectedClass)
    const updatedData = newData.map((item) => {
      const totalDeductions = calculateTotalDeductions(item)
      const remaining = calculateRemaining(item)
      return {
        ...item,
        totalDeductions,
        remaining,
      }
    })
    setDataSource(updatedData)
  }, [selectedClass])

  // 筛选数据
  const filteredData = dataSource.filter((item) => {
    const matchSearch = !searchText || item.name?.includes(searchText)
    return matchSearch
  })

  const handleEdit = (record: ClassThousandPointsRecord) => {
    setEditingRecord(record)
    form.setFieldsValue(record)
    setIsModalVisible(true)
  }

  const handleAdd = () => {
    setEditingRecord(null)
    form.resetFields()
    form.setFieldsValue({
      previousScore: 1000,
      remaining: 1000,
    })
    setIsModalVisible(true)
  }

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      const totalDeductions = calculateTotalDeductions(values)
      const remaining = calculateRemaining(values)

      const newRecord: ClassThousandPointsRecord = {
        ...values,
        totalDeductions,
        remaining,
        key: editingRecord?.key || Date.now().toString(),
      }

      if (editingRecord) {
        const updatedData = dataSource.map((item) =>
          item.key === editingRecord.key ? newRecord : item,
        )
        // 重新排序序号
        updatedData.forEach((item, index) => {
          item.serialNumber = index + 1
        })
        setDataSource(updatedData)
        message.success('编辑成功')
      } else {
        const newData = [...dataSource, { ...newRecord, serialNumber: dataSource.length + 1 }]
        setDataSource(newData)
        message.success('新增成功')
      }

      setIsModalVisible(false)
      form.resetFields()
    } catch (error) {
      console.error('Validation failed:', error)
    }
  }

  const handleDelete = (key: string) => {
    modal.confirm({
      title: '确认删除',
      content: '确定要删除这条记录吗？',
      onOk: () => {
        const updatedData = dataSource.filter((item) => item.key !== key)
        updatedData.forEach((item, index) => {
          item.serialNumber = index + 1
        })
        setDataSource(updatedData)
        message.success('删除成功')
      },
    })
  }

  const handleRefresh = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      message.success('刷新成功')
    }, 500)
  }

  const handleExport = () => {
    message.success('导出功能开发中...')
  }

  const columns: ColumnsType<ClassThousandPointsRecord> = [
    {
      title: '序号',
      dataIndex: 'serialNumber',
      key: 'serialNumber',
      width: 70,
      align: 'center',
      fixed: 'left',
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 100,
      fixed: 'left',
    },
    {
      title: (
        <div style={{ textAlign: 'center', backgroundColor: '#f0f9ff', padding: '4px' }}>
          月详细情况描述
        </div>
      ),
      children: [
        {
          title: '迟到',
          dataIndex: 'late',
          key: 'late',
          width: 70,
          align: 'center',
          render: (text, record) => renderCellWithComment(text, record.lateComment),
        },
        {
          title: '早退',
          dataIndex: 'earlyLeave',
          key: 'earlyLeave',
          width: 70,
          align: 'center',
          render: (text, record) => renderCellWithComment(text, record.earlyLeaveComment),
        },
        {
          title: '旷课',
          dataIndex: 'absent',
          key: 'absent',
          width: 70,
          align: 'center',
          render: (text, record) => renderCellWithComment(text, record.absentComment),
        },
        {
          title: '未带听课证',
          dataIndex: 'noListeningPass',
          key: 'noListeningPass',
          width: 100,
          align: 'center',
          render: (text, record) => renderCellWithComment(text, record.noListeningPassComment),
        },
        {
          title: '吸烟',
          dataIndex: 'smoking',
          key: 'smoking',
          width: 70,
          align: 'center',
          render: (text, record) => renderCellWithComment(text, record.smokingComment),
        },
        {
          title: '玩游戏',
          dataIndex: 'playingGames',
          key: 'playingGames',
          width: 80,
          align: 'center',
          render: (text, record) => renderCellWithComment(text, record.playingGamesComment),
        },
        {
          title: '看与学习无关视频资料',
          dataIndex: 'watchingIrrelevantVideos',
          key: 'watchingIrrelevantVideos',
          width: 160,
          align: 'center',
          render: (text, record) => renderCellWithComment(text, record.watchingIrrelevantVideosComment),
        },
        {
          title: '打架斗殴',
          dataIndex: 'fighting',
          key: 'fighting',
          width: 90,
          align: 'center',
          render: (text, record) => renderCellWithComment(text, record.fightingComment),
        },
        {
          title: '夜不归宿',
          dataIndex: 'notReturningToDorm',
          key: 'notReturningToDorm',
          width: 90,
          align: 'center',
          render: (text, record) => renderCellWithComment(text, record.notReturningToDormComment),
        },
        {
          title: '请假',
          dataIndex: 'askingForLeave',
          key: 'askingForLeave',
          width: 70,
          align: 'center',
          render: (text, record) => renderCellWithComment(text, record.askingForLeaveComment),
        },
        {
          title: '上课走动说话',
          dataIndex: 'talkingInClass',
          key: 'talkingInClass',
          width: 110,
          align: 'center',
          render: (text, record) => renderCellWithComment(text, record.talkingInClassComment),
        },
        {
          title: '上课睡觉',
          dataIndex: 'sleepingInClass',
          key: 'sleepingInClass',
          width: 90,
          align: 'center',
          render: (text, record) => renderCellWithComment(text, record.sleepingInClassComment),
        },
        {
          title: '其他',
          dataIndex: 'other',
          key: 'other',
          width: 70,
          align: 'center',
          render: (text, record) => renderCellWithComment(text, record.otherComment),
        },
      ],
    },
    {
      title: '总扣分',
      dataIndex: 'totalDeductions',
      key: 'totalDeductions',
      width: 80,
      align: 'center',
      render: (text) => <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>{text || 0}</span>,
    },
    {
      title: '加分内容',
      dataIndex: 'bonusContent',
      key: 'bonusContent',
      width: 150,
      render: (text) => text || '-',
    },
    {
      title: '加分',
      dataIndex: 'bonusPoints',
      key: 'bonusPoints',
      width: 70,
      align: 'center',
      render: (text) => <span style={{ color: '#52c41a' }}>{text || 0}</span>,
    },
    {
      title: '上次分数',
      dataIndex: 'previousScore',
      key: 'previousScore',
      width: 100,
      align: 'center',
      render: (text) => text || 1000,
    },
    {
      title: '剩余',
      dataIndex: 'remaining',
      key: 'remaining',
      width: 80,
      align: 'center',
      render: (text) => <span style={{ fontWeight: 'bold' }}>{text || 1000}</span>,
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          >
            编辑
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.key)}
            size="small"
          >
            删除
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title={
          <Space>
            <NumberOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
            <span>
              {selectedCampus}教化司{selectedClass}班千分制
            </span>
            <DatePicker
              picker="month"
              value={selectedMonth}
              onChange={(date) => date && setSelectedMonth(date)}
              format="YYYY年MM月"
              size="small"
            />
          </Space>
        }
        extra={
          <Space>
            <Select
              value={selectedCampus}
              onChange={(value) => {
                setSelectedCampus(value)
                setCampus(value)
              }}
              style={{ width: 150 }}
            >
              {campuses.map((campus) => (
                <Option key={campus.id} value={campus.name}>
                  {campus.name}
                </Option>
              ))}
            </Select>
            <Select
              value={selectedClass}
              onChange={(value) => {
                setSelectedClass(value)
                setDataSource(generateMockDataByClass(value))
              }}
              style={{ width: 120 }}
            >
              <Option value="S32106">S32106</Option>
              <Option value="S32107">S32107</Option>
              <Option value="S32108">S32108</Option>
            </Select>
            <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
              刷新
            </Button>
            <Upload
              accept=".xlsx,.xls"
              beforeUpload={handleExcelImport}
              showUploadList={false}
            >
              <Button icon={<UploadOutlined />} loading={importLoading}>
                导入Excel
              </Button>
            </Upload>
            <Button icon={<DownloadOutlined />} onClick={handleExport}>
              导出
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新增记录
            </Button>
          </Space>
        }
      >
        {/* 搜索栏 */}
        <Space style={{ marginBottom: 16 }}>
          <Input
            placeholder="搜索姓名"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300 }}
            allowClear
          />
        </Space>

        {/* 表格 */}
        <Table
          columns={columns}
          dataSource={filteredData}
          loading={loading}
          scroll={{ x: 2000, y: 600 }}
          pagination={false}
          bordered
          size="small"
        />
      </Card>

      {/* 编辑/新增弹窗 */}
      <Modal
        title={editingRecord ? '编辑千分制记录' : '新增千分制记录'}
        open={isModalVisible}
        onOk={handleSave}
        onCancel={() => {
          setIsModalVisible(false)
          form.resetFields()
        }}
        width={1000}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="name"
                label="姓名"
                rules={[{ required: true, message: '请输入姓名' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="previousScore" label="上次分数">
                <InputNumber style={{ width: '100%' }} min={0} defaultValue={1000} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <h4>扣分项</h4>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="late" label="迟到">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="earlyLeave" label="早退">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="absent" label="旷课">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="noListeningPass" label="未带听课证">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="smoking" label="吸烟">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="playingGames" label="玩游戏">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="watchingIrrelevantVideos" label="看与学习无关视频资料">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="fighting" label="打架斗殴">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="notReturningToDorm" label="夜不归宿">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="askingForLeave" label="请假">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="talkingInClass" label="上课走动说话">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="sleepingInClass" label="上课睡觉">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="other" label="其他">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="总扣分"
                shouldUpdate={(prev, curr) =>
                  prev.late !== curr.late ||
                  prev.earlyLeave !== curr.earlyLeave ||
                  prev.absent !== curr.absent ||
                  prev.noListeningPass !== curr.noListeningPass ||
                  prev.smoking !== curr.smoking ||
                  prev.playingGames !== curr.playingGames ||
                  prev.watchingIrrelevantVideos !== curr.watchingIrrelevantVideos ||
                  prev.fighting !== curr.fighting ||
                  prev.notReturningToDorm !== curr.notReturningToDorm ||
                  prev.askingForLeave !== curr.askingForLeave ||
                  prev.talkingInClass !== curr.talkingInClass ||
                  prev.sleepingInClass !== curr.sleepingInClass ||
                  prev.other !== curr.other
                }
              >
                {() => {
                  const values = form.getFieldsValue()
                  const totalDed = calculateTotalDeductions(values as ClassThousandPointsRecord)
                  form.setFieldValue('totalDeductions', totalDed)
                  return <InputNumber style={{ width: '100%' }} min={0} value={totalDed} disabled />
                }}
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <h4>加分项</h4>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="bonusContent" label="加分内容">
                <TextArea rows={2} placeholder="请输入加分内容" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="bonusPoints" label="加分分数">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="剩余"
                shouldUpdate={(prev, curr) =>
                  prev.totalDeductions !== curr.totalDeductions ||
                  prev.bonusPoints !== curr.bonusPoints ||
                  prev.previousScore !== curr.previousScore
                }
              >
                {() => {
                  const values = form.getFieldsValue()
                  const prevScore = values.previousScore || 1000
                  const totalDed = calculateTotalDeductions(values as ClassThousandPointsRecord)
                  const bonus = values.bonusPoints || 0
                  const remaining = prevScore - totalDed + bonus
                  form.setFieldValue('remaining', remaining)
                  return (
                    <InputNumber style={{ width: '100%' }} min={0} value={remaining} disabled />
                  )
                }}
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Excel导入预览弹窗 */}
      <Modal
        title={
          <Space>
            <FileExcelOutlined style={{ color: '#52c41a' }} />
            <span>Excel导入预览</span>
          </Space>
        }
        open={isImportModalVisible}
        onCancel={() => {
          setIsImportModalVisible(false)
          setImportedSheets([])
        }}
        width={1200}
        footer={[
          <Button key="cancel" onClick={() => {
            setIsImportModalVisible(false)
            setImportedSheets([])
          }}>
            取消
          </Button>,
          <Button
            key="importAll"
            onClick={handleImportAllSheets}
            disabled={importedSheets.length === 0}
          >
            导入全部工作表
          </Button>,
          <Button
            key="import"
            type="primary"
            onClick={() => handleConfirmImport(selectedSheetIndex)}
            disabled={importedSheets.length === 0}
          >
            导入选中工作表
          </Button>,
        ]}
      >
        {importedSheets.length > 0 ? (
          <>
            <Alert
              message="导入说明"
              description={
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  <li>Excel文件中的每个工作表(Sheet)代表一个日期的数据</li>
                  <li>工作表名称会被解析为日期（支持格式：YYYY-MM-DD、MM-DD、M月D日等）</li>
                  <li>单元格中的批注会被保留并显示在表格中</li>
                  <li>选择"导入选中工作表"只导入当前预览的数据，选择"导入全部工作表"会合并所有数据</li>
                </ul>
              }
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            
            <Tabs
              activeKey={String(selectedSheetIndex)}
              onChange={(key) => setSelectedSheetIndex(Number(key))}
              items={importedSheets.map((sheet, index) => ({
                key: String(index),
                label: (
                  <Space>
                    <span>{sheet.sheetName}</span>
                    {sheet.date && (
                      <Tag color="blue">{sheet.date.format('YYYY-MM-DD')}</Tag>
                    )}
                    {sheet.hasComments && (
                      <Tooltip title="包含批注">
                        <CommentOutlined style={{ color: '#faad14' }} />
                      </Tooltip>
                    )}
                    <Tag color="green">{sheet.records.length}条</Tag>
                  </Space>
                ),
                children: (
                  <div>
                    <div style={{ marginBottom: 8 }}>
                      <Space>
                        <Text strong>工作表：</Text>
                        <Text>{sheet.sheetName}</Text>
                        {sheet.date && (
                          <>
                            <Text strong style={{ marginLeft: 16 }}>解析日期：</Text>
                            <Text>{sheet.date.format('YYYY年MM月DD日')}</Text>
                          </>
                        )}
                        <Text strong style={{ marginLeft: 16 }}>记录数：</Text>
                        <Text>{sheet.records.length}条</Text>
                        {sheet.hasComments && (
                          <Tag icon={<CommentOutlined />} color="warning">
                            包含批注
                          </Tag>
                        )}
                      </Space>
                    </div>
                    <Table
                      columns={columns.filter(col => col.key !== 'action')}
                      dataSource={sheet.records}
                      scroll={{ x: 1800, y: 400 }}
                      pagination={false}
                      bordered
                      size="small"
                    />
                  </div>
                ),
              }))}
            />
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
            <FileExcelOutlined style={{ fontSize: 48, marginBottom: 16 }} />
            <div>暂无导入数据</div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default CampusClassThousandPointsPage
