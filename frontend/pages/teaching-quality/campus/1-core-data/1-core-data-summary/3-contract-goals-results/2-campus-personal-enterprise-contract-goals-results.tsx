import React, { useMemo, useState, useEffect } from 'react'
import { useCampusStore } from '@/stores/campusStore'
import { App, Card, Table, Spin, Space, DatePicker, Flex } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import axios from 'axios'
import dayjs, { Dayjs } from 'dayjs'

interface PersonalContractRecord {
  key: string
  serialNumber: number
  name: string
  targetCount: number
  actualCount: number
  isSummary?: boolean
}

interface ShengbangPersonalEnterpriseContractSummaryProps {
  onRefreshReady?: (refreshFn: () => void) => void
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1'

const ShengbangPersonalEnterpriseContractSummary: React.FC<ShengbangPersonalEnterpriseContractSummaryProps> = ({ onRefreshReady }) => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore()
  const [rows, setRows] = useState<PersonalContractRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [year, setYear] = useState<number>(new Date().getFullYear())

  useEffect(() => {
    // currentCampus 初始化时可能会先是旧值/空值，再更新为真实值
    // 这里延迟到下一个 tick 再拉取，避免首次进入页面需要手动点"刷新"
    const t = setTimeout(() => {
      loadData(year)
    }, 0)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, currentCampus])

  // 将刷新函数暴露给父组件
  useEffect(() => {
    if (onRefreshReady) {
      onRefreshReady(() => loadData(year))
    }
  }, [onRefreshReady, year])

  // 汇总整年（12个月）的个人数据
  const loadData = async (y: number) => {
    try {
      if (!currentCampus) {
        setRows([])
        return
      }
      setLoading(true)

      // 并行请求12个月的个人汇总
      const reqs = Array.from({ length: 12 }, (_, idx) =>
        axios.get(`${API_BASE_URL}/teaching-quality/personal-contracts-summary`, {
          params: { campus: currentCampus, year: y, month: idx + 1 },
        }),
      )

      const resps = await Promise.allSettled(reqs)

      // 汇总到人
      const map: Record<string, { 目标签约数: number; 实际签约数: number }> = {}
      resps.forEach((r) => {
        if (r.status === 'fulfilled') {
          const list: any[] = r.value.data || []
          list.forEach((item) => {
            const name = item.班主任姓名 || '—'
            if (!map[name]) map[name] = { 目标签约数: 0, 实际签约数: 0 }
            map[name].目标签约数 += item.目标签约数 || 0
            map[name].实际签约数 += item.实际签约数 || 0
          })
        }
      })

      // 转换为表格行
      const list: PersonalContractRecord[] = Object.keys(map)
        .sort()
        .map((name, idx) => ({
          key: name,
          serialNumber: idx + 1,
          name,
          targetCount: map[name].目标签约数,
          actualCount: map[name].实际签约数,
        }))

      // 合计
      const summary: PersonalContractRecord = {
        key: 'summary',
        serialNumber: 0,
        name: '',
        targetCount: list.reduce((s, r) => s + (r.targetCount || 0), 0),
        actualCount: list.reduce((s, r) => s + (r.actualCount || 0), 0),
        isSummary: true,
      }

      setRows([...list, summary])
    } catch (error) {
      console.error('加载数据失败:', error)
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  const columns: ColumnsType<PersonalContractRecord> = useMemo(
    () => [
      {
        title: '序号',
        dataIndex: 'serialNumber',
        key: 'serialNumber',
        width: 80,
        align: 'center',
        render: (value, record) => (record.isSummary ? <span style={{ color: 'red', fontWeight: 'bold' }}>合计</span> : value),
      },
      {
        title: '姓名',
        dataIndex: 'name',
        key: 'name',
        width: 160,
        align: 'center',
        render: (text: string, record) => (record.isSummary ? '' : text || ''),
      },
      {
        title: '签约目标数量',
        dataIndex: 'targetCount',
        key: 'targetCount',
        width: 160,
        align: 'center',
        render: (value: number) => value || 0,
      },
      {
        title: '实际签约数量',
        dataIndex: 'actualCount',
        key: 'actualCount',
        width: 160,
        align: 'center',
        render: (value: number) => value || 0,
      },
    ],
    [],
  )

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={
          <Flex align="center" justify="space-between" wrap>
            <div>03-1{currentCampus || ''}教化司个人企业签约目标与结果汇总表</div>
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
          <Table<PersonalContractRecord>
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

export default ShengbangPersonalEnterpriseContractSummary
