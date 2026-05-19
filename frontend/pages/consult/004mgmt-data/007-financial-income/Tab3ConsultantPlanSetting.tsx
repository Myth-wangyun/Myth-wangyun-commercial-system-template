import React, { useCallback, useEffect, useState } from 'react'
import { App, Button, Card, DatePicker, InputNumber, Space, Spin, Table, Tabs, Tag } from 'antd'
import { FileTextOutlined, SaveOutlined, SyncOutlined, DatabaseOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useCampusStore } from '@/stores/campusStore'
import { normalizeCampusName } from '@/utils/campusSort'
import {
  getConsultantPlanList,
  batchSaveConsultantPlans,
  DATA_TYPES,
  type ConsultantMonthlyPlan,
} from '@/services/consult/consultantPlan'
import { getConsultantNames } from '@/services/consult/consultantList'

/**
 * 标准化神殿名称用于API请求（移除"神殿"后缀以便后端模糊匹配）
 */
const normalizeForApi = (campusName: string): string => {
  return campusName.replace(/神殿$/, '').trim()
}

// 数据类型颜色映射
const DATA_TYPE_COLORS: Record<string, string> = {
  'SEM': '#1890ff',
  '新媒体': '#52c41a',
  '市场口碑': '#faad14',
  '合作伙伴': '#722ed1',
  '口碑': '#eb2f96',
  '渠道': '#13c2c2',
  '神殿新媒体': '#fa8c16',
}

/**
 * TAB3 - 各神殿各咨询师各月份计划收入表（按数据类型细分）
 * 功能：设置各神殿各咨询师各月份的计划收入
 * 
 * 结构：
 * - 年份选择器
 * - 神殿TAB切换（外层）
 * - 数据类型TAB切换（内层）
 * - 每个数据类型一个表格，行=咨询师，列=1-12月
 * - 可编辑计划收入/计划招生
 * - 保存按钮
 */
export default function Tab3ConsultantPlanSetting() {
  const { message, notification } = App.useApp()
  const currentYear = dayjs().format('YYYY')
  const [year, setYear] = useState(currentYear)

  // 从 campusStore 获取神殿列表
  const allCampuses = useCampusStore.getState().getAllCampuses()
  const campusList = allCampuses.map(c => ({
    key: c.id || c.name,
    name: normalizeCampusName(c.name),
  }))

  const handleYearChange = (date: dayjs.Dayjs | null) => {
    if (!date) return
    setYear(date.format('YYYY'))
  }

  // 动态生成各神殿TAB
  const tabItems = campusList.map(campus => ({
    key: campus.key,
    label: campus.name,
    children: <CampusDataTypePanel campusName={campus.name} year={year} />,
  }))

  return (
    <div style={{ padding: 16 }}>
      {/* 年份选择器 */}
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <Space>
          <span>选择年份：</span>
          <DatePicker
            picker="year"
            value={dayjs(year, 'YYYY')}
            onChange={handleYearChange}
            allowClear={false}
            style={{ width: 120 }}
            format="YYYY年"
          />
        </Space>
      </div>

      {/* 神殿TAB切换 */}
      <Tabs
        defaultActiveKey={campusList[0]?.key}
        items={tabItems}
        type="card"
        size="small"
      />
    </div>
  )
}

// ==================== 神殿数据类型面板 ====================

interface CampusDataTypePanelProps {
  campusName: string
  year: string
}

/**
 * 单神殿面板 - 按数据类型（量来源）细分的TAB
 */
function CampusDataTypePanel({ campusName, year }: CampusDataTypePanelProps) {
  // 数据类型TAB（不包含"汇总"，汇总是自动计算的）
  const dataTypeTabs = DATA_TYPES.filter(dt => dt !== '汇总').map(dataType => ({
    key: dataType,
    label: (
      <span>
        <Tag color={DATA_TYPE_COLORS[dataType] || 'default'} style={{ marginRight: 4 }}>
          {dataType}
        </Tag>
      </span>
    ),
    children: (
      <CampusConsultantPlanTable 
        campusName={campusName} 
        year={year} 
        dataType={dataType}
      />
    ),
  }))

  return (
    <div>
      <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
        <DatabaseOutlined style={{ color: '#c00000' }} />
        <span style={{ color: '#666', fontSize: 12 }}>
          请按数据类型（量来源）分别设置各咨询师的月度计划收入和计划招生数
        </span>
      </div>
      <Tabs
        defaultActiveKey={DATA_TYPES[0]}
        items={dataTypeTabs}
        type="line"
        size="small"
        tabBarStyle={{ marginBottom: 8 }}
      />
    </div>
  )
}

// ==================== 单神殿咨询师计划表（按数据类型） ====================

interface CampusConsultantPlanTableProps {
  campusName: string
  year: string
  dataType: string
}

type RowData = {
  key: string
  咨询师: string
  isTotal: boolean
  months: Record<number, { 计划收入: number | null; 计划招生: number | null }>
  年度计划收入: number
  年度计划招生: number
}

/**
 * 单神殿咨询师计划表（按数据类型）
 * 行=咨询师，列=1-12月
 */
function CampusConsultantPlanTable({ campusName, year, dataType }: CampusConsultantPlanTableProps) {
  const { message, notification } = App.useApp()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [rows, setRows] = useState<RowData[]>([])
  const [consultants, setConsultants] = useState<string[]>([])

  // 从12个月的数据创建初始行
  const createEmptyRow = (consultantName: string, isTotal = false): RowData => {
    const months: Record<number, { 计划收入: number | null; 计划招生: number | null }> = {}
    for (let m = 1; m <= 12; m++) {
      months[m] = { 计划收入: null, 计划招生: null }
    }
    return {
      key: consultantName,
      咨询师: consultantName,
      isTotal,
      months,
      年度计划收入: 0,
      年度计划招生: 0,
    }
  }

  // 计算行年度合计
  const computeRowTotal = (row: RowData): RowData => {
    let totalIncome = 0
    let totalCount = 0
    for (let m = 1; m <= 12; m++) {
      totalIncome += row.months[m]?.计划收入 || 0
      totalCount += row.months[m]?.计划招生 || 0
    }
    return {
      ...row,
      年度计划收入: totalIncome,
      年度计划招生: totalCount,
    }
  }

  // 计算合计行
  const computeTotalRow = (consultantRows: RowData[]): RowData => {
    const totalRow = createEmptyRow('合计', true)
    
    for (let m = 1; m <= 12; m++) {
      let sumIncome = 0
      let sumCount = 0
      for (const row of consultantRows) {
        sumIncome += row.months[m]?.计划收入 || 0
        sumCount += row.months[m]?.计划招生 || 0
      }
      totalRow.months[m] = { 计划收入: sumIncome || null, 计划招生: sumCount || null }
    }
    
    return computeRowTotal(totalRow)
  }

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      // 标准化神殿名称用于API请求
      const campusForApi = normalizeForApi(campusName)
      
      // 1. 获取神殿咨询师列表
      let consultantList = await getConsultantNames(campusForApi)
      if (consultantList.length === 0) {
        consultantList = await getConsultantNames()
      }
      setConsultants(consultantList)

      // 2. 获取已有的计划数据（按数据类型过滤）
      const plans = await getConsultantPlanList({
        year: parseInt(year),
        campus: campusForApi,
        data_type: dataType,
      })

      // 3. 构建行数据
      const rowMap = new Map<string, RowData>()
      
      // 先为每个咨询师创建空行
      for (const name of consultantList) {
        rowMap.set(name, createEmptyRow(name))
      }

      // 填充已有的计划数据
      for (const plan of plans) {
        let row = rowMap.get(plan.咨询师)
        if (!row) {
          // 如果计划数据中有咨询师不在列表中，也要显示
          row = createEmptyRow(plan.咨询师)
          rowMap.set(plan.咨询师, row)
        }
        row.months[plan.月份] = {
          计划收入: plan.计划收入,
          计划招生: plan.计划招生,
        }
      }

      // 计算每行年度合计
      const consultantRows = Array.from(rowMap.values()).map(computeRowTotal)
      
      // 添加合计行
      const totalRow = computeTotalRow(consultantRows)
      
      setRows([...consultantRows, totalRow])
      setHasChanges(false)
    } catch (error) {
      console.error('加载数据失败:', error)
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }, [campusName, year, dataType])

  useEffect(() => {
    loadData()
  }, [loadData])

  // 更新单元格值
  const updateCellValue = (
    consultantName: string,
    month: number,
    field: '计划收入' | '计划招生',
    value: number | null
  ) => {
    setRows(prev => {
      // 找到对应的行
      const consultantRows = prev.filter(r => !r.isTotal)
      const rowIndex = consultantRows.findIndex(r => r.咨询师 === consultantName)
      if (rowIndex === -1) return prev

      // 更新值
      const updatedRows = consultantRows.map((row, idx) => {
        if (idx !== rowIndex) return row
        const newRow = {
          ...row,
          months: {
            ...row.months,
            [month]: {
              ...row.months[month],
              [field]: value,
            },
          },
        }
        return computeRowTotal(newRow)
      })

      // 重新计算合计行
      const totalRow = computeTotalRow(updatedRows)
      
      return [...updatedRows, totalRow]
    })
    setHasChanges(true)
  }

  // 保存数据
  const handleSave = async () => {
    setSaving(true)
    try {
      const consultantRows = rows.filter(r => !r.isTotal)
      const plans: ConsultantMonthlyPlan[] = []
      // 标准化神殿名称用于保存
      const campusForApi = normalizeForApi(campusName)

      for (const row of consultantRows) {
        for (let m = 1; m <= 12; m++) {
          const monthData = row.months[m]
          // 只保存有数据的月份
          if (monthData.计划收入 !== null || monthData.计划招生 !== null) {
            plans.push({
              年份: parseInt(year),
              月份: m,
              神殿: campusForApi,
              咨询师: row.咨询师,
              数据类型: dataType,
              计划收入: monthData.计划收入,
              计划招生: monthData.计划招生,
            })
          }
        }
      }

      if (plans.length === 0) {
        message.warning('没有需要保存的数据')
        return
      }

      await batchSaveConsultantPlans(plans)
      notification.success({ message: '已保存', description: '计划数据保存成功', placement: 'topRight', duration: 3 })
      setHasChanges(false)
    } catch (error) {
      console.error('保存失败:', error)
      notification.error({ message: '保存失败', description: '计划数据保存失败，请稍后重试', placement: 'topRight', duration: 4 })
    } finally {
      setSaving(false)
    }
  }

  // 渲染可编辑输入框
  const renderEditableCell = (
    record: RowData,
    month: number,
    field: '计划收入' | '计划招生'
  ) => {
    const value = record.months[month]?.[field]
    
    if (record.isTotal) {
      // 合计行只显示值
      return (
        <span style={{ fontWeight: 'bold', color: '#c00000' }}>
          {value !== null && value !== 0 ? value : '-'}
        </span>
      )
    }
    
    return (
      <InputNumber
        value={value}
        onChange={(val) => updateCellValue(record.咨询师, month, field, val)}
        style={{ width: '100%' }}
        size="small"
        min={0}
        disabled={saving}
        placeholder="-"
      />
    )
  }

  // 生成表格列
  const columns = [
    {
      title: '咨询师',
      dataIndex: '咨询师',
      key: '咨询师',
      width: 80,
      fixed: 'left' as const,
      render: (val: string, record: RowData) => (
        <span style={{ fontWeight: record.isTotal ? 'bold' : 'normal' }}>
          {val}
        </span>
      ),
    },
    // 生成1-12月的列
    ...Array.from({ length: 12 }, (_, i) => i + 1).map(month => ({
      title: `${month}月`,
      children: [
        {
          title: '计划收入',
          dataIndex: ['months', month, '计划收入'],
          key: `income_${month}`,
          width: 85,
          align: 'right' as const,
          render: (_: any, record: RowData) => renderEditableCell(record, month, '计划收入'),
        },
        {
          title: '计划招生',
          dataIndex: ['months', month, '计划招生'],
          key: `count_${month}`,
          width: 65,
          align: 'right' as const,
          render: (_: any, record: RowData) => renderEditableCell(record, month, '计划招生'),
        },
      ],
    })),
    // 年度合计列
    {
      title: '年度合计',
      children: [
        {
          title: '计划收入',
          dataIndex: '年度计划收入',
          key: 'yearlyIncome',
          width: 100,
          align: 'right' as const,
          render: (val: number, record: RowData) => (
            <span style={{ 
              fontWeight: 'bold', 
              color: record.isTotal ? '#c00000' : '#1890ff' 
            }}>
              {val > 0 ? val.toLocaleString() : '-'}
            </span>
          ),
        },
        {
          title: '计划招生',
          dataIndex: '年度计划招生',
          key: 'yearlyCount',
          width: 80,
          align: 'right' as const,
          render: (val: number, record: RowData) => (
            <span style={{ 
              fontWeight: 'bold', 
              color: record.isTotal ? '#c00000' : '#1890ff' 
            }}>
              {val > 0 ? val : '-'}
            </span>
          ),
        },
      ],
    },
  ]

  return (
    <Card
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileTextOutlined style={{ color: '#c00000' }} />
          <span style={{ fontWeight: 'bold', color: '#c00000' }}>
            {campusName}{year}年度祈福司计划信息表
          </span>
          <Tag color={DATA_TYPE_COLORS[dataType] || 'default'}>
            {dataType}
          </Tag>
        </div>
      }
      extra={
        <Space>
          <Button
            icon={<SyncOutlined />}
            onClick={loadData}
            loading={loading}
            disabled={saving}
          >
            刷新
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSave}
            loading={saving}
            disabled={!hasChanges || loading}
          >
            保存
          </Button>
        </Space>
      }
      bodyStyle={{ padding: '8px 12px' }}
    >
      <Spin spinning={loading}>
        {rows.length > 0 ? (
          <Table
            columns={columns as any}
            dataSource={rows}
            pagination={false}
            bordered
            size="small"
            scroll={{ x: 1800 }}
            rowKey="key"
          />
        ) : (
          <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
            {loading ? '加载中...' : '暂无咨询师数据，请先在系统中配置该神殿的咨询师'}
          </div>
        )}
      </Spin>
      <style>{`
        .ant-table-thead > tr > th {
          background-color: #fce4d6 !important;
          text-align: center !important;
          font-weight: bold !important;
          border: 1px solid #d0d0d0 !important;
          padding: 2px 4px !important;
          font-size: 11px !important;
        }
        .ant-table-tbody > tr > td {
          border: 1px solid #d0d0d0 !important;
          padding: 2px 4px !important;
          font-size: 11px !important;
        }
        .ant-input-number {
          font-size: 11px !important;
        }
        .ant-input-number-input {
          padding: 0 4px !important;
          height: 22px !important;
          text-align: right !important;
        }
        .ant-table-row:last-child > td {
          background-color: #fff2cc !important;
        }
      `}</style>
    </Card>
  )
}
