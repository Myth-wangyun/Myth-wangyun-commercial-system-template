/**
 * DynamicSourceDataTab - 动态量来源数据TAB
 * 根据配置中心的量来源配置，动态生成子表
 * 每个量来源下包含多个媒体来源（二级）的数据子表
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { App, Table, Spin, Button, Space, Tabs, Divider } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { useCampusStore } from '@/stores/campusStore'
import { NoCopyContainer } from '@/components/common'
import type { FullMediaConfigTree } from '@/hooks/useMediaSourceConfig'
import * as statsApi from '@/pages/consult/type-count-system/statsApi'

interface SourceDataRow {
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
  总转: string
  当面转化: string
  电转门: string
  // 招生成本
  市场投入: number | null
  招生成本: number | null
}

interface Props {
  year: string
  categoryName: string  // 量来源名称（一级）
  bgColor?: string
  configTree: FullMediaConfigTree
}

// 子表颜色配置
const getSubTabColor = (index: number): string => {
  const colors = ['#fff2e8', '#e6f7ff', '#f6ffed', '#fff7e6', '#f9f0ff', '#e6fffb', '#fffbe6', '#fce4ec']
  return colors[index % colors.length]
}

export default function DynamicSourceDataTab({ year, categoryName, bgColor = '#87CEEB', configTree }: Props) {
  const { message } = App.useApp()
  const campusStore = useCampusStore()
  const currentCampus = campusStore.currentCampus || '未选择'
  const campusList = useMemo(() => campusStore.getAllCampuses(), [campusStore])
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<SourceDataRow[]>([])
  const [dataLoaded, setDataLoaded] = useState(false)

  // 获取当前量来源下的媒体来源列表
  const mediaSources = useMemo(() => {
    const category = configTree.categories.find(c => c.name === categoryName)
    if (!category) return []
    return category.sources.sort((a, b) => a.sort_order - b.sort_order)
  }, [configTree, categoryName])

  const calculateRates = (row: SourceDataRow) => {
    // 总转 = 实际招生 / 咨询总量
    if (row.咨询总量 && row.实际招生) {
      row.总转 = ((row.实际招生 / row.咨询总量) * 100).toFixed(2) + '%'
    } else {
      row.总转 = '-'
    }
    
    // 当面转化 = 实际招生 / 上门总量
    if (row.上门总量 && row.实际招生) {
      row.当面转化 = ((row.实际招生 / row.上门总量) * 100).toFixed(2) + '%'
    } else {
      row.当面转化 = '-'
    }
    
    // 电转门 = 上门总量 / 咨询总量
    if (row.咨询总量 && row.上门总量) {
      row.电转门 = ((row.上门总量 / row.咨询总量) * 100).toFixed(2) + '%'
    } else {
      row.电转门 = '-'
    }
  }

  // 加载主表数据（所有神殿汇总）
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const yearNum = parseInt(year)
      const currentCampusList = campusStore.getAllCampuses()
      
      // 获取咨询量统计数据（使用数据类型筛选量来源）
      const consultResult = await statsApi.getAllCampusYearlySummary({
        年份: yearNum,
        数据类型: categoryName,
      }).catch(() => null)

      // 按神殿生成行
      const makeRow = (序号: number | string, campus: string, isTotal = false): SourceDataRow => ({
        key: String(序号) + '_' + campus,
        序号,
        神殿: isTotal ? '' : campus,
        isTotal,
        计划收入: null,
        实际收入: null,
        计划招生: null,
        实际招生: null,
        退费人数: null,
        上门总量: null,
        咨询总量: null,
        电话量: null,
        总转: '-',
        当面转化: '-',
        电转门: '-',
        市场投入: null,
        招生成本: null,
      })
      
      const next: SourceDataRow[] = currentCampusList.map((c, idx) => makeRow(idx + 1, c.name, false))
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
              calculateRates(row)
            }
          })
        }
      }

      // 计算合计
      const totalRow = next.find(r => r.isTotal)
      if (totalRow) {
        const dataRows = next.filter(r => !r.isTotal)
        const sumFields: (keyof SourceDataRow)[] = [
          '计划收入', '实际收入', '计划招生', '实际招生', '退费人数',
          '上门总量', '咨询总量', '电话量', '市场投入', '招生成本'
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
  }, [year, categoryName])

  useEffect(() => {
    if (!dataLoaded) {
      loadData()
    }
  }, [dataLoaded, loadData])

  // 当年份或分类变化时重新加载
  useEffect(() => {
    setDataLoaded(false)
  }, [year, categoryName])

  const renderValue = (value: number | null, isTotal: boolean, color = '#1890ff') => {
    if (isTotal) {
      return <strong style={{ color }}>{value ?? '-'}</strong>
    }
    return <span>{value ?? '-'}</span>
  }

  const renderRate = (val: string, isTotal: boolean) => {
    if (val === '#DIV/0!' || val === '-') {
      return <span style={{ color: '#999' }}>{val}</span>
    }
    const style = { color: '#52c41a', fontWeight: isTotal ? 'bold' as const : 'normal' as const }
    return <span style={style}>{val}</span>
  }

  // 主表列定义
  const mainColumns = [
    {
      title: '序号',
      dataIndex: '序号',
      width: 60,
      fixed: 'left' as const,
      align: 'center' as const,
      render: (val: number | string, r: SourceDataRow) =>
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
        { title: '计划收入', width: 100, render: (_: any, r: SourceDataRow) => renderValue(r.计划收入, r.isTotal) },
        { title: '实际收入', width: 100, render: (_: any, r: SourceDataRow) => renderValue(r.实际收入, r.isTotal) },
      ],
    },
    {
      title: '招生数据',
      children: [
        { title: '计划招生', width: 90, render: (_: any, r: SourceDataRow) => renderValue(r.计划招生, r.isTotal) },
        { title: '实际招生', width: 90, render: (_: any, r: SourceDataRow) => renderValue(r.实际招生, r.isTotal, '#52c41a') },
        { title: '退费人数', width: 90, render: (_: any, r: SourceDataRow) => renderValue(r.退费人数, r.isTotal, '#ff4d4f') },
        { title: '上门总量', width: 90, render: (_: any, r: SourceDataRow) => renderValue(r.上门总量, r.isTotal) },
        { title: '咨询总量', width: 90, render: (_: any, r: SourceDataRow) => renderValue(r.咨询总量, r.isTotal) },
        { title: '电话量', width: 80, render: (_: any, r: SourceDataRow) => renderValue(r.电话量, r.isTotal) },
      ],
    },
    {
      title: `${categoryName}转化率`,
      children: [
        { title: '总转', width: 80, render: (_: any, r: SourceDataRow) => renderRate(r.总转, r.isTotal) },
        { title: '当面转化', width: 90, render: (_: any, r: SourceDataRow) => renderRate(r.当面转化, r.isTotal) },
        { title: '电转门', width: 80, render: (_: any, r: SourceDataRow) => renderRate(r.电转门, r.isTotal) },
      ],
    },
    {
      title: `${categoryName}招生成本`,
      children: [
        { title: `${categoryName}投入`, width: 100, render: (_: any, r: SourceDataRow) => renderValue(r.市场投入, r.isTotal) },
        { title: '招生成本', width: 100, render: (_: any, r: SourceDataRow) => renderValue(r.招生成本, r.isTotal) },
      ],
    },
  ]

  // 生成子表TAB项（每个媒体来源一个子表）
  const subTabItems = useMemo(() => {
    if (mediaSources.length === 0) return []
    
    return mediaSources.map((source, index) => ({
      key: `sub_${index}`,
      label: source.name,
      children: (
        <MediaSourceSubTable 
          year={year}
          categoryName={categoryName}
          mediaSourceName={source.name}
          details={source.details}
          bgColor={getSubTabColor(index)}
        />
      ),
    }))
  }, [mediaSources, year, categoryName])

  return (
    <NoCopyContainer warningMessage="祈福司门数据禁止复制">
      <Spin spinning={loading}>
        <div style={{ padding: 16 }}>
          {/* 主表标题 */}
          <div style={{ 
            background: bgColor, 
            padding: '8px 16px', 
            fontWeight: 'bold', 
            marginBottom: 8,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>{currentCampus} {year}年度 {categoryName} 数据核心数据看板</span>
            <Space>
              <span style={{ fontSize: 12, color: '#666', fontWeight: 'normal' }}>
                💡 包含所有神殿{categoryName}相关数据汇总
              </span>
              <Button icon={<ReloadOutlined />} size="small" onClick={loadData}>刷新</Button>
            </Space>
          </div>
          
          {/* 主表 */}
          <Table
            columns={mainColumns}
            dataSource={rows}
            pagination={false}
            bordered
            size="small"
            scroll={{ x: 1200 }}
            rowClassName={r => (r.isTotal ? 'total-row' : '')}
          />
          
          {/* 媒体来源子表 */}
          {mediaSources.length > 0 && (
            <>
              <Divider style={{ margin: '16px 0' }} />
              <div style={{ marginBottom: 8, fontWeight: 'bold', color: '#1890ff' }}>
                📊 {categoryName}下各媒体来源详细数据
              </div>
              <Tabs 
                items={subTabItems} 
                type="card" 
                size="small"
              />
            </>
          )}
          
          <style>{`
            .total-row { background-color: #fffbe6; }
            .total-row td { background-color: #fffbe6 !important; }
          `}</style>
        </div>
      </Spin>
    </NoCopyContainer>
  )
}

/**
 * 媒体来源子表组件
 * 显示单个媒体来源（二级）的详细数据
 */
interface MediaSourceSubTableProps {
  year: string
  categoryName: string
  mediaSourceName: string
  details: Array<{ name: string; sort_order: number; is_important?: boolean }>
  bgColor: string
}

function MediaSourceSubTable({ year, categoryName, mediaSourceName, details, bgColor }: MediaSourceSubTableProps) {
  const campusStore = useCampusStore()
  const currentCampus = campusStore.currentCampus || '未选择'
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<SourceDataRow[]>([])
  const [dataLoaded, setDataLoaded] = useState(false)

  const calculateRates = (row: SourceDataRow) => {
    if (row.咨询总量 && row.实际招生) {
      row.总转 = ((row.实际招生 / row.咨询总量) * 100).toFixed(2) + '%'
    } else {
      row.总转 = '-'
    }
    if (row.上门总量 && row.实际招生) {
      row.当面转化 = ((row.实际招生 / row.上门总量) * 100).toFixed(2) + '%'
    } else {
      row.当面转化 = '-'
    }
    if (row.咨询总量 && row.上门总量) {
      row.电转门 = ((row.上门总量 / row.咨询总量) * 100).toFixed(2) + '%'
    } else {
      row.电转门 = '-'
    }
  }

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const yearNum = parseInt(year)
      const currentCampusList = campusStore.getAllCampuses()
      
      // 获取咨询量统计数据（按量来源和媒体来源筛选）
      const consultResult = await statsApi.getAllCampusYearlySummary({
        年份: yearNum,
        数据类型: categoryName,
        媒体来源: mediaSourceName,
      }).catch(() => null)

      // 按神殿生成行
      const makeRow = (序号: number | string, campus: string, isTotal = false): SourceDataRow => ({
        key: String(序号) + '_' + campus + '_sub',
        序号,
        神殿: isTotal ? '' : campus,
        isTotal,
        计划收入: null,
        实际收入: null,
        计划招生: null,
        实际招生: null,
        退费人数: null,
        上门总量: null,
        咨询总量: null,
        电话量: null,
        总转: '-',
        当面转化: '-',
        电转门: '-',
        市场投入: null,
        招生成本: null,
      })
      
      const next: SourceDataRow[] = currentCampusList.map((c, idx) => makeRow(idx + 1, c.name, false))
      next.push(makeRow('合计', '', true))

      // 处理数据
      if (consultResult && consultResult.success && consultResult.data) {
        const { 神殿数据 } = consultResult.data
        if (神殿数据) {
          神殿数据.forEach((item: any) => {
            const row = next.find(r => r.神殿 === item.神殿)
            if (row) {
              row.咨询总量 = item.咨询总量 || null
              row.上门总量 = item.上门量 || null
              row.实际招生 = item.报名量 || null
              calculateRates(row)
            }
          })
        }
      }

      // 计算合计
      const totalRow = next.find(r => r.isTotal)
      if (totalRow) {
        const dataRows = next.filter(r => !r.isTotal)
        const sumFields: (keyof SourceDataRow)[] = [
          '计划收入', '实际收入', '计划招生', '实际招生', '退费人数',
          '上门总量', '咨询总量', '电话量', '市场投入', '招生成本'
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
    } finally {
      setLoading(false)
      setDataLoaded(true)
    }
  }, [year, categoryName, mediaSourceName, campusStore])

  useEffect(() => {
    if (!dataLoaded) {
      loadData()
    }
  }, [dataLoaded, loadData])

  // 当参数变化时重新加载
  useEffect(() => {
    setDataLoaded(false)
  }, [year, categoryName, mediaSourceName])

  const renderValue = (value: number | null, isTotal: boolean, color = '#1890ff') => {
    if (isTotal) {
      return <strong style={{ color }}>{value ?? '-'}</strong>
    }
    return <span>{value ?? '-'}</span>
  }

  const renderRate = (val: string, isTotal: boolean) => {
    if (val === '#DIV/0!' || val === '-') {
      return <span style={{ color: '#999' }}>{val}</span>
    }
    return <span style={{ color: '#52c41a', fontWeight: isTotal ? 'bold' : 'normal' }}>{val}</span>
  }

  const columns = [
    {
      title: '序号',
      dataIndex: '序号',
      width: 60,
      fixed: 'left' as const,
      render: (val: number | string, r: SourceDataRow) =>
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
        { title: '计划收入', width: 100, render: (_: any, r: SourceDataRow) => renderValue(r.计划收入, r.isTotal) },
        { title: '实际收入', width: 100, render: (_: any, r: SourceDataRow) => renderValue(r.实际收入, r.isTotal) },
      ],
    },
    {
      title: '招生数据',
      children: [
        { title: '计划招生', width: 90, render: (_: any, r: SourceDataRow) => renderValue(r.计划招生, r.isTotal) },
        { title: '实际招生', width: 90, render: (_: any, r: SourceDataRow) => renderValue(r.实际招生, r.isTotal, '#52c41a') },
        { title: '退费人数', width: 90, render: (_: any, r: SourceDataRow) => renderValue(r.退费人数, r.isTotal, '#ff4d4f') },
        { title: '上门总量', width: 90, render: (_: any, r: SourceDataRow) => renderValue(r.上门总量, r.isTotal) },
        { title: '咨询总量', width: 90, render: (_: any, r: SourceDataRow) => renderValue(r.咨询总量, r.isTotal) },
        { title: '电话量', width: 80, render: (_: any, r: SourceDataRow) => renderValue(r.电话量, r.isTotal) },
      ],
    },
    {
      title: `${mediaSourceName}转化率`,
      children: [
        { title: '总转', width: 80, render: (_: any, r: SourceDataRow) => renderRate(r.总转, r.isTotal) },
        { title: '当面转化', width: 90, render: (_: any, r: SourceDataRow) => renderRate(r.当面转化, r.isTotal) },
        { title: '电转门', width: 80, render: (_: any, r: SourceDataRow) => renderRate(r.电转门, r.isTotal) },
      ],
    },
    {
      title: `${mediaSourceName}招生成本`,
      children: [
        { title: `${mediaSourceName}投入`, width: 100, render: (_: any, r: SourceDataRow) => renderValue(r.市场投入, r.isTotal) },
        { title: '招生成本', width: 100, render: (_: any, r: SourceDataRow) => renderValue(r.招生成本, r.isTotal) },
      ],
    },
  ]

  return (
    <Spin spinning={loading}>
      <div style={{ padding: '8px 0' }}>
        <div style={{ 
          background: bgColor, 
          padding: '6px 12px', 
          fontWeight: 'bold', 
          marginBottom: 8,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>{currentCampus} {year}年度 {mediaSourceName} 数据</span>
          {details.length > 0 && (
            <span style={{ fontSize: 12, color: '#666', fontWeight: 'normal' }}>
              包含: {details.map(d => d.name).join('、')}
            </span>
          )}
        </div>
        <Table
          columns={columns}
          dataSource={rows}
          pagination={false}
          bordered
          size="small"
          scroll={{ x: 1000 }}
          rowClassName={r => (r.isTotal ? 'total-row' : '')}
        />
      </div>
    </Spin>
  )
}
