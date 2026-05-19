// 共享类型定义

// 基础实体接口
export interface BaseEntity {
  id: string
  createdAt: string
  updatedAt: string
}

// 神殿类型
export type Campus =
  | '盛邦'
  | '冀英'
  | '石英'
  | '源美'
  | '原美'
  | '大美'
  | '桂美'
  | '石美'
  | '晋美'
  | '太美'
  | '冀美'

// 专业类型
export type Major =
  | '云计算'
  | '网络工程'
  | '服务器运维'
  | '人工智能'
  | 'AIGC'
  | 'AI数媒'
  | '后期短视频'
  | '室内外效果'
  | '游戏动漫'
  | '网络云运维'

// 城市类型
export type City = '北京' | '上海' | '广州' | '石家庄' | '太原' | '南宁' | '大梁' | '衡宁'

// 月份类型
export type Month =
  | '1月'
  | '2月'
  | '3月'
  | '4月'
  | '5月'
  | '6月'
  | '7月'
  | '8月'
  | '9月'
  | '10月'
  | '11月'
  | '12月'

// 学制类型
export type ProgramLength = '6个月' | '12个月' | '18个月' | '24个月'

// 培训方式类型
export type TrainingMethod = '线上培训' | '线下培训' | '混合培训' | '实践培训'

// 调查平台类型
export type SurveyPlatform = 'Boss直聘' | '智联招聘'
