import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  App,
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Form,
  Input,
  Modal,
  Popconfirm,
  Row,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  CheckOutlined,
  CloseOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  PrinterOutlined,
  SaveOutlined,
  SendOutlined,
  SolutionOutlined,
} from '@ant-design/icons'
import dayjs, { type Dayjs } from 'dayjs'
import {
  ApproverSelectionSection,
  mergeApproverSelections,
  normalizeSelectedApproverMap,
  type ApproverSelectionStage,
} from '@/components/human-resources/ApproverSelectionSection'
import { useAuthStore } from '@/stores/authStore'
import { useCampusStore } from '@/stores/campusStore'
import {
  approveAppointmentInterviewRecord,
  createAppointmentInterviewRecord,
  previewAppointmentInterviewApproverCandidates,
  deleteAppointmentInterviewRecord,
  listAppointmentInterviewRecords,
  rejectAppointmentInterviewRecord,
  submitAppointmentInterviewRecord,
  updateAppointmentInterviewRecord,
  type AppointmentInterviewApprovalInfo,
  type AppointmentInterviewApprovalPreviewStage,
  type AppointmentInterviewRecord as AppointmentInterviewRecordItem,
  type AppointmentInterviewRecordPayload,
} from '@/services/humanresources/appointmentInterviewRecord'

const { Title, Text } = Typography
const { TextArea } = Input

const INTERVIEW_OUTLINE = [
  '对企业的熟悉情况。',
  '对本岗位职责业务、流程熟悉情况。',
  '工作开展、上下级工作协作、同事间沟通。',
  '对政策、管理等建议。',
  '个人定位，对公司部门的需求。',
]

const INTERVIEW_QUESTIONS = [
  '问：对企业的熟悉情况？',
  '问：工作开展、上下级工作协作、同事间沟通？',
  '问：对政策、管理等建议？',
  '问：个人定位，对公司部门的需求？',
  '问：对晋升后的岗位认知及职业规划？',
]

const STATUS_COLOR_MAP: Record<string, string> = {
  draft: 'default',
  pending: 'processing',
  approved: 'success',
  rejected: 'error',
}

const FLOW_STATUS_COLOR_MAP: Record<string, string> = {
  waiting: 'default',
  current: 'processing',
  completed: 'success',
  rejected: 'error',
}

type ApprovalInfo = AppointmentInterviewApprovalInfo
type InterviewRecord = AppointmentInterviewRecordItem

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

const normalizeAnswers = (answers?: string[]) => {
  const next = [...(answers || [])]
  while (next.length < INTERVIEW_QUESTIONS.length) {
    next.push('')
  }
  return next.slice(0, INTERVIEW_QUESTIONS.length)
}

const formatApproverNames = (record: InterviewRecord) => {
  if (!record.currentApprovers.length) {
    return '-'
  }
  return record.currentApprovers.map((item) => item.name).join('、')
}

const formatApprovalDate = (value?: string) => value || '____年____月____日'

const renderApprovalContent = (info: ApprovalInfo | undefined, signerLabel: string) => (
  <div>
    {info?.opinion ? (
      <div style={{ marginBottom: 8, whiteSpace: 'pre-wrap' }}>{info.opinion}</div>
    ) : null}
    <div style={{ textAlign: 'right' }}>
      <span>
        {signerLabel}：{info?.signer || '________'}
      </span>
      <span style={{ marginLeft: 24 }}>日期：{formatApprovalDate(info?.signDate)}</span>
    </div>
  </div>
)

type EditModalProps = {
  open: boolean
  loading: boolean
  editingRecord: InterviewRecord | null
  currentCampus?: string | null
  currentUserName?: string | null
  onCancel: () => void
  onOk: (payload: AppointmentInterviewRecordPayload) => Promise<void>
}

const EditModal: React.FC<EditModalProps> = ({
  open,
  loading,
  editingRecord,
  currentCampus,
  currentUserName,
  onCancel,
  onOk,
}) => {
  const [form] = Form.useForm()
  const [approverPreview, setApproverPreview] = useState<
    AppointmentInterviewApprovalPreviewStage[]
  >([])
  const [approverPreviewLoading, setApproverPreviewLoading] = useState(false)
  const selectedCampus = Form.useWatch('campus', form)
  const approverPreviewStages = useMemo<ApproverSelectionStage[]>(
    () =>
      approverPreview.map((stage) => ({
        stage: stage.stage,
        stageLabel: stage.stageLabel,
        recommendedUserIds: stage.recommendedUserIds,
        approvers: stage.approvers,
        allowMultiApprover: stage.allowMultiApprover,
        applicantSelectable: stage.applicantSelectable,
      })),
    [approverPreview],
  )

  useEffect(() => {
    if (!open) {
      form.resetFields()
      setApproverPreview([])
      setApproverPreviewLoading(false)
      return
    }

    if (editingRecord) {
      form.setFieldsValue({
        campus: editingRecord.campus,
        interviewer: editingRecord.interviewer,
        interviewee: editingRecord.interviewee,
        location: editingRecord.location,
        interviewDate: editingRecord.interviewDate ? dayjs(editingRecord.interviewDate) : undefined,
        answers: normalizeAnswers(editingRecord.answers),
        suggestions: editingRecord.suggestions,
        selectedApproverUserIds: editingRecord.selectedApproverUserIds || {},
        selfSign: {
          signer: editingRecord.selfSign.signer || undefined,
          signDate: editingRecord.selfSign.signDate
            ? dayjs(editingRecord.selfSign.signDate)
            : undefined,
        },
      })
      return
    }

    form.setFieldsValue({
      campus: currentCampus || undefined,
      interviewer: currentUserName || undefined,
      interviewDate: dayjs(),
      answers: normalizeAnswers([]),
      selectedApproverUserIds: {},
      selfSign: {
        signer: currentUserName || undefined,
        signDate: dayjs(),
      },
    })
  }, [currentCampus, currentUserName, editingRecord, form, open])

  useEffect(() => {
    if (!open) {
      return
    }

    const normalizedCampus = typeof selectedCampus === 'string' ? selectedCampus.trim() : ''
    if (!normalizedCampus) {
      setApproverPreview([])
      form.setFieldValue(
        'selectedApproverUserIds',
        normalizeSelectedApproverMap(form.getFieldValue('selectedApproverUserIds')),
      )
      return
    }

    let active = true
    setApproverPreviewLoading(true)
    previewAppointmentInterviewApproverCandidates({
      campus: normalizedCampus,
    })
      .then((stages) => {
        if (!active) return
        setApproverPreview(stages)
        form.setFieldValue(
          'selectedApproverUserIds',
          mergeApproverSelections(
            stages,
            form.getFieldValue('selectedApproverUserIds'),
            editingRecord?.selectedApproverUserIds,
          ),
        )
      })
      .catch((error) => {
        if (!active) return
        console.error('加载任命访谈审批人候选失败', error)
        message.error(getErrorMessage(error, '加载任命访谈审批人候选失败'))
        setApproverPreview([])
      })
      .finally(() => {
        if (active) {
          setApproverPreviewLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [editingRecord?.id, form, open, selectedCampus])

  const handleOk = useCallback(async () => {
    const values = await form.validateFields()
    const interviewDate = values.interviewDate as Dayjs
    const selfSign = (values.selfSign || {}) as {
      signer?: string
      signDate?: Dayjs
    }

    const payload: AppointmentInterviewRecordPayload = {
      campus: values.campus as string,
      interviewer: values.interviewer as string,
      interviewee: values.interviewee as string,
      location: (values.location as string) || '',
      interviewDate: interviewDate.format('YYYY-MM-DD'),
      answers: normalizeAnswers(values.answers as string[]),
      suggestions: (values.suggestions as string) || '',
      selfSign: {
        opinion: '',
        signer: selfSign.signer || '',
        signDate: selfSign.signDate ? selfSign.signDate.format('YYYY-MM-DD') : '',
      },
      selectedApproverUserIds: normalizeSelectedApproverMap(values.selectedApproverUserIds),
    }
    await onOk(payload)
  }, [form, onOk])

  return (
    <Modal
      title={editingRecord ? '编辑任命访谈记录' : '新建任命访谈记录'}
      open={open}
      onCancel={onCancel}
      width={960}
      destroyOnClose
      footer={[
        <Button key="cancel" disabled={loading} onClick={onCancel}>
          取消
        </Button>,
        <Button
          key="save"
          type="primary"
          loading={loading}
          icon={<SaveOutlined />}
          onClick={() => void handleOk()}
        >
          保存
        </Button>,
      ]}
    >
      <div style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: 8 }}>
        <Form form={form} layout="vertical">
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <Title level={3} style={{ margin: 0 }}>
              任命访谈记录表
            </Title>
          </div>

          <Card title="基本信息" size="small" style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="campus"
                  label="所属神殿"
                  rules={[{ required: true, message: '请选择所属神殿' }]}
                >
                  <Input placeholder="所属神殿" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="interviewer"
                  label="访谈人员"
                  rules={[{ required: true, message: '请输入访谈人员' }]}
                >
                  <Input placeholder="请输入访谈人员姓名" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="interviewee"
                  label="被访谈人员"
                  rules={[{ required: true, message: '请输入被访谈人员' }]}
                >
                  <Input placeholder="请输入被访谈人员姓名" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="interviewDate"
                  label="访谈时间"
                  rules={[{ required: true, message: '请选择访谈时间' }]}
                >
                  <DatePicker style={{ width: '100%' }} placeholder="请选择日期" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="location" label="访谈地点">
                  <Input placeholder="请输入访谈地点" />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Card title="访谈目的 & 提纲" size="small" style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 12 }}>
              <Text strong>访谈目的：</Text>
              <br />
              <Text>
                任命前面谈：主要了解员工对公司、业务等熟悉情况、工作开展情况、胜任情况等方面
              </Text>
            </div>
            <div>
              <Text strong>访谈提纲：</Text>
              <ol style={{ margin: '8px 0 0', paddingLeft: 20, lineHeight: 2 }}>
                {INTERVIEW_OUTLINE.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ol>
            </div>
          </Card>

          <Card title="访谈内容" size="small" style={{ marginBottom: 16 }}>
            {INTERVIEW_QUESTIONS.map((question, idx) => (
              <div key={question} style={{ marginBottom: 16 }}>
                <Text strong style={{ fontSize: 14, display: 'block', marginBottom: 4 }}>
                  {idx + 1}、{question}
                </Text>
                <Form.Item name={['answers', idx]} style={{ marginBottom: 0 }}>
                  <TextArea rows={4} placeholder={`请记录关于“${question}”的访谈内容`} />
                </Form.Item>
              </div>
            ))}
          </Card>

          <Card title="对集团/神殿的建议" size="small" style={{ marginBottom: 16 }}>
            <Form.Item name="suggestions" style={{ marginBottom: 0 }}>
              <TextArea rows={4} placeholder="请记录被访谈人员对集团/神殿的建议" />
            </Form.Item>
          </Card>

          <Card title="本人签字" size="small" style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name={['selfSign', 'signer']} label="签字">
                  <Input placeholder="本人签字" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name={['selfSign', 'signDate']} label="日期">
                  <DatePicker style={{ width: '100%' }} placeholder="选择日期" />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <ApproverSelectionSection
            previewStages={approverPreviewStages}
            loading={approverPreviewLoading}
            title="审批人选择"
            description="系统先给出本单据的候选审批人。若某一环节命中多人，需要在提交前手动选择实际审批人；系统不会再默认把整组候选人全部选中。"
            emptyText="先填写所属神殿，系统再加载任命访谈记录的审批人候选。"
          />

          <Alert
            type="info"
            showIcon
            message="审批说明"
            description="校长意见、人资意见不再由访谈人填写。记录提交后，系统会按所属神殿规则由对应审批人填写；最高议事厅不设置校长意见，神殿单据由校长后续流转到人资部总监。"
          />
        </Form>
      </div>
    </Modal>
  )
}

const PrintPreview: React.FC<{ record: InterviewRecord }> = ({ record }) => {
  const hasPrincipalStage = record.approvalFlow.some((item) => item.stage === 'principal')
  const hasChairmanStage = record.approvalFlow.some((item) => item.stage === 'chairman')
  const cell: React.CSSProperties = {
    border: '1px solid #333',
    padding: '8px 10px',
    fontSize: 13,
    lineHeight: 1.8,
    verticalAlign: 'top',
  }
  const labelCell: React.CSSProperties = {
    ...cell,
    background: '#f5f5f5',
    fontWeight: 600,
    width: '15%',
  }

  return (
    <div style={{ padding: '16px 24px', fontFamily: 'SimSun, serif' }}>
      <div style={{ textAlign: 'center', marginBottom: 4 }}>
        <Title level={4} style={{ margin: 0 }}>
          任命访谈记录表
        </Title>
      </div>
      <div style={{ textAlign: 'right', marginBottom: 8, fontSize: 13 }}>
        访谈时间：{record.interviewDate || 'XXXX年XXXX月XXXX日'}
      </div>

      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          border: '2px solid #333',
          tableLayout: 'fixed',
        }}
      >
        <tbody>
          <tr>
            <td style={{ ...labelCell, textAlign: 'center' }}>所属神殿</td>
            <td style={{ ...cell, width: '35%' }}>{record.campus}</td>
            <td style={{ ...labelCell, textAlign: 'center' }}>访谈人员</td>
            <td style={{ ...cell, width: '35%' }}>{record.interviewer}</td>
          </tr>
          <tr>
            <td style={{ ...labelCell, textAlign: 'center' }}>被访谈人员</td>
            <td style={cell}>{record.interviewee}</td>
            <td style={{ ...labelCell, textAlign: 'center' }}>访谈地点</td>
            <td style={cell}>{record.location}</td>
          </tr>
          <tr>
            <td colSpan={4} style={{ ...cell, background: '#f5f5f5', fontWeight: 600 }}>
              访谈目的：
            </td>
          </tr>
          <tr>
            <td colSpan={4} style={{ ...cell, fontSize: 12, lineHeight: 2 }}>
              任命前面谈：主要了解员工对公司、业务等熟悉情况、工作开展情况、胜任情况等方面
            </td>
          </tr>
          <tr>
            <td colSpan={4} style={{ ...cell, background: '#f5f5f5', fontWeight: 600 }}>
              访谈提纲：
            </td>
          </tr>
          <tr>
            <td colSpan={4} style={{ ...cell, fontSize: 12, lineHeight: 2 }}>
              {INTERVIEW_OUTLINE.map((item, idx) => (
                <div key={idx}>
                  {idx + 1}、{item}
                </div>
              ))}
            </td>
          </tr>
          <tr>
            <td colSpan={4} style={{ ...cell, background: '#f5f5f5', fontWeight: 600 }}>
              访谈内容：
            </td>
          </tr>
          {INTERVIEW_QUESTIONS.map((question, idx) => (
            <tr key={question}>
              <td colSpan={4} style={{ ...cell, minHeight: 80 }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>
                  {idx + 1}、{question}
                </div>
                <div style={{ whiteSpace: 'pre-wrap', minHeight: 48 }}>
                  {record.answers?.[idx] || ''}
                </div>
              </td>
            </tr>
          ))}
          <tr>
            <td colSpan={4} style={{ ...cell, background: '#f5f5f5', fontWeight: 600 }}>
              对集团/神殿的建议：
            </td>
          </tr>
          <tr>
            <td colSpan={4} style={{ ...cell, minHeight: 60 }}>
              <div style={{ whiteSpace: 'pre-wrap', minHeight: 40 }}>
                {record.suggestions || ''}
              </div>
            </td>
          </tr>
          <tr>
            <td style={{ ...labelCell, textAlign: 'center' }}>本人签字</td>
            <td colSpan={3} style={{ ...cell, minHeight: 50 }}>
              <div style={{ textAlign: 'right', paddingTop: 16 }}>
                <span>签字：{record.selfSign?.signer || '________'}</span>
                <span style={{ marginLeft: 24 }}>
                  日期：{formatApprovalDate(record.selfSign?.signDate)}
                </span>
              </div>
            </td>
          </tr>
          {hasPrincipalStage ? (
            <tr>
              <td style={{ ...labelCell, textAlign: 'center' }}>校长意见</td>
              <td colSpan={3} style={{ ...cell, minHeight: 60 }}>
                {renderApprovalContent(record.principalApproval, '校 长')}
              </td>
            </tr>
          ) : null}
          <tr>
            <td style={{ ...labelCell, textAlign: 'center' }}>人资意见</td>
            <td colSpan={3} style={{ ...cell, minHeight: 60 }}>
              {renderApprovalContent(record.hrApproval, '人资部总监')}
            </td>
          </tr>
          {hasChairmanStage ? (
            <tr>
              <td style={{ ...labelCell, textAlign: 'center' }}>董事长签批</td>
              <td colSpan={3} style={{ ...cell, minHeight: 60 }}>
                {renderApprovalContent(record.chairmanApproval, '签字')}
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  )
}

const AppointmentInterviewRecord: React.FC = () => {
  const { user } = useAuthStore()
  const { currentCampus } = useCampusStore()
  const [data, setData] = useState<InterviewRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [previewVisible, setPreviewVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<InterviewRecord | null>(null)
  const [previewRecord, setPreviewRecord] = useState<InterviewRecord | null>(null)
  const [actionRecord, setActionRecord] = useState<InterviewRecord | null>(null)
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve')
  const [actionModalVisible, setActionModalVisible] = useState(false)
  const [actionComment, setActionComment] = useState('')

  const currentUserName = user?.name || undefined
  const defaultCampus = useMemo(
    () => currentCampus || user?.campus || '最高议事厅',
    [currentCampus, user?.campus],
  )

  const mergeUpdatedRecord = useCallback((updated: InterviewRecord) => {
    setData((prev) => {
      const exists = prev.some((item) => item.id === updated.id)
      if (!exists) {
        return [updated, ...prev]
      }
      return prev.map((item) => (item.id === updated.id ? updated : item))
    })
    setEditingRecord((prev) => (prev?.id === updated.id ? updated : prev))
    setPreviewRecord((prev) => (prev?.id === updated.id ? updated : prev))
    setActionRecord((prev) => (prev?.id === updated.id ? updated : prev))
  }, [])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const records = await listAppointmentInterviewRecords()
      setData(records)
    } catch (error) {
      message.error(getErrorMessage(error, '加载任命访谈记录失败'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const handleAdd = useCallback(() => {
    setEditingRecord(null)
    setEditModalOpen(true)
  }, [])

  const handleEdit = useCallback((record: InterviewRecord) => {
    setEditingRecord(record)
    setEditModalOpen(true)
  }, [])

  const handlePreview = useCallback((record: InterviewRecord) => {
    setPreviewRecord(record)
    setPreviewVisible(true)
  }, [])

  const handleDelete = useCallback(
    async (record: InterviewRecord) => {
      try {
        await deleteAppointmentInterviewRecord(record.id)
        setData((prev) => prev.filter((item) => item.id !== record.id))
        if (previewRecord?.id === record.id) {
          setPreviewVisible(false)
          setPreviewRecord(null)
        }
        message.success('删除成功')
      } catch (error) {
        message.error(getErrorMessage(error, '删除任命访谈记录失败'))
      }
    },
    [previewRecord],
  )

  const handleSave = useCallback(
    async (payload: AppointmentInterviewRecordPayload) => {
      setSubmitting(true)
      try {
        if (editingRecord) {
          const updated = await updateAppointmentInterviewRecord(editingRecord.id, payload)
          mergeUpdatedRecord(updated)
          message.success('更新成功')
        } else {
          const created = await createAppointmentInterviewRecord(payload)
          mergeUpdatedRecord(created)
          message.success('新建成功')
        }
        setEditModalOpen(false)
        setEditingRecord(null)
      } catch (error) {
        message.error(
          getErrorMessage(error, editingRecord ? '更新任命访谈记录失败' : '创建任命访谈记录失败'),
        )
      } finally {
        setSubmitting(false)
      }
    },
    [editingRecord, mergeUpdatedRecord],
  )

  const handleSubmitRecord = useCallback(
    async (record: InterviewRecord) => {
      try {
        const updated = await submitAppointmentInterviewRecord(record.id)
        mergeUpdatedRecord(updated)
        message.success('提交成功')
      } catch (error) {
        message.error(getErrorMessage(error, '提交任命访谈记录失败'))
      }
    },
    [mergeUpdatedRecord],
  )

  const openActionModal = useCallback((record: InterviewRecord, type: 'approve' | 'reject') => {
    setActionRecord(record)
    setActionType(type)
    setActionComment('')
    setActionModalVisible(true)
  }, [])

  const handleActionConfirm = useCallback(async () => {
    if (!actionRecord) {
      return
    }
    const normalizedComment = actionComment.trim()
    if (!normalizedComment) {
      message.error(actionType === 'approve' ? '请填写审批意见' : '请填写驳回原因')
      return
    }

    setSubmitting(true)
    try {
      const updated =
        actionType === 'approve'
          ? await approveAppointmentInterviewRecord(actionRecord.id, { comment: normalizedComment })
          : await rejectAppointmentInterviewRecord(actionRecord.id, { comment: normalizedComment })
      mergeUpdatedRecord(updated)
      setActionModalVisible(false)
      setActionRecord(null)
      setActionComment('')
      message.success(actionType === 'approve' ? '审批通过成功' : '驳回成功')
    } catch (error) {
      message.error(getErrorMessage(error, actionType === 'approve' ? '审批通过失败' : '驳回失败'))
    } finally {
      setSubmitting(false)
    }
  }, [actionComment, actionRecord, actionType, mergeUpdatedRecord])

  const columns: ColumnsType<InterviewRecord> = [
    {
      title: '序号',
      width: 60,
      align: 'center',
      render: (_value, _record, index) => index + 1,
    },
    {
      title: '所属神殿',
      dataIndex: 'campus',
      width: 130,
    },
    {
      title: '访谈人员',
      dataIndex: 'interviewer',
      width: 100,
      render: (value: string) => value?.trim() || <Text type="secondary">待填写</Text>,
    },
    {
      title: '被访谈人员',
      dataIndex: 'interviewee',
      width: 100,
    },
    {
      title: '访谈时间',
      dataIndex: 'interviewDate',
      width: 120,
    },
    {
      title: '状态',
      dataIndex: 'statusLabel',
      width: 100,
      align: 'center',
      render: (_value, record) => (
        <Tag color={STATUS_COLOR_MAP[record.status]}>{record.statusLabel}</Tag>
      ),
    },
    {
      title: '当前阶段',
      width: 110,
      align: 'center',
      render: (_value, record) => record.currentStageLabel || '-',
    },
    {
      title: '当前审批人',
      width: 180,
      render: (_value, record) => formatApproverNames(record),
    },
    {
      title: '操作',
      width: 240,
      align: 'center',
      fixed: 'right',
      render: (_value, record) => (
        <Space size="small" wrap>
          <Tooltip title="查看">
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
          {record.canSubmit ? (
            <Popconfirm
              title="确认提交审批？"
              description="提交后将按所属神殿规则由校长和人资部总监依次填写意见；最高议事厅不设置校长意见。"
              onConfirm={() => void handleSubmitRecord(record)}
              okText="提交"
              cancelText="取消"
            >
              <Tooltip title="提交">
                <Button type="link" size="small" icon={<SendOutlined />} />
              </Tooltip>
            </Popconfirm>
          ) : null}
          {record.canApprove ? (
            <Tooltip title="审批通过">
              <Button
                type="link"
                size="small"
                icon={<CheckOutlined />}
                onClick={() => openActionModal(record, 'approve')}
              />
            </Tooltip>
          ) : null}
          {record.canApprove ? (
            <Tooltip title="驳回">
              <Button
                type="link"
                size="small"
                danger
                icon={<CloseOutlined />}
                onClick={() => openActionModal(record, 'reject')}
              />
            </Tooltip>
          ) : null}
          {record.canDelete ? (
            <Popconfirm
              title="确认删除"
              description="确定要删除这条任命访谈记录吗？"
              okText="删除"
              cancelText="取消"
              okButtonProps={{ danger: true }}
              onConfirm={() => void handleDelete(record)}
            >
              <Tooltip title="删除">
                <Button type="link" size="small" danger icon={<DeleteOutlined />} />
              </Tooltip>
            </Popconfirm>
          ) : null}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <SolutionOutlined style={{ fontSize: 20 }} />
              <Title level={5} style={{ margin: 0 }}>
                任命访谈记录表
              </Title>
              <Text type="secondary">共 {data.length} 条记录</Text>
            </Space>
          </Col>
          <Col>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新建任命访谈记录
            </Button>
          </Col>
        </Row>
      </Card>

      <Alert
        style={{ marginBottom: 16 }}
        type="info"
        showIcon
        message="流程说明"
        description="访谈人现在只填写基础内容和本人签字。最高议事厅单据仅由人资部总监填写人资意见；各神殿单据由所属校长先填写校长意见，再流转至人资部总监。"
      />

      <Card>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 条` }}
          scroll={{ x: 1200 }}
          locale={{ emptyText: '暂无任命访谈记录，点击“新建任命访谈记录”创建' }}
        />
      </Card>

      <EditModal
        open={editModalOpen}
        loading={submitting}
        editingRecord={editingRecord}
        currentCampus={defaultCampus}
        currentUserName={currentUserName}
        onCancel={() => {
          if (submitting) {
            return
          }
          setEditModalOpen(false)
          setEditingRecord(null)
        }}
        onOk={handleSave}
      />

      <Modal
        title="任命访谈记录表预览"
        open={previewVisible}
        width={960}
        onCancel={() => setPreviewVisible(false)}
        footer={[
          <Button key="close" onClick={() => setPreviewVisible(false)}>
            关闭
          </Button>,
          <Button
            key="print"
            type="primary"
            icon={<PrinterOutlined />}
            onClick={() => window.print()}
          >
            打印
          </Button>,
        ]}
      >
        {previewRecord ? (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="状态">
                <Tag color={STATUS_COLOR_MAP[previewRecord.status]}>
                  {previewRecord.statusLabel}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="当前阶段">
                {previewRecord.currentStageLabel || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="当前审批人">
                {formatApproverNames(previewRecord)}
              </Descriptions.Item>
              <Descriptions.Item label="创建人">
                {previewRecord.createdByName || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="提交时间">
                {previewRecord.submittedAt || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="完成时间">
                {previewRecord.completedAt || '-'}
              </Descriptions.Item>
            </Descriptions>

            {previewRecord.rejectionReason ? (
              <Alert type="error" showIcon message={`驳回原因：${previewRecord.rejectionReason}`} />
            ) : null}

            <Card size="small" title="审批流">
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                {previewRecord.approvalFlow.map((step) => (
                  <div
                    key={step.stage}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 16,
                      paddingBottom: 12,
                      borderBottom: '1px solid #f0f0f0',
                    }}
                  >
                    <div>
                      <Space size={8} wrap>
                        <Text strong>{step.stageLabel}</Text>
                        <Tag color={FLOW_STATUS_COLOR_MAP[step.status]}>{step.statusLabel}</Tag>
                      </Space>
                      <div style={{ marginTop: 8, color: '#666' }}>
                        审批人：
                        {step.approvers.length
                          ? step.approvers.map((item) => item.name).join('、')
                          : '未匹配'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', minWidth: 240 }}>
                      {step.comment ? (
                        <div style={{ whiteSpace: 'pre-wrap' }}>{step.comment}</div>
                      ) : null}
                      {step.actedByName ? (
                        <div style={{ marginTop: 8, color: '#666' }}>
                          {step.actionLabel || '已处理'}：{step.actedByName}
                          {step.actedAt ? ` (${step.actedAt})` : ''}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </Space>
            </Card>

            <PrintPreview record={previewRecord} />
          </Space>
        ) : null}
      </Modal>

      <Modal
        title={actionType === 'approve' ? '审批通过' : '驳回记录'}
        open={actionModalVisible}
        confirmLoading={submitting}
        onCancel={() => {
          if (submitting) {
            return
          }
          setActionModalVisible(false)
          setActionComment('')
          setActionRecord(null)
        }}
        onOk={() => void handleActionConfirm()}
        okText={actionType === 'approve' ? '通过' : '驳回'}
        cancelText="取消"
        okButtonProps={actionType === 'reject' ? { danger: true } : undefined}
      >
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Alert
            type={actionType === 'approve' ? 'info' : 'warning'}
            showIcon
            message={
              actionType === 'approve'
                ? `将以当前登录人身份填写${actionRecord?.currentStageLabel || '当前环节'}意见并推进流程。`
                : `将以当前登录人身份填写${actionRecord?.currentStageLabel || '当前环节'}驳回意见。`
            }
          />
          <Input.TextArea
            rows={5}
            value={actionComment}
            onChange={(event) => setActionComment(event.target.value)}
            placeholder={actionType === 'approve' ? '请输入审批意见' : '请输入驳回原因'}
          />
        </Space>
      </Modal>
    </div>
  )
}

export default AppointmentInterviewRecord
