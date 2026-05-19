// 学术->学术经理 XX神殿智慧司口碑招生关键点结果明细表
import React, { useMemo, useState } from 'react'
import { Card, Table, Select, Space, Typography, Row, Col, Divider } from 'antd'
import type { ColumnsType } from 'antd/es/table'

const { Option } = Select
const { Title, Text } = Typography

interface OnlinePromotionMetrics {
  wechatMoments: number
  douyin: number
  kuaishou: number
  xiaohongshu: number
  total: number
}

interface StudentInterviewMetrics {
  currentStudent: number
  graduate: number
  total: number
}

interface ReputationDetailBaseRecord {
  id: string
  year: number
  month: number
  campus: string
  teacherName: string
  onlinePromotion: OnlinePromotionMetrics
  studentInterview: StudentInterviewMetrics
}

type RowType = 'data' | 'monthTotal' | 'grandTotal'

interface ReputationDetailTableRow extends ReputationDetailBaseRecord {
  key: string
  rowType: RowType
  monthLabel: string
}

const normalizeOnlineMetrics = (
  metrics: Omit<OnlinePromotionMetrics, 'total'>,
): OnlinePromotionMetrics => {
  const { wechatMoments, douyin, kuaishou, xiaohongshu } = metrics
  const total = wechatMoments + douyin + kuaishou + xiaohongshu
  return { wechatMoments, douyin, kuaishou, xiaohongshu, total }
}

const normalizeInterviewMetrics = (
  metrics: Omit<StudentInterviewMetrics, 'total'>,
): StudentInterviewMetrics => {
  const { currentStudent, graduate } = metrics
  const total = currentStudent + graduate
  return { currentStudent, graduate, total }
}

const baseRecords: ReputationDetailBaseRecord[] = Array.from({ length: 12 }).flatMap((_, index) => {
  const month = index + 1
  const year = 2024
  const campus = '石美'

  const teachers: Array<
    Pick<ReputationDetailBaseRecord, 'teacherName' | 'onlinePromotion' | 'studentInterview'>
  > = [
    {
      teacherName: '张三',
      onlinePromotion: normalizeOnlineMetrics({
        wechatMoments: 0,
        douyin: 0,
        kuaishou: 0,
        xiaohongshu: 0,
      }),
      studentInterview: normalizeInterviewMetrics({
        currentStudent: 0,
        graduate: 0,
      }),
    },
    {
      teacherName: '李四',
      onlinePromotion: normalizeOnlineMetrics({
        wechatMoments: 0,
        douyin: 0,
        kuaishou: 0,
        xiaohongshu: 0,
      }),
      studentInterview: normalizeInterviewMetrics({
        currentStudent: 0,
        graduate: 0,
      }),
    },
  ]

  return teachers.map((teacher, teacherIndex) => ({
    id: `${year}-${month}-${teacherIndex}`,
    year,
    month,
    campus,
    teacherName: teacher.teacherName,
    onlinePromotion: teacher.onlinePromotion,
    studentInterview: teacher.studentInterview,
  }))
})

const monthOptions = Array.from({ length: 12 }, (_, idx) => idx + 1)
const campusOptions = Array.from(new Set(baseRecords.map((item) => item.campus)))
const teacherOptions = Array.from(new Set(baseRecords.map((item) => item.teacherName)))

const ReputationDetailsPage: React.FC = () => {
  const [monthFilter, setMonthFilter] = useState<number | 'all'>('all')
  const [campusFilter, setCampusFilter] = useState<string | 'all'>('all')
  const [teacherFilter, setTeacherFilter] = useState<string | 'all'>('all')

  const filteredRecords = useMemo(() => {
    return baseRecords.filter((record) => {
      const monthMatch = monthFilter === 'all' || record.month === monthFilter
      const campusMatch = campusFilter === 'all' || record.campus === campusFilter
      const teacherMatch = teacherFilter === 'all' || record.teacherName === teacherFilter
      return monthMatch && campusMatch && teacherMatch
    })
  }, [campusFilter, monthFilter, teacherFilter])

  const tableData: ReputationDetailTableRow[] = useMemo(() => {
    if (filteredRecords.length === 0) {
      return []
    }

    const monthlyGroups = filteredRecords.reduce<Record<number, ReputationDetailBaseRecord[]>>(
      (acc, record) => {
        if (!acc[record.month]) {
          acc[record.month] = []
        }
        acc[record.month].push(record)
        return acc
      },
      {},
    )

    const rows: ReputationDetailTableRow[] = []

    Object.keys(monthlyGroups)
      .map((key) => Number(key))
      .sort((a, b) => a - b)
      .forEach((month) => {
        const monthRecords = monthlyGroups[month]

        monthRecords.forEach((record) => {
          rows.push({
            key: `data-${record.id}`,
            rowType: 'data',
            monthLabel: `${record.month}月`,
            ...record,
          })
        })

        const monthTotals = monthRecords.reduce(
          (acc, record) => {
            acc.onlinePromotion.wechatMoments += record.onlinePromotion.wechatMoments
            acc.onlinePromotion.douyin += record.onlinePromotion.douyin
            acc.onlinePromotion.kuaishou += record.onlinePromotion.kuaishou
            acc.onlinePromotion.xiaohongshu += record.onlinePromotion.xiaohongshu
            acc.studentInterview.currentStudent += record.studentInterview.currentStudent
            acc.studentInterview.graduate += record.studentInterview.graduate
            return acc
          },
          {
            onlinePromotion: {
              wechatMoments: 0,
              douyin: 0,
              kuaishou: 0,
              xiaohongshu: 0,
            },
            studentInterview: {
              currentStudent: 0,
              graduate: 0,
            },
          },
        )

        rows.push({
          key: `month-total-${month}`,
          rowType: 'monthTotal',
          id: `month-total-${month}`,
          month,
          monthLabel: '',
          campus: '—',
          teacherName: '合计',
          onlinePromotion: normalizeOnlineMetrics(monthTotals.onlinePromotion),
          studentInterview: normalizeInterviewMetrics(monthTotals.studentInterview),
          year: monthRecords[0].year,
        })
      })

    const overallTotals = filteredRecords.reduce(
      (acc, record) => {
        acc.onlinePromotion.wechatMoments += record.onlinePromotion.wechatMoments
        acc.onlinePromotion.douyin += record.onlinePromotion.douyin
        acc.onlinePromotion.kuaishou += record.onlinePromotion.kuaishou
        acc.onlinePromotion.xiaohongshu += record.onlinePromotion.xiaohongshu
        acc.studentInterview.currentStudent += record.studentInterview.currentStudent
        acc.studentInterview.graduate += record.studentInterview.graduate
        return acc
      },
      {
        onlinePromotion: {
          wechatMoments: 0,
          douyin: 0,
          kuaishou: 0,
          xiaohongshu: 0,
        },
        studentInterview: {
          currentStudent: 0,
          graduate: 0,
        },
      },
    )

    rows.push({
      key: 'grand-total',
      rowType: 'grandTotal',
      id: 'grand-total',
      month: 0,
      monthLabel: '总计',
      campus: '—',
      teacherName: '—',
      onlinePromotion: normalizeOnlineMetrics(overallTotals.onlinePromotion),
      studentInterview: normalizeInterviewMetrics(overallTotals.studentInterview),
      year: filteredRecords[0].year,
    })

    return rows
  }, [filteredRecords])

  const columns: ColumnsType<ReputationDetailTableRow> = [
    {
      title: '月份',
      dataIndex: 'month',
      align: 'center',
      width: 80,
      render: (_value, record) =>
        record.rowType === 'data' ? record.monthLabel : record.monthLabel,
    },
    {
      title: '神殿',
      dataIndex: 'campus',
      align: 'center',
      width: 120,
    },
    {
      title: '教员姓名',
      dataIndex: 'teacherName',
      align: 'center',
      width: 120,
    },
    {
      title: '线上宣传情况',
      children: [
        {
          title: '朋友圈数量',
          dataIndex: ['onlinePromotion', 'wechatMoments'],
          align: 'center',
          width: 120,
        },
        {
          title: '抖音数量',
          dataIndex: ['onlinePromotion', 'douyin'],
          align: 'center',
          width: 100,
        },
        {
          title: '快手数量',
          dataIndex: ['onlinePromotion', 'kuaishou'],
          align: 'center',
          width: 100,
        },
        {
          title: '小红书数量',
          dataIndex: ['onlinePromotion', 'xiaohongshu'],
          align: 'center',
          width: 120,
        },
        {
          title: '合计',
          dataIndex: ['onlinePromotion', 'total'],
          align: 'center',
          width: 100,
        },
      ],
    },
    {
      title: '学生访谈情况',
      children: [
        {
          title: '在校生访谈',
          dataIndex: ['studentInterview', 'currentStudent'],
          align: 'center',
          width: 120,
        },
        {
          title: '毕业生访谈',
          dataIndex: ['studentInterview', 'graduate'],
          align: 'center',
          width: 120,
        },
        {
          title: '合计',
          dataIndex: ['studentInterview', 'total'],
          align: 'center',
          width: 100,
        },
      ],
    },
  ]

  return (
    <Card bordered={false} style={{ backgroundColor: '#f5f7fa' }}>
      <Row justify="space-between" align="middle">
        <Col>
          <Title level={4} style={{ marginBottom: 0 }}>
            XX神殿智慧司口碑招生关键点结果明细表
          </Title>
          <Text type="secondary">统计维度涵盖线上宣传与学生访谈情况</Text>
        </Col>
      </Row>

      <Divider style={{ margin: '16px 0' }} />

      <Space wrap style={{ marginBottom: 16 }}>
        <Space size="small">
          <Text strong>月份：</Text>
          <Select<number | 'all'>
            value={monthFilter}
            onChange={(value) => setMonthFilter(value)}
            style={{ width: 160 }}
          >
            <Option value="all">全部月份</Option>
            {monthOptions.map((month) => (
              <Option key={month} value={month}>{`${month}月`}</Option>
            ))}
          </Select>
        </Space>

        <Space size="small">
          <Text strong>神殿：</Text>
          <Select<string | 'all'>
            value={campusFilter}
            onChange={(value) => setCampusFilter(value)}
            style={{ width: 160 }}
          >
            <Option value="all">全部神殿</Option>
            {campusOptions.map((campus) => (
              <Option key={campus} value={campus}>
                {campus}
              </Option>
            ))}
          </Select>
        </Space>

        <Space size="small">
          <Text strong>教员姓名：</Text>
          <Select<string | 'all'>
            value={teacherFilter}
            onChange={(value) => setTeacherFilter(value)}
            style={{ width: 160 }}
          >
            <Option value="all">全部教员</Option>
            {teacherOptions.map((teacher) => (
              <Option key={teacher} value={teacher}>
                {teacher}
              </Option>
            ))}
          </Select>
        </Space>
      </Space>

      <Table<ReputationDetailTableRow>
        bordered
        columns={columns}
        dataSource={tableData}
        pagination={false}
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: '暂无数据，请调整筛选条件' }}
        rowClassName={(record) => {
          if (record.rowType === 'monthTotal') {
            return 'detail-table-month-total'
          }
          if (record.rowType === 'grandTotal') {
            return 'detail-table-grand-total'
          }
          return ''
        }}
      />
    </Card>
  )
}

export default ReputationDetailsPage
