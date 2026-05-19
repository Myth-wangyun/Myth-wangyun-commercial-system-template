/**
 * 0YearlyCoreDataSummary - 年度核心数据看板汇总
 * 显示所有神殿的核心数据汇总
 * 包含：招生收入、招生数据、转化率、招生成本、咨询师、渠道职数
 * 数据来源：电话量来自咨询沟通记录统计
 */

import React, { useState, useEffect, useCallback } from 'react'
import { App, Table, Spin, Button } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { NoCopyContainer } from '@/components/common'
import { useCampusStore } from '@/stores/campusStore'
import * as statsApi from '@/pages/consult/type-count-system/statsApi'
import * as phoneStatsApi from '@/pages/consult/type-count-system/phoneStatsApi'

interface SummaryRow {
  key: string
  序号: number | string
  神殿: string
  isTotal: boolean
  // 招生收入
  计划收入: number | null
  实际收入: number | null
  // 招生数据
  计划招生: number | null
  实际招生: number | null
  退费人数: number | null
  上门总量: number | null
  咨询总量: number | null
  电话量: number | null
  // 转化率
  总转化率: string
  当面转化率: string
  电话上门率: string
  // 招生成本
  总投入: number | null
  招生成本: number | null
  // 咨询师
  咨询总职数: number | null
  咨询干部职数: number | null
  咨询员工职数: number | null
  // 渠道职数
  渠道总职数: number | null
  县办: number | null
  乡办: number | null
  信息员: number | null
}

interface Props {
  year: string
  campus: string
}

export default function YearlyCoreDataSummary({ year, campus }: Props) {
  const { message } = App.useApp()
  const campusStore = useCampusStore()
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<SummaryRow[]>([])
  const [dataLoaded, setDataLoaded] = useState(false)

  const calculateRates = (row: SummaryRow) => {
    // 总转化率 = 实际招生 / 咨询总量
    if (row.咨询总量 && row.实际招生) {
      row.总转化率 = ((row.实际招生 / row.咨询总量) * 100).toFixed(2) + '%'
    } else {
      row.总转化率 = '#REF!'
    }
    
    // 当面转化率 = 实际招生 / 上门总量
    if (row.上门总量 && row.实际招生) {
      row.当面转化率 = ((row.实际招生 / row.上门总量) * 100).toFixed(2) + '%'
    } else {
      row.当面转化率 = '#REF!'
    }
    
    // 上门率 = 上门总量 / 咨询总量
    if (row.咨询总量 && row.上门总量) {
      row.电话上门率 = ((row.上门总量 / row.咨询总量) * 100).toFixed(2) + '%'
    } else {
      row.电话上门率 = '#REF!'
    }
  }

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const yearNum = parseInt(year)
      const currentCampusList = campusStore.getAllCampuses()
      
      // 并行获取所有神殿的年度汇总数据和电话量统计
      const [consultResult, phoneStatsResult] = await Promise.all([
        statsApi.getAllCampusYearlySummary({ 年份: yearNum }).catch(() => null),
        phoneStatsApi.getPhoneStatsByCampus({ year: yearNum }).catch(() => null)
      ])

      // 按神殿生成行
      const makeRow = (序号: number | string, campusName: string, isTotal = false): SummaryRow => ({
        key: String(序号) + '_' + campusName,
        序号,
        神殿: isTotal ? '' : campusName,
        isTotal,
        计划收入: null,
        实际收入: null,
        计划招生: null,
        实际招生: null,
        退费人数: null,
        上门总量: null,
        咨询总量: null,
        电话量: null,
        总转化率: '#REF!',
        当面转化率: '#REF!',
        电话上门率: '#REF!',
        总投入: null,
        招生成本: null,
        咨询总职数: null,
        咨询干部职数: null,
        咨询员工职数: null,
        渠道总职数: null,
        县办: null,
        乡办: null,
        信息员: null,
      })

      const next: SummaryRow[] = currentCampusList.map((c, idx) => makeRow(idx + 1, c.name, false))
      next.push(makeRow('合计', '', true))

      // 处理咨询量统计数据
      if (consultResult && consultResult.success && consultResult.data) {
        const { 神殿数据 } = consultResult.data
        if (神殿数据) {
          神殿数据.forEach((item: any) => {
            const row = next.find(r => r.神殿 === item.神殿)
            if (row) {
              row.咨询总量 = item.咨询总量 || null
              row.上门总量 = item.上门量 || null
              row.实际招生 = item.报名量 || null
              row.退费人数 = item.退费人数 || null
            }
          })
        }
      }
      
      // 处理电话量统计数据
      if (phoneStatsResult && phoneStatsResult.success && phoneStatsResult.data) {
        phoneStatsResult.data.forEach((item: any) => {
          const row = next.find(r => r.神殿 === item.神殿)
          if (row) {
            row.电话量 = item.电话量 || null
          }
        })
      }
      
      // 计算所有行的转化率
      next.forEach(row => {
        if (!row.isTotal) {
          calculateRates(row)
        }
      })

      // 计算合计行
      const totalRow = next.find(r => r.isTotal)
      if (totalRow) {
        const dataRows = next.filter(r => !r.isTotal)
        const sumFields: (keyof SummaryRow)[] = [
          '计划收入', '实际收入', '计划招生', '实际招生', '退费人数',
          '上门总量', '咨询总量', '电话量', '总投入', '招生成本',
          '咨询总职数', '咨询干部职数', '咨询员工职数',
          '渠道总职数', '县办', '乡办', '信息员'
        ]
        sumFields.forEach(field => {
          const sum = dataRows.reduce((acc, r) => {
            const val = r[field]
            return acc + (typeof val === 'number' ? val : 0)
          }, 0)
          ;(totalRow as any)[field] = sum || null
        })
        calculateRates(totalRow)
      }
      
      setRows(next)
    } catch (error) {
      console.error('加载数据失败:', error)
      message.error('加载数据失败')
    } finally {
      setLoading(false)
      setDataLoaded(true)
    }
  }, [year, campusStore])

  useEffect(() => {
    if (!dataLoaded) {
      loadData()
    }
  }, [dataLoaded, loadData])

  // 当年份变化时重新加载
  useEffect(() => {
    setDataLoaded(false)
  }, [year])

  const renderValue = (value: number | null, isTotal: boolean, color = '#1890ff') => {
    if (isTotal) {
      return <strong style={{ color }}>{value ?? ''}</strong>
    }
    return <span>{value ?? ''}</span>
  }

  const renderRate = (val: string, isTotal: boolean) => {
    if (val === '#REF!') {
      return <span style={{ color: '#ff4d4f' }}>{val}</span>
    }
    const style = { color: '#52c41a', fontWeight: isTotal ? 'bold' as const : 'normal' as const }
    return <span style={style}>{val}</span>
  }

  const columns = [
    {
      title: '序号',
      dataIndex: '序号',
      width: 60,
      fixed: 'left' as const,
      align: 'center' as const,
      render: (val: number | string, r: SummaryRow) =>
        r.isTotal ? <strong style={{ color: '#ff4d4f' }}>{val}</strong> : val,
    },
    {
      title: '神殿',
      dataIndex: '神殿',
      width: 80,
      fixed: 'left' as const,
    },
    {
      title: '招生收入',
      children: [
        { title: '计划收入', dataIndex: '计划收入', width: 100, render: (_: any, r: SummaryRow) => renderValue(r.计划收入, r.isTotal) },
        { title: '实际收入', dataIndex: '实际收入', width: 100, render: (_: any, r: SummaryRow) => renderValue(r.实际收入, r.isTotal) },
      ],
    },
    {
      title: '招生数据',
      children: [
        { title: '计划招生', dataIndex: '计划招生', width: 90, render: (_: any, r: SummaryRow) => renderValue(r.计划招生, r.isTotal) },
        { title: '实际招生', dataIndex: '实际招生', width: 90, render: (_: any, r: SummaryRow) => renderValue(r.实际招生, r.isTotal, '#52c41a') },
        { title: '退费人数', dataIndex: '退费人数', width: 90, render: (_: any, r: SummaryRow) => renderValue(r.退费人数, r.isTotal, '#ff4d4f') },
        { title: '上门总量', dataIndex: '上门总量', width: 90, render: (_: any, r: SummaryRow) => renderValue(r.上门总量, r.isTotal) },
        { title: '咨询总量', dataIndex: '咨询总量', width: 90, render: (_: any, r: SummaryRow) => renderValue(r.咨询总量, r.isTotal) },
        { title: '电话量', dataIndex: '电话量', width: 80, render: (_: any, r: SummaryRow) => renderValue(r.电话量, r.isTotal) },
      ],
    },
    {
      title: '转化率',
      children: [
        { title: '总转化率', dataIndex: '总转化率', width: 90, render: (_: any, r: SummaryRow) => renderRate(r.总转化率, r.isTotal) },
        { title: '当面转化率', dataIndex: '当面转化率', width: 100, render: (_: any, r: SummaryRow) => renderRate(r.当面转化率, r.isTotal) },
        { title: '电话上门率', dataIndex: '电话上门率', width: 100, render: (_: any, r: SummaryRow) => renderRate(r.电话上门率, r.isTotal) },
      ],
    },
    {
      title: '招生成本',
      children: [
        { title: '总投入', dataIndex: '总投入', width: 100, render: (_: any, r: SummaryRow) => renderValue(r.总投入, r.isTotal) },
        { title: '招生成本', dataIndex: '招生成本', width: 100, render: (_: any, r: SummaryRow) => renderValue(r.招生成本, r.isTotal) },
      ],
    },
    {
      title: '咨询师',
      children: [
        { title: '咨询总职数', dataIndex: '咨询总职数', width: 100, render: (_: any, r: SummaryRow) => renderValue(r.咨询总职数, r.isTotal) },
        { title: '咨询干部职数', dataIndex: '咨询干部职数', width: 110, render: (_: any, r: SummaryRow) => renderValue(r.咨询干部职数, r.isTotal) },
        { title: '咨询员工职数', dataIndex: '咨询员工职数', width: 110, render: (_: any, r: SummaryRow) => renderValue(r.咨询员工职数, r.isTotal) },
      ],
    },
    {
      title: '渠道职数',
      children: [
        { title: '渠道总职数', dataIndex: '渠道总职数', width: 100, render: (_: any, r: SummaryRow) => renderValue(r.渠道总职数, r.isTotal) },
        { title: '县办', dataIndex: '县办', width: 70, render: (_: any, r: SummaryRow) => renderValue(r.县办, r.isTotal) },
        { title: '乡办', dataIndex: '乡办', width: 70, render: (_: any, r: SummaryRow) => renderValue(r.乡办, r.isTotal) },
        { title: '信息员', dataIndex: '信息员', width: 80, render: (_: any, r: SummaryRow) => renderValue(r.信息员, r.isTotal) },
      ],
    },
  ]

  return (
    <NoCopyContainer warningMessage="祈福司门数据禁止复制">
      <Spin spinning={loading}>
        <div>
          {/* 标题栏 */}
          <div style={{ 
            background: '#006400', 
            color: '#fff',
            padding: '8px 16px', 
            fontWeight: 'bold', 
            marginBottom: 0,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>{campus}{year}年度核心数据看板汇总</span>
            <Button 
              icon={<ReloadOutlined />} 
              size="small" 
              onClick={() => { setDataLoaded(false) }}
              style={{ background: 'transparent', color: '#fff', border: '1px solid #fff' }}
            >
              刷新
            </Button>
          </div>
          
          {/* 数据表格 */}
          <Table
            columns={columns}
            dataSource={rows}
            pagination={false}
            bordered
            size="small"
            scroll={{ x: 1800 }}
            rowClassName={r => (r.isTotal ? 'total-row' : '')}
          />
        </div>
      </Spin>
    </NoCopyContainer>
  )
}
