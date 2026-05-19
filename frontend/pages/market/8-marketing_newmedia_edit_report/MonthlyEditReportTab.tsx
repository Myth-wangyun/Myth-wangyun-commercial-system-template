import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { App, Table, InputNumber, Input, Button, Space, Spin } from 'antd'
import { SaveOutlined, ReloadOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useCampusStore } from '@/stores/campusStore'

// 定义数据结构
interface MonthlyData {
    key: string
    rowType: 'summary' | 'data' // summary=合计, data=神殿
    period: string // 'all-year' | '1' | '2' ... '12'
    periodLabel: string // '全年度' | '1月' ...
    campus: string

    // 文案类
    audienceTypeCount: string // 人群类别 (Input)
    plannedArticles: number
    actualArticles: number

    // 拍摄类 (合并单元格，仅存于 summary 行)
    plannedEditDemand: number
    completedEditDemand: number
    actualShootVideos: number
    shootCompletionProgress: string // calc

    // 待剪类
    monthlyEditPlans: number
    completedEarlyPlans: number
    actualEditedVideos: number
    editProgressRate: string // calc

    // 结果类
    auditPassVideoCount: number
    auditPassRate: string // calc

    // 集团活动 (合并单元格，仅存于 summary 行)
    groupActivity: string
}

interface MonthlyEditReportTabProps {
  year: string
  month: string
}

const MonthlyEditReportTab: React.FC<MonthlyEditReportTabProps> = ({ year = '2025' }) => {
  const { message } = App.useApp()
    const [loading, setLoading] = useState(false)
    const [dataSource, setDataSource] = useState<MonthlyData[]>([])
    const getAllCampuses = useCampusStore(state => state.getAllCampuses)

    // 获取排序后的神殿列表
    const campusList = useMemo(() => {
        return getAllCampuses().map(c => c.name.replace('神殿', ''))
    }, [getAllCampuses])

    // 初始化数据
    useEffect(() => {
        const loadData = async () => {
             setLoading(true)
             try {
                // 1. 生成基础结构 (根据前端配置)
                const months = Array.from({ length: 12 }, (_, i) => (i + 1).toString())
                const periods = ['all-year', ...months]
                const initialData: MonthlyData[] = []
        
                periods.forEach(p => {
                    const isYear = p === 'all-year'
                    const periodLabel = isYear ? '全年度' : `${p}月`
                    
                    // 1. 合计行 (Summary)
                    initialData.push(createEmptyRecord(p, periodLabel, 'summary', '合计'))
        
                    // 2. 神殿行 (Data)
                    campusList.forEach((c: string) => {
                        initialData.push(createEmptyRecord(p, periodLabel, 'data', c))
                    })
                })

                // 2. 从后端获取数据填充
                try {
                    const response = await fetch(`/api/v1/market/monthly-edit-report?year=${year}`)
                    const res = await response.json()
                    
                    if (res.code === 200 && res.data && res.data.length > 0) {
                        // 后端返回的是 camelCase 格式，需要转换为前端格式
                        const backendData = res.data.map((item: any) => ({
                            key: item.key,
                            rowType: item.rowType,
                            period: item.period,
                            periodLabel: item.periodLabel,
                            campus: item.campus,
                            audienceTypeCount: item.audienceTypeCount || '',
                            plannedArticles: item.plannedArticles || 0,
                            actualArticles: item.actualArticles || 0,
                            plannedEditDemand: item.plannedEditDemand || 0,
                            completedEditDemand: item.completedEditDemand || 0,
                            actualShootVideos: item.actualShootVideos || 0,
                            shootCompletionProgress: item.shootCompletionProgress || '0%',
                            monthlyEditPlans: item.monthlyEditPlans || 0,
                            completedEarlyPlans: item.completedEarlyPlans || 0,
                            actualEditedVideos: item.actualEditedVideos || 0,
                            editProgressRate: item.editProgressRate || '0%',
                            auditPassVideoCount: item.auditPassVideoCount || 0,
                            auditPassRate: item.auditPassRate || '0%',
                            groupActivity: item.groupActivity || ''
                        })) as MonthlyData[]
                        
                        initialData.forEach((row, index) => {
                            // 查找对应的后端记录
                            const match = backendData.find(d => 
                                d.period === row.period && 
                                d.campus === row.campus &&
                                d.rowType === row.rowType
                            )
                            
                            if (match) {
                                // 合并字段
                                initialData[index] = {
                                    ...row,
                                    ...match,
                                    // 确保 key 不变 (虽然应该一样)
                                    key: row.key
                                }
                            }
                        })
                    }
                } catch (err) {
                    console.error("Fetch monthly report error:", err)
                    message.error("获取数据失败，已重置为初始状态")
                }

                // 3. 触发一次重新计算 (确保汇总行正确，比如后端只返回了神殿数据的情况，或者需要重新汇总)
                // 如果后端已经计算好了汇总行，这里再算一遍也无妨，保证一致性
                const calculated = recalculateAll(initialData)
                setDataSource(calculated)

             } finally {
                 setLoading(false)
             }
        }

        loadData()
    }, [campusList, year]) // year变化时重新加载

    const createEmptyRecord = (period: string, periodLabel: string, rowType: 'summary' | 'data', campus: string): MonthlyData => ({
        key: `${period}-${campus}`,
        rowType,
        period,
        periodLabel,
        campus,
        audienceTypeCount: '',  // default string
        plannedArticles: 0,
        actualArticles: 0,
        plannedEditDemand: 0,
        completedEditDemand: 0,
        actualShootVideos: 0,
        shootCompletionProgress: '0%',
        monthlyEditPlans: 0,
        completedEarlyPlans: 0,
        actualEditedVideos: 0,
        editProgressRate: '0%',
        auditPassVideoCount: 0,
        auditPassRate: '0%',
        groupActivity: ''
    })

    // 计算比率 helper
    const calcRate = (numerator: number, denominator: number) => {
        if (!denominator) return '0%'
        return `${((numerator / denominator) * 100).toFixed(0)}%`
    }

    // 处理字段变更
    const handleFieldChange = (key: string, field: keyof MonthlyData, value: any) => {
        setDataSource(prev => {
            const newData = [...prev]
            const index = newData.findIndex(item => item.key === key)
            if (index === -1) return prev

            const record = newData[index]
            // 更新当前行
            newData[index] = { ...record, [field]: value }

            // 触发重新计算
            return recalculateAll(newData)
        })
    }

    const recalculateAll = (data: MonthlyData[]) => {
        const months = Array.from({ length: 12 }, (_, i) => (i + 1).toString())
        const campusNames = campusList as string[]

        // 1. 先计算每个月的 合计 (Summary) 行
        months.forEach(m => {
            // 汇总该月所有神殿的数据
            let plannedArticles = 0
            let actualArticles = 0
            let monthlyEditPlans = 0
            let completedEarlyPlans = 0
            let actualEditedVideos = 0
            let auditPassVideoCount = 0

            campusNames.forEach(c => {
                const row = data.find(d => d.period === m && d.campus === c)
                if (row) {
                    plannedArticles += row.plannedArticles || 0
                    actualArticles += row.actualArticles || 0
                    monthlyEditPlans += row.monthlyEditPlans || 0
                    completedEarlyPlans += row.completedEarlyPlans || 0
                    actualEditedVideos += row.actualEditedVideos || 0
                    auditPassVideoCount += row.auditPassVideoCount || 0
                    
                    // 计算神殿行的比率
                    row.editProgressRate = calcRate(row.actualEditedVideos, row.monthlyEditPlans)
                    row.auditPassRate = calcRate(row.auditPassVideoCount, row.actualEditedVideos)
                }
            })

            // 更新该月的 Summary 行
            const summaryRowIndex = data.findIndex(d => d.period === m && d.rowType === 'summary')
            if (summaryRowIndex > -1) {
                const s = data[summaryRowIndex]
                s.plannedArticles = plannedArticles
                s.actualArticles = actualArticles
                s.monthlyEditPlans = monthlyEditPlans
                s.completedEarlyPlans = completedEarlyPlans
                s.actualEditedVideos = actualEditedVideos
                s.auditPassVideoCount = auditPassVideoCount
                
                // Summary 行比率
                s.editProgressRate = calcRate(actualEditedVideos, monthlyEditPlans)
                s.auditPassRate = calcRate(auditPassVideoCount, actualEditedVideos)
                
                // 拍摄类比率 (输入在 Summary 行)
                s.shootCompletionProgress = calcRate(s.actualShootVideos, s.plannedEditDemand)
            }
        })

        // 2. 计算 全年度 (All Year)
        let yearPlannedArticlesTotal = 0
        let yearActualArticlesTotal = 0
        let yearPlannedEditTotal = 0
        let yearCompletedEditTotal = 0
        let yearActualShootTotal = 0
        let yearMonthlyEditPlansTotal = 0
        let yearCompletedEarlyPlansTotal = 0
        let yearActualEditedVideosTotal = 0
        let yearAuditPassTotal = 0

        months.forEach(m => {
            const mSummary = data.find(d => d.period === m && d.rowType === 'summary')
            if (mSummary) {
                yearPlannedArticlesTotal += mSummary.plannedArticles
                yearActualArticlesTotal += mSummary.actualArticles
                yearPlannedEditTotal += mSummary.plannedEditDemand
                yearCompletedEditTotal += mSummary.completedEditDemand
                yearActualShootTotal += mSummary.actualShootVideos
                yearMonthlyEditPlansTotal += mSummary.monthlyEditPlans
                yearCompletedEarlyPlansTotal += mSummary.completedEarlyPlans
                yearActualEditedVideosTotal += mSummary.actualEditedVideos
                yearAuditPassTotal += mSummary.auditPassVideoCount
            }
        })

        const yearSummaryIndex = data.findIndex(d => d.period === 'all-year' && d.rowType === 'summary')
        if (yearSummaryIndex > -1) {
            const ys = data[yearSummaryIndex]
            ys.plannedArticles = yearPlannedArticlesTotal
            ys.actualArticles = yearActualArticlesTotal
            ys.plannedEditDemand = yearPlannedEditTotal
            ys.completedEditDemand = yearCompletedEditTotal
            ys.actualShootVideos = yearActualShootTotal
            ys.monthlyEditPlans = yearMonthlyEditPlansTotal
            ys.completedEarlyPlans = yearCompletedEarlyPlansTotal
            ys.actualEditedVideos = yearActualEditedVideosTotal
            ys.auditPassVideoCount = yearAuditPassTotal
            
            ys.shootCompletionProgress = calcRate(yearActualShootTotal, yearPlannedEditTotal)
            ys.editProgressRate = calcRate(yearActualEditedVideosTotal, yearMonthlyEditPlansTotal)
            ys.auditPassRate = calcRate(yearAuditPassTotal, yearActualEditedVideosTotal)
        }

        // 2.3 遍历神殿，更新 全年度的神殿行
        campusNames.forEach(c => {
            let cPlannedArticles = 0
            let cActualArticles = 0
            let cMonthlyEditPlans = 0
            let cCompletedEarlyPlans = 0
            let cActualEditedVideos = 0
            let cAuditPassVideoCount = 0

            months.forEach(m => {
                const row = data.find(d => d.period === m && d.campus === c)
                if (row) {
                    cPlannedArticles += row.plannedArticles
                    cActualArticles += row.actualArticles
                    cMonthlyEditPlans += row.monthlyEditPlans
                    cCompletedEarlyPlans += row.completedEarlyPlans
                    cActualEditedVideos += row.actualEditedVideos
                    cAuditPassVideoCount += row.auditPassVideoCount
                }
            })
            
            const yearCampusIndex = data.findIndex(d => d.period === 'all-year' && d.campus === c)
            if (yearCampusIndex > -1) {
                const yc = data[yearCampusIndex]
                yc.plannedArticles = cPlannedArticles
                yc.actualArticles = cActualArticles
                yc.monthlyEditPlans = cMonthlyEditPlans
                yc.completedEarlyPlans = cCompletedEarlyPlans
                yc.actualEditedVideos = cActualEditedVideos
                yc.auditPassVideoCount = cAuditPassVideoCount

                yc.editProgressRate = calcRate(cActualEditedVideos, cMonthlyEditPlans)
                yc.auditPassRate = calcRate(cAuditPassVideoCount, cActualEditedVideos)
            }
        })

        return data
    }

    const handleSave = async () => {
        setLoading(true)
        try {
            // 将前端数据转换为后端期望的 camelCase 格式
            const backendData = dataSource.map(item => ({
                key: item.key,
                rowType: item.rowType,
                period: item.period,
                periodLabel: item.periodLabel,
                campus: item.campus,
                audienceTypeCount: item.audienceTypeCount,
                plannedArticles: item.plannedArticles,
                actualArticles: item.actualArticles,
                plannedEditDemand: item.plannedEditDemand,
                completedEditDemand: item.completedEditDemand,
                actualShootVideos: item.actualShootVideos,
                shootCompletionProgress: item.shootCompletionProgress,
                monthlyEditPlans: item.monthlyEditPlans,
                completedEarlyPlans: item.completedEarlyPlans,
                actualEditedVideos: item.actualEditedVideos,
                editProgressRate: item.editProgressRate,
                auditPassVideoCount: item.auditPassVideoCount,
                auditPassRate: item.auditPassRate,
                groupActivity: item.groupActivity
            }))
            
            // 构造请求数据
            const payload = {
                year: parseInt(year),
                data: backendData
            }
            
            const response = await fetch('/api/v1/market/monthly-edit-report/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            
            const res = await response.json()
            if (res.code === 200) {
                message.success('保存成功')
            } else {
                message.error(res.message || '保存失败')
            }
        } catch (error) {
            console.error('Save error:', error)
            message.error('保存失败')
        } finally {
            setLoading(false)
        }
    }

    // 从周度表刷新数据
    const handleRefreshFromWeekly = useCallback(async () => {
        setLoading(true)
        try {
            // 调用后端接口，强制从周度表重新生成数据
            const response = await fetch(`/api/v1/market/monthly-edit-report/refresh?year=${year}`)
            const res = await response.json()
            
            if (res.code === 200 && res.data && res.data.length > 0) {
                // 后端返回的是 camelCase 格式，需要转换为前端格式
                const backendData = res.data.map((item: any) => ({
                    key: item.key,
                    rowType: item.rowType,
                    period: item.period,
                    periodLabel: item.periodLabel,
                    campus: item.campus,
                    audienceTypeCount: item.audienceTypeCount || '',
                    plannedArticles: item.plannedArticles || 0,
                    actualArticles: item.actualArticles || 0,
                    plannedEditDemand: item.plannedEditDemand || 0,
                    completedEditDemand: item.completedEditDemand || 0,
                    actualShootVideos: item.actualShootVideos || 0,
                    shootCompletionProgress: item.shootCompletionProgress || '0%',
                    monthlyEditPlans: item.monthlyEditPlans || 0,
                    completedEarlyPlans: item.completedEarlyPlans || 0,
                    actualEditedVideos: item.actualEditedVideos || 0,
                    editProgressRate: item.editProgressRate || '0%',
                    auditPassVideoCount: item.auditPassVideoCount || 0,
                    auditPassRate: item.auditPassRate || '0%',
                    groupActivity: item.groupActivity || ''
                })) as MonthlyData[]

                const calculated = recalculateAll(backendData)
                setDataSource(calculated)
                message.success('已从周度表刷新数据')
            } else {
                message.warning('周度表暂无数据')
            }
        } catch (error) {
            console.error('Refresh error:', error)
            message.error('刷新失败')
        } finally {
            setLoading(false)
        }
    }, [year, campusList])

    // 列定义
    const columns: ColumnsType<MonthlyData> = [
        {
            title: '日期',
            children: [
                {
                    title: '日期',
                    dataIndex: 'periodLabel',
                    key: 'periodLabel',
                    width: 50,
                    fixed: 'left',
                    align: 'center',
                    onCell: (record) => {
                        // 合并单元格逻辑：Summary 行负责 rowSpan
                        if (record.rowType === 'summary') {
                            return { rowSpan: 1 + campusList.length }
                        }
                        return { rowSpan: 0 }
                    },
                    render: (text) => <div style={{ fontWeight: 'bold', fontSize: '12px' }}>{text}</div>
                },
                {
                    title: '项目',
                    dataIndex: 'campus',
                    key: 'campus',
                    width: 60,
                    fixed: 'left',
                    align: 'center',
                    render: (text, record) => (
                        <div style={{ color: record.rowType === 'summary' ? 'red' : 'inherit', fontWeight: record.rowType === 'summary' ? 'bold' : 'normal', fontSize: '12px' }}>
                            {text}
                        </div>
                    )
                }
            ]
        },
        {
            title: '文案类',
            children: [
                {
                    title: '人群类别',
                    dataIndex: 'audienceTypeCount',
                    width: 60,
                    align: 'center',
                    render: (val) => <span style={{fontSize: '12px'}}>{val}</span>
                },
                {
                    title: '计划文案数',
                    dataIndex: 'plannedArticles',
                    width: 60,
                    align: 'center',
                    render: (val) => <span style={{fontSize: '12px'}}>{val}</span>
                },
                {
                    title: '实际文案数',
                    dataIndex: 'actualArticles',
                    width: 60,
                    align: 'center',
                    render: (val) => <span style={{fontSize: '12px'}}>{val}</span>
                }
            ]
        },
        {
            title: '拍摄类',
            children: [
                {
                    title: <div style={{fontSize: '12px'}}>计划<br/>拍摄次数</div>,
                    dataIndex: 'plannedEditDemand',
                    width: 60,
                    align: 'center',
                    onCell: (record) => ({ rowSpan: record.rowType === 'summary' ? 1 + campusList.length : 0 }),
                    render: (val) => <span style={{fontSize: '12px'}}>{val}</span>
                },
                {
                    title: <div style={{fontSize: '12px'}}>截止昨日<br/>应完成拍摄次</div>,
                    dataIndex: 'completedEditDemand',
                    width: 70,
                    align: 'center',
                    onCell: (record) => ({ rowSpan: record.rowType === 'summary' ? 1 + campusList.length : 0 }),
                    render: (val) => <span style={{fontSize: '12px'}}>{val}</span>
                },
                {
                    title: <div style={{fontSize: '12px'}}>实际<br/>拍摄次数</div>,
                    dataIndex: 'actualShootVideos',
                    width: 60,
                    align: 'center',
                    onCell: (record) => ({ rowSpan: record.rowType === 'summary' ? 1 + campusList.length : 0 }),
                    render: (val) => <span style={{fontSize: '12px'}}>{val}</span>
                },
                {
                    title: <div style={{fontSize: '12px'}}>拍摄<br/>完成进度</div>,
                    dataIndex: 'shootCompletionProgress',
                    width: 60,
                    align: 'center',
                    onCell: (record) => ({ rowSpan: record.rowType === 'summary' ? 1 + campusList.length : 0 }),
                    render: (val) => <span style={{fontSize: '12px', color: val === '0%' ? '#999' : 'inherit'}}>{val}</span>
                }
            ]
        },
        {
            title: '剪辑类', 
            children: [
                {
                    title: <div style={{fontSize: '12px'}}>本月计划<br/>剪辑数</div>,
                    dataIndex: 'monthlyEditPlans',
                    width: 60,
                    align: 'center',
                    render: (val) => <span style={{fontSize: '12px'}}>{val}</span>
                },
                {
                    title: <div style={{fontSize: '12px'}}>截止昨日<br/>应完成剪辑数</div>,
                    dataIndex: 'completedEarlyPlans',
                    width: 70,
                    align: 'center',
                    render: (val) => <span style={{fontSize: '12px'}}>{val}</span>
                },
                {
                    title: <div style={{fontSize: '12px'}}>实际<br/>完成剪辑数</div>,
                    dataIndex: 'actualEditedVideos',
                    width: 60,
                    align: 'center',
                    render: (val) => <span style={{fontSize: '12px'}}>{val}</span>
                },
                {
                    title: <div style={{fontSize: '12px'}}>剪辑<br/>完成进度</div>,
                    dataIndex: 'editProgressRate',
                    width: 60,
                    align: 'center',
                    render: (val) => <span style={{fontSize: '12px', color: val === '0%' ? '#999' : 'inherit'}}>{val}</span>
                }
            ]
        },
        {
            title: '结果类',
            children: [
                {
                    title: <div style={{fontSize: '12px'}}>审核<br/>通过数</div>,
                    dataIndex: 'auditPassVideoCount',
                    width: 60,
                    align: 'center',
                    render: (val) => <span style={{fontSize: '12px'}}>{val}</span>
                },
                {
                    title: <div style={{fontSize: '12px'}}>审核<br/>通过率</div>,
                    dataIndex: 'auditPassRate',
                    width: 60,
                    align: 'center',
                    render: (val) => <span style={{fontSize: '12px', color: val === '0%' ? '#999' : 'inherit'}}>{val}</span>
                }
            ]
        },
        {
            title: '集团活动',
            dataIndex: 'groupActivity',
            width: 100,
            align: 'center',
            onCell: (record) => ({ rowSpan: record.rowType === 'summary' ? 1 + campusList.length : 0 }),
            render: (val) => <span style={{fontSize: '12px'}}>{val}</span>
        }
    ]

    return (
        <div>
            <Space style={{ marginBottom: 16 }}>
                <Button
                    icon={<ReloadOutlined />}
                    onClick={handleRefreshFromWeekly}
                    loading={loading}
                    title="从剪辑周度表重新获取数据"
                >
                    刷新数据
                </Button>
                <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    onClick={handleSave}
                    loading={loading}
                    title="保存当前数据到数据库"
                >
                    保存数据
                </Button>
            </Space>
            <Table
                columns={columns}
                dataSource={dataSource}
                rowKey="key"
                pagination={false}
                bordered
                size="small"
                scroll={{ x: 1050, y: 700 }}
                rowClassName={(record) => record.rowType === 'summary' ? 'summary-row' : ''}
            />
            <style>{`
                .summary-row td {
                    background-color: #fafafa;
                    font-weight: bold; 
                }
                .ant-table-wrapper .ant-table-thead > tr > th {
                    background-color: #e6f7ff !important;
                    font-weight: bold;
                    text-align: center;
                    padding: 4px !important;
                    font-size: 12px !important;
                }
                .ant-table-wrapper .ant-table-tbody > tr > td {
                    padding: 4px !important;
                    font-size: 12px !important;
                }
            `}</style>
        </div>
    )
}

export default MonthlyEditReportTab
