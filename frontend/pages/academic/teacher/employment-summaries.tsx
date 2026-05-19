// 教员模块 - 后端就业三张汇总表（均为模态录入）
import React, { useEffect, useMemo, useState } from 'react'
import { App,
  Card,
  Tabs,
  Table,
  Typography,
  Space,
  Button,
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
import { PlusOutlined, DownloadOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import CampusSelector from '@/components/common/CampusSelector'
import { useCampusStore } from '@/stores/campusStore'

const { Title } = Typography
const { Option } = Select

// 1) 班级就业汇总
interface ClassEmploymentRow {
  id: string
  order: number
  campus: string
  major: string
  schooling: string
  className: string
  teacher: string
  headTeacher: string
  graduateAt: string
  targetAvgSalary?: number
  actualAvgSalary?: number
  achieveRate?: number
  archiveCount?: number
  targetEmpCount?: number
  actualEmpCount?: number
  employmentRate?: number
  salaryOver10k?: number
}

// 2) 就业明星
interface StarEmploymentRow {
  id: string
  order: number
  name: string
  gender: string
  age: number
  degree: string
  major: string
  schooling: string
  className: string
  onboardAt: string
  city: string
  company: string
  jobTitle: string
  salary: number
}

// 3) 教员就业汇总
interface TeacherEmploymentRow {
  id: string
  order: number
  teacherName: string
  major: string
  schooling: string
  className: string
  graduateAt: string
  targetAvgSalary?: number
  actualAvgSalary?: number
  achieveRate?: number
  archiveCount?: number
  targetEmpCount?: number
  actualEmpCount?: number
  employmentRate?: number
  salaryOver10k?: number
}

const currency = (v?: number) => (v == null ? '' : Math.round(v).toString())
const percent = (v?: number) => (v == null ? '' : `${(v * 100).toFixed(1)}%`)

// 通用导出
const exportCsv = (filename: string, headers: string[], rows: any[][]) => {
  const csv = [headers, ...rows].map((r) => r.map((c) => `"${c ?? ''}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `${filename}_${dayjs().format('YYYY-MM-DD')}.csv`
  a.click()
}

const EmploymentSummariesPage: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore()
  // 班级
  const [classRows, setClassRows] = useState<ClassEmploymentRow[]>([])
  const [classOpen, setClassOpen] = useState(false)
  const [classForm] = Form.useForm()
  // 明星
  const [starRows, setStarRows] = useState<StarEmploymentRow[]>([])
  const [starOpen, setStarOpen] = useState(false)
  const [starForm] = Form.useForm()
  // 教员
  const [teacherRows, setTeacherRows] = useState<TeacherEmploymentRow[]>([])
  const [teacherOpen, setTeacherOpen] = useState(false)
  const [teacherForm] = Form.useForm()
  const [editingTeacher, setEditingTeacher] = useState<TeacherEmploymentRow | null>(null)

  // 持久化键
  const clsKey = (c?: string | null) => `classEmployment_${c || '主神殿'}`
  const starKey = (c?: string | null) => `starEmployment_${c || '主神殿'}`
  const tchKey = (c?: string | null) => `teacherEmployment_${c || '主神殿'}`

  useEffect(() => {
    const load = <T,>(key: string, def: T[]) => {
      try {
        const raw = localStorage.getItem(key)
        return raw ? (JSON.parse(raw) as T[]) : def
      } catch {
        return def
      }
    }
    setClassRows(load(clsKey(currentCampus), []))
    setStarRows(load(starKey(currentCampus), []))
    setTeacherRows(load(tchKey(currentCampus), []))
  }, [currentCampus])

  useEffect(() => {
    try {
      localStorage.setItem(clsKey(currentCampus), JSON.stringify(classRows))
    } catch {}
  }, [classRows, currentCampus])
  useEffect(() => {
    try {
      localStorage.setItem(starKey(currentCampus), JSON.stringify(starRows))
    } catch {}
  }, [starRows, currentCampus])
  useEffect(() => {
    try {
      localStorage.setItem(tchKey(currentCampus), JSON.stringify(teacherRows))
    } catch {}
  }, [teacherRows, currentCampus])

  // 1) 班级就业汇总
  const classColumns: ColumnsType<ClassEmploymentRow> = [
    { title: '序号', dataIndex: 'order', key: 'order', width: 60, align: 'center' },
    { title: '神殿', dataIndex: 'campus', key: 'campus', width: 80 },
    { title: '专业', dataIndex: 'major', key: 'major', width: 100 },
    { title: '学制', dataIndex: 'schooling', key: 'schooling', width: 90 },
    { title: '班级名称', dataIndex: 'className', key: 'className', width: 100 },
    { title: '授课教员', dataIndex: 'teacher', key: 'teacher', width: 100 },
    { title: '班主任', dataIndex: 'headTeacher', key: 'headTeacher', width: 100 },
    { title: '毕业时间', dataIndex: 'graduateAt', key: 'graduateAt', width: 120 },
    {
      title: '目标平均就业薪资',
      dataIndex: 'targetAvgSalary',
      key: 'targetAvgSalary',
      align: 'right',
      width: 140,
      render: (v) => currency(v),
    },
    {
      title: '实际平均就业薪资',
      dataIndex: 'actualAvgSalary',
      key: 'actualAvgSalary',
      align: 'right',
      width: 140,
      render: (v) => currency(v),
    },
    {
      title: '达标率',
      dataIndex: 'achieveRate',
      key: 'achieveRate',
      align: 'center',
      width: 90,
      render: (v) => percent(v),
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
      dataIndex: 'employmentRate',
      key: 'employmentRate',
      align: 'center',
      width: 90,
      render: (v) => percent(v),
    },
    {
      title: '薪资过万人数',
      dataIndex: 'salaryOver10k',
      key: 'salaryOver10k',
      align: 'right',
      width: 120,
    },
  ]

  const openClassModal = () => {
    classForm.resetFields()
    classForm.setFieldsValue({ campus: currentCampus || '主神殿', graduateAt: dayjs() })
    setClassOpen(true)
  }
  const saveClass = async () => {
    const v = await classForm.validateFields()
    const targetRate = v.targetEmpCount
      ? Math.min(v.actualEmpCount / v.targetEmpCount, 1)
      : undefined
    const row: ClassEmploymentRow = {
      id: Date.now().toString(),
      order: classRows.length + 1,
      campus: v.campus,
      major: v.major,
      schooling: v.schooling,
      className: v.className,
      teacher: v.teacher,
      headTeacher: v.headTeacher,
      graduateAt: v.graduateAt?.format('YYYY-MM-DD') || '',
      targetAvgSalary: v.targetAvgSalary,
      actualAvgSalary: v.actualAvgSalary,
      achieveRate: v.targetAvgSalary ? v.actualAvgSalary / v.targetAvgSalary : undefined,
      archiveCount: v.archiveCount,
      targetEmpCount: v.targetEmpCount,
      actualEmpCount: v.actualEmpCount,
      employmentRate: targetRate,
      salaryOver10k: v.salaryOver10k,
    }
    setClassRows((prev) => [...prev, row])
    setClassOpen(false)
  }

  // 班级合计/平均
  const classSummary = useMemo(() => {
    const n = classRows.length || 0
    const sum = (f: keyof ClassEmploymentRow) =>
      classRows.reduce((a, r) => a + Number(r[f] ?? 0), 0)
    const avg = (total: number) => (n > 0 ? Math.round(total / n) : 0)
    const targetSum = sum('targetEmpCount')
    const actualSum = sum('actualEmpCount')
    const targetSalaryAvg = avg(sum('targetAvgSalary'))
    const actualSalaryAvg = avg(sum('actualAvgSalary'))
    const achieve = targetSalaryAvg > 0 ? actualSalaryAvg / targetSalaryAvg : undefined
    const employ = targetSum > 0 ? actualSum / targetSum : undefined
    return {
      targetSalaryAvg,
      actualSalaryAvg,
      achieve,
      archive: sum('archiveCount'),
      target: targetSum,
      actual: actualSum,
      employ,
      over10k: sum('salaryOver10k'),
    }
  }, [classRows])

  // 2) 就业明星
  const starColumns: ColumnsType<StarEmploymentRow> = [
    { title: '序号', dataIndex: 'order', key: 'order', width: 60, align: 'center' },
    { title: '学员姓名', dataIndex: 'name', key: 'name', width: 100 },
    { title: '性别', dataIndex: 'gender', key: 'gender', width: 70 },
    { title: '毕业年龄', dataIndex: 'age', key: 'age', width: 80, align: 'right' },
    { title: '最高学历', dataIndex: 'degree', key: 'degree', width: 100 },
    { title: '专业', dataIndex: 'major', key: 'major', width: 100 },
    { title: '学制', dataIndex: 'schooling', key: 'schooling', width: 90 },
    { title: '班级名称', dataIndex: 'className', key: 'className', width: 100 },
    { title: '入职时间', dataIndex: 'onboardAt', key: 'onboardAt', width: 120 },
    { title: '就业地区', dataIndex: 'city', key: 'city', width: 120 },
    { title: '就业单位', dataIndex: 'company', key: 'company', width: 160 },
    { title: '就业岗位', dataIndex: 'jobTitle', key: 'jobTitle', width: 120 },
    { title: '就业薪资', dataIndex: 'salary', key: 'salary', width: 100, align: 'right' },
  ]

  const openStarModal = () => {
    starForm.resetFields()
    starForm.setFieldsValue({ onboardAt: dayjs() })
    setStarOpen(true)
  }
  const saveStar = async () => {
    const v = await starForm.validateFields()
    const row: StarEmploymentRow = {
      id: Date.now().toString(),
      order: starRows.length + 1,
      name: v.name,
      gender: v.gender,
      age: v.age,
      degree: v.degree,
      major: v.major,
      schooling: v.schooling,
      className: v.className,
      onboardAt: v.onboardAt?.format('YYYY-MM-DD') || '',
      city: v.city,
      company: v.company,
      jobTitle: v.jobTitle,
      salary: v.salary,
    }
    setStarRows((prev) => [...prev, row])
    setStarOpen(false)
  }

  // 3) 教员就业汇总（按教员分组 + 展开明细）
  const openTeacherModal = () => {
    setEditingTeacher(null)
    teacherForm.resetFields()
    teacherForm.setFieldsValue({ graduateAt: dayjs() })
    setTeacherOpen(true)
  }
  const editTeacher = (r: TeacherEmploymentRow) => {
    setEditingTeacher(r)
    teacherForm.setFieldsValue({ ...r, graduateAt: r.graduateAt ? dayjs(r.graduateAt) : undefined })
    setTeacherOpen(true)
  }
  const saveTeacher = async () => {
    const v = await teacherForm.validateFields()
    const ach = v.targetAvgSalary ? v.actualAvgSalary / v.targetAvgSalary : undefined
    const empRate = v.targetEmpCount ? Math.min(v.actualEmpCount / v.targetEmpCount, 1) : undefined
    if (editingTeacher) {
      const row: TeacherEmploymentRow = {
        ...editingTeacher,
        teacherName: v.teacherName,
        major: v.major,
        schooling: v.schooling,
        className: v.className,
        graduateAt: v.graduateAt?.format('YYYY-MM-DD') || '',
        targetAvgSalary: v.targetAvgSalary,
        actualAvgSalary: v.actualAvgSalary,
        achieveRate: ach,
        archiveCount: v.archiveCount,
        targetEmpCount: v.targetEmpCount,
        actualEmpCount: v.actualEmpCount,
        employmentRate: empRate,
        salaryOver10k: v.salaryOver10k,
      }
      setTeacherRows((prev) => prev.map((x) => (x.id === row.id ? row : x)))
      message.success('已更新教员明细')
    } else {
      const row: TeacherEmploymentRow = {
        id: Date.now().toString(),
        order: teacherRows.length + 1,
        teacherName: v.teacherName,
        major: v.major,
        schooling: v.schooling,
        className: v.className,
        graduateAt: v.graduateAt?.format('YYYY-MM-DD') || '',
        targetAvgSalary: v.targetAvgSalary,
        actualAvgSalary: v.actualAvgSalary,
        achieveRate: ach,
        archiveCount: v.archiveCount,
        targetEmpCount: v.targetEmpCount,
        actualEmpCount: v.actualEmpCount,
        employmentRate: empRate,
        salaryOver10k: v.salaryOver10k,
      }
      setTeacherRows((prev) => [...prev, row])
      message.success('已新增教员明细')
    }
    setTeacherOpen(false)
  }

  // 教员合计/平均
  const teacherSummary = useMemo(() => {
    const n = teacherRows.length || 0
    const sum = (f: keyof TeacherEmploymentRow) =>
      teacherRows.reduce((a, r) => a + Number(r[f] ?? 0), 0)
    const avg = (total: number) => (n > 0 ? Math.round(total / n) : 0)
    const targetSum = sum('targetEmpCount')
    const actualSum = sum('actualEmpCount')
    const targetSalaryAvg = avg(sum('targetAvgSalary'))
    const actualSalaryAvg = avg(sum('actualAvgSalary'))
    const achieve = targetSalaryAvg > 0 ? actualSalaryAvg / targetSalaryAvg : undefined
    const employ = targetSum > 0 ? actualSum / targetSum : undefined
    return {
      targetSalaryAvg,
      actualSalaryAvg,
      achieve,
      archive: sum('archiveCount'),
      target: targetSum,
      actual: actualSum,
      employ,
      over10k: sum('salaryOver10k'),
    }
  }, [teacherRows])

  // 分组聚合（按教员）
  type TeacherGroup = {
    key: string
    teacherName: string
    rows: TeacherEmploymentRow[]
    agg: {
      targetSalaryAvg: number
      actualSalaryAvg: number
      achieve?: number
      archive: number
      target: number
      actual: number
      employ?: number
      over10k: number
    }
  }

  const teacherGroups: TeacherGroup[] = useMemo(() => {
    const map = new Map<string, TeacherEmploymentRow[]>()
    teacherRows.forEach((r) => {
      const k = r.teacherName || '未填'
      if (!map.has(k)) map.set(k, [])
      map.get(k)!.push(r)
    })
    const list: TeacherGroup[] = []
    Array.from(map.entries()).forEach(([name, rows], idx) => {
      const n = rows.length || 0
      const sum = (f: keyof TeacherEmploymentRow) => rows.reduce((a, r) => a + Number(r[f] ?? 0), 0)
      const avg = (total: number) => (n > 0 ? Math.round(total / n) : 0)
      const targetSalaryAvg = avg(sum('targetAvgSalary'))
      const actualSalaryAvg = avg(sum('actualAvgSalary'))
      const achieve = targetSalaryAvg > 0 ? actualSalaryAvg / targetSalaryAvg : undefined
      const target = sum('targetEmpCount')
      const actual = sum('actualEmpCount')
      const employ = target > 0 ? actual / target : undefined
      const archive = sum('archiveCount')
      const over10k = sum('salaryOver10k')
      list.push({
        key: `${name}_${idx}`,
        teacherName: name,
        rows,
        agg: {
          targetSalaryAvg,
          actualSalaryAvg,
          achieve,
          archive,
          target,
          actual,
          employ,
          over10k,
        },
      })
    })
    return list
  }, [teacherRows])

  const teacherGroupColumns: ColumnsType<TeacherGroup> = [
    { title: '教员姓名', dataIndex: 'teacherName', key: 'teacherName', width: 120 },
    {
      title: '目标平均就业薪资(平均)',
      key: 'targetAvg',
      align: 'right',
      width: 170,
      render: (_, g) => currency(g.agg.targetSalaryAvg),
    },
    {
      title: '实际平均就业薪资(平均)',
      key: 'actualAvg',
      align: 'right',
      width: 170,
      render: (_, g) => currency(g.agg.actualSalaryAvg),
    },
    {
      title: '达标率',
      key: 'achieve',
      align: 'center',
      width: 100,
      render: (_, g) => percent(g.agg.achieve),
    },
    {
      title: '档案人数(合计)',
      key: 'archive',
      align: 'right',
      width: 130,
      render: (_, g) => g.agg.archive,
    },
    {
      title: '目标就业人数(合计)',
      key: 'target',
      align: 'right',
      width: 150,
      render: (_, g) => g.agg.target,
    },
    {
      title: '实际就业人数(合计)',
      key: 'actual',
      align: 'right',
      width: 150,
      render: (_, g) => g.agg.actual,
    },
    {
      title: '就业率',
      key: 'employ',
      align: 'center',
      width: 100,
      render: (_, g) => percent(g.agg.employ),
    },
    {
      title: '薪资过万人数(合计)',
      key: 'over10k',
      align: 'right',
      width: 160,
      render: (_, g) => g.agg.over10k,
    },
  ]

  const teacherDetailColumns: ColumnsType<TeacherEmploymentRow> = [
    { title: '序号', dataIndex: 'order', key: 'order', width: 60, align: 'center' },
    { title: '专业', dataIndex: 'major', key: 'major', width: 100 },
    { title: '学制', dataIndex: 'schooling', key: 'schooling', width: 90 },
    { title: '班级名称', dataIndex: 'className', key: 'className', width: 100 },
    { title: '毕业时间', dataIndex: 'graduateAt', key: 'graduateAt', width: 120 },
    {
      title: '目标平均就业薪资',
      dataIndex: 'targetAvgSalary',
      key: 'targetAvgSalary',
      align: 'right',
      width: 140,
      render: (v) => currency(v),
    },
    {
      title: '实际平均就业薪资',
      dataIndex: 'actualAvgSalary',
      key: 'actualAvgSalary',
      align: 'right',
      width: 140,
      render: (v) => currency(v),
    },
    {
      title: '达标率',
      dataIndex: 'achieveRate',
      key: 'achieveRate',
      align: 'center',
      width: 90,
      render: (v) => percent(v),
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
      dataIndex: 'employmentRate',
      key: 'employmentRate',
      align: 'center',
      width: 90,
      render: (v) => percent(v),
    },
    {
      title: '薪资过万人数',
      dataIndex: 'salaryOver10k',
      key: 'salaryOver10k',
      align: 'right',
      width: 120,
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 130,
      render: (_, r) => (
        <Space>
          <Button size="small" type="link" icon={<EditOutlined />} onClick={() => editTeacher(r)}>
            编辑
          </Button>
          <Popconfirm
            title="确定删除?"
            onConfirm={() => setTeacherRows((prev) => prev.filter((x) => x.id !== r.id))}
          >
            <Button size="small" type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const tabs = [
    {
      key: 'class',
      label: '班级就业汇总',
      children: (
        <Card>
          <Space style={{ marginBottom: 12 }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={openClassModal}>
              新增
            </Button>
            <Button
              icon={<DownloadOutlined />}
              onClick={() =>
                exportCsv(
                  '班级就业汇总表',
                  classColumns.map((c) => c.title as string),
                  classRows.map((r) => [
                    r.order,
                    r.campus,
                    r.major,
                    r.schooling,
                    r.className,
                    r.teacher,
                    r.headTeacher,
                    r.graduateAt,
                    r.targetAvgSalary,
                    r.actualAvgSalary,
                    percent(r.achieveRate),
                    r.archiveCount,
                    r.targetEmpCount,
                    r.actualEmpCount,
                    percent(r.employmentRate),
                    r.salaryOver10k,
                  ]),
                )
              }
            >
              导出CSV
            </Button>
          </Space>
          <Table
            columns={classColumns}
            dataSource={classRows}
            rowKey="id"
            pagination={false}
            scroll={{ x: 1600 }}
            bordered
            summary={() => (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0}>合计/平均</Table.Summary.Cell>
                {/* 空出到毕业时间列 */}
                <Table.Summary.Cell index={1} colSpan={7}></Table.Summary.Cell>
                <Table.Summary.Cell index={8} align="right">
                  {classSummary.targetSalaryAvg}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={9} align="right">
                  {classSummary.actualSalaryAvg}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={10} align="center">
                  {percent(classSummary.achieve)}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={11} align="right">
                  {classSummary.archive}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={12} align="right">
                  {classSummary.target}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={13} align="right">
                  {classSummary.actual}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={14} align="center">
                  {percent(classSummary.employ)}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={15} align="right">
                  {classSummary.over10k}
                </Table.Summary.Cell>
              </Table.Summary.Row>
            )}
          />
        </Card>
      ),
    },
    {
      key: 'stars',
      label: '就业明星汇总',
      children: (
        <Card>
          <Space style={{ marginBottom: 12 }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={openStarModal}>
              新增
            </Button>
            <Button
              icon={<DownloadOutlined />}
              onClick={() =>
                exportCsv(
                  '就业明星汇总表',
                  starColumns.map((c) => c.title as string),
                  starRows.map((r) => [
                    r.order,
                    r.name,
                    r.gender,
                    r.age,
                    r.degree,
                    r.major,
                    r.schooling,
                    r.className,
                    r.onboardAt,
                    r.city,
                    r.company,
                    r.jobTitle,
                    r.salary,
                  ]),
                )
              }
            >
              导出CSV
            </Button>
          </Space>
          <Table
            columns={starColumns}
            dataSource={starRows}
            rowKey="id"
            pagination={false}
            scroll={{ x: 1300 }}
            bordered
          />
        </Card>
      ),
    },
    {
      key: 'teachers',
      label: '教员就业汇总',
      children: (
        <Card>
          <Space style={{ marginBottom: 12 }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={openTeacherModal}>
              新增明细
            </Button>
            <Button
              icon={<DownloadOutlined />}
              onClick={() =>
                exportCsv(
                  '教员就业汇总明细',
                  [
                    '序号',
                    '教员姓名',
                    '专业',
                    '学制',
                    '班级名称',
                    '毕业时间',
                    '目标平均就业薪资',
                    '实际平均就业薪资',
                    '达标率',
                    '档案人数',
                    '目标就业人数',
                    '实际就业人数',
                    '就业率',
                    '薪资过万人数',
                  ],
                  teacherRows.map((r) => [
                    r.order,
                    r.teacherName,
                    r.major,
                    r.schooling,
                    r.className,
                    r.graduateAt,
                    r.targetAvgSalary,
                    r.actualAvgSalary,
                    percent(r.achieveRate),
                    r.archiveCount,
                    r.targetEmpCount,
                    r.actualEmpCount,
                    percent(r.employmentRate),
                    r.salaryOver10k,
                  ]),
                )
              }
            >
              导出CSV
            </Button>
          </Space>
          <Table
            columns={teacherGroupColumns}
            dataSource={teacherGroups}
            rowKey="key"
            pagination={false}
            scroll={{ x: 1300 }}
            bordered
            expandable={{
              expandedRowRender: (g) => (
                <Table
                  columns={teacherDetailColumns}
                  dataSource={g.rows}
                  rowKey="id"
                  pagination={false}
                  scroll={{ x: 1600 }}
                  bordered
                  summary={() => (
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0}>合计/平均</Table.Summary.Cell>
                      <Table.Summary.Cell index={1} colSpan={3}></Table.Summary.Cell>
                      <Table.Summary.Cell index={4} align="right">
                        {currency(g.agg.targetSalaryAvg)}
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={5} align="right">
                        {currency(g.agg.actualSalaryAvg)}
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={6} align="center">
                        {percent(g.agg.achieve)}
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={7} align="right">
                        {g.agg.archive}
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={8} align="right">
                        {g.agg.target}
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={9} align="right">
                        {g.agg.actual}
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={10} align="center">
                        {percent(g.agg.employ)}
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={11} align="right">
                        {g.agg.over10k}
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={12}></Table.Summary.Cell>
                    </Table.Summary.Row>
                  )}
                />
              ),
            }}
            summary={() => (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0}>合计/平均</Table.Summary.Cell>
                <Table.Summary.Cell index={1} align="right">
                  {teacherSummary.targetSalaryAvg}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2} align="right">
                  {teacherSummary.actualSalaryAvg}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3} align="center">
                  {percent(teacherSummary.achieve)}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={4} align="right">
                  {teacherSummary.archive}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={5} align="right">
                  {teacherSummary.target}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={6} align="right">
                  {teacherSummary.actual}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={7} align="center">
                  {percent(teacherSummary.employ)}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={8} align="right">
                  {teacherSummary.over10k}
                </Table.Summary.Cell>
              </Table.Summary.Row>
            )}
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
          主神殿后端就业汇总
        </Title>
      </div>
      <Tabs items={tabs} />

      {/* 班级 - 录入 */}
      <Modal
        title="新增班级就业记录"
        open={classOpen}
        onOk={saveClass}
        onCancel={() => setClassOpen(false)}
        width={900}
        destroyOnHidden
      >
        <Form form={classForm} layout="vertical">
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="campus" label="神殿" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
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
          </Row>
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="className" label="班级名称" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
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
          </Row>
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="graduateAt" label="毕业时间" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="targetAvgSalary" label="目标平均就业薪资">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="actualAvgSalary" label="实际平均就业薪资">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
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
            <Col span={6}>
              <Form.Item name="actualEmpCount" label="实际就业人数">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="salaryOver10k" label="薪资过万人数">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* 明星 - 录入 */}
      <Modal
        title="新增就业明星"
        open={starOpen}
        onOk={saveStar}
        onCancel={() => setStarOpen(false)}
        width={900}
        destroyOnHidden
      >
        <Form form={starForm} layout="vertical">
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
              <Form.Item name="age" label="毕业年龄">
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
              <Form.Item name="major" label="专业">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="schooling" label="学制">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="className" label="班级名称">
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
            <Col span={8}>
              <Form.Item name="company" label="就业单位">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="jobTitle" label="就业岗位">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="salary" label="就业薪资">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* 教员 - 录入 */}
      <Modal
        title="新增教员就业记录"
        open={teacherOpen}
        onOk={saveTeacher}
        onCancel={() => setTeacherOpen(false)}
        width={900}
        destroyOnHidden
      >
        <Form form={teacherForm} layout="vertical">
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="teacherName" label="教员姓名" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
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
          </Row>
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="className" label="班级名称">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="graduateAt" label="毕业时间" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="targetAvgSalary" label="目标平均就业薪资">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="actualAvgSalary" label="实际平均就业薪资">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="archiveCount" label="档案人数">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="targetEmpCount" label="目标就业人数">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="actualEmpCount" label="实际就业人数">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="salaryOver10k" label="薪资过万人数">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  )
}

export default EmploymentSummariesPage
