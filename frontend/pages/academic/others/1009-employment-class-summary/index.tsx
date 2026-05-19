import React, { useState, useEffect } from 'react'
import { App,
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Space,
  Popconfirm,
  Row,
  Col,
  Statistic,
  Tag,
  Typography,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  TrophyOutlined,
  DollarOutlined,
  UserOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { useCampusStore } from '@/stores/campusStore'
import { fetchClassEmploymentSummaries, type ClassEmploymentSummary } from '@/services/classEmploymentSummary'

const { Option } = Select
const { Title } = Typography

// 类型定义
interface EmploymentClassData {
  id: string
  serialNo: number
  campus: string
  major: string
  programLength: string
  className: string
  instructor: string
  homeroomTeacher: string
  graduationDate: string
  targetAvgSalary: number
  actualAvgSalary: number
  achievementRate: number
  fileCount: number
  targetEmploymentCount: number
  actualEmploymentCount: number
  employmentRate: number
  salaryOver10kCount: number
}

// 模拟数据
const mockData: EmploymentClassData[] = [
  {
    id: '1',
    serialNo: 1,
    campus: '主神殿',
    major: '云计算',
    programLength: '6个月',
    className: 'Y32',
    instructor: '超级无敌王泽熙',
    homeroomTeacher: '李老师',
    graduationDate: '2024-01-15',
    targetAvgSalary: 8000,
    actualAvgSalary: 8500,
    achievementRate: 106.25,
    fileCount: 25,
    targetEmploymentCount: 20,
    actualEmploymentCount: 22,
    employmentRate: 88,
    salaryOver10kCount: 8,
  },
  {
    id: '2',
    serialNo: 2,
    campus: '永恒殿',
    major: '前端开发',
    programLength: '4个月',
    className: 'F28',
    instructor: '王老师',
    homeroomTeacher: '赵老师',
    graduationDate: '2024-02-20',
    targetAvgSalary: 7000,
    actualAvgSalary: 7200,
    achievementRate: 102.86,
    fileCount: 30,
    targetEmploymentCount: 25,
    actualEmploymentCount: 28,
    employmentRate: 93.33,
    salaryOver10kCount: 5,
  },
  {
    id: '3',
    serialNo: 3,
    campus: '慈悲殿',
    major: '后端开发',
    programLength: '5个月',
    className: 'B35',
    instructor: '刘老师',
    homeroomTeacher: '陈老师',
    graduationDate: '2024-03-10',
    targetAvgSalary: 9000,
    actualAvgSalary: 9200,
    achievementRate: 102.22,
    fileCount: 20,
    targetEmploymentCount: 18,
    actualEmploymentCount: 19,
    employmentRate: 95,
    salaryOver10kCount: 12,
  },
  {
    id: '4',
    serialNo: 4,
    campus: '李大殿',
    major: '全栈开发',
    programLength: '6个月',
    className: 'FS42',
    instructor: '孙老师',
    homeroomTeacher: '周老师',
    graduationDate: '2024-04-05',
    targetAvgSalary: 8500,
    actualAvgSalary: 8800,
    achievementRate: 103.53,
    fileCount: 22,
    targetEmploymentCount: 20,
    actualEmploymentCount: 21,
    employmentRate: 95.45,
    salaryOver10kCount: 9,
  },
]

const CampusEmploymentClassSummary: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore()
  const [data, setData] = useState<EmploymentClassData[]>(mockData)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<EmploymentClassData | null>(null)
  const [form] = Form.useForm()
  const [searchText, setSearchText] = useState('')
  const [loading, setLoading] = useState(false)

  // 从后端班级就业总结表加载当前神殿的数据
  const loadFromBackend = async () => {
    if (!currentCampus) {
      message.warning('请先选择神殿')
      return
    }

    setLoading(true)
    try {
      const campusName = currentCampus
      const backendData: ClassEmploymentSummary[] = await fetchClassEmploymentSummaries(campusName)

      if (!backendData || backendData.length === 0) {
        message.info('当前神殿暂时没有班级就业总结数据，可先在“班级就业总结”页维护后再重试')
        setData([])
        return
      }

      const mapped: EmploymentClassData[] = backendData.map((s, index) => {
        const graduationDate = `${s.年份}-${String(s.月份).padStart(2, '0')}-01`
        const achievementRate =
          s.目标平均薪资 && s.目标平均薪资 > 0
            ? (s.实际平均薪资 / s.目标平均薪资) * 100
            : 0
        const employmentRate =
          s.档案人数 && s.档案人数 > 0
            ? (s.实际就业人数 / s.档案人数) * 100
            : 0

        return {
          id: s.总结ID?.toString() || `${Date.now()}-${index}`,
          serialNo: index + 1,
          campus: s.神殿,
          major: '', // 专业、学制、教员等可后续从班级配置表补充，这里先留空供人工编辑
          programLength: '',
          className: s.班级名称,
          instructor: '',
          homeroomTeacher: '',
          graduationDate,
          targetAvgSalary: s.目标平均薪资,
          actualAvgSalary: s.实际平均薪资,
          achievementRate,
          fileCount: s.档案人数,
          targetEmploymentCount: s.目标就业人数,
          actualEmploymentCount: s.实际就业人数,
          employmentRate,
          salaryOver10kCount: 0, // 薪资过万人数可后续从就业明细统计，这里先置 0
        }
      })

      setData(mapped)
      message.success('已根据后端班级就业总结自动生成班级汇总数据')
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[就业班级汇总] 从后端获取数据失败:', error)
      message.error('从后端获取班级汇总数据失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  // 页面加载或神殿变化时，尝试自动从后端加载一次
  useEffect(() => {
    if (currentCampus) {
      loadFromBackend()
    }
  }, [currentCampus])

  // 根据神殿和搜索条件过滤数据
  const filteredData = data.filter((item) => {
    // 神殿筛选
    const campusMatch = !currentCampus || item.campus === currentCampus

    // 搜索条件筛选
    const searchMatch =
      !searchText ||
      item.className.toLowerCase().includes(searchText.toLowerCase()) ||
      item.major.toLowerCase().includes(searchText.toLowerCase()) ||
      item.instructor.toLowerCase().includes(searchText.toLowerCase()) ||
      item.homeroomTeacher.toLowerCase().includes(searchText.toLowerCase())

    return campusMatch && searchMatch
  })

  // 计算统计数据（基于过滤后的数据）
  const totalFileCount = filteredData.reduce((sum, item) => sum + item.fileCount, 0)
  const totalTargetEmployment = filteredData.reduce(
    (sum, item) => sum + item.targetEmploymentCount,
    0,
  )
  const totalActualEmployment = filteredData.reduce(
    (sum, item) => sum + item.actualEmploymentCount,
    0,
  )
  const avgEmploymentRate = totalFileCount > 0 ? (totalActualEmployment / totalFileCount) * 100 : 0
  const totalSalaryOver10k = filteredData.reduce((sum, item) => sum + item.salaryOver10kCount, 0)

  const handleAdd = () => {
    setEditingRecord(null)
    form.resetFields()
    setIsModalVisible(true)
  }

  const handleEdit = (record: EmploymentClassData) => {
    setEditingRecord(record)
    form.setFieldsValue({
      ...record,
      graduationDate: record.graduationDate ? dayjs(record.graduationDate) : null,
    })
    setIsModalVisible(true)
  }

  const handleDelete = (id: string) => {
    setData(data.filter((item) => item.id !== id))
    message.success('删除成功')
  }

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields()
      const newRecord: EmploymentClassData = {
        ...values,
        id: editingRecord?.id || Date.now().toString(),
        serialNo: editingRecord?.serialNo || data.length + 1,
        graduationDate: values.graduationDate ? values.graduationDate.format('YYYY-MM-DD') : '',
        achievementRate:
          values.fileCount > 0 ? (values.actualEmploymentCount / values.fileCount) * 100 : 0,
        employmentRate:
          values.fileCount > 0 ? (values.actualEmploymentCount / values.fileCount) * 100 : 0,
      }

      if (editingRecord) {
        setData(data.map((item) => (item.id === editingRecord.id ? newRecord : item)))
        message.success('更新成功')
      } else {
        setData([...data, newRecord])
        message.success('添加成功')
      }

      setIsModalVisible(false)
      form.resetFields()
    } catch (error) {
      console.error('表单验证失败:', error)
    }
  }

  const handleModalCancel = () => {
    setIsModalVisible(false)
    form.resetFields()
  }

  const columns = [
    {
      title: '序号',
      dataIndex: 'serialNo',
      key: 'serialNo',
      width: 80,
      fixed: 'left' as const,
    },
    {
      title: '神殿',
      dataIndex: 'campus',
      key: 'campus',
      width: 100,
      fixed: 'left' as const,
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
      width: 120,
    },
    {
      title: '班主任',
      dataIndex: 'homeroomTeacher',
      key: 'homeroomTeacher',
      width: 120,
    },
    {
      title: '毕业时间',
      dataIndex: 'graduationDate',
      key: 'graduationDate',
      width: 120,
    },
    {
      title: '就业薪资',
      children: [
        {
          title: '目标平均就业薪资',
          dataIndex: 'targetAvgSalary',
          key: 'targetAvgSalary',
          width: 150,
          render: (value: number) => (value ? `¥${value.toLocaleString()}` : '-'),
        },
        {
          title: '实际平均就业薪资',
          dataIndex: 'actualAvgSalary',
          key: 'actualAvgSalary',
          width: 150,
          render: (value: number) => (value ? `¥${value.toLocaleString()}` : '-'),
        },
      ],
    },
    {
      title: '就业率',
      children: [
        {
          title: '达标率',
          dataIndex: 'achievementRate',
          key: 'achievementRate',
          width: 100,
          render: (value: number) => (value ? `${value.toFixed(1)}%` : '-'),
        },
        {
          title: '档案人数',
          dataIndex: 'fileCount',
          key: 'fileCount',
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
          render: (value: number) => (value ? `${value.toFixed(1)}%` : '-'),
        },
      ],
    },
    {
      title: '薪资过万人',
      children: [
        {
          title: '数',
          dataIndex: 'salaryOver10kCount',
          key: 'salaryOver10kCount',
          width: 100,
        },
      ],
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right' as const,
      render: (_: any, record: EmploymentClassData) => (
        <Space size="small">
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这条记录吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      {/* 页面标题 */}
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          <TrophyOutlined style={{ marginRight: 8 }} />
          {currentCampus ? `${currentCampus}后端就业班级汇总表` : '后端就业班级汇总表'}
        </Title>
        {currentCampus && (
          <div style={{ marginTop: 8, color: '#666' }}>当前显示：{currentCampus} 的数据</div>
        )}
      </div>

      <Card>
        {/* 统计卡片 */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Card>
              <Statistic title="总档案人数" value={totalFileCount} prefix={<UserOutlined />} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="总目标就业人数"
                value={totalTargetEmployment}
                prefix={<TrophyOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="总实际就业人数"
                value={totalActualEmployment}
                prefix={<TrophyOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="平均就业率"
                value={avgEmploymentRate}
                precision={1}
                suffix="%"
                prefix={<DollarOutlined />}
              />
            </Card>
          </Col>
        </Row>

        {/* 操作栏 */}
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          <Space>
            <Input
              placeholder="搜索班级名称、专业、教员等"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 300 }}
            />
          </Space>
          <Space>
            <Button onClick={loadFromBackend} disabled={!currentCampus} loading={loading}>
              从后端自动获取
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              添加记录
            </Button>
          </Space>
        </div>

        {/* 表格 */}
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          loading={loading}
          scroll={{ x: 2000 }}
          pagination={{
            total: filteredData.length,
            defaultPageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
          }}
          summary={() => (
            <Table.Summary fixed>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={8}>
                  <strong>合计/平均</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={8}>
                  <strong>-</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={9}>
                  <strong>-</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={10}>
                  <strong>-</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={11}>
                  <strong>{totalFileCount}</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={12}>
                  <strong>{totalTargetEmployment}</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={13}>
                  <strong>{totalActualEmployment}</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={14}>
                  <strong>{avgEmploymentRate.toFixed(1)}%</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={15}>
                  <strong>{totalSalaryOver10k}</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={16}>
                  <strong>-</strong>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            </Table.Summary>
          )}
        />
      </Card>

      {/* 编辑模态框 */}
      <Modal
        title={editingRecord ? '编辑就业班级记录' : '添加就业班级记录'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={800}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="campus"
                label="神殿"
                rules={[{ required: true, message: '请输入神殿' }]}
              >
                <Input placeholder="请输入神殿" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="major"
                label="专业"
                rules={[{ required: true, message: '请输入专业' }]}
              >
                <Input placeholder="请输入专业" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="programLength"
                label="学制"
                rules={[{ required: true, message: '请输入学制' }]}
              >
                <Input placeholder="请输入学制" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="className"
                label="班级名称"
                rules={[{ required: true, message: '请输入班级名称' }]}
              >
                <Input placeholder="请输入班级名称" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="instructor" label="授课教员">
                <Input placeholder="请输入授课教员" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="homeroomTeacher" label="班主任">
                <Input placeholder="请输入班主任" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="graduationDate" label="毕业时间">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="targetAvgSalary" label="目标平均就业薪资">
                <Input type="number" placeholder="请输入目标平均就业薪资" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="actualAvgSalary" label="实际平均就业薪资">
                <Input type="number" placeholder="请输入实际平均就业薪资" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="fileCount" label="档案人数">
                <Input type="number" placeholder="请输入档案人数" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="targetEmploymentCount" label="目标就业人数">
                <Input type="number" placeholder="请输入目标就业人数" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="actualEmploymentCount" label="实际就业人数aaa">
                <Input type="number" placeholder="请输入实际就业人数" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="salaryOver10kCount" label="薪资过万人数">
                <Input type="number" placeholder="请输入薪资过万人数" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  )
}

export default CampusEmploymentClassSummary
