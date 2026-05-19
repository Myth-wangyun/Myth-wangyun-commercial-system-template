/**
 * 神殿教化司员工KPI计划表页面（教质经理KPI + 班主任KPI 已接入后端 API）
 */

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { App, Card, Table, Button, Space, Select, Tabs, DatePicker, Input, InputNumber, Modal, Switch } from 'antd'
import { ReloadOutlined, DownloadOutlined, TrophyOutlined, SaveOutlined, PlusOutlined, PlusCircleOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons'
import { fetchHomeroomTeachers } from '@/services/configMaster'
import type { ColumnsType } from 'antd/es/table'
import { useCampusStore } from '@/stores/campusStore'
import dayjs, { Dayjs } from 'dayjs'
import { buildApiUrl } from '@/utils/apiBase'

const { Option } = Select

// 员工KPI计划记录接口
interface EmployeeKpiPlanRecord {
  key: string
  groupId: string
  name: string // 姓名
  projectIndicator: string // 项目指标
  kpiIndicator: string // KPI指标
  kpiName: string // KPI指标名称
  calculationRule: string // 计算细则/计算说明
  dataSource: string // 数据来源、考核
  weight: number // 权重
  projectDescription: string // 项目描述
  selfScore: number // 自我打分
  supervisorScore: number // 上级领导打分/得分
  kpiValue: number // KPI值
  remarks: string // 备注
  rowType?: 'data' | 'total' // 行类型
  serialNumber?: number // 序号（仅用于保存）
}

// API 结构 - 教质经理
interface ManagerRowAPI {
  序号: number
  姓名?: string | null
  项目指标?: string | null
  KPI指标?: string | null
  KPI名称?: string | null
  计算细则?: string | null
  数据来源?: string | null
  权重?: number | null
  项目描述?: string | null
  自我打分?: number | null
  上级领导打分?: number | null
  KPI值?: number | null
  备注?: string | null
  行类型?: string | null
}
interface ManagerListAPI {
  神殿名称: string
  年份?: number | null
  月份?: number | null
  行列表: ManagerRowAPI[]
}

// API 结构 - 班主任
interface TeacherMainRowAPI {
  序号: number
  姓名?: string | null
  KPI指标?: string | null
  KPI名称?: string | null
  计算细则?: string | null
  数据来源?: string | null
  权重?: number | null
  备注?: string | null
  得分?: number | null
  KPI值?: number | null
  行类型?: string | null
}

interface TeacherListAPI {
  神殿名称: string
  年份?: number | null
  月份?: number | null
  主表: TeacherMainRowAPI[]
}

type ManagerTemplateRow = Pick<
  EmployeeKpiPlanRecord,
  | 'serialNumber'
  | 'projectIndicator'
  | 'kpiIndicator'
  | 'kpiName'
  | 'calculationRule'
  | 'dataSource'
  | 'weight'
  | 'projectDescription'
  | 'rowType'
>

type TeacherTemplateRow = Pick<
  EmployeeKpiPlanRecord,
  | 'serialNumber'
  | 'kpiIndicator'
  | 'kpiName'
  | 'calculationRule'
  | 'dataSource'
  | 'weight'
  | 'remarks'
  | 'rowType'
>

const MANAGER_TEMPLATE_ROWS: ManagerTemplateRow[] = [
  {
    serialNumber: 1,
    projectIndicator: '业务指标',
    kpiIndicator: '就业管理',
    kpiName: '学生就业率(人数)',
    calculationRule: '10*实际就业学生数/目标就业学生数',
    dataSource: '校长/教质经理',
    weight: 15,
    projectDescription: '',
    rowType: 'data',
  },
  {
    serialNumber: 2,
    projectIndicator: '业务指标',
    kpiIndicator: '就业管理',
    kpiName: '学生就业薪资(以回访为准)',
    calculationRule: '10*实际平均就业薪资/目标就业薪资',
    dataSource: '总部',
    weight: 15,
    projectDescription: '',
    rowType: 'data',
  },
  {
    serialNumber: 3,
    projectIndicator: '业务指标',
    kpiIndicator: '口碑',
    kpiName: '部门实际口碑人数',
    calculationRule: '部门实际口碑人数/部门目标人数*10',
    dataSource: '神藏司',
    weight: 20,
    projectDescription: '',
    rowType: 'data',
  },
  {
    serialNumber: 4,
    projectIndicator: '业务指标',
    kpiIndicator: '口碑',
    kpiName: '部门实际口碑回款',
    calculationRule: '部门实际口碑回款/部门目标口碑回款*10',
    dataSource: '神藏司',
    weight: 10,
    projectDescription: '',
    rowType: 'data',
  },
  {
    serialNumber: 5,
    projectIndicator: '业务指标',
    kpiIndicator: '学生回款',
    kpiName: '学费回款',
    calculationRule: '学校入学(住宿)欠费学生实际收款/欠费生应收回款(校长出数据)',
    dataSource: '神藏司',
    weight: 10,
    projectDescription: '',
    rowType: 'data',
  },
  {
    serialNumber: 6,
    projectIndicator: '管理指标',
    kpiIndicator: '学员流失率',
    kpiName: '学员流失率',
    calculationRule: '<1-流失人数(新生+退费老生)/本月入学人数>*10',
    dataSource: '中心校长、神藏司',
    weight: 10,
    projectDescription: '',
    rowType: 'data',
  },
  {
    serialNumber: 7,
    projectIndicator: '管理指标',
    kpiIndicator: '学历管理',
    kpiName: '学历管理',
    calculationRule: '中专学籍资料完整，配合度高、妥善应对检查',
    dataSource: '总部',
    weight: 20,
    projectDescription: '',
    rowType: 'data',
  },
]

const TEACHER_TEMPLATE_ROWS: TeacherTemplateRow[] = [
  {
    serialNumber: 1,
    kpiIndicator: '口碑',
    kpiName: '部门实际口碑人数',
    calculationRule: '部门实际口碑人数/部门目标人数*10',
    dataSource: '神藏司',
    weight: 20,
    remarks: '',
    rowType: 'data',
  },
  {
    serialNumber: 2,
    kpiIndicator: '口碑',
    kpiName: '部门实际口碑回款',
    calculationRule: '部门实际口碑回款/部门目标口碑回款*10',
    dataSource: '神藏司',
    weight: 0,
    remarks: '',
    rowType: 'data',
  },
  {
    serialNumber: 3,
    kpiIndicator: '口碑',
    kpiName: '部门实际口碑量',
    calculationRule: '部门实际口碑量/目标口碑量*10',
    dataSource: '神藏司',
    weight: 0,
    remarks: '',
    rowType: 'data',
  },
  {
    serialNumber: 4,
    kpiIndicator: '学员流失率',
    kpiName: '学员流失率',
    calculationRule: '10-所带学员流失数',
    dataSource: '中心校长、神藏司',
    weight: 0,
    remarks: '',
    rowType: 'data',
  },
  {
    serialNumber: 5,
    kpiIndicator: '学生回款',
    kpiName: '学费回款',
    calculationRule: '学费回款：学校入学（住宿）欠费学生实际收款/欠费生应收回款（校长/教质负责人出数据）',
    dataSource: '神藏司',
    weight: 20,
    remarks: '',
    rowType: 'data',
  },
  {
    serialNumber: 6,
    kpiIndicator: '学生回款',
    kpiName: '宿舍费收支准确',
    calculationRule: '宿舍费实际收款/宿舍费应收*10',
    dataSource: '神藏司',
    weight: 0,
    remarks: '',
    rowType: 'data',
  },
  {
    serialNumber: 7,
    kpiIndicator: '日常管理',
    kpiName: '神殿学生出勤率',
    calculationRule: '神殿学生出勤率（95%及以上10分，85%及以上8.5分，80%及以上，8分，80%以下0分）',
    dataSource: '教质副经理',
    weight: 20,
    remarks: '班主任提供准确出勤数据，次数、出勤率，准时准确，数据呈现',
    rowType: 'data',
  },
  {
    serialNumber: 8,
    kpiIndicator: '日常管理',
    kpiName: '教室卫生评价',
    calculationRule: '教室卫生评价（优：10分，良8.5分，可：6、差：0）',
    dataSource: '中心校长',
    weight: 0,
    remarks: '',
    rowType: 'data',
  },
  {
    serialNumber: 9,
    kpiIndicator: '日常管理',
    kpiName: '宿舍管理',
    calculationRule: '晚上点名、卫生检督等',
    dataSource: '教质副经理',
    weight: 0,
    remarks: '',
    rowType: 'data',
  },
  {
    serialNumber: 10,
    kpiIndicator: '日常管理',
    kpiName: '违规监督',
    calculationRule: '违规监督：（班主任填写违规记录表天数/15）*10满分最高10分',
    dataSource: '教质副经理',
    weight: 20,
    remarks: '班主任提交数据准时准确，否则最终数据分数减半；数据呈现',
    rowType: 'data',
  },
  {
    serialNumber: 11,
    kpiIndicator: '日常管理',
    kpiName: '学生访谈率',
    calculationRule: '学生访谈率100%，有记录',
    dataSource: '教质副经理',
    weight: 0,
    remarks: '数据呈现',
    rowType: 'data',
  },
  {
    serialNumber: 12,
    kpiIndicator: '学生档案完整率',
    kpiName: '学生档案完整率',
    calculationRule: '10*（纸质+电子档案）完整数量/<全校人数（新开班、合班、分班后档案人数等）*2）>',
    dataSource: '中心校长',
    weight: 0,
    remarks: '',
    rowType: 'data',
  },
  {
    serialNumber: 13,
    kpiIndicator: '投诉',
    kpiName: '投诉',
    calculationRule: '无入学在校生投诉或入学生投诉能妥善解决',
    dataSource: '教质副经理',
    weight: 10,
    remarks: '所负责的班级',
    rowType: 'data',
  },
  {
    serialNumber: 14,
    kpiIndicator: '岗位胜任度',
    kpiName: '岗位胜任度',
    calculationRule: '上级领导评价（工作有责任感，执行力强、服从性高）',
    dataSource: '教质副经理',
    weight: 10,
    remarks: '',
    rowType: 'data',
  },
]

const createGroupId = () => `group-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const getGroupKey = (record: EmployeeKpiPlanRecord) => record.groupId || record.name || ''

const getGroupRowSpan = (record: EmployeeKpiPlanRecord, rows: EmployeeKpiPlanRecord[]) => {
  const dataRows = rows.filter((item) => item.rowType === 'data')
  const currentIndex = dataRows.findIndex((item) => item.key === record.key)
  if (currentIndex === -1) return 0
  const currentGroup = getGroupKey(dataRows[currentIndex])
  if (currentIndex > 0 && getGroupKey(dataRows[currentIndex - 1]) === currentGroup) return 0
  let span = 1
  for (let i = currentIndex + 1; i < dataRows.length; i++) {
    if (getGroupKey(dataRows[i]) !== currentGroup) break
    span += 1
  }
  return span
}

const getFieldRowSpan = (
  record: EmployeeKpiPlanRecord,
  rows: EmployeeKpiPlanRecord[],
  field: 'projectIndicator' | 'kpiIndicator',
) => {
  const dataRows = rows.filter((item) => item.rowType === 'data')
  const currentIndex = dataRows.findIndex((item) => item.key === record.key)
  if (currentIndex === -1) return 0
  const current = dataRows[currentIndex]
  const currentGroup = getGroupKey(current)
  if (currentIndex > 0) {
    const prev = dataRows[currentIndex - 1]
    if (getGroupKey(prev) === currentGroup && prev[field] === current[field]) return 0
  }
  let span = 1
  for (let i = currentIndex + 1; i < dataRows.length; i++) {
    const next = dataRows[i]
    if (getGroupKey(next) !== currentGroup) break
    if (next[field] !== current[field]) break
    span += 1
  }
  return span
}

// 专门用于班主任表的 rowSpan 计算（支持传入自定义数据集）
const getNameRowSpan1 = (record: EmployeeKpiPlanRecord, rows: EmployeeKpiPlanRecord[]) => {
  return record.rowType === 'total' ? 1 : getGroupRowSpan(record, rows)
}

const getKpiIndicatorRowSpan1 = (record: EmployeeKpiPlanRecord, rows: EmployeeKpiPlanRecord[]) => {
  return record.rowType === 'total' ? 1 : getFieldRowSpan(record, rows, 'kpiIndicator')
}

const buildManagerRows = (
  name: string,
  groupId: string,
  templateRows: ManagerTemplateRow[] = MANAGER_TEMPLATE_ROWS,
): EmployeeKpiPlanRecord[] =>
  templateRows.map((row) => ({
    key: `${groupId}-${row.serialNumber}`,
    groupId,
    name,
    projectIndicator: row.projectIndicator,
    kpiIndicator: row.kpiIndicator,
    kpiName: row.kpiName,
    calculationRule: row.calculationRule,
    dataSource: row.dataSource,
    weight: row.weight,
    projectDescription: row.projectDescription,
    selfScore: 0,
    supervisorScore: 0,
    kpiValue: 0,
    remarks: '',
    rowType: row.rowType,
    serialNumber: row.serialNumber,
  }))

const buildTeacherRows = (
  name: string,
  groupId: string,
  templateRows: TeacherTemplateRow[] = TEACHER_TEMPLATE_ROWS,
): EmployeeKpiPlanRecord[] =>
  templateRows.map((row) => ({
    key: `${groupId}-${row.serialNumber}`,
    groupId,
    name,
    projectIndicator: '',
    kpiIndicator: row.kpiIndicator,
    kpiName: row.kpiName,
    calculationRule: row.calculationRule,
    dataSource: row.dataSource,
    weight: row.weight,
    projectDescription: '',
    selfScore: 0,
    supervisorScore: 0,
    kpiValue: 0,
    remarks: row.remarks,
    rowType: row.rowType,
    serialNumber: row.serialNumber,
  }))

const buildManagerTemplateFromData = (rows: EmployeeKpiPlanRecord[]) => {
  const dataRows = rows.filter((item) => item.rowType === 'data')
  if (dataRows.length === 0) return MANAGER_TEMPLATE_ROWS
  const firstGroup = getGroupKey(dataRows[0])
  const groupRows = dataRows.filter((item) => getGroupKey(item) === firstGroup)
  const sourceRows = groupRows.length > 0 ? groupRows : dataRows
  return MANAGER_TEMPLATE_ROWS.map((templateRow) => {
    const match = sourceRows.find((item) => item.serialNumber === templateRow.serialNumber)
    if (!match) return templateRow
    return {
      ...templateRow,
      projectIndicator: match.projectIndicator,
      kpiIndicator: match.kpiIndicator,
      kpiName: match.kpiName,
      calculationRule: match.calculationRule,
      dataSource: match.dataSource,
      weight: match.weight,
      projectDescription: match.projectDescription,
    }
  })
}

const CampusEmployeeKpiPlanPage: React.FC = () => {
  const { message } = App.useApp()
  // 用于 O(1) 定位并更新某一行，避免每次 InputNumber 输入都全表 map 导致卡顿
  const dataSource2Ref = useRef<EmployeeKpiPlanRecord[]>([])
  const dataSource2IndexRef = useRef<Map<string, number>>(new Map())

  // 计算KPI值：权重(%) * 得分 / 100
  const calculateKpiValue = (weightPercent: number, score: number): number => {
    const w = Number.isFinite(weightPercent) ? weightPercent : 0
    const s = Number.isFinite(score) ? score : 0
    return (w * s) / 100
  }

  const { currentCampus, getAllCampuses, setCampus } = useCampusStore()
  const campuses = getAllCampuses()
  const [selectedCampus, setSelectedCampus] = useState<string>(currentCampus || '')
  const [activeTab, setActiveTab] = useState<string>('manager')
  const [selectedYear, setSelectedYear] = useState<Dayjs | null>(dayjs())
  const [selectedMonth, setSelectedMonth] = useState<Dayjs | null>(dayjs())
  const [managerNameInput, setManagerNameInput] = useState<string>('')

  // ===== 教质经理：新增“指标行”（新增项目指标/在项目指标下新增行） =====
  const [addMetricOpen, setAddMetricOpen] = useState(false)
  const [metricProjectIndicator, setMetricProjectIndicator] = useState('')
  const [metricKpiIndicator, setMetricKpiIndicator] = useState('')
  const [metricCalculationRule, setMetricCalculationRule] = useState('')
  const [metricDataSource, setMetricDataSource] = useState('')
  const [metricWeight, setMetricWeight] = useState<number>(0)
  const [metricProjectDescription, setMetricProjectDescription] = useState('')

  const getManagerNextSerialNumber = (rows: EmployeeKpiPlanRecord[]) => {
    const maxSerial = rows
      .filter((r) => r.rowType === 'data')
      .reduce((max, r) => Math.max(max, Number(r.serialNumber ?? 0)), 0)
    return maxSerial + 1
  }

  const insertMetricRowIntoManager = (prev: EmployeeKpiPlanRecord[], newTemplate: ManagerTemplateRow) => {
    // 把新增“指标行”插入到每个教质经理(group)对应的区块里：
    // - 如果该项目指标存在：插入到该项目指标最后一行之后
    // - 否则：插入到该人的最后一行

    // 按 group 分组（保持原顺序）
    const groupOrder: string[] = []
    const groupRows = new Map<string, EmployeeKpiPlanRecord[]>()
    prev.forEach((r) => {
      if (r.rowType !== 'data') return
      if (!groupRows.has(r.groupId)) {
        groupRows.set(r.groupId, [])
        groupOrder.push(r.groupId)
      }
      groupRows.get(r.groupId)!.push(r)
    })

    const next: EmployeeKpiPlanRecord[] = []

    groupOrder.forEach((groupId) => {
      const rows = groupRows.get(groupId) || []
      const name = rows[0]?.name || ''

      const newRow: EmployeeKpiPlanRecord = {
        key: `${groupId}-${newTemplate.serialNumber}`,
        groupId,
        serialNumber: newTemplate.serialNumber,
        name,
        projectIndicator: newTemplate.projectIndicator,
        kpiIndicator: newTemplate.kpiIndicator,
        kpiName: newTemplate.kpiName,
        calculationRule: newTemplate.calculationRule,
        dataSource: newTemplate.dataSource,
        weight: newTemplate.weight,
        projectDescription: newTemplate.projectDescription,
        selfScore: 0,
        supervisorScore: 0,
        kpiValue: 0,
        remarks: '',
        rowType: 'data',
      }

      const lastIndexOfProject = (() => {
        let idx = -1
        rows.forEach((r, i) => {
          if ((r.projectIndicator || '') === (newRow.projectIndicator || '')) idx = i
        })
        return idx
      })()

      if (lastIndexOfProject === -1) {
        next.push(...rows, newRow)
      } else {
        next.push(...rows.slice(0, lastIndexOfProject + 1), newRow, ...rows.slice(lastIndexOfProject + 1))
      }
    })

    return next
  }

  const handleAddManagerMetricRow = () => {
    if (!metricProjectIndicator.trim()) return message.warning('请输入项目指标')
    if (!metricKpiIndicator.trim()) return message.warning('请输入KPI指标')
    // 计算细则在表格中与 KPI名称合并展示，这里仅保留“计算细则”一个输入
    if (!metricCalculationRule.trim()) return message.warning('请输入计算细则')

    const newSerial = getManagerNextSerialNumber(dataSource1)
    const newTemplate: ManagerTemplateRow = {
      serialNumber: newSerial,
      projectIndicator: metricProjectIndicator.trim(),
      kpiIndicator: metricKpiIndicator.trim(),
      // 兼容你现有表格：这一列用 `${kpiName}：${calculationRule}` 合并展示
      // 这里将“计算细则”写入 kpiName，calculationRule 置空
      kpiName: metricCalculationRule.trim(),
      calculationRule: '',
      dataSource: metricDataSource.trim(),
      weight: Number(metricWeight || 0),
      projectDescription: metricProjectDescription.trim(),
      rowType: 'data',
    }

    // 1) 立即把这一行插入到所有教质经理分组中
    setDataSource1((prev) => insertMetricRowIntoManager(prev, newTemplate))

    // 2) 同时更新“模板”：之后再新增人员时，也会带上这条新指标
    MANAGER_TEMPLATE_ROWS.push(newTemplate)

    // reset
    setAddMetricOpen(false)
    setMetricProjectIndicator('')
    setMetricKpiIndicator('')
    setMetricCalculationRule('')
    setMetricDataSource('')
    setMetricWeight(0)
    setMetricProjectDescription('')

    message.success('已新增指标行（请点击“保存”提交到后端）')
  }
  // 班主任筛选：all=全部班主任，否则为具体姓名
  const [selectedTeacherFilter, setSelectedTeacherFilter] = useState<string>('all')
  const [teacherNames, setTeacherNames] = useState<string[]>([])
  const [isTeacherEditMode, setIsTeacherEditMode] = useState<boolean>(true) // 班主任KPI：编辑模式/展示模式切换
  const resolvedCampus = selectedCampus || currentCampus || ''

  // 班主任：新增KPI指标弹窗状态
  const [addTeacherMetricOpen, setAddTeacherMetricOpen] = useState(false)
  const [teacherMetricKpiIndicator, setTeacherMetricKpiIndicator] = useState('')
  const [teacherMetricCalculationRule, setTeacherMetricCalculationRule] = useState('')
  const [teacherMetricDataSource, setTeacherMetricDataSource] = useState('')
  const [teacherMetricWeight, setTeacherMetricWeight] = useState<number>(0)
  const [teacherMetricRemarks, setTeacherMetricRemarks] = useState('')

  const yearNumber = selectedYear ? selectedYear.year() : undefined
  const monthNumber = selectedMonth ? selectedMonth.month() + 1 : undefined

  // 教质经理KPI数据源
  const [dataSource1, setDataSource1] = useState<EmployeeKpiPlanRecord[]>(
    () => buildManagerRows('', createGroupId()),
  )
  const [dataSource2, setDataSource2] = useState<EmployeeKpiPlanRecord[]>([])

  // 同步最新 dataSource2 & 索引（key -> index），供快速更新使用
  useEffect(() => {
    dataSource2Ref.current = dataSource2
    const idx = new Map<string, number>()
    dataSource2.forEach((row, i) => idx.set(row.key, i))
    dataSource2IndexRef.current = idx
  }, [dataSource2])

  // 班主任表：高频输入（InputNumber）时的快速更新，避免全量 map
  const patchTeacherRowByKey = useCallback(
    (rowKey: string, patch: (row: EmployeeKpiPlanRecord) => EmployeeKpiPlanRecord) => {
      const idx = dataSource2IndexRef.current.get(rowKey)
      if (idx == null) return
      const current = dataSource2Ref.current
      const target = current[idx]
      if (!target) return

      const nextRow = patch(target)
      // 如果没有变化就不触发 setState
      if (nextRow === target) return

      const next = current.slice()
      next[idx] = nextRow
      setDataSource2(next)
    },
    [],
  )


  // 当前标签数据集
  const currentDataSource = activeTab === 'manager' ? dataSource1 : dataSource2
  const setCurrentDataSource = activeTab === 'manager' ? setDataSource1 : setDataSource2

  const getProjectIndicatorRowSpan = (record: EmployeeKpiPlanRecord) => {
    if (activeTab === 'teacher') return 0
    return getFieldRowSpan(record, currentDataSource, 'projectIndicator')
  }
  const getKpiIndicatorRowSpan = (record: EmployeeKpiPlanRecord) =>
    getFieldRowSpan(record, currentDataSource, 'kpiIndicator')

  const headerCellStyle: React.CSSProperties = { backgroundColor: '#fffacd', fontWeight: 'bold', textAlign: 'center' }

  // 教质经理列（可编辑）
  const columns: ColumnsType<EmployeeKpiPlanRecord> = useMemo(() => {
    const baseColumns: ColumnsType<EmployeeKpiPlanRecord> = []
    if (activeTab === 'manager') {
      baseColumns.push({
        title: '姓名',
        dataIndex: 'name',
        key: 'name',
        width: 120,
        align: 'center',
        render: (value, record) => {
          if (record.rowType === 'total') {
            // 合计行：合计字段显示在“姓名”列
            return { children: <span style={{ fontWeight: 600 }}>{record.name || '合计'}</span>, props: { rowSpan: 1 } }
          }

          const rowSpan = getGroupRowSpan(record, currentDataSource)
          return {
            children:
              rowSpan > 0 ? (
                <Input
                  value={value || ''}
                  onChange={(e) => {
                    const v = e.target.value
                    const groupId = record.groupId
                    setCurrentDataSource((prev) =>
                      prev.map((item) =>
                        item.rowType === 'data' && item.groupId === groupId
                          ? { ...item, name: v }
                          : item,
                      ),
                    )
                  }}
                  placeholder="请输入姓名"
                  size="small"
                />
              ) : null,
            props: { rowSpan },
          }
        },
      })
    }
    if (activeTab === 'manager') {
      baseColumns.push({ title: '项目指标', dataIndex: 'projectIndicator', key: 'projectIndicator', width: 120, align: 'center', render:(v,r)=> {
        // 合计行：保持空白（不隐藏），避免后续列错位导致 KPI值跑到左边
        if (r.rowType === 'total') return { children: '', props: { rowSpan: 1 } }
        return { children:(
          <Input value={v} onChange={(e)=> setCurrentDataSource(prev=>prev.map(it=>it.key===r.key?{...it,projectIndicator:e.target.value}:it)) }/>
        ), props:{ rowSpan: getProjectIndicatorRowSpan(r) } }
      } })
    }

    baseColumns.push(
      { title: 'KPI指标', dataIndex: 'kpiIndicator', key: 'kpiIndicator', width: 150, align: 'left', render:(v,r)=> {
        // 合计行：KPI指标列保持空白（不隐藏），避免后续列错位导致 KPI值跑到左边
        if (r.rowType === 'total') return { children: '', props: { rowSpan: 1 } }
        return { children:(
          <Input value={v} onChange={(e)=> setCurrentDataSource(prev=>prev.map(it=>it.key===r.key?{...it,kpiIndicator:e.target.value}:it)) }/>
        ), props:{ rowSpan: getKpiIndicatorRowSpan(r) } }
      } },
      { title: '计算细则', key: 'calculationRule', width: 400, align: 'left', render:(_ , r)=>{
        if (r.rowType === 'total') return { children: '', props: { rowSpan: 1 } }
        return (
          <Input.TextArea 
            value={`${r.kpiName}：${r.calculationRule}`}
            autoSize={{ minRows: 1, maxRows: 4 }}
            onChange={(e)=>{
              const val = e.target.value;
              const colonIndex = val.indexOf('：');
              const newName = colonIndex !== -1 ? val.substring(0, colonIndex) : val;
              const newRule = colonIndex !== -1 ? val.substring(colonIndex + 1) : '';
              setCurrentDataSource(prev =>
                prev.map(it =>
                  it.key === r.key
                    ? { ...it, kpiName: newName, calculationRule: newRule }
                    : it
                )
              )
            }}
          />
        )
      } },
      { title: '数据来源、考核', dataIndex: 'dataSource', key: 'dataSource', width: 150, align: 'center', render:(v,r)=> {
        // 合计行：保持空白（不隐藏），避免后续列错位导致 KPI值跑到左边
        if (r.rowType === 'total') return { children: '', props: { rowSpan: 1 } }
        return (
          <Input value={v} onChange={(e)=> setCurrentDataSource(prev=>prev.map(it=>it.key===r.key?{...it,dataSource:e.target.value}:it)) }/>
        )
      } },
      { title: '权重', dataIndex: 'weight', key: 'weight', width: 100, align: 'center', render:(v,r)=>{
        // 合计行：权重列不显示（合计字段已在“姓名”列显示）
        if (r.rowType === 'total') return { children: '', props: { rowSpan: 1 } }

        return (
          <InputNumber
            value={Number(v ?? 0)}
            min={0}
            max={100}
            precision={1}
            style={{ width: '100%' }}
            onChange={(val) => {
              const w = Number(val ?? 0)
              setCurrentDataSource((prev) =>
                prev.map((it) =>
                  it.key === r.key
                    ? { ...it, weight: w, kpiValue: calculateKpiValue(w, Number(it.supervisorScore ?? 0)) }
                    : it,
                ),
              )
            }}
          />
        )
      } },
    )

    baseColumns.push(
      { title: '项目描述', dataIndex: 'projectDescription', key: 'projectDescription', width: 150, align: 'left', render:(v,r)=>{
        if (r.rowType === 'total') return { children: '', props: { rowSpan: 1 } }
        return (
          <Input value={v} onChange={(e)=> setCurrentDataSource(prev=>prev.map(it=>it.key===r.key?{...it,projectDescription:e.target.value}:it)) }/>
        )
      } },
      { title: '自我打分', dataIndex: 'selfScore', key: 'selfScore', width: 100, align: 'center', render:(v,r)=>{
        if (r.rowType === 'total') return { children: '', props: { rowSpan: 1 } }
        return (
          <Input value={v} onChange={(e)=> setCurrentDataSource(prev=>prev.map(it=>it.key===r.key?{...it,selfScore:Number(e.target.value)||0}:it)) }/>
        )
      } },
      { title: '上级领导打分', dataIndex: 'supervisorScore', key: 'supervisorScore', width: 120, align: 'center', render:(v,r)=>{
        if (r.rowType === 'total') return { children: '', props: { rowSpan: 1 } }
        return (
          <InputNumber
            value={Number(v ?? 0)}
            min={0}
            max={10}
            step={0.1}
            precision={1}
            style={{ width: '100%' }}
            onChange={(val) => {
              const score = Number(val ?? 0)
              setCurrentDataSource((prev) =>
                prev.map((it) =>
                  it.key === r.key
                    ? { ...it, supervisorScore: score, kpiValue: calculateKpiValue(Number(it.weight ?? 0), score) }
                    : it,
                ),
              )
            }}
          />
        )
      } },
      { title: 'KPI值', dataIndex: 'kpiValue', key: 'kpiValue', width: 100, align: 'center', render:(v,r)=>{
        if (r.rowType === 'total') {
          // 合计行：数值右移6格 => 放到“KPI值”列显示（保持其在最右侧）
          const totalVal = Number(r.kpiValue ?? 0)
          return <span style={{ fontWeight: 600 }}>{Number.isFinite(totalVal) ? totalVal.toFixed(2) : '0.00'}</span>
        }
        const val = Number(v ?? r.kpiValue ?? 0)
        return <span>{Number.isFinite(val) ? val.toFixed(2) : '0.00'}</span>
      } },
      { title: '备注', dataIndex: 'remarks', key: 'remarks', width: 300, align: 'left', render:(v,r)=>{
        if (r.rowType === 'total') return { children: null, props: { colSpan: 0 } }
        return (
          <Input value={v} onChange={(e)=> setCurrentDataSource(prev=>prev.map(it=>it.key===r.key?{...it,remarks:e.target.value}:it)) }/>
        )
      } }
    )

    return baseColumns
  }, [activeTab, currentDataSource])

  // ==== 教质经理：每人一个“合计”行（跟在该人数据行后面）====
  const tableDataManager = useMemo<EmployeeKpiPlanRecord[]>(() => {
    const groups = new Map<string, EmployeeKpiPlanRecord[]>()
    const groupOrder: string[] = []

    dataSource1.forEach((row) => {
      if (row.rowType !== 'data') return
      if (!groups.has(row.groupId)) {
        groups.set(row.groupId, [])
        groupOrder.push(row.groupId)
      }
      groups.get(row.groupId)!.push(row)
    })

    const result: EmployeeKpiPlanRecord[] = []

    groupOrder.forEach((groupId) => {
      const rows = groups.get(groupId) || []
      if (rows.length === 0) return
      result.push(...rows)

      const name = rows[0]?.name || ''
      const totalKpi = rows.reduce((sum, r) => sum + Number(r.kpiValue ?? 0), 0)

      // 合计行：把数值放到 KPI值 列，避免出现在左侧列
      result.push({
        key: `total-manager-${groupId}`,
        groupId,
        name: `${name} 合计`,
        projectIndicator: '',
        kpiIndicator: '',
        kpiName: '',
        calculationRule: '',
        dataSource: '',
        weight: 0,
        projectDescription: '',
        selfScore: 0,
        supervisorScore: 0,
        kpiValue: Number(totalKpi.toFixed(2)),
        remarks: '',
        rowType: 'total',
      })
    })

    return result
  }, [dataSource1])

  // 班主任表：支持“按班主任筛选”，并在每个班主任末尾追加“xx 合计”行
  const tableDataTeacher = useMemo<EmployeeKpiPlanRecord[]>(() => {
    const teacherGroups = new Map<string, EmployeeKpiPlanRecord[]>()
    const result: EmployeeKpiPlanRecord[] = []

    // 按班主任分组（仅 data 行）
    dataSource2.forEach((row) => {
      if (row.rowType === 'data') {
        if (!teacherGroups.has(row.name)) teacherGroups.set(row.name, [])
        teacherGroups.get(row.name)?.push(row)
      }
    })

    // 逐个班主任输出：数据行 + 合计行
    teacherGroups.forEach((rows, name) => {
      // 筛选：不是 all 且姓名不匹配就跳过
      if (selectedTeacherFilter !== 'all' && name !== selectedTeacherFilter) return

      // 展示模式下：过滤掉权重为0的行
      const filteredRows = isTeacherEditMode ? rows : rows.filter(row => row.weight > 0)

      result.push(...filteredRows)

      // 合计行：只要有“kpi值”就参与合计；优先使用已存的 row.kpiValue
      // 这样能保证：合计行合计的是该班主任各行的 KPI值（而不是重新用权重*得分计算）
      const totalKpi = filteredRows.reduce((sum, row) => sum + Number(row.kpiValue ?? 0), 0)

      result.push({
        key: `total-${name}`,
        groupId: rows[0]?.groupId || '',
        name: `${name} 合计`,
        projectIndicator: '',
        kpiIndicator: '',
        kpiName: '',
        calculationRule: '',
        dataSource: '',
        weight: 0,
        projectDescription: '',
        selfScore: 0,
        supervisorScore: 0,
        kpiValue: Number(totalKpi.toFixed(2)),
        remarks: '',
        rowType: 'total',
      })
    })

    return result
  }, [dataSource2, selectedTeacherFilter, isTeacherEditMode])

  // 班主任“单表展示”列（纯展示，无输入）
  const teacherColumns: ColumnsType<EmployeeKpiPlanRecord> = useMemo(() => [
    { title: '姓名', dataIndex: 'name', key: 'name', width: 140, align: 'center', render:(v, r)=>{
      if (r.rowType === 'total') {
        // 合计行：显示“xxx 合计”
        return { children: r.name || '合计', props: { rowSpan: 1 } }
      }
      return {
        children: getNameRowSpan1(r, tableDataTeacher) > 0 ? (
          <Input
            value={v}
            onChange={(e)=> {
              const groupId = r.groupId
              setDataSource2(prev=>prev.map(it=>it.groupId===groupId?{...it,name:e.target.value}:it))
            }}
          />
        ) : null,
        props:{ rowSpan: getNameRowSpan1(r, tableDataTeacher) }
      }
    } },
    { title: 'KPI指标', dataIndex: 'kpiIndicator', key: 'kpiIndicator', width: 150, align: 'left', render:(v, r)=>{
      // 合计行：不显示输入框
      if (r.rowType === 'total') {
        return { children: '', props: { rowSpan: 1 } }
      }
      return {
        children: (
          <Input value={v} onChange={(e)=> setDataSource2(prev=>prev.map(it=>it.key===r.key?{...it,kpiIndicator:e.target.value}:it)) }/>
        ),
        props:{ rowSpan: getKpiIndicatorRowSpan1(r, tableDataTeacher) }
      }
    } },
    { title: '计算细则', key: 'calculationRule', width: 520, align: 'left', render:(_ , r)=> {
      // 合计行：不显示输入框
      if (r.rowType === 'total') {
        return ''
      }
      return (
        <Input.TextArea 
          value={r.calculationRule}
          onChange={(e)=> setDataSource2(prev=>prev.map(it=>it.key===r.key?{...it,calculationRule:e.target.value}:it)) }
          autoSize={{ minRows: 1, maxRows: 4 }}
          style={{ whiteSpace: 'pre-wrap' }}
        />
      )
    } },
    { title: '数据来源、考核', dataIndex: 'dataSource', key: 'dataSource', width: 150, align: 'center', render:(v,r)=>{
      // 合计行：不显示输入框
      if (r.rowType === 'total') {
        return ''
      }
      return (
        <Input value={v} onChange={(e)=> setDataSource2(prev=>prev.map(it=>it.key===r.key?{...it,dataSource:e.target.value}:it)) }/>
      )
    } },
    { title: '权重', dataIndex: 'weight', key: 'weight', width: 100, align: 'center', render:(v,r)=>{
      // 合计行：不显示输入框
      if (r.rowType === 'total') {
        return ''
      }
      return (
        <InputNumber
          value={v}
          min={0}
          max={100}
          precision={1}
          style={{ width: '100%' }}
          onChange={(val) => {
            const newWeight = Number(val ?? 0)
            patchTeacherRowByKey(r.key, (row) => {
              const nextKpi = calculateKpiValue(newWeight, row.supervisorScore)
              if (row.weight === newWeight && row.kpiValue === nextKpi) return row
              return { ...row, weight: newWeight, kpiValue: nextKpi }
            })
          }}
        />
      )
    } },
    { title: '得分', dataIndex: 'supervisorScore', key: 'score', width: 100, align: 'center', render:(v,r)=>{
      // 合计行：不显示输入框
      if (r.rowType === 'total') {
        return ''
      }
      return (
        <InputNumber
          value={v}
          min={0}
          max={10}
          step={0.1}
          precision={1}
          style={{ width: '100%' }}
          onChange={(val) => {
            const newScore = Number(val ?? 0)
            patchTeacherRowByKey(r.key, (row) => {
              const nextKpi = calculateKpiValue(row.weight, newScore)
              if (row.supervisorScore === newScore && row.kpiValue === nextKpi) return row
              return { ...row, supervisorScore: newScore, kpiValue: nextKpi }
            })
          }}
        />
      )
    } },
    {
      title: 'KPI值',
      dataIndex: 'kpiValue',
      key: 'kpiValue',
      width: 100,
      align: 'center',
      render: (v, r) => {
        // 合计行：直接展示合计结果
        if (r.rowType === 'total') {
          const totalVal = Number(r.kpiValue ?? 0)
          return <span>{Number.isFinite(totalVal) ? totalVal.toFixed(2) : '0.00'}</span>
        }

        // 明细行：展示 dataSource2 中的 kpiValue（由“权重/得分”onChange时写入）
        const val = Number(v ?? r.kpiValue ?? 0)
        return <span>{Number.isFinite(val) ? val.toFixed(2) : '0.00'}</span>
      },
    },

    { title: '备注', dataIndex: 'remarks', key: 'remarks', width: 300, align: 'left', render:(v,r)=>(
      <Input value={v} onChange={(e)=> setDataSource2(prev=>prev.map(it=>it.key===r.key?{...it,remarks:e.target.value}:it)) }/>
    ) },
  ], [tableDataTeacher, patchTeacherRowByKey])

  const getExistingNames = (rows: EmployeeKpiPlanRecord[]) =>
    Array.from(
      new Set(
        rows
          .filter((item) => item.rowType === 'data')
          .map((item) => item.name.trim())
          .filter(Boolean),
      ),
    )

  const getDuplicateNames = (rows: EmployeeKpiPlanRecord[]) => {
    const groupToName = new Map<string, string>()
    rows
      .filter((item) => item.rowType === 'data')
      .forEach((item) => {
        const groupKey = getGroupKey(item)
        if (!groupKey || groupToName.has(groupKey)) return
        groupToName.set(groupKey, item.name.trim())
      })

    const nameCount = new Map<string, number>()
    groupToName.forEach((name) => {
      if (!name) return
      nameCount.set(name, (nameCount.get(name) || 0) + 1)
    })

    return Array.from(nameCount.entries())
      .filter(([, count]) => count > 1)
      .map(([name]) => name)
  }

  const handleAddManagerByName = () => {
    if (!resolvedCampus) { message.warning('请先选择神殿'); return }
    const name = managerNameInput.trim()
    if (!name) { message.warning('请输入姓名'); return }
    const existing = new Set(getExistingNames(dataSource1))
    if (existing.has(name)) { message.warning('该姓名已存在'); return }
    setDataSource1((prev) => {
      const templateRows = buildManagerTemplateFromData(prev)
      return [...prev, ...buildManagerRows(name, createGroupId(), templateRows)]
    })
    setManagerNameInput('')
  }


  // 加载/保存（教质经理KPI）
  const loadManager = async () => {
    if (!resolvedCampus) { message.warning('请先选择神殿'); return }
    try {
      const qs: string[] = [`campus=${encodeURIComponent(resolvedCampus)}`]
      if (yearNumber) qs.push(`year=${yearNumber}`)
      if (monthNumber) qs.push(`month=${monthNumber}`)
      const res = await fetch(`${buildApiUrl('/teaching-quality/manager-kpi')}?${qs.join('&')}`)
      if (!res.ok) throw new Error(await res.text())
      const data: ManagerListAPI = await res.json()
      if (!data.行列表 || data.行列表.length === 0) {
        setDataSource1(buildManagerRows('', createGroupId()))
      } else {
        const rowsFromApi = [...data.行列表].sort(
          (a, b) =>
            String(a.姓名 || '').localeCompare(String(b.姓名 || '')) ||
            Number(a.序号 || 0) - Number(b.序号 || 0),
        )
        const nameToGroupId = new Map<string, string>()
        const rows: EmployeeKpiPlanRecord[] = rowsFromApi.map((r, idx) => {
          const name = r.姓名 || ''
          if (!nameToGroupId.has(name)) {
            nameToGroupId.set(name, createGroupId())
          }
          const groupId = nameToGroupId.get(name) as string
          const serialNumber = r.序号 ?? idx + 1
          return {
            key: `${groupId}-${serialNumber}`,
            groupId,
            serialNumber,
            name,
            projectIndicator: r.项目指标 || '',
            kpiIndicator: r.KPI指标 || '',
            kpiName: r.KPI名称 || '',
            calculationRule: r.计算细则 || '',
            dataSource: r.数据来源 || '',
            weight: Number(r.权重 || 0),
            projectDescription: r.项目描述 || '',
            selfScore: Number(r.自我打分 || 0),
            supervisorScore: Number(r.上级领导打分 || 0),
            kpiValue: Number(r.KPI值 || 0),
            remarks: r.备注 || '',
            rowType: (r.行类型 as any) || 'data',
          }
        })
        setDataSource1(rows)
      }
      message.success('已加载教质经理KPI')
    } catch (e:any) {
      console.error(e)
      message.error('加载失败：'+(e?.message||'未知错误'))
    }
  }

  const saveManager = async () => {
    if (!resolvedCampus) { message.warning('请先选择神殿'); return }
    const duplicateNames = getDuplicateNames(dataSource1)
    if (duplicateNames.length > 0) {
      message.warning(`姓名重复：${duplicateNames.join('、')}`)
      return
    }
    try {
      const payload = {
        神殿名称: resolvedCampus,
        年份: yearNumber ?? null,
        月份: monthNumber ?? null,
        行列表: dataSource1.map((r, idx)=>({
          序号: r.serialNumber ?? idx+1,
          姓名: r.name || null, 项目指标: r.projectIndicator || null, KPI指标: r.kpiIndicator || null, KPI名称: r.kpiName || null,
          计算细则: r.calculationRule || null, 数据来源: r.dataSource || null, 权重: r.weight ?? null, 项目描述: r.projectDescription || null,
          自我打分: r.selfScore ?? null, 上级领导打分: r.supervisorScore ?? null, KPI值: r.kpiValue ?? null, 备注: r.remarks || null, 行类型: r.rowType || 'data',
        }))
      }
      const res = await fetch(buildApiUrl('/teaching-quality/manager-kpi'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) throw new Error(await res.text())
      await loadManager()
      message.success('保存成功')
    } catch (e:any) { console.error(e); message.error('保存失败：'+(e?.message||'未知错误')) }
  }

  // 加载班主任KPI数据
  const loadTeacher = async () => {
    if (!resolvedCampus) {
      message.warning('请先选择神殿');
      return;
    }

    try {
      // 1. 获取当前神殿的所有班主任
      const homeroomTeachers = await fetchHomeroomTeachers({
        campus_name: resolvedCampus,
        active: true,
      });

      // 2. 获取已保存的KPI数据
      let savedKpiData: TeacherListAPI = { 神殿名称: resolvedCampus, 主表: [] };
      try {
        const qs2: string[] = [`campus=${encodeURIComponent(resolvedCampus)}`];
        if (yearNumber) qs2.push(`year=${yearNumber}`);
        if (monthNumber) qs2.push(`month=${monthNumber}`);

        const res = await fetch(`${buildApiUrl('/teaching-quality/teacher-kpi')}?${qs2.join('&')}`);
        if (res.ok) {
          savedKpiData = await res.json();
        } else {
          console.warn('加载KPI数据失败，将使用空数据', await res.text());
        }
      } catch (e) {
        console.warn('加载KPI数据失败，将使用空数据', e);
      }

      // 3. 将保存的数据按姓名分组
      const savedDataByTeacher = new Map<string, TeacherMainRowAPI[]>();
      (savedKpiData.主表 || []).forEach(row => {
        const name = (row.姓名 || '').trim();
        if (!name) return;
        if (!savedDataByTeacher.has(name)) {
          savedDataByTeacher.set(name, []);
        }
        savedDataByTeacher.get(name)?.push(row);
      });

      // 4. 为每个班主任生成数据行
      const teacherNameSet = new Set(homeroomTeachers.map(t => t.name).filter(Boolean));
      const savedTeacherNames = Array.from(savedDataByTeacher.keys());
      savedTeacherNames.forEach(name => teacherNameSet.add(name));
      
      const teacherNames = Array.from(teacherNameSet).sort((a, b) => a.localeCompare(b));
      setTeacherNames(teacherNames);

      const merged: EmployeeKpiPlanRecord[] = [];

      for (const name of teacherNames) {
        const savedRows = savedDataByTeacher.get(name) || [];
        const serialMap = new Map<number, TeacherMainRowAPI>();

        savedRows.forEach(row => {
          if (row.序号 != null) {
            serialMap.set(row.序号, row);
          }
        });

        const groupId = createGroupId();
        const templateRows = buildTeacherRows(name, groupId);

        const filledRows = templateRows.map(t => {
          const savedRow = serialMap.get(t.serialNumber || 0);

          if (savedRow) {
            return {
              ...t,
              dataSource: savedRow.数据来源 ?? t.dataSource,
              weight: Number(savedRow.权重 ?? t.weight),
              supervisorScore: Number(savedRow.得分 ?? t.supervisorScore),
              kpiValue: calculateKpiValue(
                Number(savedRow.权重 ?? t.weight),
                Number(savedRow.得分 ?? t.supervisorScore)
              ),
              remarks: savedRow.备注 ?? t.remarks,
              rowType: (savedRow.行类型 as any) || t.rowType,
            };
          }
          return t;
        });

        merged.push(...filledRows);
      }

      setDataSource2(merged);
      message.success('已加载班主任KPI数据');
    } catch (e: any) {
      console.error('加载班主任KPI失败:', e);
      message.error(`加载失败: ${e?.message || '未知错误'}`);
      setDataSource2([]);
    }
  };

  const getTeacherNextSerialNumber = (rows: EmployeeKpiPlanRecord[]) => {
    const maxSerial = rows
      .filter((r) => r.rowType === 'data')
      .reduce((max, r) => Math.max(max, Number(r.serialNumber ?? 0)), 0)
    return maxSerial + 1
  }

  const insertMetricRowIntoTeacher = (prev: EmployeeKpiPlanRecord[], newTemplate: TeacherTemplateRow) => {
    // 给每个班主任(group)追加同一条新指标（插入到该人最后）
    const groups = new Map<string, EmployeeKpiPlanRecord[]>()
    const groupOrder: string[] = []

    prev.forEach((row) => {
      if (row.rowType !== 'data') return
      if (!groups.has(row.groupId)) {
        groups.set(row.groupId, [])
        groupOrder.push(row.groupId)
      }
      groups.get(row.groupId)!.push(row)
    })

    const result: EmployeeKpiPlanRecord[] = []

    groupOrder.forEach((groupId) => {
      const rows = groups.get(groupId) || []
      if (rows.length === 0) return
      const name = rows[0]?.name || ''
      result.push(...rows)

      result.push({
        key: `${groupId}-${newTemplate.serialNumber}`,
        groupId,
        serialNumber: newTemplate.serialNumber,
        name,
        projectIndicator: '',
        kpiIndicator: newTemplate.kpiIndicator,
        kpiName: newTemplate.kpiName,
        calculationRule: newTemplate.calculationRule,
        dataSource: newTemplate.dataSource,
        weight: newTemplate.weight,
        projectDescription: '',
        selfScore: 0,
        supervisorScore: 0,
        kpiValue: calculateKpiValue(newTemplate.weight, 0),
        remarks: newTemplate.remarks,
        rowType: 'data',
      })
    })

    return result
  }

  const handleAddTeacherMetricRow = () => {
    if (!teacherMetricKpiIndicator.trim()) return message.warning('请输入KPI指标')
    if (!teacherMetricCalculationRule.trim()) return message.warning('请输入计算细则')

    const newSerial = getTeacherNextSerialNumber(dataSource2)
    const newTemplate: TeacherTemplateRow = {
      serialNumber: newSerial,
      kpiIndicator: teacherMetricKpiIndicator.trim(),
      // 班主任表格“计算细则”列只展示 calculationRule，所以把弹窗里的“计算细则”写入 calculationRule
      kpiName: '',
      calculationRule: teacherMetricCalculationRule.trim(),
      dataSource: teacherMetricDataSource.trim(),
      weight: Number(teacherMetricWeight || 0),
      remarks: teacherMetricRemarks.trim(),
      rowType: 'data',
    }

    // 1) 立即插入到当前所有班主任数据中
    setDataSource2((prev) => insertMetricRowIntoTeacher(prev, newTemplate))

    // 2) 更新模板：后续 loadTeacher/buildTeacherRows 也会包含该指标（仅前端运行时）
    TEACHER_TEMPLATE_ROWS.push(newTemplate)

    // reset
    setAddTeacherMetricOpen(false)
    setTeacherMetricKpiIndicator('')
    setTeacherMetricCalculationRule('')
    setTeacherMetricDataSource('')
    setTeacherMetricWeight(0)
    setTeacherMetricRemarks('')

    message.success('已新增班主任指标行（请点击“保存”提交到后端）')
  }

  const saveTeacher = async () => {
    if (!resolvedCampus) { message.warning('请先选择神殿'); return }
    const duplicateNames = getDuplicateNames(dataSource2)
    if (duplicateNames.length > 0) {
      message.warning(`姓名重复：${duplicateNames.join('、')}`)
      return
    }
    try {
      const payload: TeacherListAPI = {
        神殿名称: resolvedCampus,
        年份: yearNumber ?? null,
        月份: monthNumber ?? null,
        主表: dataSource2
          .filter((r) => r.rowType !== 'total')
          .map((r, idx)=>({
          序号: r.serialNumber ?? idx+1, 姓名: r.name || null, KPI指标: r.kpiIndicator || null, KPI名称: r.kpiName || null,
          计算细则: r.calculationRule || null, 数据来源: r.dataSource || null, 权重: r.weight ?? null, 备注: r.remarks || null,
          得分: r.supervisorScore ?? null, KPI值: r.kpiValue ?? null, 行类型: r.rowType || 'data'
        }))
      }
      const res = await fetch(buildApiUrl('/teaching-quality/teacher-kpi'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) throw new Error(await res.text())
      await loadTeacher()
      message.success('保存成功')
    } catch (e:any) { console.error(e); message.error('保存失败：'+(e?.message||'未知错误')) }
  }

  // 自动加载：切换神殿/年月或标签
  useEffect(() => {
    if (currentCampus && currentCampus !== selectedCampus) {
      setSelectedCampus(currentCampus)
    }
  }, [currentCampus, selectedCampus])

  useEffect(()=>{ if (activeTab==='manager' && resolvedCampus) loadManager() }, [activeTab, resolvedCampus, yearNumber, monthNumber])
  useEffect(()=>{ if (activeTab==='teacher' && resolvedCampus) loadTeacher() }, [activeTab, resolvedCampus, yearNumber, monthNumber])

  const handleExport = () => { message.info('导出功能开发中...') }
  const handleCampusChange = (value: string) => { setSelectedCampus(value); setCampus(value) }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24, textAlign: 'center', fontSize: '20px', fontWeight: 'bold', padding: '16px', backgroundColor: '#fff1f0', borderRadius: 4, border: '1px solid #ffccc7' }}>
        <TrophyOutlined style={{ marginRight: 8 }} />
        {selectedCampus || currentCampus || '神殿'}教化司员工KPI计划表
      </div>

      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'manager',
              label: '教质经理KPI',
              children: (
                <div>
                  <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Space>
                      <span>神殿：</span>
                      <Select value={selectedCampus} onChange={handleCampusChange} style={{ width: 180 }} placeholder="请选择神殿">
                        {campuses.map((campus) => (
                          <Option key={campus.name} value={campus.name}>
                            {campus.name}
                          </Option>
                        ))}
                      </Select>
                      <span>年份：</span>
                      <DatePicker picker="year" value={selectedYear} onChange={(d)=> d && setSelectedYear(d)} style={{ width: 120 }} />
                      <span>月份：</span>
                      <DatePicker picker="month" value={selectedMonth} onChange={(d)=> d && setSelectedMonth(d)} style={{ width: 140 }} />
                    </Space>
                    <Space>
                      <Input
                        value={managerNameInput}
                        onChange={(e) => setManagerNameInput(e.target.value)}
                        onPressEnter={handleAddManagerByName}
                        placeholder="输入姓名"
                        style={{ width: 160 }}
                        allowClear
                      />
                      <Button icon={<PlusOutlined />} onClick={handleAddManagerByName}>按姓名新增记录</Button>
                      <Button icon={<PlusCircleOutlined />} onClick={() => setAddMetricOpen(true)}>新增指标行</Button>
                      <Button icon={<SaveOutlined />} type="primary" onClick={saveManager}>保存</Button>
                      <Button icon={<ReloadOutlined />} onClick={loadManager}>加载</Button>
                      <Button icon={<DownloadOutlined />} onClick={handleExport}>导出</Button>
                    </Space>
                  </div>

                  <Table columns={columns} dataSource={tableDataManager} pagination={false} scroll={{ x: 'max-content', y: 600 }} bordered size="small" rowKey="key" components={{ header:{ cell:(props:any)=>{ const merged={ ...props, style:{ ...props.style, ...headerCellStyle } }; return <th {...merged} /> } } }} />

                  {/* 新增指标行（项目指标/KPI指标等） */}
                  <Modal
                    title="新增指标行"
                    open={addMetricOpen}
                    onCancel={() => setAddMetricOpen(false)}
                    onOk={handleAddManagerMetricRow}
                    okText="确定"
                    cancelText="取消"
                  >
                    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12, alignItems: 'center' }}>
                      <div>项目指标</div>
                      <Input value={metricProjectIndicator} onChange={(e) => setMetricProjectIndicator(e.target.value)} placeholder="例如：业务指标/管理指标/质量指标" />

                      <div>KPI指标</div>
                      <Input value={metricKpiIndicator} onChange={(e) => setMetricKpiIndicator(e.target.value)} placeholder="例如：就业管理/口碑/教学质量" />

                      <div>计算细则</div>
                      <Input.TextArea value={metricCalculationRule} onChange={(e) => setMetricCalculationRule(e.target.value)} autoSize={{ minRows: 2, maxRows: 6 }} placeholder="例如：10*实际/目标" />

                      <div>数据来源、考核</div>
                      <Input value={metricDataSource} onChange={(e) => setMetricDataSource(e.target.value)} placeholder="可为空" />

                      <div>权重(%)</div>
                      <InputNumber value={metricWeight} onChange={(v) => setMetricWeight(Number(v ?? 0))} min={0} max={100} precision={1} style={{ width: '100%' }} />

                      <div>项目描述</div>
                      <Input value={metricProjectDescription} onChange={(e) => setMetricProjectDescription(e.target.value)} placeholder="可为空" />
                    </div>
                    <div style={{ marginTop: 12, color: '#888', fontSize: 12 }}>
                      提示：点击确定后，会给当前页面所有已存在的教质经理都追加这一条指标；新增的人员也会自动带上该指标。最后请点“保存”。
                    </div>
                  </Modal>
                </div>
              ),
            },
            {
              key: 'teacher',
              label: '班主任KPI计划',
              children: (
                <div>
                  <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Space>
                      <span>神殿：</span>
                      <Select value={selectedCampus} onChange={handleCampusChange} style={{ width: 180 }} placeholder="请选择神殿">
                        {campuses.map((campus) => (<Option key={campus.name} value={campus.name}>{campus.name}</Option>))}
                      </Select>
                      <span>班主任：</span>
                      <Select
                        value={selectedTeacherFilter}
                        onChange={(v) => setSelectedTeacherFilter(v ?? 'all')}
                        style={{ width: 200 }}
                        placeholder="选择班主任"
                        allowClear
                      >
                        <Option value="all">全部班主任</Option>
                        {teacherNames.map((name) => (
                          <Option key={name} value={name}>
                            {name}
                          </Option>
                        ))}
                      </Select>
                      <span>年份：</span>
                      <DatePicker picker="year" value={selectedYear} onChange={(d)=> d && setSelectedYear(d)} style={{ width: 120 }} />
                      <span>月份：</span>
                      <DatePicker picker="month" value={selectedMonth} onChange={(d)=> d && setSelectedMonth(d)} style={{ width: 140 }} />
                    </Space>
                    <Space>
                      <Space>
                        <span>{isTeacherEditMode ? <EditOutlined /> : <EyeOutlined />}</span>
                        <span>{isTeacherEditMode ? '编辑模式' : '展示模式'}</span>
                        <Switch
                          checked={isTeacherEditMode}
                          onChange={(checked) => setIsTeacherEditMode(checked)}
                          checkedChildren="编辑"
                          unCheckedChildren="展示"
                        />
                      </Space>
                      <Button icon={<PlusCircleOutlined />} onClick={() => setAddTeacherMetricOpen(true)}>新增指标行</Button>
                      <Button icon={<SaveOutlined />} type="primary" onClick={saveTeacher}>保存</Button>
                      <Button icon={<ReloadOutlined />} onClick={loadTeacher}>加载</Button>
                      <Button icon={<DownloadOutlined />} onClick={handleExport}>导出</Button>
                    </Space>
                  </div>

                  {/* 班主任：单表展示，不再分割 */}
                  <Table
                    columns={teacherColumns}
                    dataSource={tableDataTeacher}
                    pagination={false}
                    scroll={{ x: 'max-content', y: 600 }}
                    bordered
                    size="small"
                    rowKey="key"
                    rowClassName={(record) => {
                      if (record.rowType === 'total') {
                        return 'teacher-total-row'
                      }
                      return ''
                    }}
                    components={{ header:{ cell:(props:any)=>{ const merged={ ...props, style:{ ...props.style, ...headerCellStyle } }; return <th {...merged} /> } } }}
                  />

                  <style>{`
                    .teacher-total-row td {
                      background-color: #e6f7ff !important;
                      font-weight: bold !important;
                      border-top: 2px solid #1890ff !important;
                      border-bottom: 3px solid #1890ff !important;
                    }
                  `}</style>

                  {/* 班主任：新增指标行 */}
                  <Modal
                    title="新增班主任KPI指标行"
                    open={addTeacherMetricOpen}
                    onCancel={() => setAddTeacherMetricOpen(false)}
                    onOk={handleAddTeacherMetricRow}
                    okText="确定"
                    cancelText="取消"
                  >
                    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12, alignItems: 'center' }}>
                      <div>KPI指标</div>
                      <Input value={teacherMetricKpiIndicator} onChange={(e) => setTeacherMetricKpiIndicator(e.target.value)} placeholder="例如：日常管理/口碑" />

                      <div>计算细则</div>
                      <Input.TextArea value={teacherMetricCalculationRule} onChange={(e) => setTeacherMetricCalculationRule(e.target.value)} autoSize={{ minRows: 2, maxRows: 6 }} placeholder="例如：10-所带学员流失数" />

                      <div>数据来源、考核</div>
                      <Input value={teacherMetricDataSource} onChange={(e) => setTeacherMetricDataSource(e.target.value)} placeholder="可为空" />

                      <div>权重(%)</div>
                      <InputNumber value={teacherMetricWeight} onChange={(v) => setTeacherMetricWeight(Number(v ?? 0))} min={0} max={100} precision={1} style={{ width: '100%' }} />

                      <div>备注</div>
                      <Input value={teacherMetricRemarks} onChange={(e) => setTeacherMetricRemarks(e.target.value)} placeholder="可为空" />
                    </div>
                    <div style={{ marginTop: 12, color: '#888', fontSize: 12 }}>
                      提示：点击确定后，会给当前页面所有班主任都追加这一条指标；最后请点“保存”。
                    </div>
                  </Modal>
                </div>
              ),
            },
          ]}
        />
      </Card>
    </div>
  )
}

export default CampusEmployeeKpiPlanPage
