import React, { useState } from 'react'
import { Upload, Button, App } from 'antd'
import { UploadOutlined, FileExcelOutlined } from '@ant-design/icons'
import type { UploadFile } from 'antd/es/upload/interface'
import * as XLSX from 'xlsx'
import dayjs from 'dayjs'

interface ExcelImporterProps {
  campusId: string
  onImportSuccess: (data: ImportedData) => void
}

export interface ImportedData {
  month: string // YYYY-MM格式
  data: ReputationDailyData[]
}

export interface ReputationDailyData {
  date: string // YYYY-MM-DD格式
  partnerIncome: number
  refundCount: number
  netSignup: number
  grossCount: number
  orderCount: number
  visitCount: number
  actualConsultCount: number
}

const ExcelImporter: React.FC<ExcelImporterProps> = ({ campusId, onImportSuccess }) => {
  const [uploading, setUploading] = useState(false)
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const { modal, message } = App.useApp()

  // 解析日期列（支持多种格式）
  const parseDate = (dateValue: any, monthStr: string): string | null => {
    if (!dateValue) return null

    // 如果是Excel日期序列号
    if (typeof dateValue === 'number') {
      const date = XLSX.SSF.parse_date_code(dateValue)
      return dayjs(`${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`).format('YYYY-MM-DD')
    }

    // 如果是字符串格式的日期
    if (typeof dateValue === 'string') {
      // 匹配 "10月18日" 格式
      const match = dateValue.match(/(\d+)月(\d+)日/)
      if (match) {
        const month = parseInt(match[1])
        const day = parseInt(match[2])
        const year = dayjs(monthStr).year()
        return dayjs(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`).format('YYYY-MM-DD')
      }

      // 尝试直接解析
      const parsed = dayjs(dateValue)
      if (parsed.isValid()) {
        return parsed.format('YYYY-MM-DD')
      }
    }

    return null
  }

  // 解析数值（处理空值、字符串等）
  const parseNumber = (value: any): number => {
    if (value === null || value === undefined || value === '') return 0
    if (typeof value === 'number') return value
    if (typeof value === 'string') {
      // 移除百分号和其他非数字字符（保留小数点和负号）
      const cleaned = value.replace(/[^\d.-]/g, '')
      const num = parseFloat(cleaned)
      return isNaN(num) ? 0 : num
    }
    return 0
  }

  // 解析口碑数据sheet
  const parseReputationSheet = (worksheet: XLSX.WorkSheet, month: string): ReputationDailyData[] => {
    const data: ReputationDailyData[] = []
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
    
    // 从第3行开始读取数据（假设前2行是标题）
    for (let row = 2; row <= range.e.r; row++) {
      const dateCell = worksheet[XLSX.utils.encode_cell({ r: row, c: 1 })] // B列：日期
      if (!dateCell) continue

      const date = parseDate(dateCell.v, month)
      if (!date) continue

      // 跳过汇总行
      if (dateCell.v === '汇总' || String(dateCell.v).includes('汇总')) continue

      const rowData: ReputationDailyData = {
        date,
        partnerIncome: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 2 })]?.v), // C列：口碑实际收入
        refundCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 4 })]?.v), // E列：退费数
        netSignup: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 5 })]?.v), // F列：净报名
        grossCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 6 })]?.v), // G列：毛报总数
        orderCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 7 })]?.v), // H列：订座数
        visitCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 8 })]?.v), // I列：上门人数
        actualConsultCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 9 })]?.v), // J列：实际口碑咨询量
      }

      data.push(rowData)
    }

    return data
  }

  // 处理Excel文件
  const handleFileUpload = async (file: File) => {
    if (!campusId) {
      message.error('请先选择神殿')
      setUploading(false)
      return false
    }

    setUploading(true)

    try {
      console.log('开始解析Excel文件:', file.name)
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: 'array' })

      console.log('Excel Sheet列表:', workbook.SheetNames)

      // 从文件名或第一个sheet推断月份
      let month = dayjs().format('YYYY-MM')
      const fileNameMatch = file.name.match(/(\d{4})[-年]?(\d{1,2})/)
      if (fileNameMatch) {
        month = `${fileNameMatch[1]}-${String(fileNameMatch[2]).padStart(2, '0')}`
      }
      console.log('从文件名推断的月份:', month)

      let parsedData: ReputationDailyData[] = []
      let actualMonth: string | null = null

      // 解析第一个sheet或包含"口碑"、"汇总"关键字的sheet
      const targetSheet = workbook.SheetNames.find(name => 
        name.includes('口碑') || name.includes('汇总') || name.includes('01')
      ) || workbook.SheetNames[0]

      console.log('正在解析sheet:', targetSheet)
      const worksheet = workbook.Sheets[targetSheet]
      parsedData = parseReputationSheet(worksheet, month)
      
      console.log('口碑数据:', parsedData.length, '条')
      if (parsedData.length > 0) {
        console.log('第一条数据日期:', parsedData[0].date)
        actualMonth = dayjs(parsedData[0].date).format('YYYY-MM')
      }

      // 使用从数据中解析出的实际月份
      if (actualMonth) {
        console.log('从数据中解析出的实际月份:', actualMonth)
        month = actualMonth
      }
      console.log('最终使用的月份:', month)

      if (parsedData.length === 0) {
        message.warning('未能从Excel文件中识别到有效数据，请检查文件格式')
        setUploading(false)
        setFileList([])
        return false
      }

      const importedData: ImportedData = {
        month,
        data: parsedData
      }

      console.log('完整的importedData:', importedData)

      // 先关闭loading状态
      setUploading(false)
      setFileList([])

      console.log('即将调用modal.confirm')
      
      try {
        modal.confirm({
          title: '确认导入数据',
          content: (
            <div>
              <p>将导入以下数据到 {importedData.month}：</p>
              <ul>
                <li>口碑数据: {parsedData.length}条</li>
              </ul>
              <p style={{ color: '#ff4d4f', marginTop: 16 }}>
                注意：导入将覆盖当前月份的现有数据
              </p>
            </div>
          ),
          onOk: () => {
            console.log('用户确认导入，调用onImportSuccess')
            try {
              onImportSuccess(importedData)
              message.success('数据导入成功！')
            } catch (error) {
              console.error('导入数据时出错:', error)
              message.error('导入数据失败，请查看控制台错误信息')
            }
          },
          onCancel: () => {
            console.log('用户取消导入')
          },
        })
        console.log('modal.confirm调用完成')
      } catch (error) {
        console.error('调用modal.confirm时出错:', error)
        message.error('显示确认对话框失败')
      }

      return false // 阻止自动上传
    } catch (error) {
      console.error('解析Excel文件失败:', error)
      message.error(`解析Excel文件失败：${error instanceof Error ? error.message : '未知错误'}`)
      setUploading(false)
      setFileList([])
      return false
    }
  }

  return (
    <Upload
      fileList={fileList}
      beforeUpload={handleFileUpload}
      onChange={({ fileList }) => setFileList(fileList)}
      accept=".xlsx,.xls"
      maxCount={1}
      showUploadList={false}
    >
      <Button
        icon={<UploadOutlined />}
        loading={uploading}
        type="default"
      >
        <FileExcelOutlined /> 导入Excel
      </Button>
    </Upload>
  )
}

export default ExcelImporter

