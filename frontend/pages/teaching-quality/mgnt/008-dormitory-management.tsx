import React, { useEffect, useState, useMemo, useCallback, startTransition } from 'react'
import { App, Table, Card, Typography, Space, Input, Button, Row, Col, Statistic, Spin, Select } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  ReloadOutlined,
  DownloadOutlined,
  UserOutlined,
  HomeOutlined,
  TeamOutlined,
  ManOutlined,
  WomanOutlined,
} from '@ant-design/icons'
import { useCampusStore } from '@/stores/campusStore'
import { campusDormitoryService } from '@/services/campusDormitory'

const { Option } = Select

// 固定图标元素，避免每次渲染创建新元素和style对象
const icons = {
  userBlue: <UserOutlined style={{ color: '#1890ff' }} />,
  homeGreen: <HomeOutlined style={{ color: '#52c41a' }} />,
  teamYellow: <TeamOutlined style={{ color: '#faad14' }} />,
  homePurple: <HomeOutlined style={{ color: '#722ed1' }} />,
  manCyan: <ManOutlined style={{ color: '#13c2c2' }} />,
  womanPink: <WomanOutlined style={{ color: '#eb2f96' }} />,
  homeRed: <HomeOutlined style={{ color: '#f5222d' }} />,
  homeBlue: <HomeOutlined style={{ color: '#1890ff' }} />,
}

// 定义表格数据的接口
interface DormitoryManagementRecord {
  key: string
  campus: string // 神殿
  totalStudents: number // 在校生总人数
  totalDormitories: number // 宿舍总数量
  totalResidents: number // 住宿总人数
  occupancyRate: number // 住宿率
  // 男宿情况
  maleDormitories: number // 男宿总数量
  maleResidents: number // 男宿总人数
  maleVacantBeds: number // 男宿空床位总数量
  maleNewStudentBeds: number // 适合男新生床位数
  // 女宿情况
  femaleDormitories: number // 女宿总数量
  femaleResidents: number // 女宿总人数
  femaleVacantBeds: number // 女宿空床位总数量
  femaleNewStudentBeds: number // 适合女新生住宿床位
  // 租宿舍
  plannedRentDormitories: number // 计划租宿舍数量
  actualRentDormitories: number // 实际租宿舍数量
  // 退宿舍
  plannedReturnDormitories: number // 计划退宿舍数量
  actualReturnDormitories: number // 实际退宿舍数量
  remarks: string // 备注
}

// API 响应接口
interface ApiResponse {
  年份: number
  行列表: Array<{
    campus: string
    totalStudents: number
    totalDormitories: number
    totalResidents: number
    occupancyRate: number
    maleDormitories: number
    maleResidents: number
    maleVacantBeds: number
    maleNewStudentBeds: number
    femaleDormitories: number
    femaleResidents: number
    femaleVacantBeds: number
    femaleNewStudentBeds: number
    plannedRentDormitories: number
    actualRentDormitories: number
    plannedReturnDormitories: number
    actualReturnDormitories: number
    remarks: string
  }>
}

// 提取为常量，避免每次渲染创建新对象
const EMPTY_TOTALS = {
  key: 'total',
  campus: '合计/平均',
  totalStudents: 0,
  totalDormitories: 0,
  totalResidents: 0,
  occupancyRate: 0,
  maleDormitories: 0,
  maleResidents: 0,
  maleVacantBeds: 0,
  maleNewStudentBeds: 0,
  femaleDormitories: 0,
  femaleResidents: 0,
  femaleVacantBeds: 0,
  femaleNewStudentBeds: 0,
  plannedRentDormitories: 0,
  actualRentDormitories: 0,
  plannedReturnDormitories: 0,
  actualReturnDormitories: 0,
  remarks: '',
} as DormitoryManagementRecord

const calculateTotals = (data: DormitoryManagementRecord[]) => {
  if (data.length === 0) {
    return EMPTY_TOTALS
  }

  const totals = data.reduce(
    (acc, curr) => {
      acc.totalStudents += curr.totalStudents || 0
      acc.totalDormitories += curr.totalDormitories || 0
      acc.totalResidents += curr.totalResidents || 0
      acc.maleDormitories += curr.maleDormitories || 0
      acc.maleResidents += curr.maleResidents || 0
      acc.maleVacantBeds += curr.maleVacantBeds || 0
      acc.maleNewStudentBeds += curr.maleNewStudentBeds || 0
      acc.femaleDormitories += curr.femaleDormitories || 0
      acc.femaleResidents += curr.femaleResidents || 0
      acc.femaleVacantBeds += curr.femaleVacantBeds || 0
      acc.femaleNewStudentBeds += curr.femaleNewStudentBeds || 0
      acc.plannedRentDormitories += curr.plannedRentDormitories || 0
      acc.actualRentDormitories += curr.actualRentDormitories || 0
      acc.plannedReturnDormitories += curr.plannedReturnDormitories || 0
      acc.actualReturnDormitories += curr.actualReturnDormitories || 0
      return acc
    },
    {
      totalStudents: 0,
      totalDormitories: 0,
      totalResidents: 0,
      maleDormitories: 0,
      maleResidents: 0,
      maleVacantBeds: 0,
      maleNewStudentBeds: 0,
      femaleDormitories: 0,
      femaleResidents: 0,
      femaleVacantBeds: 0,
      femaleNewStudentBeds: 0,
      plannedRentDormitories: 0,
      actualRentDormitories: 0,
      plannedReturnDormitories: 0,
      actualReturnDormitories: 0,
    },
  )

  // 计算平均住宿率（按总人数口径）
  const averageOccupancyRate =
    totals.totalStudents > 0
      ? parseFloat(((totals.totalResidents / totals.totalStudents) * 100).toFixed(1))
      : 0

  return {
    key: 'total',
    campus: '合计/平均',
    ...totals,
    occupancyRate: averageOccupancyRate,
    remarks: '',
  } as DormitoryManagementRecord
}

const DormitoryManagementTable: React.FC = () => {
  const { message } = App.useApp()
  const [searchText, setSearchText] = useState('')
  const [allData, setAllData] = useState<DormitoryManagementRecord[]>([])
  const [filteredData, setFilteredData] = useState<DormitoryManagementRecord[]>([])
  const [loading, setLoading] = useState(false)
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState<number>(currentYear)
  const campusStore = useCampusStore()

  // 从所有神殿获取数据并汇总
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const campusNames = campusStore.getAllCampuses().map((c) => c.name)

      // 并行获取所有神殿的数据
      const allCampusData = await Promise.all(
        campusNames.map((name) =>
          campusDormitoryService
            .getCampusDormitoryData(name, selectedYear)
            .catch(() => [])
        )
      )

      // 将每个神殿的12个月数据汇总为一行（每个神殿取年度累计）
      const records: DormitoryManagementRecord[] = campusNames.map((campusName, idx) => {
        const campusRecords = allCampusData[idx] || []
        // 过滤掉合计行（month === 0）
        const monthlyRecords = campusRecords.filter((r: any) => r.month > 0)

        // 汇总该神殿所有月份的数据
        const totals = monthlyRecords.reduce(
          (acc: any, r: any) => {
            acc.totalStudents += r.enrolledStudentCount || 0
            acc.totalDormitories += r.totalDormitoryCount || 0
            acc.totalResidents += r.totalResidentCount || 0
            acc.maleDormitories += r.maleDormitoryCount || 0
            acc.maleResidents += r.maleResidentCount || 0
            acc.maleVacantBeds += r.maleVacantBedCount || 0
            acc.maleNewStudentBeds += r.maleNewStudentBedCount || 0
            acc.femaleDormitories += r.femaleDormitoryCount || 0
            acc.femaleResidents += r.femaleResidentCount || 0
            acc.femaleVacantBeds += r.femaleVacantBedCount || 0
            acc.femaleNewStudentBeds += r.femaleNewStudentBedCount || 0
            acc.plannedRentDormitories += r.plannedRentCount || 0
            acc.actualRentDormitories += r.actualRentCount || 0
            acc.plannedReturnDormitories += r.plannedVacateCount || 0
            acc.actualReturnDormitories += r.actualVacateCount || 0
            return acc
          },
          {
            totalStudents: 0,
            totalDormitories: 0,
            totalResidents: 0,
            maleDormitories: 0,
            maleResidents: 0,
            maleVacantBeds: 0,
            maleNewStudentBeds: 0,
            femaleDormitories: 0,
            femaleResidents: 0,
            femaleVacantBeds: 0,
            femaleNewStudentBeds: 0,
            plannedRentDormitories: 0,
            actualRentDormitories: 0,
            plannedReturnDormitories: 0,
            actualReturnDormitories: 0,
          }
        )

        // 计算住宿率
        const occupancyRate = totals.totalStudents > 0
          ? parseFloat(((totals.totalResidents / totals.totalStudents) * 100).toFixed(1))
          : 0

        return {
          key: campusName,
          campus: campusName,
          ...totals,
          occupancyRate,
          remarks: '',
        }
      })

      setAllData(records)
      setFilteredData(records)
      message.success('数据加载成功')
    } catch (e) {
      console.error(e)
      message.error('加载宿舍统计数据失败')
      setAllData([])
      setFilteredData([])
    } finally {
      setLoading(false)
    }
  }, [selectedYear, campusStore])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSearch = useCallback((value: string) => {
    startTransition(() => {
      setSearchText(value)
      const base = allData
      if (value) {
        const lower = value.toLowerCase()
        setFilteredData(base.filter((r) => r.campus.toLowerCase().includes(lower)))
      } else {
        setFilteredData(base)
      }
    })
  }, [allData])

  const handleRefresh = useCallback(() => {
    setSearchText('')
    fetchData()
  }, [])

  const handleExport = useCallback(() => {
    // 导出功能（占位）
    message.info('导出功能开发中...')
  }, [])

  const columns: ColumnsType<DormitoryManagementRecord> = useMemo(() => [
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
      title: '在校生总人数',
      dataIndex: 'totalStudents',
      key: 'totalStudents',
      width: 140,
      render: (value, record) => (record.key === 'total' ? value : value || ''),
    },
    {
      title: '宿舍总数量',
      dataIndex: 'totalDormitories',
      key: 'totalDormitories',
      width: 120,
      render: (value, record) => (record.key === 'total' ? value : value || ''),
    },
    {
      title: '住宿总人数',
      dataIndex: 'totalResidents',
      key: 'totalResidents',
      width: 120,
      render: (value, record) => (record.key === 'total' ? value : value || ''),
    },
    {
      title: '住宿率',
      dataIndex: 'occupancyRate',
      key: 'occupancyRate',
      width: 100,
      render: (value, record) => (record.key === 'total' || value ? `${value}%` : ''),
    },
    {
      title: '男宿情况',
      children: [
        {
          title: '男宿总数量',
          dataIndex: 'maleDormitories',
          key: 'maleDormitories',
          width: 120,
          render: (value, record) => (record.key === 'total' ? value : value > 0 ? value : ''),
        },
        {
          title: '男宿总人数',
          dataIndex: 'maleResidents',
          key: 'maleResidents',
          width: 120,
          render: (value, record) => (record.key === 'total' ? value : value > 0 ? value : ''),
        },
        {
          title: '男宿空床位总数量',
          dataIndex: 'maleVacantBeds',
          key: 'maleVacantBeds',
          width: 160,
          render: (value, record) => (record.key === 'total' ? value : value > 0 ? value : ''),
        },
        {
          title: '适合男新生床位数',
          dataIndex: 'maleNewStudentBeds',
          key: 'maleNewStudentBeds',
          width: 150,
          render: (value, record) => (record.key === 'total' ? value : value > 0 ? value : ''),
        },
      ],
    },
    {
      title: '女宿情况',
      children: [
        {
          title: '女宿总数量',
          dataIndex: 'femaleDormitories',
          key: 'femaleDormitories',
          width: 120,
          render: (value, record) => (record.key === 'total' ? value : value > 0 ? value : ''),
        },
        {
          title: '女宿总人数',
          dataIndex: 'femaleResidents',
          key: 'femaleResidents',
          width: 120,
          render: (value, record) => (record.key === 'total' ? value : value > 0 ? value : ''),
        },
        {
          title: '女宿空床位总数量',
          dataIndex: 'femaleVacantBeds',
          key: 'femaleVacantBeds',
          width: 160,
          render: (value, record) => (record.key === 'total' ? value : value > 0 ? value : ''),
        },
        {
          title: '适合女新生住宿床位',
          dataIndex: 'femaleNewStudentBeds',
          key: 'femaleNewStudentBeds',
          width: 180,
          render: (value, record) => (record.key === 'total' ? value : value > 0 ? value : ''),
        },
      ],
    },
    {
      title: '租宿舍',
      children: [
        {
          title: '计划租宿舍数量',
          dataIndex: 'plannedRentDormitories',
          key: 'plannedRentDormitories',
          width: 150,
          render: (value, record) => (record.key === 'total' ? value : value > 0 ? value : ''),
        },
        {
          title: '实际租宿舍数量',
          dataIndex: 'actualRentDormitories',
          key: 'actualRentDormitories',
          width: 150,
          render: (value, record) => (record.key === 'total' ? value : value > 0 ? value : ''),
        },
      ],
    },
    {
      title: '退宿舍',
      children: [
        {
          title: '计划退宿舍数量',
          dataIndex: 'plannedReturnDormitories',
          key: 'plannedReturnDormitories',
          width: 150,
          render: (value, record) => (record.key === 'total' ? value : value > 0 ? value : ''),
        },
        {
          title: '实际退宿舍数量',
          dataIndex: 'actualReturnDormitories',
          key: 'actualReturnDormitories',
          width: 150,
          render: (value, record) => (record.key === 'total' ? value : value > 0 ? value : ''),
        },
      ],
    },
    {
      title: '备注',
      dataIndex: 'remarks',
      key: 'remarks',
      width: 150,
      render: (text) => text || '',
    },
  ], [])

  // 计算关键指标（排除后端可能返回的“合计/平均”行，统一用前端汇总）
  const baseData = useMemo(
    () => filteredData.filter((r) => r.key !== 'total' && r.campus !== '合计/平均'),
    [filteredData],
  )
  const summaryRow = useMemo(() => calculateTotals(baseData), [baseData])
  const dataSourceWithSummary = useMemo(() => [...baseData, summaryRow], [baseData, summaryRow])

  // 关键指标来自合计行 - 统一聚合
  const statisticsData = useMemo(
    () => ({
      totalStudents: summaryRow.totalStudents,
      totalDormitories: summaryRow.totalDormitories,
      totalResidents: summaryRow.totalResidents,
      averageOccupancyRate: summaryRow.occupancyRate,
      maleVacantBeds: summaryRow.maleVacantBeds,
      femaleVacantBeds: summaryRow.femaleVacantBeds,
      totalVacantBeds: summaryRow.maleVacantBeds + summaryRow.femaleVacantBeds,
      plannedRentDormitories: summaryRow.plannedRentDormitories,
      actualRentDormitories: summaryRow.actualRentDormitories,
      plannedReturnDormitories: summaryRow.plannedReturnDormitories,
      actualReturnDormitories: summaryRow.actualReturnDormitories,
    }),
    [summaryRow],
  )

  const {
    totalStudents,
    totalDormitories,
    totalResidents,
    averageOccupancyRate,
    maleVacantBeds,
    femaleVacantBeds,
    totalVacantBeds,
    plannedRentDormitories,
    actualRentDormitories,
    plannedReturnDormitories,
    actualReturnDormitories,
  } = statisticsData

  return (
    <div style={{ padding: 24 }}>
      {/* 关键指标卡片 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title="在校生总人数"
              value={totalStudents}
              suffix="人"
              prefix={icons.userBlue}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="宿舍总数量"
              value={totalDormitories}
              suffix="间"
              prefix={icons.homeGreen}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="住宿总人数"
              value={totalResidents}
              suffix="人"
              prefix={icons.teamYellow}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="平均住宿率"
              value={averageOccupancyRate}
              suffix="%"
              prefix={icons.homePurple}
            />
          </Col>
        </Row>
        <Row gutter={16} style={{ marginTop: 16 }}>
          <Col span={6}>
            <Statistic
              title="男宿空床位"
              value={maleVacantBeds}
              suffix="个"
              prefix={icons.manCyan}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="女宿空床位"
              value={femaleVacantBeds}
              suffix="个"
              prefix={icons.womanPink}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="总空床位"
              value={totalVacantBeds}
              suffix="个"
              prefix={icons.homeRed}
            />
          </Col>
        </Row>
        <Row gutter={16} style={{ marginTop: 16 }}>
          <Col span={6}>
            <Statistic
              title="计划租宿舍"
              value={plannedRentDormitories}
              suffix="间"
              prefix={icons.homeGreen}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="实际租宿舍"
              value={actualRentDormitories}
              suffix="间"
              prefix={icons.homeBlue}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="计划退宿舍"
              value={plannedReturnDormitories}
              suffix="间"
              prefix={icons.teamYellow}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="实际退宿舍"
              value={actualReturnDormitories}
              suffix="间"
              prefix={icons.homePurple}
            />
          </Col>
        </Row>
      </Card>

      {/* 数据表格 */}
      <Card
        title="08最高议事厅教化司现有宿舍管理统计表"
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

export default DormitoryManagementTable
