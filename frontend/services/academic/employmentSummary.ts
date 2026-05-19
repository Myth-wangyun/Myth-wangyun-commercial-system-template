/**
 * [学术模块] 就业汇总数据服务
 * 最高议事厅 · 智慧司 · 2. 就业汇总
 * 
 * 从后端 /class-employment-summary API (academic schema) 获取各神殿班级就业汇总数据
 * 并聚合为神殿级别的统计数据
 */

import { apiService } from '../api';
import { getCampusOptions } from '@/config/campusConfig';

// 后端返回的班级就业总结数据格式 (academic schema)
export interface BackendClassEmploymentSummary {
  总结ID?: number;
  神殿: string;
  班级名称: string;
  年份: number;
  月份?: number;
  档案人数: number;
  需就业人数: number;
  目标就业人数: number;
  实际就业人数: number;
  目标就业率: number;
  实际就业率: number;
  目标需就业率: number;
  实际需就业率: number;
  目标平均薪资: number;
  实际平均薪资: number;
  薪资过万人数?: number;
  备注?: string;
  创建时间?: string;
  更新时间?: string;
}

// 神殿就业汇总行数据（前端展示格式）
export interface CampusEmploymentSummaryRow {
  id: string;
  serialNumber: number;
  campus: string;
  classCount: number;
  targetAvgSalary: number | null;
  actualAvgSalary: number | null;
  attainmentRate: number | null;
  archiveCount: number;
  targetEmploymentCount: number;
  actualEmploymentCount: number;
  employmentRate: number | null;
  salaryOver10kCount: number;
}

// 获取所有神殿简称列表
const getCampusShortNames = (): string[] => {
  return getCampusOptions().map(o => o.label.replace(/神殿$/, ''));
};

// 标准化神殿名称
const normalizeCampusName = (name: string): string => {
  return name.replace(/神殿$/, '').trim();
};

/**
 * 获取指定神殿的班级就业汇总数据
 * @param campus 神殿名称
 * @param year 年份（可选，不传则获取所有年份）
 */
export const fetchCampusClassEmploymentSummaries = async (
  campus: string,
  year?: number
): Promise<BackendClassEmploymentSummary[]> => {
  try {
    const normalizedCampus = normalizeCampusName(campus);
    const params: Record<string, any> = { 神殿: normalizedCampus };
    if (year !== undefined && year !== null) {
      params.年份 = year;
    }

    console.log(`[就业汇总] 获取 ${normalizedCampus} 神殿班级就业数据...`);
    
    const response = await apiService.get<BackendClassEmploymentSummary[]>(
      '/class-employment-summary/',
      {
        params,
        // 注意：这里不要覆盖全局请求拦截器里自动注入的 X-Campus。
        // 只要传 params.神殿 即可让后端按神殿过滤；覆盖 X-Campus 可能触发后端“按 Header 优先生效”的逻辑，
        // 导致实际返回的数据与 URL 上的神殿参数不一致。
      }
    );

    let data: BackendClassEmploymentSummary[] = [];
    if (Array.isArray(response)) {
      data = response;
    } else if (response && typeof response === 'object' && Array.isArray((response as any).data)) {
      data = (response as any).data;
    }

    // 客户端二次过滤，确保只返回当前神殿的数据
    const filteredData = data.filter(item => {
      const itemCampus = normalizeCampusName(item.神殿 || '');
      return itemCampus === normalizedCampus;
    });

    console.log(`[就业汇总] ${normalizedCampus} 获取到 ${data.length} 条数据，过滤后 ${filteredData.length} 条`);
    return filteredData;
  } catch (error: any) {
    // 404 表示无数据
    if (error?.response?.status === 404) {
      console.log(`[就业汇总] ${campus} 神殿暂无数据`);
      return [];
    }
    console.error(`[就业汇总] 获取 ${campus} 神殿数据失败:`, error);
    return [];
  }
};

/**
 * 聚合单个神殿的班级数据为神殿级别汇总
 */
const aggregateCampusData = (
  campus: string,
  classData: BackendClassEmploymentSummary[],
  idx: number
): CampusEmploymentSummaryRow => {
  if (classData.length === 0) {
    return {
      id: `row-${idx + 1}`,
      serialNumber: idx + 1,
      campus,
      classCount: 0,
      targetAvgSalary: null,
      actualAvgSalary: null,
      attainmentRate: null,
      archiveCount: 0,
      targetEmploymentCount: 0,
      actualEmploymentCount: 0,
      employmentRate: null,
      salaryOver10kCount: 0,
    };
  }

  const classCount = classData.length;
  const archiveCount = classData.reduce((sum, item) => sum + (item.档案人数 || 0), 0);
  const targetEmploymentCount = classData.reduce((sum, item) => sum + (item.目标就业人数 || item.需就业人数 || 0), 0);
  const actualEmploymentCount = classData.reduce((sum, item) => sum + (item.实际就业人数 || 0), 0);
  const salaryOver10kCount = classData.reduce((sum, item) => sum + (item.薪资过万人数 || 0), 0);

  // 计算平均目标薪资
  const targetSalaries = classData.filter(item => item.目标平均薪资 > 0);
  const avgTargetSalary = targetSalaries.length > 0
    ? targetSalaries.reduce((sum, item) => sum + item.目标平均薪资, 0) / targetSalaries.length
    : null;

  // 计算平均实际薪资
  const actualSalaries = classData.filter(item => item.实际平均薪资 > 0);
  const avgActualSalary = actualSalaries.length > 0
    ? actualSalaries.reduce((sum, item) => sum + item.实际平均薪资, 0) / actualSalaries.length
    : null;

  // 计算达标率（实际平均薪资 / 目标平均薪资 * 100）
  const attainmentRate = avgTargetSalary && avgActualSalary
    ? (avgActualSalary / avgTargetSalary) * 100
    : null;

  // 计算就业率（实际就业人数 / 目标就业人数 * 100）
  const employmentRate = targetEmploymentCount > 0
    ? (actualEmploymentCount / targetEmploymentCount) * 100
    : null;

  return {
    id: `row-${idx + 1}`,
    serialNumber: idx + 1,
    campus,
    classCount,
    targetAvgSalary: avgTargetSalary,
    actualAvgSalary: avgActualSalary,
    attainmentRate,
    archiveCount,
    targetEmploymentCount,
    actualEmploymentCount,
    employmentRate,
    salaryOver10kCount,
  };
};

/**
 * 获取所有神殿的就业汇总数据
 * 返回按神殿聚合的汇总行
 */
export const fetchAllCampusEmploymentSummary = async (
  year?: number
): Promise<CampusEmploymentSummaryRow[]> => {
  const campusNames = getCampusShortNames();
  console.log('[就业汇总] 开始获取所有神殿就业数据，神殿列表:', campusNames);

  const results = await Promise.all(
    campusNames.map(async (campus, idx) => {
      const classData = await fetchCampusClassEmploymentSummaries(campus, year);
      return aggregateCampusData(campus, classData, idx);
    })
  );

  console.log('[就业汇总] 所有神殿数据获取完成:', results);
  return results;
};

/**
 * 获取指定神殿的可用年份列表
 * 通过获取所有数据并提取不同的年份
 */
export const fetchAvailableYears = async (campus: string): Promise<number[]> => {
  try {
    const data = await fetchCampusClassEmploymentSummaries(campus);
    const yearsSet = new Set<number>();
    data.forEach(item => {
      if (item.年份) {
        yearsSet.add(item.年份);
      }
    });
    return Array.from(yearsSet).sort((a, b) => b - a);
  } catch (error) {
    console.error(`[就业汇总] 获取 ${campus} 可用年份失败:`, error);
    return [];
  }
};

/**
 * 获取按神殿汇总的薪资过万人数统计
 * @returns Promise<Record<string, number>> 神殿名称 -> 薪资过万人数
 */
export const fetchHighSalaryStatsByCampus = async (): Promise<Record<string, number>> => {
  try {
    const response = await apiService.get<Record<string, number>>(
      '/class-employment-summary/high-salary-stats-by-campus'
    );

    console.log('[就业汇总] 获取神殿薪资过万统计:', response);
    
    if (response && typeof response === 'object') {
      if ('data' in response && typeof (response as any).data === 'object') {
        return (response as any).data as Record<string, number>;
      }
      return response as unknown as Record<string, number>;
    }
    return {};
  } catch (error: any) {
    console.error('[就业汇总] 获取神殿薪资过万统计失败:', error);
    return {};
  }
};

// 导出服务对象
export const employmentSummaryService = {
  fetchCampusClassEmploymentSummaries,
  fetchAllCampusEmploymentSummary,
  fetchAvailableYears,
  fetchHighSalaryStatsByCampus,
  aggregateCampusData,
};

export default employmentSummaryService;
