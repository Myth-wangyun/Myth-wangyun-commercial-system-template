import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { App, Table, Spin, InputNumber, Button, Space, Input } from 'antd'
import { SaveOutlined, ReloadOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import weekOfYear from 'dayjs/plugin/weekOfYear'
import isoWeek from 'dayjs/plugin/isoWeek'
import { useCampusStore } from '@/stores/campusStore'

dayjs.extend(weekOfYear)
dayjs.extend(isoWeek)

interface ProductionDetailRecord {
    sequence: number
    copywriting_date?: string
    theme?: string
    target_audience?: string
    campus?: string
    actual_shooting_date?: string
    video_name?: string
    duration?: number
    remark_link?: string
}

interface ShootingDetailRecord {
    shooting_date?: string
    shooting_campus?: string
    appearing_teacher?: string
    responsible_campus?: string
}

interface WeeklyData {
    key: string
    rowType: 'month-summary' | 'summary' | 'campus'  // 月合计行 | 周汇总行 | 神殿行
    week: string
    weekDateRange: string
    campus: string
    audienceTypeCount: number  // 人群类别数量（去重后）
    plannedArticles: number
    actualArticles: number
    plannedEditDemand: number
    completedEditDemand: number
    actualShootVideos: number
    shootEditCompletionRate: string
    shootCompletionProgress: string
    monthlyEditPlans: number
    completedEarlyPlans: number
    actualEditedVideos: number
    editProgressRate: string
    releasedVideoCount: number
    releaseRate: string
    auditPassVideoCount: number
    auditPassRate: string
    groupActivity: string
}

interface WeeklyEditReportTabProps {
    year: string
    month: string
}

// 判断是否为有效的URL
const isValidUrl = (str: string | undefined): boolean => {
    if (!str || !str.trim()) return false
    try {
        // 检查是否包含http或https
        const urlPattern = /https?:\/\/[^\s]+/i
        return urlPattern.test(str)
    } catch {
        return false
    }
}

// 计算比率
const calculateRate = (numerator: number, denominator: number): string => {
    if (denominator === 0 || numerator === 0) return '0%'
    return ((numerator / denominator) * 100).toFixed(2) + '%'
}

// 重新计算所有进度比率
const recalculateProgressRates = (data: WeeklyData[]): WeeklyData[] => {
    return data.map(item => {
        const currentItem = { ...item }
        
        // 拍摄完成进度 = 实际拍摄次数 / 计划拍摄次数
        if (currentItem.plannedEditDemand > 0 && currentItem.actualShootVideos > 0) {
            currentItem.shootCompletionProgress = calculateRate(currentItem.actualShootVideos, currentItem.plannedEditDemand)
        } else {
            currentItem.shootCompletionProgress = '0%'
        }

        // 剪辑完成进度 = 实际完成剪辑数 / 本月计划剪辑数
        if (currentItem.monthlyEditPlans > 0 && currentItem.actualEditedVideos > 0) {
            currentItem.editProgressRate = calculateRate(currentItem.actualEditedVideos, currentItem.monthlyEditPlans)
        } else {
            currentItem.editProgressRate = '0%'
        }

        // 审核通过率 = 审核通过数 / 实际完成剪辑数
        if (currentItem.actualEditedVideos > 0 && currentItem.auditPassVideoCount > 0) {
            currentItem.auditPassRate = calculateRate(currentItem.auditPassVideoCount, currentItem.actualEditedVideos)
        } else {
            currentItem.auditPassRate = '0%'
        }

        return currentItem
    })
}

// 重新计算合计行的人群类别（从神殿行重新计算）
const recalculateAudienceTypeSummary = (data: WeeklyData[]): WeeklyData[] => {
    const result = [...data]
    
    // 数据结构：summary行 或 month-summary行 后面跟着对应的 campus 行
    // 找到所有的组（一个 summary/month-summary 行 + 后面的 campus 行）
    type WeekGroup = {
        summaryIndex: number
        isMonthSummary: boolean
        audienceTypes: number[]
    }
    
    const weekGroups: WeekGroup[] = []
    let currentGroup: WeekGroup | null = null
    
    result.forEach((item, index) => {
        if (item.rowType === 'summary') {
            // 新的周合计行，开始新组
            if (currentGroup) {
                weekGroups.push(currentGroup)
            }
            currentGroup = {
                summaryIndex: index,
                isMonthSummary: false,
                audienceTypes: []
            }
        } else if (item.rowType === 'month-summary') {
            // 月合计行
            if (currentGroup) {
                weekGroups.push(currentGroup)
            }
            currentGroup = {
                summaryIndex: index,
                isMonthSummary: true,
                audienceTypes: []
            }
        } else if (item.rowType === 'campus' && currentGroup) {
            // 神殿行，添加到当前组
            if (item.audienceTypeCount > 0) {
                currentGroup.audienceTypes.push(item.audienceTypeCount)
            }
        }
    })
    
    // 如果最后还有未完成的组，添加进去
    if (currentGroup) {
        weekGroups.push(currentGroup)
    }
    
    // 计算每组合计行的人群类别
    const weekAvgValues: number[] = [] // 存储各周的平均值（用于最后计算月平均）
    
    weekGroups.forEach(group => {
        const avgValue = group.audienceTypes.length > 0
            ? Math.round(group.audienceTypes.reduce((a, b) => a + b, 0) / group.audienceTypes.length * 10) / 10
            : 0
        
        // 更新合计行
        result[group.summaryIndex] = { ...result[group.summaryIndex], audienceTypeCount: avgValue }
        
        // 只收集周合计的平均值，不收集月合计
        if (!group.isMonthSummary && avgValue > 0) {
            weekAvgValues.push(avgValue)
        }
    })
    
    // 如果有多个周组，需要重新计算月合计行（月合计 = 各周平均值的平均）
    if (weekAvgValues.length > 0) {
        const monthSummaryIndex = result.findIndex(item => item.rowType === 'month-summary')
        if (monthSummaryIndex !== -1) {
            const monthAvg = Math.round(weekAvgValues.reduce((a, b) => a + b, 0) / weekAvgValues.length * 10) / 10
            result[monthSummaryIndex] = { ...result[monthSummaryIndex], audienceTypeCount: monthAvg }
        }
    }
    
    return result
}

const WeeklyEditReportTab: React.FC<WeeklyEditReportTabProps> = ({ year, month }) => {
  const { message } = App.useApp()
    const [dataSource, setDataSource] = useState<WeeklyData[]>([])
    const [loading, setLoading] = useState(false)
    const getAllCampuses = useCampusStore(state => state.getAllCampuses)

    // 获取排序后的神殿名称列表
    const campusList = useMemo(() => {
        return getAllCampuses().map(c => c.name.replace('神殿', ''))
    }, [getAllCampuses])

    // 获取月份天数
    const getDaysInMonth = (year: string, month: string) => {
        return dayjs(`${year}-${month}`).daysInMonth()
    }

    // 获取某一天属于月份的第几周（按周一到周日划分）
    const getWeekOfMonth = useCallback((year: string, month: string, day: number): number => {
        const date = dayjs(`${year}-${month}-${String(day).padStart(2, '0')}`)
        // 使用isoWeekday获取该日期所在ISO周的周一（ISO周从周一开始）
        const monday = date.startOf('isoWeek')
        
        // 获取当月1号所在ISO周的周一
        const firstDayOfMonth = dayjs(`${year}-${month}-01`)
        const firstMonday = firstDayOfMonth.startOf('isoWeek')
        
        // 计算周数差异
        const weeksDiff = monday.diff(firstMonday, 'week')
        
        return weeksDiff + 1
    }, [])

    // 生成每周的日期范围（按周一到周日划分）
    const generateWeekRanges = useCallback((year: string, month: string): Map<number, { start: number, end: number, dates: number[] }> => {
        const daysInMonth = getDaysInMonth(year, month)
        const weekMap = new Map<number, { start: number, end: number, dates: number[] }>()

        for (let day = 1; day <= daysInMonth; day++) {
            const date = dayjs(`${year}-${month}-${String(day).padStart(2, '0')}`)
            
            // 获取该日期所在ISO周的周一和周日
            const monday = date.startOf('isoWeek')
            const sunday = date.endOf('isoWeek')
            
            // 计算周数
            const weekNum = getWeekOfMonth(year, month, day)
            
            if (!weekMap.has(weekNum)) {
                // 计算该周在本月的起始和结束日期
                const currentMonthNum = parseInt(month)
                
                // 周一如果在本月，就用周一的日期；否则用1号
                const weekStart = (monday.year() === parseInt(year) && monday.month() + 1 === currentMonthNum) 
                    ? monday.date() 
                    : 1
                
                // 周日如果在本月，就用周日的日期；否则用本月最后一天
                const weekEnd = (sunday.year() === parseInt(year) && sunday.month() + 1 === currentMonthNum) 
                    ? sunday.date() 
                    : daysInMonth
                
                weekMap.set(weekNum, { 
                    start: weekStart, 
                    end: weekEnd, 
                    dates: [day] 
                })
            } else {
                const week = weekMap.get(weekNum)!
                week.dates.push(day)
            }
        }

        return weekMap
    }, [getWeekOfMonth])

    // 从后端加载已保存的数据
    const loadSavedData = useCallback(async (): Promise<WeeklyData[] | null> => {
        try {
            const yearNum = parseInt(year)
            const monthNum = parseInt(month)

            const response = await fetch(`/api/v1/market/weekly-edit-report?year=${yearNum}&month=${monthNum}`)

            if (response.ok) {
                const data = await response.json()
                if (data.items && data.items.length > 0) {
                    // 将后端返回的数据转换为前端格式
                    // key 需要使用正确的格式以便 handleFieldChange 中的汇总计算正常工作
                    return data.items.map((item: any) => {
                        // 根据 row_type 和 week 生成正确格式的 key
                        let key: string
                        if (item.row_type === 'month-summary') {
                            key = 'month-summary'
                        } else if (item.row_type === 'summary') {
                            key = `${item.week}-summary`
                        } else if (item.row_type === 'campus') {
                            // 判断是月神殿合计行还是周神殿行
                            if (item.week === 0) {
                                key = `month-${item.campus}`
                            } else {
                                key = `${item.week}-${item.campus}`
                            }
                        } else {
                            key = `saved-${item.id}`
                        }
                        
                        return {
                            key,
                            rowType: item.row_type,
                            week: item.week_label || '',
                            weekDateRange: item.week_date_range || '',
                            campus: item.campus || '',
                            audienceTypeCount: item.audience_type_count || 0,
                            plannedArticles: item.planned_articles || 0,
                            actualArticles: item.actual_articles || 0,
                            plannedEditDemand: item.planned_edit_demand || 0,
                            completedEditDemand: item.completed_edit_demand || 0,
                            actualShootVideos: item.actual_shoot_videos || 0,
                            shootEditCompletionRate: item.shoot_edit_completion_rate || '',
                            shootCompletionProgress: item.shoot_completion_progress || '',
                            monthlyEditPlans: item.monthly_edit_plans || 0,
                            completedEarlyPlans: item.completed_early_plans || 0,
                            actualEditedVideos: item.actual_edited_videos || 0,
                            editProgressRate: item.edit_progress_rate || '',
                            releasedVideoCount: item.released_video_count || 0,
                            releaseRate: item.release_rate || '',
                            auditPassVideoCount: item.audit_pass_video_count || 0,
                            auditPassRate: item.audit_pass_rate || '',
                            groupActivity: item.group_activity || '',
                        }
                    })
                }
            }
            return null
        } catch (error) {
            console.error('加载保存的数据失败:', error)
            return null
        }
    }, [year, month])

    // 从制作明细获取数据并按神殿和周统计
    const fetchAndProcessData = useCallback(async () => {
        setLoading(true)
        try {
            // 先尝试加载已保存的数据
            const savedData = await loadSavedData()
            if (savedData && savedData.length > 0) {
                console.log('使用已保存的数据:', savedData)
                
                // 重新生成周范围，确保日期范围正确
                const weekRanges = generateWeekRanges(year, month)
                
                // 更新已保存数据中的日期范围
                const updatedData = savedData.map(item => {
                    if (item.rowType === 'summary') {
                        // 从 key 中提取周数（格式：1-summary, 2-summary）
                        const weekNum = parseInt(item.key.split('-')[0])
                        const range = weekRanges.get(weekNum)
                        if (range) {
                            return {
                                ...item,
                                weekDateRange: `${parseInt(month)}月${range.start}日-${parseInt(month)}月${range.end}日`
                            }
                        }
                    }
                    return item
                })
                
                // 重新计算所有进度比率和合计行的人群类别
                let recalculatedData = recalculateProgressRates(updatedData)
                recalculatedData = recalculateAudienceTypeSummary(recalculatedData)
                setDataSource(recalculatedData)
                setLoading(false)
                return
            }

            // 如果没有已保存的数据，则从制作明细和拍摄明细统计生成
            const yearNum = parseInt(year)
            const monthNum = parseInt(month)

            console.log('正在获取制作明细和拍摄明细数据...', { year: yearNum, month: monthNum })
            
            // 并行获取制作明细和拍摄明细
            const [productionResponse, shootingResponse] = await Promise.all([
                fetch(`/api/v1/market/video-production-detail?year=${yearNum}&month=${monthNum}`),
                fetch(`/api/v1/market/shooting-detail?year=${yearNum}&month=${monthNum}`)
            ])

            let productionDetails: ProductionDetailRecord[] = []
            let shootingDetails: ShootingDetailRecord[] = []
            
            if (productionResponse.ok) {
                const data = await productionResponse.json()
                console.log('获取到制作明细数据:', data)
                productionDetails = data.items || []
            } else {
                console.warn('获取制作明细数据失败:', productionResponse.status)
            }

            if (shootingResponse.ok) {
                const data = await shootingResponse.json()
                console.log('获取到拍摄明细数据:', data)
                shootingDetails = data.items || []
            } else {
                console.warn('获取拍摄明细数据失败:', shootingResponse.status)
            }

            // 生成周范围
            const weekRanges = generateWeekRanges(year, month)
            const weeks = Array.from(weekRanges.keys()).sort((a, b) => a - b)

            // 按神殿和周统计数据
            const processedData: WeeklyData[] = []

            // ========== 首先按周统计数据 ==========
            const weekSummaries: Map<number, {
                totalRecordCount: number,
                totalAuditPassCount: number,
                totalShootingCount: number,
                totalAudienceTypeCount: number,
                campusStats: Map<string, {
                    recordCount: number,
                    auditPassCount: number,
                    audienceTypes: Set<string>,
                    shootingCount: number
                }>
            }> = new Map()

            weeks.forEach((weekNum) => {
                const range = weekRanges.get(weekNum)!
                const weekDateRange = `${parseInt(month)}月${range.start}日-${parseInt(month)}月${range.end}日`
                const weekLabel = `第${weekNum}周`

                // 获取该周的所有记录
                const weekRecords = productionDetails.filter(record => {
                    // 根据文案日期或实际拍摄日期判断属于哪一周
                    const dateStr = record.copywriting_date || record.actual_shooting_date
                    if (!dateStr) return false
                    const recordDate = dayjs(dateStr)
                    if (recordDate.year() !== yearNum || recordDate.month() + 1 !== monthNum) return false
                    const day = recordDate.date()
                    return range.dates.includes(day)
                })

                // 各神殿统计
                const campusStats: Map<string, {
                    recordCount: number,
                    auditPassCount: number,
                    audienceTypes: Set<string>,
                    shootingCount: number
                }> = new Map()

                // 初始化所有神殿
                campusList.forEach(campus => {
                    campusStats.set(campus, {
                        recordCount: 0,
                        auditPassCount: 0,
                        audienceTypes: new Set(),
                        shootingCount: 0
                    })
                })

                // 遍历该周记录，按神殿统计
                weekRecords.forEach(record => {
                    // 神殿名称匹配（可能是"晋美"或"李大殿"）
                    let matchedCampus = ''
                    for (const campus of campusList) {
                        if (record.campus?.includes(campus) || campus.includes(record.campus || '')) {
                            matchedCampus = campus
                            break
                        }
                    }

                    if (matchedCampus && campusStats.has(matchedCampus)) {
                        const stats = campusStats.get(matchedCampus)!
                        stats.recordCount += 1

                        // 检查备注链接是否包含有效URL，算作审核通过
                        if (isValidUrl(record.remark_link)) {
                            stats.auditPassCount += 1
                        }

                        // 收集人群类别（支持逗号分隔的多选）
                        if (record.target_audience) {
                            record.target_audience.split(',').forEach(audience => {
                                const trimmed = audience.trim()
                                if (trimmed) {
                                    stats.audienceTypes.add(trimmed)
                                }
                            })
                        }
                    }
                })

                // 获取该周的拍摄明细记录
                const weekShootingRecords = shootingDetails.filter(record => {
                    const dateStr = record.shooting_date
                    if (!dateStr) return false
                    const recordDate = dayjs(dateStr)
                    if (recordDate.year() !== yearNum || recordDate.month() + 1 !== monthNum) return false
                    const day = recordDate.date()
                    return range.dates.includes(day)
                })

                // 按神殿统计拍摄次数 - 只按拍摄神殿统计
                weekShootingRecords.forEach(record => {
                    let matchedCampus = ''
                    // 只使用拍摄神殿来判断，不使用承担神殿
                    const campusField = record.shooting_campus || ''
                    for (const campus of campusList) {
                        if (campusField.includes(campus) || campus.includes(campusField)) {
                            matchedCampus = campus
                            break
                        }
                    }

                    if (matchedCampus && campusStats.has(matchedCampus)) {
                        const stats = campusStats.get(matchedCampus)!
                        stats.shootingCount += 1
                    }
                })

                // 计算该周汇总数据
                let totalRecordCount = 0
                let totalAuditPassCount = 0
                let totalShootingCount = 0
                let totalAudienceTypeCount = 0
                let campusWithDataCount = 0  // 有数据的神殿数量
                campusStats.forEach(stats => {
                    totalRecordCount += stats.recordCount
                    totalAuditPassCount += stats.auditPassCount
                    totalShootingCount += stats.shootingCount
                    totalAudienceTypeCount += stats.audienceTypes.size
                    if (stats.audienceTypes.size > 0) {
                        campusWithDataCount += 1
                    }
                })
                // 周人群类别合计 = 有数据的神殿人群类别的简单平均（保留一位小数）
                const avgAudienceTypeCount = campusWithDataCount > 0
                    ? Math.round(totalAudienceTypeCount / campusWithDataCount * 10) / 10
                    : 0

                // 保存该周汇总数据用于月合计计算
                weekSummaries.set(weekNum, {
                    totalRecordCount,
                    totalAuditPassCount,
                    totalShootingCount,
                    totalAudienceTypeCount: avgAudienceTypeCount,
                    campusStats: new Map(campusStats)
                })

                // 添加该周合计行
                processedData.push({
                    key: `${weekNum}-summary`,
                    rowType: 'summary',
                    week: weekLabel,
                    weekDateRange: weekDateRange,
                    campus: '合计',
                    audienceTypeCount: avgAudienceTypeCount,
                    plannedArticles: 0,
                    actualArticles: 0,
                    plannedEditDemand: 0,
                    completedEditDemand: 0,
                    actualShootVideos: totalShootingCount,
                    shootEditCompletionRate: '#DIV/0!',
                    shootCompletionProgress: '#DIV/0!',
                    monthlyEditPlans: 0,
                    completedEarlyPlans: 0,
                    actualEditedVideos: totalRecordCount,
                    editProgressRate: '#DIV/0!',
                    releasedVideoCount: 0,
                    releaseRate: '#DIV/0!',
                    auditPassVideoCount: totalAuditPassCount,
                    auditPassRate: calculateRate(totalAuditPassCount, totalRecordCount),
                    groupActivity: '',
                })

                // 添加该周各神殿行
                campusList.forEach(campus => {
                    const stats = campusStats.get(campus)!

                    processedData.push({
                        key: `${weekNum}-${campus}`,
                        rowType: 'campus',
                        week: '',
                        weekDateRange: '',
                        campus: campus,
                        audienceTypeCount: stats.audienceTypes.size,
                        plannedArticles: 0,
                        actualArticles: 0,
                        plannedEditDemand: 0,
                        completedEditDemand: 0,
                        actualShootVideos: stats.shootingCount,
                        shootEditCompletionRate: '0%',
                        shootCompletionProgress: '0%',
                        monthlyEditPlans: 0,
                        completedEarlyPlans: 0,
                        actualEditedVideos: stats.recordCount,
                        editProgressRate: '0%',
                        releasedVideoCount: 0,
                        releaseRate: '0%',
                        auditPassVideoCount: stats.auditPassCount,
                        auditPassRate: calculateRate(stats.auditPassCount, stats.recordCount),
                        groupActivity: '',
                    })
                })
            })

            // ========== 然后计算当月总合计（从各周汇总计算而来） ==========
            let monthTotalRecordCount = 0
            let monthTotalAuditPassCount = 0
            let monthTotalShootingCount = 0
            let monthTotalAudienceTypeCount = 0
            let weeksWithDataCount = 0  // 有人群类别数据的周数

            weekSummaries.forEach(weekSummary => {
                monthTotalRecordCount += weekSummary.totalRecordCount
                monthTotalAuditPassCount += weekSummary.totalAuditPassCount
                monthTotalShootingCount += weekSummary.totalShootingCount
                monthTotalAudienceTypeCount += weekSummary.totalAudienceTypeCount
                if (weekSummary.totalAudienceTypeCount > 0) {
                    weeksWithDataCount += 1
                }
            })

            // 月人群类别合计 = 有数据的各周人群类别平均值的简单平均（保留一位小数）
            const monthAvgAudienceTypeCount = weeksWithDataCount > 0
                ? Math.round(monthTotalAudienceTypeCount / weeksWithDataCount * 10) / 10
                : 0

            // 添加当月总合计行（插入到最前面）
            processedData.unshift({
                key: `month-summary`,
                rowType: 'month-summary',
                week: `${parseInt(month)}月份`,
                weekDateRange: '',
                campus: '合计',
                audienceTypeCount: monthAvgAudienceTypeCount,
                plannedArticles: 0,
                actualArticles: 0,
                plannedEditDemand: 0,
                completedEditDemand: 0,
                actualShootVideos: monthTotalShootingCount,
                shootEditCompletionRate: '0%',
                shootCompletionProgress: '0%',
                monthlyEditPlans: 0,
                completedEarlyPlans: 0,
                actualEditedVideos: monthTotalRecordCount,
                editProgressRate: '0%',
                releasedVideoCount: 0,
                releaseRate: '0%',
                auditPassVideoCount: monthTotalAuditPassCount,
                auditPassRate: calculateRate(monthTotalAuditPassCount, monthTotalRecordCount),
                groupActivity: '',
            })

            // ========== 添加当月各神殿行（从各周神殿数据汇总而来） ==========
            campusList.forEach((campus, index) => {
                let campusRecordCount = 0
                let campusAuditPassCount = 0
                let campusShootingCount = 0
                const campusAudienceTypes = new Set<string>()

                weekSummaries.forEach(weekSummary => {
                    const stats = weekSummary.campusStats.get(campus)
                    if (stats) {
                        campusRecordCount += stats.recordCount
                        campusAuditPassCount += stats.auditPassCount
                        campusShootingCount += stats.shootingCount
                        stats.audienceTypes.forEach(type => campusAudienceTypes.add(type))
                    }
                })

                processedData.splice(1 + index, 0, {  // 插入到月合计行之后，按顺序插入
                    key: `month-${campus}`,
                    rowType: 'campus',
                    week: '',
                    weekDateRange: '',
                    campus: campus,
                    audienceTypeCount: campusAudienceTypes.size,
                    plannedArticles: 0,
                    actualArticles: 0,
                    plannedEditDemand: 0,
                    completedEditDemand: 0,
                    actualShootVideos: campusShootingCount,
                    shootEditCompletionRate: '0%',
                    shootCompletionProgress: '0%',
                    monthlyEditPlans: 0,
                    completedEarlyPlans: 0,
                    actualEditedVideos: campusRecordCount,
                    editProgressRate: '0%',
                    releasedVideoCount: 0,
                    releaseRate: '0%',
                    auditPassVideoCount: campusAuditPassCount,
                    auditPassRate: calculateRate(campusAuditPassCount, campusRecordCount),
                    groupActivity: '',
                })
            })

            // 重新计算所有进度比率
            const recalculatedData = recalculateProgressRates(processedData)
            setDataSource(recalculatedData)
        } catch (error) {
            console.error('加载数据失败:', error)
            message.error('加载数据失败')
        } finally {
            setLoading(false)
        }
    }, [year, month, campusList, loadSavedData, generateWeekRanges])

    // 强制从制作明细重新计算数据（忽略已保存的数据）
    const refreshFromProductionDetail = useCallback(async () => {
        setLoading(true)
        try {
            const yearNum = parseInt(year)
            const monthNum = parseInt(month)

            console.log('从制作明细重新计算数据...', { year: yearNum, month: monthNum })
            
            // 1. 先加载已保存的数据，用于保留手动输入的字段
            const savedData = await loadSavedData()
            const savedDataMap = new Map<string, WeeklyData>()
            if (savedData) {
                savedData.forEach(item => {
                    savedDataMap.set(item.key, item)
                })
            }
            
            // 2. 并行获取制作明细和拍摄明细
            const [productionResponse, shootingResponse] = await Promise.all([
                fetch(`/api/v1/market/video-production-detail?year=${yearNum}&month=${monthNum}`),
                fetch(`/api/v1/market/shooting-detail?year=${yearNum}&month=${monthNum}`)
            ])

            let productionDetails: ProductionDetailRecord[] = []
            let shootingDetails: ShootingDetailRecord[] = []
            
            if (productionResponse.ok) {
                const data = await productionResponse.json()
                console.log('获取到制作明细数据:', data)
                productionDetails = data.items || []
            }

            if (shootingResponse.ok) {
                const data = await shootingResponse.json()
                console.log('获取到拍摄明细数据:', data)
                shootingDetails = data.items || []
            }

            // 生成周范围
            const weekRanges = generateWeekRanges(year, month)
            const weeks = Array.from(weekRanges.keys()).sort((a, b) => a - b)

            // 按神殿和周统计数据
            const processedData: WeeklyData[] = []
            const weekSummaries: Map<number, {
                totalRecordCount: number,
                totalAuditPassCount: number,
                totalShootingCount: number,
                totalAudienceTypeCount: number,
                campusStats: Map<string, {
                    recordCount: number,
                    auditPassCount: number,
                    audienceTypes: Set<string>,
                    shootingCount: number
                }>
            }> = new Map()

            // 辅助函数：合并已保存的手动输入字段
            const mergeWithSavedData = (newData: WeeklyData): WeeklyData => {
                const saved = savedDataMap.get(newData.key)
                if (saved) {
                    // 保留手动输入的字段，更新自动统计的字段
                    return {
                        ...newData,
                        // 手动输入字段从已保存数据获取
                        plannedArticles: saved.plannedArticles,
                        actualArticles: saved.actualArticles,
                        plannedEditDemand: saved.plannedEditDemand,
                        completedEditDemand: saved.completedEditDemand,
                        monthlyEditPlans: saved.monthlyEditPlans,
                        completedEarlyPlans: saved.completedEarlyPlans,
                        groupActivity: saved.groupActivity,
                    }
                }
                return newData
            }

            weeks.forEach((weekNum) => {
                const range = weekRanges.get(weekNum)!
                const weekDateRange = `${parseInt(month)}月${range.start}日-${parseInt(month)}月${range.end}日`
                const weekLabel = `第${weekNum}周`
                const yearNum = parseInt(year)
                const monthNum = parseInt(month)

                // 获取该周的所有制作明细记录
                const weekRecords = productionDetails.filter(record => {
                    const dateStr = record.copywriting_date || record.actual_shooting_date
                    if (!dateStr) return false
                    const recordDate = dayjs(dateStr)
                    if (recordDate.year() !== yearNum || recordDate.month() + 1 !== monthNum) return false
                    const day = recordDate.date()
                    return range.dates.includes(day)
                })

                // 各神殿统计
                const campusStats: Map<string, {
                    recordCount: number,
                    auditPassCount: number,
                    audienceTypes: Set<string>,
                    shootingCount: number
                }> = new Map()

                campusList.forEach(campus => {
                    campusStats.set(campus, {
                        recordCount: 0,
                        auditPassCount: 0,
                        audienceTypes: new Set(),
                        shootingCount: 0
                    })
                })

                // 遍历该周记录，按神殿统计
                weekRecords.forEach(record => {
                    // 过滤空白记录：至少需要有主题、视频名称或备注链接之一不为空
                    const isValidRecord = record.theme || record.video_name || record.remark_link
                    if (!isValidRecord) {
                        return // 跳过空白记录
                    }

                    let matchedCampus = ''
                    for (const campus of campusList) {
                        if (record.campus?.includes(campus) || campus.includes(record.campus || '')) {
                            matchedCampus = campus
                            break
                        }
                    }

                    if (matchedCampus && campusStats.has(matchedCampus)) {
                        const stats = campusStats.get(matchedCampus)!
                        stats.recordCount += 1

                        if (isValidUrl(record.remark_link)) {
                            stats.auditPassCount += 1
                        }

                        // 收集人群类别（支持逗号分隔的多选）
                        if (record.target_audience) {
                            record.target_audience.split(',').forEach(audience => {
                                const trimmed = audience.trim()
                                if (trimmed) {
                                    stats.audienceTypes.add(trimmed)
                                }
                            })
                        }
                    }
                })

                // 获取该周的拍摄明细记录
                const weekShootingRecords = shootingDetails.filter(record => {
                    const dateStr = record.shooting_date
                    if (!dateStr) return false
                    const recordDate = dayjs(dateStr)
                    if (recordDate.year() !== yearNum || recordDate.month() + 1 !== monthNum) return false
                    const day = recordDate.date()
                    return range.dates.includes(day)
                })

                // 按拍摄神殿统计拍摄次数
                weekShootingRecords.forEach(record => {
                    let matchedCampus = ''
                    const shootingCampus = record.shooting_campus || ''
                    for (const campus of campusList) {
                        if (shootingCampus.includes(campus) || campus.includes(shootingCampus)) {
                            matchedCampus = campus
                            break
                        }
                    }

                    if (matchedCampus && campusStats.has(matchedCampus)) {
                        const stats = campusStats.get(matchedCampus)!
                        stats.shootingCount += 1
                    }
                })

                // 计算周统计
                let totalRecordCount = 0
                let totalAuditPassCount = 0
                let totalShootingCount = 0
                let totalAudienceTypeCount = 0
                let campusWithDataCount = 0  // 有数据的神殿数量

                campusStats.forEach(stats => {
                    totalRecordCount += stats.recordCount
                    totalAuditPassCount += stats.auditPassCount
                    totalShootingCount += stats.shootingCount
                    totalAudienceTypeCount += stats.audienceTypes.size
                    if (stats.audienceTypes.size > 0) {
                        campusWithDataCount += 1
                    }
                })

                // 周人群类别合计 = 各神殿人群类别的简单平均（只统计有数据的神殿）
                const avgAudienceTypeCount = campusWithDataCount > 0
                    ? Math.round(totalAudienceTypeCount / campusWithDataCount * 10) / 10
                    : 0

                weekSummaries.set(weekNum, {
                    totalRecordCount,
                    totalAuditPassCount,
                    totalShootingCount,
                    totalAudienceTypeCount: avgAudienceTypeCount,
                    campusStats: new Map(campusStats)
                })

                // 添加该周合计行（合并已保存的手动输入字段）
                processedData.push(mergeWithSavedData({
                    key: `${weekNum}-summary`,
                    rowType: 'summary',
                    week: weekLabel,
                    weekDateRange: weekDateRange,
                    campus: '合计',
                    audienceTypeCount: avgAudienceTypeCount,
                    plannedArticles: 0,
                    actualArticles: 0,
                    plannedEditDemand: 0,
                    completedEditDemand: 0,
                    actualShootVideos: totalShootingCount,
                    shootEditCompletionRate: '#DIV/0!',
                    shootCompletionProgress: '#DIV/0!',
                    monthlyEditPlans: 0,
                    completedEarlyPlans: 0,
                    actualEditedVideos: totalRecordCount,
                    editProgressRate: '#DIV/0!',
                    releasedVideoCount: 0,
                    releaseRate: '#DIV/0!',
                    auditPassVideoCount: totalAuditPassCount,
                    auditPassRate: calculateRate(totalAuditPassCount, totalRecordCount),
                    groupActivity: '',
                }))

                // 添加该周各神殿行（合并已保存的手动输入字段）
                campusList.forEach(campus => {
                    const stats = campusStats.get(campus)!
                    processedData.push(mergeWithSavedData({
                        key: `${weekNum}-${campus}`,
                        rowType: 'campus',
                        week: '',
                        weekDateRange: '',
                        campus: campus,
                        audienceTypeCount: stats.audienceTypes.size,
                        plannedArticles: 0,
                        actualArticles: 0,
                        plannedEditDemand: 0,
                        completedEditDemand: 0,
                        actualShootVideos: stats.shootingCount,
                        shootEditCompletionRate: '#DIV/0!',
                        shootCompletionProgress: '#DIV/0!',
                        monthlyEditPlans: 0,
                        completedEarlyPlans: 0,
                        actualEditedVideos: stats.recordCount,
                        editProgressRate: '#DIV/0!',
                        releasedVideoCount: 0,
                        releaseRate: '#DIV/0!',
                        auditPassVideoCount: stats.auditPassCount,
                        auditPassRate: calculateRate(stats.auditPassCount, stats.recordCount),
                        groupActivity: '',
                    }))
                })
            })

            // 添加月合计
            let monthTotalRecordCount = 0
            let monthTotalAuditPassCount = 0
            let monthTotalShootingCount = 0
            let monthTotalAudienceTypeCount = 0
            let weeksWithDataCount = 0  // 有人群类别数据的周数

            weekSummaries.forEach(weekSummary => {
                monthTotalRecordCount += weekSummary.totalRecordCount
                monthTotalAuditPassCount += weekSummary.totalAuditPassCount
                monthTotalShootingCount += weekSummary.totalShootingCount
                monthTotalAudienceTypeCount += weekSummary.totalAudienceTypeCount
                if (weekSummary.totalAudienceTypeCount > 0) {
                    weeksWithDataCount += 1
                }
            })

            const monthAvgAudienceTypeCount = weeksWithDataCount > 0
                ? Math.round(monthTotalAudienceTypeCount / weeksWithDataCount * 10) / 10
                : 0

            processedData.unshift(mergeWithSavedData({
                key: `month-summary`,
                rowType: 'month-summary',
                week: `${parseInt(month)}月份`,
                weekDateRange: '',
                campus: '合计',
                audienceTypeCount: monthAvgAudienceTypeCount,
                plannedArticles: 0,
                actualArticles: 0,
                plannedEditDemand: 0,
                completedEditDemand: 0,
                actualShootVideos: monthTotalShootingCount,
                shootEditCompletionRate: '#DIV/0!',
                shootCompletionProgress: '#DIV/0!',
                monthlyEditPlans: 0,
                completedEarlyPlans: 0,
                actualEditedVideos: monthTotalRecordCount,
                editProgressRate: '#DIV/0!',
                releasedVideoCount: 0,
                releaseRate: '#DIV/0!',
                auditPassVideoCount: monthTotalAuditPassCount,
                auditPassRate: calculateRate(monthTotalAuditPassCount, monthTotalRecordCount),
                groupActivity: '',
            }))

            // 添加月份各神殿合计行（从各周神殿数据汇总而来）
            campusList.forEach((campus, index) => {
                let campusRecordCount = 0
                let campusAuditPassCount = 0
                let campusShootingCount = 0
                const campusAudienceTypes = new Set<string>()

                weekSummaries.forEach(weekSummary => {
                    const stats = weekSummary.campusStats.get(campus)
                    if (stats) {
                        campusRecordCount += stats.recordCount
                        campusAuditPassCount += stats.auditPassCount
                        campusShootingCount += stats.shootingCount
                        stats.audienceTypes.forEach(type => campusAudienceTypes.add(type))
                    }
                })

                processedData.splice(1 + index, 0, mergeWithSavedData({
                    key: `month-${campus}`,
                    rowType: 'campus',
                    week: '',
                    weekDateRange: '',
                    campus: campus,
                    audienceTypeCount: campusAudienceTypes.size,
                    plannedArticles: 0,
                    actualArticles: 0,
                    plannedEditDemand: 0,
                    completedEditDemand: 0,
                    actualShootVideos: campusShootingCount,
                    shootEditCompletionRate: '#DIV/0!',
                    shootCompletionProgress: '#DIV/0!',
                    monthlyEditPlans: 0,
                    completedEarlyPlans: 0,
                    actualEditedVideos: campusRecordCount,
                    editProgressRate: '#DIV/0!',
                    releasedVideoCount: 0,
                    releaseRate: '#DIV/0!',
                    auditPassVideoCount: campusAuditPassCount,
                    auditPassRate: calculateRate(campusAuditPassCount, campusRecordCount),
                    groupActivity: '',
                }))
            })

            const recalculatedData = recalculateProgressRates(processedData)
            setDataSource(recalculatedData)
            message.success('已从制作明细重新计算数据（保留了手动输入的字段）')
        } catch (error) {
            console.error('刷新数据失败:', error)
            message.error('刷新数据失败')
        } finally {
            setLoading(false)
        }
    }, [year, month, campusList, loadSavedData, generateWeekRanges])

    useEffect(() => {
        console.log('WeeklyEditReportTab useEffect triggered', { year, month, campusListLength: campusList.length })
        fetchAndProcessData()
    }, [fetchAndProcessData])

    // 更新手填字段
    const handleFieldChange = (key: string, field: keyof WeeklyData, value: number | string) => {
        setDataSource(prev => {
            // 1. 更新目标行的值
            const updatedData = prev.map(item => {
                if (item.key === key) {
                    return { ...item, [field]: value }
                }
                return item
            })

            // 2. 重新计算所有合计数据
            // 初始化统计对象
            const totals = {
                // 按周统计
                weeks: new Map<string, {
                    plannedArticles: number,
                    actualArticles: number,
                    monthlyEditPlans: number,
                    completedEarlyPlans: number
                }>(),
                // 按神殿统计（用于月神殿合计）
                campuses: new Map<string, {
                    plannedArticles: number,
                    actualArticles: number,
                    monthlyEditPlans: number,
                    completedEarlyPlans: number
                }>(),
                // 月总合计
                month: {
                    plannedArticles: 0,
                    actualArticles: 0,
                    monthlyEditPlans: 0,
                    completedEarlyPlans: 0,
                    plannedEditDemand: 0,
                    completedEditDemand: 0,
                    groupActivities: [] as string[]
                }
            }

            // 第一次遍历：收集基础数据（来自神殿行和周汇总行）
            updatedData.forEach(item => {
                // 收集神殿行数据
                if (item.rowType === 'campus' && !item.key.startsWith('month-')) {
                    const week = item.key.split('-')[0]
                    const campus = item.campus
                    
                    // 累加周数据
                    if (!totals.weeks.has(week)) {
                        totals.weeks.set(week, {
                            plannedArticles: 0,
                            actualArticles: 0,
                            monthlyEditPlans: 0,
                            completedEarlyPlans: 0
                        })
                    }
                    const weekTotal = totals.weeks.get(week)!
                    weekTotal.plannedArticles += item.plannedArticles || 0
                    weekTotal.actualArticles += item.actualArticles || 0
                    weekTotal.monthlyEditPlans += item.monthlyEditPlans || 0
                    weekTotal.completedEarlyPlans += item.completedEarlyPlans || 0

                    // 累加神殿数据
                    if (!totals.campuses.has(campus)) {
                        totals.campuses.set(campus, {
                            plannedArticles: 0,
                            actualArticles: 0,
                            monthlyEditPlans: 0,
                            completedEarlyPlans: 0
                        })
                    }
                    const campusTotal = totals.campuses.get(campus)!
                    campusTotal.plannedArticles += item.plannedArticles || 0
                    campusTotal.actualArticles += item.actualArticles || 0
                    campusTotal.monthlyEditPlans += item.monthlyEditPlans || 0
                    campusTotal.completedEarlyPlans += item.completedEarlyPlans || 0

                    // 累加月总合计（基础字段）
                    totals.month.plannedArticles += item.plannedArticles || 0
                    totals.month.actualArticles += item.actualArticles || 0
                    totals.month.monthlyEditPlans += item.monthlyEditPlans || 0
                    totals.month.completedEarlyPlans += item.completedEarlyPlans || 0
                }
                
                // 收集周汇总行数据（仅针对合并列：计划拍摄次数、截止昨日应完成拍摄次数、集团活动）
                // 注意：不收集 month-summary 行的数据，因为那些是手动输入的
                if (item.rowType === 'summary') {
                    totals.month.plannedEditDemand += item.plannedEditDemand || 0
                    totals.month.completedEditDemand += item.completedEditDemand || 0
                    if (item.groupActivity) {
                        totals.month.groupActivities.push(item.groupActivity)
                    }
                }
            })

            // 第二次遍历：更新所有行并重新计算比率
            return updatedData.map(item => {
                let currentItem = { ...item }

                // 更新周汇总行（自动计算，只读）
                if (item.rowType === 'summary') {
                    const week = item.key.split('-')[0]
                    const weekTotal = totals.weeks.get(week)
                    if (weekTotal) {
                        currentItem.plannedArticles = weekTotal.plannedArticles
                        currentItem.actualArticles = weekTotal.actualArticles
                        currentItem.monthlyEditPlans = weekTotal.monthlyEditPlans
                        currentItem.completedEarlyPlans = weekTotal.completedEarlyPlans
                    }
                }
                
                // 更新月神殿合计行（自动计算，只读）
                if (item.rowType === 'campus' && item.key.startsWith('month-')) {
                    const campusTotal = totals.campuses.get(item.campus)
                    if (campusTotal) {
                        currentItem.plannedArticles = campusTotal.plannedArticles
                        currentItem.actualArticles = campusTotal.actualArticles
                        currentItem.monthlyEditPlans = campusTotal.monthlyEditPlans
                        currentItem.completedEarlyPlans = campusTotal.completedEarlyPlans
                    }
                }

                // 更新月总合计行（自动计算，只读）
                if (item.rowType === 'month-summary') {
                    currentItem.plannedArticles = totals.month.plannedArticles
                    currentItem.actualArticles = totals.month.actualArticles
                    currentItem.monthlyEditPlans = totals.month.monthlyEditPlans
                    currentItem.completedEarlyPlans = totals.month.completedEarlyPlans
                    // 月总合计行的合并列字段（计划拍摄次数、截止昨日应完成拍摄次数）是从各周汇总行自动累加的
                    currentItem.plannedEditDemand = totals.month.plannedEditDemand
                    currentItem.completedEditDemand = totals.month.completedEditDemand
                    currentItem.groupActivity = totals.month.groupActivities.join('\n')
                }

                // 重新计算所有比率
                // 拍摄完成进度 = 实际拍摄次数 / 计划拍摄次数
                if (currentItem.plannedEditDemand > 0 && currentItem.actualShootVideos > 0) {
                    currentItem.shootCompletionProgress = calculateRate(currentItem.actualShootVideos, currentItem.plannedEditDemand)
                } else {
                    currentItem.shootCompletionProgress = '0%'
                }

                // 剪辑完成进度 = 实际完成剪辑数 / 本月计划剪辑数
                if (currentItem.monthlyEditPlans > 0 && currentItem.actualEditedVideos > 0) {
                    currentItem.editProgressRate = calculateRate(currentItem.actualEditedVideos, currentItem.monthlyEditPlans)
                } else {
                    currentItem.editProgressRate = '0%'
                }

                // 审核通过率 = 审核通过数 / 实际完成剪辑数
                if (currentItem.actualEditedVideos > 0 && currentItem.auditPassVideoCount > 0) {
                    currentItem.auditPassRate = calculateRate(currentItem.auditPassVideoCount, currentItem.actualEditedVideos)
                } else {
                    currentItem.auditPassRate = '0%'
                }

                return currentItem
            })
        })
    }

    // 保存数据
    const handleSave = async () => {
        setLoading(true)
        try {
            const yearNum = parseInt(year)
            const monthNum = parseInt(month)

            // 将前端数据转换为后端格式
            const items = dataSource.map(item => {
                // 从 key 解析 week 值
                // key 格式: "1-summary", "1-神殿名", "month-summary", "month-神殿名"
                let weekNum = 0
                if (item.rowType === 'month-summary' || item.key.startsWith('month-')) {
                    weekNum = 0  // 月合计行 week=0
                } else {
                    const parsed = parseInt(item.key.split('-')[0])
                    weekNum = isNaN(parsed) ? 0 : parsed
                }
                
                return {
                    week: weekNum,
                    row_type: item.rowType,
                    week_label: item.week,
                    week_date_range: item.weekDateRange,
                    campus: item.campus,
                    audience_type_count: item.audienceTypeCount,
                    planned_articles: item.plannedArticles,
                    actual_articles: item.actualArticles,
                    planned_edit_demand: item.plannedEditDemand,
                    completed_edit_demand: item.completedEditDemand,
                    actual_shoot_videos: item.actualShootVideos,
                    shoot_edit_completion_rate: item.shootEditCompletionRate,
                    shoot_completion_progress: item.shootCompletionProgress,
                    monthly_edit_plans: item.monthlyEditPlans,
                    completed_early_plans: item.completedEarlyPlans,
                    actual_edited_videos: item.actualEditedVideos,
                    edit_progress_rate: item.editProgressRate,
                    released_video_count: item.releasedVideoCount,
                    release_rate: item.releaseRate,
                    audit_pass_video_count: item.auditPassVideoCount,
                    audit_pass_rate: item.auditPassRate,
                    group_activity: item.groupActivity,
                }
            })

            const payload = {
                year: yearNum,
                month: monthNum,
                items,
            }

            const response = await fetch('/api/v1/market/weekly-edit-report/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            })

            if (response.ok) {
                message.success('保存成功')
                // 重新加载数据
                await fetchAndProcessData()
            } else {
                const errorData = await response.json()
                message.error(`保存失败: ${errorData.detail || '未知错误'}`)
            }
        } catch (error) {
            console.error('保存失败:', error)
            message.error('保存失败')
        } finally {
            setLoading(false)
        }
    }

    const columns: ColumnsType<WeeklyData> = [
        {
            title: '日期',
            children: [
                {
                    title: '周',
                    dataIndex: 'week',
                    key: 'week',
                    width: 40,
                    fixed: 'left',
                    align: 'center',
                    onCell: (record) => ({
                        rowSpan: (record.rowType === 'summary' || record.rowType === 'month-summary') 
                            ? 1 + campusList.length 
                            : 0
                    }),
                    render: (text: string, record) => text && (
                        <div style={{
                            fontWeight: 'bold',
                            backgroundColor: record.rowType === 'month-summary' ? '#ffc000' : '#ffc000',
                            padding: '4px 2px',
                            fontSize: '11px'
                        }}>
                            {text}
                        </div>
                    ),
                },
                {
                    title: '日期',
                    dataIndex: 'weekDateRange',
                    key: 'weekDateRange',
                    width: 50,
                    fixed: 'left',
                    align: 'center',
                    onCell: (record) => ({
                        rowSpan: (record.rowType === 'summary' || record.rowType === 'month-summary') 
                            ? 1 + campusList.length 
                            : 0
                    }),
                    render: (text: string, record) => (
                        <div style={{
                            fontWeight: record.rowType === 'summary' ? 'bold' : 'normal',
                            backgroundColor: record.rowType === 'summary' ? '#e2efda' : 'transparent',
                            padding: '4px 2px',
                            fontSize: '10px',
                            whiteSpace: 'pre-wrap'
                        }}>
                            {text.replace('-', '\n-')}
                        </div>
                    ),
                },
                {
                    title: '神殿',
                    dataIndex: 'campus',
                    key: 'campus',
                    width: 45,
                    fixed: 'left',
                    align: 'center',
                    render: (text: string, record) => (
                        <div style={{
                            fontWeight: (record.rowType === 'summary' || record.rowType === 'month-summary') ? 'bold' : 'normal',
                            backgroundColor: (record.rowType === 'summary' || record.rowType === 'month-summary') ? '#e2efda' : 'transparent',
                            padding: '4px 2px',
                            fontSize: '11px'
                        }}>
                            {text}
                        </div>
                    ),
                },
            ],
        },
        {
            title: '文案类',
            children: [
                {
                    title: <div>人群<br/>类别</div>,
                    dataIndex: 'audienceTypeCount',
                    key: 'audienceTypeCount',
                    width: 40,
                    align: 'center',
                    render: (value: number, record) => (
                        <div style={{
                            fontWeight: (record.rowType === 'summary' || record.rowType === 'month-summary') ? 'bold' : 'normal',
                            color: value === 0 ? '#999' : 'inherit',
                            fontSize: '11px'
                        }}>
                            {value}
                        </div>
                    ),
                },
                {
                    title: <div>计划<br/>文案数</div>,
                    dataIndex: 'plannedArticles',
                    key: 'plannedArticles',
                    width: 50,
                    align: 'center',
                    render: (value: number, record) => (
                        record.rowType === 'campus' ? (
                            <InputNumber
                                min={0}
                                value={value}
                                onChange={(val) => handleFieldChange(record.key, 'plannedArticles', val || 0)}
                                style={{ width: '100%', fontSize: '11px' }}
                                size="small"
                            />
                        ) : (
                            <div style={{ fontWeight: 'bold', fontSize: '11px', color: value === 0 ? '#999' : 'inherit' }}>
                                {value}
                            </div>
                        )
                    ),
                },
                {
                    title: <div>实际<br/>文案数</div>,
                    dataIndex: 'actualArticles',
                    key: 'actualArticles',
                    width: 50,
                    align: 'center',
                    render: (value: number, record) => (
                        record.rowType === 'campus' ? (
                            <InputNumber
                                min={0}
                                value={value}
                                onChange={(val) => handleFieldChange(record.key, 'actualArticles', val || 0)}
                                style={{ width: '100%', fontSize: '11px' }}
                                size="small"
                            />
                        ) : (
                            <div style={{ fontWeight: 'bold', fontSize: '11px', color: value === 0 ? '#999' : 'inherit' }}>
                                {value}
                            </div>
                        )
                    ),
                },
            ],
        },
        {
            title: '拍摄类',
            className: 'shooting-header',
            children: [
                {
                    title: <div>计划<br/>拍摄次数</div>,
                    className: 'shooting-header',
                    dataIndex: 'plannedEditDemand',
                    key: 'plannedEditDemand',
                    width: 50,
                    align: 'center',
                    onCell: (record) => ({
                        rowSpan: (record.rowType === 'summary' || record.rowType === 'month-summary') 
                            ? 1 + campusList.length 
                            : 0
                    }),
                    render: (value: number, record) => (
                        record.rowType === 'summary' ? (
                            <InputNumber
                                min={0}
                                value={value}
                                onChange={(val) => handleFieldChange(record.key, 'plannedEditDemand', val || 0)}
                                style={{ width: '100%', fontSize: '11px' }}
                                size="small"
                            />
                        ) : (
                            <div style={{ fontWeight: 'bold', fontSize: '11px', color: value === 0 ? '#999' : 'inherit' }}>
                                {value}
                            </div>
                        )
                    ),
                },
                {
                    title: <div>截止昨日<br/>应完成<br/>拍摄次数</div>,
                    className: 'shooting-header',
                    dataIndex: 'completedEditDemand',
                    key: 'completedEditDemand',
                    width: 60,
                    align: 'center',
                    onCell: (record) => ({
                        rowSpan: (record.rowType === 'summary' || record.rowType === 'month-summary') 
                            ? 1 + campusList.length 
                            : 0
                    }),
                    render: (value: number, record) => (
                        record.rowType === 'summary' ? (
                            <InputNumber
                                min={0}
                                value={value}
                                onChange={(val) => handleFieldChange(record.key, 'completedEditDemand', val || 0)}
                                style={{ width: '100%', fontSize: '11px' }}
                                size="small"
                            />
                        ) : (
                            <div style={{ fontWeight: 'bold', fontSize: '11px', color: value === 0 ? '#999' : 'inherit' }}>
                                {value}
                            </div>
                        )
                    ),
                },
                {
                    title: <div>实际<br/>拍摄次数</div>,
                    className: 'shooting-header',
                    dataIndex: 'actualShootVideos',
                    key: 'actualShootVideos',
                    width: 50,
                    align: 'center',
                    onCell: (record) => ({
                        rowSpan: (record.rowType === 'summary' || record.rowType === 'month-summary') 
                            ? 1 + campusList.length 
                            : 0
                    }),
                    render: (value: number, record) => (
                        <div style={{
                            fontWeight: (record.rowType === 'summary' || record.rowType === 'month-summary') ? 'bold' : 'normal',
                            color: value > 0 ? '#52c41a' : 'inherit',
                            fontSize: '11px'
                        }}>
                            {value}
                        </div>
                    ),
                },
                {
                    title: <div>拍摄<br/>完成进度</div>,
                    className: 'shooting-header',
                    dataIndex: 'shootCompletionProgress',
                    key: 'shootCompletionProgress',
                    width: 60,
                    align: 'center',
                    onCell: (record) => ({
                        rowSpan: (record.rowType === 'summary' || record.rowType === 'month-summary') 
                            ? 1 + campusList.length 
                            : 0
                    }),
                    render: (text: string) => (
                        <div style={{ color: text === '0%' ? '#999' : 'inherit', fontSize: '10px' }}>{text}</div>
                    ),
                },
            ],
        },
        {
            title: '剪辑类',
            children: [
                {
                    title: <div>计划<br/>剪辑数</div>,
                    dataIndex: 'monthlyEditPlans',
                    key: 'monthlyEditPlans',
                    width: 50,
                    align: 'center',
                    render: (value: number, record) => (
                        record.rowType === 'campus' ? (
                            <InputNumber
                                min={0}
                                value={value}
                                onChange={(val) => handleFieldChange(record.key, 'monthlyEditPlans', val || 0)}
                                style={{ width: '100%', fontSize: '11px' }}
                                size="small"
                            />
                        ) : (
                            <div style={{ fontWeight: 'bold', fontSize: '11px', color: value === 0 ? '#999' : 'inherit' }}>
                                {value}
                            </div>
                        )
                    ),
                },
                {
                    title: <div>截止昨日<br/>应完成<br/>剪辑次数</div>,
                    dataIndex: 'completedEarlyPlans',
                    key: 'completedEarlyPlans',
                    width: 60,
                    align: 'center',
                    render: (value: number, record) => (
                        record.rowType === 'campus' ? (
                            <InputNumber
                                min={0}
                                value={value}
                                onChange={(val) => handleFieldChange(record.key, 'completedEarlyPlans', val || 0)}
                                style={{ width: '100%', fontSize: '11px' }}
                                size="small"
                            />
                        ) : (
                            <div style={{ fontWeight: 'bold', fontSize: '11px', color: value === 0 ? '#999' : 'inherit' }}>
                                {value}
                            </div>
                        )
                    ),
                },
                {
                    title: <div>实际完成<br/>剪辑数</div>,
                    dataIndex: 'actualEditedVideos',
                    key: 'actualEditedVideos',
                    width: 50,
                    align: 'center',
                    render: (value: number, record) => (
                        <div style={{
                            fontWeight: (record.rowType === 'summary' || record.rowType === 'month-summary') ? 'bold' : 'normal',
                            color: value > 0 ? '#52c41a' : 'inherit',
                            fontSize: '11px'
                        }}>
                            {value}
                        </div>
                    ),
                },
                {
                    title: <div>剪辑<br/>完成进度</div>,
                    dataIndex: 'editProgressRate',
                    key: 'editProgressRate',
                    width: 60,
                    align: 'center',
                    render: (text: string) => (
                        <div style={{ color: text === '0%' ? '#999' : 'inherit', fontSize: '10px' }}>{text}</div>
                    ),
                },
            ],
        },
        {
            title: '结果类',
            children: [
                {
                    title: <div>审核<br/>通过数</div>,
                    dataIndex: 'auditPassVideoCount',
                    key: 'auditPassVideoCount',
                    width: 50,
                    align: 'center',
                    render: (value: number, record) => (
                        <div style={{
                            fontWeight: (record.rowType === 'summary' || record.rowType === 'month-summary') ? 'bold' : 'normal',
                            color: value > 0 ? '#1890ff' : 'inherit',
                            fontSize: '11px'
                        }}>
                            {value}
                        </div>
                    ),
                },
                {
                    title: <div>审核<br/>通过率</div>,
                    dataIndex: 'auditPassRate',
                    key: 'auditPassRate',
                    width: 60,
                    align: 'center',
                    render: (text: string) => (
                        <div style={{ color: text === '0%' ? '#999' : 'inherit', fontSize: '10px' }}>{text}</div>
                    ),
                },
                {
                    title: <div>集团<br/>活动</div>,
                    dataIndex: 'groupActivity',
                    key: 'groupActivity',
                    width: 80,
                    align: 'center',
                    onCell: (record) => ({
                        rowSpan: (record.rowType === 'summary' || record.rowType === 'month-summary') 
                            ? 1 + campusList.length 
                            : 0
                    }),
                    render: (value: string, record) => (
                        <Input
                            value={value}
                            onChange={(e) => handleFieldChange(record.key, 'groupActivity', e.target.value)}
                            size="small"
                            placeholder="请输入"
                            style={{ fontSize: '11px' }}
                        />
                    ),
                },
            ],
        },
    ]

    return (
        <div>
            <Space style={{ marginBottom: 16 }}>
                <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    onClick={handleSave}
                    loading={loading}
                >
                    保存
                </Button>
                <Button
                    icon={<ReloadOutlined />}
                    onClick={refreshFromProductionDetail}
                    loading={loading}
                    title="从制作明细和拍摄明细重新计算数据（保留手动输入的字段）"
                >
                    刷新数据
                </Button>
            </Space>
            <Spin spinning={loading}>
                <Table
                    columns={columns}
                    dataSource={dataSource}
                    rowKey="key"
                    pagination={false}
                    bordered
                    size="small"
                    scroll={{ x: 1000, y: 600 }}
                    rowClassName={(record) => {
                        if (record.rowType === 'month-summary') return 'month-summary-row'
                        if (record.rowType === 'summary') return 'summary-row'
                        return ''
                    }}
                />
            </Spin>
            <style>{`
                .ant-table-bordered .ant-table-cell {
                    border-right: 1px solid #d9d9d9 !important;
                    border-bottom: 1px solid #d9d9d9 !important;
                }
                .ant-table-bordered .ant-table-thead > tr > th {
                    border-right: 1px solid #d9d9d9 !important;
                    border-bottom: 2px solid #bfbfbf !important;
                    background-color: #fafafa;
                }
                .month-summary-row {
                    background-color: #fff2cc;
                }
                .month-summary-row td {
                    font-weight: 600;
                }
                .summary-row {
                    background-color: #f5f5f5;
                }
                .summary-row td {
                    font-weight: 500;
                }
                .shooting-header {
                    background-color: #c6e0b4 !important;
                }
            `}</style>
        </div>
    )
}

export default WeeklyEditReportTab