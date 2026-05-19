/**
 * 咨询量模拟生成器 - 仅开发模式使用
 * 用于生成模拟咨询量数据，测试各种业务场景
 */
import React, { useState, useEffect } from 'react'
import { App,
  Card,
  Form,
  InputNumber,
  Button,
  Select,
  DatePicker,
  Space,
  Typography,
  Progress,
  Divider,
  Checkbox,
  Row,
  Col,
  Tag,
  Alert,
  Table,
  Collapse,
  Spin,
} from 'antd'
import {
  ThunderboltOutlined,
  DeleteOutlined,
  ExperimentOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { useCampusStore } from '@/stores/campusStore'
import * as consultApi from './api'
import { getConsultantsConfig } from '@/services/consult/consultantList'
import { fetchUserPermissions, type UserPermissionInfo } from '@/services/configMaster'
import type { CreateConsultationRequest } from './types'

const { Title, Text } = Typography
const { Option } = Select
const { RangePicker } = DatePicker

// ==================== 模拟数据配置 ====================

// 姓名库
const SURNAMES = ['张', '王', '李', '赵', '刘', '陈', '杨', '黄', '周', '吴', '徐', '孙', '马', '朱', '胡', '郭', '林', '何', '高', '罗']
const NAMES_MALE = ['伟', '强', '磊', '军', '洋', '勇', '杰', '涛', '明', '超', '华', '刚', '鹏', '飞', '浩', '志', '龙', '辉', '建', '斌']
const NAMES_FEMALE = ['芳', '娜', '敏', '静', '丽', '艳', '霞', '玲', '婷', '萍', '红', '梅', '燕', '云', '莉', '雪', '慧', '欣', '琴', '倩']

// 学历选项
const EDUCATION_OPTIONS = [
  { value: '初中', weight: 15, type: '初中生' },
  { value: '初中待业', weight: 5, type: '初中生' },
  { value: '初中在读', weight: 5, type: '初中生' },
  { value: '三校生', weight: 10, type: '高中/三校生' },
  { value: '三校生应届', weight: 5, type: '高中/三校生' },
  { value: '三校生在读', weight: 5, type: '高中/三校生' },
  { value: '高中', weight: 10, type: '高中/三校生' },
  { value: '高中在读', weight: 5, type: '高中/三校生' },
  { value: '高中应届', weight: 5, type: '高中/三校生' },
  { value: '大专', weight: 15, type: '大学生' },
  { value: '大专应届', weight: 5, type: '大学生' },
  { value: '本科', weight: 10, type: '大学生' },
  { value: '本科待业', weight: 3, type: '大学生' },
  { value: '硕士', weight: 2, type: '大学生' },
]

// 状态选项
const STATUS_OPTIONS = [
  { value: '待业', weight: 40 },
  { value: '在读', weight: 25 },
  { value: '应届', weight: 20 },
  { value: '在职', weight: 10 },
  { value: '其他', weight: 5 },
]

// 量来源配置 - 严格按照配置中心数据库结构
const SOURCE_CONFIG = [
  {
    name: '网络',
    weight: 50,
    mediaSources: [
      { 
        name: '新媒体平台', 
        weight: 30,
        details: ['抖音', '快手', '微信视频号', '小红书', 'B站']
      },
      { 
        name: '常规SEM平台', 
        weight: 40,
        details: ['百度推广', '中心来电', '在线报名/网站留言', '百度表单']
      },
      { 
        name: '网络合作伙伴', 
        weight: 15,
        details: ['百教网', '91搜客', '知了好学', '坦途网', '厚学网']
      },
      { 
        name: '免费推广', 
        weight: 15,
        details: ['社交化媒体', '问答', '分类信息', '地图', '视频']
      },
      { name: '市场口碑', weight: 10, details: [] },
    ],
  },
  {
    name: '渠道',
    weight: 15,
    mediaSources: [], // 没有子项
  },
  {
    name: '口碑',
    weight: 20,
    mediaSources: [
      { name: '咨询口碑', weight: 25, details: [] },
      { name: '教质口碑', weight: 15, details: [] },
      { name: '教学口碑', weight: 15, details: [] },
      { name: '校园口碑', weight: 15, details: [] },
      { name: '总部口碑', weight: 10, details: [] },
      { name: '其他口碑', weight: 5, details: [] },
    ],
  },
  {
    name: '神殿新媒体',
    weight: 8,
    mediaSources: [], // 没有子项
  },
  {
    name: '其他',
    weight: 7,
    mediaSources: [], // 没有子项
  },
]

// 咨询类别
const CONSULT_CATEGORIES = ['UI设计', 'Java开发', 'Web前端', 'Python', '软件测试', '网络运维', '电商运营', '影视后期', '室内设计', '游戏开发']

// 报名意向
const INTENTIONS = ['UI设计', 'Java开发', 'Web前端', 'Python', '软件测试', '网络运维', '电商运营', '影视后期', '室内设计', '游戏开发', '待定', '已报名']

// 地区
const REGIONS = ['太原', '大同', '临汾', '运城', '长治', '晋中', '忻州', '吕梁', '晋城', '阳泉', '朔州']

// 默认咨询师配置（当API请求失败时使用）
const DEFAULT_CONSULTANTS_CONFIG: Record<string, string[]> = {
  '主神殿': ['张老师', '李老师', '王老师', '刘老师', '陈老师'],
  '龙城神殿': ['赵老师', '钱老师', '孙老师', '周老师'],
  '北美神殿': ['吴老师', '郑老师', '王老师'],
  '山西光明殿': ['林老师', '何老师', '高老师', '马老师'],
  '临汾神殿': ['胡老师', '朱老师'],
  '长治神殿': ['郭老师', '杨老师'],
  '吕梁神殿': ['黄老师'],
  '大同神殿': ['徐老师', '罗老师'],
  '榆林神殿': ['许老师'],
}

// ==================== 工具函数 ====================

// 随机选择（带权重）
function weightedRandom<T extends { weight: number }>(items: T[]): T {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0)
  let random = Math.random() * totalWeight
  for (const item of items) {
    random -= item.weight
    if (random <= 0) return item
  }
  return items[items.length - 1]
}

// 随机选择（不带权重）
function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

// 生成随机姓名
function generateName(): { name: string; gender: '男' | '女' } {
  const gender = Math.random() > 0.45 ? '男' : '女'
  const surname = randomPick(SURNAMES)
  const nameChars = gender === '男' ? NAMES_MALE : NAMES_FEMALE
  const nameLength = Math.random() > 0.7 ? 2 : 1
  let name = surname
  for (let i = 0; i < nameLength; i++) {
    name += randomPick(nameChars)
  }
  return { name, gender }
}

// 生成随机电话号码
function generatePhone(): string {
  const prefixes = ['130', '131', '132', '133', '134', '135', '136', '137', '138', '139', '150', '151', '152', '153', '155', '156', '157', '158', '159', '170', '176', '177', '178', '180', '181', '182', '183', '184', '185', '186', '187', '188', '189']
  const prefix = randomPick(prefixes)
  let phone = prefix
  for (let i = 0; i < 8; i++) {
    phone += Math.floor(Math.random() * 10)
  }
  return phone
}

// 生成随机年龄
function generateAge(education: string): string {
  let minAge = 16, maxAge = 35
  if (education.includes('初中')) {
    minAge = 14; maxAge = 18
  } else if (education.includes('高中') || education.includes('三校生')) {
    minAge = 16; maxAge = 22
  } else if (education.includes('大专') || education.includes('本科')) {
    minAge = 18; maxAge = 28
  } else if (education.includes('硕士')) {
    minAge = 22; maxAge = 30
  }
  return String(Math.floor(Math.random() * (maxAge - minAge + 1)) + minAge)
}

// 生成随机日期时间
function generateDateTime(startDate: dayjs.Dayjs, endDate: dayjs.Dayjs): dayjs.Dayjs {
  const start = startDate.valueOf()
  const end = endDate.valueOf()
  const randomTime = start + Math.random() * (end - start)
  const date = dayjs(randomTime)
  // 工作时间 8:30 - 20:30
  const hour = 8 + Math.floor(Math.random() * 12)
  const minute = Math.floor(Math.random() * 60)
  return date.hour(hour).minute(minute).second(0)
}

// 生成随机QQ号
function generateQQ(): string {
  // QQ号：5-11位数字
  const length = 5 + Math.floor(Math.random() * 7)
  let qq = String(Math.floor(Math.random() * 9) + 1) // 首位不为0
  for (let i = 1; i < length; i++) {
    qq += Math.floor(Math.random() * 10)
  }
  return qq
}

// 生成随机抖音/快手号
function generateSocialAccount(): string {
  const prefixes = ['dy_', 'ks_', 'user_', '']
  const prefix = randomPick(prefixes)
  const length = 6 + Math.floor(Math.random() * 6)
  let account = ''
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  for (let i = 0; i < length; i++) {
    account += chars[Math.floor(Math.random() * chars.length)]
  }
  return prefix + account
}

// 学校名称库
const SCHOOLS = [
  '太原理工大学', '山西大学', '中北大学', '太原科技大学', '山西财经大学',
  '山西医科大学', '太原师范学院', '山西农业大学', '长治学院', '运城学院',
  '忻州师范学院', '晋中学院', '吕梁学院', '太原学院', '山西工程技术学院',
  '太原市第一中学', '太原市第五中学', '山西省实验中学', '太原外国语学校',
  '太原市育英中学', '太原市成成中学', '太原市知达常青藤中学',
  '大同一中', '临汾一中', '运城中学', '长治一中', '晋城一中',
  '太原市职业技术学院', '山西职业技术学院', '山西机电职业技术学院',
]

// 县/区名称库
const COUNTIES: Record<string, string[]> = {
  '太原': ['小店区', '迎泽区', '杏花岭区', '尖草坪区', '万柏林区', '晋源区', '清徐县', '阳曲县', '娄烦县', '古交市'],
  '大同': ['平城区', '云冈区', '新荣区', '云州区', '阳高县', '天镇县', '广灵县', '灵丘县', '浑源县', '左云县'],
  '临汾': ['尧都区', '曲沃县', '翼城县', '襄汾县', '洪洞县', '古县', '安泽县', '浮山县', '吉县', '乡宁县', '霍州市', '侯马市'],
  '运城': ['盐湖区', '临猗县', '万荣县', '闻喜县', '稷山县', '新绛县', '绛县', '垣曲县', '夏县', '平陆县', '芮城县', '永济市', '河津市'],
  '长治': ['潞州区', '上党区', '屯留区', '潞城区', '襄垣县', '平顺县', '黎城县', '壶关县', '长子县', '武乡县', '沁县', '沁源县'],
  '晋中': ['榆次区', '太谷区', '榆社县', '左权县', '和顺县', '昔阳县', '寿阳县', '祁县', '平遥县', '灵石县', '介休市'],
  '忻州': ['忻府区', '定襄县', '五台县', '代县', '繁峙县', '宁武县', '静乐县', '神池县', '五寨县', '岢岚县', '河曲县', '保德县', '偏关县', '原平市'],
  '吕梁': ['离石区', '文水县', '交城县', '兴县', '临县', '柳林县', '石楼县', '岚县', '方山县', '中阳县', '交口县', '孝义市', '汾阳市'],
  '晋城': ['城区', '沁水县', '阳城县', '陵川县', '泽州县', '高平市'],
  '阳泉': ['城区', '矿区', '郊区', '平定县', '盂县'],
  '朔州': ['朔城区', '平鲁区', '山阴县', '应县', '右玉县', '怀仁市'],
}

// 咨询结果
const CONSULT_RESULTS = ['有意向', '考虑中', '无意向', '已预约上门', '需要再考虑', '价格问题', '距离太远', '家长反对', '等待通知', '暂无反馈']

// 目前状态选项（与状态选项API一致）
const CURRENT_STATUS_OPTIONS = ['应届', '在读', '在职', '待业']

// 备注模板
const REMARK_TEMPLATES = [
  '客户咨询了UI设计课程',
  '对Java开发感兴趣',
  '想了解学费分期政策',
  '朋友推荐过来的',
  '看了抖音广告来咨询',
  '想转行做IT',
  '之前有一定编程基础',
  '希望能尽快安排试听',
  '对就业保障比较关心',
  '想了解住宿情况',
  '咨询了多个神殿',
  '需要和家长商量',
  '',
]

// 生成单条咨询记录
function generateConsultationRecord(
  campus: string,
  dateTime: dayjs.Dayjs,
  consultantsConfig: Record<string, string[]>,
  onlineChatStaff: string[],
  sourceOverride?: string,
  consultantOverride?: string
): CreateConsultationRequest {
  // 基本信息
  const { name, gender } = generateName()
  const education = weightedRandom(EDUCATION_OPTIONS).value
  const status = weightedRandom(STATUS_OPTIONS).value
  
  // 来源信息 - 三级结构
  const sourceConfig = sourceOverride 
    ? SOURCE_CONFIG.find(s => s.name === sourceOverride) || weightedRandom(SOURCE_CONFIG)
    : weightedRandom(SOURCE_CONFIG)
  
  // 如果有媒体来源，随机选择一个
  let mediaSource = ''
  let mediaDetail = ''
  if (sourceConfig.mediaSources.length > 0) {
    const selectedSource = weightedRandom(sourceConfig.mediaSources)
    mediaSource = selectedSource.name
    // 如果有细分，随机选择
    if (selectedSource.details && selectedSource.details.length > 0) {
      mediaDetail = randomPick(selectedSource.details)
    }
  }
  
  // 最终的媒体来源字段 = 细分媒体 或 媒体来源
  const finalMediaSource = mediaDetail || mediaSource
  
  // 咨询师 - 使用动态配置或默认配置
  const consultants = consultantsConfig[campus] || DEFAULT_CONSULTANTS_CONFIG[campus] || ['默认老师']
  const consultant = consultantOverride || randomPick(consultants)
  
  // 地区和县
  const region = randomPick(REGIONS)
  const countyList = COUNTIES[region] || ['市区']
  const county = randomPick(countyList)
  
  // 转化概率
  const 是否上门 = Math.random() < 0.35 ? 1 : 0
  const 意向 = randomPick(INTENTIONS)
  const 是否报名 = 意向 === '已报名' ? 1 : (是否上门 === 1 && Math.random() < 0.4 ? 1 : 0)
  const 报名意向 = 是否报名 === 1 ? '已报名' : 意向
  const 是否无效量 = Math.random() < 0.08 ? 1 : 0
  const 是否不算量 = Math.random() < 0.05 ? 1 : 0
  const 是否订座 = 是否上门 === 1 && Math.random() < 0.3 ? 1 : 0
  const 是否校园量 = sourceConfig.name === '渠道' && Math.random() < 0.3 ? 1 : 0
  
  // 报名相关字段 - 仅在报名时才生成
  let 全款 = 0, 分期 = 0, 分期备注 = '', 注册 = 0, 贷款 = 0
  let 长期短期 = ''
  let 课程 = ''
  let 报名专业 = ''
  let 是否退费 = 0
  let 退费原因 = ''
  let 退费金额 = 0
  
  if (是否报名 === 1) {
    // 支付方式：全款、分期、贷款三选一，注册可以额外勾选
    const paymentType = Math.random()
    if (paymentType < 0.5) {
      全款 = 1
    } else if (paymentType < 0.8) {
      分期 = 1
      分期备注 = randomPick(['6期免息', '12期', '24期', '花呗分期', '白条分期'])
    } else {
      贷款 = 1
    }
    
    注册 = Math.random() < 0.2 ? 1 : 0
    长期短期 = randomPick(['长期', '短期', '两年制', '三年制'])
    课程 = randomPick(INTENTIONS.filter(i => i !== '待定' && i !== '已报名'))
    报名专业 = 课程
    
    // 退费 - 报名后有8%概率退费
    if (Math.random() < 0.08) {
      是否退费 = 1
      退费原因 = randomPick(['个人原因', '家庭原因', '工作原因', '经济原因', '不满意课程', '其他'])
      退费金额 = Math.floor(Math.random() * 10000) + 1000
    }
  }
  
  // 扩展信息 - 30%概率有QQ，40%概率有抖音/快手
  const hasQQ = Math.random() < 0.3
  const hasDouyin = Math.random() < 0.4
  const hasKuaishou = Math.random() < 0.3
  
  // 网聊专员/渠道专员 - 根据来源类型分配
  let 网聊专员 = undefined
  let 渠道专员 = undefined
  if (sourceConfig.name === '网络' || sourceConfig.name === '神殿新媒体') {
    // 从配置中心获取的网聊专员列表中随机选择
    if (onlineChatStaff.length > 0) {
      网聊专员 = randomPick(onlineChatStaff)
    } else {
      // 如果没有加载到，使用默认值
      网聊专员 = randomPick(['网聊专员A', '网聊专员B', '网聊专员C', '小王', '小李'])
    }
  }
  if (sourceConfig.name === '渠道') {
    渠道专员 = randomPick(['渠道专员A', '渠道专员B', '张经理', '李经理'])
  }
  
  // 代咨 - 20%概率有
  const hasProxy = Math.random() < 0.2
  const 代咨 = hasProxy ? randomPick(['代咨A', '代咨B', '王老师代咨', '']) : undefined
  
  // 咨询时间 - 可以和登记时间不同
  const 咨询时间 = dateTime.subtract(Math.floor(Math.random() * 60), 'minute').format('YYYY-MM-DD HH:mm:ss')
  
  // 咨询结果
  const 咨询结果 = randomPick(CONSULT_RESULTS)
  
  // 目前状态
  const 目前状态 = randomPick(CURRENT_STATUS_OPTIONS)
  
  // 就读学校 - 根据学历判断
  let 就读学校 = undefined
  if (education.includes('在读') || education.includes('应届') || Math.random() < 0.5) {
    就读学校 = randomPick(SCHOOLS)
  }
  
  // 备注
  const 备注 = randomPick(REMARK_TEMPLATES)
  
  return {
    登记日期: dateTime.format('YYYY-MM-DD HH:mm:ss'),
    咨询师: consultant,
    咨询者姓名: name,
    年龄: generateAge(education),
    性别: gender,
    电话: generatePhone(),
    QQ: hasQQ ? generateQQ() : undefined,
    抖音: hasDouyin ? generateSocialAccount() : undefined,
    快手: hasKuaishou ? generateSocialAccount() : undefined,
    学历: education,
    状态: status,
    位置: region,
    报名意向,
    咨询类别: randomPick(CONSULT_CATEGORIES),
    量来源: sourceConfig.name,
    媒体来源: finalMediaSource,
    关键字: randomPick(['计算机培训', 'IT培训', '编程培训', 'UI设计', 'Java培训', '软件开发', '']),
    备注,
    神殿: campus,
    // 标记字段
    是否无效量,
    无效原因: 是否无效量 === 1 ? randomPick(['空号', '无意向', '重复', '恶意']) : undefined,
    是否不算量,
    不算量原因: 是否不算量 === 1 ? randomPick(['测试数据', '内部人员', '其他']) : undefined,
    是否上门,
    上门时间: 是否上门 === 1 ? dateTime.add(Math.floor(Math.random() * 7) + 1, 'day').format('YYYY-MM-DD') : undefined,
    是否报名,
    报名时间: 是否报名 === 1 ? dateTime.add(Math.floor(Math.random() * 14) + 1, 'day').format('YYYY-MM-DD') : undefined,
    是否订座,
    是否校园量,
    // 网聊/渠道专员
    网聊专员,
    渠道专员,
    代咨,
    // 扩展信息
    地区: region,
    县: county,
    就读学校,
    目前状态,
    咨询时间,
    咨询结果,
    报名专业: 报名专业 || undefined,
    // 报名相关新字段
    全款,
    分期,
    分期备注: 分期备注 || undefined,
    注册,
    贷款,
    长期短期: 长期短期 || undefined,
    课程: 课程 || undefined,
    // 退费相关字段
    是否退费,
    退费原因: 退费原因 || undefined,
    退费金额: 退费金额 || undefined,
  }
}

// ==================== 组件 ====================

interface GeneratorProps {
  onClose?: () => void
}

const ConsultationGenerator: React.FC<GeneratorProps> = ({ onClose }) => {
  const { message } = App.useApp()
  const { currentCampus, getAllCampuses } = useCampusStore()
  const allCampuses = getAllCampuses()
  
  const [form] = Form.useForm()
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [generatedRecords, setGeneratedRecords] = useState<CreateConsultationRequest[]>([])
  const [previewData, setPreviewData] = useState<CreateConsultationRequest[]>([])
  
  // 动态咨询师配置
  const [consultantsConfig, setConsultantsConfig] = useState<Record<string, string[]>>(DEFAULT_CONSULTANTS_CONFIG)
  const [loadingConsultants, setLoadingConsultants] = useState(false)
  
  // 网聊专员列表（从配置中心获取）
  const [onlineChatStaff, setOnlineChatStaff] = useState<string[]>([])
  const [loadingChatStaff, setLoadingChatStaff] = useState(false)
  
  // 检查是否为开发环境
  const isDev = import.meta.env.DEV
  
  // 加载咨询师配置
  useEffect(() => {
    const loadConsultants = async () => {
      setLoadingConsultants(true)
      try {
        const config = await getConsultantsConfig()
        if (Object.keys(config).length > 0) {
          setConsultantsConfig(config)
          message.success('咨询师列表已从服务器加载')
        }
      } catch (error) {
        console.warn('加载咨询师列表失败，使用默认配置:', error)
        // 保持默认配置
      } finally {
        setLoadingConsultants(false)
      }
    }
    
    if (isDev) {
      loadConsultants()
    }
  }, [isDev])
  
  // 加载网聊专员列表（从配置中心获取职位为"网络客服"或"客服主管"的员工）
  useEffect(() => {
    const loadChatStaff = async () => {
      setLoadingChatStaff(true)
      try {
        // 获取所有员工
        const allUsers = await fetchUserPermissions()
        
        // 筛选职位为"网络客服"或"客服主管"的在职员工
        const chatStaff = allUsers
          .filter(user => 
            (user.position === '网络客服' || user.position === '客服主管') &&
            user.status === 'active'
          )
          .map(user => user.name)
        
        if (chatStaff.length > 0) {
          setOnlineChatStaff(chatStaff)
          console.log('[数据生成器] 加载到的网聊专员:', chatStaff)
          message.success(`已加载 ${chatStaff.length} 名网聊专员`)
        } else {
          console.warn('[数据生成器] 未找到网络客服或客服主管')
          message.warning('未找到网络客服或客服主管，将使用默认配置')
          // 使用默认配置
          setOnlineChatStaff(['网聊专员A', '网聊专员B', '网聊专员C', '小王', '小李'])
        }
      } catch (error) {
        console.error('加载网聊专员列表失败:', error)
        message.error('加载网聊专员列表失败，使用默认配置')
        // 使用默认配置
        setOnlineChatStaff(['网聊专员A', '网聊专员B', '网聊专员C', '小王', '小李'])
      } finally {
        setLoadingChatStaff(false)
      }
    }
    
    if (isDev) {
      loadChatStaff()
    }
  }, [isDev])
  
  if (!isDev) {
    return (
      <Alert
        message="仅开发模式可用"
        description="咨询量生成器仅在开发环境下可用，生产环境已禁用此功能。"
        type="error"
        showIcon
      />
    )
  }

  // 预览生成
  const handlePreview = () => {
    const values = form.getFieldsValue()
    const {
      campus,
      dateRange,
      count = 10,
      sourceType,
      consultant,
    } = values
    
    const [startDate, endDate] = dateRange || [dayjs().startOf('month'), dayjs()]
    const records: CreateConsultationRequest[] = []
    
    for (let i = 0; i < Math.min(count, 20); i++) {
      const dateTime = generateDateTime(startDate, endDate)
      const record = generateConsultationRecord(campus, dateTime, consultantsConfig, onlineChatStaff, sourceType, consultant)
      records.push(record)
    }
    
    setPreviewData(records)
  }

  // 批量生成
  const handleGenerate = async () => {
    const values = form.getFieldsValue()
    const {
      campus,
      dateRange,
      count = 10,
      sourceType,
      consultant,
    } = values
    
    if (!campus) {
      message.error('请选择神殿')
      return
    }
    
    const [startDate, endDate] = dateRange || [dayjs().startOf('month'), dayjs()]
    
    setGenerating(true)
    setProgress(0)
    setGeneratedRecords([])
    
    const records: CreateConsultationRequest[] = []
    const errors: string[] = []
    
    for (let i = 0; i < count; i++) {
      try {
        const dateTime = generateDateTime(startDate, endDate)
        const record = generateConsultationRecord(campus, dateTime, consultantsConfig, onlineChatStaff, sourceType, consultant)
        
        // 调用API创建记录
        await consultApi.createConsultationRecord(record)
        records.push(record)
        
        setProgress(Math.round(((i + 1) / count) * 100))
        
        // 稍微延迟，模拟真实场景
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (error: any) {
        errors.push(`第${i + 1}条: ${error.message || '未知错误'}`)
      }
    }
    
    setGenerating(false)
    setGeneratedRecords(records)
    
    if (errors.length > 0) {
      message.warning(`生成完成，${records.length}条成功，${errors.length}条失败`)
    } else {
      message.success(`成功生成 ${records.length} 条咨询记录`)
    }
  }

  // 预览表格列
  const previewColumns = [
    { title: '日期', dataIndex: '登记日期', key: '登记日期', width: 150, render: (v: string) => dayjs(v).format('MM-DD HH:mm') },
    { title: '姓名', dataIndex: '咨询者姓名', key: '咨询者姓名', width: 80 },
    { title: '电话', dataIndex: '电话', key: '电话', width: 120 },
    { title: '学历', dataIndex: '学历', key: '学历', width: 80 },
    { title: '量来源', dataIndex: '量来源', key: '量来源', width: 80 },
    { title: '媒体来源', dataIndex: '媒体来源', key: '媒体来源', width: 100 },
    { title: '咨询师', dataIndex: '咨询师', key: '咨询师', width: 80 },
    { 
      title: '上门', dataIndex: '是否上门', key: '是否上门', width: 60,
      render: (v: number) => v === 1 ? <Tag color="green">是</Tag> : <Tag>否</Tag>
    },
    { 
      title: '报名', dataIndex: '是否报名', key: '是否报名', width: 60,
      render: (v: number) => v === 1 ? <Tag color="red">是</Tag> : <Tag>否</Tag>
    },
  ]

  return (
    <Spin spinning={loadingConsultants || loadingChatStaff} tip={loadingConsultants ? "加载咨询师列表..." : "加载网聊专员列表..."}>
    <Card 
      title={
        <Space>
          <ExperimentOutlined style={{ color: '#ff4d4f' }} />
          <span>咨询量模拟生成器</span>
          <Tag color="red">DEV</Tag>
        </Space>
      }
      extra={onClose && <Button onClick={onClose}>关闭</Button>}
    >
      <Alert
        message="开发模式专用"
        description="此工具仅用于开发测试，生成的数据将写入真实数据库。请谨慎使用！"
        type="warning"
        showIcon
        style={{ marginBottom: 16 }}
      />
      
      {onlineChatStaff.length > 0 && (
        <Alert
          message="网聊专员配置"
          description={
            <div>
              <p style={{ marginBottom: 4 }}>已从配置中心加载 {onlineChatStaff.length} 名网聊专员（职位：网络客服/客服主管）：</p>
              <div>
                {onlineChatStaff.map((staff, index) => (
                  <Tag key={index} color="blue" style={{ marginBottom: 4 }}>{staff}</Tag>
                ))}
              </div>
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}
      
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          campus: currentCampus || allCampuses[0]?.name,
          dateRange: [dayjs().startOf('month'), dayjs()],
          count: 10,
        }}
      >
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item name="campus" label="神殿" rules={[{ required: true }]}>
              <Select placeholder="选择神殿">
                {allCampuses.map(c => (
                  <Option key={c.name} value={c.name}>{c.name}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="dateRange" label="日期范围">
              <RangePicker format="YYYY-MM-DD" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={4}>
            <Form.Item name="count" label="生成数量">
              <InputNumber min={1} max={500} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="sourceType" label="指定来源(可选)">
              <Select placeholder="随机" allowClear>
                {SOURCE_CONFIG.map(s => (
                  <Option key={s.name} value={s.name}>{s.name}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>
        
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item noStyle shouldUpdate={(prev, cur) => prev.campus !== cur.campus}>
              {({ getFieldValue }) => {
                const campus = getFieldValue('campus')
                const consultants = consultantsConfig[campus] || DEFAULT_CONSULTANTS_CONFIG[campus] || []
                return (
                  <Form.Item name="consultant" label="指定咨询师(可选)">
                    <Select placeholder="随机" allowClear>
                      {consultants.map(c => (
                        <Option key={c} value={c}>{c}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                )
              }}
            </Form.Item>
          </Col>
        </Row>

        <Space>
          <Button 
            icon={<ExperimentOutlined />} 
            onClick={handlePreview}
          >
            预览数据
          </Button>
          <Button 
            type="primary" 
            icon={<ThunderboltOutlined />} 
            onClick={handleGenerate}
            loading={generating}
            danger
          >
            开始生成
          </Button>
        </Space>
      </Form>

      {generating && (
        <div style={{ marginTop: 16 }}>
          <Progress percent={progress} status="active" />
          <Text type="secondary">正在生成中，请勿关闭页面...</Text>
        </div>
      )}

      {generatedRecords.length > 0 && (
        <Alert
          message={`生成完成`}
          description={`成功生成 ${generatedRecords.length} 条咨询记录`}
          type="success"
          showIcon
          style={{ marginTop: 16 }}
        />
      )}

      {previewData.length > 0 && (
        <Collapse 
          style={{ marginTop: 16 }}
          defaultActiveKey={['preview']}
          items={[{
            key: 'preview',
            label: `预览数据 (${previewData.length}条)`,
            children: (
              <Table
                columns={previewColumns}
                dataSource={previewData.map((r, i) => ({ ...r, key: i }))}
                size="small"
                scroll={{ x: 900 }}
                pagination={false}
              />
            )
          }]}
        />
      )}

      <Divider />
      
      <Collapse
        items={[{
          key: 'config',
          label: '数据生成规则说明',
          children: (
            <div style={{ fontSize: 12 }}>
              <Title level={5}>来源分布</Title>
              <ul>
                {SOURCE_CONFIG.map(s => (
                  <li key={s.name}>
                    <Text strong>{s.name}</Text> ({s.weight}%): 
                    {s.mediaSources.map(m => `${m.name}(${m.weight}%)`).join(', ')}
                  </li>
                ))}
              </ul>
              
              <Title level={5}>转化率设置</Title>
              <ul>
                <li>上门率: 约 35%</li>
                <li>报名率(上门中): 约 40%</li>
                <li>无效量: 约 8%</li>
                <li>不算量: 约 5%</li>
              </ul>
              
              <Title level={5}>人群分布</Title>
              <ul>
                <li>大学生: 约 35%</li>
                <li>高中/三校生: 约 40%</li>
                <li>初中生: 约 25%</li>
              </ul>
            </div>
          )
        }]}
      />
    </Card>
    </Spin>  )
}

export default ConsultationGenerator