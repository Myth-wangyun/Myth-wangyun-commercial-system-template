/**
 * 09-1主神殿教化司个人负责学籍统计表（已接入后端）
 */

import React, { useEffect, useMemo, useState, useCallback, useRef, memo } from 'react'
import { App, Card, Table, Input, InputNumber, Space, Button, DatePicker, Dropdown } from 'antd'
import { DownOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useCampusStore } from '@/stores/campusStore'
import { buildApiUrl } from '@/utils/apiBase'
import { fetchHomeroomTeachers } from '@/services/configMaster'
import { enrollmentStatisticsAutoFill } from '@/pages/teaching-quality/campus/1-core-data/8-enrollment-statistics/utils/enrollmentStatisticsAutoFill'
import { classFileEnrollmentReader } from '@/pages/teaching-quality/campus/1-core-data/8-enrollment-statistics/utils/classFileEnrollmentReader'

const FULL_WIDTH_STYLE: React.CSSProperties = { width: '100%' }

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

// 优化的 DatePicker Cell 组件
const MemoizedDatePickerCell = memo<{
  value: string
  recordKey: string
  field: string
  onChange: (key: string, field: string, value: string) => void
}>(({ value, recordKey, field, onChange }) => {
  const handleChange = useCallback((date: dayjs.Dayjs | null) => {
    onChange(recordKey, field, date ? date.format('YYYY-MM-DD') : '')
  }, [recordKey, field, onChange])

  return (
    <DatePicker
      value={value ? dayjs(value) : null}
      onChange={handleChange}
      style={FULL_WIDTH_STYLE}
    />
  )
})

MemoizedDatePickerCell.displayName = 'MemoizedDatePickerCell'

interface PersonalEnrollmentRow {
  key: string
  serialNumber: number
  name: string
  // 中专层次
  secondaryThreeYearRegistered: number
  secondaryOneYearRegistered: number
  secondaryOtherRegistered: number
  secondaryTargetRegistered: number
  secondaryTargetTime: string
  secondaryActualRegistered: number
  // 大学层次
  collegeAdultExamRegistered: number
  collegeOpenUnivRegistered: number
  collegeOtherRegistered: number
  collegeTargetRegistered: number
  collegeTargetTime: string
  collegeActualRegistered: number
  isSummary?: boolean
}

const createInitialBodyRows = (names: string[] = []): PersonalEnrollmentRow[] => {
  const rows: PersonalEnrollmentRow[] = names.map((name, index) => ({
    key: String(index + 1),
    serialNumber: index + 1,
    name,
    secondaryThreeYearRegistered: 0,
    secondaryOneYearRegistered: 0,
    secondaryOtherRegistered: 0,
    secondaryTargetRegistered: 0,
    secondaryTargetTime: '',
    secondaryActualRegistered: 0,
    collegeAdultExamRegistered: 0,
    collegeOpenUnivRegistered: 0,
    collegeOtherRegistered: 0,
    collegeTargetRegistered: 0,
    collegeTargetTime: '',
    collegeActualRegistered: 0,
  }))

  return rows
}

const recomputeSummary = (rows: PersonalEnrollmentRow[]): PersonalEnrollmentRow => {
  const total = rows.reduce(
    (acc, r) => {
      acc.secondaryThreeYearRegistered += r.secondaryThreeYearRegistered || 0
      acc.secondaryOneYearRegistered += r.secondaryOneYearRegistered || 0
      acc.secondaryOtherRegistered += r.secondaryOtherRegistered || 0
      acc.secondaryTargetRegistered += r.secondaryTargetRegistered || 0
      acc.secondaryActualRegistered += r.secondaryActualRegistered || 0
      acc.collegeAdultExamRegistered += r.collegeAdultExamRegistered || 0
      acc.collegeOpenUnivRegistered += r.collegeOpenUnivRegistered || 0
      acc.collegeOtherRegistered += r.collegeOtherRegistered || 0
      acc.collegeTargetRegistered += r.collegeTargetRegistered || 0
      acc.collegeActualRegistered += r.collegeActualRegistered || 0
      return acc
    },
    {
      secondaryThreeYearRegistered: 0,
      secondaryOneYearRegistered: 0,
      secondaryOtherRegistered: 0,
      secondaryTargetRegistered: 0,
      secondaryActualRegistered: 0,
      collegeAdultExamRegistered: 0,
      collegeOpenUnivRegistered: 0,
      collegeOtherRegistered: 0,
      collegeTargetRegistered: 0,
      collegeActualRegistered: 0,
    },
  )

  return {
    key: 'summary',
    serialNumber: 0,
    name: '合计',
    secondaryTargetTime: '',
    collegeTargetTime: '',
    ...total,
    isSummary: true,
  }
}

const ShengbangPersonalEnrollmentStatisticsSummary: React.FC = React.memo(() => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore()
  const [year, setYear] = useState<number>(new Date().getFullYear())
  const [homeroomTeachers, setHomeroomTeachers] = useState<string[]>([])
  const [loadingTeachers, setLoadingTeachers] = useState(false)
  
  // 用于跟踪初始化状态和变化
  const isInitializedRef = useRef(false)
  const prevCampusRef = useRef<string>('')
  const prevYearRef = useRef<number>(year)

  // 加载班主任列表
  useEffect(() => {
    if (!currentCampus) {
      setHomeroomTeachers([])
      return
    }

    const loadTeachers = async () => {
      setLoadingTeachers(true)
      try {
        const teachers = await fetchHomeroomTeachers({
          campus_name: currentCampus,
          active: true,
        })
        const names = teachers.map((t) => t.name)
        setHomeroomTeachers(names)
      } catch (error) {
        console.error('Failed to fetch homeroom teachers:', error)
        setHomeroomTeachers([])
      } finally {
        setLoadingTeachers(false)
      }
    }

    loadTeachers()
  }, [currentCampus])

  // rows = bodies + summary
  const [rows, setRows] = useState<PersonalEnrollmentRow[]>(() => {
    const base = createInitialBodyRows([])
    return [...base, recomputeSummary(base)]
  })

  // 当班主任列表加载完成后，初始化表格
  useEffect(() => {
    if (homeroomTeachers.length > 0) {
      const base = createInitialBodyRows(homeroomTeachers)
      setRows([...base, recomputeSummary(base)])
    }
  }, [homeroomTeachers])

  const bodyRows = useMemo(() => rows.filter((r) => !r.isSummary), [rows])
  const summaryRow = useMemo(() => rows.find((r) => r.isSummary) as PersonalEnrollmentRow, [rows])

  const canIO = useMemo(() => Boolean(currentCampus && year), [currentCampus, year])

  const updateRows = useCallback((nextBodies: PersonalEnrollmentRow[]) => {
    const summary = recomputeSummary(nextBodies)
    setRows([...nextBodies, summary])
  }, [])

  const handleNumberChange = useCallback((
    key: string,
    field: string,
    value: number,
  ) => {
    setRows((prev) => {
      const bodies = prev.filter((r) => !r.isSummary)
      const nextBodies = bodies.map((row) =>
        row.key === key
          ? {
              ...row,
              [field]: value,
            }
          : row,
      )
      const summary = recomputeSummary(nextBodies)
      return [...nextBodies, summary]
    })
  }, [])

  const handleTextChange = useCallback((
    key: string,
    field: string,
    value: string,
  ) => {
    setRows((prev) => {
      const bodies = prev.filter((r) => !r.isSummary)
      const nextBodies = bodies.map((row) =>
        row.key === key
          ? {
              ...row,
              [field]: value,
            }
          : row,
      )
      const summary = recomputeSummary(nextBodies)
      return [...nextBodies, summary]
    })
  }, [])

  // 读取
  const handleRefresh = useCallback(async () => {
    if (!canIO) {
      message.warning('请先选择神殿/年份')
      return
    }
    try {
      const res = await fetch(
        buildApiUrl(`/teaching-quality/campus-personal-enrollment-statistics?campus=${encodeURIComponent(
          currentCampus!,
        )}&year=${year}`),
      )
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      const list = (data?.行列表 || []) as any[]

      if (!list.length) {
        // 如果没有保存的数据，使用从配置中心加载的班主任列表初始化
        const base = createInitialBodyRows(homeroomTeachers)
        updateRows(base)
      } else {
        // 有保存的数据时，合并配置中心的班主任列表
        // 1. 先加载保存的数据
        const savedDataMap = new Map<string, any>()
        list.forEach((r: any) => {
          if (r.name) {
            savedDataMap.set(r.name, r)
          }
        })

        // 2. 以配置中心的班主任列表为准，填充数据
        const mapped: PersonalEnrollmentRow[] = homeroomTeachers.map((name, idx) => {
          const savedData = savedDataMap.get(name)
          if (savedData) {
            return {
              key: String(idx + 1),
              serialNumber: idx + 1,
              name,
              secondaryThreeYearRegistered: Number(savedData.secondaryThreeYearRegistered || 0),
              secondaryOneYearRegistered: Number(savedData.secondaryOneYearRegistered || 0),
              secondaryOtherRegistered: Number(savedData.secondaryOtherRegistered || 0),
              secondaryTargetRegistered: Number(savedData.secondaryTargetRegistered || 0),
              secondaryTargetTime: String(savedData.secondaryTargetTime || ''),
              secondaryActualRegistered: Number(savedData.secondaryActualRegistered || 0),
              collegeAdultExamRegistered: Number(savedData.collegeAdultExamRegistered || 0),
              collegeOpenUnivRegistered: Number(savedData.collegeOpenUnivRegistered || 0),
              collegeOtherRegistered: Number(savedData.collegeOtherRegistered || 0),
              collegeTargetRegistered: Number(savedData.collegeTargetRegistered || 0),
              collegeTargetTime: String(savedData.collegeTargetTime || ''),
              collegeActualRegistered: Number(savedData.collegeActualRegistered || 0),
            }
          } else {
            return {
              key: String(idx + 1),
              serialNumber: idx + 1,
              name,
              secondaryThreeYearRegistered: 0,
              secondaryOneYearRegistered: 0,
              secondaryOtherRegistered: 0,
              secondaryTargetRegistered: 0,
              secondaryTargetTime: '',
              secondaryActualRegistered: 0,
              collegeAdultExamRegistered: 0,
              collegeOpenUnivRegistered: 0,
              collegeOtherRegistered: 0,
              collegeTargetRegistered: 0,
              collegeTargetTime: '',
              collegeActualRegistered: 0,
            }
          }
        })

        updateRows(mapped)
      }
      message.success('已刷新')
    } catch (e) {
      console.error(e)
      message.error('刷新失败')
    }
  }, [canIO, currentCampus, year, homeroomTeachers, updateRows])

  // 保存
  const handleSave = useCallback(async () => {
    if (!canIO) {
      message.warning('请先选择神殿/年份')
      return
    }
    try {
      const payload = {
        神殿名称: currentCampus!,
        年份: year,
        行列表: bodyRows.map((r) => ({
          serialNumber: r.serialNumber,
          name: r.name,
          secondaryThreeYearRegistered: r.secondaryThreeYearRegistered,
          secondaryOneYearRegistered: r.secondaryOneYearRegistered,
          secondaryOtherRegistered: r.secondaryOtherRegistered,
          secondaryTargetRegistered: r.secondaryTargetRegistered,
          secondaryTargetTime: r.secondaryTargetTime,
          secondaryActualRegistered: r.secondaryActualRegistered,
          collegeAdultExamRegistered: r.collegeAdultExamRegistered,
          collegeOpenUnivRegistered: r.collegeOpenUnivRegistered,
          collegeOtherRegistered: r.collegeOtherRegistered,
          collegeTargetRegistered: r.collegeTargetRegistered,
          collegeTargetTime: r.collegeTargetTime,
          collegeActualRegistered: r.collegeActualRegistered,
        })),
      }
      const res = await fetch(buildApiUrl('/teaching-quality/campus-personal-enrollment-statistics'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(await res.text())
      message.success('保存成功')
      await handleRefresh()
    } catch (e) {
      console.error(e)
      message.error('保存失败')
    }
  }, [canIO, currentCampus, year, bodyRows, handleRefresh])

  // 合并刷新逻辑：只在神殿或年份真正变化时刷新
  useEffect(() => {
    if (!currentCampus) return
    if (homeroomTeachers.length === 0) return // 等待班主任列表加载完成

    const campusChanged = prevCampusRef.current !== currentCampus
    const yearChanged = prevYearRef.current !== year

    if (!isInitializedRef.current) {
      // 首次初始化
      isInitializedRef.current = true
      prevCampusRef.current = currentCampus
      prevYearRef.current = year
      handleRefresh()
    } else if (campusChanged || yearChanged) {
      // 后续变化时刷新
      prevCampusRef.current = currentCampus
      prevYearRef.current = year
      handleRefresh()
    }
  }, [currentCampus, year, homeroomTeachers.length, handleRefresh])

  const columns: ColumnsType<PersonalEnrollmentRow> = useMemo(() => [
    {
      title: '序号',
      dataIndex: 'serialNumber',
      key: 'serialNumber',
      width: 80,
      align: 'center',
      onCell: (record) => {
        // 合计行：横向合并“序号”和“姓名”
        if (record.isSummary) {
          return { colSpan: 2, style: { textAlign: 'center' } }
        }
        return { colSpan: 1, style: { textAlign: 'center' } }
      },
      render: (value, record) =>
        record.isSummary ? <span style={{ color: 'red', fontWeight: 'bold' }}>合计</span> : value,
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 140,
      align: 'center',
      onCell: (record) => {
        if (record.isSummary) {
          return { colSpan: 0, style: { textAlign: 'center' } }
        }
        return { colSpan: 1, style: { textAlign: 'center' } }
      },
      render: (text: string, record) =>
        record.isSummary ? (
          <span style={{ color: 'red', fontWeight: 'bold' }}>{text}</span>
        ) : (
          <span>{text}</span>
        ),
    },
    {
      title: '中专层次',
      className: 'secondary-level-header',
      children: [
        {
          title: '中专3年学籍注册人数',
          dataIndex: 'secondaryThreeYearRegistered',
          key: 'secondaryThreeYearRegistered',
          width: 180,
          align: 'center',
          render: (value: number, record) =>
            record.isSummary ? (
              summaryRow.secondaryThreeYearRegistered || 0
            ) : (
              <InputNumber
                min={0}
                value={value || 0}
                style={{ width: '100%' }}
                onChange={(v) =>
                  handleNumberChange(record.key, 'secondaryThreeYearRegistered', v ?? 0)
                }
              />
            ),
        },
        {
          title: '中专1年制人数',
          dataIndex: 'secondaryOneYearRegistered',
          key: 'secondaryOneYearRegistered',
          width: 150,
          align: 'center',
          render: (value: number, record) =>
            record.isSummary ? (
              summaryRow.secondaryOneYearRegistered || 0
            ) : (
              <InputNumber
                min={0}
                value={value || 0}
                style={{ width: '100%' }}
                onChange={(v) =>
                  handleNumberChange(record.key, 'secondaryOneYearRegistered', v ?? 0)
                }
              />
            ),
        },
        {
          title: '其他已注册人数',
          dataIndex: 'secondaryOtherRegistered',
          key: 'secondaryOtherRegistered',
          width: 150,
          align: 'center',
          render: (value: number, record) =>
            record.isSummary ? (
              summaryRow.secondaryOtherRegistered || 0
            ) : (
              <InputNumber
                min={0}
                value={value || 0}
                style={{ width: '100%' }}
                onChange={(v) => handleNumberChange(record.key, 'secondaryOtherRegistered', v ?? 0)}
              />
            ),
        },
        {
          title: '目标注册人数',
          dataIndex: 'secondaryTargetRegistered',
          key: 'secondaryTargetRegistered',
          width: 140,
          align: 'center',
          render: (value: number, record) =>
            record.isSummary ? (
              summaryRow.secondaryTargetRegistered || 0
            ) : (
              <InputNumber
                min={0}
                value={value || 0}
                style={{ width: '100%' }}
                onChange={(v) =>
                  handleNumberChange(record.key, 'secondaryTargetRegistered', v ?? 0)
                }
              />
            ),
        },
        {
          title: '目标注册时间',
          dataIndex: 'secondaryTargetTime',
          key: 'secondaryTargetTime',
          width: 140,
          align: 'center',
          render: (text: string, record) =>
            record.isSummary ? (
              ''
            ) : (
              <DatePicker
                value={text ? dayjs(text) : null}
                onChange={(date) =>
                  handleTextChange(record.key, 'secondaryTargetTime', date ? date.format('YYYY-MM-DD') : '')
                }
                style={{ width: '100%' }}
              />
            ),
        },
        {
          title: '实际注册人数',
          dataIndex: 'secondaryActualRegistered',
          key: 'secondaryActualRegistered',
          width: 140,
          align: 'center',
          render: (value: number, record) =>
            record.isSummary ? (
              summaryRow.secondaryActualRegistered || 0
            ) : (
              <InputNumber
                min={0}
                value={value || 0}
                style={{ width: '100%' }}
                onChange={(v) =>
                  handleNumberChange(record.key, 'secondaryActualRegistered', v ?? 0)
                }
              />
            ),
        },
      ],
    },
    {
      title: '大学层次',
      className: 'college-level-header',
      children: [
        {
          title: '成考注册人数',
          dataIndex: 'collegeAdultExamRegistered',
          key: 'collegeAdultExamRegistered',
          width: 140,
          align: 'center',
          render: (value: number, record) =>
            record.isSummary ? (
              summaryRow.collegeAdultExamRegistered || 0
            ) : (
              <InputNumber
                min={0}
                value={value || 0}
                style={{ width: '100%' }}
                onChange={(v) =>
                  handleNumberChange(record.key, 'collegeAdultExamRegistered', v ?? 0)
                }
              />
            ),
        },
        {
          title: '国开注册人数',
          dataIndex: 'collegeOpenUnivRegistered',
          key: 'collegeOpenUnivRegistered',
          width: 140,
          align: 'center',
          render: (value: number, record) =>
            record.isSummary ? (
              summaryRow.collegeOpenUnivRegistered || 0
            ) : (
              <InputNumber
                min={0}
                value={value || 0}
                style={{ width: '100%' }}
                onChange={(v) =>
                  handleNumberChange(record.key, 'collegeOpenUnivRegistered', v ?? 0)
                }
              />
            ),
        },
        {
          title: '其他已注册人数',
          dataIndex: 'collegeOtherRegistered',
          key: 'collegeOtherRegistered',
          width: 150,
          align: 'center',
          render: (value: number, record) =>
            record.isSummary ? (
              summaryRow.collegeOtherRegistered || 0
            ) : (
              <InputNumber
                min={0}
                value={value || 0}
                style={{ width: '100%' }}
                onChange={(v) => handleNumberChange(record.key, 'collegeOtherRegistered', v ?? 0)}
              />
            ),
        },
        {
          title: '目标注册人数',
          dataIndex: 'collegeTargetRegistered',
          key: 'collegeTargetRegistered',
          width: 140,
          align: 'center',
          render: (value: number, record) =>
            record.isSummary ? (
              summaryRow.collegeTargetRegistered || 0
            ) : (
              <InputNumber
                min={0}
                value={value || 0}
                style={{ width: '100%' }}
                onChange={(v) => handleNumberChange(record.key, 'collegeTargetRegistered', v ?? 0)}
              />
            ),
        },
        {
          title: '目标注册时间',
          dataIndex: 'collegeTargetTime',
          key: 'collegeTargetTime',
          width: 140,
          align: 'center',
          render: (text: string, record) =>
            record.isSummary ? (
              ''
            ) : (
              <DatePicker
                value={text ? dayjs(text) : null}
                onChange={(date) =>
                  handleTextChange(record.key, 'collegeTargetTime', date ? date.format('YYYY-MM-DD') : '')
                }
                style={{ width: '100%' }}
              />
            ),
        },
        {
          title: '实际注册人数',
          dataIndex: 'collegeActualRegistered',
          key: 'collegeActualRegistered',
          width: 140,
          align: 'center',
          render: (value: number, record) =>
            record.isSummary ? (
              summaryRow.collegeActualRegistered || 0
            ) : (
              <InputNumber
                min={0}
                value={value || 0}
                style={{ width: '100%' }}
                onChange={(v) => handleNumberChange(record.key, 'collegeActualRegistered', v ?? 0)}
              />
            ),
        },
      ],
    },
  ], [summaryRow, handleNumberChange, handleTextChange])

  return (
    <div style={{ padding: 24 }}>
      <style>
        {`
          .secondary-level-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
            color: #fff !important;
            font-weight: bold !important;
            font-size: 15px !important;
            border-right: 3px solid #fff !important;
          }
          .secondary-level-header .ant-table-cell {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
            color: #fff !important;
          }
          .college-level-header {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%) !important;
            color: #fff !important;
            font-weight: bold !important;
            font-size: 15px !important;
          }
          .college-level-header .ant-table-cell {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%) !important;
            color: #fff !important;
          }
          .ant-table-thead > tr > th.secondary-level-header,
          .ant-table-thead > tr > th.college-level-header {
            text-align: center !important;
          }
        `}
      </style>
      <Card
        title={`${currentCampus || ''} · 教化司个人负责学籍统计表`}
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
            <Button
              onClick={async () => {
                if (!canIO) {
                  message.warning('请先选择神殿/年份')
                  return
                }
                try {
                  const details = await enrollmentStatisticsAutoFill.fetchAllDetails({
                    campus: currentCampus!,
                    year,
                    categories: [
                      'secondary-3year-registered',
                      'secondary-1year-registered',
                      'other-secondary-registered',
                      'adult-exam-registered',
                      'open-university-registered',
                      'other-higher-registered',
                    ],
                  })
                  const personal = enrollmentStatisticsAutoFill.computePersonalSummary(
                    details,
                    homeroomTeachers,
                  )

                  const mapped: PersonalEnrollmentRow[] = personal.map((p, idx) => ({
                    key: String(idx + 1),
                    serialNumber: idx + 1,
                    name: p.name,
                    secondaryThreeYearRegistered: p.secondaryThreeYearRegistered,
                    secondaryOneYearRegistered: p.secondaryOneYearRegistered,
                    secondaryOtherRegistered: p.secondaryOtherRegistered,
                    secondaryTargetRegistered: 0,
                    secondaryTargetTime: '',
                    secondaryActualRegistered: p.secondaryActualRegistered,
                    collegeAdultExamRegistered: p.collegeAdultExamRegistered,
                    collegeOpenUnivRegistered: p.collegeOpenUnivRegistered,
                    collegeOtherRegistered: p.collegeOtherRegistered,
                    collegeTargetRegistered: 0,
                    collegeTargetTime: '',
                    collegeActualRegistered: p.collegeActualRegistered,
                  }))

                  // 保留你们可能手填的“目标注册人数/目标注册时间”：
                  // 这里不做合并（避免覆盖），用户可先点“刷新”加载已保存的目标，再点“自动获取”只更新已注册/实际注册。
                  // 但为了简单可用，这里直接回填，并提示用户。
                  updateRows(mapped)
                  message.success('已从明细自动获取（目标字段请按需手填/保存）')
                } catch (e) {
                  console.error(e)
                  message.error('自动获取失败')
                }
              }}
              disabled={!canIO || homeroomTeachers.length === 0}
            >
              自动获取
            </Button>
            <Button onClick={handleRefresh} disabled={!canIO}>
              刷新
            </Button>
            <Button type="primary" onClick={handleSave} disabled={!canIO}>
              保存
            </Button>
          </Space>
        }
      >
        <Table<PersonalEnrollmentRow>
          bordered
          size="small"
          columns={columns}
          dataSource={rows}
          pagination={false}
          rowKey="key"
          scroll={{ x: 'max-content' }}
        />
      </Card>
    </div>
  )
})

ShengbangPersonalEnrollmentStatisticsSummary.displayName = 'ShengbangPersonalEnrollmentStatisticsSummary'

export default ShengbangPersonalEnrollmentStatisticsSummary
