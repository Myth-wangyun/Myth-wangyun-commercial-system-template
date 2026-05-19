import React, { useState, useEffect, useMemo } from 'react'
import { App,
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  Popconfirm,
  Tag,
  Typography,
  InputNumber,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FileSearchOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useCampusStore } from '@/stores/campusStore'
import {
  loadCampusData,
  saveCampusData,
} from '@/pages/academic/teaching-content/shared/campusStorage'
import { STORAGE_KEYS, MAJOR_LIST } from '@/pages/academic/teaching-content/constants'

const { Title } = Typography
const { Option } = Select

// Data structure for a detailed position analysis record
interface PositionAnalysisDetailRecord {
  id: string
  major: (typeof MAJOR_LIST)[number]
  positionName: string
  company: string
  location: string
  salaryMin: number
  salaryMax: number
  analyst: string
  analysisDate: string
}

const PositionAnalysisDetailsPage: React.FC = () => {
  const { message } = App.useApp()
  const navigate = useNavigate()
  const { currentCampus } = useCampusStore()
  const [dataSource, setDataSource] = useState<PositionAnalysisDetailRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<PositionAnalysisDetailRecord | null>(null)
  const [form] = Form.useForm<PositionAnalysisDetailRecord>()

  const storageKey = useMemo(() => STORAGE_KEYS.JOB_ANALYSIS_DETAILS, [])

  // Load and save data from/to localStorage
  useEffect(() => {
    setLoading(true)
    const loadedData = loadCampusData<PositionAnalysisDetailRecord[]>(storageKey, currentCampus, [])
    setDataSource(loadedData)
    setLoading(false)
  }, [currentCampus, storageKey])

  useEffect(() => {
    saveCampusData(storageKey, currentCampus, dataSource)
  }, [dataSource, currentCampus, storageKey])

  const handleAdd = () => {
    setEditingRecord(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record: PositionAnalysisDetailRecord) => {
    setEditingRecord(record)
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleDelete = (id: string) => {
    setDataSource((prev) => prev.filter((item) => item.id !== id))
    message.success('删除成功')
  }

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      if (editingRecord) {
        // Update existing record
        setDataSource((prev) =>
          prev.map((item) => (item.id === editingRecord.id ? { ...item, ...values } : item)),
        )
        message.success('更新成功')
      } else {
        // Add new record
        const newRecord: PositionAnalysisDetailRecord = {
          id: Date.now().toString(),
          ...values,
        }
        setDataSource((prev) => [...prev, newRecord])
        message.success('添加成功')
      }
      setModalVisible(false)
    } catch (error) {
      console.error('Failed to save:', error)
    }
  }

  const columns = [
    {
      title: '岗位方向',
      dataIndex: 'major',
      key: 'major',
      render: (major: string) => <Tag>{major}</Tag>,
    },
    { title: '岗位名称', dataIndex: 'positionName', key: 'positionName' },
    { title: '公司', dataIndex: 'company', key: 'company' },
    { title: '地点', dataIndex: 'location', key: 'location' },
    {
      title: '最低薪资',
      dataIndex: 'salaryMin',
      key: 'salaryMin',
      render: (val: number) => (val ? `${val}K` : '-'),
    },
    {
      title: '最高薪资',
      dataIndex: 'salaryMax',
      key: 'salaryMax',
      render: (val: number) => (val ? `${val}K` : '-'),
    },
    { title: '分析人', dataIndex: 'analyst', key: 'analyst' },
    { title: '分析日期', dataIndex: 'analysisDate', key: 'analysisDate' },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: PositionAnalysisDetailRecord) => (
        <Space size="middle">
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确定删除吗？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <Title level={4}>
        <FileSearchOutlined /> 岗位分析详情管理
      </Title>
      <Card>
        <Space style={{ marginBottom: 16 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加岗位分析
          </Button>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            返回汇总表
          </Button>
        </Space>
        <Table columns={columns} dataSource={dataSource} rowKey="id" loading={loading} bordered />
      </Card>

      <Modal
        title={editingRecord ? '编辑岗位分析' : '添加岗位分析'}
        open={modalVisible}
        onOk={handleSave}
        onCancel={() => setModalVisible(false)}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item name="major" label="岗位方向" rules={[{ required: true }]}>
            <Select placeholder="请选择岗位方向">
              {MAJOR_LIST.map((major) => (
                <Option key={major} value={major}>
                  {major}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="positionName" label="岗位名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="company" label="公司">
            <Input />
          </Form.Item>
          <Form.Item name="location" label="地点">
            <Input />
          </Form.Item>
          <Form.Item name="salaryMin" label="最低薪资 (K)">
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="salaryMax" label="最高薪资 (K)">
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="analyst" label="分析人" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="analysisDate" label="分析日期" rules={[{ required: true }]}>
            <Input type="date" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default PositionAnalysisDetailsPage
