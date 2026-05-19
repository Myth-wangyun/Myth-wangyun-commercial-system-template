/**
 * 班主任KPI计划表（单表展示）
 */

import React, { useMemo, useState } from 'react'
import { App, Card, Table, Button, Space, Select, InputNumber, Switch } from 'antd'
import { ReloadOutlined, DownloadOutlined, TrophyOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useCampusStore } from '@/stores/campusStore'

const { Option } = Select

// 员工KPI计划记录接口
interface EmployeeKpiPlanRecord {
  key: string
  name: string // 姓名
  projectIndicator: string // 项目指标：业务指标、管理指标
  kpiIndicator: string // KPI指标：就业管理、口碑、学生回款、学员流失率、学历管理
  kpiName: string // KPI指标名称
  calculationRule: string // 计算细则
  dataSource: string // 数据来源、考核
  weight: number // 权重
  projectDescription: string // 项目描述
  selfScore: number // 自我打分
  supervisorScore: number // 上级领导打分
  kpiValue?: number // KPI值（页面展示时会根据 权重(%) * 得分 / 100 自动计算）
  remarks: string // 备注
  rowType?: 'data' | 'total' // 行类型
}

const TeacherKpiPage: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus, getAllCampuses, setCampus } = useCampusStore()
  const campuses = getAllCampuses()
  const [selectedCampus, setSelectedCampus] = useState<string>(currentCampus || '')
  const [isEditMode, setIsEditMode] = useState<boolean>(true) // 编辑模式/展示模式切换

  // 计算KPI值：权重(%) * 得分 / 100
  const calculateKpiValue = (weightPercent: number, score: number): number => {
    const w = Number.isFinite(weightPercent) ? weightPercent : 0
    const s = Number.isFinite(score) ? score : 0
    return (w * s) / 100
  }

  // 创建班主任KPI数据（单表数据）
  const createTeacherKpiData = (): EmployeeKpiPlanRecord[] => {
    const data: EmployeeKpiPlanRecord[] = [
      // 口碑
      {
        key: 't1',
        name: '马晓娟',
        projectIndicator: '',
        kpiIndicator: '口碑',
        kpiName: '部门实际口碑人数',
        calculationRule: '部门实际口碑人数/部门目标人数*10',
        dataSource: '神藏司',
        weight: 20.0,
        projectDescription: '',
        selfScore: 0,
        supervisorScore: 0,

        remarks: '',
        rowType: 'data',
      },
      {
        key: 't2',
        name: '',
        projectIndicator: '',
        kpiIndicator: '口碑',
        kpiName: '部门实际口碑回款',
        calculationRule: '部门实际口碑回款/部门目标口碑回款*10',
        dataSource: '神藏司',
        weight: 0,
        projectDescription: '',
        selfScore: 0,
        supervisorScore: 0,
        remarks: '',
        rowType: 'data',
      },
      {
        key: 't3',
        name: '',
        projectIndicator: '',
        kpiIndicator: '口碑',
        kpiName: '部门实际口碑量',
        calculationRule: '部门实际口碑量/目标口碑量*10',
        dataSource: '神藏司',
        weight: 0,
        projectDescription: '',
        selfScore: 0,
        supervisorScore: 0,
        remarks: '',
        rowType: 'data',
      },
      // 学员流失率
      {
        key: 't4',
        name: '',
        projectIndicator: '',
        kpiIndicator: '学员流失率',
        kpiName: '学员流失率',
        calculationRule: '10-所带学员流失数',
        dataSource: '中心校长、神藏司',
        weight: 0,
        projectDescription: '',
        selfScore: 0,
        supervisorScore: 0,
        remarks: '',
        rowType: 'data',
      },
      // 学生回款
      {
        key: 't5',
        name: '',
        projectIndicator: '',
        kpiIndicator: '学生回款',
        kpiName: '学费回款',
        calculationRule: '学费回款：学校入学（住宿）欠费学生实际收款/欠费生应收回款（校长/教质负责人出数据）',
        dataSource: '神藏司',
        weight: 20.0,
        projectDescription: '',
        selfScore: 0,
        supervisorScore: 0,
        remarks: '',
        rowType: 'data',
      },
      {
        key: 't6',
        name: '',
        projectIndicator: '',
        kpiIndicator: '学生回款',
        kpiName: '宿舍费收支准确',
        calculationRule: '宿舍费实际收款/宿舍费应收*10',
        dataSource: '神藏司',
        weight: 0,
        projectDescription: '',
        selfScore: 0,
        supervisorScore: 0,
        remarks: '',
        rowType: 'data',
      },
      // 日常管理
      {
        key: 't7',
        name: '',
        projectIndicator: '',
        kpiIndicator: '日常管理',
        kpiName: '神殿学生出勤率',
        calculationRule: '神殿学生出勤率（95%及以上10分，85%及以上8.5分，80%及以上，8分，80%以下0分）',
        dataSource: '教质副经理',
        weight: 20.0,
        projectDescription: '',
        selfScore: 0,
        supervisorScore: 0,
        kpiValue: calculateKpiValue(0, 0),
        remarks: '班主任提供准确出勤数据，次数、出勤率，准时准确，数据呈现',
        rowType: 'data',
      },
      {
        key: 't8',
        name: '',
        projectIndicator: '',
        kpiIndicator: '日常管理',
        kpiName: '教室卫生评价',
        calculationRule: '教室卫生评价（优：10分，良8.5分，可：6、差：0）',
        dataSource: '中心校长',
        weight: 0,
        projectDescription: '',
        selfScore: 0,
        supervisorScore: 0,
        remarks: '',
        rowType: 'data',
      },
      {
        key: 't9',
        name: '',
        projectIndicator: '',
        kpiIndicator: '日常管理',
        kpiName: '宿舍管理',
        calculationRule: '晚上点名、卫生检督等',
        dataSource: '教质副经理',
        weight: 0,
        projectDescription: '',
        selfScore: 0,
        supervisorScore: 0,
        remarks: '',
        rowType: 'data',
      },
      {
        key: 't10',
        name: '',
        projectIndicator: '',
        kpiIndicator: '日常管理',
        kpiName: '违规监督',
        calculationRule: '违规监督：（班主任填写违规记录表天数/15）*10满分最高10分',
        dataSource: '教质副经理',
        weight: 20.0,
        projectDescription: '',
        selfScore: 0,
        supervisorScore: 0,
        kpiValue: calculateKpiValue(0, 0),
        remarks: '班主任提交数据准时准确，否则最终数据分数减半；数据呈现',
        rowType: 'data',
      },
      {
        key: 't11',
        name: '',
        projectIndicator: '',
        kpiIndicator: '日常管理',
        kpiName: '学生访谈率',
        calculationRule: '学生访谈率100%，有记录',
        dataSource: '教质副经理',
        weight: 0,
        projectDescription: '',
        selfScore: 0,
        supervisorScore: 0,
        kpiValue: calculateKpiValue(0, 0),
        remarks: '数据呈现',
        rowType: 'data',
      },
      // 学生档案完整率
      {
        key: 't12',
        name: '',
        projectIndicator: '',
        kpiIndicator: '学生档案完整率',
        kpiName: '学生档案完整率',
        calculationRule: '10*（纸质+电子档案）完整数量/（全校人数（新开班、合班、分班后档案人数等）*2）',
        dataSource: '中心校长',
        weight: 0,
        projectDescription: '',
        selfScore: 0,
        supervisorScore: 0,
        remarks: '',
        rowType: 'data',
      },
      // 投诉
      {
        key: 't13',
        name: '',
        projectIndicator: '',
        kpiIndicator: '投诉',
        kpiName: '投诉',
        calculationRule: '无入学在校生投诉或入学生投诉能妥善解决',
        dataSource: '教质副经理',
        weight: 10.0,
        projectDescription: '',
        selfScore: 0,
        supervisorScore: 0,
        kpiValue: calculateKpiValue(0, 0),
        remarks: '所负责的班级',
        rowType: 'data',
      },
      // 岗位胜任度
      {
        key: 't14',
        name: '',
        projectIndicator: '',
        kpiIndicator: '岗位胜任度',
        kpiName: '岗位胜任度',
        calculationRule: '上级领导评价(工作有责任感,执行力强、服从性高)',
        dataSource: '教质副经理',
        weight: 10.0,
        projectDescription: '',
        selfScore: 0,
        supervisorScore: 0,
        remarks: '',
        rowType: 'data',
      },
    ]
    return data
  }

  const [dataSource1, setDataSource1] = useState<EmployeeKpiPlanRecord[]>(createTeacherKpiData)

  // 过滤后的数据源（展示模式下过滤掉权重为0的行）
  const filteredDataSource = useMemo(() => {
    if (isEditMode) {
      return dataSource1
    }
    return dataSource1.filter((row) => row.weight > 0)
  }, [dataSource1, isEditMode])

  // 总KPI值（合计）：只统计数据行
  const totalKpiValue = useMemo(() => {
    return filteredDataSource.reduce((sum, row) => {
      if (row.rowType === 'data') {
        return sum + calculateKpiValue(row.weight, row.supervisorScore)
      }
      return sum
    }, 0)
  }, [filteredDataSource])

  // 表格最终展示数据：数据行 + 总计行
  const tableData = useMemo(() => {
    return [
      ...filteredDataSource,
      {
        key: 'total',
        name: '总计',
        projectIndicator: '',
        kpiIndicator: '',
        kpiName: '',
        calculationRule: '',
        dataSource: '',
        weight: 0,
        projectDescription: '',
        selfScore: 0,
        supervisorScore: 0,
        kpiValue: totalKpiValue,
        remarks: '',
        rowType: 'total' as const,
      },
    ]
  }, [filteredDataSource, totalKpiValue])

  // 更新某一行的权重/得分（用于自动计算KPI值）
  const updateRow = (key: string, patch: Partial<EmployeeKpiPlanRecord>) => {
    setDataSource1((prev) =>
      prev.map((row) => (row.key === key ? { ...row, ...patch } : row))
    )
  }

  // 使用 useMemo 预计算合并单元格信息，避免渲染时重复计算
  const cellMergeInfo = useMemo(() => {
    const dataRows = filteredDataSource.filter((item) => item.rowType === 'data')
    const nameRowSpanMap = new Map<string, number>()
    const kpiIndicatorRowSpanMap = new Map<string, number>()

    // 计算姓名列的 rowSpan（所有数据行合并为一个单元格）
    if (dataRows.length > 0) {
      // 只有第一行显示姓名，其他行 rowSpan 为 0
      nameRowSpanMap.set(dataRows[0].key, dataRows.length)
      for (let i = 1; i < dataRows.length; i++) {
        nameRowSpanMap.set(dataRows[i].key, 0)
      }
    }

    // 计算 KPI 指标列的 rowSpan（相同 KPI 指标的连续行合并）
    let i = 0
    while (i < dataRows.length) {
      const currentKpi = dataRows[i].kpiIndicator
      let count = 1
      // 计算相同 KPI 指标的连续行数
      for (let j = i + 1; j < dataRows.length; j++) {
        if (dataRows[j].kpiIndicator === currentKpi && dataRows[j].kpiIndicator !== '') {
          count++
        } else {
          break
        }
      }
      // 第一行设置 rowSpan，后续行设置为 0
      if (currentKpi !== '') {
        kpiIndicatorRowSpanMap.set(dataRows[i].key, count)
        for (let k = 1; k < count; k++) {
          kpiIndicatorRowSpanMap.set(dataRows[i + k].key, 0)
        }
      } else {
        // 如果 KPI 指标为空，不合并
        kpiIndicatorRowSpanMap.set(dataRows[i].key, 1)
      }
      i += count
    }

    return { nameRowSpanMap, kpiIndicatorRowSpanMap, dataRowCount: dataRows.length }
  }, [filteredDataSource])

  // 获取姓名列的 rowSpan
  const getNameRowSpan = (record: EmployeeKpiPlanRecord): number => {
    if (record.rowType === 'total') return 1
    return cellMergeInfo.nameRowSpanMap.get(record.key) ?? 1
  }

  // 获取 KPI 指标列的 rowSpan
  const getKpiIndicatorRowSpan = (record: EmployeeKpiPlanRecord): number => {
    if (record.rowType === 'total') return 1
    return cellMergeInfo.kpiIndicatorRowSpanMap.get(record.key) ?? 1
  }

  // 表头样式（黄色背景）
  const headerCellStyle: React.CSSProperties = {
    backgroundColor: '#fffacd',
    fontWeight: 'bold',
    textAlign: 'center',
  }

  // 单表列定义 - 使用 useMemo 确保在模式切换时重新创建
  const columns1: ColumnsType<EmployeeKpiPlanRecord> = useMemo(() => [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 100,
      align: 'center',
      fixed: 'left',
      onCell: (record) => {
        const rowSpan = getNameRowSpan(record)
        return { rowSpan }
      },
      render: (value, record) => {
        // rowSpan 为 0 时不渲染内容（由上面的单元格合并显示）
        if (getNameRowSpan(record) === 0) return null
        return value || ''
      },
    },
    {
      title: 'KPI指标',
      dataIndex: 'kpiIndicator',
      key: 'kpiIndicator',
      width: 150,
      align: 'left',
      onCell: (record) => {
        const rowSpan = getKpiIndicatorRowSpan(record)
        return { rowSpan }
      },
      render: (value, record) => {
        // rowSpan 为 0 时不渲染内容（由上面的单元格合并显示）
        if (getKpiIndicatorRowSpan(record) === 0) return null
        return value
      },
    },
    {
      title: '计算细则',
      dataIndex: 'calculationRule',
      key: 'calculationRule',
      width: 520,
      align: 'left',
      render: (value) => (
        <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {value}
        </div>
      ),
    },
    {
      title: '数据来源、考核',
      dataIndex: 'dataSource',
      key: 'dataSource',
      width: 150,
      align: 'center',
      render: (value) => value,
    },
    {
      title: '权重(%)',
      dataIndex: 'weight',
      key: 'weight',
      width: 120,
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'total') return ''
        if (isEditMode) {
          return (
            <InputNumber
              value={value}
              min={0}
              max={100}
              precision={1}
              style={{ width: '100%' }}
              addonAfter="%"
              onChange={(v) => updateRow(record.key, { weight: Number(v ?? 0) })}
            />
          )
        }
        return `${value}%`
      },
    },
    {
      title: '得分',
      dataIndex: 'supervisorScore',
      key: 'score',
      width: 120,
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'total') return ''
        if (isEditMode) {
          return (
            <InputNumber
              value={value}
              min={0}
              max={10}
              step={0.1}
              precision={1}
              style={{ width: '100%' }}
              onChange={(v) =>
                updateRow(record.key, { supervisorScore: Number(v ?? 0) })
              }
            />
          )
        }
        return value
      },
    },
    {
      title: 'KPI值',
      key: 'kpiValue',
      width: 100,
      align: 'center',
      render: (_, record) => {
        const value = calculateKpiValue(record.weight, record.supervisorScore)
        return Number.isFinite(value) ? value.toFixed(2) : '0.00'
      },
    },
    {
      title: '备注',
      dataIndex: 'remarks',
      key: 'remarks',
      width: 300,
      align: 'left',
      render: (value) => value || '',
    },
  ], [isEditMode, cellMergeInfo])

  // 刷新数据
  const handleRefresh = () => {
    message.success('数据已刷新')
  }

  // 导出数据
  const handleExport = () => {
    message.info('导出功能开发中...')
  }

  // 神殿选择变化
  const handleCampusChange = (value: string) => {
    setSelectedCampus(value)
    setCampus(value)
  }

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          marginBottom: 24,
          textAlign: 'center',
          fontSize: '20px',
          fontWeight: 'bold',
          padding: '16px',
          backgroundColor: '#fff1f0',
          borderRadius: 4,
          border: '1px solid #ffccc7',
        }}
      >
        <TrophyOutlined style={{ marginRight: 8 }} />
        {selectedCampus || currentCampus || '神殿'}教化司班主任KPI计划表
      </div>

      <Card>
        {/* 操作栏 */}
        <div
          style={{
            marginBottom: 16,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Space>
            <span>神殿：</span>
            <Select
              value={selectedCampus}
              onChange={handleCampusChange}
              style={{ width: 200 }}
              placeholder="请选择神殿"
            >
              {campuses.map((campus) => (
                <Option key={campus.name} value={campus.name}>
                  {campus.name}
                </Option>
              ))}
            </Select>
          </Space>
          <Space>
            <Space>
              <span>{isEditMode ? <EditOutlined /> : <EyeOutlined />}</span>
              <span>{isEditMode ? '编辑模式' : '展示模式'}</span>
              <Switch
                checked={isEditMode}
                onChange={(checked) => setIsEditMode(checked)}
                checkedChildren="编辑"
                unCheckedChildren="展示"
              />
            </Space>
            <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
              刷新
            </Button>
            <Button icon={<DownloadOutlined />} onClick={handleExport}>
              导出
            </Button>
          </Space>
        </div>

        {/* 单个表格 */}
        <Table
          key={isEditMode ? 'edit' : 'view'}
          columns={columns1}
          dataSource={tableData}
          pagination={false}
          scroll={{ x: 'max-content', y: 600 }}
          bordered
          size="small"
          rowKey="key"
          components={{
            header: {
              cell: (props: any) => {
                const mergedProps = {
                  ...props,
                  style: {
                    ...props.style,
                    ...headerCellStyle,
                  },
                }
                return <th {...mergedProps} />
              },
            },
          }}
        />

        <style>{`
          .ant-table-thead > tr > th {
            background-color: #fffacd !important;
            font-weight: bold;
            text-align: center;
          }
          .ant-table-thead > tr:first-child > th {
            background-color: #fffacd !important;
          }
          .ant-table-tbody > tr > td:first-child {
            position: sticky !important;
            top: 55px !important;
            background-color: #fff !important;
            z-index: 1 !important;
          }
          .ant-table-cell-fix-left {
            z-index: 2 !important;
          }
        `}</style>
      </Card>
    </div>
  )
}

export default TeacherKpiPage
