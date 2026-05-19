import React, { useState, useEffect } from 'react'
import { App, Table, Button, Spin, Alert } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { getTrainingWeeklyListByYear, type TrainingWeeklyRecord } from '@/api/consult/training-weekly'
import { useCampusStore } from '@/stores/campusStore'

/**
 * TAB2 - 02培训月度表
 * 数据从03培训周度表汇总而来，只读展示
 * 显示4个独立的表格，每个表格对应一个岗位
 * 01最高议事厅-祈福司 校长培训计划与成绩月度汇总表 - 岗位：校长
 * 02最高议事厅-祈福司 咨询经理培训计划与成绩月度汇总表 - 岗位：咨询经理
 * 03最高议事厅-祈福司咨询师培训计划与成绩月度汇总表 - 岗位：咨询师
 * 04最高议事厅-祈福司 运营管理培训计划与成绩月度汇总表 - 岗位：运营
 */

// 培训数据类型
interface TrainingData {
  trainingSessions: number  // 培训次数
  trainedPeople: number     // 培训人次
  qualifiedPeople: number   // 合格人数
  passRate: string          // 合格率
  // 内部用于均值兜底
  _passRateSum?: number     // 考试合格率之和（用于 trainedPeople=0 时兜底）
  _passRateCount?: number   // 有效考试合格率记录数
}

// 月度数据行类型
interface MonthlyRow {
  key: string
  month: string
  valueTraining: TrainingData       // 价值观
  campusKnowledge: TrainingData     // 神殿专业知识培训
  positionTraining: TrainingData    // 岗位知识培训
  careerDevelopment: TrainingData   // 职业素养
  isSummary?: boolean
}

// 表格配置类型
interface TableConfig {
  id: string
  title: string
  position: string  // 对应后端存储的岗位字段
}

// 4个表格的配置
const TABLE_CONFIGS: TableConfig[] = [
  { id: '01', title: '01最高议事厅-祈福司 校长培训计划与成绩月度汇总表', position: '校长' },
  { id: '02', title: '02最高议事厅-祈福司 咨询经理培训计划与成绩月度汇总表', position: '咨询经理' },
  { id: '03', title: '03最高议事厅-祈福司咨询师培训计划与成绩月度汇总表', position: '咨询师' },
  { id: '04', title: '04最高议事厅-祈福司 运营管理培训计划与成绩月度汇总表', position: '运营' },
]

// 培训项目到字段的映射
const TRAINING_PROJECT_MAP: Record<string, keyof Pick<MonthlyRow, 'valueTraining' | 'campusKnowledge' | 'positionTraining' | 'careerDevelopment'>> = {
  '价值观': 'valueTraining',
  '神殿专业知识培训': 'campusKnowledge',
  '岗位知识培训': 'positionTraining',
  '职业素养': 'careerDevelopment',
}

interface Tab2MonthlyTrainingProps {
  year: string
}

export default function Tab2MonthlyTraining({ year }: Tab2MonthlyTrainingProps) {
  // 创建空的培训数据
  const makeEmptyTrainingData = (): TrainingData => ({
    trainingSessions: 0,
    trainedPeople: 0,
    qualifiedPeople: 0,
    passRate: '',
    _passRateSum: 0,
    _passRateCount: 0,
  })

  const { currentCampus } = useCampusStore()
  const { message } = App.useApp()

  // 创建空行
  const makeEmptyRow = (month: string): MonthlyRow => ({
    key: month,
    month,
    valueTraining: makeEmptyTrainingData(),
    campusKnowledge: makeEmptyTrainingData(),
    positionTraining: makeEmptyTrainingData(),
    careerDevelopment: makeEmptyTrainingData(),
  })

  // 初始化12个月的空数据
  const initializeEmptyRows = (): MonthlyRow[] => {
    return Array.from({ length: 12 }, (_, i) => makeEmptyRow(`${i + 1}月份`))
  }

  // 为每个表格存储数据，key 是 position
  const [tableDataMap, setTableDataMap] = useState<Record<string, MonthlyRow[]>>(() => {
    const map: Record<string, MonthlyRow[]> = {}
    TABLE_CONFIGS.forEach(config => {
      map[config.position] = initializeEmptyRows()
    })
    return map
  })

  const [loading, setLoading] = useState(false)

  // 计算合格率
  const calculatePassRate = (trained: number, qualified: number): string => {
    if (trained > 0) {
      return ((qualified / trained) * 100).toFixed(2) + '%'
    }
    return ''
  }

  // 从周度表数据汇总到月度表
  const aggregateWeeklyData = (weeklyRecords: TrainingWeeklyRecord[]) => {
    const newMap: Record<string, MonthlyRow[]> = {}
    
    // 初始化所有岗位的空数据
    TABLE_CONFIGS.forEach(config => {
      newMap[config.position] = initializeEmptyRows()
    })

    // 遍历周度表记录，按岗位和月份汇总
    weeklyRecords.forEach(record => {
      const position = record.岗位
      const trainingProject = record.培训项目
      const trainingDate = record.培训时间

      // 检查是否是有效的岗位
      if (!position || !newMap[position]) return

      // 检查培训项目是否在映射中
      if (!trainingProject || !TRAINING_PROJECT_MAP[trainingProject]) return

      // 解析日期获取月份
      if (!trainingDate) return
      const date = new Date(trainingDate)
      const month = date.getMonth() + 1 // 1-12
      const monthKey = `${month}月份`

      // 找到对应的行
      const rows = newMap[position]
      const rowIndex = rows.findIndex(r => r.key === monthKey)
      if (rowIndex === -1) return

      // 获取培训类型字段名
      const trainingTypeKey = TRAINING_PROJECT_MAP[trainingProject]

      // 更新汇总数据（使用 Number() 确保类型安全，防止 Decimal 序列化为字符串导致拼接错误）
      const row = { ...rows[rowIndex] }
      const trainingData = { ...row[trainingTypeKey] }

      trainingData.trainingSessions += 1 // 每条记录算一次培训
      trainingData.trainedPeople += Number(record.培训人次) || 0
      trainingData.qualifiedPeople += Number(record.合格人数) || 0
      // 累计考试合格率（用于 trainedPeople=0 时兜底）
      const passRateVal = Number(record.考试合格率)
      if (!isNaN(passRateVal) && passRateVal > 0) {
        trainingData._passRateSum = (trainingData._passRateSum || 0) + passRateVal
        trainingData._passRateCount = (trainingData._passRateCount || 0) + 1
      }

      row[trainingTypeKey] = trainingData
      rows[rowIndex] = row
    })

    // 计算所有的合格率
    Object.keys(newMap).forEach(position => {
      newMap[position] = newMap[position].map(row => {
        const newRow = { ...row }
        
        // 计算各培训类型的合格率：优先用人数计算，否则用考试合格率均值兜底
        ;(['valueTraining', 'campusKnowledge', 'positionTraining', 'careerDevelopment'] as const).forEach(type => {
          const d = newRow[type]
          let rate = calculatePassRate(d.trainedPeople, d.qualifiedPeople)
          if (!rate && d._passRateCount && d._passRateCount > 0) {
            rate = ((d._passRateSum! / d._passRateCount) ).toFixed(2) + '%'
          }
          newRow[type] = { ...d, passRate: rate }
        })
        
        return newRow
      })
    })

    return newMap
  }

  // 加载数据（从周度表汇总）
  const loadData = async () => {
    setLoading(true)
    try {
      const response = await getTrainingWeeklyListByYear({
        year: parseInt(year),
        page: 1,
        page_size: 200,
      })
      
      const data = (response as any).data || response
      
      if (data.items && data.items.length > 0) {
        const aggregatedData = aggregateWeeklyData(data.items)
        setTableDataMap(aggregatedData)
      } else {
        // 没有数据，初始化空表格
        const emptyMap: Record<string, MonthlyRow[]> = {}
        TABLE_CONFIGS.forEach(config => {
          emptyMap[config.position] = initializeEmptyRows()
        })
        setTableDataMap(emptyMap)
      }
    } catch (error) {
      console.error('加载数据失败:', error)
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [year, currentCampus])

  // 生成某个表格的列配置
  const generateColumns = (position: string) => {
    const trainingColumns = (
      trainingType: keyof Pick<MonthlyRow, 'valueTraining' | 'campusKnowledge' | 'positionTraining' | 'careerDevelopment'>,
      title: string
    ) => ({
      title,
      children: [
        {
          title: '培训次数',
          dataIndex: [trainingType, 'trainingSessions'],
          key: `${trainingType}_sessions`,
          width: 80,
          align: 'center' as const,
          render: (val: number) => val || 0,
        },
        {
          title: '培训人次',
          dataIndex: [trainingType, 'trainedPeople'],
          key: `${trainingType}_people`,
          width: 80,
          align: 'center' as const,
          render: (val: number) => val || 0,
        },
        {
          title: '合格人数',
          dataIndex: [trainingType, 'qualifiedPeople'],
          key: `${trainingType}_qualified`,
          width: 80,
          align: 'center' as const,
          render: (val: number) => val || 0,
        },
        {
          title: '合格率',
          dataIndex: [trainingType, 'passRate'],
          key: `${trainingType}_rate`,
          width: 70,
          align: 'center' as const,
          render: (val: string) => (
            <span style={{ color: '#1890ff', fontWeight: 500 }}>{val}</span>
          ),
        },
      ],
    })

    return [
      {
        title: '项目',
        children: [
          {
            title: '时间',
            children: [
              {
                title: '月份',
                dataIndex: 'month',
                key: 'month',
                width: 70,
                fixed: 'left' as const,
                align: 'center' as const,
                render: (text: string, record: MonthlyRow) => (
                  <span style={record.isSummary ? { fontWeight: 600 } : undefined}>{text}</span>
                ),
              },
            ],
          },
        ],
      },
      {
        title: '岗位',
        children: [
          {
            title: position,
            children: [
              {
                title: '名称',
                dataIndex: 'month',
                key: 'name',
                width: 70,
                fixed: 'left' as const,
                align: 'center' as const,
                onCell: (_: MonthlyRow, index?: number) => {
                  if (index === 0) return { rowSpan: 1 } // 汇总行：正常显示，不合并
                  if (index === 1) return { rowSpan: 12 }
                  return { rowSpan: 0 }
                },
                render: (_: string, record: MonthlyRow) => (
                  record.isSummary ? null : <span style={{ fontWeight: 500 }}>{position}</span>
                ),
              },
            ],
          },
        ],
      },
      trainingColumns('valueTraining', '价值观'),
      trainingColumns('campusKnowledge', '神殿专业知识培训'),
      trainingColumns('positionTraining', '岗位知识培训'),
      trainingColumns('careerDevelopment', '职业素养'),
    ]
  }

  // 计算汇总行
  const calculateSummary = (rows: MonthlyRow[]) => {
    const sum = (
      trainingType: keyof Pick<MonthlyRow, 'valueTraining' | 'campusKnowledge' | 'positionTraining' | 'careerDevelopment'>,
      field: 'trainingSessions' | 'trainedPeople' | 'qualifiedPeople'
    ) => {
      return rows.reduce((acc, row) => acc + (Number(row[trainingType][field]) || 0), 0)
    }

    const calcRateForType = (
      trainingType: keyof Pick<MonthlyRow, 'valueTraining' | 'campusKnowledge' | 'positionTraining' | 'careerDevelopment'>
    ) => {
      const people = sum(trainingType, 'trainedPeople')
      const qualified = sum(trainingType, 'qualifiedPeople')
      if (people > 0) return ((qualified / people) * 100).toFixed(2) + '%'
      // 兜底1：用各月累积的考试合格率均值
      const totalRateSum = rows.reduce((acc, r) => acc + (Number(r[trainingType]._passRateSum) || 0), 0)
      const totalRateCount = rows.reduce((acc, r) => acc + (Number(r[trainingType]._passRateCount) || 0), 0)
      if (totalRateCount > 0) return (totalRateSum / totalRateCount).toFixed(2) + '%'
      // 兜底2：用各月已计算的非空 passRate 的均值
      const monthlyRates = rows
        .map(r => r[trainingType].passRate)
        .filter(r => r && r !== '')
        .map(r => parseFloat(r))
        .filter(v => !isNaN(v))
      if (monthlyRates.length > 0) {
        const avg = monthlyRates.reduce((a, b) => a + b, 0) / monthlyRates.length
        return avg.toFixed(2) + '%'
      }
      return ''
    }

    return {
      valueTraining: {
        sessions: sum('valueTraining', 'trainingSessions'),
        people: sum('valueTraining', 'trainedPeople'),
        qualified: sum('valueTraining', 'qualifiedPeople'),
        rate: calcRateForType('valueTraining'),
      },
      campusKnowledge: {
        sessions: sum('campusKnowledge', 'trainingSessions'),
        people: sum('campusKnowledge', 'trainedPeople'),
        qualified: sum('campusKnowledge', 'qualifiedPeople'),
        rate: calcRateForType('campusKnowledge'),
      },
      positionTraining: {
        sessions: sum('positionTraining', 'trainingSessions'),
        people: sum('positionTraining', 'trainedPeople'),
        qualified: sum('positionTraining', 'qualifiedPeople'),
        rate: calcRateForType('positionTraining'),
      },
      careerDevelopment: {
        sessions: sum('careerDevelopment', 'trainingSessions'),
        people: sum('careerDevelopment', 'trainedPeople'),
        qualified: sum('careerDevelopment', 'qualifiedPeople'),
        rate: calcRateForType('careerDevelopment'),
      },
    }
  }

  const buildRowsWithSummary = (rows: MonthlyRow[], summary: ReturnType<typeof calculateSummary>): MonthlyRow[] => {
    const summaryRow: MonthlyRow = {
      key: 'summary',
      month: '汇总',
      valueTraining: {
        trainingSessions: summary.valueTraining.sessions,
        trainedPeople: summary.valueTraining.people,
        qualifiedPeople: summary.valueTraining.qualified,
        passRate: summary.valueTraining.rate,
      },
      campusKnowledge: {
        trainingSessions: summary.campusKnowledge.sessions,
        trainedPeople: summary.campusKnowledge.people,
        qualifiedPeople: summary.campusKnowledge.qualified,
        passRate: summary.campusKnowledge.rate,
      },
      positionTraining: {
        trainingSessions: summary.positionTraining.sessions,
        trainedPeople: summary.positionTraining.people,
        qualifiedPeople: summary.positionTraining.qualified,
        passRate: summary.positionTraining.rate,
      },
      careerDevelopment: {
        trainingSessions: summary.careerDevelopment.sessions,
        trainedPeople: summary.careerDevelopment.people,
        qualifiedPeople: summary.careerDevelopment.qualified,
        passRate: summary.careerDevelopment.rate,
      },
      isSummary: true,
    }

    return [summaryRow, ...rows]
  }

  return (
    <div>
      {/* 提示信息和刷新按钮 */}
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Alert
          message="数据说明"
          description="本页数据由【03培训周度表】自动汇总生成，如需修改请前往周度表编辑"
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

      {/* 渲染4个表格 */}
      <Spin spinning={loading}>
        {TABLE_CONFIGS.map((config) => {
          const rows = tableDataMap[config.position] || []
          const summary = calculateSummary(rows)
          const rowsWithSummary = buildRowsWithSummary(rows, summary)

          // 计算综合合格率（所有培训类型累计）
          const totalTrained =
            summary.valueTraining.people +
            summary.campusKnowledge.people +
            summary.positionTraining.people +
            summary.careerDevelopment.people
          const totalQualified =
            summary.valueTraining.qualified +
            summary.campusKnowledge.qualified +
            summary.positionTraining.qualified +
            summary.careerDevelopment.qualified
          const overallPassRate =
            totalTrained > 0
              ? ((totalQualified / totalTrained) * 100).toFixed(2) + '%'
              : '--'
          
          return (
            <div key={config.id} style={{ marginBottom: 32 }}>
              {/* 表格标题栏 */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #d4740c 0%, #e8a849 100%)',
                  color: '#fff',
                  padding: '8px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderRadius: '4px 4px 0 0',
                }}
              >
                <span style={{ fontWeight: 600, fontSize: 14 }}>{config.title}</span>
                <span style={{ fontSize: 12, display: 'flex', gap: 16 }}>
                  <span style={{ opacity: 0.8 }}>岗位：{config.position}</span>
                  <span>
                    综合合格率：
                    <span style={{ fontWeight: 700, fontSize: 14, marginLeft: 4 }}>
                      {overallPassRate}
                    </span>
                  </span>
                </span>
              </div>
              
              {/* 表格内容 */}
              <Table
                columns={generateColumns(config.position) as any}
                dataSource={rowsWithSummary}
                pagination={false}
                bordered
                size="small"
                scroll={{ x: 1200 }}
              />
            </div>
          )
        })}
      </Spin>
    </div>
  )
}
