// 师资配比表页面
import React, { useState, useEffect } from 'react'
import { App,
  Card,
  Table,
  Button,
  Space,
  Typography,
  Row,
  Col,
  Statistic,
  Alert,
  Tag,
  Select,
  Input,
  Form,
  Modal,
  DatePicker,
  InputNumber,
} from 'antd'
import {
  ReloadOutlined,
  DownloadOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import type { ColumnsType } from 'antd/es/table'
import { useCampusStore } from '@/stores/campusStore'
import { STORAGE_KEYS } from '../teaching-content/constants'
import CampusSelector from '@/components/common/CampusSelector'
import {
  loadCampusData,
  saveCampusData,
  shortCampusName,
} from '../teaching-content/shared/campusStorage'

const { Title, Text } = Typography
const { Option } = Select

// 师资配比数据类型
interface FacultyRatioRecord {
  id: string
  serialNumber: number
  campus: string
  statisticsTime: string
  studentCount: number
  // 教员职数分析
  targetFacultyRatio: string
  targetTeacherCount: number
  actualTeacherCount: number
  teacherVacancy: number
  teacherSurplus: number
  // 干部职数分析
  targetCadreRatio: string
  targetCadreCount: number
  actualCadreCount: number
  cadreVacancy: number
  cadreSurplus: number
}

// 统计数据
interface FacultyRatioSummary {
  totalRecords: number
  totalStudentCount: number
  totalTargetTeacherCount: number
  totalActualTeacherCount: number
  totalTeacherVacancy: number
  totalTeacherSurplus: number
  totalTargetCadreCount: number
  totalActualCadreCount: number
  totalCadreVacancy: number
  totalCadreSurplus: number
  averageFacultyRatio: number
  averageCadreRatio: number
}

const FacultyRatioPage: React.FC = () => {
  const { message } = App.useApp()
  const [data, setData] = useState<FacultyRatioRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<FacultyRatioRecord | null>(null)
  const [form] = Form.useForm()
  const { currentCampus } = useCampusStore()

  // 初始化/按神殿加载
  useEffect(() => {
    const loaded = loadCampusData<FacultyRatioRecord[]>(
      STORAGE_KEYS.STAFFING_RATIO,
      currentCampus,
      [],
    )
    if (loaded.length > 0) {
      setData(loaded)
    } else {
      const init: FacultyRatioRecord[] = [
        {
          id: '1',
          serialNumber: 1,
          campus: shortCampusName(currentCampus),
          statisticsTime: '2024-01',
          studentCount: 0,
          targetFacultyRatio: '1:30',
          targetTeacherCount: 0,
          actualTeacherCount: 0,
          teacherVacancy: 0,
          teacherSurplus: 0,
          targetCadreRatio: '1:3',
          targetCadreCount: 0,
          actualCadreCount: 0,
          cadreVacancy: 0,
          cadreSurplus: 0,
        },
      ]
      setData(init)
      saveCampusData(STORAGE_KEYS.STAFFING_RATIO, currentCampus, init)
    }
  }, [currentCampus])

  useEffect(() => {
    saveCampusData(STORAGE_KEYS.STAFFING_RATIO, currentCampus, data)
  }, [data, currentCampus])

  // 计算统计数据
  const calculateSummary = (): FacultyRatioSummary => {
    if (data.length === 0) {
      return {
        totalRecords: 0,
        totalStudentCount: 0,
        totalTargetTeacherCount: 0,
        totalActualTeacherCount: 0,
        totalTeacherVacancy: 0,
        totalTeacherSurplus: 0,
        totalTargetCadreCount: 0,
        totalActualCadreCount: 0,
        totalCadreVacancy: 0,
        totalCadreSurplus: 0,
        averageFacultyRatio: 0,
        averageCadreRatio: 0,
      }
    }

    const totalStudentCount = data.reduce((sum, record) => sum + record.studentCount, 0)
    const totalTargetTeacherCount = data.reduce((sum, record) => sum + record.targetTeacherCount, 0)
    const totalActualTeacherCount = data.reduce((sum, record) => sum + record.actualTeacherCount, 0)
    const totalTeacherVacancy = data.reduce((sum, record) => sum + record.teacherVacancy, 0)
    const totalTeacherSurplus = data.reduce((sum, record) => sum + record.teacherSurplus, 0)
    const totalTargetCadreCount = data.reduce((sum, record) => sum + record.targetCadreCount, 0)
    const totalActualCadreCount = data.reduce((sum, record) => sum + record.actualCadreCount, 0)
    const totalCadreVacancy = data.reduce((sum, record) => sum + record.cadreVacancy, 0)
    const totalCadreSurplus = data.reduce((sum, record) => sum + record.cadreSurplus, 0)

    return {
      totalRecords: data.length,
      totalStudentCount,
      totalTargetTeacherCount,
      totalActualTeacherCount,
      totalTeacherVacancy,
      totalTeacherSurplus,
      totalTargetCadreCount,
      totalActualCadreCount,
      totalCadreVacancy,
      totalCadreSurplus,
      averageFacultyRatio: totalStudentCount > 0 ? totalStudentCount / totalActualTeacherCount : 0,
      averageCadreRatio:
        totalActualTeacherCount > 0 ? totalActualTeacherCount / totalActualCadreCount : 0,
    }
  }

  // 计算配比和空缺/冗余
  const calculateRatios = (record: FacultyRatioRecord) => {
    // 解析目标师资配比 (如 "1:30")
    const [teacherRatio] = record.targetFacultyRatio.split(':').map(Number)
    const targetTeacherCount = Math.ceil(record.studentCount / teacherRatio)

    // 解析目标干部配比 (如 "1:3")
    const [cadreRatio] = record.targetCadreRatio.split(':').map(Number)
    const targetCadreCount = Math.ceil(record.actualTeacherCount / cadreRatio)

    const teacherVacancy = Math.max(0, targetTeacherCount - record.actualTeacherCount)
    const teacherSurplus = Math.max(0, record.actualTeacherCount - targetTeacherCount)
    const cadreVacancy = Math.max(0, targetCadreCount - record.actualCadreCount)
    const cadreSurplus = Math.max(0, record.actualCadreCount - targetCadreCount)

    return {
      ...record,
      targetTeacherCount,
      targetCadreCount,
      teacherVacancy,
      teacherSurplus,
      cadreVacancy,
      cadreSurplus,
    }
  }

  // 添加新记录
  const handleAdd = () => {
    setEditingRecord(null)
    form.resetFields()
    setModalVisible(true)
  }

  // 编辑记录
  const handleEdit = (record: FacultyRatioRecord) => {
    setEditingRecord(record)
    form.setFieldsValue({
      ...record,
      statisticsTime: record.statisticsTime ? dayjs(record.statisticsTime) : null,
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
      const formData = {
        ...values,
        statisticsTime: values.statisticsTime ? values.statisticsTime.format('YYYY-MM') : '',
      }

      const newRecord: FacultyRatioRecord = {
        id: editingRecord?.id || Date.now().toString(),
        serialNumber: editingRecord?.serialNumber || data.length + 1,
        campus: formData.campus || '盛邦',
        statisticsTime: formData.statisticsTime,
        studentCount: formData.studentCount || 0,
        targetFacultyRatio: formData.targetFacultyRatio || '1:30',
        actualTeacherCount: formData.actualTeacherCount || 0,
        targetCadreRatio: formData.targetCadreRatio || '1:3',
        actualCadreCount: formData.actualCadreCount || 0,
        targetTeacherCount: 0,
        teacherVacancy: 0,
        teacherSurplus: 0,
        targetCadreCount: 0,
        cadreVacancy: 0,
        cadreSurplus: 0,
      }

      const updatedRecord = calculateRatios(newRecord)

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
    link.setAttribute('download', `师资配比表_${dayjs().format('YYYY-MM-DD')}.csv`)
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
      '统计时间',
      '学生人数',
      '目标师资配比',
      '目标老师数量',
      '实际老师数量',
      '老师空缺',
      '老师冗余',
      '目标干部与教员配比',
      '目标干部数量',
      '实际干部数量',
      '干部空缺',
      '干部冗余',
    ]

    const rows = data.map((record) => [
      record.serialNumber,
      record.campus,
      record.statisticsTime,
      record.studentCount,
      record.targetFacultyRatio,
      record.targetTeacherCount,
      record.actualTeacherCount,
      record.teacherVacancy,
      record.teacherSurplus,
      record.targetCadreRatio,
      record.targetCadreCount,
      record.actualCadreCount,
      record.cadreVacancy,
      record.cadreSurplus,
    ])

    const summary = calculateSummary()
    const summaryRow = [
      '合计/平均',
      '',
      '',
      summary.totalStudentCount,
      '',
      summary.totalTargetTeacherCount.toFixed(1),
      summary.totalActualTeacherCount,
      summary.totalTeacherVacancy,
      summary.totalTeacherSurplus,
      '',
      summary.totalTargetCadreCount.toFixed(1),
      summary.totalActualCadreCount,
      summary.totalCadreVacancy,
      summary.totalCadreSurplus,
    ]

    return [headers, ...rows, summaryRow]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n')
  }

  // 表格列定义
  const columns: ColumnsType<FacultyRatioRecord> = [
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
      title: '统计时间',
      dataIndex: 'statisticsTime',
      key: 'statisticsTime',
      width: 100,
    },
    {
      title: '学生人数',
      dataIndex: 'studentCount',
      key: 'studentCount',
      width: 100,
      align: 'right',
    },
    {
      title: '教员职数分析',
      children: [
        {
          title: '目标师资配比',
          dataIndex: 'targetFacultyRatio',
          key: 'targetFacultyRatio',
          width: 100,
          align: 'center',
        },
        {
          title: '目标老师数量',
          dataIndex: 'targetTeacherCount',
          key: 'targetTeacherCount',
          width: 100,
          align: 'right',
          render: (value) => (value ? value.toFixed(1) : '-'),
        },
        {
          title: '实际老师数量',
          dataIndex: 'actualTeacherCount',
          key: 'actualTeacherCount',
          width: 100,
          align: 'right',
        },
        {
          title: '老师空缺',
          dataIndex: 'teacherVacancy',
          key: 'teacherVacancy',
          width: 80,
          align: 'right',
          render: (value) => (value > 0 ? <Tag color="red">{value}</Tag> : '-'),
        },
        {
          title: '老师冗余',
          dataIndex: 'teacherSurplus',
          key: 'teacherSurplus',
          width: 80,
          align: 'right',
          render: (value) => (value > 0 ? <Tag color="orange">{value}</Tag> : '-'),
        },
      ],
    },
    {
      title: '干部职数分析',
      children: [
        {
          title: '目标干部与教员配比',
          dataIndex: 'targetCadreRatio',
          key: 'targetCadreRatio',
          width: 120,
          align: 'center',
        },
        {
          title: '目标干部数量',
          dataIndex: 'targetCadreCount',
          key: 'targetCadreCount',
          width: 100,
          align: 'right',
          render: (value) => (value ? value.toFixed(1) : '-'),
        },
        {
          title: '实际干部数量',
          dataIndex: 'actualCadreCount',
          key: 'actualCadreCount',
          width: 100,
          align: 'right',
        },
        {
          title: '干部空缺',
          dataIndex: 'cadreVacancy',
          key: 'cadreVacancy',
          width: 80,
          align: 'right',
          render: (value) => (value > 0 ? <Tag color="red">{value}</Tag> : '-'),
        },
        {
          title: '干部冗余',
          dataIndex: 'cadreSurplus',
          key: 'cadreSurplus',
          width: 80,
          align: 'right',
          render: (value) => (value > 0 ? <Tag color="orange">{value}</Tag> : '-'),
        },
      ],
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
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
            size="small"
          >
            删除
          </Button>
        </Space>
      ),
    },
  ]

  const summary = calculateSummary()

  return (
    <div style={{ padding: 24 }}>
      <div className="mb-4">
        <Title level={2}>
          <TeamOutlined className="me-2" />
          主神殿智慧司师资配比表
        </Title>
        <Text type="secondary">管理智慧司门教员和干部的配比分析</Text>
      </div>

      <div className="mb-4">
        <CampusSelector />
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} className="mb-4">
        <Col xs={24} sm={12} md={6}>
          <Card className="text-center">
            <Statistic title="总记录数" value={summary.totalRecords} prefix={<ReloadOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="text-center">
            <Statistic
              title="总学生人数"
              value={summary.totalStudentCount}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="text-center">
            <Statistic
              title="教员空缺总数"
              value={summary.totalTeacherVacancy}
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="text-center">
            <Statistic
              title="干部空缺总数"
              value={summary.totalCadreVacancy}
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 操作按钮 */}
      <div className="mb-4">
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加记录
          </Button>
          <Button icon={<DownloadOutlined />} onClick={handleExport}>
            导出数据
          </Button>
        </Space>
      </div>

      {/* 数据表格 */}
      <Card>
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
                  <Table.Summary.Cell index={0} colSpan={4}>
                    <div style={{ textAlign: 'center', color: '#ff4d4f', fontWeight: 'bold' }}>
                      合计/平均
                    </div>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={4} align="right">
                    {summary.totalTargetTeacherCount.toFixed(1)}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={5} align="right">
                    {summary.totalActualTeacherCount}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={6} align="right">
                    {summary.totalTeacherVacancy}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={7} align="right">
                    {summary.totalTeacherSurplus}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={8} align="right">
                    {summary.totalTargetCadreCount.toFixed(1)}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={9} align="right">
                    {summary.totalActualCadreCount}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={10} align="right">
                    {summary.totalCadreVacancy}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={11} align="right">
                    {summary.totalCadreSurplus}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={12} colSpan={1}></Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            )
          }}
        />
      </Card>

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
            targetFacultyRatio: '1:30',
            targetCadreRatio: '1:3',
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
                  <Option value="其他">其他</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="statisticsTime"
                label="统计时间"
                rules={[{ required: true, message: '请选择统计时间' }]}
              >
                <DatePicker picker="month" style={{ width: '100%' }} placeholder="请选择统计时间" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="studentCount"
                label="学生人数"
                rules={[{ required: true, message: '请输入学生人数' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入学生人数" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="targetFacultyRatio"
                label="目标师资配比"
                rules={[{ required: true, message: '请选择目标师资配比' }]}
              >
                <Select>
                  <Option value="1:20">1:20</Option>
                  <Option value="1:25">1:25</Option>
                  <Option value="1:30">1:30</Option>
                  <Option value="1:35">1:35</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="actualTeacherCount"
                label="实际老师数量"
                rules={[{ required: true, message: '请输入实际老师数量' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入实际老师数量" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="targetCadreRatio"
                label="目标干部与教员配比"
                rules={[{ required: true, message: '请选择目标干部配比' }]}
              >
                <Select>
                  <Option value="1:2">1:2</Option>
                  <Option value="1:3">1:3</Option>
                  <Option value="1:4">1:4</Option>
                  <Option value="1:5">1:5</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="actualCadreCount"
                label="实际干部数量"
                rules={[{ required: true, message: '请输入实际干部数量' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入实际干部数量" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  )
}

export default FacultyRatioPage
