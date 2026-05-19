// 新生班催费记录表 · FeeReminderSheet（按班级+年月）
// 支持：选择班级/年月、自动带出班级档案名单并回填当月催费数据、刷新、保存。

import React, { useEffect, useState } from 'react'
import { App, Card, Table, Input, InputNumber, Select, Button, Space, Tag, Modal, DatePicker } from 'antd'
import { ImportOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { buildApiUrl } from '@/utils/apiBase'
import { useCampusStore } from '@/stores/campusStore'
import dayjs, { type Dayjs } from 'dayjs'

const DATE_FORMAT = 'YYYY-MM-DD'

interface FeeReminderRow {
  key: string
  serialNumber: number
  studentName: string
  major: string
  schoolingLength: string
  tuitionReceivable: number | null
  amountReceived: number | null
  arrearsAmount: number | null
  signUpDate: string
  expectedReportDate: string
  expectedReturnDates: string
  actualReturnDates: string
  actualReturnAmounts: string
  remainingReturn: number | null
  reminderRecord: string
  consultant: string
  headTeacher: string
  teacher: string
  remark: string
}

// API（中文键名）
interface ApiRow {
  序号: number
  学生姓名?: string | null
  专业?: string | null
  学制?: string | null
  学费应收?: number | null
  已收?: number | null
  欠费金额?: number | null
  报名时间?: string | null
  预计报到时间?: string | null
  预计回款时间?: string | null
  实际回款时间?: string | null
  实际回款金额?: string | null
  剩余回款?: number | null
  催费记录?: string | null
  咨询师?: string | null
  班主任?: string | null
  教员?: string | null
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
interface ClassFileRow {
  serialNumber?: number
  name?: string
  reportedMajor?: string
  schoolingLength?: string
  consultant?: string
  headTeacher?: string
}
interface ClassFileList { 行列表: ClassFileRow[] }

// 神殿教化司新生仍欠费明细表（后端返回为英文字段）
interface OutstandingFeeRow {
  serialNumber?: number
  classTeacherName?: string | null
  studentName?: string | null
  signUpDate?: string | null
  reportDate?: string | null
  major?: string | null
  programLength?: string | null
  tuitionShould?: number | null
  tuitionPaid?: number | null
  additionalPayment?: number | null
  arrearsAmount?: number | null
  consultant?: string | null
  remark?: string | null
  // 由班级档案反查出来
  campusName?: string
  className?: string
}
interface OutstandingFeeList {
  神殿名称: string
  年份: number
  月份: number
  行列表: OutstandingFeeRow[]
}

// 神殿教化司当月新生维稳明细表（后端字段为英文字段）
interface StabilityRow {
  serialNumber?: number | null
  classTeacherName?: string | null
  studentName?: string | null
  signUpDate?: string | null
  reportDate?: string | null
  major?: string | null
  programLength?: string | null
  tuitionShould?: number | null
  tuitionPaid?: number | null
  additionalPayment?: number | null
  arrearsAmount?: number | null
  consultant?: string | null
  remark?: string | null
}
interface StabilityList {
  神殿名称: string
  年份: number
  月份: number
  行列表: StabilityRow[]
}

const SCHOOLING_OPTIONS = ['6个月', '20个月', '两年', '三年'].map((v) => ({ label: v, value: v }))

const createRow = (
  serial: number,
  overrides: Partial<FeeReminderRow> = {},
): FeeReminderRow => ({
  key: String(serial),
  serialNumber: serial,
  studentName: '',
  major: '',
  schoolingLength: '',
  tuitionReceivable: null,
  amountReceived: null,
  arrearsAmount: null,
  signUpDate: '',
  expectedReportDate: '',
  expectedReturnDates: '',
  actualReturnDates: '',
  actualReturnAmounts: '',
  remainingReturn: null,
  reminderRecord: '',
  consultant: '',
  headTeacher: '',
  teacher: '',
  remark: '',
  ...overrides,
})

const fromApiRow = (r: ApiRow): FeeReminderRow => ({
  key: String(r.序号) + '::' + String(r.学生姓名 || ''),
  serialNumber: r.序号,
  studentName: (r.学生姓名 || '').trim(),
  major: (r.专业 || '').trim(),
  schoolingLength: (r.学制 || '').trim(),
  tuitionReceivable: typeof r.学费应收 === 'number' ? r.学费应收 : null,
  amountReceived: typeof r.已收 === 'number' ? r.已收 : null,
  arrearsAmount: typeof r.欠费金额 === 'number' ? r.欠费金额 : null,
  signUpDate: (r.报名时间 || '').trim(),
  expectedReportDate: (r.预计报到时间 || '').trim(),
  expectedReturnDates: (r.预计回款时间 || '').trim(),
  actualReturnDates: (r.实际回款时间 || '').trim(),
  actualReturnAmounts: (r.实际回款金额 || '').trim(),
  remainingReturn: typeof r.剩余回款 === 'number' ? r.剩余回款 : null,
  reminderRecord: (r.催费记录 || '').trim(),
  consultant: (r.咨询师 || '').trim(),
  headTeacher: (r.班主任 || '').trim(),
  teacher: (r.教员 || '').trim(),
  remark: (r.备注 || '').trim(),
})

const toApiRow = (r: FeeReminderRow): ApiRow => ({
  序号: r.serialNumber,
  学生姓名: r.studentName || undefined,
  专业: r.major || undefined,
  学制: r.schoolingLength || undefined,
  学费应收: r.tuitionReceivable ?? undefined,
  已收: r.amountReceived ?? undefined,
  欠费金额: r.arrearsAmount ?? undefined,
  报名时间: r.signUpDate || undefined,
  预计报到时间: r.expectedReportDate || undefined,
  预计回款时间: r.expectedReturnDates || undefined,
  实际回款时间: r.actualReturnDates || undefined,
  实际回款金额: r.actualReturnAmounts || undefined,
  剩余回款: r.remainingReturn ?? undefined,
  催费记录: r.reminderRecord || undefined,
  咨询师: r.consultant || undefined,
  班主任: r.headTeacher || undefined,
  教员: r.teacher || undefined,
  备注: r.remark || undefined,
})

const FeeReminderSheet: React.FC = () => {
  const { message } = App.useApp()
  const today = new Date()
  const currentCampus = useCampusStore((state) => state.currentCampus)

  const [classes, setClasses] = useState<Array<{ label: string; value: string }>>([])
  const [selectedCampus, setSelectedCampus] = useState<string>('')
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [year, setYear] = useState<number>(today.getFullYear())
  const [month, setMonth] = useState<number>(today.getMonth() + 1)

  const [dataSource, setDataSource] = useState<FeeReminderRow[]>([])
  const [loading, setLoading] = useState<boolean>(false)

  const [addOpen, setAddOpen] = useState<boolean>(false)
  const [arrearsCandidates, setArrearsCandidates] = useState<OutstandingFeeRow[]>([])
  const [arrearsLoading, setArrearsLoading] = useState<boolean>(false)
  const [selectedAddKeys, setSelectedAddKeys] = useState<string[]>([])

  // 导入数据相关状态
  const [importModalVisible, setImportModalVisible] = useState<boolean>(false)
  const [importText, setImportText] = useState<string>('')

  // 查看所有班级催费记录相关状态
  const [viewAllModalVisible, setViewAllModalVisible] = useState<boolean>(false)
  const [allClassesData, setAllClassesData] = useState<Array<FeeReminderRow & { campusName: string; className: string }>>([])
  const [allClassesLoading, setAllClassesLoading] = useState<boolean>(false)

  // 解析Excel复制的TSV数据（支持带引号的多行单元格）
  // Excel复制时，包含换行的单元格会用双引号包裹，内部的双引号会转义为两个双引号
  const parseTsvWithQuotes = (text: string): string[][] => {
    const rows: string[][] = []
    let currentRow: string[] = []
    let currentCell = ''
    let inQuotes = false
    let i = 0

    while (i < text.length) {
      const char = text[i]
      const nextChar = text[i + 1]

      if (inQuotes) {
        if (char === '"') {
          if (nextChar === '"') {
            // 转义的双引号 "" -> "
            currentCell += '"'
            i += 2
          } else {
            // 引号结束
            inQuotes = false
            i++
          }
        } else {
          currentCell += char
          i++
        }
      } else {
        if (char === '"') {
          // 引号开始
          inQuotes = true
          i++
        } else if (char === '\t') {
          // 制表符分隔
          currentRow.push(currentCell)
          currentCell = ''
          i++
        } else if (char === '\n' || (char === '\r' && nextChar === '\n')) {
          // 行结束
          currentRow.push(currentCell)
          if (currentRow.some(cell => cell.trim())) {
            rows.push(currentRow)
          }
          currentRow = []
          currentCell = ''
          i += (char === '\r' && nextChar === '\n') ? 2 : 1
        } else if (char === '\r') {
          // 单独的\r也作为行结束
          currentRow.push(currentCell)
          if (currentRow.some(cell => cell.trim())) {
            rows.push(currentRow)
          }
          currentRow = []
          currentCell = ''
          i++
        } else {
          currentCell += char
          i++
        }
      }
    }

    // 处理最后一个单元格和行
    if (currentCell || currentRow.length > 0) {
      currentRow.push(currentCell)
      if (currentRow.some(cell => cell.trim())) {
        rows.push(currentRow)
      }
    }

    return rows
  }

  // 解析粘贴的数据
  // 格式：学生姓名	专业	学制	学费应收	已收	欠费金额	报名时间	预计报到时间	预计回款时间	实际回款时间	实际回款金额	剩余回款	催费记录	咨询师	班主任	教员	备注
  // 或带序号：序号	学生姓名	专业	...
  const parseImportData = (text: string): FeeReminderRow[] => {
    const parsedRows = parseTsvWithQuotes(text)
    if (parsedRows.length === 0) return []

    const rows: FeeReminderRow[] = []
    let serialCounter = 1

    // 检测是否有序号列（第一列是否为数字）
    const firstDataRow = parsedRows.find(cells => {
      const first = (cells[0] || '').trim()
      return first !== '序号' && first !== '学生姓名' && first.length > 0
    })
    const hasSerialColumn = firstDataRow && !isNaN(parseInt(firstDataRow[0], 10)) && /^\d+$/.test(firstDataRow[0].trim())

    for (const cells of parsedRows) {
      // 跳过表头行
      const firstCell = (cells[0] || '').trim()
      if (firstCell === '序号' || firstCell === '学生姓名' || 
          (cells[1] || '').trim() === '学生姓名') continue

      // 解析数字字段
      const parseNum = (s: string): number | null => {
        const cleaned = (s || '').replace(/[^\d.\-]/g, '')
        const n = parseFloat(cleaned)
        return isNaN(n) ? null : n
      }

      // 清理文本（去除首尾空白，保留内部换行）
      const cleanText = (s: string): string => (s || '').trim()

      let row: FeeReminderRow

      if (hasSerialColumn) {
        // 有序号列的格式
        const serialNumber = parseInt(cells[0], 10)
        if (isNaN(serialNumber)) continue

        row = {
          key: String(serialNumber),
          serialNumber,
          studentName: cleanText(cells[1] || ''),
          major: cleanText(cells[2] || ''),
          schoolingLength: cleanText(cells[3] || ''),
          tuitionReceivable: parseNum(cells[4] || ''),
          amountReceived: parseNum(cells[5] || ''),
          arrearsAmount: parseNum(cells[6] || ''),
          signUpDate: cleanText(cells[7] || ''),
          expectedReportDate: cleanText(cells[8] || ''),
          expectedReturnDates: cleanText(cells[9] || ''),
          actualReturnDates: cleanText(cells[10] || ''),
          actualReturnAmounts: cleanText(cells[11] || ''),
          remainingReturn: parseNum(cells[12] || ''),
          reminderRecord: cleanText(cells[13] || ''),
          consultant: cleanText(cells[14] || ''),
          headTeacher: cleanText(cells[15] || ''),
          teacher: cleanText(cells[16] || ''),
          remark: cleanText(cells[17] || ''),
        }
      } else {
        // 无序号列的格式（从学生姓名开始）
        const studentName = cleanText(cells[0] || '')
        if (!studentName) continue

        row = {
          key: String(serialCounter),
          serialNumber: serialCounter,
          studentName,
          major: cleanText(cells[1] || ''),
          schoolingLength: cleanText(cells[2] || ''),
          tuitionReceivable: parseNum(cells[3] || ''),
          amountReceived: parseNum(cells[4] || ''),
          arrearsAmount: parseNum(cells[5] || ''),
          signUpDate: cleanText(cells[6] || ''),
          expectedReportDate: cleanText(cells[7] || ''),
          expectedReturnDates: cleanText(cells[8] || ''),
          actualReturnDates: cleanText(cells[9] || ''),
          actualReturnAmounts: cleanText(cells[10] || ''),
          remainingReturn: parseNum(cells[11] || ''),
          reminderRecord: cleanText(cells[12] || ''),
          consultant: cleanText(cells[13] || ''),
          headTeacher: cleanText(cells[14] || ''),
          teacher: cleanText(cells[15] || ''),
          remark: cleanText(cells[16] || ''),
        }
        serialCounter++
      }

      rows.push(row)
    }

    return rows
  }

  // 处理导入
  const handleImport = () => {
    if (!importText.trim()) {
      message.warning('请粘贴要导入的数据')
      return
    }

    const parsedRows = parseImportData(importText)
    if (parsedRows.length === 0) {
      message.error('未能解析出有效数据，请检查数据格式')
      return
    }

    setDataSource(parsedRows)
    setImportModalVisible(false)
    setImportText('')
    message.success(`成功导入 ${parsedRows.length} 条数据`)
  }

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

  // 拉取班级档案 -> 学生名单及默认字段
  const fetchRoster = async (
    campus: string,
    klass: string,
  ): Promise<Array<{ 序号: number; 姓名: string; 专业?: string; 学制?: string; 咨询师?: string; 班主任?: string }>> => {
    try {
      const res = await fetch(buildApiUrl(`/teaching-quality/class-file?campus=${encodeURIComponent(campus)}&class=${encodeURIComponent(klass)}`))
      if (!res.ok) throw new Error('读取班级档案失败')
      const cf = (await res.json()) as ClassFileList
      return (cf.行列表 || [])
        .map((r, idx) => ({
          序号: Number(r.serialNumber ?? idx + 1),
          姓名: (r.name || '').trim(),
          专业: (r.reportedMajor || '').trim(),
          学制: (r.schoolingLength || '').trim(),
          咨询师: (r.consultant || '').trim(),
          班主任: (r.headTeacher || '').trim(),
        }))
        .filter((r) => !!r.姓名)
        .sort((a, b) => a.序号 - b.序号)
    } catch (e) {
      console.warn('未能读取班级档案名单', e)
      return []
    }
  }

  const normName = (s: string) => (s || '').replace(/\s+/g, '').trim()
  const normDate = (s: string) => (s || '').trim()
  const makeMatchKey = (name: string, signUp: string) => `${normName(name)}__${normDate(signUp)}`
  const makeNameKey = (name: string) => `${normName(name)}`

  // 拉取神殿教化司仍欠费明细（可选：只取仍欠费金额!=0 的跨年月数据）
  const fetchOutstandingArrears = async (campus: string): Promise<OutstandingFeeRow[]> => {
    // 后端该接口保存/查询时的神殿名称通常带“神殿”后缀（例如：测试神殿）
    const campusForApi = campus.endsWith('神殿') ? campus : `${campus}神殿`
    try {
      const res = await fetch(buildApiUrl(`/teaching-quality/campus-monthly-new-stu-stability-detail?campus=${encodeURIComponent(campusForApi)}&arrears_only=true`))
      if (!res.ok) throw new Error(await res.text())
      const data = (await res.json()) as OutstandingFeeList
      return (data.行列表 || []).filter((r) => (r.arrearsAmount ?? 0) !== 0)
    } catch (e) {
      console.warn('未能读取仍欠费明细表', e)
      return []
    }
  }

  const fetchStabilityDetail = async (campus: string, y: number, m: number): Promise<StabilityRow[]> => {
    const campusForApi = campus.endsWith('神殿') ? campus : `${campus}神殿`
    try {
      const res = await fetch(buildApiUrl(`/teaching-quality/campus-monthly-new-stu-stability-detail?campus=${encodeURIComponent(campusForApi)}&year=${y}&month=${m}`))
      if (!res.ok) {
        console.warn('读取当月新生维稳明细失败：', await res.text())
        return []
      }
      const data = (await res.json()) as StabilityList
      return data.行列表 || []
    } catch (e) {
      console.warn('读取当月新生维稳明细失败', e)
      return []
    }
  }

  const saveStabilityDetail = async (campus: string, y: number, m: number, rows: StabilityRow[]) => {
    const campusForApi = campus.endsWith('神殿') ? campus : `${campus}神殿`
    const res = await fetch(buildApiUrl('/teaching-quality/campus-monthly-new-stu-stability-detail'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        神殿名称: campusForApi,
        年份: y,
        月份: m,
        行列表: rows,
      }),
    })
    if (!res.ok) throw new Error(await res.text())
    return (await res.json()) as StabilityList
  }

  const sumMoneyFromText = (text: string): number => {
    const s = (text || '')
      .replace(/[，、；;\n\r\t]+/g, ',')
      .replace(/\+/g, ',')
    const nums = s
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean)
      .map((x) => Number(x))
      .filter((n) => Number.isFinite(n))
    return nums.reduce((sum, n) => sum + n, 0)
  }

  // 读取并合并：以班级档案名单为准，回填当月催费数据（行数=名单人数）
  const loadData = async (campus: string, klass: string, y: number, m: number) => {
    setLoading(true)
    try {
      const res = await fetch(buildApiUrl(`/teaching-quality/fee-reminder?campus=${encodeURIComponent(campus)}&class=${encodeURIComponent(klass)}&year=${y}&month=${m}`))
      if (res.ok) {
        const data = (await res.json()) as ApiList
        setDataSource((data.行列表 || []).map(fromApiRow))
      } else {
        console.warn('读取当月催费失败：', await res.text())
        setDataSource([]) // 如果接口404或失败，清空列表
      }
    } catch (e) {
      console.error(e)
      message.warning('未能读取催费记录')
      setDataSource([])
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

  const handleChange = (
    key: string,
    field: keyof FeeReminderRow,
    value: string | number | null,
  ) => {
    setDataSource((prev) =>
      prev.map((row) => {
        if (row.key !== key) return row
        const updated: FeeReminderRow = { ...row, [field]: value }
        
        // 只有在修改"学费应收"或"已收"字段时，才重新计算欠费金额
        // 其他字段（如预计报到时间、预计回款时间等）修改时，欠费金额保持不变
        if (field === 'tuitionReceivable' || field === 'amountReceived') {
          const receivable = typeof updated.tuitionReceivable === 'number' ? updated.tuitionReceivable : null
          const received = typeof updated.amountReceived === 'number' ? updated.amountReceived : null
          if (receivable !== null && received !== null) {
            updated.arrearsAmount = Math.max(receivable - received, 0)
          } else {
            updated.arrearsAmount = null
          }
        }
        
        // 自动计算剩余回款 = 欠费金额 - 实际回款金额（累计）
        const arrears = typeof updated.arrearsAmount === 'number' ? updated.arrearsAmount : 0
        const actualPaid = sumMoneyFromText(updated.actualReturnAmounts || '')
        updated.remainingReturn = Math.max(arrears - actualPaid, 0)
        
        return updated
      }),
    )
  }

  const anyContentFilled = (r: FeeReminderRow) => !!(
    (r.studentName && r.studentName.trim()) ||
    (r.major && r.major.trim()) ||
    (r.schoolingLength && r.schoolingLength.trim()) ||
    r.tuitionReceivable !== null ||
    r.amountReceived !== null ||
    r.arrearsAmount !== null ||
    (r.signUpDate && r.signUpDate.trim()) ||
    (r.expectedReportDate && r.expectedReportDate.trim()) ||
    (r.expectedReturnDates && r.expectedReturnDates.trim()) ||
    (r.actualReturnDates && r.actualReturnDates.trim()) ||
    (r.actualReturnAmounts && r.actualReturnAmounts.trim()) ||
    r.remainingReturn !== null ||
    (r.reminderRecord && r.reminderRecord.trim()) ||
    (r.consultant && r.consultant.trim()) ||
    (r.headTeacher && r.headTeacher.trim()) ||
    (r.teacher && r.teacher.trim()) ||
    (r.remark && r.remark.trim())
  )

  // 加载所有班级的催费记录
  const loadAllClassesData = async () => {
    setAllClassesLoading(true)
    try {
      const allData: Array<FeeReminderRow & { campusName: string; className: string }> = []
      
      // 遍历所有班级
      for (const classOption of classes) {
        const [campus, klass] = classOption.value.split('||')
        try {
          const res = await fetch(buildApiUrl(`/teaching-quality/fee-reminder?campus=${encodeURIComponent(campus)}&class=${encodeURIComponent(klass)}&year=${year}&month=${month}`))
          if (res.ok) {
            const data = (await res.json()) as ApiList
            const classData = (data.行列表 || []).map(fromApiRow).map(row => ({
              ...row,
              campusName: campus,
              className: klass,
            }))
            allData.push(...classData)
          }
        } catch (e) {
          console.warn(`读取班级 ${campus}-${klass} 催费记录失败`, e)
        }
      }
      
      setAllClassesData(allData)
      message.success(`成功加载 ${allData.length} 条催费记录`)
    } catch (e) {
      console.error(e)
      message.error('加载所有班级催费记录失败')
    } finally {
      setAllClassesLoading(false)
    }
  }

  const columns: ColumnsType<FeeReminderRow> = [
    {
      title: '状态',
      key: 'arrearsStatus',
      width: 90,
      fixed: 'left',
      align: 'center',
      render: (_, record) => {
        const arrears = typeof record.arrearsAmount === 'number' ? record.arrearsAmount : null
        if (arrears !== null && arrears > 0) return <Tag color="red">欠费</Tag>
        if (arrears === 0) return <Tag color="green">已结清</Tag>
        return <Tag>—</Tag>
      },
    },
    {
      title: '序号',
      dataIndex: 'serialNumber',
      key: 'serialNumber',
      width: 70,
      fixed: 'left',
      align: 'center',
    },
    {
      title: '学生姓名',
      dataIndex: 'studentName',
      key: 'studentName',
      width: 100,
      fixed: 'left',
      align: 'center',
      render: (text, record) => (
        <Input
          value={text}
          onChange={(e) => handleChange(record.key, 'studentName', e.target.value)}
        />
      ),
    },
    {
      title: '专业',
      dataIndex: 'major',
      key: 'major',
      width: 140,
      align: 'center',
      render: (text, record) => (
        <Input value={text} onChange={(e) => handleChange(record.key, 'major', e.target.value)} />
      ),
    },
    {
      title: '学制',
      dataIndex: 'schoolingLength',
      key: 'schoolingLength',
      width: 140,
      align: 'center',
      render: (text, record) => (
        <Select
          value={text || undefined}
          onChange={(v) => handleChange(record.key, 'schoolingLength', v)}
          style={{ width: '100%' }}
          options={SCHOOLING_OPTIONS}
          allowClear
          placeholder="选择学制"
        />
      ),
    },
    {
      title: '学费应收',
      dataIndex: 'tuitionReceivable',
      key: 'tuitionReceivable',
      width: 110,
      align: 'center',
      render: (value, record) => (
        <InputNumber
          min={0}
          style={{ width: '100%' }}
          value={value as number | null}
          onChange={(v) => handleChange(record.key, 'tuitionReceivable', v ?? null)}
        />
      ),
    },
    {
      title: '已收',
      dataIndex: 'amountReceived',
      key: 'amountReceived',
      width: 110,
      align: 'center',
      render: (value, record) => (
        <InputNumber
          min={0}
          style={{ width: '100%' }}
          value={value as number | null}
          onChange={(v) => handleChange(record.key, 'amountReceived', v ?? null)}
        />
      ),
    },
    {
      title: '欠费金额',
      dataIndex: 'arrearsAmount',
      key: 'arrearsAmount',
      width: 110,
      align: 'center',
      render: (value) => (
        <InputNumber readOnly min={0} style={{ width: '100%' }} value={value as number | null} />
      ),
    },
    {
      title: '报名时间',
      dataIndex: 'signUpDate',
      key: 'signUpDate',
      width: 110,
      align: 'center',
      render: (text, record) => (
        <Input
          value={text}
          onChange={(e) => handleChange(record.key, 'signUpDate', e.target.value)}
        />
      ),
    },
    {
      title: '预计报到时间',
      dataIndex: 'expectedReportDate',
      key: 'expectedReportDate',
      width: 130,
      align: 'center',
      render: (text, record) => (
        <Input
          value={text}
          onChange={(e) => handleChange(record.key, 'expectedReportDate', e.target.value)}
        />
      ),
    },
    {
      title: '预计回款时间',
      dataIndex: 'expectedReturnDates',
      key: 'expectedReturnDates',
      width: 160,
      align: 'center',
      render: (text, record) => (
        <DatePicker
          style={{ width: '100%' }}
          format={DATE_FORMAT}
          value={text ? dayjs(String(text), DATE_FORMAT) : null}
          onChange={(d: Dayjs | null) => handleChange(record.key, 'expectedReturnDates', d ? d.format(DATE_FORMAT) : '')}
        />
      ),
    },
    {
      title: '实际回款时间',
      dataIndex: 'actualReturnDates',
      key: 'actualReturnDates',
      width: 160,
      align: 'center',
      render: (text, record) => (
        <DatePicker
          style={{ width: '100%' }}
          format={DATE_FORMAT}
          value={text ? dayjs(String(text), DATE_FORMAT) : null}
          onChange={(d: Dayjs | null) => handleChange(record.key, 'actualReturnDates', d ? d.format(DATE_FORMAT) : '')}
        />
      ),
    },
    {
      title: '实际回款金额',
      dataIndex: 'actualReturnAmounts',
      key: 'actualReturnAmounts',
      width: 160,
      align: 'left',
      render: (text, record) => (
        <Input.TextArea
          autoSize={{ minRows: 1, maxRows: 3 }}
          value={text}
          onChange={(e) => handleChange(record.key, 'actualReturnAmounts', e.target.value)}
        />
      ),
    },
    {
      title: '剩余回款',
      dataIndex: 'remainingReturn',
      key: 'remainingReturn',
      width: 120,
      align: 'center',
      render: (value) => (
        <InputNumber readOnly min={0} style={{ width: '100%' }} value={value as number | null} />
      ),
    },
    {
      title: '催费记录',
      dataIndex: 'reminderRecord',
      key: 'reminderRecord',
      width: 220,
      align: 'left',
      render: (text, record) => (
        <Input.TextArea
          autoSize={{ minRows: 2, maxRows: 4 }}
          value={text}
          onChange={(e) => handleChange(record.key, 'reminderRecord', e.target.value)}
        />
      ),
    },
    {
      title: '咨询师',
      dataIndex: 'consultant',
      key: 'consultant',
      width: 110,
      align: 'center',
      render: (text, record) => (
        <Input
          value={text}
          onChange={(e) => handleChange(record.key, 'consultant', e.target.value)}
        />
      ),
    },
    {
      title: '班主任',
      dataIndex: 'headTeacher',
      key: 'headTeacher',
      width: 110,
      align: 'center',
      render: (text, record) => (
        <Input
          value={text}
          onChange={(e) => handleChange(record.key, 'headTeacher', e.target.value)}
        />
      ),
    },
    {
      title: '教员',
      dataIndex: 'teacher',
      key: 'teacher',
      width: 110,
      align: 'center',
      render: (text, record) => (
        <Input value={text} onChange={(e) => handleChange(record.key, 'teacher', e.target.value)} />
      ),
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      width: 220,
      align: 'left',
      render: (text, record) => (
        <Input.TextArea
          autoSize={{ minRows: 2, maxRows: 4 }}
          value={text}
          onChange={(e) => handleChange(record.key, 'remark', e.target.value)}
        />
      ),
    },
  ]

  // 所有班级查看的列定义（只读模式，增加神殿和班级列）
  const allClassesColumns: ColumnsType<FeeReminderRow & { campusName: string; className: string }> = [
    {
      title: '神殿',
      dataIndex: 'campusName',
      key: 'campusName',
      width: 100,
      fixed: 'left',
      align: 'center',
    },
    {
      title: '班级',
      dataIndex: 'className',
      key: 'className',
      width: 120,
      fixed: 'left',
      align: 'center',
    },
    {
      title: '状态',
      key: 'arrearsStatus',
      width: 90,
      fixed: 'left',
      align: 'center',
      render: (_, record) => {
        const arrears = typeof record.arrearsAmount === 'number' ? record.arrearsAmount : null
        if (arrears !== null && arrears > 0) return <Tag color="red">欠费</Tag>
        if (arrears === 0) return <Tag color="green">已结清</Tag>
        return <Tag>—</Tag>
      },
    },
    {
      title: '序号',
      dataIndex: 'serialNumber',
      key: 'serialNumber',
      width: 70,
      align: 'center',
    },
    {
      title: '学生姓名',
      dataIndex: 'studentName',
      key: 'studentName',
      width: 100,
      align: 'center',
    },
    {
      title: '专业',
      dataIndex: 'major',
      key: 'major',
      width: 140,
      align: 'center',
    },
    {
      title: '学制',
      dataIndex: 'schoolingLength',
      key: 'schoolingLength',
      width: 100,
      align: 'center',
    },
    {
      title: '学费应收',
      dataIndex: 'tuitionReceivable',
      key: 'tuitionReceivable',
      width: 110,
      align: 'center',
    },
    {
      title: '已收',
      dataIndex: 'amountReceived',
      key: 'amountReceived',
      width: 110,
      align: 'center',
    },
    {
      title: '欠费金额',
      dataIndex: 'arrearsAmount',
      key: 'arrearsAmount',
      width: 110,
      align: 'center',
      render: (value) => (
        <span style={{ color: value > 0 ? '#ff4d4f' : undefined, fontWeight: value > 0 ? 'bold' : undefined }}>
          {value ?? '—'}
        </span>
      ),
    },
    {
      title: '报名时间',
      dataIndex: 'signUpDate',
      key: 'signUpDate',
      width: 110,
      align: 'center',
    },
    {
      title: '预计报到时间',
      dataIndex: 'expectedReportDate',
      key: 'expectedReportDate',
      width: 130,
      align: 'center',
    },
    {
      title: '预计回款时间',
      dataIndex: 'expectedReturnDates',
      key: 'expectedReturnDates',
      width: 130,
      align: 'center',
    },
    {
      title: '实际回款时间',
      dataIndex: 'actualReturnDates',
      key: 'actualReturnDates',
      width: 130,
      align: 'center',
    },
    {
      title: '实际回款金额',
      dataIndex: 'actualReturnAmounts',
      key: 'actualReturnAmounts',
      width: 160,
      align: 'left',
    },
    {
      title: '剩余回款',
      dataIndex: 'remainingReturn',
      key: 'remainingReturn',
      width: 120,
      align: 'center',
    },
    {
      title: '催费记录',
      dataIndex: 'reminderRecord',
      key: 'reminderRecord',
      width: 220,
      align: 'left',
      ellipsis: true,
    },
    {
      title: '咨询师',
      dataIndex: 'consultant',
      key: 'consultant',
      width: 110,
      align: 'center',
    },
    {
      title: '班主任',
      dataIndex: 'headTeacher',
      key: 'headTeacher',
      width: 110,
      align: 'center',
    },
    {
      title: '教员',
      dataIndex: 'teacher',
      key: 'teacher',
      width: 110,
      align: 'center',
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      width: 220,
      align: 'left',
      ellipsis: true,
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <style>{`
        .fee-reminder-arrears-row td { background: #fff2f0 !important; }
      `}</style>
      <Card
        title={
          <Space>
            <span>新生班催费记录表</span>
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
            <Button 
              type="default"
              onClick={() => {
                setViewAllModalVisible(true)
                loadAllClassesData()
              }}
            >
              查看所有班级
            </Button>
            <Button icon={<ImportOutlined />} onClick={() => setImportModalVisible(true)}>导入数据</Button>
            <Button onClick={() => selectedCampus && selectedClass && loadData(selectedCampus, selectedClass, year, month)}>刷新</Button>
            <Button
              onClick={async () => {
                if (!selectedCampus || !selectedClass) {
                  message.warning('请先选择班级')
                  return
                }
                setAddOpen(true)
                setArrearsLoading(true)
                try {
                  // 欠费明细是按神殿给的，所以这里需要：欠费明细 ∩ 本班名单
                  const [arrearsRows, roster] = await Promise.all([
                    fetchOutstandingArrears(selectedCampus),
                    fetchRoster(selectedCampus, selectedClass),
                  ])
                  const rosterMap = new Map<string, { 姓名: string; 班主任?: string; 专业?: string; 学制?: string; 咨询师?: string }>()
                  roster.forEach((r) => {
                    rosterMap.set(makeNameKey(r.姓名), r)
                  })

                  // 欠费明细表没有班级字段：这里按“本班名单”来筛选，再叠加“班主任姓名”提高准确度
                  // 匹配规则：
                  // 1) 必须在本班名单中（姓名匹配）
                  // 2) 若欠费明细给了班主任姓名，则要求与本班档案中的班主任一致（不一致则剔除，避免重名串班）
                  const candidates = arrearsRows.filter((a) => {
                    const nameKey = makeNameKey(a.studentName || '')
                    const rosterHit = rosterMap.get(nameKey)
                    if (!rosterHit) return false
                    const arrearsTeacher = (a.classTeacherName || '').trim()
                    const rosterTeacher = (rosterHit.班主任 || '').trim()
                    if (arrearsTeacher && rosterTeacher && arrearsTeacher !== rosterTeacher) return false
                    return true
                  })

                  setArrearsCandidates(
                    candidates.map((a) => {
                      const hit = rosterMap.get(makeNameKey(a.studentName || ''))
                      return {
                        ...a,
                        // 用班级档案补全静态字段（优先保持欠费明细里的值）
                        major: (a.major || '').trim() || (hit?.专业 || ''),
                        programLength: (a.programLength || '').trim() || (hit?.学制 || ''),
                        consultant: (a.consultant || '').trim() || (hit?.咨询师 || ''),
                      }
                    }),
                  )
                  setSelectedAddKeys([])
                } catch (e) {
                  console.error(e)
                  message.error('读取欠费学生失败')
                  setArrearsCandidates([])
                } finally {
                  setArrearsLoading(false)
                }
              }}
            >
              新增（从欠费学生选择）
            </Button>
            <Button
              type="primary"
              onClick={async () => {
                if (!selectedCampus || !selectedClass) {
                  message.warning('请先选择班级')
                  return
                }
                const payloadRows: ApiRow[] = dataSource
                  .filter((r) => anyContentFilled(r))
                  .map((r) => toApiRow(r))
                if (payloadRows.length === 0) {
                  message.warning('没有需要保存的数据')
                  return
                }
                try {
                  // 1) 先联动更新：神殿教化司新生维稳明细表（补款金额/仍欠费金额）
                  // 根据学生的报名时间确定应该更新哪个月份的维稳明细表
                  try {
                    // 按报名时间的年月分组
                    const byYearMonth = new Map<string, { y: number; m: number; students: Array<{ name: string; signUp: string; addPay: number; arrears: number }> }>()
                    for (const fr of dataSource) {
                      if (!fr.studentName || !fr.signUpDate) continue
                      // 解析报名时间，获取年月
                      const signUpDate = fr.signUpDate.trim()
                      const parsed = dayjs(signUpDate, ['YYYY-MM-DD', 'YYYY/MM/DD', 'YYYY-M-D', 'YYYY/M/D'], true)
                      if (!parsed.isValid()) continue
                      const signUpYear = parsed.year()
                      const signUpMonth = parsed.month() + 1
                      const ymKey = `${signUpYear}-${signUpMonth}`
                      
                      const addPay = sumMoneyFromText(fr.actualReturnAmounts || '')
                      const arrears = typeof fr.remainingReturn === 'number'
                        ? fr.remainingReturn
                        : (typeof fr.arrearsAmount === 'number' ? fr.arrearsAmount : 0)
                      
                      if (!byYearMonth.has(ymKey)) {
                        byYearMonth.set(ymKey, { y: signUpYear, m: signUpMonth, students: [] })
                      }
                      byYearMonth.get(ymKey)!.students.push({
                        name: fr.studentName,
                        signUp: signUpDate,
                        addPay,
                        arrears,
                      })
                    }

                    // 对每个年月分别更新维稳明细表
                    for (const [, { y, m, students }] of byYearMonth.entries()) {
                      const stabilityRows = await fetchStabilityDetail(selectedCampus, y, m)
                      if (!stabilityRows.length) continue
                      
                      const byKey = new Map(stabilityRows.map((r) => [makeMatchKey(r.studentName || '', r.signUpDate || ''), r]))

                      // 按"姓名+报名时间"聚合，取补款金额(累计)最大值
                      const agg = new Map<string, { additionalPayment: number; arrearsAmount: number }>()
                      for (const stu of students) {
                        const k = makeMatchKey(stu.name, stu.signUp)
                        const prev = agg.get(k)
                        if (!prev) {
                          agg.set(k, { additionalPayment: stu.addPay, arrearsAmount: stu.arrears })
                        } else {
                          agg.set(k, {
                            additionalPayment: Math.max(prev.additionalPayment, stu.addPay),
                            arrearsAmount: Math.min(prev.arrearsAmount, stu.arrears),
                          })
                        }
                      }

                      let changed = false
                      for (const [k, v] of agg.entries()) {
                        const row = byKey.get(k)
                        if (!row) continue
                        if ((row.additionalPayment ?? 0) !== v.additionalPayment) {
                          row.additionalPayment = v.additionalPayment
                          changed = true
                        }
                        if ((row.arrearsAmount ?? 0) !== v.arrearsAmount) {
                          row.arrearsAmount = v.arrearsAmount
                          changed = true
                        }
                      }

                      if (changed) {
                        await saveStabilityDetail(selectedCampus, y, m, stabilityRows)
                      }
                    }
                  } catch (e) {
                    console.warn('联动更新维稳明细失败（不影响催费表保存）', e)
                  }

                  // 2) 再保存催费记录表
                  const res = await fetch(buildApiUrl('/teaching-quality/fee-reminder'), {
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
                  // 保存后按当前名单映射更新字段
                  setDataSource((prev) => {
                    const byKey = new Map(rows.map((r) => [`${r.serialNumber}__${r.studentName}`, r]))
                    return prev.map((p) => byKey.get(`${p.serialNumber}__${p.studentName}`) || p)
                  })
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
        <Table<FeeReminderRow>
          bordered
          size="small"
          columns={columns}
          dataSource={dataSource}
          pagination={false}
          rowKey="key"
          scroll={{ x: 'max-content' }}
          loading={loading}
          rowClassName={(record) => {
            const arrears = record.arrearsAmount ?? 0
            return arrears > 0 ? 'fee-reminder-arrears-row' : ''
          }}
        />
        <Modal
          title="选择欠费学生（仅显示本班候选）"
          open={addOpen}
          onCancel={() => setAddOpen(false)}
          okText="新增"
          cancelText="取消"
          confirmLoading={arrearsLoading}
          onOk={() => {
            if (!selectedAddKeys.length) {
              message.warning('请先勾选要新增的学生')
              return
            }
            const selected = arrearsCandidates.filter((c) => selectedAddKeys.includes(makeMatchKey(c.studentName || '', c.signUpDate || '')))
            setDataSource((prev) => {
              const maxSerial = prev.reduce((mx, r) => Math.max(mx, r.serialNumber || 0), 0)
              let nextSerial = maxSerial
              const toAdd: FeeReminderRow[] = []
              for (const s of selected) {
                nextSerial += 1
                const uniqueKey = `${makeMatchKey(s.studentName || '', s.signUpDate || '')}__${Date.now()}__${Math.random().toString(16).slice(2)}`
                toAdd.push(
                  createRow(nextSerial, {
                    key: uniqueKey,
                    studentName: (s.studentName || '').trim(),
                    major: (s.major || '').trim(),
                    schoolingLength: (s.programLength || '').trim(),
                    tuitionReceivable: typeof s.tuitionShould === 'number' ? s.tuitionShould : null,
                    amountReceived: typeof s.tuitionPaid === 'number' ? s.tuitionPaid : null,
                    arrearsAmount: typeof s.arrearsAmount === 'number' ? s.arrearsAmount : null,
                    signUpDate: (s.signUpDate || '').trim(),
                    expectedReportDate: (s.reportDate || '').trim(),
                    consultant: (s.consultant || '').trim(),
                    headTeacher: (s.classTeacherName || '').trim(),
                  }),
                )
              }
              return [...prev, ...toAdd]
            })
            setAddOpen(false)
          }}
        >
          <Table<OutstandingFeeRow>
            size="small"
            rowKey={(r) => makeMatchKey(r.studentName || '', r.signUpDate || '')}
            loading={arrearsLoading}
            dataSource={arrearsCandidates}
            pagination={{ pageSize: 8 }}
            rowSelection={{
              selectedRowKeys: selectedAddKeys,
              onChange: (keys) => setSelectedAddKeys(keys as string[]),
            }}
            columns={[
              { title: '新生姓名', dataIndex: 'studentName', key: 'studentName', width: 110 },
              { title: '报名时间', dataIndex: 'signUpDate', key: 'signUpDate', width: 110 },
              { title: '专业', dataIndex: 'major', key: 'major', width: 120 },
              { title: '学制', dataIndex: 'programLength', key: 'programLength', width: 100 },
              { title: '仍欠费', dataIndex: 'arrearsAmount', key: 'arrearsAmount', width: 90 },
              { title: '咨询师', dataIndex: 'consultant', key: 'consultant', width: 110 },
              { title: '班主任', dataIndex: 'classTeacherName', key: 'classTeacherName', width: 110 },
            ]}
          />
          <div style={{ color: '#666', marginTop: 8 }}>
            说明：欠费明细表没有班级字段，这里先用“姓名”过滤为本班候选；如存在重名，建议后续改为“姓名+报名时间”二次确认或后端增加 studentId。
          </div>
        </Modal>

      {/* 导入数据弹窗 */}
      <Modal
        title="导入新生班催费记录数据"
        open={importModalVisible}
        onOk={handleImport}
        onCancel={() => {
          setImportModalVisible(false)
          setImportText('')
        }}
        okText="导入"
        cancelText="取消"
        width={800}
      >
        <div style={{ marginBottom: 12 }}>
          <p style={{ color: '#666', marginBottom: 8 }}>
            请粘贴从Excel或其他表格复制的数据，格式为：序号、学生姓名、专业、学制、学费应收、已收、欠费金额、报名时间、预计报到时间、预计回款时间、实际回款时间、实际回款金额、剩余回款、催费记录、咨询师、班主任、教员、备注（用制表符分隔）
          </p>
          <p style={{ color: '#999', fontSize: 12 }}>
            示例：1	张三	网络云运维	20个月	37800	5000	32800	7.1	7.3	7.7	8.1	20000	12800	时间：7.7	张老师	李老师	王老师	分期付款
          </p>
        </div>
        <Input.TextArea
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          placeholder="在此粘贴数据..."
          rows={14}
          style={{ fontFamily: 'monospace' }}
        />
      </Modal>

      {/* 查看所有班级催费记录弹窗 */}
      <Modal
        title={`所有班级催费记录 - ${year}年${month}月`}
        open={viewAllModalVisible}
        onCancel={() => setViewAllModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setViewAllModalVisible(false)}>
            关闭
          </Button>,
        ]}
        width="95%"
        style={{ top: 20 }}
      >
        <div style={{ marginBottom: 16 }}>
          <Space>
            <span>共 {allClassesData.length} 条记录</span>
            <span style={{ color: '#999' }}>|</span>
            <span>
              欠费学生：
              <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
                {allClassesData.filter(r => (r.arrearsAmount ?? 0) > 0).length}
              </span> 人
            </span>
            <span style={{ color: '#999' }}>|</span>
            <span>
              总欠费金额：
              <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
                {allClassesData.reduce((sum, r) => sum + (r.arrearsAmount ?? 0), 0).toFixed(2)}
              </span> 元
            </span>
          </Space>
        </div>
        <Table<FeeReminderRow & { campusName: string; className: string }>
          bordered
          size="small"
          columns={allClassesColumns}
          dataSource={allClassesData}
          pagination={{ 
            defaultPageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          rowKey={(record) => `${record.campusName}-${record.className}-${record.key}`}
          scroll={{ x: 'max-content', y: 600 }}
          loading={allClassesLoading}
          rowClassName={(record) => {
            const arrears = record.arrearsAmount ?? 0
            return arrears > 0 ? 'fee-reminder-arrears-row' : ''
          }}
        />
      </Modal>
      </Card>
    </div>
  )
}

export default FeeReminderSheet
