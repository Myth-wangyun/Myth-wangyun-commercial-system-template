// 学术->学术经理 XX神殿智慧司口碑招生关键点结果明细表
import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import { App,
  Card,
  Table,
  Select,
  Space,
  Typography,
  Row,
  Col,
  Divider,
  InputNumber,
  Input,
  Button,
  Modal,
  Popconfirm,
  AutoComplete,
  Spin,
  Alert,
  Progress,
  List,
  Tag,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useCampusStore } from '@/stores/campusStore'
import {
  fetchReputationKeyPoints,
  saveReputationKeyPoints,
  type ReputationKeyPointDetail,
} from '@/services/reputationKeyPoints'
import { fetchTeachers, type TeacherProfile } from '@/services/configMaster'
import {
  FileExcelOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import * as XLSX from 'xlsx'

const { Option } = Select
const { Title, Text } = Typography

interface OnlinePromotionMetrics {
  wechatMoments: number
  douyin: number
  kuaishou: number
  xiaohongshu: number
  total: number
}

interface StudentInterviewMetrics {
  currentStudent: number
  graduate: number
  total: number
}

interface ReputationDetailBaseRecord {
  id?: number | string
  year: number
  month: number
  campus: string
  teacherName: string
  onlinePromotion: OnlinePromotionMetrics
  studentInterview: StudentInterviewMetrics
}

type RowType = 'data' | 'monthTotal' | 'grandTotal'

interface ReputationDetailTableRow extends ReputationDetailBaseRecord {
  key: string
  rowType: RowType
  monthLabel: string
  monthRowSpan?: number // 为第一行设置合并行数，其余为0
}

type MonthCellRenderResult = {
  children: React.ReactNode
  props: {
    rowSpan: number
  }
}

const normalizeOnlineMetrics = (
  metrics: Omit<OnlinePromotionMetrics, 'total'>,
): OnlinePromotionMetrics => {
  const { wechatMoments, douyin, kuaishou, xiaohongshu } = metrics
  const total = wechatMoments + douyin + kuaishou + xiaohongshu
  return { wechatMoments, douyin, kuaishou, xiaohongshu, total }
}

const normalizeInterviewMetrics = (
  metrics: Omit<StudentInterviewMetrics, 'total'>,
): StudentInterviewMetrics => {
  const { currentStudent, graduate } = metrics
  const total = currentStudent + graduate
  return { currentStudent, graduate, total }
}

const monthOptions = Array.from({ length: 12 }, (_, idx) => idx + 1)
const yearOptions = [dayjs().year(), dayjs().year() - 1, dayjs().year() - 2]

// Excel 导入相关类型
interface ImportedDetailRecord {
  month: number
  teacherName: string
  wechatMoments: number
  douyin: number
  kuaishou: number
  xiaohongshu: number
  onlineTotal: number
  currentStudentInterview: number
  graduateInterview: number
  interviewTotal: number
}

interface ImportedSummaryRecord {
  teacherName: string
  wechatMoments: number
  douyin: number
  kuaishou: number
  xiaohongshu: number
  onlineTotal: number
  currentStudentInterview: number
  graduateInterview: number
  interviewTotal: number
}

interface ImportPreview {
  campus: string
  year: number
  detailRecords: ImportedDetailRecord[]
  summaryRecords: ImportedSummaryRecord[]
  validationErrors: string[]
  summaryMatches: boolean
}

const ReputationDetailsPage: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus, getAllCampuses } = useCampusStore()
  const campusList = getAllCampuses().map((c) => c.name)
  const defaultCampus = currentCampus || campusList[0] || '主神殿'

  const [selectedCampus, setSelectedCampus] = useState(defaultCampus)
  const [selectedYear, setSelectedYear] = useState(dayjs().year())
  const [monthFilter, setMonthFilter] = useState<number | 'all'>('all')
  const [teacherFilter, setTeacherFilter] = useState<string | 'all'>('all')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [addTeacherModalOpen, setAddTeacherModalOpen] = useState(false)
  const [newTeacherName, setNewTeacherName] = useState('')
  const selectedClass: string | undefined = undefined

  // 可编辑的数据源
  const [records, setRecords] = useState<ReputationDetailBaseRecord[]>([])

  // 教员列表状态
  const [allTeachers, setAllTeachers] = useState<TeacherProfile[]>([])
  const [teachersLoading, setTeachersLoading] = useState(false)

  // Excel 导入相关状态
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null)
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const teacherOptions = Array.from(new Set(records.map((item) => item.teacherName))).filter(
    Boolean,
  )

  // AutoComplete 选项列表（配置中心教员 + 已有记录中的教员）
  const teacherAutoCompleteOptions = useMemo(() => {
    const nameSet = new Set<string>()
    // 配置中心教员
    allTeachers.forEach((t) => t.name && nameSet.add(t.name))
    // 已有记录中的教员
    records.forEach((r) => r.teacherName && nameSet.add(r.teacherName))
    return Array.from(nameSet).sort().map((name) => ({ value: name, label: name }))
  }, [allTeachers, records])

  // 获取当前神殿的教员列表
  const loadTeachers = useCallback(async (campusName: string) => {
    if (!campusName) {
      setAllTeachers([])
      return
    }
    setTeachersLoading(true)
    try {
      // 尝试多种神殿名匹配方式
      let teachers: TeacherProfile[] = []
      
      // 先尝试直接匹配
      teachers = await fetchTeachers({ campus_name: campusName, active: true })
      
      // 如果没有结果，尝试去掉神殿后缀
      if (teachers.length === 0 && campusName.endsWith('神殿')) {
        const shortName = campusName.replace(/神殿$/, '')
        teachers = await fetchTeachers({ campus_name: shortName, active: true })
      }
      
      // 如果没有结果，尝试添加神殿后缀
      if (teachers.length === 0 && !campusName.endsWith('神殿')) {
        teachers = await fetchTeachers({ campus_name: `${campusName}神殿`, active: true })
      }
      
      setAllTeachers(teachers)
    } catch (error) {
      console.error('加载教员列表失败:', error)
      message.error('加载教员列表失败')
      setAllTeachers([])
    } finally {
      setTeachersLoading(false)
    }
  }, [])

  // 当神殿变化时，重新加载教员列表
  useEffect(() => {
    loadTeachers(selectedCampus)
  }, [selectedCampus, loadTeachers])

  const fetchRecords = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetchReputationKeyPoints({
        campus: selectedCampus,
        year: selectedYear,
        class_code: selectedClass,
      })
      const mapped = res.records.map<ReputationDetailBaseRecord>((item) => ({
        id: item.id,
        year: item.year,
        month: item.month,
        campus: item.campus_name,
        teacherName: item.teacher_name,
        onlinePromotion: normalizeOnlineMetrics({
          wechatMoments: item.wechat_moments_count,
          douyin: item.douyin_count,
          kuaishou: item.kuaishou_count,
          xiaohongshu: item.xiaohongshu_count,
        }),
        studentInterview: normalizeInterviewMetrics({
          currentStudent: item.current_student_interview_count,
          graduate: item.graduate_interview_count,
        }),
      }))
      setRecords(mapped)
      if (mapped.length === 0) {
        setTeacherFilter('all')
      }
    } catch (error) {
      console.error(error)
      message.error('加载口碑关键点明细失败')
    } finally {
      setLoading(false)
    }
  }, [selectedCampus, selectedYear])

  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const monthMatch = monthFilter === 'all' || record.month === monthFilter
      const teacherMatch = teacherFilter === 'all' || record.teacherName === teacherFilter
      return monthMatch && teacherMatch
    })
  }, [monthFilter, teacherFilter, records])

  // 构建表格数据并计算每月合计与总计，同时设置月份列 rowSpan
  const tableData: ReputationDetailTableRow[] = useMemo(() => {
    if (filteredRecords.length === 0) {
      return []
    }

    const monthlyGroups = filteredRecords.reduce<Record<number, ReputationDetailBaseRecord[]>>(
      (acc, record) => {
        if (!acc[record.month]) {
          acc[record.month] = []
        }
        acc[record.month].push(record)
        return acc
      },
      {},
    )

    const rows: ReputationDetailTableRow[] = []

    Object.keys(monthlyGroups)
      .map((key) => Number(key))
      .sort((a, b) => a - b)
      .forEach((month) => {
        const monthRecords = monthlyGroups[month]

        monthRecords.forEach((record, idx) => {
          rows.push({
            key: `data-${record.id}`,
            rowType: 'data',
            monthLabel: `${record.month}月`,
            monthRowSpan: idx === 0 ? monthRecords.length + 1 : 0, // +1 包含当月合计行
            ...record,
          })
        })

        const monthTotals = monthRecords.reduce(
          (acc, record) => {
            acc.onlinePromotion.wechatMoments += record.onlinePromotion.wechatMoments
            acc.onlinePromotion.douyin += record.onlinePromotion.douyin
            acc.onlinePromotion.kuaishou += record.onlinePromotion.kuaishou
            acc.onlinePromotion.xiaohongshu += record.onlinePromotion.xiaohongshu
            acc.studentInterview.currentStudent += record.studentInterview.currentStudent
            acc.studentInterview.graduate += record.studentInterview.graduate
            return acc
          },
          {
            onlinePromotion: {
              wechatMoments: 0,
              douyin: 0,
              kuaishou: 0,
              xiaohongshu: 0,
            },
            studentInterview: {
              currentStudent: 0,
              graduate: 0,
            },
          },
        )

        rows.push({
          key: `month-total-${month}`,
          rowType: 'monthTotal',
          id: `month-total-${month}`,
          month,
          monthLabel: '合计',
          monthRowSpan: 0, // 被第一行合并覆盖
          campus: '—',
          teacherName: '合计',
          onlinePromotion: normalizeOnlineMetrics(monthTotals.onlinePromotion),
          studentInterview: normalizeInterviewMetrics(monthTotals.studentInterview),
          year: monthRecords[0].year,
        })
      })

    const overallTotals = filteredRecords.reduce(
      (acc, record) => {
        acc.onlinePromotion.wechatMoments += record.onlinePromotion.wechatMoments
        acc.onlinePromotion.douyin += record.onlinePromotion.douyin
        acc.onlinePromotion.kuaishou += record.onlinePromotion.kuaishou
        acc.onlinePromotion.xiaohongshu += record.onlinePromotion.xiaohongshu
        acc.studentInterview.currentStudent += record.studentInterview.currentStudent
        acc.studentInterview.graduate += record.studentInterview.graduate
        return acc
      },
      {
        onlinePromotion: {
          wechatMoments: 0,
          douyin: 0,
          kuaishou: 0,
          xiaohongshu: 0,
        },
        studentInterview: {
          currentStudent: 0,
          graduate: 0,
        },
      },
    )

    rows.push({
      key: 'grand-total',
      rowType: 'grandTotal',
      id: 'grand-total',
      month: 0,
      monthLabel: '总计',
      campus: '—',
      teacherName: '—',
      onlinePromotion: normalizeOnlineMetrics(overallTotals.onlinePromotion),
      studentInterview: normalizeInterviewMetrics(overallTotals.studentInterview),
      year: filteredRecords[0].year,
    })

    return rows
  }, [filteredRecords])

  // 更新某条记录的字段
  const updateRecord = (
    id: number | string | undefined,
    updater: (r: ReputationDetailBaseRecord) => ReputationDetailBaseRecord,
  ) => {
    setRecords((prev) => prev.map((r) => (r.id === id ? updater(r) : r)))
  }

  const columns: ColumnsType<ReputationDetailTableRow> = [
    {
      title: '月份',
      dataIndex: 'month',
      align: 'center',
      width: 80,
      render: (_value, record) => {
        const content =
          record.rowType === 'data'
            ? record.monthLabel
            : record.rowType === 'monthTotal'
              ? ''
              : record.monthLabel
        const rowSpan = record.monthRowSpan ?? 1
        return {
          children: content,
          props: { rowSpan },
        } as MonthCellRenderResult
      },
    },
    {
      title: '神殿',
      dataIndex: 'campus',
      align: 'center',
      width: 120,
    },
    {
      title: '教员姓名',
      dataIndex: 'teacherName',
      align: 'center',
      width: 140,
      render: (v, record) =>
        record.rowType === 'data' ? (
          <Input
            value={record.teacherName}
            onChange={(e) =>
              updateRecord(record.id, (r) =>
                normalizeRecord({
                  ...r,
                  teacherName: e.target.value,
                }),
              )
            }
          />
        ) : (
          <span style={{ fontWeight: 'bold' }}>{v}</span>
        ),
    },
    {
      title: '线上宣传情况',
      children: [
        {
          title: '朋友圈数量',
          dataIndex: ['onlinePromotion', 'wechatMoments'],
          align: 'center',
          width: 120,
          render: (v, record) =>
            record.rowType === 'data' ? (
              <InputNumber
                min={0}
                value={record.onlinePromotion.wechatMoments}
                onChange={(val) =>
                  updateRecord(record.id, (r) =>
                    normalizeRecord({
                      ...r,
                      onlinePromotion: normalizeOnlineMetrics({
                        ...r.onlinePromotion,
                        wechatMoments: Number(val || 0),
                      }),
                    }),
                  )
                }
                style={{ width: '100%' }}
              />
            ) : (
              <span style={{ fontWeight: 'bold' }}>{v}</span>
            ),
        },
        {
          title: '抖音数量',
          dataIndex: ['onlinePromotion', 'douyin'],
          align: 'center',
          width: 100,
          render: (v, record) =>
            record.rowType === 'data' ? (
              <InputNumber
                min={0}
                value={record.onlinePromotion.douyin}
                onChange={(val) =>
                  updateRecord(record.id, (r) =>
                    normalizeRecord({
                      ...r,
                      onlinePromotion: normalizeOnlineMetrics({
                        ...r.onlinePromotion,
                        douyin: Number(val || 0),
                      }),
                    }),
                  )
                }
                style={{ width: '100%' }}
              />
            ) : (
              <span style={{ fontWeight: 'bold' }}>{v}</span>
            ),
        },
        {
          title: '快手数量',
          dataIndex: ['onlinePromotion', 'kuaishou'],
          align: 'center',
          width: 100,
          render: (v, record) =>
            record.rowType === 'data' ? (
              <InputNumber
                min={0}
                value={record.onlinePromotion.kuaishou}
                onChange={(val) =>
                  updateRecord(record.id, (r) =>
                    normalizeRecord({
                      ...r,
                      onlinePromotion: normalizeOnlineMetrics({
                        ...r.onlinePromotion,
                        kuaishou: Number(val || 0),
                      }),
                    }),
                  )
                }
                style={{ width: '100%' }}
              />
            ) : (
              <span style={{ fontWeight: 'bold' }}>{v}</span>
            ),
        },
        {
          title: '小红书数量',
          dataIndex: ['onlinePromotion', 'xiaohongshu'],
          align: 'center',
          width: 120,
          render: (v, record) =>
            record.rowType === 'data' ? (
              <InputNumber
                min={0}
                value={record.onlinePromotion.xiaohongshu}
                onChange={(val) =>
                  updateRecord(record.id, (r) =>
                    normalizeRecord({
                      ...r,
                      onlinePromotion: normalizeOnlineMetrics({
                        ...r.onlinePromotion,
                        xiaohongshu: Number(val || 0),
                      }),
                    }),
                  )
                }
                style={{ width: '100%' }}
              />
            ) : (
              <span style={{ fontWeight: 'bold' }}>{v}</span>
            ),
        },
        {
          title: '合计',
          dataIndex: ['onlinePromotion', 'total'],
          align: 'center',
          width: 100,
          render: (v) => <span style={{ fontWeight: 'bold' }}>{v}</span>,
        },
      ],
    },
    {
      title: '学生访谈情况',
      children: [
        {
          title: '在校生访谈',
          dataIndex: ['studentInterview', 'currentStudent'],
          align: 'center',
          width: 120,
          render: (v) => <span style={{ fontWeight: 'bold' }}>{v}</span>,
        },
        {
          title: '毕业生访谈',
          dataIndex: ['studentInterview', 'graduate'],
          align: 'center',
          width: 120,
          render: (v, record) =>
            record.rowType === 'data' ? (
              <InputNumber
                min={0}
                value={record.studentInterview.graduate}
                onChange={(val) =>
                  updateRecord(record.id, (r) =>
                    normalizeRecord({
                      ...r,
                      studentInterview: normalizeInterviewMetrics({
                        ...r.studentInterview,
                        graduate: Number(val || 0),
                      }),
                    }),
                  )
                }
                style={{ width: '100%' }}
              />
            ) : (
              <span style={{ fontWeight: 'bold' }}>{v}</span>
            ),
        },
        {
          title: '合计',
          dataIndex: ['studentInterview', 'total'],
          align: 'center',
          width: 100,
          render: (v) => <span style={{ fontWeight: 'bold' }}>{v}</span>,
        },
      ],
    },
    {
      title: '操作',
      key: 'actions',
      align: 'center',
      width: 100,
      render: (_value, record) =>
        record.rowType === 'data' ? (
          <Popconfirm title="确定删除该行吗？" onConfirm={() => handleDeleteRecord(record.id)}>
            <Button type="link" danger size="small">
              删除
            </Button>
          </Popconfirm>
        ) : null,
    },
  ]

  function normalizeRecord(r: ReputationDetailBaseRecord): ReputationDetailBaseRecord {
    return {
      ...r,
      onlinePromotion: normalizeOnlineMetrics({
        wechatMoments: r.onlinePromotion.wechatMoments,
        douyin: r.onlinePromotion.douyin,
        kuaishou: r.onlinePromotion.kuaishou,
        xiaohongshu: r.onlinePromotion.xiaohongshu,
      }),
      studentInterview: normalizeInterviewMetrics({
        currentStudent: r.studentInterview.currentStudent,
        graduate: r.studentInterview.graduate,
      }),
    }
  }

  const openAddTeacherModal = () => {
    setNewTeacherName('')
    setAddTeacherModalOpen(true)
  }

  const handleConfirmAddTeacher = () => {
    const name = newTeacherName.trim()
    if (!name) {
      message.warning('请输入教员姓名')
      return
    }
    setRecords((prev) => {
      const existingKeys = new Set(
        prev
          .filter((item) => item.teacherName === name && item.year === selectedYear)
          .map((item) => `${item.month}-${item.teacherName}`),
      )
      const months = Array.from({ length: 12 }, (_, idx) => idx + 1)
      const additions = months
        .filter((month) => !existingKeys.has(`${month}-${name}`))
        .map((month) => ({
          id: `temp-${Date.now()}-${month}`,
          year: selectedYear,
          month,
          campus: selectedCampus,
          teacherName: name,
          onlinePromotion: normalizeOnlineMetrics({
            wechatMoments: 0,
            douyin: 0,
            kuaishou: 0,
            xiaohongshu: 0,
          }),
          studentInterview: normalizeInterviewMetrics({
            currentStudent: 0,
            graduate: 0,
          }),
        }))
      if (additions.length === 0) {
        message.info('该教员本年度的明细已存在')
        return prev
      }
      const merged = [...prev, ...additions].sort((a, b) => {
        if (a.month === b.month) {
          return a.teacherName.localeCompare(b.teacherName)
        }
        return a.month - b.month
      })
      message.success('已为该教员生成全年明细')
      return merged
    })
    setAddTeacherModalOpen(false)
  }

  const handleDeleteRecord = (id?: number | string) => {
    setRecords((prev) => prev.filter((item) => item.id !== id))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payloadRecords: ReputationKeyPointDetail[] = records.map((record) => ({
        campus_name: selectedCampus,
        year: selectedYear,
        month: record.month,
        teacher_name: record.teacherName || '',
        wechat_moments_count: record.onlinePromotion.wechatMoments,
        douyin_count: record.onlinePromotion.douyin,
        kuaishou_count: record.onlinePromotion.kuaishou,
        xiaohongshu_count: record.onlinePromotion.xiaohongshu,
        current_student_interview_count: record.studentInterview.currentStudent,
        graduate_interview_count: record.studentInterview.graduate,
      }))
      const res = await saveReputationKeyPoints({
        campus_name: selectedCampus,
        year: selectedYear,
        class_code: selectedClass,
        records: payloadRecords,
      })
      const mapped = res.records.map<ReputationDetailBaseRecord>((item) => ({
        id: item.id,
        year: item.year,
        month: item.month,
        campus: item.campus_name,
        teacherName: item.teacher_name,
        onlinePromotion: normalizeOnlineMetrics({
          wechatMoments: item.wechat_moments_count,
          douyin: item.douyin_count,
          kuaishou: item.kuaishou_count,
          xiaohongshu: item.xiaohongshu_count,
        }),
        studentInterview: normalizeInterviewMetrics({
          currentStudent: item.current_student_interview_count,
          graduate: item.graduate_interview_count,
        }),
      }))
      setRecords(mapped)
      message.success('保存成功')
    } catch (error) {
      console.error(error)
      message.error('保存失败，请稍后重试')
    } finally {
      setSaving(false)
    }
  }

  // ==================== Excel 导入相关函数 ====================

  /**
   * 解析数字
   */
  const parseNumber = (value: unknown): number => {
    if (value === undefined || value === null || value === '') return 0
    const num = Number(value)
    return isNaN(num) ? 0 : Math.round(num)
  }

  /**
   * 解析汇总 Sheet（第1个Sheet）
   * 格式：序号 | 神殿 | 教员姓名 | 朋友圈数量 | 抖音数量 | 快手数量 | 小红书数量 | 合计 | 在校生访谈 | 毕业生访谈 | 合计
   */
  const parseSummarySheet = (sheet: XLSX.WorkSheet): ImportedSummaryRecord[] => {
    console.log('%c[Excel导入] 开始解析汇总 Sheet', 'color: #1890ff; font-weight: bold')
    const data = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: '' })
    const records: ImportedSummaryRecord[] = []

    // 找到表头行（包含"教员姓名"或"班主任姓名"的行）
    let headerRowIndex = -1
    let teacherColIndex = -1
    let wechatColIndex = -1

    for (let i = 0; i < Math.min(10, data.length); i++) {
      const row = data[i]
      for (let j = 0; j < row.length; j++) {
        const cell = String(row[j] || '').trim()
        if (cell.includes('教员姓名') || cell.includes('班主任姓名')) {
          headerRowIndex = i
          teacherColIndex = j
        }
        if (cell.includes('朋友圈')) {
          wechatColIndex = j
        }
      }
      if (headerRowIndex >= 0 && wechatColIndex >= 0) break
    }

    if (headerRowIndex < 0 || teacherColIndex < 0 || wechatColIndex < 0) {
      console.log('%c[Excel导入] 汇总 Sheet 无法定位表头', 'color: orange')
      return records
    }

    console.log(`%c[Excel导入] 汇总 Sheet 表头行: ${headerRowIndex}, 教员列: ${teacherColIndex}, 朋友圈列: ${wechatColIndex}`, 'color: green')

    // 解析数据行
    for (let i = headerRowIndex + 1; i < data.length; i++) {
      const row = data[i]
      const teacherName = String(row[teacherColIndex] || '').trim()

      // 跳过空行和合计行
      if (!teacherName || teacherName === '合计' || teacherName === '总计') continue

      const record: ImportedSummaryRecord = {
        teacherName,
        wechatMoments: parseNumber(row[wechatColIndex]),
        douyin: parseNumber(row[wechatColIndex + 1]),
        kuaishou: parseNumber(row[wechatColIndex + 2]),
        xiaohongshu: parseNumber(row[wechatColIndex + 3]),
        onlineTotal: parseNumber(row[wechatColIndex + 4]),
        currentStudentInterview: parseNumber(row[wechatColIndex + 5]),
        graduateInterview: parseNumber(row[wechatColIndex + 6]),
        interviewTotal: parseNumber(row[wechatColIndex + 7]),
      }

      records.push(record)
      console.log(`%c[Excel导入] 汇总记录: ${teacherName}`, 'color: #666')
    }

    console.log(`%c[Excel导入] 汇总 Sheet 解析完成, 共 ${records.length} 条记录`, 'color: green; font-weight: bold')
    return records
  }

  /**
   * 解析明细 Sheet（第2个Sheet）
   * 格式：月份 | 神殿 | 教员姓名 | 朋友圈数量 | 抖音数量 | 快手数量 | 小红书数量 | 合计 | 在校生访谈 | 毕业生访谈 | 合计
   */
  const parseDetailSheet = (sheet: XLSX.WorkSheet): ImportedDetailRecord[] => {
    console.log('%c[Excel导入] 开始解析明细 Sheet', 'color: #1890ff; font-weight: bold')
    const data = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: '' })
    const records: ImportedDetailRecord[] = []

    // 找到表头行
    let headerRowIndex = -1
    let monthColIndex = -1
    let teacherColIndex = -1
    let wechatColIndex = -1

    for (let i = 0; i < Math.min(10, data.length); i++) {
      const row = data[i]
      for (let j = 0; j < row.length; j++) {
        const cell = String(row[j] || '').trim()
        if (cell === '月份' || cell.includes('月份')) {
          monthColIndex = j
          headerRowIndex = i
        }
        if (cell.includes('教员姓名') || cell.includes('班主任姓名')) {
          teacherColIndex = j
        }
        if (cell.includes('朋友圈')) {
          wechatColIndex = j
        }
      }
      if (headerRowIndex >= 0 && teacherColIndex >= 0 && wechatColIndex >= 0) break
    }

    if (headerRowIndex < 0 || teacherColIndex < 0 || wechatColIndex < 0) {
      console.log('%c[Excel导入] 明细 Sheet 无法定位表头', 'color: orange')
      return records
    }

    console.log(`%c[Excel导入] 明细 Sheet 表头行: ${headerRowIndex}, 月份列: ${monthColIndex}, 教员列: ${teacherColIndex}, 朋友圈列: ${wechatColIndex}`, 'color: green')

    // 解析数据行
    let currentMonth = 0
    for (let i = headerRowIndex + 1; i < data.length; i++) {
      const row = data[i]
      const teacherName = String(row[teacherColIndex] || '').trim()

      // 跳过空行和合计行
      if (!teacherName || teacherName === '合计' || teacherName === '总计') {
        // 检查是否有月份信息（合并单元格情况）
        const monthCell = String(row[monthColIndex] || '').trim()
        const monthMatch = monthCell.match(/(\d+)/)
        if (monthMatch) {
          currentMonth = parseInt(monthMatch[1], 10)
        }
        continue
      }

      // 获取月份
      const monthCell = String(row[monthColIndex] || '').trim()
      const monthMatch = monthCell.match(/(\d+)/)
      if (monthMatch) {
        currentMonth = parseInt(monthMatch[1], 10)
      }

      if (currentMonth < 1 || currentMonth > 12) continue

      const record: ImportedDetailRecord = {
        month: currentMonth,
        teacherName,
        wechatMoments: parseNumber(row[wechatColIndex]),
        douyin: parseNumber(row[wechatColIndex + 1]),
        kuaishou: parseNumber(row[wechatColIndex + 2]),
        xiaohongshu: parseNumber(row[wechatColIndex + 3]),
        onlineTotal: parseNumber(row[wechatColIndex + 4]),
        currentStudentInterview: parseNumber(row[wechatColIndex + 5]),
        graduateInterview: parseNumber(row[wechatColIndex + 6]),
        interviewTotal: parseNumber(row[wechatColIndex + 7]),
      }

      records.push(record)
      console.log(`%c[Excel导入] 明细记录: ${currentMonth}月 - ${teacherName}`, 'color: #666')
    }

    console.log(`%c[Excel导入] 明细 Sheet 解析完成, 共 ${records.length} 条记录`, 'color: green; font-weight: bold')
    return records
  }

  /**
   * 校验明细汇总是否与汇总 Sheet 一致
   */
  const validateSummary = (
    detailRecords: ImportedDetailRecord[],
    summaryRecords: ImportedSummaryRecord[]
  ): { matches: boolean; errors: string[] } => {
    const errors: string[] = []

    // 按教员汇总明细数据
    const detailSummaryMap = new Map<string, ImportedSummaryRecord>()
    detailRecords.forEach((record) => {
      const existing = detailSummaryMap.get(record.teacherName) || {
        teacherName: record.teacherName,
        wechatMoments: 0,
        douyin: 0,
        kuaishou: 0,
        xiaohongshu: 0,
        onlineTotal: 0,
        currentStudentInterview: 0,
        graduateInterview: 0,
        interviewTotal: 0,
      }
      existing.wechatMoments += record.wechatMoments
      existing.douyin += record.douyin
      existing.kuaishou += record.kuaishou
      existing.xiaohongshu += record.xiaohongshu
      existing.onlineTotal += record.onlineTotal
      existing.currentStudentInterview += record.currentStudentInterview
      existing.graduateInterview += record.graduateInterview
      existing.interviewTotal += record.interviewTotal
      detailSummaryMap.set(record.teacherName, existing)
    })

    // 对比汇总 Sheet
    summaryRecords.forEach((summaryRecord) => {
      const detailSummary = detailSummaryMap.get(summaryRecord.teacherName)
      if (!detailSummary) {
        errors.push(`汇总表中教员 "${summaryRecord.teacherName}" 在明细表中未找到`)
        return
      }

      // 检查各指标是否一致
      if (detailSummary.wechatMoments !== summaryRecord.wechatMoments) {
        errors.push(`${summaryRecord.teacherName}: 朋友圈数量不一致 (明细合计: ${detailSummary.wechatMoments}, 汇总: ${summaryRecord.wechatMoments})`)
      }
      if (detailSummary.graduateInterview !== summaryRecord.graduateInterview) {
        errors.push(`${summaryRecord.teacherName}: 毕业生访谈不一致 (明细合计: ${detailSummary.graduateInterview}, 汇总: ${summaryRecord.graduateInterview})`)
      }
    })

    return { matches: errors.length === 0, errors }
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

      if (workbook.SheetNames.length < 2) {
        message.warning('Excel 文件需要包含至少 2 个 Sheet（第1个汇总，第2个明细）')
        return
      }

      // 解析第1个 Sheet（汇总）
      const summarySheet = workbook.Sheets[workbook.SheetNames[0]]
      const summaryRecords = parseSummarySheet(summarySheet)

      // 解析第2个 Sheet（明细）
      const detailSheet = workbook.Sheets[workbook.SheetNames[1]]
      const detailRecords = parseDetailSheet(detailSheet)

      if (detailRecords.length === 0) {
        message.warning('未能从明细 Sheet 中解析出有效数据')
        return
      }

      // 校验汇总
      const { matches, errors } = validateSummary(detailRecords, summaryRecords)

      // 设置预览数据
      setImportPreview({
        campus: selectedCampus,
        year: selectedYear,
        detailRecords,
        summaryRecords,
        validationErrors: errors,
        summaryMatches: matches,
      })
      setImportModalOpen(true)

      message.success(`成功解析 ${detailRecords.length} 条明细记录`)
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
    if (!importPreview || importPreview.detailRecords.length === 0) {
      message.warning('没有可导入的数据')
      return
    }

    setImporting(true)

    try {
      // 转换为后端需要的格式
      const payloadRecords: ReputationKeyPointDetail[] = importPreview.detailRecords.map((record) => ({
        campus_name: selectedCampus,
        year: selectedYear,
        month: record.month,
        teacher_name: record.teacherName,
        wechat_moments_count: record.wechatMoments,
        douyin_count: record.douyin,
        kuaishou_count: record.kuaishou,
        xiaohongshu_count: record.xiaohongshu,
        current_student_interview_count: record.currentStudentInterview,
        graduate_interview_count: record.graduateInterview,
      }))

      // 调用保存接口（覆盖写入）
      const res = await saveReputationKeyPoints({
        campus_name: selectedCampus,
        year: selectedYear,
        class_code: selectedClass,
        records: payloadRecords,
      })

      // 更新本地数据
      const mapped = res.records.map<ReputationDetailBaseRecord>((item) => ({
        id: item.id,
        year: item.year,
        month: item.month,
        campus: item.campus_name,
        teacherName: item.teacher_name,
        onlinePromotion: normalizeOnlineMetrics({
          wechatMoments: item.wechat_moments_count,
          douyin: item.douyin_count,
          kuaishou: item.kuaishou_count,
          xiaohongshu: item.xiaohongshu_count,
        }),
        studentInterview: normalizeInterviewMetrics({
          currentStudent: item.current_student_interview_count,
          graduate: item.graduate_interview_count,
        }),
      }))
      setRecords(mapped)

      message.success(`导入成功！共 ${importPreview.detailRecords.length} 条记录`)
      handleCloseImportModal()
    } catch (error) {
      console.error('[Excel导入] 保存失败:', error)
      message.error('导入失败，请稍后重试')
    } finally {
      setImporting(false)
    }
  }

  /**
   * 关闭导入弹窗
   */
  const handleCloseImportModal = () => {
    setImportModalOpen(false)
    setImportPreview(null)
    setImporting(false)
  }

  return (
    <Card bordered={false} style={{ backgroundColor: '#f5f7fa' }}>
      <Row justify="space-between" align="middle">
        <Col>
          <Title level={4} style={{ marginBottom: 0 }}>
            {selectedCampus}神殿智慧司口碑招生关键点结果明细表（{selectedYear}年）
          </Title>
          <Text type="secondary">统计维度涵盖线上宣传与学生访谈情况</Text>
        </Col>
        <Col>
          <Space>
            <Button onClick={openAddTeacherModal}>新增教员明细</Button>
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
            <Button type="primary" loading={saving} onClick={handleSave}>
              保存数据
            </Button>
          </Space>
        </Col>
      </Row>

      <Divider style={{ margin: '16px 0' }} />

      <Space wrap style={{ marginBottom: 16 }}>
        <Space size="small">
          <Text strong>神殿：</Text>
          <Select<string>
            value={selectedCampus}
            onChange={setSelectedCampus}
            style={{ width: 160 }}
          >
            {campusList.map((campus) => (
              <Option key={campus} value={campus}>
                {campus}
              </Option>
            ))}
          </Select>
        </Space>

        <Space size="small">
          <Text strong>年份：</Text>
          <Select<number> value={selectedYear} onChange={setSelectedYear} style={{ width: 120 }}>
            {yearOptions.map((year) => (
              <Option key={year} value={year}>
                {year}
              </Option>
            ))}
          </Select>
        </Space>

        <Space size="small">
          <Text strong>月份：</Text>
          <Select<number | 'all'>
            value={monthFilter}
            onChange={(value) => setMonthFilter(value)}
            style={{ width: 160 }}
          >
            <Option value="all">全部月份</Option>
            {monthOptions.map((month) => (
              <Option key={month} value={month}>{`${month}月`}</Option>
            ))}
          </Select>
        </Space>

        <Space size="small">
          <Text strong>教员姓名：</Text>
          <Select<string | 'all'>
            value={teacherFilter}
            onChange={(value) => setTeacherFilter(value)}
            style={{ width: 160 }}
          >
            <Option value="all">全部教员</Option>
            {teacherOptions.map((teacher) => (
              <Option key={teacher} value={teacher}>
                {teacher}
              </Option>
            ))}
          </Select>
        </Space>
      </Space>

      <Table<ReputationDetailTableRow>
        bordered
        columns={columns}
        dataSource={tableData}
        pagination={false}
        loading={loading}
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: '暂无数据，请调整筛选条件' }}
        rowClassName={(record) => {
          if (record.rowType === 'monthTotal') {
            return 'detail-table-month-total'
          }
          if (record.rowType === 'grandTotal') {
            return 'detail-table-grand-total'
          }
          return ''
        }}
      />

      <Modal
        title="新增教员明细"
        open={addTeacherModalOpen}
        onOk={handleConfirmAddTeacher}
        onCancel={() => setAddTeacherModalOpen(false)}
        destroyOnClose
        okText="生成全年明细"
      >
        <Spin spinning={teachersLoading}>
          <AutoComplete
            value={newTeacherName}
            onChange={(value) => setNewTeacherName(value)}
            options={teacherAutoCompleteOptions}
            placeholder="请输入或选择教员姓名"
            style={{ width: '100%' }}
            filterOption={(inputValue, option) =>
              option?.value?.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
            }
            allowClear
            autoFocus
          />
        </Spin>
        <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
          将为该教员在 {selectedYear} 年的 12 个月生成默认记录，线上宣传与访谈值均为 0。
        </Text>
      </Modal>

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
            disabled={!importPreview || importPreview.detailRecords.length === 0}
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
                  <p>• 将导入到：<strong>{importPreview.campus}</strong> 神殿 <strong>{importPreview.year}年</strong></p>
                  <p>• 导入方式：<strong>覆盖写入</strong>（将替换该神殿该年度的全部明细数据）</p>
                  <p>• Excel 格式：第1个 Sheet 为汇总表，第2个 Sheet 为明细表</p>
                </div>
              }
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            {/* 汇总校验结果 */}
            {importPreview.summaryRecords.length > 0 && (
              <Alert
                message={
                  importPreview.summaryMatches ? (
                    <Space>
                      <CheckCircleOutlined style={{ color: '#52c41a' }} />
                      汇总校验通过
                    </Space>
                  ) : (
                    <Space>
                      <WarningOutlined style={{ color: '#faad14' }} />
                      汇总校验有差异（不影响导入）
                    </Space>
                  )
                }
                description={
                  !importPreview.summaryMatches && importPreview.validationErrors.length > 0 ? (
                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                      {importPreview.validationErrors.slice(0, 5).map((err, idx) => (
                        <li key={idx} style={{ color: '#faad14' }}>{err}</li>
                      ))}
                      {importPreview.validationErrors.length > 5 && (
                        <li style={{ color: '#999' }}>...还有 {importPreview.validationErrors.length - 5} 条差异</li>
                      )}
                    </ul>
                  ) : null
                }
                type={importPreview.summaryMatches ? 'success' : 'warning'}
                showIcon={false}
                style={{ marginBottom: 16 }}
              />
            )}

            {/* 明细数据统计 */}
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={8}>
                <Card size="small">
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>
                      {importPreview.detailRecords.length}
                    </div>
                    <div style={{ color: '#666' }}>明细记录数</div>
                  </div>
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small">
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>
                      {new Set(importPreview.detailRecords.map(r => r.teacherName)).size}
                    </div>
                    <div style={{ color: '#666' }}>教员人数</div>
                  </div>
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small">
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 'bold', color: '#722ed1' }}>
                      {new Set(importPreview.detailRecords.map(r => r.month)).size}
                    </div>
                    <div style={{ color: '#666' }}>月份数</div>
                  </div>
                </Card>
              </Col>
            </Row>

            {/* 明细数据预览表格 */}
            <Table
              size="small"
              dataSource={importPreview.detailRecords.slice(0, 20).map((r, idx) => ({ ...r, key: idx }))}
              columns={[
                { title: '月份', dataIndex: 'month', width: 60, render: (v) => `${v}月` },
                { title: '教员', dataIndex: 'teacherName', width: 80 },
                { title: '朋友圈', dataIndex: 'wechatMoments', width: 70, align: 'right' as const },
                { title: '抖音', dataIndex: 'douyin', width: 60, align: 'right' as const },
                { title: '快手', dataIndex: 'kuaishou', width: 60, align: 'right' as const },
                { title: '小红书', dataIndex: 'xiaohongshu', width: 70, align: 'right' as const },
                { title: '在校生访谈', dataIndex: 'currentStudentInterview', width: 90, align: 'right' as const },
                { title: '毕业生访谈', dataIndex: 'graduateInterview', width: 90, align: 'right' as const },
              ]}
              pagination={false}
              scroll={{ y: 300 }}
              footer={() => (
                importPreview.detailRecords.length > 20 ? (
                  <div style={{ textAlign: 'center', color: '#999' }}>
                    仅显示前 20 条，共 {importPreview.detailRecords.length} 条记录
                  </div>
                ) : null
              )}
            />
          </>
        )}
      </Modal>
    </Card>
  )
}

export default ReputationDetailsPage
