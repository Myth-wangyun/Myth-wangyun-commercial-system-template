/**
 * 当面标准化检查表 API 服务
 */

import { api } from '@/services/api';

export interface FaceToFaceCheck {
  记录ID?: number;
  咨询日期: string;
  学员姓名: string;
  性别?: string;
  年龄?: string;
  状态?: string;
  需求?: string;
  关注点?: string;
  抗拒点?: string;
  陪同人?: string;
  决策人?: string;
  地区?: string;
  记录类型: '预案' | '复盘';
  关联预案ID?: number;
  咨询步骤内容?: any[];
  自我总结?: string;
  领导指正?: string;
  创建人ID?: number;
  创建人姓名?: string;
  神殿?: string;
  创建时间?: string;
  更新时间?: string;
}

export interface TemplateConfig {
  模板ID?: number;
  模板名称: string;
  模板类型: '预案' | '复盘';
  咨询步骤配置: any[];
  基本信息字段配置?: any[];
  是否启用?: number;
  是否默认?: number;
  排序序号?: number;
  备注?: string;
  创建人ID?: number;
  创建人姓名?: string;
  神殿?: string;
  创建时间?: string;
  更新时间?: string;
}

export interface CheckQueryParams {
  record_type?: string;
  student_name?: string;
  start_date?: string;
  end_date?: string;
  campus?: string;
  creator_id?: number;
  page?: number;
  page_size?: number;
}

export interface TemplateQueryParams {
  template_type?: string;
  is_enabled?: number;
  campus?: string;
  page?: number;
  page_size?: number;
}

// 通用响应类型
interface ApiResponse<T = any> {
  code: number;
  message?: string;
  data: T;
}

// ==================== 检查表相关接口 ====================

/**
 * 创建当面标准化检查表记录
 */
export function createCheck(data: FaceToFaceCheck): Promise<ApiResponse<FaceToFaceCheck>> {
  return api.request({
    url: '/consult/face-to-face/check/create',
    method: 'post',
    data,
  }).then(res => res.data);
}

/**
 * 获取当面标准化检查表记录详情
 */
export function getCheck(recordId: number): Promise<ApiResponse<FaceToFaceCheck>> {
  return api.request({
    url: `/consult/face-to-face/check/${recordId}`,
    method: 'get',
  }).then(res => res.data);
}

/**
 * 获取当面标准化检查表记录列表
 */
export function getCheckList(params: CheckQueryParams): Promise<ApiResponse<{数据列表: FaceToFaceCheck[], 总记录数: number}>> {
  return api.request({
    url: '/consult/face-to-face/check/list',
    method: 'get',
    params,
  }).then(res => res.data);
}

/**
 * 更新当面标准化检查表记录
 */
export function updateCheck(data: FaceToFaceCheck): Promise<ApiResponse<FaceToFaceCheck>> {
  return api.request({
    url: '/consult/face-to-face/check/update',
    method: 'put',
    data,
  }).then(res => res.data);
}

/**
 * 删除当面标准化检查表记录
 */
export function deleteCheck(recordId: number): Promise<ApiResponse<void>> {
  return api.request({
    url: `/consult/face-to-face/check/${recordId}`,
    method: 'delete',
  }).then(res => res.data);
}

// ==================== 模板配置相关接口 ====================

/**
 * 创建当面标准化模板配置
 */
export function createTemplate(data: TemplateConfig): Promise<ApiResponse<TemplateConfig>> {
  return api.request({
    url: '/consult/face-to-face/template/create',
    method: 'post',
    data,
  }).then(res => res.data);
}

/**
 * 获取模板详情
 */
export function getTemplate(templateId: number): Promise<ApiResponse<TemplateConfig>> {
  return api.request({
    url: `/consult/face-to-face/template/${templateId}`,
    method: 'get',
  }).then(res => res.data);
}

/**
 * 获取模板列表
 */
export function getTemplateList(params: TemplateQueryParams): Promise<ApiResponse<{数据列表: TemplateConfig[], 总记录数: number}>> {
  return api.request({
    url: '/consult/face-to-face/template/list',
    method: 'get',
    params,
  }).then(res => res.data);
}

/**
 * 获取默认模板
 */
export function getDefaultTemplate(templateType: '预案' | '复盘', campus?: string): Promise<ApiResponse<TemplateConfig>> {
  return api.request({
    url: `/consult/face-to-face/template/default/${templateType}`,
    method: 'get',
    params: { campus },
  }).then(res => res.data);
}

/**
 * 更新模板
 */
export function updateTemplate(data: TemplateConfig): Promise<ApiResponse<TemplateConfig>> {
  return api.request({
    url: '/consult/face-to-face/template/update',
    method: 'put',
    data,
  }).then(res => res.data);
}

/**
 * 删除模板
 */
export function deleteTemplate(templateId: number): Promise<ApiResponse<void>> {
  return api.request({
    url: `/consult/face-to-face/template/${templateId}`,
    method: 'delete',
  }).then(res => res.data);
}

/**
 * 设置为默认模板
 */
export function setDefaultTemplate(templateId: number): Promise<ApiResponse<void>> {
  return api.request({
    url: `/consult/face-to-face/template/${templateId}/set-default`,
    method: 'post',
  }).then(res => res.data);
}

