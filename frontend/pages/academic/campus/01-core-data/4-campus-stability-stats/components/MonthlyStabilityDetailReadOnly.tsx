/**
 * 月新生维稳明细表（只读版本）
 * 从教化司后端获取数据，智慧司只读展示
 */
import React, { useEffect, useMemo, useState } from 'react'
import { App, Card, Table, Input, InputNumber, Select, Space, Button, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'

import { useCampusStore } from '@/stores/campusStore'
import { buildApiUrl } from '@/utils/apiBase'
import ArrearsDetailReadOnly from './ArrearsDetailReadOnly'

const { Title } = Typography

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

const MonthlyStabilityDetailReadOnly: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore()
  const [year, setYear] = useState<number>(new Date().getFullYear())
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1)
  const [rows, setRows] = useState<MonthlyStabilityDetailRow[]>([])
  const [loading, setLoading] = useState(false)

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
    setRows(mapped)
  }

  const fetchFromServer = async () => {
    if (!canIO) {
      message.warning('请先选择神殿和年份')
      return
    }
    setLoading(true)
    try {
      let url = `/teaching-quality/campus-monthly-new-stu-stability-detail?campus=${encodeURIComponent(currentCampus!)}&year=${year}`
      if (month === 0) {
        url += '&all_year=true'
      } else {
        url += `&month=${month}`
      }

      const res = await fetch(buildApiUrl(url))
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      applyServerRows(data?.行列表 || [])
    } catch (e) {
      console.error(e)
      message.error('获取数据失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (currentCampus) fetchFromServer()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCampus, year, month])

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
    },
    {
      title: '教员',
      dataIndex: 'instructor',
      key: 'instructor',
      width: 100,
      align: 'center',
    },
    {
      title: '新生姓名',
      dataIndex: 'studentName',
      key: 'studentName',
      width: 120,
      align: 'center',
    },
    {
      title: '报名时间',
      dataIndex: 'signUpDate',
      key: 'signUpDate',
      width: 120,
      align: 'center',
    },
    {
      title: '报道时间',
      dataIndex: 'reportDate',
      key: 'reportDate',
      width: 120,
      align: 'center',
    },
    {
      title: '报名专业',
      dataIndex: 'major',
      key: 'major',
      width: 140,
      align: 'center',
    },
    {
      title: '报名学制',
      dataIndex: 'programLength',
      key: 'programLength',
      width: 120,
      align: 'center',
    },
    {
      title: '应收学费',
      dataIndex: 'tuitionShould',
      key: 'tuitionShould',
      width: 120,
      align: 'center',
      render: (value: number) => (value > 0 ? value : ''),
    },
    {
      title: '报名交费金额',
      dataIndex: 'tuitionPaid',
      key: 'tuitionPaid',
      width: 140,
      align: 'center',
      render: (value: number) => (value > 0 ? value : ''),
    },
    {
      title: '补款金额',
      dataIndex: 'additionalPayment',
      key: 'additionalPayment',
      width: 120,
      align: 'center',
      render: (value: number) => (value > 0 ? value : ''),
    },
    {
      title: '仍欠费金额',
      dataIndex: 'arrearsAmount',
      key: 'arrearsAmount',
      width: 120,
      align: 'center',
      render: (value: number) => (value > 0 ? value : ''),
    },
    {
      title: '是否全款',
      dataIndex: 'isFullPayment',
      key: 'isFullPayment',
      width: 100,
      align: 'center',
      render: (_text: string, record) => {
        const arrears = Number(record.arrearsAmount || 0)
        return arrears === 0 ? '是' : '否'
      },
    },
    {
      title: '是否贷款',
      dataIndex: 'isLoan',
      key: 'isLoan',
      width: 100,
      align: 'center',
    },
    {
      title: '是否过课时',
      dataIndex: 'hasAttendedClass',
      key: 'hasAttendedClass',
      width: 110,
      align: 'center',
    },
    {
      title: '试学周期',
      dataIndex: 'trialPeriod',
      key: 'trialPeriod',
      width: 180,
      align: 'center',
    },
    {
      title: '是否退费',
      dataIndex: 'isRefund',
      key: 'isRefund',
      width: 100,
      align: 'center',
    },
    {
      title: '退费时间',
      dataIndex: 'refundTime',
      key: 'refundTime',
      width: 120,
      align: 'center',
    },
    {
      title: '退费情况说明',
      dataIndex: 'refundNote',
      key: 'refundNote',
      width: 200,
      align: 'left',
    },
    {
      title: '咨询师',
      dataIndex: 'consultant',
      key: 'consultant',
      width: 100,
      align: 'center',
    },
    {
      title: '是否住宿',
      dataIndex: 'hasAccommodation',
      key: 'hasAccommodation',
      width: 100,
      align: 'center',
    },
    {
      title: '宿舍名',
      dataIndex: 'dormName',
      key: 'dormName',
      width: 140,
      align: 'center',
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      width: 180,
      align: 'left',
    },
  ]

  return (
    <div>
      <Card
        title={<Title level={5} style={{ margin: 0 }}>月新生维稳明细表</Title>}
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
              onChange={(v) => setMonth(v)}
              options={[
                { value: 0, label: '全年' },
                ...Array.from({ length: 12 }).map((_, i) => ({ value: i + 1, label: `${i + 1}` })),
              ]}
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

            <Button
              onClick={() => {
                setFilterHasAttendedClass('')
                setFilterIsRefund('')
                setSearchStudentName('')
              }}
            >
              清空筛选
            </Button>

            <Button onClick={fetchFromServer} disabled={!canIO}>
              刷新
            </Button>
          </Space>
        }
      >
        <Table<MonthlyStabilityDetailRow>
          bordered
          size="small"
          columns={columns}
          dataSource={filteredRows}
          pagination={false}
          rowKey="key"
          scroll={{ x: 'max-content' }}
          loading={loading}
        />
      </Card>
      
      {/* 第二个子表：新生仍欠费明细表 */}
      <ArrearsDetailReadOnly />
    </div>
  )
}

export default MonthlyStabilityDetailReadOnly
