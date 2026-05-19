import React, { useState, useEffect } from 'react'
import { App, Table, Input, Button, InputNumber, Space, DatePicker, Select, Modal } from 'antd'
import { PlusOutlined, DeleteOutlined, SaveOutlined, ImportOutlined } from '@ant-design/icons'
import type { ColumnType } from 'antd/es/table'
import dayjs from 'dayjs'

const { Option } = Select
const { TextArea } = Input

interface ShootingDetailRecord {
  key: string
  sequence: number
  shooting_date?: string
  shooting_campus?: string
  appearing_teacher?: string
  appearing_reward_standard?: string
  appearing_reward_amount?: number
  assisting_teacher?: string
  responsible_campus?: string
  assisting_reward_standard?: string
  assisting_reward_amount?: number
  total_reward_amount?: number
  remark?: string
}

interface ShootingDetailTabProps {
  year: string
  month: string
}

const ShootingDetailTab: React.FC<ShootingDetailTabProps> = ({ year, month }) => {
  const { message } = App.useApp()
  const [dataSource, setDataSource] = useState<ShootingDetailRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [nextKey, setNextKey] = useState(1)
  const [importModalVisible, setImportModalVisible] = useState(false)
  const [importText, setImportText] = useState('')
  
  // 神殿列表
  const campusList = ['盛邦', '冀美', '石美', '晋美', '原美', '桂美', '邕美', '黔美']

  // 加载数据
  const loadData = async () => {
    setLoading(true)
    try {
      const yearNum = parseInt(year)
      const monthNum = parseInt(month)
      
      const response = await fetch(
        `/api/v1/market/shooting-detail?year=${yearNum}&month=${monthNum}`
      )
      
      if (response.ok) {
        const data = await response.json()
        if (data.items && data.items.length > 0) {
          const records = data.items.map((item: any, index: number) => ({
            key: `${index}`,
            sequence: item.sequence || index + 1,
            shooting_date: item.shooting_date || '',
            shooting_campus: item.shooting_campus || '',
            appearing_teacher: item.appearing_teacher || '',
            appearing_reward_standard: item.appearing_reward_standard || '50元/次',
            appearing_reward_amount: item.appearing_reward_amount || 50,
            assisting_teacher: item.assisting_teacher || '',
            responsible_campus: item.responsible_campus || '',
            assisting_reward_standard: item.assisting_reward_standard || '30元/次',
            assisting_reward_amount: item.assisting_reward_amount || 0,
            total_reward_amount: item.total_reward_amount || 50,
            remark: item.remark || '',
          }))
          setDataSource(records)
          setNextKey(records.length + 1)
        } else {
          const initialData = getInitialData()
          setDataSource(initialData)
          setNextKey(initialData.length + 1)
        }
      } else {
        const initialData = getInitialData()
        setDataSource(initialData)
        setNextKey(initialData.length + 1)
      }
    } catch (error) {
      console.error('加载数据失败:', error)
      message.error('加载数据失败')
      const initialData = getInitialData()
      setDataSource(initialData)
      setNextKey(initialData.length + 1)
    } finally {
      setLoading(false)
    }
  }

  // 初始化空数据（默认1行）
  const getInitialData = (): ShootingDetailRecord[] => {
    const currentDate = dayjs().format('YYYY-MM-DD')
    return Array.from({ length: 1 }, (_, i) => ({
      key: `init-${i}`,
      sequence: i + 1,
      shooting_date: currentDate,
      appearing_reward_standard: '50元/次',
      appearing_reward_amount: 50,
      assisting_reward_standard: '30元/次',
      assisting_reward_amount: 0,
      total_reward_amount: 50,
    }))
  }

  useEffect(() => {
    loadData()
  }, [year, month])

  // 添加行
  const handleAdd = () => {
    const newRecord: ShootingDetailRecord = {
      key: `new-${nextKey}`,
      sequence: dataSource.length + 1,
      shooting_date: dayjs().format('YYYY-MM-DD'),
      appearing_reward_standard: '50元/次',
      appearing_reward_amount: 50,
      assisting_reward_standard: '30元/次',
      assisting_reward_amount: 0,
      total_reward_amount: 50,
    }
    setDataSource([...dataSource, newRecord])
    setNextKey(nextKey + 1)
  }

  // 删除行
  const handleDelete = (key: string) => {
    const newData = dataSource.filter(item => item.key !== key)
    // 重新编号
    const reNumbered = newData.map((item, index) => ({
      ...item,
      sequence: index + 1,
    }))
    setDataSource(reNumbered)
  }

  // 更新单元格
  const handleCellChange = (key: string, field: keyof ShootingDetailRecord, value: any) => {
    const newData = dataSource.map(item => {
      if (item.key === key) {
        const updated = { ...item, [field]: value }
        
        // 自动计算总金额
        if (field === 'appearing_reward_amount' || field === 'assisting_reward_amount') {
          updated.total_reward_amount = (updated.appearing_reward_amount || 0) + (updated.assisting_reward_amount || 0)
        }
        
        return updated
      }
      return item
    })
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
      if (firstLine.includes('序号') && firstLine.includes('拍摄日期')) {
        startIndex = 1 // 跳过表头
      }

      const importedRecords: ShootingDetailRecord[] = []
      const skippedRows: number[] = []
      
      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue

        // 按制表符分割（从Excel复制的数据）
        const columns = line.split('\t')
        
        // 至少需要前8列数据（序号到承担神殿）
        if (columns.length < 8) {
          console.warn(`第 ${i + 1} 行数据列数不足（只有${columns.length}列），跳过`)
          skippedRows.push(i + 1)
          continue
        }

        // 解析每一列，使用可选链和默认值
        const sequence = parseInt(columns[0]) || (importedRecords.length + 1)
        const shooting_date = parseDate(columns[1] || '')
        const shooting_campus = (columns[2] || '').trim().replace('神殿', '')
        const appearing_teacher = (columns[3] || '').trim()
        const appearing_reward_standard = (columns[4] || '').trim() || '50元/次'
        const appearing_reward_amount = parseFloat(columns[5]) || 0
        const assisting_teacher = (columns[6] || '').trim()
        const responsible_campus = (columns[7] || '').trim().replace('神殿', '')
        const assisting_reward_standard = (columns[8] || '').trim() || '30元/次'
        const assisting_reward_amount = parseFloat(columns[9]) || 0
        const total_reward_amount = parseFloat(columns[10]) || (appearing_reward_amount + assisting_reward_amount)
        const remark = (columns[11] || '').trim()

        importedRecords.push({
          key: `import-${Date.now()}-${i}`,
          sequence,
          shooting_date,
          shooting_campus,
          appearing_teacher,
          appearing_reward_standard,
          appearing_reward_amount,
          assisting_teacher,
          responsible_campus,
          assisting_reward_standard,
          assisting_reward_amount,
          total_reward_amount,
          remark,
        })
      }

      if (importedRecords.length === 0) {
        message.warning('没有解析到有效数据，请检查数据格式')
        return
      }

      // 替换当前数据
      setDataSource(importedRecords)
      setNextKey(importedRecords.length + 1)
      
      let successMsg = `成功导入 ${importedRecords.length} 条记录`
      if (skippedRows.length > 0) {
        successMsg += `，跳过 ${skippedRows.length} 行（行号：${skippedRows.join(', ')}）`
      }
      message.success(successMsg)
      setImportModalVisible(false)
      setImportText('')
    } catch (error) {
      console.error('导入失败:', error)
      message.error('数据解析失败，请检查格式是否正确')
    }
  }

  // 保存数据
  const handleSave = async () => {
    setLoading(true)
    try {
      const yearNum = parseInt(year)
      const monthNum = parseInt(month)
      
      const payload = {
        year: yearNum,
        month: monthNum,
        items: dataSource.map(item => ({
          shooting_date: item.shooting_date || '',
          shooting_campus: item.shooting_campus || '',
          appearing_teacher: item.appearing_teacher || '',
          appearing_reward_standard: item.appearing_reward_standard || '',
          appearing_reward_amount: item.appearing_reward_amount || 0,
          assisting_teacher: item.assisting_teacher || '',
          responsible_campus: item.responsible_campus || '',
          assisting_reward_standard: item.assisting_reward_standard || '',
          assisting_reward_amount: item.assisting_reward_amount || 0,
          total_reward_amount: item.total_reward_amount || 0,
          remark: item.remark || '',
        }))
      }
      
      const response = await fetch('/api/v1/market/shooting-detail/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })
      
      if (response.ok) {
        message.success('保存成功')
        await loadData()
      } else {
        const errorData = await response.json()
        message.error(`保存失败: ${errorData.detail || '未知错误'}`)
      }
    } catch (error) {
      console.error('保存失败:', error)
      message.error('保存失败')
    } finally {
      setLoading(false)
    }
  }

  // 计算总计行（只计算出镜+陪同总金额的总和）
  const totalRow: ShootingDetailRecord = {
    key: 'total',
    sequence: 0,
    appearing_reward_standard: '',
    assisting_reward_standard: '合计',
    appearing_reward_amount: 0,
    assisting_reward_amount: 0,
    total_reward_amount: dataSource.reduce((sum, item) => sum + (item.total_reward_amount || 0), 0),
  }

  const columns: ColumnType<ShootingDetailRecord>[] = [
    {
      title: '序号',
      dataIndex: 'sequence',
      width: 60,
      fixed: 'left',
      align: 'center',
    },
    {
      title: '拍摄日期',
      dataIndex: 'shooting_date',
      width: 150,
      render: (value: string, record) => {
        if (record.key === 'total') return null
        return (
          <DatePicker
            value={value ? dayjs(value) : null}
            onChange={(date) => handleCellChange(record.key, 'shooting_date', date ? date.format('YYYY-MM-DD') : '')}
            placeholder="选择日期"
            size="small"
            style={{ width: '100%' }}
            format="YYYY-MM-DD"
          />
        )
      },
    },
    {
      title: '拍摄神殿',
      dataIndex: 'shooting_campus',
      width: 120,
      render: (value: string, record) => {
        if (record.key === 'total') return null
        return (
          <Select
            value={value}
            onChange={(val) => handleCellChange(record.key, 'shooting_campus', val)}
            placeholder="选择神殿"
            size="small"
            style={{ width: '100%' }}
            showSearch
            allowClear
          >
            {campusList.map(campus => (
              <Option key={campus} value={campus}>{campus}</Option>
            ))}
          </Select>
        )
      },
    },
    {
      title: '出镜老师',
      dataIndex: 'appearing_teacher',
      width: 100,
      render: (value: string, record) => {
        if (record.key === 'total') return null
        return (
          <Input
            value={value}
            onChange={(e) => handleCellChange(record.key, 'appearing_teacher', e.target.value)}
            placeholder="教师姓名"
            size="small"
          />
        )
      },
    },
    {
      title: '出镜奖励标准',
      dataIndex: 'appearing_reward_standard',
      width: 120,
      render: (value: string, record) => {
        if (record.key === 'total') return ''
        return (
          <Input
            value={value}
            onChange={(e) => handleCellChange(record.key, 'appearing_reward_standard', e.target.value)}
            placeholder="50元/次"
            size="small"
          />
        )
      },
    },
    {
      title: '出镜奖励金额',
      dataIndex: 'appearing_reward_amount',
      width: 120,
      render: (value: number, record) => {
        if (record.key === 'total') return null
        return (
          <InputNumber
            value={value}
            onChange={(val) => handleCellChange(record.key, 'appearing_reward_amount', val || 0)}
            min={0}
            size="small"
            style={{ width: '100%' }}
          />
        )
      },
    },
    {
      title: '配合拍摄老师',
      dataIndex: 'assisting_teacher',
      width: 120,
      render: (value: string, record) => {
        if (record.key === 'total') return null
        return (
          <Input
            value={value}
            onChange={(e) => handleCellChange(record.key, 'assisting_teacher', e.target.value)}
            placeholder="无"
            size="small"
          />
        )
      },
    },
    {
      title: '承担神殿',
      dataIndex: 'responsible_campus',
      width: 120,
      render: (value: string, record) => {
        if (record.key === 'total') return null
        return (
          <Select
            value={value}
            onChange={(val) => handleCellChange(record.key, 'responsible_campus', val)}
            placeholder="选择神殿"
            size="small"
            style={{ width: '100%' }}
            showSearch
            allowClear
          >
            {campusList.map(campus => (
              <Option key={campus} value={campus}>{campus}</Option>
            ))}
          </Select>
        )
      },
    },
    {
      title: '陪同奖励标准',
      dataIndex: 'assisting_reward_standard',
      width: 120,
      render: (value: string, record) => {
        return (
          <Input
            value={value}
            onChange={(e) => handleCellChange(record.key, 'assisting_reward_standard', e.target.value)}
            placeholder="30元/次"
            size="small"
            disabled={record.key === 'total'}
          />
        )
      },
    },
    {
      title: '陪同奖励金额',
      dataIndex: 'assisting_reward_amount',
      width: 120,
      render: (value: number, record) => {
        if (record.key === 'total') return null
        return (
          <InputNumber
            value={value}
            onChange={(val) => handleCellChange(record.key, 'assisting_reward_amount', val || 0)}
            min={0}
            size="small"
            style={{ width: '100%' }}
          />
        )
      },
    },
    {
      title: '出镜+陪同总金额',
      dataIndex: 'total_reward_amount',
      width: 140,
      render: (value: number, record) => {
        if (record.key === 'total') {
          return <div style={{ fontWeight: 'bold' }}>{value}</div>
        }
        return value
      },
    },
    {
      title: '备注',
      dataIndex: 'remark',
      width: 150,
      render: (value: string, record) => {
        if (record.key === 'total') return null
        return (
          <Input
            value={value}
            onChange={(e) => handleCellChange(record.key, 'remark', e.target.value)}
            placeholder="备注"
            size="small"
          />
        )
      },
    },
    {
      title: '操作',
      width: 80,
      fixed: 'right',
      render: (_, record) => {
        if (record.key === 'total') return null
        return (
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.key)}
            size="small"
          >
            删除
          </Button>
        )
      },
    },
  ]

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
        >
          添加行
        </Button>
        <Button
          type="default"
          icon={<ImportOutlined />}
          onClick={() => setImportModalVisible(true)}
        >
          粘贴导入
        </Button>
        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={handleSave}
          loading={loading}
        >
          保存
        </Button>
      </Space>
      
      <Table
        columns={columns}
        dataSource={[...dataSource, totalRow]}
        rowKey="key"
        pagination={false}
        bordered
        size="small"
        scroll={{ x: 1600, y: 600 }}
        loading={loading}
        rowClassName={(record) => record.key === 'total' ? 'total-row' : ''}
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
            数据格式：序号 | 拍摄日期 | 拍摄神殿 | 出镜老师 | 出镜奖励标准 | 出镜奖励金额 | 配合拍摄老师 | 承担神殿 | 陪同奖励标准 | 陪同奖励金额 | 出镜+陪同总金额 | 备注
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
        .total-row {
          background-color: #fff9e6 !important;
          font-weight: bold;
        }
        .total-row:hover {
          background-color: #fff9e6 !important;
        }
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

export default ShootingDetailTab
