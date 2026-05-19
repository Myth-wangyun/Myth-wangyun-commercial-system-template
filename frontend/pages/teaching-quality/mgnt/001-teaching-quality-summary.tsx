import React, { useState, useEffect } from 'react'
import { App, Table, Card, Typography, Space, Input, Button, Row, Col, Statistic } from 'antd'
import type { TableProps } from 'antd'
import {
  SearchOutlined,
  ReloadOutlined,
  DownloadOutlined,
  BarChartOutlined,
  UserOutlined,
  DollarOutlined,
} from '@ant-design/icons'
import { apiService } from '@/services/api'

// 定义表格数据的接口
interface TeachingQualityCoreDataSummaryRecord {
  key: string
  campus: string // 神殿
  totalStudents: number // 学生总人数
  totalClasses: number // 班级总个数
  totalTeachingQualityStaff: number // 教质总职数
  totalCadreStaff: number // 干部总职数
  totalEmployees: number // 员工总人数
  totalEmployedClasses: number // 就业班级总数
  totalEmployedStudents: number // 就业总人数
  employmentRate: number // 就业率
  averageEmploymentSalary: number // 就业平均薪资
  salaryOver10kCount: number // 薪资过万人数
  totalEnterpriseContracts: number // 企业签约总数
  totalWordOfMouthRegistrations: number // 口碑报名总人数
  totalWordOfMouthRevenue: number // 口碑总收入
  totalFurtherEducationStudents: number // 升学总人数
  totalFurtherEducationRevenue: number // 升学总收入
  furtherEducationRateAmount: number // 升学率（金额）
  totalNewStudentEnrollments: number // 新生入学总人数
  totalNewStudentRefunds: number // 新生退费总人数
  totalOldStudentRefunds: number // 老生退费总人数
  refundRate: number // 退费率
  changeRate: number // 异动率
  totalDormitories: number // 宿舍总个数
  totalDormitoryResidents: number // 宿舍总人数
  secondaryVocationalTargetRegistrations: number // 中专层次目标注册总人数
  universityTargetRegistrations: number // 大学层次目标注册总人数
}

const calculateTotalsAndAverages = (data: TeachingQualityCoreDataSummaryRecord[]) => {
  if (data.length === 0) {
    return {
      key: 'total',
      campus: '合计/平均',
      totalStudents: 0,
      totalClasses: 0,
      totalTeachingQualityStaff: 0,
      totalCadreStaff: 0,
      totalEmployees: 0,
      totalEmployedClasses: 0,
      totalEmployedStudents: 0,
      employmentRate: 0,
      averageEmploymentSalary: 0,
      salaryOver10kCount: 0,
      totalEnterpriseContracts: 0,
      totalWordOfMouthRegistrations: 0,
      totalWordOfMouthRevenue: 0,
      totalFurtherEducationStudents: 0,
      totalFurtherEducationRevenue: 0,
      furtherEducationRateAmount: 0,
      totalNewStudentEnrollments: 0,
      totalNewStudentRefunds: 0,
      totalOldStudentRefunds: 0,
      refundRate: 0,
      changeRate: 0,
      totalDormitories: 0,
      totalDormitoryResidents: 0,
      secondaryVocationalTargetRegistrations: 0,
      universityTargetRegistrations: 0,
    }
  }

  const totals = data.reduce(
    (acc, curr) => {
      acc.totalStudents += curr.totalStudents
      acc.totalClasses += curr.totalClasses
      acc.totalTeachingQualityStaff += curr.totalTeachingQualityStaff
      acc.totalCadreStaff += curr.totalCadreStaff
      acc.totalEmployees += curr.totalEmployees
      acc.totalEmployedClasses += curr.totalEmployedClasses
      acc.totalEmployedStudents += curr.totalEmployedStudents
      acc.employmentRate += curr.employmentRate
      acc.averageEmploymentSalary += curr.averageEmploymentSalary
      acc.salaryOver10kCount += curr.salaryOver10kCount
      acc.totalEnterpriseContracts += curr.totalEnterpriseContracts
      acc.totalWordOfMouthRegistrations += curr.totalWordOfMouthRegistrations
      acc.totalWordOfMouthRevenue += curr.totalWordOfMouthRevenue
      acc.totalFurtherEducationStudents += curr.totalFurtherEducationStudents
      acc.totalFurtherEducationRevenue += curr.totalFurtherEducationRevenue
      acc.furtherEducationRateAmount += curr.furtherEducationRateAmount
      acc.totalNewStudentEnrollments += curr.totalNewStudentEnrollments
      acc.totalNewStudentRefunds += curr.totalNewStudentRefunds
      acc.totalOldStudentRefunds += curr.totalOldStudentRefunds
      acc.refundRate += curr.refundRate
      acc.changeRate += curr.changeRate
      acc.totalDormitories += curr.totalDormitories
      acc.totalDormitoryResidents += curr.totalDormitoryResidents
      acc.secondaryVocationalTargetRegistrations += curr.secondaryVocationalTargetRegistrations
      acc.universityTargetRegistrations += curr.universityTargetRegistrations
      return acc
    },
    {
      totalStudents: 0,
      totalClasses: 0,
      totalTeachingQualityStaff: 0,
      totalCadreStaff: 0,
      totalEmployees: 0,
      totalEmployedClasses: 0,
      totalEmployedStudents: 0,
      employmentRate: 0,
      averageEmploymentSalary: 0,
      salaryOver10kCount: 0,
      totalEnterpriseContracts: 0,
      totalWordOfMouthRegistrations: 0,
      totalWordOfMouthRevenue: 0,
      totalFurtherEducationStudents: 0,
      totalFurtherEducationRevenue: 0,
      furtherEducationRateAmount: 0,
      totalNewStudentEnrollments: 0,
      totalNewStudentRefunds: 0,
      totalOldStudentRefunds: 0,
      refundRate: 0,
      changeRate: 0,
      totalDormitories: 0,
      totalDormitoryResidents: 0,
      secondaryVocationalTargetRegistrations: 0,
      universityTargetRegistrations: 0,
    },
  )

  const count = data.length

  return {
    key: 'total',
    campus: '合计/平均',
    totalStudents: totals.totalStudents,
    totalClasses: totals.totalClasses,
    totalTeachingQualityStaff: totals.totalTeachingQualityStaff,
    totalCadreStaff: totals.totalCadreStaff,
    totalEmployees: totals.totalEmployees,
    totalEmployedClasses: totals.totalEmployedClasses,
    totalEmployedStudents: totals.totalEmployedStudents,
    // employmentRate 已统一为 0~100，这里取平均即可
    employmentRate: parseFloat((totals.employmentRate / count).toFixed(1)),
    averageEmploymentSalary: parseFloat((totals.averageEmploymentSalary / count).toFixed(0)),
    salaryOver10kCount: totals.salaryOver10kCount,
    totalEnterpriseContracts: totals.totalEnterpriseContracts,
    totalWordOfMouthRegistrations: totals.totalWordOfMouthRegistrations,
    totalWordOfMouthRevenue: totals.totalWordOfMouthRevenue,
    totalFurtherEducationStudents: totals.totalFurtherEducationStudents,
    totalFurtherEducationRevenue: totals.totalFurtherEducationRevenue,
    furtherEducationRateAmount: parseFloat((totals.furtherEducationRateAmount / count).toFixed(1)),
    totalNewStudentEnrollments: totals.totalNewStudentEnrollments,
    totalNewStudentRefunds: totals.totalNewStudentRefunds,
    totalOldStudentRefunds: totals.totalOldStudentRefunds,
    refundRate: parseFloat((totals.refundRate / count).toFixed(1)),
    changeRate: parseFloat((totals.changeRate / count).toFixed(1)),
    totalDormitories: totals.totalDormitories,
    totalDormitoryResidents: totals.totalDormitoryResidents,
    secondaryVocationalTargetRegistrations: totals.secondaryVocationalTargetRegistrations,
    universityTargetRegistrations: totals.universityTargetRegistrations,
  }
}

interface TeachingQualityCoreDataSummaryTableProps {
  campus?: string
}

const TeachingQualityCoreDataSummaryTable: React.FC<TeachingQualityCoreDataSummaryTableProps> = ({ campus }) => {
  const { message } = App.useApp()
  const [searchText, setSearchText] = useState('')
  const [filteredData, setFilteredData] = useState<TeachingQualityCoreDataSummaryRecord[]>([])
  const [loading, setLoading] = useState(false)
  const currentYear = new Date().getFullYear()

  // 获取数据
  const fetchData = async () => {
    setLoading(true)
    try {
      // 构建请求参数，如果有神殿参数则传递（去掉"神殿"后缀）
      const params: any = { year: currentYear }
      if (campus) {
        params.campus = campus.replace('神殿', '')
      }
      
      const res = await apiService.get<any>('/teaching-quality/mgnt-core-data-summary', {
        params,
      })
      const raw = (res as any)?.data ?? res
      const rows = Array.isArray(raw?.行列表) ? raw.行列表 : []
      const data = rows.map((r: any, idx: number) => {
        const campusName = r.campus || r.神殿
        const isSummary = campusName === '合计/平均'
        return {
          // 合计行使用固定 key，避免被当成普通第 N 行、也避免 key 不稳定导致渲染异常
          key: isSummary ? 'total' : `${idx}`,
          campus: campusName,
        totalStudents: r.totalStudents || 0,
        totalClasses: r.totalClasses || 0,
        totalTeachingQualityStaff: r.totalTeachingQualityStaff || 0,
        totalCadreStaff: r.totalCadreStaff || 0,
        totalEmployees: r.totalEmployees || 0,
        totalEmployedClasses: r.totalEmployedClasses || 0,
        totalEmployedStudents: r.totalEmployedStudents || 0,
        // 后端可能返回 0~1 的小数（如 0.8 表示 80%），这里统一转换成 0~100
        employmentRate:
          r.employmentRate === null || r.employmentRate === undefined
            ? 0
            : r.employmentRate > 0 && r.employmentRate <= 1
              ? Number(r.employmentRate) * 100
              : Number(r.employmentRate),
        averageEmploymentSalary: r.averageEmploymentSalary || 0,
        salaryOver10kCount: r.salaryOver10kCount || 0,
        totalEnterpriseContracts: r.totalEnterpriseContracts || 0,
        totalWordOfMouthRegistrations: r.totalWordOfMouthRegistrations || 0,
        totalWordOfMouthRevenue: r.totalWordOfMouthRevenue || 0,
        totalFurtherEducationStudents: r.totalFurtherEducationStudents || 0,
        totalFurtherEducationRevenue: r.totalFurtherEducationRevenue || 0,
        furtherEducationRateAmount: r.furtherEducationRateAmount || 0,
        totalNewStudentEnrollments: r.totalNewStudentEnrollments || 0,
        totalNewStudentRefunds: r.totalNewStudentRefunds || 0,
        totalOldStudentRefunds: r.totalOldStudentRefunds || 0,
        refundRate: r.refundRate || 0,
        changeRate: r.changeRate || 0,
        totalDormitories: r.totalDormitories || 0,
        totalDormitoryResidents: r.totalDormitoryResidents || 0,
        secondaryVocationalTargetRegistrations: r.secondaryVocationalTargetRegistrations || 0,
        universityTargetRegistrations: r.universityTargetRegistrations || 0,
      }
      })
      setFilteredData(data)
    } catch (error) {
      message.error('获取数据失败')
      setFilteredData([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [campus])

  const handleSearch = (value: string) => {
    setSearchText(value)
    if (value) {
      const lowercasedValue = value.toLowerCase()
      const filtered = filteredData.filter((record) =>
        record.campus.toLowerCase().includes(lowercasedValue),
      )
      setFilteredData(filtered)
    } else {
      fetchData()
    }
  }

  const handleRefresh = () => {
    setSearchText('')
    fetchData()
  }

  const handleExport = () => {
    // 导出功能
    console.log('导出数据')
  }

  const columns: TableProps<TeachingQualityCoreDataSummaryRecord>['columns'] = [
    {
      title: '序号',
      dataIndex: 'key',
      key: 'key',
      width: 60,
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
    { title: '学生总人数', dataIndex: 'totalStudents', key: 'totalStudents', width: 120 },
    { title: '班级总个数', dataIndex: 'totalClasses', key: 'totalClasses', width: 120 },
    {
      title: '教质总职数',
      dataIndex: 'totalTeachingQualityStaff',
      key: 'totalTeachingQualityStaff',
      width: 140,
    },
    { title: '干部总职数', dataIndex: 'totalCadreStaff', key: 'totalCadreStaff', width: 120 },
    { title: '员工总人数', dataIndex: 'totalEmployees', key: 'totalEmployees', width: 120 },
    {
      title: '就业班级总数',
      dataIndex: 'totalEmployedClasses',
      key: 'totalEmployedClasses',
      width: 140,
    },
    {
      title: '就业总人数',
      dataIndex: 'totalEmployedStudents',
      key: 'totalEmployedStudents',
      width: 120,
    },
    {
      title: '就业率',
      dataIndex: 'employmentRate',
      key: 'employmentRate',
      width: 100,
      render: (value) => `${value}%`,
    },
    {
      title: '就业平均薪资',
      dataIndex: 'averageEmploymentSalary',
      key: 'averageEmploymentSalary',
      width: 140,
      render: (value) => `¥${value}`,
    },
    {
      title: '薪资过万人数',
      dataIndex: 'salaryOver10kCount',
      key: 'salaryOver10kCount',
      width: 140,
    },
    {
      title: '企业签约总数',
      dataIndex: 'totalEnterpriseContracts',
      key: 'totalEnterpriseContracts',
      width: 140,
    },
    {
      title: '口碑报名总人数',
      dataIndex: 'totalWordOfMouthRegistrations',
      key: 'totalWordOfMouthRegistrations',
      width: 160,
    },
    {
      title: '口碑总收入',
      dataIndex: 'totalWordOfMouthRevenue',
      key: 'totalWordOfMouthRevenue',
      width: 140,
      render: (value) => `¥${value}`,
    },
    {
      title: '升学总人数',
      dataIndex: 'totalFurtherEducationStudents',
      key: 'totalFurtherEducationStudents',
      width: 120,
    },
    {
      title: '升学总收入',
      dataIndex: 'totalFurtherEducationRevenue',
      key: 'totalFurtherEducationRevenue',
      width: 140,
      render: (value) => `¥${value}`,
    },
    {
      title: '升学率（金额）',
      dataIndex: 'furtherEducationRateAmount',
      key: 'furtherEducationRateAmount',
      width: 160,
      render: (value) => `${value}%`,
    },
    {
      title: '新生入学总人数',
      dataIndex: 'totalNewStudentEnrollments',
      key: 'totalNewStudentEnrollments',
      width: 160,
    },
    {
      title: '新生退费总人数',
      dataIndex: 'totalNewStudentRefunds',
      key: 'totalNewStudentRefunds',
      width: 160,
    },
    {
      title: '老生退费总人数',
      dataIndex: 'totalOldStudentRefunds',
      key: 'totalOldStudentRefunds',
      width: 160,
    },
    {
      title: '退费率',
      dataIndex: 'refundRate',
      key: 'refundRate',
      width: 100,
      render: (value) => `${value}%`,
    },
    {
      title: '异动率',
      dataIndex: 'changeRate',
      key: 'changeRate',
      width: 100,
      render: (value) => `${value}%`,
    },
    { title: '宿舍总个数', dataIndex: 'totalDormitories', key: 'totalDormitories', width: 120 },
    {
      title: '宿舍总人数',
      dataIndex: 'totalDormitoryResidents',
      key: 'totalDormitoryResidents',
      width: 120,
    },
    {
      title: '中专层次目标注册总人数',
      dataIndex: 'secondaryVocationalTargetRegistrations',
      key: 'secondaryVocationalTargetRegistrations',
      width: 200,
    },
    {
      title: '大学层次目标注册总人数',
      dataIndex: 'universityTargetRegistrations',
      key: 'universityTargetRegistrations',
      width: 200,
    },
  ]

  // 避免重复合计行：后端可能已经返回了“合计/平均”行。
  // 这里统一策略：
  // - 如果后端已返回合计行：直接使用后端合计行，不再前端重复计算追加
  // - 如果后端未返回合计行：前端再计算并追加一行
  const backendSummaryRow = filteredData.find((r) => r.campus === '合计/平均' || r.key === 'total')
  const dataWithoutSummary = filteredData.filter(
    (r) => r.key !== 'total' && r.campus !== '合计/平均',
  )

  const summaryRow = backendSummaryRow ?? calculateTotalsAndAverages(dataWithoutSummary)
  const dataSourceWithSummary = [...dataWithoutSummary, summaryRow]

  // 计算关键指标
  const totalStudents = summaryRow.totalStudents
  const totalEmployees = summaryRow.totalEmployees
  const averageEmploymentRate = summaryRow.employmentRate
  const totalRevenue = summaryRow.totalWordOfMouthRevenue + summaryRow.totalFurtherEducationRevenue

  return (
    <div style={{ padding: 24 }}>
      {/* 关键指标卡片 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title="学生总人数"
              value={totalStudents}
              suffix="人"
              prefix={<UserOutlined style={{ color: '#1890ff' }} />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="员工总人数"
              value={totalEmployees}
              suffix="人"
              prefix={<UserOutlined style={{ color: '#52c41a' }} />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="平均就业率"
              value={averageEmploymentRate}
              suffix="%"
              prefix={<BarChartOutlined style={{ color: '#faad14' }} />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="总收入"
              value={totalRevenue}
              prefix={<DollarOutlined style={{ color: '#722ed1' }} />}
              formatter={(value) => `¥${value}`}
            />
          </Col>
        </Row>
      </Card>

      {/* 数据表格 */}
      <Card
        title="01最高议事厅教化司核心数据汇总表"
        extra={
          <Space>
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
          loading={loading}
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

export default TeachingQualityCoreDataSummaryTable
