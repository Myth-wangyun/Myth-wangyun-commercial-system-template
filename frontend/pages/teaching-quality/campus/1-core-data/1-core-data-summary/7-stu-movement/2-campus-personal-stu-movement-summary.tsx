/**
 * 07-1 神殿教化司个人统计学员异动表（年汇总，只读展示）
 * 数据来源：后端视图 teaching_quality."V_神殿个人学员异动年汇总"
 * API: GET /api/v1/teaching-quality/campus-personal-stu-movement?campus=..&year=YYYY
 */
import React, { useEffect, useMemo, useState } from 'react'
import { App, Card, Table, InputNumber, Space, Button } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useCampusStore } from '@/stores/campusStore'
import { buildApiUrl } from '@/utils/apiBase'

interface PersonalMovementRow {
  key: string
  serialNumber: number
  teacherName: string
  totalStudents: number
  newRefundCount: number
  oldRefundCount: number
  totalRefundCount: number
  suspensionCount: number
  longLeaveCount: number
  longNoClassCount: number
  holidayCount: number
  otherCount: number
  totalMovementCount: number
  isSummary?: boolean
}

const formatRate = (numerator: number, denominator: number) => {
  if (!denominator) return '0%'
  const rate = (numerator / denominator) * 100
  const fixed = rate.toFixed(1)
  const text = fixed.endsWith('.0') ? fixed.slice(0, -2) : fixed
  return `${text}%`
}

const ShengbangPersonalStuMovementSummary: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore()
  const [year, setYear] = useState<number>(new Date().getFullYear())
  const [rows, setRows] = useState<PersonalMovementRow[]>([])
  const [loading, setLoading] = useState(false)

  const canIO = useMemo(() => Boolean(currentCampus && year), [currentCampus, year])

  const fetchFromServer = async () => {
    if (!canIO) {
      message.warning('请先选择神殿/年份')
      return
    }
    try {
      const res = await fetch(
        buildApiUrl(`/teaching-quality/campus-personal-stu-movement?campus=${encodeURIComponent(
          currentCampus!,
        )}&year=${year}`),
      )
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      const list = (data?.行列表 || []) as any[]
      const mapped: PersonalMovementRow[] = list
        .map((item: any) => ({
          teacherName: String(item.name || ''),
          totalStudents: Number(item.totalStudents || 0),
          newRefundCount: Number(item.newRefundCount || 0),
          oldRefundCount: Number(item.oldRefundCount || 0),
          totalRefundCount: Number(item.totalRefundCount || 0),
          suspensionCount: Number(item.suspensionCount || 0),
          longLeaveCount: Number(item.longLeaveCount || 0),
          longNoClassCount: Number(item.longNoClassCount || 0),
          holidayCount: Number(item.holidayCount || 0),
          otherCount: Number(item.otherCount || 0),
          totalMovementCount: Number(item.totalMovementCount || 0),
        }))
        .sort((a, b) => a.teacherName.localeCompare(b.teacherName))
        .map((r, idx) => ({
          key: `${idx + 1}`,
          serialNumber: idx + 1,
          ...r,
        }))
      setRows(mapped)
      message.success('已刷新')
    } catch (e) {
      console.error(e)
      message.error('刷新失败')
    }
  }

  // 从明细表自动计算汇总数据
  const calcFromDetails = async (isUserAction = true) => {
    if (!canIO) {
      if (isUserAction) message.warning('请先选择神殿/年份')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(
        buildApiUrl(`/teaching-quality/campus-personal-stu-movement-calc?campus=${encodeURIComponent(
          currentCampus!,
        )}&year=${year}`),
      )
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      const list = (data?.行列表 || []) as any[]
      const mapped: PersonalMovementRow[] = list
        .map((item: any) => ({
          teacherName: String(item.teacherName || ''),
          totalStudents: Number(item.totalStudents || 0),
          newRefundCount: Number(item.newRefundCount || 0),
          oldRefundCount: Number(item.oldRefundCount || 0),
          totalRefundCount: Number(item.totalRefundCount || 0),
          suspensionCount: Number(item.suspensionCount || 0),
          longLeaveCount: Number(item.longLeaveCount || 0),
          longNoClassCount: Number(item.longNoClassCount || 0),
          holidayCount: Number(item.holidayCount || 0),
          otherCount: Number(item.otherCount || 0),
          totalMovementCount: Number(item.totalMovementCount || 0),
        }))
        .sort((a, b) => a.teacherName.localeCompare(b.teacherName))
        .map((r, idx) => ({
          key: `${idx + 1}`,
          serialNumber: idx + 1,
          ...r,
        }))
      setRows(mapped)
      if (isUserAction) message.success('已从明细表自动计算')
    } catch (e) {
      console.error(e)
      if (isUserAction) message.error('自动计算失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (currentCampus) {
      setRows([])
      calcFromDetails(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCampus, year])

  const summaryRow: PersonalMovementRow = useMemo(() => {
    const total = rows.reduce(
      (acc, r) => {
        acc.totalStudents += r.totalStudents || 0
        acc.newRefundCount += r.newRefundCount || 0
        acc.oldRefundCount += r.oldRefundCount || 0
        acc.totalRefundCount += r.totalRefundCount || 0
        acc.suspensionCount += r.suspensionCount || 0
        acc.longLeaveCount += r.longLeaveCount || 0
        acc.longNoClassCount += r.longNoClassCount || 0
        acc.holidayCount += r.holidayCount || 0
        acc.otherCount += r.otherCount || 0
        acc.totalMovementCount += r.totalMovementCount || 0
        return acc
      },
      {
        totalStudents: 0,
        newRefundCount: 0,
        oldRefundCount: 0,
        totalRefundCount: 0,
        suspensionCount: 0,
        longLeaveCount: 0,
        longNoClassCount: 0,
        holidayCount: 0,
        otherCount: 0,
        totalMovementCount: 0,
      },
    )

    return {
      key: 'summary',
      serialNumber: 0,
      teacherName: '合计/平均',
      ...total,
      isSummary: true,
    }
  }, [rows])

  const dataSource: PersonalMovementRow[] = [...rows, summaryRow]

  const columns: ColumnsType<PersonalMovementRow> = [
    {
      title: '序号',
      dataIndex: 'serialNumber',
      key: 'serialNumber',
      width: 80,
      align: 'center',
      onCell: (record) => {
        if (record.isSummary) {
          return { colSpan: 2, style: { textAlign: 'center' } }
        }
        return { colSpan: 1, style: { textAlign: 'center' } }
      },
      render: (value, record) =>
        record.isSummary ? (
          <span style={{ color: 'red', fontWeight: 'bold' }}>合计/平均</span>
        ) : (
          value
        ),
    },
    {
      title: '班主任姓名',
      dataIndex: 'teacherName',
      key: 'teacherName',
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
          text || ''
        ),
    },
    {
      title: '累计带生人数',
      dataIndex: 'totalStudents',
      key: 'totalStudents',
      width: 130,
      align: 'center',
      render: (value: number, record) => (record.isSummary ? summaryRow.totalStudents || 0 : value || 0),
    },
    {
      title: '新生退费人数',
      dataIndex: 'newRefundCount',
      key: 'newRefundCount',
      width: 130,
      align: 'center',
      render: (value: number, record) => (record.isSummary ? summaryRow.newRefundCount || 0 : value || 0),
    },
    {
      title: '老生退费人数',
      dataIndex: 'oldRefundCount',
      key: 'oldRefundCount',
      width: 130,
      align: 'center',
      render: (value: number, record) => (record.isSummary ? summaryRow.oldRefundCount || 0 : value || 0),
    },
    {
      title: '退费总人数',
      dataIndex: 'totalRefundCount',
      key: 'totalRefundCount',
      width: 120,
      align: 'center',
      render: (value: number, record) => (record.isSummary ? summaryRow.totalRefundCount || 0 : value || 0),
    },
    {
      title: '退费率',
      dataIndex: 'refundRate',
      key: 'refundRate',
      width: 100,
      align: 'center',
      render: (_: unknown, record) => {
        const denominator = record.isSummary ? summaryRow.totalStudents : record.totalStudents
        const numerator = record.isSummary ? summaryRow.totalRefundCount : record.totalRefundCount
        return formatRate(numerator, denominator)
      },
    },
    {
      title: '休学总人数(累计)',
      dataIndex: 'suspensionCount',
      key: 'suspensionCount',
      width: 150,
      align: 'center',
      render: (value: number, record) => (record.isSummary ? summaryRow.suspensionCount || 0 : value || 0),
    },
    {
      title: '长期请假总人数(累计)',
      dataIndex: 'longLeaveCount',
      key: 'longLeaveCount',
      width: 180,
      align: 'center',
      render: (value: number, record) => (record.isSummary ? summaryRow.longLeaveCount || 0 : value || 0),
    },
    {
      title: '长期不上课总人数(累计)',
      dataIndex: 'longNoClassCount',
      key: 'longNoClassCount',
      width: 190,
      align: 'center',
      render: (value: number, record) => (record.isSummary ? summaryRow.longNoClassCount || 0 : value || 0),
    },
    {
      title: '寒暑假学生总数(累计)',
      dataIndex: 'holidayCount',
      key: 'holidayCount',
      width: 180,
      align: 'center',
      render: (value: number, record) => (record.isSummary ? summaryRow.holidayCount || 0 : value || 0),
    },
    {
      title: '其他情况总人数(累计)',
      dataIndex: 'otherCount',
      key: 'otherCount',
      width: 170,
      align: 'center',
      render: (value: number, record) => (record.isSummary ? summaryRow.otherCount || 0 : value || 0),
    },
    {
      title: '异动总人数(累计)',
      dataIndex: 'totalMovementCount',
      key: 'totalMovementCount',
      width: 160,
      align: 'center',
      render: (value: number, record) => (record.isSummary ? summaryRow.totalMovementCount || 0 : value || 0),
    },
    {
      title: '异动率',
      dataIndex: 'movementRate',
      key: 'movementRate',
      width: 100,
      align: 'center',
      render: (_: unknown, record) => {
        const denominator = record.isSummary ? summaryRow.totalStudents : record.totalStudents
        const numerator = record.isSummary ? summaryRow.totalMovementCount : record.totalMovementCount
        return formatRate(numerator, denominator)
      },
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={`07-1 ${currentCampus || ''} 教化司个人统计学员异动表（年汇总）`}
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
            <Button onClick={() => void fetchFromServer()} disabled={!canIO}>刷新</Button>
            <Button type="primary" onClick={() => void calcFromDetails()} disabled={!canIO} loading={loading}>
              从明细表自动计算
            </Button>
          </Space>
        }
      >
        <Table<PersonalMovementRow>
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
}

export default ShengbangPersonalStuMovementSummary
