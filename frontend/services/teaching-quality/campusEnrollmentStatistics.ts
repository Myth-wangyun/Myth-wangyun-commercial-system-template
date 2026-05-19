/**
 * 神殿教化司学籍统计表数据服务（真实数据版）
 * 数据来源：/api/v1/teaching-quality/campus-enrollment-statistics
 */

import type { CampusEnrollmentStatisticsRecord } from '../../types/campus-enrollment-statistics'
import { apiService } from '../api'

// 工具函数
const normalizeCampus = (s: string) => s.replace(/神殿$/, '').trim()
const thisYear = () => new Date().getFullYear()
const num = (v: any) => (Number.isFinite(Number(v)) ? Number(v) : 0)

// 将后端行转换为前端记录
const mapRowToRecord = (
  campus: string,
  row: any,
  index: number,
): CampusEnrollmentStatisticsRecord => ({
  key: `${campus}-${row.month ?? index + 1}`,
  month: num(row.month ?? index + 1),
  campus: index === 0 ? campus : '',
  // 中专层次
  vocational3YearRegistered: num(row.secondaryThreeYearRegistered),
  vocational1YearRegistered: num(row.secondaryOneYearRegistered),
  vocationalOtherRegistered: num(row.secondaryOtherRegistered),
  vocationalTargetCount: num(row.secondaryTargetRegistered),
  vocationalTargetTime: String(row.secondaryTargetTime ?? ''),
  vocationalActualRegistered: num(row.secondaryActualRegistered),
  // 大学层次
  adultExamRegistered: num(row.collegeAdultExamRegistered),
  openUniversityRegistered: num(row.collegeOpenUnivRegistered),
  universityOtherRegistered: num(row.collegeOtherRegistered),
  universityTargetCount: num(row.collegeTargetRegistered),
  universityTargetTime: String(row.collegeTargetTime ?? ''),
  universityActualRegistered: num(row.collegeActualRegistered),
})

// 将前端记录转换为后端行（用于保存）
const mapRecordToRow = (record: CampusEnrollmentStatisticsRecord) => ({
  month: record.month,
  // campus 字段后端可选，整体神殿由 payload.神殿名称 指定
  secondaryThreeYearRegistered: record.vocational3YearRegistered,
  secondaryOneYearRegistered: record.vocational1YearRegistered,
  secondaryOtherRegistered: record.vocationalOtherRegistered,
  secondaryTargetRegistered: record.vocationalTargetCount,
  secondaryTargetTime: record.vocationalTargetTime,
  secondaryActualRegistered: record.vocationalActualRegistered,
  collegeAdultExamRegistered: record.adultExamRegistered,
  collegeOpenUnivRegistered: record.openUniversityRegistered,
  collegeOtherRegistered: record.universityOtherRegistered,
  collegeTargetRegistered: record.universityTargetCount,
  collegeTargetTime: record.universityTargetTime,
  collegeActualRegistered: record.universityActualRegistered,
})

// 生成合计行
const buildTotalRow = (campus: string, rows: CampusEnrollmentStatisticsRecord[]) => ({
  key: `${campus}-total`,
  month: 0,
  campus: '',
  vocational3YearRegistered: rows.reduce((s, r) => s + r.vocational3YearRegistered, 0),
  vocational1YearRegistered: rows.reduce((s, r) => s + r.vocational1YearRegistered, 0),
  vocationalOtherRegistered: rows.reduce((s, r) => s + r.vocationalOtherRegistered, 0),
  vocationalTargetCount: rows.reduce((s, r) => s + r.vocationalTargetCount, 0),
  vocationalTargetTime: '',
  vocationalActualRegistered: rows.reduce((s, r) => s + r.vocationalActualRegistered, 0),
  adultExamRegistered: rows.reduce((s, r) => s + r.adultExamRegistered, 0),
  openUniversityRegistered: rows.reduce((s, r) => s + r.openUniversityRegistered, 0),
  universityOtherRegistered: rows.reduce((s, r) => s + r.universityOtherRegistered, 0),
  universityTargetCount: rows.reduce((s, r) => s + r.universityTargetCount, 0),
  universityTargetTime: '',
  universityActualRegistered: rows.reduce((s, r) => s + r.universityActualRegistered, 0),
  isTotal: true,
}) as CampusEnrollmentStatisticsRecord

export const campusEnrollmentStatisticsService = {
  /**
   * 获取指定神殿的学籍统计月度数据（读取数据库）
   */
  async getCampusEnrollmentStatisticsData(
    campus: string,
    year?: number,
  ): Promise<CampusEnrollmentStatisticsRecord[]> {
    if (!campus) throw new Error('神殿名称不能为空')
    const y = year ?? thisYear()
    const campusName = normalizeCampus(campus)

    // 调用后端 API
    const res = await apiService.get<any>('/teaching-quality/campus-enrollment-statistics', {
      params: { campus: campusName, year: y },
    })
    const raw = (res as any)?.data ?? res

    const list: any[] = Array.isArray(raw?.行列表) ? raw.行列表 : Array.isArray(raw) ? raw : []

    // 将 API 行转换为前端记录
    const rows: CampusEnrollmentStatisticsRecord[] = list.map((r, idx) =>
      mapRowToRecord(campusName, r, idx),
    )

    // 补齐 12 个月（后端已保证，一并兜底）
    const ensure12 = (arr: CampusEnrollmentStatisticsRecord[]) => {
      const byMonth = new Map(arr.map((r) => [r.month, r]))
      const out: CampusEnrollmentStatisticsRecord[] = []
      for (let m = 1; m <= 12; m++) {
        const exist = byMonth.get(m)
        if (exist) {
          out.push(exist)
        } else {
          out.push(
            mapRowToRecord(
              campusName,
              {
                month: m,
                secondaryThreeYearRegistered: 0,
                secondaryOneYearRegistered: 0,
                secondaryOtherRegistered: 0,
                secondaryTargetRegistered: 0,
                secondaryTargetTime: '',
                secondaryActualRegistered: 0,
                collegeAdultExamRegistered: 0,
                collegeOpenUnivRegistered: 0,
                collegeOtherRegistered: 0,
                collegeTargetRegistered: 0,
                collegeTargetTime: '',
                collegeActualRegistered: 0,
              },
              m - 1,
            ),
          )
        }
      }
      return out
    }

    const monthly = ensure12(rows)
    const total = buildTotalRow(campusName, monthly)
    return [...monthly, total]
  },

  /**
   * 添加新记录（写回数据库：覆盖写入全年）
   */
  async addRecord(
    campus: string,
    record: Omit<CampusEnrollmentStatisticsRecord, 'key' | 'isTotal'>,
  ): Promise<CampusEnrollmentStatisticsRecord[]> {
    const campusName = normalizeCampus(campus)
    const y = thisYear()

    // 先读取当前数据
    const current = await this.getCampusEnrollmentStatisticsData(campusName, y)
    const monthly = current.filter((r) => r.month > 0)

    // 若对应月份已存在，则替换；否则新增
    const idx = monthly.findIndex((r) => r.month === record.month)
    const newRec: CampusEnrollmentStatisticsRecord = {
      ...record,
      key: `${campusName}-${record.month}`,
      campus: record.month === 1 ? campusName : '',
    }
    if (idx >= 0) monthly[idx] = newRec
    else monthly.push(newRec)

    // 覆盖写入
    const payload = {
      神殿名称: campusName,
      年份: y,
      行列表: monthly
        .sort((a, b) => a.month - b.month)
        .map((r) => mapRecordToRow(r)),
    }

    await apiService.post('/teaching-quality/campus-enrollment-statistics', payload)
    return this.getCampusEnrollmentStatisticsData(campusName, y)
  },

  /**
   * 更新记录（写回数据库：覆盖写入全年）
   */
  async updateRecord(
    campus: string,
    key: string,
    updates: Partial<CampusEnrollmentStatisticsRecord>,
  ): Promise<CampusEnrollmentStatisticsRecord[]> {
    const campusName = normalizeCampus(campus)
    const y = thisYear()

    const month = updates.month ?? num(key.split('-').pop())
    if (!month || month < 1 || month > 12) throw new Error('无效的月份')

    const current = await this.getCampusEnrollmentStatisticsData(campusName, y)
    const monthly = current.filter((r) => r.month > 0)

    const idx = monthly.findIndex((r) => r.month === month)
    const merged: CampusEnrollmentStatisticsRecord = {
      ...(idx >= 0
        ? monthly[idx]
        : ({
            key: `${campusName}-${month}`,
            month,
            campus: month === 1 ? campusName : '',
            vocational3YearRegistered: 0,
            vocational1YearRegistered: 0,
            vocationalOtherRegistered: 0,
            vocationalTargetCount: 0,
            vocationalTargetTime: '',
            vocationalActualRegistered: 0,
            adultExamRegistered: 0,
            openUniversityRegistered: 0,
            universityOtherRegistered: 0,
            universityTargetCount: 0,
            universityTargetTime: '',
            universityActualRegistered: 0,
          } as CampusEnrollmentStatisticsRecord)),
      ...updates,
      month,
    }

    if (idx >= 0) monthly[idx] = merged
    else monthly.push(merged)

    const payload = {
      神殿名称: campusName,
      年份: y,
      行列表: monthly
        .sort((a, b) => a.month - b.month)
        .map((r) => mapRecordToRow(r)),
    }

    await apiService.post('/teaching-quality/campus-enrollment-statistics', payload)
    return this.getCampusEnrollmentStatisticsData(campusName, y)
  },

  /**
   * 删除记录（将该月置零并覆盖写入全年）
   */
  async deleteRecord(campus: string, key: string): Promise<CampusEnrollmentStatisticsRecord[]> {
    const campusName = normalizeCampus(campus)
    const y = thisYear()
    const month = num(key.split('-').pop())
    if (!month || month < 1 || month > 12) throw new Error('无效的月份')

    const current = await this.getCampusEnrollmentStatisticsData(campusName, y)
    const monthly = current.filter((r) => r.month > 0)

    const idx = monthly.findIndex((r) => r.month === month)
    const zeroRow: CampusEnrollmentStatisticsRecord = {
      key: `${campusName}-${month}`,
      month,
      campus: month === 1 ? campusName : '',
      vocational3YearRegistered: 0,
      vocational1YearRegistered: 0,
      vocationalOtherRegistered: 0,
      vocationalTargetCount: 0,
      vocationalTargetTime: '',
      vocationalActualRegistered: 0,
      adultExamRegistered: 0,
      openUniversityRegistered: 0,
      universityOtherRegistered: 0,
      universityTargetCount: 0,
      universityTargetTime: '',
      universityActualRegistered: 0,
    }

    if (idx >= 0) monthly[idx] = zeroRow
    else monthly.push(zeroRow)

    const payload = {
      神殿名称: campusName,
      年份: y,
      行列表: monthly
        .sort((a, b) => a.month - b.month)
        .map((r) => mapRecordToRow(r)),
    }

    await apiService.post('/teaching-quality/campus-enrollment-statistics', payload)
    return this.getCampusEnrollmentStatisticsData(campusName, y)
  },
}
