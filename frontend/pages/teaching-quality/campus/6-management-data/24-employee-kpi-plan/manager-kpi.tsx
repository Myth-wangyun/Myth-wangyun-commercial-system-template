/**
 * 教质经理KPI计划表
 */

import React, { useState, useMemo } from 'react'
import { App, Card, Table, Button, Space, Select, Modal, Input, InputNumber } from 'antd'
import { ReloadOutlined, DownloadOutlined, TrophyOutlined, PlusOutlined } from '@ant-design/icons'
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
  kpiValue: number // KPI值
  remarks: string // 备注
  rowType?: 'data' | 'total' // 行类型
}

const ManagerKpiPage: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus, getAllCampuses, setCampus } = useCampusStore()
  const campuses = getAllCampuses()
  const [selectedCampus, setSelectedCampus] = useState<string>(currentCampus || '')

  // 创建初始化数据函数
  // 说明：你可以在这里自由新增“项目指标(projectIndicator)”与其下的“KPI指标(kpiIndicator)”行。
  // 规则：同一个 projectIndicator 需要在表格里连续放置，rowSpan 才会自动合并显示；kpiIndicator 同理。
  const createInitialData = (): EmployeeKpiPlanRecord[] => {
    const data: EmployeeKpiPlanRecord[] = [
      // 业务指标 - 就业管理
      {
        key: '1',
        name: '',
        projectIndicator: '业务指标',
        kpiIndicator: '就业管理',
        kpiName: '学生就业率(人数)',
        calculationRule: '10*实际就业学生数/目标就业学生数',
        dataSource: '校长/教质经理',
        weight: 15.0,
        projectDescription: '',
        selfScore: 0,
        supervisorScore: 9.66,
        kpiValue: 0,
        remarks: 'S32106+S32107班，目标就业29人。实际28人',
        rowType: 'data',
      },
      {
        key: '2',
        name: '',
        projectIndicator: '业务指标',
        kpiIndicator: '就业管理',
        kpiName: '学生就业薪资(以回访为准)',
        calculationRule: '10*实际平均就业薪资/目标就业薪资',
        dataSource: '总部',
        weight: 15.0,
        projectDescription: '',
        selfScore: 0,
        supervisorScore: 10,
        kpiValue: 0,
        remarks: 'S32106+S32107班，目标薪资6300元。实际平均薪资6520.65元',
        rowType: 'data',
      },
      // 业务指标 - 口碑
      {
        key: '3',
        name: '',
        projectIndicator: '业务指标',
        kpiIndicator: '口碑',
        kpiName: '部门实际口碑人数',
        calculationRule: '部门实际口碑人数/部门目标人数*10',
        dataSource: '神藏司',
        weight: 20.0,
        projectDescription: '',
        selfScore: 0,
        supervisorScore: 0,
        kpiValue: 0,
        remarks: '',
        rowType: 'data',
      },
      {
        key: '4',
        name: '',
        projectIndicator: '业务指标',
        kpiIndicator: '口碑',
        kpiName: '部门实际口碑回款',
        calculationRule: '部门实际口碑回款/部门目标口碑回款*10',
        dataSource: '神藏司',
        weight: 10.0,
        projectDescription: '',
        selfScore: 0,
        supervisorScore: 0,
        kpiValue: 0,
        remarks: '',
        rowType: 'data',
      },
      // 业务指标 - 学生回款
      {
        key: '5',
        name: '',
        projectIndicator: '业务指标',
        kpiIndicator: '学生回款',
        kpiName: '学费回款',
        calculationRule: '学校入学(住宿)欠费学生实际收款/欠费生应收回款(校长出数据)',
        dataSource: '神藏司',
        weight: 10.0,
        projectDescription: '',
        selfScore: 0,
        supervisorScore: 0,
        kpiValue: 0,
        remarks: '',
        rowType: 'data',
      },
      // 管理指标 - 学员流失率
      {
        key: '6',
        name: '',
        projectIndicator: '管理指标',
        kpiIndicator: '学员流失率',
        kpiName: '学员流失率',
        calculationRule: '<1-流失人数(新生+退费老生)/本月入学人数>*10',
        dataSource: '中心校长、神藏司',
        weight: 10.0,
        projectDescription: '',
        selfScore: 0,
        supervisorScore: 0,
        kpiValue: 0,
        remarks: '',
        rowType: 'data',
      },
      // 管理指标 - 学历管理
      {
        key: '7',
        name: '',
        projectIndicator: '管理指标',
        kpiIndicator: '学历管理',
        kpiName: '学历管理',
        calculationRule: '中专学籍资料完整，配合度高、妥善应对检查',
        dataSource: '总部',
        weight: 20.0,
        projectDescription: '',
        selfScore: 0,
        supervisorScore: 10,
        kpiValue: 0,
        remarks: '',
        rowType: 'data',
      },

      // ✅ 示例：新增一个“项目指标” = 质量指标（你可以改名/删掉/继续追加）
      {
        key: '8',
        name: '',
        projectIndicator: '质量指标',
        kpiIndicator: '教学质量',
        kpiName: '巡检整改闭环率',
        calculationRule: '闭环数/应闭环数*10（逾期未闭环按未闭环计）',
        dataSource: '教化司巡检记录/整改台账（教质经理）',
        weight: 0,
        projectDescription: '',
        selfScore: 0,
        supervisorScore: 0,
        kpiValue: 0,
        remarks: '',
        rowType: 'data',
      },
      {
        key: '9',
        name: '',
        projectIndicator: '质量指标',
        kpiIndicator: '教学质量',
        kpiName: '教案/课件合规率（抽检）',
        calculationRule: '合规课次/抽检课次*10（出现严重违规可按制度直接扣分/计0）',
        dataSource: '教研/教质抽检记录',
        weight: 0,
        projectDescription: '',
        selfScore: 0,
        supervisorScore: 0,
        kpiValue: 0,
        remarks: '',
        rowType: 'data',
      },

      // ✅ 示例：在“已有项目指标=管理指标”下面继续新增（注意要把这些行放在管理指标那一段里，保证连续，rowSpan 才会合并）
      // 如果你想把它们归到“管理指标”，可以把 projectIndicator 改成 '管理指标'
      {
        key: '10',
        name: '',
        projectIndicator: '管理指标',
        kpiIndicator: '师资管理',
        kpiName: '听评课完成率',
        calculationRule: '完成听评课次数/计划次数*10（不足部分按比例折算）',
        dataSource: '听评课记录/评分表',
        weight: 0,
        projectDescription: '',
        selfScore: 0,
        supervisorScore: 0,
        kpiValue: 0,
        remarks: '',
        rowType: 'data',
      },
      {
        key: '11',
        name: '',
        projectIndicator: '管理指标',
        kpiIndicator: '风险与合规',
        kpiName: '重大教学事故/重大投诉（扣分项）',
        calculationRule: '无重大事件=10分；每发生1次扣X分（按制度），重大事故可直接计0',
        dataSource: '客诉系统/事件记录（校长/教质经理）',
        weight: 0,
        projectDescription: '',
        selfScore: 0,
        supervisorScore: 0,
        kpiValue: 0,
        remarks: '',
        rowType: 'data',
      },
    ]
    return data
  }

  const [dataSource, setDataSource] = useState<EmployeeKpiPlanRecord[]>(createInitialData)

  // 新增KPI弹窗
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [newProjectIndicator, setNewProjectIndicator] = useState('')
  const [newKpiIndicator, setNewKpiIndicator] = useState('')
  const [newKpiName, setNewKpiName] = useState('')
  const [newCalculationRule, setNewCalculationRule] = useState('')
  const [newDataSource, setNewDataSource] = useState('')
  const [newWeight, setNewWeight] = useState<number | null>(null)

  const getNextKey = () => {
    const maxKey = dataSource.reduce((max, item) => {
      const n = Number(item.key)
      return Number.isFinite(n) ? Math.max(max, n) : max
    }, 0)
    return String(maxKey + 1)
  }

  const handleAddRow = () => {
    if (!newProjectIndicator.trim()) return message.warning('请输入项目指标')
    if (!newKpiIndicator.trim()) return message.warning('请输入KPI指标')
    if (!newKpiName.trim()) return message.warning('请输入KPI指标名称')
    if (!newCalculationRule.trim()) return message.warning('请输入计算细则')
    if (!newDataSource.trim()) return message.warning('请输入数据来源、考核')

    const newRow: EmployeeKpiPlanRecord = {
      key: getNextKey(),
      name: '',
      projectIndicator: newProjectIndicator.trim(),
      kpiIndicator: newKpiIndicator.trim(),
      kpiName: newKpiName.trim(),
      calculationRule: newCalculationRule.trim(),
      dataSource: newDataSource.trim(),
      weight: Number(newWeight ?? 0),
      projectDescription: '',
      selfScore: 0,
      supervisorScore: 0,
      kpiValue: 0,
      remarks: '',
      rowType: 'data',
    }

    // 关键：为了让rowSpan合并正确，把新增行插入到“同项目指标”区块的末尾；若不存在该项目指标则追加到末尾。
    const dataRows = dataSource.filter((item) => item.rowType === 'data')
    const lastIndexOfProject = (() => {
      let idx = -1
      dataRows.forEach((r, i) => {
        if (r.projectIndicator === newRow.projectIndicator) idx = i
      })
      return idx
    })()

    let next: EmployeeKpiPlanRecord[]
    if (lastIndexOfProject === -1) {
      next = [...dataSource, newRow]
    } else {
      // 找到原数组中对应 dataRows[lastIndexOfProject] 的位置
      const anchorKey = dataRows[lastIndexOfProject].key
      const insertAt = dataSource.findIndex((x) => x.key === anchorKey)
      next = [...dataSource]
      next.splice(insertAt + 1, 0, newRow)
    }

    setDataSource(next)
    setAddModalOpen(false)
    setNewProjectIndicator('')
    setNewKpiIndicator('')
    setNewKpiName('')
    setNewCalculationRule('')
    setNewDataSource('')
    setNewWeight(null)
    message.success('已新增一行KPI')
  }

  // 计算项目指标列的rowSpan
  const getProjectIndicatorRowSpan = (record: EmployeeKpiPlanRecord, index: number) => {
    const dataRows = dataSource.filter((item) => item.rowType === 'data')
    const currentIndex = dataRows.findIndex((item) => item.key === record.key)
    if (currentIndex === -1) return 0

    // 检查是否是同一项目指标的第一行
    if (currentIndex > 0) {
      const prevRecord = dataRows[currentIndex - 1]
      if (prevRecord.projectIndicator === record.projectIndicator) {
        return 0 // 不是第一行，不显示
      }
    }

    // 计算同一项目指标有多少行
    let sameProjectCount = 1
    for (let i = currentIndex + 1; i < dataRows.length; i++) {
      if (dataRows[i].projectIndicator === record.projectIndicator) {
        sameProjectCount++
      } else {
        break
      }
    }

    return sameProjectCount
  }

  // 计算KPI指标列的rowSpan
  const getKpiIndicatorRowSpan = (record: EmployeeKpiPlanRecord, index: number) => {
    const dataRows = dataSource.filter((item) => item.rowType === 'data')
    const currentIndex = dataRows.findIndex((item) => item.key === record.key)
    if (currentIndex === -1) return 0

    // 检查是否是同一KPI指标的第一行
    if (currentIndex > 0) {
      const prevRecord = dataRows[currentIndex - 1]
      if (prevRecord.kpiIndicator === record.kpiIndicator) {
        return 0 // 不是第一行，不显示
      }
    }

    // 计算同一KPI指标有多少行
    let sameKpiCount = 1
    for (let i = currentIndex + 1; i < dataRows.length; i++) {
      if (dataRows[i].kpiIndicator === record.kpiIndicator) {
        sameKpiCount++
      } else {
        break
      }
    }

    return sameKpiCount
  }

  // 表头样式（黄色背景）
  const headerCellStyle: React.CSSProperties = {
    backgroundColor: '#fffacd',
    fontWeight: 'bold',
    textAlign: 'center',
  }

  // 定义表格列
  const columns: ColumnsType<EmployeeKpiPlanRecord> = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 100,
      align: 'center',
      render: (value, record, index) => {
        const dataRows = dataSource.filter((item) => item.rowType === 'data')
        const currentIndex = dataRows.findIndex((item) => item.key === record.key)
        
        // 只在第一行显示输入框
        if (currentIndex === 0) {
          return (
            <input
              type="text"
              value={value || ''}
              onChange={(e) => {
                const newData = [...dataSource]
                // 更新所有行的姓名
                newData.forEach((item) => {
                  if (item.rowType === 'data') {
                    item.name = e.target.value
                  }
                })
                setDataSource(newData)
              }}
              style={{
                width: '100%',
                padding: '4px 8px',
                border: '1px solid #d9d9d9',
                borderRadius: '2px',
              }}
              placeholder="请输入姓名"
            />
          )
        }
        
        // 其他行不显示任何内容
        return ''
      },
    },
    {
      title: '项目指标',
      dataIndex: 'projectIndicator',
      key: 'projectIndicator',
      width: 120,
      align: 'center',
      render: (value, record, index) => {
        const rowSpan = getProjectIndicatorRowSpan(record, index)
        return {
          children: value,
          props: {
            rowSpan: rowSpan > 0 ? rowSpan : 0,
          },
        }
      },
    },
    {
      title: 'KPI指标',
      dataIndex: 'kpiIndicator',
      key: 'kpiIndicator',
      width: 150,
      align: 'left',
      render: (value, record, index) => {
        const rowSpan = getKpiIndicatorRowSpan(record, index)
        return {
          children: value,
          props: {
            rowSpan: rowSpan > 0 ? rowSpan : 0,
          },
        }
      },
    },
    {
      title: '计算细则',
      key: 'calculationRule',
      width: 450,
      align: 'left',
      render: (_, record) => {
        return (
          <div>
            <div style={{ fontWeight: 'bold', marginBottom: 4 }}>{record.kpiName}</div>
            <div>{record.calculationRule}</div>
          </div>
        )
      },
    },
    {
      title: '数据来源、考核',
      dataIndex: 'dataSource',
      key: 'dataSource',
      width: 180,
      align: 'center',
      render: (value, record) => (
        <div>
          <div>{value}</div>
          <div style={{ fontWeight: 'bold', marginTop: 4 }}>{record.weight > 0 ? `${record.weight}%` : ''}</div>
        </div>
      ),
    },
    {
      title: '权重',
      dataIndex: 'weight',
      key: 'weight',
      width: 80,
      align: 'center',
      render: (value) => (value > 0 ? `${value}%` : ''),
    },
    {
      title: '项目细节',
      dataIndex: 'projectDescription',
      key: 'projectDescription',
      width: 150,
      align: 'left',
      render: (value) => value || '',
    },
    {
      title: '自我打分',
      dataIndex: 'selfScore',
      key: 'selfScore',
      width: 100,
      align: 'center',
      render: (value) => value || '',
    },
    {
      title: '上级领导打分',
      dataIndex: 'supervisorScore',
      key: 'supervisorScore',
      width: 120,
      align: 'center',
      render: (value) => value || '',
    },
    {
      title: 'KPI值',
      dataIndex: 'kpiValue',
      key: 'kpiValue',
      width: 100,
      align: 'center',
      render: (value) => (value !== undefined && value !== null ? value.toFixed(2) : '0.00'),
    },
    {
      title: '备注',
      dataIndex: 'remarks',
      key: 'remarks',
      width: 300,
      align: 'left',
      render: (value) => value || '',
    },
  ]

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
        {selectedCampus || currentCampus || '神殿'}教化司教质经理KPI计划表
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
            <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
              刷新
            </Button>
            <Button icon={<DownloadOutlined />} onClick={handleExport}>
              导出
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddModalOpen(true)}>
              新增
            </Button>
          </Space>
        </div>

        {/* 表格 */}
        <Table
          columns={columns}
          dataSource={dataSource}
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
        `}</style>
      
      {/* 新增KPI */}
      <Modal
        title="新增KPI"
        open={addModalOpen}
        onCancel={() => setAddModalOpen(false)}
        onOk={handleAddRow}
        okText="确定"
        cancelText="取消"
      >
        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12, alignItems: 'center' }}>
          <div>项目指标</div>
          <Input value={newProjectIndicator} onChange={(e) => setNewProjectIndicator(e.target.value)} placeholder="如：业务指标/管理指标/质量指标" />

          <div>KPI指标</div>
          <Input value={newKpiIndicator} onChange={(e) => setNewKpiIndicator(e.target.value)} placeholder="如：就业管理/口碑/教学质量" />

          <div>KPI指标名称</div>
          <Input value={newKpiName} onChange={(e) => setNewKpiName(e.target.value)} placeholder="如：巡检整改闭环率" />

          <div>计算细则</div>
          <Input.TextArea
            value={newCalculationRule}
            onChange={(e) => setNewCalculationRule(e.target.value)}
            placeholder="请输入计算公式/评分规则"
            autoSize={{ minRows: 2, maxRows: 6 }}
          />

          <div>数据来源、考核</div>
          <Input value={newDataSource} onChange={(e) => setNewDataSource(e.target.value)} placeholder="如：教化司巡检记录/神藏司/总部" />

          <div>权重(%)</div>
          <InputNumber
            style={{ width: '100%' }}
            value={newWeight}
            onChange={(v) => setNewWeight(v)}
            min={0}
            max={100}
            placeholder="可选"
          />
        </div>
        <div style={{ marginTop: 12, color: '#888', fontSize: 12 }}>
          提示：为了让“项目指标/ KPI指标”单元格自动合并，请尽量让同一个项目指标的行连续。
        </div>
      </Modal>
      
      </Card>
    </div>
  )
}

export default ManagerKpiPage
