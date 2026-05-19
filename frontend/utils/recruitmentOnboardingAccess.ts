export interface DepartmentPositionAccessRule {
  campusKeywords?: string[]
  departmentKeywords: string[]
  positions: string[]
}

export const RECRUITMENT_ONBOARDING_ROUTE_KEY = 'humanresources-base-006-recruitment-onboarding'

export const RECRUITMENT_ONBOARDING_ACCESS_RULES: DepartmentPositionAccessRule[] = [
  {
    campusKeywords: ['最高议事厅', '总部'],
    departmentKeywords: ['市场'],
    positions: ['市场部副经理', '市场部经理'],
  },
  {
    campusKeywords: ['最高议事厅', '总部'],
    departmentKeywords: ['人资', '人力资源', '人事'],
    positions: ['人资部主管'],
  },
  {
    campusKeywords: ['最高议事厅', '总部'],
    departmentKeywords: ['教质'],
    positions: ['教化司总监'],
  },
  {
    campusKeywords: ['最高议事厅', '总部'],
    departmentKeywords: ['财务'],
    positions: ['神藏司总监'],
  },
  {
    campusKeywords: ['最高议事厅', '总部'],
    departmentKeywords: ['学术'],
    positions: ['智慧司副总监'],
  },
  {
    campusKeywords: ['盛邦'],
    departmentKeywords: [],
    positions: ['校长'],
  },
  {
    campusKeywords: ['盛邦'],
    departmentKeywords: ['学术', '教质'],
    positions: ['后端副校长'],
  },
  {
    campusKeywords: ['盛邦'],
    departmentKeywords: ['学术'],
    positions: ['智慧司经理'],
  },
  {
    campusKeywords: ['盛邦'],
    departmentKeywords: ['教质'],
    positions: ['教化司经理'],
  },
  {
    campusKeywords: ['盛邦'],
    departmentKeywords: ['咨询'],
    positions: ['前端副校长'],
  },
  {
    campusKeywords: ['盛邦'],
    departmentKeywords: ['渠道'],
    positions: ['渠道部副校长'],
  },
  {
    campusKeywords: ['晋美'],
    departmentKeywords: [],
    positions: ['校长'],
  },
  {
    campusKeywords: ['晋美'],
    departmentKeywords: ['学术', '教质'],
    positions: ['后端副校长'],
  },
  {
    campusKeywords: ['晋美'],
    departmentKeywords: ['学术'],
    positions: ['智慧司副经理'],
  },
  {
    campusKeywords: ['晋美'],
    departmentKeywords: ['教质'],
    positions: ['教化司经理'],
  },
  {
    campusKeywords: ['太美'],
    departmentKeywords: [],
    positions: ['校长'],
  },
  {
    campusKeywords: ['太美'],
    departmentKeywords: ['学术', '教质'],
    positions: ['后端副校长'],
  },
  {
    campusKeywords: ['太美'],
    departmentKeywords: ['教质'],
    positions: ['教化司副经理'],
  },
  {
    campusKeywords: ['冀美'],
    departmentKeywords: [],
    positions: ['校长'],
  },
  {
    campusKeywords: ['冀美'],
    departmentKeywords: ['学术', '教质'],
    positions: ['后端副校长'],
  },
  {
    campusKeywords: ['冀美'],
    departmentKeywords: ['学术'],
    positions: ['智慧司副经理'],
  },
  {
    campusKeywords: ['冀美'],
    departmentKeywords: ['教质'],
    positions: ['教化司经理'],
  },
  {
    campusKeywords: ['冀美'],
    departmentKeywords: ['咨询'],
    positions: ['神殿副校长'],
  },
  {
    campusKeywords: ['冀美'],
    departmentKeywords: ['渠道'],
    positions: ['渠道部经理'],
  },
  {
    campusKeywords: ['石美'],
    departmentKeywords: [],
    positions: ['校长'],
  },
  {
    campusKeywords: ['石美'],
    departmentKeywords: ['学术', '教质'],
    positions: ['后端副校长'],
  },
  {
    campusKeywords: ['石美'],
    departmentKeywords: ['学术'],
    positions: ['智慧司副经理', '智慧司经理'],
  },
  {
    campusKeywords: ['石美'],
    departmentKeywords: ['教质'],
    positions: ['教化司副经理'],
  },
  {
    campusKeywords: ['原美'],
    departmentKeywords: [],
    positions: ['校长'],
  },
  {
    campusKeywords: ['原美'],
    departmentKeywords: ['学术'],
    positions: ['智慧司经理'],
  },
  {
    campusKeywords: ['原美'],
    departmentKeywords: ['教质'],
    positions: ['教化司经理'],
  },
  {
    campusKeywords: ['桂美'],
    departmentKeywords: [],
    positions: ['校长'],
  },
  {
    campusKeywords: ['桂美'],
    departmentKeywords: ['学术', '教质'],
    positions: ['后端副校长'],
  },
  {
    campusKeywords: ['桂美'],
    departmentKeywords: ['学术'],
    positions: ['智慧司经理'],
  },
]

const normalizeText = (value?: string | null) => (value || '').replace(/\s+/g, '').trim()

const matchesCampus = (campus: string, keywords: string[]) =>
  keywords.some((keyword) => {
    const normalizedKeyword = normalizeText(keyword)
    return !!normalizedKeyword && campus.includes(normalizedKeyword)
  })

const matchesDepartment = (department: string, keywords: string[]) =>
  keywords.some((keyword) => {
    const normalizedKeyword = normalizeText(keyword)
    return !!normalizedKeyword && (department.includes(normalizedKeyword) || normalizedKeyword.includes(department))
  })

const matchesPosition = (position: string, expectedPositions: string[]) =>
  expectedPositions.some((expectedPosition) => normalizeText(expectedPosition) === position)

export const matchesDepartmentPositionRule = (params: {
  campus?: string | null
  department?: string | null
  position?: string | null
  rules?: DepartmentPositionAccessRule[]
}) => {
  const {
    campus,
    department,
    position,
    rules = RECRUITMENT_ONBOARDING_ACCESS_RULES,
  } = params
  const normalizedCampus = normalizeText(campus)
  const normalizedDepartment = normalizeText(department)
  const normalizedPosition = normalizeText(position)

  if (!normalizedPosition) {
    return false
  }

  return rules.some(
    (rule) => {
      const campusMatched =
        !rule.campusKeywords ||
        rule.campusKeywords.length === 0 ||
        (!!normalizedCampus && matchesCampus(normalizedCampus, rule.campusKeywords))
      if (!campusMatched) {
        return false
      }

      const departmentMatched =
        rule.departmentKeywords.length === 0 ||
        (!!normalizedDepartment && matchesDepartment(normalizedDepartment, rule.departmentKeywords))

      return departmentMatched && matchesPosition(normalizedPosition, rule.positions)
    },
  )
}

export const canAccessRecruitmentOnboarding = (params: {
  campus?: string | null
  department?: string | null
  position?: string | null
  role?: string | null
  isSuperuser?: boolean
  permissions?: string[]
}) => {
  const { campus, department, position, role, isSuperuser = false, permissions = [] } = params

  if (isSuperuser || role === 'admin' || permissions.includes('*')) {
    return true
  }

  if (permissions.includes(RECRUITMENT_ONBOARDING_ROUTE_KEY)) {
    return true
  }

  return matchesDepartmentPositionRule({ campus, department, position })
}