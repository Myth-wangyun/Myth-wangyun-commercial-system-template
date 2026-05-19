import React, { useEffect, useMemo, useState } from 'react'
import { App,
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Space,
  Popconfirm,
  Row,
  Col,
  Statistic,
  Typography,
  Select,
  AutoComplete,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { PlusOutlined, EditOutlined, DeleteOutlined, SaveOutlined } from '@ant-design/icons'
import { useCampusStore } from '@/stores/campusStore'
import { STORAGE_KEYS } from '@/pages/academic/teaching-content/constants'
import {
  loadCampusData,
  saveCampusData,
} from '@/pages/academic/teaching-content/shared/campusStorage'
import CampusSelector from '@/components/common/CampusSelector'
import { buildApiUrl } from '@/utils/apiBase'
const { Title } = Typography
const { Option } = Select

interface PersonalGoalEntry {
  id: string
  name: string
  targetReputation: number
  actualReputation: number
  targetVisit: number
  actualVisit: number
  targetEnrollment: number
  actualEnrollment: number
  targetIncome: number
  actualIncome: number
}

interface TableRow extends PersonalGoalEntry {
  serialNumber: number | string
  isSummary?: boolean
}

interface PersonalGoalFormValues {
  name: string
  targetReputation: number
  actualReputation: number
  targetVisit: number
  actualVisit: number
  targetEnrollment: number
  actualEnrollment: number
  targetIncome: number
  actualIncome: number
}

type PersonalApiRow = {
  姓名?: string
  目标口碑量?: number | string
  实际口碑量?: number | string
  目标上门量?: number | string
  实际上门量?: number | string
  目标招生人数?: number | string
  实际招生人数?: number | string
  目标口碑收入?: number | string
  实际口碑收入?: number | string
}

const toNumber = (value: unknown): number => {
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

const normalizeRecords = (
  rows: PersonalApiRow[],
  teacherNames: string[],
): PersonalGoalEntry[] => {
  const converted = rows
    .filter((row) => {
      const name = (row.姓名 || '').trim()
      return name && name !== '暂无教员' && name !== '……'
    })
    .map((row, index) => ({
      id: `row-${row.姓名}-${index}`,
      name: row.姓名 ?? '',
      targetReputation: toNumber(row.目标口碑量),
      actualReputation: toNumber(row.实际口碑量),
      targetVisit: toNumber(row.目标上门量),
      actualVisit: toNumber(row.实际上门量),
      targetEnrollment: toNumber(row.目标招生人数),
      actualEnrollment: toNumber(row.实际招生人数),
      targetIncome: toNumber(row.目标口碑收入),
      actualIncome: toNumber(row.实际口碑收入),
    }))

  const existingNames = new Set(converted.map((r) => r.name))
  const missingRecords = teacherNames
    .filter((name) => !existingNames.has(name))
    .map((name, index) => ({
      id: `row-${name}-missing-${index}`,
      name,
      targetReputation: 0,
      actualReputation: 0,
      targetVisit: 0,
      actualVisit: 0,
      targetEnrollment: 0,
      actualEnrollment: 0,
      targetIncome: 0,
      actualIncome: 0,
    }))

  return [...converted, ...missingRecords].sort((a, b) => {
    const aIndex = teacherNames.indexOf(a.name)
    const bIndex = teacherNames.indexOf(b.name)
    if (aIndex === -1 && bIndex === -1) return a.name.localeCompare(b.name)
    if (aIndex === -1) return 1
    if (bIndex === -1) return -1
    return aIndex - bIndex
  })
}

// 教员列表接口类型
interface Teacher {
  id: number
  name: string
  campus_code: string
  is_active: boolean
  participate_kpi: boolean
}

const formatNumber = (value: number): string => value.toLocaleString()

const PersonalGoalsPage: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus, getAllCampuses } = useCampusStore()
  const activeCampus = currentCampus ?? getAllCampuses()[0]?.name ?? '主神殿'
  const currentYear = new Date().getFullYear()

  const [teacherNames, setTeacherNames] = useState<string[]>([])
  const [records, setRecords] = useState<PersonalGoalEntry[]>([])
  const [modalVisible, setModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<PersonalGoalEntry | null>(null)
  const [form] = Form.useForm<PersonalGoalFormValues>()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [autoFilling, setAutoFilling] = useState(false)
  const [loadingTeachers, setLoadingTeachers] = useState(false)
  const [hasAutoFilled, setHasAutoFilled] = useState(false)

  // 神殿切换时重置自动填充状态
  useEffect(() => {
    setHasAutoFilled(false)
  }, [activeCampus])

  // 从配置中心获取教员列表
  useEffect(() => {
    const loadTeachers = async () => {
      setLoadingTeachers(true)
      try {
        // 直接使用 campus_name 参数（后端 API 使用 campus_name 而非 campus_code）
        const params = new URLSearchParams({
          active: 'true',
          participate_kpi: 'true',
          campus_name: activeCampus,
        })
        
        const url = `${buildApiUrl('/config/teachers')}?${params.toString()}`
        const res = await fetch(url)
        if (res.ok) {
          const teachers: Teacher[] = await res.json()
          const names = teachers
            .filter((t) => t.is_active && t.participate_kpi)
            .map((t) => t.name)
            .sort()
          setTeacherNames(names)
        } else {
          setTeacherNames([])
        }
      } catch (error) {
        console.error('获取教员列表失败:', error)
        setTeacherNames([])
      } finally {
        setLoadingTeachers(false)
      }
    }
    loadTeachers()
  }, [activeCampus])

  // 自动填充函数
  const autoFillFromMonthly = async () => {
    setAutoFilling(true)
    try {
      const params = new URLSearchParams({
        campus: activeCampus,
        year: currentYear.toString(),
      })
      
      // 调用自动填充接口，从月度个人表汇总到个人表
      const res = await fetch(`${buildApiUrl('/reputation-aggregation/auto-fill')}?${params.toString()}`, {
        method: 'POST',
      })
      
      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        message.error(`自动填充失败: ${error.detail || '未知错误'}`)
        return false
      }
      
      // 重新加载个人表数据
      const reloadParams = new URLSearchParams({
        campus: activeCampus,
        year: currentYear.toString(),
      })
      const reloadRes = await fetch(`${buildApiUrl('/reputation-personal')}?${reloadParams.toString()}`)
      
      if (reloadRes.ok) {
        const reloadData = await reloadRes.json()
        const rows: PersonalApiRow[] = Array.isArray(reloadData.行列表) ? reloadData.行列表 : []
        const allRecords = normalizeRecords(rows, teacherNames)
        if (allRecords.length > 0) {
          setRecords(allRecords)
          return true
        }
      }
      return false
    } catch (error) {
      console.error('自动填充失败:', error)
      message.error('自动填充失败，请稍后重试')
      return false
    } finally {
      setAutoFilling(false)
    }
  }

  // 从后端加载数据（依赖教员列表）
  useEffect(() => {
    if (teacherNames.length === 0 && loadingTeachers) {
      return
    }
    
    const loadData = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({
          campus: activeCampus,
          year: currentYear.toString(),
        })
        const res = await fetch(`${buildApiUrl('/reputation-personal')}?${params.toString()}`)
        if (res.ok) {
          const data = await res.json()
          const rows: PersonalApiRow[] = Array.isArray(data.行列表) ? data.行列表 : []
          const allRecords = normalizeRecords(rows, teacherNames)

          if (allRecords.length > 0) {
            setRecords(allRecords)
          } else if (teacherNames.length > 0) {
            const defaultRecords = normalizeRecords([], teacherNames)
            setRecords(defaultRecords)
            // 首次加载时自动填充一次
            if (!hasAutoFilled) {
              setHasAutoFilled(true)
              await autoFillFromMonthly()
            }
          }
        } else {
          // API 失败时，根据教员列表生成默认数据
          if (teacherNames.length > 0) {
            const defaultRecords = normalizeRecords([], teacherNames)
            setRecords(defaultRecords)
            // 首次加载时自动填充一次
            if (!hasAutoFilled) {
              setHasAutoFilled(true)
              await autoFillFromMonthly()
            }
          }
        }
      } catch (error) {
        console.error('加载数据失败:', error)
        if (teacherNames.length > 0) {
          const defaultRecords = normalizeRecords([], teacherNames)
          setRecords(defaultRecords)
          // 首次加载时自动填充一次
          if (!hasAutoFilled) {
            setHasAutoFilled(true)
            await autoFillFromMonthly()
          }
        }
      } finally {
        setLoading(false)
      }
    }
    
    if (teacherNames.length > 0 || teacherNames.length === 0 && !loadingTeachers) {
      loadData()
    }
  }, [activeCampus, currentYear, teacherNames, loadingTeachers, hasAutoFilled])

  // 保存到本地存储（作为备份）
  useEffect(() => {
    saveCampusData(STORAGE_KEYS.CAMPUS_REPUTATION_PERSONAL_GOALS, activeCampus, records)
  }, [records, activeCampus])

  const summary = useMemo(() => {
    return records.reduce(
      (acc, item) => {
        acc.targetReputation += item.targetReputation
        acc.actualReputation += item.actualReputation
        acc.targetVisit += item.targetVisit
        acc.actualVisit += item.actualVisit
        acc.targetEnrollment += item.targetEnrollment
        acc.actualEnrollment += item.actualEnrollment
        acc.targetIncome += item.targetIncome
        acc.actualIncome += item.actualIncome
        return acc
      },
      {
        targetReputation: 0,
        actualReputation: 0,
        targetVisit: 0,
        actualVisit: 0,
        targetEnrollment: 0,
        actualEnrollment: 0,
        targetIncome: 0,
        actualIncome: 0,
      },
    )
  }, [records])

  const dataSource: TableRow[] = useMemo(() => {
    const rows: TableRow[] = records.map((item, index) => ({
      serialNumber: index + 1,
      ...item,
    }))
    rows.push({
      serialNumber: '合计',
      isSummary: true,
      id: 'summary',
      name: '',
      targetReputation: summary.targetReputation,
      actualReputation: summary.actualReputation,
      targetVisit: summary.targetVisit,
      actualVisit: summary.actualVisit,
      targetEnrollment: summary.targetEnrollment,
      actualEnrollment: summary.actualEnrollment,
      targetIncome: summary.targetIncome,
      actualIncome: summary.actualIncome,
    })
    return rows
  }, [records, summary])

  const openModal = (record?: PersonalGoalEntry) => {
    setEditingRecord(record ?? null)
    form.resetFields()
    form.setFieldsValue({
      name: record?.name ?? '',
      targetReputation: record?.targetReputation ?? 0,
      actualReputation: record?.actualReputation ?? 0,
      targetVisit: record?.targetVisit ?? 0,
      actualVisit: record?.actualVisit ?? 0,
      targetEnrollment: record?.targetEnrollment ?? 0,
      actualEnrollment: record?.actualEnrollment ?? 0,
      targetIncome: record?.targetIncome ?? 0,
      actualIncome: record?.actualIncome ?? 0,
    })
    setModalVisible(true)
  }

  const handleDelete = (recordId: string) => {
    setRecords((prev) => prev.filter((item) => item.id !== recordId))
    message.success('删除成功')
  }

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      const normalized: PersonalGoalEntry = {
        id: editingRecord?.id ?? `row-${Date.now()}`,
        name: values.name.trim(),
        targetReputation: Number(values.targetReputation) || 0,
        actualReputation: Number(values.actualReputation) || 0,
        targetVisit: Number(values.targetVisit) || 0,
        actualVisit: Number(values.actualVisit) || 0,
        targetEnrollment: Number(values.targetEnrollment) || 0,
        actualEnrollment: Number(values.actualEnrollment) || 0,
        targetIncome: Number(values.targetIncome) || 0,
        actualIncome: Number(values.actualIncome) || 0,
      }

      setRecords((prev) => {
        if (editingRecord) {
          return prev.map((item) => (item.id === editingRecord.id ? normalized : item))
        }
        return [...prev, normalized]
      })

      message.success(editingRecord ? '更新成功' : '添加成功')
      setModalVisible(false)
      setEditingRecord(null)
      form.resetFields()
    } catch {
      // ignore validation errors
    }
  }

  const columns: ColumnsType<TableRow> = [
    {
      title: '序号',
      dataIndex: 'serialNumber',
      key: 'serialNumber',
      width: 70,
      align: 'center',
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 160,
      align: 'center',
      render: (_, row) => (row.isSummary ? '' : row.name),
    },
    {
      title: '口碑量',
      children: [
        {
          title: '目标口碑量',
          dataIndex: 'targetReputation',
          key: 'targetReputation',
          align: 'center',
          render: (_, row) => formatNumber(row.targetReputation),
        },
        {
          title: '实际口碑量',
          dataIndex: 'actualReputation',
          key: 'actualReputation',
          align: 'center',
          render: (_, row) => formatNumber(row.actualReputation),
        },
      ],
    },
    {
      title: '上门量',
      children: [
        {
          title: '目标上门量',
          dataIndex: 'targetVisit',
          key: 'targetVisit',
          align: 'center',
          render: (_, row) => formatNumber(row.targetVisit),
        },
        {
          title: '实际上门量',
          dataIndex: 'actualVisit',
          key: 'actualVisit',
          align: 'center',
          render: (_, row) => formatNumber(row.actualVisit),
        },
      ],
    },
    {
      title: '招生人数',
      children: [
        {
          title: '目标人数',
          dataIndex: 'targetEnrollment',
          key: 'targetEnrollment',
          align: 'center',
          render: (_, row) => formatNumber(row.targetEnrollment),
        },
        {
          title: '实际人数',
          dataIndex: 'actualEnrollment',
          key: 'actualEnrollment',
          align: 'center',
          render: (_, row) => formatNumber(row.actualEnrollment),
        },
      ],
    },
    {
      title: '口碑收入',
      children: [
        {
          title: '目标收入',
          dataIndex: 'targetIncome',
          key: 'targetIncome',
          align: 'center',
          render: (_, row) => formatNumber(row.targetIncome),
        },
        {
          title: '实际收入',
          dataIndex: 'actualIncome',
          key: 'actualIncome',
          align: 'center',
          render: (_, row) => formatNumber(row.actualIncome),
        },
      ],
    },
    {
      title: '操作',
      key: 'actions',
      width: 140,
      fixed: 'right',
      align: 'center',
      render: (_, row) =>
        row.isSummary ? null : (
          <Space>
            <Button type="link" icon={<EditOutlined />} size="small" onClick={() => openModal(row)}>
              编辑
            </Button>
            <Popconfirm title="确定删除该记录？" onConfirm={() => handleDelete(row.id)}>
              <Button type="link" icon={<DeleteOutlined />} danger size="small">
                删除
              </Button>
            </Popconfirm>
          </Space>
        ),
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={4} style={{ margin: 0 }}>
            神殿口碑招生个人目标与结果汇总表
          </Title>
          <CampusSelector size="middle" />
        </div>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Statistic title="人员数量" value={records.length} />
          </Col>
          <Col span={6}>
            <Statistic title="实际口碑量合计" value={formatNumber(summary.actualReputation)} />
          </Col>
          <Col span={6}>
            <Statistic title="实际招生人数合计" value={formatNumber(summary.actualEnrollment)} />
          </Col>
          <Col span={6}>
            <Statistic title="实际口碑收入合计" value={formatNumber(summary.actualIncome)} />
          </Col>
        </Row>
      </Card>

      <Card>
        <div style={{ marginBottom: 12, display: 'flex', gap: 8 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
            添加人员数据
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={saving}
            onClick={async () => {
              setSaving(true)
              try {
                const payload = {
                  神殿名称: activeCampus,
                  年份: currentYear,
                  行列表: records.map((r) => ({
                    姓名: r.name,
                    目标口碑量: r.targetReputation,
                    实际口碑量: r.actualReputation,
                    目标上门量: r.targetVisit,
                    实际上门量: r.actualVisit,
                    目标招生人数: r.targetEnrollment,
                    实际招生人数: r.actualEnrollment,
                    目标口碑收入: r.targetIncome,
                    实际口碑收入: r.actualIncome,
                  })),
                }
                
                const res = await fetch(buildApiUrl('/reputation-personal'), {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(payload),
                })
                
                if (res.ok) {
                  message.success('保存成功')
                } else {
                  const error = await res.json().catch(() => ({}))
                  message.error(`保存失败: ${error.detail || '未知错误'}`)
                }
              } catch (error) {
                console.error('保存失败:', error)
                message.error('保存失败，请稍后重试')
              } finally {
                setSaving(false)
              }
            }}
          >
            保存到服务器
          </Button>
          <Button
            type="primary"
            loading={autoFilling}
            onClick={async () => {
              const success = await autoFillFromMonthly()
              if (success) {
                message.success('自动填充成功！')
              }
            }}
          >
            自动填充汇总表
          </Button>
        </div>
        <Table<TableRow>
          columns={columns}
          dataSource={dataSource}
          rowKey={(row) => (row.isSummary ? 'summary' : row.id)}
          bordered
          pagination={false}
          scroll={{ x: 1300 }}
          loading={loading}
        />
      </Card>

      <Modal
        title={editingRecord ? '编辑人员数据' : '添加人员数据'}
        open={modalVisible}
        onCancel={() => {
          form.resetFields()
          setModalVisible(false)
          setEditingRecord(null)
        }}
        onOk={handleSave}
        destroyOnHidden
        width={620}
      >
        <Form<PersonalGoalFormValues> form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="姓名"
                name="name"
                rules={[{ required: true, message: '请输入或选择姓名' }]}
                tooltip="可以从列表选择已有教员，也可以输入新教员姓名"
              >
                <AutoComplete
                  placeholder="请输入或选择姓名"
                  options={teacherNames.map((name) => ({ value: name, label: name }))}
                  filterOption={(inputValue, option) => {
                    if (!inputValue || inputValue.trim() === '') {
                      return true
                    }
                    if (!option) return false
                    const value = String(option.value || option.label || '').trim()
                    if (!value) return false
                    return value.toLowerCase().includes(inputValue.toLowerCase().trim())
                  }}
                  allowClear
                  onSelect={(value) => {
                    if (value && !teacherNames.includes(value)) {
                      setTeacherNames((prev) => {
                        if (!prev.includes(value)) {
                          return [...prev, value].sort()
                        }
                        return prev
                      })
                    }
                  }}
                  onBlur={(e) => {
                    const input = e.target as HTMLInputElement
                    const value = input.value?.trim()
                    if (value && !teacherNames.includes(value)) {
                      setTeacherNames((prev) => {
                        if (!prev.includes(value)) {
                          return [...prev, value].sort()
                        }
                        return prev
                      })
                    }
                  }}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="目标口碑量"
                name="targetReputation"
                rules={[{ required: true, message: '请输入目标口碑量' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="实际口碑量"
                name="actualReputation"
                rules={[{ required: true, message: '请输入实际口碑量' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="目标上门量"
                name="targetVisit"
                rules={[{ required: true, message: '请输入目标上门量' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="实际上门量"
                name="actualVisit"
                rules={[{ required: true, message: '请输入实际上门量' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="目标招生人数"
                name="targetEnrollment"
                rules={[{ required: true, message: '请输入目标人数' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="实际招生人数"
                name="actualEnrollment"
                rules={[{ required: true, message: '请输入实际人数' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="目标口碑收入"
                name="targetIncome"
                rules={[{ required: true, message: '请输入目标收入' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} addonBefore="¥" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="实际口碑收入"
                name="actualIncome"
                rules={[{ required: true, message: '请输入实际收入' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} addonBefore="¥" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  )
}

export default PersonalGoalsPage
