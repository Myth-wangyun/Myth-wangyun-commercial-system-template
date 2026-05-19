/**
 * 005 XX神殿后端每日新生安排表（已接入后端保存/加载）
 * 功能：记录每日新生到校安排、财务收款、教学落地信息
 */

import React, { useMemo, useState, useEffect, useRef } from 'react'
import { App, Card, Table, Button, Space, Select, Input, DatePicker, InputNumber } from 'antd'
import {
  PlusOutlined,
  SaveOutlined,
  EditOutlined,
  ReloadOutlined,
  DownloadOutlined,
  CloudDownloadOutlined,
  CameraOutlined,
  ImportOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import isBetween from 'dayjs/plugin/isBetween'

dayjs.extend(isBetween)
import { useCampusStore } from '@/stores/campusStore'
import { fetchMajors } from '@/services/configMaster'

const { Option } = Select

import { buildApiUrl } from '@/utils/apiBase'

interface DailyNewStudentRecord {
  key: string
  index: number
  studentName: string
  age?: number
  gender?: '男' | '女'
  major?: string
  eduSystem?: string
  concern?: string
  shouldPay?: number
  paidAmount?: number
  debtAmount?: number
  estimatedPayDate?: string
  courseContent?: string
  courseLocation?: string
  enrollDate?: string
  courseDays?: number
  planner?: string
  homeroomTeacher?: string
  instructor?: string
  remark?: string
  filler?: string
  fillDate?: string
}

// 神殿教化司当月新生维稳明细表（后端返回 Row 结构）
interface MonthlyStabilityDetailRow {
  serialNumber?: number
  classTeacherName?: string
  studentName?: string
  signUpDate?: string
  reportDate?: string
  major?: string
  programLength?: string
  tuitionShould?: number
  tuitionPaid?: number
  additionalPayment?: number
  arrearsAmount?: number
  isFullPayment?: string
  isLoan?: string
  hasAttendedClass?: string
  trialPeriod?: string // 试学周期：常见格式如 “2026-01-01至2026-01-07”
  isRefund?: string
  refundTime?: string
  refundNote?: string
  consultant?: string
  hasAccommodation?: string
  dormName?: string
  remark?: string
}

const DailyNewStudentSchedulePage: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus, getAllCampuses } = useCampusStore()
  const campusList = useMemo(() => getAllCampuses(), [getAllCampuses])
  const [selectedCampus, setSelectedCampus] = useState<string>(currentCampus || '')
  const [selectedDate, setSelectedDate] = useState<string>(dayjs().format('YYYY-MM-DD'))
  const [editMode, setEditMode] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const [dataSource, setDataSource] = useState<DailyNewStudentRecord[]>([])
  const [majors, setMajors] = useState<string[]>([])
  const [exportingScreenshot, setExportingScreenshot] = useState<boolean>(false)
  const tableRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadMajors = async () => {
      if (!selectedCampus) {
        setMajors([])
        return
      }
      try {
        // 配置中心：/config/majors
        // 返回结构：MajorProfile[]，其中包含 campus_name / name
        const majorRes = await fetchMajors({ campus_name: selectedCampus, active: true })
        setMajors(majorRes.map((m) => m.name).filter(Boolean))
      } catch (e) {
        console.error('Error fetching majors:', e)
        message.error('加载专业列表失败')
      }
    }
    loadMajors()
  }, [selectedCampus])

  useEffect(() => {
    if (selectedCampus && selectedDate) {
      loadFromBackend()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCampus, selectedDate])

  const updateRecord = (
    key: string,
    field: keyof DailyNewStudentRecord,
    value: string | number | undefined,
  ) => {
    setDataSource((prev) =>
      prev.map((record) => {
        if (record.key === key) {
          const updated = { ...record, [field]: value }
          // 自动计算欠费金额：应收金额 - 已收金额
          if (field === 'shouldPay' || field === 'paidAmount') {
            const shouldPay = field === 'shouldPay' ? (value as number) : (record.shouldPay || 0)
            const paidAmount = field === 'paidAmount' ? (value as number) : (record.paidAmount || 0)
            updated.debtAmount = Math.max(0, (shouldPay || 0) - (paidAmount || 0))
          }
          return updated
        }
        return record
      }),
    )
  }

  const handleAddRow = () => {
    const newRecord: DailyNewStudentRecord = {
      key: `${Date.now()}`,
      index: dataSource.length + 1,
      studentName: '',
      gender: '男',
      fillDate: selectedDate,
      enrollDate: selectedDate,
    }
    setDataSource((prev) => [...prev, newRecord])
    message.success('已新增一条记录')
  }

  const handleDelete = (key: string) => {
    const filtered = dataSource.filter((record) => record.key !== key)
    const reIndexed = filtered.map((item, idx) => ({ ...item, index: idx + 1 }))
    setDataSource(reIndexed)
    message.success('删除成功')
  }

  const handleToggleEdit = () => setEditMode((prev) => !prev)

  // 后端：加载
  const loadFromBackend = async () => {
    if (!selectedCampus) { message.warning('请先选择神殿'); return }
    try {
      setLoading(true)
      const url = `${buildApiUrl('/teaching-quality/daily-new-student-schedule')}?campus=${encodeURIComponent(selectedCampus)}&date=${selectedDate}`
      console.log('[DEBUG] Loading from:', url)
      const res = await fetch(url)
      console.log('[DEBUG] Response status:', res.status, res.statusText)
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json() as { 行列表: any[] }
      console.log('[DEBUG] Loaded data:', data)
      const rows = (data.行列表 || []).map((r, idx) => ({
        key: String(idx + 1),
        index: r.序号 || (idx + 1),
        studentName: r.姓名 || '',
        age: r.年龄 ?? undefined,
        gender: r.性别 || '男',
        major: r.所报专业 || '',
        eduSystem: r.学制 || '',
        concern: r.抗拒点关注点 || '',
        shouldPay: r.应收金额 ?? undefined,
        paidAmount: r.已收金额 ?? undefined,
        debtAmount: r.欠费金额 ?? undefined,
        estimatedPayDate: r.预计回款时间 || undefined,
        courseContent: r.授课内容 || '',
        courseLocation: r.授课地点 || '',
        enrollDate: r.入学日期 || undefined,
        courseDays: r.上课天数 ?? undefined,
        planner: r.规划师 || '',
        homeroomTeacher: r.班主任 || '',
        instructor: r.教员 || '',
        remark: r.备注 || '',
        filler: r.填表人 || '',
        fillDate: r.填表时间 || undefined,
      })) as DailyNewStudentRecord[]
      setDataSource(rows)
      message.success('已加载')
    } catch (e: any) {
      console.error(e)
      message.error('加载失败：' + (e?.message || '未知错误'))
    } finally {
      setLoading(false)
    }
  }

  // 后端：保存
  const saveToBackend = async () => {
    if (!selectedCampus) { message.warning('请先选择神殿'); return }
    try {
      setLoading(true)
      const payload = {
        神殿名称: selectedCampus,
        记录日期: selectedDate,
        行列表: dataSource.map((r, i) => ({
          序号: i + 1,
          姓名: r.studentName || null,
          年龄: r.age ?? null,
          性别: r.gender || null,
          所报专业: r.major || null,
          学制: r.eduSystem || null,
          抗拒点关注点: r.concern || null,
          应收金额: r.shouldPay ?? null,
          已收金额: r.paidAmount ?? null,
          欠费金额: r.debtAmount ?? null,
          预计回款时间: r.estimatedPayDate || null,
          授课内容: r.courseContent || null,
          授课地点: r.courseLocation || null,
          入学日期: r.enrollDate || null,
          上课天数: r.courseDays ?? null,
          规划师: r.planner || null,
          班主任: r.homeroomTeacher || null,
          教员: r.instructor || null,
          备注: r.remark || null,
          填表人: r.filler || null,
          填表时间: r.fillDate || null,
        }))
      }
      const res = await fetch(buildApiUrl('/teaching-quality/daily-new-student-schedule'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error(await res.text())
      await loadFromBackend()
      message.success('保存成功')
    } catch (e: any) {
      console.error(e)
      message.error('保存失败：' + (e?.message || '未知错误'))
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setEditMode(false)
    await saveToBackend()
  }

  const handleRefresh = async () => {
    await loadFromBackend()
  }

  const handleExport = () => {
    message.info('导出功能开发中')
  }

  // 从「神殿教化司当月新生维稳明细表」导入：规则 = selectedDate 在 试学周期 内
  // 说明：每日新生安排表里有但维稳表没有的字段（如 授课内容/地点/教员等），导入后保持为空，后续手动填写。
  const handleImportFromMonthlyStabilityDetail = async () => {
    if (!selectedCampus) {
      message.warning('请先选择神殿')
      return
    }

    try {
      setLoading(true)

      const dateObj = dayjs(selectedDate)
      const year = dateObj.year()
      const month = dateObj.month() + 1

      const url = `${buildApiUrl('/teaching-quality/campus-monthly-new-stu-stability-detail')}?campus=${encodeURIComponent(selectedCampus)}&year=${year}&month=${month}`
      const res = await fetch(url)
      if (!res.ok) throw new Error(await res.text())

      const data = (await res.json()) as { 行列表?: MonthlyStabilityDetailRow[] }
      const rows = data.行列表 || []

      if (!rows.length) {
        message.info('维稳明细表暂无数据')
        return
      }

      // 解析「试学周期」：兼容常见写法
      // - 2026-01-01至2026-01-07
      // - 2026/01/01-2026/01/07
      // - 2026.01.01 ~ 2026.01.07
      const parseTrialPeriod = (trialPeriod?: string): { start?: dayjs.Dayjs; end?: dayjs.Dayjs } => {
        if (!trialPeriod) return {}
        const raw = String(trialPeriod).trim()
        if (!raw) return {}

        // 统一分隔符：至 / ～ / ~ / — 等
        const normalized = raw
          .replace(/\s+/g, '')
          .replace(/至/g, '~')
          .replace(/～|—|–|−|－/g, '~')

        // 用 ~ 作为唯一分隔符（不要用 '-'，因为日期本身包含 '-'）
        const parts = normalized.split('~').filter(Boolean)
        if (parts.length < 2) return {}

        const startStr = parts[0]
        const endStr = parts[1]

        const start = dayjs(startStr)
        const end = dayjs(endStr)
        if (!start.isValid() || !end.isValid()) return {}
        return { start, end }
      }

      const targetDate = dayjs(selectedDate)

      // 只导入：selectedDate 落在试学周期（含起止）
      const matched = rows.filter((r) => {
        const { start, end } = parseTrialPeriod(r.trialPeriod)
        if (!start || !end) return false
        return targetDate.isBetween(start.startOf('day'), end.endOf('day'), null, '[]')
      })

      if (!matched.length) {
        message.info('没有找到“试学周期包含所选日期”的学生')
        return
      }

      // 去重策略：同名 + 专业 视为同一个（避免重复导入）
      const existedKeySet = new Set(
        dataSource.map((r) => `${(r.studentName || '').trim()}__${(r.major || '').trim()}`),
      )

      const imported: DailyNewStudentRecord[] = []
      for (const r of matched) {
        const name = (r.studentName || '').trim()
        const major = (r.major || '').trim()
        if (!name) continue

        const k = `${name}__${major}`
        if (existedKeySet.has(k)) continue
        existedKeySet.add(k)

        const shouldPay = r.tuitionShould ?? undefined
        const paidAmount =
          (r.tuitionPaid ?? 0) + (r.additionalPayment ?? 0) || undefined
        const debtAmount =
          shouldPay !== undefined
            ? Math.max(0, (shouldPay || 0) - (paidAmount || 0))
            : r.arrearsAmount ?? undefined

        imported.push({
          key: `import-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          index: 0, // 稍后统一重排
          studentName: name,
          // 维稳表没有：年龄/性别/抗拒点关注点（字段不同），这里先不填，保持手动输入
          major: major || undefined,
          eduSystem: r.programLength || undefined,
          shouldPay,
          paidAmount,
          debtAmount,
          enrollDate: r.reportDate || selectedDate, // 报道时间优先，否则用当天
          planner: r.consultant || undefined,
          homeroomTeacher: r.classTeacherName || undefined,
          remark: r.remark || undefined,
          filler: undefined,
          fillDate: selectedDate,

          // 每日安排表特有字段：留空，方便手动补
          concern: undefined,
          estimatedPayDate: undefined,
          courseContent: undefined,
          courseLocation: undefined,
          courseDays: undefined,
          instructor: undefined,
          age: undefined,
          gender: undefined,
        })
      }

      if (!imported.length) {
        message.info('符合条件的数据已全部在当前表格中，无需重复导入')
        return
      }

      // 合并并重排序号
      setDataSource((prev) => {
        const merged = [...prev, ...imported]
        return merged.map((item, idx) => ({ ...item, index: idx + 1 }))
      })

      message.success(`导入成功：${imported.length} 条（请手动补全每日安排表缺失字段）`)
    } catch (e: any) {
      console.error(e)
      message.error('导入失败：' + (e?.message || '未知错误'))
    } finally {
      setLoading(false)
    }
  }

  // 导出截图功能
  const handleExportScreenshot = async () => {
    if (!tableRef.current) {
      message.error('无法获取表格元素')
      return
    }

    try {
      setExportingScreenshot(true)
      message.loading({ content: '正在生成截图...', key: 'screenshot', duration: 0 })

      // 等待一小段时间确保DOM完全渲染
      await new Promise(resolve => setTimeout(resolve, 300))
      const { default: html2canvas } = await import('html2canvas')

      // 计算表格完整宽度（用于解决横向滚动导致截图不全的问题）
      const rootEl = tableRef.current
      const scrollBody =
        (rootEl.querySelector('.ant-table-body') as HTMLElement | null) ||
        (rootEl.querySelector('.ant-table-content') as HTMLElement | null)
      const tableEl = rootEl.querySelector('.ant-table-content table') as HTMLTableElement | null

      const fullWidth =
        tableEl?.scrollWidth ||
        scrollBody?.scrollWidth ||
        rootEl.scrollWidth ||
        rootEl.clientWidth
      const fullHeight =
        rootEl.scrollHeight || scrollBody?.scrollHeight || rootEl.clientHeight

      // 使用 html2canvas 生成截图
      const canvas = await html2canvas(tableRef.current, {
        scale: 2, // 提高清晰度
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: Math.max(fullWidth, rootEl.clientWidth),
        windowHeight: Math.max(fullHeight, rootEl.clientHeight),
        onclone: (doc) => {
          // 在克隆 DOM 中，把 antd 表格的滚动容器展开为完整宽度，避免截图只截到可视区域
          const clonedRoot = doc.querySelector(
            '[data-screenshot-root="daily-new-student-schedule"]',
          ) as HTMLElement | null
          if (!clonedRoot) return

          const clonedScrollBody =
            (clonedRoot.querySelector('.ant-table-body') as HTMLElement | null) ||
            (clonedRoot.querySelector('.ant-table-content') as HTMLElement | null)
          const clonedTable = clonedRoot.querySelector(
            '.ant-table-content table',
          ) as HTMLTableElement | null

          const targetWidth =
            clonedTable?.scrollWidth ||
            clonedScrollBody?.scrollWidth ||
            fullWidth

          // 让容器不裁剪内容，并强制展开宽度
          clonedRoot.style.overflow = 'visible'
          clonedRoot.style.width = `${targetWidth}px`
          if (clonedScrollBody) {
            clonedScrollBody.style.overflowX = 'visible'
            clonedScrollBody.style.overflowY = 'visible'
            clonedScrollBody.style.width = `${targetWidth}px`
            clonedScrollBody.style.maxWidth = 'none'
            ;(clonedScrollBody.style as any).maxHeight = 'none'
          }
          const clonedContainer = clonedRoot.querySelector(
            '.ant-table-container',
          ) as HTMLElement | null
          if (clonedContainer) {
            clonedContainer.style.overflow = 'visible'
            clonedContainer.style.width = `${targetWidth}px`
            clonedContainer.style.maxWidth = 'none'
          }
          const clonedTableWrapper = clonedRoot.querySelector(
            '.ant-table',
          ) as HTMLElement | null
          if (clonedTableWrapper) {
            clonedTableWrapper.style.width = `${targetWidth}px`
          }
        },
      })

      // 将 canvas 转换为 blob
      canvas.toBlob((blob) => {
        if (!blob) {
          message.error({ content: '生成截图失败', key: 'screenshot' })
          return
        }

        // 创建下载链接
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        const fileName = `${selectedCampus || '神殿'}_每日新生安排表_${selectedDate}.png`
        link.href = url
        link.download = fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

        message.success({ content: '截图已下载', key: 'screenshot' })
      }, 'image/png')
    } catch (error) {
      console.error('导出截图失败:', error)
      message.error({ content: '导出截图失败：' + (error as Error).message, key: 'screenshot' })
    } finally {
      setExportingScreenshot(false)
    }
  }

  const renderInput = (
    record: DailyNewStudentRecord,
    field: keyof DailyNewStudentRecord,
    placeholder = '',
    isNumber = false,
  ) => {
    if (!editMode) {
      const value = record[field]
      return <span>{value ?? '-'}</span>
    }

    if (isNumber) {
      return (
        <InputNumber
          value={record[field] as number | undefined}
          onChange={(value) => updateRecord(record.key, field, value ?? undefined)}
          placeholder={placeholder}
          min={0}
          style={{ width: '100%' }}
        />
      )
    }

    return (
      <Input
        value={(record[field] as string) ?? ''}
        placeholder={placeholder}
        onChange={(e) => updateRecord(record.key, field, e.target.value)}
      />
    )
  }

  const columns: ColumnsType<DailyNewStudentRecord> = [
    { title: '序号', dataIndex: 'index', width: 70, align: 'center', fixed: 'left' },
    {
      title: '新生姓名',
      dataIndex: 'studentName',
      width: 120,
      fixed: 'left',
      render: (_, record) => renderInput(record, 'studentName', '请输入姓名'),
    },
    {
      title: '年龄',
      dataIndex: 'age',
      width: 80,
      align: 'center',
      render: (_, record) => renderInput(record, 'age', '', true),
    },
    {
      title: '性别',
      dataIndex: 'gender',
      width: 80,
      align: 'center',
      render: (_, record) =>
        editMode ? (
          <Select
            value={record.gender}
            style={{ width: '100%' }}
            onChange={(value) => updateRecord(record.key, 'gender', value)}
          >
            <Option value="男">男</Option>
            <Option value="女">女</Option>
          </Select>
        ) : (
          (record.gender ?? '-')
        ),
    },
    {
      title: '所报专业',
      dataIndex: 'major',
      width: 140,
      render: (_: any, record) =>
        editMode ? (
          <Select
            value={record.major || undefined}
            style={{ width: '100%' }}
            placeholder="选择专业"
            showSearch
            optionFilterProp="children"
            allowClear
            onChange={(value) => updateRecord(record.key, 'major', value)}
          >
            {majors.map((m) => (
              <Option key={m} value={m}>
                {m}
              </Option>
            ))}
          </Select>
        ) : (
          (record.major ?? '-')
        ),
    },
    {
      title: '学制',
      dataIndex: 'eduSystem',
      width: 110,
      render: (_: any, record) =>
        editMode ? (
          <Select
            value={record.eduSystem || undefined}
            style={{ width: '100%' }}
            placeholder="请选择学制"
            allowClear
            onChange={(value) => updateRecord(record.key, 'eduSystem', value)}
          >
            <Option value="6个月">6个月</Option>
            <Option value="20个月">20个月</Option>
            <Option value="两年">两年</Option>
            <Option value="三年">三年</Option>
          </Select>
        ) : (
          (record.eduSystem ?? '-')
        ),
    },
    { title: '抗拒点/关注点', dataIndex: 'concern', width: 180, render: (_, r) => renderInput(r, 'concern') },
    { title: '应收金额', dataIndex: 'shouldPay', width: 120, render: (_, r) => renderInput(r, 'shouldPay', '', true) },
    { title: '已收金额', dataIndex: 'paidAmount', width: 120, render: (_, r) => renderInput(r, 'paidAmount', '', true) },
    {
      title: '欠费金额',
      dataIndex: 'debtAmount',
      width: 120,
      render: (_, record) =>
        editMode ? (
          <InputNumber
            value={record.debtAmount as number | undefined}
            disabled
            style={{ width: '100%' }}
          />
        ) : (
          <span>{record.debtAmount ?? '-'}</span>
        ),
    },
    {
      title: '预计回款时间',
      dataIndex: 'estimatedPayDate',
      width: 150,
      render: (_, record) =>
        editMode ? (
          <DatePicker
            value={record.estimatedPayDate ? dayjs(record.estimatedPayDate) : undefined}
            onChange={(value) =>
              updateRecord(
                record.key,
                'estimatedPayDate',
                value ? value.format('YYYY-MM-DD') : undefined,
              )
            }
          />
        ) : (
          (record.estimatedPayDate ?? '-')
        ),
    },
    { title: '授课内容', dataIndex: 'courseContent', width: 160, render: (_, r) => renderInput(r, 'courseContent') },
    { title: '授课地点', dataIndex: 'courseLocation', width: 120, render: (_, r) => renderInput(r, 'courseLocation') },
    {
      title: '入学日期',
      dataIndex: 'enrollDate',
      width: 140,
      render: (_, record) =>
        editMode ? (
          <DatePicker
            value={record.enrollDate ? dayjs(record.enrollDate) : undefined}
            onChange={(value) =>
              updateRecord(record.key, 'enrollDate', value ? value.format('YYYY-MM-DD') : undefined)
            }
          />
        ) : (
          (record.enrollDate ?? '-')
        ),
    },
    { title: '上课天数', dataIndex: 'courseDays', width: 110, render: (_, r) => renderInput(r, 'courseDays', '', true) },
    { title: '规划师', dataIndex: 'planner', width: 110, render: (_, r) => renderInput(r, 'planner') },
    { title: '班主任', dataIndex: 'homeroomTeacher', width: 110, render: (_, r) => renderInput(r, 'homeroomTeacher') },
    { title: '教员', dataIndex: 'instructor', width: 100, render: (_, r) => renderInput(r, 'instructor') },
    { title: '备注', dataIndex: 'remark', width: 180, render: (_, r) => renderInput(r, 'remark') },
    { title: '填表人', dataIndex: 'filler', width: 100, render: (_, r) => renderInput(r, 'filler') },
    {
      title: '填表时间',
      dataIndex: 'fillDate',
      width: 140,
      render: (_, record) =>
        editMode ? (
          <DatePicker
            value={record.fillDate ? dayjs(record.fillDate) : undefined}
            onChange={(value) =>
              updateRecord(record.key, 'fillDate', value ? value.format('YYYY-MM-DD') : undefined)
            }
          />
        ) : (
          (record.fillDate ?? '-')
        ),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Button danger size="small" type="link" onClick={() => handleDelete(record.key)}>
          删除
        </Button>
      ),
    },
  ]

  const summary = useMemo(() => {
    const shouldPay = dataSource.reduce((sum, item) => sum + (item.shouldPay || 0), 0)
    const paid = dataSource.reduce((sum, item) => sum + (item.paidAmount || 0), 0)
    const debt = dataSource.reduce((sum, item) => sum + (item.debtAmount || 0), 0)
    return { shouldPay, paid, debt }
  }, [dataSource])

  const placeholderCount = Math.max(columns.length - 10, 0)

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={`${selectedCampus || 'XX神殿'}后端每日新生安排表`}
        extra={
          <Space>
            <Select
              style={{ width: 160 }}
              placeholder="选择神殿"
              value={selectedCampus}
              onChange={(value) => setSelectedCampus(value)}
            >
              {campusList.map((campus) => (
                <Option key={campus.id} value={campus.name}>
                  {campus.name}
                </Option>
              ))}
            </Select>
            <DatePicker
              allowClear={false}
              value={dayjs(selectedDate)}
              onChange={(value) =>
                setSelectedDate(value ? value.format('YYYY-MM-DD') : selectedDate)
              }
            />
            <Button icon={<PlusOutlined />} type="dashed" onClick={handleAddRow}>
              添加记录
            </Button>
            <Button icon={<CloudDownloadOutlined />} onClick={loadFromBackend}>
              加载
            </Button>
            <Button icon={<EditOutlined />} onClick={handleToggleEdit}>
              {editMode ? '退出编辑' : '编辑'}
            </Button>
            <Button icon={<SaveOutlined />} type="primary" onClick={handleSave}>
              保存
            </Button>
            <Button icon={<ReloadOutlined />} loading={loading} onClick={handleRefresh}>
              刷新
            </Button>
            <Button icon={<DownloadOutlined />} onClick={handleExport}>
              导出Excel
            </Button>
            <Button 
              icon={<CameraOutlined />} 
              onClick={handleExportScreenshot}
              loading={exportingScreenshot}
            >
              导出截图
            </Button>
            <Button
              icon={<ImportOutlined />}
              onClick={handleImportFromMonthlyStabilityDetail}
              loading={loading}
            >
              从维稳表导入
            </Button>
          </Space>
        }
        bodyStyle={{ padding: 0 }}
      >
        <div ref={tableRef} data-screenshot-root="daily-new-student-schedule">
          <Table
            columns={columns}
            dataSource={dataSource}
            pagination={false}
            size="small"
            bordered
            scroll={{ x: 2400 }}
            loading={loading}
            summary={() => (
              <Table.Summary fixed>
                <Table.Summary.Row style={{ backgroundColor: '#fff1f0' }}>
                  <Table.Summary.Cell index={0} colSpan={7}>
                    <span style={{ color: '#cf1322', fontWeight: 'bold' }}>合计</span>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1}>
                    <span style={{ color: '#cf1322', fontWeight: 'bold' }}>{summary.shouldPay}</span>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2}>
                    <span style={{ color: '#cf1322', fontWeight: 'bold' }}>{summary.paid}</span>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3}>
                    <span style={{ color: '#cf1322', fontWeight: 'bold' }}>{summary.debt}</span>
                  </Table.Summary.Cell>
                  {Array.from({ length: placeholderCount }).map((_, idx) => (
                    <Table.Summary.Cell key={`placeholder-${idx}`} index={4 + idx} />
                  ))}
                </Table.Summary.Row>
              </Table.Summary>
            )}
          />
        </div>
      </Card>
    </div>
  )
}

export default DailyNewStudentSchedulePage
