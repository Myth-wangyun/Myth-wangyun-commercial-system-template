// [教质模块] 神殿后端教员就业汇总表服务
/**
 * 神殿后端教员就业汇总表服务
 */

import { apiService } from './api';
import type { TeacherEmploymentSummaryRecord } from '@/types/teacher-employment-summary';

export interface TeacherEmploymentSummary {
  汇总ID?: number;
  神殿: string;
  教员姓名: string;
  专业: string;
  学制: string;
  班级名称: string;
  毕业时间?: string;
  目标平均就业薪资?: number;
  实际平均就业薪资?: number;
  达标率?: number;
  目标就业人数?: number;
  实际就业人数?: number;
  就业率?: number;
  薪资过万人数?: number;
  创建时间?: string;
  更新时间?: string;
}

export interface AutoFillRequest {
  神殿: string;
  教员姓名?: string;
  班级名称?: string;
}

export interface AutoFillResponse {
  处理数量: number;
  结果: Array<{
    汇总ID: number;
    教员姓名: string;
    班级名称: string;
    操作: string;
    统计结果: {
      实际就业人数: number;
      实际平均就业薪资: number | null;
      薪资过万人数: number;
      就业率: number | null;
    };
  }>;
}

// 获取教员就业汇总列表
export const getTeacherEmploymentSummaries = async (
  campus: string,
  teacherName?: string,
  className?: string,
  year?: number,
  month?: number,
): Promise<TeacherEmploymentSummary[]> => {
  try {
    // 校验神殿参数
    if (!campus || campus.trim() === '') {
      console.error('[教员就业汇总] 神殿参数为空，无法调用API');
      throw new Error('神殿参数不能为空');
    }
    
    console.log('[教员就业汇总] 调用API获取列表:', { campus, teacherName, className, year, month });
    
    const response = await apiService.get<TeacherEmploymentSummary[]>('/teacher-employment-summary', {
      params: {
        教员姓名: teacherName,
        班级名称: className,
        限制: 1000,
        年份: year,
        月份: month,
      },
      headers: {
        'X-Campus': btoa(encodeURIComponent(campus)),
      },
    });

    let data: TeacherEmploymentSummary[] = [];
    if (Array.isArray(response)) {
      data = response;
    } else if (response && typeof response === 'object') {
      data = (response as any).data || (response as any) || [];
    }

    console.log('[教员就业汇总] 获取列表响应:', { campus, response, data, dataLength: data.length });
    return data;
  } catch (error) {
    console.error('获取教员就业汇总列表失败:', error);
    return [];
  }
};

// 创建教员就业汇总
export const createTeacherEmploymentSummary = async (
  campus: string,
  data: Omit<TeacherEmploymentSummary, '汇总ID' | '创建时间' | '更新时间'>,
): Promise<TeacherEmploymentSummary> => {
  try {
    const response = await apiService.post<TeacherEmploymentSummary>('/teacher-employment-summary', data, {
      headers: {
        'X-Campus': btoa(encodeURIComponent(campus)),
      },
    });

    const responseData = (response && typeof response === 'object' && 'data' in response && response.data)
      ? response.data
      : response;

    console.log('[教员就业汇总] 创建响应:', response, '解包后:', responseData);
    return responseData as TeacherEmploymentSummary;
  } catch (error) {
    console.error('创建教员就业汇总失败:', error);
    throw error;
  }
};

// 更新教员就业汇总
export const updateTeacherEmploymentSummary = async (
  campus: string,
  汇总ID: number,
  data: Partial<TeacherEmploymentSummary>,
): Promise<TeacherEmploymentSummary> => {
  try {
    const response = await apiService.put<TeacherEmploymentSummary>(
      `/teacher-employment-summary/${汇总ID}`,
      data,
      {
        headers: {
          'X-Campus': btoa(encodeURIComponent(campus)),
        },
      },
    );

    const responseData = (response && typeof response === 'object' && 'data' in response && response.data)
      ? response.data
      : response;

    console.log('[教员就业汇总] 更新响应:', response, '解包后:', responseData);
    return responseData as TeacherEmploymentSummary;
  } catch (error) {
    console.error('更新教员就业汇总失败:', error);
    throw error;
  }
};

// 删除教员就业汇总
export const deleteTeacherEmploymentSummary = async (
  campus: string,
  汇总ID: number,
): Promise<void> => {
  try {
    await apiService.delete(`/teacher-employment-summary/${汇总ID}`, {
      headers: {
        'X-Campus': btoa(encodeURIComponent(campus)),
      },
    });
  } catch (error) {
    console.error('删除教员就业汇总失败:', error);
    throw error;
  }
};

// 自动填充教员就业汇总
export const autoFillTeacherEmploymentSummary = async (
  request: AutoFillRequest,
): Promise<AutoFillResponse> => {
  try {
    const response = await apiService.post<AutoFillResponse>('/teacher-employment-summary/auto-fill', request);

    const responseData = (response && typeof response === 'object' && 'data' in response && response.data)
      ? response.data
      : response;

    console.log('[教员就业汇总] 自动填充响应:', response, '解包后:', responseData);
    return responseData as AutoFillResponse;
  } catch (error) {
    console.error('自动填充教员就业汇总失败:', error);
    throw error;
  }
};

// 自动统计单个教员班级的就业数据
export const autoStatisticsSingle = async (
  神殿: string,
  教员姓名: string,
  班级名称: string,
): Promise<{
  实际就业人数: number;
  实际平均就业薪资: number | null;
  薪资过万人数: number;
  就业率: number | null;
}> => {
  try {
    const response = await apiService.get<{
      实际就业人数: number;
      实际平均就业薪资: number | null;
      薪资过万人数: number;
      就业率: number | null;
    }>('/teacher-employment-summary/auto-statistics', {
      params: {
        神殿,
        教员姓名,
        班级名称,
      },
    });

    let data: {
      实际就业人数: number;
      实际平均就业薪资: number | null;
      薪资过万人数: number;
      就业率: number | null;
    };
    
    if (Array.isArray(response)) {
      throw new Error('意外的响应格式');
    } else if (response && typeof response === 'object') {
      data = (response as any).data || (response as any);
    } else {
      throw new Error('无效的响应格式');
    }

    console.log('[教员就业汇总] 自动统计响应:', response, '解包后:', data);
    return data;
  } catch (error) {
    console.error('自动统计失败:', error);
    throw error;
  }
};

// 根据教员-班级关联自动生成表格
export const autoGenerateFromAssignments = async (
  神殿: string,
  年份?: number,
  月份?: number,
): Promise<{
  处理数量: number;
  创建数量: number;
  更新数量: number;
  结果: Array<{
    汇总ID: number;
    教员姓名: string;
    班级名称: string;
    操作: string;
    数据: any;
  }>;
}> => {
  try {
    const params: any = { 神殿 };
    if (年份) params.年份 = 年份;
    if (月份) params.月份 = 月份;

    const response = await apiService.post<{
      处理数量: number;
      创建数量: number;
      更新数量: number;
      结果: Array<{
        汇总ID: number;
        教员姓名: string;
        班级名称: string;
        操作: string;
        数据: any;
      }>;
    }>('/teacher-employment-summary/auto-generate', {}, {
      params,
      headers: {
        'X-Campus': btoa(encodeURIComponent(神殿)),
      },
    });

    let data: {
      处理数量: number;
      创建数量: number;
      更新数量: number;
      结果: Array<{
        汇总ID: number;
        教员姓名: string;
        班级名称: string;
        操作: string;
        数据: any;
      }>;
    };

    if (response && typeof response === 'object') {
      data = (response as any).data || (response as any);
    } else {
      throw new Error('无效的响应格式');
    }

    console.log('[教员就业汇总] 自动生成表格响应:', response, '解包后:', data);
    return data;
  } catch (error) {
    console.error('自动生成表格失败:', error);
    throw error;
  }
};

/**
 * 教员就业汇总服务对象
 * 提供统一的服务接口，包含数据获取、导出、更新等功能
 */
export const teacherEmploymentSummaryService = {
  /**
   * 获取教员就业汇总数据
   * 从后端API获取数据并转换为前端表格记录格式
   * @param campus 神殿名称
   * @returns Promise<TeacherEmploymentSummaryRecord[]>
   */
  getTeacherEmploymentSummaryData: async (campus: string): Promise<TeacherEmploymentSummaryRecord[]> => {
    try {
      // 校验神殿参数
      if (!campus || campus.trim() === '') {
        console.warn('[教员就业汇总] 神殿参数为空，返回空数组');
        return [];
      }
      
      const summaries = await getTeacherEmploymentSummaries(campus);

      // 按教员姓名和班级名称分组，生成带合计行的数据
      const records: TeacherEmploymentSummaryRecord[] = [];
      const teacherGroups = new Map<string, TeacherEmploymentSummary[]>();

      // 按教员分组
      summaries.forEach((summary) => {
        const key = summary.教员姓名;
        if (!teacherGroups.has(key)) {
          teacherGroups.set(key, []);
        }
        teacherGroups.get(key)!.push(summary);
      });

      let serialNumber = 1;

      // 遍历每个教员
      teacherGroups.forEach((classSummaries, teacherName) => {
        // 按班级排序
        classSummaries.sort((a, b) => {
          if (a.班级名称 < b.班级名称) return -1;
          if (a.班级名称 > b.班级名称) return 1;
          return 0;
        });

        let teacherFirstRow = true;
        let teacherSubtotal = {
          targetAverageSalary: 0,
          actualAverageSalary: 0,
          fileCount: 0,
          targetEmploymentCount: 0,
          actualEmploymentCount: 0,
          salaryOverTenThousand: 0,
        };

        // 添加该教员的每个班级数据
        classSummaries.forEach((summary) => {
        const record: TeacherEmploymentSummaryRecord = {
          key: `${summary.汇总ID ?? serialNumber}`,
          summaryId: summary.汇总ID,
          serialNumber: teacherFirstRow ? serialNumber++ : 0,
          teacherName: summary.教员姓名,
            major: summary.专业,
            programLength: summary.学制,
            className: summary.班级名称,
            graduationTime: summary.毕业时间,
            targetAverageSalary: summary.目标平均就业薪资,
            actualAverageSalary: summary.实际平均就业薪资,
            achievementRate: summary.达标率,
            fileCount: summary.目标就业人数, // 使用目标就业人数作为档案人数
            targetEmploymentCount: summary.目标就业人数,
            actualEmploymentCount: summary.实际就业人数,
            employmentRate: summary.就业率,
            salaryOverTenThousand: summary.薪资过万人数,
            campus: summary.神殿,
            rowType: 'data',
            createdAt: summary.创建时间,
            updatedAt: summary.更新时间,
          };

          records.push(record);

          // 累计小计数据
          teacherSubtotal.fileCount += summary.目标就业人数 || 0;
          teacherSubtotal.targetEmploymentCount += summary.目标就业人数 || 0;
          teacherSubtotal.actualEmploymentCount += summary.实际就业人数 || 0;
          teacherSubtotal.salaryOverTenThousand += summary.薪资过万人数 || 0;

          // 计算加权平均薪资
          const weight = summary.目标就业人数 || 1;
          teacherSubtotal.targetAverageSalary += (summary.目标平均就业薪资 || 0) * weight;
          teacherSubtotal.actualAverageSalary += (summary.实际平均就业薪资 || 0) * weight;

          teacherFirstRow = false;
        });

        // 添加教员小计行
        const totalWeight = teacherSubtotal.fileCount || 1;
        const avgTargetSalary = totalWeight > 0
          ? Math.round(teacherSubtotal.targetAverageSalary / totalWeight)
          : 0;
        const avgActualSalary = totalWeight > 0
          ? Math.round(teacherSubtotal.actualAverageSalary / totalWeight)
          : 0;
        const achievementRate = avgTargetSalary > 0
          ? Math.round((avgActualSalary / avgTargetSalary) * 100)
          : 0;
        const employmentRate = teacherSubtotal.fileCount > 0
          ? Math.round((teacherSubtotal.actualEmploymentCount / teacherSubtotal.fileCount) * 100)
          : 0;

        records.push({
          key: `subtotal-${teacherName}`,
          serialNumber: 0,
          teacherName: '',
          major: '',
          programLength: '',
          className: '',
          targetAverageSalary: avgTargetSalary,
          actualAverageSalary: avgActualSalary,
          achievementRate,
          fileCount: teacherSubtotal.fileCount,
          targetEmploymentCount: teacherSubtotal.targetEmploymentCount,
          actualEmploymentCount: teacherSubtotal.actualEmploymentCount,
          employmentRate,
          salaryOverTenThousand: teacherSubtotal.salaryOverTenThousand,
          campus,
          rowType: 'subtotal',
        });
      });

      // 添加总合计行
      const totalSubtotal = {
        targetAverageSalary: 0,
        actualAverageSalary: 0,
        fileCount: 0,
        targetEmploymentCount: 0,
        actualEmploymentCount: 0,
        salaryOverTenThousand: 0,
      };

      records.forEach((record) => {
        if (record.rowType === 'data') {
          totalSubtotal.fileCount += record.fileCount || 0;
          totalSubtotal.targetEmploymentCount += record.targetEmploymentCount || 0;
          totalSubtotal.actualEmploymentCount += record.actualEmploymentCount || 0;
          totalSubtotal.salaryOverTenThousand += record.salaryOverTenThousand || 0;

          const weight = record.fileCount || 1;
          totalSubtotal.targetAverageSalary += (record.targetAverageSalary || 0) * weight;
          totalSubtotal.actualAverageSalary += (record.actualAverageSalary || 0) * weight;
        }
      });

      const totalWeight = totalSubtotal.fileCount || 1;
      const totalAvgTargetSalary = totalWeight > 0
        ? Math.round(totalSubtotal.targetAverageSalary / totalWeight)
        : 0;
      const totalAvgActualSalary = totalWeight > 0
        ? Math.round(totalSubtotal.actualAverageSalary / totalWeight)
        : 0;
      const totalAchievementRate = totalAvgTargetSalary > 0
        ? Math.round((totalAvgActualSalary / totalAvgTargetSalary) * 100)
        : 0;
      const totalEmploymentRate = totalSubtotal.fileCount > 0
        ? Math.round((totalSubtotal.actualEmploymentCount / totalSubtotal.fileCount) * 100)
        : 0;

      records.push({
        key: 'total',
        serialNumber: 0,
        teacherName: '',
        major: '',
        programLength: '',
        className: '',
        targetAverageSalary: totalAvgTargetSalary,
        actualAverageSalary: totalAvgActualSalary,
        achievementRate: totalAchievementRate,
        fileCount: totalSubtotal.fileCount,
        targetEmploymentCount: totalSubtotal.targetEmploymentCount,
        actualEmploymentCount: totalSubtotal.actualEmploymentCount,
        employmentRate: totalEmploymentRate,
        salaryOverTenThousand: totalSubtotal.salaryOverTenThousand,
        campus,
        rowType: 'total',
      });

      return records;
    } catch (error) {
      console.error('获取教员就业汇总数据失败:', error);
      throw error;
    }
  },

  /**
   * 导出教员就业汇总数据为CSV
   * @param campus 神殿名称
   * @returns Promise<Blob>
   */
  exportTeacherEmploymentSummaryData: async (campus: string): Promise<Blob> => {
    try {
      // 校验神殿参数
      if (!campus || campus.trim() === '') {
        throw new Error('神殿参数不能为空');
      }
      
      const data = await teacherEmploymentSummaryService.getTeacherEmploymentSummaryData(campus);

      // 过滤掉合计行，只导出数据行
      const dataRows = data.filter((record) => record.rowType === 'data');

      const csvContent = [
        '序号,神殿,教员姓名,专业,学制,班级名称,毕业时间,目标平均就业薪资,实际平均就业薪资,达标率,档案人数,目标就业人数,实际就业人数,就业率,薪资过万人数',
        ...dataRows.map((item) =>
          [
            item.serialNumber,
            item.campus,
            item.teacherName,
            item.major,
            item.programLength,
            item.className,
            item.graduationTime || '',
            item.targetAverageSalary || '',
            item.actualAverageSalary || '',
            item.achievementRate || '',
            item.fileCount || '',
            item.targetEmploymentCount || '',
            item.actualEmploymentCount || '',
            item.employmentRate || '',
            item.salaryOverTenThousand || '',
          ].join(','),
        ),
      ].join('\n');

      return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    } catch (error) {
      console.error('导出教员就业汇总数据失败:', error);
      throw error;
    }
  },

  /**
   * 更新教员就业汇总数据
   * @param campus 神殿名称
   * @param summaryId 汇总ID
   * @param data 待更新字段
   */
  updateTeacherEmploymentSummary: updateTeacherEmploymentSummary,

  /**
   * 获取教员就业可用年份列表
   */
  getAvailableYears: async (campus: string): Promise<number[]> => {
    if (!campus) return [new Date().getFullYear()];
    try {
      const response = await apiService.get<number[]>('/teacher-employment-summary/available-years', {
        headers: {
          'X-Campus': btoa(encodeURIComponent(campus)),
        },
      });
      if (Array.isArray(response)) {
        return response;
      }
      return [new Date().getFullYear()];
    } catch (error) {
      console.error('获取教员就业年份列表失败:', error);
      return [new Date().getFullYear()];
    }
  },

  /**
   * 获取教员就业历史汇总数据
   */
  getHistoricalSummary: async (campus: string): Promise<any> => {
    if (!campus) {
      return {
        totalTeachers: 0,
        totalTargetEmployment: 0,
        totalActualEmployment: 0,
        avgTargetSalary: 0,
        avgActualSalary: 0,
        avgEmploymentRate: 0,
        avgAchievementRate: 0,
        totalHighSalary: 0,
      };
    }
    try {
      const response = await apiService.get<any>('/teacher-employment-summary/historical', {
        headers: {
          'X-Campus': btoa(encodeURIComponent(campus)),
        },
      });
      return response;
    } catch (error) {
      console.error('获取教员就业历史汇总数据失败:', error);
      return {
        totalTeachers: 0,
        totalTargetEmployment: 0,
        totalActualEmployment: 0,
        avgTargetSalary: 0,
        avgActualSalary: 0,
        avgEmploymentRate: 0,
        avgAchievementRate: 0,
        totalHighSalary: 0,
      };
    }
  },
};
