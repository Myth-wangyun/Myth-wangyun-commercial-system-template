/**
 * 清美教育原关神殿教化司II梯工作自查表
 */

import React, { useState, useMemo, useEffect, useCallback, memo, startTransition } from 'react'
import { App, Card, Table, Button, Space, Select, Input, Typography, Modal, Form } from 'antd'
import { ReloadOutlined, DownloadOutlined, EditOutlined, SaveOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useCampusStore } from '@/stores/campusStore'
import { fetchHomeroomTeachers } from '@/services/configMaster'
import type { WorkSelfCheckRecord } from './types'
import { YEAR_OPTIONS, MONTH_OPTIONS, TABLE_CONFIG, TIPS, MESSAGES } from './constants'

import { buildApiUrl } from '@/utils/apiBase'

const { Option } = Select
const { Title } = Typography

// 可编辑单元格组件 - 使用 memo 避免不必要的重新渲染
interface EditableCellProps {
  text: any
  record: WorkSelfCheckRecord
  field: string
  editMode: boolean
  onCellChange: (key: string, field: string, value: any) => void
}

const EditableCell = memo(({ text, record, field, editMode, onCellChange }: EditableCellProps) => {
  const [localValue, setLocalValue] = React.useState<string>(text || '')
  const composingRef = React.useRef(false)

  // 同步外部值到本地，但在输入法合成期间不强制覆盖
  React.useEffect(() => {
    if (!composingRef.current) {
      setLocalValue(text || '')
    }
  }, [text])

  if (!editMode) {
    return <div style={{ whiteSpace: 'pre-wrap' }}>{text || ''}</div>
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value
    setLocalValue(v)
    if (!composingRef.current) {
      onCellChange(record.key, field, v)
    }
  }

  const handleCompositionStart = () => {
    composingRef.current = true
  }

  const handleCompositionEnd = (e: React.CompositionEvent<HTMLTextAreaElement>) => {
    composingRef.current = false
    const v = (e.target as HTMLTextAreaElement).value
    setLocalValue(v)
    onCellChange(record.key, field, v)
  }

  return (
    <Input.TextArea
      value={localValue}
      onChange={handleChange}
      onCompositionStart={handleCompositionStart}
      onCompositionEnd={handleCompositionEnd}
      autoSize={{ minRows: 1, maxRows: 6 }}
      style={{ fontSize: '12px' }}
    />
  )
})

const ReputationEnrollmentPlanExecutionTable: React.FC = () => {
  const { message, modal } = App.useApp()
  const { currentCampus } = useCampusStore()
  const [selectedCampus, setSelectedCampus] = useState<string>(currentCampus || '')

  // 跟随全局神殿选择栏变化
  useEffect(() => {
    setSelectedCampus(currentCampus || '')
  }, [currentCampus])
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1)
  const [teacherName, setTeacherName] = useState<string>('')
  const [teacherOptions, setTeacherOptions] = useState<string[]>([])
  const [teacherOptionsLoading, setTeacherOptionsLoading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [addModalVisible, setAddModalVisible] = useState(false)
  const [addForm] = Form.useForm()

  // 生成日期列（1-31日）
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate()
  }

  const daysInMonth = getDaysInMonth(selectedYear, selectedMonth)

  // 模板行：根据常量生成（便于填充后端数据）
  const createTemplateRows = (days: number): WorkSelfCheckRecord[] => {
    const rows: WorkSelfCheckRecord[] = []
    const pushRow = (prefix: string, idx: number, category: string, detail: string) => {
      const base: WorkSelfCheckRecord = { key: `${prefix}-${idx}`, category, detailContent: detail }
      for (let d = 1; d <= days; d++) base[d.toString()] = ''
      rows.push(base)
    }
    // 访谈
    const visitDetails = [
      '访谈新生数量',
      '新生姓名',
      '是否填写访谈记录表',
      '访谈老生数量',
      '老生姓名',
      '是否填写访谈记录表',
      '访谈毕业生数量',
      '毕业生姓名',
      '是否填写访谈记录表',
      '家长访谈数量',
      '家长访谈姓名',
      '是否填写访谈记录表',
    ]
    visitDetails.forEach((label, i) => pushRow('visit', i + 1, '访谈', label))
    // 活动
    const activityDetails = ['活动时间/地点', '活动内容', '是否有宣传', '比赛次数', '送喜报人次']
    activityDetails.forEach((label, i) => pushRow('activity', i + 1, '活动', label))
    // 线上
    const onlineDetails = ['朋友圈数量', '抖音数量', '快手数量', '小红书数量', '……', '当天合计']
    onlineDetails.forEach((label, i) => pushRow('online', i + 1, '线上宣传', label))
    return rows
  }

  // 初始化数据
  const [dataSource, setDataSource] = useState<WorkSelfCheckRecord[]>(
    createTemplateRows(daysInMonth),
  )

  // 当选择的年月变化导致当月天数变化时：重建模板行并尽量保留已有填写
  useEffect(() => {
    const newDays = getDaysInMonth(selectedYear, selectedMonth)
    setDataSource((prev) => {
      const next = createTemplateRows(newDays)
      // 按“事件 + 详细内容”合并已有数据
      const prevMap = new Map<string, WorkSelfCheckRecord>()
      prev.forEach((r) => prevMap.set(`${r.category}__${r.detailContent}`, r))

      next.forEach((r) => {
        const old = prevMap.get(`${r.category}__${r.detailContent}`)
        if (!old) return
        for (let d = 1; d <= newDays; d++) {
          const k = String(d)
          if (old[k] !== undefined) r[k] = old[k]
        }
      })
      return next
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear, selectedMonth])

  // 处理单元格编辑 - 使用 useCallback 避免函数重新创建，使用 startTransition 优化大量更新
  // 需求：线上宣传 -> 当天合计 = 朋友圈数量 + 抖音数量 + 快手数量 + 小红书数量（按“同一天”自动计算）
  const handleCellChange = useCallback((key: string, field: string, value: any) => {
    const toNumber = (v: any) => {
      if (v === undefined || v === null) return 0
      const s = String(v).trim()
      if (!s) return 0
      const n = Number(s)
      return Number.isFinite(n) ? n : 0
    }

    startTransition(() => {
      setDataSource((prevData) => {
        // 先更新当前编辑的单元格
        const updated = prevData.map((item) => (item.key === key ? { ...item, [field]: value } : item))

        // 仅当编辑的是“线上宣传”且是某一天的字段时，才联动计算“当天合计”
        const day = Number(field)
        if (!Number.isInteger(day) || day < 1) return updated

        const onlineRows = updated.filter((r) => r.category === '线上宣传')
        if (onlineRows.length === 0) return updated

        const friendRow = onlineRows.find((r) => r.detailContent === '朋友圈数量')
        const douyinRow = onlineRows.find((r) => r.detailContent === '抖音数量')
        const kuaishouRow = onlineRows.find((r) => r.detailContent === '快手数量')
        const xhsRow = onlineRows.find((r) => r.detailContent === '小红书数量')
        const totalRow = onlineRows.find((r) => r.detailContent === '当天合计')

        if (!totalRow) return updated

        // 计算当日合计
        const sum =
          toNumber(friendRow?.[field]) +
          toNumber(douyinRow?.[field]) +
          toNumber(kuaishouRow?.[field]) +
          toNumber(xhsRow?.[field])

        // 合计为 0 则显示空（与其它数量字段保持一致的体验）
        const totalValue = sum > 0 ? String(sum) : ''

        // 回写到“当天合计”行的同一天字段
        return updated.map((item) =>
          item.key === totalRow.key ? { ...item, [field]: totalValue } : item,
        )
      })
    })
  }, [])

  // 计算分类合并行数 - 使用 useMemo 缓存结果
  const categoryRowSpanMap = useMemo(() => {
    const map: Record<string, number> = {}
    dataSource.forEach((record, index) => {
      if (index === 0 || dataSource[index - 1].category !== record.category) {
        let count = 1
        for (let i = index + 1; i < dataSource.length; i++) {
          if (dataSource[i].category === record.category) {
            count++
          } else {
            break
          }
        }
        map[record.key] = count
      } else {
        map[record.key] = 0
      }
    })
    return map
  }, [dataSource])

  // 计算合计值 - 使用 useMemo 缓存
  const totalMap = useMemo(() => {
    const map: Record<string, number | string> = {}
    dataSource.forEach((record) => {
      if (record.detailContent.includes('数量') || record.detailContent.includes('人次') || record.detailContent === '当天合计') {
        let sum = 0
        for (let day = 1; day <= daysInMonth; day++) {
          const value = record[day.toString()]
          if (value && !isNaN(Number(value))) {
            sum += Number(value)
          }
        }
        map[record.key] = sum > 0 ? sum : ''
      } else {
        map[record.key] = ''
      }
    })
    return map
  }, [dataSource, daysInMonth])

  // 处理删除详细内容 - 必须在 columns 之前声明
  const handleDeleteDetail = useCallback((record: WorkSelfCheckRecord) => {
    modal.confirm({
      title: '确认删除',
      content: `确定要删除"${record.detailContent}"这条记录吗？`,
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        setDataSource((prev) => prev.filter((item) => item.key !== record.key))
        message.success('删除成功')
      },
    })
  }, [])

  // 生成表格列配置 - 使用 useMemo 避免频繁重新生成
  const columns: ColumnsType<WorkSelfCheckRecord> = useMemo(() => {
    const dayColumns = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1
      return {
        title: day.toString(),
        dataIndex: day.toString(),
        key: day.toString(),
        width: TABLE_CONFIG.DAY_COLUMN_WIDTH,
        align: 'center' as const,
        render: (text: any, record: WorkSelfCheckRecord) => (
          <EditableCell
            text={text}
            record={record}
            field={day.toString()}
            editMode={editMode}
            onCellChange={handleCellChange}
          />
        ),
      }
    })

    return [
      {
        title: '事件',
        dataIndex: 'category',
        key: 'category',
        width: TABLE_CONFIG.CATEGORY_COLUMN_WIDTH,
        align: 'center',
        fixed: 'left',
        render: (text, record) => {
          const rowSpan = categoryRowSpanMap[record.key] || 0
          return {
            children: text,
            props: {
              rowSpan,
            },
          }
        },
      },
      {
        title: '详细内容',
        dataIndex: 'detailContent',
        key: 'detailContent',
        width: TABLE_CONFIG.DETAIL_COLUMN_WIDTH,
        align: 'left',
        fixed: 'left',
      },
      ...dayColumns,
      {
        title: '合计',
        dataIndex: 'total',
        key: 'total',
        width: TABLE_CONFIG.TOTAL_COLUMN_WIDTH,
        align: 'center',
        fixed: 'right',
        render: (_, record) => totalMap[record.key] || '',
      },
      {
        title: '操作',
        key: 'action',
        width: 80,
        align: 'center',
        fixed: 'right',
        render: (_, record) => {
          // 只有自定义添加的行才显示删除按钮
          if (record.key.startsWith('custom-')) {
            return (
              <Button
                type="link"
                danger
                size="small"
                icon={<DeleteOutlined />}
                onClick={() => handleDeleteDetail(record)}
              >
                删除
              </Button>
            )
          }
          return null
        },
      },
    ]
  }, [daysInMonth, editMode, handleCellChange, categoryRowSpanMap, totalMap, handleDeleteDetail])

  const loadTeacherOptions = useCallback(async () => {
    if (!selectedCampus) {
      setTeacherOptions([])
      return
    }
    setTeacherOptionsLoading(true)
    try {
      // 从配置中心获取班主任列表
      const teachers = await fetchHomeroomTeachers({
        campus_name: selectedCampus,
        active: true,
      })
      const names = [...new Set(teachers.map((t) => t.name))]
      setTeacherOptions(names)

      // 如果当前未选择班主任，默认选中列表第一个
      if (!teacherName && names.length > 0) {
        setTeacherName(names[0])
      }
    } catch (e: any) {
      console.error('获取班主任列表失败:', e)
      message.error('获取班主任列表失败: ' + (e?.message || '未知错误'))
      setTeacherOptions([])
    } finally {
      setTeacherOptionsLoading(false)
    }
  }, [selectedCampus, teacherName])

  useEffect(() => {
    if (selectedCampus) loadTeacherOptions()
  }, [selectedCampus, loadTeacherOptions])

  // 从后端加载 - 使用 useCallback
  const loadSelfCheck = useCallback(async () => {
    if (!selectedCampus) return
    if (!teacherName) {
      message.info('请先选择班主任')
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const safeJson = async (r: Response) => {
        if (!r.ok) throw new Error(await r.text())
        return r.json()
      }

      // ===== 活动：按“班级活动计划安排表”的负责人字段筛选（后端聚合接口） =====
      const activityPlanRes = await fetch(
        `${buildApiUrl('/teaching-quality/class-activity-plan/by-campus')}?${new URLSearchParams({
          campus: selectedCampus,
          year: String(selectedYear),
          month: String(selectedMonth),
        }).toString()}`,
      )
      const activityData = (await safeJson(activityPlanRes)) as {
        神殿名称: string
        年份: number
        月份: number
        行列表: Array<{
          序号: number
          班级名称?: string
          时间?: string
          地点?: string
          主要内容?: string
          负责人?: string
        }>
      }

      const activities = (activityData?.行列表 || []).filter(
        (r) => String(r?.负责人 || '').trim() === String(teacherName || '').trim(),
      )

      const activityTimePlaceByDay = new Map<number, string[]>()
      const activityContentByDay = new Map<number, string[]>()

      activities.forEach((r) => {
        const timeStr = String(r?.时间 || '').trim()
        if (!timeStr) return
        const dt = new Date(timeStr)
        if (Number.isNaN(dt.getTime())) return
        if (dt.getFullYear() !== selectedYear || dt.getMonth() + 1 !== selectedMonth) return
        const day = dt.getDate()
        if (day < 1 || day > daysInMonth) return

        const className = String(r?.班级名称 || '').trim()
        const place = String(r?.地点 || '').trim()
        const content = String(r?.主要内容 || '').trim()

        const tpArr = activityTimePlaceByDay.get(day) || []
        tpArr.push(`${className}${place ? `(${place})` : ''}`)
        activityTimePlaceByDay.set(day, tpArr)

        const cArr = activityContentByDay.get(day) || []
        cArr.push(`${className}：${content}`.replace(/：\s*$/, ''))
        activityContentByDay.set(day, cArr)
      })

      // ===== 访谈：从“学员访谈记录表/家长访谈/毕业生访谈”自动汇总 =====
      const interviewParams = new URLSearchParams({
        campus: selectedCampus,
        year: String(selectedYear),
        month: String(selectedMonth),
      })

      const [studentRes, parentRes, graduateRes] = await Promise.all([
        fetch(
          `${buildApiUrl('/teaching-quality/student-interview-record')}?${new URLSearchParams({
            ...Object.fromEntries(interviewParams.entries()),
            type: '学员访谈',
            homeroom_teacher: teacherName,
          }).toString()}`,
        ),
        fetch(
          `${buildApiUrl('/teaching-quality/parent-interview-record')}?${new URLSearchParams({
            ...Object.fromEntries(interviewParams.entries()),
            type: '家长访谈',
            homeroom_teacher: teacherName,
          }).toString()}`,
        ),
        fetch(
          `${buildApiUrl('/teaching-quality/graduate-interview-record')}?${new URLSearchParams({
            ...Object.fromEntries(interviewParams.entries()),
            homeroom_teacher: teacherName,
          }).toString()}`,
        ),
      ])

      const [studentData, parentData, graduateData] = await Promise.all([
        safeJson(studentRes),
        safeJson(parentRes),
        safeJson(graduateRes),
      ])

      const studentRows: Array<any> = studentData?.行列表 || []
      const parentRows: Array<any> = parentData?.行列表 || []
      const graduateRows: Array<any> = graduateData?.行列表 || []

      // 学员访谈：按“访谈时间”决定写入哪一天；若“访谈记录”为空白，则视为没有访谈
      // 新生/老生判断：若访谈时间距入学时间超过 1 个月(30天) => 老生，否则新生
      const studentInterviews = studentRows
        .map((r) => {
          const name = String(r?.姓名 || '').trim()
          const enrollmentDate = String(r?.入学时间 || '').trim()
          const visitDate = String(r?.访谈时间 || '').trim()
          const log = String(r?.访谈记录 || '').trim()
          return { name, enrollmentDate, visitDate, log }
        })
        .filter((x) => x.name && x.enrollmentDate && x.visitDate && x.log)

      const msInDay = 24 * 60 * 60 * 1000
      const oneMonthDays = 30

      const newStuCountByDay = new Map<number, number>()
      const newStuNamesByDay = new Map<number, string[]>()
      const oldStuCountByDay = new Map<number, number>()
      const oldStuNamesByDay = new Map<number, string[]>()

      studentInterviews.forEach((x) => {
        const vd = new Date(x.visitDate)
        const ed = new Date(x.enrollmentDate)
        if (Number.isNaN(vd.getTime()) || Number.isNaN(ed.getTime())) return

        if (vd.getFullYear() !== selectedYear || vd.getMonth() + 1 !== selectedMonth) return
        const day = vd.getDate()
        if (day < 1 || day > daysInMonth) return

        const diffDays = Math.floor((vd.getTime() - ed.getTime()) / msInDay)
        const isOld = diffDays > oneMonthDays

        if (isOld) {
          oldStuCountByDay.set(day, (oldStuCountByDay.get(day) || 0) + 1)
          const arr = oldStuNamesByDay.get(day) || []
          arr.push(x.name)
          oldStuNamesByDay.set(day, arr)
        } else {
          newStuCountByDay.set(day, (newStuCountByDay.get(day) || 0) + 1)
          const arr = newStuNamesByDay.get(day) || []
          arr.push(x.name)
          newStuNamesByDay.set(day, arr)
        }
      })

      // 家长访谈：以“访谈时间”决定写入哪一天；若“访谈记录”为空白，则视为没有访谈
      const parentInterviews = parentRows
        .map((r) => {
          const name = String(r?.姓名 || '').trim()
          const visitDate = String(r?.访谈时间 || '').trim()
          const log = String(r?.访谈记录 || '').trim()
          return { name, visitDate, log }
        })
        .filter((x) => x.name && x.visitDate && x.log)

      const parentCountByDay = new Map<number, number>()
      const parentNamesByDay = new Map<number, string[]>()
      parentInterviews.forEach((x) => {
        const d = new Date(x.visitDate)
        if (Number.isNaN(d.getTime())) return
        if (d.getFullYear() !== selectedYear || d.getMonth() + 1 !== selectedMonth) return
        const day = d.getDate()
        if (day < 1 || day > daysInMonth) return

        parentCountByDay.set(day, (parentCountByDay.get(day) || 0) + 1)
        const arr = parentNamesByDay.get(day) || []
        arr.push(x.name)
        parentNamesByDay.set(day, arr)
      })

      // 毕业生访谈：按访谈时间写入对应日期；访谈记录空白视为没有访谈
      const graduateInterviews = graduateRows
        .map((r) => {
          const name = String(r?.姓名 || '').trim()
          const visitDate = String(r?.访谈时间 || '').trim()
          const log = String(r?.访谈记录 || '').trim()
          return { name, visitDate, log }
        })
        .filter((x) => x.name && x.visitDate && x.log)

      const gradCountByDay = new Map<number, number>()
      const gradNamesByDay = new Map<number, string[]>()
      graduateInterviews.forEach((x) => {
        const d = new Date(x.visitDate)
        if (Number.isNaN(d.getTime())) return
        if (d.getFullYear() !== selectedYear || d.getMonth() + 1 !== selectedMonth) return
        const day = d.getDate()
        if (day < 1 || day > daysInMonth) return

        gradCountByDay.set(day, (gradCountByDay.get(day) || 0) + 1)
        const arr = gradNamesByDay.get(day) || []
        arr.push(x.name)
        gradNamesByDay.set(day, arr)
      })

      // 基于模板填充
      const tpl = createTemplateRows(daysInMonth)

      // 精确写入：通过在模板中的顺序定位
      const visitRows = tpl.filter((r) => r.category === '访谈')

      // 学员-新生
      const newCountRow = visitRows.find((r) => r.detailContent === '访谈新生数量')
      const newNamesRow = visitRows.find((r) => r.detailContent === '新生姓名')
      const newFilledRow = (() => {
        const idx = visitRows.findIndex((r) => r.detailContent === '新生姓名')
        return idx >= 0 ? visitRows[idx + 1] : undefined
      })()

      // 学员-老生
      const oldCountRow = visitRows.find((r) => r.detailContent === '访谈老生数量')
      const oldNamesRow = visitRows.find((r) => r.detailContent === '老生姓名')
      const oldFilledRow = (() => {
        const idx = visitRows.findIndex((r) => r.detailContent === '老生姓名')
        return idx >= 0 ? visitRows[idx + 1] : undefined
      })()

      // 毕业生
      const gradCountRow = visitRows.find((r) => r.detailContent === '访谈毕业生数量')
      const gradNamesRow = visitRows.find((r) => r.detailContent === '毕业生姓名')
      const gradFilledRow = (() => {
        const idx = visitRows.findIndex((r) => r.detailContent === '毕业生姓名')
        return idx >= 0 ? visitRows[idx + 1] : undefined
      })()

      // 家长
      const parentCountRow = visitRows.find((r) => r.detailContent === '家长访谈数量')
      const parentNamesRow = visitRows.find((r) => r.detailContent === '家长访谈姓名')
      const parentFilledRow = (() => {
        const idx = visitRows.findIndex((r) => r.detailContent === '家长访谈姓名')
        return idx >= 0 ? visitRows[idx + 1] : undefined
      })()

      // 活动
      const activityRows = tpl.filter((r) => r.category === '活动')
      const activityTimePlaceRow = activityRows.find((r) => r.detailContent === '活动时间/地点')
      const activityContentRow = activityRows.find((r) => r.detailContent === '活动内容')

      // 按天写入
      for (let day = 1; day <= daysInMonth; day++) {
        const k = String(day)

        // 新生
        const nc = newStuCountByDay.get(day) || 0
        const nn = newStuNamesByDay.get(day) || []
        if (newCountRow) newCountRow[k] = nc > 0 ? String(nc) : ''
        if (newNamesRow) newNamesRow[k] = nn.join('、')
        if (newFilledRow && newFilledRow.detailContent === '是否填写访谈记录表') {
          newFilledRow[k] = nc > 0 ? '是' : ''
        }

        // 老生
        const oc = oldStuCountByDay.get(day) || 0
        const on = oldStuNamesByDay.get(day) || []
        if (oldCountRow) oldCountRow[k] = oc > 0 ? String(oc) : ''
        if (oldNamesRow) oldNamesRow[k] = on.join('、')
        if (oldFilledRow && oldFilledRow.detailContent === '是否填写访谈记录表') {
          oldFilledRow[k] = oc > 0 ? '是' : ''
        }

        // 毕业生
        const gc = gradCountByDay.get(day) || 0
        const gn = gradNamesByDay.get(day) || []
        if (gradCountRow) gradCountRow[k] = gc > 0 ? String(gc) : ''
        if (gradNamesRow) gradNamesRow[k] = gn.join('、')
        if (gradFilledRow && gradFilledRow.detailContent === '是否填写访谈记录表') {
          gradFilledRow[k] = gc > 0 ? '是' : ''
        }

        // 家长
        const pc = parentCountByDay.get(day) || 0
        const pn = parentNamesByDay.get(day) || []
        if (parentCountRow) parentCountRow[k] = pc > 0 ? String(pc) : ''
        if (parentNamesRow) parentNamesRow[k] = pn.join('、')
        if (parentFilledRow && parentFilledRow.detailContent === '是否填写访谈记录表') {
          parentFilledRow[k] = pc > 0 ? '是' : ''
        }

        // 活动
        const tp = activityTimePlaceByDay.get(day) || []
        const ct = activityContentByDay.get(day) || []
        if (activityTimePlaceRow) activityTimePlaceRow[k] = tp.join('\n')
        if (activityContentRow) activityContentRow[k] = ct.join('\n')
      }

      // 再加载本表后端数据，覆盖/补充（以数据库为准）
      const params = new URLSearchParams({
        campus: selectedCampus,
        year: String(selectedYear),
        month: String(selectedMonth),
        teacher: teacherName,
      })
      const res = await fetch(
        `${buildApiUrl('/teaching-quality/reputation-self-check')}?${params.toString()}`,
      )
      if (!res.ok) throw new Error(await res.text())
      const data = (await res.json()) as {
        神殿名称: string
        年份: number
        月份: number
        班主任姓名: string
        行列表: Array<{ 事件: string; 详细内容: string; 日填报: Record<string, string | null> }>
      }
      
      // 基于模板填充（数据库值覆盖自动汇总）
      // 同时识别自定义内容（不在模板中的内容）
      const templateKeys = new Set(tpl.map(r => `${r.category}__${r.detailContent}`))
      
      for (const row of data.行列表 || []) {
        const target = tpl.find((r) => r.category === row.事件 && r.detailContent === row.详细内容)
        const mapTarget =
          target ||
          (() => {
            // 判断是否为自定义内容（不在模板中）
            const isCustom = !templateKeys.has(`${row.事件}__${row.详细内容}`)
            const r = {
              key: isCustom ? `custom-${Date.now()}-${Math.random()}` : `${row.事件}-${row.详细内容}`,
              category: row.事件,
              detailContent: row.详细内容,
            } as WorkSelfCheckRecord
            for (let d = 1; d <= daysInMonth; d++) r[String(d)] = ''
            
            // 自定义内容需要插入到正确的位置
            if (isCustom) {
              if (row.事件 === '线上宣传') {
                // 线上宣传：插入到"当天合计"之前
                const totalIndex = tpl.findIndex(
                  (item) => item.category === '线上宣传' && item.detailContent === '当天合计'
                )
                if (totalIndex !== -1) {
                  tpl.splice(totalIndex, 0, r)
                } else {
                  tpl.push(r)
                }
              } else {
                // 其他分类：插入到该分类的末尾
                let inserted = false
                for (let i = tpl.length - 1; i >= 0; i--) {
                  if (tpl[i].category === row.事件) {
                    tpl.splice(i + 1, 0, r)
                    inserted = true
                    break
                  }
                }
                if (!inserted) {
                  tpl.push(r)
                }
              }
            } else {
              tpl.push(r)
            }
            return r
          })()
        const payload = row.日填报 || {}
        for (let d = 1; d <= daysInMonth; d++) {
          const k = String(d)
          if (payload[k] !== undefined && payload[k] !== null)
            mapTarget[k] = String(payload[k] ?? '')
        }
      }
      setDataSource(tpl)
      return
    } catch (e: any) {
      console.error(e)
      message.error('加载失败: ' + (e?.message || '未知错误'))
    } finally {
      setLoading(false)
    }
  }, [selectedCampus, selectedYear, selectedMonth, teacherName, daysInMonth])

  useEffect(() => {
    loadSelfCheck()
  }, [loadSelfCheck])

  // 处理刷新 - 使用 useCallback
  const handleRefresh = useCallback(() => {
    loadSelfCheck()
    message.success(MESSAGES.REFRESH_SUCCESS)
  }, [loadSelfCheck])

  // 处理导出 - 使用 useCallback
  const handleExport = useCallback(() => {
    message.info(MESSAGES.EXPORT_DEVELOPING)
  }, [])

  // 处理保存（始终显示） - 使用 useCallback
  const handleSave = useCallback(async () => {
    // 基础校验：避免发出后端必填字段缺失的请求（这类通常会导致 500 或校验异常）
    if (!selectedCampus) {
      message.warning('请先选择神殿')
      return
    }
    if (!teacherName) {
      message.warning('请先选择班主任')
      return
    }

    try {
      setSaving(true)

      // 关键：确保 payload 的天数与当前“选择的年月”匹配
      // 避免出现“月份变了，但 dataSource 还是旧月份(例如31天)的数据”，导致后端按当月天数校验时报错
      const daysForSelected = getDaysInMonth(selectedYear, selectedMonth)

      const payload = {
        神殿名称: selectedCampus,
        年份: selectedYear,
        月份: selectedMonth,
        班主任姓名: teacherName,
        行列表: dataSource.map((r) => {
          const 日填报: Record<string, string> = {}
          for (let d = 1; d <= daysForSelected; d++) {
            const v = r[String(d)]
            if (v !== undefined && v !== null && String(v).trim() !== '') {
              日填报[String(d)] = String(v)
            }
          }
          // 注意：即使日填报为空，也要保存该行（特别是自定义内容）
          return { 事件: r.category, 详细内容: r.detailContent, 日填报 }
        }),
      }

      console.log('保存数据payload:', JSON.stringify(payload, null, 2))

      const res = await fetch(buildApiUrl('/teaching-quality/reputation-self-check'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      
      if (!res.ok) {
        const errorText = await res.text()
        console.error('保存失败，后端返回:', errorText)
        throw new Error(errorText)
      }

      const responseData = await res.json()
      console.log('保存成功，后端返回:', responseData)

      message.success(MESSAGES.SAVE_SUCCESS)
      setEditMode(false)
      await loadSelfCheck()
    } catch (e: any) {
      console.error(e)
      message.error('保存失败: ' + (e?.message || '未知错误'))
    } finally {
      setSaving(false)
    }
  }, [selectedCampus, selectedYear, selectedMonth, teacherName, dataSource, loadSelfCheck])

  // 处理编辑模式切换 - 使用 useCallback
  const handleEditToggle = useCallback(() => {
    setEditMode((prev) => !prev)
  }, [])

  // 处理新增详细内容
  const handleAddDetail = useCallback(() => {
    addForm.resetFields()
    setAddModalVisible(true)
  }, [addForm])

  // 处理新增确认
  const handleAddConfirm = useCallback(async () => {
    try {
      const values = await addForm.validateFields()
      const { category, detailContent } = values

      // 检查是否已存在相同的详细内容
      const exists = dataSource.some(
        (item) => item.category === category && item.detailContent === detailContent
      )

      if (exists) {
        message.warning('该详细内容已存在，请勿重复添加')
        return
      }

      // 创建新行
      const newRow: WorkSelfCheckRecord = {
        key: `custom-${Date.now()}`,
        category,
        detailContent,
      }

      // 初始化所有日期字段
      for (let day = 1; day <= daysInMonth; day++) {
        newRow[day.toString()] = ''
      }

      // 将新行添加到对应分类的合适位置
      setDataSource((prev) => {
        const newData = [...prev]
        let insertIndex = newData.length
        
        // 特殊处理：线上宣传类别，插入到"当天合计"之前
        if (category === '线上宣传') {
          // 找到"当天合计"的位置
          const totalIndex = newData.findIndex(
            (item) => item.category === '线上宣传' && item.detailContent === '当天合计'
          )
          if (totalIndex !== -1) {
            // 插入到"当天合计"之前
            insertIndex = totalIndex
          } else {
            // 如果没有找到"当天合计"，则插入到线上宣传分类的末尾
            for (let i = newData.length - 1; i >= 0; i--) {
              if (newData[i].category === category) {
                insertIndex = i + 1
                break
              }
            }
          }
        } else {
          // 其他分类：插入到该分类的末尾
          for (let i = newData.length - 1; i >= 0; i--) {
            if (newData[i].category === category) {
              insertIndex = i + 1
              break
            }
          }
          // 如果没有找到该分类，则添加到末尾
          if (insertIndex === newData.length) {
            for (let i = 0; i < newData.length; i++) {
              if (newData[i].category === category) {
                insertIndex = i
                while (insertIndex < newData.length && newData[insertIndex].category === category) {
                  insertIndex++
                }
                break
              }
            }
          }
        }
        
        newData.splice(insertIndex, 0, newRow)
        return newData
      })

      message.success('添加成功')
      setAddModalVisible(false)
      addForm.resetFields()
    } catch (error) {
      console.error('添加失败:', error)
    }
  }, [addForm, dataSource, daysInMonth])

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title={
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            <Title level={4} style={{ margin: 0 }}>
              清美教育{selectedCampus || '未选择神殿'}教化司{teacherName}工作自查表
            </Title>
            <div style={{ fontSize: '14px', fontWeight: 'normal', color: '#666' }}>
              班主任姓名：{teacherName}
            </div>
          </Space>
        }
        extra={
          <Space>
            <Select
              style={{ width: 120 }}
              value={selectedYear}
              onChange={(value) => setSelectedYear(value)}
            >
              {YEAR_OPTIONS.map((option) => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
            <Select
              style={{ width: 100 }}
              value={selectedMonth}
              onChange={(value) => setSelectedMonth(value)}
            >
              {MONTH_OPTIONS.map((option) => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
            <Select
              style={{ width: 180 }}
              value={teacherName || undefined}
              onChange={(value) => setTeacherName(value)}
              placeholder="请选择班主任"
              allowClear
              loading={teacherOptionsLoading}
              showSearch
              optionFilterProp="label"
              filterOption={(input, option) =>
                String(option?.label || '')
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              options={teacherOptions.map((name) => ({ label: name, value: name }))}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddDetail}>
              新增详细内容
            </Button>
            <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={saving}>
              保存
            </Button>
            <Button icon={<EditOutlined />} onClick={handleEditToggle}>
              {editMode ? '退出编辑' : '编辑'}
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={loading}>
              刷新
            </Button>
            <Button icon={<DownloadOutlined />} onClick={handleExport}>
              导出
            </Button>
          </Space>
        }
      >
        <div
          style={{
            marginBottom: '16px',
            padding: '12px',
            background: '#f0f9ff',
            borderRadius: '4px',
          }}
        >
          <Space direction="vertical" size={4}>
            <div>
              <strong>口碑目标：</strong>
              {TIPS.GOAL}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>{TIPS.NOTE}</div>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={dataSource}
          loading={loading}
          pagination={false}
          bordered
          scroll={{ x: 'max-content', y: TABLE_CONFIG.SCROLL_Y_HEIGHT }}
          size="small"
          rowKey="key"
        />

        <style>{`
          .ant-table-cell {
            padding: 8px 4px !important;
            font-size: 12px;
          }
          .ant-input-textarea {
            border: 1px dashed #d9d9d9;
          }
          .ant-input-textarea:hover,
          .ant-input-textarea:focus {
            border-color: #40a9ff;
          }
        `}</style>
      </Card>

      {/* 新增详细内容弹窗 */}
      <Modal
        title="新增详细内容"
        open={addModalVisible}
        onOk={handleAddConfirm}
        onCancel={() => {
          setAddModalVisible(false)
          addForm.resetFields()
        }}
        okText="确定"
        cancelText="取消"
        width={500}
      >
        <Form form={addForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            label="事件类别"
            name="category"
            rules={[{ required: true, message: '请选择事件类别' }]}
          >
            <Select placeholder="请选择事件类别">
              <Option value="访谈">访谈</Option>
              <Option value="活动">活动</Option>
              <Option value="线上宣传">线上宣传</Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="详细内容"
            name="detailContent"
            rules={[
              { required: true, message: '请输入详细内容' },
              { max: 100, message: '详细内容不能超过100个字符' },
            ]}
          >
            <Input.TextArea
              placeholder="请输入详细内容，例如：企业参观次数、校友回访次数等"
              autoSize={{ minRows: 2, maxRows: 4 }}
              showCount
              maxLength={100}
            />
          </Form.Item>
          <div style={{ fontSize: '12px', color: '#999', marginTop: -8 }}>
            提示：新增的详细内容将添加到对应事件类别的末尾，可以在表格中填写每日数据
          </div>
        </Form>
      </Modal>
    </div>
  )
}

export default ReputationEnrollmentPlanExecutionTable
