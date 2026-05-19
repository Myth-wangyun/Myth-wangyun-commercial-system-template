/**
 * 003神殿各咨询师数据汇总 V3
 *
 * TAB1 - 所有媒体来源（3个子表合在一起）:
 *   子表1 - 年度核心数据汇总：月份 | 神殿 | 咨询师职数 | 所有媒体来源(10列)
 *   子表2 - 年度核心数据看板：序号 | 咨询师 | 职位 | 所有媒体来源(10列)
 *   子表3 - 月度核心数据看板：月份 | 咨询师 | 咨询师职数 | 所有媒体来源(10列)
 * TAB2 - 网络媒体（待开发）
 * TAB3 - 渠道 & 口碑（待开发）
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { App,
  Tabs,
  Card,
  Spin,
  Select,
  Table,
  Typography,
  Space,
  Button,
  InputNumber,
} from 'antd'
import { ReloadOutlined, EditOutlined, SaveOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useCampusStore } from '@/stores/campusStore'
import { normalizeCampusName } from '@/utils/campusSort'
import {
  getV3FullData,
  fmtPercent,
  fmtMoney,
  fmtNum,
  saveV3PlanData,
} from '@/services/consult/consultantDataSummaryV3'
import { getConsultantPlanList } from '@/api/consult/consultantMonthlyPlan'
import type { ConsultantMonthlyPlanItem } from '@/api/consult/consultantMonthlyPlan'
import type {
  FullV3Response,
  Tab1Row,
  Tab2NetworkRow,
  Tab2NetworkAnnualRow,
  Tab2NetworkMonthlyRow,
  Tab3ChannelSummaryRow,
  Tab3ChannelAnnualRow,
  Tab3ChannelMonthlyRow,
  Tab4KoubeiSummaryRow,
  Tab4KoubeiAnnualRow,
  Tab4KoubeiMonthlyRow,
  Tab2Row,
  Tab3Row,
  MediaStats,
} from '@/services/consult/consultantDataSummaryV3'
import styles from './index.module.css'

const { Text } = Typography

// ==================== 所有媒体来源列定义 ====================

function mediaColumns<T>(getStats: (r: T) => MediaStats | undefined): ColumnsType<T> {
  return [
    {
      title: '计划收入',
      width: 100,
      align: 'center',
      render: (_, r) => fmtMoney(getStats(r)?.计划收入),
    },
    {
      title: '实际收入',
      width: 100,
      align: 'center',
      render: (_, r) => fmtMoney(getStats(r)?.实际收入),
    },
    {
      title: '收入完成率',
      width: 90,
      align: 'center',
      render: (_, r) => fmtPercent(getStats(r)?.收入完成率),
    },
    {
      title: '计划招生',
      width: 80,
      align: 'center',
      render: (_, r) => fmtNum(getStats(r)?.计划招生),
    },
    {
      title: '实际招生',
      width: 80,
      align: 'center',
      render: (_, r) => fmtNum(getStats(r)?.实际招生),
    },
    {
      title: '总转化率',
      width: 80,
      align: 'center',
      render: (_, r) => fmtPercent(getStats(r)?.总转化率),
    },
    {
      title: '退费数',
      width: 70,
      align: 'center',
      render: (_, r) => fmtNum(getStats(r)?.退费数),
    },
    {
      title: '上门总量',
      width: 80,
      align: 'center',
      render: (_, r) => fmtNum(getStats(r)?.上门总量),
    },
    {
      title: '上门率',
      width: 70,
      align: 'center',
      render: (_, r) => fmtPercent(getStats(r)?.上门率),
    },
    {
      title: '咨询总量',
      width: 80,
      align: 'center',
      render: (_, r) => fmtNum(getStats(r)?.咨询总量),
    },
  ]
}

function networkSourceColumns<T>(
  getStats: (r: T) =>
    | {
        实际收入: number
        报名转化率: number | null
        实际招生: number
        上门率: number | null
        上门量: number
        咨询量: number
      }
    | undefined,
): ColumnsType<T> {
  return [
    {
      title: '实际收入',
      width: 90,
      align: 'center',
      render: (_, r) => fmtMoney(getStats(r)?.实际收入),
    },
    {
      title: '报名转化率',
      width: 90,
      align: 'center',
      render: (_, r) => fmtPercent(getStats(r)?.报名转化率),
    },
    {
      title: '实际招生',
      width: 80,
      align: 'center',
      render: (_, r) => fmtNum(getStats(r)?.实际招生),
    },
    {
      title: '上门率',
      width: 70,
      align: 'center',
      render: (_, r) => fmtPercent(getStats(r)?.上门率),
    },
    {
      title: '上门量',
      width: 70,
      align: 'center',
      render: (_, r) => fmtNum(getStats(r)?.上门量),
    },
    {
      title: '咨询量',
      width: 70,
      align: 'center',
      render: (_, r) => fmtNum(getStats(r)?.咨询量),
    },
  ]
}

// ==================== TAB1 列 ====================

interface Tab1TableRow extends Tab1Row {
  key: string
  isTotal: boolean
}

const tab1Columns: ColumnsType<Tab1TableRow> = [
  { title: '月份', dataIndex: '月份', width: 60, fixed: 'left' },
  { title: '神殿', dataIndex: '神殿', width: 80 },
  { title: '咨询师职数', dataIndex: '咨询师职数', width: 90, align: 'center',
    render: (v: number, r) => (r.isTotal ? '' : v),
  },
  {
    title: '所有媒体来源',
    children: mediaColumns<Tab1TableRow>((r) => r.所有媒体来源),
  },
]

// ==================== TAB2 列 ====================

interface Tab2TableRow extends Tab2Row {
  key: string
  isTotal: boolean
}

const tab2Columns: ColumnsType<Tab2TableRow> = [
  { title: '序号', dataIndex: '序号', width: 60, fixed: 'left', align: 'center' },
  { title: '咨询师', dataIndex: '咨询师', width: 80, fixed: 'left' },
  { title: '职位', dataIndex: '职位', width: 80 },
  {
    title: '所有媒体来源',
    children: mediaColumns<Tab2TableRow>((r) => r.所有媒体来源),
  },
]

// ==================== TAB2 网络媒体汇总列 ====================

interface Tab2NetworkTableRow extends Tab2NetworkRow {
  key: string
  isTotal: boolean
}

const tab2NetworkColumns: ColumnsType<Tab2NetworkTableRow> = [
  { title: '月份', dataIndex: '月份', width: 60, fixed: 'left' },
  { title: '神殿', dataIndex: '神殿', width: 80 },
  {
    title: '咨询师职数',
    dataIndex: '咨询师职数',
    width: 90,
    align: 'center',
    render: (v: number, r) => (r.isTotal ? '' : v),
  },
  {
    title: '网络媒体',
    children: [
      {
        title: '计划收入',
        width: 100,
        align: 'right',
        render: (_, r) => fmtMoney(r.网络媒体?.计划收入),
      },
      {
        title: '实际收入',
        width: 100,
        align: 'right',
        render: (_, r) => fmtMoney(r.网络媒体?.实际收入),
      },
      {
        title: '收入完成率',
        width: 90,
        align: 'right',
        render: (_, r) => fmtPercent(r.网络媒体?.收入完成率),
      },
      {
        title: '计划招生',
        width: 80,
        align: 'right',
        render: (_, r) => fmtNum(r.网络媒体?.计划招生),
      },
      {
        title: '实际招生',
        width: 80,
        align: 'right',
        render: (_, r) => fmtNum(r.网络媒体?.实际招生),
      },
      {
        title: '总转化率',
        width: 80,
        align: 'right',
        render: (_, r) => fmtPercent(r.网络媒体?.总转化率),
      },
      {
        title: '退费数',
        width: 70,
        align: 'right',
        render: (_, r) => fmtNum(r.网络媒体?.退费数),
      },
      {
        title: '上门量',
        width: 80,
        align: 'right',
        render: (_, r) => fmtNum(r.网络媒体?.上门量),
      },
      {
        title: '上门率',
        width: 70,
        align: 'right',
        render: (_, r) => fmtPercent(r.网络媒体?.上门率),
      },
      {
        title: '咨询量',
        width: 80,
        align: 'right',
        render: (_, r) => fmtNum(r.网络媒体?.咨询量),
      },
    ],
  },
  {
    title: 'SEM',
    children: networkSourceColumns<Tab2NetworkTableRow>((r) => r.SEM),
  },
  {
    title: '新媒体',
    children: networkSourceColumns<Tab2NetworkTableRow>((r) => r.新媒体),
  },
  {
    title: '市场口碑',
    children: networkSourceColumns<Tab2NetworkTableRow>((r) => r.市场口碑),
  },
  {
    title: '合作伙伴',
    children: networkSourceColumns<Tab2NetworkTableRow>((r) => r.合作伙伴),
  },
  {
    title: '免费推广',
    children: networkSourceColumns<Tab2NetworkTableRow>((r) => r.免费推广),
  },
]

// ==================== TAB2 网络媒体年度看板列 ====================

interface Tab2NetworkAnnualTableRow extends Tab2NetworkAnnualRow {
  key: string
  isTotal: boolean
}

const tab2NetworkAnnualColumns: ColumnsType<Tab2NetworkAnnualTableRow> = [
  { title: '序号', dataIndex: '序号', width: 60, fixed: 'left', align: 'center' },
  { title: '咨询师', dataIndex: '咨询师', width: 80, fixed: 'left' },
  { title: '职位', dataIndex: '职位', width: 80 },
  {
    title: '网络媒体',
    children: [
      {
        title: '计划收入',
        width: 100,
        align: 'right',
        render: (_, r) => fmtMoney(r.网络媒体?.计划收入),
      },
      {
        title: '实际收入',
        width: 100,
        align: 'right',
        render: (_, r) => fmtMoney(r.网络媒体?.实际收入),
      },
      {
        title: '收入完成率',
        width: 90,
        align: 'right',
        render: (_, r) => fmtPercent(r.网络媒体?.收入完成率),
      },
      {
        title: '计划招生',
        width: 80,
        align: 'right',
        render: (_, r) => fmtNum(r.网络媒体?.计划招生),
      },
      {
        title: '实际招生',
        width: 80,
        align: 'right',
        render: (_, r) => fmtNum(r.网络媒体?.实际招生),
      },
      {
        title: '总转化率',
        width: 80,
        align: 'right',
        render: (_, r) => fmtPercent(r.网络媒体?.总转化率),
      },
      {
        title: '退费数',
        width: 70,
        align: 'right',
        render: (_, r) => fmtNum(r.网络媒体?.退费数),
      },
      {
        title: '上门量',
        width: 80,
        align: 'right',
        render: (_, r) => fmtNum(r.网络媒体?.上门量),
      },
      {
        title: '上门率',
        width: 70,
        align: 'right',
        render: (_, r) => fmtPercent(r.网络媒体?.上门率),
      },
      {
        title: '咨询量',
        width: 80,
        align: 'right',
        render: (_, r) => fmtNum(r.网络媒体?.咨询量),
      },
    ],
  },
  {
    title: 'SEM',
    children: networkSourceColumns<Tab2NetworkAnnualTableRow>((r) => r.SEM),
  },
  {
    title: '新媒体',
    children: networkSourceColumns<Tab2NetworkAnnualTableRow>((r) => r.新媒体),
  },
  {
    title: '市场口碑',
    children: networkSourceColumns<Tab2NetworkAnnualTableRow>((r) => r.市场口碑),
  },
  {
    title: '合作伙伴',
    children: networkSourceColumns<Tab2NetworkAnnualTableRow>((r) => r.合作伙伴),
  },
  {
    title: '免费推广',
    children: networkSourceColumns<Tab2NetworkAnnualTableRow>((r) => r.免费推广),
  },
]

// ==================== TAB2 网络媒体月度看板列 ====================

interface Tab2NetworkMonthlyTableRow extends Tab2NetworkMonthlyRow {
  key: string
  isTotal: boolean
  isMonthFirst: boolean
}

// 创建可编辑列的工厂函数
function createEditableNetworkMonthlyColumns(
  editingCell: EditingCell | null,
  onEdit: (key: string, field: '计划收入' | '计划招生', value: number) => void,
): ColumnsType<Tab2NetworkMonthlyTableRow> {
  return [
    { title: '月份', dataIndex: '月份', width: 60, fixed: 'left' },
    {
      title: '咨询师',
      dataIndex: '咨询师',
      width: 80,
      fixed: 'left',
      render: (v: string, r) => (
        <span style={{ fontWeight: r.isTotal ? 'bold' : 'normal' }}>{v}</span>
      ),
    },
    {
      title: '咨询师职数',
      dataIndex: '咨询师职数',
      width: 90,
      align: 'center',
    },
    {
      title: '网络媒体',
      children: [
        {
          title: '计划收入',
          width: 100,
          align: 'right',
          render: (_, r) => {
            if (r.isTotal || r.咨询师 === '其他') {
              return fmtMoney(r.网络媒体?.计划收入)
            }
            const isEditing = editingCell?.key === r.key && editingCell?.field === '计划收入'
            return isEditing ? (
              <InputNumber
                size="small"
                value={editingCell.value}
                onChange={(v) => onEdit(r.key, '计划收入', v || 0)}
                onPressEnter={() => onEdit(r.key, '计划收入', editingCell.value)}
                autoFocus
                style={{ width: '100%' }}
              />
            ) : (
              <div
                onClick={() => onEdit(r.key, '计划收入', r.网络媒体?.计划收入 || 0)}
                style={{ cursor: 'pointer', padding: '4px' }}
              >
                {fmtMoney(r.网络媒体?.计划收入)}
              </div>
            )
          },
        },
        {
          title: '实际收入',
          width: 100,
          align: 'right',
          render: (_, r) => fmtMoney(r.网络媒体?.实际收入),
        },
        {
          title: '收入完成率',
          width: 90,
          align: 'right',
          render: (_, r) => fmtPercent(r.网络媒体?.收入完成率),
        },
        {
          title: '计划招生',
          width: 80,
          align: 'right',
          render: (_, r) => {
            if (r.isTotal || r.咨询师 === '其他') {
              return fmtNum(r.网络媒体?.计划招生)
            }
            const isEditing = editingCell?.key === r.key && editingCell?.field === '计划招生'
            return isEditing ? (
              <InputNumber
                size="small"
                value={editingCell.value}
                onChange={(v) => onEdit(r.key, '计划招生', v || 0)}
                onPressEnter={() => onEdit(r.key, '计划招生', editingCell.value)}
                autoFocus
                style={{ width: '100%' }}
              />
            ) : (
              <div
                onClick={() => onEdit(r.key, '计划招生', r.网络媒体?.计划招生 || 0)}
                style={{ cursor: 'pointer', padding: '4px' }}
              >
                {fmtNum(r.网络媒体?.计划招生)}
              </div>
            )
          },
        },
      {
        title: '实际招生',
        width: 80,
        align: 'right',
        render: (_, r) => fmtNum(r.网络媒体?.实际招生),
      },
      {
        title: '总转化率',
        width: 80,
        align: 'right',
        render: (_, r) => fmtPercent(r.网络媒体?.总转化率),
      },
      {
        title: '退费数',
        width: 70,
        align: 'right',
        render: (_, r) => fmtNum(r.网络媒体?.退费数),
      },
      {
        title: '上门量',
        width: 80,
        align: 'right',
        render: (_, r) => fmtNum(r.网络媒体?.上门量),
      },
      {
        title: '上门率',
        width: 70,
        align: 'right',
        render: (_, r) => fmtPercent(r.网络媒体?.上门率),
      },
      {
        title: '咨询量',
        width: 80,
        align: 'right',
        render: (_, r) => fmtNum(r.网络媒体?.咨询量),
      },
    ],
  },
  {
    title: 'SEM',
    children: networkSourceColumns<Tab2NetworkMonthlyTableRow>((r) => r.SEM),
  },
  {
    title: '新媒体',
    children: networkSourceColumns<Tab2NetworkMonthlyTableRow>((r) => r.新媒体),
  },
  {
    title: '市场口碑',
    children: networkSourceColumns<Tab2NetworkMonthlyTableRow>((r) => r.市场口碑),
  },
  {
    title: '合作伙伴',
    children: networkSourceColumns<Tab2NetworkMonthlyTableRow>((r) => r.合作伙伴),
  },
  {
    title: '免费推广',
    children: networkSourceColumns<Tab2NetworkMonthlyTableRow>((r) => r.免费推广),
  },
]

}

// ==================== TAB3 渠道核心数据汇总列 ====================

interface Tab3ChannelSummaryTableRow extends Tab3ChannelSummaryRow {
  key: string
  isTotal: boolean
}

const tab3ChannelSummaryColumns: ColumnsType<Tab3ChannelSummaryTableRow> = [
  { title: '月份', dataIndex: '月份', width: 60, fixed: 'left' },
  { title: '神殿', dataIndex: '神殿', width: 80 },
  {
    title: '咨询师职数',
    dataIndex: '咨询师职数',
    width: 90,
    align: 'center',
    render: (v: number, r) => (r.isTotal ? '' : v),
  },
  {
    title: '渠道平台',
    children: [
      {
        title: '计划收入',
        width: 100,
        align: 'right',
        render: (_, r) => fmtMoney(r.渠道平台?.计划收入),
      },
      {
        title: '实际收入',
        width: 100,
        align: 'right',
        render: (_, r) => fmtMoney(r.渠道平台?.实际收入),
      },
      {
        title: '收入完成率',
        width: 90,
        align: 'right',
        render: (_, r) => fmtPercent(r.渠道平台?.收入完成率),
      },
      {
        title: '计划招生',
        width: 80,
        align: 'right',
        render: (_, r) => fmtNum(r.渠道平台?.计划招生),
      },
      {
        title: '实际招生',
        width: 80,
        align: 'right',
        render: (_, r) => fmtNum(r.渠道平台?.实际招生),
      },
      {
        title: '总转化率',
        width: 80,
        align: 'right',
        render: (_, r) => fmtPercent(r.渠道平台?.总转化率),
      },
      {
        title: '退费数',
        width: 70,
        align: 'right',
        render: (_, r) => fmtNum(r.渠道平台?.退费数),
      },
      {
        title: '上门量',
        width: 80,
        align: 'right',
        render: (_, r) => fmtNum(r.渠道平台?.上门量),
      },
      {
        title: '上门率',
        width: 70,
        align: 'right',
        render: (_, r) => fmtPercent(r.渠道平台?.上门率),
      },
      {
        title: '咨询量',
        width: 80,
        align: 'right',
        render: (_, r) => fmtNum(r.渠道平台?.咨询量),
      },
    ],
  },
  {
    title: '渠道',
    children: networkSourceColumns<Tab3ChannelSummaryTableRow>((r) => r.渠道),
  },
]

// ==================== TAB3 渠道年度看板列 ====================

interface Tab3ChannelAnnualTableRow extends Tab3ChannelAnnualRow {
  key: string
  isTotal: boolean
}

const tab3ChannelAnnualColumns: ColumnsType<Tab3ChannelAnnualTableRow> = [
  { title: '序号', dataIndex: '序号', width: 60, fixed: 'left', align: 'center' },
  { title: '咨询师', dataIndex: '咨询师', width: 80, fixed: 'left' },
  { title: '职位', dataIndex: '职位', width: 80 },
  {
    title: '渠道平台',
    children: [
      {
        title: '计划收入',
        width: 100,
        align: 'right',
        render: (_, r) => fmtMoney(r.渠道平台?.计划收入),
      },
      {
        title: '实际收入',
        width: 100,
        align: 'right',
        render: (_, r) => fmtMoney(r.渠道平台?.实际收入),
      },
      {
        title: '收入完成率',
        width: 90,
        align: 'right',
        render: (_, r) => fmtPercent(r.渠道平台?.收入完成率),
      },
      {
        title: '计划招生',
        width: 80,
        align: 'right',
        render: (_, r) => fmtNum(r.渠道平台?.计划招生),
      },
      {
        title: '实际招生',
        width: 80,
        align: 'right',
        render: (_, r) => fmtNum(r.渠道平台?.实际招生),
      },
      {
        title: '总转化率',
        width: 80,
        align: 'right',
        render: (_, r) => fmtPercent(r.渠道平台?.总转化率),
      },
      {
        title: '退费数',
        width: 70,
        align: 'right',
        render: (_, r) => fmtNum(r.渠道平台?.退费数),
      },
      {
        title: '上门量',
        width: 80,
        align: 'right',
        render: (_, r) => fmtNum(r.渠道平台?.上门量),
      },
      {
        title: '上门率',
        width: 70,
        align: 'right',
        render: (_, r) => fmtPercent(r.渠道平台?.上门率),
      },
      {
        title: '咨询量',
        width: 80,
        align: 'right',
        render: (_, r) => fmtNum(r.渠道平台?.咨询量),
      },
    ],
  },
  {
    title: '渠道',
    children: networkSourceColumns<Tab3ChannelAnnualTableRow>((r) => r.渠道),
  },
]

// ==================== TAB3 渠道月度看板列 ====================

interface Tab3ChannelMonthlyTableRow extends Tab3ChannelMonthlyRow {
  key: string
  isTotal: boolean
  isMonthFirst: boolean
}

// 创建可编辑的渠道月度看板列
function createEditableChannelMonthlyColumns(
  editingCell: EditingCell | null,
  onEdit: (key: string, field: '计划收入' | '计划招生', value: number) => void,
): ColumnsType<Tab3ChannelMonthlyTableRow> {
  return [
    { title: '月份', dataIndex: '月份', width: 60, fixed: 'left' },
    {
      title: '咨询师',
      dataIndex: '咨询师',
      width: 80,
      fixed: 'left',
      render: (v: string, r) => (
        <span style={{ fontWeight: r.isTotal ? 'bold' : 'normal' }}>{v}</span>
      ),
    },
    { title: '咨询师职数', dataIndex: '咨询师职数', width: 90, align: 'center' },
    {
      title: '渠道平台',
      children: [
        {
          title: '计划收入',
          width: 100,
          align: 'right',
          render: (_, r) => {
            if (r.isTotal || r.咨询师 === '其他') {
              return fmtMoney(r.渠道平台?.计划收入)
            }
            const isEditing = editingCell?.key === r.key && editingCell?.field === '计划收入'
            return isEditing ? (
              <InputNumber
                size="small"
                value={editingCell.value}
                onChange={(v) => onEdit(r.key, '计划收入', v || 0)}
                onPressEnter={() => onEdit(r.key, '计划收入', editingCell.value)}
                autoFocus
                style={{ width: '100%' }}
              />
            ) : (
              <div
                onClick={() => onEdit(r.key, '计划收入', r.渠道平台?.计划收入 || 0)}
                style={{ cursor: 'pointer', padding: '4px' }}
              >
                {fmtMoney(r.渠道平台?.计划收入)}
              </div>
            )
          },
        },
      {
        title: '实际收入',
        width: 100,
        align: 'right',
        render: (_, r) => fmtMoney(r.渠道平台?.实际收入),
      },
      {
        title: '收入完成率',
        width: 90,
        align: 'right',
        render: (_, r) => fmtPercent(r.渠道平台?.收入完成率),
      },
        {
          title: '计划招生',
          width: 80,
          align: 'right',
          render: (_, r) => {
            if (r.isTotal || r.咨询师 === '其他') {
              return fmtNum(r.渠道平台?.计划招生)
            }
            const isEditing = editingCell?.key === r.key && editingCell?.field === '计划招生'
            return isEditing ? (
              <InputNumber
                size="small"
                value={editingCell.value}
                onChange={(v) => onEdit(r.key, '计划招生', v || 0)}
                onPressEnter={() => onEdit(r.key, '计划招生', editingCell.value)}
                autoFocus
                style={{ width: '100%' }}
              />
            ) : (
              <div
                onClick={() => onEdit(r.key, '计划招生', r.渠道平台?.计划招生 || 0)}
                style={{ cursor: 'pointer', padding: '4px' }}
              >
                {fmtNum(r.渠道平台?.计划招生)}
              </div>
            )
          },
        },
        {
          title: '实际招生',
          width: 80,
          align: 'right',
          render: (_, r) => fmtNum(r.渠道平台?.实际招生),
        },
        {
          title: '总转化率',
          width: 80,
          align: 'right',
          render: (_, r) => fmtPercent(r.渠道平台?.总转化率),
        },
        {
          title: '退费数',
          width: 70,
          align: 'right',
          render: (_, r) => fmtNum(r.渠道平台?.退费数),
        },
        {
          title: '上门量',
          width: 80,
          align: 'right',
          render: (_, r) => fmtNum(r.渠道平台?.上门量),
        },
        {
          title: '上门率',
          width: 70,
          align: 'right',
          render: (_, r) => fmtPercent(r.渠道平台?.上门率),
        },
        {
          title: '咨询量',
          width: 80,
          align: 'right',
          render: (_, r) => fmtNum(r.渠道平台?.咨询量),
        },
      ],
    },
    {
      title: '渠道',
      children: networkSourceColumns<Tab3ChannelMonthlyTableRow>((r) => r.渠道),
    },
  ]
}

// 创建可编辑的口碑月度看板列
function createEditableKoubeiMonthlyColumns(
  editingCell: EditingCell | null,
  onEdit: (key: string, field: '计划收入' | '计划招生', value: number) => void,
): ColumnsType<Tab4KoubeiMonthlyTableRow> {
  return [
    { title: '月份', dataIndex: '月份', width: 60, fixed: 'left' },
    { title: '咨询师', dataIndex: '咨询师', width: 90, fixed: 'left' },
    {
      title: '咨询师职数',
      dataIndex: '咨询师职数',
      width: 90,
      align: 'center',
    },
    {
      title: '口碑平台',
      children: [
        {
          title: '计划收入',
          width: 100,
          align: 'right',
          render: (_, r) => {
            if (r.isTotal || r.咨询师 === '其他') {
              return fmtMoney(r.口碑平台?.计划收入)
            }
            const isEditing = editingCell?.key === r.key && editingCell?.field === '计划收入'
            return isEditing ? (
              <InputNumber
                size="small"
                value={editingCell.value}
                onChange={(v) => onEdit(r.key, '计划收入', v || 0)}
                onPressEnter={() => onEdit(r.key, '计划收入', editingCell.value)}
                autoFocus
                style={{ width: '100%' }}
              />
            ) : (
              <div
                onClick={() => onEdit(r.key, '计划收入', r.口碑平台?.计划收入 || 0)}
                style={{ cursor: 'pointer', padding: '4px' }}
              >
                {fmtMoney(r.口碑平台?.计划收入)}
              </div>
            )
          },
        },
        {
          title: '实际收入',
          width: 100,
          align: 'right',
          render: (_, r) => fmtMoney(r.口碑平台?.实际收入),
        },
        {
          title: '收入完成率',
          width: 90,
          align: 'right',
          render: (_, r) => fmtPercent(r.口碑平台?.收入完成率),
        },
        {
          title: '计划招生',
          width: 80,
          align: 'right',
          render: (_, r) => {
            if (r.isTotal || r.咨询师 === '其他') {
              return fmtNum(r.口碑平台?.计划招生)
            }
            const isEditing = editingCell?.key === r.key && editingCell?.field === '计划招生'
            return isEditing ? (
              <InputNumber
                size="small"
                value={editingCell.value}
                onChange={(v) => onEdit(r.key, '计划招生', v || 0)}
                onPressEnter={() => onEdit(r.key, '计划招生', editingCell.value)}
                autoFocus
                style={{ width: '100%' }}
              />
            ) : (
              <div
                onClick={() => onEdit(r.key, '计划招生', r.口碑平台?.计划招生 || 0)}
                style={{ cursor: 'pointer', padding: '4px' }}
              >
                {fmtNum(r.口碑平台?.计划招生)}
              </div>
            )
          },
        },
        {
          title: '实际招生',
          width: 80,
          align: 'right',
          render: (_, r) => fmtNum(r.口碑平台?.实际招生),
        },
        {
          title: '总转化率',
          width: 80,
          align: 'right',
          render: (_, r) => fmtPercent(r.口碑平台?.总转化率),
        },
        {
          title: '退费数',
          width: 70,
          align: 'right',
          render: (_, r) => fmtNum(r.口碑平台?.退费数),
        },
        {
          title: '上门量',
          width: 80,
          align: 'right',
          render: (_, r) => fmtNum(r.口碑平台?.上门量),
        },
        {
          title: '上门率',
          width: 70,
          align: 'right',
          render: (_, r) => fmtPercent(r.口碑平台?.上门率),
        },
        {
          title: '咨询量',
          width: 80,
          align: 'right',
          render: (_, r) => fmtNum(r.口碑平台?.咨询量),
        },
      ],
    },
    {
      title: '咨询口碑',
      children: networkSourceColumns<Tab4KoubeiMonthlyTableRow>((r) => r.咨询口碑),
    },
    {
      title: '教质口碑',
      children: networkSourceColumns<Tab4KoubeiMonthlyTableRow>((r) => r.教质口碑),
    },
    {
      title: '学术口碑',
      children: networkSourceColumns<Tab4KoubeiMonthlyTableRow>((r) => r.学术口碑),
    },
    {
      title: '校园口碑',
      children: networkSourceColumns<Tab4KoubeiMonthlyTableRow>((r) => r.校园口碑),
    },
    {
      title: '其他口碑（总部）',
      children: networkSourceColumns<Tab4KoubeiMonthlyTableRow>((r) => r.其他口碑),
    },
  ]
}

// ==================== TAB4 口碑核心数据汇总列 ====================

interface Tab4KoubeiSummaryTableRow extends Tab4KoubeiSummaryRow {
  key: string
  isTotal: boolean
}

interface Tab4KoubeiAnnualTableRow extends Tab4KoubeiAnnualRow {
  key: string
  isTotal: boolean
}

interface Tab4KoubeiMonthlyTableRow extends Tab4KoubeiMonthlyRow {
  key: string
  isTotal: boolean
  isMonthFirst: boolean
}

const tab4KoubeiSummaryColumns: ColumnsType<Tab4KoubeiSummaryTableRow> = [
  { title: '月份', dataIndex: '月份', width: 60, fixed: 'left' },
  { title: '神殿', dataIndex: '神殿', width: 80 },
  {
    title: '咨询师职数',
    dataIndex: '咨询师职数',
    width: 90,
    align: 'center',
    render: (v: number, r) => (r.isTotal ? '' : v),
  },
  {
    title: '口碑平台',
    children: [
      {
        title: '计划收入',
        width: 100,
        align: 'right',
        render: (_, r) => fmtMoney(r.口碑平台?.计划收入),
      },
      {
        title: '实际收入',
        width: 100,
        align: 'right',
        render: (_, r) => fmtMoney(r.口碑平台?.实际收入),
      },
      {
        title: '收入完成率',
        width: 90,
        align: 'right',
        render: (_, r) => fmtPercent(r.口碑平台?.收入完成率),
      },
      {
        title: '计划招生',
        width: 80,
        align: 'right',
        render: (_, r) => fmtNum(r.口碑平台?.计划招生),
      },
      {
        title: '实际招生',
        width: 80,
        align: 'right',
        render: (_, r) => fmtNum(r.口碑平台?.实际招生),
      },
      {
        title: '总转化率',
        width: 80,
        align: 'right',
        render: (_, r) => fmtPercent(r.口碑平台?.总转化率),
      },
      {
        title: '退费数',
        width: 70,
        align: 'right',
        render: (_, r) => fmtNum(r.口碑平台?.退费数),
      },
      {
        title: '上门量',
        width: 80,
        align: 'right',
        render: (_, r) => fmtNum(r.口碑平台?.上门量),
      },
      {
        title: '上门率',
        width: 70,
        align: 'right',
        render: (_, r) => fmtPercent(r.口碑平台?.上门率),
      },
      {
        title: '咨询量',
        width: 80,
        align: 'right',
        render: (_, r) => fmtNum(r.口碑平台?.咨询量),
      },
    ],
  },
  {
    title: '咨询口碑',
    children: networkSourceColumns<Tab4KoubeiSummaryTableRow>((r) => r.咨询口碑),
  },
  {
    title: '教质口碑',
    children: networkSourceColumns<Tab4KoubeiSummaryTableRow>((r) => r.教质口碑),
  },
  {
    title: '学术口碑',
    children: networkSourceColumns<Tab4KoubeiSummaryTableRow>((r) => r.学术口碑),
  },
  {
    title: '校园口碑',
    children: networkSourceColumns<Tab4KoubeiSummaryTableRow>((r) => r.校园口碑),
  },
  {
    title: '其他口碑（总部）',
    children: networkSourceColumns<Tab4KoubeiSummaryTableRow>((r) => r.其他口碑),
  },
]

const tab4KoubeiAnnualColumns: ColumnsType<Tab4KoubeiAnnualTableRow> = [
  { title: '序号', dataIndex: '序号', width: 60, fixed: 'left', align: 'center' },
  { title: '咨询师', dataIndex: '咨询师', width: 90, fixed: 'left' },
  { title: '职位', dataIndex: '职位', width: 90 },
  {
    title: '口碑平台',
    children: [
      {
        title: '计划收入',
        width: 100,
        align: 'right',
        render: (_, r) => fmtMoney(r.口碑平台?.计划收入),
      },
      {
        title: '实际收入',
        width: 100,
        align: 'right',
        render: (_, r) => fmtMoney(r.口碑平台?.实际收入),
      },
      {
        title: '收入完成率',
        width: 90,
        align: 'right',
        render: (_, r) => fmtPercent(r.口碑平台?.收入完成率),
      },
      {
        title: '计划招生',
        width: 80,
        align: 'right',
        render: (_, r) => fmtNum(r.口碑平台?.计划招生),
      },
      {
        title: '实际招生',
        width: 80,
        align: 'right',
        render: (_, r) => fmtNum(r.口碑平台?.实际招生),
      },
      {
        title: '总转化率',
        width: 80,
        align: 'right',
        render: (_, r) => fmtPercent(r.口碑平台?.总转化率),
      },
      {
        title: '退费数',
        width: 70,
        align: 'right',
        render: (_, r) => fmtNum(r.口碑平台?.退费数),
      },
      {
        title: '上门量',
        width: 80,
        align: 'right',
        render: (_, r) => fmtNum(r.口碑平台?.上门量),
      },
      {
        title: '上门率',
        width: 70,
        align: 'right',
        render: (_, r) => fmtPercent(r.口碑平台?.上门率),
      },
      {
        title: '咨询量',
        width: 80,
        align: 'right',
        render: (_, r) => fmtNum(r.口碑平台?.咨询量),
      },
    ],
  },
  {
    title: '咨询口碑',
    children: networkSourceColumns<Tab4KoubeiAnnualTableRow>((r) => r.咨询口碑),
  },
  {
    title: '教质口碑',
    children: networkSourceColumns<Tab4KoubeiAnnualTableRow>((r) => r.教质口碑),
  },
  {
    title: '学术口碑',
    children: networkSourceColumns<Tab4KoubeiAnnualTableRow>((r) => r.学术口碑),
  },
  {
    title: '校园口碑',
    children: networkSourceColumns<Tab4KoubeiAnnualTableRow>((r) => r.校园口碑),
  },
  {
    title: '其他口碑（总部）',
    children: networkSourceColumns<Tab4KoubeiAnnualTableRow>((r) => r.其他口碑),
  },
]

const tab4KoubeiMonthlyColumns: ColumnsType<Tab4KoubeiMonthlyTableRow> = [
  { title: '月份', dataIndex: '月份', width: 60, fixed: 'left' },
  { title: '咨询师', dataIndex: '咨询师', width: 90, fixed: 'left' },
  {
    title: '咨询师职数',
    dataIndex: '咨询师职数',
    width: 90,
    align: 'center',
  },
  {
    title: '口碑平台',
    children: [
      {
        title: '计划收入',
        width: 100,
        align: 'right',
        render: (_, r) => fmtMoney(r.口碑平台?.计划收入),
      },
      {
        title: '实际收入',
        width: 100,
        align: 'right',
        render: (_, r) => fmtMoney(r.口碑平台?.实际收入),
      },
      {
        title: '收入完成率',
        width: 90,
        align: 'right',
        render: (_, r) => fmtPercent(r.口碑平台?.收入完成率),
      },
      {
        title: '计划招生',
        width: 80,
        align: 'right',
        render: (_, r) => fmtNum(r.口碑平台?.计划招生),
      },
      {
        title: '实际招生',
        width: 80,
        align: 'right',
        render: (_, r) => fmtNum(r.口碑平台?.实际招生),
      },
      {
        title: '总转化率',
        width: 80,
        align: 'right',
        render: (_, r) => fmtPercent(r.口碑平台?.总转化率),
      },
      {
        title: '退费数',
        width: 70,
        align: 'right',
        render: (_, r) => fmtNum(r.口碑平台?.退费数),
      },
      {
        title: '上门量',
        width: 80,
        align: 'right',
        render: (_, r) => fmtNum(r.口碑平台?.上门量),
      },
      {
        title: '上门率',
        width: 70,
        align: 'right',
        render: (_, r) => fmtPercent(r.口碑平台?.上门率),
      },
      {
        title: '咨询量',
        width: 80,
        align: 'right',
        render: (_, r) => fmtNum(r.口碑平台?.咨询量),
      },
    ],
  },
  {
    title: '咨询口碑',
    children: networkSourceColumns<Tab4KoubeiMonthlyTableRow>((r) => r.咨询口碑),
  },
  {
    title: '教质口碑',
    children: networkSourceColumns<Tab4KoubeiMonthlyTableRow>((r) => r.教质口碑),
  },
  {
    title: '学术口碑',
    children: networkSourceColumns<Tab4KoubeiMonthlyTableRow>((r) => r.学术口碑),
  },
  {
    title: '校园口碑',
    children: networkSourceColumns<Tab4KoubeiMonthlyTableRow>((r) => r.校园口碑),
  },
  {
    title: '其他口碑（总部）',
    children: networkSourceColumns<Tab4KoubeiMonthlyTableRow>((r) => r.其他口碑),
  },
]

// ==================== TAB3 列 ====================

interface Tab3TableRow extends Tab3Row {
  key: string
  isTotal: boolean
  isMonthFirst: boolean
}

const tab3Columns: ColumnsType<Tab3TableRow> = [
  { title: '月份', dataIndex: '月份', width: 60, fixed: 'left' },
  {
    title: '咨询师',
    dataIndex: '咨询师',
    width: 80,
    fixed: 'left',
    render: (v: string, r) => (
      <span style={{ fontWeight: r.isTotal ? 'bold' : 'normal' }}>{v}</span>
    ),
  },
  {
    title: '咨询师职数',
    dataIndex: '咨询师职数',
    width: 90,
    align: 'center',
  },
  {
    title: '所有媒体来源',
    children: mediaColumns<Tab3TableRow>((r) => r.所有媒体来源),
  },
]

// ==================== 主组件 ====================

// 编辑状态类型
interface EditingCell {
  key: string
  field: '计划收入' | '计划招生'
  value: number
}

// 待保存的计划数据
interface PendingPlanData {
  [key: string]: {
    计划收入?: number
    计划招生?: number
    consultant: string
    month: number
    dataType: string
  }
}

const ConsultantDataSummaryV3: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus, getAllCampuses, loadCampusesFromConfig, setCampus } =
    useCampusStore()
  const allCampuses = getAllCampuses()
  const defaultCampus = allCampuses[0]?.name ?? '主神殿'

  const [selectedCampus, setSelectedCampus] = useState<string>(
    currentCampus ?? defaultCampus,
  )
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear(),
  )
  const [activeTab, setActiveTab] = useState<string>('tab1')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<FullV3Response | null>(null)

  // 编辑状态
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null)
  const [pendingData, setPendingData] = useState<PendingPlanData>({})
  const [saving, setSaving] = useState(false)

  const apiCampus = useMemo(() => {
    const n = normalizeCampusName(selectedCampus || '')
    if (!n) return ''
    return n.includes('神殿') ? n : `${n}神殿`
  }, [selectedCampus])

  const yearOptions = useMemo(() => {
    const cur = new Date().getFullYear()
    return Array.from({ length: 5 }, (_, i) => ({
      label: `${cur - 2 + i}年`,
      value: cur - 2 + i,
    }))
  }, [])

  const campusOptions = useMemo(
    () => allCampuses.map((c) => ({ label: c.name, value: c.name })),
    [allCampuses],
  )

  // 加载数据
  const loadData = useCallback(async () => {
    if (!apiCampus) {
      message.warning('请先选择神殿')
      return
    }
    setLoading(true)
    try {
      // 1. 获取V3实际业务数据（计划数据为0）
      const result = await getV3FullData(selectedYear, apiCampus)
      
      // 2. 获取计划数据
      console.log('[003 V3] 正在获取计划数据:', { year: selectedYear, campus: apiCampus })
      const planResponse = await getConsultantPlanList({
        year: selectedYear,
        campus: apiCampus,
      })
      console.log('[003 V3] 计划数据API返回:', planResponse)
      
      // 3. 构建计划数据映射
      const planMap = new Map<string, { 计划收入: number; 计划招生: number }>()
      planResponse.数据列表.forEach((item: ConsultantMonthlyPlanItem) => {
        const key = `${item.咨询师}-${item.月份}-${item.数据类型}`
        if (!planMap.has(key)) {
          planMap.set(key, { 计划收入: 0, 计划招生: 0 })
        }
        const existing = planMap.get(key)!
        existing.计划收入 += item.计划收入 || 0
        existing.计划招生 += item.计划招生 || 0
      })
      
      // 4. 合并计划数据到V3结果中
      // TAB1 - 年度核心数据汇总（按月汇总所有咨询师的计划）
      result.tab1_年度核心数据汇总.forEach((row) => {
        if (row.月份 === '合计') return
        const month = parseInt(row.月份.replace('月', ''))
        let monthPlanIncome = 0
        let monthPlanEnrollment = 0
        
        // 汇总该月所有咨询师的所有数据类型的计划
        planResponse.数据列表.forEach((item: ConsultantMonthlyPlanItem) => {
          if (item.月份 === month) {
            monthPlanIncome += item.计划收入 || 0
            monthPlanEnrollment += item.计划招生 || 0
          }
        })
        
        row.所有媒体来源.计划收入 = monthPlanIncome
        row.所有媒体来源.计划招生 = monthPlanEnrollment
      })
      
      // TAB2 - 年度核心数据看板（按咨询师汇总全年计划）
      result.tab2_年度核心数据看板.forEach((row) => {
        if (row.咨询师 === '纯数字' || row.咨询师 === '其他') return
        let yearPlanIncome = 0
        let yearPlanEnrollment = 0
        
        planResponse.数据列表.forEach((item: ConsultantMonthlyPlanItem) => {
          if (item.咨询师 === row.咨询师) {
            yearPlanIncome += item.计划收入 || 0
            yearPlanEnrollment += item.计划招生 || 0
          }
        })
        
        row.所有媒体来源.计划收入 = yearPlanIncome
        row.所有媒体来源.计划招生 = yearPlanEnrollment
      })
      
      // TAB3 - 月度核心数据看板（按咨询师+月份）
      let currentMonthTab3 = 0
      result.tab3_月度核心数据看板.forEach((row) => {
        // 跳过合计和其他行
        if (row.咨询师 === '合计' || row.咨询师 === '其他') {
          return
        }
        
        // 如果当前行有月份,更新currentMonthTab3
        if (row.月份) {
          currentMonthTab3 = parseInt(row.月份.replace('月', ''))
        }
        
        // 使用currentMonthTab3来匹配计划数据
        let consultantMonthPlanIncome = 0
        let consultantMonthPlanEnrollment = 0
        
        planResponse.数据列表.forEach((item: ConsultantMonthlyPlanItem) => {
          if (item.咨询师 === row.咨询师 && item.月份 === currentMonthTab3) {
            consultantMonthPlanIncome += item.计划收入 || 0
            consultantMonthPlanEnrollment += item.计划招生 || 0
          }
        })
        
        row.所有媒体来源.计划收入 = consultantMonthPlanIncome
        row.所有媒体来源.计划招生 = consultantMonthPlanEnrollment
      })
      
      // TAB2 网络媒体 - 核心数据汇总（按月汇总网络类型计划）
      result.tab2_网络媒体_核心数据汇总.forEach((row) => {
        if (row.月份 === '合计') return
        const month = parseInt(row.月份.replace('月', ''))
        let monthPlanIncome = 0
        let monthPlanEnrollment = 0
        
        const networkTypes = ['SEM', '新媒体', '市场口碑', '合作伙伴', '免费推广']
        planResponse.数据列表.forEach((item: ConsultantMonthlyPlanItem) => {
          if (item.月份 === month && networkTypes.includes(item.数据类型)) {
            monthPlanIncome += item.计划收入 || 0
            monthPlanEnrollment += item.计划招生 || 0
          }
        })
        
        row.网络媒体.计划收入 = monthPlanIncome
        row.网络媒体.计划招生 = monthPlanEnrollment
      })
      
      // TAB2 网络媒体 - 年度核心数据看板
      result.tab2_网络媒体_年度核心数据看板.forEach((row) => {
        if (row.咨询师 === '纯数字' || row.咨询师 === '其他') return
        let yearPlanIncome = 0
        let yearPlanEnrollment = 0
        
        const networkTypes = ['SEM', '新媒体', '市场口碑', '合作伙伴', '免费推广']
        planResponse.数据列表.forEach((item: ConsultantMonthlyPlanItem) => {
          if (item.咨询师 === row.咨询师 && networkTypes.includes(item.数据类型)) {
            yearPlanIncome += item.计划收入 || 0
            yearPlanEnrollment += item.计划招生 || 0
          }
        })
        
        row.网络媒体.计划收入 = yearPlanIncome
        row.网络媒体.计划招生 = yearPlanEnrollment
      })
      
      // TAB2 网络媒体 - 月度核心数据看板
      let currentMonthNetwork = 0
      result.tab2_网络媒体_月度核心数据看板.forEach((row) => {
        // 跳过合计和其他行
        if (row.咨询师 === '合计' || row.咨询师 === '其他') {
          return
        }
        
        // 如果当前行有月份,更新currentMonthNetwork
        if (row.月份) {
          currentMonthNetwork = parseInt(row.月份.replace('月', ''))
        }
        
        // 使用currentMonthNetwork来匹配计划数据
        let consultantMonthPlanIncome = 0
        let consultantMonthPlanEnrollment = 0
        
        const networkTypes = ['SEM', '新媒体', '市场口碑', '合作伙伴', '免费推广']
        planResponse.数据列表.forEach((item: ConsultantMonthlyPlanItem) => {
          if (item.咨询师 === row.咨询师 && item.月份 === currentMonthNetwork && networkTypes.includes(item.数据类型)) {
            consultantMonthPlanIncome += item.计划收入 || 0
            consultantMonthPlanEnrollment += item.计划招生 || 0
          }
        })
        
        row.网络媒体.计划收入 = consultantMonthPlanIncome
        row.网络媒体.计划招生 = consultantMonthPlanEnrollment
      })
      
      // TAB3 渠道 - 核心数据汇总
      result.tab3_渠道_核心数据汇总.forEach((row) => {
        if (row.月份 === '合计') return
        const month = parseInt(row.月份.replace('月', ''))
        let monthPlanIncome = 0
        let monthPlanEnrollment = 0
        
        planResponse.数据列表.forEach((item: ConsultantMonthlyPlanItem) => {
          if (item.月份 === month && item.数据类型 === '渠道') {
            monthPlanIncome += item.计划收入 || 0
            monthPlanEnrollment += item.计划招生 || 0
          }
        })
        
        row.渠道平台.计划收入 = monthPlanIncome
        row.渠道平台.计划招生 = monthPlanEnrollment
      })
      
      // TAB3 渠道 - 年度核心数据看板
      result.tab3_渠道_年度核心数据看板.forEach((row) => {
        if (row.咨询师 === '纯数字' || row.咨询师 === '其他') return
        let yearPlanIncome = 0
        let yearPlanEnrollment = 0
        
        planResponse.数据列表.forEach((item: ConsultantMonthlyPlanItem) => {
          if (item.咨询师 === row.咨询师 && item.数据类型 === '渠道') {
            yearPlanIncome += item.计划收入 || 0
            yearPlanEnrollment += item.计划招生 || 0
          }
        })
        
        row.渠道平台.计划收入 = yearPlanIncome
        row.渠道平台.计划招生 = yearPlanEnrollment
      })
      
      // TAB3 渠道 - 月度核心数据看板
      let currentMonthChannel = 0
      result.tab3_渠道_月度核心数据看板.forEach((row) => {
        // 跳过合计和其他行
        if (row.咨询师 === '合计' || row.咨询师 === '其他') {
          return
        }
        
        // 如果当前行有月份,更新currentMonthChannel
        if (row.月份) {
          currentMonthChannel = parseInt(row.月份.replace('月', ''))
        }
        
        // 使用currentMonthChannel来匹配计划数据
        let consultantMonthPlanIncome = 0
        let consultantMonthPlanEnrollment = 0
        
        planResponse.数据列表.forEach((item: ConsultantMonthlyPlanItem) => {
          if (item.咨询师 === row.咨询师 && item.月份 === currentMonthChannel && item.数据类型 === '渠道') {
            consultantMonthPlanIncome += item.计划收入 || 0
            consultantMonthPlanEnrollment += item.计划招生 || 0
          }
        })
        
        row.渠道平台.计划收入 = consultantMonthPlanIncome
        row.渠道平台.计划招生 = consultantMonthPlanEnrollment
      })
      
      // TAB4 口碑 - 核心数据汇总
      result.tab4_口碑_核心数据汇总.forEach((row) => {
        if (row.月份 === '合计') return
        const month = parseInt(row.月份.replace('月', ''))
        let monthPlanIncome = 0
        let monthPlanEnrollment = 0
        
        planResponse.数据列表.forEach((item: ConsultantMonthlyPlanItem) => {
          if (item.月份 === month && item.数据类型 === '口碑') {
            monthPlanIncome += item.计划收入 || 0
            monthPlanEnrollment += item.计划招生 || 0
          }
        })
        
        row.口碑平台.计划收入 = monthPlanIncome
        row.口碑平台.计划招生 = monthPlanEnrollment
      })
      
      // TAB4 口碑 - 年度核心数据看板
      result.tab4_口碑_年度核心数据看板.forEach((row) => {
        if (row.咨询师 === '纯数字' || row.咨询师 === '其他') return
        let yearPlanIncome = 0
        let yearPlanEnrollment = 0
        
        planResponse.数据列表.forEach((item: ConsultantMonthlyPlanItem) => {
          if (item.咨询师 === row.咨询师 && item.数据类型 === '口碑') {
            yearPlanIncome += item.计划收入 || 0
            yearPlanEnrollment += item.计划招生 || 0
          }
        })
        
        row.口碑平台.计划收入 = yearPlanIncome
        row.口碑平台.计划招生 = yearPlanEnrollment
      })
      
      // TAB4 口碑 - 月度核心数据看板
      let currentMonth = 0
      result.tab4_口碑_月度核心数据看板.forEach((row) => {
        // 跳过合计和其他行
        if (row.咨询师 === '合计' || row.咨询师 === '其他') {
          return
        }
        
        // 如果当前行有月份,更新currentMonth
        if (row.月份) {
          currentMonth = parseInt(row.月份.replace('月', ''))
        }
        
        // 使用currentMonth来匹配计划数据
        let consultantMonthPlanIncome = 0
        let consultantMonthPlanEnrollment = 0
        
        planResponse.数据列表.forEach((item: ConsultantMonthlyPlanItem) => {
          if (item.咨询师 === row.咨询师 && item.月份 === currentMonth && item.数据类型 === '口碑') {
            consultantMonthPlanIncome += item.计划收入 || 0
            consultantMonthPlanEnrollment += item.计划招生 || 0
          }
        })
        
        row.口碑平台.计划收入 = consultantMonthPlanIncome
        row.口碑平台.计划招生 = consultantMonthPlanEnrollment
      })
      
      setData(result)
    } catch (err) {
      console.error('加载数据失败:', err)
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }, [apiCampus, selectedYear])

  useEffect(() => {
    void loadCampusesFromConfig()
  }, [loadCampusesFromConfig])

  useEffect(() => {
    if (currentCampus && currentCampus !== selectedCampus) {
      setSelectedCampus(currentCampus)
    } else if (!currentCampus && !selectedCampus && defaultCampus) {
      setSelectedCampus(defaultCampus)
    }
  }, [currentCampus, selectedCampus, defaultCampus])

  useEffect(() => {
    if (apiCampus) void loadData()
  }, [apiCampus, selectedYear, loadData])

  // 编辑处理函数
  const handleEdit = useCallback((key: string, field: '计划收入' | '计划招生', value: number) => {
    setEditingCell({ key, field, value })
  }, [])

  // 保存单个单元格的编辑
  const handleSaveCell = useCallback(async (rowKey: string, rowData: any, dataType: string) => {
    if (!editingCell || editingCell.key !== rowKey) return

    const { field, value } = editingCell

    // 提取咨询师和月份信息
    const consultant = rowData.咨询师
    const monthStr = rowData.月份
    const month = parseInt(monthStr.replace('月', ''))

    if (!consultant || !month || consultant === '合计' || consultant === '其他') {
      setEditingCell(null)
      return
    }

    // 保存到待保存数据
    const pendingKey = `${consultant}-${month}-${dataType}`
    setPendingData(prev => ({
      ...prev,
      [pendingKey]: {
        ...prev[pendingKey],
        [field === '计划收入' ? '计划收入' : '计划招生']: value,
        consultant,
        month,
        dataType,
      }
    }))

    setEditingCell(null)
    message.success('已暂存，请点击保存按钮提交')
  }, [editingCell])

  // 批量保存所有待保存数据
  const handleSaveAll = useCallback(async () => {
    if (Object.keys(pendingData).length === 0) {
      message.warning('没有需要保存的数据')
      return
    }

    setSaving(true)
    try {
      const savePromises = Object.values(pendingData).map(item =>
        saveV3PlanData({
          campus: apiCampus,
          year: selectedYear,
          month: item.month,
          consultant: item.consultant,
          plan_income: item.计划收入,
          plan_enrollment: item.计划招生,
          data_type: item.dataType,
        })
      )

      await Promise.all(savePromises)
      message.success('保存成功')
      setPendingData({})
      await loadData() // 重新加载数据
    } catch (err) {
      console.error('保存失败:', err)
      message.error('保存失败')
    } finally {
      setSaving(false)
    }
  }, [pendingData, apiCampus, selectedYear, loadData])

  // ---------- TAB1 数据 ----------
  const tab1Data: Tab1TableRow[] = useMemo(() => {
    if (!data) return []
    return data.tab1_年度核心数据汇总.map((row, idx) => ({
      ...row,
      key: `t1-${idx}`,
      isTotal: row.月份 === '合计',
    }))
  }, [data])

  // ---------- TAB2 数据 ----------
  const tab2Data: Tab2TableRow[] = useMemo(() => {
    if (!data) return []
    return data.tab2_年度核心数据看板.map((row, idx) => ({
      ...row,
      key: `t2-${idx}`,
      isTotal: row.序号 === '合计' || row.咨询师 === '纯数字',
    }))
  }, [data])

  const tab2NetworkData: Tab2NetworkTableRow[] = useMemo(() => {
    if (!data) return []
    return data.tab2_网络媒体_核心数据汇总.map((row, idx) => ({
      ...row,
      key: `t2n-${idx}`,
      isTotal: row.月份 === '合计',
    }))
  }, [data])

  const tab2NetworkAnnualData: Tab2NetworkAnnualTableRow[] = useMemo(() => {
    if (!data) return []
    return data.tab2_网络媒体_年度核心数据看板.map((row, idx) => ({
      ...row,
      key: `t2na-${idx}`,
      isTotal: row.序号 === '合计' || row.咨询师 === '纯数字',
    }))
  }, [data])

  const tab2NetworkMonthlyData: Tab2NetworkMonthlyTableRow[] = useMemo(() => {
    if (!data) return []
    return data.tab2_网络媒体_月度核心数据看板.map((row, idx) => ({
      ...row,
      key: `t2nm-${idx}`,
      isTotal: row.咨询师 === '合计',
      isMonthFirst: row.月份 !== '',
    }))
  }, [data])

  const tab3ChannelSummaryData: Tab3ChannelSummaryTableRow[] = useMemo(() => {
    if (!data) return []
    return data.tab3_渠道_核心数据汇总.map((row, idx) => ({
      ...row,
      key: `t3c-${idx}`,
      isTotal: row.月份 === '合计',
    }))
  }, [data])

  const tab3ChannelAnnualData: Tab3ChannelAnnualTableRow[] = useMemo(() => {
    if (!data) return []
    return data.tab3_渠道_年度核心数据看板.map((row, idx) => ({
      ...row,
      key: `t3ca-${idx}`,
      isTotal: row.序号 === '合计' || row.咨询师 === '纯数字',
    }))
  }, [data])

  const tab3ChannelMonthlyData: Tab3ChannelMonthlyTableRow[] = useMemo(() => {
    if (!data) return []
    return data.tab3_渠道_月度核心数据看板.map((row, idx) => ({
      ...row,
      key: `t3cm-${idx}`,
      isTotal: row.咨询师 === '合计',
      isMonthFirst: row.月份 !== '',
    }))
  }, [data])

  const tab4KoubeiSummaryData: Tab4KoubeiSummaryTableRow[] = useMemo(() => {
    if (!data) return []
    return data.tab4_口碑_核心数据汇总.map((row, idx) => ({
      ...row,
      key: `t4k-${idx}`,
      isTotal: row.月份 === '合计',
    }))
  }, [data])

  const tab4KoubeiAnnualData: Tab4KoubeiAnnualTableRow[] = useMemo(() => {
    if (!data) return []
    return data.tab4_口碑_年度核心数据看板.map((row, idx) => ({
      ...row,
      key: `t4ka-${idx}`,
      isTotal: row.序号 === '合计' || row.咨询师 === '纯数字',
    }))
  }, [data])

  const tab4KoubeiMonthlyData: Tab4KoubeiMonthlyTableRow[] = useMemo(() => {
    if (!data) return []
    return data.tab4_口碑_月度核心数据看板.map((row, idx) => ({
      ...row,
      key: `t4km-${idx}`,
      isTotal: row.咨询师 === '合计',
      isMonthFirst: row.月份 !== '',
    }))
  }, [data])

  // ---------- TAB3 数据 ----------
  const tab3Data: Tab3TableRow[] = useMemo(() => {
    if (!data) return []
    return data.tab3_月度核心数据看板.map((row, idx) => ({
      ...row,
      key: `t3-${idx}`,
      isTotal: row.咨询师 === '合计',
      isMonthFirst: row.月份 !== '',
    }))
  }, [data])

  // 行样式
  const rowClassTab1 = (record: Tab1TableRow) =>
    record.isTotal ? styles.totalRow : ''

  const rowClassTab2 = (record: Tab2TableRow) =>
    record.isTotal ? styles.totalRow : ''

  const rowClassTab2Network = (record: Tab2NetworkTableRow) =>
    record.isTotal ? styles.totalRow : ''

  const rowClassTab2NetworkAnnual = (record: Tab2NetworkAnnualTableRow) =>
    record.isTotal ? styles.totalRow : ''

  const rowClassTab2NetworkMonthly = (record: Tab2NetworkMonthlyTableRow) => {
    const classes: string[] = []
    if (record.isTotal) classes.push(styles.totalRow)
    if (record.isMonthFirst) classes.push(styles.monthFirstRow)
    return classes.join(' ')
  }

  const rowClassTab3ChannelSummary = (record: Tab3ChannelSummaryTableRow) =>
    record.isTotal ? styles.totalRow : ''

  const rowClassTab3ChannelAnnual = (record: Tab3ChannelAnnualTableRow) =>
    record.isTotal ? styles.totalRow : ''

  const rowClassTab3ChannelMonthly = (record: Tab3ChannelMonthlyTableRow) => {
    const classes: string[] = []
    if (record.isTotal) classes.push(styles.totalRow)
    if (record.isMonthFirst) classes.push(styles.monthFirstRow)
    return classes.join(' ')
  }

  const rowClassTab4KoubeiSummary = (record: Tab4KoubeiSummaryTableRow) =>
    record.isTotal ? styles.totalRow : ''

  const rowClassTab4KoubeiAnnual = (record: Tab4KoubeiAnnualTableRow) =>
    record.isTotal ? styles.totalRow : ''

  const rowClassTab4KoubeiMonthly = (record: Tab4KoubeiMonthlyTableRow) => {
    const classes: string[] = []
    if (record.isTotal) classes.push(styles.totalRow)
    if (record.isMonthFirst) classes.push(styles.monthFirstRow)
    return classes.join(' ')
  }

  const rowClassTab3 = (record: Tab3TableRow) => {
    const classes: string[] = []
    if (record.isTotal) classes.push(styles.totalRow)
    if (record.isMonthFirst) classes.push(styles.monthFirstRow)
    return classes.join(' ')
  }

  // 页面标题
  const pageTitle = useMemo(() => {
    const campus = apiCampus || '神殿'
    return `${campus} ${selectedYear}年度招生数据`
  }, [apiCampus, selectedYear])

  // 创建可编辑列实例
  const tab2NetworkMonthlyColumns = useMemo(() => {
    return createEditableNetworkMonthlyColumns(editingCell, (key, field, value) => {
      handleEdit(key, field, value)
      // 找到对应的行数据
      const row = tab2NetworkMonthlyData.find(r => r.key === key)
      if (row) {
        handleSaveCell(key, row, '网络')
      }
    })
  }, [editingCell, tab2NetworkMonthlyData, handleEdit, handleSaveCell])

  const tab3ChannelMonthlyColumns = useMemo(() => {
    return createEditableChannelMonthlyColumns(editingCell, (key, field, value) => {
      handleEdit(key, field, value)
      const row = tab3ChannelMonthlyData.find(r => r.key === key)
      if (row) {
        handleSaveCell(key, row, '渠道')
      }
    })
  }, [editingCell, tab3ChannelMonthlyData, handleEdit, handleSaveCell])

  const tab4KoubeiMonthlyColumns = useMemo(() => {
    return createEditableKoubeiMonthlyColumns(editingCell, (key, field, value) => {
      handleEdit(key, field, value)
      const row = tab4KoubeiMonthlyData.find(r => r.key === key)
      if (row) {
        handleSaveCell(key, row, '口碑')
      }
    })
  }, [editingCell, tab4KoubeiMonthlyData, handleEdit, handleSaveCell])

  const tabItems = [
    {
      key: 'tab1',
      label: `${selectedCampus}总表`,
      children: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* 子表1: 年度核心数据汇总 */}
          <Table<Tab1TableRow>
            columns={tab1Columns}
            dataSource={tab1Data}
            loading={loading}
            rowClassName={rowClassTab1}
            size="small"
            scroll={{ x: 'max-content' }}
            pagination={false}
            bordered
            title={() => (
              <Text strong>{pageTitle} — 核心数据汇总</Text>
            )}
          />

          {/* 子表2: 年度核心数据看板 */}
          <Table<Tab2TableRow>
            columns={tab2Columns}
            dataSource={tab2Data}
            loading={loading}
            rowClassName={rowClassTab2}
            size="small"
            scroll={{ x: 'max-content' }}
            pagination={false}
            bordered
            title={() => (
              <Text strong>{pageTitle} — 年度核心数据看板</Text>
            )}
          />

          {/* 子表3: 月度核心数据看板 */}
          <Table<Tab3TableRow>
            columns={tab3Columns}
            dataSource={tab3Data}
            loading={loading}
            rowClassName={rowClassTab3}
            size="small"
            scroll={{ x: 'max-content', y: 700 }}
            pagination={false}
            bordered
            title={() => (
              <Text strong>{pageTitle} — 月度核心数据看板</Text>
            )}
          />
        </div>
      ),
    },
    {
      key: 'tab2',
      label: `${selectedCampus}网络`,
      children: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <Table<Tab2NetworkTableRow>
            columns={tab2NetworkColumns}
            dataSource={tab2NetworkData}
            loading={loading}
            rowClassName={rowClassTab2Network}
            size="small"
            scroll={{ x: 'max-content' }}
            pagination={false}
            bordered
            title={() => (
              <Text strong>{pageTitle} 网络招生数据核心数据汇总</Text>
            )}
          />

          <Table<Tab2NetworkAnnualTableRow>
            columns={tab2NetworkAnnualColumns}
            dataSource={tab2NetworkAnnualData}
            loading={loading}
            rowClassName={rowClassTab2NetworkAnnual}
            size="small"
            scroll={{ x: 'max-content' }}
            pagination={false}
            bordered
            title={() => (
              <Text strong>{pageTitle} 网络招生数据年度核心数据看板</Text>
            )}
          />

          <Table<Tab2NetworkMonthlyTableRow>
            columns={tab2NetworkMonthlyColumns}
            dataSource={tab2NetworkMonthlyData}
            loading={loading}
            rowClassName={rowClassTab2NetworkMonthly}
            size="small"
            scroll={{ x: 'max-content', y: 700 }}
            pagination={false}
            bordered
            title={() => (
              <Text strong>{pageTitle} 网络招生数据月度核心数据看板</Text>
            )}
          />
        </div>
      ),
    },
    {
      key: 'tab3',
      label: `${selectedCampus}渠道`,
      children: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <Table<Tab3ChannelSummaryTableRow>
            columns={tab3ChannelSummaryColumns}
            dataSource={tab3ChannelSummaryData}
            loading={loading}
            rowClassName={rowClassTab3ChannelSummary}
            size="small"
            scroll={{ x: 'max-content' }}
            pagination={false}
            bordered
            title={() => (
              <Text strong>{pageTitle} 渠道招生数据核心数据看板</Text>
            )}
          />

          <Table<Tab3ChannelAnnualTableRow>
            columns={tab3ChannelAnnualColumns}
            dataSource={tab3ChannelAnnualData}
            loading={loading}
            rowClassName={rowClassTab3ChannelAnnual}
            size="small"
            scroll={{ x: 'max-content' }}
            pagination={false}
            bordered
            title={() => (
              <Text strong>{pageTitle} 咨询师渠道招生数据年度核心数据看板</Text>
            )}
          />

          <Table<Tab3ChannelMonthlyTableRow>
            columns={tab3ChannelMonthlyColumns}
            dataSource={tab3ChannelMonthlyData}
            loading={loading}
            rowClassName={rowClassTab3ChannelMonthly}
            size="small"
            scroll={{ x: 'max-content', y: 700 }}
            pagination={false}
            bordered
            title={() => (
              <Text strong>{pageTitle} 月度渠道招生数据月度核心数据看板</Text>
            )}
          />
        </div>
      ),
    },
    {
      key: 'tab4',
      label: `${selectedCampus}口碑`,
      children: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <Table<Tab4KoubeiSummaryTableRow>
            columns={tab4KoubeiSummaryColumns}
            dataSource={tab4KoubeiSummaryData}
            loading={loading}
            rowClassName={rowClassTab4KoubeiSummary}
            size="small"
            scroll={{ x: 'max-content' }}
            pagination={false}
            bordered
            title={() => (
              <Text strong>{pageTitle} 口碑招生数据核心数据看板</Text>
            )}
          />

          <Table<Tab4KoubeiAnnualTableRow>
            columns={tab4KoubeiAnnualColumns}
            dataSource={tab4KoubeiAnnualData}
            loading={loading}
            rowClassName={rowClassTab4KoubeiAnnual}
            size="small"
            scroll={{ x: 'max-content' }}
            pagination={false}
            bordered
            title={() => (
              <Text strong>{pageTitle} 咨询师口碑招生数据年度核心数据看板</Text>
            )}
          />

          <Table<Tab4KoubeiMonthlyTableRow>
            columns={tab4KoubeiMonthlyColumns}
            dataSource={tab4KoubeiMonthlyData}
            loading={loading}
            rowClassName={rowClassTab4KoubeiMonthly}
            size="small"
            scroll={{ x: 'max-content', y: 700 }}
            pagination={false}
            bordered
            title={() => (
              <Text strong>{pageTitle} 口碑招生数据月度核心数据看板</Text>
            )}
          />
        </div>
      ),
    },
  ]

  return (
    <div className={styles.container}>
      {/* 筛选栏 */}
      <Card className={styles.filterCard} size="small">
        <Space size="large" wrap>
          <Space>
            <Text strong>神殿：</Text>
            <Select
              value={selectedCampus}
              onChange={(v) => {
                setSelectedCampus(v)
                setCampus(v)
              }}
              options={campusOptions}
              placeholder="选择神殿"
              style={{ width: 120 }}
            />
          </Space>
          <Space>
            <Text strong>年份：</Text>
            <Select
              value={selectedYear}
              onChange={setSelectedYear}
              options={yearOptions}
              style={{ width: 100 }}
            />
          </Space>
          <Button icon={<ReloadOutlined />} onClick={loadData} loading={loading}>
            刷新
          </Button>
          {Object.keys(pendingData).length > 0 && (
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSaveAll}
              loading={saving}
            >
              保存 ({Object.keys(pendingData).length})
            </Button>
          )}
        </Space>
      </Card>

      {/* 数据表格 */}
      <Card className={styles.tableCard}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          size="large"
        />
      </Card>
    </div>
  )
}

export default ConsultantDataSummaryV3

