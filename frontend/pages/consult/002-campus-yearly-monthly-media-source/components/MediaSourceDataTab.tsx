/**
 * MediaSourceDataTab - 通用媒体来源数据组件
 * 用于 Tab4-Tab8 (市场口碑、合作伙伴、渠道、口碑、神殿新媒体)
 * 数据来源: 007财务录入 + 咨询量录入系统
 */

import React, { useState, useEffect, useCallback } from 'react'
import { App, Table, Spin, Button, Space } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { useCampusStore } from '@/stores/campusStore'
import { NoCopyContainer } from '@/components/common'
import * as financialApi from '@/pages/consult/004mgmt-data/007-financial-income/api'
import * as statsApi from '@/pages/consult/type-count-system/statsApi'

interface MediaDataRow {
  key: string
  序号: number | string
  月份: number | string
  isTotal: boolean
  // 财务数据 - 来自007
  计划收入: number | null
  实际收入: number | null
  计划招生: number | null
  实际招生: number | null
  退费人数: number | null
  // 咨询数据 - 来自咨询量系统
  咨询总量: number | null
  上门总量: number | null
  报名量: number | null
  // 计算字段
  总转化率: string
  当面转化率: string
}

interface Props {
  year: string
  dataType: string
  bgColor?: string
}

export default function MediaSourceDataTab({ year, dataType, bgColor = '#87CEEB' }: Props) {
  const { message } = App.useApp()
  const campusStore = useCampusStore()
  const currentCampus = campusStore.currentCampus || '未选择'
  const [loading, setLoading] = useState(false)

  const months = Array.from({ length: 12 }, (_, i) => i + 1)

  const makeEmptyRow = (idx: number | string, isTotal = false): MediaDataRow => ({
    key: String(idx),
    序号: isTotal ? '合计' : idx,
    月份: isTotal ? '' : idx,
    isTotal,
    计划收入: null,
    实际收入: null,
    计划招生: null,
    实际招生: null,
    退费人数: null,
    咨询总量: null,
    上门总量: null,
    报名量: null,
    总转化率: '-',
    当面转化率: '-',
  })

  const [rows, setRows] = useState<MediaDataRow[]>([])

  const calculateRates = (row: MediaDataRow) => {
    if (row.上门总量 && row.报名量) {
      row.总转化率 = ((row.报名量 / row.上门总量) * 100).toFixed(2) + '%'
    } else {
      row.总转化率 = '-'
    }
    if (row.咨询总量 && row.报名量) {
      row.当面转化率 = ((row.报名量 / row.咨询总量) * 100).toFixed(2) + '%'
    } else {
      row.当面转化率 = '-'
    }
  }

  const loadData = useCallback(async () => {
    if (!currentCampus || currentCampus === '未选择') return
    
    setLoading(true)
    try {
      const yearNum = parseInt(year)
      
      const [financialResult, consultStatsResult] = await Promise.all([
        financialApi.getCampusMonthlyData({ 
          year: yearNum, 
          campus: currentCampus, 
          data_type: dataType 
        }).catch(() => null),
        statsApi.getMonthlyCampusSummary({ 
          年份: yearNum, 
          神殿: currentCampus, 
          数据类型: dataType 
        }).catch(() => null)
      ])

      const next: MediaDataRow[] = months.map(m => makeEmptyRow(m, false))
      next.push(makeEmptyRow('total', true))
      
      // 处理财务数据
      if (financialResult && financialResult.月度数据) {
        financialResult.月度数据.forEach((item: any) => {
          const row = next.find(r => r.月份 === item.月份)
          if (row) {
            row.计划收入 = item.计划收入 || null
            row.实际收入 = item.实际收入 || null
            row.计划招生 = item.计划招生 || null
            row.实际招生 = item.实际招生 || null
            row.退费人数 = item.退费人数 || null
          }
        })
      }
      
      // 处理咨询量统计数据
      if (consultStatsResult && consultStatsResult.success && consultStatsResult.data) {
        const { 月度数据 } = consultStatsResult.data
        月度数据.forEach((item: any) => {
          const row = next.find(r => r.月份 === item.月份)
          if (row) {
            row.咨询总量 = item.咨询总量 || null
            row.上门总量 = item.上门量 || null
            row.报名量 = item.报名量 || null
            calculateRates(row)
          }
        })
      }

      // 计算合计
      const totalRow = next.find(r => r.isTotal)
      if (totalRow) {
        const dataRows = next.filter(r => !r.isTotal)
        const sumFields: (keyof MediaDataRow)[] = [
          '计划收入', '实际收入', '计划招生', '实际招生', '退费人数',
          '咨询总量', '上门总量', '报名量'
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
    }
  }, [year, currentCampus, dataType])

  useEffect(() => {
    loadData()
  }, [loadData])

  const renderValue = (value: number | null | string, isTotal: boolean, color = '#1890ff') => {
    if (isTotal) {
      return <strong style={{ color }}>{value ?? '-'}</strong>
    }
    return <span style={{ color: '#666' }}>{value ?? '-'}</span>
  }

  const columns = [
    { title: '序号', dataIndex: '序号', width: 60, fixed: 'left' as const },
    { title: '月份', dataIndex: '月份', width: 60 },
    {
      title: '财务数据(来自007)',
      children: [
        { title: '计划收入', width: 100, render: (_: any, r: MediaDataRow) => renderValue(r.计划收入, r.isTotal) },
        { title: '实际收入', width: 100, render: (_: any, r: MediaDataRow) => renderValue(r.实际收入, r.isTotal) },
        { title: '计划招生', width: 90, render: (_: any, r: MediaDataRow) => renderValue(r.计划招生, r.isTotal) },
        { title: '实际招生', width: 90, render: (_: any, r: MediaDataRow) => renderValue(r.实际招生, r.isTotal) },
        { title: '退费人数', width: 90, render: (_: any, r: MediaDataRow) => renderValue(r.退费人数, r.isTotal) },
      ],
    },
    {
      title: '咨询数据(来自录量系统)',
      children: [
        { title: '咨询总量', width: 90, render: (_: any, r: MediaDataRow) => renderValue(r.咨询总量, r.isTotal, '#52c41a') },
        { title: '上门总量', width: 90, render: (_: any, r: MediaDataRow) => renderValue(r.上门总量, r.isTotal, '#52c41a') },
        { title: '报名量', width: 80, render: (_: any, r: MediaDataRow) => renderValue(r.报名量, r.isTotal, '#52c41a') },
      ],
    },
    {
      title: '转化率',
      children: [
        { title: '总转化率', width: 90, dataIndex: '总转化率', render: (val: string) => <span style={{ color: '#fa8c16', fontWeight: 'bold' }}>{val}</span> },
        { title: '当面转化率', width: 100, dataIndex: '当面转化率', render: (val: string) => <span style={{ color: '#fa8c16', fontWeight: 'bold' }}>{val}</span> },
      ],
    },
  ]

  return (
    <NoCopyContainer warningMessage="祈福司门数据禁止复制">
      <Spin spinning={loading}>
        <div style={{ padding: 16 }}>
          <div style={{ 
            background: bgColor, 
            padding: '8px 16px', 
            fontWeight: 'bold', 
            marginBottom: 8,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>{currentCampus} {year}年度 【{dataType}】 数据汇总</span>
            <Space>
              <span style={{ fontSize: 12, color: '#666', fontWeight: 'normal' }}>
                💡 数据自动从007财务和咨询量系统获取
              </span>
              <Button icon={<ReloadOutlined />} size="small" onClick={loadData}>刷新</Button>
            </Space>
          </div>
          <Table
            columns={columns}
            dataSource={rows}
            pagination={false}
            bordered
            size="small"
            scroll={{ x: 1200 }}
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
