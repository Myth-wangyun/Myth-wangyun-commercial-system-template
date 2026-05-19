import { buildApiUrl } from '@/utils/apiBase'

export type EnrollmentDetailCategory =
  | 'secondary-3year-registered'
  | 'secondary-1year-registered'
  | 'other-secondary-registered'
  | 'adult-exam-registered'
  | 'open-university-registered'
  | 'other-higher-registered'
  | 'secondary-3year-to-register'
  | 'secondary-1year-to-register'
  | 'other-secondary-to-register'
  | 'adult-exam-to-register'
  | 'open-university-to-register'
  | 'other-higher-to-register'

export interface EnrollmentDetailRow {
  campus?: string
  headTeacher?: string
  // 明细页一般都有“年月”选择：已注册类用 year/month 参数；需注册类多数没有 year/month
  // 这里统一用字符串保存，便于从不同字段提取
  registrationTime?: string // e.g. YYYY.MM
  pendingRegistrationTime?: string // e.g. YYYY-MM-DD
}

export interface EnrollmentSummaryMonthlyRow {
  month: number
  secondaryThreeYearRegistered: number
  secondaryOneYearRegistered: number
  secondaryOtherRegistered: number
  secondaryActualRegistered: number
  collegeAdultExamRegistered: number
  collegeOpenUnivRegistered: number
  collegeOtherRegistered: number
  collegeActualRegistered: number
}

export interface EnrollmentPersonalRow {
  name: string // 班主任姓名
  secondaryThreeYearRegistered: number
  secondaryOneYearRegistered: number
  secondaryOtherRegistered: number
  secondaryActualRegistered: number
  collegeAdultExamRegistered: number
  collegeOpenUnivRegistered: number
  collegeOtherRegistered: number
  collegeActualRegistered: number
}

const safeJson = async (res: Response) => {
  const text = await res.text()
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

const parseMonthFromYYYYMM = (v?: string): number | null => {
  if (!v) return null
  // 支持 YYYY.MM / YYYY-MM / YYYY/MM
  const m = v.match(/^(\d{4})[./-](\d{1,2})$/)
  if (!m) return null
  const mm = Number(m[2])
  if (!mm || mm < 1 || mm > 12) return null
  return mm
}

const parseMonthFromDate = (v?: string): number | null => {
  if (!v) return null
  // 支持 YYYY-MM-DD / YYYY/MM/DD
  const m = v.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/)
  if (!m) return null
  const mm = Number(m[2])
  if (!mm || mm < 1 || mm > 12) return null
  return mm
}

const getList = (data: any): any[] => {
  if (!data) return []
  if (Array.isArray(data?.行列表)) return data.行列表
  if (Array.isArray(data)) return data
  return []
}

const fetchRosterList = async (url: string): Promise<EnrollmentDetailRow[]> => {
  const res = await fetch(buildApiUrl(url))
  if (!res.ok) throw new Error(await res.text())
  const data = await safeJson(res)
  const list = getList(data)
  return list as EnrollmentDetailRow[]
}

const ENDPOINTS: Record<EnrollmentDetailCategory, string> = {
  'secondary-3year-registered': '/teaching-quality/secondary-3year-registration-roster',
  'secondary-1year-registered': '/teaching-quality/secondary-1year-registration-roster',
  'other-secondary-registered': '/teaching-quality/other-secondary-registration-roster',
  'adult-exam-registered': '/teaching-quality/adult-exam-registration-roster',
  'open-university-registered': '/teaching-quality/open-university-registration-roster',
  'other-higher-registered': '/teaching-quality/other-higher-education-registration-roster',

  'secondary-3year-to-register': '/teaching-quality/secondary-3year-to-register-roster',
  'secondary-1year-to-register': '/teaching-quality/secondary-1year-to-register-roster',
  'other-secondary-to-register': '/teaching-quality/other-secondary-to-register-roster',
  'adult-exam-to-register': '/teaching-quality/adult-exam-to-register-roster',
  'open-university-to-register': '/teaching-quality/open-university-to-register-roster',
  'other-higher-to-register': '/teaching-quality/other-higher-education-to-register-roster',
}

const isRegisteredCategory = (c: EnrollmentDetailCategory) => c.endsWith('registered')

export const enrollmentStatisticsAutoFill = {
  async fetchAllDetails(params: {
    campus: string
    year: number
    // 允许只拉某几类，便于调试/优化
    categories?: EnrollmentDetailCategory[]
  }): Promise<Record<EnrollmentDetailCategory, EnrollmentDetailRow[]>> {
    const { campus, year } = params
    const categories =
      params.categories ?? (Object.keys(ENDPOINTS) as EnrollmentDetailCategory[])

    const results = await Promise.all(
      categories.map(async (c) => {
        const base = ENDPOINTS[c]
        // 已注册类接口需要 year/month；为了做全年聚合，这里按 1~12 逐月拉取
        if (isRegisteredCategory(c)) {
          const all: EnrollmentDetailRow[] = []
          for (let m = 1; m <= 12; m++) {
            const url = `${base}?campus=${encodeURIComponent(campus)}&year=${year}&month=${m}`
            const list = await fetchRosterList(url)
            // 统一补上 month 信息（靠 registrationTime/pendingRegistrationTime 不一定可靠）
            all.push(...list.map((x) => ({ ...x, registrationTime: `${year}.${String(m).padStart(2, '0')}` })))
          }
          return [c, all] as const
        }

        // 需注册类目前接口只支持 campus
        const url = `${base}?campus=${encodeURIComponent(campus)}`
        const list = await fetchRosterList(url)
        return [c, list] as const
      }),
    )

    return results.reduce((acc, [k, v]) => {
      acc[k] = v
      return acc
    }, {} as Record<EnrollmentDetailCategory, EnrollmentDetailRow[]>)
  },

  computeMonthlySummary(details: Record<EnrollmentDetailCategory, EnrollmentDetailRow[]>): EnrollmentSummaryMonthlyRow[] {
    const init = () =>
      Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        secondaryThreeYearRegistered: 0,
        secondaryOneYearRegistered: 0,
        secondaryOtherRegistered: 0,
        secondaryActualRegistered: 0,
        collegeAdultExamRegistered: 0,
        collegeOpenUnivRegistered: 0,
        collegeOtherRegistered: 0,
        collegeActualRegistered: 0,
      }))

    const rows = init()
    const bump = (month: number, field: keyof EnrollmentSummaryMonthlyRow, n: number) => {
      const idx = month - 1
      if (idx < 0 || idx >= 12) return
      ;(rows[idx][field] as number) += n
    }

    const countByMonth = (
      list: EnrollmentDetailRow[],
      monthGetter: (x: EnrollmentDetailRow) => number | null,
      field: keyof EnrollmentSummaryMonthlyRow,
    ) => {
      for (const item of list) {
        const m = monthGetter(item)
        if (!m) continue
        bump(m, field, 1)
      }
    }

    // 已注册：按我们 fetchAllDetails 预填的 registrationTime(YYYY.MM) 取月
    const monthFromRegistered = (x: EnrollmentDetailRow) =>
      parseMonthFromYYYYMM(x.registrationTime)

    countByMonth(details['secondary-3year-registered'] ?? [], monthFromRegistered, 'secondaryThreeYearRegistered')
    countByMonth(details['secondary-1year-registered'] ?? [], monthFromRegistered, 'secondaryOneYearRegistered')
    countByMonth(details['other-secondary-registered'] ?? [], monthFromRegistered, 'secondaryOtherRegistered')
    countByMonth(details['adult-exam-registered'] ?? [], monthFromRegistered, 'collegeAdultExamRegistered')
    countByMonth(details['open-university-registered'] ?? [], monthFromRegistered, 'collegeOpenUnivRegistered')
    countByMonth(details['other-higher-registered'] ?? [], monthFromRegistered, 'collegeOtherRegistered')

    // 你们汇总表里“实际注册人数”字段，目前没有明确口径。
    // 这里先按“已注册人数合计”自动回填，后续如要改为“当月完成注册人数”，再调整 monthGetter。
    for (const r of rows) {
      r.secondaryActualRegistered =
        r.secondaryThreeYearRegistered + r.secondaryOneYearRegistered + r.secondaryOtherRegistered
      r.collegeActualRegistered =
        r.collegeAdultExamRegistered + r.collegeOpenUnivRegistered + r.collegeOtherRegistered
    }

    return rows
  },

  computePersonalSummary(
    details: Record<EnrollmentDetailCategory, EnrollmentDetailRow[]>,
    homeroomTeachers: string[],
  ): EnrollmentPersonalRow[] {
    const map = new Map<string, EnrollmentPersonalRow>()
    const ensure = (name: string) => {
      if (!map.has(name)) {
        map.set(name, {
          name,
          secondaryThreeYearRegistered: 0,
          secondaryOneYearRegistered: 0,
          secondaryOtherRegistered: 0,
          secondaryActualRegistered: 0,
          collegeAdultExamRegistered: 0,
          collegeOpenUnivRegistered: 0,
          collegeOtherRegistered: 0,
          collegeActualRegistered: 0,
        })
      }
      return map.get(name)!
    }

    // 以配置中心老师列表为准，先建空行
    for (const t of homeroomTeachers) ensure(t)

    const bumpTeacher = (
      list: EnrollmentDetailRow[],
      field: keyof EnrollmentPersonalRow,
    ) => {
      for (const item of list) {
        const teacher = (item.headTeacher ?? '').trim()
        if (!teacher) continue
        const row = ensure(teacher)
        ;(row[field] as number) += 1
      }
    }

    bumpTeacher(details['secondary-3year-registered'] ?? [], 'secondaryThreeYearRegistered')
    bumpTeacher(details['secondary-1year-registered'] ?? [], 'secondaryOneYearRegistered')
    bumpTeacher(details['other-secondary-registered'] ?? [], 'secondaryOtherRegistered')
    bumpTeacher(details['adult-exam-registered'] ?? [], 'collegeAdultExamRegistered')
    bumpTeacher(details['open-university-registered'] ?? [], 'collegeOpenUnivRegistered')
    bumpTeacher(details['other-higher-registered'] ?? [], 'collegeOtherRegistered')

    // 个人表的“实际注册人数”同样先按已注册合计回填
    for (const r of map.values()) {
      r.secondaryActualRegistered =
        r.secondaryThreeYearRegistered + r.secondaryOneYearRegistered + r.secondaryOtherRegistered
      r.collegeActualRegistered =
        r.collegeAdultExamRegistered + r.collegeOpenUnivRegistered + r.collegeOtherRegistered
    }

    return Array.from(map.values())
  },

  // 可选：需注册列表按班主任聚合（当前两张汇总表没有对应列，所以先不写入表格字段）
  computeToRegisterByTeacher(
    details: Record<EnrollmentDetailCategory, EnrollmentDetailRow[]>,
  ): Record<string, number> {
    const out: Record<string, number> = {}
    const all = [
      ...(details['secondary-3year-to-register'] ?? []),
      ...(details['secondary-1year-to-register'] ?? []),
      ...(details['other-secondary-to-register'] ?? []),
      ...(details['adult-exam-to-register'] ?? []),
      ...(details['open-university-to-register'] ?? []),
      ...(details['other-higher-to-register'] ?? []),
    ]
    for (const item of all) {
      const t = (item.headTeacher ?? '').trim()
      if (!t) continue
      out[t] = (out[t] ?? 0) + 1
    }
    return out
  },

  // 可选：需注册列表按月份聚合
  computeToRegisterByMonth(details: Record<EnrollmentDetailCategory, EnrollmentDetailRow[]>): number[] {
    const months = Array.from({ length: 12 }, () => 0)
    const all = [
      ...(details['secondary-3year-to-register'] ?? []),
      ...(details['secondary-1year-to-register'] ?? []),
      ...(details['other-secondary-to-register'] ?? []),
      ...(details['adult-exam-to-register'] ?? []),
      ...(details['open-university-to-register'] ?? []),
      ...(details['other-higher-to-register'] ?? []),
    ]
    for (const item of all) {
      const m = parseMonthFromDate(item.pendingRegistrationTime)
      if (!m) continue
      months[m - 1] += 1
    }
    return months
  },
}

