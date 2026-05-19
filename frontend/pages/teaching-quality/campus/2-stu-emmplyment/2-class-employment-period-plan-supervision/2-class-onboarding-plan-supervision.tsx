// 入职计划和监督表

import React, { useEffect, useMemo, useState } from 'react'
import { App, Card, Table, Input, Button, Space } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { buildApiUrl } from '@/utils/apiBase'

interface OnboardingPlanRow {
  key: string
  serialNumber: number
  name: string
  gender: string
  currentAge: string
  currentEducation: string
  targetRegion: string
  targetPosition: string
  targetSalary: string
  headTeacher: string
  teacher: string
  // 动态日期/周总结字段
  [key: string]: string | number
}

interface Props { campus: string; className: string; year: number; month: number }

const createInitialRows = (count = 10): OnboardingPlanRow[] => {
  const rows: OnboardingPlanRow[] = []
  for (let i = 1; i <= count; i += 1) {
    rows.push({
      key: String(i),
      serialNumber: i,
      name: '',
      gender: '',
      currentAge: '',
      currentEducation: '',
      targetRegion: '',
      targetPosition: '',
      targetSalary: '',
      headTeacher: '',
      teacher: '',
    })
  }
  return rows
}

// 根据真实日历动态生成当月日期列与周总结列（周一至周日为一周，周日后插入周总结）
const monthPrefixes = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec']
const getMonthPrefix = (m: number) => monthPrefixes[(m - 1 + 12) % 12]

const buildMonthKeys = (year: number, month: number): string[] => {
  const prefix = getMonthPrefix(month)
  const lastDay = new Date(year, month, 0).getDate() // month 为 1-12
  const keys: string[] = []
  let weekIndex = 1
  for (let d = 1; d <= lastDay; d += 1) {
    keys.push(`${prefix}${d}`)
    const dayOfWeek = new Date(year, month - 1, d).getDay() // 0=周日,1=周一,...
    const isLastDay = d === lastDay
    const isEndOfWeek = dayOfWeek === 0 // 周日
    if (isEndOfWeek || isLastDay) {
      keys.push(`${prefix}Week${weekIndex}`)
      weekIndex += 1
    }
  }
  return keys
}

const getTitleForKey = (key: string): string => {
  const lower = key.toLowerCase()
  if (lower.includes('week')) return '周总结'
  const m = key.match(/(\d+)/)
  const num = m ? m[1] : key
  return `${num}日`
}

const ClassOnboardingPlanSupervisionTable: React.FC<Props> = ({ campus, className, year, month }) => {
  const { message } = App.useApp()
  const [dataSource, setDataSource] = useState<OnboardingPlanRow[]>(createInitialRows())
  const [description, setDescription] = useState('')

  const canIO = useMemo(() => Boolean(campus && className && year && month), [campus, className, year, month])

  const handleChange = (key: string, field: string, value: string) => {
    setDataSource((prev) => prev.map((row) => (row.key === key ? { ...row, [field]: value } : row)))
  }

  const dayKeys = useMemo(() => buildMonthKeys(year, month), [year, month])

  const baseColumns: ColumnsType<OnboardingPlanRow> = [
    { title: '序号', dataIndex: 'serialNumber', key: 'serialNumber', width: 70, align: 'center', fixed: 'left' },
    { title: '姓名', dataIndex: 'name', key: 'name', width: 100, fixed: 'left', align: 'center', render: (text, record) => (
      <Input value={text as string} onChange={(e) => handleChange(record.key, 'name', e.target.value)} />
    ) },
    { title: '性别', dataIndex: 'gender', key: 'gender', width: 80, align: 'center', render: (text, record) => (
      <Input value={text as string} onChange={(e) => handleChange(record.key, 'gender', e.target.value)} />
    ) },
    { title: '目前年龄', dataIndex: 'currentAge', key: 'currentAge', width: 100, align: 'center', render: (text, record) => (
      <Input value={text as string} onChange={(e) => handleChange(record.key, 'currentAge', e.target.value)} />
    ) },
    { title: '现有学历', dataIndex: 'currentEducation', key: 'currentEducation', width: 100, align: 'center', render: (text, record) => (
      <Input value={text as string} onChange={(e) => handleChange(record.key, 'currentEducation', e.target.value)} />
    ) },
    { title: '预计就业地区', dataIndex: 'targetRegion', key: 'targetRegion', width: 140, align: 'center', render: (text, record) => (
      <Input value={text as string} onChange={(e) => handleChange(record.key, 'targetRegion', e.target.value)} />
    ) },
    { title: '目标岗位', dataIndex: 'targetPosition', key: 'targetPosition', width: 220, align: 'left', render: (text, record) => (
      <Input value={text as string} onChange={(e) => handleChange(record.key, 'targetPosition', e.target.value)} />
    ) },
    { title: '目标薪资', dataIndex: 'targetSalary', key: 'targetSalary', width: 110, align: 'center', render: (text, record) => (
      <Input value={text as string} onChange={(e) => handleChange(record.key, 'targetSalary', e.target.value)} />
    ) },
    { title: '负责班主任', dataIndex: 'headTeacher', key: 'headTeacher', width: 120, align: 'center', render: (text, record) => (
      <Input value={text as string} onChange={(e) => handleChange(record.key, 'headTeacher', e.target.value)} />
    ) },
    { title: '负责教员', dataIndex: 'teacher', key: 'teacher', width: 120, align: 'center', render: (text, record) => (
      <Input value={text as string} onChange={(e) => handleChange(record.key, 'teacher', e.target.value)} />
    ) },
  ]

  const dateColumns: ColumnsType<OnboardingPlanRow> = dayKeys.map((key) => ({
    title: getTitleForKey(key),
    dataIndex: key,
    key,
    width: key.toLowerCase().includes('week') ? 120 : 90,
    align: 'center',
    render: (text: string | number | undefined, record) => (
      <Input value={(text as string) || ''} onChange={(e) => handleChange(record.key, key, e.target.value)} />
    ),
  }))

  // 读取班级档案名册（原样/去后缀/加后缀）
  const fetchRosterRows = async (): Promise<OnboardingPlanRow[] | null> => {
    const norm = (s: string) => (s || '').replace(/神殿$/, '').trim()
    const attempts = [campus, norm(campus), `${norm(campus)}神殿`]
    for (const c of attempts) {
      try {
        const res = await fetch(buildApiUrl(`/teaching-quality/class-file?campus=${encodeURIComponent(c)}&class=${encodeURIComponent(className)}`))
        if (!res.ok) continue
        const data = await res.json()
        const rows = (data?.行列表 || []) as any[]
        const filtered = rows
          .map((r: any, idx: number) => ({ sn: Number(r.serialNumber ?? r.序号 ?? idx + 1), name: (r.name ?? r.姓名 ?? '').trim(), gender: (r.gender ?? r.性别 ?? '').trim() }))
          .filter((r: any) => r.name)
          .sort((a: any, b: any) => a.sn - b.sn)
        if (!filtered.length) continue
        return filtered.map((r: any) => ({
          key: String(r.sn),
          serialNumber: r.sn,
          name: r.name,
          gender: r.gender,
          currentAge: '',
          currentEducation: '',
          targetRegion: '',
          targetPosition: '',
          targetSalary: '',
          headTeacher: '',
          teacher: '',
        }))
      } catch { /* ignore and try next */ }
    }
    return null
  }

  // roster-first 刷新：先拿名册，后合并已保存字段
  const handleRefresh = async () => {
    if (!canIO) { message.warning('请选择神殿、班级、年月'); return }
    try {
      // 1) 先拉名册，立即显示
      const roster = await fetchRosterRows()
      if (roster && roster.length) {
        setDataSource(roster)
      } else {
        setDataSource(createInitialRows(1))
      }

      // 2) 再尝试合并服务端已保存的数据
      const res = await fetch(buildApiUrl(`/teaching-quality/class-onboarding-plan-supervision?campus=${encodeURIComponent(campus)}&class=${encodeURIComponent(className)}&year=${year}&month=${month}`))
      if (res.ok) {
        const data = await res.json()
        setDescription(data.描述 || '')
        const rows = (data.行列表 || []) as any[]
        const saved: OnboardingPlanRow[] = rows.map((r: any, idx: number) => {
          const base: OnboardingPlanRow = {
            key: String(r.序号 ?? idx + 1),
            serialNumber: Number(r.序号 ?? idx + 1),
            name: (r.姓名 || '').trim(),
            gender: r.性别 || '',
            currentAge: r.目前年龄 || '',
            currentEducation: r.现有学历 || '',
            targetRegion: r.预计就业地区 || '',
            targetPosition: r.目标岗位 || '',
            targetSalary: r.目标薪资 || '',
            headTeacher: r.负责班主任 || '',
            teacher: r.负责教员 || '',
          }
          dayKeys.forEach((k) => { if (k in r) (base as any)[k] = r[k] || '' })
          return base
        })

        const merged: OnboardingPlanRow[] = (roster && roster.length ? roster : createInitialRows(Math.max(saved.length, 1))).map((r) => {
          // 优先匹配 (序号+姓名)，否则仅按序号
          const hit = saved.find((s) => s.serialNumber === r.serialNumber && (r.name ? s.name === r.name : true)) || saved.find((s) => s.serialNumber === r.serialNumber)
          return hit ? { ...r, ...hit, name: r.name || hit.name } : r
        })
        setDataSource(merged)
      } else if (!roster || !roster.length) {
        message.info('未发现已保存行，且未能从班档案读取名册')
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
      const payload = {
        神殿名称: campus,
        班级名称: className,
        年份: year,
        月份: month,
        描述: description || null,
        行列表: dataSource.map((r) => ({
          序号: r.serialNumber,
          姓名: r.name || null,
          性别: r.gender || null,
          目前年龄: r.currentAge || null,
          现有学历: r.currentEducation || null,
          预计就业地区: r.targetRegion || null,
          目标岗位: r.targetPosition || null,
          目标薪资: r.targetSalary || null,
          负责班主任: r.headTeacher || null,
          负责教员: r.teacher || null,
          ...Object.fromEntries(dayKeys.map((k) => [k, (r as any)[k] || null])),
        })),
      }
      const res = await fetch(buildApiUrl('/teaching-quality/class-onboarding-plan-supervision'), {
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
      <Card title={`${campus} ${className} 入职计划和监督表（${year}年${month}月）`} style={{ marginBottom: 16 }} extra={
        <Space>
          <Button onClick={handleRefresh} disabled={!canIO}>刷新</Button>
          <Button type="primary" onClick={handleSave} disabled={!canIO}>保存</Button>
        </Space>
      }>
        <div style={{ marginBottom: 16, lineHeight: 1.8 }}>
          <div style={{ marginBottom: 8, fontWeight: 500 }}>就业进度（备注）</div>
          <Input.TextArea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={'请按以下格式填写就业进度：\n1、入职填写：地区、单位、岗位、薪资、其他\n2、试岗填写：地区、单位、岗位、薪资、试岗时间、情况\n3、约面试单位填写：几个面试、地区、单位、岗位、薪资、时间、其他情况\n4、招聘打招呼填写：城市地区、岗位方向、大概数量、反馈情况、其他情况\n5、其他工作结果填写：例如面试录音听取1个，问题，解决办法等'}
            autoSize={{ minRows: 4, maxRows: 8 }}
          />
        </div>

        <Table<OnboardingPlanRow>
          bordered
          size="small"
          columns={[...baseColumns, ...dateColumns]}
          dataSource={dataSource}
          pagination={false}
          rowKey="key"
          scroll={{ x: 'max-content' }}
        />
      </Card>
    </div>
  )
}

export default ClassOnboardingPlanSupervisionTable
