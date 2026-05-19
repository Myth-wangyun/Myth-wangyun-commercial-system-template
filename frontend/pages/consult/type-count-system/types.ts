/**
 * 咨询量录入系统类型定义
 */

// 咨询量主表
export interface ConsultationObject {
  对象ID: number
  电话列表: string[]
  咨询日期列表: string[]
  最新咨询者姓名: string | null
  最新状态: string | null
  咨询次数: number
  首次登记时间: string | null
  首次分量人: string | null
  首次咨询师: string | null
  最后更新时间: string | null
  神殿: string | null
}

// 咨询量明细
export interface ConsultationRecord {
  记录ID: number
  对象ID: number
  登记日期: string | null
  登记时间: string | null
  分量人: string | null
  咨询师: string | null
  咨询者姓名: string | null
  年龄: string | null
  性别: string | null
  电话: string
  QQ: string | null
  微信: string | null
  抖音: string | null
  快手: string | null
  学历: string | null
  状态: string | null
  位置: string | null
  报名意向: string | null
  咨询类别: string | null
  量来源: string | null
  媒体来源: string | null
  关键字: string | null
  口碑提供人: string | null
  备注: string | null
  神殿: string | null
  录量人: string | null
  创建人ID: number | null
  创建人姓名: string | null
  创建时间: string | null
  更新时间: string | null
  
  // 标记字段
  是否无效量?: number | null
  无效原因?: string | null
  是否不算量?: number | null
  不算量原因?: string | null
  是否上门?: number | null
  上门时间?: string | null
  是否报名?: number | null
  报名时间?: string | null
  是否订座?: number | null
  是否校园量?: number | null
  
  // 上门来源分类标记
  网转上门?: number | null
  网络新媒体?: number | null
  口碑上门?: number | null
  渠道上门?: number | null
  校园新渠道?: number | null
  新媒体来源?: number | null
  
  // 渠道专员/县办/乡办/信息员/网聊专员
  渠道专员?: string | null
  县办?: string | null
  乡办?: string | null
  信息员?: string | null
  网聊专员?: string | null
  咨询结果?: string | null
  咨询次数?: number | null
  
  // 来源类别/平台
  来源类别?: string | null
  平台?: string | null
  
  // 上门情况统计相关
  代咨?: string | null
  就读学校?: string | null
  目前状态?: string | null
  地区?: string | null
  县?: string | null
  报名专业?: string | null
  咨询时间?: string | null
  
  // 报名相关字段
  长期短期?: string | null  // 报名学制：长期、短期、两年制、三年制
  课程?: string | null
  全款?: number | null
  分期?: number | null
  分期备注?: string | null
  注册?: number | null
  贷款?: number | null
  详细地址?: string | null
  
  // 订座相关字段
  订座时间?: string | null
  订座金额?: number | null
  
  // 已交学费（上门和订座涉及交费）
  已交学费?: string | null
  
  // 缴费金额（报名或订座后填写）
  缴费金额?: number | null
  
  // 退费相关字段
  是否退费?: number | null
  退费原因?: string | null
  退费金额?: number | null
  
  // 交接相关字段
  是否已交接?: number | null
  交接时间?: string | null
  交接人?: string | null
  转自咨询师?: string | null
}

// 创建咨询量请求
export interface CreateConsultationRequest {
  对象ID?: number | null
  登记日期: string
  分量人?: string | null
  咨询师?: string | null
  咨询者姓名?: string | null
  年龄?: string | null
  性别?: string | null
  电话: string
  第二电话?: string | null
  QQ?: string | null
  微信?: string | null
  抖音?: string | null
  快手?: string | null
  学历?: string | null
  状态?: string | null
  位置?: string | null
  报名意向?: string | null
  咨询类别?: string | null
  量来源?: string | null
  媒体来源?: string | null
  关键字?: string | null
  口碑提供人?: string | null
  备注?: string | null
  神殿?: string | null
  创建人ID?: number | null
  创建人姓名?: string | null
  
  // 标记字段
  是否无效量?: number | null
  无效原因?: string | null
  是否不算量?: number | null
  不算量原因?: string | null
  是否上门?: number | null
  上门时间?: string | null
  是否报名?: number | null
  报名时间?: string | null
  是否订座?: number | null
  是否校园量?: number | null
  
  // 渠道专员/县办/乡办/信息员/网聊专员
  渠道专员?: string | null
  县办?: string | null
  乡办?: string | null
  信息员?: string | null
  网聊专员?: string | null
  咨询结果?: string | null
  咨询次数?: number | null
  
  // 上门情况统计相关
  代咨?: string | null
  就读学校?: string | null
  目前状态?: string | null
  地区?: string | null
  县?: string | null
  报名专业?: string | null
  咨询时间?: string | null
  
  // 报名相关新字段
  长期短期?: string | null
  课程?: string | null
  全款?: number | null
  分期?: number | null
  分期备注?: string | null
  注册?: number | null
  贷款?: number | null
  详细地址?: string | null
  
  // 订座相关新字段
  订座时间?: string | null
  订座金额?: number | null
  
  // 缴费金额（报名或订座后填写）
  缴费金额?: number | null
  
  // 退费相关新字段
  是否退费?: number | null
  退费原因?: string | null
  退费金额?: number | null
}

// 更新咨询量请求
export interface UpdateConsultationRequest {
  记录ID: number
  登记日期?: string | null
  分量人?: string | null
  咨询师?: string | null
  咨询者姓名?: string | null
  年龄?: string | null
  性别?: string | null
  电话?: string | null
  第二电话?: string | null
  QQ?: string | null
  微信?: string | null
  抖音?: string | null
  快手?: string | null
  学历?: string | null
  状态?: string | null
  位置?: string | null
  报名意向?: string | null
  咨询类别?: string | null
  量来源?: string | null
  媒体来源?: string | null
  关键字?: string | null
  口碑提供人?: string | null
  备注?: string | null
  神殿?: string | null
  
  // 标记字段
  是否无效量?: number | null
  无效原因?: string | null
  是否不算量?: number | null
  不算量原因?: string | null
  是否上门?: number | null
  上门时间?: string | null
  是否报名?: number | null
  报名时间?: string | null
  是否订座?: number | null
  是否校园量?: number | null
  
  // 渠道专员/县办/乡办/信息员/网聊专员
  渠道专员?: string | null
  县办?: string | null
  乡办?: string | null
  信息员?: string | null
  网聊专员?: string | null
  咨询结果?: string | null
  咨询次数?: number | null
  
  // 上门情况统计相关
  代咨?: string | null
  就读学校?: string | null
  目前状态?: string | null
  地区?: string | null
  县?: string | null
  报名专业?: string | null
  咨询时间?: string | null
  
  // 报名相关新字段
  长期短期?: string | null
  课程?: string | null
  全款?: number | null
  分期?: number | null
  分期备注?: string | null
  注册?: number | null
  贷款?: number | null
  详细地址?: string | null
  
  // 订座相关新字段
  订座时间?: string | null
  订座金额?: number | null
  
  // 缴费金额（报名或订座后填写）
  缴费金额?: number | null
  
  // 退费相关新字段
  是否退费?: number | null
  退费原因?: string | null
  退费金额?: number | null
}

// 重量检查响应
export interface DuplicateCheckResponse {
  是否重量: boolean
  对象ID: number | null
  咨询次数: number | null
  最新咨询信息: ConsultationRecord | null
  电话列表: string[] | null
  咨询日期列表: string[] | null
  重量神殿: string | null
  重量类型: string | null  // '电话重复' | '微信重复'
  重量微信: string | null  // 重复的微信号
}

// 分页响应
export interface PaginatedResponse<T> {
  总记录数: number
  总页数: number
  当前页: number
  每页数量: number
  数据列表: T[]
}

// 查询参数
export interface ConsultationQueryParams {
  phone?: string
  name?: string
  distributor?: string
  consultant?: string
  status?: string
  source?: string
  media_source?: string
  specific_source?: string  // 具体来源（第三级）
  category?: string         // 咨询类别
  campus?: string
  education?: string       // 学历
  is_invalid?: number      // 是否无效量 0-有效 1-无效
  is_visit?: number | boolean
  is_enrolled?: number | boolean
  is_reserved?: number | boolean
  is_excluded?: number | boolean
  is_signup_or_reserve?: number  // 是否报名或订座 1-是（用于交接筛选）
  is_handovered?: number   // 是否已交接 0-未交接 1-已交接
  is_unassigned?: number   // 是否未分配咨询师 1-未分配
  keyword?: string         // 全文模糊搜索关键字
  referrer?: string        // 口碑提供人
  start_date?: string
  end_date?: string
  page?: number
  page_size?: number
}

// 录入响应
export interface CreateConsultationResponse {
  success: boolean
  message: string
  is_repeat: boolean
  对象ID: number
  记录ID: number
  咨询次数: number
  录量人: string
}

// 选项类型
export interface OptionsResponse {
  data: string[]
}

// 媒体来源层级节点
export interface MediaHierarchyNode {
  name: string
  children: MediaHierarchyNode[] | string[]
}

// 媒体来源层级响应
export interface MediaHierarchyResponse {
  data: MediaHierarchyNode[]
}

// 完整咨询信息
export interface FullConsultationInfo {
  主表信息: ConsultationObject
  明细列表: ConsultationRecord[]
}

// ==================== 导入相关类型 ====================

// 导入行数据
export interface ImportRow {
  咨询者姓名?: string | null
  电话?: string | null
  微信?: string | null
  口碑提供人?: string | null  // 口碑来源专属
  渠道专员?: string | null     // 渠道来源专属
  县办?: string | null          // 渠道来源专属
  乡办?: string | null          // 渠道来源专属
  信息员?: string | null        // 渠道来源专属
  网聊专员?: string | null     // 网络来源专属
  年龄?: string | null
  性别?: string | null
  学历?: string | null
  位置?: string | null
  报名意向?: string | null
  咨询类别?: string | null
  来源类别?: string | null
  具体来源?: string | null
  关键字?: string | null
  备注?: string | null
  // 所有导入类型通用
  咨询师?: string | null
  // 旧量导入专属字段
  旧量日期?: string | null
  // 任意导入扩展字段
  量来源?: string | null
  分量人?: string | null
  状态?: string | null
  QQ?: string | null
  抖音?: string | null
  快手?: string | null
  就读学校?: string | null
  目前状态?: string | null
  地区?: string | null
  咨询结果?: string | null
  是否上门?: number | null
  是否报名?: number | null
  是否订座?: number | null
  // 报名旧量导入扩展字段
  长期短期?: string | null
  课程?: string | null
  全款?: number | null
  分期?: number | null
  分期备注?: string | null
  注册?: number | null
  贷款?: number | null
  已交学费?: string | null
  详细地址?: string | null
  缴费金额?: number | null
  报名时间?: string | null
  报名专业?: string | null
  // 订座旧量导入扩展字段
  订座时间?: string | null
  订座金额?: number | null
  // 上门旧量导入扩展字段
  上门时间?: string | null
  代咨?: string | null
  网转上门?: number | null
  口碑上门?: number | null
  渠道上门?: number | null
  校园新渠道?: number | null
  新媒体来源?: number | null
  网络新媒体?: number | null
  县?: string | null
}

// 批量导入请求
export interface ImportConsultationRequest {
  量来源: '口碑' | '渠道' | '网络' | '任意' | '旧量' | '报名旧量' | '订座旧量' | '上门旧量'
  数据列表: ImportRow[]
  神殿?: string | null
  导入人ID?: number | null
  导入人姓名?: string | null
}

// 导入结果项
export interface ImportResultItem {
  行号: number
  成功: boolean
  消息: string
  记录ID: number | null
  对象ID: number | null
  是否重量: boolean
}

// 批量导入响应
export interface ImportConsultationResponse {
  成功数量: number
  失败数量: number
  重量数量: number
  结果列表: ImportResultItem[]
}

// 导入模板字段
export interface ImportTemplateField {
  field: string
  required: boolean
  description: string
}

// 导入模板响应
export interface ImportTemplateResponse {
  source_type: string
  fields: ImportTemplateField[]
}

// ==================== 转量相关类型 ====================

// 神殿信息
export interface CampusInfo {
  campus_name: string
  city: string
}

// 转量检查响应
export interface TransferCheckResponse {
  can_transfer: boolean
  message: string
}

// 转量请求
export interface TransferRequest {
  record_id: number
  target_campus: string
  reason?: string
  new_consultant?: string
}

// 转量响应
export interface TransferResponse {
  success: boolean
  message: string
  record_id: number
  transfer_type: string
  transfer_stage: string
  source_campus: string
  target_campus: string
  transfer_time: string
  operator: string
  benefit_info: Record<string, any>
}

// 权益预览响应
export interface BenefitPreviewResponse {
  transfer_type: string
  transfer_stage: string
  benefit_info: Record<string, any>
}

// 转量记录查询参数
export interface TransferRecordsQueryParams {
  source_campus?: string
  target_campus?: string
  transfer_type?: string
  transfer_stage?: string
  start_date?: string
  end_date?: string
  page?: number
  page_size?: number
}

// 转量统计响应
export interface TransferStatisticsResponse {
  campus: string
  period: Record<string, string>
  transfer_out_count: number
  transfer_in_count: number
  by_type: Record<string, number>
  by_stage: Record<string, number>
}

// ==================== 我的咨询量相关类型 ====================

// 咨询量分类
export type ConsultationCategory = '我的私域' | '可再分配' | '可新分配'

// 我的咨询量查询参数
export interface MyConsultationsQueryParams {
  category?: ConsultationCategory
  status?: string
  source?: string
  region?: string
  keyword?: string
  start_date?: string
  end_date?: string
  today_followup?: boolean
  page?: number
  page_size?: number
}

// 我的咨询量响应
export interface MyConsultationsResponse {
  success: boolean
  data: {
    分类?: string
    标记?: string
    说明: string
    神殿?: string
    总记录数: number
    总页数: number
    当前页: number
    每页数量: number
    数据列表: ConsultationRecord[]
    私域数量?: number
    可再分配数量?: number
    可新分配数量?: number
    今日回访数量?: number
  }
}

// 权限检查响应
export interface PermissionCheckResponse {
  success: boolean
  data: {
    对象ID: number
    当前状态: string
    可查看: boolean
    可编辑: boolean
    可追访: boolean
    可重新分配: boolean
    可跨神殿分配: boolean
    原因说明: string
    保护期信息: {
      私域保护期: { 状态: string; 截止时间?: string }
      校域保护期: { 状态: string; 截止时间?: string }
    }
  }
}

// 分量人员视图响应
export interface DistributionViewResponse {
  success: boolean
  data: {
    待再分配列表: ConsultationRecord[]
    可从公域获取列表: ConsultationRecord[]
    即将到期提醒列表: ConsultationRecord[]
    统计: {
      待再分配数量: number
      可从公域获取数量: number
      即将到期数量: number
    }
    权限说明: string
    可执行分配: boolean
  }
}

// ==================== 咨询师转量相关类型 ====================

// 咨询师信息
export interface ConsultantInfo {
  name: string
  campus?: string
  record_count?: number
}

// 批量转量请求
export interface BatchConsultantTransferRequest {
  source_consultant: string
  target_consultant: string
  target_campus?: string
  reason: string
  record_ids?: number[]
}

// 批量转量响应
export interface BatchConsultantTransferResponse {
  success: boolean
  message: string
  total_count: number
  transferred_count: number
  pending_approval_count: number
  failed_count: number
  is_cross_campus: boolean
  approval_required: boolean
}

// 转量预览响应
export interface TransferPreviewResponse {
  success: boolean
  total_count: number
  records: {
    记录ID: number
    电话: string | null
    咨询者姓名: string | null
    神殿: string | null
    登记日期: string | null
    状态: string | null
  }[]
  is_cross_campus: boolean
  approval_required: boolean
}

// 待审批记录
export interface PendingApprovalRecord {
  record_id: number
  phone: string | null
  name: string | null
  source_consultant: string
  target_consultant: string
  source_campus: string
  target_campus: string
  apply_time: string
  applicant: string
  reason: string
}

// 转量审批请求
export interface TransferApprovalRequest {
  record_ids: number[]
  approved: boolean
  opinion: string
}

// 转量审批响应
export interface TransferApprovalResponse {
  success: boolean
  message: string
  approved_count: number
  rejected_count: number
}

// 转量历史记录
export interface TransferRecordHistory {
  record_id: number
  phone: string | null
  name: string | null
  original_consultant: string
  target_consultant: string
  transfer_time: string
  operator: string
  transfer_type: string
  reason: string | null
}

// 转量统计响应
export interface TransferStatisticsData {
  success: boolean
  transfer_out: { consultant: string; count: number }[]
  transfer_in: { consultant: string; count: number }[]
  total_transfers: number
}
