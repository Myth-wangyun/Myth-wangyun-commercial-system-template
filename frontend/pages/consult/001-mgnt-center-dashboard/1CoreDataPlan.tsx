/**
 * TAB1 - 清美教育集团核心数据计划
 *
 * 集团汇总单行：总招生收入、总招生数据、总转化率、网络招生成本、总咨询师职数、总渠道职数
 * 数据来源：
 *   - 财务数据(007)汇总分类 → 计划收入/实际收入/计划招生/实际招生/退费人数
 *   - 咨询量录入系统 → 上门总量/咨询总量
 *   - 职数数据(010) → 咨询师职数/渠道职数
 */

import React, { useState, useEffect, useCallback } from 'react'
import { App, Table, Spin, Button, Space } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { NoCopyContainer } from '@/components/common'
import * as financialApi from '@/pages/consult/004mgmt-data/007-financial-income/api'
import * as statsApi from '@/pages/consult/type-count-system/statsApi'
import { getStaffingSummaryByYear } from '@/services/consult/staffing'

interface CoreDataPlanRow {
  key: string
  label: string
  // 总招生收入
  计划收入: number
  实际收入: number
  // 总招生数据
  计划招生: number
  实际招生: number
  退费人数: number
  上门总量: number
  平均电话量: string
  咨询总量: number
  // 总转化率
  报名转化率: string
  当面转化率: string
  上门率: string
  // 网络招生成本
  费用投入: number
  招生成本: string
  // 总咨询师职数
  咨询总职数: number
  咨询干部职数: number
  咨询员工职数: number
  // 总渠道职数
  渠道总职数: number
  县办: number
  乡办: number
  信息员: number
}

interface Tab1Props {
  year: string
}

const EMPTY_ROW: CoreDataPlanRow = {
  key: 'total',
  label: '总数据',
  计划收入: 0, 实际收入: 0,
  计划招生: 0, 实际招生: 0, 退费人数: 0,
  上门总量: 0, 平均电话量: '#DIV/0!', 咨询总量: 0,
  报名转化率: '#DIV/0!', 当面转化率: '#DIV/0!', 上门率: '#DIV/0!',
  费用投入: 0, 招生成本: '#DIV/0!',
  咨询总职数: 0, 咨询干部职数: 0, 咨询员工职数: 0,
  渠道总职数: 0, 县办: 0, 乡办: 0, 信息员: 0,
}

export default function Tab1CoreDataPlan({ year }: Tab1Props) {
  const { message } = App.useApp()
  const [loading, setLoading] = useState(false)
  const [row, setRow] = useState<CoreDataPlanRow>({ ...EMPTY_ROW })

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const yearNum = parseInt(year)
      const [financialResult, consultStatsResult, staffingResult] = await Promise.all([
        financialApi.getMgntCoreSummaryAll({ year: yearNum }).catch(() => null),
        statsApi.getAllCampusYearlySummary({ 年份: yearNum }).catch(() => null),
        getStaffingSummaryByYear(yearNum).catch(() => []),
      ])

      const newRow: CoreDataPlanRow = { ...EMPTY_ROW }

      // 汇总财务数据 - 汇总所有数据类型的计划数据
      if (financialResult?.分类数据) {
        // 遍历所有数据类型（SEM、新媒体、市场口碑、合作伙伴等）
        Object.values(financialResult.分类数据).forEach((dataTypeArray: any) => {
          if (Array.isArray(dataTypeArray)) {
            dataTypeArray.forEach((item) => {
              newRow.计划收入 += Number(item.计划收入) || 0
              newRow.实际收入 += Number(item.实际收入) || 0
              newRow.计划招生 += Number(item.计划招生) || 0
              newRow.实际招生 += Number(item.实际招生) || 0
              newRow.退费人数 += Number(item.退费人数) || 0
            })
          }
        })
      }

      // 汇总咨询量数据（实际招生/退费/收入也从咨询量系统获取）
      if (consultStatsResult?.success && consultStatsResult.data) {
        const { 合计 } = consultStatsResult.data
        if (合计) {
          newRow.咨询总量 = 合计.咨询总量 || 0
          newRow.上门总量 = 合计.上门量 || 0
          newRow.实际招生 = (newRow.实际招生 || 0) + (合计.报名量 || 0)
          newRow.退费人数 = (newRow.退费人数 || 0) + (合计.退费人数 || 0)
          newRow.实际收入 = (newRow.实际收入 || 0) + (合计.实际收入 || 0)
        }
      }

      // 计算转化率
      if (newRow.咨询总量 > 0 && newRow.实际招生 > 0) {
        newRow.报名转化率 = ((newRow.实际招生 / newRow.咨询总量) * 100).toFixed(1) + '%'
      }
      if (newRow.上门总量 > 0 && newRow.实际招生 > 0) {
        newRow.当面转化率 = ((newRow.实际招生 / newRow.上门总量) * 100).toFixed(1) + '%'
      }
      if (newRow.咨询总量 > 0 && newRow.上门总量 > 0) {
        newRow.上门率 = ((newRow.上门总量 / newRow.咨询总量) * 100).toFixed(1) + '%'
      }
      // 平均电话量 = 电话量合计 / 有数据的神殿数
      const campusCount = consultStatsResult?.data?.神殿数据?.length || financialResult?.分类数据?.['汇总']?.length || 0
      if (campusCount > 0 && newRow.咨询总量 > 0) {
        newRow.平均电话量 = (newRow.咨询总量 / campusCount).toFixed(0)
      }

      // 汇总职数数据
      if (staffingResult && staffingResult.length > 0) {
        staffingResult.forEach((s) => {
          newRow.咨询总职数 += s.咨询总职数 || 0
          newRow.咨询干部职数 += s.咨询干部职数 || 0
          newRow.咨询员工职数 += s.咨询员工职数 || 0
          newRow.渠道总职数 += s.渠道总职数 || 0
          newRow.县办 += s.县办 || 0
          newRow.乡办 += s.乡办 || 0
          newRow.信息员 += s.信息员 || 0
        })
      }

      setRow(newRow)
    } catch (error) {
      console.error('加载集团核心数据计划失败:', error)
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }, [year])

  useEffect(() => {
    loadData()
  }, [loadData])

  const renderValue = (val: number | string) => {
    if (typeof val === 'string') {
      const isError = val.includes('#DIV/0!')
      return <span style={{ color: isError ? '#999' : '#1890ff', fontWeight: 'bold' }}>{val}</span>
    }
    return <strong style={{ color: '#1890ff' }}>{val}</strong>
  }

  const columns = [
    {
      title: '清美教育集团',
      dataIndex: 'label',
      width: 100,
      fixed: 'left' as const,
      align: 'center' as const,
      onHeaderCell: () => ({ style: { background: '#90EE90', fontWeight: 'bold' } }),
    },
    {
      title: '总招生收入',
      onHeaderCell: () => ({ style: { background: '#90EE90' } }),
      children: [
        { title: '计划收入', width: 100, align: 'center' as const, render: (_: any, r: CoreDataPlanRow) => renderValue(r.计划收入) },
        { title: '实际收入', width: 100, align: 'center' as const, render: (_: any, r: CoreDataPlanRow) => renderValue(r.实际收入) },
      ],
    },
    {
      title: '总招生数据',
      onHeaderCell: () => ({ style: { background: '#90EE90' } }),
      children: [
        { title: '计划招生', width: 80, align: 'center' as const, render: (_: any, r: CoreDataPlanRow) => renderValue(r.计划招生) },
        { title: '实际招生', width: 80, align: 'center' as const, render: (_: any, r: CoreDataPlanRow) => renderValue(r.实际招生) },
        { title: '退费人数', width: 80, align: 'center' as const, render: (_: any, r: CoreDataPlanRow) => renderValue(r.退费人数) },
        { title: '上门总量', width: 80, align: 'center' as const, render: (_: any, r: CoreDataPlanRow) => renderValue(r.上门总量) },
        { title: '平均电话量', width: 90, align: 'center' as const, render: (_: any, r: CoreDataPlanRow) => renderValue(r.平均电话量) },
        { title: '咨询总量', width: 80, align: 'center' as const, render: (_: any, r: CoreDataPlanRow) => renderValue(r.咨询总量) },
      ],
    },
    {
      title: '总转化率',
      onHeaderCell: () => ({ style: { background: '#90EE90' } }),
      children: [
        { title: '报名转化率', width: 90, align: 'center' as const, render: (_: any, r: CoreDataPlanRow) => renderValue(r.报名转化率) },
        { title: '当面转化率', width: 90, align: 'center' as const, render: (_: any, r: CoreDataPlanRow) => renderValue(r.当面转化率) },
        { title: '上门率', width: 80, align: 'center' as const, render: (_: any, r: CoreDataPlanRow) => renderValue(r.上门率) },
      ],
    },
    {
      title: '网络招生成本',
      onHeaderCell: () => ({ style: { background: '#90EE90' } }),
      children: [
        { title: '费用投入', width: 90, align: 'center' as const, render: (_: any, r: CoreDataPlanRow) => renderValue(r.费用投入) },
        { title: '招生成本', width: 90, align: 'center' as const, render: (_: any, r: CoreDataPlanRow) => renderValue(r.招生成本) },
      ],
    },
    {
      title: '总咨询师职数',
      onHeaderCell: () => ({ style: { background: '#90EE90' } }),
      children: [
        { title: '咨询总职数', width: 90, align: 'center' as const, render: (_: any, r: CoreDataPlanRow) => renderValue(r.咨询总职数) },
        { title: '咨询干部职数', width: 100, align: 'center' as const, render: (_: any, r: CoreDataPlanRow) => renderValue(r.咨询干部职数) },
        { title: '咨询员工职数', width: 100, align: 'center' as const, render: (_: any, r: CoreDataPlanRow) => renderValue(r.咨询员工职数) },
      ],
    },
    {
      title: '总渠道职数',
      onHeaderCell: () => ({ style: { background: '#90EE90' } }),
      children: [
        { title: '渠道总职数', width: 90, align: 'center' as const, render: (_: any, r: CoreDataPlanRow) => renderValue(r.渠道总职数) },
        { title: '县办', width: 60, align: 'center' as const, render: (_: any, r: CoreDataPlanRow) => renderValue(r.县办) },
        { title: '乡办', width: 60, align: 'center' as const, render: (_: any, r: CoreDataPlanRow) => renderValue(r.乡办) },
        { title: '信息员', width: 70, align: 'center' as const, render: (_: any, r: CoreDataPlanRow) => renderValue(r.信息员) },
      ],
    },
  ]

  return (
    <NoCopyContainer warningMessage="祈福司门数据禁止复制">
      <Spin spinning={loading}>
        <div>
          <div style={{
            background: '#90EE90',
            padding: '8px 16px',
            fontWeight: 'bold',
            marginBottom: 8,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span>清美教育集团{year}年核心数据计划</span>
            <Space>
              <span style={{ fontSize: 12, color: '#666', fontWeight: 'normal' }}>
                💡 数据自动从财务、咨询量、职数系统汇总
              </span>
              <Button icon={<ReloadOutlined />} size="small" onClick={loadData}>刷新数据</Button>
            </Space>
          </div>
          <Table
            columns={columns}
            dataSource={[row]}
            pagination={false}
            bordered
            size="small"
            scroll={{ x: 2000 }}
          />
        </div>
      </Spin>
    </NoCopyContainer>
  )
}
