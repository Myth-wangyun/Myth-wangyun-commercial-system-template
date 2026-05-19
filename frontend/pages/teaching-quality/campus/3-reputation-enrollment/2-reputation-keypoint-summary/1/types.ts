/**
 * 口碑招生关键点结果汇总表类型定义
 */

// 口碑招生关键点记录接口
export interface ReputationKeypointRecord {
  key: string
  serialNumber: number // 序号
  campus: string // 神殿
  teacherName: string // 班主任姓名

  // 线上宣传数量
  wechatMoments: number // 朋友圈数量
  douyin: number // 抖音数量
  kuaishou: number // 快手数量
  xiaohongshu: number // 小红书数量
  onlineTotal: number // 线上宣传合计

  // 学员访谈数量
  currentStudentInterview: number // 在校生访谈
  graduateInterview: number // 毕业生访谈
  parentInterview: number // 家长访谈
  interviewTotal: number // 访谈合计

  // 活动数量
  activityCount: number // 活动次数
  competitionCount: number // 比赛次数
  examRegistrationCount: number // 送考报名次
  activityTotal: number // 活动合计

  rowType?: 'data' | 'total' // 行类型
}

// 月度汇总接口
export interface MonthlyKeypointSummary {
  year: number
  month: number
  campus: string
  records: ReputationKeypointRecord[]
  totalOnlinePromotion: number // 线上宣传总计
  totalInterview: number // 访谈总计
  totalActivity: number // 活动总计
}

// 统计数据接口
export interface KeypointStatistics {
  totalOnlinePromotion: number // 线上宣传总数
  totalInterview: number // 访谈总数
  totalActivity: number // 活动总数
  teacherCount: number // 参与教师数
  avgOnlinePerTeacher: number // 人均线上宣传
  avgInterviewPerTeacher: number // 人均访谈
  avgActivityPerTeacher: number // 人均活动
}
