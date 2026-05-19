/**
 * 003神殿各咨询师数据汇总 V2 - 前端服务层
 * 
 * 支持多Tab数据结构：
 * - Tab1: 神殿汇总（总表）
 * - Tab2: 网络媒体明细
 * - Tab3: 渠道明细
 * - Tab4: 口碑明细
 */

import api from '../api';

// ==================== 类型定义 ====================

/** 来源统计 */
export interface SourceStats {
  实际收入: number;
  报名转化率: number | null;
  实际招生: number;
  上门率: number | null;
  上门量: number;
  咨询量: number;
}

/** 汇总统计（含计划字段） */
export interface SummaryStats {
  计划收入: number;
  实际收入: number;
  收入完成率: number | null;
  计划招生: number;
  实际招生: number;
  总转化率: number | null;
  退费数: number;
  上门量: number;
  上门率: number | null;
  咨询量: number;
}

/** 咨询师行数据 */
export interface ConsultantRowData {
  月份: number;
  神殿: string;
  咨询师: string;
  咨询师职数: number;
  
  // 总表用
  所有媒体来源?: SummaryStats;
  
  // 网络明细用
  网络媒体?: SummaryStats;
  SEM?: SourceStats;
  新媒体?: SourceStats;
  市场口碑?: SourceStats;
  合作伙伴?: SourceStats;
  免费推广?: SourceStats;
  
  // 渠道明细用
  渠道平台?: SummaryStats;
  渠道?: SourceStats;
  
  // 口碑明细用
  口碑平台?: SummaryStats;
  咨询口碑?: SourceStats;
  教质口碑?: SourceStats;
  学术口碑?: SourceStats;
  校园口碑?: SourceStats;
  其他口碑?: SourceStats;
}

/** 月度数据块 */
export interface MonthBlock {
  月份: number;
  月汇总: ConsultantRowData;
  咨询师数据: ConsultantRowData[];
}

/** 列定义 */
export interface ColumnDef {
  key: string;
  title: string;
  width?: number;
  fixed?: 'left' | 'right';
  editable?: boolean;
  children?: ColumnDef[];
}

/** Tab数据响应 */
export interface TabResponse {
  tab_name: string;
  神殿: string;
  年份: number;
  columns: ColumnDef[];
  月度数据: MonthBlock[];
}

/** 完整页面响应 */
export interface FullPageResponse {
  神殿: string;
  年份: number;
  神殿汇总: TabResponse;
  网络媒体: TabResponse;
  渠道: TabResponse;
  口碑: TabResponse;
}

/** 计划数据保存请求 */
export interface SavePlanRequest {
  campus: string;
  year: number;
  month: number;
  consultant: string;
  plan_income?: number;
  plan_enrollment?: number;
  staff_count?: number;
}

// ==================== API 函数 ====================

const BASE_URL = '/consult/consultant-data-summary-v2';

/**
 * 获取完整页面数据（4个Tab）
 */
export async function getFullPageData(
  year: number,
  campus: string
): Promise<FullPageResponse> {
  const response = await api.get<FullPageResponse>(`${BASE_URL}/full-data`, {
    params: { year, campus }
  });
  return response.data;
}

/**
 * 获取单个Tab数据
 */
export async function getTabData(
  tabName: 'summary' | 'network' | 'channel' | 'koubei',
  year: number,
  campus: string
): Promise<TabResponse> {
  const response = await api.get<TabResponse>(`${BASE_URL}/tab/${tabName}`, {
    params: { year, campus }
  });
  return response.data;
}

/**
 * 保存计划数据
 */
export async function savePlanData(
  data: SavePlanRequest
): Promise<{ success: boolean; message: string }> {
  const response = await api.post(`${BASE_URL}/save-plan`, data);
  return response.data;
}

/**
 * 获取咨询师列表
 */
export async function getConsultantList(
  campus: string,
  year: number
): Promise<string[]> {
  const response = await api.get<string[]>(`${BASE_URL}/consultants`, {
    params: { campus, year }
  });
  return response.data;
}

// ==================== 工具函数 ====================

/**
 * 格式化百分比
 */
export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-';
  return `${value.toFixed(1)}%`;
}

/**
 * 格式化金额
 */
export function formatMoney(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-';
  return value.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

/**
 * 格式化数字
 */
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-';
  return value.toLocaleString('zh-CN');
}

/**
 * 获取月份显示文字
 */
export function getMonthLabel(month: number): string {
  return `${month}月`;
}

/**
 * 将月度数据展平为表格行（含月汇总行和各咨询师行）
 */
export function flattenMonthBlocks(
  monthBlocks: MonthBlock[],
  includeMonthSummary: boolean = true
): ConsultantRowData[] {
  const rows: ConsultantRowData[] = [];
  
  for (const block of monthBlocks) {
    // 添加月汇总行
    if (includeMonthSummary) {
      rows.push(block.月汇总);
    }
    // 添加各咨询师行
    rows.push(...block.咨询师数据);
  }
  
  return rows;
}

/**
 * 计算年度汇总
 */
export function calculateYearSummary(
  monthBlocks: MonthBlock[]
): {
  总咨询量: number;
  总上门量: number;
  总实际招生: number;
  总实际收入: number;
  总退费数: number;
  总计划收入: number;
  总计划招生: number;
} {
  let 总咨询量 = 0;
  let 总上门量 = 0;
  let 总实际招生 = 0;
  let 总实际收入 = 0;
  let 总退费数 = 0;
  let 总计划收入 = 0;
  let 总计划招生 = 0;

  for (const block of monthBlocks) {
    const summary = block.月汇总.所有媒体来源 || block.月汇总.网络媒体 || 
                    block.月汇总.渠道平台 || block.月汇总.口碑平台;
    if (summary) {
      总咨询量 += summary.咨询量;
      总上门量 += summary.上门量;
      总实际招生 += summary.实际招生;
      总实际收入 += summary.实际收入;
      总退费数 += summary.退费数;
      总计划收入 += summary.计划收入;
      总计划招生 += summary.计划招生;
    }
  }

  return {
    总咨询量,
    总上门量,
    总实际招生,
    总实际收入,
    总退费数,
    总计划收入,
    总计划招生,
  };
}

/**
 * 获取Tab名称映射
 */
export function getTabNameMap(): Record<string, string> {
  return {
    summary: '神殿汇总',
    network: '网络媒体',
    channel: '渠道',
    koubei: '口碑',
  };
}
