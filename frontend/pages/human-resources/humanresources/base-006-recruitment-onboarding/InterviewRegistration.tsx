/**
 * 面试登记表（清美面试邀约及反馈表） - TAB2
 * 后端存储：humanresources.interview_registrations
 */
import React, { useEffect, useMemo, useState } from 'react'
import {
  App,
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd'
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  PrinterOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { useCampusStore } from '@/stores/campusStore'
import {
  createInterviewRegistration,
  deleteInterviewRegistration,
  listInterviewRegistrations,
  type InterviewDecision,
  type InterviewRegistrationPayload,
  type InterviewRegistrationRecord,
  updateInterviewRegistration,
} from '@/services/humanresources/interviewRegistration'

const { Title, Text } = Typography

const SOURCE_OPTIONS = [
  { label: 'Boss直聘', value: 'boss' },
  { label: '智联招聘', value: '智联' },
  { label: '前程无忧', value: '前程无忧' },
  { label: '猎聘', value: '猎聘' },
  { label: '内部推荐', value: '内部推荐' },
  { label: '其他', value: '其他' },
]

const YES_NO_OPTIONS = [
  { label: '是', value: '是' },
  { label: '否', value: '否' },
]

type ErrorWithResponse = {
  response?: {
    data?: {
      detail?: string
    }
  }
  message?: string
}

const getErrorMessage = (error: unknown, fallback: string) => {
  const maybeError = error as ErrorWithResponse
  return maybeError.response?.data?.detail || maybeError.message || fallback
}

const SCHEDULED_TIME_FORMAT = 'YYYY-MM-DD HH:mm'

const parseScheduledTime = (value?: string, inviteDate?: string): Dayjs | undefined => {
  if (!value) return undefined

  const directParsed = dayjs(value)
  if (directParsed.isValid()) {
    return directParsed
  }

  const normalized = value.trim()
  if (!normalized) return undefined

  const baseDate = inviteDate && dayjs(inviteDate).isValid() ? dayjs(inviteDate) : dayjs()
  const monthDayTimeMatch = normalized.match(
    /^(\d{1,2})[./-](\d{1,2})(?:日)?\s*(上午|中午|下午|晚上)?\s*(\d{1,2})(?:[:：](\d{1,2}))?$/,
  )
  if (monthDayTimeMatch) {
    const [, monthText, dayText, periodText, hourText, minuteText] = monthDayTimeMatch
    const month = Number(monthText)
    const day = Number(dayText)
    let hour = Number(hourText)
    const minute = Number(minuteText || '0')

    if (periodText === '下午' || periodText === '晚上') {
      if (hour < 12) hour += 12
    } else if (periodText === '中午' && hour < 11) {
      hour += 12
    } else if (periodText === '上午' && hour === 12) {
      hour = 0
    }

    const parsed = dayjs()
      .year(baseDate.year())
      .month(month - 1)
      .date(day)
      .hour(hour)
      .minute(minute)
      .second(0)
      .millisecond(0)

    return parsed.isValid() ? parsed : undefined
  }

  const timeOnlyMatch = normalized.match(/^(\d{1,2})(?:[:：](\d{1,2}))$/)
  if (timeOnlyMatch && inviteDate && dayjs(inviteDate).isValid()) {
    const [, hourText, minuteText] = timeOnlyMatch
    const parsed = dayjs(inviteDate)
      .hour(Number(hourText))
      .minute(Number(minuteText))
      .second(0)
      .millisecond(0)
    return parsed.isValid() ? parsed : undefined
  }

  return undefined
}

const formatScheduledTime = (value?: string) => {
  if (!value) return '-'
  const parsed = parseScheduledTime(value)
  return parsed ? parsed.format(SCHEDULED_TIME_FORMAT) : value
}

interface EditModalProps {
  open: boolean
  loading: boolean
  defaultCampusName?: string
  editingRecord: InterviewRegistrationRecord | null
  onCancel: () => void
  onOk: (payload: InterviewRegistrationPayload) => Promise<void>
}

const EditModal: React.FC<EditModalProps> = ({
  open,
  loading,
  defaultCampusName,
  editingRecord,
  onCancel,
  onOk,
}) => {
  const [form] = Form.useForm()
  const isEdit = !!editingRecord

  useEffect(() => {
    if (!open) return

    if (editingRecord) {
      form.setFieldsValue({
        ...editingRecord,
        inviteDate: editingRecord.inviteDate ? dayjs(editingRecord.inviteDate) : undefined,
        scheduledTime: parseScheduledTime(editingRecord.scheduledTime, editingRecord.inviteDate),
        secondTime: parseScheduledTime(editingRecord.secondTime, editingRecord.inviteDate),
        onboardDate: editingRecord.onboardDate ? dayjs(editingRecord.onboardDate) : undefined,
      })
      return
    }

    form.resetFields()
    form.setFieldsValue({
      campusName: defaultCampusName || '',
      attendedFirst: '',
      firstHireDecision: '',
      attendedSecond: '',
      finalHireDecision: '',
      reported: '',
    })
  }, [defaultCampusName, editingRecord, form, open])

  const handleOk = async () => {
    const values = await form.validateFields()
    await onOk({
      region: values.region || '',
      campusName: values.campusName || '',
      name: values.name,
      source: values.source || '',
      phone: values.phone || '',
      position: values.position || '',
      inviteDate: values.inviteDate ? (values.inviteDate as Dayjs).format('YYYY-MM-DD') : '',
      inviter: values.inviter || '',
      scheduledTime: values.scheduledTime
        ? (values.scheduledTime as Dayjs).format(SCHEDULED_TIME_FORMAT)
        : '',
      attendedFirst: (values.attendedFirst || '') as InterviewDecision,
      firstInterviewer: values.firstInterviewer || '',
      firstEvaluation: values.firstEvaluation || '',
      firstHireDecision: (values.firstHireDecision || '') as InterviewDecision,
      attendedSecond: (values.attendedSecond || '') as InterviewDecision,
      secondTime: values.secondTime
        ? (values.secondTime as Dayjs).format(SCHEDULED_TIME_FORMAT)
        : '',
      secondEvaluation: values.secondEvaluation || '',
      finalHireDecision: (values.finalHireDecision || '') as InterviewDecision,
      reported: (values.reported || '') as InterviewDecision,
      onboardDate: values.onboardDate ? (values.onboardDate as Dayjs).format('YYYY-MM-DD') : '',
      notOnboardReason: values.notOnboardReason || '',
    })
  }

  return (
    <Modal
      title={isEdit ? '编辑面试登记' : '新增面试登记'}
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      okText="保存"
      cancelText="取消"
      confirmLoading={loading}
      width={950}
      destroyOnClose
      styles={{ body: { maxHeight: '72vh', overflowY: 'auto' } }}
    >
      <Form form={form} layout="vertical">
        <Card size="small" title="候选人信息" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="region" label="地区">
                <Input placeholder="如 大原 / 石家庄" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="campusName" label="神殿名">
                <Input placeholder="神殿名称" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="name"
                label="姓名"
                rules={[{ required: true, message: '请填写姓名' }]}
              >
                <Input placeholder="候选人姓名" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="source" label="来源">
                <Select placeholder="选择来源" options={SOURCE_OPTIONS} allowClear />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="phone" label="联系电话">
                <Input placeholder="手机号码" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="position" label="面试岗位">
                <Input placeholder="如 讲师 / 班主任 / 渠道" />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Card size="small" title="邀约信息" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="inviteDate" label="邀约时间">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="inviter" label="邀约人">
                <Input placeholder="邀约人姓名" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="scheduledTime" label="邀约面试时间">
                <DatePicker
                  showTime={{ format: 'HH:mm' }}
                  format={SCHEDULED_TIME_FORMAT}
                  placeholder="请选择邀约面试时间"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Card size="small" title="初试信息" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="attendedFirst" label="是否参加初试">
                <Select placeholder="选择" options={YES_NO_OPTIONS} allowClear />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="firstInterviewer" label="面试官">
                <Input placeholder="面试官姓名" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="firstEvaluation" label="评价">
                <Input placeholder="初试评价" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="firstHireDecision" label="是否录用">
                <Select placeholder="选择" options={YES_NO_OPTIONS} allowClear />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Card size="small" title="复试信息" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="attendedSecond" label="是否参加复试">
                <Select placeholder="选择" options={YES_NO_OPTIONS} allowClear />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="secondTime" label="复试时间">
                <DatePicker
                  showTime={{ format: 'HH:mm' }}
                  format={SCHEDULED_TIME_FORMAT}
                  placeholder="请选择复试时间"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="secondEvaluation" label="复试详评">
                <Input placeholder="复试详细评价" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="finalHireDecision" label="是否录用(最终)">
                <Select placeholder="选择" options={YES_NO_OPTIONS} allowClear />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Card size="small" title="入职信息">
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="reported" label="是否报到">
                <Select placeholder="选择" options={YES_NO_OPTIONS} allowClear />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="onboardDate" label="入职时间">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="notOnboardReason" label="未入职原因">
                <Input placeholder="如未入职，填写原因" />
              </Form.Item>
            </Col>
          </Row>
        </Card>
      </Form>
    </Modal>
  )
}

interface PreviewModalProps {
  open: boolean
  data: InterviewRegistrationRecord[]
  onCancel: () => void
}

const PreviewModal: React.FC<PreviewModalProps> = ({ open, data, onCancel }) => {
  const handlePrint = () => window.print()

  const cellStyle: React.CSSProperties = {
    border: '1px solid #000',
    padding: '4px 6px',
    fontSize: 11,
    lineHeight: 1.4,
    whiteSpace: 'nowrap',
  }
  const headerStyle: React.CSSProperties = {
    ...cellStyle,
    fontWeight: 'bold',
    background: '#fafafa',
    textAlign: 'center',
  }

  return (
    <Modal
      title="打印预览 - 清美面试邀约及反馈表"
      open={open}
      onCancel={onCancel}
      width={1500}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          关闭
        </Button>,
        <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>
          打印
        </Button>,
      ]}
    >
      <div className="print-area" style={{ overflowX: 'auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <Title
            level={3}
            style={{
              margin: 0,
              background: 'linear-gradient(90deg, #d4a017, #f0c040)',
              WebkitBackgroundClip: 'text',
              color: '#8B6914',
              letterSpacing: 4,
            }}
          >
            清美面试邀约及反馈表
          </Title>
        </div>

        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            border: '2px solid #000',
          }}
        >
          <thead>
            <tr>
              <th style={headerStyle}>序号</th>
              <th style={headerStyle}>地区</th>
              <th style={headerStyle}>神殿名</th>
              <th style={headerStyle}>姓名</th>
              <th style={headerStyle}>来源</th>
              <th style={headerStyle}>联系电话</th>
              <th style={headerStyle}>面试岗位</th>
              <th style={headerStyle}>邀约时间</th>
              <th style={headerStyle}>邀约人</th>
              <th style={headerStyle}>邀约面试时间</th>
              <th style={headerStyle}>是否参加初试</th>
              <th style={headerStyle}>面试官</th>
              <th style={headerStyle}>评价</th>
              <th style={headerStyle}>是否录用</th>
              <th style={headerStyle}>是否参加复试</th>
              <th style={headerStyle}>复试时间</th>
              <th style={headerStyle}>复试详评</th>
              <th style={headerStyle}>是否录用</th>
              <th style={headerStyle}>是否报到</th>
              <th style={headerStyle}>入职时间</th>
              <th style={headerStyle}>未入职原因</th>
            </tr>
          </thead>
          <tbody>
            {data.map((record, index) => (
              <tr key={record.id}>
                <td style={{ ...cellStyle, textAlign: 'center' }}>{index + 1}</td>
                <td style={cellStyle}>{record.region}</td>
                <td style={cellStyle}>{record.campusName}</td>
                <td style={cellStyle}>{record.name}</td>
                <td style={cellStyle}>{record.source}</td>
                <td style={cellStyle}>{record.phone}</td>
                <td style={cellStyle}>{record.position}</td>
                <td style={cellStyle}>{record.inviteDate}</td>
                <td style={cellStyle}>{record.inviter}</td>
                <td style={cellStyle}>{formatScheduledTime(record.scheduledTime)}</td>
                <td style={{ ...cellStyle, textAlign: 'center' }}>{record.attendedFirst}</td>
                <td style={cellStyle}>{record.firstInterviewer}</td>
                <td style={cellStyle}>{record.firstEvaluation}</td>
                <td style={{ ...cellStyle, textAlign: 'center' }}>{record.firstHireDecision}</td>
                <td style={{ ...cellStyle, textAlign: 'center' }}>{record.attendedSecond}</td>
                <td style={cellStyle}>{formatScheduledTime(record.secondTime)}</td>
                <td style={cellStyle}>{record.secondEvaluation}</td>
                <td style={{ ...cellStyle, textAlign: 'center' }}>{record.finalHireDecision}</td>
                <td style={{ ...cellStyle, textAlign: 'center' }}>{record.reported}</td>
                <td style={cellStyle}>{record.onboardDate}</td>
                <td style={cellStyle}>{record.notOnboardReason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  )
}

const renderYesNo = (value: string) => {
  if (value === '是') return <Tag color="green">是</Tag>
  if (value === '否') return <Tag color="red">否</Tag>
  return '-'
}

const InterviewRegistration: React.FC = () => {
  const { currentCampus } = useCampusStore()
  const [data, setData] = useState<InterviewRegistrationRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<InterviewRegistrationRecord | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [searchText, setSearchText] = useState('')

  const loadData = async () => {
    setLoading(true)
    try {
      const records = await listInterviewRegistrations({
        campusName: currentCampus || undefined,
      })
      setData(records)
    } catch (error) {
      message.error(getErrorMessage(error, '加载面试登记数据失败'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [currentCampus])

  const filteredData = useMemo(() => {
    if (!searchText) return data
    const keyword = searchText.trim().toLowerCase()
    return data.filter((item) =>
      [
        item.name,
        item.region,
        item.campusName,
        item.position,
        item.phone,
        item.source,
        item.inviter,
      ].some((value) => value.toLowerCase().includes(keyword)),
    )
  }, [data, searchText])

  const handleAdd = () => {
    setEditingRecord(null)
    setEditModalOpen(true)
  }

  const handleEdit = (record: InterviewRegistrationRecord) => {
    setEditingRecord(record)
    setEditModalOpen(true)
  }

  const handleSave = async (payload: InterviewRegistrationPayload) => {
    setSubmitting(true)
    try {
      const savedRecord = editingRecord
        ? await updateInterviewRegistration(editingRecord.id, payload)
        : await createInterviewRegistration(payload)

      setData((prev) => {
        if (editingRecord) {
          return prev.map((item) => (item.id === savedRecord.id ? savedRecord : item))
        }
        return [savedRecord, ...prev]
      })
      setEditModalOpen(false)
      setEditingRecord(null)
      message.success(editingRecord ? '编辑成功' : '新增成功')
    } catch (error) {
      message.error(getErrorMessage(error, editingRecord ? '编辑失败' : '新增失败'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (recordId: number) => {
    try {
      await deleteInterviewRegistration(recordId)
      setData((prev) => prev.filter((item) => item.id !== recordId))
      message.success('删除成功')
    } catch (error) {
      message.error(getErrorMessage(error, '删除失败'))
    }
  }

  const columns = [
    {
      title: '序号',
      key: '_index',
      width: 55,
      align: 'center' as const,
      fixed: 'left' as const,
      render: (_: unknown, __: InterviewRegistrationRecord, index: number) => index + 1,
    },
    {
      title: '地区',
      dataIndex: 'region',
      key: 'region',
      width: 80,
      fixed: 'left' as const,
      filters: Array.from(new Set(data.map((item) => item.region)))
        .filter(Boolean)
        .map((value) => ({
          text: value,
          value,
        })),
      onFilter: (value: boolean | React.Key, record: InterviewRegistrationRecord) =>
        record.region === value,
    },
    {
      title: '神殿名',
      dataIndex: 'campusName',
      key: 'campusName',
      width: 110,
      fixed: 'left' as const,
      filters: Array.from(new Set(data.map((item) => item.campusName)))
        .filter(Boolean)
        .map((value) => ({
          text: value,
          value,
        })),
      onFilter: (value: boolean | React.Key, record: InterviewRegistrationRecord) =>
        record.campusName === value,
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 90,
      fixed: 'left' as const,
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source',
      width: 100,
      filters: SOURCE_OPTIONS.map((item) => ({ text: item.label, value: item.value })),
      onFilter: (value: boolean | React.Key, record: InterviewRegistrationRecord) =>
        record.source === value,
    },
    {
      title: '联系电话',
      dataIndex: 'phone',
      key: 'phone',
      width: 130,
    },
    {
      title: '面试岗位',
      dataIndex: 'position',
      key: 'position',
      width: 120,
      filters: Array.from(new Set(data.map((item) => item.position)))
        .filter(Boolean)
        .map((value) => ({
          text: value,
          value,
        })),
      onFilter: (value: boolean | React.Key, record: InterviewRegistrationRecord) =>
        record.position === value,
    },
    {
      title: '邀约时间',
      dataIndex: 'inviteDate',
      key: 'inviteDate',
      width: 110,
      sorter: (a: InterviewRegistrationRecord, b: InterviewRegistrationRecord) =>
        a.inviteDate.localeCompare(b.inviteDate),
    },
    {
      title: '邀约人',
      dataIndex: 'inviter',
      key: 'inviter',
      width: 90,
    },
    {
      title: '邀约面试时间',
      dataIndex: 'scheduledTime',
      key: 'scheduledTime',
      width: 140,
      render: (value: string) => formatScheduledTime(value),
    },
    {
      title: '是否参加初试',
      dataIndex: 'attendedFirst',
      key: 'attendedFirst',
      width: 110,
      align: 'center' as const,
      render: renderYesNo,
      filters: YES_NO_OPTIONS.map((item) => ({ text: item.label, value: item.value })),
      onFilter: (value: boolean | React.Key, record: InterviewRegistrationRecord) =>
        record.attendedFirst === value,
    },
    {
      title: '面试官',
      dataIndex: 'firstInterviewer',
      key: 'firstInterviewer',
      width: 100,
    },
    {
      title: '评价',
      dataIndex: 'firstEvaluation',
      key: 'firstEvaluation',
      width: 140,
      ellipsis: true,
    },
    {
      title: '是否录用',
      dataIndex: 'firstHireDecision',
      key: 'firstHireDecision',
      width: 90,
      align: 'center' as const,
      render: renderYesNo,
    },
    {
      title: '是否参加复试',
      dataIndex: 'attendedSecond',
      key: 'attendedSecond',
      width: 110,
      align: 'center' as const,
      render: renderYesNo,
    },
    {
      title: '复试时间',
      dataIndex: 'secondTime',
      key: 'secondTime',
      width: 120,
      render: (value: string) => formatScheduledTime(value),
    },
    {
      title: '复试详评',
      dataIndex: 'secondEvaluation',
      key: 'secondEvaluation',
      width: 140,
      ellipsis: true,
    },
    {
      title: '最终录用',
      dataIndex: 'finalHireDecision',
      key: 'finalHireDecision',
      width: 90,
      align: 'center' as const,
      render: renderYesNo,
    },
    {
      title: '是否报到',
      dataIndex: 'reported',
      key: 'reported',
      width: 90,
      align: 'center' as const,
      render: renderYesNo,
    },
    {
      title: '入职时间',
      dataIndex: 'onboardDate',
      key: 'onboardDate',
      width: 110,
    },
    {
      title: '未入职原因',
      dataIndex: 'notOnboardReason',
      key: 'notOnboardReason',
      width: 160,
      ellipsis: true,
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right' as const,
      render: (_: unknown, record: InterviewRegistrationRecord) => (
        <Space>
          <Tooltip title="编辑">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="确认删除该记录？"
            onConfirm={() => void handleDelete(record.id)}
            okText="删除"
            cancelText="取消"
          >
            <Tooltip title="删除">
              <Button type="link" size="small" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle" gutter={16}>
          <Col>
            <Space>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                新增面试登记
              </Button>
              <Button
                icon={<PrinterOutlined />}
                onClick={() => setPreviewOpen(true)}
                disabled={filteredData.length === 0}
              >
                打印预览
              </Button>
              <Text type="secondary">当前神殿：{currentCampus || '未选择'}</Text>
            </Space>
          </Col>
          <Col>
            <Input
              placeholder="搜索姓名/地区/神殿/岗位/电话..."
              prefix={<SearchOutlined />}
              allowClear
              style={{ width: 320 }}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Col>
        </Row>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          bordered
          size="small"
          loading={loading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          scroll={{ x: 2200 }}
        />
      </Card>

      <EditModal
        open={editModalOpen}
        loading={submitting}
        defaultCampusName={currentCampus}
        editingRecord={editingRecord}
        onCancel={() => {
          setEditModalOpen(false)
          setEditingRecord(null)
        }}
        onOk={handleSave}
      />

      <PreviewModal open={previewOpen} data={filteredData} onCancel={() => setPreviewOpen(false)} />
    </div>
  )
}

export default InterviewRegistration
