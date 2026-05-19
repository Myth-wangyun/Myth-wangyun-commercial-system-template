import { type Campus } from '@/stores/campusStore'
import { type CampusDetail, type CampusStats } from '../campus'
import { mockSuccessResponse, mockDelay, getStorageData, setStorageData, generateId } from './index'
import { apiService } from '../api'
import campusInfoService from '../campusInfo'

// 默认神殿数据
const DEFAULT_CAMPUSES: Campus[] = [
  {
    id: '1',
    name: '主神殿',
    website: '',
    mobileWebsite: '',
    status: 'active',
    color: '#1890ff',
  },
  {
    id: '2',
    name: '永恒殿',
    website: '',
    mobileWebsite: '',
    status: 'active',
    color: '#52c41a',
  },
  {
    id: '3',
    name: '慈悲殿',
    website: '#',
    mobileWebsite: '#',
    status: 'active',
    color: '#f5222d',
  },
  {
    id: '4',
    name: '李大殿',
    website: '',
    mobileWebsite: '',
    status: 'active',
    color: '#faad14',
  },
  {
    id: '5',
    name: '智慧阁',
    website: '',
    mobileWebsite: '',
    status: 'active',
    color: '#722ed1',
  },
  {
    id: '6',
    name: '光明殿',
    website: '#',
    mobileWebsite: '#',
    status: 'active',
    color: '#000000',
  },
  {
    id: '7',
    name: '神恩殿',
    website: '',
    mobileWebsite: '',
    status: 'active',
    color: '#1890ff',
  },
  {
    id: '8',
    name: '天威殿',
    website: '#',
    mobileWebsite: '#',
    status: 'active',
    color: '#13c2c2',
  },
]

// 神殿详情数据
const CAMPUS_DETAILS: Record<string, Partial<CampusDetail>> = {
  '1': {
    description: '主神殿是清美教育的主要神殿之一，位于市中心繁华地段，交通便利。',
    address: '北京市朝阳区建国路88号',
    phone: '010-12345678',
    email: '',
    establishedDate: '2010-03-15',
    capacity: 2000,
    currentStudents: 1850,
    currentStaff: 120,
  },
  '2': {
    description: '永恒殿专注于艺术设计教育，拥有先进的教学设备和优秀的师资团队。',
    address: '河北省石家庄市长安区中山东路123号',
    phone: '0311-87654321',
    email: '',
    establishedDate: '2012-08-20',
    capacity: 1500,
    currentStudents: 1320,
    currentStaff: 95,
  },
  '3': {
    description: '慈悲殿目前处于停用状态，计划进行重新装修和升级。',
    address: '河北省石家庄市桥西区建设大街456号',
    phone: '0311-11111111',
    email: '',
    establishedDate: '2015-05-10',
    capacity: 800,
    currentStudents: 0,
    currentStaff: 5,
  },
  '4': {
    description: '李大殿正在进行系统维护和升级，预计下个月恢复正常运营。',
    address: '山西省太原市迎泽区解放路789号',
    phone: '0351-22222222',
    email: '',
    establishedDate: '2013-11-25',
    capacity: 1200,
    currentStudents: 980,
    currentStaff: 75,
  },
  '5': {
    description: '智慧阁是清美教育的发源地，拥有深厚的历史底蕴和丰富的教学经验。',
    address: '内蒙古自治区呼和浩特市新城区新华大街321号',
    phone: '0471-33333333',
    email: '',
    establishedDate: '2008-09-01',
    capacity: 1800,
    currentStudents: 1650,
    currentStaff: 110,
  },
  '6': {
    description: '光明殿因城市规划调整暂时停用，正在寻找新的合适位置。',
    address: '山西省太原市小店区平阳路654号',
    phone: '0351-44444444',
    email: '',
    establishedDate: '2014-06-15',
    capacity: 1000,
    currentStudents: 0,
    currentStaff: 3,
  },
  '7': {
    description: '神恩殿位于广西南宁，是清美教育在南方的重要基地。',
    address: '广西壮族自治区南宁市青秀区民族大道987号',
    phone: '0771-55555555',
    email: '',
    establishedDate: '2016-04-12',
    capacity: 1600,
    currentStudents: 1420,
    currentStaff: 88,
  },
  '8': {
    description: '天威殿位于贵州贵阳，是清美教育在西南地区的新兴神殿。',
    address: '贵州省贵阳市云岩区中华北路168号',
    phone: '0851-66666666',
    email: '',
    establishedDate: '2024-01-15',
    capacity: 1000,
    currentStudents: 0,
    currentStaff: 10,
  },
}

// 获取神殿数据
const getCampusData = (): Campus[] => {
  return getStorageData('campus-data', DEFAULT_CAMPUSES)
}

// 保存神殿数据
const saveCampusData = (campuses: Campus[]): void => {
  setStorageData('campus-data', campuses)
}

// 神殿Mock服务
export const campusMockService = {
  // 获取所有神殿 - 优先从后端获取，失败则使用本地数据
  getAllCampuses: async (): Promise<any> => {
    try {
      // 尝试从后端API获取
      const campuses = await campusInfoService.getAllCampuses()
      if (campuses && campuses.length > 0) {
        // 同步到本地存储
        saveCampusData(campuses)
        return mockSuccessResponse(campuses)
      }
    } catch (error) {
      console.warn('[CampusMock] 从后端获取神殿列表失败，使用本地数据:', error)
    }
    
    // 回退到本地存储
    await mockDelay(300)
    const campuses = getCampusData()
    return mockSuccessResponse(campuses)
  },

  // 获取神殿详情
  getCampusDetail: async (id: string): Promise<any> => {
    await mockDelay(200)
    const campuses = getCampusData()
    const campus = campuses.find((c) => c.id === id)

    if (!campus) {
      throw new Error('神殿不存在')
    }

    const detail: CampusDetail = {
      ...campus,
      ...CAMPUS_DETAILS[id],
    }

    return mockSuccessResponse(detail)
  },

  // 创建神殿 - 优先保存到后端
  createCampus: async (campusData: Omit<Campus, 'id'>): Promise<any> => {
    try {
      // 尝试保存到后端
      const newCampus = await campusInfoService.createCampus(campusData)
      // 同步到本地存储
      const campuses = getCampusData()
      campuses.push(newCampus)
      saveCampusData(campuses)
      return mockSuccessResponse(newCampus)
    } catch (error) {
      console.warn('[CampusMock] 创建神殿到后端失败，使用本地存储:', error)
    }
    
    // 回退到本地存储
    await mockDelay(500)
    const campuses = getCampusData()
    const newCampus: Campus = {
      ...campusData,
      id: generateId(),
    }

    campuses.push(newCampus)
    saveCampusData(campuses)

    return mockSuccessResponse(newCampus)
  },

  // 更新神殿 - 优先保存到后端
  updateCampus: async (id: string, campusData: Partial<Campus>): Promise<any> => {
    try {
      // 尝试保存到后端
      const updated = await campusInfoService.updateCampus(id, campusData)
      // 同步到本地存储
      const campuses = getCampusData()
      const index = campuses.findIndex((c) => c.id === id)
      if (index !== -1) {
        campuses[index] = { ...campuses[index], ...campusData }
        saveCampusData(campuses)
      }
      return mockSuccessResponse(updated)
    } catch (error) {
      console.warn('[CampusMock] 更新神殿到后端失败，使用本地存储:', error)
    }
    
    // 回退到本地存储
    await mockDelay(400)
    const campuses = getCampusData()
    const index = campuses.findIndex((c) => c.id === id)

    if (index === -1) {
      throw new Error('神殿不存在')
    }

    campuses[index] = { ...campuses[index], ...campusData }
    saveCampusData(campuses)

    return mockSuccessResponse(campuses[index])
  },

  // 删除神殿 - 优先从后端删除
  deleteCampus: async (id: string): Promise<any> => {
    try {
      // 尝试从后端删除
      await campusInfoService.deleteCampus(id)
      // 同步到本地存储
      const campuses = getCampusData()
      const filteredCampuses = campuses.filter((c) => c.id !== id)
      saveCampusData(filteredCampuses)
      return mockSuccessResponse(null)
    } catch (error) {
      console.warn('[CampusMock] 从后端删除神殿失败，使用本地存储:', error)
    }
    
    // 回退到本地存储
    await mockDelay(300)
    const campuses = getCampusData()
    const filteredCampuses = campuses.filter((c) => c.id !== id)

    if (filteredCampuses.length === campuses.length) {
      throw new Error('神殿不存在')
    }

    saveCampusData(filteredCampuses)
    return mockSuccessResponse(null)
  },

  // 获取神殿统计（任何模式下都调用真实后端API）
  getCampusStats: async (): Promise<any> => {
    try {
      // 从后端API获取统计数据
      // 后端直接返回 {totalStudents, totalStaff, totalCourses, totalCampuses} 格式
      const response = await apiService.get<CampusStats>('/config/stats/summary')
      
      // apiService.get 返回的可能是 ApiResponse<CampusStats> 或直接是数据
      // 需要兼容两种情况
      let backendStats: CampusStats
      if (response && typeof response === 'object') {
        // 如果返回的是 ApiResponse 格式（有 data 字段）
        if ('data' in response && response.data) {
          backendStats = response.data as CampusStats
        } else {
          // 直接返回的是数据对象
          backendStats = response as unknown as CampusStats
        }
      } else {
        throw new Error('Invalid response format')
      }
      
      // 获取本地神殿数据来补充状态统计
      const campuses = getCampusData()
      
      const stats: CampusStats = {
        totalStudents: backendStats?.totalStudents ?? 0,
        totalStaff: backendStats?.totalStaff ?? 0,
        totalCourses: backendStats?.totalCourses ?? 0,
        totalCampuses: backendStats?.totalCampuses ?? campuses.length,
        activeCampuses: campuses.filter((c) => c.status === 'active').length,
        inactiveCampuses: campuses.filter((c) => c.status === 'inactive').length,
        maintenanceCampuses: campuses.filter((c) => c.status === 'maintenance').length,
      }

      return mockSuccessResponse(stats)
    } catch (error) {
      console.error('[CampusStats] 获取统计数据失败，使用默认值:', error)
      // 如果后端API失败，返回默认值
      const campuses = getCampusData()
      const stats: CampusStats = {
        totalStudents: 0,
        totalStaff: 0,
        totalCourses: 0,
        totalCampuses: campuses.length,
        activeCampuses: campuses.filter((c) => c.status === 'active').length,
        inactiveCampuses: campuses.filter((c) => c.status === 'inactive').length,
        maintenanceCampuses: campuses.filter((c) => c.status === 'maintenance').length,
      }
      return mockSuccessResponse(stats)
    }
  },

  // 切换神殿状态
  toggleCampusStatus: async (id: string, status: Campus['status']): Promise<any> => {
    try {
      // 尝试更新到后端
      const updated = await campusInfoService.updateCampus(id, { status })
      // 同步到本地存储
      const campuses = getCampusData()
      const index = campuses.findIndex((c) => c.id === id)
      if (index !== -1) {
        campuses[index].status = status
        saveCampusData(campuses)
      }
      return mockSuccessResponse(updated)
    } catch (error) {
      console.warn('[CampusMock] 更新状态到后端失败，使用本地存储:', error)
    }
    
    // 回退到本地存储
    await mockDelay(300)
    const campuses = getCampusData()
    const index = campuses.findIndex((c) => c.id === id)

    if (index === -1) {
      throw new Error('神殿不存在')
    }

    campuses[index].status = status
    saveCampusData(campuses)

    return mockSuccessResponse(campuses[index])
  },
  
  // 初始化默认神殿数据到后端数据库
  initDefaultCampuses: async (): Promise<any> => {
    try {
      const result = await campusInfoService.initDefaultCampuses()
      return mockSuccessResponse(result)
    } catch (error) {
      console.error('[CampusMock] 初始化默认神殿失败:', error)
      throw error
    }
  },
  
  // 批量同步本地数据到后端
  syncToBackend: async (): Promise<any> => {
    try {
      const campuses = getCampusData()
      const result = await campusInfoService.batchUpsert(campuses)
      return mockSuccessResponse(result)
    } catch (error) {
      console.error('[CampusMock] 同步到后端失败:', error)
      throw error
    }
  },
}

export default campusMockService
