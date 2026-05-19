import React, { useMemo, useState, useEffect, useRef } from 'react'
import { App, Card, Table, Input, InputNumber, Button, Space, DatePicker, Flex, Modal, Select, Popconfirm } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import axios from 'axios'
import dayjs, { Dayjs } from 'dayjs'
import { useCampusStore } from '@/stores/campusStore'
import { fetchHomeroomTeachers, type HomeroomTeacherProfile } from '@/services/configMaster'

interface EnterpriseDetail {
  enterpriseName: string
  majorDirection: string
  cooperationPeriod: string
  contactName: string
  contactPhone: string
  remark: string
}

type RowType = 'handlerSummary' | 'enterpriseDetail' | 'monthSummary'

interface ClassTeacherContractRow {
  id?: number // 仅 summary 行会有（对应后端一条记录）
  key: string
  month: number
  handler: string
  rowType: RowType

  // summary 行可编辑
  targetCount: number

  // summary 行自动
  actualCount: number

  // detail 行可编辑
  enterpriseName: string
  majorDirection: string
  cooperationPeriod: string
  contactName: string
  contactPhone: string
  remark: string

  isNew?: boolean
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1'

const safeParseEnterpriseDetails = (remark: string | undefined | null): EnterpriseDetail[] => {
  if (!remark) return []
  const t = String(remark).trim()
  if (!t) return []
  try {
    const parsed = JSON.parse(t)
    if (!Array.isArray(parsed)) return []
    return parsed
      .map((x) => ({
        enterpriseName: String(x?.enterpriseName ?? ''),
        majorDirection: String(x?.majorDirection ?? ''),
        cooperationPeriod: String(x?.cooperationPeriod ?? ''),
        contactName: String(x?.contactName ?? ''),
        contactPhone: String(x?.contactPhone ?? ''),
        remark: String(x?.remark ?? ''),
      }))
      .filter((d) =>
        [
          d.enterpriseName,
          d.majorDirection,
          d.cooperationPeriod,
          d.contactName,
          d.contactPhone,
          d.remark,
        ].some((v) => v.trim() !== ''),
      )
  } catch {
    return []
  }
}

const serializeEnterpriseDetails = (details: EnterpriseDetail[]): string => {
  const clean = (details || []).map((d) => ({
    enterpriseName: (d.enterpriseName || '').trim(),
    majorDirection: (d.majorDirection || '').trim(),
    cooperationPeriod: (d.cooperationPeriod || '').trim(),
    contactName: (d.contactName || '').trim(),
    contactPhone: (d.contactPhone || '').trim(),
    remark: (d.remark || '').trim(),
  }))
  return JSON.stringify(clean)
}

const countActual = (details: EnterpriseDetail[]): number => {
  return (details || []).filter((d) => (d.enterpriseName || '').trim() !== '').length
}

const createInitialRows = (handlers: string[]): ClassTeacherContractRow[] => {
  const effectiveHandlers = handlers.length > 0 ? handlers : ['']
  const rows: ClassTeacherContractRow[] = []
  for (let month = 1; month <= 12; month += 1) {
    effectiveHandlers.forEach((handler) => {
      rows.push({
        key: `${month}-${handler}-summary`,
        month,
        handler,
        rowType: 'handlerSummary',
        targetCount: 0,
        actualCount: 0,
        enterpriseName: '',
        majorDirection: '',
        cooperationPeriod: '',
        contactName: '',
        contactPhone: '',
        remark: '',
        isNew: true,
      })
    })
  }
  return rows
}

const ShengbangClassTeacherEnterpriseContractSummary: React.FC<{ onSaveSuccess?: () => void }> = ({ onSaveSuccess }) => {
  const { message } = App.useApp()
  const originalRowsRef = useRef<Record<string, any>>({})
  const { currentCampus } = useCampusStore()

  const [rows, setRows] = useState<ClassTeacherContractRow[]>([])
  const [loading, setLoading] = useState(false)
  const [year, setYear] = useState<number>(new Date().getFullYear())

  const [addVisible, setAddVisible] = useState(false)
  const [addMonth, setAddMonth] = useState<number>(new Date().getMonth() + 1)
  const [addHandlerName, setAddHandlerName] = useState<string>('')

  const [teacherProfiles, setTeacherProfiles] = useState<HomeroomTeacherProfile[]>([])
  const handlerNames = useMemo(() => teacherProfiles.map((t) => t.name), [teacherProfiles])

  // 先加载配置中心班主任
  useEffect(() => {
    const loadTeachers = async () => {
      if (!currentCampus) return
      try {
        const data = await fetchHomeroomTeachers({ campus_name: currentCampus, active: true })
        setTeacherProfiles(data)
      } catch (e) {
        console.error('加载班主任失败', e)
        message.error('加载班主任失败')
      }
    }
    loadTeachers()
  }, [currentCampus])

  // 班主任可用后，再加载年度数据
  useEffect(() => {
    if (!currentCampus) return
    loadYearData(year, handlerNames)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, currentCampus, handlerNames])

  const buildMonthSummaryRow = (all: ClassTeacherContractRow[], month: number): ClassTeacherContractRow => {
    const summaryRows = all.filter((r) => r.month === month && r.rowType === 'handlerSummary')
    const totalTarget = summaryRows.reduce((sum, r) => sum + (r.targetCount || 0), 0)
    const totalActual = summaryRows.reduce((sum, r) => sum + (r.actualCount || 0), 0)
    return {
      key: `${month}-monthSummary`,
      month,
      handler: '合计',
      rowType: 'monthSummary',
      targetCount: totalTarget,
      actualCount: totalActual,
      enterpriseName: '',
      majorDirection: '',
      cooperationPeriod: '',
      contactName: '',
      contactPhone: '',
      remark: '',
    }
  }

  const recomputeSummaryFor = (all: ClassTeacherContractRow[], month: number, handler: string) => {
    const details = all
      .filter((r) => r.month === month && r.handler === handler && r.rowType === 'enterpriseDetail')
      .map((r) => ({
        enterpriseName: r.enterpriseName,
        majorDirection: r.majorDirection,
        cooperationPeriod: r.cooperationPeriod,
        contactName: r.contactName,
        contactPhone: r.contactPhone,
        remark: r.remark,
      }))

    const actualCount = countActual(details)

    return all.map((r) => {
      if (r.month === month && r.handler === handler && r.rowType === 'handlerSummary') {
        return {
          ...r,
          actualCount,
        }
      }
      return r
    })
  }

  const loadYearData = async (y: number, handlers: string[]) => {
    try {
      if (!currentCampus) return
      setLoading(true)

      let base = createInitialRows(handlers)

      const reqs = Array.from({ length: 12 }, (_, idx) =>
        axios.get(`${API_BASE_URL}/teaching-quality/homeroom-contracts`, {
          params: { campus: currentCampus, year: y, month: idx + 1 },
        }),
      )

      const resps = await Promise.allSettled(reqs)

      resps.forEach((r) => {
        if (r.status !== 'fulfilled') return
        const list = r.value.data as any[]

        list.forEach((item) => {
          const month = Number(item.月份)
          const handler = String(item.班主任姓名 || '')
          const summaryKey = `${month}-${handler}-summary`

          const idx = base.findIndex((x) => x.key === summaryKey)
          if (idx < 0) return

          const parsedDetails = safeParseEnterpriseDetails(item.备注 || '')

          // 兼容旧字段：若没有 JSON 明细，但旧字段有企业名，则创建 1 条明细
          const details: EnterpriseDetail[] =
            parsedDetails.length > 0
              ? parsedDetails
              : (String(item.签约企业名称 || '').trim() !== ''
                  ? [
                      {
                        enterpriseName: item.签约企业名称 || '',
                        majorDirection: item.签约专业方向 || '',
                        cooperationPeriod: item.合作周期 || '',
                        contactName: item.企业联系人姓名 || '',
                        contactPhone: item.企业联系电话 || '',
                        remark: item.备注 || '',
                      },
                    ]
                  : [])

          // 写 summary
          base[idx] = {
            ...base[idx],
            id: item.id,
            targetCount: item.目标签约数 || 0,
            actualCount: countActual(details),
            isNew: false,
          }

          // 插入 detail 行（显示在主表里）
          // 先移除旧的同月同人的 detail（理论上 base 初始化没有，但防御）
          base = base.filter((x) => !(x.month === month && x.handler === handler && x.rowType === 'enterpriseDetail'))

          const detailRows: ClassTeacherContractRow[] = details.map((d, dIdx) => ({
            key: `${month}-${handler}-detail-${dIdx}-${item.id ?? 'new'}`,
            month,
            handler,
            rowType: 'enterpriseDetail',
            targetCount: 0,
            actualCount: 0,
            enterpriseName: d.enterpriseName,
            majorDirection: d.majorDirection,
            cooperationPeriod: d.cooperationPeriod,
            contactName: d.contactName,
            contactPhone: d.contactPhone,
            remark: d.remark,
          }))

          base.push(...detailRows)
        })
      })

      // 生成月合计行
      const months = Array.from({ length: 12 }, (_, i) => i + 1)
      // 移除已有 monthSummary
      base = base.filter((r) => r.rowType !== 'monthSummary')
      months.forEach((m) => base.push(buildMonthSummaryRow(base, m)))

      // 排序：月 -> handler顺序 -> summary -> details -> monthSummary
      const orderHandler = (name: string) => {
        const idx = handlerNames.indexOf(name)
        return idx >= 0 ? idx : 9999
      }

      base.sort((a, b) => {
        if (a.month !== b.month) return a.month - b.month
        if (a.rowType === 'monthSummary' && b.rowType !== 'monthSummary') return 1
        if (a.rowType !== 'monthSummary' && b.rowType === 'monthSummary') return -1

        const ha = orderHandler(a.handler)
        const hb = orderHandler(b.handler)
        if (ha !== hb) return ha - hb
        if (a.handler !== b.handler) return a.handler.localeCompare(b.handler)

        const typeOrder = (t: RowType) => (t === 'handlerSummary' ? 0 : t === 'enterpriseDetail' ? 1 : 2)
        const ta = typeOrder(a.rowType)
        const tb = typeOrder(b.rowType)
        if (ta !== tb) return ta - tb
        return a.key.localeCompare(b.key)
      })

      setRows(base)

      // 快照：记录 summary 行（用于判断是否有变更）
      // 关键：remark 里存的是企业明细 JSON，所以也要纳入快照，否则“改了企业明细”会被误判为无变化
      const snapshot: Record<string, any> = {}
      base
        .filter((r) => r.rowType === 'handlerSummary')
        .forEach((r) => {
          const details = safeParseEnterpriseDetails((r as any).备注 || (r as any).remark || '')
          snapshot[r.key] = {
            id: r.id,
            month: r.month,
            handler: r.handler,
            targetCount: r.targetCount || 0,
            remark: serializeEnterpriseDetails(details),
          }
        })
      originalRowsRef.current = snapshot
    } catch (error) {
      console.error('加载数据失败:', error)
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  const addHandlerSummaryRow = (month: number, handlerName: string) => {
    const key = `${month}-${handlerName}-summary`
    const exists = rows.some((r) => r.key === key)
    if (exists) {
      message.warning('该月份下已存在同名经办人')
      return
    }

    setRows((prev) => {
      const next = [...prev]
      next.push({
        key,
        month,
        handler: handlerName,
        rowType: 'handlerSummary',
        targetCount: 0,
        actualCount: 0,
        enterpriseName: '',
        majorDirection: '',
        cooperationPeriod: '',
        contactName: '',
        contactPhone: '',
        remark: '',
        isNew: true,
      })

      // 追加月合计（重算）
      const withoutMonthSummary = next.filter((r) => !(r.month === month && r.rowType === 'monthSummary'))
      withoutMonthSummary.push(buildMonthSummaryRow(withoutMonthSummary, month))

      return withoutMonthSummary
    })
  }

  const addEnterpriseRow = (month: number, handler: string) => {
    setRows((prev) => {
      let next = [...prev]
      
      // 找到该 handler 的 summary 行索引
      const summaryIndex = next.findIndex(
        (r) => r.month === month && r.handler === handler && r.rowType === 'handlerSummary'
      )
      
      if (summaryIndex === -1) {
        console.error('未找到对应的 summary 行')
        return prev
      }

      // 找到该 handler 的所有 detail 行
      const detailIndices = next
        .map((r, idx) => ({ r, idx }))
        .filter((x) => x.r.month === month && x.r.handler === handler && x.r.rowType === 'enterpriseDetail')

      // 插入位置：如果有 detail 行，插到最后一条 detail 后；否则插到 summary 后
      const insertIndex = detailIndices.length > 0 
        ? detailIndices[detailIndices.length - 1].idx + 1 
        : summaryIndex + 1

      const newRow: ClassTeacherContractRow = {
        key: `${month}-${handler}-detail-${Date.now()}-${Math.random()}`,
        month,
        handler,
        rowType: 'enterpriseDetail',
        targetCount: 0,
        actualCount: 0,
        enterpriseName: '',
        majorDirection: '',
        cooperationPeriod: '',
        contactName: '',
        contactPhone: '',
        remark: '',
        isNew: true,
      }

      next.splice(insertIndex, 0, newRow)

      // 重算该人的 actualCount + 月合计
      next = recomputeSummaryFor(next, month, handler)
      next = next.filter((r) => !(r.month === month && r.rowType === 'monthSummary'))
      next.push(buildMonthSummaryRow(next, month))

      return next
    })
  }

  const deleteRow = async (record: ClassTeacherContractRow) => {
    try {
      setLoading(true)

      // summary 删除：需要删后端记录
      if (record.rowType === 'handlerSummary' && record.id) {
        await axios.delete(`${API_BASE_URL}/teaching-quality/homeroom-contracts/${record.id}`)
      }

      setRows((prev) => {
        let next = [...prev]

        if (record.rowType === 'handlerSummary') {
          // 删除该月该人的 summary + 所有 detail
          next = next.filter((r) => !(r.month === record.month && r.handler === record.handler))
        } else if (record.rowType === 'enterpriseDetail') {
          // 删除单条 detail
          next = next.filter((r) => r.key !== record.key)
          next = recomputeSummaryFor(next, record.month, record.handler)
        }

        // 重算月合计
        next = next.filter((r) => !(r.month === record.month && r.rowType === 'monthSummary'))
        next.push(buildMonthSummaryRow(next, record.month))

        return next
      })

      message.success('已删除')
    } catch (e) {
      console.error(e)
      message.error('删除失败')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (
    key: string,
    field:
      | 'targetCount'
      | 'enterpriseName'
      | 'majorDirection'
      | 'cooperationPeriod'
      | 'contactName'
      | 'contactPhone'
      | 'remark',
    value: string | number | null,
  ) => {
    setRows((prev) => {
      let next = prev.map((row) => {
        if (row.key !== key) return row
        const v = typeof value === 'number' ? value : typeof value === 'string' ? value : ''
        return { ...row, [field]: v } as ClassTeacherContractRow
      })

      const changed = next.find((r) => r.key === key)
      if (!changed) return next

      // detail 行编辑后：重算该人的 actualCount + 月合计
      if (changed.rowType === 'enterpriseDetail') {
        next = recomputeSummaryFor(next, changed.month, changed.handler)
        next = next.filter((r) => !(r.month === changed.month && r.rowType === 'monthSummary'))
        next.push(buildMonthSummaryRow(next, changed.month))
      }

      // summary 行只影响月合计（目标变化）
      if (changed.rowType === 'handlerSummary' && field === 'targetCount') {
        next = next.filter((r) => !(r.month === changed.month && r.rowType === 'monthSummary'))
        next.push(buildMonthSummaryRow(next, changed.month))
      }

      return next
    })
  }

  const handleSaveAll = async () => {
    try {
      setLoading(true)

      // 只保存 summary 行（后端一条记录）；detail 行序列化到 summary.remark
      const summaryRows = rows.filter((r) => r.rowType === 'handlerSummary')

      // 以 summary 行为基准，反向收集其下的所有 detail 行，避免 grouped key 不一致导致漏算
      const detailsBySummaryKey: Record<string, EnterpriseDetail[]> = {}
      summaryRows.forEach((s) => {
        const details = rows
          .filter((r) => r.rowType === 'enterpriseDetail' && r.month === s.month && r.handler === s.handler)
          .map((r) => ({
            enterpriseName: r.enterpriseName,
            majorDirection: r.majorDirection,
            cooperationPeriod: r.cooperationPeriod,
            contactName: r.contactName,
            contactPhone: r.contactPhone,
            remark: r.remark,
          }))
        detailsBySummaryKey[s.key] = details
      })

      // 校验：企业名非空时，其它字段必须填（备注除外）
      const invalid: { month: number; handler: string; idx: number }[] = []
      summaryRows.forEach((s) => {
        const details = detailsBySummaryKey[s.key] || []
        details.forEach((d, idx) => {
          if ((d.enterpriseName || '').trim() === '') return
          const ok =
            (d.majorDirection || '').trim() !== '' &&
            (d.cooperationPeriod || '').trim() !== '' &&
            (d.contactName || '').trim() !== '' &&
            (d.contactPhone || '').trim() !== ''
          if (!ok) invalid.push({ month: s.month, handler: s.handler, idx: idx + 1 })
        })
      })

      if (invalid.length > 0) {
        message.error(
          `存在企业明细未填写完整：` +
            invalid
              .slice(0, 5)
              .map((x) => `${x.month}月-${x.handler}-第${x.idx}条`)
              .join('、') +
            (invalid.length > 5 ? ` 等${invalid.length}条` : ''),
        )
        return
      }

      const toSave = summaryRows.filter((s) => {
        const details = detailsBySummaryKey[s.key] || []
        const hasAny =
          (s.targetCount || 0) > 0 || details.some((d) => (d.enterpriseName || '').trim() !== '')

        // 新增：只要有内容就保存
        if (!s.id) return hasAny

        // 已存在：对比快照（目标 or 明细JSON）
        const old = originalRowsRef.current[s.key]
        if (!old) return hasAny

        const nowRemark = serializeEnterpriseDetails(details)
        return Number(old.targetCount || 0) !== Number(s.targetCount || 0) || (old.remark || '') !== nowRemark
      })

      if (toSave.length === 0) {
        message.info('没有需要保存的变更')
        return
      }

      // 准备批量保存的数据
      const batchRecords = toSave.map((r) => {
        const details = detailsBySummaryKey[r.key] || []
        return {
          神殿名称: currentCampus!,
          年份: year,
          月份: r.month,
          班主任姓名: r.handler,
          目标签约数: r.targetCount,
          实际签约数: countActual(details),
          签约企业名称: details[0]?.enterpriseName || '',
          签约专业方向: details[0]?.majorDirection || '',
          合作周期: details[0]?.cooperationPeriod || '',
          企业联系人姓名: details[0]?.contactName || '',
          企业联系电话: details[0]?.contactPhone || '',
          备注: serializeEnterpriseDetails(details),
        }
      });

      // 确保有数据才发请求（后端虽然支持空列表清空，但这里由前端控制）
      if (batchRecords.length > 0) {
        await axios.post(`${API_BASE_URL}/teaching-quality/homeroom-contracts/batch-save`, {
          神殿名称: currentCampus!,
          年份: year,
          records: batchRecords,
        })
      } else {
        // 理论上不会走到这里，因为 toSave.length === 0 时已经提前 return 了
        console.warn('没有需要保存的变更')
        return
      }

      message.success(`保存成功（${toSave.length} 条变更）`)
      await loadYearData(year, handlerNames)
      
      // 触发父组件的回调，刷新其他表
      if (onSaveSuccess) {
        onSaveSuccess()
      }
    } catch (e) {
      console.error(e)
      message.error('保存失败')
    } finally {
      setLoading(false)
    }
  }

  const orderedRows = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => i + 1)
    const orderHandler = (name: string) => {
      const idx = handlerNames.indexOf(name)
      return idx >= 0 ? idx : 9999
    }

    const copy = [...rows]

    // 确保每个月都有 monthSummary
    const withoutMonthSummary = copy.filter((r) => r.rowType !== 'monthSummary')
    const next = [...withoutMonthSummary]
    months.forEach((m) => {
      next.push(buildMonthSummaryRow(withoutMonthSummary, m))
    })

    next.sort((a, b) => {
      if (a.month !== b.month) return a.month - b.month
      if (a.rowType === 'monthSummary' && b.rowType !== 'monthSummary') return 1
      if (a.rowType !== 'monthSummary' && b.rowType === 'monthSummary') return -1

      const ha = orderHandler(a.handler)
      const hb = orderHandler(b.handler)
      if (ha !== hb) return ha - hb
      if (a.handler !== b.handler) return a.handler.localeCompare(b.handler)

      const typeOrder = (t: RowType) => (t === 'handlerSummary' ? 0 : t === 'enterpriseDetail' ? 1 : 2)
      const ta = typeOrder(a.rowType)
      const tb = typeOrder(b.rowType)
      if (ta !== tb) return ta - tb
      return a.key.localeCompare(b.key)
    })

    return next
  }, [rows, handlerNames])

  const columns: ColumnsType<ClassTeacherContractRow> = useMemo(() => {
    const rowsForSpan = orderedRows

    const monthRowSpanInfo = (() => {
      const map = new Map<number, { firstIndex: number; count: number }>()
      rowsForSpan.forEach((r, idx) => {
        const m = r.month
        if (!map.has(m)) map.set(m, { firstIndex: idx, count: 0 })
        map.get(m)!.count += 1
      })
      return map
    })()

    return [
      {
        title: '月份',
        dataIndex: 'month',
        key: 'month',
        width: 60,
        align: 'center',
        render: (_value: number, record, index) => {
          const info = monthRowSpanInfo.get(record.month)
          if (!info) return record.month
          if (record.rowType === 'monthSummary') return { children: null, props: { rowSpan: 0 } }
          if (index === info.firstIndex) return { children: record.month, props: { rowSpan: info.count } }
          return { children: null, props: { rowSpan: 0 } }
        },
      },
      {
        title: '学校经办人',
        dataIndex: 'handler',
        key: 'handler',
        width: 100,
        align: 'center',
        render: (text: string, record, index) => {
          if (record.rowType === 'monthSummary') return <span style={{ color: 'red', fontWeight: 'bold' }}>合计</span>
          
          if (record.rowType === 'handlerSummary') {
            // 计算该经办人有多少条企业明细行
            const detailCount = rowsForSpan.filter(
              (r) => r.month === record.month && r.handler === record.handler && r.rowType === 'enterpriseDetail'
            ).length
            
            // 如果有企业明细，则合并显示；否则只显示一行
            const rowSpan = detailCount > 0 ? detailCount + 1 : 1
            return {
              children: <span style={{ fontWeight: 600 }}>{text}</span>,
              props: { rowSpan }
            }
          }
          
          // enterpriseDetail 行不显示经办人
          return { children: null, props: { rowSpan: 0 } }
        },
      },
      {
        title: '签约目标数量',
        dataIndex: 'targetCount',
        key: 'targetCount',
        width: 100,
        align: 'center',
        render: (value: number, record, index) => {
          if (record.rowType === 'monthSummary') return <span style={{ color: 'red', fontWeight: 'bold' }}>{value || 0}</span>
          
          if (record.rowType === 'handlerSummary') {
            // 计算该经办人有多少条企业明细行
            const detailCount = rowsForSpan.filter(
              (r) => r.month === record.month && r.handler === record.handler && r.rowType === 'enterpriseDetail'
            ).length
            
            const rowSpan = detailCount > 0 ? detailCount + 1 : 1
            return {
              children: (
                <InputNumber
                  min={0}
                  value={value || 0}
                  style={{ width: '100%' }}
                  onChange={(v) => handleChange(record.key, 'targetCount', v ?? 0)}
                />
              ),
              props: { rowSpan }
            }
          }
          
          // enterpriseDetail 行不显示
          return { children: null, props: { rowSpan: 0 } }
        },
      },
      {
        title: '实际签约数量',
        dataIndex: 'actualCount',
        key: 'actualCount',
        width: 100,
        align: 'center',
        render: (value: number, record, index) => {
          if (record.rowType === 'monthSummary') return <span style={{ color: 'red', fontWeight: 'bold' }}>{value || 0}</span>
          
          if (record.rowType === 'handlerSummary') {
            // 计算该经办人有多少条企业明细行
            const detailCount = rowsForSpan.filter(
              (r) => r.month === record.month && r.handler === record.handler && r.rowType === 'enterpriseDetail'
            ).length
            
            const rowSpan = detailCount > 0 ? detailCount + 1 : 1
            return {
              children: value || 0,
              props: { rowSpan }
            }
          }
          
          // enterpriseDetail 行不显示
          return { children: null, props: { rowSpan: 0 } }
        },
      },
      {
        title: '签约企业名称',
        dataIndex: 'enterpriseName',
        key: 'enterpriseName',
        width: 150,
        align: 'center',
        render: (text: string, record) => {
          if (record.rowType === 'monthSummary') return null
          if (record.rowType === 'handlerSummary') {
            // 检查是否有企业明细行
            const hasDetails = rowsForSpan.some(
              (r) => r.month === record.month && r.handler === record.handler && r.rowType === 'enterpriseDetail'
            )
            // 如果没有企业明细，在 summary 行显示空输入框
            if (!hasDetails) {
              return null
            }
            return null
          }
          // enterpriseDetail 行显示输入框
          return <Input value={text} onChange={(e) => handleChange(record.key, 'enterpriseName', e.target.value)} />
        },
      },
      {
        title: '签约专业方向',
        dataIndex: 'majorDirection',
        key: 'majorDirection',
        width: 120,
        align: 'center',
        render: (text: string, record) => {
          if (record.rowType === 'monthSummary') return null
          if (record.rowType === 'handlerSummary') return null
          return <Input value={text} onChange={(e) => handleChange(record.key, 'majorDirection', e.target.value)} />
        },
      },
      {
        title: '合作周期',
        dataIndex: 'cooperationPeriod',
        key: 'cooperationPeriod',
        width: 100,
        align: 'center',
        render: (text: string, record) => {
          if (record.rowType === 'monthSummary') return null
          if (record.rowType === 'handlerSummary') return null
          return <Input value={text} onChange={(e) => handleChange(record.key, 'cooperationPeriod', e.target.value)} />
        },
      },
      {
        title: '企业联系人姓名',
        dataIndex: 'contactName',
        key: 'contactName',
        width: 120,
        align: 'center',
        render: (text: string, record) => {
          if (record.rowType === 'monthSummary') return null
          if (record.rowType === 'handlerSummary') return null
          return <Input value={text} onChange={(e) => handleChange(record.key, 'contactName', e.target.value)} />
        },
      },
      {
        title: '企业联系电话',
        dataIndex: 'contactPhone',
        key: 'contactPhone',
        width: 120,
        align: 'center',
        render: (text: string, record) => {
          if (record.rowType === 'monthSummary') return null
          if (record.rowType === 'handlerSummary') return null
          return <Input value={text} onChange={(e) => handleChange(record.key, 'contactPhone', e.target.value)} />
        },
      },
      {
        title: '备注',
        dataIndex: 'remark',
        key: 'remark',
        width: 150,
        align: 'center',
        render: (text: string, record) => {
          if (record.rowType === 'monthSummary') return null
          if (record.rowType === 'handlerSummary') return null
          return <Input value={text} onChange={(e) => handleChange(record.key, 'remark', e.target.value)} />
        },
      },
      {
        title: '操作',
        key: 'actions',
        width: 140,
        align: 'center',
        render: (_, record, index) => {
          if (record.rowType === 'monthSummary') return null

          if (record.rowType === 'handlerSummary') {
            // 计算该经办人有多少条企业明细行
            const detailCount = rowsForSpan.filter(
              (r) => r.month === record.month && r.handler === record.handler && r.rowType === 'enterpriseDetail'
            ).length
            
            const rowSpan = detailCount > 0 ? detailCount + 1 : 1
            
            return {
              children: (
                <Space>
                  <a onClick={() => addEnterpriseRow(record.month, record.handler)}>新增企业</a>
                  <Popconfirm title="确认删除该经办人当月所有行？" onConfirm={() => deleteRow(record)}>
                    <a>删除</a>
                  </Popconfirm>
                </Space>
              ),
              props: { rowSpan }
            }
          }

          // detail 行显示删除按钮
          return (
            <Popconfirm title="确认删除该企业行？" onConfirm={() => deleteRow(record)}>
              <a>删除</a>
            </Popconfirm>
          )
        },
      },
    ]
  }, [orderedRows])

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={
          <Flex align="center" justify="space-between" wrap>
            <div>03-2{currentCampus || ''}教化司班主任企业签约目标与结果汇总表</div>
            <Space>
              <span>年份：</span>
              <DatePicker
                picker="year"
                value={dayjs(`${year}-01-01`, 'YYYY-MM-DD') as Dayjs}
                onChange={(d) => {
                  const y = (d || dayjs()).year()
                  setYear(y)
                }}
              />
              <Button onClick={() => setAddVisible(true)}>新增经办人</Button>
              <Button type="primary" onClick={handleSaveAll} loading={loading}>
                保存
              </Button>
            </Space>
          </Flex>
        }
      >
        <Table<ClassTeacherContractRow>
          bordered
          size="small"
          columns={columns}
          dataSource={orderedRows}
          pagination={false}
          rowKey="key"
          scroll={{ x: 'max-content' }}
          loading={loading}
        />
      </Card>

      <Modal
        title="新增学校经办人"
        open={addVisible}
        onOk={() => {
          if (!addHandlerName || !addMonth) {
            message.warning('请输入经办人姓名并选择月份')
            return
          }
          addHandlerSummaryRow(addMonth, addHandlerName.trim())
          setAddVisible(false)
          setAddHandlerName('')
        }}
        onCancel={() => setAddVisible(false)}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <span>月份：</span>
            <Select
              value={addMonth}
              onChange={(v) => setAddMonth(v)}
              style={{ width: 200 }}
              options={Array.from({ length: 12 }, (_, i) => ({ label: `${i + 1}`, value: i + 1 }))}
            />
          </div>
          <div>
            <span>学校经办人：</span>
            <Select
              placeholder="请选择经办人（来自配置中心班主任）"
              value={addHandlerName || undefined}
              onChange={(v) => setAddHandlerName(v)}
              style={{ width: 200 }}
              options={handlerNames.map((n) => ({ label: n, value: n }))}
              disabled={handlerNames.length === 0}
              allowClear
            />
          </div>
        </Space>
      </Modal>
    </div>
  )
}

export default ShengbangClassTeacherEnterpriseContractSummary
