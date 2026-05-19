/**
 * 新生仍欠费明细表（只读版本）
 * 从教化司后端获取数据，智慧司只读展示
 */
import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { App, Card, Table, Select, Space, Button, DatePicker, Segmented, Typography } from 'antd'
import dayjs from 'dayjs'
import type { ColumnsType } from 'antd/es/table'
import { useCampusStore } from '@/stores/campusStore'
import { buildApiUrl } from '@/utils/apiBase'

const { Title } = Typography

interface ArrearsDetailRow {
  key: string
  serialNumber: number
  classTeacherName: string
  instructor: string
  studentName: string
  signUpDate: string
  reportDate: string
  major: string
  programLength: string
  tuitionShould: number
  tuitionPaid: number
  additionalPayment: number
  arrearsAmount: number
  isFullPayment: string
  isLoan: string
  hasAttendedClass: string
  trialPeriod: string
  isRefund: string
  refundTime: string
  refundNote: string
  consultant: string
  hasAccommodation: string
  dormName: string
  remark: string
  isSummary?: boolean
}

const recomputeSummary = (rows: ArrearsDetailRow[]): ArrearsDetailRow => {
  const totals = rows.reduce(
    (acc, r) => {
      acc.tuitionShould += r.tuitionShould || 0
      acc.tuitionPaid += r.tuitionPaid || 0
      acc.additionalPayment += r.additionalPayment || 0
      acc.arrearsAmount += r.arrearsAmount || 0
      return acc
    },
    {
      tuitionShould: 0,
      tuitionPaid: 0,
      additionalPayment: 0,
      arrearsAmount: 0,
    },
  )

  return {
    key: 'summary',
    serialNumber: 0,
    classTeacherName: '',
    instructor: '',
    studentName: '',
    signUpDate: '',
    reportDate: '',
    major: '',
    programLength: '',
    ...totals,
    isFullPayment: '',
    isLoan: '',
    hasAttendedClass: '',
    trialPeriod: '',
    isRefund: '',
    refundTime: '',
    refundNote: '',
    consultant: '',
    hasAccommodation: '',
    dormName: '',
    remark: '',
    isSummary: true,
  }
}

const ArrearsDetailReadOnly: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore()

  // 年月筛选
  const [pickerMode, setPickerMode] = useState<'month' | 'year' | 'all'>('month')
  const [selectedValue, setSelectedValue] = useState<string>(dayjs().format('YYYY-MM'))
  const [loading, setLoading] = useState(false)

  const [rows, setRows] = useState<ArrearsDetailRow[]>([])

  const summaryRow = useMemo(() => rows.find((r) => r.isSummary) as ArrearsDetailRow | undefined, [rows])

  const canIO = useMemo(() => Boolean(currentCampus), [currentCampus])

  const applyServerRows = useCallback((list: any[]) => {
    const mapped: ArrearsDetailRow[] = (list || []).map((r: any, idx: number) => ({
      key: String(idx + 1),
      serialNumber: r.serialNumber ?? idx + 1,
      classTeacherName: r.classTeacherName || '',
      instructor: r.instructor || '',
      studentName: r.studentName || '',
      signUpDate: r.signUpDate || '',
      reportDate: r.reportDate || '',
      major: r.major || '',
      programLength: r.programLength || '',
      tuitionShould: Number(r.tuitionShould || 0),
      tuitionPaid: Number(r.tuitionPaid || 0),
      additionalPayment: Number(r.additionalPayment || 0),
      arrearsAmount: Number(r.arrearsAmount || 0),
      isFullPayment: r.isFullPayment || '',
      isLoan: r.isLoan || '',
      hasAttendedClass: r.hasAttendedClass || '',
      trialPeriod: r.trialPeriod || '',
      isRefund: r.isRefund || '',
      refundTime: r.refundTime || '',
      refundNote: r.refundNote || '',
      consultant: r.consultant || '',
      hasAccommodation: r.hasAccommodation || '',
      dormName: r.dormName || '',
      remark: r.remark || '',
    }))
    const summary = recomputeSummary(mapped)
    setRows([...mapped, summary])
  }, [])

  const fetchFromServer = useCallback(
    async (mode: 'month' | 'year' | 'all', value: string) => {
      if (!canIO) {
        message.warning('请先选择神殿')
        return
      }
      setLoading(true)
      try {
        const url = (() => {
          if (mode === 'all') {
            return `/teaching-quality/campus-monthly-new-stu-stability-detail?campus=${encodeURIComponent(currentCampus!)}&arrears_only=true`
          }
          if (mode === 'year') {
            const year = Number(value)
            return `/teaching-quality/campus-monthly-new-stu-stability-detail?campus=${encodeURIComponent(currentCampus!)}&year=${year}&all_year=true`
          }
          const d = dayjs(value, 'YYYY-MM')
          const year = d.year()
          const month = d.month() + 1
          return `/teaching-quality/campus-monthly-new-stu-stability-detail?campus=${encodeURIComponent(currentCampus!)}&year=${year}&month=${month}`
        })()

        const res = await fetch(buildApiUrl(url))
        if (!res.ok) throw new Error(await res.text())
        const data = await res.json()
        const list = data?.行列表 || []

        // 仅展示"仍欠费明细"
        const filtered = list.filter((r: any) => Number(r.arrearsAmount || 0) !== 0)
        applyServerRows(filtered)
      } catch (e) {
        console.error(e)
        message.error('获取数据失败')
      } finally {
        setLoading(false)
      }
    },
    [canIO, currentCampus, applyServerRows],
  )

  useEffect(() => {
    if (currentCampus) {
      fetchFromServer(pickerMode, selectedValue)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCampus])

  const columns: ColumnsType<ArrearsDetailRow> = useMemo(
    () => [
      {
        title: '序号',
        dataIndex: 'serialNumber',
        key: 'serialNumber',
        width: 70,
        align: 'center',
        render: (value, record) =>
          record.isSummary ? <span style={{ color: 'red', fontWeight: 'bold' }}>合计</span> : value,
      },
      {
        title: '班主任姓名',
        dataIndex: 'classTeacherName',
        key: 'classTeacherName',
        width: 120,
        align: 'center',
        render: (text, record) => (record.isSummary ? '' : text),
      },
      {
        title: '教员',
        dataIndex: 'instructor',
        key: 'instructor',
        width: 100,
        align: 'center',
        render: (text, record) => (record.isSummary ? '' : text),
      },
      {
        title: '新生姓名',
        dataIndex: 'studentName',
        key: 'studentName',
        width: 120,
        align: 'center',
        render: (text, record) => (record.isSummary ? '' : text),
      },
      {
        title: '报名时间',
        dataIndex: 'signUpDate',
        key: 'signUpDate',
        width: 120,
        align: 'center',
        render: (text, record) => (record.isSummary ? '' : text),
      },
      {
        title: '报道时间',
        dataIndex: 'reportDate',
        key: 'reportDate',
        width: 120,
        align: 'center',
        render: (text, record) => (record.isSummary ? '' : text),
      },
      {
        title: '报名专业',
        dataIndex: 'major',
        key: 'major',
        width: 140,
        align: 'center',
        render: (text, record) => (record.isSummary ? '' : text),
      },
      {
        title: '报名学制',
        dataIndex: 'programLength',
        key: 'programLength',
        width: 120,
        align: 'center',
        render: (text, record) => (record.isSummary ? '' : text),
      },
      {
        title: '应收学费',
        dataIndex: 'tuitionShould',
        key: 'tuitionShould',
        width: 120,
        align: 'center',
        render: (value: number, record) =>
          record.isSummary ? summaryRow?.tuitionShould || 0 : value > 0 ? value : '',
      },
      {
        title: '报名交费金额',
        dataIndex: 'tuitionPaid',
        key: 'tuitionPaid',
        width: 140,
        align: 'center',
        render: (value: number, record) =>
          record.isSummary ? summaryRow?.tuitionPaid || 0 : value > 0 ? value : '',
      },
      {
        title: '补款金额',
        dataIndex: 'additionalPayment',
        key: 'additionalPayment',
        width: 120,
        align: 'center',
        render: (value: number, record) =>
          record.isSummary ? summaryRow?.additionalPayment || 0 : value > 0 ? value : '',
      },
      {
        title: '仍欠费金额',
        dataIndex: 'arrearsAmount',
        key: 'arrearsAmount',
        width: 120,
        align: 'center',
        render: (value: number, record) =>
          record.isSummary ? summaryRow?.arrearsAmount || 0 : value > 0 ? value : '',
      },
      {
        title: '是否全款',
        dataIndex: 'isFullPayment',
        key: 'isFullPayment',
        width: 100,
        align: 'center',
        render: (text, record) => (record.isSummary ? '' : text),
      },
      {
        title: '是否贷款',
        dataIndex: 'isLoan',
        key: 'isLoan',
        width: 100,
        align: 'center',
        render: (text, record) => (record.isSummary ? '' : text),
      },
      {
        title: '是否过课时',
        dataIndex: 'hasAttendedClass',
        key: 'hasAttendedClass',
        width: 110,
        align: 'center',
        render: (text, record) => (record.isSummary ? '' : text),
      },
      {
        title: '试学周期',
        dataIndex: 'trialPeriod',
        key: 'trialPeriod',
        width: 180,
        align: 'center',
        render: (text, record) => (record.isSummary ? '' : text),
      },
      {
        title: '是否退费',
        dataIndex: 'isRefund',
        key: 'isRefund',
        width: 100,
        align: 'center',
        render: (text, record) => (record.isSummary ? '' : text),
      },
      {
        title: '退费时间',
        dataIndex: 'refundTime',
        key: 'refundTime',
        width: 120,
        align: 'center',
        render: (text, record) => (record.isSummary ? '' : text),
      },
      {
        title: '退费情况说明',
        dataIndex: 'refundNote',
        key: 'refundNote',
        width: 200,
        align: 'left',
        render: (text, record) => (record.isSummary ? '' : text),
      },
      {
        title: '咨询师',
        dataIndex: 'consultant',
        key: 'consultant',
        width: 100,
        align: 'center',
        render: (text, record) => (record.isSummary ? '' : text),
      },
      {
        title: '是否住宿',
        dataIndex: 'hasAccommodation',
        key: 'hasAccommodation',
        width: 100,
        align: 'center',
        render: (text, record) => (record.isSummary ? '' : text),
      },
      {
        title: '宿舍名称',
        dataIndex: 'dormName',
        key: 'dormName',
        width: 140,
        align: 'center',
        render: (text, record) => (record.isSummary ? '' : text),
      },
      {
        title: '备注',
        dataIndex: 'remark',
        key: 'remark',
        width: 180,
        align: 'left',
        render: (text, record) => (record.isSummary ? '' : text),
      },
    ],
    [summaryRow],
  )

  return (
    <div style={{ marginTop: 24 }}>
      <style>{`
        .tq-summary-row-red td {
          color: #ff4d4f;
          font-weight: 600;
        }
      `}</style>
      <Card
        title={<Title level={5} style={{ margin: 0 }}>新生仍欠费明细表</Title>}
        extra={
          <Space>
            <span>查询：</span>
            <Segmented
              options={[
                { label: '月', value: 'month' },
                { label: '全年', value: 'year' },
                { label: '全部欠费', value: 'all' },
              ]}
              value={pickerMode}
              onChange={(v) => {
                const mode = v as 'month' | 'year' | 'all'
                setPickerMode(mode)
                if (mode === 'year') {
                  setSelectedValue(dayjs().format('YYYY'))
                } else if (mode === 'month') {
                  setSelectedValue(dayjs().format('YYYY-MM'))
                }
                fetchFromServer(
                  mode,
                  mode === 'year'
                    ? dayjs().format('YYYY')
                    : mode === 'month'
                      ? dayjs().format('YYYY-MM')
                      : '',
                )
              }}
            />
            {pickerMode !== 'all' && (
              <DatePicker
                picker={pickerMode}
                allowClear={false}
                value={dayjs(selectedValue, pickerMode === 'year' ? 'YYYY' : 'YYYY-MM')}
                onChange={(v) => {
                  const next = v
                    ? v.format(pickerMode === 'year' ? 'YYYY' : 'YYYY-MM')
                    : selectedValue
                  setSelectedValue(next)
                  fetchFromServer(pickerMode, next)
                }}
              />
            )}
            <Button onClick={() => fetchFromServer(pickerMode, selectedValue)} disabled={!canIO}>
              刷新
            </Button>
          </Space>
        }
      >
        <Table<ArrearsDetailRow>
          bordered
          size="small"
          columns={columns}
          dataSource={rows}
          pagination={false}
          rowKey="key"
          rowClassName={(record) => (record.isSummary ? 'tq-summary-row-red' : '')}
          scroll={{ x: 'max-content' }}
          loading={loading}
        />
      </Card>
    </div>
  )
}

export default ArrearsDetailReadOnly
