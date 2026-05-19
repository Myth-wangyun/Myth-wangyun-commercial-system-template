
import {
  type CampusClassEmploymentInfo,
  type ClassInfo,
  type CampusClassList,
} from '../types/campusClassEmploymentInfo';
import { apiService } from './api';
import {
  getCampusClassList as getCampusClassListFromConfig,
  getClassInfo as getClassInfoFromConfig,
  getCampusCodeByName,
  getAllCampusNames,
} from '../config/campusConfig';

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

// 从后端API获取班级列表
export const fetchCampusClassList = async (): Promise<CampusClassList[]> => {
  try {
    // 先测试：获取所有班级（不按神殿过滤），看看数据库中是否有数据
    try {
      const allClassesResponse = await apiService.get<any>('/config/classes', {
        params: {
          // 不传 campus_code，获取所有班级
        },
      });
      
      let allClassesData: any[] = [];
      if (Array.isArray(allClassesResponse)) {
        allClassesData = allClassesResponse;
      } else if (allClassesResponse && typeof allClassesResponse === 'object' && Array.isArray(allClassesResponse.data)) {
        allClassesData = allClassesResponse.data;
      }
      
      console.log('[班级列表] 测试：获取所有班级（不按神殿过滤）:', {
        totalClasses: allClassesData.length,
        classes: allClassesData.map((cls: any) => ({
          id: cls.id,
          class_code: cls.class_code,
          class_name: cls.class_name,
          campus_code: cls.campus_code,
        })),
      });
    } catch (testError) {
      console.warn('[班级列表] 测试获取所有班级失败:', testError);
    }
    
    // 获取所有神殿名称（从配置获取）
    const allCampuses = getAllCampusNames();
    const campusClassMap = new Map<string, ClassInfo[]>();

    console.log('[班级列表] 开始获取所有神殿的班级列表，神殿列表:', allCampuses);

    // 为每个神殿获取班级列表
    for (const campusName of allCampuses) {
      console.log(`[班级列表] 正在获取 ${campusName} 的班级列表...`);
      
      try {
        // 直接使用神殿名称查询，不需要code映射
        // 注意：FastAPI 默认直接返回数组，apiService.get 返回 response.data
        // 所以如果后端返回数组，apiService.get 就直接返回数组
        const response = await apiService.get<any>('/config/classes', {
          params: {
            campus_name: campusName, // 直接使用神殿名称
            // 不传active参数，获取所有班级（包括活跃和非活跃的）
          },
        });

        // 处理可能的响应格式：
        // FastAPI 默认直接返回数组，apiService.get 返回 response.data
        // 1. 后端直接返回数组 [] -> apiService.get 返回数组
        // 2. 如果后端包装成 {success, data} -> apiService.get 返回 {success, data}
        // 3. 如果后端包装成 {data} -> apiService.get 返回 {data}
        let responseData: any[] = [];
        
        if (Array.isArray(response)) {
          // 情况1：直接返回数组（FastAPI默认格式，最常见）
          responseData = response;
        } else if (response && typeof response === 'object') {
          if (Array.isArray(response.data)) {
            // 情况2或3：{success, data} 或 {data}
            responseData = response.data;
          } else {
            // 其他格式，记录警告
            console.warn(`[班级列表] ${campusName} 的响应格式异常:`, {
              response,
              responseType: typeof response,
              responseKeys: Object.keys(response),
            });
            responseData = [];
          }
        } else {
          // 非数组、非对象，记录警告
          console.warn(`[班级列表] ${campusName} 的响应格式异常:`, {
            response,
            responseType: typeof response,
          });
          responseData = [];
        }

        console.log(`[班级列表] 获取${campusName}的班级列表:`, {
          url: '/config/classes',
          params: { campus_name: campusName },
          responseType: typeof response,
          responseIsArray: Array.isArray(response),
          fullResponse: response,
          responseData: responseData,
          responseDataLength: responseData.length,
          firstItem: responseData[0], // 打印第一条数据，方便调试
        });

        const classes = responseData.map((cls: any): ClassInfo => {
          // 将后端ClassOut转换为前端ClassInfo
          // 注意：如果后端返回了关联的major和teacher数据，使用它们；否则使用默认值
          const endDate = cls.end_date;
          const graduationTime = endDate 
            ? new Date(endDate).toISOString().slice(0, 7) // 格式化为 YYYY-MM
            : '';
          
          // 调试：打印原始数据
          console.log(`[班级列表] 处理班级数据:`, {
            raw: cls,
            id: cls.id,
            class_code: cls.class_code,
            class_name: cls.class_name,
            name: cls.name,
            campus_code: cls.campus_code,
            major_id: cls.major_id,
            major: cls.major,
            homeroom_teacher_id: cls.homeroom_teacher_id,
            homeroom_teacher: cls.homeroom_teacher,
            is_active: cls.is_active,
          });
          
          return {
            id: cls.id?.toString() || cls.class_code || '',
            name: cls.class_name || cls.name || '',
            campus: campusName, // 使用神殿名称
            major: cls.major?.name || cls.major_name || '', // 如果后端返回了关联的major数据
            instructor: cls.instructor?.name || cls.instructor_name || '', // 如果后端返回了关联的instructor数据
            classAdvisor: cls.homeroom_teacher?.name || cls.homeroom_teacher_name || '', // 如果后端返回了关联的teacher数据
            graduationTime: graduationTime,
          };
        });

        if (classes.length > 0) {
          campusClassMap.set(campusName, classes);
          console.log(`[班级列表] ${campusName}成功获取${classes.length}个班级:`, classes.map(c => c.name));
        } else {
          console.warn(`[班级列表] ${campusName}没有获取到班级数据，可能原因：
            1. 数据库中该神殿没有班级记录
            2. API返回了空数组`);
        }
      } catch (error: any) {
        console.error(`[班级列表] 获取${campusName}的班级列表失败:`, {
          error,
          errorMessage: error?.message,
          errorResponse: error?.response,
          errorResponseData: error?.response?.data,
          errorStatus: error?.response?.status,
        });
        // 继续处理其他神殿
      }
    }

    // 转换为CampusClassList[]格式
    const result: CampusClassList[] = Array.from(campusClassMap.entries()).map(
      ([campus, classes]) => ({
        campus,
        classes,
      })
    );

    // 即使后端返回空数组，也使用后端的结果（表示后端确实没有数据）
    // 只有在API调用完全失败时，才回退到配置
    console.log('[班级列表] 从后端API获取班级列表结果:', {
      result,
      resultLength: result.length,
      totalClasses: result.reduce((sum, item) => sum + item.classes.length, 0),
      campusesWithClasses: result.map(item => `${item.campus}(${item.classes.length}个)`),
    });
    
    // 如果至少有一个神殿有数据，或者所有神殿都查询过了（即使都是空的），都返回后端结果
    // 这样用户能看到后端真实的数据状态
    return result;
  } catch (error) {
    console.error('[班级列表] 获取班级列表失败，回退到配置:', error);
    // 全部失败，回退到本地配置
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
    followUpAssessmentSalary: actualData.回访转正金额 ? Number(actualData.回访转正金额) : (actualData.followUpAssessmentSalary || 0),
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

// 自动计算班级就业总结
export const autoCalculateClassSummary = async (
  campus: string,
  className: string,
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
    const response = await apiService.get<any>('/campus-employment/class-summary/auto-calculate', {
      params: {
        神殿: campus,
        班级名称: className,
      },
      headers: {
        'X-Campus': btoa(encodeURIComponent(campus)),
      },
    });

    let data: any;
    if (Array.isArray(response)) {
      throw new Error('意外的响应格式');
    } else if (response && typeof response === 'object') {
      data = (response as any).data || (response as any);
    } else {
      throw new Error('无效的响应格式');
    }

    console.log('[就业总结] 自动计算响应:', response, '解包后:', data);
    return data;
  } catch (error) {
    console.error('自动计算就业总结失败:', error);
    throw error;
  }
};
