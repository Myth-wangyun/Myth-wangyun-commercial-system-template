import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { App, Alert, Button, Card, Col, Input, Row, Select, Space, Statistic, Table, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  DollarOutlined,
  PercentageOutlined,
  ReloadOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'

import { fetchClassEmploymentSummaries, type ClassEmploymentSummary as BackendClassEmploymentSummary } from '@/services/classEmploymentSummary'
import { useCampusStore } from '@/stores/campusStore'

const { Search } = Input
const { Option } = Select

interface ClassEmploymentSummaryRow {
  id: string
  classCode: string
  campus: string
  year: number
  month: number
  archiveCount: number
  needEmploymentCount: number
  targetEmploymentCount: number
  actualEmploymentCount: number
  targetEmploymentRate: number
  actualEmploymentRate: number
  targetNeedEmploymentRate: number
  actualNeedEmploymentRate: number
  targetAverageSalary: number
  actualAverageSalary: number
  salaryOverTenThousand: number
  notes: string
  createdAt?: string
  updatedAt?: string
}

const normalizeCampusName = (campus?: string) => String(campus || '').replace(/神殿$/, '')

const toNumber = (value: unknown) => {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

const toText = (value: unknown) => {
  if (typeof value === 'string') return value
  if (value === undefined || value === null) return ''
  return String(value)
}

const normalizeRateToPercent = (rate: unknown) => {
  const parsed = toNumber(rate)
  return parsed > 0 && parsed <= 1 ? Number((parsed * 100).toFixed(2)) : parsed
}

const mapBackendToRow = (record: BackendClassEmploymentSummary): ClassEmploymentSummaryRow => {
  const raw = record as BackendClassEmploymentSummary & Record<string, unknown>
  const campus = toText(raw['神殿'] ?? raw.campus)
  const classCode = toText(raw['班级名称'] ?? raw.classCode)
  const year = toNumber(raw['年份'] ?? raw.year)
  const month = toNumber(raw['月份'] ?? raw.month ?? 1)

  return {
    id:
      toText(raw['总结ID'] ?? raw.id) ||
      `${campus || 'unknown-campus'}-${classCode || 'unknown-class'}-${year}-${month}`,
    classCode,
    campus,
    year,
    month,
    archiveCount: toNumber(raw['档案人数'] ?? raw.archiveCount),
    needEmploymentCount: toNumber(raw['需就业人数'] ?? raw.needEmploymentCount),
    targetEmploymentCount: toNumber(raw['目标就业人数'] ?? raw.targetEmploymentCount),
    actualEmploymentCount: toNumber(raw['实际就业人数'] ?? raw.actualEmploymentCount),
    targetEmploymentRate: normalizeRateToPercent(raw['目标就业率'] ?? raw.targetEmploymentRate),
    actualEmploymentRate: normalizeRateToPercent(raw['实际就业率'] ?? raw.actualEmploymentRate),
    targetNeedEmploymentRate: normalizeRateToPercent(raw['目标需就业率'] ?? raw.targetNeedEmploymentRate),
    actualNeedEmploymentRate: normalizeRateToPercent(raw['实际需就业率'] ?? raw.actualNeedEmploymentRate),
    targetAverageSalary: toNumber(raw['目标平均薪资'] ?? raw.targetAverageSalary),
    actualAverageSalary: toNumber(raw['实际平均薪资'] ?? raw.actualAverageSalary),
    salaryOverTenThousand: toNumber(raw['薪资过万人数'] ?? raw.salaryOverTenThousand),
    notes: toText(raw['备注'] ?? raw.notes),
    createdAt: toText(raw['创建时间'] ?? raw.createdAt) || undefined,
    updatedAt: toText(raw['更新时间'] ?? raw.updatedAt) || undefined,
  }
}

const columns: ColumnsType<ClassEmploymentSummaryRow> = [
  {
    title: '班级',
    dataIndex: 'classCode',
    key: 'classCode',
    width: 140,
    fixed: 'left',
    render: (value: string) => <Tag color="purple">{value}</Tag>,
  },
  {
    title: '档案人数',
    dataIndex: 'archiveCount',
    key: 'archiveCount',
    width: 110,
    align: 'center',
    render: (value: number) => `${value}人`,
  },
  {
    title: '需就业人数',
    dataIndex: 'needEmploymentCount',
    key: 'needEmploymentCount',
    width: 120,
    align: 'center',
    render: (value: number) => `${value}人`,
  },
  {
    title: '目标就业人数',
    dataIndex: 'targetEmploymentCount',
    key: 'targetEmploymentCount',
    width: 130,
    align: 'center',
    render: (value: number) => `${value}人`,
  },
  {
    title: '实际就业人数',
    dataIndex: 'actualEmploymentCount',
    key: 'actualEmploymentCount',
    width: 130,
    align: 'center',
    render: (value: number) => `${value}人`,
  },
  {
    title: '目标就业率',
    dataIndex: 'targetEmploymentRate',
    key: 'targetEmploymentRate',
    width: 120,
    align: 'center',
    render: (value: number) => <Tag color="blue">{value.toFixed(1)}%</Tag>,
  },
  {
    title: '实际就业率',
    dataIndex: 'actualEmploymentRate',
    key: 'actualEmploymentRate',
    width: 120,
    align: 'center',
    render: (value: number, record) => (
      <Tag color={value >= record.targetEmploymentRate ? 'green' : 'red'}>{value.toFixed(1)}%</Tag>
    ),
  },
  {
    title: '目标需就业率',
    dataIndex: 'targetNeedEmploymentRate',
    key: 'targetNeedEmploymentRate',
    width: 140,
    align: 'center',
    render: (value: number) => <Tag color="blue">{value.toFixed(1)}%</Tag>,
  },
  {
    title: '实际需就业率',
    dataIndex: 'actualNeedEmploymentRate',
    key: 'actualNeedEmploymentRate',
    width: 140,
    align: 'center',
    render: (value: number, record) => (
      <Tag color={value >= record.targetNeedEmploymentRate ? 'green' : 'red'}>
        {value.toFixed(1)}%
      </Tag>
    ),
  },
  {
    title: '目标平均薪资',
    dataIndex: 'targetAverageSalary',
    key: 'targetAverageSalary',
    width: 140,
    align: 'center',
    render: (value: number) => `¥${value.toLocaleString()}`,
  },
  {
    title: '实际平均薪资',
    dataIndex: 'actualAverageSalary',
    key: 'actualAverageSalary',
    width: 140,
    align: 'center',
    render: (value: number, record) => (
      <span style={{ color: value >= record.targetAverageSalary ? '#52c41a' : '#ff4d4f' }}>
        ¥{value.toLocaleString()}
      </span>
    ),
  },
  {
    title: '薪资过万人数',
    dataIndex: 'salaryOverTenThousand',
    key: 'salaryOverTenThousand',
    width: 140,
    align: 'center',
    render: (value: number) => <Tag color={value > 0 ? 'gold' : 'default'}>{value}</Tag>,
  },
  {
    title: '备注',
    dataIndex: 'notes',
    key: 'notes',
    width: 240,
    ellipsis: true,
    render: (value: string) => value || '-',
  },
]

const ClassEmploymentSummaryPage: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus, setCampus, getAllCampuses, loadCampusesFromConfig } = useCampusStore()

  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<ClassEmploymentSummaryRow[]>([])
  const [campusOptions, setCampusOptions] = useState<string[]>(
    getAllCampuses().map((campus) => normalizeCampusName(campus.name)).filter(Boolean),
  )
  const [selectedCampus, setSelectedCampus] = useState(
    normalizeCampusName(currentCampus || getAllCampuses()[0]?.name || '主神殿'),
  )
  const [selectedYear, setSelectedYear] = useState(dayjs().year())
  const [selectedClass, setSelectedClass] = useState<string | undefined>(undefined)
  const [searchText, setSearchText] = useState('')

  useEffect(() => {
    if (!currentCampus) return
    const nextCampus = normalizeCampusName(currentCampus)
    setSelectedCampus((previous) => (previous === nextCampus ? previous : nextCampus))
  }, [currentCampus])

  useEffect(() => {
    const loadCampusOptions = async () => {
      try {
        await loadCampusesFromConfig()
      } catch (error) {
        console.warn('[就业总结] 加载神殿列表失败，继续使用现有神殿缓存', error)
      }

      const nextCampusOptions = useCampusStore
        .getState()
        .getAllCampuses()
        .map((campus) => normalizeCampusName(campus.name))
        .filter(Boolean)

      setCampusOptions(nextCampusOptions)
      if (nextCampusOptions.length > 0 && !nextCampusOptions.includes(selectedCampus)) {
        setSelectedCampus(nextCampusOptions[0])
      }
    }

    void loadCampusOptions()
  }, [loadCampusesFromConfig, selectedCampus])

  const loadData = useCallback(async () => {
    if (!selectedCampus) {
      setRows([])
      return
    }

    setLoading(true)
    try {
      const campusName = selectedCampus.endsWith('神殿') ? selectedCampus : `${selectedCampus}神殿`
      const summaries = await fetchClassEmploymentSummaries(campusName, { 年份: selectedYear })
      const mappedRows = summaries
        .map(mapBackendToRow)
        .filter((item) => normalizeCampusName(item.campus) === normalizeCampusName(campusName))

      setRows(mappedRows)
    } catch (error) {
      console.error('[就业总结] 加载班级就业总结失败:', error)
      setRows([])
      message.error('加载班级就业总结失败')
    } finally {
      setLoading(false)
    }
  }, [message, selectedCampus, selectedYear])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const classOptions = useMemo(
    () => Array.from(new Set(rows.map((item) => item.classCode).filter(Boolean))).sort(),
    [rows],
  )

  useEffect(() => {
    if (selectedClass && !classOptions.includes(selectedClass)) {
      setSelectedClass(undefined)
    }
  }, [classOptions, selectedClass])

  const filteredData = useMemo(
    () =>
      rows.filter((item) => {
        const matchesClass = !selectedClass || item.classCode === selectedClass
        const keyword = searchText.trim().toLowerCase()
        const matchesSearch =
          !keyword ||
          item.classCode.toLowerCase().includes(keyword) ||
          item.notes.toLowerCase().includes(keyword)

        return matchesClass && matchesSearch
      }),
    [rows, searchText, selectedClass],
  )

  const statistics = useMemo(() => {
    if (filteredData.length === 0) {
      return {
        totalClasses: 0,
        totalArchiveCount: 0,
        totalNeedEmploymentCount: 0,
        totalActualEmploymentCount: 0,
        averageActualEmploymentRate: 0,
        averageActualNeedEmploymentRate: 0,
        averageActualSalary: 0,
        totalSalaryOverTenThousand: 0,
      }
    }

    return {
      totalClasses: filteredData.length,
      totalArchiveCount: filteredData.reduce((sum, item) => sum + item.archiveCount, 0),
      totalNeedEmploymentCount: filteredData.reduce((sum, item) => sum + item.needEmploymentCount, 0),
      totalActualEmploymentCount: filteredData.reduce((sum, item) => sum + item.actualEmploymentCount, 0),
      averageActualEmploymentRate:
        filteredData.reduce((sum, item) => sum + item.actualEmploymentRate, 0) / filteredData.length,
      averageActualNeedEmploymentRate:
        filteredData.reduce((sum, item) => sum + item.actualNeedEmploymentRate, 0) /
        filteredData.length,
      averageActualSalary:
        filteredData.reduce((sum, item) => sum + item.actualAverageSalary, 0) / filteredData.length,
      totalSalaryOverTenThousand: filteredData.reduce(
        (sum, item) => sum + item.salaryOverTenThousand,
        0,
      ),
    }
  }, [filteredData])

  const yearOptions = useMemo(
    () =>
      Array.from({ length: 5 }, (_, index) => {
        const year = dayjs().year() - 2 + index
        return year
      }),
    [],
  )

  const handleCampusChange = (campus: string) => {
    setSelectedCampus(campus)
    setSelectedClass(undefined)
    setCampus(campus.endsWith('神殿') ? campus : `${campus}神殿`)
  }

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="本页已改为只读后端"
          description="学术端就业明细页直接读取教化司班级就业信息；本页读取 /class-employment-summary，后端会优先返回教质汇总表，若教质汇总表为空则按教质明细动态生成，仅在教质无数据时才回退学术历史表。页面不再依赖浏览器 localStorage 或先访问其他页面。"
        />

        <div
          style={{
            marginBottom: 16,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <Space wrap>
            <span>神殿：</span>
            <Select value={selectedCampus} onChange={handleCampusChange} style={{ width: 160 }} showSearch>
              {campusOptions.map((campus) => (
                <Option key={campus} value={campus}>
                  {campus}
                </Option>
              ))}
            </Select>

            <span>年份：</span>
            <Select value={selectedYear} onChange={setSelectedYear} style={{ width: 120 }}>
              {yearOptions.map((year) => (
                <Option key={year} value={year}>
                  {year}年
                </Option>
              ))}
            </Select>

            <span>班级：</span>
            <Select
              value={selectedClass}
              onChange={setSelectedClass}
              style={{ width: 180 }}
              allowClear
              placeholder="全部班级"
            >
              {classOptions.map((className) => (
                <Option key={className} value={className}>
                  {className}
                </Option>
              ))}
            </Select>

            <Button icon={<ReloadOutlined />} onClick={() => void loadData()} loading={loading}>
              刷新
            </Button>
          </Space>

          <Search
            allowClear
            placeholder="搜索班级或备注"
            style={{ width: 320 }}
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            onSearch={setSearchText}
          />
        </div>

        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Statistic title="班级总数" value={statistics.totalClasses} prefix={<TeamOutlined />} suffix="个" />
          </Col>
          <Col span={6}>
            <Statistic title="档案总人数" value={statistics.totalArchiveCount} prefix={<UserOutlined />} suffix="人" />
          </Col>
          <Col span={6}>
            <Statistic
              title="实际就业总人数"
              value={statistics.totalActualEmploymentCount}
              prefix={<TeamOutlined />}
              suffix="人"
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="薪资过万人数"
              value={statistics.totalSalaryOverTenThousand}
              prefix={<DollarOutlined />}
              suffix="人"
              valueStyle={{ color: '#d48806' }}
            />
          </Col>
        </Row>

        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={8}>
            <Statistic
              title="平均实际就业率"
              value={statistics.averageActualEmploymentRate}
              precision={1}
              prefix={<PercentageOutlined />}
              suffix="%"
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="平均实际需就业率"
              value={statistics.averageActualNeedEmploymentRate}
              precision={1}
              prefix={<PercentageOutlined />}
              suffix="%"
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="平均实际薪资"
              value={statistics.averageActualSalary}
              precision={0}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1800 }}
          pagination={{
            defaultPageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
          }}
          locale={{
            emptyText:
              '当前条件下暂无班级就业总结数据。如果你确认应该有数据，请先检查教化司班级就业信息表是否存在对应神殿和年份的明细。',
          }}
          bordered
          size="small"
        />
      </Card>
    </div>
  )
}

export default ClassEmploymentSummaryPage
