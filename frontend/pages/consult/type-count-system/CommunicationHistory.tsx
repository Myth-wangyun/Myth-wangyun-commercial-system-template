/**
 * 咨询沟通记录历史组件
 * 在咨询量明细页面展示与该咨询者的所有沟通记录
 * 采用旧版表格样式展示
 */

import React, { useState, useEffect } from 'react'
import { App,
  Modal,
  Table,
  Tag,
  Typography,
  Space,
  Empty,
  Spin,
  Button,
  Popconfirm,
  Tooltip,
} from 'antd'
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import type { CommunicationRecord } from './phoneStatsApi'
import * as api from './phoneStatsApi'
import CommunicationRecordForm from './CommunicationRecordForm'

const { Text } = Typography

interface CommunicationHistoryProps {
  visible: boolean
  onClose: () => void
  记录ID: number
  对象ID?: number
  咨询者姓名?: string
  登记日期?: string | null
  onRefresh?: () => void
}

// 沟通方式颜色映射
const methodColors: Record<string, string> = {
  '电话': 'blue',
  '网聊': 'green',
  '当面': 'orange',
}

// 报名意愿颜色映射
const intentColors: Record<string, string> = {
  'A': 'green',
  'B': 'cyan',
  'C': 'orange',
  'D': 'red',
}

export default function CommunicationHistory({
  visible,
  onClose,
  记录ID,
  对象ID,
  咨询者姓名,
  登记日期,
  onRefresh,
}: CommunicationHistoryProps) {
  const { message } = App.useApp()
  const [loading, setLoading] = useState(false)
  const [records, setRecords] = useState<CommunicationRecord[]>([])
  const [formVisible, setFormVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<CommunicationRecord | null>(null)

  // 加载沟通记录
  const loadRecords = async () => {
    setLoading(true)
    try {
      const result = await api.getCommunicationsByRecordId(记录ID)
      if (result.success) {
        setRecords(result.data || [])
      }
    } catch (error) {
      console.error('加载沟通记录失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (visible && 记录ID) {
      loadRecords()
    }
  }, [visible, 记录ID])

  // 删除记录
  const handleDelete = async (沟通ID: number) => {
    try {
      await api.deleteCommunicationRecord(沟通ID)
      message.success('删除成功')
      loadRecords()
      onRefresh?.()
    } catch (error) {
      message.error('删除失败')
    }
  }

  // 新增记录
  const handleAdd = () => {
    setEditingRecord(null)
    setFormVisible(true)
  }

  // 编辑记录
  const handleEdit = (record: CommunicationRecord) => {
    setEditingRecord(record)
    setFormVisible(true)
  }

  // 表单提交成功
  const handleFormSuccess = () => {
    setFormVisible(false)
    setEditingRecord(null)
    loadRecords()
    onRefresh?.()
  }

  // 计算距上次沟通的天数
  const getDaysSinceLast = (index: number): string => {
    if (index === 0) return '-'
    const current = dayjs(records[index].沟通时间)
    const prev = dayjs(records[index - 1].沟通时间)
    const days = current.diff(prev, 'day')
    return `${days}天`
  }

  // 表格列定义
  const columns = [
    {
      title: '',
      dataIndex: 'index',
      width: 40,
      align: 'center' as const,
      render: (_: any, __: any, index: number) => (
        <Text type="secondary">{index + 1}</Text>
      ),
    },
    {
      title: '咨询时间',
      dataIndex: '沟通时间',
      width: 140,
      render: (val: string) => val ? dayjs(val).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '用时',
      dataIndex: '用时',
      width: 50,
      align: 'center' as const,
      render: (val: number) => val > 0 ? val : 0,
    },
    {
      title: '距上次',
      dataIndex: 'gap',
      width: 65,
      align: 'center' as const,
      render: (_: any, __: any, index: number) => getDaysSinceLast(index),
    },
    {
      title: '方式',
      dataIndex: '沟通方式',
      width: 60,
      align: 'center' as const,
      render: (val: string) => val ? <Tag color={methodColors[val]}>{val}</Tag> : '-',
    },
    {
      title: '需求点',
      dataIndex: '需求点',
      width: 70,
      ellipsis: true,
      render: (val: string) => val || '-',
    },
    {
      title: '关注点',
      dataIndex: '关注点',
      width: 70,
      ellipsis: true,
      render: (val: string) => val || '-',
    },
    {
      title: '抗拒点',
      dataIndex: '抗拒点',
      width: 70,
      ellipsis: true,
      render: (val: string) => val || '-',
    },
    {
      title: '报名意愿',
      dataIndex: '报名意愿',
      width: 70,
      align: 'center' as const,
      render: (val: string) => val ? (
        <Tag color={intentColors[val]}>{val}类</Tag>
      ) : '-',
    },
    {
      title: '具备条件',
      dataIndex: '具备条件',
      width: 80,
      ellipsis: true,
      render: (val: string) => val || '-',
    },
    {
      title: '课程意向',
      dataIndex: '课程意向',
      width: 80,
      ellipsis: true,
      render: (val: string) => val || '-',
    },
    {
      title: '咨询内容',
      dataIndex: '咨询内容',
      width: 200,
      ellipsis: { showTitle: false },
      render: (val: string) => val ? (
        <Tooltip title={val} placement="topLeft">
          <span>{val}</span>
        </Tooltip>
      ) : '-',
    },
    {
      title: '咨询结果',
      dataIndex: '咨询结果',
      width: 200,
      ellipsis: { showTitle: false },
      render: (val: string) => val ? (
        <Tooltip title={val} placement="topLeft">
          <span>{val}</span>
        </Tooltip>
      ) : '-',
    },
    {
      title: '咨询师',
      dataIndex: '咨询师',
      width: 70,
      render: (val: string) => val || '-',
    },
    {
      title: '操作',
      dataIndex: 'action',
      width: 80,
      fixed: 'right' as const,
      render: (_: any, record: CommunicationRecord) => (
        <Space size={0}>
          <Button type="link" size="small" onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定删除这条沟通记录吗？"
            onConfirm={() => handleDelete(record.沟通ID)}
          >
            <Button type="link" size="small" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <>
      <Modal
        title={
          <Space>
            <span>咨询沟通记录</span>
            {咨询者姓名 && <Tag color="blue">{咨询者姓名}</Tag>}
          </Space>
        }
        open={visible}
        onCancel={onClose}
        width={1200}
        footer={null}
        destroyOnClose
      >
        <Spin spinning={loading}>
          <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新增沟通记录
            </Button>
            <Text strong>咨询记录：共 {records.length} 条</Text>
          </div>
          
          {records.length > 0 ? (
            <Table
              bordered
              columns={columns}
              dataSource={records}
              rowKey="沟通ID"
              size="small"
              scroll={{ x: 1400 }}
              pagination={false}
              rowClassName={(_, index) => index % 2 === 0 ? '' : 'ant-table-row-alt'}
            />
          ) : (
            <Empty description="暂无沟通记录" />
          )}
        </Spin>
      </Modal>
      
      <CommunicationRecordForm
        visible={formVisible}
        onClose={() => {
          setFormVisible(false)
          setEditingRecord(null)
        }}
        onSuccess={handleFormSuccess}
        记录ID={记录ID}
        editingRecord={editingRecord}
        登记日期={登记日期}
      />
    </>
  )
}
