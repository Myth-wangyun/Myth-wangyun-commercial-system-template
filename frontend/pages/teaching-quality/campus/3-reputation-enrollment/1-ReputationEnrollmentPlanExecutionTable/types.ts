/**
 * 口碑招生计划与执行统计表相关类型定义
 */

// 工作事项枚举
export enum WorkItemType {
  VISIT = 'visit',
  ACTIVITY = 'activity',
  ONLINE = 'online',
}

// 工作自查记录接口
export interface WorkSelfCheckRecord {
  key: string
  category: string // 事件类别：访谈、活动、线上宣传
  detailContent: string // 详细内容
  [key: string]: any // 动态日期字段 1-31日
}

// 访谈记录接口
export interface VisitRecord {
  visitType: string // 访谈类型
  date: string // 日期
  count?: number // 数量
  names?: string // 姓名
  recordFilled?: boolean // 是否填写记录表
}

// 活动记录接口
export interface ActivityRecord {
  activityType: string // 活动类型
  date: string // 日期
  location?: string // 地点
  content?: string // 内容
  hasPromotion?: boolean // 是否有宣传
}

// 线上宣传记录接口
export interface OnlinePromotionRecord {
  onlineType: string // 线上宣传类型：朋友圈、抖音、快手、小红书等
  date: string // 日期
  count: number // 数量
}

// 月度统计接口
export interface MonthlySummary {
  year: number
  month: number
  teacherName: string
  campus: string
  totalVisits: number // 总访谈数
  totalActivities: number // 总活动数
  totalOnlinePromotions: number // 总线上宣传数
  dailyData: {
    [day: number]: {
      visits: number
      activities: number
      onlinePromotions: number
    }
  }
}
