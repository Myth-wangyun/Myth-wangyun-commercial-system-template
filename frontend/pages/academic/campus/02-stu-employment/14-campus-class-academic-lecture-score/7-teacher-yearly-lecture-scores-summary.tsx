import React, { useEffect, useMemo, useState } from 'react'
import { App, Card, Table, Typography, InputNumber, Space, Button, Select } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import {
  teacherLectureScoreSheetService,
  teacherYearlyLectureScoreSummaryService,
} from '@/services/service'
import { fetchTeachers, type TeacherProfile } from '@/services/configMaster'
import { useCampusStore } from '@/stores/campusStore'

const { Title, Text } = Typography

export type SummaryRow = {
  key: string
  name: string
  m1?: number
  m2?: number
  m3?: number
  m4?: number
  m5?: number
  m6?: number
  m7?: number
  m8?: number
  m9?: number
  m10?: number
  m11?: number
  m12?: number
}

const STORAGE_KEY = 'teacher-lecture-yearly-summary:v1'

const DEFAULT_TEACHERS = [
  '杜鹏涛',
  '张志恒',
  '姜东亮',
  '温强',
  '张夺',
  '张丽亚',
  '党彦春',
  '任颖玲',
  '刘恩其',
  '马世超',
  '张博',
  '钱肖彬',
]

const avg = (arr: (number | undefined)[]) => {
  const vals = arr.filter((v): v is number => typeof v === 'number')
  if (!vals.length) return undefined
  const s = vals.reduce((a, b) => a + b, 0)
  return Math.round((s / vals.length) * 100) / 100
}

const buildDefault = (): SummaryRow[] =>
  DEFAULT_TEACHERS.map((n, i) => ({ key: String(i), name: n }))

const stripCampus = (s?: string) => (s ? s.replace(/神殿$/, '') : '')

const buildRowsFromTeachers = (list: TeacherProfile[]): SummaryRow[] => {
  const rows = (list || [])
    .map((t, idx) => ({
      key: t.id ? String(t.id) : `t-${idx}`,
      name: t.name || '',
    }))
    .filter((r) => r.name)
  rows.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
  return rows
}

const YearlyLectureScoresSummary: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore()
  const [rows, setRows] = useState<SummaryRow[]>(buildDefault)
  const [loading, setLoading] = useState(false)
  const [teachers, setTeachers] = useState<TeacherProfile[]>([])
  const [year, setYear] = useState<number>(dayjs().year())

  const yearOptions = useMemo(
    () =>
      Array.from({ length: 2035 - 2024 + 1 }).map((_, idx) => {
        const y = 2024 + idx
        return { label: `${y}年`, value: y }
      }),
    [],
  )

  const fetchTeacherListForCampus = async (campusName?: string) => {
    const campusCode = stripCampus(campusName)
    let teacherList =
      (await fetchTeachers({ campus_name: campusName || campusCode, active: true })) || []

    if ((!teacherList || teacherList.length === 0) && campusCode) {
      teacherList = (await fetchTeachers({ campus_name: campusCode, active: true })) || []
    }
    if (!teacherList || teacherList.length === 0) {
      teacherList = (await fetchTeachers({ active: true })) || []
    }
    return teacherList
  }

  const refreshTeachersFromConfig = async () => {
    try {
      setLoading(true)
      const teacherList = await fetchTeacherListForCampus(currentCampus)
      setTeachers(teacherList || [])
      const teacherRows = buildRowsFromTeachers(teacherList || [])
      if (teacherRows.length > 0) {
        setRows(teacherRows)
      } else {
        setRows(buildDefault())
      }
    } catch (error) {
      console.warn('加载教员列表失败，使用默认列表', error)
      setRows(buildDefault())
    } finally {
      setLoading(false)
    }
  }

  // 从个人详细数据自动计算汇总
  const calculateSummaryFromDetails = async (opts?: { autoSave?: boolean }) => {
    try {
      setLoading(true)
      // 从听课成绩表（明细表）获取当前神殿的所有记录
      const allSheets = await teacherLectureScoreSheetService.list({
        campusName: currentCampus,
        year,
      })

      console.log('获取到的所有听课成绩表记录:', allSheets)

      if (!allSheets || allSheets.length === 0) {
        message.info('暂无听课成绩表数据，无法自动计算汇总')
        return
      }

      // 获取教员列表（用于确定汇总表格的行）
      const campusCode = stripCampus(currentCampus)
      const teacherList = await fetchTeacherListForCampus(currentCampus || campusCode)
      setTeachers(teacherList || [])

      // 按教员聚合计算（来源：听课成绩表的总分）
      const summaryRows: SummaryRow[] = []

      allSheets.forEach((sheet, idx) => {
        const row: SummaryRow = { key: sheet.id ? String(sheet.id) : String(idx), name: sheet.teacherName }
        for (let month = 1; month <= 12; month++) {
          const sum = (sheet.rows || []).reduce(
            (acc, r: any) => acc + (Number(r[`m${month}`]) || 0),
            0,
          )
          if (sum > 0) {
            ;(row as any)[`m${month}`] = Math.round(sum * 10) / 10
          }
        }
        const overall = avg([
          row.m1,
          row.m2,
          row.m3,
          row.m4,
          row.m5,
          row.m6,
          row.m7,
          row.m8,
          row.m9,
          row.m10,
          row.m11,
          row.m12,
        ])
        ;(row as any).avg = overall
        summaryRows.push(row)
      })

      // 按姓名排序（中文排序）
      summaryRows.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))

      setRows(summaryRows)

      if (opts?.autoSave) {
        try {
          await teacherYearlyLectureScoreSummaryService.upsertByYear(year, summaryRows, currentCampus)
          message.success(`已自动计算并保存 ${year} 年汇总数据，共 ${summaryRows.length} 位教员`)
        } catch (e: any) {
          console.error('自动保存汇总失败', e)
          message.warning(e?.response?.data?.detail || '自动保存失败，请手动保存')
        }
      } else {
        message.success(`已自动计算汇总数据，共 ${summaryRows.length} 位教员`)
      }
    } catch (error) {
      console.error('计算汇总数据失败:', error)
      message.error('计算汇总数据失败，请检查网络连接')
    } finally {
      setLoading(false)
    }
  }

  // 从后端加载汇总数据（如果有保存的汇总数据）
  const loadSummaryFromBackend = async () => {
    try {
      setLoading(true)

      // 先尝试从后端加载已保存的汇总数据（按神殿+年份）
      try {
        const summaryRecord = await teacherYearlyLectureScoreSummaryService.getByYear(year, currentCampus)
        if (summaryRecord && summaryRecord.summary_data && summaryRecord.summary_data.length > 0) {
          // 如果有保存的汇总数据，使用保存的数据
          const savedRows: SummaryRow[] = summaryRecord.summary_data.map((item: any) => ({
            key: item.key || String(Math.random()),
            name: item.name || '',
            m1: item.m1,
            m2: item.m2,
            m3: item.m3,
            m4: item.m4,
            m5: item.m5,
            m6: item.m6,
            m7: item.m7,
            m8: item.m8,
            m9: item.m9,
            m10: item.m10,
            m11: item.m11,
            m12: item.m12,
          }))
          setRows(savedRows)
          message.success(`已加载 ${year} 年的汇总数据`)
          return
        }
      } catch (error: any) {
        // 如果后端没有数据（404），则自动计算
        if (error?.response?.status !== 404) {
          console.warn('加载后端汇总数据失败:', error)
        }
      }

      // 如果没有保存的汇总数据，则自动计算
      await calculateSummaryFromDetails({ autoSave: true })
    } catch (error) {
      console.error('加载汇总数据失败:', error)
      message.warning('加载汇总数据失败，尝试加载本地数据')
      // 如果失败，尝试加载本地数据
      loadLocalData()
    } finally {
      setLoading(false)
    }
  }

  // 加载本地存储的数据
  const loadLocalData = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const obj = JSON.parse(raw)
        if (Array.isArray(obj)) setRows(obj)
      }
    } catch {}
  }

  // 当神殿或年份变化时，重新加载数据
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)

        // 1. 先获取当前神殿的教员列表
        const teacherList = await fetchTeacherListForCampus(currentCampus)
        setTeachers(teacherList || [])
        const teacherRows = buildRowsFromTeachers(teacherList || [])

        // 2. 尝试从后端加载已保存的汇总数据（按神殿+年份）
        try {
          const summaryRecord = await teacherYearlyLectureScoreSummaryService.getByYear(year, currentCampus)
          if (summaryRecord && summaryRecord.summary_data && summaryRecord.summary_data.length > 0) {
            // 如果有保存的汇总数据，使用保存的数据
            const savedRows: SummaryRow[] = summaryRecord.summary_data.map((item: any) => ({
              key: item.key || String(Math.random()),
              name: item.name || '',
              m1: item.m1,
              m2: item.m2,
              m3: item.m3,
              m4: item.m4,
              m5: item.m5,
              m6: item.m6,
              m7: item.m7,
              m8: item.m8,
              m9: item.m9,
              m10: item.m10,
              m11: item.m11,
              m12: item.m12,
            }))
            setRows(savedRows)
            message.success(`已加载 ${year} 年的汇总数据`)
            return
          }
        } catch (error: any) {
          // 如果后端没有数据（404），继续下一步
          if (error?.response?.status !== 404) {
            console.warn('加载后端汇总数据失败:', error)
          }
        }

        // 3. 如果后端没有数据，尝试自动计算
        const allSheets = await teacherLectureScoreSheetService.list({
          campusName: currentCampus,
          year,
        })

        if (allSheets && allSheets.length > 0) {
          // 有听课成绩表数据，自动计算汇总
          const summaryRows: SummaryRow[] = []
          allSheets.forEach((sheet, idx) => {
            const row: SummaryRow = { key: sheet.id ? String(sheet.id) : String(idx), name: sheet.teacherName }
            for (let month = 1; month <= 12; month++) {
              const sum = (sheet.rows || []).reduce(
                (acc, r: any) => acc + (Number(r[`m${month}`]) || 0),
                0,
              )
              if (sum > 0) {
                ;(row as any)[`m${month}`] = Math.round(sum * 10) / 10
              }
            }
            summaryRows.push(row)
          })
          summaryRows.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
          setRows(summaryRows)
        } else {
          // 4. 没有任何数据，使用教员列表作为初始行
          if (teacherRows.length > 0) {
            setRows(teacherRows)
          } else {
            setRows(buildDefault())
          }
        }
      } catch (error) {
        console.error('加载数据失败:', error)
        setRows(buildDefault())
      } finally {
        setLoading(false)
      }
    }

    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCampus, year])

  // 保存到本地
  const persist = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rows))
      message.success('已保存到本地')
    } catch {
      message.error('本地保存失败')
    }
  }

  // 保存到后端
  const saveToBackend = async (rowsToSave?: SummaryRow[]) => {
    try {
      setLoading(true)
      
      // 准备汇总数据（只保存有值的字段）
      const source = rowsToSave || rows
      const summaryData = source.map(row => {
        const data: any = {
          key: row.key,
          name: row.name,
        }
        // 只保存有值的月份数据
        for (let month = 1; month <= 12; month++) {
          const value = (row as any)[`m${month}`]
          if (value !== undefined && value !== null && value !== '') {
            data[`m${month}`] = Number(value)
          }
        }
        return data
      })
      
      await teacherYearlyLectureScoreSummaryService.upsertByYear(year, summaryData, currentCampus)
      message.success(`已保存 ${year} 年的汇总数据到后端`)
    } catch (error: any) {
      console.error('保存到后端失败:', error)
      message.error(error?.response?.data?.detail || '保存到后端失败，请检查网络连接')
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setRows(buildDefault())
    message.info('已重置为默认数据')
  }

  const columns: ColumnsType<SummaryRow> = [
    { title: '姓名', dataIndex: 'name', width: 140, fixed: 'left' },
    ...Array.from({ length: 12 }).map((_, i) => ({
      title: `${i + 1}月`,
      dataIndex: `m${i + 1}`,
      width: 110,
      align: 'center' as const,
      render: (_: any, _r: SummaryRow, rowIdx: number) => {
        const monthValue = (rows[rowIdx] as any)[`m${i + 1}`] as number | undefined
        return (
          <InputNumber
            min={0}
            max={100}
            value={monthValue !== undefined && monthValue !== null ? monthValue : null}
            onChange={(val) =>
              setRows((prev) =>
                prev.map((rr, idx) =>
                  idx === rowIdx
                    ? ({ ...rr, [`m${i + 1}`]: val !== null && val !== undefined ? Number(val) : undefined } as any)
                    : rr,
                ),
              )
            }
            placeholder="自动计算"
            style={{ width: '100%' }}
          />
        )
      },
    })),
    {
      title: '平均',
      key: 'avg',
      width: 110,
      align: 'center',
      render: (_: any, r: SummaryRow) =>
        avg([r.m1, r.m2, r.m3, r.m4, r.m5, r.m6, r.m7, r.m8, r.m9, r.m10, r.m11, r.m12]) ?? '-',
    },
  ]

  const monthAvgs = useMemo(() => {
    const arr: (number | undefined)[] = []
    for (let i = 1; i <= 12; i++) {
      const vals = rows.map((r) => (r as any)[`m${i}`] as number | undefined)
      arr.push(avg(vals))
    }
    return arr
  }, [rows])

  const overall = useMemo(() => avg(monthAvgs), [monthAvgs])

  return (
    <Card bordered={false} style={{ background: '#f5f7fa' }}>
      <Title level={5} style={{ marginBottom: 8 }}>
        汇总
      </Title>
      <Space style={{ marginBottom: 12 }}>
        <Text>年份</Text>
        <Select
          style={{ width: 140 }}
          options={yearOptions}
          value={year}
          onChange={(v) => setYear(v)}
        />
      </Space>
      <Table<SummaryRow>
        bordered
        size="small"
        columns={columns}
        dataSource={rows}
        pagination={false}
        scroll={{ x: 'max-content' }}
        summary={() => (
          <Table.Summary fixed>
            <Table.Summary.Row>
              <Table.Summary.Cell index={0}>
                <Text strong>平均</Text>
              </Table.Summary.Cell>
              {Array.from({ length: 12 }).map((_, i) => (
                <Table.Summary.Cell index={i + 1} key={i} align="center">
                  {monthAvgs[i] ?? '-'}
                </Table.Summary.Cell>
              ))}
              <Table.Summary.Cell index={13} align="center">
                {overall ?? '-'}
              </Table.Summary.Cell>
            </Table.Summary.Row>
          </Table.Summary>
        )}
      />

      <Space style={{ marginTop: 12 }}>
        <Button type="primary" onClick={() => calculateSummaryFromDetails({ autoSave: true })} loading={loading}>
          自动计算并保存
        </Button>
        <Button onClick={loadSummaryFromBackend} loading={loading}>
          刷新数据
        </Button>
        <Button type="primary" onClick={() => saveToBackend()} loading={loading}>
          保存到后端
        </Button>
        <Button onClick={persist}>
          保存（本地）
        </Button>
        <Button onClick={reset}>重置</Button>
      </Space>
    </Card>
  )
}

export default YearlyLectureScoresSummary
