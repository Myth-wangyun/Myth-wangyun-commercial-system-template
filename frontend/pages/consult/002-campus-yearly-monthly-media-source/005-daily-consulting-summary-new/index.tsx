/**
 * 前台日报表
 * 
 * 功能说明：
 * 1. 实时统计从当月1号到当前日期的数据
 * 2. 数据来源：咨询量录入系统 (consult.咨询量明细表_v2)
 * 
 * 数据分类规则：
 * - 传统大搜（SEM）: 百度推广、百教网、知了好学、坦途网、市场口碑、TQ、表单、中心来电
 * - 新媒体: 抖音、快手、微信视频号、B站、小红书、腾讯视频号
 * - 口碑: 量来源='口碑'，按口碑提供人分组
 * - 渠道: 量来源='渠道'，按渠道专员分组
 * 
 * 汇总公式：
 * 月咨询总量 = 网络传统大搜 + 网络新媒体 + 口碑 + 渠道
 * 
 * 单页展示所有子表
 */
import React, { useState, useEffect, useCallback } from 'react'
import { App,
  Card,
  Table,
  DatePicker,
  Space,
  Typography,
  Spin,
  Button,
  Row,
  Col,
  Tag,
} from 'antd'
import {
  ReloadOutlined,
  ExportOutlined,
  TeamOutlined,
  GlobalOutlined,
  MessageOutlined,
  ShareAltOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useCampusStore } from '@/stores/campusStore'
import { NoCopyContainer } from '@/components/common'
import {
  getDailySummary,
  getAnalystPlannerSummary,
  getTraditionalSearchSummary,
  getNewmediaSummary,
  getReputationSummary,
  getReputationConsultantSummary,
  getCampusNewMediaSummary,
  getChannelSummary,
  getAllSourceConsultantSummary,
  formatPercent,
  type DailySummaryResponse,
  type SectionData,
  type ConsultantSummary,
  type MediaSourceSummary,
  type ReputationProviderSummary,
  type ChannelStaffSummary,
  type AnalystPlannerStats,
  type AnalystPlannerSummaryResponse,
  type SourceSectionResponse,
  type ReputationSummaryResponse,
  type ReputationConsultantSummaryResponse,
  type CampusNewMediaSummaryResponse,
  type ChannelSummaryResponse,
  type AllSourceConsultantSummaryResponse,
} from '@/services/consult/dailyConsultingSummary'

const { Title, Text } = Typography

// ==================== 表格列配置 ====================

/** 咨询师表格列 */
const consultantColumns: ColumnsType<ConsultantSummary> = [
  {
    title: '咨询师',
    dataIndex: 'consultant_name',
    key: 'consultant_name',
    fixed: 'left',
    width: 100,
  },
  {
    title: '日咨询量',
    dataIndex: 'daily_consult',
    key: 'daily_consult',
    width: 80,
    align: 'center',
  },
  {
    title: '日上门',
    dataIndex: 'daily_visit',
    key: 'daily_visit',
    width: 70,
    align: 'center',
  },
  {
    title: '日报名',
    dataIndex: 'daily_enrolled',
    key: 'daily_enrolled',
    width: 70,
    align: 'center',
  },
  {
    title: '日订座',
    dataIndex: 'daily_booked',
    key: 'daily_booked',
    width: 70,
    align: 'center',
  },
  {
    title: '月咨询量',
    dataIndex: 'monthly_consult',
    key: 'monthly_consult',
    width: 80,
    align: 'center',
    sorter: (a, b) => a.monthly_consult - b.monthly_consult,
  },
  {
    title: '月上门',
    dataIndex: 'monthly_visit',
    key: 'monthly_visit',
    width: 70,
    align: 'center',
  },
  {
    title: '月报名',
    dataIndex: 'monthly_enrolled',
    key: 'monthly_enrolled',
    width: 70,
    align: 'center',
  },
  {
    title: '月退费',
    dataIndex: 'monthly_refund',
    key: 'monthly_refund',
    width: 70,
    align: 'center',
    render: (val) => val > 0 ? <Text type="danger">{val}</Text> : val,
  },
  {
    title: '上门率',
    dataIndex: 'visit_rate',
    key: 'visit_rate',
    width: 80,
    align: 'center',
    render: (val) => formatPercent(val),
    sorter: (a, b) => a.visit_rate - b.visit_rate,
  },
  {
    title: '转化率',
    dataIndex: 'enroll_rate',
    key: 'enroll_rate',
    width: 80,
    align: 'center',
    render: (val) => formatPercent(val),
    sorter: (a, b) => a.enroll_rate - b.enroll_rate,
  },
  {
    title: '当面转化率',
    dataIndex: 'face_enroll_rate',
    key: 'face_enroll_rate',
    width: 90,
    align: 'center',
    render: (val) => formatPercent(val),
    sorter: (a, b) => a.face_enroll_rate - b.face_enroll_rate,
  },
]

/** 媒体来源表格列 */
const mediaSourceColumns: ColumnsType<MediaSourceSummary> = [
  {
    title: '媒体来源',
    dataIndex: 'source_name',
    key: 'source_name',
    fixed: 'left',
    width: 120,
  },
  {
    title: '日咨询量',
    dataIndex: 'daily_consult',
    key: 'daily_consult',
    width: 80,
    align: 'center',
  },
  {
    title: '日上门',
    dataIndex: 'daily_visit',
    key: 'daily_visit',
    width: 70,
    align: 'center',
  },
  {
    title: '日报名',
    dataIndex: 'daily_enrolled',
    key: 'daily_enrolled',
    width: 70,
    align: 'center',
  },
  {
    title: '月咨询量',
    dataIndex: 'monthly_consult',
    key: 'monthly_consult',
    width: 80,
    align: 'center',
    sorter: (a, b) => a.monthly_consult - b.monthly_consult,
  },
  {
    title: '月上门',
    dataIndex: 'monthly_visit',
    key: 'monthly_visit',
    width: 70,
    align: 'center',
  },
  {
    title: '月报名',
    dataIndex: 'monthly_enrolled',
    key: 'monthly_enrolled',
    width: 70,
    align: 'center',
  },
  {
    title: '上门率',
    dataIndex: 'visit_rate',
    key: 'visit_rate',
    width: 80,
    align: 'center',
    render: (val) => formatPercent(val),
  },
  {
    title: '转化率',
    dataIndex: 'enroll_rate',
    key: 'enroll_rate',
    width: 80,
    align: 'center',
    render: (val) => formatPercent(val),
  },
  {
    title: '当面转化率',
    dataIndex: 'face_enroll_rate',
    key: 'face_enroll_rate',
    width: 90,
    align: 'center',
    render: (val) => formatPercent(val),
  },
]

/** 口碑提供人表格列 */
const reputationColumns: ColumnsType<ReputationProviderSummary> = [
  {
    title: '口碑提供人',
    dataIndex: 'provider_name',
    key: 'provider_name',
    fixed: 'left',
    width: 120,
  },
  {
    title: '日咨询量',
    dataIndex: 'daily_consult',
    key: 'daily_consult',
    width: 80,
    align: 'center',
  },
  {
    title: '日上门',
    dataIndex: 'daily_visit',
    key: 'daily_visit',
    width: 70,
    align: 'center',
  },
  {
    title: '日报名',
    dataIndex: 'daily_enrolled',
    key: 'daily_enrolled',
    width: 70,
    align: 'center',
  },
  {
    title: '月咨询量',
    dataIndex: 'monthly_consult',
    key: 'monthly_consult',
    width: 80,
    align: 'center',
    sorter: (a, b) => a.monthly_consult - b.monthly_consult,
  },
  {
    title: '月上门',
    dataIndex: 'monthly_visit',
    key: 'monthly_visit',
    width: 70,
    align: 'center',
  },
  {
    title: '月报名',
    dataIndex: 'monthly_enrolled',
    key: 'monthly_enrolled',
    width: 70,
    align: 'center',
  },
  {
    title: '上门率',
    dataIndex: 'visit_rate',
    key: 'visit_rate',
    width: 80,
    align: 'center',
    render: (val) => formatPercent(val),
  },
  {
    title: '转化率',
    dataIndex: 'enroll_rate',
    key: 'enroll_rate',
    width: 80,
    align: 'center',
    render: (val) => formatPercent(val),
  },
  {
    title: '当面转化率',
    dataIndex: 'face_enroll_rate',
    key: 'face_enroll_rate',
    width: 90,
    align: 'center',
    render: (val) => formatPercent(val),
  },
]

/** 渠道专员表格列 */
const channelColumns: ColumnsType<ChannelStaffSummary> = [
  {
    title: '渠道专员',
    dataIndex: 'staff_name',
    key: 'staff_name',
    fixed: 'left',
    width: 120,
  },
  {
    title: '日咨询量',
    dataIndex: 'daily_consult',
    key: 'daily_consult',
    width: 80,
    align: 'center',
  },
  {
    title: '日上门',
    dataIndex: 'daily_visit',
    key: 'daily_visit',
    width: 70,
    align: 'center',
  },
  {
    title: '日报名',
    dataIndex: 'daily_enrolled',
    key: 'daily_enrolled',
    width: 70,
    align: 'center',
  },
  {
    title: '月咨询量',
    dataIndex: 'monthly_consult',
    key: 'monthly_consult',
    width: 80,
    align: 'center',
    sorter: (a, b) => a.monthly_consult - b.monthly_consult,
  },
  {
    title: '月上门',
    dataIndex: 'monthly_visit',
    key: 'monthly_visit',
    width: 70,
    align: 'center',
  },
  {
    title: '月报名',
    dataIndex: 'monthly_enrolled',
    key: 'monthly_enrolled',
    width: 70,
    align: 'center',
  },
  {
    title: '上门率',
    dataIndex: 'visit_rate',
    key: 'visit_rate',
    width: 80,
    align: 'center',
    render: (val) => formatPercent(val),
  },
  {
    title: '转化率',
    dataIndex: 'enroll_rate',
    key: 'enroll_rate',
    width: 80,
    align: 'center',
    render: (val) => formatPercent(val),
  },
  {
    title: '当面转化率',
    dataIndex: 'face_enroll_rate',
    key: 'face_enroll_rate',
    width: 90,
    align: 'center',
    render: (val) => formatPercent(val),
  },
]

// ==================== 主组件 ====================

/** 网络汇总表格样式 */
const summaryTableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  marginBottom: 24,
}

const headerCellStyle: React.CSSProperties = {
  background: '#faad14',
  border: '1px solid #d9d9d9',
  padding: '8px 12px',
  fontWeight: 'bold',
  textAlign: 'center',
}

const cellStyle: React.CSSProperties = {
  border: '1px solid #d9d9d9',
  padding: '8px 12px',
  textAlign: 'center',
}

const labelCellStyle: React.CSSProperties = {
  ...cellStyle,
  fontWeight: 'bold',
  textAlign: 'right',
  background: '#fafafa',
}

const valueCellStyle: React.CSSProperties = {
  ...cellStyle,
  fontWeight: 'bold',
  color: '#1890ff',
}

const redValueStyle: React.CSSProperties = {
  ...cellStyle,
  fontWeight: 'bold',
  color: '#f5222d',
}

const DailyConsultingSummaryNew: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore()
  
  // 状态
  const [loading, setLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs>(dayjs())
  const [summaryData, setSummaryData] = useState<DailySummaryResponse | null>(null)
  const [analystData, setAnalystData] = useState<AnalystPlannerSummaryResponse | null>(null)
  const [traditionalSearchData, setTraditionalSearchData] = useState<SourceSectionResponse | null>(null)
  const [newmediaData, setNewmediaData] = useState<SourceSectionResponse | null>(null)
  const [reputationData, setReputationData] = useState<ReputationSummaryResponse | null>(null)
  const [reputationConsultantData, setReputationConsultantData] = useState<ReputationConsultantSummaryResponse | null>(null)
  const [campusNewMediaData, setCampusNewMediaData] = useState<CampusNewMediaSummaryResponse | null>(null)
  const [channelData, setChannelData] = useState<ChannelSummaryResponse | null>(null)
  const [allSourceConsultantData, setAllSourceConsultantData] = useState<AllSourceConsultantSummaryResponse | null>(null)
  
  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [data, analysts, traditionalSearch, newmedia, reputation, reputationConsultant, campusNewMedia, channel, allSourceConsultant] = await Promise.all([
        getDailySummary(
          selectedDate.format('YYYY-MM-DD'),
          currentCampus || undefined
        ),
        currentCampus ? getAnalystPlannerSummary(
          currentCampus,
          selectedDate.format('YYYY-MM-DD')
        ) : Promise.resolve(null),
        currentCampus ? getTraditionalSearchSummary(
          currentCampus,
          selectedDate.format('YYYY-MM-DD')
        ) : Promise.resolve(null),
        currentCampus ? getNewmediaSummary(
          currentCampus,
          selectedDate.format('YYYY-MM-DD')
        ) : Promise.resolve(null),
        currentCampus ? getReputationSummary(
          currentCampus,
          selectedDate.format('YYYY-MM-DD')
        ) : Promise.resolve(null),
        currentCampus ? getReputationConsultantSummary(
          currentCampus,
          selectedDate.format('YYYY-MM-DD')
        ) : Promise.resolve(null),
        currentCampus ? getCampusNewMediaSummary(
          currentCampus,
          selectedDate.format('YYYY-MM-DD')
        ) : Promise.resolve(null),
        currentCampus ? getChannelSummary(
          currentCampus,
          selectedDate.format('YYYY-MM-DD')
        ) : Promise.resolve(null),
        currentCampus ? getAllSourceConsultantSummary(
          currentCampus,
          selectedDate.format('YYYY-MM-DD')
        ) : Promise.resolve(null)
      ])
      setSummaryData(data)
      setAnalystData(analysts)
      setTraditionalSearchData(traditionalSearch)
      setNewmediaData(newmedia)
      setReputationData(reputation)
      setReputationConsultantData(reputationConsultant)
      setCampusNewMediaData(campusNewMedia)
      setChannelData(channel)
      setAllSourceConsultantData(allSourceConsultant)
    } catch (error) {
      console.error('加载数据失败:', error)
      message.error('加载数据失败，请重试')
    } finally {
      setLoading(false)
    }
  }, [selectedDate, currentCampus])
  
  // 初始加载和依赖变化时重新加载
  useEffect(() => {
    loadData()
  }, [loadData])
  
  // 获取区块数据
  const getSection = useCallback((sectionType: string): SectionData | undefined => {
    return summaryData?.sections.find(s => s.section_type === sectionType)
  }, [summaryData])
  
  // 计算网络汇总数据（传统大搜 + 新媒体）
  const getNetworkTotals = useCallback(() => {
    const semSection = getSection('network_sem')
    const newmediaSection = getSection('network_newmedia')
    
    const sem = semSection?.totals || {
      daily_consult: 0, daily_visit: 0, daily_enrolled: 0,
      daily_enrolled_short: 0, daily_enrolled_long: 0, daily_enrolled_3year: 0, daily_enrolled_2year: 0,
      monthly_consult: 0, monthly_visit: 0, monthly_enrolled: 0,
      monthly_enrolled_short: 0, monthly_enrolled_long: 0, monthly_enrolled_3year: 0, monthly_enrolled_2year: 0,
      monthly_invalid: 0, monthly_invalid_rate: 0, monthly_refund: 0, refund_rate: 0,
      visit_rate: 0, enroll_rate: 0, face_enroll_rate: 0
    }
    
    const newmedia = newmediaSection?.totals || {
      daily_consult: 0, daily_visit: 0, daily_enrolled: 0,
      daily_enrolled_short: 0, daily_enrolled_long: 0, daily_enrolled_3year: 0, daily_enrolled_2year: 0,
      monthly_consult: 0, monthly_visit: 0, monthly_enrolled: 0,
      monthly_enrolled_short: 0, monthly_enrolled_long: 0, monthly_enrolled_3year: 0, monthly_enrolled_2year: 0,
      monthly_invalid: 0, monthly_invalid_rate: 0, monthly_refund: 0, refund_rate: 0,
      visit_rate: 0, enroll_rate: 0, face_enroll_rate: 0
    }
    
    const totalConsult = sem.monthly_consult + newmedia.monthly_consult
    const totalVisit = sem.monthly_visit + newmedia.monthly_visit
    const totalEnrolled = sem.monthly_enrolled + newmedia.monthly_enrolled
    const totalInvalid = sem.monthly_invalid + newmedia.monthly_invalid
    const totalRefund = sem.monthly_refund + newmedia.monthly_refund
    const totalWithInvalid = totalConsult + totalInvalid
    
    return {
      // 月度数据
      monthly_consult: totalConsult,
      monthly_visit: totalVisit,
      monthly_enrolled_short: sem.monthly_enrolled_short + newmedia.monthly_enrolled_short,
      monthly_enrolled_long: sem.monthly_enrolled_long + newmedia.monthly_enrolled_long,
      monthly_enrolled_3year: sem.monthly_enrolled_3year + newmedia.monthly_enrolled_3year,
      monthly_enrolled_2year: sem.monthly_enrolled_2year + newmedia.monthly_enrolled_2year,
      monthly_invalid: totalInvalid,
      monthly_invalid_rate: totalWithInvalid > 0 ? (totalInvalid / totalWithInvalid * 100) : 0,
      monthly_refund: totalRefund,
      refund_rate: totalEnrolled > 0 ? (totalRefund / totalEnrolled * 100) : 0,
      visit_rate: totalConsult > 0 ? (totalVisit / totalConsult * 100) : 0,
      enroll_rate: totalConsult > 0 ? (totalEnrolled / totalConsult * 100) : 0,
      // 日数据
      daily_consult: sem.daily_consult + newmedia.daily_consult,
      daily_visit: sem.daily_visit + newmedia.daily_visit,
      daily_enrolled_short: sem.daily_enrolled_short + newmedia.daily_enrolled_short,
      daily_enrolled_long: sem.daily_enrolled_long + newmedia.daily_enrolled_long,
      daily_enrolled_3year: sem.daily_enrolled_3year + newmedia.daily_enrolled_3year,
      daily_enrolled_2year: sem.daily_enrolled_2year + newmedia.daily_enrolled_2year,
    }
  }, [getSection])
  
  // 渲染网络汇总表（第一张子表）
  const renderNetworkSummaryTable = useCallback(() => {
    const network = getNetworkTotals()
    const title = `清美教育（${currentCampus || '全部神殿'}） 网络（传统大搜+新媒体）前台日报表${selectedDate.format('M月D日')}`
    
    return (
      <div style={{ marginBottom: 24 }}>
        <table style={summaryTableStyle}>
          <thead>
            <tr>
              <th colSpan={8} style={{ ...headerCellStyle, fontSize: 16 }}>
                {title}
              </th>
            </tr>
          </thead>
          <tbody>
            {/* 第一行：月度汇总数据 */}
            <tr>
              <td style={labelCellStyle}>传统大搜+新媒体总量：</td>
              <td style={valueCellStyle}>{network.monthly_consult}</td>
              <td style={labelCellStyle}>月总上门量：</td>
              <td style={valueCellStyle}>{network.monthly_visit}</td>
              <td style={labelCellStyle}>月报名数：</td>
              <td style={cellStyle}>
                {network.monthly_enrolled_short}短 {network.monthly_enrolled_long}长 {network.monthly_enrolled_3year}学三 {network.monthly_enrolled_2year}学二
              </td>
              <td style={{ ...labelCellStyle, color: '#f5222d' }}>月网络无效量数量：</td>
              <td style={redValueStyle}>{network.monthly_invalid}</td>
            </tr>
            {/* 第二行：日数据 */}
            <tr>
              <td style={labelCellStyle}>传统大搜+新媒体日咨询量：</td>
              <td style={valueCellStyle}>{network.daily_consult}</td>
              <td style={labelCellStyle}>日上门量：</td>
              <td style={valueCellStyle}>{network.daily_visit}</td>
              <td style={labelCellStyle}>日报名数：</td>
              <td style={cellStyle}>
                {network.daily_enrolled_short}短 {network.daily_enrolled_long}长 {network.daily_enrolled_3year}学三 {network.daily_enrolled_2year}学二
              </td>
              <td style={{ ...labelCellStyle, color: '#f5222d' }}>月网络无效率：</td>
              <td style={redValueStyle}>{formatPercent(network.monthly_invalid_rate)}</td>
            </tr>
            {/* 第三行：转化率统计 */}
            <tr>
              <td style={labelCellStyle}>月电话总上门转化率</td>
              <td style={valueCellStyle}>{formatPercent(network.visit_rate)}</td>
              <td style={labelCellStyle}>月度总转化率</td>
              <td style={valueCellStyle}>{formatPercent(network.enroll_rate)}</td>
              <td style={labelCellStyle}>月退费人数：</td>
              <td style={cellStyle}>{network.monthly_refund}</td>
              <td style={labelCellStyle}>月退费率：</td>
              <td style={cellStyle}>{formatPercent(network.refund_rate)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    )
  }, [currentCampus, selectedDate, getNetworkTotals])
  
  // 渲染分析规划师汇总表（第二张子表）
  const renderAnalystPlannerTable = useCallback(() => {
    if (!analystData || !analystData.analysts || analystData.analysts.length === 0) {
      return null
    }
    
    const title = `清美教育（${currentCampus || '全部神殿'}） 分析规划师数据汇总 ${selectedDate.format('M月D日')}`
    
    // 分析规划师列配置
    const analystColumns: ColumnsType<AnalystPlannerStats> = [
      {
        title: '分析规划师',
        dataIndex: '分析规划师',
        key: '分析规划师',
        fixed: 'left',
        width: 100,
        render: (val) => val === '合计' ? <Text strong>{val}</Text> : val,
      },
      {
        title: '日咨询量',
        dataIndex: '日咨询量',
        key: '日咨询量',
        width: 80,
        align: 'center',
      },
      {
        title: '日上门量',
        dataIndex: '日上门量',
        key: '日上门量',
        width: 80,
        align: 'center',
      },
      {
        title: '日报名',
        dataIndex: '日报名',
        key: '日报名',
        width: 70,
        align: 'center',
      },
      {
        title: '月总咨询量',
        dataIndex: '月总咨询量',
        key: '月总咨询量',
        width: 90,
        align: 'center',
        sorter: (a, b) => a.月总咨询量 - b.月总咨询量,
      },
      {
        title: '月总上门量',
        dataIndex: '月总上门量',
        key: '月总上门量',
        width: 90,
        align: 'center',
      },
      {
        title: '月总报名',
        dataIndex: '月总报名',
        key: '月总报名',
        width: 80,
        align: 'center',
      },
      {
        title: '月上门率',
        dataIndex: '月上门率',
        key: '月上门率',
        width: 80,
        align: 'center',
      },
      {
        title: '月总转化率',
        dataIndex: '月总转化率',
        key: '月总转化率',
        width: 90,
        align: 'center',
      },
      {
        title: '月当面转化率',
        dataIndex: '月当面转化率',
        key: '月当面转化率',
        width: 100,
        align: 'center',
      },
      {
        title: '订座',
        dataIndex: '订座',
        key: '订座',
        width: 60,
        align: 'center',
      },
    ]
    
    // 合并数据和合计行
    const tableData = [...analystData.analysts, analystData.total]
    
    return (
      <div style={{ marginBottom: 24 }}>
        <table style={summaryTableStyle}>
          <thead>
            <tr>
              <th style={headerCellStyle}>分析规划师</th>
              <th style={headerCellStyle}>日咨询量</th>
              <th style={headerCellStyle}>日上门量</th>
              <th style={headerCellStyle}>日报名</th>
              <th style={headerCellStyle}>月总咨询量</th>
              <th style={headerCellStyle}>月总上门量</th>
              <th style={headerCellStyle}>月总报名</th>
              <th style={headerCellStyle}>月上门率</th>
              <th style={headerCellStyle}>月总转化率</th>
              <th style={headerCellStyle}>月当面转化率</th>
              <th style={headerCellStyle}>订座</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((row) => (
              <tr 
                key={row.分析规划师}
                style={row.分析规划师 === '合计' ? { background: '#faad14', fontWeight: 'bold' } : {}}
              >
                <td style={{ ...cellStyle, fontWeight: row.分析规划师 === '合计' ? 'bold' : 'normal' }}>
                  {row.分析规划师}
                </td>
                <td style={cellStyle}>{row.日咨询量}</td>
                <td style={cellStyle}>{row.日上门量}</td>
                <td style={cellStyle}>{row.日报名}</td>
                <td style={cellStyle}>{row.月总咨询量}</td>
                <td style={cellStyle}>{row.月总上门量}</td>
                <td style={cellStyle}>{row.月总报名}</td>
                <td style={cellStyle}>{row.月上门率}</td>
                <td style={cellStyle}>{row.月总转化率}</td>
                <td style={cellStyle}>{row.月当面转化率}</td>
                <td style={cellStyle}>{row.订座}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }, [analystData, currentCampus, selectedDate])
  
  // 渲染传统大搜子表（第三张子表：汇总+分析规划师明细）
  const renderTraditionalSearchTable = useCallback(() => {
    if (!traditionalSearchData) {
      return null
    }
    
    const { summary, analysts, total } = traditionalSearchData
    const title = `清美教育（${currentCampus || '全部神殿'}）网络-传统大搜 月度总咨询量报名情况表`
    
    // 合并数据和合计行
    const tableData = [...analysts, total]
    
    return (
      <div style={{ marginBottom: 24 }}>
        {/* 顶部汇总区域 */}
        <table style={summaryTableStyle}>
          <thead>
            <tr>
              <th colSpan={8} style={{ ...headerCellStyle, fontSize: 16 }}>
                {title}
              </th>
            </tr>
          </thead>
          <tbody>
            {/* 第一行 */}
            <tr>
              <td style={labelCellStyle}>网络传统大搜月咨询总量：</td>
              <td style={valueCellStyle}>{summary.月咨询总量}</td>
              <td style={labelCellStyle}>月总上门量：</td>
              <td style={valueCellStyle}>{summary.月总上门量}</td>
              <td style={labelCellStyle}>月报名数：</td>
              <td style={cellStyle}>
                {summary.月报名数_短期}短 {summary.月报名数_长期}长 {summary.月报名数_学三}学三 {summary.月报名数_学二}学二
              </td>
              <td style={{ ...labelCellStyle, color: '#f5222d' }}>月度无效量数量：</td>
              <td style={redValueStyle}>{summary.月无效量数量}</td>
            </tr>
            {/* 第二行 */}
            <tr>
              <td style={labelCellStyle}>日咨询量：</td>
              <td style={valueCellStyle}>{summary.日咨询量}</td>
              <td style={labelCellStyle}>日上门量：</td>
              <td style={valueCellStyle}>{summary.日上门量}</td>
              <td style={labelCellStyle}>日报名数：</td>
              <td style={cellStyle}>
                {summary.日报名数_短期}短 {summary.日报名数_长期}长 {summary.日报名数_学三}学三 {summary.日报名数_学二}学二
              </td>
              <td style={{ ...labelCellStyle, color: '#f5222d' }}>月度无效率：</td>
              <td style={redValueStyle}>{summary.月无效率}</td>
            </tr>
            {/* 第三行 */}
            <tr>
              <td style={labelCellStyle}>月网络电话总上门转化率</td>
              <td style={valueCellStyle}>{summary.月电话上门转化率}</td>
              <td style={labelCellStyle}>月度网络总转化率</td>
              <td style={valueCellStyle}>{summary.月度总转化率}</td>
              <td style={labelCellStyle}>月退费人数：</td>
              <td style={cellStyle}>{summary.月退费人数}</td>
              <td style={labelCellStyle}>月退费率：</td>
              <td style={cellStyle}>{summary.月退费率}</td>
            </tr>
          </tbody>
        </table>
        
        {/* 分析规划师明细表 */}
        <table style={{ ...summaryTableStyle, marginTop: 0 }}>
          <thead>
            <tr>
              <th style={headerCellStyle}>分析规划师</th>
              <th style={headerCellStyle}>日咨询量</th>
              <th style={headerCellStyle}>日上门量</th>
              <th style={headerCellStyle}>日报名</th>
              <th style={headerCellStyle}>月总咨询量</th>
              <th style={headerCellStyle}>月总上门量</th>
              <th style={headerCellStyle}>月总报名</th>
              <th style={headerCellStyle}>月上门率</th>
              <th style={headerCellStyle}>月总转化率</th>
              <th style={headerCellStyle}>月当面转化率</th>
              <th style={headerCellStyle}>订座</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((row) => (
              <tr 
                key={row.分析规划师}
                style={row.分析规划师 === '合计' ? { background: '#faad14', fontWeight: 'bold' } : {}}
              >
                <td style={{ ...cellStyle, fontWeight: row.分析规划师 === '合计' ? 'bold' : 'normal' }}>
                  {row.分析规划师}
                </td>
                <td style={cellStyle}>{row.日咨询量 || ''}</td>
                <td style={cellStyle}>{row.日上门量 || ''}</td>
                <td style={cellStyle}>{row.日报名 || ''}</td>
                <td style={cellStyle}>{row.月总咨询量 || ''}</td>
                <td style={cellStyle}>{row.月总上门量 || ''}</td>
                <td style={cellStyle}>{row.月总报名 || ''}</td>
                <td style={cellStyle}>{row.月上门率}</td>
                <td style={cellStyle}>{row.月总转化率}</td>
                <td style={cellStyle}>{row.月当面转化率}</td>
                <td style={cellStyle}>{row.订座 || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }, [traditionalSearchData, currentCampus])
  
  // 渲染新媒体子表（第四张子表：汇总+分析规划师明细）
  const renderNewmediaTable = useCallback(() => {
    if (!newmediaData) {
      return null
    }
    
    const { summary, analysts, total } = newmediaData
    const title = `清美教育（${currentCampus || '全部神殿'}）网络-新媒体 月度总咨询量报名情况表`
    
    // 合并数据和合计行
    const tableData = [...analysts, total]
    
    return (
      <div style={{ marginBottom: 24 }}>
        {/* 顶部汇总区域 */}
        <table style={summaryTableStyle}>
          <thead>
            <tr>
              <th colSpan={8} style={{ ...headerCellStyle, fontSize: 16 }}>
                {title}
              </th>
            </tr>
          </thead>
          <tbody>
            {/* 第一行 */}
            <tr>
              <td style={labelCellStyle}>网络新媒体月咨询总量：</td>
              <td style={valueCellStyle}>{summary.月咨询总量}</td>
              <td style={labelCellStyle}>月总上门量：</td>
              <td style={valueCellStyle}>{summary.月总上门量}</td>
              <td style={labelCellStyle}>月报名数：</td>
              <td style={cellStyle}>
                {summary.月报名数_短期}短 {summary.月报名数_长期}长 {summary.月报名数_学三}学三 {summary.月报名数_学二}学二
              </td>
              <td style={{ ...labelCellStyle, color: '#f5222d' }}>月度无效量数量：</td>
              <td style={redValueStyle}>{summary.月无效量数量}</td>
            </tr>
            {/* 第二行 */}
            <tr>
              <td style={labelCellStyle}>日咨询量：</td>
              <td style={valueCellStyle}>{summary.日咨询量}</td>
              <td style={labelCellStyle}>日上门量：</td>
              <td style={valueCellStyle}>{summary.日上门量}</td>
              <td style={labelCellStyle}>日报名数：</td>
              <td style={cellStyle}>
                {summary.日报名数_短期}短 {summary.日报名数_长期}长 {summary.日报名数_学三}学三 {summary.日报名数_学二}学二
              </td>
              <td style={{ ...labelCellStyle, color: '#f5222d' }}>月度无效率：</td>
              <td style={redValueStyle}>{summary.月无效率}</td>
            </tr>
            {/* 第三行 */}
            <tr>
              <td style={labelCellStyle}>月新媒体电话总上门转化率</td>
              <td style={valueCellStyle}>{summary.月电话上门转化率}</td>
              <td style={labelCellStyle}>月度新媒体总转化率</td>
              <td style={valueCellStyle}>{summary.月度总转化率}</td>
              <td style={labelCellStyle}>月退费人数：</td>
              <td style={cellStyle}>{summary.月退费人数}</td>
              <td style={labelCellStyle}>月退费率：</td>
              <td style={cellStyle}>{summary.月退费率}</td>
            </tr>
          </tbody>
        </table>
        
        {/* 分析规划师明细表 */}
        <table style={{ ...summaryTableStyle, marginTop: 0 }}>
          <thead>
            <tr>
              <th style={headerCellStyle}>分析规划师</th>
              <th style={headerCellStyle}>日咨询量</th>
              <th style={headerCellStyle}>日上门量</th>
              <th style={headerCellStyle}>日报名</th>
              <th style={headerCellStyle}>月总咨询量</th>
              <th style={headerCellStyle}>月总上门量</th>
              <th style={headerCellStyle}>月总报名</th>
              <th style={headerCellStyle}>月上门率</th>
              <th style={headerCellStyle}>月总转化率</th>
              <th style={headerCellStyle}>月当面转化率</th>
              <th style={headerCellStyle}>订座</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((row) => (
              <tr 
                key={row.分析规划师}
                style={row.分析规划师 === '合计' ? { background: '#faad14', fontWeight: 'bold' } : {}}
              >
                <td style={{ ...cellStyle, fontWeight: row.分析规划师 === '合计' ? 'bold' : 'normal' }}>
                  {row.分析规划师}
                </td>
                <td style={cellStyle}>{row.日咨询量 || ''}</td>
                <td style={cellStyle}>{row.日上门量 || ''}</td>
                <td style={cellStyle}>{row.日报名 || ''}</td>
                <td style={cellStyle}>{row.月总咨询量 || ''}</td>
                <td style={cellStyle}>{row.月总上门量 || ''}</td>
                <td style={cellStyle}>{row.月总报名 || ''}</td>
                <td style={cellStyle}>{row.月上门率}</td>
                <td style={cellStyle}>{row.月总转化率}</td>
                <td style={cellStyle}>{row.月当面转化率}</td>
                <td style={cellStyle}>{row.订座 || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }, [newmediaData, currentCampus])
  
  // 渲染口碑子表（按口碑提供人分组）
  const renderReputationTable = useCallback(() => {
    if (!reputationData) {
      return null
    }
    
    const { summary, providers, total } = reputationData
    const title = `清美教育（${currentCampus || '全部神殿'}）口碑月度总咨询量报名情况表`
    
    // 合并数据和合计行
    const tableData = [...providers, total]
    
    return (
      <div style={{ marginBottom: 24 }}>
        {/* 顶部汇总区域 */}
        <table style={summaryTableStyle}>
          <thead>
            <tr>
              <th colSpan={8} style={{ ...headerCellStyle, fontSize: 16 }}>
                {title}
              </th>
            </tr>
          </thead>
          <tbody>
            {/* 第一行 */}
            <tr>
              <td style={labelCellStyle}>口碑-月咨询总量：</td>
              <td style={valueCellStyle}>{summary.月咨询总量}</td>
              <td style={labelCellStyle}>月总上门量：</td>
              <td style={valueCellStyle}>{summary.月总上门量}</td>
              <td style={labelCellStyle}>月报名数：</td>
              <td style={cellStyle}>
                {summary.月报名数_短期}短 {summary.月报名数_长期}长 {summary.月报名数_学三}学三 {summary.月报名数_学二}学二
              </td>
              <td style={{ ...labelCellStyle, color: '#f5222d' }}>月度无效量数量：</td>
              <td style={redValueStyle}>{summary.月无效量数量}</td>
            </tr>
            {/* 第二行 */}
            <tr>
              <td style={labelCellStyle}>日咨询量：</td>
              <td style={valueCellStyle}>{summary.日咨询量}</td>
              <td style={labelCellStyle}>日上门量：</td>
              <td style={valueCellStyle}>{summary.日上门量}</td>
              <td style={labelCellStyle}>日报名数：</td>
              <td style={cellStyle}>
                {summary.日报名数_短期}短 {summary.日报名数_长期}长 {summary.日报名数_学三}学三 {summary.日报名数_学二}学二
              </td>
              <td style={{ ...labelCellStyle, color: '#f5222d' }}>月度无效率：</td>
              <td style={redValueStyle}>{summary.月无效率}</td>
            </tr>
            {/* 第三行 */}
            <tr>
              <td style={labelCellStyle}>月口碑电话总上门转化率</td>
              <td style={valueCellStyle}>{summary.月电话上门转化率}</td>
              <td style={labelCellStyle}>月度口碑总转化率</td>
              <td style={valueCellStyle}>{summary.月度总转化率}</td>
              <td style={labelCellStyle}>月退费人数：</td>
              <td style={cellStyle}>{summary.月退费人数}</td>
              <td style={labelCellStyle}>月退费率：</td>
              <td style={cellStyle}>{summary.月退费率}</td>
            </tr>
          </tbody>
        </table>
        
        {/* 口碑提供人明细表 */}
        <table style={{ ...summaryTableStyle, marginTop: 0 }}>
          <thead>
            <tr>
              <th style={headerCellStyle}>口碑来源</th>
              <th style={headerCellStyle}>日口碑量</th>
              <th style={headerCellStyle}>日上门量</th>
              <th style={headerCellStyle}>日报名</th>
              <th style={headerCellStyle}>月口碑量</th>
              <th style={headerCellStyle}>月上门量</th>
              <th style={headerCellStyle}>月报名量</th>
              <th style={headerCellStyle}>月上门率</th>
              <th style={headerCellStyle}>月总转化率</th>
              <th style={headerCellStyle}>月当面转化率</th>
              <th style={headerCellStyle}>订座</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((row) => (
              <tr 
                key={row.口碑来源}
                style={row.口碑来源 === '合计' ? { background: '#faad14', fontWeight: 'bold' } : {}}
              >
                <td style={{ ...cellStyle, fontWeight: row.口碑来源 === '合计' ? 'bold' : 'normal' }}>
                  {row.口碑来源}
                </td>
                <td style={cellStyle}>{row.日口碑量 || ''}</td>
                <td style={cellStyle}>{row.日上门量 || ''}</td>
                <td style={cellStyle}>{row.日报名 || ''}</td>
                <td style={cellStyle}>{row.月口碑量 || ''}</td>
                <td style={cellStyle}>{row.月上门量 || ''}</td>
                <td style={cellStyle}>{row.月报名量 || ''}</td>
                <td style={cellStyle}>{row.月上门率}</td>
                <td style={cellStyle}>{row.月总转化率}</td>
                <td style={cellStyle}>{row.月当面转化率}</td>
                <td style={cellStyle}>{row.订座 || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }, [reputationData, currentCampus])
  
  // 渲染口碑咨询师分配子表
  const renderReputationConsultantTable = useCallback(() => {
    if (!reputationConsultantData) {
      return null
    }
    
    const { consultants, total } = reputationConsultantData
    
    // 合并数据和合计行
    const tableData = [...consultants, total]
    
    return (
      <div style={{ marginBottom: 24 }}>
        {/* 标题 */}
        <table style={summaryTableStyle}>
          <thead>
            <tr>
              <th colSpan={11} style={{ ...headerCellStyle, fontSize: 16 }}>
                口碑量咨询师分配
              </th>
            </tr>
          </thead>
        </table>
        
        {/* 咨询师明细表 */}
        <table style={{ ...summaryTableStyle, marginTop: 0 }}>
          <thead>
            <tr>
              <th style={headerCellStyle}>分析规划师</th>
              <th style={headerCellStyle}>日口碑量</th>
              <th style={headerCellStyle}>日上门量</th>
              <th style={headerCellStyle}>日报名</th>
              <th style={headerCellStyle}>月口碑量</th>
              <th style={headerCellStyle}>月上门量</th>
              <th style={headerCellStyle}>月报名量</th>
              <th style={headerCellStyle}>月上门率</th>
              <th style={headerCellStyle}>月总转化率</th>
              <th style={headerCellStyle}>月当面转化率</th>
              <th style={headerCellStyle}>订座</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((row) => (
              <tr 
                key={row.分析规划师}
                style={row.分析规划师 === '合计' ? { background: '#faad14', fontWeight: 'bold' } : {}}
              >
                <td style={{ ...cellStyle, fontWeight: row.分析规划师 === '合计' ? 'bold' : 'normal' }}>
                  {row.分析规划师}
                </td>
                <td style={cellStyle}>{row.日口碑量 || ''}</td>
                <td style={cellStyle}>{row.日上门量 || ''}</td>
                <td style={cellStyle}>{row.日报名 || ''}</td>
                <td style={cellStyle}>{row.月口碑量 || ''}</td>
                <td style={cellStyle}>{row.月上门量 || ''}</td>
                <td style={cellStyle}>{row.月报名量 || ''}</td>
                <td style={cellStyle}>{row.月上门率}</td>
                <td style={cellStyle}>{row.月总转化率}</td>
                <td style={cellStyle}>{row.月当面转化率}</td>
                <td style={cellStyle}>{row.订座 || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }, [reputationConsultantData])
  
  // 渲染神殿新媒体子表
  const renderCampusNewMediaTable = useCallback(() => {
    if (!campusNewMediaData) {
      return null
    }
    
    const { summary, referrers, referrer_total, consultants, consultant_total } = campusNewMediaData
    const month = selectedDate.format('M')
    const title = `清美教育（${currentCampus}）神殿新媒体咨询量${month}月-报名情况表`
    
    // 合并介绍人数据和合计行
    const referrerTableData = [...referrers, referrer_total]
    // 合并咨询师数据和合计行
    const consultantTableData = [...consultants, consultant_total]
    
    return (
      <div style={{ marginBottom: 24 }}>
        {/* 汇总区 */}
        <table style={summaryTableStyle}>
          <thead>
            <tr>
              <th colSpan={6} style={{ ...headerCellStyle, fontSize: 16 }}>
                {title}
              </th>
            </tr>
          </thead>
          <tbody>
            {/* 第一行 */}
            <tr>
              <td style={labelCellStyle}>月咨询总量：</td>
              <td style={valueCellStyle}>{summary.月咨询总量}</td>
              <td style={labelCellStyle}>月总上门量：</td>
              <td style={valueCellStyle}>{summary.月总上门量}</td>
              <td style={labelCellStyle}>月报名数：</td>
              <td style={cellStyle}>{summary.月报名数}</td>
            </tr>
            {/* 第二行 */}
            <tr>
              <td style={labelCellStyle}>日咨询量：</td>
              <td style={valueCellStyle}>{summary.日咨询量}</td>
              <td style={labelCellStyle}>日上门量：</td>
              <td style={valueCellStyle}>{summary.日上门量}</td>
              <td style={labelCellStyle}>日报报名量：</td>
              <td style={cellStyle}>{summary.日报报名量}</td>
            </tr>
          </tbody>
        </table>
        
        {/* 新媒体介绍人明细表 */}
        <table style={{ ...summaryTableStyle, marginTop: 0 }}>
          <thead>
            <tr>
              <th style={headerCellStyle}>新媒体介绍人</th>
              <th style={headerCellStyle}>日提供量</th>
              <th style={headerCellStyle}>日上门量</th>
              <th style={headerCellStyle}>日报名</th>
              <th style={headerCellStyle}>总提供量</th>
              <th style={headerCellStyle}>总上门量</th>
              <th style={headerCellStyle}>总报名</th>
              <th style={headerCellStyle}>总转化率</th>
              <th style={headerCellStyle}>当面转化率</th>
              <th style={headerCellStyle}>订座</th>
            </tr>
          </thead>
          <tbody>
            {referrerTableData.map((row) => (
              <tr 
                key={row.新媒体介绍人}
                style={row.新媒体介绍人 === '合计' ? { background: '#faad14', fontWeight: 'bold' } : {}}
              >
                <td style={{ ...cellStyle, fontWeight: row.新媒体介绍人 === '合计' ? 'bold' : 'normal' }}>
                  {row.新媒体介绍人}
                </td>
                <td style={cellStyle}>{row.日提供量 || ''}</td>
                <td style={cellStyle}>{row.日上门量 || ''}</td>
                <td style={cellStyle}>{row.日报名 || ''}</td>
                <td style={cellStyle}>{row.总提供量 || ''}</td>
                <td style={cellStyle}>{row.总上门量 || ''}</td>
                <td style={cellStyle}>{row.总报名 || ''}</td>
                <td style={cellStyle}>{row.总转化率}</td>
                <td style={cellStyle}>{row.当面转化率}</td>
                <td style={cellStyle}>{row.订座 || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* 咨询师分配明细表 */}
        <table style={{ ...summaryTableStyle, marginTop: 16 }}>
          <thead>
            <tr>
              <th style={headerCellStyle}>分析规划师</th>
              <th style={headerCellStyle}>日咨询量</th>
              <th style={headerCellStyle}>日上门量</th>
              <th style={headerCellStyle}>日报名</th>
              <th style={headerCellStyle}>总咨询量</th>
              <th style={headerCellStyle}>总上门量</th>
              <th style={headerCellStyle}>总报名</th>
              <th style={headerCellStyle}>总转化率</th>
              <th style={headerCellStyle}>当面转化率</th>
              <th style={headerCellStyle}>订座</th>
            </tr>
          </thead>
          <tbody>
            {consultantTableData.map((row) => (
              <tr 
                key={row.分析规划师}
                style={row.分析规划师 === '合计' ? { background: '#faad14', fontWeight: 'bold' } : {}}
              >
                <td style={{ ...cellStyle, fontWeight: row.分析规划师 === '合计' ? 'bold' : 'normal' }}>
                  {row.分析规划师}
                </td>
                <td style={cellStyle}>{row.日咨询量 || ''}</td>
                <td style={cellStyle}>{row.日上门量 || ''}</td>
                <td style={cellStyle}>{row.日报名 || ''}</td>
                <td style={cellStyle}>{row.总咨询量 || ''}</td>
                <td style={cellStyle}>{row.总上门量 || ''}</td>
                <td style={cellStyle}>{row.总报名 || ''}</td>
                <td style={cellStyle}>{row.总转化率}</td>
                <td style={cellStyle}>{row.当面转化率}</td>
                <td style={cellStyle}>{row.订座 || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }, [campusNewMediaData, currentCampus, selectedDate])
  
  // 渲染渠道子表
  const renderChannelTable = useCallback(() => {
    if (!channelData) {
      return null
    }
    
    const { summary, agents, agent_total, consultants, consultant_total } = channelData
    // 去掉"河北"前缀，只保留神殿名
    const campusShort = currentCampus?.replace(/^河北/, '') || ''
    const title = `清美教育（${campusShort}）渠道 月度总咨询量报名情况表`
    
    // 表头样式（橙黄色背景）
    const headerStyle: React.CSSProperties = {
      backgroundColor: '#F2A900',
      padding: '4px 8px',
      fontSize: '12px',
      fontWeight: 'bold',
      border: '1px solid #d9d9d9',
      whiteSpace: 'nowrap',
      textAlign: 'center',
    }
    
    // 单元格样式
    const cellStyle: React.CSSProperties = {
      padding: '4px 8px',
      fontSize: '12px',
      border: '1px solid #d9d9d9',
      whiteSpace: 'nowrap',
      textAlign: 'center',
    }
    
    // 汇总标签样式
    const summaryLabelStyle: React.CSSProperties = {
      ...headerStyle,
      textAlign: 'left',
    }
    
    // 汇总值样式
    const summaryValueStyle: React.CSSProperties = {
      ...cellStyle,
      backgroundColor: '#fff',
      textAlign: 'left',
    }
    
    // 空值显示为 -
    const displayValue = (val: number | string | null | undefined) => {
      if (val === null || val === undefined || val === '' || val === 0) return '-'
      return val
    }
    
    return (
      <div style={{ marginTop: 16, overflowX: 'auto' }}>
        {/* 标题 */}
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th colSpan={11} style={{ 
                backgroundColor: '#F2A900', 
                padding: '8px 12px', 
                fontWeight: 'bold', 
                fontSize: '14px',
                textAlign: 'center',
                border: '1px solid #d9d9d9'
              }}>
                {title}
              </th>
            </tr>
          </thead>
        </table>
        
        {/* 汇总区 - 严格按照Excel样板 */}
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={summaryLabelStyle}>渠道-月咨询总量：</td>
              <td style={summaryValueStyle}>{summary['渠道-月咨询总量'] || 0}</td>
              <td style={summaryLabelStyle}>月总上门量：</td>
              <td style={summaryValueStyle}>{summary.月总上门量 || 0}</td>
              <td style={summaryLabelStyle}></td>
              <td style={summaryValueStyle}></td>
              <td style={summaryLabelStyle}>月报名数：</td>
              <td style={summaryValueStyle}>{summary.月报名数}</td>
            </tr>
            <tr>
              <td style={summaryLabelStyle}>日咨询量：</td>
              <td style={summaryValueStyle}>{summary.日咨询量 || 0}</td>
              <td style={summaryLabelStyle}>日上门量：</td>
              <td style={summaryValueStyle}>{summary.日上门量 || 0}</td>
              <td style={summaryLabelStyle}></td>
              <td style={summaryValueStyle}></td>
              <td style={summaryLabelStyle}>日报报名量：</td>
              <td style={summaryValueStyle}>{summary.日报报名量}</td>
            </tr>
            <tr>
              <td style={summaryLabelStyle}>月电话总上门转化率：</td>
              <td style={summaryValueStyle}>{summary.月电话总上门转化率}</td>
              <td style={summaryLabelStyle}>月度总转化率：</td>
              <td style={summaryValueStyle}>{summary.月度总转化率}</td>
              <td style={summaryLabelStyle}>月退费人数：</td>
              <td style={summaryValueStyle}>{displayValue(summary.月退费人数)}</td>
              <td style={summaryLabelStyle}>月退费率：</td>
              <td style={summaryValueStyle}>{summary.月退费率}</td>
            </tr>
          </tbody>
        </table>
        
        {/* 渠道代理明细 */}
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={headerStyle}>渠道代理</th>
              <th style={headerStyle}>日信息量</th>
              <th style={headerStyle}>日上门量</th>
              <th style={headerStyle}>日报名</th>
              <th style={headerStyle}>月信息量</th>
              <th style={headerStyle}>月上门量</th>
              <th style={headerStyle}>月报名量</th>
              <th style={headerStyle}>月上门率</th>
              <th style={headerStyle}>月总转化率</th>
              <th style={headerStyle}>月当面转化率</th>
              <th style={headerStyle}>订座</th>
            </tr>
          </thead>
          <tbody>
            {agents.map((row, idx) => (
              <tr key={idx}>
                <td style={{ ...cellStyle, textAlign: 'left' }}>{row.渠道代理}</td>
                <td style={cellStyle}>{displayValue(row.日信息量)}</td>
                <td style={cellStyle}>{displayValue(row.日上门量)}</td>
                <td style={cellStyle}>{displayValue(row.日报名)}</td>
                <td style={cellStyle}>{displayValue(row.月信息量)}</td>
                <td style={cellStyle}>{displayValue(row.月上门量)}</td>
                <td style={cellStyle}>{displayValue(row.月报名量)}</td>
                <td style={cellStyle}>{row.月上门率}</td>
                <td style={cellStyle}>{row.月总转化率}</td>
                <td style={cellStyle}>{row.月当面转化率}</td>
                <td style={cellStyle}>{displayValue(row.订座)}</td>
              </tr>
            ))}
            {/* 合计行 */}
            <tr style={{ backgroundColor: '#fafafa' }}>
              <td style={{ ...cellStyle, textAlign: 'left', fontWeight: 'bold' }}>{agent_total.渠道代理}</td>
              <td style={{ ...cellStyle, fontWeight: 'bold' }}>{displayValue(agent_total.日信息量)}</td>
              <td style={{ ...cellStyle, fontWeight: 'bold' }}>{displayValue(agent_total.日上门量)}</td>
              <td style={{ ...cellStyle, fontWeight: 'bold' }}>{displayValue(agent_total.日报名)}</td>
              <td style={{ ...cellStyle, fontWeight: 'bold' }}>{displayValue(agent_total.月信息量)}</td>
              <td style={{ ...cellStyle, fontWeight: 'bold' }}>{displayValue(agent_total.月上门量)}</td>
              <td style={{ ...cellStyle, fontWeight: 'bold' }}>{displayValue(agent_total.月报名量)}</td>
              <td style={{ ...cellStyle, fontWeight: 'bold' }}>{agent_total.月上门率}</td>
              <td style={{ ...cellStyle, fontWeight: 'bold' }}>{agent_total.月总转化率}</td>
              <td style={{ ...cellStyle, fontWeight: 'bold' }}>{agent_total.月当面转化率}</td>
              <td style={{ ...cellStyle, fontWeight: 'bold' }}>{displayValue(agent_total.订座)}</td>
            </tr>
          </tbody>
        </table>
        
        {/* 渠道量咨询老师分配 - 标题行 */}
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th colSpan={11} style={{ 
                backgroundColor: '#F2A900', 
                padding: '4px 8px', 
                fontWeight: 'bold', 
                fontSize: '12px',
                textAlign: 'center',
                border: '1px solid #d9d9d9'
              }}>
                渠道量咨询老师分配
              </th>
            </tr>
            <tr>
              <th style={headerStyle}>分析规划师</th>
              <th style={headerStyle}>日信息量</th>
              <th style={headerStyle}>日上门量</th>
              <th style={headerStyle}>日报名</th>
              <th style={headerStyle}>月信息量</th>
              <th style={headerStyle}>月上门量</th>
              <th style={headerStyle}>月报名量</th>
              <th style={headerStyle}>月上门率</th>
              <th style={headerStyle}>月总转化率</th>
              <th style={headerStyle}>月当面转化率</th>
              <th style={headerStyle}>订座</th>
            </tr>
          </thead>
          <tbody>
            {consultants.map((row, idx) => (
              <tr key={idx}>
                <td style={{ ...cellStyle, textAlign: 'left' }}>{row.分析规划师}</td>
                <td style={cellStyle}>{displayValue(row.日信息量)}</td>
                <td style={cellStyle}>{displayValue(row.日上门量)}</td>
                <td style={cellStyle}>{displayValue(row.日报名)}</td>
                <td style={cellStyle}>{displayValue(row.月信息量)}</td>
                <td style={cellStyle}>{displayValue(row.月上门量)}</td>
                <td style={cellStyle}>{displayValue(row.月报名量)}</td>
                <td style={cellStyle}>{row.月上门率}</td>
                <td style={cellStyle}>{row.月总转化率}</td>
                <td style={cellStyle}>{row.月当面转化率}</td>
                <td style={cellStyle}>{displayValue(row.订座)}</td>
              </tr>
            ))}
            {/* 合计行 */}
            <tr style={{ backgroundColor: '#fafafa' }}>
              <td style={{ ...cellStyle, textAlign: 'left', fontWeight: 'bold' }}>{consultant_total.分析规划师}</td>
              <td style={{ ...cellStyle, fontWeight: 'bold' }}>{displayValue(consultant_total.日信息量)}</td>
              <td style={{ ...cellStyle, fontWeight: 'bold' }}>{displayValue(consultant_total.日上门量)}</td>
              <td style={{ ...cellStyle, fontWeight: 'bold' }}>{displayValue(consultant_total.日报名)}</td>
              <td style={{ ...cellStyle, fontWeight: 'bold' }}>{displayValue(consultant_total.月信息量)}</td>
              <td style={{ ...cellStyle, fontWeight: 'bold' }}>{displayValue(consultant_total.月上门量)}</td>
              <td style={{ ...cellStyle, fontWeight: 'bold' }}>{displayValue(consultant_total.月报名量)}</td>
              <td style={{ ...cellStyle, fontWeight: 'bold' }}>{consultant_total.月上门率}</td>
              <td style={{ ...cellStyle, fontWeight: 'bold' }}>{consultant_total.月总转化率}</td>
              <td style={{ ...cellStyle, fontWeight: 'bold' }}>{consultant_total.月当面转化率}</td>
              <td style={{ ...cellStyle, fontWeight: 'bold' }}>{displayValue(consultant_total.订座)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    )
  }, [channelData, currentCampus, selectedDate])
  
  // 渲染全来源咨询师汇总子表（传统大搜+新媒体+口碑+渠道）
  const renderAllSourceConsultantTable = useCallback(() => {
    if (!allSourceConsultantData) {
      return null
    }
    
    const { consultants, consultant_total } = allSourceConsultantData
    // 去掉"河北"前缀，只保留神殿名
    const campusShort = currentCampus?.replace(/^河北/, '') || ''
    const title = `清美教育（${campusShort}）传统大搜+新媒体+口碑+渠道 月度总咨询量报名情况表`
    
    // 表头样式（橙黄色背景）
    const headerStyle: React.CSSProperties = {
      backgroundColor: '#F2A900',
      padding: '4px 8px',
      fontSize: '12px',
      fontWeight: 'bold',
      border: '1px solid #d9d9d9',
      whiteSpace: 'nowrap',
      textAlign: 'center',
    }
    
    // 单元格样式
    const cellStyle: React.CSSProperties = {
      padding: '4px 8px',
      fontSize: '12px',
      border: '1px solid #d9d9d9',
      whiteSpace: 'nowrap',
      textAlign: 'center',
    }
    
    // 空值显示为 -
    const displayValue = (val: number | string | null | undefined) => {
      if (val === null || val === undefined || val === '' || val === 0) return '-'
      return val
    }
    
    return (
      <div style={{ marginTop: 16, overflowX: 'auto' }}>
        {/* 标题 */}
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th colSpan={11} style={{ 
                backgroundColor: '#F2A900', 
                padding: '8px 12px', 
                fontWeight: 'bold', 
                fontSize: '14px',
                textAlign: 'center',
                border: '1px solid #d9d9d9'
              }}>
                {title}
              </th>
            </tr>
            <tr>
              <th style={headerStyle}>分析规划师</th>
              <th style={headerStyle}>日咨询量</th>
              <th style={headerStyle}>日上门量</th>
              <th style={headerStyle}>日报名</th>
              <th style={headerStyle}>总咨询量</th>
              <th style={headerStyle}>总上门量</th>
              <th style={headerStyle}>总报名</th>
              <th style={headerStyle}>总上门率</th>
              <th style={headerStyle}>总转化率</th>
              <th style={headerStyle}>当面转化率</th>
              <th style={headerStyle}>订座</th>
            </tr>
          </thead>
          <tbody>
            {consultants.map((row, idx) => (
              <tr key={idx}>
                <td style={{ ...cellStyle, textAlign: 'left' }}>{row.分析规划师}</td>
                <td style={cellStyle}>{displayValue(row.日咨询量)}</td>
                <td style={cellStyle}>{displayValue(row.日上门量)}</td>
                <td style={cellStyle}>{displayValue(row.日报名)}</td>
                <td style={cellStyle}>{displayValue(row.总咨询量)}</td>
                <td style={cellStyle}>{displayValue(row.总上门量)}</td>
                <td style={cellStyle}>{displayValue(row.总报名)}</td>
                <td style={cellStyle}>{row.总上门率}</td>
                <td style={cellStyle}>{row.总转化率}</td>
                <td style={cellStyle}>{row.当面转化率}</td>
                <td style={cellStyle}>{displayValue(row.订座)}</td>
              </tr>
            ))}
            {/* 合计行 */}
            <tr style={{ backgroundColor: '#fafafa' }}>
              <td style={{ ...cellStyle, textAlign: 'left', fontWeight: 'bold' }}>{consultant_total.分析规划师}</td>
              <td style={{ ...cellStyle, fontWeight: 'bold' }}>{displayValue(consultant_total.日咨询量)}</td>
              <td style={{ ...cellStyle, fontWeight: 'bold' }}>{displayValue(consultant_total.日上门量)}</td>
              <td style={{ ...cellStyle, fontWeight: 'bold' }}>{displayValue(consultant_total.日报名)}</td>
              <td style={{ ...cellStyle, fontWeight: 'bold' }}>{displayValue(consultant_total.总咨询量)}</td>
              <td style={{ ...cellStyle, fontWeight: 'bold' }}>{displayValue(consultant_total.总上门量)}</td>
              <td style={{ ...cellStyle, fontWeight: 'bold' }}>{displayValue(consultant_total.总报名)}</td>
              <td style={{ ...cellStyle, fontWeight: 'bold' }}>{consultant_total.总上门率}</td>
              <td style={{ ...cellStyle, fontWeight: 'bold' }}>{consultant_total.总转化率}</td>
              <td style={{ ...cellStyle, fontWeight: 'bold' }}>{consultant_total.当面转化率}</td>
              <td style={{ ...cellStyle, fontWeight: 'bold' }}>{displayValue(consultant_total.订座)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    )
  }, [allSourceConsultantData, currentCampus])
  
  // 渲染咨询量汇总计表（各来源汇总合计）
  const renderGrandSummaryTable = useCallback(() => {
    // 去掉"河北"前缀，只保留神殿名
    const campusShort = currentCampus?.replace(/^河北/, '') || ''
    const title = `清美教育（${campusShort}神殿）咨询量汇总合计`
    
    // 表头样式（橙黄色背景）
    const headerStyle: React.CSSProperties = {
      backgroundColor: '#F2A900',
      padding: '8px 12px',
      fontSize: '12px',
      fontWeight: 'bold',
      border: '1px solid #d9d9d9',
      whiteSpace: 'nowrap',
      textAlign: 'center',
    }
    
    // 单元格样式
    const cellStyle: React.CSSProperties = {
      padding: '8px 12px',
      fontSize: '14px',
      border: '1px solid #d9d9d9',
      whiteSpace: 'nowrap',
      textAlign: 'center',
    }
    
    // 直接使用全来源咨询师汇总的合计数据（已经包含传统大搜+新媒体+口碑+渠道的汇总）
    const total = allSourceConsultantData?.consultant_total
    
    // 月咨询总量
    const monthlyConsultTotal = total?.总咨询量 || 0
    
    // 月总上门量
    const monthlyVisitTotal = total?.总上门量 || 0
    
    // 月总报名数
    const monthlyEnrollTotal = total?.总报名 || 0
    
    // 月订座总数
    const monthlyBookedTotal = total?.订座 || 0
    
    // 总面转率 = 月总报名数 / 月总上门量
    const faceConversionRate = monthlyVisitTotal > 0 
      ? ((monthlyEnrollTotal / monthlyVisitTotal) * 100).toFixed(2) + '%'
      : '0.00%'
    
    return (
      <div style={{ marginTop: 16, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th colSpan={6} style={{ 
                backgroundColor: '#F2A900', 
                padding: '8px 12px', 
                fontWeight: 'bold', 
                fontSize: '14px',
                textAlign: 'center',
                border: '1px solid #d9d9d9'
              }}>
                {title}
              </th>
            </tr>
            <tr>
              <th style={headerStyle}>月咨询总量：</th>
              <th style={headerStyle}>月总上门量：</th>
              <th style={headerStyle}>月总报名数</th>
              <th style={headerStyle}>总面转率</th>
              <th style={headerStyle}>月订座总数</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={cellStyle}>{monthlyConsultTotal}</td>
              <td style={cellStyle}>{monthlyVisitTotal}</td>
              <td style={cellStyle}>{monthlyEnrollTotal}</td>
              <td style={cellStyle}>{faceConversionRate}</td>
              <td style={cellStyle}>{monthlyBookedTotal}</td>
            </tr>
          </tbody>
        </table>
      </div>
    )
  }, [allSourceConsultantData, currentCampus])
  
  // 渲染单个Section的表格
  const renderSectionTable = useCallback((section: SectionData | undefined, title: string, icon: React.ReactNode, color: string) => {
    if (!section) {
      return null
    }
    
    let columns: ColumnsType<any>
    let rowKey: string
    
    switch (section.section_type) {
      case 'network_sem':
      case 'network_newmedia':
        columns = mediaSourceColumns
        rowKey = 'source_name'
        break
      case 'reputation':
        columns = reputationColumns
        rowKey = 'provider_name'
        break
      case 'channel':
        columns = channelColumns
        rowKey = 'staff_name'
        break
      case 'consultant':
        columns = consultantColumns
        rowKey = 'consultant_name'
        break
      default:
        columns = mediaSourceColumns
        rowKey = 'source_name'
    }
    
    return (
      <Card 
        size="small" 
        title={
          <Space>
            {icon}
            <span style={{ color, fontWeight: 'bold' }}>{title}</span>
            <Tag color="blue">月咨询量: {section.totals.monthly_consult}</Tag>
            <Tag color="green">月报名: {section.totals.monthly_enrolled}</Tag>
            <Tag color={section.totals.face_enroll_rate >= 30 ? 'green' : 'orange'}>
              当面转化率: {formatPercent(section.totals.face_enroll_rate)}
            </Tag>
          </Space>
        }
        style={{ marginBottom: 16 }}
      >
        <Table
          columns={columns}
          dataSource={section.data}
          rowKey={rowKey}
          size="small"
          pagination={false}
          scroll={{ x: 900 }}
          bordered
          summary={() => (
            <Table.Summary fixed>
              <Table.Summary.Row style={{ background: '#fafafa', fontWeight: 'bold' }}>
                <Table.Summary.Cell index={0}>合计</Table.Summary.Cell>
                <Table.Summary.Cell index={1} align="center">{section.totals.daily_consult}</Table.Summary.Cell>
                <Table.Summary.Cell index={2} align="center">{section.totals.daily_visit}</Table.Summary.Cell>
                <Table.Summary.Cell index={3} align="center">{section.totals.daily_enrolled}</Table.Summary.Cell>
                {section.section_type === 'consultant' && (
                  <Table.Summary.Cell index={4} align="center">{section.totals.daily_booked ?? 0}</Table.Summary.Cell>
                )}
                <Table.Summary.Cell index={section.section_type === 'consultant' ? 5 : 4} align="center">{section.totals.monthly_consult}</Table.Summary.Cell>
                <Table.Summary.Cell index={section.section_type === 'consultant' ? 6 : 5} align="center">{section.totals.monthly_visit}</Table.Summary.Cell>
                <Table.Summary.Cell index={section.section_type === 'consultant' ? 7 : 6} align="center">{section.totals.monthly_enrolled}</Table.Summary.Cell>
                {section.section_type === 'consultant' && (
                  <Table.Summary.Cell index={8} align="center">{section.totals.monthly_refund ?? 0}</Table.Summary.Cell>
                )}
                <Table.Summary.Cell index={section.section_type === 'consultant' ? 9 : 7} align="center">{formatPercent(section.totals.visit_rate)}</Table.Summary.Cell>
                <Table.Summary.Cell index={section.section_type === 'consultant' ? 10 : 8} align="center">{formatPercent(section.totals.enroll_rate)}</Table.Summary.Cell>
                <Table.Summary.Cell index={section.section_type === 'consultant' ? 11 : 9} align="center">{formatPercent(section.totals.face_enroll_rate)}</Table.Summary.Cell>
              </Table.Summary.Row>
            </Table.Summary>
          )}
        />
      </Card>
    )
  }, [])
  
  return (
    <NoCopyContainer>
      <Card>
        <div style={{ marginBottom: 16 }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Title level={4} style={{ margin: 0 }}>
                {currentCampus || '全部神殿'} {selectedDate.format('M月D日')}前台日报表
              </Title>
            </Col>
            <Col>
              <Space>
                <DatePicker
                  value={selectedDate}
                  onChange={(date) => date && setSelectedDate(date)}
                  allowClear={false}
                  format="YYYY-MM-DD"
                />
                <Button
                  icon={<ReloadOutlined />}
                  onClick={loadData}
                  loading={loading}
                >
                  刷新
                </Button>
                <Button
                  icon={<ExportOutlined />}
                  disabled
                >
                  导出
                </Button>
              </Space>
            </Col>
          </Row>
        </div>
        
        <Spin spinning={loading}>
          {/* 第一张子表：网络汇总表（传统大搜+新媒体） */}
          {renderNetworkSummaryTable()}
          
          {/* 第二张子表：分析规划师数据汇总 */}
          {renderAnalystPlannerTable()}
          
          {/* 第三张子表：传统大搜（汇总+分析规划师明细） */}
          {renderTraditionalSearchTable()}
          
          {/* 第四张子表：新媒体（汇总+分析规划师明细） */}
          {renderNewmediaTable()}
          
          {/* 第五张子表：口碑（汇总+口碑提供人明细） */}
          {renderReputationTable()}
          
          {/* 第六张子表：口碑咨询师分配 */}
          {renderReputationConsultantTable()}
          
          {/* 第七张子表：神殿新媒体（汇总+新媒体介绍人明细+咨询师分配） */}
          {renderCampusNewMediaTable()}
          
          {/* 第八张子表：渠道（汇总+渠道代理明细+咨询师分配） */}
          {renderChannelTable()}
          
          {/* 第九张子表：全来源咨询师汇总（传统大搜+新媒体+口碑+渠道） */}
          {renderAllSourceConsultantTable()}
          
          {/* 第十张子表：咨询量汇总合计（各来源汇总） */}
          {renderGrandSummaryTable()}
          
          {/* 咨询师汇总 */}
          {renderSectionTable(getSection('consultant'), '咨询师汇总', <TeamOutlined />, '#eb2f96')}
        </Spin>
      </Card>
    </NoCopyContainer>
  )
}

export default DailyConsultingSummaryNew
