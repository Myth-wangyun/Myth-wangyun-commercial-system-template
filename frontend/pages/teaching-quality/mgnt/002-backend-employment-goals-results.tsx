import React, { useState, useEffect } from 'react'
import { App, Table, Card, Typography, Space, Input, InputNumber, Button, Row, Col, Statistic } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  ReloadOutlined,
  DownloadOutlined,
  BarChartOutlined,
  UserOutlined,
  DollarOutlined,
  TrophyOutlined,
  SaveOutlined,
} from '@ant-design/icons'
import { apiService } from '@/services/api'

// 定义表格数据的接口
interface BackendEmploymentGoalsResultsRecord {
  key: string
  campus: string // 神殿
  majorDirection: string // 专业方向
  academicSystem: string // 学制
  classCount: number // 班级数量
  instructors: string // 授课教员
  headTeacher: string // 负责班主任
  graduationTime: string // 毕业时间
  targetAverageSalary: number // 目标平均就业薪资
  actualAverageSalary: number // 实际平均就业薪资
  attainmentRate: number // 达标率
  archivedCount: number // 档案人数
  targetEmploymentCount: number // 目标就业人数
  actualEmploymentCount: number // 实际就业人数
  employmentRate: number // 就业率
  salaryOver10kCount: number // 薪资过万人数
}


// 计算合计与平均
// 计算合计与平均
const calculateTotalsAndAverages = (data: BackendEmploymentGoalsResultsRecord[]) => {
  if (data.length === 0) {
    return {
      key: 'total',
      campus: '合计/平均',
      majorDirection: '',
      academicSystem: '',
      classCount: 0,
      instructors: '',
      headTeacher: '',
      graduationTime: '',
      targetAverageSalary: 0,
      actualAverageSalary: 0,
      attainmentRate: 0,
      archivedCount: 0,
      targetEmploymentCount: 0,
      actualEmploymentCount: 0,
      employmentRate: 0,
      salaryOver10kCount: 0,
    }
  }

  const totals = data.reduce(
    (acc, curr) => {
      acc.classCount += curr.classCount || 0
      acc.targetAverageSalary += curr.targetAverageSalary || 0
      acc.actualAverageSalary += curr.actualAverageSalary || 0
      acc.archivedCount += curr.archivedCount || 0
      acc.targetEmploymentCount += curr.targetEmploymentCount || 0
      acc.actualEmploymentCount += curr.actualEmploymentCount || 0
      acc.salaryOver10kCount += curr.salaryOver10kCount || 0
      return acc
    },
    {
      classCount: 0,
      targetAverageSalary: 0,
      actualAverageSalary: 0,
      archivedCount: 0,
      targetEmploymentCount: 0,
      actualEmploymentCount: 0,
      salaryOver10kCount: 0,
    },
  )

  const count = data.length
  const totalTargetEmploymentCount = totals.targetEmploymentCount
  const totalActualEmploymentCount = totals.actualEmploymentCount

  return {
    key: 'total',
    campus: '合计/平均',
    majorDirection: '',
    academicSystem: '',
    classCount: totals.classCount,
    instructors: '',
    headTeacher: '',
    graduationTime: '',
    targetAverageSalary: count > 0 ? parseFloat((totals.targetAverageSalary / count).toFixed(0)) : 0,
    actualAverageSalary: count > 0 ? parseFloat((totals.actualAverageSalary / count).toFixed(0)) : 0,
    attainmentRate:
      totals.targetAverageSalary > 0
        ? parseFloat(((totals.actualAverageSalary / totals.targetAverageSalary) * 100).toFixed(2))
        : 0,
    archivedCount: totals.archivedCount,
    targetEmploymentCount: totals.targetEmploymentCount,
    actualEmploymentCount: totals.actualEmploymentCount,
    employmentRate:
      totalTargetEmploymentCount > 0
        ? parseFloat(((totalActualEmploymentCount / totalTargetEmploymentCount) * 100).toFixed(2))
        : 0,
    salaryOver10kCount: totals.salaryOver10kCount,
  }
}

interface BackendEmploymentGoalsResultsTableProps {
  campus?: string
}

const BackendEmploymentGoalsResultsTable: React.FC<BackendEmploymentGoalsResultsTableProps> = ({ campus }) => {
  const { message } = App.useApp()
  const [searchText, setSearchText] = useState('')
  const [allData, setAllData] = useState<BackendEmploymentGoalsResultsRecord[]>([])
  const [filteredData, setFilteredData] = useState<BackendEmploymentGoalsResultsRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const currentYear = new Date().getFullYear()

  const fetchData = async () => {
    setLoading(true)
    try {
      // 构建请求参数，如果有神殿参数则传递（去掉"神殿"后缀）
      const params: any = { year: currentYear }
      if (campus) {
        params.campus = campus.replace('神殿', '')
      }
      
      const res = await apiService.get<any>('/teaching-quality/mgnt-employment-goals-results', {
        params,
      })
      const raw = (res as any)?.data ?? res
      const rows: any[] = Array.isArray(raw?.行列表) ? raw.行列表 : []
      const data: BackendEmploymentGoalsResultsRecord[] = rows
        .filter((r) => (r.campus || r.神殿) !== '合计/平均')
        .map((r: any, idx: number) => ({
          key: String(r.campus || r.神殿 || idx + 1),
          campus: r.campus || r.神殿 || '',
          majorDirection: String(r.majorDirection ?? r.专业方向 ?? ''),
          academicSystem: String(r.academicSystem ?? r.学制 ?? ''),
          classCount: Number(r.classCount ?? 0),
          instructors: String(r.instructors ?? r.授课教员 ?? ''),
          headTeacher: String(r.headTeacher ?? r.负责班主任 ?? ''),
          graduationTime: String(r.graduationTime ?? r.毕业时间 ?? ''),
          targetAverageSalary: Number(r.targetAverageSalary ?? 0),
          actualAverageSalary: Number(r.actualAverageSalary ?? 0),
          // 后端可能返回两种口径：1.01 表示 101%（倍数），或 101 表示 101%（百分比）。
          // 这里统一存储为“百分比数值”，用于渲染时直接加 %。
          attainmentRate: (() => {
            const v = Number(r.attainmentRate ?? 0)
            // 若 v 在 0~2 之间，通常代表倍数（例如 1.01 => 101%）；否则认为已是百分比。
            return v > 0 && v < 2 ? parseFloat((v * 100).toFixed(2)) : v
          })(),
          archivedCount: Number(r.archivedCount ?? 0),
          targetEmploymentCount: Number(r.targetEmploymentCount ?? 0),
          actualEmploymentCount: Number(r.actualEmploymentCount ?? 0),
          employmentRate: Number(r.employmentRate ?? 0),
          salaryOver10kCount: Number(r.salaryOver10kCount ?? 0),
        }))
      setAllData(data)
      setFilteredData(data)
    } catch (e) {
      message.error('获取数据失败')
      setAllData([])
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
      const filtered = allData.filter((record) =>
        record.campus.toLowerCase().includes(lowercasedValue),
      )
      setFilteredData(filtered)
    } else {
      setFilteredData(allData)
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

  // 批量保存：仅提交神殿 + 目标平均就业薪资（忽略合计行）
  const handleSave = async () => {
    try {
      setSaving(true)
      const rows = allData
        .filter((r) => r.campus && r.key !== 'total')
        .map((r) => ({ campus: r.campus, targetAverageSalary: r.targetAverageSalary }))
      
      // 构建请求参数，如果有神殿参数则传递
      const payload: any = {
        year: currentYear,
        rows,
      }
      if (campus) {
        payload.campus = campus.replace('神殿', '')
      }
      
      await apiService.post('/teaching-quality/mgnt-employment-goals-results', payload)
      message.success('保存成功')
      await fetchData()
    } catch (e) {
      message.error('保存失败')
    } finally {
      setSaving(false)
    }
  }

  // 手动修改目标平均就业薪资，并联动行内达标率和汇总
  const applyTargetSalary = (rowKey: string, value: number) => {
    setAllData((prev) =>
      prev.map((r) =>
        r.key === rowKey
          ? {
              ...r,
              targetAverageSalary: value,
              attainmentRate:
                value && value > 0 ? parseFloat(((r.actualAverageSalary || 0) / value * 100).toFixed(2)) : 0,
            }
          : r,
      ),
    )
    setFilteredData((prev) =>
      prev.map((r) =>
        r.key === rowKey
          ? {
              ...r,
              targetAverageSalary: value,
              attainmentRate:
                value && value > 0 ? parseFloat(((r.actualAverageSalary || 0) / value * 100).toFixed(2)) : 0,
            }
          : r,
      ),
    )
  }

  const columns: ColumnsType<BackendEmploymentGoalsResultsRecord> = [
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
    {
      title: '班级数量',
      dataIndex: 'classCount',
      key: 'classCount',
      width: 100,
    },
    {
      title: '就业薪资',
      children: [
        {
          title: '目标平均就业薪资',
          dataIndex: 'targetAverageSalary',
          key: 'targetAverageSalary',
          width: 150,
          render: (value) => (value ? `¥${value}` : ''),
        },
        {
          title: '实际平均就业薪资',
          dataIndex: 'actualAverageSalary',
          key: 'actualAverageSalary',
          width: 150,
          render: (value) => (value ? `¥${value}` : ''),
        },
        {
          title: '达标率',
          dataIndex: 'attainmentRate',
          key: 'attainmentRate',
          width: 100,
          render: (value) => (value ? `${value}%` : '#DIV/0!'),
        },
      ],
    },
    {
      title: '就业率',
      children: [
        {
          title: '档案人数',
          dataIndex: 'archivedCount',
          key: 'archivedCount',
          width: 100,
        },
        {
          title: '目标就业人数',
          dataIndex: 'targetEmploymentCount',
          key: 'targetEmploymentCount',
          width: 120,
        },
        {
          title: '实际就业人数',
          dataIndex: 'actualEmploymentCount',
          key: 'actualEmploymentCount',
          width: 120,
        },
        {
          title: '就业率',
          dataIndex: 'employmentRate',
          key: 'employmentRate',
          width: 100,
          render: (value) => (value ? `${value}%` : '#DIV/0!'),
        },
      ],
    },
    {
      title: '薪资过万人数',
      dataIndex: 'salaryOver10kCount',
      key: 'salaryOver10kCount',
      width: 120,
    },
  ]

  const summaryRow = calculateTotalsAndAverages(filteredData)
  const dataSourceWithSummary = [...filteredData, summaryRow]

  // 计算关键指标
  const totalArchivedCount = summaryRow.archivedCount
  const totalActualEmploymentCount = summaryRow.actualEmploymentCount
  const averageEmploymentRate = summaryRow.employmentRate
  const totalSalaryOver10kCount = summaryRow.salaryOver10kCount

  return (
    <div style={{ padding: 24 }}>
      {/* 关键指标卡片 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title="档案总人数"
              value={totalArchivedCount}
              suffix="人"
              prefix={<UserOutlined style={{ color: '#1890ff' }} />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="实际就业人数"
              value={totalActualEmploymentCount}
              suffix="人"
              prefix={<TrophyOutlined style={{ color: '#52c41a' }} />}
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
              title="薪资过万人数"
              value={totalSalaryOver10kCount}
              suffix="人"
              prefix={<DollarOutlined style={{ color: '#722ed1' }} />}
            />
          </Col>
        </Row>
      </Card>

      {/* 数据表格 */}
      <Card
        title="02最高议事厅后端学员就业目标与结果汇总表"
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
            <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={saving}>
              保存
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

export default BackendEmploymentGoalsResultsTable
