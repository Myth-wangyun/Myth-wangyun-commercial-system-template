// 学员项目成绩横向记录表（按项目 → 日期 横向展示，支持模态录入）
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
  Select,
  DatePicker,
  Popconfirm,
  Tag,
} from 'antd'
import { PlusOutlined, SettingOutlined, DownloadOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import CampusSelector from '@/components/common/CampusSelector'
import { useCampusStore } from '@/stores/campusStore'

const { Title, Text } = Typography
const { Option } = Select

interface ProjectCfg {
  id: string
  name: string
  dates: string[]
}
interface StudentRow {
  id: string
  order: number
  name: string // 动态字段: p{idx}_{date}_{field}
  [key: string]: any
}

interface MetaInfo {
  campus?: string
  major?: string
  className?: string
  courseName?: string
  teacherName?: string
}

const defaultProjects = (): ProjectCfg[] =>
  [1, 2, 3, 4, 5].map((i) => ({
    id: `p${i}`,
    name: `项目${i}`,
    dates: [0, 1, 2].map((d) => dayjs().add(d, 'day').format('YYYY/M/D')),
  }))
const defaultStudents = (): StudentRow[] =>
  Array.from({ length: 10 }).map((_, i) => ({
    id: String(i + 1),
    order: i + 1,
    name: ['张三', '李四', '王五', '赵六'][i] || '',
  }))

const ProjectScoresHorizontalPage: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore()
  const [meta, setMeta] = useState<MetaInfo>({ campus: currentCampus || '盛邦' })
  const [projects, setProjects] = useState<ProjectCfg[]>(defaultProjects())
  const [students, setStudents] = useState<StudentRow[]>(defaultStudents())

  // 录入成绩
  const [entryOpen, setEntryOpen] = useState(false)
  const [entryForm] = Form.useForm()
  // 配置项目与日期
  const [cfgOpen, setCfgOpen] = useState(false)
  const [cfgForm] = Form.useForm()

  const storageKey = (campus?: string | null) => `project_scores_horizontal_${campus || '主神殿'}`

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(currentCampus))
      if (raw) {
        const parsed = JSON.parse(raw)
        setMeta(parsed.meta || {})
        setProjects(parsed.projects || defaultProjects())
        setStudents(parsed.students || defaultStudents())
      }
    } catch {}
  }, [currentCampus])

  useEffect(() => {
    try {
      localStorage.setItem(storageKey(currentCampus), JSON.stringify({ meta, projects, students }))
    } catch {}
  }, [meta, projects, students, currentCampus])

  // 生成列
  const columns: ColumnsType<StudentRow> = useMemo(() => {
    const cols: ColumnsType<StudentRow> = [
      {
        title: '序号',
        dataIndex: 'order',
        key: 'order',
        width: 60,
        align: 'center',
        fixed: 'left',
      },
      { title: '学员姓名', dataIndex: 'name', key: 'name', width: 120, fixed: 'left' },
    ]
    projects.forEach((p, pi) => {
      const childrenByDate = p.dates.map((dt, di) => ({
        title: dt,
        key: `${p.id}_${di}`,
        children: [
          {
            title: '首次得分',
            dataIndex: `${p.id}_${dt}_first`,
            key: `${p.id}_${dt}_first`,
            width: 100,
            align: 'right' as const,
            render: (v: any) => v ?? '',
          },
          {
            title: '项目点评',
            dataIndex: `${p.id}_${dt}_comment`,
            key: `${p.id}_${dt}_comment`,
            width: 160,
            render: (v: any) => <Text style={{ color: '#888' }}>{v ?? ''}</Text>,
          },
          {
            title: '二次得分',
            dataIndex: `${p.id}_${dt}_second`,
            key: `${p.id}_${dt}_second`,
            width: 100,
            align: 'right' as const,
            render: (v: any) => v ?? '',
          },
        ],
      }))
      cols.push({ title: p.name, key: p.id, children: childrenByDate })
    })
    cols.push({
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 120,
      render: (_, row) => (
        <Space>
          <Button size="small" type="link" onClick={() => onOpenEntry(row.name)}>
            录入
          </Button>
        </Space>
      ),
    })
    return cols
  }, [projects, students])

  // 打开录入
  const onOpenEntry = (studentName?: string) => {
    entryForm.resetFields()
    entryForm.setFieldsValue({
      studentName,
      projectId: projects[0]?.id,
      date: projects[0]?.dates[0],
    })
    setEntryOpen(true)
  }

  const onSaveEntry = async () => {
    const v = await entryForm.validateFields()
    const { studentName, projectId, date, first, comment, second } = v
    // 确保存在学生行
    let target = students.find((s) => s.name === studentName)
    if (!target) {
      target = { id: Date.now().toString(), order: students.length + 1, name: studentName }
      setStudents((prev) => [...prev, target!])
    }
    const fieldFirst = `${projectId}_${date}_first`
    const fieldComment = `${projectId}_${date}_comment`
    const fieldSecond = `${projectId}_${date}_second`
    setStudents((prev) =>
      prev.map((s) =>
        s.name === studentName
          ? { ...s, [fieldFirst]: first, [fieldComment]: comment, [fieldSecond]: second }
          : s,
      ),
    )
    setEntryOpen(false)
    message.success('已保存')
  }

  // 项目配置
  const onOpenCfg = () => {
    cfgForm.setFieldsValue({ projects })
    setCfgOpen(true)
  }
  const onSaveCfg = async () => {
    const v = await cfgForm.validateFields()
    setProjects(v.projects || projects)
    setCfgOpen(false)
    message.success('项目设置已保存')
  }

  // 导出
  const onExport = () => {
    const headers = ['序号', '学员姓名']
    projects.forEach((p) =>
      p.dates.forEach((dt) =>
        headers.push(`${p.name}-${dt}-首分`, `${p.name}-${dt}-点评`, `${p.name}-${dt}-二分`),
      ),
    )
    const body = students.map((s) => [
      s.order,
      s.name,
      ...projects.flatMap((p) =>
        p.dates.flatMap((dt) => [
          s[`${p.id}_${dt}_first`] ?? '',
          s[`${p.id}_${dt}_comment`] ?? '',
          s[`${p.id}_${dt}_second`] ?? '',
        ]),
      ),
    ])
    const csv = [headers, ...body].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `项目成绩横向_${dayjs().format('YYYYMMDD')}.csv`
    a.click()
  }

  return (
    <div style={{ padding: 24 }}>
      <div
        className="mb-3"
        style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}
      >
        <CampusSelector />
        <Title level={4} style={{ margin: 0 }}>
          学员项目成绩横向记录表
        </Title>
        <Space>
          <Button icon={<SettingOutlined />} onClick={onOpenCfg}>
            项目/日期设置
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => onOpenEntry()}>
            录入项目成绩
          </Button>
          <Button icon={<DownloadOutlined />} onClick={onExport}>
            导出CSV
          </Button>
        </Space>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={students}
          rowKey="id"
          pagination={false}
          bordered
          scroll={{ x: 1800, y: 520 }}
        />
      </Card>

      {/* 录入成绩模态框 */}
      <Modal
        title="录入项目成绩"
        open={entryOpen}
        onOk={onSaveEntry}
        onCancel={() => setEntryOpen(false)}
        width={700}
        destroyOnHidden
      >
        <Form form={entryForm} layout="vertical">
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="studentName" label="学员姓名" rules={[{ required: true }]}>
                <Input placeholder="请输入或选择学员姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="projectId" label="项目" rules={[{ required: true }]}>
                <Select>
                  {projects.map((p) => (
                    <Option key={p.id} value={p.id}>
                      {p.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="date" label="日期" rules={[{ required: true }]}>
                <Select>
                  {projects
                    .flatMap((p) => p.dates)
                    .map((d) => (
                      <Option key={d} value={d}>
                        {d}
                      </Option>
                    ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="first" label="首次得分">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="second" label="二次得分">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="comment" label="项目点评">
                <Input />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* 项目/日期设置模态框 */}
      <Modal
        title="项目/日期设置"
        open={cfgOpen}
        onOk={onSaveCfg}
        onCancel={() => setCfgOpen(false)}
        width={900}
        destroyOnHidden
      >
        <Form form={cfgForm} layout="vertical" initialValues={{ projects }}>
          {projects.map((p, i) => (
            <Card key={p.id} size="small" style={{ marginBottom: 12 }} title={`项目${i + 1}`}>
              <Row gutter={12}>
                <Col span={8}>
                  <Form.Item name={['projects', i, 'name']} label="项目名称" initialValue={p.name}>
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={16}>
                  <Form.Item
                    name={['projects', i, 'dates']}
                    label="日期列表(可编辑)"
                    initialValue={p.dates}
                  >
                    <Select mode="tags" tokenSeparators={[',']}></Select>
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          ))}
        </Form>
      </Modal>
    </div>
  )
}

export default ProjectScoresHorizontalPage
