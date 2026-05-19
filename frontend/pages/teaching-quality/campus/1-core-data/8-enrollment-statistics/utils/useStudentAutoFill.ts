/**
 * 学籍花名册 - 学生信息自动填充 Hook
 */

import { useEffect, useRef, useCallback, useMemo, useState } from 'react'
import type { FormInstance } from 'antd'
import { useCampusStore } from '@/stores/campusStore'
import {
  fetchAllClassFileRecords,
  handleNameInput,
  searchStudentsByName,
  type StudentInfo,
} from './studentAutoFill'

/**
 * 使用学生信息自动填充的 Hook
 * @param form Form 实例
 * @param fieldMapping 字段映射配置 { formField: 'studentInfoField' }
 */
export const useStudentAutoFill = (
  form: FormInstance,
  fieldMapping: {
    genderField?: string // 性别字段名，如 'gender'
    idCardField?: string // 身份证号字段名，如 'idCardNumber'
    phoneField?: string // 电话字段名，如 'contactPhone'
    parentPhoneField?: string // 家长电话字段名，如 'parentPhone1'
  } = {}
) => {
  const { currentCampus } = useCampusStore()
  const classFileRecordsRef = useRef<Awaited<ReturnType<typeof fetchAllClassFileRecords>>>([])
  const [isLoading, setIsLoading] = useState(false)
  const [classFileRecords, setClassFileRecords] = useState<Awaited<ReturnType<typeof fetchAllClassFileRecords>>>([])

  // 加载班级档案数据
  useEffect(() => {
    const loadClassFileRecords = async () => {
      if (!currentCampus) {
        classFileRecordsRef.current = []
        setClassFileRecords([])
        setIsLoading(false)
        return
      }
      setIsLoading(true)
      try {
        console.log(`[学籍花名册] 开始加载 ${currentCampus} 的班级档案数据...`)
        const records = await fetchAllClassFileRecords(currentCampus)
        classFileRecordsRef.current = records
        setClassFileRecords(records) // 更新状态以触发重新渲染
        console.log(`[学籍花名册] 已加载 ${records.length} 条班级档案数据`)
        if (records.length === 0) {
          console.warn(`[学籍花名册] 警告: ${currentCampus} 没有找到任何班级档案数据`)
        }
      } catch (error) {
        console.error('加载班级档案数据失败:', error)
        classFileRecordsRef.current = []
        setClassFileRecords([])
      } finally {
        setIsLoading(false)
      }
    }
    loadClassFileRecords()
  }, [currentCampus])

  // 处理姓名输入，自动匹配并填充
  const handleStudentNameChange = useCallback(
    async (name: string) => {
      if (!name || !name.trim()) return

      await handleNameInput(name, classFileRecordsRef.current, (studentInfo: StudentInfo) => {
        const updates: any = {}
        
        if (fieldMapping.genderField && studentInfo.gender) {
          updates[fieldMapping.genderField] = studentInfo.gender
        }
        
        if (fieldMapping.idCardField && studentInfo.idCard) {
          updates[fieldMapping.idCardField] = studentInfo.idCard
        }
        
        if (fieldMapping.phoneField && studentInfo.phone) {
          updates[fieldMapping.phoneField] = studentInfo.phone
        }
        
        if (fieldMapping.parentPhoneField && studentInfo.parentPhone) {
          updates[fieldMapping.parentPhoneField] = studentInfo.parentPhone
        }

        if (Object.keys(updates).length > 0) {
          form.setFieldsValue(updates)
        }
      })
    },
    [form, fieldMapping]
  )

  // 获取 AutoComplete 选项（使用 useMemo 而不是 useCallback，因为需要响应数据变化）
  const getAutoCompleteOptions = useCallback(
    (searchText: string) => {
      if (!searchText || !searchText.trim()) {
        return []
      }

      const records = classFileRecordsRef.current
      console.log(`[AutoComplete] 搜索 "${searchText}", 当前有 ${records.length} 条记录`)
      const matched = searchStudentsByName(searchText, records, 20)
      console.log(`[AutoComplete] 找到 ${matched.length} 条匹配记录:`, matched.map(s => s.name))
      return matched.map((student) => ({
        value: student.name,
        label: `${student.name} (${student.gender || '未知'})${student.className ? ` - ${student.className}` : ''}`,
        student: student, // 保存完整的学生信息
      }))
    },
    []
  )

  // 处理 AutoComplete 选择
  const handleAutoCompleteSelect = useCallback(
    (value: string, option: any) => {
      const studentInfo = option.student as StudentInfo
      if (studentInfo) {
        const updates: any = {}
        
        if (fieldMapping.genderField && studentInfo.gender) {
          updates[fieldMapping.genderField] = studentInfo.gender
        }
        
        if (fieldMapping.idCardField && studentInfo.idCard) {
          updates[fieldMapping.idCardField] = studentInfo.idCard
        }
        
        if (fieldMapping.phoneField && studentInfo.phone) {
          updates[fieldMapping.phoneField] = studentInfo.phone
        }
        
        if (fieldMapping.parentPhoneField && studentInfo.parentPhone) {
          updates[fieldMapping.parentPhoneField] = studentInfo.parentPhone
        }

        if (Object.keys(updates).length > 0) {
          form.setFieldsValue(updates)
        }
      }
    },
    [form, fieldMapping]
  )

  return {
    handleStudentNameChange,
    getAutoCompleteOptions,
    handleAutoCompleteSelect,
    classFileRecords, // 返回状态而不是 ref 的快照
    isLoading,
  }
}

