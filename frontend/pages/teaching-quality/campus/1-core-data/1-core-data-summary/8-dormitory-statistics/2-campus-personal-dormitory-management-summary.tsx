/**
 * 08-1主神殿教化司个人宿舍管理统计表（手填，已接入后端）
 */
import React, { useCallback, useEffect, useMemo, useState, useRef, memo } from 'react'

const FULL_WIDTH_STYLE: React.CSSProperties = { width: '100%' }
import { App, Card, Table, Input, InputNumber, Space, Button } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useCampusStore } from '@/stores/campusStore'
import { buildApiUrl } from '@/utils/apiBase'

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
  field: string
  onChange: (key: string, field: string, value: string) => void
}>(({ value, recordKey, field, onChange }) => {
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(recordKey, field, e.target.value)
  }, [recordKey, field, onChange])

  return <Input value={value} onChange={handleChange} />
})

MemoizedInputCell.displayName = 'MemoizedInputCell'

interface PersonalDormitoryRow {
  key: string
  serialNumber: number
  teacherName: string
  classStudentCount: number // 带班人数
  dormManageCount: number // 宿舍管理总数量
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
  isSummary?: boolean
}

// 至少展示的空行条目数
const MIN_ROWS = 7

const createEmptyRow = (i: number): PersonalDormitoryRow => ({
  key: String(i),
  serialNumber: i,
  teacherName: '',
  classStudentCount: 0,
  dormManageCount: 0,
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
})

const recomputeSummary = (rows: PersonalDormitoryRow[]): PersonalDormitoryRow => {
  const total = rows.reduce(
    (acc, r) => {
      acc.classStudentCount += r.classStudentCount || 0
      acc.dormManageCount += r.dormManageCount || 0
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
      classStudentCount: 0,
      dormManageCount: 0,
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

  return {
    key: 'summary',
    serialNumber: 0,
    teacherName: '合计/平均',
    remark: '',
    ...total,
    isSummary: true,
  }
}

const formatRate = (numerator: number, denominator: number) => {
  if (!denominator) return '0%'
  const rate = (numerator / denominator) * 100
  const fixed = rate.toFixed(1)
  const text = fixed.endsWith('.0') ? fixed.slice(0, -2) : fixed
  return `${text}%`
}

const ShengbangPersonalDormitoryManagementSummary: React.FC = React.memo(() => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore()
  const [year, setYear] = useState<number>(new Date().getFullYear())

  const [rows, setRows] = useState<PersonalDormitoryRow[]>(() => {
    const base = Array.from({ length: MIN_ROWS }, (_, idx) => createEmptyRow(idx + 1))
    return [...base, recomputeSummary(base)]
  })

  const bodyRows = useMemo(() => rows.filter((r) => !r.isSummary), [rows])
  const summaryRow = useMemo(() => rows.find((r) => r.isSummary) as PersonalDormitoryRow, [rows])

  const updateRows = useCallback((nextBodies: PersonalDormitoryRow[]) => {
    const summary = recomputeSummary(nextBodies)
    setRows([...nextBodies, summary])
  }, [])

  const canIO = useMemo(() => Boolean(currentCampus && year), [currentCampus, year])

  const handleNumberChange = useCallback((
    key: string,
    field: string,
    value: number,
  ) => {
    setRows((prev) => {
      const bodies = prev.filter((r) => !r.isSummary)
      const nextBodies = bodies.map((row) =>
        row.key === key
          ? {
              ...row,
              [field]: value,
            }
          : row,
      )
      const summary = recomputeSummary(nextBodies)
      return [...nextBodies, summary]
    })
  }, [])

  const handleTextChange = useCallback((key: string, field: string, value: string) => {
    setRows((prev) => {
      const bodies = prev.filter((r) => !r.isSummary)
      const nextBodies = bodies.map((row) =>
        row.key === key
          ? {
              ...row,
              [field]: value,
            }
          : row,
      )
      const summary = recomputeSummary(nextBodies)
      return [...nextBodies, summary]
    })
  }, [])

  // 拉取
  const fetchFromServer = useCallback(async () => {
    if (!canIO) {
      message.warning('请先选择神殿/年份')
      return
    }
    try {
      // 确保神殿名称完整（如果不以"神殿"结尾，则添加）
      const campusName = currentCampus!.endsWith('神殿') ? currentCampus! : `${currentCampus!}神殿`
      const res = await fetch(
        buildApiUrl(`/teaching-quality/campus-personal-dormitory-mgmt-summary?campus=${encodeURIComponent(
          campusName,
        )}&year=${year}`),
      )
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      const list = (data?.行列表 || []) as any[]
      const mapped: PersonalDormitoryRow[] = list
        .map((r: any, idx: number) => ({
          key: String(r.serialNumber ?? idx + 1),
          serialNumber: Number(r.serialNumber ?? idx + 1),
          teacherName: String(r.teacherName || ''),
          classStudentCount: Number(r.classStudentCount || 0),
          dormManageCount: Number(r.dormManageCount || 0),
          dormResidentCount: Number(r.dormResidentCount || 0),
          maleDormCount: Number(r.maleDormCount || 0),
          maleDormResidentCount: Number(r.maleDormResidentCount || 0),
          maleEmptyBedCount: Number(r.maleEmptyBedCount || 0),
          maleNewStudentBedCount: Number(r.maleNewStudentBedCount || 0),
          femaleDormCount: Number(r.femaleDormCount || 0),
          femaleDormResidentCount: Number(r.femaleDormResidentCount || 0),
          femaleEmptyBedCount: Number(r.femaleEmptyBedCount || 0),
          femaleNewStudentBedCount: Number(r.femaleNewStudentBedCount || 0),
          planRentDormCount: Number(r.planRentDormCount || 0),
          actualRentDormCount: Number(r.actualRentDormCount || 0),
          planQuitDormCount: Number(r.planQuitDormCount || 0),
          actualQuitDormCount: Number(r.actualQuitDormCount || 0),
          remark: String(r.remark || ''),
        }))
        .sort((a, b) => a.serialNumber - b.serialNumber)

      // 至少 MIN_ROWS 行
      const padded = [...mapped]
      for (let i = mapped.length + 1; i <= MIN_ROWS; i += 1) padded.push(createEmptyRow(i))
      updateRows(padded)
      message.success('已刷新')
    } catch (e) {
      console.error(e)
      message.error('刷新失败')
    }
  }, [canIO, currentCampus, year, updateRows])

  // 保存
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
        行列表: bodyRows.map((r) => ({
          serialNumber: r.serialNumber,
          teacherName: r.teacherName,
          classStudentCount: r.classStudentCount,
          dormManageCount: r.dormManageCount,
          dormResidentCount: r.dormResidentCount,
          maleDormCount: r.maleDormCount,
          maleDormResidentCount: r.maleDormResidentCount,
          maleEmptyBedCount: r.maleEmptyBedCount,
          maleNewStudentBedCount: r.maleNewStudentBedCount,
          femaleDormCount: r.femaleDormCount,
          femaleDormResidentCount: r.femaleDormResidentCount,
          femaleEmptyBedCount: r.femaleEmptyBedCount,
          femaleNewStudentBedCount: r.femaleNewStudentBedCount,
          planRentDormCount: r.planRentDormCount,
          actualRentDormCount: r.actualRentDormCount,
          planQuitDormCount: r.planQuitDormCount,
          actualQuitDormCount: r.actualQuitDormCount,
          remark: r.remark,
        })),
      }
      const res = await fetch(buildApiUrl('/teaching-quality/campus-personal-dormitory-mgmt-summary'), {
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
  }, [canIO, currentCampus, year, bodyRows, fetchFromServer])

  const prevCampusRef = useRef<string | null>(null)
  const prevYearRef = useRef<number | null>(null)

  useEffect(() => {
    if (!currentCampus) return
    
    const campusChanged = prevCampusRef.current !== currentCampus
    const yearChanged = prevYearRef.current !== year
    
    if (campusChanged || yearChanged) {
      prevCampusRef.current = currentCampus
      prevYearRef.current = year
      // 初始化空行
      const base = Array.from({ length: MIN_ROWS }, (_, idx) => createEmptyRow(idx + 1))
      updateRows(base)
      fetchFromServer()
    }
  }, [currentCampus, year, fetchFromServer, updateRows])

  const columns: ColumnsType<PersonalDormitoryRow> = useMemo(() => [
    {
      title: '序号',
      dataIndex: 'serialNumber',
      key: 'serialNumber',
      width: 80,
      align: 'center',
      onCell: (record) => {
        if (record.isSummary) {
          return { colSpan: 2, style: { textAlign: 'center' } }
        }
        return { colSpan: 1, style: { textAlign: 'center' } }
      },
      render: (value, record) =>
        record.isSummary ? (
          <span style={{ color: 'red', fontWeight: 'bold' }}>合计/平均</span>
        ) : (
          value
        ),
    },
    {
      title: '班主任姓名',
      dataIndex: 'teacherName',
      key: 'teacherName',
      width: 140,
      align: 'center',
      onCell: (record) => {
        if (record.isSummary) {
          return { colSpan: 0, style: { textAlign: 'center' } }
        }
        return { colSpan: 1, style: { textAlign: 'center' } }
      },
      render: (text: string, record) =>
        record.isSummary ? (
          <span style={{ color: 'red', fontWeight: 'bold' }}>{text}</span>
        ) : (
          <MemoizedInputCell
            value={text}
            recordKey={record.key}
            field="teacherName"
            onChange={handleTextChange}
          />
        ),
    },
    {
      title: '带班人数',
      dataIndex: 'classStudentCount',
      key: 'classStudentCount',
      width: 120,
      align: 'center',
      render: (value: number, record) =>
        record.isSummary ? (
          <span style={{ color: 'red', fontWeight: 'bold' }}>{value || 0}</span>
        ) : (
          <MemoizedInputNumberCell
            value={value}
            recordKey={record.key}
            field="classStudentCount"
            onChange={handleNumberChange}
          />
        ),
    },
    {
      title: '宿舍管理总数量',
      dataIndex: 'dormManageCount',
      key: 'dormManageCount',
      width: 150,
      align: 'center',
      render: (value: number, record) =>
        record.isSummary ? (
          <span style={{ color: 'red', fontWeight: 'bold' }}>{value || 0}</span>
        ) : (
          <MemoizedInputNumberCell
            value={value}
            recordKey={record.key}
            field="dormManageCount"
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
          <span style={{ color: 'red', fontWeight: 'bold' }}>{value || 0}</span>
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
        const denominator = record.classStudentCount
        const numerator = record.dormResidentCount
        const rateText = formatRate(numerator, denominator)
        return record.isSummary ? (
          <span style={{ color: 'red', fontWeight: 'bold' }}>{rateText}</span>
        ) : (
          rateText
        )
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
              <span style={{ color: 'red', fontWeight: 'bold' }}>{record.maleDormCount || 0}</span>
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
              <span style={{ color: 'red', fontWeight: 'bold' }}>{record.maleDormResidentCount || 0}</span>
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
              <span style={{ color: 'red', fontWeight: 'bold' }}>{record.maleEmptyBedCount || 0}</span>
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
              <span style={{ color: 'red', fontWeight: 'bold' }}>{record.maleNewStudentBedCount || 0}</span>
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
              <span style={{ color: 'red', fontWeight: 'bold' }}>{record.femaleDormCount || 0}</span>
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
              <span style={{ color: 'red', fontWeight: 'bold' }}>{record.femaleDormResidentCount || 0}</span>
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
              <span style={{ color: 'red', fontWeight: 'bold' }}>{record.femaleEmptyBedCount || 0}</span>
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
              <span style={{ color: 'red', fontWeight: 'bold' }}>{record.femaleNewStudentBedCount || 0}</span>
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
              <span style={{ color: 'red', fontWeight: 'bold' }}>{record.planRentDormCount || 0}</span>
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
              <span style={{ color: 'red', fontWeight: 'bold' }}>{record.actualRentDormCount || 0}</span>
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
              <span style={{ color: 'red', fontWeight: 'bold' }}>{record.planQuitDormCount || 0}</span>
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
              <span style={{ color: 'red', fontWeight: 'bold' }}>{record.actualQuitDormCount || 0}</span>
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
            field="remark"
            onChange={handleTextChange}
          />
        ),
    },
  ], [handleNumberChange, handleTextChange])

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={`${currentCampus ? (currentCampus.endsWith('神殿') ? currentCampus : `${currentCampus}神殿`) : ''} · 个人宿舍管理统计表（手填）`}
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
        <Table<PersonalDormitoryRow>
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
})

ShengbangPersonalDormitoryManagementSummary.displayName = 'ShengbangPersonalDormitoryManagementSummary'

export default ShengbangPersonalDormitoryManagementSummary
