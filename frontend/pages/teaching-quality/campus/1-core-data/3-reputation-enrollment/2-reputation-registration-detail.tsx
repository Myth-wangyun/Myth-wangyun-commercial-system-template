import React, { useEffect, useMemo, useState } from 'react'
import { App, Card, Table, Input, InputNumber, Select, DatePicker, Space, Button } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { InputStatus } from 'antd/es/_util/statusUtils'
import dayjs, { Dayjs } from 'dayjs'
import { useCampusStore } from '@/stores/campusStore'
import { fetchHomeroomTeachers, fetchMajors } from '@/services/configMaster'
import { buildApiUrl } from '@/utils/apiBase'
import { validatePhone } from '@/utils/validation'
import eventBus from '@/utils/eventBus'

const { Option } = Select

interface ReputationRegistrationRow {
  key: string
  month: number
  instructorName: string
  reputationName: string
  reputationPhone: string
  isVisit: '是' | '否' | ''
  isEnroll: '是' | '否' | ''
  enrollmentTime: string | null
  enrollmentMajor: string
  enrollmentDuration: string
  receivableTuition: number | null
  actualTuition: number | null
  isExceededClassHours: '是' | '否' | ''
  isStable: '是' | '否' | ''
  isRefund: '是' | '否' | ''
  consultant: string
  introducerName: string
  reputationRelationship: string
  reputationSource: string
}

const createInitialRows = (): ReputationRegistrationRow[] =>
  Array.from({ length: 20 }, (_, index) => ({
    key: String(index + 1),
    month: 0,
    instructorName: '',
    reputationName: '',
    reputationPhone: '',
    isVisit: '',
    isEnroll: '',
    enrollmentTime: null,
    enrollmentMajor: '',
    enrollmentDuration: '',
    receivableTuition: null,
    actualTuition: null,
    isExceededClassHours: '',
    isStable: '',
    isRefund: '',
    consultant: '',
    introducerName: '',
    reputationRelationship: '',
    reputationSource: '',
  }))

const yesNoOptions = [
  { label: '是', value: '是' },
  { label: '否', value: '否' },
]

const enrollmentDurationOptions = [
  { label: '6个月', value: '6个月' },
  { label: '20个月', value: '20个月' },
  { label: '两年', value: '两年' },
  { label: '三年', value: '三年' },
]

const normalizePhoneDigits = (value: string) => (value || '').replace(/\D/g, '')

const getPhoneStatus = (value: string): InputStatus | undefined => {
  const digits = normalizePhoneDigits(value)
  // 空值不提示
  if (!digits) return undefined
  // 使用 validatePhone 函数进行有效手机号校验
  const error = validatePhone(digits)
  return error ? 'error' : undefined
}

const getPhoneErrorMessage = (value: string): string | undefined => {
  const digits = normalizePhoneDigits(value)
  if (!digits) return undefined
  return validatePhone(digits) || undefined
}

const ReputationRegistrationDetailTable: React.FC = () => {
  const { message } = App.useApp()
  const now = dayjs()
  const { currentCampus } = useCampusStore()
  const [selectedYear, setSelectedYear] = useState<number>(now.year())
  const [selectedMonth, setSelectedMonth] = useState<number>(now.month() + 1)
  const [rows, setRows] = useState<ReputationRegistrationRow[]>(createInitialRows)
  const [homeroomTeachers, setHomeroomTeachers] = useState<{name: string}[]>([])
  const [majors, setMajors] = useState<{name: string}[]>([])
  const [loading, setLoading] = useState(false)

  const canIO = useMemo(() => Boolean(currentCampus && selectedYear && selectedMonth), [currentCampus, selectedYear, selectedMonth])
  
  // 加载班主任和专业的选项
  useEffect(() => {
    const loadOptions = async () => {
      if (!currentCampus) return
      
      setLoading(true)
      try {
        // 获取班主任列表
        const teachers = await fetchHomeroomTeachers({ 
          campus_name: currentCampus,
          active: true 
        })
        setHomeroomTeachers(teachers.map(t => ({ name: t.name })))
        
        // 获取专业列表
        const majorList = await fetchMajors({
          campus_name: currentCampus,
          active: true
        })
        setMajors(majorList.map(m => ({ name: m.name })))
      } catch (error) {
        console.error('加载选项失败:', error)
        message.error('加载班主任和专业列表失败')
      } finally {
        setLoading(false)
      }
    }
    
    loadOptions()
  }, [currentCampus])

  // 当切换月份时，自动将“月份”列的值同步为所选月份（仅前端展示使用）
  useEffect(() => {
    setRows((prev) => prev.map((row) => ({ ...row, month: selectedMonth })))
  }, [selectedMonth])

  const updateRow = <K extends keyof ReputationRegistrationRow>(
    key: string,
    field: K,
    value: ReputationRegistrationRow[K],
  ) => {
    setRows((prev) =>
      prev.map((row) =>
        row.key === key
          ? {
              ...row,
              [field]: value,
            }
          : row,
      ),
    )
  }

  const applyServerRows = (list: any[]) => {
    const mapped: ReputationRegistrationRow[] = (list || []).map((r: any, idx: number) => ({
      key: String(idx + 1),
      month: selectedMonth,
      instructorName: r.instructorName || '',
      reputationName: r.reputationName || '',
      reputationPhone: r.reputationPhone || '',
      isVisit: (r.isVisit || '') as '是' | '否' | '',
      isEnroll: (r.isEnroll || '') as '是' | '否' | '',
      enrollmentTime: r.enrollmentTime || null,
      enrollmentMajor: r.enrollmentMajor || '',
      enrollmentDuration: r.enrollmentDuration || '',
      receivableTuition: r.receivableTuition ?? null,
      actualTuition: r.actualTuition ?? null,
      isExceededClassHours: (r.isExceededClassHours || '') as '是' | '否' | '',
      isStable: (r.isStable || '') as '是' | '否' | '',
      isRefund: (r.isRefund || '') as '是' | '否' | '',
      consultant: r.consultant || '',
      introducerName: r.introducerName || '',
      reputationRelationship: r.reputationRelationship || '',
      reputationSource: r.reputationSource || '',
    }))
    if (mapped.length === 0) {
      setRows(createInitialRows().map((r) => ({ ...r, month: selectedMonth })))
    } else {
      setRows(mapped)
    }
  }

  const fetchFromServer = async () => {
    if (!canIO) {
      message.warning('请先选择神殿/年份/月')
      return
    }
    try {
      const res = await fetch(buildApiUrl(`/teaching-quality/reputation-registration-detail?campus=${encodeURIComponent(currentCampus!)}&year=${selectedYear}&month=${selectedMonth}`))
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      applyServerRows(data?.行列表 || [])
      message.success('已刷新')
    } catch (e) {
      console.error(e)
      message.error('刷新失败')
    }
  }

  const saveToServer = async () => {
    if (!canIO) {
      message.warning('请先选择神殿/年份/月')
      return
    }
    
    // 校验电话号码
    const invalidPhones: Array<{ row: number; phone: string; error: string }> = []
    rows.forEach((r, idx) => {
      if (r.reputationPhone && r.reputationPhone.trim()) {
        const error = validatePhone(r.reputationPhone.trim())
        if (error) {
          invalidPhones.push({ row: idx + 1, phone: r.reputationPhone, error })
        }
      }
    })
    
    if (invalidPhones.length > 0) {
      const errorMsg = invalidPhones
        .map(({ row, error }) => `第${row}行：${error}`)
        .join('；')
      message.error(`电话号码格式不正确：${errorMsg}`)
      return
    }
    
    try {
      // 仅提交有内容的行
      const bodies = rows.filter((r) =>
        [r.instructorName, r.reputationName, r.reputationPhone, r.enrollmentMajor, r.enrollmentDuration, r.consultant, r.introducerName].some(Boolean)
      )
      const payload = {
        神殿名称: currentCampus!,
        年份: selectedYear,
        月份: selectedMonth,
        行列表: bodies.map((r, idx) => ({
          serialNumber: idx + 1,
          instructorName: r.instructorName,
          reputationName: r.reputationName,
          reputationPhone: r.reputationPhone,
          isVisit: r.isVisit,
          isEnroll: r.isEnroll,
          enrollmentTime: r.enrollmentTime,
          enrollmentMajor: r.enrollmentMajor,
          enrollmentDuration: r.enrollmentDuration,
          receivableTuition: r.receivableTuition ?? undefined,
          actualTuition: r.actualTuition ?? undefined,
          isExceededClassHours: r.isExceededClassHours,
          isStable: r.isStable,
          isRefund: r.isRefund,
          consultant: r.consultant,
          introducerName: r.introducerName,
          reputationRelationship: r.reputationRelationship,
          reputationSource: r.reputationSource,
        })),
      }
      const res = await fetch(buildApiUrl('/teaching-quality/reputation-registration-detail'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(await res.text())
      message.success('保存成功')
      // 通知同一 Tabs 下的其它汇总表刷新（A：无需手动刷新）
      eventBus.emit('tq:reputation:detailSaved', {
        campus: currentCampus!,
        year: selectedYear,
        month: selectedMonth,
        ts: Date.now(),
      })
      await fetchFromServer()
    } catch (e) {
      console.error(e)
      message.error('保存失败')
    }
  }

  // 新增一行（本地新增，保存时统一提交）
  const addRow = () => {
    const nextKey = `new-${Date.now()}`
    const newRow: ReputationRegistrationRow = {
      key: nextKey,
      month: selectedMonth,
      instructorName: '',
      reputationName: '',
      reputationPhone: '',
      isVisit: '',
      isEnroll: '',
      enrollmentTime: null,
      enrollmentMajor: '',
      enrollmentDuration: '',
      receivableTuition: null,
      actualTuition: null,
      isExceededClassHours: '',
      isStable: '',
      isRefund: '',
      consultant: '',
      introducerName: '',
      reputationRelationship: '',
      reputationSource: '',
    }
    setRows(prev => [...prev, newRow])
  }

  useEffect(() => {
    if (currentCampus) fetchFromServer()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCampus, selectedYear, selectedMonth])

  const columns: ColumnsType<ReputationRegistrationRow> = [
    {
      title: '月份',
      dataIndex: 'month',
      key: 'month',
      width: 80,
      align: 'center',
      render: (value: number, record) => (
        <InputNumber
          min={1}
          max={12}
          value={value || undefined}
          style={{ width: '100%' }}
          onChange={(v) => updateRow(record.key, 'month', v ?? 0)}
        />
      ),
    },
    {
      title: '班主任姓名',
      dataIndex: 'instructorName',
      key: 'instructorName',
      width: 150,
      align: 'center',
      render: (text: string, record) => (
        <Select
          showSearch
          allowClear
          value={text || undefined}
          style={{ width: '100%' }}
          placeholder="请选择班主任"
          optionFilterProp="label"
          onChange={(v) => updateRow(record.key, 'instructorName', v || '')}
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
          options={homeroomTeachers.map(teacher => ({
            value: teacher.name,
            label: teacher.name
          }))}
        />
      ),
    },
    {
      title: '口碑量姓名',
      dataIndex: 'reputationName',
      key: 'reputationName',
      width: 130,
      align: 'center',
      render: (text: string, record) => (
        <Input
          value={text}
          onChange={(e) => updateRow(record.key, 'reputationName', e.target.value)}
        />
      ),
    },
    {
      title: '口碑量电话',
      dataIndex: 'reputationPhone',
      key: 'reputationPhone',
      width: 160,
      align: 'center',
      render: (text: string, record) => {
        const phoneError = getPhoneErrorMessage(text)
        return (
          <div>
            <Input
              value={text}
              maxLength={11}
              inputMode="numeric"
              status={getPhoneStatus(text)}
              placeholder="11位手机号（1开头）"
              onChange={(e) => {
                // 仅允许数字；并限制 11 位
                const digitsOnly = normalizePhoneDigits(e.target.value).slice(0, 11)
                updateRow(record.key, 'reputationPhone', digitsOnly)
              }}
              onBlur={() => {
                // 失去焦点时进行校验并提示
                if (text && text.trim()) {
                  const error = validatePhone(text.trim())
                  if (error) {
                    message.warning(`第${record.key}行：${error}`)
                  }
                }
              }}
            />
            {phoneError && (
              <div style={{ color: '#ff4d4f', fontSize: '12px', marginTop: '2px' }}>
                {phoneError}
              </div>
            )}
          </div>
        )
      },
    },
    {
      title: '是否上门',
      dataIndex: 'isVisit',
      key: 'isVisit',
      width: 100,
      align: 'center',
      render: (value: ReputationRegistrationRow['isVisit'], record) => (
        <Select
          allowClear
          value={value || undefined}
          style={{ width: '100%' }}
          onChange={(v) => updateRow(record.key, 'isVisit', (v as '是' | '否') ?? '')}
        >
          {yesNoOptions.map((opt) => (
            <Option key={opt.value} value={opt.value}>
              {opt.label}
            </Option>
          ))}
        </Select>
      ),
    },
    {
      title: '是否报名',
      dataIndex: 'isEnroll',
      key: 'isEnroll',
      width: 100,
      align: 'center',
      render: (value: ReputationRegistrationRow['isEnroll'], record) => (
        <Select
          allowClear
          value={value || undefined}
          style={{ width: '100%' }}
          onChange={(v) => updateRow(record.key, 'isEnroll', (v as '是' | '否') ?? '')}
        >
          {yesNoOptions.map((opt) => (
            <Option key={opt.value} value={opt.value}>
              {opt.label}
            </Option>
          ))}
        </Select>
      ),
    },
    {
      title: '报名时间',
      dataIndex: 'enrollmentTime',
      key: 'enrollmentTime',
      width: 140,
      align: 'center',
      render: (value: string | null, record) => (
        <DatePicker
          value={value ? dayjs(value) : null}
          style={{ width: '100%' }}
          onChange={(date: Dayjs | null) =>
            updateRow(record.key, 'enrollmentTime', date ? date.format('YYYY-MM-DD') : null)
          }
        />
      ),
    },
    {
      title: '报名专业',
      dataIndex: 'enrollmentMajor',
      key: 'enrollmentMajor',
      width: 160,
      align: 'center',
      render: (text: string, record) => (
        <Select
          showSearch
          allowClear
          value={text || undefined}
          style={{ width: '100%' }}
          placeholder="请选择专业"
          optionFilterProp="label"
          onChange={(v) => updateRow(record.key, 'enrollmentMajor', v || '')}
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
          options={majors.map((m) => ({ value: m.name, label: m.name }))}
        />
      ),
    },
    {
      title: '报名学制',
      dataIndex: 'enrollmentDuration',
      key: 'enrollmentDuration',
      width: 120,
      align: 'center',
      render: (text: string, record) => (
        <Select
          allowClear
          value={text || undefined}
          style={{ width: '100%' }}
          placeholder="请选择学制"
          onChange={(v) => updateRow(record.key, 'enrollmentDuration', v || '')}
          options={enrollmentDurationOptions}
        />
      ),
    },
    {
      title: '应收学费',
      dataIndex: 'receivableTuition',
      key: 'receivableTuition',
      width: 130,
      align: 'center',
      render: (value: number | null, record) => (
        <InputNumber
          min={0}
          value={value ?? undefined}
          style={{ width: '100%' }}
          onChange={(v) => updateRow(record.key, 'receivableTuition', v ?? null)}
        />
      ),
    },
    {
      title: '实交学费',
      dataIndex: 'actualTuition',
      key: 'actualTuition',
      width: 130,
      align: 'center',
      render: (value: number | null, record) => (
        <InputNumber
          min={0}
          value={value ?? undefined}
          style={{ width: '100%' }}
          onChange={(v) => updateRow(record.key, 'actualTuition', v ?? null)}
        />
      ),
    },
    {
      title: '是否过课时',
      dataIndex: 'isExceededClassHours',
      key: 'isExceededClassHours',
      width: 120,
      align: 'center',
      render: (value: ReputationRegistrationRow['isExceededClassHours'], record) => (
        <Select
          allowClear
          value={value || undefined}
          style={{ width: '100%' }}
          onChange={(v) => updateRow(record.key, 'isExceededClassHours', (v as '是' | '否') ?? '')}
        >
          {yesNoOptions.map((opt) => (
            <Option key={opt.value} value={opt.value}>
              {opt.label}
            </Option>
          ))}
        </Select>
      ),
    },
    {
      title: '是否稳定',
      dataIndex: 'isStable',
      key: 'isStable',
      width: 110,
      align: 'center',
      render: (value: ReputationRegistrationRow['isStable'], record) => (
        <Select
          allowClear
          value={value || undefined}
          style={{ width: '100%' }}
          onChange={(v) => updateRow(record.key, 'isStable', (v as '是' | '否') ?? '')}
        >
          {yesNoOptions.map((opt) => (
            <Option key={opt.value} value={opt.value}>
              {opt.label}
            </Option>
          ))}
        </Select>
      ),
    },
    {
      title: '是否退费',
      dataIndex: 'isRefund',
      key: 'isRefund',
      width: 110,
      align: 'center',
      render: (value: ReputationRegistrationRow['isRefund'], record) => (
        <Select
          allowClear
          value={value || undefined}
          style={{ width: '100%' }}
          onChange={(v) => updateRow(record.key, 'isRefund', (v as '是' | '否') ?? '')}
        >
          {yesNoOptions.map((opt) => (
            <Option key={opt.value} value={opt.value}>
              {opt.label}
            </Option>
          ))}
        </Select>
      ),
    },
    {
      title: '咨询师',
      dataIndex: 'consultant',
      key: 'consultant',
      width: 120,
      align: 'center',
      render: (text: string, record) => (
        <Input value={text} onChange={(e) => updateRow(record.key, 'consultant', e.target.value)} />
      ),
    },
    {
      title: '介绍人姓名',
      dataIndex: 'introducerName',
      key: 'introducerName',
      width: 140,
      align: 'center',
      render: (text: string, record) => (
        <Input
          value={text}
          onChange={(e) => updateRow(record.key, 'introducerName', e.target.value)}
        />
      ),
    },
    {
      title: '口碑介绍关系',
      dataIndex: 'reputationRelationship',
      key: 'reputationRelationship',
      width: 140,
      align: 'center',
      render: (text: string, record) => (
        <Input
          value={text}
          onChange={(e) => updateRow(record.key, 'reputationRelationship', e.target.value)}
        />
      ),
    },
    {
      title: '口碑来源',
      dataIndex: 'reputationSource',
      key: 'reputationSource',
      width: 140,
      align: 'center',
      render: (text: string, record) => (
        <Input
          value={text}
          onChange={(e) => updateRow(record.key, 'reputationSource', e.target.value)}
        />
      ),
    },
  ]

  const currentYear = now.year()
  // 年份选择范围（当前年±3年）
  const yearOptions = Array.from({ length: 7 }, (_, i) => currentYear - 3 + i)
  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1)

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={`${currentCampus || ''}教化司口碑报名登记明细表`}
        extra={
          <Space>
            <span>年份</span>
            <Select size="small" style={{ width: 92 }} value={selectedYear} onChange={(v) => setSelectedYear(v)}>
              {yearOptions.map((y) => (
                <Option key={y} value={y}>{y}年</Option>
              ))}
            </Select>
            <span>月份</span>
            <Select size="small" style={{ width: 92 }} value={selectedMonth} onChange={(v) => setSelectedMonth(v)}>
              {monthOptions.map((m) => (
                <Option key={m} value={m}>{m}月</Option>
              ))}
            </Select>
            <Button onClick={fetchFromServer} disabled={!canIO}>刷新</Button>
            <Button onClick={addRow}>新增</Button>
            <Button type="primary" onClick={saveToServer} disabled={!canIO}>保存</Button>
          </Space>
        }
      >
        <Table<ReputationRegistrationRow>
          bordered
          size="small"
          columns={columns}
          dataSource={rows}
          pagination={false}
          rowKey="key"
          scroll={{ x: 'max-content' }}
        />
      </Card>
    </div>
  )
}

export default ReputationRegistrationDetailTable
