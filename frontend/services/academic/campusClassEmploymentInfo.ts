// [教质模块] 神殿班级就业信息服务

import {
  type CampusClassEmploymentInfo,
  type ClassInfo,
  type CampusClassList,
} from '../../types/campusClassEmploymentInfo';
import { apiService } from '../api';
import {
  getCampusClassList as getCampusClassListFromConfig,
  getClassInfo as getClassInfoFromConfig,
  getCampusCodeByName,
  getAllCampusNames,
} from '../../config/campusConfig';

// =======================
// 班级列表 / 班级信息
// =======================

// 从配置文件读取神殿班级列表
export const getCampusClassList = (): CampusClassList[] => {
  return getCampusClassListFromConfig();
};

// 直接使用神殿名称，不需要映射
// 现在数据库直接使用神殿名称作为标识
const getCampusName = (campusName: string): string => {
  // 直接返回神殿名称，数据库中的campus_name字段就是神殿名称
  return campusName;
};

// 将后端班级数据转换为前端 ClassInfo 格式
const mapClassResponse = (cls: any, campusName: string): ClassInfo => {
  const endDate = cls.end_date;
  const graduationTime = endDate 
    ? new Date(endDate).toISOString().slice(0, 7) // 格式化为 YYYY-MM
    : '';
  
  return {
    id: cls.id?.toString() || cls.class_code || '',
    name: cls.class_name || cls.name || '',
    campus: campusName,
    major: cls.major?.name || cls.major_name || '',
    instructor: cls.instructor?.name || cls.instructor_name || '',
    classAdvisor: cls.homeroom_teacher?.name || cls.homeroom_teacher_name || '',
    graduationTime: graduationTime,
    programLength: cls.program_length || '',  // 学制
  };
};

// 解析API响应数据
const parseClassResponse = (response: any): any[] => {
  if (Array.isArray(response)) {
    return response;
  } else if (response && typeof response === 'object' && Array.isArray(response.data)) {
    return response.data;
  }
  return [];
};

/**
 * 获取单个神殿的班级列表（优化版本）
 * 只发送一个请求，适用于只需要当前神殿班级的场景
 */
export const fetchClassListByCampus = async (campusName: string): Promise<ClassInfo[]> => {
  try {
    console.log(`[班级列表] 开始获取 ${campusName} 的班级列表...`);
    
    const response = await apiService.get<any>('/config/classes', {
      params: {
        campus_name: campusName,
      },
    });

    const responseData = parseClassResponse(response);
    const classes = responseData.map((cls: any) => mapClassResponse(cls, campusName));

    console.log(`[班级列表] ✅ ${campusName} 获取到 ${classes.length} 个班级:`, classes.map(c => c.name));
    return classes;
  } catch (error: any) {
    console.error(`[班级列表] ❌ 获取 ${campusName} 班级列表失败:`, error?.message);
    throw error;
  }
};

// 从后端API获取所有神殿的班级列表（并行请求优化版）
export const fetchCampusClassList = async (): Promise<CampusClassList[]> => {
  try {
    // 获取所有神殿名称（从配置获取）
    const allCampuses = getAllCampusNames();
    console.log('[班级列表] 开始并行获取所有神殿的班级列表，神殿列表:', allCampuses);

    // 并行获取所有神殿的班级列表
    const results = await Promise.allSettled(
      allCampuses.map(async (campusName): Promise<CampusClassList> => {
        const classes = await fetchClassListByCampus(campusName);
        return { campus: campusName, classes };
      })
    );

    // 处理结果，只保留成功的
    const campusClassList: CampusClassList[] = results
      .filter((result): result is PromiseFulfilledResult<CampusClassList> => 
        result.status === 'fulfilled' && result.value.classes.length > 0
      )
      .map(result => result.value);

    console.log('[班级列表] 并行获取完成:', {
      totalCampuses: allCampuses.length,
      successCount: campusClassList.length,
      totalClasses: campusClassList.reduce((sum, item) => sum + item.classes.length, 0),
    });

    return campusClassList;
  } catch (error) {
    console.error('[班级列表] 获取班级列表失败，回退到配置:', error);
    return getCampusClassListFromConfig();
  }
};

// 从配置获取某个班级信息
export const getClassInfo = (
  campus: string,
  className: string,
): ClassInfo | null => {
  const classInfo = getClassInfoFromConfig(campus, className);
  if (!classInfo) return null;
  // 确保带上 campus 字段
  return {
    ...classInfo,
    campus,
  };
};

// =======================
// 就业信息 CRUD - 使用后端API
// =======================

// 字段映射：前端字段 -> 后端字段
const mapToBackend = (data: Partial<CampusClassEmploymentInfo>): any => {
  // 处理日期格式：确保是 YYYY-MM-DD 格式的字符串
  let 入职时间: string | undefined = undefined;
  if (data.startDate) {
    const startDateValue = data.startDate as any;
    // 如果是 Date 对象，转换为字符串
    if (startDateValue instanceof Date) {
      入职时间 = startDateValue.toISOString().split('T')[0];
    } else if (typeof startDateValue === 'string') {
      // 如果是字符串，确保格式正确
      if (startDateValue.includes('T')) {
        入职时间 = startDateValue.split('T')[0];
      } else {
        入职时间 = startDateValue;
      }
    } else {
      // 其他类型，尝试转换为字符串
      入职时间 = String(startDateValue).split('T')[0];
    }
  }
  
  return {
    序号: data.serialNumber,
    姓名: data.name,
    性别: data.gender,
    年龄: data.age,
    所报专业: data.majorApplied,
    学历: data.educationLevel,
    专业: data.major,
    毕业学校: data.graduatedSchool,
    目前所获最高学历证书及性质: data.highestDegreeCertificate,
    联系电话: data.contactPhone,
    通信地址: data.mailingAddress,
    入职时间: 入职时间, // 确保是字符串格式
    就业地区: data.employmentRegion,
    就业单位: data.employer,
    就业岗位: data.jobPosition,
    试用期薪资: data.probationarySalary,
    转正金额: data.regularSalary, // 转正金额（数字）
    转正薪资: data.regularSalaryText ?? (data.regularSalary !== undefined ? String(data.regularSalary) : undefined), // 转正薪资（字符串，可选）
    回访入职公司: data.followUpCompany,
    回访转正金额: data.followUpAssessmentSalary,
    班级名称: data.className,
  };
};

// 字段映射：后端字段 -> 前端字段
const mapFromBackend = (data: any): CampusClassEmploymentInfo => {
  // 处理可能的响应格式：可能是 {success, data} 或直接是数据对象
  const actualData = data?.data || data;
  
  if (!actualData) {
    console.error('[就业信息] mapFromBackend 收到空数据:', data);
    throw new Error('后端返回的数据为空');
  }
  
  console.log('[就业信息] mapFromBackend 处理数据:', actualData);
  
  return {
    id: actualData.明细ID?.toString() || actualData.id || '',
    serialNumber: actualData.序号 || actualData.serialNumber || 0,
    name: actualData.姓名 || actualData.name || '',
    gender: actualData.性别 || actualData.gender || '',
    age: actualData.年龄 || actualData.age || 0,
    majorApplied: actualData.所报专业 || actualData.majorApplied || '',
    educationLevel: actualData.学历 || actualData.educationLevel || '',
    major: actualData.专业 || actualData.major || '',
    graduatedSchool: actualData.毕业学校 || actualData.graduatedSchool || '',
    highestDegreeCertificate: actualData.目前所获最高学历证书及性质 || actualData.highestDegreeCertificate || '',
    contactPhone: actualData.联系电话 || actualData.contactPhone || '',
    mailingAddress: actualData.通信地址 || actualData.mailingAddress || '',
    startDate: actualData.入职时间 || actualData.startDate || '',
    employmentRegion: actualData.就业地区 || actualData.employmentRegion || '',
    employer: actualData.就业单位 || actualData.employer || '',
    jobPosition: actualData.就业岗位 || actualData.jobPosition || '',
    probationarySalary: actualData.试用期薪资 ? Number(actualData.试用期薪资) : (actualData.probationarySalary || 0),
    regularSalaryText: actualData.转正薪资 || actualData.regularSalaryText || '',
    regularSalary: actualData.转正金额 ? Number(actualData.转正金额) : (actualData.regularSalary || 0),
    followUpCompany: actualData.回访入职公司 || actualData.followUpCompany || '',
    // 回访转正金额：优先使用后端返回的"回访转正金额"字段，支持多种字段名
    followUpAssessmentSalary: (() => {
      // 尝试多种可能的字段名
      const value = actualData.回访转正金额 ?? 
                    actualData['回访转正金额'] ?? 
                    actualData.followUpAssessmentSalary ?? 
                    actualData.follow_up_assessment_salary;
      
      if (value !== undefined && value !== null && value !== '') {
        const numValue = Number(value);
        // 如果转换成功且不是NaN，返回该值；否则返回0
        return isNaN(numValue) ? 0 : numValue;
      }
      return 0;
    })(),
    campus: actualData.神殿 || actualData.campus || '',
    className: actualData.班级名称 || actualData.className || '',
  };
};

// 获取指定神殿和班级的就业信息
export const getCampusClassEmploymentInfo = async (
  campus: string,
  className: string,
): Promise<CampusClassEmploymentInfo[]> => {
  try {
    const response = await apiService.get<any[]>('/campus-employment', {
      params: {
        班级名称: className,
        限制: 1000, // 获取足够多的记录
      },
      headers: {
        'X-Campus': btoa(encodeURIComponent(campus)),
      },
    });

    // apiService.get 返回的是 response.data，如果后端直接返回数组，response 就是数组本身
    // 如果后端返回 {success, data}，response 就是 {success, data}，需要取 response.data
    let data: any[] = [];
    if (Array.isArray(response)) {
      data = response;
    } else if (response && typeof response === 'object') {
      data = (response as any).data || (response as any) || [];
    }
    
    console.log('[就业信息] getCampusClassEmploymentInfo 响应:', {
      campus,
      className,
      response,
      data,
      dataLength: data.length
    });
    
    return data.map(mapFromBackend);
  } catch (error) {
    console.error('获取就业信息失败:', error);
    return [];
  }
};

// 从班级就业明细表后端获取指定神殿的所有班级名称列表
export const fetchClassNamesFromEmploymentTable = async (campus: string): Promise<string[]> => {
  try {
    console.log(`[班级列表] 从就业明细表获取 ${campus} 的班级列表...`);
    const response = await apiService.get<any[]>('/campus-employment', {
      params: {
        // 不传班级名称参数，获取所有数据
        限制: 10000, // 获取足够多的记录以包含所有班级
      },
      headers: {
        'X-Campus': btoa(encodeURIComponent(campus)),
      },
    });

    // 处理响应数据
    let data: any[] = [];
    if (Array.isArray(response)) {
      data = response;
    } else if (response && typeof response === 'object') {
      data = (response as any).data || (response as any) || [];
    }

    // 提取唯一的班级名称
    const classNames = new Set<string>();
    data.forEach((item: any) => {
      const className = item.班级名称 || item.className || '';
      if (className && className.trim()) {
        classNames.add(className.trim());
      }
    });

    const uniqueClassNames = Array.from(classNames);
    console.log(`[班级列表] 从就业明细表获取到 ${campus} 的 ${uniqueClassNames.length} 个班级:`, uniqueClassNames);
    return uniqueClassNames;
  } catch (error: any) {
    console.error(`[班级列表] 从就业明细表获取 ${campus} 班级列表失败:`, error?.message);
    return [];
  }
};

// 获取所有就业信息
export const getAllEmploymentInfo = async (): Promise<CampusClassEmploymentInfo[]> => {
  try {
    const response = await apiService.get<any[]>('/campus-employment', {
      params: {
        限制: 1000,
      },
    });

    // apiService.get 返回的是 response.data，如果后端直接返回数组，response 就是数组本身
    // 如果后端返回 {success, data}，response 就是 {success, data}，需要取 response.data
    let data: any[] = [];
    if (Array.isArray(response)) {
      data = response;
    } else if (response && typeof response === 'object') {
      data = (response as any).data || (response as any) || [];
    }
    
    console.log('[就业信息] getAllEmploymentInfo 响应:', {
      response,
      data,
      dataLength: data.length
    });
    
    return data.map(mapFromBackend);
  } catch (error) {
    console.error('获取所有就业信息失败:', error);
    return [];
  }
};

// 添加或更新就业信息
export const addOrUpdateEmploymentInfo = async (
  data: Partial<CampusClassEmploymentInfo> & { campus: string; className: string },
): Promise<CampusClassEmploymentInfo> => {
  const backendData = mapToBackend(data);
  
  try {
    let response: any;
    if (data.id) {
      // 更新 - 使用明细ID
      response = await apiService.put<any>(`/campus-employment/${data.id}`, backendData);
    } else {
      // 创建
      response = await apiService.post<any>('/campus-employment', backendData);
    }
    
    // apiService 返回的是 response.data，可能是 {success, data} 格式或直接是数据对象
    // 如果 response 有 data 属性且是对象，尝试解包
    const responseData = (response && typeof response === 'object' && 'data' in response && response.data) 
      ? response.data 
      : response;
    
    console.log('[就业信息] API 响应:', response, '解包后:', responseData);
    
    return mapFromBackend(responseData);
  } catch (error) {
    console.error('保存就业信息失败:', error);
    throw error;
  }
};

// 删除就业信息
export const deleteEmploymentInfo = async (id: string): Promise<void> => {
  try {
    await apiService.delete(`/campus-employment/${id}`);
  } catch (error) {
    console.error('删除就业信息失败:', error);
    throw error;
  }
};

// 从教化司的班级就业信息表获取数据
// 用于智慧司页面展示教化司维护的就业数据
export const getEmploymentInfoFromTeachingQuality = async (
  campus: string,
  className: string,
  year?: number,
): Promise<CampusClassEmploymentInfo[]> => {
  try {
    const campusName = campus.endsWith('神殿') ? campus.slice(0, -2) : campus;
    const currentYear = year || new Date().getFullYear();
    
    console.log('[就业信息-教质] 从教化司获取就业信息:', { campus: campusName, className, year: currentYear });
    
    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL || '/api/v1'}/teaching-quality/qt-class-employment-info?campus=${encodeURIComponent(campusName)}&year=${currentYear}&clazz=${encodeURIComponent(className)}`
    );
    
    if (!response.ok) {
      throw new Error(`获取教化司就业信息失败: ${response.status}`);
    }
    
    const data = await response.json();
    const rows = data.行列表 || [];
    
    console.log('[就业信息-教质] 获取到教化司就业信息:', { className, rowCount: rows.length });
    
    // 映射教化司字段到智慧司前端字段
    return rows.map((row: any): CampusClassEmploymentInfo => ({
      id: `tq-${row.serialNumber || ''}`,
      serialNumber: row.serialNumber || 0,
      name: row.name || '',
      gender: row.gender || '',
      age: row.age || 0,
      majorApplied: row.reportedMajor || '',
      educationLevel: row.education || '',
      major: row.major || '',
      graduatedSchool: row.graduateSchool || '',
      highestDegreeCertificate: row.highestDegreeCert || '',
      contactPhone: row.phone || '',
      mailingAddress: row.address || '',
      startDate: row.entryDate || '',
      employmentRegion: row.employmentRegion || '',
      employer: row.employmentCompany || '',
      jobPosition: row.employmentPosition || '',
      probationarySalary: row.probationarySalary || 0,
      regularSalaryText: row.regularSalary ? String(row.regularSalary) : '',
      regularSalary: row.regularSalary || 0,
      followUpCompany: row.followUpStatus || '',  // 回访情况字段映射
      followUpAssessmentSalary: row.followUpAssessmentSalary || 0,
      campus: campus,
      className: className,
    }));
  } catch (error) {
    console.error('[就业信息-教质] 获取教化司就业信息失败:', error);
    return [];
  }
};

// 从教化司获取所有班级的就业信息（用于班级列表）
export const fetchClassNamesFromTeachingQuality = async (campus: string): Promise<string[]> => {
  try {
    const campusName = campus.endsWith('神殿') ? campus.slice(0, -2) : campus;
    console.log('[班级列表-教质] 从教化司获取班级列表:', { campus: campusName });
    
    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL || '/api/v1'}/teaching-quality/class-list?campus=${encodeURIComponent(campusName)}`
    );
    
    if (!response.ok) {
      throw new Error(`获取教化司班级列表失败: ${response.status}`);
    }
    
    const data = await response.json();
    const classNames = Array.from(new Set(
      (data || [])
        .map((item: any) => item.班级名称 || item.class_name || '')
        .filter((name: string) => name.trim())
    )) as string[];
    
    console.log('[班级列表-教质] 获取到教化司班级列表:', classNames);
    return classNames;
  } catch (error) {
    console.error('[班级列表-教质] 获取教化司班级列表失败:', error);
    return [];
  }
};

// 自动计算班级就业总结（从教化司数据）
export const autoCalculateClassSummary = async (
  campus: string,
  className: string,
  year?: number,
): Promise<{
  神殿: string;
  班级名称: string;
  档案人数: number;
  需就业人数: number;
  目标就业人数: number;
  实际就业人数: number;
  目标就业率: number;
  实际就业率: number;
  目标需就业率: number;
  实际需就业率: number;
  目标平均就业薪资: number;
  实际平均就业薪资: number;
  薪资过万人数: number;
}> => {
  try {
    // 使用教化司的自动计算接口
    const campusName = campus.endsWith('神殿') ? campus.slice(0, -2) : campus;
    const currentYear = year || new Date().getFullYear();
    
    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL || '/api/v1'}/teaching-quality/qt-class-employment-summary/auto-calculate?campus=${encodeURIComponent(campusName)}&class_name=${encodeURIComponent(className)}&year=${currentYear}`
    );
    
    if (!response.ok) {
      throw new Error(`自动计算就业总结失败: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('[就业总结] 从教化司自动计算响应:', data);
    return data;
  } catch (error) {
    console.error('自动计算就业总结失败:', error);
    throw error;
  }
};
