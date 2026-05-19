import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { App, Card, Table, Input, Select, Button, Space, InputNumber, Popover, Dropdown, Modal } from 'antd'
import { CommentOutlined, FileExcelOutlined, CopyOutlined, DownOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { buildApiUrl } from '@/utils/apiBase'
import { useCampusStore } from '@/stores/campusStore'
import * as XLSX from 'xlsx'

interface ClassThousandScoreRow {
  key: string
  serialNumber: number | string
  name: string
  late: string
  leaveEarly: string
  absenteeism: string
  noListenCard: string
  smoking: string
  playingGames: string
  watchingUnrelatedVideos: string
  fighting: string
  notReturnAtNight: string
  leave: string
  walkingTalkingInClass: string
  sleepingInClass: string
  other: string
  totalDeduction: string
  bonusPoints: string  // 改为加分分数
  lastScore: string
  remainingScore: string
  annotations?: Record<string, string>  // 批注：字段名 -> 批注内容
}

// API（中文键名）
interface ApiRow {
  序号: number
  学员姓名?: string | null
  加分?: number | null
  扣分?: number | null
  累计分?: number | null
  总扣分?: number | null
  加分内容?: string | null  // 后端仍使用加分内容字段名，但存储加分分数
  上次分数?: number | null
  剩余?: number | null
  分类明细?: Record<string, any> | null
  备注?: string | null
  批注明细?: Record<string, string> | null  // 批注：字段名 -> 批注内容
}

interface ApiList {
  神殿名称: string
  班级名称: string
  年份: number
  月份: number
  行列表: ApiRow[]
}

interface ClassListItem { 班级名称: string; 神殿: string }
interface ClassFileRow { serialNumber?: number; name?: string }
interface ClassFileList { 行列表: ClassFileRow[] }

// 批注组件：鼠标悬停显示/编辑批注
const AnnotationCell: React.FC<{
  value: string
  record: ClassThousandScoreRow
  field: keyof ClassThousandScoreRow
  onChange: (value: string) => void
  onAnnotationChange: (annotation: string) => void
}> = ({ value, record, field, onChange, onAnnotationChange }) => {
  const annotation = record.annotations?.[field] || ''
  const [editing, setEditing] = useState(false)
  const [annotationText, setAnnotationText] = useState(annotation)
  const [popoverOpen, setPopoverOpen] = useState(false)
  
  // 当批注变化时同步状态
  useEffect(() => {
    setAnnotationText(annotation)
  }, [annotation])

  const handleAnnotationSave = () => {
    onAnnotationChange(annotationText)
    setEditing(false)
    setPopoverOpen(false)  // 保存后关闭弹窗
  }

  const handleCancel = () => {
    setEditing(false)
    setAnnotationText(annotation)
    setPopoverOpen(false)  // 取消后关闭弹窗
  }

  const handleEditClick = () => {
    setEditing(true)
    setPopoverOpen(true)  // 确保弹窗保持打开
  }

  // 控制 Popover 的打开/关闭
  const handleOpenChange = (open: boolean) => {
    // 如果正在编辑，不允许关闭
    if (editing && !open) {
      return
    }
    setPopoverOpen(open)
    if (!open) {
      setEditing(false)
      setAnnotationText(annotation)  // 恢复原始批注
    }
  }

  const content = (
    <div style={{ padding: 8, minWidth: 200 }} onMouseDown={(e) => e.stopPropagation()}>
      {editing ? (
        <Space direction="vertical" style={{ width: '100%' }}>
          <Input.TextArea
            value={annotationText}
            onChange={(e) => setAnnotationText(e.target.value)}
            placeholder="输入批注..."
            rows={3}
            autoFocus
            onMouseDown={(e) => e.stopPropagation()}
          />
          <Space>
            <Button size="small" type="primary" onClick={handleAnnotationSave}>
              保存
            </Button>
            <Button size="small" onClick={handleCancel}>
              取消
            </Button>
          </Space>
        </Space>
      ) : (
        <Space direction="vertical" style={{ width: '100%' }}>
          {annotation ? (
            <div style={{ marginBottom: 8, padding: 8, background: '#f5f5f5', borderRadius: 4 }}>
              {annotation}
            </div>
          ) : (
            <div style={{ color: '#999', marginBottom: 8 }}>暂无批注</div>
          )}
          <Button size="small" type="primary" onClick={handleEditClick}>
            {annotation ? '编辑批注' : '添加批注'}
          </Button>
        </Space>
      )}
    </div>
  )

  return (
    <Popover 
      content={content} 
      trigger={['click', 'hover']} 
      placement="top"
      open={popoverOpen}
      onOpenChange={handleOpenChange}
      mouseEnterDelay={0.3}
      mouseLeaveDelay={0.1}
    >
      <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
        <Input value={value} onChange={(e) => onChange(e.target.value)} />
        {annotation && (
          <CommentOutlined
            style={{
              position: 'absolute',
              right: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#1890ff',
              cursor: 'pointer',
            }}
            onClick={(e) => {
              e.stopPropagation()
              setPopoverOpen(true)
            }}
          />
        )}
      </div>
    </Popover>
  )
}

const createEmptyRow = (serial: number): ClassThousandScoreRow => ({
  key: String(serial),
  serialNumber: serial,
  name: '',
  late: '',
  leaveEarly: '',
  absenteeism: '',
  noListenCard: '',
  smoking: '',
  playingGames: '',
  watchingUnrelatedVideos: '',
  fighting: '',
  notReturnAtNight: '',
  leave: '',
  walkingTalkingInClass: '',
  sleepingInClass: '',
  other: '',
  totalDeduction: '',
  bonusPoints: '',  // 改为加分分数
  lastScore: '',
  remainingScore: '0',
  annotations: {},  // 初始化批注对象
})

const createAvgRow = (): ClassThousandScoreRow => ({
  key: 'avg',
  serialNumber: '',
  name: '平均分',
  late: '#DIV/0!',
  leaveEarly: '#DIV/0!',
  absenteeism: '#DIV/0!',
  noListenCard: '#DIV/0!',
  smoking: '#DIV/0!',
  playingGames: '#DIV/0!',
  watchingUnrelatedVideos: '#DIV/0!',
  fighting: '#DIV/0!',
  notReturnAtNight: '#DIV/0!',
  leave: '#DIV/0!',
  walkingTalkingInClass: '#DIV/0!',
  sleepingInClass: '#DIV/0!',
  other: '#DIV/0!',
  totalDeduction: '#DIV/0!',
  bonusPoints: '#DIV/0!',  // 改为加分分数
  lastScore: '#DIV/0!',
  remainingScore: '0',
  annotations: {},
})

const initialData: ClassThousandScoreRow[] = [
  ...Array.from({ length: 38 }, (_, idx) => createEmptyRow(idx + 1)),
  createAvgRow(),
]

const fromApiRow = (r: ApiRow): ClassThousandScoreRow => {
  const m = r.分类明细 || {}
  // 加分内容字段现在存储的是加分分数（数字字符串）
  const bonusPoints = r.加分内容 ? String(r.加分内容) : ''
  
  // 将后端中文字段名的批注转换为前端英文字段名
  const convertAnnotations = (annotations: Record<string, string> | null | undefined): Record<string, string> => {
    if (!annotations || Object.keys(annotations).length === 0) return {}
    
    const fieldMapping: Record<string, string> = {
      '迟到': 'late',
      '早退': 'leaveEarly',
      '旷课': 'absenteeism',
      '未带听课证': 'noListenCard',
      '吸烟': 'smoking',
      '玩游戏': 'playingGames',
      '看与学习无关视频资料': 'watchingUnrelatedVideos',
      '打架斗殴': 'fighting',
      '夜不归宿': 'notReturnAtNight',
      '请假': 'leave',
      '上课走动说话': 'walkingTalkingInClass',
      '上课睡觉': 'sleepingInClass',
      '其他': 'other',
      '加分': 'bonusPoints',
      '总扣分': 'totalDeduction',
      '上次分数': 'lastScore',
      '剩余': 'remainingScore',
    }
    
    const result: Record<string, string> = {}
    for (const [key, value] of Object.entries(annotations)) {
      if (value && value.trim()) {
        const englishKey = fieldMapping[key] || key
        result[englishKey] = value
      }
    }
    return result
  }
  
  return {
    key: String(r.序号) + '::' + String(r.学员姓名 || ''),
    serialNumber: r.序号,
    name: (r.学员姓名 || '').trim(),
    late: (m['迟到'] ?? '').toString(),
    leaveEarly: (m['早退'] ?? '').toString(),
    absenteeism: (m['旷课'] ?? '').toString(),
    noListenCard: (m['未带听课证'] ?? '').toString(),
    smoking: (m['吸烟'] ?? '').toString(),
    playingGames: (m['玩游戏'] ?? '').toString(),
    watchingUnrelatedVideos: (m['看与学习无关视频资料'] ?? '').toString(),
    fighting: (m['打架斗殴'] ?? '').toString(),
    notReturnAtNight: (m['夜不归宿'] ?? '').toString(),
    leave: (m['请假'] ?? '').toString(),
    walkingTalkingInClass: (m['上课走动说话'] ?? '').toString(),
    sleepingInClass: (m['上课睡觉'] ?? '').toString(),
    other: (m['其他'] ?? '').toString(),
    totalDeduction: (r.总扣分 ?? '').toString(),
    bonusPoints: bonusPoints,  // 改为加分分数
    lastScore: (r.上次分数 ?? '').toString(),
    remainingScore: (r.剩余 ?? '').toString(),
    annotations: convertAnnotations(r.批注明细),  // 转换批注字段名为英文
  }
}

const toApiRow = (r: ClassThousandScoreRow): ApiRow => {
  const categories: Record<string, any> = {
    迟到: r.late,
    早退: r.leaveEarly,
    旷课: r.absenteeism,
    未带听课证: r.noListenCard,
    吸烟: r.smoking,
    玩游戏: r.playingGames,
    看与学习无关视频资料: r.watchingUnrelatedVideos,
    打架斗殴: r.fighting,
    夜不归宿: r.notReturnAtNight,
    请假: r.leave,
    上课走动说话: r.walkingTalkingInClass,
    上课睡觉: r.sleepingInClass,
    其他: r.other,
  }
  const toInt = (s: string): number | undefined => {
    if (s === undefined || s === null) return undefined
    const t = String(s).trim()
    if (!t) return undefined
    const n = Number(t.replace(/[^\d\-]/g, ''))
    return Number.isNaN(n) ? undefined : n
  }
  
  // 将前端字段名的批注转换为中文字段名（后端存储格式）
  const convertAnnotations = (annotations: Record<string, string> | undefined): Record<string, string> | undefined => {
    if (!annotations || Object.keys(annotations).length === 0) return undefined
    
    const fieldMapping: Record<string, string> = {
      late: '迟到',
      leaveEarly: '早退',
      absenteeism: '旷课',
      noListenCard: '未带听课证',
      smoking: '吸烟',
      playingGames: '玩游戏',
      watchingUnrelatedVideos: '看与学习无关视频资料',
      fighting: '打架斗殴',
      notReturnAtNight: '夜不归宿',
      leave: '请假',
      walkingTalkingInClass: '上课走动说话',
      sleepingInClass: '上课睡觉',
      other: '其他',
      bonusPoints: '加分',
      totalDeduction: '总扣分',
      lastScore: '上次分数',
      remainingScore: '剩余',
    }
    
    const result: Record<string, string> = {}
    for (const [key, value] of Object.entries(annotations)) {
      if (value && value.trim()) {
        const chineseKey = fieldMapping[key] || key
        result[chineseKey] = value
      }
    }
    return Object.keys(result).length > 0 ? result : undefined
  }
  
  return {
    序号: Number(r.serialNumber),
    学员姓名: r.name || undefined,
    总扣分: toInt(r.totalDeduction),
    加分内容: r.bonusPoints || undefined,  // 加分分数存储到加分内容字段
    上次分数: toInt(r.lastScore),
    剩余: toInt(r.remainingScore),
    分类明细: categories,
    批注明细: convertAnnotations(r.annotations),  // 转换批注字段名为中文
  }
}

const ClassThousandScoreSystemPage: React.FC = () => {
  const { message } = App.useApp()
  const today = new Date()
  const { currentCampus } = useCampusStore()
  const [allClasses, setAllClasses] = useState<Array<{ label: string; value: string; campus: string }>>([])
  const [selectedCampus, setSelectedCampus] = useState<string>('')
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [year, setYear] = useState<number>(today.getFullYear())
  const [month, setMonth] = useState<number>(today.getMonth() + 1)

  const [dataSource, setDataSource] = useState<ClassThousandScoreRow[]>(initialData)
  const [loading, setLoading] = useState<boolean>(false)
  
  // Excel 导入相关状态
  const [importLoading, setImportLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pasteModalVisible, setPasteModalVisible] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const pasteTextAreaRef = useRef<any>(null)
  
  // 导入预览相关状态
  const [previewModalVisible, setPreviewModalVisible] = useState(false)
  const [previewData, setPreviewData] = useState<ClassThousandScoreRow[]>([])
  const [previewSource, setPreviewSource] = useState<'excel' | 'clipboard'>('excel')

  // 加载班级列表（同出勤表：神殿名去"神殿"后缀）
  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch(buildApiUrl('/teaching-quality/class-list'))
        if (!res.ok) throw new Error('加载班级列表失败')
        const list = (await res.json()) as ClassListItem[]
        const norm = (s: string) => (s || '').replace(/神殿$/, '').trim()
        const options = list.map((it) => {
          const campusNorm = norm(it.神殿)
          return { label: `${campusNorm} - ${it.班级名称}`, value: `${campusNorm}||${it.班级名称}`, campus: campusNorm }
        })
        const unique = Array.from(new Map(options.map((o) => [o.value, o])).values())
        setAllClasses(unique)
        

      } catch (e) {
        console.error(e)
        message.error('加载班级列表失败')
      }
    })()
  }, [])

  // 同步顶部神殿（全局）到本页，并基于此筛选班级
  useEffect(() => {
    const norm = (s: string) => (s || '').replace(/神殿$/, '').trim()
    const normalized = norm(currentCampus || '')
    setSelectedCampus(normalized)
    setSelectedClass('') // 切换神殿时清空已选班级
  }, [currentCampus])

  const filteredClasses = useMemo(() => {
    if (!selectedCampus) return []
    return allClasses.filter((c) => c.campus === selectedCampus)
  }, [selectedCampus, allClasses])

  // 出勤表同款：从班级档案取名单；若为空，再从"班级出勤表"当月数据兜底提取姓名；若仍为空，尝试 campus+"神殿"后缀再次读取档案
  const fetchRoster = async (
    campus: string,
    klass: string,
    y: number,
    m: number,
  ): Promise<Array<{ 序号: number; 姓名: string }>> => {
    const tryClassFile = async (campusArg: string) => {
      const res = await fetch(buildApiUrl(`/teaching-quality/class-file?campus=${encodeURIComponent(campusArg)}&class=${encodeURIComponent(klass)}`))
      if (!res.ok) return []
      const cf = (await res.json()) as ClassFileList
      return (cf.行列表 || [])
        .map((r, idx) => ({ 序号: Number(r.serialNumber ?? idx + 1), 姓名: (r.name || '').trim() }))
        .filter((r) => !!r.姓名)
        .sort((a, b) => a.序号 - b.序号)
    }
    const tryAttendance = async () => {
      const res = await fetch(buildApiUrl(`/teaching-quality/class-attendance?campus=${encodeURIComponent(campus)}&class=${encodeURIComponent(klass)}&year=${y}&month=${m}`))
      if (!res.ok) return [] as Array<{ 序号: number; 姓名: string }>
      const data = (await res.json()) as { 行列表: Array<{ 序号: number; 姓名: string }> }
      const set = new Map<string, { 序号: number; 姓名: string }>()
      ;(data.行列表 || []).forEach((r) => {
        const key = `${r.序号}__${(r.姓名 || '').trim()}`
        if (r.姓名 && !set.has(key)) set.set(key, { 序号: r.序号, 姓名: (r.姓名 || '').trim() })
      })
      return Array.from(set.values()).sort((a, b) => a.序号 - b.序号)
    }
    // 1) 班级档案（原样）
    let roster = await tryClassFile(campus)
    if (roster.length > 0) return roster
    // 2) 出勤兜底
    roster = await tryAttendance()
    if (roster.length > 0) return roster
    // 3) 再次尝试 campus 加"神殿"后缀
    if (!campus.endsWith('神殿')) {
      roster = await tryClassFile(`${campus}神殿`)
      if (roster.length > 0) return roster
    }
    return []
  }

  const loadData = async (campus: string, klass: string, y: number, m: number) => {
    setLoading(true)
    try {
      const prevY = m === 1 ? y - 1 : y
      const prevM = m === 1 ? 12 : m - 1
      const [roster, resData, prevRes, attendanceRes] = await Promise.all([
        fetchRoster(campus, klass, y, m),
        fetch(buildApiUrl(`/teaching-quality/thousand-score?campus=${encodeURIComponent(campus)}&class=${encodeURIComponent(klass)}&year=${y}&month=${m}`)),
        fetch(buildApiUrl(`/teaching-quality/thousand-score?campus=${encodeURIComponent(campus)}&class=${encodeURIComponent(klass)}&year=${prevY}&month=${prevM}`)),
        fetch(buildApiUrl(`/teaching-quality/class-attendance?campus=${encodeURIComponent(campus)}&class=${encodeURIComponent(klass)}&year=${y}&month=${m}`)),
      ])

      let apiRows: ApiRow[] = []
      if (resData.ok) {
        const data = (await resData.json()) as ApiList
        apiRows = data.行列表 || []
      } else {
        console.warn('读取千分制月累计失败：', await resData.text())
      }

      // 上月剩余映射（以姓名为主键，因为序号可能变化）
      const prevRemainMap = new Map<string, string>()
      if (prevRes.ok) {
        const prevData = (await prevRes.json()) as ApiList
        ;(prevData.行列表 || []).forEach((r) => {
          const name = (r.学员姓名 || '').trim()
          if (name) {
            prevRemainMap.set(name, ((r.剩余 ?? '') as any).toString())
          }
        })
      }

      // 从考勤表中统计迟到、早退、旷课次数
      const attendanceStats = new Map<string, { late: number; leaveEarly: number; absenteeism: number }>()
      if (attendanceRes.ok) {
        const attendanceData = (await attendanceRes.json()) as { 行列表: Array<{ 序号: number; 姓名: string; slots: Record<string, string | null> }> }
        ;(attendanceData.行列表 || []).forEach((r) => {
          const name = (r.姓名 || '').trim()
          if (!name) return
          
          let lateCount = 0
          let leaveEarlyCount = 0
          let absenteeismCount = 0
          
          // 遍历所有出勤记录
          Object.values(r.slots || {}).forEach((status) => {
            const statusStr = (status || '').trim()
            if (statusStr === '迟到') lateCount++
            else if (statusStr === '早退') leaveEarlyCount++
            else if (statusStr === '旷课') absenteeismCount++
          })
          
          if (lateCount > 0 || leaveEarlyCount > 0 || absenteeismCount > 0) {
            attendanceStats.set(name, { late: lateCount, leaveEarly: leaveEarlyCount, absenteeism: absenteeismCount })
            console.log(`[考勤统计] ${name}: 迟到${lateCount}次, 早退${leaveEarlyCount}次, 旷课${absenteeismCount}次`)
          }
        })
      } else {
        console.warn('读取考勤表失败，无法自动统计迟到、早退、旷课')
      }

      // 性能优化：刷新/读取时仅请求“本月 + 上月”（用于计算上次分数），不再扫描历史月份。
      // 规则简化：若能读到上月剩余 => 上次分数=上月剩余；否则上次分数默认1000。

      // 合并策略：以数据库数据为主，班级档案作为补充
      // 1. 先加载数据库中的所有记录
      // 2. 如果班级档案中有人不在数据库中，则补充添加（用于新学员）
      let merged: ClassThousandScoreRow[]
      
      if (apiRows.length > 0) {
        // 数据库有数据，以数据库为主
        merged = apiRows.map(fromApiRow)
        
        // 如果班级档案有数据，检查是否有新学员需要补充
        if (roster.length > 0) {
          const existingNames = new Set(apiRows.map(r => (r.学员姓名 || '').trim()))
          const newStudents = roster.filter(r => !existingNames.has(r.姓名))
          if (newStudents.length > 0) {
            // 为新学员分配序号（从现有最大序号+1开始）
            const maxSerial = Math.max(...merged.map(r => Number(r.serialNumber) || 0), 0)
            newStudents.forEach((r, idx) => {
              merged.push(fromApiRow({ 序号: maxSerial + idx + 1, 学员姓名: r.姓名, 分类明细: {} }))
            })
          }
        }
        merged = [...merged, createAvgRow()]
      } else if (roster.length > 0) {
        // 数据库无数据，但班级档案有数据，使用班级档案初始化
        merged = roster.map((r) => fromApiRow({ 序号: r.序号, 学员姓名: r.姓名, 分类明细: {} }))
        merged = [...merged, createAvgRow()]
      } else {
        // 都没有数据，使用空白模板
        merged = initialData
      }

      // 载入后为每行计算：上次分数(取上月剩余) + 从考勤表获取迟到/早退/旷课 + 总扣分 + 剩余
      const withCalc = merged.map((row) => {
        if (row.key === 'avg') return row
        const name = (row.name || '').trim()
        
        // 使用姓名匹配上月剩余推导上次分数；否则默认1000
        let lastScore = '1000'
        if (name) {
          const lastFromPrev = prevRemainMap.get(name)
          if (lastFromPrev !== undefined && lastFromPrev.trim() !== '') {
            lastScore = lastFromPrev
          }
        }
        
        // 从考勤表获取迟到、早退、旷课数据并计算扣分
        // 重要：只在字段为空时才自动填充，如果用户已经手动填写了值，则保留用户的值
        let updatedRow = { ...row, lastScore }
        if (name && attendanceStats.has(name)) {
          const stats = attendanceStats.get(name)!
          // 迟到和早退各5分，旷课20分
          const lateScore = stats.late * 5
          const leaveEarlyScore = stats.leaveEarly * 5
          const absenteeismScore = stats.absenteeism * 20
          
          // 只在字段为空或为0时才自动填充
          const shouldFillLate = !row.late || row.late.trim() === '' || row.late === '0'
          const shouldFillLeaveEarly = !row.leaveEarly || row.leaveEarly.trim() === '' || row.leaveEarly === '0'
          const shouldFillAbsenteeism = !row.absenteeism || row.absenteeism.trim() === '' || row.absenteeism === '0'
          
          updatedRow = {
            ...updatedRow,
            late: shouldFillLate ? String(lateScore) : row.late,
            leaveEarly: shouldFillLeaveEarly ? String(leaveEarlyScore) : row.leaveEarly,
            absenteeism: shouldFillAbsenteeism ? String(absenteeismScore) : row.absenteeism,
          }
          
          if (shouldFillLate || shouldFillLeaveEarly || shouldFillAbsenteeism) {
            console.log(`[自动填充] ${name}: ${shouldFillLate ? `迟到${stats.late}次(${lateScore}分)` : '迟到(保留用户值)'}, ${shouldFillLeaveEarly ? `早退${stats.leaveEarly}次(${leaveEarlyScore}分)` : '早退(保留用户值)'}, ${shouldFillAbsenteeism ? `旷课${stats.absenteeism}次(${absenteeismScore}分)` : '旷课(保留用户值)'}`)
          }
        }
        
        const total = computeTotalDeduction(updatedRow)
        const rem = computeRemaining({ ...updatedRow, totalDeduction: total })
        return { ...updatedRow, totalDeduction: total, remainingScore: rem }
      })

      setDataSource(withCalc)
    } catch (e) {
      console.error(e)
      message.warning('未能读取千分制统计，使用空白模板')
      setDataSource(initialData)
    } finally {
      setLoading(false)
    }
  }

  const onSelectClass = async (val: string) => {
    const str = String(val)
    const classNorm = (str.includes('||') ? str.split('||')[1] : str).trim()
    const campusNorm = selectedCampus.trim()
    setSelectedClass(classNorm)
    await loadData(campusNorm, classNorm, year, month)
  }

  /**
   * 保存数据到后端
   */
  const saveToBackend = async (rows: ClassThousandScoreRow[]): Promise<boolean> => {
    if (!selectedCampus || !selectedClass) {
      message.warning('请先选择班级')
      return false
    }

    // 过滤掉平均行与没有姓名的行（后端要求姓名不能为空）
    const payloadRows: ApiRow[] = rows
      .filter((r) => r.key !== 'avg')
      .filter((r) => r.name && r.name.trim())  // 必须有姓名
      .map((r) => toApiRow(r))

    if (payloadRows.length === 0) {
      message.warning('没有需要保存的数据')
      return false
    }

    try {
      const res = await fetch(buildApiUrl('/teaching-quality/thousand-score'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          神殿名称: selectedCampus, 
          班级名称: selectedClass, 
          年份: year, 
          月份: month, 
          行列表: payloadRows 
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      return true
    } catch (e) {
      console.error('[保存失败]', e)
      throw e
    }
  }

  /**
   * 处理 Excel 文件上传
   */
  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!selectedCampus || !selectedClass) {
      message.warning('请先选择班级')
      return
    }

    try {
      setImportLoading(true)
      const arrayBuffer = await file.arrayBuffer()
      // 读取 Excel
      const workbook = XLSX.read(arrayBuffer, { 
        type: 'array', 
      })

      // 读取第一个 Sheet
      const firstSheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[firstSheetName]
      
      // 读取数据：使用 raw: true 保持原始数值类型
      const data = XLSX.utils.sheet_to_json<any[]>(sheet, { 
        header: 1, 
        defval: '',
        raw: true, // 保持原始数值类型（数字保持为数字，不转换为字符串）
      })
      
      console.log(`[Excel导入] 读取到 ${data.length} 行数据，Sheet: ${firstSheetName}`)
      
      const records = parseExcelData(data, sheet)

      if (records.length === 0) {
        message.warning('未能从 Excel 中解析出有效的学生记录')
        return
      }
      
      // 设置预览数据并打开预览弹窗
      setPreviewData(records)
      setPreviewSource('excel')
      setPreviewModalVisible(true)

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
   * 确认导入预览数据并保存到后端
   */
  const handleConfirmImport = async () => {
    if (previewData.length === 0) {
      message.warning('没有可导入的数据')
        return
      }

    try {
      setImportLoading(true)

      // 过滤掉没有姓名的记录（后端要求姓名不能为空）
      const validPreviewData = previewData.filter(r => r.name && r.name.trim())
      if (validPreviewData.length === 0) {
        message.warning('没有有效的学员记录（姓名不能为空）')
        return
      }

      // 合并策略：以姓名为主键进行合并（忽略序号）
      // 如果姓名相同，则用导入数据更新现有记录；否则追加新记录
      const existingByName = new Map<string, ClassThousandScoreRow>()
      dataSource.filter(r => r.key !== 'avg').forEach(d => {
        if (d.name && d.name.trim()) {
          existingByName.set(d.name.trim(), d)
        }
      })

      const updatedRecords: ClassThousandScoreRow[] = []
      const appendedRecords: ClassThousandScoreRow[] = []
      const processedNames = new Set<string>()

      for (const newRecord of validPreviewData) {
        const nameTrimmed = (newRecord.name || '').trim()
        if (!nameTrimmed) continue
        
        // 避免重复处理同名记录
        if (processedNames.has(nameTrimmed)) continue
        processedNames.add(nameTrimmed)

        const existing = existingByName.get(nameTrimmed)
        if (existing) {
          // 更新现有记录（保留 key）
          updatedRecords.push({
            ...newRecord,
            key: existing.key,
          })
        } else {
          appendedRecords.push(newRecord)
        }
      }

      // 合并数据：更新现有记录，追加新记录
      // 注意：只保留被更新的记录和未被导入覆盖的记录
      const updatedNames = new Set(updatedRecords.map(r => (r.name || '').trim()))
      const finalData = dataSource
        .filter(r => r.key !== 'avg')
        .filter(r => !updatedNames.has((r.name || '').trim())) // 移除将被更新的旧记录
        .concat(updatedRecords) // 添加更新后的记录
        .concat(appendedRecords) // 添加新记录

      // 重新排序（按原始序号排序）并重新分配唯一序号
      finalData.sort((a, b) => {
        const aNum = Number(a.serialNumber) || 9999
        const bNum = Number(b.serialNumber) || 9999
        return aNum - bNum
      })
      // 强制重新分配序号，确保唯一性
      finalData.forEach((record, index) => {
        record.serialNumber = index + 1
      })

      // 保存到后端
      await saveToBackend(finalData)

      // 关闭预览弹窗
      setPreviewModalVisible(false)
      setPreviewData([])
      
      // 统计批注数量
      const annotationCount = validPreviewData.reduce((sum, r) => sum + Object.keys(r.annotations || {}).length, 0)
      const successMsg = annotationCount > 0 
        ? `成功导入并保存 ${validPreviewData.length} 条记录（更新 ${updatedRecords.length} 条，新增 ${appendedRecords.length} 条），包含 ${annotationCount} 条批注`
        : `成功导入并保存 ${validPreviewData.length} 条记录（更新 ${updatedRecords.length} 条，新增 ${appendedRecords.length} 条）`
      message.success(successMsg)

      // 重新从后端加载数据以确保显示最新状态
      await loadData(selectedCampus, selectedClass, year, month)

    } catch (error: any) {
      console.error('[导入保存失败]', error)
      message.error(`导入保存失败：${error.message || '未知错误'}`)
    } finally {
      setImportLoading(false)
    }
  }

  /**
   * 解析Excel复制的TSV数据（支持带引号的多行单元格）
   * Excel复制时，包含换行的单元格会用双引号包裹，内部的双引号会转义为两个双引号
   */
  const parseTsvWithQuotes = (text: string): string[][] => {
    const rows: string[][] = []
    let currentRow: string[] = []
    let currentCell = ''
    let inQuotes = false
    let i = 0

    while (i < text.length) {
      const char = text[i]
      const nextChar = text[i + 1]

      if (inQuotes) {
        if (char === '"') {
          if (nextChar === '"') {
            // 转义的双引号 "" -> "
            currentCell += '"'
            i += 2
          } else {
            // 引号结束
            inQuotes = false
            i++
          }
        } else {
          currentCell += char
          i++
        }
      } else {
        if (char === '"') {
          // 引号开始
          inQuotes = true
          i++
        } else if (char === '\t') {
          // 制表符分隔
          currentRow.push(currentCell)
          currentCell = ''
          i++
        } else if (char === '\n' || (char === '\r' && nextChar === '\n')) {
          // 行结束
          currentRow.push(currentCell)
          if (currentRow.some(cell => cell.trim())) {
            rows.push(currentRow)
          }
          currentRow = []
          currentCell = ''
          i += (char === '\r' && nextChar === '\n') ? 2 : 1
        } else if (char === '\r') {
          // 单独的\r也作为行结束
          currentRow.push(currentCell)
          if (currentRow.some(cell => cell.trim())) {
            rows.push(currentRow)
          }
          currentRow = []
          currentCell = ''
          i++
        } else {
          currentCell += char
          i++
        }
      }
    }

    // 处理最后一个单元格和行
    if (currentCell || currentRow.length > 0) {
      currentRow.push(currentCell)
      if (currentRow.some(cell => cell.trim())) {
        rows.push(currentRow)
      }
    }

    return rows
  }

  /**
   * 解析粘贴的千分制数据
   */
  const parsePasteData = (text: string): ClassThousandScoreRow[] => {
    const parsedRows = parseTsvWithQuotes(text)
    if (parsedRows.length === 0) return []

    console.log('[粘贴导入] 解析到行数:', parsedRows.length)
    console.log('[粘贴导入] 前3行数据:', parsedRows.slice(0, 3))

    const rows: ClassThousandScoreRow[] = []

    // 查找表头行和数据起始行
    // 表头特征：包含"序号"、"姓名"等关键词
    // 数据行特征：第一列是数字，第二列是中文姓名
    let dataStartIdx = 0
    let columnMap: Record<string, number> = {}

    // 定义列名映射规则
    const columnKeywords: Record<string, string[]> = {
      serialNumber: ['序号', '编号'],
      name: ['姓名', '学员姓名', '学生姓名', '名字'],
      late: ['迟到'],
      leaveEarly: ['早退'],
      absenteeism: ['旷课', '缺勤'],
      noListenCard: ['未带听课证', '未带听课卡', '未带听'],
      smoking: ['吸烟'],
      playingGames: ['玩游戏', '打游戏'],
      watchingUnrelatedVideos: ['看与学习无关视频资料', '看无关视频', '看视频'],
      fighting: ['打架斗殴', '打架', '斗殴'],
      notReturnAtNight: ['夜不归宿', '夜不归', '夜不'],
      leave: ['请假'],
      walkingTalkingInClass: ['上课走动说话', '走动说话', '上课说话', '上课走动', '走动'],
      sleepingInClass: ['上课睡觉', '睡觉'],
      other: ['其他'],
      totalDeduction: ['总扣分', '扣分总计', '总扣'],
      bonusPoints: ['加分内容', '加分分数', '加分', '奖励分'],
      lastScore: ['上次分数', '上期分数', '上月分数', '上次'],
      remainingScore: ['剩余', '剩余分数', '剩余分'],
    }

    // 查找包含列名的行，合并多行表头
    for (let rowIdx = 0; rowIdx < Math.min(5, parsedRows.length); rowIdx++) {
      // 合并第0行到第rowIdx行作为表头
      const mergedHeader: string[] = []
      const maxCols = Math.max(...parsedRows.slice(0, rowIdx + 1).map(r => r.length))
      
      for (let col = 0; col < maxCols; col++) {
        const values: string[] = []
        for (let r = 0; r <= rowIdx; r++) {
          const cellValue = parsedRows[r]?.[col]
          if (cellValue && cellValue.trim()) {
            // 移除换行符
            values.push(cellValue.replace(/[\r\n]+/g, '').trim())
          }
        }
        mergedHeader[col] = values.join('')
      }

      // 建立列映射
      const tempMap: Record<string, number> = {}
      for (let col = 0; col < mergedHeader.length; col++) {
        const cellValue = mergedHeader[col].replace(/\s+/g, '')
        if (!cellValue) continue
        
        for (const [field, keywords] of Object.entries(columnKeywords)) {
          for (const keyword of keywords) {
            const normalizedKeyword = keyword.replace(/\s+/g, '')
            if (cellValue.includes(normalizedKeyword) || normalizedKeyword.includes(cellValue)) {
              if (!tempMap[field]) {
                tempMap[field] = col
                break
              }
            }
          }
        }
      }

      // 检查是否找到了足够的列映射
      const hasSerial = tempMap.serialNumber !== undefined
      const hasName = tempMap.name !== undefined
      const hasDeductionFields = tempMap.late !== undefined || tempMap.leave !== undefined || tempMap.smoking !== undefined

      if (hasSerial && hasName && hasDeductionFields) {
        // 检查下一行是否为数据行
        const nextRowIdx = rowIdx + 1
        if (nextRowIdx < parsedRows.length) {
          const nextRow = parsedRows[nextRowIdx]
          const serialValue = nextRow[tempMap.serialNumber]
          const nameValue = nextRow[tempMap.name]
          
          // 数据行特征：序号是数字，姓名是中文
          const isNumeric = serialValue && /^\d+$/.test(serialValue.trim())
          const isChineseName = nameValue && /[\u4e00-\u9fa5]{2,}/.test(nameValue.trim())
          
          if (isNumeric && isChineseName) {
            columnMap = tempMap
            dataStartIdx = nextRowIdx
            console.log('[粘贴导入] 找到表头，列映射:', columnMap, '数据起始行:', dataStartIdx)
            break
          }
        }
      }
    }

    // 如果没找到表头，尝试直接从第一行开始解析（假设没有表头）
    if (Object.keys(columnMap).length === 0) {
      // 检查第一行是否为数据行
      const firstRow = parsedRows[0]
      if (firstRow && firstRow.length >= 2) {
        const firstCell = firstRow[0]?.trim()
        const secondCell = firstRow[1]?.trim()
        
        if (/^\d+$/.test(firstCell) && /[\u4e00-\u9fa5]{2,}/.test(secondCell)) {
          // 第一行就是数据行，使用默认列顺序
          columnMap = {
            serialNumber: 0,
            name: 1,
            late: 2,
            leaveEarly: 3,
            absenteeism: 4,
            noListenCard: 5,
            smoking: 6,
            playingGames: 7,
            watchingUnrelatedVideos: 8,
            fighting: 9,
            notReturnAtNight: 10,
            leave: 11,
            walkingTalkingInClass: 12,
            sleepingInClass: 13,
            other: 14,
            totalDeduction: 15,
            bonusPoints: 16,
            lastScore: 17,
            remainingScore: 18,
          }
          dataStartIdx = 0
          console.log('[粘贴导入] 无表头，使用默认列顺序，数据起始行:', dataStartIdx)
        }
      }
    }

    if (Object.keys(columnMap).length === 0) {
      console.warn('[粘贴导入] 未能识别表头或数据格式')
      return []
    }

    // 解析数据行
    for (let i = dataStartIdx; i < parsedRows.length; i++) {
      const cells = parsedRows[i]
      if (!cells || cells.length === 0) continue

      const getValue = (field: string): string => {
        const colIdx = columnMap[field]
        if (colIdx === undefined) return ''
        const value = cells[colIdx]
        if (value === null || value === undefined) return ''
        return String(value).trim()
      }

      const serialNumber = getValue('serialNumber')
      const name = getValue('name')

      // 跳过空行或表头行
      if (!serialNumber && !name) continue
      if (!/^\d+$/.test(serialNumber)) continue // 序号必须是数字
      if (!/[\u4e00-\u9fa5]/.test(name)) continue // 姓名必须包含中文

      const record: ClassThousandScoreRow = {
        key: `paste-${i}-${Date.now()}`,
        serialNumber: parseInt(serialNumber, 10),
        name: name,
        late: getValue('late'),
        leaveEarly: getValue('leaveEarly'),
        absenteeism: getValue('absenteeism'),
        noListenCard: getValue('noListenCard'),
        smoking: getValue('smoking'),
        playingGames: getValue('playingGames'),
        watchingUnrelatedVideos: getValue('watchingUnrelatedVideos'),
        fighting: getValue('fighting'),
        notReturnAtNight: getValue('notReturnAtNight'),
        leave: getValue('leave'),
        walkingTalkingInClass: getValue('walkingTalkingInClass'),
        sleepingInClass: getValue('sleepingInClass'),
        other: getValue('other'),
        totalDeduction: getValue('totalDeduction'),
        bonusPoints: getValue('bonusPoints'),
        lastScore: getValue('lastScore'),
        remainingScore: getValue('remainingScore'),
        annotations: {},
      }

      // 如果总扣分为空，自动计算
      if (!record.totalDeduction) {
        record.totalDeduction = computeTotalDeductionForImport(record)
      }

      // 如果剩余为空，自动计算
      if (!record.remainingScore) {
        record.remainingScore = computeRemainingForImport(record)
      }

      console.log(`[粘贴导入] 解析记录 ${rows.length + 1}:`, { 序号: record.serialNumber, 姓名: record.name, 请假: record.leave, 总扣分: record.totalDeduction })
      rows.push(record)
    }

    return rows
  }

  /**
   * 处理粘贴数据导入 - 解析并打开预览
   */
  const handlePasteDataImport = async () => {
    if (!pasteText || !pasteText.trim()) {
      message.warning('请先粘贴数据')
      return
    }

    if (!selectedCampus || !selectedClass) {
      message.warning('请先选择班级')
      return
    }

    try {
      setImportLoading(true)

      // 使用新的解析函数
      const records = parsePasteData(pasteText)

      if (records.length === 0) {
        message.warning('未能从剪贴板中解析出有效的学生记录，请检查数据格式')
        return
      }

      // 关闭粘贴弹窗，打开预览弹窗
      setPasteModalVisible(false)
      setPasteText('')
      setPreviewData(records)
      setPreviewSource('clipboard')
      setPreviewModalVisible(true)

    } catch (error: any) {
      console.error('[剪切板导入] 解析失败:', error)
      message.error(`剪切板导入失败：${error.message || '数据格式不正确'}`)
    } finally {
      setImportLoading(false)
    }
  }

  // 需要参与“总扣分”的列
  const deductionFields: (keyof ClassThousandScoreRow)[] = [
    'late','leaveEarly','absenteeism','noListenCard','smoking','playingGames','watchingUnrelatedVideos','fighting','notReturnAtNight','leave','walkingTalkingInClass','sleepingInClass','other'
  ]
  const parseNumber = (v: string): number => {
    if (v === undefined || v === null) return 0
    const s = String(v).trim()
    if (!s) return 0
    const n = Number(s.replace(/[^\d.\-]/g, ''))
    return Number.isNaN(n) ? 0 : n
  }
  const computeTotalDeduction = (row: ClassThousandScoreRow): string => {
    let sum = 0
    let hasAny = false
    for (const f of deductionFields) {
      const raw = (row as any)[f]
      if (raw !== undefined && String(raw).trim() !== '') hasAny = true
      sum += parseNumber(raw as string)
    }
    return hasAny ? String(sum) : ''
  }
  const computeRemaining = (row: ClassThousandScoreRow): string => {
    const last = parseNumber(row.lastScore)
    const total = parseNumber(row.totalDeduction)
    const bonus = parseNumber(row.bonusPoints)  // 加上加分分数
    if (String(row.lastScore || '').trim() === '' && String(row.totalDeduction || '').trim() === '' && String(row.bonusPoints || '').trim() === '') return ''
    return String(last - total + bonus)  // 剩余 = 上次分数 - 总扣分 + 加分分数
  }

  // 生成稳定的 per-cell onChange 处理函数，避免每次渲染都创建新函数
  const handlerCacheRef = useRef<Map<string, Map<string, (e: React.ChangeEvent<HTMLInputElement>) => void>>>(new Map())
  const getCellChangeHandler = useCallback((rowKey: string, field: keyof ClassThousandScoreRow) => {
    const cache = handlerCacheRef.current
    let rowMap = cache.get(rowKey)
    if (!rowMap) {
      rowMap = new Map()
      cache.set(rowKey, rowMap)
    }
    const k = String(field)
    let fn = rowMap.get(k)
    if (!fn) {
      fn = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setDataSource((prev) => prev.map((row) => {
          if (row.key !== rowKey) return row
          let updated: ClassThousandScoreRow = { ...row, [field]: value } as ClassThousandScoreRow
          // 明细列变化时：自动重算总扣分与剩余
          if (deductionFields.includes(field)) {
            updated = { ...updated, totalDeduction: computeTotalDeduction(updated) }
          }
          // 上次分数变化、总扣分变化或加分分数变化后，自动重算剩余
          if (field === 'lastScore' || field === 'totalDeduction' || field === 'bonusPoints' || deductionFields.includes(field)) {
            updated = { ...updated, remainingScore: computeRemaining(updated) }
          }
          return updated
        }))
      }
      rowMap.set(k, fn)
    }
    return fn
  }, [])

  // 批注更新处理函数
  const getAnnotationChangeHandler = useCallback((rowKey: string, field: keyof ClassThousandScoreRow) => {
    return (annotation: string) => {
      setDataSource((prev) => prev.map((row) => {
        if (row.key !== rowKey) return row
        const annotations = { ...(row.annotations || {}), [field]: annotation }
        return { ...row, annotations }
      }))
    }
  }, [])

  // 平均行：对数值列取平均；当某列无有效数值时显示 #DIV/0!
  const computedAvgRow: ClassThousandScoreRow = useMemo(() => {
    const rows = dataSource.filter((r) => r.key !== 'avg')
    const numericFields: (keyof ClassThousandScoreRow)[] = [
      'late','leaveEarly','absenteeism','noListenCard','smoking','playingGames','watchingUnrelatedVideos','fighting','notReturnAtNight','leave','walkingTalkingInClass','sleepingInClass','other','totalDeduction','bonusPoints','lastScore','remainingScore'
    ]
    const parse = (v: string): number | null => {
      if (v === undefined || v === null) return null
      const s = String(v).trim()
      if (!s) return null
      const n = Number(s.replace(/[^\d.\-]/g, ''))
      return Number.isNaN(n) ? null : n
    }
    const avgValue = (field: keyof ClassThousandScoreRow): string => {
      let sum = 0
      let cnt = 0
      for (const r of rows) {
        const n = parse((r[field] as any) as string)
        if (n !== null) { sum += n; cnt += 1 }
      }
      if (cnt === 0) return '#DIV/0!'
      const v = sum / cnt
      const s = v.toFixed(2)
      return s.replace(/\.00$/, '').replace(/(\.\d*[1-9])0+$/, '$1')
    }
    const avgRow: ClassThousandScoreRow = {
      key: 'avg',
      serialNumber: '',
      name: '平均分',
      late: '#DIV/0!',
      leaveEarly: '#DIV/0!',
      absenteeism: '#DIV/0!',
      noListenCard: '#DIV/0!',
      smoking: '#DIV/0!',
      playingGames: '#DIV/0!',
      watchingUnrelatedVideos: '#DIV/0!',
      fighting: '#DIV/0!',
      notReturnAtNight: '#DIV/0!',
      leave: '#DIV/0!',
      walkingTalkingInClass: '#DIV/0!',
      sleepingInClass: '#DIV/0!',
      other: '#DIV/0!',
      totalDeduction: '#DIV/0!',
      bonusPoints: '#DIV/0!',  // 改为加分分数
      lastScore: '#DIV/0!',
      remainingScore: '#DIV/0!',
      annotations: {},
    }
    for (const f of numericFields) {
      ;(avgRow as any)[f] = avgValue(f)
    }
    return avgRow
  }, [dataSource])

  const tableData = useMemo(() => {
    const rows = dataSource.filter((r) => r.key !== 'avg')
    return [...rows, computedAvgRow]
  }, [dataSource, computedAvgRow])

  // 创建带批注的列定义辅助函数
  const createAnnotationColumn = useCallback((title: string, dataIndex: keyof ClassThousandScoreRow, width: number) => {
    return {
      title,
      dataIndex,
      key: dataIndex,
      width,
      align: 'center' as const,
      render: (text: string, record: ClassThousandScoreRow) => {
        if (record.key === 'avg') return <span>{text}</span>
        return (
          <AnnotationCell
            value={text}
            record={record}
            field={dataIndex}
            onChange={(v) => getCellChangeHandler(record.key, dataIndex)({target:{value:v}} as any)}
            onAnnotationChange={getAnnotationChangeHandler(record.key, dataIndex)}
          />
        )
      },
      shouldCellUpdate: (record: ClassThousandScoreRow, prev: ClassThousandScoreRow) => {
        return (record[dataIndex] as any) !== (prev[dataIndex] as any) || 
               record.key === 'avg' || 
               JSON.stringify(record.annotations?.[dataIndex]) !== JSON.stringify(prev.annotations?.[dataIndex])
      },
    }
  }, [getCellChangeHandler, getAnnotationChangeHandler])

  const columns: ColumnsType<ClassThousandScoreRow> = useMemo(() => [
    { title: '序号', dataIndex: 'serialNumber', key: 'serialNumber', width: 70, fixed: 'left', align: 'center',
      shouldCellUpdate: (record, prev) => record.serialNumber !== prev.serialNumber },
    { title: '姓名', dataIndex: 'name', key: 'name', width: 120, fixed: 'left', align: 'center', render: (text) => <span>{text}</span>,
      shouldCellUpdate: (record, prev) => record.name !== prev.name },
    {
      title: '月详细情况描述',
      children: [
        createAnnotationColumn('迟到', 'late', 80),
        createAnnotationColumn('早退', 'leaveEarly', 80),
        createAnnotationColumn('旷课', 'absenteeism', 80),
        createAnnotationColumn('未带听课证', 'noListenCard', 110),
        createAnnotationColumn('吸烟', 'smoking', 80),
        createAnnotationColumn('玩游戏', 'playingGames', 90),
        createAnnotationColumn('看与学习无关视频资料', 'watchingUnrelatedVideos', 180),
        createAnnotationColumn('打架斗殴', 'fighting', 100),
        createAnnotationColumn('夜不归宿', 'notReturnAtNight', 110),
        createAnnotationColumn('请假', 'leave', 80),
        createAnnotationColumn('上课走动说话', 'walkingTalkingInClass', 130),
        createAnnotationColumn('上课睡觉', 'sleepingInClass', 100),
        createAnnotationColumn('其他', 'other', 100),
        { title: '总扣分', dataIndex: 'totalDeduction', key: 'totalDeduction', width: 100, align: 'center',
          render: (text) => <span>{text}</span>,
          shouldCellUpdate: (record, prev) => record.totalDeduction !== prev.totalDeduction },
        createAnnotationColumn('加分分数', 'bonusPoints', 120),
        { title: '上次分数', dataIndex: 'lastScore', key: 'lastScore', width: 100, align: 'center',
          render: (text, record) => (record.key==='avg'?<span>{text}</span>:<Input value={text} onChange={getCellChangeHandler(record.key,'lastScore')} />),
          shouldCellUpdate: (record, prev) => record.lastScore !== prev.lastScore || record.key==='avg' },
        { title: '剩余', dataIndex: 'remainingScore', key: 'remainingScore', width: 100, align: 'center',
          render: (text) => <span>{text}</span>,
          shouldCellUpdate: (record, prev) => record.remainingScore !== prev.remainingScore },
      ],
    },
  ], [getCellChangeHandler, createAnnotationColumn])

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={
          <Space>
            <span>班学员千分制每月累计统计</span>
            <Select
              placeholder={selectedCampus ? '选择班级' : '请先选择神殿'}
              value={selectedClass || undefined}
              options={filteredClasses}
              onChange={onSelectClass}
              style={{ width: 260 }}
              showSearch
              disabled={!selectedCampus}
            />
            <Select
              value={year}
              onChange={async (y) => {
                setYear(y)
                if (selectedCampus && selectedClass) await loadData(selectedCampus, selectedClass, y, month)
              }}
              options={Array.from({ length: 6 }).map((_, i) => ({ label: `${today.getFullYear() - i}年`, value: today.getFullYear() - i }))}
              style={{ width: 110 }}
            />
            <Select
              value={month}
              onChange={async (m) => {
                setMonth(m)
                if (selectedCampus && selectedClass) await loadData(selectedCampus, selectedClass, year, m)
              }}
              options={Array.from({ length: 12 }).map((_, i) => ({ label: `${i + 1}月`, value: i + 1 }))}
              style={{ width: 90 }}
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
                    onClick: () => {
                      if (!selectedCampus || !selectedClass) {
                        message.warning('请先选择班级')
                        return
                      }
                      setPasteText('')
                      setPasteModalVisible(true)
                      setTimeout(() => {
                        pasteTextAreaRef.current?.focus()
                      }, 100)
                    },
                  },
                ],
              }}
              disabled={!selectedCampus || !selectedClass || importLoading}
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
            <Button onClick={() => selectedCampus && selectedClass && loadData(selectedCampus, selectedClass, year, month)}>刷新</Button>
            <Button
              type="primary"
              onClick={async () => {
                if (!selectedCampus || !selectedClass) {
                  message.warning('请先选择班级')
                  return
                }
                // 过滤掉平均行与没有姓名的行（后端要求姓名不能为空）
                const payloadRows: ApiRow[] = dataSource
                  .filter((r) => r.key !== 'avg')
                  .filter((r) => r.name && r.name.trim())  // 必须有姓名
                  .map((r) => toApiRow(r))
                if (payloadRows.length === 0) {
                  message.warning('没有需要保存的数据')
                  return
                }
                try {
                  const res = await fetch(buildApiUrl('/teaching-quality/thousand-score'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 神殿名称: selectedCampus, 班级名称: selectedClass, 年份: year, 月份: month, 行列表: payloadRows }),
                  })
                  if (!res.ok) throw new Error(await res.text())
                  const data = (await res.json()) as ApiList
                  const rows = (data.行列表 || []).map(fromApiRow)
                  // 回填后计算总扣分与剩余并合并平均行
                  const computedRows = rows.map((r) => {
                    const total = computeTotalDeduction(r)
                    const rem = computeRemaining({ ...r, totalDeduction: total })
                    return { ...r, totalDeduction: total, remainingScore: rem }
                  })
                  setDataSource([...computedRows, createAvgRow()])
                  message.success('保存成功')
                } catch (e) {
                  console.error(e)
                  message.error('保存失败')
                }
              }}
            >
              保存
            </Button>
          </Space>
        }
      >
        <Table<ClassThousandScoreRow>
          bordered
          size="small"
          columns={columns}
          dataSource={tableData}
          pagination={false}
          rowKey="key"
          scroll={{ x: 'max-content' }}
          loading={loading}
        />
      </Card>

      {/* 剪切板粘贴导入 Modal */}
      <Modal
        title="从剪贴板粘贴导入数据"
        open={pasteModalVisible}
        onOk={handlePasteDataImport}
        onCancel={() => {
          setPasteModalVisible(false)
          setPasteText('')
        }}
        okText="解析预览"
        cancelText="取消"
        width={900}
        okButtonProps={{ loading: importLoading }}
      >
        <div style={{ marginBottom: 16 }}>
          <p>请将 Excel 中的千分制数据复制后粘贴到下面的文本框中（包含表头）：</p>
          <p style={{ color: '#666', fontSize: 13, marginBottom: 8 }}>
            <strong>支持的数据格式：</strong>序号、姓名、迟到、早退、旷课、未带听课证、吸烟、玩游戏、看与学习无关视频资料、打架斗殴、夜不归宿、请假、上课走动说话、上课睡觉、其他、总扣分、加分内容、上次分数、剩余
          </p>
          <p style={{ color: '#999', fontSize: 12 }}>
            提示：在 Excel 中选择数据区域（包含表头行）后按 Ctrl+C 复制，然后在此处按 Ctrl+V 粘贴。系统会自动识别列名并解析数据。
          </p>
        </div>
        <Input.TextArea
          ref={pasteTextAreaRef}
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
          placeholder={`请粘贴 Excel 数据（包含表头行），例如：
序号	姓名	迟到	早退	旷课	...	总扣分	加分内容	上次分数	剩余
1	张三					0		1000	1000
2	李四	3				3		990	987
...`}
          rows={18}
          style={{ fontFamily: 'monospace', fontSize: 12 }}
        />
      </Modal>

      {/* 导入预览确认 Modal */}
      <Modal
        title={`导入预览 - ${previewSource === 'excel' ? 'Excel 文件' : '剪贴板数据'}`}
        open={previewModalVisible}
        onOk={handleConfirmImport}
        onCancel={() => {
          setPreviewModalVisible(false)
          setPreviewData([])
        }}
        okText="确认导入并保存"
        cancelText="取消"
        width={1200}
        okButtonProps={{ loading: importLoading }}
        styles={{ body: { maxHeight: '60vh', overflow: 'auto' } }}
      >
        <div style={{ marginBottom: 16 }}>
          <Space>
            <span>共解析到 <strong>{previewData.length}</strong> 条学员记录</span>
            {previewData.reduce((sum, r) => sum + Object.keys(r.annotations || {}).length, 0) > 0 && (
              <span style={{ color: '#1890ff' }}>
                （包含 {previewData.reduce((sum, r) => sum + Object.keys(r.annotations || {}).length, 0)} 条批注）
              </span>
            )}
          </Space>
          <p style={{ color: '#999', fontSize: 12, marginTop: 8 }}>
            确认导入后，数据将自动保存到后端数据库。如有同名学员将更新其数据。
          </p>
        </div>
        <Table
          bordered
          size="small"
          dataSource={previewData}
          rowKey="key"
          pagination={false}
          scroll={{ x: 'max-content', y: 400 }}
          columns={[
            { title: '序号', dataIndex: 'serialNumber', key: 'serialNumber', width: 60, align: 'center' },
            { title: '姓名', dataIndex: 'name', key: 'name', width: 80, align: 'center' },
            { title: '迟到', dataIndex: 'late', key: 'late', width: 60, align: 'center',
              render: (text, record) => (
                <span>
                  {text}
                  {record.annotations?.late && <CommentOutlined style={{ marginLeft: 4, color: '#1890ff' }} title={record.annotations.late} />}
                </span>
              )
            },
            { title: '早退', dataIndex: 'leaveEarly', key: 'leaveEarly', width: 60, align: 'center',
              render: (text, record) => (
                <span>
                  {text}
                  {record.annotations?.leaveEarly && <CommentOutlined style={{ marginLeft: 4, color: '#1890ff' }} title={record.annotations.leaveEarly} />}
                </span>
              )
            },
            { title: '旷课', dataIndex: 'absenteeism', key: 'absenteeism', width: 60, align: 'center',
              render: (text, record) => (
                <span>
                  {text}
                  {record.annotations?.absenteeism && <CommentOutlined style={{ marginLeft: 4, color: '#1890ff' }} title={record.annotations.absenteeism} />}
                </span>
              )
            },
            { title: '未带听课证', dataIndex: 'noListenCard', key: 'noListenCard', width: 90, align: 'center' },
            { title: '吸烟', dataIndex: 'smoking', key: 'smoking', width: 60, align: 'center' },
            { title: '玩游戏', dataIndex: 'playingGames', key: 'playingGames', width: 70, align: 'center' },
            { title: '看无关视频', dataIndex: 'watchingUnrelatedVideos', key: 'watchingUnrelatedVideos', width: 90, align: 'center' },
            { title: '打架斗殴', dataIndex: 'fighting', key: 'fighting', width: 80, align: 'center' },
            { title: '夜不归宿', dataIndex: 'notReturnAtNight', key: 'notReturnAtNight', width: 80, align: 'center' },
            { title: '请假', dataIndex: 'leave', key: 'leave', width: 60, align: 'center',
              render: (text, record) => (
                <span>
                  {text}
                  {record.annotations?.leave && <CommentOutlined style={{ marginLeft: 4, color: '#1890ff' }} title={record.annotations.leave} />}
                </span>
              )
            },
            { title: '走动说话', dataIndex: 'walkingTalkingInClass', key: 'walkingTalkingInClass', width: 80, align: 'center' },
            { title: '上课睡觉', dataIndex: 'sleepingInClass', key: 'sleepingInClass', width: 80, align: 'center' },
            { title: '其他', dataIndex: 'other', key: 'other', width: 60, align: 'center' },
            { title: '总扣分', dataIndex: 'totalDeduction', key: 'totalDeduction', width: 70, align: 'center' },
            { title: '加分', dataIndex: 'bonusPoints', key: 'bonusPoints', width: 60, align: 'center',
              render: (text, record) => (
                <span>
                  {text}
                  {record.annotations?.bonusPoints && <CommentOutlined style={{ marginLeft: 4, color: '#1890ff' }} title={record.annotations.bonusPoints} />}
                </span>
              )
            },
            { title: '上次分数', dataIndex: 'lastScore', key: 'lastScore', width: 80, align: 'center' },
            { title: '剩余', dataIndex: 'remainingScore', key: 'remainingScore', width: 60, align: 'center' },
          ]}
        />
      </Modal>
    </div>
  )
}

// ========== Excel 导入和剪切板粘贴导入功能 ==========

/**
 * 建立列名映射（支持多种可能的列名变体）
 */
const buildColumnMap = (headerRow: any[]): Record<string, number> => {
  const map: Record<string, number> = {}
  
  // 定义列名映射规则（支持带换行符的列名）
  const columnRules: Array<{ field: keyof ClassThousandScoreRow; keywords: string[] }> = [
    { field: 'serialNumber', keywords: ['序号', '编号'] },
    { field: 'name', keywords: ['姓名', '学员姓名', '学生姓名', '名字'] },
    { field: 'late', keywords: ['迟到'] },
    { field: 'leaveEarly', keywords: ['早退'] },
    { field: 'absenteeism', keywords: ['旷课', '缺勤'] },
    { field: 'noListenCard', keywords: ['未带听课证', '未带听课卡', '未带听'] },
    { field: 'smoking', keywords: ['吸烟'] },
    { field: 'playingGames', keywords: ['玩游戏', '打游戏'] },
    { field: 'watchingUnrelatedVideos', keywords: ['看与学习无关视频资料', '看无关视频', '看视频'] },
    { field: 'fighting', keywords: ['打架斗殴', '打架', '斗殴'] },
    { field: 'notReturnAtNight', keywords: ['夜不归宿', '夜不归', '夜不'] },
    { field: 'leave', keywords: ['请假'] },
    { field: 'walkingTalkingInClass', keywords: ['上课走动说话', '走动说话', '上课说话', '上课走动', '走动'] },
    { field: 'sleepingInClass', keywords: ['上课睡觉', '睡觉'] },
    { field: 'other', keywords: ['其他'] },
    { field: 'totalDeduction', keywords: ['总扣分', '扣分总计', '总扣'] },
    { field: 'bonusPoints', keywords: ['加分内容', '加分分数', '加分', '奖励分'] },
    { field: 'lastScore', keywords: ['上次分数', '上期分数', '上月分数', '上次'] },
    { field: 'remainingScore', keywords: ['剩余', '剩余分数', '剩余分'] },
  ]
  
  // 遍历表头行，建立映射
  for (let i = 0; i < headerRow.length; i++) {
    // 移除换行符和多余空白，统一处理
    const cellValue = String(headerRow[i] || '').replace(/[\r\n]+/g, '').replace(/\s+/g, '').trim()
    if (!cellValue) continue
    
    // 查找匹配的列规则
    for (const rule of columnRules) {
      for (const keyword of rule.keywords) {
        // 移除关键词中的空白进行比较
        const normalizedKeyword = keyword.replace(/\s+/g, '')
        if (cellValue.includes(normalizedKeyword) || normalizedKeyword.includes(cellValue)) {
          if (!map[rule.field]) {
            map[rule.field] = i
            break
          }
        }
      }
    }
  }
  
  return map
}

/**
 * 解析数字值
 */
const parseNumber = (v: string): number => {
  if (v === undefined || v === null) return 0
  const s = String(v).trim()
  if (!s) return 0
  const n = Number(s.replace(/[^\d.\-]/g, ''))
  return Number.isNaN(n) ? 0 : n
}

/**
 * 计算总扣分
 */
const computeTotalDeductionForImport = (row: ClassThousandScoreRow): string => {
  const deductionFields: (keyof ClassThousandScoreRow)[] = [
    'late','leaveEarly','absenteeism','noListenCard','smoking','playingGames','watchingUnrelatedVideos','fighting','notReturnAtNight','leave','walkingTalkingInClass','sleepingInClass','other'
  ]
  let sum = 0
  let hasAny = false
  for (const f of deductionFields) {
    const raw = (row as any)[f]
    if (raw !== undefined && String(raw).trim() !== '') hasAny = true
    sum += parseNumber(raw as string)
  }
  return hasAny ? String(sum) : ''
}

/**
 * 计算剩余分数
 */
const computeRemainingForImport = (row: ClassThousandScoreRow): string => {
  const last = parseNumber(row.lastScore)
  const total = parseNumber(row.totalDeduction)
  const bonus = parseNumber(row.bonusPoints)
  if (String(row.lastScore || '').trim() === '' && String(row.totalDeduction || '').trim() === '' && String(row.bonusPoints || '').trim() === '') return ''
  return String(last - total + bonus)
}

/**
 * 将列索引转换为 Excel 列字母（支持超过 Z 的列）
 * 0 -> A, 1 -> B, ..., 25 -> Z, 26 -> AA, 27 -> AB, ...
 */
const getColumnLetter = (colIndex: number): string => {
  let result = ''
  let num = colIndex
  while (num >= 0) {
    result = String.fromCharCode(65 + (num % 26)) + result
    num = Math.floor(num / 26) - 1
    if (num < 0) break
  }
  return result
}

/**
 * 判断一行是否为数据行（而非表头行）
 * 数据行的特征：序号列是数字，姓名列是中文名字（2-4个汉字）
 */
const isDataRow = (row: any[], columnMap: Record<string, number>): boolean => {
  if (!row || row.length === 0) return false
  
  const serialIdx = columnMap.serialNumber
  const nameIdx = columnMap.name
  
  // 检查序号是否为数字
  if (serialIdx !== undefined) {
    const serialValue = row[serialIdx]
    if (serialValue !== null && serialValue !== undefined) {
      const serialStr = String(serialValue).trim()
      // 序号应该是纯数字（支持数字类型和字符串类型）
      const isNumeric = typeof serialValue === 'number' || (serialStr && /^\d+$/.test(serialStr))
      if (isNumeric) {
        // 检查姓名是否像人名
        if (nameIdx !== undefined) {
          const nameValue = row[nameIdx]
          if (nameValue !== null && nameValue !== undefined) {
            const nameStr = String(nameValue).trim()
            if (nameStr) {
              // 排除列名关键词
              const headerKeywords = ['迟到', '早退', '旷课', '吸烟', '请假', '睡觉', '其他', '总扣分', '加分', '剩余', '分数', '姓名', '序号', '详细', '情况', '描述', '月']
              const isHeaderKeyword = headerKeywords.some(kw => nameStr.includes(kw))
              // 人名通常是2-4个汉字，或者包含汉字的字符串
              const hasChineseChars = /[\u4e00-\u9fa5]{2,}/.test(nameStr)
              if (!isHeaderKeyword && hasChineseChars) {
                console.log(`[isDataRow] ✓ 识别为数据行: 序号=${serialStr}, 姓名=${nameStr}`)
                return true
              }
            }
          }
        } else {
          // 没有姓名列映射，但序号是数字，也可能是数据行
          return true
        }
      }
    }
  }
  
  return false
}

/**
 * 解析 Excel 数据为 ClassThousandScoreRow 数组
 */
const parseExcelData = (data: any[][], sheet?: any): ClassThousandScoreRow[] => {
  if (data.length < 2) {
    throw new Error('Excel 数据行数不足，请确保包含表头和数据行')
  }

  // 在前10行中查找表头行
  // 支持多行表头：可能第一行是"12月详细情况描述"这样的合并标题，第二行才是具体列名
  let headerEndRowIndex = -1
  let columnMap: Record<string, number> = {}
  
  // 尝试合并前几行作为表头（处理多行表头的情况）
  // 策略：从第0行开始，逐步扩展表头范围，直到找到足够的列映射
  for (let endRow = 0; endRow < Math.min(5, data.length); endRow++) {
    // 合并第0行到第endRow行作为表头
    const mergedHeader: string[] = []
    const maxCols = Math.max(...data.slice(0, endRow + 1).map(r => r?.length || 0))
    
    for (let col = 0; col < maxCols; col++) {
      const values: string[] = []
      for (let row = 0; row <= endRow; row++) {
        const cellValue = data[row]?.[col]
        if (cellValue !== null && cellValue !== undefined && String(cellValue).trim()) {
          values.push(String(cellValue).trim())
        }
      }
      mergedHeader[col] = values.join('')
    }
    
    const map = buildColumnMap(mergedHeader)
    
    // 检查是否找到了足够的列映射
    const hasSerial = map.serialNumber !== undefined
    const hasName = map.name !== undefined
    const hasDeductionFields = map.late !== undefined || map.absenteeism !== undefined || map.leave !== undefined || map.smoking !== undefined
    
    // 需要同时有序号、姓名和至少一个扣分项
    if (hasSerial && hasName && hasDeductionFields) {
      // 验证下一行是否为数据行
      const nextRowIdx = endRow + 1
      if (nextRowIdx < data.length && isDataRow(data[nextRowIdx], map)) {
        headerEndRowIndex = endRow
        columnMap = map
        console.log(`[Excel导入] 找到表头行: 第1-${endRow + 1}行合并, 列映射:`, columnMap)
        break
      }
    }
  }
  
  // 如果合并表头没找到，尝试单行表头
  if (headerEndRowIndex < 0) {
    for (let i = 0; i < Math.min(10, data.length); i++) {
      const row = data[i]
      if (!row || row.length === 0) continue
      
      const map = buildColumnMap(row)
      // 如果找到了关键列（序号和姓名），并且下一行是数据行
      if (map.serialNumber !== undefined && map.name !== undefined) {
        const nextRowIdx = i + 1
        if (nextRowIdx < data.length && isDataRow(data[nextRowIdx], map)) {
          headerEndRowIndex = i
          columnMap = map
          console.log(`[Excel导入] 找到单行表头: 第${i + 1}行, 列映射:`, columnMap)
          break
        }
      }
    }
  }

  if (headerEndRowIndex < 0) {
    throw new Error('无法找到表头行，请确保 Excel 包含"序号"、"姓名"等列，且数据行的序号为数字')
  }

  // 解析数据行
  const records: ClassThousandScoreRow[] = []
  const dataStartRow = headerEndRowIndex + 1
  console.log(`[Excel导入] 数据起始行: 第${dataStartRow + 1}行`)

  for (let i = dataStartRow; i < data.length; i++) {
    const row = data[i]
    if (!row || row.length === 0) continue

    // 跳过空行
    const hasData = row.some((cell) => cell !== null && cell !== undefined && String(cell).trim() !== '')
    if (!hasData) continue

    // 提取各字段
    const getValue = (field: keyof ClassThousandScoreRow): string => {
      const colIndex = columnMap[field]
      if (colIndex === undefined) return ''
      const value = row[colIndex]
      if (value === null || value === undefined) return ''
      
      // 处理数字类型：直接转换为字符串（保留小数）
      if (typeof value === 'number') {
        // 如果是整数，不显示小数点
        if (Number.isInteger(value)) {
          return String(value)
        }
        // 如果是小数，保留最多2位小数
        return value.toFixed(2).replace(/\.?0+$/, '')
      }
      
      // 处理字符串：去除空白
      const strValue = String(value).trim()
      
      // 处理 Excel 错误值（如 #DIV/0!, #N/A, #VALUE! 等）
      if (strValue.startsWith('#') || strValue === '' || strValue === 'null' || strValue === 'undefined') {
        return ''
      }
      
      return strValue
    }

    // 提取批注
    const getComment = (field: keyof ClassThousandScoreRow): string => {
      if (!sheet) return ''
      const colIndex = columnMap[field]
      if (colIndex === undefined) return ''
      
      try {
        // Excel 行号从 1 开始
        // i 是循环索引，对应 data 数组中的行索引
        // Excel 中的实际行号 = i + 1（因为数组索引从0开始，Excel行号从1开始）
        const rowNum = i + 1
        const colLetter = getColumnLetter(colIndex)
        const cellAddress = `${colLetter}${rowNum}`
        const cell = sheet[cellAddress]
        
        if (!cell) return ''
        
        // XLSX 库中，批注可能存储在多个位置：
        // 1. cell.c - 单元格的批注属性（数组或对象）
        // 2. sheet['!comments'][cellAddress] - 全局批注对象
        
        // 方法1：从 cell.c 读取
        if (cell.c) {
          if (Array.isArray(cell.c) && cell.c.length > 0) {
            // 批注是数组格式：[{a: '作者', t: '批注文本'}]
            const commentObj = cell.c[0]
            const commentText = commentObj?.t || commentObj?.text || (typeof commentObj === 'string' ? commentObj : '')
            if (commentText) {
              const trimmed = String(commentText).trim()
              if (trimmed) {
                console.log(`[批注读取] ✓ ${cellAddress} (${field}):`, trimmed.substring(0, 50))
                return trimmed
              }
            }
          } else if (typeof cell.c === 'object') {
            // 批注是单个对象
            const commentText = cell.c.t || cell.c.text || ''
            if (commentText) {
              const trimmed = String(commentText).trim()
              if (trimmed) {
                console.log(`[批注读取] ✓ ${cellAddress} (${field}):`, trimmed.substring(0, 50))
                return trimmed
              }
            }
          } else if (typeof cell.c === 'string') {
            // 批注直接是字符串
            const trimmed = cell.c.trim()
            if (trimmed) {
              console.log(`[批注读取] ✓ ${cellAddress} (${field}):`, trimmed.substring(0, 50))
              return trimmed
            }
          }
        }
        
        // 方法2：从 !comments 对象读取（某些 Excel 格式）
        if (sheet['!comments'] && typeof sheet['!comments'] === 'object') {
          const commentsObj = sheet['!comments'] as any
          if (commentsObj[cellAddress]) {
            const comment = commentsObj[cellAddress]
            // 批注可能是对象 {t: '文本', a: '作者'} 或直接是字符串
            let commentText = ''
            if (typeof comment === 'string') {
              commentText = comment
            } else if (comment && typeof comment === 'object') {
              commentText = comment.t || comment.text || comment.comment || ''
            }
            if (commentText) {
              const trimmed = String(commentText).trim()
              if (trimmed) {
                console.log(`[批注读取] ✓ ${cellAddress} (${field}) from !comments:`, trimmed.substring(0, 50))
                return trimmed
              }
            }
          }
        }
        
        // 方法3：尝试从单元格的 comment 属性读取（某些格式）
        if ((cell as any).comment) {
          const commentText = String((cell as any).comment).trim()
          if (commentText) {
            console.log(`[批注读取] ✓ ${cellAddress} (${field}) from comment:`, commentText.substring(0, 50))
            return commentText
          }
        }
      } catch (error) {
        console.warn(`[批注读取] ✗ 读取字段 ${field} 的批注失败 (行${i+1}, 列${colIndex}):`, error)
      }
      return ''
    }

    const serialNumber = getValue('serialNumber')
    const name = getValue('name')

    // 如果序号和姓名都为空，跳过
    if (!serialNumber && !name) continue

    // 收集所有字段的批注
    const annotations: Record<string, string> = {}
    const fieldsWithAnnotations: (keyof ClassThousandScoreRow)[] = [
      'late', 'leaveEarly', 'absenteeism', 'noListenCard', 'smoking', 'playingGames',
      'watchingUnrelatedVideos', 'fighting', 'notReturnAtNight', 'leave',
      'walkingTalkingInClass', 'sleepingInClass', 'other', 'bonusPoints'
    ]
    
    for (const field of fieldsWithAnnotations) {
      const comment = getComment(field)
      if (comment) {
        annotations[field] = comment
      }
    }

    const record: ClassThousandScoreRow = {
      key: `imported-${i}-${Date.now()}`,
      serialNumber: serialNumber ? Number(serialNumber) || records.length + 1 : records.length + 1,
      name: name || '',
      late: getValue('late') || '',
      leaveEarly: getValue('leaveEarly') || '',
      absenteeism: getValue('absenteeism') || '',
      noListenCard: getValue('noListenCard') || '',
      smoking: getValue('smoking') || '',
      playingGames: getValue('playingGames') || '',
      watchingUnrelatedVideos: getValue('watchingUnrelatedVideos') || '',
      fighting: getValue('fighting') || '',
      notReturnAtNight: getValue('notReturnAtNight') || '',
      leave: getValue('leave') || '',
      walkingTalkingInClass: getValue('walkingTalkingInClass') || '',
      sleepingInClass: getValue('sleepingInClass') || '',
      other: getValue('other') || '',
      totalDeduction: getValue('totalDeduction') || '',
      bonusPoints: getValue('bonusPoints') || '',
      lastScore: getValue('lastScore') || '',
      remainingScore: getValue('remainingScore') || '',
      annotations: annotations,
    }
    
    // 调试日志：显示导入的数据
    if (record.name || record.late || record.absenteeism || record.leave) {
      const annotationFields = Object.keys(annotations)
      console.log(`[Excel导入] 解析记录 ${records.length + 1}:`, {
        姓名: record.name,
        序号: record.serialNumber,
        迟到: record.late,
        旷课: record.absenteeism,
        请假: record.leave,
        总扣分: record.totalDeduction,
        上次分数: record.lastScore,
        剩余: record.remainingScore,
        批注数量: annotationFields.length,
        批注字段: annotationFields.length > 0 ? annotationFields.join(', ') : '无',
      })
      if (annotationFields.length > 0) {
        annotationFields.forEach(field => {
          console.log(`  - ${field} 的批注:`, annotations[field].substring(0, 100))
        })
      }
    }

    // 如果总扣分为空，自动计算
    if (!record.totalDeduction) {
      record.totalDeduction = computeTotalDeductionForImport(record)
    }

    // 如果剩余为空，自动计算
    if (!record.remainingScore) {
      record.remainingScore = computeRemainingForImport(record)
    }

    records.push(record)
  }

  if (records.length === 0) {
    throw new Error('未能解析出有效的学生记录，请确保数据包含"序号"或"姓名"字段')
  }

  return records
}

export default ClassThousandScoreSystemPage
