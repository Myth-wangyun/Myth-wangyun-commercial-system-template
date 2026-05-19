/**
 * TAB2 - 清美教育集团年度核心数据看板汇总
 *
 * 按神殿展示：全神殿及平台招生收入、招生数据、转化率、招生成本、咨询师职数、渠道职数
 * 数据来源：
 *   - 计划收入、实际收入、计划招生、实际招生、退费人数 来自007财务收入和退费
 *   - 上门总量、咨询总量 来自咨询量录入系统
 *   - 咨询师职数、渠道职数 来自010咨询和渠道职数
 */

import React, { useMemo, useState, useEffect, useCallback } from 'react'
import { App, Table, Spin, Button, Space } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { useCampusStore } from '@/stores/campusStore'
import { NoCopyContainer } from '@/components/common'
import { normalizeCampusName } from '@/utils/campusSort'
import * as financialApi from '@/pages/consult/004mgmt-data/007-financial-income/api'
import * as statsApi from '@/pages/consult/type-count-system/statsApi'
import { getStaffingSummaryByYear, type StaffingSummary } from '@/services/consult/staffing'

interface CoreDataSummaryRow {
  key: string
  序号: number | string
  神殿: string
  isTotal: boolean
  // 全神殿及平台招生收入
  计划收入: number
  实际收入: number
  收入完成率: string
  // 全神殿及平台招生数据
  计划招生: number
  实际招生: number
  退费人数: number
  上门总量: number
  平均电话量: string
  咨询总量: number
  // 全神殿及平台转化率
  报名转化率: string
  当面转化率: string
  上门率: string
  // 全神殿及平台招生成本
  费用投入: number
  招生成本: string
  // 咨询师
  咨询总职数: number
  咨询干部职数: number
  咨询员工职数: number
  // 渠道职数
  渠道总职数: number
  县办: number
  乡办: number
  信息员: number
}

interface Tab2Props {
  year: string
}

export default function Tab2CoreDataSummary({ year }: Tab2Props) {
  const { message } = App.useApp()
  const allCampuses = useCampusStore.getState().getAllCampuses()
  const campusList = useMemo(() => allCampuses.map(c => normalizeCampusName(c.name)), [allCampuses])
  const [loading, setLoading] = useState(false)

  const makeEmptyRow = (序号: number | string, campus: string, isTotal = false): CoreDataSummaryRow => ({
    key: campus,
    序号,
    神殿: campus,
    isTotal,
    计划收入: 0, 实际收入: 0, 收入完成率: '#DIV/0!',
    计划招生: 0, 实际招生: 0, 退费人数: 0,
    上门总量: 0, 平均电话量: '#DIV/0!', 咨询总量: 0,
    报名转化率: '#DIV/0!', 当面转化率: '#DIV/0!', 上门率: '#DIV/0!',
    费用投入: 0, 招生成本: '#DIV/0!',
    咨询总职数: 0, 咨询干部职数: 0, 咨询员工职数: 0,
    渠道总职数: 0, 县办: 0, 乡办: 0, 信息员: 0,
  })

  const initialRows = useMemo(() => {
    const rows = campusList.map((c, idx) => makeEmptyRow(idx + 1, c, false))
    rows.push(makeEmptyRow('合计', '合计/平均', true))
    return rows
  }, [campusList])

  const [rows, setRows] = useState<CoreDataSummaryRow[]>(initialRows)

  // 计算单行转化率
  const calculateRates = (row: CoreDataSummaryRow) => {
    // 收入完成率 = 实际收入 / 计划收入 * 100
    if (row.计划收入 > 0 && row.实际收入 > 0) {
      row.收入完成率 = ((row.实际收入 / row.计划收入) * 100).toFixed(1) + '%'
    } else {
      row.收入完成率 = '#DIV/0!'
    }
    if (row.咨询总量 > 0 && row.实际招生 > 0) {
      row.报名转化率 = ((row.实际招生 / row.咨询总量) * 100).toFixed(1) + '%'
    } else {
      row.报名转化率 = '#DIV/0!'
    }
    if (row.上门总量 > 0 && row.实际招生 > 0) {
      row.当面转化率 = ((row.实际招生 / row.上门总量) * 100).toFixed(1) + '%'
    } else {
      row.当面转化率 = '#DIV/0!'
    }
    if (row.咨询总量 > 0 && row.上门总量 > 0) {
      row.上门率 = ((row.上门总量 / row.咨询总量) * 100).toFixed(1) + '%'
    } else {
      row.上门率 = '#DIV/0!'
    }
    // 平均电话量 - 单神殿暂不计算
    if (row.咨询总量 > 0) {
      row.平均电话量 = row.咨询总量.toString()
    }
    // 招生成本 = 费用投入 / 实际招生
    if (row.费用投入 > 0 && row.实际招生 > 0) {
      row.招生成本 = (row.费用投入 / row.实际招生).toFixed(0)
    } else {
      row.招生成本 = '#DIV/0!'
    }
  }

  // 重新计算合计行
  const recomputeTotal = (next: CoreDataSummaryRow[]): CoreDataSummaryRow[] => {
    const dataRows = next.filter(r => !r.isTotal)
    const totalRow = next.find(r => r.isTotal)
    if (!totalRow) return next

    const sumFields: (keyof CoreDataSummaryRow)[] = [
      '计划收入', '实际收入', '计划招生', '实际招生', '退费人数',
      '上门总量', '咨询总量', '费用投入',
      '咨询总职数', '咨询干部职数', '咨询员工职数',
      '渠道总职数', '县办', '乡办', '信息员',
    ]

    sumFields.forEach(field => {
      const sum = dataRows.reduce((acc, r) => {
        const val = r[field]
        return acc + (typeof val === 'number' ? val : 0)
      }, 0)
      ;(totalRow as any)[field] = sum
    })

    calculateRates(totalRow)
    return next
  }

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const yearNum = parseInt(year)

      const [financialResult, consultStatsResult, staffingResult] = await Promise.all([
        financialApi.getMgntCoreSummaryAll({ year: yearNum }).catch(() => null),
        statsApi.getAllCampusYearlySummary({ 年份: yearNum }).catch(() => null),
        getStaffingSummaryByYear(yearNum).catch(() => [] as StaffingSummary[]),
      ])

      // 构建职数映射 - 使用标准化神殿名作为键
      const staffingMap = new Map<string, StaffingSummary>()
      staffingResult.forEach(s => staffingMap.set(normalizeCampusName(s.神殿), s))

      setRows(prev => {
        const next = prev.map(r => ({
          ...makeEmptyRow(r.序号, r.神殿, r.isTotal),
        }))

        // 处理财务数据 - 汇总所有数据类型的计划数据
        if (financialResult?.分类数据) {
          // 为每个神殿汇总所有数据类型的计划数据
          const campusSummary = new Map<string, { 计划收入: number; 实际收入: number; 计划招生: number; 实际招生: number; 退费人数: number }>()
          
          // 遍历所有数据类型（SEM、新媒体、市场口碑、合作伙伴等）
          Object.values(financialResult.分类数据).forEach((dataTypeArray: any) => {
            if (Array.isArray(dataTypeArray)) {
              dataTypeArray.forEach((item) => {
                const campus = item.神殿
                if (!campusSummary.has(campus)) {
                  campusSummary.set(campus, { 计划收入: 0, 实际收入: 0, 计划招生: 0, 实际招生: 0, 退费人数: 0 })
                }
                const summary = campusSummary.get(campus)!
                summary.计划收入 += Number(item.计划收入) || 0
                summary.实际收入 += Number(item.实际收入) || 0
                summary.计划招生 += Number(item.计划招生) || 0
                summary.实际招生 += Number(item.实际招生) || 0
                summary.退费人数 += Number(item.退费人数) || 0
              })
            }
          })
          
          // 将汇总数据填充到对应神殿
          campusSummary.forEach((summary, campus) => {
            const row = next.find(r => r.神殿 === campus && !r.isTotal)
            if (row) {
              row.计划收入 = summary.计划收入
              row.实际收入 = summary.实际收入
              row.计划招生 = summary.计划招生
              row.实际招生 = summary.实际招生
              row.退费人数 = summary.退费人数
            }
          })
        }

        // 处理咨询量统计数据（含实际招生/退费/收入）
        if (consultStatsResult?.success && consultStatsResult.data) {
          const { 神殿数据 } = consultStatsResult.data
          神殿数据.forEach((item: any) => {
            const row = next.find(r => r.神殿 === item.神殿 && !r.isTotal)
            if (row) {
              row.咨询总量 = item.咨询总量 || 0
              row.上门总量 = item.上门量 || 0
              row.实际招生 = (row.实际招生 || 0) + (item.报名量 || 0)
              row.退费人数 = (row.退费人数 || 0) + (item.退费人数 || 0)
              row.实际收入 = (row.实际收入 || 0) + (item.实际收入 || 0)
            }
          })
        }

        // 处理职数数据
        next.filter(r => !r.isTotal).forEach(row => {
          const staffing = staffingMap.get(row.神殿)
          if (staffing) {
            row.咨询总职数 = staffing.咨询总职数 || 0
            row.咨询干部职数 = staffing.咨询干部职数 || 0
            row.咨询员工职数 = staffing.咨询员工职数 || 0
            row.渠道总职数 = staffing.渠道总职数 || 0
            row.县办 = staffing.县办 || 0
            row.乡办 = staffing.乡办 || 0
            row.信息员 = staffing.信息员 || 0
          }
        })

        // 计算每行转化率
        next.filter(r => !r.isTotal).forEach(calculateRates)

        return recomputeTotal(next)
      })
    } catch (error) {
      console.error('加载数据失败:', error)
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }, [year])

  useEffect(() => {
    loadData()
  }, [loadData])

  const renderValue = (val: number | string, isTotal: boolean, color = '#1890ff') => {
    const isError = typeof val === 'string' && val.includes('#DIV/0!')
    if (isTotal) {
      return <strong style={{ color: isError ? '#999' : color }}>{isError ? '#DIV/0!' : val}</strong>
    }
    return <span style={{ color: isError ? '#999' : '#666' }}>{val}</span>
  }

  const columns = [
    {
      title: '序号',
      dataIndex: '序号',
      width: 50,
      fixed: 'left' as const,
      align: 'center' as const,
      render: (val: number | string, r: CoreDataSummaryRow) =>
        r.isTotal ? <strong style={{ color: '#ff4d4f' }}>{''}</strong> : val,
    },
    {
      title: '神殿',
      dataIndex: '神殿',
      width: 80,
      fixed: 'left' as const,
      align: 'center' as const,
      render: (val: string, r: CoreDataSummaryRow) =>
        r.isTotal ? <strong style={{ color: '#ff4d4f' }}>{val}</strong> : val,
    },
    {
      title: '全神殿及平台招生收入',
      onHeaderCell: () => ({ style: { background: '#90EE90' } }),
      children: [
        { title: '计划收入', width: 90, align: 'center' as const, render: (_: any, r: CoreDataSummaryRow) => renderValue(r.计划收入, r.isTotal) },
        { title: '实际收入', width: 90, align: 'center' as const, render: (_: any, r: CoreDataSummaryRow) => renderValue(r.实际收入, r.isTotal) },
        { title: '收入完成率', width: 90, align: 'center' as const, render: (_: any, r: CoreDataSummaryRow) => renderValue(r.收入完成率, r.isTotal, '#52c41a') },
      ],
    },
    {
      title: '全神殿及平台招生数据',
      onHeaderCell: () => ({ style: { background: '#90EE90' } }),
      children: [
        { title: '计划招生', width: 80, align: 'center' as const, render: (_: any, r: CoreDataSummaryRow) => renderValue(r.计划招生, r.isTotal) },
        { title: '实际招生', width: 80, align: 'center' as const, render: (_: any, r: CoreDataSummaryRow) => renderValue(r.实际招生, r.isTotal) },
        { title: '退费人数', width: 80, align: 'center' as const, render: (_: any, r: CoreDataSummaryRow) => renderValue(r.退费人数, r.isTotal) },
        { title: '上门总量', width: 80, align: 'center' as const, render: (_: any, r: CoreDataSummaryRow) => renderValue(r.上门总量, r.isTotal) },
        { title: '平均电话量', width: 90, align: 'center' as const, render: (_: any, r: CoreDataSummaryRow) => renderValue(r.平均电话量, r.isTotal) },
        { title: '咨询总量', width: 80, align: 'center' as const, render: (_: any, r: CoreDataSummaryRow) => renderValue(r.咨询总量, r.isTotal) },
      ],
    },
    {
      title: '全神殿及平台转化率',
      onHeaderCell: () => ({ style: { background: '#90EE90' } }),
      children: [
        { title: '报名转化率', width: 90, align: 'center' as const, render: (_: any, r: CoreDataSummaryRow) => renderValue(r.报名转化率, r.isTotal, '#fa8c16') },
        { title: '当面转化率', width: 90, align: 'center' as const, render: (_: any, r: CoreDataSummaryRow) => renderValue(r.当面转化率, r.isTotal, '#fa8c16') },
        { title: '上门率', width: 80, align: 'center' as const, render: (_: any, r: CoreDataSummaryRow) => renderValue(r.上门率, r.isTotal, '#fa8c16') },
      ],
    },
    {
      title: '全神殿及平台招生成本',
      onHeaderCell: () => ({ style: { background: '#90EE90' } }),
      children: [
        { title: '费用投入', width: 90, align: 'center' as const, render: (_: any, r: CoreDataSummaryRow) => renderValue(r.费用投入, r.isTotal) },
        { title: '招生成本', width: 90, align: 'center' as const, render: (_: any, r: CoreDataSummaryRow) => renderValue(r.招生成本, r.isTotal, '#ff4d4f') },
      ],
    },
    {
      title: '咨询师',
      onHeaderCell: () => ({ style: { background: '#90EE90' } }),
      children: [
        { title: '咨询总职数', width: 90, align: 'center' as const, render: (_: any, r: CoreDataSummaryRow) => renderValue(r.咨询总职数, r.isTotal) },
        { title: '咨询干部职数', width: 100, align: 'center' as const, render: (_: any, r: CoreDataSummaryRow) => renderValue(r.咨询干部职数, r.isTotal) },
        { title: '咨询员工职数', width: 100, align: 'center' as const, render: (_: any, r: CoreDataSummaryRow) => renderValue(r.咨询员工职数, r.isTotal) },
      ],
    },
    {
      title: '渠道职数',
      onHeaderCell: () => ({ style: { background: '#90EE90' } }),
      children: [
        { title: '渠道总职数', width: 90, align: 'center' as const, render: (_: any, r: CoreDataSummaryRow) => renderValue(r.渠道总职数, r.isTotal) },
        { title: '县办', width: 60, align: 'center' as const, render: (_: any, r: CoreDataSummaryRow) => renderValue(r.县办, r.isTotal) },
        { title: '乡办', width: 60, align: 'center' as const, render: (_: any, r: CoreDataSummaryRow) => renderValue(r.乡办, r.isTotal) },
        { title: '信息员', width: 70, align: 'center' as const, render: (_: any, r: CoreDataSummaryRow) => renderValue(r.信息员, r.isTotal) },
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
            <span>清美教育集团{year}年度核心数据看板汇总</span>
            <Space>
              <span style={{ fontSize: 12, color: '#666', fontWeight: 'normal' }}>
                💡 数据自动从财务、咨询量、职数系统获取
              </span>
              <Button icon={<ReloadOutlined />} size="small" onClick={loadData}>刷新数据</Button>
            </Space>
          </div>
          <Table
            columns={columns}
            dataSource={rows}
            pagination={false}
            bordered
            size="small"
            scroll={{ x: 2400 }}
            rowClassName={r => (r.isTotal ? 'total-row' : '')}
          />
          <style>{`
            .total-row { background-color: #e6f7ff; }
            .total-row td { background-color: #e6f7ff !important; }
          `}</style>
        </div>
      </Spin>
    </NoCopyContainer>
  )
}
