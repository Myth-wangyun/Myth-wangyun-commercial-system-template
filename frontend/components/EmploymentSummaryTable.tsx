import React, { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  DatePicker,
  Space,
  Popconfirm,
  message,
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Divider,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ExportOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import type { ColumnsType } from 'antd/es/table'
import type { EmploymentRecord, EmploymentSummary, EmploymentFormData } from '../types/employment'
import { CAMPUS_OPTIONS, MAJOR_OPTIONS, PROGRAM_LENGTH_OPTIONS } from '../types/employment'

const { Title } = Typography

const parseCurrencyInput = (value?: string): number => {
  if (!value) {
    return 0
  }

  const normalized = value.replace(/¥\s?|(,*)/g, '')
  return Number(normalized || 0)
}

const EmploymentSummaryTable: React.FC = () => {
  const [data, setData] = useState<EmploymentRecord[]>([])
  const loading = false
  const [modalVisible, setModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<EmploymentRecord | null>(null)
  const [form] = Form.useForm()

  // 初始化示例数据
  useEffect(() => {
    const initialData: EmploymentRecord[] = [
      {
        id: '1',
        serialNumber: 1,
        campus: '盛邦',
        major: '云计算',
        programLength: '6个月',
        className: 'Y32',
        instructor: '',
        homeroomTeacher: '',
        graduationTime: '',
        targetAverageSalary: 0,
        actualAverageSalary: 0,
        achievementRate: 0,
        fileCount: 0,
        targetEmploymentCount: 0,
        actualEmploymentCount: 0,
        employmentRate: 0,
        highSalaryCount: 0,
      },
    ]
    setData(initialData)
  }, [])

  // 计算统计数据
  const calculateSummary = (): EmploymentSummary => {
    if (data.length === 0) {
      return {
        totalRecords: 0,
        totalFileCount: 0,
        totalTargetEmploymentCount: 0,
        totalActualEmploymentCount: 0,
        averageEmploymentRate: 0,
        averageTargetSalary: 0,
        averageActualSalary: 0,
        averageAchievementRate: 0,
        totalHighSalaryCount: 0,
      }
    }

    const totalFileCount = data.reduce((sum, record) => sum + record.fileCount, 0)
    const totalTargetEmploymentCount = data.reduce(
      (sum, record) => sum + record.targetEmploymentCount,
      0,
    )
    const totalActualEmploymentCount = data.reduce(
      (sum, record) => sum + record.actualEmploymentCount,
      0,
    )
    const totalTargetSalary = data.reduce((sum, record) => sum + record.targetAverageSalary, 0)
    const totalActualSalary = data.reduce((sum, record) => sum + record.actualAverageSalary, 0)
    const totalAchievementRate = data.reduce((sum, record) => sum + record.achievementRate, 0)
    const totalHighSalaryCount = data.reduce((sum, record) => sum + record.highSalaryCount, 0)

    return {
      totalRecords: data.length,
      totalFileCount,
      totalTargetEmploymentCount,
      totalActualEmploymentCount,
      averageEmploymentRate:
        totalFileCount > 0 ? (totalActualEmploymentCount / totalFileCount) * 100 : 0,
      averageTargetSalary: data.length > 0 ? totalTargetSalary / data.length : 0,
      averageActualSalary: data.length > 0 ? totalActualSalary / data.length : 0,
      averageAchievementRate: data.length > 0 ? totalAchievementRate / data.length : 0,
      totalHighSalaryCount,
    }
  }

  // 计算就业率和达标率
  const calculateRates = (record: EmploymentRecord) => {
    const employmentRate =
      record.fileCount > 0 ? (record.actualEmploymentCount / record.fileCount) * 100 : 0
    const achievementRate =
      record.targetAverageSalary > 0
        ? (record.actualAverageSalary / record.targetAverageSalary) * 100
        : 0

    return {
      ...record,
      employmentRate: Number(employmentRate.toFixed(2)),
      achievementRate: Number(achievementRate.toFixed(2)),
    }
  }

  // 添加新记录
  const handleAdd = () => {
    setEditingRecord(null)
    form.resetFields()
    setModalVisible(true)
  }

  // 编辑记录
  const handleEdit = (record: EmploymentRecord) => {
    setEditingRecord(record)
    form.setFieldsValue({
      ...record,
      graduationTime: record.graduationTime ? dayjs(record.graduationTime) : null,
    })
    setModalVisible(true)
  }

  // 删除记录
  const handleDelete = (id: string) => {
    setData((prev) => prev.filter((item) => item.id !== id))
    message.success('删除成功')
  }

  // 保存记录
  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      const formData: EmploymentFormData = {
        ...values,
        graduationTime: values.graduationTime ? values.graduationTime.format('YYYY-MM-DD') : '',
      }

      const newRecord: EmploymentRecord = {
        id: editingRecord?.id || Date.now().toString(),
        serialNumber: editingRecord?.serialNumber || data.length + 1,
        ...formData,
        targetAverageSalary: formData.targetAverageSalary || 0,
        actualAverageSalary: formData.actualAverageSalary || 0,
        fileCount: formData.fileCount || 0,
        targetEmploymentCount: formData.targetEmploymentCount || 0,
        actualEmploymentCount: formData.actualEmploymentCount || 0,
        highSalaryCount: formData.highSalaryCount || 0,
        employmentRate: 0,
        achievementRate: 0,
      }

      const updatedRecord = calculateRates(newRecord)

      if (editingRecord) {
        setData((prev) => prev.map((item) => (item.id === editingRecord.id ? updatedRecord : item)))
        message.success('更新成功')
      } else {
        setData((prev) => [...prev, updatedRecord])
        message.success('添加成功')
      }

      setModalVisible(false)
      form.resetFields()
    } catch (error) {
      console.error('保存失败:', error)
    }
  }

  // 导出数据
  const handleExport = () => {
    const csvContent = generateCSV()
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `主神殿后端学员就业汇总表_${dayjs().format('YYYY-MM-DD')}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    message.success('导出成功')
  }

  // 生成CSV内容
  const generateCSV = (): string => {
    const headers = [
      '序号',
      '神殿',
      '专业',
      '学制',
      '班级名称',
      '授课教员',
      '班主任',
      '毕业时间',
      '目标平均就业薪资',
      '实际平均就业薪资',
      '达标率(%)',
      '档案人数',
      '目标就业人数',
      '实际就业人数',
      '就业率(%)',
      '薪资过万人数',
    ]

    const rows = data.map((record) => [
      record.serialNumber,
      record.campus,
      record.major,
      record.programLength,
      record.className,
      record.instructor,
      record.homeroomTeacher,
      record.graduationTime,
      record.targetAverageSalary,
      record.actualAverageSalary,
      record.achievementRate,
      record.fileCount,
      record.targetEmploymentCount,
      record.actualEmploymentCount,
      record.employmentRate,
      record.highSalaryCount,
    ])

    const summary = calculateSummary()
    const summaryRow = [
      '合计/平均',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      summary.averageTargetSalary.toFixed(2),
      summary.averageActualSalary.toFixed(2),
      summary.averageAchievementRate.toFixed(2),
      summary.totalFileCount,
      summary.totalTargetEmploymentCount,
      summary.totalActualEmploymentCount,
      summary.averageEmploymentRate.toFixed(2),
      summary.totalHighSalaryCount,
    ]

    return [headers, ...rows, summaryRow]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n')
  }

  // 表格列定义
  const columns: ColumnsType<EmploymentRecord> = [
    {
      title: '序号',
      dataIndex: 'serialNumber',
      key: 'serialNumber',
      width: 60,
      align: 'center',
    },
    {
      title: '神殿',
      dataIndex: 'campus',
      key: 'campus',
      width: 80,
    },
    {
      title: '专业',
      dataIndex: 'major',
      key: 'major',
      width: 100,
    },
    {
      title: '学制',
      dataIndex: 'programLength',
      key: 'programLength',
      width: 80,
    },
    {
      title: '班级名称',
      dataIndex: 'className',
      key: 'className',
      width: 100,
    },
    {
      title: '授课教员',
      dataIndex: 'instructor',
      key: 'instructor',
      width: 100,
    },
    {
      title: '班主任',
      dataIndex: 'homeroomTeacher',
      key: 'homeroomTeacher',
      width: 100,
    },
    {
      title: '毕业时间',
      dataIndex: 'graduationTime',
      key: 'graduationTime',
      width: 120,
    },
    {
      title: '目标平均就业薪资',
      dataIndex: 'targetAverageSalary',
      key: 'targetAverageSalary',
      width: 140,
      align: 'right',
      render: (value) => (value ? `¥${value.toLocaleString()}` : '-'),
    },
    {
      title: '实际平均就业薪资',
      dataIndex: 'actualAverageSalary',
      key: 'actualAverageSalary',
      width: 140,
      align: 'right',
      render: (value) => (value ? `¥${value.toLocaleString()}` : '-'),
    },
    {
      title: '达标率(%)',
      dataIndex: 'achievementRate',
      key: 'achievementRate',
      width: 100,
      align: 'right',
      render: (value) => (value ? `${value}%` : '-'),
    },
    {
      title: '档案人数',
      dataIndex: 'fileCount',
      key: 'fileCount',
      width: 80,
      align: 'right',
    },
    {
      title: '目标就业人数',
      dataIndex: 'targetEmploymentCount',
      key: 'targetEmploymentCount',
      width: 120,
      align: 'right',
    },
    {
      title: '实际就业人数',
      dataIndex: 'actualEmploymentCount',
      key: 'actualEmploymentCount',
      width: 120,
      align: 'right',
    },
    {
      title: '就业率(%)',
      dataIndex: 'employmentRate',
      key: 'employmentRate',
      width: 100,
      align: 'right',
      render: (value) => (value ? `${value}%` : '-'),
    },
    {
      title: '薪资过万人数',
      dataIndex: 'highSalaryCount',
      key: 'highSalaryCount',
      width: 120,
      align: 'right',
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
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
            <Button type="link" danger icon={<DeleteOutlined />} size="small">
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const summary = calculateSummary()

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ marginBottom: '24px' }}>
          <Title level={2} style={{ margin: 0, textAlign: 'center' }}>
            主神殿后端学员就业汇总表
          </Title>
        </div>

        {/* 统计概览 */}
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="总记录数"
                value={summary.totalRecords}
                prefix={<ReloadOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="总档案人数"
                value={summary.totalFileCount}
                prefix={<ReloadOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="平均就业率"
                value={summary.averageEmploymentRate}
                precision={2}
                suffix="%"
                prefix={<ReloadOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="平均实际薪资"
                value={summary.averageActualSalary}
                precision={0}
                prefix="¥"
              />
            </Card>
          </Col>
        </Row>

        {/* 操作按钮 */}
        <div style={{ marginBottom: '16px' }}>
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              添加记录
            </Button>
            <Button icon={<ExportOutlined />} onClick={handleExport}>
              导出数据
            </Button>
          </Space>
        </div>

        {/* 数据表格 */}
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1500 }}
          pagination={{
            defaultPageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          summary={() => {
            if (data.length === 0) return null

            return (
              <Table.Summary fixed>
                <Table.Summary.Row style={{ backgroundColor: '#f0f0f0', fontWeight: 'bold' }}>
                  <Table.Summary.Cell index={0} colSpan={8}>
                    <div style={{ textAlign: 'center', color: '#ff4d4f', fontWeight: 'bold' }}>
                      合计/平均
                    </div>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={8} align="right">
                    ¥{summary.averageTargetSalary.toLocaleString()}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={9} align="right">
                    ¥{summary.averageActualSalary.toLocaleString()}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={10} align="right">
                    {summary.averageAchievementRate.toFixed(2)}%
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={11} align="right">
                    {summary.totalFileCount}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={12} align="right">
                    {summary.totalTargetEmploymentCount}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={13} align="right">
                    {summary.totalActualEmploymentCount}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={14} align="right">
                    {summary.averageEmploymentRate.toFixed(2)}%
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={15} align="right">
                    {summary.totalHighSalaryCount}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={16} colSpan={1}></Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            )
          }}
        />

        {/* 编辑模态框 */}
        <Modal
          title={editingRecord ? '编辑记录' : '添加记录'}
          open={modalVisible}
          onOk={handleSave}
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
                  <Select options={CAMPUS_OPTIONS} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="major"
                  label="专业"
                  rules={[{ required: true, message: '请输入专业' }]}
                >
                  <Select options={MAJOR_OPTIONS} />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="programLength"
                  label="学制"
                  rules={[{ required: true, message: '请选择学制' }]}
                >
                  <Select options={PROGRAM_LENGTH_OPTIONS} />
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
                <Form.Item name="instructor" label="授课教员">
                  <Input placeholder="请输入授课教员姓名" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="homeroomTeacher" label="班主任">
                  <Input placeholder="请输入班主任姓名" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="graduationTime" label="毕业时间">
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="fileCount"
                  label="档案人数"
                  rules={[{ required: true, message: '请输入档案人数' }]}
                >
                  <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入档案人数" />
                </Form.Item>
              </Col>
            </Row>

            <Divider>就业薪资信息</Divider>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="targetAverageSalary"
                  label="目标平均就业薪资"
                  rules={[{ required: true, message: '请输入目标平均就业薪资' }]}
                >
                  <InputNumber
                    min={0}
                    style={{ width: '100%' }}
                    placeholder="请输入目标平均就业薪资"
                    formatter={(value) => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={parseCurrencyInput}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="actualAverageSalary"
                  label="实际平均就业薪资"
                  rules={[{ required: true, message: '请输入实际平均就业薪资' }]}
                >
                  <InputNumber
                    min={0}
                    style={{ width: '100%' }}
                    placeholder="请输入实际平均就业薪资"
                    formatter={(value) => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={parseCurrencyInput}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Divider>就业率信息</Divider>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="targetEmploymentCount"
                  label="目标就业人数"
                  rules={[{ required: true, message: '请输入目标就业人数' }]}
                >
                  <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入目标就业人数" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="actualEmploymentCount"
                  label="实际就业人数"
                  rules={[{ required: true, message: '请输入实际就业人数' }]}
                >
                  <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入实际就业人数" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="highSalaryCount"
                  label="薪资过万人数"
                  rules={[{ required: true, message: '请输入薪资过万人数' }]}
                >
                  <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入薪资过万人数" />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Modal>
      </Card>
    </div>
  )
}

export default EmploymentSummaryTable
