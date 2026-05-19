// 学术->学术经理->管理表格 清美教育XX神殿智慧司日工作总结（严格版）
import React, { useEffect, useMemo, useState, useRef } from 'react'
import { App, Card, Table, Input, DatePicker, Space, Button, Typography, Select } from 'antd'
import type { RangePickerProps } from 'antd/es/date-picker'
import { FileExcelOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { Dayjs } from 'dayjs'
import { useCampusStore } from '@/stores/campusStore'
import { getDailySummaryGroups, saveDailySummary, getDailySummaryRange } from '@/services/academicDailyWorkSummary'
import type { DailyTaskBackend } from '@/services/academicDailyWorkSummary'
import { fetchTeachers, fetchClasses, type TeacherProfile, type ClassProfile } from '@/services/configMaster'
import * as XLSX from 'xlsx'

const { TextArea } = Input
const { Title, Text } = Typography

const DEFAULT_TASK_ROWS = 6
const DEFAULT_PROBLEM_TEMPLATE =
  '1、当天出勤：S32107班应出勤：  人，实际出勤：  人，未出勤：  人；出勤率  %。\n' +
  '2、学生学习状态：\n' +
  '3、当天作业提交率：S32107班应交作业： 人，实际交作业：  人，未交：  人；提交率  %。\n' +
  '4、当天作业合格率：  %\n' +
  '5、学生访谈情况：  \n' +
  '5、与班主任沟通情况：\n' +
  '6、口碑情况：\n' +
  '7、其他情况：'

const getWeekdayLabel = (dateStr: string) => {
  if (!dateStr) return ''
  const dateValue = dayjs(dateStr)
  return ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][dateValue.day()]
}

type TaskRow = {
  key: string
  serialNumber: number
  taskName: string
  taskDescription: string
  taskGoal: string
  executionTime: string
  deadline: string
  result: string
}

type SummaryGroup = {
  key: string
  executor: string
  className: string
  date: string
  tasks: TaskRow[]
  problems: string
}

type TableRow = TaskRow & {
  rowType: 'task' | 'problem'
}

const buildEmptyTask = (groupKey: string, serialNumber: number): TaskRow => ({
  key: `${groupKey}-task-${serialNumber}`,
  serialNumber,
  taskName: '',
  taskDescription: '',
  taskGoal: '',
  executionTime: '',
  deadline: '',
  result: '',
})

const buildEmptyTasks = (
  groupKey: string,
  count = DEFAULT_TASK_ROWS,
  startSerial = 1,
): TaskRow[] =>
  Array.from({ length: count }).map((_, i) => buildEmptyTask(groupKey, startSerial + i))

const buildEmptyGroup = (defaultDate: string): SummaryGroup => {
  const key = `group-${Date.now()}-${Math.random().toString(16).slice(2)}`
  return {
    key,
    executor: '',
    className: '',
    date: defaultDate,
    tasks: buildEmptyTasks(key),
    problems: DEFAULT_PROBLEM_TEMPLATE,
  }
}

const normalizeTasks = (groupKey: string, tasks: TaskRow[]): TaskRow[] =>
  tasks.map((task, idx) => ({
    ...task,
    key: task.key || `${groupKey}-task-${task.serialNumber || idx + 1}`,
    // 保持原始序号，不要重新编号
    serialNumber: task.serialNumber || idx + 1,
  }))

const ensureTaskRows = (groupKey: string, tasks: TaskRow[]): TaskRow[] => {
  // 如果任务为空，返回空任务数组
  if (!tasks || tasks.length === 0) {
    console.warn('[ensureTaskRows] 任务数组为空，返回空数组')
    return buildEmptyTasks(groupKey, DEFAULT_TASK_ROWS, 1)
  }
  
  const normalized = normalizeTasks(groupKey, tasks)
  console.log('[ensureTaskRows] 规范化后的任务:', normalized.map(t => ({ 序号: t.serialNumber, 名称: t.taskName })))
  
  if (normalized.length >= DEFAULT_TASK_ROWS) {
    return normalized
  }
  const padding = buildEmptyTasks(groupKey, DEFAULT_TASK_ROWS - normalized.length, normalized.length + 1)
  const result = [...normalized, ...padding]
  console.log('[ensureTaskRows] 最终任务数组:', result.map(t => ({ 序号: t.serialNumber, 名称: t.taskName })))
  return result
}

const DailyWorkSummaryPage: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore()
  const campusName = currentCampus || '主神殿'
  const initialDate = dayjs()
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([initialDate, initialDate])
  const [groups, setGroups] = useState<SummaryGroup[]>([buildEmptyGroup(initialDate.format('YYYY-MM-DD'))])
  const [teacherOptions, setTeacherOptions] = useState<string[]>([])
  const [classOptions, setClassOptions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [importLoading, setImportLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // 计算日期范围字符串
  const startDateStr = useMemo(() => dateRange[0]?.format('YYYY-MM-DD') || '', [dateRange])
  const endDateStr = useMemo(() => dateRange[1]?.format('YYYY-MM-DD') || '', [dateRange])
  const dayStr = useMemo(() => dateRange[0]?.format('YYYY-MM-DD') || initialDate.format('YYYY-MM-DD'), [dateRange])

  const loadData = async () => {
    if (!campusName) {
      message.warning('请先选择神殿')
      return
    }
    if (!dateRange[0] || !dateRange[1]) {
      message.warning('请选择日期范围')
      return
    }
    setLoading(true)
    try {
      const startDate = dateRange[0].format('YYYY-MM-DD')
      const endDate = dateRange[1].format('YYYY-MM-DD')
      
      console.log('[日工作总结查询] 开始查询:', {
        神殿: campusName,
        开始日期: startDate,
        结束日期: endDate,
      })
      
      // 如果开始日期和结束日期相同，使用单日查询
      let res: any[]
      if (startDate === endDate) {
        res = await getDailySummaryGroups(campusName, startDate)
      } else {
        res = await getDailySummaryRange(campusName, startDate, endDate)
      }
      
      console.log('[日工作总结查询] 查询结果:', {
        记录数: res?.length || 0,
        数据: res?.map(g => ({ 日期: g.日期, 执行人: g.执行人, 班级: g.班级, 任务数: g.行数据?.length || 0 })),
      })
      
      if (!res || res.length === 0) {
        console.log('[日工作总结查询] 未找到数据，显示空表单')
        setGroups([buildEmptyGroup(startDate)])
        return
      }
      
      // 验证返回的数据是否都在日期范围内（双重验证，确保数据正确）
      const startDateObj = dayjs(startDate, 'YYYY-MM-DD')
      const endDateObj = dayjs(endDate, 'YYYY-MM-DD')
      
      // 确保 startDateObj 和 endDateObj 是有效的
      if (!startDateObj.isValid() || !endDateObj.isValid()) {
        console.error('[日工作总结查询] 日期范围无效:', { startDate, endDate })
        message.error('日期范围无效，请重新选择')
        setLoading(false)
        return
      }
      
      const mapped = res
        .filter((group) => {
          // 确保返回的数据日期在查询范围内
          if (group.日期) {
            try {
              // 确保 group.日期 是字符串，然后转换为 dayjs 对象
              const dateStr = String(group.日期).trim()
              const groupDate = dayjs(dateStr, 'YYYY-MM-DD')
              
              // 验证日期是否有效
              if (!groupDate.isValid()) {
                console.warn('[日工作总结查询] 无效的日期格式，跳过:', {
                  数据日期: group.日期,
                  日期类型: typeof group.日期,
                  日期字符串: dateStr,
                })
                return false
              }
              
              // 使用原生比较方法，避免依赖插件
              // isSameOrAfter: groupDate >= startDateObj (同一天或之后)
              // isSameOrBefore: groupDate <= endDateObj (同一天或之前)
              const groupDateStart = groupDate.startOf('day')
              const startDateStart = startDateObj.startOf('day')
              const endDateStart = endDateObj.startOf('day')
              
              const isAfterStart = groupDateStart.isAfter(startDateStart) || groupDateStart.isSame(startDateStart, 'day')
              const isBeforeEnd = groupDateStart.isBefore(endDateStart) || groupDateStart.isSame(endDateStart, 'day')
              const inRange = isAfterStart && isBeforeEnd
              
              if (!inRange) {
                console.warn('[日工作总结查询] 数据日期不在范围内，跳过:', {
                  数据日期: group.日期,
                  数据日期对象: groupDate.format('YYYY-MM-DD'),
                  查询范围: `${startDate} 至 ${endDate}`,
                })
              }
              return inRange
            } catch (error) {
              console.error('[日工作总结查询] 日期解析错误:', {
                数据日期: group.日期,
                错误: error,
              })
              return false
            }
          }
          return true
        })
        .map((group, idx) => {
          const rows = group.行数据 || []
          console.log('[日工作总结查询] 处理分组:', {
            索引: idx,
            日期: group.日期,
            执行人: group.执行人,
            班级: group.班级,
            任务数: rows.length,
            原始数据: rows.map(r => ({
              序号: r.序号,
              任务名称: r.任务名称,
              任务描述: r.任务描述,
            })),
          })
          
          // 确保行数据存在且不为空
          if (!rows || rows.length === 0) {
            console.warn('[日工作总结查询] 分组没有行数据，跳过:', {
              日期: group.日期,
              执行人: group.执行人,
              班级: group.班级,
            })
            return null
          }
          
          const tasksFromBackend: TaskRow[] = rows
            .sort((a, b) => (a.序号 || 0) - (b.序号 || 0))
            .map((r, i) => {
              const task: TaskRow = {
                key: `${group.执行人 || 'executor'}-${group.班级 || 'class'}-${group.日期 || startDate}-${r.序号 || i + 1}`,
                serialNumber: r.序号 || i + 1, // 使用后端返回的原始序号
                taskName: r.任务名称 || '',
                taskDescription: r.任务描述 || '',
                taskGoal: r.任务目标 || '',
                executionTime: r.执行时间 || '',
                deadline: r.最后完成期限 || '',
                result: r.结果 || '',
              }
              console.log('[日工作总结查询] 映射任务:', {
                序号: task.serialNumber,
                任务名称: task.taskName,
                任务描述: task.taskDescription,
              })
              return task
            })
          
          console.log('[日工作总结查询] 映射后的任务列表:', tasksFromBackend.map(t => ({
            序号: t.serialNumber,
            任务名称: t.taskName,
            任务描述: t.taskDescription,
          })))
          
          const groupKey = `group-${idx}-${Date.now()}`
          const finalGroup = {
            key: groupKey,
            executor: group.执行人 || '',
            className: group.班级 || '',
            date: group.日期 || startDate,
            tasks: ensureTaskRows(groupKey, tasksFromBackend),
            problems: group.备注 || DEFAULT_PROBLEM_TEMPLATE,
          }
          
          console.log('[日工作总结查询] 最终分组:', {
            key: finalGroup.key,
            executor: finalGroup.executor,
            className: finalGroup.className,
            date: finalGroup.date,
            任务数: finalGroup.tasks.length,
            实际任务: finalGroup.tasks.filter(t => t.taskName).map(t => ({
              序号: t.serialNumber,
              名称: t.taskName,
            })),
          })
          
          return finalGroup
        })
        .filter((g): g is SummaryGroup => g !== null) // 过滤掉 null 值
      
      console.log('[日工作总结查询] 处理后的数据:', {
        分组数: mapped.length,
        总任务数: mapped.reduce((sum, g) => sum + g.tasks.length, 0),
        分组详情: mapped.map(g => ({
          日期: g.date,
          执行人: g.executor,
          班级: g.className,
          任务数: g.tasks.length,
          任务列表: g.tasks.map(t => ({ 序号: t.serialNumber, 名称: t.taskName })),
        })),
      })
      
      if (mapped.length > 0) {
        console.log('[日工作总结查询] 设置分组到状态，分组数:', mapped.length)
        setGroups(mapped)
      } else {
        console.log('[日工作总结查询] 没有有效数据，显示空表单')
        setGroups([buildEmptyGroup(startDate)])
      }
    } catch (error) {
      console.error('加载日工作总结失败', error)
      message.error('加载失败')
      const startDate = dateRange[0]?.format('YYYY-MM-DD') || dayjs().format('YYYY-MM-DD')
      setGroups([buildEmptyGroup(startDate)])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // 只有当日期范围有效时才加载数据
    if (dateRange[0] && dateRange[1] && campusName) {
      loadData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campusName, startDateStr, endDateStr])

  useEffect(() => {
    const loadTeachers = async () => {
      try {
        const teachers = await fetchTeachers({
          campus_name: campusName,
          active: true,
        })
        const names = teachers
          .filter((t: TeacherProfile) => t.is_active !== false)
          .map((t: TeacherProfile) => t.name)
          .filter(Boolean)
        setTeacherOptions(Array.from(new Set(names)))
      } catch (error) {
        console.error('加载教员列表失败', error)
      }
    }
    loadTeachers()
  }, [campusName])

  useEffect(() => {
    const loadClasses = async () => {
      try {
        const classes = await fetchClasses({ active: true })
        const names = classes
          .filter((c: ClassProfile) => !c.campus_name || c.campus_name === campusName)
          .map((c: ClassProfile) => c.class_name)
          .filter(Boolean)
        setClassOptions(Array.from(new Set(names)))
      } catch (error) {
        console.error('加载班级列表失败', error)
      }
    }
    loadClasses()
  }, [campusName])

  const updateGroup = (groupIndex: number, patch: Partial<SummaryGroup>) => {
    setGroups((prev) => prev.map((group, idx) => (idx === groupIndex ? { ...group, ...patch } : group)))
  }

  const updateTask = (groupIndex: number, rowIndex: number, patch: Partial<TaskRow>) => {
    setGroups((prev) =>
      prev.map((group, idx) => {
        if (idx !== groupIndex) return group
        const nextTasks = group.tasks.map((task, tIdx) =>
          tIdx === rowIndex ? { ...task, ...patch } : task,
        )
        return { ...group, tasks: nextTasks }
      }),
    )
  }

  const handleAddGroup = () => {
    setGroups((prev) => [...prev, buildEmptyGroup(dayStr)])
  }

  const handleAddTaskRow = (groupIndex: number) => {
    setGroups((prev) =>
      prev.map((group, idx) => {
        if (idx !== groupIndex) return group
        const nextSerial = group.tasks.length + 1
        const newTask = buildEmptyTask(group.key, nextSerial)
        const nextTasks = normalizeTasks(group.key, [...group.tasks, newTask])
        return { ...group, tasks: nextTasks }
      }),
    )
  }

  const handleRemoveGroup = (groupIndex: number) => {
    if (groups.length <= 1) {
      message.warning('至少保留一个表单')
      return
    }
    setGroups((prev) => prev.filter((_, idx) => idx !== groupIndex))
  }

  const buildBackendRows = (tasks: TaskRow[]): DailyTaskBackend[] =>
    tasks.map((t, idx) => ({
      序号: t.serialNumber || idx + 1,
      任务名称: t.taskName || undefined,
      任务描述: t.taskDescription || undefined,
      任务目标: t.taskGoal || undefined,
      执行时间: t.executionTime || undefined,
      最后完成期限: t.deadline || undefined,
      结果: t.result || undefined,
    }))

  const handleSaveAll = async () => {
    if (!campusName || !dayStr) {
      message.warning('请先选择神殿与日期')
      return
    }
    const missingExecutor = groups.find((group) => !group.executor.trim())
    if (missingExecutor) {
      message.warning('请填写执行人')
      return
    }
    const missingDate = groups.find((group) => !group.date)
    if (missingDate) {
      message.warning('请为每个表单选择日期')
      return
    }
    setSaving(true)
    try {
      let savedCount = 0
      for (const group of groups) {
        // 过滤掉空任务（所有字段都为空）
        const validTasks = group.tasks.filter(
          (task) =>
            task.taskName.trim() ||
            task.taskDescription.trim() ||
            task.taskGoal.trim() ||
            task.executionTime.trim() ||
            task.deadline.trim() ||
            task.result.trim(),
        )
        
        if (validTasks.length === 0 && !group.problems.trim()) {
          console.warn('[保存] 跳过空组:', group.executor, group.className)
          continue
        }
        
        await saveDailySummary(campusName, group.date, {
          星期: getWeekdayLabel(group.date),
          执行人: group.executor,
          班级: group.className || '',
          备注: group.problems,
          行数据: buildBackendRows(validTasks),
        })
        savedCount++
        console.log('[保存] 已保存:', group.executor, group.className, group.date, '任务数:', validTasks.length)
      }
      message.success(`已保存 ${savedCount} 个执行人的工作总结`)
      await loadData()
    } catch (error) {
      console.error('保存失败', error)
      message.error('保存失败')
    } finally {
      setSaving(false)
    }
  }

  const buildColumns = (groupIndex: number, taskCount: number): ColumnsType<TableRow> => [
    {
      title: '日期',
      dataIndex: 'date',
      width: 120,
      align: 'center',
      onCell: (_record, index) => ({ rowSpan: index === 0 ? taskCount + 1 : 0 }),
      render: () => (
        <DatePicker
          value={groups[groupIndex]?.date ? dayjs(groups[groupIndex].date) : null}
          onChange={(val) => updateGroup(groupIndex, { date: val ? val.format('YYYY-MM-DD') : '' })}
        />
      ),
    },
    {
      title: '星期',
      dataIndex: 'weekday',
      width: 80,
      align: 'center',
      onCell: (_record, index) => ({ rowSpan: index === 0 ? taskCount + 1 : 0 }),
      render: () => getWeekdayLabel(groups[groupIndex]?.date || ''),
    },
    {
      title: '班级',
      dataIndex: 'className',
      width: 120,
      align: 'center',
      onCell: (_record, index) => ({ rowSpan: index === 0 ? taskCount + 1 : 0 }),
      render: () => (
        <Select
          value={groups[groupIndex]?.className || undefined}
          placeholder="选择班级"
          allowClear
          showSearch
          style={{ width: '100%' }}
          options={classOptions.map((name) => ({ label: name, value: name }))}
          filterOption={(input, option) =>
            (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
          }
          onChange={(val) => updateGroup(groupIndex, { className: val || '' })}
        />
      ),
    },
    {
      title: '执行人',
      dataIndex: 'executor',
      width: 140,
      align: 'center',
      onCell: (_record, index) => ({ rowSpan: index === 0 ? taskCount + 1 : 0 }),
      render: () => (
        <Select
          value={groups[groupIndex]?.executor || undefined}
          placeholder="选择教员"
          allowClear
          showSearch
          style={{ width: '100%' }}
          options={teacherOptions.map((name) => ({ label: name, value: name }))}
          filterOption={(input, option) =>
            (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
          }
          onChange={(val) => updateGroup(groupIndex, { executor: val || '' })}
        />
      ),
    },
    {
      title: '序号',
      dataIndex: 'serialNumber',
      width: 60,
      align: 'center',
      render: (value, record) => (record.rowType === 'problem' ? '问题' : value),
    },
    {
      title: '任务名称',
      dataIndex: 'taskName',
      width: 180,
      render: (value, record) => {
        if (record.rowType === 'problem') {
          return {
            children: (
              <TextArea
                value={groups[groupIndex]?.problems}
                onChange={(e) => updateGroup(groupIndex, { problems: e.target.value })}
                autoSize={{ minRows: 6, maxRows: 10 }}
              />
            ),
            props: { colSpan: 6 },
          }
        }
        return (
          <Input
            value={value}
            onChange={(e) => updateTask(groupIndex, record.serialNumber - 1, { taskName: e.target.value })}
          />
        )
      },
    },
    {
      title: '任务描述',
      dataIndex: 'taskDescription',
      width: 220,
      render: (value, record) => {
        if (record.rowType === 'problem') {
          return { children: null, props: { colSpan: 0 } }
        }
        return (
          <Input
            value={value}
            onChange={(e) => updateTask(groupIndex, record.serialNumber - 1, { taskDescription: e.target.value })}
          />
        )
      },
    },
    {
      title: '任务目标',
      dataIndex: 'taskGoal',
      width: 180,
      render: (value, record) => {
        if (record.rowType === 'problem') {
          return { children: null, props: { colSpan: 0 } }
        }
        return (
          <Input
            value={value}
            onChange={(e) => updateTask(groupIndex, record.serialNumber - 1, { taskGoal: e.target.value })}
          />
        )
      },
    },
    {
      title: '执行时间',
      dataIndex: 'executionTime',
      width: 140,
      render: (value, record) => {
        if (record.rowType === 'problem') {
          return { children: null, props: { colSpan: 0 } }
        }
        return (
          <Input
            placeholder="如 09:00-10:00"
            value={value}
            onChange={(e) => updateTask(groupIndex, record.serialNumber - 1, { executionTime: e.target.value })}
          />
        )
      },
    },
    {
      title: '最后完成期限',
      dataIndex: 'deadline',
      width: 160,
      render: (value, record) => {
        if (record.rowType === 'problem') {
          return { children: null, props: { colSpan: 0 } }
        }
        // 使用当前日期作为占位符示例
        const today = dayjs().format('YYYY-MM-DD')
        return (
          <Input
            placeholder={`如 ${today} 18:00`}
            value={value}
            onChange={(e) => updateTask(groupIndex, record.serialNumber - 1, { deadline: e.target.value })}
          />
        )
      },
    },
    {
      title: '结果',
      dataIndex: 'result',
      width: 120,
      render: (value, record) => {
        if (record.rowType === 'problem') {
          return { children: null, props: { colSpan: 0 } }
        }
        return (
          <Input
            value={value}
            onChange={(e) => updateTask(groupIndex, record.serialNumber - 1, { result: e.target.value })}
          />
        )
      },
    },
  ]

  const buildTableData = (group: SummaryGroup): TableRow[] => {
    const tasks = group.tasks.map((task) => ({ ...task, rowType: 'task' as const }))
    const problemRow: TableRow = {
      key: `${group.key}-problem`,
      serialNumber: group.tasks.length + 1,
      taskName: '',
      taskDescription: '',
      taskGoal: '',
      executionTime: '',
      deadline: '',
      result: '',
      rowType: 'problem',
    }
    return [...tasks, problemRow]
  }

  /**
   * 检查行是否为空行
   */
  const isEmptyRow = (row: any[]): boolean => {
    if (!row || row.length === 0) return true
    return row.every((cell) => !cell || String(cell).trim() === '')
  }

  /**
   * 解析单个单位的数据（一个执行人+班级+日期的组合）
   * 返回可能是一个或多个SummaryGroup（如果单位中有不同日期的任务）
   */
  const parseUnit = (
    unitRows: any[][],
    headerMap: Record<string, number>,
    defaultDate: string,
  ): SummaryGroup[] | null => {
    if (unitRows.length === 0) return null

    console.log('[Excel导入] 解析单位，行数:', unitRows.length)

    // 1. 查找表头行（包含"序号"、"任务名称"等）
    let headerRowIndex = -1
    for (let i = 0; i < Math.min(10, unitRows.length); i++) {
      const row = unitRows[i]
      if (isEmptyRow(row)) continue
      
      const rowStr = row.map((c) => String(c || '').trim())
      const hasSerial = rowStr.some((cell) => cell.includes('序号') || cell === '序号')
      const hasTaskName = rowStr.some((cell) => cell.includes('任务名称') || cell.includes('任务'))
      
      // 更宽松的匹配：只要有序号或任务名称之一，且该行包含多个列
      if ((hasSerial || hasTaskName) && rowStr.filter(c => c).length >= 3) {
        headerRowIndex = i
        console.log('[Excel导入] 单位中找到表头行:', i, '包含列数:', rowStr.filter(c => c).length)
        break
      }
    }

    // 如果没找到表头行，但单位有数据，尝试使用全局表头映射
    if (headerRowIndex < 0) {
      // 检查是否有任务数据（序号列有数字）或问题数据
      let hasTaskData = false
      let hasProblemData = false
      let hasAnyData = false
      
      for (let i = 0; i < unitRows.length; i++) {
        const row = unitRows[i]
        if (isEmptyRow(row)) continue
        
        hasAnyData = true
        
        const serialCell = headerMap['serialNumber'] !== undefined 
          ? String(row[headerMap['serialNumber']] || '').trim() 
          : ''
        const taskNameCell = headerMap['taskName'] !== undefined 
          ? String(row[headerMap['taskName']] || '').trim() 
          : ''
        
        if (serialCell.match(/^\d+$/)) {
          hasTaskData = true
        }
        if (serialCell === '问题' || (!serialCell.match(/^\d+$/) && !taskNameCell && serialCell !== '')) {
          hasProblemData = true
        }
      }
      
      // 只要单位有任何数据，就尝试解析（使用全局表头映射）
      if (hasAnyData) {
        headerRowIndex = -1
        console.log('[Excel导入] 单位中未找到表头行，但检测到数据，使用全局表头映射')
      } else {
        console.warn('[Excel导入] 单位中未找到表头行且无有效数据，跳过，行数:', unitRows.length)
        return null
      }
    }

    // 2. 从表头行或前几行提取分组信息（日期、星期、班级、执行人）
    // 重要：每个单位都应该独立解析，不能使用前一个单位的值
    let unitDate = defaultDate
    let unitWeekday = ''
    let unitClassName = ''
    let unitExecutor = ''
    
    // 重置单位级别的信息，确保每个单位都是独立解析
    console.log('[Excel导入] 开始解析单位，重置单位级别信息')

    // 在表头行之前查找分组信息（如果headerRowIndex为-1，则从所有行查找）
    const searchStartRow = 0
    const searchEndRow = headerRowIndex >= 0 ? headerRowIndex : Math.min(10, unitRows.length)
    
    for (let i = searchStartRow; i < searchEndRow; i++) {
      const row = unitRows[i]
      if (isEmptyRow(row)) continue
      
      const rowStr = row.map((c) => String(c || '').trim())
      
      rowStr.forEach((cell, index) => {
        const cellLower = cell.toLowerCase()
        if (cellLower.includes('日期') || cellLower === '日期') {
          // 下一列可能是日期值
          if (index + 1 < row.length) {
            const dateValue = row[index + 1]
            if (dateValue) {
              try {
                const parsed = dayjs(dateValue)
                if (parsed.isValid()) {
                  unitDate = parsed.format('YYYY-MM-DD')
                  unitWeekday = getWeekdayLabel(unitDate)
                }
              } catch {
                // 尝试直接使用
                unitDate = String(dateValue).trim()
              }
            }
          }
        } else if (cellLower.includes('星期') || cellLower === '星期') {
          if (index + 1 < row.length) {
            unitWeekday = String(row[index + 1] || '').trim()
          }
        } else if (cellLower.includes('班级') || cellLower === '班级') {
          if (index + 1 < row.length) {
            unitClassName = String(row[index + 1] || '').trim()
          }
        } else if (cellLower.includes('执行人') || cellLower === '执行人') {
          if (index + 1 < row.length) {
            unitExecutor = String(row[index + 1] || '').trim()
          }
        }
      })
    }

    // 如果表头行之前没找到，尝试从表头行本身查找（如果存在）
    if ((!unitDate || !unitExecutor) && headerRowIndex >= 0) {
      const headerRow = unitRows[headerRowIndex]
      if (headerRow) {
        const headerRowStr = headerRow.map((c) => String(c || '').trim())
        
        headerRowStr.forEach((cell, index) => {
          const cellLower = cell.toLowerCase()
          if ((cellLower.includes('日期') || cellLower === '日期') && !unitDate) {
            if (headerRowIndex + 1 < unitRows.length) {
              const nextRow = unitRows[headerRowIndex + 1]
              if (nextRow && index < nextRow.length) {
                const dateValue = nextRow[index]
                if (dateValue) {
                  try {
                    const parsed = dayjs(dateValue)
                    if (parsed.isValid()) {
                      unitDate = parsed.format('YYYY-MM-DD')
                      unitWeekday = getWeekdayLabel(unitDate)
                    }
                  } catch {
                    unitDate = String(dateValue).trim()
                  }
                }
              }
            }
          } else if ((cellLower.includes('执行人') || cellLower === '执行人') && !unitExecutor) {
            if (headerRowIndex + 1 < unitRows.length) {
              const nextRow = unitRows[headerRowIndex + 1]
              if (nextRow && index < nextRow.length) {
                unitExecutor = String(nextRow[index] || '').trim()
              }
            }
          } else if ((cellLower.includes('班级') || cellLower === '班级') && !unitClassName) {
            if (headerRowIndex + 1 < unitRows.length) {
              const nextRow = unitRows[headerRowIndex + 1]
              if (nextRow && index < nextRow.length) {
                unitClassName = String(nextRow[index] || '').trim()
              }
            }
          }
        })
      }
    }

    // 3. 解析任务行和问题行
    const tasks: TaskRow[] = []
    let problemsText = ''
    
    // 预先从第一行数据读取日期（如果存在），用于后续任务行
    let firstRowDate: string | null = null
    const dataStartRow = headerRowIndex >= 0 ? headerRowIndex + 1 : 0
    if (dataStartRow < unitRows.length && headerMap['date'] !== undefined) {
      const firstRow = unitRows[dataStartRow]
      if (firstRow) {
        const firstDateValue = firstRow[headerMap['date']]
        if (firstDateValue !== null && firstDateValue !== undefined && firstDateValue !== '') {
          try {
            let parsed: Dayjs | null = null
            if (typeof firstDateValue === 'number' && firstDateValue > 1 && firstDateValue < 1000000) {
              const excelEpoch = dayjs('1899-12-30')
              parsed = excelEpoch.add(Math.floor(firstDateValue), 'day')
            } else {
              const dateStr = String(firstDateValue).trim()
              if (dateStr) {
                // 处理 "2024.7.4" 格式
                let normalizedDateStr = dateStr.replace(/\./g, '-').replace(/\s/g, '')
                const match = normalizedDateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
                if (match) {
                  const year = match[1]
                  const month = String(match[2]).padStart(2, '0')
                  const day = String(match[3]).padStart(2, '0')
                  normalizedDateStr = `${year}-${month}-${day}`
                }
                parsed = dayjs(normalizedDateStr)
              }
            }
            if (parsed && parsed.isValid()) {
              firstRowDate = parsed.format('YYYY-MM-DD')
              // 如果单位级别没有日期，使用第一行的日期
              if (!unitDate || unitDate === defaultDate) {
                unitDate = firstRowDate
                unitWeekday = getWeekdayLabel(firstRowDate)
                console.log('[Excel导入] 从第一行数据读取并更新单位日期:', firstDateValue, '->', firstRowDate)
              }
            }
          } catch (error) {
            console.warn('[Excel导入] 解析第一行日期失败:', firstDateValue, error)
          }
        }
      }
    }

    // 如果headerRowIndex为-1，说明使用全局表头，从第一行开始解析
    for (let i = dataStartRow; i < unitRows.length; i++) {
      const row = unitRows[i]
      if (isEmptyRow(row)) continue

      const serialCell = headerMap['serialNumber'] !== undefined ? String(row[headerMap['serialNumber']] || '').trim() : ''
      const taskNameCell = headerMap['taskName'] !== undefined ? String(row[headerMap['taskName']] || '').trim() : ''

      // 检查是否是问题行
      // 1. 序号列是"问题"
      // 2. 或者序号为空/非数字，且任务名称为空或"问题"
      const isProblemRow =
        serialCell === '问题' ||
        (taskNameCell === '问题') ||
        (!serialCell.match(/^\d+$/) && !taskNameCell)

      if (isProblemRow) {
        // 收集问题内容（可能跨多列和多行）
        const problemParts: string[] = []
        
        // 从任务名称列或任务描述列开始，收集所有非空列的内容
        const startCol = Math.min(
          headerMap['taskName'] !== undefined ? headerMap['taskName'] : 0,
          headerMap['taskDescription'] !== undefined ? headerMap['taskDescription'] : 0
        )
        
        // 收集当前行及后续可能的问题行（直到遇到空行或下一个任务行）
        let problemRowIndex = i
        let lastNonEmptyRowIndex = i
        
        while (problemRowIndex < unitRows.length) {
          const problemRow = unitRows[problemRowIndex]
          
          // 如果遇到空行，检查是否是问题行的结束
          if (isEmptyRow(problemRow)) {
            // 如果之前有收集到内容，且遇到空行，可能是问题行的结束
            if (problemParts.length > 0 && problemRowIndex > lastNonEmptyRowIndex + 1) {
              break
            }
            problemRowIndex++
            continue
          }
          
          // 检查是否是下一个任务行（序号是数字且任务名称不为空）
          const nextSerialCell = headerMap['serialNumber'] !== undefined 
            ? String(problemRow[headerMap['serialNumber']] || '').trim() 
            : ''
          const nextTaskNameCell = headerMap['taskName'] !== undefined 
            ? String(problemRow[headerMap['taskName']] || '').trim() 
            : ''
          
          // 如果序号是数字且任务名称不为空，说明是下一个任务行
          if (nextSerialCell.match(/^\d+$/) && nextTaskNameCell && problemRowIndex > i) {
            break // 遇到下一个任务行，停止收集
          }
          
          // 收集这一行的内容
          const rowParts: string[] = []
          for (let col = startCol; col < problemRow.length; col++) {
            const cell = String(problemRow[col] || '').trim()
            // 跳过表头关键词和空值
            if (cell && 
                !cell.match(/^(序号|任务名称|任务描述|任务目标|执行时间|最后完成期限|结果|问题)$/) &&
                cell !== '问题' &&
                !cell.match(/^\d+$/)) { // 跳过纯数字（可能是序号）
              rowParts.push(cell)
            }
          }
          
          if (rowParts.length > 0) {
            problemParts.push(rowParts.join(' '))
            lastNonEmptyRowIndex = problemRowIndex
          }
          
          problemRowIndex++
        }
        
        problemsText = problemParts.join('\n').trim()
        
        // 如果问题内容包含典型关键词，认为是有效问题
        if (
          problemsText &&
          (problemsText.includes('出勤') ||
            problemsText.includes('作业') ||
            problemsText.includes('访谈') ||
            problemsText.includes('沟通') ||
            problemsText.includes('口碑') ||
            problemsText.includes('情况') ||
            problemsText.includes('应出勤') ||
            problemsText.includes('实际出勤') ||
            problemsText.includes('提交率') ||
            problemsText.includes('合格率') ||
            problemsText.includes('学习状态') ||
            problemsText.includes('班主任') ||
            problemsText.includes('班') ||
            problemsText.length > 20)
        ) {
          console.log('[Excel导入] 解析问题行，行数:', problemRowIndex - i, '长度:', problemsText.length, '前200字符:', problemsText.substring(0, 200))
          // 跳过已处理的问题行
          i = problemRowIndex - 1
        } else {
          problemsText = ''
        }
        continue
      }

      // 解析任务数据
      const serialNumber = parseInt(serialCell, 10)
      if (!serialNumber && !taskNameCell) continue

      const taskName = taskNameCell
      if (!taskName) continue

      // 从当前行读取日期（如果存在日期列）
      let rowDate: string | null = null
      if (headerMap['date'] !== undefined) {
        const dateValue = row[headerMap['date']]
        if (dateValue !== null && dateValue !== undefined && dateValue !== '') {
          try {
            // 处理Excel序列日期或日期字符串
            let parsed: Dayjs | null = null
            if (typeof dateValue === 'number') {
              // Excel序列日期（整数部分是天数，小数部分是时间）
              // 如果数字很大（>1），可能是日期序列号
              if (dateValue > 1 && dateValue < 1000000) {
                const excelEpoch = dayjs('1899-12-30')
                parsed = excelEpoch.add(Math.floor(dateValue), 'day')
              }
            } else {
              const dateStr = String(dateValue).trim()
              if (dateStr) {
                // 尝试解析各种日期格式
                // 处理 "2024.7.4" 这种格式 -> "2024-7-4" -> "2024-07-04"
                let normalizedDateStr = dateStr.replace(/\./g, '-').replace(/\s/g, '')
                // 如果格式是 "2024-7-4"，确保补零
                const match = normalizedDateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
                if (match) {
                  const year = match[1]
                  const month = String(match[2]).padStart(2, '0')
                  const day = String(match[3]).padStart(2, '0')
                  normalizedDateStr = `${year}-${month}-${day}`
                }
                parsed = dayjs(normalizedDateStr)
              }
            }
            if (parsed && parsed.isValid()) {
              rowDate = parsed.format('YYYY-MM-DD')
              console.log('[Excel导入] 从行中读取日期:', dateValue, '->', rowDate)
              // 如果这是第一个读取到的日期，更新单位级别的日期和第一行日期
              if (!unitDate || unitDate === defaultDate) {
                unitDate = rowDate
                unitWeekday = getWeekdayLabel(rowDate)
                firstRowDate = rowDate
                console.log('[Excel导入] 更新单位级别日期:', rowDate)
              }
            }
          } catch (error) {
            console.warn('[Excel导入] 解析行日期失败:', dateValue, error)
          }
        }
      }
      
      // 如果当前行没有日期，使用第一行读取的日期或单位级别的日期
      // 这样可以处理Excel中日期只在第一行的情况
      if (!rowDate) {
        // 优先使用第一行读取的日期（通常这是该单位的实际日期）
        if (firstRowDate) {
          rowDate = firstRowDate
          console.log('[Excel导入] 任务行没有日期，使用第一行日期:', rowDate)
        } else if (unitDate && unitDate !== defaultDate) {
          // 其次使用单位级别的日期（从表头行或前几行提取的）
          rowDate = unitDate
          console.log('[Excel导入] 任务行没有日期，使用单位级别日期:', rowDate)
        } else {
          // 最后使用默认日期（当前选择的日期）
          rowDate = defaultDate
          console.log('[Excel导入] 任务行没有日期，使用默认日期:', rowDate)
        }
      }

      // 从当前行读取执行人和班级（如果存在这些列）
      let rowExecutor = unitExecutor
      let rowClassName = unitClassName
      if (headerMap['executor'] !== undefined) {
        const executorValue = String(row[headerMap['executor']] || '').trim()
        if (executorValue) {
          rowExecutor = executorValue
        }
      }
      if (headerMap['className'] !== undefined) {
        const classNameValue = String(row[headerMap['className']] || '').trim()
        if (classNameValue) {
          rowClassName = classNameValue
        }
      }

      const taskDescription =
        headerMap['taskDescription'] !== undefined ? String(row[headerMap['taskDescription']] || '').trim() : ''
      const taskGoal = headerMap['taskGoal'] !== undefined ? String(row[headerMap['taskGoal']] || '').trim() : ''
      const executionTime =
        headerMap['executionTime'] !== undefined ? String(row[headerMap['executionTime']] || '').trim() : ''
      
      // 处理最后完成期限：可能是Excel时间序列号（小数）或时间字符串
      let deadline = ''
      if (headerMap['deadline'] !== undefined) {
        const deadlineValue = row[headerMap['deadline']]
        if (typeof deadlineValue === 'number' && deadlineValue < 1 && deadlineValue > 0) {
          // Excel时间序列号（0-1之间的小数，表示一天中的时间）
          // 转换为HH:MM格式
          const hours = Math.floor(deadlineValue * 24)
          const minutes = Math.floor((deadlineValue * 24 - hours) * 60)
          deadline = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
          console.log('[Excel导入] 转换时间序列号:', deadlineValue, '->', deadline)
        } else {
          deadline = String(deadlineValue || '').trim()
        }
      }
      
      const result = headerMap['result'] !== undefined ? String(row[headerMap['result']] || '').trim() : ''

      // 将任务信息与日期、执行人、班级一起存储，以便后续按这些字段分组
      tasks.push({
        key: `task-${tasks.length + 1}`,
        serialNumber: serialNumber || tasks.length + 1,
        taskName,
        taskDescription,
        taskGoal,
        executionTime,
        deadline,
        result,
        // 临时存储行级别的日期、执行人、班级信息
        _rowDate: rowDate,
        _rowExecutor: rowExecutor,
        _rowClassName: rowClassName,
      } as any)
    }

    // 重要：只有包含有效任务（有日期）的单位才应该创建表单
    // 如果所有任务都没有日期，跳过该单位，避免创建无效表单
    if (tasks.length === 0) {
      console.warn('[Excel导入] 单位中未找到有效任务（所有任务都缺少日期），跳过该单位')
      return null
    }

    // 按日期、执行人、班级分组任务
    const taskGroups = new Map<string, TaskRow[]>()
    
    tasks.forEach((task: any) => {
      // 确保任务必须有日期（在添加到tasks时已经验证过，这里再次确认）
      const taskDate = task._rowDate
      if (!taskDate) {
        console.warn('[Excel导入] 任务缺少日期，跳过:', task.taskName)
        return // 跳过没有日期的任务
      }
      
      const taskExecutor = task._rowExecutor || unitExecutor || ''
      const taskClassName = task._rowClassName || unitClassName || ''
      
      // 创建分组键：日期+执行人+班级
      const groupKey = `${taskDate}|${taskExecutor}|${taskClassName}`
      
      if (!taskGroups.has(groupKey)) {
        taskGroups.set(groupKey, [])
      }
      
      // 移除临时字段
      delete task._rowDate
      delete task._rowExecutor
      delete task._rowClassName
      
      taskGroups.get(groupKey)!.push(task)
    })

    // 如果分组后没有有效任务，跳过该单位
    if (taskGroups.size === 0) {
      console.warn('[Excel导入] 单位中所有任务都缺少日期，跳过该单位')
      return null
    }

    // 为每个分组创建SummaryGroup
    const groups: SummaryGroup[] = []
    taskGroups.forEach((groupTasks, groupKey) => {
      const [date, executor, className] = groupKey.split('|')
      
      // 确保日期有效（不应该使用unitDate或defaultDate作为后备）
      if (!date || date === 'null' || date === 'undefined') {
        console.warn('[Excel导入] 分组缺少有效日期，跳过:', groupKey)
        return
      }
      
      // 验证日期格式
      const dateObj = dayjs(date)
      if (!dateObj.isValid()) {
        console.warn('[Excel导入] 分组日期格式无效，跳过:', date, groupKey)
        return
      }
      
      const group = buildEmptyGroup(date)
      group.executor = executor || unitExecutor || ''
      group.className = className || unitClassName || ''
      group.date = date
      group.tasks = groupTasks
      // 每个分组使用独立的问题文本（如果有的话，否则使用模板）
      // 注意：只有当前分组有任务时才使用问题文本，避免空表单
      group.problems = groupTasks.length > 0 ? (problemsText || DEFAULT_PROBLEM_TEMPLATE) : DEFAULT_PROBLEM_TEMPLATE
      
      console.log('[Excel导入] 创建分组:', group.executor, group.className, group.date, '任务数:', groupTasks.length)
      groups.push(group)
    })

    // 返回所有分组（可能是一个或多个）
    return groups.length > 0 ? groups : null
  }

  /**
   * 解析Excel文件中的日工作总结数据
   */
  const parseExcelData = (data: any[][]): SummaryGroup[] => {
    console.log('[Excel导入] 开始解析数据，总行数:', data.length)

    if (data.length < 2) {
      throw new Error('Excel数据行数不足，请确保包含表头和数据行')
    }

    // 1. 先识别表头列映射（扫描前10行找到包含"序号"和"任务名称"的行）
    const headerMap: Record<string, number> = {}
    let globalHeaderRowIndex = -1

    for (let i = 0; i < Math.min(10, data.length); i++) {
      const row = data[i]
      const rowStr = row.map((c) => String(c || '').trim())

      let foundCount = 0
      const tempHeaderMap: Record<string, number> = {}

      rowStr.forEach((cell, index) => {
        const cellLower = cell.toLowerCase()
        if (cellLower.includes('序号') || cellLower === '序号') {
          tempHeaderMap['serialNumber'] = index
          foundCount++
        } else if (cellLower.includes('任务名称') || cellLower === '任务名称' || cellLower === '任务') {
          tempHeaderMap['taskName'] = index
          foundCount++
        } else if (cellLower.includes('任务描述') || cellLower === '任务描述' || cellLower === '描述') {
          tempHeaderMap['taskDescription'] = index
          foundCount++
        } else if (cellLower.includes('任务目标') || cellLower === '任务目标' || cellLower === '目标') {
          tempHeaderMap['taskGoal'] = index
          foundCount++
        } else if (cellLower.includes('执行时间') || cellLower === '执行时间' || cellLower === '时间') {
          tempHeaderMap['executionTime'] = index
          foundCount++
        } else if (cellLower.includes('最后完成期限') || cellLower.includes('完成期限') || cellLower === '期限') {
          tempHeaderMap['deadline'] = index
          foundCount++
        } else if (cellLower.includes('结果') || cellLower === '结果') {
          tempHeaderMap['result'] = index
          foundCount++
        } else if (cellLower.includes('日期') || cellLower === '日期') {
          tempHeaderMap['date'] = index
          foundCount++
        } else if (cellLower.includes('执行人') || cellLower === '执行人') {
          tempHeaderMap['executor'] = index
          foundCount++
        } else if (cellLower.includes('班级') || cellLower === '班级') {
          tempHeaderMap['className'] = index
          foundCount++
        }
      })

      if (tempHeaderMap['serialNumber'] !== undefined && tempHeaderMap['taskName'] !== undefined && foundCount >= 2) {
        globalHeaderRowIndex = i
        Object.assign(headerMap, tempHeaderMap)
        console.log('[Excel导入] 找到全局表头行:', i, '列映射:', headerMap)
        break
      }
    }

    if (globalHeaderRowIndex < 0) {
      throw new Error('无法找到表头行，请确保Excel包含"序号"和"任务名称"列')
    }

    // 2. 按两个空行分割单位，但需要智能合并
    const units: any[][][] = []
    let currentUnit: any[][] = []
    let emptyRowCount = 0
    let lastNonEmptyRowIndex = -1

    for (let i = 0; i < data.length; i++) {
      const row = data[i]
      
      if (isEmptyRow(row)) {
        emptyRowCount++
        // 如果遇到两个连续空行，且当前单位有内容，结束当前单位
        if (emptyRowCount >= 2 && currentUnit.length > 0) {
          // 过滤掉只有空行或无效行的单位
          const validRows = currentUnit.filter(r => !isEmptyRow(r))
          if (validRows.length > 0) {
            units.push(validRows)
            console.log('[Excel导入] 单位', units.length, '结束，行数:', validRows.length, '结束于第', i + 1, '行')
          }
          currentUnit = []
          emptyRowCount = 0
          lastNonEmptyRowIndex = -1
        }
      } else {
        // 如果之前有两个空行，现在遇到非空行，开始新单位
        if (emptyRowCount >= 2 && currentUnit.length === 0 && lastNonEmptyRowIndex >= 0) {
          console.log('[Excel导入] 开始新单位，从第', i + 1, '行开始')
        }
        emptyRowCount = 0
        currentUnit.push(row)
        lastNonEmptyRowIndex = i
      }
    }

    // 添加最后一个单位
    if (currentUnit.length > 0) {
      const validRows = currentUnit.filter(r => !isEmptyRow(r))
      if (validRows.length > 0) {
        units.push(validRows)
        console.log('[Excel导入] 最后一个单位，行数:', validRows.length)
      }
    }

    console.log('[Excel导入] 识别到', units.length, '个单位')

    // 3. 智能合并单位：如果某个单位只有1-2行且看起来是问题行或分隔行，尝试合并到前一个单位
    const mergedUnits: any[][][] = []
    for (let i = 0; i < units.length; i++) {
      const unit = units[i]
      
      // 过滤空行
      const validRows = unit.filter(r => !isEmptyRow(r))
      if (validRows.length === 0) {
        console.log('[Excel导入] 单位', i + 1, '全是空行，跳过')
        continue
      }
      
      // 如果单位只有1-2行，检查是否是问题行
      if (validRows.length <= 2) {
        let isProblemRow = false
        
        // 检查第一行是否是问题行
        const row = validRows[0]
        if (row && row.length > 0) {
          const serialCell = headerMap['serialNumber'] !== undefined 
            ? String(row[headerMap['serialNumber']] || '').trim() 
            : ''
          const taskNameCell = headerMap['taskName'] !== undefined 
            ? String(row[headerMap['taskName']] || '').trim() 
            : ''
          
          // 如果序号是"问题"或序号非数字且任务名称为空，认为是问题行
          if (serialCell === '问题' || (!serialCell.match(/^\d+$/) && !taskNameCell && serialCell !== '')) {
            isProblemRow = true
            console.log('[Excel导入] 单位', i + 1, '是问题行，准备合并到前一个单位')
          }
        }
        
        // 如果是问题行，尝试合并到前一个单位
        if (isProblemRow) {
          if (mergedUnits.length > 0) {
            const lastUnit = mergedUnits[mergedUnits.length - 1]
            lastUnit.push(...validRows) // 添加所有有效行
            console.log('[Excel导入] 将单位', i + 1, '合并到前一个单位，前一个单位现在有', lastUnit.length, '行')
            continue
          } else {
            // 如果这是第一个单位且是问题行，仍然保留它（可能是第一个单位的问题部分）
            console.log('[Excel导入] 单位', i + 1, '是问题行但无前一个单位，保留')
          }
        }
      }
      
      // 如果单位有有效内容，添加到合并列表
      mergedUnits.push(validRows)
    }

    console.log('[Excel导入] 合并后单位数:', mergedUnits.length)

    // 3. 解析每个单位
    const groups: SummaryGroup[] = []
    for (let i = 0; i < mergedUnits.length; i++) {
      const unit = mergedUnits[i]
      const unitGroups = parseUnit(unit, headerMap, dayStr)
      if (unitGroups && unitGroups.length > 0) {
        // parseUnit可能返回多个分组（如果单位中有不同日期的任务）
        groups.push(...unitGroups)
      } else {
        console.warn('[Excel导入] 单位', i + 1, '解析失败，行数:', unit.length, '前3行预览:', unit.slice(0, 3).map(r => r.slice(0, 5)))
      }
    }

    if (groups.length === 0) {
      throw new Error('未能解析出有效的工作总结数据，请检查数据格式')
    }

    console.log('[Excel导入] 解析完成，分组数:', groups.length, '总任务数:', groups.reduce((sum, g) => sum + g.tasks.length, 0))
    return groups
  }

  /**
   * 处理Excel文件上传
   */
  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    console.log('[Excel导入] 开始处理文件:', file.name)

    try {
      setImportLoading(true)
      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: 'array' })

      console.log('[Excel导入] 工作簿包含', workbook.SheetNames.length, '个Sheet:', workbook.SheetNames.join(', '))

      // 读取第一个Sheet
      const firstSheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[firstSheetName]
      const data = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: '' })

      const groups = parseExcelData(data)

      if (groups.length === 0) {
        message.warning('未能从Excel中解析出有效的工作总结数据')
        return
      }

      // 处理日期格式（如果是Excel日期序列号，需要转换）
      groups.forEach((group) => {
        if (group.date) {
          // 尝试解析日期
          try {
            const parsedDate = dayjs(group.date)
            if (parsedDate.isValid()) {
              group.date = parsedDate.format('YYYY-MM-DD')
            } else {
              // 如果解析失败，使用当前选择的日期
              group.date = dayStr
            }
          } catch {
            group.date = dayStr
          }
        } else {
          group.date = dayStr
        }

        // 确保任务有序号
        group.tasks = normalizeTasks(group.key, group.tasks)
      })

      setGroups(groups)
      message.success(`成功导入 ${groups.length} 个执行人的工作总结，共 ${groups.reduce((sum, g) => sum + g.tasks.length, 0)} 个任务`)

      // 重置文件输入
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error: any) {
      console.error('[Excel导入] 解析失败:', error)
      message.error(`Excel导入失败：${error.message || '数据格式不正确'}`)
    } finally {
      setImportLoading(false)
    }
  }

  const headerCellStyle: React.CSSProperties = {
    backgroundColor: '#e6f7ff',
    fontWeight: 'bold',
    textAlign: 'center',
  }

  return (
    <div style={{ padding: 24 }}>
      <Card bordered={false} style={{ background: '#f5f7fa' }}>
        <Title level={4} style={{ marginBottom: 12 }}>
          清美教育{campusName}智慧司日工作总结
        </Title>

        <Space size={12} style={{ marginBottom: 16 }}>
          <Text strong>查询日期范围</Text>
          <DatePicker.RangePicker
            value={dateRange}
            onChange={(dates) => {
              if (dates && dates[0] && dates[1]) {
                // 确保结束日期不早于开始日期
                if (dates[1].isBefore(dates[0])) {
                  message.warning('结束日期不能早于开始日期')
                  return
                }
                // 限制日期范围不超过1年
                const daysDiff = dates[1].diff(dates[0], 'day')
                if (daysDiff > 365) {
                  message.warning('日期范围不能超过1年')
                  return
                }
                setDateRange([dates[0], dates[1]])
              } else if (dates && dates[0]) {
                // 只选择了开始日期，将结束日期设置为同一天
                setDateRange([dates[0], dates[0]])
              } else {
                // 清空选择，重置为当前日期
                const today = dayjs()
                setDateRange([today, today])
              }
            }}
            format="YYYY-MM-DD"
            allowClear={false}
            disabledDate={(current) => {
              // 限制只能选择过去和今天，不能选择未来日期
              return current && current > dayjs().endOf('day')
            }}
          />
          <Button onClick={loadData} loading={loading}>
            刷新
          </Button>
          <Button onClick={handleAddGroup}>新增执行人</Button>
          <Button
            icon={<FileExcelOutlined />}
            onClick={() => fileInputRef.current?.click()}
            loading={importLoading}
          >
            从Excel导入
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            style={{ display: 'none' }}
            onChange={handleExcelUpload}
          />
          <Button type="primary" onClick={handleSaveAll} loading={saving}>
            保存全部
          </Button>
        </Space>

        {groups.map((group, groupIndex) => {
          console.log('[渲染] 渲染分组:', {
            index: groupIndex,
            key: group.key,
            日期: group.date,
            执行人: group.executor,
            班级: group.className,
            任务数: group.tasks.length,
            任务详情: group.tasks.slice(0, 3).map(t => ({ 序号: t.serialNumber, 名称: t.taskName })),
          })
          
          const dataSource = buildTableData(group)
          console.log('[渲染] 构建的表格数据:', {
            行数: dataSource.length,
            任务行: dataSource.filter(r => r.rowType === 'task').map(r => ({ 序号: r.serialNumber, 名称: r.taskName })),
          })
          
          const columns = buildColumns(groupIndex, group.tasks.length)
          return (
            <div key={group.key} style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Button size="small" onClick={() => handleAddTaskRow(groupIndex)}>
                  新增序号
                </Button>
                <Button danger size="small" onClick={() => handleRemoveGroup(groupIndex)}>
                  删除本表单
                </Button>
              </div>
              <Table
                bordered
                size="small"
                columns={columns}
                dataSource={dataSource}
                pagination={false}
                rowKey="key"
                scroll={{ x: 'max-content' }}
                loading={loading}
                components={{
                  header: {
                    cell: (props: any) => {
                      const mergedProps = {
                        ...props,
                        style: {
                          ...props.style,
                          ...headerCellStyle,
                        },
                      }
                      return <th {...mergedProps} />
                    },
                  },
                }}
              />
            </div>
          )
        })}
      </Card>
    </div>
  )
}

export default DailyWorkSummaryPage
