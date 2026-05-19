/**
 * 培训目标 - TAB1
 * 确定培训目标 矩阵表
 */
import React, { useEffect, useMemo, useState } from 'react'
import {
  App,
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  Typography,
  Popconfirm,
  Tag,
  Tooltip,
  Row,
  Col,
  message,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  PrinterOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import {
  createTrainingGoal,
  deleteTrainingGoal,
  listTrainingGoals,
  updateTrainingGoal,
  type TrainingGoalLevel,
  type TrainingGoalParentCategory,
  type TrainingGoalPayload,
  type TrainingGoalRecord,
} from '@/services/humanresources/trainingGoals'

const { Title, Text } = Typography
const { TextArea } = Input

const CURRENT_YEAR = String(new Date().getFullYear())

const TRAINING_LEVELS: TrainingGoalLevel[] = [
  '新员工岗前培训',
  '基层员工脱产培训',
  '中层脱产培训',
  '高层脱产培训',
]

const PARENT_CATEGORY_ORDER: TrainingGoalParentCategory[] = [
  '价值观正',
  '责任心强',
  '执行力高',
  '业务能力',
  '职业化充分',
  '梯队建设',
]

const CATEGORY_MAP: Record<TrainingGoalParentCategory, string[]> = {
  价值观正: ['遵守纪律', '服从管理', '学习态度认真', '工作态度端正'],
  责任心强: [''],
  执行力高: [''],
  业务能力: [''],
  职业化充分: [''],
  梯队建设: [''],
}

const EMPTY_SUBCATEGORY_SENTINEL = '__EMPTY_SUBCATEGORY__'

const getSubCategoryLabel = (value?: string | null) => value || '-'

type ErrorWithResponse = {
  response?: {
    data?: {
      detail?: string
    }
  }
  message?: string
}

const getErrorMessage = (error: unknown, fallback: string) => {
  const maybeError = error as ErrorWithResponse
  return maybeError.response?.data?.detail || maybeError.message || fallback
}

const sortYearsDesc = (years: string[]) =>
  [...years].sort((a, b) => {
    const aNum = Number(a)
    const bNum = Number(b)
    if (!Number.isNaN(aNum) && !Number.isNaN(bNum) && aNum !== bNum) {
      return bNum - aNum
    }
    return b.localeCompare(a, 'zh-CN')
  })

type MatrixCellTarget = {
  parentCategory: TrainingGoalParentCategory
  subCategory: string
  level: TrainingGoalLevel
  record?: TrainingGoalRecord
}

const MatrixView: React.FC<{
  data: TrainingGoalRecord[]
  year: string
  onCellClick: (target: MatrixCellTarget) => void
}> = ({ data, year, onCellClick }) => {
  const findRecord = (
    parentCategory: TrainingGoalParentCategory,
    subCategory: string,
    level: TrainingGoalLevel,
  ) => {
    return data.find(
      (item) =>
        item.parentCategory === parentCategory &&
        item.subCategory === subCategory &&
        item.level === level,
    )
  }

  const rows = PARENT_CATEGORY_ORDER.flatMap((parentCategory) =>
    CATEGORY_MAP[parentCategory].map((subCategory, index) => ({
      key: `${parentCategory}-${subCategory || 'blank'}`,
      parentCategory,
      parentRowSpan: index === 0 ? CATEGORY_MAP[parentCategory].length : 0,
      subCategory,
      data: Object.fromEntries(
        TRAINING_LEVELS.map((level) => [level, findRecord(parentCategory, subCategory, level)]),
      ) as Record<TrainingGoalLevel, TrainingGoalRecord | undefined>,
    })),
  )

  const columns = [
    {
      title: '培训类目',
      dataIndex: 'parentCategory',
      key: 'parentCategory',
      width: 100,
      onCell: (record: (typeof rows)[number]) => ({
        rowSpan: record.parentRowSpan,
      }),
      render: (text: string) => (
        <Text strong style={{ fontSize: 14 }}>
          {text}
        </Text>
      ),
    },
    {
      title: '培训内容',
      dataIndex: 'subCategory',
      key: 'subCategory',
      width: 120,
      render: (value: string) => value || ' ',
    },
    ...TRAINING_LEVELS.map((level) => ({
      title: level,
      dataIndex: ['data', level],
      key: level,
      width: 280,
      render: (_: unknown, record: (typeof rows)[number]) => {
        const cellRecord = record.data[level]
        const actionText = cellRecord ? '点击编辑' : '点击新增'
        return (
          <Tooltip title={actionText}>
            <div
              role="button"
              tabIndex={0}
              onClick={() =>
                onCellClick({
                  parentCategory: record.parentCategory,
                  subCategory: record.subCategory,
                  level,
                  record: cellRecord,
                })
              }
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  onCellClick({
                    parentCategory: record.parentCategory,
                    subCategory: record.subCategory,
                    level,
                    record: cellRecord,
                  })
                }
              }}
              style={{
                minHeight: 72,
                cursor: 'pointer',
                whiteSpace: 'pre-line',
                lineHeight: '1.8',
              }}
            >
              <div style={{ textAlign: 'right', marginBottom: 4 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {actionText}
                </Text>
              </div>
              {!cellRecord ? (
                <Text type="secondary">暂未设定</Text>
              ) : cellRecord.objectives.length ? (
                cellRecord.objectives.map((objective, index) => (
                  <div key={`${record.key}-${level}-${index}`}>{objective}</div>
                ))
              ) : (
                <Text>/</Text>
              )}
            </div>
          </Tooltip>
        )
      },
    })),
  ]

  return (
    <Table
      columns={columns as ColumnsType<(typeof rows)[number]>}
      dataSource={rows}
      rowKey="key"
      bordered
      pagination={false}
      size="middle"
      scroll={{ x: 1200 }}
      title={() => (
        <div style={{ textAlign: 'center' }}>
          <Title level={4} style={{ margin: 0 }}>
            确定培训目标{year ? `（${year}）` : ''}
          </Title>
        </div>
      )}
    />
  )
}

type GoalEditModalProps = {
  open: boolean
  loading: boolean
  defaultYear: string
  editingRecord: TrainingGoalRecord | null
  initialPayload?: Partial<TrainingGoalPayload> | null
  onCancel: () => void
  onOk: (payload: TrainingGoalPayload) => Promise<void>
}

const GoalEditModal: React.FC<GoalEditModalProps> = ({
  open,
  loading,
  defaultYear,
  editingRecord,
  initialPayload,
  onCancel,
  onOk,
}) => {
  const [form] = Form.useForm()
  const [subOptions, setSubOptions] = useState<string[]>([])

  const mapFormSubCategory = (value?: string | null) => (value ? value : EMPTY_SUBCATEGORY_SENTINEL)

  const mapPayloadSubCategory = (value?: string) =>
    value === EMPTY_SUBCATEGORY_SENTINEL ? '' : value || ''

  useEffect(() => {
    if (!open) {
      return
    }

    if (editingRecord) {
      setSubOptions(CATEGORY_MAP[editingRecord.parentCategory] ?? [])
      form.setFieldsValue({
        parentCategory: editingRecord.parentCategory,
        subCategory: mapFormSubCategory(editingRecord.subCategory),
        level: editingRecord.level,
        objectivesText: editingRecord.objectives.join('\n'),
        year: editingRecord.year,
        remark: editingRecord.remark || undefined,
      })
      return
    }

    if (initialPayload?.parentCategory) {
      setSubOptions(CATEGORY_MAP[initialPayload.parentCategory] ?? [])
      form.resetFields()
      form.setFieldsValue({
        parentCategory: initialPayload.parentCategory,
        subCategory: mapFormSubCategory(initialPayload.subCategory),
        level: initialPayload.level,
        objectivesText: initialPayload.objectives?.join('\n'),
        year: initialPayload.year || defaultYear,
        remark: initialPayload.remark || undefined,
      })
      return
    }

    setSubOptions([])
    form.resetFields()
    form.setFieldsValue({ year: defaultYear })
  }, [defaultYear, editingRecord, form, initialPayload, open])

  const handleParentChange = (value: TrainingGoalParentCategory) => {
    const nextOptions = CATEGORY_MAP[value] ?? []
    setSubOptions(nextOptions)
    form.setFieldValue(
      'subCategory',
      nextOptions.length === 1 ? mapFormSubCategory(nextOptions[0]) : undefined,
    )
  }

  const handleOk = async () => {
    const values = await form.validateFields()
    await onOk({
      parentCategory: values.parentCategory,
      subCategory: mapPayloadSubCategory(values.subCategory),
      level: values.level,
      objectives: String(values.objectivesText || '')
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean),
      year: String(values.year).trim(),
      remark: values.remark || undefined,
    })
  }

  return (
    <Modal
      title={editingRecord ? '编辑培训目标' : '新增培训目标'}
      open={open}
      onCancel={onCancel}
      onOk={() => void handleOk()}
      okText="保存"
      cancelText="取消"
      confirmLoading={loading}
      width={700}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="parentCategory"
              label="一级分类"
              rules={[{ required: true, message: '请选择一级分类' }]}
            >
              <Select
                placeholder="请选择一级分类"
                onChange={handleParentChange}
                options={PARENT_CATEGORY_ORDER.map((value) => ({ label: value, value }))}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="subCategory"
              label="二级分类"
              rules={[{ required: true, message: '请选择二级分类' }]}
            >
              <Select
                placeholder="请选择二级分类"
                options={subOptions.map((value) => ({
                  label: value || '无二级分类',
                  value: mapFormSubCategory(value),
                }))}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="level"
              label="培训级别"
              rules={[{ required: true, message: '请选择培训级别' }]}
            >
              <Select
                placeholder="请选择培训级别"
                options={TRAINING_LEVELS.map((value) => ({ label: value, value }))}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="year" label="年度" rules={[{ required: true, message: '请输入年度' }]}>
              <Input placeholder="如 2026" maxLength={10} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="objectivesText" label="培训目标（每行一条）">
          <TextArea
            rows={6}
            placeholder={'如:\n1.了解公司考勤制度\n2.了解着装行为规范\n留空则显示 /'}
          />
        </Form.Item>

        <Form.Item name="remark" label="备注">
          <TextArea rows={2} placeholder="可选备注" />
        </Form.Item>
      </Form>
    </Modal>
  )
}

const PrintPreviewModal: React.FC<{
  open: boolean
  year: string
  data: TrainingGoalRecord[]
  onCancel: () => void
}> = ({ open, year, data, onCancel }) => {
  const handlePrint = () => {
    window.print()
  }

  return (
    <Modal
      title={`打印预览 - 确定培训目标${year ? `（${year}）` : ''}`}
      open={open}
      onCancel={onCancel}
      width={1100}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          关闭
        </Button>,
        <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>
          打印
        </Button>,
      ]}
    >
      <div className="print-area">
        <MatrixView data={data} year={year} onCellClick={() => undefined} />
      </div>
    </Modal>
  )
}

const ListView: React.FC<{
  loading: boolean
  data: TrainingGoalRecord[]
  onEdit: (record: TrainingGoalRecord) => void
  onDelete: (id: number) => void
  onView: (record: TrainingGoalRecord) => void
}> = ({ loading, data, onEdit, onDelete, onView }) => {
  const columns: ColumnsType<TrainingGoalRecord> = [
    {
      title: '一级分类',
      dataIndex: 'parentCategory',
      key: 'parentCategory',
      width: 100,
      render: (text: string) => <Tag color="blue">{text}</Tag>,
      filters: PARENT_CATEGORY_ORDER.map((value) => ({ text: value, value })),
      onFilter: (value, record) => record.parentCategory === value,
    },
    {
      title: '二级分类',
      dataIndex: 'subCategory',
      key: 'subCategory',
      width: 120,
      render: (value: string) => getSubCategoryLabel(value),
    },
    {
      title: '培训级别',
      dataIndex: 'level',
      key: 'level',
      width: 150,
      render: (text: string) => {
        const colorMap: Record<string, string> = {
          新员工岗前培训: 'green',
          基层员工脱产培训: 'cyan',
          中层脱产培训: 'orange',
          高层脱产培训: 'red',
        }
        return <Tag color={colorMap[text] ?? 'default'}>{text}</Tag>
      },
      filters: TRAINING_LEVELS.map((value) => ({ text: value, value })),
      onFilter: (value, record) => record.level === value,
    },
    {
      title: '培训目标',
      dataIndex: 'objectives',
      key: 'objectives',
      render: (objectives: string[]) => (
        <div style={{ whiteSpace: 'pre-line', lineHeight: 1.6 }}>
          {objectives.length
            ? objectives.map((objective, index) => (
                <div key={`${objective}-${index}`}>{objective}</div>
              ))
            : '/'}
        </div>
      ),
    },
    {
      title: '年度',
      dataIndex: 'year',
      key: 'year',
      width: 90,
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: unknown, record) => (
        <Space>
          <Tooltip title="查看">
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => onView(record)}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => onEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="确认删除该培训目标？"
            onConfirm={() => onDelete(record.id)}
            okText="删除"
            cancelText="取消"
          >
            <Tooltip title="删除">
              <Button type="link" size="small" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <Table
      loading={loading}
      columns={columns}
      dataSource={data}
      rowKey="id"
      bordered
      size="middle"
      pagination={{ pageSize: 10, showSizeChanger: true }}
      scroll={{ x: 1000 }}
    />
  )
}

const TrainingGoals: React.FC = () => {
  const [data, setData] = useState<TrainingGoalRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [viewMode, setViewMode] = useState<'matrix' | 'list'>('matrix')
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<TrainingGoalRecord | null>(null)
  const [initialPayload, setInitialPayload] = useState<Partial<TrainingGoalPayload> | null>(null)
  const [printOpen, setPrintOpen] = useState(false)
  const [viewRecord, setViewRecord] = useState<TrainingGoalRecord | null>(null)
  const [searchText, setSearchText] = useState('')
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR)

  const loadData = async () => {
    setLoading(true)
    try {
      const records = await listTrainingGoals()
      setData(records)
    } catch (error) {
      message.error(getErrorMessage(error, '加载培训目标失败'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const yearOptions = useMemo(
    () =>
      sortYearsDesc(
        Array.from(new Set([CURRENT_YEAR, ...data.map((item) => item.year).filter(Boolean)])),
      ),
    [data],
  )

  useEffect(() => {
    if (yearOptions.includes(selectedYear)) {
      return
    }
    setSelectedYear(yearOptions[0] || CURRENT_YEAR)
  }, [selectedYear, yearOptions])

  const filteredData = useMemo(() => {
    const keyword = searchText.trim().toLowerCase()
    return data.filter((item) => {
      if (item.year !== selectedYear) {
        return false
      }
      if (!keyword) {
        return true
      }
      return [
        item.parentCategory,
        item.subCategory,
        item.level,
        item.year,
        item.remark,
        ...item.objectives,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword))
    })
  }, [data, searchText, selectedYear])

  const handleAdd = () => {
    setEditingRecord(null)
    setInitialPayload({
      year: selectedYear,
      objectives: [],
    })
    setEditModalOpen(true)
  }

  const handleEdit = (record: TrainingGoalRecord) => {
    setEditingRecord(record)
    setInitialPayload(null)
    setEditModalOpen(true)
  }

  const handleMatrixCellClick = ({
    parentCategory,
    subCategory,
    level,
    record,
  }: MatrixCellTarget) => {
    if (record) {
      handleEdit(record)
      return
    }
    setEditingRecord(null)
    setInitialPayload({
      parentCategory,
      subCategory,
      level,
      year: selectedYear,
      objectives: [],
    })
    setEditModalOpen(true)
  }

  const handleSave = async (payload: TrainingGoalPayload) => {
    setSubmitting(true)
    try {
      const savedRecord = editingRecord
        ? await updateTrainingGoal(editingRecord.id, payload)
        : await createTrainingGoal(payload)

      setData((prev) => {
        if (editingRecord) {
          return prev.map((item) => (item.id === savedRecord.id ? savedRecord : item))
        }
        return [savedRecord, ...prev]
      })
      setEditModalOpen(false)
      setEditingRecord(null)
      setInitialPayload(null)
      setSelectedYear(savedRecord.year)
      message.success(editingRecord ? '编辑成功' : '新增成功')
    } catch (error) {
      message.error(getErrorMessage(error, editingRecord ? '编辑失败' : '新增失败'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteTrainingGoal(id)
      setData((prev) => prev.filter((item) => item.id !== id))
      if (viewRecord?.id === id) {
        setViewRecord(null)
      }
      message.success('删除成功')
    } catch (error) {
      message.error(getErrorMessage(error, '删除失败'))
    }
  }

  return (
    <div>
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle" gutter={16}>
          <Col>
            <Space wrap>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                新增培训目标
              </Button>
              <Button icon={<PrinterOutlined />} onClick={() => setPrintOpen(true)}>
                打印预览
              </Button>
              <Button icon={<ReloadOutlined />} onClick={() => void loadData()}>
                刷新
              </Button>
              <Button
                type={viewMode === 'matrix' ? 'primary' : 'default'}
                onClick={() => setViewMode('matrix')}
              >
                矩阵视图
              </Button>
              <Button
                type={viewMode === 'list' ? 'primary' : 'default'}
                onClick={() => setViewMode('list')}
              >
                列表视图
              </Button>
            </Space>
          </Col>
          <Col>
            <Space wrap>
              <Select
                style={{ width: 120 }}
                value={selectedYear}
                onChange={setSelectedYear}
                options={yearOptions.map((value) => ({ label: `${value}年`, value }))}
              />
              <Input
                placeholder="搜索培训目标..."
                prefix={<SearchOutlined />}
                allowClear
                style={{ width: 260 }}
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
              />
            </Space>
          </Col>
        </Row>
      </Card>

      <Card loading={loading}>
        {viewMode === 'matrix' ? (
          <MatrixView data={filteredData} year={selectedYear} onCellClick={handleMatrixCellClick} />
        ) : (
          <ListView
            loading={loading}
            data={filteredData}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onView={setViewRecord}
          />
        )}
      </Card>

      <GoalEditModal
        open={editModalOpen}
        loading={submitting}
        defaultYear={selectedYear}
        editingRecord={editingRecord}
        initialPayload={initialPayload}
        onCancel={() => {
          if (submitting) {
            return
          }
          setEditModalOpen(false)
          setEditingRecord(null)
          setInitialPayload(null)
        }}
        onOk={handleSave}
      />

      <PrintPreviewModal
        open={printOpen}
        year={selectedYear}
        data={filteredData}
        onCancel={() => setPrintOpen(false)}
      />

      <Modal
        title="培训目标详情"
        open={!!viewRecord}
        onCancel={() => setViewRecord(null)}
        footer={[
          <Button key="close" onClick={() => setViewRecord(null)}>
            关闭
          </Button>,
        ]}
        width={640}
      >
        {viewRecord ? (
          <div style={{ lineHeight: 2.1 }}>
            <p>
              <Text strong>一级分类：</Text>
              <Tag color="blue">{viewRecord.parentCategory}</Tag>
            </p>
            <p>
              <Text strong>二级分类：</Text> {getSubCategoryLabel(viewRecord.subCategory)}
            </p>
            <p>
              <Text strong>培训级别：</Text>
              <Tag>{viewRecord.level}</Tag>
            </p>
            <p>
              <Text strong>年度：</Text> {viewRecord.year}
            </p>
            <p>
              <Text strong>培训目标：</Text>
            </p>
            <div
              style={{
                background: '#fafafa',
                padding: '12px 16px',
                borderRadius: 6,
                lineHeight: 2,
              }}
            >
              {viewRecord.objectives.length
                ? viewRecord.objectives.map((objective, index) => (
                    <div key={`${objective}-${index}`}>{objective}</div>
                  ))
                : '/'}
            </div>
            {viewRecord.remark ? (
              <p style={{ marginTop: 12 }}>
                <Text strong>备注：</Text> {viewRecord.remark}
              </p>
            ) : null}
            <p style={{ marginTop: 12 }}>
              <Text strong>创建人：</Text> {viewRecord.createdByName || '-'}
            </p>
            <p>
              <Text strong>更新时间：</Text> {viewRecord.updatedAt}
            </p>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}

export default TrainingGoals