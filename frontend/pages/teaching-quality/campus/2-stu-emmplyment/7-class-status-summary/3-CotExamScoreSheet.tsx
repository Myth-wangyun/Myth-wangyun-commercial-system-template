// COT考试成绩表：CotExamScoreSheet.tsx · 素质课考试成绩登记表（按班级+年月）
// 行数严格等于班级档案人数；底部 Summary 显示“合计/平均”，不写入数据库。

import React, { useEffect, useState } from 'react'
import { App, Card, Table, Input, Select, Button, Space, Modal, Form, DatePicker, Switch } from 'antd'
import { ImportOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { buildApiUrl } from '@/utils/apiBase'
import { fetchClasses } from '@/services/configMaster'
import type { ClassProfile } from '@/services/configMaster'
import { useCampusStore } from '@/stores/campusStore'
import dayjs from 'dayjs'

interface CotExamScoreRow {
  key: string
  serialNumber: number
  studentName: string
  /** key=考试信息，value=该次考试成绩（原样字符串） */
  examScores: Record<string, string>
}

// API 类型（中文键名）
interface ApiCotRow {
  序号: number
  学生姓名?: string | null
  科目考试信息?: string | null
  考试成绩?: string | null
}

interface ApiCotList {
  神殿名称: string
  班级名称: string
  年份: number
  月份: number
  行列表: ApiCotRow[]
}

interface ApiCotListAll {
  神殿名称: string
  班级名称: string
  行列表: ApiCotRow[]
}

// 班级信息从配置中心读取（config master）
interface ClassListItem { 班级名称: string; 神殿: string; 班主任?: string | null }
interface ClassFileRow { serialNumber?: number; name?: string }
interface ClassFileList { 行列表: ClassFileRow[] }

const createRow = (
  serial: number,
  overrides: Partial<CotExamScoreRow> = {},
): CotExamScoreRow => ({
  key: String(serial),
  serialNumber: serial,
  studentName: '',
  examScores: {},
  ...overrides,
})

const fromApiRow = (r: ApiCotRow): CotExamScoreRow => {
  const examInfo = (r.科目考试信息 || '').trim()
  return {
    key: String(r.序号) + '::' + String(r.学生姓名 || ''),
    serialNumber: r.序号,
    studentName: (r.学生姓名 || '').trim(),
    examScores: examInfo ? { [examInfo]: (r.考试成绩 || '').trim() } : {},
  }
}

const toApiRow = (serialNumber: number, studentName: string, subjectExamInfo: string, examScore: string): ApiCotRow => ({
  序号: serialNumber,
  学生姓名: studentName || undefined,
  科目考试信息: subjectExamInfo || undefined,
  考试成绩: examScore || undefined,
})

const CotExamScoreSheet: React.FC = () => {
  const { message } = App.useApp()
  const today = new Date()
  const [classes, setClasses] = useState<Array<{ label: string; value: string }>>([])
  const [selectedCampus, setSelectedCampus] = useState<string>('')
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [classTeacherName, setClassTeacherName] = useState<string>('')
  const [year, setYear] = useState<number>(today.getFullYear())
  const [month, setMonth] = useState<number>(today.getMonth() + 1)
  const [showAllTime, setShowAllTime] = useState<boolean>(true)

  const [dataSource, setDataSource] = useState<CotExamScoreRow[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [subjectExamInfo, setSubjectExamInfo] = useState<string>('')

  const [examOptions, setExamOptions] = useState<Array<{ label: string; value: string }>>([])
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false)
  const [form] = Form.useForm()
  // 存储所有考试的成绩数据，key 为考试信息，value 为该考试的成绩列表
  const [allExamScores, setAllExamScores] = useState<Map<string, CotExamScoreRow[]>>(new Map())

  // 导入数据相关状态
  const [importModalVisible, setImportModalVisible] = useState<boolean>(false)
  const [importText, setImportText] = useState<string>('')

  // 解析导入的数据
  // 格式示例：
  // 编号	学生姓名	科目+考试时间+班主任姓名
  // 		数学-2025.6.8-李四
  // 		考试成绩
  // 	张三	78
  // 	李四	79
  // ...
  // 合计/平均		86.5
  const parseImportData = (text: string): { examInfo: string; rows: Array<{ serialNumber: number; studentName: string; score: string }> } | null => {
    const lines = text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .trim()
      .split('\n')
      .filter((line) => line.trim())
    if (lines.length < 3) return null

    const rows: Array<{ serialNumber: number; studentName: string; score: string }> = []
    let examInfo = ''

    const normalizeExamInfo = (raw: string): string => {
      const s = String(raw || '').trim()
      if (!s) return ''

      // 兼容："时间管理+12月26日+覃健美" / "数学-2025.6.8-李四"
      const delimiter = s.includes('+') ? '+' : s.includes('-') ? '-' : null
      if (!delimiter) return s

      const parts = s
        .split(delimiter)
        .map((p) => p.trim())
        .filter(Boolean)
      if (parts.length < 2) return s

      const subject = parts[0]
      const datePart = parts[1] || ''
      const teacher = parts.slice(2).join(delimiter).trim()

      // 日期兼容：2025.6.8 / 2025-06-08 / 12月26日
      let formattedDate = datePart

      const dot = datePart.match(/(\d{4})\.(\d{1,2})\.(\d{1,2})/)
      if (dot) {
        formattedDate = `${dot[1]}-${String(dot[2]).padStart(2, '0')}-${String(dot[3]).padStart(2, '0')}`
      }

      const dash = datePart.match(/(\d{4})-(\d{1,2})-(\d{1,2})/)
      if (dash) {
        formattedDate = `${dash[1]}-${String(dash[2]).padStart(2, '0')}-${String(dash[3]).padStart(2, '0')}`
      }

      const cn = datePart.match(/^(\d{1,2})\s*月\s*(\d{1,2})\s*日?$/)
      if (cn) {
        // 没有年份时，默认用当前页面选择的 year（外层 state）
        formattedDate = `${year}-${String(cn[1]).padStart(2, '0')}-${String(cn[2]).padStart(2, '0')}`
      }

      return `${subject} ${formattedDate} ${teacher}`.trim()
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const cells = line.split(/\t/).map((cell) => cell.trim())

      // 跳过表头行
      if (cells[0] === '编号' || cells[1] === '学生姓名') continue
      // 跳过"考试成绩"行
      if (cells.some(c => c === '考试成绩')) continue
      // 跳过合计/平均行
      if (cells[0] === '合计/平均' || cells[0].includes('合计') || cells[0].includes('平均')) continue

      // 考试信息行：前两列为空，第3列为 "科目+考试时间+班主任姓名"
      if (!examInfo && cells.length >= 3 && !cells[0] && !cells[1] && cells[2]) {
        examInfo = normalizeExamInfo(cells[2])
        continue
      }

      // 学生行：编号\t姓名\t分数（你给的导入格式）
      if (cells.length >= 3) {
        const serial = parseInt(cells[0], 10)
        const studentName = String(cells[1] || '').trim()
        const score = String(cells[2] || '').trim()

        if (!Number.isNaN(serial) && studentName) {
          const scoreNum = parseFloat(score)
          if (score === '' || !Number.isNaN(scoreNum)) {
            rows.push({ serialNumber: serial, studentName, score })
            continue
          }
        }
      }

      // 兼容旧格式："\t张三\t78" 或 "张三\t78" 或 "张三\t\t78"
      const studentName = cells[1] || cells[0]
      const score = cells[2] || cells[1]

      if (studentName && /^[\u4e00-\u9fa5a-zA-Z]+$/.test(studentName)) {
        const scoreNum = parseFloat(score)
        if (!Number.isNaN(scoreNum) || score === '') {
          rows.push({
            serialNumber: rows.length + 1,
            studentName,
            score: score || '',
          })
        }
      }
    }

    if (!examInfo || rows.length === 0) return null

    rows.sort((a, b) => a.serialNumber - b.serialNumber)

    return { examInfo, rows }
  }

  // 处理导入
  const handleImport = () => {
    if (!importText.trim()) {
      message.warning('请粘贴要导入的数据')
      return
    }

    const parsed = parseImportData(importText)
    if (!parsed) {
      message.error('未能解析出有效数据，请检查数据格式')
      return
    }

    const { examInfo, rows } = parsed

    // 添加考试选项（如果不存在）
    setExamOptions((prev) => {
      const exists = prev.some((opt) => opt.value === examInfo)
      if (!exists) {
        return [...prev, { label: examInfo, value: examInfo }]
      }
      return prev
    })

    // 更新数据源
    setDataSource((prev) => {
      // 如果已有数据，合并新考试成绩
      if (prev.length > 0) {
        const importedBySerial = new Map<number, { serialNumber: number; studentName: string; score: string }>()
        const importedByName = new Map<string, { serialNumber: number; studentName: string; score: string }>()
        rows.forEach((r) => {
          importedBySerial.set(r.serialNumber, r)
          importedByName.set(String(r.studentName || '').trim(), r)
        })

        const updatedRows = prev.map((row) => {
          const bySerial = importedBySerial.get(row.serialNumber)
          const byName = importedByName.get(String(row.studentName || '').trim())

          // 优先按编号匹配；若编号匹配到但姓名不一致，则回退按姓名匹配
          const importedRow = bySerial && bySerial.studentName === row.studentName ? bySerial : byName || bySerial

          if (importedRow) {
            return {
              ...row,
              examScores: {
                ...row.examScores,
                [examInfo]: importedRow.score,
              },
            }
          }

          return {
            ...row,
            examScores: {
              ...row.examScores,
              [examInfo]: '',
            },
          }
        })

        // 添加新学生（如果导入数据中有新学生）
        const existingSerials = new Set(prev.map((r) => r.serialNumber))
        const existingNames = new Set(prev.map((r) => r.studentName))

        const newStudents = rows
          .filter((r) => !existingSerials.has(r.serialNumber) && !existingNames.has(r.studentName))
          .map((r) =>
            createRow(r.serialNumber, {
              studentName: r.studentName,
              examScores: { [examInfo]: r.score },
            }),
          )

        return [...updatedRows, ...newStudents].sort((a, b) => a.serialNumber - b.serialNumber)
      } else {
        // 如果没有数据，直接使用导入的数据
        return rows.map((r) => createRow(r.serialNumber, {
          studentName: r.studentName,
          examScores: { [examInfo]: r.score }
        }))
      }
    })

    // 设置当前选中的考试
    setSubjectExamInfo(examInfo)

    setImportModalVisible(false)
    setImportText('')
    message.success(`成功导入 ${rows.length} 条数据，考试：${examInfo}`)
  }

  // 获取当前神殿
  const currentCampus = useCampusStore((state) => state.currentCampus)

  // 加载班级列表
  useEffect(() => {
    ;(async () => {
      try {
        // 从配置中心（新的班级管理）读取
        // 只显示当前登录/顶部选择的神殿班级
        const campusNorm = (currentCampus || '').replace(/神殿$/, '').trim()
        const list = (await fetchClasses({ active: true, campus_name: campusNorm })) as ClassProfile[]
        const norm = (s: string) => (s || '').replace(/神殿$/, '').trim()

        // value 携带班主任，便于选择班级时直接回填
        const options = list
          .filter((it) => {
            // 保险：前端再过滤一次，避免接口未按神殿过滤导致串神殿
            const campus = norm(it.campus_name)
            return !campusNorm || campus === campusNorm
          })
          .map((it) => {
            const campus = norm(it.campus_name)
            const klass = (it.class_name || '').trim()
            const teacher = (it.homeroom_teacher_name || '').trim()
            return {
              label: `${campus} - ${klass}`,
              value: `${campus}||${klass}||${teacher}`,
            }
          })
        const unique = Array.from(new Map(options.map((o) => [o.value, o])).values())
        setClasses(unique)
      } catch (e) {
        console.error(e)
        message.error('加载班级列表失败')
      }
    })()
  }, [currentCampus])

  const parseScore = (s: string): number | null => {
    const n = parseFloat(String(s ?? '').replace(/[^\d.\-]/g, ''))
    return Number.isNaN(n) ? null : n
  }

  // 学生多个考试的平均分
  const computeStudentAvg = (row: CotExamScoreRow): string => {
    const nums = Object.values(row.examScores || {})
      .map(parseScore)
      .filter((n): n is number => n !== null)
    if (nums.length === 0) return ''
    const avg = nums.reduce((a, b) => a + b, 0) / nums.length
    return avg.toFixed(2)
  }

  // 底部汇总平均：
  // - 传 examInfo：计算该次考试全班平均
  // - 不传：计算“学生平均分”这一列的全班平均
  const computeSummaryAvg = (rows: CotExamScoreRow[], examInfo?: string): string => {
    const nums = rows
      .map((r) => {
        const v = examInfo ? r.examScores?.[examInfo] : computeStudentAvg(r)
        return parseScore(String(v ?? ''))
      })
      .filter((n): n is number => n !== null)
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

  // 读取并合并：以班级档案名单为准，回填当月已有成绩（行数=名单人数）
  const loadData = async (campus: string, klass: string, y: number, m: number, forceShowAllTime?: boolean) => {
    // y,m 用于“按月份”保存维度

    setLoading(true)
    try {
      const useAllTime = forceShowAllTime ?? showAllTime
      const scoreUrl = useAllTime
        ? buildApiUrl(`/teaching-quality/cot-exam-score-all?campus=${encodeURIComponent(campus)}&class=${encodeURIComponent(klass)}`)
        : buildApiUrl(`/teaching-quality/cot-exam-score?campus=${encodeURIComponent(campus)}&class=${encodeURIComponent(klass)}&year=${y}&month=${m}`)

      const [roster, resScore] = await Promise.all([
        fetchRoster(campus, klass),
        fetch(scoreUrl),
      ])

      let apiRows: ApiCotRow[] = []
      if (resScore.ok) {
        const data = (await resScore.json()) as any
        apiRows = data.行列表 || []
      } else {
        console.warn('读取当月成绩失败：', await resScore.text())
      }

      // 按学生分组，每个学生包含所有考试的成绩
      const studentMap = new Map<string, CotExamScoreRow>()
      
      // 先初始化所有学生
      if (roster.length > 0) {
        roster.forEach((r) => {
          const key = `${r.序号}__${r.姓名}`
          studentMap.set(key, createRow(r.序号, { studentName: r.姓名 }))
        })
      } else {
        // 如果没有班级档案，使用API返回的数据创建学生列表
        apiRows.forEach((r) => {
          const key = `${r.序号}__${(r.学生姓名 || '').trim()}`
          if (!studentMap.has(key)) {
            studentMap.set(key, createRow(r.序号, { studentName: (r.学生姓名 || '').trim() }))
          }
        })
      }

      // 收集所有考试信息
      const examInfos = new Set<string>()
      
      // 填充每个学生的考试成绩
      apiRows.forEach((r) => {
        const examInfo = (r.科目考试信息 || '').trim()
        if (!examInfo) return
        
        examInfos.add(examInfo)
        const key = `${r.序号}__${(r.学生姓名 || '').trim()}`
        const student = studentMap.get(key)
        if (student) {
          student.examScores[examInfo] = (r.考试成绩 || '').trim()
        }
      })

      // 更新考试选项
      const newExamOptions = Array.from(examInfos).map(info => ({
        label: info,
        value: info
      }))
      
      setExamOptions(newExamOptions)
      
      // 如果有考试数据，设置第一个为当前选中
      if (newExamOptions.length > 0) {
        setSubjectExamInfo(newExamOptions[0].value)
      } else {
        setSubjectExamInfo('')
      }
      
      // 设置数据源
      setDataSource(Array.from(studentMap.values()))
      
      // 更新所有考试数据
      const newAllExamScores = new Map<string, CotExamScoreRow[]>()
      examInfos.forEach(examInfo => {
        const examRows = Array.from(studentMap.values()).map(student => ({
          ...student,
          examScores: { [examInfo]: student.examScores[examInfo] || '' }
        }))
        newAllExamScores.set(examInfo, examRows)
      })
      setAllExamScores(newAllExamScores)
    } catch (e) {
      console.error(e)
      message.warning('未能读取素质课考试成绩')
      setDataSource([])
    } finally {
      setLoading(false)
    }
  }

  const onSelectClass = async (val: string) => {
    const [campus, klass, teacher] = String(val).split('||')
    const campusNorm = (campus || '').trim()
    const classNorm = (klass || '').trim()
    const teacherNorm = (teacher || '').trim()
    setSelectedCampus(campusNorm)
    setSelectedClass(classNorm)
    setClassTeacherName(teacherNorm)
    await loadData(campusNorm, classNorm, year, month)
  }

  const handleAddExam = () => {
    if (!selectedCampus || !selectedClass) {
      message.warning('请先选择班级')
      return
    }
    // 打开新增考试的 Modal
    setIsModalVisible(true)
    // 重置表单并设置默认值
    form.resetFields()
    form.setFieldsValue({
      examDate: dayjs(),
      teacherName: classTeacherName || '',
    })
  }

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields()
      const { subject, examDate, teacherName } = values

      // 组合成考试信息字符串
      const dateStr = examDate ? dayjs(examDate).format('YYYY-MM-DD') : ''
      const newExamInfo = `${subject || ''} ${dateStr} ${teacherName || ''}`.trim()

      if (!newExamInfo) {
        message.warning('请至少填写一项信息')
        return
      }

      // 添加到下拉选项中（如果不存在）
      setExamOptions((prev) => {
        const exists = prev.some((opt) => opt.value === newExamInfo)
        if (!exists) {
          return [...prev, { label: newExamInfo, value: newExamInfo }]
        }
        return prev
      })

      // 创建新考试的空成绩数据（基于当前学生名单）
      const newExamRows = dataSource.map((r) => ({
        ...r,
        examScores: {
          ...(r.examScores || {}),
          [newExamInfo]: '',
        },
      }))

      // 保存到所有考试数据中（保留兼容，但当前横向表格直接用 dataSource）
      setAllExamScores((prev) => {
        const newMap = new Map(prev)
        newMap.set(newExamInfo, newExamRows)
        return newMap
      })

      // 设置为当前选中的考试
      setSubjectExamInfo(newExamInfo)
      setDataSource(newExamRows)

      setIsModalVisible(false)
      message.success('已创建新考试，请录入成绩并保存')
    } catch (error) {
      console.error('表单验证失败:', error)
    }
  }

  const handleModalCancel = () => {
    setIsModalVisible(false)
    form.resetFields()
  }

  const handleChange = (key: string, field: 'studentName' | 'examScore', value: string, examInfo?: string) => {
    setDataSource((prev) => {
      const updated = prev.map((row) => {
        if (row.key !== key) return row
        if (field === 'studentName') return { ...row, studentName: value }
        const info = (examInfo || subjectExamInfo || '').trim()
        if (!info) return row
        return {
          ...row,
          examScores: {
            ...(row.examScores || {}),
            [info]: value,
          },
        }
      })
      return updated
    })
  }

  // 处理考试切换（当前版本横向展示所有考试，不再切换表格数据，仅保留下拉作为“高亮/快速定位”用途）
  const handleExamChange = (examInfo: string) => {
    setSubjectExamInfo(examInfo)
  }

  const columns: ColumnsType<CotExamScoreRow> = [
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
      width: 80,
      align: 'center',
      fixed: 'left',
      render: (text, record) => (
        <Input
          value={text}
          onChange={(e) => handleChange(record.key, 'studentName', e.target.value)}
        />
      ),
    },
    // 动态生成每次考试的列（横向展示）
    ...examOptions.map((opt) => ({
      title: opt.label,
      dataIndex: ['examScores', opt.value] as any,
      key: `exam_${opt.value}`,
      width: 140,
      align: 'center' as const,
      render: (_: any, record: CotExamScoreRow) => (
        <Input
          value={record.examScores?.[opt.value] || ''}
          onChange={(e) => handleChange(record.key, 'examScore', e.target.value, opt.value)}
        />
      ),
    })),
    {
      title: '平均分',
      key: 'avgScore',
      width: 100,
      align: 'center',
      fixed: 'right',
      render: (_text, record) => computeStudentAvg(record),
    },
  ]

  const anyContentFilled = (r: CotExamScoreRow) => {
    return Object.values(r.examScores || {}).some((s) => !!String(s || '').trim())
  }

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={
          <Space>
            <span>{selectedClass ? `${selectedClass}素质课考试成绩登记表` : 'XX班素质课考试成绩登记表'}</span>
            <span style={{ color: '#666', fontSize: 12 }}>
              班主任：{classTeacherName || '—'}
            </span>
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
              disabled={showAllTime}
            />
            <Select
              value={month}
              onChange={async (m) => {
                setMonth(m)
                if (selectedCampus && selectedClass) await loadData(selectedCampus, selectedClass, year, m)
              }}
              options={Array.from({ length: 12 }).map((_, i) => ({ label: `${i + 1}月`, value: i + 1 }))}
              style={{ width: 90 }}
              disabled={showAllTime}
            />
            <Switch
              checkedChildren="全时间"
              unCheckedChildren="按月份"
              checked={showAllTime}
              onChange={(checked) => {
                setShowAllTime(checked)
                if (selectedCampus && selectedClass) {
                  loadData(selectedCampus, selectedClass, year, month, checked)
                }
              }}
            />
          </Space>
        }
        extra={
          <Space>
            <Button icon={<ImportOutlined />} onClick={() => setImportModalVisible(true)}>导入数据</Button>
            <Button onClick={() => selectedCampus && selectedClass && loadData(selectedCampus, selectedClass, year, month)}>刷新</Button>
            <Button onClick={handleAddExam}>新增考试</Button>
            <Button
              type="primary"
              onClick={async () => {
                if (!selectedCampus || !selectedClass) {
                  message.warning('请先选择班级')
                  return
                }
                if (showAllTime) {
                  message.warning('“全时间”模式仅用于查看，请切换到“按月份”再保存')
                  return
                }

                // 按月份保存：仅保存当前选择年月内的考试（规则：考试信息里包含 YYYY-MM-DD 且属于该年月）
                const payloadRows: ApiCotRow[] = []
                const monthStr = String(month).padStart(2, '0')
                const ymPrefix = `${year}-${monthStr}`

                dataSource.forEach((r) => {
                  Object.entries(r.examScores || {}).forEach(([examInfo, score]) => {
                    if (!String(score || '').trim()) return

                    // 只保存属于当前年月的考试
                    // examInfo 形如："素质课 2026-01-10 张三"
                    if (!String(examInfo).includes(ymPrefix)) return

                    payloadRows.push(toApiRow(r.serialNumber, r.studentName, examInfo, String(score)))
                  })
                })

                try {
                  const res = await fetch(buildApiUrl('/teaching-quality/cot-exam-score'), {
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
                  await res.json()
                  message.success('保存成功')
                  await loadData(selectedCampus, selectedClass, year, month)
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
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>科目+考试时间+班主任姓名</label>
          <Select
            placeholder="可选：用于高亮/快速定位某次考试（表格已横向展示全部考试）"
            value={subjectExamInfo || undefined}
            onChange={handleExamChange}
            options={examOptions}
            style={{ maxWidth: 600, minWidth: 320 }}
            showSearch
            allowClear
          />
        </div>
        <Table<CotExamScoreRow>
          bordered
          size="small"
          columns={columns}
          dataSource={dataSource}
          loading={loading}
          pagination={false}
          rowKey="key"
          scroll={{ x: 'max-content' }}
          summary={() => {
            // 汇总行：每场考试一列平均分 + 平均分列的平均
            return (
              <Table.Summary fixed>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0}>合计/平均</Table.Summary.Cell>
                  <Table.Summary.Cell index={1} />
                  {examOptions.map((opt, idx) => (
                    <Table.Summary.Cell key={opt.value} index={2 + idx}>
                      {computeSummaryAvg(dataSource, opt.value)}
                    </Table.Summary.Cell>
                  ))}
                  <Table.Summary.Cell index={2 + examOptions.length}>
                    {computeSummaryAvg(dataSource)}
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            )
          }}
        />
      </Card>

      {/* 新增考试 Modal */}
      <Modal
        title="新增考试"
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={500}
        okText="确定"
        cancelText="取消"
      >
        <Form
          form={form}
          layout="vertical"
          autoComplete="off"
        >
          <Form.Item
            label="科目名称"
            name="subject"
            rules={[{ required: true, message: '请输入科目名称' }]}
          >
            <Input placeholder="例如：素质课" />
          </Form.Item>

          <Form.Item
            label="考试时间"
            name="examDate"
            rules={[{ required: true, message: '请选择考试时间' }]}
          >
            <DatePicker
              style={{ width: '100%' }}
              placeholder="选择考试日期"
              format="YYYY-MM-DD"
            />
          </Form.Item>

          <Form.Item
            label="班主任姓名"
            name="teacherName"
            rules={[{ required: true, message: '请输入班主任姓名' }]}
          >
            <Input placeholder="请输入班主任姓名" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 导入数据弹窗 */}
      <Modal
        title="导入素质课考试成绩数据"
        open={importModalVisible}
        onOk={handleImport}
        onCancel={() => {
          setImportModalVisible(false)
          setImportText('')
        }}
        okText="导入"
        cancelText="取消"
        width={700}
      >
        <div style={{ marginBottom: 12 }}>
          <p style={{ color: '#666', marginBottom: 8 }}>
            请粘贴从Excel或其他表格复制的数据，格式包含：科目+考试时间+班主任姓名、学生姓名、考试成绩
          </p>
          <p style={{ color: '#999', fontSize: 12, marginBottom: 4 }}>
            示例格式：
          </p>
          <pre style={{ background: '#f5f5f5', padding: 8, fontSize: 12, borderRadius: 4 }}>
{`编号	学生姓名	科目+考试时间+班主任姓名
		数学-2025.6.8-李四
		考试成绩
	张三	78
	李四	79
	王五	80`}
          </pre>
        </div>
        <Input.TextArea
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          placeholder="在此粘贴数据..."
          rows={12}
          style={{ fontFamily: 'monospace' }}
        />
      </Modal>
    </div>
  )
}

export default CotExamScoreSheet
