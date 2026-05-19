//教化司 神殿 -> 学员就业 -> 班级档案表

import React, { useState, useEffect, useCallback, useMemo, startTransition, useRef } from 'react'
import { App, Card, Table, Input, Select, Button, Space, Popconfirm, Modal, DatePicker, AutoComplete, Tag, Tooltip, Dropdown } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useSearchParams } from 'react-router-dom'
import { useCampusStore } from '@/stores/campusStore'
import { buildApiUrl } from '@/utils/apiBase'
import { fetchClasses, fetchMajors, fetchHomeroomTeachers, type ClassProfile } from '@/services/configMaster'
import { validateIdCard, validatePhone } from '@/utils/validation'
import dayjs from 'dayjs'
import * as XLSX from 'xlsx'
import { FileExcelOutlined, CopyOutlined, DownOutlined } from '@ant-design/icons'

// 导入本模块的类型、常量、工具函数等
import type { ClassFileRecordRow, FormerHeadTeacher, ClassDefaults } from './types'
import { GENDER_OPTIONS, YES_NO_OPTIONS, STUDENT_STATUS_OPTIONS } from './constants'
import {
  normalizeCampus,
  extractBirthDateFromIdCard,
  calculateAge,
  getCampusSourceOptions,
  createEmptyRow,
  getStorageKey,
  createInitialData
} from './utils'
import { loadClassFileData, saveClassFileData } from './services'
import { StatisticsBar, StudentStatusLists, TransferModal, FormerTeacherModal } from './components'
import { createColumns } from './columns'

const { Option } = Select

const initialData: ClassFileRecordRow[] = createInitialData()

// 全部班级选项的特殊值
const ALL_CLASSES_VALUE = '__ALL_CLASSES__'

const ClassFileRecordPage: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore()
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [selectedCampus, setSelectedCampus] = useState<string>('')
  const [dataSource, setDataSource] = useState<ClassFileRecordRow[]>(initialData)
  const [availableClasses, setAvailableClasses] = useState<
    Array<{ className: string; campus: string }>
  >([])
  const [classProfiles, setClassProfiles] = useState<ClassProfile[]>([])
  const [majorsByCampus, setMajorsByCampus] = useState<Record<string, string[]>>({})
  const [homeroomTeachers, setHomeroomTeachers] = useState<string[]>([])
  const autoSaveTimerRef = React.useRef<number | null>(null)
  
  // 存储当前班级的默认值（从配置中心获取）
  const [currentClassDefaults, setCurrentClassDefaults] = useState<ClassDefaults>({
    openingDate: '',
    schoolingLength: ''
  })
  
  // 往任班主任编辑状态
  const [formerTeacherModalVisible, setFormerTeacherModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<ClassFileRecordRow | null>(null)
  
  // 转班相关状态
  const [transferModalVisible, setTransferModalVisible] = useState(false)
  
  // Excel 导入相关状态
  const [importLoading, setImportLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // 键盘导航状态
  const [focusedCell, setFocusedCell] = useState<{ rowIndex: number; columnKey: string } | null>(null)
  const cellRefs = useRef<Map<string, HTMLElement>>(new Map())
  
  // 判断是否为全部班级视图（需要在 handleKeyDown 之前声明）
  const isAllClassesView = selectedClass === ALL_CLASSES_VALUE
  
  // 可编辑的列键（按顺序）- 使用 useMemo 避免每次都创建新数组
  const editableColumns = useMemo(() => [
    'name', 'gender', 'idCard', 'enrollmentDate', 'openingDate', 'enrollmentAge',
    'education', 'graduationDate', 'graduationAge', 'highestEducationAndType',
    'campusSource', 'enrollmentCampus', 'consultant', 'reportedMajor',
    'schoolingLength', 'tuitionAmount', 'headTeacher', 'studentStatus',
    'previousMajor', 'graduateSchool', 'phone', 'parentPhone', 'address',
    'householdType', 'studyMode', 'currentAddress', 'promisedRegisterEducation',
    'promisedEducationNature', 'promisedEducationLevel', 'educationSchoolName',
    'registeredSecondaryOrCollege', 'registeredSchool', 'remark', 'employmentApprovalStatus'
  ], [])
  
  // 注册单元格引用 - 使用 useCallback 避免每次创建新函数
  const registerCellRef = useCallback((rowIndex: number, columnKey: string, element: HTMLElement | null) => {
    const key = `${rowIndex}-${columnKey}`
    if (element) {
      cellRefs.current.set(key, element)
    } else {
      cellRefs.current.delete(key)
    }
  }, [])
  
  // 聚焦到指定单元格 - 使用 useCallback 避免每次创建新函数
  const focusCell = useCallback((rowIndex: number, columnKey: string) => {
    const key = `${rowIndex}-${columnKey}`
    const element = cellRefs.current.get(key)
    if (element) {
      // 查找输入元素（Input、Select、DatePicker 等）
      const input = element.querySelector('input, textarea, .ant-select-selector') as HTMLElement
      if (input) {
        input.focus()
        // 如果是 input 或 textarea，选中所有文本
        if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) {
          input.select()
        }
      }
      setFocusedCell({ rowIndex, columnKey })
    }
  }, [])
  
  // 处理键盘导航 - 使用 useCallback 并优化依赖
  const handleKeyDown = useCallback((e: React.KeyboardEvent, rowIndex: number, columnKey: string) => {
    const currentColIndex = editableColumns.indexOf(columnKey)
    if (currentColIndex === -1) return
    
    // 更新当前聚焦的单元格
    setFocusedCell({ rowIndex, columnKey })
    
    let handled = false
    
    switch (e.key) {
      case 'ArrowUp':
        // 向上移动
        if (rowIndex > 0) {
          focusCell(rowIndex - 1, columnKey)
          handled = true
        }
        break
        
      case 'ArrowDown':
        // 向下移动
        setDataSource(prev => {
          if (rowIndex < prev.length - 1) {
            focusCell(rowIndex + 1, columnKey)
          } else if (!isAllClassesView) {
            // 在最后一行按下箭头，新增一行
            const maxSerial = Math.max(...prev.map(d => d.serialNumber || 0), 0)
            const newRow = {
              ...createEmptyRow(maxSerial + 1),
              openingDate: currentClassDefaults.openingDate,
              schoolingLength: currentClassDefaults.schoolingLength
            }
            // 延迟聚焦到新行
            setTimeout(() => {
              focusCell(prev.length, columnKey)
            }, 100)
            return [...prev, newRow]
          }
          return prev
        })
        handled = true
        break
        
      case 'Enter':
        // Enter 键：向下移动或新增行
        setDataSource(prev => {
          if (rowIndex < prev.length - 1) {
            focusCell(rowIndex + 1, columnKey)
          } else if (!isAllClassesView) {
            // 在最后一行按 Enter，新增一行
            const maxSerial = Math.max(...prev.map(d => d.serialNumber || 0), 0)
            const newRow = {
              ...createEmptyRow(maxSerial + 1),
              openingDate: currentClassDefaults.openingDate,
              schoolingLength: currentClassDefaults.schoolingLength
            }
            // 延迟聚焦到新行
            setTimeout(() => {
              focusCell(prev.length, columnKey)
            }, 100)
            return [...prev, newRow]
          }
          return prev
        })
        handled = true
        break
        
      case 'ArrowLeft':
        // 向左移动
        if (currentColIndex > 0) {
          focusCell(rowIndex, editableColumns[currentColIndex - 1])
          handled = true
        }
        break
        
      case 'ArrowRight':
        // 向右移动
        setDataSource(prev => {
          if (currentColIndex < editableColumns.length - 1) {
            focusCell(rowIndex, editableColumns[currentColIndex + 1])
          } else if (rowIndex < prev.length - 1) {
            // 到达行尾，移动到下一行第一列
            focusCell(rowIndex + 1, editableColumns[0])
          }
          return prev
        })
        handled = true
        break
        
      case 'Tab':
        // Tab 键：向右移动
        setDataSource(prev => {
          if (currentColIndex < editableColumns.length - 1) {
            focusCell(rowIndex, editableColumns[currentColIndex + 1])
          } else if (rowIndex < prev.length - 1) {
            // 到达行尾，移动到下一行第一列
            focusCell(rowIndex + 1, editableColumns[0])
          }
          return prev
        })
        handled = true
        break
    }
    
    if (handled) {
      e.preventDefault()
      e.stopPropagation()
    }
  }, [editableColumns, focusCell, isAllClassesView, currentClassDefaults])
  
  React.useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current != null) {
        window.clearTimeout(autoSaveTimerRef.current)
        autoSaveTimerRef.current = null
      }
    }
  }, [])

  // 获取存储键名（确保神殿名称规范化）
  const storageKey = useCallback((className: string, campus: string) => {
    return getStorageKey(className, campus)
  }, [])

  // 加载数据（从后端）
  const loadData = useCallback(async (className: string, campus: string) => {
    try {
      // 实时从配置中心获取班级的开班日期（确保获取到最新数据）
      const normalizedCampus = normalizeCampus(campus)
      let latestClassInfo: ClassProfile | undefined
      
      try {
        // 尝试从配置中心实时获取该班级信息
        const classes = await fetchClasses({ campus_name: normalizedCampus, active: true })
        latestClassInfo = classes.find(
          cls => cls.class_name === className && normalizeCampus(cls.campus_name) === normalizedCampus
        )
        
        // 如果没找到，尝试用原始神殿名称查询
        if (!latestClassInfo) {
          const classesWithOriginal = await fetchClasses({ campus_name: campus, active: true })
          latestClassInfo = classesWithOriginal.find(
            cls => cls.class_name === className && normalizeCampus(cls.campus_name) === normalizedCampus
          )
        }
        
        console.log('[班级档案] 实时获取班级信息:', { className, campus, latestClassInfo })
      } catch (err) {
        console.warn('[班级档案] 实时获取班级信息失败，使用缓存数据:', err)
        // 如果实时获取失败，回退到使用 classProfiles 中的数据
        latestClassInfo = classProfiles.find(
          cls => cls.class_name === className && normalizeCampus(cls.campus_name) === normalizedCampus
        )
      }
      
      const defaultOpeningDate = latestClassInfo?.start_date || ''
      const defaultSchoolingLength = latestClassInfo?.program_length || ''
      console.log('[班级档案] 使用开班时间:', defaultOpeningDate, '学制:', defaultSchoolingLength, '来自班级:', className)
      
      // 更新当前班级的默认值，供新增行使用
      setCurrentClassDefaults({
        openingDate: defaultOpeningDate,
        schoolingLength: defaultSchoolingLength
      })
      
      const url = buildApiUrl(`/teaching-quality/class-file?campus=${encodeURIComponent(normalizedCampus)}&class=${encodeURIComponent(className)}`)
      const res = await fetch(url)
      if (!res.ok) throw new Error('加载班级档案失败')
      const result = await res.json()
      const rows = (result?.行列表 || []) as any[]
      const mapped: ClassFileRecordRow[] = rows.map((r: any, idx: number) => ({
        key: `${className}_${r.serialNumber ?? idx + 1}`,
        serialNumber: Number(r.serialNumber ?? idx + 1),
        name: r.name || '',
        gender: r.gender || '',
        idCard: r.idCard || '',
        enrollmentDate: r.enrollmentDate || '',
        enrollmentAge: r.enrollmentAge || '',
        education: r.education || '',
        graduationDate: r.graduationDate || '',
        graduationAge: r.graduationAge || '',
        highestEducationAndType: r.highestEducationAndType || '',
        campusSource: r.campusSource || '',
        enrollmentCampus: r.enrollmentCampus || '',
        consultant: r.consultant || '',
        reportedMajor: r.reportedMajor || '',
        schoolingLength: r.schoolingLength || defaultSchoolingLength,
        openingDate: r.openingDate || defaultOpeningDate,
        tuitionAmount: r.tuitionAmount || '',
        headTeacher: r.headTeacher || '',
        formerHeadTeachers: Array.isArray(r.formerHeadTeachers) ? r.formerHeadTeachers : [],
        studentStatus: r.studentStatus || '在读',
        previousMajor: r.previousMajor || '',
        graduateSchool: r.graduateSchool || '',
        phone: r.phone || '',
        parentPhone: r.parentPhone || '',
        address: r.address || '',
        householdType: r.householdType || '',
        studyMode: r.studyMode || '',
        currentAddress: r.currentAddress || '',
        promisedRegisterEducation: r.promisedRegisterEducation || '',
        promisedEducationNature: r.promisedEducationNature || '',
        promisedEducationLevel: r.promisedEducationLevel || '',
        educationSchoolName: r.educationSchoolName || '',
        registeredSecondaryOrCollege: r.registeredSecondaryOrCollege || '',
        registeredSchool: r.registeredSchool || '',
        remark: r.remark || '',
        employmentApprovalStatus: r.employmentApprovalStatus || '',
        className: className, // 添加班级名称字段
      }))
      
      // 如果没有数据，显示空状态（不生成默认输入行）
      if (mapped.length === 0) {
        setDataSource([])
      } else {
        setDataSource(mapped)
      }
    } catch (error) {
      console.error('加载数据失败:', error)
      setDataSource([])
    }
  }, [classProfiles])

  // 加载所有班级的数据
  const loadAllClassesData = useCallback(async (campus: string) => {
    try {
      const normalizedCampus = normalizeCampus(campus)
      const allData: ClassFileRecordRow[] = []
      
      // 遍历所有可用班级，分别加载数据
      for (const classInfo of availableClasses) {
        try {
          const url = buildApiUrl(`/teaching-quality/class-file?campus=${encodeURIComponent(normalizedCampus)}&class=${encodeURIComponent(classInfo.className)}`)
          const res = await fetch(url)
          if (!res.ok) {
            console.warn(`[全部班级] 加载 ${classInfo.className} 班数据失败`)
            continue
          }
          const result = await res.json()
          const rows = (result?.行列表 || []) as any[]
          
          const mapped: ClassFileRecordRow[] = rows.map((r: any, idx: number) => ({
            key: `${classInfo.className}_${r.serialNumber ?? idx + 1}`,
            serialNumber: Number(r.serialNumber ?? idx + 1),
            name: r.name || '',
            gender: r.gender || '',
            idCard: r.idCard || '',
            enrollmentDate: r.enrollmentDate || '',
            enrollmentAge: r.enrollmentAge || '',
            education: r.education || '',
            graduationDate: r.graduationDate || '',
            graduationAge: r.graduationAge || '',
            highestEducationAndType: r.highestEducationAndType || '',
            campusSource: r.campusSource || '',
            enrollmentCampus: r.enrollmentCampus || '',
            consultant: r.consultant || '',
            reportedMajor: r.reportedMajor || '',
            schoolingLength: r.schoolingLength || '',
            openingDate: r.openingDate || '',
            tuitionAmount: r.tuitionAmount || '',
            headTeacher: r.headTeacher || '',
            formerHeadTeachers: Array.isArray(r.formerHeadTeachers) ? r.formerHeadTeachers : [],
            studentStatus: r.studentStatus || '在读',
            previousMajor: r.previousMajor || '',
            graduateSchool: r.graduateSchool || '',
            phone: r.phone || '',
            parentPhone: r.parentPhone || '',
            address: r.address || '',
            householdType: r.householdType || '',
            studyMode: r.studyMode || '',
            currentAddress: r.currentAddress || '',
            promisedRegisterEducation: r.promisedRegisterEducation || '',
            promisedEducationNature: r.promisedEducationNature || '',
            promisedEducationLevel: r.promisedEducationLevel || '',
            educationSchoolName: r.educationSchoolName || '',
            registeredSecondaryOrCollege: r.registeredSecondaryOrCollege || '',
            registeredSchool: r.registeredSchool || '',
            remark: r.remark || '',
            employmentApprovalStatus: r.employmentApprovalStatus || '',
            className: classInfo.className, // 添加班级名称
          }))
          
          allData.push(...mapped)
        } catch (error) {
          console.error(`[全部班级] 加载 ${classInfo.className} 班数据异常:`, error)
        }
      }
      
      // 按班级名称和序号排序
      allData.sort((a, b) => {
        if (a.className !== b.className) {
          return (a.className || '').localeCompare(b.className || '')
        }
        return (a.serialNumber || 0) - (b.serialNumber || 0)
      })
      
      setDataSource(allData.length > 0 ? allData : [])
      message.success(`已加载 ${availableClasses.length} 个班级的档案数据，共 ${allData.length} 条记录`)
    } catch (error) {
      console.error('加载全部班级数据失败:', error)
      message.error('加载全部班级数据失败')
      setDataSource([])
    }
  }, [availableClasses])

  // 保存数据（到后端）
  const saveData = async (
    data: ClassFileRecordRow[],
    className: string,
    campus: string,
    options?: { silent?: boolean; refreshFromServer?: boolean }
  ) => {
    try {
      const rows = data
        .filter((d) => (d.name && d.name.trim()) || (d.idCard && d.idCard.trim()))
        .map((d) => ({
          serialNumber: d.serialNumber,
          name: d.name,
          gender: d.gender,
          idCard: d.idCard,
          enrollmentDate: d.enrollmentDate || null,
          enrollmentAge: d.enrollmentAge,
          education: d.education,
          graduationDate: d.graduationDate || null,
          graduationAge: d.graduationAge,
          highestEducationAndType: d.highestEducationAndType,
          campusSource: d.campusSource,
          enrollmentCampus: d.enrollmentCampus,
          consultant: d.consultant,
          reportedMajor: d.reportedMajor,
          schoolingLength: d.schoolingLength,
          openingDate: d.openingDate || null,
          tuitionAmount: d.tuitionAmount,
          headTeacher: d.headTeacher,
          formerHeadTeachers: d.formerHeadTeachers || [],
          studentStatus: d.studentStatus,
          previousMajor: d.previousMajor,
          graduateSchool: d.graduateSchool,
          phone: d.phone,
          parentPhone: d.parentPhone,
          address: d.address,
          householdType: d.householdType,
          studyMode: d.studyMode,
          currentAddress: d.currentAddress,
          promisedRegisterEducation: d.promisedRegisterEducation,
          promisedEducationNature: d.promisedEducationNature,
          promisedEducationLevel: d.promisedEducationLevel,
          educationSchoolName: d.educationSchoolName,
          registeredSecondaryOrCollege: d.registeredSecondaryOrCollege,
          registeredSchool: d.registeredSchool,
          remark: d.remark,
          employmentApprovalStatus: d.employmentApprovalStatus,
        }))
      
      // 允许发送空数组到后端，以支持删除所有记录
      
      const payload = {
        神殿名称: normalizeCampus(campus),
        班级名称: className,
        行列表: rows,
      }
      
      const res = await fetch(buildApiUrl('/teaching-quality/class-file'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('保存失败')

      const silent = options?.silent === true
      const refreshFromServer = options?.refreshFromServer === true

      if (refreshFromServer) {
        const result = await res.json()
        const savedRows = (result?.行列表 || []) as any[]
        const mapped: ClassFileRecordRow[] = savedRows.map((r: any, idx: number) => ({
          key: String(r.serialNumber ?? idx + 1),
          serialNumber: Number(r.serialNumber ?? idx + 1),
          name: r.name || '',
          gender: r.gender || '',
          idCard: r.idCard || '',
          enrollmentDate: r.enrollmentDate || '',
          enrollmentAge: r.enrollmentAge || '',
          education: r.education || '',
          graduationDate: r.graduationDate || '',
          graduationAge: r.graduationAge || '',
          highestEducationAndType: r.highestEducationAndType || '',
          campusSource: r.campusSource || '',
          enrollmentCampus: r.enrollmentCampus || '',
          consultant: r.consultant || '',
          reportedMajor: r.reportedMajor || '',
          schoolingLength: r.schoolingLength || '',
          openingDate: r.openingDate || '',
          tuitionAmount: r.tuitionAmount || '',
          headTeacher: r.headTeacher || '',
          formerHeadTeachers: r.formerHeadTeachers || [],
          studentStatus: r.studentStatus || '',
          previousMajor: r.previousMajor || '',
          graduateSchool: r.graduateSchool || '',
          phone: r.phone || '',
          parentPhone: r.parentPhone || '',
          address: r.address || '',
          householdType: r.householdType || '',
          studyMode: r.studyMode || '',
          currentAddress: r.currentAddress || '',
          promisedRegisterEducation: r.promisedRegisterEducation || '',
          promisedEducationNature: r.promisedEducationNature || '',
          promisedEducationLevel: r.promisedEducationLevel || '',
          educationSchoolName: r.educationSchoolName || '',
          registeredSecondaryOrCollege: r.registeredSecondaryOrCollege || '',
          registeredSchool: r.registeredSchool || '',
          remark: r.remark || '',
          employmentApprovalStatus: r.employmentApprovalStatus || '',
        }))
        setDataSource(mapped.length ? mapped : [])
      }

      if (!silent) {
        message.success('已保存班级档案')
      }
    } catch (error) {
      console.error('保存数据失败:', error)
      message.error('保存数据失败')
    }
  }

  // 从 URL 参数读取班级信息
  useEffect(() => {
    const classParam = searchParams.get('class')
    const campusParam = searchParams.get('campus')
    if (classParam && campusParam) {
      const className = decodeURIComponent(classParam)
      const campus = decodeURIComponent(campusParam)
      setSelectedClass(className)
      setSelectedCampus(campus)
      
      if (className === ALL_CLASSES_VALUE) {
        loadAllClassesData(campus)
      } else {
        loadData(className, campus)
      }
    }
  }, [searchParams, loadData, loadAllClassesData])

  // 加载当前神殿的班级列表（从配置中心获取）
  useEffect(() => {
    const loadAvailableClasses = async () => {
      try {
        const norm = (s: string) => (s || '').replace(/神殿$/, '').trim()
        const rawCampus = (currentCampus || selectedCampus || '').trim()
        const currentCampusNormalized = norm(rawCampus)
        
        // 优先从配置中心获取班级列表（同时尝试完整名称和去掉"神殿"后的名称）
        let configClasses = await fetchClasses({ campus_name: rawCampus, active: true })
        console.log('[班级档案] 从配置中心获取班级列表 (完整名称):', configClasses)
        
        // 如果用完整名称没找到，尝试用标准化后的名称
        if (!configClasses || configClasses.length === 0) {
          configClasses = await fetchClasses({ campus_name: currentCampusNormalized, active: true })
          console.log('[班级档案] 从配置中心获取班级列表 (标准化名称):', configClasses)
        }
        
        if (configClasses && configClasses.length > 0) {
          const campusClasses = configClasses.map((cls: ClassProfile) => ({
            className: cls.class_name,
            campus: norm(cls.campus_name),
          }))
          const uniqueClasses = Array.from(new Map(campusClasses.map((c) => [c.className, c])).values())
          setAvailableClasses(uniqueClasses)
          setClassProfiles(configClasses)
        } else {
          // 如果配置中心没有数据，回退到原有的 teaching-quality 接口
          console.log('[班级档案] 配置中心无数据，回退到 teaching-quality 接口')
          const res = await fetch(buildApiUrl('/teaching-quality/class-list'))
          if (!res.ok) throw new Error('加载班级列表失败')
          const list = (await res.json()) as Array<{ 班级名称: string; 神殿: string }>

          const campusClasses = list
            .filter((it) => norm(it.神殿) === currentCampusNormalized)
            .map((it) => ({ className: it.班级名称, campus: norm(it.神殿) }))
          const uniqueClasses = Array.from(new Map(campusClasses.map((c) => [c.className, c])).values())
          setAvailableClasses(uniqueClasses)
        }
      } catch (error) {
        console.error('加载班级列表失败:', error)
        setAvailableClasses([])
      }
    }

    loadAvailableClasses()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCampus, selectedCampus])

  // 加载班主任列表
  useEffect(() => {
    const loadHomeroomTeachers = async () => {
      try {
        const teachers = await fetchHomeroomTeachers({ active: true })
        const teacherNames = teachers.map((t: any) => t.name).filter((name: string) => name)
        setHomeroomTeachers(teacherNames)
      } catch (error) {
        console.error('加载班主任列表失败:', error)
      }
    }
    loadHomeroomTeachers()
  }, [])

  // 监听全局神殿选择器变化
  useEffect(() => {
    const globalCampus = normalizeCampus(currentCampus)
    const currentSelectedCampus = normalizeCampus(selectedCampus)

    if (!globalCampus) return

    if (globalCampus !== currentSelectedCampus) {
      // 更新当前选中的神殿
      setSelectedCampus(globalCampus)

      if (selectedClass) {
        // 如果已选择班级，刷新数据并更新 URL
        setSearchParams({ class: selectedClass, campus: globalCampus })
        if (selectedClass === ALL_CLASSES_VALUE) {
          loadAllClassesData(globalCampus)
          message.info(`已切换到${globalCampus}神殿，正在加载全部班级数据`)
        } else {
          loadData(selectedClass, globalCampus)
          message.info(`已切换到${globalCampus}神殿，正在加载${selectedClass}班数据`)
        }
      } else {
        // 否则清空 URL 参数
        setSearchParams({})
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCampus, selectedClass, selectedCampus])

  // 删除数据
  const handleDelete = useCallback((key: string) => {
    setDataSource((prev) => {
      const newData = prev.filter((item) => item.key !== key)
      // 重新计算序号
      const reorderedData = newData.map((item, index) => ({
        ...item,
        serialNumber: index + 1,
      }))
      return reorderedData
    })
    message.success('删除成功')
  }, [])

  const handleChange = useCallback((key: string, field: keyof ClassFileRecordRow, value: string) => {
    setDataSource((prevData) => {
      // 找到需要更新的行的索引
      const targetIndex = prevData.findIndex(item => item.key === key)
      if (targetIndex === -1) return prevData
      
      const targetItem = prevData[targetIndex]
      
      // 如果值没有变化，直接返回原数据，避免不必要的更新
      if (targetItem[field] === value) return prevData
      
      const updatedItem = { ...targetItem, [field]: value }
      
      // 自动计算入学年龄：当身份证号或入学时间改变时
      if (field === 'idCard' || field === 'enrollmentDate') {
        const idCard = field === 'idCard' ? value : targetItem.idCard
        const enrollmentDate = field === 'enrollmentDate' ? value : targetItem.enrollmentDate
        
        if (idCard && enrollmentDate) {
          const birthDate = extractBirthDateFromIdCard(idCard)
          if (birthDate) {
            updatedItem.enrollmentAge = calculateAge(birthDate, enrollmentDate)
          }
        }
      }
      
      // 自动计算毕业年龄：当身份证号或毕业时间改变时
      if (field === 'idCard' || field === 'graduationDate') {
        const idCard = field === 'idCard' ? value : targetItem.idCard
        const graduationDate = field === 'graduationDate' ? value : targetItem.graduationDate
        
        if (idCard && graduationDate) {
          const birthDate = extractBirthDateFromIdCard(idCard)
          if (birthDate) {
            updatedItem.graduationAge = calculateAge(birthDate, graduationDate)
          }
        }
      }
      
      // 使用数组切片代替 map，性能更好
      const newData = [
        ...prevData.slice(0, targetIndex),
        updatedItem,
        ...prevData.slice(targetIndex + 1)
      ]
      
      // 防抖自动保存：每次修改后延迟5秒保存（增加延迟时间，减少保存频率）
      if (autoSaveTimerRef.current != null) {
        window.clearTimeout(autoSaveTimerRef.current)
      }
      if (selectedClass && selectedCampus && selectedClass !== ALL_CLASSES_VALUE) {
        autoSaveTimerRef.current = window.setTimeout(() => {
          saveData(newData, selectedClass, selectedCampus, { silent: true, refreshFromServer: false })
        }, 5000) // 从 3000ms 增加到 5000ms
      }
      
      return newData
    })
  }, [selectedClass, selectedCampus])

  // 获取指定神殿的专业列表
  const getMajorsForCampus = useCallback(async (campusName: string) => {
    if (!campusName) return []
    
    // 如果已经加载过该神殿的专业，直接返回
    if (majorsByCampus[campusName]) {
      return majorsByCampus[campusName]
    }
    
    try {
      const majors = await fetchMajors({ campus_name: campusName, active: true })
      const majorNames = majors.map(m => m.name).filter(Boolean)
      
      // 缓存到状态中
      setMajorsByCampus(prev => ({ ...prev, [campusName]: majorNames }))
      return majorNames
    } catch (error) {
      console.error('加载专业列表失败:', error)
      return []
    }
  }, [majorsByCampus])

  // 获取某一行的专业选项（取招生神殿和神殿来源的专业并集）
  const getMajorOptionsForRow = useCallback((record: ClassFileRecordRow) => {
    const majorsSet = new Set<string>()
    
    // 添加招生神殿的专业
    if (record.enrollmentCampus && majorsByCampus[record.enrollmentCampus]) {
      majorsByCampus[record.enrollmentCampus].forEach(major => majorsSet.add(major))
    }
    
    // 添加神殿来源的专业
    if (record.campusSource && majorsByCampus[record.campusSource]) {
      majorsByCampus[record.campusSource].forEach(major => majorsSet.add(major))
    }
    
    return Array.from(majorsSet)
  }, [majorsByCampus])

  // 当神殿字段变化时，异步加载专业列表
  useEffect(() => {
    const loadMajorsForAllRows = async () => {
      const campusesToLoad = new Set<string>()
      
      dataSource.forEach(row => {
        // 加载招生神殿的专业
        if (row.enrollmentCampus && !majorsByCampus[row.enrollmentCampus]) {
          campusesToLoad.add(row.enrollmentCampus)
        }
        // 加载神殿来源的专业
        if (row.campusSource && !majorsByCampus[row.campusSource]) {
          campusesToLoad.add(row.campusSource)
        }
      })
      
      for (const campus of campusesToLoad) {
        await getMajorsForCampus(campus)
      }
    }
    
    loadMajorsForAllRows()
  }, [dataSource, getMajorsForCampus, majorsByCampus])

  // 打开往任班主任编辑弹窗
  const handleOpenFormerTeacherModal = useCallback((record: ClassFileRecordRow) => {
    setEditingRecord(record)
    setFormerTeacherModalVisible(true)
  }, [])

  // 全部班级视图下的只读 handleChange（不执行任何操作）
  const readOnlyHandleChange = useCallback(() => {
    // 在全部班级视图下，不允许编辑
  }, [])
  
  // 全部班级视图下的只读 handleDelete（不执行任何操作）
  const readOnlyHandleDelete = useCallback(() => {
    // 在全部班级视图下，不允许删除
  }, [])

  const columns: ColumnsType<ClassFileRecordRow> = useMemo(() => {
    const baseColumns = createColumns({
      handleChange: isAllClassesView ? readOnlyHandleChange : handleChange,
      handleDelete: isAllClassesView ? readOnlyHandleDelete : handleDelete,
      getMajorOptionsForRow,
      majorsByCampus,
      getMajorsForCampus,
      handleOpenFormerTeacherModal: isAllClassesView ? () => {} : handleOpenFormerTeacherModal,
      registerCellRef,
      handleKeyDown,
    })
    
    // 如果是全部班级视图，在序号列后添加"班级名称"列
    if (isAllClassesView) {
      return [
        baseColumns[0], // 序号列
        {
          title: '班级名称',
          dataIndex: 'className',
          width: 120,
          align: 'center' as const,
          fixed: 'left' as const,
        },
        ...baseColumns.slice(1), // 其他列
      ]
    }
    
    return baseColumns
  }, [
    isAllClassesView,
    readOnlyHandleChange,
    readOnlyHandleDelete,
    handleChange,
    handleDelete,
    getMajorOptionsForRow,
    majorsByCampus,
    getMajorsForCampus,
    handleOpenFormerTeacherModal,
    registerCellRef,
    handleKeyDown,
  ])

  // 处理班级选择器变化
  const handleClassChange = useCallback((value: string | null) => {
    const finalCampus =
      normalizeCampus(currentCampus) || normalizeCampus(selectedCampus) || selectedCampus
    
    if (!value || value === ALL_CLASSES_VALUE) {
      // 选择"全部班级"
      setSelectedClass(ALL_CLASSES_VALUE)
      setSelectedCampus(finalCampus)
      setSearchParams({ class: ALL_CLASSES_VALUE, campus: finalCampus })
      loadAllClassesData(finalCampus)
    } else {
      // 选择具体班级
      setSelectedClass(value)
      setSelectedCampus(finalCampus)
      setSearchParams({ class: value, campus: finalCampus })
      loadData(value, finalCampus)
    }
  }, [currentCampus, selectedCampus, setSearchParams, loadData, loadAllClassesData])

  // 生成标题
  const getTitle = () => {
    if (isAllClassesView && selectedCampus) {
      return `清美教育（${selectedCampus}神殿）全部班级档案信息表`
    }
    if (selectedClass && selectedCampus) {
      return `清美教育（${selectedCampus}神殿）${selectedClass}班档案信息表`
    }
    return '班级档案信息表'
  }

  // 生成随机身份证号
  const generateIdCard = (): string => {
    const areas = [
      '110',
      '120',
      '130',
      '140',
      '150',
      '210',
      '220',
      '230',
      '310',
      '320',
      '330',
      '340',
      '350',
      '360',
      '370',
      '410',
      '420',
      '430',
      '440',
      '450',
      '460',
      '500',
      '510',
      '520',
      '530',
      '540',
      '610',
      '620',
      '630',
      '640',
      '650',
    ]
    const area = areas[Math.floor(Math.random() * areas.length)]
    const year = Math.floor(Math.random() * 20) + 2000
    const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')
    const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')
    const sequence = Math.floor(Math.random() * 999)
      .toString()
      .padStart(3, '0')
    const checkCode = Math.floor(Math.random() * 10)
    return `${area}${year}${month}${day}${sequence}${checkCode}`
  }

  // 保存往任班主任
  const handleSaveFormerTeachers = (recordKey: string, teachers: FormerHeadTeacher[]) => {
    setDataSource(prev => prev.map(row => {
      if (row.key === recordKey) {
        return { ...row, formerHeadTeachers: teachers }
      }
      return row
    }))
  }

  // 刷新数据
  const handleRefreshData = async () => {
    if (selectedClass && selectedCampus) {
      if (selectedClass === ALL_CLASSES_VALUE) {
        await loadAllClassesData(selectedCampus)
      } else {
        await loadData(selectedClass, selectedCampus)
      }
    }
  }

  // ========== Excel 导入和剪切板粘贴导入功能 ==========
  
  /**
   * 解析 Excel 日期序列号或日期字符串为 YYYY-MM-DD 格式
   */
  const parseDateValue = (value: string | number | null | undefined): string => {
    if (value === null || value === undefined || value === '') return ''
    
    // 如果是数字，可能是 Excel 日期序列号
    if (typeof value === 'number') {
      if (value > 0 && value < 1000000) {
        const excelEpoch = dayjs('1899-12-30')
        const date = excelEpoch.add(value, 'day')
        if (date.isValid()) {
          return date.format('YYYY-MM-DD')
        }
      }
      return ''
    }
    
    // 处理字符串
    const str = String(value).trim()
    if (!str) return ''
    
    // 如果已经是标准格式，直接返回
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str
    
    // 处理 YYYY年MM月DD日 格式
    const match = str.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/)
    if (match) {
      return `${match[1]}-${String(match[2]).padStart(2, '0')}-${String(match[3]).padStart(2, '0')}`
    }
    
    // 处理 YYYY/MM/DD 格式
    const slashMatch = str.match(/(\d{4})\/(\d{1,2})\/(\d{1,2})/)
    if (slashMatch) {
      return `${slashMatch[1]}-${String(slashMatch[2]).padStart(2, '0')}-${String(slashMatch[3]).padStart(2, '0')}`
    }
    
    // 使用 dayjs 解析
    const parsed = dayjs(str)
    if (parsed.isValid()) {
      return parsed.format('YYYY-MM-DD')
    }
    
    return ''
  }

  /**
   * 建立列名映射（支持多种可能的列名变体）
   */
  const buildColumnMap = (headerRow: any[]): Record<string, number> => {
    const map: Record<string, number> = {}

    // 统一表头：去空格（含全角）、去冒号等，避免表头写法差异导致错匹配
    const normalizeHeader = (s: any) =>
      String(s ?? '')
        .replace(/[\s\u3000]/g, '')
        .replace(/[：:]/g, '')
        .trim()

    // 定义列名映射规则（支持多种可能的列名）
    const columnRules: Array<{ field: keyof ClassFileRecordRow; keywords: string[] }> = [
      { field: 'name', keywords: ['姓名', '名字', '学员姓名', '学生姓名'] },
      { field: 'gender', keywords: ['性别', '学员性别'] },
      { field: 'idCard', keywords: ['身份证号', '身份证', '身份证号码'] },
      { field: 'enrollmentDate', keywords: ['入学时间', '入学日期', '入校时间'] },
      { field: 'enrollmentAge', keywords: ['入学年龄'] },
      { field: 'education', keywords: ['学历', '文化程度'] },
      { field: 'graduationDate', keywords: ['毕业时间', '毕业日期'] },
      { field: 'graduationAge', keywords: ['毕业年龄'] },
      { field: 'highestEducationAndType', keywords: ['最高学历及性质', '毕业所获最高学历证书及性质', '最高学历'] },
      { field: 'campusSource', keywords: ['神殿来源', '来源神殿'] },
      { field: 'enrollmentCampus', keywords: ['招生神殿', '录取神殿'] },
      { field: 'consultant', keywords: ['咨询师', '招生咨询师'] },
      { field: 'reportedMajor', keywords: ['所报专业', '专业', '报名专业'] },
      { field: 'schoolingLength', keywords: ['学制', '学习年限'] },
      { field: 'openingDate', keywords: ['开班时间', '开班日期', '开课时间'] },
      { field: 'tuitionAmount', keywords: ['应收学费金额', '学费', '学费金额'] },
      { field: 'headTeacher', keywords: ['班主任姓名', '班主任', '现任班主任'] },
      { field: 'studentStatus', keywords: ['学员状态', '状态', '学生状态'] },
      { field: 'previousMajor', keywords: ['过往专业', '之前专业'] },
      { field: 'graduateSchool', keywords: ['毕业学校', '毕业院校'] },
      { field: 'phone', keywords: ['联系电话', '电话', '手机号', '手机'] },
      { field: 'parentPhone', keywords: ['家长电话', '家长联系电话', '监护人电话'] },
      { field: 'address', keywords: ['通信地址', '地址', '联系地址'] },
      { field: 'householdType', keywords: ['户口性质', '户籍性质'] },
      { field: 'studyMode', keywords: ['就读方式', '学习方式'] },
      { field: 'currentAddress', keywords: ['现住址', '现居住地址'] },
      { field: 'promisedRegisterEducation', keywords: ['是否承诺注册学历', '承诺注册学历'] },
      { field: 'promisedEducationNature', keywords: ['承诺注册学历性质', '学历性质'] },
      { field: 'promisedEducationLevel', keywords: ['承诺注册学历级别', '学历级别'] },
      { field: 'educationSchoolName', keywords: ['学历学校名称', '学历学校'] },
      { field: 'registeredSecondaryOrCollege', keywords: ['是否已注册中专或大专', '注册情况'] },
      { field: 'registeredSchool', keywords: ['所注册学校', '注册学校'] },
      { field: 'remark', keywords: ['备注', '说明'] },
      { field: 'employmentApprovalStatus', keywords: ['审批无需就业', '无需就业'] },
    ]
    
    // 先做一次“精确匹配”（去空格/冒号后的完全相等），再做“包含匹配”
    const exactMatch = (cell: string, keyword: string) => cell === keyword
    const containsMatch = (cell: string, keyword: string) =>
      cell.includes(keyword) || keyword.includes(cell)

    // 记录每个字段的匹配得分，选择最优命中
    const bestScoreByField: Record<string, number> = {}

    // 遍历表头行，建立映射
    for (let i = 0; i < headerRow.length; i++) {
      const cellValue = normalizeHeader(headerRow[i])
      if (!cellValue) continue

      // 查找匹配的列规则
      for (const rule of columnRules) {
        for (const keyword of rule.keywords) {
          const normalizedKeyword = normalizeHeader(keyword)
          if (!normalizedKeyword) continue

          let score = -1
          if (exactMatch(cellValue, normalizedKeyword)) {
            // 精确匹配优先；关键词越长，越具体
            score = 1000 + normalizedKeyword.length
          } else if (containsMatch(cellValue, normalizedKeyword)) {
            // 包含匹配次之；关键词越长越具体
            score = 100 + normalizedKeyword.length
          }

          if (score < 0) continue

          const prevScore = bestScoreByField[rule.field as string]
          if (prevScore === undefined || score > prevScore) {
            bestScoreByField[rule.field as string] = score
            map[rule.field] = i
          }
        }
      }
    }

    return map
  }

  /**
   * 解析 Excel 数据为 ClassFileRecordRow 数组
   */
  const parseExcelData = (data: any[][]): ClassFileRecordRow[] => {
    if (data.length < 2) {
      throw new Error('Excel 数据行数不足，请确保包含表头和数据行')
    }

    // 在前10行中查找表头行
    let headerRowIndex = -1
    let columnMap: Record<string, number> = {}
    
    for (let i = 0; i < Math.min(10, data.length); i++) {
      const row = data[i]
      if (!row || row.length === 0) continue
      
      const map = buildColumnMap(row)
      // 如果找到了关键列（如姓名、身份证号），认为是表头行
      if (map.name !== undefined || map.idCard !== undefined) {
        headerRowIndex = i
        columnMap = map
        break
      }
    }

    if (headerRowIndex < 0) {
      throw new Error('无法找到表头行，请确保 Excel 包含"姓名"或"身份证号"等列')
    }

    // 诊断：打印本次识别到的表头映射（用于排查“班主任姓名”列命中错误）
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.log('[班级档案][导入] headerRowIndex=', headerRowIndex, 'columnMap=', columnMap)

      if (columnMap.headTeacher === undefined) {
        // eslint-disable-next-line no-console
        console.warn('[班级档案][导入] 未识别到“班主任姓名”列(headTeacher)，将导致班主任为空')
      }
      if (columnMap.headTeacher !== undefined && columnMap.name !== undefined && columnMap.headTeacher === columnMap.name) {
        // eslint-disable-next-line no-console
        console.warn('[班级档案][导入] “班主任姓名”列(headTeacher) 与 “姓名”列(name) 命中了同一列，请检查 Excel 表头')
      }
    }

    // 解析数据行
    const records: ClassFileRecordRow[] = []
    const dataStartRow = headerRowIndex + 1

    for (let i = dataStartRow; i < data.length; i++) {
      const row = data[i]
      if (!row || row.length === 0) continue

      // 跳过空行
      const hasData = row.some((cell) => cell !== null && cell !== undefined && String(cell).trim() !== '')
      if (!hasData) continue

      // 提取各字段
      const getValue = (field: keyof ClassFileRecordRow): string => {
        const colIndex = columnMap[field]
        if (colIndex === undefined) return ''
        const value = row[colIndex]
        return value !== null && value !== undefined ? String(value).trim() : ''
      }

      const name = getValue('name')
      const idCard = getValue('idCard')

      // 如果姓名和身份证号都为空，跳过
      if (!name && !idCard) continue

      // 自动计算入学年龄和毕业年龄
      let enrollmentAge = getValue('enrollmentAge')
      let graduationAge = getValue('graduationAge')
      const enrollmentDateCol = columnMap.enrollmentDate !== undefined ? row[columnMap.enrollmentDate] : undefined
      const graduationDateCol = columnMap.graduationDate !== undefined ? row[columnMap.graduationDate] : undefined
      const enrollmentDate = parseDateValue(enrollmentDateCol)
      const graduationDate = parseDateValue(graduationDateCol)
      const idCardValue = getValue('idCard')

      if (idCardValue && (enrollmentDate || graduationDate)) {
        const birthDate = extractBirthDateFromIdCard(idCardValue)
        if (birthDate) {
          if (enrollmentDate && !enrollmentAge) {
            enrollmentAge = calculateAge(birthDate, enrollmentDate)
          }
          if (graduationDate && !graduationAge) {
            graduationAge = calculateAge(birthDate, graduationDate)
          }
        }
      }

      const record: ClassFileRecordRow = {
        key: `imported-${i}-${Date.now()}`,
        serialNumber: records.length + 1,
        name: name || '',
        gender: getValue('gender') || '',
        idCard: idCardValue || '',
        enrollmentDate: enrollmentDate || '',
        enrollmentAge: enrollmentAge || '',
        education: getValue('education') || '',
        graduationDate: graduationDate || '',
        graduationAge: graduationAge || '',
        highestEducationAndType: getValue('highestEducationAndType') || '',
        campusSource: getValue('campusSource') || '',
        enrollmentCampus: getValue('enrollmentCampus') || '',
        consultant: getValue('consultant') || '',
        reportedMajor: getValue('reportedMajor') || '',
        schoolingLength: getValue('schoolingLength') || currentClassDefaults.schoolingLength,
        openingDate: (columnMap.openingDate !== undefined ? parseDateValue(row[columnMap.openingDate]) : '') || currentClassDefaults.openingDate,
        tuitionAmount: getValue('tuitionAmount') || '',
        headTeacher: getValue('headTeacher') || '',
        formerHeadTeachers: [], // 往任班主任暂不支持导入
        studentStatus: getValue('studentStatus') || '在读',
        previousMajor: getValue('previousMajor') || '',
        graduateSchool: getValue('graduateSchool') || '',
        phone: getValue('phone') || '',
        parentPhone: getValue('parentPhone') || '',
        address: getValue('address') || '',
        householdType: getValue('householdType') || '',
        studyMode: getValue('studyMode') || '',
        currentAddress: getValue('currentAddress') || '',
        promisedRegisterEducation: getValue('promisedRegisterEducation') || '',
        promisedEducationNature: getValue('promisedEducationNature') || '',
        promisedEducationLevel: getValue('promisedEducationLevel') || '',
        educationSchoolName: getValue('educationSchoolName') || '',
        registeredSecondaryOrCollege: getValue('registeredSecondaryOrCollege') || '',
        registeredSchool: getValue('registeredSchool') || '',
        remark: getValue('remark') || '',
        employmentApprovalStatus: getValue('employmentApprovalStatus') || '',
        className: selectedClass === ALL_CLASSES_VALUE ? undefined : selectedClass,
      }

      records.push(record)
    }

    if (records.length === 0) {
      throw new Error('未能解析出有效的学生记录，请确保数据包含"姓名"或"身份证号"字段')
    }

    return records
  }

  /**
   * 处理 Excel 文件上传
   */
  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (isAllClassesView) {
      message.warning('全部班级视图下无法导入，请选择具体班级')
      return
    }

    if (!selectedClass || !selectedCampus || selectedClass === ALL_CLASSES_VALUE) {
      message.warning('请先选择班级和神殿')
      return
    }

    try {
      setImportLoading(true)
      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: 'array' })

      // 读取第一个 Sheet
      const firstSheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[firstSheetName]
      const data = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: '' })

      const records = parseExcelData(data)

      if (records.length === 0) {
        message.warning('未能从 Excel 中解析出有效的学生记录')
        return
      }

      // 追加到现有数据（保留原有数据）
      const maxSerial = Math.max(...dataSource.map(d => d.serialNumber || 0), 0)
      const newRecords = records.map((record, index) => ({
        ...record,
        serialNumber: maxSerial + index + 1,
        key: `imported-${Date.now()}-${index}`,
        openingDate: record.openingDate || currentClassDefaults.openingDate,
        schoolingLength: record.schoolingLength || currentClassDefaults.schoolingLength,
        className: selectedClass,
      }))

      // 合并到现有数据（如果身份证号相同，则更新；否则追加）
      const existingIds = new Set(dataSource.map(d => d.idCard).filter(Boolean))
      const updatedRecords: ClassFileRecordRow[] = []
      const appendedRecords: ClassFileRecordRow[] = []

      for (const newRecord of newRecords) {
        if (newRecord.idCard && existingIds.has(newRecord.idCard)) {
          // 更新现有记录（保留 key 和 serialNumber）
          const existingIndex = dataSource.findIndex(d => d.idCard === newRecord.idCard)
          if (existingIndex >= 0) {
            const existing = dataSource[existingIndex]
            updatedRecords.push({
              ...newRecord,
              key: existing.key,
              serialNumber: existing.serialNumber,
            })
          }
        } else {
          appendedRecords.push(newRecord)
        }
      }

      // 合并数据：更新现有记录，追加新记录
      const finalData = dataSource.map(record => {
        const updated = updatedRecords.find(r => r.key === record.key)
        return updated || record
      }).concat(appendedRecords)

      // 重新排序并重新编号
      finalData.sort((a, b) => (a.serialNumber || 0) - (b.serialNumber || 0))
      finalData.forEach((record, index) => {
        record.serialNumber = index + 1
      })

      setDataSource(finalData)
      message.success(`成功导入 ${newRecords.length} 条记录（更新 ${updatedRecords.length} 条，新增 ${appendedRecords.length} 条）`)

      // 重置文件输入
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error: any) {
      console.error('[Excel导入] 解析失败:', error)
      message.error(`Excel 导入失败：${error.message || '数据格式不正确'}`)
    } finally {
      setImportLoading(false)
    }
  }

  /**
   * 处理剪切板粘贴导入（支持从 Excel 复制的数据）
   * 使用 Modal 让用户粘贴数据
   */
  const [pasteModalVisible, setPasteModalVisible] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const pasteTextAreaRef = useRef<any>(null)

  const handlePasteImport = () => {
    if (isAllClassesView) {
      message.warning('全部班级视图下无法导入，请选择具体班级')
      return
    }

    if (!selectedClass || !selectedCampus || selectedClass === ALL_CLASSES_VALUE) {
      message.warning('请先选择班级和神殿')
      return
    }

    setPasteText('')
    setPasteModalVisible(true)
    
    // 聚焦到文本域，方便用户直接粘贴
    setTimeout(() => {
      pasteTextAreaRef.current?.focus()
    }, 100)
  }

  /**
   * 处理粘贴数据导入
   */
  const handlePasteDataImport = async () => {
    if (!pasteText || !pasteText.trim()) {
      message.warning('请先粘贴数据')
      return
    }

    try {
      setImportLoading(true)
      setPasteModalVisible(false)

      // 将粘贴文本转换为二维数组（按行和列分割）
      const lines = pasteText.split(/\r?\n/).filter(line => line.trim())
      if (lines.length < 2) {
        throw new Error('粘贴数据行数不足，请确保包含表头和数据行')
      }

      // 解析为二维数组（制表符分隔，Excel 复制时默认使用制表符）
      const data: any[][] = lines.map(line => {
        // 优先使用制表符分隔（Excel 复制时使用）
        if (line.includes('\t')) {
          return line.split('\t').map(cell => cell.trim())
        }
        // 如果没有制表符，尝试多个空格分隔
        else if (/\s{2,}/.test(line)) {
          return line.split(/\s{2,}/).map(cell => cell.trim())
        }
        // 单个空格分隔（作为最后选择）
        else {
          return line.split(/\s+/).map(cell => cell.trim())
        }
      })

      const records = parseExcelData(data)

      if (records.length === 0) {
        message.warning('未能从剪贴板中解析出有效的学生记录')
        return
      }

      // 追加到现有数据（与 Excel 导入逻辑相同）
      const maxSerial = Math.max(...dataSource.map(d => d.serialNumber || 0), 0)
      const newRecords = records.map((record, index) => ({
        ...record,
        serialNumber: maxSerial + index + 1,
        key: `pasted-${Date.now()}-${index}`,
        openingDate: record.openingDate || currentClassDefaults.openingDate,
        schoolingLength: record.schoolingLength || currentClassDefaults.schoolingLength,
        className: selectedClass,
      }))

      const existingIds = new Set(dataSource.map(d => d.idCard).filter(Boolean))
      const updatedRecords: ClassFileRecordRow[] = []
      const appendedRecords: ClassFileRecordRow[] = []

      for (const newRecord of newRecords) {
        if (newRecord.idCard && existingIds.has(newRecord.idCard)) {
          const existingIndex = dataSource.findIndex(d => d.idCard === newRecord.idCard)
          if (existingIndex >= 0) {
            const existing = dataSource[existingIndex]
            updatedRecords.push({
              ...newRecord,
              key: existing.key,
              serialNumber: existing.serialNumber,
            })
          }
        } else {
          appendedRecords.push(newRecord)
        }
      }

      const finalData = dataSource.map(record => {
        const updated = updatedRecords.find(r => r.key === record.key)
        return updated || record
      }).concat(appendedRecords)

      finalData.sort((a, b) => (a.serialNumber || 0) - (b.serialNumber || 0))
      finalData.forEach((record, index) => {
        record.serialNumber = index + 1
      })

      setDataSource(finalData)
      message.success(`成功从剪贴板导入 ${newRecords.length} 条记录（更新 ${updatedRecords.length} 条，新增 ${appendedRecords.length} 条）`)
    } catch (error: any) {
      console.error('[剪切板导入] 解析失败:', error)
      message.error(`剪切板导入失败：${error.message || '数据格式不正确'}`)
    } finally {
      setImportLoading(false)
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={
          <Space>
            <span>{getTitle()}</span>
            <Select
              placeholder={availableClasses.length ? '选择班级' : '当前神殿暂无班级'}
              value={selectedClass || undefined}
              onChange={handleClassChange}
              style={{ width: 220, marginLeft: 16 }}
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={[
                { label: '全部班级', value: ALL_CLASSES_VALUE },
                ...availableClasses.map((cls) => ({
                  label: cls.className,
                  value: cls.className,
                }))
              ]}
              disabled={availableClasses.length === 0}
              allowClear
            />
          </Space>
        }
        extra={
          <Space>
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'excel',
                    label: '从 Excel 文件导入',
                    icon: <FileExcelOutlined />,
                    onClick: () => fileInputRef.current?.click(),
                  },
                  {
                    key: 'clipboard',
                    label: '从剪贴板粘贴导入',
                    icon: <CopyOutlined />,
                    onClick: handlePasteImport,
                  },
                ],
              }}
              disabled={isAllClassesView || importLoading}
            >
              <Button icon={<FileExcelOutlined />} loading={importLoading}>
                导入 <DownOutlined />
              </Button>
            </Dropdown>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              style={{ display: 'none' }}
              onChange={handleExcelUpload}
            />
            <Button
              onClick={() => setTransferModalVisible(true)}
              disabled={!selectedClass || !selectedCampus || isAllClassesView}
            >
              转班
            </Button>
            <Button
              onClick={() => {
                if (isAllClassesView) {
                  message.warning('全部班级视图下无法新增，请选择具体班级')
                  return
                }
                const maxSerial = Math.max(...dataSource.map(d => d.serialNumber || 0), 0)
                const newRow = {
                  ...createEmptyRow(maxSerial + 1),
                  openingDate: currentClassDefaults.openingDate,
                  schoolingLength: currentClassDefaults.schoolingLength
                }
                const newData = [...dataSource, newRow]
                setDataSource(newData)
              }}
              disabled={isAllClassesView}
            >
              新增一行
            </Button>
            <Button
              type="primary"
              onClick={async () => {
                if (isAllClassesView) {
                  message.warning('全部班级视图下无法保存，请选择具体班级进行编辑')
                  return
                }
                if (!selectedClass || !selectedCampus || selectedClass === ALL_CLASSES_VALUE) {
                  message.warning('请先选择班级和神殿')
                  return
                }
                startTransition(async () => {
                  await saveData(dataSource, selectedClass, selectedCampus, { silent: false, refreshFromServer: true })
                })
              }}
              disabled={isAllClassesView}
            >
              保存
            </Button>
          </Space>
        }
      >
        {/* 信息概览 */}
        {selectedClass && (
          <div style={{ marginBottom: 16, padding: '12px 16px', background: '#f5f5f5', borderRadius: 4 }}>
            <Space size="large" wrap>
              <span>
                <strong>档案人数：</strong>
                {dataSource.filter(d => d.name && d.name.trim()).length}
              </span>
              <span>
                <strong>在读人数：</strong>
                {dataSource.filter(d => d.name && d.name.trim() && d.studentStatus === '在读').length}
              </span>
              <span>
                <strong>休学人数：</strong>
                {dataSource.filter(d => d.name && d.name.trim() && d.studentStatus === '休学').length}
              </span>
              <span>
                <strong>复学人数：</strong>
                {dataSource.filter(d => d.name && d.name.trim() && d.studentStatus === '复学').length}
              </span>
              <span>
                <strong>退学人数：</strong>
                {dataSource.filter(d => d.name && d.name.trim() && d.studentStatus === '退学').length}
              </span>
              <span>
                <strong>退费人数：</strong>
                {dataSource.filter(d => d.name && d.name.trim() && d.studentStatus === '退费').length}
              </span>
              <span>
                <strong>长期请假：</strong>
                {dataSource.filter(d => d.name && d.name.trim() && d.studentStatus === '长期请假').length}
              </span>
              <span>
                <strong>长期不上课：</strong>
                {dataSource.filter(d => d.name && d.name.trim() && d.studentStatus === '长期不上课').length}
              </span>
              <span>
                <strong>寒暑假：</strong>
                {dataSource.filter(d => d.name && d.name.trim() && d.studentStatus === '寒暑假').length}
              </span>
              <span>
                <strong>其他：</strong>
                {dataSource.filter(d => d.name && d.name.trim() && d.studentStatus === '其他').length}
              </span>
            </Space>
          </div>
        )}
        
        <Table<ClassFileRecordRow>
          bordered
          size="small"
          columns={columns}
          dataSource={dataSource}
          pagination={false}
          rowKey="key"
          scroll={{ x: 'max-content', y: 'calc(100vh - 400px)' }}
          sticky={{ offsetHeader: 0 }}
        />
      </Card>
      
      {/* 学员状态列表（使用统一组件） */}
      <StudentStatusLists
        dataSource={dataSource}
        selectedClass={selectedClass}
      />
    
      
      {/* 转班 Modal */}
      <TransferModal
        visible={transferModalVisible}
        onClose={() => setTransferModalVisible(false)}
        selectedClass={selectedClass}
        selectedCampus={selectedCampus}
        dataSource={dataSource}
        classProfiles={classProfiles}
        onSuccess={handleRefreshData}
      />

      {/* 往任班主任编辑 Modal */}
      <FormerTeacherModal
        visible={formerTeacherModalVisible}
        onClose={() => setFormerTeacherModalVisible(false)}
        record={editingRecord}
        homeroomTeachers={homeroomTeachers}
        onSave={handleSaveFormerTeachers}
      />

      {/* 剪切板粘贴导入 Modal */}
      <Modal
        title="从剪贴板粘贴导入"
        open={pasteModalVisible}
        onOk={handlePasteDataImport}
        onCancel={() => {
          setPasteModalVisible(false)
          setPasteText('')
        }}
        okText="导入"
        cancelText="取消"
        width={800}
        okButtonProps={{ loading: importLoading }}
      >
        <div style={{ marginBottom: 16 }}>
          <p>请将 Excel 中的数据复制后粘贴到下面的文本框中（包含表头）：</p>
          <p style={{ color: '#999', fontSize: 12 }}>
            提示：在 Excel 中选择数据区域后按 Ctrl+C 复制，然后在此处按 Ctrl+V 粘贴
          </p>
        </div>
        <Input.TextArea
          ref={pasteTextAreaRef}
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
          placeholder="请粘贴 Excel 数据（包含表头行）...&#10;例如：&#10;姓名	性别	身份证号	入学时间	...&#10;张三	男	130123199001011234	2024-01-01	..."
          rows={15}
          style={{ fontFamily: 'monospace', fontSize: 12 }}
        />
      </Modal>
    </div>
  )
}

export default ClassFileRecordPage
