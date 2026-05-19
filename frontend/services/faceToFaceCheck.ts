// 当面标准化检查表服务

import type {
  当面标准化检查表,
  创建当面标准化检查表请求,
  更新当面标准化检查表请求,
  当面标准化检查表查询参数,
  当面标准化检查表分页响应,
  当面标准化模板配置,
  创建当面标准化模板配置请求,
  更新当面标准化模板配置请求,
  当面标准化模板配置查询参数,
  当面标准化模板配置分页响应,
  咨询步骤内容,
} from '../types/face-to-face-check'

import { request } from './api'

// ==================== 当面标准化检查表服务 ====================

/**
 * 当面标准化检查表服务
 */
export const faceToFaceCheckService = {
  /**
   * 创建当面标准化检查表
   */
  create: (data: 创建当面标准化检查表请求) => {
    return request<当面标准化检查表>({
      url: '/api/v1/consult/face-to-face-check',
      method: 'POST',
      data,
    })
  },

  /**
   * 获取当面标准化检查表详情
   */
  getById: (recordId: number) => {
    return request<当面标准化检查表>({
      url: `/api/v1/consult/face-to-face-check/${recordId}`,
      method: 'GET',
    })
  },

  /**
   * 获取当面标准化检查表列表
   */
  getList: (params: 当面标准化检查表查询参数) => {
    return request<当面标准化检查表分页响应>({
      url: '/api/v1/consult/face-to-face-check',
      method: 'GET',
      params,
    })
  },

  /**
   * 更新当面标准化检查表
   */
  update: (data: 更新当面标准化检查表请求) => {
    return request<当面标准化检查表>({
      url: '/api/v1/consult/face-to-face-check',
      method: 'PUT',
      data,
    })
  },

  /**
   * 删除当面标准化检查表
   */
  delete: (recordId: number) => {
    return request<{ success: boolean; message: string }>({
      url: `/api/v1/consult/face-to-face-check/${recordId}`,
      method: 'DELETE',
    })
  },

  /**
   * 获取预案的复盘记录
   */
  getReviews: (planId: number) => {
    return request<当面标准化检查表[]>({
      url: `/api/v1/consult/face-to-face-check/plan/${planId}/reviews`,
      method: 'GET',
    })
  },
}

// ==================== 当面标准化模板配置服务 ====================

/**
 * 当面标准化模板配置服务
 */
export const faceToFaceTemplateService = {
  /**
   * 创建当面标准化模板
   */
  create: (data: 创建当面标准化模板配置请求) => {
    return request<当面标准化模板配置>({
      url: '/api/v1/consult/face-to-face-template',
      method: 'POST',
      data,
    })
  },

  /**
   * 获取模板详情
   */
  getById: (templateId: number) => {
    return request<当面标准化模板配置>({
      url: `/api/v1/consult/face-to-face-template/${templateId}`,
      method: 'GET',
    })
  },

  /**
   * 获取模板列表
   */
  getList: (params: 当面标准化模板配置查询参数) => {
    return request<当面标准化模板配置分页响应>({
      url: '/api/v1/consult/face-to-face-template',
      method: 'GET',
      params,
    })
  },

  /**
   * 获取默认模板
   */
  getDefault: (templateType: '预案' | '复盘', campus?: string) => {
    return request<当面标准化模板配置>({
      url: '/api/v1/consult/face-to-face-template/default',
      method: 'GET',
      params: {
        template_type: templateType,
        campus,
      },
    })
  },

  /**
   * 更新模板
   */
  update: (data: 更新当面标准化模板配置请求) => {
    return request<当面标准化模板配置>({
      url: '/api/v1/consult/face-to-face-template',
      method: 'PUT',
      data,
    })
  },

  /**
   * 删除模板
   */
  delete: (templateId: number) => {
    return request<{ success: boolean; message: string }>({
      url: `/api/v1/consult/face-to-face-template/${templateId}`,
      method: 'DELETE',
    })
  },

  /**
   * 设置为默认模板
   */
  setDefault: (templateId: number) => {
    return request<当面标准化模板配置>({
      url: `/api/v1/consult/face-to-face-template/${templateId}/set-default`,
      method: 'PUT',
    })
  },

  /**
   * 初始化默认模板
   */
  initDefault: () => {
    return request<{
      success: boolean
      message: string
      data: Array<{ 预案模板?: number; 复盘模板?: number }>
    }>({
      url: '/api/v1/consult/face-to-face-template/init-default',
      method: 'POST',
    })
  },
}

// ==================== 工具函数 ====================

/**
 * 当面标准化检查表工具函数
 */
export const faceToFaceCheckUtils = {
  /**
   * 格式化日期时间
   */
  formatDateTime: (dateTime: string | undefined): string => {
    if (!dateTime) return '-'
    return new Date(dateTime).toLocaleString('zh-CN')
  },

  /**
   * 格式化日期
   */
  formatDate: (date: string | undefined): string => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('zh-CN')
  },

  /**
   * 获取记录类型颜色
   */
  getRecordTypeColor: (recordType: string): string => {
    const colorMap: Record<string, string> = {
      预案: 'blue',
      复盘: 'green',
    }
    return colorMap[recordType] || 'default'
  },

  /**
   * 获取状态颜色
   */
  getStatusColor: (status: string): string => {
    const colorMap: Record<string, string> = {
      启用: 'green',
      禁用: 'red',
    }
    return colorMap[status] || 'default'
  },

  /**
   * 验证咨询步骤内容
   */
  validateSteps: (steps: 咨询步骤内容[]): boolean => {
    if (!steps || steps.length === 0) return false
    return steps.every(
      (step) => step.步骤序号 !== undefined && step.步骤名称
    )
  },

  /**
   * 导出为图片（需要在前端实现）
   */
  exportToImage: (element: HTMLElement): Promise<void> => {
    // 这里可以使用 html2canvas 等库实现
    return Promise.resolve()
  },

  /**
   * 打印表格
   */
  printTable: (element: HTMLElement): void => {
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.open()
      printWindow.document.write(element.innerHTML)
      printWindow.document.close()
      printWindow.print()
    }
  },
}
