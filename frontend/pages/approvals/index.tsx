import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { App,
  Badge,
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Input,
  InputNumber,
  List,
  Modal,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Tabs,
  Typography,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { CheckOutlined, CloseOutlined, EyeOutlined, ReloadOutlined } from '@ant-design/icons'
import { type Dayjs } from 'dayjs'
import {
  approveApprovalCenterItem,
  getApprovalCenterDetail,
  getApprovalCenterSummary,
  getApprovalHistoryItems,
  listApprovalNotifications,
  markAllApprovalNotificationsRead,
  markApprovalNotificationReadWithBiz,
  rejectApprovalCenterItem,
  subscribeApprovalReminderSummary,
  type ApprovalCenterItem,
  type ApprovalDetailRecord,
  type ApprovalHistoryItem,
  type ApprovalNotificationItem,
} from '@/services/approvalCenter'
import {
  listTransferConsultants,
  type ConsultantTransferConsultantInfo,
} from '@/services/consult/consultantTransfer'
import type { AppointmentInterviewRecord } from '@/services/humanresources/appointmentInterviewRecord'
import type { RecruitmentRequestRecord } from '@/services/humanresources/recruitmentRequest'
import type { PromotionApplicationRecord } from '@/services/humanresources/promotionApplication'
import type { RegularizationApplicationRecord } from '@/services/humanresources/regularizationApplication'
import type { ResignationApprovalRecord } from '@/services/humanresources/resignationApproval'
import type { SocialInsuranceApplicationRecord } from '@/services/humanresources/socialInsuranceApplication'
import type { TrainingApplicationRecord } from '@/services/humanresources/trainingApplication'
import type { TransferApplicationRecord } from '@/services/humanresources/transferApplication'
import type { UnpaidLeaveApplicationRecord } from '@/services/humanresources/unpaidLeaveApplication'
import type { WorkHandoverRecord } from '@/services/humanresources/workHandover'

const { Text, Paragraph } = Typography
const { TextArea } = Input

type ApprovalActionState = {
  open: boolean
  type: 'approve' | 'reject'
  item: ApprovalCenterItem | null
  detail: ApprovalDetailRecord | null
}

type DetailState = {
  open: boolean
  loading: boolean
  item: ApprovalCenterItem | ApprovalHistoryItem | null
  detail: ApprovalDetailRecord | null
}

type ApprovalTabKey = 'pending' | 'history' | 'notifications'

const TYPE_LABEL_MAP: Record<ApprovalCenterItem['type'], string> = {
  appointment_interview: '任命访谈',
  recruitment: '招聘需求',
  training_application: '培训申请',
  regularization: '转正申请',
  promotion: '晋升申请',
  social_insurance: '社保申请',
  transfer_application: '调岗申请',
  unpaid_leave: '停薪留职申请',
  work_handover: '工作交接表',
  resignation_approval: '离职审批单',
  transfer: '跨神殿转量',
  export: '咨询量导出',
}

type ApiErrorLike = {
  response?: {
    data?: {
      detail?: string
    }
  }
  message?: string
}

const getErrorMessage = (error: unknown, fallback: string) => {
  const apiError = error as ApiErrorLike
  return apiError.response?.data?.detail || apiError.message || fallback
}

const isRecruitmentDetail = (
  detail: ApprovalDetailRecord | null,
): detail is RecruitmentRequestRecord => {
  return !!detail && 'requestNo' in detail
}

const isAppointmentInterviewDetail = (
  detail: ApprovalDetailRecord | null,
): detail is AppointmentInterviewRecord => {
  return !!detail && 'interviewDate' in detail && 'selfSign' in detail
}

const isSocialInsuranceDetail = (
  detail: ApprovalDetailRecord | null,
): detail is SocialInsuranceApplicationRecord => {
  return !!detail && 'applicationNo' in detail && 'insuranceType' in detail
}

const isTrainingApplicationDetail = (
  detail: ApprovalDetailRecord | null,
): detail is TrainingApplicationRecord => {
  return !!detail && 'applicationNo' in detail && 'totalHours' in detail && 'objective' in detail
}

const isPromotionDetail = (
  detail: ApprovalDetailRecord | null,
): detail is PromotionApplicationRecord => {
  return !!detail && 'applicationNo' in detail && 'promotionReason' in detail
}

const isRegularizationDetail = (
  detail: ApprovalDetailRecord | null,
): detail is RegularizationApplicationRecord => {
  return (
    !!detail &&
    'applicationNo' in detail &&
    'selfEvaluation' in detail &&
    !('promotionReason' in detail)
  )
}

const isTransferApplicationDetail = (
  detail: ApprovalDetailRecord | null,
): detail is TransferApplicationRecord => {
  return !!detail && 'applicationNo' in detail && 'targetDepartment' in detail
}

const isUnpaidLeaveDetail = (
  detail: ApprovalDetailRecord | null,
): detail is UnpaidLeaveApplicationRecord => {
  return (
    !!detail &&
    'applicationNo' in detail &&
    'homeAddress' in detail &&
    'currentAddress' in detail &&
    !('targetDepartment' in detail)
  )
}

const isWorkHandoverDetail = (
  detail: ApprovalDetailRecord | null,
): detail is WorkHandoverRecord => {
  return (
    !!detail && 'deptHandover' in detail && 'financeHandover' in detail && 'hrHandover' in detail
  )
}

const isResignationApprovalDetail = (
  detail: ApprovalDetailRecord | null,
): detail is ResignationApprovalRecord => {
  return (
    !!detail &&
    'leaveType' in detail &&
    'employeeSign' in detail &&
    'departmentHeadSalaryEndDate' in detail &&
    'hrSalaryEndDate' in detail &&
    !('deptHandover' in detail) &&
    !('homeAddress' in detail)
  )
}

const getDetailItemTime = (item: ApprovalCenterItem | ApprovalHistoryItem) => {
  return 'submittedAt' in item ? item.submittedAt : item.updatedAt
}

const getDetailItemDescription = (item: ApprovalCenterItem | ApprovalHistoryItem) => {
  return 'description' in item ? item.description : item.title
}

const ApprovalCenterPage: React.FC = () => {
  const { message } = App.useApp()
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<ApprovalCenterItem[]>([])
  const [historyItems, setHistoryItems] = useState<ApprovalHistoryItem[]>([])
  const [notificationItems, setNotificationItems] = useState<ApprovalNotificationItem[]>([])
  const [activeTab, setActiveTab] = useState<ApprovalTabKey>('pending')
  const [typeFilter, setTypeFilter] = useState<ApprovalCenterItem['type'] | undefined>()
  const [keyword, setKeyword] = useState('')
  const [notificationKeyword, setNotificationKeyword] = useState('')
  const [counts, setCounts] = useState({
    total: 0,
    appointmentInterview: 0,
    recruitment: 0,
    trainingApplication: 0,
    regularization: 0,
    promotion: 0,
    socialInsurance: 0,
    transferApplication: 0,
    unpaidLeave: 0,
    workHandover: 0,
    resignationApproval: 0,
    transfer: 0,
    export: 0,
    notifications: 0,
  })
  const [refreshVersion, setRefreshVersion] = useState(0)
  const [actionState, setActionState] = useState<ApprovalActionState>({
    open: false,
    type: 'approve',
    item: null,
    detail: null,
  })
  const [actionComment, setActionComment] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [transferConsultantOptions, setTransferConsultantOptions] = useState<
    ConsultantTransferConsultantInfo[]
  >([])
  const [selectedTransferConsultant, setSelectedTransferConsultant] = useState<string>()
  const [socialInsuranceHrFields, setSocialInsuranceHrFields] = useState({
    hrPaymentContent: '',
    hrPaymentBase: undefined as number | undefined,
    hrStartDate: null as Dayjs | null,
    hrInsurancePlace: '',
  })
  const [resignationSalaryEndDate, setResignationSalaryEndDate] = useState<Dayjs | null>(null)
  const [detailState, setDetailState] = useState<DetailState>({
    open: false,
    loading: false,
    item: null,
    detail: null,
  })

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [summary, history, notifications] = await Promise.all([
        getApprovalCenterSummary(),
        getApprovalHistoryItems(),
        listApprovalNotifications(),
      ])
      setItems(summary.items)
      setHistoryItems(history)
      setNotificationItems(notifications)
      setCounts({
        total: summary.total,
        appointmentInterview: summary.appointmentInterviewCount,
        recruitment: summary.recruitmentCount,
        trainingApplication: summary.trainingApplicationCount,
        regularization: summary.regularizationCount,
        promotion: summary.promotionCount,
        socialInsurance: summary.socialInsuranceCount,
        transferApplication: summary.transferApplicationCount,
        unpaidLeave: summary.unpaidLeaveCount,
        workHandover: summary.workHandoverCount,
        resignationApproval: summary.resignationApprovalCount,
        transfer: summary.transferCount,
        export: summary.exportCount,
        notifications: notifications.filter((item) => !item.isRead).length,
      })
      window.dispatchEvent(
        new CustomEvent('approval-center:updated', {
          detail: {
            total: summary.total,
            notificationCount: notifications.filter((item) => !item.isRead).length,
          },
        }),
      )
      setRefreshVersion((value) => value + 1)
    } catch (error: unknown) {
      console.error('加载审批中心失败', error)
      message.error(getErrorMessage(error, '加载审批中心失败'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    const unsubscribe = subscribeApprovalReminderSummary(loadData, loadData)
    return () => {
      unsubscribe()
    }
  }, [loadData])

  useEffect(() => {
    const refreshOpenDetail = async () => {
      if (!detailState.open || !detailState.item) return
      if (
        ![
          'appointment_interview',
          'recruitment',
          'training_application',
          'regularization',
          'promotion',
          'social_insurance',
          'transfer_application',
          'unpaid_leave',
          'work_handover',
          'resignation_approval',
        ].includes(detailState.item.type)
      ) {
        return
      }
      try {
        const detail = await getApprovalCenterDetail({
          type: detailState.item.type as
            | 'appointment_interview'
            | 'recruitment'
            | 'training_application'
            | 'regularization'
            | 'promotion'
            | 'social_insurance'
            | 'transfer_application'
            | 'unpaid_leave'
            | 'work_handover'
            | 'resignation_approval',
          rawId: detailState.item.rawId,
        })
        setDetailState((prev) =>
          prev.open && prev.item?.rawId === detailState.item?.rawId
            ? { ...prev, loading: false, detail }
            : prev,
        )
      } catch (error) {
        console.error('刷新审批详情失败', error)
      }
    }

    refreshOpenDetail()
  }, [detailState.item, detailState.open, refreshVersion])

  useEffect(() => {
    const loadTransferConsultantOptions = async () => {
      if (
        !actionState.open ||
        actionState.type !== 'approve' ||
        actionState.item?.type !== 'transfer'
      ) {
        setTransferConsultantOptions([])
        return
      }
      try {
        const consultants = await listTransferConsultants(actionState.item.campus || undefined)
        setTransferConsultantOptions(consultants)
      } catch (error) {
        console.error('加载目标咨询师失败', error)
        setTransferConsultantOptions([])
      }
    }

    loadTransferConsultantOptions()
  }, [actionState])

  const filteredItems = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase()
    return items.filter((item) => {
      const hitType = !typeFilter || item.type === typeFilter
      const hitKeyword =
        !normalizedKeyword ||
        [item.title, item.applicant, item.campus, item.department, item.description]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedKeyword))
      return hitType && hitKeyword
    })
  }, [items, keyword, typeFilter])

  const filteredHistoryItems = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase()
    return historyItems.filter((item) => {
      const hitType = !typeFilter || item.type === typeFilter
      const hitKeyword =
        !normalizedKeyword ||
        [
          item.requestNo,
          item.title,
          item.applicant,
          item.campus,
          item.department,
          item.statusLabel,
          item.currentStageLabel,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedKeyword))
      return hitType && hitKeyword
    })
  }, [historyItems, keyword, typeFilter])

  const filteredNotificationItems = useMemo(() => {
    const normalizedKeyword = notificationKeyword.trim().toLowerCase()
    return notificationItems.filter((item) => {
      if (!normalizedKeyword) return true
      return [item.title, item.content, item.requestNo, item.actionByName]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedKeyword))
    })
  }, [notificationItems, notificationKeyword])

  const openDetailModal = useCallback(async (item: ApprovalCenterItem | ApprovalHistoryItem) => {
    setDetailState({ open: true, loading: true, item, detail: null })
    if (
      ![
        'appointment_interview',
        'recruitment',
        'training_application',
        'regularization',
        'promotion',
        'social_insurance',
        'transfer_application',
        'unpaid_leave',
        'work_handover',
        'resignation_approval',
      ].includes(item.type)
    ) {
      setDetailState({ open: true, loading: false, item, detail: null })
      return
    }
    try {
      const detail = await getApprovalCenterDetail({
        type: item.type as
          | 'appointment_interview'
          | 'recruitment'
          | 'training_application'
          | 'regularization'
          | 'promotion'
          | 'social_insurance'
          | 'transfer_application'
          | 'unpaid_leave'
          | 'work_handover'
          | 'resignation_approval',
        rawId: item.rawId,
      })
      setDetailState({ open: true, loading: false, item, detail })
    } catch (error: unknown) {
      message.error(getErrorMessage(error, '加载审批详情失败'))
      setDetailState({ open: false, loading: false, item: null, detail: null })
    }
  }, [])

  const openActionModal = async (type: 'approve' | 'reject', item: ApprovalCenterItem) => {
    setActionComment(type === 'approve' ? '通过' : '')
    setSelectedTransferConsultant(undefined)
    setSocialInsuranceHrFields({
      hrPaymentContent: '',
      hrPaymentBase: undefined,
      hrStartDate: null,
      hrInsurancePlace: '',
    })
    setResignationSalaryEndDate(null)

    if (item.type === 'social_insurance' || item.type === 'resignation_approval') {
      try {
        const detail = await getApprovalCenterDetail({
          type: item.type,
          rawId: item.rawId,
        })
        setActionState({ open: true, type, item, detail })
      } catch (error: unknown) {
        message.error(getErrorMessage(error, '加载审批详情失败'))
      }
      return
    }

    setActionState({ open: true, type, item, detail: null })
  }

  const handleMarkNotificationRead = useCallback(
    async (notification: ApprovalNotificationItem, options?: { silent?: boolean }) => {
      try {
        await markApprovalNotificationReadWithBiz(notification.id, notification.bizType)
        if (!options?.silent) {
          message.success('通知已标记为已读')
        }
        await loadData()
      } catch (error: unknown) {
        message.error(getErrorMessage(error, '标记通知失败'))
      }
    },
    [loadData],
  )

  const handleOpenNotificationDetail = useCallback(
    async (notification: ApprovalNotificationItem) => {
      if (!notification.isRead) {
        await handleMarkNotificationRead(notification, { silent: true })
      }
      await openDetailModal({
        id: `${notification.bizType}-${notification.requestId}`,
        type: notification.bizType,
        rawId: notification.requestId,
        requestNo: notification.requestNo,
        title: notification.title,
        applicant: '',
        campus: null,
        department: null,
        status: '',
        statusLabel: '',
        currentStageLabel: notification.stageLabel,
        updatedAt: notification.createdAt,
      })
    },
    [handleMarkNotificationRead, openDetailModal],
  )

  const handleMarkAllNotificationsRead = async () => {
    try {
      await markAllApprovalNotificationsRead()
      message.success('审批通知已全部标记为已读')
      await loadData()
    } catch (error: unknown) {
      message.error(getErrorMessage(error, '操作失败'))
    }
  }

  const handleActionSubmit = async () => {
    if (!actionState.item) return
    if (actionState.type === 'reject' && !actionComment.trim()) {
      message.warning('驳回时请填写审批意见')
      return
    }
    if (
      actionState.item.type === 'transfer' &&
      actionState.type === 'approve' &&
      !selectedTransferConsultant
    ) {
      message.warning('请选择目标咨询师')
      return
    }
    if (
      actionState.item.type === 'social_insurance' &&
      actionState.type === 'approve' &&
      isSocialInsuranceDetail(actionState.detail) &&
      actionState.detail.currentStage === 'hr'
    ) {
      if (
        !socialInsuranceHrFields.hrPaymentContent.trim() ||
        socialInsuranceHrFields.hrPaymentBase == null ||
        !socialInsuranceHrFields.hrStartDate ||
        !socialInsuranceHrFields.hrInsurancePlace.trim()
      ) {
        message.warning('人事部通过时请完整填写缴费内容、缴费基数、缴费起始日期和社保办理地')
        return
      }
    }

    try {
      setActionLoading(true)
      if (actionState.type === 'approve') {
        await approveApprovalCenterItem(actionState.item, actionComment.trim() || undefined, {
          targetConsultant: selectedTransferConsultant,
          resignationApprovalPayload:
            actionState.item.type === 'resignation_approval'
              ? {
                  comment: actionComment.trim() || undefined,
                  salaryEndDate: resignationSalaryEndDate
                    ? resignationSalaryEndDate.format('YYYY-MM-DD')
                    : undefined,
                }
              : undefined,
          socialInsurancePayload:
            actionState.item.type === 'social_insurance'
              ? {
                  comment: actionComment.trim() || undefined,
                  hrPaymentContent: socialInsuranceHrFields.hrPaymentContent || undefined,
                  hrPaymentBase: socialInsuranceHrFields.hrPaymentBase,
                  hrStartDate: socialInsuranceHrFields.hrStartDate
                    ? socialInsuranceHrFields.hrStartDate.format('YYYY-MM-DD')
                    : undefined,
                  hrInsurancePlace: socialInsuranceHrFields.hrInsurancePlace || undefined,
                }
              : undefined,
        })
        message.success('审批已通过')
      } else {
        await rejectApprovalCenterItem(actionState.item, actionComment.trim())
        message.success('审批已驳回')
      }
      setActionState({ open: false, type: 'approve', item: null, detail: null })
      await loadData()
    } catch (error: unknown) {
      console.error('审批操作失败', error)
      message.error(getErrorMessage(error, '审批操作失败'))
    } finally {
      setActionLoading(false)
    }
  }

  const pendingColumns: ColumnsType<ApprovalCenterItem> = [
    {
      title: '审批类型',
      dataIndex: 'type',
      width: 120,
      render: (value: ApprovalCenterItem['type']) => (
        <Tag color="blue">{TYPE_LABEL_MAP[value]}</Tag>
      ),
    },
    {
      title: '事项标题',
      dataIndex: 'title',
      width: 260,
    },
    {
      title: '申请人',
      dataIndex: 'applicant',
      width: 120,
    },
    {
      title: '神殿/部门',
      width: 180,
      render: (_, record) => `${record.campus || '-'} / ${record.department || '-'}`,
    },
    {
      title: '说明',
      dataIndex: 'description',
      ellipsis: true,
    },
    {
      title: '提交时间',
      dataIndex: 'submittedAt',
      width: 180,
    },
    {
      title: '操作',
      width: 240,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => openDetailModal(record)}>
            详情
          </Button>
          <Button
            size="small"
            type="primary"
            icon={<CheckOutlined />}
            onClick={() => openActionModal('approve', record)}
          >
            通过
          </Button>
          <Button
            size="small"
            danger
            icon={<CloseOutlined />}
            onClick={() => openActionModal('reject', record)}
          >
            驳回
          </Button>
        </Space>
      ),
    },
  ]

  const historyColumns: ColumnsType<ApprovalHistoryItem> = [
    {
      title: '类型',
      dataIndex: 'type',
      width: 120,
      render: (value: ApprovalHistoryItem['type']) => (
        <Tag color="blue">{TYPE_LABEL_MAP[value]}</Tag>
      ),
    },
    {
      title: '申请单号',
      dataIndex: 'requestNo',
      width: 220,
    },
    {
      title: '事项标题',
      dataIndex: 'title',
      width: 240,
    },
    {
      title: '申请人',
      dataIndex: 'applicant',
      width: 120,
    },
    {
      title: '神殿/部门',
      width: 180,
      render: (_, record) => `${record.campus || '-'} / ${record.department || '-'}`,
    },
    {
      title: '状态',
      width: 120,
      render: (_, record) => {
        const color =
          record.status === 'approved'
            ? 'success'
            : record.status === 'rejected'
              ? 'error'
              : 'processing'
        return <Tag color={color}>{record.statusLabel}</Tag>
      },
    },
    {
      title: '当前阶段',
      dataIndex: 'currentStageLabel',
      width: 140,
      render: (value) => value || '-',
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      width: 180,
    },
    {
      title: '操作',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Button size="small" icon={<EyeOutlined />} onClick={() => openDetailModal(record)}>
          详情
        </Button>
      ),
    },
  ]

  const notificationColumns: ColumnsType<ApprovalNotificationItem> = [
    {
      title: '状态',
      dataIndex: 'isRead',
      width: 100,
      render: (value: boolean) => (
        <Tag color={value ? 'default' : 'red'}>{value ? '已读' : '未读'}</Tag>
      ),
    },
    {
      title: '类型',
      dataIndex: 'bizType',
      width: 120,
      render: (value: ApprovalNotificationItem['bizType']) => (
        <Tag color="blue">{TYPE_LABEL_MAP[value]}</Tag>
      ),
    },
    {
      title: '通知标题',
      dataIndex: 'title',
      width: 240,
    },
    {
      title: '内容',
      dataIndex: 'content',
      ellipsis: true,
    },
    {
      title: '申请单号',
      dataIndex: 'requestNo',
      width: 220,
    },
    {
      title: '发送时间',
      dataIndex: 'createdAt',
      width: 180,
    },
    {
      title: '操作',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleOpenNotificationDetail(record)}
          >
            详情
          </Button>
          {!record.isRead ? (
            <Button size="small" onClick={() => handleMarkNotificationRead(record)}>
              已读
            </Button>
          ) : null}
        </Space>
      ),
    },
  ]

  const renderAppointmentInterviewDetail = (detail: AppointmentInterviewRecord) => (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Descriptions
        bordered
        size="small"
        column={2}
        items={[
          {
            key: 'recordNo',
            label: '记录单号',
            children: `RMFT${String(detail.id).padStart(6, '0')}`,
          },
          { key: 'status', label: '状态', children: detail.statusLabel },
          { key: 'campus', label: '所属神殿', children: detail.campus || '-' },
          {
            key: 'creator',
            label: '申请人',
            children: detail.createdByName || detail.interviewer || '-',
          },
          { key: 'interviewer', label: '访谈人员', children: detail.interviewer },
          { key: 'interviewee', label: '被访谈人员', children: detail.interviewee },
          { key: 'interviewDate', label: '访谈时间', children: detail.interviewDate },
          { key: 'location', label: '访谈地点', children: detail.location || '-' },
          {
            key: 'selfSign',
            label: '本人签字',
            children: `${detail.selfSign.signer || '-'} / ${detail.selfSign.signDate || '-'}`,
            span: 2,
          },
          {
            key: 'answers',
            label: '访谈内容',
            children: detail.answers.filter(Boolean).join('\n\n') || '-',
            span: 2,
          },
          {
            key: 'suggestions',
            label: '对集团/神殿的建议',
            children: detail.suggestions || '-',
            span: 2,
          },
          {
            key: 'opinionResults',
            label: '审批结果',
            children: `校长：${detail.principalPassed == null ? '待处理' : detail.principalPassed ? '通过' : '未通过'} / 人资：${detail.hrPassed == null ? '待处理' : detail.hrPassed ? '通过' : '未通过'} / 董事长：${detail.chairmanPassed == null ? '待处理' : detail.chairmanPassed ? '通过' : '未通过'}`,
            span: 2,
          },
          {
            key: 'currentApprovers',
            label: '当前审批人',
            children: detail.currentApprovers.length
              ? detail.currentApprovers.map((item) => item.name).join('、')
              : '-',
            span: 2,
          },
          {
            key: 'currentStage',
            label: '当前审批阶段',
            children: detail.currentStageLabel || '-',
            span: 2,
          },
          {
            key: 'principalOpinion',
            label: '校长意见',
            children: detail.principalApproval.opinion || '-',
            span: 2,
          },
          {
            key: 'hrOpinion',
            label: '人资意见',
            children: detail.hrApproval.opinion || '-',
            span: 2,
          },
          {
            key: 'chairmanOpinion',
            label: '董事长意见',
            children: detail.chairmanApproval.opinion || '-',
            span: 2,
          },
          {
            key: 'rejectionReason',
            label: '驳回原因',
            children: detail.rejectionReason || '-',
            span: 2,
          },
        ]}
      />
      {renderFlowCards(detail.approvalFlow, detail.approvalActions)}
    </Space>
  )

  const renderRecruitmentDetail = (detail: RecruitmentRequestRecord) => (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Descriptions
        bordered
        size="small"
        column={2}
        items={[
          { key: 'requestNo', label: '申请单号', children: detail.requestNo },
          { key: 'status', label: '状态', children: detail.statusLabel },
          { key: 'campus', label: '神殿', children: detail.campus || '-' },
          { key: 'creator', label: '申请人', children: detail.createdByName || '-' },
          { key: 'department', label: '申请部门', children: detail.department },
          { key: 'position', label: '申请职位', children: detail.position },
          { key: 'headcount', label: '申请人数', children: `${detail.headcount}人` },
          { key: 'reason', label: '申请原因', children: detail.reason },
          { key: 'applyDate', label: '申请日期', children: detail.applyDate },
          { key: 'expectedDate', label: '希望到职日期', children: detail.expectedDate },
          { key: 'gender', label: '性别要求', children: detail.gender || '-' },
          { key: 'education', label: '学历要求', children: detail.education || '-' },
          { key: 'age', label: '年龄要求', children: detail.age || '-' },
          { key: 'marital', label: '婚否要求', children: detail.maritalStatus || '-' },
          { key: 'major', label: '专业要求', children: detail.major || '-', span: 2 },
          { key: 'skills', label: '技能及经验', children: detail.skillsExperience || '-', span: 2 },
          {
            key: 'responsibilities',
            label: '岗位职责',
            children: detail.jobResponsibilities || '-',
            span: 2,
          },
          {
            key: 'analysis',
            label: '分析及增员理由',
            children: detail.analysisAndReason || '-',
            span: 2,
          },
          {
            key: 'approvers',
            label: '当前审批人',
            children: detail.currentApprovers.length
              ? detail.currentApprovers.map((item) => item.name).join('、')
              : '-',
            span: 2,
          },
          {
            key: 'currentStage',
            label: '当前审批阶段',
            children: detail.currentStageLabel || '-',
            span: 2,
          },
        ]}
      />
      {renderFlowCards(detail.approvalFlow, detail.approvalActions)}
    </Space>
  )

  const renderSocialInsuranceDetail = (detail: SocialInsuranceApplicationRecord) => {
    const isDirectChairmanFlow =
      detail.approvalFlow.length === 1 && detail.approvalFlow[0]?.stage === 'chairman'
    return (
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Descriptions
          bordered
          size="small"
          column={2}
          items={[
            { key: 'applicationNo', label: '申请单号', children: detail.applicationNo },
            { key: 'status', label: '状态', children: detail.statusLabel },
            { key: 'campus', label: '所属神殿', children: detail.campus },
            { key: 'creator', label: '申请人', children: detail.createdByName || '-' },
            { key: 'fillDate', label: '填单日期', children: detail.fillDate },
            { key: 'accountNo', label: '户号', children: detail.accountNo || '-' },
            { key: 'name', label: '姓名', children: detail.name },
            { key: 'department', label: '部门', children: detail.department },
            { key: 'position', label: '职位', children: detail.position },
            { key: 'phone', label: '手机号', children: detail.phone },
            { key: 'idNumber', label: '身份证号', children: detail.idNumber, span: 2 },
            { key: 'householdType', label: '户口性质', children: detail.householdType },
            { key: 'idExpiry', label: '身份证有效期', children: detail.idExpiry },
            { key: 'hireDate', label: '入职时间', children: detail.hireDate },
            { key: 'insuranceType', label: '缴费类型', children: detail.insuranceType },
            {
              key: 'registeredAddress',
              label: '户籍所在地',
              children: detail.registeredAddress,
              span: 2,
            },
            { key: 'prevPlace', label: '原缴费地', children: detail.prevPaymentPlace || '-' },
            { key: 'prevType', label: '原缴费类型', children: detail.prevPaymentType || '-' },
            {
              key: 'prevBase',
              label: '原缴费基数',
              children: detail.prevPaymentBase != null ? String(detail.prevPaymentBase) : '-',
            },
            {
              key: 'approvers',
              label: '当前审批人',
              children: detail.currentApprovers.length
                ? detail.currentApprovers.map((item) => item.name).join('、')
                : '-',
              span: 2,
            },
            {
              key: 'currentStage',
              label: '当前审批阶段',
              children: detail.currentStageLabel || '-',
              span: 2,
            },
            ...(isDirectChairmanFlow
              ? []
              : [
                  {
                    key: 'hrPaymentContent',
                    label: '人事部缴费内容',
                    children: detail.hrPaymentContent || '-',
                    span: 2,
                  },
                  {
                    key: 'hrFinance',
                    label: '人事部办理信息',
                    children: `缴费基数：${detail.hrPaymentBase ?? '-'} / 缴费起始日期：${detail.hrStartDate || '-'} / 社保办理地：${detail.hrInsurancePlace || '-'}`,
                    span: 2,
                  },
                ]),
            { key: 'remark', label: '备注', children: detail.remark || '-', span: 2 },
            {
              key: 'rejectionReason',
              label: '驳回原因',
              children: detail.rejectionReason || '-',
              span: 2,
            },
          ]}
        />
        {renderFlowCards(detail.approvalFlow, detail.approvalActions)}
      </Space>
    )
  }

  const renderRegularizationDetail = (detail: RegularizationApplicationRecord) => (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      {(() => {
        const flowStageSet = new Set(detail.approvalFlow.map((item) => item.stage))
        const hasDepartmentHeadStage = flowStageSet.has('department_head')
        const hasVicePrincipalStage = flowStageSet.has('vice_principal')
        const hasPrincipalStage = flowStageSet.has('principal')
        const hasHrStage = flowStageSet.has('hr')
        const hasChairmanStage = flowStageSet.has('chairman')

        return (
          <Descriptions
            bordered
            size="small"
            column={2}
            items={[
          { key: 'applicationNo', label: '申请单号', children: detail.applicationNo },
          { key: 'status', label: '状态', children: detail.statusLabel },
          { key: 'campus', label: '所属神殿', children: detail.campus || '-' },
          { key: 'creator', label: '申请人', children: detail.createdByName || '-' },
          { key: 'fillDate', label: '填表日期', children: detail.fillDate },
          { key: 'name', label: '姓名', children: detail.name },
          { key: 'department', label: '所在部门', children: detail.department },
          { key: 'position', label: '试用岗位', children: detail.position },
          { key: 'gender', label: '性别', children: detail.gender || '-' },
          { key: 'entryDate', label: '入职时间', children: detail.entryDate },
          {
            key: 'probationRange',
            label: '试用期',
            children: `${detail.probationStart} 至 ${detail.probationEnd}`,
            span: 2,
          },
          {
            key: 'salary',
            label: '薪资信息',
            children: `试用期工资：${detail.probationSalary ?? '-'} / 转正工资：${detail.regularSalary ?? '-'}`,
            span: 2,
          },
          { key: 'mainWork', label: '试用期主要工作', children: detail.mainWork || '-', span: 2 },
          { key: 'suggestion', label: '对学校建议', children: detail.suggestion || '-', span: 2 },
          {
            key: 'selfEvaluation',
            label: '自我鉴定',
            children: detail.selfEvaluation || '-',
            span: 2,
          },
          {
            key: 'opinionResults',
            label: '审批结果',
            children: [
              hasDepartmentHeadStage
                ? `部门负责人：${detail.departmentHeadPassed == null ? '待处理' : detail.departmentHeadPassed ? '通过' : '未通过'}`
                : null,
              hasVicePrincipalStage
                ? `副校长：${detail.vicePrincipalPassed == null ? '待处理' : detail.vicePrincipalPassed ? '通过' : '未通过'}`
                : null,
              hasPrincipalStage
                ? `校长：${detail.principalPassed == null ? '待处理' : detail.principalPassed ? '通过' : '未通过'}`
                : null,
              hasHrStage
                ? `集团人力资源部：${detail.hrPassed == null ? '待处理' : detail.hrPassed ? '通过' : '未通过'}`
                : null,
              hasChairmanStage
                ? `董事长：${detail.chairmanPassed == null ? '待处理' : detail.chairmanPassed ? '通过' : '未通过'}`
                : null,
            ]
              .filter(Boolean)
              .join(' / '),
            span: 2,
          },
          {
            key: 'currentApprovers',
            label: '当前审批人',
            children: detail.currentApprovers.length
              ? detail.currentApprovers.map((item) => item.name).join('、')
              : '-',
            span: 2,
          },
          {
            key: 'currentStage',
            label: '当前审批阶段',
            children: detail.currentStageLabel || '-',
            span: 2,
          },
          ...(hasDepartmentHeadStage
            ? [
                {
                  key: 'deptOpinion',
                  label: '部门负责人意见',
                  children: detail.departmentHeadOpinion || '-',
                  span: 2,
                },
              ]
            : []),
          ...(hasVicePrincipalStage
            ? [
                {
                  key: 'vicePrincipalOpinion',
                  label: '副校长意见',
                  children: detail.vicePrincipalOpinion || '-',
                  span: 2,
                },
              ]
            : []),
          ...(hasPrincipalStage
            ? [
                {
                  key: 'principalOpinion',
                  label: '校长意见',
                  children: detail.principalOpinion || '-',
                  span: 2,
                },
              ]
            : []),
          ...(hasHrStage
            ? [
                {
                  key: 'hrOpinion',
                  label: '集团人力资源部意见',
                  children: detail.hrOpinion || '-',
                  span: 2,
                },
              ]
            : []),
          ...(hasChairmanStage
            ? [
                {
                  key: 'chairmanOpinion',
                  label: '董事长意见',
                  children: detail.chairmanOpinion || '-',
                  span: 2,
                },
              ]
            : []),
          {
            key: 'rejectionReason',
            label: '驳回原因',
            children: detail.rejectionReason || '-',
            span: 2,
          },
        ]}
          />
        )
      })()}
      {renderFlowCards(detail.approvalFlow, detail.approvalActions)}
    </Space>
  )

  const renderTrainingApplicationDetail = (detail: TrainingApplicationRecord) => {
    const hasStage = (stage: string) => detail.approvalFlow.some((item) => item.stage === stage)
    const approvalResults = [
      hasStage('department_head')
        ? `部门负责人：${detail.departmentHeadPassed == null ? '待处理' : detail.departmentHeadPassed ? '通过' : '未通过'}`
        : null,
      hasStage('principal')
        ? `校长：${detail.principalPassed == null ? '待处理' : detail.principalPassed ? '通过' : '未通过'}`
        : null,
      hasStage('group_department')
        ? `集团主管部门：${detail.groupDepartmentPassed == null ? '待处理' : detail.groupDepartmentPassed ? '通过' : '未通过'}`
        : null,
      hasStage('hr')
        ? `人资：${detail.hrPassed == null ? '待处理' : detail.hrPassed ? '通过' : '未通过'}`
        : null,
      hasStage('chairman')
        ? `董事长：${detail.chairmanPassed == null ? '待处理' : detail.chairmanPassed ? '通过' : '未通过'}`
        : null,
    ]
      .filter(Boolean)
      .join(' / ')

    return (
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Descriptions
          bordered
          size="small"
          column={2}
          items={[
            { key: 'applicationNo', label: '申请单号', children: detail.applicationNo },
            { key: 'status', label: '状态', children: detail.statusLabel },
            { key: 'campus', label: '神殿', children: detail.campus || '-' },
            { key: 'department', label: '部门', children: detail.department },
            { key: 'creator', label: '申请人', children: detail.createdByName || '-' },
            { key: 'category', label: '培训类别', children: detail.category },
            { key: 'trainees', label: '培训对象', children: detail.trainees, span: 2 },
            { key: 'objective', label: '培训目标', children: detail.objective, span: 2 },
            { key: 'content', label: '培训内容', children: detail.content, span: 2 },
            { key: 'dateRange', label: '培训时间', children: `${detail.startDate} 至 ${detail.endDate}` },
            { key: 'totalHours', label: '总课时', children: `${detail.totalHours}课时` },
            { key: 'format', label: '培训形式', children: detail.format },
            { key: 'examMethod', label: '考核方式', children: detail.examMethod },
            { key: 'trainer', label: '培训讲师', children: detail.trainer || '-' },
            {
              key: 'expectedPassRate',
              label: '预计通过率',
              children:
                detail.expectedPassRate == null ? '-' : `${Number(detail.expectedPassRate)}%`,
            },
            { key: 'costPerPerson', label: '人均费用', children: `¥${Number(detail.costPerPerson)}` },
            { key: 'costCount', label: '培训人数', children: `${detail.costCount}人` },
            { key: 'costTotal', label: '培训费用', children: `¥${Number(detail.costTotal)}` },
            { key: 'costOther', label: '其他费用', children: `¥${Number(detail.costOther)}` },
            {
              key: 'flags',
              label: '审批规则标记',
              children: `${detail.isInternalTraining ? '神殿内部培训' : '外部培训'} / ${detail.isKeyStaffTraining ? '干部及骨干员工培训' : '普通培训'}`,
              span: 2,
            },
            {
              key: 'approvalResults',
              label: '审批结果',
              children: approvalResults || '-',
              span: 2,
            },
            {
              key: 'currentApprovers',
              label: '当前审批人',
              children: detail.currentApprovers.length
                ? detail.currentApprovers.map((item) => item.name).join('、')
                : '-',
              span: 2,
            },
            {
              key: 'currentStage',
              label: '当前审批阶段',
              children: detail.currentStageLabel || '-',
              span: 2,
            },
            { key: 'remark', label: '备注', children: detail.remark || '-', span: 2 },
            {
              key: 'rejectionReason',
              label: '驳回原因',
              children: detail.rejectionReason || '-',
              span: 2,
            },
          ]}
        />
        {renderFlowCards(detail.approvalFlow, detail.approvalActions)}
      </Space>
    )
  }

  const renderPromotionDetail = (detail: PromotionApplicationRecord) => {
    const hasPrincipalStage = detail.approvalFlow.some((item) => item.stage === 'principal')
    return (
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Descriptions
          bordered
          size="small"
          column={2}
          items={[
            { key: 'applicationNo', label: '申请单号', children: detail.applicationNo },
            { key: 'status', label: '状态', children: detail.statusLabel },
            { key: 'campus', label: '所属神殿', children: detail.campus || '-' },
            { key: 'creator', label: '申请人', children: detail.createdByName || '-' },
            { key: 'fillDate', label: '填表日期', children: detail.fillDate },
            { key: 'name', label: '姓名', children: detail.name },
            { key: 'nativePlace', label: '籍贯', children: detail.nativePlace || '-' },
            { key: 'age', label: '年龄', children: detail.age ?? '-' },
            { key: 'entryDate', label: '入职时间', children: detail.entryDate },
            { key: 'department', label: '所在部门', children: detail.department },
            { key: 'position', label: '当前岗位', children: detail.position },
            {
              key: 'salary',
              label: '薪酬调整',
              children: `原职级：${detail.originalLevel || '-'} / 原薪资标准：${detail.originalSalary ?? '-'} / 晋升职级：${detail.promotedLevel || '-'} / 晋升后薪资标准：${detail.promotedSalary ?? '-'} / 基础薪资：${detail.promotedBaseSalary ?? '-'} / 绩效薪资：${detail.promotedPerformanceSalary ?? '-'}`,
              span: 2,
            },
            {
              key: 'workOverview',
              label: '工作概况',
              children: detail.workOverview || '-',
              span: 2,
            },
            {
              key: 'promotionReason',
              label: '晋升理由',
              children: detail.promotionReason || '-',
              span: 2,
            },
            {
              key: 'confidence',
              label: '晋升信心与期望',
              children: detail.confidenceAndExpectation || '-',
              span: 2,
            },
            {
              key: 'opinionResults',
              label: '审批结果',
              children: `部门主管：${detail.departmentManagerPassed == null ? '待处理' : detail.departmentManagerPassed ? '通过' : '未通过'}${hasPrincipalStage ? ` / 校长：${detail.principalPassed == null ? '待处理' : detail.principalPassed ? '通过' : '未通过'}` : ''} / 业务条线总监：${detail.bizDirectorPassed == null ? '待处理' : detail.bizDirectorPassed ? '通过' : '未通过'} / 人资总监：${detail.hrDirectorPassed == null ? '待处理' : detail.hrDirectorPassed ? '通过' : '未通过'} / 董事长：${detail.chairmanPassed == null ? '待处理' : detail.chairmanPassed ? '通过' : '未通过'}`,
              span: 2,
            },
            {
              key: 'currentApprovers',
              label: '当前审批人',
              children: detail.currentApprovers.length
                ? detail.currentApprovers.map((item) => item.name).join('、')
                : '-',
              span: 2,
            },
            {
              key: 'currentStage',
              label: '当前审批阶段',
              children: detail.currentStageLabel || '-',
              span: 2,
            },
            {
              key: 'departmentManagerOpinion',
              label: '部门主管意见',
              children: detail.departmentManagerOpinion || '-',
              span: 2,
            },
            ...(hasPrincipalStage
              ? [
                  {
                    key: 'principalOpinion',
                    label: '校长意见',
                    children: detail.principalOpinion || '-',
                    span: 2,
                  },
                ]
              : []),
            {
              key: 'bizDirectorOpinion',
              label: '业务条线总监意见',
              children: detail.bizDirectorOpinion || '-',
              span: 2,
            },
            {
              key: 'hrDirectorOpinion',
              label: '人资总监意见',
              children: detail.hrDirectorOpinion || '-',
              span: 2,
            },
            {
              key: 'chairmanOpinion',
              label: '董事长意见',
              children: detail.chairmanOpinion || '-',
              span: 2,
            },
            {
              key: 'rejectionReason',
              label: '驳回原因',
              children: detail.rejectionReason || '-',
              span: 2,
            },
          ]}
        />
        {renderFlowCards(detail.approvalFlow, detail.approvalActions)}
      </Space>
    )
  }

  const renderTransferApplicationDetail = (detail: TransferApplicationRecord) => {
    const hasChairmanStage = detail.approvalFlow.some((item) => item.stage === 'chairman')
    return (
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Descriptions
          bordered
          size="small"
          column={2}
          items={[
            { key: 'applicationNo', label: '申请单号', children: detail.applicationNo },
            { key: 'status', label: '状态', children: detail.statusLabel },
            { key: 'campus', label: '所属神殿', children: detail.campus || '-' },
            {
              key: 'creator',
              label: '申请人',
              children: detail.createdByName || detail.applicantName || '-',
            },
            { key: 'applyDate', label: '申请日期', children: detail.applyDate },
            { key: 'name', label: '姓名', children: detail.name },
            { key: 'department', label: '原部门', children: detail.department },
            { key: 'position', label: '原岗位', children: detail.position },
            { key: 'entryDate', label: '入职日期', children: detail.entryDate },
            {
              key: 'salary',
              label: '薪资调整',
              children: `原工资：${detail.originalSalary ?? '-'} / 基础薪资：${detail.newBaseSalary ?? detail.newSalary ?? '-'} / 绩效薪资：${detail.newPerformanceSalary ?? '-'}`,
              span: 2,
            },
            { key: 'targetDepartment', label: '调入部门', children: detail.targetDepartment },
            { key: 'targetPosition', label: '调入岗位', children: detail.targetPosition },
            { key: 'reason', label: '调岗原因', children: detail.reason || '-', span: 2 },
            {
              key: 'opinionResults',
              label: '审批结果',
              children: `调出部门主管：${detail.outDepartmentManagerPassed == null ? '待处理' : detail.outDepartmentManagerPassed ? '通过' : '未通过'} / 人资初审：${detail.hrFirstReviewPassed == null ? '待处理' : detail.hrFirstReviewPassed ? '通过' : '未通过'} / 调入部门：${detail.inDepartmentManagerPassed == null ? '待处理' : detail.inDepartmentManagerPassed ? '通过' : '未通过'} / 业务条线总监：${detail.bizDirectorPassed == null ? '待处理' : detail.bizDirectorPassed ? '通过' : '未通过'} / 人资终审：${detail.hrFinalReviewPassed == null ? '待处理' : detail.hrFinalReviewPassed ? '通过' : '未通过'}${hasChairmanStage ? ` / 董事长：${detail.chairmanPassed == null ? '待处理' : detail.chairmanPassed ? '通过' : '未通过'}` : ''}`,
              span: 2,
            },
            {
              key: 'currentApprovers',
              label: '当前审批人',
              children: detail.currentApprovers.length
                ? detail.currentApprovers.map((item) => item.name).join('、')
                : '-',
              span: 2,
            },
            {
              key: 'currentStage',
              label: '当前审批阶段',
              children: detail.currentStageLabel || '-',
              span: 2,
            },
            {
              key: 'outOpinion',
              label: '调出部门主管意见',
              children: detail.outDepartmentManagerOpinion || '-',
              span: 2,
            },
            {
              key: 'hrFirstOpinion',
              label: '人资初审意见',
              children: detail.hrFirstReviewOpinion || '-',
              span: 2,
            },
            {
              key: 'inOpinion',
              label: '调入部门意见',
              children: detail.inDepartmentManagerOpinion || '-',
              span: 2,
            },
            {
              key: 'bizOpinion',
              label: '业务条线总监意见',
              children: detail.bizDirectorOpinion || '-',
              span: 2,
            },
            {
              key: 'hrFinalOpinion',
              label: '人资终审意见',
              children: detail.hrFinalReviewOpinion || '-',
              span: 2,
            },
            ...(hasChairmanStage
              ? [
                  {
                    key: 'chairmanOpinion',
                    label: '董事长意见',
                    children: detail.chairmanOpinion || '-',
                    span: 2,
                  },
                ]
              : []),
            {
              key: 'rejectionReason',
              label: '驳回原因',
              children: detail.rejectionReason || '-',
              span: 2,
            },
          ]}
        />
        {renderFlowCards(detail.approvalFlow, detail.approvalActions)}
      </Space>
    )
  }

  const renderUnpaidLeaveDetail = (detail: UnpaidLeaveApplicationRecord) => (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Descriptions
        bordered
        size="small"
        column={2}
        items={[
          { key: 'applicationNo', label: '申请单号', children: detail.applicationNo },
          { key: 'status', label: '状态', children: detail.statusLabel },
          { key: 'campus', label: '所属神殿', children: detail.campus || '-' },
          {
            key: 'creator',
            label: '申请人',
            children: detail.createdByName || detail.name || '-',
          },
          { key: 'fillDate', label: '填表日期', children: detail.fillDate },
          { key: 'name', label: '姓名', children: detail.name },
          { key: 'gender', label: '性别', children: detail.gender || '-' },
          { key: 'department', label: '所在部门', children: detail.department },
          { key: 'position', label: '岗位', children: detail.position },
          { key: 'entryDate', label: '入职时间', children: detail.entryDate },
          { key: 'birthDate', label: '出生年月', children: detail.birthDate || '-' },
          { key: 'phone', label: '联系电话', children: detail.phone || '-' },
          { key: 'email', label: '电子邮箱', children: detail.email || '-' },
          { key: 'homeAddress', label: '家庭住址', children: detail.homeAddress || '-', span: 2 },
          {
            key: 'currentAddress',
            label: '现住址',
            children: detail.currentAddress || '-',
            span: 2,
          },
          { key: 'reason', label: '申请理由及期限', children: detail.reason || '-', span: 2 },
          {
            key: 'opinionResults',
            label: '审批结果',
            children: `部门主管：${detail.departmentHeadPassed == null ? '待处理' : detail.departmentHeadPassed ? '通过' : '未通过'} / 业务条线总监：${detail.bizDirectorPassed == null ? '待处理' : detail.bizDirectorPassed ? '通过' : '未通过'} / 人资部：${detail.hrPassed == null ? '待处理' : detail.hrPassed ? '通过' : '未通过'} / 董事长：${detail.chairmanPassed == null ? '待处理' : detail.chairmanPassed ? '通过' : '未通过'}`,
            span: 2,
          },
          {
            key: 'currentApprovers',
            label: '当前审批人',
            children: detail.currentApprovers.length
              ? detail.currentApprovers.map((item) => item.name).join('、')
              : '-',
            span: 2,
          },
          {
            key: 'currentStage',
            label: '当前审批阶段',
            children: detail.currentStageLabel || '-',
            span: 2,
          },
          {
            key: 'departmentHeadOpinion',
            label: '部门主管意见',
            children: detail.departmentHeadOpinion || '-',
            span: 2,
          },
          {
            key: 'bizDirectorOpinion',
            label: '业务条线总监意见',
            children: detail.bizDirectorOpinion || '-',
            span: 2,
          },
          { key: 'hrOpinion', label: '人资部意见', children: detail.hrOpinion || '-', span: 2 },
          {
            key: 'chairmanOpinion',
            label: '董事长意见',
            children: detail.chairmanOpinion || '-',
            span: 2,
          },
          {
            key: 'rejectionReason',
            label: '驳回原因',
            children: detail.rejectionReason || '-',
            span: 2,
          },
        ]}
      />
      {renderFlowCards(detail.approvalFlow, detail.approvalActions)}
    </Space>
  )

  const renderWorkHandoverDetail = (detail: WorkHandoverRecord) => {
    const approvalResults = [
      `部门负责人：${detail.departmentHeadPassed == null ? '待处理' : detail.departmentHeadPassed ? '通过' : '未通过'}`,
      detail.approvalFlow.some((item) => item.stage === 'operations_reviewer')
        ? `最高议事厅运营部总监：${detail.operationsReviewPassed == null ? '待处理' : detail.operationsReviewPassed ? '通过' : '未通过'}`
        : null,
      detail.approvalFlow.some((item) => item.stage === 'academic_reviewer')
        ? `最高议事厅智慧司总监：${detail.academicReviewPassed == null ? '待处理' : detail.academicReviewPassed ? '通过' : '未通过'}`
        : null,
      detail.approvalFlow.some((item) => item.stage === 'teaching_quality_reviewer')
        ? `最高议事厅教化司总监：${detail.teachingQualityReviewPassed == null ? '待处理' : detail.teachingQualityReviewPassed ? '通过' : '未通过'}`
        : null,
      detail.approvalFlow.some((item) => item.stage === 'chairman')
        ? `董事长：${detail.chairmanPassed == null ? '待处理' : detail.chairmanPassed ? '通过' : '未通过'}`
        : null,
    ]
      .filter(Boolean)
      .join(' / ')

    return (
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Descriptions
          bordered
          size="small"
          column={2}
          items={[
            { key: 'applicationNo', label: '申请单号', children: detail.applicationNo },
            { key: 'status', label: '状态', children: detail.statusLabel },
            { key: 'campus', label: '所属神殿', children: detail.campus || '-' },
            {
              key: 'creator',
              label: '申请人',
              children: detail.createdByName || detail.name || '-',
            },
            { key: 'name', label: '姓名', children: detail.name },
            { key: 'department', label: '原部门', children: detail.department },
            { key: 'position', label: '原岗位', children: detail.position },
            { key: 'entryDate', label: '入职时间', children: detail.entryDate || '-' },
            { key: 'leaveDate', label: '离职时间', children: detail.leaveDate },
            { key: 'leaveType', label: '离职类型', children: detail.leaveType || '-' },
            { key: 'phone', label: '联系电话', children: detail.phone || '-' },
            { key: 'email', label: '电子邮箱', children: detail.email || '-' },
            {
              key: 'leaveTypeOther',
              label: '离职类型补充',
              children: detail.leaveTypeOther || '-',
              span: 2,
            },
            {
              key: 'leaveReason',
              label: '离职原因',
              children: detail.leaveReason.length ? detail.leaveReason.join('、') : '-',
              span: 2,
            },
            {
              key: 'leaveReasonOther',
              label: '离职原因补充',
              children: detail.leaveReasonOther || '-',
              span: 2,
            },
            { key: 'address', label: '联系地址', children: detail.address || '-', span: 2 },
            {
              key: 'deptHandover',
              label: '部门交接',
              children: (
                <div style={{ whiteSpace: 'pre-wrap' }}>
                  {[
                    `工作交接：${detail.deptHandover.workHandover || '-'}`,
                    `资料交接：${detail.deptHandover.materialsHandover || '-'}`,
                    `待办事项：${detail.deptHandover.pendingItems || '-'}`,
                    `工作完成：${detail.deptHandover.workCompleted ? '是' : '否'}`,
                    `无遗留问题：${detail.deptHandover.noIssues ? '是' : '否'}`,
                    `部门负责人：${detail.deptHandover.managerSign || '-'} / ${detail.deptHandover.managerDate || '-'}`,
                    `离校工资签字：${detail.deptHandover.salarySign || '-'} / ${detail.deptHandover.salaryDate || '-'}`,
                    `最后出勤：${detail.deptHandover.lastMonth || '-'}月${detail.deptHandover.lastDay || '-'}日`,
                    `接收人：${detail.deptHandover.receiver || '-'} / ${detail.deptHandover.handleDate || '-'}`,
                  ].join('\n')}
                </div>
              ),
              span: 2,
            },
            {
              key: 'financeHandover',
              label: '财务交接',
              children: (
                <div style={{ whiteSpace: 'pre-wrap' }}>
                  {[
                    `是否欠款：${detail.financeHandover.hasDebt ? '是' : '否'}`,
                    `欠款金额：${detail.financeHandover.debtAmount ?? '-'}`,
                    `收据已交：${detail.financeHandover.receiptSubmitted ? '是' : '否'}`,
                    `收据数量：${detail.financeHandover.receiptCount ?? '-'}`,
                    `财务事项：${detail.financeHandover.financeItems || '-'}`,
                    `出纳签字：${detail.financeHandover.cashierSign || '-'} / ${detail.financeHandover.cashierDate || '-'}`,
                    `账目结清：${detail.financeHandover.accountCleared ? '是' : '否'}`,
                    `财务手续办结：${detail.financeHandover.itemsCompleted ? '是' : '否'}`,
                    `负责人：${detail.financeHandover.managerSign || '-'} / ${detail.financeHandover.managerDate || '-'}`,
                  ].join('\n')}
                </div>
              ),
              span: 2,
            },
            {
              key: 'hrHandover',
              label: '人事行政交接',
              children: (
                <div style={{ whiteSpace: 'pre-wrap' }}>
                  {[
                    `固定资产：${detail.hrHandover.fixedAssets || '-'}`,
                    `办公用品：${detail.hrHandover.officeSupplies || '-'}`,
                    `指纹删除：${detail.hrHandover.fingerprint || '-'}`,
                    `保险/档案：${detail.hrHandover.insurance || '-'}`,
                    `接收人：${detail.hrHandover.receiver || '-'} / ${detail.hrHandover.handleDate || '-'}`,
                    `手续完成：${detail.hrHandover.completed ? '是' : '否'}`,
                    `工资是否正常发放：${detail.hrHandover.salaryNormal ? '是' : '否'}`,
                    `工资截止：${detail.hrHandover.salaryEndYear || '-'}年${detail.hrHandover.salaryEndMonth || '-'}月${detail.hrHandover.salaryEndDay || '-'}日`,
                    `负责人：${detail.hrHandover.managerSign || '-'} / ${detail.hrHandover.managerDate || '-'}`,
                  ].join('\n')}
                </div>
              ),
              span: 2,
            },
            {
              key: 'completion',
              label: '手续办理情况',
              children: `全部手续办理完毕：${detail.allCompleted ? '是' : '否'}`,
            },
            {
              key: 'principalSign',
              label: '校长签字',
              children: `${detail.principalSign || '-'} / ${detail.principalDate || '-'}`,
            },
            {
              key: 'opinionResults',
              label: '审批结果',
              children: approvalResults || '-',
              span: 2,
            },
            {
              key: 'currentApprovers',
              label: '当前审批人',
              children: detail.currentApprovers.length
                ? detail.currentApprovers.map((item) => item.name).join('、')
                : '-',
              span: 2,
            },
            {
              key: 'currentStage',
              label: '当前审批阶段',
              children: detail.currentStageLabel || '-',
              span: 2,
            },
            {
              key: 'departmentHeadOpinion',
              label: '部门负责人意见',
              children: detail.departmentHeadOpinion || '-',
              span: 2,
            },
            ...(detail.approvalFlow.some((item) => item.stage === 'operations_reviewer')
              ? [
                  {
                    key: 'operationsReviewOpinion',
                    label: '最高议事厅运营部总监意见',
                    children: detail.operationsReviewOpinion || '-',
                    span: 2,
                  },
                ]
              : []),
            ...(detail.approvalFlow.some((item) => item.stage === 'academic_reviewer')
              ? [
                  {
                    key: 'academicReviewOpinion',
                    label: '最高议事厅智慧司总监意见',
                    children: detail.academicReviewOpinion || '-',
                    span: 2,
                  },
                ]
              : []),
            ...(detail.approvalFlow.some((item) => item.stage === 'teaching_quality_reviewer')
              ? [
                  {
                    key: 'teachingQualityReviewOpinion',
                    label: '最高议事厅教化司总监意见',
                    children: detail.teachingQualityReviewOpinion || '-',
                    span: 2,
                  },
                ]
              : []),
            ...(detail.approvalFlow.some((item) => item.stage === 'chairman')
              ? [
                  {
                    key: 'chairmanOpinion',
                    label: '董事长意见',
                    children: detail.chairmanOpinion || '-',
                    span: 2,
                  },
                ]
              : []),
            {
              key: 'rejectionReason',
              label: '驳回原因',
              children: detail.rejectionReason || '-',
              span: 2,
            },
          ]}
        />
        {renderFlowCards(detail.approvalFlow, detail.approvalActions)}
      </Space>
    )
  }

  const renderResignationApprovalDetail = (detail: ResignationApprovalRecord) => {
    const approvalResults = [
      detail.approvalFlow.some((item) => item.stage === 'department_head')
        ? `部门负责人：${detail.departmentHeadPassed == null ? '待处理' : detail.departmentHeadPassed ? '通过' : '未通过'}`
        : null,
      detail.approvalFlow.some((item) => item.stage === 'hr')
        ? `人力资源部：${detail.hrPassed == null ? '待处理' : detail.hrPassed ? '通过' : '未通过'}`
        : null,
      detail.approvalFlow.some((item) => item.stage === 'principal')
        ? `校长：${detail.principalPassed == null ? '待处理' : detail.principalPassed ? '通过' : '未通过'}`
        : null,
      detail.approvalFlow.some((item) => item.stage === 'operations_reviewer')
        ? `最高议事厅运营部总监：${detail.operationsReviewPassed == null ? '待处理' : detail.operationsReviewPassed ? '通过' : '未通过'}`
        : null,
      detail.approvalFlow.some((item) => item.stage === 'chairman')
        ? `董事长：${detail.chairmanPassed == null ? '待处理' : detail.chairmanPassed ? '通过' : '未通过'}`
        : null,
    ]
      .filter(Boolean)
      .join(' / ')

    return (
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Descriptions
          bordered
          size="small"
          column={2}
          items={[
            { key: 'applicationNo', label: '申请单号', children: detail.applicationNo },
            { key: 'status', label: '状态', children: detail.statusLabel },
            { key: 'campus', label: '所属神殿', children: detail.campus || '-' },
            {
              key: 'creator',
              label: '申请人',
              children: detail.createdByName || detail.name || '-',
            },
            { key: 'fillDate', label: '填表日期', children: detail.fillDate },
            { key: 'name', label: '姓名', children: detail.name },
            { key: 'gender', label: '性别', children: detail.gender || '-' },
            { key: 'department', label: '部门', children: detail.department },
            { key: 'position', label: '岗位', children: detail.position },
            { key: 'entryDate', label: '入职日期', children: detail.entryDate || '-' },
            {
              key: 'contractEndDate',
              label: '合同到期日',
              children: detail.contractEndDate || '-',
            },
            { key: 'leaveDate', label: '离职日期', children: detail.leaveDate },
            { key: 'leaveType', label: '离职种类', children: detail.leaveType || '-' },
            {
              key: 'leaveTypeOther',
              label: '其他说明',
              children: detail.leaveTypeOther || '-',
              span: 2,
            },
            { key: 'reason', label: '离职原因', children: detail.reason || '-', span: 2 },
            {
              key: 'employeeSign',
              label: '员工签字',
              children: `${detail.employeeSign || '-'} / ${detail.employeeSignDate || '-'}`,
              span: 2,
            },
            {
              key: 'approvalResults',
              label: '审批结果',
              children: approvalResults || '-',
              span: 2,
            },
            {
              key: 'departmentHeadOpinion',
              label: '部门负责人意见',
              children: `${detail.departmentHeadOpinion || '-'} / 工资结算至：${detail.departmentHeadSalaryEndDate || '-'}`,
              span: 2,
            },
            {
              key: 'hrOpinion',
              label: '人力资源部意见',
              children: `${detail.hrOpinion || '-'} / 工资结算至：${detail.hrSalaryEndDate || '-'}`,
              span: 2,
            },
            {
              key: 'principalOpinion',
              label: '校长意见',
              children: detail.principalOpinion || '-',
              span: 2,
            },
            ...(detail.approvalFlow.some((item) => item.stage === 'operations_reviewer')
              ? [
                  {
                    key: 'operationsReviewOpinion',
                    label: '最高议事厅运营部总监意见',
                    children: detail.operationsReviewOpinion || '-',
                    span: 2,
                  },
                ]
              : []),
            ...(detail.approvalFlow.some((item) => item.stage === 'chairman')
              ? [
                  {
                    key: 'chairmanOpinion',
                    label: '董事长意见',
                    children: detail.chairmanOpinion || '-',
                    span: 2,
                  },
                ]
              : []),
            {
              key: 'currentApprovers',
              label: '当前审批人',
              children: detail.currentApprovers.length
                ? detail.currentApprovers.map((item) => item.name).join('、')
                : '-',
              span: 2,
            },
            {
              key: 'currentStage',
              label: '当前审批阶段',
              children: detail.currentStageLabel || '-',
              span: 2,
            },
            {
              key: 'rejectionReason',
              label: '驳回原因',
              children: detail.rejectionReason || '-',
              span: 2,
            },
          ]}
        />
        {renderFlowCards(detail.approvalFlow, detail.approvalActions)}
      </Space>
    )
  }

  const renderFlowCards = (
    flow: Array<{
      stageLabel: string
      status: string
      statusLabel: string
      approvers: Array<{ name: string }>
      actedByName?: string | null
      actionLabel?: string | null
      actedAt?: string | null
      comment?: string | null
    }>,
    actions: Array<{
      stageLabel: string
      action: string
      approverName?: string | null
      comment?: string | null
      createdAt: string
    }>,
  ) => (
    <>
      <Card size="small" title="审批流程轨迹">
        <List
          dataSource={flow}
          locale={{ emptyText: '暂无流程轨迹' }}
          renderItem={(item) => {
            const statusColor =
              item.status === 'completed'
                ? 'success'
                : item.status === 'rejected'
                  ? 'error'
                  : item.status === 'current'
                    ? 'processing'
                    : 'default'
            return (
              <List.Item>
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                  <Space wrap>
                    <Tag>{item.stageLabel}</Tag>
                    <Tag color={statusColor}>{item.statusLabel}</Tag>
                    <Text>
                      审批人：
                      {item.approvers.length
                        ? item.approvers.map((approver) => approver.name).join('、')
                        : '未配置'}
                    </Text>
                  </Space>
                  {item.actedByName || item.comment ? (
                    <Text>
                      {item.actedByName ? `处理人：${item.actedByName}` : ''}
                      {item.actionLabel ? `  动作：${item.actionLabel}` : ''}
                      {item.actedAt ? `  时间：${item.actedAt}` : ''}
                      {item.comment?.trim() ? `  意见：${item.comment.trim()}` : ''}
                    </Text>
                  ) : null}
                </Space>
              </List.Item>
            )
          }}
        />
      </Card>
      <Card size="small" title="审批流转记录">
        <List
          dataSource={actions}
          locale={{ emptyText: '暂无审批记录' }}
          renderItem={(item) => {
            const actionColor =
              item.action === 'approve'
                ? 'success'
                : item.action === 'reject'
                  ? 'error'
                  : 'processing'
            const actionLabel =
              item.action === 'approve' ? '通过' : item.action === 'reject' ? '驳回' : '提交'
            return (
              <List.Item>
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                  <Space wrap>
                    <Tag>{item.stageLabel}</Tag>
                    <Tag color={actionColor}>{actionLabel}</Tag>
                    <Text>{item.approverName || '-'}</Text>
                    <Text type="secondary">{item.createdAt}</Text>
                  </Space>
                  <Text>
                    审批意见：
                    {item.comment?.trim() || (item.action === 'submit' ? '提交审批' : '无')}
                  </Text>
                </Space>
              </List.Item>
            )
          }}
        />
      </Card>
    </>
  )

  const renderDetailContent = () => {
    if (!detailState.item) return null
    if (isAppointmentInterviewDetail(detailState.detail)) {
      return renderAppointmentInterviewDetail(detailState.detail)
    }
    if (isRecruitmentDetail(detailState.detail)) {
      return renderRecruitmentDetail(detailState.detail)
    }
    if (isTrainingApplicationDetail(detailState.detail)) {
      return renderTrainingApplicationDetail(detailState.detail)
    }
    if (isPromotionDetail(detailState.detail)) {
      return renderPromotionDetail(detailState.detail)
    }
    if (isRegularizationDetail(detailState.detail)) {
      return renderRegularizationDetail(detailState.detail)
    }
    if (isSocialInsuranceDetail(detailState.detail)) {
      return renderSocialInsuranceDetail(detailState.detail)
    }
    if (isUnpaidLeaveDetail(detailState.detail)) {
      return renderUnpaidLeaveDetail(detailState.detail)
    }
    if (isWorkHandoverDetail(detailState.detail)) {
      return renderWorkHandoverDetail(detailState.detail)
    }
    if (isResignationApprovalDetail(detailState.detail)) {
      return renderResignationApprovalDetail(detailState.detail)
    }
    if (isTransferApplicationDetail(detailState.detail)) {
      return renderTransferApplicationDetail(detailState.detail)
    }
    if (detailState.item.type === 'transfer') {
      return (
        <Descriptions
          bordered
          size="small"
          column={2}
          items={[
            { key: 'title', label: '事项标题', children: detailState.item.title },
            { key: 'applicant', label: '申请人', children: detailState.item.applicant },
            { key: 'campus', label: '目标神殿', children: detailState.item.campus || '-' },
            { key: 'department', label: '部门', children: detailState.item.department || '-' },
            {
              key: 'submittedAt',
              label: '提交时间',
              children: getDetailItemTime(detailState.item),
            },
            {
              key: 'description',
              label: '转量原因',
              children: getDetailItemDescription(detailState.item),
              span: 2,
            },
          ]}
        />
      )
    }
    return (
      <Descriptions
        bordered
        size="small"
        column={2}
        items={[
          { key: 'title', label: '事项标题', children: detailState.item.title },
          { key: 'applicant', label: '申请人', children: detailState.item.applicant },
          { key: 'campus', label: '所属神殿', children: detailState.item.campus || '-' },
          { key: 'department', label: '部门', children: detailState.item.department || '-' },
          {
            key: 'submittedAt',
            label: '提交时间',
            children: getDetailItemTime(detailState.item),
          },
          {
            key: 'description',
            label: '申请原因',
            children: getDetailItemDescription(detailState.item),
            span: 2,
          },
        ]}
      />
    )
  }

  return (
    <div>
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle" gutter={16}>
          <Col>
            <Space>
              <Statistic title="待审批总数" value={counts.total} />
              <Statistic title="任命访谈" value={counts.appointmentInterview} />
              <Statistic title="招聘需求" value={counts.recruitment} />
              <Statistic title="培训申请" value={counts.trainingApplication} />
              <Statistic title="转正申请" value={counts.regularization} />
              <Statistic title="晋升申请" value={counts.promotion} />
              <Statistic title="社保申请" value={counts.socialInsurance} />
              <Statistic title="调岗申请" value={counts.transferApplication} />
              <Statistic title="停薪留职申请" value={counts.unpaidLeave} />
              <Statistic title="工作交接表" value={counts.workHandover} />
              <Statistic title="离职审批单" value={counts.resignationApproval} />
              <Statistic title="跨神殿转量" value={counts.transfer} />
              <Statistic title="咨询量导出" value={counts.export} />
              <Statistic title="未读通知" value={counts.notifications} />
            </Space>
          </Col>
          <Col>
            <Space>
              {activeTab === 'notifications' ? null : (
                <Select
                  allowClear
                  placeholder="按审批类型筛选"
                  style={{ width: 180 }}
                  value={typeFilter}
                  onChange={(value) => setTypeFilter(value)}
                  options={Object.entries(TYPE_LABEL_MAP).map(([value, label]) => ({
                    label,
                    value,
                  }))}
                />
              )}
              <Input
                placeholder={
                  activeTab === 'notifications' ? '搜索标题/内容/单号' : '搜索标题/申请人/神殿/部门'
                }
                style={{ width: 280 }}
                value={activeTab === 'notifications' ? notificationKeyword : keyword}
                onChange={(e) =>
                  activeTab === 'notifications'
                    ? setNotificationKeyword(e.target.value)
                    : setKeyword(e.target.value)
                }
              />
              <Button icon={<ReloadOutlined />} onClick={loadData}>
                刷新
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as ApprovalTabKey)}
          items={[
            {
              key: 'pending',
              label: '待我审批',
              children: (
                <Table
                  rowKey="id"
                  columns={pendingColumns}
                  dataSource={filteredItems}
                  loading={loading}
                  bordered
                  pagination={{ pageSize: 10, showSizeChanger: true }}
                  scroll={{ x: 1400 }}
                />
              ),
            },
            {
              key: 'history',
              label: '审批历史',
              children: (
                <Table
                  rowKey="id"
                  columns={historyColumns}
                  dataSource={filteredHistoryItems}
                  loading={loading}
                  bordered
                  pagination={{ pageSize: 10, showSizeChanger: true }}
                  scroll={{ x: 1500 }}
                />
              ),
            },
            {
              key: 'notifications',
              label: (
                <Space size={6}>
                  <span>通知</span>
                  {counts.notifications > 0 ? (
                    <Badge count={counts.notifications} size="small" />
                  ) : null}
                </Space>
              ),
              children: (
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Paragraph type="secondary" style={{ margin: 0 }}>
                      申请人会在环节通过、全部通过或驳回时收到通知。
                    </Paragraph>
                    <Button onClick={handleMarkAllNotificationsRead}>全部标记已读</Button>
                  </Space>
                  <Table
                    rowKey={(record) => `${record.bizType}-${record.id}`}
                    columns={notificationColumns}
                    dataSource={filteredNotificationItems}
                    loading={loading}
                    bordered
                    pagination={{ pageSize: 10, showSizeChanger: true }}
                    scroll={{ x: 1500 }}
                  />
                </Space>
              ),
            },
          ]}
        />
      </Card>

      <Modal
        title={actionState.type === 'approve' ? '审批通过' : '驳回申请'}
        open={actionState.open}
        onCancel={() => setActionState({ open: false, type: 'approve', item: null, detail: null })}
        onOk={handleActionSubmit}
        okText={actionState.type === 'approve' ? '确认通过' : '确认驳回'}
        cancelText="取消"
        confirmLoading={actionLoading}
        destroyOnClose
        width={
          (actionState.item?.type === 'social_insurance' &&
            actionState.type === 'approve' &&
            isSocialInsuranceDetail(actionState.detail) &&
            actionState.detail.currentStage === 'hr') ||
          (actionState.item?.type === 'resignation_approval' &&
            actionState.type === 'approve' &&
            isResignationApprovalDetail(actionState.detail) &&
            ['department_head', 'hr'].includes(actionState.detail.currentStage || ''))
            ? 760
            : 520
        }
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {actionState.item?.type === 'transfer' && actionState.type === 'approve' ? (
            <Select
              showSearch
              placeholder="请选择目标咨询师"
              value={selectedTransferConsultant}
              onChange={(value) => setSelectedTransferConsultant(value)}
              options={transferConsultantOptions.map((item) => ({
                label: `${item.name} / ${item.campus} / 当前咨询量${item.recordCount}条`,
                value: item.name,
              }))}
            />
          ) : null}

          {actionState.item?.type === 'social_insurance' &&
          actionState.type === 'approve' &&
          isSocialInsuranceDetail(actionState.detail) &&
          actionState.detail.currentStage === 'hr' ? (
            <>
              <Row gutter={16}>
                <Col span={12}>
                  <Input
                    placeholder="缴费内容，如：养老、失业、工伤、医疗、生育"
                    value={socialInsuranceHrFields.hrPaymentContent}
                    onChange={(e) =>
                      setSocialInsuranceHrFields((prev) => ({
                        ...prev,
                        hrPaymentContent: e.target.value,
                      }))
                    }
                  />
                </Col>
                <Col span={12}>
                  <InputNumber
                    min={0}
                    style={{ width: '100%' }}
                    placeholder="缴费基数"
                    value={socialInsuranceHrFields.hrPaymentBase}
                    onChange={(value) =>
                      setSocialInsuranceHrFields((prev) => ({
                        ...prev,
                        hrPaymentBase: typeof value === 'number' ? value : undefined,
                      }))
                    }
                  />
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <DatePicker
                    style={{ width: '100%' }}
                    placeholder="缴费起始日期"
                    value={socialInsuranceHrFields.hrStartDate}
                    onChange={(value) =>
                      setSocialInsuranceHrFields((prev) => ({
                        ...prev,
                        hrStartDate: value,
                      }))
                    }
                  />
                </Col>
                <Col span={12}>
                  <Input
                    placeholder="社保办理地"
                    value={socialInsuranceHrFields.hrInsurancePlace}
                    onChange={(e) =>
                      setSocialInsuranceHrFields((prev) => ({
                        ...prev,
                        hrInsurancePlace: e.target.value,
                      }))
                    }
                  />
                </Col>
              </Row>
            </>
          ) : null}

          {actionState.item?.type === 'resignation_approval' &&
          actionState.type === 'approve' &&
          isResignationApprovalDetail(actionState.detail) &&
          ['department_head', 'hr'].includes(actionState.detail.currentStage || '') ? (
            <DatePicker
              style={{ width: '100%' }}
              placeholder="请选择工资结算至日期"
              value={resignationSalaryEndDate}
              onChange={(value) => setResignationSalaryEndDate(value)}
            />
          ) : null}

          <TextArea
            rows={4}
            placeholder={actionState.type === 'approve' ? '审批意见（可选）' : '请填写驳回原因'}
            value={actionComment}
            onChange={(e) => setActionComment(e.target.value)}
          />
        </Space>
      </Modal>

      <Modal
        title="审批详情"
        open={detailState.open}
        onCancel={() => setDetailState({ open: false, loading: false, item: null, detail: null })}
        footer={null}
        width={1000}
      >
        {detailState.loading ? <Text>加载中...</Text> : renderDetailContent()}
      </Modal>
    </div>
  )
}

export default ApprovalCenterPage
