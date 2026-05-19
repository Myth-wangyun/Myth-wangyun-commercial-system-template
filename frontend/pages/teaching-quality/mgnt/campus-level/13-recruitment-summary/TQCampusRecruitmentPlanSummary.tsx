/**
 * 教学质量模块 - 神殿教化司招聘计划与总结汇总表（月度统计）
 * 固定7行：
 * 1. 计划招聘岗位名称
 * 2. 计划招聘人数
 * 3. 实际招聘岗位名称
 * 4. 实际招聘人数
 * 5. 入职者姓名
 * 6. 离职人数
 * 7. 离职者姓名
 * 列：序号、内容、1月...12月、合计
 *
 * 需求：
 * - 填写数据时，直接在表格部分填写（单元格可编辑）。
 * - 在表格上方设置一个“保存”按钮：不要每个格都保存一次，而是统一保存。
 */

import React, { useEffect, useMemo, useState } from 'react'
import { App, Card, Form, Row, Col, Space, Button, Table, Spin, Input, InputNumber } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { ReloadOutlined, SaveOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

import {
  fetchRecruitmentList,
  createRecruitment,
  updateRecruitment,
} from '@/services/TQCampusRecruitmentPlanSummary'
import type { RecruitmentPlanData } from '@/services/TQCampusRecruitmentPlanSummary'
import { useCampusStore } from '@/stores/campusStore'

// 表格行数据接口（固定7行，列为动态的月份和合计）
interface RecruitmentTableRow {
  key: string
  序号: number
  内容: string
  [key: string]: any
}

const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

type RowKey = 'r1' | 'r2' | 'r3' | 'r4' | 'r5' | 'r6' | 'r7'

type EditMap = Record<number, Partial<RecruitmentPlanData>>

type MonthIdMap = Record<number, number | undefined>

const rowKeyToField: Record<RowKey, keyof RecruitmentPlanData> = {
  r1: '岗位名称', // 计划招聘岗位名称 -> 岗位名称
  r2: '计划招聘人数',
  r3: '实际招聘岗位名称',
  r4: '实际招聘人数',
  r5: '入职者姓名',
  r6: '离职人数',
  r7: '离职者姓名',
}

const numericRowKeys = new Set<RowKey>(['r2', 'r4', 'r6'])

function monthStrToNum(monthStr: string): number {
  const m = monthStr.replace('月', '')
  return Number(m)
}

function makeMonthStartISO(monthNum: number): string {
  // 用当年；如需按筛选年份可在后续扩展
  const year = dayjs().year()
  return dayjs(`${year}-${String(monthNum).padStart(2, '0')}-01`).format('YYYY-MM-DD')
}

const TQCampusRecruitmentPlanSummary: React.FC = () => {
  const { message } = App.useApp()
  const campusStore = useCampusStore()

  const [selectedCampus, setSelectedCampus] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [savingAll, setSavingAll] = useState(false)

  const [rawData, setRawData] = useState<RecruitmentPlanData[]>([])
  const [monthIdMap, setMonthIdMap] = useState<MonthIdMap>({})

  // 统一编辑缓存（按月份存）
  const [pendingEdits, setPendingEdits] = useState<EditMap>({})

  const [tableData, setTableData] = useState<RecruitmentTableRow[]>([
    { key: 'r1', 序号: 1, 内容: '计划招聘岗位名称' },
    { key: 'r2', 序号: 2, 内容: '计划招聘人数' },
    { key: 'r3', 序号: 3, 内容: '实际招聘岗位名称' },
    { key: 'r4', 序号: 4, 内容: '实际招聘人数' },
    { key: 'r5', 序号: 5, 内容: '入职者姓名' },
    { key: 'r6', 序号: 6, 内容: '离职人数' },
    { key: 'r7', 序号: 7, 内容: '离职者姓名' },
  ])

  const campusNorm = useMemo(
    () => (selectedCampus || campusStore.currentCampus || '').replace(/神殿$/, '').trim(),
    [selectedCampus, campusStore.currentCampus]
  )

  const loadData = async () => {
    try {
      setLoading(true)
      const list = await fetchRecruitmentList(campusNorm ? { campus: campusNorm } : undefined)
      setRawData(list)
      buildMonthlyTable(list)
      buildMonthIdMap(list)
      // 刷新后清空未保存编辑，避免对不上最新数据
      setPendingEdits({})
    } catch (e) {
      console.error(e)
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  const buildMonthIdMap = (list: RecruitmentPlanData[]) => {
    const map: MonthIdMap = {}
    months.forEach((m, idx) => {
      const monthNum = idx + 1
      const found = list.find(it => {
        const base = it.计划招聘时间 || it.实际招聘时间
        if (!base) return false
        return new Date(base as any).getMonth() + 1 === monthNum
      })
      map[monthNum] = found?.id
    })
    setMonthIdMap(map)
  }

  const buildMonthlyTable = (list: RecruitmentPlanData[]) => {
    const rows: RecruitmentTableRow[] = [
      { key: 'r1', 序号: 1, 内容: '计划招聘岗位名称' },
      { key: 'r2', 序号: 2, 内容: '计划招聘人数' },
      { key: 'r3', 序号: 3, 内容: '实际招聘岗位名称' },
      { key: 'r4', 序号: 4, 内容: '实际招聘人数' },
      { key: 'r5', 序号: 5, 内容: '入职者姓名' },
      { key: 'r6', 序号: 6, 内容: '离职人数' },
      { key: 'r7', 序号: 7, 内容: '离职者姓名' },
    ]

    const uniq = (arr: (string | undefined)[]) => Array.from(new Set(arr.filter(Boolean))) as string[]

    // 从备注中解析“实际岗位/入职/离职人数/离职者”
    const parseRemark = (remark?: string) => {
      const res: { actualPosition: string; joined: string; resignedCount: number; resigned: string } = {
        actualPosition: '',
        joined: '',
        resignedCount: 0,
        resigned: '',
      }
      if (!remark) return res
      const r = String(remark)
      const m1 = r.match(/实际岗位[:：]\s*([^；;]+)/)
      const m2 = r.match(/入职[:：]\s*([^；;]+)/)
      const m3 = r.match(/离职人数[:：]\s*(\d+)/)
      const m4 = r.match(/离职者[:：]\s*([^；;]+)/)
      if (m1) res.actualPosition = m1[1].trim()
      if (m2) res.joined = m2[1].trim()
      if (m3) res.resignedCount = Number(m3[1]) || 0
      if (m4) res.resigned = m4[1].trim()
      return res
    }

    months.forEach((m, idx) => {
      const monthNum = idx + 1

      // 计划（按计划招聘时间）
      const planned = list.filter(it => {
        if (!it.计划招聘时间) return false
        const mm = new Date(it.计划招聘时间 as any).getMonth() + 1
        return mm === monthNum
      })
      const plannedPositions = uniq(planned.map(it => it.岗位名称))
      const plannedCount = planned.reduce((s, it) => s + (it.计划招聘人数 || 0), 0)

      // 实际（优先实际招聘时间，缺失时回退计划时间）
      const actual = list.filter(it => {
        const base = it.实际招聘时间 || it.计划招聘时间
        if (!base) return false
        const mm = new Date(base as any).getMonth() + 1
        return mm === monthNum
      })
      const actualPositions = uniq(actual.map(it => (it.实际招聘岗位名称 || it.岗位名称) as string | undefined))
      const actualCount = actual.reduce((s, it) => s + (Number(it.实际招聘人数) || 0), 0)

      // 入/离职信息（优先读专用字段，兼容从备注解析）
      const joinedNames: string[] = []
      let resignedCount = 0
      const resignedNames: string[] = []
      actual.forEach(it => {
        const joined = (it as any).入职者姓名 as string | undefined
        const resignedN = (it as any).离职人数 as number | undefined
        const resigned = (it as any).离职者姓名 as string | undefined
        if (joined && joined.toString().trim()) joinedNames.push(joined)
        if (typeof resignedN === 'number') resignedCount += resignedN || 0
        if (resigned && resigned.toString().trim()) resignedNames.push(resigned)

        if ((!joined && !resigned && (resignedN === undefined || resignedN === null)) && (it as any).备注) {
          const p = parseRemark((it as any).备注)
          if (p.joined) joinedNames.push(p.joined)
          if (p.resigned) resignedNames.push(p.resigned)
          resignedCount += p.resignedCount || 0
        }
      })

      rows[0][m] = plannedPositions.join('、') || ''
      rows[1][m] = plannedCount || ''
      rows[2][m] = actualPositions.join('、') || ''
      rows[3][m] = actualCount || ''
      rows[4][m] = joinedNames.join('、') || ''
      rows[5][m] = resignedCount || ''
      rows[6][m] = resignedNames.join('、') || ''
    })

    // 合计（数值行）
    const sumRow = (rowIndex: number) => months.reduce((s, m) => s + (Number(rows[rowIndex][m]) || 0), 0)
    rows[1]['合计'] = sumRow(1) || ''
    rows[3]['合计'] = sumRow(3) || ''
    rows[5]['合计'] = sumRow(5) || ''

    setTableData(rows)
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCampus])

  const setCellDraft = (rowKey: RowKey, month: string, value: any) => {
    const monthNum = monthStrToNum(month)
    const field = rowKeyToField[rowKey]

    // 1) 更新 tableData 让用户立即看到变化
    setTableData(prev => {
      const next = prev.map(r => ({ ...r }))
      const idx = next.findIndex(r => r.key === rowKey)
      if (idx >= 0) next[idx][month] = value

      // 2) 重新计算合计（r2/r4/r6）
      const recomputeSum = (rk: RowKey) => {
        const rowIndex = next.findIndex(r => r.key === rk)
        if (rowIndex < 0) return
        const sum = months.reduce((s, m) => s + (Number(next[rowIndex][m]) || 0), 0)
        next[rowIndex]['合计'] = sum || ''
      }
      recomputeSum('r2')
      recomputeSum('r4')
      recomputeSum('r6')

      return next
    })

    // 2) 更新 pendingEdits
    setPendingEdits(prev => {
      const next: EditMap = { ...prev }
      const monthEdits = { ...(next[monthNum] || {}) }
      ;(monthEdits as any)[field] = numericRowKeys.has(rowKey) ? Number(value || 0) : value
      next[monthNum] = monthEdits
      return next
    })
  }

  const hasPending = useMemo(() => Object.keys(pendingEdits).length > 0, [pendingEdits])

  const saveAll = async () => {
    if (!campusNorm) {
      message.warning('请先选择/确认神殿')
      return
    }
    if (!hasPending) {
      message.info('没有需要保存的修改')
      return
    }

    try {
      setSavingAll(true)

      const monthNums = Object.keys(pendingEdits)
        .map(n => Number(n))
        .filter(n => n >= 1 && n <= 12)
        .sort((a, b) => a - b)

      // 逐月保存（同一月合并为一次请求）
      for (const monthNum of monthNums) {
        const patch = pendingEdits[monthNum] || {}
        const id = monthIdMap[monthNum]

        if (id) {
          await updateRecruitment(id, patch)
        } else {
          const planDate = makeMonthStartISO(monthNum)
          const payload: RecruitmentPlanData = {
            神殿: campusNorm,
            岗位名称: '',
            计划招聘人数: 0,
            计划招聘时间: planDate,
            实际招聘岗位名称: undefined,
            实际招聘人数: 0,
            入职者姓名: undefined,
            离职人数: undefined,
            离职者姓名: undefined,
            岗位类别: undefined,
            ...patch,
          }
          await createRecruitment(payload)
        }
      }

      message.success('保存成功')
      await loadData()
    } catch (e) {
      console.error(e)
      message.error('保存失败')
    } finally {
      setSavingAll(false)
    }
  }

  const renderCellInput = (row: RecruitmentTableRow, month: string) => {
    const rowKey = row.key as RowKey
    const val = row[month]
    const isNumber = numericRowKeys.has(rowKey)

    if (isNumber) {
      return (
        <InputNumber
          min={0}
          style={{ width: '100%' }}
          value={val === '' ? undefined : Number(val)}
          onChange={v => setCellDraft(rowKey, month, v ?? '')}
        />
      )
    }

    return <Input value={val} onChange={e => setCellDraft(rowKey, month, e.target.value)} />
  }

  const columns: ColumnsType<RecruitmentTableRow> = [
    { title: '序号', dataIndex: '序号', key: '序号', width: 60, align: 'center', fixed: 'left' },
    { title: '内容', dataIndex: '内容', key: '内容', width: 180, fixed: 'left' },
    ...months.map(m => ({
      title: m,
      dataIndex: m,
      key: m,
      width: 150,
      align: 'center' as const,
      onHeaderCell: () => ({ style: { background: '#e9f5d0', fontWeight: 600 } }),
      render: (_val: any, row: RecruitmentTableRow) => renderCellInput(row, m),
    })),
    {
      title: <span style={{ color: '#ff4d4f' }}>合计</span>,
      dataIndex: '合计',
      key: '合计',
      width: 90,
      align: 'center',
      fixed: 'right',
      onHeaderCell: () => ({ style: { background: '#fff5f5', fontWeight: 700 } }),
      render: (val: any) => <span style={{ color: '#ff7a45', fontWeight: 600 }}>{val || ''}</span>,
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <Card style={{ marginBottom: 24 }}>
        <Form layout="vertical">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={24} md={24} lg={24}>
              <Form.Item label=" ">
                <Space>
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={() => {
                      setSelectedCampus('')
                      loadData()
                    }}
                  >
                    刷新
                  </Button>

                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    onClick={saveAll}
                    loading={savingAll}
                    disabled={!hasPending || loading}
                  >
                    保存
                  </Button>

                  {hasPending ? <span style={{ color: '#faad14' }}>有未保存修改</span> : null}
                </Space>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      <Card>
        <Spin spinning={loading}>
          <div style={{ overflowX: 'auto' }}>
            <Table
              columns={columns}
              dataSource={tableData}
              rowKey="key"
              pagination={false}
              size="small"
              scroll={{ x: 2200 }}
              bordered
            />
          </div>
        </Spin>
      </Card>
    </div>
  )
}

export default TQCampusRecruitmentPlanSummary
