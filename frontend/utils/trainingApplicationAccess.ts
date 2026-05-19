import {
  matchesDepartmentPositionRule,
  type DepartmentPositionAccessRule,
} from './recruitmentOnboardingAccess'

export const TRAINING_APPLICATION_ROUTE_KEY = 'humanresources-base-006-training-management'

export const TRAINING_APPLICATION_ACCESS_RULES: DepartmentPositionAccessRule[] = [
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
    positions: ['智慧司副总监', '学术副总监', '学术总监', '智慧司总监'],
  },
  {
    campusKeywords: ['最高议事厅', '总部'],
    departmentKeywords: ['运营'],
    positions: ['运营总监', '运营部总监'],
  },
  {
    campusKeywords: ['盛邦'],
    departmentKeywords: [],
    positions: ['校长'],
  },
  {
    campusKeywords: ['盛邦'],
    departmentKeywords: ['后端'],
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
    campusKeywords: ['冀美'],
    departmentKeywords: [],
    positions: ['校长'],
  },
  {
    campusKeywords: ['冀美'],
    departmentKeywords: ['后端'],
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
    campusKeywords: ['太美'],
    departmentKeywords: [],
    positions: ['校长'],
  },
  {
    campusKeywords: ['太美'],
    departmentKeywords: ['后端'],
    positions: ['后端副校长'],
  },
  {
    campusKeywords: ['太美'],
    departmentKeywords: ['教质'],
    positions: ['教化司副经理'],
  },
  {
    campusKeywords: ['桂美'],
    departmentKeywords: [],
    positions: ['校长'],
  },
  {
    campusKeywords: ['桂美'],
    departmentKeywords: ['后端'],
    positions: ['后端副校长'],
  },
  {
    campusKeywords: ['桂美'],
    departmentKeywords: ['学术'],
    positions: ['智慧司经理'],
  },
  {
    campusKeywords: ['晋美'],
    departmentKeywords: [],
    positions: ['校长'],
  },
  {
    campusKeywords: ['晋美'],
    departmentKeywords: ['后端'],
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
]

export const canAccessTrainingApplication = (params: {
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

  if (permissions.includes(TRAINING_APPLICATION_ROUTE_KEY)) {
    return true
  }

  return matchesDepartmentPositionRule({
    campus,
    department,
    position,
    rules: TRAINING_APPLICATION_ACCESS_RULES,
  })
}