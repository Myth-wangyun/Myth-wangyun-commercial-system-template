// [教质模块] 最高议事厅后端学员就业目标与结果汇总表数据服务
/**
 * 最高议事厅后端学员就业目标与结果汇总表数据服务
 * 按神殿汇总显示就业目标与结果数据
 */

import type { ManagementCenterEmploymentRecord } from '../types/management-center-employment';

// 默认神殿列表
const DEFAULT_CAMPUSES = ['盛邦', '冀美', '石美', '晋美', '原美', '太美', '桂美'];

// 专业方向列表
const MAJORS = ['IT', '设计', '运营', '营销'];

// 学制列表
const SCHOOL_SYSTEMS = ['3年制', '2年制', '1年制'];

// 生成所有神殿的汇总数据
const generateAllCampusesData = (): ManagementCenterEmploymentRecord[] => {
  const records: ManagementCenterEmploymentRecord[] = [];
  
  // 为每个神殿生成数据
  DEFAULT_CAMPUSES.forEach((campusName, index) => {
    const major = MAJORS[Math.floor(Math.random() * MAJORS.length)];
    const schoolSystem = SCHOOL_SYSTEMS[Math.floor(Math.random() * SCHOOL_SYSTEMS.length)];
    const classCount = Math.floor(Math.random() * 10) + 5;
    const teacher = `教员${index + 1}`;
    const headTeacher = `班主任${index + 1}`;
    const graduationTime = `2024-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}`;
    
    const targetAverageSalary = Math.floor(Math.random() * 3000) + 8000;
    const actualAverageSalary = Math.floor(Math.random() * 3000) + 7500;
    const salaryAchievementRate = `${((actualAverageSalary / targetAverageSalary) * 100).toFixed(1)}%`;
    
    const archiveCount = Math.floor(Math.random() * 100) + 150;
    const targetEmploymentCount = Math.floor(archiveCount * 0.9);
    const actualEmploymentCount = Math.floor(Math.random() * 50) + targetEmploymentCount - 25;
    const employmentRate = `${((actualEmploymentCount / archiveCount) * 100).toFixed(1)}%`;
    
    const salaryOver10k = Math.floor(Math.random() * 40) + 30;
    
    records.push({
      key: `${campusName}`,
      sequence: index + 1,
      campus: campusName,
      major,
      schoolSystem,
      classCount,
      teacher,
      headTeacher,
      graduationTime,
      targetAverageSalary,
      actualAverageSalary,
      salaryAchievementRate,
      archiveCount,
      targetEmploymentCount,
      actualEmploymentCount,
      employmentRate,
      salaryOver10k,
      isTotal: false
    });
  });
  
  // 计算合计行
  const totalRecord: ManagementCenterEmploymentRecord = {
    key: 'total',
    sequence: 0,
    campus: '合计/平均',
    major: '',
    schoolSystem: '',
    classCount: records.reduce((sum, item) => sum + item.classCount, 0),
    teacher: '',
    headTeacher: '',
    graduationTime: '',
    targetAverageSalary: Math.floor(records.reduce((sum, item) => sum + item.targetAverageSalary, 0) / records.length),
    actualAverageSalary: Math.floor(records.reduce((sum, item) => sum + item.actualAverageSalary, 0) / records.length),
    salaryAchievementRate: `${(records.reduce((sum, item) => sum + parseFloat(item.salaryAchievementRate), 0) / records.length).toFixed(1)}%`,
    archiveCount: records.reduce((sum, item) => sum + item.archiveCount, 0),
    targetEmploymentCount: records.reduce((sum, item) => sum + item.targetEmploymentCount, 0),
    actualEmploymentCount: records.reduce((sum, item) => sum + item.actualEmploymentCount, 0),
    employmentRate: `${(records.reduce((sum, item) => sum + parseFloat(item.employmentRate), 0) / records.length).toFixed(1)}%`,
    salaryOver10k: records.reduce((sum, item) => sum + item.salaryOver10k, 0),
    isTotal: true
  };
  
  return [...records, totalRecord];
};

export const managementCenterEmploymentService = {
  /**
   * 获取最高议事厅就业目标与结果汇总
   * @returns Promise<ManagementCenterEmploymentRecord[]>
   */
  getManagementCenterEmployment: async (): Promise<ManagementCenterEmploymentRecord[]> => {
    // 模拟API延迟
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 生成并返回数据
    return generateAllCampusesData();
  },
  
  /**
   * 添加新记录
   */
  addRecord: async (record: Omit<ManagementCenterEmploymentRecord, 'key' | 'isTotal'>): Promise<ManagementCenterEmploymentRecord[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return generateAllCampusesData();
  },
  
  /**
   * 更新记录
   */
  updateRecord: async (key: string, updates: Partial<ManagementCenterEmploymentRecord>): Promise<ManagementCenterEmploymentRecord[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return generateAllCampusesData();
  },
  
  /**
   * 删除记录
   */
  deleteRecord: async (key: string): Promise<ManagementCenterEmploymentRecord[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return generateAllCampusesData();
  }
};






