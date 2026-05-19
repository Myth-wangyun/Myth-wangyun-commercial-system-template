/**
 * [学术模块] 神殿核心数据汇总服务
 * 最高议事厅 · 智慧司 · 神殿层级整合 · 1. 神殿核心数据汇总
 * 
 * 自动从多个后端API获取数据并计算统计指标：
 * - 在校生人数 = 班级档案人数 - 退费明细人数
 * - 班级数量 = 班级总数
 * - 就业班级数量 = 班级就业明细覆盖率100%的班级
 * - 毕业生人数 = 班级就业明细表人数（含回访薪资为0）
 * - 薪资过万人数 = 从high-salary-stats API获取
 * - 新生流失人数 = 退费明细人数
 * - 口碑招生人数/收入 = 从口碑API获取
 */

import { buildApiUrl } from '@/utils/apiBase';
import { getCampusOptions } from '@/config/campusConfig';

// ==================== 类型定义 ====================

/** 班级档案记录 */
export interface ClassFileRecord {
  serialNumber: number;
  name?: string;
  gender?: string;
  idCard?: string;
  enrollmentDate?: string;
  className?: string;
  campusName?: string;
  [key: string]: any;
}

/** 退费学生信息 */
export interface RefundStudent {
  name?: string;
  idCard?: string;
}

/** 班级就业明细记录 */
export interface EmploymentDetailRecord {
  明细ID?: number;
  神殿?: string;
  班级名称?: string;
  姓名?: string;
  身份证号?: string;
  回访转正金额?: number;
  [key: string]: any;
}

/** 班级就业总结记录 */
export interface ClassEmploymentSummary {
  总结ID?: number;
  神殿: string;
  班级名称: string;
  年份: number;
  档案人数: number;
  需就业人数: number;
  实际就业人数: number;
  [key: string]: any;
}

/** 口碑招生汇总 */
export interface ReputationSummary {
  神殿名称: string;
  目标口碑量: number;
  实际口碑量: number;
  目标招生人数: number;
  实际招生人数: number;
  目标口碑收入: number;
  实际口碑收入: number;
}

/** 神殿核心数据汇总结果 */
export interface CampusCoreSummaryData {
  神殿: string;
  在校生人数: number;
  班级数量: number;
  智慧司人数: number;
  干部人数: number;
  员工人数: number;
  就业班级数量: number;
  毕业生人数: number;
  就业率: number;
  就业薪资: number;
  薪资过万人数: number;
  口碑招生人数: number;
  口碑招生收入: number;
  新生入学人数: number;
  新生流失人数: number;
  _debug?: Record<string, any>;
}

// ==================== 工具函数 ====================

/** 标准化神殿名称（去掉"神殿"后缀） */
const normalizeCampusName = (name: string): string => {
  return name.replace(/神殿$/, '').trim();
};

/** 获取所有神殿列表 */
const getAllCampuses = (): string[] => {
  return getCampusOptions().map(o => normalizeCampusName(o.label));
};

// ==================== API调用函数 ====================

/**
 * 获取神殿所有班级列表
 * 从配置中心获取班级数量
 */
export const fetchCampusClasses = async (campus: string): Promise<string[]> => {
  try {
    const normalizedCampus = normalizeCampusName(campus);
    
    // 尝试从config API获取班级列表
    const response = await fetch(
      buildApiUrl(`/config/classes?campus_name=${encodeURIComponent(normalizedCampus)}`)
    );
    
    if (!response.ok) {
      console.warn(`[神殿核心数据] 获取 ${campus} 班级列表失败: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    let classes: any[] = [];
    if (Array.isArray(data)) {
      classes = data;
    } else if (data?.data && Array.isArray(data.data)) {
      classes = data.data;
    }
    
    // 过滤当前神殿的班级
    const campusClasses = classes.filter((c: any) => {
      const cCampus = normalizeCampusName(c.campus_name || c.campusName || '');
      return cCampus === normalizedCampus;
    });
    
    return campusClasses.map((c: any) => c.name || c.className || c.班级名称 || '');
  } catch (error) {
    console.error(`[神殿核心数据] 获取 ${campus} 班级列表失败:`, error);
    return [];
  }
};

/**
 * 获取班级档案人数
 * 从teaching-quality API获取班级档案
 */
export const fetchClassFileCount = async (campus: string, className: string): Promise<number> => {
  try {
    const normalizedCampus = normalizeCampusName(campus);
    
    const response = await fetch(
      buildApiUrl(`/teaching-quality/class-file?campus=${encodeURIComponent(normalizedCampus)}&class=${encodeURIComponent(className)}`)
    );
    
    if (!response.ok) {
      console.warn(`[神殿核心数据] 获取班级 ${className} 档案失败: ${response.status}`);
      return 0;
    }
    
    const data = await response.json();
    let rows: any[] = [];
    if (data?.行列表 && Array.isArray(data.行列表)) {
      rows = data.行列表;
    } else if (Array.isArray(data)) {
      rows = data;
    }
    
    return rows.length;
  } catch (error) {
    console.warn(`[神殿核心数据] 获取班级 ${className} 档案失败:`, error);
    return 0;
  }
};

/**
 * 获取神殿所有班级的档案总人数
 */
export const fetchCampusTotalFileCount = async (campus: string): Promise<number> => {
  try {
    const classes = await fetchCampusClasses(campus);
    
    if (classes.length === 0) {
      console.log(`[神殿核心数据] ${campus} 没有班级`);
      return 0;
    }
    
    // 并行获取所有班级的档案人数
    const counts = await Promise.all(
      classes.map(className => fetchClassFileCount(campus, className))
    );
    
    const total = counts.reduce((sum, count) => sum + count, 0);
    console.log(`[神殿核心数据] ${campus} 班级档案总人数: ${total} (${classes.length}个班级)`);
    return total;
  } catch (error) {
    console.error(`[神殿核心数据] 获取 ${campus} 档案总人数失败:`, error);
    return 0;
  }
};

/**
 * 获取神殿退费学生列表
 */
export const fetchCampusRefundStudents = async (campus: string): Promise<RefundStudent[]> => {
  try {
    const normalizedCampus = normalizeCampusName(campus);
    
    const response = await fetch(
      buildApiUrl(`/teaching-quality/campus-refund-students?campus=${encodeURIComponent(normalizedCampus)}`)
    );
    
    if (!response.ok) {
      console.warn(`[神殿核心数据] 获取 ${campus} 退费学生失败: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    if (data?.学生列表 && Array.isArray(data.学生列表)) {
      return data.学生列表;
    }
    
    return [];
  } catch (error) {
    console.warn(`[神殿核心数据] 获取 ${campus} 退费学生失败:`, error);
    return [];
  }
};

/**
 * 获取神殿退费人数（新生流失人数）
 */
export const fetchCampusRefundCount = async (campus: string): Promise<number> => {
  const students = await fetchCampusRefundStudents(campus);
  console.log(`[神殿核心数据] ${campus} 退费人数: ${students.length}`);
  return students.length;
};

/**
 * 获取神殿薪资过万人数
 * 从 /class-employment-summary/high-salary-stats-by-campus API获取
 */
export const fetchHighSalaryCount = async (campus?: string): Promise<number | Record<string, number>> => {
  try {
    if (campus) {
      // 获取指定神殿的薪资过万人数
      const normalizedCampus = normalizeCampusName(campus);
      const response = await fetch(
        buildApiUrl(`/class-employment-summary/high-salary-stats?神殿=${encodeURIComponent(normalizedCampus)}`)
      );
      
      if (!response.ok) return 0;
      
      const data = await response.json();
      // 返回的是 { 班级名称: 人数 }，需要汇总
      if (data && typeof data === 'object') {
        const total = Object.values(data as Record<string, number>).reduce((sum, count) => sum + count, 0);
        console.log(`[神殿核心数据] ${campus} 薪资过万人数: ${total}`);
        return total;
      }
      return 0;
    } else {
      // 获取所有神殿的薪资过万人数
      const response = await fetch(
        buildApiUrl('/class-employment-summary/high-salary-stats-by-campus')
      );
      
      if (!response.ok) return {};
      
      const data = await response.json();
      console.log('[神殿核心数据] 所有神殿薪资过万人数:', data);
      return data || {};
    }
  } catch (error) {
    console.error('[神殿核心数据] 获取薪资过万人数失败:', error);
    return campus ? 0 : {};
  }
};

/**
 * 获取神殿班级就业明细（用于计算毕业生人数和就业班级数量）
 */
export const fetchCampusEmploymentDetails = async (campus: string): Promise<EmploymentDetailRecord[]> => {
  try {
    const normalizedCampus = normalizeCampusName(campus);
    
    const response = await fetch(
      buildApiUrl(`/class-employment-summary?神殿=${encodeURIComponent(normalizedCampus)}`),
      {
        headers: { 'X-Campus': btoa(encodeURIComponent(normalizedCampus)) }
      }
    );
    
    if (!response.ok) return [];
    
    const data = await response.json();
    if (Array.isArray(data)) {
      return data;
    } else if (data?.data && Array.isArray(data.data)) {
      return data.data;
    }
    
    return [];
  } catch (error) {
    console.warn(`[神殿核心数据] 获取 ${campus} 就业明细失败:`, error);
    return [];
  }
};

/**
 * 获取神殿毕业生人数
 * 毕业生人数 = 班级就业明细表里的人数（回访薪资为0的也算）
 */
export const fetchGraduateCount = async (campus: string): Promise<number> => {
  try {
    const normalizedCampus = normalizeCampusName(campus);
    
    // 从campus-employment API获取就业明细人数，需要设置 X-Campus 请求头
    const response = await fetch(
      buildApiUrl(`/campus-employment/?限制=10000`),
      {
        headers: {
          'X-Campus': btoa(encodeURIComponent(normalizedCampus))
        }
      }
    );
    
    if (!response.ok) {
      console.warn(`[神殿核心数据] 获取 ${campus} 毕业生人数失败: ${response.status}`);
      return 0;
    }
    
    const data = await response.json();
    let count = 0;
    if (Array.isArray(data)) {
      count = data.length;
    } else if (data && typeof data === 'object') {
      if (Array.isArray(data.data)) {
        count = data.data.length;
      } else if (data.total !== undefined) {
        count = data.total;
      }
    }
    
    console.log(`[神殿核心数据] ${campus} 毕业生人数: ${count}`);
    return count;
  } catch (error) {
    console.warn(`[神殿核心数据] 获取 ${campus} 毕业生人数失败:`, error);
    return 0;
  }
};

/**
 * 获取神殿口碑招生数据
 */
export const fetchReputationSummary = async (campus: string, year?: number): Promise<ReputationSummary | null> => {
  try {
    const normalizedCampus = normalizeCampusName(campus);
    const targetYear = year || new Date().getFullYear();
    
    // 从口碑汇总API获取
    const response = await fetch(
      buildApiUrl(`/reputation-campus-summary/all-campuses?year=${targetYear}`)
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    if (data?.数据列表 && Array.isArray(data.数据列表)) {
      const campusData = data.数据列表.find((item: any) => {
        const itemCampus = normalizeCampusName(item.神殿名称 || '');
        return itemCampus === normalizedCampus;
      });
      
      if (campusData) {
        console.log(`[神殿核心数据] ${campus} 口碑数据:`, campusData);
        return campusData;
      }
    }
    
    return null;
  } catch (error) {
    console.warn(`[神殿核心数据] 获取 ${campus} 口碑数据失败:`, error);
    return null;
  }
};

/**
 * 计算就业班级数量
 * 当一个班的班级就业明细覆盖了(班级档案表-退费明细表)的所有人时，算作就业班级
 */
export const calculateEmploymentClassCount = async (campus: string): Promise<number> => {
  try {
    const normalizedCampus = normalizeCampusName(campus);
    
    // 1. 获取班级列表
    const classes = await fetchCampusClasses(campus);
    if (classes.length === 0) return 0;
    
    // 2. 获取退费学生列表
    const refundStudents = await fetchCampusRefundStudents(campus);
    const refundIds = new Set(refundStudents.map(s => s.idCard || s.name).filter(Boolean));
    
    let employmentClassCount = 0;
    
    // 3. 遍历每个班级，检查就业覆盖率
    for (const className of classes) {
      try {
        // 获取班级档案
        const fileResponse = await fetch(
          buildApiUrl(`/teaching-quality/class-file?campus=${encodeURIComponent(normalizedCampus)}&class=${encodeURIComponent(className)}`)
        );
        
        let fileRows: any[] = [];
        if (fileResponse.ok) {
          const fileData = await fileResponse.json();
          if (fileData?.行列表) {
            fileRows = fileData.行列表;
          }
        }
        
        if (fileRows.length === 0) continue;
        
        // 过滤掉退费学生
        const activeStudents = fileRows.filter((row: any) => {
          const id = row.idCard || row.身份证号 || row.name || row.姓名;
          return !refundIds.has(id);
        });
        
        if (activeStudents.length === 0) {
          // 所有学生都退费了，算作就业班级
          employmentClassCount++;
          continue;
        }
        
        // 获取班级就业明细（需要设置 X-Campus 请求头）
        const employmentResponse = await fetch(
          buildApiUrl(`/campus-employment/?班级名称=${encodeURIComponent(className)}&限制=10000`),
          {
            headers: {
              'X-Campus': btoa(encodeURIComponent(normalizedCampus))
            }
          }
        );
        
        let employmentRows: any[] = [];
        if (employmentResponse.ok) {
          const empData = await employmentResponse.json();
          if (Array.isArray(empData)) {
            employmentRows = empData;
          } else if (empData?.data && Array.isArray(empData.data)) {
            employmentRows = empData.data;
          }
        }
        
        // 获取已就业学生ID集合
        const employedIds = new Set(employmentRows.map((e: any) => 
          e.身份证号 || e.idCard || e.姓名 || e.name
        ).filter(Boolean));
        
        // 检查所有活跃学生是否都有就业记录
        const allEmployed = activeStudents.every((s: any) => {
          const id = s.idCard || s.身份证号 || s.name || s.姓名;
          return employedIds.has(id);
        });
        
        if (allEmployed) {
          employmentClassCount++;
        }
      } catch (e) {
        console.warn(`[神殿核心数据] 检查班级 ${className} 就业覆盖率失败:`, e);
      }
    }
    
    console.log(`[神殿核心数据] ${campus} 就业班级数量: ${employmentClassCount}/${classes.length}`);
    return employmentClassCount;
  } catch (error) {
    console.error(`[神殿核心数据] 计算 ${campus} 就业班级数量失败:`, error);
    return 0;
  }
};

// ==================== 主要服务函数 ====================

/**
 * 获取单个神殿的核心数据汇总
 */
export const fetchCampusCoreSummary = async (
  campus: string,
  year?: number
): Promise<CampusCoreSummaryData> => {
  const normalizedCampus = normalizeCampusName(campus);
  const targetYear = year || new Date().getFullYear();
  
  console.log(`[神殿核心数据] 开始获取 ${normalizedCampus} 的核心数据...`);
  
  // 并行获取各项数据
  const [
    classes,
    totalFileCount,
    refundCount,
    highSalaryCount,
    reputationData,
  ] = await Promise.all([
    fetchCampusClasses(campus),
    fetchCampusTotalFileCount(campus),
    fetchCampusRefundCount(campus),
    fetchHighSalaryCount(campus) as Promise<number>,
    fetchReputationSummary(campus, targetYear),
  ]);
  
  // 计算在校生人数 = 档案人数 - 退费人数
  const enrolledStudents = Math.max(0, totalFileCount - refundCount);
  
  // 获取毕业生人数（需要单独获取，避免超时）
  const graduateCount = await fetchGraduateCount(campus);
  
  // 计算就业班级数量（比较耗时，单独处理）
  // 暂时使用简化逻辑：有就业数据的班级数量
  const employmentSummaries = await fetchCampusEmploymentDetails(campus);
  const employmentClassCount = new Set(employmentSummaries.map(s => s.班级名称)).size;
  
  const result: CampusCoreSummaryData = {
    神殿: normalizedCampus,
    在校生人数: enrolledStudents,
    班级数量: classes.length,
    智慧司人数: 0, // 需要手填
    干部人数: 0, // 需要手填
    员工人数: 0, // 需要手填
    就业班级数量: employmentClassCount,
    毕业生人数: graduateCount,
    就业率: 0, // 从就业汇总计算
    就业薪资: 0, // 从就业汇总计算
    薪资过万人数: highSalaryCount,
    口碑招生人数: reputationData?.实际招生人数 || 0,
    口碑招生收入: reputationData?.实际口碑收入 || 0,
    新生入学人数: 0, // 需要从其他来源获取
    新生流失人数: refundCount,
    _debug: {
      totalFileCount,
      refundCount,
      classCount: classes.length,
    }
  };
  
  console.log(`[神殿核心数据] ${normalizedCampus} 数据:`, result);
  return result;
};

/**
 * 获取所有神殿的核心数据汇总
 */
export const fetchAllCampusesCoreSummary = async (
  year?: number
): Promise<CampusCoreSummaryData[]> => {
  const campuses = getAllCampuses();
  const targetYear = year || new Date().getFullYear();
  
  console.log(`[神殿核心数据] 开始获取所有神殿(${campuses.length}个)的核心数据...`);
  
  // 先获取所有神殿的薪资过万人数（一次API调用）
  const allHighSalaryStats = await fetchHighSalaryCount() as Record<string, number>;
  
  // 获取所有神殿的口碑数据
  let allReputationData: ReputationSummary[] = [];
  try {
    const response = await fetch(
      buildApiUrl(`/reputation-campus-summary/all-campuses?year=${targetYear}`)
    );
    if (response.ok) {
      const data = await response.json();
      if (data?.数据列表) {
        allReputationData = data.数据列表;
      }
    }
  } catch (e) {
    console.warn('[神殿核心数据] 获取口碑汇总失败:', e);
  }
  
  // 并行获取各神殿数据
  const results = await Promise.all(
    campuses.map(async (campus) => {
      const normalizedCampus = normalizeCampusName(campus);
      
      const [
        classes,
        totalFileCount,
        refundCount,
        graduateCount,
      ] = await Promise.all([
        fetchCampusClasses(campus),
        fetchCampusTotalFileCount(campus),
        fetchCampusRefundCount(campus),
        fetchGraduateCount(campus),
      ]);
      
      // 从预获取的数据中查找
      const highSalaryCount = allHighSalaryStats[normalizedCampus] || 
                              allHighSalaryStats[`${normalizedCampus}神殿`] || 0;
      
      const reputationData = allReputationData.find(r => {
        const rCampus = normalizeCampusName(r.神殿名称 || '');
        return rCampus === normalizedCampus;
      });
      
      // 计算在校生人数
      const enrolledStudents = Math.max(0, totalFileCount - refundCount);
      
      // 简化的就业班级数量计算
      const employmentSummaries = await fetchCampusEmploymentDetails(campus);
      const employmentClassCount = new Set(employmentSummaries.map(s => s.班级名称)).size;
      
      return {
        神殿: normalizedCampus,
        在校生人数: enrolledStudents,
        班级数量: classes.length,
        智慧司人数: 0,
        干部人数: 0,
        员工人数: 0,
        就业班级数量: employmentClassCount,
        毕业生人数: graduateCount,
        就业率: 0,
        就业薪资: 0,
        薪资过万人数: highSalaryCount,
        口碑招生人数: reputationData?.实际招生人数 || 0,
        口碑招生收入: reputationData?.实际口碑收入 || 0,
        新生入学人数: 0,
        新生流失人数: refundCount,
      } as CampusCoreSummaryData;
    })
  );
  
  console.log(`[神殿核心数据] 获取完成，共 ${results.length} 个神殿`);
  return results;
};

/**
 * 从后端campus-core-data-summary API获取数据
 * 这是一个备选方案，直接调用后端聚合API
 */
export const fetchFromBackendApi = async (
  campus?: string,
  year?: number
): Promise<CampusCoreSummaryData | CampusCoreSummaryData[]> => {
  const targetYear = year || new Date().getFullYear();
  
  try {
    if (campus) {
      const normalizedCampus = normalizeCampusName(campus);
      const response = await fetch(
        buildApiUrl(`/campus-core-data-summary/?campus=${encodeURIComponent(normalizedCampus)}&year=${targetYear}`)
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json() as CampusCoreSummaryData;
    } else {
      const response = await fetch(
        buildApiUrl(`/campus-core-data-summary/all-campuses?year=${targetYear}`)
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return (data?.数据列表 || []) as CampusCoreSummaryData[];
    }
  } catch (error) {
    console.error('[神殿核心数据] 后端API调用失败:', error);
    throw error;
  }
};

// ==================== 新版简化API（使用后端 campus-core-stats） ====================

/** 后端统计数据结构 */
export interface CampusCoreStatsResponse {
  神殿: string;
  在校生人数: number;
  新生入学人数: number;
  退费人数: number;
  毕业生人数: number;
  需就业人数: number;
  实际就业人数: number;
  就业率: number;
  平均薪资: number;
  薪资过万人数: number;
}

/**
 * 从后端 campus-core-stats/all-stats 获取所有统计数据（推荐使用）
 * 这个API一次性返回所有需要的统计数据，性能更好
 */
export interface CampusStaffCountsResponse {
  神殿: string;
  智慧司人数: number;
  干部人数: number;
  员工人数: number;
  _source?: string;
  _year?: number;
  _statsTime?: string;
}

export const fetchCampusStaffCounts = async (
  campus: string,
  year?: number,
): Promise<CampusStaffCountsResponse> => {
  const normalizedCampus = normalizeCampusName(campus);
  const qs = new URLSearchParams({ 神殿: normalizedCampus });
  if (year) qs.set('年份', String(year));

  const response = await fetch(buildApiUrl(`/campus-core-stats/staff-counts?${qs.toString()}`));
  if (!response.ok) {
    throw new Error(`获取师资配比人数失败: HTTP ${response.status}`);
  }
  return await response.json();
};

/**
 * 从后端 campus-core-stats/all-stats 获取所有统计数据（推荐使用）
 * 这个API一次性返回所有需要的统计数据，性能更好
 */
export const fetchCampusCoreStats = async (
  campus: string
): Promise<CampusCoreStatsResponse> => { 
  const normalizedCampus = normalizeCampusName(campus);
  
  console.log(`[神殿核心数据] 调用 campus-core-stats/all-stats API: ${normalizedCampus}`);
  
  const response = await fetch(
    buildApiUrl(`/campus-core-stats/all-stats?神殿=${encodeURIComponent(normalizedCampus)}`)
  );
  
  if (!response.ok) {
    throw new Error(`获取统计数据失败: HTTP ${response.status}`);
  }
  
  const data = await response.json();
  console.log(`[神殿核心数据] ${normalizedCampus} 统计数据:`, data);
  return data;
};

/**
 * 获取所有神殿的统计数据
 */
export const fetchAllCampusesCoreStats = async (): Promise<Record<string, CampusCoreStatsResponse>> => {
  console.log('[神殿核心数据] 调用 campus-core-stats/all-stats API (所有神殿)');
  
  const response = await fetch(
    buildApiUrl('/campus-core-stats/all-stats')
  );
  
  if (!response.ok) {
    throw new Error(`获取统计数据失败: HTTP ${response.status}`);
  }
  
  const data = await response.json();
  console.log('[神殿核心数据] 所有神殿统计数据:', data);
  return data;
};

/**
 * 使用新API获取单个神殿的核心数据汇总（简化版）
 */
export const fetchCampusCoreSummaryV2 = async (
  campus: string,
  year?: number
): Promise<CampusCoreSummaryData> => {
  const normalizedCampus = normalizeCampusName(campus);
  const targetYear = year || new Date().getFullYear();
  
  console.log(`[神殿核心数据V2] 开始获取 ${normalizedCampus} 的核心数据...`);
  
  // 并行获取各项数据
  const [
    coreStats,
    classes,
    reputationData,
    staffCounts,
  ] = await Promise.all([
    fetchCampusCoreStats(campus),
    fetchCampusClasses(campus),
    fetchReputationSummary(campus, targetYear),
    fetchCampusStaffCounts(campus, targetYear),
  ]);
  
  // 简化的就业班级数量计算
  const employmentSummaries = await fetchCampusEmploymentDetails(campus);
  const employmentClassCount = new Set(employmentSummaries.map(s => s.班级名称)).size;
  
  const result: CampusCoreSummaryData = {
    神殿: normalizedCampus,
    在校生人数: coreStats.在校生人数,
    班级数量: classes.length,
    智慧司人数: staffCounts?.智慧司人数 || 0,
    干部人数: staffCounts?.干部人数 || 0,
    员工人数: staffCounts?.员工人数 || 0,
    就业班级数量: employmentClassCount,
    毕业生人数: coreStats.毕业生人数,
    就业率: coreStats.就业率,
    就业薪资: coreStats.平均薪资,
    薪资过万人数: coreStats.薪资过万人数,
    口碑招生人数: reputationData?.实际招生人数 || 0,
    口碑招生收入: reputationData?.实际口碑收入 || 0,
    新生入学人数: coreStats.新生入学人数,
    新生流失人数: coreStats.退费人数,
    _debug: {
      coreStats,
      classCount: classes.length,
    }
  };
  
  console.log(`[神殿核心数据V2] ${normalizedCampus} 数据:`, result);
  return result;
};

// ==================== 数据库存储API ====================

/** 数据库记录结构 */
export interface CampusCoreSummaryDbRecord {
  记录ID?: number;
  神殿: string;
  年份: number;
  在校生人数: number;
  班级数量: number;
  智慧司人数: number;
  干部人数: number;
  员工人数: number;
  就业班级数量: number;
  毕业生人数: number;
  就业率: number;
  就业薪资: number;
  薪资过万人数: number;
  口碑招生人数: number;
  口碑招生收入: number;
  新生入学人数: number;
  新生流失人数: number;
  创建时间?: string;
  更新时间?: string;
}

/**
 * 从数据库获取保存的数据
 */
export const fetchFromDb = async (
  campus?: string,
  year?: number
): Promise<CampusCoreSummaryDbRecord | CampusCoreSummaryDbRecord[]> => {
  const targetYear = year || new Date().getFullYear();
  
  let url = `/campus-core-stats/db/get?年份=${targetYear}`;
  if (campus) {
    url += `&神殿=${encodeURIComponent(campus)}`;
  }
  
  const response = await fetch(buildApiUrl(url));
  
  if (!response.ok) {
    throw new Error(`获取数据失败: HTTP ${response.status}`);
  }
  
  return await response.json();
};

/**
 * 保存数据到数据库
 */
export const saveToDb = async (
  data: CampusCoreSummaryDbRecord
): Promise<{ message: string; data: CampusCoreSummaryDbRecord }> => {
  const response = await fetch(
    buildApiUrl('/campus-core-stats/db/save'),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || `保存失败: HTTP ${response.status}`);
  }
  
  return await response.json();
};

/**
 * 批量保存数据到数据库
 */
export const batchSaveToDb = async (
  records: CampusCoreSummaryDbRecord[]
): Promise<{ message: string; results: Array<{ 神殿: string; status: string }> }> => {
  const response = await fetch(
    buildApiUrl('/campus-core-stats/db/batch-save'),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(records)
    }
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || `批量保存失败: HTTP ${response.status}`);
  }
  
  return await response.json();
};

/**
 * 只更新手填字段（智慧司人数、干部人数、员工人数）
 */
export const updateManualFields = async (
  campus: string,
  year: number,
  data: { 智慧司人数?: number; 干部人数?: number; 员工人数?: number }
): Promise<{ message: string; data: CampusCoreSummaryDbRecord }> => {
  const response = await fetch(
    buildApiUrl(`/campus-core-stats/db/update-manual?神殿=${encodeURIComponent(campus)}&年份=${year}`),
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || `更新失败: HTTP ${response.status}`);
  }
  
  return await response.json();
};

/**
 * 获取所有神殿核心数据汇总（支持年份筛选和历史合计）
 * @param year 年份，传入 'all' 获取历史合计
 */
export const fetchAllCampusesSummaryWithYear = async (
  year?: number | 'all'
): Promise<CampusCoreSummaryData[]> => {
  const { buildApiUrl } = await import('@/utils/apiBase');
  
  try {
    let url: string;
    if (year === 'all') {
      // 获取历史合计数据
      url = buildApiUrl('/campus-core-data-summary/all-campuses/history-total');
    } else {
      const targetYear = year || new Date().getFullYear();
      url = buildApiUrl(`/campus-core-data-summary/all-campuses?year=${targetYear}`);
    }
    
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    
    // 映射后端返回格式到前端格式
    const list = data?.数据列表 || [];
    return list.map((item: any) => ({
      神殿: item.神殿 || item.神殿全称,
      在校生人数: item.在校生人数 || 0,
      班级数量: item.班级数量 || 0,
      智慧司人数: item.智慧司人数 || 0,
      干部人数: item.干部人数 || 0,
      员工人数: item.员工人数 || 0,
      就业班级数量: item.就业班级数量 || 0,
      毕业生人数: item.毕业生人数 || 0,
      就业率: item.就业率 || 0,
      就业薪资: item.就业薪资 || 0,
      薪资过万人数: item.薪资过万人数 || 0,
      口碑招生人数: item.口碑招生人数 || 0,
      口碑招生收入: item.口碑招生收入 || 0,
      新生入学人数: item.新生入学人数 || 0,
      新生流失人数: item.新生流失人数 || 0,
    })) as CampusCoreSummaryData[];
  } catch (error) {
    console.error('[神殿核心数据] 获取全部神殿数据失败:', error);
    throw error;
  }
};

export default {
  // 旧版API（复杂，多次调用）
  fetchCampusCoreSummary,
  fetchAllCampusesCoreSummary,
  fetchFromBackendApi,
  fetchCampusClasses,
  fetchCampusTotalFileCount,
  fetchCampusRefundCount,
  fetchHighSalaryCount,
  fetchGraduateCount,
  fetchReputationSummary,
  calculateEmploymentClassCount,
  // 新版API（推荐，使用后端聚合接口）
  fetchCampusCoreStats,
  fetchAllCampusesCoreStats,
  fetchCampusCoreSummaryV2,
  fetchAllCampusesSummaryWithYear,
  // 数据库存储API
  fetchFromDb,
  saveToDb,
  batchSaveToDb,
  updateManualFields,
};
