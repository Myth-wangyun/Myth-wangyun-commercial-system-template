import React, { useState } from 'react'
import {
  Table,
  Card,
  Typography,
  Space,
  Input,
  Button,
  Row,
  Col,
  Statistic,
  Modal,
  Form,
  InputNumber,
  Select,
  DatePicker,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  SearchOutlined,
  ReloadOutlined,
  DownloadOutlined,
  TeamOutlined,
  EditOutlined,
  PlusOutlined,
  UserOutlined,
  CrownOutlined,
  CalendarOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'

// 定义表格数据的接口
interface TeacherStaffingRatioRecord {
  key: string
  statisticsTime: string // 统计时间
  campus: string // 神殿
  totalStudents: number // 学生总人数
  // 职数分析
  targetTeacherStudentRatio: string // 目标师生配比
  targetTeacherCount: number // 目标老师总数
  actualTeacherCount: number // 实际老师数量
  vacantTeacherPositions: number // 班主任空缺职数
  redundantTeacherPositions: number // 班主任冗余职数
  // 干部职数分析
  targetMiddleManagementRatio: string // 目标中层与班主任配比
  targetMiddleManagementCount: number // 目标中层人数
  actualMiddleManagementCount: number // 实际中层人数
  vacantMiddleManagementPositions: number // 中层空缺职数
  redundantMiddleManagementPositions: number // 中层冗余职数
}

const mockData: TeacherStaffingRatioRecord[] = [
  {
    key: '1',
    statisticsTime: '2024-01',
    campus: '盛邦',
    totalStudents: 406,
    targetTeacherStudentRatio: '1:60',
    targetTeacherCount: 7,
    actualTeacherCount: 7,
    vacantTeacherPositions: 0,
    redundantTeacherPositions: 0,
    targetMiddleManagementRatio: '1:3',
    targetMiddleManagementCount: 2,
    actualMiddleManagementCount: 2,
    vacantMiddleManagementPositions: 0,
    redundantMiddleManagementPositions: 0,
  },
  {
    key: '2',
    statisticsTime: '2024-01',
    campus: '冀美',
    totalStudents: 320,
    targetTeacherStudentRatio: '1:60',
    targetTeacherCount: 6,
    actualTeacherCount: 5,
    vacantTeacherPositions: 1,
    redundantTeacherPositions: 0,
    targetMiddleManagementRatio: '1:3',
    targetMiddleManagementCount: 2,
    actualMiddleManagementCount: 1,
    vacantMiddleManagementPositions: 1,
    redundantMiddleManagementPositions: 0,
  },
  {
    key: '3',
    statisticsTime: '2024-01',
    campus: '石美',
    totalStudents: 280,
    targetTeacherStudentRatio: '1:60',
    targetTeacherCount: 5,
    actualTeacherCount: 6,
    vacantTeacherPositions: 0,
    redundantTeacherPositions: 1,
    targetMiddleManagementRatio: '1:3',
    targetMiddleManagementCount: 2,
    actualMiddleManagementCount: 2,
    vacantMiddleManagementPositions: 0,
    redundantMiddleManagementPositions: 0,
  },
  {
    key: '4',
    statisticsTime: '2024-01',
    campus: '晋美',
    totalStudents: 250,
    targetTeacherStudentRatio: '1:60',
    targetTeacherCount: 5,
    actualTeacherCount: 4,
    vacantTeacherPositions: 1,
    redundantTeacherPositions: 0,
    targetMiddleManagementRatio: '1:3',
    targetMiddleManagementCount: 2,
    actualMiddleManagementCount: 1,
    vacantMiddleManagementPositions: 1,
    redundantMiddleManagementPositions: 0,
  },
  {
    key: '5',
    statisticsTime: '2024-01',
    campus: '原美',
    totalStudents: 200,
    targetTeacherStudentRatio: '1:60',
    targetTeacherCount: 4,
    actualTeacherCount: 4,
    vacantTeacherPositions: 0,
    redundantTeacherPositions: 0,
    targetMiddleManagementRatio: '1:3',
    targetMiddleManagementCount: 1,
    actualMiddleManagementCount: 1,
    vacantMiddleManagementPositions: 0,
    redundantMiddleManagementPositions: 0,
  },
  {
    key: '6',
    statisticsTime: '2024-01',
    campus: '太美',
    totalStudents: 380,
    targetTeacherStudentRatio: '1:60',
    targetTeacherCount: 7,
    actualTeacherCount: 6,
    vacantTeacherPositions: 1,
    redundantTeacherPositions: 0,
    targetMiddleManagementRatio: '1:3',
    targetMiddleManagementCount: 2,
    actualMiddleManagementCount: 2,
    vacantMiddleManagementPositions: 0,
    redundantMiddleManagementPositions: 0,
  },
  {
    key: '7',
    statisticsTime: '2024-01',
    campus: '桂美',
    totalStudents: 180,
    targetTeacherStudentRatio: '1:60',
    targetTeacherCount: 3,
    actualTeacherCount: 3,
    vacantTeacherPositions: 0,
    redundantTeacherPositions: 0,
    targetMiddleManagementRatio: '1:3',
    targetMiddleManagementCount: 1,
    actualMiddleManagementCount: 1,
    vacantMiddleManagementPositions: 0,
    redundantMiddleManagementPositions: 0,
  },
]

const calculateTotals = (data: TeacherStaffingRatioRecord[]) => {
  if (data.length === 0) {
    return {
      key: 'total',
      statisticsTime: '',
      campus: '合计/平均',
      totalStudents: 0,
      targetTeacherStudentRatio: '',
      targetTeacherCount: 0,
      actualTeacherCount: 0,
      vacantTeacherPositions: 0,
      redundantTeacherPositions: 0,
      targetMiddleManagementRatio: '',
      targetMiddleManagementCount: 0,
      actualMiddleManagementCount: 0,
      vacantMiddleManagementPositions: 0,
      redundantMiddleManagementPositions: 0,
    }
  }

  const totals = data.reduce(
    (acc, curr) => {
      acc.totalStudents += curr.totalStudents
      acc.targetTeacherCount += curr.targetTeacherCount
      acc.actualTeacherCount += curr.actualTeacherCount
      acc.vacantTeacherPositions += curr.vacantTeacherPositions
      acc.redundantTeacherPositions += curr.redundantTeacherPositions
      acc.targetMiddleManagementCount += curr.targetMiddleManagementCount
      acc.actualMiddleManagementCount += curr.actualMiddleManagementCount
      acc.vacantMiddleManagementPositions += curr.vacantMiddleManagementPositions
      acc.redundantMiddleManagementPositions += curr.redundantMiddleManagementPositions
      return acc
    },
    {
      totalStudents: 0,
      targetTeacherCount: 0,
      actualTeacherCount: 0,
      vacantTeacherPositions: 0,
      redundantTeacherPositions: 0,
      targetMiddleManagementCount: 0,
      actualMiddleManagementCount: 0,
      vacantMiddleManagementPositions: 0,
      redundantMiddleManagementPositions: 0,
    },
  )

  return {
    key: 'total',
    statisticsTime: '',
    campus: '合计/平均',
    totalStudents: totals.totalStudents,
    targetTeacherStudentRatio: '',
    targetTeacherCount: totals.targetTeacherCount,
    actualTeacherCount: totals.actualTeacherCount,
    vacantTeacherPositions: totals.vacantTeacherPositions,
    redundantTeacherPositions: totals.redundantTeacherPositions,
    targetMiddleManagementRatio: '',
    targetMiddleManagementCount: totals.targetMiddleManagementCount,
    actualMiddleManagementCount: totals.actualMiddleManagementCount,
    vacantMiddleManagementPositions: totals.vacantMiddleManagementPositions,
    redundantMiddleManagementPositions: totals.redundantMiddleManagementPositions,
  }
}

const TeacherStaffingRatioTable: React.FC = () => {
  const [searchText, setSearchText] = useState('')
  const [filteredData, setFilteredData] = useState<TeacherStaffingRatioRecord[]>(mockData)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<TeacherStaffingRatioRecord | null>(null)
  const [form] = Form.useForm()

  const handleSearch = (value: string) => {
    setSearchText(value)
    if (value) {
      const lowercasedValue = value.toLowerCase()
      const filtered = mockData.filter(
        (record) =>
          record.campus.toLowerCase().includes(lowercasedValue) ||
          record.statisticsTime.toLowerCase().includes(lowercasedValue),
      )
      setFilteredData(filtered)
    } else {
      setFilteredData(mockData)
    }
  }

  const handleRefresh = () => {
    setSearchText('')
    setFilteredData(mockData)
  }

  const handleExport = () => {
    // 导出功能
    console.log('导出数据')
  }

  const handleEdit = (record: TeacherStaffingRatioRecord) => {
    setEditingRecord(record)
    form.setFieldsValue({
      ...record,
      statisticsTime: record.statisticsTime ? dayjs(record.statisticsTime) : null,
    })
    setIsModalVisible(true)
  }

  const handleAdd = () => {
    setEditingRecord(null)
    form.resetFields()
    setIsModalVisible(true)
  }

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields()
      const formData = {
        ...values,
        statisticsTime: values.statisticsTime ? values.statisticsTime.format('YYYY-MM') : '',
      }

      if (editingRecord) {
        // 编辑现有记录
        const updatedData = filteredData.map((record) =>
          record.key === editingRecord.key ? { ...record, ...formData } : record,
        )
        setFilteredData(updatedData)
      } else {
        // 添加新记录
        const newRecord: TeacherStaffingRatioRecord = {
          key: Date.now().toString(),
          ...formData,
        }
        const updatedData = [...filteredData, newRecord]
        setFilteredData(updatedData)
      }
      setIsModalVisible(false)
    } catch (error) {
      console.error('表单验证失败:', error)
    }
  }

  const handleModalCancel = () => {
    setIsModalVisible(false)
    form.resetFields()
  }

  const columns: ColumnsType<TeacherStaffingRatioRecord> = [
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
      render: (text, record) => (record.key === 'total' ? '' : text),
    },
    {
      title: '神殿',
      dataIndex: 'campus',
      key: 'campus',
      width: 120,
      fixed: 'left',
      render: (text, record) =>
        record.key === 'total' ? <Typography.Text strong>{text}</Typography.Text> : text,
    },
    {
      title: '学生总人数',
      dataIndex: 'totalStudents',
      key: 'totalStudents',
      width: 120,
      render: (value) => value || '',
    },
    {
      title: '职数分析',
      children: [
        {
          title: '目标师生配比',
          dataIndex: 'targetTeacherStudentRatio',
          key: 'targetTeacherStudentRatio',
          width: 140,
          render: (value) => value || '',
        },
        {
          title: '目标老师总数',
          dataIndex: 'targetTeacherCount',
          key: 'targetTeacherCount',
          width: 140,
          render: (value) => value || '',
        },
        {
          title: '实际老师数量',
          dataIndex: 'actualTeacherCount',
          key: 'actualTeacherCount',
          width: 140,
          render: (value) => value || '',
        },
        {
          title: '班主任空缺职数',
          dataIndex: 'vacantTeacherPositions',
          key: 'vacantTeacherPositions',
          width: 140,
          render: (value, record) => {
            if (record.key === 'total') {
              return <Typography.Text strong>{value || 0}</Typography.Text>
            }
            return value || 0
          },
        },
        {
          title: '班主任冗余职数',
          dataIndex: 'redundantTeacherPositions',
          key: 'redundantTeacherPositions',
          width: 140,
          render: (value, record) => {
            if (record.key === 'total') {
              return <Typography.Text strong>{value || 0}</Typography.Text>
            }
            return value || 0
          },
        },
      ],
    },
    {
      title: '干部职数分析',
      children: [
        {
          title: '目标中层与班主任配比',
          dataIndex: 'targetMiddleManagementRatio',
          key: 'targetMiddleManagementRatio',
          width: 180,
          render: (value) => value || '',
        },
        {
          title: '目标中层人数',
          dataIndex: 'targetMiddleManagementCount',
          key: 'targetMiddleManagementCount',
          width: 140,
          render: (value) => value || '',
        },
        {
          title: '实际中层人数',
          dataIndex: 'actualMiddleManagementCount',
          key: 'actualMiddleManagementCount',
          width: 140,
          render: (value) => value || '',
        },
        {
          title: '中层空缺职数',
          dataIndex: 'vacantMiddleManagementPositions',
          key: 'vacantMiddleManagementPositions',
          width: 140,
          render: (value, record) => {
            if (record.key === 'total') {
              return <Typography.Text strong>{value || 0}</Typography.Text>
            }
            return value || 0
          },
        },
        {
          title: '中层冗余职数',
          dataIndex: 'redundantMiddleManagementPositions',
          key: 'redundantMiddleManagementPositions',
          width: 140,
          render: (value, record) => {
            if (record.key === 'total') {
              return <Typography.Text strong>{value || 0}</Typography.Text>
            }
            return value || 0
          },
        },
      ],
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right',
      render: (_, record) =>
        record.key === 'total' ? (
          ''
        ) : (
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
        ),
    },
  ]

  const summaryRow = calculateTotals(filteredData)
  const dataSourceWithSummary = [...filteredData, summaryRow]

  // 计算关键指标
  const totalStudents = summaryRow.totalStudents
  const totalTargetTeachers = summaryRow.targetTeacherCount
  const totalActualTeachers = summaryRow.actualTeacherCount
  const totalVacantTeacherPositions = summaryRow.vacantTeacherPositions
  const totalRedundantTeacherPositions = summaryRow.redundantTeacherPositions
  const totalTargetMiddleManagement = summaryRow.targetMiddleManagementCount
  const totalActualMiddleManagement = summaryRow.actualMiddleManagementCount
  const totalVacantMiddleManagementPositions = summaryRow.vacantMiddleManagementPositions
  const totalRedundantMiddleManagementPositions = summaryRow.redundantMiddleManagementPositions

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
              prefix={<TeamOutlined style={{ color: '#1890ff' }} />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="目标老师总数"
              value={totalTargetTeachers}
              suffix="人"
              prefix={<UserOutlined style={{ color: '#52c41a' }} />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="实际老师数量"
              value={totalActualTeachers}
              suffix="人"
              prefix={<UserOutlined style={{ color: '#faad14' }} />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="班主任空缺职数"
              value={totalVacantTeacherPositions}
              suffix="人"
              prefix={<UserOutlined style={{ color: '#f5222d' }} />}
            />
          </Col>
        </Row>
        <Row gutter={16} style={{ marginTop: 16 }}>
          <Col span={6}>
            <Statistic
              title="班主任冗余职数"
              value={totalRedundantTeacherPositions}
              suffix="人"
              prefix={<UserOutlined style={{ color: '#722ed1' }} />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="目标中层人数"
              value={totalTargetMiddleManagement}
              suffix="人"
              prefix={<CrownOutlined style={{ color: '#13c2c2' }} />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="实际中层人数"
              value={totalActualMiddleManagement}
              suffix="人"
              prefix={<CrownOutlined style={{ color: '#eb2f96' }} />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="中层空缺职数"
              value={totalVacantMiddleManagementPositions}
              suffix="人"
              prefix={<CrownOutlined style={{ color: '#fa541c' }} />}
            />
          </Col>
        </Row>
      </Card>

      {/* 数据表格 */}
      <Card
        title="12最高议事厅教化司师资配比表"
        extra={
          <Space>
            <Input.Search
              placeholder="搜索神殿或时间"
              onSearch={handleSearch}
              style={{ width: 200 }}
              allowClear
            />
            <Button icon={<PlusOutlined />} onClick={handleAdd}>
              添加
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
              刷新
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

      {/* 编辑/添加模态框 */}
      <Modal
        title={editingRecord ? '编辑师资配比' : '添加师资配比'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={1000}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="statisticsTime"
                label="统计时间"
                rules={[{ required: true, message: '请选择统计时间' }]}
              >
                <DatePicker picker="month" placeholder="选择统计时间" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="campus"
                label="神殿"
                rules={[{ required: true, message: '请输入神殿' }]}
              >
                <Select placeholder="选择神殿">
                  <Select.Option value="盛邦">盛邦</Select.Option>
                  <Select.Option value="冀美">冀美</Select.Option>
                  <Select.Option value="石美">石美</Select.Option>
                  <Select.Option value="晋美">晋美</Select.Option>
                  <Select.Option value="原美">原美</Select.Option>
                  <Select.Option value="太美">太美</Select.Option>
                  <Select.Option value="桂美">桂美</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="totalStudents"
                label="学生总人数"
                rules={[{ required: true, message: '请输入学生总人数' }]}
              >
                <InputNumber min={0} placeholder="请输入学生总人数" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Typography.Title level={5}>职数分析</Typography.Title>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="targetTeacherStudentRatio"
                label="目标师生配比"
                rules={[{ required: true, message: '请输入目标师生配比' }]}
              >
                <Select placeholder="选择配比">
                  <Select.Option value="1:50">1:50</Select.Option>
                  <Select.Option value="1:60">1:60</Select.Option>
                  <Select.Option value="1:70">1:70</Select.Option>
                  <Select.Option value="1:80">1:80</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="targetTeacherCount"
                label="目标老师总数"
                rules={[{ required: true, message: '请输入目标老师总数' }]}
              >
                <InputNumber min={0} placeholder="请输入目标老师总数" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="actualTeacherCount"
                label="实际老师数量"
                rules={[{ required: true, message: '请输入实际老师数量' }]}
              >
                <InputNumber min={0} placeholder="请输入实际老师数量" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="vacantTeacherPositions"
                label="班主任空缺职数"
                rules={[{ required: true, message: '请输入班主任空缺职数' }]}
              >
                <InputNumber min={0} placeholder="请输入班主任空缺职数" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="redundantTeacherPositions"
                label="班主任冗余职数"
                rules={[{ required: true, message: '请输入班主任冗余职数' }]}
              >
                <InputNumber min={0} placeholder="请输入班主任冗余职数" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Typography.Title level={5}>干部职数分析</Typography.Title>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="targetMiddleManagementRatio"
                label="目标中层与班主任配比"
                rules={[{ required: true, message: '请输入目标中层与班主任配比' }]}
              >
                <Select placeholder="选择配比">
                  <Select.Option value="1:2">1:2</Select.Option>
                  <Select.Option value="1:3">1:3</Select.Option>
                  <Select.Option value="1:4">1:4</Select.Option>
                  <Select.Option value="1:5">1:5</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="targetMiddleManagementCount"
                label="目标中层人数"
                rules={[{ required: true, message: '请输入目标中层人数' }]}
              >
                <InputNumber min={0} placeholder="请输入目标中层人数" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="actualMiddleManagementCount"
                label="实际中层人数"
                rules={[{ required: true, message: '请输入实际中层人数' }]}
              >
                <InputNumber min={0} placeholder="请输入实际中层人数" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="vacantMiddleManagementPositions"
                label="中层空缺职数"
                rules={[{ required: true, message: '请输入中层空缺职数' }]}
              >
                <InputNumber min={0} placeholder="请输入中层空缺职数" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="redundantMiddleManagementPositions"
                label="中层冗余职数"
                rules={[{ required: true, message: '请输入中层冗余职数' }]}
              >
                <InputNumber min={0} placeholder="请输入中层冗余职数" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  )
}

export default TeacherStaffingRatioTable
