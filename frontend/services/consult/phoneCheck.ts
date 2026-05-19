/**
 * 电话标准化检查表 API 服务
 */

import request from '../api';

export interface SubSubItem {
  名称: string;
  是否必选?: boolean;
  可编辑?: boolean;
  完成情况?: boolean;
}

export interface SubItem {
  名称: string;
  是否必选?: boolean;
  次子结构?: SubSubItem[];
  完成情况?: boolean;
}

export interface StepItem {
  步骤: string;
  子结构?: SubItem[];
  完成情况?: boolean;
  完成情况对比?: boolean;
  备注?: string;
}

export interface PhoneCheck {
  记录ID?: number;
  神殿?: string;
  咨询师: string;
  审核人?: string;
  日期: string;
  学员姓名?: string;
  联系方式?: string;
  检查内容?: any[];
  总结?: string;
  备注?: string;
  总分?: number;
  得分?: number;
  创建人ID?: number;
  创建人姓名?: string;
  创建时间?: string;
  更新时间?: string;
}

export interface PhoneTemplate {
  模板ID?: number;
  模板名称: string;
  模板内容: any[];
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
  consultant?: string;
  campus?: string;
  auditor?: string;
  start_date?: string;
  end_date?: string;
  creator_id?: number;
  page?: number;
  page_size?: number;
}

export interface TemplateQueryParams {
  is_enabled?: number;
  campus?: string;
  page?: number;
  page_size?: number;
}

// ==================== 检查表相关接口 ====================

/**
 * 创建电话标准化检查表记录
 */
export function createPhoneCheck(data: PhoneCheck) {
  return request({
    url: '/consult/phone/check-record/create',
    method: 'post',
    data,
  });
}

/**
 * 获取电话标准化检查表记录详情
 */
export function getPhoneCheck(recordId: number) {
  return request({
    url: `/consult/phone/check-record/detail/${recordId}`,
    method: 'get',
  });
}

/**
 * 获取电话标准化检查表记录列表
 */
export function getPhoneCheckList(params: CheckQueryParams) {
  return request({
    url: '/consult/phone/check-record/query-list',
    method: 'get',
    params,
  });
}

/**
 * 更新电话标准化检查表记录
 */
export function updatePhoneCheck(recordId: number, data: Partial<PhoneCheck>) {
  return request({
    url: `/consult/phone/check-record/update/${recordId}`,
    method: 'put',
    data,
  });
}

/**
 * 删除电话标准化检查表记录
 */
export function deletePhoneCheck(recordId: number) {
  return request({
    url: `/consult/phone/check-record/delete/${recordId}`,
    method: 'delete',
  });
}

// ==================== 模板配置相关接口 ====================

/**
 * 创建电话标准化模板配置
 */
export function createPhoneTemplate(data: PhoneTemplate) {
  return request({
    url: '/consult/phone/template-config/create',
    method: 'post',
    data,
  });
}

/**
 * 获取模板详情
 */
export function getPhoneTemplate(templateId: number) {
  return request({
    url: `/consult/phone/template-config/detail/${templateId}`,
    method: 'get',
  });
}

/**
 * 获取模板列表
 */
export function getPhoneTemplateList(params: TemplateQueryParams) {
  return request({
    url: '/consult/phone/template-config/query-list',
    method: 'get',
    params,
  });
}

/**
 * 获取默认模板
 */
export function getDefaultPhoneTemplate(campus?: string) {
  return request({
    url: '/consult/phone/template-config/get-default',
    method: 'get',
    params: { campus },
  });
}

/**
 * 更新模板
 */
export function updatePhoneTemplate(templateId: number, data: Partial<PhoneTemplate>) {
  return request({
    url: `/consult/phone/template-config/update/${templateId}`,
    method: 'put',
    data,
  });
}

/**
 * 删除模板
 */
export function deletePhoneTemplate(templateId: number) {
  return request({
    url: `/consult/phone/template-config/delete/${templateId}`,
    method: 'delete',
  });
}

/**
 * 设置为默认模板
 */
export function setDefaultPhoneTemplate(templateId: number) {
  return request({
    url: `/consult/phone/template-config/set-default/${templateId}`,
    method: 'post',
  });
}
