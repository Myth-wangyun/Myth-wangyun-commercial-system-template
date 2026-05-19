/**
 * 教化司 - 神殿后端班主任就业汇总表服务
 * 
 * 与智慧司的区别：
 * - 数据来源：从 teaching_quality.QT班就业信息表 和 teaching_quality.班级列表 读取
 * - API 路径：/api/v1/teaching-quality/qt-teacher-employment-summary
 */

import { apiService } from '../api'
import type { TeacherEmploymentSummaryRecord } from '@/types/teacher-employment-summary'
import { normalizeCampusName } from '@/utils/campusHelpers'

export interface TQTeacherEmploymentSummary {
  汇总ID?: number
  神殿: string
  教员姓名: string
  专业: string
  学制: string
  班级名称: string
  毕业时间?: string
  目标平均就业薪资?: number
  实际平均就业薪资?: number
  达标率?: number
  目标就业人数?: number
  实际就业人数?: number
  就业率?: number
  薪资过万人数?: number
}

/**
 * 教化司教员就业汇总服务对象
 */
export const tqTeacherEmploymentSummaryService = {
  /**
   * 获取教员就业汇总数据
   * @param campus 神殿名称
   * @param year 年份（可选）
   * @returns Promise<TeacherEmploymentSummaryRecord[]>
   */
  getTeacherEmploymentSummaryData: async (
    campus: string,
    year?: number
  ): Promise<TeacherEmploymentSummaryRecord[]> => {
    try {
      // 校验神殿参数
      if (!campus || campus.trim() === '') {
        console.warn('[教质-教员就业汇总] 神殿参数为空，返回空数组')
        return []
      }

      console.log('[教质-教员就业汇总] 调用API获取列表:', { campus, year })

      // 构建查询参数
      const params: any = { campus }
      if (year) params.year = year

      const response = await apiService.get<TQTeacherEmploymentSummary[]>(
        '/teaching-quality/qt-teacher-employment-summary',
        { params }
      )

      let summaries: TQTeacherEmploymentSummary[] = []
      if (Array.isArray(response)) {
        summaries = response
      } else if (response && typeof response === 'object') {
        summaries = (response as any).data || (response as any) || []
      }

      console.log('[教质-教员就业汇总] 获取列表响应:', {
        campus,
        summaries,
        dataLength: summaries.length,
      })

      // 按教员姓名和班级名称分组，生成带合计行的数据
      const records: TeacherEmploymentSummaryRecord[] = []
      const teacherGroups = new Map<string, TQTeacherEmploymentSummary[]>()

      // 按教员分组
      summaries.forEach((summary) => {
        const key = summary.教员姓名
        if (!teacherGroups.has(key)) {
          teacherGroups.set(key, [])
        }
        teacherGroups.get(key)!.push(summary)
      })

      let serialNumber = 1

      // 遍历每个教员
      teacherGroups.forEach((classSummaries, teacherName) => {
        // 按班级排序
        classSummaries.sort((a, b) => {
          if (a.班级名称 < b.班级名称) return -1
          if (a.班级名称 > b.班级名称) return 1
          return 0
        })

        let teacherFirstRow = true
        let teacherSubtotal = {
          targetAverageSalary: 0,
          actualAverageSalary: 0,
          fileCount: 0,
          targetEmploymentCount: 0,
          actualEmploymentCount: 0,
          salaryOverTenThousand: 0,
        }

        // 添加该教员的每个班级数据
        classSummaries.forEach((summary) => {
          const record: TeacherEmploymentSummaryRecord = {
            key: `${summary.汇总ID ?? serialNumber}`,
            summaryId: summary.汇总ID,
            serialNumber: teacherFirstRow ? serialNumber++ : 0,
            teacherName: summary.教员姓名,
            major: summary.专业,
            programLength: summary.学制,
            className: summary.班级名称,
            graduationTime: summary.毕业时间,
            targetAverageSalary: summary.目标平均就业薪资,
            actualAverageSalary: summary.实际平均就业薪资,
            achievementRate: summary.达标率,
            fileCount: summary.目标就业人数, // 使用目标就业人数作为档案人数
            targetEmploymentCount: summary.目标就业人数,
            actualEmploymentCount: summary.实际就业人数,
            employmentRate: summary.就业率,
            salaryOverTenThousand: summary.薪资过万人数,
            campus: normalizeCampusName(summary.神殿),
            rowType: 'data',
          }

          records.push(record)

          // 累计小计数据
          teacherSubtotal.fileCount += summary.目标就业人数 || 0
          teacherSubtotal.targetEmploymentCount += summary.目标就业人数 || 0
          teacherSubtotal.actualEmploymentCount += summary.实际就业人数 || 0
          teacherSubtotal.salaryOverTenThousand += summary.薪资过万人数 || 0

          // 计算加权平均薪资
          const weight = summary.目标就业人数 || 1
          teacherSubtotal.targetAverageSalary += (summary.目标平均就业薪资 || 0) * weight
          teacherSubtotal.actualAverageSalary += (summary.实际平均就业薪资 || 0) * weight

          teacherFirstRow = false
        })

        // 添加教员小计行
        const totalWeight = teacherSubtotal.fileCount || 1
        const avgTargetSalary =
          totalWeight > 0 ? Math.round(teacherSubtotal.targetAverageSalary / totalWeight) : 0
        const avgActualSalary =
          totalWeight > 0 ? Math.round(teacherSubtotal.actualAverageSalary / totalWeight) : 0
        const achievementRate =
          avgTargetSalary > 0 ? Math.round((avgActualSalary / avgTargetSalary) * 100) : 0
        const employmentRate =
          teacherSubtotal.fileCount > 0
            ? Math.round((teacherSubtotal.actualEmploymentCount / teacherSubtotal.fileCount) * 100)
            : 0

        records.push({
          key: `subtotal-${teacherName}`,
          serialNumber: 0,
          teacherName: '',
          major: '',
          programLength: '',
          className: '',
          targetAverageSalary: avgTargetSalary,
          actualAverageSalary: avgActualSalary,
          achievementRate,
          fileCount: teacherSubtotal.fileCount,
          targetEmploymentCount: teacherSubtotal.targetEmploymentCount,
          actualEmploymentCount: teacherSubtotal.actualEmploymentCount,
          employmentRate,
          salaryOverTenThousand: teacherSubtotal.salaryOverTenThousand,
          campus,
          rowType: 'subtotal',
        })
      })

      // 添加总合计行
      const totalSubtotal = {
        targetAverageSalary: 0,
        actualAverageSalary: 0,
        fileCount: 0,
        targetEmploymentCount: 0,
        actualEmploymentCount: 0,
        salaryOverTenThousand: 0,
      }

      records.forEach((record) => {
        if (record.rowType === 'data') {
          totalSubtotal.fileCount += record.fileCount || 0
          totalSubtotal.targetEmploymentCount += record.targetEmploymentCount || 0
          totalSubtotal.actualEmploymentCount += record.actualEmploymentCount || 0
          totalSubtotal.salaryOverTenThousand += record.salaryOverTenThousand || 0

          const weight = record.fileCount || 1
          totalSubtotal.targetAverageSalary += (record.targetAverageSalary || 0) * weight
          totalSubtotal.actualAverageSalary += (record.actualAverageSalary || 0) * weight
        }
      })

      const totalWeight = totalSubtotal.fileCount || 1
      const totalAvgTargetSalary =
        totalWeight > 0 ? Math.round(totalSubtotal.targetAverageSalary / totalWeight) : 0
      const totalAvgActualSalary =
        totalWeight > 0 ? Math.round(totalSubtotal.actualAverageSalary / totalWeight) : 0
      const totalAchievementRate =
        totalAvgTargetSalary > 0
          ? Math.round((totalAvgActualSalary / totalAvgTargetSalary) * 100)
          : 0
      const totalEmploymentRate =
        totalSubtotal.fileCount > 0
          ? Math.round((totalSubtotal.actualEmploymentCount / totalSubtotal.fileCount) * 100)
          : 0

      records.push({
        key: 'total',
        serialNumber: 0,
        teacherName: '',
        major: '',
        programLength: '',
        className: '',
        targetAverageSalary: totalAvgTargetSalary,
        actualAverageSalary: totalAvgActualSalary,
        achievementRate: totalAchievementRate,
        fileCount: totalSubtotal.fileCount,
        targetEmploymentCount: totalSubtotal.targetEmploymentCount,
        actualEmploymentCount: totalSubtotal.actualEmploymentCount,
        employmentRate: totalEmploymentRate,
        salaryOverTenThousand: totalSubtotal.salaryOverTenThousand,
        campus,
        rowType: 'total',
      })

      return records
    } catch (error) {
      console.error('[教质-教员就业汇总] 获取数据失败:', error)
      throw error
    }
  },

  /**
   * 导出教员就业汇总数据为CSV
   * @param campus 神殿名称
   * @param year 年份（可选）
   * @returns Promise<Blob>
   */
  exportTeacherEmploymentSummaryData: async (
    campus: string,
    year?: number
  ): Promise<Blob> => {
    try {
      // 校验神殿参数
      if (!campus || campus.trim() === '') {
        throw new Error('神殿参数不能为空')
      }

      const data = await tqTeacherEmploymentSummaryService.getTeacherEmploymentSummaryData(
        campus,
        year
      )

      // 过滤掉合计行，只导出数据行
      const dataRows = data.filter((record) => record.rowType === 'data')

      const csvContent = [
        '序号,神殿,教员姓名,专业,学制,班级名称,毕业时间,目标平均就业薪资,实际平均就业薪资,达标率,档案人数,目标就业人数,实际就业人数,就业率,薪资过万人数',
        ...dataRows.map((item) =>
          [
            item.serialNumber,
            item.campus,
            item.teacherName,
            item.major,
            item.programLength,
            item.className,
            item.graduationTime || '',
            item.targetAverageSalary || '',
            item.actualAverageSalary || '',
            item.achievementRate || '',
            item.fileCount || '',
            item.targetEmploymentCount || '',
            item.actualEmploymentCount || '',
            item.employmentRate || '',
            item.salaryOverTenThousand || '',
          ].join(',')
        ),
      ].join('\n')

      return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    } catch (error) {
      console.error('[教质-教员就业汇总] 导出数据失败:', error)
      throw error
    }
  },
}

