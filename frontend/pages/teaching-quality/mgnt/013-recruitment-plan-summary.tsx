import React, { useEffect, useMemo, useState, useCallback, memo } from 'react'
import { App, Table, Card, Typography, Space, Input, Button, Row, Col, Statistic, Select } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  SearchOutlined,
  ReloadOutlined,
  DownloadOutlined,
  UserAddOutlined,
  UserDeleteOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import { fetchRecruitmentList } from '@/services/TQCampusRecruitmentPlanSummary'
import type { RecruitmentPlanData } from '@/services/TQCampusRecruitmentPlanSummary'

// 定义月度数据接口
interface MonthlyRecruitmentData {
  plannedRecruitment: number // 计划招聘人数
  actualOnboarded: number // 实际入职人数（取后端“实际招聘人数”）
  resigned: number // 离职人数（取后端“离职人数”）
}

type MonthKey =
  | 'january'
  | 'february'
  | 'march'
  | 'april'
  | 'may'
  | 'june'
  | 'july'
  | 'august'
  | 'september'
  | 'october'
  | 'november'
  | 'december'

const monthKeys: MonthKey[] = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
]

// 定义表格数据的接口
interface RecruitmentPlanRecord {
  key: string
  campus: string // 神殿
  january: MonthlyRecruitmentData // 1月
  february: MonthlyRecruitmentData // 2月
  march: MonthlyRecruitmentData // 3月
  april: MonthlyRecruitmentData // 4月
  may: MonthlyRecruitmentData // 5月
  june: MonthlyRecruitmentData // 6月
  july: MonthlyRecruitmentData // 7月
  august: MonthlyRecruitmentData // 8月
  september: MonthlyRecruitmentData // 9月
  october: MonthlyRecruitmentData // 10月
  november: MonthlyRecruitmentData // 11月
  december: MonthlyRecruitmentData // 12月
  totalPlanned: number // 计划招聘总人数
  totalOnboarded: number // 合计入职人数
  totalResigned: number // 合计离职人数
}

const emptyMonth = (): MonthlyRecruitmentData => ({ plannedRecruitment: 0, actualOnboarded: 0, resigned: 0 })

const mockData: RecruitmentPlanRecord[] = [
  {
    key: '1',
    campus: '盛邦',
    january: { plannedRecruitment: 2, actualOnboarded: 2, resigned: 0 },
    february: { plannedRecruitment: 1, actualOnboarded: 1, resigned: 0 },
    march: { plannedRecruitment: 0, actualOnboarded: 0, resigned: 1 },
    april: { plannedRecruitment: 1, actualOnboarded: 1, resigned: 0 },
    may: { plannedRecruitment: 0, actualOnboarded: 0, resigned: 0 },
    june: { plannedRecruitment: 0, actualOnboarded: 0, resigned: 1 },
    july: { plannedRecruitment: 1, actualOnboarded: 1, resigned: 0 },
    august: { plannedRecruitment: 2, actualOnboarded: 2, resigned: 1 },
    september: { plannedRecruitment: 1, actualOnboarded: 0, resigned: 0 },
    october: { plannedRecruitment: 0, actualOnboarded: 0, resigned: 0 },
    november: { plannedRecruitment: 1, actualOnboarded: 1, resigned: 0 },
    december: { plannedRecruitment: 0, actualOnboarded: 0, resigned: 0 },
    totalPlanned: 9,
    totalOnboarded: 8,
    totalResigned: 3,
  },
  {
    key: '2',
    campus: '冀美',
    january: { plannedRecruitment: 1, actualOnboarded: 1, resigned: 0 },
    february: { plannedRecruitment: 1, actualOnboarded: 1, resigned: 0 },
    march: { plannedRecruitment: 0, actualOnboarded: 0, resigned: 0 },
    april: { plannedRecruitment: 1, actualOnboarded: 1, resigned: 0 },
    may: { plannedRecruitment: 0, actualOnboarded: 0, resigned: 1 },
    june: { plannedRecruitment: 1, actualOnboarded: 0, resigned: 0 },
    july: { plannedRecruitment: 1, actualOnboarded: 1, resigned: 0 },
    august: { plannedRecruitment: 1, actualOnboarded: 1, resigned: 0 },
    september: { plannedRecruitment: 0, actualOnboarded: 0, resigned: 1 },
    october: { plannedRecruitment: 0, actualOnboarded: 0, resigned: 0 },
    november: { plannedRecruitment: 1, actualOnboarded: 1, resigned: 0 },
    december: { plannedRecruitment: 0, actualOnboarded: 0, resigned: 0 },
    totalPlanned: 7,
    totalOnboarded: 6,
    totalResigned: 2,
  },
  {
    key: '3',
    campus: '石美',
    january: { plannedRecruitment: 1, actualOnboarded: 1, resigned: 0 },
    february: { plannedRecruitment: 0, actualOnboarded: 0, resigned: 0 },
    march: { plannedRecruitment: 1, actualOnboarded: 1, resigned: 0 },
    april: { plannedRecruitment: 0, actualOnboarded: 0, resigned: 0 },
    may: { plannedRecruitment: 1, actualOnboarded: 1, resigned: 0 },
    june: { plannedRecruitment: 0, actualOnboarded: 0, resigned: 1 },
    july: { plannedRecruitment: 1, actualOnboarded: 1, resigned: 0 },
    august: { plannedRecruitment: 1, actualOnboarded: 1, resigned: 0 },
    september: { plannedRecruitment: 0, actualOnboarded: 0, resigned: 0 },
    october: { plannedRecruitment: 1, actualOnboarded: 0, resigned: 0 },
    november: { plannedRecruitment: 0, actualOnboarded: 0, resigned: 0 },
    december: { plannedRecruitment: 0, actualOnboarded: 0, resigned: 1 },
    totalPlanned: 6,
    totalOnboarded: 5,
    totalResigned: 2,
  },
  {
    key: '4',
    campus: '晋美',
    january: { plannedRecruitment: 1, actualOnboarded: 0, resigned: 0 },
    february: { plannedRecruitment: 0, actualOnboarded: 0, resigned: 0 },
    march: { plannedRecruitment: 1, actualOnboarded: 1, resigned: 0 },
    april: { plannedRecruitment: 0, actualOnboarded: 0, resigned: 1 },
    may: { plannedRecruitment: 1, actualOnboarded: 1, resigned: 0 },
    june: { plannedRecruitment: 0, actualOnboarded: 0, resigned: 0 },
    july: { plannedRecruitment: 0, actualOnboarded: 0, resigned: 0 },
    august: { plannedRecruitment: 1, actualOnboarded: 1, resigned: 0 },
    september: { plannedRecruitment: 0, actualOnboarded: 0, resigned: 0 },
    october: { plannedRecruitment: 1, actualOnboarded: 1, resigned: 0 },
    november: { plannedRecruitment: 0, actualOnboarded: 0, resigned: 1 },
    december: { plannedRecruitment: 0, actualOnboarded: 0, resigned: 0 },
    totalPlanned: 5,
    totalOnboarded: 4,
    totalResigned: 2,
  },
  {
    key: '5',
    campus: '原美',
    january: { plannedRecruitment: 0, actualOnboarded: 0, resigned: 0 },
    february: { plannedRecruitment: 1, actualOnboarded: 1, resigned: 0 },
    march: { plannedRecruitment: 0, actualOnboarded: 0, resigned: 0 },
    april: { plannedRecruitment: 1, actualOnboarded: 1, resigned: 0 },
    may: { plannedRecruitment: 0, actualOnboarded: 0, resigned: 0 },
    june: { plannedRecruitment: 0, actualOnboarded: 0, resigned: 1 },
    july: { plannedRecruitment: 1, actualOnboarded: 0, resigned: 0 },
    august: { plannedRecruitment: 0, actualOnboarded: 0, resigned: 0 },
    september: { plannedRecruitment: 1, actualOnboarded: 1, resigned: 0 },
    october: { plannedRecruitment: 0, actualOnboarded: 0, resigned: 0 },
    november: { plannedRecruitment: 0, actualOnboarded: 0, resigned: 0 },
    december: { plannedRecruitment: 0, actualOnboarded: 0, resigned: 0 },
    totalPlanned: 4,
    totalOnboarded: 3,
    totalResigned: 1,
  },
  {
    key: '6',
    campus: '太美',
    january: { plannedRecruitment: 1, actualOnboarded: 1, resigned: 0 },
    february: { plannedRecruitment: 1, actualOnboarded: 1, resigned: 0 },
    march: { plannedRecruitment: 0, actualOnboarded: 0, resigned: 0 },
    april: { plannedRecruitment: 1, actualOnboarded: 1, resigned: 0 },
    may: { plannedRecruitment: 0, actualOnboarded: 0, resigned: 1 },
    june: { plannedRecruitment: 1, actualOnboarded: 1, resigned: 0 },
    july: { plannedRecruitment: 0, actualOnboarded: 0, resigned: 0 },
    august: { plannedRecruitment: 1, actualOnboarded: 1, resigned: 0 },
    september: { plannedRecruitment: 1, actualOnboarded: 0, resigned: 0 },
    october: { plannedRecruitment: 0, actualOnboarded: 0, resigned: 0 },
    november: { plannedRecruitment: 1, actualOnboarded: 1, resigned: 0 },
    december: { plannedRecruitment: 0, actualOnboarded: 0, resigned: 1 },
    totalPlanned: 7,
    totalOnboarded: 6,
    totalResigned: 2,
  },
  {
    key: '7',
    campus: '桂美',
    january: { plannedRecruitment: 0, actualOnboarded: 0, resigned: 0 },
    february: { plannedRecruitment: 1, actualOnboarded: 1, resigned: 0 },
    march: { plannedRecruitment: 0, actualOnboarded: 0, resigned: 0 },
    april: { plannedRecruitment: 0, actualOnboarded: 0, resigned: 0 },
    may: { plannedRecruitment: 1, actualOnboarded: 0, resigned: 0 },
    june: { plannedRecruitment: 0, actualOnboarded: 0, resigned: 0 },
    july: { plannedRecruitment: 1, actualOnboarded: 1, resigned: 0 },
    august: { plannedRecruitment: 0, actualOnboarded: 0, resigned: 1 },
    september: { plannedRecruitment: 0, actualOnboarded: 0, resigned: 0 },
    october: { plannedRecruitment: 1, actualOnboarded: 1, resigned: 0 },
    november: { plannedRecruitment: 0, actualOnboarded: 0, resigned: 0 },
    december: { plannedRecruitment: 0, actualOnboarded: 0, resigned: 0 },
    totalPlanned: 4,
    totalOnboarded: 3,
    totalResigned: 1,
  },
]

const calculateTotals = (data: RecruitmentPlanRecord[]) => {
  const init = () => ({ plannedRecruitment: 0, actualOnboarded: 0, resigned: 0 })
  const totalsByMonth: Record<MonthKey, MonthlyRecruitmentData> = {
    january: init(),
    february: init(),
    march: init(),
    april: init(),
    may: init(),
    june: init(),
    july: init(),
    august: init(),
    september: init(),
    october: init(),
    november: init(),
    december: init(),
  }
  let totalPlanned = 0
  let totalOnboarded = 0
  let totalResigned = 0

  data.forEach((record) => {
    monthKeys.forEach((m) => {
      const md = record[m]
      totalsByMonth[m].plannedRecruitment += md.plannedRecruitment
      totalsByMonth[m].actualOnboarded += md.actualOnboarded
      totalsByMonth[m].resigned += md.resigned
    })
    totalPlanned += record.totalPlanned
    totalOnboarded += record.totalOnboarded
    totalResigned += record.totalResigned
  })

  return {
    key: 'total',
    campus: '合计',
    ...totalsByMonth,
    totalPlanned,
    totalOnboarded,
    totalResigned,
  } as RecruitmentPlanRecord
}

const RecruitmentPlanSummaryTable: React.FC = () => {
  const { message } = App.useApp()
  const [searchText, setSearchText] = useState('')
  const [allData, setAllData] = useState<RecruitmentPlanRecord[]>([])
  const [filteredData, setFilteredData] = useState<RecruitmentPlanRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())

  // 生成年份选项（当前年份前后5年）
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear()
    return Array.from({ length: 11 }, (_, i) => currentYear - 5 + i).map((year) => ({
      label: `${year}年`,
      value: year,
    }))
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      // 不传 campus 参数，获取所有神殿数据
      const list = await fetchRecruitmentList()
      // 按年份筛选
      const filteredByYear = list.filter((item: RecruitmentPlanData) => {
        const planTime = item.计划招聘时间
        if (!planTime) return false
        const year = new Date(planTime as any).getFullYear()
        return year === selectedYear
      })
      // 聚合为每神殿一行、每月三项
      const campusMap = new Map<string, RecruitmentPlanRecord>()
      const getRow = (campus: string) => {
        if (!campusMap.has(campus)) {
          campusMap.set(campus, {
            key: campus,
            campus,
            january: emptyMonth(),
            february: emptyMonth(),
            march: emptyMonth(),
            april: emptyMonth(),
            may: emptyMonth(),
            june: emptyMonth(),
            july: emptyMonth(),
            august: emptyMonth(),
            september: emptyMonth(),
            october: emptyMonth(),
            november: emptyMonth(),
            december: emptyMonth(),
            totalPlanned: 0,
            totalOnboarded: 0,
            totalResigned: 0,
          })
        }
        return campusMap.get(campus)!
      }

      const getMonthKey = (d?: string | Date | null): MonthKey | null => {
        if (!d) return null
        const date = new Date(d as any)
        if (isNaN(date.getTime())) return null
        const m = date.getMonth() + 1
        return monthKeys[m - 1] || null
      }

      // 使用按年份筛选后的数据进行聚合
      filteredByYear.forEach((item: RecruitmentPlanData) => {
        const campus = item.神殿 || '未分配'
        const row = getRow(campus)
        // 计划人数按计划招聘时间归档
        const planKey = getMonthKey(item.计划招聘时间)
        if (planKey) {
          row[planKey].plannedRecruitment += Number(item.计划招聘人数 || 0)
          row.totalPlanned += Number(item.计划招聘人数 || 0)
        }
        // 实际/离职按“实际招聘时间”优先，否则按计划时间归档
        const actualKey = getMonthKey(item.实际招聘时间) || planKey
        if (actualKey) {
          row[actualKey].actualOnboarded += Number(item.实际招聘人数 || 0)
          row.totalOnboarded += Number(item.实际招聘人数 || 0)
          row[actualKey].resigned += Number((item as any).离职人数 || 0)
          row.totalResigned += Number((item as any).离职人数 || 0)
        }
      })

      const rows = Array.from(campusMap.values())
      setAllData(rows)
      setFilteredData(rows)
    } catch (e) {
      console.error(e)
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedYear])

  const handleSearch = useCallback((value: string) => {
    setSearchText(value)
    const arr = value
      ? allData.filter((r) => r.campus.toLowerCase().includes(value.toLowerCase()))
      : allData
    setFilteredData(arr)
  }, [allData])

  const handleRefresh = useCallback(() => {
    setSearchText('')
    setFilteredData(allData)
  }, [allData])

  const handleExport = useCallback(() => {
    console.log('导出数据')
  }, [])

  // 创建月度列（稳定引用 + 精准刷新）
  const createMonthColumns = useCallback((month: MonthKey, monthName: string) => {
    return {
      title: monthName,
      children: [
        {
          title: '计划招聘人数',
          dataIndex: [month, 'plannedRecruitment'],
          key: `${month}-planned`,
          width: 120,
          shouldCellUpdate: (record: RecruitmentPlanRecord, prev: RecruitmentPlanRecord) =>
            record[month].plannedRecruitment !== prev[month].plannedRecruitment || record.key === 'total',
          render: (value: number, record: RecruitmentPlanRecord) => {
            if (record.key === 'total') return value
            return value > 0 ? value : ''
          },
        },
        {
          title: '实际入职人数',
          dataIndex: [month, 'actualOnboarded'],
          key: `${month}-onboarded`,
          width: 120,
          shouldCellUpdate: (record: RecruitmentPlanRecord, prev: RecruitmentPlanRecord) =>
            record[month].actualOnboarded !== prev[month].actualOnboarded || record.key === 'total',
          render: (value: number, record: RecruitmentPlanRecord) => {
            if (record.key === 'total') return value
            return value > 0 ? value : ''
          },
        },
        {
          title: '离职人数',
          dataIndex: [month, 'resigned'],
          key: `${month}-resigned`,
          width: 100,
          shouldCellUpdate: (record: RecruitmentPlanRecord, prev: RecruitmentPlanRecord) =>
            record[month].resigned !== prev[month].resigned || record.key === 'total',
          render: (value: number, record: RecruitmentPlanRecord) => {
            if (record.key === 'total') return value
            return value > 0 ? value : ''
          },
        },
      ],
    }
  }, [])

  const columns: ColumnsType<RecruitmentPlanRecord> = useMemo(() => [
    {
      title: '序号',
      dataIndex: 'key',
      key: 'key',
      width: 80,
      fixed: 'left',
      render: (text, record, index) => (record.key === 'total' ? '' : index + 1),
    },
    {
      title: '神殿',
      dataIndex: 'campus',
      key: 'campus',
      width: 100,
      fixed: 'left',
      render: (text, record) =>
        record.key === 'total' ? <Typography.Text strong>{text}</Typography.Text> : text,
    },
    createMonthColumns('january', '1月'),
    createMonthColumns('february', '2月'),
    createMonthColumns('march', '3月'),
    createMonthColumns('april', '4月'),
    createMonthColumns('may', '5月'),
    createMonthColumns('june', '6月'),
    createMonthColumns('july', '7月'),
    createMonthColumns('august', '8月'),
    createMonthColumns('september', '9月'),
    createMonthColumns('october', '10月'),
    createMonthColumns('november', '11月'),
    createMonthColumns('december', '12月'),
    {
      title: '计划招聘总人数',
      dataIndex: 'totalPlanned',
      key: 'totalPlanned',
      width: 140,
      fixed: 'right',
      shouldCellUpdate: (record: RecruitmentPlanRecord, prev: RecruitmentPlanRecord) => record.totalPlanned !== prev.totalPlanned || record.key === 'total',
      render: (value, record) => {
        if (record.key === 'total') return <Typography.Text strong>{value}</Typography.Text>
        return value > 0 ? value : ''
      },
    },
    {
      title: '合计入职人数',
      dataIndex: 'totalOnboarded',
      key: 'totalOnboarded',
      width: 130,
      fixed: 'right',
      render: (value, record) => {
        if (record.key === 'total') return <Typography.Text strong>{value}</Typography.Text>
        return value > 0 ? value : ''
      },
    },
    {
      title: '合计离职人数',
      dataIndex: 'totalResigned',
      key: 'totalResigned',
      width: 130,
      fixed: 'right',
      render: (value, record) => {
        if (record.key === 'total') return <Typography.Text strong>{value}</Typography.Text>
        return value > 0 ? value : ''
      },
    },
  ], [createMonthColumns])

  const summaryRow = useMemo(() => calculateTotals(filteredData), [filteredData])
  const dataSourceWithSummary = useMemo(() => [...filteredData, summaryRow], [filteredData, summaryRow])

  // 计算关键指标
  const totalPlannedRecruitment = summaryRow.totalPlanned
  const totalActualOnboarded = summaryRow.totalOnboarded
  const totalResignations = summaryRow.totalResigned
  const netGrowth = totalActualOnboarded - totalResignations
  const completionRate =
    totalPlannedRecruitment > 0
      ? parseFloat(((totalActualOnboarded / totalPlannedRecruitment) * 100).toFixed(1))
      : 0

  return (
    <div style={{ padding: 24 }}>
      {/* 关键指标卡片 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title="计划招聘总人数"
              value={totalPlannedRecruitment}
              suffix="人"
              prefix={<UserAddOutlined style={{ color: '#1890ff' }} />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="实际入职总人数"
              value={totalActualOnboarded}
              suffix="人"
              prefix={<TeamOutlined style={{ color: '#52c41a' }} />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="离职总人数"
              value={totalResignations}
              suffix="人"
              prefix={<UserDeleteOutlined style={{ color: '#f5222d' }} />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="净增长人数"
              value={netGrowth}
              suffix="人"
              prefix={<TeamOutlined style={{ color: netGrowth >= 0 ? '#52c41a' : '#f5222d' }} />}
            />
          </Col>
        </Row>
        <Row gutter={16} style={{ marginTop: 16 }}>
          <Col span={6}>
            <Statistic
              title="招聘完成率"
              value={completionRate}
              suffix="%"
              precision={1}
              prefix={<TeamOutlined style={{ color: '#722ed1' }} />}
            />
          </Col>
        </Row>
      </Card>

      {/* 数据表格 */}
      <Card
        title={`13最高议事厅教化司招聘计划与总结表 - ${selectedYear}年`}
        extra={
          <Space>
            <Select
              value={selectedYear}
              onChange={setSelectedYear}
              options={yearOptions}
              style={{ width: 100 }}
            />
            <Input.Search
              placeholder="搜索神殿"
              onSearch={handleSearch}
              style={{ width: 200 }}
              allowClear
            />
            <Button icon={<ReloadOutlined />} onClick={() => loadData()}>
              刷新
            </Button>
            <Button icon={<DownloadOutlined />} onClick={handleExport}>
              导出
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={dataSourceWithSummary}
          pagination={false}
          bordered
          scroll={{ x: 'max-content' }}
          rowClassName={(record) => (record.key === 'total' ? 'summary-row' : '')}
        />
        <style>{`
          .summary-row {
            background-color: #f0f9ff !important;
            font-weight: bold;
          }
          .summary-row td {
            background-color: #f0f9ff !important;
          }
        `}</style>
      </Card>
    </div>
  )
}

export default memo(RecruitmentPlanSummaryTable)
