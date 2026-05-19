/**
 * 菜单访问权限诊断工具
 * 用于诊断用户无法访问菜单的问题
 */

interface DiagnosisResult {
  issue: string
  severity: 'error' | 'warning' | 'info'
  message: string
  solution: string
}

/**
 * 诊断用户菜单访问权限问题
 */
export function diagnoseMenuAccess(
  userDepartment: string | null | undefined,
  userPosition: string | null | undefined,
  isAdmin: boolean
): DiagnosisResult[] {
  const results: DiagnosisResult[] = []

  // 检查1: 部门字段是否为 null 或 undefined
  if (!userDepartment) {
    results.push({
      issue: '部门字段为空',
      severity: 'error',
      message: '用户的部门字段为 null 或 undefined，这会导致无法正确过滤菜单',
      solution: '请在员工管理页面设置用户的部门信息'
    })
  }

  // 检查2: 部门字段是否有前后空格
  if (userDepartment && userDepartment !== userDepartment.trim()) {
    results.push({
      issue: '部门字段包含空格',
      severity: 'warning',
      message: `部门字段包含前后空格: "${userDepartment}"，这可能导致匹配失败`,
      solution: '已自动处理空格，但如果问题仍然存在，请检查数据库中的部门字段值'
    })
  }

  // 检查3: 部门字段值是否正确
  const normalizedDept = userDepartment?.trim()
  if (normalizedDept && normalizedDept !== '智慧司' && normalizedDept !== '教化司') {
    results.push({
      issue: '部门字段值不正确',
      severity: 'warning',
      message: `部门字段值为 "${normalizedDept}"，可能不是标准的部门名称`,
      solution: '请确认数据库中的部门字段值是否为 "智慧司" 或 "教化司"'
    })
  }

  // 检查4: 职位是否为高级职位（可以访问所有菜单）
  if (userPosition === '董事长' || userPosition === '学术总监') {
    results.push({
      issue: '高级职位',
      severity: 'info',
      message: `用户职位为 "${userPosition}"，应该可以访问所有菜单`,
      solution: '如果仍然无法访问，可能是权限配置问题，请检查权限设置'
    })
  }

  // 检查5: 是否为管理员
  if (isAdmin) {
    results.push({
      issue: '管理员账户',
      severity: 'info',
      message: '用户是管理员，应该可以访问所有菜单',
      solution: '如果仍然无法访问，可能是前端缓存问题，请清除缓存后重新登录'
    })
  }

  return results
}

/**
 * 在浏览器控制台打印诊断结果
 */
export function printDiagnosis(
  userDepartment: string | null | undefined,
  userPosition: string | null | undefined,
  isAdmin: boolean
): void {
  console.group('🔍 菜单访问权限诊断')
  console.log('用户信息:', {
    department: userDepartment,
    position: userPosition,
    isAdmin
  })

  const results = diagnoseMenuAccess(userDepartment, userPosition, isAdmin)

  if (results.length === 0) {
    console.log('✅ 未发现明显问题')
  } else {
    results.forEach((result, index) => {
      const icon = result.severity === 'error' ? '❌' : result.severity === 'warning' ? '⚠️' : 'ℹ️'
      console.group(`${icon} ${result.issue} (${index + 1}/${results.length})`)
      console.log('问题:', result.message)
      console.log('解决方案:', result.solution)
      console.groupEnd()
    })
  }

  console.groupEnd()
}

/**
 * 检查菜单过滤逻辑
 */
export function checkMenuFilter(
  userDepartment: string | null | undefined,
  menuDepartment: 'academic' | 'teaching_quality' | 'common' | undefined
): boolean {
  const normalizedDept = userDepartment?.trim()

  if (!normalizedDept) {
    return true // 无部门信息，默认显示（向后兼容）
  }

  if (menuDepartment === 'common') {
    return true // common 所有人可访问
  }

  if (normalizedDept === '智慧司' && menuDepartment === 'academic') {
    return true
  }

  if (normalizedDept === '教化司' && menuDepartment === 'teaching_quality') {
    return true
  }

  return false
}
