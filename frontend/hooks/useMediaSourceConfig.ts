/**
 * 媒体来源配置Hook
 * 从配置中心动态获取媒体来源配置，供统计页面使用
 * 
 * 配置层级结构：
 * - 量来源（一级）：网络、口碑、渠道、神殿新媒体、合作伙伴、其他
 * - 媒体来源（二级）：新媒体平台、常规SEM平台、合作伙伴平台等
 * - 细分媒体（三级）：抖音、快手、百度推广等
 * 
 * 所有列表和TAB都按配置中心的sort_order排序
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { 
  getConfigTree, 
  getFullConfigTree,
  type MediaCategoryItem,
  type MediaSourceItem,
  type MediaDetailItem,
} from '@/pages/consult/type-count-system/statsApi'

// 配置树类型定义（简单格式）
export interface MediaConfigTree {
  [category: string]: {  // 量来源
    [source: string]: string[]  // 媒体来源 -> 细分媒体列表
  }
}

// 完整配置树类型定义（包含排序）
export interface FullMediaConfigTree {
  categories: MediaCategoryItem[]
}

// 分类规则接口
export interface SourceClassification {
  // 判断是否为SEM来源
  isSEM: (媒体来源: string | null | undefined, 细分媒体?: string | null) => boolean
  // 判断是否为新媒体平台
  isNewMedia: (媒体来源: string | null | undefined, 细分媒体?: string | null) => boolean
  // 判断是否为合作伙伴
  isPartner: (媒体来源: string | null | undefined) => boolean
  // 判断是否为免费推广
  isFreePromotion: (媒体来源: string | null | undefined) => boolean
  // 判断是否为口碑
  isReputation: (量来源: string | null | undefined) => boolean
  // 判断是否为渠道
  isChannel: (量来源: string | null | undefined) => boolean
  // 判断是否为神殿新媒体
  isCampusNewMedia: (量来源: string | null | undefined) => boolean
  // 获取子来源类型
  getSubSourceType: (量来源: string | null | undefined, 媒体来源: string | null | undefined, 细分媒体?: string | null) => string
}

// 重新导出类型供外部使用
export type { MediaCategoryItem, MediaSourceItem, MediaDetailItem }

// 默认配置 - 作为API加载失败时的备用
// TAB顺序参考Excel：网络、新媒体、市场口碑、合作伙伴、渠道、口碑、神殿新媒体
const DEFAULT_CONFIG: MediaConfigTree = {
  '网络': {
    '常规SEM平台': ['百度推广', '中心来电', '在线报名/网站留言', '百度表单', '在线报名', '网站留言', '直接访问'],
    '合作伙伴平台': ['百教网', '91搜客', '知了好学', '坦途网', '厚学网'],
    '免费推广': ['社交化媒体', '问答', '分类信息', '地图', '视频']
  },
  '新媒体': {
    '新媒体平台': ['抖音', '快手', '微信视频号', '小红书', 'B站', '抖音私信']
  },
  '市场口碑': {},
  '合作伙伴': {},
  '渠道': {},
  '口碑': {
    '咨询口碑': [],
    '教质口碑': [],
    '教学口碑': [],
    '校园口碑': [],
    '总部口碑': [],
    '其他口碑': []
  },
  '神殿新媒体': {}
}

// 默认完整配置树
// TAB顺序参考Excel：网络、新媒体、市场口碑、合作伙伴、渠道、口碑、神殿新媒体
const DEFAULT_FULL_CONFIG: FullMediaConfigTree = {
  categories: [
    { name: '网络', sort_order: 0, sources: [
      { name: '常规SEM平台', sort_order: 0, details: [
        { name: '百度推广', sort_order: 0 },
        { name: '中心来电', sort_order: 1 },
        { name: '在线报名', sort_order: 2 },
        { name: '网站留言', sort_order: 3 },
        { name: '直接访问', sort_order: 4 },
        { name: '百度表单', sort_order: 5 },
      ]},
      { name: '合作伙伴平台', sort_order: 1, details: [
        { name: '百教网', sort_order: 0 },
        { name: '91搜客', sort_order: 1 },
        { name: '知了好学', sort_order: 2 },
        { name: '坦途网', sort_order: 3 },
        { name: '厚学网', sort_order: 4 },
      ]},
      { name: '免费推广', sort_order: 2, details: [
        { name: '社交化媒体', sort_order: 0 },
        { name: '问答', sort_order: 1 },
        { name: '分类信息', sort_order: 2 },
        { name: '地图', sort_order: 3 },
        { name: '视频', sort_order: 4 },
      ]},
    ]},
    { name: '新媒体', sort_order: 1, sources: [
      { name: '新媒体平台', sort_order: 0, details: [
        { name: '抖音', sort_order: 0 },
        { name: '快手', sort_order: 1 },
        { name: '微信视频号', sort_order: 2 },
        { name: '小红书', sort_order: 3 },
        { name: 'B站', sort_order: 4 },
        { name: '抖音私信', sort_order: 5 },
      ]},
    ]},
    { name: '市场口碑', sort_order: 2, sources: [] },
    { name: '合作伙伴', sort_order: 3, sources: [] },
    { name: '渠道', sort_order: 4, sources: [] },
    { name: '口碑', sort_order: 5, sources: [
      { name: '咨询口碑', sort_order: 0, details: [] },
      { name: '教质口碑', sort_order: 1, details: [] },
      { name: '教学口碑', sort_order: 2, details: [] },
      { name: '校园口碑', sort_order: 3, details: [] },
      { name: '总部口碑', sort_order: 4, details: [] },
      { name: '其他口碑', sort_order: 5, details: [] },
    ]},
    { name: '神殿新媒体', sort_order: 6, sources: [] },
  ]
}

// Hook返回类型
export interface UseMediaSourceConfigReturn {
  // 配置数据
  configTree: MediaConfigTree
  fullConfigTree: FullMediaConfigTree
  // 加载状态
  loading: boolean
  // 错误信息
  error: string | null
  // 重新加载
  reload: () => Promise<void>
  
  // 动态生成的列表（按sort_order排序）
  量来源列表: string[]
  媒体来源列表: string[]
  细分媒体列表: string[]
  
  // 网络子分类列表
  SEM平台列表: string[]
  新媒体平台列表: string[]
  合作伙伴平台列表: string[]
  免费推广列表: string[]
  
  // 口碑类型列表
  口碑类型列表: string[]
  
  // 重要来源列表（用于统计表动态显示）
  重要媒体来源列表: MediaSourceItem[]
  重要细分媒体列表: MediaDetailItem[]
  
  // 分类判断函数
  classification: SourceClassification
  
  // 根据量来源获取其下的媒体来源列表（按排序）
  getMediaSourcesByCategory: (category: string) => MediaSourceItem[]
  // 根据媒体来源获取其下的细分媒体列表（按排序）
  getDetailsByMediaSource: (category: string, mediaSource: string) => MediaDetailItem[]
  // 获取量来源配置项
  getCategoryConfig: (category: string) => MediaCategoryItem | undefined
  // 判断记录属于哪个量来源下的哪个媒体来源
  matchMediaSource: (量来源: string, 媒体来源: string) => MediaSourceItem | undefined
  // 判断是否为重要来源
  isImportantSource: (媒体来源: string) => boolean
  isImportantDetail: (细分媒体: string) => boolean
}

/**
 * 媒体来源配置Hook
 * 提供动态配置数据和分类判断函数
 * 所有列表都按配置中心的sort_order排序
 */
export function useMediaSourceConfig(): UseMediaSourceConfigReturn {
  const [configTree, setConfigTree] = useState<MediaConfigTree>(DEFAULT_CONFIG)
  const [fullConfigTree, setFullConfigTree] = useState<FullMediaConfigTree>(DEFAULT_FULL_CONFIG)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 加载配置
  const loadConfig = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // 并行加载两种格式的配置
      const [simpleResponse, fullResponse] = await Promise.all([
        getConfigTree(),
        getFullConfigTree()
      ])
      
      if (simpleResponse.success && simpleResponse.data && Object.keys(simpleResponse.data).length > 0) {
        setConfigTree(simpleResponse.data)
      } else {
        console.warn('简单配置加载失败或为空，使用默认配置')
        setConfigTree(DEFAULT_CONFIG)
      }
      
      // 检查完整配置是否有效（categories不为空）
      if (fullResponse.success && fullResponse.data && 
          fullResponse.data.categories && fullResponse.data.categories.length > 0) {
        // 合并API数据和默认配置，确保必要的TAB分类一定存在
        const apiCategories = fullResponse.data.categories
        const requiredCategories = ['网络', '新媒体', '市场口碑', '合作伙伴', '渠道', '口碑', '神殿新媒体']
        
        // 创建合并后的分类列表
        const mergedCategories = [...apiCategories]
        
        // 确保必要的分类都存在
        requiredCategories.forEach((name, idx) => {
          const exists = mergedCategories.some(c => c.name === name)
          if (!exists) {
            // 从默认配置中查找
            const defaultCategory = DEFAULT_FULL_CONFIG.categories.find(c => c.name === name)
            if (defaultCategory) {
              mergedCategories.push({ ...defaultCategory, sort_order: idx })
            } else {
              // 创建空分类
              mergedCategories.push({ name, sort_order: idx, sources: [] })
            }
          }
        })
        
        // 按sort_order排序（必要分类按预定义顺序）
        mergedCategories.sort((a, b) => {
          const aIdx = requiredCategories.indexOf(a.name)
          const bIdx = requiredCategories.indexOf(b.name)
          if (aIdx >= 0 && bIdx >= 0) return aIdx - bIdx
          if (aIdx >= 0) return -1
          if (bIdx >= 0) return 1
          return a.sort_order - b.sort_order
        })
        
        setFullConfigTree({ categories: mergedCategories })
      } else {
        console.warn('完整配置加载失败或为空，使用默认配置')
        setFullConfigTree(DEFAULT_FULL_CONFIG)
      }
    } catch (err) {
      console.error('加载媒体来源配置失败:', err)
      setError('加载配置失败')
      // 使用默认配置
      setConfigTree(DEFAULT_CONFIG)
      setFullConfigTree(DEFAULT_FULL_CONFIG)
    } finally {
      setLoading(false)
    }
  }, [])

  // 初始加载
  useEffect(() => {
    loadConfig()
  }, [loadConfig])

  // 提取量来源列表（按sort_order排序）
  const 量来源列表 = useMemo(() => 
    fullConfigTree.categories.map(c => c.name), 
    [fullConfigTree]
  )

  // 提取所有媒体来源（二级，按sort_order排序）
  const 媒体来源列表 = useMemo(() => {
    const sources: string[] = []
    fullConfigTree.categories.forEach(category => {
      category.sources.forEach(source => {
        if (!sources.includes(source.name)) {
          sources.push(source.name)
        }
      })
    })
    return sources
  }, [fullConfigTree])

  // 提取所有细分媒体（三级，按sort_order排序）
  const 细分媒体列表 = useMemo(() => {
    const details: string[] = []
    fullConfigTree.categories.forEach(category => {
      category.sources.forEach(source => {
        source.details.forEach(detail => {
          if (!details.includes(detail.name)) {
            details.push(detail.name)
          }
        })
      })
    })
    return details
  }, [fullConfigTree])

  // 网络下的子分类
  const 网络配置 = useMemo(() => configTree['网络'] || {}, [configTree])
  
  const SEM平台列表 = useMemo(() => {
    const semConfig = 网络配置['常规SEM平台'] || 网络配置['SEM平台'] || 网络配置['常规SEM'] || []
    // 包含媒体来源名称和其下的细分媒体
    const result = ['常规SEM平台', 'SEM平台', '常规SEM']
    result.push(...semConfig)
    return result.filter((v, i, arr) => arr.indexOf(v) === i)
  }, [网络配置])

  const 新媒体平台列表 = useMemo(() => {
    const newMediaConfig = 网络配置['新媒体平台'] || 网络配置['新媒体'] || []
    const result = ['新媒体平台', '新媒体']
    result.push(...newMediaConfig)
    return result.filter((v, i, arr) => arr.indexOf(v) === i)
  }, [网络配置])

  const 合作伙伴平台列表 = useMemo(() => {
    const partnerConfig = 网络配置['合作伙伴平台'] || 网络配置['合作伙伴'] || 网络配置['网络合作伙伴'] || []
    const result = ['合作伙伴平台', '合作伙伴', '网络合作伙伴']
    result.push(...partnerConfig)
    return result.filter((v, i, arr) => arr.indexOf(v) === i)
  }, [网络配置])

  const 免费推广列表 = useMemo(() => {
    const freeConfig = 网络配置['免费推广'] || 网络配置['免费网络'] || []
    const result = ['免费推广', '免费网络']
    result.push(...freeConfig)
    return result.filter((v, i, arr) => arr.indexOf(v) === i)
  }, [网络配置])

  // 口碑类型列表
  const 口碑类型列表 = useMemo(() => {
    const reputationConfig = configTree['口碑'] || {}
    return Object.keys(reputationConfig)
  }, [configTree])

  // 分类判断函数
  const classification: SourceClassification = useMemo(() => ({
    isSEM: (媒体来源, 细分媒体) => {
      if (!媒体来源) return false
      // 检查媒体来源是否为SEM相关
      if (SEM平台列表.includes(媒体来源)) return true
      // 检查细分媒体
      if (细分媒体 && SEM平台列表.includes(细分媒体)) return true
      return false
    },
    
    isNewMedia: (媒体来源, 细分媒体) => {
      if (!媒体来源) return false
      // 检查媒体来源是否为新媒体相关
      if (新媒体平台列表.includes(媒体来源)) return true
      // 检查细分媒体
      if (细分媒体 && 新媒体平台列表.includes(细分媒体)) return true
      return false
    },
    
    isPartner: (媒体来源) => {
      if (!媒体来源) return false
      return 合作伙伴平台列表.includes(媒体来源)
    },
    
    isFreePromotion: (媒体来源) => {
      if (!媒体来源) return false
      return 免费推广列表.includes(媒体来源)
    },
    
    isReputation: (量来源) => 量来源 === '口碑',
    
    isChannel: (量来源) => 量来源 === '渠道',
    
    isCampusNewMedia: (量来源) => 量来源 === '神殿新媒体',
    
    // 获取子来源类型
    getSubSourceType: (量来源, 媒体来源, 细分媒体) => {
      if (量来源 === '网络') {
        if (classification.isNewMedia(媒体来源, 细分媒体)) return '新媒体'
        if (classification.isSEM(媒体来源, 细分媒体)) return 'SEM'
        if (classification.isPartner(媒体来源)) return '合作伙伴'
        if (classification.isFreePromotion(媒体来源)) return '免费推广'
        return 'SEM' // 网络默认归为SEM
      }
      if (量来源 === '口碑') return '口碑'
      if (量来源 === '渠道') return '渠道'
      if (量来源 === '神殿新媒体') return '神殿新媒体'
      if (量来源 === '合作伙伴') return '合作伙伴'
      return '其他'
    }
  }), [SEM平台列表, 新媒体平台列表, 合作伙伴平台列表, 免费推广列表])

  // 根据量来源获取媒体来源列表（按排序返回完整信息）
  const getMediaSourcesByCategory = useCallback((category: string): MediaSourceItem[] => {
    const cat = fullConfigTree.categories.find(c => c.name === category)
    return cat?.sources || []
  }, [fullConfigTree])

  // 根据媒体来源获取细分媒体列表（按排序返回完整信息）
  const getDetailsByMediaSource = useCallback((category: string, mediaSource: string): MediaDetailItem[] => {
    const cat = fullConfigTree.categories.find(c => c.name === category)
    const src = cat?.sources.find(s => s.name === mediaSource)
    return src?.details || []
  }, [fullConfigTree])

  // 获取量来源配置项
  const getCategoryConfig = useCallback((category: string): MediaCategoryItem | undefined => {
    return fullConfigTree.categories.find(c => c.name === category)
  }, [fullConfigTree])

  // 判断记录属于哪个量来源下的哪个媒体来源
  const matchMediaSource = useCallback((量来源: string, 媒体来源: string): MediaSourceItem | undefined => {
    const cat = fullConfigTree.categories.find(c => c.name === 量来源)
    return cat?.sources.find(s => s.name === 媒体来源)
  }, [fullConfigTree])

  // 获取重要媒体来源列表
  const 重要媒体来源列表 = useMemo((): MediaSourceItem[] => {
    const importantSources: MediaSourceItem[] = []
    fullConfigTree.categories.forEach(category => {
      category.sources.forEach(source => {
        if (source.is_important) {
          importantSources.push(source)
        }
      })
    })
    return importantSources
  }, [fullConfigTree])

  // 获取重要细分媒体列表
  const 重要细分媒体列表 = useMemo((): MediaDetailItem[] => {
    const importantDetails: MediaDetailItem[] = []
    fullConfigTree.categories.forEach(category => {
      category.sources.forEach(source => {
        source.details.forEach(detail => {
          if (detail.is_important) {
            importantDetails.push(detail)
          }
        })
      })
    })
    return importantDetails
  }, [fullConfigTree])

  // 判断是否为重要媒体来源
  const isImportantSource = useCallback((媒体来源: string): boolean => {
    return 重要媒体来源列表.some(s => s.name === 媒体来源)
  }, [重要媒体来源列表])

  // 判断是否为重要细分媒体
  const isImportantDetail = useCallback((细分媒体: string): boolean => {
    return 重要细分媒体列表.some(d => d.name === 细分媒体)
  }, [重要细分媒体列表])

  return {
    configTree,
    fullConfigTree,
    loading,
    error,
    reload: loadConfig,
    量来源列表,
    媒体来源列表,
    细分媒体列表,
    SEM平台列表,
    新媒体平台列表,
    合作伙伴平台列表,
    免费推广列表,
    口碑类型列表,
    重要媒体来源列表,
    重要细分媒体列表,
    classification,
    getMediaSourcesByCategory,
    getDetailsByMediaSource,
    getCategoryConfig,
    matchMediaSource,
    isImportantSource,
    isImportantDetail,
  }
}

export default useMediaSourceConfig
