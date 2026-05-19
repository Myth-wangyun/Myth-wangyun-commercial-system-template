// 学术->学术经理->管理表格 教员KPI考核数据表
import React, { useEffect, useMemo, useState, useRef } from 'react'
import { App, Card, Table, Typography, Input, InputNumber, Space, Button, Modal, Alert } from 'antd'
import { FileExcelOutlined, CopyOutlined, ThunderboltOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { KpiTeacher } from '@/services/kpiTeachers'
import { fetchKpiTeachers } from '@/services/kpiTeachers'
import { fetchKpiAssessment, saveKpiAssessment } from '@/services/kpiResults'
import { autoCalculateTeacherKPI } from '@/services/teacherKpiAuto'
import { useCampusStore } from '@/stores/campusStore'
import * as XLSX from 'xlsx'

const { Title, Text } = Typography
const { TextArea } = Input

type DataValue = number | string | null

interface TeacherKpiRecord {
  key: string
  name: string
  departmentPerformance: DataValue
  assignmentSubmitRate: DataValue
  assignmentPassRate: DataValue
  examPassRate: DataValue
  employmentCount: DataValue
  employmentSalary: DataValue
  attendanceRate: DataValue
  oldStudentLoss: DataValue
  newStudentLoss: DataValue
  satisfaction: DataValue
  recruitmentCompletion: DataValue
  wechatMoments: DataValue
  kuaishouShares: DataValue
  douyinShares: DataValue
  newMediaTotal: DataValue
  leaderReview: DataValue
  rowType?: 'summary'
}

type TeacherKpiAverageField =
  | 'assignmentSubmitRate'
  | 'assignmentPassRate'
  | 'examPassRate'
  | 'attendanceRate'
  | 'satisfaction'
  | 'recruitmentCompletion'

type TeacherKpiSumField = 'oldStudentLoss' | 'newStudentLoss'

const rawData: TeacherKpiRecord[] = []

const summaryRecord: TeacherKpiRecord = {
  key: 'summary',
  rowType: 'summary',
  name: '部门数值',
  departmentPerformance: null,
  assignmentSubmitRate: null,
  assignmentPassRate: null,
  examPassRate: null,
  employmentCount: null,
  employmentSalary: null,
  attendanceRate: null,
  oldStudentLoss: null,
  newStudentLoss: null,
  satisfaction: null,
  recruitmentCompletion: null,
  wechatMoments: null,
  kuaishouShares: null,
  douyinShares: null,
  newMediaTotal: null,
  leaderReview: null,
}

// 创建空白记录的函数，需要在 mergeTeachersIntoRows 之前定义
const createBlankRecord = (name: string): TeacherKpiRecord => ({
  key: `teacher-${name}-${Date.now()}-${Math.random()}`,
  name,
  departmentPerformance: null,
  assignmentSubmitRate: null,
  assignmentPassRate: null,
  examPassRate: null,
  employmentCount: null,
  employmentSalary: null,
  attendanceRate: null,
  oldStudentLoss: null,
  newStudentLoss: null,
  satisfaction: null,
  recruitmentCompletion: null,
  wechatMoments: null,
  kuaishouShares: null,
  douyinShares: null,
  newMediaTotal: null,
  leaderReview: null,
})

const normalizeShareValue = (value: DataValue): number | null => {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'number' && !Number.isNaN(value)) return value
  const parsed = Number(value)
  return Number.isNaN(parsed) ? null : parsed
}

const readValue = (record: any, camel: string, snake: string) =>
  record?.[camel] ?? record?.[snake] ?? null

const mapAssessmentRecord = (record: any): TeacherKpiRecord => {
  const row: TeacherKpiRecord = {
    key: `teacher-${record.name}-${Math.random()}`,
    name: record.name,
    departmentPerformance: readValue(record, 'departmentPerformance', 'department_performance'),
    assignmentSubmitRate: readValue(record, 'assignmentSubmitRate', 'assignment_submit_rate'),
    assignmentPassRate: readValue(record, 'assignmentPassRate', 'assignment_pass_rate'),
    examPassRate: readValue(record, 'examPassRate', 'exam_pass_rate'),
    employmentCount: readValue(record, 'employmentCount', 'employment_count'),
    employmentSalary: readValue(record, 'employmentSalary', 'employment_salary'),
    attendanceRate: readValue(record, 'attendanceRate', 'attendance_rate'),
    oldStudentLoss: readValue(record, 'oldStudentLoss', 'old_student_loss'),
    newStudentLoss: readValue(record, 'newStudentLoss', 'new_student_loss'),
    satisfaction: readValue(record, 'satisfaction', 'satisfaction'),
    recruitmentCompletion: readValue(record, 'recruitmentCompletion', 'recruitment_completion'),
    wechatMoments: readValue(record, 'wechatMoments', 'wechat_moments'),
    kuaishouShares: readValue(record, 'kuaishouShares', 'kuaishou_shares'),
    douyinShares: readValue(record, 'douyinShares', 'douyin_shares'),
    newMediaTotal: readValue(record, 'newMediaTotal', 'new_media_total'),
    leaderReview: readValue(record, 'leaderReview', 'leader_review'),
  }
  const wechat = normalizeShareValue(row.wechatMoments)
  const kuaishou = normalizeShareValue(row.kuaishouShares)
  const douyin = normalizeShareValue(row.douyinShares)
  if (wechat === null && kuaishou === null && douyin === null) {
    row.newMediaTotal = null
  } else {
    row.newMediaTotal = (wechat || 0) + (kuaishou || 0) + (douyin || 0)
  }
  return row
}

const mergeTeachersIntoRows = (
  teachers: KpiTeacher[],
  prevRows: TeacherKpiRecord[],
): TeacherKpiRecord[] => {
  if (!teachers.length) return prevRows
  const summary = prevRows.find((row) => row.rowType === 'summary') || summaryRecord
  const existingMap = new Map(
    prevRows.filter((row) => row.rowType !== 'summary').map((row) => [row.name, row]),
  )
  const uniqueNames = Array.from(new Set(teachers.map((t) => t.name).filter(Boolean)))
  const nextRows = uniqueNames.map((name) => existingMap.get(name) || createBlankRecord(name))
  return [...nextRows, summary]
}

type Props = { 
  year: number
  month: number
  selectedTeacher?: string
  canViewOthers?: boolean
}

const TeacherKpiAssessmentPage: React.FC<Props> = ({ year, month, selectedTeacher, canViewOthers = true }) => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore()
  const [dataSource, setDataSource] = useState<TeacherKpiRecord[]>(() => [
    ...rawData,
    summaryRecord,
  ])
  const [teacherOptions, setTeacherOptions] = useState<KpiTeacher[]>([])
  const [saving, setSaving] = useState(false)
  const [autoFetching, setAutoFetching] = useState(false)

  // Excel导入和剪贴板粘贴相关状态
  const [importModalVisible, setImportModalVisible] = useState(false)
  const [importType, setImportType] = useState<'excel' | 'paste'>('excel')
  const [pasteText, setPasteText] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const loadTeachers = async () => {
      try {
        const campus = currentCampus || '主神殿'
        const res = await fetchKpiTeachers(campus)
        if (res.teachers?.length) {
          setTeacherOptions(res.teachers)
          setDataSource((prev) => mergeTeachersIntoRows(res.teachers, prev))
        } else {
          if (!teacherOptions.length) {
            const fallbackList = rawData
              .filter((row) => row.rowType !== 'summary')
              .map((row) => ({ name: row.name, role: '教员' }))
            setTeacherOptions(fallbackList)
            setDataSource((prev) => mergeTeachersIntoRows(fallbackList, prev))
          }
        }
      } catch (error) {
        console.warn('加载教师名单失败，使用本地数据', error)
        if (!teacherOptions.length) {
          const fallbackList = rawData
            .filter((row) => row.rowType !== 'summary')
            .map((row) => ({ name: row.name, role: '教员' }))
          setTeacherOptions(fallbackList)
          setDataSource((prev) => mergeTeachersIntoRows(fallbackList, prev))
        }
      }
    }
    loadTeachers()
  }, [currentCampus])

  useEffect(() => {
    if (!teacherOptions.length) return
    const loadAssessment = async () => {
      try {
        const campus = currentCampus || '主神殿'
        const res = await fetchKpiAssessment({ campus, year, month })
        const mapped = (res.records || []).map((item) => mapAssessmentRecord(item))
        
        // 如果只能查看自己，过滤数据
        let filteredRecords = mapped
        if (!canViewOthers && selectedTeacher) {
          filteredRecords = mapped.filter(record => record.name === selectedTeacher)
        }
        
        if (filteredRecords.length) {
          // 如果只能查看自己，不添加合计行
          if (!canViewOthers && selectedTeacher) {
            setDataSource(filteredRecords)
          } else {
            setDataSource(mergeTeachersIntoRows(teacherOptions, [...filteredRecords, summaryRecord]))
          }
        } else {
          // 如果只能查看自己且没有数据，显示空白行
          if (!canViewOthers && selectedTeacher) {
            setDataSource([createBlankRecord(selectedTeacher)])
          } else {
            setDataSource(mergeTeachersIntoRows(teacherOptions, []))
          }
        }
      } catch (error: any) {
        console.error('加载KPI考核数据失败', error)
        
        // 如果是权限错误，显示友好提示
        if (error?.response?.status === 403) {
          const errorMsg = error?.response?.data?.detail || '您没有权限访问此数据'
          message.error(errorMsg)
        } else {
          message.error('加载KPI考核数据失败')
        }
        
        // 如果只能查看自己且加载失败，显示空白行
        if (!canViewOthers && selectedTeacher) {
          setDataSource([createBlankRecord(selectedTeacher)])
        } else {
          setDataSource(mergeTeachersIntoRows(teacherOptions, []))
        }
      }
    }
    loadAssessment()
  }, [teacherOptions, year, month, currentCampus, selectedTeacher, canViewOthers])

  const kpiColumns: Array<keyof TeacherKpiRecord> = [
    'departmentPerformance',
    'assignmentSubmitRate',
    'assignmentPassRate',
    'examPassRate',
    'employmentCount',
    'employmentSalary',
    'attendanceRate',
    'oldStudentLoss',
    'newStudentLoss',
  ]

  const isNumberField = (field: keyof TeacherKpiRecord) => {
    return (
      [
        'departmentPerformance',
        'assignmentSubmitRate',
        'assignmentPassRate',
        'examPassRate',
        'employmentCount',
        'employmentSalary',
        'attendanceRate',
        'oldStudentLoss',
        'newStudentLoss',
        'satisfaction',
        'recruitmentCompletion',
        'wechatMoments',
        'kuaishouShares',
        'douyinShares',
        'newMediaTotal',
        'leaderReview',
      ] as Array<keyof TeacherKpiRecord>
    ).includes(field)
  }

  const updateCell = (key: string, field: keyof TeacherKpiRecord, value: any) => {
    setDataSource((prev) => {
      const dataRows = prev.filter((row) => row.rowType !== 'summary')
      const summaryRow = prev.find((row) => row.rowType === 'summary') || summaryRecord
      
      const updated = dataRows.map((row) => {
        if (row.key !== key) return row
        const nextRow: TeacherKpiRecord = { ...row, [field]: value }
        if (field === 'wechatMoments' || field === 'kuaishouShares' || field === 'douyinShares') {
          const wechat = normalizeShareValue(
            field === 'wechatMoments' ? value : nextRow.wechatMoments,
          )
          const kuaishou = normalizeShareValue(
            field === 'kuaishouShares' ? value : nextRow.kuaishouShares,
          )
          const douyin = normalizeShareValue(field === 'douyinShares' ? value : nextRow.douyinShares)
          if (wechat === null && kuaishou === null && douyin === null) {
            nextRow.newMediaTotal = null
          } else {
            const total =
              (typeof wechat === 'number' ? wechat : 0) +
              (typeof kuaishou === 'number' ? kuaishou : 0) +
              (typeof douyin === 'number' ? douyin : 0)
            nextRow.newMediaTotal = total
          }
        }
        return nextRow
      })
      
      // 重新计算合计行
      const newSummary = calculateSummary(updated)
      
      return [...updated, newSummary]
    })
  }

  const renderEditable = (record: TeacherKpiRecord, field: keyof TeacherKpiRecord) => {
    const bg = kpiColumns.includes(field) ? '#fff4b3' : undefined
    const v = record[field]
    if (field === 'name') return <Text>{String(v)}</Text>
    if (isNumberField(field)) {
      return (
        <div style={{ backgroundColor: bg, padding: '2px 4px' }}>
          <InputNumber
            style={{ width: '100%' }}
            value={typeof v === 'number' ? v : v === null ? undefined : Number(v)}
            onChange={(val) => updateCell(record.key, field, typeof val === 'number' ? val : null)}
            precision={2}
          />
        </div>
      )
    }
    return (
      <div style={{ backgroundColor: bg, padding: '2px 4px' }}>
        <Input
          value={v === null ? '' : String(v)}
          onChange={(e) => updateCell(record.key, field, e.target.value)}
        />
      </div>
    )
  }

  const columns: ColumnsType<TeacherKpiRecord> = [
    {
      title: '姓名',
      dataIndex: 'name',
      align: 'center',
      fixed: 'left',
      width: 120,
      render: (_v, r) => <Text strong>{r.name}</Text>,
    },
    {
      title: '部门业绩',
      dataIndex: 'departmentPerformance',
      align: 'center',
      width: 120,
      render: (_v, r) => renderEditable(r, 'departmentPerformance'),
    },
    {
      title: '作业/项目提交率',
      dataIndex: 'assignmentSubmitRate',
      align: 'center',
      width: 140,
      render: (_v, r) => renderEditable(r, 'assignmentSubmitRate'),
    },
    {
      title: '作业/项目合格率',
      dataIndex: 'assignmentPassRate',
      align: 'center',
      width: 140,
      render: (_v, r) => renderEditable(r, 'assignmentPassRate'),
    },
    {
      title: '考试合格率',
      dataIndex: 'examPassRate',
      align: 'center',
      width: 120,
      render: (_v, r) => renderEditable(r, 'examPassRate'),
    },
    {
      title: '学员就业人数',
      dataIndex: 'employmentCount',
      align: 'center',
      width: 130,
      render: (_v, r) => renderEditable(r, 'employmentCount'),
    },
    {
      title: '平均就业薪资',
      dataIndex: 'employmentSalary',
      align: 'center',
      width: 140,
      render: (_v, r) => renderEditable(r, 'employmentSalary'),
    },
    {
      title: '全勤率',
      dataIndex: 'attendanceRate',
      align: 'center',
      width: 120,
      render: (_v, r) => renderEditable(r, 'attendanceRate'),
    },
    {
      title: '老生流失',
      dataIndex: 'oldStudentLoss',
      align: 'center',
      width: 120,
      render: (_v, r) => renderEditable(r, 'oldStudentLoss'),
    },
    {
      title: '新生流失',
      dataIndex: 'newStudentLoss',
      align: 'center',
      width: 120,
      render: (_v, r) => renderEditable(r, 'newStudentLoss'),
    },
    {
      title: '学员满意度',
      dataIndex: 'satisfaction',
      align: 'center',
      width: 140,
      render: (_v, r) => renderEditable(r, 'satisfaction'),
    },
    {
      title: '招聘/工作完成率',
      dataIndex: 'recruitmentCompletion',
      align: 'center',
      width: 150,
      render: (_v, r) => renderEditable(r, 'recruitmentCompletion'),
    },
    {
      title: '朋友圈转发',
      dataIndex: 'wechatMoments',
      align: 'center',
      width: 130,
      render: (_v, r) => renderEditable(r, 'wechatMoments'),
    },
    {
      title: '本月快手转发',
      dataIndex: 'kuaishouShares',
      align: 'center',
      width: 130,
      render: (_v, r) => renderEditable(r, 'kuaishouShares'),
    },
    {
      title: '本月抖音转发',
      dataIndex: 'douyinShares',
      align: 'center',
      width: 130,
      render: (_v, r) => renderEditable(r, 'douyinShares'),
    },
    {
      title: '本月新媒体转发合计',
      dataIndex: 'newMediaTotal',
      align: 'center',
      width: 150,
      render: (_v, r) => (
        <Text strong>{typeof r.newMediaTotal === 'number' ? r.newMediaTotal : '-'}</Text>
      ),
    },
    {
      title: '领导评价',
      dataIndex: 'leaderReview',
      align: 'center',
      width: 120,
      render: (_v, r) => renderEditable(r, 'leaderReview'),
    },
  ]

  // 列名映射表（Excel/剪贴板列名 -> 字段名）
  const columnMapping: Record<string, keyof TeacherKpiRecord> = {
    '姓名': 'name',
    '部门业绩': 'departmentPerformance',
    '作业/项目提交率': 'assignmentSubmitRate',
    '作业提交率': 'assignmentSubmitRate',
    '作业/项目合格率': 'assignmentPassRate',
    '作业合格率': 'assignmentPassRate',
    '考试合格率': 'examPassRate',
    '学员就业人数': 'employmentCount',
    '平均就业薪资': 'employmentSalary',
    '全勤率': 'attendanceRate',
    '老生流失': 'oldStudentLoss',
    '新生流失': 'newStudentLoss',
    '学员满意度': 'satisfaction',
    '招聘/工作完成率': 'recruitmentCompletion',
    '工作完成率': 'recruitmentCompletion',
    '朋友圈转发': 'wechatMoments',
    '本月快手转发': 'kuaishouShares',
    '快手转发': 'kuaishouShares',
    '本月抖音转发': 'douyinShares',
    '抖音转发': 'douyinShares',
    '本月新媒体转发合计': 'newMediaTotal',
    '新媒体转发合计': 'newMediaTotal',
    '领导评价': 'leaderReview',
  }

  // 解析数值
  const parseValue = (value: any): DataValue => {
    if (value === null || value === undefined || value === '') return null
    if (typeof value === 'number') {
      return Number.isNaN(value) ? null : value
    }
    const str = String(value).trim()
    if (!str || str === '-' || str === '—') return null
    const num = Number(str)
    return Number.isNaN(num) ? str : num
  }

  // 从Excel数据解析
  const parseExcelData = (data: any[][]): TeacherKpiRecord[] => {
    if (!data || data.length < 2) {
      throw new Error('数据格式不正确：至少需要表头行和数据行')
    }

    // 查找表头行（包含"姓名"的行）
    let headerRowIndex = -1
    const headerMap: Record<number, keyof TeacherKpiRecord> = {}

    for (let i = 0; i < Math.min(10, data.length); i++) {
      const row = data[i]
      const nameColIndex = row.findIndex((cell) => {
        const cellStr = String(cell || '').trim()
        return cellStr === '姓名' || cellStr.includes('姓名')
      })
      
      if (nameColIndex >= 0) {
        headerRowIndex = i
        // 解析表头，建立列索引到字段的映射
        row.forEach((cell, colIndex) => {
          const cellStr = String(cell || '').trim()
          const field = columnMapping[cellStr]
          if (field) {
            headerMap[colIndex] = field
          }
        })
        break
      }
    }

    if (headerRowIndex < 0) {
      throw new Error('未找到表头行（包含"姓名"列）')
    }

    const records: TeacherKpiRecord[] = []
    const dataStartRow = headerRowIndex + 1

    // 解析数据行
    for (let i = dataStartRow; i < data.length; i++) {
      const row = data[i]
      if (!row || row.length === 0) continue

      const name = String(row[0] || '').trim()
      if (!name || name === '部门数值' || name === '合计' || name === '总计') {
        // 这是合计行，跳过（合计行会单独处理）
        continue
      }

      const record = createBlankRecord(name)
      
      // 根据表头映射填充数据
      Object.entries(headerMap).forEach(([colIndexStr, field]) => {
        const colIndex = parseInt(colIndexStr, 10)
        if (field !== 'name' && row[colIndex] !== undefined) {
          const value = parseValue(row[colIndex])
          if (value !== null) {
            ;(record as unknown as Record<string, DataValue>)[field] = value
          }
        }
      })

      // 处理新媒体转发合计（如果不是从Excel读取，则自动计算）
      if (record.newMediaTotal === null) {
        const wechat = normalizeShareValue(record.wechatMoments)
        const kuaishou = normalizeShareValue(record.kuaishouShares)
        const douyin = normalizeShareValue(record.douyinShares)
        if (wechat !== null || kuaishou !== null || douyin !== null) {
          record.newMediaTotal = (wechat || 0) + (kuaishou || 0) + (douyin || 0)
        }
      }

      records.push(record)
    }

    return records
  }

  // 从剪贴板文本解析
  const parsePasteData = (text: string): TeacherKpiRecord[] => {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line)
    if (lines.length < 2) {
      throw new Error('数据格式不正确：至少需要表头行和数据行')
    }

    // 解析表头（第一行）
    const headerLine = lines[0]
    // 支持制表符和多个空格分隔
    const headers = headerLine.split(/\t+/).map(h => h.trim()).filter(h => h)
    if (headers.length === 0) {
      // 尝试用多个空格分隔
      const headers2 = headerLine.split(/\s{2,}/).map(h => h.trim()).filter(h => h)
      if (headers2.length > 0) {
        headers.push(...headers2)
      }
    }

    const headerMap: Record<number, keyof TeacherKpiRecord> = {}
    headers.forEach((header, index) => {
      const field = columnMapping[header]
      if (field) {
        headerMap[index] = field
      }
    })

    if (!headerMap[0] || headerMap[0] !== 'name') {
      throw new Error('未找到"姓名"列，请确保第一列是姓名')
    }

    const records: TeacherKpiRecord[] = []

    // 解析数据行
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]
      // 支持制表符和多个空格分隔
      let cells = line.split(/\t+/).map(c => c.trim())
      if (cells.length === 1) {
        cells = line.split(/\s{2,}/).map(c => c.trim())
      }

      const name = cells[0]?.trim() || ''
      if (!name || name === '部门数值' || name === '合计' || name === '总计') {
        continue
      }

      const record = createBlankRecord(name)

      Object.entries(headerMap).forEach(([colIndexStr, field]) => {
        const colIndex = parseInt(colIndexStr, 10)
        if (field !== 'name' && cells[colIndex] !== undefined) {
          const value = parseValue(cells[colIndex])
          if (value !== null) {
            ;(record as unknown as Record<string, DataValue>)[field] = value
          }
        }
      })

      // 处理新媒体转发合计
      if (record.newMediaTotal === null) {
        const wechat = normalizeShareValue(record.wechatMoments)
        const kuaishou = normalizeShareValue(record.kuaishouShares)
        const douyin = normalizeShareValue(record.douyinShares)
        if (wechat !== null || kuaishou !== null || douyin !== null) {
          record.newMediaTotal = (wechat || 0) + (kuaishou || 0) + (douyin || 0)
        }
      }

      records.push(record)
    }

    return records
  }

  // 处理Excel文件上传
  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: 'array' })
      
      // 读取第一个Sheet
      const firstSheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[firstSheetName]
      const data = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: '' })

      const records = parseExcelData(data)
      
      if (records.length === 0) {
        message.warning('未能从Excel中解析出有效数据')
        return
      }

      // 合并到现有数据源
      const existingMap = new Map(
        dataSource.filter((row) => row.rowType !== 'summary').map((row) => [row.name, row])
      )

      const updatedRecords = records.map((record) => {
        const existing = existingMap.get(record.name)
        if (existing) {
          // 合并数据，保留现有数据，只更新导入的字段
          return { ...existing, ...record }
        }
        return record
      })

      // 保留未导入的现有记录
      const otherRecords = Array.from(existingMap.values()).filter(
        (row) => !records.some((r) => r.name === row.name)
      )

      // 重新计算合计行
      const summary = calculateSummary([...updatedRecords, ...otherRecords])
      
      setDataSource([...updatedRecords, ...otherRecords, summary])
      message.success(`成功导入 ${records.length} 条记录`)
      
      // 重置文件输入
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error: any) {
      console.error('Excel导入失败', error)
      message.error(`导入失败：${error.message || '数据格式不正确'}`)
    }
  }

  // 处理剪贴板粘贴
  const handlePasteImport = () => {
    if (!pasteText.trim()) {
      message.warning('请先粘贴数据')
      return
    }

    try {
      const records = parsePasteData(pasteText)
      
      if (records.length === 0) {
        message.warning('未能从粘贴数据中解析出有效记录')
        return
      }

      // 合并到现有数据源
      const existingMap = new Map(
        dataSource.filter((row) => row.rowType !== 'summary').map((row) => [row.name, row])
      )

      const updatedRecords = records.map((record) => {
        const existing = existingMap.get(record.name)
        if (existing) {
          return { ...existing, ...record }
        }
        return record
      })

      const otherRecords = Array.from(existingMap.values()).filter(
        (row) => !records.some((r) => r.name === row.name)
      )

      const summary = calculateSummary([...updatedRecords, ...otherRecords])
      
      setDataSource([...updatedRecords, ...otherRecords, summary])
      setImportModalVisible(false)
      setPasteText('')
      message.success(`成功导入 ${records.length} 条记录`)
    } catch (error: any) {
      console.error('剪贴板导入失败', error)
      message.error(`导入失败：${error.message || '数据格式不正确'}`)
    }
  }

  // 计算合计行
  const calculateSummary = (records: TeacherKpiRecord[]): TeacherKpiRecord => {
    const summary: TeacherKpiRecord = { ...summaryRecord }
    const count = records.length

    if (count === 0) return summary

    // 计算平均值（对于百分比和比率类字段）
    const avgFields: TeacherKpiAverageField[] = [
      'assignmentSubmitRate',
      'assignmentPassRate',
      'examPassRate',
      'attendanceRate',
      'satisfaction',
      'recruitmentCompletion',
    ]

    avgFields.forEach((field) => {
      const values = records
        .map((r) => r[field])
        .filter((v): v is number => typeof v === 'number')
      if (values.length > 0) {
        const sum = values.reduce((a, b) => a + b, 0)
        summary[field] = Number((sum / values.length).toFixed(2))
      }
    })

    // 计算总和（对于数量类字段）
    const sumFields: TeacherKpiSumField[] = [
      'oldStudentLoss',
      'newStudentLoss',
    ]

    sumFields.forEach((field) => {
      const values = records
        .map((r) => r[field])
        .filter((v): v is number => typeof v === 'number')
      if (values.length > 0) {
        summary[field] = values.reduce((a, b) => a + b, 0)
      }
    })

    return summary
  }

  // 自动获取KPI数据
  const handleAutoFetch = async () => {
    try {
      setAutoFetching(true)
      const campus = currentCampus || '主神殿'

      console.log('[handleAutoFetch] 开始自动获取KPI数据:', { campus, year, month })

      // 调用自动计算API
      const response = await autoCalculateTeacherKPI(campus, year, month)

      console.log('[handleAutoFetch] 获取到的数据:', response)

      if (!response.metrics || response.metrics.length === 0) {
        message.warning('未找到可自动计算的数据，请检查数据库中是否有相关记录')
        return
      }

      // 更新数据源
      setDataSource((prev) => {
        const dataRows = prev.filter((row) => row.rowType !== 'summary')
        const summaryRow = prev.find((row) => row.rowType === 'summary') || summaryRecord

        // 合并自动获取的数据到现有数据
        const updatedRows = dataRows.map((row) => {
          const autoData = response.metrics.find((m) => m.name === row.name)
          if (autoData) {
            return {
              ...row,
              assignmentSubmitRate: autoData.assignmentSubmitRate ?? row.assignmentSubmitRate,
              assignmentPassRate: autoData.assignmentPassRate ?? row.assignmentPassRate,
              examPassRate: autoData.examPassRate ?? row.examPassRate,
              employmentCount: autoData.employmentCount ?? row.employmentCount,
              employmentSalary: autoData.employmentSalary ?? row.employmentSalary,
              attendanceRate: autoData.attendanceRate ?? row.attendanceRate,
            }
          }
          return row
        })

        return [...updatedRows, summaryRow]
      })

      message.success(`成功自动获取 ${response.metrics.length} 个教员的KPI数据`)
    } catch (error: any) {
      console.error('[handleAutoFetch] 自动获取KPI数据失败:', error)
      const errorMsg = error?.response?.data?.detail || error?.message || '自动获取失败'
      message.error(`自动获取失败: ${errorMsg}`)
    } finally {
      setAutoFetching(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const records = dataSource
        .filter((row) => row.rowType !== 'summary')
        .map((row) => ({
          name: row.name,
          departmentPerformance: row.departmentPerformance,
          assignmentSubmitRate: row.assignmentSubmitRate,
          assignmentPassRate: row.assignmentPassRate,
          examPassRate: row.examPassRate,
          employmentCount: row.employmentCount,
          employmentSalary: row.employmentSalary,
          attendanceRate: row.attendanceRate,
          oldStudentLoss: row.oldStudentLoss,
          newStudentLoss: row.newStudentLoss,
          satisfaction: row.satisfaction,
          recruitmentCompletion: row.recruitmentCompletion,
          wechatMoments: row.wechatMoments,
          kuaishouShares: row.kuaishouShares,
          douyinShares: row.douyinShares,
          newMediaTotal: row.newMediaTotal,
          leaderReview: row.leaderReview,
        }))

      await saveKpiAssessment({
        campus: currentCampus || '主神殿',
        year,
        month,
        records,
      })
      message.success('保存成功')
    } catch (error) {
      console.error('保存KPI考核数据失败', error)
      message.error('保存失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card bordered={false} style={{ backgroundColor: '#f5f7fa' }}>
      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
        <Title level={4} style={{ marginBottom: 8 }}>
          教员KPI考核数据
        </Title>
        <Text type="secondary">
          {year}年{month}月
        </Text>
      </Space>
      <Text type="secondary">黄色底块为KPI考核项，支持直接在表格中编辑。</Text>

      <Space style={{ marginTop: 12 }}>
        <Button
          type="primary"
          icon={<ThunderboltOutlined />}
          onClick={handleAutoFetch}
          loading={autoFetching}
          title="从数据库自动获取作业提交率、作业合格率、考试合格率、学员就业人数、平均就业薪资、全勤率等指标"
        >
          自动获取
        </Button>
        <Button type="primary" onClick={handleSave} loading={saving}>
          保存
        </Button>
        <Button
          icon={<FileExcelOutlined />}
          onClick={() => {
            setImportType('excel')
            setImportModalVisible(true)
          }}
        >
          从Excel导入
        </Button>
        <Button
          icon={<CopyOutlined />}
          onClick={() => {
            setImportType('paste')
            setImportModalVisible(true)
          }}
        >
          从剪贴板粘贴
        </Button>
      </Space>

      <Table<TeacherKpiRecord>
        bordered
        sticky
        style={{ marginTop: 16 }}
        columns={columns}
        dataSource={dataSource}
        pagination={false}
        rowClassName={(record) => (record.rowType === 'summary' ? 'kpi-summary-row' : '')}
        scroll={{ x: 'max-content' }}
      />

      <div style={{ marginTop: 16, color: '#888' }}>注：黄色底块为KPI考核项</div>

      {/* Excel导入和剪贴板粘贴模态框 */}
      <Modal
        title={importType === 'excel' ? '从Excel导入数据' : '从剪贴板粘贴数据'}
        open={importModalVisible}
        onCancel={() => {
          setImportModalVisible(false)
          setPasteText('')
        }}
        onOk={importType === 'paste' ? handlePasteImport : undefined}
        okText="导入"
        cancelText="取消"
        destroyOnClose
        width={800}
      >
        {importType === 'excel' ? (
          <div>
            <Alert
              message="Excel导入说明"
              description={
                <div>
                  <p>• 请选择包含KPI考核数据的Excel文件</p>
                  <p>• Excel表格应包含表头行（包含"姓名"列）</p>
                  <p>• 支持的列名：姓名、部门业绩、作业/项目提交率、作业/项目合格率、考试合格率、学员就业人数、平均就业薪资、全勤率、老生流失、新生流失、学员满意度、招聘/工作完成率、朋友圈转发、本月快手转发、本月抖音转发、本月新媒体转发合计、领导评价</p>
                  <p>• 导入的数据会与现有数据合并（同名记录会更新）</p>
                </div>
              }
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept=".xlsx,.xls"
              onChange={handleExcelUpload}
            />
            <Button
              type="primary"
              icon={<FileExcelOutlined />}
              onClick={() => fileInputRef.current?.click()}
              block
              size="large"
            >
              选择Excel文件
            </Button>
          </div>
        ) : (
          <div>
            <Alert
              message="剪贴板粘贴说明"
              description={
                <div>
                  <p>• 从Excel或其他表格中复制数据，然后粘贴到下方文本框</p>
                  <p>• 支持制表符分隔或空格分隔的数据</p>
                  <p>• 第一行应为表头（包含"姓名"列）</p>
                  <p>• 支持的列名：姓名、部门业绩、作业/项目提交率、作业/项目合格率、考试合格率、学员就业人数、平均就业薪资、全勤率、老生流失、新生流失、学员满意度、招聘/工作完成率、朋友圈转发、本月快手转发、本月抖音转发、本月新媒体转发合计、领导评价</p>
                  <p>• 导入的数据会与现有数据合并（同名记录会更新）</p>
                </div>
              }
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <TextArea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="请粘贴表格数据（从Excel中复制后直接粘贴）&#10;例如：&#10;姓名	部门业绩	作业/项目提交率	作业/项目合格率	考试合格率	学员就业人数	平均就业薪资	全勤率	老生流失	新生流失	学员满意度	招聘/工作完成率	朋友圈转发	本月快手转发	本月抖音转发	本月新媒体转发合计	领导评价&#10;杜鹏涛	0	98.6	97.3	91.7	16	6464.7	100	0	0	81.5	75	62	62	0	62	9"
              rows={12}
              style={{ fontFamily: 'monospace', fontSize: 12 }}
            />
          </div>
        )}
      </Modal>
    </Card>
  )
}

export default TeacherKpiAssessmentPage
