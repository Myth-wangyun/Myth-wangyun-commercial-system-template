import React, { useEffect, useMemo, useState, useCallback, memo } from 'react'
import { App, Card, DatePicker, Input, Space, Table, Button } from 'antd'
import { FileTextOutlined, SaveOutlined } from '@ant-design/icons'
import dayjs, { Dayjs } from 'dayjs'
import api from '@/services/api'
import { NoCopyContainer } from '@/components/common'

/**
 * 012祈福司员工访谈记录表
 */

const { TextArea } = Input

// 月份访谈内容类型
type MonthContent = {
  访谈人: string
  访谈内容: string
}

// 访谈记录行类型
type InterviewRow = {
  key: string
  序号: number
  岗位姓名: string
  月份数据: {
    [key: string]: MonthContent
  }
}

// 可编辑单元格组件 - 使用 memo 避免不必要的重渲染
interface EditableCellProps {
  value: string
  rowIndex: number
  field: string
  month?: string
  onUpdate: (rowIndex: number, month: string | undefined, field: string, value: string) => void
  isTextArea?: boolean
  placeholder?: string
}

const EditableCell = memo(function EditableCell({
  value,
  rowIndex,
  field,
  month,
  onUpdate,
  isTextArea,
  placeholder,
}: EditableCellProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      onUpdate(rowIndex, month, field, e.target.value)
    },
    [rowIndex, month, field, onUpdate]
  )

  if (isTextArea) {
    return (
      <TextArea
        value={value}
        onChange={handleChange}
        size="small"
        placeholder={placeholder}
        autoSize={{ minRows: 2, maxRows: 6 }}
      />
    )
  }

  return (
    <Input
      value={value}
      onChange={handleChange}
      size="small"
      placeholder={placeholder}
    />
  )
})

export default function ConsultStaffInterview() {
  const { message, notification } = App.useApp()
  const currentYear = dayjs().format('YYYY')
  const [year, setYear] = useState(currentYear)
  const [rows, setRows] = useState<InterviewRow[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // 12个月份
  const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

  // 初始化15行空数据
  const createEmptyRows = (): InterviewRow[] => {
    return Array.from({ length: 15 }, (_, i) => ({
      key: String(i + 1),
      序号: i + 1,
      岗位姓名: '',
      月份数据: months.reduce((acc, month) => {
        acc[month] = { 访谈人: '', 访谈内容: '' }
        return acc
      }, {} as { [key: string]: MonthContent }),
    }))
  }

  // 加载数据
  const loadData = async (yearValue: string) => {
    setLoading(true)
    try {
      const response = await api.get(`/consult/staff-interview/${yearValue}`)
      if (response.data && response.data.表格数据) {
        setRows(response.data.表格数据.map((row: any) => ({
          ...row,
          key: String(row.序号),
        })))
      } else {
        setRows(createEmptyRows())
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        setRows(createEmptyRows())
      } else {
        message.error('加载数据失败')
        console.error(error)
      }
    } finally {
      setLoading(false)
    }
  }

  // 初始加载
  useEffect(() => {
    loadData(year)
  }, [year])

  // 年份改变
  const handleYearChange = (date: Dayjs | null) => {
    if (!date) return
    const newYear = date.format('YYYY')
    setYear(newYear)
  }

  // 更新岗位姓名
  const updatePosition = (index: number, value: string) => {
    setRows(prev => {
      const next = [...prev]
      next[index].岗位姓名 = value
      return next
    })
  }

  // 更新月份数据
  const updateMonthData = (
    rowIndex: number,
    month: string,
    field: '访谈人' | '访谈内容',
    value: string,
  ) => {
    setRows(prev => {
      const next = [...prev]
      if (!next[rowIndex].月份数据[month]) {
        next[rowIndex].月份数据[month] = { 访谈人: '', 访谈内容: '' }
      }
      next[rowIndex].月份数据[month][field] = value
      return next
    })
  }

  // 统一的单元格更新函数 - 使用 useCallback 稳定引用
  const handleCellUpdate = useCallback(
    (rowIndex: number, month: string | undefined, field: string, value: string) => {
      if (field === '岗位姓名') {
        updatePosition(rowIndex, value)
      } else if (month) {
        updateMonthData(rowIndex, month, field as '访谈人' | '访谈内容', value)
      }
    },
    []
  )

  // 保存数据
  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        表格数据: rows.map(row => ({
          序号: row.序号,
          岗位姓名: row.岗位姓名,
          月份数据: row.月份数据,
        })),
      }

      // 先尝试更新，如果不存在则创建
      try {
        await api.put(`/consult/staff-interview/${year}`, payload)
      } catch (error: any) {
        if (error.response?.status === 404) {
          await api.post('/consult/staff-interview/', {
            年份: parseInt(year),
            ...payload,
          })
        } else {
          throw error
        }
      }
      notification.success({
        message: '已保存',
        description: `${year}年员工访谈记录已成功保存`,
        placement: 'topRight',
        duration: 3,
      })
    } catch (error) {
      notification.error({
        message: '保存失败',
        description: '请检查网络连接或联系管理员',
        placement: 'topRight',
        duration: 4,
      })
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  // 生成列配置 - 移除 rows 依赖，使用稳定的 render 函数
  const columns = useMemo(() => {
    const baseColumns = [
      {
        title: '序号',
        dataIndex: '序号',
        key: '序号',
        width: 60,
        fixed: 'left' as const,
        align: 'center' as const,
      },
      {
        title: '岗位/姓名',
        dataIndex: '岗位姓名',
        key: '岗位姓名',
        width: 120,
        fixed: 'left' as const,
        render: (val: string, record: InterviewRow, index: number) => (
          <EditableCell
            value={val}
            rowIndex={index}
            field="岗位姓名"
            onUpdate={handleCellUpdate}
            placeholder="岗位/姓名"
          />
        ),
      },
    ]

    // 为每个月份生成两列（访谈人、访谈内容）
    const monthColumns = months.map(month => ({
      title: month,
      children: [
        {
          title: '访谈人',
          key: `${month}-访谈人`,
          width: 100,
          render: (_: any, record: InterviewRow, index: number) => (
            <EditableCell
              value={record.月份数据[month]?.访谈人 || ''}
              rowIndex={index}
              field="访谈人"
              month={month}
              onUpdate={handleCellUpdate}
              placeholder="访谈人"
            />
          ),
        },
        {
          title: '访谈内容',
          key: `${month}-访谈内容`,
          width: 200,
          render: (_: any, record: InterviewRow, index: number) => (
            <EditableCell
              value={record.月份数据[month]?.访谈内容 || ''}
              rowIndex={index}
              field="访谈内容"
              month={month}
              onUpdate={handleCellUpdate}
              isTextArea
              placeholder="访谈内容"
            />
          ),
        },
      ],
    }))

    return [...baseColumns, ...monthColumns]
  }, [months, handleCellUpdate])

  return (
    <NoCopyContainer warningMessage="祈福司门数据禁止复制">
      <Card
        title={
          <Space>
            <FileTextOutlined />
            <span>祈福司员工访谈记录表</span>
          </Space>
        }
        extra={
          <Space>
            <DatePicker
              value={dayjs(year, 'YYYY')}
              onChange={handleYearChange}
              picker="year"
              allowClear={false}
            />
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSave}
              loading={saving}
            >
              保存
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={rows}
          pagination={false}
          bordered
          size="small"
          scroll={{ x: 2800 }}
          loading={loading}
          style={{ marginTop: 16 }}
        />
      </Card>
    </NoCopyContainer>
  )
}
