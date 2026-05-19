import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { App, Card, Table, Typography, InputNumber, Button, Space, Spin } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useCampusStore } from '@/stores/campusStore'
import { normalizeCampus } from '@/pages/academic/teaching-content/shared/campusStorage'
import CampusSelector from '@/components/common/CampusSelector'
import { buildApiUrl } from '@/utils/apiBase'

const { Title, Text } = Typography

type Category = '核心业务能力' | '一般业务能力' | '价值观'
type ScoreKey = `s${number}`

interface StaffFunctionRow {
  id: number
  category: Category
  functionItem: string
  detail: string
  fullScore: number
  s1: number
  s2: number
  s3: number
  s4: number
  s5: number
  s6: number
  s7: number
  s8: number
  s9: number
  [key: string]: number | string | Category
}

const generateScoreKeys = (count: number): ScoreKey[] =>
  Array.from({ length: Math.max(count, 9) }, (_, idx) => `s${idx + 1}` as ScoreKey)
const DEFAULT_SCORE_KEYS = generateScoreKeys(9)

const buildDefaultRows = (): StaffFunctionRow[] => [
  {
    id: 1,
    category: '核心业务能力',
    functionItem: '学员就业',
    detail: '就业率和就业薪资高。',
    fullScore: 15,
    s1: 0,
    s2: 0,
    s3: 0,
    s4: 0,
    s5: 0,
    s6: 0,
    s7: 0,
    s8: 0,
    s9: 0,
  },
  {
    id: 2,
    category: '核心业务能力',
    functionItem: '口碑招生',
    detail: '口碑招生和收入高。',
    fullScore: 10,
    s1: 0,
    s2: 0,
    s3: 0,
    s4: 0,
    s5: 0,
    s6: 0,
    s7: 0,
    s8: 0,
    s9: 0,
  },
  {
    id: 3,
    category: '核心业务能力',
    functionItem: '新生维稳',
    detail: '新生流失较少。',
    fullScore: 10,
    s1: 0,
    s2: 0,
    s3: 0,
    s4: 0,
    s5: 0,
    s6: 0,
    s7: 0,
    s8: 0,
    s9: 0,
  },
  {
    id: 4,
    category: '一般业务能力',
    functionItem: '技术能力',
    detail: '个人技术水平',
    fullScore: 10,
    s1: 0,
    s2: 0,
    s3: 0,
    s4: 0,
    s5: 0,
    s6: 0,
    s7: 0,
    s8: 0,
    s9: 0,
  },
  {
    id: 5,
    category: '一般业务能力',
    functionItem: '教学研发',
    detail: '网络调查、开发大纲、课件编写能力。',
    fullScore: 5,
    s1: 0,
    s2: 0,
    s3: 0,
    s4: 0,
    s5: 0,
    s6: 0,
    s7: 0,
    s8: 0,
    s9: 0,
  },
  {
    id: 6,
    category: '一般业务能力',
    functionItem: '教学实施',
    detail: '授课能力、积极辅导。',
    fullScore: 10,
    s1: 0,
    s2: 0,
    s3: 0,
    s4: 0,
    s5: 0,
    s6: 0,
    s7: 0,
    s8: 0,
    s9: 0,
  },
  {
    id: 7,
    category: '一般业务能力',
    functionItem: '教学测评',
    detail: '考试合格率、学员满意度等。',
    fullScore: 10,
    s1: 0,
    s2: 0,
    s3: 0,
    s4: 0,
    s5: 0,
    s6: 0,
    s7: 0,
    s8: 0,
    s9: 0,
  },
  {
    id: 8,
    category: '价值观',
    functionItem: '责任心',
    detail: '对待学生，对待工作有责任心。',
    fullScore: 5,
    s1: 0,
    s2: 0,
    s3: 0,
    s4: 0,
    s5: 0,
    s6: 0,
    s7: 0,
    s8: 0,
    s9: 0,
  },
  {
    id: 9,
    category: '价值观',
    functionItem: '执行力',
    detail: '能认真执行上级领导的各项安排。',
    fullScore: 5,
    s1: 0,
    s2: 0,
    s3: 0,
    s4: 0,
    s5: 0,
    s6: 0,
    s7: 0,
    s8: 0,
    s9: 0,
  },
  {
    id: 10,
    category: '价值观',
    functionItem: '任劳任怨',
    detail: '不辞辛苦，任劳任怨。',
    fullScore: 5,
    s1: 0,
    s2: 0,
    s3: 0,
    s4: 0,
    s5: 0,
    s6: 0,
    s7: 0,
    s8: 0,
    s9: 0,
  },
  {
    id: 11,
    category: '价值观',
    functionItem: '团队精神',
    detail: '有大局观，个人利益服从集体利益。',
    fullScore: 5,
    s1: 0,
    s2: 0,
    s3: 0,
    s4: 0,
    s5: 0,
    s6: 0,
    s7: 0,
    s8: 0,
    s9: 0,
  },
  {
    id: 12,
    category: '价值观',
    functionItem: '职业行为',
    detail: '工装、出勤、自律。',
    fullScore: 5,
    s1: 0,
    s2: 0,
    s3: 0,
    s4: 0,
    s5: 0,
    s6: 0,
    s7: 0,
    s8: 0,
    s9: 0,
  },
  {
    id: 13,
    category: '价值观',
    functionItem: '沟通能力',
    detail: '对上级、对同事、对学生',
    fullScore: 5,
    s1: 0,
    s2: 0,
    s3: 0,
    s4: 0,
    s5: 0,
    s6: 0,
    s7: 0,
    s8: 0,
    s9: 0,
  },
]

const computeCategoryRowSpan = (data: StaffFunctionRow[]) => {
  const spans: Record<number, number> = {}
  let index = 0
  while (index < data.length) {
    const category = data[index].category
    let count = 1
    for (let j = index + 1; j < data.length && data[j].category === category; j += 1) {
      count += 1
    }
    spans[data[index].id] = count
    for (let k = 1; k < count; k += 1) {
      spans[data[index + k].id] = 0
    }
    index += count
  }
  return spans
}

const StaffFunctionAnalysisTable: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus, getAllCampuses } = useCampusStore()
  const resolvedCampus = normalizeCampus(currentCampus ?? getAllCampuses()[0]?.name ?? '主神殿')
  const [year, setYear] = useState<number>(dayjs().year())
  const [rows, setRows] = useState<StaffFunctionRow[]>(buildDefaultRows)
  const [teacherNames, setTeacherNames] = useState<string[]>([])
  const [scoreKeys, setScoreKeys] = useState<ScoreKey[]>(DEFAULT_SCORE_KEYS)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const teacherNamesRef = React.useRef<string[]>([])
  const scoreKeysRef = React.useRef<ScoreKey[]>(DEFAULT_SCORE_KEYS)

  useEffect(() => {
    teacherNamesRef.current = teacherNames
  }, [teacherNames])

  useEffect(() => {
    scoreKeysRef.current = scoreKeys
  }, [scoreKeys])

  const ensureKeys = useCallback(
    (data: StaffFunctionRow[], keys: ScoreKey[]) =>
      data.map((row) => {
        const next: StaffFunctionRow = { ...row }
        keys.forEach((key) => {
          if (typeof next[key] !== 'number') next[key] = 0
        })
        return next
      }),
    [],
  )

  // 拉取教员列表并扩展列数（仅当前神殿）
  const loadTeachers = useCallback(async () => {
    try {
      // 只获取当前神殿的教员列表，不使用全局兜底
      const url = `${buildApiUrl('/config/teachers')}?campus_name=${encodeURIComponent(resolvedCampus)}&active=true`
      console.log('[员工功能分析] 请求教员列表，神殿:', resolvedCampus, 'URL:', url)
      const res = await fetch(url)
      if (!res.ok) {
        console.warn('[员工功能分析] 获取教员列表失败:', res.status, res.statusText)
        return
      }
      const data: { name?: string; campus_name?: string }[] = await res.json()
      
      // 双重过滤：确保只使用当前神殿的教员（防止后端返回所有教员）
      const names = data
        .filter((t) => {
          // 如果后端返回了campus_name，进行二次过滤
          if (t.campus_name && t.campus_name !== resolvedCampus) {
            return false
          }
          return true
        })
        .map((t) => (t.name || '').trim())
        .filter(Boolean)

      console.log(`[员工功能分析] 神殿 ${resolvedCampus} 的教员数量:`, names.length, '教员列表:', names)

      if (!names.length) {
        message.warning(`神殿 ${resolvedCampus} 未获取到教员列表，列名暂用默认"姓名1/2/3..."`)
      }

      const keys = generateScoreKeys(names.length || scoreKeys.length || DEFAULT_SCORE_KEYS.length)
      setTeacherNames(names)
      setScoreKeys(keys)
      setRows((prev) => ensureKeys(prev, keys))
    } catch (error) {
      console.error('[员工功能分析] 加载教员列表失败:', error)
    }
  }, [ensureKeys, resolvedCampus])

  const totals = useMemo(() => {
    const sumScores = (key: ScoreKey) => rows.reduce((acc, row) => acc + Number(row[key] ?? 0), 0)
    return {
      full: rows.reduce((acc, row) => acc + row.fullScore, 0),
      scores: scoreKeys.map((key) => sumScores(key)),
    }
  }, [rows, scoreKeys])

  const categoryRowSpanMap = useMemo(() => computeCategoryRowSpan(rows), [rows])

  const handleScoreChange = (id: number, key: ScoreKey, value: number | null) => {
    setRows((prev) =>
      prev.map((row) =>
        row.id === id
          ? {
              ...row,
              [key]: Math.max(0, Math.min(row.fullScore, Number(value ?? 0))),
            }
          : row,
      ),
    )
  }

  const handleReset = () => {
    const base = buildDefaultRows()
    setRows(
      base.map((row) => {
        const next: StaffFunctionRow = { ...row }
        scoreKeys.forEach((key) => {
          next[key] = 0
        })
        return next
      }),
    )
    message.success('表格已重置')
  }

  const evaluatorLabels = useMemo(
    () => scoreKeys.map((_, idx) => teacherNames[idx] || `姓名${idx + 1}`),
    [teacherNames, scoreKeys],
  )

  const fetchRemote = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(
        buildApiUrl(`/staff-function-analysis?campus=${encodeURIComponent(resolvedCampus)}&year=${year}`),
      )
      if (res.ok) {
        const list = await res.json()
        if (Array.isArray(list) && list.length) {
          const record = list[0]
          const data = record?.['数据'] || {}
          
          // 优先使用映射关系恢复教员列表（新数据）
          let finalTeachers: string[] = []
          if (data.evaluatorMapping && typeof data.evaluatorMapping === 'object') {
            // 根据映射关系按 scoreKeys 顺序恢复教员列表
            const mapping = data.evaluatorMapping
            const sortedKeys = Object.keys(mapping)
              .filter(k => k.startsWith('s'))
              .sort((a, b) => {
                const numA = parseInt(a.replace('s', ''))
                const numB = parseInt(b.replace('s', ''))
                return numA - numB
              })
            finalTeachers = sortedKeys.map(key => mapping[key] || `姓名${key.replace('s', '')}`)
            console.log('[员工功能分析] 使用映射关系恢复教员列表:', finalTeachers)
          } else if (Array.isArray(data.teachers) && data.teachers.length) {
            // 向后兼容：使用旧的 teachers 数组（旧数据）
            finalTeachers = data.teachers
            console.log('[员工功能分析] 使用旧格式恢复教员列表:', finalTeachers)
          }
          
          // 如果没有从后端获取到教员列表，使用当前列表
          if (!finalTeachers.length) {
            finalTeachers = teacherNamesRef.current
          }
          
          const remoteRows: StaffFunctionRow[] = Array.isArray(data.rows) ? data.rows : []
          const keys = generateScoreKeys(
            finalTeachers.length || scoreKeysRef.current.length || DEFAULT_SCORE_KEYS.length,
          )
          if (finalTeachers.length) setTeacherNames(finalTeachers)
          setScoreKeys(keys)
          
          if (remoteRows.length) {
            // 合并后端数据与默认数据，确保 id、category、functionItem、detail 等字段存在
            const defaultRows = buildDefaultRows()
            const mergedRows = remoteRows.map((row: StaffFunctionRow, idx: number) => {
              const defaultRow = defaultRows.find(d => d.id === row.id) || defaultRows[idx] || defaultRows[0]
              return {
                ...defaultRow, // 先用默认值
                ...row, // 再覆盖后端数据（分数等）
                id: defaultRow.id, // id 始终使用默认值
                category: defaultRow.category, // 类别始终使用默认值
                functionItem: defaultRow.functionItem, // 功能项目始终使用默认值
                detail: defaultRow.detail, // 详细要求始终使用默认值
                fullScore: defaultRow.fullScore, // 满分始终使用默认值
              }
            })
            setRows(ensureKeys(mergedRows, keys))
            return
          }
        }
      }
      // 无数据时按当前列数重置为默认
      setRows(ensureKeys(buildDefaultRows(), scoreKeysRef.current))
    } catch (error) {
      console.error('[员工功能分析] 远端加载失败:', error)
      message.error('加载远端数据失败')
    } finally {
      setLoading(false)
    }
  }, [ensureKeys, resolvedCampus, year])

  useEffect(() => {
    loadTeachers()
  }, [loadTeachers])

  useEffect(() => {
    fetchRemote()
  }, [fetchRemote])

  const handleSave = async () => {
    setSaving(true)
    try {
      // 生成评分列到教员姓名的映射关系
      const evaluatorMapping: { [key: string]: string } = {}
      scoreKeys.forEach((key, idx) => {
        const teacherName = teacherNames[idx] || `姓名${idx + 1}`
        evaluatorMapping[key] = teacherName
      })
      
      const payload = {
        神殿: resolvedCampus,
        年份: year,
        数据: {
          teachers: teacherNames,
          evaluatorMapping, // 添加映射关系
          rows,
        },
      }
      const res = await fetch(buildApiUrl('/staff-function-analysis'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(await res.text())
      message.success('已保存到后端')
      fetchRemote()
    } catch (error) {
      console.error('[员工功能分析] 保存失败:', error)
      message.error('保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  const columns: ColumnsType<StaffFunctionRow> = [
    { title: '序号', dataIndex: 'id', key: 'id', width: 70, align: 'center' },
    {
      title: '类别',
      dataIndex: 'category',
      key: 'category',
      width: 140,
      align: 'center',
      onCell: (record) => ({
        rowSpan: categoryRowSpanMap[record.id],
      }),
    },
    { title: '功能项目', dataIndex: 'functionItem', key: 'functionItem', width: 150 },
    { title: '详细要求', dataIndex: 'detail', key: 'detail', width: 260 },
    { title: '满分', dataIndex: 'fullScore', key: 'fullScore', width: 80, align: 'right' },
    ...scoreKeys.map((key, idx) => ({
      title: evaluatorLabels[idx],
      dataIndex: key,
      key,
      width: 110,
      align: 'right' as const,
      render: (_: number, record: StaffFunctionRow) => (
        <InputNumber
          min={0}
          max={record.fullScore}
          precision={0}
          value={record[key]}
          style={{ width: '100%' }}
          onChange={(value) => handleScoreChange(record.id, key, typeof value === 'number' ? value : null)}
        />
      ),
    })),
  ]

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={<Title level={3}>智慧司员工功能分析表</Title>}
        extra={
          <Space>
            <CampusSelector useGlobalState showLabel />
            <span>
              <Text strong style={{ marginRight: 8 }}>
                年份
              </Text>
              <InputNumber
                min={2000}
                max={2100}
                value={year}
                onChange={(v) => {
                  const next = Number(v || dayjs().year())
                  setYear(next)
                }}
              />
            </span>
            <Button onClick={handleReset}>重置数据</Button>
            <Button type="primary" loading={saving} onClick={handleSave}>
              保存
            </Button>
          </Space>
        }
      >
        <Spin spinning={loading}>
          <Table<StaffFunctionRow>
            bordered
            size="small"
            columns={columns}
            dataSource={rows}
            pagination={false}
            rowKey="id"
            scroll={{ x: 1400 }}
            summary={() => (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0}>
                  <Text strong>合计</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1} />
                <Table.Summary.Cell index={2} />
                <Table.Summary.Cell index={3} />
                <Table.Summary.Cell index={4} align="right">
                  <Text strong>{totals.full}</Text>
                </Table.Summary.Cell>
                {totals.scores.map((value, idx) => (
                  <Table.Summary.Cell key={`sum-${idx}`} index={5 + idx} align="right">
                    <Text strong>{value}</Text>
                  </Table.Summary.Cell>
                ))}
              </Table.Summary.Row>
            )}
          />
        </Spin>
      </Card>
    </div>
  )
}

export default StaffFunctionAnalysisTable
