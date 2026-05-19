// 就业期计划和监督表

import React, { useEffect, useMemo, useState } from 'react'
import { App, Card, Table, Input, Button, Space, DatePicker } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { buildApiUrl } from '@/utils/apiBase'

interface EmploymentPeriodPlanRow {
  key: string
  serialNumber: number
  date: string
  formOrLocation: string
  workContent: string
  workTarget: string
  howToDo: string
  result: string
  headTeacher: string
  teacher: string
  supervisor: string
  remark: string
}

interface Props {
  campus: string
  className: string
  year: number
  month: number
}

const createEmptyRow = (serialNumber: number = 1): EmploymentPeriodPlanRow => ({
  key: String(serialNumber),
  serialNumber,
  date: '',
  formOrLocation: '',
  workContent: '',
  workTarget: '',
  howToDo: '',
  result: '',
  headTeacher: '',
  teacher: '',
  supervisor: '',
  remark: '',
})

const createInitialRows = (count: number = 1): EmploymentPeriodPlanRow[] =>
  Array.from({ length: count }, (_, index) => createEmptyRow(index + 1))

const ClassEmploymentPeriodPlanSupervisionTable: React.FC<Props> = ({ campus, className, year, month }) => {
  const { message } = App.useApp()
  const [dataSource, setDataSource] = useState<EmploymentPeriodPlanRow[]>(createInitialRows(1))

  // 表头元信息
  const [needEmploymentCount, setNeedEmploymentCount] = useState('')
  const [periodStart, setPeriodStart] = useState<Dayjs | null>(null)
  const [periodEnd, setPeriodEnd] = useState<Dayjs | null>(null)
  const [targetAverageSalary, setTargetAverageSalary] = useState('')
  const [headTeacher, setHeadTeacher] = useState('')
  const [teacher, setTeacher] = useState('')

  const canIO = useMemo(() => Boolean(campus && className && year && month), [campus, className, year, month])

  const handleChange = (key: string, field: keyof EmploymentPeriodPlanRow, value: string) => {
    setDataSource(prev => {
      const newDataSource = [...prev];
      const index = newDataSource.findIndex(item => item.key === key);
      if (index > -1) {
        const item = newDataSource[index];
        newDataSource.splice(index, 1, { ...item, [field]: value });
      }
      return newDataSource;
    });
  }

  const handleAddRow = () => {
    setDataSource((prev) => {
      const maxSerialNumber = prev.length > 0 ? Math.max(...prev.map((r) => r.serialNumber)) : 0
      const newRow: EmploymentPeriodPlanRow = {
        key: String(maxSerialNumber + 1),
        serialNumber: maxSerialNumber + 1,
        date: '',
        formOrLocation: '',
        workContent: '',
        workTarget: '',
        howToDo: '',
        result: '',
        headTeacher: '',
        teacher: '',
        supervisor: '',
        remark: '',
      }
      return [...prev, newRow]
    })
  }

  const columns: ColumnsType<EmploymentPeriodPlanRow> = [
    { title: '序号', dataIndex: 'serialNumber', key: 'serialNumber', width: 70, align: 'center', fixed: 'left' },
    { title: '日期', dataIndex: 'date', key: 'date', width: 140, align: 'center', render: (text, record) => (
      <DatePicker 
        value={text ? dayjs(text) : null}
        onChange={(date: Dayjs | null) => handleChange(record.key, 'date', date ? date.format('YYYY-MM-DD') : '')}
        format="YYYY-MM-DD"
        style={{ width: '100%' }}
      />
    ) },
    { title: '形式/地点', dataIndex: 'formOrLocation', key: 'formOrLocation', width: 160, align: 'center', render: (text, record) => (
      <Input value={text} onChange={(e) => handleChange(record.key, 'formOrLocation', e.target.value)} />
    ) },
    { title: '工作内容', dataIndex: 'workContent', key: 'workContent', width: 220, align: 'left', render: (text, record) => (
      <Input value={text} onChange={(e) => handleChange(record.key, 'workContent', e.target.value)} />
    ) },
    { title: '工作目标', dataIndex: 'workTarget', key: 'workTarget', width: 220, align: 'left', render: (text, record) => (
      <Input value={text} onChange={(e) => handleChange(record.key, 'workTarget', e.target.value)} />
    ) },
    { title: '如何做', dataIndex: 'howToDo', key: 'howToDo', width: 220, align: 'left', render: (text, record) => (
      <Input value={text} onChange={(e) => handleChange(record.key, 'howToDo', e.target.value)} />
    ) },
    { title: '实际工作结果', dataIndex: 'result', key: 'result', width: 220, align: 'left', render: (text, record) => (
      <Input value={text} onChange={(e) => handleChange(record.key, 'result', e.target.value)} />
    ) },
    { title: '班主任', dataIndex: 'headTeacher', key: 'headTeacher', width: 120, align: 'center', render: (text, record) => (
      <Input value={text} onChange={(e) => handleChange(record.key, 'headTeacher', e.target.value)} />
    ) },
    { title: '教员', dataIndex: 'teacher', key: 'teacher', width: 120, align: 'center', render: (text, record) => (
      <Input value={text} onChange={(e) => handleChange(record.key, 'teacher', e.target.value)} />
    ) },
    { title: '监督人', dataIndex: 'supervisor', key: 'supervisor', width: 120, align: 'center', render: (text, record) => (
      <Input value={text} onChange={(e) => handleChange(record.key, 'supervisor', e.target.value)} />
    ) },
    { title: '备注', dataIndex: 'remark', key: 'remark', width: 220, align: 'left', render: (text, record) => (
      <Input value={text} onChange={(e) => handleChange(record.key, 'remark', e.target.value)} />
    ) },
  ]

  // 读取
  const handleRefresh = async () => {
    if (!canIO) { message.warning('请选择神殿、班级、年月'); return }
    try {
      const res = await fetch(buildApiUrl(`/teaching-quality/class-employment-period-plan-supervision?campus=${encodeURIComponent(campus)}&class=${encodeURIComponent(className)}&year=${year}&month=${month}`))
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setNeedEmploymentCount(data.需就业人数 != null ? String(data.需就业人数) : '')
      
      // 解析就业周期（格式：YYYY-MM-DD ~ YYYY-MM-DD）
      const periodStr = data.就业周期 || ''
      if (periodStr && periodStr.includes('~')) {
        const [start, end] = periodStr.split('~').map((s: string) => s.trim())
        setPeriodStart(start ? dayjs(start) : null)
        setPeriodEnd(end ? dayjs(end) : null)
      } else {
        setPeriodStart(null)
        setPeriodEnd(null)
      }
      
      setTargetAverageSalary(data.目标平均薪资 != null ? String(data.目标平均薪资) : '')
      setHeadTeacher(data.负责班主任 || '')
      setTeacher(data.负责教员 || '')

      const rows = (data.行列表 || []) as any[]
      if (rows.length) {
        const mapped: EmploymentPeriodPlanRow[] = rows.map((r: any, idx: number) => ({
          key: String(r.序号 ?? idx + 1),
          serialNumber: Number(r.序号 ?? idx + 1),
          date: r.日期 || '',
          formOrLocation: r.形式地点 || '',
          workContent: r.工作内容 || '',
          workTarget: r.工作目标 || '',
          howToDo: r.如何做 || '',
          result: r.实际工作结果 || '',
          headTeacher: r.班主任 || '',
          teacher: r.教员 || '',
          supervisor: r.监督人 || '',
          remark: r.备注 || '',
        }))
        setDataSource(mapped)
      } else {
        setDataSource(createInitialRows())
      }
      message.success('已刷新')
    } catch (e) {
      console.error(e)
      message.error('刷新失败')
    }
  }

  useEffect(() => { if (canIO) handleRefresh() }, [campus, className, year, month])

  // 保存
  const handleSave = async () => {
    if (!canIO) { message.warning('请选择神殿、班级、年月'); return }
    try {
      console.log('保存前的 dataSource:', dataSource);
      
      // 构建就业周期字符串
      let periodStr = null
      if (periodStart && periodEnd) {
        periodStr = `${periodStart.format('YYYY-MM-DD')} ~ ${periodEnd.format('YYYY-MM-DD')}`
      } else if (periodStart) {
        periodStr = periodStart.format('YYYY-MM-DD')
      } else if (periodEnd) {
        periodStr = periodEnd.format('YYYY-MM-DD')
      }
      
      const payload = {
        神殿名称: campus,
        班级名称: className,
        年份: year,
        月份: month,
        需就业人数: needEmploymentCount ? Number(needEmploymentCount) : null,
        就业周期: periodStr,
        目标平均薪资: targetAverageSalary ? Number(targetAverageSalary) : null,
        负责班主任: headTeacher || null,
        负责教员: teacher || null,
        行列表: dataSource.map((r) => ({
          序号: r.serialNumber,
          日期: r.date || null,
          形式地点: r.formOrLocation || null,
          工作内容: r.workContent || null,
          工作目标: r.workTarget || null,
          如何做: r.howToDo || null,
          实际工作结果: r.result || null,
          班主任: r.headTeacher || null,
          教员: r.teacher || null,
          监督人: r.supervisor || null,
          备注: r.remark || null,
        })),
      }
      console.log('发送的 payload:', payload);
      const res = await fetch(buildApiUrl('/teaching-quality/class-employment-period-plan-supervision'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(await res.text())
      message.success('保存成功')
      await handleRefresh()
    } catch (e) {
      console.error(e)
      message.error('保存失败')
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <Card title={`${campus} ${className} 就业期计划和监督表（${year}年${month}月）`} style={{ marginBottom: 16 }} extra={
        <Space>
          <Button onClick={handleAddRow}>新增行</Button>
          <Button onClick={handleRefresh} disabled={!canIO}>刷新</Button>
          <Button type="primary" onClick={handleSave} disabled={!canIO}>保存</Button>
        </Space>
      }>
        <div style={{ marginBottom: 16, lineHeight: 1.8 }}>
          <span style={{ marginRight: 24 }}>
            需就业人数：
            <Input style={{ width: 80 }} value={needEmploymentCount} onChange={(e) => setNeedEmploymentCount(e.target.value)} />
          </span>
          <span style={{ marginRight: 24 }}>
            就业周期：
            <DatePicker 
              style={{ width: 140 }} 
              value={periodStart} 
              onChange={(date) => setPeriodStart(date)}
              format="YYYY-MM-DD"
              placeholder="开始日期"
            />
            <span style={{ margin: '0 8px' }}>~</span>
            <DatePicker 
              style={{ width: 140 }} 
              value={periodEnd} 
              onChange={(date) => setPeriodEnd(date)}
              format="YYYY-MM-DD"
              placeholder="结束日期"
            />
          </span>
          <span style={{ marginRight: 24 }}>
            目标平均薪资：
            <Input style={{ width: 100 }} value={targetAverageSalary} onChange={(e) => setTargetAverageSalary(e.target.value)} />
          </span>
          <div style={{ marginTop: 8 }}>
            <span style={{ marginRight: 24 }}>
              负责班主任：
              <Input style={{ width: 140 }} value={headTeacher} onChange={(e) => setHeadTeacher(e.target.value)} />
            </span>
            <span style={{ marginRight: 24 }}>
              负责教员：
              <Input style={{ width: 140 }} value={teacher} onChange={(e) => setTeacher(e.target.value)} />
            </span>
          </div>
        </div>

        <Table<EmploymentPeriodPlanRow>
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
}

export default ClassEmploymentPeriodPlanSupervisionTable
