// 智慧司员工业绩汇总表
import React, { useEffect, useMemo, useState } from 'react'
import { App,
  Card,
  Table,
  Typography,
  Space,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Row,
  Col,
  Popconfirm,
  Spin,
} from 'antd'
import { PlusOutlined, DownloadOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import CampusSelector from '@/components/common/CampusSelector'
import { useCampusStore } from '@/stores/campusStore'
import { buildApiUrl } from '@/utils/apiBase'
import { getTeacherEmploymentSummaries } from '@/services/teacherEmploymentSummary'

const { Title } = Typography

interface PerformanceRow {
  id: string
  order: number
  staffName: string
  assignmentRate?: number // 作业提交率
  workPassRate?: number // 作业合格率
  examPassRate?: number // 考试合格率
  projectPassRate?: number // 项目合格率
  satisfaction?: number // 学员满意度
  discipline?: number // 学员违纪（次数或记分）
  employmentRate?: number // 就业率
  employmentSalary?: number // 就业薪资
  reputationRegistrations?: number // 口碑报名
  reputationRevenue?: number // 口碑收入
  newStudents?: number // 带新生人数
  refunds?: number // 退费人数
}

const exportCsv = (filename: string, headers: string[], rows: any[][]) => {
  const csv = [headers, ...rows].map((r) => r.map((c) => `"${c ?? ''}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `${filename}.csv`
  a.click()
}

const StaffPerformanceSummaryPage: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore()

  const resolvedCampus = currentCampus || '主神殿'
  const [rows, setRows] = useState<PerformanceRow[]>([])
  const [open, setOpen] = useState(false)
  const [form] = Form.useForm()
  const [editing, setEditing] = useState<PerformanceRow | null>(null)
  const [loading, setLoading] = useState(false)
  const [year, setYear] = useState<number>(new Date().getFullYear())
  const [autoFillStatus, setAutoFillStatus] = useState<string>('')

  const key = (c?: string | null) => `staff_performance_${c || '主神殿'}`
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key(currentCampus))
      setRows(raw ? JSON.parse(raw) : [])
    } catch {
      setRows([])
    }
  }, [currentCampus])
  useEffect(() => {
    try {
      localStorage.setItem(key(currentCampus), JSON.stringify(rows))
    } catch {}
  }, [rows, currentCampus])

  const normalizeRateToPercent = (rateRaw: any): number => {
    const n = Number(rateRaw)
    if (!Number.isFinite(n)) return 0
    return n > 0 && n <= 1 ? n * 100 : n
  }

  const autoSummary = async () => {
    if (!resolvedCampus) {
      message.warning('缺少神殿信息')
      return
    }

    setLoading(true)
    setAutoFillStatus('正在自动汇总...')

    try {
      // 1) 教员列表
      let teachers: string[] = []
      try {
        const res = await fetch(
          `${buildApiUrl('/config/teachers')}?campus_name=${encodeURIComponent(resolvedCampus)}`,
        )
        if (res.ok) {
          const data: { name?: string }[] = await res.json()
          teachers = data.map((t) => (t.name || '').trim()).filter(Boolean)
        }
      } catch (e) {
        console.error('获取教员列表失败:', e)
      }

      // 如果拿不到教员列表，则使用现有表中的教员
      if (teachers.length === 0) {
        teachers = rows.map((r) => (r.staffName || '').trim()).filter(Boolean)
      }

      if (teachers.length === 0) {
        message.warning('未获取到教员列表，无法汇总')
        return
      }

      const byTeacher: Record<string, Partial<PerformanceRow>> = {}
      const norm = (s: string) => (s || '').trim()

      // 2) 作业提交率/合格率
      setAutoFillStatus('正在获取作业提交率/合格率...')
      try {
        const res = await fetch(
          buildApiUrl(
            `/assignment-stats/assignment-monthly?campus=${encodeURIComponent(resolvedCampus)}&year=${year}`,
          ),
        )
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data)) {
            const sums: Record<string, { submit: number; pass: number; cnt: number }> = {}
            data.forEach((item: any) => {
              const t = norm(item.teacher_name)
              if (!t) return
              const submit = Number(item.submit_rate) || 0
              const pass = Number(item.pass_rate) || 0
              const prev = sums[t] || { submit: 0, pass: 0, cnt: 0 }
              prev.submit += submit
              prev.pass += pass
              prev.cnt += 1
              sums[t] = prev
            })
            Object.entries(sums).forEach(([t, v]) => {
              byTeacher[t] = {
                ...(byTeacher[t] || {}),
                assignmentRate: Number((v.submit / (v.cnt || 1)).toFixed(2)),
                workPassRate: Number((v.pass / (v.cnt || 1)).toFixed(2)),
              }
            })
          }
        }
      } catch (e) {
        console.error('获取作业率失败:', e)
      }

      // 3) 考试合格率
      setAutoFillStatus('正在获取考试合格率...')
      try {
        const res = await fetch(
          buildApiUrl(`/exam-stats/exam-monthly?campus=${encodeURIComponent(resolvedCampus)}&year=${year}`),
        )
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data)) {
            const sums: Record<string, { pass: number; cnt: number }> = {}
            data.forEach((item: any) => {
              const t = norm(item.teacher_name)
              if (!t) return
              const pass = Number(item.pass_rate) || 0
              const prev = sums[t] || { pass: 0, cnt: 0 }
              prev.pass += pass
              prev.cnt += 1
              sums[t] = prev
            })
            Object.entries(sums).forEach(([t, v]) => {
              byTeacher[t] = {
                ...(byTeacher[t] || {}),
                examPassRate: Number((v.pass / (v.cnt || 1)).toFixed(2)),
              }
            })
          }
        }
      } catch (e) {
        console.error('获取考试合格率失败:', e)
      }

      // 4) 项目合格率
      setAutoFillStatus('正在获取项目合格率...')
      try {
        const res = await fetch(
          buildApiUrl(
            `/project-stats/project-monthly?campus=${encodeURIComponent(resolvedCampus)}&year=${year}`,
          ),
        )
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data)) {
            const sums: Record<string, { pass: number; cnt: number }> = {}
            data.forEach((item: any) => {
              const t = norm(item.teacher_name)
              if (!t) return
              const pass = Number(item.pass_rate) || 0
              const prev = sums[t] || { pass: 0, cnt: 0 }
              prev.pass += pass
              prev.cnt += 1
              sums[t] = prev
            })
            Object.entries(sums).forEach(([t, v]) => {
              byTeacher[t] = {
                ...(byTeacher[t] || {}),
                projectPassRate: Number((v.pass / (v.cnt || 1)).toFixed(2)),
              }
            })
          }
        }
      } catch (e) {
        console.error('获取项目合格率失败:', e)
      }

      // 5) 满意度
      setAutoFillStatus('正在获取学员满意度...')
      try {
        const res = await fetch(
          buildApiUrl(
            `/satisfaction-stats/satisfaction-monthly?campus=${encodeURIComponent(resolvedCampus)}&year=${year}`,
          ),
        )
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data)) {
            const sums: Record<string, { score: number; cnt: number }> = {}
            data.forEach((item: any) => {
              const t = norm(item.teacher_name)
              if (!t) return
              const score = (Number(item.score) || 0) * 20
              const prev = sums[t] || { score: 0, cnt: 0 }
              prev.score += score
              prev.cnt += 1
              sums[t] = prev
            })
            Object.entries(sums).forEach(([t, v]) => {
              byTeacher[t] = {
                ...(byTeacher[t] || {}),
                satisfaction: Number((v.score / (v.cnt || 1)).toFixed(2)),
              }
            })
          }
        }
      } catch (e) {
        console.error('获取满意度失败:', e)
      }

      // 6) 违纪（累计）
      setAutoFillStatus('正在获取学员违纪...')
      try {
        const res = await fetch(
          buildApiUrl(
            `/violation-stats/violation-monthly?campus=${encodeURIComponent(resolvedCampus)}&year=${year}`,
          ),
        )
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data)) {
            const sums: Record<string, number> = {}
            data.forEach((item: any) => {
              const t = norm(item.teacher_name)
              if (!t) return
              const count = Number(item.count) || 0
              sums[t] = (sums[t] || 0) + count
            })
            Object.entries(sums).forEach(([t, v]) => {
              byTeacher[t] = { ...(byTeacher[t] || {}), discipline: v }
            })
          }
        }
      } catch (e) {
        console.error('获取违纪失败:', e)
      }

      // 7) 就业率/就业薪资（按班级算术平均）
      setAutoFillStatus('正在获取就业数据...')
      try {
        const summaries = await getTeacherEmploymentSummaries(resolvedCampus, undefined, undefined, year)
        const sums: Record<string, { rateSum: number; salarySum: number; cnt: number }> = {}

        summaries.forEach((s: any) => {
          const t = norm(s?.教员姓名)
          if (!t) return

          const rate = normalizeRateToPercent(s?.就业率)
          const salaryNum = Number(s?.实际平均就业薪资)
          const salary = Number.isFinite(salaryNum) ? salaryNum : 0

          const prev = sums[t] || { rateSum: 0, salarySum: 0, cnt: 0 }
          prev.rateSum += rate
          prev.salarySum += salary
          prev.cnt += 1
          sums[t] = prev
        })

        Object.entries(sums).forEach(([t, v]) => {
          byTeacher[t] = {
            ...(byTeacher[t] || {}),
            employmentRate: Number((v.rateSum / (v.cnt || 1)).toFixed(2)),
            employmentSalary: Number((v.salarySum / (v.cnt || 1)).toFixed(2)),
          }
        })
      } catch (e) {
        console.error('获取就业数据失败:', e)
      }

      // 8) 口碑报名/收入（累计）
      setAutoFillStatus('正在获取口碑数据...')
      try {
        const res = await fetch(
          buildApiUrl(`/reputation-stats/monthly?campus=${encodeURIComponent(resolvedCampus)}&year=${year}`),
        )
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data)) {
            const sums: Record<string, { enrollment: number; income: number }> = {}
            data.forEach((item: any) => {
              const t = norm(item.teacher_name)
              if (!t) return
              const enrollment = Number(item.reputation_enrollment) || 0
              const income = Number(item.reputation_income) || 0
              const prev = sums[t] || { enrollment: 0, income: 0 }
              prev.enrollment += enrollment
              prev.income += income
              sums[t] = prev
            })
            Object.entries(sums).forEach(([t, v]) => {
              byTeacher[t] = {
                ...(byTeacher[t] || {}),
                reputationRegistrations: v.enrollment,
                reputationRevenue: Number(v.income.toFixed(2)),
              }
            })
          }
        }
      } catch (e) {
        console.error('获取口碑数据失败:', e)
      }

      // 9) 带新生人数（累计）
      setAutoFillStatus('正在获取带新生人数...')
      try {
        const res = await fetch(
          buildApiUrl(
            `/reputation-stats/new-students-monthly?campus=${encodeURIComponent(resolvedCampus)}&year=${year}`,
          ),
        )
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data)) {
            const sums: Record<string, number> = {}
            data.forEach((item: any) => {
              const t = norm(item.teacher_name)
              if (!t) return
              const count = Number(item.new_student_count) || 0
              sums[t] = (sums[t] || 0) + count
            })
            Object.entries(sums).forEach(([t, v]) => {
              byTeacher[t] = { ...(byTeacher[t] || {}), newStudents: v }
            })
          }
        }
      } catch (e) {
        console.error('获取带新生人数失败:', e)
      }

      // 10) 退费人数（累计）
      setAutoFillStatus('正在获取退费人数...')
      try {
        const res = await fetch(
          buildApiUrl(
            `/reputation-stats/refunds-monthly?campus=${encodeURIComponent(resolvedCampus)}&year=${year}`,
          ),
        )
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data)) {
            const sums: Record<string, number> = {}
            data.forEach((item: any) => {
              const t = norm(item.teacher_name)
              if (!t) return
              const count = Number(item.refund_count) || 0
              sums[t] = (sums[t] || 0) + count
            })
            Object.entries(sums).forEach(([t, v]) => {
              byTeacher[t] = { ...(byTeacher[t] || {}), refunds: v }
            })
          }
        }
      } catch (e) {
        console.error('获取退费人数失败:', e)
      }

      // 11) 合并到现有 rows：按教员姓名匹配，存在则更新，不存在则追加；保留手动行
      const existingByName = new Map<string, PerformanceRow>()
      rows.forEach((r) => {
        const name = norm(r.staffName)
        if (name) existingByName.set(name, r)
      })

      const merged: PerformanceRow[] = []

      teachers.forEach((name, idx) => {
        const keyName = norm(name)
        const old = existingByName.get(keyName)
        const auto = byTeacher[keyName] || {}

        merged.push({
          ...(old || { id: Date.now().toString() + '_' + idx }),
          order: old?.order ?? idx + 1,
          staffName: keyName,
          ...auto,
        })
      })

      // 追加那些“手工录入但不在教员列表”的行
      rows.forEach((r) => {
        const name = norm(r.staffName)
        if (!name) return
        if (teachers.map(norm).includes(name)) return
        merged.push(r)
      })

      // 重新编号
      const finalRows = merged.map((r, idx) => ({ ...r, order: idx + 1 }))
      setRows(finalRows)
      message.success('自动汇总完成')
    } catch (e: any) {
      console.error(e)
      message.error(e?.message || '自动汇总失败')
    } finally {
      setAutoFillStatus('')
      setLoading(false)
    }
  }

  const columns: ColumnsType<PerformanceRow> = [
    { title: '序号', dataIndex: 'order', key: 'order', width: 70, align: 'center' },
    { title: '教员姓名', dataIndex: 'staffName', key: 'staffName', width: 120 },
    {
      title: '作业提交率',
      dataIndex: 'assignmentRate',
      key: 'assignmentRate',
      width: 110,
      align: 'right',
    },
    {
      title: '作业合格率',
      dataIndex: 'workPassRate',
      key: 'workPassRate',
      width: 110,
      align: 'right',
    },
    {
      title: '考试合格率',
      dataIndex: 'examPassRate',
      key: 'examPassRate',
      width: 110,
      align: 'right',
    },
    {
      title: '项目合格率',
      dataIndex: 'projectPassRate',
      key: 'projectPassRate',
      width: 110,
      align: 'right',
    },
    {
      title: '学员满意度',
      dataIndex: 'satisfaction',
      key: 'satisfaction',
      width: 110,
      align: 'right',
    },
    { title: '学员违纪', dataIndex: 'discipline', key: 'discipline', width: 90, align: 'right' },
    {
      title: '就业率',
      dataIndex: 'employmentRate',
      key: 'employmentRate',
      width: 90,
      align: 'right',
    },
    {
      title: '就业薪资',
      dataIndex: 'employmentSalary',
      key: 'employmentSalary',
      width: 110,
      align: 'right',
    },
    {
      title: '口碑报名',
      dataIndex: 'reputationRegistrations',
      key: 'reputationRegistrations',
      width: 100,
      align: 'right',
    },
    {
      title: '口碑收入',
      dataIndex: 'reputationRevenue',
      key: 'reputationRevenue',
      width: 100,
      align: 'right',
    },
    {
      title: '带新生人数',
      dataIndex: 'newStudents',
      key: 'newStudents',
      width: 110,
      align: 'right',
    },
    { title: '退费人数', dataIndex: 'refunds', key: 'refunds', width: 100, align: 'right' },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 130,
      render: (_, record) => (
        <Space>
          <Button size="small" type="link" icon={<EditOutlined />} onClick={() => onEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定删除?"
            onConfirm={() => setRows((prev) => prev.filter((x) => x.id !== record.id))}
          >
            <Button size="small" type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const onAdd = () => {
    setEditing(null)
    form.resetFields()
    setOpen(true)
  }
  const onEdit = (r: PerformanceRow) => {
    setEditing(r)
    form.setFieldsValue(r)
    setOpen(true)
  }
  const onSave = async () => {
    const v = await form.validateFields()
    const row: PerformanceRow = {
      ...(editing || { id: Date.now().toString(), order: rows.length + 1 }),
      ...v,
    }
    setRows((prev) => (editing ? prev.map((x) => (x.id === row.id ? row : x)) : [...prev, row]))
    setOpen(false)
    message.success(editing ? '已更新' : '已添加')
  }

  const averages = useMemo(() => {
    const n = rows.length || 0
    const avg = (f: keyof PerformanceRow) =>
      n > 0 ? (rows.reduce((a, r) => a + Number(r[f] || 0), 0) / n).toFixed(2) : '0'
    return {
      assignmentRate: avg('assignmentRate'),
      workPassRate: avg('workPassRate'),
      examPassRate: avg('examPassRate'),
      projectPassRate: avg('projectPassRate'),
      satisfaction: avg('satisfaction'),
      discipline: avg('discipline'),
      employmentRate: avg('employmentRate'),
      employmentSalary: avg('employmentSalary'),
      reputationRegistrations: avg('reputationRegistrations'),
      reputationRevenue: avg('reputationRevenue'),
      newStudents: avg('newStudents'),
      refunds: avg('refunds'),
    }
  }, [rows])

  return (
    <div style={{ padding: 24 }}>
      <div
        className="mb-3"
        style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}
      >
        <CampusSelector />
        <Title level={4} style={{ margin: 0 }}>
          智慧司员工业绩汇总表
        </Title>
        <Space>
          <Button loading={loading} onClick={autoSummary}>
            自动汇总
          </Button>
          <Space>
            <span>年份</span>
            <InputNumber
              value={year}
              min={2000}
              max={2100}
              style={{ width: 110 }}
              onChange={(v) => setYear(Number(v) || new Date().getFullYear())}
            />
          </Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={onAdd}>
            新增
          </Button>
          <Button
            icon={<DownloadOutlined />}
            onClick={() =>
              exportCsv(
                '员工业绩汇总',
                columns.map((c) => c.title as string),
                rows.map((r) => [
                  r.order,
                  r.staffName,
                  r.assignmentRate,
                  r.workPassRate,
                  r.examPassRate,
                  r.projectPassRate,
                  r.satisfaction,
                  r.discipline,
                  r.employmentRate,
                  r.employmentSalary,
                  r.reputationRegistrations,
                  r.reputationRevenue,
                  r.newStudents,
                  r.refunds,
                ]),
              )
            }
          >
            导出CSV
          </Button>
        </Space>
      </div>

      <Card>
        {autoFillStatus && (
          <div style={{ marginBottom: 12, color: '#666' }}>{autoFillStatus}</div>
        )}
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={rows}
            rowKey="id"
            pagination={false}
            scroll={{ x: 1600 }}
            bordered
            summary={() => (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0}>平均</Table.Summary.Cell>
                <Table.Summary.Cell index={1}></Table.Summary.Cell>
                <Table.Summary.Cell index={2} align="right">
                  {averages.assignmentRate}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3} align="right">
                  {averages.workPassRate}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={4} align="right">
                  {averages.examPassRate}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={5} align="right">
                  {averages.projectPassRate}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={6} align="right">
                  {averages.satisfaction}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={7} align="right">
                  {averages.discipline}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={8} align="right">
                  {averages.employmentRate}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={9} align="right">
                  {averages.employmentSalary}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={10} align="right">
                  {averages.reputationRegistrations}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={11} align="right">
                  {averages.reputationRevenue}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={12} align="right">
                  {averages.newStudents}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={13} align="right">
                  {averages.refunds}
                </Table.Summary.Cell>
              </Table.Summary.Row>
            )}
          />
        </Spin>
      </Card>

      <Modal
        title={editing ? '编辑记录' : '新增记录'}
        open={open}
        onOk={onSave}
        onCancel={() => setOpen(false)}
        width={900}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="staffName" label="教员姓名" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="assignmentRate" label="作业提交率">
                <InputNumber min={0} max={100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="workPassRate" label="作业合格率">
                <InputNumber min={0} max={100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="examPassRate" label="考试合格率">
                <InputNumber min={0} max={100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="projectPassRate" label="项目合格率">
                <InputNumber min={0} max={100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="satisfaction" label="学员满意度">
                <InputNumber min={0} max={100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="discipline" label="学员违纪">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="employmentRate" label="就业率">
                <InputNumber min={0} max={100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="employmentSalary" label="就业薪资">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="reputationRegistrations" label="口碑报名">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="reputationRevenue" label="口碑收入">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="newStudents" label="带新生人数">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="refunds" label="退费人数">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  )
}

export default StaffPerformanceSummaryPage
