/**
 * 毕业生访谈记录表
 */

import React, { useState } from 'react'
import { App, Card, Table, Button, Space, Select, Input, Modal, Form } from 'antd'
import {
  ReloadOutlined,
  DownloadOutlined,
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useCampusStore } from '@/stores/campusStore'

const { Option } = Select

// 毕业生访谈记录接口
interface GraduateInterviewRecord {
  key: string
  serialNumber: number // 序号
  studentName: string // 姓名
  className: string // 班级
  consultant: string // 咨询师
  education: string // 学历
  hometown: string // 籍贯
  enrollmentTime: string // 入学时间
  enrollmentMonth: string // 入学年X月
}

const GraduateInterviewTable: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus, getAllCampuses } = useCampusStore()
  const campuses = getAllCampuses()
  const [selectedCampus, setSelectedCampus] = useState<string>(currentCampus || '')
  const [selectedYear, setSelectedYear] = useState<number>(2024)
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1)
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<GraduateInterviewRecord | null>(null)
  const [form] = Form.useForm()

  // 初始化数据
  const [dataSource, setDataSource] = useState<GraduateInterviewRecord[]>([
    {
      key: '1',
      serialNumber: 1,
      studentName: '',
      className: '',
      consultant: '',
      education: '',
      hometown: '',
      enrollmentTime: '',
      enrollmentMonth: '',
    },
  ])

  // 表格列配置
  const columns: ColumnsType<GraduateInterviewRecord> = [
    {
      title: '序号',
      dataIndex: 'serialNumber',
      key: 'serialNumber',
      width: 70,
      align: 'center',
      fixed: 'left',
    },
    {
      title: '姓名',
      dataIndex: 'studentName',
      key: 'studentName',
      width: 100,
      align: 'center',
      fixed: 'left',
    },
    {
      title: '班级',
      dataIndex: 'className',
      key: 'className',
      width: 100,
      align: 'center',
    },
    {
      title: '咨询师',
      dataIndex: 'consultant',
      key: 'consultant',
      width: 100,
      align: 'center',
    },
    {
      title: '学历',
      dataIndex: 'education',
      key: 'education',
      width: 100,
      align: 'center',
    },
    {
      title: '籍贯',
      dataIndex: 'hometown',
      key: 'hometown',
      width: 120,
      align: 'center',
    },
    {
      title: '入学时间',
      dataIndex: 'enrollmentTime',
      key: 'enrollmentTime',
      width: 140,
      align: 'center',
    },
    {
      title: '入学年X月',
      dataIndex: 'enrollmentMonth',
      key: 'enrollmentMonth',
      width: 140,
      align: 'center',
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      align: 'center',
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            danger
            onClick={() => handleDelete(record.key)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ]

  // 添加新行
  const handleAdd = () => {
    const newRecord: GraduateInterviewRecord = {
      key: `${Date.now()}`,
      serialNumber: dataSource.length + 1,
      studentName: '',
      className: '',
      consultant: '',
      education: '',
      hometown: '',
      enrollmentTime: '',
      enrollmentMonth: '',
    }
    setEditingRecord(newRecord)
    form.resetFields()
    setModalVisible(true)
  }

  // 编辑行
  const handleEdit = (record: GraduateInterviewRecord) => {
    setEditingRecord(record)
    form.setFieldsValue({
      ...record,
    })
    setModalVisible(true)
  }

  // 删除行
  const handleDelete = (key: string) => {
    const newData = dataSource.filter((item) => item.key !== key)
    const reNumbered = newData.map((item, index) => ({
      ...item,
      serialNumber: index + 1,
    }))
    setDataSource(reNumbered)
    message.success('已删除')
  }

  // 处理模态框提交
  const handleModalOk = async () => {
    try {
      const values = await form.validateFields()
      if (editingRecord) {
        // 检查是否是新记录（不在 dataSource 中）
        const existingIndex = dataSource.findIndex((item) => item.key === editingRecord.key)
        if (existingIndex >= 0) {
          // 编辑现有记录
          const newData = dataSource.map((item) => {
            if (item.key === editingRecord.key) {
              return {
                ...item,
                ...values,
              }
            }
            return item
          })
          setDataSource(newData)
          message.success('更新成功')
        } else {
          // 添加新记录
          const newRecord: GraduateInterviewRecord = {
            ...editingRecord,
            ...values,
          }
          setDataSource([...dataSource, newRecord])
          message.success('添加成功')
        }
      }
      setModalVisible(false)
      setEditingRecord(null)
      form.resetFields()
    } catch (error) {
      console.error('表单验证失败:', error)
    }
  }

  // 处理刷新
  const handleRefresh = () => {
    setLoading(true)
    setTimeout(() => {
      message.success('数据已刷新')
      setLoading(false)
    }, 500)
  }

  // 处理导出
  const handleExport = () => {
    message.info('导出功能开发中...')
  }

  return (
    <Card
      title={`${selectedCampus || 'XX神殿'}毕业生访谈记录表`}
      extra={
        <Space>
          <Select
            style={{ width: 150 }}
            value={selectedCampus}
            onChange={setSelectedCampus}
            placeholder="选择神殿"
          >
            {campuses.map((campus) => (
              <Option key={campus.id} value={campus.name}>
                {campus.name}
              </Option>
            ))}
          </Select>
          <Select style={{ width: 120 }} value={selectedYear} onChange={setSelectedYear}>
            <Option value={2023}>2023年</Option>
            <Option value={2024}>2024年</Option>
            <Option value={2025}>2025年</Option>
          </Select>
          <Select style={{ width: 100 }} value={selectedMonth} onChange={setSelectedMonth}>
            {Array.from({ length: 12 }, (_, i) => (
              <Option key={i + 1} value={i + 1}>
                {i + 1}月
              </Option>
            ))}
          </Select>
          <Button type="dashed" icon={<PlusOutlined />} onClick={handleAdd}>
            添加
          </Button>
          <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={loading}>
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
        dataSource={dataSource}
        loading={loading}
        pagination={false}
        bordered
        scroll={{ x: 1000 }}
        size="small"
        rowKey="key"
      />

      <style>{`
        .ant-table-cell {
          padding: 8px 4px !important;
          font-size: 12px;
        }
      `}</style>

      {/* 编辑/添加模态框 */}
      <Modal
        title={editingRecord && dataSource.some((item) => item.key === editingRecord.key) ? '编辑毕业生访谈记录' : '添加毕业生访谈记录'}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => {
          setModalVisible(false)
          setEditingRecord(null)
          form.resetFields()
        }}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="studentName"
            label="姓名"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="请输入姓名" />
          </Form.Item>

          <Form.Item name="className" label="班级">
            <Input placeholder="请输入班级" />
          </Form.Item>

          <Form.Item name="consultant" label="咨询师">
            <Input placeholder="请输入咨询师姓名" />
          </Form.Item>

          <Form.Item name="education" label="学历">
            <Input placeholder="请输入学历" />
          </Form.Item>

          <Form.Item name="hometown" label="籍贯">
            <Input placeholder="请输入籍贯" />
          </Form.Item>

          <Form.Item name="enrollmentTime" label="入学时间">
            <Input placeholder="请输入入学时间" />
          </Form.Item>

          <Form.Item name="enrollmentMonth" label="入学年X月">
            <Input placeholder="例如：2022.10.7" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}

export default GraduateInterviewTable
