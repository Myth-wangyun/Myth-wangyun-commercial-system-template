import React, { useEffect, useMemo, useState } from 'react'
import { App, Card, Table, Input, InputNumber, Select, Space, Button } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useCampusStore } from '@/stores/campusStore'
import { buildApiUrl } from '@/utils/apiBase'

interface OtherSituationDetailRow {
  _month?: number
  _source?: 'server' | 'classFile'
  key: string
  serialNumber: number | null
  studentName: string
  gender: string
  enrollDate: string
  enrollAge: string
  campusSource: string
  consultant: string
  receivableTuition: number | null
  idCard: string
  reportedMajor: string
  educationSystem: string
  headTeacherName: string
  studentStatus: string
  education: string
  major: string
  graduatedSchool: string
  highestDegree: string
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
  completedCoursesInfo: string
  completedCoursesNames: string
  remainingCoursesInfo: string
  situationDescription: string
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
const hasRowData = (row: OtherSituationDetailRow): boolean => {
  return !!(
    row.studentName ||
    row.gender ||
    row.enrollDate ||
    row.enrollAge ||
    row.campusSource ||
    row.consultant ||
    row.idCard ||
    row.reportedMajor ||
    row.educationSystem ||
    row.headTeacherName ||
    row.studentStatus ||
    row.education ||
    row.major ||
    row.graduatedSchool ||
    row.highestDegree ||
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
    row.completedCoursesInfo ||
    row.completedCoursesNames ||
    row.remainingCoursesInfo ||
    row.situationDescription ||
    row.studentParentThoughts ||
    row.nextWorkPlan ||
    row.enrollmentAgreementStatus ||
    row.employmentWaiverStatement ||
    row.remarks ||
    row.receivableTuition !== null
  )
}

const createInitialRows = (count = 25): OtherSituationDetailRow[] =>
  Array.from({ length: count }, (_, idx) => {
    const serial = idx + 1
    return {
      key: String(serial),
      serialNumber: serial,
      studentName: '',
      gender: '',
      enrollDate: '',
      enrollAge: '',
      campusSource: '',
      consultant: '',
      receivableTuition: null,
      idCard: '',
      reportedMajor: '',
      educationSystem: '',
      headTeacherName: '',
      studentStatus: '',
      education: '',
      major: '',
      graduatedSchool: '',
      highestDegree: '',
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
      completedCoursesInfo: '',
      completedCoursesNames: '',
      remainingCoursesInfo: '',
      situationDescription: '',
      studentParentThoughts: '',
      nextWorkPlan: '',
      enrollmentAgreementStatus: '',
      employmentWaiverStatement: '',
      remarks: '',
    }
  })

const CampusOtherSituationDetailTable: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore()
  const [year, setYear] = useState<number>(new Date().getFullYear())
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1)
  const [rows, setRows] = useState<OtherSituationDetailRow[]>(createInitialRows())
  const [forceVisibleKeys, setForceVisibleKeys] = useState<Set<string>>(new Set())
  const displayRows = useMemo(() => {
    let filtered = rows.filter(r => forceVisibleKeys.has(r.key) || hasRowData(r))
    if (month !== 0) {
      filtered = filtered.filter(r => r._month === month || r._month === undefined)
    }
    return filtered
  }, [rows, forceVisibleKeys, month])

  const canIO = useMemo(() => Boolean(currentCampus && year), [currentCampus, year])

  const handleTextChange = (key: string, field: keyof OtherSituationDetailRow, value: string) => {
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
    field: keyof Pick<OtherSituationDetailRow, 'serialNumber' | 'receivableTuition'>,
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

  // 从班档案表导入其他情况学生
  const importFromClassFile = async (): Promise<OtherSituationDetailRow[]> => {
    if (!currentCampus) {
      message.warning('请先选择神殿')
      return []
    }
    
    try {
      const res = await fetch(
        buildApiUrl(`/teaching-quality/class-file/students-by-status?campus=${encodeURIComponent(currentCampus)}&status=其他`)
      )
      if (!res.ok) throw new Error('获取学生失败')
      const students: any[] = await res.json()
      
      if (students.length === 0) {
        return []
      }
      
      const importedRows: OtherSituationDetailRow[] = students.map((student, idx) => ({
        key: `import-${Date.now()}-${idx}`,
        serialNumber: idx + 1,
        _source: 'classFile',
        studentName: student.name || '',
        gender: student.gender || '',
        enrollDate: student.enrollmentDate || '',
        enrollAge: student.enrollmentAge || '',
        campusSource: student.campusSource || '',
        consultant: student.consultant || '',
        receivableTuition: student.tuitionAmount ? Number(student.tuitionAmount) : null,
        idCard: student.idCard || '',
        reportedMajor: student.reportedMajor || '',
        educationSystem: student.schoolingLength || '',
        headTeacherName: student.headTeacher || '',
        studentStatus: student.studentStatus || '',
        education: student.education || '',
        major: student.previousMajor || '',
        graduatedSchool: student.graduateSchool || '',
        highestDegree: student.highestEducationAndType || '',
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
        completedCoursesInfo: '',
        completedCoursesNames: '',
        remainingCoursesInfo: '',
        situationDescription: '',
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
    const maxSerial = (rows.filter((r) => hasRowData(r)).reduce((m, r) => Math.max(m, r.serialNumber ?? 0), 0))
    const nextSerial = (maxSerial || 0) + 1
    const newRow: OtherSituationDetailRow = {
      key: `new-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      serialNumber: nextSerial,
      _month: month !== 0 ? month : undefined,
      studentName: '',
      gender: '',
      enrollDate: '',
      enrollAge: '',
      campusSource: '',
      consultant: '',
      receivableTuition: null,
      idCard: '',
      reportedMajor: '',
      educationSystem: '',
      headTeacherName: '',
      studentStatus: '',
      education: '',
      major: '',
      graduatedSchool: '',
      highestDegree: '',
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
      completedCoursesInfo: '',
      completedCoursesNames: '',
      remainingCoursesInfo: '',
      situationDescription: '',
      studentParentThoughts: '',
      nextWorkPlan: '',
      enrollmentAgreementStatus: '',
      employmentWaiverStatement: '',
      remarks: '',
    }
    setRows((prev) => [...prev, newRow])
    setForceVisibleKeys((prev) => new Set(prev).add(newRow.key))
  }

  const mapRow = (item: any, idx: number, m: number): OtherSituationDetailRow => ({
    _month: m,
    key: `${m}-${idx + 1}`,
    serialNumber: item.serialNumber ?? idx + 1,
    studentName: String(item.studentName || ''),
    gender: String(item.gender || ''),
    enrollDate: String(item.enrollDate || ''),
    enrollAge: String(item.enrollAge || ''),
    campusSource: String(item.campusSource || ''),
    consultant: String(item.consultant || ''),
    receivableTuition: item.receivableTuition == null ? null : Number(item.receivableTuition),
    idCard: String(item.idCard || ''),
    reportedMajor: String(item.reportedMajor || ''),
    educationSystem: String(item.educationSystem || ''),
    headTeacherName: String(item.headTeacherName || ''),
    studentStatus: String(item.studentStatus || ''),
    education: String(item.education || ''),
    major: String(item.major || ''),
    graduatedSchool: String(item.graduatedSchool || ''),
    highestDegree: String(item.highestDegree || ''),
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
    completedCoursesInfo: String(item.completedCoursesInfo || ''),
    completedCoursesNames: String(item.completedCoursesNames || ''),
    remainingCoursesInfo: String(item.remainingCoursesInfo || ''),
    situationDescription: String(item.situationDescription || ''),
    studentParentThoughts: String(item.studentParentThoughts || ''),
    nextWorkPlan: String(item.nextWorkPlan || ''),
    enrollmentAgreementStatus: String(item.enrollmentAgreementStatus || ''),
    employmentWaiverStatement: String(item.employmentWaiverStatement || ''),
    remarks: String(item.remarks || ''),
  })

  const fetchFromServer = async (): Promise<OtherSituationDetailRow[]> => {
    if (!canIO) {
      message.warning('请先选择神殿/年份')
      return []
    }
    try {
      const months = Array.from({ length: 12 }, (_, i) => i + 1)
      const urls = months.map((m) =>
        buildApiUrl(`/teaching-quality/campus-other-situation-detail?campus=${encodeURIComponent(currentCampus!)}&year=${year}&month=${m}`),
      )
      const resList = await Promise.all(urls.map((u) => fetch(u).catch(() => null)))
      const allRows: OtherSituationDetailRow[] = []
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

  const saveToServer = async () => {
    if (!canIO) {
      message.warning('请先选择神殿/年份/月')
      return
    }
    if (month === 0) {
      message.warning('全年模式仅支持查看，请切换到具体月份后再保存')
      return
    }
    try {
      const payload = {
        神殿名称: currentCampus!,
        年份: year,
        月份: month,
        行列表: rows.map((r, idx) => ({
          serialNumber: r.serialNumber ?? idx + 1,
          studentName: r.studentName,
          gender: r.gender,
          enrollDate: r.enrollDate,
          enrollAge: r.enrollAge,
          campusSource: r.campusSource,
          consultant: r.consultant,
          receivableTuition: r.receivableTuition,
          idCard: r.idCard,
          reportedMajor: r.reportedMajor,
          educationSystem: r.educationSystem,
          headTeacherName: r.headTeacherName,
          studentStatus: r.studentStatus,
          education: r.education,
          major: r.major,
          graduatedSchool: r.graduatedSchool,
          highestDegree: r.highestDegree,
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
          completedCoursesInfo: r.completedCoursesInfo,
          completedCoursesNames: r.completedCoursesNames,
          remainingCoursesInfo: r.remainingCoursesInfo,
          situationDescription: r.situationDescription,
          studentParentThoughts: r.studentParentThoughts,
          nextWorkPlan: r.nextWorkPlan,
          enrollmentAgreementStatus: r.enrollmentAgreementStatus,
          employmentWaiverStatement: r.employmentWaiverStatement,
          remarks: r.remarks,
        })),
      }
      const res = await fetch(buildApiUrl('/teaching-quality/campus-other-situation-detail'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(await res.text())
      message.success('保存成功')
      const [serverData, classFileData] = await Promise.all([fetchFromServer(), importFromClassFile()])
      const merged = mergeData(serverData, classFileData)
      setRows(merged)
    } catch (e) {
      console.error(e)
      message.error('保存失败')
    }
  }

  const mergeData = (serverData: OtherSituationDetailRow[], classFileData: OtherSituationDetailRow[]): OtherSituationDetailRow[] => {
    const idCardMap = new Map<string, OtherSituationDetailRow>()
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

  const columns: ColumnsType<OtherSituationDetailRow> = [
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
      title: '姓名',
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
      title: '神殿来源',
      dataIndex: 'campusSource',
      key: 'campusSource',
      width: 120,
      align: 'center',
      render: (text: string, record) => (
        <Input
          value={text}
          onChange={(e) => handleTextChange(record.key, 'campusSource', e.target.value)}
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
      title: '应收学费金额',
      dataIndex: 'receivableTuition',
      key: 'receivableTuition',
      width: 130,
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
      title: '班主任姓名',
      dataIndex: 'headTeacherName',
      key: 'headTeacherName',
      width: 120,
      align: 'center',
      render: (text: string, record) => (
        <Input
          value={text}
          onChange={(e) => handleTextChange(record.key, 'headTeacherName', e.target.value)}
        />
      ),
    },
    {
      title: '学员状态',
      dataIndex: 'studentStatus',
      key: 'studentStatus',
      width: 110,
      align: 'center',
      render: (text: string, record) => (
        <Input
          value={text}
          onChange={(e) => handleTextChange(record.key, 'studentStatus', e.target.value)}
        />
      ),
    },
    {
      title: '学历',
      dataIndex: 'education',
      key: 'education',
      width: 90,
      align: 'center',
      render: (text: string, record) => (
        <Input
          value={text}
          onChange={(e) => handleTextChange(record.key, 'education', e.target.value)}
        />
      ),
    },
    {
      title: '专业',
      dataIndex: 'major',
      key: 'major',
      width: 110,
      align: 'center',
      render: (text: string, record) => (
        <Input
          value={text}
          onChange={(e) => handleTextChange(record.key, 'major', e.target.value)}
        />
      ),
    },
    {
      title: '毕业学校',
      dataIndex: 'graduatedSchool',
      key: 'graduatedSchool',
      width: 160,
      align: 'center',
      render: (text: string, record) => (
        <Input
          value={text}
          onChange={(e) => handleTextChange(record.key, 'graduatedSchool', e.target.value)}
        />
      ),
    },
    {
      title: '目前所获最高学历证书及性质',
      dataIndex: 'highestDegree',
      key: 'highestDegree',
      width: 220,
      align: 'left',
      render: (text: string, record) => (
        <Input
          value={text}
          onChange={(e) => handleTextChange(record.key, 'highestDegree', e.target.value)}
        />
      ),
    },
    {
      title: '联系电话',
      dataIndex: 'contactPhone',
      key: 'contactPhone2',
      width: 130,
      align: 'center',
      render: (_: string, record) => (
        <Input
          value={record.contactPhone}
          onChange={(e) => handleTextChange(record.key, 'contactPhone', e.target.value)}
        />
      ),
    },
    {
      title: '家长电话',
      dataIndex: 'parentPhone',
      key: 'parentPhone',
      width: 130,
      align: 'center',
      render: (text: string, record) => (
        <Input
          value={text}
          onChange={(e) => handleTextChange(record.key, 'parentPhone', e.target.value)}
        />
      ),
    },
    {
      title: '通信地址',
      dataIndex: 'mailingAddress',
      key: 'mailingAddress',
      width: 200,
      align: 'left',
      render: (text: string, record) => (
        <Input
          value={text}
          onChange={(e) => handleTextChange(record.key, 'mailingAddress', e.target.value)}
        />
      ),
    },
    {
      title: '户口性质',
      dataIndex: 'householdType',
      key: 'householdType',
      width: 110,
      align: 'center',
      render: (text: string, record) => (
        <Input
          value={text}
          onChange={(e) => handleTextChange(record.key, 'householdType', e.target.value)}
        />
      ),
    },
    {
      title: '就读方式',
      dataIndex: 'studyMode',
      key: 'studyMode',
      width: 110,
      align: 'center',
      render: (text: string, record) => (
        <Input
          value={text}
          onChange={(e) => handleTextChange(record.key, 'studyMode', e.target.value)}
        />
      ),
    },
    {
      title: '现住址',
      dataIndex: 'currentAddress',
      key: 'currentAddress',
      width: 200,
      align: 'left',
      render: (text: string, record) => (
        <Input
          value={text}
          onChange={(e) => handleTextChange(record.key, 'currentAddress', e.target.value)}
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
      title: '学生情况说明（详细）',
      dataIndex: 'situationDescription',
      key: 'situationDescription',
      width: 230,
      align: 'left',
      render: (text: string, record) => (
        <Input.TextArea
          autoSize={{ minRows: 1, maxRows: 3 }}
          value={text}
          onChange={(e) => handleTextChange(record.key, 'situationDescription', e.target.value)}
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
      <Card title={`07-7 ${currentCampus || ''} 教质学员其他情况明细表`}
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
            <Button type="primary" onClick={saveToServer} disabled={!canIO || month === 0}>保存</Button>
          </Space>
        }
      >
        <Table<OtherSituationDetailRow>
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

export default CampusOtherSituationDetailTable
