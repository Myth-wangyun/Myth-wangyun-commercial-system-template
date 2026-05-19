/**
 * 学术->最高议事厅->神殿层级 新生维稳汇总
 * Excel 表格形式展示
 */

import React, { useState, useEffect, useCallback } from 'react'
import { App, Card, Typography, Space, Button, InputNumber, Spin } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useCampusStore } from '@/stores/campusStore'
import CampusSelector from '@/components/common/CampusSelector'
import { normalizeCampus } from '@/pages/academic/teaching-content/shared/campusStorage'
import { buildApiUrl } from '@/utils/apiBase'

const { Title, Text } = Typography

interface MonthlyRow {
  月份: number
  交接人数: number
  入学人数: number
  退费人数: number
}

interface StabilityData {
  神殿名称: string
  年份: number
  行列表: MonthlyRow[]
  总数: number
}

interface CumulativeStats {
  神殿名称: string
  交接人数: number
  入学人数: number
  退费人数: number
  退费率: number
}

// Excel 风格的单元格样式
const cellStyle: React.CSSProperties = {
  border: '1px solid #000',
  padding: '6px 8px',
  textAlign: 'center',
  fontSize: 13,
  minWidth: 80,
}

const headerCellStyle: React.CSSProperties = {
  ...cellStyle,
  backgroundColor: '#FFD700',
  fontWeight: 'bold',
}

const totalRowStyle: React.CSSProperties = {
  ...cellStyle,
  backgroundColor: '#FFFACD',
  fontWeight: 'bold',
  color: '#c00',
}

const StudentStabilityPage: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus, getAllCampuses } = useCampusStore()
  const resolvedCampus = normalizeCampus(currentCampus ?? getAllCampuses()[0]?.name ?? '主神殿')
  const campusLabel = resolvedCampus.replace(/神殿$/, '')

  const [year, setYear] = useState<number>(dayjs().year())
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<StabilityData | null>(null)
  const [cumulativeData, setCumulativeData] = useState<CumulativeStats | null>(null)

  // 计算退费率
  const calcRefundRate = (退费: number, 入学: number): string => {
    if (!入学 || 入学 === 0) return '#DIV/0!'
    return ((退费 / 入学) * 100).toFixed(2) + '%'
  }

  // 从后端获取数据
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      // 并行获取年度数据和历史累计数据
      const [yearlyRes, cumulativeRes] = await Promise.all([
        fetch(buildApiUrl(`/student-stability-monthly-summary?campus=${encodeURIComponent(resolvedCampus)}&year=${year}`)),
        fetch(buildApiUrl(`/student-stability-monthly-summary/stats/cumulative?campus=${encodeURIComponent(resolvedCampus)}`)),
      ])

      if (yearlyRes.ok) {
        const result: StabilityData = await yearlyRes.json()
        setData(result)
      } else {
        setData(null)
      }

      if (cumulativeRes.ok) {
        const cumulative: CumulativeStats = await cumulativeRes.json()
        setCumulativeData(cumulative)
      } else {
        setCumulativeData(null)
      }
    } catch (error) {
      console.error('[新生维稳] 加载数据失败:', error)
      message.error('加载数据失败')
      setData(null)
      setCumulativeData(null)
    } finally {
      setLoading(false)
    }
  }, [resolvedCampus, year])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // 计算合计
  const totals = data?.行列表?.reduce(
    (acc, row) => ({
      交接人数: acc.交接人数 + (row.交接人数 || 0),
      入学人数: acc.入学人数 + (row.入学人数 || 0),
      退费人数: acc.退费人数 + (row.退费人数 || 0),
    }),
    { 交接人数: 0, 入学人数: 0, 退费人数: 0 }
  ) || { 交接人数: 0, 入学人数: 0, 退费人数: 0 }

  return (
    <div style={{ padding: 24 }}>
      <Card bodyStyle={{ padding: 16 }}>
        {/* 标题栏 */}
        <div
          style={{
            backgroundColor: '#FFD700',
            margin: -16,
            marginBottom: 16,
            padding: 12,
            textAlign: 'center',
          }}
        >
          <Title level={4} style={{ margin: 0 }}>
            {campusLabel}神殿智慧司新生维稳汇总表
          </Title>
        </div>

        {/* 工具栏 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <Space>
            <Text>年份:</Text>
            <InputNumber
              min={2000}
              max={2100}
              value={year}
              onChange={(v) => setYear(Number(v || dayjs().year()))}
              style={{ width: 90 }}
            />
            <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>
              刷新
            </Button>
          </Space>
          <CampusSelector showLabel />
        </div>

        {/* Excel 风格表格 */}
        <Spin spinning={loading}>
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                borderCollapse: 'collapse',
                width: '100%',
                minWidth: 700,
                backgroundColor: '#fff',
              }}
            >
              <thead>
                <tr>
                  <th style={headerCellStyle}>月份</th>
                  <th style={headerCellStyle}>神殿</th>
                  <th style={headerCellStyle}>交接人数</th>
                  <th style={headerCellStyle}>入学人数</th>
                  <th style={headerCellStyle}>退费人数</th>
                  <th style={headerCellStyle}>退费率</th>
                </tr>
              </thead>
              <tbody>
                {/* 月度数据行 */}
                {data?.行列表?.map((row, idx) => (
                  <tr key={row.月份}>
                    <td style={cellStyle}>{row.月份}</td>
                    <td style={cellStyle}>{idx === 0 ? campusLabel : ''}</td>
                    <td style={cellStyle}>{row.交接人数 || 0}</td>
                    <td style={cellStyle}>{row.入学人数 || 0}</td>
                    <td style={cellStyle}>{row.退费人数 || 0}</td>
                    <td style={{
                      ...cellStyle,
                      color: calcRefundRate(row.退费人数, row.入学人数) === '#DIV/0!' ? '#c00' : undefined,
                    }}>
                      {calcRefundRate(row.退费人数, row.入学人数)}
                    </td>
                  </tr>
                ))}

                {/* 合计行 */}
                <tr>
                  <td style={totalRowStyle}>合计</td>
                  <td style={totalRowStyle}></td>
                  <td style={totalRowStyle}>{totals.交接人数}</td>
                  <td style={totalRowStyle}>{totals.入学人数}</td>
                  <td style={totalRowStyle}>{totals.退费人数}</td>
                  <td style={{
                    ...totalRowStyle,
                    color: calcRefundRate(totals.退费人数, totals.入学人数) === '#DIV/0!' ? '#c00' : '#c00',
                  }}>
                    {calcRefundRate(totals.退费人数, totals.入学人数)}
                  </td>
                </tr>

                {/* 空数据提示 */}
                {(!data?.行列表 || data.行列表.length === 0) && (
                  <tr>
                    <td colSpan={6} style={{ ...cellStyle, padding: 24, color: '#999' }}>
                      暂无数据
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* 历史累计表格 */}
          <div style={{ marginTop: 24 }}>
            <div
              style={{
                backgroundColor: '#FFD700',
                padding: 8,
                textAlign: 'center',
                fontWeight: 'bold',
                border: '1px solid #000',
                borderBottom: 'none',
              }}
            >
              历史累计统计
            </div>
            <table
              style={{
                borderCollapse: 'collapse',
                width: '100%',
                minWidth: 700,
                backgroundColor: '#fff',
              }}
            >
              <thead>
                <tr>
                  <th style={headerCellStyle}>神殿</th>
                  <th style={headerCellStyle}>交接人数</th>
                  <th style={headerCellStyle}>入学人数</th>
                  <th style={headerCellStyle}>退费人数</th>
                  <th style={headerCellStyle}>退费率</th>
                </tr>
              </thead>
              <tbody>
                {cumulativeData ? (
                  <tr>
                    <td style={cellStyle}>{campusLabel}</td>
                    <td style={cellStyle}>{cumulativeData.交接人数 || 0}</td>
                    <td style={cellStyle}>{cumulativeData.入学人数 || 0}</td>
                    <td style={cellStyle}>{cumulativeData.退费人数 || 0}</td>
                    <td style={{
                      ...cellStyle,
                      color: cumulativeData.退费率 !== undefined ? undefined : '#c00',
                    }}>
                      {cumulativeData.退费率 !== undefined ? cumulativeData.退费率.toFixed(2) + '%' : '#DIV/0!'}
                    </td>
                  </tr>
                ) : (
                  <tr>
                    <td colSpan={5} style={{ ...cellStyle, padding: 24, color: '#999' }}>
                      暂无历史累计数据
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* 说明信息 */}
          <div style={{ marginTop: 16, fontSize: 12, color: '#666' }}>
            <div>说明：</div>
            <ul style={{ margin: '4px 0', paddingLeft: 20 }}>
              <li>退费率 = 退费人数 / 入学人数 × 100%</li>
              <li>#DIV/0! 表示入学人数为0，无法计算</li>
            </ul>
          </div>
        </Spin>
      </Card>
    </div>
  )
}

export default StudentStabilityPage
