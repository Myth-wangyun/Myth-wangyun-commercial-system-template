/**
 * 咨询记录页面
 * 
 * 左侧显示咨询者列表，点击后展示咨询者详情 + 沟通记录表格，
 * 并显示距上次联络天数，方便用户跟进。
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  App,
  Card,
  Table,
  Tag,
  Button,
  Space,
  Input,
  DatePicker,
  Select,
  Tooltip,
  Spin,
  Empty,
  Popconfirm,
  Typography,
  Descriptions,
  Divider,
} from 'antd'
import {
  SearchOutlined,
  ReloadOutlined,
  PlusOutlined,
  PhoneOutlined,
  MessageOutlined,
  ArrowLeftOutlined,
  FieldTimeOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import type { ConsultationRecord } from './types'
import type { CommunicationRecord } from './phoneStatsApi'
import * as api from './api'
import * as phoneApi from './phoneStatsApi'
import InlineCommunicationRecordForm from './InlineCommunicationRecordForm'

const { Text, Title } = Typography
const { RangePicker } = DatePicker

// 报名意向颜色
const intentionColors: Record<string, string> = {
  '强意向': 'green',
  '中意向': 'blue',
  '弱意向': 'orange',
  '无意向': 'default',
  '已报名': 'success',
  '联系不上': 'red',
}

// 沟通方式颜色
const methodColors: Record<string, string> = {
  '电话': 'blue',
  '网聊': 'green',
  '当面': 'orange',
}

// 报名意愿颜色
const intentColors: Record<string, string> = {
  'A': 'green',
  'B': 'cyan',
  'C': 'orange',
  'D': 'red',
}

export default function ConsultationRecords() {
  const { message } = App.useApp()
  // 主表数据
  const [records, setRecords] = useState<ConsultationRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [total, setTotal] = useState(0)
  
  // 筛选
  const [searchText, setSearchText] = useState('')
  const [intentionFilter, setIntentionFilter] = useState<string | undefined>()
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null)
  
  // 选中的咨询者 & 其沟通记录
  const [selectedRecord, setSelectedRecord] = useState<ConsultationRecord | null>(null)
  const [commRecords, setCommRecords] = useState<CommunicationRecord[]>([])
  const [commLoading, setCommLoading] = useState(false)
  
  // 新增/编辑沟通记录表单
  const [formVisible, setFormVisible] = useState(false)
  const [editingComm, setEditingComm] = useState<CommunicationRecord | null>(null)

  // 加载咨询量列表
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = {
        page,
        page_size: pageSize,
      }
      if (searchText) params.keyword = searchText
      if (intentionFilter) params.intention = intentionFilter
      if (dateRange) {
        params.start_date = dateRange[0].format('YYYY-MM-DD')
        params.end_date = dateRange[1].format('YYYY-MM-DD')
      }
      
      const result = await api.getMyConsultations(params)
      if (result.data?.数据列表) {
        setRecords(result.data.数据列表)
        setTotal(result.data.总记录数 || result.data.数据列表.length)
      }
    } catch (error) {
      console.error('加载数据失败:', error)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, searchText, intentionFilter, dateRange])

  useEffect(() => {
    loadData()
  }, [loadData])

  // 加载沟通记录
  const loadCommRecords = useCallback(async (记录ID: number) => {
    setCommLoading(true)
    try {
      const result = await phoneApi.getCommunicationsByRecordId(记录ID)
      if (result.success) {
        setCommRecords(result.data || [])
      }
    } catch (error) {
      console.error('加载沟通记录失败:', error)
    } finally {
      setCommLoading(false)
    }
  }, [])

  // 点击选中咨询者
  const handleSelectRecord = (record: ConsultationRecord) => {
    setSelectedRecord(record)
    loadCommRecords(record.记录ID)
  }

  // 返回列表
  const handleBackToList = () => {
    setSelectedRecord(null)
    setCommRecords([])
  }

  // 计算距上次联络天数
  const daysSinceLastContact = useMemo(() => {
    if (commRecords.length === 0) return null
    const sorted = [...commRecords].sort((a, b) =>
      dayjs(b.沟通时间).valueOf() - dayjs(a.沟通时间).valueOf()
    )
    const lastTime = dayjs(sorted[0].沟通时间)
    return dayjs().diff(lastTime, 'day')
  }, [commRecords])

  // 计算距上次沟通天数 (表格行间)
  const getDaysSinceLast = (list: CommunicationRecord[], index: number): string => {
    if (index === 0) return '-'
    const current = dayjs(list[index].沟通时间)
    const prev = dayjs(list[index - 1].沟通时间)
    const days = current.diff(prev, 'day')
    return `${days}天`
  }

  // 新增沟通记录
  const handleAddComm = () => {
    if (!selectedRecord) return
    setEditingComm(null)
    setFormVisible(true)
  }

  // 编辑沟通记录
  const handleEditComm = (comm: CommunicationRecord) => {
    setEditingComm(comm)
    setFormVisible(true)
  }

  // 删除沟通记录
  const handleDeleteComm = async (沟通ID: number) => {
    if (!selectedRecord) return
    try {
      await phoneApi.deleteCommunicationRecord(沟通ID)
      message.success('删除成功')
      loadCommRecords(selectedRecord.记录ID)
    } catch {
      message.error('删除失败')
    }
  }

  // 表单成功回调
  const handleFormSuccess = () => {
    setFormVisible(false)
    setEditingComm(null)
    if (selectedRecord) {
      loadCommRecords(selectedRecord.记录ID)
    }
  }

  // 搜索
  const handleSearch = () => {
    setPage(1)
    loadData()
  }

  // 重置
  const handleReset = () => {
    setSearchText('')
    setIntentionFilter(undefined)
    setDateRange(null)
    setPage(1)
  }

  // 沟通记录表格列
  const commColumns = [
    {
      title: '序号',
      width: 45,
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
      width: 65,
      align: 'center' as const,
      render: (_: any, __: any, index: number) => getDaysSinceLast(commRecords, index),
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
      width: 80,
      ellipsis: true,
      render: (val: string) => val || '-',
    },
    {
      title: '关注点',
      dataIndex: '关注点',
      width: 80,
      ellipsis: true,
      render: (val: string) => val || '-',
    },
    {
      title: '抗拒点',
      dataIndex: '抗拒点',
      width: 80,
      ellipsis: true,
      render: (val: string) => val || '-',
    },
    {
      title: '报名意愿',
      dataIndex: '报名意愿',
      width: 70,
      align: 'center' as const,
      render: (val: string) => val ? <Tag color={intentColors[val]}>{val}类</Tag> : '-',
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
        <Tooltip title={val} placement="topLeft"><span>{val}</span></Tooltip>
      ) : '-',
    },
    {
      title: '咨询结果',
      dataIndex: '咨询结果',
      width: 200,
      ellipsis: { showTitle: false },
      render: (val: string) => val ? (
        <Tooltip title={val} placement="topLeft"><span>{val}</span></Tooltip>
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
      width: 100,
      fixed: 'right' as const,
      render: (_: any, record: CommunicationRecord) => (
        <Space size={0}>
          <Button type="link" size="small" onClick={() => handleEditComm(record)}>编辑</Button>
          <Popconfirm title="确定删除？" onConfirm={() => handleDeleteComm(record.沟通ID)}>
            <Button type="link" size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  // 主表列
  const columns = [
    {
      title: '登记日期',
      dataIndex: '登记日期',
      width: 100,
      render: (val: string) => val ? dayjs(val).format('YYYY-MM-DD') : '-',
    },
    {
      title: '咨询者姓名',
      dataIndex: '咨询者姓名',
      width: 100,
      render: (val: string, record: ConsultationRecord) => (
        <a onClick={() => handleSelectRecord(record)} style={{ fontWeight: 500 }}>{val || '-'}</a>
      ),
    },
    {
      title: '电话',
      dataIndex: '电话',
      width: 120,
      render: (val: string) => val || '-',
    },
    {
      title: '量来源',
      dataIndex: '量来源',
      width: 70,
      render: (val: string) => val || '-',
    },
    {
      title: '报名意向',
      dataIndex: '报名意向',
      width: 80,
      render: (val: string) => val ? (
        <Tag color={intentionColors[val] || 'default'}>{val}</Tag>
      ) : '-',
    },
    {
      title: '咨询类别',
      dataIndex: '咨询类别',
      width: 70,
      render: (val: string) => val || '-',
    },
    {
      title: '咨询师',
      dataIndex: '咨询师',
      width: 80,
      render: (val: string) => val || '-',
    },
    {
      title: '状态',
      dataIndex: '状态',
      width: 70,
      render: (val: string) => val || '-',
    },
    {
      title: '操作',
      width: 80,
      align: 'center' as const,
      render: (_: any, record: ConsultationRecord) => (
        <Button
          type="primary"
          size="small"
          icon={<MessageOutlined />}
          onClick={() => handleSelectRecord(record)}
        >
          跟进
        </Button>
      ),
    },
  ]

  // ===== 详情视图 =====
  if (selectedRecord) {
    const rec = selectedRecord
    return (
      <div>
        {/* 顶部返回按钮 */}
        <div style={{ marginBottom: 12 }}>
          <Button icon={<ArrowLeftOutlined />} onClick={handleBackToList}>
            返回列表
          </Button>
        </div>

        {/* 咨询者详细信息 */}
        <Card
          size="small"
          style={{ marginBottom: 16 }}
          styles={{ body: { padding: '16px 24px' } }}
        >
          <Descriptions
            column={{ xs: 1, sm: 2, md: 4 }}
            size="small"
            bordered
            labelStyle={{ fontWeight: 500, background: '#f0f5ff', whiteSpace: 'nowrap', width: 100 }}
            contentStyle={{ minWidth: 100 }}
          >
            <Descriptions.Item label="咨询者姓名">
              <Text strong style={{ fontSize: 15 }}>{rec.咨询者姓名 || '-'}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="年龄">{rec.年龄 || '-'}</Descriptions.Item>
            <Descriptions.Item label="性别">{rec.性别 || '-'}</Descriptions.Item>
            <Descriptions.Item label="当前状态">
              <Tag color="blue">{rec.状态 || '-'}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="咨询者电话">
              <Text copyable>{rec.电话 || '-'}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="QQ号">{rec.QQ || '-'}</Descriptions.Item>
            <Descriptions.Item label="微信">{rec.微信 || '-'}</Descriptions.Item>
            <Descriptions.Item label="居住区域">{rec.位置 || rec.地区 || '-'}</Descriptions.Item>
            <Descriptions.Item label="学历">{rec.学历 || '-'}</Descriptions.Item>
            <Descriptions.Item label="学校">{rec.就读学校 || '-'}</Descriptions.Item>
            <Descriptions.Item label="专业">{rec.报名专业 || '-'}</Descriptions.Item>
            <Descriptions.Item label="目前状态">{rec.目前状态 || '-'}</Descriptions.Item>
            <Descriptions.Item label="咨询类别">{rec.咨询类别 || '-'}</Descriptions.Item>
            <Descriptions.Item label="报名意愿">
              <Tag color={intentionColors[rec.报名意向 || ''] || 'default'}>
                {rec.报名意向 || '-'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="咨询师">{rec.咨询师 || '-'}</Descriptions.Item>
            <Descriptions.Item label="登记日期">
              {rec.登记日期 ? dayjs(rec.登记日期).format('YYYY-MM-DD') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="量来源">
              <Tag color="processing">{rec.量来源 || '-'}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="媒体来源">{rec.媒体来源 || '-'}</Descriptions.Item>
            <Descriptions.Item label="关键字">{rec.关键字 || '-'}</Descriptions.Item>
            <Descriptions.Item label="来源类别">{rec.来源类别 || '-'}</Descriptions.Item>
            <Descriptions.Item label="分量人">{rec.分量人 || '-'}</Descriptions.Item>
            <Descriptions.Item label="网聊专员">{rec.网聊专员 || '-'}</Descriptions.Item>
            <Descriptions.Item label="渠道专员">{rec.渠道专员 || '-'}</Descriptions.Item>
            <Descriptions.Item label="县办">{rec.县办 || '-'}</Descriptions.Item>
            <Descriptions.Item label="乡办">{rec.乡办 || '-'}</Descriptions.Item>
            <Descriptions.Item label="信息员">{rec.信息员 || '-'}</Descriptions.Item>
            <Descriptions.Item label="备注" span={4}>
              <Text style={{ whiteSpace: 'pre-wrap' }}>{rec.备注 || '-'}</Text>
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* 咨询记录标题：共 X 条  今天距上次联络已有X天 */}
        <Divider style={{ margin: '8px 0 16px' }} />
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <Title level={4} style={{ margin: 0 }}>
            <FieldTimeOutlined style={{ marginRight: 8 }} />
            咨询记录：共 {commRecords.length} 条
            {daysSinceLastContact !== null && (
              <span style={{ marginLeft: 24 }}>
                今天距上次联络已有
                <Text
                  strong
                  type={daysSinceLastContact > 7 ? 'danger' : daysSinceLastContact > 3 ? 'warning' : 'success'}
                  style={{ fontSize: 20, margin: '0 4px' }}
                >
                  {daysSinceLastContact}
                </Text>
                天
              </span>
            )}
            {daysSinceLastContact === null && commRecords.length === 0 && (
              <span style={{ marginLeft: 24, color: '#999', fontSize: 14 }}>暂无沟通记录</span>
            )}
          </Title>
        </div>

        {/* 沟通记录表格 */}
        <Card
          size="small"
          extra={
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              onClick={handleAddComm}
            >
              新增沟通记录
            </Button>
          }
          styles={{ body: { padding: 0 } }}
        >
          {commLoading ? (
            <div style={{ padding: 40, textAlign: 'center' }}><Spin /></div>
          ) : commRecords.length > 0 ? (
            <Table
              bordered
              columns={commColumns}
              dataSource={commRecords}
              rowKey="沟通ID"
              size="small"
              scroll={{ x: 1500 }}
              pagination={false}
            />
          ) : (
            <Empty
              description="暂无沟通记录，点击右上角新增"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              style={{ padding: 40 }}
            />
          )}
        </Card>

        {/* 新增/编辑沟通记录 - 内联表单 */}
        {formVisible && (
          <InlineCommunicationRecordForm
            onClose={() => {
              setFormVisible(false)
              setEditingComm(null)
            }}
            onSuccess={handleFormSuccess}
            记录ID={selectedRecord.记录ID}
            editingRecord={editingComm}
            登记日期={selectedRecord.登记日期}
          />
        )}
      </div>
    )
  }

  // ===== 列表视图 =====
  return (
    <Card
      title="咨询记录"
      extra={
        <Button icon={<ReloadOutlined />} onClick={loadData}>
          刷新
        </Button>
      }
    >
      {/* 筛选栏 */}
      <Space wrap style={{ marginBottom: 16 }}>
        <Input
          placeholder="搜索姓名/电话/微信"
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          onPressEnter={handleSearch}
          style={{ width: 200 }}
          allowClear
        />
        <Select
          placeholder="报名意向"
          value={intentionFilter}
          onChange={setIntentionFilter}
          allowClear
          style={{ width: 120 }}
          options={[
            { label: '强意向', value: '强意向' },
            { label: '中意向', value: '中意向' },
            { label: '弱意向', value: '弱意向' },
            { label: '无意向', value: '无意向' },
            { label: '已报名', value: '已报名' },
            { label: '联系不上', value: '联系不上' },
          ]}
        />
        <RangePicker
          value={dateRange}
          onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
        />
        <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
          搜索
        </Button>
        <Button onClick={handleReset}>重置</Button>
      </Space>

      {/* 主表格 */}
      <Table
        bordered
        columns={columns}
        dataSource={records}
        rowKey="记录ID"
        loading={loading}
        size="small"
        scroll={{ x: 900 }}
        onRow={(record) => ({
          onClick: () => handleSelectRecord(record),
          style: { cursor: 'pointer' },
        })}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (t) => `共 ${t} 条记录`,
          onChange: (p, ps) => {
            setPage(p)
            setPageSize(ps || 50)
          },
        }}
      />
    </Card>
  )
}
