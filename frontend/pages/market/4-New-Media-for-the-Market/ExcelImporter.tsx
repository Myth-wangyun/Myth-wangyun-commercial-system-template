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
  douyin?: PlatformDailyData[]
  kuaishou?: PlatformDailyData[]
  bilibili?: PlatformDailyData[]
  xiaohongshu?: PlatformDailyData[]
  wechatVideo?: PlatformDailyData[]
}

export interface PlatformDailyData {
  date: string // YYYY-MM-DD格式
  [key: string]: any
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

  // 解析抖音sheet
  const parseDouyinSheet = (worksheet: XLSX.WorkSheet, month: string): PlatformDailyData[] => {
    const data: PlatformDailyData[] = []
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
    
    console.log('抖音sheet范围:', range)

    // 辅助：去除所有空白(含换行)以便匹配表头
    const normalize = (s: string) => s.replace(/[\s\r\n\t\u00A0]+/g, '')
    
    // 只扫描前3行(行0-2)检测表头, 不扫描数据行
    // Excel可能有: Row0=标题行, Row1=分组表头(合并单元格), Row2=具体字段名
    const columnMap: { [key: string]: number } = {}
    const normalizedMap: { [key: string]: number } = {} // 归一化后的映射

    for (let headerRow = 0; headerRow <= Math.min(2, range.e.r); headerRow++) {
      for (let col = 0; col <= range.e.c; col++) {
        const cell = worksheet[XLSX.utils.encode_cell({ r: headerRow, c: col })]
        if (cell && cell.v != null && typeof cell.v === 'string') {
          const raw = String(cell.v).trim()
          const norm = normalize(raw)
          // 跳过分组标题和无意义表头
          if (norm.includes('看板') || norm.includes('新媒体') || norm.includes('基础数据') || norm.includes('转化数据') || norm.includes('汇总数据')) continue
          // 只记录首次出现的列名
          if (!(norm in normalizedMap)) {
            normalizedMap[norm] = col
            columnMap[raw] = col
          }
        }
      }
    }

    // 自动检测数据起始行（跳过所有表头行和汇总行）
    let dataStartRow = 3 // 默认: row0=标题, row1=分组, row2=列名, row3=汇总或数据
    const dateColIdx = normalizedMap[normalize('日期')] ?? 1
    for (let row = 2; row <= Math.min(10, range.e.r); row++) {
      const dateCell = worksheet[XLSX.utils.encode_cell({ r: row, c: dateColIdx })]
      if (!dateCell) continue
      const dateStr = String(dateCell.v).trim()
      if (dateStr === '日期' || dateStr === '汇总' || dateStr.includes('汇总')) continue
      const parsed = parseDate(dateCell.v, month)
      if (parsed) {
        dataStartRow = row
        break
      }
    }
    
    console.log('列映射(原始):', columnMap)
    console.log('列映射(归一化):', normalizedMap)
    console.log('数据起始行:', dataStartRow)
    
    // 辅助函数：根据列名或备选列名获取列索引（归一化匹配）
    const getCol = (names: string[], fallback: number): number => {
      for (const name of names) {
        const norm = normalize(name)
        if (norm in normalizedMap) return normalizedMap[norm]
      }
      return fallback
    }
    
    // 从数据起始行开始读取
    for (let row = dataStartRow; row <= range.e.r; row++) {
      const dateCell = worksheet[XLSX.utils.encode_cell({ r: row, c: dateColIdx })]
      if (!dateCell) continue

      // 跳过汇总行
      const dateCellStr = String(dateCell.v).trim()
      if (dateCellStr === '汇总' || dateCellStr.includes('汇总')) continue

      const date = parseDate(dateCell.v, month)
      if (!date) continue

      // 使用列映射读取数据（支持"净报名"和"争报名"两种表头名称）
      const refundCount = parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: getCol(['退费数'], 4) })]?.v)
      const grossTotal = parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: getCol(['毛报总数'], 6) })]?.v)
      const netSignupCol = getCol(['净报名', '争报名'], 5)
      const netSignupCell = worksheet[XLSX.utils.encode_cell({ r: row, c: netSignupCol })]
      // 净报名单元格在Excel中通常是公式(=毛报总数-退费数)，结果为0时可能被XLSX读取为空
      // 当净报名单元格为空时，使用公式 毛报总数-退费数 计算（与Excel逻辑一致）
      const netSignup = netSignupCell != null ? parseNumber(netSignupCell.v) : (grossTotal - refundCount)
      
      const rowData: PlatformDailyData = {
        date,
        actual_income: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: getCol(['抖音实际收入'], 2) })]?.v),
        refund_count: refundCount,
        net_signup: netSignup,
        gross_total: grossTotal,
        order_count: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: getCol(['订座数'], 7) })]?.v),
        visit_count: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: getCol(['上门人数'], 8) })]?.v),
        consult_count: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: getCol(['抖音咨询量'], 9) })]?.v),
        consumption: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: getCol(['抖音消耗', '抖音花费'], 11) })]?.v),
        display_count: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: getCol(['展示次数'], 12) })]?.v),
        click_count: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: getCol(['点击次数'], 13) })]?.v),
        avg_display_price: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: getCol(['平均千次展示费用'], 15) })]?.v),
        conversion_count: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: getCol(['转化数'], 17) })]?.v),
        phone_call_count: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: getCol(['抖音来电'], 20) })]?.v),
        form_submit_count: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: getCol(['抖音表单'], 21) })]?.v),
        private_message_count: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: getCol(['抖音私信'], 22) })]?.v),
      }
      
      // 添加调试日志（仅第一行数据）
      if (data.length === 0) {
        console.log('=== 抖音第一行数据解析 ===')
        console.log('  日期:', date)
        console.log('  退费数 (列' + getCol(['退费数'], 4) + '):', rowData.refund_count)
        console.log('  净报名 (列' + netSignupCol + '):', rowData.net_signup)
        console.log('  毛报总数 (列' + getCol(['毛报总数'], 6) + '):', rowData.gross_total)
        console.log('  抖音咨询量 (列' + getCol(['抖音咨询量'], 9) + '):', rowData.consult_count)
        console.log('  抖音消耗 (列' + getCol(['抖音消耗', '抖音花费'], 11) + '):', rowData.consumption)
        console.log('  展示次数 (列' + getCol(['展示次数'], 12) + '):', rowData.display_count)
        console.log('  抖音来电 (列' + getCol(['抖音来电'], 20) + '):', rowData.phone_call_count)
        console.log('  抖音表单 (列' + getCol(['抖音表单'], 21) + '):', rowData.form_submit_count)
        console.log('  抖音私信 (列' + getCol(['抖音私信'], 22) + '):', rowData.private_message_count)
        console.log('  完整数据:', rowData)
      }

      data.push(rowData)
    }

    console.log('抖音sheet解析完成，共', data.length, '条数据')
    if (data.length > 0) {
      console.log('第一条数据示例:', data[0])
    }

    return data
  }

  // 解析快手sheet
  const parseKuaishouSheet = (worksheet: XLSX.WorkSheet, month: string): PlatformDailyData[] => {
    const data: PlatformDailyData[] = []
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
    
    for (let row = 2; row <= range.e.r; row++) {
      const dateCell = worksheet[XLSX.utils.encode_cell({ r: row, c: 1 })]
      if (!dateCell) continue

      const date = parseDate(dateCell.v, month)
      if (!date) continue

      if (dateCell.v === '汇总' || String(dateCell.v).includes('汇总')) continue

      const rowData: PlatformDailyData = {
        date,
        actual_income: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 2 })]?.v),
        net_signup: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 5 })]?.v),
        gross_total: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 6 })]?.v),
        order_count: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 7 })]?.v),
        visit_count: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 8 })]?.v),
        effective_consult_count: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 9 })]?.v),
        consumption: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 11 })]?.v),
        seal_cover_count: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 12 })]?.v),
        seal_click_count: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 13 })]?.v),
        material_display_count: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 14 })]?.v),
        action_count: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 16 })]?.v),
        conversion_count: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 18 })]?.v),
        table_count: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 21 })]?.v),
      }

      data.push(rowData)
    }

    return data
  }

  // 解析通用平台sheet（B站、小红书、微信视频号结构类似）
  const parseGenericSheet = (worksheet: XLSX.WorkSheet, month: string): PlatformDailyData[] => {
    const data: PlatformDailyData[] = []
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
    
    for (let row = 2; row <= range.e.r; row++) {
      const dateCell = worksheet[XLSX.utils.encode_cell({ r: row, c: 1 })]
      if (!dateCell) continue

      const date = parseDate(dateCell.v, month)
      if (!date) continue

      if (dateCell.v === '汇总' || String(dateCell.v).includes('汇总')) continue

      const rowData: PlatformDailyData = {
        date,
        actual_income: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 2 })]?.v),
        net_signup: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 5 })]?.v),
        gross_total: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 6 })]?.v),
        order_count: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 7 })]?.v),
        visit_count: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 8 })]?.v),
        consult_count: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 9 })]?.v),
        consumption: parseNumber(worksheet[XLSX.utils.encode_cell({ r: row, c: 11 })]?.v),
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
        
        if (sheetName.includes('抖音') || sheetName.includes('02')) {
          const data = parseDouyinSheet(worksheet, month)
          console.log('抖音数据:', data.length, '条')
          if (data.length > 0) {
            console.log('抖音第一条数据日期:', data[0].date)
            if (!actualMonth) {
              actualMonth = dayjs(data[0].date).format('YYYY-MM')
            }
          }
          importedData.douyin = data
        } else if (sheetName.includes('快手') || sheetName.includes('03')) {
          const data = parseKuaishouSheet(worksheet, month)
          console.log('快手数据:', data.length, '条')
          if (data.length > 0 && !actualMonth) {
            actualMonth = dayjs(data[0].date).format('YYYY-MM')
          }
          importedData.kuaishou = data
        } else if (sheetName.includes('B站') || sheetName.includes('04')) {
          const data = parseGenericSheet(worksheet, month)
          console.log('B站数据:', data.length, '条')
          if (data.length > 0 && !actualMonth) {
            actualMonth = dayjs(data[0].date).format('YYYY-MM')
          }
          importedData.bilibili = data
        } else if (sheetName.includes('小红书') || sheetName.includes('05')) {
          const data = parseGenericSheet(worksheet, month)
          console.log('小红书数据:', data.length, '条')
          if (data.length > 0 && !actualMonth) {
            actualMonth = dayjs(data[0].date).format('YYYY-MM')
          }
          importedData.xiaohongshu = data
        } else if (sheetName.includes('微信') || sheetName.includes('视频号') || sheetName.includes('06')) {
          const data = parseGenericSheet(worksheet, month)
          console.log('微信视频号数据:', data.length, '条')
          if (data.length > 0 && !actualMonth) {
            actualMonth = dayjs(data[0].date).format('YYYY-MM')
          }
          importedData.wechatVideo = data
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
      if (importedData.douyin?.length) summary.push(`抖音: ${importedData.douyin.length}条`)
      if (importedData.kuaishou?.length) summary.push(`快手: ${importedData.kuaishou.length}条`)
      if (importedData.bilibili?.length) summary.push(`B站: ${importedData.bilibili.length}条`)
      if (importedData.xiaohongshu?.length) summary.push(`小红书: ${importedData.xiaohongshu.length}条`)
      if (importedData.wechatVideo?.length) summary.push(`微信视频号: ${importedData.wechatVideo.length}条`)

      console.log('导入数据汇总:', summary)
      console.log('完整的importedData:', importedData)

      if (summary.length === 0) {
        message.warning('未能从Excel文件中识别到有效数据，请检查sheet名称是否包含关键字（抖音、快手、B站、小红书、微信、视频号）')
        setUploading(false)
        setFileList([])
        return false
      }

      console.log('准备显示确认对话框...')
      console.log('modal对象:', modal)
      console.log('modal.confirm方法:', modal.confirm)

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

