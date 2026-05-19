/**
 * 08-1主神殿教化司每月个人宿舍管理统计表（已接入后端）
 */

import React, { useCallback, useEffect, useMemo, useState, useRef, memo } from 'react'

const FULL_WIDTH_STYLE: React.CSSProperties = { width: '100%' }
import { App, Card, Table, Input, InputNumber, Space, Button, Select } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useCampusStore } from '@/stores/campusStore'
import { buildApiUrl } from '@/utils/apiBase'
import { fetchHomeroomTeachers } from '@/services/configMaster'

const { Option } = Select

// 优化的 InputNumber Cell 组件
const MemoizedInputNumberCell = memo<{
  value: number
  recordKey: string
  field: string
  onChange: (key: string, field: string, value: number) => void
}>(({ value, recordKey, field, onChange }) => {
  const handleChange = useCallback((v: number | null) => {
    onChange(recordKey, field, v ?? 0)
  }, [recordKey, field, onChange])

  return (
    <InputNumber
      min={0}
      value={value || 0}
      style={FULL_WIDTH_STYLE}
      onChange={handleChange}
    />
  )
})

MemoizedInputNumberCell.displayName = 'MemoizedInputNumberCell'

// 优化的 Input Cell 组件
const MemoizedInputCell = memo<{
  value: string
  recordKey: string
  field: string
  onChange: (key: string, field: string, value: string) => void
}>(({ value, recordKey, field, onChange }) => {
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(recordKey, field, e.target.value)
  }, [recordKey, field, onChange])

  return <Input value={value} onChange={handleChange} />
})

MemoizedInputCell.displayName = 'MemoizedInputCell'

interface MonthlyPersonalDormRow {
  key: string
  month: number
  name: string
  classStudentCount: number
  dormManageCount: number
  dormResidentCount: number
  maleDormCount: number
  maleDormResidentCount: number
  maleEmptyBedCount: number
  maleNewStudentBedCount: number
  femaleDormCount: number
  femaleDormResidentCount: number
  femaleEmptyBedCount: number
  femaleNewStudentBedCount: number
  planRentDormCount: number
  actualRentDormCount: number
  planQuitDormCount: number
  actualQuitDormCount: number
  remark: string
  isMonthSummary?: boolean
  isGrandSummary?: boolean
}

// 从配置中心动态获取班主任姓名列表
// 注意：与当前神殿绑定，且仅取在职（is_active=true）的班主任
const FALLBACK_TEACHERS = ['郭彩兰', '姜楠', '李晓萍']


const createEmptyRow = (month: number, name: string): MonthlyPersonalDormRow => ({
  key: `${month}-${name}`,
  month,
  name,
  classStudentCount: 0,
  dormManageCount: 0,
  dormResidentCount: 0,
  maleDormCount: 0,
  maleDormResidentCount: 0,
  maleEmptyBedCount: 0,
  maleNewStudentBedCount: 0,
  femaleDormCount: 0,
  femaleDormResidentCount: 0,
  femaleEmptyBedCount: 0,
  femaleNewStudentBedCount: 0,
  planRentDormCount: 0,
  actualRentDormCount: 0,
  planQuitDormCount: 0,
  actualQuitDormCount: 0,
  remark: '',
})

const createInitialDetailRows = (names: string[]): MonthlyPersonalDormRow[] => {
  const rows: MonthlyPersonalDormRow[] = []
  for (let month = 1; month <= 12; month += 1) {
    names.forEach((name) => rows.push(createEmptyRow(month, name)))
  }
  return rows
}

const computeMonthSummary = (
  rows: MonthlyPersonalDormRow[],
  month: number,
): MonthlyPersonalDormRow => {
  const monthRows = rows.filter((r) => r.month === month && !r.isMonthSummary && !r.isGrandSummary)

  const total = monthRows.reduce(
    (acc, r) => {
      acc.classStudentCount += r.classStudentCount || 0
      acc.dormManageCount += r.dormManageCount || 0
      acc.dormResidentCount += r.dormResidentCount || 0
      acc.maleDormCount += r.maleDormCount || 0
      acc.maleDormResidentCount += r.maleDormResidentCount || 0
      acc.maleEmptyBedCount += r.maleEmptyBedCount || 0
      acc.maleNewStudentBedCount += r.maleNewStudentBedCount || 0
      acc.femaleDormCount += r.femaleDormCount || 0
      acc.femaleDormResidentCount += r.femaleDormResidentCount || 0
      acc.femaleEmptyBedCount += r.femaleEmptyBedCount || 0
      acc.femaleNewStudentBedCount += r.femaleNewStudentBedCount || 0
      acc.planRentDormCount += r.planRentDormCount || 0
      acc.actualRentDormCount += r.actualRentDormCount || 0
      acc.planQuitDormCount += r.planQuitDormCount || 0
      acc.actualQuitDormCount += r.actualQuitDormCount || 0
      return acc
    },
    {
      classStudentCount: 0,
      dormManageCount: 0,
      dormResidentCount: 0,
      maleDormCount: 0,
      maleDormResidentCount: 0,
      maleEmptyBedCount: 0,
      maleNewStudentBedCount: 0,
      femaleDormCount: 0,
      femaleDormResidentCount: 0,
      femaleEmptyBedCount: 0,
      femaleNewStudentBedCount: 0,
      planRentDormCount: 0,
      actualRentDormCount: 0,
      planQuitDormCount: 0,
      actualQuitDormCount: 0,
    },
  )

  return {
    key: `${month}-summary`,
    month,
    name: '合计/平均',
    ...total,
    remark: '',
    isMonthSummary: true,
  }
}

const computeGrandSummary = (rows: MonthlyPersonalDormRow[]): MonthlyPersonalDormRow => {
  const total = rows.reduce(
    (acc, r) => {
      if (r.isMonthSummary || r.isGrandSummary) return acc
      acc.classStudentCount += r.classStudentCount || 0
      acc.dormManageCount += r.dormManageCount || 0
      acc.dormResidentCount += r.dormResidentCount || 0
      acc.maleDormCount += r.maleDormCount || 0
      acc.maleDormResidentCount += r.maleDormResidentCount || 0
      acc.maleEmptyBedCount += r.maleEmptyBedCount || 0
      acc.maleNewStudentBedCount += r.maleNewStudentBedCount || 0
      acc.femaleDormCount += r.femaleDormCount || 0
      acc.femaleDormResidentCount += r.femaleDormResidentCount || 0
      acc.femaleEmptyBedCount += r.femaleEmptyBedCount || 0
      acc.femaleNewStudentBedCount += r.femaleNewStudentBedCount || 0
      acc.planRentDormCount += r.planRentDormCount || 0
      acc.actualRentDormCount += r.actualRentDormCount || 0
      acc.planQuitDormCount += r.planQuitDormCount || 0
      acc.actualQuitDormCount += r.actualQuitDormCount || 0
      return acc
    },
    {
      classStudentCount: 0,
      dormManageCount: 0,
      dormResidentCount: 0,
      maleDormCount: 0,
      maleDormResidentCount: 0,
      maleEmptyBedCount: 0,
      maleNewStudentBedCount: 0,
      femaleDormCount: 0,
      femaleDormResidentCount: 0,
      femaleEmptyBedCount: 0,
      femaleNewStudentBedCount: 0,
      planRentDormCount: 0,
      actualRentDormCount: 0,
      planQuitDormCount: 0,
      actualQuitDormCount: 0,
    },
  )

  return {
    key: 'grand-summary',
    month: 0,
    name: '总合计/总平均',
    ...total,
    remark: '',
    isGrandSummary: true,
  }
}

const ensureCampusName = (name: string) => (name.endsWith('神殿') ? name : `${name}神殿`)

const formatRate = (numerator: number, denominator: number) => {
  if (!denominator) return '0%'
  const rate = (numerator / denominator) * 100
  const fixed = rate.toFixed(1)
  const text = fixed.endsWith('.0') ? fixed.slice(0, -2) : fixed
  return `${text}%`
}

const ShengbangMonthlyPersonalDormitoryManagementSummary: React.FC = React.memo(() => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore()
  const [year, setYear] = useState<number>(new Date().getFullYear())
  
  // 筛选条件
  const [selectedMonth, setSelectedMonth] = useState<number | undefined>(undefined) // undefined表示"全部"
  const [selectedName, setSelectedName] = useState<string | undefined>(undefined) // undefined表示"全部"

  // 从配置中心加载的班主任姓名列表（按当前神殿过滤）；提供兜底名单
  const [teacherNames, setTeacherNames] = useState<string[]>(FALLBACK_TEACHERS)

  const [detailRows, setDetailRows] = useState<MonthlyPersonalDormRow[]>(() => createInitialDetailRows(FALLBACK_TEACHERS))

  const canIO = useMemo(() => Boolean(currentCampus && year), [currentCampus, year])

  // 缓存roster索引映射，避免重复计算indexOf
  const rosterIndexMap = useMemo(() => {
    const roster = teacherNames && teacherNames.length > 0 ? teacherNames : FALLBACK_TEACHERS
    const map = new Map<string, number>()
    roster.forEach((name, index) => map.set(name, index))
    return map
  }, [teacherNames])

  const dataSource: MonthlyPersonalDormRow[] = useMemo(() => {
    const ordered: MonthlyPersonalDormRow[] = []
    const roster = teacherNames && teacherNames.length > 0 ? teacherNames : FALLBACK_TEACHERS

    // 预先过滤出非汇总行，避免在循环中重复过滤
    const allDetailRows = detailRows.filter(
      (r) => !r.isMonthSummary && !r.isGrandSummary,
    )

    // 应用筛选条件到明细行
    let filteredDetailRows = allDetailRows
    if (selectedMonth !== undefined) {
      filteredDetailRows = filteredDetailRows.filter((r) => r.month === selectedMonth)
    }
    if (selectedName !== undefined) {
      filteredDetailRows = filteredDetailRows.filter((r) => r.name === selectedName)
    }

    // 如果筛选了月份，只显示该月的数据和合计
    const monthsToShow = selectedMonth !== undefined ? [selectedMonth] : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

    for (const month of monthsToShow) {
      const monthDetails = filteredDetailRows.filter((r) => r.month === month)
      // 使用Map查找索引，比indexOf更快
      monthDetails.sort((a, b) => {
        const indexA = rosterIndexMap.get(a.name) ?? Infinity
        const indexB = rosterIndexMap.get(b.name) ?? Infinity
        return indexA - indexB
      })
      
      // 如果只筛选了姓名（未筛选月份），不显示月度合计
      // 如果筛选了月份或未筛选，显示月度合计
      if (selectedMonth !== undefined || selectedName === undefined) {
        // 计算月度合计时，如果筛选了姓名，只计算筛选后的数据
        const monthRowsForSummary = selectedName !== undefined 
          ? allDetailRows.filter((r) => r.month === month && r.name === selectedName)
          : allDetailRows.filter((r) => r.month === month)
        const monthSummary = computeMonthSummary(
          monthRowsForSummary.map(r => ({ ...r, isMonthSummary: false, isGrandSummary: false })),
          month
        )
        ordered.push(...monthDetails, monthSummary)
      } else {
        ordered.push(...monthDetails)
      }
    }

    // 只有在显示全部数据时才显示总合计
    if (selectedMonth === undefined && selectedName === undefined) {
      const grandSummary = computeGrandSummary(detailRows)
      ordered.push(grandSummary)
    }

    return ordered
  }, [detailRows, teacherNames, rosterIndexMap, selectedMonth, selectedName])

  const handleNumberChange = useCallback((
    key: string,
    field: string,
    value: number,
  ) => {
    setDetailRows((prev) =>
      prev.map((row) => {
        if (row.key !== key) return row

        const patch: Partial<MonthlyPersonalDormRow> = { [field]: value } as any

        // 规则：宿舍管理总数量 = 男宿总数量 + 女宿总数量
        if (field === 'maleDormCount') {
          patch.dormManageCount = (value || 0) + (row.femaleDormCount || 0)
        } else if (field === 'femaleDormCount') {
          patch.dormManageCount = (row.maleDormCount || 0) + (value || 0)
        }

        // 规则：住宿总人数 = 男宿总人数 + 女宿总人数
        if (field === 'maleDormResidentCount') {
          patch.dormResidentCount = (value || 0) + (row.femaleDormResidentCount || 0)
        } else if (field === 'femaleDormResidentCount') {
          patch.dormResidentCount = (row.maleDormResidentCount || 0) + (value || 0)
        }

        // 如果用户直接修改总数量/总人数，则保持与男/女拆分一致：自动回写男=总-女
        if (field === 'dormManageCount') {
          patch.maleDormCount = Math.max(0, (value || 0) - (row.femaleDormCount || 0))
        }
        if (field === 'dormResidentCount') {
          patch.maleDormResidentCount = Math.max(0, (value || 0) - (row.femaleDormResidentCount || 0))
        }

        return {
          ...row,
          ...patch,
        }
      }),
    )
  }, [])

  const handleTextChange = useCallback((key: string, field: string, value: string) => {
    setDetailRows((prev) =>
      prev.map((row) =>
        row.key === key
          ? {
              ...row,
              [field]: value,
            }
          : row,
      ),
    )
  }, [])

  const fetchFromServer = useCallback(async (rosterOverride?: string[]) => {
    if (!canIO) {
      message.warning('请先选择神殿/年份')
      return
    }
    try {
      // 确保神殿名称完整（如果不以"神殿"结尾，则添加）
      const campusName = currentCampus!.endsWith('神殿') ? currentCampus! : `${currentCampus!}神殿`
      const res = await fetch(
        buildApiUrl(`/teaching-quality/campus-monthly-personal-dormitory-mgmt?campus=${encodeURIComponent(
          campusName,
        )}&year=${year}`),
      )
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      const rows = (data?.行列表 || []) as any[]

      // 以配置中心班主任名册（或兜底名单）×12个月为主，合并服务端明细
      const roster = rosterOverride ?? (teacherNames && teacherNames.length > 0 ? teacherNames : FALLBACK_TEACHERS)
      const base = createInitialDetailRows(roster)
      rows.forEach((r: any) => {
        const m = Number(r.month || 0)
        const n = String(r.name || '')
        const idx = base.findIndex((x) => x.month === m && x.name === n)
        if (idx >= 0) {
          base[idx] = {
            ...base[idx],
            classStudentCount: Number(r.classStudentCount || 0),
            dormManageCount: Number(r.dormManageCount || 0),
            dormResidentCount: Number(r.dormResidentCount || 0),
            maleDormCount: Number(r.maleDormCount || 0),
            maleDormResidentCount: Number(r.maleDormResidentCount || 0),
            maleEmptyBedCount: Number(r.maleEmptyBedCount || 0),
            maleNewStudentBedCount: Number(r.maleNewStudentBedCount || 0),
            femaleDormCount: Number(r.femaleDormCount || 0),
            femaleDormResidentCount: Number(r.femaleDormResidentCount || 0),
            femaleEmptyBedCount: Number(r.femaleEmptyBedCount || 0),
            femaleNewStudentBedCount: Number(r.femaleNewStudentBedCount || 0),
            planRentDormCount: Number(r.planRentDormCount || 0),
            actualRentDormCount: Number(r.actualRentDormCount || 0),
            planQuitDormCount: Number(r.planQuitDormCount || 0),
            actualQuitDormCount: Number(r.actualQuitDormCount || 0),
            remark: String(r.remark || ''),
          }
        }
      })
      setDetailRows(base)
      message.success('已刷新')
    } catch (e) {
      console.error(e)
      message.error('刷新失败')
    }
  }, [canIO, currentCampus, year, teacherNames])

  const saveToServer = useCallback(async () => {
    if (!canIO) {
      message.warning('请先选择神殿/年份')
      return
    }
    try {
      // 确保神殿名称完整（如果不以"神殿"结尾，则添加）
      const campusName = currentCampus!.endsWith('神殿') ? currentCampus! : `${currentCampus!}神殿`
      const payload = {
        神殿名称: campusName,
        年份: year,
        行列表: detailRows
          .filter((r) => !r.isMonthSummary && !r.isGrandSummary && r.name)
          .map((r) => ({
            month: r.month,
            name: r.name,
            classStudentCount: r.classStudentCount,
            dormManageCount: r.dormManageCount,
            dormResidentCount: r.dormResidentCount,
            maleDormCount: r.maleDormCount,
            maleDormResidentCount: r.maleDormResidentCount,
            maleEmptyBedCount: r.maleEmptyBedCount,
            maleNewStudentBedCount: r.maleNewStudentBedCount,
            femaleDormCount: r.femaleDormCount,
            femaleDormResidentCount: r.femaleDormResidentCount,
            femaleEmptyBedCount: r.femaleEmptyBedCount,
            femaleNewStudentBedCount: r.femaleNewStudentBedCount,
            planRentDormCount: r.planRentDormCount,
            actualRentDormCount: r.actualRentDormCount,
            planQuitDormCount: r.planQuitDormCount,
            actualQuitDormCount: r.actualQuitDormCount,
            remark: r.remark,
          })),
      }
      const res = await fetch(buildApiUrl('/teaching-quality/campus-monthly-personal-dormitory-mgmt'), {
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
  }, [canIO, currentCampus, year, detailRows, fetchFromServer])

  // 当神殿或年份变化时，自动拉取数据
  useEffect(() => {
    if (!canIO) return

    (async () => {
      const campusName = ensureCampusName(currentCampus!)
      try {
        const list = await fetchHomeroomTeachers({ campus_name: campusName })
        const names = Array.from(
          new Set(
            (list || [])
              .filter((t) => t && (t as any).is_active !== false)
              .map((t) => String((t as any).name || ''))
              .filter(Boolean),
          ),
        )
        const roster = names.length > 0 ? names : FALLBACK_TEACHERS
        setTeacherNames(roster)
        // 关键：将最新的名册 roster 直接传给 fetchFromServer，避免依赖异步的 state
        await fetchFromServer(roster)
      } catch (err) {
        console.error('加载班主任失败，使用兜底名单', err)
        setTeacherNames(FALLBACK_TEACHERS)
        await fetchFromServer(FALLBACK_TEACHERS)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canIO, currentCampus, year])

  const columns: ColumnsType<MonthlyPersonalDormRow> = useMemo(() => [
    {
      title: '月份',
      dataIndex: 'month',
      key: 'month',
      width: 80,
      align: 'center',
      onCell: (record) => {
        // 底部总合计/总平均：合并“月份”和“姓名”两列
        if (record.isGrandSummary) {
          return { rowSpan: 1, colSpan: 2, style: { textAlign: 'center' } }
        }
        // 月度合计行：隐藏本单元格（由当月首行合并）
        if (record.isMonthSummary) {
          return { rowSpan: 0, style: { textAlign: 'center' } }
        }
        // 每月第一位（以当前名册 roster[0] 为基准）合并当月数据行 + 合计行
        const month = record.month
        const roster = teacherNames && teacherNames.length > 0 ? teacherNames : FALLBACK_TEACHERS
        const isFirstRowOfMonth = record.key === `${month}-${roster[0]}`
        if (isFirstRowOfMonth) {
          return {
            rowSpan: roster.length + 1,
            style: { textAlign: 'center' },
          }
        }
        // 其他明细行隐藏月份单元格
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
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 140,
      align: 'center',
      onCell: (record) => {
        // 被“月份”列合并后，底部总合计/总平均隐藏“姓名”单元格
        if (record.isGrandSummary) {
          return { colSpan: 0, style: { textAlign: 'center' } }
        }
        return { colSpan: 1, style: { textAlign: 'center' } }
      },
      render: (text: string, record) =>
        record.isMonthSummary || record.isGrandSummary ? (
          <span style={{ color: 'red', fontWeight: 'bold' }}>{text}</span>
        ) : (
          <span>{text}</span>
        ),
    },
    {
      title: '带班人数',
      dataIndex: 'classStudentCount',
      key: 'classStudentCount',
      width: 120,
      align: 'center',
      render: (value: number, record) => {
        if (record.isMonthSummary || record.isGrandSummary) {
          return value || 0
        }
        return (
          <MemoizedInputNumberCell
            value={value}
            recordKey={record.key}
            field="classStudentCount"
            onChange={handleNumberChange}
          />
        )
      },
    },
    {
      title: '宿舍管理总数量',
      dataIndex: 'dormManageCount',
      key: 'dormManageCount',
      width: 150,
      align: 'center',
      render: (value: number, record) => {
        if (record.isMonthSummary || record.isGrandSummary) {
          return value || 0
        }
        return (
          <MemoizedInputNumberCell
            value={value}
            recordKey={record.key}
            field="dormManageCount"
            onChange={handleNumberChange}
          />
        )
      },
    },
    {
      title: '住宿总人数',
      dataIndex: 'dormResidentCount',
      key: 'dormResidentCount',
      width: 130,
      align: 'center',
      render: (value: number, record) => {
        if (record.isMonthSummary || record.isGrandSummary) {
          return value || 0
        }
        return (
          <MemoizedInputNumberCell
            value={value}
            recordKey={record.key}
            field="dormResidentCount"
            onChange={handleNumberChange}
          />
        )
      },
    },
    {
      title: '住宿率',
      dataIndex: 'dormRate',
      key: 'dormRate',
      width: 100,
      align: 'center',
      render: (_: unknown, record) => {
        const denominator = record.classStudentCount
        const numerator = record.dormResidentCount
        return formatRate(numerator, denominator)
      },
    },
    {
      title: '男宿情况',
      children: [
        {
          title: '男宿总数量',
          dataIndex: 'maleDormCount',
          key: 'maleDormCount',
          width: 120,
          align: 'center',
          render: (value: number, record) => {
            if (record.isMonthSummary || record.isGrandSummary) {
              return value || 0
            }
            return (
              <MemoizedInputNumberCell
                value={value}
                recordKey={record.key}
                field="maleDormCount"
                onChange={handleNumberChange}
              />
            )
          },
        },
        {
          title: '男宿总人数',
          dataIndex: 'maleDormResidentCount',
          key: 'maleDormResidentCount',
          width: 120,
          align: 'center',
          render: (value: number, record) => {
            if (record.isMonthSummary || record.isGrandSummary) {
              return value || 0
            }
            return (
              <MemoizedInputNumberCell
                value={value}
                recordKey={record.key}
                field="maleDormResidentCount"
                onChange={handleNumberChange}
              />
            )
          },
        },
        {
          title: '男宿空床位总数量',
          dataIndex: 'maleEmptyBedCount',
          key: 'maleEmptyBedCount',
          width: 150,
          align: 'center',
          render: (value: number, record) => {
            if (record.isMonthSummary || record.isGrandSummary) {
              return value || 0
            }
            return (
              <MemoizedInputNumberCell
                value={value}
                recordKey={record.key}
                field="maleEmptyBedCount"
                onChange={handleNumberChange}
              />
            )
          },
        },
        {
          title: '适合男新生床位数',
          dataIndex: 'maleNewStudentBedCount',
          key: 'maleNewStudentBedCount',
          width: 160,
          align: 'center',
          render: (value: number, record) => {
            if (record.isMonthSummary || record.isGrandSummary) {
              return value || 0
            }
            return (
              <MemoizedInputNumberCell
                value={value}
                recordKey={record.key}
                field="maleNewStudentBedCount"
                onChange={handleNumberChange}
              />
            )
          },
        },
      ],
    },
    {
      title: '女宿情况',
      children: [
        {
          title: '女宿总数量',
          dataIndex: 'femaleDormCount',
          key: 'femaleDormCount',
          width: 120,
          align: 'center',
          render: (value: number, record) => {
            if (record.isMonthSummary || record.isGrandSummary) {
              return value || 0
            }
            return (
              <MemoizedInputNumberCell
                value={value}
                recordKey={record.key}
                field="femaleDormCount"
                onChange={handleNumberChange}
              />
            )
          },
        },
        {
          title: '女宿总人数',
          dataIndex: 'femaleDormResidentCount',
          key: 'femaleDormResidentCount',
          width: 120,
          align: 'center',
          render: (value: number, record) => {
            if (record.isMonthSummary || record.isGrandSummary) {
              return value || 0
            }
            return (
              <MemoizedInputNumberCell
                value={value}
                recordKey={record.key}
                field="femaleDormResidentCount"
                onChange={handleNumberChange}
              />
            )
          },
        },
        {
          title: '女宿空床位总数量',
          dataIndex: 'femaleEmptyBedCount',
          key: 'femaleEmptyBedCount',
          width: 150,
          align: 'center',
          render: (value: number, record) => {
            if (record.isMonthSummary || record.isGrandSummary) {
              return value || 0
            }
            return (
              <MemoizedInputNumberCell
                value={value}
                recordKey={record.key}
                field="femaleEmptyBedCount"
                onChange={handleNumberChange}
              />
            )
          },
        },
        {
          title: '适合女新生住宿床位',
          dataIndex: 'femaleNewStudentBedCount',
          key: 'femaleNewStudentBedCount',
          width: 170,
          align: 'center',
          render: (value: number, record) => {
            if (record.isMonthSummary || record.isGrandSummary) {
              return value || 0
            }
            return (
              <MemoizedInputNumberCell
                value={value}
                recordKey={record.key}
                field="femaleNewStudentBedCount"
                onChange={handleNumberChange}
              />
            )
          },
        },
      ],
    },
    {
      title: '租宿舍',
      children: [
        {
          title: '计划租宿舍数量',
          dataIndex: 'planRentDormCount',
          key: 'planRentDormCount',
          width: 150,
          align: 'center',
          render: (value: number, record) => {
            if (record.isMonthSummary || record.isGrandSummary) {
              return value || 0
            }
            return (
              <MemoizedInputNumberCell
                value={value}
                recordKey={record.key}
                field="planRentDormCount"
                onChange={handleNumberChange}
              />
            )
          },
        },
        {
          title: '实际租宿舍数量',
          dataIndex: 'actualRentDormCount',
          key: 'actualRentDormCount',
          width: 150,
          align: 'center',
          render: (value: number, record) => {
            if (record.isMonthSummary || record.isGrandSummary) {
              return value || 0
            }
            return (
              <MemoizedInputNumberCell
                value={value}
                recordKey={record.key}
                field="actualRentDormCount"
                onChange={handleNumberChange}
              />
            )
          },
        },
      ],
    },
    {
      title: '退宿舍',
      children: [
        {
          title: '计划退宿舍数量',
          dataIndex: 'planQuitDormCount',
          key: 'planQuitDormCount',
          width: 150,
          align: 'center',
          render: (value: number, record) => {
            if (record.isMonthSummary || record.isGrandSummary) {
              return value || 0
            }
            return (
              <MemoizedInputNumberCell
                value={value}
                recordKey={record.key}
                field="planQuitDormCount"
                onChange={handleNumberChange}
              />
            )
          },
        },
        {
          title: '实际退宿舍数量',
          dataIndex: 'actualQuitDormCount',
          key: 'actualQuitDormCount',
          width: 150,
          align: 'center',
          render: (value: number, record) => {
            if (record.isMonthSummary || record.isGrandSummary) {
              return value || 0
            }
            return (
              <MemoizedInputNumberCell
                value={value}
                recordKey={record.key}
                field="actualQuitDormCount"
                onChange={handleNumberChange}
              />
            )
          },
        },
      ],
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      width: 200,
      align: 'left',
      render: (text: string, record) =>
        record.isMonthSummary || record.isGrandSummary ? (
          text
        ) : (
          <MemoizedInputCell
            value={text}
            recordKey={record.key}
            field="remark"
            onChange={handleTextChange}
          />
        ),
    },
  ], [teacherNames, handleNumberChange, handleTextChange])

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={`08-1${currentCampus ? (currentCampus.endsWith('神殿') ? currentCampus : `${currentCampus}神殿`) : '主神殿'}教化司每月个人宿舍管理统计表`}
        extra={
          <Space>
            <span>年份</span>
            <InputNumber
              min={2000}
              max={2100}
              value={year}
              onChange={(v) => setYear(typeof v === 'number' ? v : new Date().getFullYear())}
              style={{ width: 100 }}
            />
            <span>月份筛选</span>
            <Select
              style={{ width: 120 }}
              placeholder="全部月份"
              allowClear
              value={selectedMonth}
              onChange={(v) => setSelectedMonth(v ?? undefined)}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                <Option key={m} value={m}>
                  {m}月
                </Option>
              ))}
            </Select>
            <span>姓名筛选</span>
            <Select
              style={{ width: 140 }}
              placeholder="全部姓名"
              allowClear
              value={selectedName}
              onChange={(v) => setSelectedName(v ?? undefined)}
              showSearch
              optionFilterProp="children"
            >
              {(teacherNames && teacherNames.length > 0 ? teacherNames : FALLBACK_TEACHERS).map((name) => (
                <Option key={name} value={name}>
                  {name}
                </Option>
              ))}
            </Select>
            <Button onClick={() => fetchFromServer()} disabled={!canIO}>刷新</Button>
            <Button type="primary" onClick={saveToServer} disabled={!canIO}>保存</Button>
          </Space>
        }
      >
        <Table<MonthlyPersonalDormRow>
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
})

ShengbangMonthlyPersonalDormitoryManagementSummary.displayName = 'ShengbangMonthlyPersonalDormitoryManagementSummary'

export default ShengbangMonthlyPersonalDormitoryManagementSummary

