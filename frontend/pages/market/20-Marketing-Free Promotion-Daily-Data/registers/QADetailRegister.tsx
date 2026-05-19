import React, { useState, useEffect } from 'react'
import { App, Table, Button, Form, Input, DatePicker, InputNumber, Modal, Space, Select } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { type Dayjs } from 'dayjs'
import axios from 'axios'

interface QADetailProps {
  campusId: string
  campusName: string
  selectedMonth: Dayjs
  onMonthChange: (month: Dayjs) => void
}

interface DetailRecord {
  key: string
  id?: number
  序号: number
  日期: string
  发布平台: string
  重点人群: string
  主题提问语: string
  问答链接: string
  有效数: number
  备注: string
}

const API_BASE = '/api/v1/market/free-promotion-detail'

const QADetailRegister: React.FC<QADetailProps> = ({ campusId, campusName, selectedMonth, onMonthChange }) => {
  const { message, modal } = App.useApp()
  const [form] = Form.useForm()
  const [dataSource, setDataSource] = useState<DetailRecord[]>([])
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<DetailRecord | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // 加载数据
  const loadData = async () => {
    if (!campusName) return
    
    setLoading(true)
    try {
      const response = await axios.get(`${API_BASE}/qa-detail/list`, {
        params: {
          campus: campusName,
          month: selectedMonth.format('YYYY-MM')
        }
      })
      if (response.data?.code === 0) {
        setDataSource(response.data.data.items || [])
      }
    } catch (error) {
      console.error('加载数据失败:', error)
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [campusName, selectedMonth])

  const columns: ColumnsType<DetailRecord> = [
    {
      title: '序号',
      dataIndex: '序号',
      width: 70,
      align: 'center'
    },
    {
      title: '日期',
      dataIndex: '日期',
      width: 120,
      align: 'center'
    },
    {
      title: '发布平台',
      dataIndex: '发布平台',
      width: 120,
      align: 'center'
    },
    {
      title: '重点人群',
      dataIndex: '重点人群',
      width: 120,
      align: 'center'
    },
    {
      title: '主题/提问语',
      dataIndex: '主题提问语',
      width: 300,
      align: 'center'
    },
    {
      title: '问答链接',
      dataIndex: '问答链接',
      width: 300,
      align: 'center',
      render: (text: string) => (
        <a href={text} target="_blank" rel="noopener noreferrer">
          {text}
        </a>
      )
    },
    {
      title: '有效数',
      dataIndex: '有效数',
      width: 100,
      align: 'center'
    },
    {
      title: '备注',
      dataIndex: '备注',
      width: 200,
      align: 'center'
    },
    {
      title: '操作',
      width: 150,
      fixed: 'right',
      align: 'center',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.key)}
          >
            删除
          </Button>
        </Space>
      )
    }
  ]

  const handleAdd = () => {
    setEditingRecord(null)
    form.resetFields()
    setIsModalVisible(true)
  }

  const handleEdit = (record: DetailRecord) => {
    setEditingRecord(record)
    form.setFieldsValue({
      日期: dayjs(record.日期),
      发布平台: record.发布平台,
      重点人群: record.重点人群,
      主题提问语: record.主题提问语,
      问答链接: record.问答链接,
      有效数: record.有效数,
      备注: record.备注
    })
    setIsModalVisible(true)
  }

  const handleDelete = (key: string) => {
    modal.confirm({
      title: '确认删除',
      content: '确定要删除这条记录吗?',
      onOk: () => {
        setDataSource(dataSource.filter(item => item.key !== key))
        message.success('删除成功')
      }
    })
  }

  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      
      if (editingRecord) {
        setDataSource(dataSource.map(item => {
          if (item.key === editingRecord.key) {
            return {
              ...item,
              日期: values.日期.format('YYYY-MM-DD'),
              发布平台: values.发布平台,
              重点人群: values.重点人群,
              主题提问语: values.主题提问语,
              问答链接: values.问答链接,
              有效数: values.有效数,
              备注: values.备注
            }
          }
          return item
        }))
        message.success('修改成功')
      } else {
        const newRecord: DetailRecord = {
          key: Date.now().toString(),
          序号: dataSource.length + 1,
          日期: values.日期.format('YYYY-MM-DD'),
          发布平台: values.发布平台,
          重点人群: values.重点人群,
          主题提问语: values.主题提问语,
          问答链接: values.问答链接,
          有效数: values.有效数,
          备注: values.备注
        }
        setDataSource([...dataSource, newRecord])
        message.success('添加成功')
      }
      
      setIsModalVisible(false)
      form.resetFields()
    } catch (error) {
      console.error('验证失败:', error)
    }
  }

  const handleCancel = () => {
    setIsModalVisible(false)
    form.resetFields()
  }

  const handleSave = async () => {
    if (dataSource.length === 0) {
      message.warning('请先添加数据')
      return
    }
    
    setSaving(true)
    try {
      const response = await axios.post(`${API_BASE}/qa-detail/save`, {
        campus: campusName,
        month: selectedMonth.format('YYYY-MM'),
        items: dataSource
      })
      if (response.data?.code === 0) {
        message.success('保存成功')
        loadData()
      } else {
        message.error(response.data?.message || '保存失败')
      }
    } catch (error) {
      console.error('保存数据失败:', error)
      message.error('保存失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <h3 style={{ marginBottom: 16 }}>{campusName}-{selectedMonth.format('M')}月问答类登记明细表</h3>
      
      <Space style={{ marginBottom: 16 }}>
        <DatePicker
          picker="month"
          value={selectedMonth}
          onChange={(val) => val && onMonthChange(val)}
          format="YYYY年MM月"
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增记录
        </Button>
        <Button type="primary" onClick={handleSave} loading={saving}>
          保存
        </Button>
      </Space>

      <Table
        columns={columns}
        dataSource={dataSource}
        pagination={false}
        scroll={{ x: 1400 }}
        bordered
        size="small"
        loading={loading}
      />

      <Modal
        title={editingRecord ? '编辑记录' : '新增记录'}
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="日期"
            name="日期"
            rules={[{ required: true, message: '请选择日期' }]}
          >
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>
          
          <Form.Item
            label="发布平台"
            name="发布平台"
            rules={[{ required: true, message: '请选择发布平台' }]}
          >
            <Select placeholder="请选择发布平台">
              <Select.Option value="百度知道">百度知道</Select.Option>
              <Select.Option value="知乎">知乎</Select.Option>
            </Select>
          </Form.Item>
          
          <Form.Item label="重点人群" name="重点人群">
            <Select placeholder="请选择重点人群" allowClear>
              <Select.Option value="初中生">初中生</Select.Option>
              <Select.Option value="高中生">高中生</Select.Option>
              <Select.Option value="三校生">三校生</Select.Option>
              <Select.Option value="大学生">大学生</Select.Option>
              <Select.Option value="退伍">退伍</Select.Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            label="主题/提问语"
            name="主题提问语"
            rules={[{ required: true, message: '请输入主题/提问语' }]}
          >
            <Input.TextArea rows={3} placeholder="请输入问题或主题" />
          </Form.Item>
          
          <Form.Item
            label="问答链接"
            name="问答链接"
            rules={[{ required: true, message: '请输入问答链接' }]}
          >
            <Input placeholder="https://" />
          </Form.Item>
          
          <Form.Item label="有效数" name="有效数">
            <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
          </Form.Item>
          
          <Form.Item label="备注" name="备注">
            <Input.TextArea rows={2} placeholder="备注信息" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default QADetailRegister
