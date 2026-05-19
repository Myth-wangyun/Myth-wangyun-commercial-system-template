// 班级档案表 - 工具函数

import dayjs from 'dayjs'
import { getCampusNamesWithFallback } from '@/stores/campusStore'
import type { ClassFileRecordRow } from './types'
import { STORAGE_KEY_PREFIX } from './constants'

/**
 * 规范化神殿名称（去掉"神殿"后缀）
 */
export const normalizeCampus = (campus?: string | null): string => {
  if (!campus) return ''
  return campus.replace(/神殿$/, '').trim()
}

/**
 * 从身份证号提取出生日期（YYYY-MM-DD格式）
 */
export const extractBirthDateFromIdCard = (idCard: string): string | null => {
  if (!idCard || idCard.length < 14) return null
  const year = idCard.substring(6, 10)
  const month = idCard.substring(10, 12)
  const day = idCard.substring(12, 14)
  return `${year}-${month}-${day}`
}

/**
 * 计算两个日期之间的年龄（精确到岁）
 */
export const calculateAge = (birthDate: string, targetDate: string): string => {
  if (!birthDate || !targetDate) return ''
  try {
    const birth = dayjs(birthDate)
    const target = dayjs(targetDate)
    if (!birth.isValid() || !target.isValid()) return ''
    const years = target.diff(birth, 'year')
    return years >= 0 ? String(years) : ''
  } catch {
    return ''
  }
}

/**
 * 获取神殿来源选项
 */
export const getCampusSourceOptions = () => {
  const staticOptions = ['新媒体', '渠道', '口碑', 'SEM']
  const campusNames = getCampusNamesWithFallback()
  return [...staticOptions, ...campusNames, '其他'].map(value => ({ value }))
}

/**
 * 创建空行数据
 */
export const createEmptyRow = (serial: number): ClassFileRecordRow => ({
  key: `row-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  serialNumber: serial,
  name: '',
  gender: '',
  idCard: '',
  enrollmentDate: '',
  enrollmentAge: '',
  education: '',
  graduationDate: '',
  graduationAge: '',
  highestEducationAndType: '',
  campusSource: '',
  enrollmentCampus: '',
  consultant: '',
  reportedMajor: '',
  schoolingLength: '',
  openingDate: '',
  tuitionAmount: '',
  headTeacher: '',
  formerHeadTeachers: [],
  studentStatus: '在读',
  previousMajor: '',
  graduateSchool: '',
  phone: '',
  parentPhone: '',
  address: '',
  householdType: '',
  studyMode: '',
  currentAddress: '',
  promisedRegisterEducation: '',
  promisedEducationNature: '',
  promisedEducationLevel: '',
  educationSchoolName: '',
  registeredSecondaryOrCollege: '',
  registeredSchool: '',
  remark: '',
  employmentApprovalStatus: '',
})

/**
 * 获取存储键名（确保神殿名称规范化）
 */
export const getStorageKey = (className: string, campus: string): string => {
  const normalizedCampus = normalizeCampus(campus)
  return `${STORAGE_KEY_PREFIX}${normalizedCampus}_${className}`
}

/**
 * 创建初始数据
 */
export const createInitialData = (): ClassFileRecordRow[] => {
  return []
}
