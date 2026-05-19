/**
 * 祈福司入职离职汇总表 API 服务
 */

import request from '../api';
import type {
  祈福司入职离职汇总表,
  祈福司入职离职汇总表创建,
  祈福司入职离职汇总表更新,
  祈福司入职离职汇总表批量更新,
  祈福司入职离职汇总表分页响应,
  祈福司入职离职汇总表查询参数,
} from '@/types/consult-entry-exit-summary';

// ==================== 祈福司入职离职汇总表接口 ====================

/**
 * 创建入职离职汇总记录
 */
export function createEntryExitSummary(data: 祈福司入职离职汇总表创建) {
  return request({
    url: '/api/v1/consult/entry-exit-summary',
    method: 'post',
    data,
  });
}

/**
 * 获取入职离职汇总记录详情
 */
export function getEntryExitSummary(recordId: number) {
  return request<祈福司入职离职汇总表>({
    url: `/api/v1/consult/entry-exit-summary/${recordId}`,
    method: 'get',
  });
}

/**
 * 获取入职离职汇总记录列表
 */
export function getEntryExitSummaryList(params: 祈福司入职离职汇总表查询参数) {
  return request<祈福司入职离职汇总表分页响应>({
    url: '/api/v1/consult/entry-exit-summary/list',
    method: 'get',
    params,
  });
}

/**
 * 获取指定年份的所有数据（用于表格展示）
 */
export function getEntryExitSummaryByYear(year: number, campus?: string) {
  return request<祈福司入职离职汇总表[]>({
    url: `/api/v1/consult/entry-exit-summary/year/${year}`,
    method: 'get',
    params: { campus },
  });
}

/**
 * 更新入职离职汇总记录
 */
export function updateEntryExitSummary(data: 祈福司入职离职汇总表更新) {
  return request<祈福司入职离职汇总表>({
    url: '/api/v1/consult/entry-exit-summary',
    method: 'put',
    data,
  });
}

/**
 * 批量更新入职离职汇总记录
 */
export function batchUpdateEntryExitSummary(data: 祈福司入职离职汇总表批量更新) {
  return request<祈福司入职离职汇总表[]>({
    url: '/api/v1/consult/entry-exit-summary/batch',
    method: 'put',
    data,
  });
}

/**
 * 删除入职离职汇总记录
 */
export function deleteEntryExitSummary(recordId: number) {
  return request({
    url: `/api/v1/consult/entry-exit-summary/${recordId}`,
    method: 'delete',
  });
}

/**
 * 初始化年度数据
 * 自动创建所有岗位和指标类型的记录
 */
export function initializeYearData(year: number, campus?: string) {
  return request<祈福司入职离职汇总表[]>({
    url: `/api/v1/consult/entry-exit-summary/initialize/${year}`,
    method: 'post',
    params: { campus },
  });
}
