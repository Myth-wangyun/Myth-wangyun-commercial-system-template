// 格式化工具函数

// 格式化货币
export const formatCurrency = (amount: number | string): string => {
  if (amount === null || amount === undefined || amount === '') {
    return '¥0.00'
  }

  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(num)) {
    return '¥0.00'
  }

  return `¥${num.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

// 格式化数字
export const formatNumber = (num: number | string): string => {
  if (num === null || num === undefined || num === '') {
    return '0'
  }

  const number = typeof num === 'string' ? parseFloat(num) : num
  if (isNaN(number)) {
    return '0'
  }

  return number.toLocaleString('zh-CN')
}

// 格式化百分比
export const formatPercentage = (value: number | string, decimals: number = 1): string => {
  if (value === null || value === undefined || value === '') {
    return '0%'
  }

  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) {
    return '0%'
  }

  return `${num.toFixed(decimals)}%`
}

// 格式化日期
export const formatDate = (date: string | Date, format: string = 'YYYY-MM-DD'): string => {
  if (!date) return ''

  const d = new Date(date)
  if (isNaN(d.getTime())) return ''

  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')

  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
}

// 格式化日期时间
export const formatDateTime = (date: string | Date): string => {
  return formatDate(date, 'YYYY-MM-DD HH:mm:ss')
}

// 格式化时间
export const formatTime = (date: string | Date): string => {
  return formatDate(date, 'HH:mm:ss')
}

// 格式化文件大小
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

// 格式化时长（秒）
export const formatDuration = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds}秒`
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return remainingSeconds > 0 ? `${minutes}分${remainingSeconds}秒` : `${minutes}分钟`
  } else {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return minutes > 0 ? `${hours}小时${minutes}分钟` : `${hours}小时`
  }
}

// 格式化手机号
export const formatPhone = (phone: string): string => {
  if (!phone) return ''

  // 移除所有非数字字符
  const cleaned = phone.replace(/\D/g, '')

  // 如果是11位手机号，格式化为 138-0000-0000
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`
  }

  return phone
}

// 格式化身份证号
export const formatIdCard = (idCard: string): string => {
  if (!idCard) return ''

  // 移除所有非数字和X字符
  const cleaned = idCard.replace(/[^\dXx]/g, '')

  // 如果是18位身份证号，格式化为 123456-19900101-123X
  if (cleaned.length === 18) {
    return `${cleaned.slice(0, 6)}-${cleaned.slice(6, 14)}-${cleaned.slice(14)}`
  }

  return idCard
}

// 格式化银行卡号
export const formatBankCard = (cardNumber: string): string => {
  if (!cardNumber) return ''

  // 移除所有非数字字符
  const cleaned = cardNumber.replace(/\D/g, '')

  // 每4位添加一个空格
  return cleaned.replace(/(\d{4})(?=\d)/g, '$1 ')
}

// 格式化姓名（脱敏）
export const formatName = (name: string): string => {
  if (!name) return ''

  if (name.length === 1) {
    return name
  } else if (name.length === 2) {
    return `${name[0]}*`
  } else {
    return `${name[0]}${'*'.repeat(name.length - 2)}${name[name.length - 1]}`
  }
}

// 格式化手机号（脱敏）
export const formatPhoneMask = (phone: string): string => {
  if (!phone) return ''

  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}****${cleaned.slice(7)}`
  }

  return phone
}

// 格式化身份证号（脱敏）
export const formatIdCardMask = (idCard: string): string => {
  if (!idCard) return ''

  const cleaned = idCard.replace(/[^\dXx]/g, '')
  if (cleaned.length === 18) {
    return `${cleaned.slice(0, 6)}********${cleaned.slice(14)}`
  }

  return idCard
}

// 格式化地址（脱敏）
export const formatAddressMask = (address: string): string => {
  if (!address) return ''

  if (address.length <= 6) {
    return address
  }

  const start = address.slice(0, 3)
  const end = address.slice(-3)
  const middle = '*'.repeat(Math.min(address.length - 6, 6))

  return `${start}${middle}${end}`
}

// 格式化状态文本
export const formatStatus = (status: string, statusMap: Record<string, string>): string => {
  return statusMap[status] || status
}

// 格式化状态颜色
export const formatStatusColor = (status: string, colorMap: Record<string, string>): string => {
  return colorMap[status] || '#666'
}

// 格式化评分星级
export const formatRating = (rating: number, maxRating: number = 5): string => {
  if (rating < 0 || rating > maxRating) return ''

  const fullStars = Math.floor(rating)
  const hasHalfStar = rating % 1 >= 0.5
  const emptyStars = maxRating - fullStars - (hasHalfStar ? 1 : 0)

  return '★'.repeat(fullStars) + (hasHalfStar ? '☆' : '') + '☆'.repeat(emptyStars)
}

// 格式化相对时间
export const formatRelativeTime = (date: string | Date): string => {
  if (!date) return ''

  const now = new Date()
  const target = new Date(date)
  const diff = now.getTime() - target.getTime()

  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const months = Math.floor(days / 30)
  const years = Math.floor(days / 365)

  if (years > 0) return `${years}年前`
  if (months > 0) return `${months}个月前`
  if (days > 0) return `${days}天前`
  if (hours > 0) return `${hours}小时前`
  if (minutes > 0) return `${minutes}分钟前`
  return '刚刚'
}
