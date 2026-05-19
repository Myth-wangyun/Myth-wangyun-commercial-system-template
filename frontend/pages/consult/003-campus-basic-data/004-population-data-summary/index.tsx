import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Card, DatePicker, Spin, Table, Space, Tabs } from 'antd'
import { FileTextOutlined, SyncOutlined, UserOutlined } from '@ant-design/icons'
import dayjs, { type Dayjs } from 'dayjs'
import { useCampusStore } from '@/stores/campusStore'
import { normalizeCampusName } from '@/utils/campusSort'
import { NoCopyContainer } from '@/components/common'
import request from '@/services/api'

const { RangePicker } = DatePicker

// ==================== 类型 ====================

interface RowData {
  key: string
  学历: string
  状态: string
  网络其他推广_咨询量: number
  网络其他推广_上门: number
  网络其他推广_报名: number
  网络其他推广_上门率: number | null
  网络其他推广_面转率: number | null
  网络其他推广_总转: number | null
  网络新媒体_咨询量: number
  网络新媒体_上门: number
  网络新媒体_报名: number
  网络新媒体_上门率: number | null
  网络新媒体_面转率: number | null
  网络新媒体_总转: number | null
  合计_咨询量: number
  合计_上门: number
  合计_报名: number
  合计_上门率: number | null
  合计_面转率: number | null
  合计_总转: number | null
  占比_咨询量: number | null
  占比_上门: number | null
  占比_报名: number | null
}

interface ConsultantRowData extends RowData {
  咨询师: string
}

// 学历分组定义
const EDUCATION_GROUPS = [
  '大学生', '本科及以上', '大专',
  '高中、三校合计', '高中', '三校生',
  '初中', '空白',
]

// "合计"行的学历标签
const SUBTOTAL_EDUCATIONS = new Set(EDUCATION_GROUPS)

// ==================== API ====================

async function fetchEducationStatusAnalysis(params: {
  campus: string
  start_date?: string
  end_date?: string
}): Promise<{ success: boolean; data: { rows: RowData[] } }> {
  return request
    .get('/consult/population/population-analysis/education-status', { params })
    .then((res: any) => res.data)
}

async function fetchConsultantAnalysis(params: {
  campus: string
  start_date?: string
  end_date?: string
}): Promise<{ success: boolean; data: { rows: ConsultantRowData[]; 咨询师列表: string[] } }> {
  return request
    .get('/consult/population/population-analysis/consultant-education-status', { params })
    .then((res: any) => res.data)
}

// ==================== 共用工具函数 ====================

const fmtPct = (v: number | null | undefined) => {
  if (v === null || v === undefined) return '-'
  return `${v.toFixed(2)}%`
}

const fmtNum = (v: number | null | undefined) => {
  if (v === null || v === undefined || v === 0) return ''
  return v
}

const makeStatsCols = (prefix: string) => [
  { title: '咨询量', dataIndex: `${prefix}_咨询量`, width: 55, align: 'center' as const, render: fmtNum },
  { title: '上门', dataIndex: `${prefix}_上门`, width: 45, align: 'center' as const, render: fmtNum },
  { title: '报名', dataIndex: `${prefix}_报名`, width: 45, align: 'center' as const, render: fmtNum },
  { title: '上门率', dataIndex: `${prefix}_上门率`, width: 58, align: 'center' as const, render: fmtPct },
  { title: '面转率', dataIndex: `${prefix}_面转率`, width: 58, align: 'center' as const, render: fmtPct },
  { title: '总转', dataIndex: `${prefix}_总转`, width: 55, align: 'center' as const, render: fmtPct },
]

// ==================== TAB1 表格组件 ====================

const Tab1Table: React.FC<{ rows: RowData[]; loading: boolean }> = ({ rows, loading }) => {
  const columns = useMemo(() => {
    return [
      {
        title: '学历',
        dataIndex: '学历',
        width: 80,
        fixed: 'left' as const,
        align: 'center' as const,
        onCell: (_: any, index: number | undefined) => {
          if (index === undefined) return {}
          const row = rows[index]
          if (!row) return {}
          if (row.学历 === '合计' && row.状态 === '') return { rowSpan: 1 }
          if (row.学历 === '空白' && row.状态 === '') return { rowSpan: 1 }
          if (row.状态 === '合计') return { rowSpan: 6 }
          return { rowSpan: 0 }
        },
        render: (text: string, record: RowData) => {
          const isGrandTotal = record.学历 === '合计' && record.状态 === ''
          return (
            <span style={{
              fontWeight: record.状态 === '合计' || isGrandTotal ? 'bold' : 'normal',
              color: isGrandTotal ? '#c00000' : 'inherit',
              fontSize: 11,
            }}>
              {text}
            </span>
          )
        },
      },
      {
        title: '状态',
        dataIndex: '状态',
        width: 50,
        fixed: 'left' as const,
        align: 'center' as const,
        render: (text: string, record: RowData) => {
          const isGrandTotal = record.学历 === '合计' && record.状态 === ''
          const isSub = record.状态 === '合计'
          return (
            <span style={{
              fontWeight: isSub || isGrandTotal ? 'bold' : 'normal',
              color: isGrandTotal ? '#c00000' : isSub ? '#333' : 'inherit',
              fontSize: 11,
            }}>
              {text}
            </span>
          )
        },
      },
      { title: '网络其他推广', children: makeStatsCols('网络其他推广') },
      { title: '网络新媒体', children: makeStatsCols('网络新媒体') },
      { title: '合计', children: makeStatsCols('合计') },
      {
        title: '合计占比',
        children: [
          { title: '咨询量', dataIndex: '占比_咨询量', width: 58, align: 'center' as const, render: fmtPct },
          { title: '上门', dataIndex: '占比_上门', width: 50, align: 'center' as const, render: fmtPct },
          { title: '报名', dataIndex: '占比_报名', width: 50, align: 'center' as const, render: fmtPct },
        ],
      },
    ]
  }, [rows])

  const rowClassName = (record: RowData) => {
    if (record.学历 === '合计' && record.状态 === '') return 'grand-total-row'
    if (record.状态 === '合计') return 'subtotal-row'
    return ''
  }

  return (
    <Spin spinning={loading}>
      <Table<RowData>
        columns={columns as any}
        dataSource={rows}
        pagination={false}
        bordered
        size="small"
        scroll={{ x: 1200 }}
        rowClassName={rowClassName}
        sticky={{ offsetHeader: 0 }}
      />
    </Spin>
  )
}

// ==================== TAB2 表格组件 ====================

/** 每个咨询师的行数：7组学历 × 6行 + 空白1行 + 合计1行 = 44行 */
const ROWS_PER_CONSULTANT = 44

const Tab2Table: React.FC<{ rows: ConsultantRowData[]; consultants: string[]; loading: boolean }> = ({
  rows,
  consultants,
  loading,
}) => {
  const columns = useMemo(() => {
    return [
      {
        title: '咨询师',
        dataIndex: '咨询师',
        width: 70,
        fixed: 'left' as const,
        align: 'center' as const,
        onCell: (_: any, index: number | undefined) => {
          if (index === undefined) return {}
          const posInGroup = index % ROWS_PER_CONSULTANT
          if (posInGroup === 0) return { rowSpan: ROWS_PER_CONSULTANT }
          return { rowSpan: 0 }
        },
        render: (text: string) => (
          <span style={{ fontWeight: 'bold', fontSize: 11 }}>{text}</span>
        ),
      },
      {
        title: '学历',
        dataIndex: '学历',
        width: 80,
        fixed: 'left' as const,
        align: 'center' as const,
        onCell: (_: any, index: number | undefined) => {
          if (index === undefined) return {}
          const row = rows[index]
          if (!row) return {}
          const posInGroup = index % ROWS_PER_CONSULTANT
          // 合计行（最后一行）和空白行（倒数第二行）
          if (posInGroup === ROWS_PER_CONSULTANT - 1) return { rowSpan: 1 }
          if (posInGroup === ROWS_PER_CONSULTANT - 2) return { rowSpan: 1 }
          // 每个学历组第一行（合计子行）合并6行
          if (row.状态 === '合计') return { rowSpan: 6 }
          return { rowSpan: 0 }
        },
        render: (text: string, record: ConsultantRowData) => {
          const isGrandTotal = record.学历 === '合计' && record.状态 === ''
          return (
            <span style={{
              fontWeight: record.状态 === '合计' || isGrandTotal ? 'bold' : 'normal',
              color: isGrandTotal ? '#c00000' : 'inherit',
              fontSize: 11,
            }}>
              {text}
            </span>
          )
        },
      },
      {
        title: '状态',
        dataIndex: '状态',
        width: 50,
        fixed: 'left' as const,
        align: 'center' as const,
        render: (text: string, record: ConsultantRowData) => {
          const isGrandTotal = record.学历 === '合计' && record.状态 === ''
          const isSub = record.状态 === '合计'
          return (
            <span style={{
              fontWeight: isSub || isGrandTotal ? 'bold' : 'normal',
              color: isGrandTotal ? '#c00000' : isSub ? '#333' : 'inherit',
              fontSize: 11,
            }}>
              {text}
            </span>
          )
        },
      },
      { title: '网络其他推广', children: makeStatsCols('网络其他推广') },
      { title: '网络新媒体', children: makeStatsCols('网络新媒体') },
      { title: '合计', children: makeStatsCols('合计') },
      {
        title: '合计占比',
        children: [
          { title: '咨询量', dataIndex: '占比_咨询量', width: 58, align: 'right' as const, render: fmtPct },
          { title: '上门', dataIndex: '占比_上门', width: 50, align: 'right' as const, render: fmtPct },
          { title: '报名', dataIndex: '占比_报名', width: 50, align: 'right' as const, render: fmtPct },
        ],
      },
    ]
  }, [rows])

  const rowClassName = (record: ConsultantRowData) => {
    if (record.学历 === '合计' && record.状态 === '') return 'grand-total-row'
    if (record.状态 === '合计') return 'subtotal-row'
    return ''
  }

  return (
    <Spin spinning={loading}>
      {consultants.length === 0 && !loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>暂无咨询师数据</div>
      ) : (
        <Table<ConsultantRowData>
          columns={columns as any}
          dataSource={rows}
          pagination={false}
          bordered
          size="small"
          scroll={{ x: 1280 }}
          rowClassName={rowClassName}
          sticky={{ offsetHeader: 0 }}
        />
      )}
    </Spin>
  )
}

// ==================== 主组件 ====================

const PopulationDataSummary: React.FC = () => {
  const [activeTab, setActiveTab] = useState('tab1')
  const [loading, setLoading] = useState(false)
  const [tab1Rows, setTab1Rows] = useState<RowData[]>([])
  const [tab2Rows, setTab2Rows] = useState<ConsultantRowData[]>([])
  const [consultants, setConsultants] = useState<string[]>([])

  // 日期范围默认当月
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf('month'),
    dayjs(),
  ])

  // 神殿
  const currentCampus = useCampusStore((s) => s.currentCampus)
  const campusName = useMemo(
    () => (currentCampus ? normalizeCampusName(currentCampus) : ''),
    [currentCampus],
  )

  const params = useMemo(() => ({
    campus: campusName,
    start_date: dateRange[0].format('YYYY-MM-DD'),
    end_date: dateRange[1].format('YYYY-MM-DD'),
  }), [campusName, dateRange])

  // TAB1 加载
  const loadTab1 = useCallback(async () => {
    if (!campusName) return
    setLoading(true)
    try {
      const res = await fetchEducationStatusAnalysis(params)
      if (res?.success) {
        setTab1Rows(
          (res.data.rows || []).map((r: any, i: number) => ({ ...r, key: `t1-${r.学历}-${r.状态}-${i}` })),
        )
      }
    } catch (e) {
      console.error('加载TAB1数据失败', e)
    } finally {
      setLoading(false)
    }
  }, [campusName, params])

  // TAB2 加载
  const loadTab2 = useCallback(async () => {
    if (!campusName) return
    setLoading(true)
    try {
      const res = await fetchConsultantAnalysis(params)
      if (res?.success) {
        setConsultants(res.data.咨询师列表 || [])
        setTab2Rows(
          (res.data.rows || []).map((r: any, i: number) => ({
            ...r,
            key: `t2-${r.咨询师}-${r.学历}-${r.状态}-${i}`,
          })),
        )
      }
    } catch (e) {
      console.error('加载TAB2数据失败', e)
    } finally {
      setLoading(false)
    }
  }, [campusName, params])

  // 切换TAB或参数变化时加载
  useEffect(() => {
    if (activeTab === 'tab1') {
      loadTab1()
    } else {
      loadTab2()
    }
  }, [activeTab, loadTab1, loadTab2])

  // ==================== 渲染 ====================

  return (
    <NoCopyContainer warningMessage="祈福司门数据禁止复制">
      <Card bodyStyle={{ padding: '8px 12px' }}>
        {/* 标题栏 */}
        <div
          style={{
            marginBottom: 8,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 'bold', color: '#c00000' }}>
            <FileTextOutlined style={{ marginRight: 6 }} />
            {dateRange[0].format('YYYY年M月D日')}-{dateRange[1].format('YYYY年M月D日')}{' '}
            {campusName}神殿SEM按人群转化率分析
          </div>

          <Space>
            <RangePicker
              value={dateRange}
              onChange={(dates) => {
                if (dates && dates[0] && dates[1]) {
                  setDateRange([dates[0], dates[1]])
                }
              }}
              size="small"
              allowClear={false}
            />
            <span style={{ fontSize: 11, color: '#888' }}>
              <SyncOutlined spin={loading} style={{ marginRight: 4 }} />
              数据来源: 咨询量录入系统
            </span>
          </Space>
        </div>

        {/* TAB切换 */}
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          size="small"
          items={[
            {
              key: 'tab1',
              label: <span><FileTextOutlined /> 网络各学历、各状态分析</span>,
              children: <Tab1Table rows={tab1Rows} loading={loading} />,
            },
            {
              key: 'tab2',
              label: <span><UserOutlined /> 网络各咨询师、各学历、各状态分析</span>,
              children: <Tab2Table rows={tab2Rows} consultants={consultants} loading={loading} />,
            },
          ]}
        />

        <style>{`
          .ant-table-thead > tr > th {
            background-color: #fce4d6 !important;
            text-align: center !important;
            font-weight: bold !important;
            border: 1px solid #d0d0d0 !important;
            padding: 2px 4px !important;
            font-size: 11px !important;
            line-height: 1.2 !important;
            white-space: nowrap !important;
            vertical-align: middle !important;
          }
          .ant-table-tbody > tr > td {
            border: 1px solid #d0d0d0 !important;
            padding: 1px 4px !important;
            font-size: 11px !important;
            line-height: 1.3 !important;
          }
          .ant-table-tbody > tr.subtotal-row > td {
            background-color: #fff2cc !important;
            font-weight: bold !important;
          }
          .ant-table-tbody > tr.grand-total-row > td {
            background-color: #fce4d6 !important;
            font-weight: bold !important;
            color: #c00000 !important;
          }
        `}</style>
      </Card>
    </NoCopyContainer>
  )
}

export default PopulationDataSummary
