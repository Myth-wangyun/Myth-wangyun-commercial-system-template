import React, { useState } from 'react'
import { App, Modal, Button, Input, Space } from 'antd'
import { ImportOutlined } from '@ant-design/icons'

const { TextArea } = Input

interface ImportDataModalProps {
  visible: boolean
  onCancel: () => void
  onImport: (data: any[]) => void
  year: string
  campus: string
}

// 月份映射
const MONTH_MAP: { [key: string]: number } = {
  '总计': 0,
  '1月': 1,
  '2月': 2,
  '3月': 3,
  '4月': 4,
  '5月': 5,
  '6月': 6,
  '7月': 7,
  '8月': 8,
  '9月': 9,
  '10月': 10,
  '11月': 11,
  '12月': 12,
}

const ImportDataModal: React.FC<ImportDataModalProps> = ({
  visible,
  onCancel,
  onImport,
  year,
  campus,
}) => {
  const { message } = App.useApp()
  const [pasteData, setPasteData] = useState('')
  const [loading, setLoading] = useState(false)

  // 解析粘贴的数据
  const parseData = (text: string) => {
    try {
      // 按行分割
      const lines = text.trim().split('\n').filter(line => line.trim())
      
      if (lines.length < 2) {
        throw new Error('数据格式不正确，至少需要包含表头和数据行')
      }

      // 跳过前两行（项目和月份标题行）
      const dataLines = lines.slice(2)
      
      const result: any[] = []

      for (const line of dataLines) {
        // 使用制表符分割列
        const cols = line.split('\t').map(col => col.trim())
        
        // 跳过空行
        if (cols.length < 2 || !cols[0]) continue

        // 第一列是月份
        const monthLabel = cols[0]
        const monthIndex = MONTH_MAP[monthLabel]
        
        if (monthIndex === undefined) {
          console.warn(`未识别的月份标签: ${monthLabel}`)
          continue
        }

        // 解析数值，移除逗号和空格
        const parseNumber = (str: string): number => {
          if (!str || str === '') return 0
          const cleaned = str.replace(/,/g, '').replace(/\s+/g, '').trim()
          const num = parseFloat(cleaned)
          return isNaN(num) ? 0 : num
        }

        // 解析百分比
        const parsePercentage = (str: string): number => {
          if (!str || str === '') return 0
          const cleaned = str.replace(/%/g, '').replace(/\s+/g, '').trim()
          const num = parseFloat(cleaned)
          return isNaN(num) ? 0 : num / 100
        }

        // 过滤掉空列（Excel 复制时可能会有空列）
        const filteredCols = cols.filter((col, index) => {
          // 保留第一列（月份）和所有非空列
          return index === 0 || col !== ''
        })

        // 按照列顺序解析数据
        // 列顺序：月份、网络计划收入、SEM计划收入、新媒体计划收入、网络计划报名、SEM计划报名、
        //        新媒体计划报名、转化率目标、网络计划总量、新媒体计划咨询量、SEM计划咨询量、
        //        咨询量成本、网络计划消费、新媒体计划消费、SEM计划消费、招生实际成本
        const rowData = {
          month: monthIndex,
          network_plan_income: parseNumber(filteredCols[1]),
          sem_plan_income: parseNumber(filteredCols[2]),
          newmedia_plan_income: parseNumber(filteredCols[3]),
          network_plan_signup: parseNumber(filteredCols[4]),
          sem_plan_signup: parseNumber(filteredCols[5]),
          newmedia_plan_signup: parseNumber(filteredCols[6]),
          conversion_rate: parsePercentage(filteredCols[7]),
          network_plan_total: parseNumber(filteredCols[8]),
          newmedia_plan_consult: parseNumber(filteredCols[9]),
          sem_plan_consult: parseNumber(filteredCols[10]),
          consult_cost: parseNumber(filteredCols[11]),
          network_plan_cost: parseNumber(filteredCols[12]),
          newmedia_plan_cost: parseNumber(filteredCols[13]),
          sem_plan_cost: parseNumber(filteredCols[14]),
          actual_enrollment_cost: parseNumber(filteredCols[15]),
        }

        result.push(rowData)
      }

      if (result.length === 0) {
        throw new Error('未能解析到有效数据')
      }

      return result
    } catch (error: any) {
      throw new Error(`数据解析失败: ${error.message}`)
    }
  }

  // 处理导入
  const handleImport = async () => {
    if (!pasteData.trim()) {
      message.warning('请先粘贴数据')
      return
    }

    if (!year) {
      message.warning('请先选择年份')
      return
    }

    if (campus === 'total') {
      message.warning('总计划数据不支持导入，请选择具体神殿')
      return
    }

    setLoading(true)
    try {
      const parsedData = parseData(pasteData)
      
      // 显示解析结果
      message.success(`成功解析 ${parsedData.length} 行数据`)
      
      // 调用父组件的导入回调
      onImport(parsedData)
      
      // 清空输入框
      setPasteData('')
      
      // 关闭弹窗
      onCancel()
    } catch (error: any) {
      message.error(error.message || '导入失败')
    } finally {
      setLoading(false)
    }
  }

  // 处理取消
  const handleCancel = () => {
    setPasteData('')
    onCancel()
  }

  return (
    <Modal
      title={
        <Space>
          <ImportOutlined />
          <span>导入数据</span>
        </Space>
      }
      open={visible}
      onCancel={handleCancel}
      width={800}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          取消
        </Button>,
        <Button key="import" type="primary" loading={loading} onClick={handleImport}>
          导入
        </Button>,
      ]}
    >
      <div style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 8, color: '#666' }}>
          <strong>使用说明：</strong>
        </div>
        <ul style={{ color: '#666', fontSize: 12, paddingLeft: 20 }}>
          <li>从 Excel 表格中复制数据（包含表头），粘贴到下方文本框</li>
          <li>数据格式应包含：月份、网络计划收入、SEM计划收入、新媒体计划收入等 16 列</li>
          <li>支持包含"总计"行的数据，系统会自动识别</li>
          <li>数值中的逗号和空格会自动清理</li>
          <li>百分比格式会自动转换（如 2.5% → 0.025）</li>
          <li style={{ color: '#ff4d4f', fontWeight: 'bold' }}>注意：Excel 复制时请确保包含所有列，不要有空列</li>
        </ul>
      </div>

      <TextArea
        value={pasteData}
        onChange={(e) => setPasteData(e.target.value)}
        placeholder="请在此粘贴从 Excel 复制的数据...&#10;&#10;示例格式（16列数据，制表符分隔）：&#10;总计    9000000    1170000    7830000    320    42    278    2.5%    12900    10490    2410    116    1500000    1220000    280000    4687.50&#10;1月    520000    60000    460000    20    3    17    2.50%    800    630    170    137.50    110000    90000    20000    5500&#10;&#10;提示：如果粘贴后发现数据错位，请检查 Excel 中是否有空列"
        rows={12}
        style={{ fontFamily: 'monospace', fontSize: 12 }}
      />

      <div style={{ marginTop: 16, color: '#999', fontSize: 12 }}>
        <strong>提示：</strong>导入后会覆盖当前年份和神殿的所有数据，请谨慎操作。导入的数据会自动计算"网络计划收入"、"网络计划报名"等派生字段。
      </div>
    </Modal>
  )
}

export default ImportDataModal

