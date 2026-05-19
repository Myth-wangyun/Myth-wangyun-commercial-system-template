/**
 * 神殿教化司员工访谈表页面
 */

import React, { useState, useMemo, useEffect, useRef } from 'react'
import { App, Card, Table, Button, Space, Select, Input, Typography, Tag, Modal } from 'antd'
import {
  ReloadOutlined,
  DownloadOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FileTextOutlined,
  SaveOutlined,
  FileExcelOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useCampusStore } from '@/stores/campusStore'
import {
  fetchInterviewMonths,
  fetchInterviewRecord,
  saveInterviewRecord,
} from '@/services/academicStaffInterview'
import type { InterviewMonthRecord } from '@/services/academicStaffInterview'
import * as XLSX from 'xlsx'

const { Option } = Select
const { TextArea } = Input
const { Text } = Typography

const MONTHS = [
  '1月',
  '2月',
  '3月',
  '4月',
  '5月',
  '6月',
  '7月',
  '8月',
  '9月',
  '10月',
  '11月',
  '12月',
]

// 员工访谈记录接口
interface EmployeeInterviewRecord {
  key: string
  serialNumber: number // 序号
  interviewSubject: string // 访谈对象
  months: {
    [month: string]: {
      interviewTime?: string // 访谈人
      interviewContent?: string // 访谈内容
    }
  }
}

const buildEmptyRow = (index: number): EmployeeInterviewRecord => {
  const monthData: EmployeeInterviewRecord['months'] = {}
  MONTHS.forEach((m) => {
    monthData[m] = {}
  })
  return {
    key: `${index + 1}`,
    serialNumber: index + 1,
    interviewSubject: '',
    months: monthData,
  }
}

const buildInitialTable = () => {
  return Array.from({ length: 24 }).map((_, idx) => buildEmptyRow(idx))
}

const CampusEmployeeInterviewPage: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus, getAllCampuses } = useCampusStore()
  const campuses = getAllCampuses()
  const now = new Date()
  const [selectedCampus, setSelectedCampus] = useState<string>(currentCampus || '')
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1)
  const [availableMonths, setAvailableMonths] = useState<number[]>([])
  const [loading, setLoading] = useState(false)
  const [dataSource, setDataSource] = useState<EmployeeInterviewRecord[]>(buildInitialTable())
  const [editingKey, setEditingKey] = useState<string>('')
  const [editingMonth, setEditingMonth] = useState<string>('')
  const [editingField, setEditingField] = useState<
    'interviewTime' | 'interviewContent' | 'interviewSubject' | ''
  >('')
  const [importModalVisible, setImportModalVisible] = useState(false)
  const [importLoading, setImportLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 顶部神殿变更时同步本页显示
  useEffect(() => {
    if (currentCampus) setSelectedCampus(currentCampus)
  }, [currentCampus])

  const campusName = selectedCampus || currentCampus || ''

  const loadMonths = async () => {
    if (!campusName) return
    try {
      const res = await fetchInterviewMonths(campusName, selectedYear)
      setAvailableMonths(res.月份列表 || [])
    } catch (error) {
      console.error('加载月份列表失败', error)
    }
  }

  const loadRecord = async () => {
    if (!campusName) return
    setLoading(true)
    try {
      const res = await fetchInterviewRecord(campusName, selectedYear, selectedMonth)
      const mapped: EmployeeInterviewRecord[] = res.表格数据.map((row, idx) => {
        const months: EmployeeInterviewRecord['months'] = {}
        MONTHS.forEach((label, monthIndex) => {
          const key = String(monthIndex + 1)
          const content = row.月份内容?.[key] || {}
          months[label] = {
            interviewTime: content.访谈人 || '',
            interviewContent: content.访谈内容 || '',
          }
        })
        return {
          key: row.序号 ? String(row.序号) : `${idx + 1}`,
          serialNumber: row.序号 || idx + 1,
          interviewSubject: row.访谈对象 || '',
          months,
        }
      })
      if (mapped.length) {
        setDataSource(mapped)
      } else {
        setDataSource(buildInitialTable())
      }
    } catch (error) {
      console.error('加载访谈记录失败', error)
      setDataSource(buildInitialTable())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMonths()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campusName, selectedYear])

  useEffect(() => {
    loadRecord()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campusName, selectedYear, selectedMonth])

  // 生成月份列
  const monthColumns = useMemo(() => {
    const months = [
      '1月',
      '2月',
      '3月',
      '4月',
      '5月',
      '6月',
      '7月',
      '8月',
      '9月',
      '10月',
      '11月',
      '12月',
    ]

    return months.map((month) => ({
      title: month,
      key: month,
      align: 'center' as const,
      children: [
        {
          title: '访谈人',
          key: `${month}-time`,
          width: 120,
          align: 'center' as const,
          render: (_, record: EmployeeInterviewRecord) => {
            const text = record.months[month]?.interviewTime || ''
            const isEditing =
              editingKey === record.key &&
              editingMonth === month &&
              editingField === 'interviewTime'
            if (isEditing) {
              return (
                <Input
                  value={text}
                  onChange={(e) => {
                    const newDataSource = [...dataSource]
                    const index = newDataSource.findIndex((item) => item.key === record.key)
                    if (index !== -1) {
                      if (!newDataSource[index].months[month]) {
                        newDataSource[index].months[month] = {}
                      }
                      newDataSource[index].months[month].interviewTime = e.target.value
                      setDataSource(newDataSource)
                    }
                  }}
                  onBlur={() => {
                    setEditingKey('')
                    setEditingMonth('')
                    setEditingField('')
                  }}
                  onPressEnter={() => {
                    setEditingKey('')
                    setEditingMonth('')
                    setEditingField('')
                  }}
                  autoFocus
                />
              )
            }
            return (
              <div
                onClick={() => {
                  setEditingKey(record.key)
                  setEditingMonth(month)
                  setEditingField('interviewTime')
                }}
                style={{ cursor: 'pointer', minHeight: '32px', padding: '4px' }}
              >
                {text}
              </div>
            )
          },
        },
        {
          title: '访谈内容',
          key: `${month}-content`,
          width: 200,
          align: 'center' as const,
          render: (_, record: EmployeeInterviewRecord) => {
            const text = record.months[month]?.interviewContent || ''
            const isEditing =
              editingKey === record.key &&
              editingMonth === month &&
              editingField === 'interviewContent'
            if (isEditing) {
              return (
                <TextArea
                  value={text}
                  onChange={(e) => {
                    const newDataSource = [...dataSource]
                    const index = newDataSource.findIndex((item) => item.key === record.key)
                    if (index !== -1) {
                      if (!newDataSource[index].months[month]) {
                        newDataSource[index].months[month] = {}
                      }
                      newDataSource[index].months[month].interviewContent = e.target.value
                      setDataSource(newDataSource)
                    }
                  }}
                  onBlur={() => {
                    setEditingKey('')
                    setEditingMonth('')
                    setEditingField('')
                  }}
                  autoSize={{ minRows: 2, maxRows: 4 }}
                  autoFocus
                />
              )
            }
            return (
              <div
                onClick={() => {
                  setEditingKey(record.key)
                  setEditingMonth(month)
                  setEditingField('interviewContent')
                }}
                style={{
                  cursor: 'pointer',
                  minHeight: '32px',
                  padding: '4px',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {text}
              </div>
            )
          },
        },
      ],
    }))
  }, [dataSource, editingKey, editingMonth, editingField])

  // 定义表格列
  const columns: ColumnsType<EmployeeInterviewRecord> = useMemo(() => {
    const baseColumns: ColumnsType<EmployeeInterviewRecord> = [
      {
        title: '序号',
        dataIndex: 'serialNumber',
        key: 'serialNumber',
        width: 80,
        align: 'center',
        render: (value) => value,
      },
      {
        title: '访谈对象',
        dataIndex: 'interviewSubject',
        key: 'interviewSubject',
        width: 150,
        align: 'center',
        render: (value, record) => {
          const isEditing = editingKey === record.key && editingField === 'interviewSubject'
          if (isEditing) {
            return (
              <Input
                value={value}
                onChange={(e) => {
                  const newDataSource = [...dataSource]
                  const index = newDataSource.findIndex((item) => item.key === record.key)
                  if (index !== -1) {
                    newDataSource[index].interviewSubject = e.target.value
                    setDataSource(newDataSource)
                  }
                }}
                onBlur={() => {
                  setEditingKey('')
                  setEditingField('')
                }}
                onPressEnter={() => {
                  setEditingKey('')
                  setEditingField('')
                }}
                autoFocus
              />
            )
          }
          return (
            <div
              onClick={() => {
                setEditingKey(record.key)
                setEditingField('interviewSubject')
              }}
              style={{ cursor: 'pointer', minHeight: '32px', padding: '4px' }}
            >
              {value}
            </div>
          )
        },
      },
      ...monthColumns,
      {
        title: '操作',
        key: 'action',
        width: 120,
        align: 'center',
        fixed: 'right',
        render: (_, record) => (
          <Space>
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => {
                setEditingKey(record.key)
                setEditingField('interviewSubject')
              }}
            >
              编辑
            </Button>
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              onClick={() => {
                const newDataSource = dataSource.filter((item) => item.key !== record.key)
                // 重新编号
                newDataSource.forEach((item, index) => {
                  item.serialNumber = index + 1
                })
                setDataSource(newDataSource)
                message.success('删除成功')
              }}
            >
              删除
            </Button>
          </Space>
        ),
      },
    ]
    return baseColumns
  }, [dataSource, monthColumns, editingKey, editingField])

  const buildPayloadRows = (): InterviewMonthRecord[] => {
    return dataSource.map((record) => {
      const monthContent: InterviewMonthRecord['月份内容'] = {}
      MONTHS.forEach((label, index) => {
        const key = String(index + 1)
        monthContent[key] = {
          访谈人: record.months[label]?.interviewTime || '',
          访谈内容: record.months[label]?.interviewContent || '',
        }
      })
      return {
        序号: record.serialNumber,
        访谈对象: record.interviewSubject,
        月份内容: monthContent,
      }
    })
  }

  const handleRefresh = () => {
    loadMonths()
    loadRecord()
    message.success('数据已刷新')
  }

  const handleSave = async () => {
    if (!campusName) return
    setLoading(true)
    try {
      await saveInterviewRecord(campusName, selectedYear, selectedMonth, buildPayloadRows())
      if (!availableMonths.includes(selectedMonth)) {
        setAvailableMonths((prev) => [...prev, selectedMonth].sort((a, b) => a - b))
      }
      message.success('保存成功')
    } catch (error) {
      console.error('保存失败', error)
      message.error('保存失败')
    } finally {
      setLoading(false)
    }
  }

  // 导出数据
  const handleExport = () => {
    message.info('导出功能开发中...')
  }

  /**
   * 解析Excel文件中的教员访谈数据
   */
  const parseExcelData = (data: any[][]): EmployeeInterviewRecord[] => {
    console.log('[Excel导入] 开始解析数据，总行数:', data.length)

    if (data.length < 3) {
      throw new Error('Excel数据行数不足，请确保包含表头和数据行')
    }

    // 1. 找到表头行（包含"序号"和"访谈对象"的行）
    let headerRowIndex = -1
    let serialColIndex = -1
    let subjectColIndex = -1
    const monthColumns: { month: number; interviewerCol: number; contentCol: number }[] = []

    for (let i = 0; i < Math.min(10, data.length); i++) {
      const row = data[i]
      const rowStr = row.map((c) => String(c || '').trim())

      // 查找序号列
      if (serialColIndex < 0) {
        for (let j = 0; j < rowStr.length; j++) {
          if (rowStr[j].includes('序号') && !rowStr[j].includes('月')) {
            serialColIndex = j
            break
          }
        }
      }

      // 查找访谈对象列
      if (subjectColIndex < 0) {
        for (let j = 0; j < rowStr.length; j++) {
          if (rowStr[j].includes('访谈对象') && !rowStr[j].includes('月')) {
            subjectColIndex = j
            break
          }
        }
      }

      // 检查是否是月份行（包含 1月、2月 等）
      const monthMatches: { month: number; colIndex: number }[] = []
      for (let j = 0; j < rowStr.length; j++) {
        const cell = rowStr[j]
        const monthMatch = cell.match(/^(\d{1,2})月$/)
        if (monthMatch) {
          monthMatches.push({ month: parseInt(monthMatch[1], 10), colIndex: j })
        }
      }

      if (monthMatches.length >= 2) {
        headerRowIndex = i
        console.log('[Excel导入] 找到月份表头行:', i, '月份数:', monthMatches.length)

        // 检查下一行是否有子表头（访谈人/访谈内容）
        const subHeaderRow = data[i + 1]
        if (subHeaderRow) {
          const subHeaderStr = subHeaderRow.map((c) => String(c || '').trim())

          // 为每个月份识别子表头列
          monthColumns.length = 0
          monthMatches.forEach((m, idx) => {
            const nextMonthCol = monthMatches[idx + 1]?.colIndex || row.length
            const monthSubHeaders = subHeaderStr.slice(m.colIndex, nextMonthCol)

            let interviewerOffset = -1
            let contentOffset = -1

            for (let k = 0; k < monthSubHeaders.length; k++) {
              const header = monthSubHeaders[k]
              if (header.includes('访谈人') || header.includes('教员')) {
                interviewerOffset = k
              } else if (header.includes('访谈内容') || header.includes('内容')) {
                contentOffset = k
              }
            }

            // 默认顺序：访谈人(0) | 访谈内容(1)
            if (interviewerOffset < 0) interviewerOffset = 0
            if (contentOffset < 0) contentOffset = 1

            monthColumns.push({
              month: m.month,
              interviewerCol: m.colIndex + interviewerOffset,
              contentCol: m.colIndex + contentOffset,
            })
          })
        } else {
          // 没有子表头，使用默认顺序
          monthColumns.length = 0
          monthMatches.forEach((m) => {
            monthColumns.push({
              month: m.month,
              interviewerCol: m.colIndex,
              contentCol: m.colIndex + 1,
            })
          })
        }
        break
      }
    }

    // 如果没找到月份行，尝试备用方案
    if (headerRowIndex < 0) {
      for (let i = 0; i < Math.min(10, data.length); i++) {
        const row = data[i]
        for (let j = 0; j < row.length; j++) {
          const cell = String(row[j] || '').trim()
          if (cell.includes('序号') && serialColIndex < 0) {
            serialColIndex = j
          }
          if (cell.includes('访谈对象') && subjectColIndex < 0) {
            subjectColIndex = j
          }
          if (serialColIndex >= 0 && subjectColIndex >= 0) {
            headerRowIndex = i
            break
          }
        }
        if (headerRowIndex >= 0) break
      }
    }

    // 默认列索引
    if (serialColIndex < 0) serialColIndex = 0
    if (subjectColIndex < 0) subjectColIndex = 1

    if (headerRowIndex < 0) {
      throw new Error('无法找到表头行，请确保Excel包含"序号"和"访谈对象"列')
    }

    // 2. 解析数据行
    const records: EmployeeInterviewRecord[] = []
    let actualDataStartRow = headerRowIndex + 1

    // 检查是否有子表头行
    if (monthColumns.length > 0 && data[headerRowIndex + 1]) {
      const subHeaderCheck = data[headerRowIndex + 1].map((c) => String(c || '').trim()).join('')
      if (subHeaderCheck.includes('访谈人') || subHeaderCheck.includes('访谈内容')) {
        actualDataStartRow = headerRowIndex + 2
        console.log('[Excel导入] 检测到子表头行，数据从第', actualDataStartRow + 1, '行开始')
      }
    }

    console.log('[Excel导入] 开始解析数据行，从第', actualDataStartRow + 1, '行开始，总行数:', data.length)
    console.log('[Excel导入] 序号列:', serialColIndex, '访谈对象列:', subjectColIndex)
    console.log('[Excel导入] 月份列配置:', monthColumns)

    for (let i = actualDataStartRow; i < data.length; i++) {
      const row = data[i]
      if (!row || row.length === 0) continue

      // 跳过空行和合计行
      const firstCell = String(row[0] || '').trim()
      const serialCell = String(row[serialColIndex] || '').trim()
      
      // 如果第一列和序号列都为空，跳过
      if (!firstCell && !serialCell) {
        continue
      }
      
      if (firstCell === '合计' || firstCell === '总计' || serialCell === '合计' || serialCell === '总计') {
        continue
      }

      const serialNumber = parseInt(serialCell, 10)
      const interviewSubject = String(row[subjectColIndex] || '').trim()

      // 如果没有序号和访谈对象，跳过
      if (!serialNumber && !interviewSubject) {
        continue
      }

      if (!interviewSubject) {
        console.log('[Excel导入] 跳过空访谈对象行:', i + 1, '序号:', serialNumber)
        continue
      }

      // 构建月份数据
      const months: EmployeeInterviewRecord['months'] = {}
      MONTHS.forEach((label) => {
        months[label] = {}
      })

      // 如果有月份列配置，按配置解析
      if (monthColumns.length > 0) {
        monthColumns.forEach((mc) => {
          const monthLabel = `${mc.month}月`
          const interviewer = String(row[mc.interviewerCol] || '').trim()
          const content = String(row[mc.contentCol] || '').trim()

          if (interviewer || content) {
            months[monthLabel] = {
              interviewTime: interviewer || undefined,
              interviewContent: content || undefined,
            }
          }
        })
      } else {
        // 备用方案：按固定顺序解析（从访谈对象列之后，每2列一组）
        const startCol = subjectColIndex + 1
        let monthStart = 1
        for (let col = startCol; col < row.length - 1; col += 2) {
          const interviewer = String(row[col] || '').trim()
          const content = String(row[col + 1] || '').trim()
          const monthIndex = Math.floor((col - startCol) / 2)
          const month = monthStart + monthIndex

          if (month <= 12 && (interviewer || content)) {
            const monthLabel = `${month}月`
            months[monthLabel] = {
              interviewTime: interviewer || undefined,
              interviewContent: content || undefined,
            }
          }
        }
      }

      const record: EmployeeInterviewRecord = {
        key: `excel-${i}-${Date.now()}`,
        serialNumber: serialNumber || records.length + 1,
        interviewSubject,
        months,
      }

      console.log('[Excel导入] 解析记录:', record.serialNumber, record.interviewSubject, '月份数据:', Object.keys(record.months).filter(m => record.months[m].interviewTime || record.months[m].interviewContent))
      records.push(record)
    }

    if (records.length === 0) {
      throw new Error('未能解析出有效的访谈记录，请检查数据格式')
    }

    console.log('[Excel导入] 解析完成，记录数:', records.length)
    return records
  }

  /**
   * 处理Excel文件上传
   */
  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    console.log('[Excel导入] 开始处理文件:', file.name)

    try {
      setImportLoading(true)
      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: 'array' })

      console.log('[Excel导入] 工作簿包含', workbook.SheetNames.length, '个Sheet:', workbook.SheetNames.join(', '))

      // 读取第一个Sheet（或所有Sheet）
      const allRecords: EmployeeInterviewRecord[] = []

      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName]
        const data = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: '' })

        try {
          const records = parseExcelData(data)
          allRecords.push(...records)
          console.log(`[Excel导入] Sheet ${sheetName} 解析完成，记录数:`, records.length)
        } catch (error: any) {
          console.warn(`[Excel导入] Sheet ${sheetName} 解析失败:`, error.message)
        }
      }

      if (allRecords.length === 0) {
        message.warning('未能从Excel中解析出有效的访谈数据')
        return
      }

      // 直接替换数据源（因为Excel导入的是完整表格数据）
      // 重新编号
      allRecords.forEach((record, index) => {
        record.serialNumber = index + 1
        record.key = `imported-${index + 1}`
      })

      setDataSource(allRecords)
      message.success(`成功导入 ${allRecords.length} 条记录`)

      // 重置文件输入
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error: any) {
      console.error('[Excel导入] 解析失败:', error)
      message.error(`Excel导入失败：${error.message || '数据格式不正确'}`)
    } finally {
      setImportLoading(false)
    }
  }

  // 添加新记录
  const handleAdd = () => {
    const newRecord = buildEmptyRow(dataSource.length)
    newRecord.key = `${Date.now()}`
    setDataSource([...dataSource, newRecord])
    setEditingKey(newRecord.key)
    setEditingField('interviewSubject')
  }

  // 神殿选择变化（禁用，保持与顶部一致）
  const handleCampusChange = (_value: string) => {
    // 只展示，不可编辑；如需允许切换，可去掉 disabled 并联动 setCampus
  }

  // 表头样式
  const headerCellStyle: React.CSSProperties = {
    backgroundColor: '#fffacd',
    fontWeight: 'bold',
    textAlign: 'center',
  }

  // 月份表头样式（浅绿色背景）
  const monthHeaderCellStyle: React.CSSProperties = {
    backgroundColor: '#d4edda',
    fontWeight: 'bold',
    textAlign: 'center',
  }

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          marginBottom: 24,
          textAlign: 'center',
          fontSize: '20px',
          fontWeight: 'bold',
          padding: '16px',
          backgroundColor: '#fff1f0',
          borderRadius: 4,
          border: '1px solid #ffccc7',
        }}
      >
        <FileTextOutlined style={{ marginRight: 8 }} />
        员工访谈情况表
      </div>

      <Card>
        {/* 操作栏 */}
        <div
          style={{
            marginBottom: 16,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Space wrap>
            <Space>
              <span>神殿：</span>
              <Select
                value={currentCampus || selectedCampus}
                onChange={handleCampusChange}
                style={{ width: 200 }}
                placeholder="请选择神殿"
                options={campuses.map((campus) => ({ value: campus.name, label: campus.name }))}
                disabled
              />
              <Text type="secondary">（与顶部选择器保持一致）</Text>
            </Space>
            <Space>
              <span>年份：</span>
              <Select value={selectedYear} onChange={setSelectedYear} style={{ width: 120 }}>
                <Option value={2023}>2023</Option>
                <Option value={2024}>2024</Option>
                <Option value={2025}>2025</Option>
                <Option value={now.getFullYear()}>{now.getFullYear()}</Option>
              </Select>
              <span>月份：</span>
              <Select value={selectedMonth} onChange={setSelectedMonth} style={{ width: 120 }}>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <Option key={m} value={m}>
                    {m}月
                  </Option>
                ))}
              </Select>
              <Text type="secondary">
                当前：{selectedYear}年{selectedMonth}月
              </Text>
            </Space>
          </Space>
          <Space>
            <Button icon={<PlusOutlined />} type="primary" onClick={handleAdd}>
              新增
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
              刷新
            </Button>
            <Button icon={<SaveOutlined />} type="primary" onClick={handleSave} loading={loading}>
              保存
            </Button>
            <Button icon={<DownloadOutlined />} onClick={handleExport}>
              导出
            </Button>
            <Button
              icon={<FileExcelOutlined />}
              onClick={() => fileInputRef.current?.click()}
              loading={importLoading}
            >
              从Excel导入
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              style={{ display: 'none' }}
              onChange={handleExcelUpload}
            />
          </Space>
        </div>

        {availableMonths.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <Text type="secondary">已有数据月份：</Text>
            {availableMonths.map((m) => (
              <Tag
                key={m}
                color={m === selectedMonth ? 'blue' : 'default'}
                style={{ cursor: 'pointer', marginBottom: 4 }}
                onClick={() => setSelectedMonth(m)}
              >
                {m}月
              </Tag>
            ))}
          </div>
        )}

        {/* 表格 */}
        <Table
          columns={columns}
          dataSource={dataSource}
          pagination={false}
          scroll={{ x: 'max-content', y: 600 }}
          bordered
          size="small"
          rowKey="key"
          loading={loading}
          components={{
            header: {
              cell: (props: any) => {
                const { children, ...restProps } = props
                // 判断是否是月份列
                const isMonthHeader =
                  children && typeof children === 'string' && /^\d+月$/.test(children)
                const mergedProps = {
                  ...restProps,
                  style: {
                    ...props.style,
                    ...(isMonthHeader ? monthHeaderCellStyle : headerCellStyle),
                  },
                }
                return <th {...mergedProps}>{children}</th>
              },
            },
          }}
        />
        <style>{`
          .ant-table-thead > tr > th {
            background-color: #fffacd !important;
            font-weight: bold;
            text-align: center;
          }
          .ant-table-thead > tr:first-child > th {
            background-color: #fffacd !important;
          }
          /* 月份表头样式 */
          .ant-table-thead > tr:first-child > th[colspan] {
            background-color: #d4edda !important;
          }
          /* 子列表头样式 */
          .ant-table-thead > tr:last-child > th {
            background-color: #fff !important;
          }
        `}</style>
      </Card>
    </div>
  )
}

export default CampusEmployeeInterviewPage
