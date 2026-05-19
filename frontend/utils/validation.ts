// 通用验证函数

// 验证必填字段
export const validateRequired = (value: unknown, fieldName: string): string | null => {
  if (value === null || value === undefined || value === '') {
    return `${fieldName}不能为空`
  }
  return null
}

// 验证字符串长度
export const validateLength = (
  value: string,
  min: number,
  max: number,
  fieldName: string,
): string | null => {
  if (value && (value.length < min || value.length > max)) {
    return `${fieldName}长度必须在${min}-${max}个字符之间`
  }
  return null
}

// 验证数字范围
export const validateRange = (
  value: number,
  min: number,
  max: number,
  fieldName: string,
): string | null => {
  if (value !== null && value !== undefined && (value < min || value > max)) {
    return `${fieldName}必须在${min}-${max}之间`
  }
  return null
}

// 验证邮箱格式
export const validateEmail = (email: string): string | null => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (email && !emailRegex.test(email)) {
    return '邮箱格式不正确'
  }
  return null
}

// 验证手机号格式
export const validatePhone = (phone: string): string | null => {
  const phoneRegex = /^1[3-9]\d{9}$/
  if (phone && !phoneRegex.test(phone)) {
    return '手机号格式不正确'
  }
  return null
}

// 验证身份证号格式（包含校验码验证）
export const validateIdCard = (idCard: string): string | null => {
  if (!idCard) return null
  
  // 15位或18位格式检查
  const idCardRegex = /(^\d{15}$)|(^\d{17}(\d|X|x)$)/
  if (!idCardRegex.test(idCard)) {
    return '身份证号格式不正确'
  }
  
  // 18位身份证校验码验证
  if (idCard.length === 18) {
    const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2]
    const checkCodes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2']
    
    let sum = 0
    for (let i = 0; i < 17; i++) {
      sum += parseInt(idCard[i]) * weights[i]
    }
    
    const checkCode = checkCodes[sum % 11]
    if (idCard[17].toUpperCase() !== checkCode) {
      return '身份证号校验码错误'
    }
  }
  
  return null
}

// 验证QQ号格式
export const validateQQ = (qq: string): string | null => {
  const qqRegex = /^[1-9]\d{4,10}$/
  if (qq && !qqRegex.test(qq)) {
    return 'QQ号格式不正确'
  }
  return null
}

// 验证微信号格式
export const validateWechat = (wechat: string): string | null => {
  const wechatRegex = /^[a-zA-Z][a-zA-Z0-9_-]{5,19}$/
  if (wechat && !wechatRegex.test(wechat)) {
    return '微信号格式不正确'
  }
  return null
}

// 验证百分比
export const validatePercentage = (value: number): string | null => {
  if (value !== null && value !== undefined && (value < 0 || value > 100)) {
    return '百分比必须在0-100之间'
  }
  return null
}

// 验证日期范围
export const validateDateRange = (startDate: string, endDate: string): string | null => {
  if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
    return '开始日期不能晚于结束日期'
  }
  return null
}

// 验证URL格式
export const validateUrl = (url: string): string | null => {
  const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/
  if (url && !urlRegex.test(url)) {
    return 'URL格式不正确'
  }
  return null
}

// 验证密码强度
export const validatePassword = (password: string): string | null => {
  if (!password) return null

  if (password.length < 6) {
    return '密码长度不能少于6位'
  }

  if (password.length > 20) {
    return '密码长度不能超过20位'
  }

  // 至少包含字母和数字
  const hasLetter = /[a-zA-Z]/.test(password)
  const hasNumber = /\d/.test(password)

  if (!hasLetter || !hasNumber) {
    return '密码必须包含字母和数字'
  }

  return null
}

// 验证金额格式
export const validateAmount = (amount: number): string | null => {
  if (amount !== null && amount !== undefined) {
    if (amount < 0) {
      return '金额不能为负数'
    }
    if (amount > 999999999) {
      return '金额不能超过999,999,999'
    }
  }
  return null
}

// 验证年龄
export const validateAge = (age: number): string | null => {
  if (age !== null && age !== undefined) {
    if (age < 16 || age > 100) {
      return '年龄必须在16-100岁之间'
    }
  }
  return null
}

// 验证评分
export const validateScore = (score: number): string | null => {
  if (score !== null && score !== undefined) {
    if (score < 0 || score > 5) {
      return '评分必须在0-5之间'
    }
  }
  return null
}

// 组合验证函数
export const validateFields = (validators: (() => string | null)[]): string[] => {
  const errors: string[] = []
  validators.forEach((validator) => {
    const error = validator()
    if (error) {
      errors.push(error)
    }
  })
  return errors
}
