/**
 * 口碑招生计划与执行统计表常量配置
 */

// 工作类别
export const WORK_CATEGORIES = {
  VISIT: '访谈',
  ACTIVITY: '活动',
  ONLINE: '线上宣传',
} as const

// 访谈类型配置
export const VISIT_TYPES = [
  { key: 'newStudentCount', label: '访谈新生数量', countable: true },
  { key: 'newStudentNames', label: '新生姓名', countable: false },
  { key: 'newStudentRecordFilled', label: '是否填写访谈记录表', countable: false },
  { key: 'oldStudentCount', label: '访谈老生数量', countable: true },
  { key: 'oldStudentNames', label: '老生姓名', countable: false },
  { key: 'oldStudentRecordFilled', label: '是否填写访谈记录表', countable: false },
  { key: 'graduateCount', label: '访谈毕业生数量', countable: true },
  { key: 'graduateNames', label: '毕业生姓名', countable: false },
  { key: 'graduateRecordFilled', label: '是否填写访谈记录表', countable: false },
  { key: 'parentCount', label: '家长访谈数量', countable: true },
  { key: 'parentNames', label: '家长访谈姓名', countable: false },
  { key: 'parentRecordFilled', label: '是否填写访谈记录表', countable: false },
] as const

// 活动类型配置
export const ACTIVITY_TYPES = [
  { key: 'timeLocation', label: '活动时间/地点', countable: false },
  { key: 'content', label: '活动内容', countable: false },
  { key: 'hasPromotion', label: '是否有宣传', countable: false },
  { key: 'competitionCount', label: '比赛次数', countable: true },
  { key: 'goodNewsCount', label: '送喜报人次', countable: true },
] as const

// 线上宣传类型配置
export const ONLINE_TYPES = [
  { key: 'wechatMoments', label: '朋友圈数量', countable: true },
  { key: 'douyin', label: '抖音数量', countable: true },
  { key: 'kuaishou', label: '快手数量', countable: true },
  { key: 'xiaohongshu', label: '小红书数量', countable: true },
  { key: 'others', label: '……', countable: false },
  { key: 'dailyTotal', label: '当天合计', countable: true },
] as const

// 年份选项：动态生成，包含今年及过去三年
const currentYear = new Date().getFullYear()
export const YEAR_OPTIONS = Array.from({ length: 4 }, (_, i) => {
  const year = currentYear - i
  return { value: year, label: `${year}年` }
})

// 月份选项
export const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: `${i + 1}月`,
}))

// 表格配置
export const TABLE_CONFIG = {
  CATEGORY_COLUMN_WIDTH: 80,
  DETAIL_COLUMN_WIDTH: 180,
  DAY_COLUMN_WIDTH: 100,
  TOTAL_COLUMN_WIDTH: 80,
  SCROLL_Y_HEIGHT: 600,
} as const

// 提示文本
export const TIPS = {
  GOAL: '口碑目标：监督所有班主任的口碑自查表，每日做汇报',
  NOTE: '备注说明：学员和家长访谈主要汇总访谈目标，注意工作自查表的方式每日填报，完成当日工作汇报',
} as const

// 消息提示
export const MESSAGES = {
  REFRESH_SUCCESS: '数据已刷新',
  SAVE_SUCCESS: '保存成功',
  EXPORT_DEVELOPING: '导出功能开发中...',
  DELETE_CONFIRM: '确定要删除这条记录吗？',
  DELETE_SUCCESS: '删除成功',
  ADD_SUCCESS: '添加成功',
  ADD_DUPLICATE: '该详细内容已存在，请勿重复添加',
} as const
