import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Alert,
  App,
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  Modal,
  Row,
  Space,
  Table,
  Tooltip,
  Typography,
} from 'antd'
import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  FileTextOutlined,
  PlusOutlined,
  PrinterOutlined,
  SaveOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'

import {
  workReportApi,
  type WorkReportPayload,
  type WorkReportRecord,
} from '@/services/humanresources/workReport'
import { useAuthStore } from '@/stores/authStore'

type WorkReportProps = {
  onWorkReportChanged?: () => Promise<void> | void
}

const { Text, Title } = Typography
const { TextArea } = Input

const MIN_CONTENT_LENGTH = 150
const WORK_REPORT_RULE_DESCRIPTION =
  '述职报告由员工本人填写，无需审批；保存产生记录后，才可解锁转正申请。除姓名、所在部门、试用岗位、日期外，其余各项不少于150字。'

type ErrorWithResponse = {
  response?: {
    data?: {
      detail?: string | Array<{ msg?: string }>
    }
  }
  message?: string
}

const getErrorMessage = (error: unknown, fallback: string) => {
  const maybeError = error as ErrorWithResponse
  const detail = maybeError.response?.data?.detail

  if (typeof detail === 'string' && detail.trim()) {
    return detail
  }

  if (Array.isArray(detail)) {
    const messages = detail.map((item) => item?.msg?.trim()).filter(Boolean)
    if (messages.length) {
      return messages.join('；')
    }
  }

  return maybeError.message || fallback
}

const getEffectiveTextLength = (value: unknown) => String(value ?? '').replace(/\s+/g, '').length

const createLongTextRules = (label: string) => [
  {
    validator: async (_rule: unknown, value: unknown) => {
      const rawValue = String(value ?? '')
      if (!rawValue.trim()) {
        throw new Error('请填写内容')
      }
      if (getEffectiveTextLength(rawValue) < MIN_CONTENT_LENGTH) {
        throw new Error(`${label}不少于${MIN_CONTENT_LENGTH}字`)
      }
    },
  },
]

const REPORT_STYLE = `
  .work-report-print {
    background: #fff;
    color: #111;
    font-family: SimSun, "Songti SC", serif;
    padding: 18px 22px 32px;
    border: 1px solid #d9d9d9;
  }

  .work-report-logo {
    font-size: 20px;
    color: #1ca4d7;
    font-weight: 700;
    margin-bottom: 18px;
  }

  .work-report-title {
    text-align: center;
    margin: 26px 0 36px;
    font-size: 34px;
    line-height: 1.6;
    letter-spacing: 18px;
    font-weight: 500;
  }

  .work-report-cover {
    min-height: 420px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .work-report-meta {
    width: 360px;
    font-size: 18px;
    line-height: 2.4;
  }

  .work-report-meta-row {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
  }

  .work-report-meta-label {
    width: 132px;
    white-space: pre;
  }

  .work-report-meta-line {
    flex: 1;
    min-width: 0;
    border-bottom: 2px solid #111;
    height: 30px;
    display: flex;
    align-items: flex-end;
    padding: 0 8px 3px;
    box-sizing: border-box;
    overflow: hidden;
  }

  .work-report-page-break {
    height: 22px;
  }

  .work-report-section {
    margin-top: 16px;
    font-size: 16px;
    line-height: 1.9;
  }

  .work-report-section-title {
    font-weight: 700;
    font-size: 18px;
    margin-bottom: 6px;
  }

  .work-report-question {
    margin-bottom: 26px;
  }

  .work-report-question-title {
    margin-bottom: 8px;
  }

  .work-report-answer {
    min-height: 140px;
    white-space: pre-wrap;
    word-break: break-word;
  }

  @media print {
    body {
      margin: 0;
      background: #fff;
    }

    .work-report-print {
      border: none;
      padding: 0;
    }
  }
`

const QUESTION_MIN_ROWS = 6

const buildEmptyLines = (value?: string) => {
  if (value && value.trim()) return value
  return Array.from({ length: QUESTION_MIN_ROWS })
    .map(() => ' ')
    .join('\n')
}

const WorkReportPreview: React.FC<{ record: WorkReportRecord }> = ({ record }) => (
  <div className="work-report-print">
    <style>{REPORT_STYLE}</style>
    <div className="work-report-logo">清美教育</div>

    <div className="work-report-cover">
      <div>
        <div className="work-report-title">
          员 工 转 正
          <br />述 职 报 告
        </div>

        <div className="work-report-meta">
          <div className="work-report-meta-row">
            <div className="work-report-meta-label">姓 名：</div>
            <div className="work-report-meta-line">{record.name}</div>
          </div>
          <div className="work-report-meta-row">
            <div className="work-report-meta-label">所在部门：</div>
            <div className="work-report-meta-line">{record.department}</div>
          </div>
          <div className="work-report-meta-row">
            <div className="work-report-meta-label">试用岗位：</div>
            <div className="work-report-meta-line">{record.position}</div>
          </div>
          <div className="work-report-meta-row">
            <div className="work-report-meta-label">日 期：</div>
            <div className="work-report-meta-line">{record.date}</div>
          </div>
        </div>
      </div>
    </div>

    <div className="work-report-page-break" />

    <div className="work-report-logo">清美教育</div>
    <div className="work-report-section">
      <div className="work-report-section-title">一、工作完成情况说明：</div>

      <div className="work-report-question">
        <div className="work-report-question-title">1、精彩工作评述：</div>
        <div className="work-report-answer">{buildEmptyLines(record.workDescription)}</div>
      </div>

      <div className="work-report-question">
        <div className="work-report-question-title">
          2、工作中遇到哪些困难，是如何解决的；若没有解决，问题何在？
        </div>
        <div className="work-report-answer">{buildEmptyLines(record.difficulties)}</div>
      </div>

      <div className="work-report-question">
        <div className="work-report-question-title">3、工作中成功的方面及经验总结；</div>
        <div className="work-report-answer">{buildEmptyLines(record.achievements)}</div>
      </div>

      <div className="work-report-question">
        <div className="work-report-question-title">
          4、工作中需要改进的方面及已采取或拟采取的改进措施。
        </div>
        <div className="work-report-answer">{buildEmptyLines(record.improvements)}</div>
      </div>

      <div className="work-report-question" style={{ marginBottom: 0 }}>
        <div className="work-report-question-title">5、转正后工作计划及计划达成成果</div>
        <div className="work-report-answer">{buildEmptyLines(record.futurePlan)}</div>
      </div>
    </div>
  </div>
)

const WorkReportForm: React.FC<{
  form: ReturnType<typeof Form.useForm>[0]
  onFinish: (values: Record<string, unknown>) => void
  currentUserName?: string
  currentUserDepartment?: string | null
  currentUserPosition?: string | null
}> = ({ form, onFinish, currentUserName, currentUserDepartment, currentUserPosition }) => (
  <Form form={form} layout="vertical" onFinish={onFinish}>
    <Card style={{ marginBottom: 16 }}>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input disabled placeholder="按当前登录账号自动带出" value={currentUserName} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="department"
            label="所在部门"
            rules={[{ required: true, message: '请输入所在部门' }]}
          >
            <Input
              disabled
              placeholder="按当前登录账号自动带出"
              value={currentUserDepartment ?? ''}
            />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="position"
            label="试用岗位"
            rules={[{ required: true, message: '请输入试用岗位' }]}
          >
            <Input
              disabled
              placeholder="按当前登录账号自动带出"
              value={currentUserPosition ?? ''}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="date" label="日期" rules={[{ required: true, message: '请选择日期' }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>
    </Card>

    <Card>
      <Form.Item
        name="workDescription"
        label="1、精彩工作评述"
        rules={createLongTextRules('精彩工作评述')}
      >
        <TextArea rows={6} placeholder={`请填写不少于${MIN_CONTENT_LENGTH}字`} />
      </Form.Item>

      <Form.Item
        name="difficulties"
        label="2、工作中遇到哪些困难，是如何解决的；若没有解决，问题何在？"
        rules={createLongTextRules('工作中遇到的困难及解决情况')}
      >
        <TextArea rows={6} placeholder={`请填写不少于${MIN_CONTENT_LENGTH}字`} />
      </Form.Item>

      <Form.Item
        name="achievements"
        label="3、工作中成功的方面及经验总结"
        rules={createLongTextRules('工作中成功的方面及经验总结')}
      >
        <TextArea rows={6} placeholder={`请填写不少于${MIN_CONTENT_LENGTH}字`} />
      </Form.Item>

      <Form.Item
        name="improvements"
        label="4、工作中需要改进的方面及已采取或拟采取的改进措施"
        rules={createLongTextRules('工作中需要改进的方面及改进措施')}
      >
        <TextArea rows={6} placeholder={`请填写不少于${MIN_CONTENT_LENGTH}字`} />
      </Form.Item>

      <Form.Item
        name="futurePlan"
        label="5、转正后工作计划及计划达成成果"
        rules={createLongTextRules('转正后工作计划及计划达成成果')}
      >
        <TextArea rows={6} placeholder={`请填写不少于${MIN_CONTENT_LENGTH}字`} />
      </Form.Item>
    </Card>
  </Form>
)

const WorkReport: React.FC<WorkReportProps> = ({ onWorkReportChanged }) => {
  const { message, modal } = App.useApp()
  const currentUser = useAuthStore((state) => state.user)
  const [form] = Form.useForm()
  const [data, setData] = useState<WorkReportRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [previewVisible, setPreviewVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<WorkReportRecord | null>(null)
  const [previewRecord, setPreviewRecord] = useState<WorkReportRecord | null>(null)
  const printRef = useRef<HTMLDivElement>(null)

  const applyCurrentUserDefaults = useCallback(() => {
    form.setFieldsValue({
      name: currentUser?.name || '',
      department: currentUser?.department || '',
      position: currentUser?.position || '',
      date: dayjs(),
    })
  }, [currentUser?.department, currentUser?.name, currentUser?.position, form])

  const loadRecords = useCallback(async () => {
    setLoading(true)
    try {
      const records = await workReportApi.list()
      setData(records)
    } catch (error) {
      console.error('Failed to load work reports:', error)
      message.error('加载述职报告失败')
    } finally {
      setLoading(false)
    }
  }, [message])

  useEffect(() => {
    void loadRecords()
  }, [loadRecords])

  const handleAdd = useCallback(() => {
    setEditingRecord(null)
    form.resetFields()
    applyCurrentUserDefaults()
    setModalVisible(true)
  }, [applyCurrentUserDefaults, form])

  const handleEdit = useCallback(
    (record: WorkReportRecord) => {
      setEditingRecord(record)
      form.setFieldsValue({
        ...record,
        date: record.date ? dayjs(record.date) : undefined,
      })
      setModalVisible(true)
    },
    [form],
  )

  const handleDelete = useCallback(
    (record: WorkReportRecord) => {
      modal.confirm({
        title: '确认删除该述职报告吗？',
        content: `删除后无法恢复：${record.name} ${record.date}`,
        okText: '删除',
        okButtonProps: { danger: true },
        cancelText: '取消',
        onOk: async () => {
          try {
            await workReportApi.remove(record.id)
            setData((prev) => prev.filter((item) => item.id !== record.id))
            await onWorkReportChanged?.()
            message.success('删除成功')
          } catch (error) {
            console.error('Failed to delete work report:', error)
            message.error('删除述职报告失败')
          }
        },
      })
    },
    [message, modal],
  )

  const handlePreview = useCallback((record: WorkReportRecord) => {
    setPreviewRecord(record)
    setPreviewVisible(true)
  }, [])

  const handleFinish = useCallback(
    async (values: Record<string, unknown>) => {
      const dateValue = values.date as dayjs.Dayjs | undefined
      const payload: WorkReportPayload = {
        date: dateValue ? dateValue.format('YYYY-MM-DD') : '',
        workDescription: String(values.workDescription || ''),
        difficulties: String(values.difficulties || ''),
        achievements: String(values.achievements || ''),
        improvements: String(values.improvements || ''),
        futurePlan: String(values.futurePlan || ''),
      }

      setSaving(true)
      try {
        if (editingRecord) {
          const updated = await workReportApi.update(editingRecord.id, payload)
          setData((prev) => prev.map((item) => (item.id === editingRecord.id ? updated : item)))
          message.success('更新成功')
        } else {
          const created = await workReportApi.create(payload)
          setData((prev) => [created, ...prev])
          message.success('新建成功')
        }

        await onWorkReportChanged?.()

        setModalVisible(false)
        form.resetFields()
      } catch (error) {
        console.error('Failed to save work report:', error)
        message.error(
          getErrorMessage(error, editingRecord ? '更新述职报告失败' : '新建述职报告失败'),
        )
      } finally {
        setSaving(false)
      }
    },
    [editingRecord, form, message, onWorkReportChanged],
  )

  const columns: ColumnsType<WorkReportRecord> = useMemo(
    () => [
      {
        title: '序号',
        width: 70,
        align: 'center',
        render: (_value, _record, index) => index + 1,
      },
      {
        title: '姓名',
        dataIndex: 'name',
        width: 120,
      },
      {
        title: '所在部门',
        dataIndex: 'department',
        width: 160,
      },
      {
        title: '试用岗位',
        dataIndex: 'position',
        width: 160,
      },
      {
        title: '日期',
        dataIndex: 'date',
        width: 140,
      },
      {
        title: '操作',
        width: 180,
        align: 'center',
        render: (_value, record) => (
          <Space size="small">
            <Tooltip title="预览">
              <Button
                type="link"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => handlePreview(record)}
              />
            </Tooltip>
            {record.canEdit ? (
              <Tooltip title="编辑">
                <Button
                  type="link"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => handleEdit(record)}
                />
              </Tooltip>
            ) : null}
            {record.canDelete ? (
              <Tooltip title="删除">
                <Button
                  type="link"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleDelete(record)}
                />
              </Tooltip>
            ) : null}
          </Space>
        ),
      },
    ],
    [handleDelete, handleEdit, handlePreview],
  )

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=900,height=1200')
    if (!printWindow || !printRef.current) {
      message.error('无法打开打印窗口')
      return
    }

    printWindow.document.open()
    printWindow.document.write(`
      <html>
        <head>
          <title>员工转正述职报告</title>
          <style>${REPORT_STYLE}</style>
        </head>
        <body>${printRef.current.innerHTML}</body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
    }, 200)
  }

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <FileTextOutlined style={{ fontSize: 18 }} />
              <Title level={5} style={{ margin: 0 }}>
                员工转正述职报告
              </Title>
            </Space>
          </Col>
          <Col>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新建述职报告
            </Button>
          </Col>
        </Row>
        <div style={{ marginTop: 12 }}>
          <Text type="secondary">{WORK_REPORT_RULE_DESCRIPTION}</Text>
        </div>
      </Card>

      <Card>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={data}
          loading={loading}
          pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 条` }}
          locale={{ emptyText: '暂无述职报告' }}
        />
      </Card>

      <Modal
        title={editingRecord ? '编辑述职报告' : '新建述职报告'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false)
          form.resetFields()
        }}
        width={920}
        destroyOnClose
        footer={[
          <Button
            key="cancel"
            disabled={saving}
            onClick={() => {
              setModalVisible(false)
              form.resetFields()
            }}
          >
            取消
          </Button>,
          <Button
            key="save"
            type="primary"
            icon={<SaveOutlined />}
            loading={saving}
            onClick={() => form.submit()}
          >
            保存
          </Button>,
        ]}
      >
        <Alert
          type="info"
          showIcon
          message="填写规则"
          description={WORK_REPORT_RULE_DESCRIPTION}
          style={{ marginBottom: 16 }}
        />
        <WorkReportForm
          form={form}
          onFinish={handleFinish}
          currentUserName={currentUser?.name}
          currentUserDepartment={currentUser?.department}
          currentUserPosition={currentUser?.position}
        />
      </Modal>

      <Modal
        title="述职报告预览"
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        width={860}
        footer={[
          <Button key="close" onClick={() => setPreviewVisible(false)}>
            关闭
          </Button>,
          <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>
            打印
          </Button>,
        ]}
      >
        <div ref={printRef}>
          {previewRecord ? <WorkReportPreview record={previewRecord} /> : null}
        </div>
      </Modal>
    </div>
  )
}

export default WorkReport
