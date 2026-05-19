/**
 * 后端新生每日安排表（只读版本）
 * 从教化司后端获取数据，智慧司只读展示
 */
import React, { useState, useEffect, useMemo } from 'react'
import { App,
  Card,
  Row,
  Col,
  Typography,
  Button,
  Table,
  Space,
  DatePicker,
  Statistic,
  Input,
  Segmented,
} from 'antd'
import {
  ReloadOutlined,
  DownloadOutlined,
  UserOutlined,
  DollarOutlined,
  TeamOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useCampusStore } from '@/stores/campusStore'
import { buildApiUrl } from '@/utils/apiBase'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { RangePicker } = DatePicker

interface DailyNewStudentRecord {
  key: string
  index: number
  studentName: string
  age?: number
  gender?: '男' | '女'
  major?: string
  eduSystem?: string
  concern?: string
  shouldPay?: number
  paidAmount?: number
  debtAmount?: number
  estimatedPayDate?: string
  courseContent?: string
  courseLocation?: string
  enrollDate?: string
  courseDays?: number
  planner?: string
  homeroomTeacher?: string
  instructor?: string
  remark?: string
  filler?: string
  fillDate?: string
}

interface ServiceStats {
  totalStudents: number
  totalReceivable: number
  totalReceived: number
  totalOwed: number
}

const NewStudentArrangementReadOnly: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<DailyNewStudentRecord[]>([])
  
  // 日期模式：单日 / 范围
  const [dateMode, setDateMode] = useState<'single' | 'range'>('single')
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [dateRange, setDateRange] = useState<[string, string]>([
    dayjs().format('YYYY-MM-DD'),
    dayjs().format('YYYY-MM-DD'),
  ])
  
  // 搜索筛选
  const [searchStudentName, setSearchStudentName] = useState('')
  const [searchInstructor, setSearchInstructor] = useState('')
  const [searchHomeroomTeacher, setSearchHomeroomTeacher] = useState('')

  // 筛选后的数据
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const studentNameMatch = !searchStudentName || 
        (item.studentName || '').toLowerCase().includes(searchStudentName.toLowerCase())
      const instructorMatch = !searchInstructor || 
        (item.instructor || '').toLowerCase().includes(searchInstructor.toLowerCase())
      const homeroomTeacherMatch = !searchHomeroomTeacher || 
        (item.homeroomTeacher || '').toLowerCase().includes(searchHomeroomTeacher.toLowerCase())
      return studentNameMatch && instructorMatch && homeroomTeacherMatch
    })
  }, [data, searchStudentName, searchInstructor, searchHomeroomTeacher])

  // 统计数据（基于筛选后的数据）
  const stats = useMemo<ServiceStats>(() => {
    return {
      totalStudents: filteredData.length,
      totalReceivable: filteredData.reduce((sum, item) => sum + (item.shouldPay || 0), 0),
      totalReceived: filteredData.reduce((sum, item) => sum + (item.paidAmount || 0), 0),
      totalOwed: filteredData.reduce((sum, item) => sum + (item.debtAmount || 0), 0),
    }
  }, [filteredData])

  // 从教化司后端加载数据
  const loadFromBackend = async () => {
    if (!currentCampus) {
      message.warning('请先选择神殿')
      return
    }
    try {
      setLoading(true)
      
      // 根据日期模式构建请求
      if (dateMode === 'single') {
        // 单日模式
        const url = `${buildApiUrl('/teaching-quality/daily-new-student-schedule')}?campus=${encodeURIComponent(currentCampus)}&date=${selectedDate}`
        const res = await fetch(url)
        if (!res.ok) throw new Error(await res.text())
        const result = await res.json() as { 行列表: any[] }
        const rows = mapRowsFromBackend(result.行列表 || [])
        setData(rows)
      } else {
        // 范围模式：遍历日期范围获取所有数据
        const startDate = dayjs(dateRange[0])
        const endDate = dayjs(dateRange[1])
        const allRows: DailyNewStudentRecord[] = []
        let currentDate = startDate
        
        while (currentDate.isBefore(endDate) || currentDate.isSame(endDate, 'day')) {
          const dateStr = currentDate.format('YYYY-MM-DD')
          const url = `${buildApiUrl('/teaching-quality/daily-new-student-schedule')}?campus=${encodeURIComponent(currentCampus)}&date=${dateStr}`
          try {
            const res = await fetch(url)
            if (res.ok) {
              const result = await res.json() as { 行列表: any[] }
              const rows = mapRowsFromBackend(result.行列表 || [], dateStr)
              allRows.push(...rows)
            }
          } catch {
            // 忽略单日错误，继续下一天
          }
          currentDate = currentDate.add(1, 'day')
        }
        
        // 重新编号
        const reindexed = allRows.map((r, idx) => ({ ...r, key: String(idx + 1), index: idx + 1 }))
        setData(reindexed)
      }
    } catch (e: any) {
      console.error(e)
      message.error('加载失败：' + (e?.message || '未知错误'))
    } finally {
      setLoading(false)
    }
  }
  
  // 映射后端数据到前端结构
  const mapRowsFromBackend = (rows: any[], dateStr?: string): DailyNewStudentRecord[] => {
    return rows.map((r, idx) => ({
      key: String(idx + 1),
      index: r.序号 || idx + 1,
      studentName: r.姓名 || '',
      age: r.年龄 ?? undefined,
      gender: r.性别 || '男',
      major: r.所报专业 || '',
      eduSystem: r.学制 || '',
      concern: r.抗拒点关注点 || '',
      shouldPay: r.应收金额 ?? undefined,
      paidAmount: r.已收金额 ?? undefined,
      debtAmount: r.欠费金额 ?? undefined,
      estimatedPayDate: r.预计回款时间 || undefined,
      courseContent: r.授课内容 || '',
      courseLocation: r.授课地点 || '',
      enrollDate: r.入学日期 || undefined,
      courseDays: r.上课天数 ?? undefined,
      planner: r.规划师 || '',
      homeroomTeacher: r.班主任 || '',
      instructor: r.教员 || '',
      remark: r.备注 || '',
      filler: r.填表人 || '',
      fillDate: dateStr || r.填表时间 || undefined,
    }))
  }

  useEffect(() => {
    if (currentCampus) {
      loadFromBackend()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCampus, dateMode, selectedDate, dateRange])

  // 导出数据为 CSV（导出筛选后的数据）
  const handleExport = () => {
    if (filteredData.length === 0) {
      message.warning('没有数据可导出')
      return
    }

    const headers = [
      '序号',
      '新生姓名',
      '年龄',
      '性别',
      '所报专业',
      '学制',
      '抗拒点/关注点',
      '应收金额',
      '已收金额',
      '欠费金额',
      '预计回款时间',
      '授课内容',
      '授课地点',
      '入学日期',
      '上课天数',
      '规划师',
      '班主任',
      '教员',
      '备注',
      '填表人',
      '填表时间',
    ]

    const rows = filteredData.map((item, index) => [
      index + 1,
      item.studentName || '',
      item.age || '',
      item.gender || '',
      item.major || '',
      item.eduSystem || '',
      item.concern || '',
      item.shouldPay || 0,
      item.paidAmount || 0,
      item.debtAmount || 0,
      item.estimatedPayDate || '',
      item.courseContent || '',
      item.courseLocation || '',
      item.enrollDate || '',
      item.courseDays || 0,
      item.planner || '',
      item.homeroomTeacher || '',
      item.instructor || '',
      item.remark || '',
      item.filler || '',
      item.fillDate || '',
    ])

    const BOM = '\uFEFF'
    const csvContent =
      BOM +
      [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${currentCampus || ''}每日新生安排表_${selectedDate}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    message.success('导出成功')
  }

  // 表格列定义
  const columns: ColumnsType<DailyNewStudentRecord> = [
    {
      title: '序号',
      dataIndex: 'index',
      key: 'index',
      width: 70,
      align: 'center',
    },
    {
      title: '新生姓名',
      dataIndex: 'studentName',
      key: 'studentName',
      width: 100,
      render: (text: string) => (
        <div style={{ fontWeight: 'bold' }}>
          <UserOutlined style={{ marginRight: 4 }} />
          {text}
        </div>
      ),
    },
    {
      title: '年龄',
      dataIndex: 'age',
      key: 'age',
      width: 70,
      align: 'center',
    },
    {
      title: '性别',
      dataIndex: 'gender',
      key: 'gender',
      width: 70,
      align: 'center',
    },
    {
      title: '所报专业',
      dataIndex: 'major',
      key: 'major',
      width: 120,
    },
    {
      title: '学制',
      dataIndex: 'eduSystem',
      key: 'eduSystem',
      width: 100,
    },
    {
      title: '抗拒点/关注点',
      dataIndex: 'concern',
      key: 'concern',
      width: 150,
      ellipsis: true,
    },
    {
      title: '应收金额',
      dataIndex: 'shouldPay',
      key: 'shouldPay',
      width: 100,
      align: 'right',
      render: (value?: number) => (value ? `¥${value.toLocaleString()}` : ''),
    },
    {
      title: '已收金额',
      dataIndex: 'paidAmount',
      key: 'paidAmount',
      width: 100,
      align: 'right',
      render: (value?: number) => (value ? `¥${value.toLocaleString()}` : ''),
    },
    {
      title: '欠费金额',
      dataIndex: 'debtAmount',
      key: 'debtAmount',
      width: 100,
      align: 'right',
      render: (value?: number) =>
        value ? <span style={{ color: '#ff4d4f' }}>¥{value.toLocaleString()}</span> : '',
    },
    {
      title: '预计回款时间',
      dataIndex: 'estimatedPayDate',
      key: 'estimatedPayDate',
      width: 120,
    },
    {
      title: '授课内容',
      dataIndex: 'courseContent',
      key: 'courseContent',
      width: 120,
      ellipsis: true,
    },
    {
      title: '授课地点',
      dataIndex: 'courseLocation',
      key: 'courseLocation',
      width: 100,
    },
    {
      title: '入学日期',
      dataIndex: 'enrollDate',
      key: 'enrollDate',
      width: 110,
    },
    {
      title: '上课天数',
      dataIndex: 'courseDays',
      key: 'courseDays',
      width: 90,
      align: 'center',
    },
    {
      title: '规划师',
      dataIndex: 'planner',
      key: 'planner',
      width: 100,
    },
    {
      title: '班主任',
      dataIndex: 'homeroomTeacher',
      key: 'homeroomTeacher',
      width: 100,
    },
    {
      title: '教员',
      dataIndex: 'instructor',
      key: 'instructor',
      width: 100,
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      width: 150,
      ellipsis: true,
    },
    {
      title: '填表人',
      dataIndex: 'filler',
      key: 'filler',
      width: 100,
    },
    {
      title: '填表时间',
      dataIndex: 'fillDate',
      key: 'fillDate',
      width: 110,
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 16 }}>
          <Col flex="auto">
            <Title level={4} style={{ margin: 0 }}>
              {currentCampus ? `${currentCampus}后端新生每日安排表` : '后端新生每日安排表'}
            </Title>
          </Col>
          <Col>
            <Space wrap>
              <Segmented
                options={[
                  { label: '单日', value: 'single' },
                  { label: '范围', value: 'range' },
                ]}
                value={dateMode}
                onChange={(v) => setDateMode(v as 'single' | 'range')}
              />
              {dateMode === 'single' ? (
                <DatePicker
                  value={dayjs(selectedDate)}
                  onChange={(date) => setSelectedDate(date ? date.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'))}
                  allowClear={false}
                />
              ) : (
                <RangePicker
                  value={[dayjs(dateRange[0]), dayjs(dateRange[1])]}
                  onChange={(dates) => {
                    if (dates && dates[0] && dates[1]) {
                      setDateRange([dates[0].format('YYYY-MM-DD'), dates[1].format('YYYY-MM-DD')])
                    }
                  }}
                  allowClear={false}
                />
              )}
              <Button icon={<ReloadOutlined />} onClick={loadFromBackend} loading={loading}>
                刷新
              </Button>
              <Button icon={<DownloadOutlined />} onClick={handleExport}>
                导出
              </Button>
            </Space>
          </Col>
        </Row>
        
        {/* 搜索筛选 */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Input
              placeholder="搜索新生姓名"
              prefix={<SearchOutlined />}
              value={searchStudentName}
              onChange={(e) => setSearchStudentName(e.target.value)}
              allowClear
            />
          </Col>
          <Col span={6}>
            <Input
              placeholder="搜索班主任姓名"
              prefix={<SearchOutlined />}
              value={searchHomeroomTeacher}
              onChange={(e) => setSearchHomeroomTeacher(e.target.value)}
              allowClear
            />
          </Col>
          <Col span={6}>
            <Input
              placeholder="搜索教员姓名"
              prefix={<SearchOutlined />}
              value={searchInstructor}
              onChange={(e) => setSearchInstructor(e.target.value)}
              allowClear
            />
          </Col>
          <Col span={6}>
            <Button
              onClick={() => {
                setSearchStudentName('')
                setSearchHomeroomTeacher('')
                setSearchInstructor('')
              }}
            >
              清空筛选
            </Button>
          </Col>
        </Row>

        {/* 统计卡片 */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="新生总数"
                value={stats.totalStudents}
                prefix={<TeamOutlined />}
                suffix="人"
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="应收总额"
                value={stats.totalReceivable}
                prefix={<DollarOutlined />}
                precision={0}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="已收总额"
                value={stats.totalReceived}
                prefix={<DollarOutlined />}
                precision={0}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="欠费总额"
                value={stats.totalOwed}
                prefix={<DollarOutlined />}
                precision={0}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
        </Row>

        {/* 数据表格 */}
        <Table<DailyNewStudentRecord>
          columns={columns}
          dataSource={filteredData}
          rowKey="key"
          loading={loading}
          pagination={false}
          scroll={{ x: 'max-content' }}
          bordered
          size="small"
        />
      </Card>
    </div>
  )
}

export default NewStudentArrangementReadOnly
