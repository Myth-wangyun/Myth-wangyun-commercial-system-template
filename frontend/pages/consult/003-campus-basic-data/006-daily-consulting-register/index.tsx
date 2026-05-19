/**
  * 006 咨询量数据综合查询表
 * 最高议事厅 > 祈福司 > 03.各个神殿基础数据
 * 
 * 包含多个Tab页：总表、网络、网络新媒体、市场口碑、合作伙伴、口碑、渠道、
 * 神殿新媒体、上门、报名人数明细、订座人数明细、无效量、不算量、石美的量系列
 * 
 * 筛选逻辑接入配置中心的市场配置规则，支持规则变动自适应
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { App,
  Card,
  Table,
  Button,
  DatePicker,
  Space,
  Typography,
  Tabs,
  Tag,
  Radio,
  Statistic,
  Row,
  Col,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Checkbox,
  Divider,
  Badge,
  Tooltip,
} from 'antd'
import {
  SearchOutlined,
  EditOutlined,
  ExportOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { RadioChangeEvent } from 'antd'
import dayjs from 'dayjs'
import { useCampusStore } from '@/stores/campusStore'
import CampusSelector from '@/components/common/CampusSelector'
import * as consultApi from '@/pages/consult/type-count-system/api'
import * as statsApi from '@/pages/consult/type-count-system/statsApi'
import { getConsultantNames } from '@/services/consult/consultantList'
import type { ConsultationRecord as ApiConsultationRecord, ConsultationQueryParams } from '@/pages/consult/type-count-system/types'

const { Title } = Typography
const { RangePicker } = DatePicker
const { Option } = Select
const { TextArea } = Input

// 筛选模式类型
type FilterMode = 'month' | 'range' | 'date'

// Tab类型定义 - 按Excel TAB顺序
type TabKey = 
  | 'total'           // 总表
  | 'sem'             // SEM (常规SEM平台)
  | 'network-new-media' // 网络新媒体
  | 'market-reputation' // 市场口碑
  | 'partner'         // 合作伙伴
  | 'free-promotion'  // 免费推广
  | 'reputation'      // 口碑
  | 'channel'         // 渠道
  | 'campus-new-media'  // 神殿新媒体
  | 'visit'           // 上门
  | 'enrollment'      // 报名人数明细
  | 'reservation'     // 订座人数明细
  | 'invalid'         // 无效量
  | 'not-counted'     // 不算量
  | 'shimei-volume'   // 石美的量
  | 'shimei-visit'    // 石美的量上门
  | 'shimei-enrollment' // 石美的量报名

// 配置中心的媒体来源树结构
interface MediaConfigTree {
  [category: string]: {  // 量来源
    [source: string]: string[]  // 媒体来源 -> 细分媒体列表
  }
}

// 咨询记录数据接口
interface ConsultingRecord {
  id: string
  记录ID?: number
  date: string                    // 日期
  totalSeq: number                // 总序号
  dailySeq: number                // 当日序
  consultant: string              // 咨询师
  代咨?: string                   // 代咨
  name: string                    // 姓名
  age: number                     // 年龄
  gender: '男' | '女' | '未知'    // 性别
  phone: string                   // 联系方式
  qq: string                      // QQ
  wechat: string                  // 微信
  education: string               // 学历
  status: string                  // 状态
  region: string                  // 地域
  地区?: string
  县?: string
  sourceType: string              // 量来源
  mediaSource: string             // 媒体来源
  intention: string               // 报名意向
  consultType: string             // 咨询类别
  consultCount: number            // 咨询次数
  keyword: string                 // 关键字
  consultResult: string           // 咨询结果
  chatSpecialist: string          // 网聊专员
  channelSpecialist?: string      // 渠道专员
  referrer?: string               // 供量人员（口碑提供人）
  分量人?: string                  // 分量人
  来源类别?: string                // 来源类别
  平台?: string                    // 平台（神殿新媒体）
  campus: string
  
  // 标记字段
  是否无效量?: number
  无效原因?: string
  是否不算量?: number
  不算量原因?: string
  是否上门?: number
  上门时间?: string
  是否报名?: number
  报名时间?: string
  是否订座?: number
  是否校园量?: number
  
  // 上门来源分类
  网转上门?: number
  网络新媒体?: number
  口碑上门?: number
  渠道上门?: number
  校园新渠道?: number
  新媒体来源?: number
  
  // 报名相关
  就读学校?: string
  报名专业?: string
  咨询时间?: string
  目前状态?: string
  长期短期?: string          // 长期/短期
  课程?: string              // 课程
  全款?: number              // 全款
  分期?: number              // 分期
  注册?: number              // 注册
  贷款?: number              // 贷款
  详细地址?: string          // 详细地址
  
  // 订座相关
  订座时间?: string
  订座金额?: number
  
  备注学生?: string
  
  createdAt?: string
  updatedAt?: string
}

// Tab配置 - 按Excel TAB顺序
const TAB_CONFIG: { key: TabKey; label: string; color?: string; description?: string }[] = [
  { key: 'total', label: '总表', color: '#1890ff', description: '所有有效咨询量（排除无效量和不算量）' },
  { key: 'sem', label: 'SEM', color: '#52c41a', description: '量来源=网络，媒体来源=常规SEM平台' },
  { key: 'network-new-media', label: '网络新媒体', color: '#13c2c2', description: '量来源=网络，来源类别=新媒体' },
  { key: 'market-reputation', label: '市场口碑', color: '#fa8c16', description: '网络→市场口碑' },
  { key: 'partner', label: '合作伙伴', color: '#722ed1', description: '量来源=合作伙伴/网络合作伙伴' },
  { key: 'free-promotion', label: '免费推广', color: '#87d068', description: '量来源=网络，媒体来源=免费推广' },
  { key: 'reputation', label: '口碑', color: '#faad14', description: '量来源=口碑' },
  { key: 'channel', label: '渠道', color: '#a0d911', description: '量来源=渠道' },
  { key: 'campus-new-media', label: '神殿新媒体', color: '#eb2f96', description: '量来源=神殿新媒体' },
  { key: 'visit', label: '上门', color: '#f5222d', description: '是否上门=1' },
  { key: 'enrollment', label: '报名人数明细', color: '#fa541c', description: '是否报名=1' },
  { key: 'reservation', label: '订座人数明细', color: '#f759ab', description: '是否订座=1' },
  { key: 'invalid', label: '无效量', color: '#ff4d4f', description: '是否无效量=1' },
  { key: 'not-counted', label: '不算量', color: '#8c8c8c', description: '是否不算量=1' },
  { key: 'shimei-volume', label: '石美的量', color: '#597ef7', description: '渠道专员=石美' },
  { key: 'shimei-visit', label: '石美的量上门', color: '#597ef7', description: '渠道专员=石美 且 已上门' },
  { key: 'shimei-enrollment', label: '石美的量报名', color: '#597ef7', description: '渠道专员=石美 且 已报名' },
]

// 学历选项
const EDUCATION_OPTIONS = ['初中', '三校生', '高中', '大专', '本科', '硕士', '其他', '初中待业', '初中在读', '高中在读', '三校生应届', '三校生在读', '高中应届', '大专应届', '本科待业']

// 状态选项
const STATUS_OPTIONS = ['应届', '待业', '在职', '在读', '其他']

const ConsultingDataCenter: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus, getAllCampuses, setCampus } = useCampusStore()
  const allCampuses = getAllCampuses()
  const defaultCampus = allCampuses[0]?.name ?? '主神殿'
  const activeCampus = currentCampus ?? defaultCampus

  // 如果当前神殿为空，设置默认神殿
  useEffect(() => {
    if (!currentCampus && defaultCampus) {
      setCampus(defaultCampus)
    }
  }, [currentCampus, defaultCampus, setCampus])

  const [dataSource, setDataSource] = useState<ConsultingRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<TabKey>('total')
  const [modalVisible, setModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<ConsultingRecord | null>(null)
  const [form] = Form.useForm()

  // 配置中心的媒体来源树 - 动态获取
  const [mediaConfigTree, setMediaConfigTree] = useState<MediaConfigTree>({})
  const [configLoading, setConfigLoading] = useState(false)
  
  // 动态生成的量来源和媒体来源选项
  const [sourceTypes, setSourceTypes] = useState<string[]>([])
  const [mediaSources, setMediaSources] = useState<string[]>([])

  // 筛选相关状态
  const [filterMode, setFilterMode] = useState<FilterMode>('month')
  const [selectedMonth, setSelectedMonth] = useState<dayjs.Dayjs>(dayjs())
  const [selectedDateRange, setSelectedDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null)
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs>(dayjs())

  // 咨询师下拉选项
  const [consultantOptions, setConsultantOptions] = useState<string[]>([])

  // 加载咨询师列表
  useEffect(() => {
    const loadConsultants = async () => {
      try {
        const names = await getConsultantNames(currentCampus || undefined)
        setConsultantOptions(names)
      } catch (e) {
        console.error('加载咨询师列表失败:', e)
      }
    }
    loadConsultants()
  }, [currentCampus])

  // 加载配置中心的媒体来源树
  const loadMediaConfig = useCallback(async () => {
    setConfigLoading(true)
    try {
      const response = await statsApi.getConfigTree()
      if (response.success && response.data) {
        setMediaConfigTree(response.data)
        
        // 提取量来源列表
        const sources = Object.keys(response.data)
        setSourceTypes(sources)
        
        // 提取所有媒体来源（二级+三级）
        const allMediaSources: string[] = []
        Object.values(response.data).forEach(category => {
          Object.entries(category).forEach(([sourceName, details]) => {
            allMediaSources.push(sourceName)
            if (Array.isArray(details)) {
              allMediaSources.push(...details)
            }
          })
        })
        setMediaSources([...new Set(allMediaSources)])
      }
    } catch (error) {
      console.error('加载媒体来源配置失败:', error)
      // 使用默认配置
      setSourceTypes(['网络', '口碑', '渠道', '神殿新媒体', '合作伙伴', '其他'])
    } finally {
      setConfigLoading(false)
    }
  }, [])

  // 初始化时加载配置
  useEffect(() => {
    loadMediaConfig()
  }, [loadMediaConfig])

  /**
   * 基于配置中心规则的动态筛选函数
   * 根据配置树判断记录是否属于某个分类
   */
  const filterByConfig = useMemo(() => {
    const 网络配置 = mediaConfigTree['网络'] || {}
    const SEM平台名称列表 = Object.keys(网络配置).filter((name) => name.includes('SEM'))
    const 新媒体平台名称列表 = Object.keys(网络配置).filter((name) => name.includes('新媒体'))
    const 免费推广名称列表 = Object.keys(网络配置).filter((name) => name.includes('免费推广'))

    // 获取网络下的新媒体平台细分列表
    const 新媒体平台细分 = 新媒体平台名称列表.flatMap((name) => 网络配置[name] || [])
    // 获取SEM平台细分列表（兼容“SEM平台/常规SEM平台”等命名）
    const SEM平台细分 = SEM平台名称列表.flatMap((name) => 网络配置[name] || [])
    // 免费推广细分列表
    const 免费推广细分 = 免费推广名称列表.flatMap((name) => 网络配置[name] || [])
    
    // 获取口碑下的所有媒体来源
    const 口碑媒体来源列表 = Object.keys(mediaConfigTree['口碑'] || {})
    
    return {
      // 有效记录：排除无效量和不算量
      isValid: (r: ConsultingRecord) => 
        (r.是否无效量 !== 1) && (r.是否不算量 !== 1),
      
      // SEM：量来源=网络 且 媒体来源属于常规SEM平台
      isSEM: (r: ConsultingRecord) => {
        if (r.sourceType !== '网络') return false
        return SEM平台细分.includes(r.mediaSource) ||
          SEM平台名称列表.includes(r.mediaSource) ||
          SEM平台名称列表.includes(r.来源类别 || '')
      },
      
      // 网络新媒体：量来源=网络 且 媒体来源属于新媒体平台细分
      isNetworkNewMedia: (r: ConsultingRecord) => {
        if (r.sourceType !== '网络') return false
        // 检查媒体来源是否在新媒体平台的细分列表中
        return 新媒体平台细分.includes(r.mediaSource) ||
          新媒体平台名称列表.includes(r.mediaSource) ||
          新媒体平台名称列表.includes(r.来源类别 || '') ||
          r.网络新媒体 === 1
      },
      
      // 市场口碑：量来源=口碑 且 媒体来源=市场口碑
      isMarketReputation: (r: ConsultingRecord) => 
        r.sourceType === '口碑' && r.mediaSource === '市场口碑',
      
      // 合作伙伴：量来源=合作伙伴 或 网络合作伙伴
      isPartner: (r: ConsultingRecord) => 
        r.sourceType === '合作伙伴' || r.sourceType === '网络合作伙伴',
      
      // 免费推广：量来源=网络 且 媒体来源属于免费推广
      isFreePromotion: (r: ConsultingRecord) => {
        if (r.sourceType !== '网络') return false
        return 免费推广细分.includes(r.mediaSource) || 
               免费推广名称列表.includes(r.mediaSource) ||
               免费推广名称列表.includes(r.来源类别 || '')
      },
      
      // 口碑：量来源=口碑（包含所有口碑类型）
      isReputation: (r: ConsultingRecord) => 
        r.sourceType === '口碑',
      
      // 渠道：量来源=渠道
      isChannel: (r: ConsultingRecord) => 
        r.sourceType === '渠道',
      
      // 神殿新媒体：量来源=神殿新媒体
      isCampusNewMedia: (r: ConsultingRecord) => 
        r.sourceType === '神殿新媒体' || r.新媒体来源 === 1,
      
      // 上门
      isVisit: (r: ConsultingRecord) => 
        r.是否上门 === 1,
      
      // 报名
      isEnrollment: (r: ConsultingRecord) => 
        r.是否报名 === 1,
      
      // 订座
      isReservation: (r: ConsultingRecord) => 
        r.是否订座 === 1,
      
      // 无效量
      isInvalid: (r: ConsultingRecord) => 
        r.是否无效量 === 1,
      
      // 不算量
      isNotCounted: (r: ConsultingRecord) => 
        r.是否不算量 === 1,
      
      // 石美的量：渠道专员=石美（示例，可按实际业务调整）
      isShimeiVolume: (r: ConsultingRecord) => 
        r.channelSpecialist === '石美' || r.chatSpecialist === '石美',
      
      // 石美的量上门
      isShimeiVisit: (r: ConsultingRecord) => 
        (r.channelSpecialist === '石美' || r.chatSpecialist === '石美') && r.是否上门 === 1,
      
      // 石美的量报名
      isShimeiEnrollment: (r: ConsultingRecord) => 
        (r.channelSpecialist === '石美' || r.chatSpecialist === '石美') && r.是否报名 === 1,
    }
  }, [mediaConfigTree])

  // 获取当前筛选的日期范围描述
  const getFilterDescription = () => {
    switch (filterMode) {
      case 'month':
        return `${selectedMonth.format('YYYY年M月')}`
      case 'range':
        if (selectedDateRange) {
          return `${selectedDateRange[0].format('YYYY-MM-DD')} 至 ${selectedDateRange[1].format('YYYY-MM-DD')}`
        }
        return ''
      case 'date':
        return `${selectedDate.format('YYYY年M月D日')}`
      default:
        return ''
    }
  }

  // 获取Tab对应的标题
  const getTabTitle = () => {
    const config = TAB_CONFIG.find(t => t.key === activeTab)
    return config?.label || '咨询记录'
  }

  // 根据当前Tab过滤数据 - 使用配置中心规则
  const getFilteredData = useCallback(() => {
    // 首先获取有效记录（排除无效量和不算量用于大部分TAB）
    const validRecords = dataSource.filter(filterByConfig.isValid)
    
    switch (activeTab) {
      case 'total':
        // 总表：所有有效记录
        return validRecords
        
      case 'sem':
        // SEM：量来源=网络 且 媒体来源=常规SEM平台
        return validRecords.filter(filterByConfig.isSEM)
        
      case 'network-new-media':
        // 网络新媒体：量来源=网络 且 媒体来源属于新媒体平台
        return validRecords.filter(filterByConfig.isNetworkNewMedia)
        
      case 'market-reputation':
        // 市场口碑：量来源=口碑 且 媒体来源=市场口碑
        return validRecords.filter(filterByConfig.isMarketReputation)
        
      case 'partner':
        // 合作伙伴：量来源=合作伙伴
        return validRecords.filter(filterByConfig.isPartner)
        
      case 'free-promotion':
        // 免费推广：量来源=网络 且 媒体来源=免费推广
        return validRecords.filter(filterByConfig.isFreePromotion)
        
      case 'reputation':
        // 口碑：量来源=口碑
        return validRecords.filter(filterByConfig.isReputation)
        
      case 'channel':
        // 渠道：量来源=渠道
        return validRecords.filter(filterByConfig.isChannel)
        
      case 'campus-new-media':
        // 神殿新媒体：量来源=神殿新媒体
        return validRecords.filter(filterByConfig.isCampusNewMedia)
        
      case 'visit':
        // 上门：是否上门=1
        return validRecords.filter(filterByConfig.isVisit)
        
      case 'enrollment':
        // 报名人数明细：是否报名=1
        return validRecords.filter(filterByConfig.isEnrollment)
        
      case 'reservation':
        // 订座人数明细：是否订座=1
        return validRecords.filter(filterByConfig.isReservation)
        
      case 'invalid':
        // 无效量：是否无效量=1（不使用有效记录过滤）
        return dataSource.filter(filterByConfig.isInvalid)
        
      case 'not-counted':
        // 不算量：是否不算量=1（不使用有效记录过滤）
        return dataSource.filter(filterByConfig.isNotCounted)
        
      case 'shimei-volume':
        // 石美的量
        return validRecords.filter(filterByConfig.isShimeiVolume)
        
      case 'shimei-visit':
        // 石美的量上门
        return validRecords.filter(filterByConfig.isShimeiVisit)
        
      case 'shimei-enrollment':
        // 石美的量报名
        return validRecords.filter(filterByConfig.isShimeiEnrollment)
        
      default:
        return validRecords
    }
  }, [activeTab, dataSource, filterByConfig])

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      // 构建查询参数
      const params: ConsultationQueryParams = {
        campus: activeCampus,
        page: 1,
        page_size: 1000, // 获取足够多的数据
      }
      
      // 根据筛选模式设置日期参数
      if (filterMode === 'month') {
        params.start_date = selectedMonth.startOf('month').format('YYYY-MM-DD')
        params.end_date = selectedMonth.endOf('month').format('YYYY-MM-DD')
      } else if (filterMode === 'range' && selectedDateRange) {
        params.start_date = selectedDateRange[0].format('YYYY-MM-DD')
        params.end_date = selectedDateRange[1].format('YYYY-MM-DD')
      } else if (filterMode === 'date') {
        params.start_date = selectedDate.format('YYYY-MM-DD')
        params.end_date = selectedDate.format('YYYY-MM-DD')
      }
      
      // 调用真实API获取数据
      const response = await consultApi.getConsultationRecords(params)
      
      // 转换数据格式
      const records: ConsultingRecord[] = response.数据列表.map((item: ApiConsultationRecord, index: number) => {
        const date = item.登记日期 ? dayjs(item.登记日期).format('YYYY-MM-DD') : ''
        const 量来源 = item.量来源 || ''
        const 媒体来源 = item.媒体来源 || ''
        const 来源类别 = (item as any).来源类别 || ''
        const 渠道专员 = item.渠道专员 || ''
        const recordCampus = item.神殿 || activeCampus
        const 是否上门 = item.是否上门 ?? 0
        
        // 计算标记量字段
        // 网转上门：常规SEM平台+网络合作伙伴+市场口碑
        const calc网转上门 = (量来源 === '网络' && 媒体来源 === '常规SEM平台') ||
                           量来源 === '网络合作伙伴' || 量来源 === '合作伙伴' ||
                           (量来源 === '口碑' && 媒体来源 === '市场口碑')
        
        // 网络新媒体：量来源=网络 且 来源类别=新媒体
        const calc网络新媒体 = 量来源 === '网络' && (来源类别 === '新媒体' || 来源类别 === '新媒体平台' || 媒体来源 === '新媒体平台')
        
        // 口碑上门：量来源=口碑
        const calc口碑上门 = 量来源 === '口碑'
        
        // 渠道上门：量来源=渠道
        const calc渠道上门 = 量来源 === '渠道'
        
        // 校园渠道：
        // 河北：石美渠道部门产生的咨询量委托给河北其他两个神殿(盛邦、冀美)帮忙转化，若上门算石美渠道的量，标1
        // 山西：太美渠道部门产生的咨询量委托给山西其他两个神殿(晋美、原美)帮忙转化，若上门算太美渠道的量，标1
        const calc校园渠道 = 
          (渠道专员 === '石美' && ['主神殿', '永恒殿', '盛邦', '冀美'].includes(recordCampus)) ||
          (渠道专员 === '太美' && ['李大殿', '智慧阁', '晋美', '原美'].includes(recordCampus))
        
        // 神殿新媒体：量来源=神殿新媒体 且 已上门
        const calc神殿新媒体 = 量来源 === '神殿新媒体'
        
        return {
          id: String(item.记录ID),
          记录ID: item.记录ID,
          date,
          totalSeq: index + 1,
          dailySeq: index + 1, // 这个需要按日期分组重新计算
          consultant: item.咨询师 || '',
          代咨: item.代咨 || '',
          name: item.咨询者姓名 || '',
          age: item.年龄 ? parseInt(item.年龄) : 0,
          gender: (item.性别 as '男' | '女' | '未知') || '未知',
          phone: item.电话 || '',
          qq: item.QQ || '',
          wechat: item.微信 || '',
          education: item.学历 || '',
          status: item.状态 || '',
          region: item.位置 || '',
          地区: item.地区 || '',
          县: item.县 || '',
          sourceType: 量来源,
          mediaSource: 媒体来源,
          intention: item.报名意向 || '',
          consultType: item.咨询类别 || '',
          consultCount: item.咨询次数 || 1,
          keyword: item.关键字 || '',
          consultResult: item.咨询结果 || item.备注 || '',
          chatSpecialist: item.网聊专员 || item.创建人姓名 || '',
          channelSpecialist: item.渠道专员 || '',
          referrer: item.口碑提供人 || '',
          分量人: item.分量人 || '',
          来源类别: 来源类别,
          平台: (item as any).平台 || '',
          campus: recordCampus,
          
          // 标记字段 - 直接从后端获取
          是否无效量: item.是否无效量 ?? 0,
          无效原因: item.无效原因 || '',
          是否不算量: item.是否不算量 ?? 0,
          不算量原因: item.不算量原因 || '',
          是否上门: 是否上门,
          上门时间: item.上门时间 || '',
          是否报名: item.是否报名 ?? 0,
          报名时间: item.报名时间 || '',
          是否订座: item.是否订座 ?? 0,
          是否校园量: item.是否校园量 ?? 0,
          
          // 标记量字段 - 优先使用后端数据，否则使用计算值（仅在上门时标1）
          网转上门: item.网转上门 ?? (是否上门 === 1 && calc网转上门 ? 1 : 0),
          网络新媒体: item.网络新媒体 ?? (是否上门 === 1 && calc网络新媒体 ? 1 : 0),
          口碑上门: item.口碑上门 ?? (是否上门 === 1 && calc口碑上门 ? 1 : 0),
          渠道上门: item.渠道上门 ?? (是否上门 === 1 && calc渠道上门 ? 1 : 0),
          校园新渠道: item.校园新渠道 ?? (是否上门 === 1 && calc校园渠道 ? 1 : 0),
          新媒体来源: item.新媒体来源 ?? (是否上门 === 1 && calc神殿新媒体 ? 1 : 0),
          
          就读学校: item.就读学校 || '',
          报名专业: item.报名专业 || '',
          咨询时间: item.咨询时间 || '',
          目前状态: item.目前状态 || '',
          长期短期: (item as any).长期短期 || '',
          课程: (item as any).课程 || '',
          全款: (item as any).全款 ?? 0,
          分期: (item as any).分期 ?? 0,
          注册: (item as any).注册 ?? 0,
          贷款: (item as any).贷款 ?? 0,
          详细地址: (item as any).详细地址 || '',
          订座时间: (item as any).订座时间 || '',
          订座金额: (item as any).订座金额 ?? 0,
          备注学生: '',
        }
      })
      
      // 按日期排序
      records.sort((a, b) => a.date.localeCompare(b.date))
      
      // 重新计算序号
      let totalSeq = 1
      const dateCountMap: Record<string, number> = {}
      records.forEach(record => {
        record.totalSeq = totalSeq++
        if (!dateCountMap[record.date]) {
          dateCountMap[record.date] = 0
        }
        dateCountMap[record.date]++
        record.dailySeq = dateCountMap[record.date]
      })
      
      setDataSource(records)
    } catch (error) {
      console.error('加载咨询数据失败:', error)
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }, [activeCampus, filterMode, selectedMonth, selectedDateRange, selectedDate])

  useEffect(() => {
    loadData()
  }, [loadData])

  // 筛选模式变化
  const handleFilterModeChange = (e: RadioChangeEvent) => {
    setFilterMode(e.target.value)
  }

  // Tab变化
  const handleTabChange = (key: string) => {
    setActiveTab(key as TabKey)
  }

  // 编辑记录
  const handleEdit = (record: ConsultingRecord) => {
    setEditingRecord(record)
    form.setFieldsValue({
      ...record,
      date: dayjs(record.date),
      上门时间: record.上门时间 ? dayjs(record.上门时间) : null,
      报名时间: record.报名时间 ? dayjs(record.报名时间) : null,
      订座时间: record.订座时间 ? dayjs(record.订座时间) : null,
      是否无效量: record.是否无效量 === 1,
      是否不算量: record.是否不算量 === 1,
      是否上门: record.是否上门 === 1,
      是否报名: record.是否报名 === 1,
      是否订座: record.是否订座 === 1,
      是否校园量: record.是否校园量 === 1,
      网转上门: record.网转上门 === 1,
      网络新媒体: record.网络新媒体 === 1,
      口碑上门: record.口碑上门 === 1,
      渠道上门: record.渠道上门 === 1,
      校园新渠道: record.校园新渠道 === 1,
      新媒体来源: record.新媒体来源 === 1,
      // 报名相关字段
      长期短期: record.长期短期,
      课程: record.课程,
      全款: record.全款,
      分期: record.分期,
      注册: record.注册,
      贷款: record.贷款,
      详细地址: record.详细地址,
      // 订座相关字段
      订座金额: record.订座金额,
    })
    setModalVisible(true)
  }

  // 保存记录
  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      
      if (!editingRecord?.记录ID) {
        message.error('记录ID不存在')
        return
      }
      
      // 调用API更新记录
      const updateData = {
        记录ID: editingRecord.记录ID,
        登记日期: values.date?.toISOString(),
        咨询师: values.consultant,
        咨询者姓名: values.name,
        电话: values.phone,
        年龄: values.age?.toString(),
        性别: values.gender,
        学历: values.education,
        状态: values.status,
        量来源: values.sourceType,
        媒体来源: values.mediaSource,
        备注: values.consultResult,
        // 标记字段
        是否无效量: values.是否无效量 ? 1 : 0,
        无效原因: values.无效原因,
        是否不算量: values.是否不算量 ? 1 : 0,
        不算量原因: values.不算量原因,
        是否上门: values.是否上门 ? 1 : 0,
        上门时间: values.上门时间?.toISOString(),
        是否报名: values.是否报名 ? 1 : 0,
        报名时间: values.报名时间?.toISOString(),
        是否订座: values.是否订座 ? 1 : 0,
        是否校园量: values.是否校园量 ? 1 : 0,
        网转上门: values.网转上门 ? 1 : 0,
        网络新媒体: values.网络新媒体 ? 1 : 0,
        口碑上门: values.口碑上门 ? 1 : 0,
        渠道上门: values.渠道上门 ? 1 : 0,
        校园新渠道: values.校园新渠道 ? 1 : 0,
        新媒体来源: values.新媒体来源 ? 1 : 0,
        就读学校: values.就读学校,
        报名专业: values.报名专业,
        咨询时间: values.咨询时间,
        // 报名相关新字段
        长期短期: values.长期短期,
        课程: values.课程,
        全款: values.全款 || 0,
        分期: values.分期 || 0,
        注册: values.注册 || 0,
        贷款: values.贷款 || 0,
        详细地址: values.详细地址,
        // 订座相关新字段
        订座时间: values.订座时间?.toISOString(),
        订座金额: values.订座金额 || 0,
      }
      
      await consultApi.updateConsultationRecord(updateData as any)
      
      message.success('保存成功')
      setModalVisible(false)
      setEditingRecord(null)
      form.resetFields()
      
      // 重新加载数据
      loadData()
    } catch (error) {
      console.error('保存失败:', error)
      message.error('保存失败')
    }
  }

  // 统计数据 - 使用配置中心规则动态计算
  const statistics = useMemo(() => {
    const validRecords = dataSource.filter(filterByConfig.isValid)
    
    return {
      total: validRecords.length,
      sem: validRecords.filter(filterByConfig.isSEM).length,
      networkNewMedia: validRecords.filter(filterByConfig.isNetworkNewMedia).length,
      marketReputation: validRecords.filter(filterByConfig.isMarketReputation).length,
      partner: validRecords.filter(filterByConfig.isPartner).length,
      freePromotion: validRecords.filter(filterByConfig.isFreePromotion).length,
      reputation: validRecords.filter(filterByConfig.isReputation).length,
      channel: validRecords.filter(filterByConfig.isChannel).length,
      campusNewMedia: validRecords.filter(filterByConfig.isCampusNewMedia).length,
      visit: validRecords.filter(filterByConfig.isVisit).length,
      enrollment: validRecords.filter(filterByConfig.isEnrollment).length,
      reservation: validRecords.filter(filterByConfig.isReservation).length,
      invalid: dataSource.filter(filterByConfig.isInvalid).length,
      notCounted: dataSource.filter(filterByConfig.isNotCounted).length,
      shimeiVolume: validRecords.filter(filterByConfig.isShimeiVolume).length,
      shimeiVisit: validRecords.filter(filterByConfig.isShimeiVisit).length,
      shimeiEnrollment: validRecords.filter(filterByConfig.isShimeiEnrollment).length,
    }
  }, [dataSource, filterByConfig])

  // 基础列定义
  const baseColumns: ColumnsType<ConsultingRecord> = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      width: 100,
      fixed: 'left',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '总序号',
      dataIndex: 'totalSeq',
      key: 'totalSeq',
      width: 65,
      align: 'center',
    },
    {
      title: '当日序',
      dataIndex: 'dailySeq',
      key: 'dailySeq',
      width: 65,
      align: 'center',
    },
    {
      title: '咨询师',
      dataIndex: 'consultant',
      key: 'consultant',
      width: 75,
      align: 'center',
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 75,
      align: 'center',
    },
    {
      title: '年龄',
      dataIndex: 'age',
      key: 'age',
      width: 55,
      align: 'center',
      render: (age: number) => age || '-',
    },
    {
      title: '性别',
      dataIndex: 'gender',
      key: 'gender',
      width: 55,
      align: 'center',
    },
    {
      title: '联系方式',
      dataIndex: 'phone',
      key: 'phone',
      width: 115,
      align: 'center',
    },
    {
      title: 'QQ',
      dataIndex: 'qq',
      key: 'qq',
      width: 100,
      align: 'center',
      render: (val: string) => val || '-',
    },
    {
      title: '微信',
      dataIndex: 'wechat',
      key: 'wechat',
      width: 100,
      align: 'center',
      render: (val: string) => val || '-',
    },
    {
      title: '学历',
      dataIndex: 'education',
      key: 'education',
      width: 80,
      align: 'center',
      render: (val: string) => val || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 60,
      align: 'center',
      render: (val: string) => val || '-',
    },
    {
      title: '地域',
      dataIndex: 'region',
      key: 'region',
      width: 80,
      align: 'center',
    },
    {
      title: '量来源',
      dataIndex: 'sourceType',
      key: 'sourceType',
      width: 80,
      align: 'center',
    },
    {
      title: '媒体来源',
      dataIndex: 'mediaSource',
      key: 'mediaSource',
      width: 90,
      align: 'center',
    },
    {
      title: '关键字',
      dataIndex: 'keyword',
      key: 'keyword',
      width: 180,
      ellipsis: true,
    },
    {
      title: '咨询结果',
      dataIndex: 'consultResult',
      key: 'consultResult',
      width: 200,
      ellipsis: true,
    },
    {
      title: '网聊专员',
      dataIndex: 'chatSpecialist',
      key: 'chatSpecialist',
      width: 80,
      align: 'center',
    },
    {
      title: '渠道专员',
      dataIndex: 'channelSpecialist',
      key: 'channelSpecialist',
      width: 80,
      align: 'center',
      render: (val: string) => val ? <span style={{ color: '#1890ff', fontWeight: 'bold' }}>{val}</span> : '-',
    },
    {
      title: '供量人员',
      dataIndex: 'referrer',
      key: 'referrer',
      width: 90,
      align: 'center',
      render: (val: string) => val ? <span style={{ color: '#f5222d', fontWeight: 'bold' }}>{val}</span> : '-',
    },
  ]

  // 根据Tab获取不同的列定义
  const getColumns = (): ColumnsType<ConsultingRecord> => {
    let columns = [...baseColumns]

    // 总表特殊列：添加分量人、来源类别-媒体来源、报名意向、咨询类别、咨询次数
    if (activeTab === 'total') {
      // 在咨询师后面插入分量人
      const consultantIdx = columns.findIndex(c => c.key === 'consultant')
      if (consultantIdx >= 0) {
        columns.splice(consultantIdx, 0, {
          title: '分量人',
          dataIndex: '分量人',
          key: '分量人',
          width: 75,
          align: 'center',
        })
      }
      // 在媒体来源后面添加来源类别
      const mediaIdx = columns.findIndex(c => c.key === 'mediaSource')
      if (mediaIdx >= 0) {
        columns.splice(mediaIdx, 0, {
          title: '来源类别',
          dataIndex: '来源类别',
          key: '来源类别',
          width: 90,
          align: 'center',
        })
      }
      // 在关键字前面添加报名意向、咨询类别、咨询次数
      const keywordIdx = columns.findIndex(c => c.key === 'keyword')
      if (keywordIdx >= 0) {
        columns.splice(keywordIdx, 0, 
          {
            title: '报名意向',
            dataIndex: 'intention',
            key: 'intention',
            width: 90,
            align: 'center',
          },
          {
            title: '咨询类别',
            dataIndex: 'consultType',
            key: 'consultType',
            width: 90,
            align: 'center',
          },
          {
            title: '咨询次数',
            dataIndex: 'consultCount',
            key: 'consultCount',
            width: 70,
            align: 'center',
          }
        )
      }
    }

    // SEM Tab: 按照指定列顺序
    if (activeTab === 'sem') {
      // 移除不需要的列（分量人相关），保持SEM需要的列
      columns = columns.filter(c => !['intention', 'consultType', 'consultCount', '分量人', '来源类别'].includes(c.key as string))
    }

    // 网络新媒体/市场口碑/合作伙伴/免费推广：添加备注列
    if (['network-new-media', 'market-reputation', 'partner', 'free-promotion'].includes(activeTab)) {
      // 在咨询结果前插入备注列（用consultResult作为备注显示）
      const resultIdx = columns.findIndex(c => c.key === 'consultResult')
      if (resultIdx >= 0) {
        columns.splice(resultIdx, 0, {
          title: '备注',
          dataIndex: 'consultResult',
          key: 'remark',
          width: 150,
          ellipsis: true,
        })
        // 移除原有的咨询结果列，因为备注就是咨询结果
        columns = columns.filter(c => c.key !== 'consultResult')
      }
    }

    // 口碑Tab: 添加来源类别、供量人员
    if (activeTab === 'reputation') {
      // 移除关键字列，添加来源类别
      const mediaIdx = columns.findIndex(c => c.key === 'mediaSource')
      if (mediaIdx >= 0) {
        columns.splice(mediaIdx + 1, 0, {
          title: '来源类别',
          dataIndex: '来源类别',
          key: '来源类别',
          width: 90,
          align: 'center',
        })
      }
    }

    // 渠道Tab: 简化列，移除QQ/微信，添加第一信息来源/来源
    if (activeTab === 'channel') {
      columns = columns.filter(c => !['qq', 'wechat'].includes(c.key as string))
      // 渠道专员列名改为渠道专员
    }

    // 神殿新媒体Tab: 添加供量人、平台列
    if (activeTab === 'campus-new-media') {
      const mediaIdx = columns.findIndex(c => c.key === 'mediaSource')
      if (mediaIdx >= 0) {
        columns.splice(mediaIdx + 1, 0, 
          {
            title: '供量人',
            dataIndex: 'referrer',
            key: 'provider',
            width: 80,
            align: 'center',
          },
          {
            title: '平台',
            dataIndex: '平台',
            key: '平台',
            width: 80,
            align: 'center',
          }
        )
      }
    }

    // 上门表增加上门相关列（带标记量）
    if (activeTab === 'visit' || activeTab === 'shimei-visit') {
      columns = [
        ...columns.slice(0, 4),
        {
          title: '代咨',
          dataIndex: '代咨',
          key: '代咨',
          width: 75,
          align: 'center',
        },
        {
          title: '网转上门',
          dataIndex: '网转上门',
          key: '网转上门',
          width: 75,
          align: 'center',
          render: (v: number) => v === 1 ? <Tag color="blue">1</Tag> : '-',
        },
        {
          title: '网络新媒体',
          dataIndex: '网络新媒体',
          key: '网络新媒体',
          width: 85,
          align: 'center',
          render: (v: number) => v === 1 ? <Tag color="green">1</Tag> : '-',
        },
        {
          title: '口碑上门',
          dataIndex: '口碑上门',
          key: '口碑上门',
          width: 75,
          align: 'center',
          render: (v: number) => v === 1 ? <Tag color="orange">1</Tag> : '-',
        },
        {
          title: '渠道上门',
          dataIndex: '渠道上门',
          key: '渠道上门',
          width: 75,
          align: 'center',
          render: (v: number) => v === 1 ? <Tag color="purple">1</Tag> : '-',
        },
        {
          title: '校园渠道',
          dataIndex: '校园新渠道',
          key: '校园新渠道',
          width: 80,
          align: 'center',
          render: (v: number) => v === 1 ? <Tag color="cyan">1</Tag> : '-',
        },
        {
          title: '神殿新媒体',
          dataIndex: '新媒体来源',
          key: '新媒体来源',
          width: 85,
          align: 'center',
          render: (v: number) => v === 1 ? <Tag color="magenta">1</Tag> : '-',
        },
        ...columns.slice(4),
      ]
    }

    // 报名表增加报名相关列（带标记量）
    if (activeTab === 'enrollment' || activeTab === 'shimei-enrollment') {
      const baseEnrollmentCols = columns.slice(0, 4)
      const restCols = columns.slice(4)
      columns = [
        ...baseEnrollmentCols,
        {
          title: '代咨',
          dataIndex: '代咨',
          key: '代咨',
          width: 60,
          align: 'center',
        },
        {
          title: '网转报名',
          dataIndex: '网转上门',
          key: '网转报名',
          width: 75,
          align: 'center',
          render: (v: number) => v === 1 ? <Tag color="blue">1</Tag> : '-',
        },
        {
          title: '网络新媒体',
          dataIndex: '网络新媒体',
          key: '网络新媒体',
          width: 85,
          align: 'center',
          render: (v: number) => v === 1 ? <Tag color="green">1</Tag> : '-',
        },
        {
          title: '口碑报名',
          dataIndex: '口碑上门',
          key: '口碑报名',
          width: 75,
          align: 'center',
          render: (v: number) => v === 1 ? <Tag color="orange">1</Tag> : '-',
        },
        {
          title: '渠道报名',
          dataIndex: '渠道上门',
          key: '渠道报名',
          width: 75,
          align: 'center',
          render: (v: number) => v === 1 ? <Tag color="purple">1</Tag> : '-',
        },
        {
          title: '校园渠道',
          dataIndex: '校园新渠道',
          key: '校园渠道',
          width: 80,
          align: 'center',
          render: (v: number) => v === 1 ? <Tag color="cyan">1</Tag> : '-',
        },
        {
          title: '新媒体',
          dataIndex: '新媒体来源',
          key: '新媒体',
          width: 70,
          align: 'center',
          render: (v: number) => v === 1 ? <Tag color="magenta">1</Tag> : '-',
        },
        ...restCols.slice(0, 4), // 姓名、年龄、性别、联系电话
        {
          title: '就读学校',
          dataIndex: '就读学校',
          key: '就读学校',
          width: 120,
          align: 'center',
        },
        {
          title: '目前状态',
          dataIndex: '目前状态',
          key: '目前状态',
          width: 80,
          align: 'center',
        },
        ...restCols.slice(4).filter(c => !['就读学校'].includes(c.key as string)),
        {
          title: '上门时间',
          dataIndex: '上门时间',
          key: '上门时间',
          width: 100,
          align: 'center',
        },
        {
          title: '学制',
          dataIndex: '长期短期',
          key: '学制',
          width: 70,
          align: 'center',
        },
        {
          title: '课程',
          dataIndex: '课程',
          key: '课程',
          width: 100,
          align: 'center',
        },
        {
          title: '全款',
          dataIndex: '全款',
          key: '全款',
          width: 80,
          align: 'center',
        },
        {
          title: '分期',
          dataIndex: '分期',
          key: '分期',
          width: 80,
          align: 'center',
        },
        {
          title: '注册',
          dataIndex: '注册',
          key: '注册',
          width: 70,
          align: 'center',
        },
        {
          title: '贷款',
          dataIndex: '贷款',
          key: '贷款',
          width: 70,
          align: 'center',
        },
        {
          title: '详细地址',
          dataIndex: '详细地址',
          key: '详细地址',
          width: 150,
          ellipsis: true,
        },
      ]
    }

    // 订座表类似报名表结构
    if (activeTab === 'reservation') {
      const baseReservationCols = columns.slice(0, 4)
      const restCols = columns.slice(4)
      columns = [
        ...baseReservationCols,
        {
          title: '代咨',
          dataIndex: '代咨',
          key: '代咨',
          width: 60,
          align: 'center',
        },
        {
          title: '网转报名',
          dataIndex: '网转上门',
          key: '网转报名',
          width: 75,
          align: 'center',
          render: (v: number) => v === 1 ? <Tag color="blue">1</Tag> : '-',
        },
        {
          title: '网络新媒体',
          dataIndex: '网络新媒体',
          key: '网络新媒体',
          width: 85,
          align: 'center',
          render: (v: number) => v === 1 ? <Tag color="green">1</Tag> : '-',
        },
        {
          title: '口碑报名',
          dataIndex: '口碑上门',
          key: '口碑报名',
          width: 75,
          align: 'center',
          render: (v: number) => v === 1 ? <Tag color="orange">1</Tag> : '-',
        },
        {
          title: '渠道报名',
          dataIndex: '渠道上门',
          key: '渠道报名',
          width: 75,
          align: 'center',
          render: (v: number) => v === 1 ? <Tag color="purple">1</Tag> : '-',
        },
        {
          title: '校园渠道',
          dataIndex: '校园新渠道',
          key: '校园渠道',
          width: 80,
          align: 'center',
          render: (v: number) => v === 1 ? <Tag color="cyan">1</Tag> : '-',
        },
        {
          title: '新媒体',
          dataIndex: '新媒体来源',
          key: '新媒体',
          width: 70,
          align: 'center',
          render: (v: number) => v === 1 ? <Tag color="magenta">1</Tag> : '-',
        },
        ...restCols.slice(0, 4), // 姓名、年龄、性别、联系电话
        {
          title: '就读学校',
          dataIndex: '就读学校',
          key: '就读学校',
          width: 120,
          align: 'center',
        },
        {
          title: '目前状态',
          dataIndex: '目前状态',
          key: '目前状态',
          width: 80,
          align: 'center',
        },
        ...restCols.slice(4).filter(c => !['就读学校'].includes(c.key as string)),
        {
          title: '订座时间',
          dataIndex: '订座时间',
          key: '订座时间',
          width: 100,
          align: 'center',
        },
        {
          title: '订座金额',
          dataIndex: '订座金额',
          key: '订座金额',
          width: 80,
          align: 'center',
        },
      ]
    }

    // 无效量表增加无效原因列
    if (activeTab === 'invalid') {
      columns = [
        ...columns,
        {
          title: '无效原因',
          dataIndex: '无效原因',
          key: '无效原因',
          width: 120,
          align: 'center',
        },
      ]
    }

    // 不算量表增加不算量原因列
    if (activeTab === 'not-counted') {
      columns = [
        ...columns,
        {
          title: '不算量原因',
          dataIndex: '不算量原因',
          key: '不算量原因',
          width: 120,
          align: 'center',
        },
      ]
    }

    // 所有表都增加操作列
    columns.push({
      title: '操作',
      key: 'actions',
      width: 80,
      fixed: 'right',
      align: 'center',
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          icon={<EditOutlined />}
          onClick={() => handleEdit(record)}
        >
          编辑
        </Button>
      ),
    })

    return columns
  }

  const filteredData = getFilteredData()

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Title level={4} style={{ margin: 0 }}>
            {activeCampus}{getFilterDescription()}{getTabTitle()}
          </Title>
          <CampusSelector useGlobalState={true} />
        </div>

        {/* 筛选区域 */}
        <div style={{ marginBottom: 16, padding: 16, background: '#fafafa', borderRadius: 4 }}>
          <Space wrap size="middle">
            <span style={{ fontWeight: 500 }}>筛选方式：</span>
            <Radio.Group value={filterMode} onChange={handleFilterModeChange}>
              <Radio.Button value="month">按年月</Radio.Button>
              <Radio.Button value="range">按范围</Radio.Button>
              <Radio.Button value="date">按日期</Radio.Button>
            </Radio.Group>

            {filterMode === 'month' && (
              <DatePicker
                picker="month"
                value={selectedMonth}
                onChange={(date) => date && setSelectedMonth(date)}
                allowClear={false}
                placeholder="选择年月"
              />
            )}

            {filterMode === 'range' && (
              <RangePicker
                value={selectedDateRange}
                onChange={(dates) => setSelectedDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
                placeholder={['开始日期', '结束日期']}
              />
            )}

            {filterMode === 'date' && (
              <DatePicker
                value={selectedDate}
                onChange={(date) => date && setSelectedDate(date)}
                allowClear={false}
                placeholder="选择日期"
              />
            )}

            <Button type="primary" icon={<SearchOutlined />} onClick={loadData}>
              查询
            </Button>
            <Button icon={<ReloadOutlined />} onClick={loadData}>
              刷新
            </Button>
            <Button icon={<ExportOutlined />}>
              导出
            </Button>
          </Space>
        </div>

        {/* 统计卡片 */}
        <Card size="small" style={{ marginBottom: 16, background: '#f5f5f5' }}>
          <Row gutter={16}>
            <Col span={2}>
              <Statistic title="总量" value={statistics.total} valueStyle={{ color: '#1890ff', fontSize: 16 }} />
            </Col>
            <Col span={2}>
              <Statistic title="SEM" value={statistics.sem} valueStyle={{ color: '#52c41a', fontSize: 16 }} />
            </Col>
            <Col span={2}>
              <Statistic title="网络新媒体" value={statistics.networkNewMedia} valueStyle={{ fontSize: 16 }} />
            </Col>
            <Col span={2}>
              <Statistic title="免费推广" value={statistics.freePromotion} valueStyle={{ fontSize: 16 }} />
            </Col>
            <Col span={2}>
              <Statistic title="市场口碑" value={statistics.marketReputation} valueStyle={{ fontSize: 16 }} />
            </Col>
            <Col span={2}>
              <Statistic title="合作伙伴" value={statistics.partner} valueStyle={{ fontSize: 16 }} />
            </Col>
            <Col span={2}>
              <Statistic title="口碑" value={statistics.reputation} valueStyle={{ fontSize: 16 }} />
            </Col>
            <Col span={2}>
              <Statistic title="渠道" value={statistics.channel} valueStyle={{ fontSize: 16 }} />
            </Col>
            <Col span={2}>
              <Statistic title="神殿新媒体" value={statistics.campusNewMedia} valueStyle={{ fontSize: 16 }} />
            </Col>
            <Col span={2}>
              <Statistic title="上门" value={statistics.visit} valueStyle={{ color: '#faad14', fontSize: 16 }} />
            </Col>
            <Col span={2}>
              <Statistic title="报名" value={statistics.enrollment} valueStyle={{ color: '#f5222d', fontSize: 16 }} />
            </Col>
            <Col span={2}>
              <Statistic title="无效量" value={statistics.invalid} valueStyle={{ color: '#999', fontSize: 16 }} />
            </Col>
          </Row>
        </Card>

        {/* Tab页签 - 带数量显示 */}
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          type="card"
          items={TAB_CONFIG.map(tab => {
            // 获取对应的统计数量
            const getTabCount = (key: TabKey) => {
              switch (key) {
                case 'total': return statistics.total
                case 'sem': return statistics.sem
                case 'network-new-media': return statistics.networkNewMedia
                case 'market-reputation': return statistics.marketReputation
                case 'partner': return statistics.partner
                case 'free-promotion': return statistics.freePromotion
                case 'reputation': return statistics.reputation
                case 'channel': return statistics.channel
                case 'campus-new-media': return statistics.campusNewMedia
                case 'visit': return statistics.visit
                case 'enrollment': return statistics.enrollment
                case 'reservation': return statistics.reservation
                case 'invalid': return statistics.invalid
                case 'not-counted': return statistics.notCounted
                case 'shimei-volume': return statistics.shimeiVolume
                case 'shimei-visit': return statistics.shimeiVisit
                case 'shimei-enrollment': return statistics.shimeiEnrollment
                default: return 0
              }
            }
            const count = getTabCount(tab.key)
            return {
              key: tab.key,
              label: (
                <Tooltip title={tab.description}>
                  <Space size={4}>
                    <span style={{ color: tab.color }}>{tab.label}</span>
                    <Badge 
                      count={count} 
                      overflowCount={9999} 
                      showZero
                      style={{ backgroundColor: count > 0 ? tab.color : '#d9d9d9' }}
                    />
                  </Space>
                </Tooltip>
              ),
            }
          })}
        />

        {/* 数据表格 */}
        <Table<ConsultingRecord>
          columns={getColumns()}
          dataSource={filteredData}
          rowKey="id"
          bordered
          loading={loading}
          pagination={{
            defaultPageSize: 50,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          scroll={{ x: 2000 }}
          size="small"
        />
      </Card>

      {/* 编辑弹窗 */}
      <Modal
        title="编辑咨询记录"
        open={modalVisible}
        onOk={handleSave}
        onCancel={() => {
          setModalVisible(false)
          setEditingRecord(null)
          form.resetFields()
        }}
        width={1000}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="date" label="日期">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="consultant" label="咨询师">
                <Select
                  showSearch
                  allowClear
                  placeholder="选择咨询师"
                  optionFilterProp="children"
                >
                  {consultantOptions.map(name => (
                    <Option key={name} value={name}>{name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="name" label="姓名">
                <Input />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="phone" label="联系方式">
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={4}>
              <Form.Item name="age" label="年龄">
                <InputNumber min={0} max={100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item name="gender" label="性别">
                <Select>
                  <Option value="男">男</Option>
                  <Option value="女">女</Option>
                  <Option value="未知">未知</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item name="education" label="学历">
                <Select allowClear>
                  {EDUCATION_OPTIONS.map(opt => (
                    <Option key={opt} value={opt}>{opt}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item name="status" label="状态">
                <Select allowClear>
                  {STATUS_OPTIONS.map(opt => (
                    <Option key={opt} value={opt}>{opt}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item name="sourceType" label="量来源">
                <Select 
                  allowClear 
                  loading={configLoading}
                  showSearch
                  placeholder="选择量来源"
                  optionFilterProp="children"
                >
                  {sourceTypes.map(opt => (
                    <Option key={opt} value={opt}>{opt}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item name="mediaSource" label="媒体来源">
                <Select 
                  allowClear 
                  loading={configLoading}
                  showSearch
                  placeholder="选择媒体来源"
                  optionFilterProp="children"
                >
                  {mediaSources.map(opt => (
                    <Option key={opt} value={opt}>{opt}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">标记选项</Divider>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="无效原因" label="无效原因">
                <Input placeholder="输入无效原因" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={4}>
              <Form.Item name="是否无效量" valuePropName="checked">
                <Checkbox>无效量</Checkbox>
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item name="是否不算量" valuePropName="checked">
                <Checkbox>不算量</Checkbox>
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item name="是否上门" valuePropName="checked">
                <Checkbox>上门</Checkbox>
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item name="是否报名" valuePropName="checked">
                <Checkbox>报名</Checkbox>
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item name="是否订座" valuePropName="checked">
                <Checkbox>订座</Checkbox>
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item name="是否校园量" valuePropName="checked">
                <Checkbox>校园量</Checkbox>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="不算量原因" label="不算量原因">
                <Input placeholder="输入不算量原因" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="上门时间" label="上门时间">
                <DatePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">上门来源分类</Divider>

          <Row gutter={16}>
            <Col span={4}>
              <Form.Item name="网转上门" valuePropName="checked">
                <Checkbox>网转上门</Checkbox>
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item name="网络新媒体" valuePropName="checked">
                <Checkbox>网络新媒体</Checkbox>
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item name="口碑上门" valuePropName="checked">
                <Checkbox>口碑上门</Checkbox>
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item name="渠道上门" valuePropName="checked">
                <Checkbox>渠道上门</Checkbox>
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item name="校园新渠道" valuePropName="checked">
                <Checkbox>校园新渠道</Checkbox>
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item name="新媒体来源" valuePropName="checked">
                <Checkbox>新媒体来源</Checkbox>
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
                  <Divider orientation="left">报名信息</Divider>
                  <Row gutter={16}>
                    <Col span={6}>
                      <Form.Item name="报名时间" label="报名时间">
                        <DatePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item name="就读学校" label="就读学校">
                        <Input placeholder="就读学校" />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item name="报名专业" label="报名专业">
                        <Input placeholder="报名专业" />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item name="咨询时间" label="咨询时间">
                        <Input placeholder="如: 4.29 11:00" />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={4}>
                      <Form.Item name="长期短期" label="长期/短期">
                        <Select placeholder="选择" allowClear>
                          <Option value="长期">长期</Option>
                          <Option value="短期">短期</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={4}>
                      <Form.Item name="课程" label="课程">
                        <Input placeholder="课程" />
                      </Form.Item>
                    </Col>
                    <Col span={4}>
                      <Form.Item name="全款" label="全款">
                        <InputNumber placeholder="全款金额" style={{ width: '100%' }} min={0} />
                      </Form.Item>
                    </Col>
                    <Col span={4}>
                      <Form.Item name="分期" label="分期">
                        <InputNumber placeholder="分期金额" style={{ width: '100%' }} min={0} />
                      </Form.Item>
                    </Col>
                    <Col span={4}>
                      <Form.Item name="注册" label="注册">
                        <InputNumber placeholder="注册金额" style={{ width: '100%' }} min={0} />
                      </Form.Item>
                    </Col>
                    <Col span={4}>
                      <Form.Item name="贷款" label="贷款">
                        <InputNumber placeholder="贷款金额" style={{ width: '100%' }} min={0} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="详细地址" label="详细地址">
                        <Input placeholder="详细地址" />
                      </Form.Item>
                    </Col>
                  </Row>
                </>
              ) : null
            }
          </Form.Item>

          {/* 订座相关 - 仅在勾选是否订座时显示 */}
          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => 
              prevValues.是否订座 !== currentValues.是否订座
            }
          >
            {({ getFieldValue }) => 
              getFieldValue('是否订座') ? (
                <>
                  <Divider orientation="left">订座信息</Divider>
                  <Row gutter={16}>
                    <Col span={6}>
                      <Form.Item name="订座时间" label="订座时间">
                        <DatePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item name="订座金额" label="订座金额">
                        <InputNumber placeholder="订座金额" style={{ width: '100%' }} min={0} />
                      </Form.Item>
                    </Col>
                  </Row>
                </>
              ) : null
            }
          </Form.Item>

          <Divider orientation="left">其他</Divider>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="consultResult" label="咨询结果">
                <TextArea rows={2} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  )
}

export default ConsultingDataCenter
