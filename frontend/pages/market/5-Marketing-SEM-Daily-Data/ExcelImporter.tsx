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
  baidu?: BaiduDailyData[]
  other?: OtherDailyData[]
}

export interface BaiduDailyData {
  date: string // YYYY-MM-DD格式
  baiduIncome: number
  refundCount: number
  netSignup: number
  grossTotal: number
  orderCount: number
  visitCount: number
  baiduConsultCount: number
  baiduConsumption: number
  baiduForm: number
  centerComeIn: number
  baiduChatOut: number
  totalConsultCount: number
  validConsultCount: number
  baiduTotalDialogue: number
  validDialogue: number
  impressionCount: number
  clickCount: number
  consumption: number
}

export interface OtherDailyData {
  date: string // YYYY-MM-DD格式
  otherActualIncome: number
  refundCount: number
  netSignup: number
  grossTotal: number
  orderCount: number
  visitCount: number
  otherConsumption: number
  campusWebsiteVisit: number
  geo: number
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

  // 解析百度推广sheet
  const parseBaiduSheet = (worksheet: XLSX.WorkSheet, month: string): BaiduDailyData[] => {
    const data: BaiduDailyData[] = []
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
    
    // 从第3行开始读取数据（假设前2行是标题）
    for (let row = 2; row <= range.e.r; row++) {
      const dateCell = worksheet[XLSX.utils.encode_cell({ r: row, c: 1 })] // B列：日期
      if (!dateCell) continue

      const date = parseDate(dateCell.v, month)
      if (!date) continue

      // 跳过汇总行
      if (dateCell.v === '汇总' || String(dateCell.v).includes('汇总')) continue

      const rowData: BaiduDailyData = {
        date,
        baiduIncome: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 2 })]?.v), // C列：百度收入
        refundCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 4 })]?.v), // E列：退费数
        netSignup: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 5 })]?.v), // F列：净报名
        grossTotal: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 6 })]?.v), // G列：毛报总数
        orderCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 7 })]?.v), // H列：订座数
        visitCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 8 })]?.v), // I列：上门人数
        baiduConsultCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 9 })]?.v), // J列：百度咨询量
        baiduConsumption: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 11 })]?.v), // L列：百度消费
        baiduForm: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 12 })]?.v), // M列：百度表单
        centerComeIn: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 13 })]?.v), // N列：中心进线
        baiduChatOut: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 14 })]?.v), // O列：百度聊出
        totalConsultCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 15 })]?.v), // P列：总咨询量
        validConsultCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 16 })]?.v), // Q列：有效咨询量
        baiduTotalDialogue: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 19 })]?.v), // T列：百度总对话
        validDialogue: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 20 })]?.v), // U列：有效对话
        impressionCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 22 })]?.v), // W列：展现量
        clickCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 23 })]?.v), // X列：点击量
        consumption: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 25 })]?.v), // Z列：消费
      }

      data.push(rowData)
    }

    return data
  }

  // 解析其他平台sheet
  const parseOtherSheet = (worksheet: XLSX.WorkSheet, month: string): OtherDailyData[] => {
    const data: OtherDailyData[] = []
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
    
    // 从第3行开始读取数据（假设前2行是标题）
    for (let row = 2; row <= range.e.r; row++) {
      const dateCell = worksheet[XLSX.utils.encode_cell({ r: row, c: 1 })] // B列：日期
      if (!dateCell) continue

      const date = parseDate(dateCell.v, month)
      if (!date) continue

      // 跳过汇总行
      if (dateCell.v === '汇总' || String(dateCell.v).includes('汇总')) continue

      const rowData: OtherDailyData = {
        date,
        otherActualIncome: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 2 })]?.v), // C列：其他实际收入
        refundCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 4 })]?.v), // E列：退费数
        netSignup: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 5 })]?.v), // F列：净报名
        grossTotal: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 6 })]?.v), // G列：毛报总数
        orderCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 7 })]?.v), // H列：订座数
        visitCount: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 8 })]?.v), // I列：上门人数
        otherConsumption: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 11 })]?.v), // L列：其他消费
        campusWebsiteVisit: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 12 })]?.v), // M列：神殿网站/直接访问
        geo: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 13 })]?.v), // N列：GEO
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

      const importedData: ImportedData = { month }
      let actualMonth: string | null = null

      // 解析各个sheet
      workbook.SheetNames.forEach((sheetName) => {
        console.log('正在解析sheet:', sheetName)
        const worksheet = workbook.Sheets[sheetName]
        
        if (sheetName.includes('百度') || sheetName.includes('baidu') || sheetName.includes('02')) {
          const data = parseBaiduSheet(worksheet, month)
          console.log('百度推广数据:', data.length, '条')
          if (data.length > 0) {
            console.log('百度第一条数据日期:', data[0].date)
            if (!actualMonth) {
              actualMonth = dayjs(data[0].date).format('YYYY-MM')
            }
          }
          importedData.baidu = data
        } else if (sheetName.includes('其他') || sheetName.includes('other') || sheetName.includes('03')) {
          const data = parseOtherSheet(worksheet, month)
          console.log('其他平台数据:', data.length, '条')
          if (data.length > 0 && !actualMonth) {
            actualMonth = dayjs(data[0].date).format('YYYY-MM')
          }
          importedData.other = data
        }
      })

      // 使用从数据中解析出的实际月份
      if (actualMonth) {
        console.log('从数据中解析出的实际月份:', actualMonth)
        importedData.month = actualMonth
      }
      console.log('最终使用的月份:', importedData.month)

      // 显示导入预览
      const summary = []
      if (importedData.baidu?.length) summary.push(`百度推广: ${importedData.baidu.length}条`)
      if (importedData.other?.length) summary.push(`其他平台: ${importedData.other.length}条`)

      console.log('导入数据汇总:', summary)
      console.log('完整的importedData:', importedData)

      if (summary.length === 0) {
        message.warning('未能从Excel文件中识别到有效数据，请检查sheet名称是否包含关键字（百度、其他、baidu、other）')
        setUploading(false)
        setFileList([])
        return false
      }

      console.log('准备显示确认对话框...')

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
                {summary.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
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

