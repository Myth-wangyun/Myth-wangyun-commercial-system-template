import React, { useEffect, useMemo, useState, memo, useCallback } from 'react'
import { App, Card, Table, Input, InputNumber, Select, Space, Button, DatePicker } from 'antd'

const { RangePicker } = DatePicker
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'

import HomeroomTeacherSelect from '@/components/HomeroomTeacherSelect'
import { fetchMajors } from '@/services/configMaster'
import { useCampusStore } from '@/stores/campusStore'
import { useRefreshEventStore } from '@/stores/refreshEventStore'
import { buildApiUrl } from '@/utils/apiBase'


interface MonthlyStabilityDetailRow {
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
  instructor: string
  hasAccommodation: string
  dormName: string
  remark: string
}

const YES_NO_OPTIONS = [
  { label: '是', value: '是' },
  { label: '否', value: '否' },
]

const parseTrialPeriodRangeLoose = (raw: string): [dayjs.Dayjs | null, dayjs.Dayjs | null] => {
  const s = String(raw || '').trim()
  if (!s) return [null, null]

  // 兼容：
  // 1) "YYYY-MM-DD~YYYY-MM-DD" / "YYYY-MM-DD - YYYY-MM-DD" -> [start,end]
  // 2) "YYYY-MM-DD" -> [start,null]
  const parts = s.split(/\s*~\s*|\s+-\s+/).map((x) => x.trim()).filter(Boolean)
  const startStr = parts[0] || ''
  const endStr = parts[1] || ''

  const start = startStr ? dayjs(startStr) : null
  const end = endStr ? dayjs(endStr) : null

  return [start && start.isValid() ? start : null, end && end.isValid() ? end : null]
}

const TrialPeriodRangeLooseCell = memo<{
  value: string
  onChangeValue: (next: string) => void
}>(({ value, onChangeValue }) => {
  const [localValue, setLocalValue] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>(() =>
    parseTrialPeriodRangeLoose(value),
  )

  // 同步外部 value 变化（加载/刷新/回填等）
  useEffect(() => {
    setLocalValue(parseTrialPeriodRangeLoose(value))
  }, [value])

  const handleCalendarChange = useCallback(
    (dates: (dayjs.Dayjs | null)[] | null) => {
      const start = dates?.[0] ?? null
      const end = dates?.[1] ?? null
      setLocalValue([start, end])

      // 关键：当只点了开始日期（未选结束日期）时，RangePicker 不一定触发 onChange。
      // 这里在日历变化时兜底写入开始日期，确保 rows.trialPeriod 能更新并在保存时传给后端。
      if (start && start.isValid() && (!end || !end.isValid())) {
        onChangeValue(start.format('YYYY-MM-DD'))
      }

      // 若开始和结束都选了，最终以 onChange 为准（保存范围字符串）。
    },
    [onChangeValue],
  )

  const handleChange = useCallback(
    (dates: (dayjs.Dayjs | null)[] | null) => {
      const start = dates?.[0] ?? null
      const end = dates?.[1] ?? null

      // 只选了开始日期时，antd RangePicker 往往不会触发 onChange（因为 range 未完成）。
      // 因此这里仍保留，但核心写入在 onCalendarChange 里兜底处理。
      if (start && start.isValid()) {
        if (end && end.isValid()) {
          onChangeValue(`${start.format('YYYY-MM-DD')}~${end.format('YYYY-MM-DD')}`)
        } else {
          onChangeValue(start.format('YYYY-MM-DD'))
        }
      } else {
        onChangeValue('')
      }

      setLocalValue([start, end])
    },
    [onChangeValue],
  )

  return (
    <RangePicker
      value={localValue}
      style={{ width: '100%' }}
      format="YYYY-MM-DD"
      allowClear
      onCalendarChange={handleCalendarChange}
      onChange={handleChange}
    />
  )
})
TrialPeriodRangeLooseCell.displayName = 'TrialPeriodRangeLooseCell'

const createInitialRows = (): MonthlyStabilityDetailRow[] => [
  {
    key: '1',
    serialNumber: 1,
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
    instructor: '',
    hasAccommodation: '',
    dormName: '',
    remark: '',
  },
  {
    key: '2',
    serialNumber: 2,
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
    instructor: '',
    hasAccommodation: '',
    dormName: '',
    remark: '',
  },
]

const CampusMonthlyNewStuStabilityDetailTable: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore()
  const triggerStabilityTableUpdate = useRefreshEventStore((s) => s.triggerStabilityTableUpdate)
  const [year, setYear] = useState<number>(new Date().getFullYear())
  // month: 1-12；0 表示“全年”
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1)
  const [rows, setRows] = useState<MonthlyStabilityDetailRow[]>(createInitialRows)
  const [majorOptions, setMajorOptions] = useState<string[]>([])

  // 筛选/搜索
  const [filterHasAttendedClass, setFilterHasAttendedClass] = useState<string>('')
  const [filterIsRefund, setFilterIsRefund] = useState<string>('')
  const [searchStudentName, setSearchStudentName] = useState<string>('')

  const canIO = useMemo(() => Boolean(currentCampus && year), [currentCampus, year])

  const filteredRows = useMemo(() => {
    const kw = searchStudentName.trim().toLowerCase()
    return rows.filter((r) => {
      const passAttended = !filterHasAttendedClass || r.hasAttendedClass === filterHasAttendedClass
      const passRefund = !filterIsRefund || r.isRefund === filterIsRefund
      const passName = !kw || String(r.studentName || '').toLowerCase().includes(kw)
      return passAttended && passRefund && passName
    })
  }, [rows, filterHasAttendedClass, filterIsRefund, searchStudentName])

  const addRow = () => {
    const nextSerial = Math.max(0, ...rows.map(r => r.serialNumber || 0)) + 1
    setRows(prev => ([
      ...prev,
      {
        key: `new-${Date.now()}`,
        serialNumber: nextSerial,
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
        instructor: '',
        hasAccommodation: '',
        dormName: '',
        remark: '',
      }
    ]))
  }

  const applyServerRows = (list: any[]) => {
    const mapped: MonthlyStabilityDetailRow[] = (list || []).map((r: any, idx: number) => ({
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
      instructor: r.instructor || '',
      hasAccommodation: r.hasAccommodation || '',
      dormName: r.dormName || '',
      remark: r.remark || '',
    }))
    setRows(mapped.length ? mapped : createInitialRows())
  }

  const fetchFromServer = async () => {
    if (!canIO) {
      message.warning('请先选择神殿和年份')
      return
    }
    try {
      let url = `/teaching-quality/campus-monthly-new-stu-stability-detail?campus=${encodeURIComponent(currentCampus!)}&year=${year}`
      if (month === 0) {
        // 0 表示“全年”
        url += '&all_year=true'
      } else {
        url += `&month=${month}`
      }

      const res = await fetch(buildApiUrl(url))
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      applyServerRows(data?.行列表 || [])
      message.success('已刷新')
    } catch (e) {
      console.error(e)
      message.error('刷新失败')
    }
  }

  const saveToServer = async () => {
    if (!canIO) {
      message.warning('请先选择神殿、年份、月份')
      return
    }
    try {
      const payload = {
        神殿名称: currentCampus!,
        年份: year,
        月份: month,
        行列表: rows.map((r) => ({
          serialNumber: r.serialNumber,
          classTeacherName: r.classTeacherName,
          studentName: r.studentName,
          signUpDate: r.signUpDate,
          reportDate: r.reportDate,
          major: r.major,
          programLength: r.programLength,
          tuitionShould: r.tuitionShould,
          tuitionPaid: r.tuitionPaid,
          additionalPayment: r.additionalPayment,
          arrearsAmount: r.arrearsAmount,
          isFullPayment: r.isFullPayment,
          isLoan: r.isLoan,
          hasAttendedClass: r.hasAttendedClass,
          trialPeriod: r.trialPeriod,
          isRefund: r.isRefund,
          refundTime: r.refundTime,
          refundNote: r.refundNote,
          consultant: r.consultant,
          instructor: r.instructor,
          hasAccommodation: r.hasAccommodation,
          dormName: r.dormName,
          remark: r.remark,
        })),
      }
      const res = await fetch(buildApiUrl('/teaching-quality/campus-monthly-new-stu-stability-detail'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(await res.text())
      message.success('保存成功')
      // 通知「新生仍欠费明细表」刷新一次
      triggerStabilityTableUpdate()
      await fetchFromServer()
    } catch (e) {
      console.error(e)
      message.error('保存失败')
    }
  }

  useEffect(() => {
    if (currentCampus) fetchFromServer()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCampus, year, month])

  // 报名专业：从配置中心读取（按神殿过滤）
  useEffect(() => {
    if (!currentCampus) {
      setMajorOptions([])
      return
    }
    ;(async () => {
      try {
        const list = await fetchMajors({ campus_name: currentCampus, active: true })
        const names = Array.from(new Set((list || []).map((m) => String(m.name || '').trim()).filter(Boolean)))
        setMajorOptions(names)
      } catch (e) {
        console.error(e)
        // 不中断页面，仅提示一次
        message.error('加载报名专业失败（配置中心）')
        setMajorOptions([])
      }
    })()
  }, [currentCampus])

  const handleNumberChange = (
    key: string,
    field: keyof Pick<
      MonthlyStabilityDetailRow,
      'tuitionShould' | 'tuitionPaid' | 'additionalPayment' | 'arrearsAmount'
    >,
    value: number | null,
  ) => {
    const v = typeof value === 'number' ? value : 0
    setRows((prev) =>
      prev.map((row) => {
        if (row.key !== key) return row

        const nextRow: MonthlyStabilityDetailRow = {
          ...row,
          [field]: v,
        } as MonthlyStabilityDetailRow

        // 自动计算：仍欠费金额 = 应收学费 - 报名交费金额 - 补款金额
        // （若计算结果为负数则按 0 处理）
        if (field === 'tuitionShould' || field === 'tuitionPaid' || field === 'additionalPayment') {
          const should = Number(nextRow.tuitionShould || 0)
          const paid = Number(nextRow.tuitionPaid || 0)
          const add = Number(nextRow.additionalPayment || 0)
          nextRow.arrearsAmount = Math.max(0, should - paid - add)

          // 是否全款：根据仍欠费金额判断
          // 仍欠费金额不为 0 -> 否；等于 0 -> 是
          // 注意：此处不强制写入 isFullPayment，避免覆盖用户手工选择/后端回填；
          // 展示层会根据 arrearsAmount 自动显示。
        }

        return nextRow
      }),
    )
  }

  const handleTextChange = (key: string, field: keyof MonthlyStabilityDetailRow, value: string) => {
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
  }

  const columns: ColumnsType<MonthlyStabilityDetailRow> = [
    {
      title: '序号',
      dataIndex: 'serialNumber',
      key: 'serialNumber',
      width: 70,
      align: 'center',
    },
    {
      title: '班主任姓名',
      dataIndex: 'classTeacherName',
      key: 'classTeacherName',
      width: 120,
      align: 'center',
      render: (text: string, record) => (
        <HomeroomTeacherSelect
          campusName={currentCampus || undefined}
          value={text}
          onChange={(value) => handleTextChange(record.key, 'classTeacherName', value)}
        />
      ),
    },
    {
      title: '教员',
      dataIndex: 'instructor',
      key: 'instructor',
      width: 120,
      align: 'center',
      render: (text: string, record) => (
        <Input
          value={text}
          onChange={(e) => handleTextChange(record.key, 'instructor', e.target.value)}
        />
      ),
    },
    {
      title: '新生姓名',
      dataIndex: 'studentName',
      key: 'studentName',
      width: 120,
      align: 'center',
      render: (text: string, record) => (
        <Input
          value={text}
          onChange={(e) => handleTextChange(record.key, 'studentName', e.target.value)}
        />
      ),
    },
    {
      title: '报名时间',
      dataIndex: 'signUpDate',
      key: 'signUpDate',
      width: 120,
      align: 'center',
      render: (text: string, record) => (
        <DatePicker
          value={text ? dayjs(text) : null}
          onChange={(d) => handleTextChange(record.key, 'signUpDate', d ? d.format('YYYY-MM-DD') : '')}
          style={{ width: '100%' }}
          allowClear
        />
      ),
    },
    {
      title: '报道时间',
      dataIndex: 'reportDate',
      key: 'reportDate',
      width: 120,
      align: 'center',
      render: (text: string, record) => (
        <DatePicker
          value={text ? dayjs(text) : null}
          onChange={(d) => handleTextChange(record.key, 'reportDate', d ? d.format('YYYY-MM-DD') : '')}
          style={{ width: '100%' }}
          allowClear
        />
      ),
    },
    {
      title: '报名专业',
      dataIndex: 'major',
      key: 'major',
      width: 140,
      align: 'center',
      render: (text: string, record) => (
        <Select
          allowClear
          showSearch
          placeholder="请选择"
          value={text || undefined}
          options={majorOptions.map((m) => ({ label: m, value: m }))}
          onChange={(v) => handleTextChange(record.key, 'major', v ?? '')}
          filterOption={(input, option) =>
            String(option?.label || '')
              .toLowerCase()
              .includes(input.toLowerCase())
          }
        />
      ),
    },
    {
      title: '报名学制',
      dataIndex: 'programLength',
      key: 'programLength',
      width: 120,
      align: 'center',
      render: (text: string, record) => (
        <Select
          allowClear
          placeholder="请选择"
          value={text || undefined}
          options={['6个月', '20个月', '2年', '三年'].map((v) => ({ label: v, value: v }))}
          onChange={(v) => handleTextChange(record.key, 'programLength', v ?? '')}
        />
      ),
    },
    {
      title: '应收学费',
      dataIndex: 'tuitionShould',
      key: 'tuitionShould',
      width: 120,
      align: 'center',
      render: (value: number, record) => (
        <InputNumber
          min={0}
          value={value || 0}
          style={{ width: '100%' }}
          onChange={(v) => handleNumberChange(record.key, 'tuitionShould', v ?? 0)}
        />
      ),
    },
    {
      title: '报名交费金额',
      dataIndex: 'tuitionPaid',
      key: 'tuitionPaid',
      width: 140,
      align: 'center',
      render: (value: number, record) => (
        <InputNumber
          min={0}
          value={value || 0}
          style={{ width: '100%' }}
          onChange={(v) => handleNumberChange(record.key, 'tuitionPaid', v ?? 0)}
        />
      ),
    },
    {
      title: '补款金额',
      dataIndex: 'additionalPayment',
      key: 'additionalPayment',
      width: 120,
      align: 'center',
      render: (value: number, record) => (
        <InputNumber
          min={0}
          value={value || 0}
          style={{ width: '100%' }}
          onChange={(v) => handleNumberChange(record.key, 'additionalPayment', v ?? 0)}
        />
      ),
    },
    {
      title: '仍欠费金额',
      dataIndex: 'arrearsAmount',
      key: 'arrearsAmount',
      width: 120,
      align: 'center',
      render: (value: number, record) => (
        <InputNumber
          min={0}
          value={value || 0}
          style={{ width: '100%' }}
          onChange={(v) => handleNumberChange(record.key, 'arrearsAmount', v ?? 0)}
        />
      ),
    },
    {
      title: '是否全款',
      dataIndex: 'isFullPayment',
      key: 'isFullPayment',
      width: 110,
      align: 'center',
      render: (_text: string, record) => {
        // 自动展示：仍欠费金额不为 0 -> 否；等于 0 -> 是
        const arrears = Number(record.arrearsAmount || 0)
        const value = arrears === 0 ? '是' : '否'
        return (
          <Select
            allowClear
            options={YES_NO_OPTIONS}
            value={value}
            onChange={(v) => handleTextChange(record.key, 'isFullPayment', v ?? '')}
          />
        )
      },
    },
    {
      title: '是否贷款',
      dataIndex: 'isLoan',
      key: 'isLoan',
      width: 110,
      align: 'center',
      render: (text: string, record) => (
        <Select
          allowClear
          options={YES_NO_OPTIONS}
          value={text || undefined}
          onChange={(v) => handleTextChange(record.key, 'isLoan', v ?? '')}
        />
      ),
    },
    {
      title: '是否过课时',
      dataIndex: 'hasAttendedClass',
      key: 'hasAttendedClass',
      width: 120,
      align: 'center',
      render: (text: string, record) => (
        <Select
          allowClear
          options={YES_NO_OPTIONS}
          value={text || undefined}
          onChange={(v) => handleTextChange(record.key, 'hasAttendedClass', v ?? '')}
        />
      ),
    },
    {
      title: '试学周期',
      dataIndex: 'trialPeriod',
      key: 'trialPeriod',
      width: 220,
      align: 'center',
      render: (text: string, record) => (
        <TrialPeriodRangeLooseCell
          value={text}
          onChangeValue={(next) => handleTextChange(record.key, 'trialPeriod', next)}
        />
      ),
    },
    {
      title: '是否退费',
      dataIndex: 'isRefund',
      key: 'isRefund',
      width: 110,
      align: 'center',
      render: (text: string, record) => (
        <Select
          allowClear
          options={YES_NO_OPTIONS}
          value={text || undefined}
          onChange={(v) => handleTextChange(record.key, 'isRefund', v ?? '')}
        />
      ),
    },
    {
      title: '退费时间',
      dataIndex: 'refundTime',
      key: 'refundTime',
      width: 130,
      align: 'center',
      render: (text: string, record) => (
        <DatePicker
          value={text ? dayjs(text) : null}
          onChange={(d) => handleTextChange(record.key, 'refundTime', d ? d.format('YYYY-MM-DD') : '')}
          style={{ width: '100%' }}
          allowClear
        />
      ),
    },
    {
      title: '退费情况说明',
      dataIndex: 'refundNote',
      key: 'refundNote',
      width: 200,
      align: 'left',
      render: (text: string, record) => (
        <Input
          value={text}
          onChange={(e) => handleTextChange(record.key, 'refundNote', e.target.value)}
        />
      ),
    },
    {
      title: '咨询师',
      dataIndex: 'consultant',
      key: 'consultant',
      width: 120,
      align: 'center',
      render: (text: string, record) => (
        <Input
          value={text}
          onChange={(e) => handleTextChange(record.key, 'consultant', e.target.value)}
        />
      ),
    },
    {
      title: '是否住宿',
      dataIndex: 'hasAccommodation',
      key: 'hasAccommodation',
      width: 110,
      align: 'center',
      render: (text: string, record) => (
        <Select
          allowClear
          options={YES_NO_OPTIONS}
          value={text || undefined}
          onChange={(v) => handleTextChange(record.key, 'hasAccommodation', v ?? '')}
        />
      ),
    },
    {
      title: '宿舍名',
      dataIndex: 'dormName',
      key: 'dormName',
      width: 160,
      align: 'center',
      render: (text: string, record) => (
        <Input
          value={text}
          onChange={(e) => handleTextChange(record.key, 'dormName', e.target.value)}
        />
      ),
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      width: 180,
      align: 'left',
      render: (text: string, record) => (
        <Input
          value={text}
          onChange={(e) => handleTextChange(record.key, 'remark', e.target.value)}
        />
      ),
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>{currentCampus ? `${currentCampus}教化司当月新生维稳明细表` : '教化司当月新生维稳明细表'}</div>
      <Card extra={
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
            onChange={(v) => setMonth(v)}
            options={[{ value: 0, label: '全年' }, ...Array.from({ length: 12 }).map((_, i) => ({ value: i + 1, label: `${i + 1}` }))]}
            style={{ width: 100 }}
          />

          <span>是否过课时</span>
          <Select
            allowClear
            placeholder="全部"
            options={YES_NO_OPTIONS}
            value={filterHasAttendedClass || undefined}
            onChange={(v) => setFilterHasAttendedClass(v ?? '')}
            style={{ width: 110 }}
          />

          <span>是否退费</span>
          <Select
            allowClear
            placeholder="全部"
            options={YES_NO_OPTIONS}
            value={filterIsRefund || undefined}
            onChange={(v) => setFilterIsRefund(v ?? '')}
            style={{ width: 110 }}
          />

          <span>新生姓名</span>
          <Input
            placeholder="搜索姓名"
            value={searchStudentName}
            onChange={(e) => setSearchStudentName(e.target.value)}
            style={{ width: 160 }}
            allowClear
          />

          <Button onClick={() => {
            setFilterHasAttendedClass('')
            setFilterIsRefund('')
            setSearchStudentName('')
          }}>清空筛选</Button>

          <Button onClick={fetchFromServer} disabled={!canIO}>刷新</Button>
          <Button onClick={addRow}>新增</Button>
          <Button type="primary" onClick={saveToServer} disabled={!canIO}>保存</Button>
        </Space>
      }>
        <Table<MonthlyStabilityDetailRow>
          bordered
          size="small"
          columns={columns}
          dataSource={filteredRows}
          pagination={false}
          rowKey="key"
          scroll={{ x: 'max-content' }}
        />
      </Card>
    </div>
  )
}

export default CampusMonthlyNewStuStabilityDetailTable
