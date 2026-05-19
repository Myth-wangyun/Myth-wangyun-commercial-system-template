// 教员模块 - 就业跟踪（KPI月度汇总 / 就业明细 / 月度周推进）
import React, { useEffect, useMemo, useState } from 'react'
import { App,
  Card,
  Tabs,
  Table,
  Typography,
  Space,
  Button,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Row,
  Col,
  Popconfirm,
} from 'antd'
import {
  PlusOutlined,
  DownloadOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import CampusSelector from '@/components/common/CampusSelector'
import { useCampusStore } from '@/stores/campusStore'

const { Title } = Typography
const { Option } = Select

// KPI 月度汇总
interface MonthlyKPIRecord {
  id: string
  month: string // YYYY-MM
  campus: string
  className: string
  major: string
  schooling: string
  teacher?: string
  headTeacher?: string
  graduateAt?: string // YYYY-MM-DD
  targetAvgSalary?: number
  actualAvgSalary?: number
  archiveCount?: number
  targetEmpCount?: number
  actualEmpCount?: number
  salaryOver10k?: number
  remark?: string
}

// 就业明细
interface EmploymentDetailRecord {
  id: string
  name: string
  gender?: string
  age?: number
  degree?: string
  className: string
  major: string
  schooling: string
  onboardAt?: string // YYYY-MM-DD
  city?: string
  company?: string
  jobTitle?: string
  salary?: number
  remark?: string
}

// 月度周推进
interface WeeklyTrackingRecord {
  id: string
  month: string // YYYY-MM
  weekNo: number // 1..5
  className?: string
  major?: string
  teacher?: string
  resumeSubmitted?: number
  interviews?: number
  offers?: number
  onboard?: number
  over10k?: number
  remark?: string
}

const currency = (v?: number) => (v == null ? '' : Math.round(v).toString())
const percent = (num?: number, den?: number) => {
  if (!num || !den) return ''
  if (den === 0) return ''
  return `${((num / den) * 100).toFixed(1)}%`
}

const exportCsv = (filename: string, headers: string[], rows: any[][]) => {
  const csv = [headers, ...rows].map((r) => r.map((c) => `"${c ?? ''}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `${filename}_${dayjs().format('YYYY-MM-DD')}.csv`
  a.click()
}

const EmploymentTrackingPage: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore()

  // 查询条件
  const [queryMonth, setQueryMonth] = useState<string>(dayjs().format('YYYY-MM'))
  const [keyword, setKeyword] = useState<string>('')

  // KPI 月度汇总
  const [kpiRows, setKpiRows] = useState<MonthlyKPIRecord[]>([])
  const [kpiOpen, setKpiOpen] = useState(false)
  const [kpiForm] = Form.useForm()
  const [kpiEditing, setKpiEditing] = useState<MonthlyKPIRecord | null>(null)

  // 就业明细
  const [detailRows, setDetailRows] = useState<EmploymentDetailRecord[]>([])
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailForm] = Form.useForm()
  const [detailEditing, setDetailEditing] = useState<EmploymentDetailRecord | null>(null)

  // 周推进
  const [weeklyRows, setWeeklyRows] = useState<WeeklyTrackingRecord[]>([])
  const [weeklyOpen, setWeeklyOpen] = useState(false)
  const [weeklyForm] = Form.useForm()
  const [weeklyEditing, setWeeklyEditing] = useState<WeeklyTrackingRecord | null>(null)

  const kpiKey = (c?: string | null) => `tracking_kpi_${c || '主神殿'}`
  const detailKey = (c?: string | null) => `tracking_detail_${c || '主神殿'}`
  const weeklyKey = (c?: string | null) => `tracking_weekly_${c || '主神殿'}`

  useEffect(() => {
    const load = <T,>(key: string, def: T[]) => {
      try {
        const raw = localStorage.getItem(key)
        return raw ? (JSON.parse(raw) as T[]) : def
      } catch {
        return def
      }
    }
    setKpiRows(load(kpiKey(currentCampus), []))
    setDetailRows(load(detailKey(currentCampus), []))
    setWeeklyRows(load(weeklyKey(currentCampus), []))
  }, [currentCampus])

  useEffect(() => {
    try {
      localStorage.setItem(kpiKey(currentCampus), JSON.stringify(kpiRows))
    } catch {}
  }, [kpiRows, currentCampus])
  useEffect(() => {
    try {
      localStorage.setItem(detailKey(currentCampus), JSON.stringify(detailRows))
    } catch {}
  }, [detailRows, currentCampus])
  useEffect(() => {
    try {
      localStorage.setItem(weeklyKey(currentCampus), JSON.stringify(weeklyRows))
    } catch {}
  }, [weeklyRows, currentCampus])

  // 过滤
  const filteredKpi = useMemo(
    () => kpiRows.filter((r) => r.month?.startsWith(queryMonth)),
    [kpiRows, queryMonth],
  )
  const filteredDetail = useMemo(
    () =>
      detailRows.filter((r) =>
        keyword
          ? r.name?.includes(keyword) ||
            r.className?.includes(keyword) ||
            r.company?.includes(keyword)
          : true,
      ),
    [detailRows, keyword],
  )
  const filteredWeekly = useMemo(
    () => weeklyRows.filter((r) => r.month?.startsWith(queryMonth)),
    [weeklyRows, queryMonth],
  )

  // KPI columns
  const kpiColumns: ColumnsType<MonthlyKPIRecord> = [
    { title: '月份', dataIndex: 'month', key: 'month', width: 100 },
    { title: '班级名称', dataIndex: 'className', key: 'className', width: 120 },
    { title: '专业', dataIndex: 'major', key: 'major', width: 100 },
    { title: '学制', dataIndex: 'schooling', key: 'schooling', width: 90 },
    { title: '授课教员', dataIndex: 'teacher', key: 'teacher', width: 100 },
    { title: '班主任', dataIndex: 'headTeacher', key: 'headTeacher', width: 100 },
    { title: '毕业时间', dataIndex: 'graduateAt', key: 'graduateAt', width: 120 },
    {
      title: '目标平均薪资',
      dataIndex: 'targetAvgSalary',
      key: 'targetAvgSalary',
      align: 'right',
      width: 120,
      render: currency,
    },
    {
      title: '实际平均薪资',
      dataIndex: 'actualAvgSalary',
      key: 'actualAvgSalary',
      align: 'right',
      width: 120,
      render: currency,
    },
    {
      title: '达标率',
      key: 'achRate',
      align: 'center',
      width: 90,
      render: (_, r) => percent(r.actualAvgSalary, r.targetAvgSalary),
    },
    {
      title: '档案人数',
      dataIndex: 'archiveCount',
      key: 'archiveCount',
      align: 'right',
      width: 100,
    },
    {
      title: '目标就业人数',
      dataIndex: 'targetEmpCount',
      key: 'targetEmpCount',
      align: 'right',
      width: 120,
    },
    {
      title: '实际就业人数',
      dataIndex: 'actualEmpCount',
      key: 'actualEmpCount',
      align: 'right',
      width: 120,
    },
    {
      title: '就业率',
      key: 'empRate',
      align: 'center',
      width: 90,
      render: (_, r) => percent(r.actualEmpCount, r.targetEmpCount),
    },
    {
      title: '过万人数',
      dataIndex: 'salaryOver10k',
      key: 'salaryOver10k',
      align: 'right',
      width: 100,
    },
    { title: '备注', dataIndex: 'remark', key: 'remark', width: 160 },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 130,
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            type="link"
            icon={<EditOutlined />}
            onClick={() => onEditKpi(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除?"
            onConfirm={() => setKpiRows((prev) => prev.filter((x) => x.id !== record.id))}
          >
            <Button size="small" type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const onAddKpi = () => {
    setKpiEditing(null)
    kpiForm.resetFields()
    kpiForm.setFieldsValue({ month: dayjs(queryMonth), campus: currentCampus || '主神殿' })
    setKpiOpen(true)
  }
  const onEditKpi = (rec: MonthlyKPIRecord) => {
    setKpiEditing(rec)
    kpiForm.setFieldsValue({
      ...rec,
      month: rec.month ? dayjs(rec.month) : undefined,
      graduateAt: rec.graduateAt ? dayjs(rec.graduateAt) : undefined,
    })
    setKpiOpen(true)
  }
  const onSaveKpi = async () => {
    const v = await kpiForm.validateFields()
    const row: MonthlyKPIRecord = {
      ...(kpiEditing || { id: Date.now().toString() }),
      month: v.month?.format('YYYY-MM') || queryMonth,
      campus: v.campus,
      className: v.className,
      major: v.major,
      schooling: v.schooling,
      teacher: v.teacher,
      headTeacher: v.headTeacher,
      graduateAt: v.graduateAt?.format('YYYY-MM-DD'),
      targetAvgSalary: v.targetAvgSalary,
      actualAvgSalary: v.actualAvgSalary,
      archiveCount: v.archiveCount,
      targetEmpCount: v.targetEmpCount,
      actualEmpCount: v.actualEmpCount,
      salaryOver10k: v.salaryOver10k,
      remark: v.remark,
    }
    setKpiRows((prev) =>
      kpiEditing ? prev.map((x) => (x.id === row.id ? row : x)) : [...prev, row],
    )
    setKpiOpen(false)
    message.success(kpiEditing ? '已更新' : '已添加')
  }

  const kpiSummary = useMemo(() => {
    const n = filteredKpi.length || 0
    const sum = (f: keyof MonthlyKPIRecord) =>
      filteredKpi.reduce((a, r) => a + Number(r[f] ?? 0), 0)
    const avg = (total: number) => (n > 0 ? Math.round(total / n) : 0)
    const targetEmp = sum('targetEmpCount')
    const actualEmp = sum('actualEmpCount')
    const targetSalaryAvg = avg(sum('targetAvgSalary'))
    const actualSalaryAvg = avg(sum('actualAvgSalary'))
    return {
      targetSalaryAvg,
      actualSalaryAvg,
      archive: sum('archiveCount'),
      targetEmp,
      actualEmp,
      employ: targetEmp > 0 ? actualEmp / targetEmp : undefined,
      over10k: sum('salaryOver10k'),
    }
  }, [filteredKpi])

  // 就业明细 columns
  const detailColumns: ColumnsType<EmploymentDetailRecord> = [
    { title: '学员姓名', dataIndex: 'name', key: 'name', width: 100 },
    { title: '性别', dataIndex: 'gender', key: 'gender', width: 70 },
    { title: '年龄', dataIndex: 'age', key: 'age', width: 70, align: 'right' },
    { title: '最高学历', dataIndex: 'degree', key: 'degree', width: 100 },
    { title: '班级名称', dataIndex: 'className', key: 'className', width: 120 },
    { title: '专业', dataIndex: 'major', key: 'major', width: 100 },
    { title: '学制', dataIndex: 'schooling', key: 'schooling', width: 90 },
    { title: '入职时间', dataIndex: 'onboardAt', key: 'onboardAt', width: 120 },
    { title: '就业地区', dataIndex: 'city', key: 'city', width: 120 },
    { title: '就业单位', dataIndex: 'company', key: 'company', width: 160 },
    { title: '就业岗位', dataIndex: 'jobTitle', key: 'jobTitle', width: 120 },
    {
      title: '就业薪资',
      dataIndex: 'salary',
      key: 'salary',
      width: 100,
      align: 'right',
      render: currency,
    },
    { title: '备注', dataIndex: 'remark', key: 'remark', width: 160 },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 130,
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            type="link"
            icon={<EditOutlined />}
            onClick={() => onEditDetail(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除?"
            onConfirm={() => setDetailRows((prev) => prev.filter((x) => x.id !== record.id))}
          >
            <Button size="small" type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const onAddDetail = () => {
    setDetailEditing(null)
    detailForm.resetFields()
    setDetailOpen(true)
  }
  const onEditDetail = (rec: EmploymentDetailRecord) => {
    setDetailEditing(rec)
    detailForm.setFieldsValue({
      ...rec,
      onboardAt: rec.onboardAt ? dayjs(rec.onboardAt) : undefined,
    })
    setDetailOpen(true)
  }
  const onSaveDetail = async () => {
    const v = await detailForm.validateFields()
    const row: EmploymentDetailRecord = {
      ...(detailEditing || { id: Date.now().toString() }),
      name: v.name,
      gender: v.gender,
      age: v.age,
      degree: v.degree,
      className: v.className,
      major: v.major,
      schooling: v.schooling,
      onboardAt: v.onboardAt?.format('YYYY-MM-DD'),
      city: v.city,
      company: v.company,
      jobTitle: v.jobTitle,
      salary: v.salary,
      remark: v.remark,
    }
    setDetailRows((prev) =>
      detailEditing ? prev.map((x) => (x.id === row.id ? row : x)) : [...prev, row],
    )
    setDetailOpen(false)
    message.success(detailEditing ? '已更新' : '已添加')
  }

  // 周推进 columns
  const weeklyColumns: ColumnsType<WeeklyTrackingRecord> = [
    { title: '月份', dataIndex: 'month', key: 'month', width: 100 },
    { title: '周次', dataIndex: 'weekNo', key: 'weekNo', width: 70, align: 'center' },
    { title: '班级', dataIndex: 'className', key: 'className', width: 110 },
    { title: '专业', dataIndex: 'major', key: 'major', width: 100 },
    { title: '授课教员', dataIndex: 'teacher', key: 'teacher', width: 100 },
    {
      title: '推荐数',
      dataIndex: 'resumeSubmitted',
      key: 'resumeSubmitted',
      align: 'right',
      width: 100,
    },
    { title: '面试数', dataIndex: 'interviews', key: 'interviews', align: 'right', width: 100 },
    { title: 'Offer数', dataIndex: 'offers', key: 'offers', align: 'right', width: 100 },
    { title: '入职数', dataIndex: 'onboard', key: 'onboard', align: 'right', width: 100 },
    { title: '过万人数', dataIndex: 'over10k', key: 'over10k', align: 'right', width: 100 },
    { title: '备注', dataIndex: 'remark', key: 'remark', width: 160 },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 130,
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            type="link"
            icon={<EditOutlined />}
            onClick={() => onEditWeekly(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除?"
            onConfirm={() => setWeeklyRows((prev) => prev.filter((x) => x.id !== record.id))}
          >
            <Button size="small" type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const onAddWeekly = () => {
    setWeeklyEditing(null)
    weeklyForm.resetFields()
    weeklyForm.setFieldsValue({ month: dayjs(queryMonth), weekNo: 1 })
    setWeeklyOpen(true)
  }
  const onEditWeekly = (rec: WeeklyTrackingRecord) => {
    setWeeklyEditing(rec)
    weeklyForm.setFieldsValue({ ...rec, month: rec.month ? dayjs(rec.month) : undefined })
    setWeeklyOpen(true)
  }
  const onSaveWeekly = async () => {
    const v = await weeklyForm.validateFields()
    const row: WeeklyTrackingRecord = {
      ...(weeklyEditing || { id: Date.now().toString() }),
      month: v.month?.format('YYYY-MM') || queryMonth,
      weekNo: v.weekNo,
      className: v.className,
      major: v.major,
      teacher: v.teacher,
      resumeSubmitted: v.resumeSubmitted,
      interviews: v.interviews,
      offers: v.offers,
      onboard: v.onboard,
      over10k: v.over10k,
      remark: v.remark,
    }
    setWeeklyRows((prev) =>
      weeklyEditing ? prev.map((x) => (x.id === row.id ? row : x)) : [...prev, row],
    )
    setWeeklyOpen(false)
    message.success(weeklyEditing ? '已更新' : '已添加')
  }

  const tabs = [
    {
      key: 'kpi',
      label: 'KPI月度汇总',
      children: (
        <Card>
          <Space style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
            <Space>
              <span>月份</span>
              <DatePicker
                picker="month"
                value={dayjs(queryMonth)}
                onChange={(d) => setQueryMonth(d ? d.format('YYYY-MM') : queryMonth)}
              />
              <Button icon={<SearchOutlined />} onClick={() => setQueryMonth(queryMonth)}>
                查询
              </Button>
            </Space>
            <Space>
              <Button type="primary" icon={<PlusOutlined />} onClick={onAddKpi}>
                新增
              </Button>
              <Button
                icon={<DownloadOutlined />}
                onClick={() =>
                  exportCsv(
                    'KPI月度汇总',
                    kpiColumns.map((c) => c.title as string),
                    filteredKpi.map((r) => [
                      r.month,
                      r.className,
                      r.major,
                      r.schooling,
                      r.teacher,
                      r.headTeacher,
                      r.graduateAt,
                      r.targetAvgSalary,
                      r.actualAvgSalary,
                      percent(r.actualAvgSalary, r.targetAvgSalary),
                      r.archiveCount,
                      r.targetEmpCount,
                      r.actualEmpCount,
                      percent(r.actualEmpCount, r.targetEmpCount),
                      r.salaryOver10k,
                      r.remark,
                    ]),
                  )
                }
              >
                导出CSV
              </Button>
            </Space>
          </Space>
          <Table
            columns={kpiColumns}
            dataSource={filteredKpi}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            scroll={{ x: 1600 }}
            bordered
            summary={() => (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0}>合计/平均</Table.Summary.Cell>
                <Table.Summary.Cell index={1} colSpan={6}></Table.Summary.Cell>
                <Table.Summary.Cell index={7} align="right">
                  {kpiSummary.targetSalaryAvg}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={8} align="right">
                  {kpiSummary.actualSalaryAvg}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={9} align="center">
                  {percent(kpiSummary.actualEmp, kpiSummary.targetEmp)}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={10} align="right">
                  {kpiSummary.archive}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={11} align="right">
                  {kpiSummary.targetEmp}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={12} align="right">
                  {kpiSummary.actualEmp}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={13} align="center">
                  {kpiSummary.employ ? `${(kpiSummary.employ * 100).toFixed(1)}%` : ''}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={14} align="right">
                  {kpiSummary.over10k}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={15}></Table.Summary.Cell>
              </Table.Summary.Row>
            )}
          />
        </Card>
      ),
    },
    {
      key: 'detail',
      label: '就业明细名单',
      children: (
        <Card>
          <Space style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
            <Space>
              <Input
                placeholder="姓名/班级/单位 搜索"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                style={{ width: 260 }}
              />
              <Button icon={<SearchOutlined />} onClick={() => setKeyword(keyword)}>
                查询
              </Button>
            </Space>
            <Space>
              <Button type="primary" icon={<PlusOutlined />} onClick={onAddDetail}>
                新增
              </Button>
              <Button
                icon={<DownloadOutlined />}
                onClick={() =>
                  exportCsv(
                    '就业明细名单',
                    detailColumns.map((c) => c.title as string),
                    filteredDetail.map((r) => [
                      r.name,
                      r.gender,
                      r.age,
                      r.degree,
                      r.className,
                      r.major,
                      r.schooling,
                      r.onboardAt,
                      r.city,
                      r.company,
                      r.jobTitle,
                      r.salary,
                      r.remark,
                    ]),
                  )
                }
              >
                导出CSV
              </Button>
            </Space>
          </Space>
          <Table
            columns={detailColumns}
            dataSource={filteredDetail}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            scroll={{ x: 1400 }}
            bordered
          />
        </Card>
      ),
    },
    {
      key: 'weekly',
      label: '月度周推进',
      children: (
        <Card>
          <Space style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
            <Space>
              <span>月份</span>
              <DatePicker
                picker="month"
                value={dayjs(queryMonth)}
                onChange={(d) => setQueryMonth(d ? d.format('YYYY-MM') : queryMonth)}
              />
            </Space>
            <Space>
              <Button type="primary" icon={<PlusOutlined />} onClick={onAddWeekly}>
                新增
              </Button>
              <Button
                icon={<DownloadOutlined />}
                onClick={() =>
                  exportCsv(
                    '月度周推进',
                    weeklyColumns.map((c) => c.title as string),
                    filteredWeekly.map((r) => [
                      r.month,
                      r.weekNo,
                      r.className,
                      r.major,
                      r.teacher,
                      r.resumeSubmitted,
                      r.interviews,
                      r.offers,
                      r.onboard,
                      r.over10k,
                      r.remark,
                    ]),
                  )
                }
              >
                导出CSV
              </Button>
            </Space>
          </Space>
          <Table
            columns={weeklyColumns}
            dataSource={filteredWeekly}
            rowKey="id"
            pagination={{ pageSize: 12 }}
            scroll={{ x: 1400 }}
            bordered
          />
        </Card>
      ),
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          marginBottom: 12,
          display: 'flex',
          gap: 16,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <CampusSelector />
        <Title level={4} style={{ margin: 0 }}>
          智慧司就业跟踪
        </Title>
      </div>
      <Tabs items={tabs} />

      {/* KPI Modal */}
      <Modal
        title={kpiEditing ? '编辑KPI记录' : '新增KPI记录'}
        open={kpiOpen}
        onOk={onSaveKpi}
        onCancel={() => setKpiOpen(false)}
        width={960}
        destroyOnHidden
      >
        <Form form={kpiForm} layout="vertical">
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="month" label="月份" rules={[{ required: true }]}>
                <DatePicker picker="month" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="campus" label="神殿" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="className" label="班级名称" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="major" label="专业" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="schooling" label="学制" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="graduateAt" label="毕业时间">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="teacher" label="授课教员">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="headTeacher" label="班主任">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="salaryOver10k" label="过万人数">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={6}>
              <Form.Item name="targetAvgSalary" label="目标平均薪资">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="actualAvgSalary" label="实际平均薪资">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="archiveCount" label="档案人数">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="targetEmpCount" label="目标就业人数">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={6}>
              <Form.Item name="actualEmpCount" label="实际就业人数">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={18}>
              <Form.Item name="remark" label="备注">
                <Input />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        title={detailEditing ? '编辑就业明细' : '新增就业明细'}
        open={detailOpen}
        onOk={onSaveDetail}
        onCancel={() => setDetailOpen(false)}
        width={960}
        destroyOnHidden
      >
        <Form form={detailForm} layout="vertical">
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="name" label="学员姓名" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="gender" label="性别">
                <Select allowClear>
                  <Option value="男">男</Option>
                  <Option value="女">女</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="age" label="年龄">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="degree" label="最高学历">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="className" label="班级名称" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="major" label="专业" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="schooling" label="学制" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="onboardAt" label="入职时间">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="city" label="就业地区">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={10}>
              <Form.Item name="company" label="就业单位">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="jobTitle" label="就业岗位">
                <Input />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="salary" label="就业薪资">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="remark" label="备注">
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      {/* Weekly Modal */}
      <Modal
        title={weeklyEditing ? '编辑周推进' : '新增周推进'}
        open={weeklyOpen}
        onOk={onSaveWeekly}
        onCancel={() => setWeeklyOpen(false)}
        width={960}
        destroyOnHidden
      >
        <Form form={weeklyForm} layout="vertical">
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="month" label="月份" rules={[{ required: true }]}>
                <DatePicker picker="month" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="weekNo" label="周次" rules={[{ required: true }]}>
                <InputNumber min={1} max={5} precision={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="className" label="班级">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="major" label="专业">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="teacher" label="授课教员">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="resumeSubmitted" label="推荐数">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="interviews" label="面试数">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="offers" label="Offer数">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="onboard" label="入职数">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="over10k" label="过万人数">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={16}>
              <Form.Item name="remark" label="备注">
                <Input />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  )
}

export default EmploymentTrackingPage
