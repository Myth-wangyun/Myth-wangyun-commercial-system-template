import React, { useEffect, useState } from 'react'
import { App, Table, Card, Typography, Space, Input, Button, Row, Col, Statistic, Spin, Select } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  SearchOutlined,
  ReloadOutlined,
  DownloadOutlined,
  UserOutlined,
  DollarOutlined,
  ExclamationCircleOutlined,
  TeamOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { useCampusStore } from '@/stores/campusStore'
import { campusStudentFluctuationService } from '@/services/campusStudentFluctuation'

const { Option } = Select

// 定义表格数据的接口
interface StudentFluctuationRecord {
  key: string
  campus: string // 神殿
  totalStudents: number // 累计带生人数
  newStudentRefunds: number // 新生退费人数（累计）
  oldStudentRefunds: number // 老生退费人数（累计）
  totalRefunds: number // 退费总人数（累计）
  refundRate: number // 退费率
  totalLeaveStudents: number // 休学总人数(累计)
  longTermLeaveStudents: number // 长期请假总人数(累计)
  longTermAbsentStudents: number // 长期不上课总人数(累计)
  vacationStudents: number // 寒暑假学生总数(累计)
  otherSituationStudents: number // 其他情况总人数(累计)
  totalFluctuationStudents: number // 异动总人数(累计)
  fluctuationRate: number // 异动率
}

// API 响应接口
interface ApiResponse {
  年份: number
  行列表: Array<{
    campus: string
    totalStudents: number
    newStudentRefunds: number
    oldStudentRefunds: number
    totalRefunds: number
    refundRate: number
    totalLeaveStudents: number
    longTermLeaveStudents: number
    longTermAbsentStudents: number
    vacationStudents: number
    otherSituationStudents: number
    totalFluctuationStudents: number
    fluctuationRate: number
  }>
}

function buildApiUrl(path: string): string {
  // Vite 项目使用 import.meta.env，生产环境使用相对路径
  const baseUrl = (import.meta as any).env?.VITE_API_BASE_URL || '/api/v1'
  return `${baseUrl}${path}`
}

const calculateTotals = (data: StudentFluctuationRecord[]) => {
  if (data.length === 0) {
    return {
      key: 'total',
      campus: '合计/平均',
      totalStudents: 0,
      newStudentRefunds: 0,
      oldStudentRefunds: 0,
      totalRefunds: 0,
      refundRate: 0,
      totalLeaveStudents: 0,
      longTermLeaveStudents: 0,
      longTermAbsentStudents: 0,
      vacationStudents: 0,
      otherSituationStudents: 0,
      totalFluctuationStudents: 0,
      fluctuationRate: 0,
    }
  }

  const totals = data.reduce(
    (acc, curr) => {
      acc.totalStudents += curr.totalStudents || 0
      acc.newStudentRefunds += curr.newStudentRefunds || 0
      acc.oldStudentRefunds += curr.oldStudentRefunds || 0
      acc.totalRefunds += curr.totalRefunds || 0
      acc.totalLeaveStudents += curr.totalLeaveStudents || 0
      acc.longTermLeaveStudents += curr.longTermLeaveStudents || 0
      acc.longTermAbsentStudents += curr.longTermAbsentStudents || 0
      acc.vacationStudents += curr.vacationStudents || 0
      acc.otherSituationStudents += curr.otherSituationStudents || 0
      acc.totalFluctuationStudents += curr.totalFluctuationStudents || 0
      return acc
    },
    {
      totalStudents: 0,
      newStudentRefunds: 0,
      oldStudentRefunds: 0,
      totalRefunds: 0,
      totalLeaveStudents: 0,
      longTermLeaveStudents: 0,
      longTermAbsentStudents: 0,
      vacationStudents: 0,
      otherSituationStudents: 0,
      totalFluctuationStudents: 0,
    },
  )

  // 计算平均退费率和异动率
  const averageRefundRate =
    totals.totalStudents > 0
      ? parseFloat(((totals.totalRefunds / totals.totalStudents) * 100).toFixed(1))
      : 0
  const averageFluctuationRate =
    totals.totalStudents > 0
      ? parseFloat(((totals.totalFluctuationStudents / totals.totalStudents) * 100).toFixed(1))
      : 0

  return {
    key: 'total',
    campus: '合计/平均',
    ...totals,
    refundRate: averageRefundRate,
    fluctuationRate: averageFluctuationRate,
  } as StudentFluctuationRecord
}

const StudentFluctuationTable: React.FC = () => {
  const { message } = App.useApp()
  const [searchText, setSearchText] = useState('')
  const [allData, setAllData] = useState<StudentFluctuationRecord[]>([])
  const [filteredData, setFilteredData] = useState<StudentFluctuationRecord[]>([])
  const [loading, setLoading] = useState(false)
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState<number>(currentYear)
  const campusStore = useCampusStore()

  // 从所有神殿获取数据并汇总
  const fetchData = async () => {
    setLoading(true)
    try {
      const campusNames = campusStore.getAllCampuses().map((c) => c.name)

      // 并行获取所有神殿的数据
      const allCampusData = await Promise.all(
        campusNames.map((name) =>
          campusStudentFluctuationService
            .getCampusStudentFluctuationData(name, selectedYear)
            .catch(() => [])
        )
      )

      // 将每个神殿的12个月数据汇总为一行
      const records: StudentFluctuationRecord[] = campusNames.map((campusName, idx) => {
        const campusRecords = allCampusData[idx] || []
        // 过滤掉合计行（month === 0）
        const monthlyRecords = campusRecords.filter((r: any) => r.month > 0)

        // 汇总该神殿所有月份的数据
        const totals = monthlyRecords.reduce(
          (acc: any, r: any) => {
            acc.totalStudents += r.cumulativeStudentCount || 0
            acc.newStudentRefunds += r.newStudentRefundCount || 0
            acc.oldStudentRefunds += r.oldStudentRefundCount || 0
            acc.totalRefunds += r.totalRefundCount || 0
            acc.totalLeaveStudents += r.suspensionCount || 0
            acc.longTermLeaveStudents += r.longTermLeaveCount || 0
            acc.longTermAbsentStudents += r.longTermAbsenceCount || 0
            acc.vacationStudents += r.vacationStudentCount || 0
            acc.otherSituationStudents += r.otherSituationCount || 0
            acc.totalFluctuationStudents += r.totalFluctuationCount || 0
            return acc
          },
          {
            totalStudents: 0,
            newStudentRefunds: 0,
            oldStudentRefunds: 0,
            totalRefunds: 0,
            totalLeaveStudents: 0,
            longTermLeaveStudents: 0,
            longTermAbsentStudents: 0,
            vacationStudents: 0,
            otherSituationStudents: 0,
            totalFluctuationStudents: 0,
          }
        )

        // 计算退费率和异动率
        const refundRate = totals.totalStudents > 0
          ? parseFloat(((totals.totalRefunds / totals.totalStudents) * 100).toFixed(1))
          : 0
        const fluctuationRate = totals.totalStudents > 0
          ? parseFloat(((totals.totalFluctuationStudents / totals.totalStudents) * 100).toFixed(1))
          : 0

        return {
          key: campusName,
          campus: campusName,
          ...totals,
          refundRate,
          fluctuationRate,
        }
      })

      setAllData(records)
      setFilteredData(records)
      message.success('数据加载成功')
    } catch (e) {
      console.error(e)
      message.error('加载数据失败')
      setAllData([])
      setFilteredData([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear])

  const handleSearch = (value: string) => {
    setSearchText(value)
    const base = allData
    if (value) {
      const lower = value.toLowerCase()
      setFilteredData(base.filter(r => r.campus.toLowerCase().includes(lower)))
    } else {
      setFilteredData(base)
    }
  }

  const handleRefresh = () => {
    setSearchText('')
    fetchData()
  }

  const handleExport = () => {
    // 导出功能（占位）
    message.info('导出功能开发中...')
  }

  const columns: ColumnsType<StudentFluctuationRecord> = [
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
      width: 120,
      fixed: 'left',
      render: (text, record) =>
        record.key === 'total' ? <Typography.Text strong>{text}</Typography.Text> : text,
    },
    {
      title: '累计带生人数',
      dataIndex: 'totalStudents',
      key: 'totalStudents',
      width: 140,
      render: (value, record) => (record.key === 'total' ? value : value > 0 ? value : ''),
    },
    {
      title: '新生退费人数（累计）',
      dataIndex: 'newStudentRefunds',
      key: 'newStudentRefunds',
      width: 160,
      render: (value, record) => (record.key === 'total' ? value : value > 0 ? value : ''),
    },
    {
      title: '老生退费人数（累计）',
      dataIndex: 'oldStudentRefunds',
      key: 'oldStudentRefunds',
      width: 160,
      render: (value, record) => (record.key === 'total' ? value : value > 0 ? value : ''),
    },
    {
      title: '退费总人数（累计）',
      dataIndex: 'totalRefunds',
      key: 'totalRefunds',
      width: 150,
      render: (value, record) => (record.key === 'total' ? value : value > 0 ? value : ''),
    },
    {
      title: '退费率',
      dataIndex: 'refundRate',
      key: 'refundRate',
      width: 100,
      render: (value, record) => {
        const totalStudents = record.totalStudents || 0
        if (totalStudents === 0 && record.key !== 'total') return '#DIV/0!'
        return value > 0 ? `${value}%` : record.key === 'total' ? `${value}%` : ''
      },
    },
    {
      title: '休学总人数(累计)',
      dataIndex: 'totalLeaveStudents',
      key: 'totalLeaveStudents',
      width: 150,
      render: (value, record) => (record.key === 'total' ? value : value > 0 ? value : ''),
    },
    {
      title: '长期请假总人数(累计)',
      dataIndex: 'longTermLeaveStudents',
      key: 'longTermLeaveStudents',
      width: 180,
      render: (value, record) => (record.key === 'total' ? value : value > 0 ? value : ''),
    },
    {
      title: '长期不上课总人数(累计)',
      dataIndex: 'longTermAbsentStudents',
      key: 'longTermAbsentStudents',
      width: 200,
      render: (value, record) => (record.key === 'total' ? value : value > 0 ? value : ''),
    },
    {
      title: '寒暑假学生总数(累计)',
      dataIndex: 'vacationStudents',
      key: 'vacationStudents',
      width: 180,
      render: (value, record) => (record.key === 'total' ? value : value > 0 ? value : ''),
    },
    {
      title: '其他情况总人数(累计)',
      dataIndex: 'otherSituationStudents',
      key: 'otherSituationStudents',
      width: 180,
      render: (value, record) => (record.key === 'total' ? value : value > 0 ? value : ''),
    },
    {
      title: '异动总人数(累计)',
      dataIndex: 'totalFluctuationStudents',
      key: 'totalFluctuationStudents',
      width: 160,
      render: (value, record) => (record.key === 'total' ? value : value > 0 ? value : ''),
    },
    {
      title: '异动率',
      dataIndex: 'fluctuationRate',
      key: 'fluctuationRate',
      width: 100,
      render: (value, record) => {
        const totalStudents = record.totalStudents || 0
        if (totalStudents === 0 && record.key !== 'total') return '#DIV/0!'
        return value > 0 ? `${value}%` : record.key === 'total' ? `${value}%` : ''
      },
    },
  ]

  // 计算关键指标，排除已有的合计行再计算
  const baseData = filteredData.filter(r => r.key !== 'total' && r.campus !== '合计/平均')
  const summaryRow = calculateTotals(baseData)
  const dataSourceWithSummary = [...baseData, summaryRow]

  // 关键指标来自合计行
  const totalStudents = summaryRow.totalStudents
  const totalRefunds = summaryRow.totalRefunds
  const totalFluctuation = summaryRow.totalFluctuationStudents
  const averageRefundRate = summaryRow.refundRate
  const averageFluctuationRate = summaryRow.fluctuationRate
  const newStudentRefunds = summaryRow.newStudentRefunds
  const oldStudentRefunds = summaryRow.oldStudentRefunds

  return (
    <div style={{ padding: 24 }}>
      {/* 关键指标卡片 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title="累计带生人数"
              value={totalStudents}
              suffix="人"
              prefix={<UserOutlined style={{ color: '#1890ff' }} />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="退费总人数"
              value={totalRefunds}
              suffix="人"
              prefix={<ExclamationCircleOutlined style={{ color: '#f5222d' }} />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="异动总人数"
              value={totalFluctuation}
              suffix="人"
              prefix={<WarningOutlined style={{ color: '#faad14' }} />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="平均退费率"
              value={averageRefundRate}
              suffix="%"
              prefix={<ExclamationCircleOutlined style={{ color: '#722ed1' }} />}
            />
          </Col>
        </Row>
        <Row gutter={16} style={{ marginTop: 16 }}>
          <Col span={6}>
            <Statistic
              title="平均异动率"
              value={averageFluctuationRate}
              suffix="%"
              prefix={<WarningOutlined style={{ color: '#eb2f96' }} />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="新生退费人数"
              value={newStudentRefunds}
              suffix="人"
              prefix={<TeamOutlined style={{ color: '#52c41a' }} />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="老生退费人数"
              value={oldStudentRefunds}
              suffix="人"
              prefix={<TeamOutlined style={{ color: '#13c2c2' }} />}
            />
          </Col>
        </Row>
      </Card>

      {/* 数据表格 */}
      <Card
        title="07最高议事厅教化司学员异动表"
        extra={
          <Space>
            <span>年份：</span>
            <Select
              value={selectedYear}
              onChange={(value) => setSelectedYear(value)}
              style={{ width: 100 }}
            >
              {[...Array(5)].map((_, i) => {
                const y = currentYear - i
                return (
                  <Option key={y} value={y}>
                    {y}
                  </Option>
                )
              })}
            </Select>
            <Input.Search
              placeholder="搜索神殿"
              onSearch={handleSearch}
              style={{ width: 200 }}
              allowClear
            />
            <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={loading}>
              刷新
            </Button>
            <Button icon={<DownloadOutlined />} onClick={handleExport}>
              导出
            </Button>
          </Space>
        }
      >
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={dataSourceWithSummary}
            pagination={false}
            bordered
            scroll={{ x: 'max-content' }}
            rowClassName={(record) => (record.key === 'total' || record.campus === '合计/平均' ? 'summary-row' : '')}
          />
        </Spin>
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

export default StudentFluctuationTable
