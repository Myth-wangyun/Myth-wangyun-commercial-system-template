/**
 * 神殿教化司培训计划与成绩明细表页面（前端本地版：未接入后端 API）
 *
 * 需求：
 * - 表格仅两列：培训人、成绩
 * - 最后一行显示本次培训平均分
 * - 培训人从配置中心班主任读取，支持一次添加多个（含“全部添加”）
 * - 优化“培训目标/主要内容/培训方式/负责人”等区域样式
 */

import React, { useEffect, useMemo, useState } from 'react'
import { App, Card, Table, Button, Space, Select, Input, DatePicker, Form, Row, Col, Tag } from 'antd'

import type { ColumnsType } from 'antd/es/table'
import { CalendarOutlined, PlusOutlined, DeleteOutlined, FileAddOutlined, EyeOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

import { useCampusStore } from '@/stores/campusStore'
import { fetchHomeroomTeachers, type HomeroomTeacherProfile } from '@/services/configMaster'
import { apiFetch, buildApiUrl } from '@/utils/apiBase'

const { Option } = Select
const { TextArea } = Input

interface ScoreRow {
  key: string
  trainee: string // 培训人
  examScore: number | null // 成绩
  rowType?: 'data' | 'avg'
}

const PASS_SCORE = 60

type TrainingSessionItemDTO = {
  场次名称: string
  开始日期: string
  结束日期: string
}

type TrainingPlanScoreDetailDTO = {
  神殿名称: string
  场次名称: string
  开始日期: string
  结束日期: string
  培训目标: string
  主要内容: string
  培训方式: string
  负责人: string
  成绩明细: Array<{ 培训人: string; 成绩: number | null }>
}

const CampusTQTrainingPlanScoreDetailPage: React.FC = () => {
  const { message } = App.useApp()
  const [isNewTrainingMode, setIsNewTrainingMode] = useState(false)
  const { currentCampus, getAllCampuses, setCampus } = useCampusStore()
  const campuses = getAllCampuses()

  const [selectedCampus, setSelectedCampus] = useState<string>(currentCampus || '')

  // 培训计划表单
  const [selectedSessionName, setSelectedSessionName] = useState<string>('')
  const [sessionList, setSessionList] = useState<TrainingSessionItemDTO[]>([])
  const [trainingDateRange, setTrainingDateRange] = useState<[string, string] | null>(null)
  const [trainingGoal, setTrainingGoal] = useState<string>('')
  const [mainContent, setMainContent] = useState<string>('')
  const [trainingMethod, setTrainingMethod] = useState<string>('')
  const [owner, setOwner] = useState<string>('')

  // 班主任列表（用于批量添加）
  const [teachers, setTeachers] = useState<HomeroomTeacherProfile[]>([])
  const [teachersLoading, setTeachersLoading] = useState(false)
  const [batchSelectedTeachers, setBatchSelectedTeachers] = useState<string[]>([])

  // 成绩明细：默认不预置空行（避免导入N人却出现N+1个输入框）
  const [rows, setRows] = useState<ScoreRow[]>([])

  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // 切换神殿时，重置批量选择
  useEffect(() => {
    setBatchSelectedTeachers([])
  }, [selectedCampus])

  const loadSessionList = async (campus: string) => {
    if (!campus) return
    try {
      const url = buildApiUrl(`/teaching-quality/training-plan-score-sessions?campus=${encodeURIComponent(campus)}`)
      const res = await apiFetch(url)
      if (!res.ok) throw new Error(await res.text())
      const list: TrainingSessionItemDTO[] = await res.json()
      setSessionList(list || [])

      // 如果当前没有选中场次，默认选最新一条
      if (!selectedSessionName && list && list.length > 0) {
        setSelectedSessionName(list[0].场次名称)
      }
    } catch (e) {
      console.error('加载场次列表失败:', e)
      setSessionList([])
    }
  }

  // 神殿变化时：加载场次列表
  useEffect(() => {
    if (selectedCampus) {
      loadSessionList(selectedCampus)
    } else {
      setSessionList([])
      setSelectedSessionName('')
    }
  }, [selectedCampus])

  // 当神殿+场次具备时自动加载
  useEffect(() => {
    if (selectedCampus && selectedSessionName) {
      loadData(selectedCampus, selectedSessionName)
    }
  }, [selectedCampus, selectedSessionName])

  // 加载数据
  const loadData = async (campus: string, sessionName: string) => {
    if (!campus || !sessionName) return

    setIsLoading(true)
    try {
      const url = buildApiUrl(
        `/teaching-quality/training-plan-score-detail?campus=${encodeURIComponent(campus)}&session_name=${encodeURIComponent(sessionName)}`
      )
      const res = await apiFetch(url)
      if (!res.ok) throw new Error(await res.text())
      const data: TrainingPlanScoreDetailDTO = await res.json()

      setIsNewTrainingMode(false)
      setSelectedSessionName(data.场次名称 || sessionName)
      setTrainingDateRange(data.开始日期 && data.结束日期 ? [data.开始日期, data.结束日期] : null)

      // 更新表单
      setTrainingGoal(data.培训目标 || '')
      setMainContent(data.主要内容 || '')
      setTrainingMethod(data.培训方式 || '')
      setOwner(data.负责人 || '')

      // 更新成绩明细
      if (data.成绩明细?.length > 0) {
        setRows(
          data.成绩明细.map((item, idx) => ({
            key: String(idx + 1),
            trainee: item.培训人 || '',
            examScore: item.成绩,
            rowType: 'data' as const,
          }))
        )
      } else {
        setRows([{ key: '1', trainee: '', examScore: null, rowType: 'data' }])
      }
    } catch (e) {
      console.error('加载数据失败:', e)
      message.error('加载数据失败')
    } finally {
      setIsLoading(false)
    }
  }

  // 新建培训：清空表单并进入“新建”状态。
  // 场次名称由后端在保存时按“开始日期所在月份”自动生成：X月第N次。
  // 同时：按钮点击后要求“场次名称下拉里应有数据”，因此这里会刷新场次列表。
  const resetForNewSession = async () => {
    if (!selectedCampus) {
      message.warning('请先选择神殿')
      return
    }

    // 默认日期：今天（用户可再改范围）
    const today = dayjs().format('YYYY-MM-DD')

    // 进入新建：不预填场次名称，让后端生成
    setIsNewTrainingMode(true)
    setSelectedSessionName('')
    setTrainingDateRange([today, today])
    setTrainingGoal('')
    setMainContent('')
    setTrainingMethod('')
    setOwner('')
    setRows([])
    setBatchSelectedTeachers([])

    // 刷新场次列表（确保“场次名称”下拉有最新数据）
    await loadSessionList(selectedCampus)

    message.info('已进入“新建培训”模式：请填写培训信息并保存（保存后系统自动生成本月场次名称）')
  }

  // 保存数据
  const saveData = async () => {
    if (!selectedCampus) {
      message.warning('请选择神殿')
      return
    }
    if (!trainingDateRange || !trainingDateRange[0] || !trainingDateRange[1]) {
      message.warning('请选择培训日期范围')
      return
    }

    setIsSaving(true)
    try {
      const payload: any = {
        神殿名称: selectedCampus,
        // 兼容旧接口（需要“日期”）与新接口（开始/结束日期 + 场次）
        日期: trainingDateRange[0],
        // 新建培训时允许不传场次名称，由后端按开始日期自动生成：X月第N次
        场次名称: (selectedSessionName || '').trim(),
        开始日期: trainingDateRange[0],
        结束日期: trainingDateRange[1],
        培训目标: trainingGoal,
        主要内容: mainContent,
        培训方式: trainingMethod,
        负责人: owner,
        成绩明细: dataRows.map((row) => ({
          培训人: row.trainee,
          成绩: row.examScore,
        })),
      }

      const url = buildApiUrl('/teaching-quality/training-plan-score-detail')
      const res = await apiFetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error(await res.text())

      const saved: TrainingPlanScoreDetailDTO = await res.json()
      message.success(`保存成功：${saved.场次名称}`)

      // 保存后：回填场次名称 + 重新加载场次列表（确保左侧可选最新场次）
      setIsNewTrainingMode(false)
      setSelectedSessionName(saved.场次名称)
      await loadSessionList(selectedCampus)
    } catch (e) {
      console.error('保存失败:', e)
      message.error('保存失败: ' + (e instanceof Error ? e.message : String(e)))
    } finally {
      setIsSaving(false)
    }
  }

  // 拉取班主任
  useEffect(() => {
    const load = async () => {
      if (!selectedCampus) {
        setTeachers([])
        return
      }
      setTeachersLoading(true)
      try {
        const data = await fetchHomeroomTeachers({ campus_name: selectedCampus, active: true })
        setTeachers(data || [])
      } catch (e) {
        console.error(e)
        setTeachers([])
      } finally {
        setTeachersLoading(false)
      }
    }
    load()
  }, [selectedCampus])

  const stats = useMemo(() => {
    const validScores = rows
      .filter((r) => r.rowType !== 'avg')
      .map((r) => (typeof r.examScore === 'number' && Number.isFinite(r.examScore) ? r.examScore : null))
      .filter((v): v is number => v !== null)

    const traineeCount = rows.filter((r) => r.rowType !== 'avg' && (r.trainee || '').trim()).length
    const totalWithScore = validScores.length
    const passed = validScores.filter((s) => s >= PASS_SCORE).length
    const passRate = totalWithScore > 0 ? ((passed / totalWithScore) * 100).toFixed(2) : '0.00'
    const avgScore = totalWithScore > 0 ? (validScores.reduce((a, b) => a + b, 0) / totalWithScore).toFixed(2) : '0.00'

    return { traineeCount, totalWithScore, passed, passRate, avgScore }
  }, [rows])

  const dataRows = useMemo(() => 
    rows.filter((r) => r.rowType !== 'avg' && (r.trainee || '').trim())
  , [rows])

  const tableData = useMemo<ScoreRow[]>(() => {
    const avgRow: ScoreRow = {
      key: 'avg-row',
      trainee: '平均分（本次培训）',
      examScore: Number(stats.avgScore),
      rowType: 'avg',
    }
    
    // If no data rows, only show average row (no empty input rows)
    if (dataRows.length === 0) {
      return [avgRow]
    }

    return [...dataRows, avgRow]
  }, [dataRows, stats.avgScore])

  const addEmptyRow = () => {
    const newKey = String(Date.now())
    setRows((prev) => [...prev, { key: newKey, trainee: '', examScore: null, rowType: 'data' }])
  }

  // 确保至少有一行可编辑
  useEffect(() => {
    if (rows.length === 0) {
      addEmptyRow()
    }
  }, [rows])

  const ensureUniqueAndAddTeachers = (names: string[]) => {
    const clean = Array.from(new Set(names.map((n) => (n || '').trim()).filter(Boolean)))
    if (clean.length === 0) {
      message.warning('请选择要添加的培训人')
      return
    }

    const existing = new Set(rows.filter((r) => r.rowType !== 'avg').map((r) => (r.trainee || '').trim()).filter(Boolean))
    const toAdd = clean.filter((n) => !existing.has(n))

    if (toAdd.length === 0) {
      message.info('所选培训人已全部在表格中')
      return
    }

    setRows((prev) => {
      const next = prev.filter((r) => r.rowType !== 'avg')
      const appended: ScoreRow[] = toAdd.map((name) => ({
        key: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        trainee: name,
        examScore: null,
        rowType: 'data',
      }))
      return [...next, ...appended]
    })

    message.success(`已添加 ${toAdd.length} 人`) 
  }

  const columns: ColumnsType<ScoreRow> = [
    {
      title: '培训人',
      dataIndex: 'trainee',
      key: 'trainee',
      width: 260,
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'avg') {
          return <span style={{ fontWeight: 700 }}>{record.trainee}</span>
        }
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span>{value || ''}</span>
            {value ? <Tag color="blue">班主任</Tag> : null}
          </span>
        )
      },
    },
    {
      title: '成绩',
      dataIndex: 'examScore',
      key: 'examScore',
      width: 180,
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'avg') {
          return <span style={{ fontWeight: 700 }}>{stats.avgScore}</span>
        }
        return (
          <Input
            value={value === null ? '' : String(value)}
            placeholder="请输入分数"
            onChange={(e) => {
              const raw = e.target.value.trim()
              setRows((prev) => {
                const next = prev.slice()
                const idx = next.findIndex((x) => x.key === record.key)
                if (idx === -1) return prev
                if (raw === '') {
                  next[idx] = { ...next[idx], examScore: null }
                  return next
                }
                const num = Number(raw)
                next[idx] = { ...next[idx], examScore: Number.isFinite(num) ? num : null }
                return next
              })
            }}
          />
        )
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      align: 'center',
      render: (_, record) => {
        if (record.rowType === 'avg') return null
        return (
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => {
              setRows((prev) => {
                const next = prev.filter((r) => r.key !== record.key && r.rowType !== 'avg')
                return next.length ? next : [{ key: '1', trainee: '', examScore: null, rowType: 'data' }]
              })
            }}
          >
            删除
          </Button>
        )
      },
    },
  ]

  const headerCellStyle: React.CSSProperties = {
    backgroundColor: '#d4edda',
    fontWeight: 'bold',
    textAlign: 'center',
  }

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          marginBottom: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 20,
          fontWeight: 700,
          padding: 16,
          backgroundColor: isNewTrainingMode ? '#f6ffed' : '#fff1f0',
          borderRadius: 6,
          border: isNewTrainingMode ? '1px solid #b7eb8f' : '1px solid #ffccc7',
        }}
      >
        <div style={{ flex: 1, textAlign: 'center' }}>
          <CalendarOutlined style={{ marginRight: 8 }} />
          教化司培训计划与成绩明细表
          <Tag
            color={isNewTrainingMode ? 'green' : 'volcano'}
            style={{ marginLeft: 12, fontSize: 14, fontWeight: 600 }}
          >
            {isNewTrainingMode ? '新建录入模式' : '查看/编辑模式'}
          </Tag>
        </div>
        <div style={{ marginLeft: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          {isNewTrainingMode ? (
            <Button
              icon={<EyeOutlined />}
              onClick={() => {
                if (!selectedCampus) return
                const fallback = sessionList?.[0]?.场次名称
                if (!fallback) {
                  message.warning('暂无可查看的历史场次')
                  return
                }
                setIsNewTrainingMode(false)
                setSelectedSessionName(fallback)
              }}
              disabled={!selectedCampus}
            >
              返回查看
            </Button>
          ) : null}

          <Button
            icon={<FileAddOutlined />}
            type={isNewTrainingMode ? 'default' : 'primary'}
            onClick={resetForNewSession}
            disabled={!selectedCampus}
          >
            {isNewTrainingMode ? '继续新建' : '新建培训'}
          </Button>
        </div>
      </div>

      {/* 培训计划 */}
      <Card title="培训计划" style={{ marginBottom: 16 }} loading={isLoading}>
        <Form layout="vertical">
          <Row gutter={16}>
            <Col xs={24} md={6}>
              <Form.Item label="神殿">
                <Select
                  value={selectedCampus}
                  onChange={(v) => {
                    setSelectedCampus(v)
                    setCampus(v)
                  }}
                  placeholder="请选择神殿"
                >
                  {campuses.map((campus) => (
                    <Option key={campus.name} value={campus.name}>
                      {campus.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item label="场次名称">
                <Select
                  value={selectedSessionName || undefined}
                  onChange={(v) => setSelectedSessionName(v)}
                  placeholder={
                    !selectedCampus
                      ? '请先选择神殿'
                      : isNewTrainingMode
                        ? '将自动生成(保存后)'
                        : '请选择场次'
                  }
                  disabled={!selectedCampus}
                  options={sessionList.map((s) => ({
                    label: `${s.场次名称}（${s.开始日期}~${s.结束日期}）`,
                    value: s.场次名称,
                  }))}
                  allowClear
                  showSearch
                  optionFilterProp="label"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="培训日期（范围）">
                <DatePicker.RangePicker
                  value={
                    trainingDateRange
                      ? [dayjs(trainingDateRange[0]), dayjs(trainingDateRange[1])]
                      : null
                  }
                  onChange={(arr) => {
                    if (!arr || !arr[0] || !arr[1]) {
                      setTrainingDateRange(null)
                      return
                    }
                    setTrainingDateRange([arr[0].format('YYYY-MM-DD'), arr[1].format('YYYY-MM-DD')])
                  }}
                  format="YYYY-MM-DD"
                  placeholder={["开始日期", "结束日期"]}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="负责人">
                <Input value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="请输入负责人" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="培训方式">
                <Input value={trainingMethod} onChange={(e) => setTrainingMethod(e.target.value)} placeholder="请输入培训方式" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="培训目标">
                <TextArea
                  value={trainingGoal}
                  onChange={(e) => setTrainingGoal(e.target.value)}
                  autoSize={{ minRows: 2, maxRows: 4 }}
                  placeholder="请输入培训目标"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="主要内容">
            <TextArea
              value={mainContent}
              onChange={(e) => setMainContent(e.target.value)}
              autoSize={{ minRows: 3, maxRows: 8 }}
              placeholder="请输入主要内容"
            />
          </Form.Item>
        </Form>
      </Card>

      {/* 成绩明细 */}
      <Card title="成绩明细" loading={isLoading}>
        <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Space wrap>
            <Select
              mode="multiple"
              value={batchSelectedTeachers}
              onChange={setBatchSelectedTeachers}
              style={{ width: 420 }}
              placeholder={selectedCampus ? '选择要添加的培训人（班主任）' : '请先选择神殿'}
              disabled={!selectedCampus}
              loading={teachersLoading}
              optionFilterProp="label"
              options={teachers.map((t) => ({ label: t.name, value: t.name }))}
            />
            <Button
              onClick={() => {
                ensureUniqueAndAddTeachers(batchSelectedTeachers)
              }}
              disabled={!selectedCampus}
            >
              添加
            </Button>
            <Button
              onClick={() => {
                ensureUniqueAndAddTeachers(teachers.map((t) => t.name))
              }}
              disabled={!selectedCampus || teachersLoading || teachers.length === 0}
            >
              全部添加
            </Button>
          </Space>

          <Space>
            <Button icon={<PlusOutlined />} type="primary" onClick={addEmptyRow}>
              新增空行
            </Button>
            <Button type="primary" loading={isSaving} onClick={saveData}>保存</Button>
          </Space>
        </div>

        <div style={{ marginBottom: 12, color: '#666' }}>
          <span style={{ marginRight: 16 }}>培训人数：<b>{stats.traineeCount}</b></span>
          <span style={{ marginRight: 16 }}>已录入成绩：<b>{stats.totalWithScore}</b></span>
          <span style={{ marginRight: 16 }}>合格人数(≥{PASS_SCORE})：<b>{stats.passed}</b></span>
          <span>合格率：<b>{stats.passRate}%</b></span>
        </div>

        <Table
          columns={columns}
          dataSource={tableData}
          pagination={false}
          bordered
          size="small"
          rowKey="key"
          scroll={{ x: 'max-content' }}
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
          rowClassName={(record) => (record.rowType === 'avg' ? 'avg-row' : '')}
        />

        <style>{`
          .ant-table-thead > tr > th {
            background-color: #d4edda !important;
            font-weight: bold;
            text-align: center;
          }
          .avg-row td {
            background: #fafafa !important;
            font-weight: 700;
          }
        `}</style>
      </Card>
    </div>
  )
}

export default CampusTQTrainingPlanScoreDetailPage
