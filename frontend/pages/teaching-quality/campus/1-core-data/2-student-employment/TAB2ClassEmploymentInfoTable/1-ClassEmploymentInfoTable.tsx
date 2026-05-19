import React, { useEffect, useMemo, useState } from 'react'
import { App, Card, Table, Input, InputNumber, DatePicker, Select, Button, Space, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { Dayjs } from 'dayjs'
import { buildApiUrl } from '@/utils/apiBase'
import { useCampusStore } from '@/stores/campusStore'
const { Option } = Select
const { Text } = Typography

interface ClassEmploymentInfoRow {
  key: string
  serialNumber: number
  name: string
  gender: string
  age: number | null
  reportedMajor: string
  education: string
  major: string
  graduateSchool: string
  highestDegreeCert: string
  phone: string
  address: string
  entryDate: string | null
  employmentRegion: string
  employmentCompany: string
  employmentPosition: string
  probationarySalary: number | null
  regularSalary: number | null
  followUpAssessmentSalary: number | null
}

const createInitialRows = (): ClassEmploymentInfoRow[] =>
  Array.from({ length: 20 }, (_, index) => {
    const serialNumber = index + 1
    return {
      key: String(serialNumber),
      serialNumber,
      name: '',
      gender: '',
      age: null,
      reportedMajor: '',
      education: '',
      major: '',
      graduateSchool: '',
      highestDegreeCert: '',
      phone: '',
      address: '',
      entryDate: null,
      employmentRegion: '',
      employmentCompany: '',
      employmentPosition: '',
      probationarySalary: null,
      regularSalary: null,
      followUpAssessmentSalary: null,
    }
  })

const ClassEmploymentInfoTable: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus: selectedCampus, setCampus, getAllCampuses } = useCampusStore()
  const now = dayjs()
  const [selectedYear, setSelectedYear] = useState<number>(now.year())
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [classOptionsFromServer, setClassOptionsFromServer] = useState<string[]>([])
  const [classListRows, setClassListRows] = useState<any[]>([])
  const [classMajorOptions, setClassMajorOptions] = useState<string[]>([])
  const [summary, setSummary] = useState<any | null>(null)
  const [summaryInputs, setSummaryInputs] = useState<{ need?: number; actual?: number; targetSalary?: number; teacher?: string }>({})
  const [loading, setLoading] = useState(false)
  const [dataMap, setDataMap] = useState<Record<string, ClassEmploymentInfoRow[]>>({})

  const getKey = (year: number, cls: string, campus: string) => `${year}-${cls}-${campus}`
  const ensureKey = (year: number, cls: string, campus: string) => {
    const key = getKey(year, cls, campus)
    if (!dataMap[key]) {
      setDataMap((prev) => ({ ...prev, [key]: createInitialRows() }))
    }
  }

  const currentKey = getKey(selectedYear, selectedClass || 'UNSET', selectedCampus)
  const rows = dataMap[currentKey] || []

  // 从后端读取班级列表（按神殿）
  const fetchClasses = async (campus: string) => {
    try {
      setLoading(true)
      // 1) 优先按当前神殿查询
      let url = buildApiUrl(`/teaching-quality/class-list?campus=${encodeURIComponent(campus)}`)
      let res = await fetch(url)
      let ok = res.ok
      let list: any[] = ok ? await res.json() : []

      // 2) 若为空，尝试去掉“神殿”二字再查一次
      if ((list?.length ?? 0) === 0) {
        const norm = campus.endsWith('神殿') ? campus.slice(0, -2) : campus
        url = buildApiUrl(`/teaching-quality/class-list?campus=${encodeURIComponent(norm)}`)
        res = await fetch(url)
        ok = res.ok
        list = ok ? await res.json() : []
      }

      // 3) 仍为空，兜底不带参数查全部
      if ((list?.length ?? 0) === 0) {
        url = buildApiUrl('/teaching-quality/class-list')
        res = await fetch(url)
        ok = res.ok
        list = ok ? await res.json() : []
      }

      // 记录原始行，后续可取班主任/专业等
      setClassListRows(list || [])
      const names = Array.from(new Set((list || []).map((x) => String(x['班级名称'] || '').trim()).filter(Boolean)))
      const majors = Array.from(new Set((list || []).map((x) => String(x['专业'] || '').trim()).filter(Boolean)))
      setClassOptionsFromServer(names)
      setClassMajorOptions(majors)
      // 若当前未选择班级，则默认选第一个
      if (!selectedClass && names.length > 0) {
        ensureKey(selectedYear, names[0], campus)
        setSelectedClass(names[0])
      }
    } catch (e) {
      console.error(e)
      message.error('加载班级列表失败')
      setClassOptionsFromServer([])
      setClassMajorOptions([])
    } finally {
      setLoading(false)
    }
  }

  // 从后端读取该班级的就业信息表
  const fetchEmploymentRows = async (campus: string, year: number, clazz: string) => {
    if (!clazz) return
    try {
      setLoading(true)
      const res = await fetch(buildApiUrl(`/teaching-quality/qt-class-employment-info?campus=${encodeURIComponent(campus)}&year=${year}&clazz=${encodeURIComponent(clazz)}`))
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      const list: any[] = data?.行列表 || []
      const mapped: ClassEmploymentInfoRow[] = (list || []).map((r: any, idx: number) => ({
        key: String(idx + 1),
        serialNumber: idx + 1,
        name: r.name || '',
        gender: r.gender || '',
        age: r.age ?? null,
        reportedMajor: r.reportedMajor || '',
        education: r.education || '',
        major: r.major || '',
        graduateSchool: r.graduateSchool || '',
        highestDegreeCert: r.highestDegreeCert || '',
        phone: r.phone || '',
        address: r.address || '',
        entryDate: r.entryDate || null,
        employmentRegion: r.employmentRegion || '',
        employmentCompany: r.employmentCompany || '',
        employmentPosition: r.employmentPosition || '',
        probationarySalary: r.probationarySalary ?? null,
        regularSalary: r.regularSalary ?? null,
        followUpAssessmentSalary: r.followUpAssessmentSalary ?? null,
      }))
      setDataMap((prev) => ({ ...prev, [getKey(year, clazz, campus)]: mapped.length ? mapped : createInitialRows() }))
    } catch (e) {
      console.error(e)
      message.error('加载班级就业信息失败')
      setDataMap((prev) => ({ ...prev, [getKey(year, clazz, campus)]: createInitialRows() }))
    } finally {
      setLoading(false)
    }
  }

  const fetchSummary = async (campus: string, year: number, clazz: string) => {
    if (!clazz) { setSummary(null); setSummaryInputs({}); return }
    try {
      const res = await fetch(buildApiUrl(`/teaching-quality/qt-class-employment-summary?campus=${encodeURIComponent(campus)}&year=${year}&clazz=${encodeURIComponent(clazz)}`))
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setSummary(data || null)
      setSummaryInputs({
        need: data?.需就业人数 ?? undefined,
        actual: data?.实际就业人数 ?? undefined,
        targetSalary: data?.目标平均薪资 ?? undefined,
        teacher: data?.教员 ?? undefined,
      })
    } catch (e) {
      console.error(e)
      setSummary(null)
      setSummaryInputs({})
    }
  }

  const saveSummary = async () => {
    if (!selectedClass) { message.warning('请选择班级'); return }
    try {
      const payload = {
        神殿名称: selectedCampus,
        年份: selectedYear,
        班级名称: selectedClass,
        需就业人数: summaryInputs.need ?? 0,
        实际就业人数: summaryInputs.actual ?? 0,
        目标平均薪资: summaryInputs.targetSalary ?? 0,
        教员: summaryInputs.teacher || '',
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
    }
  }

  const saveEmploymentRows = async () => {
    if (!selectedClass) {
      message.warning('请选择班级')
      return
    }
    
    // 检查是否有有效数据
    const validRows = rows.filter((r) => Object.values(r).some((v) => v !== '' && v !== null))
    if (validRows.length === 0) {
      message.warning('没有有效数据，无需保存')
      return
    }
    
    try {
      setLoading(true)
      const bodies = rows.filter((r) => Object.values(r).some((v) => v !== '' && v !== null))
      const payload = {
        神殿名称: selectedCampus,
        年份: selectedYear,
        班级名称: selectedClass,
        行列表: bodies.map((r, idx) => ({
          serialNumber: idx + 1,
          name: r.name,
          gender: r.gender,
          age: r.age ?? undefined,
          reportedMajor: r.reportedMajor,
          education: r.education,
          major: r.major,
          graduateSchool: r.graduateSchool,
          highestDegreeCert: r.highestDegreeCert,
          phone: r.phone,
          address: r.address,
          entryDate: r.entryDate || undefined,
          employmentRegion: r.employmentRegion,
          employmentCompany: r.employmentCompany,
          employmentPosition: r.employmentPosition,
          probationarySalary: r.probationarySalary ?? undefined,
          regularSalary: r.regularSalary ?? undefined,
          followUpAssessmentSalary: r.followUpAssessmentSalary ?? undefined,
        })),
      }
      const res = await fetch(buildApiUrl('/teaching-quality/qt-class-employment-info'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(await res.text())
      message.success(`已保存 ${selectedCampus} ${selectedYear}年 ${selectedClass}班 的数据`)
      await fetchEmploymentRows(selectedCampus, selectedYear, selectedClass)
    } catch (e) {
      console.error(e)
      message.error('保存失败')
    } finally {
      setLoading(false)
    }
  }

  // 初次加载时拉取当前神殿的班级
  useEffect(() => {
    fetchClasses(selectedCampus)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 当神殿/年份/班级变化时，自动加载该班级的就业信息与汇总
  useEffect(() => {
    if (selectedClass) {
      fetchEmploymentRows(selectedCampus, selectedYear, selectedClass)
      fetchSummary(selectedCampus, selectedYear, selectedClass)
    } else {
      setSummary(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCampus, selectedYear, selectedClass])

  // 随班级变化，尝试从班级列表中提取该班“专业”作为候选
  useEffect(() => {
    if (!selectedClass) return
    const row = classListRows.find((r) => String(r['班级名称']) === selectedClass)
    const major = row?.['专业'] ? String(row['专业']).trim() : ''
    if (major) {
      // 支持用 / 、 ， , 空格 分隔
      const tokens = major.split(/[\/、，,\s]+/).map((s: string) => s.trim()).filter(Boolean)
      if (tokens.length > 0) setClassMajorOptions(tokens)
    }
  }, [selectedClass, classListRows])

  const updateRow = <K extends keyof ClassEmploymentInfoRow>(
    key: string,
    field: K,
    value: ClassEmploymentInfoRow[K],
  ) => {
    setDataMap((prev) => {
      const list = prev[currentKey] ? [...prev[currentKey]] : []
      const nextList = list.map((row) =>
        row.key === key
          ? {
              ...row,
              [field]: value,
            }
          : row,
      )
      return { ...prev, [currentKey]: nextList }
    })
  }

  // 计算汇总（本地实时）
  const archiveCountLocal = useMemo(() => rows.filter(r => (r.name || '').trim()).length, [rows])
  const avgFollowUpSalaryLocal = useMemo(() => {
    const nums = rows.map(r => r.followUpAssessmentSalary).filter(v => typeof v === 'number' && (v as number) > 0) as number[]
    if (!nums.length) return 0
    return Math.round(nums.reduce((a,b)=>a+b,0)/nums.length)
  }, [rows])
  const actualRateText = useMemo(() => {
    const den = archiveCountLocal || 0
    const num = summaryInputs.actual || 0
    if (!den) return '0%'
    const rate = (num/den)*100
    return `${Math.round(rate)}%`
  }, [archiveCountLocal, summaryInputs.actual])
  const needRateText = useMemo(() => {
    const den = summaryInputs.need || 0
    const num = summaryInputs.actual || 0
    if (!den) return '0%'
    const rate = (num/den)*100
    return `${Math.round(rate)}%`
  }, [summaryInputs.need, summaryInputs.actual])
  const achieveRateText = useMemo(() => {
    const den = summaryInputs.targetSalary || 0
    const num = avgFollowUpSalaryLocal || 0
    if (!den) return '0%'
    const rate = (num/den)*100
    return `${Math.round(rate)}%`
  }, [summaryInputs.targetSalary, avgFollowUpSalaryLocal])

  const columns: ColumnsType<ClassEmploymentInfoRow> = [
    {
      title: '序号',
      dataIndex: 'serialNumber',
      key: 'serialNumber',
      width: 70,
      align: 'center',
      fixed: 'left',
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 100,
      align: 'center',
      fixed: 'left',
      render: (text) => <Text>{text}</Text>,
    },
    {
      title: '性别',
      dataIndex: 'gender',
      key: 'gender',
      width: 80,
      align: 'center',
      render: (text) => <Text>{text}</Text>,
    },
    {
      title: '年龄',
      dataIndex: 'age',
      key: 'age',
      width: 80,
      align: 'center',
      render: (value) => <Text>{value ?? ''}</Text>,
    },
    {
      title: '所报专业',
      dataIndex: 'reportedMajor',
      key: 'reportedMajor',
      width: 140,
      align: 'center',
      render: (text) => <Text>{text}</Text>,
    },
    {
      title: '学历',
      dataIndex: 'education',
      key: 'education',
      width: 100,
      align: 'center',
      render: (text) => <Text>{text}</Text>,
    },
    {
      title: '专业',
      dataIndex: 'major',
      key: 'major',
      width: 160,
      align: 'center',
      render: (text) => <Text>{text}</Text>,
    },
    {
      title: '毕业学校',
      dataIndex: 'graduateSchool',
      key: 'graduateSchool',
      width: 180,
      align: 'center',
      render: (text) => <Text>{text}</Text>,
    },
    {
      title: '目前所获最高学历证书及性质',
      dataIndex: 'highestDegreeCert',
      key: 'highestDegreeCert',
      width: 220,
      align: 'center',
      render: (text) => <Text>{text}</Text>,
    },
    {
      title: '联系电话',
      dataIndex: 'phone',
      key: 'phone',
      width: 140,
      align: 'center',
      render: (text) => <Text>{text}</Text>,
    },
    {
      title: '通信地址',
      dataIndex: 'address',
      key: 'address',
      width: 220,
      align: 'center',
      render: (text) => <Text>{text}</Text>,
    },
    {
      title: '入职时间',
      dataIndex: 'entryDate',
      key: 'entryDate',
      width: 140,
      align: 'center',
      render: (value: string | null) => <Text>{value || ''}</Text>,
    },
    {
      title: '就业地区',
      dataIndex: 'employmentRegion',
      key: 'employmentRegion',
      width: 140,
      align: 'center',
      render: (text) => <Text>{text}</Text>,
    },
    {
      title: '就业单位',
      dataIndex: 'employmentCompany',
      key: 'employmentCompany',
      width: 200,
      align: 'center',
      render: (text) => <Text>{text}</Text>,
    },
    {
      title: '就业岗位',
      dataIndex: 'employmentPosition',
      key: 'employmentPosition',
      width: 160,
      align: 'center',
      render: (text) => <Text>{text}</Text>,
    },
    {
      title: '试用期薪资',
      dataIndex: 'probationarySalary',
      key: 'probationarySalary',
      width: 140,
      align: 'center',
      render: (value: number | null) => <Text>{value ?? ''}</Text>,
    },
    {
      title: '转正薪资',
      dataIndex: 'regularSalary',
      key: 'regularSalary',
      width: 140,
      align: 'center',
      render: (value: number | null) => <Text>{value ?? ''}</Text>,
    },
    {
      title: '回访考核薪资',
      dataIndex: 'followUpAssessmentSalary',
      key: 'followUpAssessmentSalary',
      width: 160,
      align: 'center',
      render: (value: number | null) => <Text>{value ?? ''}</Text>,
    },
  ]

  const currentYear = now.year()
  const yearOptions = Array.from({ length: 7 }, (_, i) => currentYear - 3 + i)
  const classOptions = ['Y30', 'Y31', 'Y32', 'Y33', 'Y34', 'Y35', 'Y36', 'Y37', 'Y38', 'Y39', 'Y40']

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={`清美教育（${selectedCampus}）${selectedClass || '请选择班级'}班就业信息表`}
        extra={
          <Space size={12} align="center">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: '#666' }}>年份</span>
              <Select
                size="small"
                style={{ width: 92 }}
                value={selectedYear}
                onChange={(v) => {
                  setSelectedYear(v)
                  // 年份切换时清空班级选择，避免重复保存问题
                  setSelectedClass('')
                  setSummary(null)
                  setSummaryInputs({})
                }}
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
                onChange={(v) => {
                  setSelectedClass(v)
                  ensureKey(selectedYear, v, selectedCampus)
                  // fetchSummary 由 useEffect 自动调用，避免重复
                }}
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
            <Button onClick={() => { if (selectedClass) { fetchEmploymentRows(selectedCampus, selectedYear, selectedClass); fetchSummary(selectedCampus, selectedYear, selectedClass) } }}>刷新</Button>
          </Space>
        }
      >
        <Table<ClassEmploymentInfoRow>
          bordered
          size="small"
          columns={columns}
          dataSource={rows}
          loading={loading}
          pagination={false}
          rowKey="key"
          scroll={{ x: 'max-content' }}
        />
      </Card>

      {/* 班级就业信息汇总 */}
      <Card style={{ marginTop: 16 }} title="班级就业信息汇总">
        <div className="class-employment-summary" style={{ overflowX: 'auto' }}>
          <div className="class-employment-summary__row">
            <div className="class-employment-summary__item">
              <div className="class-employment-summary__label">班级</div>
              <Text>{selectedClass || '-'}</Text>
            </div>
            <div className="class-employment-summary__item">
              <div className="class-employment-summary__label">档案人数</div>
              <Text>{String(summary?.结案人数 ?? 0)}</Text>
            </div>
            <div className="class-employment-summary__item">
              <div className="class-employment-summary__label">需就业人数</div>
              <Text>{String(summaryInputs.need ?? 0)}</Text>
            </div>
            <div className="class-employment-summary__item">
              <div className="class-employment-summary__label">实际就业人数</div>
              <Text>{String(summaryInputs.actual ?? 0)}</Text>
            </div>
            <div className="class-employment-summary__item">
              <div className="class-employment-summary__label">实际就业率</div>
              <Text>{actualRateText}</Text>
            </div>
            <div className="class-employment-summary__item">
              <div className="class-employment-summary__label">实际需就业率</div>
              <Text>{needRateText}</Text>
            </div>
            <div className="class-employment-summary__item">
              <div className="class-employment-summary__label">目标平均薪资</div>
              <Text>{String(summaryInputs.targetSalary ?? 0)}</Text>
            </div>
            <div className="class-employment-summary__item">
              <div className="class-employment-summary__label">实际平均薪资</div>
              <Text>{String(avgFollowUpSalaryLocal)}</Text>
            </div>
            <div className="class-employment-summary__item">
              <div className="class-employment-summary__label">就业达标率</div>
              <Text>{achieveRateText}</Text>
            </div>
            <div className="class-employment-summary__item">
              <div className="class-employment-summary__label">教员</div>
              <Text>{summaryInputs.teacher ?? '-'}</Text>
            </div>
            <div className="class-employment-summary__item">
              <div className="class-employment-summary__label">班主任</div>
              <Text>{summary?.班主任 ?? '-'}</Text>
            </div>
          </div>
        </div>

        <style>{`
          .class-employment-summary__row {
            display: flex;
            flex-wrap: nowrap; /* 强制一行 */
            gap: 12px;
            align-items: flex-start;
            min-width: max-content; /* 内容超出时横向滚动，而不是换行 */
          }
          .class-employment-summary__item {
            width: 110px; /* 控制每个字段宽度，保证能排成一行 */
            flex: 0 0 auto;
          }
          .class-employment-summary__label {
            color: #888;
            white-space: nowrap;
            margin-bottom: 4px;
          }
          .class-employment-summary :global(.ant-input),
          .class-employment-summary :global(.ant-input-number) {
            width: 100%;
          }
          .class-employment-summary :global(.ant-input-number-input) {
            text-align: center;
          }
        `}</style>
      </Card>
    </div>
  )
}

export default ClassEmploymentInfoTable
