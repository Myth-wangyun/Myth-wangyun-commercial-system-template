/**
 * 神殿教化司经理、副经理功能分析表组件
 */

import React from 'react'
import { App, Card, Table, Button, Space, Statistic, Row, Col, InputNumber } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { ReloadOutlined, DownloadOutlined, EditOutlined, SaveOutlined } from '@ant-design/icons'
import type {
  CampusManagerAnalysisTableProps,
  CampusManagerAnalysisRecord,
  CampusManagerAnalysisSummary,
} from '@/types/campus-manager-analysis'
import { campusManagerAnalysisService } from '@/services/teaching-quality/campusManagerAnalysis'

const CampusManagerAnalysisTable: React.FC<CampusManagerAnalysisTableProps> = ({
  campus,
  data,
  loading,
  onRefresh,
  onEdit,
}) => {
  const { message } = App.useApp()
  // 表格内编辑：month===13 为合计行，不允许编辑
  const isSummaryRow = (record: CampusManagerAnalysisRecord) => record.month === 13

  const clampScore = (v: any) => {
    const n = Number(v)
    if (Number.isNaN(n)) return 0
    return Math.max(0, Math.min(100, n))
  }

  const calcTotalScore = (r: CampusManagerAnalysisRecord) => {
    const items = [
      r.ideology?.values ?? 0,
      r.ideology?.responsibility ?? 0,
      r.ideology?.execution ?? 0,
      r.management?.planning ?? 0,
      r.management?.organization ?? 0,
      r.management?.leadership ?? 0,
      r.management?.control ?? 0,
      r.businessCapability?.studentEmployment ?? 0,
      r.businessCapability?.reputationEnrollment ?? 0,
      r.businessCapability?.studentAttrition ?? 0,
      r.businessCapability?.furtherEducation ?? 0,
      r.businessCapability?.academicManagement ?? 0,
      r.businessCapability?.dormitoryManagement ?? 0,
    ]
    return items.reduce((s, v) => s + clampScore(v), 0)
  }

  // 单元格编辑：仅修改本地显示，不自动保存；点击右上角“保存”按钮时统一保存
  const [draftMap, setDraftMap] = React.useState<Record<string, CampusManagerAnalysisRecord>>({})

  // 合并“草稿”到当前行（用于展示用户刚输入的值）
  const mergeDraft = React.useCallback(
    (record: CampusManagerAnalysisRecord) => {
      const d = draftMap[record.key]
      return d ? d : record
    },
    [draftMap],
  )

  const updateDraft = React.useCallback(
    (next: CampusManagerAnalysisRecord) => {
      if (!campus) return
      if (isSummaryRow(next)) return
      setDraftMap((prev) => ({ ...prev, [next.key]: next }))
    },
    [campus],
  )

  const buildEditableNumberCell = (
    getter: (r: CampusManagerAnalysisRecord) => number,
    patcher: (r: CampusManagerAnalysisRecord, v: number) => CampusManagerAnalysisRecord,
  ) => {
    return (value: any, record: CampusManagerAnalysisRecord) => {
      if (isSummaryRow(record)) return <span style={{ fontWeight: 'bold' }}>{value ?? 0}</span>

      const current = mergeDraft(record)

      return (
        <InputNumber
          min={0}
          max={100}
          value={getter(current) ?? 0}
          style={{ width: 70 }}
          onChange={(v) => {
            const nextVal = clampScore(v)
            const next = patcher(current, nextVal)
            next.totalScore = calcTotalScore(next)
            updateDraft(next)
          }}
        />
      )
    }
  }

  const [summary, setSummary] = React.useState<CampusManagerAnalysisSummary | null>(null)
  const [saving, setSaving] = React.useState(false)

  // 获取汇总统计数据
  React.useEffect(() => {
    if (campus && data.length > 0) {
      campusManagerAnalysisService.getCampusManagerAnalysisSummary(campus).then(setSummary)
    }
  }, [campus, data])

  const handleSaveAll = async () => {
    if (!campus) {
      message.warning('请先选择神殿')
      return
    }
    try {
      setSaving(true)
      // 使用单条更新接口，而不是批量覆盖
      const year = new Date().getFullYear()
      for (const record of data) {
        // 跳过合计行（month === 13）
        if (record.month === 13) continue

        const payload = draftMap[record.key] ?? record

        await campusManagerAnalysisService.updateCampusManagerAnalysisData({
          campus,
          month: payload.month,
          data: payload,
          year,
        })
      }
      message.success('已保存到后端')
      setDraftMap({})
      onRefresh?.()
    } catch (e) {
      message.error('保存失败')
    } finally {
      setSaving(false)
    }
  }

  const handleExport = async () => {
    if (!campus) {
      message.warning('请先选择神殿')
      return
    }

    try {
      const blob = await campusManagerAnalysisService.exportCampusManagerAnalysisData(campus)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${campus}神殿教化司经理、副经理功能分析表.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      message.success('导出成功')
    } catch (error) {
      message.error('导出失败')
    }
  }

  // 表格展示：用草稿覆盖原数据（仅影响展示，不写回 props.data）
  const viewData = React.useMemo(() => {
    if (!data || data.length === 0) return []
    return data.map((r) => (draftMap[r.key] ? draftMap[r.key] : r))
  }, [data, draftMap])

  const columns: ColumnsType<CampusManagerAnalysisRecord> = [
    {
      title: '月份',
      dataIndex: 'month',
      key: 'month',
      width: 80,
      fixed: 'left',
      render: (value, _record, index) => {
        // 最后一行显示"合计"
        if (index === viewData.length - 1) {
          return <span style={{ color: 'red', fontWeight: 'bold' }}>合计</span>
        }
        return value
      },
    },
    // 神殿列已通过神殿选择器实现，此处隐藏
    // {
    //   title: '神殿',
    //   dataIndex: 'campus',
    //   key: 'campus',
    //   width: 120,
    //   fixed: 'left',
    //   render: (value, record, index) => {
    //     // 只有第一行显示神殿名称，其他行和合计行不显示
    //     if (index === 0) {
    //       return value;
    //     }
    //     return '';
    //   },
    // },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 100,
      fixed: 'left',
      render: (value, record, index) => {
        // 合计行不显示姓名
        if (index === viewData.length - 1) {
          return ''
        }
        // 调试：打印姓名信息
        if (index < 3) {
          console.log(`[表格渲染] 月份${record.month}的姓名:`, {
            value,
            value类型: typeof value,
            record_name: record.name,
            record_name类型: typeof record.name,
            完整record: record,
          })
        }
        // 确保返回字符串，即使为空也要显示
        const nameValue = String(value || record.name || '').trim()
        return nameValue || '-'
      },
    },
    {
      title: '思想',
      children: [
        {
          title: '价值观',
          dataIndex: ['ideology', 'values'],
          key: 'ideology.values',
          width: 80,
          render: buildEditableNumberCell(
            (r) => r.ideology.values,
            (r, v) => ({ ...r, ideology: { ...r.ideology, values: v } }),
          ),
        },
        {
          title: '责任感',
          dataIndex: ['ideology', 'responsibility'],
          key: 'ideology.responsibility',
          width: 80,
          render: buildEditableNumberCell(
            (r) => r.ideology.responsibility,
            (r, v) => ({ ...r, ideology: { ...r.ideology, responsibility: v } }),
          ),
        },
        {
          title: '执行力',
          dataIndex: ['ideology', 'execution'],
          key: 'ideology.execution',
          width: 80,
          render: buildEditableNumberCell(
            (r) => r.ideology.execution,
            (r, v) => ({ ...r, ideology: { ...r.ideology, execution: v } }),
          ),
        },
      ],
    },
    {
      title: '管理',
      children: [
        {
          title: '计划',
          dataIndex: ['management', 'planning'],
          key: 'management.planning',
          width: 80,
          render: buildEditableNumberCell(
            (r) => r.management.planning,
            (r, v) => ({ ...r, management: { ...r.management, planning: v } }),
          ),
        },
        {
          title: '组织',
          dataIndex: ['management', 'organization'],
          key: 'management.organization',
          width: 80,
          render: buildEditableNumberCell(
            (r) => r.management.organization,
            (r, v) => ({ ...r, management: { ...r.management, organization: v } }),
          ),
        },
        {
          title: '领导',
          dataIndex: ['management', 'leadership'],
          key: 'management.leadership',
          width: 80,
          render: buildEditableNumberCell(
            (r) => r.management.leadership,
            (r, v) => ({ ...r, management: { ...r.management, leadership: v } }),
          ),
        },
        {
          title: '控制',
          dataIndex: ['management', 'control'],
          key: 'management.control',
          width: 80,
          render: buildEditableNumberCell(
            (r) => r.management.control,
            (r, v) => ({ ...r, management: { ...r.management, control: v } }),
          ),
        },
      ],
    },
    {
      title: '业务能力',
      children: [
        {
          title: '学员就业',
          dataIndex: ['businessCapability', 'studentEmployment'],
          key: 'businessCapability.studentEmployment',
          width: 90,
          render: buildEditableNumberCell(
            (r) => r.businessCapability.studentEmployment,
            (r, v) => ({ ...r, businessCapability: { ...r.businessCapability, studentEmployment: v } }),
          ),
        },
        {
          title: '口碑招生',
          dataIndex: ['businessCapability', 'reputationEnrollment'],
          key: 'businessCapability.reputationEnrollment',
          width: 90,
          render: buildEditableNumberCell(
            (r) => r.businessCapability.reputationEnrollment,
            (r, v) => ({ ...r, businessCapability: { ...r.businessCapability, reputationEnrollment: v } }),
          ),
        },
        {
          title: '学员流失',
          dataIndex: ['businessCapability', 'studentAttrition'],
          key: 'businessCapability.studentAttrition',
          width: 90,
          render: buildEditableNumberCell(
            (r) => r.businessCapability.studentAttrition,
            (r, v) => ({ ...r, businessCapability: { ...r.businessCapability, studentAttrition: v } }),
          ),
        },
        {
          title: '升学',
          dataIndex: ['businessCapability', 'furtherEducation'],
          key: 'businessCapability.furtherEducation',
          width: 80,
          render: buildEditableNumberCell(
            (r) => r.businessCapability.furtherEducation,
            (r, v) => ({ ...r, businessCapability: { ...r.businessCapability, furtherEducation: v } }),
          ),
        },
        {
          title: '教务管理能力',
          dataIndex: ['businessCapability', 'academicManagement'],
          key: 'businessCapability.academicManagement',
          width: 120,
          render: buildEditableNumberCell(
            (r) => r.businessCapability.academicManagement,
            (r, v) => ({ ...r, businessCapability: { ...r.businessCapability, academicManagement: v } }),
          ),
        },
        {
          title: '宿舍管理能力',
          dataIndex: ['businessCapability', 'dormitoryManagement'],
          key: 'businessCapability.dormitoryManagement',
          width: 120,
          render: buildEditableNumberCell(
            (r) => r.businessCapability.dormitoryManagement,
            (r, v) => ({ ...r, businessCapability: { ...r.businessCapability, dormitoryManagement: v } }),
          ),
        },
      ],
    },
    {
      title: '平均分',
      dataIndex: 'totalScore',
      key: 'totalScoreAvg',
      width: 110,
      fixed: 'right',
      render: (_value, record, index) => {
        // 合计行显示“合计平均分”（封顶 100 分）
        if (index === viewData.length - 1) {
          const rows = viewData.slice(0, -1)
          // 合计行要展示“平均分”（每条记录的平均得分），而不是把所有打分项混在一起平均。
          // 规则：先算每条记录 12 个打分项的平均值，再对所有记录取平均；最终封顶 100 分。
          const perRecordAvg = (r: CampusManagerAnalysisRecord) => {
            const items = [
              r.ideology?.values ?? 0,
              r.ideology?.responsibility ?? 0,
              r.ideology?.execution ?? 0,
              r.management?.planning ?? 0,
              r.management?.organization ?? 0,
              r.management?.leadership ?? 0,
              r.management?.control ?? 0,
              r.businessCapability?.studentEmployment ?? 0,
              r.businessCapability?.reputationEnrollment ?? 0,
              r.businessCapability?.studentAttrition ?? 0,
              r.businessCapability?.furtherEducation ?? 0,
              r.businessCapability?.academicManagement ?? 0,
              r.businessCapability?.dormitoryManagement ?? 0,
            ]
            // 这里按“平均分”理解：对 13 个评分项求平均（0-100）
            const avg = items.reduce((s, v) => s + v, 0) / items.length
            return Math.min(100, avg)
          }

          const avg =
            rows.length === 0
              ? 0
              : rows.reduce((sum, item) => sum + perRecordAvg(item), 0) / rows.length

          return <span style={{ fontWeight: 'bold' }}>{Math.min(100, avg).toFixed(1)}</span>
        }
        // 非合计行显示“平均分”：13 项评分取平均（最终封顶 100）
        const items = [
          record.ideology?.values ?? 0,
          record.ideology?.responsibility ?? 0,
          record.ideology?.execution ?? 0,
          record.management?.planning ?? 0,
          record.management?.organization ?? 0,
          record.management?.leadership ?? 0,
          record.management?.control ?? 0,
          record.businessCapability?.studentEmployment ?? 0,
          record.businessCapability?.reputationEnrollment ?? 0,
          record.businessCapability?.studentAttrition ?? 0,
          record.businessCapability?.furtherEducation ?? 0,
          record.businessCapability?.academicManagement ?? 0,
          record.businessCapability?.dormitoryManagement ?? 0,
        ]
        const avg = items.reduce((s, v) => s + v, 0) / items.length
        return Math.min(100, avg).toFixed(1)
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right',
      render: (_unused, record, index) => {
        // 合计行不显示操作按钮
        if (index === viewData.length - 1) {
          return ''
        }
        return (
          <Button type="link" icon={<EditOutlined />} onClick={() => onEdit(record)} size="small">
            编辑
          </Button>
        )
      },
    },
  ]

  return (
    <div>
      {/* 关键统计指标 */}
      {summary && (
        <Card style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={6}>
              <Statistic title="平均分" value={Math.min(100, summary.averageScore)} precision={1} suffix="分" />
            </Col>
            <Col span={6}>
              <Statistic title="总合计分数" value={summary.totalScore} suffix="分" />
            </Col>
            <Col span={6}>
              <Statistic
                title="思想维度总分"
                value={summary.totalValues + summary.totalResponsibility + summary.totalExecution}
                suffix="分"
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="管理维度总分"
                value={
                  summary.totalPlanning +
                  summary.totalOrganization +
                  summary.totalLeadership +
                  summary.totalControl
                }
                suffix="分"
              />
            </Col>
          </Row>
          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={6}>
              <Statistic
                title="业务能力总分"
                value={
                  summary.totalStudentEmployment +
                  summary.totalReputationEnrollment +
                  summary.totalStudentAttrition +
                  summary.totalFurtherEducation +
                  summary.totalAcademicManagement +
                  summary.totalDormitoryManagement
                }
                suffix="分"
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="已完成记录"
                value={`${summary.completedRecords}/${summary.totalRecords}`}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="最高分项"
                value="教务管理能力"
                suffix={`${summary.totalAcademicManagement}分`}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="最低分项"
                value="学员流失"
                suffix={`${summary.totalStudentAttrition}分`}
              />
            </Col>
          </Row>
        </Card>
      )}

      {/* 数据表格 */}
      <Card
        title={`${campus || '请选择神殿'}教化司经理、副经理功能分析表`}
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={onRefresh} loading={loading}>
              刷新
            </Button>
            <Button
              icon={<SaveOutlined />}
              type="primary"
              onClick={handleSaveAll}
              loading={saving}
              disabled={!campus || data.length === 0}
            >
              保存
            </Button>
            <Button
              icon={<DownloadOutlined />}
              onClick={handleExport}
              disabled={!campus || data.length === 0}
            >
              导出
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={viewData}
          loading={loading}
          pagination={false}
          bordered
          scroll={{ x: 'max-content' }}
          rowKey="key"
          size="small"
        />
      </Card>
    </div>
  )
}

export default CampusManagerAnalysisTable
