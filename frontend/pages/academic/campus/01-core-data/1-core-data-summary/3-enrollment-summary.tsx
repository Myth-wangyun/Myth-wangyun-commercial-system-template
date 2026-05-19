import React from 'react'
import { App, Card, Table, Button, Space, Select } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { SaveOutlined, ReloadOutlined } from '@ant-design/icons'
import type { CampusReputationEnrollmentGoalsResultsRecord } from '@/types/campus-reputation-enrollment-goals-results'
import { academicCampusReputationEnrollmentGoalsResultsService } from '@/services/academicCampusReputationEnrollmentGoalsResults'
import { useCampusStore } from '@/stores/campusStore'
import CampusSelector from '@/components/common/CampusSelector'
import { buildApiUrl } from '@/utils/apiBase'

const { Option } = Select

const EnrollmentSummaryTable: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus, getAllCampuses } = useCampusStore()
  const activeCampus = currentCampus ?? getAllCampuses()[0]?.name ?? '主神殿'
  const currentYear = new Date().getFullYear()

  const [selectedYear, setSelectedYear] = React.useState<number | 'all'>(currentYear)
  const [availableYears, setAvailableYears] = React.useState<number[]>([])
  const [rows, setRows] = React.useState<CampusReputationEnrollmentGoalsResultsRecord[]>([])
  const [loading, setLoading] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [autoFilling, setAutoFilling] = React.useState(false)
  const [hasAutoFilled, setHasAutoFilled] = React.useState(false)
  
  // 是否为历史合计模式
  const isHistoricalMode = selectedYear === 'all'

  const columns: ColumnsType<CampusReputationEnrollmentGoalsResultsRecord> = [
    {
      title: '月份',
      dataIndex: 'month',
      key: 'month',
      width: 80,
      align: 'center',
      render: (value, record, index) => {
        if (isHistoricalMode) {
          return <span style={{ color: 'red', fontWeight: 'bold' }}>历史合计</span>
        }
        return index === rows.length - 1 ? (
          <span style={{ color: 'red', fontWeight: 'bold' }}>合计</span>
        ) : (
          value
        )
      },
    },
    {
      title: '神殿',
      dataIndex: 'campus',
      key: 'campus',
      width: 100,
      align: 'center',
      render: (value, _record, index) => {
        if (isHistoricalMode) {
          return activeCampus
        }
        return index === 0 ? value || activeCampus : ''
      },
    },
    {
      title: '口碑量',
      children: [
        {
          title: '目标口碑量',
          dataIndex: 'targetReputationVolume',
          key: 'targetReputationVolume',
          width: 120,
          align: 'center',
          render: (value) => value ?? '',
        },
        {
          title: '实际口碑量',
          dataIndex: 'actualReputationVolume',
          key: 'actualReputationVolume',
          width: 120,
          align: 'center',
          render: (value) => value ?? '',
        },
      ],
    },
    {
      title: '上门量',
      children: [
        {
          title: '目标上门量',
          dataIndex: 'targetWalkInVolume',
          key: 'targetWalkInVolume',
          width: 120,
          align: 'center',
          render: (value) => value ?? '',
        },
        {
          title: '实际上门量',
          dataIndex: 'actualWalkInVolume',
          key: 'actualWalkInVolume',
          width: 120,
          align: 'center',
          render: (value) => value ?? '',
        },
      ],
    },
    {
      title: '招生人数',
      children: [
        {
          title: '目标人数',
          dataIndex: 'targetEnrollmentCount',
          key: 'targetEnrollmentCount',
          width: 100,
          align: 'center',
          render: (value) => value ?? '',
        },
        {
          title: '实际人数',
          dataIndex: 'actualEnrollmentCount',
          key: 'actualEnrollmentCount',
          width: 100,
          align: 'center',
          render: (value) => value ?? '',
        },
      ],
    },
    {
      title: '口碑收入',
      children: [
        {
          title: '目标收入',
          dataIndex: 'targetRevenue',
          key: 'targetRevenue',
          width: 120,
          align: 'center',
          render: (value) => (typeof value === 'number' ? `¥${value.toLocaleString()}` : ''),
        },
        {
          title: '实际收入',
          dataIndex: 'actualRevenue',
          key: 'actualRevenue',
          width: 120,
          align: 'center',
          render: (value) => (typeof value === 'number' ? `¥${value.toLocaleString()}` : ''),
        },
      ],
    },
  ]

  // 加载可用年份列表
  const loadAvailableYears = React.useCallback(async () => {
    try {
      const years = await academicCampusReputationEnrollmentGoalsResultsService.getAvailableYears(activeCampus)
      // 确保当前年份在列表中
      if (!years.includes(currentYear)) {
        years.unshift(currentYear)
      }
      // 按年份降序排列
      years.sort((a, b) => b - a)
      setAvailableYears(years)
    } catch (error) {
      console.error('获取年份列表失败:', error)
      // 默认显示当前年份和前两年
      setAvailableYears([currentYear, currentYear - 1, currentYear - 2])
    }
  }, [activeCampus, currentYear])

  const loadData = React.useCallback(async () => {
    setLoading(true)
    try {
      let list: CampusReputationEnrollmentGoalsResultsRecord[]
      
      if (selectedYear === 'all') {
        // 历史合计模式
        list = await academicCampusReputationEnrollmentGoalsResultsService.getCampusHistoricalSummary(activeCampus)
      } else {
        // 按年份加载
        list = await academicCampusReputationEnrollmentGoalsResultsService.getCampusReputationEnrollmentGoalsResultsData(
          activeCampus,
          selectedYear,
        )
      }
      setRows(list)
    } catch (error) {
      console.error('获取数据失败:', error)
      message.error('获取口碑招生数据失败')
      // 如果没有数据，生成空数据
      if (selectedYear === 'all') {
        // 历史合计模式只显示一行
        setRows([{
          key: `${activeCampus}-historical-total`,
          month: 0,
          campus: activeCampus,
          targetReputationVolume: 0,
          actualReputationVolume: 0,
          targetWalkInVolume: 0,
          actualWalkInVolume: 0,
          targetEnrollmentCount: 0,
          actualEnrollmentCount: 0,
          targetRevenue: 0,
          actualRevenue: 0,
        }])
      } else {
        const emptyRows: CampusReputationEnrollmentGoalsResultsRecord[] = []
        for (let i = 1; i <= 12; i++) {
          emptyRows.push({
            key: `${activeCampus}-${i}`,
            month: i,
            campus: i === 1 ? activeCampus : '',
            targetReputationVolume: 0,
            actualReputationVolume: 0,
            targetWalkInVolume: 0,
            actualWalkInVolume: 0,
            targetEnrollmentCount: 0,
            actualEnrollmentCount: 0,
            targetRevenue: 0,
            actualRevenue: 0,
          })
        }
        emptyRows.push({
          key: `${activeCampus}-total`,
          month: 0,
          campus: '',
          targetReputationVolume: 0,
          actualReputationVolume: 0,
          targetWalkInVolume: 0,
          actualWalkInVolume: 0,
          targetEnrollmentCount: 0,
          actualEnrollmentCount: 0,
          targetRevenue: 0,
          actualRevenue: 0,
        })
        setRows(emptyRows)
      }
    } finally {
      setLoading(false)
    }
  }, [activeCampus, selectedYear])

  // 自动填充函数
  const autoFillFromMonthly = async () => {
    if (isHistoricalMode) {
      message.warning('历史合计模式不支持自动填充')
      return false
    }
    
    setAutoFilling(true)
    try {
      const targetYear = typeof selectedYear === 'number' ? selectedYear : currentYear
      const params = new URLSearchParams({
        campus: activeCampus,
        year: targetYear.toString(),
      })
      
      // 调用自动填充接口，从月度个人表汇总到神殿汇总表
      const res = await fetch(`${buildApiUrl('/reputation-aggregation/auto-fill')}?${params.toString()}`, {
        method: 'POST',
      })
      
      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        message.error(`自动填充失败: ${error.detail || '未知错误'}`)
        return false
      }
      
      // 重新加载数据
      await loadData()
      return true
    } catch (error) {
      console.error('自动填充失败:', error)
      message.error('自动填充失败，请稍后重试')
      return false
    } finally {
      setAutoFilling(false)
    }
  }

  React.useEffect(() => {
    setHasAutoFilled(false)
  }, [activeCampus])

  // 加载可用年份
  React.useEffect(() => {
    loadAvailableYears()
  }, [loadAvailableYears])

  React.useEffect(() => {
    loadData()
  }, [loadData])

  // 首次加载时自动填充（仅在没有数据时且非历史合计模式）
  React.useEffect(() => {
    if (!loading && rows.length > 0 && !hasAutoFilled && !isHistoricalMode) {
      const monthlyRows = rows.filter(r => r.month > 0)
      const isEmpty = monthlyRows.length === 0 || monthlyRows.every(r => 
        r.targetReputationVolume === 0 && 
        r.actualReputationVolume === 0 &&
        r.targetWalkInVolume === 0 &&
        r.actualWalkInVolume === 0 &&
        r.targetEnrollmentCount === 0 &&
        r.actualEnrollmentCount === 0
      )
      if (isEmpty) {
        setHasAutoFilled(true)
        autoFillFromMonthly()
      }
    }
  }, [loading, rows.length, hasAutoFilled, activeCampus, isHistoricalMode])

  // 生成年份选项
  const yearOptions = React.useMemo(() => {
    const options: { label: string; value: number | 'all' }[] = [
      { label: '历史合计', value: 'all' },
    ]
    availableYears.forEach(year => {
      options.push({ label: `${year}年`, value: year })
    })
    return options
  }, [availableYears])

  return (
    <div style={{ padding: 24 }}>
      <Card 
        title="神殿智慧司口碑招生汇总表" 
        bordered={false}
        extra={<CampusSelector size="middle" useGlobalState={true} />}
      >
        <div style={{ marginBottom: 12, display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
          <Space>
            <span>选择年份：</span>
            <Select
              value={selectedYear}
              onChange={(value) => setSelectedYear(value)}
              style={{ width: 120 }}
            >
              {yearOptions.map((opt) => (
                <Option key={opt.value} value={opt.value}>
                  {opt.label}
                </Option>
              ))}
            </Select>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => loadData()}
              loading={loading}
            >
              刷新
            </Button>
          </Space>
          {!isHistoricalMode && (
            <Space>
              <Button
                type="primary"
                loading={autoFilling}
                onClick={async () => {
                  const success = await autoFillFromMonthly()
                  if (success) {
                    message.success('自动填充成功！')
                  }
                }}
              >
                自动填充汇总表
              </Button>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                loading={saving}
                onClick={async () => {
                  setSaving(true)
                  try {
                    await academicCampusReputationEnrollmentGoalsResultsService.saveCampusReputationEnrollmentGoalsResultsData(
                      activeCampus,
                      rows.filter(r => r.month > 0),
                      typeof selectedYear === 'number' ? selectedYear : undefined,
                    )
                    message.success('保存成功')
                  } catch (error: any) {
                    console.error('保存失败:', error)
                    message.error(error.message || '保存失败，请稍后重试')
                  } finally {
                    setSaving(false)
                  }
                }}
              >
                保存到服务器
              </Button>
            </Space>
          )}
        </div>
        <Table
          bordered
          size="small"
          columns={columns}
          dataSource={rows}
          loading={loading}
          pagination={false}
          rowKey={(record) => record.key}
          scroll={{ x: 'max-content' }}
        />
      </Card>
    </div>
  )
}

export default EnrollmentSummaryTable