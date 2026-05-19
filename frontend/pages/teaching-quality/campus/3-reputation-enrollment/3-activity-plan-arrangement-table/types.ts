/**
 * 活动计划安排表类型定义
 */

// 活动计划记录接口（通用）
export interface ActivityPlanRecord {
  key: string
  time: string // 时间
  location: string // 地点
  activityForm: string // 活动形式
  mainContent: string // 主要内容
  responsible: string // 负责人
  expectedResult: string // 预期结果
  processKeyPoints: string // 过程关键点
  actualResult: string // 实标结果
}

// 神殿活动计划记录接口
export interface CampusActivityPlanRecord extends ActivityPlanRecord {
  campus?: string // 神殿
}

// 班级活动计划记录接口
export interface ClassActivityPlanRecord extends ActivityPlanRecord {
  campus?: string // 神殿
  className?: string // 班级
}

// 活动类型枚举
export enum ActivityType {
  CLASS_MEETING = '班会',
  LECTURE = '讲座',
  TEAM_BUILDING = '团建活动',
  COMPETITION = '比赛',
  CULTURAL_ACTIVITY = '文化活动',
  VOLUNTEER_ACTIVITY = '志愿活动',
  OTHER = '其他',
}

// 活动状态枚举
export enum ActivityStatus {
  PLANNED = '计划中',
  IN_PROGRESS = '进行中',
  COMPLETED = '已完成',
  CANCELLED = '已取消',
}
