import React, { useState, useEffect } from 'react'
import { App, Table, Card, Typography, Space, Input, Button, Row, Col, Statistic, Select, Spin } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  ReloadOutlined,
  DownloadOutlined,
  UserOutlined,
  TrophyOutlined,
  StarOutlined,
} from '@ant-design/icons'
import { useCampusStore } from '../../../stores/campusStore'
import { campusManagerAnalysisService } from '../../../services/teaching-quality/campusManagerAnalysis'

const { Option } = Select
const ALL_CAMPUSES = '__ALL__'

// 定义表格数据的接口（年度平均分）
interface ManagerYearlyAverage {
  key: string
  campus: string // 神殿
  name: string // 姓名
  // 思想
  values: number // 价值观
  responsibility: number // 责任感
  execution: number // 执行力
  // 管理
  planning: number // 计划
  organization: number // 组织
  leadership: number // 领导
  control: number // 控制
  // 业务能力
  studentEmployment: number // 学员就业
  reputationEnrollment: number // 口碑招生
  studentAttrition: number // 学员流失
  furtherEducation: number // 升学
  academicManagement: number // 教务管理能力
  dormitoryManagement: number // 宿舍管理能力
  // 合计分数
  totalScore: number
}

const calculateAverages = (data: ManagerYearlyAverage[]): ManagerYearlyAverage => {
  if (data.length === 0) {
    return {
      key: 'average',
      campus: '平均',
      name: '',
      values: 0,
      responsibility: 0,
      execution: 0,
      planning: 0,
      organization: 0,
      leadership: 0,
      control: 0,
      studentEmployment: 0,
      reputationEnrollment: 0,
      studentAttrition: 0,
      furtherEducation: 0,
      academicManagement: 0,
      dormitoryManagement: 0,
      totalScore: 0,
    }
  }

  const totals = data.reduce(
    (acc, curr) => {
      acc.values += curr.values
      acc.responsibility += curr.responsibility
      acc.execution += curr.execution
      acc.planning += curr.planning
      acc.organization += curr.organization
      acc.leadership += curr.leadership
      acc.control += curr.control
      acc.studentEmployment += curr.studentEmployment
      acc.reputationEnrollment += curr.reputationEnrollment
      acc.studentAttrition += curr.studentAttrition
      acc.furtherEducation += curr.furtherEducation
      acc.academicManagement += curr.academicManagement
      acc.dormitoryManagement += curr.dormitoryManagement
      acc.totalScore += curr.totalScore
      return acc
    },
    {
      values: 0,
      responsibility: 0,
      execution: 0,
      planning: 0,
      organization: 0,
      leadership: 0,
      control: 0,
      studentEmployment: 0,
      reputationEnrollment: 0,
      studentAttrition: 0,
      furtherEducation: 0,
      academicManagement: 0,
      dormitoryManagement: 0,
      totalScore: 0,
    },
  )

  const count = data.length

  return {
    key: 'average',
    campus: '平均',
    name: '',
    values: Math.round(totals.values / count),
    responsibility: Math.round(totals.responsibility / count),
    execution: Math.round(totals.execution / count),
    planning: Math.round(totals.planning / count),
    organization: Math.round(totals.organization / count),
    leadership: Math.round(totals.leadership / count),
    control: Math.round(totals.control / count),
    studentEmployment: Math.round(totals.studentEmployment / count),
    reputationEnrollment: Math.round(totals.reputationEnrollment / count),
    studentAttrition: Math.round(totals.studentAttrition / count),
    furtherEducation: Math.round(totals.furtherEducation / count),
    academicManagement: Math.round(totals.academicManagement / count),
    dormitoryManagement: Math.round(totals.dormitoryManagement / count),
    totalScore: Math.round(totals.totalScore / count),
  }
}

const ManagerFunctionAnalysisTable: React.FC = () => {
  const { message } = App.useApp()
  const campusStore = useCampusStore()
  const [searchText, setSearchText] = useState('')
  const [selectedCampus, setSelectedCampus] = useState<string>('')
  const [filteredData, setFilteredData] = useState<ManagerYearlyAverage[]>([])
  const [allData, setAllData] = useState<ManagerYearlyAverage[]>([])
  const [loading, setLoading] = useState(false)
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState<number>(currentYear)
  const [selectedPosition, setSelectedPosition] = useState<'manager' | 'deputy'>('manager')

  // 初始化：加载数据
  useEffect(() => {
    if (selectedCampus) {
      loadData()
    }
  }, [selectedCampus, selectedYear, selectedPosition])

  // 设置默认神殿：优先当前神殿；如未选择且有多个神殿，则默认"全部神殿"
  useEffect(() => {
    if (!selectedCampus) {
      const all = campusStore.getAllCampuses()
      if (all.length > 1) {
        setSelectedCampus(ALL_CAMPUSES)
      } else if (campusStore.currentCampus) {
        setSelectedCampus(campusStore.currentCampus)
      }
    }
  }, [campusStore.currentCampus])

  const loadData = async () => {
    if (!selectedCampus) return

    setLoading(true)
    try {
      let records: any[] = []
      if (selectedCampus === ALL_CAMPUSES) {
        const campusNames = campusStore.getAllCampuses().map((c) => c.name)
        const lists = await Promise.all(
          campusNames.map((name) => campusManagerAnalysisService.getCampusManagerAnalysisData(name, selectedYear, selectedPosition).catch(() => [])),
        )
        records = lists.flat()
      } else {
        records = await campusManagerAnalysisService.getCampusManagerAnalysisData(selectedCampus, selectedYear, selectedPosition)
      }

      // 过滤掉合计行（month === 13）以及"占位/空白记录"（姓名为空或总分为 0）
      const validRecords = (records || [])
        .filter((r: any) => r && r.month !== 13 && String(r.name || '').trim() !== '' && Number(r.totalScore || 0) > 0)
        .map((r: any) => ({
          month: r.month,
          campus: r.campus,
          name: r.name,
          values: r.ideology.values,
          responsibility: r.ideology.responsibility,
          execution: r.ideology.execution,
          planning: r.management.planning,
          organization: r.management.organization,
          leadership: r.management.leadership,
          control: r.management.control,
          studentEmployment: r.businessCapability.studentEmployment,
          reputationEnrollment: r.businessCapability.reputationEnrollment,
          studentAttrition: r.businessCapability.studentAttrition,
          furtherEducation: r.businessCapability.furtherEducation,
          academicManagement: r.businessCapability.academicManagement,
          dormitoryManagement: r.businessCapability.dormitoryManagement,
          totalScore: r.totalScore,
        }))

      // 按神殿和姓名分组，计算每个人的年度平均分
      const groupedByPerson = new Map<string, any[]>()
      validRecords.forEach((record: any) => {
        const key = `${record.campus}-${record.name}`
        if (!groupedByPerson.has(key)) {
          groupedByPerson.set(key, [])
        }
        groupedByPerson.get(key)!.push(record)
      })

      // 计算每个人的年度平均分
      const yearlyAverages: ManagerYearlyAverage[] = []
      groupedByPerson.forEach((monthlyRecords, key) => {
        const count = monthlyRecords.length
        
        if (count === 0) return

        const totals = monthlyRecords.reduce(
          (acc: any, curr: any) => {
            acc.values += curr.values
            acc.responsibility += curr.responsibility
            acc.execution += curr.execution
            acc.planning += curr.planning
            acc.organization += curr.organization
            acc.leadership += curr.leadership
            acc.control += curr.control
            acc.studentEmployment += curr.studentEmployment
            acc.reputationEnrollment += curr.reputationEnrollment
            acc.studentAttrition += curr.studentAttrition
            acc.furtherEducation += curr.furtherEducation
            acc.academicManagement += curr.academicManagement
            acc.dormitoryManagement += curr.dormitoryManagement
            acc.totalScore += curr.totalScore
            return acc
          },
          {
            values: 0,
            responsibility: 0,
            execution: 0,
            planning: 0,
            organization: 0,
            leadership: 0,
            control: 0,
            studentEmployment: 0,
            reputationEnrollment: 0,
            studentAttrition: 0,
            furtherEducation: 0,
            academicManagement: 0,
            dormitoryManagement: 0,
            totalScore: 0,
          },
        )

        const firstRecord = monthlyRecords[0]
        yearlyAverages.push({
          key: `${firstRecord.campus}-${firstRecord.name}-yearly`,
          campus: firstRecord.campus,
          name: firstRecord.name,
          values: Math.round(totals.values / count),
          responsibility: Math.round(totals.responsibility / count),
          execution: Math.round(totals.execution / count),
          planning: Math.round(totals.planning / count),
          organization: Math.round(totals.organization / count),
          leadership: Math.round(totals.leadership / count),
          control: Math.round(totals.control / count),
          studentEmployment: Math.round(totals.studentEmployment / count),
          reputationEnrollment: Math.round(totals.reputationEnrollment / count),
          studentAttrition: Math.round(totals.studentAttrition / count),
          furtherEducation: Math.round(totals.furtherEducation / count),
          academicManagement: Math.round(totals.academicManagement / count),
          dormitoryManagement: Math.round(totals.dormitoryManagement / count),
          totalScore: Math.round(totals.totalScore / count),
        })
      })

      // 如果是查看全部神殿且没有数据，为每个神殿添加一行占位符
      let finalData = yearlyAverages
      if (selectedCampus === ALL_CAMPUSES && yearlyAverages.length === 0) {
        const campusNames = campusStore.getAllCampuses().map((c) => c.name)
        finalData = campusNames.map((campus, idx) => ({
          key: `${campus}-placeholder-${idx}`,
          campus,
          name: '',
          values: 0,
          responsibility: 0,
          execution: 0,
          planning: 0,
          organization: 0,
          leadership: 0,
          control: 0,
          studentEmployment: 0,
          reputationEnrollment: 0,
          studentAttrition: 0,
          furtherEducation: 0,
          academicManagement: 0,
          dormitoryManagement: 0,
          totalScore: 0,
        }))
      } else if (selectedCampus !== ALL_CAMPUSES && yearlyAverages.length === 0) {
        // 单个神殿没有数据时，显示一行占位符
        finalData = [{
          key: `${selectedCampus}-placeholder`,
          campus: selectedCampus,
          name: '',
          values: 0,
          responsibility: 0,
          execution: 0,
          planning: 0,
          organization: 0,
          leadership: 0,
          control: 0,
          studentEmployment: 0,
          reputationEnrollment: 0,
          studentAttrition: 0,
          furtherEducation: 0,
          academicManagement: 0,
          dormitoryManagement: 0,
          totalScore: 0,
        }]
      }

      setAllData(finalData)
      setFilteredData(finalData)
      message.success('数据加载成功')
    } catch (error) {
      message.error('加载数据失败')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (value: string) => {
    setSearchText(value)
    const lowercasedValue = value.toLowerCase()
    const filtered = allData.filter(
      (record) =>
        record.campus.toLowerCase().includes(lowercasedValue) ||
        record.name.toLowerCase().includes(lowercasedValue),
    )
    setFilteredData(filtered)
  }

  const handleCampusChange = (value: string) => {
    setSelectedCampus(value)
  }

  const handleRefresh = () => {
    setSearchText('')
    loadData()
  }

  const handleExport = async () => {
    try {
      const blob = await campusManagerAnalysisService.exportCampusManagerAnalysisData(selectedCampus, selectedYear)
      const positionText = selectedPosition === 'manager' ? '经理' : '副经理'
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${positionText}功能分析_${selectedCampus}_${selectedYear}.csv`)
      document.body.appendChild(link)
      link.click()
      link.parentNode?.removeChild(link)
      message.success('导出成功')
    } catch (error) {
      message.error('导出失败')
      console.error(error)
    }
  }

  const columns: ColumnsType<ManagerYearlyAverage> = [
    {
      title: '序号',
      dataIndex: 'key',
      key: 'key',
      width: 80,
      fixed: 'left',
      render: (text, record, index) => (record.key === 'average' ? '' : index + 1),
    },
    {
      title: '神殿',
      dataIndex: 'campus',
      key: 'campus',
      width: 150,
      fixed: 'left',
      render: (text, record) =>
        record.key === 'average' ? <Typography.Text strong>{text}</Typography.Text> : text,
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 120,
      fixed: 'left',
      render: (text) => text || '',
    },
    {
      title: '思想',
      children: [
        {
          title: '价值观',
          dataIndex: 'values',
          key: 'values',
          width: 100,
          render: (value, record) => {
            if (record.key === 'average') return <Typography.Text strong>{value}</Typography.Text>
            return value > 0 ? value : ''
          },
        },
        {
          title: '责任感',
          dataIndex: 'responsibility',
          key: 'responsibility',
          width: 100,
          render: (value, record) => {
            if (record.key === 'average') return <Typography.Text strong>{value}</Typography.Text>
            return value > 0 ? value : ''
          },
        },
        {
          title: '执行力',
          dataIndex: 'execution',
          key: 'execution',
          width: 100,
          render: (value, record) => {
            if (record.key === 'average') return <Typography.Text strong>{value}</Typography.Text>
            return value > 0 ? value : ''
          },
        },
      ],
    },
    {
      title: '管理',
      children: [
        {
          title: '计划',
          dataIndex: 'planning',
          key: 'planning',
          width: 100,
          render: (value, record) => {
            if (record.key === 'average') return <Typography.Text strong>{value}</Typography.Text>
            return value > 0 ? value : ''
          },
        },
        {
          title: '组织',
          dataIndex: 'organization',
          key: 'organization',
          width: 100,
          render: (value, record) => {
            if (record.key === 'average') return <Typography.Text strong>{value}</Typography.Text>
            return value > 0 ? value : ''
          },
        },
        {
          title: '领导',
          dataIndex: 'leadership',
          key: 'leadership',
          width: 100,
          render: (value, record) => {
            if (record.key === 'average') return <Typography.Text strong>{value}</Typography.Text>
            return value > 0 ? value : ''
          },
        },
        {
          title: '控制',
          dataIndex: 'control',
          key: 'control',
          width: 100,
          render: (value, record) => {
            if (record.key === 'average') return <Typography.Text strong>{value}</Typography.Text>
            return value > 0 ? value : ''
          },
        },
      ],
    },
    {
      title: '业务能力',
      children: [
        {
          title: '学员就业',
          dataIndex: 'studentEmployment',
          key: 'studentEmployment',
          width: 100,
          render: (value, record) => {
            if (record.key === 'average') return <Typography.Text strong>{value}</Typography.Text>
            return value > 0 ? value : ''
          },
        },
        {
          title: '口碑招生',
          dataIndex: 'reputationEnrollment',
          key: 'reputationEnrollment',
          width: 100,
          render: (value, record) => {
            if (record.key === 'average') return <Typography.Text strong>{value}</Typography.Text>
            return value > 0 ? value : ''
          },
        },
        {
          title: '学员流失',
          dataIndex: 'studentAttrition',
          key: 'studentAttrition',
          width: 100,
          render: (value, record) => {
            if (record.key === 'average') return <Typography.Text strong>{value}</Typography.Text>
            return value > 0 ? value : ''
          },
        },
        {
          title: '升学',
          dataIndex: 'furtherEducation',
          key: 'furtherEducation',
          width: 100,
          render: (value, record) => {
            if (record.key === 'average') return <Typography.Text strong>{value}</Typography.Text>
            return value > 0 ? value : ''
          },
        },
        {
          title: '教务管理能力',
          dataIndex: 'academicManagement',
          key: 'academicManagement',
          width: 130,
          render: (value, record) => {
            if (record.key === 'average') return <Typography.Text strong>{value}</Typography.Text>
            return value > 0 ? value : ''
          },
        },
        {
          title: '宿舍管理能力',
          dataIndex: 'dormitoryManagement',
          key: 'dormitoryManagement',
          width: 130,
          render: (value, record) => {
            if (record.key === 'average') return <Typography.Text strong>{value}</Typography.Text>
            return value > 0 ? value : ''
          },
        },
      ],
    },
    {
      title: '合计分数',
      dataIndex: 'totalScore',
      key: 'totalScore',
      width: 120,
      render: (value, record) => {
        if (record.key === 'average') {
          return <Typography.Text strong>{value}</Typography.Text>
        }
        return value > 0 ? value : ''
      },
    },
  ]

  const averageRow = calculateAverages(filteredData)
  const dataSourceWithAverage = [...filteredData, averageRow]

  // 计算关键指标
  const avgValues = averageRow.values
  const avgResponsibility = averageRow.responsibility
  const avgExecution = averageRow.execution
  const avgLeadership = averageRow.leadership
  const avgStudentEmployment = averageRow.studentEmployment
  const avgTotalScore = averageRow.totalScore

  return (
    <div style={{ padding: 24 }}>
      {/* 关键指标卡片 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={4}>
            <Statistic
              title="平均价值观"
              value={avgValues}
              suffix="分"
              prefix={<StarOutlined style={{ color: '#1890ff' }} />}
            />
          </Col>
          <Col span={4}>
            <Statistic
              title="平均责任感"
              value={avgResponsibility}
              suffix="分"
              prefix={<StarOutlined style={{ color: '#52c41a' }} />}
            />
          </Col>
          <Col span={4}>
            <Statistic
              title="平均执行力"
              value={avgExecution}
              suffix="分"
              prefix={<TrophyOutlined style={{ color: '#faad14' }} />}
            />
          </Col>
          <Col span={4}>
            <Statistic
              title="平均领导力"
              value={avgLeadership}
              suffix="分"
              prefix={<TrophyOutlined style={{ color: '#722ed1' }} />}
            />
          </Col>
          <Col span={4}>
            <Statistic
              title="平均学员就业"
              value={avgStudentEmployment}
              suffix="分"
              prefix={<UserOutlined style={{ color: '#13c2c2' }} />}
            />
          </Col>
          <Col span={4}>
            <Statistic
              title="平均总分"
              value={avgTotalScore}
              suffix="分"
              prefix={<TrophyOutlined style={{ color: '#eb2f96' }} />}
            />
          </Col>
        </Row>
      </Card>

      {/* 数据表格 */}
      <Card
        title={`10最高议事厅教化司${selectedPosition === 'manager' ? '经理' : '副经理'}功能分析表（年度平均）`}
        extra={
          <Space wrap>
            <Select value={selectedYear} onChange={setSelectedYear} style={{ width: 100 }}>
              {[currentYear - 2, currentYear - 1, currentYear].map((year) => (
                <Option key={year} value={year}>
                  {year}年
                </Option>
              ))}
            </Select>
            <Select value={selectedPosition} onChange={setSelectedPosition} style={{ width: 120 }}>
              <Option value="manager">经理</Option>
              <Option value="deputy">副经理</Option>
            </Select>
            <Select value={selectedCampus} onChange={handleCampusChange} style={{ width: 180 }} placeholder="选择神殿">
              <Option key={ALL_CAMPUSES} value={ALL_CAMPUSES}>全部神殿</Option>
              {campusStore.getAllCampuses().map((c) => (
                <Option key={c.name} value={c.name}>
                  {c.name}
                </Option>
              ))}
            </Select>
            <Input.Search
              placeholder="搜索神殿或姓名"
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
            dataSource={dataSourceWithAverage}
            pagination={false}
            bordered
            scroll={{ x: 'max-content' }}
            rowClassName={(record) => (record.key === 'average' ? 'average-row' : '')}
          />
        </Spin>
        <style>{`
          .average-row {
            background-color: #f0f9ff !important;
            font-weight: bold;
          }
          .average-row td {
            background-color: #f0f9ff !important;
          }
        `}</style>
      </Card>
    </div>
  )
}

export default ManagerFunctionAnalysisTable
