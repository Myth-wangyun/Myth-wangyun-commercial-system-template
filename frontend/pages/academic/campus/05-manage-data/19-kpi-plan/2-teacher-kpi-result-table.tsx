// 学术->学术经理->管理表格 教员KPI考核结果表
import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import type { ColumnsType } from 'antd/es/table'
import { App,
  Card,
  Table,
  Typography,
  Space,
  Select,
  Button,
  Drawer,
  Form,
  InputNumber,
  Input,
  Modal,
  Alert,
} from 'antd'
import { FileExcelOutlined, CopyOutlined } from '@ant-design/icons'
import type { KpiTeacher } from '@/services/kpiTeachers'
import { fetchKpiTeachers } from '@/services/kpiTeachers'
import { fetchKpiTemplates, fetchKpiResults, saveKpiResults } from '@/services/kpiResults'
import type { KpiTemplate, KpiResultEntry, KpiResultRow } from '@/services/kpiResults'
import { useCampusStore } from '@/stores/campusStore'
import * as XLSX from 'xlsx'

const { Title, Text } = Typography
const { Option } = Select
const { TextArea } = Input

type NullableNumber = number | null

interface KPIRow {
  templateId?: number | null
  indicator: string
  formula?: string | null
  dataSource?: string | null
  weight: NullableNumber
  score: NullableNumber
  kpiValue: NullableNumber
  orderIndex?: number | null
}

interface PersonConfig {
  teacherId?: number
  role: string
  name: string
  rows: KPIRow[]
}

type SectionType = 'header' | 'detail' | 'summary'

interface FlatRow {
  key: string
  role: string
  name: string
  indicator: string
  formula: string
  source: string
  weight: NullableNumber
  score: NullableNumber
  kpiValue: NullableNumber
  section: SectionType
  personIndex?: number
  rowIndex?: number
}

type EditFormValues = {
  weight: NullableNumber
  score: NullableNumber
  /** 自动计算：kpiValue = score * weight / 100 */
  kpiValue: NullableNumber
}

type Props = { 
  year: number
  month: number
  selectedTeacher?: string
  canViewOthers?: boolean
}

const FALLBACK_TEMPLATE_ROWS: KPIRow[] = [
  ['部门业绩目标完成率', '（2*部门业绩目标完成率+0.8）/0.3（目标40000元）', '神藏司', 15],
  ['学生就业率', '10*目标就业学生数/实际就业学生数（目标18人）', '就业部', 15],
  ['就业薪资', '10*就业学员的平均就业薪资/就业薪资基数（目标7000元）', '就业部', 15],
  ['教学测评', '10*考试合格率', '教化司', 15],
  ['新生流失率', '10-2*新生入班流失数', '咨询助理', null],
  ['老生流失率', '10-2*所带老班学员流失数', '咨询助理', 10],
  ['学员满意度', '10*学员满意度', '教化司', 10],
  ['学员管理', '6*（违纪情况排名－教员数量）/（1－教员数量）+4', '教化司', null],
  ['作业提交率', '10*作业提交率', '学术经理', 10],
  ['作业合格率', '10*作业合格率', '学术经理', null],
  ['工作完成率', '实际完成工作数量/应完成工作数量', '学术经理', null],
  ['朋友圈转发', '朋友圈实际转发60条', '咨询助理', null],
  ['口碑信息提供', '提供两个口碑信息', '咨询助理', null],
  ['口碑报名', '产生一个口碑报名', '神藏司', null],
  ['招聘达标率', '招聘1名云计算方向老师', '学术经理', null],
  ['岗位胜任度', '上级领导评价', '学术经理', 10],
].map(([indicator, formula, source, weight], index) => ({
  indicator,
  formula,
  dataSource: source,
  weight: weight ?? null,
  score: null,
  kpiValue: null,
  orderIndex: index,
})) as KPIRow[]

const buildTemplateRows = (templates: KpiTemplate[]): KPIRow[] => {
  if (!templates.length) {
    return FALLBACK_TEMPLATE_ROWS.map((row) => ({ ...row }))
  }
  return templates
    .slice()
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((tpl) => ({
      templateId: tpl.id,
      indicator: tpl.indicator,
      formula: tpl.formula || '',
      dataSource: tpl.dataSource || '',
      weight: tpl.defaultWeight ?? null,
      score: null,
      kpiValue: null,
      orderIndex: tpl.orderIndex,
    }))
}

const mergeRowsWithResult = (templates: KPIRow[], entry?: KpiResultEntry): KPIRow[] => {
  // 兼容后端字段命名不一致：kpiValue vs kpi_value, orderIndex vs order_index 等
  const normalizeResultRow = (row: any): KpiResultRow => ({
    templateId: row?.templateId ?? row?.template_id ?? null,
    indicator: row?.indicator,
    formula: row?.formula ?? null,
    dataSource: row?.dataSource ?? row?.data_source ?? null,
    weight: row?.weight ?? null,
    score: row?.score ?? null,
    kpiValue: row?.kpiValue ?? row?.kpi_value ?? null,
    orderIndex: row?.orderIndex ?? row?.order_index ?? null,
  })

  if (!entry) {
    return templates.map((row) => ({ ...row }))
  }
  const rows = (entry.rows || []).map((r: any) => normalizeResultRow(r))
  const mapByTemplate = new Map<number, KpiResultRow>()
  const mapByIndicator = new Map<string, KpiResultRow>()
  rows.forEach((row) => {
    if (row.templateId) {
      mapByTemplate.set(row.templateId, row)
    }
    mapByIndicator.set(row.indicator, row)
  })
  const merged = templates.map((tpl, idx) => {
    const match =
      (tpl.templateId && mapByTemplate.get(tpl.templateId)) ||
      mapByIndicator.get(tpl.indicator)
    if (match) {
      return {
        templateId: match.templateId ?? tpl.templateId,
        indicator: match.indicator || tpl.indicator,
        formula: match.formula ?? tpl.formula,
        dataSource: match.dataSource ?? tpl.dataSource,
        weight: match.weight ?? tpl.weight ?? null,
        score: match.score ?? null,
        kpiValue: match.kpiValue ?? null,
        orderIndex: match.orderIndex ?? tpl.orderIndex ?? idx,
      }
    }
    return { ...tpl }
  })
  rows.forEach((row) => {
    const exists = merged.some((tpl) => tpl.indicator === row.indicator)
    if (!exists) {
      merged.push({
        templateId: row.templateId ?? null,
        indicator: row.indicator,
        formula: row.formula || '',
        dataSource: row.dataSource || '',
        weight: row.weight ?? null,
        score: row.score ?? null,
        kpiValue: row.kpiValue ?? null,
        orderIndex: row.orderIndex ?? merged.length,
      })
    }
  })
  return merged
}

const buildPersonConfigs = (
  teachers: KpiTeacher[],
  templateRows: KPIRow[],
  resultEntries: KpiResultEntry[],
): PersonConfig[] => {
  const entryMap = new Map<string, KpiResultEntry>()
  resultEntries.forEach((entry) => {
    const key = String(entry.teacherId ?? entry.teacherName)
    entryMap.set(key, entry)
  })
  const persons = teachers.map((teacher) => {
    const key = String(teacher.id ?? teacher.name)
    const mergedRows = mergeRowsWithResult(templateRows, entryMap.get(key))
    return {
      teacherId: teacher.id,
      role: teacher.role || '教员',
      name: teacher.name,
      rows: mergedRows,
    }
  })
  resultEntries.forEach((entry) => {
    const exists = persons.some(
      (person) =>
        (person.teacherId || person.name) === (entry.teacherId || entry.teacherName),
    )
    if (!exists) {
      persons.push({
        teacherId: entry.teacherId ?? undefined,
        role: entry.role || '教员',
        name: entry.teacherName,
        rows: mergeRowsWithResult(templateRows, entry),
      })
    }
  })
  return persons
}

const TeacherKpiTablePage: React.FC<Props> = ({ year, month, selectedTeacher, canViewOthers = true }) => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore()
  const campusName = currentCampus || '主神殿'
  const [data, setData] = useState<PersonConfig[]>([])
  const [selectedName, setSelectedName] = useState<'all' | string>('all')
  const [teacherOptions, setTeacherOptions] = useState<KpiTeacher[]>([])
  const [editTarget, setEditTarget] = useState<{ personIndex: number; rowIndex: number } | null>(
    null,
  )
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form] = Form.useForm<EditFormValues>()
  
  // Excel导入和剪贴板粘贴相关状态
  const [importModalVisible, setImportModalVisible] = useState(false)
  const [importType, setImportType] = useState<'excel' | 'paste'>('excel')
  const [pasteText, setPasteText] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 如果只能查看自己，自动设置selectedName
  useEffect(() => {
    if (!canViewOthers && selectedTeacher) {
      setSelectedName(selectedTeacher)
    }
  }, [canViewOthers, selectedTeacher])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [teacherRes, templateList, resultRes] = await Promise.all([
        fetchKpiTeachers(campusName),
        fetchKpiTemplates(),
        fetchKpiResults({ campus: campusName, year, month }),
      ])
      let teachers = teacherRes.teachers || []
      
      // 如果只能查看自己，过滤教员列表只包含自己
      if (!canViewOthers && selectedTeacher) {
        teachers = teachers.filter(t => t.name === selectedTeacher)
      }
      
      setTeacherOptions(teachers)
      const baseTemplates = buildTemplateRows(templateList)
      const entries = resultRes.entries || []
      
      // 如果只能查看自己，过滤数据
      let filteredEntries = entries
      if (!canViewOthers && selectedTeacher) {
        filteredEntries = entries.filter((entry: any) => entry.teacher_name === selectedTeacher || entry.teacherName === selectedTeacher)
      }
      
      setData(buildPersonConfigs(teachers, baseTemplates, filteredEntries))
    } catch (error: any) {
      console.error('加载KPI数据失败', error)
      
      // 如果是权限错误，显示友好提示
      if (error?.response?.status === 403) {
        const errorMsg = error?.response?.data?.detail || '您没有权限访问此数据'
        message.error(errorMsg)
      } else {
        message.error('加载KPI数据失败')
      }
      
      const fallbackTemplates = buildTemplateRows([])
      setData(buildPersonConfigs([], fallbackTemplates, []))
    } finally {
      setLoading(false)
    }
  }, [campusName, year, month, selectedTeacher, canViewOthers])

  useEffect(() => {
    loadData()
  }, [loadData])

  const calcRowKpiValue = (
    _weight: NullableNumber,
    _score: NullableNumber,
    existing: NullableNumber,
  ): NullableNumber => {
    // KPI值必须以数据库返回为准（不做前端兜底计算）
    return existing ?? null
  }

  const flatRows = useMemo<FlatRow[]>(() => {
    // 如果只能查看自己，强制设置selectedName为当前教员
    const effectiveSelectedName = !canViewOthers && selectedTeacher ? selectedTeacher : selectedName
    
    const filtered =
      effectiveSelectedName === 'all' ? data : data.filter((item) => item.name === effectiveSelectedName)
    const rows: FlatRow[] = []

    filtered.forEach((person, personIndex) => {
      rows.push({
        key: `${person.role}-${person.name}-header`,
        role: person.role,
        name: person.name,
        indicator: '',
        formula: '',
        source: '',
        weight: null,
        score: null,
        kpiValue: null,
        section: 'header',
      })

      person.rows.forEach((row, rowIndex) => {
        rows.push({
          key: `${person.role}-${person.name}-detail-${rowIndex}`,
          role: person.role,
          name: person.name,
          indicator: row.indicator,
          formula: row.formula || '',
          source: row.dataSource || '',
          weight: row.weight ?? null,
          score: row.score ?? null,
          kpiValue: calcRowKpiValue(row.weight ?? null, row.score ?? null, row.kpiValue ?? null),
          section: 'detail',
          personIndex,
          rowIndex,
        })
      })

      const total = person.rows.reduce((sum, current) => sum + (current.kpiValue ?? 0), 0)

      rows.push({
        key: `${person.role}-${person.name}-summary`,
        role: person.role,
        name: person.name,
        indicator: '总计',
        formula: '',
        source: '',
        weight: null,
        score: null,
        kpiValue: Number(total.toFixed(2)),
        section: 'summary',
      })
    })

    return rows
  }, [data, selectedName, canViewOthers, selectedTeacher])

  const handleEdit = (personIndex: number, rowIndex: number) => {
    const target = data[personIndex].rows[rowIndex]
    setEditTarget({ personIndex, rowIndex })
    const weight = target.weight ?? null
    const score = target.score ?? null
    form.setFieldsValue({
      weight,
      score,
      kpiValue: calcKpiValue(weight, score),
    })
  }

  const updateInline = (
    personIndex: number,
    rowIndex: number,
    field: 'indicator' | 'formula',
    value: string,
  ) => {
    setData((prev) =>
      prev.map((person, idx) => {
        if (idx !== personIndex) return person
        const rows = person.rows.map((row, rIdx) =>
          rIdx === rowIndex
            ? {
                ...row,
                [field === 'indicator' ? 'indicator' : 'formula']: value,
              }
            : row,
        )
        return { ...person, rows }
      }),
    )
  }

  const calcKpiValue = (weight: NullableNumber, score: NullableNumber): NullableNumber => {
    // 仅用于编辑抽屉里自动计算展示；最终以数据库保存/读取为准

    if (weight === null || weight === undefined) return null
    if (score === null || score === undefined) return null
    const w = typeof weight === 'number' ? weight : Number(weight)
    const s = typeof score === 'number' ? score : Number(score)
    if (Number.isNaN(w) || Number.isNaN(s)) return null
    return Number(((s * w) / 100).toFixed(2))
  }

  const closeDrawer = () => {
    setEditTarget(null)
    form.resetFields()
  }

  const submitEdit = async () => {
    try {
      const values = await form.validateFields()
      if (!editTarget) return

      setData((prev) =>
        prev.map((person, idx) => {
          if (idx !== editTarget.personIndex) return person
          const rows = person.rows.map((row, rowIdx) =>
            rowIdx === editTarget.rowIndex
              ? {
                  ...row,
                  weight: values.weight ?? null,
                  score: values.score ?? null,
                  kpiValue: calcKpiValue(values.weight ?? null, values.score ?? null),
                }
              : row,
          )
          return { ...person, rows }
        }),
      )

      message.success('已更新KPI数据')
      closeDrawer()
    } catch {
      // 验证失败不处理
    }
  }

  const renderKpiCell = (value: NullableNumber, record: FlatRow, suffix = '') => {
    const highlight = record.section === 'detail'
    const formatted =
      value === null || value === undefined
        ? ''
        : typeof value === 'number'
          ? `${value.toFixed(2)}${suffix}`
          : String(value)

    return (
      <div
        style={{
          backgroundColor: highlight ? '#fff4b3' : undefined,
          padding: '4px 8px',
          textAlign: 'center',
        }}
      >
        {formatted}
      </div>
    )
  }

  const columns: ColumnsType<FlatRow> = [
    {
      title: '岗位',
      dataIndex: 'role',
      width: 120,
      align: 'center',
      render: (_value, record) => (record.section === 'header' ? record.role : ''),
    },
    {
      title: '姓名',
      dataIndex: 'name',
      width: 120,
      align: 'center',
      render: (_value, record) =>
        record.section === 'header' ? record.name : record.section === 'summary' ? '' : '',
    },
    {
      title: 'KPI指标',
      dataIndex: 'indicator',
      width: 220,
      align: 'center',
      render: (value, record) =>
        record.section === 'header' ? (
          '—'
        ) : record.section !== 'detail' ||
          record.personIndex === undefined ||
          record.rowIndex === undefined ? (
          value
        ) : (
          <Input
            value={value}
            onChange={(e) =>
              updateInline(record.personIndex!, record.rowIndex!, 'indicator', e.target.value)
            }
          />
        ),
    },
    {
      title: '计算细则',
      dataIndex: 'formula',
      width: 360,
      render: (value, record) =>
        record.section === 'header' ? (
          '—'
        ) : record.section !== 'detail' ||
          record.personIndex === undefined ||
          record.rowIndex === undefined ? (
          value || ''
        ) : (
          <Input
            value={value}
            onChange={(e) =>
              updateInline(record.personIndex!, record.rowIndex!, 'formula', e.target.value)
            }
          />
        ),
    },
    {
      title: '数据来源、考核人',
      dataIndex: 'source',
      width: 160,
      align: 'center',
      render: (value, record) => (record.section === 'header' ? '—' : value || ''),
    },
    {
      title: '权重',
      dataIndex: 'weight',
      width: 100,
      align: 'center',
      render: (value, record) =>
        record.section === 'detail' && value !== null
          ? renderKpiCell(value, record, '%')
          : record.section === 'summary'
            ? ''
            : (value ?? ''),
    },
    {
      title: '得分',
      dataIndex: 'score',
      width: 100,
      align: 'center',
      render: (value, record) =>
        record.section === 'detail' && value !== null
          ? renderKpiCell(value, record)
          : record.section === 'summary'
            ? ''
            : (value ?? ''),
    },
    {
      title: 'KPI值',
      dataIndex: 'kpiValue',
      width: 100,
      align: 'center',
      render: (value, record) =>
        record.section === 'summary' && value !== null
          ? renderKpiCell(value, record)
          : record.section === 'detail' && value !== null
            ? renderKpiCell(value, record)
            : (value ?? ''),
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 120,
      align: 'center',
      render: (_value, record) =>
        record.section === 'detail' &&
        record.personIndex !== undefined &&
        record.rowIndex !== undefined ? (
          <Button
            size="small"
            type="link"
            onClick={() => handleEdit(record.personIndex!, record.rowIndex!)}
          >
            编辑
          </Button>
        ) : null,
    },
  ]


  // 解析数值
  const parseValue = (value: any): NullableNumber => {
    if (value === null || value === undefined || value === '') return null
    if (typeof value === 'number') {
      return Number.isNaN(value) ? null : value
    }
    const str = String(value).trim()
    if (!str || str === '-' || str === '—') return null
    const num = Number(str)
    return Number.isNaN(num) ? null : num
  }

  // 从Excel数据解析KPI结果
  const parseExcelData = (excelData: any[][]): PersonConfig[] => {
    if (!excelData || excelData.length < 3) {
      throw new Error('数据格式不正确：至少需要表头行和数据行')
    }

    // 查找表头行（包含"岗位"、"姓名"、"KPI指标"等）
    let headerRowIndex = -1
    const headerMap: Record<string, number> = {}

    for (let i = 0; i < Math.min(10, excelData.length); i++) {
      const row = excelData[i]
      const roleIndex = row.findIndex((cell) => {
        const cellStr = String(cell || '').trim()
        return cellStr === '岗位' || cellStr.includes('岗位')
      })
      const nameIndex = row.findIndex((cell) => {
        const cellStr = String(cell || '').trim()
        return cellStr === '姓名' || cellStr.includes('姓名')
      })
      const indicatorIndex = row.findIndex((cell) => {
        const cellStr = String(cell || '').trim()
        return cellStr === 'KPI指标' || cellStr.includes('KPI指标')
      })

      if (roleIndex >= 0 && nameIndex >= 0 && indicatorIndex >= 0) {
        headerRowIndex = i
        headerMap['role'] = roleIndex
        headerMap['name'] = nameIndex
        headerMap['indicator'] = indicatorIndex
        
        // 查找其他列
        row.forEach((cell, index) => {
          const cellStr = String(cell || '').trim()
          if (cellStr.includes('计算细则') || cellStr.includes('计算规则')) {
            headerMap['formula'] = index
          } else if (cellStr.includes('数据来源') || cellStr.includes('考核')) {
            headerMap['dataSource'] = index
          } else if (cellStr === '权重') {
            headerMap['weight'] = index
          } else if (cellStr === '得分') {
            headerMap['score'] = index
          } else if (cellStr === 'KPI值' || cellStr === 'KPI总分') {
            headerMap['kpiValue'] = index
          }
        })
        break
      }
    }

    if (headerRowIndex < 0) {
      throw new Error('未找到表头行（应包含"岗位"、"姓名"、"KPI指标"列）')
    }

    const personMap = new Map<string, PersonConfig>()
    const dataStartRow = headerRowIndex + 1

    // 解析数据行
    for (let i = dataStartRow; i < excelData.length; i++) {
      const row = excelData[i]
      if (!row || row.length === 0) continue

      const role = String(row[headerMap['role']] || '').trim()
      const name = String(row[headerMap['name']] || '').trim()
      const indicator = String(row[headerMap['indicator']] || '').trim()

      // 跳过合计行
      if (!name || name === '总计' || name === '合计' || indicator === '总计' || indicator === '合计') {
        continue
      }

      // 如果是表头行（岗位和姓名都有值，但KPI指标为空），跳过
      if (role && name && !indicator) {
        continue
      }

      // 如果缺少关键字段，跳过
      if (!name || !indicator) {
        continue
      }

      // 获取或创建人员配置
      const personKey = `${role}-${name}`
      let person = personMap.get(personKey)
      if (!person) {
        person = {
          role: role || '教员',
          name,
          rows: [],
        }
        personMap.set(personKey, person)
      }

      // 添加KPI行
      const kpiRow: KPIRow = {
        indicator,
        formula: headerMap['formula'] !== undefined ? String(row[headerMap['formula']] || '').trim() || null : null,
        dataSource: headerMap['dataSource'] !== undefined ? String(row[headerMap['dataSource']] || '').trim() || null : null,
        weight: headerMap['weight'] !== undefined ? parseValue(row[headerMap['weight']]) : null,
        score: headerMap['score'] !== undefined ? parseValue(row[headerMap['score']]) : null,
        kpiValue: headerMap['kpiValue'] !== undefined ? parseValue(row[headerMap['kpiValue']]) : null,
        orderIndex: person.rows.length,
      }

      // 如果KPI值为空但有权重和得分，自动计算
      if (kpiRow.kpiValue === null && kpiRow.weight !== null && kpiRow.score !== null) {
        kpiRow.kpiValue = Number(((kpiRow.score * kpiRow.weight) / 100).toFixed(2))
      }

      person.rows.push(kpiRow)
    }

    return Array.from(personMap.values())
  }

  // 从剪贴板文本解析KPI结果
  const parsePasteData = (text: string): PersonConfig[] => {
    const lines = text.split('\n').map(line => line.trim())
    if (lines.length < 3) {
      throw new Error('数据格式不正确：至少需要表头行和数据行')
    }

    const personMap = new Map<string, PersonConfig>()
    let currentPerson: PersonConfig | null = null
    let headerMap: Record<string, number> = {}
    let i = 0

    // 先找到表头行（包含"KPI指标"的行）
    while (i < lines.length) {
      const line = lines[i]
      if (!line) {
        i++
        continue
      }

      let cells = line.split(/\t+/).map(c => c.trim())
      if (cells.length === 1 && line.includes('  ')) {
        cells = line.split(/\s{2,}/).map(c => c.trim())
      }

      // 检查是否是表头行（包含"KPI指标"）
      const indicatorIndex = cells.findIndex(c => c === 'KPI指标' || c.includes('KPI指标'))
      
      if (indicatorIndex >= 0) {
        // 这是表头行，解析列索引
        // 注意：表头行第0列可能是岗位名称（如"智慧司经理"），而不是表头列
        headerMap = {}
        
        cells.forEach((cell, index) => {
          const cellLower = cell.toLowerCase()
          if (cell === '岗位' || cellLower.includes('岗位')) {
            headerMap['role'] = index
          } else if (cell === '姓名' || cellLower.includes('姓名')) {
            headerMap['name'] = index
          } else if (cell === 'KPI指标' || cellLower.includes('kpi指标')) {
            headerMap['indicator'] = index
          } else if (cell.includes('计算细则') || cell.includes('计算规则')) {
            headerMap['formula'] = index
          } else if (cell.includes('数据来源') || cell.includes('考核')) {
            headerMap['dataSource'] = index
          } else if (cell === '权重') {
            headerMap['weight'] = index
          } else if (cell === '得分') {
            headerMap['score'] = index
          } else if (cell === 'KPI值' || cell === 'KPI总分') {
            headerMap['kpiValue'] = index
          }
        })
        
        // 如果表头中没有"岗位"和"姓名"列，但在数据行中，使用固定位置（第0列和第1列）
        // 注意：数据行的格式是：岗位(0) 姓名(1) KPI指标(2) 空(3) 计算细则(4) 数据来源(5) 权重(6) 得分(7) KPI值(8)
        if (headerMap['role'] === undefined) {
          headerMap['role'] = 0  // 第0列是岗位
        }
        if (headerMap['name'] === undefined) {
          headerMap['name'] = 1  // 第1列是姓名
        }
        if (headerMap['indicator'] === undefined) {
          headerMap['indicator'] = 2  // 第2列是KPI指标（在数据行中）
        }
        
        // 重要：如果表头行的"KPI指标"在第1列（index=1），说明表头行第0列是岗位名称（如"智慧司经理"）
        // 数据行格式：岗位(0) 姓名(1) KPI指标(2) 空(3) 计算细则(4) 数据来源(5) 权重(6) 得分(7) KPI值(8)
        // 表头行格式：岗位名(0) KPI指标(1) 空(2) 计算细则(3) 数据来源(4) 权重(5) 得分(6) KPI值(7)
        // 映射关系：表头列索引 -> 数据行列索引
        // - 表头第0列（岗位名）-> 数据行第0列（岗位），但表头第0列不是真正的表头
        // - 表头第1列（KPI指标）-> 数据行第2列（KPI指标），偏移是+1（因为数据行多了"姓名"列）
        // - 表头第3列（计算细则）-> 数据行第4列（计算细则），偏移是+1
        // - 表头第4列（数据来源）-> 数据行第5列（数据来源），偏移是+1
        // - 表头第5列（权重）-> 数据行第6列（权重），偏移是+1
        // - 表头第6列（得分）-> 数据行第7列（得分），偏移是+1
        // - 表头第7列（KPI值）-> 数据行第8列（KPI值），偏移是+1
        
        // 固定设置：数据行的格式是固定的（岗位=0, 姓名=1, KPI指标=2）
        headerMap['role'] = 0  // 数据行第0列：岗位
        headerMap['name'] = 1  // 数据行第1列：姓名
        headerMap['indicator'] = 2  // 数据行第2列：KPI指标
        
        // 计算列偏移：如果表头第0列是岗位名称（不是表头），则其他列需要+1
        let columnOffset = 1  // 默认偏移为1（因为数据行多了"姓名"列）
        if (indicatorIndex === 1 && cells[0] && cells[0] !== '岗位' && cells[0] !== '姓名' && !cells[0].includes('岗位') && !cells[0].includes('KPI指标')) {
          // 表头行第0列是岗位名称，不是表头，所以其他列索引需要+1才能对应到数据行
          columnOffset = 1
        } else if (indicatorIndex === 0) {
          // 如果KPI指标在第0列，说明表头格式不同，可能需要不同的偏移
          columnOffset = 2
        }
        
        // 调整表头列索引，使其匹配数据行的实际列位置
        // 从表头行推断其他列在数据行中的位置（表头列索引 + columnOffset = 数据行列索引）
        if (headerMap['formula'] !== undefined) {
          headerMap['formula'] = headerMap['formula'] + columnOffset
        } else {
          const formulaHeaderIndex = cells.findIndex(c => c && (c.includes('计算') || c.includes('细则')))
          headerMap['formula'] = formulaHeaderIndex >= 0 ? formulaHeaderIndex + columnOffset : 4
        }
        
        if (headerMap['dataSource'] !== undefined) {
          headerMap['dataSource'] = headerMap['dataSource'] + columnOffset
        } else {
          const dataSourceHeaderIndex = cells.findIndex(c => c && (c.includes('数据来源') || c.includes('考核')))
          headerMap['dataSource'] = dataSourceHeaderIndex >= 0 ? dataSourceHeaderIndex + columnOffset : 5
        }
        
        if (headerMap['weight'] !== undefined) {
          headerMap['weight'] = headerMap['weight'] + columnOffset
        } else {
          const weightHeaderIndex = cells.findIndex(c => c === '权重')
          headerMap['weight'] = weightHeaderIndex >= 0 ? weightHeaderIndex + columnOffset : 6
        }
        
        if (headerMap['score'] !== undefined) {
          headerMap['score'] = headerMap['score'] + columnOffset
        } else {
          const scoreHeaderIndex = cells.findIndex(c => c === '得分')
          headerMap['score'] = scoreHeaderIndex >= 0 ? scoreHeaderIndex + columnOffset : 7
        }
        
        if (headerMap['kpiValue'] !== undefined) {
          headerMap['kpiValue'] = headerMap['kpiValue'] + columnOffset
        } else {
          const kpiValueHeaderIndex = cells.findIndex(c => c === 'KPI值' || c === 'KPI总分')
          headerMap['kpiValue'] = kpiValueHeaderIndex >= 0 ? kpiValueHeaderIndex + columnOffset : 8
        }
        
        console.log('[KPI导入] 表头行前10列:', cells.slice(0, 10))
        console.log('[KPI导入] 表头映射:', headerMap, '列偏移:', columnOffset, 'KPI指标在表头的索引:', indicatorIndex)
        
        i++
        break
      }
      
      i++
    }

    if (headerMap['indicator'] === undefined) {
      throw new Error('未找到表头行（应包含"KPI指标"列）')
    }

    // 解析数据行
    while (i < lines.length) {
      const line = lines[i]
      if (!line) {
        i++
        // 空行可能表示新的人员组的开始，重置当前人员
        currentPerson = null
        continue
      }

      let cells = line.split(/\t+/).map(c => c.trim())
      if (cells.length === 1 && line.includes('  ')) {
        cells = line.split(/\s{2,}/).map(c => c.trim())
      }

      // 获取岗位、姓名和KPI指标（固定位置：岗位=0, 姓名=1, KPI指标=2）
      const roleCol = 0
      const nameCol = 1
      const indicatorCol = 2
      
      const role = (cells[roleCol] || '').trim()
      const name = (cells[nameCol] || '').trim()
      const indicator = (cells[indicatorCol] || '').trim()

      // 跳过总计行和空行
      if (indicator === '总计' || indicator === '合计' || role === '总计' || role === '合计') {
        currentPerson = null  // 总计行后，重置当前人员
        i++
        continue
      }

      // 跳过完全空行
      if (!role && !name && !indicator) {
        // 空行可能表示新的人员组的开始
        currentPerson = null
        i++
        continue
      }

      // 如果这一行有岗位和姓名，说明是新的人员（第一行）
      if (role && name && role !== '总计' && role !== '合计' && name !== '总计' && name !== '合计' && !role.includes('岗位') && !name.includes('姓名') && !role.includes('KPI指标')) {
        const personKey = `${role}-${name}`
        currentPerson = personMap.get(personKey)
        
        if (!currentPerson) {
          currentPerson = {
            role: role || '教员',
            name,
            rows: [],
          }
          personMap.set(personKey, currentPerson)
          console.log('[KPI导入] 创建新人员:', currentPerson.role, currentPerson.name)
        }
        
        // 如果这一行也有KPI指标（且不是岗位名称），添加KPI行
        if (indicator && indicator !== role && indicator !== name && !indicator.includes('KPI指标')) {
          const kpiRow = parseKpiRow(cells, headerMap, currentPerson.rows.length)
          if (kpiRow) {
            currentPerson.rows.push(kpiRow)
            console.log('[KPI导入] 添加KPI行:', indicator, '到人员:', currentPerson.name)
          }
        }
      } else if (currentPerson && indicator && indicator !== '总计' && indicator !== '合计' && !indicator.includes('KPI指标') && indicator.length > 0) {
        // 当前人员的后续KPI行（岗位和姓名列为空，但KPI指标列有值）
        const kpiRow = parseKpiRow(cells, headerMap, currentPerson.rows.length)
        if (kpiRow) {
          currentPerson.rows.push(kpiRow)
          console.log('[KPI导入] 添加KPI行:', indicator, '到人员:', currentPerson.name)
        }
      }

      i++
    }

    const result = Array.from(personMap.values())
    if (result.length === 0) {
      throw new Error('未能解析出任何人员数据，请检查数据格式。提示：请确保数据中包含岗位、姓名和KPI指标列')
    }

    return result
  }

  // 解析KPI行的辅助函数
  const parseKpiRow = (cells: string[], headerMap: Record<string, number>, orderIndex: number): KPIRow | null => {
    const indicatorCol = headerMap['indicator'] ?? 2
    const indicator = (cells[indicatorCol] || '').trim()
    if (!indicator || indicator === '总计' || indicator === '合计') return null

    // 解析权重（支持百分比格式，如"10.00%"或"额外附加"）
    let weight: NullableNumber = null
    const weightCol = headerMap['weight']
    if (weightCol !== undefined && cells.length > weightCol && cells[weightCol]) {
      const weightStr = (cells[weightCol] || '').trim()
      if (weightStr && weightStr !== '额外附加' && weightStr !== '额外') {
        // 移除百分号并解析
        const weightNum = parseValue(weightStr.replace(/%/g, ''))
        weight = weightNum
      }
    }

    const formulaCol = headerMap['formula']
    const dataSourceCol = headerMap['dataSource']
    const scoreCol = headerMap['score']
    const kpiValueCol = headerMap['kpiValue']

    const kpiRow: KPIRow = {
      indicator,
      formula: formulaCol !== undefined && cells.length > formulaCol ? (cells[formulaCol] || '').trim() || null : null,
      dataSource: dataSourceCol !== undefined && cells.length > dataSourceCol ? (cells[dataSourceCol] || '').trim() || null : null,
      weight,
      score: scoreCol !== undefined && cells.length > scoreCol ? parseValue(cells[scoreCol]) : null,
      kpiValue: kpiValueCol !== undefined && cells.length > kpiValueCol ? parseValue(cells[kpiValueCol]) : null,
      orderIndex,
    }

    // 如果KPI值为空但有权重和得分，自动计算
    if (kpiRow.kpiValue === null && kpiRow.weight !== null && kpiRow.score !== null) {
      kpiRow.kpiValue = Number(((kpiRow.score * kpiRow.weight) / 100).toFixed(2))
    }

    return kpiRow
  }

  // 处理Excel文件上传
  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: 'array' })
      
      const firstSheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[firstSheetName]
      const excelData = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: '' })

      const importedPersons = parseExcelData(excelData)
      
      if (importedPersons.length === 0) {
        message.warning('未能从Excel中解析出有效数据')
        return
      }

      // 合并到现有数据
      const existingMap = new Map(data.map((p, idx) => [`${p.role}-${p.name}`, idx]))
      
      const updatedData = [...data]
      importedPersons.forEach((importedPerson) => {
        const key = `${importedPerson.role}-${importedPerson.name}`
        const existingIndex = existingMap.get(key)
        
        if (existingIndex !== undefined) {
          // 合并：更新现有人员的KPI行
          const existingPerson = updatedData[existingIndex]
          const indicatorMap = new Map(existingPerson.rows.map((r, idx) => [r.indicator, idx]))
          
          importedPerson.rows.forEach((importedRow) => {
            const existingRowIndex = indicatorMap.get(importedRow.indicator)
            if (existingRowIndex !== undefined) {
              // 更新现有行
              existingPerson.rows[existingRowIndex] = {
                ...existingPerson.rows[existingRowIndex],
                ...importedRow,
              }
            } else {
              // 添加新行
              existingPerson.rows.push(importedRow)
            }
          })
        } else {
          // 添加新人员
          updatedData.push(importedPerson)
        }
      })

      setData(updatedData)
      message.success(`成功导入 ${importedPersons.length} 个人员的数据`)
      
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
      const importedPersons = parsePasteData(pasteText)
      
      if (importedPersons.length === 0) {
        message.warning('未能从粘贴数据中解析出有效记录')
        return
      }

      // 合并到现有数据
      const existingMap = new Map(data.map((p, idx) => [`${p.role}-${p.name}`, idx]))
      
      const updatedData = [...data]
      importedPersons.forEach((importedPerson) => {
        const key = `${importedPerson.role}-${importedPerson.name}`
        const existingIndex = existingMap.get(key)
        
        if (existingIndex !== undefined) {
          const existingPerson = updatedData[existingIndex]
          const indicatorMap = new Map(existingPerson.rows.map((r, idx) => [r.indicator, idx]))
          
          importedPerson.rows.forEach((importedRow) => {
            const existingRowIndex = indicatorMap.get(importedRow.indicator)
            if (existingRowIndex !== undefined) {
              existingPerson.rows[existingRowIndex] = {
                ...existingPerson.rows[existingRowIndex],
                ...importedRow,
              }
            } else {
              existingPerson.rows.push(importedRow)
            }
          })
        } else {
          updatedData.push(importedPerson)
        }
      })

      setData(updatedData)
      setImportModalVisible(false)
      setPasteText('')
      message.success(`成功导入 ${importedPersons.length} 个人员的数据`)
    } catch (error: any) {
      console.error('剪贴板导入失败', error)
      message.error(`导入失败：${error.message || '数据格式不正确'}`)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      await saveKpiResults({
        campus: campusName,
        year,
        month,
        entries: data.map((person) => ({
          teacherId: person.teacherId,
          teacherName: person.name,
          role: person.role,
          rows: person.rows.map((row, index) => ({
            templateId: row.templateId ?? null,
            indicator: row.indicator,
            formula: row.formula,
            dataSource: row.dataSource,
            weight: row.weight ?? null,
            score: row.score ?? null,
            kpiValue: row.kpiValue ?? null,
            orderIndex: row.orderIndex ?? index,
          })),
        })),
      })
      message.success('保存成功')
    } catch (error) {
      console.error('保存KPI结果失败', error)
      message.error('保存失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card bordered={false} style={{ backgroundColor: '#f5f7fa' }}>
      <Space style={{ marginBottom: 8, justifyContent: 'space-between', width: '100%' }}>
        <Title level={4} style={{ marginBottom: 0 }}>
          教员KPI考核数据表
        </Title>
        <Text type="secondary">
          {year}年{month}月
        </Text>
      </Space>
      <Text type="secondary">支持按人员筛选与编辑权重、得分及KPI值，汇总信息集中展示。</Text>
      <Space style={{ margin: '12px 0' }}>
        <Select
          placeholder="筛选教员"
          value={selectedName}
          onChange={(value) => setSelectedName(value)}
          style={{ width: 200 }}
          disabled={!canViewOthers}
        >
          {canViewOthers && <Option value="all">全部</Option>}
          {data.map((item) => (
            <Option key={item.name} value={item.name}>
              {item.role} - {item.name}
            </Option>
          ))}
        </Select>
        <Button type="primary" onClick={handleSave} loading={saving}>
          保存结果
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
        <Button onClick={loadData} loading={loading}>
          刷新
        </Button>
      </Space>

      <Table<FlatRow>
        bordered
        columns={columns}
        dataSource={flatRows}
        pagination={false}
        scroll={{ x: 'max-content', y: 520 }}
        loading={loading}
        rowClassName={(record) => {
          if (record.section === 'header') return 'kpi-table-header-row'
          if (record.section === 'summary') return 'kpi-table-summary-row'
          return ''
        }}
      />

      <div style={{ marginTop: 12, color: '#888' }}>
        注：黄色底块为KPI考核项（可通过编辑维护数据）。此表格正在开发中
      </div>

      <Drawer
        title="编辑KPI数据"
        width={360}
        open={!!editTarget}
        onClose={closeDrawer}
        destroyOnHidden
        maskClosable={false}
        footer={
          <Space style={{ justifyContent: 'flex-end', width: '100%' }}>
            <Button onClick={closeDrawer}>取消</Button>
            <Button type="primary" onClick={submitEdit}>
              保存
            </Button>
          </Space>
        }
      >
        <Form<EditFormValues>
          layout="vertical"
          form={form}
          preserve={false}
          onValuesChange={(_, allValues) => {
            const next = calcKpiValue(allValues.weight ?? null, allValues.score ?? null)
            form.setFieldsValue({ kpiValue: next })
          }}
        >
          <Form.Item
            name="weight"
            label="权重(%)"
            rules={[{ type: 'number', min: 0, max: 100, message: '请输入0-100之间的数值' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              precision={2}
              placeholder="可留空表示不参与权重"
            />
          </Form.Item>
          <Form.Item
            name="score"
            label="得分"
            rules={[{ type: 'number', min: 0, message: '得分不能小于0' }]}
          >
            <InputNumber style={{ width: '100%' }} precision={2} placeholder="请输入得分" />
          </Form.Item>
          <Form.Item
            name="kpiValue"
            label="KPI值"
            tooltip="自动计算：得分 × 权重 ÷ 100（权重或得分为空则不计算）"
          >
            <InputNumber
              style={{ width: '100%' }}
              precision={2}
              placeholder="自动计算"
              disabled
            />
          </Form.Item>
        </Form>
      </Drawer>

      {/* Excel导入和剪贴板粘贴模态框 */}
      <Modal
        title={importType === 'excel' ? '从Excel导入KPI结果' : '从剪贴板粘贴KPI结果'}
        open={importModalVisible}
        onCancel={() => {
          setImportModalVisible(false)
          setPasteText('')
        }}
        onOk={importType === 'paste' ? handlePasteImport : undefined}
        okText="导入"
        cancelText="取消"
        destroyOnClose
        width={900}
      >
        {importType === 'excel' ? (
          <div>
            <Alert
              message="Excel导入说明"
              description={
                <div>
                  <p>• 请选择包含KPI考核结果的Excel文件</p>
                  <p>• Excel表格应包含以下列：岗位、姓名、KPI指标、计算细则、数据来源、权重、得分、KPI值</p>
                  <p>• 表格结构：每个人员有多行KPI指标数据，第一行应为表头</p>
                  <p>• 导入的数据会与现有数据合并（同名人员的同名指标会更新）</p>
                  <p>• 如果KPI值为空但有权重和得分，系统会自动计算KPI值</p>
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
                  <p>• 第一行应为表头（包含：岗位、姓名、KPI指标、计算细则、数据来源、权重、得分、KPI值）</p>
                  <p>• 表格结构：每个人员有多行KPI指标数据</p>
                  <p>• 导入的数据会与现有数据合并（同名人员的同名指标会更新）</p>
                  <p>• 如果KPI值为空但有权重和得分，系统会自动计算KPI值</p>
                </div>
              }
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <TextArea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="请粘贴表格数据（从Excel中复制后直接粘贴）&#10;例如：&#10;岗位	姓名	KPI指标	计算细则	数据来源、考核人	权重	得分	KPI值&#10;学术教员	曾嘉怡	部门业绩目标完成率	（2*部门业绩目标完成率+0.8）/0.3（目标40000元）	神藏司	15.00	0.00	0.00&#10;学术教员	曾嘉怡	学生就业率	10*目标就业学生数/实际就业学生数（目标18人）	就业部	15.00	8.89	1.33"
              rows={15}
              style={{ fontFamily: 'monospace', fontSize: 12 }}
            />
          </div>
        )}
      </Modal>
    </Card>
  )
}

export default TeacherKpiTablePage
