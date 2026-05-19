import React, { useState, useEffect } from 'react'
import { App, Table, Button, InputNumber, Input, Space, DatePicker, Select, Modal } from 'antd'
import { PlusOutlined, DeleteOutlined, SaveOutlined, ImportOutlined } from '@ant-design/icons'
import type { ColumnType } from 'antd/es/table'
import dayjs from 'dayjs'

const { Option } = Select
const { TextArea } = Input

interface ProductionDetailRecord {
  key: string
  sequence: number
  copywriting_date?: string
  theme?: string
  target_audience?: string
  campus?: string
  actual_shooting_date?: string
  video_name?: string
  duration?: number
  remark_link?: string
}

interface ProductionDetailTabProps {
  year: string
  month: string
}

const ProductionDetailTab: React.FC<ProductionDetailTabProps> = ({ year, month }) => {
  const { message } = App.useApp()
  const [dataSource, setDataSource] = useState<ProductionDetailRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [nextKey, setNextKey] = useState(1)
  const [importModalVisible, setImportModalVisible] = useState(false)
  const [importText, setImportText] = useState('')
  
  // 神殿列表
  const campusList = ['盛邦', '冀美', '石美', '晋美', '原美', '桂美', '邕美', '黔美']
  
  // 针对人群列表
  const audienceList = ['初中生', '高中生', '三校生', '大学生', '退伍']

  // 加载数据
  const loadData = async () => {
    setLoading(true)
    try {
      const yearNum = parseInt(year)
      const monthNum = parseInt(month)
      
      const response = await fetch(
        `/api/v1/market/video-production-detail?year=${yearNum}&month=${monthNum}`
      )
      
      if (response.ok) {
        const data = await response.json()
        if (data.items && data.items.length > 0) {
          const records = data.items.map((item: any, index: number) => ({
            key: `${index}`,
            sequence: item.sequence || index + 1,
            copywriting_date: item.copywriting_date || '',
            theme: item.theme || '',
            target_audience: item.target_audience || '',
            campus: item.campus || '',
            actual_shooting_date: item.actual_shooting_date || '',
            video_name: item.video_name || '',
            duration: item.duration,
            remark_link: item.remark_link || '',
          }))
          setDataSource(records)
          setNextKey(records.length + 1)
        } else {
          setDataSource(getInitialData())
        }
      } else {
        setDataSource(getInitialData())
      }
    } catch (error) {
      console.error('加载数据失败:', error)
      message.error('加载数据失败')
      setDataSource(getInitialData())
    } finally {
      setLoading(false)
    }
  }

  // 初始化空数据
  const getInitialData = (): ProductionDetailRecord[] => {
    return Array.from({ length: 5 }, (_, i) => ({
      key: `init-${i}`,
      sequence: i + 1,
    }))
  }

  useEffect(() => {
    loadData()
  }, [year, month])

  // 保存数据
  const handleSave = async () => {
    setLoading(true)
    try {
      const yearNum = parseInt(year)
      const monthNum = parseInt(month)
      
      const items = dataSource.map(record => ({
        sequence: record.sequence,
        copywriting_date: record.copywriting_date || '',
        theme: record.theme || '',
        target_audience: record.target_audience || '',
        campus: record.campus || '',
        actual_shooting_date: record.actual_shooting_date || '',
        video_name: record.video_name || '',
        duration: record.duration || null,
        remark_link: record.remark_link || '',
      }))

      const response = await fetch('/api/v1/market/video-production-detail/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year: yearNum, month: monthNum, items }),
      })

      if (response.ok) {
        message.success('保存成功')
        await loadData()
      } else {
        throw new Error('保存失败')
      }
    } catch (error) {
      console.error('保存失败:', error)
      message.error('保存失败')
    } finally {
      setLoading(false)
    }
  }

  // 添加行
  const handleAdd = () => {
    const newRecord: ProductionDetailRecord = {
      key: `new-${nextKey}`,
      sequence: dataSource.length + 1,
    }
    setDataSource([...dataSource, newRecord])
    setNextKey(nextKey + 1)
  }

  // 删除行
  const handleDelete = (key: string) => {
    const newData = dataSource.filter(item => item.key !== key)
    // 重新计算序号
    const updatedData = newData.map((item, index) => ({
      ...item,
      sequence: index + 1,
    }))
    setDataSource(updatedData)
  }

  // 更新单元格
  const handleCellChange = (key: string, field: keyof ProductionDetailRecord, value: any) => {
    const newData = dataSource.map(item => 
      item.key === key ? { ...item, [field]: value } : item
    )
    setDataSource(newData)
  }

  // 解析日期格式（支持多种格式）
  const parseDate = (dateStr: string): string => {
    if (!dateStr || dateStr.trim() === '') return ''
    
    // 移除多余空格
    dateStr = dateStr.trim()
    
    // 格式1: 2025.9.1 或 2025.09.01
    if (/^\d{4}\.\d{1,2}\.\d{1,2}$/.test(dateStr)) {
      const parts = dateStr.split('.')
      const year = parts[0]
      const month = parts[1].padStart(2, '0')
      const day = parts[2].padStart(2, '0')
      return `${year}-${month}-${day}`
    }
    
    // 格式2: 2025-9-1 或 2025-09-01
    if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(dateStr)) {
      const parts = dateStr.split('-')
      const year = parts[0]
      const month = parts[1].padStart(2, '0')
      const day = parts[2].padStart(2, '0')
      return `${year}-${month}-${day}`
    }
    
    // 格式3: 2025/9/1 或 2025/09/01
    if (/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(dateStr)) {
      const parts = dateStr.split('/')
      const year = parts[0]
      const month = parts[1].padStart(2, '0')
      const day = parts[2].padStart(2, '0')
      return `${year}-${month}-${day}`
    }
    
    return ''
  }

  // 处理粘贴导入
  const handleImport = () => {
    if (!importText.trim()) {
      message.warning('请粘贴要导入的数据')
      return
    }

    try {
      // 按行分割
      const lines = importText.trim().split('\n')
      
      if (lines.length === 0) {
        message.warning('没有可导入的数据')
        return
      }

      // 检查第一行是否为表头
      const firstLine = lines[0]
      let startIndex = 0
      if (firstLine.includes('序号') && firstLine.includes('文案日期')) {
        startIndex = 1 // 跳过表头
      }

      const importedRecords: ProductionDetailRecord[] = []
      
      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue

        // 按制表符分割（从Excel复制的数据）
        const columns = line.split('\t')
        
        if (columns.length < 9) {
          console.warn(`第 ${i + 1} 行数据列数不足，跳过`)
          continue
        }

        // 解析每一列
        const sequence = parseInt(columns[0]) || (i - startIndex + 1)
        const copywriting_date = parseDate(columns[1])
        const theme = columns[2]?.trim() || ''
        const target_audience = columns[3]?.trim() || ''
        const campus = columns[4]?.trim() || ''
        const actual_shooting_date = parseDate(columns[5])
        const video_name = columns[6]?.trim() || ''
        const duration = parseInt(columns[7]) || undefined
        const remark_link = columns[8]?.trim() || ''

        importedRecords.push({
          key: `import-${Date.now()}-${i}`,
          sequence,
          copywriting_date,
          theme,
          target_audience,
          campus,
          actual_shooting_date,
          video_name,
          duration,
          remark_link,
        })
      }

      if (importedRecords.length === 0) {
        message.warning('没有解析到有效数据')
        return
      }

      // 替换当前数据
      setDataSource(importedRecords)
      setNextKey(importedRecords.length + 1)
      
      message.success(`成功导入 ${importedRecords.length} 条记录`)
      setImportModalVisible(false)
      setImportText('')
    } catch (error) {
      console.error('导入失败:', error)
      message.error('数据解析失败，请检查格式是否正确')
    }
  }

  const columns: ColumnType<ProductionDetailRecord>[] = [
    {
      title: '序号',
      dataIndex: 'sequence',
      width: 60,
      align: 'center',
      fixed: 'left',
    },
    {
      title: '文案日期',
      dataIndex: 'copywriting_date',
      width: 140,
      render: (value, record) => (
        <DatePicker
          value={value ? dayjs(value) : null}
          onChange={(date) => handleCellChange(record.key, 'copywriting_date', date ? date.format('YYYY-MM-DD') : '')}
          placeholder="选择日期"
          format="YYYY-MM-DD"
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: '主题',
      dataIndex: 'theme',
      width: 200,
      render: (value, record) => (
        <Input
          value={value}
          onChange={e => handleCellChange(record.key, 'theme', e.target.value)}
          placeholder="请输入主题"
        />
      ),
    },
    {
      title: '针对人群',
      dataIndex: 'target_audience',
      width: 180,
      render: (value, record) => (
        <Select
          mode="multiple"
          value={value ? value.split(',').filter(Boolean) : []}
          onChange={val => handleCellChange(record.key, 'target_audience', val.join(','))}
          placeholder="选择人群"
          style={{ width: '100%' }}
          showSearch
          allowClear
          maxTagCount="responsive"
        >
          {audienceList.map(audience => (
            <Option key={audience} value={audience}>{audience}</Option>
          ))}
        </Select>
      ),
    },
    {
      title: '神殿',
      dataIndex: 'campus',
      width: 120,
      render: (value, record) => (
        <Select
          value={value}
          onChange={val => handleCellChange(record.key, 'campus', val)}
          placeholder="选择神殿"
          style={{ width: '100%' }}
          showSearch
          allowClear
        >
          {campusList.map(campus => (
            <Option key={campus} value={campus}>{campus}</Option>
          ))}
        </Select>
      ),
    },
    {
      title: '实际拍摄日期',
      dataIndex: 'actual_shooting_date',
      width: 140,
      render: (value, record) => (
        <DatePicker
          value={value ? dayjs(value) : null}
          onChange={(date) => handleCellChange(record.key, 'actual_shooting_date', date ? date.format('YYYY-MM-DD') : '')}
          placeholder="选择日期"
          format="YYYY-MM-DD"
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: '短视频名称',
      dataIndex: 'video_name',
      width: 200,
      render: (value, record) => (
        <Input
          value={value}
          onChange={e => handleCellChange(record.key, 'video_name', e.target.value)}
          placeholder="请输入视频名称"
        />
      ),
    },
    {
      title: '时长(秒)',
      dataIndex: 'duration',
      width: 100,
      render: (value, record) => (
        <InputNumber
          value={value}
          onChange={val => handleCellChange(record.key, 'duration', val)}
          placeholder="秒"
          min={0}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: '备注链接',
      dataIndex: 'remark_link',
      width: 300,
      render: (value, record) => (
        <Input.TextArea
          value={value}
          onChange={e => handleCellChange(record.key, 'remark_link', e.target.value)}
          placeholder="https://..."
          autoSize={{ minRows: 1, maxRows: 3 }}
        />
      ),
    },
    {
      title: '操作',
      width: 80,
      fixed: 'right',
      render: (_, record) => (
        <Button
          type="link"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleDelete(record.key)}
        >
          删除
        </Button>
      ),
    },
  ]

  return (
    <div style={{ padding: '20px' }}>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          添加行
        </Button>
        <Button type="default" icon={<ImportOutlined />} onClick={() => setImportModalVisible(true)}>
          粘贴导入
        </Button>
        <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={loading}>
          保存
        </Button>
      </Space>

      <Table
        columns={columns}
        dataSource={dataSource}
        loading={loading}
        pagination={false}
        scroll={{ x: 1600, y: 600 }}
        bordered
        size="small"
      />
      
      <Modal
        title="粘贴导入数据"
        open={importModalVisible}
        onOk={handleImport}
        onCancel={() => {
          setImportModalVisible(false)
          setImportText('')
        }}
        width={800}
        okText="导入"
        cancelText="取消"
      >
        <div style={{ marginBottom: 16 }}>
          <p style={{ marginBottom: 8, color: '#666' }}>
            请从Excel或其他表格软件中复制数据，然后粘贴到下方文本框中。
          </p>
          <p style={{ marginBottom: 8, color: '#999', fontSize: '12px' }}>
            数据格式：序号 | 文案日期 | 主题 | 针对人群 | 神殿 | 实际拍摄日期 | 短视频名称 | 时长 | 备注链接
          </p>
          <p style={{ marginBottom: 8, color: '#ff4d4f', fontSize: '12px' }}>
            注意：导入将替换当前所有数据，请先保存现有数据！
          </p>
        </div>
        <TextArea
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          placeholder="在此粘贴从Excel复制的数据..."
          rows={15}
          style={{ fontFamily: 'monospace', fontSize: '12px' }}
        />
      </Modal>
      
      <style>{`
        .ant-table-bordered .ant-table-cell {
          border-right: 1px solid #d9d9d9 !important;
          border-bottom: 1px solid #d9d9d9 !important;
        }
        .ant-table-bordered .ant-table-thead > tr > th {
          border-right: 1px solid #d9d9d9 !important;
          border-bottom: 2px solid #bfbfbf !important;
          background-color: #fafafa;
        }
      `}</style>
    </div>
  )
}

export default ProductionDetailTab
