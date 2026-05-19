import React, { useEffect, useState } from 'react'
import { App, Table, Card, Typography, Space, Input, Button, Row, Col, Statistic, Select } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  ReloadOutlined,
  DownloadOutlined,
  UserOutlined,
  BookOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import { useCampusStore } from '@/stores/campusStore'
import { campusEnrollmentStatisticsService } from '@/services/teaching-quality/campusEnrollmentStatistics'

const { Option } = Select

// 定义表格数据的接口
interface StudentStatusRecord {
  key: string
  campus: string // 神殿
  // 中专层次
  vocational3YearRegistered: number // 中专3年学籍注册人数
  vocational1YearCount: number // 中专1年制人数
  vocationalOtherRegistered: number // 其他已注册人数
  vocationalTargetCount: number // 目标注册人数
  vocationalTargetTime: string // 目标注册时间
  vocationalActualCount: number // 实际注册人数
  // 大学层次
  adultExamRegistered: number // 成考注册人数
  openUniversityRegistered: number // 国开注册人数
  universityOtherRegistered: number // 其他已注册人数
  universityTargetCount: number // 目标注册人数
  universityTargetTime: string // 目标注册时间
  universityActualCount: number // 实际注册人数
}

// API 响应
interface ApiResponse {
  年份: number
  行列表: Array<{
    campus: string
    vocational3YearRegistered: number
    vocational1YearCount: number
    vocationalOtherRegistered: number
    vocationalTargetCount: number
    vocationalTargetTime: string
    vocationalActualCount: number
    adultExamRegistered: number
    openUniversityRegistered: number
    universityOtherRegistered: number
    universityTargetCount: number
    universityTargetTime: string
    universityActualCount: number
  }>
}

const calculateTotals = (data: StudentStatusRecord[]) => {
  if (data.length === 0) {
    return {
      key: 'total',
      campus: '合计',
      vocational3YearRegistered: 0,
      vocational1YearCount: 0,
      vocationalOtherRegistered: 0,
      vocationalTargetCount: 0,
      vocationalTargetTime: '',
      vocationalActualCount: 0,
      adultExamRegistered: 0,
      openUniversityRegistered: 0,
      universityOtherRegistered: 0,
      universityTargetCount: 0,
      universityTargetTime: '',
      universityActualCount: 0,
    }
  }

  const totals = data.reduce(
    (acc, curr) => {
      acc.vocational3YearRegistered += curr.vocational3YearRegistered
      acc.vocational1YearCount += curr.vocational1YearCount
      acc.vocationalOtherRegistered += curr.vocationalOtherRegistered
      acc.vocationalTargetCount += curr.vocationalTargetCount
      acc.vocationalActualCount += curr.vocationalActualCount
      acc.adultExamRegistered += curr.adultExamRegistered
      acc.openUniversityRegistered += curr.openUniversityRegistered
      acc.universityOtherRegistered += curr.universityOtherRegistered
      acc.universityTargetCount += curr.universityTargetCount
      acc.universityActualCount += curr.universityActualCount
      return acc
    },
    {
      vocational3YearRegistered: 0,
      vocational1YearCount: 0,
      vocationalOtherRegistered: 0,
      vocationalTargetCount: 0,
      vocationalActualCount: 0,
      adultExamRegistered: 0,
      openUniversityRegistered: 0,
      universityOtherRegistered: 0,
      universityTargetCount: 0,
      universityActualCount: 0,
    },
  )

  return {
    key: 'total',
    campus: '合计',
    ...totals,
    vocationalTargetTime: '',
    universityTargetTime: '',
  }
}

const StudentStatusTable: React.FC = () => {
  const { message } = App.useApp()
  const [searchText, setSearchText] = useState('')
  const [allData, setAllData] = useState<StudentStatusRecord[]>([])
  const [filteredData, setFilteredData] = useState<StudentStatusRecord[]>([])
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
          campusEnrollmentStatisticsService
            .getCampusEnrollmentStatisticsData(name, selectedYear)
            .catch(() => [])
        )
      )

      // 将每个神殿的数据汇总为一行
      const merged: StudentStatusRecord[] = campusNames.map((campusName, idx) => {
        const campusRecords = allCampusData[idx] || []
        // 过滤掉合计行（isTotal === true）
        const monthlyRecords = campusRecords.filter((r: any) => !r.isTotal && r.month > 0)

        // 汇总该神殿所有月份的数据
        const totals = monthlyRecords.reduce(
          (acc: any, r: any) => {
            acc.vocational3YearRegistered += r.vocational3YearRegistered || 0
            acc.vocational1YearCount += r.vocational1YearRegistered || 0
            acc.vocationalOtherRegistered += r.vocationalOtherRegistered || 0
            acc.vocationalTargetCount += r.vocationalTargetCount || 0
            acc.vocationalActualCount += r.vocationalActualRegistered || 0
            acc.adultExamRegistered += r.adultExamRegistered || 0
            acc.openUniversityRegistered += r.openUniversityRegistered || 0
            acc.universityOtherRegistered += r.universityOtherRegistered || 0
            acc.universityTargetCount += r.universityTargetCount || 0
            acc.universityActualCount += r.universityActualRegistered || 0
            return acc
          },
          {
            vocational3YearRegistered: 0,
            vocational1YearCount: 0,
            vocationalOtherRegistered: 0,
            vocationalTargetCount: 0,
            vocationalActualCount: 0,
            adultExamRegistered: 0,
            openUniversityRegistered: 0,
            universityOtherRegistered: 0,
            universityTargetCount: 0,
            universityActualCount: 0,
          }
        )

        return {
          key: campusName,
          campus: campusName,
          ...totals,
          vocationalTargetTime: '',
          universityTargetTime: '',
        }
      })

      setAllData(merged)
      setFilteredData(merged)
      message.success('数据加载成功')
    } catch (e) {
      console.error(e)
      message.error('加载学籍统计数据失败')
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
      const lowercasedValue = value.toLowerCase()
      const filtered = base.filter((record) => record.campus.toLowerCase().includes(lowercasedValue))
      setFilteredData(filtered)
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
    console.log('导出数据')
  }

  const columns: ColumnsType<StudentStatusRecord> = [
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
      title: '中专层次',
      children: [
        {
          title: '中专3年学籍注册人数',
          dataIndex: 'vocational3YearRegistered',
          key: 'vocational3YearRegistered',
          width: 180,
          render: (value, record) => {
            if (record.key === 'total') return value
            return value > 0 ? value : ''
          },
        },
        {
          title: '中专1年制人数',
          dataIndex: 'vocational1YearCount',
          key: 'vocational1YearCount',
          width: 140,
          render: (value, record) => {
            if (record.key === 'total') return value
            return value > 0 ? value : ''
          },
        },
        {
          title: '其他已注册人数',
          dataIndex: 'vocationalOtherRegistered',
          key: 'vocationalOtherRegistered',
          width: 150,
          render: (value, record) => {
            if (record.key === 'total') return value
            return value > 0 ? value : ''
          },
        },
        {
          title: '目标注册人数',
          dataIndex: 'vocationalTargetCount',
          key: 'vocationalTargetCount',
          width: 140,
          render: (value, record) => {
            if (record.key === 'total') return value
            return value > 0 ? value : ''
          },
        },
        {
          title: '目标注册时间',
          dataIndex: 'vocationalTargetTime',
          key: 'vocationalTargetTime',
          width: 140,
          render: (text) => text || '',
        },
        {
          title: '实际注册人数',
          dataIndex: 'vocationalActualCount',
          key: 'vocationalActualCount',
          width: 140,
          render: (value, record) => {
            if (record.key === 'total') return value
            return value > 0 ? value : ''
          },
        },
      ],
    },
    {
      title: '大学层次',
      children: [
        {
          title: '成考注册人数',
          dataIndex: 'adultExamRegistered',
          key: 'adultExamRegistered',
          width: 140,
          render: (value, record) => {
            if (record.key === 'total') return value
            return value > 0 ? value : ''
          },
        },
        {
          title: '国开注册人数',
          dataIndex: 'openUniversityRegistered',
          key: 'openUniversityRegistered',
          width: 140,
          render: (value, record) => {
            if (record.key === 'total') return value
            return value > 0 ? value : ''
          },
        },
        {
          title: '其他已注册人数',
          dataIndex: 'universityOtherRegistered',
          key: 'universityOtherRegistered',
          width: 150,
          render: (value, record) => {
            if (record.key === 'total') return value
            return value > 0 ? value : ''
          },
        },
        {
          title: '目标注册人数',
          dataIndex: 'universityTargetCount',
          key: 'universityTargetCount',
          width: 140,
          render: (value, record) => {
            if (record.key === 'total') return value
            return value > 0 ? value : ''
          },
        },
        {
          title: '目标注册时间',
          dataIndex: 'universityTargetTime',
          key: 'universityTargetTime',
          width: 140,
          render: (text) => text || '',
        },
        {
          title: '实际注册人数',
          dataIndex: 'universityActualCount',
          key: 'universityActualCount',
          width: 140,
          render: (value, record) => {
            if (record.key === 'total') return value
            return value > 0 ? value : ''
          },
        },
      ],
    },
  ]

  const summaryRow = calculateTotals(filteredData)
  const dataSourceWithSummary = [...filteredData, summaryRow]

  // 计算关键指标
  const totalVocational3Year = summaryRow.vocational3YearRegistered
  const totalVocational1Year = summaryRow.vocational1YearCount
  const totalVocationalOther = summaryRow.vocationalOtherRegistered
  const totalVocationalActual = summaryRow.vocationalActualCount
  const totalAdultExam = summaryRow.adultExamRegistered
  const totalOpenUniversity = summaryRow.openUniversityRegistered
  const totalUniversityOther = summaryRow.universityOtherRegistered
  const totalUniversityActual = summaryRow.universityActualCount

  return (
    <div style={{ padding: 24 }}>
      {/* 关键指标卡片 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title="中专3年学籍注册总数"
              value={totalVocational3Year}
              suffix="人"
              prefix={<BookOutlined style={{ color: '#1890ff' }} />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="中专1年制总人数"
              value={totalVocational1Year}
              suffix="人"
              prefix={<BookOutlined style={{ color: '#52c41a' }} />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="中专实际注册总数"
              value={totalVocationalActual}
              suffix="人"
              prefix={<UserOutlined style={{ color: '#faad14' }} />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="中专其他已注册"
              value={totalVocationalOther}
              suffix="人"
              prefix={<TeamOutlined style={{ color: '#722ed1' }} />}
            />
          </Col>
        </Row>
        <Row gutter={16} style={{ marginTop: 16 }}>
          <Col span={6}>
            <Statistic
              title="成考注册总人数"
              value={totalAdultExam}
              suffix="人"
              prefix={<BookOutlined style={{ color: '#13c2c2' }} />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="国开注册总人数"
              value={totalOpenUniversity}
              suffix="人"
              prefix={<BookOutlined style={{ color: '#eb2f96' }} />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="大学实际注册总数"
              value={totalUniversityActual}
              suffix="人"
              prefix={<UserOutlined style={{ color: '#f5222d' }} />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="大学其他已注册"
              value={totalUniversityOther}
              suffix="人"
              prefix={<TeamOutlined style={{ color: '#fa8c16' }} />}
            />
          </Col>
        </Row>
      </Card>

      {/* 数据表格 */}
      <Card
        title="09最高议事厅教化司学籍统计表"
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

export default StudentStatusTable
