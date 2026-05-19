import React, { useEffect, useMemo, useState } from 'react'
import { App, Card, InputNumber, Select, Button, Space, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { buildApiUrl } from '@/utils/apiBase'
import { fetchTeachers, type TeacherProfile } from '@/services/configMaster'
const { Option } = Select

interface Props {
  selectedCampus: string
  /**
   * 由父组件（TAB-index）统一维护当前选中班级（用于跨 Tab 保持一致）
   * 可选：不传则组件内部自管
   */
  selectedClass?: string
  onClassChange?: React.Dispatch<React.SetStateAction<string>>
}

const ClassEmploymentSummary: React.FC<Props> = ({ selectedCampus, selectedClass: selectedClassFromProps, onClassChange }) => {
  const { message } = App.useApp()
  const now = dayjs()
  const [selectedYear, setSelectedYear] = useState<number>(now.year())
  const [selectedClassInner, setSelectedClassInner] = useState<string>('')

  const selectedClass = selectedClassFromProps ?? selectedClassInner
  const setSelectedClass = onClassChange ?? setSelectedClassInner
  const [classOptionsFromServer, setClassOptionsFromServer] = useState<string[]>([])
  const [summary, setSummary] = useState<any | null>(null)
  const [summaryInputs, setSummaryInputs] = useState<{ targetSalary?: number; teachers?: string[] }>({})
  const [loading, setLoading] = useState(false)
  const [teacherOptions, setTeacherOptions] = useState<TeacherProfile[]>([])

  // 从配置中心获取负责强化的教员列表
  const loadTeachers = async (campus: string) => {
    try {
      const teachers = await fetchTeachers({ campus_name: campus, active: true, is_primary: true })
      setTeacherOptions(teachers || [])
    } catch (e) {
      console.error('获取教员列表失败:', e)
      setTeacherOptions([])
    }
  }

  // 从后端读取班级列表（按神殿）
  const fetchClasses = async (campus: string) => {
    try {
      setLoading(true)
      let url = buildApiUrl(`/teaching-quality/class-list?campus=${encodeURIComponent(campus)}`)
      let res = await fetch(url)
      let list: any[] = res.ok ? await res.json() : []

      if ((list?.length ?? 0) === 0) {
        const norm = campus.endsWith('神殿') ? campus.slice(0, -2) : campus
        url = buildApiUrl(`/teaching-quality/class-list?campus=${encodeURIComponent(norm)}`)
        res = await fetch(url)
        list = res.ok ? await res.json() : []
      }

      if ((list?.length ?? 0) === 0) {
        url = buildApiUrl('/teaching-quality/class-list')
        res = await fetch(url)
        list = res.ok ? await res.json() : []
      }

      const names = Array.from(new Set((list || []).map((x) => String(x['班级名称'] || '').trim()).filter(Boolean)))
      setClassOptionsFromServer(names)
      if (!selectedClass && names.length > 0) {
        setSelectedClass(names[0])
      }
    } catch (e) {
      console.error(e)
      message.error('加载班级列表失败')
      setClassOptionsFromServer([])
    } finally {
      setLoading(false)
    }
  }

  const fetchSummary = async (campus: string, year: number, clazz: string) => {
    if (!clazz) { setSummary(null); setSummaryInputs({}); return }
    try {
      setLoading(true)
      const res = await fetch(buildApiUrl(`/teaching-quality/qt-class-employment-summary?campus=${encodeURIComponent(campus)}&year=${year}&clazz=${encodeURIComponent(clazz)}`))
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      
      // 如果后端没有教员信息，尝试从班级配置中获取
      let teacherNames: string[] = []
      const teacherStr = data?.教员 ?? ''
      if (teacherStr) {
        // 后端返回的可能是逗号分隔的多个教员
        teacherNames = teacherStr.split(',').map((s: string) => s.trim()).filter(Boolean)
      }
      if (teacherNames.length === 0) {
        try {
          const classRes = await fetch(buildApiUrl(`/config/get-teacher-by-class?className=${encodeURIComponent(clazz)}`))
          if (classRes.ok) {
            const classData = await classRes.json()
            // 可能返回单个或多个教员
            const names = classData?.teacherNames || (classData?.teacherName ? [classData.teacherName] : [])
            teacherNames = names
          }
        } catch (e) {
          console.error('获取教员信息失败:', e)
        }
      }
      
      setSummary(data || null)
      setSummaryInputs({
        targetSalary: data?.目标平均薪资 ?? undefined,
        teachers: teacherNames.length > 0 ? teacherNames : undefined,
      })
    } catch (e) {
      console.error(e)
      setSummary(null)
      setSummaryInputs({})
    } finally {
      setLoading(false)
    }
  }

  const saveSummary = async () => {
    if (!selectedClass) { message.warning('请选择班级'); return }
    try {
      setLoading(true)
      const payload = {
        神殿名称: selectedCampus,
        年份: selectedYear,
        班级名称: selectedClass,
        目标平均薪资: summaryInputs.targetSalary ?? 0,
        教员: (summaryInputs.teachers || []).join(','),
      }
      const res = await fetch(buildApiUrl('/teaching-quality/qt-class-employment-summary'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setSummary(data || null)
      message.success('汇总已保存')
    } catch (e) {
      console.error(e)
      message.error('保存汇总失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedCampus) {
      fetchClasses(selectedCampus)
      loadTeachers(selectedCampus)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCampus])

  useEffect(() => {
    if (selectedClass) {
      fetchSummary(selectedCampus, selectedYear, selectedClass)
    } else {
      setSummary(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCampus, selectedYear, selectedClass])

  const actualRateText = useMemo(() => {
    const den = summary?.结案人数 || 0
    const num = summary?.实际就业人数 || 0
    if (!den) return '0%'
    const rate = (num / den) * 100
    return `${Math.round(rate)}%`
  }, [summary])

  const needRateText = useMemo(() => {
    const den = summary?.需就业人数 || 0
    const num = summary?.实际就业人数 || 0
    if (!den) return '0%'
    const rate = (num / den) * 100
    return `${Math.round(rate)}%`
  }, [summary])

  const achieveRateText = useMemo(() => {
    const den = summaryInputs.targetSalary || 0

    // 实际平均薪资计算口径：
    // 取“回访转正薪资”字段做平均，分母包含回访转正薪资为 0 的学员；
    // 仅排除未填写（undefined / null）的情况。
    const rows: any[] = summary?.行列表 || summary?.rows || []
    const salaryRows = rows.filter((r) => r?.followUpAssessmentSalary !== undefined && r?.followUpAssessmentSalary !== null)
    const num = salaryRows.length
      ? salaryRows.reduce((sum, r) => sum + (Number(r.followUpAssessmentSalary) || 0), 0) / salaryRows.length
      : (summary?.实际平均薪资 || 0)

    if (!den) return '0%'
    const rate = (num / den) * 100
    return `${Math.round(rate)}%`
  }, [summary, summaryInputs.targetSalary])

  const currentYear = now.year()
  const yearOptions = Array.from({ length: 7 }, (_, i) => currentYear - 3 + i)
  const campusOptions = ['主神殿', '李大殿', '天桥神殿']

  return (
    <div style={{ padding: 24 }}>
        <Card 
            title="班级就业信息汇总" 
            extra={
                <Space size={12} align="center">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ color: '#666' }}>年份</span>
                        <Select
                            size="small"
                            style={{ width: 92 }}
                            value={selectedYear}
                            onChange={setSelectedYear}
                        >
                            {yearOptions.map((y) => (
                            <Option key={y} value={y}>
                                {y}年
                            </Option>
                            ))}
                        </Select>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ color: '#666' }}>班级</span>
                        <Select
                            size="small"
                            style={{ width: 160 }}
                            placeholder="请选择班级"
                            value={selectedClass || undefined}
                            onChange={setSelectedClass}
                            showSearch
                            filterOption={(input, option) => (option?.value as string).toLowerCase().includes(input.toLowerCase())}
                        >
                            {classOptionsFromServer.map((c) => (
                            <Option key={c} value={c}>
                                {c}
                            </Option>
                            ))}
                        </Select>
                    </div>
                    <Button loading={loading} onClick={() => { if (selectedClass) { fetchSummary(selectedCampus, selectedYear, selectedClass) } }}>刷新</Button>
                    <Button type="primary" onClick={saveSummary} disabled={!selectedClass}>保存汇总</Button>
                </Space>
            }
        >
            {selectedClass && summary ? (
                <Table
                    dataSource={[{
                        key: 'summary',
                        班级: selectedClass,
                        档案人数: summary?.结案人数 ?? 0,
                        需就业人数: summary?.需就业人数 ?? 0,
                        实际就业人数: summary?.实际就业人数 ?? 0,
                        实际就业率: actualRateText,
                        实际需就业率: needRateText,
                        目标平均薪资: summaryInputs.targetSalary ?? 0,
                        实际平均薪资: (() => {
                            const rows: any[] = summary?.行列表 || summary?.rows || []
                            const salaryRows = rows.filter((r) => r?.followUpAssessmentSalary !== undefined && r?.followUpAssessmentSalary !== null)
                            if (salaryRows.length === 0) return summary?.实际平均薪资 ?? 0
                            const total = salaryRows.reduce((sum, r) => sum + (Number(r.followUpAssessmentSalary) || 0), 0)
                            return Math.round(total / salaryRows.length)
                        })(),
                        就业达标率: achieveRateText,
                        教员: summaryInputs.teachers?.join('、') ?? '',
                        班主任: summary?.班主任 ?? '',
                    }]}
                    columns={[
                        {
                            title: '班级',
                            dataIndex: '班级',
                            key: '班级',
                            width: 120,
                            align: 'center',
                            render: (text) => <span style={{ fontWeight: 500 }}>{text || '-'}</span>,
                        },
                        {
                            title: '档案人数',
                            dataIndex: '档案人数',
                            key: '档案人数',
                            width: 100,
                            align: 'center',
                            render: (value) => <span>{value ?? 0}</span>,
                        },
                        {
                            title: '需就业人数',
                            dataIndex: '需就业人数',
                            key: '需就业人数',
                            width: 100,
                            align: 'center',
                            render: (value) => <span>{value ?? 0}</span>,
                        },
                        {
                            title: '实际就业人数',
                            dataIndex: '实际就业人数',
                            key: '实际就业人数',
                            width: 120,
                            align: 'center',
                            render: (value) => <span style={{ color: '#52c41a', fontWeight: 500 }}>{value ?? 0}</span>,
                        },
                        {
                            title: '实际就业率',
                            dataIndex: '实际就业率',
                            key: '实际就业率',
                            width: 100,
                            align: 'center',
                            render: (text) => <span style={{ color: '#1890ff' }}>{text || '0%'}</span>,
                        },
                        {
                            title: '实际需就业率',
                            dataIndex: '实际需就业率',
                            key: '实际需就业率',
                            width: 120,
                            align: 'center',
                            render: (text) => <span style={{ color: '#722ed1' }}>{text || '0%'}</span>,
                        },
                        {
                            title: '目标平均薪资',
                            dataIndex: '目标平均薪资',
                            key: '目标平均薪资',
                            width: 120,
                            align: 'center',
                            render: (value, record) => (
                                <InputNumber
                                    value={summaryInputs.targetSalary ?? 0}
                                    onChange={(v) => setSummaryInputs((s) => ({ ...s, targetSalary: v ?? 0 }))}
                                    style={{ width: '100%' }}
                                    min={0}
                                    formatter={(value) => `${value || ''}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                    parser={(value) => {
                                        const parsed = value?.replace(/\$\s?|(,*)/g, '') || '0'
                                        return Number(parsed) || 0
                                    }}
                                />
                            ),
                        },
                        {
                            title: '实际平均薪资',
                            dataIndex: '实际平均薪资',
                            key: '实际平均薪资',
                            width: 120,
                            align: 'center',
                            render: (value) => {
                                const numValue = typeof value === 'number' ? value : Number(value) || 0
                                return <span style={{ color: '#fa8c16', fontWeight: 500 }}>{numValue.toLocaleString()}</span>
                            },
                        },
                        {
                            title: '就业达标率',
                            dataIndex: '就业达标率',
                            key: '就业达标率',
                            width: 100,
                            align: 'center',
                            render: (text) => <span style={{ color: '#13c2c2' }}>{text || '0%'}</span>,
                        },
                        {
                            title: '教员',
                            dataIndex: '教员',
                            key: '教员',
                            width: 180,
                            align: 'center',
                            render: (text, record) => (
                                <Select
                                    mode="multiple"
                                    value={summaryInputs.teachers || []}
                                    onChange={(value) => setSummaryInputs((s) => ({ ...s, teachers: value }))}
                                    placeholder="请选择教员"
                                    style={{ width: '100%' }}
                                    allowClear
                                    showSearch
                                    optionFilterProp="children"
                                    maxTagCount={2}
                                >
                                    {teacherOptions.map((t) => (
                                        <Option key={t.id} value={t.name}>{t.name}</Option>
                                    ))}
                                </Select>
                            ),
                        },
                        {
                            title: '班主任',
                            dataIndex: '班主任',
                            key: '班主任',
                            width: 100,
                            align: 'center',
                            render: (text) => <span>{text || '-'}</span>,
                        },
                    ]}
                    pagination={false}
                    bordered
                    size="small"
                    style={{
                        backgroundColor: '#fff',
                    }}
                />
            ) : (
                <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                    请选择班级以查看汇总信息
                </div>
            )}
        </Card>
    </div>
  )
}

export default ClassEmploymentSummary
