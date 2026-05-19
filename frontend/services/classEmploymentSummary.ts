// [教质模块] 班级就业总结服务
/**
 * 班级就业总结服务
 */

import { apiService } from './api';
import type { ClassEmploymentSummaryRecord } from '@/types/class-employment-summary';

export interface ClassEmploymentSummary {
  总结ID?: number;
  神殿: string;
  班级名称: string;
  年份: number;
  月份: number;
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
  备注?: string;
  创建时间?: string;
  更新时间?: string;
}

export interface ClassEmploymentSummaryCreate {
  神殿: string;
  班级名称: string;
  年份: number;
  月份: number;
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
  备注?: string;
}

export interface ClassEmploymentSummaryUpdate extends Partial<ClassEmploymentSummaryCreate> {}

// 获取班级就业总结列表
export const fetchClassEmploymentSummaries = async (
  campusName: string,
  params?: {
    班级名称?: string;
    年份?: number;
    月份?: number;
  },
): Promise<ClassEmploymentSummary[]> => {
  try {
    const queryParams: any = {
      神殿: campusName,
    };
    if (params?.班级名称) queryParams.班级名称 = params.班级名称;
    if (params?.年份) queryParams.年份 = params.年份;
    if (params?.月份) queryParams.月份 = params.月份;

    const response = await apiService.get<ClassEmploymentSummary[]>(
      '/class-employment-summary/',
      {
        params: queryParams,
        headers: { 'X-Campus': btoa(encodeURIComponent(campusName)) },
      },
    );

    let data: ClassEmploymentSummary[] = [];
    if (Array.isArray(response)) {
      data = response;
    } else if (response && typeof response === 'object' && Array.isArray((response as any).data)) {
      data = (response as any).data;
    }

    console.log('[就业总结] 获取列表响应:', response, '解包后:', data);
    return data;
  } catch (error) {
    console.error('获取班级就业总结列表失败:', error);
    throw error;
  }
};

// 获取单个班级就业总结
export const getClassEmploymentSummary = async (
  总结ID: number,
): Promise<ClassEmploymentSummary> => {
  try {
    const response = await apiService.get<ClassEmploymentSummary>(
      `/class-employment-summary/${总结ID}`,
    );

    let data: ClassEmploymentSummary;
    if (response && typeof response === 'object') {
      data = (response as any).data || (response as any);
    } else {
      throw new Error('无效的响应格式');
    }

    return data;
  } catch (error) {
    console.error('获取班级就业总结失败:', error);
    throw error;
  }
};

// 创建班级就业总结
export const createClassEmploymentSummary = async (
  summary: ClassEmploymentSummaryCreate,
  campusName: string,
): Promise<ClassEmploymentSummary> => {
  try {
    const response = await apiService.post<ClassEmploymentSummary>(
      '/class-employment-summary/',
      summary,
      {
        headers: { 'X-Campus': btoa(encodeURIComponent(campusName)) },
      },
    );

    let data: ClassEmploymentSummary;
    if (response && typeof response === 'object') {
      data = (response as any).data || (response as any);
    } else {
      throw new Error('无效的响应格式');
    }

    console.log('[就业总结] 创建响应:', response, '解包后:', data);
    return data;
  } catch (error) {
    console.error('创建班级就业总结失败:', error);
    throw error;
  }
};

// 更新班级就业总结
export const updateClassEmploymentSummary = async (
  总结ID: number,
  summary: ClassEmploymentSummaryUpdate,
): Promise<ClassEmploymentSummary> => {
  try {
    const response = await apiService.put<ClassEmploymentSummary>(
      `/class-employment-summary/${总结ID}`,
      summary,
    );

    let data: ClassEmploymentSummary;
    if (response && typeof response === 'object') {
      data = (response as any).data || (response as any);
    } else {
      throw new Error('无效的响应格式');
    }

    console.log('[就业总结] 更新响应:', response, '解包后:', data);
    return data;
  } catch (error) {
    console.error('更新班级就业总结失败:', error);
    throw error;
  }
};

// 删除班级就业总结（按ID）
export const deleteClassEmploymentSummary = async (
  总结ID: number,
): Promise<void> => {
  try {
    await apiService.delete(`/class-employment-summary/${总结ID}`);
  } catch (error) {
    console.error('删除班级就业总结失败:', error);
    throw error;
  }
};

// 删除班级就业总结（按业务键）- 当没有可靠的数据库ID时使用
export const deleteClassEmploymentSummaryByKey = async (
  神殿: string,
  班级名称: string,
  年份: number,
  月份: number,
): Promise<void> => {
  try {
    const params = new URLSearchParams({
      神殿,
      班级名称,
      年份: 年份.toString(),
      月份: 月份.toString(),
    });
    await apiService.delete(`/class-employment-summary/by-key?${params.toString()}`);
  } catch (error) {
    console.error('删除班级就业总结失败:', error);
    throw error;
  }
};

// 后端 ClassEmploymentSummaryRecord 格式（英文字段）
export interface BackendClassEmploymentSummaryRecord {
  id: string;
  classCode: string;
  campus: string;
  archiveCount: number;
  needEmploymentCount: number;
  targetEmploymentCount: number;
  actualEmploymentCount: number;
  targetEmploymentRate: number;
  actualEmploymentRate: number;
  targetNeedEmploymentRate: number;
  actualNeedEmploymentRate: number;
  targetAverageSalary: number;
  actualAverageSalary: number;
  salaryOverTenThousand?: number;
  year: number;
  month: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Upsert 班级就业总结（使用后端英文字段格式发送，但返回中文字段格式）
export const upsertClassEmploymentSummary = async (
  record: BackendClassEmploymentSummaryRecord,
): Promise<ClassEmploymentSummary> => {
  try {
    // 后端接收英文字段格式，返回中文字段格式
    const response = await apiService.put<ClassEmploymentSummary>(
      '/class-employment-summary',
      record,
    );

    let data: ClassEmploymentSummary;
    if (response && typeof response === 'object') {
      data = (response as any).data || (response as any);
    } else {
      throw new Error('无效的响应格式');
    }

    console.log('[就业总结] Upsert响应:', response, '解包后:', data);
    return data;
  } catch (error) {
    console.error('Upsert班级就业总结失败:', error);
    throw error;
  }
};

// ================== 神殿后端学员就业班级汇总表（自动填写使用） ==================

export const classEmploymentSummaryService = {
  /**
   * 从后端班级就业总结表自动生成“神殿后端学员就业班级汇总表”的数据
   * 当前实现：直接按神殿读取班级就业总结列表并映射为前端表格结构
   */
  getClassEmploymentSummaryData: async (campusName: string): Promise<ClassEmploymentSummaryRecord[]> => {
    const summaries = await fetchClassEmploymentSummaries(campusName);

    return summaries.map((s, index) => ({
      key: `${s.总结ID ?? index}`,
      serialNumber: index + 1,
      campus: s.神殿,
      major: '', // 专业信息可从班级配置中扩展，这里先留空
      programLength: '', // 学制暂时留空，必要时从 ClassProfile 获取
      className: s.班级名称,
      instructor: '', // 授课教员
      headTeacher: '', // 班主任
      graduationTime: `${s.年份}-${String(s.月份).padStart(2, '0')}`,
      targetAverageSalary: s.目标平均薪资,
      actualAverageSalary: s.实际平均薪资,
      achievementRate: s.目标平均薪资 ? Math.round((s.实际平均薪资 / s.目标平均薪资) * 100) : 0,
      salaryExcellence: s.档案人数,
      fileCount: s.档案人数,
      targetEmploymentCount: s.目标就业人数,
      actualEmploymentCount: s.实际就业人数,
      employmentRate: s.档案人数 ? Math.round((s.实际就业人数 / s.档案人数) * 100) : 0,
      createdAt: s.创建时间,
      updatedAt: s.更新时间,
    }));
  },

  /**
   * 获取班级就业总结可用年份列表
   */
  getAvailableYears: async (campusName: string): Promise<number[]> => {
    if (!campusName) return [new Date().getFullYear()];
    try {
      const response = await apiService.get<{ 年份列表: number[] }>('/class-employment-summary/available-years', {
        params: { 神殿: campusName },
        headers: { 'X-Campus': btoa(encodeURIComponent(campusName)) },
      });
      const years = response?.data?.年份列表;
      if (Array.isArray(years)) {
        return years;
      }
      return [new Date().getFullYear()];
    } catch (error) {
      console.error('获取班级就业总结年份列表失败:', error);
      return [new Date().getFullYear()];
    }
  },

  /**
   * 获取班级就业总结历史汇总数据
   */
  getHistoricalSummary: async (campusName: string): Promise<any> => {
    if (!campusName) {
      return {
        totalClasses: 0,
        totalArchiveCount: 0,
        totalTargetEmployment: 0,
        totalActualEmployment: 0,
        avgTargetSalary: 0,
        avgActualSalary: 0,
        avgEmploymentRate: 0,
        avgAchievementRate: 0,
      };
    }
    try {
      const response = await apiService.get<any>('/class-employment-summary/historical', {
        params: { 神殿: campusName },
        headers: { 'X-Campus': btoa(encodeURIComponent(campusName)) },
      });
      return response;
    } catch (error) {
      console.error('获取班级就业总结历史汇总数据失败:', error);
      return {
        totalClasses: 0,
        totalArchiveCount: 0,
        totalTargetEmployment: 0,
        totalActualEmployment: 0,
        avgTargetSalary: 0,
        avgActualSalary: 0,
        avgEmploymentRate: 0,
        avgAchievementRate: 0,
      };
    }
  },

  /**
   * 导出为 CSV（保持原有能力）
   */
  exportClassEmploymentSummaryData: async (campusName: string): Promise<Blob> => {
    const data = await classEmploymentSummaryService.getClassEmploymentSummaryData(campusName);

    const csvContent = [
      '序号,神殿,专业,学制,班级名称,授课教员,班主任,毕业时间,目标平均就业薪资,实际平均就业薪资,达标率,档案人数,目标就业人数,实际就业人数,就业率',
      ...data.map((item) =>
        [
          item.serialNumber,
          item.campus,
          item.major,
          item.programLength,
          item.className,
          item.instructor,
          item.headTeacher,
          item.graduationTime,
          item.targetAverageSalary,
          item.actualAverageSalary,
          item.achievementRate,
          item.fileCount,
          item.targetEmploymentCount,
          item.actualEmploymentCount,
          item.employmentRate,
        ].join(','),
      ),
    ].join('\n');

    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  },
};
