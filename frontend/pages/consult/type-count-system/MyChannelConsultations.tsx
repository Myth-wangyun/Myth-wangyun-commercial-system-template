/**
 * 我的渠道咨询量 — 渠道部人员登录后查看名下咨询量
 * 
 * 功能：
 * 1. 顶部统计卡片（总量/已上门/已报名/已退费/已分配/未分配）
 * 2. 筛选栏：状态、来源、关键字、日期、分配状态
 * 3. 咨询量列表表格
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  App,
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Divider,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Switch,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd'
import {
  ReloadOutlined,
  SearchOutlined,
  PhoneOutlined,
  UserOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  HomeOutlined,
  FileTextOutlined,
  MessageOutlined,
  PlusOutlined,
  FieldTimeOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useAuthStore } from '@/stores/authStore'
import { api } from '@/services/api'
import type { CommunicationRecord, CreateCommunicationRequest } from './phoneStatsApi'
import * as phoneApi from './phoneStatsApi'

const { RangePicker } = DatePicker
const { Text } = Typography

// 咨询记录类型（从后端 to_dict 返回）
interface ChannelConsultationRecord {
  记录ID: number
  对象ID: number
  登记日期: string | null
  咨询者姓名: string | null
  电话: string | null
  状态: string | null
  量来源: string | null
  来源类别: string | null
  媒体来源: string | null
  咨询师: string | null
  分量人: string | null
  神殿: string | null
  位置: string | null
  报名意向: string | null
  备注: string | null
  是否上门: number
  上门时间: string | null
  是否报名: number
  报名时间: string | null
  是否订座: number
  是否退费: number
  是否无效量: number
  是否已交接: number
  渠道专员: string | null
  县办: string | null
  乡办: string | null
  信息员: string | null
  创建时间: string | null
  更新时间: string | null
  [key: string]: any
}

interface StatsData {
  总量: number
  已上门: number
  已报名: number
  已订座: number
  已退费: number
  无效量: number
  已分配: number
  未分配: number
}

export default function MyChannelConsultations() {
  const { notification } = App.useApp()
  const { user } = useAuthStore()

  const [loading, setLoading] = useState(false)
  const [records, setRecords] = useState<ChannelConsultationRecord[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)

  const [stats, setStats] = useState<StatsData | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)

  // 筛选条件
  const [statusFilter, setStatusFilter] = useState<string | undefined>()
  const [sourceFilter, setSourceFilter] = useState<string | undefined>()
  const [assignFilter, setAssignFilter] = useState<string | undefined>()
  const [keyword, setKeyword] = useState('')
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null)

  // 跟进弹窗
  const [followUpVisible, setFollowUpVisible] = useState(false)
  const [followUpRecord, setFollowUpRecord] = useState<ChannelConsultationRecord | null>(null)
  const [commRecords, setCommRecords] = useState<CommunicationRecord[]>([])
  const [commLoading, setCommLoading] = useState(false)
  const [editingComm, setEditingComm] = useState<CommunicationRecord | null>(null)
  const [inlineFormVisible, setInlineFormVisible] = useState(false)
  const [inlineFormLoading, setInlineFormLoading] = useState(false)
  const [inlineForm] = Form.useForm()

  // 加载列表
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, any> = { page, page_size: pageSize }
      if (statusFilter) params.status = statusFilter
      if (sourceFilter) params.source = sourceFilter
      if (assignFilter) params.assign_status = assignFilter
      if (keyword.trim()) params.keyword = keyword.trim()
      if (dateRange?.[0]) params.start_date = dateRange[0].format('YYYY-MM-DD')
      if (dateRange?.[1]) params.end_date = dateRange[1].format('YYYY-MM-DD')

      const resp = await api.get('/consult/my-channel-consultations', { params })
      const data = resp.data?.data
      if (data) {
        setRecords(data.数据列表 || [])
        setTotal(data.总记录数 || 0)
      }
    } catch (err: any) {
      console.error('加载渠道咨询量失败:', err)
      notification.error({ message: '加载失败', description: '无法获取渠道咨询量数据' })
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, statusFilter, sourceFilter, assignFilter, keyword, dateRange, notification])

  // 加载统计
  const loadStats = useCallback(async () => {
    setStatsLoading(true)
    try {
      const params: Record<string, any> = {}
      if (dateRange?.[0]) params.start_date = dateRange[0].format('YYYY-MM-DD')
      if (dateRange?.[1]) params.end_date = dateRange[1].format('YYYY-MM-DD')

      const resp = await api.get('/consult/my-channel-consultations/stats', { params })
      const data = resp.data?.data
      if (data?.统计) {
        setStats(data.统计)
      }
    } catch {
      // 统计失败不阻断
    } finally {
      setStatsLoading(false)
    }
  }, [dateRange])

  useEffect(() => { loadData() }, [loadData])
  useEffect(() => { loadStats() }, [loadStats])

  const handleSearch = () => {
    setPage(1)
    loadData()
    loadStats()
  }

  const handleReset = () => {
    setStatusFilter(undefined)
    setSourceFilter(undefined)
    setAssignFilter(undefined)
    setKeyword('')
    setDateRange(null)
    setPage(1)
  }

  // ========== 跟进沟通记录 ==========

  const loadCommRecords = async (记录ID: number) => {
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
  }

  const handleFollowUp = (record: ChannelConsultationRecord) => {
    setFollowUpRecord(record)
    setFollowUpVisible(true)
    loadCommRecords(record.记录ID)
  }

  const daysSinceLastContact = useMemo(() => {
    if (commRecords.length === 0) return null
    const sorted = [...commRecords].sort((a, b) =>
      dayjs(b.沟通时间).valueOf() - dayjs(a.沟通时间).valueOf()
    )
    return dayjs().diff(dayjs(sorted[0].沟通时间), 'day')
  }, [commRecords])

  const getDaysSinceLast = (list: CommunicationRecord[], index: number): string => {
    if (index === 0) return '-'
    const current = dayjs(list[index].沟通时间)
    const prev = dayjs(list[index - 1].沟通时间)
    return `${current.diff(prev, 'day')}天`
  }

  const handleDeleteComm = async (沟通ID: number) => {
    if (!followUpRecord) return
    try {
      await phoneApi.deleteCommunicationRecord(沟通ID)
      notification.success({ message: '删除成功', placement: 'topRight', duration: 3 })
      loadCommRecords(followUpRecord.记录ID)
    } catch {
      notification.error({ message: '删除失败', placement: 'topRight', duration: 4 })
    }
  }

  const handleInlineFormSubmit = async () => {
    if (!followUpRecord) return
    try {
      const values = await inlineForm.validateFields()
      setInlineFormLoading(true)
      const submitData: CreateCommunicationRequest = {
        记录ID: followUpRecord.记录ID,
        沟通时间: values.沟通时间.format('YYYY-MM-DD HH:mm:ss'),
        用时: values.用时 || 0,
        咨询师: followUpRecord.咨询师 || '',
        沟通方式: values.沟通方式,
        需求点: values.需求点,
        关注点: values.关注点,
        抗拒点: values.抗拒点,
        咨询内容: values.咨询内容,
        咨询结果: values.咨询结果,
        报名意愿: values.报名意愿,
        有需求: values.有需求 ? 1 : 0,
        有钱: values.有钱 ? 1 : 0,
        有时间: values.有时间 ? 1 : 0,
        有支持: values.有支持 ? 1 : 0,
        具备条件: values.具备条件,
        课程意向: values.课程意向,
        联系不上: values.联系不上 ? 1 : 0,
        预定回访时间: values.预定回访时间?.format('YYYY-MM-DD HH:mm:ss'),
      }
      if (editingComm) {
        await phoneApi.updateCommunicationRecord(editingComm.沟通ID, submitData)
        notification.success({ message: '已保存', description: '沟通记录更新成功', placement: 'topRight', duration: 3 })
      } else {
        await phoneApi.createCommunicationRecord(submitData)
        notification.success({ message: '已创建', description: '沟通记录创建成功', placement: 'topRight', duration: 3 })
      }
      setInlineFormVisible(false)
      setEditingComm(null)
      inlineForm.resetFields()
      loadCommRecords(followUpRecord.记录ID)
    } catch (error: any) {
      if (error?.response?.data?.detail) {
        notification.error({ message: '保存失败', description: error.response.data.detail, placement: 'topRight', duration: 4 })
      } else if (error?.errorFields) {
        // form validation error, ignore
      } else {
        notification.error({ message: '保存失败', description: '请检查网络连接或联系管理员', placement: 'topRight', duration: 4 })
      }
    } finally {
      setInlineFormLoading(false)
    }
  }

  const openInlineEdit = (record: CommunicationRecord) => {
    setEditingComm(record)
    setInlineFormVisible(true)
    inlineForm.setFieldsValue({
      ...record,
      沟通时间: dayjs(),
      预定回访时间: record.预定回访时间 ? dayjs(record.预定回访时间) : null,
      有需求: record.有需求 === 1,
      有钱: record.有钱 === 1,
      有时间: record.有时间 === 1,
      有支持: record.有支持 === 1,
      联系不上: record.联系不上 === 1,
    })
  }

  const openInlineAdd = () => {
    setEditingComm(null)
    setInlineFormVisible(true)
    inlineForm.resetFields()
    inlineForm.setFieldsValue({
      沟通时间: dayjs(),
      沟通方式: '电话',
      用时: 0,
    })
  }

  // 状态标签
  const statusTag = (status: string | null) => {
    if (!status) return <Tag>未知</Tag>
    const colorMap: Record<string, string> = {
      '新量': 'blue',
      '待跟进': 'orange',
      '跟进中': 'cyan',
      '已上门': 'green',
      '已报名': 'gold',
      '已订座': 'purple',
      '无意向': 'default',
      '无效': 'red',
    }
    return <Tag color={colorMap[status] || 'default'}>{status}</Tag>
  }

  const columns: ColumnsType<ChannelConsultationRecord> = useMemo(() => [
    {
      title: '序号',
      width: 55,
      align: 'center',
      render: (_: any, __: any, idx: number) => (page - 1) * pageSize + idx + 1,
    },
    {
      title: '登记日期',
      dataIndex: '登记日期',
      width: 100,
      render: (v: string) => v ? dayjs(v).format('YYYY-MM-DD') : '-',
    },
    {
      title: '姓名',
      dataIndex: '咨询者姓名',
      width: 80,
      ellipsis: true,
    },
    {
      title: '电话',
      dataIndex: '电话',
      width: 120,
      render: (v: string) => v ? (
        <Space size={4}>
          <PhoneOutlined style={{ color: '#1890ff', fontSize: 12 }} />
          <Text copyable={{ text: v }} style={{ fontSize: 12 }}>{v}</Text>
        </Space>
      ) : '-',
    },
    {
      title: '状态',
      dataIndex: '状态',
      width: 80,
      render: (v: string) => statusTag(v),
    },
    {
      title: '咨询师',
      dataIndex: '咨询师',
      width: 80,
      render: (v: string) => v || <Text type="secondary" style={{ fontSize: 11 }}>未分配</Text>,
    },
    {
      title: '分量人',
      dataIndex: '分量人',
      width: 80,
    },
    {
      title: '量来源',
      dataIndex: '量来源',
      width: 80,
    },
    {
      title: '神殿',
      dataIndex: '神殿',
      width: 70,
    },
    {
      title: '县办',
      dataIndex: '县办',
      width: 70,
    },
    {
      title: '乡办',
      dataIndex: '乡办',
      width: 70,
    },
    {
      title: '信息员',
      dataIndex: '信息员',
      width: 70,
    },
    {
      title: '上门',
      dataIndex: '是否上门',
      width: 55,
      align: 'center',
      render: (v: number) => v === 1
        ? <CheckCircleOutlined style={{ color: '#52c41a' }} />
        : <span style={{ color: '#d9d9d9' }}>-</span>,
    },
    {
      title: '报名',
      dataIndex: '是否报名',
      width: 55,
      align: 'center',
      render: (v: number) => v === 1
        ? <CheckCircleOutlined style={{ color: '#faad14' }} />
        : <span style={{ color: '#d9d9d9' }}>-</span>,
    },
    {
      title: '退费',
      dataIndex: '是否退费',
      width: 55,
      align: 'center',
      render: (v: number) => v === 1
        ? <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
        : <span style={{ color: '#d9d9d9' }}>-</span>,
    },
    {
      title: '位置',
      dataIndex: '位置',
      width: 100,
      ellipsis: true,
    },
    {
      title: '备注',
      dataIndex: '备注',
      width: 150,
      ellipsis: true,
      render: (v: string) => v ? (
        <Tooltip title={v}><span style={{ fontSize: 11 }}>{v}</span></Tooltip>
      ) : '-',
    },
    {
      title: '操作',
      width: 70,
      fixed: 'right',
      align: 'center',
      render: (_: any, record: ChannelConsultationRecord) => (
        <Button
          type="link"
          size="small"
          icon={<MessageOutlined />}
          onClick={() => handleFollowUp(record)}
        >
          跟进
        </Button>
      ),
    },
  ], [page, pageSize])

  return (
    <div style={{ padding: 16 }}>
      {/* 标题 */}
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <TeamOutlined style={{ fontSize: 22, color: '#1890ff' }} />
        <span style={{ fontSize: 18, fontWeight: 600 }}>
          我的渠道咨询量
        </span>
        <Text type="secondary" style={{ fontSize: 13, marginLeft: 8 }}>
          {user?.name ? `${user.name}（${user.campus || ''}）` : ''}
        </Text>
      </div>

      {/* 统计卡片 */}
      <Spin spinning={statsLoading}>
        <Row gutter={12} style={{ marginBottom: 16 }}>
          {[
            { title: '总量', value: stats?.总量, icon: <FileTextOutlined />, color: '#1890ff' },
            { title: '已上门', value: stats?.已上门, icon: <HomeOutlined />, color: '#52c41a' },
            { title: '已报名', value: stats?.已报名, icon: <CheckCircleOutlined />, color: '#faad14' },
            { title: '已退费', value: stats?.已退费, icon: <CloseCircleOutlined />, color: '#ff4d4f' },
            { title: '已分配', value: stats?.已分配, icon: <UserOutlined />, color: '#722ed1' },
            { title: '未分配', value: stats?.未分配, icon: <TeamOutlined />, color: '#eb2f96' },
          ].map(item => (
            <Col key={item.title} span={4}>
              <Card size="small" bodyStyle={{ padding: '12px 16px' }}>
                <Statistic
                  title={<span style={{ fontSize: 12 }}>{item.title}</span>}
                  value={item.value ?? 0}
                  prefix={<span style={{ color: item.color, fontSize: 16 }}>{item.icon}</span>}
                  valueStyle={{ fontSize: 22, color: item.color }}
                />
              </Card>
            </Col>
          ))}
        </Row>
      </Spin>

      {/* 筛选栏 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space wrap size={[12, 8]}>
          <Input
            placeholder="搜索姓名/电话/备注..."
            prefix={<SearchOutlined />}
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 200 }}
            allowClear
          />
          <Select
            placeholder="状态"
            value={statusFilter}
            onChange={setStatusFilter}
            allowClear
            style={{ width: 120 }}
            options={[
              { label: '新量', value: '新量' },
              { label: '待跟进', value: '待跟进' },
              { label: '跟进中', value: '跟进中' },
              { label: '已上门', value: '已上门' },
              { label: '已报名', value: '已报名' },
              { label: '已订座', value: '已订座' },
              { label: '无意向', value: '无意向' },
            ]}
          />
          <Select
            placeholder="量来源"
            value={sourceFilter}
            onChange={setSourceFilter}
            allowClear
            style={{ width: 120 }}
            options={[
              { label: '渠道', value: '渠道' },
              { label: 'SEM', value: 'SEM' },
              { label: '新媒体', value: '新媒体' },
              { label: '口碑', value: '口碑' },
              { label: '其他', value: '其他' },
            ]}
          />
          <Select
            placeholder="分配状态"
            value={assignFilter}
            onChange={setAssignFilter}
            allowClear
            style={{ width: 120 }}
            options={[
              { label: '已分配', value: '已分配' },
              { label: '未分配', value: '未分配' },
            ]}
          />
          <RangePicker
            value={dateRange as any}
            onChange={(dates) => setDateRange(dates as any)}
            style={{ width: 240 }}
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
            查询
          </Button>
          <Button onClick={handleReset}>重置</Button>
          <Button icon={<ReloadOutlined />} onClick={() => { loadData(); loadStats() }}>
            刷新
          </Button>
        </Space>
      </Card>

      {/* 表格 */}
      <Card size="small">
        <Table<ChannelConsultationRecord>
          columns={columns}
          dataSource={records}
          rowKey="记录ID"
          loading={loading}
          size="small"
          scroll={{ x: 1650 }}
          bordered
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            pageSizeOptions: ['20', '50', '100'],
            showTotal: (t) => `共 ${t} 条`,
            onChange: (p, ps) => { setPage(p); setPageSize(ps) },
          }}
        />
      </Card>

      {/* 跟进弹窗 */}
      <Modal
        title={
          followUpRecord ? (
            <Space>
              <MessageOutlined />
              <span>跟进 - {followUpRecord.咨询者姓名 || followUpRecord.电话}</span>
            </Space>
          ) : '跟进'
        }
        open={followUpVisible}
        onCancel={() => {
          setFollowUpVisible(false)
          setFollowUpRecord(null)
          setCommRecords([])
          setInlineFormVisible(false)
          setEditingComm(null)
          inlineForm.resetFields()
        }}
        footer={null}
        width="100vw"
        style={{ top: 0, paddingBottom: 0, maxWidth: '100vw' }}
        styles={{ body: { height: 'calc(100vh - 55px)', overflowY: 'auto', padding: '16px 24px' } }}
      >
        {followUpRecord && (
          <>
            {/* 咨询者详情 */}
            <Descriptions
              bordered
              size="small"
              column={6}
              labelStyle={{ fontWeight: 500, background: '#f0f5ff', whiteSpace: 'nowrap', width: 68, padding: '3px 4px', fontSize: 16 }}
              contentStyle={{ padding: '3px 4px', fontSize: 16 }}
              style={{ marginBottom: 12 }}
            >
              <Descriptions.Item label="咨询者姓名"><strong>{followUpRecord.咨询者姓名 || '-'}</strong></Descriptions.Item>
              <Descriptions.Item label="电话">{followUpRecord.电话 || '-'}</Descriptions.Item>
              <Descriptions.Item label="当前状态"><Tag color="blue" style={{ margin: 0 }}>{followUpRecord.状态 || '-'}</Tag></Descriptions.Item>
              <Descriptions.Item label="报名意愿"><Tag color={followUpRecord.报名意向 === '强意向' ? 'green' : followUpRecord.报名意向 === '中意向' ? 'blue' : followUpRecord.报名意向 === '弱意向' ? 'orange' : 'default'} style={{ margin: 0 }}>{followUpRecord.报名意向 || '-'}</Tag></Descriptions.Item>
              <Descriptions.Item label="咨询师">{followUpRecord.咨询师 || '-'}</Descriptions.Item>
              <Descriptions.Item label="分量人">{followUpRecord.分量人 || '-'}</Descriptions.Item>

              <Descriptions.Item label="登记日期">{followUpRecord.登记日期 ? dayjs(followUpRecord.登记日期).format('YYYY-MM-DD') : '-'}</Descriptions.Item>
              <Descriptions.Item label="量来源"><Tag color="processing" style={{ margin: 0 }}>{followUpRecord.量来源 || '-'}</Tag></Descriptions.Item>
              <Descriptions.Item label="来源类别">{followUpRecord.来源类别 || '-'}</Descriptions.Item>
              <Descriptions.Item label="媒体来源">{followUpRecord.媒体来源 || '-'}</Descriptions.Item>
              <Descriptions.Item label="神殿">{followUpRecord.神殿 || '-'}</Descriptions.Item>
              <Descriptions.Item label="位置">{followUpRecord.位置 || '-'}</Descriptions.Item>

              <Descriptions.Item label="渠道专员">{followUpRecord.渠道专员 || '-'}</Descriptions.Item>
              <Descriptions.Item label="县办">{followUpRecord.县办 || '-'}</Descriptions.Item>
              <Descriptions.Item label="乡办">{followUpRecord.乡办 || '-'}</Descriptions.Item>
              <Descriptions.Item label="信息员">{followUpRecord.信息员 || '-'}</Descriptions.Item>
              <Descriptions.Item label="备注" span={2}>{followUpRecord.备注 || '-'}</Descriptions.Item>
            </Descriptions>

            {/* 沟通记录标题 */}
            <div style={{ textAlign: 'center', margin: '4px 0' }}>
              <span style={{ fontSize: 15, fontWeight: 600 }}>
                <FieldTimeOutlined style={{ marginRight: 6 }} />
                沟通记录：共 {commRecords.length} 条
                {daysSinceLastContact !== null && (
                  <span style={{ marginLeft: 16 }}>
                    距上次联络
                    <span style={{
                      fontSize: 16, fontWeight: 700, margin: '0 3px',
                      color: daysSinceLastContact > 7 ? '#ff4d4f' : daysSinceLastContact > 3 ? '#faad14' : '#52c41a'
                    }}>
                      {daysSinceLastContact}
                    </span>
                    天
                  </span>
                )}
                {daysSinceLastContact === null && commRecords.length === 0 && (
                  <span style={{ marginLeft: 16, color: '#999', fontSize: 12 }}>暂无沟通记录</span>
                )}
              </span>
              <Button
                type="primary"
                size="small"
                icon={<PlusOutlined />}
                style={{ marginLeft: 16 }}
                onClick={openInlineAdd}
              >
                新增沟通记录
              </Button>
            </div>

            {/* 沟通记录表格 */}
            {commLoading ? (
              <div style={{ padding: 40, textAlign: 'center' }}><Spin /></div>
            ) : commRecords.length > 0 ? (
              <Table
                bordered
                size="small"
                rowKey="沟通ID"
                dataSource={commRecords}
                scroll={{ x: 1400 }}
                pagination={false}
                style={{ fontSize: 14 }}
                columns={[
                  { title: '序号', width: 45, align: 'center' as const, render: (_: any, __: any, i: number) => i + 1 },
                  { title: '沟通时间', dataIndex: '沟通时间', width: 140, render: (v: string) => v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-' },
                  { title: '用时', dataIndex: '用时', width: 50, align: 'center' as const, render: (v: number) => v > 0 ? v : 0 },
                  { title: '距上次', width: 65, align: 'center' as const, render: (_: any, __: any, i: number) => getDaysSinceLast(commRecords, i) },
                  { title: '方式', dataIndex: '沟通方式', width: 60, align: 'center' as const, render: (v: string) => v ? <Tag color={v === '电话' ? 'blue' : v === '网聊' ? 'green' : 'orange'}>{v}</Tag> : '-' },
                  { title: '需求点', dataIndex: '需求点', width: 80, ellipsis: true, render: (v: string) => v || '-' },
                  { title: '关注点', dataIndex: '关注点', width: 80, ellipsis: true, render: (v: string) => v || '-' },
                  { title: '抗拒点', dataIndex: '抗拒点', width: 80, ellipsis: true, render: (v: string) => v || '-' },
                  { title: '报名意愿', dataIndex: '报名意愿', width: 70, align: 'center' as const, render: (v: string) => v ? <Tag color={v === 'A' ? 'green' : v === 'B' ? 'cyan' : v === 'C' ? 'orange' : 'red'}>{v}类</Tag> : '-' },
                  { title: '具备条件', dataIndex: '具备条件', width: 80, ellipsis: true, render: (v: string) => v || '-' },
                  { title: '课程意向', dataIndex: '课程意向', width: 80, ellipsis: true, render: (v: string) => v || '-' },
                  { title: '咨询内容', dataIndex: '咨询内容', width: 260, render: (v: string) => v ? <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{v}</div> : '-' },
                  { title: '咨询结果', dataIndex: '咨询结果', width: 260, render: (v: string) => v ? <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{v}</div> : '-' },
                  { title: '咨询师', dataIndex: '咨询师', width: 70, render: (v: string) => v || '-' },
                  {
                    title: '操作', width: 100, fixed: 'right' as const,
                    render: (_: any, rec: CommunicationRecord) => (
                      <Space size={0}>
                        <Button type="link" size="small" onClick={() => openInlineEdit(rec)}>编辑</Button>
                        <Popconfirm title="确定删除？" onConfirm={() => handleDeleteComm(rec.沟通ID)}>
                          <Button type="link" size="small" danger>删除</Button>
                        </Popconfirm>
                      </Space>
                    ),
                  },
                ]}
              />
            ) : (
              <Empty description="暂无沟通记录" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding: 16 }} />
            )}

            {/* 内联新增/编辑沟通记录表单 */}
            {inlineFormVisible && (
              <div style={{ marginTop: 8, padding: '10px 16px', background: '#fafafa', borderRadius: 8, border: '1px solid #d9d9d9' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 15, fontWeight: 600 }}>
                    {editingComm ? '✏️ 编辑沟通记录' : '➕ 新增沟通记录'}
                  </span>
                  <Space>
                    <Button size="small" onClick={() => { setInlineFormVisible(false); setEditingComm(null); inlineForm.resetFields() }}>取消</Button>
                    <Button type="primary" size="small" loading={inlineFormLoading} onClick={handleInlineFormSubmit}>保存</Button>
                  </Space>
                </div>
                <Form
                  form={inlineForm}
                  layout="vertical"
                  size="small"
                  initialValues={{ 沟通时间: dayjs(), 沟通方式: '电话', 用时: 0 }}
                >
                  <Row gutter={8}>
                    <Col span={3}>
                      <Form.Item name="沟通时间" label="沟通时间" rules={[{ required: true, message: '请选择' }]} style={{ marginBottom: 4 }}>
                        <DatePicker showTime format="MM-DD HH:mm" style={{ width: '100%' }} disabledDate={(current) => {
                          if (!current) return false
                          if (current > dayjs().endOf('day')) return true
                          if (followUpRecord?.登记日期 && current < dayjs(followUpRecord.登记日期).startOf('day')) return true
                          return false
                        }} />
                      </Form.Item>
                    </Col>
                    <Col span={2}>
                      <Form.Item name="沟通方式" label="方式" rules={[{ required: true, message: '选择' }]} style={{ marginBottom: 4 }}>
                        <Select>
                          <Select.Option value="电话">📞电话</Select.Option>
                          <Select.Option value="网聊">💬网聊</Select.Option>
                          <Select.Option value="当面">👥当面</Select.Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={2}>
                      <Form.Item name="用时" label="用时(分)" style={{ marginBottom: 4 }}>
                        <InputNumber min={0} max={999} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={2}>
                      <Form.Item label="咨询师" style={{ marginBottom: 4 }}>
                        <span style={{ fontSize: 14, fontWeight: 500, color: '#1677ff' }}>{followUpRecord?.咨询师 || '-'}</span>
                      </Form.Item>
                    </Col>
                    <Col span={2}>
                      <Form.Item name="报名意愿" label="意愿" style={{ marginBottom: 4 }}>
                        <Select allowClear placeholder="等级">
                          <Select.Option value="A">A高</Select.Option>
                          <Select.Option value="B">B中</Select.Option>
                          <Select.Option value="C">C低</Select.Option>
                          <Select.Option value="D">D无</Select.Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={3}>
                      <Form.Item name="预定回访时间" label="预定回访" style={{ marginBottom: 4 }}>
                        <DatePicker showTime format="MM-DD HH:mm" style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={2}>
                      <Form.Item name="需求点" label="需求点" style={{ marginBottom: 4 }}>
                        <Input placeholder="需求" />
                      </Form.Item>
                    </Col>
                    <Col span={2}>
                      <Form.Item name="关注点" label="关注点" style={{ marginBottom: 4 }}>
                        <Input placeholder="关注" />
                      </Form.Item>
                    </Col>
                    <Col span={2}>
                      <Form.Item name="抗拒点" label="抗拒点" style={{ marginBottom: 4 }}>
                        <Input placeholder="顾虑" />
                      </Form.Item>
                    </Col>
                    <Col span={2}>
                      <Form.Item name="课程意向" label="课程" style={{ marginBottom: 4 }}>
                        <Input placeholder="课程" />
                      </Form.Item>
                    </Col>
                    <Col span={2}>
                      <Form.Item name="具备条件" label="条件" style={{ marginBottom: 4 }}>
                        <Input placeholder="条件" />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={8} align="middle">
                    <Col flex="auto">
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        <Form.Item name="联系不上" valuePropName="checked" noStyle>
                          <Switch size="small" checkedChildren="失联" unCheckedChildren="失联" />
                        </Form.Item>
                        <Form.Item name="有需求" valuePropName="checked" noStyle>
                          <Switch size="small" checkedChildren="需求" unCheckedChildren="需求" />
                        </Form.Item>
                        <Form.Item name="有钱" valuePropName="checked" noStyle>
                          <Switch size="small" checkedChildren="有钱" unCheckedChildren="有钱" />
                        </Form.Item>
                        <Form.Item name="有时间" valuePropName="checked" noStyle>
                          <Switch size="small" checkedChildren="时间" unCheckedChildren="时间" />
                        </Form.Item>
                        <Form.Item name="有支持" valuePropName="checked" noStyle>
                          <Switch size="small" checkedChildren="支持" unCheckedChildren="支持" />
                        </Form.Item>
                      </div>
                    </Col>
                  </Row>
                  <Row gutter={8} style={{ marginTop: 4 }}>
                    <Col span={12}>
                      <Form.Item name="咨询内容" label="咨询内容" style={{ marginBottom: 4 }}>
                        <Input.TextArea rows={12} autoSize={{ minRows: 12, maxRows: 25 }} placeholder="详细记录沟通内容..." />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="咨询结果" label="咨询结果" style={{ marginBottom: 0 }}>
                        <Input.TextArea rows={12} autoSize={{ minRows: 12, maxRows: 25 }} placeholder="沟通结果..." />
                      </Form.Item>
                    </Col>
                  </Row>
                </Form>
              </div>
            )}
          </>
        )}
      </Modal>
    </div>
  )
}
