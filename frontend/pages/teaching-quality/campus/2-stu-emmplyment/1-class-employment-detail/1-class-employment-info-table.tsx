import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import { App, Card, Table, Input, InputNumber, DatePicker, Select, Button, Space, Row, Col, Statistic } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { Dayjs } from 'dayjs'
import { buildApiUrl } from '@/utils/apiBase'
import { UsergroupAddOutlined } from '@ant-design/icons'
const { Option } = Select

interface ClassEmploymentInfoRow {
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
  graduationDate: string | null // 毕业时间
  entryDate: string | null
  employmentRegion: string
  employmentCompany: string
  employmentPosition: string
  probationarySalary: number | null
  regularSalary: number | null
  followUpStatus: string
  followUpAssessmentSalary: number | null
  employmentApprovalStatus?: string // 新增：审批无需就业状态
}

const createInitialRows = (): ClassEmploymentInfoRow[] =>
  Array.from({ length: 20 }, (_, index) => {
    const serialNumber = index + 1
    return {
      key: String(serialNumber),
      serialNumber,
      name: '',
      gender: '',
      idCard: '',
      age: null,
      reportedMajor: '',
      education: '',
      major: '',
      graduateSchool: '',
      highestDegreeCert: '',
      phone: '',
      address: '',
      graduationDate: null,
      entryDate: null,
      employmentRegion: '',
      employmentCompany: '',
      employmentPosition: '',
      probationarySalary: null,
      regularSalary: null,
      followUpStatus: '',
      followUpAssessmentSalary: null,
    }
  })

interface Props {
  selectedCampus: string
  selectedClass?: string
  onClassChange?: React.Dispatch<React.SetStateAction<string>>
}

const ClassEmploymentInfoTable: React.FC<Props> = ({ selectedCampus, selectedClass: selectedClassFromProps, onClassChange }) => {
  const { message } = App.useApp()
  const now = dayjs()
  const [selectedYear, setSelectedYear] = useState<number>(now.year())
  const tableWrapRef = useRef<HTMLDivElement | null>(null)
  const [selectedClassInner, setSelectedClassInner] = useState<string>('')

  const selectedClass = selectedClassFromProps ?? selectedClassInner
  const setSelectedClass = onClassChange ?? setSelectedClassInner
  const [classOptionsFromServer, setClassOptionsFromServer] = useState<string[]>([])
  const [classListRows, setClassListRows] = useState<any[]>([])
  // 班级档案数据（用于计算统计信息）
  const [archiveData, setArchiveData] = useState<any[]>([])

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
      
      setClassOptionsFromServer(names)
      
      // 若当前未选择班级，则默认选第一个
      if (!selectedClass && names.length > 0) {
        ensureKey(selectedYear, names[0], campus)
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

  // 从后端读取该班级的就业信息表
  // 通过班级档案行补全身份证号和毕业年龄
  const mergeArchiveFields = (row: ClassEmploymentInfoRow): ClassEmploymentInfoRow => {
    const a = classListRows.find((r) => String(r['姓名'] || '').trim() === row.name.trim()) || ({} as any)
    // 获取毕业时间，支持多种字段名
    const graduationDate =
      a['毕业时间'] ||
      a['graduationDate'] ||
      a['毕业日期'] ||
      a['graduationDate'] ||
      a['结业时间'] ||
      a['结业日期'] ||
      null

    const archiveGraduationAgeRaw = a['毕业年龄']
    const archiveGraduationAge =
      archiveGraduationAgeRaw === '' || archiveGraduationAgeRaw === undefined || archiveGraduationAgeRaw === null
        ? null
        : Number(archiveGraduationAgeRaw)

    return {
      ...row,
      idCard: row.idCard || String(a['身份证号'] || ''),
      // 只允许用“毕业年龄”补全；当班档案里的毕业年龄为空字符串时，不要误显示为入学年龄
      age: row.age ?? archiveGraduationAge,
      // 从班级档案补全（若就业信息表中为空）
      education: row.education || String(a['学历'] || a['education'] || ''),
      // 班就业信息表的"专业"要求取班档案信息表的"过往专业"
      major: row.major || String(a['过往专业'] || a['previousMajor'] || a['专业'] || ''),
      phone: row.phone || String(a['联系电话'] || a['phone'] || a['联系方式'] || a['电话'] || ''),
      // 从班级档案自动获取毕业时间
      graduationDate: row.graduationDate || (graduationDate ? String(graduationDate).trim() : null),
    }
  }

  const fetchEmploymentRows = async (campus: string, year: number, clazz: string) => {
    if (!clazz) return
    try {
      setLoading(true)
      const res = await fetch(buildApiUrl(`/teaching-quality/qt-class-employment-info?campus=${encodeURIComponent(campus)}&year=${year}&clazz=${encodeURIComponent(clazz)}`))
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      // 获取班档案，用于过滤出学员状态为"毕业"的学生
      // 班档案接口对神殿名称可能要求不带"神殿"后缀，这里做兼容，并增加兜底重试
      const campusForQuery = campus.endsWith('神殿') ? campus.slice(0, -2) : campus

      const fetchClassFile = async (campusParam: string) => {
        const resp = await fetch(
          buildApiUrl(`/teaching-quality/class-file?class=${encodeURIComponent(clazz)}&campus=${encodeURIComponent(campusParam)}`),
          { credentials: 'include' },
        )
        const json = resp.ok ? await resp.json() : { 行列表: [] }
        const rows = json?.行列表 || json || []
        return { resp, json, rows }
      }

      let classFile = await fetchClassFile(campusForQuery)
      if ((classFile.rows?.length ?? 0) === 0 && campusForQuery !== campus) {
        classFile = await fetchClassFile(campus)
      }

      const classFileRows = classFile.rows || []
      
      // 保存班级档案数据用于统计
      setArchiveData(classFileRows)

      // 筛选出符合条件的学生：排除审批无需就业为"无需就业"和休学/退学/退费状态的学生
      const graduatedStudentNames = new Set(
        classFileRows
          .filter((record: any) => {
            const studentStatus = (record.学员状态 || record.studentStatus || record['学员状态'] || '').trim()
            const employmentApprovalStatus = (record.审批无需就业 || record.employmentApprovalStatus || record['审批无需就业'] || '').trim()
            const isNoEmployment = employmentApprovalStatus === '无需就业'
            // 排除休学、退学、退费状态
            const isSuspended = studentStatus === '休学'
            const isDropped = studentStatus === '退学'
            const isRefunded = studentStatus === '退费'
            return !isNoEmployment && !isSuspended && !isDropped && !isRefunded
          })
          .map((record: any) => (record.姓名 || record.name || '').trim()),
      )

      const list: any[] = data?.行列表 || []

      // 就业信息接口返回的字段可能是 name / 姓名，这里做兼容
      // 只在“成功拿到毕业名单”时才做过滤；若班档案接口因神殿/参数问题返回空，回退为不过滤，避免把后端就业数据全部过滤掉
      const shouldFilterByGraduatedList = graduatedStudentNames.size > 0
      const filteredList = shouldFilterByGraduatedList
        ? list.filter((r: any) => {
            const n = String(r.name ?? r.姓名 ?? '').trim()
            return n && graduatedStudentNames.has(n)
          })
        : list

      const mapped: ClassEmploymentInfoRow[] = (filteredList || []).map((r: any, idx: number) => {
        // 从班档案中查找对应学生的毕业时间
        const studentName = (r.name || '').trim()
        const archiveRecord = classFileRows.find((arch: any) => {
          const archName = (arch.姓名 || arch.name || '').trim()
          return archName === studentName
        })
        
        const graduationDate = archiveRecord ? (
          archiveRecord.graduationDate ?? 
          archiveRecord.毕业时间 ?? 
          archiveRecord['毕业时间'] ??
          archiveRecord.毕业日期 ??
          archiveRecord['毕业日期'] ??
          archiveRecord.结业时间 ??
          archiveRecord['结业时间'] ??
          archiveRecord.结业日期 ??
          archiveRecord['结业日期'] ??
          null
        ) : null
        
        return mergeArchiveFields({
          key: String(idx + 1),
          serialNumber: idx + 1,
          name: (r.name ?? r.姓名 ?? '').trim(),
          gender: r.gender ?? r.性别 ?? '',
          idCard: (r.idCard ?? r.身份证号 ?? '') || '',
          age: r.age ?? null,
          reportedMajor: r.reportedMajor || '',
          education: r.education || '',
          major: r.major || '',
          graduateSchool: r.graduateSchool || '',
          highestDegreeCert: r.highestDegreeCert || '',
          phone: r.phone || '',
          address: r.address || '',
          graduationDate: r.graduationDate || (graduationDate ? String(graduationDate).trim() : null),
          entryDate: r.entryDate || null,
          employmentRegion: r.employmentRegion || '',
          employmentCompany: r.employmentCompany || '',
          employmentPosition: r.employmentPosition || '',
          probationarySalary: r.probationarySalary ?? null,
          regularSalary: r.regularSalary ?? null,
          followUpStatus: r.followUpStatus || '',
          followUpAssessmentSalary: r.followUpAssessmentSalary ?? null,
        })
      })
      setDataMap(prev => ({ ...prev, [getKey(year, clazz, campus)]: mapped.length ? mapped : createInitialRows() }))
    } catch (e) {
      console.error(e)
      message.error('加载班级就业信息失败')
      setDataMap((prev) => ({ ...prev, [getKey(year, clazz, campus)]: createInitialRows() }))
      setArchiveData([]) // 清空档案数据
    } finally {
      setLoading(false)
    }
  }

  

  

  const saveEmploymentRows = async () => {
    if (!selectedClass) {
      message.warning('请选择班级')
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
          idCard: r.idCard,
          reportedMajor: r.reportedMajor,
          education: r.education,
          major: r.major,
          graduateSchool: r.graduateSchool,
          highestDegreeCert: r.highestDegreeCert,
          phone: r.phone,
          address: r.address,
          graduationDate: r.graduationDate || undefined,
          entryDate: r.entryDate || undefined,
          employmentRegion: r.employmentRegion,
          employmentCompany: r.employmentCompany,
          employmentPosition: r.employmentPosition,
          probationarySalary: r.probationarySalary ?? undefined,
          regularSalary: r.regularSalary ?? undefined,
          followUpStatus: r.followUpStatus,
          followUpAssessmentSalary: r.followUpAssessmentSalary ?? undefined,
        })),
      }
      const res = await fetch(buildApiUrl('/teaching-quality/qt-class-employment-info'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(await res.text())
      message.success('保存成功')
      await fetchEmploymentRows(selectedCampus, selectedYear, selectedClass)
    } catch (e) {
      console.error(e)
      message.error('保存失败')
    } finally {
      setLoading(false)
    }
  }

  // 从班档案表导入数据（保留备用）
  /*
  const importFromClassFile = async () => {
    console.log('[导入] importFromClassFile 函数被调用')
    console.log('[导入] selectedClass:', selectedClass)
    if (!selectedClass) {
      message.warning('请先选择班级')
      return
    }

    try {
      setLoading(true)
      // 调用班档案表 API
      const res = await fetch(
        buildApiUrl(`/teaching-quality/class-file?class=${encodeURIComponent(selectedClass)}&campus=${encodeURIComponent(selectedCampus)}`),
        { credentials: 'include' }
      )
      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(`获取班档案数据失败: ${errorText}`)
      }
      const data = await res.json()
      
      // 将班档案数据转换为就业信息格式
      const archiveRows = (data.行列表 || data || []).map((record: any, idx: number) => ({
        key: String(idx + 1),
        serialNumber: idx + 1,
        name: record.姓名 || record.name || '',
        gender: record.性别 || record.gender || '',
        idCard: record.身份证号 || record.idCard || '',
        age: record.毕业年龄 ?? record.age ?? null,
        reportedMajor: record.报读专业 || record.reportedMajor || '',
        education: record.学历 || record.education || '',
        major: record.专业 || record.major || '',
        graduateSchool: record.毕业院校 || record.graduateSchool || '',
        highestDegreeCert: record.最高学历证书 || record.highestDegreeCert || '',
        phone: record.联系方式 || record.电话 || record.phone || '',
        address: record.家庭住址 || record.address || '',
        entryDate: record.入学日期 || record.entryDate || null,
        employmentRegion: '',
        employmentCompany: '',
        employmentPosition: '',
        probationarySalary: null,
        regularSalary: null,
        followUpStatus: '',
        followUpAssessmentSalary: null,
      }))

      if (archiveRows.length === 0) {
        message.warning('班档案表中没有数据')
        return
      }

      // 更新数据
      setDataMap((prev) => ({
        ...prev,
        [currentKey]: archiveRows,
      }))
      message.success(`成功导入 ${archiveRows.length} 条学员信息`)
    } catch (e) {
      console.error(e)
      message.error('导入失败：' + (e as Error).message)
    } finally {
      setLoading(false)
    }
  }
  */

  // 导入毕业学生：从班档案信息表中导入学员状态为"毕业"的学员
  const importGraduatedStudentsFromClassFile = async () => {
    console.log('[导入毕业学生] importGraduatedStudentsFromClassFile 函数被调用')
    console.log('[导入毕业学生] selectedClass:', selectedClass)
    if (!selectedClass) {
      message.warning('请先选择班级')
      return
    }

    try {
      setLoading(true)
      
      // 1. 获取班档案表数据
      // 处理神殿名称：如果以"神殿"结尾，尝试去掉后查询
      let campusForQuery = selectedCampus
      if (selectedCampus.endsWith('神殿')) {
        campusForQuery = selectedCampus.slice(0, -2)
      }
      console.log(`[导入毕业学生] 准备获取班档案表数据: class=${selectedClass}, campus=${selectedCampus} -> ${campusForQuery}`)
      
      const classFileRes = await fetch(
        buildApiUrl(`/teaching-quality/class-file?class=${encodeURIComponent(selectedClass)}&campus=${encodeURIComponent(campusForQuery)}`),
        { credentials: 'include' }
      )
      
      console.log(`[导入毕业学生] 班档案表API响应状态:`, classFileRes.status, classFileRes.ok)
      if (!classFileRes.ok) {
        const errorText = await classFileRes.text()
        console.error(`[导入毕业学生] 班档案表API返回错误:`, errorText)
        throw new Error(`获取班档案数据失败: ${errorText}`)
      }
      
      const classFileData = await classFileRes.json()
      console.log(`[导入毕业学生] 班档案表API返回完整数据:`, classFileData)

      // 2. 筛选出学员状态为"毕业"的学员，并排除无需就业和特定状态的学生
      const classFileRows = classFileData.行列表 || classFileData || []
      console.log(`[导入毕业学生] 班档案表共有 ${classFileRows.length} 名学员`)
      
      const graduatedStudents = classFileRows
        .filter((record: any) => {
          const name = (record.姓名 || record.name || '').trim()
          
          // 获取学员状态，支持多种可能的字段名
          const studentStatus = (record.学员状态 || record.studentStatus || record['学员状态'] || '').trim()
          
          // 获取审批无需就业状态，支持多种可能的字段名
          const employmentApprovalStatus = (record.审批无需就业 || record.employmentApprovalStatus || record['审批无需就业'] || '').trim()
          
          // 排除审批无需就业为"无需就业"的学员
          const isNoEmployment = employmentApprovalStatus === '无需就业'
          
          // 排除学员状态为"休学"、"退学"、"退费"的学员
          const isSuspended = studentStatus === '休学'
          const isDropped = studentStatus === '退学'
          const isRefunded = studentStatus === '退费'

          console.log(`[导入毕业学生] 检查学员: ${name}, 学员状态: ${studentStatus || '无'}, 审批无需就业: ${employmentApprovalStatus || '无'}`)
          
          if (!name) {
            console.log(`[导入毕业学生] ✘ 排除无名学员`)
            return false
          }
          
          // 排除审批无需就业为"无需就业"的学员
          if (isNoEmployment) {
            console.log(`[导入毕业学生] ✘ 排除审批无需就业学员: ${name} (审批无需就业: ${employmentApprovalStatus})`)
            return false
          }
          
          // 排除学员状态为"休学"、"退学"、"退费"的学员
          if (isSuspended || isDropped || isRefunded) {
            console.log(`[导入毕业学生] ✘ 排除特殊状态学员: ${name} (状态: ${studentStatus})`)
            return false
          }
          
          console.log(`[导入毕业学生] ✓ 导入学员: ${name}`)
          return true
        })
        .map((record: any, idx: number) => {
          // 获取毕业时间，支持多种字段名
          const graduationDate = 
            record.graduationDate ?? 
            record.毕业时间 ?? 
            record['毕业时间'] ??
            record.毕业日期 ??
            record['毕业日期'] ??
            record.结业时间 ??
            record['结业时间'] ??
            record.结业日期 ??
            record['结业日期'] ??
            null
          
          const graduationAgeRaw =
            record.graduationAge ?? record.毕业年龄 ?? record['毕业年龄'] ?? record.age ?? null
          const graduationAge =
            graduationAgeRaw === '' || graduationAgeRaw === undefined || graduationAgeRaw === null
              ? null
              : Number(graduationAgeRaw)

          return {
            key: String(idx + 1),
            serialNumber: idx + 1,
            name: record.姓名 || record.name || '',
            gender: record.性别 || record.gender || '',
            idCard: record.身份证号 || record.idCard || '',
            age: graduationAge,
            reportedMajor: record.报读专业 || record.reportedMajor || '',
            education: record.education || record.学历 || record.文化程度 || record['文化程度'] || '',
            // 班就业信息表“专业”要求取班档案的“过往专业”，但后端可能返回 previousMajor
            major:
              record.previousMajor ||
              record['过往专业'] ||
              record.过往专业 ||
              record.专业 ||
              record.major ||
              record.所报专业 ||
              record['所报专业'] ||
              '',
            graduateSchool: record.graduateSchool || record.毕业院校 || '',
            highestDegreeCert: record.highestEducationAndType || record.最高学历及性质 || record.最高学历证书 || record.highestDegreeCert || '',
            phone: record.phone || record.联系电话 || record['联系电话'] || record.联系方式 || record.电话 || '',
            address: record.家庭住址 || record.address || '',
            graduationDate: graduationDate ? String(graduationDate).trim() : null,
            entryDate: record.入学日期 || record.entryDate || null,
            employmentRegion: '',
            employmentCompany: '',
            employmentPosition: '',
            probationarySalary: null,
            regularSalary: null,
            followUpStatus: '',
            followUpAssessmentSalary: null,
          }
        })

      if (graduatedStudents.length === 0) {
        message.warning('没有找到已毕业的学员')
        return
      }

      // 3. 统计排除的学员数量
      let nonGraduatedCount = 0
      let noEmploymentCount = 0
      let specialStatusCount = 0
      
      classFileRows.forEach((record: any) => {
        const name = (record.姓名 || record.name || '').trim()
        if (!name) return
        
        const studentStatus = (record.学员状态 || record.studentStatus || record['学员状态'] || '').trim()
        const employmentApprovalStatus = (record.审批无需就业 || record.employmentApprovalStatus || record['审批无需就业'] || '').trim()
        
        // 统计审批无需就业的学员
        if (employmentApprovalStatus === '无需就业') {
          noEmploymentCount++
        }
        // 统计休学、退学、退费状态的学员
        else if (studentStatus === '休学' || studentStatus === '退学' || studentStatus === '退费') {
          specialStatusCount++
        }
        // 统计非毕业状态的学员（排除已统计的特殊状态）
        else if (studentStatus !== '毕业') {
          nonGraduatedCount++
        }
      })

      // 4. 合并更新数据：保留已有的就业信息，仅更新基础信息或添加新学生
      console.log('[导入毕业学生] graduatedStudents=', graduatedStudents.length, 'currentKey=', currentKey, 'beforeRows=', (dataMap[currentKey] || []).length)
      setDataMap((prev) => {
        const existingRows = prev[currentKey] || []
        const existingRowsByName = new Map(existingRows.map(r => [r.name.trim(), r]))

        const mergedRows = graduatedStudents.map((newStudent, idx) => {
          const existingStudent = existingRowsByName.get(newStudent.name.trim())
          if (existingStudent) {
            // 学生已存在，合并信息：用档案的更新基础信息，保留已填写的就业信息
            return {
              ...newStudent, // 使用新学生的基础信息（姓名、年龄、学历等）
              key: existingStudent.key, // 保持旧的 key 以维持 React 状态
              serialNumber: existingStudent.serialNumber, // 保持旧的序号
              // 保留已有的就业信息
              employmentRegion: existingStudent.employmentRegion || newStudent.employmentRegion,
              employmentCompany: existingStudent.employmentCompany || newStudent.employmentCompany,
              employmentPosition: existingStudent.employmentPosition || newStudent.employmentPosition,
              probationarySalary: existingStudent.probationarySalary ?? newStudent.probationarySalary,
              regularSalary: existingStudent.regularSalary ?? newStudent.regularSalary,
              followUpStatus: existingStudent.followUpStatus || newStudent.followUpStatus,
              followUpAssessmentSalary: existingStudent.followUpAssessmentSalary ?? newStudent.followUpAssessmentSalary,
              entryDate: existingStudent.entryDate || newStudent.entryDate,
            }
          } else {
            // 这是新学生，直接添加
            return newStudent
          }
        })

        // 重新编号，确保序号连续
        const finalRows = mergedRows.map((r, i) => ({ ...r, serialNumber: i + 1 }))

        return {
          ...prev,
          [currentKey]: finalRows,
        }
      })
      
      // 更新班级档案数据，以便统计信息正确更新
      setArchiveData(classFileRows)
      
      // 5. 显示成功消息，包含排除的学员统计
      const exclusionParts: string[] = []
      if (noEmploymentCount > 0) {
        exclusionParts.push(`${noEmploymentCount} 名审批无需就业学员`)
      }
      if (specialStatusCount > 0) {
        exclusionParts.push(`${specialStatusCount} 名休学/退学/退费学员`)
      }
      if (nonGraduatedCount > 0) {
        exclusionParts.push(`${nonGraduatedCount} 名其他非毕业状态学员`)
      }
      const exclusionMsg = exclusionParts.length > 0 
        ? `（已排除 ${exclusionParts.join('、')}）` 
        : ''
      
      if (graduatedStudents.length > 0) {
        message.success(`成功导入 ${graduatedStudents.length} 名毕业状态学员${exclusionMsg}`)
      } else {
        message.info(`未找到符合条件的学员${exclusionMsg}`)
      }
    } catch (e) {
      console.error(e)
      message.error('导入失败：' + (e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  // 初次加载时拉取当前神殿的班级
  useEffect(() => {
    if (selectedCampus) {
      fetchClasses(selectedCampus)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCampus])

  // 当神殿/年份/班级变化时，自动加载该班级的就业信息与汇总
  useEffect(() => {
    if (selectedClass) {
      fetchEmploymentRows(selectedCampus, selectedYear, selectedClass)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCampus, selectedYear, selectedClass])

  // 当选择班级后，自动导入学员状态为"毕业"的学生
  // 注意：该自动导入会覆盖整张表；为避免用户正在编辑时数据被“过一会儿又消失”，这里默认不再自动执行。
  // 如需导入，请点击“导入毕业学生”按钮。
  useEffect(() => {
    // no-op
  }, [])

  // 随班级变化，尝试从班级列表中提取该班“专业”作为候选
  useEffect(() => {
    if (!selectedClass) return
    const row = classListRows.find((r) => String(r['班级名称']) === selectedClass)
    const major = row?.['专业'] ? String(row['专业']).trim() : ''
    if (major) {
      // 支持用 / 、 ， , 空格 分隔
      // const tokens = major.split(/[\/、，,\s]+/).map((s: string) => s.trim()).filter(Boolean)
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

  const focusCell = useCallback((rowKey: string, colKey: string) => {
    const root = tableWrapRef.current
    if (!root) return
    const selector = `[data-kbn-cell="${rowKey}::${colKey}"] input, [data-kbn-cell="${rowKey}::${colKey}"] textarea, [data-kbn-cell="${rowKey}::${colKey}"] .ant-picker-input input, [data-kbn-cell="${rowKey}::${colKey}"] .ant-select-selector`
    const el = root.querySelector(selector) as HTMLElement | null
    if (!el) return

    // Select 需要点一下再 focus
    if (el.classList.contains('ant-select-selector')) {
      el.click()
      return
    }

    el.focus()
    // 如果是普通输入框，顺便全选，方便快速覆盖
    if (el instanceof HTMLInputElement) {
      try {
        el.select()
      } catch {
        // ignore
      }
    }
  }, [])

  const navColKeys = useMemo(
    () => [
      'name',
      'gender',
      'idCard',
      'age',
      'reportedMajor',
      'education',
      'major',
      'graduateSchool',
      'highestDegreeCert',
      'phone',
      'address',
      'graduationDate',
      'entryDate',
      'employmentRegion',
      'employmentCompany',
      'employmentPosition',
      'probationarySalary',
      'regularSalary',
      'followUpStatus',
      'followUpAssessmentSalary',
    ] as const,
    [],
  )

  const handleCellKeyDown = useCallback(
    (
      e: React.KeyboardEvent,
      record: ClassEmploymentInfoRow,
      colKey: string,
    ) => {
      if (!selectedClass) return

      const idx = rows.findIndex((r) => r.key === record.key)
      if (idx < 0) return

      const key = e.key
      if (
        key !== 'ArrowUp' &&
        key !== 'ArrowDown' &&
        key !== 'ArrowLeft' &&
        key !== 'ArrowRight' &&
        key !== 'Enter'
      ) {
        return
      }

      // 左右方向键：仅当光标在首/尾时才切换单元格，避免影响输入框内移动
      if (key === 'ArrowLeft' || key === 'ArrowRight') {
        const target = e.target as HTMLElement | null
        const isTextInput = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement

        if (isTextInput) {
          const value = target.value ?? ''
          const start = target.selectionStart ?? 0
          const end = target.selectionEnd ?? 0

          const atLeftEdge = start === 0 && end === 0
          const atRightEdge = start === value.length && end === value.length

          if ((key === 'ArrowLeft' && !atLeftEdge) || (key === 'ArrowRight' && !atRightEdge)) {
            return
          }
        }

        e.preventDefault()
        const colIdx = navColKeys.indexOf(colKey as any)
        if (colIdx < 0) return
        const nextColIdx = key === 'ArrowLeft' ? colIdx - 1 : colIdx + 1
        if (nextColIdx < 0 || nextColIdx >= navColKeys.length) return
        focusCell(record.key, navColKeys[nextColIdx])
        return
      }

      // 上下方向键移动：避免光标在输入框内移动
      if (key === 'ArrowUp' || key === 'ArrowDown') {
        e.preventDefault()
        const nextIdx = key === 'ArrowUp' ? idx - 1 : idx + 1
        if (nextIdx < 0 || nextIdx >= rows.length) return
        focusCell(rows[nextIdx].key, colKey)
        return
      }

      // Enter：默认跳到下一行；Shift+Enter 保留默认行为（如 textarea 换行）
      if (key === 'Enter' && !e.shiftKey) {
        // DatePicker 的 Enter 往往用于确认/打开面板，这里尽量不抢
        if (colKey === 'graduationDate' || colKey === 'entryDate') {
          return
        }

        e.preventDefault()
        const nextIdx = idx + 1
        if (nextIdx >= rows.length) return
        focusCell(rows[nextIdx].key, colKey)
      }
    },
    [focusCell, navColKeys, rows, selectedClass],
  )

  const renderInputCell = useCallback(
    (text: string, record: ClassEmploymentInfoRow, colKey: keyof ClassEmploymentInfoRow) => (
      <div data-kbn-cell={`${record.key}::${String(colKey)}`}>
        <Input
          value={text}
          onChange={(e) => updateRow(record.key, colKey, e.target.value as any)}
          onKeyDown={(e) => handleCellKeyDown(e, record, String(colKey))}
        />
      </div>
    ),
    [handleCellKeyDown],
  )

  const renderInputNumberCell = useCallback(
    (value: number | null, record: ClassEmploymentInfoRow, colKey: keyof ClassEmploymentInfoRow) => (
      <div data-kbn-cell={`${record.key}::${String(colKey)}`}>
        <InputNumber
          min={0}
          value={value ?? undefined}
          style={{ width: '100%' }}
          onChange={(v) => updateRow(record.key, colKey, (v ?? null) as any)}
          keyboard={false}
          onKeyDown={(e) => handleCellKeyDown(e, record, String(colKey))}
        />
      </div>
    ),
    [handleCellKeyDown],
  )

  const renderDateCell = useCallback(
    (value: string | null, record: ClassEmploymentInfoRow, colKey: keyof ClassEmploymentInfoRow) => (
      <div data-kbn-cell={`${record.key}::${String(colKey)}`}>
        <DatePicker
          value={value ? dayjs(value) : null}
          style={{ width: '100%' }}
          onChange={(date: Dayjs | null) =>
            updateRow(record.key, colKey, (date ? date.format('YYYY-MM-DD') : null) as any)
          }
          onKeyDown={(e) => handleCellKeyDown(e, record, String(colKey))}
        />
      </div>
    ),
    [handleCellKeyDown],
  )

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
      render: (text, record) => renderInputCell(text, record, 'name'),
    },
    {
      title: '性别',
      dataIndex: 'gender',
      key: 'gender',
      width: 80,
      align: 'center',
      render: (text, record) => renderInputCell(text, record, 'gender'),
    },
    {
      title: '身份证号',
      dataIndex: 'idCard',
      key: 'idCard',
      width: 180,
      align: 'center',
      render: (text, record) => renderInputCell(text, record, 'idCard'),
    },
    {
      title: '毕业年龄',
      dataIndex: 'age',
      key: 'age',
      width: 80,
      align: 'center',
      render: (value, record) => renderInputNumberCell(value, record, 'age'),
    },
    {
      title: '所报专业',
      dataIndex: 'reportedMajor',
      key: 'reportedMajor',
      width: 140,
      align: 'center',
      render: (text, record) => renderInputCell(text, record, 'reportedMajor'),
    },
    {
      title: '学历',
      dataIndex: 'education',
      key: 'education',
      width: 100,
      align: 'center',
      render: (text, record) => renderInputCell(text, record, 'education'),
    },
    {
      title: '专业',
      dataIndex: 'major',
      key: 'major',
      width: 160,
      align: 'center',
      render: (text, record) => renderInputCell(text, record, 'major'),
    },
    {
      title: '毕业学校',
      dataIndex: 'graduateSchool',
      key: 'graduateSchool',
      width: 180,
      align: 'center',
      render: (text, record) => renderInputCell(text, record, 'graduateSchool'),
    },
    {
      title: '目前所获最高学历证书及性质',
      dataIndex: 'highestDegreeCert',
      key: 'highestDegreeCert',
      width: 220,
      align: 'center',
      render: (text, record) => renderInputCell(text, record, 'highestDegreeCert'),
    },
    {
      title: '联系电话',
      dataIndex: 'phone',
      key: 'phone',
      width: 140,
      align: 'center',
      render: (text, record) => renderInputCell(text, record, 'phone'),
    },
    {
      title: '通信地址',
      dataIndex: 'address',
      key: 'address',
      width: 220,
      align: 'center',
      render: (text, record) => (
        <div data-kbn-cell={`${record.key}::address`}>
          <Input.TextArea
            value={text}
            autoSize={{ minRows: 1, maxRows: 3 }}
            onChange={(e) => updateRow(record.key, 'address', e.target.value)}
            onKeyDown={(e) => handleCellKeyDown(e, record, 'address')}
          />
        </div>
      ),
    },
    {
      title: '毕业时间',
      dataIndex: 'graduationDate',
      key: 'graduationDate',
      width: 140,
      align: 'center',
      render: (value: string | null, record) => renderDateCell(value, record, 'graduationDate'),
    },
    {
      title: '入职时间',
      dataIndex: 'entryDate',
      key: 'entryDate',
      width: 140,
      align: 'center',
      render: (value: string | null, record) => renderDateCell(value, record, 'entryDate'),
    },
    {
      title: '就业地区',
      dataIndex: 'employmentRegion',
      key: 'employmentRegion',
      width: 140,
      align: 'center',
      render: (text, record) => renderInputCell(text, record, 'employmentRegion'),
    },
    {
      title: '就业单位',
      dataIndex: 'employmentCompany',
      key: 'employmentCompany',
      width: 200,
      align: 'center',
      render: (text, record) => renderInputCell(text, record, 'employmentCompany'),
    },
    {
      title: '就业岗位',
      dataIndex: 'employmentPosition',
      key: 'employmentPosition',
      width: 160,
      align: 'center',
      render: (text, record) => renderInputCell(text, record, 'employmentPosition'),
    },
    {
      title: '试用期薪资',
      dataIndex: 'probationarySalary',
      key: 'probationarySalary',
      width: 140,
      align: 'center',
      render: (value: number | null, record) => renderInputNumberCell(value, record, 'probationarySalary'),
    },
    {
      title: '转正薪资',
      dataIndex: 'regularSalary',
      key: 'regularSalary',
      width: 140,
      align: 'center',
      render: (value: number | null, record) => renderInputNumberCell(value, record, 'regularSalary'),
    },
    {
      title: '回访情况',
      dataIndex: 'followUpStatus',
      key: 'followUpStatus',
      width: 160,
      align: 'center',
      render: (text, record) => renderInputCell(text, record, 'followUpStatus'),
    },
    {
      title: '回访转正薪资',
      dataIndex: 'followUpAssessmentSalary',
      key: 'followUpAssessmentSalary',
      width: 160,
      align: 'center',
      render: (value: number | null, record) => renderInputNumberCell(value, record, 'followUpAssessmentSalary'),
    },
  ]

  const currentYear = now.year()
  const yearOptions = Array.from({ length: 7 }, (_, i) => currentYear - 3 + i)

  // 计算统计信息
  const statistics = useMemo(() => {
    console.log('[统计信息] 开始计算统计信息')
    console.log('[统计信息] archiveData:', archiveData)
    console.log('[统计信息] rows:', rows)
    
    // 档案人数：班级档案表中的所有学生（有姓名的）
    const archiveCount = archiveData.filter((record: any) => {
      const name = (record.name || record.姓名 || '').trim()
      return name !== ''
    }).length

    // 需就业人数：档案人数刨去休学、退学、退费和审批无需就业的人数
    const needEmploymentCount = archiveData.filter((record: any) => {
      const name = (record.name || record.姓名 || '').trim()
      if (!name) return false
      
      // 获取学员状态
      const studentStatus = String(
        record.studentStatus || 
        record.学员状态 || 
        record['学员状态'] || 
        ''
      ).trim()
      
      // 获取审批无需就业状态
      const employmentApprovalStatus = String(
        record.employmentApprovalStatus || 
        record.审批无需就业 || 
        record['审批无需就业'] || 
        ''
      ).trim()
      
      // 排除休学、退学、退费状态
      const isSuspended = studentStatus === '休学'
      const isDropped = studentStatus === '退学'
      const isRefunded = studentStatus === '退费'
      const nameIsRefund = name === '退费'
      
      // 排除审批无需就业
      const isNoEmployment = employmentApprovalStatus === '无需就业'
      
      return !(isSuspended || isDropped || isRefunded || nameIsRefund || isNoEmployment)
    }).length

    // 已就业人数：就业信息表中有姓名且有就业信息的学生数
    const employedStudents = rows.filter((row) => {
      const name = (row.name || '').trim()
      console.log(`[统计信息] 检查学生: ${name}`)
      
      if (!name) {
        console.log(`[统计信息] - 姓名为空，跳过`)
        return false
      }
      
      console.log(`[统计信息] - 就业地区: "${row.employmentRegion}"`)
      console.log(`[统计信息] - 就业单位: "${row.employmentCompany}"`)
      console.log(`[统计信息] - 就业岗位: "${row.employmentPosition}"`)
      
      // 检查是否有就业信息（就业单位、就业岗位或就业地区任一不为空）
      const hasEmploymentInfo = 
        (row.employmentCompany && row.employmentCompany.trim() !== '') ||
        (row.employmentPosition && row.employmentPosition.trim() !== '') ||
        (row.employmentRegion && row.employmentRegion.trim() !== '')
      
      console.log(`[统计信息] - 有就业信息: ${hasEmploymentInfo}`)
      
      return hasEmploymentInfo
    })
    
    const employedCount = employedStudents.length
    console.log(`[统计信息] 已就业学生:`, employedStudents.map(s => s.name))
    console.log(`[统计信息] 已就业人数: ${employedCount}`)

    // 未就业人数：需就业人数减去已就业人数
    const unemployedCount = Math.max(0, needEmploymentCount - employedCount)

    console.log(`[统计信息] 最终统计: 档案${archiveCount}, 需就业${needEmploymentCount}, 已就业${employedCount}, 未就业${unemployedCount}`)

    return {
      archiveCount,
      needEmploymentCount,
      employedCount,
      unemployedCount,
    }
  }, [archiveData, rows])

  return (
    <div style={{ padding: 24 }} ref={tableWrapRef}>
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
                  if (selectedClass) ensureKey(v, selectedClass, selectedCampus)
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
            <Button 
              icon={<UsergroupAddOutlined />} 
              onClick={importGraduatedStudentsFromClassFile}
              disabled={!selectedClass}
              title="从班级档案表导入学员状态为'毕业'的学生（选择班级后会自动导入）"
            >
              导入毕业学生
            </Button>
            <Button type="primary" onClick={saveEmploymentRows} disabled={!selectedClass}>保存</Button>
          </Space>
        }
      >
        {/* 信息概览 */}
        {selectedClass && (
          <div style={{ marginBottom: 16, padding: 16, background: '#f5f5f5', borderRadius: 4 }}>
            <Row gutter={16}>
              <Col span={6}>
                <Statistic 
                  title="档案人数" 
                  value={statistics.archiveCount}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col span={6}>
                <Statistic 
                  title="需就业人数" 
                  value={statistics.needEmploymentCount}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col span={6}>
                <Statistic 
                  title="已就业人数" 
                  value={statistics.employedCount}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Col>
              <Col span={6}>
                <Statistic 
                  title="未就业人数" 
                  value={statistics.unemployedCount}
                  valueStyle={{ color: '#fa8c16' }}
                />
              </Col>
            </Row>
          </div>
        )}
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


    </div>
  )
}

export default ClassEmploymentInfoTable
