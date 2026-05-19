/**
 * 为学籍花名册提供"从班级档案获取"功能的通用Hook
 */

import { useState } from 'react'
import { message } from 'antd'
import { classFileEnrollmentReader } from './classFileEnrollmentReader'

type RosterCategory = 
  | 'secondary-3year-registered'
  | 'secondary-1year-registered'
  | 'other-secondary-registered'
  | 'secondary-3year-to-register'
  | 'secondary-1year-to-register'
  | 'other-secondary-to-register'
  | 'adult-exam-registered'
  | 'adult-exam-to-register'
  | 'open-university-registered'
  | 'open-university-to-register'
  | 'other-higher-registered'
  | 'other-higher-to-register'

interface UseClassFileRosterOptions<T> {
  category: RosterCategory
  campus: string | null
  mapFunction: (rawData: any[], campus: string) => T[]
}

/**
 * 使用示例：
 * 
 * const { fetchFromClassFile, loading } = useClassFileRoster({
 *   category: 'secondary-3year-to-register',
 *   campus: currentCampus,
 *   mapFunction: (rawData, campus) => rawData.map((r, i) => ({
 *     key: `${i}-${r.studentName}`,
 *     studentName: r.studentName || '',
 *     // ... 其他字段映射
 *   }))
 * })
 * 
 * // 在按钮点击时调用
 * <Button onClick={() => fetchFromClassFile(setDataSource)}>
 *   从班级档案获取
 * </Button>
 */
export function useClassFileRoster<T>({
  category,
  campus,
  mapFunction,
}: UseClassFileRosterOptions<T>) {
  const [loading, setLoading] = useState(false)

  const fetchFromClassFile = async (
    setDataSource: React.Dispatch<React.SetStateAction<T[]>>
  ) => {
    if (!campus) {
      message.warning('请先选择神殿')
      return
    }

    try {
      setLoading(true)
      message.loading({ 
        content: '正在从班级档案读取数据...', 
        key: 'class-file-load', 
        duration: 0 
      })

      const rosterData = await classFileEnrollmentReader.getRosterData(campus, category)
      const mapped = mapFunction(rosterData, campus)

      setDataSource(mapped)
      
      message.success({
        content: `已从班级档案获取 ${mapped.length} 条记录`,
        key: 'class-file-load',
        duration: 3,
      })
    } catch (error) {
      console.error('[从班级档案获取] 失败:', error)
      message.error({ 
        content: '从班级档案获取失败', 
        key: 'class-file-load' 
      })
    } finally {
      setLoading(false)
    }
  }

  return {
    fetchFromClassFile,
    loading,
  }
}

