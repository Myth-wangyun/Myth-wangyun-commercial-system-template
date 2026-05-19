import React, { useEffect, useMemo, useState, useCallback, memo } from 'react'
import { App, Card, Table, Input, InputNumber, Select, Space, Button, DatePicker, Segmented } from 'antd'
import dayjs from 'dayjs'
import type { ColumnsType } from 'antd/es/table'
import { useCampusStore } from '@/stores/campusStore'
import { useRefreshEventStore } from '@/stores/refreshEventStore'
import { buildApiUrl } from '@/utils/apiBase'
import HomeroomTeacherSelect from '@/components/HomeroomTeacherSelect'

interface ArrearsDetailRow {
  key: string
  serialNumber: number
  classTeacherName: string
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

const YES_NO_OPTIONS = [
  { label: '是', value: '是' },
  { label: '否', value: '否' },
]

// Memoized cell components to prevent unnecessary re-renders
const EditableInputCell = memo<{
  rowKey: string
  field: string
  value: string
  onUpdate: (key: string, field: string, value: string) => void
}>(({ rowKey, field, value, onUpdate }) => {
  const [local, setLocal] = React.useState(value)
  React.useEffect(() => { setLocal(value) }, [value])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocal(e.target.value)
  }, [])

  const handleBlur = useCallback(() => {
    if (local !== value) onUpdate(rowKey, field, local)
  }, [local, value, rowKey, field, onUpdate])
  
  return <Input value={local} onChange={handleChange} onBlur={handleBlur} />
})
EditableInputCell.displayName = 'EditableInputCell'

const EditableNumberCell = memo<{
  rowKey: string
  field: string
  value: number
  onUpdate: (key: string, field: string, value: number | null) => void
}>(({ rowKey, field, value, onUpdate }) => {
  const handleChange = useCallback((v: number | null) => {
    onUpdate(rowKey, field, v)
  }, [rowKey, field, onUpdate])
  
  return (
    <InputNumber
      min={0}
      value={value || 0}
      style={{ width: '100%' }}
      onChange={handleChange}
    />
  )
})
EditableNumberCell.displayName = 'EditableNumberCell'

const EditableSelectCell = memo<{
  rowKey: string
  field: string
  value: string
  onUpdate: (key: string, field: string, value: string) => void
}>(({ rowKey, field, value, onUpdate }) => {
  const handleChange = useCallback((v: string | undefined) => {
    onUpdate(rowKey, field, v ?? '')
  }, [rowKey, field, onUpdate])
  
  return (
    <Select
      allowClear
      options={YES_NO_OPTIONS}
      value={value || undefined}
      onChange={handleChange}
    />
  )
})
EditableSelectCell.displayName = 'EditableSelectCell'

const EditableTeacherSelectCell = memo<{
  rowKey: string
  field: string
  value: string
  campusName?: string
  onUpdate: (key: string, field: string, value: string) => void
}>(({ rowKey, field, value, campusName, onUpdate }) => {
  const handleChange = useCallback((v: string) => {
    onUpdate(rowKey, field, v ?? '')
  }, [rowKey, field, onUpdate])
  
  return (
    <HomeroomTeacherSelect
      campusName={campusName}
      value={value}
      onChange={handleChange}
    />
  )
})
EditableTeacherSelectCell.displayName = 'EditableTeacherSelectCell'

const createInitialRows = (): ArrearsDetailRow[] => {
  const rows: ArrearsDetailRow[] = []
  for (let i = 1; i <= 5; i += 1) {
    rows.push({
      key: String(i),
      serialNumber: i,
      classTeacherName: '',
      studentName: '',
      signUpDate: '',
      reportDate: '',
      major: '',
      programLength: '',
      tuitionShould: 0,
      tuitionPaid: 0,
      additionalPayment: 0,
      arrearsAmount: 0,
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
    })
  }
  return rows
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

const CampusNewStuArrearsDetailTable: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore()
  const stabilityTableUpdateKey = useRefreshEventStore((s) => s.stabilityTableUpdateKey)

  // 年月筛选
  const [pickerMode, setPickerMode] = useState<'month' | 'year' | 'all'>('month')
  const [selectedValue, setSelectedValue] = useState<string>(dayjs().format('YYYY-MM'))

  const [rows, setRows] = useState<ArrearsDetailRow[]>(() => {
    const base = createInitialRows()
    return [...base, recomputeSummary(base)]
  })

  const bodyRows = useMemo(() => rows.filter((r) => !r.isSummary), [rows])
  const summaryRow = useMemo(() => rows.find((r) => r.isSummary) as ArrearsDetailRow, [rows])


  const canIO = useMemo(() => Boolean(currentCampus), [currentCampus])

  const applyServerRows = useCallback((list: any[]) => {
    const mapped: ArrearsDetailRow[] = (list || []).map((r: any, idx: number) => ({
      key: String(idx + 1),
      serialNumber: r.serialNumber ?? idx + 1,
      classTeacherName: r.classTeacherName || '',
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


  const fetchFromServer = useCallback(async (mode: 'month' | 'year' | 'all', value: string) => {
    if (!canIO) {
      message.warning('请先选择神殿')
      return
    }
    try {
      // 数据来源：神殿教化司当月新生维稳明细表
      // 注意：后端接口参数为 year/month 或 all_year=true；
      // arrears_only=true 在后端实现为“跨年月全部欠费”，不支持按年月过滤，所以这里不用 arrears_only。
      const url = (() => {
        // 全部欠费：后端专用参数 arrears_only=true（跨年月）
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
      const list = (data?.行列表 || [])

      // 本页仅展示“仍欠费明细”
      const filtered = list.filter((r: any) => Number(r.arrearsAmount || 0) !== 0)
      applyServerRows(filtered)
      message.success('已刷新')
    } catch (e) {
      console.error(e)
      message.error('刷新失败')
    }
  }, [canIO, currentCampus, applyServerRows])

  // 当「维稳明细表」保存成功后，会触发一次 key 变化，这里自动刷新
  useEffect(() => {
    if (currentCampus) {
      fetchFromServer(pickerMode, selectedValue)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stabilityTableUpdateKey, selectedValue, pickerMode, currentCampus])

  const saveToServer = useCallback(async () => {
    // 该表仅作为维稳明细表的欠费筛选视图，不单独保存
    message.info('该表数据来自「教化司当月新生维稳明细表」（仍欠费金额≠0），请在维稳明细表中维护后刷新查看。')
  }, [])

  useEffect(() => {
    if (currentCampus) {
      fetchFromServer(pickerMode, selectedValue)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCampus, selectedValue, pickerMode])

  // Single update handler for all text fields
  const handleTextUpdate = useCallback((key: string, field: string, value: string) => {
    setRows((prevRows) => {
      const nextBodies = prevRows.filter(r => !r.isSummary).map((row) =>
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

  // Single update handler for all number fields
  const handleNumberUpdate = useCallback((key: string, field: string, value: number | null) => {
    const v = typeof value === 'number' ? value : 0
    setRows((prevRows) => {
      const nextBodies = prevRows.filter(r => !r.isSummary).map((row) =>
        row.key === key
          ? {
              ...row,
              [field]: v,
            }
          : row,
      )
      const summary = recomputeSummary(nextBodies)
      return [...nextBodies, summary]
    })
  }, [])

  const columns: ColumnsType<ArrearsDetailRow> = useMemo(() => [
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
      render: (text: string, record) =>
        record.isSummary ? '' : (
          <EditableTeacherSelectCell
            rowKey={record.key}
            field="classTeacherName"
            value={text}
            campusName={currentCampus || undefined}
            onUpdate={handleTextUpdate}
          />
        ),
    },
    {
      title: '新生姓名',
      dataIndex: 'studentName',
      key: 'studentName',
      width: 120,
      align: 'center',
      render: (text: string, record) =>
        record.isSummary ? '' : (
          <EditableInputCell
            rowKey={record.key}
            field="studentName"
            value={text}
            onUpdate={handleTextUpdate}
          />
        ),
    },
    {
      title: '报名时间',
      dataIndex: 'signUpDate',
      key: 'signUpDate',
      width: 120,
      align: 'center',
      render: (text: string, record) =>
        record.isSummary ? '' : (
          <EditableInputCell
            rowKey={record.key}
            field="signUpDate"
            value={text}
            onUpdate={handleTextUpdate}
          />
        ),
    },
    {
      title: '报道时间',
      dataIndex: 'reportDate',
      key: 'reportDate',
      width: 120,
      align: 'center',
      render: (text: string, record) =>
        record.isSummary ? '' : (
          <EditableInputCell
            rowKey={record.key}
            field="reportDate"
            value={text}
            onUpdate={handleTextUpdate}
          />
        ),
    },
    {
      title: '报名专业',
      dataIndex: 'major',
      key: 'major',
      width: 140,
      align: 'center',
      render: (text: string, record) =>
        record.isSummary ? '' : (
          <EditableInputCell
            rowKey={record.key}
            field="major"
            value={text}
            onUpdate={handleTextUpdate}
          />
        ),
    },
    {
      title: '报名学制',
      dataIndex: 'programLength',
      key: 'programLength',
      width: 120,
      align: 'center',
      render: (text: string, record) =>
        record.isSummary ? '' : (
          <EditableInputCell
            rowKey={record.key}
            field="programLength"
            value={text}
            onUpdate={handleTextUpdate}
          />
        ),
    },
    {
      title: '应收学费',
      dataIndex: 'tuitionShould',
      key: 'tuitionShould',
      width: 120,
      align: 'center',
      render: (value: number, record) =>
        record.isSummary ? (
          summaryRow.tuitionShould || 0
        ) : (
          <EditableNumberCell
            rowKey={record.key}
            field="tuitionShould"
            value={value}
            onUpdate={handleNumberUpdate}
          />
        ),
    },
    {
      title: '报名交费金额',
      dataIndex: 'tuitionPaid',
      key: 'tuitionPaid',
      width: 140,
      align: 'center',
      render: (value: number, record) =>
        record.isSummary ? (
          summaryRow.tuitionPaid || 0
        ) : (
          <EditableNumberCell
            rowKey={record.key}
            field="tuitionPaid"
            value={value}
            onUpdate={handleNumberUpdate}
          />
        ),
    },
    {
      title: '补款金额',
      dataIndex: 'additionalPayment',
      key: 'additionalPayment',
      width: 120,
      align: 'center',
      render: (value: number, record) =>
        record.isSummary ? (
          summaryRow.additionalPayment || 0
        ) : (
          <EditableNumberCell
            rowKey={record.key}
            field="additionalPayment"
            value={value}
            onUpdate={handleNumberUpdate}
          />
        ),
    },
    {
      title: '仍欠费金额',
      dataIndex: 'arrearsAmount',
      key: 'arrearsAmount',
      width: 120,
      align: 'center',
      render: (value: number, record) =>
        record.isSummary ? (
          summaryRow.arrearsAmount || 0
        ) : (
          <EditableNumberCell
            rowKey={record.key}
            field="arrearsAmount"
            value={value}
            onUpdate={handleNumberUpdate}
          />
        ),
    },
    {
      title: '是否全款',
      dataIndex: 'isFullPayment',
      key: 'isFullPayment',
      width: 110,
      align: 'center',
      render: (text: string, record) =>
        record.isSummary ? '' : (
          <EditableSelectCell
            rowKey={record.key}
            field="isFullPayment"
            value={text}
            onUpdate={handleTextUpdate}
          />
        ),
    },
    {
      title: '是否贷款',
      dataIndex: 'isLoan',
      key: 'isLoan',
      width: 110,
      align: 'center',
      render: (text: string, record) =>
        record.isSummary ? '' : (
          <EditableSelectCell
            rowKey={record.key}
            field="isLoan"
            value={text}
            onUpdate={handleTextUpdate}
          />
        ),
    },
    {
      title: '是否过课时',
      dataIndex: 'hasAttendedClass',
      key: 'hasAttendedClass',
      width: 120,
      align: 'center',
      render: (text: string, record) =>
        record.isSummary ? '' : (
          <EditableSelectCell
            rowKey={record.key}
            field="hasAttendedClass"
            value={text}
            onUpdate={handleTextUpdate}
          />
        ),
    },
    {
      title: '试学周期',
      dataIndex: 'trialPeriod',
      key: 'trialPeriod',
      width: 120,
      align: 'center',
      render: (text: string, record) =>
        record.isSummary ? '' : (
          <EditableInputCell
            rowKey={record.key}
            field="trialPeriod"
            value={text}
            onUpdate={handleTextUpdate}
          />
        ),
    },
    {
      title: '是否退费',
      dataIndex: 'isRefund',
      key: 'isRefund',
      width: 110,
      align: 'center',
      render: (text: string, record) =>
        record.isSummary ? '' : (
          <EditableSelectCell
            rowKey={record.key}
            field="isRefund"
            value={text}
            onUpdate={handleTextUpdate}
          />
        ),
    },
    {
      title: '退费时间',
      dataIndex: 'refundTime',
      key: 'refundTime',
      width: 130,
      align: 'center',
      render: (text: string, record) =>
        record.isSummary ? '' : (
          <EditableInputCell
            rowKey={record.key}
            field="refundTime"
            value={text}
            onUpdate={handleTextUpdate}
          />
        ),
    },
    {
      title: '退费情况说明',
      dataIndex: 'refundNote',
      key: 'refundNote',
      width: 200,
      align: 'left',
      render: (text: string, record) =>
        record.isSummary ? '' : (
          <EditableInputCell
            rowKey={record.key}
            field="refundNote"
            value={text}
            onUpdate={handleTextUpdate}
          />
        ),
    },
    {
      title: '咨询师',
      dataIndex: 'consultant',
      key: 'consultant',
      width: 120,
      align: 'center',
      render: (text: string, record) =>
        record.isSummary ? '' : (
          <EditableInputCell
            rowKey={record.key}
            field="consultant"
            value={text}
            onUpdate={handleTextUpdate}
          />
        ),
    },
    {
      title: '是否住宿',
      dataIndex: 'hasAccommodation',
      key: 'hasAccommodation',
      width: 110,
      align: 'center',
      render: (text: string, record) =>
        record.isSummary ? '' : (
          <EditableSelectCell
            rowKey={record.key}
            field="hasAccommodation"
            value={text}
            onUpdate={handleTextUpdate}
          />
        ),
    },
    {
      title: '宿舍名称',
      dataIndex: 'dormName',
      key: 'dormName',
      width: 160,
      align: 'center',
      render: (text: string, record) =>
        record.isSummary ? '' : (
          <EditableInputCell
            rowKey={record.key}
            field="dormName"
            value={text}
            onUpdate={handleTextUpdate}
          />
        ),
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      width: 180,
      align: 'left',
      render: (text: string, record) =>
        record.isSummary ? '' : (
          <EditableInputCell
            rowKey={record.key}
            field="remark"
            value={text}
            onUpdate={handleTextUpdate}
          />
        ),
    },
  ], [summaryRow, handleTextUpdate, handleNumberUpdate])

  return (
    <div style={{ padding: 24 }}>
      <style>{`
        /* 合计行标红 */
        .tq-summary-row-red td {
          color: #ff4d4f;
          font-weight: 600;
        }
      `}</style>
      <Card title={currentCampus ? `${currentCampus}教化司新生仍欠费明细表` : '教化司新生仍欠费明细表'} extra={
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
              // 切换到全年时，默认取当前年份；切换到“全部欠费”时不需要日期
              if (mode === 'year') {
                setSelectedValue(dayjs().format('YYYY'))
              } else if (mode === 'month') {
                setSelectedValue(dayjs().format('YYYY-MM'))
              }
              // 切换模式后立即刷新
              // 注意：fetchFromServer 依赖 selectedValue，因此这里用 setTimeout 等待状态更新后再拉取
              fetchFromServer(mode, mode === 'year' ? dayjs().format('YYYY') : mode === 'month' ? dayjs().format('YYYY-MM') : '')
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
              // 选择年月/年份后自动刷新
              fetchFromServer(pickerMode, next)
            }}
            />
          )}
          <Button onClick={() => fetchFromServer(pickerMode, selectedValue)} disabled={!canIO}>刷新</Button>
          <Button type="primary" onClick={saveToServer}>保存</Button>
        </Space>
      }>
        <Table<ArrearsDetailRow>
          bordered
          size="small"
          columns={columns}
          dataSource={rows}
          pagination={false}
          rowKey="key"
          rowClassName={(record) => (record.isSummary ? 'tq-summary-row-red' : '')}
          scroll={{ x: 'max-content' }}
        />
      </Card>
    </div>
  )
}

export default CampusNewStuArrearsDetailTable
