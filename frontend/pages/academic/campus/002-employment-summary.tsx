// 学术->最高议事厅->神殿 后端学员就业汇总表
import React, { useState } from 'react'
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

const { Option } = Select

// 主神殿后端学员就业汇总表数据类型
interface CampusEmploymentRecord {
  id: string
  serialNumber: number
  campus: string // 神殿
  major: string // 专业
  duration: string // 学制
  className: string // 班级名称
  instructor: string // 授课教员
  classTeacher: string // 班主任
  graduationTime: string // 毕业时间
  targetAvgSalary: number // 目标平均就业薪资
  actualAvgSalary: number // 实际平均就业薪资
  achievementRate: number // 达标率
  archiveCount: number // 档案人数
  targetEmploymentCount: number // 目标就业人数
  actualEmploymentCount: number // 实际就业人数
  employmentRate: number // 就业率
  salaryOver10kCount: number // 薪资过万人数
}

const CampusEmploymentSummaryPage: React.FC = () => {
  const { message } = App.useApp()
  const [dataSource, setDataSource] = useState<CampusEmploymentRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<CampusEmploymentRecord | null>(null)
  const [form] = Form.useForm()
  const [searchText, setSearchText] = useState('')

  // 表格列定义
  const columns = [
    {
      title: '序号',
      dataIndex: 'serialNumber',
      key: 'serialNumber',
      width: 80,
      align: 'center' as const,
    },
    {
      title: '神殿',
      dataIndex: 'campus',
      key: 'campus',
      width: 100,
      align: 'center' as const,
    },
    {
      title: '专业',
      dataIndex: 'major',
      key: 'major',
      width: 120,
      align: 'center' as const,
    },
    {
      title: '学制',
      dataIndex: 'duration',
      key: 'duration',
      width: 100,
      align: 'center' as const,
    },
    {
      title: '班级名称',
      dataIndex: 'className',
      key: 'className',
      width: 120,
      align: 'center' as const,
    },
    {
      title: '授课教员',
      dataIndex: 'instructor',
      key: 'instructor',
      width: 120,
      align: 'center' as const,
    },
    {
      title: '班主任',
      dataIndex: 'classTeacher',
      key: 'classTeacher',
      width: 120,
      align: 'center' as const,
    },
    {
      title: '毕业时间',
      dataIndex: 'graduationTime',
      key: 'graduationTime',
      width: 120,
      align: 'center' as const,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '目标平均就业薪资',
      dataIndex: 'targetAvgSalary',
      key: 'targetAvgSalary',
      width: 150,
      align: 'center' as const,
      render: (salary: number) => `¥${salary.toLocaleString()}`,
    },
    {
      title: '实际平均就业薪资',
      dataIndex: 'actualAvgSalary',
      key: 'actualAvgSalary',
      width: 150,
      align: 'center' as const,
      render: (salary: number) => `¥${salary.toLocaleString()}`,
    },
    {
      title: '达标率',
      dataIndex: 'achievementRate',
      key: 'achievementRate',
      width: 100,
      align: 'center' as const,
      render: (rate: number) => (
        <Tag color={rate >= 95 ? 'green' : rate >= 90 ? 'orange' : 'red'}>{rate.toFixed(1)}%</Tag>
      ),
    },
    {
      title: '档案人数',
      dataIndex: 'archiveCount',
      key: 'archiveCount',
      width: 100,
      align: 'center' as const,
    },
    {
      title: '目标就业人数',
      dataIndex: 'targetEmploymentCount',
      key: 'targetEmploymentCount',
      width: 120,
      align: 'center' as const,
    },
    {
      title: '实际就业人数',
      dataIndex: 'actualEmploymentCount',
      key: 'actualEmploymentCount',
      width: 120,
      align: 'center' as const,
    },
    {
      title: '就业率',
      dataIndex: 'employmentRate',
      key: 'employmentRate',
      width: 100,
      align: 'center' as const,
      render: (rate: number) => (
        <Tag color={rate >= 95 ? 'green' : rate >= 90 ? 'orange' : 'red'}>{rate.toFixed(1)}%</Tag>
      ),
    },
    {
      title: '薪资过万人数',
      dataIndex: 'salaryOver10kCount',
      key: 'salaryOver10kCount',
      width: 120,
      align: 'center' as const,
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      align: 'center' as const,
      fixed: 'right' as const,
      render: (_, record: CampusEmploymentRecord) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这条记录吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" icon={<DeleteOutlined />} danger size="small">
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  // 处理编辑
  const handleEdit = (record: CampusEmploymentRecord) => {
    setEditingRecord(record)
    setModalVisible(true)
    form.setFieldsValue({
      ...record,
      graduationTime: dayjs(record.graduationTime),
    })
  }

  // 处理删除
  const handleDelete = (id: string) => {
    setDataSource(dataSource.filter((item) => item.id !== id))
    message.success('删除成功')
  }

  // 处理新增
  const handleAdd = () => {
    setEditingRecord(null)
    setModalVisible(true)
    form.resetFields()
  }

  // 处理提交
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const formData = {
        ...values,
        graduationTime: values.graduationTime.format('YYYY-MM-DD'),
        id: editingRecord?.id || Date.now().toString(),
        serialNumber: editingRecord?.serialNumber || dataSource.length + 1,
      }

      if (editingRecord) {
        setDataSource(dataSource.map((item) => (item.id === editingRecord.id ? formData : item)))
        message.success('更新成功')
      } else {
        setDataSource([...dataSource, formData])
        message.success('添加成功')
      }

      setModalVisible(false)
      form.resetFields()
    } catch (error) {
      console.error('表单验证失败:', error)
    }
  }

  // 计算统计数据
  const stats = React.useMemo(() => {
    const totalArchive = dataSource.reduce((sum, item) => sum + item.archiveCount, 0)
    const totalTargetEmployment = dataSource.reduce(
      (sum, item) => sum + item.targetEmploymentCount,
      0,
    )
    const totalActualEmployment = dataSource.reduce(
      (sum, item) => sum + item.actualEmploymentCount,
      0,
    )
    const totalSalaryOver10k = dataSource.reduce((sum, item) => sum + item.salaryOver10kCount, 0)
    const totalTargetSalary = dataSource.reduce((sum, item) => sum + item.targetAvgSalary, 0)
    const totalActualSalary = dataSource.reduce((sum, item) => sum + item.actualAvgSalary, 0)
    const totalAchievementRate = dataSource.reduce((sum, item) => sum + item.achievementRate, 0)
    const totalEmploymentRate = dataSource.reduce((sum, item) => sum + item.employmentRate, 0)
    const recordCount = dataSource.length

    return {
      totalArchive,
      totalTargetEmployment,
      totalActualEmployment,
      totalSalaryOver10k,
      averageTargetSalary: recordCount ? totalTargetSalary / recordCount : null,
      averageActualSalary: recordCount ? totalActualSalary / recordCount : null,
      averageAchievementRate: recordCount ? totalAchievementRate / recordCount : null,
      averageEmploymentRate: recordCount ? totalEmploymentRate / recordCount : null,
    }
  }, [dataSource])

  // 过滤数据
  const filteredData = dataSource.filter(
    (item) =>
      item.campus.includes(searchText) ||
      item.major.includes(searchText) ||
      item.className.includes(searchText) ||
      item.instructor.includes(searchText) ||
      item.classTeacher.includes(searchText),
  )

  return (
    <div style={{ padding: 24 }}>
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总档案人数"
              value={stats.totalArchive}
              prefix={<UserOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="总目标就业人数"
              value={stats.totalTargetEmployment}
              prefix={<TrophyOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="总实际就业人数"
              value={stats.totalActualEmployment}
              prefix={<TrophyOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="薪资过万总人数"
              value={stats.totalSalaryOver10k}
              prefix={<DollarOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        {/* 操作栏 */}
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新增记录
            </Button>
            <Input
              placeholder="搜索神殿、专业、班级、教员..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 300 }}
            />
          </Space>
        </div>

        {/* 数据表格 */}
        <Table
          columns={columns}
          dataSource={filteredData}
          loading={loading}
          rowKey="id"
          scroll={{ x: 2000 }}
          pagination={{
            total: filteredData.length,
            defaultPageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
          }}
          summary={() => {
            const renderCurrency = (value: number | null) =>
              value === null ? (
                <span style={{ color: '#cf1322' }}>#DIV/0!</span>
              ) : (
                `¥${Math.round(value).toLocaleString()}`
              )
            const renderRate = (value: number | null) =>
              value === null ? (
                <span style={{ color: '#cf1322' }}>#DIV/0!</span>
              ) : (
                `${value.toFixed(1)}%`
              )

            return (
              <Table.Summary fixed>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={8}>
                    <strong>合计/平均</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={8}>
                    <strong>{renderCurrency(stats.averageTargetSalary)}</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={9}>
                    <strong>{renderCurrency(stats.averageActualSalary)}</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={10}>
                    <strong>{renderRate(stats.averageAchievementRate)}</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={11}>
                    <strong>{stats.totalArchive}</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={12}>
                    <strong>{stats.totalTargetEmployment}</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={13}>
                    <strong>{stats.totalActualEmployment}</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={14}>
                    <strong>{renderRate(stats.averageEmploymentRate)}</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={15}>
                    <strong>{stats.totalSalaryOver10k}</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={16}>
                    <strong>-</strong>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            )
          }}
        />
      </Card>

      {/* 编辑模态框 */}
      <Modal
        title={editingRecord ? '编辑就业记录' : '新增就业记录'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setModalVisible(false)
          form.resetFields()
        }}
        width={800}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            campus: '盛邦',
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="campus"
                label="神殿"
                rules={[{ required: true, message: '请选择神殿' }]}
              >
                <Select>
                  <Option value="盛邦">盛邦</Option>
                  <Option value="冀美">冀美</Option>
                </Select>
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
                name="duration"
                label="学制"
                rules={[{ required: true, message: '请输入学制' }]}
              >
                <Input placeholder="如：6个月" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="className"
                label="班级名称"
                rules={[{ required: true, message: '请输入班级名称' }]}
              >
                <Input placeholder="如：Y32" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="instructor"
                label="授课教员"
                rules={[{ required: true, message: '请输入授课教员' }]}
              >
                <Input placeholder="请输入授课教员" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="classTeacher"
                label="班主任"
                rules={[{ required: true, message: '请输入班主任' }]}
              >
                <Input placeholder="请输入班主任" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="graduationTime"
                label="毕业时间"
                rules={[{ required: true, message: '请选择毕业时间' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="targetAvgSalary"
                label="目标平均就业薪资"
                rules={[{ required: true, message: '请输入目标平均就业薪资' }]}
              >
                <Input type="number" placeholder="请输入目标薪资" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="actualAvgSalary"
                label="实际平均就业薪资"
                rules={[{ required: true, message: '请输入实际平均就业薪资' }]}
              >
                <Input type="number" placeholder="请输入实际薪资" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="archiveCount"
                label="档案人数"
                rules={[{ required: true, message: '请输入档案人数' }]}
              >
                <Input type="number" placeholder="请输入档案人数" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="targetEmploymentCount"
                label="目标就业人数"
                rules={[{ required: true, message: '请输入目标就业人数' }]}
              >
                <Input type="number" placeholder="请输入目标就业人数" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="actualEmploymentCount"
                label="实际就业人数"
                rules={[{ required: true, message: '请输入实际就业人数' }]}
              >
                <Input type="number" placeholder="请输入实际就业人数" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="achievementRate"
                label="达标率(%)"
                rules={[{ required: true, message: '请输入达标率' }]}
              >
                <Input type="number" placeholder="请输入达标率" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="employmentRate"
                label="就业率(%)"
                rules={[{ required: true, message: '请输入就业率' }]}
              >
                <Input type="number" placeholder="请输入就业率" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="salaryOver10kCount"
            label="薪资过万人数"
            rules={[{ required: true, message: '请输入薪资过万人数' }]}
          >
            <Input type="number" placeholder="请输入薪资过万人数" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default CampusEmploymentSummaryPage
