/**
 * 未就业明细表
 * 内容：班级档案信息表 - 班级就业信息表 = 未就业学生
 * 通过身份证号或姓名匹配，将班级档案中没有在就业信息表中出现的学生列出
 */
import React, { useEffect, useState, useMemo } from 'react'
import { App, Card, Table, Select, Button, Space, Tag, InputNumber, Input } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { buildApiUrl } from '@/utils/apiBase'

const { Option } = Select

// 未就业学生记录（与班级就业信息表字段一致，但标注未就业状态）
interface UnemployedStudentRow {
  key: string
  serialNumber: number
  name: string
  gender: string
  idCard: string
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
  followUpStatus: string
  followUpAssessmentSalary: number | null
  // 来源：班级档案表的额外字段
  enrollmentDate?: string
  studentStatus?: string
  headTeacher?: string
}

interface Props {
  selectedCampus: string
  selectedClass?: string
  onClassChange?: React.Dispatch<React.SetStateAction<string>>
}

const UnemployedStudentTable: React.FC<Props> = ({ selectedCampus, selectedClass: selectedClassFromProps, onClassChange }) => {
  const { message } = App.useApp()
  const now = dayjs()
  const [selectedYear, setSelectedYear] = useState<number>(now.year())
  const [selectedClassInner, setSelectedClassInner] = useState<string>('')

  const selectedClass = selectedClassFromProps ?? selectedClassInner
  const setSelectedClass = onClassChange ?? setSelectedClassInner
  const [classOptionsFromServer, setClassOptionsFromServer] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  
  // 班级档案数据
  const [archiveData, setArchiveData] = useState<any[]>([])
  // 班级就业信息数据
  const [employmentData, setEmploymentData] = useState<any[]>([])

  // 从后端读取班级列表（按神殿）
  const fetchClasses = async (campus: string) => {
    try {
      setLoading(true)
      let url = buildApiUrl(`/teaching-quality/class-list?campus=${encodeURIComponent(campus)}`)
      let res = await fetch(url)
      let ok = res.ok
      let list: any[] = ok ? await res.json() : []

      if ((list?.length ?? 0) === 0) {
        const norm = campus.endsWith('神殿') ? campus.slice(0, -2) : campus
        url = buildApiUrl(`/teaching-quality/class-list?campus=${encodeURIComponent(norm)}`)
        res = await fetch(url)
        ok = res.ok
        list = ok ? await res.json() : []
      }

      if ((list?.length ?? 0) === 0) {
        url = buildApiUrl('/teaching-quality/class-list')
        res = await fetch(url)
        ok = res.ok
        list = ok ? await res.json() : []
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

  // 从后端读取班级档案
  const fetchArchiveData = async (campus: string, clazz: string) => {
    if (!clazz) return
    try {
      const norm = campus.endsWith('神殿') ? campus.slice(0, -2) : campus
      const url = buildApiUrl(`/teaching-quality/class-file?campus=${encodeURIComponent(norm)}&class=${encodeURIComponent(clazz)}`)
      const res = await fetch(url)
      if (!res.ok) throw new Error('加载班级档案失败')
      const result = await res.json()
      const rows = (result?.行列表 || []) as any[]
      
      // 调试：检查数据格式和状态字段
      if (process.env.NODE_ENV === 'development' && rows.length > 0) {
        console.log('[未就业明细表] 班级档案数据示例:', rows[0])
        console.log('[未就业明细表] 状态字段值:', {
          studentStatus: rows[0]?.studentStatus,
          学员状态: rows[0]?.['学员状态'],
          完整对象: Object.keys(rows[0] || {})
        })
        // 检查是否有退费状态的学生
        const refundedStudents = rows.filter((r: any) => {
          const status = (r.studentStatus || r.学员状态 || r['学员状态'] || '').trim()
          return status === '退费'
        })
        if (refundedStudents.length > 0) {
          console.log(`[未就业明细表] 发现 ${refundedStudents.length} 名退费状态学生:`, refundedStudents.map((r: any) => ({
            姓名: r.name || r.姓名,
            状态: r.studentStatus || r.学员状态 || r['学员状态']
          })))
        }
      }
      
      setArchiveData(rows)
    } catch (e) {
      console.error(e)
      setArchiveData([])
    }
  }

  // 从后端读取班级就业信息
  const fetchEmploymentData = async (campus: string, year: number, clazz: string) => {
    if (!clazz) return
    try {
      const res = await fetch(buildApiUrl(`/teaching-quality/qt-class-employment-info?campus=${encodeURIComponent(campus)}&year=${year}&clazz=${encodeURIComponent(clazz)}`))
      if (!res.ok) throw new Error('加载班级就业信息失败')
      const data = await res.json()
      const list: any[] = data?.行列表 || []
      setEmploymentData(list)
    } catch (e) {
      console.error(e)
      setEmploymentData([])
    }
  }

  // 初次加载班级列表
  useEffect(() => {
    if (selectedCampus) {
      fetchClasses(selectedCampus)
    }
  }, [selectedCampus])

  // 当神殿/年份/班级变化时，加载数据
  useEffect(() => {
    if (selectedClass && selectedCampus) {
      setLoading(true)
      Promise.all([
        fetchArchiveData(selectedCampus, selectedClass),
        fetchEmploymentData(selectedCampus, selectedYear, selectedClass),
      ]).finally(() => setLoading(false))
    }
  }, [selectedCampus, selectedYear, selectedClass])

  // 计算未就业学生：包括班级档案中未就业的 + 就业信息表中没有实际就业信息的
  const unemployedStudents = useMemo<UnemployedStudentRow[]>(() => {
    const unemployed: UnemployedStudentRow[] = []
    const processedNames = new Set<string>() // 避免重复

    // 1. 从就业信息表中找出没有实际就业信息的学生
    employmentData.forEach((emp, idx) => {
      const name = (emp.name || '').trim()
      if (!name) return
      
      // 检查是否有实际就业信息
      const hasEmploymentInfo = 
        (emp.employmentCompany && emp.employmentCompany.trim() !== '') ||
        (emp.employmentPosition && emp.employmentPosition.trim() !== '') ||
        (emp.employmentRegion && emp.employmentRegion.trim() !== '')
      
      if (!hasEmploymentInfo) {
        processedNames.add(name)
        unemployed.push({
          key: `emp-${idx}`,
          serialNumber: unemployed.length + 1,
          name: name,
          gender: emp.gender || '',
          idCard: emp.idCard || '',
          age: emp.age ?? null,
          reportedMajor: emp.reportedMajor || '',
          education: emp.education || '',
          major: emp.major || '',
          graduateSchool: emp.graduateSchool || '',
          highestDegreeCert: emp.highestDegreeCert || '',
          phone: emp.phone || '',
          address: emp.address || '',
          entryDate: emp.entryDate || null,
          employmentRegion: emp.employmentRegion || '',
          employmentCompany: emp.employmentCompany || '',
          employmentPosition: emp.employmentPosition || '',
          probationarySalary: emp.probationarySalary ?? null,
          regularSalary: emp.regularSalary ?? null,
          followUpStatus: emp.followUpStatus || '未就业',
          followUpAssessmentSalary: emp.followUpAssessmentSalary ?? null,
          enrollmentDate: '',
          studentStatus: '',
          headTeacher: '',
        })
      }
    })

    // 2. 从班级档案中找出不在就业信息表中的学生（不排除任何状态）
    if (archiveData.length > 0) {
      // 就业信息表中所有学生的姓名和身份证号
      const employmentNames = new Set(
        employmentData
          .filter((r) => r.name && r.name.trim())
          .map((r) => (r.name || '').trim())
      )
      const employmentIdCards = new Set(
        employmentData
          .filter((r) => r.idCard && r.idCard.trim())
          .map((r) => (r.idCard || '').trim().toLowerCase())
      )

      archiveData.forEach((archive, idx) => {
        const name = (archive.name || archive.姓名 || '').trim()
        const idCard = (archive.idCard || archive.身份证号 || '').trim().toLowerCase()
        
        if (!name) return // 跳过空行
        
        // 如果已经在就业信息表中处理过，跳过
        if (employmentNames.has(name) || (idCard && employmentIdCards.has(idCard))) {
          return
        }
        
        // 获取学员状态
        const studentStatus = String(
          archive.studentStatus || 
          archive.学员状态 || 
          archive['学员状态'] || 
          ''
        ).trim()
        
        // 获取审批无需就业状态
        const employmentApprovalStatus = String(
          archive.employmentApprovalStatus || 
          archive.审批无需就业 || 
          archive['审批无需就业'] || 
          ''
        ).trim()
        
        // 不排除任何状态，显示所有未就业的学生
        if (!processedNames.has(name)) {
          processedNames.add(name)
          unemployed.push({
            key: `archive-${idx}`,
            serialNumber: unemployed.length + 1,
            name: name,
            gender: archive.gender || archive.性别 || '',
            idCard: archive.idCard || archive.身份证号 || '',
            age: archive.graduationAge ? Number(archive.graduationAge) : (archive.毕业年龄 ? Number(archive.毕业年龄) : null),
            reportedMajor: archive.reportedMajor || archive.报读专业 || '',
            education: archive.education || archive.学历 || '',
            major: archive.previousMajor || archive.过往专业 || '',
            graduateSchool: archive.graduateSchool || archive.毕业院校 || '',
            highestDegreeCert: archive.highestEducationAndType || archive.最高学历及性质 || '',
            phone: archive.phone || archive.联系电话 || archive.联系方式 || '',
            address: archive.address || archive.通信地址 || archive.家庭住址 || '',
            entryDate: null,
            employmentRegion: '',
            employmentCompany: '',
            employmentPosition: '',
            probationarySalary: null,
            regularSalary: null,
            followUpStatus: '未就业',
            followUpAssessmentSalary: null,
            enrollmentDate: archive.enrollmentDate || archive.入学时间 || '',
            studentStatus: studentStatus,
            headTeacher: archive.headTeacher || archive.班主任姓名 || '',
          })
        }
      })
    }

    // 重新编号
    return unemployed.map((item, index) => ({
      ...item,
      serialNumber: index + 1,
    }))
  }, [archiveData, employmentData])

  // 统计信息
  const stats = useMemo(() => {
    // 档案总人数
    const total = archiveData.filter((r) => {
      const name = (r.name || r.姓名 || '').trim()
      return name !== ''
    }).length
    
    // 已就业人数：就业信息表中有实际就业信息的学生
    const employed = employmentData.filter((r) => {
      const name = (r.name || '').trim()
      if (!name) return false
      
      // 必须有实际的就业信息才算已就业
      const hasEmploymentInfo = 
        (r.employmentCompany && r.employmentCompany.trim() !== '') ||
        (r.employmentPosition && r.employmentPosition.trim() !== '') ||
        (r.employmentRegion && r.employmentRegion.trim() !== '')
      
      return hasEmploymentInfo
    }).length
    
    // 未就业人数
    const unemployed = unemployedStudents.length
    
    return { total, employed, unemployed }
  }, [archiveData, employmentData, unemployedStudents])

  const columns: ColumnsType<UnemployedStudentRow> = [
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
    },
    {
      title: '性别',
      dataIndex: 'gender',
      key: 'gender',
      width: 80,
      align: 'center',
    },
    {
      title: '身份证号',
      dataIndex: 'idCard',
      key: 'idCard',
      width: 180,
      align: 'center',
    },
    {
      title: '毕业年龄',
      dataIndex: 'age',
      key: 'age',
      width: 80,
      align: 'center',
    },
    {
      title: '所报专业',
      dataIndex: 'reportedMajor',
      key: 'reportedMajor',
      width: 140,
      align: 'center',
    },
    {
      title: '学历',
      dataIndex: 'education',
      key: 'education',
      width: 100,
      align: 'center',
    },
    {
      title: '专业',
      dataIndex: 'major',
      key: 'major',
      width: 160,
      align: 'center',
    },
    {
      title: '毕业学校',
      dataIndex: 'graduateSchool',
      key: 'graduateSchool',
      width: 180,
      align: 'center',
    },
    {
      title: '目前所获最高学历证书及性质',
      dataIndex: 'highestDegreeCert',
      key: 'highestDegreeCert',
      width: 220,
      align: 'center',
    },
    {
      title: '联系电话',
      dataIndex: 'phone',
      key: 'phone',
      width: 140,
      align: 'center',
    },
    {
      title: '通信地址',
      dataIndex: 'address',
      key: 'address',
      width: 220,
      align: 'center',
    },
    {
      title: '班主任',
      dataIndex: 'headTeacher',
      key: 'headTeacher',
      width: 100,
      align: 'center',
    },
    {
      title: '入学日期',
      dataIndex: 'enrollmentDate',
      key: 'enrollmentDate',
      width: 120,
      align: 'center',
    },
    {
      title: '学籍状态',
      dataIndex: 'studentStatus',
      key: 'studentStatus',
      width: 100,
      align: 'center',
    },
    {
      title: '就业状态',
      dataIndex: 'followUpStatus',
      key: 'followUpStatus',
      width: 100,
      align: 'center',
      fixed: 'right',
      render: (text) => <Tag color="orange">{text || '未就业'}</Tag>,
    },
  ]

  return (
    <Card
      title={
        <Space>
          <span>未就业明细表</span>
          <Tag color="blue">档案人数: {stats.total}</Tag>
          <Tag color="green">已就业: {stats.employed}</Tag>
          <Tag color="orange">未就业: {stats.unemployed}</Tag>
        </Space>
      }
      extra={
        <Space>
          <span>年份：</span>
          <InputNumber
            min={2020}
            max={2030}
            value={selectedYear}
            onChange={(v) => setSelectedYear(v || now.year())}
            style={{ width: 100 }}
          />
          <span>班级：</span>
          <Select
            value={selectedClass}
            onChange={setSelectedClass}
            style={{ width: 200 }}
            placeholder="请选择班级"
            showSearch
            filterOption={(input, option) =>
              String(option?.children || '').toLowerCase().includes(input.toLowerCase())
            }
          >
            {classOptionsFromServer.map((cls) => (
              <Option key={cls} value={cls}>
                {cls}
              </Option>
            ))}
          </Select>
          <Button onClick={() => {
            if (selectedClass && selectedCampus) {
              setLoading(true)
              Promise.all([
                fetchArchiveData(selectedCampus, selectedClass),
                fetchEmploymentData(selectedCampus, selectedYear, selectedClass),
              ]).finally(() => setLoading(false))
            }
          }}>
            刷新
          </Button>
        </Space>
      }
    >
      <Table
        columns={columns}
        dataSource={unemployedStudents}
        loading={loading}
        scroll={{ x: 2200, y: 600 }}
        pagination={{
          defaultPageSize: 50,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条未就业记录`,
        }}
        bordered
        size="small"
      />
    </Card>
  )
}

export default UnemployedStudentTable
