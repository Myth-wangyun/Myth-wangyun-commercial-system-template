// [教质模块] 神殿教化司口碑招生目标与结果汇总表数据服务
/**
 * 神殿教化司口碑招生目标与结果汇总表数据服务
 */

import { apiService } from './api'
import type {
  CampusReputationEnrollmentGoalsResultsRecord,
  CampusReputationEnrollmentGoalsResultsRequest,
  CampusReputationEnrollmentGoalsResultsSummary,
} from '../types/campus-reputation-enrollment-goals-results'

// 后端返回的数据格式
interface BackendReputationData {
  id?: number;
  campus: string;
  year: number;
  month: number;
  targetReputation: number;
  actualReputation: number;
  targetVisits: number;
  actualVisits: number;
  targetStudents: number;
  actualStudents: number;
  targetRevenue: number;
  actualRevenue: number;
  created_at?: string;
  updated_at?: string;
}

// 将后端数据转换为前端格式
const transformBackendToFrontend = (
  backendData: any[],
  campus: string
): CampusReputationEnrollmentGoalsResultsRecord[] => {
  if (!backendData || backendData.length === 0) {
    return [];
  }

  // 处理月度数据
  const monthlyData = backendData.map((item, index) => ({
    key: `row-${index}`,
    month: item.month,
    campus: index === 0 ? campus : '', // 只有第一条记录显示神殿名称
    targetReputationVolume: item.targetReputation || 0,
    actualReputationVolume: item.actualReputation || 0,
    targetWalkInVolume: item.targetVisits || 0,
    actualWalkInVolume: item.actualVisits || 0,
    targetEnrollmentCount: item.targetStudents || 0,
    actualEnrollmentCount: item.actualStudents || 0,
    targetRevenue: item.targetRevenue || 0,
    actualRevenue: item.actualRevenue || 0,
  }));

  // 添加合计行
  const totalRow: any = {
    key: 'total',
    month: '合计',
    campus: '',
    targetReputationVolume: monthlyData.reduce((sum, item) => sum + (item.targetReputationVolume || 0), 0),
    actualReputationVolume: monthlyData.reduce((sum, item) => sum + (item.actualReputationVolume || 0), 0),
    targetWalkInVolume: monthlyData.reduce((sum, item) => sum + (item.targetWalkInVolume || 0), 0),
    actualWalkInVolume: monthlyData.reduce((sum, item) => sum + (item.actualWalkInVolume || 0), 0),
    targetEnrollmentCount: monthlyData.reduce((sum, item) => sum + (item.targetEnrollmentCount || 0), 0),
    actualEnrollmentCount: monthlyData.reduce((sum, item) => sum + (item.actualEnrollmentCount || 0), 0),
    targetRevenue: monthlyData.reduce((sum, item) => sum + (item.targetRevenue || 0), 0),
    actualRevenue: monthlyData.reduce((sum, item) => sum + (item.actualRevenue || 0), 0),
  };

  return [...monthlyData, totalRow];
};

// 从API响应中提取数据
const extractDataFromResponse = <T>(response: any): T => {
  if (!response) {
    return [] as unknown as T;
  }
  // 如果响应是数组，直接返回
  if (Array.isArray(response)) {
    return response as unknown as T;
  }
  
  // 如果响应直接包含"行列表"字段
  if (typeof response === 'object' && '行列表' in response && Array.isArray(response.行列表)) {
    return response.行列表 as unknown as T;
  }
  
  // 如果响应有data字段，返回data
  if (typeof response === 'object' && 'data' in response) {
    const data = response.data;
    if (data && typeof data === 'object') {
      if ('行列表' in data && Array.isArray(data.行列表)) {
        return data.行列表 as unknown as T;
      }
      if ('list' in data && Array.isArray(data.list)) {
        return data.list as unknown as T;
      }
      if ('items' in data && Array.isArray(data.items)) {
        return data.items as unknown as T;
      }
      if (Array.isArray(data)) {
        return data as unknown as T;
      }
      return data as unknown as T;
    }
    return data as unknown as T;
  }
  
  // 其他情况直接返回响应
  return response as unknown as T;
};

export const campusReputationEnrollmentGoalsResultsService = {
  /**
   * 获取神殿口碑招生目标与结果汇总数据
   * @param campus 神殿名称
   * @param year 年份
   * @returns Promise<CampusReputationEnrollmentGoalsResultsRecord[]>
   */
  getCampusReputationEnrollmentGoalsResultsData: async (
    campus: string,
    year?: number
  ): Promise<CampusReputationEnrollmentGoalsResultsRecord[]> => {
    if (!campus) {
      throw new Error('神殿名称不能为空')
    }

    try {
      // 如果没有提供年份，使用当前年份
      const currentYear = year || new Date().getFullYear();
      
      // 调用后端API获取数据
      const response = await apiService.get(
        '/teaching-quality/campus-reputation-enrollment-goals-results',
        {
          params: {
            campus,
            year: currentYear,
          },
        },
      )

      // 提取数据
      const backendData = extractDataFromResponse<any[]>(response) || [];
      
      // 转换为前端格式并返回
      return transformBackendToFrontend(backendData, campus);
      
    } catch (error: any) {
      // 404 表示没有数据，返回空数组
      if (error?.response?.status === 404) {
        console.log(`[口碑招生] ${campus} 神殿暂无数据`);
        return [];
      }
      console.error('[口碑招生] 获取数据失败:', error);
      throw error;
    }
  },

  saveCampusReputationEnrollmentGoalsResultsData: async (
    campus: string,
    records: CampusReputationEnrollmentGoalsResultsRecord[],
    year?: number,
  ): Promise<void> => {
    if (!campus) {
      throw new Error('神殿名称不能为空')
    }

    const targetYear = year || new Date().getFullYear()
    const monthlyRecords = records.filter((item) => Number(item.month) > 0)

    await apiService.post('/teaching-quality/campus-reputation-enrollment-goals-results', {
      campus,
      year: targetYear,
      records: monthlyRecords,
    })
  },

  getAvailableYears: async (_campus?: string): Promise<number[]> => {
    const currentYear = new Date().getFullYear()
    return [currentYear, currentYear - 1]
  },

  exportCampusReputationEnrollmentGoalsResultsData: async (
    campus: string,
    year?: number,
  ): Promise<Blob> => {
    const records = await campusReputationEnrollmentGoalsResultsService.getCampusReputationEnrollmentGoalsResultsData(
      campus,
      year,
    )
    const header = ['月份', '目标口碑量', '实际口碑量', '目标上门量', '实际上门量', '目标招生人数', '实际招生人数', '目标口碑收入', '实际口碑收入']
    const rows = records.map((item) => [
      item.month,
      item.targetReputationVolume,
      item.actualReputationVolume,
      item.targetWalkInVolume,
      item.actualWalkInVolume,
      item.targetEnrollmentCount,
      item.actualEnrollmentCount,
      item.targetRevenue,
      item.actualRevenue,
    ])
    const csv = [header, ...rows].map((row) => row.join(',')).join('\n')
    return new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
  },

  updateCampusReputationEnrollmentGoalsResultsData: async (
    campus: string,
    record: CampusReputationEnrollmentGoalsResultsRecord,
    year?: number,
  ): Promise<void> => {
    const allRecords = await campusReputationEnrollmentGoalsResultsService.getCampusReputationEnrollmentGoalsResultsData(
      campus,
      year,
    )
    const next = allRecords.map((item) => (item.month === record.month ? record : item))
    return campusReputationEnrollmentGoalsResultsService.saveCampusReputationEnrollmentGoalsResultsData(
      campus,
      next,
      year,
    )
  },

  addCampusReputationEnrollmentGoalsResultsData: async (
    campus: string,
    record: CampusReputationEnrollmentGoalsResultsRecord,
    year?: number,
  ): Promise<void> => {
    const allRecords = await campusReputationEnrollmentGoalsResultsService.getCampusReputationEnrollmentGoalsResultsData(
      campus,
      year,
    )
    const next = [...allRecords.filter((item) => item.month !== record.month), record].sort(
      (a, b) => a.month - b.month,
    )
    return campusReputationEnrollmentGoalsResultsService.saveCampusReputationEnrollmentGoalsResultsData(
      campus,
      next,
      year,
    )
  },

  // 其他方法保持不变...
}