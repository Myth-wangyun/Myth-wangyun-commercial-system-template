import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import { App, Card, Table, Input, InputNumber, Select, Space, Button, AutoComplete, DatePicker } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useCampusStore } from '@/stores/campusStore'
import { buildApiUrl } from '@/utils/apiBase'
import dayjs from 'dayjs'

// 学生搜索结果接口（从班级档案表获取）
interface StudentSearchResult {
  name: string
  gender: string
  idCard: string
  enrollmentDate: string
  enrollmentAge: string
  education: string
  graduationDate: string
  graduationAge: string
  highestEducationAndType: string
  campusSource: string
  consultant: string
  reportedMajor: string
  schoolingLength: string
  tuitionAmount: string
  headTeacher: string
  studentStatus: string
  previousMajor: string
  graduateSchool: string
  phone: string
  parentPhone: string
  address: string
  householdType: string
  studyMode: string
  currentAddress: string
  promisedRegisterEducation: string
  promisedEducationNature: string
  promisedEducationLevel: string
  educationSchoolName: string
  registeredSecondaryOrCollege: string
  registeredSchool: string
  remark: string
  className: string
  campusName: string
}

interface RefundDetailRow {
  _month?: number
  _source?: 'server' | 'classFile'
  key: string
  serialNumber: number | null
  name: string
  gender: string
  idCard: string
  enrollDate: string
  enrollAge: string
  education: string
  graduationDate: string
  graduationAge: string
  highestDegree: string
  campusSource: string
  consultant: string
  reportedMajor: string
  educationSystem: string
  receivableTuition: number | null
  headTeacherName: string
  studentStatus: string
  previousMajor: string
  graduatedSchool: string
  contactPhone: string
  parentPhone: string
  mailingAddress: string
  householdType: string
  studyMode: string
  currentAddress: string
  hasRegistrationCommitment: string
  promisedEducationNature: string
  promisedEducationLevel: string
  educationSchoolName: string
  hasRegistered: string
  registeredSchool: string
  remarks: string
  refundDate: string
  refundAmount: number | null
}

const GENDER_OPTIONS = [
  { label: '男', value: '男' },
  { label: '女', value: '女' },
]

const YES_NO_OPTIONS = [
  { label: '是', value: '是' },
  { label: '否', value: '否' },
]

const MONTH_OPTIONS = [
  { label: '全年', value: 0 },
  ...Array.from({ length: 12 }, (_, i) => ({ label: String(i + 1), value: i + 1 })),
]

// 仅在对应单元格数据变更时才更新该单元格，避免整行/整表频繁重渲染
const cellUpdate = <K extends keyof RefundDetailRow>(field: K) => (record: RefundDetailRow, prev: RefundDetailRow) => {
  return record[field] !== prev[field]
}

// 判断一行是否有数据（除了序号和key之外的字段有任何非空值）
const hasRowData = (row: RefundDetailRow): boolean => {
  return !!(
    row.name ||
    row.gender ||
    row.idCard ||
    row.enrollDate ||
    row.enrollAge ||
    row.education ||
    row.graduationDate ||
    row.graduationAge ||
    row.highestDegree ||
    row.campusSource ||
    row.consultant ||
    row.reportedMajor ||
    row.educationSystem ||
    row.receivableTuition !== null ||
    row.headTeacherName ||
    row.studentStatus ||
    row.previousMajor ||
    row.graduatedSchool ||
    row.contactPhone ||
    row.parentPhone ||
    row.mailingAddress ||
    row.householdType ||
    row.studyMode ||
    row.currentAddress ||
    row.hasRegistrationCommitment ||
    row.promisedEducationNature ||
    row.promisedEducationLevel ||
    row.educationSchoolName ||
    row.hasRegistered ||
    row.registeredSchool ||
    row.remarks ||
    row.refundDate ||
    row.refundAmount !== null
  )
}

const createInitialRows = (count = 25): RefundDetailRow[] =>
  Array.from({ length: count }, (_, idx) => {
    const serial = idx + 1
    return {
      key: String(serial),
      serialNumber: serial,
      name: '',
      gender: '',
      idCard: '',
      enrollDate: '',
      enrollAge: '',
      education: '',
      graduationDate: '',
      graduationAge: '',
      highestDegree: '',
      campusSource: '',
      consultant: '',
      reportedMajor: '',
      educationSystem: '',
      receivableTuition: null,
      headTeacherName: '',
      studentStatus: '',
      previousMajor: '',
      graduatedSchool: '',
      contactPhone: '',
      parentPhone: '',
      mailingAddress: '',
      householdType: '',
      studyMode: '',
      currentAddress: '',
      hasRegistrationCommitment: '',
      promisedEducationNature: '',
      promisedEducationLevel: '',
      educationSchoolName: '',
      hasRegistered: '',
      registeredSchool: '',
      remarks: '',
      refundDate: '',
      refundAmount: null,
    }
  })

const CampusRefundDetailTable: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore()
  const [year, setYear] = useState<number>(new Date().getFullYear())
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1)
  const [rows, setRows] = useState<RefundDetailRow[]>(createInitialRows())
  const [forceVisibleKeys, setForceVisibleKeys] = useState<Set<string>>(new Set()) // 新增的空行强制可见
  
  // 学生搜索相关状态
  const [studentOptions, setStudentOptions] = useState<{ value: string; label: string; student: StudentSearchResult }[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const canIO = useMemo(() => Boolean(currentCampus && year), [currentCampus, year])

  // 仅显示有数据的行（新增的空行可强制显示），并根据month筛选
  const displayRows = useMemo(() => {
    let filtered = rows.filter((r) => forceVisibleKeys.has(r.key) || hasRowData(r))
    // 如果month不是0（全年），则只显示对应月份的数据或没有月份标记的数据
    if (month !== 0) {
      filtered = filtered.filter(r => r._month === month || r._month === undefined)
    }
    console.log('displayRows 过滤后:', filtered.length, '条，原始数据:', rows.length, '条')
    if (filtered.length > 0) {
      console.log('displayRows 第一条数据:', {
        name: filtered[0].name,
        promisedEducationNature: filtered[0].promisedEducationNature,
        promisedEducationLevel: filtered[0].promisedEducationLevel,
        educationSchoolName: filtered[0].educationSchoolName,
        hasRegistered: filtered[0].hasRegistered,
        registeredSchool: filtered[0].registeredSchool,
        remarks: filtered[0].remarks,
      })
    }
    return filtered
  }, [rows, forceVisibleKeys, month])

  // 搜索学生（从班级档案表）
  const searchStudents = useCallback(async (keyword: string) => {
    if (!keyword || keyword.length < 1) {
      setStudentOptions([])
      return
    }
    
    setSearchLoading(true)
    try {
      const campusParam = currentCampus ? `&campus=${encodeURIComponent(currentCampus)}` : ''
      const res = await fetch(
        buildApiUrl(`/teaching-quality/class-file/search-students?keyword=${encodeURIComponent(keyword)}${campusParam}`)
      )
      if (!res.ok) throw new Error('搜索失败')
      const students: StudentSearchResult[] = await res.json()
      
      const options = students.map((s) => ({
        value: s.name,
        label: `${s.name} - ${s.className || '未知班级'} (${s.idCard || '无身份证'})`,
        student: s,
      }))
      setStudentOptions(options)
    } catch (error) {
      console.error('搜索学生失败:', error)
      setStudentOptions([])
    } finally {
      setSearchLoading(false)
    }
  }, [currentCampus])

  // 防抖搜索
  const handleStudentSearch = useCallback((value: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    searchTimeoutRef.current = setTimeout(() => {
      searchStudents(value)
    }, 300)
  }, [searchStudents])

  // 选择学生后自动填充字段
  const handleStudentSelect = useCallback((key: string, value: string, option: any) => {
    const student: StudentSearchResult = option.student
    if (!student) return
    
    setRows((prev) => {
      const idx = prev.findIndex((r) => r.key === key)
      if (idx === -1) return prev
      const next = prev.slice()
      next[idx] = {
        ...prev[idx],
        name: student.name || '',
        gender: student.gender || '',
        idCard: student.idCard || '',
        enrollDate: student.enrollmentDate || '',
        enrollAge: student.enrollmentAge || '',
        education: student.education || '',
        graduationDate: student.graduationDate || '',
        graduationAge: student.graduationAge || '',
        highestDegree: student.highestEducationAndType || '',
        campusSource: student.campusSource || '',
        consultant: student.consultant || '',
        reportedMajor: student.reportedMajor || '',
        educationSystem: student.schoolingLength || '',
        receivableTuition: student.tuitionAmount ? Number(student.tuitionAmount) : null,
        headTeacherName: student.headTeacher || '',
        studentStatus: student.studentStatus || '',
        previousMajor: student.previousMajor || '',
        graduatedSchool: student.graduateSchool || '',
        contactPhone: student.phone || '',
        parentPhone: student.parentPhone || '',
        mailingAddress: student.address || '',
        householdType: student.householdType || '',
        studyMode: student.studyMode || '',
        currentAddress: student.currentAddress || '',
        hasRegistrationCommitment: student.promisedRegisterEducation || '',
        promisedEducationNature: student.promisedEducationNature || '',
        promisedEducationLevel: student.promisedEducationLevel || '',
        educationSchoolName: student.educationSchoolName || '',
        hasRegistered: student.registeredSecondaryOrCollege || '',
        registeredSchool: student.registeredSchool || '',
        remarks: student.remark || '',
      }
      return next
    })
    
    message.success(`已自动填充 ${student.name} 的信息`)
  }, [])

  const handleTextChange = useCallback((key: string, field: keyof RefundDetailRow, value: string) => {
    setRows((prev) => {
      const idx = prev.findIndex((r) => r.key === key)
      if (idx === -1) return prev
      const next = prev.slice()
      next[idx] = { ...prev[idx], [field]: value }
      return next
    })
  }, [])

  const handleNumberChange = useCallback((
    key: string,
    field: keyof Pick<RefundDetailRow, 'receivableTuition' | 'refundAmount' | 'serialNumber'>,
    value: number | null,
  ) => {
    const v = typeof value === 'number' ? value : null
    setRows((prev) => {
      const idx = prev.findIndex((r) => r.key === key)
      if (idx === -1) return prev
      const next = prev.slice()
      next[idx] = { ...prev[idx], [field]: v }
      return next
    })
  }, [])

  const mapRow = (item: any, idx: number, m: number): RefundDetailRow => ({
    _month: m,
    key: `${m}-${idx + 1}`,
    serialNumber: item.serialNumber ?? idx + 1,
    name: String(item.name || ''),
    gender: String(item.gender || ''),
    idCard: String(item.idCard || ''),
    enrollDate: String(item.enrollDate || ''),
    enrollAge: String(item.enrollAge || ''),
    education: String(item.education || ''),
    graduationDate: String(item.graduationDate || ''),
    graduationAge: String(item.graduationAge || ''),
    highestDegree: String(item.highestDegree || ''),
    campusSource: String(item.campusSource || ''),
    consultant: String(item.consultant || ''),
    reportedMajor: String(item.reportedMajor || ''),
    educationSystem: String(item.educationSystem || ''),
    receivableTuition: item.receivableTuition == null ? null : Number(item.receivableTuition),
    headTeacherName: String(item.headTeacherName || ''),
    studentStatus: String(item.studentStatus || ''),
    previousMajor: String(item.previousMajor || ''),
    graduatedSchool: String(item.graduatedSchool || ''),
    contactPhone: String(item.contactPhone || ''),
    parentPhone: String(item.parentPhone || ''),
    mailingAddress: String(item.mailingAddress || ''),
    householdType: String(item.householdType || ''),
    studyMode: String(item.studyMode || ''),
    currentAddress: String(item.currentAddress || ''),
    hasRegistrationCommitment: String(item.hasRegistrationCommitment || ''),
    promisedEducationNature: String(item.promisedEducationNature || ''),
    promisedEducationLevel: String(item.promisedEducationLevel || ''),
    educationSchoolName: String(item.educationSchoolName || ''),
    hasRegistered: String(item.hasRegistered || ''),
    registeredSchool: String(item.registeredSchool || ''),
    remarks: String(item.remarks || ''),
    refundDate: String(item.refundDate || ''),
    refundAmount: item.refundAmount == null ? null : Number(item.refundAmount),
  })

  const fetchFromServer = async (): Promise<RefundDetailRow[]> => {
    if (!canIO) {
      message.warning('请先选择神殿/年份')
      return []
    }
    try {
      // 始终获取全年12个月数据
      const months = Array.from({ length: 12 }, (_, i) => i + 1)
      const urls = months.map((m) =>
        buildApiUrl(`/teaching-quality/campus-refund-detail?campus=${encodeURIComponent(currentCampus!)}&year=${year}&month=${m}`),
      )
      const resList = await Promise.all(urls.map((u) => fetch(u).catch(() => null)))
      const allRows: RefundDetailRow[] = []
      for (let i = 0; i < resList.length; i++) {
        const r = resList[i]
        if (r && r.ok) {
          const data = await r.json()
          const list = (data?.行列表 || []) as any[]
          list.forEach((item: any, idx: number) => {
            allRows.push({ ...mapRow(item, idx, i + 1), _source: 'server' })
          })
        }
      }
      return allRows
    } catch (e) {
      console.error(e)
      message.error('从服务器加载失败')
      return []
    }
  }

  // 从班档案表导入退费学生
  const importFromClassFile = async (): Promise<RefundDetailRow[]> => {
    if (!currentCampus) {
      message.warning('请先选择神殿')
      return []
    }
    
    try {
      const res = await fetch(
        buildApiUrl(`/teaching-quality/class-file/students-by-status?campus=${encodeURIComponent(currentCampus)}&status=退费`)
      )
      if (!res.ok) throw new Error('获取学生失败')
      const students: StudentSearchResult[] = await res.json()
      
      if (students.length === 0) {
        return []
      }
      
      const importedRows: RefundDetailRow[] = students.map((student, idx) => {
        // 尝试从学生的备注或其他字段提取退费月份
        let refundMonth: number | undefined = undefined
        // 这里暂不设置_month，让这些记录在任意月份都能看到，用户可以手动填写退费日期后保存
        
        console.log('导入学生数据:', {
          name: student.name,
          promisedEducationNature: student.promisedEducationNature,
          promisedEducationLevel: student.promisedEducationLevel,
          educationSchoolName: student.educationSchoolName,
          registeredSecondaryOrCollege: student.registeredSecondaryOrCollege,
          registeredSchool: student.registeredSchool,
          remark: student.remark,
        })
        
        return {
          key: `import-${Date.now()}-${idx}`,
          serialNumber: idx + 1,
          _source: 'classFile',
          _month: refundMonth, // 暂时不设置，这样在任意月份都能看到
          name: student.name || '',
        gender: student.gender || '',
        idCard: student.idCard || '',
        enrollDate: student.enrollmentDate || '',
        enrollAge: student.enrollmentAge || '',
        education: student.education || '',
        graduationDate: student.graduationDate || '',
        graduationAge: student.graduationAge || '',
        highestDegree: student.highestEducationAndType || '',
        campusSource: student.campusSource || '',
        consultant: student.consultant || '',
        reportedMajor: student.reportedMajor || '',
        educationSystem: student.schoolingLength || '',
        receivableTuition: student.tuitionAmount ? Number(student.tuitionAmount) : null,
        headTeacherName: student.headTeacher || '',
        studentStatus: student.studentStatus || '',
        previousMajor: student.previousMajor || '',
        graduatedSchool: student.graduateSchool || '',
        contactPhone: student.phone || '',
        parentPhone: student.parentPhone || '',
        mailingAddress: student.address || '',
        householdType: student.householdType || '',
        studyMode: student.studyMode || '',
        currentAddress: student.currentAddress || '',
        hasRegistrationCommitment: student.promisedRegisterEducation || '',
        promisedEducationNature: student.promisedEducationNature || '',
        promisedEducationLevel: student.promisedEducationLevel || '',
        educationSchoolName: student.educationSchoolName || '',
        hasRegistered: student.registeredSecondaryOrCollege || '',
        registeredSchool: student.registeredSchool || '',
        remarks: student.remark || '',
        refundDate: '',
        refundAmount: null,
        }
      })
      
      return importedRows
    } catch (error) {
      console.error('导入失败:', error)
      message.error('从班档案表导入失败')
      return []
    }
  }

  const addOneRow = () => {
    const maxSerial = displayRows.reduce((m, r) => Math.max(m, r.serialNumber ?? 0), 0)
    const nextSerial = (maxSerial || 0) + 1
    const newRow: RefundDetailRow = {
      key: `new-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      serialNumber: nextSerial,
      _month: month !== 0 ? month : undefined, // 如果不是全年模式，设置当前月份
      name: '',
      gender: '',
      idCard: '',
      enrollDate: '',
      enrollAge: '',
      education: '',
      graduationDate: '',
      graduationAge: '',
      highestDegree: '',
      campusSource: '',
      consultant: '',
      reportedMajor: '',
      educationSystem: '',
      receivableTuition: null,
      headTeacherName: '',
      studentStatus: '',
      previousMajor: '',
      graduatedSchool: '',
      contactPhone: '',
      parentPhone: '',
      mailingAddress: '',
      householdType: '',
      studyMode: '',
      currentAddress: '',
      hasRegistrationCommitment: '',
      promisedEducationNature: '',
      promisedEducationLevel: '',
      educationSchoolName: '',
      hasRegistered: '',
      registeredSchool: '',
      remarks: '',
      refundDate: '',
      refundAmount: null,
    }
    setRows((prev) => [...prev, newRow])
    setForceVisibleKeys((prev) => new Set(prev).add(newRow.key))
  }

  const saveToServer = async (dataToSave?: RefundDetailRow[], isAuto = false) => {
    const rowsToUse = dataToSave || rows
    if (!canIO) {
      if (!isAuto) message.warning('请先选择神殿/年份/月')
      return
    }
    if (month === 0) {
      if (!isAuto) message.warning('全年模式仅支持查看，请切换到具体月份后再保存')
      return
    }
    try {
      // 只保存当前月份的数据
      const currentMonthRows = rowsToUse.filter(r => r._month === month || r._month === undefined)
      
      const payload = {
        神殿名称: currentCampus!,
        年份: year,
        月份: month,
        行列表: currentMonthRows.map((r, idx) => ({
          serialNumber: r.serialNumber ?? idx + 1,
          name: r.name,
          gender: r.gender,
          idCard: r.idCard,
          enrollDate: r.enrollDate,
          enrollAge: r.enrollAge,
          education: r.education,
          graduationDate: r.graduationDate,
          graduationAge: r.graduationAge,
          highestDegree: r.highestDegree,
          campusSource: r.campusSource,
          consultant: r.consultant,
          reportedMajor: r.reportedMajor,
          educationSystem: r.educationSystem,
          receivableTuition: r.receivableTuition,
          headTeacherName: r.headTeacherName,
          studentStatus: r.studentStatus,
          previousMajor: r.previousMajor,
          graduatedSchool: r.graduatedSchool,
          contactPhone: r.contactPhone,
          parentPhone: r.parentPhone,
          mailingAddress: r.mailingAddress,
          householdType: r.householdType,
          studyMode: r.studyMode,
          currentAddress: r.currentAddress,
          hasRegistrationCommitment: r.hasRegistrationCommitment,
          promisedEducationNature: r.promisedEducationNature,
          promisedEducationLevel: r.promisedEducationLevel,
          educationSchoolName: r.educationSchoolName,
          hasRegistered: r.hasRegistered,
          registeredSchool: r.registeredSchool,
          remarks: r.remarks,
          refundDate: r.refundDate,
          refundAmount: r.refundAmount,
        })),
      }
      const res = await fetch(buildApiUrl('/teaching-quality/campus-refund-detail'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(await res.text())
      if (!isAuto) message.success('保存成功')
      
      // 重新加载数据并集
      const [serverData, classFileData] = await Promise.all([fetchFromServer(), importFromClassFile()])
      const merged = mergeData(serverData, classFileData)
      setRows(merged)
    } catch (e) {
      console.error(e)
      if (!isAuto) message.error('保存失败')
    }
  }

  // 合并服务器数据和班档案表数据（数据并集）
  const mergeData = (serverData: RefundDetailRow[], classFileData: RefundDetailRow[]): RefundDetailRow[] => {
    const idCardMap = new Map<string, RefundDetailRow>()
    
    // 先添加服务器数据（优先级高）
    serverData.forEach(row => {
      if (row.idCard && row.idCard.trim()) {
        idCardMap.set(row.idCard.trim(), row)
      }
    })
    
    // 添加班档案表数据（如果身份证号不存在）
    classFileData.forEach(row => {
      const idCard = row.idCard?.trim()
      if (idCard && !idCardMap.has(idCard)) {
        console.log('添加班档案表数据到合并结果:', {
          name: row.name,
          promisedEducationNature: row.promisedEducationNature,
          promisedEducationLevel: row.promisedEducationLevel,
          educationSchoolName: row.educationSchoolName,
          hasRegistered: row.hasRegistered,
          registeredSchool: row.registeredSchool,
          remarks: row.remarks,
        })
        idCardMap.set(idCard, row)
      }
    })
    
    // 转换为数组并重新编号
    const merged = Array.from(idCardMap.values())
    const result = merged.map((r, i) => ({ ...r, serialNumber: i + 1 }))
    console.log('合并后的数据总数:', result.length)
    return result
  }

  useEffect(() => {
    if (currentCampus) {
      setRows([])
      setForceVisibleKeys(new Set())
      // 同时加载服务器数据和班档案表数据，取并集
      Promise.all([fetchFromServer(), importFromClassFile()]).then(([serverData, classFileData]) => {
        console.log('服务器数据:', serverData.length, '条')
        console.log('班档案表数据:', classFileData.length, '条')
        const merged = mergeData(serverData, classFileData)
        console.log('合并后准备设置到 state 的数据:', merged.length, '条')
        if (merged.length > 0) {
          console.log('第一条数据示例:', {
            name: merged[0].name,
            promisedEducationNature: merged[0].promisedEducationNature,
            promisedEducationLevel: merged[0].promisedEducationLevel,
            educationSchoolName: merged[0].educationSchoolName,
            hasRegistered: merged[0].hasRegistered,
            registeredSchool: merged[0].registeredSchool,
            remarks: merged[0].remarks,
          })
        }
        setRows(merged)
        
        // 自动触发保存（仅在非全年模式下）
        if (month !== 0) {
          saveToServer(merged, true)
        }
        
        message.success(`已加载 ${merged.length} 条记录（服务器：${serverData.length}，班档案表：${classFileData.length}）`)
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCampus])

  const columns: ColumnsType<RefundDetailRow> = useMemo(() => [
    {
      title: '月份',
      key: 'month-label',
      width: 80,
      align: 'center',
      fixed: 'left',
      render: (_: any, record) => {
        if (record._month !== undefined) return record._month
        return month !== 0 ? month : '-'
      },
    },
    {
      title: '序号',
      dataIndex: 'serialNumber',
      key: 'serialNumber',
      width: 70,
      align: 'center',
      shouldCellUpdate: cellUpdate('serialNumber'),
      render: (value: number | null, record) => (
        <InputNumber
          min={1}
          value={value ?? undefined}
          style={{ width: '100%' }}
          onChange={(v) => handleNumberChange(record.key, 'serialNumber', v ?? null)}
        />
      ),
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 180,
      align: 'center',
      shouldCellUpdate: cellUpdate('name'),
      render: (text: string, record) => (
        <AutoComplete
          value={text}
          options={studentOptions}
          onSearch={handleStudentSearch}
          onSelect={(value, option) => handleStudentSelect(record.key, value, option)}
          onChange={(value) => handleTextChange(record.key, 'name', value)}
          placeholder="输入姓名搜索"
          style={{ width: '100%' }}
          allowClear
        />
      ),
    },
    {
      title: '性别',
      dataIndex: 'gender',
      key: 'gender',
      width: 80,
      align: 'center',
      shouldCellUpdate: cellUpdate('gender'),
      render: (value: string, record) => (
        <Select
          allowClear
          options={GENDER_OPTIONS}
          value={value || undefined}
          onChange={(v) => handleTextChange(record.key, 'gender', v ?? '')}
        />
      ),
    },
    {
      title: '身份证号',
      dataIndex: 'idCard',
      key: 'idCard',
      width: 160,
      align: 'center',
      shouldCellUpdate: cellUpdate('idCard'),
      render: (text: string, record) => (
        <Input value={text} onChange={(e) => handleTextChange(record.key, 'idCard', e.target.value)} />
      ),
    },
    {
      title: '入学时间',
      dataIndex: 'enrollDate',
      key: 'enrollDate',
      width: 120,
      align: 'center',
      shouldCellUpdate: cellUpdate('enrollDate'),
      render: (text: string, record) => (
        <Input value={text} onChange={(e) => handleTextChange(record.key, 'enrollDate', e.target.value)} />
      ),
    },
    {
      title: '入学年龄',
      dataIndex: 'enrollAge',
      key: 'enrollAge',
      width: 100,
      align: 'center',
      shouldCellUpdate: cellUpdate('enrollAge'),
      render: (text: string, record) => (
        <Input value={text} onChange={(e) => handleTextChange(record.key, 'enrollAge', e.target.value)} />
      ),
    },
    {
      title: '学历',
      dataIndex: 'education',
      key: 'education',
      width: 90,
      align: 'center',
      shouldCellUpdate: cellUpdate('education'),
      render: (text: string, record) => (
        <Input value={text} onChange={(e) => handleTextChange(record.key, 'education', e.target.value)} />
      ),
    },
    {
      title: '毕业时间',
      dataIndex: 'graduationDate',
      key: 'graduationDate',
      width: 110,
      align: 'center',
      shouldCellUpdate: cellUpdate('graduationDate'),
      render: (text: string, record) => (
        <Input value={text} onChange={(e) => handleTextChange(record.key, 'graduationDate', e.target.value)} />
      ),
    },
    {
      title: '毕业年龄',
      dataIndex: 'graduationAge',
      key: 'graduationAge',
      width: 100,
      align: 'center',
      shouldCellUpdate: cellUpdate('graduationAge'),
      render: (text: string, record) => (
        <Input value={text} onChange={(e) => handleTextChange(record.key, 'graduationAge', e.target.value)} />
      ),
    },
    {
      title: '毕业所获最高学历证书及性质',
      dataIndex: 'highestDegree',
      key: 'highestDegree',
      width: 220,
      align: 'center',
      shouldCellUpdate: cellUpdate('highestDegree'),
      render: (text: string, record) => (
        <Input value={text} onChange={(e) => handleTextChange(record.key, 'highestDegree', e.target.value)} />
      ),
    },
    {
      title: '神殿来源',
      dataIndex: 'campusSource',
      key: 'campusSource',
      width: 120,
      align: 'center',
      shouldCellUpdate: cellUpdate('campusSource'),
      render: (text: string, record) => (
        <Input value={text} onChange={(e) => handleTextChange(record.key, 'campusSource', e.target.value)} />
      ),
    },
    {
      title: '咨询师',
      dataIndex: 'consultant',
      key: 'consultant',
      width: 110,
      align: 'center',
      shouldCellUpdate: cellUpdate('consultant'),
      render: (text: string, record) => (
        <Input value={text} onChange={(e) => handleTextChange(record.key, 'consultant', e.target.value)} />
      ),
    },
    {
      title: '所报专业',
      dataIndex: 'reportedMajor',
      key: 'reportedMajor',
      width: 130,
      align: 'center',
      shouldCellUpdate: cellUpdate('reportedMajor'),
      render: (text: string, record) => (
        <Input value={text} onChange={(e) => handleTextChange(record.key, 'reportedMajor', e.target.value)} />
      ),
    },
    {
      title: '学制',
      dataIndex: 'educationSystem',
      key: 'educationSystem',
      width: 90,
      align: 'center',
      shouldCellUpdate: cellUpdate('educationSystem'),
      render: (text: string, record) => (
        <Input value={text} onChange={(e) => handleTextChange(record.key, 'educationSystem', e.target.value)} />
      ),
    },
    {
      title: '应收学费金额',
      dataIndex: 'receivableTuition',
      key: 'receivableTuition',
      width: 130,
      align: 'right',
      shouldCellUpdate: cellUpdate('receivableTuition'),
      render: (value: number | null, record) => (
        <InputNumber
          min={0}
          value={value ?? undefined}
          style={{ width: '100%' }}
          onChange={(v) => handleNumberChange(record.key, 'receivableTuition', v ?? null)}
        />
      ),
    },
    {
      title: '班主任姓名',
      dataIndex: 'headTeacherName',
      key: 'headTeacherName',
      width: 120,
      align: 'center',
      shouldCellUpdate: cellUpdate('headTeacherName'),
      render: (text: string, record) => (
        <Input value={text} onChange={(e) => handleTextChange(record.key, 'headTeacherName', e.target.value)} />
      ),
    },
    {
      title: '学员状态',
      dataIndex: 'studentStatus',
      key: 'studentStatus',
      width: 110,
      align: 'center',
      shouldCellUpdate: cellUpdate('studentStatus'),
      render: (text: string, record) => (
        <Input value={text} onChange={(e) => handleTextChange(record.key, 'studentStatus', e.target.value)} />
      ),
    },
    {
      title: '过往专业',
      dataIndex: 'previousMajor',
      key: 'previousMajor',
      width: 130,
      align: 'center',
      shouldCellUpdate: cellUpdate('previousMajor'),
      render: (text: string, record) => (
        <Input value={text} onChange={(e) => handleTextChange(record.key, 'previousMajor', e.target.value)} />
      ),
    },
    {
      title: '毕业学校',
      dataIndex: 'graduatedSchool',
      key: 'graduatedSchool',
      width: 160,
      align: 'center',
      shouldCellUpdate: cellUpdate('graduatedSchool'),
      render: (text: string, record) => (
        <Input value={text} onChange={(e) => handleTextChange(record.key, 'graduatedSchool', e.target.value)} />
      ),
    },
    {
      title: '联系电话',
      dataIndex: 'contactPhone',
      key: 'contactPhone',
      width: 130,
      align: 'center',
      shouldCellUpdate: cellUpdate('contactPhone'),
      render: (text: string, record) => (
        <Input value={text} onChange={(e) => handleTextChange(record.key, 'contactPhone', e.target.value)} />
      ),
    },
    {
      title: '家长电话',
      dataIndex: 'parentPhone',
      key: 'parentPhone',
      width: 130,
      align: 'center',
      shouldCellUpdate: cellUpdate('parentPhone'),
      render: (text: string, record) => (
        <Input value={text} onChange={(e) => handleTextChange(record.key, 'parentPhone', e.target.value)} />
      ),
    },
    {
      title: '通信地址',
      dataIndex: 'mailingAddress',
      key: 'mailingAddress',
      width: 200,
      align: 'left',
      shouldCellUpdate: cellUpdate('mailingAddress'),
      render: (text: string, record) => (
        <Input value={text} onChange={(e) => handleTextChange(record.key, 'mailingAddress', e.target.value)} />
      ),
    },
    {
      title: '户口性质',
      dataIndex: 'householdType',
      key: 'householdType',
      width: 110,
      align: 'center',
      shouldCellUpdate: cellUpdate('householdType'),
      render: (text: string, record) => (
        <Input value={text} onChange={(e) => handleTextChange(record.key, 'householdType', e.target.value)} />
      ),
    },
    {
      title: '就读方式',
      dataIndex: 'studyMode',
      key: 'studyMode',
      width: 110,
      align: 'center',
      shouldCellUpdate: cellUpdate('studyMode'),
      render: (text: string, record) => (
        <Input value={text} onChange={(e) => handleTextChange(record.key, 'studyMode', e.target.value)} />
      ),
    },
    {
      title: '现住址',
      dataIndex: 'currentAddress',
      key: 'currentAddress',
      width: 200,
      align: 'left',
      shouldCellUpdate: cellUpdate('currentAddress'),
      render: (text: string, record) => (
        <Input value={text} onChange={(e) => handleTextChange(record.key, 'currentAddress', e.target.value)} />
      ),
    },
    {
      title: '是否承诺注册学历',
      dataIndex: 'hasRegistrationCommitment',
      key: 'hasRegistrationCommitment',
      width: 150,
      align: 'center',
      shouldCellUpdate: cellUpdate('hasRegistrationCommitment'),
      render: (value: string, record) => (
        <Select
          allowClear
          options={YES_NO_OPTIONS}
          value={value || undefined}
          onChange={(v) => handleTextChange(record.key, 'hasRegistrationCommitment', v ?? '')}
        />
      ),
    },
    {
      title: '承诺注册学历性质',
      dataIndex: 'promisedEducationNature',
      key: 'promisedEducationNature',
      width: 150,
      align: 'center',
      shouldCellUpdate: cellUpdate('promisedEducationNature'),
      render: (text: string, record) => (
        <Input
          value={text}
          onChange={(e) => handleTextChange(record.key, 'promisedEducationNature', e.target.value)}
        />
      ),
    },
    {
      title: '承诺注册学历级别',
      dataIndex: 'promisedEducationLevel',
      key: 'promisedEducationLevel',
      width: 150,
      align: 'center',
      shouldCellUpdate: cellUpdate('promisedEducationLevel'),
      render: (text: string, record) => (
        <Input
          value={text}
          onChange={(e) => handleTextChange(record.key, 'promisedEducationLevel', e.target.value)}
        />
      ),
    },
    {
      title: '学历学校名称',
      dataIndex: 'educationSchoolName',
      key: 'educationSchoolName',
      width: 180,
      align: 'center',
      shouldCellUpdate: cellUpdate('educationSchoolName'),
      render: (text: string, record) => (
        <Input
          value={text}
          onChange={(e) => handleTextChange(record.key, 'educationSchoolName', e.target.value)}
        />
      ),
    },
    {
      title: '是否已注册中专/大专',
      dataIndex: 'hasRegistered',
      key: 'hasRegistered',
      width: 150,
      align: 'center',
      shouldCellUpdate: cellUpdate('hasRegistered'),
      render: (value: string, record) => (
        <Select
          allowClear
          options={YES_NO_OPTIONS}
          value={value || undefined}
          onChange={(v) => handleTextChange(record.key, 'hasRegistered', v ?? '')}
        />
      ),
    },
    {
      title: '所注册学校',
      dataIndex: 'registeredSchool',
      key: 'registeredSchool',
      width: 180,
      align: 'center',
      shouldCellUpdate: cellUpdate('registeredSchool'),
      render: (text: string, record) => (
        <Input value={text} onChange={(e) => handleTextChange(record.key, 'registeredSchool', e.target.value)} />
      ),
    },
    {
      title: '备注',
      dataIndex: 'remarks',
      key: 'remarks',
      width: 180,
      align: 'left',
      shouldCellUpdate: cellUpdate('remarks'),
      render: (text: string, record) => (
        <Input value={text} onChange={(e) => handleTextChange(record.key, 'remarks', e.target.value)} />
      ),
    },
    {
      title: '退费时间',
      dataIndex: 'refundDate',
      key: 'refundDate',
      width: 140,
      align: 'center',
      shouldCellUpdate: cellUpdate('refundDate'),
      render: (text: string, record) => (
        <DatePicker
          value={text ? dayjs(text) : null}
          format="YYYY-MM-DD"
          style={{ width: '100%' }}
          onChange={(date) => handleTextChange(record.key, 'refundDate', date ? date.format('YYYY-MM-DD') : '')}
        />
      ),
    },
    {
      title: '退费金额',
      dataIndex: 'refundAmount',
      key: 'refundAmount',
      width: 120,
      align: 'right',
      shouldCellUpdate: cellUpdate('refundAmount'),
      render: (value: number | null, record) => (
        <InputNumber
          min={0}
          value={value ?? undefined}
          style={{ width: '100%' }}
          onChange={(v) => handleNumberChange(record.key, 'refundAmount', v ?? null)}
        />
      ),
    },
  ], [handleTextChange, handleNumberChange, studentOptions, handleStudentSearch, handleStudentSelect])

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={`退费明细 · ${currentCampus || ''}`}
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
            <span>月份</span>
            <Select options={MONTH_OPTIONS} value={month} style={{ width: 120 }} onChange={(v) => setMonth(Number(v))} />
            <Button onClick={async () => {
              const [serverData, classFileData] = await Promise.all([fetchFromServer(), importFromClassFile()])
              const merged = mergeData(serverData, classFileData)
              setRows(merged)
              message.success(`已刷新 ${merged.length} 条记录`)
            }} disabled={!canIO}>刷新</Button>
            <Button onClick={async () => {
              const data = await importFromClassFile()
              message.success(`从班档案表获取到 ${data.length} 条记录`)
            }} disabled={!currentCampus}>从班档案表导入</Button>
            <Button onClick={addOneRow} disabled={!canIO || month === 0}>新增</Button>
            <Button type="primary" onClick={() => saveToServer()} disabled={!canIO || month === 0}>保存</Button>
            <span style={{ color: '#999', fontSize: '12px' }}>
              显示 {displayRows.length} 行
            </span>
          </Space>
        }
      >
        <Table<RefundDetailRow>
          bordered
          size="small"
          columns={columns}
          dataSource={displayRows}
          pagination={false}
          rowKey="key"
          scroll={{ x: 'max-content' }}
          locale={{
            emptyText: '暂无退费数据',
          }}
        />
      </Card>
    </div>
  )
}

export default CampusRefundDetailTable
