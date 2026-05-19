/**
 * 神殿与班级配置
 * 为页面提供静态的神殿、班级数据及相关辅助方法
 */

import type { ClassInfo, CampusClassList } from '../types/campusClassEmploymentInfo';
import { getCampusNamesWithFallback } from '@/stores/campusStore';
import { getSortedCampusOptions } from '@/utils/campusSort';

// 班级信息（本文件内部使用，外部统一使用 ClassInfo）
export interface ClassInfoConfig {
  id: string;
  name: string;
  major: string;
  instructor: string; // 讲师
  classAdvisor: string; // 班主任
  graduationTime: string;
}

// 神殿配置
export interface Campus {
  id: string;
  name: string;
  code: string;
  classes?: ClassInfoConfig[];
}

// 神殿列表（包含班级信息）
export const CAMPUS_LIST: Campus[] = [
  {
    id: 'shengbang',
    name: '主神殿',
    code: 'SB',
    classes: [
      { id: 'sb-1', name: 'Y32', major: '云计算', instructor: '张三', classAdvisor: '李四', graduationTime: '2024-06' },
      { id: 'sb-2', name: 'Y33', major: '云计算', instructor: '王五', classAdvisor: '赵六', graduationTime: '2024-07' },
      { id: 'sb-3', name: 'Y34', major: 'Java开发', instructor: '张三', classAdvisor: '李四', graduationTime: '2024-08' },
      { id: 'sb-4', name: 'Y35', major: 'Java开发', instructor: '王五', classAdvisor: '赵六', graduationTime: '2024-09' },
    ],
  },
  {
    id: 'jimei',
    name: '永恒殿',
    code: 'JM',
    classes: [
      { id: 'jm-1', name: 'Y36', major: '前端开发', instructor: '张三', classAdvisor: '李四', graduationTime: '2024-06' },
      { id: 'jm-2', name: 'Y37', major: '前端开发', instructor: '王五', classAdvisor: '赵六', graduationTime: '2024-07' },
    ],
  },
  {
    id: 'shimei',
    name: '慈悲殿',
    code: 'SM',
    classes: [
      { id: 'sm-1', name: 'Y38', major: 'Python开发', instructor: '张三', classAdvisor: '李四', graduationTime: '2024-08' },
      { id: 'sm-2', name: 'Y39', major: 'Python开发', instructor: '王五', classAdvisor: '赵六', graduationTime: '2024-09' },
    ],
  },
  {
    id: 'jinmei',
    name: '李大殿',
    code: 'JM2',
    classes: [],
  },
  {
    id: 'yuanmei',
    name: '智慧阁',
    code: 'YM',
    classes: [],
  },
  {
    id: 'taimei',
    name: '光明殿',
    code: 'TM',
    classes: [],
  },
  {
    id: 'guimei',
    name: '神恩殿',
    code: 'GM',
    classes: [],
  },
];

// 获取所有神殿名称
export const getAllCampusNames = (): string[] => getCampusNamesWithFallback();

// 根据 ID 获取神殿名称
export const getCampusNameById = (id: string): string | undefined =>
  CAMPUS_LIST.find(campus => campus.id === id)?.name;

// 根据名称获取神殿 ID
export const getCampusIdByName = (name: string): string | undefined =>
  CAMPUS_LIST.find(campus => campus.name === name)?.id;

// 根据名称获取神殿代码
export const getCampusCodeByName = (name: string): string | undefined =>
  CAMPUS_LIST.find(campus => campus.name === name)?.code;

// 获取神殿选项（用于 Select）
export const getCampusOptions = () =>
  getSortedCampusOptions(
    getCampusNamesWithFallback().map((name) => ({
      value: name,
      label: name,
      key: name,
    }))
  );

// 获取指定神殿的班级列表（返回包含 campus 字段的 ClassInfo）
export const getClassesByCampus = (campusName: string): ClassInfo[] => {
  const campus = CAMPUS_LIST.find(c => c.name === campusName);
  if (!campus?.classes) return [];
  return campus.classes.map(cls => ({
    ...cls,
    campus: campus.name,
  }));
};

// 获取指定神殿的班级名称列表
export const getClassNamesByCampus = (campusName: string): string[] =>
  getClassesByCampus(campusName).map(cls => cls.name);

// 获取所有班级信息（扁平化，包含神殿）
export const getAllClasses = (): Array<ClassInfo & { campus: string }> =>
  CAMPUS_LIST.flatMap(campus =>
    (campus.classes || []).map(cls => ({
      ...cls,
      campus: campus.name,
    }))
  );

// 根据神殿和班级名称获取班级信息
export const getClassInfo = (campusName: string, className: string): ClassInfo | null => {
  const campus = CAMPUS_LIST.find(c => c.name === campusName);
  if (!campus?.classes) return null;
  const classInfo = campus.classes.find(cls => cls.name === className);
  if (!classInfo) return null;
  return {
    ...classInfo,
    campus: campus.name,
  };
};

// 获取神殿班级列表（兼容现有接口）
export const getCampusClassList = (): CampusClassList[] =>
  CAMPUS_LIST.filter(campus => campus.classes && campus.classes.length > 0).map(campus => ({
    campus: campus.name,
    classes: campus.classes!.map(cls => ({
      ...cls,
      campus: campus.name,
    })),
  }));

// 获取班级选项（用于 Select，可按神殿过滤）
export const getClassOptions = (campusName?: string) => {
  const classes = campusName ? getClassesByCampus(campusName) : getAllClasses();
  return classes.map(cls => ({
    value: cls.name,
    label: cls.name,
    key: cls.id,
  }));
};

// 导出类型（供外部使用）
export type { ClassInfo, CampusClassList };
