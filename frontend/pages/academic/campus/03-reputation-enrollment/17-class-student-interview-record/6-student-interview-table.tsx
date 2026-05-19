// 学术->学术经理->管理表格 XX班级学员访谈情况记录表
import React, { useState, useEffect, useRef } from 'react'
import { App,
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  Popconfirm,
  Row,
  Col,
  Statistic,
  Tag,
  Alert,
  Tooltip,
  Tabs,
  DatePicker,
  AutoComplete,
  Spin,
  Progress,
  List,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CalendarOutlined,
  TeamOutlined,
  UserOutlined,
  MessageOutlined,
  UsergroupAddOutlined,
  FileExcelOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { useCampusStore } from '@/stores/campusStore'
import { useConfigOptions } from '@/hooks/useConfigOptions'
import {
  fetchStudentInterviewRecords,
  saveStudentInterviewRecords,
  fetchInterviewClassNames,
} from '@/services/studentInterviews'
import { fetchTeachers, fetchClasses } from '@/services/configMaster'
import type { ClassProfile } from '@/services/configMaster'
import { buildApiUrl, apiFetch } from '@/utils/apiBase'
import * as XLSX from 'xlsx'

// 班级档案学生信息类型
interface ClassFileStudent {
  name: string
  gender?: string
  idCard?: string
  studentStatus?: string
  className?: string
  campusName?: string
}

const { Option } = Select
const { TextArea } = Input
// 访谈记录数据类型
interface InterviewRecord {
  id: string
  studentName: string
  studentId: string
  interviewer: string
  month: number
  year: number
  content: string
  interviewDate: string
  classCode: string
  campus: string
  majorName: string
  createdAt?: string
  updatedAt?: string
}

// 表单数据类型
interface InterviewFormData {
  studentName: string
  studentId: string
  interviewer: string
  month: number
  year: number
  content: string
  interviewDate: dayjs.Dayjs | null
  classCode: string
}

// Excel 导入相关类型
interface ImportedClassData {
  classCode: string
  className: string
  records: {
    studentName: string
    interviewer: string
    content: string
    month: number
    year: number
  }[]
  status?: 'pending' | 'success' | 'error'
  message?: string
}

interface ImportPreview {
  classes: ImportedClassData[]
  campus: string
  year: number
}

const StudentInterviewTablePage: React.FC = () => {
  const { message } = App.useApp()
  const [dataSource, setDataSource] = useState<InterviewRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<InterviewRecord | null>(null)
  const [form] = Form.useForm<InterviewFormData>()
  const [searchText, setSearchText] = useState('')
  const [selectedClassCode, setSelectedClassCode] = useState('S32106')
  const [selectedStudent, setSelectedStudent] = useState<string>('all')
  const [selectedInterviewer, setSelectedInterviewer] = useState<string>('all')
  const [selectedMonth, setSelectedMonth] = useState<number>(0)
  const [selectedYear, setSelectedYear] = useState<number>(dayjs().year())
  const [activeTab, setActiveTab] = useState('all')
  const { currentCampus } = useCampusStore()
  const [teacherOptions, setTeacherOptions] = useState<{ value: string; label: string }[]>([])
  const [teacherLoading, setTeacherLoading] = useState(false)
  const [classList, setClassList] = useState<ClassProfile[]>([])
  const [classLoading, setClassLoading] = useState(false)
  // 班级档案学生列表
  const [classFileStudents, setClassFileStudents] = useState<ClassFileStudent[]>([])
  const [studentsLoading, setStudentsLoading] = useState(false)

  // Excel 导入相关状态
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null)
  const [importing, setImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 所有班级数据（用于按班级/学员/教员/月份展示）- 需要在 allFilteredData 之前定义
  const [allClassesData, setAllClassesData] = useState<Record<string, InterviewRecord[]>>({})
  const [allRecordsData, setAllRecordsData] = useState<InterviewRecord[]>([]) // 所有记录的扁平数组
  const [loadingAllClasses, setLoadingAllClasses] = useState(false)

  const campusName = currentCampus || '主神殿'

  // 专业名称选择状态
  const [selectedMajorName, setSelectedMajorName] = useState<string>('')

  // 从配置中心获取专业、班级选项
  const { 
    majors: configMajorOptions, 
    classes: configClassOptions, 
    loading: configLoading 
  } = useConfigOptions({
    campusName: campusName,
    majorName: selectedMajorName || undefined,
  })
  
  // 专业名称：优先使用用户选择的值，否则跟随选中的班级变化
  const majorName = React.useMemo(() => {
    if (selectedMajorName) {
      return selectedMajorName
    }
    const selectedClass = classList.find((c) => c.class_name === selectedClassCode)
    if (selectedClass?.major_name) {
      return selectedClass.major_name
    }
    // 如果班级没有专业名称，尝试从数据源获取
    return dataSource[0]?.majorName || ''
  }, [selectedMajorName, classList, selectedClassCode, dataSource])

  const yearOptions = React.useMemo(() => {
    const currentYearValue = dayjs().year()
    const startYear = 2023
    const options: number[] = []
    for (let y = currentYearValue; y >= startYear; y -= 1) {
      options.push(y)
    }
    return options
  }, [])

  const loadInterviewRecords = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetchStudentInterviewRecords({
        campus: campusName,
        class_code: selectedClassCode,
        class_name: `${selectedClassCode}班`,
      })
      const normalized = (res.records || []).map((item, index) => ({
        id: `${item.student_name}-${item.interview_date}-${index}`,
        studentName: item.student_name,
        studentId: item.student_id || '',
        interviewer: item.interviewer,
        month: item.month,
        year: item.year,
        content: item.content,
        interviewDate: item.interview_date,
        classCode: item.class_code,
        campus: item.campus,
        majorName: item.major_name || '',
      }))
      setDataSource(normalized)
    } catch (error) {
      console.error('加载访谈记录失败', error)
      message.error('加载访谈记录失败，请稍后重试')
      setDataSource([])
    } finally {
      setLoading(false)
    }
  }, [campusName, selectedClassCode])

  useEffect(() => {
    loadInterviewRecords()
  }, [loadInterviewRecords])

  // 加载教员列表（配置中心 + 数据库并集）
  const loadTeachers = React.useCallback(async () => {
    setTeacherLoading(true)
    try {
      // 1. 从配置中心获取教员
      const teacherList = await fetchTeachers({ active: true })
      const configTeachers = teacherList
        .filter((teacher) => teacher.name)
        .map((teacher) => ({
          value: teacher.name,
          label: `${teacher.name}（${teacher.campus_name || teacher.campus_code || '未知神殿'}）`,
        }))

      // 2. 从数据库访谈记录中获取教员
      const dbTeachers = Array.from(new Set(dataSource.map((r) => r.interviewer)))
        .filter((name) => name)
        .map((name) => ({
          value: name,
          label: name,
        }))

      // 3. 合并去重（按 value 去重）
      const teacherMap = new Map<string, { value: string; label: string }>()
      configTeachers.forEach((t) => teacherMap.set(t.value, t))
      dbTeachers.forEach((t) => {
        if (!teacherMap.has(t.value)) {
          teacherMap.set(t.value, t)
        }
      })

      const mergedTeachers = Array.from(teacherMap.values()).sort((a, b) =>
        a.value.localeCompare(b.value),
      )
      setTeacherOptions(mergedTeachers)
    } catch (error) {
      console.error('加载教员列表失败', error)
      message.error('加载教员列表失败，请稍后再试')
      setTeacherOptions([])
    } finally {
      setTeacherLoading(false)
    }
  }, [dataSource])

  useEffect(() => {
    loadTeachers()
  }, [loadTeachers])

  // 加载班级列表（配置中心 + 数据库并集）
  const loadClasses = React.useCallback(async () => {
    setClassLoading(true)
    try {
      // 1. 从配置中心获取班级
      const classes = await fetchClasses({ campus_name: campusName, active: true })
      console.log('[loadClasses] 配置中心班级:', classes.map((c) => c.class_name))

      // 2. 从数据库访谈记录中获取班级名称（使用专门的 API）
      let dbClassNames: string[] = []
      try {
        dbClassNames = await fetchInterviewClassNames(campusName)
        console.log('[loadClasses] 数据库班级名称:', dbClassNames)
      } catch (error) {
        console.log('获取数据库班级列表失败，仅使用配置中心数据', error)
      }

      // 3. 合并去重
      const classNameSet = new Set(classes.map((c) => c.class_name))
      const additionalClasses: ClassProfile[] = dbClassNames
        .filter((name) => !classNameSet.has(name))
        .map((name) => ({
          id: `db-${name}` as unknown as number,
          class_name: name,
          campus_name: campusName,
          major_name: '',
          is_active: true,
        }))

      const mergedClasses = [...classes, ...additionalClasses].sort((a, b) =>
        a.class_name.localeCompare(b.class_name),
      )

      console.log('[loadClasses] 合并后班级列表:', mergedClasses.map((c) => c.class_name))
      setClassList(mergedClasses)

      // 如果有班级数据且当前选中的班级不在列表中，选中第一个
      if (mergedClasses.length > 0) {
        const classNames = mergedClasses.map((c) => c.class_name)
        if (!classNames.includes(selectedClassCode)) {
          setSelectedClassCode(mergedClasses[0].class_name)
        }
      }
    } catch (error) {
      console.error('加载班级列表失败', error)
      message.error('加载班级列表失败')
    } finally {
      setClassLoading(false)
    }
  }, [campusName, selectedClassCode])

  useEffect(() => {
    loadClasses()
  }, [loadClasses])

  // 加载班级档案中的学生列表
  const loadClassFileStudents = React.useCallback(async () => {
    if (!selectedClassCode) {
      setClassFileStudents([])
      return
    }
    setStudentsLoading(true)
    try {
      const params = new URLSearchParams({
        campus: campusName,
        class: selectedClassCode,
      })
      const res = await fetch(buildApiUrl(`/teaching-quality/class-file/search-students?${params.toString()}`))
      if (res.ok) {
        const students: ClassFileStudent[] = await res.json()
        setClassFileStudents(students)
      } else {
        console.error('加载班级学生列表失败')
        setClassFileStudents([])
      }
    } catch (error) {
      console.error('加载班级学生列表失败', error)
      setClassFileStudents([])
    } finally {
      setStudentsLoading(false)
    }
  }, [campusName, selectedClassCode])

  useEffect(() => {
    loadClassFileStudents()
  }, [loadClassFileStudents])

  // 学生选项列表（用于 AutoComplete）
  const studentAutoCompleteOptions = React.useMemo(() => {
    const nameSet = new Set<string>()
    // 班级档案中的学生
    classFileStudents.forEach((s) => s.name && nameSet.add(s.name))
    // 已有访谈记录中的学生
    dataSource.forEach((r) => r.studentName && nameSet.add(r.studentName))
    return Array.from(nameSet).sort().map((name) => ({ value: name, label: name }))
  }, [classFileStudents, dataSource])

  const statistics = React.useMemo(() => {
    const interviewsThisYear = dataSource.filter((item) => item.year === selectedYear)
    const interviewsThisMonth =
      selectedMonth === 0
        ? interviewsThisYear.length
        : interviewsThisYear.filter((item) => item.month === selectedMonth).length
    return {
      totalInterviews: dataSource.length,
      totalStudents: new Set(dataSource.map((item) => item.studentName)).size,
      totalInterviewers: new Set(dataSource.map((item) => item.interviewer)).size,
      thisMonthInterviews: interviewsThisMonth,
    }
  }, [dataSource, selectedMonth, selectedYear])

  // 学员列表（班级档案 + 数据库并集）
  const studentList = React.useMemo(() => {
    const nameSet = new Set<string>()
    // 从班级档案获取
    classFileStudents.forEach((s) => s.name && nameSet.add(s.name))
    // 从数据库访谈记录获取
    dataSource.forEach((r) => r.studentName && nameSet.add(r.studentName))
    return Array.from(nameSet)
      .sort()
      .map((name) => ({
        value: name,
        label: name,
      }))
  }, [dataSource, classFileStudents])

  // 教员列表（直接使用 teacherOptions，已经是并集）
  const interviewerList = React.useMemo(() => {
    return teacherOptions
  }, [teacherOptions])

  const columns: ColumnsType<InterviewRecord> = [
    {
      title: '序号',
      dataIndex: 'index',
      key: 'index',
      width: 60,
      render: (_: unknown, __: InterviewRecord, index: number) => index + 1,
    },
    {
      title: '访谈对象',
      dataIndex: 'studentName',
      key: 'studentName',
      width: 100,
      fixed: 'left' as const,
      render: (name: string, record: InterviewRecord) => (
        <Button
          type="link"
          onClick={() => handleViewDetails(record)}
          style={{ padding: 0, height: 'auto' }}
        >
          {name}
        </Button>
      ),
    },
    {
      title: '学员编号',
      dataIndex: 'studentId',
      key: 'studentId',
      width: 80,
    },
    {
      title: '访谈人',
      dataIndex: 'interviewer',
      key: 'interviewer',
      width: 100,
      render: (interviewer: string) => <Tag color="blue">{interviewer}</Tag>,
    },
    {
      title: '访谈月份',
      dataIndex: 'month',
      key: 'month',
      width: 80,
      render: (month: number) => `${month}月`,
    },
    {
      title: '访谈日期',
      dataIndex: 'interviewDate',
      key: 'interviewDate',
      width: 100,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '访谈内容',
      dataIndex: 'content',
      key: 'content',
      width: 300,
      render: (content: string) => (
        <Tooltip title={content}>
          <div
            style={{
              maxWidth: 300,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {content}
          </div>
        </Tooltip>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right' as const,
      render: (_: unknown, record: InterviewRecord) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这条记录吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" icon={<DeleteOutlined />} danger size="small">
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  // 处理查看详情
  const handleViewDetails = (record: InterviewRecord) => {
    setEditingRecord(record)
    form.setFieldsValue({
      studentName: record.studentName,
      studentId: record.studentId,
      interviewer: record.interviewer,
      month: record.month,
      year: record.year,
      content: record.content,
      classCode: record.classCode,
      interviewDate: dayjs(record.interviewDate),
    })
    setModalVisible(true)
  }

  // 处理添加
  const handleAdd = () => {
    setEditingRecord(null)
    form.resetFields()
    form.setFieldsValue({
      classCode: selectedClassCode,
      year: selectedYear,
      month: selectedMonth || dayjs().month() + 1,
      interviewDate: dayjs(),
    })
    setModalVisible(true)
  }

  // 处理编辑
  const handleEdit = (record: InterviewRecord) => {
    setEditingRecord(record)
    form.setFieldsValue({
      studentName: record.studentName,
      studentId: record.studentId,
      interviewer: record.interviewer,
      month: record.month,
      year: record.year,
      content: record.content,
      classCode: record.classCode,
      interviewDate: dayjs(record.interviewDate),
    })
    setModalVisible(true)
  }

  // 处理删除
  const handleDelete = (id: string) => {
    setDataSource((prev) => prev.filter((item) => item.id !== id))
    message.success('删除成功')
  }

  const handleSaveRecords = async () => {
    if (!dataSource.length) {
      message.info('暂无可保存的数据')
      return
    }
    setSaving(true)
    try {
      await saveStudentInterviewRecords({
        campus: campusName,
        class_code: selectedClassCode,
        class_name: `${selectedClassCode}班`,
        records: dataSource.map((record) => ({
          student_name: record.studentName,
          student_id: record.studentId,
          interviewer: record.interviewer,
          month: record.month,
          year: record.year,
          content: record.content,
          interview_date: record.interviewDate,
          class_code: record.classCode,
          class_name: `${record.classCode}班`,
          campus: record.campus || campusName,
          major_name: record.majorName,
        })),
      })
      message.success('访谈记录已保存')
      // 刷新当前选中班级的数据（用于"全部记录"标签页）
      await loadInterviewRecords()
      // 刷新所有班级的数据（用于"按学员/教员/月份/班级展示"标签页）
      await loadAllClassesData()
    } catch (error) {
      console.error(error)
      message.error('保存失败，请稍后再试')
    } finally {
      setSaving(false)
    }
  }

  // 从班档案表导入学员（排除退费明细表中的学员）
  const handleGenerateStudentsFromArchive = async () => {
    if (!currentCampus) {
      message.warning('请先选择神殿')
      return
    }
    if (!selectedClassCode) {
      message.warning('请先选择班级')
      return
    }

    try {
      setLoading(true)
      const campusNameNorm = campusName.replace(/神殿$/, '')

      // 尝试从班档案表获取学员列表
      const tryFetchClassFile = async (campusArg: string) => {
        const res = await fetch(
          buildApiUrl(
            `/teaching-quality/class-file?campus=${encodeURIComponent(campusArg)}&class=${encodeURIComponent(selectedClassCode)}`,
          ),
        )
        if (!res.ok) return null
        const data = await res.json()
        return data
      }

      let archiveData = await tryFetchClassFile(campusNameNorm)
      if (!archiveData || !archiveData.行列表 || archiveData.行列表.length === 0) {
        archiveData = await tryFetchClassFile(`${campusNameNorm}神殿`)
      }
      if (!archiveData || !archiveData.行列表 || archiveData.行列表.length === 0) {
        archiveData = await tryFetchClassFile(campusName)
      }

      if (!archiveData || !archiveData.行列表 || archiveData.行列表.length === 0) {
        message.warning('未找到该班级的档案数据，请确认神殿和班级是否正确')
        return
      }

      // 获取退费明细表中的学员名单
      const refundedNames = new Set<string>()
      const refundedIds = new Set<string>()

      const currentYear = dayjs().year()
      const tryFetchRefund = async (campusArg: string) => {
        const names = new Set<string>()
        const ids = new Set<string>()
        for (let m = 1; m <= 12; m++) {
          try {
            const res = await fetch(
              buildApiUrl(
                `/teaching-quality/campus-refund-detail?campus=${encodeURIComponent(campusArg)}&year=${currentYear}&month=${m}`,
              ),
            )
            if (res.ok) {
              const data = await res.json()
              ;(data.行列表 || []).forEach((row: any) => {
                const name = (row.name || row.姓名 || '').trim()
                const idCard = (row.idCard || row.身份证号 || '').trim()
                if (name) names.add(name)
                if (idCard) ids.add(idCard)
              })
            }
          } catch {
            // 忽略单个月份获取失败
          }
        }
        return { names, ids }
      }

      let refundResult = await tryFetchRefund(campusNameNorm)
      if (refundResult.names.size === 0) {
        refundResult = await tryFetchRefund(`${campusNameNorm}神殿`)
      }
      if (refundResult.names.size === 0) {
        refundResult = await tryFetchRefund(campusName)
      }

      refundResult.names.forEach((n) => refundedNames.add(n))
      refundResult.ids.forEach((id) => refundedIds.add(id))

      // 获取已存在的学员（按学员名+月份判断）
      const existingKeys = new Set(
        dataSource.map((s) => `${s.studentName}-${s.year}-${s.month}`),
      )

      const newRecords: InterviewRecord[] = []
      let refundedCount = 0
      let studentCount = 0

      archiveData.行列表.forEach((row: any, idx: number) => {
        const name = (row.name || row.姓名 || '').trim()
        const idCard = (row.idCard || row.身份证号 || '').trim()
        const studentId =
          idCard || `${selectedClassCode}-${String(row.serialNumber || idx + 1).padStart(2, '0')}`

        // 跳过空名字
        if (!name) {
          return
        }
        // 跳过已退费的学员
        if (refundedNames.has(name) || (idCard && refundedIds.has(idCard))) {
          refundedCount++
          return
        }

        // 为该学员生成12个月的访谈记录
        const year = selectedYear
        let addedForStudent = false
        for (let month = 1; month <= 12; month++) {
          const key = `${name}-${year}-${month}`
          // 跳过已存在的记录
          if (existingKeys.has(key)) {
            continue
          }

          // 生成该月份的默认日期（每月1号）
          const defaultDate = dayjs(`${year}-${String(month).padStart(2, '0')}-01`).format('YYYY-MM-DD')

          newRecords.push({
            id: `${Date.now()}-${idx}-${month}`,
            studentName: name,
            studentId: studentId,
            interviewer: '',
            month: month,
            year: year,
            content: '',
            interviewDate: defaultDate,
            classCode: selectedClassCode,
            campus: campusName,
            majorName: row.reportedMajor || row.所报专业 || '',
          })
          addedForStudent = true
        }
        if (addedForStudent) {
          studentCount++
        }
      })

      if (newRecords.length === 0) {
        message.info(
          refundedCount > 0
            ? `所有学员已存在或已退费（排除退费学员 ${refundedCount} 人）`
            : '所有学员已存在，无需导入',
        )
        return
      }

      setDataSource((prev) => [...prev, ...newRecords])
      message.success(
        `成功导入 ${studentCount} 名学员（共 ${newRecords.length} 条记录）${refundedCount > 0 ? `，排除退费学员 ${refundedCount} 人` : ''}`,
      )
    } catch (error) {
      console.error('导入学员失败', error)
      message.error('导入学员失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  // 处理保存
  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      const formattedRecord: InterviewRecord = {
        id: editingRecord?.id ?? Date.now().toString(),
        studentName: values.studentName,
        studentId: values.studentId,
        interviewer: values.interviewer,
        month: values.month,
        year: values.year,
        content: values.content,
        interviewDate: values.interviewDate?.format('YYYY-MM-DD') || dayjs().format('YYYY-MM-DD'),
        classCode: values.classCode || selectedClassCode,
        campus: editingRecord?.campus || campusName,
        majorName: editingRecord?.majorName || '',
        createdAt: editingRecord?.createdAt ?? dayjs().format('YYYY-MM-DD HH:mm:ss'),
        updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      }

      // 立即保存到后端
      setSaving(true)
      try {
        await saveStudentInterviewRecords({
          campus: campusName,
          class_code: formattedRecord.classCode,
          class_name: `${formattedRecord.classCode}班`,
          records: [{
            student_name: formattedRecord.studentName,
            student_id: formattedRecord.studentId,
            interviewer: formattedRecord.interviewer,
            month: formattedRecord.month,
            year: formattedRecord.year,
            content: formattedRecord.content,
            interview_date: formattedRecord.interviewDate,
            class_code: formattedRecord.classCode,
            class_name: `${formattedRecord.classCode}班`,
            campus: formattedRecord.campus || campusName,
            major_name: formattedRecord.majorName,
          }],
        })

        if (editingRecord) {
          message.success('更新成功')
        } else {
          message.success('添加成功')
        }

        // 刷新数据
        await loadInterviewRecords()
        await loadAllClassesData()

        setModalVisible(false)
        form.resetFields()
        setEditingRecord(null)
      } catch (error) {
        console.error('保存失败:', error)
        message.error('保存失败，请稍后再试')
      } finally {
        setSaving(false)
      }
    } catch (error) {
      console.error('表单验证失败:', error)
    }
  }

  // 处理搜索
  const handleSearch = (value: string) => {
    setSearchText(value)
  }

  // ==================== Excel 导入相关函数 ====================

  /**
   * 从标题或 Sheet 名称中提取班级编码
   * 支持格式：Y32415班级学员访谈情况表、168班级学员访谈情况表
   */
  const extractClassCode = (text: string): string | null => {
    // 匹配班级编码：字母+数字 或 纯数字
    const patterns = [
      /([A-Za-z]?\d{3,6})班级/,  // Y32415班级、168班级
      /([A-Za-z]\d{4,6})/,       // Y32415
      /班级[：:]\s*([A-Za-z]?\d{3,6})/,  // 班级：Y32415
      /(\d{3,6})班/,             // 168班
    ]
    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match) {
        return match[1]
      }
    }
    return null
  }

  /**
   * 解析单个 Sheet 的访谈数据
   */
  const parseInterviewSheet = (
    sheet: XLSX.WorkSheet,
    sheetName: string,
    defaultYear: number
  ): ImportedClassData | null => {
    console.log(`%c[Excel导入] 开始解析 Sheet: ${sheetName}`, 'color: #1890ff; font-weight: bold')

    const data = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: '' })
    if (data.length < 3) {
      console.log(`%c[Excel导入] Sheet ${sheetName} 数据行数不足，跳过`, 'color: orange')
      return null
    }

    // 1. 提取班级编码
    let classCode: string | null = null

    // 先从标题行（前3行）提取
    for (let i = 0; i < Math.min(3, data.length); i++) {
      const row = data[i]
      for (const cell of row) {
        const cellStr = String(cell || '').trim()
        if (cellStr.includes('班级') || cellStr.includes('学员访谈')) {
          classCode = extractClassCode(cellStr)
          if (classCode) {
            console.log(`%c[Excel导入] 从标题提取班级编码: ${classCode}`, 'color: green')
            break
          }
        }
      }
      if (classCode) break
    }

    // 如果标题没找到，尝试从 Sheet 名称提取
    if (!classCode) {
      classCode = extractClassCode(sheetName)
      if (classCode) {
        console.log(`%c[Excel导入] 从 Sheet 名称提取班级编码: ${classCode}`, 'color: green')
      }
    }

    if (!classCode) {
      console.log(`%c[Excel导入] 无法提取班级编码，跳过 Sheet: ${sheetName}`, 'color: red')
      return null
    }

    // 2. 找到表头行（包含"序号"和月份的行），并识别"访谈对象"固定列
    let headerRowIndex = -1
    let studentNameColIndex = -1  // "访谈对象"固定列的索引（通常是B列，索引为1）
    let monthColumns: { month: number; interviewerCol: number; contentCol: number }[] = []

    for (let i = 0; i < Math.min(10, data.length); i++) {
      const row = data[i]
      const rowStr = row.map(c => String(c || '').trim())

      // 先尝试找到"访谈对象"固定列的位置（通常在B列）
      if (studentNameColIndex < 0) {
        for (let j = 0; j < rowStr.length; j++) {
          const cell = rowStr[j]
          if (cell.includes('访谈对象') && !cell.includes('月')) {
            studentNameColIndex = j
            console.log(`%c[Excel导入] 找到"访谈对象"固定列: 索引 ${j}`, 'color: green')
            break
          }
        }
      }

      // 检查是否是月份行（包含 2月、3月 等）
      const monthMatches: { month: number; colIndex: number }[] = []
      for (let j = 0; j < rowStr.length; j++) {
        const cell = rowStr[j]
        const monthMatch = cell.match(/^(\d{1,2})月$/)
        if (monthMatch) {
          monthMatches.push({ month: parseInt(monthMatch[1], 10), colIndex: j })
        }
      }

      if (monthMatches.length >= 2) {
        headerRowIndex = i
        console.log(`%c[Excel导入] 找到月份表头行: ${i}, 月份数: ${monthMatches.length}`, 'color: green')
        
        // 检查下一行是否有子表头（访谈人/访谈内容，注意：访谈对象是固定列，不在月份列下）
        const subHeaderRow = data[i + 1]
        if (subHeaderRow) {
          const subHeaderStr = subHeaderRow.map(c => String(c || '').trim())
          console.log(`%c[Excel导入] 子表头行内容:`, 'color: #666', subHeaderStr.slice(0, 15))
          
          // 为每个月份识别子表头列的顺序（只有访谈人和访谈内容，没有访谈对象）
          monthColumns = monthMatches.map((m, idx) => {
            const nextMonthCol = monthMatches[idx + 1]?.colIndex || row.length
            const monthSubHeaders = subHeaderStr.slice(m.colIndex, nextMonthCol)
            
            // 找到访谈人、访谈内容的相对位置（注意：没有访谈对象）
            let interviewerOffset = -1
            let contentOffset = -1
            
            for (let k = 0; k < monthSubHeaders.length; k++) {
              const header = monthSubHeaders[k]
              if (header.includes('访谈人') || header.includes('教员')) {
                interviewerOffset = k
              } else if (header.includes('访谈内容') || header.includes('内容')) {
                contentOffset = k
              }
            }
            
            // 如果没有明确的子表头，使用默认顺序：访谈人(0) | 访谈内容(1)
            if (interviewerOffset < 0) interviewerOffset = 0
            if (contentOffset < 0) contentOffset = 1
            
            console.log(`%c[Excel导入] ${m.month}月列映射: 访谈人=${m.colIndex + interviewerOffset}, 访谈内容=${m.colIndex + contentOffset}`, 'color: #666')
            
            return {
              month: m.month,
              interviewerCol: m.colIndex + interviewerOffset,
              contentCol: m.colIndex + contentOffset,
            }
          })
        } else {
          // 没有子表头，使用默认顺序：访谈人(0) | 访谈内容(1)
          monthColumns = monthMatches.map(m => ({
            month: m.month,
            interviewerCol: m.colIndex,
            contentCol: m.colIndex + 1,
          }))
        }
        break
      }
    }

    // 如果没找到月份行，尝试找"访谈对象"列
    if (headerRowIndex < 0) {
      for (let i = 0; i < Math.min(10, data.length); i++) {
        const row = data[i]
        for (let j = 0; j < row.length; j++) {
          const cell = String(row[j] || '').trim()
          if (cell.includes('访谈对象') || cell.includes('访谈人')) {
            headerRowIndex = i
            if (cell.includes('访谈对象') && studentNameColIndex < 0) {
              studentNameColIndex = j
            }
            break
          }
        }
        if (headerRowIndex >= 0) break
      }
    }

    // 如果还没找到"访谈对象"列，默认使用B列（索引1）
    if (studentNameColIndex < 0) {
      studentNameColIndex = 1
      console.log(`%c[Excel导入] 未找到"访谈对象"列，使用默认列索引: ${studentNameColIndex}`, 'color: orange')
    }

    if (headerRowIndex < 0) {
      console.log(`%c[Excel导入] 无法找到表头行，跳过 Sheet: ${sheetName}`, 'color: red')
      return null
    }

    // 3. 解析数据行
    const records: ImportedClassData['records'] = []
    const dataStartRow = headerRowIndex + 1

    // 检查表头下一行是否是子表头（访谈人/访谈内容）
    // 注意：如果已经在上面识别了月份子表头，这里可能需要跳过
    let actualDataStartRow = dataStartRow
    if (monthColumns.length === 0) {
      // 只有当没有识别到月份列配置时，才检查是否有子表头
      const subHeaderRow = data[dataStartRow]
      if (subHeaderRow) {
        const subHeaderStr = subHeaderRow.map(c => String(c || '').trim()).join('')
        // 只检查月份列下的子表头（访谈人/访谈内容），不包括固定列"访谈对象"
        if (subHeaderStr.includes('访谈人') || subHeaderStr.includes('访谈内容')) {
          actualDataStartRow = dataStartRow + 1
          console.log(`%c[Excel导入] 检测到子表头行，数据从行 ${actualDataStartRow} 开始`, 'color: #666')
        }
      }
    } else {
      // 如果已经识别了月份列配置，且月份行的下一行是子表头行，则数据从下下行开始
      if (headerRowIndex >= 0 && data[headerRowIndex + 1]) {
        const subHeaderCheck = data[headerRowIndex + 1].map(c => String(c || '').trim()).join('')
        if (subHeaderCheck.includes('访谈人') || subHeaderCheck.includes('访谈内容')) {
          actualDataStartRow = dataStartRow + 1
          console.log(`%c[Excel导入] 已识别月份子表头，数据从行 ${actualDataStartRow} 开始`, 'color: #666')
        }
      }
    }

    for (let i = actualDataStartRow; i < data.length; i++) {
      const row = data[i]
      if (!row || row.length === 0) continue

      // 跳过空行和合计行
      const firstCell = String(row[0] || '').trim()
      if (!firstCell || firstCell === '合计' || firstCell === '总计' || firstCell.includes('xx学员')) continue

      // 从固定的"访谈对象"列获取学生姓名（通常是B列，索引为1）
      const studentName = String(row[studentNameColIndex] || '').trim()

      // 如果没有学生姓名，跳过这一行
      if (!studentName) {
        console.log(`%c[Excel导入] 跳过空学生姓名行: ${i + 1}`, 'color: orange')
        continue
      }

      // 如果有月份列配置，按月份解析
      if (monthColumns.length > 0) {
        for (const mc of monthColumns) {
          // 从月份列中读取访谈人、访谈内容（注意：访谈对象是固定列，不在月份列中）
          const interviewer = String(row[mc.interviewerCol] || '').trim()  // 访谈人列
          const content = String(row[mc.contentCol] || '').trim()          // 访谈内容列

          // 只有当访谈内容非空时才生成记录
          if (content) {
            records.push({
              studentName,
              interviewer: interviewer || '',
              content,
              month: mc.month,
              year: defaultYear,
            })
            console.log(`%c[Excel导入] 解析记录: ${studentName} - ${mc.month}月 - ${interviewer}`, 'color: #666')
          }
        }
      } else {
        // 备用方案：按固定列解析
        // 假设格式：序号 | 访谈对象 | 2月访谈人 | 2月访谈内容 | 3月访谈人 | 3月访谈内容 | ...
        // 每2列一组（访谈人、访谈内容）
        const startCol = studentNameColIndex + 1 // 从访谈对象列之后开始
        let monthStart = 2 // 默认从2月开始
        for (let col = startCol; col < row.length - 1; col += 2) {
          const interviewer = String(row[col] || '').trim()      // 访谈人
          const content = String(row[col + 1] || '').trim()      // 访谈内容

          if (content) {
            // 尝试从列位置推断月份
            const monthIndex = Math.floor((col - startCol) / 2)
            const month = monthStart + monthIndex

            if (month <= 12) {
              records.push({
                studentName,
                interviewer: interviewer || '',
                content,
                month: month,
                year: defaultYear,
              })
            }
          }
        }
      }
    }

    if (records.length === 0) {
      console.log(`%c[Excel导入] Sheet ${sheetName} 未解析到有效记录`, 'color: orange')
      return null
    }

    console.log(`%c[Excel导入] Sheet ${sheetName} 解析完成, 班级: ${classCode}, 记录数: ${records.length}`, 'color: green; font-weight: bold')

    return {
      classCode,
      className: `${classCode}班`,
      records,
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

      console.log(`%c[Excel导入] 工作簿包含 ${workbook.SheetNames.length} 个 Sheet: ${workbook.SheetNames.join(', ')}`, 'color: #1890ff')

      const classes: ImportedClassData[] = []

      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName]
        const classData = parseInterviewSheet(sheet, sheetName, selectedYear)
        if (classData) {
          // 检查是否已存在相同班级，合并记录
          const existing = classes.find(c => c.classCode === classData.classCode)
          if (existing) {
            existing.records.push(...classData.records)
          } else {
            classes.push(classData)
          }
        }
      }

      if (classes.length === 0) {
        message.warning('未能从 Excel 中解析出有效的访谈数据')
        return
      }

      // 设置预览数据
      setImportPreview({
        classes,
        campus: campusName,
        year: selectedYear,
      })
      setImportModalOpen(true)

      const totalRecords = classes.reduce((sum, c) => sum + c.records.length, 0)
      message.success(`成功解析 ${classes.length} 个班级，共 ${totalRecords} 条访谈记录`)
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
    if (!importPreview || importPreview.classes.length === 0) {
      message.warning('没有可导入的数据')
      return
    }

    setImporting(true)
    setImportProgress(0)

    const { classes, campus, year } = importPreview
    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < classes.length; i++) {
      const classData = classes[i]
      try {
        // 构造保存请求
        const records = classData.records.map((r, idx) => ({
          student_name: r.studentName,
          student_id: `${classData.classCode}-${String(idx + 1).padStart(2, '0')}`,
          interviewer: r.interviewer,
          month: r.month,
          year: r.year,
          content: r.content,
          interview_date: `${r.year}-${String(r.month).padStart(2, '0')}-01`,
          class_code: classData.classCode,
          class_name: classData.className,
          campus: campus,
          major_name: '',
        }))

        await saveStudentInterviewRecords({
          campus,
          class_code: classData.classCode,
          class_name: classData.className,
          records,
        })

        classData.status = 'success'
        classData.message = `导入成功 ${records.length} 条记录`
        successCount++
      } catch (error) {
        classData.status = 'error'
        classData.message = `导入失败: ${error}`
        errorCount++
        console.error(`[Excel导入] 保存班级 ${classData.classCode} 失败:`, error)
      }

      setImportProgress(Math.round(((i + 1) / classes.length) * 100))
      setImportPreview({ ...importPreview, classes: [...classes] })
    }

    setImporting(false)

    if (errorCount === 0) {
      message.success(`全部导入成功！共 ${successCount} 个班级`)
      // 刷新班级列表和数据
      await loadClasses()
      // 刷新当前选中班级的数据（用于"全部记录"标签页）
      await loadInterviewRecords()
      // 刷新所有班级的数据（用于"按学员/教员/月份/班级展示"标签页）
      await loadAllClassesData()
      setTimeout(() => {
        handleCloseImportModal()
      }, 1500)
    } else {
      message.warning(`导入完成：成功 ${successCount} 个班级，失败 ${errorCount} 个班级`)
      // 即使有失败，也刷新班级列表和数据
      await loadClasses()
      // 刷新当前选中班级的数据
      if (classes.some(c => c.classCode === selectedClassCode)) {
        await loadInterviewRecords()
      }
      // 刷新所有班级的数据
      await loadAllClassesData()
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

  // 处理班级变化
  const handleClassChange = (classCode: string) => {
    setSelectedClassCode(classCode)
  }

  // 处理学员变化
  const handleStudentChange = (student: string) => {
    setSelectedStudent(student)
  }

  // 处理教员变化
  const handleInterviewerChange = (interviewer: string) => {
    setSelectedInterviewer(interviewer)
  }

  // 处理月份变化
  const handleMonthChange = (month: number) => {
    setSelectedMonth(month)
  }

  // 处理年份变化
  const handleYearChange = (year: number) => {
    setSelectedYear(year)
  }

  const filteredData = React.useMemo(() => {
    const keyword = searchText.trim().toLowerCase()
    return dataSource.filter((item) => {
      const matchesSearch =
        !keyword ||
        item.studentName.toLowerCase().includes(keyword) ||
        item.interviewer.toLowerCase().includes(keyword) ||
        item.content.toLowerCase().includes(keyword)

      const matchesClass = item.classCode === selectedClassCode
      const matchesStudent = selectedStudent === 'all' || item.studentName === selectedStudent
      const matchesInterviewer =
        selectedInterviewer === 'all' || item.interviewer === selectedInterviewer
      const matchesMonth = selectedMonth === 0 || item.month === selectedMonth
      const matchesYear = item.year === selectedYear

      return (
        matchesSearch &&
        matchesClass &&
        matchesStudent &&
        matchesInterviewer &&
        matchesMonth &&
        matchesYear
      )
    })
  }, [
    dataSource,
    searchText,
    selectedClassCode,
    selectedStudent,
    selectedInterviewer,
    selectedMonth,
    selectedYear,
  ])

  // 用于按学员/教员/月份展示的过滤数据（不限制班级，只按年份和月份过滤）
  const allFilteredData = React.useMemo(() => {
    // 确保 allRecordsData 已初始化
    if (!allRecordsData || !Array.isArray(allRecordsData)) {
      return []
    }
    const keyword = searchText.trim().toLowerCase()
    return allRecordsData.filter((item) => {
      const matchesSearch =
        !keyword ||
        item.studentName.toLowerCase().includes(keyword) ||
        item.interviewer.toLowerCase().includes(keyword) ||
        item.content.toLowerCase().includes(keyword)

      const matchesStudent = selectedStudent === 'all' || item.studentName === selectedStudent
      const matchesInterviewer =
        selectedInterviewer === 'all' || item.interviewer === selectedInterviewer
      const matchesMonth = selectedMonth === 0 || item.month === selectedMonth
      const matchesYear = item.year === selectedYear

      return (
        matchesSearch &&
        matchesStudent &&
        matchesInterviewer &&
        matchesMonth &&
        matchesYear
      )
    })
  }, [
    allRecordsData,
    searchText,
    selectedStudent,
    selectedInterviewer,
    selectedMonth,
    selectedYear,
  ])

  const studentGroupedData = React.useMemo(
    () =>
      allFilteredData.reduce(
        (acc, item) => {
          if (!acc[item.studentName]) {
            acc[item.studentName] = []
          }
          acc[item.studentName].push(item)
          return acc
        },
        {} as Record<string, InterviewRecord[]>,
      ),
    [allFilteredData],
  )

  const interviewerGroupedData = React.useMemo(
    () =>
      allFilteredData.reduce(
        (acc, item) => {
          if (!acc[item.interviewer]) {
            acc[item.interviewer] = []
          }
          acc[item.interviewer].push(item)
          return acc
        },
        {} as Record<string, InterviewRecord[]>,
      ),
    [allFilteredData],
  )

  const monthGroupedData = React.useMemo(
    () =>
      allFilteredData.reduce(
        (acc, item) => {
          const key = `${item.year}-${item.month}`
          if (!acc[key]) {
            acc[key] = []
          }
          acc[key].push(item)
          return acc
        },
        {} as Record<string, InterviewRecord[]>,
      ),
    [allFilteredData],
  )

  // 加载所有班级的访谈数据（用于按班级/学员/教员/月份展示）
  const loadAllClassesData = React.useCallback(async () => {
    setLoadingAllClasses(true)
    try {
      const res = await fetchStudentInterviewRecords({
        campus: campusName,
        class_code: '',
        class_name: '',
      })
      const records = (res.records || []).map((item: any, index: number) => ({
        id: `${item.student_name}-${item.interview_date}-${item.class_code}-${index}`,
        studentName: item.student_name,
        studentId: item.student_id || '',
        interviewer: item.interviewer,
        month: item.month,
        year: item.year,
        content: item.content,
        interviewDate: item.interview_date,
        classCode: item.class_code,
        campus: item.campus,
        majorName: item.major_name || '',
      }))

      // 保存所有记录的扁平数组（用于按学员/教员/月份展示）
      setAllRecordsData(records)

      // 按班级分组（用于按班级展示）
      const grouped = records.reduce(
        (acc: Record<string, InterviewRecord[]>, item: InterviewRecord) => {
          const classCode = item.classCode || '未知班级'
          if (!acc[classCode]) {
            acc[classCode] = []
          }
          acc[classCode].push(item)
          return acc
        },
        {} as Record<string, InterviewRecord[]>,
      )

      setAllClassesData(grouped)
    } catch (error) {
      console.error('加载所有班级数据失败', error)
      setAllClassesData({})
      setAllRecordsData([])
    } finally {
      setLoadingAllClasses(false)
    }
  }, [campusName])

  // 当切换到需要所有班级数据的标签页时加载数据
  useEffect(() => {
    if (activeTab === 'all' || activeTab === 'class' || activeTab === 'student' || activeTab === 'interviewer' || activeTab === 'month') {
      loadAllClassesData()
    }
  }, [activeTab, loadAllClassesData])

  // 渲染按学员展示的表格
  const renderStudentView = () => {
    if (loadingAllClasses) {
      return (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin tip="加载数据中..." />
        </div>
      )
    }

    if (Object.keys(studentGroupedData).length === 0) {
      return (
        <Alert
          message="暂无数据"
          description="当前没有学员访谈记录，请先导入或添加数据"
          type="info"
          showIcon
        />
      )
    }

    return (
      <div>
        {Object.entries(studentGroupedData).map(([studentName, records]) => (
          <Card key={studentName} size="small" style={{ marginBottom: 16 }}>
            <h4>
              {studentName} 的访谈记录 ({records.length}条)
            </h4>
            <Table
              columns={columns}
              dataSource={records}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        ))}
      </div>
    )
  }

  // 渲染按教员展示的表格
  const renderInterviewerView = () => {
    if (loadingAllClasses) {
      return (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin tip="加载数据中..." />
        </div>
      )
    }

    if (Object.keys(interviewerGroupedData).length === 0) {
      return (
        <Alert
          message="暂无数据"
          description="当前没有教员访谈记录，请先导入或添加数据"
          type="info"
          showIcon
        />
      )
    }

    return (
      <div>
        {Object.entries(interviewerGroupedData).map(([interviewer, records]) => (
          <Card key={interviewer} size="small" style={{ marginBottom: 16 }}>
            <h4>
              {interviewer} 的访谈记录 ({records.length}条)
            </h4>
            <Table
              columns={columns}
              dataSource={records}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        ))}
      </div>
    )
  }

  // 渲染按月份展示的表格
  const renderMonthView = () => {
    if (loadingAllClasses) {
      return (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin tip="加载数据中..." />
        </div>
      )
    }

    if (Object.keys(monthGroupedData).length === 0) {
      return (
        <Alert
          message="暂无数据"
          description="当前没有该月份/年份的访谈记录，请先导入或添加数据"
          type="info"
          showIcon
        />
      )
    }

    return (
      <div>
        {Object.entries(monthGroupedData)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([monthKey, records]) => (
            <Card key={monthKey} size="small" style={{ marginBottom: 16 }}>
              <h4>
                {monthKey} 的访谈记录 ({records.length}条)
              </h4>
              <Table
                columns={columns}
                dataSource={records}
                rowKey="id"
                pagination={false}
                size="small"
              />
            </Card>
          ))}
      </div>
    )
  }

  // 渲染按班级展示的表格
  const renderClassView = () => {
    if (loadingAllClasses) {
      return (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin tip="加载班级数据中..." />
        </div>
      )
    }

    // 获取所有班级（配置中心 + 数据库并集）
    const allClassCodes = new Set<string>()
    classList.forEach((c) => allClassCodes.add(c.class_name))
    Object.keys(allClassesData).forEach((code) => allClassCodes.add(code))

    const sortedClassCodes = Array.from(allClassCodes).sort()

    if (sortedClassCodes.length === 0) {
      return (
        <Alert
          message="暂无班级数据"
          description="当前神殿没有班级访谈记录"
          type="info"
          showIcon
        />
      )
    }

    // 按年份过滤
    const filterByYear = (records: InterviewRecord[]) =>
      records.filter((r) => r.year === selectedYear)

    return (
      <div>
        <Alert
          message={`当前展示 ${selectedYear} 年的访谈记录，共 ${sortedClassCodes.length} 个班级`}
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        {sortedClassCodes.map((classCode) => {
          const records = filterByYear(allClassesData[classCode] || [])
          const studentCount = new Set(records.map((r) => r.studentName)).size
          const interviewerCount = new Set(records.map((r) => r.interviewer)).size

          return (
            <Card
              key={classCode}
              size="small"
              style={{ marginBottom: 16 }}
              title={
                <Space>
                  <Tag color="blue">{classCode}</Tag>
                  <span>访谈记录</span>
                  <Tag color="green">{records.length} 条</Tag>
                  <Tag color="purple">{studentCount} 名学员</Tag>
                  <Tag color="orange">{interviewerCount} 名教员</Tag>
                </Space>
              }
              extra={
                <Button
                  type="link"
                  size="small"
                  onClick={() => {
                    setSelectedClassCode(classCode)
                    setActiveTab('all')
                  }}
                >
                  查看详情
                </Button>
              }
            >
              {records.length > 0 ? (
                <Table
                  columns={columns}
                  dataSource={records}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                  size="small"
                  scroll={{ x: 1000 }}
                />
              ) : (
                <div style={{ textAlign: 'center', color: '#999', padding: 20 }}>
                  该班级在 {selectedYear} 年暂无访谈记录
                </div>
              )}
            </Card>
          )
        })}
      </div>
    )
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
            {campusName}
          </Col>
          <Col span={6}>
            <strong>专业名称：</strong>
            <Select
              value={selectedMajorName || undefined}
              onChange={(value) => setSelectedMajorName(value || '')}
              placeholder="请选择专业"
              allowClear
              showSearch
              style={{ width: 140 }}
              options={configMajorOptions}
              filterOption={(input, option) =>
                (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
              }
              loading={configLoading}
            />
          </Col>
          <Col span={6}>
            <strong>班级名称：</strong>
            <Select
              value={selectedClassCode || undefined}
              onChange={(value) => setSelectedClassCode(value || '')}
              placeholder="请选择班级"
              allowClear
              showSearch
              style={{ width: 140 }}
              options={configClassOptions}
              filterOption={(input, option) =>
                (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
              }
              loading={configLoading}
            />
          </Col>
        </Row>

        {/* 统计信息 */}
        <Row
          gutter={16}
          style={{ marginBottom: 24, padding: 16, backgroundColor: '#f0f9ff', borderRadius: 8 }}
        >
          <Col span={6}>
            <Statistic
              title="总访谈数"
              value={statistics.totalInterviews}
              suffix="次"
              prefix={<MessageOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="访谈学员数"
              value={statistics.totalStudents}
              suffix="人"
              prefix={<UserOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="访谈教员数"
              value={statistics.totalInterviewers}
              suffix="人"
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="本月访谈数"
              value={statistics.thisMonthInterviews}
              suffix="次"
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Col>
        </Row>

        {/* 筛选条件 */}
        <div
          style={{
            marginBottom: 16,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Space wrap>
            <span>班级：</span>
            <Select
              value={selectedClassCode}
              onChange={handleClassChange}
              style={{ width: 150 }}
              loading={classLoading}
              showSearch
              filterOption={(input, option) =>
                (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
              }
            >
              {classList.map((cls) => (
                <Option key={cls.id} value={cls.class_name}>
                  {cls.class_name}
                </Option>
              ))}
            </Select>

            <span>学员：</span>
            <Select value={selectedStudent} onChange={handleStudentChange} style={{ width: 120 }}>
              <Option value="all">全部</Option>
              {studentList.map((item) => (
                <Option key={item.value} value={item.value}>
                  {item.label}
                </Option>
              ))}
            </Select>

            <span>教员：</span>
            <Select
              value={selectedInterviewer}
              onChange={handleInterviewerChange}
              style={{ width: 120 }}
              loading={teacherLoading}
            >
              <Option value="all">全部</Option>
              {interviewerList.map((item) => (
                <Option key={item.value} value={item.value}>
                  {item.label}
                </Option>
              ))}
            </Select>

            <span>年份：</span>
            <Select value={selectedYear} onChange={handleYearChange} style={{ width: 100 }}>
              {yearOptions.map((year) => (
                <Option key={year} value={year}>
                  {year}
                </Option>
              ))}
            </Select>

            <span>月份：</span>
            <Select value={selectedMonth} onChange={handleMonthChange} style={{ width: 100 }}>
              <Option value={0}>全部</Option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((month) => (
                <Option key={month} value={month}>
                  {month}月
                </Option>
              ))}
            </Select>
          </Space>

          <Input.Search
            placeholder="搜索学员、教员或访谈内容"
            style={{ width: 300 }}
            value={searchText}
            onSearch={handleSearch}
            onChange={(e) => handleSearch(e.target.value)}
            allowClear
          />
        </div>

        {/* 操作按钮 */}
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              添加访谈记录
            </Button>
            <Button
              icon={<UsergroupAddOutlined />}
              onClick={handleGenerateStudentsFromArchive}
              loading={loading}
            >
              从班档案导入学员
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
            <Button type="primary" loading={saving} onClick={handleSaveRecords}>
              保存到后端
            </Button>
          </Space>
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'all',
              label: '全部记录',
              children: (
                <Table
                  columns={columns}
                  dataSource={allFilteredData}
                  rowKey="id"
                  loading={loadingAllClasses}
                  scroll={{ x: 1200 }}
                  pagination={{
                    defaultPageSize: 20,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
                  }}
                  bordered
                  size="small"
                />
              ),
            },
            {
              key: 'class',
              label: '按班级展示',
              children: renderClassView(),
            },
            {
              key: 'student',
              label: '按学员展示',
              children: renderStudentView(),
            },
            {
              key: 'interviewer',
              label: '按教员展示',
              children: renderInterviewerView(),
            },
            {
              key: 'month',
              label: '按月份展示',
              children: renderMonthView(),
            },
          ]}
        />

        {/* 说明信息 */}
        <Alert
          message="说明"
          description="此表记录班级学员访谈情况，支持按学员、教员、月份进行分组展示。访谈内容包括学员学习情况、课堂表现、家庭背景、个人问题等详细信息。"
          type="info"
          showIcon
          style={{ marginTop: 16 }}
        />
      </Card>

      {/* 添加/编辑模态框 */}
      <Modal
        title={editingRecord ? '编辑访谈记录' : '添加访谈记录'}
        open={modalVisible}
        onOk={handleSave}
        onCancel={() => {
          setModalVisible(false)
          form.resetFields()
        }}
        width={800}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            classCode: selectedClassCode,
            year: selectedYear,
            month: selectedMonth || dayjs().month() + 1,
            interviewDate: dayjs(),
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="studentName"
                label="访谈对象（学员姓名）"
                rules={[{ required: true, message: '请选择或输入访谈对象' }]}
              >
                <AutoComplete
                  options={studentAutoCompleteOptions}
                  placeholder="请选择或输入学员姓名"
                  filterOption={(inputValue, option) =>
                    option?.value?.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                  }
                  allowClear
                  notFoundContent={studentsLoading ? <Spin size="small" /> : '暂无学生数据'}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="studentId"
                label="学员编号"
                rules={[{ required: true, message: '请输入学员编号' }]}
              >
                <Input placeholder="请输入学员编号" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="interviewer"
                label="访谈人"
                rules={[{ required: true, message: '请输入访谈人' }]}
              >
                <Input placeholder="请输入访谈人" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="interviewDate"
                label="访谈日期"
                rules={[{ required: true, message: '请选择访谈日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="year"
                label="年份"
                rules={[{ required: true, message: '请选择年份' }]}
              >
                <Select>
                  {yearOptions.map((year) => (
                    <Option key={year} value={year}>
                      {year}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="month"
                label="月份"
                rules={[{ required: true, message: '请选择月份' }]}
              >
                <Select>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((month) => (
                    <Option key={month} value={month}>
                      {month}月
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="classCode"
                label="班级代码"
                rules={[{ required: true, message: '请输入班级代码' }]}
              >
                <Input placeholder="请输入班级代码" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="content"
            label="访谈内容"
            rules={[{ required: true, message: '请输入访谈内容' }]}
          >
            <TextArea
              placeholder="请输入访谈内容，包括学员学习情况、课堂表现、家庭背景、个人问题等详细信息"
              rows={6}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Excel 导入预览弹窗 */}
      <Modal
        title={
          <Space>
            <FileExcelOutlined style={{ color: '#52c41a' }} />
            Excel 访谈记录导入预览
          </Space>
        }
        open={importModalOpen}
        onCancel={handleCloseImportModal}
        width={800}
        footer={[
          <Button key="cancel" onClick={handleCloseImportModal} disabled={importing}>
            取消
          </Button>,
          <Button
            key="import"
            type="primary"
            onClick={handleConfirmImport}
            loading={importing}
            disabled={!importPreview || importPreview.classes.length === 0}
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
                  <p>• 将导入到：<strong>{importPreview.campus}</strong> 神殿</p>
                  <p>• 年份：<strong>{importPreview.year}年</strong></p>
                  <p>• 导入方式：<strong>按班级覆盖写入</strong>（每个班级的数据将替换该班级的全部访谈记录）</p>
                  <p>• 支持自动识别班级编码（如 Y32415、168 等）</p>
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

            {/* 班级统计 */}
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={8}>
                <Card size="small">
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>
                      {importPreview.classes.length}
                    </div>
                    <div style={{ color: '#666' }}>班级数</div>
                  </div>
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small">
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>
                      {importPreview.classes.reduce((sum, c) => sum + c.records.length, 0)}
                    </div>
                    <div style={{ color: '#666' }}>访谈记录数</div>
                  </div>
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small">
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 'bold', color: '#722ed1' }}>
                      {new Set(importPreview.classes.flatMap(c => c.records.map(r => r.studentName))).size}
                    </div>
                    <div style={{ color: '#666' }}>学员人数</div>
                  </div>
                </Card>
              </Col>
            </Row>

            {/* 班级列表 */}
            <List
              header={<div><strong>待导入班级列表</strong></div>}
              bordered
              dataSource={importPreview.classes}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      item.status === 'success' ? (
                        <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 20 }} />
                      ) : item.status === 'error' ? (
                        <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: 20 }} />
                      ) : (
                        <TeamOutlined style={{ color: '#1890ff', fontSize: 20 }} />
                      )
                    }
                    title={
                      <Space>
                        <span>班级：{item.classCode}</span>
                        {item.status === 'success' && <Tag color="success">已导入</Tag>}
                        {item.status === 'error' && <Tag color="error">失败</Tag>}
                        {item.status === 'pending' && <Tag color="processing">待导入</Tag>}
                      </Space>
                    }
                    description={
                      item.status === 'error'
                        ? item.message
                        : `${item.records.length} 条访谈记录，涉及 ${new Set(item.records.map(r => r.studentName)).size} 名学员`
                    }
                  />
                </List.Item>
              )}
              style={{ maxHeight: 300, overflowY: 'auto' }}
            />
          </>
        )}
      </Modal>
    </div>
  )
}

export default StudentInterviewTablePage
