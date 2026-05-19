/**
 * 学籍花名册 - 学生信息自动填充工具
 * 从班级档案表获取学生信息，支持按姓名匹配
 */

import React from 'react'
import { buildApiUrl } from '@/utils/apiBase'
import { appMessage, appModal } from '@/utils/antdStatic'

// 学生信息接口
export interface StudentInfo {
  name: string
  gender: string
  idCard: string
  className?: string
  phone?: string
  parentPhone?: string
}

// 班级档案记录（简化版）
interface ClassFileRecord {
  name: string
  gender: string
  idCard: string
  phone?: string
  parentPhone?: string
  className?: string
}

/**
 * 规范化神殿名称（去掉"神殿"后缀）
 */
const normalizeCampus = (campus: string): string => {
  if (!campus) return ''
  return campus.replace(/神殿$/, '').trim()
}

/**
 * 获取当前神殿的所有班级档案数据
 */
export const fetchAllClassFileRecords = async (campus: string): Promise<ClassFileRecord[]> => {
  try {
    const normalizedCampus = normalizeCampus(campus)
    const allRecords: ClassFileRecord[] = []

    // 先获取班级列表
    const classListUrl = buildApiUrl(`/teaching-quality/class-list?campus=${encodeURIComponent(normalizedCampus)}`)
    const classListRes = await fetch(classListUrl)
    
    if (!classListRes.ok) {
      console.warn('获取班级列表失败')
      return []
    }

    const classList = (await classListRes.json()) as Array<{ 班级名称: string; 神殿: string }>
    const uniqueClasses = Array.from(
      new Set(classList.map((c) => c.班级名称).filter(Boolean))
    )

    // 遍历所有班级，获取学生数据
    for (const className of uniqueClasses) {
      try {
        const url = buildApiUrl(
          `/teaching-quality/class-file?campus=${encodeURIComponent(normalizedCampus)}&class=${encodeURIComponent(className)}`
        )
        const res = await fetch(url)
        if (!res.ok) {
          console.warn(`加载 ${className} 班数据失败`)
          continue
        }
        const result = await res.json()
        const rows = (result?.行列表 || []) as any[]

        const mapped: ClassFileRecord[] = rows
          .filter((r: any) => r.name && String(r.name).trim())
          .map((r: any) => ({
            name: String(r.name || '').trim(),
            gender: String(r.gender || '').trim(),
            idCard: String(r.idCard || '').trim(),
            phone: String(r.phone || '').trim(),
            parentPhone: String(r.parentPhone || '').trim(),
            className: className,
          }))

        allRecords.push(...mapped)
      } catch (error) {
        console.error(`加载 ${className} 班数据异常:`, error)
      }
    }

    return allRecords
  } catch (error) {
    console.error('获取班级档案数据失败:', error)
    return []
  }
}

/**
 * 根据姓名匹配学生信息（精确匹配）
 * @param name 学生姓名
 * @param allRecords 所有班级档案记录
 * @returns 匹配到的学生信息列表
 */
export const matchStudentsByName = (
  name: string,
  allRecords: ClassFileRecord[]
): StudentInfo[] => {
  if (!name || !name.trim()) return []

  const trimmedName = name.trim()
  return allRecords
    .filter((r) => r.name.trim() === trimmedName)
    .map((r) => ({
      name: r.name,
      gender: r.gender,
      idCard: r.idCard,
      className: r.className,
      phone: r.phone,
      parentPhone: r.parentPhone,
    }))
}

/**
 * 根据姓名搜索学生信息（模糊匹配，用于 AutoComplete）
 * @param searchText 搜索文本
 * @param allRecords 所有班级档案记录
 * @param limit 返回结果数量限制，默认20
 * @returns 匹配到的学生信息列表
 */
export const searchStudentsByName = (
  searchText: string,
  allRecords: ClassFileRecord[],
  limit: number = 20
): StudentInfo[] => {
  if (!searchText || !searchText.trim()) return []

  const trimmedSearch = searchText.trim().toLowerCase()
  return allRecords
    .filter((r) => {
      const name = r.name.trim().toLowerCase()
      return name.includes(trimmedSearch)
    })
    .slice(0, limit)
    .map((r) => ({
      name: r.name,
      gender: r.gender,
      idCard: r.idCard,
      className: r.className,
      phone: r.phone,
      parentPhone: r.parentPhone,
    }))
}

/**
 * 当有多个同名学生时，显示选择对话框
 * @param students 匹配到的学生列表
 * @returns Promise<StudentInfo | null> 用户选择的学生信息，如果取消则返回null
 */
export const showStudentSelectionModal = (students: StudentInfo[]): Promise<StudentInfo | null> => {
  return new Promise((resolve) => {
    appModal().confirm({
      title: '发现多个同名学生',
      width: 600,
      content: (
        <div style={{ maxHeight: 400, overflowY: 'auto' }}>
          <p style={{ marginBottom: 16 }}>请选择要使用的学生信息：</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {students.map((student, index) => (
              <div
                key={index}
                style={{
                  padding: 12,
                  border: '1px solid #d9d9d9',
                  borderRadius: 4,
                  cursor: 'pointer',
                  backgroundColor: '#fafafa',
                }}
                onClick={() => {
                  appModal().destroyAll()
                  resolve(student)
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#e6f7ff'
                  e.currentTarget.style.borderColor = '#1890ff'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#fafafa'
                  e.currentTarget.style.borderColor = '#d9d9d9'
                }}
              >
                <div style={{ fontWeight: 500, marginBottom: 4 }}>
                  {student.name} ({student.gender || '未知'})
                </div>
                <div style={{ fontSize: 12, color: '#666' }}>
                  身份证号: {student.idCard || '未填写'}
                </div>
                {student.className && (
                  <div style={{ fontSize: 12, color: '#666' }}>
                    班级: {student.className}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ),
      okText: '取消',
      cancelText: null,
      onOk: () => {
        resolve(null)
      },
      onCancel: () => {
        resolve(null)
      },
    })
  })
}

/**
 * 处理姓名输入，自动匹配并填充学生信息
 * @param name 输入的姓名
 * @param allRecords 所有班级档案记录
 * @param onFill 填充回调函数 (studentInfo: StudentInfo) => void
 */
export const handleNameInput = async (
  name: string,
  allRecords: ClassFileRecord[],
  onFill: (studentInfo: StudentInfo) => void
): Promise<void> => {
  if (!name || !name.trim()) return

  const matched = matchStudentsByName(name, allRecords)

  if (matched.length === 0) {
    // 没有匹配到，不自动填充
    return
  }

  if (matched.length === 1) {
    // 只有一个匹配，直接填充
    onFill(matched[0])
    appMessage().success('已自动填充学生信息')
  } else {
    // 多个匹配，显示选择对话框
    const selected = await showStudentSelectionModal(matched)
    if (selected) {
      onFill(selected)
      appMessage().success('已填充选中的学生信息')
    }
  }
}

