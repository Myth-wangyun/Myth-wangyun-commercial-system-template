// XX专业考试成绩登记表 · ExamSheet（按班级+年月）
// 支持：选择班级/年月、自动带出班级档案名单并回填当月成绩、刷新、保存；
// 行数严格等于班级档案人数；底部使用 Summary 显示“合计/平均”。

import React, { useEffect, useState } from 'react'
import { App, Card, Table, Select, Button, Space } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { buildApiUrl } from '@/utils/apiBase'
import { useCampusStore } from '@/stores/campusStore'
import dayjs from 'dayjs'
import { classExamScoreService } from '@/services/service'
import type { ClassExamScore } from '@/types/service'

interface MajorExamScoreRow {
  key: string
  serialNumber: number
  studentName: string
  // 动态科目列：key 为 record.id（字符串），value 为该次考试的最终成绩
  subjectScores: Record<string, string>
  avgScore: string
}


// 智慧司「班考试成绩表」相关类型
// 仅使用到页面需要的字段（课程、教员、考试日期、最终成绩表学生列表等）
interface AcademicExamOption {
  label: string
  value: string
  record: ClassExamScore
}

// 班级列表 & 班级档案
interface ClassListItem { 班级名称: string; 神殿: string }
interface ClassFileRow { serialNumber?: number; name?: string }
interface ClassFileList { 行列表: ClassFileRow[] }

const createRow = (
  serial: number,
  overrides: Partial<MajorExamScoreRow> = {},
): MajorExamScoreRow => ({
  key: String(serial),
  serialNumber: serial,
  studentName: '',
  subjectScores: {},
  avgScore: '',
  ...overrides,
})


const ExamSheet: React.FC = () => {
  const { message } = App.useApp()
  const today = new Date()
  const currentCampus = useCampusStore((state) => state.currentCampus)
  const [classes, setClasses] = useState<Array<{ label: string; value: string }>>([])
  const [selectedCampus, setSelectedCampus] = useState<string>('')
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [year, setYear] = useState<number>(today.getFullYear())
  const [month, setMonth] = useState<number>(today.getMonth() + 1)

  const [dataSource, setDataSource] = useState<MajorExamScoreRow[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  // exams 下拉：来源于智慧司「班考试成绩表」记录（每条记录=一次课程考试）
  const [examOptions, setExamOptions] = useState<AcademicExamOption[]>([])

  // 加载班级列表（只显示当前神殿的班级）
  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch(buildApiUrl('/teaching-quality/class-list'))
        if (!res.ok) throw new Error('加载班级列表失败')
        const list = (await res.json()) as ClassListItem[]
        const norm = (s: string) => (s || '').replace(/神殿$/, '').trim()
        const currentCampusNorm = norm(currentCampus || '')
        
        // 过滤只显示当前神殿的班级
        const filteredList = currentCampusNorm 
          ? list.filter((it) => norm(it.神殿) === currentCampusNorm)
          : list
        
        const options = filteredList.map((it) => ({ 
          label: `${norm(it.神殿)} - ${it.班级名称}`, 
          value: `${norm(it.神殿)}||${it.班级名称}` 
        }))
        const unique = Array.from(new Map(options.map((o) => [o.value, o])).values())
        setClasses(unique)
      } catch (e) {
        console.error(e)
        message.error('加载班级列表失败')
      }
    })()
  }, [currentCampus])

  const parseScoreNum = (v: any): number | null => {
    const n = parseFloat(String(v ?? '').replace(/[^\d.\-]/g, ''))
    return Number.isFinite(n) ? n : null
  }

  const computeRowAvg = (row: MajorExamScoreRow, examIds: string[]): string => {
    const nums = examIds
      .map((id) => parseScoreNum(row.subjectScores?.[id]))
      .filter((n): n is number => n !== null)
    if (nums.length === 0) return ''
    const avg = nums.reduce((a, b) => a + b, 0) / nums.length
    return avg.toFixed(2)
  }

  const computeSummaryAvg = (rows: MajorExamScoreRow[], examIds: string[]): string => {
    const nums: number[] = []
    rows.forEach((r) => {
      examIds.forEach((id) => {
        const n = parseScoreNum(r.subjectScores?.[id])
        if (n !== null) nums.push(n)
      })
    })
    if (nums.length === 0) return '#DIV/0!'
    const avg = nums.reduce((a, b) => a + b, 0) / nums.length
    return `平均: ${avg.toFixed(2)}`
  }


  // 拉取班级档案 -> 学生名单（序号+姓名）
  const fetchRoster = async (campus: string, klass: string): Promise<Array<{ 序号: number; 姓名: string }>> => {
    try {
      const res = await fetch(buildApiUrl(`/teaching-quality/class-file?campus=${encodeURIComponent(campus)}&class=${encodeURIComponent(klass)}`))
      if (!res.ok) throw new Error('读取班级档案失败')
      const cf = (await res.json()) as ClassFileList
      return (cf.行列表 || [])
        .map((r, idx) => ({ 序号: Number(r.serialNumber ?? idx + 1), 姓名: (r.name || '').trim() }))
        .filter((r) => !!r.姓名)
        .sort((a, b) => a.序号 - b.序号)
    } catch (e) {
      console.warn('未能读取班级档案名单', e)
      return []
    }
  }

  // 读取并合并：以班级档案名单为准；成绩数据改为读取「智慧司 - 班考试成绩表」
  // 规则：
  // 1) 先取班级档案名单，保证行数严格等于名单人数
  // 2) 从智慧司接口 /class-exam-scores/ 读取该班级的所有课程考试记录，组装为 examOptions
  // 3) 选中某次考试后：回填该次考试的「最终成绩表」(scoresFinal.students) 的 final_score/total_score
  const loadData = async (campus: string, klass: string, _y: number, _m: number) => {
    setLoading(true)
    try {
      const roster = await fetchRoster(campus, klass)

      // 智慧司班考试成绩表：同一班可能存在多门课/多次考试记录
      // 后端匹配偏严格，这里仿照智慧司页面做名称变体尝试（神殿/班级名是否带“神殿/班”）
      const campusVariants = Array.from(
        new Set([
          campus,
          campus.replace(/神殿$/, ''),
          campus.endsWith('神殿') ? campus : `${campus}神殿`,
        ].map((s) => (s || '').trim()).filter(Boolean)),
      )
      const classVariants = Array.from(
        new Set([
          klass,
          `${klass}班`,
          klass.replace(/班$/, ''),
        ].map((s) => (s || '').trim()).filter(Boolean)),
      )

      let records: ClassExamScore[] = []
      for (const c of campusVariants) {
        for (const cl of classVariants) {
          try {
            const res = await classExamScoreService.getList({ pageSize: 200 }, c, cl)
            if (res?.list?.length) {
              records = res.list
              break
            }
          } catch (e) {
            // 忽略单次尝试失败
          }
        }
        if (records.length) break
      }

      // examOptions = 每条 record 一项
      const newExamOptions: AcademicExamOption[] = (records || []).map((r) => {
        const dateStr = r.firstExamDate ? dayjs(r.firstExamDate).format('YYYY-MM-DD') : ''
        const label = `${r.courseName || ''} ${dateStr} ${r.instructorName || ''}`.trim() || `记录#${r.id}`
        const value = String(r.id)
        return { label, value, record: r }
      })

      setExamOptions(newExamOptions)

      // 先把每个考试记录解析为：name -> score 的映射
      const scoreMapsByExamId = new Map<string, Map<string, string>>()
      newExamOptions.forEach((opt) => {
        const rec = opt.record
        // 关键修复：service 层字段通常是 scoresFinal（驼峰），但部分数据可能仍是 scores_final
        const finalStudents: any[] =
          (rec as any)?.scoresFinal?.students || (rec as any)?.scores_final?.students || []

        const scoreByName = new Map<string, string>()
        finalStudents.forEach((s) => {
          const name = String(s.studentName || s.student_name || s.学生姓名 || '').trim()
          // 后端响应中最终成绩字段为 result
          const score =
            s.result ??
            s.finalScore ??
            s.final_score ??
            s.totalScore ??
            s.total_score ??
            s.first_total ??
            s.makeup_total ??
            s.comprehensiveScore ??
            s.comprehensive_score
          if (name) scoreByName.set(name, score === undefined || score === null ? '' : String(score))
        })

        scoreMapsByExamId.set(opt.value, scoreByName)
      })

      // 横向展示：每个学生一行，多个科目/考试一列
      const examIds = newExamOptions.map((o) => o.value)

      let mergedRows: MajorExamScoreRow[]
      if (roster.length > 0) {
        mergedRows = roster.map((r) => {
          const subjectScores: Record<string, string> = {}
          examIds.forEach((id) => {
            const map = scoreMapsByExamId.get(id)
            subjectScores[id] = map?.get(r.姓名) || ''
          })
          const base = createRow(r.序号, { studentName: r.姓名, subjectScores })
          return { ...base, avgScore: computeRowAvg(base, examIds) }
        })
      } else {
        // 没有 roster 的情况下：把所有考试的 students 合并出一个姓名集合
        const nameSet = new Set<string>()
        newExamOptions.forEach((opt) => {
          const map = scoreMapsByExamId.get(opt.value)
          map?.forEach((_v, k) => nameSet.add(k))
        })
        const names = Array.from(nameSet).filter(Boolean)
        mergedRows = names.map((name, idx) => {
          const subjectScores: Record<string, string> = {}
          examIds.forEach((id) => {
            subjectScores[id] = scoreMapsByExamId.get(id)?.get(name) || ''
          })
          const base = createRow(idx + 1, { studentName: name, subjectScores })
          return { ...base, avgScore: computeRowAvg(base, examIds) }
        })
      }

      // 默认：直接展示横向合并后的结果
      setDataSource(mergedRows)
    } catch (e) {
      console.error(e)
      message.warning('未能读取智慧司班考试成绩表')
      setDataSource([])
      setExamOptions([])
    } finally {
      setLoading(false)
    }
  }

  const onSelectClass = async (val: string) => {
    const [campus, klass] = String(val).split('||')
    const campusNorm = (campus || '').trim()
    const classNorm = (klass || '').trim()
    setSelectedCampus(campusNorm)
    setSelectedClass(classNorm)
    await loadData(campusNorm, classNorm, year, month)
  }


  // 处理考试切换
  // 处理考试切换

  const examIdsForColumns = examOptions.map((o) => o.value)

  const columns: ColumnsType<MajorExamScoreRow> = [
    {
      title: '编号',
      dataIndex: 'serialNumber',
      key: 'serialNumber',
      width: 80,
      align: 'center',
      fixed: 'left',
    },
    {
      title: '学生姓名',
      dataIndex: 'studentName',
      key: 'studentName',
      width: 120,
      align: 'center',
      fixed: 'left',
      render: (text) => <span>{text}</span>,
    },
    ...examOptions.map((opt) => ({
      title: opt.label,
      dataIndex: ['subjectScores', opt.value] as any,
      key: `sub_${opt.value}`,
      width: 160,
      align: 'center' as const,
      render: (_: any, record: MajorExamScoreRow) => <span>{record.subjectScores?.[opt.value] ?? ''}</span>,
    })),
    {
      title: '平均分',
      dataIndex: 'avgScore',
      key: 'avgScore',
      width: 110,
      align: 'center',
      fixed: 'right',
      render: (text) => <span>{text}</span>,
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={
          <Space>
            <span>{selectedClass ? `${selectedClass}专业考试成绩登记表` : 'XX专业考试成绩登记表'}</span>
            <Select
              placeholder={classes.length ? '选择班级' : '暂无班级'}
              value={selectedCampus && selectedClass ? `${selectedCampus}||${selectedClass}` : undefined}
              options={classes}
              onChange={onSelectClass}
              style={{ width: 260 }}
              showSearch
            />
            <Select
              value={year}
              onChange={async (y) => {
                setYear(y)
                if (selectedCampus && selectedClass) await loadData(selectedCampus, selectedClass, y, month)
              }}
              options={Array.from({ length: 6 }).map((_, i) => ({ label: `${today.getFullYear() - i}年`, value: today.getFullYear() - i }))}
              style={{ width: 110 }}
            />
            <Select
              value={month}
              onChange={async (m) => {
                setMonth(m)
                if (selectedCampus && selectedClass) await loadData(selectedCampus, selectedClass, year, m)
              }}
              options={Array.from({ length: 12 }).map((_, i) => ({ label: `${i + 1}月`, value: i + 1 }))}
              style={{ width: 90 }}
            />
          </Space>
        }
        extra={
          <Space>
            <Button onClick={() => selectedCampus && selectedClass && loadData(selectedCampus, selectedClass, year, month)}>刷新</Button>
          </Space>
        }
      >
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
            科目（横向展示，数据来源：智慧司班考试成绩表的“最终成绩表”）
          </label>
          <div style={{ color: '#666', fontSize: 12, lineHeight: 1.6 }}>
            已自动加载该班级在智慧司录入的所有课程考试记录，并按学生姓名对齐显示最终成绩；右侧为该学生多科目的平均分。
          </div>
        </div>
        <Table<MajorExamScoreRow>
          bordered
          size="small"
          columns={columns}
          dataSource={dataSource}
          loading={loading}
          pagination={false}
          rowKey="key"
          scroll={{ x: 'max-content' }}
          summary={() => {
            const avgAll = computeSummaryAvg(dataSource, examIdsForColumns)
            const avgRow = computeSummaryAvg(
              dataSource.map((r) => ({
                ...r,
                subjectScores: { avg: r.avgScore },
              })),
              ['avg'],
            )
            return (
              <Table.Summary fixed>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0}>合计/平均</Table.Summary.Cell>
                  <Table.Summary.Cell index={1} />
                  {/* 动态科目列不逐列汇总，统一显示总体平均 */}
                  <Table.Summary.Cell index={2} colSpan={Math.max(1, examIdsForColumns.length)}>
                    {avgAll}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3}>{avgRow}</Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            )
          }}
        />
      </Card>

    </div>
  )
}

export default ExamSheet
