import React, { useMemo, useState, useEffect } from 'react'
import { App, Button, DatePicker, Input, InputNumber, Select, Space, Table } from 'antd'
import { PlusOutlined, DeleteOutlined, SaveOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { Dayjs } from 'dayjs'
import {
  getTrainingWeeklyListByYear,
  createTrainingWeekly,
  updateTrainingWeekly,
  deleteTrainingWeekly,
  type TrainingWeeklyRecord,
} from '@/api/consult/training-weekly'
import { useCampusStore } from '@/stores/campusStore'

/**
 * TAB3 - 03培训周度表
 * 最高议事厅-祈福司培训计划与成绩本月/周度统计表
 */

const { Option } = Select

// 培训记录类型
interface TrainingRecord {
  key: string
  记录ID?: number
  index: number | string
  isTotal: boolean
  position: string
  trainingDate: Dayjs | null
  trainingProject: string
  mainContent: string
  trainingMethod: string
  organizer: string
  traineesCount: number | null
  qualifiedCount: number | null
  passRate: string
  averageScore: number | null
  isDirty?: boolean // 标记是否有未保存的更改
}

interface Tab3WeeklyTrainingProps {
  year: string
}

export default function Tab3WeeklyTraining({ year }: Tab3WeeklyTrainingProps) {
  const { message, notification } = App.useApp()
  const [rows, setRows] = useState<TrainingRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const { currentCampus } = useCampusStore()

  // 创建空行
  const makeEmptyRow = (index: number | string, isTotal = false): TrainingRecord => ({
    key: String(index),
    index,
    isTotal,
    position: '',
    trainingDate: null,
    trainingProject: '',
    mainContent: '',
    trainingMethod: '',
    organizer: '',
    traineesCount: null,
    qualifiedCount: null,
    passRate: '',
    averageScore: null,
    isDirty: false,
  })

  // 从API记录转换为界面记录
  const convertFromAPI = (apiRecord: TrainingWeeklyRecord, index: number): TrainingRecord => ({
    key: String(apiRecord.记录ID || index),
    记录ID: apiRecord.记录ID,
    index,
    isTotal: false,
    position: apiRecord.岗位 || '',
    trainingDate: apiRecord.培训时间 ? dayjs(apiRecord.培训时间) : null,
    trainingProject: apiRecord.培训项目 || '',
    mainContent: apiRecord.主要内容 || '',
    trainingMethod: apiRecord.培训方式 || '',
    organizer: apiRecord.组织负责人 || '',
    traineesCount: apiRecord.培训人次 || null,
    qualifiedCount: apiRecord.合格人数 || null,
    passRate: apiRecord.考试合格率 ? `${apiRecord.考试合格率}%` : '',
    averageScore: apiRecord.平均成绩 || null,
    isDirty: false,
  })

  // 转换为API格式
  const convertToAPI = (record: TrainingRecord): Partial<TrainingWeeklyRecord> => ({
    年份: parseInt(year),
    神殿: currentCampus || undefined,
    岗位: record.position || undefined,
    培训时间: record.trainingDate ? record.trainingDate.format('YYYY-MM-DD') : undefined,
    培训项目: record.trainingProject || undefined,
    主要内容: record.mainContent || undefined,
    培训方式: record.trainingMethod || undefined,
    组织负责人: record.organizer || undefined,
    培训人次: record.traineesCount || 0,
    合格人数: record.qualifiedCount || 0,
    平均成绩: record.averageScore || undefined,
  })

  // 加载数据
  const loadData = async () => {
    setLoading(true)
    try {
      const response = await getTrainingWeeklyListByYear({
        year: parseInt(year),
        page: 1,
        page_size: 200,
      })

      // api.request 返回 AxiosResponse，需要访问 .data
      const data = 'data' in response ? response.data : response
      console.log('加载的数据:', data)

      if (data?.items && data.items.length > 0) {
        const dataRows = data.items.map((item, idx) => convertFromAPI(item, idx + 1))
        const totalRow = makeEmptyRow('合计', true)
        setRows(recomputeTotal([totalRow, ...dataRows]))
      } else {
        // 没有数据，初始化空表格
        const totalRow = makeEmptyRow('合计', true)
        const initialRows = [totalRow]
        for (let i = 1; i <= 4; i++) {
          initialRows.push(makeEmptyRow(i, false))
        }
        setRows(initialRows)
      }
    } catch (error) {
      console.error('加载数据失败:', error)
      message.error('加载数据失败')
      // 加载失败也初始化空表格
      const totalRow = makeEmptyRow('合计', true)
      const initialRows = [totalRow]
      for (let i = 1; i <= 4; i++) {
        initialRows.push(makeEmptyRow(i, false))
      }
      setRows(initialRows)
    } finally {
      setLoading(false)
    }
  }

  // 年份改变时重新加载数据
  useEffect(() => {
    loadData()
  }, [year, currentCampus])

  // 计算合格率
  const calculatePassRate = (traineesCount: number | null, qualifiedCount: number | null): string => {
    if (!traineesCount || traineesCount === 0) return ''
    const rate = ((qualifiedCount || 0) / traineesCount) * 100
    return `${rate.toFixed(2)}%`
  }

  // 重新计算合计行
  const recomputeTotal = (next: TrainingRecord[]): TrainingRecord[] => {
    const dataRows = next.filter(r => !r.isTotal)
    const totalRow = next.find(r => r.isTotal)!

    const sum = (field: keyof TrainingRecord) =>
      dataRows.reduce(
        (acc, r) => acc + (typeof r[field] === 'number' ? (r[field] as number) : 0),
        0,
      )

    totalRow.traineesCount = sum('traineesCount') || null
    totalRow.qualifiedCount = sum('qualifiedCount') || null

    // 计算合格率
    totalRow.passRate = calculatePassRate(totalRow.traineesCount, totalRow.qualifiedCount)

    // 计算平均成绩
    const scoresCount = dataRows.filter(r => r.averageScore !== null).length
    if (scoresCount > 0) {
      const totalScore = dataRows.reduce((acc, r) => acc + (r.averageScore || 0), 0)
      totalRow.averageScore = totalScore / scoresCount
    } else {
      totalRow.averageScore = null
    }

    return next
  }

  // 添加新行
  const handleAddRow = () => {
    setRows(prev => {
      const next = [...prev]
      const lastIndex = next.filter(r => !r.isTotal).length
      next.push(makeEmptyRow(lastIndex + 1, false))
      return recomputeTotal(next)
    })
  }

  // 删除行
  const handleDeleteRow = async (index: number | string, recordId?: number) => {
    if (index === '合计') return

    if (recordId) {
      // 如果有记录ID，从后端删除
      try {
        await deleteTrainingWeekly(recordId)
        message.success('删除成功')
        loadData() // 重新加载数据
      } catch (error) {
        console.error('删除失败:', error)
        message.error('删除失败')
      }
    } else {
      // 没有记录ID，只从本地删除
      setRows(prev => {
        const next = prev.filter(r => r.index !== index)
        // 重新编号
        let dataIndex = 1
        next.forEach(row => {
          if (!row.isTotal) {
            row.index = dataIndex++
          }
        })
        return recomputeTotal(next)
      })
    }
  }

  // 保存单条记录
  const handleSaveRow = async (record: TrainingRecord) => {
    if (record.isTotal) return

    setSaving(true)
    try {
      const apiData = convertToAPI(record)

      if (record.记录ID) {
        // 更新现有记录
        await updateTrainingWeekly(record.记录ID, apiData)
        notification.success({ message: '已保存', description: '记录更新成功', placement: 'topRight', duration: 3 })
      } else {
        // 创建新记录
        await createTrainingWeekly(apiData as TrainingWeeklyRecord)
        notification.success({ message: '已创建', description: '新记录创建成功', placement: 'topRight', duration: 3 })
      }

      // 重新加载数据
      loadData()
    } catch (error) {
      console.error('保存失败:', error)
      notification.error({ message: '保存失败', description: '请检查网络连接或联系管理员', placement: 'topRight', duration: 4 })
    } finally {
      setSaving(false)
    }
  }

  // 批量保存所有记录（包括有数据的行）
  const handleSaveAll = async () => {
    // 筛选出有实际数据的行（至少有一个字段有值）
    const dataRows = rows.filter(r => {
      if (r.isTotal) return false
      // 检查是否有任何有效数据
      return (
        r.position ||
        r.trainingDate ||
        r.trainingProject ||
        r.mainContent ||
        r.trainingMethod ||
        r.organizer ||
        (r.traineesCount !== null && r.traineesCount > 0) ||
        (r.qualifiedCount !== null && r.qualifiedCount > 0) ||
        (r.averageScore !== null && r.averageScore > 0)
      )
    })

    if (dataRows.length === 0) {
      message.info('没有需要保存的数据')
      return
    }

    setSaving(true)
    try {
      let successCount = 0
      for (const row of dataRows) {
        const apiData = convertToAPI(row)
        if (row.记录ID) {
          await updateTrainingWeekly(row.记录ID, apiData)
        } else {
          await createTrainingWeekly(apiData as TrainingWeeklyRecord)
        }
        successCount++
      }
      notification.success({ message: '批量保存成功', description: `共成功保存 ${successCount} 条记录`, placement: 'topRight', duration: 3 })
      loadData()
    } catch (error) {
      console.error('批量保存失败:', error)
      notification.error({ message: '批量保存失败', description: '请检查网络连接或联系管理员', placement: 'topRight', duration: 4 })
    } finally {
      setSaving(false)
    }
  }

  // 更新数值字段
  const updateNumberValue = (index: number | string, field: keyof TrainingRecord, value: number | null) => {
    setRows(prev => {
      const next = [...prev]
      const row = next.find(r => r.index === index)
      if (!row || row.isTotal) return prev
      ;(row as any)[field] = value
      row.isDirty = true // 标记为已修改

      // 自动计算该行的合格率
      if (field === 'traineesCount' || field === 'qualifiedCount') {
        row.passRate = calculatePassRate(row.traineesCount, row.qualifiedCount)
      }

      return recomputeTotal(next)
    })
  }

  // 更新文本字段
  const updateStringValue = (index: number | string, field: keyof TrainingRecord, value: string) => {
    setRows(prev => {
      const next = [...prev]
      const row = next.find(r => r.index === index)
      if (!row || row.isTotal) return prev
      ;(row as any)[field] = value
      row.isDirty = true // 标记为已修改
      return next
    })
  }

  // 更新日期字段
  const updateDateValue = (index: number | string, value: Dayjs | null) => {
    setRows(prev => {
      const next = [...prev]
      const row = next.find(r => r.index === index)
      if (!row || row.isTotal) return prev
      row.trainingDate = value
      row.isDirty = true // 标记为已修改
      return next
    })
  }

  // 渲染输入框
  const renderInput = (
    value: string,
    index: number | string,
    field: keyof TrainingRecord,
    isTotal: boolean,
  ) => {
    if (isTotal) return null
    return (
      <Input
        value={value}
        onChange={e => updateStringValue(index, field, e.target.value)}
        size="small"
        placeholder=""
      />
    )
  }

  // 渲染数值输入框
  const renderNumberInput = (
    value: number | null,
    index: number | string,
    field: keyof TrainingRecord,
    isTotal: boolean,
  ) => {
    if (isTotal) {
      return <span style={{ fontWeight: 'bold' }}>{value !== null ? value : 0}</span>
    }
    return (
      <InputNumber
        value={value}
        onChange={val => updateNumberValue(index, field, val)}
        size="small"
        min={0}
        precision={field === 'averageScore' ? 2 : 0}
        style={{ width: '100%' }}
        placeholder="0"
      />
    )
  }

  // 渲染日期选择器
  const renderDatePicker = (
    value: Dayjs | null,
    index: number | string,
    isTotal: boolean,
  ) => {
    if (isTotal) return null
    return (
      <DatePicker
        value={value}
        onChange={date => updateDateValue(index, date)}
        size="small"
        style={{ width: '100%' }}
        format="YYYY-MM-DD"
      />
    )
  }

  // 渲染下拉选择
  const renderSelect = (
    value: string,
    index: number | string,
    field: keyof TrainingRecord,
    isTotal: boolean,
    options: string[],
  ) => {
    if (isTotal) return null
    return (
      <Select
        value={value || undefined}
        onChange={val => updateStringValue(index, field, val)}
        size="small"
        style={{ width: '100%' }}
        placeholder="请选择"
      >
        {options.map(option => (
          <Option key={option} value={option}>
            {option}
          </Option>
        ))}
      </Select>
    )
  }

  // 表格列配置
  const columns: ColumnsType<TrainingRecord> = [
    {
      title: '序号',
      dataIndex: 'index',
      key: 'index',
      width: 60,
      fixed: 'left',
      align: 'center',
      render: (val: number | string, record: TrainingRecord) => (
        <span style={{ fontWeight: record.isTotal ? 'bold' : 'normal' }}>{val}</span>
      ),
    },
    {
      title: '岗位',
      dataIndex: 'position',
      key: 'position',
      width: 120,
      fixed: 'left',
      render: (val: string, record: TrainingRecord) =>
        renderSelect(val, record.index, 'position', record.isTotal, [
          '校长',
          '咨询经理',
          '咨询师',
          '运营',
        ]),
    },
    {
      title: '培训时间（年-月-日）',
      dataIndex: 'trainingDate',
      key: 'trainingDate',
      width: 150,
      render: (val: Dayjs | null, record: TrainingRecord) =>
        renderDatePicker(val, record.index, record.isTotal),
    },
    {
      title: '培训项目',
      dataIndex: 'trainingProject',
      key: 'trainingProject',
      width: 200,
      render: (val: string, record: TrainingRecord) =>
        renderSelect(val, record.index, 'trainingProject', record.isTotal, [
          '价值观',
          '神殿专业知识培训',
          '岗位知识培训',
          '职业素养',
        ]),
    },
    {
      title: '主要内容',
      dataIndex: 'mainContent',
      key: 'mainContent',
      width: 200,
      render: (val: string, record: TrainingRecord) =>
        renderInput(val, record.index, 'mainContent', record.isTotal),
    },
    {
      title: '培训方式',
      dataIndex: 'trainingMethod',
      key: 'trainingMethod',
      width: 120,
      render: (val: string, record: TrainingRecord) =>
        renderSelect(val, record.index, 'trainingMethod', record.isTotal, [
          '演讲',
          '互动',
          '授课',
        ]),
    },
    {
      title: '组织负责人',
      dataIndex: 'organizer',
      key: 'organizer',
      width: 120,
      render: (val: string, record: TrainingRecord) =>
        renderInput(val, record.index, 'organizer', record.isTotal),
    },
    {
      title: '培训人次',
      dataIndex: 'traineesCount',
      key: 'traineesCount',
      width: 100,
      align: 'right',
      render: (val: number | null, record: TrainingRecord) =>
        renderNumberInput(val, record.index, 'traineesCount', record.isTotal),
    },
    {
      title: '合格人数',
      dataIndex: 'qualifiedCount',
      key: 'qualifiedCount',
      width: 100,
      align: 'right',
      render: (val: number | null, record: TrainingRecord) =>
        renderNumberInput(val, record.index, 'qualifiedCount', record.isTotal),
    },
    {
      title: '考试合格率',
      dataIndex: 'passRate',
      key: 'passRate',
      width: 120,
      align: 'center',
      render: (val: string, record: TrainingRecord) => (
        <span style={{ color: record.isTotal ? '#000' : '#1890ff', fontWeight: record.isTotal ? 'bold' : 500 }}>
          {val}
        </span>
      ),
    },
    {
      title: '平均成绩',
      dataIndex: 'averageScore',
      key: 'averageScore',
      width: 100,
      align: 'right',
      render: (val: number | null, record: TrainingRecord) =>
        renderNumberInput(val, record.index, 'averageScore', record.isTotal),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      align: 'center',
      render: (_: any, record: TrainingRecord) => {
        if (record.isTotal) return null
        return (
          <Space>
            <Button
              type="primary"
              size="small"
              icon={<SaveOutlined />}
              loading={saving}
              onClick={() => handleSaveRow(record)}
            >
              保存
            </Button>
            <Button
              type="link"
              danger
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteRow(record.index, record.记录ID)}
            >
              删除
            </Button>
          </Space>
        )
      },
    },
  ]

  return (
    <div style={{ padding: '24px 0' }}>
      <div
        style={{
          background: '#FFA500',
          color: '#fff',
          padding: '8px 16px',
          fontWeight: 'bold',
          fontSize: '14px',
          marginBottom: 16,
        }}
      >
        最高议事厅-祈福司培训计划与成绩本月/周度统计表
      </div>

      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddRow}>
          添加培训记录
        </Button>
        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={handleSaveAll}
          loading={saving}
        >
          批量保存全部
        </Button>
      </Space>

      <Table
        columns={columns}
        dataSource={rows}
        pagination={false}
        bordered
        size="small"
        scroll={{ x: 1800 }}
        loading={loading}
        rowClassName={record => (record.isTotal ? 'total-row' : '')}
      />

      <div style={{ marginTop: 16, fontSize: '12px', color: '#666' }}>
        <div>【培训项目】圈圈：价值观、神殿专业知识培训、岗位知识培训、职业素养；</div>
        <div>【主要内容】就是此次培训的标题/主题</div>
        <div>【培训方式】演讲、互动、授课</div>
      </div>

      <style>{`
        .total-row {
          background-color: #fafafa;
          font-weight: bold;
        }
        .total-row td {
          background-color: #fafafa !important;
        }
      `}</style>
    </div>
  )
}
