/**
 * 分量列表组件 - 用于分配咨询师
 */

import React, { useState, useEffect, useCallback } from 'react'
import {
  App,
  Table,
  Card,
  Input,
  Select,
  DatePicker,
  Button,
  Space,
  Tag,
  Modal,
  Drawer,
  Descriptions,
  Row,
  Col,
  Form,
} from 'antd'
import {
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  PhoneOutlined,
  UserSwitchOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import type { ConsultationRecord, ConsultationQueryParams, FullConsultationInfo } from './types'
import * as api from './api'

const { RangePicker } = DatePicker

interface Props {
  refreshKey?: number
  campus?: string
  currentUserRealName?: string
}

export default function DistributeList({ refreshKey, campus, currentUserRealName }: Props) {
  const { message, notification } = App.useApp()
  const [loading, setLoading] = useState(false)
  const [records, setRecords] = useState<ConsultationRecord[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  
  // 筛选条件
  const [filters, setFilters] = useState<ConsultationQueryParams>({})
  
  // 详情抽屉
  const [detailVisible, setDetailVisible] = useState(false)
  const [detailData, setDetailData] = useState<FullConsultationInfo | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  
  // 分量弹窗
  const [distributeVisible, setDistributeVisible] = useState(false)
  const [distributeRecord, setDistributeRecord] = useState<ConsultationRecord | null>(null)
  const [distributeLoading, setDistributeLoading] = useState(false)
  const [distributeForm] = Form.useForm()
  
  // 选项数据
  const [statusOptions, setStatusOptions] = useState<string[]>([])
  const [sourceOptions, setSourceOptions] = useState<string[]>([])
  const [mediaSourceOptions, setMediaSourceOptions] = useState<string[]>([])

  // 加载选项
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [status, source, mediaSource] = await Promise.all([
          api.getStatusOptions(),
          api.getSourceOptions(),
          api.getMediaSourceOptions(),
        ])
        setStatusOptions(status.data)
        setSourceOptions(source.data)
        setMediaSourceOptions(mediaSource.data)
      } catch (error) {
        console.error('加载选项失败:', error)
      }
    }
    loadOptions()
  }, [])

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const params: ConsultationQueryParams = {
        ...filters,
        campus: campus || filters.campus,
        page,
        page_size: pageSize,
      }
      const result = await api.getConsultationRecords(params)
      setRecords(result.数据列表)
      setTotal(result.总记录数)
    } catch (error) {
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }, [filters, page, pageSize, campus])

  useEffect(() => {
    loadData()
  }, [loadData, refreshKey])

  // 查看详情
  const handleViewDetail = async (record: ConsultationRecord) => {
    setDetailVisible(true)
    setDetailLoading(true)
    try {
      const result = await api.getConsultationObject(record.对象ID)
      setDetailData(result.data)
    } catch (error) {
      message.error('加载详情失败')
    } finally {
      setDetailLoading(false)
    }
  }

  // 打开分量弹窗
  const handleOpenDistribute = (record: ConsultationRecord) => {
    setDistributeRecord(record)
    distributeForm.setFieldsValue({
      咨询师: record.咨询师 || '',
      分量人: currentUserRealName || '',
    })
    setDistributeVisible(true)
  }

  // 执行分量
  const handleDistribute = async () => {
    try {
      const values = await distributeForm.validateFields()
      if (!distributeRecord) return
      
      setDistributeLoading(true)
      
      await api.distributeConsultation(distributeRecord.记录ID, {
        咨询师: values.咨询师,
        分量人: values.分量人 || currentUserRealName,
      })
      
      notification.success({ message: '分量成功', description: '已成功分配咨询师', placement: 'topRight', duration: 3 })
      setDistributeVisible(false)
      distributeForm.resetFields()
      loadData()
    } catch (error: any) {
      notification.error({ message: '分量失败', description: error.response?.data?.detail || '请检查网络连接或联系管理员', placement: 'topRight', duration: 4 })
    } finally {
      setDistributeLoading(false)
    }
  }

  // 搜索
  const handleSearch = () => {
    setPage(1)
    loadData()
  }

  // 重置筛选
  const handleReset = () => {
    setFilters({})
    setPage(1)
  }

  // 表格列
  const columns = [
    {
      title: '登记日期',
      dataIndex: '登记日期',
      width: 140,
      render: (val: string) => val ? dayjs(val).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '电话',
      dataIndex: '电话',
      width: 120,
      render: (val: string) => val ? <Tag icon={<PhoneOutlined />}>{val}</Tag> : '-',
    },
    {
      title: '微信',
      dataIndex: '微信',
      width: 90,
      ellipsis: true,
    },
    {
      title: '咨询者姓名',
      dataIndex: '咨询者姓名',
      width: 90,
      ellipsis: true,
    },
    {
      title: '咨询师',
      dataIndex: '咨询师',
      width: 80,
      render: (val: string) => val ? <Tag color="blue">{val}</Tag> : <Tag color="orange">待分配</Tag>,
    },
    {
      title: '分量人',
      dataIndex: '分量人',
      width: 80,
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: '状态',
      width: 70,
      render: (val: string) => {
        const colorMap: Record<string, string> = {
          '已报名': 'green',
          '已上门': 'blue',
          '有意向': 'cyan',
          '已预约': 'orange',
          '无意向': 'default',
          '已流失': 'red',
          '已退费': 'magenta',
        }
        return val ? <Tag color={colorMap[val] || 'default'}>{val}</Tag> : '-'
      },
    },
    {
      title: '量来源',
      dataIndex: '量来源',
      width: 70,
      ellipsis: true,
    },
    {
      title: '神殿',
      dataIndex: '神殿',
      width: 70,
      ellipsis: true,
    },
    {
      title: '录量人',
      dataIndex: '录量人',
      width: 70,
      ellipsis: true,
    },
    {
      title: '操作',
      width: 140,
      render: (_: any, record: ConsultationRecord) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<UserSwitchOutlined />}
            onClick={() => handleOpenDistribute(record)}
          >
            分量
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <Card title="分量管理">
      {/* 筛选区域 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={4}>
          <Input
            placeholder="电话号码"
            value={filters.phone}
            onChange={e => setFilters(f => ({ ...f, phone: e.target.value }))}
            allowClear
          />
        </Col>
        <Col span={4}>
          <Input
            placeholder="咨询者姓名"
            value={filters.name}
            onChange={e => setFilters(f => ({ ...f, name: e.target.value }))}
            allowClear
          />
        </Col>
        <Col span={4}>
          <Input
            placeholder="咨询师"
            value={filters.consultant}
            onChange={e => setFilters(f => ({ ...f, consultant: e.target.value }))}
            allowClear
          />
        </Col>
        <Col span={4}>
          <Select
            placeholder="状态"
            value={filters.status}
            onChange={v => setFilters(f => ({ ...f, status: v }))}
            allowClear
            style={{ width: '100%' }}
          >
            {statusOptions.map(opt => (
              <Select.Option key={opt} value={opt}>{opt}</Select.Option>
            ))}
          </Select>
        </Col>
        <Col span={5}>
          <RangePicker
            value={[
              filters.start_date ? dayjs(filters.start_date) : null,
              filters.end_date ? dayjs(filters.end_date) : null,
            ]}
            onChange={(dates) => {
              setFilters(f => ({
                ...f,
                start_date: dates?.[0]?.format('YYYY-MM-DD'),
                end_date: dates?.[1]?.format('YYYY-MM-DD'),
              }))
            }}
            style={{ width: '100%' }}
          />
        </Col>
        <Col span={3}>
          <Space>
            <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
              搜索
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleReset}>
              重置
            </Button>
          </Space>
        </Col>
      </Row>

      {/* 表格 */}
      <Table
        columns={columns}
        dataSource={records}
        rowKey="记录ID"
        loading={loading}
        bordered
        tableLayout="auto"
        size="small"
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (t) => `共 ${t} 条记录`,
          onChange: (p, ps) => {
            setPage(p)
            setPageSize(ps)
          },
        }}
      />

      {/* 分量弹窗 */}
      <Modal
        title={<span><UserSwitchOutlined /> 分配咨询师</span>}
        open={distributeVisible}
        onCancel={() => {
          setDistributeVisible(false)
          distributeForm.resetFields()
        }}
        onOk={handleDistribute}
        confirmLoading={distributeLoading}
        okText="确认分量"
        cancelText="取消"
      >
        {distributeRecord && (
          <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
            <p><strong>咨询者：</strong>{distributeRecord.咨询者姓名 || '-'}</p>
            <p><strong>电话：</strong>{distributeRecord.电话 || '-'}</p>
            <p><strong>微信：</strong>{distributeRecord.微信 || '-'}</p>
            <p><strong>登记日期：</strong>{distributeRecord.登记日期 ? dayjs(distributeRecord.登记日期).format('YYYY-MM-DD HH:mm') : '-'}</p>
          </div>
        )}
        <Form form={distributeForm} layout="vertical">
          <Form.Item
            name="咨询师"
            label="咨询师"
            rules={[{ required: true, message: '请输入咨询师姓名' }]}
          >
            <Input placeholder="请输入咨询师姓名" />
          </Form.Item>
          <Form.Item
            name="分量人"
            label="分量人"
          >
            <Input placeholder="分量人" disabled value={currentUserRealName} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 详情抽屉 */}
      <Drawer
        title="咨询详情"
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
        width={600}
        loading={detailLoading}
      >
        {detailData && (
          <>
            <Descriptions title="主表信息" bordered column={2} size="small">
              <Descriptions.Item label="对象ID">{detailData.主表信息?.对象ID}</Descriptions.Item>
              <Descriptions.Item label="咨询次数">{detailData.主表信息?.咨询次数}</Descriptions.Item>
              <Descriptions.Item label="电话列表" span={2}>
                {detailData.主表信息?.电话列表?.map(p => <Tag key={p}>{p}</Tag>)}
              </Descriptions.Item>
              <Descriptions.Item label="最新咨询者">{detailData.主表信息?.最新咨询者姓名}</Descriptions.Item>
              <Descriptions.Item label="最新状态">{detailData.主表信息?.最新状态}</Descriptions.Item>
            </Descriptions>

            <Descriptions title="当前明细" bordered column={2} size="small" style={{ marginTop: 16 }}>
              {detailData.明细列表?.slice(0, 1).map(item => (
                <React.Fragment key={item.记录ID}>
                  <Descriptions.Item label="登记日期">{item.登记日期 ? dayjs(item.登记日期).format('YYYY-MM-DD HH:mm') : '-'}</Descriptions.Item>
                  <Descriptions.Item label="咨询师">{item.咨询师 || '-'}</Descriptions.Item>
                  <Descriptions.Item label="分量人">{item.分量人 || '-'}</Descriptions.Item>
                  <Descriptions.Item label="录量人">{item.录量人 || '-'}</Descriptions.Item>
                  <Descriptions.Item label="状态">{item.状态 || '-'}</Descriptions.Item>
                  <Descriptions.Item label="神殿">{item.神殿 || '-'}</Descriptions.Item>
                </React.Fragment>
              ))}
            </Descriptions>
          </>
        )}
      </Drawer>
    </Card>
  )
}
