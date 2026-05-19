/**
 * 口碑招生关键点结果汇总表常量配置
 */

// 线上宣传平台配置
export const ONLINE_PLATFORMS = [
  { key: 'wechatMoments', label: '朋友圈数量' },
  { key: 'douyin', label: '抖音数量' },
  { key: 'kuaishou', label: '快手数量' },
  { key: 'xiaohongshu', label: '小红书数量' },
] as const

// 访谈类型配置
export const INTERVIEW_TYPES = [
  { key: 'currentStudentInterview', label: '在校生访谈' },
  { key: 'graduateInterview', label: '毕业生访谈' },
  { key: 'parentInterview', label: '家长访谈' },
] as const

// 活动类型配置
export const ACTIVITY_TYPES = [
  { key: 'activityCount', label: '活动次数' },
  { key: 'competitionCount', label: '比赛次数' },
  { key: 'examRegistrationCount', label: '送考报名次' },
] as const

// 表格配置
export const TABLE_CONFIG = {
  SERIAL_NUMBER_WIDTH: 60,
  CAMPUS_WIDTH: 100,
  TEACHER_NAME_WIDTH: 120,
  PLATFORM_COLUMN_WIDTH: 100,
  INTERVIEW_COLUMN_WIDTH: 110,
  ACTIVITY_COLUMN_WIDTH: 100,
  TOTAL_COLUMN_WIDTH: 80,
  ACTION_COLUMN_WIDTH: 80,
} as const

// 消息提示
export const MESSAGES = {
  REFRESH_SUCCESS: '数据已刷新',
  SAVE_SUCCESS: '保存成功',
  EXPORT_DEVELOPING: '导出功能开发中...',
  ADD_ROW_SUCCESS: '已添加新行',
  DELETE_SUCCESS: '已删除',
  DELETE_CONFIRM: '确定要删除这条记录吗？',
} as const

// 年份选项
export const YEAR_OPTIONS = [
  { value: 2023, label: '2023年' },
  { value: 2024, label: '2024年' },
  { value: 2025, label: '2025年' },
] as const

// 月份选项
export const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: `${i + 1}月`,
}))
