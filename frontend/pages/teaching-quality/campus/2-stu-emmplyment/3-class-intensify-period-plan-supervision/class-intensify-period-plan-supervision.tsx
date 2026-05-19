//XX神殿教化司XX班强化期计划和监督表
// 强化期就业计划和监督表

import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { App, Card, Table, Input, Button, Space, DatePicker } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { buildApiUrl } from '@/utils/apiBase'

interface IntensifyPlanRow {
  key: string
  serialNumber: number
  date: string
  weekday: string
  workContent: string
  formOrLocation: string
  workTarget: string
  howToDo: string
  result: string
  followUpTarget: string
  participants: string
  organizer: string
  supervisor: string
  evaluation: string
  isNew?: boolean
}

interface Props {
  campus: string
  className: string
}

const initialRows: IntensifyPlanRow[] = Array.from({ length: 30 }, (_, idx) => ({
  key: String(idx + 1),
  serialNumber: idx + 1,
  date: '',
  weekday: '',
  workContent: '',
  formOrLocation: '',
  workTarget: '',
  howToDo: '',
  result: '',
  followUpTarget: '',
  participants: '',
  organizer: '',
  supervisor: '',
  evaluation: '',
}))

const ClassIntensifyPeriodPlanSupervisionTable: React.FC<Props> = ({ campus, className }) => {
  const { message } = App.useApp()
  const [dataSource, setDataSource] = useState<IntensifyPlanRow[]>([])

  // 表头元信息
  const [needEmploymentCount, setNeedEmploymentCount] = useState<string>('')
  const [intensifyPeriod, setIntensifyPeriod] = useState<string>('')
  const [graduateDate, setGraduateDate] = useState<string>('')
  const [employmentPeriod, setEmploymentPeriod] = useState<string>('')
  const [targetAverageSalary, setTargetAverageSalary] = useState<string>('')
  const [headTeacher, setHeadTeacher] = useState<string>('')
  const [teacher, setTeacher] = useState<string>('')

  const canIO = useMemo(() => Boolean(campus && className), [campus, className])

  // 优化：使用 useCallback 缓存 handleChange 函数（立即更新，保证输入流畅），并仅更新目标行
  const handleChange = useCallback((key: string, field: keyof IntensifyPlanRow, value: string) => {
    setDataSource((prev) => {
      const next = [...prev]
      const idx = next.findIndex((r) => r.key === key)
      if (idx !== -1) {
        next[idx] = { ...next[idx], [field]: value }
      }
      return next
    })
  }, [])

  // 判断一行是否有数据（除序号、key、isNew外）
  const hasAnyData = useCallback((r: IntensifyPlanRow) => {
    return [
      r.date,
      r.weekday,
      r.workContent,
      r.formOrLocation,
      r.workTarget,
      r.howToDo,
      r.result,
      r.followUpTarget,
      r.participants,
      r.organizer,
      r.supervisor,
      r.evaluation,
    ].some((v) => typeof v === 'string' && v.trim() !== '')
  }, [])

  // 新增一行（仅本地，保存时一起提交）
  const addRow = useCallback(() => {
    setDataSource((prev) => {
      const nextSerial = (prev.length ? Math.max(...prev.map((r) => r.serialNumber)) : 0) + 1
      const newRow: IntensifyPlanRow = {
        key: `new-${Date.now()}`,
        serialNumber: nextSerial,
        date: '',
        weekday: '',
        workContent: '',
        formOrLocation: '',
        workTarget: '',
        howToDo: '',
        result: '',
        followUpTarget: '',
        participants: '',
        organizer: '',
        supervisor: '',
        evaluation: '',
        isNew: true,
      }
      return [...prev, newRow]
    })
  }, [])

  // 只显示有数据的行，或处于新增状态的行
  const visibleRows = useMemo(() => dataSource.filter((r) => r.isNew || hasAnyData(r)), [dataSource, hasAnyData])

  // 优化：使用 useMemo 缓存列定义，避免每次渲染都重新创建
  const columns: ColumnsType<IntensifyPlanRow> = useMemo(() => [
    { title: '序号', dataIndex: 'serialNumber', key: 'serialNumber', width: 70, align: 'center', fixed: 'left' },
    { 
      title: '日期', 
      dataIndex: 'date', 
      key: 'date', 
      width: 140, 
      align: 'center', 
      shouldCellUpdate: (record, prev) => record.date !== prev.date,
      render: (text, record) => (
        <DatePicker 
          value={text ? dayjs(text, 'YYYY-MM-DD') : null} 
          onChange={(date) => {
            const dateStr = date ? date.format('YYYY-MM-DD') : ''
            handleChange(record.key, 'date', dateStr)
            // 自动填充星期
            if (date) {
              const weekdays = ['日', '一', '二', '三', '四', '五', '六']
              const weekday = '星期' + weekdays[date.day()]
              handleChange(record.key, 'weekday', weekday)
            }
          }}
          format="YYYY-MM-DD"
          style={{ width: '100%' }}
        />
      )
    },
    { title: '星期', dataIndex: 'weekday', key: 'weekday', width: 80, align: 'center', render: (text, record) => <Input value={text} onChange={(e) => handleChange(record.key, 'weekday', e.target.value)} /> },
    { title: '工作内容', dataIndex: 'workContent', key: 'workContent', width: 260, align: 'left', render: (text, record) => <Input.TextArea autoSize={{ minRows: 1, maxRows: 3 }} value={text} onChange={(e) => handleChange(record.key, 'workContent', e.target.value)} /> },
    { title: '形式/地点', dataIndex: 'formOrLocation', key: 'formOrLocation', width: 160, align: 'center', render: (text, record) => <Input value={text} onChange={(e) => handleChange(record.key, 'formOrLocation', e.target.value)} /> },
    { title: '工作目标', dataIndex: 'workTarget', key: 'workTarget', width: 260, align: 'left', render: (text, record) => <Input.TextArea autoSize={{ minRows: 1, maxRows: 3 }} value={text} onChange={(e) => handleChange(record.key, 'workTarget', e.target.value)} /> },
    { title: '如何做', dataIndex: 'howToDo', key: 'howToDo', width: 260, align: 'left', render: (text, record) => <Input.TextArea autoSize={{ minRows: 1, maxRows: 3 }} value={text} onChange={(e) => handleChange(record.key, 'howToDo', e.target.value)} /> },
    { title: '实际工作结果', dataIndex: 'result', key: 'result', width: 260, align: 'left', render: (text, record) => <Input.TextArea autoSize={{ minRows: 1, maxRows: 3 }} value={text} onChange={(e) => handleChange(record.key, 'result', e.target.value)} /> },
    { title: '后期跟进目标', dataIndex: 'followUpTarget', key: 'followUpTarget', width: 260, align: 'left', render: (text, record) => <Input.TextArea autoSize={{ minRows: 1, maxRows: 3 }} value={text} onChange={(e) => handleChange(record.key, 'followUpTarget', e.target.value)} /> },
    { title: '参与人', dataIndex: 'participants', key: 'participants', width: 220, align: 'left', render: (text, record) => <Input value={text} onChange={(e) => handleChange(record.key, 'participants', e.target.value)} /> },
    { title: '组织者', dataIndex: 'organizer', key: 'organizer', width: 120, align: 'center', render: (text, record) => <Input value={text} onChange={(e) => handleChange(record.key, 'organizer', e.target.value)} /> },
    { title: '监督人', dataIndex: 'supervisor', key: 'supervisor', width: 120, align: 'center', render: (text, record) => <Input value={text} onChange={(e) => handleChange(record.key, 'supervisor', e.target.value)} /> },
    { title: '评价结果', dataIndex: 'evaluation', key: 'evaluation', width: 220, align: 'left', render: (text, record) => <Input.TextArea autoSize={{ minRows: 1, maxRows: 3 }} value={text} onChange={(e) => handleChange(record.key, 'evaluation', e.target.value)} /> },
  ], [handleChange])

  // 加载
  const handleRefresh = async () => {
    if (!canIO) { message.warning('请选择神殿和班级'); return }
    try {
      const res = await fetch(buildApiUrl(`/teaching-quality/class-intensify-plan-supervision?campus=${encodeURIComponent(campus)}&class=${encodeURIComponent(className)}`))
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setNeedEmploymentCount(data.需就业人数 != null ? String(data.需就业人数) : '')
      setIntensifyPeriod(data.强化周期 || '')
      setGraduateDate(data.毕业时间 || '')
      setEmploymentPeriod(data.就业周期 || '')
      setTargetAverageSalary(data.目标平均薪资 != null ? String(data.目标平均薪资) : '')
      setHeadTeacher(data.负责班主任 || '')
      setTeacher(data.负责教员 || '')

      const rows = (data.行列表 || []) as any[]
      if (rows.length) {
        const mapped: IntensifyPlanRow[] = rows.map((r: any, idx: number) => ({
          key: String(r.序号 ?? idx + 1),
          serialNumber: Number(r.序号 ?? idx + 1),
          date: r.日期 || '',
          weekday: r.星期 || '',
          workContent: r.工作内容 || '',
          formOrLocation: r.形式地点 || '',
          workTarget: r.工作目标 || '',
          howToDo: r.如何做 || '',
          result: r.实际工作结果 || '',
          followUpTarget: r.后期跟进目标 || '',
          participants: r.参与人 || '',
          organizer: r.组织者 || '',
          supervisor: r.监督人 || '',
          evaluation: r.评价结果 || '',
        }))
        setDataSource(mapped)
      } else {
        // 不再填充占位行：只显示有数据的行
        setDataSource([])
      }
      message.success('已刷新')
    } catch (e) {
      console.error(e)
      message.error('刷新失败')
    }
  }

  useEffect(() => { if (canIO) handleRefresh() }, [campus, className])



  const handleSave = async () => {
    if (!canIO) { message.warning('请选择神殿和班级'); return }
    try {
      const payload = {
        神殿名称: campus,
        班级名称: className,
        需就业人数: needEmploymentCount ? Number(needEmploymentCount) : null,
        强化周期: intensifyPeriod || null,
        毕业时间: graduateDate || null,
        就业周期: employmentPeriod || null,
        目标平均薪资: targetAverageSalary ? Number(targetAverageSalary) : null,
        负责班主任: headTeacher || null,
        负责教员: teacher || null,
        行列表: dataSource.map((r) => ({
          序号: r.serialNumber,
          日期: r.date || null,
          星期: r.weekday || null,
          工作内容: r.workContent || null,
          形式地点: r.formOrLocation || null,
          工作目标: r.workTarget || null,
          如何做: r.howToDo || null,
          实际工作结果: r.result || null,
          后期跟进目标: r.followUpTarget || null,
          参与人: r.participants || null,
          组织者: r.organizer || null,
          监督人: r.supervisor || null,
          评价结果: r.evaluation || null,
        })),
      }
      const res = await fetch(buildApiUrl('/teaching-quality/class-intensify-plan-supervision'), {
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
      <Card title={`${campus} ${className} 强化期就业计划和监督表`} style={{ marginBottom: 16 }} extra={
        <Space>
          <Button onClick={addRow} disabled={!canIO}>新增一行</Button>
          <Button onClick={handleRefresh} disabled={!canIO}>刷新</Button>
          <Button type="primary" onClick={handleSave} disabled={!canIO}>保存</Button>
        </Space>
      }>
        <div style={{ marginBottom: 16, lineHeight: 1.8 }}>
          <span style={{ marginRight: 24 }}>
            班级名称：
            <Input style={{ width: 120 }} value={className} readOnly />
          </span>
          <span style={{ marginRight: 24 }}>
            需就业人数：
            <Input style={{ width: 80 }} value={needEmploymentCount} onChange={(e) => setNeedEmploymentCount(e.target.value)} />
          </span>
          <span style={{ marginRight: 24 }}>
            强化周期：
            <Input style={{ width: 100 }} value={intensifyPeriod} onChange={(e) => setIntensifyPeriod(e.target.value)} />
          </span>
          <span style={{ marginRight: 24 }}>
            毕业时间：
            <Input style={{ width: 120 }} value={graduateDate} onChange={(e) => setGraduateDate(e.target.value)} />
          </span>
          <span style={{ marginRight: 24 }}>
            就业周期：
            <Input style={{ width: 160 }} value={employmentPeriod} onChange={(e) => setEmploymentPeriod(e.target.value)} />
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

        <Table<IntensifyPlanRow>
          bordered
          size="small"
          columns={columns}
          dataSource={visibleRows}
          pagination={false}
          rowKey="key"
          scroll={{ x: 'max-content' }}
        />
      </Card>
    </div>
  )
}

export default ClassIntensifyPeriodPlanSupervisionTable
