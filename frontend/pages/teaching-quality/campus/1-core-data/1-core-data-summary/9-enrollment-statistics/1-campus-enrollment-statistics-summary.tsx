import React, { useEffect, useMemo, useState, useCallback, useRef, memo } from 'react'
import { App, Card, Table, InputNumber, Space, Button, DatePicker, Dropdown } from 'antd'
import { DownOutlined } from '@ant-design/icons'
import { enrollmentStatisticsAutoFill } from '@/pages/teaching-quality/campus/1-core-data/8-enrollment-statistics/utils/enrollmentStatisticsAutoFill'
import { classFileEnrollmentReader } from '@/pages/teaching-quality/campus/1-core-data/8-enrollment-statistics/utils/classFileEnrollmentReader'
import type { ColumnsType } from 'antd/es/table'
import { useCampusStore } from '@/stores/campusStore'
import { buildApiUrl } from '@/utils/apiBase'
import dayjs from 'dayjs'

const FULL_WIDTH_STYLE: React.CSSProperties = { width: '100%' }

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

interface MonthRow {
  key: string
  month: number
  campus: string
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
}

interface TableRow extends MonthRow {
  isSummary?: boolean
}

const createInitialRows = (campus: string): MonthRow[] =>
  Array.from({ length: 12 }, (_, idx) => {
    const month = idx + 1
    return {
      key: String(month),
      month,
      campus,
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
  })

const CampusEnrollmentStatisticsSummary: React.FC = React.memo(() => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore()
  const [year, setYear] = useState<number>(new Date().getFullYear())
  const [rows, setRows] = useState<MonthRow[]>(() => createInitialRows(''))

  const canIO = useMemo(() => Boolean(currentCampus && year), [currentCampus, year])

  // 合计行
  const summaryRow: TableRow = useMemo(() => {
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
      month: 0,
      campus: '',
      secondaryTargetTime: '',
      collegeTargetTime: '',
      ...total,
      isSummary: true,
    }
  }, [rows])

  const dataSource: TableRow[] = useMemo(() => [...rows, summaryRow], [rows, summaryRow])

  const handleNumberChange = (
    key: string,
    field: keyof Omit<
      MonthRow,
      'key' | 'month' | 'campus' | 'secondaryTargetTime' | 'collegeTargetTime'
    >,
    value: number | null,
  ) => {
    const v = typeof value === 'number' ? value : 0
    setRows((prev) =>
      prev.map((row) =>
        row.key === key
          ? {
              ...row,
              [field]: v,
            }
          : row,
      ),
    )
  }

  const handleTextChange = useCallback((
    key: string,
    field: string,
    value: string,
  ) => {
    setRows((prev) =>
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

  // 读取
  const handleRefresh = useCallback(async () => {
    if (!canIO) {
      message.warning('请先选择神殿/年份')
      return
    }
    try {
      const res = await fetch(
        buildApiUrl(`/teaching-quality/campus-enrollment-statistics?campus=${encodeURIComponent(
          currentCampus!,
        )}&year=${year}`),
      )
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      const list = (data?.行列表 || []) as any[]
      if (!list.length) {
        setRows(createInitialRows(currentCampus!))
      } else {
        const mapped: MonthRow[] = list
          .map((r: any) => ({
            key: String(r.month),
            month: Number(r.month || 0),
            campus: r.campus || currentCampus!,
            secondaryThreeYearRegistered: Number(r.secondaryThreeYearRegistered || 0),
            secondaryOneYearRegistered: Number(r.secondaryOneYearRegistered || 0),
            secondaryOtherRegistered: Number(r.secondaryOtherRegistered || 0),
            secondaryTargetRegistered: Number(r.secondaryTargetRegistered || 0),
            secondaryTargetTime: String(r.secondaryTargetTime || ''),
            secondaryActualRegistered: Number(r.secondaryActualRegistered || 0),
            collegeAdultExamRegistered: Number(r.collegeAdultExamRegistered || 0),
            collegeOpenUnivRegistered: Number(r.collegeOpenUnivRegistered || 0),
            collegeOtherRegistered: Number(r.collegeOtherRegistered || 0),
            collegeTargetRegistered: Number(r.collegeTargetRegistered || 0),
            collegeTargetTime: String(r.collegeTargetTime || ''),
            collegeActualRegistered: Number(r.collegeActualRegistered || 0),
          }))
          .sort((a, b) => a.month - b.month)

        // 确保 1~12 月都有
        const full = createInitialRows(currentCampus!).map((tpl) => {
          const hit = mapped.find((m) => m.month === tpl.month)
          return hit ? hit : tpl
        })
        setRows(full)
      }
      message.success('已刷新')
    } catch (e) {
      console.error(e)
      message.error('刷新失败')
    }
  }, [canIO, currentCampus, year])

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
        行列表: rows.map((r) => ({
          month: r.month,
          campus: r.campus,
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
      const res = await fetch(buildApiUrl('/teaching-quality/campus-enrollment-statistics'), {
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
  }, [canIO, currentCampus, year, rows, handleRefresh])

  const prevCampusRef = useRef<string | null>(null)
  const prevYearRef = useRef<number | null>(null)

  // 切换神殿/年份时刷新
  useEffect(() => {
    if (!currentCampus) return
    
    const campusChanged = prevCampusRef.current !== currentCampus
    const yearChanged = prevYearRef.current !== year
    
    if (campusChanged || yearChanged) {
      prevCampusRef.current = currentCampus
      prevYearRef.current = year
      // 初始化空表，避免闪烁
      setRows(createInitialRows(currentCampus))
      handleRefresh()
    }
  }, [currentCampus, year, handleRefresh])

  const columns: ColumnsType<TableRow> = [
    {
      title: '月份',
      dataIndex: 'month',
      key: 'month',
      width: 120,
      align: 'center',
      render: (value: number, record) =>
        record.isSummary ? <span style={{ color: 'red', fontWeight: 'bold' }}>合计</span> : value,
    },
    {
      title: '神殿',
      dataIndex: 'campus',
      key: 'campus',
      width: 100,
      align: 'center',
      render: (text: string, record) => (record.isSummary ? '' : text || ''),
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
              <MemoizedDatePickerCell
                value={text}
                recordKey={record.key}
                field="secondaryTargetTime"
                onChange={handleTextChange}
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
              <MemoizedDatePickerCell
                value={text}
                recordKey={record.key}
                field="collegeTargetTime"
                onChange={handleTextChange}
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
  ]

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
        title={`${currentCampus || ''} · 教化司学籍统计表`}
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
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'from-roster',
                    label: '从学籍花名册获取',
                    onClick: async () => {
                      if (!currentCampus) {
                        message.warning('请先选择神殿')
                        return
                      }
                      try {
                        message.loading({ content: '正在从学籍花名册读取数据...', key: 'auto-fill', duration: 0 })
                        const details = await enrollmentStatisticsAutoFill.fetchAllDetails({
                          campus: currentCampus,
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
                        const monthly = enrollmentStatisticsAutoFill.computeMonthlySummary(details)
                        setRows(
                          createInitialRows(currentCampus).map((tpl) => {
                            const hit = monthly.find((m) => m.month === tpl.month)
                            return hit
                              ? {
                                  ...tpl,
                                  secondaryThreeYearRegistered: hit.secondaryThreeYearRegistered,
                                  secondaryOneYearRegistered: hit.secondaryOneYearRegistered,
                                  secondaryOtherRegistered: hit.secondaryOtherRegistered,
                                  secondaryActualRegistered: hit.secondaryActualRegistered,
                                  collegeAdultExamRegistered: hit.collegeAdultExamRegistered,
                                  collegeOpenUnivRegistered: hit.collegeOpenUnivRegistered,
                                  collegeOtherRegistered: hit.collegeOtherRegistered,
                                  collegeActualRegistered: hit.collegeActualRegistered,
                                }
                              : tpl
                          }),
                        )
                        message.success({ content: '已从学籍花名册获取数据', key: 'auto-fill' })
                      } catch (e) {
                        console.error(e)
                        message.error({ content: '从学籍花名册获取失败', key: 'auto-fill' })
                      }
                    },
                  },
                  {
                    key: 'from-class-file',
                    label: '从班级档案获取',
                    onClick: async () => {
                      if (!currentCampus) {
                        message.warning('请先选择神殿')
                        return
                      }
                      try {
                        message.loading({ content: '正在从班级档案读取数据...', key: 'auto-fill', duration: 0 })
                        const summary = await classFileEnrollmentReader.getSummary(currentCampus)
                        
                        // 将班级档案的数据填充到表格（所有月份使用相同的总数）
                        setRows(
                          createInitialRows(currentCampus).map((tpl) => ({
                            ...tpl,
                            secondaryThreeYearRegistered: summary.total.secondaryThreeYear,
                            secondaryOneYearRegistered: summary.total.secondaryOneYear,
                            secondaryOtherRegistered: summary.total.secondaryOther,
                            secondaryActualRegistered: 
                              summary.total.secondaryThreeYear + 
                              summary.total.secondaryOneYear + 
                              summary.total.secondaryOther,
                            collegeAdultExamRegistered: summary.total.collegeAdultExam,
                            collegeOpenUnivRegistered: summary.total.collegeOpenUniv,
                            collegeOtherRegistered: summary.total.collegeOther,
                            collegeActualRegistered: 
                              summary.total.collegeAdultExam + 
                              summary.total.collegeOpenUniv + 
                              summary.total.collegeOther,
                          })),
                        )
                        message.success({ 
                          content: `已从班级档案获取数据（中专: ${summary.total.secondaryThreeYear + summary.total.secondaryOneYear + summary.total.secondaryOther}人，大学: ${summary.total.collegeAdultExam + summary.total.collegeOpenUniv + summary.total.collegeOther}人）`, 
                          key: 'auto-fill',
                          duration: 3,
                        })
                      } catch (e) {
                        console.error(e)
                        message.error({ content: '从班级档案获取失败', key: 'auto-fill' })
                      }
                    },
                  },
                ],
              }}
              disabled={!canIO}
            >
              <Button>
                自动获取 <DownOutlined />
              </Button>
            </Dropdown>
            <Button onClick={handleRefresh} disabled={!canIO}>
              刷新
            </Button>
            <Button type="primary" onClick={handleSave} disabled={!canIO}>
              保存
            </Button>
          </Space>
        }
      >
        <Table<TableRow>
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

CampusEnrollmentStatisticsSummary.displayName = 'CampusEnrollmentStatisticsSummary'

export default CampusEnrollmentStatisticsSummary
