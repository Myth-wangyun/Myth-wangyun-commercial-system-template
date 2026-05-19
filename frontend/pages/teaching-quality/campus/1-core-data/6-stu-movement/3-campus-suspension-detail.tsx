// 神殿 -> 教化司 · QMJY-JZ-007  XX神殿教化司学员异动表 休学明细表
import React, { useEffect, useMemo, useState } from 'react'
import { App, Card, Table, Input, InputNumber, Select, Space, Button, DatePicker } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useCampusStore } from '@/stores/campusStore'
import { buildApiUrl } from '@/utils/apiBase'

interface SuspensionDetailRow {
  _month?: number
  _source?: 'server' | 'classFile'
  key: string
  serialNumber: number | null
  studentName: string
  gender: string
  originalClass: string
  originalHeadTeacher: string
  date: string // 日期字段
  suspensionStartDate: string
  expectedReturnDate: string
  contactPhone: string
  actualReturnDate: string
  returnClass: string
  returnClassHeadTeacher: string
  enrollDate: string
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
  suspensionDescription: string
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

// 仅在对应单元格数据变更时才更新该单元格
const hasRowData = (row: SuspensionDetailRow): boolean => {
  return !!(
    row.studentName ||
    row.gender ||
    row.originalClass ||
    row.originalHeadTeacher ||
    row.suspensionStartDate ||
    row.expectedReturnDate ||
    row.contactPhone ||
    row.actualReturnDate ||
    row.returnClass ||
    row.returnClassHeadTeacher ||
    row.enrollDate ||
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
    row.suspensionDescription ||
    row.studentParentThoughts ||
    row.nextWorkPlan ||
    row.enrollmentAgreementStatus ||
    row.employmentWaiverStatement ||
    row.remarks ||
    row.receivableTuition !== null ||
    row.paidTuition !== null
  )
}

const createInitialRows = (count = 25): SuspensionDetailRow[] =>
  Array.from({ length: count }, (_, idx) => {
    const serial = idx + 1
    return {
      key: String(serial),
      serialNumber: serial,
      studentName: '',
      gender: '',
      originalClass: '',
      originalHeadTeacher: '',
      date: '', // 日期字段
      suspensionStartDate: '',
      expectedReturnDate: '',
      contactPhone: '',
      actualReturnDate: '',
      returnClass: '',
      returnClassHeadTeacher: '',
      enrollDate: '',
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
      suspensionDescription: '',
      studentParentThoughts: '',
      nextWorkPlan: '',
      enrollmentAgreementStatus: '',
      employmentWaiverStatement: '',
      remarks: '',
    }
  })

const CampusSuspensionDetailTable: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore()
  const [year, setYear] = useState<number>(new Date().getFullYear())
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1)
  const [rows, setRows] = useState<SuspensionDetailRow[]>(createInitialRows())
  const [forceVisibleKeys, setForceVisibleKeys] = useState<Set<string>>(new Set())
  const displayRows = useMemo(() => {
    let filtered = rows.filter(r => forceVisibleKeys.has(r.key) || hasRowData(r))
    // 如果month不是0（全年），则只显示对应月份的数据或没有月份标记的数据
    if (month !== 0) {
      filtered = filtered.filter(r => r._month === month || r._month === undefined)
    }
    return filtered
  }, [rows, forceVisibleKeys, month])

  // 年/神殿满足即可刷新；保存和新增另行判断
  const canIO = useMemo(() => Boolean(currentCampus && year), [currentCampus, year])

  const handleTextChange = (key: string, field: keyof SuspensionDetailRow, value: string) => {
    setRows((prev) => prev.map((row) => (row.key === key ? { ...row, [field]: value } : row)))
  }

  // 处理回车键切换到下一行相同列的输入框
  const handleEnterKey = (e: React.KeyboardEvent, currentKey: string, dataIndex: string) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      e.stopPropagation()
      
      // 找到当前行的索引
      const currentIndex = displayRows.findIndex(r => r.key === currentKey)
      if (currentIndex === -1) return
      
      // 找到下一行
      const nextIndex = currentIndex + 1
      if (nextIndex >= displayRows.length) {
        // 如果是最后一行，可以自动添加新行（可选）
        // addOneRow()
        return
      }
      
      const nextRow = displayRows[nextIndex]
      if (!nextRow) return
      
      // 使用 setTimeout 确保 DOM 已更新
      setTimeout(() => {
        // 通过 DOM 查找下一个输入框
        const currentRow = e.currentTarget.closest('tr')
        if (!currentRow) return
        
        const tbody = currentRow.closest('tbody')
        if (!tbody) return
        
        const allRows = Array.from(tbody.querySelectorAll('tr'))
        const currentRowIndex = allRows.indexOf(currentRow)
        const nextRowElement = allRows[currentRowIndex + 1]
        
        if (!nextRowElement) return
        
        // 找到当前列在所有列中的索引
        const currentCell = e.currentTarget.closest('td')
        if (!currentCell) return
        
        const currentRowCells = Array.from(currentRow.querySelectorAll('td'))
        const currentColumnIndex = currentRowCells.indexOf(currentCell)
        
        // 找到下一行的相同列
        const nextRowCells = Array.from(nextRowElement.querySelectorAll('td'))
        const nextCell = nextRowCells[currentColumnIndex]
        
        if (!nextCell) return
        
        // 在下一行的单元格中查找输入框
        const nextInput = nextCell.querySelector<HTMLInputElement>('input, textarea')
        if (nextInput) {
          nextInput.focus()
          // 如果是 Input，选中文本以便直接输入
          if (nextInput.tagName === 'INPUT' && nextInput.type !== 'number' && nextInput.type !== 'date') {
            nextInput.select()
          }
        }
      }, 10)
    }
  }

  const handleNumberChange = (
    key: string,
    field: keyof Pick<SuspensionDetailRow, 'serialNumber' | 'receivableTuition' | 'paidTuition'>,
    value: number | null,
  ) => {
    const v = typeof value === 'number' ? value : null
    setRows((prev) => prev.map((row) => (row.key === key ? { ...row, [field]: v } : row)))
  }

  // 从班档案表导入休学学生
  const importFromClassFile = async (): Promise<SuspensionDetailRow[]> => {
    if (!currentCampus) {
      message.warning('请先选择神殿')
      return []
    }
    
    try {
      const res = await fetch(
        buildApiUrl(`/teaching-quality/class-file/students-by-status?campus=${encodeURIComponent(currentCampus)}&status=休学`)
      )
      if (!res.ok) throw new Error('获取学生失败')
      const students: any[] = await res.json()
      
      if (students.length === 0) {
        return []
      }
      
      // 获取当前日期
      const currentDate = dayjs().format('YYYY-MM-DD')
      
      const importedRows: SuspensionDetailRow[] = students.map((student, idx) => ({
        key: `import-${Date.now()}-${idx}`,
        serialNumber: idx + 1,
        _source: 'classFile',
        studentName: student.name || '',
        gender: student.gender || '',
        originalClass: student.className || '',
        originalHeadTeacher: student.headTeacher || '', // 从档案表获取原班主任
        date: currentDate, // 自动填写当前日期
        suspensionStartDate: '',
        expectedReturnDate: '',
        contactPhone: student.phone || '',
        actualReturnDate: '',
        returnClass: '',
        returnClassHeadTeacher: '',
        enrollDate: student.enrollmentDate || '',
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
        suspensionDescription: '',
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
      const newRow: SuspensionDetailRow = {
      key: `new-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      serialNumber: nextSerial,
      _month: month !== 0 ? month : undefined,
      studentName: '',
      gender: '',
      originalClass: '',
      originalHeadTeacher: '',
      date: dayjs().format('YYYY-MM-DD'), // 默认当前日期
      suspensionStartDate: '',
      expectedReturnDate: '',
      contactPhone: '',
      actualReturnDate: '',
      returnClass: '',
      returnClassHeadTeacher: '',
      enrollDate: '',
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
      suspensionDescription: '',
      studentParentThoughts: '',
      nextWorkPlan: '',
      enrollmentAgreementStatus: '',
      employmentWaiverStatement: '',
      remarks: '',
    }
    setRows((prev) => [...prev, newRow])
    setForceVisibleKeys((prev) => new Set(prev).add(newRow.key))
  }

  const mapRow = (item: any, idx: number, m: number): SuspensionDetailRow => ({
    _month: m,
    key: `${m}-${idx + 1}`,
    serialNumber: item.serialNumber ?? idx + 1,
    studentName: String(item.studentName || ''),
    gender: String(item.gender || ''),
    originalClass: String(item.originalClass || ''),
    originalHeadTeacher: String(item.originalHeadTeacher || ''),
    date: String(item.date || ''), // 日期字段
    suspensionStartDate: String(item.suspensionStartDate || ''),
    expectedReturnDate: String(item.expectedReturnDate || ''),
    contactPhone: String(item.contactPhone || ''),
    actualReturnDate: String(item.actualReturnDate || ''),
    returnClass: String(item.returnClass || ''),
    returnClassHeadTeacher: String(item.returnClassHeadTeacher || ''),
    enrollDate: String(item.enrollDate || ''),
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
    suspensionDescription: String(item.suspensionDescription || ''),
    studentParentThoughts: String(item.studentParentThoughts || ''),
    nextWorkPlan: String(item.nextWorkPlan || ''),
    enrollmentAgreementStatus: String(item.enrollmentAgreementStatus || ''),
    employmentWaiverStatement: String(item.employmentWaiverStatement || ''),
    remarks: String(item.remarks || ''),
  })

  const fetchFromServer = async (): Promise<SuspensionDetailRow[]> => {
    if (!canIO) {
      message.warning('请先选择神殿/年份')
      return []
    }
    try {
      // 始终获取全年12个月数据
      const months = Array.from({ length: 12 }, (_, i) => i + 1)
      const urls = months.map((m) =>
        buildApiUrl(`/teaching-quality/campus-suspension-detail?campus=${encodeURIComponent(currentCampus!)}&year=${year}&month=${m}`),
      )
      const resList = await Promise.all(urls.map((u) => fetch(u).catch(() => null)))
      const allRows: SuspensionDetailRow[] = []
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

  const saveToServer = async (dataToSave?: SuspensionDetailRow[], isAuto = false) => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/03b6740b-2a21-407c-83d4-b6939c7fa9e3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'3-campus-suspension-detail.tsx:352',message:'saveToServer函数入口',data:{canIO,month,isAuto,rowsCount:rows.length,dataToSaveCount:dataToSave?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    const rowsToUse = dataToSave || rows
    if (!canIO) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/03b6740b-2a21-407c-83d4-b6939c7fa9e3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'3-campus-suspension-detail.tsx:355',message:'提前返回：canIO为false',data:{canIO},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      if (!isAuto) message.warning('请先选择神殿/年份/月')
      return
    }
    if (month === 0) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/03b6740b-2a21-407c-83d4-b6939c7fa9e3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'3-campus-suspension-detail.tsx:360',message:'提前返回：month为0',data:{month},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
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
          date: r.date || '',
          suspensionStartDate: r.suspensionStartDate,
          expectedReturnDate: r.expectedReturnDate,
          contactPhone: r.contactPhone,
          actualReturnDate: r.actualReturnDate,
          returnClass: r.returnClass,
          returnClassHeadTeacher: r.returnClassHeadTeacher,
          enrollDate: r.enrollDate,
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
          suspensionDescription: r.suspensionDescription,
          studentParentThoughts: r.studentParentThoughts,
          nextWorkPlan: r.nextWorkPlan,
          enrollmentAgreementStatus: r.enrollmentAgreementStatus,
          employmentWaiverStatement: r.employmentWaiverStatement,
          remarks: r.remarks,
        })),
      }
      const res = await fetch(buildApiUrl('/teaching-quality/campus-suspension-detail'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(await res.text())
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/03b6740b-2a21-407c-83d4-b6939c7fa9e3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'3-campus-suspension-detail.tsx:409',message:'保存成功，开始检查转班条件',data:{rowsToUseCount:rowsToUse.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      if (!isAuto) message.success('保存成功')
      
      // 检查并自动转班：如果实复学日期和复学班级都有值，自动触发转班
      const transferPromises: Promise<void>[] = []
      let transferCount = 0
      
      for (const row of rowsToUse) {
        const hasActualReturnDate = row.actualReturnDate && row.actualReturnDate.trim()
        const hasReturnClass = row.returnClass && row.returnClass.trim()
        const hasOriginalClass = row.originalClass && row.originalClass.trim()
        const hasStudentName = row.studentName && row.studentName.trim()
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/03b6740b-2a21-407c-83d4-b6939c7fa9e3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'3-campus-suspension-detail.tsx:417',message:'检查转班条件',data:{studentName:row.studentName,actualReturnDate:row.actualReturnDate,returnClass:row.returnClass,originalClass:row.originalClass,hasActualReturnDate,hasReturnClass,hasOriginalClass,hasStudentName},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        console.log(`[自动转班检查] 学生: ${row.studentName}, 实复学日期: ${hasActualReturnDate}, 复学班级: ${hasReturnClass}, 原班级: ${hasOriginalClass}`)
        
        if (hasActualReturnDate && hasReturnClass && hasOriginalClass && hasStudentName) {
          // 如果原班级和复学班级相同，跳过转班
          if (row.originalClass.trim() === row.returnClass.trim()) {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/03b6740b-2a21-407c-83d4-b6939c7fa9e3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'3-campus-suspension-detail.tsx:425',message:'跳过转班：原班级和复学班级相同',data:{studentName:row.studentName,originalClass:row.originalClass.trim(),returnClass:row.returnClass.trim()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
            // #endregion
            console.log(`[自动转班] 跳过 ${row.studentName}：原班级和复学班级相同`)
            continue
          }
          
          transferCount++
          const transferPayload = {
            studentName: row.studentName,
            sourceCampus: currentCampus!,
            sourceClass: row.originalClass,
            targetCampus: currentCampus!,
            targetClass: row.returnClass,
            idCard: row.idCard && row.idCard.trim() ? row.idCard.trim() : undefined, // 优先使用身份证号
          }
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/03b6740b-2a21-407c-83d4-b6939c7fa9e3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'3-campus-suspension-detail.tsx:431',message:'开始调用转班API',data:transferPayload,timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'C'})}).catch(()=>{});
          // #endregion
          console.log(`[自动转班] 开始转班: ${row.studentName}${row.idCard ? ` (身份证: ${row.idCard})` : ''} 从 ${row.originalClass} 转到 ${row.returnClass}`)
          
          // 自动转班：从原班级转到复学班级（优先使用身份证号匹配）
          const transferPromise = fetch(buildApiUrl('/teaching-quality/class-file/transfer-student'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(transferPayload),
          })
            .then(async (transferRes) => {
              // #region agent log
              fetch('http://127.0.0.1:7242/ingest/03b6740b-2a21-407c-83d4-b6939c7fa9e3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'3-campus-suspension-detail.tsx:445',message:'转班API响应',data:{studentName:row.studentName,ok:transferRes.ok,status:transferRes.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
              // #endregion
              if (!transferRes.ok) {
                const errorText = await transferRes.text()
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/03b6740b-2a21-407c-83d4-b6939c7fa9e3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'3-campus-suspension-detail.tsx:448',message:'转班API调用失败',data:{studentName:row.studentName,status:transferRes.status,errorText},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
                // #endregion
                console.error(`[自动转班失败] ${row.studentName}:`, errorText)
                if (!isAuto) {
                  message.error(`${row.studentName} 自动转班失败: ${errorText}`)
                }
                return
              }
              const transferResult = await transferRes.json()
              // #region agent log
              fetch('http://127.0.0.1:7242/ingest/03b6740b-2a21-407c-83d4-b6939c7fa9e3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'3-campus-suspension-detail.tsx:455',message:'转班API结果',data:{studentName:row.studentName,success:transferResult.success,message:transferResult.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
              // #endregion
              if (transferResult.success) {
                console.log(`[自动转班成功] ${row.studentName}:`, transferResult.message)
                if (!isAuto) {
                  message.success(`${row.studentName} 已自动从 ${row.originalClass} 转入 ${row.returnClass} 班`)
                }
              } else {
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/03b6740b-2a21-407c-83d4-b6939c7fa9e3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'3-campus-suspension-detail.tsx:461',message:'转班业务逻辑失败',data:{studentName:row.studentName,message:transferResult.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
                // #endregion
                console.error(`[自动转班失败] ${row.studentName}:`, transferResult.message)
                if (!isAuto) {
                  message.warning(`${row.studentName} 自动转班失败: ${transferResult.message}`)
                }
              }
            })
            .catch((error) => {
              // #region agent log
              fetch('http://127.0.0.1:7242/ingest/03b6740b-2a21-407c-83d4-b6939c7fa9e3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'3-campus-suspension-detail.tsx:467',message:'转班API异常',data:{studentName:row.studentName,error:error.message||error.toString()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
              // #endregion
              console.error(`[自动转班异常] ${row.studentName}:`, error)
              if (!isAuto) {
                message.error(`${row.studentName} 自动转班异常: ${error.message || error}`)
              }
            })
          
          transferPromises.push(transferPromise)
        } else {
          const missing = []
          if (!hasActualReturnDate) missing.push('实复学日期')
          if (!hasReturnClass) missing.push('复学班级')
          if (!hasOriginalClass) missing.push('原班级')
          if (!hasStudentName) missing.push('学生姓名')
          console.log(`[自动转班] 跳过 ${row.studentName}：缺少 ${missing.join('、')}`)
        }
      }
      
      // 等待所有转班操作完成
      if (transferPromises.length > 0) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/03b6740b-2a21-407c-83d4-b6939c7fa9e3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'3-campus-suspension-detail.tsx:478',message:'等待转班操作完成',data:{transferPromisesCount:transferPromises.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        console.log(`[自动转班] 共 ${transferPromises.length} 名学生需要转班，开始执行...`)
        await Promise.all(transferPromises)
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/03b6740b-2a21-407c-83d4-b6939c7fa9e3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'3-campus-suspension-detail.tsx:481',message:'所有转班操作完成',data:{transferPromisesCount:transferPromises.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        console.log(`[自动转班] 所有转班操作完成`)
      } else {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/03b6740b-2a21-407c-83d4-b6939c7fa9e3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'3-campus-suspension-detail.tsx:484',message:'没有需要转班的学生',data:{transferPromisesCount:transferPromises.length,transferCount,rowsCount:rowsToUse.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        console.log(`[自动转班] 没有需要转班的学生`)
      }
      
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
  const mergeData = (serverData: SuspensionDetailRow[], classFileData: SuspensionDetailRow[]): SuspensionDetailRow[] => {
    const idCardMap = new Map<string, SuspensionDetailRow>()
    const classFileMap = new Map<string, SuspensionDetailRow>()
    
    // 先建立班档案表数据的索引（按身份证号）
    classFileData.forEach(row => {
      const idCard = row.idCard?.trim()
      if (idCard) {
        classFileMap.set(idCard, row)
      }
    })
    
    // 先添加服务器数据（优先级高）
    serverData.forEach(row => {
      if (row.idCard && row.idCard.trim()) {
        const idCard = row.idCard.trim()
        // 如果服务器数据中的联系电话为空，尝试从班档案表获取
        if (!row.contactPhone || !row.contactPhone.trim()) {
          const classFileRow = classFileMap.get(idCard)
          if (classFileRow && classFileRow.contactPhone && classFileRow.contactPhone.trim()) {
            row.contactPhone = classFileRow.contactPhone
          }
        }
        idCardMap.set(idCard, row)
      }
    })
    
    // 添加班档案表数据（如果身份证号不存在）
    classFileData.forEach(row => {
      const idCard = row.idCard?.trim()
      if (idCard && !idCardMap.has(idCard)) {
        idCardMap.set(idCard, row)
      }
    })
    
    // 转换为数组并重新编号
    const merged = Array.from(idCardMap.values())
    return merged.map((r, i) => ({ ...r, serialNumber: i + 1 }))
  }

  useEffect(() => {
    if (currentCampus) {
      setRows([])
      setForceVisibleKeys(new Set())
      // 同时加载服务器数据和班档案表数据，取并集
      Promise.all([fetchFromServer(), importFromClassFile()]).then(([serverData, classFileData]) => {
        const merged = mergeData(serverData, classFileData)
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

  const DATE_FORMAT = 'YYYY-MM-DD'

const columns: ColumnsType<SuspensionDetailRow> = [
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
      fixed: '左' as any,
      render: (value: number | null, record) => (
        <InputNumber
          min={1}
          value={value ?? undefined}
          style={{ width: '100%' }}
          onChange={(v) => handleNumberChange(record.key, 'serialNumber', v ?? null)}
          onKeyDown={(e) => handleEnterKey(e, record.key, 'serialNumber')}
        />
      ),
    },
    {
      title: '学员休学复学基本情况',
      children: [
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
              onKeyDown={(e) => handleEnterKey(e, record.key, 'studentName')}
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
            <Select allowClear options={GENDER_OPTIONS} value={value || undefined} onChange={(v) => handleTextChange(record.key, 'gender', v ?? '')} />
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
              onKeyDown={(e) => handleEnterKey(e, record.key, 'originalClass')}
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
              onKeyDown={(e) => handleEnterKey(e, record.key, 'originalHeadTeacher')}
            />
          ),
        },
        {
          title: '日期',
          dataIndex: 'date',
          key: 'date',
          width: 130,
          align: 'center',
          render: (text: string, record) => (
            <DatePicker 
              value={text ? dayjs(text, DATE_FORMAT) : null} 
              onChange={(_, dateString) => handleTextChange(record.key, 'date', dateString as string)}
              style={{ width: '100%' }}
              format={DATE_FORMAT}
            />
          ),
        },
        {
          title: '休学开始日期',
          dataIndex: 'suspensionStartDate',
          key: 'suspensionStartDate',
          width: 130,
          align: 'center',
          render: (text: string, record) => (
            <DatePicker 
              value={text ? dayjs(text, DATE_FORMAT) : null} 
              onChange={(_, dateString) => handleTextChange(record.key, 'suspensionStartDate', dateString as string)}
              style={{ width: '100%' }}
              format={DATE_FORMAT}
            />
          ),
        },
        {
          title: '应复学日期',
          dataIndex: 'expectedReturnDate',
          key: 'expectedReturnDate',
          width: 130,
          align: 'center',
          render: (text: string, record) => (
            <DatePicker 
              value={text ? dayjs(text, DATE_FORMAT) : null} 
              onChange={(_, dateString) => handleTextChange(record.key, 'expectedReturnDate', dateString as string)}
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
              onKeyDown={(e) => handleEnterKey(e, record.key, 'contactPhone')}
            />
          ),
        },
        {
          title: '实复学日期',
          dataIndex: 'actualReturnDate',
          key: 'actualReturnDate',
          width: 130,
          align: 'center',
          render: (text: string, record) => (
            <DatePicker
              value={text ? dayjs(text, DATE_FORMAT) : null}
              onChange={(_, dateString) => handleTextChange(record.key, 'actualReturnDate', dateString as string)}
              style={{ width: '100%' }}
              format={DATE_FORMAT}
            />
          ),
        },
        {
          title: '复学班级',
          dataIndex: 'returnClass',
          key: 'returnClass',
          width: 110,
          align: 'center',
          render: (text: string, record) => (
            <Input 
              value={text} 
              onChange={(e) => handleTextChange(record.key, 'returnClass', e.target.value)}
              onKeyDown={(e) => handleEnterKey(e, record.key, 'returnClass')}
            />
          ),
        },
        {
          title: '复学班级班主任',
          dataIndex: 'returnClassHeadTeacher',
          key: 'returnClassHeadTeacher',
          width: 150,
          align: 'center',
          render: (text: string, record) => (
            <Input 
              value={text} 
              onChange={(e) => handleTextChange(record.key, 'returnClassHeadTeacher', e.target.value)}
              onKeyDown={(e) => handleEnterKey(e, record.key, 'returnClassHeadTeacher')}
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
              onKeyDown={(e) => handleEnterKey(e, record.key, 'enrollDate')}
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
              onKeyDown={(e) => handleEnterKey(e, record.key, 'enrollAge')}
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
              onKeyDown={(e) => handleEnterKey(e, record.key, 'idCard')}
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
              onKeyDown={(e) => handleEnterKey(e, record.key, 'consultant')}
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
            onKeyDown={(e) => handleEnterKey(e, record.key, 'receivableTuition')}
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
            onKeyDown={(e) => handleEnterKey(e, record.key, 'paidTuition')}
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
              onKeyDown={(e) => handleEnterKey(e, record.key, 'reportedMajor')}
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
              onKeyDown={(e) => handleEnterKey(e, record.key, 'educationSystem')}
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
            <Select allowClear options={YES_NO_OPTIONS} value={value || undefined} onChange={(v) => handleTextChange(record.key, 'hasRegistrationCommitment', v ?? '')} />
          ),
        },
      ],
    },
    {
      title: '学员基本情况',
      children: [
        {
          title: '承诺注册学历性质',
          dataIndex: 'promisedEducationNature',
          key: 'promisedEducationNature',
          width: 150,
          align: 'center',
          render: (text: string, record) => (
            <Input 
              value={text} 
              onChange={(e) => handleTextChange(record.key, 'promisedEducationNature', e.target.value)}
              onKeyDown={(e) => handleEnterKey(e, record.key, 'promisedEducationNature')}
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
              onChange={(e) => handleTextChange(record.key, 'promisedEducationLevel', e.target.value)}
              onKeyDown={(e) => handleEnterKey(e, record.key, 'promisedEducationLevel')}
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
              onChange={(e) => handleTextChange(record.key, 'educationSchoolName', e.target.value)}
              onKeyDown={(e) => handleEnterKey(e, record.key, 'educationSchoolName')}
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
            <Select allowClear options={YES_NO_OPTIONS} value={value || undefined} onChange={(v) => handleTextChange(record.key, 'hasRegistered', v ?? '')} />
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
              onKeyDown={(e) => handleEnterKey(e, record.key, 'registeredSchool')}
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
              onKeyDown={(e) => handleEnterKey(e, record.key, 'completedCoursesInfo')}
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
              onKeyDown={(e) => handleEnterKey(e, record.key, 'completedCoursesNames')}
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
              onKeyDown={(e) => handleEnterKey(e, record.key, 'remainingCoursesInfo')}
              style={{ borderColor: !text || !text.trim() ? '#ff4d4f' : undefined }}
            />
          ),
        },
        {
          title: '学生休学情况说明（详细）',
          dataIndex: 'suspensionDescription',
          key: 'suspensionDescription',
          width: 230,
          align: 'left',
          render: (text: string, record) => (
            <Input.TextArea 
              autoSize={{ minRows: 1, maxRows: 3 }} 
              value={text} 
              onChange={(e) => handleTextChange(record.key, 'suspensionDescription', e.target.value)}
              onKeyDown={(e) => {
                // TextArea 中 Shift+Enter 换行，Enter 切换到下一行
                if (e.key === 'Enter' && !e.shiftKey) {
                  handleEnterKey(e, record.key, 'suspensionDescription')
                }
              }}
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
              onKeyDown={(e) => {
                // TextArea 中 Shift+Enter 换行，Enter 切换到下一行
                if (e.key === 'Enter' && !e.shiftKey) {
                  handleEnterKey(e, record.key, 'studentParentThoughts')
                }
              }}
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
              onKeyDown={(e) => {
                // TextArea 中 Shift+Enter 换行，Enter 切换到下一行
                if (e.key === 'Enter' && !e.shiftKey) {
                  handleEnterKey(e, record.key, 'nextWorkPlan')
                }
              }}
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
              onChange={(e) => handleTextChange(record.key, 'enrollmentAgreementStatus', e.target.value)}
              onKeyDown={(e) => handleEnterKey(e, record.key, 'enrollmentAgreementStatus')}
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
              onChange={(e) => handleTextChange(record.key, 'employmentWaiverStatement', e.target.value)}
              onKeyDown={(e) => handleEnterKey(e, record.key, 'employmentWaiverStatement')}
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
              onKeyDown={(e) => handleEnterKey(e, record.key, 'remarks')}
            />
          ),
        },
      ],
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={`07-3 ${currentCampus || ''} 教质休学明细表`}
        extra={
          <Space>
            <span>年份</span>
            <InputNumber min={2000} max={2100} value={year} onChange={(v) => setYear(typeof v === 'number' ? v : new Date().getFullYear())} style={{ width: 100 }} />
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
          </Space>
        }
        style={{ backgroundColor: '#fff' }}
      >
        <Table<SuspensionDetailRow>
          bordered
          size="small"
          columns={columns}
          dataSource={displayRows}
          pagination={false}
          rowKey="key"
          scroll={{ x: 'max-content', y: 600 }}
          style={{ backgroundColor: '#f0f9ff' }}
        />
      </Card>
    </div>
  )
}

export default CampusSuspensionDetailTable
