/**
 * 学术->最高议事厅->神殿 岗位分析报告汇总表格
 * 神殿智慧司岗位分析报告汇总表格
 * 单个神殿的岗位分析表 - 支持动态添加/删除列
 */

import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { App, Card, Typography, Space, Button, InputNumber, Spin, Select, Modal, Input, Popconfirm } from 'antd'
import { DownloadOutlined, ReloadOutlined, SaveOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { useCampusStore } from '@/stores/campusStore'
import CampusSelector from '@/components/common/CampusSelector'
import api from '@/services/api'

const { Title, Text } = Typography

const API_BASE = '/position-analysis-summary'

interface ColumnConfig {
  key: string
  label: string
}

interface RowData {
  campus: string
  data: Record<string, number>
}

interface PositionAnalysisData {
  id?: number
  年份: number
  columns: ColumnConfig[]
  rows: RowData[]
}

// 默认列配置
const defaultColumns: ColumnConfig[] = [
  { key: 'network', label: '网络工程' },
  { key: 'server', label: '服务器运维' },
  { key: 'cloud', label: '云计算' },
  { key: 'ai', label: '人工智能' },
  { key: 'shortVideo', label: '后期短视频' },
  { key: 'indoorOutdoor', label: '室内外效果' },
  { key: 'game', label: '游戏动漫' },
]

const shortCampusName = (campus: string): string => {
  return campus.replace(/神殿$/, '')
}

const CampusPositionAnalysisPage: React.FC = () => {
  const { message } = App.useApp()
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState<number>(currentYear)
  const { currentCampus } = useCampusStore()
  const campusLabel = useMemo(() => shortCampusName(currentCampus || '主神殿'), [currentCampus])
  
  const [allData, setAllData] = useState<PositionAnalysisData | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // 添加列相关状态
  const [addColumnModalOpen, setAddColumnModalOpen] = useState(false)
  const [newColumnLabel, setNewColumnLabel] = useState('')

  // 获取当前神殿的数据
  const currentCampusData = useMemo(() => {
    if (!allData || !allData.rows) return {}
    const row = allData.rows.find(r => r.campus === campusLabel)
    return row?.data || {}
  }, [allData, campusLabel])

  // 获取数据
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const response = await api.get(`${API_BASE}/by-year/${year}`, {
        params: { create_if_not_exists: true },
      })
      setAllData(response.data)
    } catch (error: any) {
      console.error('获取数据失败:', error)
      message.error('获取数据失败: ' + (error.response?.data?.detail || error.message))
      // 创建默认数据
      setAllData({
        年份: year,
        columns: defaultColumns,
        rows: [{ campus: campusLabel, data: Object.fromEntries(defaultColumns.map(c => [c.key, 0])) }]
      })
    } finally {
      setLoading(false)
    }
  }, [year, campusLabel])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // 保存数据
  const saveData = async () => {
    if (!allData) return
    setSaving(true)
    try {
      await api.post(API_BASE + '/', {
        年份: allData.年份,
        columns: allData.columns,
        rows: allData.rows,
      })
      message.success('保存成功')
      fetchData() // 重新加载以获取最新数据
    } catch (error: any) {
      console.error('保存失败:', error)
      message.error('保存失败: ' + (error.response?.data?.detail || error.message))
    } finally {
      setSaving(false)
    }
  }

  // 处理单元格值变化
  const handleChangeCount = (colKey: string, value: number | null) => {
    if (!allData) return
    setAllData(prev => {
      if (!prev) return prev
      const newRows = prev.rows.map(row => {
        if (row.campus !== campusLabel) return row
        return {
          ...row,
          data: { ...row.data, [colKey]: value || 0 }
        }
      })
      // 如果当前神殿不存在，添加一个
      const exists = newRows.some(r => r.campus === campusLabel)
      if (!exists) {
        newRows.push({
          campus: campusLabel,
          data: { ...Object.fromEntries(prev.columns.map(c => [c.key, 0])), [colKey]: value || 0 }
        })
      }
      return { ...prev, rows: newRows }
    })
  }

  // 添加列
  const handleAddColumn = () => {
    if (!newColumnLabel.trim()) {
      message.warning('请输入列名称')
      return
    }
    
    const key = `col_${Date.now()}`
    const newCol: ColumnConfig = { key, label: newColumnLabel.trim() }
    
    setAllData(prev => {
      if (!prev) return prev
      return {
        ...prev,
        columns: [...prev.columns, newCol],
        rows: prev.rows.map(row => ({
          ...row,
          data: { ...row.data, [key]: 0 }
        }))
      }
    })
    
    setNewColumnLabel('')
    setAddColumnModalOpen(false)
    message.success('列已添加，请点击保存按钮保存更改')
  }

  // 删除列
  const handleRemoveColumn = (key: string) => {
    setAllData(prev => {
      if (!prev) return prev
      return {
        ...prev,
        columns: prev.columns.filter(col => col.key !== key),
        rows: prev.rows.map(row => {
          const newData = { ...row.data }
          delete newData[key]
          return { ...row, data: newData }
        })
      }
    })
    message.success('列已删除，请点击保存按钮保存更改')
  }

  // 重置当前神殿数据
  const handleReset = () => {
    if (!allData) return
    setAllData(prev => {
      if (!prev) return prev
      const newRows = prev.rows.map(row => {
        if (row.campus !== campusLabel) return row
        return {
          ...row,
          data: Object.fromEntries(prev.columns.map(c => [c.key, 0]))
        }
      })
      return { ...prev, rows: newRows }
    })
  }

  // 计算合计
  const total = useMemo(() => {
    return Object.values(currentCampusData).reduce((sum: number, val) => sum + (Number(val) || 0), 0)
  }, [currentCampusData])

  // 导出 CSV
  const exportCsv = () => {
    const columns = allData?.columns || defaultColumns
    const headers = ['序号', '神殿', ...columns.map(c => c.label), '合计']
    const record = [
      1,
      campusLabel,
      ...columns.map(c => currentCampusData[c.key] || 0),
      total
    ]
    const csv = [headers, record]
      .map((line) => line.map((cell) => `"${cell}"`).join(','))
      .join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${campusLabel}神殿智慧司岗位分析报告汇总_${year}_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    tableLayout: 'auto',
  }

  const columnHeaderStyle: React.CSSProperties = {
    backgroundColor: '#d9ead3',
    border: '1px solid #000',
    textAlign: 'center',
    padding: '8px 4px',
    fontWeight: 600,
    whiteSpace: 'nowrap',
  }

  const cellStyle: React.CSSProperties = {
    border: '1px solid #000',
    textAlign: 'center',
    padding: '6px 4px',
    backgroundColor: '#fff',
    fontSize: 14,
  }

  // 生成年份选项
  const yearOptions = []
  for (let y = currentYear - 5; y <= currentYear + 1; y++) {
    yearOptions.push({ value: y, label: `${y}年` })
  }

  const columns = allData?.columns || defaultColumns

  return (
    <Spin spinning={loading}>
      <div style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <Title level={4} style={{ margin: 0 }}>10. 岗位分析报告汇总表</Title>
            <Text type="secondary">支持动态添加/删除列</Text>
          </div>
          <CampusSelector />
        </div>

        <Card>
          <div style={{ marginBottom: 16 }}>
            <Title level={4} style={{ margin: 0, textAlign: 'center' }}>
              <div
                style={{
                  background: '#FFD700',
                  color: '#000',
                  padding: '8px 0',
                  borderRadius: 2,
                  fontSize: 18,
                }}
              >
                {campusLabel}神殿智慧司岗位分析报告汇总表格
              </div>
            </Title>
          </div>

          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <Space wrap>
              <span>年份：</span>
              <Select
                value={year}
                onChange={setYear}
                options={yearOptions}
                style={{ width: 100 }}
              />
              <Button icon={<ReloadOutlined />} onClick={handleReset}>
                重置
              </Button>
              <Button icon={<PlusOutlined />} onClick={() => setAddColumnModalOpen(true)}>
                添加列
              </Button>
              <Button icon={<DownloadOutlined />} onClick={exportCsv}>
                导出CSV
              </Button>
              <Button 
                type="primary" 
                icon={<SaveOutlined />} 
                onClick={saveData}
                loading={saving}
              >
                保存
              </Button>
            </Space>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={columnHeaderStyle}>序号</th>
                  <th style={columnHeaderStyle}>神殿</th>
                  {columns.map((col) => (
                    <th key={col.key} style={columnHeaderStyle}>
                      <Space size={4}>
                        {col.label}
                        <Popconfirm
                          title="确定删除此列？"
                          onConfirm={() => handleRemoveColumn(col.key)}
                          okText="确定"
                          cancelText="取消"
                        >
                          <DeleteOutlined style={{ color: '#ff4d4f', cursor: 'pointer', fontSize: 12 }} />
                        </Popconfirm>
                      </Space>
                    </th>
                  ))}
                  <th style={columnHeaderStyle}>合计</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={cellStyle}>1</td>
                  <td style={cellStyle}>{campusLabel}</td>
                  {columns.map((col) => (
                    <td key={col.key} style={cellStyle}>
                      <InputNumber
                        min={0}
                        value={currentCampusData[col.key] || undefined}
                        onChange={(val) => handleChangeCount(col.key, val)}
                        size="small"
                        style={{ width: '100%', border: 'none' }}
                        controls={false}
                        placeholder=""
                      />
                    </td>
                  ))}
                  <td style={cellStyle}>{total}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        <Modal
          title="添加新列"
          open={addColumnModalOpen}
          onOk={handleAddColumn}
          onCancel={() => { setAddColumnModalOpen(false); setNewColumnLabel('') }}
          okText="添加"
          cancelText="取消"
        >
          <Input
            placeholder="请输入列名称（如：大数据）"
            value={newColumnLabel}
            onChange={e => setNewColumnLabel(e.target.value)}
            onPressEnter={handleAddColumn}
          />
        </Modal>
      </div>
    </Spin>
  )
}

export default CampusPositionAnalysisPage
