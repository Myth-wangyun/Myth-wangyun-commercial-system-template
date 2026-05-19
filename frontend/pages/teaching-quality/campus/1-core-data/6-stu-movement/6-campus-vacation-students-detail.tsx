import React, { useEffect, useMemo, useState } from 'react'
import { App, Card, Table, Input, InputNumber, Select, Space, Button, DatePicker } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useCampusStore } from '@/stores/campusStore'
import { buildApiUrl } from '@/utils/apiBase'

interface VacationStudentDetailRow {
  _month?: number
  _source?: 'server' | 'classFile'
  key: string
  serialNumber: number | null
  studentName: string
  gender: string
  originalClass: string
  originalHeadTeacher: string
  enrollDate: string
  firstLeaveDate: string
  contactPhone: string
  secondPlannedReturnDate: string
  secondActualReturnDate: string
  secondLeaveDate: string
  secondHeadTeacher: string
  thirdPlannedReturnDate: string
  thirdActualReturnDate: string
  thirdLeaveDate: string
  thirdHeadTeacher: string
  enrollAge: string
  idCard: string
  consultant: string
  receivableTuition: number | null
  paidTuition: number | null
  reportedMajor: string
  educationSystem: string
  hasRegistrationCommitment: string
  promisedEducationNature: string
  promisedEducationLevel: string
  educationSchoolName: string
  hasRegistered: string
  registeredSchool: string
  completedCoursesInfo: string
  completedCoursesNames: string
  remainingCoursesInfo: string
  vacationDescription: string
  studentParentThoughts: string
  nextWorkPlan: string
  enrollmentAgreementStatus: string
  employmentWaiverStatement: string
  remarks: string
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

// 判断是否为有效数据行（除序号与key外任一字段有值或数值字段非空）
const hasRowData = (row: VacationStudentDetailRow): boolean => {
  return !!(
    row.studentName ||
    row.gender ||
    row.originalClass ||
    row.originalHeadTeacher ||
    row.enrollDate ||
    row.firstLeaveDate ||
    row.contactPhone ||
    row.secondPlannedReturnDate ||
    row.secondActualReturnDate ||
    row.secondLeaveDate ||
    row.secondHeadTeacher ||
    row.thirdPlannedReturnDate ||
    row.thirdActualReturnDate ||
    row.thirdLeaveDate ||
    row.thirdHeadTeacher ||
    row.enrollAge ||
    row.idCard ||
    row.consultant ||
    row.reportedMajor ||
    row.educationSystem ||
    row.hasRegistrationCommitment ||
    row.promisedEducationNature ||
    row.promisedEducationLevel ||
    row.educationSchoolName ||
    row.hasRegistered ||
    row.registeredSchool ||
    row.completedCoursesInfo ||
    row.completedCoursesNames ||
    row.remainingCoursesInfo ||
    row.vacationDescription ||
    row.studentParentThoughts ||
    row.nextWorkPlan ||
    row.enrollmentAgreementStatus ||
    row.employmentWaiverStatement ||
    row.remarks ||
    row.receivableTuition !== null ||
    row.paidTuition !== null
  )
}

const createInitialRows = (count = 25): VacationStudentDetailRow[] =>
  Array.from({ length: count }, (_, idx) => {
    const serial = idx + 1
    return {
      key: String(serial),
      serialNumber: serial,
      studentName: '',
      gender: '',
      originalClass: '',
      originalHeadTeacher: '',
      enrollDate: '',
      firstLeaveDate: '',
      contactPhone: '',
      secondPlannedReturnDate: '',
      secondActualReturnDate: '',
      secondLeaveDate: '',
      secondHeadTeacher: '',
      thirdPlannedReturnDate: '',
      thirdActualReturnDate: '',
      thirdLeaveDate: '',
      thirdHeadTeacher: '',
      enrollAge: '',
      idCard: '',
      consultant: '',
      receivableTuition: null,
      paidTuition: null,
      reportedMajor: '',
      educationSystem: '',
      hasRegistrationCommitment: '',
      promisedEducationNature: '',
      promisedEducationLevel: '',
      educationSchoolName: '',
      hasRegistered: '',
      registeredSchool: '',
      completedCoursesInfo: '',
      completedCoursesNames: '',
      remainingCoursesInfo: '',
      vacationDescription: '',
      studentParentThoughts: '',
      nextWorkPlan: '',
      enrollmentAgreementStatus: '',
      employmentWaiverStatement: '',
      remarks: '',
    }
  })

const CampusVacationStudentsDetailTable: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore()
  const [year, setYear] = useState<number>(new Date().getFullYear())
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1)
  const [rows, setRows] = useState<VacationStudentDetailRow[]>(createInitialRows())
  const [forceVisibleKeys, setForceVisibleKeys] = useState<Set<string>>(new Set())
  const displayRows = useMemo(() => {
    let filtered = rows.filter(r => forceVisibleKeys.has(r.key) || hasRowData(r))
    if (month !== 0) {
      filtered = filtered.filter(r => r._month === month || r._month === undefined)
    }
    return filtered
  }, [rows, forceVisibleKeys, month])

  const canIO = useMemo(() => Boolean(currentCampus && year), [currentCampus, year])

  const handleTextChange = (key: string, field: keyof VacationStudentDetailRow, value: string) => {
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
  }

  const handleNumberChange = (
    key: string,
    field: keyof Pick<VacationStudentDetailRow, 'serialNumber' | 'receivableTuition' | 'paidTuition'>,
    value: number | null,
  ) => {
    const v = typeof value === 'number' ? value : null
    setRows((prev) =>
      prev.map((row) =>
        row.key === key
          ? {
              ...row,
              [field]: v,
            }
          : row,
      ),
    )
  }

  // 从班档案表导入寒暑假学生
  const importFromClassFile = async (): Promise<VacationStudentDetailRow[]> => {
    if (!currentCampus) {
      message.warning('请先选择神殿')
      return []
    }
    
    try {
      const res = await fetch(
        buildApiUrl(`/teaching-quality/class-file/students-by-status?campus=${encodeURIComponent(currentCampus)}&status=寒暑假`)
      )
      if (!res.ok) throw new Error('获取学生失败')
      const students: any[] = await res.json()
      
      if (students.length === 0) {
        return []
      }
      
      const importedRows: VacationStudentDetailRow[] = students.map((student, idx) => ({
        key: `import-${Date.now()}-${idx}`,
        serialNumber: idx + 1,
        _source: 'classFile',
        studentName: student.name || '',
        gender: student.gender || '',
        originalClass: student.className || '',
        originalHeadTeacher: student.headTeacher || '',
        enrollDate: student.enrollmentDate || '',
        firstLeaveDate: '',
        contactPhone: student.phone || '',
        secondPlannedReturnDate: '',
        secondActualReturnDate: '',
        secondLeaveDate: '',
        secondHeadTeacher: '',
        thirdPlannedReturnDate: '',
        thirdActualReturnDate: '',
        thirdLeaveDate: '',
        thirdHeadTeacher: '',
        enrollAge: student.enrollmentAge || '',
        idCard: student.idCard || '',
        consultant: student.consultant || '',
        receivableTuition: student.tuitionAmount ? Number(student.tuitionAmount) : null,
        paidTuition: null,
        reportedMajor: student.reportedMajor || '',
        educationSystem: student.schoolingLength || '',
        hasRegistrationCommitment: student.promisedRegisterEducation || '',
        promisedEducationNature: student.promisedEducationNature || '',
        promisedEducationLevel: student.promisedEducationLevel || '',
        educationSchoolName: student.educationSchoolName || '',
        hasRegistered: student.registeredSecondaryOrCollege || '',
        registeredSchool: student.registeredSchool || '',
        completedCoursesInfo: '',
        completedCoursesNames: '',
        remainingCoursesInfo: '',
        vacationDescription: '',
        studentParentThoughts: '',
        nextWorkPlan: '',
        enrollmentAgreementStatus: '',
        employmentWaiverStatement: '',
        remarks: student.remark || '',
      }))
      
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
    const newRow: VacationStudentDetailRow = {
      key: `new-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      serialNumber: nextSerial,
      _month: month !== 0 ? month : undefined,
      studentName: '',
      gender: '',
      originalClass: '',
      originalHeadTeacher: '',
      enrollDate: '',
      firstLeaveDate: '',
      contactPhone: '',
      secondPlannedReturnDate: '',
      secondActualReturnDate: '',
      secondLeaveDate: '',
      secondHeadTeacher: '',
      thirdPlannedReturnDate: '',
      thirdActualReturnDate: '',
      thirdLeaveDate: '',
      thirdHeadTeacher: '',
      enrollAge: '',
      idCard: '',
      consultant: '',
      receivableTuition: null,
      paidTuition: null,
      reportedMajor: '',
      educationSystem: '',
      hasRegistrationCommitment: '',
      promisedEducationNature: '',
      promisedEducationLevel: '',
      educationSchoolName: '',
      hasRegistered: '',
      registeredSchool: '',
      completedCoursesInfo: '',
      completedCoursesNames: '',
      remainingCoursesInfo: '',
      vacationDescription: '',
      studentParentThoughts: '',
      nextWorkPlan: '',
      enrollmentAgreementStatus: '',
      employmentWaiverStatement: '',
      remarks: '',
    }
    setRows((prev) => [...prev, newRow])
    setForceVisibleKeys((prev) => new Set(prev).add(newRow.key))
  }

  const mapRow = (item: any, idx: number, m: number): VacationStudentDetailRow => ({
    _month: m,
    key: `${m}-${idx + 1}`,
    serialNumber: item.serialNumber ?? idx + 1,
    studentName: String(item.studentName || ''),
    gender: String(item.gender || ''),
    originalClass: String(item.originalClass || ''),
    originalHeadTeacher: String(item.originalHeadTeacher || ''),
    enrollDate: String(item.enrollDate || ''),
    firstLeaveDate: String(item.firstLeaveDate || ''),
    contactPhone: String(item.contactPhone || ''),
    secondPlannedReturnDate: String(item.secondPlannedReturnDate || ''),
    secondActualReturnDate: String(item.secondActualReturnDate || ''),
    secondLeaveDate: String(item.secondLeaveDate || ''),
    secondHeadTeacher: String(item.secondHeadTeacher || ''),
    thirdPlannedReturnDate: String(item.thirdPlannedReturnDate || ''),
    thirdActualReturnDate: String(item.thirdActualReturnDate || ''),
    thirdLeaveDate: String(item.thirdLeaveDate || ''),
    thirdHeadTeacher: String(item.thirdHeadTeacher || ''),
    enrollAge: String(item.enrollAge || ''),
    idCard: String(item.idCard || ''),
    consultant: String(item.consultant || ''),
    receivableTuition: item.receivableTuition == null ? null : Number(item.receivableTuition),
    paidTuition: item.paidTuition == null ? null : Number(item.paidTuition),
    reportedMajor: String(item.reportedMajor || ''),
    educationSystem: String(item.educationSystem || ''),
    hasRegistrationCommitment: String(item.hasRegistrationCommitment || ''),
    promisedEducationNature: String(item.promisedEducationNature || ''),
    promisedEducationLevel: String(item.promisedEducationLevel || ''),
    educationSchoolName: String(item.educationSchoolName || ''),
    hasRegistered: String(item.hasRegistered || ''),
    registeredSchool: String(item.registeredSchool || ''),
    completedCoursesInfo: String(item.completedCoursesInfo || ''),
    completedCoursesNames: String(item.completedCoursesNames || ''),
    remainingCoursesInfo: String(item.remainingCoursesInfo || ''),
    vacationDescription: String(item.vacationDescription || ''),
    studentParentThoughts: String(item.studentParentThoughts || ''),
    nextWorkPlan: String(item.nextWorkPlan || ''),
    enrollmentAgreementStatus: String(item.enrollmentAgreementStatus || ''),
    employmentWaiverStatement: String(item.employmentWaiverStatement || ''),
    remarks: String(item.remarks || ''),
  })

  const fetchFromServer = async (): Promise<VacationStudentDetailRow[]> => {
    if (!canIO) {
      message.warning('请先选择神殿/年份')
      return []
    }
    try {
      const months = Array.from({ length: 12 }, (_, i) => i + 1)
      const urls = months.map((m) =>
        buildApiUrl(`/teaching-quality/campus-vacation-students-detail?campus=${encodeURIComponent(currentCampus!)}&year=${year}&month=${m}`),
      )
      const resList = await Promise.all(urls.map((u) => fetch(u).catch(() => null)))
      const allRows: VacationStudentDetailRow[] = []
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

  const saveToServer = async (dataToSave?: VacationStudentDetailRow[], isAuto = false) => {
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
      const payload = {
        神殿名称: currentCampus!,
        年份: year,
        月份: month,
        行列表: rowsToUse.map((r, idx) => ({
          serialNumber: r.serialNumber ?? idx + 1,
          studentName: r.studentName,
          gender: r.gender,
          originalClass: r.originalClass,
          originalHeadTeacher: r.originalHeadTeacher,
          enrollDate: r.enrollDate,
          firstLeaveDate: r.firstLeaveDate,
          contactPhone: r.contactPhone,
          secondPlannedReturnDate: r.secondPlannedReturnDate,
          secondActualReturnDate: r.secondActualReturnDate,
          secondLeaveDate: r.secondLeaveDate,
          secondHeadTeacher: r.secondHeadTeacher,
          thirdPlannedReturnDate: r.thirdPlannedReturnDate,
          thirdActualReturnDate: r.thirdActualReturnDate,
          thirdLeaveDate: r.thirdLeaveDate,
          thirdHeadTeacher: r.thirdHeadTeacher,
          enrollAge: r.enrollAge,
          idCard: r.idCard,
          consultant: r.consultant,
          receivableTuition: r.receivableTuition,
          paidTuition: r.paidTuition,
          reportedMajor: r.reportedMajor,
          educationSystem: r.educationSystem,
          hasRegistrationCommitment: r.hasRegistrationCommitment,
          promisedEducationNature: r.promisedEducationNature,
          promisedEducationLevel: r.promisedEducationLevel,
          educationSchoolName: r.educationSchoolName,
          hasRegistered: r.hasRegistered,
          registeredSchool: r.registeredSchool,
          completedCoursesInfo: r.completedCoursesInfo,
          completedCoursesNames: r.completedCoursesNames,
          remainingCoursesInfo: r.remainingCoursesInfo,
          vacationDescription: r.vacationDescription,
          studentParentThoughts: r.studentParentThoughts,
          nextWorkPlan: r.nextWorkPlan,
          enrollmentAgreementStatus: r.enrollmentAgreementStatus,
          employmentWaiverStatement: r.employmentWaiverStatement,
          remarks: r.remarks,
        })),
      }
      const res = await fetch(buildApiUrl('/teaching-quality/campus-vacation-students-detail'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(await res.text())
      if (!isAuto) message.success('保存成功')
      const [serverData, classFileData] = await Promise.all([fetchFromServer(), importFromClassFile()])
      const merged = mergeData(serverData, classFileData)
      setRows(merged)
    } catch (e) {
      console.error(e)
      if (!isAuto) message.error('保存失败')
    }
  }

  const mergeData = (serverData: VacationStudentDetailRow[], classFileData: VacationStudentDetailRow[]): VacationStudentDetailRow[] => {
    const idCardMap = new Map<string, VacationStudentDetailRow>()
    serverData.forEach(row => {
      if (row.idCard && row.idCard.trim()) {
        idCardMap.set(row.idCard.trim(), row)
      }
    })
    classFileData.forEach(row => {
      const idCard = row.idCard?.trim()
      if (idCard && !idCardMap.has(idCard)) {
        idCardMap.set(idCard, row)
      }
    })
    const merged = Array.from(idCardMap.values())
    return merged.map((r, i) => ({ ...r, serialNumber: i + 1 }))
  }

  useEffect(() => {
    if (currentCampus) {
      setRows(createInitialRows())
      setForceVisibleKeys(new Set())
      Promise.all([fetchFromServer(), importFromClassFile()]).then(([serverData, classFileData]) => {
        const merged = mergeData(serverData, classFileData)
        setRows(merged)
        message.success(`已加载 ${merged.length} 条记录（服务器：${serverData.length}，班档案表：${classFileData.length}）`)
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCampus])

  const DATE_FORMAT = 'YYYY-MM-DD'

  const columns: ColumnsType<VacationStudentDetailRow> = [
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
      title: '学生姓名',
      dataIndex: 'studentName',
      key: 'studentName',
      width: 110,
      align: 'center',
      render: (text: string, record) => (
        <Input
          value={text}
          onChange={(e) => handleTextChange(record.key, 'studentName', e.target.value)}
        />
      ),
    },
    {
      title: '性别',
      dataIndex: 'gender',
      key: 'gender',
      width: 80,
      align: 'center',
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
      title: '原班级',
      dataIndex: 'originalClass',
      key: 'originalClass',
      width: 110,
      align: 'center',
      render: (text: string, record) => (
        <Input
          value={text}
          onChange={(e) => handleTextChange(record.key, 'originalClass', e.target.value)}
        />
      ),
    },
    {
      title: '原班主任',
      dataIndex: 'originalHeadTeacher',
      key: 'originalHeadTeacher',
      width: 120,
      align: 'center',
      render: (text: string, record) => (
        <Input
          value={text}
          onChange={(e) => handleTextChange(record.key, 'originalHeadTeacher', e.target.value)}
        />
      ),
    },
    {
      title: '入学时间',
      dataIndex: 'enrollDate',
      key: 'enrollDate',
      width: 120,
      align: 'center',
      render: (text: string, record) => (
        <Input
          value={text}
          onChange={(e) => handleTextChange(record.key, 'enrollDate', e.target.value)}
        />
      ),
    },
    {
      title: '离校时间',
      dataIndex: 'firstLeaveDate',
      key: 'firstLeaveDate',
      width: 120,
      align: 'center',
      render: (text: string, record) => (
        <DatePicker
          value={text ? dayjs(text, DATE_FORMAT) : null}
          onChange={(_, dateString) => handleTextChange(record.key, 'firstLeaveDate', dateString as string)}
          style={{ width: '100%' }}
          format={DATE_FORMAT}
        />
      ),
    },
    {
      title: '联系电话',
      dataIndex: 'contactPhone',
      key: 'contactPhone',
      width: 130,
      align: 'center',
      render: (text: string, record) => (
        <Input
          value={text}
          onChange={(e) => handleTextChange(record.key, 'contactPhone', e.target.value)}
        />
      ),
    },
    {
      title: '第二次应复学时间',
      dataIndex: 'secondPlannedReturnDate',
      key: 'secondPlannedReturnDate',
      width: 150,
      align: 'center',
      render: (text: string, record) => (
        <DatePicker
          value={text ? dayjs(text, DATE_FORMAT) : null}
          onChange={(_, dateString) => handleTextChange(record.key, 'secondPlannedReturnDate', dateString as string)}
          style={{ width: '100%' }}
          format={DATE_FORMAT}
        />
      ),
    },
    {
      title: '实际复学时间',
      dataIndex: 'secondActualReturnDate',
      key: 'secondActualReturnDate',
      width: 130,
      align: 'center',
      render: (text: string, record) => (
        <DatePicker
          value={text ? dayjs(text, DATE_FORMAT) : null}
          onChange={(_, dateString) => handleTextChange(record.key, 'secondActualReturnDate', dateString as string)}
          style={{ width: '100%' }}
          format={DATE_FORMAT}
        />
      ),
    },
    {
      title: '第二次离校时间',
      dataIndex: 'secondLeaveDate',
      key: 'secondLeaveDate',
      width: 140,
      align: 'center',
      render: (text: string, record) => (
        <DatePicker
          value={text ? dayjs(text, DATE_FORMAT) : null}
          onChange={(_, dateString) => handleTextChange(record.key, 'secondLeaveDate', dateString as string)}
          style={{ width: '100%' }}
          format={DATE_FORMAT}
        />
      ),
    },
    {
      title: '第二次班主任',
      dataIndex: 'secondHeadTeacher',
      key: 'secondHeadTeacher',
      width: 130,
      align: 'center',
      render: (text: string, record) => (
        <Input
          value={text}
          onChange={(e) => handleTextChange(record.key, 'secondHeadTeacher', e.target.value)}
        />
      ),
    },
    {
      title: '第三次应复学时间',
      dataIndex: 'thirdPlannedReturnDate',
      key: 'thirdPlannedReturnDate',
      width: 150,
      align: 'center',
      render: (text: string, record) => (
        <DatePicker
          value={text ? dayjs(text, DATE_FORMAT) : null}
          onChange={(_, dateString) => handleTextChange(record.key, 'thirdPlannedReturnDate', dateString as string)}
          style={{ width: '100%' }}
          format={DATE_FORMAT}
        />
      ),
    },
    {
      title: '第三次实际复学时间',
      dataIndex: 'thirdActualReturnDate',
      key: 'thirdActualReturnDate',
      width: 160,
      align: 'center',
      render: (text: string, record) => (
        <DatePicker
          value={text ? dayjs(text, DATE_FORMAT) : null}
          onChange={(_, dateString) => handleTextChange(record.key, 'thirdActualReturnDate', dateString as string)}
          style={{ width: '100%' }}
          format={DATE_FORMAT}
        />
      ),
    },
    {
      title: '第三次离校时间',
      dataIndex: 'thirdLeaveDate',
      key: 'thirdLeaveDate',
      width: 140,
      align: 'center',
      render: (text: string, record) => (
        <DatePicker
          value={text ? dayjs(text, DATE_FORMAT) : null}
          onChange={(_, dateString) => handleTextChange(record.key, 'thirdLeaveDate', dateString as string)}
          style={{ width: '100%' }}
          format={DATE_FORMAT}
        />
      ),
    },
    {
      title: '第三次班主任',
      dataIndex: 'thirdHeadTeacher',
      key: 'thirdHeadTeacher',
      width: 130,
      align: 'center',
      render: (text: string, record) => (
        <Input
          value={text}
          onChange={(e) => handleTextChange(record.key, 'thirdHeadTeacher', e.target.value)}
        />
      ),
    },
    {
      title: '入学年龄',
      dataIndex: 'enrollAge',
      key: 'enrollAge',
      width: 100,
      align: 'center',
      render: (text: string, record) => (
        <Input
          value={text}
          onChange={(e) => handleTextChange(record.key, 'enrollAge', e.target.value)}
        />
      ),
    },
    {
      title: '身份证号',
      dataIndex: 'idCard',
      key: 'idCard',
      width: 160,
      align: 'center',
      render: (text: string, record) => (
        <Input
          value={text}
          onChange={(e) => handleTextChange(record.key, 'idCard', e.target.value)}
        />
      ),
    },
    {
      title: '咨询师',
      dataIndex: 'consultant',
      key: 'consultant',
      width: 110,
      align: 'center',
      render: (text: string, record) => (
        <Input
          value={text}
          onChange={(e) => handleTextChange(record.key, 'consultant', e.target.value)}
        />
      ),
    },
    {
      title: '应收学费',
      dataIndex: 'receivableTuition',
      key: 'receivableTuition',
      width: 110,
      align: 'right',
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
      title: '已收学费',
      dataIndex: 'paidTuition',
      key: 'paidTuition',
      width: 110,
      align: 'right',
      render: (value: number | null, record) => (
        <InputNumber
          min={0}
          value={value ?? undefined}
          style={{ width: '100%' }}
          onChange={(v) => handleNumberChange(record.key, 'paidTuition', v ?? null)}
        />
      ),
    },
    {
      title: '所报专业',
      dataIndex: 'reportedMajor',
      key: 'reportedMajor',
      width: 130,
      align: 'center',
      render: (text: string, record) => (
        <Input
          value={text}
          onChange={(e) => handleTextChange(record.key, 'reportedMajor', e.target.value)}
        />
      ),
    },
    {
      title: '学制',
      dataIndex: 'educationSystem',
      key: 'educationSystem',
      width: 90,
      align: 'center',
      render: (text: string, record) => (
        <Input
          value={text}
          onChange={(e) => handleTextChange(record.key, 'educationSystem', e.target.value)}
        />
      ),
    },
    {
      title: '是否承诺注册学历',
      dataIndex: 'hasRegistrationCommitment',
      key: 'hasRegistrationCommitment',
      width: 150,
      align: 'center',
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
      render: (text: string, record) => (
        <Input
          value={text}
          onChange={(e) =>
            handleTextChange(record.key, 'promisedEducationNature', e.target.value)
          }
        />
      ),
    },
    {
      title: '承诺注册学历级别',
      dataIndex: 'promisedEducationLevel',
      key: 'promisedEducationLevel',
      width: 150,
      align: 'center',
      render: (text: string, record) => (
        <Input
          value={text}
          onChange={(e) =>
            handleTextChange(record.key, 'promisedEducationLevel', e.target.value)
          }
        />
      ),
    },
    {
      title: '学历学校名称',
      dataIndex: 'educationSchoolName',
      key: 'educationSchoolName',
      width: 180,
      align: 'center',
      render: (text: string, record) => (
        <Input
          value={text}
          onChange={(e) =>
            handleTextChange(record.key, 'educationSchoolName', e.target.value)
          }
        />
      ),
    },
    {
      title: '是否已注册中专/大专',
      dataIndex: 'hasRegistered',
      key: 'hasRegistered',
      width: 150,
      align: 'center',
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
      render: (text: string, record) => (
        <Input
          value={text}
          onChange={(e) => handleTextChange(record.key, 'registeredSchool', e.target.value)}
        />
      ),
    },
    {
      title: '已上课时数、周期时长',
      dataIndex: 'completedCoursesInfo',
      key: 'completedCoursesInfo',
      width: 200,
      align: 'left',
      render: (text: string, record) => (
        <Input
          value={text}
          onChange={(e) => handleTextChange(record.key, 'completedCoursesInfo', e.target.value)}
          style={{ borderColor: !text || !text.trim() ? '#ff4d4f' : undefined }}
        />
      ),
    },
    {
      title: '所学过的课程名称',
      dataIndex: 'completedCoursesNames',
      key: 'completedCoursesNames',
      width: 200,
      align: 'left',
      render: (text: string, record) => (
        <Input
          value={text}
          onChange={(e) => handleTextChange(record.key, 'completedCoursesNames', e.target.value)}
          style={{ borderColor: !text || !text.trim() ? '#ff4d4f' : undefined }}
        />
      ),
    },
    {
      title: '剩余没学的课程名称及剩余课时数',
      dataIndex: 'remainingCoursesInfo',
      key: 'remainingCoursesInfo',
      width: 230,
      align: 'left',
      render: (text: string, record) => (
        <Input
          value={text}
          onChange={(e) => handleTextChange(record.key, 'remainingCoursesInfo', e.target.value)}
          style={{ borderColor: !text || !text.trim() ? '#ff4d4f' : undefined }}
        />
      ),
    },
    {
      title: '学生寒暑假情况说明（详细）',
      dataIndex: 'vacationDescription',
      key: 'vacationDescription',
      width: 230,
      align: 'left',
      render: (text: string, record) => (
        <Input.TextArea
          autoSize={{ minRows: 1, maxRows: 3 }}
          value={text}
          onChange={(e) => handleTextChange(record.key, 'vacationDescription', e.target.value)}
          style={{ borderColor: !text || !text.trim() ? '#ff4d4f' : undefined }}
        />
      ),
    },
    {
      title: '目前学生和家长的想法（简单说结论）',
      dataIndex: 'studentParentThoughts',
      key: 'studentParentThoughts',
      width: 240,
      align: 'left',
      render: (text: string, record) => (
        <Input.TextArea
          autoSize={{ minRows: 1, maxRows: 3 }}
          value={text}
          onChange={(e) => handleTextChange(record.key, 'studentParentThoughts', e.target.value)}
          style={{ borderColor: !text || !text.trim() ? '#ff4d4f' : undefined }}
        />
      ),
    },
    {
      title: '下一步对他的工作计划',
      dataIndex: 'nextWorkPlan',
      key: 'nextWorkPlan',
      width: 220,
      align: 'left',
      render: (text: string, record) => (
        <Input.TextArea
          autoSize={{ minRows: 1, maxRows: 3 }}
          value={text}
          onChange={(e) => handleTextChange(record.key, 'nextWorkPlan', e.target.value)}
          style={{ borderColor: !text || !text.trim() ? '#ff4d4f' : undefined }}
        />
      ),
    },
    {
      title: '入学协议签署情况',
      dataIndex: 'enrollmentAgreementStatus',
      key: 'enrollmentAgreementStatus',
      width: 160,
      align: 'center',
      render: (text: string, record) => (
        <Input
          value={text}
          onChange={(e) =>
            handleTextChange(record.key, 'enrollmentAgreementStatus', e.target.value)
          }
          style={{ borderColor: !text || !text.trim() ? '#ff4d4f' : undefined }}
        />
      ),
    },
    {
      title: '放弃就业声明',
      dataIndex: 'employmentWaiverStatement',
      key: 'employmentWaiverStatement',
      width: 140,
      align: 'center',
      render: (text: string, record) => (
        <Input
          value={text}
          onChange={(e) =>
            handleTextChange(record.key, 'employmentWaiverStatement', e.target.value)
          }
          style={{ borderColor: !text || !text.trim() ? '#ff4d4f' : undefined }}
        />
      ),
    },
    {
      title: '备注',
      dataIndex: 'remarks',
      key: 'remarks',
      width: 180,
      align: 'left',
      render: (text: string, record) => (
        <Input
          value={text}
          onChange={(e) => handleTextChange(record.key, 'remarks', e.target.value)}
          style={{ borderColor: !text || !text.trim() ? '#ff4d4f' : undefined }}
        />
      ),
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <Card title={`07-6 ${currentCampus || ''} 教质寒暑假学生明细表`}
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
            <Button type="primary" onClick={() => void saveToServer()} disabled={!canIO || month === 0}>保存</Button>
          </Space>
        }
      >
        <Table<VacationStudentDetailRow>
          bordered
          size="small"
          columns={columns}
          dataSource={displayRows}
          pagination={false}
          rowKey="key"
          scroll={{ x: 'max-content' }}
        />
      </Card>
    </div>
  )
}

export default CampusVacationStudentsDetailTable
