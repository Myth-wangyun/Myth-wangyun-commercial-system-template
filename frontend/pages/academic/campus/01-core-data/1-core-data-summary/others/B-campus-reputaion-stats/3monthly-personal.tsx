import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { App,
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  AutoComplete,
  InputNumber,
  Space,
  Popconfirm,
  Row,
  Col,
  Statistic,
  Typography,
  Tooltip,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { PlusOutlined, EditOutlined, DeleteOutlined, SaveOutlined, DollarOutlined, UndoOutlined } from '@ant-design/icons'
import { useCampusStore } from '@/stores/campusStore'
import { STORAGE_KEYS } from '@/pages/academic/teaching-content/constants'
import {
  loadCampusData,
  saveCampusData,
} from '@/pages/academic/teaching-content/shared/campusStorage'
import CampusSelector from '@/components/common/CampusSelector'
import { buildApiUrl } from '@/utils/apiBase'

const { Title } = Typography
const { Option } = Select

const MONTHS = Array.from({ length: 12 }, (_, index) => index + 1)

// 教员列表接口类型
interface Teacher {
  id: number
  name: string
  campus_code: string
  is_active: boolean
  participate_kpi: boolean
}

const nameOrder = (name: string, teacherNames: string[]): number => {
  const index = teacherNames.indexOf(name)
  return index === -1 ? teacherNames.length : index
}

const sortEntries = (entries: MonthlyPersonalEntry[], teacherNames: string[]): MonthlyPersonalEntry[] => {
  return [...entries].sort((a, b) => {
    if (a.month !== b.month) {
      return a.month - b.month
    }
    const orderDiff = nameOrder(a.name, teacherNames) - nameOrder(b.name, teacherNames)
    if (orderDiff !== 0) {
      return orderDiff
    }
    return a.name.localeCompare(b.name, 'zh-CN')
  })
}

interface MonthlyPersonalEntry {
  id: string
  month: number // 1 - 12
  name: string
  targetReputation: number
  actualReputation: number
  targetVisit: number
  actualVisit: number
  targetEnrollment: number
  actualEnrollment: number
  targetIncome: number
  actualIncome: number
}

interface MonthlyPersonalRow extends MonthlyPersonalEntry {
  rowType: 'entry' | 'summary' | 'overall'
  serialNumber: number | string
  monthRowSpan?: number // 用于月份列合并行
  isFirstOfMonth?: boolean // 是否是该月份的第一行
}

// 可编辑单元格组件 - 使用 React.memo 优化性能
// 采用"点击即编辑"模式，只有当前编辑的单元格才渲染 InputNumber
interface EditableCellProps {
  value: number
  recordId: string
  recordRowType: 'entry' | 'summary' | 'overall'
  field: keyof MonthlyPersonalEntry
  onChange: (id: string, field: keyof MonthlyPersonalEntry, value: number) => void
  isEditing: boolean
  isCurrency?: boolean
}

const EditableCell = React.memo<EditableCellProps>(({ 
  value, 
  recordId, 
  recordRowType, 
  field, 
  onChange, 
  isEditing, 
  isCurrency 
}) => {
  const [isActive, setIsActive] = useState(false) // 当前单元格是否处于编辑状态

  // 当退出编辑模式时，重置 isActive 状态
  useEffect(() => {
    if (!isEditing) {
      setIsActive(false)
    }
  }, [isEditing])

  // 当输入值变化时立即同步到父组件，避免滚动时数据丢失
  const handleChange = useCallback((v: number | null) => {
    const newValue = v ?? 0
    // 立即同步到父组件的 editedData
    if (newValue !== value) {
      onChange(recordId, field, newValue)
    }
  }, [value, onChange, recordId, field])

  const handleBlur = useCallback(() => {
    setIsActive(false)
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === 'Escape') {
      setIsActive(false)
      ;(e.target as HTMLElement)?.blur()
    }
  }, [])

  // 格式化显示值
  const displayText = isCurrency && value ? `¥${value.toLocaleString()}` : (value?.toLocaleString() || '0')

  // 汇总行和月小计行不可编辑
  if (recordRowType === 'summary' || recordRowType === 'overall') {
    return <span>{displayText}</span>
  }

  // 非编辑模式
  if (!isEditing) {
    return <span>{displayText}</span>
  }

  // 编辑模式但未激活 - 显示可点击的文本
  if (!isActive) {
    return (
      <span 
        onClick={() => setIsActive(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setIsActive(true)
          }
        }}
        role="button"
        tabIndex={0}
        style={{ 
          cursor: 'pointer', 
          padding: '4px 8px',
          borderRadius: 4,
          backgroundColor: '#fafafa',
          border: '1px dashed #d9d9d9',
          display: 'inline-block',
          minWidth: 60,
          textAlign: 'right',
        }}
        title="点击编辑"
      >
        {displayText}
      </span>
    )
  }

  // 当前单元格激活 - 显示输入框
  return (
    <InputNumber
      size="small"
      min={0}
      value={value}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      style={{ width: '100%' }}
      prefix={isCurrency ? '¥' : undefined}
      autoFocus
    />
  )
})

interface MonthlyPersonalFormValues {
  month: number
  name: string
  targetReputation: number
  actualReputation: number
  targetVisit: number
  actualVisit: number
  targetEnrollment: number
  actualEnrollment: number
  targetIncome: number
  actualIncome: number
}

const createDefaultEntries = (teacherNames: string[]): MonthlyPersonalEntry[] => {
  const entries: MonthlyPersonalEntry[] = []
  MONTHS.forEach((month) => {
    teacherNames.forEach((name, idx) => {
      entries.push({
        id: `${month}-${idx}`,
        month,
        name,
        targetReputation: 0,
        actualReputation: 0,
        targetVisit: 0,
        actualVisit: 0,
        targetEnrollment: 0,
        actualEnrollment: 0,
        targetIncome: 0,
        actualIncome: 0,
      })
    })
  })
  return entries
}

const formatNumber = (value: number): string => value.toLocaleString()

type MonthlyPersonalApiRow = {
  姓名?: string
  月份?: number
  目标口碑量?: number | string
  实际口碑量?: number | string
  目标上门量?: number | string
  实际上门量?: number | string
  目标招生人数?: number | string
  实际招生人数?: number | string
  目标口碑收入?: number | string
  实际口碑收入?: number | string
}

const toNumber = (value: unknown): number => {
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

const normalizeMonthlyRows = (rows: MonthlyPersonalApiRow[]): MonthlyPersonalEntry[] =>
  rows
    .filter((row) => {
      const name = row.姓名?.trim() || ''
      return name && name !== '暂无教员' && name !== '……'
    })
    .map((row, index) => ({
      id: `${row.月份 ?? index}-${row.姓名 ?? index}`,
      month: Number(row.月份) || 0,
      name: row.姓名 ?? '',
      targetReputation: toNumber(row.目标口碑量),
      actualReputation: toNumber(row.实际口碑量),
      targetVisit: toNumber(row.目标上门量),
      actualVisit: toNumber(row.实际上门量),
      targetEnrollment: toNumber(row.目标招生人数),
      actualEnrollment: toNumber(row.实际招生人数),
      targetIncome: toNumber(row.目标口碑收入),
      actualIncome: toNumber(row.实际口碑收入),
    }))

const CampusReputationMonthlyPersonalPage: React.FC = () => {
  const { message, modal } = App.useApp()
  const { currentCampus, getAllCampuses } = useCampusStore()
  const activeCampus = currentCampus ?? getAllCampuses()[0]?.name ?? '主神殿'
  const currentYear = new Date().getFullYear()

  const [teacherNames, setTeacherNames] = useState<string[]>([])
  const [records, setRecords] = useState<MonthlyPersonalEntry[]>([])
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all')
  const [selectedName, setSelectedName] = useState<string>('all')
  const [modalVisible, setModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<MonthlyPersonalEntry | null>(null)
  const [form] = Form.useForm<MonthlyPersonalFormValues>()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [autoFilling, setAutoFilling] = useState(false)
  const [loadingTeachers, setLoadingTeachers] = useState(false)
  const [nameAutoCompleteOpen, setNameAutoCompleteOpen] = useState(false)
  // 编辑模式状态
  const [isEditing, setIsEditing] = useState(false)
  const [editedData, setEditedData] = useState<Map<string, Partial<MonthlyPersonalEntry>>>(new Map())
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // 可选姓名列表：优先使用教员列表，回退已有记录中的姓名
  const allAvailableNames = useMemo(() => {
    const set = new Set<string>()
    teacherNames.forEach((n) => n && set.add(n))
    records.forEach((r) => r.name && set.add(r.name))
    return Array.from(set).sort()
  }, [teacherNames, records])

  // 从配置中心获取教员列表
  useEffect(() => {
    const loadTeachers = async () => {
      setLoadingTeachers(true)
      try {
        // 直接使用 campus_name 参数（后端 API 使用 campus_name 而非 campus_code）
        const params = new URLSearchParams({
          active: 'true',
          participate_kpi: 'true',
          campus_name: activeCampus,
        })

        const url = `${buildApiUrl('/config/teachers')}?${params.toString()}`
        console.log('请求教员列表 URL:', url)
        const res = await fetch(url)
        if (res.ok) {
          const teachers: Teacher[] = await res.json()
          console.log(`获取到 ${teachers.length} 个教员（原始数据）:`, teachers)
          const names = teachers
            .filter((t) => t.is_active && t.participate_kpi)
            .map((t) => t.name)
            .sort()
          console.log(`过滤后得到 ${names.length} 个教员:`, names)
          // 严格按神殿过滤，不fallback到所有神殿
          setTeacherNames(names)
          if (names.length > 0) {
            console.log(`✅ 成功设置教员列表: ${names.length} 个`, names)
          } else {
            console.warn(`⚠️ 神殿 ${activeCampus} 没有找到符合条件的教员`)
          }
        } else {
          const errorText = await res.text()
          console.error('获取教员列表失败:', res.status, errorText)
          setTeacherNames([])
        }
      } catch (error) {
        console.error('获取教员列表失败:', error)
        setTeacherNames([])
      } finally {
        setLoadingTeachers(false)
      }
    }
    loadTeachers()
  }, [activeCampus])

  // 从后端加载数据（依赖教员列表）
  useEffect(() => {
    // 如果教员列表为空，不加载数据（等待教员列表加载完成）
    // 但如果教员列表已经加载完成（loadingTeachers === false），即使为空也继续加载，避免无限等待
    if (teacherNames.length === 0 && loadingTeachers) {
      console.log('等待教员列表加载完成...')
      return
    }

    const loadData = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({
          campus: activeCampus,
          year: currentYear.toString(),
        })
        const res = await fetch(`${buildApiUrl('/reputation-monthly-personal')}?${params.toString()}`)
        if (res.ok) {
          const data = await res.json()
          const rows: MonthlyPersonalApiRow[] = Array.isArray(data.行列表) ? data.行列表 : []
          const converted = normalizeMonthlyRows(rows)
          if (converted.length > 0) {
            setRecords(sortEntries(converted, teacherNames))
          } else {
            // 如果没有数据，根据教员列表生成默认数据
            if (teacherNames.length > 0) {
              const fallback = createDefaultEntries(teacherNames)
              const loaded = loadCampusData<MonthlyPersonalEntry[]>(
                STORAGE_KEYS.CAMPUS_REPUTATION_MONTHLY_PERSONAL,
                activeCampus,
                fallback,
              )
              // 过滤掉本地存储中不在当前教员列表中的数据（避免显示"暂无教员"等无效数据）
              const validLoaded = loaded && loaded.length > 0
                ? loaded.filter((r) => teacherNames.includes(r.name) || r.name.trim() === '')
                : fallback
              setRecords(sortEntries(validLoaded.length > 0 ? validLoaded : fallback, teacherNames))
            } else {
              // 如果教员列表为空，不生成默认数据，保持空数组
              setRecords([])
            }
          }
        } else {
          // API 失败时从本地存储加载或生成默认数据
          if (teacherNames.length > 0) {
            const fallback = createDefaultEntries(teacherNames)
            const loaded = loadCampusData<MonthlyPersonalEntry[]>(
              STORAGE_KEYS.CAMPUS_REPUTATION_MONTHLY_PERSONAL,
              activeCampus,
              fallback,
            )
            // 过滤掉本地存储中不在当前教员列表中的数据
            // 同时确保只保留当前神殿的数据（通过教员列表过滤）
            const validLoaded = loaded && loaded.length > 0
              ? loaded.filter((r) => {
                const name = r.name?.trim() || ''
                return name && name !== '暂无教员' && name !== '……' && teacherNames.includes(name)
              })
              : fallback
            setRecords(sortEntries(validLoaded.length > 0 ? validLoaded : fallback, teacherNames))
          } else {
            // 如果教员列表也为空，保持空数组，等待教员列表加载
            setRecords([])
          }
        }
      } catch (error) {
        console.error('加载数据失败:', error)
        // 失败时从本地存储加载或生成默认数据
        if (teacherNames.length > 0) {
          const fallback = createDefaultEntries(teacherNames)
          const loaded = loadCampusData<MonthlyPersonalEntry[]>(
            STORAGE_KEYS.CAMPUS_REPUTATION_MONTHLY_PERSONAL,
            activeCampus,
            fallback,
          )
          // 过滤掉本地存储中不在当前教员列表中的数据
          // 同时确保只保留当前神殿的数据（通过教员列表过滤）
          const validLoaded = loaded && loaded.length > 0
            ? loaded.filter((r) => {
              const name = r.name?.trim() || ''
              return name && name !== '暂无教员' && name !== '……' && teacherNames.includes(name)
            })
            : fallback
          setRecords(sortEntries(validLoaded.length > 0 ? validLoaded : fallback, teacherNames))
        } else {
          // 如果教员列表也为空，保持空数组，等待教员列表加载
          setRecords([])
        }
      } finally {
        setLoading(false)
      }
    }
    if (teacherNames.length > 0 || teacherNames.length === 0 && !loadingTeachers) {
      // 只有在教员列表加载完成（无论是否为空）时才加载数据
      loadData()
    }
  }, [activeCampus, currentYear, teacherNames, loadingTeachers])

  // 保存到本地存储（作为备份）
  useEffect(() => {
    saveCampusData(STORAGE_KEYS.CAMPUS_REPUTATION_MONTHLY_PERSONAL, activeCampus, records)
  }, [records, activeCampus])

  const filteredRecords = useMemo(() => {
    const filtered = records.filter((item) => {
      const monthMatch = selectedMonth === 'all' || item.month === selectedMonth
      const nameMatch = selectedName === 'all' || item.name === selectedName
      return monthMatch && nameMatch
    })
    console.log('筛选结果:', {
      selectedMonth,
      selectedName,
      totalRecords: records.length,
      filteredCount: filtered.length,
      filtered: filtered.map(r => `${r.month}月-${r.name}`)
    })
    return filtered
  }, [records, selectedMonth, selectedName])

  const groupedRows = useMemo(() => {
    const groups = new Map<number, MonthlyPersonalEntry[]>()
    filteredRecords.forEach((entry) => {
      const group = groups.get(entry.month) ?? []
      group.push(entry)
      groups.set(entry.month, group)
    })

    // 确定要显示的月份和教员列表
    let monthsToShow: number[]
    let namesToShow: string[]

    if (selectedMonth === 'all') {
      // 选择"全部月份"时，显示所有12个月
      monthsToShow = MONTHS
    } else {
      // 选择具体月份时，只显示该月份
      monthsToShow = [selectedMonth as number]
    }

    if (selectedName === 'all') {
      // 选择"全部人员"时，显示所有教员
      // 如果teacherNames为空，从records中提取姓名作为fallback
      if (teacherNames.length > 0) {
        namesToShow = teacherNames
      } else {
        const namesFromRecords = Array.from(new Set(records.map((record) => record.name).filter(Boolean)))
        namesToShow = namesFromRecords.sort()
      }
    } else {
      // 选择具体姓名时，只显示该姓名
      namesToShow = [selectedName]
    }

    // 为每个月份生成完整的条目列表（包括空记录）
    return monthsToShow.map((month) => {
      const existingEntries = groups.get(month) ?? []
      const existingEntryMap = new Map<string, MonthlyPersonalEntry>()
      existingEntries.forEach(entry => {
        existingEntryMap.set(entry.name, entry)
      })

      // 为所有教员创建条目（如果不存在则创建空记录）
      const entries: MonthlyPersonalEntry[] = namesToShow.map((name) => {
        const existing = existingEntryMap.get(name)
        if (existing) {
          return existing
        }
        // 创建空记录，所有值为0
        return {
          id: `${month}-${name}`,
          month,
          name,
          targetReputation: 0,
          actualReputation: 0,
          targetVisit: 0,
          actualVisit: 0,
          targetEnrollment: 0,
          actualEnrollment: 0,
          targetIncome: 0,
          actualIncome: 0,
        }
      })

      // 按教员顺序排序
      entries.sort((a, b) => nameOrder(a.name, teacherNames) - nameOrder(b.name, teacherNames))

      return { month, entries }
    })
  }, [filteredRecords, selectedMonth, selectedName, teacherNames, records])

  const tableData = useMemo<MonthlyPersonalRow[]>(() => {
    const rows: MonthlyPersonalRow[] = []

    groupedRows.forEach(({ month, entries }) => {
      const summary = entries.reduce(
        (acc, item) => {
          acc.targetReputation += item.targetReputation
          acc.actualReputation += item.actualReputation
          acc.targetVisit += item.targetVisit
          acc.actualVisit += item.actualVisit
          acc.targetEnrollment += item.targetEnrollment
          acc.actualEnrollment += item.actualEnrollment
          acc.targetIncome += item.targetIncome
          acc.actualIncome += item.actualIncome
          return acc
        },
        {
          targetReputation: 0,
          actualReputation: 0,
          targetVisit: 0,
          actualVisit: 0,
          targetEnrollment: 0,
          actualEnrollment: 0,
          targetIncome: 0,
          actualIncome: 0,
        },
      )

      // 计算该月份的总行数（条目数 + 1个合计行）
      const monthTotalRows = entries.length + 1

      entries.forEach((entry, index) => {
        rows.push({
          rowType: 'entry',
          serialNumber: index + 1,
          ...entry,
          // 只有第一行设置 rowSpan，其他行设为 0 表示被合并
          monthRowSpan: index === 0 ? monthTotalRows : 0,
          isFirstOfMonth: index === 0,
        })
      })

      rows.push({
        rowType: 'summary',
        serialNumber: '合计',
        id: `summary-${month}`,
        month,
        name: '',
        targetReputation: summary.targetReputation,
        actualReputation: summary.actualReputation,
        targetVisit: summary.targetVisit,
        actualVisit: summary.actualVisit,
        targetEnrollment: summary.targetEnrollment,
        actualEnrollment: summary.actualEnrollment,
        targetIncome: summary.targetIncome,
        actualIncome: summary.actualIncome,
        monthRowSpan: 0, // 合计行被合并
        isFirstOfMonth: false,
      })
    })

    if (rows.length > 0) {
      const overall = filteredRecords.reduce(
        (acc, item) => {
          acc.targetReputation += item.targetReputation
          acc.actualReputation += item.actualReputation
          acc.targetVisit += item.targetVisit
          acc.actualVisit += item.actualVisit
          acc.targetEnrollment += item.targetEnrollment
          acc.actualEnrollment += item.actualEnrollment
          acc.targetIncome += item.targetIncome
          acc.actualIncome += item.actualIncome
          return acc
        },
        {
          targetReputation: 0,
          actualReputation: 0,
          targetVisit: 0,
          actualVisit: 0,
          targetEnrollment: 0,
          actualEnrollment: 0,
          targetIncome: 0,
          actualIncome: 0,
        },
      )

      rows.push({
        rowType: 'overall',
        serialNumber: '全年合计',
        id: 'overall-summary',
        month: 0,
        name: '',
        targetReputation: overall.targetReputation,
        actualReputation: overall.actualReputation,
        targetVisit: overall.targetVisit,
        actualVisit: overall.actualVisit,
        targetEnrollment: overall.targetEnrollment,
        actualEnrollment: overall.actualEnrollment,
        targetIncome: overall.targetIncome,
        actualIncome: overall.actualIncome,
      })
    }

    return rows
  }, [groupedRows, filteredRecords])

  // 编辑模式下使用 mergedRecords 重新计算 tableData
  const editableTableData = useMemo(() => {
    if (!isEditing || editedData.size === 0) return tableData
    
    // 重新应用编辑数据到 tableData
    return tableData.map((row) => {
      if (row.rowType === 'entry') {
        const edited = editedData.get(row.id)
        if (edited) {
          return { ...row, ...edited }
        }
      }
      return row
    })
  }, [tableData, isEditing, editedData])

  // 处理单元格值变化 - 移到 createEditableColumn 之前定义
  const handleCellChange = useCallback((id: string, field: keyof MonthlyPersonalEntry, value: number) => {
    setEditedData((prev) => {
      const newMap = new Map(prev)
      const existing = newMap.get(id) || {}
      newMap.set(id, { ...existing, [field]: value })
      return newMap
    })
    setHasUnsavedChanges(true)
  }, [])

  // 创建可编辑列的渲染函数
  const createEditableColumn = useCallback((
    field: keyof MonthlyPersonalEntry,
    isCurrency = false
  ) => (value: number, record: MonthlyPersonalRow) => {
    // 合并编辑数据
    const editedValue = editedData.get(record.id)?.[field]
    const displayValue = editedValue !== undefined ? editedValue as number : value
    
    return (
      <EditableCell
        value={displayValue}
        recordId={record.id}
        recordRowType={record.rowType}
        field={field}
        onChange={handleCellChange}
        isEditing={isEditing}
        isCurrency={isCurrency}
      />
    )
  }, [editedData, handleCellChange, isEditing])

  const columns: ColumnsType<MonthlyPersonalRow> = [
    { title: '序号', dataIndex: 'serialNumber', key: 'serialNumber', width: 80, align: 'center' },
    {
      title: '月份',
      dataIndex: 'month',
      key: 'month',
      width: 80,
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'overall') return '全年'
        // 只在第一行显示月份值
        if (record.isFirstOfMonth) return `${value}月`
        return value || ''
      },
      onCell: (record) => {
        // 全年合计行不参与合并
        if (record.rowType === 'overall') {
          return { rowSpan: 1 }
        }
        // 返回 rowSpan，第一行显示合并单元格，其他行隐藏
        return {
          rowSpan: record.monthRowSpan,
        }
      },
    },
    { title: '姓名', dataIndex: 'name', key: 'name', width: 140 },
    { 
      title: '目标口碑量', 
      dataIndex: 'targetReputation', 
      key: 'targetReputation', 
      width: 120, 
      align: 'right',
      render: createEditableColumn('targetReputation'),
    },
    { 
      title: '实际口碑量', 
      dataIndex: 'actualReputation', 
      key: 'actualReputation', 
      width: 120, 
      align: 'right',
      render: createEditableColumn('actualReputation'),
    },
    { 
      title: '目标上门量', 
      dataIndex: 'targetVisit', 
      key: 'targetVisit', 
      width: 120, 
      align: 'right',
      render: createEditableColumn('targetVisit'),
    },
    { 
      title: '实际上门量', 
      dataIndex: 'actualVisit', 
      key: 'actualVisit', 
      width: 120, 
      align: 'right',
      render: createEditableColumn('actualVisit'),
    },
    { 
      title: '目标招生人数', 
      dataIndex: 'targetEnrollment', 
      key: 'targetEnrollment', 
      width: 140, 
      align: 'right',
      render: createEditableColumn('targetEnrollment'),
    },
    { 
      title: '实际招生人数', 
      dataIndex: 'actualEnrollment', 
      key: 'actualEnrollment', 
      width: 140, 
      align: 'right',
      render: createEditableColumn('actualEnrollment'),
    },
    {
      title: '目标口碑收入',
      dataIndex: 'targetIncome',
      key: 'targetIncome',
      width: 140,
      align: 'right',
      render: createEditableColumn('targetIncome', true),
    },
    {
      title: '实际口碑收入',
      dataIndex: 'actualIncome',
      key: 'actualIncome',
      width: 140,
      align: 'right',
      render: createEditableColumn('actualIncome', true),
    },
  ]

  const monthRowSpanMap = useMemo(() => {
    const map = new Map<number, number>()
    groupedRows.forEach(({ month, entries }) => {
      map.set(month, entries.length + 1) // entries plus summary row
    })
    return map
  }, [groupedRows])

  const aggregateStats = useMemo(() => {
    const totals = filteredRecords.reduce(
      (acc, item) => {
        acc.targetReputation += item.targetReputation
        acc.actualReputation += item.actualReputation
        acc.targetVisit += item.targetVisit
        acc.actualVisit += item.actualVisit
        acc.targetEnrollment += item.targetEnrollment
        acc.actualEnrollment += item.actualEnrollment
        acc.targetIncome += item.targetIncome
        acc.actualIncome += item.actualIncome
        return acc
      },
      {
        targetReputation: 0,
        actualReputation: 0,
        targetVisit: 0,
        actualVisit: 0,
        targetEnrollment: 0,
        actualEnrollment: 0,
        targetIncome: 0,
        actualIncome: 0,
      },
    )
    return {
      totalEntries: filteredRecords.length,
      targetReputation: totals.targetReputation,
      targetEnrollment: totals.targetEnrollment,
      targetIncome: totals.targetIncome,
    }
  }, [filteredRecords])

  // 获取合并了编辑数据的记录
  const mergedRecords = useMemo(() => {
    if (editedData.size === 0) return records
    return records.map((record) => {
      const edited = editedData.get(record.id)
      if (edited) {
        return { ...record, ...edited }
      }
      return record
    })
  }, [records, editedData])

  // 切换编辑模式
  const toggleEditMode = useCallback(() => {
    if (isEditing && hasUnsavedChanges) {
      modal.confirm({
        title: '确认退出编辑模式？',
        content: '您有未保存的修改，退出将丢失这些更改。',
        okText: '确认退出',
        cancelText: '继续编辑',
        onOk: () => {
          setIsEditing(false)
          setEditedData(new Map())
          setHasUnsavedChanges(false)
        },
      })
    } else {
      setIsEditing(!isEditing)
      if (!isEditing) {
        // 进入编辑模式
        setEditedData(new Map())
        setHasUnsavedChanges(false)
      }
    }
  }, [isEditing, hasUnsavedChanges])

  // 撤销编辑
  const handleCancelEdit = useCallback(() => {
    if (hasUnsavedChanges) {
      modal.confirm({
        title: '确认撤销？',
        content: '这将丢失所有未保存的修改。',
        okText: '确认撤销',
        cancelText: '取消',
        onOk: () => {
          setEditedData(new Map())
          setHasUnsavedChanges(false)
        },
      })
    } else {
      setEditedData(new Map())
    }
  }, [hasUnsavedChanges])

  // 批量保存编辑的数据
  const handleBatchSave = useCallback(async () => {
    if (editedData.size === 0) {
      message.info('没有需要保存的修改')
      return
    }

    setSaving(true)
    try {
      // 首先，收集所有被编辑的记录（包括原始记录和动态创建的空记录）
      const allRecordsMap = new Map<string, MonthlyPersonalEntry>()
      
      // 添加原始记录
      records.forEach((record) => {
        allRecordsMap.set(record.id, record)
      })
      
      // 从 tableData 中收集所有 entry 类型的行（包括动态创建的空记录）
      editableTableData.forEach((row) => {
        if (row.rowType === 'entry' && !allRecordsMap.has(row.id)) {
          // 这是一个动态创建的空记录
          allRecordsMap.set(row.id, {
            id: row.id,
            month: row.month,
            name: row.name,
            targetReputation: row.targetReputation,
            actualReputation: row.actualReputation,
            targetVisit: row.targetVisit,
            actualVisit: row.actualVisit,
            targetEnrollment: row.targetEnrollment,
            actualEnrollment: row.actualEnrollment,
            targetIncome: row.targetIncome,
            actualIncome: row.actualIncome,
          })
        }
      })

      // 合并编辑数据
      const updatedRecords: MonthlyPersonalEntry[] = []
      allRecordsMap.forEach((record, id) => {
        const edited = editedData.get(id)
        if (edited) {
          updatedRecords.push({ ...record, ...edited })
        } else {
          updatedRecords.push(record)
        }
      })

      // 按月份分组保存
      const monthGroups = new Map<number, MonthlyPersonalEntry[]>()
      updatedRecords.forEach((record) => {
        const group = monthGroups.get(record.month) || []
        group.push(record)
        monthGroups.set(record.month, group)
      })

      // 获取被编辑的月份
      const editedMonths = new Set<number>()
      editedData.forEach((editedFields, id) => {
        // 从 id 中解析月份（格式: "month-name" 或 "month-index"）
        const record = allRecordsMap.get(id)
        if (record) {
          editedMonths.add(record.month)
        } else {
          // 尝试从 id 解析月份
          const monthMatch = id.match(/^(\d+)-/)
          if (monthMatch) {
            editedMonths.add(parseInt(monthMatch[1], 10))
          }
        }
      })

      console.log('保存数据:', {
        editedDataSize: editedData.size,
        editedMonths: Array.from(editedMonths),
        updatedRecordsCount: updatedRecords.length,
      })

      // 只保存被编辑的月份
      const savePromises: Promise<Response>[] = []
      editedMonths.forEach((month) => {
        const monthData = monthGroups.get(month) || []
        if (monthData.length === 0) {
          console.warn(`月份 ${month} 没有数据`)
          return
        }
        const payload = {
          神殿名称: activeCampus,
          年份: currentYear,
          月份: month,
          行列表: monthData.map((r) => ({
            月份: r.month,
            姓名: r.name.trim(),
            目标口碑量: Number(r.targetReputation) || 0,
            实际口碑量: Number(r.actualReputation) || 0,
            目标上门量: Number(r.targetVisit) || 0,
            实际上门量: Number(r.actualVisit) || 0,
            目标招生人数: Number(r.targetEnrollment) || 0,
            实际招生人数: Number(r.actualEnrollment) || 0,
            目标口碑收入: Number(r.targetIncome) || 0,
            实际口碑收入: Number(r.actualIncome) || 0,
          })),
        }
        console.log(`保存月份 ${month} 的数据:`, payload)
        savePromises.push(
          fetch(buildApiUrl('/reputation-monthly-personal'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        )
      })

      if (savePromises.length === 0) {
        message.warning('没有找到需要保存的数据')
        setSaving(false)
        return
      }

      const results = await Promise.all(savePromises)
      const allSuccess = results.every((res) => res.ok)

      if (allSuccess) {
        message.success(`成功保存 ${editedMonths.size} 个月份的数据`)
        setRecords(sortEntries(updatedRecords, teacherNames))
        setEditedData(new Map())
        setHasUnsavedChanges(false)
      } else {
        const failedCount = results.filter((res) => !res.ok).length
        message.error(`保存失败：${failedCount} 个月份保存失败`)
      }
    } catch (error) {
      console.error('批量保存失败:', error)
      message.error('保存失败，请稍后重试')
    } finally {
      setSaving(false)
    }
  }, [editedData, records, editableTableData, activeCampus, currentYear, teacherNames])

  const openModal = (record?: MonthlyPersonalEntry) => {
    setEditingRecord(record ?? null)
    form.resetFields()
    form.setFieldsValue({
      month: record?.month ?? (selectedMonth === 'all' ? 1 : selectedMonth),
      name: record?.name ?? (teacherNames[0] || ''),
      targetReputation: record?.targetReputation ?? 0,
      actualReputation: record?.actualReputation ?? 0,
      targetVisit: record?.targetVisit ?? 0,
      actualVisit: record?.actualVisit ?? 0,
      targetEnrollment: record?.targetEnrollment ?? 0,
      actualEnrollment: record?.actualEnrollment ?? 0,
      targetIncome: record?.targetIncome ?? 0,
      actualIncome: record?.actualIncome ?? 0,
    })
    setModalVisible(true)
  }

  const handleDelete = (recordId: string) => {
    setRecords((prev) => sortEntries(prev.filter((item) => item.id !== recordId), teacherNames))
    message.success('删除成功')
  }

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      if (!values.month || !values.name || values.name.trim() === '') {
        message.error('月份和姓名不能为空')
        return
      }

      setSaving(true)

      const normalized: MonthlyPersonalEntry = {
        id: editingRecord?.id ?? `${values.month}-${values.name.trim()}`,
        month: Number(values.month),
        name: values.name.trim(),
        targetReputation: Number(values.targetReputation) || 0,
        actualReputation: Number(values.actualReputation) || 0,
        targetVisit: Number(values.targetVisit) || 0,
        actualVisit: Number(values.actualVisit) || 0,
        targetEnrollment: Number(values.targetEnrollment) || 0,
        actualEnrollment: Number(values.actualEnrollment) || 0,
        targetIncome: Number(values.targetIncome) || 0,
        actualIncome: Number(values.actualIncome) || 0,
      }

      try {
        // 先获取当前月份的所有现有记录（从服务器获取最新数据）
        // 注意：URL 末尾加斜杠避免 307 重定向
        const existingParams = new URLSearchParams({
          campus: activeCampus,
          year: currentYear.toString(),
          month: normalized.month.toString(),
        })
        let existingMonthRecords: MonthlyPersonalEntry[] = []
        
        try {
          const existingRes = await fetch(`${buildApiUrl('/reputation-monthly-personal/')}?${existingParams.toString()}`)
          if (existingRes.ok) {
            const existingData = await existingRes.json()
            const rows: MonthlyPersonalApiRow[] = Array.isArray(existingData.行列表) ? existingData.行列表 : []
            existingMonthRecords = normalizeMonthlyRows(rows)
            console.log('从服务器获取到现有月份记录:', existingMonthRecords.length, '条')
          } else {
            console.warn('获取现有月份记录失败，使用本地数据')
            // 使用本地 records 中该月份的数据作为回退
            existingMonthRecords = records.filter((r) => r.month === normalized.month)
          }
        } catch (fetchError) {
          console.warn('获取现有月份记录出错，使用本地数据:', fetchError)
          // 使用本地 records 中该月份的数据作为回退
          existingMonthRecords = records.filter((r) => r.month === normalized.month)
        }

        // 合并现有记录和新记录（新记录覆盖同名的现有记录）
        const mergedRecordsMap = new Map<string, MonthlyPersonalEntry>()
        existingMonthRecords.forEach((r) => mergedRecordsMap.set(r.name, r))
        mergedRecordsMap.set(normalized.name, normalized) // 新记录覆盖或添加
        const monthData = Array.from(mergedRecordsMap.values())
        
        console.log('合并后要保存的月份数据:', monthData.length, '条', monthData.map((r) => r.name))

        const payload = {
          神殿名称: activeCampus,
          年份: currentYear,
          月份: normalized.month,
          行列表: monthData.map((r) => ({
            月份: r.month,
            姓名: r.name.trim(),
            目标口碑量: Number(r.targetReputation) || 0,
            实际口碑量: Number(r.actualReputation) || 0,
            目标上门量: Number(r.targetVisit) || 0,
            实际上门量: Number(r.actualVisit) || 0,
            目标招生人数: Number(r.targetEnrollment) || 0,
            实际招生人数: Number(r.actualEnrollment) || 0,
            目标口碑收入: Number(r.targetIncome) || 0,
            实际口碑收入: Number(r.actualIncome) || 0,
          })),
        }

        // 注意：POST 请求 URL 末尾加斜杠避免 307 重定向
        const res = await fetch(buildApiUrl('/reputation-monthly-personal/'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (res.ok) {
          message.success(editingRecord ? '更新成功并已保存到服务器' : '添加成功并已保存到服务器')
          // 重新加载全年数据
          const reloadParams = new URLSearchParams({ campus: activeCampus, year: currentYear.toString() })
          const reloadRes = await fetch(`${buildApiUrl('/reputation-monthly-personal/')}?${reloadParams.toString()}`)
          if (reloadRes.ok) {
            const reloadData = await reloadRes.json()
            const rows: MonthlyPersonalApiRow[] = Array.isArray(reloadData.行列表) ? reloadData.行列表 : []
            const converted = normalizeMonthlyRows(rows)
            setRecords(sortEntries(converted, teacherNames))
          }
          // 关闭模态框
          setModalVisible(false)
          setEditingRecord(null)
          form.resetFields()
        } else {
          const error = await res.json().catch(() => ({}))
          message.error(`保存到服务器失败: ${error.detail || '未知错误'}`)
        }
      } catch (error) {
        console.error('保存失败:', error)
        message.error('保存失败，请稍后重试')
      } finally {
        setSaving(false)
      }
    } catch (err) {
      console.error('表单验证失败:', err)
    }
  }
 
  const handleAutoFillAll = async () => {
    setAutoFilling(true)
    try {
      const params = new URLSearchParams({ campus: activeCampus, year: currentYear.toString() })

      // 1) 从“口碑报名明细”自动汇总到【月度个人表】
      // 注意：该自动填充只应覆盖：实际招生人数、实际口碑收入
      // “实际口碑量/实际上门量”将保留为手动录入，不应被覆盖
      const fillRes = await fetch(
        `${buildApiUrl('/reputation-aggregation/auto-fill-from-registration')}?${params.toString()}`,
        { method: 'POST' },
      )
      if (!fillRes.ok) {
        const error = await fillRes.json().catch(() => ({}))
        message.error(`从口碑报名明细表填充失败: ${error.detail || '未知错误'}`)
        return
      }
      const fillResult = await fillRes.json().catch(() => ({}))

      // 2) 重新拉取服务器的月度个人数据（里面包含自动汇总出来的字段）
      const reloadRes = await fetch(`${buildApiUrl('/reputation-monthly-personal')}?${params.toString()}`)
      if (reloadRes.ok) {
        const reloadData = await reloadRes.json().catch(() => ({}))
        const serverData = normalizeMonthlyRows(Array.isArray(reloadData.行列表) ? reloadData.行列表 : [])

        if (serverData.length > 0) {
          // 建立本地 existing(手动)数据映射，用于保留“实际口碑量/实际上门量”
          const localMap = new Map<string, MonthlyPersonalEntry>()
          records.forEach((r) => {
            localMap.set(`${r.month}__${r.name}`, r)
          })

          setRecords(() => {
            const merged: MonthlyPersonalEntry[] = serverData.map((srv) => {
              const local = localMap.get(`${srv.month}__${srv.name}`)
              return {
                ...srv,
                // 保留手动字段
                actualReputation: local?.actualReputation ?? srv.actualReputation,
                actualVisit: local?.actualVisit ?? srv.actualVisit,
              }
            })
            return sortEntries(merged, teacherNames)
          })
        }
      }

      // 3) 再触发后端汇总到其他表（个人表/神殿汇总表）
      const aggregateRes = await fetch(`${buildApiUrl('/reputation-aggregation/auto-fill')}?${params.toString()}`, {
        method: 'POST',
      })

      if (aggregateRes.ok) {
        const aggregateResult = await aggregateRes.json().catch(() => ({}))
        message.success(
          `自动填充成功！月度个人表: ${fillResult.data?.记录数 ?? 0}条（仅自动获取“实际招生人数/实际口碑收入”），个人表: ${aggregateResult.data?.个人表记录数 ?? 0}条，神殿汇总表: ${aggregateResult.data?.神殿汇总表记录数 ?? 0}条`,
        )
      } else {
        const error = await aggregateRes.json().catch(() => ({}))
        message.warning(
          `月度个人表填充成功（${fillResult.data?.记录数 ?? 0}条，仅自动获取“实际招生人数/实际口碑收入”），但汇总到其他表失败: ${error.detail || '未知错误'}`,
        )
      }
    } catch (error) {
      console.error('自动填充失败:', error)
      message.error('自动填充失败，请稍后重试')
    } finally {
      setAutoFilling(false)
    }
  }

  return (
    <div>
      <Space style={{ marginBottom: 12 }} wrap>
        {/* 编辑模式按钮组 */}
        <Button 
          type={isEditing ? 'default' : 'primary'} 
          icon={<EditOutlined />} 
          onClick={toggleEditMode}
          danger={isEditing}
        >
          {isEditing ? '退出编辑' : '编辑表格'}
        </Button>
        {isEditing && (
          <>
            <Button 
              type="primary" 
              icon={<SaveOutlined />} 
              loading={saving} 
              onClick={handleBatchSave}
              disabled={!hasUnsavedChanges}
            >
              保存修改 {hasUnsavedChanges && `(${editedData.size}项)`}
            </Button>
            <Tooltip title="撤销所有未保存的修改">
              <Button 
                icon={<UndoOutlined />} 
                onClick={handleCancelEdit}
                disabled={!hasUnsavedChanges}
              >
                撤销修改
              </Button>
            </Tooltip>
          </>
        )}
        {!isEditing && (
          <>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
              新增记录
            </Button>
            <Button type="primary" loading={autoFilling} onClick={handleAutoFillAll}>
              自动填充汇总表
            </Button>
          </>
        )}
      </Space>

      {isEditing && (
        <div style={{ 
          marginBottom: 12, 
          padding: '8px 12px', 
          background: '#fff7e6', 
          border: '1px solid #ffd591',
          borderRadius: 4 
        }}>
          <Typography.Text type="warning">
            <EditOutlined style={{ marginRight: 8 }} />
            编辑模式：直接点击表格单元格即可编辑数据，编辑完成后点击"保存修改"按钮保存到服务器。
          </Typography.Text>
        </div>
      )}

      <Table<MonthlyPersonalRow>
        columns={columns}
        dataSource={editableTableData}
        rowKey={(row) => `${row.rowType}-${row.id}`}
        bordered
        pagination={false}
        sticky
        scroll={{ x: 1400, y: 600 }}
      />

      <Modal
    title={editingRecord ? '编辑月度记录' : '添加月度记录'}
    open={modalVisible}
    onCancel={() => {
      form.resetFields()
      setModalVisible(false)
      setEditingRecord(null)
    }}
    onOk={async () => {
      console.log('Modal onOk 被点击')
      try {
        await handleSave()
      } catch (error) {
        console.error('Modal onOk 处理错误:', error)
      }
    }}
    okText="确定"
    cancelText="取消"
    destroyOnClose
    width={640}
  >
    <Form<MonthlyPersonalFormValues> form={form} layout="vertical">
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label="月份"
            name="month"
            rules={[{ required: true, message: '请选择月份' }]}
          >
            <Select placeholder="请选择月份">
              {MONTHS.map((month) => (
                <Option key={month} value={month}>
                  {month}月
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="姓名"
            name="name"
            rules={[{ required: true, message: '请输入或选择姓名' }]}
            tooltip="可以从列表选择已有教员，也可以输入新教员姓名"
          >
            <AutoComplete
              placeholder="请输入或选择姓名（点击查看全部教员）"
              options={allAvailableNames.map((name) => ({ value: name, label: name }))}
              filterOption={(inputValue, option) => {
                // 如果没有输入或输入为空，显示所有选项
                if (!inputValue || inputValue.trim() === '') {
                  return true
                }
                if (!option) return false
                const value = String(option.value || option.label || '').trim()
                if (!value) return false
                const searchValue = inputValue.toLowerCase().trim()
                return value.toLowerCase().includes(searchValue)
              }}
              allowClear
              defaultActiveFirstOption={false}
              backfill={false}
              open={nameAutoCompleteOpen}
              onDropdownVisibleChange={(open) => {
                setNameAutoCompleteOpen(open)
                console.log('AutoComplete 下拉状态变化:', open, '可用姓名列表:', allAvailableNames.length, '个:', allAvailableNames)
              }}
              notFoundContent={allAvailableNames.length === 0 ? '正在加载教员列表...' : '无匹配项'}
              onFocus={() => {
                setNameAutoCompleteOpen(true)
                console.log('AutoComplete 获得焦点，当前可用姓名列表:', allAvailableNames.length, '个:', allAvailableNames)
              }}
              onSearch={(value) => {
                setNameAutoCompleteOpen(true)
                console.log('AutoComplete 搜索:', value, '可用选项数:', allAvailableNames.length)
              }}
              onSelect={(value) => {
                console.log('AutoComplete 选择了:', value)
                form.setFieldsValue({ name: value })
                setNameAutoCompleteOpen(false)
                // 如果选择的是新值且不在teacherNames列表中，自动添加到列表
                if (value && !teacherNames.includes(value)) {
                  setTeacherNames((prev) => {
                    if (!prev.includes(value)) {
                      return [...prev, value].sort()
                    }
                    return prev
                  })
                }
              }}
              onBlur={(e) => {
                // 延迟关闭，以便onSelect能够先执行
                setTimeout(() => {
                  setNameAutoCompleteOpen(false)
                }, 200)
                const input = e.target as HTMLInputElement
                const value = input.value?.trim()
                // 如果输入的是新值且不在teacherNames列表中，自动添加到列表
                if (value && !teacherNames.includes(value)) {
                  setTeacherNames((prev) => {
                    if (!prev.includes(value)) {
                      return [...prev, value].sort()
                    }
                    return prev
                  })
                }
              }}
            />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label="目标口碑量"
            name="targetReputation"
            rules={[{ required: true, message: '请输入目标口碑量' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="实际口碑量"
            name="actualReputation"
            rules={[{ required: true, message: '请输入实际口碑量' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label="目标上门量"
            name="targetVisit"
            rules={[{ required: true, message: '请输入目标上门量' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="实际上门量"
            name="actualVisit"
            rules={[{ required: true, message: '请输入实际上门量' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label="目标招生人数"
            name="targetEnrollment"
            rules={[{ required: true, message: '请输入目标人数' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="实际招生人数"
            name="actualEnrollment"
            rules={[{ required: true, message: '请输入实际人数' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label="目标口碑收入"
            name="targetIncome"
            rules={[{ required: true, message: '请输入目标收入' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} addonBefore="¥" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="实际口碑收入"
            name="actualIncome"
            rules={[{ required: true, message: '请输入实际收入' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} addonBefore="¥" />
          </Form.Item>
        </Col>
      </Row>
    </Form>
  </Modal>
    </div>
  )
}

export default CampusReputationMonthlyPersonalPage
