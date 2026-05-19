// 学术->神殿 某神殿智慧司口碑工作自查表
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import type { ColumnsType } from 'antd/es/table'
import { App,
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  Row,
  Col,
  Statistic,
  Alert,
  InputNumber,
  Divider,
  Tabs,
  Typography,
  AutoComplete,
  Progress,
  List,
  Tag,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  PrinterOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  ShareAltOutlined,
  BarChartOutlined,
  UploadOutlined,
  FileExcelOutlined,
  CheckCircleOutlined as CheckIcon,
  CloseCircleOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { useCampusStore } from '@/stores/campusStore'
import {
  fetchSelfCheckRecords,
  saveSelfCheckRecord,
  type SelfCheckRecord,
  type SelfCheckDayData,
} from '@/services/reputationSelfCheck'
import { fetchTeachers } from '@/services/configMaster'
import * as XLSX from 'xlsx'

const { Option } = Select
const { Title } = Typography
// 口碑工作自查数据类型
interface ReputationSelfCheckRecord {
  id?: string
  teacherName: string
  year: number
  month: number
  campus: string
  dailyData: Record<string, SelfCheckDayData>
  monthlyTotals?: {
    newStudentTotal: number
    oldStudentTotal: number
    graduateTotal: number
    wechatMomentsTotal: number
    douyinTotal: number
    kuaishouTotal: number
    xiaohongshuTotal: number
    grandTotal: number
  }
  createdAt?: string
  updatedAt?: string
}

// 表单数据类型
interface ReputationSelfCheckFormData {
  teacherName: string
  year: number
  month: number
  campus: string
  dailyData: Record<string, SelfCheckDayData>
}

type CheckItemType = 'number' | 'text' | 'boolean'

interface CheckItem {
  id: keyof SelfCheckDayData
  category: string
  description: string
  type: CheckItemType
}

// Excel 导入相关类型
interface ImportedTeacherData {
  teacherName: string
  dailyData: Record<string, SelfCheckDayData>
  status?: 'pending' | 'success' | 'error'
  message?: string
}

interface ImportPreview {
  teachers: ImportedTeacherData[]
  year: number
  month: number
  campus: string
}

const ReputationSelfCheckPage: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore()

  const [records, setRecords] = useState<ReputationSelfCheckRecord[]>([])
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<ReputationSelfCheckRecord | null>(null)
  const [form] = Form.useForm<ReputationSelfCheckFormData>()
  const [searchText, setSearchText] = useState('')
  const [selectedCampus, setSelectedCampus] = useState('石美')
  const [selectedYear, setSelectedYear] = useState(dayjs().year())
  const [selectedMonth, setSelectedMonth] = useState(dayjs().month() + 1)
  const [activeTab, setActiveTab] = useState('data')
  const [teacherOptions, setTeacherOptions] = useState<{ value: string; label: string }[]>([])

  // Excel 导入相关状态
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null)
  const [importing, setImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 自查项目配置
  const checkItems: CheckItem[] = [
    { id: 'newStudentCount', category: '学员访谈', description: '访谈新生数量', type: 'number' },
    { id: 'newStudentNames', category: '学员访谈', description: '新生姓名', type: 'text' },
    {
      id: 'newStudentRecordFilled',
      category: '学员访谈',
      description: '是否填写访谈记录表',
      type: 'boolean',
    },
    {
      id: 'newStudentOnlineWorks',
      category: '学员访谈',
      description: '新生是否线上发作品',
      type: 'boolean',
    },
    { id: 'oldStudentCount', category: '学员访谈', description: '访谈老生数量', type: 'number' },
    { id: 'oldStudentClass', category: '学员访谈', description: '老生班级', type: 'text' },
    { id: 'oldStudentNames', category: '学员访谈', description: '老生姓名', type: 'text' },
    {
      id: 'oldStudentRecordFilled',
      category: '学员访谈',
      description: '是否填写访谈记录表',
      type: 'boolean',
    },
    { id: 'graduateCount', category: '学员访谈', description: '访谈毕业生数量', type: 'number' },
    { id: 'graduateNames', category: '学员访谈', description: '毕业生姓名', type: 'text' },
    {
      id: 'graduateRecordFilled',
      category: '学员访谈',
      description: '是否填写访谈记录表',
      type: 'boolean',
    },
    { id: 'wechatMoments', category: '线上宣传', description: '朋友圈数量', type: 'number' },
    { id: 'douyin', category: '线上宣传', description: '抖音数量', type: 'number' },
    { id: 'kuaishou', category: '线上宣传', description: '快手数量', type: 'number' },
    { id: 'xiaohongshu', category: '线上宣传', description: '小红书数量', type: 'number' },
    { id: 'dailyTotal', category: '线上宣传', description: '当天合计', type: 'number' },
  ]

  const loadRecords = useCallback(async () => {
    const campus = currentCampus || selectedCampus
    if (!campus) return
    setLoading(true)
    try {
      const list = await fetchSelfCheckRecords({ campus, year: selectedYear, month: selectedMonth })
      setRecords(list)
      setSelectedRecordId((prev) => {
        if (prev && list.some((item) => item.id?.toString() === prev)) {
          return prev
        }
        return list[0]?.id?.toString() || null
      })
    } catch (error) {
      console.error(error)
      message.error('加载自查记录失败')
    } finally {
      setLoading(false)
    }
  }, [currentCampus, selectedCampus, selectedYear, selectedMonth])

  useEffect(() => {
    loadRecords()
  }, [loadRecords])

  // 加载教员列表（配置中心 + 数据库已有记录的并集）
  useEffect(() => {
    const loadTeachers = async () => {
      try {
        const campusName = currentCampus || selectedCampus
        const stripped = campusName.replace(/神殿$/, '')

        // 1. 从配置中心获取教员
        let configTeachers = (await fetchTeachers({ campus_name: campusName, active: true })) || []
        if ((!configTeachers || configTeachers.length === 0) && stripped) {
          configTeachers = (await fetchTeachers({ campus_name: stripped, active: true })) || []
        }
        if (!configTeachers || configTeachers.length === 0) {
          configTeachers = (await fetchTeachers({ active: true })) || []
        }
        console.log(`[教员列表] 从配置中心获取到 ${configTeachers.length} 位教员`)

        // 2. 从数据库已有记录中提取教员姓名
        const dbTeacherNames = records.map((r) => r.teacherName).filter(Boolean)
        console.log(`[教员列表] 从数据库记录获取到 ${dbTeacherNames.length} 位教员`)

        // 3. 合并并去重
        const allTeachersMap = new Map<string, { label: string; value: string }>()
        configTeachers.forEach((t) => {
          if (t.name) allTeachersMap.set(t.name, { label: t.name, value: t.name })
        })
        dbTeacherNames.forEach((name) => {
          if (name && !allTeachersMap.has(name)) {
            allTeachersMap.set(name, { label: name, value: name })
          }
        })

        const combinedTeachers = Array.from(allTeachersMap.values())
        combinedTeachers.sort((a, b) => a.label.localeCompare(b.label, 'zh-CN'))

        setTeacherOptions(combinedTeachers)
        console.log(`[教员列表] 合并后总计 ${combinedTeachers.length} 位教员`)
      } catch (error) {
        console.error('加载教员列表失败', error)
      }
    }
    loadTeachers()
  }, [currentCampus, selectedCampus, records])

  // 同步神殿为顶部选择器
  useEffect(() => {
    if (currentCampus) setSelectedCampus(currentCampus)
  }, [currentCampus])

  // 计算月度总计
  const emptyTotals = useMemo(
    () => ({
      newStudentTotal: 0,
      oldStudentTotal: 0,
      graduateTotal: 0,
      wechatMomentsTotal: 0,
      douyinTotal: 0,
      kuaishouTotal: 0,
      xiaohongshuTotal: 0,
      grandTotal: 0,
    }),
    [],
  )

  const normalizeDailyDataForForm = useCallback((source?: Record<string, SelfCheckDayData>) => {
    const result: Record<number, SelfCheckDayData> = {}
    Object.entries(source || {}).forEach(([key, value]) => {
      const day = Number(key)
      if (Number.isNaN(day)) return
      result[day] = { ...value }
    })
    return result
  }, [])

  const normalizeDailyDataForSubmit = useCallback(
    (source?: Record<string | number, SelfCheckDayData>) => {
      const result: Record<string, SelfCheckDayData> = {}
      Object.entries(source || {}).forEach(([key, value]) => {
        const safeKey = String(key)
        const wechat = value?.wechatMoments || 0
        const douyin = value?.douyin || 0
        const kuaishou = value?.kuaishou || 0
        const xhs = value?.xiaohongshu || 0
        result[safeKey] = {
          ...value,
          dailyTotal: wechat + douyin + kuaishou + xhs,
        }
      })
      return result
    },
    [],
  )

  // 统计数据
  const currentRecord = useMemo(() => {
    const list = records.filter(
      (record) =>
        record.year === selectedYear &&
        record.month === selectedMonth &&
        record.campus === (currentCampus || selectedCampus),
    )
    if (!list.length) return null
    const byId = list.find((item) => item.id?.toString() === selectedRecordId)
    return byId || list[0]
  }, [records, selectedYear, selectedMonth, currentCampus, selectedCampus, selectedRecordId])

  const statistics = {
    totalRecords: records.length,
    currentMonthData: currentRecord,
    monthlyAverages: {
      newStudentAvg: 0,
      oldStudentAvg: 0,
      graduateAvg: 0,
      wechatMomentsAvg: 0,
      douyinAvg: 0,
      kuaishouAvg: 0,
      xiaohongshuAvg: 0,
      grandTotalAvg: 0,
    },
  }

  const currentTotals = statistics.currentMonthData?.monthlyTotals || emptyTotals

  // 计算月度平均值
  if (statistics.currentMonthData) {
    const daysInMonth = dayjs(`${selectedYear}-${selectedMonth}`).daysInMonth()
    const totals = statistics.currentMonthData.monthlyTotals || emptyTotals

    statistics.monthlyAverages = {
      newStudentAvg: Math.round((totals.newStudentTotal / daysInMonth) * 100) / 100,
      oldStudentAvg: Math.round((totals.oldStudentTotal / daysInMonth) * 100) / 100,
      graduateAvg: Math.round((totals.graduateTotal / daysInMonth) * 100) / 100,
      wechatMomentsAvg: Math.round((totals.wechatMomentsTotal / daysInMonth) * 100) / 100,
      douyinAvg: Math.round((totals.douyinTotal / daysInMonth) * 100) / 100,
      kuaishouAvg: Math.round((totals.kuaishouTotal / daysInMonth) * 100) / 100,
      xiaohongshuAvg: Math.round((totals.xiaohongshuTotal / daysInMonth) * 100) / 100,
      grandTotalAvg: Math.round((totals.grandTotal / daysInMonth) * 100) / 100,
    }
  }

  // 生成自查表格列
  const generateCheckColumns = (): ColumnsType<CheckItem> => {
    const columns: ColumnsType<CheckItem> = [
      {
        title: '事件',
        dataIndex: 'event',
        key: 'event',
        width: 100,
        fixed: 'left' as const,
        render: (_text, record, index) => {
          // 计算当前分类的行数
          const category = record.category
          const categoryItems = checkItems.filter((item) => item.category === category)
          const firstIndex = checkItems.findIndex((item) => item.category === category)
          // 只在分类的第一行显示分类名称
          if (index === firstIndex) {
            return {
              children: <div style={{ fontWeight: 'bold' }}>{category}</div>,
              props: { rowSpan: categoryItems.length },
            }
          }
          return { children: null, props: { rowSpan: 0 } }
        },
      },
      {
        title: '详细内容',
        dataIndex: 'description',
        key: 'description',
        width: 200,
        fixed: 'left' as const,
      },
    ]

    // 添加31天列
    for (let day = 1; day <= 31; day++) {
      columns.push({
        title: `${day}`,
        dataIndex: `day${day}`,
        key: `day${day}`,
        width: 60,
        render: (_text, record) => {
          const pool = statistics.currentMonthData?.dailyData || {}
          const currentData = pool[day] || pool[day.toString()]
          if (!currentData) return '-'

          const value = currentData[record.id]
          if (record.type === 'boolean') {
            return value ? '✓' : '✗'
          } else if (record.type === 'number') {
            return value || 0
          } else {
            return value || '-'
          }
        },
      })
    }

    // 添加合计列
    columns.push({
      title: '合计',
      dataIndex: 'total',
      key: 'total',
      width: 80,
      render: (_text, record) => {
        if (!statistics.currentMonthData) return '-'

        const totals = statistics.currentMonthData.monthlyTotals || emptyTotals
        switch (record.id) {
          case 'newStudentCount':
            return totals.newStudentTotal
          case 'oldStudentCount':
            return totals.oldStudentTotal
          case 'graduateCount':
            return totals.graduateTotal
          case 'wechatMoments':
            return totals.wechatMomentsTotal
          case 'douyin':
            return totals.douyinTotal
          case 'kuaishou':
            return totals.kuaishouTotal
          case 'xiaohongshu':
            return totals.xiaohongshuTotal
          case 'dailyTotal':
            return totals.grandTotal
          default:
            return '-'
        }
      },
    })

    return columns
  }

  // 处理添加
  const handleAdd = () => {
    setEditingRecord(null)
    form.resetFields()
    form.setFieldsValue({
      campus: currentCampus || selectedCampus,
      year: selectedYear,
      month: selectedMonth,
      dailyData: {},
    })
    setModalVisible(true)
  }

  // 处理编辑
  const handleEdit = (record: ReputationSelfCheckRecord) => {
    setEditingRecord(record)
    form.setFieldsValue({
      ...record,
      campus: currentCampus || record.campus,
      dailyData: normalizeDailyDataForForm(record.dailyData),
    })
    setModalVisible(true)
  }

  // 处理删除
  // 处理保存
  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      const payload: SelfCheckRecord = {
        id: editingRecord?.id,
        campus: currentCampus || values.campus,
        teacherName: values.teacherName,
        year: values.year,
        month: values.month,
        dailyData: normalizeDailyDataForSubmit(values.dailyData),
      }

      await saveSelfCheckRecord(payload)
      message.success(editingRecord ? '更新成功' : '添加成功')
      loadRecords()
      setModalVisible(false)
      form.resetFields()
    } catch (error) {
      console.error('表单验证失败:', error)
    }
  }

  // 处理搜索
  const handleSearch = (value: string) => {
    setSearchText(value)
  }

  // 处理神殿变化（页面筛选禁用，仅显示当前神殿）
  const handleCampusChange = (_campus: string) => {
    // 与顶部神殿保持一致，这里不允许更改
    setSelectedCampus(currentCampus || _campus)
  }

  // 处理年份变化
  const handleYearChange = (year: number) => {
    setSelectedYear(year)
  }

  // 处理月份变化
  const handleMonthChange = (month: number) => {
    setSelectedMonth(month)
  }

  // 过滤数据
  const filteredData = records.filter((item) => {
    const matchesSearch =
      !searchText || item.teacherName.toLowerCase().includes(searchText.toLowerCase())

    const matchesCampus = item.campus === (currentCampus || selectedCampus)
    const matchesYear = item.year === selectedYear
    const matchesMonth = item.month === selectedMonth

    return matchesSearch && matchesCampus && matchesYear && matchesMonth
  })

  useEffect(() => {
    if (filteredData.length === 0) {
      setSelectedRecordId(null)
    } else if (!filteredData.some((item) => item.id?.toString() === selectedRecordId)) {
      setSelectedRecordId(filteredData[0]?.id?.toString() || null)
    }
  }, [filteredData, selectedRecordId])

  // 更新当前记录的教员姓名（可编辑）
  const updateCurrentTeacherName = (name: string) => {
    if (!statistics.currentMonthData) return
    const id = statistics.currentMonthData.id
    setRecords((prev) => prev.map((r) => (r.id === id ? { ...r, teacherName: name } : r)))
  }

  const handleSaveCurrentRecord = async () => {
    if (!statistics.currentMonthData) {
      message.warning('暂无可保存的记录')
      return
    }
    try {
      setLoading(true)
      await saveSelfCheckRecord({
        id: statistics.currentMonthData.id,
        campus: statistics.currentMonthData.campus,
        teacherName: statistics.currentMonthData.teacherName,
        year: statistics.currentMonthData.year,
        month: statistics.currentMonthData.month,
        dailyData: statistics.currentMonthData.dailyData,
      })
      message.success('当前记录已保存')
      loadRecords()
    } catch (error) {
      console.error(error)
      message.error('保存失败，请稍后再试')
    } finally {
      setLoading(false)
    }
  }

  // ==================== Excel 导入相关函数 ====================

  /**
   * 行映射配置：Excel 中"详细内容"列的文本 -> checkItems 的 id
   * 注意：有多个"是否填写访谈记录表"，需要按顺序区分
   */
  const ROW_MAPPING: { pattern: string; id: keyof SelfCheckDayData; category: string }[] = [
    { pattern: '访谈新生数量', id: 'newStudentCount', category: '学员访谈' },
    { pattern: '新生姓名', id: 'newStudentNames', category: '学员访谈' },
    { pattern: '是否填写访谈记录表', id: 'newStudentRecordFilled', category: '学员访谈' }, // 第一个
    { pattern: '新生是否线上发作品', id: 'newStudentOnlineWorks', category: '学员访谈' },
    { pattern: '访谈老生数量', id: 'oldStudentCount', category: '学员访谈' },
    { pattern: '老生班级', id: 'oldStudentClass', category: '学员访谈' },
    { pattern: '老生姓名', id: 'oldStudentNames', category: '学员访谈' },
    { pattern: '是否填写访谈记录表', id: 'oldStudentRecordFilled', category: '学员访谈' }, // 第二个
    { pattern: '访谈毕业生数量', id: 'graduateCount', category: '学员访谈' },
    { pattern: '毕业生姓名', id: 'graduateNames', category: '学员访谈' },
    { pattern: '是否填写访谈记录表', id: 'graduateRecordFilled', category: '学员访谈' }, // 第三个
    { pattern: '朋友圈数量', id: 'wechatMoments', category: '线上宣传' },
    { pattern: '抖音数量', id: 'douyin', category: '线上宣传' },
    { pattern: '快手数量', id: 'kuaishou', category: '线上宣传' },
    { pattern: '小红书数量', id: 'xiaohongshu', category: '线上宣传' },
    { pattern: '当天合计', id: 'dailyTotal', category: '线上宣传' },
  ]

  /**
   * 解析布尔值
   */
  const parseBoolean = (value: unknown): boolean | undefined => {
    if (value === undefined || value === null || value === '') return undefined
    const str = String(value).trim().toLowerCase()
    if (['是', '√', '✓', '1', 'true', 'yes', '有'].includes(str)) return true
    if (['否', '×', '✗', '0', 'false', 'no', '无'].includes(str)) return false
    return undefined
  }

  /**
   * 解析数字
   */
  const parseNumber = (value: unknown): number | undefined => {
    if (value === undefined || value === null || value === '') return undefined
    const num = Number(value)
    return isNaN(num) ? undefined : num
  }

  /**
   * 解析单个 Sheet 的数据
   */
  const parseSheetData = (
    sheet: XLSX.WorkSheet,
    sheetName: string
  ): ImportedTeacherData | null => {
    console.log(`%c[Excel导入] 开始解析 Sheet: ${sheetName}`, 'color: #1890ff; font-weight: bold')

    const data = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: '' })
    if (data.length < 5) {
      console.log(`%c[Excel导入] Sheet ${sheetName} 数据行数不足，跳过`, 'color: orange')
      return null
    }

    // 1. 提取教员姓名
    let teacherName = ''
    for (let i = 0; i < Math.min(5, data.length); i++) {
      const row = data[i]
      for (let j = 0; j < row.length; j++) {
        const cell = String(row[j] || '').trim()
        // 匹配 "教员姓名：xxx" 或 "班主任姓名：xxx"
        const match = cell.match(/(?:教员|班主任)姓名[：:]\s*(.+)/i)
        if (match) {
          teacherName = match[1].trim()
          console.log(`%c[Excel导入] 从单元格提取教员姓名: ${teacherName}`, 'color: green')
          break
        }
      }
      if (teacherName) break
    }
    // 如果没找到，用 Sheet 名称
    if (!teacherName) {
      teacherName = sheetName.replace(/[（(].*[)）]/g, '').trim()
      console.log(`%c[Excel导入] 使用 Sheet 名称作为教员姓名: ${teacherName}`, 'color: orange')
    }

    // 2. 找到"日期"行，确定日期列的起始位置
    let dateRowIndex = -1
    let dayStartCol = -1
    for (let i = 0; i < Math.min(10, data.length); i++) {
      const row = data[i]
      for (let j = 0; j < row.length; j++) {
        const cell = String(row[j] || '').trim()
        if (cell === '日期' || cell.includes('日期')) {
          // 找到"日期"后，向右找第一个数字（应该是1）
          for (let k = j + 1; k < row.length; k++) {
            const nextCell = String(row[k] || '').trim()
            if (nextCell === '1') {
              dateRowIndex = i
              dayStartCol = k
              console.log(`%c[Excel导入] 找到日期行: 行${i}, 日期起始列: ${k}`, 'color: green')
              break
            }
          }
          if (dayStartCol >= 0) break
        }
      }
      if (dayStartCol >= 0) break
    }

    if (dayStartCol < 0) {
      // 备用方案：找"详细内容"列，日期列通常在其右边
      for (let i = 0; i < Math.min(10, data.length); i++) {
        const row = data[i]
        for (let j = 0; j < row.length; j++) {
          const cell = String(row[j] || '').trim()
          if (cell === '详细内容' || cell.includes('详细内容')) {
            dayStartCol = j + 1
            dateRowIndex = i
            console.log(`%c[Excel导入] 通过"详细内容"列推断日期起始列: ${dayStartCol}`, 'color: orange')
            break
          }
        }
        if (dayStartCol >= 0) break
      }
    }

    if (dayStartCol < 0) {
      console.log(`%c[Excel导入] 无法确定日期列位置，跳过 Sheet: ${sheetName}`, 'color: red')
      return null
    }

    // 3. 找到"详细内容"列的索引
    let detailColIndex = -1
    for (let i = 0; i < Math.min(10, data.length); i++) {
      const row = data[i]
      for (let j = 0; j < row.length; j++) {
        const cell = String(row[j] || '').trim()
        if (cell === '详细内容' || cell.includes('详细内容')) {
          detailColIndex = j
          console.log(`%c[Excel导入] 找到"详细内容"列: 列${j}`, 'color: green')
          break
        }
      }
      if (detailColIndex >= 0) break
    }

    // 4. 找到数据起始行（第一个包含"访谈新生数量"的行）
    let dataStartRow = -1
    for (let i = dateRowIndex + 1; i < data.length; i++) {
      const row = data[i]
      const detailCell = detailColIndex >= 0 ? String(row[detailColIndex] || '').trim() : ''
      // 检查是否是数据行（包含我们关心的指标）
      if (detailCell.includes('访谈新生数量') || detailCell.includes('新生姓名')) {
        dataStartRow = i
        console.log(`%c[Excel导入] 数据起始行: ${i}`, 'color: green')
        break
      }
    }

    if (dataStartRow < 0) {
      console.log(`%c[Excel导入] 无法确定数据起始行，跳过 Sheet: ${sheetName}`, 'color: red')
      return null
    }

    // 5. 解析每一行数据
    const dailyData: Record<string, SelfCheckDayData> = {}
    // 初始化 1-31 天的数据
    for (let day = 1; day <= 31; day++) {
      dailyData[String(day)] = {}
    }

    // 跟踪"是否填写访谈记录表"出现的次数
    let recordFilledCount = 0

    for (let i = dataStartRow; i < data.length; i++) {
      const row = data[i]
      const detailCell = detailColIndex >= 0 ? String(row[detailColIndex] || '').trim() : ''

      if (!detailCell) continue

      // 查找匹配的字段
      let matchedMapping: { id: keyof SelfCheckDayData; category: string } | null = null

      // 特殊处理"是否填写访谈记录表"（按出现顺序区分）
      if (detailCell.includes('是否填写访谈记录表')) {
        recordFilledCount++
        if (recordFilledCount === 1) {
          matchedMapping = { id: 'newStudentRecordFilled', category: '学员访谈' }
        } else if (recordFilledCount === 2) {
          matchedMapping = { id: 'oldStudentRecordFilled', category: '学员访谈' }
        } else if (recordFilledCount === 3) {
          matchedMapping = { id: 'graduateRecordFilled', category: '学员访谈' }
        }
      } else {
        // 其他字段按模式匹配
        for (const mapping of ROW_MAPPING) {
          if (mapping.pattern !== '是否填写访谈记录表' && detailCell.includes(mapping.pattern)) {
            matchedMapping = { id: mapping.id, category: mapping.category }
            break
          }
        }
      }

      if (!matchedMapping) continue

      console.log(`%c[Excel导入] 行${i}: "${detailCell}" -> ${matchedMapping.id}`, 'color: #666')

      // 获取字段类型
      const checkItem = checkItems.find((item) => item.id === matchedMapping!.id)
      const fieldType = checkItem?.type || 'text'

      // 读取 1-31 天的数据
      for (let day = 1; day <= 31; day++) {
        const colIndex = dayStartCol + day - 1
        if (colIndex >= row.length) continue

        const cellValue = row[colIndex]
        if (cellValue === undefined || cellValue === null || cellValue === '') continue

        let parsedValue: unknown
        if (fieldType === 'boolean') {
          parsedValue = parseBoolean(cellValue)
        } else if (fieldType === 'number') {
          parsedValue = parseNumber(cellValue)
        } else {
          parsedValue = String(cellValue).trim()
        }

        if (parsedValue !== undefined) {
          dailyData[String(day)][matchedMapping.id] = parsedValue as never
        }
      }
    }

    // 计算每天的 dailyTotal
    for (let day = 1; day <= 31; day++) {
      const dayData = dailyData[String(day)]
      const wechat = (dayData.wechatMoments as number) || 0
      const douyin = (dayData.douyin as number) || 0
      const kuaishou = (dayData.kuaishou as number) || 0
      const xhs = (dayData.xiaohongshu as number) || 0
      dayData.dailyTotal = wechat + douyin + kuaishou + xhs
    }

    console.log(`%c[Excel导入] Sheet ${sheetName} 解析完成, 教员: ${teacherName}`, 'color: green; font-weight: bold')

    return {
      teacherName,
      dailyData,
      status: 'pending',
    }
  }

  /**
   * 处理 Excel 文件上传
   */
  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    console.log(`%c[Excel导入] 开始处理文件: ${file.name}`, 'color: #1890ff; font-weight: bold')

    try {
      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: 'array' })

      console.log(`%c[Excel导入] 工作簿包含 ${workbook.SheetNames.length} 个 Sheet`, 'color: #1890ff')

      const teachers: ImportedTeacherData[] = []

      for (const sheetName of workbook.SheetNames) {
        // 跳过"平均"、"汇总"等 Sheet
        if (/平均|汇总|average|avg|summary/i.test(sheetName)) {
          console.log(`%c[Excel导入] 跳过汇总 Sheet: ${sheetName}`, 'color: orange')
          continue
        }

        const sheet = workbook.Sheets[sheetName]
        const teacherData = parseSheetData(sheet, sheetName)
        if (teacherData) {
          teachers.push(teacherData)
        }
      }

      if (teachers.length === 0) {
        message.warning('未能从 Excel 中解析出有效数据')
        return
      }

      // 设置预览数据
      setImportPreview({
        teachers,
        year: selectedYear,
        month: selectedMonth,
        campus: currentCampus || selectedCampus,
      })
      setImportModalOpen(true)

      message.success(`成功解析 ${teachers.length} 位教员的数据`)
    } catch (error) {
      console.error('[Excel导入] 解析失败:', error)
      message.error('Excel 文件解析失败，请检查文件格式')
    } finally {
      // 重置文件输入
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  /**
   * 确认导入
   */
  const handleConfirmImport = async () => {
    if (!importPreview || importPreview.teachers.length === 0) {
      message.warning('没有可导入的数据')
      return
    }

    setImporting(true)
    setImportProgress(0)

    const { teachers, year, month, campus } = importPreview
    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < teachers.length; i++) {
      const teacher = teachers[i]
      try {
        await saveSelfCheckRecord({
          campus,
          teacherName: teacher.teacherName,
          year,
          month,
          dailyData: teacher.dailyData,
        })

        teacher.status = 'success'
        teacher.message = '导入成功'
        successCount++
      } catch (error) {
        teacher.status = 'error'
        teacher.message = `导入失败: ${error}`
        errorCount++
        console.error(`[Excel导入] 保存教员 ${teacher.teacherName} 失败:`, error)
      }

      setImportProgress(Math.round(((i + 1) / teachers.length) * 100))
      setImportPreview({ ...importPreview, teachers: [...teachers] })
    }

    setImporting(false)

    if (errorCount === 0) {
      message.success(`全部导入成功！共 ${successCount} 条记录`)
      setTimeout(() => {
        handleCloseImportModal()
        loadRecords()
      }, 1500)
    } else {
      message.warning(`导入完成：成功 ${successCount} 条，失败 ${errorCount} 条`)
    }
  }

  /**
   * 关闭导入弹窗
   */
  const handleCloseImportModal = () => {
    setImportModalOpen(false)
    setImportPreview(null)
    setImportProgress(0)
    setImporting(false)
  }

  return (
    <div style={{ padding: 24 }}>
      <Card>
        {/* 表头信息 */}
        <Row
          gutter={16}
          style={{ marginBottom: 24, padding: 16, backgroundColor: '#f5f5f5', borderRadius: 8 }}
        >
          <Col span={6}>
            <strong>神殿名称：</strong>
            {currentCampus || selectedCampus}
          </Col>
          <Col span={6}>
            <strong>年份：</strong>
            {selectedYear}
          </Col>
          <Col span={6}>
            <strong>月份：</strong>
            {selectedMonth}月
          </Col>
          <Col span={6}>
            <strong>教员姓名：</strong>
            <Select
              style={{ width: 160 }}
              value={statistics.currentMonthData?.teacherName}
              onChange={(value) => updateCurrentTeacherName(value)}
              placeholder="请选择教员"
              options={teacherOptions}
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              allowClear
            />
          </Col>
        </Row>

        <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
          {
            key: 'data',
            label: '数据录入',
            children: (<>
            {/* 筛选条件 */}
            <div
              style={{
                marginBottom: 16,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Space>
                <span>神殿：</span>
                <Select
                  value={currentCampus || selectedCampus}
                  onChange={handleCampusChange}
                  style={{ width: 120 }}
                  disabled
                >
                  <Option value="石美">石美</Option>
                  <Option value="盛邦">盛邦</Option>
                  <Option value="桂美">桂美</Option>
                  <Option value="台美">台美</Option>
                </Select>

                <span>年份：</span>
                <Select value={selectedYear} onChange={handleYearChange} style={{ width: 100 }}>
                  {Array.from({ length: 13 }, (_, i) => 2023 + i).map((year) => (
                    <Option key={year} value={year}>
                      {year}
                    </Option>
                  ))}
                </Select>

                <span>月份：</span>
                <Select value={selectedMonth} onChange={handleMonthChange} style={{ width: 100 }}>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <Option key={month} value={month}>
                      {month}月
                    </Option>
                  ))}
                </Select>
              </Space>

              <Input.Search
                placeholder="搜索教员姓名"
                style={{ width: 300 }}
                onSearch={handleSearch}
                allowClear
              />
              <span>教员：</span>
              <Select
                value={selectedRecordId || undefined}
                onChange={(value) => setSelectedRecordId(value)}
                style={{ width: 200 }}
                placeholder="选择教员"
              >
                {filteredData.map((record) => (
                  <Option key={record.id} value={record.id?.toString() || ''}>
                    {record.teacherName || '未填写'}
                  </Option>
                ))}
              </Select>
            </div>

            {/* 操作按钮 */}
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
              <Space>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                  新增自查记录
                </Button>
                <Button
                  icon={<EditOutlined />}
                  disabled={!statistics.currentMonthData}
                  onClick={() =>
                    statistics.currentMonthData && handleEdit(statistics.currentMonthData)
                  }
                >
                  编辑当前记录
                </Button>
                <Button
                  icon={<CheckCircleOutlined />}
                  type="dashed"
                  disabled={!statistics.currentMonthData}
                  onClick={handleSaveCurrentRecord}
                >
                  保存当前记录
                </Button>
                {/* Excel 导入按钮 */}
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept=".xlsx,.xls"
                  onChange={handleExcelUpload}
                />
                <Button
                  icon={<FileExcelOutlined />}
                  onClick={() => fileInputRef.current?.click()}
                >
                  从 Excel 导入
                </Button>
              </Space>
            </div>

            {/* 自查表格 */}
            <Table
              columns={generateCheckColumns()}
              dataSource={checkItems}
              rowKey={(record) => String(record.id)}
              loading={loading}
              scroll={{ x: 3000 }}
              pagination={false}
              bordered
              size="small"
            />
            </>),
          },
          {
            key: 'statistics',
            label: '统计分析',
            children: (<>
            {/* 统计概览 */}
            <Row
              gutter={16}
              style={{ marginBottom: 24, padding: 16, backgroundColor: '#f0f9ff', borderRadius: 8 }}
            >
              <Col span={6}>
                <Statistic
                  title="记录总数"
                  value={statistics.totalRecords}
                  suffix="条"
                  prefix={<FileTextOutlined />}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="新生访谈总数"
                  value={currentTotals.newStudentTotal}
                  suffix="人"
                  prefix={<TeamOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="线上宣传总数"
                  value={currentTotals.grandTotal}
                  suffix="条"
                  prefix={<ShareAltOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="日均宣传量"
                  value={statistics.monthlyAverages.grandTotalAvg}
                  suffix="条"
                  prefix={<BarChartOutlined />}
                />
              </Col>
            </Row>

            {/* 月度统计 */}
            <Card title="月度统计" style={{ marginBottom: 24 }}>
              <Row gutter={16}>
                <Col span={8}>
                  <Card size="small" title="学员访谈统计">
                    <Row gutter={16}>
                      <Col span={12}>
                        <Statistic
                          title="新生访谈"
                          value={currentTotals.newStudentTotal}
                          suffix="人"
                        />
                      </Col>
                      <Col span={12}>
                        <Statistic
                          title="老生访谈"
                          value={currentTotals.oldStudentTotal}
                          suffix="人"
                        />
                      </Col>
                    </Row>
                    <Row gutter={16} style={{ marginTop: 16 }}>
                      <Col span={12}>
                        <Statistic
                          title="毕业生访谈"
                          value={currentTotals.graduateTotal}
                          suffix="人"
                        />
                      </Col>
                      <Col span={12}>
                        <Statistic
                          title="访谈总计"
                          value={
                            currentTotals.newStudentTotal +
                            currentTotals.oldStudentTotal +
                            currentTotals.graduateTotal
                          }
                          suffix="人"
                        />
                      </Col>
                    </Row>
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size="small" title="线上宣传统计">
                    <Row gutter={16}>
                      <Col span={12}>
                        <Statistic
                          title="朋友圈"
                          value={currentTotals.wechatMomentsTotal}
                          suffix="条"
                        />
                      </Col>
                      <Col span={12}>
                        <Statistic title="抖音" value={currentTotals.douyinTotal} suffix="条" />
                      </Col>
                    </Row>
                    <Row gutter={16} style={{ marginTop: 16 }}>
                      <Col span={12}>
                        <Statistic title="快手" value={currentTotals.kuaishouTotal} suffix="条" />
                      </Col>
                      <Col span={12}>
                        <Statistic
                          title="小红书"
                          value={currentTotals.xiaohongshuTotal}
                          suffix="条"
                        />
                      </Col>
                    </Row>
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size="small" title="日均统计">
                    <Row gutter={16}>
                      <Col span={12}>
                        <Statistic
                          title="日均访谈"
                          value={
                            statistics.monthlyAverages.newStudentAvg +
                            statistics.monthlyAverages.oldStudentAvg +
                            statistics.monthlyAverages.graduateAvg
                          }
                          suffix="人"
                        />
                      </Col>
                      <Col span={12}>
                        <Statistic
                          title="日均宣传"
                          value={statistics.monthlyAverages.grandTotalAvg}
                          suffix="条"
                        />
                      </Col>
                    </Row>
                  </Card>
                </Col>
              </Row>
            </Card>
            </>),
          },
        ]} />

        {/* 说明信息 */}
        <Alert
          message="说明"
          description="此表用于记录智慧司口碑工作自查数据，包含学员访谈和线上宣传两大类别。支持按年份、月份筛选数据，自动计算月度总计和日均数据。✓表示是，✗表示否。"
          type="info"
          showIcon
          style={{ marginTop: 16 }}
        />
      </Card>

      {/* Excel 导入预览弹窗 */}
      <Modal
        title={
          <Space>
            <FileExcelOutlined style={{ color: '#52c41a' }} />
            Excel 数据导入预览
          </Space>
        }
        open={importModalOpen}
        onCancel={handleCloseImportModal}
        width={700}
        footer={[
          <Button key="cancel" onClick={handleCloseImportModal} disabled={importing}>
            取消
          </Button>,
          <Button
            key="import"
            type="primary"
            onClick={handleConfirmImport}
            loading={importing}
            disabled={!importPreview || importPreview.teachers.length === 0}
          >
            确认导入
          </Button>,
        ]}
      >
        {importPreview && (
          <>
            <Alert
              message="导入说明"
              description={
                <div>
                  <p>• 将导入到：<strong>{importPreview.campus}</strong> 神殿 <strong>{importPreview.year}年{importPreview.month}月</strong></p>
                  <p>• 如果教员当月已有记录，将<strong>覆盖更新</strong></p>
                  <p>• 支持的 Excel 格式：行=指标项，列=日期(1-31)</p>
                </div>
              }
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            {importing && (
              <Progress
                percent={importProgress}
                status={importProgress === 100 ? 'success' : 'active'}
                style={{ marginBottom: 16 }}
              />
            )}

            <List
              header={<div><strong>待导入教员列表</strong>（共 {importPreview.teachers.length} 位）</div>}
              bordered
              dataSource={importPreview.teachers}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      item.status === 'success' ? (
                        <CheckIcon style={{ color: '#52c41a', fontSize: 20 }} />
                      ) : item.status === 'error' ? (
                        <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: 20 }} />
                      ) : (
                        <TeamOutlined style={{ color: '#1890ff', fontSize: 20 }} />
                      )
                    }
                    title={
                      <Space>
                        <span>{item.teacherName || '未知教员'}</span>
                        {item.status === 'success' && <Tag color="success">已导入</Tag>}
                        {item.status === 'error' && <Tag color="error">失败</Tag>}
                        {item.status === 'pending' && <Tag color="processing">待导入</Tag>}
                      </Space>
                    }
                    description={
                      item.status === 'error'
                        ? item.message
                        : `已解析 ${Object.keys(item.dailyData).filter(
                            (d) => Object.keys(item.dailyData[d]).length > 0
                          ).length} 天的数据`
                    }
                  />
                </List.Item>
              )}
            />
          </>
        )}
      </Modal>

      {/* 添加/编辑模态框 */}
      <Modal
        title={editingRecord ? '编辑自查记录' : '新增自查记录'}
        open={modalVisible}
        onOk={handleSave}
        onCancel={() => {
          setModalVisible(false)
          form.resetFields()
        }}
        width={1000}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            campus: currentCampus || selectedCampus,
            year: selectedYear,
            month: selectedMonth,
            dailyData: {},
          }}
        >
          {/* 基本信息 */}
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="teacherName"
                label="教员姓名"
                rules={[{ required: true, message: '请输入教员姓名' }]}
              >
                <AutoComplete
                  placeholder="请选择或输入教员姓名"
                  options={teacherOptions}
                  filterOption={(inputValue, option) =>
                    option?.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                  }
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="campus"
                label="神殿"
                rules={[{ required: true, message: '请选择神殿' }]}
              >
                <Select disabled>
                  <Option value="石美">石美</Option>
                  <Option value="盛邦">盛邦</Option>
                  <Option value="桂美">桂美</Option>
                  <Option value="台美">台美</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="year"
                label="年份"
                rules={[{ required: true, message: '请选择年份' }]}
              >
                <Select>
                  {Array.from({ length: 13 }, (_, i) => 2023 + i).map((year) => (
                    <Option key={year} value={year}>
                      {year}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="month"
                label="月份"
                rules={[{ required: true, message: '请选择月份' }]}
              >
                <Select>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <Option key={month} value={month}>
                      {month}月
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Divider>每日数据录入</Divider>

          {/* 每日数据录入表格 */}
          <div style={{ maxHeight: 500, overflowY: 'auto' }}>
            {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
              <Card key={day} size="small" title={`${day}日`} style={{ marginBottom: 16 }}>
                <Row gutter={16}>
                  {/* 学员访谈 */}
                  <Col span={14}>
                    <Title level={5}>学员访谈</Title>
                    {/* 新生 */}
                    <Row gutter={8}>
                      <Col span={6}>
                        <Form.Item label="访谈新生数量" name={['dailyData', day, 'newStudentCount']}>
                          <InputNumber min={0} style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item label="新生姓名" name={['dailyData', day, 'newStudentNames']}>
                          <Input placeholder="姓名用逗号分隔" />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item label="是否填写访谈记录表" name={['dailyData', day, 'newStudentRecordFilled']}>
                          <Select placeholder="请选择" allowClear>
                            <Option value={true}>是</Option>
                            <Option value={false}>否</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item label="新生是否线上发作品" name={['dailyData', day, 'newStudentOnlineWorks']}>
                          <Select placeholder="请选择" allowClear>
                            <Option value={true}>是</Option>
                            <Option value={false}>否</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                    </Row>
                    {/* 老生 */}
                    <Row gutter={8}>
                      <Col span={6}>
                        <Form.Item label="访谈老生数量" name={['dailyData', day, 'oldStudentCount']}>
                          <InputNumber min={0} style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item label="老生班级" name={['dailyData', day, 'oldStudentClass']}>
                          <Input placeholder="班级代码" />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item label="老生姓名" name={['dailyData', day, 'oldStudentNames']}>
                          <Input placeholder="姓名用逗号分隔" />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item label="是否填写访谈记录表" name={['dailyData', day, 'oldStudentRecordFilled']}>
                          <Select placeholder="请选择" allowClear>
                            <Option value={true}>是</Option>
                            <Option value={false}>否</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                    </Row>
                    {/* 毕业生 */}
                    <Row gutter={8}>
                      <Col span={8}>
                        <Form.Item label="访谈毕业生数量" name={['dailyData', day, 'graduateCount']}>
                          <InputNumber min={0} style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item label="毕业生姓名" name={['dailyData', day, 'graduateNames']}>
                          <Input placeholder="姓名用逗号分隔" />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item label="是否填写访谈记录表" name={['dailyData', day, 'graduateRecordFilled']}>
                          <Select placeholder="请选择" allowClear>
                            <Option value={true}>是</Option>
                            <Option value={false}>否</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                    </Row>
                  </Col>
                  {/* 线上宣传 */}
                  <Col span={10}>
                    <Title level={5}>线上宣传</Title>
                    <Row gutter={8}>
                      <Col span={12}>
                        <Form.Item label="朋友圈数量" name={['dailyData', day, 'wechatMoments']}>
                          <InputNumber min={0} style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item label="抖音数量" name={['dailyData', day, 'douyin']}>
                          <InputNumber min={0} style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={8}>
                      <Col span={12}>
                        <Form.Item label="快手数量" name={['dailyData', day, 'kuaishou']}>
                          <InputNumber min={0} style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item label="小红书数量" name={['dailyData', day, 'xiaohongshu']}>
                          <InputNumber min={0} style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={8}>
                      <Col span={12}>
                        <Form.Item label="当天合计" tooltip="由朋友圈+抖音+快手+小红书自动计算">
                          <Input disabled placeholder="自动计算" />
                        </Form.Item>
                      </Col>
                    </Row>
                  </Col>
                </Row>
              </Card>
            ))}
          </div>
        </Form>
      </Modal>
    </div>
  )
}

export default ReputationSelfCheckPage
