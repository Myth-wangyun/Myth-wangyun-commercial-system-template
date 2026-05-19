import React, { useEffect, useMemo, useState } from 'react'
import { App, Button, Card, DatePicker, Input, Space, Table, Tabs } from 'antd'
import dayjs from 'dayjs'
import {
  FileTextOutlined,
  PlusOutlined,
  ReloadOutlined,
  SaveOutlined,
  DeleteOutlined,
  ImportOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { getCampusNamesWithFallback, useCampusStore } from '@/stores/campusStore'
import api from '@/services/api'
import ImportModal from './ImportModal'

interface PartnerContactRow {
  id: number | string
  index: number
  campus: string
  partner_name: string
  official_website: string
  partner_address: string
  landline: string
  contact_person: string
  phone: string
  wechat: string
  contract_signer: string
  contract_sign_date: string
  contract_expire_date: string
  negotiation_key_points: string
  notes: string
}

type EditingField = keyof PartnerContactRow | ''

// 独立的可编辑输入组件 - 处理 IME 中文输入
const EditableInput: React.FC<{
  value: string
  onSave: (value: string) => void
  onCancel: () => void
}> = ({ value, onSave, onCancel }) => {
  const [localValue, setLocalValue] = useState(value)
  const composingRef = React.useRef(false)
  const inputRef = React.useRef<any>(null)

  // 自动聚焦
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSave = () => {
    if (!composingRef.current) {
      onSave(localValue)
    }
  }

  return (
    <Input
      ref={inputRef}
      value={localValue}
      onChange={(e) => {
        setLocalValue(e.target.value)
      }}
      size="small"
      onPressEnter={() => {
        if (!composingRef.current) {
          handleSave()
        }
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          onCancel()
        }
      }}
      onCompositionStart={() => {
        composingRef.current = true
      }}
      onCompositionEnd={(e) => {
        composingRef.current = false
        // 确保获取最新的输入值
        setLocalValue(e.currentTarget.value)
      }}
      onBlur={() => {
        // 延迟执行以确保 IME 组词完成
        setTimeout(() => {
          if (!composingRef.current) {
            onSave(localValue)
          }
        }, 200)
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    />
  )
}

const emptyRow = (index: number, campus?: string): PartnerContactRow => ({
  id: `temp-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  index,
  campus: campus || '',
  partner_name: '',
  official_website: '',
  partner_address: '',
  landline: '',
  contact_person: '',
  phone: '',
  wechat: '',
  contract_signer: '',
  contract_sign_date: '',
  contract_expire_date: '',
  negotiation_key_points: '',
  notes: '',
})

const MarketingPartnerContactsPage: React.FC = () => {
  const { message } = App.useApp()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [tableData, setTableData] = useState<PartnerContactRow[]>([])
  const [activeTab, setActiveTab] = useState<string>('summary')
  const [campuses, setCampuses] = useState<string[]>([])
  const [importModalVisible, setImportModalVisible] = useState(false)
  const [skipAutoLoad, setSkipAutoLoad] = useState(false) // 标记是否跳过自动加载

  const { loadCampusesFromConfig } = useCampusStore()

  const [editingRowId, setEditingRowId] = useState<number | string>('')
  const [editingField, setEditingField] = useState<EditingField>('')
  const [localInputValue, setLocalInputValue] = useState<string>('')

  useEffect(() => {
    loadCampusesFromConfig().finally(() => {
      setCampuses(getCampusNamesWithFallback())
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 页面加载或切换 Tab 时自动加载数据
  useEffect(() => {
    // 如果标记了跳过自动加载，则重置标记并返回
    if (skipAutoLoad) {
      setSkipAutoLoad(false)
      return
    }
    
    if (campuses.length > 0 || activeTab === 'summary') {
      loadData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, campuses.length])

  const updateCell = (rowId: number | string, key: keyof PartnerContactRow, value: string) => {
    setTableData((prev) => prev.map((r) => (r.id === rowId ? { ...r, [key]: value } : r)))
    setDirty(true)
  }

  const startEdit = (rowId: number | string, field: keyof PartnerContactRow) => {
    // 保存当前编辑中的值（如果有）
    if (editingRowId && editingField && editingRowId !== rowId || editingField !== field) {
      const currentRow = tableData.find((r) => r.id === editingRowId)
      if (currentRow && localInputValue !== (currentRow[editingField as keyof PartnerContactRow] || '')) {
        updateCell(editingRowId, editingField as keyof PartnerContactRow, localInputValue)
      }
    }
    // 开始新的编辑
    const row = tableData.find((r) => r.id === rowId)
    setLocalInputValue((row?.[field] as string) || '')
    setEditingRowId(rowId)
    setEditingField(field)
  }

  const stopEdit = (saveValue = true) => {
    // 保存当前值
    if (saveValue && editingRowId && editingField) {
      const currentRow = tableData.find((r) => r.id === editingRowId)
      if (currentRow && localInputValue !== (currentRow[editingField as keyof PartnerContactRow] || '')) {
        updateCell(editingRowId, editingField as keyof PartnerContactRow, localInputValue)
      }
    }
    setEditingRowId('')
    setEditingField('')
    setLocalInputValue('')
  }

  const handleAddRow = () => {
    setTableData((prev) => {
      const campus = activeTab === 'summary' ? '' : activeTab
      return [...prev, emptyRow(prev.length + 1, campus)]
    })
    setDirty(true)
  }

  const handleDeleteRow = (row: PartnerContactRow) => {
    setTableData((prev) => {
      const newData = prev.filter((r) => r.id !== row.id).map((r, idx) => ({ ...r, index: idx + 1 }))
      return newData
    })
    setDirty(true)
  }

  const handleImport = (importedData: any[]) => {
    console.log('开始导入数据，数据条数:', importedData.length)
    console.log('导入的数据:', importedData)
    
    // 将导入的数据追加到现有数据中
    setTableData((prev) => {
      console.log('当前表格数据:', prev)
      
      // 移除空行（检查所有关键字段是否都为空）
      const existingData = prev.filter(row => {
        // 检查是否有任何有效数据
        const hasData = row.campus?.trim() || 
                       row.partner_name?.trim() || 
                       row.contact_person?.trim() || 
                       row.phone?.trim() || 
                       row.official_website?.trim() ||
                       row.partner_address?.trim() ||
                       row.landline?.trim()
        return hasData
      })
      
      console.log('过滤后的现有数据:', existingData)
      
      // 生成新的数据行
      const newRows = importedData.map((item, idx) => ({
        id: `temp-${Date.now()}-${Math.random().toString(16).slice(2)}-${idx}`,
        index: existingData.length + idx + 1,
        campus: item.campus || '',
        partner_name: item.partner_name || '',
        official_website: item.official_website || '',
        partner_address: item.partner_address || '',
        landline: item.landline || '',
        contact_person: item.contact_person || '',
        phone: item.phone || '',
        wechat: item.wechat || '',
        contract_signer: item.contract_signer || '',
        contract_sign_date: item.contract_sign_date || '',
        contract_expire_date: item.contract_expire_date || '',
        negotiation_key_points: item.negotiation_key_points || '',
        notes: item.notes || '',
      }))
      
      console.log('新生成的数据行:', newRows)
      
      // 合并数据
      const mergedData = [...existingData, ...newRows]
      
      console.log('合并后的数据:', mergedData)
      
      // 重新编号
      const result = mergedData.map((row, idx) => ({ ...row, index: idx + 1 }))
      console.log('最终返回的数据:', result)
      return result
    })
    
    setDirty(true)
    
    // 提示用户
    message.success(`成功导入 ${importedData.length} 条数据，请点击"保存"按钮保存到数据库`)
  }

  const loadData = async () => {
    setLoading(true)
    try {
      // 汇总模式获取全部数据，否则按神殿过滤
      const params = activeTab === 'summary' 
        ? { summary: true } 
        : { campus: activeTab }
      
      const response = await api.get('/market/partner-contacts', { params })
      const items = response.data?.items || []
      
      if (items.length > 0) {
        setTableData(items.map((item: any, idx: number) => ({
          ...item,
          index: idx + 1,
        })))
      } else {
        setTableData([])
      }
      setDirty(false)
      stopEdit()
    } catch (e) {
      console.error('加载失败:', e)
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  const saveData = async () => {
    if (!dirty) return
    
    // 汇总模式下需要按神殿分组保存
    if (activeTab === 'summary') {
      // 按神殿分组
      const campusGroups = new Map<string, PartnerContactRow[]>()
      tableData.forEach((row) => {
        const campus = (row.campus || '').trim()
        if (!campus) {
          message.warning('存在未填写神殿的数据，请先填写神殿')
          return
        }
        if (!campusGroups.has(campus)) {
          campusGroups.set(campus, [])
        }
        campusGroups.get(campus)!.push(row)
      })
      
      // 检查是否有未填写神殿的数据
      const hasEmptyCampus = tableData.some((row) => !(row.campus || '').trim())
      if (hasEmptyCampus) {
        message.warning('存在未填写神殿的数据，请先填写神殿')
        return
      }
      
      setSaving(true)
      try {
        // 逐个神殿保存
        for (const [campus, rows] of campusGroups) {
          await api.post('/market/partner-contacts/bulk-save', {
            campus,
            rows: rows.map((r) => ({
              id: typeof r.id === 'number' ? r.id : undefined,
              campus: r.campus,
              partner_name: r.partner_name,
              official_website: r.official_website,
              partner_address: r.partner_address,
              landline: r.landline,
              contact_person: r.contact_person,
              phone: r.phone,
              wechat: r.wechat,
              contract_signer: r.contract_signer,
              contract_sign_date: r.contract_sign_date,
              contract_expire_date: r.contract_expire_date,
              negotiation_key_points: r.negotiation_key_points,
              notes: r.notes,
            })),
          })
        }
        setDirty(false)
        stopEdit()
        message.success('保存成功')
        // 重新加载数据以获取服务器返回的 ID
        loadData()
      } catch (e) {
        console.error('保存失败:', e)
        message.error('保存失败')
      } finally {
        setSaving(false)
      }
    } else {
      // 单神殿模式
      setSaving(true)
      try {
        const rowsToSave = filteredTableData.map((r) => ({
          id: typeof r.id === 'number' ? r.id : undefined,
          campus: activeTab,
          partner_name: r.partner_name,
          official_website: r.official_website,
          partner_address: r.partner_address,
          landline: r.landline,
          contact_person: r.contact_person,
          phone: r.phone,
          wechat: r.wechat,
          contract_signer: r.contract_signer,
          contract_sign_date: r.contract_sign_date,
          contract_expire_date: r.contract_expire_date,
          negotiation_key_points: r.negotiation_key_points,
          notes: r.notes,
        }))
        
        await api.post('/market/partner-contacts/bulk-save', {
          campus: activeTab,
          rows: rowsToSave,
        })
        
        setDirty(false)
        stopEdit()
        message.success('保存成功')
        // 重新加载数据以获取服务器返回的 ID
        loadData()
      } catch (e) {
        console.error('保存失败:', e)
        message.error('保存失败')
      } finally {
        setSaving(false)
      }
    }
  }

  const renderCell = (
    record: PartnerContactRow,
    field: keyof PartnerContactRow,
    placeholder: string,
  ) => {
    const isEditing = editingRowId === record.id && editingField === field
    const value = ((record[field] as string) || '')

    if (isEditing) {
      if (field === 'contract_sign_date') {
        return (
          <DatePicker
            value={localInputValue ? dayjs(localInputValue, 'YYYY-MM-DD') : null}
            onChange={(d) => {
              const newValue = d ? d.format('YYYY-MM-DD') : ''
              setLocalInputValue(newValue)
              updateCell(record.id, field, newValue)
              setEditingRowId('')
              setEditingField('')
              setLocalInputValue('')
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            size="small"
            style={{ width: '100%' }}
            format="YYYY-MM-DD"
            autoFocus
            open
          />
        )
      }

      return (
        <EditableInput
          value={localInputValue}
          onSave={(val) => {
            updateCell(record.id, field, val)
            setEditingRowId('')
            setEditingField('')
            setLocalInputValue('')
          }}
          onCancel={() => {
            setEditingRowId('')
            setEditingField('')
            setLocalInputValue('')
          }}
        />
      )
    }

    return (
      <div
        onClick={() => startEdit(record.id, field)}
        style={{
          cursor: 'pointer',
          minHeight: '30px',
          padding: '4px',
          fontSize: '12px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
        title={value || placeholder}
      >
        {value || <span style={{ color: '#999' }}>{placeholder}</span>}
      </div>
    )
  }

  const currentCampusLabel = activeTab === 'summary' ? '' : activeTab

  const filteredTableData = useMemo(() => {
    if (activeTab === 'summary') {
      // 汇总模式：按神殿排序，让相同神殿的数据挨在一起
      return [...tableData].sort((a, b) => {
        const campusA = (a.campus || '').trim()
        const campusB = (b.campus || '').trim()
        return campusA.localeCompare(campusB, 'zh-CN')
      })
    }
    return tableData.filter((r) => (r.campus || '').trim() === activeTab)
  }, [activeTab, tableData])

  const columns: ColumnsType<PartnerContactRow> = useMemo(
    () => [
      {
        title: '序号',
        key: 'index',
        width: 50,
        align: 'center' as const,
        fixed: 'left',
        render: (_: unknown, __: PartnerContactRow, idx: number) => idx + 1,
      },
      {
        title: '神殿',
        key: 'campus',
        width: 80,
        align: 'center' as const,
        render: (_: unknown, record: PartnerContactRow) => renderCell(record, 'campus', '神殿'),
      },
      {
        title: '合作商名称',
        key: 'partner_name',
        width: 120,
        align: 'center' as const,
        render: (_: unknown, record: PartnerContactRow) =>
          renderCell(record, 'partner_name', '合作商名称'),
      },
      {
        title: '官方网站',
        key: 'official_website',
        width: 120,
        align: 'center' as const,
        render: (_: unknown, record: PartnerContactRow) =>
          renderCell(record, 'official_website', '官方网站'),
      },
      {
        title: '合作商地址',
        key: 'partner_address',
        width: 180,
        align: 'center' as const,
        render: (_: unknown, record: PartnerContactRow) =>
          renderCell(record, 'partner_address', '合作商地址'),
      },
      {
        title: '平台',
        key: 'landline',
        width: 100,
        align: 'center' as const,
        render: (_: unknown, record: PartnerContactRow) => renderCell(record, 'landline', '平台'),
      },
      {
        title: '对接人',
        key: 'contact_person',
        width: 80,
        align: 'center' as const,
        render: (_: unknown, record: PartnerContactRow) =>
          renderCell(record, 'contact_person', '对接人'),
      },
      {
        title: '手机号',
        key: 'phone',
        width: 110,
        align: 'center' as const,
        render: (_: unknown, record: PartnerContactRow) => renderCell(record, 'phone', '手机号'),
      },
      {
        title: '微信号',
        key: 'wechat',
        width: 100,
        align: 'center' as const,
        render: (_: unknown, record: PartnerContactRow) => renderCell(record, 'wechat', '微信号'),
      },
      {
        title: '合同签署人',
        key: 'contract_signer',
        width: 90,
        align: 'center' as const,
        render: (_: unknown, record: PartnerContactRow) =>
          renderCell(record, 'contract_signer', '合同签署人'),
      },
      {
        title: '合同签署日期',
        key: 'contract_sign_date',
        width: 110,
        align: 'center' as const,
        render: (_: unknown, record: PartnerContactRow) =>
          renderCell(record, 'contract_sign_date', 'YYYY-MM-DD'),
      },
      {
        title: '合同到期时间',
        key: 'contract_expire_date',
        width: 110,
        align: 'center' as const,
        render: (_: unknown, record: PartnerContactRow) =>
          renderCell(record, 'contract_expire_date', 'YYYY-MM-DD'),
      },
      {
        title: '洽谈要点',
        key: 'negotiation_key_points',
        width: 120,
        align: 'center' as const,
        render: (_: unknown, record: PartnerContactRow) =>
          renderCell(record, 'negotiation_key_points', '洽谈要点'),
      },
      {
        title: '备注',
        key: 'notes',
        width: 100,
        align: 'center' as const,
        render: (_: unknown, record: PartnerContactRow) => renderCell(record, 'notes', '备注'),
      },
      {
        title: '操作',
        key: 'action',
        width: 80,
        align: 'center' as const,
        fixed: 'right',
        render: (_: unknown, record: PartnerContactRow) => (
          <Space size="small">
            <Button
              type="link"
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteRow(record)}
            >
              删除
            </Button>
          </Space>
        ),
      },
    ],
    [editingRowId, editingField, localInputValue, tableData],
  )

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          marginBottom: 24,
          textAlign: 'center',
          fontSize: '20px',
          fontWeight: 'bold',
          padding: '10px 16px',
          backgroundColor: '#fadb14',
          borderRadius: 0,
          border: '1px solid #000',
        }}
      >
        <FileTextOutlined style={{ marginRight: 8 }} />
        最高议事厅 市场部-主神殿合作方代理详细信息
      </div>

      <Card>
        <div
          style={{
            marginBottom: 16,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Space>
            <Button icon={<PlusOutlined />} type="primary" onClick={handleAddRow}>
              新增
            </Button>
            <Button
              icon={<ImportOutlined />}
              type="primary"
              onClick={() => setImportModalVisible(true)}
            >
              导入数据
            </Button>
            <Button
              icon={<SaveOutlined />}
              type="primary"
              ghost
              onClick={saveData}
              disabled={!dirty}
              loading={saving}
            >
              保存
            </Button>
            <Button icon={<ReloadOutlined />} onClick={loadData} loading={loading}>
              加载
            </Button>
          </Space>
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={(key) => {
            setActiveTab(key)
            stopEdit()
          }}
          items={[
            {
              key: 'summary',
              label: '汇总',
            },
            ...campuses.map((name) => ({
              key: name,
              label: name,
            })),
          ]}
          style={{ marginBottom: 12 }}
        />

        <Table
          columns={columns}
          dataSource={filteredTableData}
          pagination={false}
          scroll={{ x: 'max-content', y: 600 }}
          bordered
          size="small"
          rowKey="id"
          components={{
            header: {
              cell: (props: any) => {
                const { children, ...restProps } = props
                const mergedProps = {
                  ...restProps,
                  style: {
                    ...props.style,
                    backgroundColor: '#c6e0b4',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    borderColor: '#000',
                  },
                }
                return <th {...mergedProps}>{children}</th>
              },
            },
            body: {
              cell: (props: any) => {
                const { children, ...restProps } = props
                const mergedProps = {
                  ...restProps,
                  style: {
                    ...props.style,
                    borderColor: '#000',
                  },
                }
                return <td {...mergedProps}>{children}</td>
              },
            },
          }}
        />

        <style>{`
          .ant-table-container table { border-color: #000 !important; }
          .ant-table-thead > tr > th { background-color: #c6e0b4 !important; border-color: #000 !important; }
          .ant-table-tbody > tr > td { border-color: #000 !important; }
          .ant-table-cell { padding: 6px 4px !important; }
        `}</style>
      </Card>

      <ImportModal
        visible={importModalVisible}
        onCancel={() => setImportModalVisible(false)}
        onImport={handleImport}
        currentCampus={activeTab === 'summary' ? '' : activeTab}
      />
    </div>
  )
}

export default MarketingPartnerContactsPage

