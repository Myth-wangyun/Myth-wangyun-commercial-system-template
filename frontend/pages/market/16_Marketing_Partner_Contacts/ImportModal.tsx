import React, { useState } from 'react'
import { App, Modal, Input, Button, Space } from 'antd'
import { ImportOutlined, ClearOutlined } from '@ant-design/icons'

const { TextArea } = Input

interface ImportModalProps {
  visible: boolean
  onCancel: () => void
  onImport: (data: any[]) => void
  currentCampus?: string // 当前选中的神殿
}

const ImportModal: React.FC<ImportModalProps> = ({ visible, onCancel, onImport, currentCampus }) => {
  const { message } = App.useApp()
  const [importText, setImportText] = useState('')
  const [loading, setLoading] = useState(false)

  const handleClear = () => {
    setImportText('')
  }

  const parseImportData = (text: string) => {
    try {
      // 按行分割，处理不同的换行符
      const lines = text.split(/\r?\n/).filter(line => line.trim())
      
      if (lines.length === 0) {
        throw new Error('没有数据')
      }

      // 检测分隔符（制表符或多个空格）
      const firstLine = lines[0]
      let delimiter: string | RegExp = '\t'
      
      // 如果第一行没有制表符，尝试检测其他分隔符
      if (!firstLine.includes('\t')) {
        console.warn('未检测到制表符，尝试使用多空格分隔')
        delimiter = /\s{2,}/ // 两个或多个空格
      }

      // 解析每一行数据（跳过表头）
      const dataRows = lines.slice(1) // 跳过第一行表头
      
      console.log(`总共 ${dataRows.length} 行数据待解析`)
      
      const parsedData = dataRows.map((line, index) => {
        // 使用检测到的分隔符分割
        const columns = typeof delimiter === 'string' 
          ? line.split(delimiter)
          : line.split(delimiter)
        
        // 调试：打印列数和前几列内容
        console.log(`第 ${index + 2} 行，列数: ${columns.length}`, {
          序号: columns[0],
          神殿: columns[1],
          合作商名称: columns[2],
          平台: columns[5],
        })
        
        // 如果列数不足，尝试更宽松的解析
        if (columns.length < 14) {
          console.warn(`第 ${index + 2} 行数据列数不足（当前 ${columns.length} 列，需要 14 列）`)
          
          // 如果只有1列，说明分隔符识别失败
          if (columns.length === 1) {
            console.error(`第 ${index + 2} 行无法识别分隔符，原始数据:`, line.substring(0, 100))
          }
          
          return null
        }

        return {
          index: parseInt(columns[0]) || index + 1,
          campus: currentCampus || (columns[1] || '').trim(), // 使用当前选中的神殿，忽略导入数据中的神殿
          partner_name: (columns[2] || '').trim(),
          official_website: (columns[3] || '').trim(),
          partner_address: (columns[4] || '').trim(),
          landline: (columns[5] || '').trim(), // 平台
          contact_person: (columns[6] || '').trim(),
          phone: (columns[7] || '').trim(),
          wechat: (columns[8] || '').trim(),
          contract_signer: (columns[9] || '').trim(),
          contract_sign_date: parseDate(columns[10]),
          contract_expire_date: parseDate(columns[11]),
          negotiation_key_points: (columns[12] || '').trim(), // 洽谈返点
          notes: (columns[13] || '').trim(),
        }
      }).filter(item => item !== null)

      console.log(`成功解析 ${parsedData.length} 行数据`)
      return parsedData
    } catch (error) {
      console.error('解析数据失败:', error)
      throw error
    }
  }

  // 解析日期格式
  const parseDate = (dateStr: string): string => {
    if (!dateStr || dateStr.trim() === '' || dateStr === '无') {
      return ''
    }

    const trimmed = dateStr.trim()

    // 处理中文日期格式：2016年12月27日
    const chineseMatch = trimmed.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/)
    if (chineseMatch) {
      const year = chineseMatch[1]
      const month = chineseMatch[2].padStart(2, '0')
      const day = chineseMatch[3].padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    // 处理已经是标准格式的日期：YYYY-MM-DD
    const standardMatch = trimmed.match(/^\d{4}-\d{2}-\d{2}$/)
    if (standardMatch) {
      return trimmed
    }

    // 处理其他格式
    const slashMatch = trimmed.match(/(\d{4})\/(\d{1,2})\/(\d{1,2})/)
    if (slashMatch) {
      const year = slashMatch[1]
      const month = slashMatch[2].padStart(2, '0')
      const day = slashMatch[3].padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    // 如果无法解析，返回原始值
    return trimmed
  }

  const handleImport = async () => {
    if (!importText.trim()) {
      message.warning('请粘贴要导入的数据')
      return
    }

    setLoading(true)
    try {
      const parsedData = parseImportData(importText)
      
      if (parsedData.length === 0) {
        message.warning('没有有效的数据可以导入')
        return
      }

      // 调用父组件的导入方法
      onImport(parsedData)
      
      setImportText('')
      onCancel()
    } catch (error: any) {
      message.error(`导入失败: ${error.message || '数据格式错误'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      title="导入数据"
      open={visible}
      onCancel={onCancel}
      width={900}
      footer={[
        <Button key="clear" icon={<ClearOutlined />} onClick={handleClear}>
          清空
        </Button>,
        <Button key="cancel" onClick={onCancel}>
          取消
        </Button>,
        <Button
          key="import"
          type="primary"
          icon={<ImportOutlined />}
          loading={loading}
          onClick={handleImport}
        >
          导入
        </Button>,
      ]}
    >
      <div style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 8, color: '#666', fontSize: '13px' }}>
          <strong>数据格式说明：</strong>
          <br />
          请从 Excel 或其他表格软件中复制数据（包含表头），直接粘贴到下方文本框中。
          <br />
          <span style={{ color: '#ff4d4f' }}>注意：</span>
          数据列顺序必须为：序号、神殿、合作商名称、官方网站、合作商地址、平台、对接人、手机号、微信号、合同签署人、合同签署日期、合同到期时间、洽谈返点、备注
          <br />
          {currentCampus && (
            <span style={{ color: '#52c41a', fontWeight: 'bold' }}>
              当前神殿：{currentCampus}（导入时将忽略Excel中的神殿列，统一使用当前神殿）
            </span>
          )}
        </div>
      </div>

      <TextArea
        value={importText}
        onChange={(e) => setImportText(e.target.value)}
        placeholder="请粘贴要导入的数据（包含表头）&#10;&#10;示例：&#10;序号	神殿	合作商名称	官方网站	合作商地址	平台	对接人	手机号	微信号	合同签署人	合同签署日期	合同到期时间	洽谈返点	备注&#10;1	主神殿	天津融石网络技术有限公司	https://www.panguweb.cn/	天津自贸试验区...	百度	杜志轩	15303341519	15303341519	王显臣	2016年12月27日	账户费用消耗完截止	无	"
        rows={15}
        style={{ fontFamily: 'monospace', fontSize: '12px' }}
      />

      <div style={{ marginTop: 12, color: '#999', fontSize: '12px' }}>
        提示：导入的数据将追加到当前表格中，不会覆盖现有数据。
      </div>
    </Modal>
  )
}

export default ImportModal

