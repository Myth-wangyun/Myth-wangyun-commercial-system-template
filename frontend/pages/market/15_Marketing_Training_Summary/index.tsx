import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { App, Button, Card, Space } from 'antd'
import { FileTextOutlined, PlusOutlined, ReloadOutlined, SaveOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import TrainingTabs, { type MonthlyRow, type TrainingSummaryRow, type TrainingTabKey } from './TrainingTabs'
import type { WeeklyTrainingRow } from './WeeklyTrainingTable'
import api from '@/services/api'
import dayjs from 'dayjs'

// 获取当前年份和年月
const getCurrentYear = () => dayjs().format('YYYY')
const getCurrentYearMonth = () => dayjs().format('YYYY-MM')

interface WeeklyTrainingApiRow {
  id: number
  year_month: string
  row_index: number
  position: string
  training_time: string
  training_project: string
  main_content: string
  training_method: string
  organizer: string
  trainee_count: number
  qualified_count: number
  pass_rate: number
  avg_score: number
}

interface WeeklyTrainingTotals {
  trainee_count: number
  qualified_count: number
  pass_rate: string
  avg_score: string
}

interface WeeklyTrainingListResponse {
  items: WeeklyTrainingApiRow[]
  totals: WeeklyTrainingTotals
}

type MonthlyCategoryKey = 'values' | 'campusSpecialty' | 'jobKnowledge' | 'professionalism'

type MonthlyMetricKey = 'sessions' | 'trainees' | 'qualified' | 'passRate'

const MarketingTrainingSummaryPage: React.FC = () => {
  const { message } = App.useApp()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [activeTab, setActiveTab] = useState<string>('summary')
  const [summaryYear, setSummaryYear] = useState<string>(getCurrentYear())
  const [monthlyYear, setMonthlyYear] = useState<string>(getCurrentYear())
  const [monthlyRows, setMonthlyRows] = useState<MonthlyRow[]>([])
  const [monthlyDirty, setMonthlyDirty] = useState(false)
  const [summaryData, setSummaryData] = useState<TrainingSummaryRow[]>([])
  const [summaryDirty, setSummaryDirty] = useState(false)

  // 加载培训汇总表数据
  const loadSummaryData = useCallback(async (year: string) => {
    if (!year) return
    setLoading(true)
    try {
      const res = await api.get<TrainingSummaryRow[]>('/market/training-summary', { params: { year } })
      const data = res.data as unknown as TrainingSummaryRow[]
      setSummaryData(data)
      setSummaryDirty(false)
    } catch (err: any) {
      message.error(err?.message || '加载汇总数据失败')
    } finally {
      setLoading(false)
    }
  }, [])

  // 保存汇总表备注
  const saveSummaryRemarks = useCallback(async () => {
    if (!summaryYear) {
      message.warning('请先选择年份')
      return
    }
    setSaving(true)
    try {
      // 从 summaryData 中提取备注数据
      const remarksToSave = summaryData.map((row) => ({
        position: row.position,
        remarks: row.remarks || '',
      }))

      await api.post('/market/training-summary-remarks/bulk-save', {
        year: summaryYear,
        remarks: remarksToSave,
      })
      
      setSummaryDirty(false)
      message.success('备注保存成功')
    } catch (err: any) {
      message.error(err?.message || '保存备注失败')
    } finally {
      setSaving(false)
    }
  }, [summaryYear, summaryData])

  // 更新汇总表备注
  const updateSummaryRemark = useCallback((rowId: string | number, remarks: string) => {
    setSummaryData((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, remarks } : row))
    )
    setSummaryDirty(true)
  }, [])

  // 加载培训月度表汇总数据
  const loadMonthlyData = useCallback(async (year: string) => {
    if (!year) return
    setLoading(true)
    try {
      const res = await api.get<MonthlyRow[]>('/market/monthly-training-summary', { params: { year } })
      const data = res.data as unknown as MonthlyRow[]
      setMonthlyRows(data)
      setMonthlyDirty(false)
    } catch (err: any) {
      message.error(err?.message || '加载月度数据失败')
    } finally {
      setLoading(false)
    }
  }, [])

  // 保存月度表备注
  const saveMonthlyRemarks = useCallback(async () => {
    if (!monthlyYear) {
      message.warning('请先选择年份')
      return
    }
    setSaving(true)
    try {
      // 从 monthlyRows 中提取备注数据
      const remarksToSave: { year: string; month: number; position: string; remarks: string }[] = []
      
      monthlyRows.forEach((row) => {
        // 解析 id 获取 position 和 month
        // id 格式: "01-网推-summary" 或 "01-网推-1"
        const parts = row.id.split('-')
        if (parts.length >= 3) {
          const position = parts[1]
          const monthPart = parts[2]
          const month = monthPart === 'summary' ? 0 : parseInt(monthPart, 10)
          
          if (position && !isNaN(month)) {
            remarksToSave.push({
              year: monthlyYear,
              month,
              position,
              remarks: row.remarks || '',
            })
          }
        }
      })

      await api.post('/market/monthly-training-remarks/bulk-save', {
        year: monthlyYear,
        remarks: remarksToSave,
      })
      
      setMonthlyDirty(false)
      message.success('备注保存成功')
    } catch (err: any) {
      message.error(err?.message || '保存备注失败')
    } finally {
      setSaving(false)
    }
  }, [monthlyYear, monthlyRows])

  // 更新月度表备注
  const updateMonthlyRemark = useCallback((rowId: string, remarks: string) => {
    setMonthlyRows((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, remarks } : row))
    )
    setMonthlyDirty(true)
  }, [])

  // 当月度表年份变化时加载数据
  useEffect(() => {
    if (activeTab === 'monthly' && monthlyYear) {
      loadMonthlyData(monthlyYear)
    }
  }, [activeTab, monthlyYear, loadMonthlyData])

  // 当汇总表年份变化时加载数据
  useEffect(() => {
    if (activeTab === 'summary' && summaryYear) {
      loadSummaryData(summaryYear)
    }
  }, [activeTab, summaryYear, loadSummaryData])

  // 生成空的汇总表数据（当没有选择年份或没有数据时使用）
  const defaultSummaryData: TrainingSummaryRow[] = [
    {
      id: 'total',
      index: '合计',
      position: '',
      training_sessions: '',
      trainees_count: '',
      qualified_count: '',
      pass_rate: '',
      remarks: '',
    },
    {
      id: 1,
      index: 1,
      position: '网推',
      training_sessions: '',
      trainees_count: '',
      qualified_count: '',
      pass_rate: '',
      remarks: '',
    },
    {
      id: 2,
      index: 2,
      position: '网聊',
      training_sessions: '',
      trainees_count: '',
      qualified_count: '',
      pass_rate: '',
      remarks: '',
    },
    {
      id: 3,
      index: 3,
      position: 'AI研发',
      training_sessions: '',
      trainees_count: '',
      qualified_count: '',
      pass_rate: '',
      remarks: '',
    },
    {
      id: 4,
      index: 4,
      position: '线上',
      training_sessions: '',
      trainees_count: '',
      qualified_count: '',
      pass_rate: '',
      remarks: '',
    },
  ]

  // 使用从后端加载的数据，如果没有则使用空数据
  const displaySummaryData = useMemo(() => {
    if (summaryData.length > 0) {
      return summaryData
    }
    return defaultSummaryData
  }, [summaryData])

  const monthlySections = [
    { no: '01', position: '网推' },
    { no: '02', position: '网聊' },
    { no: '03', position: 'AI研发' },
    { no: '04', position: '线上' },
  ]

  // 生成空的月度表数据（当没有选择年份或没有数据时使用）
  const makeEmptyMonthlyRows = (): MonthlyRow[] => {
    const result: MonthlyRow[] = []
    
    for (const section of monthlySections) {
      const { no, position } = section
      const months = Array.from({ length: 12 }, (_, i) => `${i + 1}月份`)

      const emptyMetrics = {
        values_sessions: '',
        values_trainees: '',
        values_qualified: '',
        values_passRate: '',
        campusSpecialty_sessions: '',
        campusSpecialty_trainees: '',
        campusSpecialty_qualified: '',
        campusSpecialty_passRate: '',
        jobKnowledge_sessions: '',
        jobKnowledge_trainees: '',
        jobKnowledge_qualified: '',
        jobKnowledge_passRate: '',
        professionalism_sessions: '',
        professionalism_trainees: '',
        professionalism_qualified: '',
        professionalism_passRate: '',
        remarks: '',
      }

      // 汇总行
      result.push({
        id: `${no}-${position}-summary`,
        time: '',
        project: '汇总',
        position,
        ...emptyMetrics,
      })

      // 12个月份行
      months.forEach((m, idx) => {
        result.push({
          id: `${no}-${position}-${idx + 1}`,
          time: m,
          project: '',
          position: '',
          ...emptyMetrics,
        })
      })
    }
    
    return result
  }

  // 使用从后端加载的数据，如果没有则使用空数据
  const displayMonthlyRows = useMemo(() => {
    if (monthlyRows.length > 0) {
      return monthlyRows
    }
    return makeEmptyMonthlyRows()
  }, [monthlyRows])

  const [weeklyMonth, setWeeklyMonth] = useState<string>(getCurrentYearMonth())

  const [weeklyRows, setWeeklyRows] = useState<WeeklyTrainingRow[]>([
    {
      id: 'weekly-total',
      index: '合计',
      position: '',
      training_time: '',
      training_project: '',
      main_content: '',
      training_method: '',
      organizer: '',
      trainee_count: '0',
      qualified_count: '0',
      pass_rate: '#DIV/0!',
      avg_score: '#DIV/0!',
    },
  ])

  // 将 API 返回的数据转换为前端格式
  const convertApiToFrontend = (apiData: WeeklyTrainingListResponse): WeeklyTrainingRow[] => {
    const dataRows: WeeklyTrainingRow[] = apiData.items.map((item) => ({
      id: String(item.id),
      index: item.row_index,
      position: item.position,
      training_time: item.training_time,
      training_project: item.training_project,
      main_content: item.main_content,
      training_method: item.training_method,
      organizer: item.organizer,
      trainee_count: String(item.trainee_count || ''),
      qualified_count: String(item.qualified_count || ''),
      pass_rate: item.trainee_count > 0 ? `${((item.qualified_count / item.trainee_count) * 100).toFixed(2)}%` : '',
      avg_score: item.avg_score > 0 ? String(item.avg_score) : '',
    }))

    // 添加合计行
    const totalRow: WeeklyTrainingRow = {
      id: 'weekly-total',
      index: '合计',
      position: '',
      training_time: '',
      training_project: '',
      main_content: '',
      training_method: '',
      organizer: '',
      trainee_count: String(apiData.totals.trainee_count),
      qualified_count: String(apiData.totals.qualified_count),
      pass_rate: apiData.totals.pass_rate,
      avg_score: apiData.totals.avg_score,
    }

    return [totalRow, ...dataRows]
  }

  // 将前端数据转换为 API 格式
  const convertFrontendToApi = (rows: WeeklyTrainingRow[]) => {
    return rows
      .filter((r) => r.id !== 'weekly-total' && typeof r.index === 'number')
      .map((r) => ({
        id: r.id.startsWith('weekly-') ? undefined : parseInt(r.id, 10),
        row_index: typeof r.index === 'number' ? r.index : 0,
        position: r.position,
        training_time: r.training_time,
        training_project: r.training_project,
        main_content: r.main_content,
        training_method: r.training_method,
        organizer: r.organizer,
        trainee_count: parseInt(r.trainee_count, 10) || 0,
        qualified_count: parseInt(r.qualified_count, 10) || 0,
        pass_rate: 0, // 后端会自动计算
        avg_score: parseFloat(r.avg_score) || 0,
      }))
  }

  // 加载培训周度表数据
  const loadWeeklyData = useCallback(async (yearMonth?: string) => {
    setLoading(true)
    try {
      const params = yearMonth ? { year_month: yearMonth } : {}
      const res = await api.get<WeeklyTrainingListResponse>('/market/weekly-training', { params })
      const data = res.data as unknown as WeeklyTrainingListResponse
      const converted = convertApiToFrontend(data)
      setWeeklyRows(converted)
      setDirty(false)
    } catch (err: any) {
      message.error(err?.message || '加载数据失败')
    } finally {
      setLoading(false)
    }
  }, [])

  // 保存培训周度表数据
  const saveWeeklyData = useCallback(async () => {
    if (!weeklyMonth) {
      message.warning('请先选择年月')
      return
    }
    setSaving(true)
    try {
      const payload = {
        year_month: weeklyMonth,
        rows: convertFrontendToApi(weeklyRows),
      }
      const res = await api.post<{ items: WeeklyTrainingApiRow[]; totals: WeeklyTrainingTotals }>(
        '/market/weekly-training/bulk-save',
        payload
      )
      const data = res.data as unknown as WeeklyTrainingListResponse
      const converted = convertApiToFrontend(data)
      setWeeklyRows(converted)
      setDirty(false)
      message.success('保存成功')
    } catch (err: any) {
      message.error(err?.message || '保存失败')
    } finally {
      setSaving(false)
    }
  }, [weeklyMonth, weeklyRows])

  // 当年月变化时加载数据
  useEffect(() => {
    if (activeTab === 'weekly' && weeklyMonth) {
      loadWeeklyData(weeklyMonth)
    }
  }, [activeTab, weeklyMonth, loadWeeklyData])

  const summaryColumns: ColumnsType<TrainingSummaryRow> = useMemo(
    () => [
      {
        title: '序号',
        dataIndex: 'index',
        key: 'index',
        width: 80,
        align: 'center' as const,
      },
      {
        title: '岗位',
        dataIndex: 'position',
        key: 'position',
        width: 150,
        align: 'center' as const,
      },
      {
        title: '累计培训次数',
        dataIndex: 'training_sessions',
        key: 'training_sessions',
        width: 150,
        align: 'center' as const,
      },
      {
        title: '累计培训人数',
        dataIndex: 'trainees_count',
        key: 'trainees_count',
        width: 150,
        align: 'center' as const,
      },
      {
        title: '累计合格人数',
        dataIndex: 'qualified_count',
        key: 'qualified_count',
        width: 150,
        align: 'center' as const,
      },
      {
        title: '考试合格率',
        dataIndex: 'pass_rate',
        key: 'pass_rate',
        width: 150,
        align: 'center' as const,
      },
      {
        title: '备注',
        dataIndex: 'remarks',
        key: 'remarks',
        width: 200,
        align: 'center' as const,
      },
    ],
    [],
  )

  const getMonthlyCellValue = (
    record: MonthlyRow,
    category: MonthlyCategoryKey,
    metric: MonthlyMetricKey,
  ): string => {
    const key = `${category}_${metric}` as keyof MonthlyRow
    return (record[key] as string) || ''
  }

  const monthlyColumns: ColumnsType<MonthlyRow> = useMemo(() => {
    const makeMetricCol = (
      title: string,
      category: MonthlyCategoryKey,
      metric: MonthlyMetricKey,
    ) => ({
      title,
      key: `${category}_${metric}`,
      dataIndex: `${category}_${metric}`,
      width: 80,
      align: 'center' as const,
      render: (_: unknown, record: MonthlyRow) => getMonthlyCellValue(record, category, metric),
    })

    const mergeDown = (pos: string) => ({
      rowSpan: pos ? 12 : 0,
    })

    return [
      {
        title: '时间',
        dataIndex: 'time',
        key: 'time',
        width: 80,
        align: 'center' as const,
      },
      {
        title: '项目',
        dataIndex: 'project',
        key: 'project',
        width: 70,
        align: 'center' as const,
      },
      {
        title: '岗位',
        dataIndex: 'position',
        key: 'position',
        width: 70,
        align: 'center' as const,
        onCell: (record: MonthlyRow) => mergeDown(record.position),
      },
      {
        title: '价值观',
        key: 'values',
        children: [
          makeMetricCol('培训次数', 'values', 'sessions'),
          makeMetricCol('培训人数', 'values', 'trainees'),
          makeMetricCol('合格人次', 'values', 'qualified'),
          makeMetricCol('合格率', 'values', 'passRate'),
        ],
      },
      {
        title: '神殿专业知识培训',
        key: 'campusSpecialty',
        children: [
          makeMetricCol('培训次数', 'campusSpecialty', 'sessions'),
          makeMetricCol('培训人数', 'campusSpecialty', 'trainees'),
          makeMetricCol('合格人次', 'campusSpecialty', 'qualified'),
          makeMetricCol('合格率', 'campusSpecialty', 'passRate'),
        ],
      },
      {
        title: '岗位知识培训',
        key: 'jobKnowledge',
        children: [
          makeMetricCol('培训次数', 'jobKnowledge', 'sessions'),
          makeMetricCol('培训人数', 'jobKnowledge', 'trainees'),
          makeMetricCol('合格人次', 'jobKnowledge', 'qualified'),
          makeMetricCol('合格率', 'jobKnowledge', 'passRate'),
        ],
      },
      {
        title: '职业素养',
        key: 'professionalism',
        children: [
          makeMetricCol('培训次数', 'professionalism', 'sessions'),
          makeMetricCol('培训人数', 'professionalism', 'trainees'),
          makeMetricCol('合格人次', 'professionalism', 'qualified'),
          makeMetricCol('合格率', 'professionalism', 'passRate'),
        ],
      },
      {
        title: '备注',
        dataIndex: 'remarks',
        key: 'remarks',
        width: 100,
        align: 'center' as const,
      },
    ]
  }, [])

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          marginBottom: 24,
          textAlign: 'center',
          fontSize: '20px',
          fontWeight: 'bold',
          padding: '10px 16px',
          backgroundColor: '#fadb14', // Gold color for the header
          borderRadius: 0,
          border: '1px solid #000',
        }}
      >
        <FileTextOutlined style={{ marginRight: 8 }} />
        01最高议事厅 市场部-培训汇总表
      </div>

      <Card>
        <div
          style={{
            marginBottom: 16,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Space>
            <Button
              icon={<PlusOutlined />}
              type="primary"
              onClick={() => {
                if (activeTab === 'weekly') {
                  setWeeklyRows((prev) => {
                    const nextIndex = prev.filter((r) => typeof r.index === 'number').length + 1
                    return [
                      ...prev,
                      {
                        id: `weekly-${Date.now()}-${Math.random().toString(16).slice(2)}`,
                        index: nextIndex,
                        position: '',
                        training_time: '',
                        training_project: '',
                        main_content: '',
                        training_method: '',
                        organizer: '',
                        trainee_count: '',
                        qualified_count: '',
                        pass_rate: '',
                        avg_score: '',
                      },
                    ]
                  })
                  setDirty(true)
                  return
                }

                // 其它 Tab 先保持不处理（避免破坏现有结构）
              }}
            >
              新增
            </Button>
            <Button
              icon={<SaveOutlined />}
              type="primary"
              ghost
              disabled={
                (activeTab === 'weekly' && (!dirty || !weeklyMonth)) ||
                (activeTab === 'monthly' && (!monthlyDirty || !monthlyYear)) ||
                (activeTab === 'summary' && (!summaryDirty || !summaryYear))
              }
              loading={saving}
              onClick={() => {
                if (activeTab === 'weekly') {
                  saveWeeklyData()
                } else if (activeTab === 'monthly') {
                  saveMonthlyRemarks()
                } else if (activeTab === 'summary') {
                  saveSummaryRemarks()
                }
              }}
            >
              保存
            </Button>
            <Button
              icon={<ReloadOutlined />}
              loading={loading}
              onClick={() => {
                if (activeTab === 'weekly') {
                  loadWeeklyData(weeklyMonth)
                } else if (activeTab === 'monthly') {
                  loadMonthlyData(monthlyYear)
                } else if (activeTab === 'summary') {
                  loadSummaryData(summaryYear)
                }
              }}
            >
              加载
            </Button>
          </Space>
        </div>

        <TrainingTabs
          activeTab={activeTab as TrainingTabKey}
          onChangeTab={(key) => {
            setActiveTab(key)
            setDirty(false)
            setMonthlyDirty(false)
            setSummaryDirty(false)
          }}
          summaryColumns={summaryColumns}
          summaryData={displaySummaryData}
          onSummaryRemarkChange={updateSummaryRemark}
          monthlyColumns={monthlyColumns}
          monthlyRows={displayMonthlyRows}
          onMonthlyRemarkChange={updateMonthlyRemark}
          weeklyMonth={weeklyMonth}
          onChangeWeeklyMonth={setWeeklyMonth}
          weeklyData={weeklyRows}
          onWeeklyDataChange={(nextData) => {
            setWeeklyRows(nextData)
            setDirty(true)
          }}
          summaryYear={summaryYear}
          onChangeSummaryYear={setSummaryYear}
          monthlyYear={monthlyYear}
          onChangeMonthlyYear={setMonthlyYear}
        />

        <style>{`
          .ant-table-container table { border-color: #000 !important; }
          .ant-table-thead > tr > th { background-color: #c6e0b4 !important; border-color: #000 !important; }
          .ant-table-tbody > tr > td { border-color: #000 !important; }
          .ant-table-cell { padding: 8px 8px !important; }
        `}</style>
      </Card>
    </div>
  );
};

export default MarketingTrainingSummaryPage;

