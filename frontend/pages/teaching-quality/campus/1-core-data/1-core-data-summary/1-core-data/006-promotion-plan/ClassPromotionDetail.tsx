/**
 * 班级升学计划明细组件
 * 包含汇总表和按神殿分组的明细表
 */

import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { App, Card, Table, Button, Space, Typography, Input, Modal, Select, Spin, InputNumber, DatePicker } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { buildApiUrl } from '@/utils/apiBase'
import { 
  ReloadOutlined, 
  DownloadOutlined,
  RiseOutlined,
  TeamOutlined
} from '@ant-design/icons';

const { Title } = Typography;

// 学员候选项
interface StudentCandidate {
  key: string
  name: string
  idCard: string
  enrollmentDate?: string | null
  enrollmentCampus?: string | null  // 招生神殿，用于分配到不同神殿的升学明细表
}


// 汇总记录接口
type CampusNumberMap = { total: number } & Record<string, number>;

interface SummaryRecord {
  key: string;
  serialNumber: number; // 序号
  promotionMonth: string; // 升学月份
  classId: string; // 班级
  studentsOnFile: CampusNumberMap; // 动态神殿
  targetStudents: CampusNumberMap; // 动态神殿
  projectedPromotionRateByCount: number; // 预计升学率(人)
  unitPrice: number; // 单价
  receivable: CampusNumberMap; // 动态神殿
  projectedPromotionAmount: CampusNumberMap; // 动态神殿
  projectedPromotionRateByAmount: number; // 预计升学率(金额)
  actualPromotionCount: number; // 实际升学人数
  actualPromotionAmount: number; // 实际升学金额
  actualPromotionRateByAmount: number; // 实际升学率(金额)
  headTeacher: string; // 班主任
}

// 明细记录接口
interface DetailRecord {
  key: string;
  classId: string; // 班级
  serialNumber: number; // 序号
  name: string; // 姓名
  idCard: string; // 身份证号
  enrollmentDate: string; // 入学时间
  enrollmentAge: string; // 入学年龄
  receivableAmount: number; // 应收
  plannedPaymentAmount: number; // 预计缴费金额
  actualPaymentAmount: number; // 实际缴费金额
  supplementPaymentTime: string; // 补款时间
  supplementPaymentAmount: number; // 补款金额
  actualPaymentDate: string; // 实际缴费时间
  plannedPaymentDate: string; // 计划缴费日期
  campus: string; // 神殿
  headTeacher: string; // 班主任
}

interface ClassPromotionDetailProps {
  classNum: number; // 班级编号（1、2、3）
  hideCampusSelector?: boolean;
  campusFilter?: string[]; // 仅展示这些神殿（可选）
  year?: number | string; // 标题年份
  classId?: string; // 标题班级ID，可编辑
  onClassIdChange?: (val: string) => void; // 标题班级ID变更回调
}

const ClassPromotionDetail: React.FC<ClassPromotionDetailProps> = ({
  classNum,
  hideCampusSelector: _hideCampusSelector = false,
  campusFilter,
  year,
  classId,
  onClassIdChange,
}) => {
  const { message } = App.useApp()
  const [loading, setLoading] = useState(false);
  const [summaryData, setSummaryData] = useState<SummaryRecord[]>([]);
  const [detailData, setDetailData] = useState<DetailRecord[]>([]);
  const [classIdByCampus, setClassIdByCampus] = useState<Record<string, string>>({});
  
  // 升学月份选择器
  const [promotionMonth, setPromotionMonth] = useState<dayjs.Dayjs | null>(dayjs());

  // 汇总表班级选择器
  const [summaryClassId, setSummaryClassId] = useState<string>('')  // 汇总表选择的班级
  const [allClassOptions, setAllClassOptions] = useState<{label: string, value: string, campus: string, headTeacher?: string}[]>([])  // 所有班级选项
  const [classHeadTeacherMap, setClassHeadTeacherMap] = useState<Record<string, string>>({})  // 班级ID -> 班主任映射

  // 学员选择器
  const [pickerVisible, setPickerVisible] = useState(false)
  const [pickerCampus, setPickerCampus] = useState<string>('')  // 目标神殿（点击哪个神殿的"选择学员"按钮）
  const [pickerSourceCampus, setPickerSourceCampus] = useState<string | undefined>(undefined)  // 来源神殿（用于选择班级）
  const [pickerLoading, setPickerLoading] = useState(false)
  const [pickerClass, setPickerClass] = useState<string | undefined>(undefined)
  const [pickerCandidates, setPickerCandidates] = useState<StudentCandidate[]>([])
  const [pickerSelectedKeys, setPickerSelectedKeys] = useState<React.Key[]>([])
  const [classOptions, setClassOptions] = useState<string[]>([])
  const [sourceCampusOptions, setSourceCampusOptions] = useState<string[]>([])  // 来源神殿选项

  // 更新明细某一行的字段值
  const updateDetail = <K extends keyof DetailRecord>(rowKey: string, field: K, value: DetailRecord[K]) => {
    setDetailData((prev) => prev.map(r => r.key === rowKey ? { ...r, [field]: value } : r))
  }

  // 更新汇总表的单价
  const updateSummaryUnitPrice = (newUnitPrice: number) => {
    setSummaryData((prev) => prev.map(s => ({ ...s, unitPrice: newUnitPrice })))
    
    // 同时更新所有明细表的应收金额（基于新单价）
    setDetailData((prev) => prev.map(r => ({
      ...r,
      receivableAmount: newUnitPrice
    })))
  }

  // 初始化空的汇总数据
  const initializeEmptySummary = () => {
    const campuses: string[] = campusFilter || []
    const studentsOnFile: CampusNumberMap = { total: 0 }
    const targetStudents: CampusNumberMap = { total: 0 }
    const receivable: CampusNumberMap = { total: 0 }
    const projectedPromotionAmount: CampusNumberMap = { total: 0 }

    campuses.forEach(c => {
      studentsOnFile[c] = 0
      targetStudents[c] = 0
      receivable[c] = 0
      projectedPromotionAmount[c] = 0
    })

    // 获取当前选择班级的班主任
    const headTeacher = summaryClassId ? (classHeadTeacherMap[summaryClassId] || '') : ''

    const summaryRow: SummaryRecord = {
      key: 'summary-empty',
      serialNumber: 1,
      promotionMonth: promotionMonth ? promotionMonth.format('YYYY年MM月') : '全年',
      classId: '',
      studentsOnFile,
      targetStudents,
      projectedPromotionRateByCount: 0,
      unitPrice: 0,
      receivable,
      projectedPromotionAmount,
      projectedPromotionRateByAmount: 0,
      actualPromotionCount: 0,
      actualPromotionAmount: 0,
      actualPromotionRateByAmount: 0,
      headTeacher: headTeacher,
    }

    setSummaryData([summaryRow])
    setDetailData([])
  }

  useEffect(() => {
    // 确保有神殿数据时才加载
    if (campusFilter && campusFilter.length > 0) {
      loadAllClassOptions();  // 加载所有班级选项
      // 只有在选择了班级后才加载数据，否则初始化空表格
      if (summaryClassId) {
        fetchData();
      } else {
        // 初始化空的汇总数据，确保表格结构显示
        initializeEmptySummary();
      }
    }
  }, [classNum, campusFilter, year, classId, promotionMonth, summaryClassId]);  // 包含 summaryClassId，选择班级后重新加载对应班级的数据

  // 加载所有班级选项（用于汇总表班级选择）
  const loadAllClassOptions = async () => {
    try {
      const url = buildApiUrl('/teaching-quality/class-list')
      const res = await fetch(url)
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      const options: {label: string, value: string, campus: string, headTeacher?: string}[] = []
      const headTeacherMap: Record<string, string> = {}
      
      console.log('班级管理原始数据:', data)
      
      ;(Array.isArray(data) ? data : []).forEach((c: any) => {
        const name = String(c.班级名称 || '')
        let campus = String(c.神殿 || '')
        const headTeacher = String(c.班主任 || '')
        
        // 确保神殿名称包含"神殿"后缀（如果原数据中没有）
        if (campus && !campus.endsWith('神殿')) {
          campus = campus + '神殿'
        }
        
        console.log(`班级 ${name} 的神殿: "${c.神殿}" -> "${campus}"`)
        
        if (name) {
          options.push({
            label: `${name}${campus ? ` (${campus})` : ''}`,
            value: name,
            campus: campus,
            headTeacher: headTeacher
          })
          // 建立班级ID到班主任的映射
          if (headTeacher) {
            headTeacherMap[name] = headTeacher
          }
        }
      })
      
      // 根据 campusFilter 过滤班级选项（只显示对应神殿的班级）
      let filteredOptions = options
      if (Array.isArray(campusFilter) && campusFilter.length > 0) {
        filteredOptions = options.filter(opt => {
          // 检查班级所属神殿是否在 campusFilter 中
          return campusFilter.some(filterCampus => {
            // 标准化神殿名称进行比较
            const normalizedOptCampus = opt.campus.replace(/神殿$/, '').trim()
            const normalizedFilterCampus = filterCampus.replace(/神殿$/, '').trim()
            return opt.campus === filterCampus || 
                   normalizedOptCampus === normalizedFilterCampus ||
                   opt.campus.includes(normalizedFilterCampus) ||
                   filterCampus.includes(normalizedOptCampus)
          })
        })
      }
      
      // 去重并排序
      const uniqueOptions = filteredOptions.filter((opt, idx, arr) => 
        arr.findIndex(o => o.value === opt.value && o.campus === opt.campus) === idx
      ).sort((a, b) => a.value.localeCompare(b.value, 'zh-Hans-CN'))
      setAllClassOptions(uniqueOptions)
      setClassHeadTeacherMap(headTeacherMap)
    } catch (e) {
      console.error(e)
    }
  }

  // 从汇总表打开学员选择器（选择班级后选择学员）
  const openSummaryStudentPicker = async () => {
    if (!summaryClassId) {
      message.warning('请先在汇总表中选择班级')
      return
    }
    // 找到该班级对应的神殿
    const classOption = allClassOptions.find(o => o.value === summaryClassId)
    const classCampus = classOption?.campus || ''
    
    setPickerCampus('')  // 不指定目标神殿，根据招生神殿自动分配
    setPickerVisible(true)
    setPickerSelectedKeys([])
    setPickerCandidates([])
    setPickerClass(summaryClassId)
    setPickerSourceCampus(classCampus)
    
    // 直接加载该班级的学员
    try {
      setPickerLoading(true)
      const campusParam = (classCampus || '').replace(/神殿$/, '').trim() || classCampus
      const res = await fetch(
        buildApiUrl(`/teaching-quality/class-file?campus=${encodeURIComponent(campusParam)}&class=${encodeURIComponent(summaryClassId)}`),
      )
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      const rows: StudentCandidate[] = (data?.行列表 || []).map((r: any, idx: number) => ({
        key: String(r.idCard || idx),
        name: String(r.name || ''),
        idCard: String(r.idCard || ''),
        enrollmentDate: r.enrollmentDate || null,
        enrollmentCampus: r.enrollmentCampus || null,
      })).filter((s: StudentCandidate) => !!s.idCard)
      setPickerCandidates(rows)
    } catch (e) {
      console.error(e)
      message.error('获取学员失败')
    } finally {
      setPickerLoading(false)
    }
    
    // 同时加载神殿选项（用于切换）
    try {
      const url = buildApiUrl('/teaching-quality/class-list')
      const res = await fetch(url)
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      const campuses: string[] = []
      ;(Array.isArray(data) ? data : []).forEach((c: any) => {
        const campus = String(c.神殿 || '')
        if (campus && !campuses.includes(campus)) campuses.push(campus)
      })
      setSourceCampusOptions(campuses.sort((a, b) => a.localeCompare(b, 'zh-Hans-CN')))
      // 加载该神殿的班级列表
      if (classCampus) {
        const campusParam = classCampus.replace(/神殿$/, '').trim() || classCampus
        const classRes = await fetch(buildApiUrl(`/teaching-quality/class-list?campus=${encodeURIComponent(campusParam)}`))
        if (classRes.ok) {
          const classData = await classRes.json()
          const names: string[] = []
          ;(Array.isArray(classData) ? classData : []).forEach((c: any) => {
            const name = String(c.班级名称 || '')
            if (name && !names.includes(name)) names.push(name)
          })
          setClassOptions(names.sort((a, b) => a.localeCompare(b, 'zh-Hans-CN')))
        }
      }
    } catch (e) {
      console.error(e)
    }
  }

  // 打开学员选择器
  const openStudentPicker = async (campusName: string) => {
    setPickerCampus(campusName)
    setPickerVisible(true)
    setPickerSelectedKeys([])
    setPickerCandidates([])
    setPickerClass(undefined)
    setPickerSourceCampus(undefined)
    setClassOptions([])
    
    // 获取所有神殿选项（用于选择来源神殿）
    try {
      const url = buildApiUrl('/teaching-quality/class-list')
      const res = await fetch(url)
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      const campuses: string[] = []
      ;(Array.isArray(data) ? data : []).forEach((c: any) => {
        const campus = String(c.神殿 || '')
        if (campus && !campuses.includes(campus)) campuses.push(campus)
      })
      setSourceCampusOptions(campuses.sort((a, b) => a.localeCompare(b, 'zh-Hans-CN')))
    } catch (e) {
      console.error(e)
      message.error('获取神殿列表失败')
    }
  }

  // 当选择来源神殿时，加载该神殿的班级列表
  const loadClassOptions = async (sourceCampus: string) => {
    setPickerClass(undefined)
    setPickerCandidates([])
    setPickerSelectedKeys([])
    if (!sourceCampus) {
      setClassOptions([])
      return
    }
    try {
      const campusParam = (sourceCampus || '').replace(/神殿$/, '').trim() || sourceCampus
      const url = buildApiUrl(`/teaching-quality/class-list?campus=${encodeURIComponent(campusParam)}`)
      const res = await fetch(url)
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      const names: string[] = []
      ;(Array.isArray(data) ? data : []).forEach((c: any) => {
        const name = String(c.班级名称 || '')
        if (name && !names.includes(name)) names.push(name)
      })
      setClassOptions(names.sort((a, b) => a.localeCompare(b, 'zh-Hans-CN')))
    } catch (e) {
      console.error(e)
      message.error('获取班级失败')
    }
  }

  const loadCandidates = async (klass?: string) => {
    if (!klass || !pickerSourceCampus) {
      setPickerCandidates([])
      return
    }
    try {
      setPickerLoading(true)
      const campusParam = (pickerSourceCampus || '').replace(/神殿$/, '').trim() || pickerSourceCampus
      const res = await fetch(
        buildApiUrl(`/teaching-quality/class-file?campus=${encodeURIComponent(campusParam)}&class=${encodeURIComponent(klass)}`),
      )
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      const rows: StudentCandidate[] = (data?.行列表 || []).map((r: any, idx: number) => ({
        key: String(r.idCard || idx),
        name: String(r.name || ''),
        idCard: String(r.idCard || ''),
        enrollmentDate: r.enrollmentDate || null,
        enrollmentCampus: r.enrollmentCampus || null,  // 招生神殿
      })).filter((s: StudentCandidate) => !!s.idCard)
      setPickerCandidates(rows)
    } catch (e) {
      console.error(e)
      message.error('获取学员失败')
    } finally {
      setPickerLoading(false)
    }
  }

  const handlePickerOk = () => {
    if (pickerSelectedKeys.length === 0) {
      message.warning('请至少选择一个学员')
      return
    }
    // 将选中学员添加到班级明细表（不按招生神殿分组）
    const selected = pickerCandidates.filter((c) => pickerSelectedKeys.includes(c.idCard))
    
    // 确定班级所属神殿（从班级选项中获取）
    const classOption = allClassOptions.find(o => o.value === summaryClassId)
    const classCampus = classOption?.campus || (visibleCampuses.length > 0 ? visibleCampuses[0] : '')
    
    if (!classCampus) {
      message.error('无法确定班级所属神殿')
      return
    }
    
    setDetailData((prev) => {
      const next = [...prev]
      
      // 所有学员都添加到班级所属神殿的明细表中
      const existingCount = next.filter((r) => r.campus === classCampus).length
      let serialNum = existingCount
      
      selected.forEach((stu) => {
        // 检查是否已存在该学员（避免重复添加）
        const exists = next.some(r => r.campus === classCampus && r.idCard === stu.idCard)
        if (!exists) {
          serialNum++
          next.push({
            key: `${classCampus}-${stu.idCard}`,
            classId: summaryClassId || '',
            serialNumber: serialNum,
            name: stu.name,
            idCard: stu.idCard,
            enrollmentDate: stu.enrollmentDate || '',
            enrollmentAge: '',
            receivableAmount: 0,
            plannedPaymentAmount: 0,
            actualPaymentAmount: 0,
            supplementPaymentTime: '',
            supplementPaymentAmount: 0,
            actualPaymentDate: '',
            plannedPaymentDate: '',
            campus: classCampus,  // 使用班级所属神殿，而不是学员的招生神殿
            headTeacher: classOption?.headTeacher || '',
          })
        }
      })
      
      return next
    })
    
    message.success(`已添加 ${selected.length} 名学员到 ${classCampus}`)
    
    setPickerVisible(false)
  }

  const saveCampusDetail = async (campusName: string, classIdForCampus: string) => {
    // 检查是否有数据
    const campusData = detailData.filter((r) => r.campus === campusName);
    if (campusData.length === 0) {
      message.warning(`${campusName} 没有学员数据，请先点击"选择学员"添加学员`);
      return;
    }

    try {
      const rows = campusData.map((r) => ({
        classId: classIdForCampus || r.classId,
        serialNumber: r.serialNumber,
        name: r.name,
        idCard: r.idCard,
        enrollmentDate: r.enrollmentDate,
        enrollmentAge: r.enrollmentAge,
        receivableAmount: r.receivableAmount,
        plannedPaymentAmount: r.plannedPaymentAmount,
        actualPaymentAmount: r.actualPaymentAmount,
        supplementPaymentTime: r.supplementPaymentTime,
        supplementPaymentAmount: r.supplementPaymentAmount,
        actualPaymentDate: r.actualPaymentDate,
        plannedPaymentDate: r.plannedPaymentDate,
        campus: r.campus,
        headTeacher: r.headTeacher,
      }))
      const payload = {
        神殿名称: campusName,
        班级: classIdForCampus,
        行列表: rows,
      }
      console.log('保存明细数据:', { 神殿名称: campusName, 班级: classIdForCampus, 行数: rows.length });
      const res = await fetch(buildApiUrl('/teaching-quality/campus-class-promotion-detail'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const errorText = await res.text();
        console.error('保存失败响应:', errorText);
        throw new Error(errorText);
      }
      return true
    } catch (e) {
      console.error('保存失败:', e)
      throw e
    }
  }

  // 保存所有神殿的明细数据
  const saveAllCampusDetails = async () => {
    const campusesWithData = visibleCampuses.filter(campus => {
      const data = detailData.filter(r => r.campus === campus)
      return data.length > 0
    })
    
    if (campusesWithData.length === 0) {
      message.warning('没有学员数据需要保存，请先选择学员')
      return
    }
    
    setLoading(true)
    const results: { campus: string; success: boolean; error?: string }[] = []
    
    for (const campus of campusesWithData) {
      const currentClassId = summaryClassId || classIdByCampus[campus] || classId || `Y2241${classNum}`
      try {
        await saveCampusDetail(campus, currentClassId)
        results.push({ campus, success: true })
      } catch (e) {
        results.push({ campus, success: false, error: e instanceof Error ? e.message : '未知错误' })
      }
    }
    
    setLoading(false)
    
    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length
    
    if (failCount === 0) {
      message.success(`所有神殿数据保存成功（共 ${successCount} 个神殿）`)
      // 触发全局刷新事件，通知其他汇总表刷新
      window.dispatchEvent(new CustomEvent('promotionDataUpdated', { 
        detail: { 
          campuses: campusesWithData,
          classId: summaryClassId || classId,
          timestamp: Date.now()
        } 
      }))
    } else if (successCount === 0) {
      message.error(`所有神殿数据保存失败`)
    } else {
      message.warning(`部分神殿保存成功：${successCount} 成功，${failCount} 失败`)
      // 即使部分成功也触发刷新
      window.dispatchEvent(new CustomEvent('promotionDataUpdated', { 
        detail: { 
          campuses: results.filter(r => r.success).map(r => r.campus),
          classId: summaryClassId || classId,
          timestamp: Date.now()
        } 
      }))
    }
    
    // 重新加载数据
    fetchData()
  }

  // 单个神殿保存（带提示）
  // 获取并更新单个神殿的明细数据
  const fetchCampusDetail = async (campusName: string, classIdForCampus: string) => {
    try {
      const url = buildApiUrl(`/teaching-quality/campus-class-promotion-detail?campus=${encodeURIComponent(campusName)}&class=${encodeURIComponent(classIdForCampus)}`)
      const res = await fetch(url)
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      const newRows = (data?.行列表 || []).map((r: any) => ({
        key: `${campusName}-${r.idCard || r.serialNumber}`,
        classId: classIdForCampus,
        serialNumber: Number(r.serialNumber || 0),
        name: String(r.name || ''),
        idCard: String(r.idCard || ''),
        enrollmentDate: String(r.enrollmentDate || ''),
        enrollmentAge: String(r.enrollmentAge || ''),
        receivableAmount: Number(r.receivableAmount || 0),
        plannedPaymentAmount: Number(r.plannedPaymentAmount || 0),
        actualPaymentAmount: Number(r.actualPaymentAmount || 0),
        supplementPaymentTime: String(r.supplementPaymentTime || ''),
        supplementPaymentAmount: Number(r.supplementPaymentAmount || 0),
        actualPaymentDate: String(r.actualPaymentDate || ''),
        plannedPaymentDate: String(r.plannedPaymentDate || ''),
        campus: campusName,
        headTeacher: String(r.headTeacher || ''),
      })) as DetailRecord[]

      setDetailData(prev => {
        const otherCampusesData = prev.filter(r => r.campus !== campusName)
        const updatedDetailData = [...otherCampusesData, ...newRows]
        // 在更新明细后，重新计算汇总数据
        recalculateSummary(updatedDetailData)
        return updatedDetailData
      })

    } catch (e) {
      // 获取单个神殿失败不应阻塞整体，仅提示
      console.error(`获取 ${campusName} 明细失败:`, e)
      message.error(`刷新 ${campusName} 数据失败`)
    }
  }

  const saveSingleCampusDetail = async (campusName: string, classIdForCampus: string) => {
    try {
      await saveCampusDetail(campusName, classIdForCampus)
      message.success('保存成功')
      // 仅刷新当前神殿的明细（避免其他神殿表格一起闪烁/刷新）
      await fetchCampusDetail(campusName, classIdForCampus)
    } catch (e) {
      message.error(`保存失败: ${e instanceof Error ? e.message : '未知错误'}`)
    }
  }


  const recalculateSummary = (allDetails: DetailRecord[]) => {
    // 基于各神殿明细汇总“清美教育各神殿升学计划”
    const campusSet = Array.from(new Set(allDetails.map(r => r.campus))).filter(Boolean)
    const studentsOnFile: CampusNumberMap = { total: 0 }
    const targetStudents: CampusNumberMap = { total: 0 }
    const receivable: CampusNumberMap = { total: 0 }
    const projectedPromotionAmount: CampusNumberMap = { total: 0 }

    campusSet.forEach(c => {
      const rows = allDetails.filter(r => r.campus === c)
      const onFile = rows.length
      const target = rows.filter(r => (r.plannedPaymentAmount || 0) > 0).length
      const recv = rows.reduce((sum, r) => sum + (r.receivableAmount || 0), 0)
      const projAmt = rows.reduce((sum, r) => sum + (r.plannedPaymentAmount || 0), 0)
      studentsOnFile[c] = onFile
      targetStudents[c] = target
      receivable[c] = recv
      projectedPromotionAmount[c] = projAmt
      studentsOnFile.total += onFile
      targetStudents.total += target
      receivable.total += recv
      projectedPromotionAmount.total += projAmt
    })

    // 从汇总数据中获取单价（如果已设置）
    const unitPrice = summaryData.length > 0 ? summaryData[0].unitPrice : 0

    const actualPromotionCount = allDetails.filter(r => (r.actualPaymentAmount || 0) > 0).length
    const actualPromotionAmount = allDetails.reduce((sum, r) => sum + (r.actualPaymentAmount || 0), 0)

    const projectedPromotionRateByCount = studentsOnFile.total > 0
      ? (targetStudents.total / studentsOnFile.total) * 100
      : 0
    const projectedPromotionRateByAmount = receivable.total > 0
      ? (projectedPromotionAmount.total / receivable.total) * 100
      : 0
    const actualPromotionRateByAmount = receivable.total > 0
      ? (actualPromotionAmount / receivable.total) * 100
      : 0

    const headTeacherFromDetail = allDetails.find(r => r.headTeacher && r.headTeacher.trim())?.headTeacher || ''

    const displayClassId = summaryClassId || classId || `Y2241${classNum}`

    const summaryRow: SummaryRecord = {
      key: `summary-${displayClassId}`,
      serialNumber: 1,
      promotionMonth: promotionMonth ? promotionMonth.format('YYYY年MM月') : '全年',
      classId: displayClassId,
      studentsOnFile,
      targetStudents,
      projectedPromotionRateByCount,
      unitPrice,
      receivable,
      projectedPromotionAmount,
      projectedPromotionRateByAmount,
      actualPromotionCount,
      actualPromotionAmount,
      actualPromotionRateByAmount,
      headTeacher: headTeacherFromDetail,
    }

    setSummaryData([summaryRow])
  }

  const fetchData = async () => {
    setLoading(true);
    try {
      const campuses: string[] = campusFilter || []
      // 优先使用汇总表选择的班级，其次使用传入的 classId
      const displayClassId = summaryClassId || classId || ''
      
      // 如果没有选择班级，则不加载数据
      if (!displayClassId) {
        setLoading(false);
        return;
      }

      // 先尝试从数据库加载已保存的汇总数据
      let loadedSummary: SummaryRecord | null = null;
      if (promotionMonth) {
        try {
          const summaryUrl = buildApiUrl(
            `/teaching-quality/campus-class-promotion-summary?classId=${encodeURIComponent(displayClassId)}&promotionMonth=${encodeURIComponent(promotionMonth.format('YYYY年MM月'))}`
          );
          console.log('获取汇总数据:', { classId: displayClassId, promotionMonth: promotionMonth.format('YYYY年MM月'), url: summaryUrl });
          const summaryRes = await fetch(summaryUrl);
          console.log('汇总数据响应状态:', summaryRes.status);
          if (summaryRes.ok) {
            const summaryData = await summaryRes.json();
            console.log('汇总数据:', summaryData);
            if (summaryData?.行列表 && summaryData.行列表.length > 0) {
              const row = summaryData.行列表[0];
              loadedSummary = {
                key: `summary-${row.classId}`,
                serialNumber: row.serialNumber,
                promotionMonth: row.promotionMonth,
                classId: row.classId,
                studentsOnFile: row.studentsOnFile,
                targetStudents: row.targetStudents,
                projectedPromotionRateByCount: row.projectedPromotionRateByCount,
                unitPrice: row.unitPrice,
                receivable: row.receivable,
                projectedPromotionAmount: row.projectedPromotionAmount,
                projectedPromotionRateByAmount: row.projectedPromotionRateByAmount,
                actualPromotionCount: row.actualPromotionCount,
                actualPromotionAmount: row.actualPromotionAmount,
                actualPromotionRateByAmount: row.actualPromotionRateByAmount,
                headTeacher: row.headTeacher || '',
              };
            }
          }
        } catch (e) {
          console.log('未找到已保存的汇总数据，将基于明细重新计算');
        }
      }

      const allDetails: DetailRecord[] = []

      // 逐神殿加载已保存的班升学计划明细
      for (const c of campuses) {
        // 优先使用汇总表选择的班级，其次使用神殿特定的班级ID
        const cid = summaryClassId || classIdByCampus[c] || classId || ''
        if (!cid) continue; // 如果没有班级ID，跳过该神殿
        const url = buildApiUrl(`/teaching-quality/campus-class-promotion-detail?campus=${encodeURIComponent(c)}&class=${encodeURIComponent(cid)}`)
        try {
          const res = await fetch(url)
          if (!res.ok) throw new Error(await res.text())
          const data = await res.json()
          const rows = (data?.行列表 || []).map((r: any) => ({
            key: `${c}-${r.idCard || r.serialNumber}`,
            classId: cid,
            serialNumber: Number(r.serialNumber || 0),
            name: String(r.name || ''),
            idCard: String(r.idCard || ''),
            enrollmentDate: String(r.enrollmentDate || ''),
            enrollmentAge: String(r.enrollmentAge || ''),
            receivableAmount: Number(r.receivableAmount || 0),
            plannedPaymentAmount: Number(r.plannedPaymentAmount || 0),
            actualPaymentAmount: Number(r.actualPaymentAmount || 0),
            supplementPaymentTime: String(r.supplementPaymentTime || ''),
            supplementPaymentAmount: Number(r.supplementPaymentAmount || 0),
            actualPaymentDate: String(r.actualPaymentDate || ''),
            plannedPaymentDate: String(r.plannedPaymentDate || ''),
            campus: c,
            headTeacher: String(r.headTeacher || ''),
          })) as DetailRecord[]
          allDetails.push(...rows)
        } catch (e) {
          // 无数据或404等直接忽略该神殿
        }
      }

      setDetailData(allDetails)

      // 基于各神殿明细汇总“清美教育各神殿升学计划”
      const campusSet = Array.from(new Set(allDetails.map(r => r.campus))).filter(Boolean)
      const studentsOnFile: CampusNumberMap = { total: 0 }
      const targetStudents: CampusNumberMap = { total: 0 }
      const receivable: CampusNumberMap = { total: 0 }
      const projectedPromotionAmount: CampusNumberMap = { total: 0 }

      campusSet.forEach(c => {
        const rows = allDetails.filter(r => r.campus === c)
        const onFile = rows.length
        const target = rows.filter(r => (r.plannedPaymentAmount || 0) > 0).length
        const recv = rows.reduce((sum, r) => sum + (r.receivableAmount || 0), 0)
        const projAmt = rows.reduce((sum, r) => sum + (r.plannedPaymentAmount || 0), 0)
        studentsOnFile[c] = onFile
        targetStudents[c] = target
        receivable[c] = recv
        projectedPromotionAmount[c] = projAmt
        studentsOnFile.total += onFile
        targetStudents.total += target
        receivable.total += recv
        projectedPromotionAmount.total += projAmt
      })

      // 优先使用数据库中的单价，如果没有则为0
      const unitPrice = loadedSummary?.unitPrice || 0

      const actualPromotionCount = allDetails.filter(r => (r.actualPaymentAmount || 0) > 0).length
      const actualPromotionAmount = allDetails.reduce((sum, r) => sum + (r.actualPaymentAmount || 0), 0)

      const projectedPromotionRateByCount = studentsOnFile.total > 0
        ? (targetStudents.total / studentsOnFile.total) * 100
        : 0
      const projectedPromotionRateByAmount = receivable.total > 0
        ? (projectedPromotionAmount.total / receivable.total) * 100
        : 0
      const actualPromotionRateByAmount = receivable.total > 0
        ? (actualPromotionAmount / receivable.total) * 100
        : 0

      // 从明细数据中获取班主任（取第一个非空的班主任）
      const headTeacherFromDetail = allDetails.find(r => r.headTeacher && r.headTeacher.trim())?.headTeacher || ''
      
      // 优先从班级管理中获取班主任，如果没有则从明细数据中获取
      const headTeacherFromClassManagement = classHeadTeacherMap[displayClassId] || ''
      const headTeacher = headTeacherFromClassManagement || headTeacherFromDetail

      const summaryRow: SummaryRecord = {
        key: `summary-${displayClassId}`,
        serialNumber: 1,
        promotionMonth: promotionMonth ? promotionMonth.format('YYYY年MM月') : '全年',
        classId: displayClassId,
        studentsOnFile,
        targetStudents,
        projectedPromotionRateByCount,
        unitPrice,
        receivable,
        projectedPromotionAmount,
        projectedPromotionRateByAmount,
        actualPromotionCount,
        actualPromotionAmount,
        actualPromotionRateByAmount,
        headTeacher: headTeacher,
      }

      // 始终使用基于明细重新计算的汇总数据，确保数据实时性
      // 如果有已保存的汇总数据，仅用于补充实际升学数据（实际升学人数、实际升学金额等）
      if (loadedSummary) {
        summaryRow.actualPromotionCount = loadedSummary.actualPromotionCount || summaryRow.actualPromotionCount;
        summaryRow.actualPromotionAmount = loadedSummary.actualPromotionAmount || summaryRow.actualPromotionAmount;
        summaryRow.actualPromotionRateByAmount = receivable.total > 0
          ? (summaryRow.actualPromotionAmount / receivable.total) * 100
          : 0;
      }
      setSummaryData([summaryRow]);
    } catch (error) {
      message.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchData();
  };

  const handleExport = () => {
    message.success('导出功能开发中');
  };

  const handleSaveSummary = async () => {
    if (summaryData.length === 0) {
      message.warning('没有汇总数据可保存');
      return;
    }

    try {
      const summaryRow = summaryData[0];
      
      // 优先从班级管理中获取班级所属的神殿（这是最准确的来源）
      let classCampus = '';
      const classOption = allClassOptions.find(o => o.value === summaryRow.classId);
      
      if (classOption?.campus) {
        classCampus = classOption.campus;
        console.log('从班级管理中获取神殿:', classCampus);
      } else {
        // 如果班级管理中没有，尝试从明细数据中获取（取出现次数最多的神殿）
        const campusesFromDetail = detailData.map(r => r.campus).filter(Boolean);
        if (campusesFromDetail.length > 0) {
          // 统计每个神殿出现的次数
          const campusCount: Record<string, number> = {};
          campusesFromDetail.forEach(c => {
            campusCount[c] = (campusCount[c] || 0) + 1;
          });
          // 取出现次数最多的神殿
          classCampus = Object.entries(campusCount).sort((a, b) => b[1] - a[1])[0][0];
          console.log('从明细数据中获取神殿（出现最多）:', classCampus, '统计:', campusCount);
        } else if (campusFilter && campusFilter.length > 0) {
          // 如果明细数据也没有，使用 campusFilter 的第一个
          classCampus = campusFilter[0];
          console.log('从 campusFilter 中获取神殿:', classCampus);
        }
      }
      
      console.log('准备保存汇总数据:', {
        班级ID: summaryRow.classId,
        神殿: classCampus,
        升学月份: summaryRow.promotionMonth,
        班级选项: classOption,
      });
      
      if (!classCampus) {
        message.error(`无法确定班级 ${summaryRow.classId} 的所属神殿，请检查班级管理设置`);
        return false;
      }
      
      const payload = {
        班级ID: summaryRow.classId,
        神殿: classCampus,
        升学月份: summaryRow.promotionMonth,
        数据: summaryRow,
      };

      console.log('保存汇总数据 payload:', payload);
      const res = await fetch(buildApiUrl('/teaching-quality/campus-class-promotion-summary'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('保存汇总失败响应:', errorText);
        throw new Error(errorText);
      }
      const result = await res.json();
      console.log('保存汇总成功:', result);
      
      // 检查后端返回的神殿是否与前端发送的一致
      if (result.campus && result.campus !== classCampus) {
        console.warn(`警告：后端保存的神殿 (${result.campus}) 与前端发送的神殿 (${classCampus}) 不一致！`);
        message.warning(`数据已保存，但神殿信息可能不正确。请检查数据。`);
      }
      
      return true;
    } catch (e) {
      console.error('保存汇总失败:', e);
      throw e;
    }
  };

  // 合并保存：保存所有神殿明细 + 保存汇总
  const handleSaveAll = async () => {
    const campusesWithData = visibleCampuses.filter(campus => {
      const data = detailData.filter(r => r.campus === campus)
      return data.length > 0
    })
    
    if (campusesWithData.length === 0 && summaryData.length === 0) {
      message.warning('没有数据需要保存')
      return
    }
    
    setLoading(true)
    
    try {
      // 1. 保存所有神殿明细
      const detailResults: { campus: string; success: boolean; error?: string }[] = []
      
      for (const campus of campusesWithData) {
        const currentClassId = summaryClassId || classIdByCampus[campus] || classId || `Y2241${classNum}`
        try {
          await saveCampusDetail(campus, currentClassId)
          detailResults.push({ campus, success: true })
        } catch (e) {
          detailResults.push({ campus, success: false, error: e instanceof Error ? e.message : '未知错误' })
        }
      }
      
      // 2. 保存汇总数据
      let summarySuccess = false
      let summaryError = ''
      
      if (summaryData.length > 0) {
        try {
          await handleSaveSummary()
          summarySuccess = true
        } catch (e) {
          summaryError = e instanceof Error ? e.message : '未知错误'
        }
      }
      
      // 3. 汇总结果并提示
      const detailSuccessCount = detailResults.filter(r => r.success).length
      const detailFailCount = detailResults.filter(r => !r.success).length
      
      const messages: string[] = []
      
      if (campusesWithData.length > 0) {
        if (detailFailCount === 0) {
          messages.push(`所有神殿明细保存成功（共 ${detailSuccessCount} 个神殿）`)
        } else if (detailSuccessCount === 0) {
          messages.push(`所有神殿明细保存失败`)
        } else {
          messages.push(`部分神殿明细保存成功：${detailSuccessCount} 成功，${detailFailCount} 失败`)
        }
      }
      
      if (summaryData.length > 0) {
        if (summarySuccess) {
          messages.push('汇总数据保存成功')
        } else {
          messages.push(`汇总数据保存失败：${summaryError}`)
        }
      }
      
      // 根据结果显示不同类型的消息
      const allSuccess = detailFailCount === 0 && (summaryData.length === 0 || summarySuccess)
      const allFailed = detailSuccessCount === 0 && !summarySuccess
      
      if (allSuccess) {
        message.success(messages.join('；'))
        // 触发全局刷新事件
        window.dispatchEvent(new CustomEvent('promotionDataUpdated', { 
          detail: { 
            campuses: campusesWithData,
            classId: summaryClassId || classId,
            timestamp: Date.now()
          } 
        }))
      } else if (allFailed) {
        message.error(messages.join('；'))
      } else {
        message.warning(messages.join('；'))
        // 部分成功也触发刷新
        if (detailSuccessCount > 0) {
          window.dispatchEvent(new CustomEvent('promotionDataUpdated', { 
            detail: { 
              campuses: detailResults.filter(r => r.success).map(r => r.campus),
              classId: summaryClassId || classId,
              timestamp: Date.now()
            } 
          }))
        }
      }
      
      // 重新加载数据
      fetchData()
    } finally {
      setLoading(false)
    }
  };

  // 根据 campusFilter 过滤汇总数据（只保留指定神殿并重算合计与比率）
  const applyCampusFilterToSummary = (list: SummaryRecord[], filter?: string[]): SummaryRecord[] => {
    if (!Array.isArray(filter) || filter.length === 0) return list

    const pick = (m: Record<string, any>) => {
      const result: Record<string, number> = { total: 0 }
      for (const k of Object.keys(m)) {
        if (k === 'total') continue
        if (filter.includes(k)) {
          result[k] = Number(m[k] || 0)
          result.total += result[k]
        }
      }
      return result as CampusNumberMap
    }

    return list.map((s) => {
      const studentsOnFile = pick(s.studentsOnFile)
      const targetStudents = pick(s.targetStudents)
      const receivable = pick(s.receivable)
      const projectedPromotionAmount = pick(s.projectedPromotionAmount)

      const projectedPromotionRateByCount = studentsOnFile.total > 0 ? (targetStudents.total / studentsOnFile.total) * 100 : 0
      const projectedPromotionRateByAmount = receivable.total > 0 ? (projectedPromotionAmount.total / receivable.total) * 100 : 0

      return {
        ...s,
        studentsOnFile,
        targetStudents,
        receivable,
        projectedPromotionAmount,
        projectedPromotionRateByCount,
        projectedPromotionRateByAmount,
      }
    })
  };


  const visibleSummaryData = applyCampusFilterToSummary(summaryData, campusFilter);

  // 需要展示的神殿列（由上层传入 campusFilter 控制；未传时不展示神殿列）
  const visibleCampuses: string[] = Array.isArray(campusFilter) ? campusFilter : []

  // 构建动态列
  const makeCampusChildren = (
    groupKey: 'studentsOnFile' | 'targetStudents' | 'receivable' | 'projectedPromotionAmount',
    align: 'center' | 'right' = 'center',
    isCurrency = false,
  ) => {
    const base: any[] = [
      { title: '合计', dataIndex: [groupKey, 'total'], key: `${groupKey}-total`, width: 90, align },
    ]
    for (const campus of visibleCampuses) {
      base.push({
        title: campus,
        dataIndex: [groupKey, campus],
        key: `${groupKey}-${campus}`,
        width: 90,
        align,
        render: (val: any) => {
          if (isCurrency) return `¥${Number(val || 0).toLocaleString()}`
          return val ?? 0
        },
      })
    }
    return base
  }

  // 汇总表列定义（动态神殿）
  const summaryColumns: ColumnsType<SummaryRecord> = [
    { title: '序号', dataIndex: 'serialNumber', key: 'serialNumber', width: 60, align: 'center', fixed: 'left' },
    { 
      title: '升学月份', 
      dataIndex: 'promotionMonth', 
      key: 'promotionMonth', 
      width: 150, 
      align: 'center', 
      fixed: 'left',
      render: () => (
        <DatePicker
          picker="month"
          value={promotionMonth}
          onChange={(date) => setPromotionMonth(date)}
          placeholder="选择升学月份"
          format="YYYY年MM月"
          style={{ width: '100%' }}
          allowClear
        />
      )
    },
    { 
      title: '班级', 
      dataIndex: 'classId', 
      key: 'classId', 
      width: 180, 
      align: 'center', 
      fixed: 'left',
      render: () => (
        <Select
          style={{ width: '100%' }}
          value={summaryClassId || undefined}
          placeholder="选择班级"
          allowClear
          showSearch
          optionFilterProp="label"
          options={allClassOptions}
          onChange={(val) => {
            setSummaryClassId(val || '')
            onClassIdChange?.(val || '')
          }}
        />
      )
    },
    { title: '在档人数', children: makeCampusChildren('studentsOnFile', 'center', false) },
    { title: '目标人数', children: makeCampusChildren('targetStudents', 'center', false) },
    { title: '预计升学率(人)', dataIndex: 'projectedPromotionRateByCount', key: 'projectedPromotionRateByCount', width: 120, align: 'center', render: (val) => `${val?.toFixed(2) || 0}%` },
    { 
      title: '单价', 
      dataIndex: 'unitPrice', 
      key: 'unitPrice', 
      width: 120, 
      align: 'right', 
      render: (_: any, record) => (
        <InputNumber
          min={0}
          value={record.unitPrice || 0}
          style={{ width: '100%' }}
          formatter={(value) => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={(value) => Number(value!.replace(/¥\s?|(,*)/g, ''))}
          onChange={(v) => {
            const newUnitPrice = Number(v || 0)
            updateSummaryUnitPrice(newUnitPrice)
          }}
        />
      )
    },
    { title: '应收', children: makeCampusChildren('receivable', 'right', true) },
    { title: '预计升学金额', children: makeCampusChildren('projectedPromotionAmount', 'right', true) },
    { title: '预计升学率(金额)', dataIndex: 'projectedPromotionRateByAmount', key: 'projectedPromotionRateByAmount', width: 130, align: 'center', render: (val) => `${val?.toFixed(2) || 0}%` },
    { title: '实际升学人数', dataIndex: 'actualPromotionCount', key: 'actualPromotionCount', width: 120, align: 'center' },
    { title: '实际升学金额', dataIndex: 'actualPromotionAmount', key: 'actualPromotionAmount', width: 130, align: 'right', render: (val) => `¥${val?.toLocaleString() || 0}` },
    { title: '实际升学率(金额)', dataIndex: 'actualPromotionRateByAmount', key: 'actualPromotionRateByAmount', width: 130, align: 'center', render: (val) => `${val?.toFixed(2) || 0}%` },
    { title: '班主任', dataIndex: 'headTeacher', key: 'headTeacher', width: 100, align: 'center' },
  ];

  // 明细表列定义
  const detailColumns: ColumnsType<DetailRecord> = [
    { title: '班级', dataIndex: 'classId', key: 'classId', width: 100, align: 'center', fixed: 'left' },
    { title: '序号', dataIndex: 'serialNumber', key: 'serialNumber', width: 60, align: 'center', fixed: 'left' },
    { title: '姓名', dataIndex: 'name', key: 'name', width: 100, align: 'center', fixed: 'left' },
    { title: '身份证号', dataIndex: 'idCard', key: 'idCard', width: 160, align: 'center' },
    { title: '入学时间', dataIndex: 'enrollmentDate', key: 'enrollmentDate', width: 110, align: 'center' },
    { title: '入学年龄', dataIndex: 'enrollmentAge', key: 'enrollmentAge', width: 90, align: 'center' },
    { title: '应收', dataIndex: 'receivableAmount', key: 'receivableAmount', width: 120, align: 'right', render: (_: any, record) => (
      <InputNumber
        min={0}
        value={record.receivableAmount || 0}
        style={{ width: '100%' }}
        onChange={(v) => updateDetail(record.key, 'receivableAmount', Number(v || 0))}
      />
    ) },
    { title: '预计缴费金额', dataIndex: 'plannedPaymentAmount', key: 'plannedPaymentAmount', width: 140, align: 'right', render: (_: any, record) => (
      <InputNumber
        min={0}
        value={record.plannedPaymentAmount || 0}
        style={{ width: '100%' }}
        onChange={(v) => updateDetail(record.key, 'plannedPaymentAmount', Number(v || 0))}
      />
    ) },
    { title: '实际缴费金额', dataIndex: 'actualPaymentAmount', key: 'actualPaymentAmount', width: 140, align: 'right', render: (_: any, record) => (
      <InputNumber
        min={0}
        value={record.actualPaymentAmount || 0}
        style={{ width: '100%' }}
        onChange={(v) => updateDetail(record.key, 'actualPaymentAmount', Number(v || 0))}
      />
    ) },
    { title: '补款时间', dataIndex: 'supplementPaymentTime', key: 'supplementPaymentTime', width: 160, align: 'center', render: (_: any, record) => (
      <DatePicker
        allowClear
        style={{ width: '100%' }}
        value={record.supplementPaymentTime ? dayjs(record.supplementPaymentTime) : null}
        onChange={(d) => updateDetail(record.key, 'supplementPaymentTime', d ? d.format('YYYY-MM-DD') : '')}
      />
    ) },
    { title: '补款金额', dataIndex: 'supplementPaymentAmount', key: 'supplementPaymentAmount', width: 120, align: 'right', render: (_: any, record) => (
      <InputNumber
        min={0}
        value={record.supplementPaymentAmount || 0}
        style={{ width: '100%' }}
        onChange={(v) => updateDetail(record.key, 'supplementPaymentAmount', Number(v || 0))}
      />
    ) },
    { title: '实际缴费时间', dataIndex: 'actualPaymentDate', key: 'actualPaymentDate', width: 160, align: 'center', render: (_: any, record) => (
      <DatePicker
        allowClear
        style={{ width: '100%' }}
        value={record.actualPaymentDate ? dayjs(record.actualPaymentDate) : null}
        onChange={(d) => updateDetail(record.key, 'actualPaymentDate', d ? d.format('YYYY-MM-DD') : '')}
      />
    ) },
    { title: '计划缴费日期', dataIndex: 'plannedPaymentDate', key: 'plannedPaymentDate', width: 160, align: 'center', render: (_: any, record) => (
      <DatePicker
        allowClear
        style={{ width: '100%' }}
        value={record.plannedPaymentDate ? dayjs(record.plannedPaymentDate) : null}
        onChange={(d) => updateDetail(record.key, 'plannedPaymentDate', d ? d.format('YYYY-MM-DD') : '')}
      />
    ) },
    { title: '神殿', dataIndex: 'campus', key: 'campus', width: 80, align: 'center' },
    { title: '班主任', dataIndex: 'headTeacher', key: 'headTeacher', width: 120, align: 'center', render: (_: any, record) => (
      <Input
        value={record.headTeacher || ''}
        onChange={(e) => updateDetail(record.key, 'headTeacher', e.target.value)}
      />
    ) },
  ];

  // 依据传入的 campusFilter 过滤需要展示的神殿
  const visibleDetailData = Array.isArray(campusFilter) && campusFilter.length > 0
    ? detailData.filter(r => campusFilter.includes(r.campus))
    : detailData;

  // 按神殿分组明细数据（已按需过滤）
  const groupedDetailData = visibleDetailData.reduce((acc, record) => {
    if (!acc[record.campus]) {
      acc[record.campus] = [];
    }
    acc[record.campus].push(record);
    return acc;
  }, {} as Record<string, DetailRecord[]>);

  // 计算各神殿合计
  const calculateCampusTotals = (data: DetailRecord[]) => {
    return {
      receivableTotal: data.reduce((sum, item) => sum + item.receivableAmount, 0),
      plannedPaymentTotal: data.reduce((sum, item) => sum + item.plannedPaymentAmount, 0),
      actualPaymentTotal: data.reduce((sum, item) => sum + item.actualPaymentAmount, 0),
      count: data.length
    };
  };

  return (
    <div style={{ padding: 0 }}>
      {/* 汇总表 */}
      <Card
        title={
          <Space>
            <RiseOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
            <Title level={4} style={{ margin: 0 }}>
              清美教育各神殿升学计划
            </Title>
          </Space>
        }
        extra={
          <Space>
            <Button 
              type="primary" 
              onClick={openSummaryStudentPicker}
              disabled={!summaryClassId}
            >
              选择学员
            </Button>
            <Button 
              type="primary"
              onClick={handleSaveAll}
              disabled={detailData.length === 0 && summaryData.length === 0}
              loading={loading}
            >
              保存
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={loading}>
              刷新
            </Button>
            <Button icon={<DownloadOutlined />} onClick={handleExport}>
              导出
            </Button>
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        <Table
          columns={summaryColumns}
          dataSource={visibleSummaryData}
          loading={loading}
          pagination={false}
          bordered
          scroll={{ x: 'max-content' }}
          size="small"
        />
      </Card>

      {/* 按神殿分组的明细表 */}
      {visibleCampuses.map((campus) => {
        const data = groupedDetailData[campus] || []
        const totals = calculateCampusTotals(data)
        // 优先使用汇总表选择的班级，其次使用神殿特定的班级ID
        const currentClassId = summaryClassId || classIdByCampus[campus] || classId || ''
        const displayYear = (typeof year !== 'undefined' && year !== null && year !== '') ? year : new Date().getFullYear()
        return (
          <Card
            key={campus}
            title={
              <Space>
                <TeamOutlined style={{ fontSize: '18px', color: '#1890ff' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 600 }}>{campus}神殿{displayYear}年</span>
                  <Input
                    size="small"
                    value={currentClassId}
                    style={{ width: 120 }}
                    onChange={(e) => {
                      const v = e.target.value
                      setClassIdByCampus((prev) => ({ ...prev, [campus]: v }))
                      onClassIdChange?.(v)
                    }}
                  />
                  <span style={{ fontWeight: 600 }}>班升学计划明细</span>
                </div>
              </Space>
            }
            style={{ marginBottom: 24 }}
            extra={
              <Space>
                {/* <Button size="small" onClick={() => openStudentPicker(campus)}>选择学员</Button> */}
                <Button size="small" type="primary" onClick={() => saveSingleCampusDetail(campus, currentClassId)}>保存</Button>
              </Space>
            }
          >
            <Table
              columns={detailColumns}
              dataSource={data.map((row) => ({ ...row, classId: currentClassId }))}
              loading={loading}
              pagination={false}
              bordered
              scroll={{ x: 'max-content' }}
              size="small"
              summary={(pageData) => {
                if (pageData.length === 0) return null
                return (
                  <Table.Summary fixed>
                    <Table.Summary.Row style={{ background: '#fafafa', fontWeight: 'bold' }}>
                      <Table.Summary.Cell index={0} align="center">合计</Table.Summary.Cell>
                      <Table.Summary.Cell index={1} colSpan={5}></Table.Summary.Cell>
                      <Table.Summary.Cell index={6} align="right">
                        ¥{totals.receivableTotal.toLocaleString()}
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={7} align="right">
                        ¥{totals.plannedPaymentTotal.toLocaleString()}
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={8} align="right">
                        ¥{totals.actualPaymentTotal.toLocaleString()}
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={9} colSpan={6}></Table.Summary.Cell>
                    </Table.Summary.Row>
                  </Table.Summary>
                )
              }}
            />
          </Card>
        )
      })}

      {/* 说明（仅当有数据时显示） */}
      {summaryData.length > 0 && (
        <Card title="说明" style={{ marginBottom: 24 }}>
        <div style={{ fontSize: '14px', lineHeight: '2' }}>
          <p>班级人数：{summaryData[0]?.studentsOnFile.total || 0}人</p>
          <p>预计升学：{summaryData[0]?.targetStudents.total || 0}人，{summaryData[0]?.projectedPromotionRateByCount?.toFixed(2) || '0.00'}%，¥{(summaryData[0]?.projectedPromotionAmount.total || 0).toLocaleString()}</p>
          <p>预计流失：{(summaryData[0]?.studentsOnFile.total || 0) - (summaryData[0]?.targetStudents.total || 0)}人</p>
        </div>
      </Card>
      )}

      {/* 学员选择弹窗 */}
      <Modal
        title={`选择学员 - 分配到各神殿升学明细表`}
        open={pickerVisible}
        onOk={handlePickerOk}
        onCancel={() => setPickerVisible(false)}
        width={960}
      >
        <div style={{ marginBottom: 16 }}>
          <Space wrap>
            <span>来源神殿</span>
            <Select
              style={{ width: 180 }}
              value={pickerSourceCampus}
              allowClear
              showSearch
              placeholder="请先选择神殿"
              options={sourceCampusOptions.map((v) => ({ label: v, value: v }))}
              onChange={(v) => {
                setPickerSourceCampus(v)
                loadClassOptions(v || '')
              }}
            />
            <span>来源班级</span>
            <Select
              style={{ width: 200 }}
              value={pickerClass}
              allowClear
              showSearch
              placeholder="请选择班级"
              disabled={!pickerSourceCampus}
              options={classOptions.map((v) => ({ label: v, value: v }))}
              onChange={(v) => {
                setPickerClass(v)
                setPickerSelectedKeys([])
                loadCandidates(v)
              }}
            />
            <Button
              type="link"
              disabled={pickerCandidates.length === 0}
              onClick={() => {
                if (pickerSelectedKeys.length === pickerCandidates.length) {
                  setPickerSelectedKeys([])
                } else {
                  setPickerSelectedKeys(pickerCandidates.map((c) => c.idCard))
                }
              }}
            >
              {pickerSelectedKeys.length === pickerCandidates.length && pickerCandidates.length > 0 ? '取消全选' : '一键全选'}
            </Button>
          </Space>
        </div>
        <div style={{ marginBottom: 8, color: '#666', fontSize: 12 }}>
          提示：所有选中的学员将统一添加到班级所属神殿（{allClassOptions.find(o => o.value === summaryClassId)?.campus || '未知'}）的升学明细表中。
          学员的招生神殿信息仅作为参考，不影响数据归属。
        </div>
        <Spin spinning={pickerLoading}>
          <Table<StudentCandidate>
            size="small"
            rowKey={(r) => r.idCard}
            bordered
            dataSource={pickerCandidates}
            pagination={false}
            scroll={{ y: 400 }}
            rowSelection={{ 
              selectedRowKeys: pickerSelectedKeys, 
              onChange: setPickerSelectedKeys,
              selections: [
                {
                  key: 'all',
                  text: '全选所有',
                  onSelect: () => {
                    setPickerSelectedKeys(pickerCandidates.map((c) => c.idCard))
                  },
                },
                {
                  key: 'none',
                  text: '取消全选',
                  onSelect: () => {
                    setPickerSelectedKeys([])
                  },
                },
              ],
            }}
            columns={[
              { title: '姓名', dataIndex: 'name', key: 'name', width: 120 },
              { title: '身份证号', dataIndex: 'idCard', key: 'id', width: 200 },
              { title: '入学时间', dataIndex: 'enrollmentDate', key: 'ed', width: 120 },
              { 
                title: '招生神殿', 
                dataIndex: 'enrollmentCampus', 
                key: 'ec', 
                width: 140,
                render: (val) => val || <span style={{ color: '#999' }}>未设置</span>
              },
            ]}
          />
        </Spin>
        {pickerSelectedKeys.length > 0 && (
          <div style={{ marginTop: 12, color: '#1890ff' }}>
            已选择 {pickerSelectedKeys.length} 名学员
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ClassPromotionDetail;

