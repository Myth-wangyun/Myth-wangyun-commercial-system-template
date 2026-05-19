// 班级档案表 - API 服务层

import { message } from 'antd'
import { buildApiUrl } from '@/utils/apiBase'
import { normalizeCampus } from './utils'
import type { ClassFileRecordRow } from './types'

/**
 * 加载班级档案数据
 */
export const loadClassFileData = async (
  className: string,
  campus: string
): Promise<ClassFileRecordRow[]> => {
  try {
    const normalizedCampus = normalizeCampus(campus)
    const url = buildApiUrl(
      `/teaching-quality/class-file?campus=${encodeURIComponent(normalizedCampus)}&class=${encodeURIComponent(className)}`
    )
    const res = await fetch(url)
    if (!res.ok) throw new Error('加载班级档案失败')
    const result = await res.json()
    return (result?.行列表 || []) as any[]
  } catch (error) {
    console.error('加载数据失败:', error)
    throw error
  }
}

/**
 * 保存班级档案数据
 */
export const saveClassFileData = async (
  data: ClassFileRecordRow[],
  className: string,
  campus: string
): Promise<ClassFileRecordRow[]> => {
  try {
    const rows = data
      .filter((d) => (d.name && d.name.trim()) || (d.idCard && d.idCard.trim()))
      .map((d) => ({
        serialNumber: d.serialNumber,
        name: d.name,
        gender: d.gender,
        idCard: d.idCard,
        enrollmentDate: d.enrollmentDate || null,
        enrollmentAge: d.enrollmentAge,
        education: d.education,
        graduationDate: d.graduationDate || null,
        graduationAge: d.graduationAge,
        highestEducationAndType: d.highestEducationAndType,
        campusSource: d.campusSource,
        enrollmentCampus: d.enrollmentCampus,
        consultant: d.consultant,
        reportedMajor: d.reportedMajor,
        schoolingLength: d.schoolingLength,
        openingDate: d.openingDate || null,
        tuitionAmount: d.tuitionAmount,
        headTeacher: d.headTeacher,
        formerHeadTeachers: d.formerHeadTeachers || [],
        studentStatus: d.studentStatus,
        previousMajor: d.previousMajor,
        graduateSchool: d.graduateSchool,
        phone: d.phone,
        parentPhone: d.parentPhone,
        address: d.address,
        householdType: d.householdType,
        studyMode: d.studyMode,
        currentAddress: d.currentAddress,
        promisedRegisterEducation: d.promisedRegisterEducation,
        promisedEducationNature: d.promisedEducationNature,
        promisedEducationLevel: d.promisedEducationLevel,
        educationSchoolName: d.educationSchoolName,
        registeredSecondaryOrCollege: d.registeredSecondaryOrCollege,
        registeredSchool: d.registeredSchool,
        remark: d.remark,
      }))

    // 允许发送空数组到后端，以支持删除所有记录

    const payload = {
      神殿名称: normalizeCampus(campus),
      班级名称: className,
      行列表: rows,
    }

    const res = await fetch(buildApiUrl('/teaching-quality/class-file'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    
    if (!res.ok) throw new Error('保存失败')
    
    const result = await res.json()
    message.success('已保存班级档案')
    return (result?.行列表 || []) as any[]
  } catch (error) {
    console.error('保存数据失败:', error)
    message.error('保存数据失败')
    throw error
  }
}

/**
 * 转班操作
 */
export const transferStudent = async (
  studentName: string,
  sourceCampus: string,
  sourceClass: string,
  targetCampus: string,
  targetClass: string
): Promise<void> => {
  try {
    const payload = {
      student_name: studentName,
      source_campus: normalizeCampus(sourceCampus),
      source_class: sourceClass,
      target_campus: normalizeCampus(targetCampus),
      target_class: targetClass,
    }

    const res = await fetch(buildApiUrl('/teaching-quality/class-file/transfer-student'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const errorData = await res.json()
      throw new Error(errorData.detail || '转班失败')
    }

    message.success('转班成功')
  } catch (error: any) {
    console.error('转班失败:', error)
    message.error(error.message || '转班失败')
    throw error
  }
}
