// XX班作业登记表 · 支持选择班级/年月、读取/刷新、编辑/新增/删除与保存，自动汇总
// 选择班级后自动从“班级档案”带出默认班主任

import React, { useEffect, useMemo, useState } from 'react'
import { App, Card, Table, Input, InputNumber, Button, Space, Popconfirm, Select, DatePicker } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { buildApiUrl } from '@/utils/apiBase'
import { useCampusStore } from '@/stores/campusStore'
import { classAssignmentGradeService } from '@/services/service'
import dayjs from 'dayjs'

interface HomeworkRecord {
  id: string
  date: string
  courseName: string
  chapter: string
  classSize: number | null
  headTeacher: string
  teacher: string
  submitRate: number | null // 0-100
  passRate: number | null // 0-100
  remark: string
  source?: 'manual' | 'academic'
}

const safeToMonth = (d?: string | null): number | null => {
  if (!d) return null
  const dd = dayjs(d)
  return dd.isValid() ? dd.month() + 1 : null
}

const safeToYear = (d?: string | null): number | null => {
  if (!d) return null
  const dd = dayjs(d)
  return dd.isValid() ? dd.year() : null
}

// API（中文键名）
interface ApiRow {
  序号: number
  日期?: string | null
  课程名称?: string | null
  章节?: string | null
  班级人数?: number | null
  班主任?: string | null
  教员?: string | null
  作业提交率?: number | null
  作业合格率?: number | null
  备注?: string | null
}

interface ApiList {
  神殿名称: string
  班级名称: string
  年份: number
  月份: number
  行列表: ApiRow[]
}

interface ClassListItem { 班级名称: string; 神殿: string }
interface ClassConfigRow {
  id: number
  class_name: string
  campus_name: string
  homeroom_teacher_name?: string | null
}

const createEmptyRecord = (defaultHeadTeacher?: string): HomeworkRecord => ({
  id: String(Date.now() + Math.random()),
  date: '',
  courseName: '',
  chapter: '',
  classSize: null,
  headTeacher: defaultHeadTeacher || '',
  teacher: '',
  submitRate: null,
  passRate: null,
  remark: '',
  source: 'manual',
})

const fromApiRow = (r: ApiRow): HomeworkRecord => ({
  id: `${r.序号}__${r.日期 || ''}__${r.课程名称 || ''}`,
  date: (r.日期 || '').trim(),
  courseName: (r.课程名称 || '').trim(),
  chapter: (r.章节 || '').trim(),
  classSize: r.班级人数 ?? null,
  headTeacher: (r.班主任 || '').trim(),
  teacher: (r.教员 || '').trim(),
  submitRate: typeof r.作业提交率 === 'number' ? r.作业提交率 : null,
  passRate: typeof r.作业合格率 === 'number' ? r.作业合格率 : null,
  remark: (r.备注 || '').trim(),
  source: 'manual',
})

const toApiRow = (r: HomeworkRecord, index: number): ApiRow => ({
  序号: index + 1,
  日期: r.date || undefined,
  课程名称: r.courseName || undefined,
  章节: r.chapter || undefined,
  班级人数: r.classSize ?? undefined,
  班主任: r.headTeacher || undefined,
  教员: r.teacher || undefined,
  作业提交率: r.submitRate ?? undefined,
  作业合格率: r.passRate ?? undefined,
  备注: r.remark || undefined,
})

const HomeworkExamSheet: React.FC = () => {
  const { message } = App.useApp()
  const today = new Date()
  const currentCampus = useCampusStore((state) => state.currentCampus)

  const [classes, setClasses] = useState<Array<{ label: string; value: string }>>([])
  const [selectedCampus, setSelectedCampus] = useState<string>('')
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [year, setYear] = useState<number>(today.getFullYear())
  const [month, setMonth] = useState<number>(today.getMonth() + 1)

  const [records, setRecords] = useState<HomeworkRecord[]>([createEmptyRecord(), createEmptyRecord()])
  const [loading, setLoading] = useState<boolean>(false)

  const [defaultHeadTeacher, setDefaultHeadTeacher] = useState<string>('')

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

  // 从【配置中心-班级管理】读取默认班主任（homeroom_teacher_name）
  const fetchDefaultHeadTeacher = async (campus: string, klass: string): Promise<string> => {
    try {
      // 配置中心的 campus_name 一般带“神殿”后缀；这里做兼容兜底
      const candidates = [
        (campus || '').trim(),
        `${(campus || '').trim()}神殿`,
        (campus || '').replace(/神殿$/, '').trim(),
      ].filter((v, i, arr) => !!v && arr.indexOf(v) === i)

      for (const c of candidates) {
        const res = await fetch(
          buildApiUrl(`/config/classes?campus_name=${encodeURIComponent(c)}`),
        )
        if (!res.ok) continue
        const list = (await res.json()) as ClassConfigRow[]
        const hit = (list || []).find((row) => String(row.class_name || '').trim() === String(klass || '').trim())
        const name = (hit?.homeroom_teacher_name || '').trim()
        if (name) return name
      }

      return ''
    } catch (e) {
      console.warn('读取配置中心班级管理失败，无法带出班主任', e)
      return ''
    }
  }

  const loadData = async (campus: string, klass: string, y: number, m: number) => {
    setLoading(true)
    try {
      const [hd, manualRes, academicList] = await Promise.all([
        fetchDefaultHeadTeacher(campus, klass),
        fetch(buildApiUrl(`/teaching-quality/homework?campus=${encodeURIComponent(campus)}&class=${encodeURIComponent(klass)}&year=${y}&month=${m}`)),
        // 从智慧司「班作业成绩表」读取：按神殿+班级取最新一条，然后按起止日期归类到对应月份
        classAssignmentGradeService
          .getList({ campus: `${campus}神殿`, className: klass })
          .catch(() => []),
      ])
      setDefaultHeadTeacher(hd)

      // 1) 先尝试加载“作业登记表（原有）”
      let manualRows: HomeworkRecord[] = []
      if (manualRes.ok) {
        const manualData = (await manualRes.json()) as ApiList
        manualRows = (manualData.行列表 || []).map(fromApiRow)
      }

      // 2) 智慧司「班作业成绩表」映射为本页的行（按月份过滤）
      const academicRows: HomeworkRecord[] = []
      const latestAcademic = Array.isArray(academicList) && academicList.length ? academicList[0] : null
      if (latestAcademic?.records?.assignments && Array.isArray(latestAcademic.records.assignments)) {
        const startDateStr = latestAcademic.startDate
        const endDateStr = latestAcademic.endDate
        const startMonth = safeToMonth(startDateStr)
        const startYear = safeToYear(startDateStr)
        const endMonth = safeToMonth(endDateStr)
        const endYear = safeToYear(endDateStr)

        // 支持跨月：如果选择的年月落在起止日期范围内，则展示；否则不展示
        const inRange = (() => {
          if (!startYear || !startMonth || !endYear || !endMonth) return true // 没有日期就不限制
          const cur = dayjs(`${y}-${String(m).padStart(2, '0')}-01`)
          const start = dayjs(`${startYear}-${String(startMonth).padStart(2, '0')}-01`)
          const end = dayjs(`${endYear}-${String(endMonth).padStart(2, '0')}-01`)
          return (cur.isAfter(start) || cur.isSame(start, 'month')) && (cur.isBefore(end) || cur.isSame(end, 'month'))
        })()

        if (inRange) {
          const assignments = latestAcademic.records.assignments as Array<{ number: number; date?: string; name?: string }>
          const teacherName = (latestAcademic.teacherName || '').trim()
          const courseName = (latestAcademic.courseName || '').trim()
          const classSize = typeof latestAcademic.classSize === 'number' ? latestAcademic.classSize : null

          // 计算整张表在所选月份内的提交率/合格率（按“作业成绩”，-1 表示未提交）
          // 应提交：所有学员 * 当月作业数（当月有日期的作业）
          const monthAssignments = assignments.filter((a) => {
            const am = safeToMonth(a.date || '')
            const ay = safeToYear(a.date || '')
            return am === m && ay === y
          })

          const students = (latestAcademic.records.students || []) as Array<any>
          const expected = students.length * monthAssignments.length
          const actual = students.reduce((acc, s) => {
            return (
              acc +
              monthAssignments.filter((a) => {
                const score = s?.assignments?.find((x: any) => Number(x?.number) === Number(a.number))?.assignment_score
                return score !== null && score !== undefined && Number(score) >= 0
              }).length
            )
          }, 0)
          const pass = students.reduce((acc, s) => {
            return (
              acc +
              monthAssignments.filter((a) => {
                const score = s?.assignments?.find((x: any) => Number(x?.number) === Number(a.number))?.assignment_score
                return score !== null && score !== undefined && Number(score) >= 6
              }).length
            )
          }, 0)
          const submitRate = expected > 0 ? Math.round((actual / expected) * 10000) / 100 : null
          const passRate = actual > 0 ? Math.round((pass / actual) * 10000) / 100 : null

          // 将“班作业成绩表”按日期拆成多行（每个作业一行），并在备注注明来源
          monthAssignments.forEach((a) => {
            academicRows.push({
              id: `academic__${latestAcademic.id}__${a.number}`,
              date: (a.date || '').trim(),
              courseName: courseName || (a.name || '').trim(),
              chapter: (a.name || '').trim(),
              classSize,
              headTeacher: hd,
              teacher: teacherName,
              submitRate,
              passRate,
              remark: '来源：智慧司-班作业成绩表（自动带出）',
              source: 'academic',
            })
          })
        }
      }

      // 3) 优先级：若“作业登记表”已有数据，仍展示它；否则用智慧司数据兜底
      const merged = manualRows.length ? manualRows : (academicRows.length ? academicRows : [])

      if (merged.length) {
        setRecords(merged)
      } else {
        setRecords([createEmptyRecord(hd), createEmptyRecord(hd)])
      }
    } catch (e) {
      console.error(e)
      message.warning('未能读取作业登记表，使用空白行')
      setRecords([createEmptyRecord(defaultHeadTeacher), createEmptyRecord(defaultHeadTeacher)])
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

  const handleFieldChange = (
    id: string,
    field: keyof HomeworkRecord,
    value: string | number | null,
  ) => {
    setRecords((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)))
  }

  const handleAdd = () => {
    setRecords((prev) => [...prev, createEmptyRecord(defaultHeadTeacher)])
  }

  const handleDelete = (id: string) => {
    setRecords((prev) => prev.filter((item) => item.id !== id))
  }

  const summary = useMemo(() => {
    if (records.length === 0) {
      return {
        submitRateAvg: '#DIV/0!',
        passRateAvg: '#DIV/0!',
      }
    }
    const validSubmit = records.filter((r) => typeof r.submitRate === 'number')
    const validPass = records.filter((r) => typeof r.passRate === 'number')
    const submitRateAvg =
      validSubmit.length > 0
        ? `${(
            validSubmit.reduce((sum, r) => sum + (r.submitRate || 0), 0) / validSubmit.length
          ).toFixed(2)}%`
        : '#DIV/0!'
    const passRateAvg =
      validPass.length > 0
        ? `${(validPass.reduce((sum, r) => sum + (r.passRate || 0), 0) / validPass.length).toFixed(
            2,
          )}%`
        : '#DIV/0!'
    return {
      submitRateAvg,
      passRateAvg,
    }
  }, [records])

  const anyContentFilled = (r: HomeworkRecord) => !!(
    (r.date && r.date.trim()) ||
    (r.courseName && r.courseName.trim()) ||
    (r.chapter && r.chapter.trim()) ||
    r.classSize !== null ||
    (r.headTeacher && r.headTeacher.trim()) ||
    (r.teacher && r.teacher.trim()) ||
    r.submitRate !== null ||
    r.passRate !== null ||
    (r.remark && r.remark.trim())
  )

  const columns: ColumnsType<HomeworkRecord> = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      width: 160,
      align: 'center',
      render: (text, record) => (
        <DatePicker
          format="YYYY-MM-DD"
          value={text ? dayjs(text) : null}
          onChange={(date) => handleFieldChange(record.id, 'date', date ? date.format('YYYY-MM-DD') : '')}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: '课程名称',
      dataIndex: 'courseName',
      key: 'courseName',
      width: 160,
      align: 'center',
      render: (text, record) => (
        <Input
          value={text}
          placeholder="如：Linux基础"
          onChange={(e) => handleFieldChange(record.id, 'courseName', e.target.value)}
        />
      ),
    },
    {
      title: '章节',
      dataIndex: 'chapter',
      key: 'chapter',
      width: 160,
      align: 'center',
      render: (text, record) => (
        <Input
          value={text}
          placeholder="如：第3章 文件系统"
          onChange={(e) => handleFieldChange(record.id, 'chapter', e.target.value)}
        />
      ),
    },
    {
      title: '班级人数',
      dataIndex: 'classSize',
      key: 'classSize',
      width: 110,
      align: 'center',
      render: (value, record) => (
        <InputNumber
          value={value as number | null}
          min={0}
          style={{ width: '100%' }}
          onChange={(v) => handleFieldChange(record.id, 'classSize', v ?? null)}
        />
      ),
    },
    {
      title: '班主任',
      dataIndex: 'headTeacher',
      key: 'headTeacher',
      width: 120,
      align: 'center',
      render: (text, record) => (
        <Input
          value={text}
          placeholder={defaultHeadTeacher ? `默认：${defaultHeadTeacher}` : ''}
          onChange={(e) => handleFieldChange(record.id, 'headTeacher', e.target.value)}
        />
      ),
    },
    {
      title: '教员',
      dataIndex: 'teacher',
      key: 'teacher',
      width: 120,
      align: 'center',
      render: (text, record) => (
        <Input
          value={text}
          onChange={(e) => handleFieldChange(record.id, 'teacher', e.target.value)}
        />
      ),
    },
    {
      title: '作业提交率',
      dataIndex: 'submitRate',
      key: 'submitRate',
      width: 130,
      align: 'center',
      render: (value, record) => (
        <InputNumber
          value={value as number | null}
          min={0}
          max={100}
          formatter={(val) => (val !== undefined && val !== null ? `${val}%` : '')}
          parser={(val) => (val ? Number(val.replace('%', '')) : NaN)}
          style={{ width: '100%' }}
          onChange={(v) =>
            handleFieldChange(
              record.id,
              'submitRate',
              Number.isNaN(v as number) ? null : (v as number),
            )
          }
        />
      ),
    },
    {
      title: '作业合格率',
      dataIndex: 'passRate',
      key: 'passRate',
      width: 130,
      align: 'center',
      render: (value, record) => (
        <InputNumber
          value={value as number | null}
          min={0}
          max={100}
          formatter={(val) => (val !== undefined && val !== null ? `${val}%` : '')}
          parser={(val) => (val ? Number(val.replace('%', '')) : NaN)}
          style={{ width: '100%' }}
          onChange={(v) =>
            handleFieldChange(
              record.id,
              'passRate',
              Number.isNaN(v as number) ? null : (v as number),
            )
          }
        />
      ),
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      width: 220,
      align: 'left',
      render: (text, record) => (
        <Input
          value={text}
          onChange={(e) => handleFieldChange(record.id, 'remark', e.target.value)}
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      align: 'center',
      fixed: 'right',
      render: (_, record) => (
        <Popconfirm title="确定删除该记录吗？" onConfirm={() => handleDelete(record.id)}>
          <Button type="link" danger>
            删除
          </Button>
        </Popconfirm>
      ),
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={
          <Space>
            <span>{selectedClass ? `${selectedClass}作业登记表` : 'XX班作业登记表'}</span>
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
            <Button type="dashed" onClick={handleAdd}>新增记录</Button>
            <Button
              type="primary"
              onClick={async () => {
                if (!selectedCampus || !selectedClass) {
                  message.warning('请先选择班级')
                  return
                }
                const payloadRows: ApiRow[] = records
                  .filter((r) => anyContentFilled(r))
                  .map((r, idx) => toApiRow(r, idx))
                if (payloadRows.length === 0) {
                  message.warning('没有需要保存的数据')
                  return
                }
                try {
                  const res = await fetch(buildApiUrl('/teaching-quality/homework'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      神殿名称: selectedCampus,
                      班级名称: selectedClass,
                      年份: year,
                      月份: month,
                      行列表: payloadRows,
                    }),
                  })
                  if (!res.ok) throw new Error(await res.text())
                  const data = (await res.json()) as ApiList
                  const rows = (data.行列表 || []).map(fromApiRow)
                  setRecords(rows.length ? rows : [createEmptyRecord(defaultHeadTeacher), createEmptyRecord(defaultHeadTeacher)])
                  message.success('保存成功')
                } catch (e) {
                  console.error(e)
                  message.error('保存失败')
                }
              }}
            >
              保存
            </Button>
          </Space>
        }
      >
        <Table<HomeworkRecord>
          bordered
          size="small"
          columns={columns}
          dataSource={records}
          rowKey="id"
          loading={loading}
          pagination={false}
          scroll={{ x: 'max-content' }}
          summary={() => (
            <Table.Summary fixed>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0}>合计/平均</Table.Summary.Cell>
                <Table.Summary.Cell index={1} />
                <Table.Summary.Cell index={2} />
                <Table.Summary.Cell index={3} />
                <Table.Summary.Cell index={4} />
                <Table.Summary.Cell index={5} />
                <Table.Summary.Cell index={6}>{summary.submitRateAvg}</Table.Summary.Cell>
                <Table.Summary.Cell index={7}>{summary.passRateAvg}</Table.Summary.Cell>
                <Table.Summary.Cell index={8} />
                <Table.Summary.Cell index={9} />
              </Table.Summary.Row>
            </Table.Summary>
          )}
        />
      </Card>
    </div>
  )
}

export default HomeworkExamSheet
