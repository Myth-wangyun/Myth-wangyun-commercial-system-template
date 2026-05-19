import React, { useEffect, useMemo, useState, useCallback, useRef, memo } from 'react'
import { App, Card, Table, InputNumber, Input, Space, Button } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useCampusStore } from '@/stores/campusStore'
import { buildApiUrl } from '@/utils/apiBase'

const FULL_WIDTH_STYLE: React.CSSProperties = { width: '100%' }

// 优化的 InputNumber Cell 组件
const MemoizedInputNumberCell = memo<{
  value: number
  recordKey: string
  field: string
  onChange: (key: string, field: string, value: number) => void
}>(({ value, recordKey, field, onChange }) => {
  const handleChange = useCallback((v: number | null) => {
    onChange(recordKey, field, v ?? 0)
  }, [recordKey, field, onChange])

  return (
    <InputNumber
      min={0}
      value={value || 0}
      style={FULL_WIDTH_STYLE}
      onChange={handleChange}
    />
  )
})

MemoizedInputNumberCell.displayName = 'MemoizedInputNumberCell'

// 优化的 Input Cell 组件
const MemoizedInputCell = memo<{
  value: string
  recordKey: string
  onChange: (key: string, value: string) => void
}>(({ value, recordKey, onChange }) => {
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(recordKey, e.target.value)
  }, [recordKey, onChange])

  return <Input value={value} onChange={handleChange} />
})

MemoizedInputCell.displayName = 'MemoizedInputCell'

interface MonthRow {
  key: string
  month: number
  campus: string
  inSchoolCount: number // 在校生数
  dormTotalCount: number // 宿舍总数量
  dormResidentCount: number // 住宿总人数
  maleDormCount: number
  maleDormResidentCount: number
  maleEmptyBedCount: number
  maleNewStudentBedCount: number
  femaleDormCount: number
  femaleDormResidentCount: number
  femaleEmptyBedCount: number
  femaleNewStudentBedCount: number
  planRentDormCount: number
  actualRentDormCount: number
  planQuitDormCount: number
  actualQuitDormCount: number
  remark: string
}

interface TableRow extends MonthRow {
  isSummary?: boolean
}

const createInitialRows = (campus: string): MonthRow[] =>
  Array.from({ length: 12 }, (_, idx) => {
    const month = idx + 1
    return {
      key: String(month),
      month,
      campus,
      inSchoolCount: 0,
      dormTotalCount: 0,
      dormResidentCount: 0,
      maleDormCount: 0,
      maleDormResidentCount: 0,
      maleEmptyBedCount: 0,
      maleNewStudentBedCount: 0,
      femaleDormCount: 0,
      femaleDormResidentCount: 0,
      femaleEmptyBedCount: 0,
      femaleNewStudentBedCount: 0,
      planRentDormCount: 0,
      actualRentDormCount: 0,
      planQuitDormCount: 0,
      actualQuitDormCount: 0,
      remark: '',
    }
  })

const formatRate = (numerator: number, denominator: number) => {
  if (!denominator) return '0%'
  const rate = (numerator / denominator) * 100
  const fixed = rate.toFixed(1)
  const text = fixed.endsWith('.0') ? fixed.slice(0, -2) : fixed
  return `${text}%`
}

const CampusDormitoryStatisticsSummary: React.FC = React.memo(() => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore()
  const [year, setYear] = useState<number>(new Date().getFullYear())
  const [rows, setRows] = useState<MonthRow[]>(() => createInitialRows(''))

  const canIO = useMemo(() => Boolean(currentCampus && year), [currentCampus, year])

  const dataSource: TableRow[] = useMemo(() => {
    const total = rows.reduce(
      (acc, r) => {
        acc.inSchoolCount += r.inSchoolCount || 0
        acc.dormTotalCount += r.dormTotalCount || 0
        acc.dormResidentCount += r.dormResidentCount || 0
        acc.maleDormCount += r.maleDormCount || 0
        acc.maleDormResidentCount += r.maleDormResidentCount || 0
        acc.maleEmptyBedCount += r.maleEmptyBedCount || 0
        acc.maleNewStudentBedCount += r.maleNewStudentBedCount || 0
        acc.femaleDormCount += r.femaleDormCount || 0
        acc.femaleDormResidentCount += r.femaleDormResidentCount || 0
        acc.femaleEmptyBedCount += r.femaleEmptyBedCount || 0
        acc.femaleNewStudentBedCount += r.femaleNewStudentBedCount || 0
        acc.planRentDormCount += r.planRentDormCount || 0
        acc.actualRentDormCount += r.actualRentDormCount || 0
        acc.planQuitDormCount += r.planQuitDormCount || 0
        acc.actualQuitDormCount += r.actualQuitDormCount || 0
        return acc
      },
      {
        inSchoolCount: 0,
        dormTotalCount: 0,
        dormResidentCount: 0,
        maleDormCount: 0,
        maleDormResidentCount: 0,
        maleEmptyBedCount: 0,
        maleNewStudentBedCount: 0,
        femaleDormCount: 0,
        femaleDormResidentCount: 0,
        femaleEmptyBedCount: 0,
        femaleNewStudentBedCount: 0,
        planRentDormCount: 0,
        actualRentDormCount: 0,
        planQuitDormCount: 0,
        actualQuitDormCount: 0,
      },
    )

    const summaryRow: TableRow = {
      key: 'summary',
      month: 0,
      campus: '',
      remark: '',
      ...total,
      isSummary: true,
    }
    
    return [...rows, summaryRow]
  }, [rows])

  const handleNumberChange = useCallback((
    key: string,
    field: string,
    value: number,
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
  }, [])

  const handleRemarkChange = useCallback((key: string, value: string) => {
    setRows((prev) =>
      prev.map((row) =>
        row.key === key
          ? {
              ...row,
              remark: value,
            }
          : row,
      ),
    )
  }, [])

  const fetchFromServer = useCallback(async () => {
    if (!canIO) {
      message.warning('请先选择神殿/年份')
      return
    }
    try {
      // 确保神殿名称完整（如果不以"神殿"结尾，则添加）
      const campusName = currentCampus!.endsWith('神殿') ? currentCampus! : `${currentCampus!}神殿`
      const res = await fetch(
        buildApiUrl(`/teaching-quality/campus-dormitory-statistics-summary?campus=${encodeURIComponent(
          campusName,
        )}&year=${year}`),
      )
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      const list = (data?.行列表 || []) as any[]
      const mapped: MonthRow[] = createInitialRows(currentCampus!).map((r) => {
        const hit = list.find((x: any) => Number(x.month) === r.month)
        return hit
          ? {
              key: String(hit.month),
              month: Number(hit.month),
              campus: currentCampus!,
              inSchoolCount: Number(hit.inSchoolCount || 0),
              dormTotalCount: Number(hit.dormTotalCount || 0),
              dormResidentCount: Number(hit.dormResidentCount || 0),
              maleDormCount: Number(hit.maleDormCount || 0),
              maleDormResidentCount: Number(hit.maleDormResidentCount || 0),
              maleEmptyBedCount: Number(hit.maleEmptyBedCount || 0),
              maleNewStudentBedCount: Number(hit.maleNewStudentBedCount || 0),
              femaleDormCount: Number(hit.femaleDormCount || 0),
              femaleDormResidentCount: Number(hit.femaleDormResidentCount || 0),
              femaleEmptyBedCount: Number(hit.femaleEmptyBedCount || 0),
              femaleNewStudentBedCount: Number(hit.femaleNewStudentBedCount || 0),
              planRentDormCount: Number(hit.planRentDormCount || 0),
              actualRentDormCount: Number(hit.actualRentDormCount || 0),
              planQuitDormCount: Number(hit.planQuitDormCount || 0),
              actualQuitDormCount: Number(hit.actualQuitDormCount || 0),
              remark: String(hit.remark || ''),
            }
          : r
      })
      setRows(mapped)
      message.success('已刷新')
    } catch (e) {
      console.error(e)
      message.error('刷新失败')
    }
  }, [canIO, currentCampus, year])

  const saveToServer = useCallback(async () => {
    if (!canIO) {
      message.warning('请先选择神殿/年份')
      return
    }
    try {
      // 确保神殿名称完整（如果不以"神殿"结尾，则添加）
      const campusName = currentCampus!.endsWith('神殿') ? currentCampus! : `${currentCampus!}神殿`
      const payload = {
        神殿名称: campusName,
        年份: year,
        行列表: rows.map((r) => ({ month: r.month, remark: r.remark })),
      }
      const res = await fetch(buildApiUrl('/teaching-quality/campus-dormitory-statistics-summary'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(await res.text())
      message.success('保存成功')
      await fetchFromServer()
    } catch (e) {
      console.error(e)
      message.error('保存失败')
    }
  }, [canIO, currentCampus, year, rows, fetchFromServer])

  const prevCampusRef = useRef<string | null>(null)
  const prevYearRef = useRef<number | null>(null)

  useEffect(() => {
    if (!currentCampus) return
    
    const campusName = currentCampus.endsWith('神殿') ? currentCampus : `${currentCampus}神殿`
    const campusChanged = prevCampusRef.current !== currentCampus
    const yearChanged = prevYearRef.current !== year
    
    if (campusChanged || yearChanged) {
      prevCampusRef.current = currentCampus
      prevYearRef.current = year
      setRows(createInitialRows(campusName))
      fetchFromServer()
    }
  }, [currentCampus, year, fetchFromServer])

  const columns: ColumnsType<TableRow> = useMemo(() => [
    {
      title: '月份',
      dataIndex: 'month',
      key: 'month',
      width: 80,
      align: 'center',
      render: (value: number, record) =>
        record.isSummary ? <span style={{ color: 'red', fontWeight: 'bold' }}>合计</span> : value,
    },
    {
      title: '神殿',
      dataIndex: 'campus',
      key: 'campus',
      width: 100,
      align: 'center',
      render: (text: string, record) => (record.isSummary ? '' : text || ''),
    },
    {
      title: '在校生数',
      dataIndex: 'inSchoolCount',
      key: 'inSchoolCount',
      width: 120,
      align: 'center',
      render: (value: number, record) =>
        record.isSummary ? (
          value || 0
        ) : (
          <MemoizedInputNumberCell
            value={value}
            recordKey={record.key}
            field="inSchoolCount"
            onChange={handleNumberChange}
          />
        ),
    },
    {
      title: '宿舍总数量',
      dataIndex: 'dormTotalCount',
      key: 'dormTotalCount',
      width: 130,
      align: 'center',
      render: (value: number, record) =>
        record.isSummary ? (
          value || 0
        ) : (
          <MemoizedInputNumberCell
            value={value}
            recordKey={record.key}
            field="dormTotalCount"
            onChange={handleNumberChange}
          />
        ),
    },
    {
      title: '住宿总人数',
      dataIndex: 'dormResidentCount',
      key: 'dormResidentCount',
      width: 130,
      align: 'center',
      render: (value: number, record) =>
        record.isSummary ? (
          value || 0
        ) : (
          <MemoizedInputNumberCell
            value={value}
            recordKey={record.key}
            field="dormResidentCount"
            onChange={handleNumberChange}
          />
        ),
    },
    {
      title: '住宿率',
      dataIndex: 'dormRate',
      key: 'dormRate',
      width: 100,
      align: 'center',
      render: (_: unknown, record) => {
        return formatRate(record.dormResidentCount, record.inSchoolCount)
      },
    },
    {
      title: '男宿情况',
      children: [
        {
          title: '男宿总数量',
          dataIndex: 'maleDormCount',
          key: 'maleDormCount',
          width: 120,
          align: 'center',
          render: (value: number, record) =>
            record.isSummary ? (
              value || 0
            ) : (
              <MemoizedInputNumberCell
                value={value}
                recordKey={record.key}
                field="maleDormCount"
                onChange={handleNumberChange}
              />
            ),
        },
        {
          title: '男宿总人数',
          dataIndex: 'maleDormResidentCount',
          key: 'maleDormResidentCount',
          width: 120,
          align: 'center',
          render: (value: number, record) =>
            record.isSummary ? (
              value || 0
            ) : (
              <MemoizedInputNumberCell
                value={value}
                recordKey={record.key}
                field="maleDormResidentCount"
                onChange={handleNumberChange}
              />
            ),
        },
        {
          title: '男宿空床位总数量',
          dataIndex: 'maleEmptyBedCount',
          key: 'maleEmptyBedCount',
          width: 150,
          align: 'center',
          render: (value: number, record) =>
            record.isSummary ? (
              value || 0
            ) : (
              <MemoizedInputNumberCell
                value={value}
                recordKey={record.key}
                field="maleEmptyBedCount"
                onChange={handleNumberChange}
              />
            ),
        },
        {
          title: '适合男新生床位数',
          dataIndex: 'maleNewStudentBedCount',
          key: 'maleNewStudentBedCount',
          width: 160,
          align: 'center',
          render: (value: number, record) =>
            record.isSummary ? (
              value || 0
            ) : (
              <MemoizedInputNumberCell
                value={value}
                recordKey={record.key}
                field="maleNewStudentBedCount"
                onChange={handleNumberChange}
              />
            ),
        },
      ],
    },
    {
      title: '女宿情况',
      children: [
        {
          title: '女宿总数量',
          dataIndex: 'femaleDormCount',
          key: 'femaleDormCount',
          width: 120,
          align: 'center',
          render: (value: number, record) =>
            record.isSummary ? (
              value || 0
            ) : (
              <MemoizedInputNumberCell
                value={value}
                recordKey={record.key}
                field="femaleDormCount"
                onChange={handleNumberChange}
              />
            ),
        },
        {
          title: '女宿总人数',
          dataIndex: 'femaleDormResidentCount',
          key: 'femaleDormResidentCount',
          width: 120,
          align: 'center',
          render: (value: number, record) =>
            record.isSummary ? (
              value || 0
            ) : (
              <MemoizedInputNumberCell
                value={value}
                recordKey={record.key}
                field="femaleDormResidentCount"
                onChange={handleNumberChange}
              />
            ),
        },
        {
          title: '女宿空床位总数量',
          dataIndex: 'femaleEmptyBedCount',
          key: 'femaleEmptyBedCount',
          width: 150,
          align: 'center',
          render: (value: number, record) =>
            record.isSummary ? (
              value || 0
            ) : (
              <MemoizedInputNumberCell
                value={value}
                recordKey={record.key}
                field="femaleEmptyBedCount"
                onChange={handleNumberChange}
              />
            ),
        },
        {
          title: '适合女新生住宿床位',
          dataIndex: 'femaleNewStudentBedCount',
          key: 'femaleNewStudentBedCount',
          width: 170,
          align: 'center',
          render: (value: number, record) =>
            record.isSummary ? (
              value || 0
            ) : (
              <MemoizedInputNumberCell
                value={value}
                recordKey={record.key}
                field="femaleNewStudentBedCount"
                onChange={handleNumberChange}
              />
            ),
        },
      ],
    },
    {
      title: '租宿舍',
      children: [
        {
          title: '计划租宿舍数量',
          dataIndex: 'planRentDormCount',
          key: 'planRentDormCount',
          width: 150,
          align: 'center',
          render: (value: number, record) =>
            record.isSummary ? (
              value || 0
            ) : (
              <MemoizedInputNumberCell
                value={value}
                recordKey={record.key}
                field="planRentDormCount"
                onChange={handleNumberChange}
              />
            ),
        },
        {
          title: '实际租宿舍数量',
          dataIndex: 'actualRentDormCount',
          key: 'actualRentDormCount',
          width: 150,
          align: 'center',
          render: (value: number, record) =>
            record.isSummary ? (
              value || 0
            ) : (
              <MemoizedInputNumberCell
                value={value}
                recordKey={record.key}
                field="actualRentDormCount"
                onChange={handleNumberChange}
              />
            ),
        },
      ],
    },
    {
      title: '退宿舍',
      children: [
        {
          title: '计划退宿舍数量',
          dataIndex: 'planQuitDormCount',
          key: 'planQuitDormCount',
          width: 150,
          align: 'center',
          render: (value: number, record) =>
            record.isSummary ? (
              value || 0
            ) : (
              <MemoizedInputNumberCell
                value={value}
                recordKey={record.key}
                field="planQuitDormCount"
                onChange={handleNumberChange}
              />
            ),
        },
        {
          title: '实际退宿舍数量',
          dataIndex: 'actualQuitDormCount',
          key: 'actualQuitDormCount',
          width: 150,
          align: 'center',
          render: (value: number, record) =>
            record.isSummary ? (
              value || 0
            ) : (
              <MemoizedInputNumberCell
                value={value}
                recordKey={record.key}
                field="actualQuitDormCount"
                onChange={handleNumberChange}
              />
            ),
        },
      ],
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      width: 200,
      align: 'left',
      render: (text: string, record) =>
        record.isSummary ? (
          ''
        ) : (
          <MemoizedInputCell
            value={text}
            recordKey={record.key}
            onChange={handleRemarkChange}
          />
        ),
    },
  ], [handleNumberChange, handleRemarkChange])

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={`${currentCampus ? (currentCampus.endsWith('神殿') ? currentCampus : `${currentCampus}神殿`) : ''} · 现有宿舍统计表`}
        extra={
          <Space>
            <span>年份</span>
            <InputNumber
              min={2000}
              max={2100}
              value={year}
              onChange={(v) => setYear(typeof v === 'number' ? v : new Date().getFullYear())}
              style={{ width: 100 }}
            />
            <Button onClick={fetchFromServer} disabled={!canIO}>刷新</Button>
            <Button type="primary" onClick={saveToServer} disabled={!canIO}>保存</Button>
          </Space>
        }
      >
        <Table<TableRow>
          bordered
          size="small"
          columns={columns}
          dataSource={dataSource}
          pagination={false}
          rowKey="key"
          scroll={{ x: 'max-content' }}
        />
      </Card>
    </div>
  )
})

CampusDormitoryStatisticsSummary.displayName = 'CampusDormitoryStatisticsSummary'

export default CampusDormitoryStatisticsSummary
