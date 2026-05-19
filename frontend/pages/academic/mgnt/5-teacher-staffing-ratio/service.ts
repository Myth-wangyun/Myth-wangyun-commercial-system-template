// 神殿智慧司师资配比表数据服务
// 从后端API获取数据
import { buildApiUrl } from '@/utils/apiBase'
import { useCampusStore } from '@/stores/campusStore'
import type {
  ITeacherStaffingRatio,
  ITeacherStaffingRatioForm,
  ITeacherStaffingRatioStats,
} from './types.ts'

// 后端数据行类型
interface BackendRow {
  key: string
  index: number | string
  isLatest?: boolean
  campus?: string
  statsTime?: string
  students?: number | string
  classes?: number | string
  teacherRatio?: string
  targetTeachers?: number | string
  actualTeachers?: number | string
  teacherVacancy?: number | string
  teacherSurplus?: number | string
  cadreRatio?: string
  targetCadres?: number | string
  actualCadres?: number | string
  cadreVacancy?: number | string
  cadreSurplus?: number | string
}

// 后端记录类型
interface BackendRecord {
  id: number
  神殿: string
  年份: number
  数据: {
    rows?: BackendRow[]
  }
}

// 解析统计时间用于排序
const parseStatsTime = (statsTime?: string): number => {
  if (!statsTime) return 0
  const match = statsTime.match(/(\d{4})[.\-年](\d{1,2})[.\-月]?(\d{1,2})?/)
  if (match) {
    const year = parseInt(match[1], 10)
    const month = parseInt(match[2], 10)
    const day = match[3] ? parseInt(match[3], 10) : 1
    return year * 10000 + month * 100 + day
  }
  return 0
}

// 将后端行数据转换为前端格式
const convertBackendRowToFrontend = (
  row: BackendRow,
  campus: string,
  year: number,
  backendId: number,
): ITeacherStaffingRatio => {
  // 从statsTime解析月份
  let month = 1
  if (row.statsTime) {
    const match = row.statsTime.match(/(\d{1,2})月?/)
    if (match) {
      month = parseInt(match[1], 10)
    }
  }

  return {
    id: `${backendId}-${row.key}`,
    campus: row.campus || campus.replace(/神殿$/, ''),
    statisticsTime: row.statsTime || `${year}-${month.toString().padStart(2, '0')}`,
    month: month,
    totalStudents: Number(row.students) || 0,
    targetTeacherStudentRatio: row.teacherRatio || '',
    targetTeacherCount: Number(row.targetTeachers) || 0,
    actualTeacherCount: Number(row.actualTeachers) || 0,
    teacherVacancy: Number(row.teacherVacancy) || 0,
    teacherRedundancy: Number(row.teacherSurplus) || 0,
    targetCadreRatio: row.cadreRatio || '',
    targetCadreCount: Number(row.targetCadres) || 0,
    actualCadreCount: Number(row.actualCadres) || 0,
    cadreVacancy: Number(row.cadreVacancy) || 0,
    cadreRedundancy: Number(row.cadreSurplus) || 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

export class TeacherStaffingRatioService {
  /**
   * 获取指定神殿的所有数据（从后端API）
   */
  static async getByCampus(campus: string): Promise<ITeacherStaffingRatio[]> {
    try {
      const res = await fetch(
        buildApiUrl(`/teacher-staffing-ratio?campus=${encodeURIComponent(campus)}`)
      )
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }
      const list: BackendRecord[] = await res.json()
      const result: ITeacherStaffingRatio[] = []

      for (const record of list) {
        const rows = record.数据?.rows || []
        for (const row of rows) {
          if (row.isLatest) continue // 跳过"最近统计"行
          result.push(convertBackendRowToFrontend(row, record.神殿, record.年份, record.id))
        }
      }

      return result.sort((a, b) => {
        const timeCompare = a.statisticsTime.localeCompare(b.statisticsTime)
        if (timeCompare !== 0) return timeCompare
        return a.month - b.month
      })
    } catch (error) {
      console.error('获取师资配比数据失败:', error)
      return []
    }
  }

  /**
   * 获取所有神殿的数据（从后端API并行查询）
   */
  static async getAll(): Promise<ITeacherStaffingRatio[]> {
    try {
      const { getAllCampuses } = useCampusStore.getState()
      const campuses = getAllCampuses()
      
      // 并行请求所有神殿数据
      const promises = campuses.map(campus => this.getByCampus(campus.name))
      const results = await Promise.all(promises)
      
      // 合并所有数据
      const allData = results.flat()
      
      return allData.sort((a, b) => {
        const campusCompare = a.campus.localeCompare(b.campus)
        if (campusCompare !== 0) return campusCompare
        const timeCompare = a.statisticsTime.localeCompare(b.statisticsTime)
        if (timeCompare !== 0) return timeCompare
        return a.month - b.month
      })
    } catch (error) {
      console.error('获取师资配比数据失败:', error)
      return []
    }
  }

  /**
   * 获取所有数据，按神殿分组，每个神殿取最新的一条记录
   * 用于累计核心数据汇总视图
   * @param year 指定年份，不传则获取所有年份中最新的数据
   */
  static async getAllGroupedByCampus(year?: number): Promise<ITeacherStaffingRatio[]> {
    try {
      const { getAllCampuses } = useCampusStore.getState()
      const campuses = getAllCampuses()

      // 并行请求所有神殿数据；无数据的神殿也返回一条初始化为0的记录
      const promises = campuses.map(async (campus) => {
        const campusName = campus.name
        try {
          // 如果指定了年份，加上年份参数
          const yearParam = year !== undefined ? `&year=${year}` : ''
          const res = await fetch(
            buildApiUrl(`/teacher-staffing-ratio?campus=${encodeURIComponent(campusName)}${yearParam}`),
          )

          // 请求失败/无数据：返回0初始化
          if (!res.ok) {
            return {
              id: `init-${campusName}`,
              campus: campusName.replace(/神殿$/, ''),
              statisticsTime: '',
              month: 1,
              totalStudents: 0,
              targetTeacherStudentRatio: '',
              targetTeacherCount: 0,
              actualTeacherCount: 0,
              teacherVacancy: 0,
              teacherRedundancy: 0,
              targetCadreRatio: '',
              targetCadreCount: 0,
              actualCadreCount: 0,
              cadreVacancy: 0,
              cadreRedundancy: 0,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            } as ITeacherStaffingRatio
          }

          const list: BackendRecord[] = await res.json()
          if (!list || list.length === 0) {
            return {
              id: `init-${campusName}`,
              campus: campusName.replace(/神殿$/, ''),
              statisticsTime: '',
              month: 1,
              totalStudents: 0,
              targetTeacherStudentRatio: '',
              targetTeacherCount: 0,
              actualTeacherCount: 0,
              teacherVacancy: 0,
              teacherRedundancy: 0,
              targetCadreRatio: '',
              targetCadreCount: 0,
              actualCadreCount: 0,
              cadreVacancy: 0,
              cadreRedundancy: 0,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            } as ITeacherStaffingRatio
          }

          // 取最新年份的记录
          const latestRecord = list.reduce((prev, curr) => (curr.年份 > prev.年份 ? curr : prev), list[0])

          const rows = latestRecord.数据?.rows || []
          // 过滤掉isLatest行，找到最新的一条数据行
          const dataRows = rows.filter((row: BackendRow) => !row.isLatest)
          if (dataRows.length === 0) {
            return {
              id: `init-${campusName}`,
              campus: campusName.replace(/神殿$/, ''),
              statisticsTime: '',
              month: 1,
              totalStudents: 0,
              targetTeacherStudentRatio: '',
              targetTeacherCount: 0,
              actualTeacherCount: 0,
              teacherVacancy: 0,
              teacherRedundancy: 0,
              targetCadreRatio: '',
              targetCadreCount: 0,
              actualCadreCount: 0,
              cadreVacancy: 0,
              cadreRedundancy: 0,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            } as ITeacherStaffingRatio
          }

          // 按统计时间排序，取最新的一条
          const sortedRows = [...dataRows].sort((a: BackendRow, b: BackendRow) => {
            const timeA = parseStatsTime(a.statsTime)
            const timeB = parseStatsTime(b.statsTime)
            return timeB - timeA
          })

          const latestRow = sortedRows[0]
          return convertBackendRowToFrontend(latestRow, campusName, latestRecord.年份, latestRecord.id)
        } catch (err) {
          console.warn(`获取神殿 ${campusName} 数据失败:`, err)
          return {
            id: `init-${campusName}`,
            campus: campusName.replace(/神殿$/, ''),
            statisticsTime: '',
            month: 1,
            totalStudents: 0,
            targetTeacherStudentRatio: '',
            targetTeacherCount: 0,
            actualTeacherCount: 0,
            teacherVacancy: 0,
            teacherRedundancy: 0,
            targetCadreRatio: '',
            targetCadreCount: 0,
            actualCadreCount: 0,
            cadreVacancy: 0,
            cadreRedundancy: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          } as ITeacherStaffingRatio
        }
      })

      const results = await Promise.all(promises)
      return results.sort((a, b) => a.campus.localeCompare(b.campus))
    } catch (error) {
      console.error('获取神殿分组数据失败:', error)
      return []
    }
  }

  /**
   * 根据ID获取数据（ID格式: backendId-rowKey）
   */
  static async getById(id: string): Promise<ITeacherStaffingRatio | null> {
    try {
      // 从ID中解析backendId
      const parts = id.split('-')
      if (parts.length < 2) return null
      
      // 需要遍历所有数据来查找
      const allData = await this.getAll()
      return allData.find(item => item.id === id) || null
    } catch (error) {
      console.error('获取师资配比数据失败:', error)
      return null
    }
  }

  /**
   * 创建数据（调用后端API）
   * 注意：此方法会将数据添加到对应神殿的当前年份记录中
   */
  static async create(data: ITeacherStaffingRatioForm): Promise<ITeacherStaffingRatio> {
    try {
      const campus = data.campus.includes('神殿') ? data.campus : `${data.campus}神殿`
      const year = new Date().getFullYear()
      
      // 先获取该神殿的现有数据
      const res = await fetch(
        buildApiUrl(`/teacher-staffing-ratio?campus=${encodeURIComponent(campus)}&year=${year}`)
      )
      
      let existingRows: BackendRow[] = []
      if (res.ok) {
        const list: BackendRecord[] = await res.json()
        if (list.length > 0) {
          existingRows = (list[0].数据?.rows || []).filter((row: BackendRow) => !row.isLatest)
        }
      }
      
      // 添加新行
      const newRow: BackendRow = {
        key: `row-${Date.now()}-${existingRows.length + 1}`,
        index: existingRows.length + 1,
        campus: data.campus,
        statsTime: data.statisticsTime,
        students: data.totalStudents,
        classes: '',
        teacherRatio: data.targetTeacherStudentRatio,
        targetTeachers: data.targetTeacherCount,
        actualTeachers: data.actualTeacherCount,
        teacherVacancy: data.teacherVacancy,
        teacherSurplus: data.teacherRedundancy,
        cadreRatio: data.targetCadreRatio,
        targetCadres: data.targetCadreCount,
        actualCadres: data.actualCadreCount,
        cadreVacancy: data.cadreVacancy,
        cadreSurplus: data.cadreRedundancy,
      }
      
      const updatedRows = [...existingRows, newRow]
      
      // 保存到后端
      const saveRes = await fetch(buildApiUrl('/teacher-staffing-ratio'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          神殿: campus,
          年份: year,
          数据: { rows: updatedRows },
        }),
      })
      
      if (!saveRes.ok) {
        throw new Error(await saveRes.text())
      }
      
      const savedRecord: BackendRecord = await saveRes.json()
      return convertBackendRowToFrontend(newRow, campus, year, savedRecord.id)
    } catch (error) {
      console.error('创建师资配比数据失败:', error)
      throw new Error('创建师资配比数据失败')
    }
  }

  /**
   * 更新数据（暂不支持，因为数据存储结构不同）
   */
  static async update(
    _id: string,
    _data: Partial<ITeacherStaffingRatioForm>,
  ): Promise<ITeacherStaffingRatio> {
    // 由于后端存储结构是整表更新，暂不实现单行更新
    // 建议用户在神殿层级页面进行编辑
    throw new Error('请在神殿层级页面中编辑数据')
  }

  /**
   * 删除数据（暂不支持，因为数据存储结构不同）
   */
  static async delete(_id: string): Promise<void> {
    // 由于后端存储结构是整表更新，暂不实现单行删除
    // 建议用户在神殿层级页面进行删除
    throw new Error('请在神殿层级页面中删除数据')
  }

  /**
   * 获取统计数据
   */
  static async getStats(campus?: string): Promise<ITeacherStaffingRatioStats> {
    try {
      const data = campus ? await this.getByCampus(campus) : await this.getAll()

      return data.reduce(
        (stats, item) => ({
          totalStudents: stats.totalStudents + item.totalStudents,
          totalTargetTeachers: stats.totalTargetTeachers + item.targetTeacherCount,
          totalActualTeachers: stats.totalActualTeachers + item.actualTeacherCount,
          totalTeacherVacancy: stats.totalTeacherVacancy + item.teacherVacancy,
          totalTeacherRedundancy: stats.totalTeacherRedundancy + item.teacherRedundancy,
          totalTargetCadres: stats.totalTargetCadres + item.targetCadreCount,
          totalActualCadres: stats.totalActualCadres + item.actualCadreCount,
          totalCadreVacancy: stats.totalCadreVacancy + item.cadreVacancy,
          totalCadreRedundancy: stats.totalCadreRedundancy + item.cadreRedundancy,
        }),
        {
          totalStudents: 0,
          totalTargetTeachers: 0,
          totalActualTeachers: 0,
          totalTeacherVacancy: 0,
          totalTeacherRedundancy: 0,
          totalTargetCadres: 0,
          totalActualCadres: 0,
          totalCadreVacancy: 0,
          totalCadreRedundancy: 0,
        },
      )
    } catch (error) {
      console.error('获取统计数据失败:', error)
      return {
        totalStudents: 0,
        totalTargetTeachers: 0,
        totalActualTeachers: 0,
        totalTeacherVacancy: 0,
        totalTeacherRedundancy: 0,
        totalTargetCadres: 0,
        totalActualCadres: 0,
        totalCadreVacancy: 0,
        totalCadreRedundancy: 0,
      }
    }
  }

  /**
   * 导出数据
   */
  static async exportData(campus?: string): Promise<any[]> {
    try {
      const data = campus ? await this.getByCampus(campus) : await this.getAllGroupedByCampus()

      return data.map((item, index) => ({
        序号: index + 1,
        神殿: item.campus,
        统计时间: item.statisticsTime,
        学生人数: item.totalStudents,
        目标师资配比: item.targetTeacherStudentRatio,
        目标老师数量: item.targetTeacherCount,
        实际老师数量: item.actualTeacherCount,
        老师空缺: item.teacherVacancy,
        老师冗余: item.teacherRedundancy,
        目标干部与教员配比: item.targetCadreRatio,
        目标干部数量: item.targetCadreCount,
        实际干部数量: item.actualCadreCount,
        干部空缺: item.cadreVacancy,
        干部冗余: item.cadreRedundancy,
      }))
    } catch (error) {
      console.error('导出数据失败:', error)
      return []
    }
  }
}
