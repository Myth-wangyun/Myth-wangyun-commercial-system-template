/**
 * 咨询量列表组件
 */

import React, { useState, useEffect, useCallback } from 'react'
import {
  App,
  Table,
  Card,
  Input,
  Select,
  AutoComplete,
  DatePicker,
  Button,
  Space,
  Tag,
  Modal,
  Popconfirm,
  Descriptions,
  Row,
  Col,
  Form,
  Radio,
  Checkbox,
  Divider,
  Tooltip,
  InputNumber,
  Statistic,
} from 'antd'
import {
  SearchOutlined,
  ReloadOutlined,
  DeleteOutlined,
  EyeOutlined,
  EditOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  ExportOutlined,
  ImportOutlined,
  DownloadOutlined,
  HistoryOutlined,
  SwapOutlined,
  MessageOutlined,
  DollarOutlined,
  TeamOutlined,
  UserSwitchOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons'
import { getConsultantNames } from '@/services/consult/consultantList'
import { useCampusStore } from '@/stores/campusStore'
import { useAuthStore } from '@/stores/authStore'
import { NoCopyContainer } from '@/components/common'
import ConsultationDetail from './ConsultationDetail'
import CommunicationHistory from './CommunicationHistory'
import CommunicationInlineList from './CommunicationInlineList'
import PaymentHistory from './PaymentHistory'
import type { ConsultationRecord, ConsultationQueryParams, FullConsultationInfo, UpdateConsultationRequest, MediaHierarchyNode } from './types'
import * as api from './api'
import * as exportApi from './exportApi'
import * as handoverApi from './handoverApi'
import ConsultationImport from './ConsultationImport'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker

const isMediaHierarchyNode = (node: MediaHierarchyNode | string): node is MediaHierarchyNode =>
  typeof node !== 'string'

const isMediaLeafList = (children: MediaHierarchyNode[] | string[]): children is string[] =>
  children.every((child) => typeof child === 'string')

interface Props {
  refreshKey?: number
  campus?: string
}


export default function ConsultationList({ refreshKey, campus }: Props) {
  const { message, notification } = App.useApp()
  const { getAllCampuses } = useCampusStore()
  const { user, hasPermission } = useAuthStore()
  const allCampuses = getAllCampuses()
  
  // 判断当前用户是否为咨询师身份（咨询师不能编辑咨询师字段）
  const isConsultant = !!(user && (
    user.role === 'consultant' ||
    (user.department === '祈福司' && user.position && user.position.includes('咨询师'))
  ))
  
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
  
  // 编辑弹窗
  const [editVisible, setEditVisible] = useState(false)
  const [editRecord, setEditRecord] = useState<ConsultationRecord | null>(null)
  const [editLoading, setEditLoading] = useState(false)
  const [editForm] = Form.useForm()
  
  // 判断记录是否超过20分钟且已有电话（仅锁定已有电话的修改）
  const isPhoneEditDisabled = useCallback((record: ConsultationRecord | null) => {
    if (!record?.创建时间) return false
    const hasExistingPhone = !!(record.电话 && String(record.电话).trim())
    if (!hasExistingPhone) return false
    const createTime = dayjs(record.创建时间)
    const now = dayjs()
    const diffMinutes = now.diff(createTime, 'minute')
    return diffMinutes >= 20
  }, [])
  
  // 导出申请弹窗
  const [exportModalVisible, setExportModalVisible] = useState(false)
  const [exportReason, setExportReason] = useState('')
  const [exportLoading, setExportLoading] = useState(false)
  
  // 我的导出记录弹窗
  const [exportHistoryVisible, setExportHistoryVisible] = useState(false)
  const [exportHistoryData, setExportHistoryData] = useState<exportApi.ExportRequest[]>([])
  const [exportHistoryLoading, setExportHistoryLoading] = useState(false)
  
  // 导入弹窗
  const [importVisible, setImportVisible] = useState(false)
  
  // 展开行状态（替代原沟通记录弹窗）
  const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([])
  
  // 沟通记录相关（保留变量名兼容其他逻辑，虽然可能不完全需要了）
  const [communicationVisible, setCommunicationVisible] = useState(false)
  const [communicationRecord, setCommunicationRecord] = useState<ConsultationRecord | null>(null)
  
  // 缴费记录弹窗
  const [paymentVisible, setPaymentVisible] = useState(false)
  const [paymentRecord, setPaymentRecord] = useState<ConsultationRecord | null>(null)
  
  // 转量相关状态
  const [transferModalVisible, setTransferModalVisible] = useState(false)
  const [transferRecord, setTransferRecord] = useState<ConsultationRecord | null>(null)
  const [transferLoading, setTransferLoading] = useState(false)
  const [transferCampuses, setTransferCampuses] = useState<{ campus_name: string; city: string }[]>([])
  const [transferForm] = Form.useForm()
  const [benefitPreview, setBenefitPreview] = useState<{
    transfer_type: string
    transfer_stage: string
    benefit_info: Record<string, any>
  } | null>(null)
  const [benefitLoading, setBenefitLoading] = useState(false)
  const [targetCampusConsultants, setTargetCampusConsultants] = useState<string[]>([]) // 目标神殿的咨询师列表
  
  // 交接相关状态
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([])
  const [handoverModalVisible, setHandoverModalVisible] = useState(false)
  const [handoverRemark, setHandoverRemark] = useState('')
  const [handoverLoading, setHandoverLoading] = useState(false)
  const [handoverMode, setHandoverMode] = useState(false)  // 交接模式：只显示可交接的记录
  const [handoverRecords, setHandoverRecords] = useState<ConsultationRecord[]>([])  // 交接模式下的记录列表
  const [handoverTotal, setHandoverTotal] = useState(0)  // 交接模式下的总记录数
  
  // 咨询师转量相关状态（单个）
  const [consultantTransferModalVisible, setConsultantTransferModalVisible] = useState(false)
  const [consultantTransferRecord, setConsultantTransferRecord] = useState<ConsultationRecord | null>(null)
  const [consultantTransferLoading, setConsultantTransferLoading] = useState(false)
  const [targetConsultantForTransfer, setTargetConsultantForTransfer] = useState<string | undefined>()
  const [consultantTransferReason, setConsultantTransferReason] = useState('')
  const [consultantsList, setConsultantsList] = useState<{ name: string; campus?: string; record_count?: number }[]>([])
  
  // 选项数据
  const [statusOptions, setStatusOptions] = useState<string[]>([])
  const [sourceOptions, setSourceOptions] = useState<string[]>([])
  const [mediaSourceOptions, setMediaSourceOptions] = useState<string[]>([])
  const [intentionOptions, setIntentionOptions] = useState<string[]>([])
  const [educationOptions, setEducationOptions] = useState<string[]>([])
  const [categoryOptions, setCategoryOptions] = useState<string[]>([])
  const [consultantOptions, setConsultantOptions] = useState<string[]>([])
  const [channelStaffOptions, setChannelStaffOptions] = useState<string[]>([])
  const [mediaHierarchy, setMediaHierarchy] = useState<MediaHierarchyNode[]>([])
  
  // 编辑弹窗的媒体来源联动状态
  const [editSelectedSource, setEditSelectedSource] = useState<string | null>(null)
  const [editSelectedCategory, setEditSelectedCategory] = useState<string | null>(null)

  // 加载选项
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [status, source, mediaSource, intention, education, hierarchy, category] = await Promise.all([
          api.getStatusOptions(),
          api.getSourceOptions(),
          api.getMediaSourceOptions(),
          api.getIntentionOptions(),
          api.getEducationOptions(),
          api.getMediaSourceHierarchy(),
          api.getCategoryOptions(),
        ])
        setStatusOptions(status.data)
        setSourceOptions(source.data)
        setMediaSourceOptions(mediaSource.data)
        setIntentionOptions(intention.data)
        setEducationOptions(education.data)
        setMediaHierarchy(hierarchy.data)
        setCategoryOptions(category.data)
      } catch (error) {
        console.error('加载选项失败:', error)
      }
    }
    loadOptions()
  }, [])
  
  // 加载咨询师列表
  useEffect(() => {
    const loadConsultants = async () => {
      try {
        const consultants = await getConsultantNames(campus)
        setConsultantOptions(consultants)
        
        // 同时加载咨询师转量用的咨询师列表（包含神殿和数量信息）
        const consultantList = await api.getConsultantList(campus || undefined)
        setConsultantsList(consultantList)
      } catch (error) {
        console.error('加载咨询师列表失败:', error)
      }
    }
    loadConsultants()
  }, [campus])

  // 加载渠道专员列表（根据神殿）
  useEffect(() => {
    const loadChannelStaff = async () => {
      try {
        const staff = await api.getChannelStaffOptions(campus || undefined)
        setChannelStaffOptions(staff)
      } catch (error) {
        console.error('加载渠道专员列表失败:', error)
      }
    }
    loadChannelStaff()
  }, [campus])

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

  // 当筛选条件、分页、神殿变化时重新加载
  useEffect(() => {
    loadData()
  }, [page, pageSize, refreshKey, campus, filters])

  // 咨询师统计数据（从后端API获取，基于全部筛选条件）
  const [consultantStats, setConsultantStats] = useState<{ name: string; count: number; todayCount: number }[]>([])
  const [statsTotal, setStatsTotal] = useState(0)
  const [statsUnassigned, setStatsUnassigned] = useState(0)
  const [statsTodayNew, setStatsTodayNew] = useState(0)
  const [statsTodayDistributed, setStatsTodayDistributed] = useState(0)
  const [statsLoading, setStatsLoading] = useState(false)
  
  // 加载咨询师统计数据
  const loadConsultantStats = useCallback(async () => {
    setStatsLoading(true)
    try {
      const params: api.ConsultantStatsParams = {
        campus: campus || filters.campus,
        consultant: filters.consultant,
        // 统计API只需要日期部分，不需要时间
        start_date: filters.start_date ? filters.start_date.split(' ')[0] : undefined,
        end_date: filters.end_date ? filters.end_date.split(' ')[0] : undefined,
        data_source: filters.source,
        media_source: filters.media_source,
        is_visit: filters.is_visit !== undefined ? (filters.is_visit ? 1 : 0) : undefined,
        is_enrolled: filters.is_enrolled !== undefined ? (filters.is_enrolled ? 1 : 0) : undefined,
        is_reserved: filters.is_reserved !== undefined ? (filters.is_reserved ? 1 : 0) : undefined,
        is_invalid: filters.is_invalid !== undefined ? (filters.is_invalid ? 1 : 0) : undefined,
        is_excluded: filters.is_excluded !== undefined ? (filters.is_excluded ? 1 : 0) : undefined,
      }
      const result = await api.getConsultantStats(params)
      if (result.success && result.data) {
        const stats = result.data.consultant_stats.map(item => ({
          name: item.咨询师 || '未分配',
          count: item.咨询量,
          todayCount: item.今日量 || 0
        }))
        setConsultantStats(stats)
        setStatsTotal(result.data.total_count)
        setStatsUnassigned(result.data.unassigned_count || 0)
        setStatsTodayNew(result.data.today_new_count || 0)
        setStatsTodayDistributed(result.data.today_distributed_count || 0)
      }
    } catch (error) {
      console.error('加载咨询师统计失败:', error)
    } finally {
      setStatsLoading(false)
    }
  }, [filters, campus])
  
  // 当筛选条件变化时加载咨询师统计
  useEffect(() => {
    loadConsultantStats()
  }, [loadConsultantStats, refreshKey])

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

  // 删除记录
  const handleDelete = async (recordId: number) => {
    try {
      await api.deleteConsultationRecord(recordId)
      message.success('删除成功')
      loadData()
    } catch (error) {
      message.error('删除失败')
    }
  }

  // 打开转量弹窗
  const handleOpenTransfer = async (record: ConsultationRecord) => {
    setTransferRecord(record)
    setBenefitPreview(null)
    setTargetCampusConsultants([])
    transferForm.resetFields()
    
    // 先检查是否可以转量
    try {
      const checkResult = await api.checkCanTransfer(record.记录ID)
      if (!checkResult.can_transfer) {
        message.warning(checkResult.message)
        return
      }
    } catch (error) {
      message.error('检查转量条件失败')
      return
    }
    
    // 加载可用神殿列表
    if (transferCampuses.length === 0) {
      try {
        const campuses = await api.getTransferCampuses()
        setTransferCampuses(campuses)
      } catch (error) {
        message.error('加载神殿列表失败')
        return
      }
    }
    
    setTransferModalVisible(true)
  }

  // 预览转量权益
  const handlePreviewBenefit = async (targetCampus: string) => {
    if (!transferRecord || !targetCampus) {
      setBenefitPreview(null)
      setTargetCampusConsultants([])
      return
    }
    
    setBenefitLoading(true)
    try {
      // 加载目标神殿的咨询师列表
      const consultants = await getConsultantNames(targetCampus)
      setTargetCampusConsultants(consultants)
      
      // 预览权益
      const result = await api.previewTransferBenefit(transferRecord.记录ID, targetCampus)
      setBenefitPreview(result)
    } catch (error) {
      message.error('预览权益失败')
      setBenefitPreview(null)
      setTargetCampusConsultants([])
    } finally {
      setBenefitLoading(false)
    }
  }

  // 执行转量
  const handleTransfer = async () => {
    if (!transferRecord) return
    
    try {
      const values = await transferForm.validateFields()
      setTransferLoading(true)
      
      const result = await api.executeTransfer({
        record_id: transferRecord.记录ID,
        target_campus: values.target_campus,
        reason: values.reason,
        new_consultant: values.new_consultant,
      })
      
      if (result.success) {
        notification.success({ message: '转量成功', description: `类型：${result.transfer_type}，阶段：${result.transfer_stage}`, placement: 'topRight', duration: 4 })
        setTransferModalVisible(false)
        loadData()
      } else {
        notification.error({ message: '转量失败', description: result.message || '请检查网络连接或联系管理员', placement: 'topRight', duration: 4 })
      }
    } catch (error: any) {
      notification.error({ message: '转量失败', description: error.response?.data?.detail || '转量操作失败', placement: 'topRight', duration: 4 })
    } finally {
      setTransferLoading(false)
    }
  }

  // 打开咨询师转量弹窗
  const handleOpenConsultantTransfer = (record: ConsultationRecord) => {
    setConsultantTransferRecord(record)
    setTargetConsultantForTransfer(undefined)
    setConsultantTransferReason('')
    setConsultantTransferModalVisible(true)
  }

  // 执行咨询师转量
  const handleConsultantTransfer = async () => {
    if (!consultantTransferRecord || !targetConsultantForTransfer) {
      message.warning('请选择目标咨询师')
      return
    }
    
    if (!consultantTransferReason.trim()) {
      message.warning('请填写转量原因')
      return
    }
    
    if (consultantTransferRecord.咨询师 === targetConsultantForTransfer) {
      message.warning('目标咨询师不能与当前咨询师相同')
      return
    }
    
    setConsultantTransferLoading(true)
    try {
      const result = await api.batchConsultantTransfer({
        source_consultant: consultantTransferRecord.咨询师 || '',
        target_consultant: targetConsultantForTransfer,
        reason: consultantTransferReason,
        record_ids: [consultantTransferRecord.记录ID],  // 只转当前这一条记录
      })
      
      if (result.success) {
        notification.success({ message: '转量成功', description: result.pending_approval_count > 0 ? '需要等待审批' : '转量已完成', placement: 'topRight', duration: 4 })
        setConsultantTransferModalVisible(false)
        setConsultantTransferRecord(null)
        setTargetConsultantForTransfer(undefined)
        setConsultantTransferReason('')
        loadData()
      } else {
        notification.error({ message: '转量失败', description: result.message || '请检查网络连接或联系管理员', placement: 'topRight', duration: 4 })
      }
    } catch (error: any) {
      console.error('咨询师转量失败:', error)
      notification.error({ message: '转量失败', description: error.response?.data?.detail || '咨询师转量失败', placement: 'topRight', duration: 4 })
    } finally {
      setConsultantTransferLoading(false)
    }
  }

  // 编辑记录
  const handleEdit = async (record: ConsultationRecord) => {
    try {
      // 从后端获取最新的咨询量数据（确保缴费信息同步）
      const latestRecord = await api.getConsultationRecord(record.记录ID)
      const recordToEdit = latestRecord || record
      
      setEditRecord(recordToEdit)
      // 设置媒体来源联动状态
      setEditSelectedSource(recordToEdit.量来源 || null)
      // 根据媒体来源推断来源类别
      let foundCategory: string | null = null
      if (recordToEdit.量来源 && recordToEdit.媒体来源) {
        const sourceNode = mediaHierarchy.find(s => s.name === recordToEdit.量来源)
        if (sourceNode) {
          for (const cat of sourceNode.children) {
            if (
              isMediaHierarchyNode(cat) &&
              isMediaLeafList(cat.children) &&
              cat.children.includes(recordToEdit.媒体来源)
            ) {
              foundCategory = cat.name
              break
            }
          }
        }
      }
      setEditSelectedCategory(foundCategory)
      
      editForm.setFieldsValue({
        // 基本信息
        电话: recordToEdit.电话,
        咨询者姓名: recordToEdit.咨询者姓名,
        性别: recordToEdit.性别,
        年龄: recordToEdit.年龄,
        状态: recordToEdit.状态,
        学历: recordToEdit.学历,
        神殿: recordToEdit.神殿,
        // 来源信息
        量来源: recordToEdit.量来源,
        来源类别: foundCategory,
        媒体来源: recordToEdit.媒体来源,
        关键字: recordToEdit.关键字,
        咨询类别: recordToEdit.咨询类别,
        报名意向: recordToEdit.报名意向,
        // 人员信息
        分量人: recordToEdit.分量人,
        咨询师: recordToEdit.咨询师,
        // 联系方式
        QQ: recordToEdit.QQ,
        微信: recordToEdit.微信,
        抖音: recordToEdit.抖音,
        快手: recordToEdit.快手,
        位置: recordToEdit.位置,
        网聊专员: recordToEdit.网聊专员,
        渠道专员: recordToEdit.渠道专员,
        县办: recordToEdit.县办,
        乡办: recordToEdit.乡办,
        信息员: recordToEdit.信息员,
        // 其他信息
        代咨: recordToEdit.代咨,
        咨询结果: recordToEdit.咨询结果,
        备注: recordToEdit.备注,
        // 标记
        是否无效量: !!recordToEdit.是否无效量,
        无效原因: recordToEdit.无效原因,
        是否不算量: !!recordToEdit.是否不算量,
        不算量原因: recordToEdit.不算量原因,
        是否上门: !!recordToEdit.是否上门,
        上门时间: recordToEdit.上门时间 ? dayjs(recordToEdit.上门时间) : undefined,
        是否报名: !!recordToEdit.是否报名,
        报名时间: recordToEdit.报名时间 ? dayjs(recordToEdit.报名时间) : undefined,
        是否订座: !!recordToEdit.是否订座,
        是否校园量: !!recordToEdit.是否校园量,
        // 口碑提供人
        口碑提供人: recordToEdit.口碑提供人,
        // 其他
        地区: recordToEdit.地区,
        县: recordToEdit.县,
        目前状态: recordToEdit.目前状态,
        就读学校: recordToEdit.就读学校,
        报名专业: recordToEdit.报名专业,
        咨询时间: recordToEdit.咨询时间 ? dayjs(recordToEdit.咨询时间) : undefined,
        // 报名相关新字段
        长期短期: (recordToEdit as any).长期短期,
        课程: (recordToEdit as any).课程,
        全款: !!(recordToEdit as any).全款,
        分期: !!(recordToEdit as any).分期,
        分期备注: (recordToEdit as any).分期备注,
        注册: !!(recordToEdit as any).注册,
        贷款: !!(recordToEdit as any).贷款,
        详细地址: (recordToEdit as any).详细地址,
        // 订座相关新字段
        订座时间: (recordToEdit as any).订座时间 ? dayjs((recordToEdit as any).订座时间) : undefined,
        订座金额: (recordToEdit as any).订座金额,
        // 缴费金额
        缴费金额: (recordToEdit as any).缴费金额,
        // 退费相关新字段
        是否退费: !!(recordToEdit as any).是否退费,
        退费原因: (recordToEdit as any).退费原因,
        退费金额: (recordToEdit as any).退费金额,
      })
      setEditVisible(true)
    } catch (error) {
      console.error('获取咨询量数据失败:', error)
      // 失败时使用列表中的数据
      setEditRecord(record)
      setEditSelectedSource(record.量来源 || null)
      // 根据媒体来源推断来源类别
      let foundCategory: string | null = null
      if (record.量来源 && record.媒体来源) {
        const sourceNode = mediaHierarchy.find(s => s.name === record.量来源)
        if (sourceNode) {
          for (const cat of sourceNode.children) {
            if (
              isMediaHierarchyNode(cat) &&
              isMediaLeafList(cat.children) &&
              cat.children.includes(record.媒体来源)
            ) {
              foundCategory = cat.name
              break
            }
          }
        }
      }
      setEditSelectedCategory(foundCategory)
      
      editForm.setFieldsValue({
        // 基本信息
        电话: record.电话,
        咨询者姓名: record.咨询者姓名,
        性别: record.性别,
        年龄: record.年龄,
        状态: record.状态,
        学历: record.学历,
        神殿: record.神殿,
        // 来源信息
        量来源: record.量来源,
        来源类别: foundCategory,
        媒体来源: record.媒体来源,
        关键字: record.关键字,
        咨询类别: record.咨询类别,
        报名意向: record.报名意向,
        // 人员信息
        分量人: record.分量人,
        咨询师: record.咨询师,
        // 联系方式
        QQ: record.QQ,
        微信: record.微信,
        抖音: record.抖音,
        快手: record.快手,
        位置: record.位置,
        网聊专员: record.网聊专员,
        渠道专员: record.渠道专员,
        县办: record.县办,
        乡办: record.乡办,
        信息员: record.信息员,
        // 其他信息
        代咨: record.代咨,
        咨询结果: record.咨询结果,
        备注: record.备注,
        // 标记
        是否无效量: !!record.是否无效量,
        无效原因: record.无效原因,
        是否不算量: !!record.是否不算量,
        不算量原因: record.不算量原因,
        是否上门: !!record.是否上门,
        上门时间: record.上门时间 ? dayjs(record.上门时间) : undefined,
        是否报名: !!record.是否报名,
        报名时间: record.报名时间 ? dayjs(record.报名时间) : undefined,
        是否订座: !!record.是否订座,
        是否校园量: !!record.是否校园量,
        // 口碑提供人
        口碑提供人: record.口碑提供人,
        // 其他
        地区: record.地区,
        县: record.县,
        目前状态: record.目前状态,
        就读学校: record.就读学校,
        报名专业: record.报名专业,
        咨询时间: record.咨询时间 ? dayjs(record.咨询时间) : undefined,
        // 报名相关新字段
        长期短期: (record as any).长期短期,
        课程: (record as any).课程,
        全款: !!(record as any).全款,
        分期: !!(record as any).分期,
        分期备注: (record as any).分期备注,
        注册: !!(record as any).注册,
        贷款: !!(record as any).贷款,
        详细地址: (record as any).详细地址,
        // 订座相关新字段
        订座时间: (record as any).订座时间 ? dayjs((record as any).订座时间) : undefined,
        订座金额: (record as any).订座金额,
        // 缴费金额
        缴费金额: (record as any).缴费金额,
        // 退费相关新字段
        是否退费: !!(record as any).是否退费,
        退费原因: (record as any).退费原因,
        退费金额: (record as any).退费金额,
      })
      setEditVisible(true)
    }
  }

  // 编辑表单：报名意向与是否报名联动
  const handleEditSignupLinkage = (changedValues: Record<string, any>, allValues: Record<string, any>) => {
    if ('报名意向' in changedValues) {
      const intention = allValues['报名意向']
      const isSignup = !!allValues['是否报名']
      if (intention === '已报名' && !isSignup) {
        editForm.setFieldsValue({ 是否报名: true })
      } else if (intention !== '已报名' && isSignup) {
        editForm.setFieldsValue({ 是否报名: false })
      }
    }

    if ('是否报名' in changedValues) {
      const isSignup = !!allValues['是否报名']
      const intention = allValues['报名意向']
      if (isSignup && intention !== '已报名') {
        editForm.setFieldsValue({ 报名意向: '已报名' })
      } else if (!isSignup && intention === '已报名') {
        editForm.setFieldsValue({ 报名意向: undefined })
      }
    }
  }

  // 提交编辑
  const handleEditSubmit = async () => {
    if (!editRecord) return
    
    try {
      const values = await editForm.validateFields()
      setEditLoading(true)
      
      // 转换布尔值为0/1
      const booleanFields = [
        '是否无效量', '是否不算量', '是否上门', '是否报名', '是否订座', '是否校园量', '是否退费',
        '网转上门', '网络新媒体', '口碑上门', '渠道上门', '校园新渠道', '新媒体来源',
        '全款', '分期', '注册', '贷款'
      ]
      
      const processedValues = { ...values }
      booleanFields.forEach(field => {
        if (typeof processedValues[field] === 'boolean') {
          processedValues[field] = processedValues[field] ? 1 : 0
        }
      })
      
      // 如果退费被取消勾选，清空退费相关字段
      if (!processedValues['是否退费']) {
        processedValues['退费原因'] = null
        processedValues['退费金额'] = null
      }
      
      // 如果报名和订座都取消勾选，清空缴费金额和退费相关字段
      if (!processedValues['是否报名'] && !processedValues['是否订座']) {
        processedValues['缴费金额'] = null
        processedValues['是否退费'] = 0
        processedValues['退费原因'] = null
        processedValues['退费金额'] = null
      }
      
      // 转换日期字段为字符串格式
      const dateTimeFields = ['上门时间', '报名时间', '订座时间', '咨询时间']
      dateTimeFields.forEach(field => {
        if (processedValues[field] && dayjs.isDayjs(processedValues[field])) {
          processedValues[field] = processedValues[field].format('YYYY-MM-DD HH:mm:ss')
        }
      })
      
      // 如果没有选择具体来源（Level 3），但选了来源类别（Level 2），则用来源类别作为媒体来源
      if (!processedValues['媒体来源'] && processedValues['来源类别']) {
        processedValues['媒体来源'] = processedValues['来源类别']
      }
      
      const updateData: UpdateConsultationRequest = {
        记录ID: editRecord.记录ID,
        ...processedValues,
      }
      
      await api.updateConsultationRecord(updateData)
      notification.success({ message: '已更新', description: '咨询量信息更新成功', placement: 'topRight', duration: 3 })
      setEditVisible(false)
      loadData()
    } catch (error: any) {
      if (error.errorFields) {
        // 表单验证错误
        return
      }
      notification.error({ message: '更新失败', description: error.message || '请检查网络连接或联系管理员', placement: 'topRight', duration: 4 })
    } finally {
      setEditLoading(false)
    }
  }

  // 申请导出
  const handleExportRequest = async () => {
    if (!exportReason.trim()) {
      message.warning('请填写导出原因')
      return
    }
    
    setExportLoading(true)
    try {
      const exportFilters = {
        ...filters,
        campus: campus || filters.campus,
      }
      await exportApi.createExportRequest({
        reason: exportReason,
        filters: exportFilters,
        total_records: total,
      })
      notification.success({ message: '申请已提交', description: '导出申请已提交，请等待审批', placement: 'topRight', duration: 3 })
      setExportModalVisible(false)
      setExportReason('')
    } catch (error: any) {
      message.error('提交导出申请失败: ' + (error.message || '未知错误'))
    } finally {
      setExportLoading(false)
    }
  }

  // 加载我的导出记录
  const loadExportHistory = async () => {
    setExportHistoryLoading(true)
    try {
      const result = await exportApi.getMyExportRequests({ page: 1, page_size: 50 })
      setExportHistoryData(result.data)
    } catch (error: any) {
      message.error('加载导出记录失败: ' + (error.message || '未知错误'))
    } finally {
      setExportHistoryLoading(false)
    }
  }

  // 打开导出记录弹窗
  const handleShowExportHistory = () => {
    setExportHistoryVisible(true)
    loadExportHistory()
  }

  // 下载导出文件
  const handleDownloadExport = async (requestId: number) => {
    try {
      // 使用新窗口下载
      window.open(`/api/v1/consult/export/request/${requestId}/download`, '_blank')
    } catch (error: any) {
      message.error('下载失败: ' + (error.message || '未知错误'))
    }
  }

  // 当前显示的记录（交接模式下显示从后端获取的可交接记录）
  const displayRecords = handoverMode ? handoverRecords : records
  const displayTotal = handoverMode ? handoverTotal : total

  // 进入交接模式 - 从后端获取当前神殿所有可交接的记录
  const enterHandoverMode = async () => {
    setLoading(true)
    try {
      // 获取当前神殿所有可交接的记录（报名或订座，且未交接）
      const currentCampus = campus || filters.campus
      const result = await api.getConsultationRecords({
        campus: currentCampus,
        is_signup_or_reserve: 1,  // 报名或订座
        is_handovered: 0,  // 未交接
        page: 1,
        page_size: 1000,  // 获取足够多的记录
      })
      
      if (result.数据列表.length === 0) {
        message.info('当前神殿没有可交接的记录（需要是报名或订座状态且未交接）')
        return
      }
      
      setHandoverRecords(result.数据列表)
      setHandoverTotal(result.总记录数)
      setHandoverMode(true)
      setSelectedRowKeys([])
      message.success(`已筛选出 ${result.总记录数} 条可交接记录`)
    } catch (error: any) {
      message.error('获取可交接记录失败: ' + (error.message || '未知错误'))
    } finally {
      setLoading(false)
    }
  }

  // 退出交接模式
  const exitHandoverMode = () => {
    setHandoverMode(false)
    setSelectedRowKeys([])
    setHandoverRecords([])
    setHandoverTotal(0)
  }

  // 全选可交接记录
  const selectAllHandoverable = () => {
    const allKeys = handoverRecords.map(r => r.记录ID)
    // 如果已经全选了，就取消全选；否则全选
    if (selectedRowKeys.length === allKeys.length) {
      setSelectedRowKeys([])
    } else {
      setSelectedRowKeys(allKeys)
    }
  }

  // 交接功能：将报名/订座的咨询量交接给教化司
  const handleHandover = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要交接的记录')
      return
    }
    setHandoverModalVisible(true)
  }
  
  // 确认交接
  const confirmHandover = async () => {
    if (!user) {
      message.error('用户未登录')
      return
    }
    
    setHandoverLoading(true)
    try {
      const result = await handoverApi.createHandover(
        {
          记录ID列表: selectedRowKeys,
          交接备注: handoverRemark || undefined
        },
        Number(user.id),
        user.name
      )

      if (result.success) {
        message.success(result.message)
        setHandoverModalVisible(false)
        setHandoverRemark('')
        setSelectedRowKeys([])
        // 从交接记录列表中移除已交接的记录
        const remainingRecords = handoverRecords.filter(r => !selectedRowKeys.includes(r.记录ID))
        if (remainingRecords.length === 0) {
          // 没有剩余可交接记录，退出交接模式
          setHandoverMode(false)
          setHandoverRecords([])
          setHandoverTotal(0)
        } else {
          setHandoverRecords(remainingRecords)
          setHandoverTotal(remainingRecords.length)
        }
        loadData()  // 刷新主列表
      } else {
        message.error(result.message)
      }
    } catch (error: any) {
      message.error('交接失败: ' + (error.message || '未知错误'))
    } finally {
      setHandoverLoading(false)
    }
  }

  // 搜索
  const handleSearch = () => {
    setPage(1)
    setHandoverMode(false)  // 搜索时退出交接模式
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
      title: '分类',
      width: 50,
      fixed: 'left' as const,
      render: (_: any, record: ConsultationRecord) => {
        // 根据记录的创建时间和咨询师判断分类
        // 私域：当前咨询师的记录，15天内
        // 再：同神殿但非当前咨询师的记录，超过15天
        // 新：超过180天的可重新录入
        const createTime = record.创建时间 ? dayjs(record.创建时间) : null
        const now = dayjs()
        const currentConsultant = user?.name || user?.username || ''
        
        if (!createTime) return <Tag color="default">-</Tag>
        
        const daysDiff = now.diff(createTime, 'day')
        
        if (record.咨询师 === currentConsultant && daysDiff <= 15) {
          // 私域：15天内自己的量
          return null // 私域不显示特殊标记
        } else if (daysDiff > 180) {
          // 新：超过180天可新分配
          return <Tag color="green">新</Tag>
        } else if (daysDiff > 15) {
          // 再：超过15天可再分配
          return <Tag color="orange">再</Tag>
        }
        return null
      },
    },
    {
      title: '登记日期',
      dataIndex: '登记日期',
      render: (val: string) => val ? dayjs(val).format('YYYY-MM-DD HH:mm') : '',
    },
    {
      title: '电话',
      dataIndex: '电话',
      render: (val: string) => val ? <Tag icon={<PhoneOutlined />} style={{ margin: 0 }}>{val}</Tag> : '',
    },
    {
      title: '姓名',
      dataIndex: '咨询者姓名',
      render: (val: string) => val || '',
    },
    {
      title: '咨询师',
      dataIndex: '咨询师',
      render: (val: string) => val || '',
    },
    {
      title: '分量人',
      dataIndex: '分量人',
      render: (val: string) => val || '',
    },
    {
      title: '状态',
      dataIndex: '状态',
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
        return val ? <Tag color={colorMap[val] || 'default'} style={{ margin: 0 }}>{val}</Tag> : ''
      },
    },
    {
      title: '量来源',
      dataIndex: '量来源',
      render: (val: string) => val || '',
    },
    {
      title: '来源类别',
      dataIndex: '来源类别',
      render: (val: string) => val || '',
    },
    {
      title: '媒体来源',
      dataIndex: '媒体来源',
      render: (val: string) => val || '',
    },
    {
      title: '报名意向',
      dataIndex: '报名意向',
      render: (val: string) => {
        const colorMap: Record<string, string> = {
          '强意向': 'green',
          '中意向': 'blue',
          '弱意向': 'orange',
          '无意向': 'default',
          '已报名': 'success',
          '联系不上': 'red',
        }
        return val ? <Tag color={colorMap[val] || 'default'} style={{ margin: 0 }}>{val}</Tag> : ''
      },
    },
    {
      title: '神殿',
      dataIndex: '神殿',
      render: (val: string) => val || '',
    },
    {
      title: '无效量',
      dataIndex: '是否无效量',
      render: (val: number, record: ConsultationRecord) => {
        if (val === 1) {
          return (
            <Tag color="red" title={record.无效原因 || '无效量'}>
              无效
            </Tag>
          )
        }
        return <Tag color="green">有效</Tag>
      },
    },
    {
      title: '操作',
      width: 280,
      fixed: 'right' as const,
      render: (_: any, record: ConsultationRecord) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          <Tooltip title="查看/添加沟通记录">
            <Button
              type="link"
              size="small"
              icon={<MessageOutlined />}
              onClick={() => {
                const key = record.记录ID
                const newKeys = expandedRowKeys.includes(key)
                  ? expandedRowKeys.filter(k => k !== key)
                  : [...expandedRowKeys, key]
                setExpandedRowKeys(newKeys)
              }}
            >
              沟通
            </Button>
          </Tooltip>
          <Tooltip title="查看/管理缴费记录">
            <Button
              type="link"
              size="small"
              icon={<DollarOutlined />}
              onClick={() => {
                setPaymentRecord(record)
                setPaymentVisible(true)
              }}
            >
              缴费
            </Button>
          </Tooltip>
          <Tooltip title="转移到其他神殿">
            <Button
              type="link"
              size="small"
              icon={<SwapOutlined />}
              onClick={() => handleOpenTransfer(record)}
            >
              神殿转量
            </Button>
          </Tooltip>
          <Tooltip title="转给其他咨询师">
            <Button
              type="link"
              size="small"
              icon={<UserSwitchOutlined />}
              onClick={() => handleOpenConsultantTransfer(record)}
            >
              咨询师转量
            </Button>
          </Tooltip>
          <Popconfirm
            title="确定删除此记录？"
            onConfirm={() => handleDelete(record.记录ID)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <Card title="咨询量列表">
      {/* 统计摘要 */}
      <div
        style={{
          marginBottom: 12,
          padding: '8px 12px',
          background: '#fafafa',
          border: '1px solid #e8e8e8',
          borderRadius: 4,
          display: 'flex',
          alignItems: 'center',
          gap: 24,
        }}
      >
        <span style={{ color: '#1890ff', fontWeight: 600 }}>
          当天新量：<span style={{ fontSize: 16 }}>{statsTodayNew}</span>
        </span>
        <span style={{ color: '#52c41a', fontWeight: 600 }}>
          当天已分配：<span style={{ fontSize: 16 }}>{statsTodayDistributed}</span>
        </span>
        <span
          style={{
            color: filters.is_unassigned === 1 ? '#fff' : '#ff4d4f',
            fontWeight: 600,
            cursor: 'pointer',
            padding: '2px 8px',
            borderRadius: 4,
            background: filters.is_unassigned === 1 ? '#ff4d4f' : 'transparent',
            transition: 'all 0.2s',
          }}
          onClick={() => {
            if (filters.is_unassigned === 1) {
              setFilters({ ...filters, is_unassigned: undefined, consultant: undefined })
            } else {
              setFilters({ ...filters, is_unassigned: 1, consultant: undefined })
            }
            setPage(1)
          }}
        >
          未分配：<span style={{ fontSize: 16 }}>{statsUnassigned}</span>
        </span>
        <span style={{ color: '#722ed1', fontWeight: 600 }}>
          有效量总数：<span style={{ fontSize: 16 }}>{statsTotal}</span>
        </span>
      </div>

      {/* 咨询师统计区域 - 参考老系统样式 */}
      <div 
        style={{ 
          marginBottom: 16, 
          padding: '8px 12px',
          background: '#fff',
          border: '1px solid #e8e8e8',
          borderRadius: 4,
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 0,
        }}
      >
        <span style={{ marginRight: 12, color: '#666', fontWeight: 500 }}>咨询师：</span>
        {statsLoading ? (
          <span style={{ color: '#999' }}>加载中...</span>
        ) : consultantStats.length > 0 ? (
          <>
            {consultantStats.map((item, index) => (
              <span
                key={item.name}
                onClick={() => {
                  // 点击切换筛选
                  if (item.name === '未分配') {
                    // 未分配使用 is_unassigned 参数
                    if (filters.is_unassigned === 1) {
                      setFilters({ ...filters, is_unassigned: undefined, consultant: undefined })
                    } else {
                      setFilters({ ...filters, is_unassigned: 1, consultant: undefined })
                    }
                  } else if (filters.consultant === item.name) {
                    setFilters({ ...filters, consultant: undefined, is_unassigned: undefined })
                  } else {
                    setFilters({ ...filters, consultant: item.name, is_unassigned: undefined })
                  }
                  setPage(1)
                }}
                style={{
                  cursor: 'pointer',
                  padding: '4px 8px',
                  margin: '2px 0',
                  borderRadius: 3,
                  background: (item.name === '未分配' ? filters.is_unassigned === 1 : filters.consultant === item.name) ? '#1890ff' : 'transparent',
                  color: (item.name === '未分配' ? filters.is_unassigned === 1 : filters.consultant === item.name) ? '#fff' : (item.name === '未分配' ? '#f5222d' : '#1890ff'),
                  fontWeight: (item.name === '未分配' ? filters.is_unassigned === 1 : filters.consultant === item.name) ? 600 : 400,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  const isActive = item.name === '未分配' ? filters.is_unassigned === 1 : filters.consultant === item.name
                  if (!isActive) {
                    e.currentTarget.style.background = '#e6f7ff'
                  }
                }}
                onMouseLeave={(e) => {
                  const isActive = item.name === '未分配' ? filters.is_unassigned === 1 : filters.consultant === item.name
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent'
                  }
                }}
              >
                {item.name}({item.count}){item.todayCount > 0 && <span style={{ color: (item.name === '未分配' ? filters.is_unassigned === 1 : filters.consultant === item.name) ? '#fff' : '#52c41a', fontSize: 11 }}>/今+{item.todayCount}</span>}
              </span>
            ))}
            <span style={{ 
              marginLeft: 12, 
              padding: '4px 8px',
              background: '#52c41a',
              color: '#fff',
              borderRadius: 3,
              fontWeight: 600,
            }}>
              有效量合计({statsTotal})
            </span>
          </>
        ) : (
          <span style={{ color: '#999' }}>暂无数据</span>
        )}
      </div>

      {/* 筛选区域 */}
      <div style={{ marginBottom: 16 }}>
        {/* 第一行：关键字搜索 + 基础搜索 */}
        <Row gutter={[12, 12]}>
          <Col span={6}>
            <Input.Search
              placeholder="关键字搜索（电话、姓名、备注、位置等）"
              value={filters.keyword}
              onChange={e => setFilters({ ...filters, keyword: e.target.value })}
              onSearch={handleSearch}
              allowClear
              enterButton
            />
          </Col>
          <Col span={3}>
            <Input
              placeholder="电话号码"
              value={filters.phone}
              onChange={e => setFilters({ ...filters, phone: e.target.value })}
              allowClear
            />
          </Col>
          <Col span={3}>
            <Input
              placeholder="咨询者姓名"
              value={filters.name}
              onChange={e => setFilters({ ...filters, name: e.target.value })}
              allowClear
            />
          </Col>
          <Col span={3}>
            <Input
              placeholder="咨询师"
              value={filters.consultant}
              onChange={e => setFilters({ ...filters, consultant: e.target.value })}
              allowClear
            />
          </Col>
          <Col span={3}>
            <Select
              placeholder="状态"
              value={filters.status}
              onChange={val => setFilters({ ...filters, status: val })}
              allowClear
              style={{ width: '100%' }}
            >
              {statusOptions.map(opt => (
                <Select.Option key={opt} value={opt}>{opt}</Select.Option>
              ))}
            </Select>
          </Col>
          <Col span={6}>
            <RangePicker
              showTime={{ format: 'HH:mm' }}
              format="YYYY-MM-DD HH:mm"
              placeholder={['开始时间', '结束时间']}
              style={{ width: '100%' }}
              value={
                filters.start_date && filters.end_date
                  ? [dayjs(filters.start_date), dayjs(filters.end_date)]
                  : undefined
              }
              onChange={(dates) => {
                if (dates) {
                  setFilters({
                    ...filters,
                    start_date: dates[0]?.format('YYYY-MM-DD HH:mm'),
                    end_date: dates[1]?.format('YYYY-MM-DD HH:mm'),
                  })
                } else {
                  setFilters({
                    ...filters,
                    start_date: undefined,
                    end_date: undefined,
                  })
                }
              }}
              onOk={() => {
                setPage(1)
                loadData()
              }}
            />
          </Col>
        </Row>
        
        {/* 第二行：来源三级联动 + 其他筛选 */}
        <Row gutter={[12, 12]} style={{ marginTop: 12 }}>
          <Col span={3}>
            <Select
              placeholder="量来源"
              value={filters.source}
              onChange={val => setFilters({ ...filters, source: val, specific_source: undefined, media_source: undefined })}
              allowClear
              style={{ width: '100%' }}
            >
              {sourceOptions.map(opt => (
                <Select.Option key={opt} value={opt}>{opt}</Select.Option>
              ))}
            </Select>
          </Col>
          <Col span={3}>
            <Select
              placeholder="来源类别"
              value={filters.specific_source}
              onChange={val => setFilters({ ...filters, specific_source: val, media_source: undefined })}
              allowClear
              style={{ width: '100%' }}
            >
              {(() => {
                // 根据选择的量来源获取来源类别
                const sourceNode = mediaHierarchy.find(s => s.name === filters.source)
                if (sourceNode && sourceNode.children.length > 0) {
                  return sourceNode.children.map(cat => (
                    <Select.Option key={cat.name} value={cat.name}>{cat.name}</Select.Option>
                  ))
                }
                // 如果没有选择量来源，显示所有来源类别
                return mediaHierarchy.flatMap(s => 
                  s.children.map(cat => (
                    <Select.Option key={`${s.name}-${cat.name}`} value={cat.name}>{cat.name}</Select.Option>
                  ))
                )
              })()}
            </Select>
          </Col>
          <Col span={3}>
            <Select
              placeholder="具体来源"
              value={filters.media_source}
              onChange={val => setFilters({ ...filters, media_source: val })}
              allowClear
              showSearch
              style={{ width: '100%' }}
            >
              {(() => {
                // 根据选择的来源类别获取具体来源
                if (filters.specific_source) {
                  for (const source of mediaHierarchy) {
                    const category = source.children.find(
                      (c): c is MediaHierarchyNode =>
                        isMediaHierarchyNode(c) && c.name === filters.specific_source,
                    )
                    if (category && category.children.length > 0) {
                      return category.children.map(opt => (
                        <Select.Option key={opt} value={opt}>{opt}</Select.Option>
                      ))
                    }
                  }
                }
                // 如果选择了量来源但没选来源类别
                if (filters.source) {
                  const sourceNode = mediaHierarchy.find(s => s.name === filters.source)
                  if (sourceNode) {
                    return sourceNode.children.flatMap(cat => 
                      cat.children.map(opt => (
                        <Select.Option key={opt} value={opt}>{opt}</Select.Option>
                      ))
                    )
                  }
                }
                // 否则显示所有具体来源（按组分类）
                return mediaSourceOptions.map((opt) => (
                  <Select.Option key={opt} value={opt}>{opt}</Select.Option>
                ))
              })()}
            </Select>
          </Col>
          <Col span={3}>
            <Select
              placeholder="学历"
              value={filters.education}
              onChange={val => setFilters({ ...filters, education: val })}
              allowClear
              showSearch
              style={{ width: '100%' }}
            >
              {educationOptions.map(opt => (
                <Select.Option key={opt} value={opt}>{opt}</Select.Option>
              ))}
            </Select>
          </Col>
          <Col span={3}>
            <Select
              placeholder="神殿"
              value={filters.campus}
              onChange={val => setFilters({ ...filters, campus: val })}
              allowClear
              style={{ width: '100%' }}
              disabled={!!campus}  // 如果父组件传入了campus，则禁用
            >
              {allCampuses.map(c => (
                <Select.Option key={c.name} value={c.name}>{c.name}</Select.Option>
              ))}
            </Select>
          </Col>
          <Col span={3}>
            <Select
              placeholder="有效/无效"
              value={filters.is_invalid}
              onChange={val => setFilters({ ...filters, is_invalid: val })}
              allowClear
              style={{ width: '100%' }}
            >
              <Select.Option value={0}>有效量</Select.Option>
              <Select.Option value={1}>无效量</Select.Option>
            </Select>
          </Col>
          <Col span={3}>
            <Input
              placeholder="口碑提供人"
              value={filters.referrer}
              onChange={e => setFilters({ ...filters, referrer: e.target.value })}
              allowClear
            />
          </Col>
          <Col span={3}>
            <Select
              placeholder="咨询类别"
              value={filters.category}
              onChange={val => setFilters({ ...filters, category: val })}
              allowClear
              showSearch
              style={{ width: '100%' }}
            >
              {categoryOptions.map(opt => (
                <Select.Option key={opt} value={opt}>{opt}</Select.Option>
              ))}
            </Select>
          </Col>
        </Row>
        
        {/* 第三行：操作按钮 */}
        <Row style={{ marginTop: 12 }}>
          <Col span={24}>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                搜索
              </Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>
                重置
              </Button>
              <Tooltip title="导入口碑/渠道/网络/任意/旧量来源咨询量">
                <Button 
                  icon={<ImportOutlined />} 
                  onClick={() => setImportVisible(true)}
                >
                  导入
                </Button>
              </Tooltip>
              <Tooltip title="导出数据需要申请审批">
                <Button 
                  icon={<ExportOutlined />} 
                  onClick={() => setExportModalVisible(true)}
                >
                  申请导出
                </Button>
              </Tooltip>
              <Tooltip title="查看我的导出申请和下载已审批的数据">
                <Button 
                  icon={<DownloadOutlined />} 
                  onClick={handleShowExportHistory}
                >
                  我的导出
                </Button>
              </Tooltip>
              {!handoverMode ? (
                <Tooltip title="点击进入交接模式，筛选出可交接的报名/订座记录">
                  <Button 
                    icon={<SwapOutlined />} 
                    onClick={enterHandoverMode}
                  >
                    交接
                  </Button>
                </Tooltip>
              ) : (
                <Space>
                  <Button type="primary" onClick={selectAllHandoverable}>
                    {selectedRowKeys.length === handoverRecords.length && handoverRecords.length > 0 
                      ? '取消全选' 
                      : `全选 (${handoverRecords.length})`}
                  </Button>
                  <Button 
                    type="primary"
                    icon={<SwapOutlined />} 
                    onClick={handleHandover}
                    disabled={selectedRowKeys.length === 0}
                  >
                    确认交接 {selectedRowKeys.length > 0 && `(${selectedRowKeys.length})`}
                  </Button>
                  <Button onClick={exitHandoverMode}>
                    退出交接模式
                  </Button>
                </Space>
              )}
            </Space>
          </Col>
        </Row>
      </div>

      {/* 交接模式提示 */}
      {handoverMode && (
        <div style={{ 
          padding: '8px 16px', 
          background: '#e6f7ff', 
          borderRadius: 4, 
          marginBottom: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>
            <SwapOutlined style={{ marginRight: 8, color: '#1890ff' }} />
            交接模式：当前神殿共 <strong>{handoverTotal}</strong> 条可交接记录（报名/订座且未交接）
            {selectedRowKeys.length > 0 && `，已选择 ${selectedRowKeys.length} 条`}
          </span>
        </div>
      )}

      {/* 数据表格 - 禁止复制 */}
      <NoCopyContainer warningMessage="咨询量数据禁止复制">
        <Table
          bordered
          size="small"
          columns={columns}
          dataSource={displayRecords}
          rowKey="记录ID"
          loading={loading}
          scroll={{ x: 'max-content' }}
          style={{ whiteSpace: 'nowrap', tableLayout: 'auto' }}
          expandable={{
            expandedRowKeys,
            onExpand: (expanded, record) => {
              const key = record.记录ID
              setExpandedRowKeys(prev => expanded ? [...prev, key] : prev.filter(k => k !== key))
            },
            expandedRowRender: (record) => (
              <CommunicationInlineList 
                recordId={record.记录ID} 
                consultantName={
                  user?.name || user?.username || ''
                } 
              />
            ),
            rowExpandable: (record) => true,
          }}
          rowSelection={handoverMode ? {
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys as number[]),
          } : undefined}
          pagination={handoverMode ? false : {
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: (p, ps) => {
            setPage(p)
            setPageSize(ps)
          },
        }}
      />
      </NoCopyContainer>

      {/* 导出申请弹窗 */}
      <Modal
        title="申请导出咨询量数据"
        open={exportModalVisible}
        onOk={handleExportRequest}
        onCancel={() => {
          setExportModalVisible(false)
          setExportReason('')
        }}
        confirmLoading={exportLoading}
        okText="提交申请"
        cancelText="取消"
      >
        <div style={{ marginBottom: 16 }}>
          <p>当前筛选条件下共 <Tag color="blue">{total}</Tag> 条记录</p>
          <p style={{ color: '#999', fontSize: 12 }}>导出数据需要经过审批人审批通过后才能下载</p>
        </div>
        <Form layout="vertical">
          <Form.Item label="导出原因" required>
            <Input.TextArea
              rows={4}
              value={exportReason}
              onChange={e => setExportReason(e.target.value)}
              placeholder="请详细说明导出数据的用途和原因..."
              maxLength={500}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 我的导出记录弹窗 */}
      <Modal
        title="我的导出记录"
        open={exportHistoryVisible}
        onCancel={() => setExportHistoryVisible(false)}
        footer={null}
        width={800}
      >
        <Table
          dataSource={exportHistoryData}
          rowKey="id"
          loading={exportHistoryLoading}
          size="small"
          pagination={false}
          columns={[
            {
              title: '申请ID',
              dataIndex: 'id',
              width: 70,
            },
            {
              title: '记录数',
              dataIndex: 'total_records',
              width: 80,
              render: (val: number, record: exportApi.ExportRequest) => {
                if (val === 0 && record.status === 'approved') {
                  return <Tag color="blue">下载后更新</Tag>
                }
                return <Tag color="blue">{val}条</Tag>
              },
            },
            {
              title: '状态',
              dataIndex: 'status',
              width: 100,
              render: (val: string) => {
                const statusMap: Record<string, { color: string; text: string }> = {
                  pending: { color: 'orange', text: '待审批' },
                  approved: { color: 'green', text: '已通过' },
                  rejected: { color: 'red', text: '已驳回' },
                }
                const status = statusMap[val] || { color: 'default', text: val }
                return <Tag color={status.color}>{status.text}</Tag>
              },
            },
            {
              title: '申请时间',
              dataIndex: 'created_at',
              width: 160,
              render: (val: string) => val ? dayjs(val).format('YYYY-MM-DD HH:mm') : '-',
            },
            {
              title: '过期时间',
              dataIndex: 'download_expires_at',
              width: 160,
              render: (val: string, record: exportApi.ExportRequest) => {
                if (record.status !== 'approved') return '-'
                if (!val) return '-'
                const isExpired = dayjs(val).isBefore(dayjs())
                return (
                  <span style={{ color: isExpired ? 'red' : 'inherit' }}>
                    {dayjs(val).format('YYYY-MM-DD HH:mm')}
                    {isExpired && ' (已过期)'}
                  </span>
                )
              },
            },
            {
              title: '操作',
              width: 120,
              render: (_: any, record: exportApi.ExportRequest) => {
                if (record.status === 'approved') {
                  const isExpired = record.download_expires_at && dayjs(record.download_expires_at).isBefore(dayjs())
                  return (
                    <Button
                      type="primary"
                      size="small"
                      icon={<DownloadOutlined />}
                      disabled={isExpired}
                      onClick={() => handleDownloadExport(record.id)}
                    >
                      下载
                    </Button>
                  )
                }
                if (record.status === 'rejected') {
                  return (
                    <Tooltip title={record.approval_comment || '驳回'}>
                      <Tag color="red">已驳回</Tag>
                    </Tooltip>
                  )
                }
                return <Tag color="orange">等待审批</Tag>
              },
            },
          ]}
        />
        <div style={{ marginTop: 16, color: '#999', fontSize: 12 }}>
          <p>• 审批通过后可下载数据，下载链接有效期为7天</p>
          <p>• 每次审批通过后只能下载一次，如需再次导出请重新申请</p>
        </div>
      </Modal>

      {/* 详情抽屉 */}
      <ConsultationDetail
        visible={detailVisible}
        onClose={() => setDetailVisible(false)}
        data={detailData}
        loading={detailLoading}
      />

      <Modal
        title={`编辑咨询记录${editRecord ? ` - ${editRecord.电话 || editRecord.微信 || ''}` : ''}`}
        open={editVisible}
        onOk={handleEditSubmit}
        onCancel={() => setEditVisible(false)}
        confirmLoading={editLoading}
        width="100vw"
        okText="保存"
        cancelText="取消"
        style={{ top: 0, paddingBottom: 0, maxWidth: '100vw' }}
        styles={{ body: { height: 'calc(100vh - 110px)', overflowY: 'auto', padding: '12px 24px' } }}
      >
        <Form
          form={editForm}
          layout="vertical"
          size="small"
          onValuesChange={handleEditSignupLinkage}
        >
                  {/* 基本身份 */}
                  <Divider orientation="left" style={{ margin: '0 0 8px 0', fontSize: 13 }}>基本信息</Divider>
                    <Row gutter={12}>
                      <Col span={4}>
                        <Form.Item 
                          label={
                            <span>
                              电话
                              {isPhoneEditDisabled(editRecord) && (
                                <Tooltip title="录入超过20分钟，已有电话不可修改">
                                  <span style={{ color: '#ff4d4f', marginLeft: 4, fontSize: 12 }}>（锁定）</span>
                                </Tooltip>
                              )}
                            </span>
                          } 
                          name="电话"
                          style={{ marginBottom: 8 }}
                        >
                          <Input 
                            placeholder="电话号码" 
                            disabled={isPhoneEditDisabled(editRecord)}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={3}>
                        <Form.Item label="姓名" name="咨询者姓名" style={{ marginBottom: 8 }}>
                          <Input placeholder="咨询者姓名" />
                        </Form.Item>
                      </Col>
                      <Col span={3}>
                        <Form.Item label="性别" name="性别" style={{ marginBottom: 8 }}>
                          <Radio.Group>
                            <Radio value="男">男</Radio>
                            <Radio value="女">女</Radio>
                          </Radio.Group>
                        </Form.Item>
                      </Col>
                      <Col span={2}>
                        <Form.Item label="年龄" name="年龄" style={{ marginBottom: 8 }}>
                          <Input placeholder="年龄" />
                        </Form.Item>
                      </Col>
                      <Col span={3}>
                        <Form.Item label="学历" name="学历" style={{ marginBottom: 8 }}>
                          <Select placeholder="学历" allowClear showSearch>
                            {educationOptions.map(opt => (
                              <Select.Option key={opt} value={opt}>{opt}</Select.Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={3}>
                        <Form.Item label="状态" name="状态" style={{ marginBottom: 8 }}>
                          <Select placeholder="状态" allowClear>
                            {statusOptions.map(opt => (
                              <Select.Option key={opt} value={opt}>{opt}</Select.Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={3}>
                        <Form.Item label="报名意向" name="报名意向" style={{ marginBottom: 8 }}>
                          <Select placeholder="意向" allowClear>
                            {intentionOptions.map(opt => (
                              <Select.Option key={opt} value={opt}>{opt}</Select.Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={3}>
                        <Form.Item label="微信" name="微信" style={{ marginBottom: 8 }}>
                          <Input placeholder="微信" />
                        </Form.Item>
                      </Col>
                    </Row>

                  {/* 来源信息 */}
                  <Divider orientation="left" style={{ margin: '4px 0 8px 0', fontSize: 13 }}>来源与人员</Divider>
                    <Row gutter={12}>
                      <Col span={3}>
                        <Form.Item label="量来源" name="量来源" style={{ marginBottom: 8 }}>
                          <Select 
                            placeholder="量来源" 
                            allowClear
                            onChange={(val) => {
                              setEditSelectedSource(val)
                              setEditSelectedCategory(null)
                              editForm.setFieldsValue({ '来源类别': undefined, '媒体来源': undefined })
                            }}
                          >
                            {sourceOptions.map(opt => (
                              <Select.Option key={opt} value={opt}>{opt}</Select.Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={3}>
                        <Form.Item label="来源类别" name="来源类别" style={{ marginBottom: 8 }}>
                          <Select 
                            placeholder="类别" 
                            allowClear
                            onChange={(val) => {
                              setEditSelectedCategory(val)
                              editForm.setFieldsValue({ '媒体来源': undefined })
                            }}
                          >
                            {(() => {
                              if (!editSelectedSource) return null
                              const sourceNode = mediaHierarchy.find(s => s.name === editSelectedSource)
                              return sourceNode?.children.map(cat => (
                                <Select.Option key={cat.name} value={cat.name}>{cat.name}</Select.Option>
                              ))
                            })()}
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={4}>
                        <Form.Item label="具体来源" name="媒体来源" style={{ marginBottom: 8 }}>
                          <Select placeholder="具体来源" allowClear showSearch>
                            {(() => {
                              if (editSelectedCategory) {
                                for (const source of mediaHierarchy) {
                                  const category = source.children.find(
                                    (c): c is MediaHierarchyNode =>
                                      isMediaHierarchyNode(c) && c.name === editSelectedCategory,
                                  )
                                  if (category && category.children.length > 0) {
                                    return category.children.map(opt => (
                                      <Select.Option key={opt} value={opt}>{opt}</Select.Option>
                                    ))
                                  }
                                }
                              }
                              return mediaSourceOptions.map((opt) => (
                                <Select.Option key={opt} value={opt}>{opt}</Select.Option>
                              ))
                            })()}
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={3}>
                        <Form.Item label="咨询类别" name="咨询类别" style={{ marginBottom: 8 }}>
                          <Select placeholder="类别" allowClear>
                            {categoryOptions.map(opt => (
                              <Select.Option key={opt} value={opt}>{opt}</Select.Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={3}>
                        <Form.Item label="咨询师" name="咨询师" style={{ marginBottom: 8 }}
                          tooltip={isConsultant ? '咨询师身份不可修改此字段' : undefined}
                        >
                          <Select placeholder="咨询师" allowClear showSearch disabled={isConsultant}>
                            {consultantOptions.map(opt => (
                              <Select.Option key={opt} value={opt}>{opt}</Select.Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={3}>
                        <Form.Item label="分量人" name="分量人" style={{ marginBottom: 8 }}>
                          <Input placeholder="分量人" />
                        </Form.Item>
                      </Col>
                      <Col span={5}>
                        <Form.Item label="家庭住址" name="位置" style={{ marginBottom: 8 }}>
                          <Input placeholder="家庭住址" prefix={<EnvironmentOutlined />} />
                        </Form.Item>
                      </Col>
                    </Row>

                    {/* 条件显示：口碑/渠道/关键字 */}
                    <Row gutter={12}>
                      {(editSelectedSource === '口碑' || editSelectedSource === '神殿新媒体') && (
                        <Col span={4}>
                          <Form.Item 
                            label={editSelectedSource === '神殿新媒体' ? '新媒体介绍人' : '口碑提供人'} 
                            name="口碑提供人"
                            style={{ marginBottom: 8 }}
                          >
                            <Input placeholder={editSelectedSource === '神殿新媒体' ? '新媒体介绍人姓名' : '口碑提供人姓名'} />
                          </Form.Item>
                        </Col>
                      )}
                      {editSelectedSource === '渠道' && (
                        <>
                          <Col span={4}>
                            <Form.Item label="县办" name="县办" style={{ marginBottom: 8 }}>
                              <Input placeholder="县办" />
                            </Form.Item>
                          </Col>
                          <Col span={4}>
                            <Form.Item label="乡办" name="乡办" style={{ marginBottom: 8 }}>
                              <Input placeholder="乡办" />
                            </Form.Item>
                          </Col>
                          <Col span={4}>
                            <Form.Item label="信息员" name="信息员" style={{ marginBottom: 8 }}>
                              <Input placeholder="信息员" />
                            </Form.Item>
                          </Col>
                          <Col span={4}>
                            <Form.Item label="渠道专员" name="渠道专员" style={{ marginBottom: 8 }}>
                              <Select placeholder="渠道专员姓名" allowClear showSearch
                                filterOption={(input, option) =>
                                  (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase()) ?? false
                                }
                              >
                                {channelStaffOptions.map(name => (
                                  <Select.Option key={name} value={name}>{name}</Select.Option>
                                ))}
                              </Select>
                            </Form.Item>
                          </Col>
                        </>
                      )}
                      <Col span={(editSelectedSource === '口碑' || editSelectedSource === '神殿新媒体') ? 20 : (editSelectedSource === '渠道' ? 16 : 24)}>
                        <Form.Item label="关键字" name="关键字" style={{ marginBottom: 8 }}>
                          <Input.TextArea rows={1} autoSize={{ minRows: 1, maxRows: 3 }} placeholder="关键字" />
                        </Form.Item>
                      </Col>
                    </Row>

                  {/* 状态标记 */}
                  <Divider orientation="left" style={{ margin: '4px 0 8px 0', fontSize: 13 }}>状态标记</Divider>
                    <Row gutter={8} align="middle" style={{ marginBottom: 8 }}>
                      <Col>
                        <Space size="large" wrap>
                          <Form.Item name="是否无效量" valuePropName="checked" noStyle><Checkbox>无效量</Checkbox></Form.Item>
                          <Form.Item name="是否不算量" valuePropName="checked" noStyle><Checkbox>不算量</Checkbox></Form.Item>
                          <Form.Item name="是否上门" valuePropName="checked" noStyle><Checkbox>上门</Checkbox></Form.Item>
                          <Form.Item name="是否报名" valuePropName="checked" noStyle><Checkbox>报名</Checkbox></Form.Item>
                          <Form.Item name="是否订座" valuePropName="checked" noStyle><Checkbox>订座</Checkbox></Form.Item>
                          <Form.Item name="是否校园量" valuePropName="checked" noStyle><Checkbox>校园量</Checkbox></Form.Item>
                          <Form.Item
                            noStyle
                            shouldUpdate={(prevValues, currentValues) => 
                              prevValues.是否报名 !== currentValues.是否报名 ||
                              prevValues.是否订座 !== currentValues.是否订座
                            }
                          >
                            {({ getFieldValue }) => {
                              const canRefund = getFieldValue('是否报名') || getFieldValue('是否订座');
                              return (
                                <Form.Item name="是否退费" valuePropName="checked" noStyle>
                                  <Checkbox disabled={!canRefund}>退费</Checkbox>
                                </Form.Item>
                              );
                                }}
                              </Form.Item>
                           </Space>
                      </Col>
                    </Row>

                    <Row gutter={12}>
                        <Col span={6}>
                           <Form.Item
                              noStyle
                              shouldUpdate={(prevValues, currentValues) => 
                                prevValues.是否无效量 !== currentValues.是否无效量
                              }
                            >
                              {({ getFieldValue }) => 
                                getFieldValue('是否无效量') ? (
                                  <Form.Item label="无效原因" name="无效原因" style={{ marginBottom: 8 }}>
                                    <Input placeholder="请填写无效原因" />
                                  </Form.Item>
                                ) : null
                              }
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                           <Form.Item
                              noStyle
                              shouldUpdate={(prevValues, currentValues) => 
                                prevValues.是否不算量 !== currentValues.是否不算量
                              }
                            >
                              {({ getFieldValue }) => 
                                getFieldValue('是否不算量') ? (
                                  <Form.Item label="不算量原因" name="不算量原因" style={{ marginBottom: 8 }}>
                                    <Input placeholder="请填写不算量原因" />
                                  </Form.Item>
                                ) : null
                              }
                            </Form.Item>
                        </Col>
                        <Col span={4}>
                          <Form.Item label="上门时间" name="上门时间" style={{ marginBottom: 8 }}>
                            <DatePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                    </Row>

                      {/* 报名相关 - 仅在勾选是否报名时显示 */}
                      <Form.Item
                        noStyle
                        shouldUpdate={(prevValues, currentValues) => 
                          prevValues.是否报名 !== currentValues.是否报名
                        }
                      >
                        {({ getFieldValue }) => 
                          getFieldValue('是否报名') ? (
                            <>
                              <Divider style={{ margin: '4px 0 8px 0' }} dashed orientation="left">报名信息</Divider>
                              <Row gutter={12}>
                                <Col span={4}>
                                  <Form.Item label="报名时间" name="报名时间" style={{ marginBottom: 8 }}>
                                    <DatePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} />
                                  </Form.Item>
                                </Col>
                                <Col span={4}>
                                  <Form.Item label="就读学校" name="就读学校" style={{ marginBottom: 8 }}>
                                    <Input placeholder="就读学校" />
                                  </Form.Item>
                                </Col>
                                <Col span={4}>
                                  <Form.Item label="报名专业" name="报名专业" style={{ marginBottom: 8 }}>
                                    <Input placeholder="报名专业" />
                                  </Form.Item>
                                </Col>
                                <Col span={3}>
                                  <Form.Item label="报名学制" name="长期短期" style={{ marginBottom: 8 }}>
                                    <Select placeholder="学制" allowClear>
                                      <Select.Option value="长期">长期</Select.Option>
                                      <Select.Option value="短期">短期</Select.Option>
                                      <Select.Option value="两年制">两年制</Select.Option>
                                      <Select.Option value="三年制">三年制</Select.Option>
                                    </Select>
                                  </Form.Item>
                                </Col>
                                <Col span={3}>
                                  <Form.Item label="课程" name="课程" style={{ marginBottom: 8 }}>
                                    <Input placeholder="课程" />
                                  </Form.Item>
                                </Col>
                                <Col span={6}>
                                  <Form.Item label="付款方式" style={{ marginBottom: 8 }}>
                                    <Space>
                                      <Form.Item name="全款" valuePropName="checked" noStyle><Checkbox>全款</Checkbox></Form.Item>
                                      <Form.Item name="分期" valuePropName="checked" noStyle><Checkbox>分期</Checkbox></Form.Item>
                                      <Form.Item name="注册" valuePropName="checked" noStyle><Checkbox>注册</Checkbox></Form.Item>
                                      <Form.Item name="贷款" valuePropName="checked" noStyle><Checkbox>贷款</Checkbox></Form.Item>
                                    </Space>
                                  </Form.Item>
                                </Col>
                              </Row>
                              <Row gutter={12}>
                                <Col span={4}>
                                  <Form.Item label="咨询时间" name="咨询时间" style={{ marginBottom: 8 }}>
                                    <DatePicker showTime format="YYYY-MM-DD HH:mm:ss" placeholder="咨询时间" style={{ width: '100%' }} />
                                  </Form.Item>
                                </Col>
                                <Col span={8}>
                                  <Form.Item label="详细地址" name="详细地址" style={{ marginBottom: 8 }}>
                                    <Input placeholder="详细地址" />
                                  </Form.Item>
                                </Col>
                                {/* 分期备注 */}
                                <Form.Item
                                  noStyle
                                  shouldUpdate={(prevValues, currentValues) => 
                                    prevValues.分期 !== currentValues.分期
                                  }
                                >
                                  {({ getFieldValue }) => 
                                    getFieldValue('分期') ? (
                                      <Col span={8}>
                                        <Form.Item label="分期备注" name="分期备注" style={{ marginBottom: 8 }}>
                                          <Input placeholder="分期备注（如分期方式、期数等）" />
                                        </Form.Item>
                                      </Col>
                                    ) : null
                                  }
                                </Form.Item>
                              </Row>
                            </>
                          ) : null
                        }
                      </Form.Item>

                      {/* 订座相关 */}
                      <Form.Item
                        noStyle
                        shouldUpdate={(prevValues, currentValues) => 
                          prevValues.是否订座 !== currentValues.是否订座
                        }
                      >
                        {({ getFieldValue }) => 
                          getFieldValue('是否订座') ? (
                            <Row gutter={12}>
                              <Col span={4}>
                                <Form.Item label="订座时间" name="订座时间" style={{ marginBottom: 8 }}>
                                  <DatePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} />
                                </Form.Item>
                              </Col>
                              <Col span={4}>
                                <Form.Item label="订座金额" name="订座金额" style={{ marginBottom: 8 }}>
                                  <InputNumber placeholder="订座金额" style={{ width: '100%' }} min={0} />
                                </Form.Item>
                              </Col>
                            </Row>
                          ) : null
                        }
                      </Form.Item>

                      {/* 缴费金额 */}
                      <Form.Item
                        noStyle
                        shouldUpdate={(prevValues, currentValues) => 
                          prevValues.是否报名 !== currentValues.是否报名 ||
                          prevValues.是否订座 !== currentValues.是否订座
                        }
                      >
                        {({ getFieldValue }) => 
                          (getFieldValue('是否报名') || getFieldValue('是否订座')) ? (
                            <Row gutter={12}>
                              <Col span={4}>
                                <Form.Item label="缴费金额" name="缴费金额" style={{ marginBottom: 8 }}>
                                  <InputNumber placeholder="缴费金额" style={{ width: '100%' }} min={0} />
                                </Form.Item>
                              </Col>
                            </Row>
                          ) : null
                        }
                      </Form.Item>

                      {/* 退费信息 */}
                      <Form.Item
                        noStyle
                        shouldUpdate={(prevValues, currentValues) => 
                          prevValues.是否退费 !== currentValues.是否退费
                        }
                      >
                        {({ getFieldValue }) => 
                          getFieldValue('是否退费') ? (
                            <Row gutter={12}>
                              <Col span={4}>
                                <Form.Item label="退费金额" name="退费金额" style={{ marginBottom: 8 }}>
                                  <InputNumber placeholder="退费金额" style={{ width: '100%' }} min={0} />
                                </Form.Item>
                              </Col>
                              <Col span={8}>
                                <Form.Item label="退费原因" name="退费原因" style={{ marginBottom: 8 }}>
                                  <Input.TextArea rows={1} autoSize={{ minRows: 1, maxRows: 3 }} placeholder="请填写退费原因" />
                                </Form.Item>
                              </Col>
                            </Row>
                          ) : null
                        }
                      </Form.Item>

                  {/* 扩展信息 */}
                  <Divider orientation="left" style={{ margin: '4px 0 8px 0', fontSize: 13 }}>扩展信息</Divider>
                  <Row gutter={12}>
                    <Col span={3}>
                      <Form.Item label="QQ" name="QQ" style={{ marginBottom: 8 }}>
                        <Input placeholder="QQ" />
                      </Form.Item>
                    </Col>
                    <Col span={3}>
                      <Form.Item label="抖音" name="抖音" style={{ marginBottom: 8 }}>
                        <Input placeholder="抖音" />
                      </Form.Item>
                    </Col>
                    <Col span={3}>
                      <Form.Item label="快手" name="快手" style={{ marginBottom: 8 }}>
                        <Input placeholder="快手" />
                      </Form.Item>
                    </Col>
                    <Col span={3}>
                      <Form.Item label="网聊专员" name="网聊专员" style={{ marginBottom: 8 }}>
                        <Input placeholder="网聊专员" />
                      </Form.Item>
                    </Col>
                    <Col span={3}>
                      <Form.Item label="渠道专员" name="渠道专员" style={{ marginBottom: 8 }}>
                        <Select placeholder="渠道专员" allowClear showSearch
                          filterOption={(input, option) =>
                            (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase()) ?? false
                          }
                        >
                          {channelStaffOptions.map(name => (
                            <Select.Option key={name} value={name}>{name}</Select.Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={3}>
                      <Form.Item label="县办" name="县办" style={{ marginBottom: 8 }}>
                        <Input placeholder="县办" />
                      </Form.Item>
                    </Col>
                    <Col span={3}>
                      <Form.Item label="乡办" name="乡办" style={{ marginBottom: 8 }}>
                        <Input placeholder="乡办" />
                      </Form.Item>
                    </Col>
                    <Col span={3}>
                      <Form.Item label="信息员" name="信息员" style={{ marginBottom: 8 }}>
                        <Input placeholder="信息员" />
                      </Form.Item>
                    </Col>
                    <Col span={3}>
                      <Form.Item label="代咨" name="代咨" style={{ marginBottom: 8 }}>
                        <Input placeholder="代咨人" />
                      </Form.Item>
                    </Col>
                    <Col span={3}>
                      <Form.Item label="地区" name="地区" style={{ marginBottom: 8 }}>
                        <Input placeholder="地区" />
                      </Form.Item>
                    </Col>
                    <Col span={3}>
                      <Form.Item label="县" name="县" style={{ marginBottom: 8 }}>
                        <Input placeholder="县" />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={12}>
                    <Col span={3}>
                      <Form.Item label="目前状态" name="目前状态" style={{ marginBottom: 8 }}>
                        <Input placeholder="目前状态" />
                      </Form.Item>
                    </Col>
                    <Col span={4}>
                      <Form.Item label="咨询时间" name="咨询时间" style={{ marginBottom: 8 }}>
                        <DatePicker showTime format="YYYY-MM-DD HH:mm:ss" placeholder="咨询时间" style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item label="咨询结果" name="咨询结果" style={{ marginBottom: 8 }}>
                        <Input.TextArea placeholder="咨询结果" autoSize={{ minRows: 1, maxRows: 4 }} />
                      </Form.Item>
                    </Col>
                    <Col span={9}>
                      <Form.Item label="备注" name="备注" style={{ marginBottom: 8 }}>
                        <Input.TextArea rows={1} autoSize={{ minRows: 1, maxRows: 4 }} placeholder="备注信息" />
                      </Form.Item>
                    </Col>
                  </Row>
        </Form>
      </Modal>
      
      {/* 导入弹窗 */}
      <ConsultationImport
        visible={importVisible}
        onClose={() => {
          setImportVisible(false)
          loadData()
        }}
        onSuccess={() => {
          loadData()
        }}
        defaultCampus={campus}
      />
      
      {/* 转量弹窗 */}
      <Modal
        title={
          <Space>
            <SwapOutlined />
            转量操作
          </Space>
        }
        open={transferModalVisible}
        onCancel={() => {
          setTransferModalVisible(false)
          setTransferRecord(null)
          setBenefitPreview(null)
          setTargetCampusConsultants([])
          transferForm.resetFields()
        }}
        onOk={handleTransfer}
        confirmLoading={transferLoading}
        okText="确认转量"
        cancelText="取消"
        width={600}
      >
        {transferRecord && (
          <div>
            {/* 当前记录信息 */}
            <Descriptions
              title="当前咨询量信息"
              size="small"
              bordered
              column={2}
              style={{ marginBottom: 16 }}
            >
              <Descriptions.Item label="记录ID">{transferRecord.记录ID}</Descriptions.Item>
              <Descriptions.Item label="当前神殿">{transferRecord.神殿 || '-'}</Descriptions.Item>
              <Descriptions.Item label="咨询者">{transferRecord.咨询者姓名 || '-'}</Descriptions.Item>
              <Descriptions.Item label="电话">{transferRecord.电话}</Descriptions.Item>
              <Descriptions.Item label="咨询师">{transferRecord.咨询师 || '-'}</Descriptions.Item>
              <Descriptions.Item label="状态">{transferRecord.状态 || '-'}</Descriptions.Item>
              <Descriptions.Item label="是否上门">
                {transferRecord.是否上门 ? <Tag color="green">已上门</Tag> : <Tag>未上门</Tag>}
              </Descriptions.Item>
              <Descriptions.Item label="是否报名">
                {transferRecord.是否报名 ? <Tag color="blue">已报名</Tag> : <Tag>未报名</Tag>}
              </Descriptions.Item>
            </Descriptions>
            
            <Divider />
            
            {/* 转量表单 */}
            <Form
              form={transferForm}
              layout="vertical"
            >
              <Form.Item
                name="target_campus"
                label="目标神殿"
                rules={[{ required: true, message: '请选择目标神殿' }]}
              >
                <Select
                  placeholder="请选择要转入的神殿"
                  onChange={(val) => handlePreviewBenefit(val)}
                  showSearch
                  optionFilterProp="children"
                >
                  {transferCampuses
                    .filter(c => c.campus_name !== transferRecord.神殿)
                    .map(c => (
                      <Select.Option key={c.campus_name} value={c.campus_name}>
                        {c.campus_name} ({c.city})
                      </Select.Option>
                    ))}
                </Select>
              </Form.Item>
              
              <Form.Item
                name="new_consultant"
                label="新咨询师（可选）"
              >
                <Select
                  placeholder="可为转入神殿指定新的咨询师"
                  allowClear
                  showSearch
                  optionFilterProp="children"
                  disabled={targetCampusConsultants.length === 0}
                  notFoundContent={targetCampusConsultants.length === 0 ? "请先选择目标神殿" : "暂无咨询师"}
                >
                  {targetCampusConsultants.map(c => (
                    <Select.Option key={c} value={c}>{c}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
              
              <Form.Item
                name="reason"
                label="转量原因"
              >
                <Input.TextArea
                  rows={2}
                  placeholder="请输入转量原因（可选）"
                />
              </Form.Item>
            </Form>
            
            {/* 权益预览 */}
            {benefitLoading && <div style={{ textAlign: 'center', padding: 16 }}>加载权益信息...</div>}
            {benefitPreview && (
              <div style={{ background: '#f5f5f5', padding: 16, borderRadius: 4 }}>
                <h4 style={{ margin: '0 0 8px 0' }}>权益分配预览</h4>
                <Descriptions size="small" column={1}>
                  <Descriptions.Item label="转量类型">
                    <Tag color={benefitPreview.transfer_type === '同城转量' ? 'blue' : 'orange'}>
                      {benefitPreview.transfer_type}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="转量阶段">
                    <Tag color={
                      benefitPreview.transfer_stage === '上门前' ? 'default' :
                      benefitPreview.transfer_stage === '上门后' ? 'processing' : 'success'
                    }>
                      {benefitPreview.transfer_stage}
                    </Tag>
                  </Descriptions.Item>
                  {benefitPreview.benefit_info && (
                    <>
                      {benefitPreview.benefit_info.归属 && (
                        <Descriptions.Item label="归属">{benefitPreview.benefit_info.归属}</Descriptions.Item>
                      )}
                      {benefitPreview.benefit_info.报名量 && (
                        <Descriptions.Item label="报名量">{benefitPreview.benefit_info.报名量}</Descriptions.Item>
                      )}
                      {benefitPreview.benefit_info.学费分配 && (
                        <Descriptions.Item label="学费分配">
                          <span style={{ color: '#1890ff', fontWeight: 'bold' }}>
                            {benefitPreview.benefit_info.学费分配}
                          </span>
                        </Descriptions.Item>
                      )}
                      {benefitPreview.benefit_info.提成 && (
                        <Descriptions.Item label="提成">{benefitPreview.benefit_info.提成}</Descriptions.Item>
                      )}
                      {benefitPreview.benefit_info.激励 && (
                        <Descriptions.Item label="激励">{benefitPreview.benefit_info.激励}</Descriptions.Item>
                      )}
                      {benefitPreview.benefit_info.提成和激励 && (
                        <Descriptions.Item label="提成和激励">{benefitPreview.benefit_info.提成和激励}</Descriptions.Item>
                      )}
                    </>
                  )}
                </Descriptions>
              </div>
            )}
          </div>
        )}
      </Modal>
      
      {/* 咨询师转量弹窗 */}
      <Modal
        title={
          <Space>
            <UserSwitchOutlined />
            咨询师转量
          </Space>
        }
        open={consultantTransferModalVisible}
        onCancel={() => {
          setConsultantTransferModalVisible(false)
          setConsultantTransferRecord(null)
          setTargetConsultantForTransfer(undefined)
          setConsultantTransferReason('')
        }}
        onOk={handleConsultantTransfer}
        confirmLoading={consultantTransferLoading}
        okText="确认转量"
        cancelText="取消"
        width={600}
      >
        {consultantTransferRecord && (
          <div>
            {/* 当前记录信息 */}
            <Descriptions
              title="当前咨询量信息"
              size="small"
              bordered
              column={2}
              style={{ marginBottom: 16 }}
            >
              <Descriptions.Item label="记录ID">{consultantTransferRecord.记录ID}</Descriptions.Item>
              <Descriptions.Item label="神殿">{consultantTransferRecord.神殿 || '-'}</Descriptions.Item>
              <Descriptions.Item label="咨询者">{consultantTransferRecord.咨询者姓名 || '-'}</Descriptions.Item>
              <Descriptions.Item label="电话">{consultantTransferRecord.电话}</Descriptions.Item>
              <Descriptions.Item label="当前咨询师">
                <Tag color="blue">{consultantTransferRecord.咨询师 || '-'}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="状态">{consultantTransferRecord.状态 || '-'}</Descriptions.Item>
              {consultantTransferRecord.转自咨询师 && (
                <Descriptions.Item label="转自">
                  <Tag color="orange">{consultantTransferRecord.转自咨询师}</Tag>
                </Descriptions.Item>
              )}
            </Descriptions>
            
            <Divider />
            
            {/* 转量表单 */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 8 }}>
                <span style={{ color: 'red' }}>*</span> 目标咨询师：
              </div>
              <AutoComplete
                style={{ width: '100%' }}
                placeholder="选择或输入目标咨询师"
                value={targetConsultantForTransfer}
                onChange={setTargetConsultantForTransfer}
                filterOption={(inputValue, option) =>
                  (option?.label as string)?.toLowerCase().includes(inputValue.toLowerCase()) ?? false
                }
                options={consultantsList
                  .filter(c => c.name !== consultantTransferRecord.咨询师)
                  .map(c => {
                    const campusLabel = c.campus || '未知神殿'
                    const countLabel = typeof c.record_count === 'number' ? ` - ${c.record_count}条` : ''
                    return {
                      value: c.name,
                      label: `${c.name} (${campusLabel})${countLabel}`,
                    }
                  })}
              />
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 8 }}>
                <span style={{ color: 'red' }}>*</span> 转量原因：
              </div>
              <Input.TextArea
                rows={3}
                placeholder="请输入转量原因（例如：咨询师离职、工作调整等）"
                value={consultantTransferReason}
                onChange={(e) => setConsultantTransferReason(e.target.value)}
                maxLength={200}
                showCount
              />
            </div>
            
            <div style={{ background: '#e6f7ff', padding: 12, borderRadius: 4, border: '1px solid #91d5ff' }}>
              <div style={{ color: '#0050b3', marginBottom: 8 }}>
                <ExclamationCircleOutlined style={{ marginRight: 4 }} />
                转量说明：
              </div>
              <ul style={{ margin: 0, paddingLeft: 20, color: '#666', fontSize: 12 }}>
                <li>转量后会标记"转自{consultantTransferRecord.咨询师}"，方便后续分析数据指标</li>
                <li>同神殿转量直接执行，跨神殿转量需要审批</li>
                <li>转量后原咨询师字段会记录当前咨询师的姓名</li>
              </ul>
            </div>
          </div>
        )}
      </Modal>
      
      {/* 交接确认弹窗 */}
      <Modal
        title="确认交接"
        open={handoverModalVisible}
        onOk={confirmHandover}
        onCancel={() => {
          setHandoverModalVisible(false)
          setHandoverRemark('')
        }}
        confirmLoading={handoverLoading}
        okText="确认交接"
        cancelText="取消"
      >
        <div style={{ marginBottom: 16 }}>
          <p>确定要将选中的 <strong>{selectedRowKeys.length}</strong> 条记录交接给教化司吗？</p>
          <p style={{ color: '#666', fontSize: 12 }}>
            交接后，这些学员信息将进入教化司的交接列表，班主任可以分配班级。
          </p>
        </div>
        <div>
          <div style={{ marginBottom: 8 }}>交接备注（可选）：</div>
          <Input.TextArea
            rows={3}
            placeholder="请输入交接备注..."
            value={handoverRemark}
            onChange={(e) => setHandoverRemark(e.target.value)}
          />
        </div>
      </Modal>
      
      {/* 沟通记录弹窗 */}
      <CommunicationHistory
        visible={communicationVisible}
        onClose={() => {
          setCommunicationVisible(false)
          setCommunicationRecord(null)
        }}
        记录ID={communicationRecord?.记录ID || 0}
        对象ID={communicationRecord?.对象ID}
        咨询者姓名={communicationRecord?.咨询者姓名 || undefined}
        登记日期={communicationRecord?.登记日期}
        onRefresh={loadData}
      />
      
      {/* 缴费记录弹窗 */}
      <PaymentHistory
        visible={paymentVisible}
        onClose={() => {
          setPaymentVisible(false)
          setPaymentRecord(null)
        }}
        recordId={paymentRecord?.记录ID || 0}
        objectId={paymentRecord?.对象ID || 0}
        consultantName={paymentRecord?.咨询者姓名 || undefined}
        onUpdate={loadData}
      />
    </Card>
  )
}