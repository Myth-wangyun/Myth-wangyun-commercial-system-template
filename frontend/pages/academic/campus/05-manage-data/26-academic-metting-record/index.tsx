// 会议记录表
/*
  作者: xzw65
  描述: 会议记录表页面
  TODO: 执行人 班级 日期  排序规则
*/
import React, { useEffect, useState, useRef } from 'react'
import { App, Card, Table, Button, Space, Input, Row, Col, Select, DatePicker } from 'antd'
import { ReloadOutlined, DownloadOutlined, PlusOutlined, DeleteOutlined, SaveOutlined, FileExcelOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useCampusStore } from '@/stores/campusStore'
import { getMeetingRecords, saveMeetingRecords } from '@/services/academicMeetingRecord'
import type { MeetingRecordBackend } from '@/services/academicMeetingRecord'
import dayjs, { Dayjs } from 'dayjs'
import * as XLSX from 'xlsx'

const { TextArea } = Input
const { Option } = Select

// 会议记录数据接口
interface MeetingRecord {
  key: string
  serialNumber: number
  time: string
  location: string
  host: string
  participants: string
  agenda: string
  resolutionExecution: string
  resolutionTransmission: string
}

const MeetingRecordPage: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore()
  const now = new Date()
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear())
  const [dataSource, setDataSource] = useState<MeetingRecord[]>(() => {
    // 初始化13行空数据
    return Array.from({ length: 13 }, (_, index) => ({
      key: `meeting-${index + 1}`,
      serialNumber: index + 1,
      time: '',
      location: '',
      host: '',
      participants: '',
      agenda: '',
      resolutionExecution: '',
      resolutionTransmission: '',
    }))
  })

  const campusName = currentCampus || '主神殿'
  const [editingKey, setEditingKey] = useState<string>('')
  const [editingField, setEditingField] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [importLoading, setImportLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const buildRowsFromBackend = (rows: MeetingRecordBackend[]): MeetingRecord[] => {
    const mapped: MeetingRecord[] = rows
      .sort((a, b) => (a.序号 || 0) - (b.序号 || 0))
      .map((r, idx) => ({
        key: `meeting-${idx + 1}`,
        serialNumber: r.序号 ?? idx + 1,
        time: parseDateString(r.时间), // 处理可能为序列日期的值
        location: r.地点 || '',
        host: r.主持 || '',
        participants: r.参与人 || '',
        agenda: r.议题 || '',
        resolutionExecution: r.问题解决 || '',
        resolutionTransmission: r.问题待解决 || '',
      }))
    const total = Math.max(13, mapped.length)
    return Array.from({ length: total }).map((_, i) => mapped[i] || {
      key: `meeting-${i + 1}`,
      serialNumber: i + 1,
      time: '',
      location: '',
      host: '',
      participants: '',
      agenda: '',
      resolutionExecution: '',
      resolutionTransmission: '',
    })
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await getMeetingRecords(campusName, selectedYear)
      if (res.行数据 && res.行数据.length > 0) {
        setDataSource(buildRowsFromBackend(res.行数据))
      } else {
        setDataSource(buildRowsFromBackend([]))
      }
    } catch (error) {
      console.error('加载会议记录失败', error)
      message.error('加载失败')
      setDataSource(buildRowsFromBackend([]))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campusName, selectedYear])

  // 处理单元格编辑
  const handleCellChange = (key: string, field: keyof MeetingRecord, value: string) => {
    setDataSource((prev) =>
      prev.map((record) => (record.key === key ? { ...record, [field]: value } : record)),
    )
  }

  // 渲染可编辑单元格
  const renderEditableCell = (
    text: string,
    record: MeetingRecord,
    field: keyof MeetingRecord,
    isTextArea = false,
  ) => {
    const isEditing = editingKey === record.key && editingField === field

    if (isEditing) {
      if (field === 'time') {
        // 确保日期格式正确，处理可能的序列日期
        const normalizedDate = parseDateString(text)
        const value = normalizedDate ? dayjs(normalizedDate) : null
        return (
          <DatePicker
            value={value as Dayjs | null}
            style={{ width: '100%' }}
            onChange={(val) => {
              handleCellChange(record.key, field, val ? val.format('YYYY-MM-DD') : '')
              setEditingKey('')
              setEditingField('')
            }}
            allowClear
          />
        )
      }
      if (isTextArea) {
        return (
          <TextArea
            value={text}
            onChange={(e) => handleCellChange(record.key, field, e.target.value)}
            onBlur={() => {
              setEditingKey('')
              setEditingField('')
            }}
            autoSize={{ minRows: 2, maxRows: 6 }}
            autoFocus
          />
        )
      }
      return (
        <Input
          value={text}
          onChange={(e) => handleCellChange(record.key, field, e.target.value)}
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

    // 如果是时间字段，确保显示格式正确
    let displayText = text
    if (field === 'time' && text) {
      const normalizedDate = parseDateString(text)
      if (normalizedDate) {
        // 显示为更友好的格式：YYYY年MM月DD日
        const date = dayjs(normalizedDate)
        if (date.isValid()) {
          displayText = date.format('YYYY年MM月DD日')
        }
      }
    }

    return (
      <div
        onClick={() => {
          setEditingKey(record.key)
          setEditingField(field)
        }}
        style={{
          cursor: 'pointer',
          minHeight: '32px',
          padding: '4px',
          whiteSpace: isTextArea ? 'pre-wrap' : 'normal',
        }}
      >
        {displayText || <span style={{ color: '#ccc' }}>点击编辑</span>}
      </div>
    )
  }

  // 定义表格列
  const columns: ColumnsType<MeetingRecord> = [
    {
      title: '时间',
      dataIndex: 'time',
      key: 'time',
      width: 120,
      align: 'center',
      render: (text, record) => renderEditableCell(text, record, 'time'),
    },
    {
      title: '地点',
      dataIndex: 'location',
      key: 'location',
      width: 120,
      align: 'center',
      render: (text, record) => renderEditableCell(text, record, 'location'),
    },
    {
      title: '主讲',
      dataIndex: 'host',
      key: 'host',
      width: 100,
      align: 'center',
      render: (text, record) => renderEditableCell(text, record, 'host'),
    },
    {
      title: '参与人',
      dataIndex: 'participants',
      key: 'participants',
      width: 150,
      align: 'center',
      render: (text, record) => renderEditableCell(text, record, 'participants', true),
    },
    {
      title: '议题',
      dataIndex: 'agenda',
      key: 'agenda',
      width: 250,
      align: 'center',
      render: (text, record) => renderEditableCell(text, record, 'agenda', true),
    },
    {
      title: '问题解决',
      dataIndex: 'resolutionExecution',
      key: 'resolutionExecution',
      width: 200,
      align: 'center',
      render: (text, record) => renderEditableCell(text, record, 'resolutionExecution', true),
    },
    {
      title: '问题待解决',
      dataIndex: 'resolutionTransmission',
      key: 'resolutionTransmission',
      width: 200,
      align: 'center',
      render: (text, record) => renderEditableCell(text, record, 'resolutionTransmission', true),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      align: 'center',
      fixed: 'right',
      render: (_, record) => (
        <Button
          type="link"
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => handleDelete(record.key)}
        >
          删除
        </Button>
      ),
    },
  ]

  // 添加新行
  const handleAdd = () => {
    const newKey = `meeting-${Date.now()}`
    const newRecord: MeetingRecord = {
      key: newKey,
      serialNumber: dataSource.length + 1,
      time: '',
      location: '',
      host: '',
      participants: '',
      agenda: '',
      resolutionExecution: '',
      resolutionTransmission: '',
    }
    setDataSource([...dataSource, newRecord])
    message.success('已添加新行')
  }

  // 删除行
  const handleDelete = (key: string) => {
    const newDataSource = dataSource.filter((item) => item.key !== key)
    // 重新编号
    newDataSource.forEach((item, index) => {
      item.serialNumber = index + 1
    })
    setDataSource(newDataSource)
    message.success('已删除')
  }

  // 刷新
  const handleRefresh = () => {
    loadData()
  }

  // 导出
  const handleExport = () => {
    message.info('导出功能开发中...')
  }

  // 保存数据
  const handleSave = async () => {
    setLoading(true)
    try {
      const rows: MeetingRecordBackend[] = []
      dataSource.forEach((r, idx) => {
        const hasValue =
          r.time ||
          r.location ||
          r.host ||
          r.participants ||
          r.agenda ||
          r.resolutionExecution ||
          r.resolutionTransmission
        if (hasValue) {
          rows.push({
            序号: r.serialNumber || idx + 1,
            时间: r.time || undefined,
            地点: r.location,
            主持: r.host,
            参与人: r.participants,
            议题: r.agenda,
            问题解决: r.resolutionExecution,
            问题待解决: r.resolutionTransmission,
          })
        }
      })
      const saved = await saveMeetingRecords(campusName, selectedYear, rows)
      setDataSource(buildRowsFromBackend(saved.行数据 || []))
      message.success('已保存')
    } catch (error) {
      console.error('保存失败', error)
      message.error('保存失败')
    } finally {
      setLoading(false)
    }
  }

  /**
   * 将Excel日期序列号转换为 YYYY-MM-DD 格式
   * Excel日期序列号是从1900年1月1日开始的序列号
   * Excel的基准日期是1899-12-30（1900-01-01的前一天）
   */
  const parseExcelSerialDate = (serial: number): string => {
    // Excel的日期序列号：1900-01-01 是序列号 1
    // 使用1899-12-30作为基准（Excel的epoch）
    const excelEpoch = dayjs('1899-12-30')
    const date = excelEpoch.add(serial, 'day')
    
    if (!date.isValid()) {
      console.warn(`[日期解析] Excel序列号无效:`, serial)
      return ''
    }
    
    return date.format('YYYY-MM-DD')
  }

  /**
   * 解析日期字符串或数字为 YYYY-MM-DD 格式
   * 支持格式：
   * - Excel序列日期数字（如 45661）-> 2025-01-04
   * - 2025年1月4日 -> 2025-01-04
   * - 2025年12月27日 -> 2025-12-27
   * - 2025-01-04 -> 2025-01-04 (保持不变)
   * - 2025/01/04 -> 2025-01-04
   */
  const parseDateString = (dateValue: string | number | null | undefined): string => {
    // 处理空值
    if (dateValue === null || dateValue === undefined) return ''
    
    // 如果是数字，可能是Excel日期序列号
    if (typeof dateValue === 'number') {
      // Excel序列日期通常在 1 到 100000 之间（1900-01-01 到 2173-10-14）
      if (dateValue > 0 && dateValue < 1000000) {
        const parsed = parseExcelSerialDate(dateValue)
        if (parsed) {
          console.log(`[日期解析] Excel序列号解析: ${dateValue} -> ${parsed}`)
          return parsed
        }
      }
      // 如果不是有效的序列日期，返回空字符串
      return ''
    }
    
    // 处理字符串
    const dateStr = String(dateValue).trim()
    if (!dateStr) return ''
    
    // 如果已经是标准格式，直接返回
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr
    }
    
    // 处理 YYYY年MM月DD日 格式
    const match = dateStr.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/)
    if (match) {
      const year = match[1]
      const month = String(match[2]).padStart(2, '0')
      const day = String(match[3]).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
    
    // 处理 YYYY/MM/DD 格式
    const slashMatch = dateStr.match(/(\d{4})\/(\d{1,2})\/(\d{1,2})/)
    if (slashMatch) {
      const year = slashMatch[1]
      const month = String(slashMatch[2]).padStart(2, '0')
      const day = String(slashMatch[3]).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
    
    // 尝试使用dayjs解析（处理其他格式）
    const dayjsDate = dayjs(dateStr)
    if (dayjsDate.isValid()) {
      return dayjsDate.format('YYYY-MM-DD')
    }
    
    // 如果无法解析，返回空字符串
    console.warn(`[日期解析] 无法解析日期:`, dateValue)
    return ''
  }

  /**
   * 解析Excel文件中的会议记录数据
   */
  const parseExcelData = (data: any[][]): MeetingRecord[] => {
    console.log('[Excel导入] 开始解析数据，总行数:', data.length)

    if (data.length < 2) {
      throw new Error('Excel数据行数不足，请确保包含表头和数据行')
    }

    // 1. 找到表头行（包含"时间"、"地点"、"主讲"等列的行）
    let headerRowIndex = -1
    const columnMap: {
      time?: number
      location?: number
      host?: number
      participants?: number
      agenda?: number
      resolutionExecution?: number
      resolutionTransmission?: number
    } = {}

    // 在前10行中查找表头
    for (let i = 0; i < Math.min(10, data.length); i++) {
      const row = data[i]
      if (!row || row.length === 0) continue

      const rowStr = row.map((c) => String(c || '').trim().toLowerCase())

      // 检查是否包含所有必需的列
      let timeCol = -1
      let locationCol = -1
      let hostCol = -1
      let participantsCol = -1
      let agendaCol = -1
      let resolutionExecutionCol = -1
      let resolutionTransmissionCol = -1

      for (let j = 0; j < rowStr.length; j++) {
        const cell = rowStr[j]
        if (cell.includes('时间') && timeCol < 0) {
          timeCol = j
        } else if (cell.includes('地点') && locationCol < 0) {
          locationCol = j
        } else if ((cell.includes('主讲') || cell.includes('主持')) && hostCol < 0) {
          hostCol = j
        } else if (cell.includes('参与人') && participantsCol < 0) {
          participantsCol = j
        } else if (cell.includes('议题') && agendaCol < 0) {
          agendaCol = j
        } else if (cell.includes('问题解决') && resolutionExecutionCol < 0) {
          resolutionExecutionCol = j
        } else if (cell.includes('问题待解决') && resolutionTransmissionCol < 0) {
          resolutionTransmissionCol = j
        }
      }

      // 如果找到了大部分必需的列，认为是表头行
      if (
        timeCol >= 0 ||
        (locationCol >= 0 && (hostCol >= 0 || participantsCol >= 0 || agendaCol >= 0))
      ) {
        headerRowIndex = i
        if (timeCol >= 0) columnMap.time = timeCol
        if (locationCol >= 0) columnMap.location = locationCol
        if (hostCol >= 0) columnMap.host = hostCol
        if (participantsCol >= 0) columnMap.participants = participantsCol
        if (agendaCol >= 0) columnMap.agenda = agendaCol
        if (resolutionExecutionCol >= 0) columnMap.resolutionExecution = resolutionExecutionCol
        if (resolutionTransmissionCol >= 0) columnMap.resolutionTransmission = resolutionTransmissionCol

        console.log('[Excel导入] 找到表头行:', i + 1, '列映射:', columnMap)
        break
      }
    }

    if (headerRowIndex < 0) {
      throw new Error('无法找到表头行，请确保Excel包含"时间"、"地点"、"主讲"等列')
    }

      // 如果某些列未找到，尝试使用默认顺序（从第一行推断）
      // 默认顺序：时间、地点、主讲、参与人、议题、问题解决、问题待解决
      if (!columnMap.time && !columnMap.location && !columnMap.host && !columnMap.participants && !columnMap.agenda) {
        const defaultOrder = ['time', 'location', 'host', 'participants', 'agenda', 'resolutionExecution', 'resolutionTransmission']
        defaultOrder.forEach((key, index) => {
          if (!columnMap[key as keyof typeof columnMap]) {
            columnMap[key as keyof typeof columnMap] = index
          }
        })
        console.log('[Excel导入] 使用默认列顺序:', columnMap)
      }

    // 2. 解析数据行
    const records: MeetingRecord[] = []
    const dataStartRow = headerRowIndex + 1

    for (let i = dataStartRow; i < data.length; i++) {
      const row = data[i]
      if (!row || row.length === 0) continue

      // 跳过空行
      const hasData = row.some((cell) => cell !== null && cell !== undefined && String(cell).trim() !== '')
      if (!hasData) {
        continue
      }

      // 提取各字段
      // 时间字段需要特殊处理，可能是Excel序列日期数字
      const timeValue = columnMap.time !== undefined ? row[columnMap.time] : null
      const time = parseDateString(timeValue) // 自动处理数字和字符串
      const location = columnMap.location !== undefined ? String(row[columnMap.location] || '').trim() : ''
      const host = columnMap.host !== undefined ? String(row[columnMap.host] || '').trim() : ''
      const participants = columnMap.participants !== undefined ? String(row[columnMap.participants] || '').trim() : ''
      const agenda = columnMap.agenda !== undefined ? String(row[columnMap.agenda] || '').trim() : ''
      const resolutionExecution = columnMap.resolutionExecution !== undefined ? String(row[columnMap.resolutionExecution] || '').trim() : ''
      const resolutionTransmission = columnMap.resolutionTransmission !== undefined ? String(row[columnMap.resolutionTransmission] || '').trim() : ''

      // 如果所有字段都为空，跳过
      if (!time && !location && !host && !participants && !agenda && !resolutionExecution && !resolutionTransmission) {
        continue
      }

      records.push({
        key: `excel-${i}-${Date.now()}`,
        serialNumber: records.length + 1,
        time,
        location,
        host,
        participants,
        agenda,
        resolutionExecution,
        resolutionTransmission,
      })

      console.log('[Excel导入] 解析记录:', records.length, time || location || host)
    }

    if (records.length === 0) {
      throw new Error('未能解析出有效的会议记录，请检查数据格式')
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

      // 读取第一个Sheet
      const firstSheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[firstSheetName]
      const data = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: '' })

      const records = parseExcelData(data)

      if (records.length === 0) {
        message.warning('未能从Excel中解析出有效的会议记录')
        return
      }

      // 直接替换数据源（因为Excel导入的是完整表格数据）
      // 重新编号
      records.forEach((record, index) => {
        record.serialNumber = index + 1
        record.key = `imported-${index + 1}`
      })

      // 确保至少13行
      const totalRows = Math.max(13, records.length)
      const finalRecords: MeetingRecord[] = Array.from({ length: totalRows }).map((_, i) => {
        if (records[i]) {
          return records[i]
        }
        return {
          key: `meeting-${i + 1}`,
          serialNumber: i + 1,
          time: '',
          location: '',
          host: '',
          participants: '',
          agenda: '',
          resolutionExecution: '',
          resolutionTransmission: '',
        }
      })

      setDataSource(finalRecords)
      message.success(`成功导入 ${records.length} 条记录`)

      // 重置文件输入
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      // 自动保存导入的数据
      try {
        setLoading(true)
        const rows: MeetingRecordBackend[] = []
        finalRecords.forEach((r, idx) => {
          const hasValue =
            r.time ||
            r.location ||
            r.host ||
            r.participants ||
            r.agenda ||
            r.resolutionExecution ||
            r.resolutionTransmission
          if (hasValue) {
            rows.push({
              序号: r.serialNumber || idx + 1,
              时间: r.time || undefined,
              地点: r.location,
              主持: r.host,
              参与人: r.participants,
              议题: r.agenda,
              问题解决: r.resolutionExecution,
              问题待解决: r.resolutionTransmission,
            })
          }
        })
        const saved = await saveMeetingRecords(campusName, selectedYear, rows)
        setDataSource(buildRowsFromBackend(saved.行数据 || []))
        message.success(`导入并保存成功，共 ${records.length} 条记录`)
      } catch (saveError) {
        console.error('[Excel导入] 自动保存失败:', saveError)
        message.warning('数据已导入，但自动保存失败，请手动点击保存按钮')
      } finally {
        setLoading(false)
      }
    } catch (error: any) {
      console.error('[Excel导入] 解析失败:', error)
      message.error(`Excel导入失败：${error.message || '数据格式不正确'}`)
    } finally {
      setImportLoading(false)
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <Card>
        {/* 标题 */}
        <div
          style={{
            textAlign: 'center',
            fontSize: '20px',
            fontWeight: 'bold',
            padding: '16px',
            backgroundColor: '#ffa500',
            borderRadius: 4,
            marginBottom: 16,
            color: '#fff',
          }}
        >
          会议记录表
        </div>

        {/* 操作栏 */}
        <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
          <Button icon={<PlusOutlined />} type="primary" onClick={handleAdd}>
            新增
          </Button>
          <Space>
            <Row gutter={12} align="middle">
              <Col>
                <span>年份</span>
              </Col>
              <Col>
                <Select value={selectedYear} onChange={setSelectedYear} style={{ width: 110 }}>
                  {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => (
                    <Option key={y} value={y}>
                      {y}
                    </Option>
                  ))}
                </Select>
              </Col>
              <Col>
                <span>神殿</span>
              </Col>
              <Col>
                <Input disabled value={campusName} style={{ width: 160 }} />
              </Col>
            </Row>
            <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={loading}>
              刷新
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
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={loading}
              onClick={handleSave}
            >
              保存
            </Button>
          </Space>
        </Space>

        {/* 表格 */}
        <Table<MeetingRecord>
          columns={columns}
          dataSource={dataSource}
          pagination={false}
          scroll={{ x: 'max-content' }}
          bordered
          size="small"
          rowKey="key"
          loading={loading}
        />
      </Card>
    </div>
  )
}

export default MeetingRecordPage
