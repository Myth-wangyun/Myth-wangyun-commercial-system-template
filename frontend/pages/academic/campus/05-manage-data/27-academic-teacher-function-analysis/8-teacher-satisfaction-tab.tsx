// 学术->学术经理->管理表格 学员满意度TAB：按月x教员矩阵，行当月平均与列教员平均（后端持久化）
import React, { useEffect, useMemo, useState } from 'react'
import { App, Card, Table, Typography, Space, Button, Input, InputNumber, Row, Col, Select } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useCampusStore } from '@/stores/campusStore'
import { getSatisfaction, saveSatisfaction } from '@/services/studentSatisfaction'
import type { SatisfactionBackendRow } from '@/services/studentSatisfaction'
import { fetchTeachers, type TeacherProfile } from '@/services/configMaster'
import { studentSatisfactionDetailService } from '@/services/service'
import { GlobalYearSelector } from '@/components/common'

const { Title } = Typography
const { Option } = Select

type MonthKey = 'm1' | 'm2' | 'm3' | 'm4' | 'm5' | 'm6' | 'm7' | 'm8' | 'm9' | 'm10' | 'm11' | 'm12'
const MONTH_KEYS: MonthKey[] = [
  'm1',
  'm2',
  'm3',
  'm4',
  'm5',
  'm6',
  'm7',
  'm8',
  'm9',
  'm10',
  'm11',
  'm12',
]
const MONTH_LABELS = [
  '1月',
  '2月',
  '3月',
  '4月',
  '5月',
  '6月',
  '7月',
  '8月',
  '9月',
  '10月',
  '11月',
  '12月',
]

type RowType = 'data' | 'summary'

interface SatisfactionRow {
  key: string
  monthKey?: MonthKey
  monthLabel: string
  rowType?: RowType
  rowAvg?: number // 当月平均
  // 动态教师列值：t0..t9
  [k: `t${number}`]: number | string | MonthKey | undefined
}

const buildInitialRows = (): SatisfactionRow[] =>
  MONTH_KEYS.map((mk, idx) => ({
    key: mk,
    monthKey: mk,
    monthLabel: MONTH_LABELS[idx],
  }))

const calcRowAverage = (row: SatisfactionRow, teacherKeys: string[]): number | undefined => {
  const vals = teacherKeys
    .map((k) => row[k as `t${number}`] as number | undefined)
    .filter((v): v is number => typeof v === 'number')
  if (!vals.length) return undefined
  const sum = vals.reduce((a, b) => a + (b || 0), 0)
  return Number((sum / vals.length).toFixed(2))
}

const TeacherSatisfactionTab: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore()
  const now = new Date()
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear())
  const [teacherNames, setTeacherNames] = useState<string[]>([])
  const [rows, setRows] = useState<SatisfactionRow[]>(() => buildInitialRows())
  const [loading, setLoading] = useState(false)

  const campusName = currentCampus || '主神殿'

  const teacherKeys = useMemo(() => teacherNames.map((_, i) => `t${i}`), [teacherNames])

  // 计算带有“当月平均”的数据行，并追加“教员平均”汇总行
  const dataWithSummary = useMemo(() => {
    const items = rows.map((r) => ({
      ...r,
      rowAvg: calcRowAverage(r, teacherKeys as any),
    }))

    // 底部“教员平均”行
    const summary: SatisfactionRow = { key: 'summary', monthLabel: '教员平均', rowType: 'summary' }
    teacherKeys.forEach((tk, index) => {
      const vals = items
        .map((r) => r[tk as `t${number}`] as number | undefined)
        .filter((v): v is number => typeof v === 'number')
      if (vals.length)
        (summary as any)[tk] = Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2))
    })
    return [...items, summary]
  }, [rows, teacherKeys])

  const loadData = async () => {
    setLoading(true)
    try {
      // 获取教员列表（按神殿过滤，参与KPI）
      const teachers = await fetchTeachers({
        campus_name: campusName,
        active: true,
        participate_kpi: true,
      })
      const configNames = teachers
        .filter((t: TeacherProfile) => t.is_active && t.participate_kpi)
        .map((t) => t.name)
        .filter(Boolean)
      setTeacherNames(configNames)

      const res = await getSatisfaction(campusName, selectedYear)
      const teacherRows = res.行数据 || []
      if (teacherRows.length > 0) {
        const names = teacherRows
          .sort((a, b) => (a.序号 || 0) - (b.序号 || 0))
          .map((r, idx) => r.姓名 || `教员${r.序号 || idx + 1}`)
        const mergedNames = Array.from(new Set([...configNames, ...names].filter(Boolean)))
        setTeacherNames(mergedNames.concat(Array(Math.max(0, 10 - mergedNames.length)).fill('')))

        const grid = buildInitialRows()
        teacherRows.forEach((tr, tIdx) => {
          MONTH_KEYS.forEach((mk, mIdx) => {
            const val = tr[`m${mIdx + 1}` as keyof SatisfactionBackendRow]
            if (typeof val === 'number') {
              ;(grid[mIdx] as any)[`t${tIdx}`] = val
            }
          })
        })
        setRows(grid)
      } else {
        setTeacherNames(configNames.concat(Array(Math.max(0, 10 - configNames.length)).fill('')))
        setRows(buildInitialRows())
      }
    } catch (error) {
      console.error('加载满意度数据失败', error)
      message.error('加载失败')
      setTeacherNames([])
      setRows(buildInitialRows())
    } finally {
      setLoading(false)
    }
  }

  // 从 student_satisfaction_details 聚合自动填充
  const autoFillFromDetails = async () => {
    setLoading(true)
    try {
      // 直接调用后端聚合接口，从明细表 student_satisfaction_details 计算平均值
      const avgList = await studentSatisfactionDetailService.getAvg(campusName, selectedYear)
      if (!avgList || avgList.length === 0) {
        message.info('暂无学员满意度明细，无法自动填充')
        return
      }

      const teacherList = avgList.map(
        (item, idx) => (item as any).teacherName || (item as any).teacher_name || `教员${idx + 1}`,
      )
      setTeacherNames(teacherList.concat(Array(Math.max(0, 10 - teacherList.length)).fill('')))
      const grid = buildInitialRows()

      avgList.forEach((item, tIdx) => {
        MONTH_KEYS.forEach((mk, mIdx) => {
          const raw = (item as any)[mk]
          if (raw !== undefined && raw !== null && !Number.isNaN(Number(raw))) {
            ;(grid[mIdx] as any)[`t${tIdx}`] = Number(raw)
          }
        })
      })
      setRows(grid)
      message.success('已从满意度明细自动聚合填充')
      // 延迟滚动到页面顶部，确保DOM已更新
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }, 100)
    } catch (error) {
      console.error('自动聚合满意度明细失败', error)
      message.error('自动聚合失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campusName, selectedYear])

  const updateCell = (rowIndex: number, teacherIndex: number, value: number | null) => {
    setRows((prev) =>
      prev.map((r, i) => (i === rowIndex ? { ...r, [`t${teacherIndex}`]: value ?? undefined } : r)),
    )
  }

  const updateTeacherName = (teacherIndex: number, name: string) => {
    setTeacherNames((prev) => prev.map((n, i) => (i === teacherIndex ? name : n)))
  }

  const columns: ColumnsType<SatisfactionRow> = [
    { title: '姓名', dataIndex: 'monthLabel', width: 120, fixed: 'left', align: 'center' },
  ]

  teacherNames.forEach((name, idx) => {
    const titleNode = (
      <div>
        <Select
          value={name || undefined}
          placeholder={`教员${idx + 1}`}
          showSearch
          allowClear
          style={{ width: '100%' }}
          options={teacherNames.map((n) => ({ label: n, value: n }))}
          filterOption={(input, option) =>
            (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
          }
          onChange={(value) => updateTeacherName(idx, value || '')}
          onBlur={(e) => {
            const val = (e.target as HTMLInputElement)?.value?.trim()
            if (val && !teacherNames.includes(val)) {
              setTeacherNames((prev) => [...prev, val])
              updateTeacherName(idx, val)
            }
          }}
        />
      </div>
    )
    columns.push({
      title: titleNode,
      dataIndex: `t${idx}`,
      width: 110,
      align: 'center',
      render: (v: any, record, rowIndex) =>
        record.rowType === 'summary' ? (
          <span>{typeof v === 'number' ? v : ''}</span>
        ) : (
          <InputNumber
            min={0}
            max={100}
            style={{ width: '100%' }}
            value={typeof v === 'number' ? v : undefined}
            onChange={(val) => updateCell(rowIndex, idx, (val as number) ?? 0)}
          />
        ),
    } as any)
  })

  columns.push({
    title: '当月平均',
    dataIndex: 'rowAvg',
    align: 'center',
    width: 120,
    render: (v, record) => (record.rowType === 'summary' ? '' : typeof v === 'number' ? v : ''),
  })

  return (
    <Card bordered={false}>
      <Space style={{ marginBottom: 8, width: '100%', justifyContent: 'space-between' }}>
        <Space>
        <Title level={5} style={{ margin: 0 }}>
          XX神殿智慧司学员满意度汇总表
        </Title>
        <Row gutter={12} align="middle">
          <Col><span>年份</span></Col>
          <Col>
            <GlobalYearSelector 
              value={selectedYear} 
              onChange={setSelectedYear}
              width={120}
            />
          </Col>
          <Col><span>神殿</span></Col>
          <Col>
            <Input disabled value={campusName} style={{ width: 160 }} />
          </Col>
        </Row>
        </Space>
        <Space>
          <Button
            onClick={() => {
              setTeacherNames((prev) => [...prev, ''])
              setRows(buildInitialRows())
            }}
            disabled={loading}
          >
            新增教员列
          </Button>
          <Button onClick={autoFillFromDetails} loading={loading}>
            自动获取数据
          </Button>
          <Button
            onClick={() => {
              setTeacherNames(teacherNames.filter(Boolean))
              setRows(buildInitialRows())
            }}
            disabled={loading}
          >
            清空
          </Button>
          <Button
            type="primary"
            loading={loading}
            onClick={async () => {
              setLoading(true)
              try {
                // 转置为后端“按教员一行”的结构
                const teacherRows: SatisfactionBackendRow[] = []
                teacherNames.forEach((name, tIdx) => {
                  const months: Record<string, number> = {}
                  let hasValue = !!name && name.trim().length > 0
                  MONTH_KEYS.forEach((mk, mIdx) => {
                    const val = rows[mIdx][`t${tIdx}` as `t${number}`]
                    if (typeof val === 'number') {
                      months[`m${mIdx + 1}`] = val
                      hasValue = true
                    }
                  })
                  if (hasValue) {
                    teacherRows.push({
                      序号: tIdx + 1,
                      姓名: name || `教员${tIdx + 1}`,
                      ...months,
                    })
                  }
                })

                const saved = await saveSatisfaction(campusName, selectedYear, teacherRows)
                const savedRows = saved.行数据 || []

                // 回填
                const namesFromSaved = savedRows
                  .sort((a, b) => (a.序号 || 0) - (b.序号 || 0))
                  .map((r, idx) => r.姓名 || `教员${r.序号 || idx + 1}`)
                setTeacherNames(namesFromSaved.concat(Array(Math.max(0, 10 - namesFromSaved.length)).fill('')))

                if (savedRows.length > 0) {
                  const grid = buildInitialRows()
                  savedRows.forEach((tr, tIdx) => {
                    MONTH_KEYS.forEach((mk, mIdx) => {
                      const val = tr[`m${mIdx + 1}` as keyof SatisfactionBackendRow]
                      if (typeof val === 'number') {
                        ;(grid[mIdx] as any)[`t${tIdx}`] = val
                      }
                    })
                  })
                  setRows(grid)
                } else {
                  setRows(buildInitialRows())
                }
                message.success('已保存')
              } catch (error) {
                console.error('保存失败', error)
                message.error('保存失败')
              } finally {
                setLoading(false)
              }
            }}
          >
            保存
          </Button>
        </Space>
      </Space>
      <Table<SatisfactionRow>
        bordered
        size="small"
        columns={columns}
        dataSource={dataWithSummary}
        pagination={false}
        scroll={{ x: 'max-content' }}
        rowClassName={(r) => (r.rowType === 'summary' ? 'summary-row' : '')}
        loading={loading}
      />
    </Card>
  )
}

export default TeacherSatisfactionTab
