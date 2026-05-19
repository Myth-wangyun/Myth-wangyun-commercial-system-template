import React, { useEffect, useState } from 'react'
import { App, Table, Card, Typography, Space, Input, Button, Row, Col, Statistic, Select, Spin } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  SearchOutlined,
  ReloadOutlined,
  DownloadOutlined,
  UserOutlined,
  TeamOutlined,
  TrophyOutlined,
} from '@ant-design/icons'
import { useCampusStore } from '@/stores/campusStore'
import { teacherRatioService } from '@/services/teaching-quality/teacherRatio'

// 定义表格数据的接口
interface TeacherStaffingRecord {
  key: string
  statisticsTime: string // 统计时间
  campus: string // 神殿
  totalStudents: number // 学生总人数
  // 职数分析
  targetTeacherStudentRatio: string // 目标师生数比
  targetTeacherCount: number // 目标老师总数
  actualTeacherCount: number // 实际老师总数
  teacherVacancies: number // 班主任空岗数
  teacherSurplus: number // 班主任冗余数
  // 干部职数分析
  targetManagerTeacherRatio: string // 目标中层与班主任比
  targetManagerCount: number // 目标中层人数
  actualManagerCount: number // 实际中层人数
  managerVacancies: number // 中层空缺数
  managerSurplus: number // 中层冗余职数
}

// 无示例数据，全部从数据库读取
const calculateTotals = (data: TeacherStaffingRecord[]) => {
  if (data.length === 0) {
    return {
      key: 'total',
      statisticsTime: '',
      campus: '合计/平均',
      totalStudents: 0,
      targetTeacherStudentRatio: '',
      targetTeacherCount: 0,
      actualTeacherCount: 0,
      teacherVacancies: 0,
      teacherSurplus: 0,
      targetManagerTeacherRatio: '',
      targetManagerCount: 0,
      actualManagerCount: 0,
      managerVacancies: 0,
      managerSurplus: 0,
    }
  }

  const totals = data.reduce(
    (acc, curr) => {
      acc.totalStudents += curr.totalStudents
      acc.targetTeacherCount += curr.targetTeacherCount
      acc.actualTeacherCount += curr.actualTeacherCount
      acc.teacherVacancies += curr.teacherVacancies
      acc.teacherSurplus += curr.teacherSurplus
      acc.targetManagerCount += curr.targetManagerCount
      acc.actualManagerCount += curr.actualManagerCount
      acc.managerVacancies += curr.managerVacancies
      acc.managerSurplus += curr.managerSurplus
      return acc
    },
    {
      totalStudents: 0,
      targetTeacherCount: 0,
      actualTeacherCount: 0,
      teacherVacancies: 0,
      teacherSurplus: 0,
      targetManagerCount: 0,
      actualManagerCount: 0,
      managerVacancies: 0,
      managerSurplus: 0,
    },
  )

  return {
    key: 'total',
    statisticsTime: '',
    campus: '合计/平均',
    ...totals,
    targetTeacherStudentRatio: '',
    targetManagerTeacherRatio: '',
  }
}

const TeacherStaffingRatioTable: React.FC = () => {
  const { message } = App.useApp()
  const campusStore = useCampusStore()
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState<number>(currentYear)
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [allData, setAllData] = useState<TeacherStaffingRecord[]>([])
  const [filteredData, setFilteredData] = useState<TeacherStaffingRecord[]>([])

  const buildCampusRow = (campus: string, monthly: any[]): TeacherStaffingRecord => {
    // teacherRatioService.getTeacherRatioData 返回的是 1~12 月 + 合计行（month=13,isTotal=true）。
    // 若请求失败 catch 返回 []。这里确保始终按数组处理，避免 monthly 不是数组时 rows 为空导致整表看似“无数据”。
    const rows = (Array.isArray(monthly) ? monthly : []).filter((r: any) => r.month > 0 && !r.isTotal)

    // 策略：
    // 1) 对“学生总人数”优先取当年最后一个月（通常更接近当前在档情况），没有则取最近一个有值的月份
    // 2) 其他指标（配比/职数/空缺/冗余）优先取“最近一个有值的月份”（避免 12 月为 0 导致整行空白）
    const lastMonthRow = [...rows].reverse().find((r) => (r.month ?? 0) > 0) || { month: 0 }

    // 优先选择最后一个“实际老师数量”或“学生总人数”>0 的月份，避免选到只有配比但其他全为 0/null 的月份（如 12 月）。
    const meaningfulRow = [...rows]
      .reverse()
      .find((r) => (Number(r.actualTeacherCount) || 0) > 0 || (Number(r.studentTotal) || 0) > 0)

    const nonEmpty =
      meaningfulRow ||
      [...rows]
        .reverse()
        .find(
          (r) =>
            (r.targetStudentTeacherRatio ?? '') ||
            (r.targetTeacherCount ?? 0) ||
            (r.actualTeacherCount ?? 0) ||
            (r.headmasterVacancy ?? 0) ||
            (r.headmasterRedundancy ?? 0) ||
            (r.targetMiddleManagementRatio ?? '') ||
            (r.targetMiddleManagementCount ?? 0) ||
            (r.actualMiddleManagementCount ?? 0) ||
            (r.middleManagementVacancy ?? 0) ||
            (r.middleManagementRedundancy ?? 0),
        ) ||
      // 再兜底：优先 12 月，其次第一行
      rows.find((r: any) => r.month === 12) ||
      rows[0] ||
      { month: 0 }

    const m = Number(nonEmpty?.month || lastMonthRow?.month || 0)
    const mm = String(m).padStart(2, '0')

    return {
      key: campus,
      statisticsTime: m ? `${year}-${mm}` : `${year}-01`,
      campus,
      // 学生总人数：优先用当年最后一个月的 studentTotal（避免“最后有职数数据的月份”学生数较旧）
      totalStudents: Number(lastMonthRow?.studentTotal || nonEmpty?.studentTotal || 0),
      targetTeacherStudentRatio: String(nonEmpty?.targetStudentTeacherRatio || ''),
      targetTeacherCount: Number(nonEmpty?.targetTeacherCount || 0),
      actualTeacherCount: Number(nonEmpty?.actualTeacherCount || 0),
      teacherVacancies: Number(nonEmpty?.headmasterVacancy || 0),
      teacherSurplus: Number(nonEmpty?.headmasterRedundancy || 0),
      targetManagerTeacherRatio: String(nonEmpty?.targetMiddleManagementRatio || ''),
      targetManagerCount: Number(nonEmpty?.targetMiddleManagementCount || 0),
      actualManagerCount: Number(nonEmpty?.actualMiddleManagementCount || 0),
      managerVacancies: Number(nonEmpty?.middleManagementVacancy || 0),
      managerSurplus: Number(nonEmpty?.middleManagementRedundancy || 0),
    }
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const campusNames = campusStore.getAllCampuses().map((c) => c.name)
      const lists = await Promise.all(
        campusNames.map((name) => teacherRatioService.getTeacherRatioData(name, year).catch(() => [])),
      )
      const rows = campusNames.map((name, idx) => buildCampusRow(name, lists[idx] as any[]))

      // 汇总页：只显示“至少有一项有效数据”的神殿，避免 0/空 导致看起来“没显示”。
      const displayRows = rows.filter((r) => {
        if (!r || r.key === 'total') return false
        return (
          (r.totalStudents ?? 0) > 0 ||
          (r.targetTeacherCount ?? 0) > 0 ||
          (r.actualTeacherCount ?? 0) > 0 ||
          (r.teacherVacancies ?? 0) > 0 ||
          (r.teacherSurplus ?? 0) > 0 ||
          (r.targetManagerCount ?? 0) > 0 ||
          (r.actualManagerCount ?? 0) > 0 ||
          (r.managerVacancies ?? 0) > 0 ||
          (r.managerSurplus ?? 0) > 0 ||
          (r.targetTeacherStudentRatio ?? '') ||
          (r.targetManagerTeacherRatio ?? '')
        )
      })

      setAllData(displayRows)
      setFilteredData(
        searchText
          ? displayRows.filter((r) => r.campus.toLowerCase().includes(searchText.toLowerCase()))
          : displayRows,
      )
      message.success('数据加载成功')
    } catch (e) {
      console.error(e)
      message.error('加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [year])

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
    loadData()
  }

  const handleExport = () => {
    const csv = [
      '统计时间,神殿,学生总人数,目标师生配比,目标老师总数,实际老师总数,班主任空岗数,班主任冗余数,目标中层与班主任比,目标中层人数,实际中层人数,中层空缺数,中层冗余职数',
      ...filteredData.map(
        (r) => `${r.statisticsTime},${r.campus},${r.totalStudents},${r.targetTeacherStudentRatio},${r.targetTeacherCount},${r.actualTeacherCount},${r.teacherVacancies},${r.teacherSurplus},${r.targetManagerTeacherRatio},${r.targetManagerCount},${r.actualManagerCount},${r.managerVacancies},${r.managerSurplus}`,
      ),
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `教化司班主任师资配比_${year}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const columns: ColumnsType<TeacherStaffingRecord> = [
    {
      title: '序号',
      dataIndex: 'key',
      key: 'key',
      width: 80,
      fixed: 'left',
      render: (text, record, index) => (record.key === 'total' ? '' : index + 1),
    },
    {
      title: '统计时间',
      dataIndex: 'statisticsTime',
      key: 'statisticsTime',
      width: 120,
      fixed: 'left',
      render: (text) => text || '',
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
      title: '学生总人数',
      dataIndex: 'totalStudents',
      key: 'totalStudents',
      width: 120,
      render: (value, record) => {
        if (record.key === 'total') return value
        return value > 0 ? value : ''
      },
    },
    {
      title: '职数分析',
      children: [
        {
          title: '目标师生数比',
          dataIndex: 'targetTeacherStudentRatio',
          key: 'targetTeacherStudentRatio',
          width: 130,
          render: (text) => text || '',
        },
        {
          title: '目标老师总数',
          dataIndex: 'targetTeacherCount',
          key: 'targetTeacherCount',
          width: 130,
          render: (value, record) => {
            if (record.key === 'total') return value
            return value > 0 ? value : ''
          },
        },
        {
          title: '实际老师总数',
          dataIndex: 'actualTeacherCount',
          key: 'actualTeacherCount',
          width: 130,
          render: (value, record) => {
            if (record.key === 'total') return value
            return value > 0 ? value : ''
          },
        },
        {
          title: '班主任空岗数',
          dataIndex: 'teacherVacancies',
          key: 'teacherVacancies',
          width: 130,
          render: (value, record) => {
            if (record.key === 'total') return value
            return value > 0 ? value : ''
          },
        },
        {
          title: '班主任冗余数',
          dataIndex: 'teacherSurplus',
          key: 'teacherSurplus',
          width: 130,
          render: (value, record) => {
            if (record.key === 'total') return value
            return value > 0 ? value : ''
          },
        },
      ],
    },
    {
      title: '干部职数分析',
      children: [
        {
          title: '目标中层与班主任比',
          dataIndex: 'targetManagerTeacherRatio',
          key: 'targetManagerTeacherRatio',
          width: 170,
          render: (text) => text || '',
        },
        {
          title: '目标中层人数',
          dataIndex: 'targetManagerCount',
          key: 'targetManagerCount',
          width: 130,
          render: (value, record) => {
            if (record.key === 'total') return value
            return value > 0 ? value : ''
          },
        },
        {
          title: '实际中层人数',
          dataIndex: 'actualManagerCount',
          key: 'actualManagerCount',
          width: 130,
          render: (value, record) => {
            if (record.key === 'total') return value
            return value > 0 ? value : ''
          },
        },
        {
          title: '中层空缺数',
          dataIndex: 'managerVacancies',
          key: 'managerVacancies',
          width: 120,
          render: (value, record) => {
            if (record.key === 'total') return value
            return value > 0 ? value : ''
          },
        },
        {
          title: '中层冗余职数',
          dataIndex: 'managerSurplus',
          key: 'managerSurplus',
          width: 130,
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
  const totalStudents = summaryRow.totalStudents
  const totalTargetTeachers = summaryRow.targetTeacherCount
  const totalActualTeachers = summaryRow.actualTeacherCount
  const totalTeacherVacancies = summaryRow.teacherVacancies
  const totalTeacherSurplus = summaryRow.teacherSurplus
  const totalTargetManagers = summaryRow.targetManagerCount
  const totalActualManagers = summaryRow.actualManagerCount
  const totalManagerVacancies = summaryRow.managerVacancies

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
              title="目标老师总数"
              value={totalTargetTeachers}
              suffix="人"
              prefix={<TeamOutlined style={{ color: '#52c41a' }} />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="实际老师总数"
              value={totalActualTeachers}
              suffix="人"
              prefix={<TeamOutlined style={{ color: '#faad14' }} />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="班主任空岗数"
              value={totalTeacherVacancies}
              suffix="人"
              prefix={<UserOutlined style={{ color: '#f5222d' }} />}
            />
          </Col>
        </Row>
        <Row gutter={16} style={{ marginTop: 16 }}>
          <Col span={6}>
            <Statistic
              title="班主任冗余数"
              value={totalTeacherSurplus}
              suffix="人"
              prefix={<UserOutlined style={{ color: '#722ed1' }} />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="目标中层人数"
              value={totalTargetManagers}
              suffix="人"
              prefix={<TrophyOutlined style={{ color: '#13c2c2' }} />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="实际中层人数"
              value={totalActualManagers}
              suffix="人"
              prefix={<TrophyOutlined style={{ color: '#eb2f96' }} />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="中层空缺数"
              value={totalManagerVacancies}
              suffix="人"
              prefix={<TeamOutlined style={{ color: '#fa8c16' }} />}
            />
          </Col>
        </Row>
      </Card>

      {/* 数据表格 */}
      <Card
        title={`12最高议事厅教化司班主任师资配比表（${year}年）`}
        extra={
          <Space>
            <Select value={year} style={{ width: 120 }} onChange={setYear}>
              {[0,1,2].map((i) => {
                const y = currentYear - i
                return (
                  <Select.Option key={y} value={y}>{y}年</Select.Option>
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
            <Button icon={<DownloadOutlined />} onClick={handleExport} disabled={filteredData.length===0}>
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
            rowClassName={(record) => (record.key === 'total' ? 'summary-row' : '')}
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

export default TeacherStaffingRatioTable
