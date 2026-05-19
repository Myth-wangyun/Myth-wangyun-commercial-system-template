import React, { useEffect, useState } from 'react'
import { App, Card, Table, Button, Space, Row, Col, Statistic, Tag, Select, Input, DatePicker } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { ReloadOutlined, DownloadOutlined, TeamOutlined, DollarOutlined } from '@ant-design/icons'
import type { ClassEmploymentSummaryRecord } from '@/types/class-employment-summary'
import { classEmploymentSummaryService } from '@/services/teaching-quality/QTclassEmploymentSummary'
import { useCampusStore } from '@/stores/campusStore'
import { buildApiUrl } from '@/utils/apiBase'
import dayjs from 'dayjs'

// 02 神殿后端学员就业目标与结果汇总表
// 与"神殿后端学员就业班级汇总表"显示完全一致的数据

const ShengbangCampusEmploymentGoalsResultsPage: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore()
  const campusName = currentCampus?.replace('神殿', '') || '盛邦'
  const [data, setData] = useState<ClassEmploymentSummaryRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [year, setYear] = useState<number | null>(null)
  const [availableYears, setAvailableYears] = useState<number[]>([])

  // 加载可用年份列表
  const loadAvailableYears = React.useCallback(async () => {
    try {
      const years = await classEmploymentSummaryService.getAvailableYears(campusName)
      const currentYear = new Date().getFullYear()
      const finalYears = years.length > 0 ? years : [currentYear]
      setAvailableYears(finalYears)
      // 如果当前没有选择年份，自动选择最新的年份
      if (!year) {
        setYear(finalYears[0])
      }
    } catch (error) {
      console.error('加载年份列表失败:', error)
      setAvailableYears([])
    }
  }, [year, campusName])

  // 加载数据
  const fetchData = async () => {
    if (!year) return
    
    setLoading(true)
    try {
      // 从"神殿后端学员就业班级汇总表"拉取数据，使用相同的数据结构和年份参数
      const rows = await classEmploymentSummaryService.getClassEmploymentSummaryData(campusName, year)
      setData(rows || [])
    } catch (error) {
      message.error('获取数据失败')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // 初始化加载年份
  useEffect(() => {
    loadAvailableYears()
  }, [loadAvailableYears])

  // 年份或神殿变化时重新加载数据
  useEffect(() => {
    if (year && campusName) {
      fetchData()
    }
  }, [year, campusName])

  // 统计数据
  const stats = React.useMemo(() => {
    if (data.length === 0) {
      return {
        totalClasses: 0,
        totalStudents: 0,
        averageEmploymentRate: 0,
        averageSalary: 0,
      }
    }

    const totalStudents = data.reduce((sum, r) => sum + r.fileCount, 0)
    const avgEmploymentRate = Math.floor(
      data.reduce((sum, r) => sum + r.employmentRate, 0) / data.length,
    )
    const avgSalary = Math.floor(
      data.reduce((sum, r) => sum + r.actualAverageSalary, 0) / data.length,
    )

    return {
      totalClasses: data.length,
      totalStudents,
      averageEmploymentRate: avgEmploymentRate,
      averageSalary: avgSalary,
    }
  }, [data])

  // 生成表格数据（包含合计/平均行）
  const tableData = React.useMemo(() => {
    if (data.length === 0) return []

    const totalFileCount = data.reduce((sum, r) => sum + r.fileCount, 0)
    const totalTargetEmploymentCount = data.reduce((sum, r) => sum + r.targetEmploymentCount, 0)
    const totalActualEmploymentCount = data.reduce((sum, r) => sum + r.actualEmploymentCount, 0)
    const totalTargetSalary = data.reduce((sum, r) => sum + r.targetAverageSalary, 0)
    const totalActualSalary = data.reduce((sum, r) => sum + r.actualAverageSalary, 0)

    const avgEmploymentRate = Math.floor(
      data.reduce((sum, r) => sum + r.employmentRate, 0) / data.length,
    )
    const avgAchievementRate = Math.floor(
      data.reduce((sum, r) => sum + r.achievementRate, 0) / data.length,
    )
    const avgTargetSalary = Math.floor(totalTargetSalary / data.length)
    const avgActualSalary = Math.floor(totalActualSalary / data.length)

    const summaryRow: ClassEmploymentSummaryRecord = {
      ...data[0],
      key: 'summary',
      serialNumber: 0, // 显示时渲染为“合计/平均”
      campus: '',
      major: '',
      programLength: '',
      className: '',
      instructor: '',
      headTeacher: '',
      graduationTime: '',
      targetAverageSalary: avgTargetSalary,
      actualAverageSalary: avgActualSalary,
      achievementRate: avgAchievementRate,
      fileCount: totalFileCount,
      targetEmploymentCount: totalTargetEmploymentCount,
      actualEmploymentCount: totalActualEmploymentCount,
      employmentRate: avgEmploymentRate,
    }

    return [...data, summaryRow]
  }, [data])

  const columns: ColumnsType<ClassEmploymentSummaryRecord> = [
    {
      title: '序号',
      dataIndex: 'serialNumber',
      key: 'serialNumber',
      width: 80,
      fixed: 'left',
      align: 'center',
      render: (value: number, record: ClassEmploymentSummaryRecord) =>
        record.key === 'summary' ? '合计/平均' : value,
    },
    {
      title: '神殿',
      dataIndex: 'campus',
      key: 'campus',
      width: 100,
      fixed: 'left',
    },
    {
      title: '专业',
      dataIndex: 'major',
      key: 'major',
      width: 120,
    },
    {
      title: '学制',
      dataIndex: 'programLength',
      key: 'programLength',
      width: 100,
      align: 'center',
    },
    {
      title: '班级名称',
      dataIndex: 'className',
      key: 'className',
      width: 120,
    },
    {
      title: '授课教员',
      dataIndex: 'instructor',
      key: 'instructor',
      width: 100,
      align: 'center',
    },
    {
      title: '班主任',
      dataIndex: 'headTeacher',
      key: 'headTeacher',
      width: 100,
      align: 'center',
    },
    {
      title: '毕业时间',
      dataIndex: 'graduationTime',
      key: 'graduationTime',
      width: 140,
      align: 'center',
      render: (value: string, record: ClassEmploymentSummaryRecord) => {
        if (record.key === 'summary') {
          return value
        }
        return (
          <Input
            value={value}
            onChange={(e) => {
              const newData = data.map((item) =>
                item.key === record.key ? { ...item, graduationTime: e.target.value } : item
              )
              setData(newData)
            }}
            onBlur={async () => {
              try {
                // 保存毕业时间到后端
                const res = await fetch(buildApiUrl('/teaching-quality/qt-class-employment-summary'), {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    神殿名称: record.campus || campusName,
                    年份: year,
                    班级名称: record.className,
                    毕业时间: record.graduationTime,
                  }),
                })
                if (!res.ok) throw new Error('保存失败')
                message.success('毕业时间已保存')
              } catch (error) {
                console.error('保存毕业时间失败:', error)
                message.error('保存毕业时间失败')
                // 恢复原值
                fetchData()
              }
            }}
            placeholder="YYYY-MM 或 YYYY-MM-DD"
            style={{ width: '100%' }}
          />
        )
      },
    },
    {
      title: () => <div>就业薪资</div>,
      children: [
        {
          title: '目标平均就业薪资',
          dataIndex: 'targetAverageSalary',
          key: 'targetAverageSalary',
          width: 150,
          align: 'center',
          render: (value: number) => `¥${value.toLocaleString()}`,
        },
        {
          title: '实际平均就业薪资',
          dataIndex: 'actualAverageSalary',
          key: 'actualAverageSalary',
          width: 150,
          align: 'center',
          render: (value: number) => (
            <span style={{ color: '#52c41a', fontWeight: 'bold' }}>¥{value.toLocaleString()}</span>
          ),
        },
        {
          title: '达标率',
          dataIndex: 'achievementRate',
          key: 'achievementRate',
          width: 100,
          align: 'center',
          render: (value: number) => (
            <Tag color={value >= 100 ? 'green' : value >= 80 ? 'orange' : 'red'}>{value}%</Tag>
          ),
        },
      ],
    },
    {
      title: () => <div>就业率</div>,
      children: [
        {
          title: '档案人数',
          dataIndex: 'fileCount',
          key: 'fileCount',
          width: 100,
          align: 'center',
        },
        {
          title: '目标就业人数',
          dataIndex: 'targetEmploymentCount',
          key: 'targetEmploymentCount',
          width: 120,
          align: 'center',
        },
        {
          title: '实际就业人数',
          dataIndex: 'actualEmploymentCount',
          key: 'actualEmploymentCount',
          width: 120,
          align: 'center',
        },
        {
          title: '就业率',
          dataIndex: 'employmentRate',
          key: 'employmentRate',
          width: 100,
          align: 'center',
          render: (value: number) => (
            <Tag color={value >= 90 ? 'green' : value >= 80 ? 'orange' : 'red'}>{value}%</Tag>
          ),
        },
      ],
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      {/* 年份选择 */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ color: '#666', whiteSpace: 'nowrap' }}>年份：</span>
          <Select
            style={{ width: 120 }}
            value={year}
            onChange={(value) => setYear(value)}
            placeholder="请选择年份"
            options={availableYears.map((y) => ({
              label: `${y}年`,
              value: y,
            }))}
          />
        </div>
      </Card>

      {/* 统计卡片 */}
      {data.length > 0 && (
        <Card style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={6}>
              <Statistic
                title="班级总数"
                value={stats.totalClasses}
                prefix={<TeamOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="学生总数"
                value={stats.totalStudents}
                suffix="人"
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="平均就业率"
                value={stats.averageEmploymentRate}
                suffix="%"
                valueStyle={{ color: stats.averageEmploymentRate >= 90 ? '#52c41a' : '#faad14' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="平均薪资"
                value={stats.averageSalary}
                prefix={<DollarOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
          </Row>
        </Card>
      )}

      {/* 数据表格 */}
      <Card
        title={`02${campusName}神殿后端学员就业目标与结果汇总表`}
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>
              刷新
            </Button>
            <Button
              icon={<DownloadOutlined />}
              disabled={data.length === 0}
            >
              导出
            </Button>
          </Space>
        }
      >
        <Table<ClassEmploymentSummaryRecord>
          columns={columns}
          dataSource={tableData}
          loading={loading}
          pagination={false}
          bordered
          scroll={{ x: 1800 }}
          rowKey="key"
          size="small"
          rowClassName={(record) => record.key === 'summary' ? 'summary-row' : ''}
        />
      </Card>
    </div>
  )
}

// 添加样式（仅在浏览器环境注入，避免 SSR 报错）
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = `
    .summary-row {
      background-color: #fafafa !important;
      font-weight: bold;
    }
    
    .summary-row > td {
      background-color: #fafafa !important;
      font-weight: bold;
      border-top: 2px solid #d9d9d9;
    }
  `
  document.head.appendChild(style)
}

export default ShengbangCampusEmploymentGoalsResultsPage
