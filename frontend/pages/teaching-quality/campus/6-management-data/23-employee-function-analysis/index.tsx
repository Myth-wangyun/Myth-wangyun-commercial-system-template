/**
 * 神殿教化司员工功能分析表页面（接入后端 API：业务功能分析 + 功能分析）
 */

import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react'
import { App, Card, Table, Button, Space, Select, Tabs, DatePicker, InputNumber, Input, Modal, Tooltip, Radio, Spin } from 'antd'
import { ReloadOutlined, DownloadOutlined, SaveOutlined, PlusOutlined, CalendarOutlined, UnorderedListOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useCampusStore } from '@/stores/campusStore'
import dayjs, { Dayjs } from 'dayjs'
import { buildApiUrl } from '@/utils/apiBase'
import { fetchHomeroomTeachers, fetchTeachers } from '@/services/configMaster'

const { Option } = Select
// Stable style objects to avoid prop identity changes each render
const inputNumberStyle: React.CSSProperties = { width: '100%' }

// ===== 每日数据类型定义 =====
interface DailyBusinessRowAPI {
  日期: string
  员工姓名: string
  出勤人数?: number | null
  应出勤人数?: number | null
  出勤率?: number | null
  学员访谈人数?: number | null
  家长访谈人数?: number | null
  素质课次数?: number | null
  活动组织次数?: number | null
}

interface DailyBusinessListAPI {
  神殿名称: string
  日期: string
  行列表: DailyBusinessRowAPI[]
}

interface DailyBusinessRecord {
  key: string
  date: string
  employeeName: string
  presentCount: number | null
  totalCount: number | null
  attendanceRate: number | null
  studentInterviewCount: number | null
  parentInterviewCount: number | null
  qualityClassCount: number | null
  activityCount: number | null
}

// ===== 类型定义（前端内部） =====
// 创建一个 Context 来传递稳定的更新函数
const TableContext = React.createContext<{
  handleBusinessDataChange: (key: string, field: keyof EmployeeFunctionAnalysisRecord, value: any) => void;
  handleFunctionDataChange: (key: string, employeeName: string, value: number) => void;
} | null>(null);



// 业务功能分析记录
interface EmployeeFunctionAnalysisRecord {
  key: string
  month: number | string // 月份（1-12 或 "合计/平均"）
  employeeName: string // 员工姓名
  // 带班
  classLoad: number // 带班量
  classStudentCount: number // 带班人数
  // 带宿舍
  dormitoryLoad: number // 带宿舍量
  dormitoryStudentCount: number // 带宿舍人数
  // 其他指标
  averageAttendanceRate: number // 学生平均出勤率
  dailyInterviewRate: number // 日常访谈率
  parentInterviewRate: number // 家长访谈率
  qualityClassCount: number // 素质课次数
  activityOrganizationCount: number // 活动组织次数
  // 就业
  employmentRate: number // 就业率
  averageEmploymentSalary: number // 就业平均薪资
  employmentCount: number // 就业人数
  // 口碑
  reputationEnrollmentCount: number // 口碑报名人数
  reputationRevenue: number // 口碑收入
  // 异动
  fluctuationCount: number // 异动人数
  fluctuationRate: number // 异动率
  // 退费
  refundCount: number // 退费人数
  refundRate: number // 退费率
  // 升学
  enrollmentRate: number // 升学率
  rowType?: 'data' | 'total'
}

// 功能分析表记录（每行一个项目；动态员工列通过属性名存储）
interface TeacherFunctionAnalysisRecord {
  key: string
  serialNumber: number // 序号
  category: string // 类别
  functionItem: string // 功能项目
  detailedRequirement: string // 详细要求
  fullScore: number // 满分
  [employee: string]: any // 动态员工列（张三/李四...）
  rowType?: 'data' | 'total'
}

// ===== API 类型定义 =====
// 业务功能分析 API
interface BusinessRowAPI {
  月份: number
  员工姓名: string
  带班量?: number | null
  带班人数?: number | null
  带宿舍量?: number | null
  带宿舍人数?: number | null
  学生平均出勤率?: number | null
  日常访谈率?: number | null
  家长访谈率?: number | null
  素质课次数?: number | null
  活动组织次数?: number | null
  就业率?: number | null
  就业平均薪资?: number | null
  就业人数?: number | null
  口碑报名人数?: number | null
  口碑收入?: number | null
  异动人数?: number | null
  异动率?: number | null
  退费人数?: number | null
  退费率?: number | null
  升学率?: number | null
}
interface BusinessListAPI {
  神殿名称: string
  年份: number
  行列表: BusinessRowAPI[]
}

// 功能分析 API
interface FunctionRowAPI {
  序号: number
  类别?: string | null
  功能项目?: string | null
  详细要求?: string | null
  满分?: number | null
  员工得分: Record<string, number | null>
}
interface FunctionListAPI {
  神殿名称: string
  年份: number
  员工列表: string[]
  行列表: FunctionRowAPI[]
}

// ========== 工具：空模板构建（放在组件外/顶部，避免TDZ） ==========
const normalizeNames = (names: string[] = []) =>
  Array.from(new Set(names.map((name) => name.trim()).filter(Boolean)))

const buildBusinessRowKey = (month: number, name: string) => `${month}-${name}`

const buildEmptyBusinessRow = (month: number, name: string): EmployeeFunctionAnalysisRecord => ({
  key: buildBusinessRowKey(month, name),
  month,
  employeeName: name,
  classLoad: 0,
  classStudentCount: 0,
  dormitoryLoad: 0,
  dormitoryStudentCount: 0,
  averageAttendanceRate: 0,
  dailyInterviewRate: 0,
  parentInterviewRate: 0,
  qualityClassCount: 0,
  activityOrganizationCount: 0,
  employmentRate: 0,
  averageEmploymentSalary: 0,
  employmentCount: 0,
  reputationEnrollmentCount: 0,
  reputationRevenue: 0,
  fluctuationCount: 0,
  fluctuationRate: 0,
  refundCount: 0,
  refundRate: 0,
  enrollmentRate: 0,
  rowType: 'data',
})

const buildTotalBusinessRow = (): EmployeeFunctionAnalysisRecord => ({
  key: 'total',
  month: '合计/平均',
  employeeName: '',
  classLoad: 0,
  classStudentCount: 0,
  dormitoryLoad: 0,
  dormitoryStudentCount: 0,
  averageAttendanceRate: 0,
  dailyInterviewRate: 0,
  parentInterviewRate: 0,
  qualityClassCount: 0,
  activityOrganizationCount: 0,
  employmentRate: 0,
  averageEmploymentSalary: 0,
  employmentCount: 0,
  reputationEnrollmentCount: 0,
  reputationRevenue: 0,
  fluctuationCount: 0,
  fluctuationRate: 0,
  refundCount: 0,
  refundRate: 0,
  enrollmentRate: 0,
  rowType: 'total',
})

const buildBusinessRowsFromMap = (
  rowMap: Map<string, EmployeeFunctionAnalysisRecord>,
  homeroomNames: string[],
): EmployeeFunctionAnalysisRecord[] => {
  const baseNames = normalizeNames(homeroomNames)
  const existingNames = normalizeNames(
    Array.from(rowMap.values()).map((row) => row.employeeName),
  )
  const extraNames = existingNames.filter((name) => !baseNames.includes(name)).sort()
  const allNames = [...baseNames, ...extraNames]
  const rows: EmployeeFunctionAnalysisRecord[] = []
  for (let m = 1; m <= 12; m++) {
    allNames.forEach((name) => {
      const key = buildBusinessRowKey(m, name)
      const existing = rowMap.get(key)
      if (existing) {
        rows.push({ ...existing, key, month: m, employeeName: name, rowType: 'data' })
      } else if (name) {
        rows.push(buildEmptyBusinessRow(m, name))
      }
    })
  }
  rows.push(buildTotalBusinessRow())
  return rows
}

function createEmptyBusinessData(employees: string[] = []): EmployeeFunctionAnalysisRecord[] {
  return buildBusinessRowsFromMap(new Map(), employees)
}

function buildDefaultFunctionRows(): TeacherFunctionAnalysisRecord[] {
  return [
    { key: '1', serialNumber: 1, category: '核心业务能力', functionItem: '学员就业', detailedRequirement: '就业率和就业薪资高。', fullScore: 10, rowType: 'data' },
    { key: '2', serialNumber: 2, category: '核心业务能力', functionItem: '口碑招生', detailedRequirement: '口碑招生和收入高。', fullScore: 10, rowType: 'data' },
    { key: '3', serialNumber: 3, category: '核心业务能力', functionItem: '新生维稳', detailedRequirement: '新生流失较少。', fullScore: 10, rowType: 'data' },
    { key: '4', serialNumber: 4, category: '一般业务能力', functionItem: '解决问题', detailedRequirement: '处理退费、异动、问题学生和家长得当', fullScore: 10, rowType: 'data' },
    { key: '5', serialNumber: 5, category: '一般业务能力', functionItem: '沟通协调', detailedRequirement: '与上级，同级、下级及学生和家长沟通协调顺畅，知分寸', fullScore: 5, rowType: 'data' },
    { key: '6', serialNumber: 6, category: '一般业务能力', functionItem: '教务管理', detailedRequirement: '档案、表格、考试、证书等数据整理认真细致不出错', fullScore: 5, rowType: 'data' },
    { key: '7', serialNumber: 7, category: '一般业务能力', functionItem: '宿舍管理', detailedRequirement: '认真负责，无投诉', fullScore: 5, rowType: 'data' },
    { key: '8', serialNumber: 8, category: '价值观', functionItem: '责任心', detailedRequirement: '对待学生，对待工作有责任心。', fullScore: 5, rowType: 'data' },
    { key: '9', serialNumber: 9, category: '价值观', functionItem: '执行力', detailedRequirement: '能认真执行上级领导的各项安排。', fullScore: 5, rowType: 'data' },
    { key: '10', serialNumber: 10, category: '价值观', functionItem: '吃苦耐劳', detailedRequirement: '不辞辛苦，任劳任怨。', fullScore: 5, rowType: 'data' },
    { key: '11', serialNumber: 11, category: '价值观', functionItem: '团队精神', detailedRequirement: '有大局观，个人利益服从集体利益。', fullScore: 5, rowType: 'data' },
    { key: '12', serialNumber: 12, category: '价值观', functionItem: '职业行为', detailedRequirement: '工装、出勤、自律性、职业化等。', fullScore: 5, rowType: 'data' },
    { key: '13', serialNumber: 13, category: '价值观', functionItem: '向内归因', detailedRequirement: '主动从自身找原因，不推诿给他人。', fullScore: 5, rowType: 'data' },
    { key: '14', serialNumber: 14, category: '其他', functionItem: '可出差', detailedRequirement: '能到外地出差1年以上。', fullScore: 15, rowType: 'data' },
    { key: 'total', serialNumber: 0, category: '', functionItem: '合计', detailedRequirement: '', fullScore: 100, rowType: 'total' },
  ]
}

// Memoized cell for Business Table Name column
const BusinessNameCell = React.memo(
    ({ recordKey, value, options }: { recordKey: string, value: string, options: string[] }) => {
        const context = React.useContext(TableContext);
        const mergedOptions =
            value && !options.includes(value) ? [value, ...options] : options;
        const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            context?.handleBusinessDataChange(recordKey, 'employeeName', e.target.value);
        };
        const handleChange = (nextValue?: string) => {
            context?.handleBusinessDataChange(recordKey, 'employeeName', nextValue || '');
        };
        if (mergedOptions.length === 0) {
            return <Input value={value} onChange={handleInputChange} placeholder="请输入姓名" />;
        }
        return (
            <Select
                value={value || undefined}
                onChange={handleChange}
                placeholder="请选择姓名"
                showSearch
                allowClear
                style={{ width: '100%' }}
                options={mergedOptions.map((name) => ({ label: name, value: name }))}
                filterOption={(input, option) => (option?.label as string).includes(input)}
            />
        );
    },
);
BusinessNameCell.displayName = 'BusinessNameCell';

// Memoized cell for Business Table Number columns
const BusinessNumberCell = React.memo(
  ({
    recordKey,
    field,
    value,
    disabled = false,
  }: {
    recordKey: string
    field: keyof EmployeeFunctionAnalysisRecord
    value: number
    disabled?: boolean
  }) => {
    const context = React.useContext(TableContext)
    const handleChange = (newValue: number | null) => {
      context?.handleBusinessDataChange(recordKey, field, newValue ?? 0)
    }
    return (
      <InputNumber
        value={value}
        onChange={handleChange}
        style={inputNumberStyle}
        controls={false}
        disabled={disabled}
      />
    )
  },
)
BusinessNumberCell.displayName = 'BusinessNumberCell';

// Memoized cell for Function Table Number columns
const FunctionNumberCell = React.memo(({ recordKey, employeeName, value }: { recordKey: string, employeeName: string, value: number }) => {
    const context = React.useContext(TableContext);
    const handleChange = (newValue: number | null) => {
        context?.handleFunctionDataChange(recordKey, employeeName, newValue ?? 0);
    };
    return <InputNumber value={value} onChange={handleChange} style={inputNumberStyle} controls={false} />;
});
FunctionNumberCell.displayName = 'FunctionNumberCell';

const CampusEmployeeFunctionAnalysisPage: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore()
  const [selectedCampus, setSelectedCampus] = useState<string>('')
  const [selectedYear, setSelectedYear] = useState<Dayjs | null>(dayjs())
  const yearNumber = selectedYear ? selectedYear.year() : dayjs().year()

  const [activeTab, setActiveTab] = useState<string>('business')
  const [selectedHomeroom, setSelectedHomeroom] = useState<string | undefined>(undefined)

  // ===== 每日数据视图状态 =====
  const [viewMode, setViewMode] = useState<'monthly' | 'daily'>('monthly')
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs())
  const [dailyData, setDailyData] = useState<DailyBusinessRecord[]>([])
  const [dailyLoading, setDailyLoading] = useState(false)

  // 当顶部神殿选择变化时，同步到本页，并重置数据
  useEffect(() => {
    if (currentCampus) {
      setSelectedCampus(currentCampus)
      // 切换神殿时，立即清空旧数据，避免显示残留信息
      setDataSource1(createEmptyBusinessData([]))
      setDataSource2(buildDefaultFunctionRows())
      setHomeroomNames([])
      setSelectedHomeroom(undefined)
    }
  }, [currentCampus])

  // 配置中心：班主任列表
  const [homeroomNames, setHomeroomNames] = useState<string[]>([])
  const homeroomNamesRef = useRef<string[]>([])
  useEffect(() => {
    homeroomNamesRef.current = homeroomNames
  }, [homeroomNames])
  useEffect(() => {
    const loadNames = async () => {
      if (!selectedCampus) { setHomeroomNames([]); return }
      try {
        const list = await fetchHomeroomTeachers({ campus_name: selectedCampus, active: true })
        const names = Array.from(new Set(list.map(t => t.name).filter(Boolean))).sort()
        setHomeroomNames(names)
      } catch (e) {
        console.error('加载配置中心班主任失败', e)
        setHomeroomNames([])
      }
    }
    loadNames()
  }, [selectedCampus])

  // 配置中心：教员列表
  const [teacherNames, setTeacherNames] = useState<string[]>([])
  useEffect(() => {
    const loadTeacherNames = async () => {
      if (!selectedCampus) {
        setTeacherNames([])
        return
      }
      try {
        const list = await fetchTeachers({ campus_name: selectedCampus, active: true })
        const names = Array.from(new Set(list.map((t) => t.name).filter(Boolean))).sort()
        setTeacherNames(names)
      } catch (e) {
        console.error('加载配置中心教员失败', e)
        setTeacherNames([])
      }
    }
    loadTeacherNames()
  }, [selectedCampus])

  const homeroomFilterOptions = useMemo(() => {
    const merged =
      selectedHomeroom && !homeroomNames.includes(selectedHomeroom)
        ? [selectedHomeroom, ...homeroomNames]
        : homeroomNames
    return merged.map((name) => ({ label: name, value: name }))
  }, [homeroomNames, selectedHomeroom])

  // 业务功能分析数据源（提供默认可编辑模板，避免空数据无法录入）
  const [dataSource1, setDataSource1] = useState<EmployeeFunctionAnalysisRecord[]>(createEmptyBusinessData())

  // 功能分析：动态员工列表 + 数据源（如后端无员工列表，则使用配置中心名单或默认）
  const [employees2, setEmployees2] = useState<string[]>([])
  const [manageEmpOpen, setManageEmpOpen] = useState(false)
  const [editingEmployees, setEditingEmployees] = useState<string[]>([])
  const [selectedTeacher, setSelectedTeacher] = useState<string | undefined>(undefined)
  const [dataSource2, setDataSource2] = useState<TeacherFunctionAnalysisRecord[]>(buildDefaultFunctionRows())

  const handleBusinessDataChange = useCallback((key: string, field: keyof EmployeeFunctionAnalysisRecord, value: any) => {
    setDataSource1(prev => {
      const idx = prev.findIndex(row => row.key === key);
      if (idx === -1) return prev;
      const newData = [...prev];
      newData[idx] = { ...newData[idx], [field]: value };
      return newData;
    })
  }, []);

  const handleFunctionDataChange = useCallback((key: string, employeeName: string, value: number) => {
    setDataSource2(prev => {
      const idx = prev.findIndex(row => row.key === key);
      if (idx === -1) return prev;
      const newData = [...prev];
      newData[idx] = { ...newData[idx], [employeeName]: value };
      return newData;
    })
  }, []);

  // Memoize context value to prevent unnecessary re-renders of all cells
  const ctxValue = useMemo(() => ({
    handleBusinessDataChange,
    handleFunctionDataChange
  }), [handleBusinessDataChange, handleFunctionDataChange]);

  // 业务功能：当前已有班主任名单（目前仅用于调试/统计）
  const businessEmployees = useMemo(() => {
    const set = new Set<string>()
    dataSource1.forEach(r => { if (r.rowType==='data' && r.employeeName) set.add(r.employeeName) })
    return Array.from(set)
  }, [dataSource1])

  // ========== 加载/保存（业务功能分析） ==========
  const loadBusiness = useCallback(async () => {
    if (!selectedCampus || !yearNumber) { message.warning('请选择神殿/年份'); return }
    try {
      const res = await fetch(`${buildApiUrl('/teaching-quality/employee-function-business')}?campus=${encodeURIComponent(selectedCampus)}&year=${yearNumber}`)
      if (!res.ok) throw new Error(await res.text())
      const data: BusinessListAPI = await res.json()

      const rowMap = new Map<string, EmployeeFunctionAnalysisRecord>()
      if (data.行列表 && data.行列表.length > 0) {
        data.行列表.forEach((r) => {
          const name = (r.员工姓名 || '').trim()
          const month = Number(r.月份 || 0)
          if (!name || !month) return
          const key = buildBusinessRowKey(month, name)
          rowMap.set(key, {
            key,
            month,
            employeeName: name,
            classLoad: Number(r.带班量 || 0),
            classStudentCount: Number(r.带班人数 || 0),
            dormitoryLoad: Number(r.带宿舍量 || 0),
            dormitoryStudentCount: Number(r.带宿舍人数 || 0),
            averageAttendanceRate: Number(r.学生平均出勤率 || 0),
            dailyInterviewRate: Number(r.日常访谈率 || 0),
            parentInterviewRate: Number(r.家长访谈率 || 0),
            qualityClassCount: Number(r.素质课次数 || 0),
            activityOrganizationCount: Number(r.活动组织次数 || 0),
            employmentRate: Number(r.就业率 || 0),
            averageEmploymentSalary: Number(r.就业平均薪资 || 0),
            employmentCount: Number(r.就业人数 || 0),
            reputationEnrollmentCount: Number(r.口碑报名人数 || 0),
            reputationRevenue: Number(r.口碑收入 || 0),
            fluctuationCount: Number(r.异动人数 || 0),
            fluctuationRate: Number(r.异动率 || 0),
            refundCount: Number(r.退费人数 || 0),
            refundRate: Number(r.退费率 || 0),
            enrollmentRate: Number(r.升学率 || 0),
            rowType: 'data',
          })
        })
      }

      setDataSource1(buildBusinessRowsFromMap(rowMap, homeroomNamesRef.current))
      message.success('已加载：业务功能分析')
    } catch (e: any) { console.error(e); message.error('加载失败：' + (e?.message || '未知错误')) }
  }, [selectedCampus, yearNumber, homeroomNames]);

  const saveBusiness = useCallback(async () => {
    if (!selectedCampus || !yearNumber) { message.warning('请选择神殿/年份'); return }
    try {
      const rows = dataSource1.filter(r => r.rowType !== 'total')
      const payload: BusinessListAPI = {
        神殿名称: selectedCampus,
        年份: yearNumber,
        行列表: rows.map(r => ({
          月份: Number(r.month),
          员工姓名: r.employeeName,
          带班量: r.classLoad,
          带班人数: r.classStudentCount,
          带宿舍量: r.dormitoryLoad,
          带宿舍人数: r.dormitoryStudentCount,
          学生平均出勤率: r.averageAttendanceRate,
          日常访谈率: r.dailyInterviewRate,
          家长访谈率: r.parentInterviewRate,
          素质课次数: r.qualityClassCount,
          活动组织次数: r.activityOrganizationCount,
          就业率: r.employmentRate,
          就业平均薪资: r.averageEmploymentSalary,
          就业人数: r.employmentCount,
          口碑报名人数: r.reputationEnrollmentCount,
          口碑收入: r.reputationRevenue,
          异动人数: r.fluctuationCount,
          异动率: r.fluctuationRate,
          退费人数: r.refundCount,
          退费率: r.refundRate,
          升学率: r.enrollmentRate,
        }))
      }
      const res = await fetch(buildApiUrl('/teaching-quality/employee-function-business'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error(await res.text())
      await loadBusiness()
      message.success('保存成功：业务功能分析')
    } catch (e: any) { console.error(e); message.error('保存失败：' + (e?.message || '未知错误')) }
  }, [selectedCampus, yearNumber, dataSource1, loadBusiness]);

  // ========== 加载每日数据 ==========
  const loadDailyData = useCallback(async () => {
    if (!selectedCampus || !selectedDate) { 
      message.warning('请选择神殿和日期')
      return 
    }
    setDailyLoading(true)
    try {
      const dateStr = selectedDate.format('YYYY-MM-DD')
      const res = await fetch(`${buildApiUrl('/teaching-quality/employee-function-business-daily')}?campus=${encodeURIComponent(selectedCampus)}&date=${dateStr}`)
      if (!res.ok) throw new Error(await res.text())
      const data: DailyBusinessListAPI = await res.json()
      
      const rows: DailyBusinessRecord[] = (data.行列表 || []).map((r, idx) => ({
        key: `${r.日期}-${r.员工姓名}-${idx}`,
        date: r.日期,
        employeeName: r.员工姓名,
        presentCount: r.出勤人数 ?? null,
        totalCount: r.应出勤人数 ?? null,
        attendanceRate: r.出勤率 ?? null,
        studentInterviewCount: r.学员访谈人数 ?? null,
        parentInterviewCount: r.家长访谈人数 ?? null,
        qualityClassCount: r.素质课次数 ?? null,
        activityCount: r.活动组织次数 ?? null,
      }))
      
      setDailyData(rows)
      message.success(`已加载 ${dateStr} 的每日数据`)
    } catch (e: any) { 
      console.error(e)
      message.error('加载每日数据失败：' + (e?.message || '未知错误')) 
      setDailyData([])
    } finally {
      setDailyLoading(false)
    }
  }, [selectedCampus, selectedDate])

  // 切换到每日视图时自动加载数据
  useEffect(() => {
    if (viewMode === 'daily' && selectedCampus && selectedDate && activeTab === 'business') {
      loadDailyData()
    }
  }, [viewMode, selectedCampus, selectedDate, activeTab])

  // ========== 加载/保存（功能分析） ==========
  const loadFunction = useCallback(async () => {
    if (!selectedCampus || !yearNumber) { message.warning('请选择神殿/年份'); return }
    try {
      const res = await fetch(`${buildApiUrl('/teaching-quality/employee-function-ability')}?campus=${encodeURIComponent(selectedCampus)}&year=${yearNumber}`)
      if (!res.ok) throw new Error(await res.text())
      const data: FunctionListAPI = await res.json()

      // 优先使用后端数据，其次使用配置中心班主任列表，最后使用空数组
      const emps = data.员工列表 && data.员工列表.length > 0 ? data.员工列表 : (homeroomNames.length > 0 ? homeroomNames : [])
      setEmployees2(emps)

      let rows: TeacherFunctionAnalysisRecord[]
      const template = buildDefaultFunctionRows()
      if (!data.行列表 || data.行列表.length === 0) {
        rows = template.map(r => {
          if (r.rowType === 'data') {
            const copy: any = { ...r }
            emps.forEach(emp => { copy[emp] = 0 })
            return copy
          }
          return r
        })
      } else {
        const sorted = data.行列表.sort((a, b) => a.序号 - b.序号)
        rows = template
          .filter(t => t.rowType === 'data')
          .map((t) => {
            const src = sorted.find(s => s.序号 === t.serialNumber)
            const rec: any = {
              key: String(t.serialNumber),
              serialNumber: t.serialNumber,
              category: t.category,
              functionItem: t.functionItem,
              detailedRequirement: t.detailedRequirement,
              fullScore: t.fullScore,
              rowType: 'data',
            }
            emps.forEach(emp => { rec[emp] = Number(((src && src.员工得分) ? src.员工得分[emp] : 0) || 0) })
            return rec as TeacherFunctionAnalysisRecord
          })
      }

      // 仅保留数据行（合计行由渲染阶段计算追加）
      rows = rows.filter(r => r.rowType !== 'total')

      setDataSource2(rows)
      message.success('已加载：功能分析')
    } catch (e: any) { console.error(e); message.error('加载失败：' + (e?.message || '未知错误')) }
  }, [selectedCampus, yearNumber, homeroomNames]);

  const saveFunction = useCallback(async () => {
    if (!selectedCampus || !yearNumber) { message.warning('请选择神殿/年份'); return }
    try {
      const rows = dataSource2.filter(r => r.rowType !== 'total')
      const payload: FunctionListAPI = {
        神殿名称: selectedCampus,
        年份: yearNumber,
        员工列表: employees2,
        行列表: rows.map((r: any) => ({
          序号: r.serialNumber,
          类别: r.category,
          功能项目: r.functionItem,
          详细要求: r.detailedRequirement,
          满分: r.fullScore,
          员工得分: employees2.reduce<Record<string, number | null>>((acc, emp) => { acc[emp] = Number(r[emp] ?? 0); return acc }, {})
        }))
      }
      const res = await fetch(buildApiUrl('/teaching-quality/employee-function-ability'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) throw new Error(await res.text())
      await loadFunction()
      message.success('保存成功：功能分析')
    } catch (e: any) { console.error(e); message.error('保存失败：' + (e?.message || '未知错误')) }
  }, [selectedCampus, yearNumber, dataSource2, employees2, loadFunction]);

  // 自动加载（切换神殿/年份/标签）
  useEffect(() => {
    if (activeTab === 'business' && selectedCampus) {
      loadBusiness()
    }
  }, [activeTab, selectedCampus, yearNumber])
  useEffect(() => { if (activeTab === 'function' && selectedCampus) loadFunction() }, [activeTab, selectedCampus, yearNumber])

  // 当配置中心班主任名单加载完成后，补齐业务表可编辑行
  useEffect(() => {
    if (activeTab !== 'business') return
    if (!selectedCampus) return
    if (!homeroomNames.length) return

    setDataSource1((prev) => {
      const rowMap = new Map<string, EmployeeFunctionAnalysisRecord>()
      prev
        .filter((row) => row.rowType === 'data')
        .forEach((row) => {
          const key = buildBusinessRowKey(Number(row.month), row.employeeName)
          rowMap.set(key, row)
        })
      return buildBusinessRowsFromMap(rowMap, homeroomNames)
    })
  }, [homeroomNames, activeTab, selectedCampus])

  // 表头样式（仅随 Tab 改变而改变）
  const tableHeaderComponents = useMemo(() => {
    const style: React.CSSProperties = { backgroundColor: activeTab === 'function' ? '#fffacd' : '#f0ffe0', fontWeight: 'bold', textAlign: 'center' }
    return {
      header: {
        cell: (props: any) => <th {...{ ...props, style: { ...props.style, ...style } }} />,
      },
    }
  }, [activeTab])

  // ===== 表格列（业务功能分析，可编辑） =====
  const businessColumns: ColumnsType<EmployeeFunctionAnalysisRecord> = useMemo(() => {
    const renderTotal = (value: number) => <span style={{ fontWeight: 'bold' }}>{value}</span>;

    const monthCol = {
      title: '月份', dataIndex: 'month', key: 'month', width: 80, fixed: 'left' as const, align: 'center' as const,
      render: (value: any, record: any) => record.rowType === 'total'
        ? { children: <span style={{ color: 'red', fontWeight: 'bold' }}>合计/平均</span>, props: { rowSpan: 1 } }
        : { children: value, props: { rowSpan: (record as any)._rowSpan || 0 } },
      shouldCellUpdate: (record: any, prev: any) => record.month !== prev.month || (record as any)._rowSpan !== (prev as any)._rowSpan || record.rowType !== prev.rowType,
    } as const

    const nameCol = {
      title: '姓名', dataIndex: 'employeeName', key: 'employeeName', width: 120, fixed: 'left' as const, align: 'center' as const,
      render: (value: any, record: any) =>
        record.rowType === 'total'
          ? ''
          : <BusinessNameCell recordKey={record.key} value={value} options={homeroomNames} />,
      shouldCellUpdate: (record: any, prev: any) => record.employeeName !== prev.employeeName || record.key !== prev.key || record.rowType !== prev.rowType,
    } as const

    const num = (title: string, field: keyof EmployeeFunctionAnalysisRecord, width = 100, editable = true) => ({
      title, dataIndex: field as string, key: String(field), width, align: 'center' as const,
      render: (value: number, record: any) => record.rowType === 'total' ? renderTotal(value) : <BusinessNumberCell recordKey={record.key} field={field} value={value as number} disabled={!editable} />,
      shouldCellUpdate: (record: any, prev: any) => record[field] !== prev[field] || record.rowType !== prev.rowType,
    })

    return [
      monthCol,
      nameCol,
      num('带班量', 'classLoad', 100, false),
      num('带班人数', 'classStudentCount', 100, false),
      num('带宿舍量', 'dormitoryLoad', 100, false),
      num('带宿舍人数', 'dormitoryStudentCount', 100, false),
      num('学生平均出勤率', 'averageAttendanceRate', 120, false),
      num('日常访谈率', 'dailyInterviewRate', 100, false),
      num('家长访谈率', 'parentInterviewRate', 100, false),
      num('素质课次数', 'qualityClassCount', 100, false),
      num('活动组织次数', 'activityOrganizationCount', 120, false),
      num('就业率', 'employmentRate', 100, false),
      num('就业平均薪资', 'averageEmploymentSalary', 120, false),
      num('就业人数', 'employmentCount', 100, false),
      num('口碑报名人数', 'reputationEnrollmentCount', 120, false),
      num('口碑收入', 'reputationRevenue', 100, false),
      num('异动人数', 'fluctuationCount', 100, false),
      num('异动率', 'fluctuationRate', 100, false),
      num('退费人数', 'refundCount', 100, false),
      num('退费率', 'refundRate', 100, false),
      num('升学率', 'enrollmentRate', 100, false),
    ] as ColumnsType<EmployeeFunctionAnalysisRecord>
  }, [homeroomNames]);



  const functionColumns: ColumnsType<TeacherFunctionAnalysisRecord> = useMemo(() => [
    { title: '序号', dataIndex: 'serialNumber', key: 'serialNumber', width: 80, align: 'center', render: (v, r: any) => r.rowType === 'total' ? <span style={{ fontWeight: 'bold' }}>合计</span> : v, shouldCellUpdate: (record: any, prev: any) => record.serialNumber !== prev.serialNumber || record.rowType !== prev.rowType },
    { title: '类别', dataIndex: 'category', key: 'category', width: 150, align: 'center', render: (v, r: any) => r.rowType === 'total' ? '' : ({ children: v, props: { rowSpan: (r as any)._categoryRowSpan } }), shouldCellUpdate: (record: any, prev: any) => record.category !== prev.category || (record as any)._categoryRowSpan !== (prev as any)._categoryRowSpan || record.rowType !== prev.rowType },
    { title: '功能项目', dataIndex: 'functionItem', key: 'functionItem', width: 150, align: 'center', render: (v, r) => r.rowType === 'total' ? <span style={{ fontWeight: 'bold' }}>{v}</span> : v, shouldCellUpdate: (record: any, prev: any) => record.functionItem !== prev.functionItem || record.rowType !== prev.rowType },
    { title: '详细要求', dataIndex: 'detailedRequirement', key: 'detailedRequirement', width: 520, align: 'left', render: (v, r) => r.rowType === 'total' ? '' : (<div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{v}</div>), shouldCellUpdate: (record: any, prev: any) => record.detailedRequirement !== prev.detailedRequirement || record.rowType !== prev.rowType },
    { title: '满分', dataIndex: 'fullScore', key: 'fullScore', width: 100, align: 'center', render: (v, r) => r.rowType === 'total' ? <span style={{ fontWeight: 'bold' }}>{v}</span> : v, shouldCellUpdate: (record: any, prev: any) => record.fullScore !== prev.fullScore || record.rowType !== prev.rowType },
    ...employees2.map((emp) => ({
        title: emp, dataIndex: emp, key: emp, width: 100, align: 'center' as const,
        render: (value: number, record: any) => {
            if (record.rowType === 'total') {
                return <span style={{ fontWeight: 'bold' }}>{value}</span>;
            }
            return <FunctionNumberCell recordKey={record.key} employeeName={emp} value={value} />;
        },
        shouldCellUpdate: (record: any, prev: any) => (record as any)[emp] !== (prev as any)[emp] || record.rowType !== prev.rowType,
    }))
], [employees2]);

  // ===== 每日数据表格列定义 =====
  const dailyColumns: ColumnsType<DailyBusinessRecord> = useMemo(() => [
    { 
      title: '姓名', 
      dataIndex: 'employeeName', 
      key: 'employeeName', 
      width: 120, 
      fixed: 'left' as const, 
      align: 'center' as const,
    },
    { 
      title: '出勤人数', 
      dataIndex: 'presentCount', 
      key: 'presentCount', 
      width: 100, 
      align: 'center' as const,
      render: (v: number | null) => v !== null ? v : '-',
    },
    { 
      title: '应出勤人数', 
      dataIndex: 'totalCount', 
      key: 'totalCount', 
      width: 110, 
      align: 'center' as const,
      render: (v: number | null) => v !== null ? v : '-',
    },
    { 
      title: '出勤率(%)', 
      dataIndex: 'attendanceRate', 
      key: 'attendanceRate', 
      width: 100, 
      align: 'center' as const,
      render: (v: number | null) => v !== null ? `${v.toFixed(2)}%` : '-',
    },
    { 
      title: '学员访谈人数', 
      dataIndex: 'studentInterviewCount', 
      key: 'studentInterviewCount', 
      width: 120, 
      align: 'center' as const,
      render: (v: number | null) => v !== null ? v : '-',
    },
    { 
      title: '家长访谈人数', 
      dataIndex: 'parentInterviewCount', 
      key: 'parentInterviewCount', 
      width: 120, 
      align: 'center' as const,
      render: (v: number | null) => v !== null ? v : '-',
    },
    { 
      title: '素质课次数', 
      dataIndex: 'qualityClassCount', 
      key: 'qualityClassCount', 
      width: 100, 
      align: 'center' as const,
      render: (v: number | null) => v !== null ? v : '-',
    },
    { 
      title: '活动组织次数', 
      dataIndex: 'activityCount', 
      key: 'activityCount', 
      width: 120, 
      align: 'center' as const,
      render: (v: number | null) => v !== null ? v : '-',
    },
  ], []);

  // 每日数据过滤（按班主任筛选）
  const dailyDataForRender = useMemo(() => {
    if (!selectedHomeroom) return dailyData
    return dailyData.filter(row => row.employeeName === selectedHomeroom)
  }, [dailyData, selectedHomeroom])

  // 业务/功能 两套数据供渲染（避免联合类型冲突）
  const businessDataForRender = useMemo(() => {
    const dataRows = dataSource1.filter(
      (row) =>
        row.rowType === 'data' &&
        (!selectedHomeroom || row.employeeName === selectedHomeroom),
    )
    const totalRow = buildTotalBusinessRow()
    if (dataRows.length > 0) {
      const totals = dataRows.reduce(
        (acc, item) => ({
          classLoad: acc.classLoad + item.classLoad,
          classStudentCount: acc.classStudentCount + item.classStudentCount,
          dormitoryLoad: acc.dormitoryLoad + item.dormitoryLoad,
          dormitoryStudentCount: acc.dormitoryStudentCount + item.dormitoryStudentCount,
          qualityClassCount: acc.qualityClassCount + item.qualityClassCount,
          activityOrganizationCount: acc.activityOrganizationCount + item.activityOrganizationCount,
          employmentCount: acc.employmentCount + item.employmentCount,
          reputationEnrollmentCount: acc.reputationEnrollmentCount + item.reputationEnrollmentCount,
          reputationRevenue: acc.reputationRevenue + item.reputationRevenue,
          fluctuationCount: acc.fluctuationCount + item.fluctuationCount,
          refundCount: acc.refundCount + item.refundCount,
        }),
        {
          classLoad: 0,
          classStudentCount: 0,
          dormitoryLoad: 0,
          dormitoryStudentCount: 0,
          qualityClassCount: 0,
          activityOrganizationCount: 0,
          employmentCount: 0,
          reputationEnrollmentCount: 0,
          reputationRevenue: 0,
          fluctuationCount: 0,
          refundCount: 0,
        },
      )
      const count = dataRows.length
      totalRow.averageAttendanceRate = dataRows.reduce((s, i) => s + i.averageAttendanceRate, 0) / count
      totalRow.dailyInterviewRate = dataRows.reduce((s, i) => s + i.dailyInterviewRate, 0) / count
      totalRow.parentInterviewRate = dataRows.reduce((s, i) => s + i.parentInterviewRate, 0) / count
      totalRow.employmentRate = dataRows.reduce((s, i) => s + i.employmentRate, 0) / count
      totalRow.averageEmploymentSalary = dataRows.reduce((s, i) => s + i.averageEmploymentSalary, 0) / count
      totalRow.fluctuationRate = dataRows.reduce((s, i) => s + i.fluctuationRate, 0) / count
      totalRow.refundRate = dataRows.reduce((s, i) => s + i.refundRate, 0) / count
      totalRow.enrollmentRate = dataRows.reduce((s, i) => s + i.enrollmentRate, 0) / count
      Object.assign(totalRow, totals)
    }
    const dataWithTotals = [...dataRows, totalRow]

    // 预计算 rowSpan，避免在列定义中动态计算
    const monthMap = new Map<string | number, number>()
    dataRows.forEach(row => {
      monthMap.set(row.month, (monthMap.get(row.month) || 0) + 1)
    })

    const seenMonths = new Set<string | number>()
    return dataWithTotals.map(row => {
      if (row.rowType === 'total') {
        return { ...row, _rowSpan: 1 }
      }
      if (seenMonths.has(row.month)) {
        return { ...row, _rowSpan: 0 }
      }
      seenMonths.add(row.month)
      return { ...row, _rowSpan: monthMap.get(row.month) || 1 }
    })
  }, [dataSource1, selectedHomeroom])

  const functionDataForRender = useMemo(() => {
    const dataRows = dataSource2.filter(i => i.rowType === 'data')
    const total: any = { key: 'total', serialNumber: 0, category: '', functionItem: '合计', detailedRequirement: '', fullScore: 100, rowType: 'total' }
    employees2.forEach(emp => { total[emp] = dataRows.reduce((s, r) => s + Number((r as any)[emp] || 0), 0) })
    return [...dataRows, total]
  }, [dataSource2, employees2])

  // 顶部工具栏（神殿由全局顶部选择决定）
  const renderToolbar = (onSave: ()=>void, onLoad: ()=>void, leftExtra?: React.ReactNode, rightExtra?: React.ReactNode) => (
    <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
        <span>年份：</span>
        <DatePicker
          picker="year"
          value={selectedYear}
          onChange={(d)=> d && setSelectedYear(d)}
          style={{ width: 140 }}
        />
        {leftExtra}
        </Space>
        <Space>
        {rightExtra}
        <Button icon={<SaveOutlined />} type="primary" onClick={onSave}>保存</Button>
        <Button icon={<ReloadOutlined />} onClick={onLoad}>加载</Button>
        <Button icon={<DownloadOutlined />} onClick={()=> message.info('导出功能开发中...')}>导出</Button>
        </Space>
      </div>
  )

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24, textAlign: 'center', fontSize: '20px', fontWeight: 'bold', padding: '16px', backgroundColor: '#fff1f0', borderRadius: 4, border: '1px solid #ffccc7' }}>
        {selectedCampus || currentCampus || '神殿'}教化司员工功能分析表
      </div>

      <Card>
        <TableContext.Provider value={ctxValue}>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            destroyInactiveTabPane
            items={[
              {
                key: 'business',
                label: '班主任业务功能分析表',
                children: (
                  <>
                    {/* 视图切换和工具栏 */}
                    <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Space>
                        <Radio.Group 
                          value={viewMode} 
                          onChange={(e) => setViewMode(e.target.value)}
                          buttonStyle="solid"
                        >
                          <Radio.Button value="monthly">
                            <UnorderedListOutlined /> 月度汇总
                          </Radio.Button>
                          <Radio.Button value="daily">
                            <CalendarOutlined /> 每日数据
                          </Radio.Button>
                        </Radio.Group>
                        
                        {viewMode === 'monthly' ? (
                          <>
                            <span style={{ marginLeft: 16 }}>年份：</span>
                            <DatePicker
                              picker="year"
                              value={selectedYear}
                              onChange={(d) => d && setSelectedYear(d)}
                              style={{ width: 140 }}
                            />
                          </>
                        ) : (
                          <>
                            <span style={{ marginLeft: 16 }}>日期：</span>
                            <DatePicker
                              value={selectedDate}
                              onChange={(d) => d && setSelectedDate(d)}
                              style={{ width: 160 }}
                              format="YYYY-MM-DD"
                            />
                          </>
                        )}
                        
                        <span style={{ marginLeft: 16 }}>班主任：</span>
                        <Select
                          allowClear
                          placeholder="选择班主任"
                          value={selectedHomeroom || undefined}
                          onChange={(value) => setSelectedHomeroom(value)}
                          style={{ width: 200 }}
                          options={homeroomFilterOptions}
                          showSearch
                          filterOption={(input, option) => (option?.label as string).includes(input)}
                        />
                      </Space>
                      <Space>
                        {viewMode === 'monthly' ? (
                          <>
                            <Button icon={<SaveOutlined />} type="primary" onClick={saveBusiness}>保存</Button>
                            <Button icon={<ReloadOutlined />} onClick={loadBusiness}>加载</Button>
                          </>
                        ) : (
                          <Button icon={<ReloadOutlined />} onClick={loadDailyData} loading={dailyLoading}>刷新</Button>
                        )}
                        <Button icon={<DownloadOutlined />} onClick={() => message.info('导出功能开发中...')}>导出</Button>
                      </Space>
                    </div>
                    
                    {/* 根据视图模式显示不同表格 */}
                    {viewMode === 'monthly' ? (
                      <Table<EmployeeFunctionAnalysisRecord>
                        columns={businessColumns}
                        dataSource={businessDataForRender}
                        pagination={false}
                        scroll={{ x: 'max-content' }}
                        sticky={{ getContainer: () => window, offsetHeader: 0 }}
                        bordered
                        size="small"
                        rowKey="key"
                        components={tableHeaderComponents}
                      />
                    ) : (
                      <Spin spinning={dailyLoading}>
                        <Table<DailyBusinessRecord>
                          columns={dailyColumns}
                          dataSource={dailyDataForRender}
                          pagination={false}
                          scroll={{ x: 'max-content' }}
                          bordered
                          size="small"
                          rowKey="key"
                          components={tableHeaderComponents}
                          locale={{ emptyText: selectedDate ? '当日暂无数据' : '请选择日期' }}
                        />
                        {dailyDataForRender.length > 0 && (
                          <div style={{ marginTop: 16, padding: 12, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
                            <Space size="large">
                              <span><strong>当日汇总：</strong></span>
                              <span>出勤人数：{dailyDataForRender.reduce((s, r) => s + (r.presentCount || 0), 0)}</span>
                              <span>应出勤人数：{dailyDataForRender.reduce((s, r) => s + (r.totalCount || 0), 0)}</span>
                              <span>学员访谈：{dailyDataForRender.reduce((s, r) => s + (r.studentInterviewCount || 0), 0)} 人</span>
                              <span>家长访谈：{dailyDataForRender.reduce((s, r) => s + (r.parentInterviewCount || 0), 0)} 人</span>
                              <span>素质课：{dailyDataForRender.reduce((s, r) => s + (r.qualityClassCount || 0), 0)} 次</span>
                              <span>活动组织：{dailyDataForRender.reduce((s, r) => s + (r.activityCount || 0), 0)} 次</span>
                            </Space>
                          </div>
                        )}
                      </Spin>
                    )}
                  </>
                ),
              },
              {
                key: 'function',
                label: '班主任功能分析表',
                children: (
                  <>
                    {renderToolbar(saveFunction, loadFunction, undefined, (
                      <Button onClick={()=>{ setEditingEmployees([...employees2]); setSelectedTeacher(undefined); setManageEmpOpen(true); }}>人员设置</Button>
                    ))}
                    <Table<TeacherFunctionAnalysisRecord>
                      columns={functionColumns}
                      dataSource={functionDataForRender}
                      pagination={false}
                      scroll={{ x: 'max-content' }}
                      bordered
                      size="small"
                      rowKey="key"
                      components={tableHeaderComponents}
                    />
                  </>
                ),
              },
            ]}
          />
        </TableContext.Provider>
      </Card>

      {/* 人员设置（功能分析表 - 动态列名可编辑/新增/删除） */}
      <Modal
        title="功能分析人员设置"
        open={manageEmpOpen}
        onOk={() => {
          const newList = Array.from(new Set(editingEmployees.map(s => s.trim()).filter(Boolean)))
          if (newList.length === 0) { message.warning('至少保留一位人员'); return }
          const oldList = employees2
          // 同步数据行的列
          setDataSource2(prev => prev.filter(r => r.rowType === 'data').map(r => {
            const rec: any = { ...r }
            // 清除旧列
            oldList.forEach(emp => { delete rec[emp] })
            // 迁移同名或新增列，默认0分
            newList.forEach(emp => { rec[emp] = Number((r as any)[emp] || 0) })
            return rec
          }))
          setEmployees2(newList)
          setManageEmpOpen(false)
          setSelectedTeacher(undefined)
          message.success('人员设置已更新')
        }}
        onCancel={() => {
          setManageEmpOpen(false)
          setSelectedTeacher(undefined)
        }}
        okText="保存"
        cancelText="取消"
      >
        <div>
          <Space style={{ marginBottom: 12 }}>
            <Select
              showSearch
              value={selectedTeacher}
              placeholder="从教员列表选择"
              style={{ width: 220 }}
              options={teacherNames.map((name) => ({ label: name, value: name }))}
              onChange={(value) => setSelectedTeacher(value)}
              filterOption={(input, option) => (option?.label as string).includes(input)}
            />
            <Button
              onClick={() => {
                if (!selectedTeacher) {
                  message.warning('请选择教员')
                  return
                }
                setEditingEmployees((prev) =>
                  prev.includes(selectedTeacher) ? prev : [...prev, selectedTeacher],
                )
                setSelectedTeacher(undefined)
              }}
              disabled={teacherNames.length === 0}
            >
              添加教员
            </Button>
          </Space>
          {editingEmployees.map((name, idx) => (
            <Space key={idx} style={{ marginBottom: 8 }}>
              <Input
                value={name}
                onChange={(e)=> setEditingEmployees(prev => prev.map((n,i)=> i===idx ? e.target.value : n))}
                placeholder={`人员${idx+1}姓名`}
                style={{ width: 220 }}
              />
              <Button danger onClick={()=> setEditingEmployees(prev => prev.filter((_,i)=> i!==idx))}>删除</Button>
            </Space>
          ))}
          <div>
            <Button type="dashed" icon={<PlusOutlined />} onClick={()=> setEditingEmployees(prev => [...prev, ''])}>新增人员</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default CampusEmployeeFunctionAnalysisPage
