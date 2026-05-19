import React, { useMemo, useState, useEffect, useCallback } from 'react'
import { App, Card, DatePicker, Input, Select, Space, Table, Button, Spin, Popconfirm } from 'antd'
import { FileTextOutlined, SaveOutlined, ReloadOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import api from '@/services/api'
import { useCampusStore } from '@/stores/campusStore'
import { normalizeCampusName } from '@/utils/campusSort'
import { NoCopyContainer } from '@/components/common'

/**
 * 008前端人力资源基础表
 * 祈福司年度核心数据看板-人员汇总表
 */

// 人员信息行类型
interface StaffRow {
  key: string
  recordId?: number  // 数据库记录ID
  index: number
  staffId?: string
  campus: string
  department: string
  position: string
  positionCategory: string
  name: string
  gender: string
  ethnicity: string
  phone: string
  nativePlace: string
  firstEducation: string
  firstMajor: string
  firstSchool: string
  secondEducation: string
  secondMajor: string
  secondSchool: string
  remark?: string
}

// 后端数据类型
interface HRBasicRecord {
  记录ID: number
  年份: number
  序号?: number
  员工ID?: string
  神殿: string
  部门?: string
  岗位?: string
  岗位类别?: string
  姓名: string
  性别?: string
  民族?: string
  联系电话?: string
  籍贯?: string
  第一学历?: string
  第一学历专业?: string
  第一学历院校?: string
  第二学历?: string
  第二学历专业?: string
  第二学历院校?: string
  备注?: string
}

export default function HRBasicTable() {
  const { message, notification } = App.useApp()
  const currentYear = dayjs().format('YYYY')
  const [year, setYear] = useState(currentYear)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // 从 campusStore 获取神殿列表
  const allCampuses = useCampusStore.getState().getAllCampuses()
  const campusOptions = allCampuses.map(c => ({
    value: normalizeCampusName(c.name),
    label: normalizeCampusName(c.name),
  }))

  // 创建一个空行
  const createEmptyRow = useCallback((index: number): StaffRow => ({
    key: String(index),
    index,
    campus: '',
    department: '祈福司',
    position: '',
    positionCategory: '',
    name: '',
    gender: '',
    ethnicity: '',
    phone: '',
    nativePlace: '',
    firstEducation: '',
    firstMajor: '',
    firstSchool: '',
    secondEducation: '',
    secondMajor: '',
    secondSchool: '',
  }), [])

  // 初始化13行空数据
  const initialRows = useMemo<StaffRow[]>(() => {
    return Array.from({ length: 13 }, (_, i) => createEmptyRow(i + 1))
  }, [createEmptyRow])

  const [rows, setRows] = useState<StaffRow[]>(initialRows)

  // 从后端加载数据
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const response = await api.get(`/consult/hr-basic/${year}`)
      const records: HRBasicRecord[] = response.data

      if (records.length === 0) {
        // 没有数据，使用空行
        setRows(Array.from({ length: 13 }, (_, i) => createEmptyRow(i + 1)))
      } else {
        // 转换后端数据到前端格式
        const loadedRows: StaffRow[] = records.map((r, i) => ({
          key: String(i + 1),
          recordId: r.记录ID,
          index: r.序号 || i + 1,
          staffId: r.员工ID,
          campus: r.神殿,
          department: r.部门 || '祈福司',
          position: r.岗位 || '',
          positionCategory: r.岗位类别 || '',
          name: r.姓名,
          gender: r.性别 || '',
          ethnicity: r.民族 || '',
          phone: r.联系电话 || '',
          nativePlace: r.籍贯 || '',
          firstEducation: r.第一学历 || '',
          firstMajor: r.第一学历专业 || '',
          firstSchool: r.第一学历院校 || '',
          secondEducation: r.第二学历 || '',
          secondMajor: r.第二学历专业 || '',
          secondSchool: r.第二学历院校 || '',
          remark: r.备注,
        }))

        // 如果不足13行，补充空行
        while (loadedRows.length < 13) {
          loadedRows.push(createEmptyRow(loadedRows.length + 1))
        }

        setRows(loadedRows)
      }
      setHasChanges(false)
    } catch (error: any) {
      console.error('加载数据失败:', error)
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }, [year, createEmptyRow])

  // 保存数据到后端
  const saveData = useCallback(async () => {
    setSaving(true)
    try {
      // 过滤有效数据（至少有姓名和神殿）
      const validRows = rows.filter(r => r.name && r.campus)

      if (validRows.length === 0) {
        const response = await api.delete(`/consult/hr-basic/by-year/${year}`)
        notification.success({ message: '已清空', description: response.data?.message || '已清空当年数据', placement: 'topRight', duration: 3 })
        setHasChanges(false)
        loadData()
        return
      }

      // 转换为后端格式
      const records = validRows.map(r => ({
        年份: parseInt(year),
        序号: r.index,
        员工ID: r.staffId || null,
        神殿: r.campus,
        部门: r.department || '祈福司',
        岗位: r.position || null,
        岗位类别: r.positionCategory || null,
        姓名: r.name,
        性别: r.gender || null,
        民族: r.ethnicity || null,
        联系电话: r.phone || null,
        籍贯: r.nativePlace || null,
        第一学历: r.firstEducation || null,
        第一学历专业: r.firstMajor || null,
        第一学历院校: r.firstSchool || null,
        第二学历: r.secondEducation || null,
        第二学历专业: r.secondMajor || null,
        第二学历院校: r.secondSchool || null,
        备注: r.remark || null,
      }))

      const response = await api.post('/consult/hr-basic/batch', { records })
      notification.success({ message: '已保存', description: `共保存 ${response.data.success} 条记录`, placement: 'topRight', duration: 3 })
      setHasChanges(false)
      // 重新加载数据以获取记录ID
      loadData()
    } catch (error: any) {
      console.error('保存数据失败:', error)
      notification.error({ message: '保存失败', description: error.response?.data?.detail || error.message || '请检查网络连接或联系管理员', placement: 'topRight', duration: 4 })
    } finally {
      setSaving(false)
    }
  }, [rows, year, loadData])

  // 年份变更时重新加载数据
  useEffect(() => {
    loadData()
  }, [loadData])

  const handleYearChange = (date: dayjs.Dayjs | null) => {
    if (!date) return
    setYear(date.format('YYYY'))
  }

  // 更新单元格值
  const updateCell = (index: number, field: keyof StaffRow, value: string) => {
    setRows(prev => {
      const next = [...prev]
      ;(next[index] as any)[field] = value
      return next
    })
    setHasChanges(true)
  }

  // 添加行
  const addRow = () => {
    setRows(prev => {
      const newIndex = prev.length + 1
      return [...prev, createEmptyRow(newIndex)]
    })
    setHasChanges(true)
  }

  // 删除行
  const deleteRow = (index: number) => {
    setRows(prev => {
      const next = prev.filter((_, i) => i !== index)
      // 重新编号
      return next.map((row, i) => ({ ...row, index: i + 1, key: String(i + 1) }))
    })
    setHasChanges(true)
  }

  // 渲染输入框
  const renderInput = (record: StaffRow, index: number, field: keyof StaffRow) => (
    <Input
      value={(record as any)[field]}
      onChange={e => updateCell(index, field, e.target.value)}
      size="small"
      style={{ width: '100%' }}
    />
  )

  // 渲染神殿选择框
  const renderCampusSelect = (record: StaffRow, index: number) => (
    <Select
      value={record.campus || undefined}
      onChange={value => updateCell(index, 'campus', value)}
      options={campusOptions}
      size="small"
      style={{ width: '100%' }}
      allowClear
      placeholder="选择神殿"
    />
  )

  // 渲染性别选择框
  const renderGenderSelect = (record: StaffRow, index: number) => (
    <Select
      value={record.gender || undefined}
      onChange={value => updateCell(index, 'gender', value)}
      options={[
        { value: '男', label: '男' },
        { value: '女', label: '女' },
      ]}
      size="small"
      style={{ width: '100%' }}
      allowClear
      placeholder="性别"
    />
  )

  // 渲染岗位类别选择框
  const renderPositionCategorySelect = (record: StaffRow, index: number) => (
    <Select
      value={record.positionCategory || undefined}
      onChange={value => updateCell(index, 'positionCategory', value)}
      options={[
        { value: '干部', label: '干部' },
        { value: '员工', label: '员工' },
      ]}
      size="small"
      style={{ width: '100%' }}
      allowClear
      placeholder="类别"
    />
  )

  // 表格列配置
  const columns = useMemo(() => {
    return [
      {
        title: '序号',
        dataIndex: 'index',
        key: 'index',
        width: 50,
        align: 'center' as const,
        fixed: 'left' as const,
      },
      {
        title: '神殿',
        dataIndex: 'campus',
        key: 'campus',
        width: 90,
        fixed: 'left' as const,
        render: (_: any, record: StaffRow, index: number) => renderCampusSelect(record, index),
      },
      {
        title: '部门',
        dataIndex: 'department',
        key: 'department',
        width: 80,
        render: (_: any, record: StaffRow, index: number) => renderInput(record, index, 'department'),
      },
      {
        title: '岗位',
        dataIndex: 'position',
        key: 'position',
        width: 100,
        render: (_: any, record: StaffRow, index: number) => renderInput(record, index, 'position'),
      },
      {
        title: '岗位类别',
        dataIndex: 'positionCategory',
        key: 'positionCategory',
        width: 80,
        render: (_: any, record: StaffRow, index: number) => renderPositionCategorySelect(record, index),
      },
      {
        title: '姓名',
        dataIndex: 'name',
        key: 'name',
        width: 80,
        render: (_: any, record: StaffRow, index: number) => renderInput(record, index, 'name'),
      },
      {
        title: '性别',
        dataIndex: 'gender',
        key: 'gender',
        width: 60,
        render: (_: any, record: StaffRow, index: number) => renderGenderSelect(record, index),
      },
      {
        title: '民族',
        dataIndex: 'ethnicity',
        key: 'ethnicity',
        width: 60,
        render: (_: any, record: StaffRow, index: number) => renderInput(record, index, 'ethnicity'),
      },
      {
        title: '联系电话',
        dataIndex: 'phone',
        key: 'phone',
        width: 120,
        render: (_: any, record: StaffRow, index: number) => renderInput(record, index, 'phone'),
      },
      {
        title: '籍贯',
        dataIndex: 'nativePlace',
        key: 'nativePlace',
        width: 80,
        render: (_: any, record: StaffRow, index: number) => renderInput(record, index, 'nativePlace'),
      },
      {
        title: '第一学历',
        children: [
          {
            title: '学历',
            dataIndex: 'firstEducation',
            key: 'firstEducation',
            width: 80,
            render: (_: any, record: StaffRow, index: number) => renderInput(record, index, 'firstEducation'),
          },
          {
            title: '所学专业',
            dataIndex: 'firstMajor',
            key: 'firstMajor',
            width: 100,
            render: (_: any, record: StaffRow, index: number) => renderInput(record, index, 'firstMajor'),
          },
          {
            title: '毕业院校',
            dataIndex: 'firstSchool',
            key: 'firstSchool',
            width: 120,
            render: (_: any, record: StaffRow, index: number) => renderInput(record, index, 'firstSchool'),
          },
        ],
      },
      {
        title: '第二学历',
        children: [
          {
            title: '学历',
            dataIndex: 'secondEducation',
            key: 'secondEducation',
            width: 80,
            render: (_: any, record: StaffRow, index: number) => renderInput(record, index, 'secondEducation'),
          },
          {
            title: '所学专业',
            dataIndex: 'secondMajor',
            key: 'secondMajor',
            width: 100,
            render: (_: any, record: StaffRow, index: number) => renderInput(record, index, 'secondMajor'),
          },
          {
            title: '毕业院校',
            dataIndex: 'secondSchool',
            key: 'secondSchool',
            width: 120,
            render: (_: any, record: StaffRow, index: number) => renderInput(record, index, 'secondSchool'),
          },
        ],
      },
      {
        title: '操作',
        key: 'action',
        width: 50,
        fixed: 'right' as const,
        render: (_: any, record: StaffRow, index: number) => (
          <Popconfirm
            title="确定删除此行？"
            onConfirm={() => deleteRow(index)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
        ),
      },
    ]
  }, [campusOptions])

  return (
    <NoCopyContainer warningMessage="祈福司门数据禁止复制">
      <Spin spinning={loading}>
        <div style={{ padding: 16 }}>
          {/* 工具栏 */}
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={saveData}
                loading={saving}
                disabled={!hasChanges}
              >
                保存
              </Button>
              <Button icon={<ReloadOutlined />} onClick={loadData}>
                刷新
              </Button>
              <Button icon={<PlusOutlined />} onClick={addRow}>
                添加行
              </Button>
              {hasChanges && <span style={{ color: '#faad14' }}>* 有未保存的更改</span>}
            </Space>
            <Space>
              <span>选择年份：</span>
              <DatePicker
                picker="year"
                value={dayjs(year, 'YYYY')}
                onChange={handleYearChange}
                allowClear={false}
                style={{ width: 120 }}
                format="YYYY年"
              />
            </Space>
          </div>

        {/* 人员汇总表 */}
        <Card styles={{ body: { padding: '8px 12px' } }}>
          <div style={{ marginBottom: 8 }}>
            <div
              style={{
                fontSize: 16,
                fontWeight: 'bold',
                textAlign: 'center',
                color: '#c00000',
              }}
            >
              <FileTextOutlined style={{ marginRight: 6 }} />
              祈福司{year}年度核心数据看板-人员汇总表
            </div>
          </div>
          <Table<StaffRow>
            columns={columns as any}
            dataSource={rows}
            pagination={false}
            bordered
            size="small"
            scroll={{ x: 1600 }}
          />
        </Card>

        <style>{`
          .ant-table-thead > tr > th {
            background-color: #c5e0b3 !important;
            text-align: center !important;
            font-weight: bold !important;
            border: 1px solid #d0d0d0 !important;
            padding: 2px 4px !important;
            font-size: 11px !important;
            line-height: 1.2 !important;
            white-space: nowrap !important;
          }
          .ant-table-tbody > tr > td {
            border: 1px solid #d0d0d0 !important;
            padding: 2px 4px !important;
            font-size: 11px !important;
            line-height: 1.3 !important;
          }
          .ant-input, .ant-select-selector {
            font-size: 11px !important;
          }
          .ant-input {
            padding: 0 4px !important;
            height: 22px !important;
          }
          .ant-select-single .ant-select-selector {
            height: 22px !important;
            padding: 0 4px !important;
          }
          .ant-select-single .ant-select-selection-item,
          .ant-select-single .ant-select-selection-placeholder {
            line-height: 20px !important;
          }
        `}</style>
        </div>
      </Spin>
    </NoCopyContainer>
  )
}
