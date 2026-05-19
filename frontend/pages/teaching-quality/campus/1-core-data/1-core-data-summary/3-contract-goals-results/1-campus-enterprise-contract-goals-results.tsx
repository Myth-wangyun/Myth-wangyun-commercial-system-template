import React, { useState, useEffect } from 'react'

import { Card, Table, Spin, Space, DatePicker, Flex } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { Dayjs } from 'dayjs'
import { useCampusStore } from '@/stores/campusStore'
import { campusContractGoalsResultsService } from '@/services/teaching-quality/campusContractGoalsResults'

interface MonthRow {
  key: string
  month: number // 1-12，0 表示合计
  campus: string
  targetCount: number
  actualCount: number
  isSummary?: boolean
}

interface CampusEnterpriseContractGoalsResultsProps {
  onRefreshReady?: (refreshFn: () => void) => void
}

const CampusEnterpriseContractGoalsResults: React.FC<CampusEnterpriseContractGoalsResultsProps> = ({ onRefreshReady }) => {
  
  const { currentCampus } = useCampusStore()
  const [rows, setRows] = useState<MonthRow[]>([])
  const [loading, setLoading] = useState(false)
  const [year, setYear] = useState<number>(new Date().getFullYear())

  useEffect(() => {
    loadData(year)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, currentCampus])

  // 将刷新函数暴露给父组件
  useEffect(() => {
    if (onRefreshReady) {
      onRefreshReady(() => loadData(year))
    }
  }, [onRefreshReady, year])

  const loadData = async (y: number) => {
    console.log(`[loadData] starting... year: ${y}, campus: ${currentCampus}`);
    if (!currentCampus) {
      console.log('[loadData] No currentCampus selected, aborting.');
      setRows([])
      return
    }
    try {
      setLoading(true)
      const list = await campusContractGoalsResultsService.getCampusContractGoalsResultsData(
        currentCampus,
        y,
      )
      const mapped: MonthRow[] = list.map((r) => ({
        key: r.key,
        month: r.month,
        campus: r.campus,
        targetCount: r.targetContractCount,
        actualCount: r.actualContractCount,
        isSummary: r.month === 0,
      }))
      setRows(mapped)
    } catch (e) {
      console.error(e)
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  const monthsCount = Math.max(0, rows.length - 1)
  const columns: ColumnsType<MonthRow> = [
    {
      title: '月份',
      dataIndex: 'month',
      key: 'month',
      width: 80,
      align: 'center',
      render: (value: number, record) =>
        record.isSummary ? <span style={{ color: 'red', fontWeight: 'bold' }}>合计</span> : value,
    },
    {
      title: '神殿',
      dataIndex: 'campus',
      key: 'campus',
      width: 120,
      align: 'center',
      render: (text: string, record) => {
        if (record.isSummary) return ''
        if (record.month === 1) {
          return { children: text, props: { rowSpan: monthsCount || 12 } }
        }
        return { children: '', props: { rowSpan: 0 } }
      },
    },
    {
      title: '签约目标数量',
      dataIndex: 'targetCount',
      key: 'targetCount',
      width: 160,
      align: 'center',
      render: (v: number) => v || 0,
    },
    {
      title: '实际签约数量',
      dataIndex: 'actualCount',
      key: 'actualCount',
      width: 160,
      align: 'center',
      render: (v: number) => v || 0,
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={
          <Flex align="center" justify="space-between" wrap>
            <div>03{currentCampus || ''}教化司企业签约目标与结果汇总表</div>
            <Space>
              <span>年份：</span>
              <DatePicker
                picker="year"
                value={dayjs(`${year}-01-01`, 'YYYY-MM-DD') as Dayjs}
                onChange={(d) => setYear((d || dayjs()).year())}
              />
              <a onClick={() => loadData(year)}>刷新</a>
            </Space>
          </Flex>
        }
      >
        <Spin spinning={loading}>
          <Table<MonthRow>
            bordered
            size="small"
            columns={columns}
            dataSource={rows}
            pagination={false}
            rowKey="key"
            scroll={{ x: 'max-content' }}
          />
        </Spin>
      </Card>
    </div>
  )
}

export default CampusEnterpriseContractGoalsResults
