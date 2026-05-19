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

// 删除班级就业总结
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

// ================== 神殿后端学员就业班级汇总表（自动填写使用） ==================

export const classEmploymentSummaryService = {
  /**
   * 从后端班级就业总结表自动生成“神殿后端学员就业班级汇总表”的数据
   * 当前实现：直接按神殿读取班级就业总结列表并映射为前端表格结构
   */
  getClassEmploymentSummaryData: async (campusName: string, year?: number | null): Promise<ClassEmploymentSummaryRecord[]> => {
    // 新实现：调用教学质量模块 QT 班级就业信息汇总 API，返回该神殿所有班级汇总
    const params: any = { campus: campusName }
    if (year !== null && year !== undefined) {
      params.year = year
    }

    const res = await apiService.get<any[]>(
      '/teaching-quality/qt-class-employment-summary/list',
      { params },
    )

    const rows: any[] = Array.isArray(res) ? res : (res as any)?.data || []

    return rows.map((r, index) => {
      const 神殿 = r.神殿名称 || campusName
      const 年份 = r.年份 || 0
      const 班级 = r.班级名称 || ''
      const 档案人数 = r.结案人数 ?? 0
      const 需就业人数 = r.需就业人数 ?? 0
      const 实际就业人数 = r.实际就业人数 ?? 0
      const 实际平均薪资 = r.实际平均薪资 ?? 0
      const 目标平均薪资 = r.目标平均薪资 ?? 0
      const 就业达标率 = r.就业达标率 ?? (目标平均薪资 > 0 ? 实际平均薪资 / 目标平均薪资 : 0)
      const 实际就业率 = r.实际就业率 ?? (档案人数 > 0 ? 实际就业人数 / 档案人数 : 0)

      return {
        key: `${神殿}-${年份}-${班级}-${index}`,
        serialNumber: index + 1,
        campus: 神殿,
        major: r.专业 || '',
        programLength: r.学制 || '',
        className: 班级,
        instructor: r.教员 || '',
        headTeacher: r.班主任 || '',
        graduationTime: 年份 ? String(年份) : '',
        targetAverageSalary: Number(目标平均薪资) || 0,
        actualAverageSalary: Number(实际平均薪资) || 0,
        achievementRate: Math.round((Number(就业达标率) || 0) * 100),
        salaryExcellence: 档案人数,
        fileCount: 档案人数,
        targetEmploymentCount: 需就业人数,
        actualEmploymentCount: 实际就业人数,
        employmentRate: Math.round((Number(实际就业率) || 0) * 100),
        createdAt: r.创建时间,
        updatedAt: r.更新时间,
      } as ClassEmploymentSummaryRecord
    })
  },

  /**
   * 获取指定神殿的可用年份列表（按降序排列）
   */
  getAvailableYears: async (campusName: string): Promise<number[]> => {
    try {
      const res = await apiService.get<number[]>(
        '/teaching-quality/qt-class-employment-summary/years',
        { params: { campus: campusName } },
      )

      let years: number[] = Array.isArray(res) ? (res as any) : (res as any)?.data || []
      if (!Array.isArray(years)) years = []

      // 若后端年份为空，则尝试通过列表接口推断可用年份
      if (years.length === 0) {
        const listRes = await apiService.get<any[]>(
          '/teaching-quality/qt-class-employment-summary/list',
          { params: { campus: campusName } },
        )
        const rows: any[] = Array.isArray(listRes) ? (listRes as any) : (listRes as any)?.data || []
        const yearSet = new Set<number>()
        for (const r of rows) {
          const y = Number(r?.年份)
          if (y && !Number.isNaN(y)) yearSet.add(y)
        }
        years = Array.from(yearSet)
      }

      // 确保年份按降序排列（最新年份在前）
      return years.sort((a, b) => b - a)
    } catch (error) {
      console.error('获取可用年份失败:', error)
      return []
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
