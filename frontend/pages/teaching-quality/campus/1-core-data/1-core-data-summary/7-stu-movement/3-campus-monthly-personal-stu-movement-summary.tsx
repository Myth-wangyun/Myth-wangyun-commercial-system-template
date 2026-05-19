import React, { useEffect, useMemo, useState } from 'react'
import { App, Card, Table, InputNumber, Space, Button, Select } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useCampusStore } from '@/stores/campusStore'
import { buildApiUrl } from '@/utils/apiBase'
import { fetchHomeroomTeachers } from '@/services/configMaster'
import type { HomeroomTeacherProfile } from '@/services/configMaster'

interface MonthlyPersonalMovementRow {
  key: string
  month: number
  teacherName: string
  totalStudents: number
  newRefundCount: number
  oldRefundCount: number
  totalRefundCount: number
  suspensionCount: number
  longLeaveCount: number
  longNoClassCount: number
  holidayCount: number
  otherCount: number
  totalMovementCount: number
  remark: string
  isMonthSummary?: boolean
  isGrandSummary?: boolean
}

const createInitialDetailRows = (teachers: string[]): MonthlyPersonalMovementRow[] => {
  const rows: MonthlyPersonalMovementRow[] = []

  for (let month = 1; month <= 12; month += 1) {
    teachers.forEach((name) => {
      let initial: Omit<MonthlyPersonalMovementRow, 'key' | 'month' | 'teacherName'> = {
        totalStudents: 0,
        newRefundCount: 0,
        oldRefundCount: 0,
        totalRefundCount: 0,
        suspensionCount: 0,
        longLeaveCount: 0,
        longNoClassCount: 0,
        holidayCount: 0,
        otherCount: 0,
        totalMovementCount: 0,
        remark: '',
      }

      if (month === 1 && name === '马晴') {
        // 示例：10 个在档，3 个异动（休学+长期请假+长期不上课）
        initial = {
          totalStudents: 10,
          newRefundCount: 0,
          oldRefundCount: 0,
          totalRefundCount: 0,
          suspensionCount: 1,
          longLeaveCount: 1,
          longNoClassCount: 1,
          holidayCount: 0,
          otherCount: 0,
          totalMovementCount: 3,
          remark: '',
        }
      } else if (month === 2 && name === '马晴') {
        // 示例：13 个在档，1 个异动
        initial = {
          totalStudents: 13,
          newRefundCount: 0,
          oldRefundCount: 0,
          totalRefundCount: 0,
          suspensionCount: 1,
          longLeaveCount: 0,
          longNoClassCount: 0,
          holidayCount: 0,
          otherCount: 0,
          totalMovementCount: 1,
          remark: '',
        }
      }

      rows.push({
        key: `${month}-${name}`,
        month,
        teacherName: name,
        ...initial,
      })
    })
  }

  return rows
}

const computeMonthSummary = (
  rows: MonthlyPersonalMovementRow[],
  month: number,
): MonthlyPersonalMovementRow => {
  const monthRows = rows.filter((r) => r.month === month && !r.isMonthSummary && !r.isGrandSummary)

  const total = monthRows.reduce(
    (acc, r) => {
      acc.totalStudents += r.totalStudents || 0
      acc.newRefundCount += r.newRefundCount || 0
      acc.oldRefundCount += r.oldRefundCount || 0
      acc.totalRefundCount += r.totalRefundCount || 0
      acc.suspensionCount += r.suspensionCount || 0
      acc.longLeaveCount += r.longLeaveCount || 0
      acc.longNoClassCount += r.longNoClassCount || 0
      acc.holidayCount += r.holidayCount || 0
      acc.otherCount += r.otherCount || 0
      acc.totalMovementCount += r.totalMovementCount || 0
      return acc
    },
    {
      totalStudents: 0,
      newRefundCount: 0,
      oldRefundCount: 0,
      totalRefundCount: 0,
      suspensionCount: 0,
      longLeaveCount: 0,
      longNoClassCount: 0,
      holidayCount: 0,
      otherCount: 0,
      totalMovementCount: 0,
    },
  )

  return {
    key: `${month}-summary`,
    month,
    teacherName: '合计/平均',
    ...total,
    remark: '',
    isMonthSummary: true,
  }
}

const computeGrandSummary = (rows: MonthlyPersonalMovementRow[]): MonthlyPersonalMovementRow => {
  const total = rows.reduce(
    (acc, r) => {
      if (r.isMonthSummary || r.isGrandSummary) return acc
      acc.totalStudents += r.totalStudents || 0
      acc.newRefundCount += r.newRefundCount || 0
      acc.oldRefundCount += r.oldRefundCount || 0
      acc.totalRefundCount += r.totalRefundCount || 0
      acc.suspensionCount += r.suspensionCount || 0
      acc.longLeaveCount += r.longLeaveCount || 0
      acc.longNoClassCount += r.longNoClassCount || 0
      acc.holidayCount += r.holidayCount || 0
      acc.otherCount += r.otherCount || 0
      acc.totalMovementCount += r.totalMovementCount || 0
      return acc
    },
    {
      totalStudents: 0,
      newRefundCount: 0,
      oldRefundCount: 0,
      totalRefundCount: 0,
      suspensionCount: 0,
      longLeaveCount: 0,
      longNoClassCount: 0,
      holidayCount: 0,
      otherCount: 0,
      totalMovementCount: 0,
    },
  )

  return {
    key: 'grand-summary',
    month: 0,
    teacherName: '总合计/总平均',
    ...total,
    remark: '',
    isGrandSummary: true,
  }
}

const MONTH_OPTIONS = [
  { label: '全年', value: 0 },
  ...Array.from({ length: 12 }, (_, i) => ({ label: `${i + 1}月`, value: i + 1 })),
]

const formatRate = (numerator: number, denominator: number) => {
  if (!denominator) return '0%'
  const rate = (numerator / denominator) * 100
  const fixed = rate.toFixed(1)
  const text = fixed.endsWith('.0') ? fixed.slice(0, -2) : fixed
  return `${text}%`
}

const ShengbangMonthlyPersonalStuMovementSummary: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore()
  const [year, setYear] = useState<number>(new Date().getFullYear())
  const [month, setMonth] = useState<number>(0) // 0表示全年
  const [selectedTeacher, setSelectedTeacher] = useState<string>('') // 空字符串表示全部
  const [homeroomTeachers, setHomeroomTeachers] = useState<HomeroomTeacherProfile[]>([])
  const teacherNames = useMemo(() => homeroomTeachers.map(t => t.name), [homeroomTeachers])
  const [detailRows, setDetailRows] = useState<MonthlyPersonalMovementRow[]>([])
  const [loading, setLoading] = useState(false)

  const canIO = useMemo(() => Boolean(currentCampus && year), [currentCampus, year])

  const fetchFromServer = async (isUserAction = true) => {
    if (!canIO) {
      if (isUserAction) message.warning('请先选择神殿/年份')
      return
    }
    if (teacherNames.length === 0) {
      if (isUserAction) message.warning('当前神殿没有配置班主任')
      return
    }
    try {
      const res = await fetch(
        buildApiUrl(`/teaching-quality/campus-monthly-personal-stu-movement?campus=${encodeURIComponent(
          currentCampus!,
        )}&year=${year}`),
      )
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      const list = (data?.行列表 || []) as any[]
      const mapped: MonthlyPersonalMovementRow[] = createInitialDetailRows(teacherNames).map((r) => {
        const hit = list.find((x: any) => x.month === r.month && x.name === r.teacherName)
        return hit
          ? {
              ...r,
              totalStudents: Number(hit.totalStudents || 0),
              newRefundCount: Number(hit.newRefundCount || 0),
              oldRefundCount: Number(hit.oldRefundCount || 0),
              totalRefundCount: Number(hit.totalRefundCount || 0),
              suspensionCount: Number(hit.suspensionCount || 0),
              longLeaveCount: Number(hit.longLeaveCount || 0),
              longNoClassCount: Number(hit.longNoClassCount || 0),
              holidayCount: Number(hit.holidayCount || 0),
              otherCount: Number(hit.otherCount || 0),
              totalMovementCount: Number(hit.totalMovementCount || 0),
              remark: String(hit.remark || ''),
            }
          : r
      })
      setDetailRows(mapped)
      if (isUserAction) message.success('已刷新')
    } catch (e) {
      console.error(e)
      if (isUserAction) message.error('刷新失败')
    }
  }

  // 从明细表自动计算汇总数据
  const calcFromDetails = async (isUserAction = true) => {
    if (!canIO) {
      if (isUserAction) message.warning('请先选择神殿/年份')
      return
    }
    setLoading(true)
    try {
      let url = `/teaching-quality/campus-monthly-personal-stu-movement-calc?campus=${encodeURIComponent(currentCampus!)}&year=${year}`
      if (month !== 0) {
        url += `&month=${month}`
      }
      if (selectedTeacher) {
        url += `&teacher=${encodeURIComponent(selectedTeacher)}`
      }
      
      const res = await fetch(buildApiUrl(url))
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      const list = (data?.行列表 || []) as any[]
      
      // 更新对应的行数据
      setDetailRows(prev => {
        const updated = [...prev]
        list.forEach((item: any) => {
          const idx = updated.findIndex(
            r => r.month === item.month && r.teacherName === item.teacherName
          )
          if (idx >= 0) {
            updated[idx] = {
              ...updated[idx],
              totalStudents: Number(item.totalStudents || 0),
              newRefundCount: Number(item.newRefundCount || 0),
              oldRefundCount: Number(item.oldRefundCount || 0),
              totalRefundCount: Number(item.totalRefundCount || 0),
              suspensionCount: Number(item.suspensionCount || 0),
              longLeaveCount: Number(item.longLeaveCount || 0),
              longNoClassCount: Number(item.longNoClassCount || 0),
              holidayCount: Number(item.holidayCount || 0),
              otherCount: Number(item.otherCount || 0),
              totalMovementCount: Number(item.totalMovementCount || 0),
            }
          } else {
            // 新班主任，添加新行
            updated.push({
              key: `${item.month}-${item.teacherName}`,
              month: item.month,
              teacherName: item.teacherName,
              totalStudents: Number(item.totalStudents || 0),
              newRefundCount: Number(item.newRefundCount || 0),
              oldRefundCount: Number(item.oldRefundCount || 0),
              totalRefundCount: Number(item.totalRefundCount || 0),
              suspensionCount: Number(item.suspensionCount || 0),
              longLeaveCount: Number(item.longLeaveCount || 0),
              longNoClassCount: Number(item.longNoClassCount || 0),
              holidayCount: Number(item.holidayCount || 0),
              otherCount: Number(item.otherCount || 0),
              totalMovementCount: Number(item.totalMovementCount || 0),
              remark: '',
            })
          }
        })
        return updated
      })
      if (isUserAction) message.success('已从明细表自动计算')
    } catch (e) {
      console.error(e)
      if (isUserAction) message.error('自动计算失败')
    } finally {
      setLoading(false)
    }
  }

  const saveToServer = async () => {
    if (!canIO) {
      message.warning('请先选择神殿/年份')
      return
    }
    try {
      const payload = {
        神殿名称: currentCampus!,
        年份: year,
        行列表: detailRows.map((r) => ({
          month: r.month,
          name: r.teacherName,
          totalStudents: r.totalStudents,
          newRefundCount: r.newRefundCount,
          oldRefundCount: r.oldRefundCount,
          totalRefundCount: r.totalRefundCount,
          suspensionCount: r.suspensionCount,
          longLeaveCount: r.longLeaveCount,
          longNoClassCount: r.longNoClassCount,
          holidayCount: r.holidayCount,
          otherCount: r.otherCount,
          totalMovementCount: r.totalMovementCount,
          remark: r.remark,
        })),
      }
      const res = await fetch(buildApiUrl('/teaching-quality/campus-monthly-personal-stu-movement'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(await res.text())
      message.success('保存成功')
      await fetchFromServer()
    } catch (e) {
      console.error(e)
      message.error('保存失败')
    }
  }

  // 加载班主任数据
  useEffect(() => {
    const loadHomeroomTeachers = async () => {
      if (!currentCampus) return
      try {
        const teachers = await fetchHomeroomTeachers({
          campus_name: currentCampus,
          active: true,
        })
        setHomeroomTeachers(teachers)
      } catch (error) {
        console.error('加载班主任数据失败', error)
        message.error('加载班主任数据失败')
      }
    }
    loadHomeroomTeachers()
  }, [currentCampus])

  // 当班主任列表加载完成后，初始化数据
  useEffect(() => {
    if (currentCampus && teacherNames.length > 0) {
      setDetailRows(createInitialDetailRows(teacherNames))
      // 先加载保存的数据（包含备注等），再自动计算最新数据
      fetchFromServer(false).then(() => {
        calcFromDetails(false)
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCampus, year, teacherNames.length])

  const dataSource: MonthlyPersonalMovementRow[] = useMemo(() => {
    if (detailRows.length === 0) return []
    
    // 根据筛选条件过滤数据
    let filteredRows = detailRows.filter(r => !r.isMonthSummary && !r.isGrandSummary)
    
    // 按月份筛选
    if (month !== 0) {
      filteredRows = filteredRows.filter(r => r.month === month)
    }
    
    // 按班主任筛选
    if (selectedTeacher) {
      filteredRows = filteredRows.filter(r => r.teacherName === selectedTeacher)
    }
    
    const ordered: MonthlyPersonalMovementRow[] = []
    const monthsToShow = month !== 0 ? [month] : Array.from({ length: 12 }, (_, i) => i + 1)

    for (const m of monthsToShow) {
      const monthDetails = filteredRows.filter(r => r.month === m)
      monthDetails.sort((a, b) => teacherNames.indexOf(a.teacherName) - teacherNames.indexOf(b.teacherName))
      
      // 只有在没有按班主任筛选时才显示月度合计
      if (!selectedTeacher && monthDetails.length > 0) {
        const monthSummary = computeMonthSummary(filteredRows, m)
        ordered.push(...monthDetails, monthSummary)
      } else {
        ordered.push(...monthDetails)
      }
    }

    // 只有在没有筛选条件时才显示总合计
    if (!selectedTeacher) {
      const grandSummary = computeGrandSummary(filteredRows)
      ordered.push(grandSummary)
    }

    return ordered
  }, [detailRows, teacherNames, month, selectedTeacher])

  const handleNumberChange = (
    key: string,
    field: keyof Omit<
      MonthlyPersonalMovementRow,
      'key' | 'month' | 'teacherName' | 'isMonthSummary' | 'isGrandSummary'
    >,
    value: number | null,
  ) => {
    const v = typeof value === 'number' ? value : 0
    setDetailRows((prev) =>
      prev.map((row) => {
        if (row.key !== key) return row
        const updated: MonthlyPersonalMovementRow = {
          ...row,
          [field]: v,
        }

        if (
          field === 'newRefundCount' ||
          field === 'oldRefundCount' ||
          field === 'totalRefundCount'
        ) {
          const totalRefund =
            field === 'totalRefundCount' ? v : updated.newRefundCount + updated.oldRefundCount
          updated.totalRefundCount = totalRefund
        }

        if (
          field === 'suspensionCount' ||
          field === 'longLeaveCount' ||
          field === 'longNoClassCount' ||
          field === 'holidayCount' ||
          field === 'otherCount' ||
          field === 'totalMovementCount'
        ) {
          const totalMovement =
            field === 'totalMovementCount'
              ? v
              : updated.suspensionCount +
                updated.longLeaveCount +
                updated.longNoClassCount +
                updated.holidayCount +
                updated.otherCount
          updated.totalMovementCount = totalMovement
        }

        return updated
      }),
    )
  }

  const handleNameChange = (key: string, value: string) => {
    setDetailRows((prev) =>
      prev.map((row) =>
        row.key === key
          ? {
              ...row,
              teacherName: value,
            }
          : row,
      ),
    )
  }

  const columns: ColumnsType<MonthlyPersonalMovementRow> = [
    {
      title: '月份',
      dataIndex: 'month',
      key: 'month',
      width: 80,
      align: 'center',
      onCell: (record) => {
        // 总合计/总平均：横向合并“月份”和“班主任姓名”两列
        if (record.isGrandSummary) {
          return { rowSpan: 1, colSpan: 2, style: { textAlign: 'center' } }
        }
        // 月度合计行：被首条明细吸收，隐藏自身
        if (record.isMonthSummary) {
          return { rowSpan: 0, style: { textAlign: 'center' } }
        }
        // 每月首条明细（以 teacherNames[0] 为顺序基准）合并当月明细 + 合计行
        const month = record.month
        const isFirstRowOfMonth = teacherNames.length > 0 && record.key === `${month}-${teacherNames[0]}`
        if (isFirstRowOfMonth) {
          return {
            rowSpan: teacherNames.length + 1,
            style: { textAlign: 'center' },
          }
        }
        // 其他明细隐藏
        return { rowSpan: 0, style: { textAlign: 'center' } }
      },
      render: (value: number, record) => {
        if (record.isGrandSummary) {
          return <span style={{ color: 'red', fontWeight: 'bold' }}>总合计/总平均</span>
        }
        if (record.isMonthSummary) {
          return ''
        }
        return value
      },
    },
    {
      title: '班主任姓名',
      dataIndex: 'teacherName',
      key: 'teacherName',
      width: 140,
      align: 'center',
      onCell: (record) => {
        // “总合计/总平均”已在左侧“月份”列显示，此列隐藏
        if (record.isGrandSummary) {
          return { colSpan: 0, style: { textAlign: 'center' } }
        }
        return { colSpan: 1, style: { textAlign: 'center' } }
      },
      render: (text: string, record) =>
        record.isMonthSummary || record.isGrandSummary ? (
          <span style={{ color: 'red', fontWeight: 'bold' }}>{text}</span>
        ) : (
          <Select
            value={text}
            onChange={(value) => handleNameChange(record.key, value)}
            style={{ width: '100%' }}
            options={teacherNames.map((name) => ({ label: name, value: name }))}
          />
        ),
    },
    {
      title: '累计带生人数',
      dataIndex: 'totalStudents',
      key: 'totalStudents',
      width: 130,
      align: 'center',
      render: (value: number, record) => {
        if (record.isMonthSummary || record.isGrandSummary) {
          return value || 0
        }
        return (
          <InputNumber
            min={0}
            value={value || 0}
            style={{ width: '100%' }}
            onChange={(v) => handleNumberChange(record.key, 'totalStudents', v ?? 0)}
          />
        )
      },
    },
    {
      title: '新生退费人数',
      dataIndex: 'newRefundCount',
      key: 'newRefundCount',
      width: 130,
      align: 'center',
      render: (value: number, record) => {
        if (record.isMonthSummary || record.isGrandSummary) {
          return value || 0
        }
        return (
          <InputNumber
            min={0}
            value={value || 0}
            style={{ width: '100%' }}
            onChange={(v) => handleNumberChange(record.key, 'newRefundCount', v ?? 0)}
          />
        )
      },
    },
    {
      title: '老生退费人数',
      dataIndex: 'oldRefundCount',
      key: 'oldRefundCount',
      width: 130,
      align: 'center',
      render: (value: number, record) => {
        if (record.isMonthSummary || record.isGrandSummary) {
          return value || 0
        }
        return (
          <InputNumber
            min={0}
            value={value || 0}
            style={{ width: '100%' }}
            onChange={(v) => handleNumberChange(record.key, 'oldRefundCount', v ?? 0)}
          />
        )
      },
    },
    {
      title: '退费总人数',
      dataIndex: 'totalRefundCount',
      key: 'totalRefundCount',
      width: 120,
      align: 'center',
      render: (value: number, record) =>
        record.isMonthSummary || record.isGrandSummary ? value || 0 : value || 0,
    },
    {
      title: '退费率',
      dataIndex: 'refundRate',
      key: 'refundRate',
      width: 100,
      align: 'center',
      render: (_: unknown, record) => {
        const denominator = record.totalStudents
        const numerator = record.totalRefundCount
        return formatRate(numerator, denominator)
      },
    },
    {
      title: '休学总人数',
      dataIndex: 'suspensionCount',
      key: 'suspensionCount',
      width: 120,
      align: 'center',
      render: (value: number, record) => {
        if (record.isMonthSummary || record.isGrandSummary) {
          return value || 0
        }
        return (
          <InputNumber
            min={0}
            value={value || 0}
            style={{ width: '100%' }}
            onChange={(v) => handleNumberChange(record.key, 'suspensionCount', v ?? 0)}
          />
        )
      },
    },
    {
      title: '长期请假总人数',
      dataIndex: 'longLeaveCount',
      key: 'longLeaveCount',
      width: 140,
      align: 'center',
      render: (value: number, record) => {
        if (record.isMonthSummary || record.isGrandSummary) {
          return value || 0
        }
        return (
          <InputNumber
            min={0}
            value={value || 0}
            style={{ width: '100%' }}
            onChange={(v) => handleNumberChange(record.key, 'longLeaveCount', v ?? 0)}
          />
        )
      },
    },
    {
      title: '长期不上课总人数',
      dataIndex: 'longNoClassCount',
      key: 'longNoClassCount',
      width: 160,
      align: 'center',
      render: (value: number, record) => {
        if (record.isMonthSummary || record.isGrandSummary) {
          return value || 0
        }
        return (
          <InputNumber
            min={0}
            value={value || 0}
            style={{ width: '100%' }}
            onChange={(v) => handleNumberChange(record.key, 'longNoClassCount', v ?? 0)}
          />
        )
      },
    },
    {
      title: '寒暑假学生总数',
      dataIndex: 'holidayCount',
      key: 'holidayCount',
      width: 150,
      align: 'center',
      render: (value: number, record) => {
        if (record.isMonthSummary || record.isGrandSummary) {
          return value || 0
        }
        return (
          <InputNumber
            min={0}
            value={value || 0}
            style={{ width: '100%' }}
            onChange={(v) => handleNumberChange(record.key, 'holidayCount', v ?? 0)}
          />
        )
      },
    },
    {
      title: '其他情况总人数',
      dataIndex: 'otherCount',
      key: 'otherCount',
      width: 140,
      align: 'center',
      render: (value: number, record) => {
        if (record.isMonthSummary || record.isGrandSummary) {
          return value || 0
        }
        return (
          <InputNumber
            min={0}
            value={value || 0}
            style={{ width: '100%' }}
            onChange={(v) => handleNumberChange(record.key, 'otherCount', v ?? 0)}
          />
        )
      },
    },
    {
      title: '异动总人数',
      dataIndex: 'totalMovementCount',
      key: 'totalMovementCount',
      width: 130,
      align: 'center',
      render: (value: number, record) =>
        record.isMonthSummary || record.isGrandSummary ? value || 0 : value || 0,
    },
    {
      title: '异动率',
      dataIndex: 'movementRate',
      key: 'movementRate',
      width: 100,
      align: 'center',
      render: (_: unknown, record) => {
        const denominator = record.totalStudents
        const numerator = record.totalMovementCount
        return formatRate(numerator, denominator)
      },
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={`07-2 ${currentCampus || ''} 教质月度个人统计学员异动表`}
        extra={
          <Space wrap>
            <span>年份</span>
            <InputNumber
              min={2000}
              max={2100}
              value={year}
              onChange={(v) => setYear(typeof v === 'number' ? v : new Date().getFullYear())}
              style={{ width: 100 }}
            />
            <span>月份</span>
            <Select
              value={month}
              onChange={setMonth}
              options={MONTH_OPTIONS}
              style={{ width: 100 }}
            />
            <span>班主任</span>
            <Select
              value={selectedTeacher}
              onChange={setSelectedTeacher}
              allowClear
              placeholder="全部"
              style={{ width: 120 }}
              options={[
                { label: '全部', value: '' },
                ...teacherNames.map(name => ({ label: name, value: name }))
              ]}
            />
            <Button onClick={() => void fetchFromServer()} disabled={!canIO}>刷新</Button>
            <Button type="primary" onClick={() => void calcFromDetails()} disabled={!canIO} loading={loading}>
              从明细表自动计算
            </Button>
            <Button type="primary" onClick={() => void saveToServer()} disabled={!canIO}>保存</Button>
          </Space>
        }
      >
        <Table<MonthlyPersonalMovementRow>
          bordered
          size="small"
          columns={columns}
          dataSource={dataSource}
          pagination={false}
          rowKey="key"
          scroll={{ x: 'max-content' }}
        />
      </Card>
    </div>
  )
}

export default ShengbangMonthlyPersonalStuMovementSummary
