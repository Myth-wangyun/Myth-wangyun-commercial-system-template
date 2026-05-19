import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { App,
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Space,
  Popconfirm,
  Row,
  Col,
  Statistic,
  Tag,
  Alert,
  InputNumber,
  Tooltip,
  Segmented,
  Empty,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CalendarOutlined,
  TeamOutlined,
  BookOutlined,
  ReloadOutlined,
  LeftOutlined,
  RightOutlined,
  CopyOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import 'dayjs/locale/zh-cn'
import { useCampusStore } from '@/stores/campusStore'
import { fetchClasses } from '@/services/configMaster'
import {
  fetchCourseSchedules,
  createCourseSchedule,
  updateCourseSchedule,
  deleteCourseSchedule,
  batchCreateCourseSchedules,
} from './service'
import type { CourseRecord } from './service'

dayjs.extend(isoWeek)
dayjs.locale('zh-cn')

const { Option } = Select
const { TextArea } = Input

// 粘贴导入时解析的课程数据
interface ParsedCourseData {
  date: string
  classCode: string
  courseName: string
  courseNumber: number
  instructor: string
  type: string
  color: string
  notes: string
}

// 班级信息类型
interface ClassInfo {
  code: string
  name: string
  graduationDate?: string
  description?: string
}

// 表单数据类型
interface CourseFormData {
  date: dayjs.Dayjs | null
  classCode: string
  courseName: string
  courseNumber: number
  instructor: string
  color: string
  type: string
  notes: string
}

// 课程类型配置
const COURSE_TYPES = {
  course: { label: '课程', color: '#1890ff' },
  exam: { label: '考试', color: '#ff4d4f' },
  holiday: { label: '假期', color: '#faad14' },
  interview: { label: '面试', color: '#722ed1' },
  graduation: { label: '毕业', color: '#52c41a' },
  relocation: { label: '搬神殿', color: '#13c2c2' },
  leave: { label: '请假', color: '#fa8c16' },
  review: { label: '复习', color: '#eb2f96' },
} as const

const CourseSchedulePage: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus, setCampus, getAllCampuses } = useCampusStore()
  const [dataSource, setDataSource] = useState<CourseRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<CourseRecord | null>(null)
  const [form] = Form.useForm<CourseFormData>()
  const [searchText, setSearchText] = useState('')
  const [viewMode, setViewMode] = useState<'week' | 'month' | 'list'>('week')
  
  // 当前查看的日期（用于周视图/月视图的导航）
  const [currentViewDate, setCurrentViewDate] = useState<dayjs.Dayjs>(dayjs())
  
  // 神殿和班级列表
  const [selectedCampus, setSelectedCampus] = useState<string>(
    currentCampus?.replace(/神殿$/, '') || ''
  )
  const [classList, setClassList] = useState<ClassInfo[]>([])
  const [loadingClasses, setLoadingClasses] = useState(false)
  const [selectedClassCode, setSelectedClassCode] = useState<string>('all')
  
  // 粘贴导入相关状态
  const [pasteModalVisible, setPasteModalVisible] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const [pasteLoading, setPasteLoading] = useState(false)
  const [parsedCourses, setParsedCourses] = useState<ParsedCourseData[]>([])
  const [parseError, setParseError] = useState<string>('')

  // 监听全局神殿选择器变化
  useEffect(() => {
    if (currentCampus) {
      const normalizedCampus = currentCampus.replace(/神殿$/, '')
      if (normalizedCampus !== selectedCampus) {
        setSelectedCampus(normalizedCampus)
        setSelectedClassCode('all')
      }
    }
  }, [currentCampus])

  // 动态提取课程数据中的班级并合并到班级列表
  useEffect(() => {
    if (dataSource.length === 0) return

    const existingClassCodes = new Set(classList.map(c => c.code))
    const newClasses: ClassInfo[] = []

    dataSource.forEach(record => {
      if (record.classCode && !existingClassCodes.has(record.classCode)) {
        existingClassCodes.add(record.classCode)
        newClasses.push({
          code: record.classCode,
          name: record.classCode,
          description: '从课表导入'
        })
      }
    })

    if (newClasses.length > 0) {
      setClassList(prev => [...prev, ...newClasses].sort((a, b) => a.code.localeCompare(b.code)))
    }
  }, [dataSource]) // 当课程数据变化时执行

  // 加载班级列表
  useEffect(() => {
    const loadClasses = async () => {
      if (!selectedCampus) return
      
      setLoadingClasses(true)
      try {
        const campusName = selectedCampus.endsWith('神殿') ? selectedCampus : `${selectedCampus}神殿`
        const campusInfo = useCampusStore.getState().getCampusByName(campusName)
        const campusCode = campusInfo?.code || campusInfo?.id || selectedCampus
        
        const classes = await fetchClasses({
          campus_name: campusName,
          campus_code: campusCode,
          active: true,
        })
        
        const classInfoList: ClassInfo[] = classes.map(c => ({
          code: c.class_code || c.class_name,
          name: c.class_name || c.class_code || '',
          graduationDate: c.end_date ? dayjs(c.end_date).format('YYYY年MM月毕业') : undefined,
        }))
        
        setClassList(classInfoList)
      } catch (error) {
        console.error('[班排课表] 加载班级列表失败:', error)
      } finally {
        setLoadingClasses(false)
      }
    }
    
    loadClasses()
  }, [selectedCampus])

  // 从后端加载课程数据
  const loadCourseData = useCallback(async () => {
    if (!selectedCampus) return
    
    setLoading(true)
    try {
      const campusName = selectedCampus.endsWith('神殿') ? selectedCampus : `${selectedCampus}神殿`
      
      // 根据视图模式计算日期范围
      let startDate: string
      let endDate: string
      
      if (viewMode === 'week') {
        startDate = currentViewDate.startOf('isoWeek').format('YYYY-MM-DD')
        endDate = currentViewDate.endOf('isoWeek').format('YYYY-MM-DD')
      } else if (viewMode === 'month') {
        startDate = currentViewDate.startOf('month').format('YYYY-MM-DD')
        endDate = currentViewDate.endOf('month').format('YYYY-MM-DD')
      } else {
        // 列表视图显示前后3个月的数据
        startDate = currentViewDate.subtract(1, 'month').startOf('month').format('YYYY-MM-DD')
        endDate = currentViewDate.add(2, 'month').endOf('month').format('YYYY-MM-DD')
      }
      
      const params: {
        campus?: string
        classCode?: string
        startDate?: string
        endDate?: string
      } = {
        campus: campusName,
        startDate,
        endDate,
      }
      
      if (selectedClassCode && selectedClassCode !== 'all') {
        params.classCode = selectedClassCode
      }
      
      const records = await fetchCourseSchedules(params)
      setDataSource(records)
    } catch (error) {
      console.error('[班排课表] 加载课程数据失败:', error)
      message.error('加载课程数据失败')
    } finally {
      setLoading(false)
    }
  }, [selectedCampus, selectedClassCode, currentViewDate, viewMode])

  // 数据加载
  useEffect(() => {
    if (selectedCampus) {
      loadCourseData()
    }
  }, [selectedCampus, selectedClassCode, currentViewDate, viewMode, loadCourseData])

  // 生成周的日期数组
  const weekDates = useMemo(() => {
    const start = currentViewDate.startOf('isoWeek')
    return Array.from({ length: 7 }, (_, i) => start.add(i, 'day'))
  }, [currentViewDate])

  // 生成月的日期数组（按周分组）
  const monthWeeks = useMemo(() => {
    const start = currentViewDate.startOf('month').startOf('isoWeek')
    const end = currentViewDate.endOf('month').endOf('isoWeek')
    const weeks: dayjs.Dayjs[][] = []
    let current = start
    
    while (current.isBefore(end) || current.isSame(end, 'day')) {
      const week: dayjs.Dayjs[] = []
      for (let i = 0; i < 7; i++) {
        week.push(current)
        current = current.add(1, 'day')
      }
      weeks.push(week)
    }
    
    return weeks
  }, [currentViewDate])

  // 按日期和班级索引课程数据
  const coursesByDateAndClass = useMemo(() => {
    const map: Record<string, Record<string, CourseRecord[]>> = {}
    dataSource.forEach(course => {
      if (!map[course.date]) {
        map[course.date] = {}
      }
      if (!map[course.date][course.classCode]) {
        map[course.date][course.classCode] = []
      }
      map[course.date][course.classCode].push(course)
    })
    return map
  }, [dataSource])

  // 显示的班级列表
  const displayClasses = useMemo(() => {
    if (selectedClassCode === 'all') {
      return classList
    }
    return classList.filter(c => c.code === selectedClassCode)
  }, [classList, selectedClassCode])

  // 导航函数
  const goToPrev = () => {
    if (viewMode === 'week') {
      setCurrentViewDate(prev => prev.subtract(1, 'week'))
    } else if (viewMode === 'month') {
      setCurrentViewDate(prev => prev.subtract(1, 'month'))
    }
  }

  const goToNext = () => {
    if (viewMode === 'week') {
      setCurrentViewDate(prev => prev.add(1, 'week'))
    } else if (viewMode === 'month') {
      setCurrentViewDate(prev => prev.add(1, 'month'))
    }
  }

  const goToToday = () => {
    setCurrentViewDate(dayjs())
  }

  // 统计数据
  const statistics = useMemo(() => ({
    totalCourses: dataSource.length,
    totalClasses: displayClasses.length,
    courseTypes: Object.entries(COURSE_TYPES).map(([type, config]) => ({
      type,
      label: config.label,
      count: dataSource.filter(item => item.type === type).length,
      color: config.color,
    })),
  }), [dataSource, displayClasses])

  // 解析粘贴的课程数据
  const parsePastedData = (text: string): ParsedCourseData[] => {
    const lines = text.split(/\r?\n/).filter(line => line.trim())
    if (lines.length < 2) {
      throw new Error('粘贴的数据至少需要包含表头和数据行')
    }

    console.log('[课程导入] 原始行数:', lines.length)
    console.log('[课程导入] 前3行:', lines.slice(0, 3))

    // 解析每一行（使用Tab分隔）
    const rows = lines.map((line, idx) => {
      if (!line.trim()) return []
      // 优先使用Tab分隔
      const cells = line.split('\t')
      if (idx < 3) {
        console.log(`[课程导入] 第${idx + 1}行解析(${cells.length}列):`, cells.slice(0, 5), '...')
      }
      return cells
    })

    // 检测是否是矩阵格式（第一行是班级列表，第一列是日期）
    const firstRow = rows[0] || []
    const secondRow = rows[1] || []
    
    // 判断是否为矩阵格式：
    // 1. 第一行有很多列（班级）
    // 2. 第一行的单元格看起来像班级代码（如 S32312, Y36, T155长期, 166短期, 168班 等）
    //    或者第一列是"日期"
    // 3. 后续行的第一列看起来像日期
    const firstCellLower = String(firstRow[0] || '').trim().toLowerCase()
    const isFirstColDate = firstCellLower === '日期' || firstCellLower === 'date'

    // 班级名称模式：支持任意字母开头+数字、纯数字、数字+班、数字+长期/短期、预科班、循环+班等
    const classNamePattern = /^[A-Z]\d+|^\d+|^预科|长期$|短期$|^循环\d*班$/i
    const hasClassLikeHeaders = firstRow.slice(1).some(cell => {
      const cellStr = String(cell || '').trim()
      return cellStr && classNamePattern.test(cellStr)
    })

    const isMatrixFormat = firstRow.length > 3 &&
      (isFirstColDate || hasClassLikeHeaders) &&
      /\d{4}年?\d{1,2}月?\d{1,2}日?|\d{4}[-\/]\d{1,2}[-\/]\d{1,2}|\d{1,2}月\d{1,2}日?/.test(String(secondRow[0] || '').trim())

    console.log('[课程导入] 是否为矩阵格式:', isMatrixFormat)

    if (isMatrixFormat) {
      return parseMatrixFormat(rows)
    } else {
      return parseRowFormat(rows)
    }
  }

  // 解析矩阵格式：第一行是班级，第一列是日期，交叉是课程
  const parseMatrixFormat = (rows: string[][]): ParsedCourseData[] => {
    const courses: ParsedCourseData[] = []

    // 第一行是班级列表（跳过第一个单元格，通常是空的或标题如"日期"）
    const headerRow = rows[0] || []
    // 使用 Map 记录列索引到班级名称的映射，避免跳过空列导致的索引错位
    const colToClassName = new Map<number, string>()

    for (let col = 1; col < headerRow.length; col++) {
      let className = String(headerRow[col] || '').trim()
      if (!className) continue // 跳过空列

      // 去掉括号内的说明（如 "S32312（2026年2月6左右毕业）" -> "S32312"）
      className = className.replace(/[\(（].*?[\)）]/g, '').trim()

      // 去掉"-xxx机房"等后缀用于显示
      const displayName = className.split('-')[0].trim()

      // 保留完整的班级名称（如 "T155长期", "166短期", "168", "预科班"）
      colToClassName.set(col, displayName || className)
    }

    const classNames = Array.from(colToClassName.values())
    console.log('[课程导入] 识别到班级列表:', classNames.slice(0, 10), '... 共', classNames.length, '个班级')

    // 从第二行开始解析数据
    for (let rowIdx = 1; rowIdx < rows.length; rowIdx++) {
      const row = rows[rowIdx]
      if (!row || row.length === 0) continue

      // 第一列是日期
      const dateStr = String(row[0] || '').trim()
      const parsedDate = parseDate(dateStr)

      if (!parsedDate) {
        console.log('[课程导入] 跳过无效日期行:', dateStr)
        continue
      }

      // 遍历每个班级列（使用 Map 中记录的列索引）
      for (let col = 1; col < row.length; col++) {
        const classCode = colToClassName.get(col)
        if (!classCode) continue // 该列不是班级列

        const cellContent = String(row[col] || '').trim()
        if (!cellContent) continue // 空单元格跳过

        // 解析单元格内容，提取课程名称和教师
        const { courseName, instructor, courseNumber, type } = parseCourseCell(cellContent)

        if (!courseName) continue

        // 根据内容确定类型
        const finalType = type
        const color = COURSE_TYPES[finalType as keyof typeof COURSE_TYPES]?.color || '#1890ff'

        courses.push({
          date: parsedDate,
          classCode,
          courseName,
          courseNumber,
          instructor,
          type: finalType,
          color,
          notes: '',
        })
      }
    }

    console.log('[课程导入] 矩阵格式解析完成，共', courses.length, '条课程记录')
    return courses
  }

  // 解析日期字符串
  const parseDate = (dateStr: string): string => {
    if (!dateStr) return ''
    
    // 支持多种日期格式
    const formats = [
      { regex: /^(\d{4})年(\d{1,2})月(\d{1,2})日?$/, handler: (m: RegExpMatchArray) => `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}` },
      { regex: /^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})$/, handler: (m: RegExpMatchArray) => `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}` },
      { regex: /^(\d{1,2})月(\d{1,2})日?$/, handler: (m: RegExpMatchArray) => `${dayjs().year()}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}` },
    ]

    for (const { regex, handler } of formats) {
      const match = dateStr.match(regex)
      if (match) {
        return handler(match)
      }
    }

    // 尝试 dayjs 直接解析
    const d = dayjs(dateStr)
    if (d.isValid()) {
      return d.format('YYYY-MM-DD')
    }

    return ''
  }

  // 解析课程单元格内容
  const parseCourseCell = (content: string): { courseName: string; instructor: string; courseNumber: number; type: string } => {
    let courseName = content
    let instructor = ''
    let courseNumber = 0
    let type = 'course'

    // 提取教师名（括号内的内容）
    const teacherMatch = content.match(/[\(（]([^)）]+)[\)）]$/)
    if (teacherMatch) {
      instructor = teacherMatch[1].trim()
      courseName = content.replace(/[\(（][^)）]+[\)）]$/, '').trim()
    }

    // 提取课程编号（如 "MAYA影视动漫模型-13" -> 13）
    const numMatch = courseName.match(/-(\d+)$/)
    if (numMatch) {
      courseNumber = parseInt(numMatch[1])
    }

    // 根据内容判断类型
    if (courseName.includes('考试')) {
      type = 'exam'
    } else if (courseName.includes('高温假') || courseName.includes('假期') || courseName.includes('休息')) {
      type = 'holiday'
    } else if (courseName.includes('面试')) {
      type = 'interview'
    } else if (courseName.includes('毕业')) {
      type = 'graduation'
    } else if (courseName.includes('搬神殿') || courseName.includes('搬')) {
      type = 'relocation'
    } else if (courseName.includes('请假') || courseName.includes('停课')) {
      type = 'leave'
    } else if (courseName.includes('复习')) {
      type = 'review'
    }

    return { courseName, instructor, courseNumber, type }
  }

  // 解析传统行格式
  const parseRowFormat = (rows: string[][]): ParsedCourseData[] => {
    // 查找表头行
    let headerRow = -1
    const headerMap: Record<string, number> = {}

    for (let i = 0; i < Math.min(10, rows.length); i++) {
      const row = rows[i] || []
      if (row.length === 0) continue

      let headerCount = 0
      const tempMap: Record<string, number> = {}

      row.forEach((cell, index) => {
        const cellStr = String(cell || '').trim().toLowerCase()
        if (!cellStr) return

        if (cellStr.includes('日期') || cellStr === '日期') {
          if (!tempMap['date']) { tempMap['date'] = index; headerCount++ }
        } else if (cellStr.includes('班级') || cellStr.includes('class') || cellStr === '班级') {
          if (!tempMap['classCode']) { tempMap['classCode'] = index; headerCount++ }
        } else if (cellStr.includes('课程名称') || cellStr.includes('课程') || cellStr.includes('内容')) {
          if (!tempMap['courseName']) { tempMap['courseName'] = index; headerCount++ }
        } else if (cellStr.includes('课程编号') || cellStr.includes('编号') || cellStr.includes('节次')) {
          if (!tempMap['courseNumber']) { tempMap['courseNumber'] = index; headerCount++ }
        } else if (cellStr.includes('教师') || cellStr.includes('授课') || cellStr.includes('讲师')) {
          if (!tempMap['instructor']) { tempMap['instructor'] = index; headerCount++ }
        } else if (cellStr.includes('类型')) {
          if (!tempMap['type']) { tempMap['type'] = index; headerCount++ }
        } else if (cellStr.includes('备注')) {
          if (!tempMap['notes']) { tempMap['notes'] = index; headerCount++ }
        }
      })

      if ((tempMap['date'] !== undefined || tempMap['classCode'] !== undefined) && 
          tempMap['courseName'] !== undefined && headerCount >= 2) {
        headerRow = i
        Object.assign(headerMap, tempMap)
        break
      }
    }

    if (headerRow === -1) {
      throw new Error('无法识别表头格式，请检查数据格式')
    }

    // 解析数据行
    const courses: ParsedCourseData[] = []
    let lastDate = ''
    let lastClassCode = selectedClassCode !== 'all' ? selectedClassCode : ''

    for (let i = headerRow + 1; i < rows.length; i++) {
      const row = rows[i]
      if (!row || row.length === 0 || row.every(c => !c)) continue

      let dateValue = headerMap['date'] !== undefined ? String(row[headerMap['date']] || '').trim() : ''
      if (!dateValue && lastDate) dateValue = lastDate
      
      const parsedDate = parseDate(dateValue)
      if (parsedDate) lastDate = parsedDate

      let classCode = headerMap['classCode'] !== undefined ? String(row[headerMap['classCode']] || '').trim() : ''
      if (!classCode && lastClassCode) classCode = lastClassCode
      if (classCode) lastClassCode = classCode

      const courseName = headerMap['courseName'] !== undefined ? String(row[headerMap['courseName']] || '').trim() : ''
      if (!courseName) continue

      let courseNumber = 0
      if (headerMap['courseNumber'] !== undefined) {
        const numStr = String(row[headerMap['courseNumber']] || '').trim()
        const parsed = parseInt(numStr.replace(/[^0-9]/g, ''))
        if (!isNaN(parsed)) courseNumber = parsed
      }

      const instructor = headerMap['instructor'] !== undefined ? String(row[headerMap['instructor']] || '').trim() : ''

      let type = 'course'
      if (courseName.includes('考试')) type = 'exam'
      else if (courseName.includes('假') || courseName.includes('休息')) type = 'holiday'
      else if (courseName.includes('面试')) type = 'interview'
      else if (courseName.includes('毕业')) type = 'graduation'
      else if (courseName.includes('搬')) type = 'relocation'
      else if (courseName.includes('请假') || courseName.includes('停课')) type = 'leave'
      else if (courseName.includes('复习')) type = 'review'

      const color = COURSE_TYPES[type as keyof typeof COURSE_TYPES]?.color || '#1890ff'
      const notes = headerMap['notes'] !== undefined ? String(row[headerMap['notes']] || '').trim() : ''

      courses.push({
        date: parsedDate || dayjs().format('YYYY-MM-DD'),
        classCode: classCode || (selectedClassCode !== 'all' ? selectedClassCode : classList[0]?.code || ''),
        courseName,
        courseNumber,
        instructor,
        type,
        color,
        notes,
      })
    }

    console.log('[课程导入] 行格式解析完成，共', courses.length, '条课程记录')
    return courses
  }

  // 处理粘贴文本变化
  const handlePasteTextChange = (text: string) => {
    setPasteText(text)
    setParseError('')
    setParsedCourses([])

    if (!text.trim()) return

    try {
      const courses = parsePastedData(text)
      setParsedCourses(courses)
      if (courses.length === 0) {
        setParseError('未能解析出有效的课程数据')
      }
    } catch (error: any) {
      console.error('[课程导入] 解析错误:', error)
      setParseError(error.message || '解析失败')
    }
  }

  // 执行导入
  const handlePasteImport = async () => {
    if (parsedCourses.length === 0) {
      message.warning('没有可导入的数据')
      return
    }

    if (!selectedCampus) {
      message.warning('请先选择神殿')
      return
    }

    setPasteLoading(true)
    const campusName = selectedCampus.endsWith('神殿') ? selectedCampus : `${selectedCampus}神殿`

    try {
      // 构造批量创建数据
      const coursesData = parsedCourses.map(course => ({
        神殿: campusName,
        班级代码: course.classCode,
        日期: course.date,
        课程名称: course.courseName,
        课程编号: course.courseNumber,
        授课教师: course.instructor,
        颜色: course.color,
        类型: course.type,
        备注: course.notes,
      }))

      // 批量创建
      const result = await batchCreateCourseSchedules(coursesData)

      if (result.成功数量 > 0) {
        message.success(`成功导入 ${result.成功数量} 条课程记录`)
        
        // 自动跳转到导入数据的第一天
        if (parsedCourses.length > 0) {
          // 找到最小日期
          const minDate = parsedCourses.reduce((min, curr) => {
            return (curr.date < min) ? curr.date : min
          }, parsedCourses[0].date)
          
          if (minDate) {
            const targetDate = dayjs(minDate)
            setCurrentViewDate(targetDate)
            message.info(`已跳转到数据日期: ${targetDate.format('YYYY-MM-DD')}`)
          }
        }

        // 刷新数据
        await loadCourseData()
      }
      
      if (result.失败数量 > 0) {
        message.warning(`${result.失败数量} 条记录导入失败${result.失败详情.length > 0 ? '，详见控制台' : ''}`)
        if (result.失败详情.length > 0) {
          console.error('[课程导入] 失败记录:', result.失败详情)
        }
      }

      // 关闭模态框
      setPasteModalVisible(false)
      setPasteText('')
      setParsedCourses([])
      setParseError('')
    } catch (error: any) {
      console.error('[课程导入] 导入失败:', error)
      message.error('导入失败: ' + (error.message || '未知错误'))
    } finally {
      setPasteLoading(false)
    }
  }

  // 处理添加
  const handleAdd = (date?: dayjs.Dayjs, classCode?: string) => {
    if (classList.length === 0) {
      message.warning('请先等待班级列表加载完成')
      return
    }
    setEditingRecord(null)
    form.resetFields()
    form.setFieldsValue({
      date: date || dayjs(),
      classCode: classCode || (displayClasses[0]?.code || ''),
      color: '#1890ff',
      type: 'course',
      courseNumber: 1,
    })
    setModalVisible(true)
  }

  // 处理编辑
  const handleEdit = (record: CourseRecord) => {
    setEditingRecord(record)
    form.setFieldsValue({
      ...record,
      date: dayjs(record.date),
    })
    setModalVisible(true)
  }

  // 处理删除
  const handleDelete = async (id: string) => {
    try {
      await deleteCourseSchedule(id)
      setDataSource(prev => prev.filter(item => item.id !== id))
      message.success('删除成功')
    } catch (error) {
      console.error('[班排课表] 删除失败:', error)
      message.error('删除失败')
    }
  }

  // 处理保存
  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      const campusName = selectedCampus.endsWith('神殿') ? selectedCampus : `${selectedCampus}神殿`
      
      const courseData = {
        神殿: campusName,
        班级代码: values.classCode,
        日期: values.date?.format('YYYY-MM-DD') || '',
        课程名称: values.courseName,
        课程编号: values.courseNumber || 0,
        授课教师: values.instructor || '',
        颜色: values.color || '#1890ff',
        类型: values.type || 'course',
        备注: values.notes || '',
      }
      
      if (editingRecord) {
        const updatedRecord = await updateCourseSchedule(editingRecord.id, courseData)
        setDataSource(prev => prev.map(item => item.id === editingRecord.id ? updatedRecord : item))
        message.success('更新成功')
      } else {
        const newRecord = await createCourseSchedule(courseData)
        setDataSource(prev => [...prev, newRecord])
        message.success('添加成功')
      }

      setModalVisible(false)
      form.resetFields()
    } catch (error: any) {
      console.error('[班排课表] 保存失败:', error)
      // 错误消息已在 service 或 api interceptor 中处理
    }
  }

  // 渲染课程单元格
  const renderCourseCell = (date: dayjs.Dayjs, classCode: string, isCompact = false) => {
    const dateStr = date.format('YYYY-MM-DD')
    const courses = coursesByDateAndClass[dateStr]?.[classCode] || []
    const isToday = date.isSame(dayjs(), 'day')
    const isCurrentMonth = date.isSame(currentViewDate, 'month')
    
    return (
      <div
        style={{
          minHeight: isCompact ? 60 : 80,
          padding: 4,
          backgroundColor: isToday ? '#e6f7ff' : (isCurrentMonth ? '#fff' : '#fafafa'),
          borderRadius: 4,
          cursor: 'pointer',
          transition: 'background-color 0.2s',
        }}
        onClick={() => courses.length === 0 && handleAdd(date, classCode)}
        onMouseEnter={(e) => {
          if (courses.length === 0) {
            e.currentTarget.style.backgroundColor = '#f0f0f0'
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = isToday ? '#e6f7ff' : (isCurrentMonth ? '#fff' : '#fafafa')
        }}
      >
        {courses.length > 0 ? (
          courses.map(course => (
            <Tooltip
              key={course.id}
              title={
                <div>
                  <div><strong>{course.courseName}</strong></div>
                  {course.courseNumber > 0 && <div>第{course.courseNumber}节课</div>}
                  {course.instructor && <div>教师: {course.instructor}</div>}
                  {course.notes && <div>备注: {course.notes}</div>}
                </div>
              }
            >
              <div
                style={{
                  backgroundColor: course.color || COURSE_TYPES[course.type as keyof typeof COURSE_TYPES]?.color || '#1890ff',
                  color: '#fff',
                  padding: '4px 6px',
                  borderRadius: 4,
                  fontSize: isCompact ? 11 : 12,
                  marginBottom: 2,
                  cursor: 'pointer',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  handleEdit(course)
                }}
              >
                <div style={{ fontWeight: 500 }}>
                  {course.courseName}
                  {course.courseNumber > 0 && <span style={{ opacity: 0.85, marginLeft: 4 }}>第{course.courseNumber}节</span>}
                </div>
                {course.instructor && (
                  <div style={{ fontSize: isCompact ? 10 : 11, opacity: 0.9 }}>教师: {course.instructor}</div>
                )}
              </div>
            </Tooltip>
          ))
        ) : (
          <div style={{ 
            height: '100%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: '#d9d9d9',
            fontSize: 16,
          }}>
            <PlusOutlined />
          </div>
        )}
      </div>
    )
  }

  // 渲染周视图
  const renderWeekView = () => {
    if (displayClasses.length === 0) {
      return <Empty description="暂无班级数据" />
    }

    return (
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <thead>
            <tr style={{ backgroundColor: '#fafafa' }}>
              <th style={{ 
                padding: '12px 8px', 
                border: '1px solid #f0f0f0', 
                width: 100,
                position: 'sticky',
                left: 0,
                backgroundColor: '#fafafa',
                zIndex: 1,
              }}>
                班级
              </th>
              {weekDates.map(date => (
                <th 
                  key={date.format('YYYY-MM-DD')} 
                  style={{ 
                    padding: '8px', 
                    border: '1px solid #f0f0f0',
                    minWidth: 120,
                    backgroundColor: date.isSame(dayjs(), 'day') ? '#e6f7ff' : '#fafafa',
                  }}
                >
                  <div style={{ fontWeight: 600 }}>{date.format('MM-DD')}</div>
                  <div style={{ fontSize: 12, color: '#666' }}>{date.format('ddd')}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayClasses.map(classInfo => (
              <tr key={classInfo.code}>
                <td style={{ 
                  padding: '8px', 
                  border: '1px solid #f0f0f0',
                  position: 'sticky',
                  left: 0,
                  backgroundColor: '#fff',
                  zIndex: 1,
                }}>
                  <div style={{ fontWeight: 500 }}>{classInfo.code}</div>
                  {classInfo.graduationDate && (
                    <div style={{ fontSize: 10, color: '#999' }}>{classInfo.graduationDate}</div>
                  )}
                </td>
                {weekDates.map(date => (
                  <td 
                    key={date.format('YYYY-MM-DD')} 
                    style={{ 
                      padding: 4, 
                      border: '1px solid #f0f0f0',
                      verticalAlign: 'top',
                    }}
                  >
                    {renderCourseCell(date, classInfo.code)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  // 渲染月视图
  const renderMonthView = () => {
    if (displayClasses.length === 0) {
      return <Empty description="暂无班级数据" />
    }

    // 月视图只显示第一个选中的班级
    const targetClass = displayClasses[0]

    return (
      <div>
        <div style={{ marginBottom: 8, color: '#666' }}>
          当前班级: <Tag color="blue">{targetClass.code}</Tag>
          {selectedClassCode === 'all' && displayClasses.length > 1 && (
            <span style={{ fontSize: 12, color: '#999' }}>（月视图仅显示第一个班级，请选择具体班级查看）</span>
          )}
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <thead>
            <tr style={{ backgroundColor: '#fafafa' }}>
              {['一', '二', '三', '四', '五', '六', '日'].map(day => (
                <th key={day} style={{ padding: '12px 8px', border: '1px solid #f0f0f0', textAlign: 'center' }}>
                  周{day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {monthWeeks.map((week, weekIndex) => (
              <tr key={weekIndex}>
                {week.map(date => (
                  <td 
                    key={date.format('YYYY-MM-DD')} 
                    style={{ 
                      padding: 4, 
                      border: '1px solid #f0f0f0',
                      verticalAlign: 'top',
                      height: 100,
                    }}
                  >
                    <div style={{ 
                      fontSize: 12, 
                      color: date.isSame(currentViewDate, 'month') ? '#333' : '#ccc',
                      marginBottom: 4,
                      fontWeight: date.isSame(dayjs(), 'day') ? 600 : 400,
                    }}>
                      {date.format('D')}
                    </div>
                    {renderCourseCell(date, targetClass.code, true)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  // 渲染列表视图
  const renderListView = () => {
    const filteredData = dataSource.filter(item => {
      const matchesSearch = !searchText ||
        item.courseName.toLowerCase().includes(searchText.toLowerCase()) ||
        item.instructor.toLowerCase().includes(searchText.toLowerCase()) ||
        item.classCode.toLowerCase().includes(searchText.toLowerCase())
      return matchesSearch
    })

    const columns = [
      {
        title: '日期',
        dataIndex: 'date',
        key: 'date',
        width: 100,
        sorter: (a: CourseRecord, b: CourseRecord) => a.date.localeCompare(b.date),
        render: (date: string) => (
          <div>
            <div>{dayjs(date).format('MM-DD')}</div>
            <div style={{ fontSize: 11, color: '#999' }}>{dayjs(date).format('ddd')}</div>
          </div>
        ),
      },
      {
        title: '班级',
        dataIndex: 'classCode',
        key: 'classCode',
        width: 100,
        render: (classCode: string) => <Tag color="blue">{classCode}</Tag>,
      },
      {
        title: '课程',
        dataIndex: 'courseName',
        key: 'courseName',
        render: (name: string, record: CourseRecord) => (
          <div>
            <div style={{ fontWeight: 500 }}>{name}</div>
            {record.courseNumber > 0 && (
              <div style={{ fontSize: 12, color: '#666' }}>第{record.courseNumber}课</div>
            )}
          </div>
        ),
      },
      {
        title: '教师',
        dataIndex: 'instructor',
        key: 'instructor',
        width: 80,
        render: (v: string) => v || '-',
      },
      {
        title: '类型',
        dataIndex: 'type',
        key: 'type',
        width: 80,
        render: (type: string) => {
          const config = COURSE_TYPES[type as keyof typeof COURSE_TYPES]
          return config ? <Tag color={config.color}>{config.label}</Tag> : type
        },
      },
      {
        title: '操作',
        key: 'action',
        width: 120,
        render: (_: any, record: CourseRecord) => (
          <Space size="small">
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
              编辑
            </Button>
            <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
              <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                删除
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ]

    return (
      <Table
        columns={columns}
        dataSource={filteredData}
        rowKey="id"
        loading={loading}
        size="small"
        pagination={{ defaultPageSize: 20, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
      />
    )
  }

  return (
    <div style={{ padding: 16 }}>
      <Card bodyStyle={{ padding: 16 }}>
        {/* 工具栏 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <Space wrap>
            <Select
              value={selectedCampus}
              onChange={(value) => {
                setSelectedCampus(value)
                setCampus(value.endsWith('神殿') ? value : `${value}神殿`)
              }}
              style={{ width: 120 }}
              loading={loadingClasses}
              placeholder="选择神殿"
            >
              {getAllCampuses().map(campus => (
                <Option key={campus.id} value={campus.name.replace(/神殿$/, '')}>
                  {campus.name}
                </Option>
              ))}
            </Select>

            <Select 
              value={selectedClassCode} 
              onChange={setSelectedClassCode} 
              style={{ width: 120 }}
              loading={loadingClasses}
            >
              <Option value="all">全部班级</Option>
              {classList.map(c => (
                <Option key={c.code} value={c.code}>{c.code}</Option>
              ))}
            </Select>

            <DatePicker
              value={currentViewDate}
              onChange={(date) => date && setCurrentViewDate(date)}
              picker={viewMode === 'month' ? 'month' : 'date'}
              allowClear={false}
            />

            <Segmented
              value={viewMode}
              onChange={(v) => setViewMode(v as 'week' | 'month' | 'list')}
              options={[
                { label: '周视图', value: 'week' },
                { label: '月视图', value: 'month' },
                { label: '列表', value: 'list' },
              ]}
            />
          </Space>

          <Space>
            {viewMode !== 'list' && (
              <>
                <Button icon={<LeftOutlined />} onClick={goToPrev} />
                <Button onClick={goToToday}>今天</Button>
                <Button icon={<RightOutlined />} onClick={goToNext} />
              </>
            )}
            <Button type="primary" icon={<PlusOutlined />} onClick={() => handleAdd()}>
              添加课程
            </Button>
            <Button icon={<CopyOutlined />} onClick={() => setPasteModalVisible(true)}>
              从剪切板导入
            </Button>
            <Button icon={<ReloadOutlined />} onClick={loadCourseData} loading={loading}>
              刷新
            </Button>
          </Space>
        </div>

        {/* 统计信息 */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={4}>
            <Statistic title="课程数" value={statistics.totalCourses} prefix={<BookOutlined />} />
          </Col>
          <Col span={4}>
            <Statistic title="班级数" value={statistics.totalClasses} prefix={<TeamOutlined />} />
          </Col>
          <Col span={16}>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center', height: '100%' }}>
              {statistics.courseTypes.filter(t => t.count > 0).map(t => (
                <div key={t.type} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 12, height: 12, backgroundColor: t.color, borderRadius: 2 }} />
                  <span style={{ fontSize: 13 }}>{t.label}</span>
                  <span style={{ fontSize: 12, color: '#999' }}>({t.count})</span>
                </div>
              ))}
            </div>
          </Col>
        </Row>

        {/* 视图标题 */}
        {viewMode !== 'list' && (
          <div style={{ marginBottom: 12, fontSize: 16, fontWeight: 500 }}>
            {viewMode === 'week' 
              ? `${currentViewDate.startOf('isoWeek').format('YYYY年MM月DD日')} - ${currentViewDate.endOf('isoWeek').format('MM月DD日')}`
              : currentViewDate.format('YYYY年MM月')
            }
          </div>
        )}

        {/* 列表视图搜索框 */}
        {viewMode === 'list' && (
          <div style={{ marginBottom: 12 }}>
            <Input.Search
              placeholder="搜索课程、教师或班级"
              style={{ width: 300 }}
              onSearch={setSearchText}
              allowClear
            />
          </div>
        )}

        {/* 内容区域 */}
        {loading && dataSource.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48 }}>加载中...</div>
        ) : (
          <>
            {viewMode === 'week' && renderWeekView()}
            {viewMode === 'month' && renderMonthView()}
            {viewMode === 'list' && renderListView()}
          </>
        )}

        {/* 说明 */}
        <Alert
          message="使用说明"
          description="周视图按班级显示一周的课程安排，月视图按日历显示单个班级的月度课程。点击空白单元格可快速添加课程，点击已有课程可编辑。"
          type="info"
          showIcon
          style={{ marginTop: 16 }}
        />
      </Card>

      {/* 添加/编辑模态框 */}
      <Modal
        title={editingRecord ? '编辑课程' : '添加课程'}
        open={modalVisible}
        onOk={handleSave}
        onCancel={() => {
          setModalVisible(false)
          form.resetFields()
        }}
        width={600}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="date" label="日期" rules={[{ required: true, message: '请选择日期' }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="classCode" label="班级" rules={[{ required: true, message: '请选择班级' }]}>
                <Select>
                  {classList.map(c => (
                    <Option key={c.code} value={c.code}>
                      {c.code} {c.graduationDate && `(${c.graduationDate})`}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="courseName" label="课程名称" rules={[{ required: true, message: '请输入课程名称' }]}>
                <Input placeholder="请输入课程名称" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="courseNumber" label="课程编号">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="instructor" label="授课教师">
                <Input placeholder="教师姓名" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="type" label="课程类型" rules={[{ required: true }]}>
                <Select>
                  {Object.entries(COURSE_TYPES).map(([key, config]) => (
                    <Option key={key} value={key}>{config.label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="color" label="颜色" rules={[{ required: true }]}>
                <Select>
                  {Object.entries(COURSE_TYPES).map(([key, config]) => (
                    <Option key={key} value={config.color}>
                      <span style={{ display: 'inline-block', width: 12, height: 12, backgroundColor: config.color, marginRight: 8, borderRadius: 2 }} />
                      {config.label}颜色
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="notes" label="备注">
            <TextArea placeholder="请输入备注信息" rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 粘贴导入模态框 */}
      <Modal
        title="从剪切板导入课程"
        open={pasteModalVisible}
        onOk={handlePasteImport}
        onCancel={() => {
          setPasteModalVisible(false)
          setPasteText('')
          setParsedCourses([])
          setParseError('')
        }}
        width={900}
        okText={`导入 (${parsedCourses.length} 条)`}
        okButtonProps={{ 
          disabled: parsedCourses.length === 0,
          loading: pasteLoading,
        }}
        destroyOnClose
      >
        <Alert
          message="使用说明"
          description={
            <div>
              <p>请从 Excel 或其他表格软件复制数据后粘贴到下方文本框。</p>
              <p><strong>支持两种格式：</strong></p>
              <p style={{ marginTop: 8, fontWeight: 500 }}>📊 格式一：矩阵格式（推荐）</p>
              <ul style={{ margin: '4px 0', paddingLeft: 20 }}>
                <li>第一行：班级列表（如 S32312、Y36、Y37...）</li>
                <li>第一列：日期（如 2025年5月6日、2025-05-06）</li>
                <li>交叉单元格：课程内容（如 "MAYA影视动漫模型-13（钱）"）</li>
              </ul>
              <p style={{ marginTop: 8, fontWeight: 500 }}>📋 格式二：行列表格式</p>
              <ul style={{ margin: '4px 0', paddingLeft: 20 }}>
                <li>表头包含：日期、班级、课程名称、教师等列</li>
                <li>每行一条课程记录</li>
              </ul>
              <p style={{ color: '#666', fontSize: 12, marginTop: 8 }}>
                提示：课程内容中的括号内文字会被识别为教师名，如"MAYA-13（钱）"会提取教师"钱"
              </p>
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <TextArea
          value={pasteText}
          onChange={(e) => handlePasteTextChange(e.target.value)}
          placeholder={`在此粘贴表格数据...\n\n示例：\n日期\t班级\t课程名称\t教师\t备注\n2025-01-15\tY36\tJava基础\t张老师\t第1节\n2025-01-15\tY36\tMySQL数据库\t李老师\t第2节`}
          rows={8}
          style={{ marginBottom: 16, fontFamily: 'monospace' }}
        />

        {parseError && (
          <Alert
            message="解析错误"
            description={<pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: 12 }}>{parseError}</pre>}
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {parsedCourses.length > 0 && (
          <div>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>
              预览（共 {parsedCourses.length} 条记录）
            </div>
            <Table
              dataSource={parsedCourses.map((c, i) => ({ ...c, key: i }))}
              columns={[
                { 
                  title: '日期', 
                  dataIndex: 'date', 
                  width: 100,
                  render: (d: string) => d ? dayjs(d).format('MM-DD') : '-'
                },
                { 
                  title: '班级', 
                  dataIndex: 'classCode', 
                  width: 80,
                  render: (c: string) => c ? <Tag color="blue">{c}</Tag> : '-'
                },
                { title: '课程名称', dataIndex: 'courseName', ellipsis: true },
                { 
                  title: '节次', 
                  dataIndex: 'courseNumber', 
                  width: 60,
                  render: (n: number) => n > 0 ? `第${n}节` : '-'
                },
                { title: '教师', dataIndex: 'instructor', width: 80, render: (v: string) => v || '-' },
                { 
                  title: '类型', 
                  dataIndex: 'type', 
                  width: 70,
                  render: (t: string) => {
                    const config = COURSE_TYPES[t as keyof typeof COURSE_TYPES]
                    return config ? <Tag color={config.color}>{config.label}</Tag> : t
                  }
                },
                { title: '备注', dataIndex: 'notes', width: 100, ellipsis: true, render: (v: string) => v || '-' },
              ]}
              size="small"
              pagination={{ pageSize: 10, showSizeChanger: false }}
              scroll={{ y: 300 }}
            />
          </div>
        )}
      </Modal>
    </div>
  )
}

export default CourseSchedulePage
