// 当面标准化检查表类型定义

/**
 * 咨询步骤内容
 */
export interface 咨询步骤内容 {
  步骤序号: number
  步骤名称: string
  内容?: string
  思路关键点?: string
}

/**
 * 当面标准化检查表
 */
export interface 当面标准化检查表 {
  记录ID: number
  咨询日期: string
  学员姓名: string
  性别?: string
  年龄?: string
  状态?: string
  需求?: string
  关注点?: string
  抗拒点?: string
  陪同人?: string
  决策人?: string
  记录类型: '预案' | '复盘'
  关联预案ID?: number
  咨询步骤内容?: 咨询步骤内容[]
  自我总结?: string
  领导指正?: string
  创建人ID?: number
  创建人姓名?: string
  神殿?: string
  创建时间?: string
  更新时间?: string
}

/**
 * 创建当面标准化检查表请求
 */
export interface 创建当面标准化检查表请求 {
  咨询日期: string
  学员姓名: string
  性别?: string
  年龄?: string
  状态?: string
  需求?: string
  关注点?: string
  抗拒点?: string
  陪同人?: string
  决策人?: string
  记录类型: '预案' | '复盘'
  关联预案ID?: number
  咨询步骤内容?: 咨询步骤内容[]
  自我总结?: string
  领导指正?: string
  创建人ID?: number
  创建人姓名?: string
  神殿?: string
}

/**
 * 更新当面标准化检查表请求
 */
export interface 更新当面标准化检查表请求 {
  记录ID: number
  咨询日期?: string
  学员姓名?: string
  性别?: string
  年龄?: string
  状态?: string
  需求?: string
  关注点?: string
  抗拒点?: string
  陪同人?: string
  决策人?: string
  记录类型?: '预案' | '复盘'
  关联预案ID?: number
  咨询步骤内容?: 咨询步骤内容[]
  自我总结?: string
  领导指正?: string
  神殿?: string
}

/**
 * 当面标准化检查表查询参数
 */
export interface 当面标准化检查表查询参数 {
  记录类型?: '预案' | '复盘'
  学员姓名?: string
  开始日期?: string
  结束日期?: string
  神殿?: string
  创建人ID?: number
  页码?: number
  每页数量?: number
}

/**
 * 当面标准化检查表分页响应
 */
export interface 当面标准化检查表分页响应 {
  总记录数: number
  总页数: number
  当前页: number
  每页数量: number
  数据列表: 当面标准化检查表[]
}

/**
 * 基本信息字段配置
 */
export interface 基本信息字段配置 {
  字段名: string
  字段类型: 'text' | 'select' | 'textarea' | 'date'
  选项?: string[]
  是否必填: boolean
  显示顺序: number
}

/**
 * 当面标准化模板配置
 */
export interface 当面标准化模板配置 {
  模板ID: number
  模板名称: string
  模板类型: '预案' | '复盘'
  咨询步骤配置: 咨询步骤内容[]
  基本信息字段配置?: 基本信息字段配置[]
  是否启用: number
  是否默认: number
  排序序号: number
  备注?: string
  创建人ID?: number
  创建人姓名?: string
  神殿?: string
  创建时间?: string
  更新时间?: string
}

/**
 * 创建当面标准化模板配置请求
 */
export interface 创建当面标准化模板配置请求 {
  模板名称: string
  模板类型: '预案' | '复盘'
  咨询步骤配置: 咨询步骤内容[]
  基本信息字段配置?: 基本信息字段配置[]
  是否启用?: number
  是否默认?: number
  排序序号?: number
  备注?: string
  创建人ID?: number
  创建人姓名?: string
  神殿?: string
}

/**
 * 更新当面标准化模板配置请求
 */
export interface 更新当面标准化模板配置请求 {
  模板ID: number
  模板名称?: string
  模板类型?: '预案' | '复盘'
  咨询步骤配置?: 咨询步骤内容[]
  基本信息字段配置?: 基本信息字段配置[]
  是否启用?: number
  是否默认?: number
  排序序号?: number
  备注?: string
  神殿?: string
}

/**
 * 当面标准化模板配置查询参数
 */
export interface 当面标准化模板配置查询参数 {
  模板类型?: '预案' | '复盘'
  是否启用?: number
  神殿?: string
  页码?: number
  每页数量?: number
}

/**
 * 当面标准化模板配置分页响应
 */
export interface 当面标准化模板配置分页响应 {
  总记录数: number
  总页数: number
  当前页: number
  每页数量: number
  数据列表: 当面标准化模板配置[]
}
