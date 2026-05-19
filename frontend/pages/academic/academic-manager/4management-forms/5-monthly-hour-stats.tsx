// 学术->学术经理->管理表格 月份课时统计表（可编辑 + 动态生成 + 本地持久化）
import React, { useEffect, useMemo, useState } from 'react'
import {
  Card,
  DatePicker,
  Calendar,
  Typography,
  Space,
  Alert,
  Table,
  Input,
  InputNumber,
  Button,
  message,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { Dayjs } from 'dayjs'

const { Title, Text } = Typography

type SessionRowKey = 'morning' | 'afternoon' | 'evening' | 'selfStudy' | 'summary'

interface DaySchedule {
  key: string
  dateLabel: string
  weekLabel: string
}

interface MonthlyWeek {
  id: string
  title: string
  days: DaySchedule[]
  hasSelfStudy?: boolean
}

interface SessionRow {
  rowKey: SessionRowKey
  timeSlot: string
  [key: string]: string | number
}

type ScheduleData = {
  weeks: MonthlyWeek[]
  rows: Record<string, SessionRow[]>
  totals: {
    regular: number
    makeup: number
    project: number
    tutoring: number
  }
}

const SESSIONS: Array<{ key: SessionRowKey; label: string }> = [
  { key: 'morning', label: '上午' },
  { key: 'afternoon', label: '下午' },
  { key: 'evening', label: '晚上' },
]

const SELF_STUDY_SESSION = { key: 'selfStudy' as SessionRowKey, label: '晚自习' }

const SUMMARY_SESSION = { key: 'summary' as SessionRowKey, label: '合计' }

const emptyRow = (days: DaySchedule[], includeSelfStudy = false): SessionRow[] => {
  const baseRows = [...SESSIONS]
  if (includeSelfStudy) {
    baseRows.push(SELF_STUDY_SESSION)
  }
  baseRows.push(SUMMARY_SESSION)

  return baseRows.map(({ key, label }) => {
    const row: SessionRow = {
      rowKey: key,
      timeSlot: label,
    }
    days.forEach((day) => {
      row[`${day.key}-regular`] = 0
      row[`${day.key}-makeup`] = 0
      row[`${day.key}-project`] = 0
      row[`${day.key}-tutor`] = 0
      row[`${day.key}-detail`] = ''
    })

    if (key === 'summary') {
      row['weekly-regular-total'] = 0
      row['weekly-makeup-total'] = 0
      row['weekly-project-total'] = 0
      row['weekly-tutor-total'] = 0
    }

    return row
  })
}
// 工具：根据所选月份动态生成周结构（按周日开始）
const buildMonthStructure = (month: Dayjs): MonthlyWeek[] => {
  const start = month.startOf('month').startOf('week')
  const end = month.endOf('month').endOf('week')
  const weeks: MonthlyWeek[] = []
  let cursor = start
  let index = 1
  while (cursor.isBefore(end) || cursor.isSame(end, 'day')) {
    const days: DaySchedule[] = Array.from({ length: 7 }).map((_, i) => {
      const d = cursor.add(i, 'day')
      const weekNames = '日一二三四五六'
      return {
        key: d.format('YYYY-MM-DD'),
        dateLabel: d.format('MM/DD '),
        weekLabel: `星期${weekNames[d.day()]}`,
      }
    })
    weeks.push({
      id: `${month.format('YYYY-MM')}-week-${index}`,
      title: `${days[0].dateLabel} - ${days[6].dateLabel}`,
      days,
      hasSelfStudy: true,
    })
    cursor = cursor.add(1, 'week')
    index += 1
  }
  return weeks
}

// 计算周合计
const recalcWeekTotals = (rows: SessionRow[], days: DaySchedule[]): SessionRow[] => {
  const next = rows.map((r) => ({ ...r }))
  const summary = next.find((r) => r.rowKey === 'summary')
  if (!summary) return next
  let regular = 0
  let makeup = 0
  let project = 0
  let tutor = 0
  next.forEach((r) => {
    if (r.rowKey === 'summary') return
    days.forEach((d) => {
      regular += Number(r[`${d.key}-regular`] || 0)
      makeup += Number(r[`${d.key}-makeup`] || 0)
      project += Number(r[`${d.key}-project`] || 0)
      tutor += Number(r[`${d.key}-tutor`] || 0)
    })
  })
  summary['weekly-regular-total'] = regular
  summary['weekly-makeup-total'] = makeup
  summary['weekly-project-total'] = project
  summary['weekly-tutor-total'] = tutor
  return next
}

// 计算整月合计
const recalcMonthTotals = (schedule: ScheduleData): ScheduleData => {
  let regular = 0,
    makeup = 0,
    project = 0,
    tutoring = 0
  schedule.weeks.forEach((w) => {
    const rows = schedule.rows[w.id] || []
    const s = rows.find((r) => r.rowKey === 'summary')
    if (s) {
      regular += Number(s['weekly-regular-total'] || 0)
      makeup += Number(s['weekly-makeup-total'] || 0)
      project += Number(s['weekly-project-total'] || 0)
      tutoring += Number(s['weekly-tutor-total'] || 0)
    }
  })
  return {
    ...schedule,
    totals: { regular, makeup, project, tutoring },
  }
}

const MonthlyHourStatsPage: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState<Dayjs>(dayjs())
  const [schedules, setSchedules] = useState<Record<string, ScheduleData>>(() => {
    try {
      const raw = localStorage.getItem('monthlyHourSchedules')
      return raw ? JSON.parse(raw) : {}
    } catch {
      return {}
    }
  })

  const monthKey = selectedMonth.format('YYYY-MM')

  // 初始化当前月的结构（若不存在）
  useEffect(() => {
    setSchedules((prev) => {
      if (prev[monthKey]) return prev
      const weeks = buildMonthStructure(selectedMonth)
      const rows: Record<string, SessionRow[]> = {}
      weeks.forEach((w) => (rows[w.id] = emptyRow(w.days, w.hasSelfStudy)))
      const next: Record<string, ScheduleData> = {
        ...prev,
        [monthKey]: recalcMonthTotals({
          weeks,
          rows,
          totals: { regular: 0, makeup: 0, project: 0, tutoring: 0 },
        }),
      }
      return next
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthKey])

  // 持久化
  useEffect(() => {
    try {
      localStorage.setItem('monthlyHourSchedules', JSON.stringify(schedules))
    } catch {}
  }, [schedules])

  const schedule = schedules[monthKey]

  const handleMonthChange = (value: Dayjs | null) => {
    if (value) setSelectedMonth(value.startOf('month'))
  }

  // 更新单元格
  const updateCell = (
    weekId: string,
    rowKey: SessionRowKey,
    dayKey: string,
    field: 'regular' | 'makeup' | 'project' | 'tutor' | 'detail',
    value: number | string,
  ) => {
    setSchedules((prev) => {
      const current = prev[monthKey]
      if (!current) return prev
      const weeks = current.weeks
      const rowsMap = { ...current.rows }
      const rows = (rowsMap[weekId] || []).map((r) => ({ ...r }))
      const target = rows.find((r) => r.rowKey === rowKey)
      if (!target) return prev
      const key = `${dayKey}-${field}`
      target[key] = value as any
      const week = weeks.find((w) => w.id === weekId)!
      const recalced = recalcWeekTotals(rows, week.days)
      rowsMap[weekId] = recalced
      const nextSchedule = recalcMonthTotals({ weeks, rows: rowsMap, totals: current.totals })
      return { ...prev, [monthKey]: nextSchedule }
    })
  }

  const renderWeekTable = (week: MonthlyWeek, rows: SessionRow[]) => {
    const columns: ColumnsType<SessionRow> = [
      {
        title: '时间',
        dataIndex: 'timeSlot',
        key: 'timeSlot',
        fixed: 'left',
        width: 100,
        align: 'center',
      },
    ]

    week.days.forEach((day) => {
      columns.push({
        title: (
          <div>
            <div>{day.weekLabel}</div>
            <div style={{ fontWeight: 400 }}>{day.dateLabel}</div>
          </div>
        ),
        children: [
          {
            title: '正课',
            dataIndex: `${day.key}-regular`,
            key: `${day.key}-regular`,
            align: 'center',
            width: 80,
            render: (val, record) =>
              record.rowKey !== 'summary' ? (
                <InputNumber
                  size="small"
                  min={0}
                  value={Number(val || 0)}
                  onChange={(v) =>
                    updateCell(week.id, record.rowKey, day.key, 'regular', Number(v || 0))
                  }
                />
              ) : (
                <span>{val as number}</span>
              ),
          },
          {
            title: '补课',
            dataIndex: `${day.key}-makeup`,
            key: `${day.key}-makeup`,
            align: 'center',
            width: 80,
            render: (val, record) =>
              record.rowKey !== 'summary' ? (
                <InputNumber
                  size="small"
                  min={0}
                  value={Number(val || 0)}
                  onChange={(v) =>
                    updateCell(week.id, record.rowKey, day.key, 'makeup', Number(v || 0))
                  }
                />
              ) : (
                <span>{val as number}</span>
              ),
          },
          {
            title: '项目',
            dataIndex: `${day.key}-project`,
            key: `${day.key}-project`,
            align: 'center',
            width: 80,
            render: (val, record) =>
              record.rowKey !== 'summary' ? (
                <InputNumber
                  size="small"
                  min={0}
                  value={Number(val || 0)}
                  onChange={(v) =>
                    updateCell(week.id, record.rowKey, day.key, 'project', Number(v || 0))
                  }
                />
              ) : (
                <span>{val as number}</span>
              ),
          },
          {
            title: '辅导',
            dataIndex: `${day.key}-tutor`,
            key: `${day.key}-tutor`,
            align: 'center',
            width: 80,
            render: (val, record) =>
              record.rowKey !== 'summary' ? (
                <InputNumber
                  size="small"
                  min={0}
                  value={Number(val || 0)}
                  onChange={(v) =>
                    updateCell(week.id, record.rowKey, day.key, 'tutor', Number(v || 0))
                  }
                />
              ) : (
                <span>{val as number}</span>
              ),
          },
          {
            title: '班级-课程-章节',
            dataIndex: `${day.key}-detail`,
            key: `${day.key}-detail`,
            align: 'center',
            width: 180,
            render: (val, record) =>
              record.rowKey !== 'summary' ? (
                <Input
                  size="small"
                  value={(val as string) || ''}
                  onChange={(e) =>
                    updateCell(week.id, record.rowKey, day.key, 'detail', e.target.value)
                  }
                />
              ) : null,
          },
        ],
      })
    })

    columns.push({
      title: '正课合计',
      dataIndex: 'weekly-regular-total',
      key: 'weekly-regular-total',
      align: 'center',
      width: 110,
    })
    columns.push({
      title: '补课合计',
      dataIndex: 'weekly-makeup-total',
      key: 'weekly-makeup-total',
      align: 'center',
      width: 110,
    })
    columns.push({
      title: '项目课合计',
      dataIndex: 'weekly-project-total',
      key: 'weekly-project-total',
      align: 'center',
      width: 120,
    })
    columns.push({
      title: '辅导课合计',
      dataIndex: 'weekly-tutor-total',
      key: 'weekly-tutor-total',
      align: 'center',
      width: 120,
    })

    return (
      <Table<SessionRow>
        key={week.id}
        bordered
        columns={columns}
        dataSource={rows.map((row) => ({ ...row, key: row.rowKey }))}
        pagination={false}
        scroll={{ x: 'max-content' }}
        size="small"
        style={{ marginBottom: 24 }}
      />
    )
  }

  return (
    <Card bordered={false} style={{ backgroundColor: '#f5f7fa' }}>
      <Space align="center" style={{ justifyContent: 'space-between', width: '100%' }}>
        <div>
          <Title level={4} style={{ marginBottom: 4 }}>
            {selectedMonth.format('YYYY年M月')}课时统计表
          </Title>
          <Text type="secondary">结合日历按周查看正课、补课、项目课与辅导课安排</Text>
        </div>
        <DatePicker
          picker="month"
          value={selectedMonth}
          onChange={handleMonthChange}
          allowClear={false}
        />
      </Space>

      <div style={{ marginTop: 16, marginBottom: 16 }}>
        <Calendar
          fullscreen={false}
          value={selectedMonth}
          onSelect={(value) => handleMonthChange(value)}
          onPanelChange={(value) => handleMonthChange(value)}
        />
      </div>

      {!schedule ? (
        <Alert
          type="info"
          message="首次进入该月份时，系统已自动生成可编辑的空表。请选择任意单元格录入数据。"
        />
      ) : (
        <>
          <Alert
            type="success"
            showIcon
            style={{ marginBottom: 16 }}
            message="月度课时合计"
            description={
              <Space size="large">
                <span>正课合计：{schedule.totals.regular}</span>
                <span>补课合计：{schedule.totals.makeup}</span>
                <span>项目课合计：{schedule.totals.project}</span>
                <span>辅导课合计：{schedule.totals.tutoring}</span>
              </Space>
            }
          />

          {schedule.weeks.map((week) => renderWeekTable(week, schedule.rows[week.id] || []))}
        </>
      )}
    </Card>
  )
}

export default MonthlyHourStatsPage
