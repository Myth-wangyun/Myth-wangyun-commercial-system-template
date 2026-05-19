/**
 * 016祈福司培训汇总表
 * 祈福司的培训计划与成绩统计
 * TAB1 - 01培训汇总表（从周度表汇总，按岗位统计）
 * TAB2 - 02培训月度表（从周度表汇总，按岗位和月份统计）
 * TAB3 - 03培训周度表（原始数据录入）
 */
import React, { useState, useEffect } from 'react'
import {
  Card,
  Table,
  DatePicker,
  Input,
  Tabs,
  Spin,
  Alert,
  Button,
  Select,
} from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import Tab2MonthlyTraining from './Tab2MonthlyTraining'
import Tab3WeeklyTraining from './Tab3WeeklyTraining'
import { getTrainingWeeklyListByYear, type TrainingWeeklyRecord } from '@/api/consult/training-weekly'
import { NoCopyContainer } from '@/components/common'
import { useCampusStore } from '@/stores/campusStore'

const { Option } = Select

// ==================== 类型定义 ====================

// Tab1 汇总行类型
interface SummaryRow {
  key: string
  index: number | string
  position: string
  totalSessions: number
  totalPeople: number
  totalQualified: number
  passRate: string
  remarks: string
}

// 岗位列表
const POSITIONS = ['校长', '咨询经理', '咨询师', '运营']

// ==================== Tab1 培训汇总表组件 ====================

interface Tab1TrainingSummaryProps {
  year: string
}

const Tab1TrainingSummary: React.FC<Tab1TrainingSummaryProps> = ({ year }) => {
  const [loading, setLoading] = useState(false)
  const [dataSource, setDataSource] = useState<SummaryRow[]>([])
  const { currentCampus } = useCampusStore()

  // 计算合格率
  const calculatePassRate = (people: number, qualified: number): string => {
    if (people > 0) {
      return ((qualified / people) * 100).toFixed(2) + '%'
    }
    return ''
  }

  // 从周度表汇总数据
  const aggregateData = (records: TrainingWeeklyRecord[]): SummaryRow[] => {
    // 按岗位汇总
    const positionMap: Record<string, { sessions: number; people: number; qualified: number }> = {}
    
    POSITIONS.forEach(pos => {
      positionMap[pos] = { sessions: 0, people: 0, qualified: 0 }
    })

    records.forEach(record => {
      const position = record.岗位
      if (position && positionMap[position]) {
        positionMap[position].sessions += 1
        positionMap[position].people += Number(record.培训人次) || 0
        positionMap[position].qualified += Number(record.合格人数) || 0
      }
    })

    // 计算合计
    let totalSessions = 0
    let totalPeople = 0
    let totalQualified = 0

    const rows: SummaryRow[] = POSITIONS.map((pos, index) => {
      const data = positionMap[pos]
      totalSessions += data.sessions
      totalPeople += data.people
      totalQualified += data.qualified

      return {
        key: pos,
        index: index + 1,
        position: pos,
        totalSessions: data.sessions,
        totalPeople: data.people,
        totalQualified: data.qualified,
        passRate: calculatePassRate(data.people, data.qualified),
        remarks: '',
      }
    })

    // 添加合计行
    rows.unshift({
      key: 'total',
      index: '合计',
      position: '',
      totalSessions,
      totalPeople,
      totalQualified,
      passRate: calculatePassRate(totalPeople, totalQualified),
      remarks: '',
    })

    return rows
  }

  // 加载数据
  const loadData = async () => {
    setLoading(true)
    try {
      // 如果是历史合计，获取所有年份的数据
      if (year === 'all') {
        // 获取最近10年的数据
        const currentYear = dayjs().year()
        const allRecords: TrainingWeeklyRecord[] = []
        
        for (let y = currentYear - 9; y <= currentYear; y++) {
          try {
            const response = await getTrainingWeeklyListByYear({
              year: y,
              page: 1,
              page_size: 200,
            })
            const data = (response as any).data || response
            if (data.items) {
              allRecords.push(...data.items)
            }
          } catch (e) {
            // 某年没有数据，忽略
          }
        }
        
        setDataSource(aggregateData(allRecords))
      } else {
        const response = await getTrainingWeeklyListByYear({
          year: parseInt(year),
          page: 1,
          page_size: 200,
        })
        
        const data = (response as any).data || response
        if (data.items) {
          setDataSource(aggregateData(data.items))
        } else {
          setDataSource(aggregateData([]))
        }
      }
    } catch (error) {
      console.error('加载数据失败:', error)
      setDataSource(aggregateData([]))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [year, currentCampus])

  // 表格列定义
  const columns: ColumnsType<SummaryRow> = [
    {
      title: '序号',
      dataIndex: 'index',
      key: 'index',
      width: 80,
      align: 'center',
      render: (val) => <span style={{ fontWeight: val === '合计' ? 600 : 400 }}>{val}</span>,
    },
    {
      title: '岗位',
      dataIndex: 'position',
      key: 'position',
      width: 120,
      align: 'center',
    },
    {
      title: '累计培训次数',
      dataIndex: 'totalSessions',
      key: 'totalSessions',
      width: 120,
      align: 'center',
      render: (val) => val || 0,
    },
    {
      title: '累计培训人数',
      dataIndex: 'totalPeople',
      key: 'totalPeople',
      width: 120,
      align: 'center',
      render: (val) => val || 0,
    },
    {
      title: '累计合格人数',
      dataIndex: 'totalQualified',
      key: 'totalQualified',
      width: 120,
      align: 'center',
      render: (val) => val || 0,
    },
    {
      title: '考试合格率',
      dataIndex: 'passRate',
      key: 'passRate',
      width: 120,
      align: 'center',
      render: (val) => <span style={{ color: '#1890ff', fontWeight: 500 }}>{val}</span>,
    },
    {
      title: '备注',
      dataIndex: 'remarks',
      key: 'remarks',
      width: 200,
      render: (val: string, record: SummaryRow) => (
        record.index === '合计' ? null : <Input size="small" value={val} placeholder="备注" />
      ),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Alert
          message="数据说明"
          description={year === 'all' 
            ? "当前显示【历史合计】数据，汇总自所有年份的周度表记录" 
            : `当前显示【${year}年】数据，汇总自周度表记录`}
          type="info"
          showIcon
          style={{ flex: 1, marginRight: 16 }}
        />
        <Button
          type="primary"
          icon={<ReloadOutlined />}
          onClick={loadData}
          loading={loading}
        >
          刷新数据
        </Button>
      </div>

      {/* 表格标题栏 */}
      <div
        style={{
          background: 'linear-gradient(135deg, #d4740c 0%, #e8a849 100%)',
          color: '#fff',
          padding: '8px 16px',
          fontWeight: 600,
          fontSize: 14,
          borderRadius: '4px 4px 0 0',
        }}
      >
        01最高议事厅 祈福司-培训汇总表 {year === 'all' ? '（历史合计）' : `（${year}年）`}
      </div>

      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={dataSource}
          pagination={false}
          bordered
          size="small"
          rowClassName={(record) => record.index === '合计' ? 'summary-row' : ''}
        />
      </Spin>

      <style>{`
        .summary-row {
          background-color: #fafafa;
          font-weight: 500;
        }
      `}</style>
    </div>
  )
}

// ==================== 主组件 ====================

const ConsultingTrainingSummaryPage: React.FC = () => {
  const currentYear = dayjs().format('YYYY')
  const [year, setYear] = useState(currentYear)

  // 生成年份选项（当前年份往前10年 + 历史合计选项）
  const yearOptions = () => {
    const options = []
    const current = dayjs().year()
    
    // 添加历史合计选项
    options.push(
      <Option key="all" value="all">
        历史合计
      </Option>
    )
    
    // 添加年份选项
    for (let y = current; y >= current - 9; y--) {
      options.push(
        <Option key={y} value={String(y)}>
          {y}年
        </Option>
      )
    }
    
    return options
  }

  const handleYearChange = (value: string) => {
    setYear(value)
  }

  const tabItems = [
    {
      key: '1',
      label: '01培训汇总表',
      children: <Tab1TrainingSummary year={year} />,
    },
    {
      key: '2',
      label: '02培训月度表',
      children: year === 'all' 
        ? <Alert message="请选择具体年份查看月度表数据" type="warning" showIcon />
        : <Tab2MonthlyTraining year={year} />,
    },
    {
      key: '3',
      label: '03培训周度表',
      children: year === 'all'
        ? <Alert message="请选择具体年份查看周度表数据" type="warning" showIcon />
        : <Tab3WeeklyTraining year={year} />,
    },
  ]

  return (
    <NoCopyContainer warningMessage="祈福司门数据禁止复制">
      <Card
        title="016祈福司培训汇总表"
        extra={
          <Select
            value={year}
            onChange={handleYearChange}
            style={{ width: 150 }}
          >
            {yearOptions()}
          </Select>
        }
      >
        <Tabs items={tabItems} defaultActiveKey="1" style={{ marginTop: 16 }} />
      </Card>
    </NoCopyContainer>
  )
}

export default ConsultingTrainingSummaryPage
