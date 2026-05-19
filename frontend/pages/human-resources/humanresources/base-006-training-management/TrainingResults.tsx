/**
 * 培训成绩汇总表 - TAB3
 * XX神殿XX部门考试成绩汇总表
 *
 * 表头统计信息：
 *   培训日期、培训时长（小时）
 *   应参加人数、实际参加人数
 *   合格人数、不合格人数
 *   人均培训时长、平均分（总分数÷实际参加人数）
 *   总花费、人均成本（总花费÷实际参加人数）
 *   合格率（合格人数÷实际参加人数×100%）
 *
 * 明细列：参训人员、理论成绩、实操成绩、综合得分、排名、备注
 *
 * 备注规则：
 *   1. 第一名和倒数第一名用黄色进行标注
 *   2. 排名由第一名依次往下
 *   3. 分数60分以下视为不合格
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
  InputNumber,
  Space,
  Typography,
  Popconfirm,
  Tag,
  Tooltip,
  Row,
  Col,
  DatePicker,
  Select,
  message,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  PrinterOutlined,
  SearchOutlined,
  UserAddOutlined,
  MinusCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { useAuthStore } from '@/stores/authStore'
import { useCampusStore } from '@/stores/campusStore'
import { fetchEmployeeDepartments } from '@/services/configMaster'
import {
  createTrainingResult,
  deleteTrainingResult,
  listTrainingResultsPaged,
  updateTrainingResult,
  type TrainingResultPayload,
  type TrainingResultRecord,
  type TrainingResultTraineePayload,
  type TrainingResultTraineeRecord,
} from '@/services/humanresources/trainingResults'

const { Title, Text } = Typography

/* ==================== 类型定义 ==================== */

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

/* ==================== 工具函数 ==================== */

/** 人均培训时长 */
const calcAvgHours = (hours: number, count: number): string => {
  if (count === 0) return '-'
  return (hours / count).toFixed(1)
}

const getRankTagColor = (rank: number, maxRank: number): string => {
  if (rank === 1) return 'gold'
  if (rank === 2) return 'lime'
  if (rank === 3) return 'cyan'
  if (rank === maxRank) return 'volcano'
  return 'blue'
}

const isPendingResultRecord = (record: TrainingResultRecord): boolean =>
  record.trainees.length > 0
  && record.trainees.every((trainee) => trainee.theoryScore === 0 && trainee.practiceScore === 0)

/* ==================== 编辑弹窗 ==================== */

interface ResultEditModalProps {
  open: boolean
  loading: boolean
  campusOptions: Array<{ label: string; value: string }>
  departmentOptions: Array<{ label: string; value: string }>
  defaultCampus?: string
  defaultDepartment?: string | null
  editingRecord: TrainingResultRecord | null
  onCancel: () => void
  onOk: (payload: TrainingResultPayload) => Promise<void>
}

const ResultEditModal: React.FC<ResultEditModalProps> = ({
  open,
  loading,
  campusOptions,
  departmentOptions,
  defaultCampus,
  defaultDepartment,
  editingRecord,
  onCancel,
  onOk,
}) => {
  const [form] = Form.useForm()
  const isEdit = !!editingRecord

  React.useEffect(() => {
    if (open) {
      if (editingRecord) {
        form.setFieldsValue({
          campus: editingRecord.campus,
          department: editingRecord.department,
          trainingDate: editingRecord.trainingDate ? dayjs(editingRecord.trainingDate) : undefined,
          trainingHours: editingRecord.trainingHours,
          expectedCount: editingRecord.expectedCount,
          totalCost: editingRecord.totalCost,
          trainees: editingRecord.trainees.map((t) => ({
            name: t.name,
            theoryScore: t.theoryScore,
            practiceScore: t.practiceScore,
            remark: t.remark,
          })),
        })
      } else {
        form.resetFields()
        form.setFieldsValue({
          campus: defaultCampus || undefined,
          department: defaultDepartment || undefined,
          trainingDate: dayjs(),
          trainingHours: 0,
          expectedCount: 0,
          totalCost: 0,
          trainees: [{ name: '', theoryScore: 0, practiceScore: 0, remark: '' }],
        })
      }
    }
  }, [defaultCampus, defaultDepartment, open, editingRecord, form])

  const handleOk = async () => {
    const values = await form.validateFields()
    const rawTrainees = values.trainees as {
      name: string
      theoryScore: number
      practiceScore: number
      remark: string
    }[]

    const trainees: TrainingResultTraineePayload[] = rawTrainees.map((t) => ({
      name: t.name,
      theoryScore: t.theoryScore,
      practiceScore: t.practiceScore,
      remark: t.remark ?? '',
    }))

    await onOk({
      campus: values.campus,
      department: values.department,
      trainingDate: values.trainingDate.format('YYYY-MM-DD'),
      trainingHours: values.trainingHours,
      expectedCount: values.expectedCount,
      totalCost: values.totalCost,
      trainees,
    })
  }

  return (
    <Modal
      title={isEdit ? '编辑培训成绩汇总表' : '新增培训成绩汇总表'}
      open={open}
      onCancel={onCancel}
      onOk={() => void handleOk()}
      okText="保存"
      cancelText="取消"
      confirmLoading={loading}
      width={950}
      destroyOnClose
      styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
    >
      <Form form={form} layout="vertical">
        {/* 基本信息 */}
        <Card size="small" title="基本信息" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item
                name="campus"
                label="神殿"
                rules={[{ required: true, message: '请选择神殿' }]}
              >
                <Select
                  showSearch
                  allowClear
                  placeholder="请选择神殿"
                  optionFilterProp="label"
                  options={campusOptions}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="department"
                label="部门"
                rules={[{ required: true, message: '请选择部门' }]}
              >
                <Select
                  showSearch
                  allowClear
                  placeholder="请选择部门"
                  optionFilterProp="label"
                  options={departmentOptions}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="trainingDate"
                label="培训日期"
                rules={[{ required: true, message: '请选择培训日期' }]}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  format="YYYY-MM-DD"
                  placeholder="请选择培训日期"
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="trainingHours"
                label="培训时长（小时）"
                rules={[{ required: true, message: '请填写' }]}
              >
                <InputNumber min={0} step={0.5} style={{ width: '100%' }} placeholder="如 8" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item
                name="expectedCount"
                label="应参加人数"
                rules={[{ required: true, message: '请填写' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} placeholder="如 10" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="totalCost"
                label="总花费（元）"
                rules={[{ required: true, message: '请填写' }]}
              >
                <InputNumber min={0} step={100} style={{ width: '100%' }} placeholder="如 5000" />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* 参训人员明细（动态表单） */}
        <Card size="small" title="参训人员成绩明细" style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 8 }}>
            <Text type="secondary">
              综合得分 = 理论成绩×50% + 实操成绩×50%（自动计算）；60分以下视为不合格
            </Text>
          </div>
          <Form.List name="trainees">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }, idx) => (
                  <Row key={key} gutter={8} align="middle" style={{ marginBottom: 8 }}>
                    <Col span={1}>
                      <Text type="secondary">{idx + 1}</Text>
                    </Col>
                    <Col span={5}>
                      <Form.Item
                        {...restField}
                        name={[name, 'name']}
                        rules={[{ required: true, message: '姓名' }]}
                        style={{ marginBottom: 0 }}
                      >
                        <Input placeholder="姓名" />
                      </Form.Item>
                    </Col>
                    <Col span={5}>
                      <Form.Item
                        {...restField}
                        name={[name, 'theoryScore']}
                        rules={[{ required: true, message: '理论' }]}
                        style={{ marginBottom: 0 }}
                      >
                        <InputNumber
                          min={0}
                          max={100}
                          style={{ width: '100%' }}
                          placeholder="理论成绩"
                        />
                      </Form.Item>
                    </Col>
                    <Col span={5}>
                      <Form.Item
                        {...restField}
                        name={[name, 'practiceScore']}
                        rules={[{ required: true, message: '实操' }]}
                        style={{ marginBottom: 0 }}
                      >
                        <InputNumber
                          min={0}
                          max={100}
                          style={{ width: '100%' }}
                          placeholder="实操成绩"
                        />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item {...restField} name={[name, 'remark']} style={{ marginBottom: 0 }}>
                        <Input placeholder="备注" />
                      </Form.Item>
                    </Col>
                    <Col span={2}>
                      {fields.length > 1 && (
                        <Button
                          type="text"
                          danger
                          icon={<MinusCircleOutlined />}
                          onClick={() => remove(name)}
                        />
                      )}
                    </Col>
                  </Row>
                ))}
                <Button
                  type="dashed"
                  onClick={() => add({ name: '', theoryScore: 0, practiceScore: 0, remark: '' })}
                  block
                  icon={<UserAddOutlined />}
                >
                  添加参训人员
                </Button>
              </>
            )}
          </Form.List>
        </Card>
      </Form>
    </Modal>
  )
}

/* ==================== 打印预览弹窗 ==================== */

interface ResultPreviewModalProps {
  open: boolean
  record: TrainingResultRecord | null
  onCancel: () => void
}

const ResultPreviewModal: React.FC<ResultPreviewModalProps> = ({ open, record, onCancel }) => {
  if (!record) return null

  const passCount = record.passCount
  const failCount = record.failCount
  const avg = record.averageScore
  const passRate = `${record.passRate.toFixed(2)}%`
  const avgHours = calcAvgHours(record.trainingHours, record.actualCount)
  const avgCost = record.averageCost.toFixed(2)
  const maxRank = record.trainees.length

  const handlePrint = () => window.print()

  /** 行样式：第一名和倒数第一名黄色背景 */
  const getRowBg = (rank: number): string => {
    if (rank === 1 || rank === maxRank) return '#fffbe6'
    return 'transparent'
  }

  /* ====== 表头信息区域样式 ====== */
  const cellStyle: React.CSSProperties = {
    padding: '6px 10px',
    border: '1px solid #d9d9d9',
    fontSize: 13,
  }
  const labelStyle: React.CSSProperties = {
    ...cellStyle,
    fontWeight: 'bold',
    background: '#fafafa',
    whiteSpace: 'nowrap',
    width: 130,
  }

  return (
    <Modal
      title="打印预览 - 培训成绩汇总表"
      open={open}
      onCancel={onCancel}
      width={950}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          关闭
        </Button>,
        <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>
          打印
        </Button>,
      ]}
    >
      <div className="print-area" style={{ padding: '0 8px' }}>
        {/* 标题 */}
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <Title level={4} style={{ margin: 0 }}>
            {record.campus}神殿{record.department}考试成绩汇总表
          </Title>
        </div>

        {/* 表头汇总信息 */}
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            marginBottom: 16,
          }}
        >
          <tbody>
            <tr>
              <td style={labelStyle}>培训日期</td>
              <td style={cellStyle}>{record.trainingDate}</td>
              <td style={labelStyle}>培训时长（小时）</td>
              <td style={cellStyle}>{record.trainingHours}</td>
            </tr>
            <tr>
              <td style={labelStyle}>应参加人数</td>
              <td style={cellStyle}>{record.expectedCount}</td>
              <td style={labelStyle}>实际参加人数</td>
              <td style={cellStyle}>{record.actualCount}</td>
            </tr>
            <tr>
              <td style={labelStyle}>合格人数</td>
              <td style={cellStyle}>{passCount}</td>
              <td style={labelStyle}>不合格人数</td>
              <td style={cellStyle}>{failCount}</td>
            </tr>
            <tr>
              <td style={labelStyle}>人均培训时长</td>
              <td style={cellStyle}>{avgHours}</td>
              <td style={labelStyle}>平均分</td>
              <td style={cellStyle}>
                {avg}
                <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                  总分数÷实际参加人数
                </Text>
              </td>
            </tr>
            <tr>
              <td style={labelStyle}>总花费</td>
              <td style={cellStyle}>{record.totalCost} 元</td>
              <td style={labelStyle}>人均成本</td>
              <td style={cellStyle}>
                {avgCost} 元
                <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                  总花费÷实际参加人数
                </Text>
              </td>
            </tr>
            <tr>
              <td style={labelStyle}>合格率</td>
              <td colSpan={3} style={cellStyle}>
                {passRate}
                <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                  合格人数÷实际参加人数×100%
                </Text>
              </td>
            </tr>
          </tbody>
        </table>

        {/* 成绩明细表 */}
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            border: '1px solid #d9d9d9',
          }}
        >
          <thead>
            <tr style={{ background: '#fafafa' }}>
              {['参训人员', '理论成绩', '实操成绩', '综合得分', '排名', '备注'].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: '8px 10px',
                    borderBottom: '2px solid #d9d9d9',
                    borderRight: '1px solid #d9d9d9',
                    textAlign: 'center',
                    fontWeight: 'bold',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {record.trainees.map((t, index) => (
              <tr key={`${record.id}-${index}`} style={{ background: getRowBg(t.rank) }}>
                <td
                  style={{
                    padding: '6px 10px',
                    borderBottom: '1px solid #e8e8e8',
                    borderRight: '1px solid #e8e8e8',
                    textAlign: 'center',
                  }}
                >
                  {t.name}
                </td>
                <td
                  style={{
                    padding: '6px 10px',
                    borderBottom: '1px solid #e8e8e8',
                    borderRight: '1px solid #e8e8e8',
                    textAlign: 'center',
                  }}
                >
                  {t.theoryScore}
                </td>
                <td
                  style={{
                    padding: '6px 10px',
                    borderBottom: '1px solid #e8e8e8',
                    borderRight: '1px solid #e8e8e8',
                    textAlign: 'center',
                  }}
                >
                  {t.practiceScore}
                </td>
                <td
                  style={{
                    padding: '6px 10px',
                    borderBottom: '1px solid #e8e8e8',
                    borderRight: '1px solid #e8e8e8',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    color: t.compositeScore < 60 ? '#ff4d4f' : '#389e0d',
                  }}
                >
                  {t.compositeScore}
                </td>
                <td
                  style={{
                    padding: '6px 10px',
                    borderBottom: '1px solid #e8e8e8',
                    borderRight: '1px solid #e8e8e8',
                    textAlign: 'center',
                  }}
                >
                  <Tag color={getRankTagColor(t.rank, maxRank)}>第{t.rank}名</Tag>
                </td>
                <td
                  style={{
                    padding: '6px 10px',
                    borderBottom: '1px solid #e8e8e8',
                    textAlign: 'center',
                  }}
                >
                  {t.rank === 1
                    ? '第一名（黄色标注）'
                    : t.rank === maxRank
                      ? '倒数第一名（黄色标注）'
                      : t.compositeScore < 60
                        ? '不合格'
                        : t.remark}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 备注 */}
        <div style={{ marginTop: 16, fontSize: 13, color: '#666' }}>
          <Text strong>备注：</Text>
          <br />
          1. 第一名和倒数第一名用黄色进行标注
          <br />
          2. 排名由第一名依次往下
          <br />
          3. 分数60分以下视为不合格
        </div>
      </div>
    </Modal>
  )
}

/* ==================== 主组件 ==================== */

type TrainingResultsProps = {
  syncVersion?: number
}

const TrainingResults: React.FC<TrainingResultsProps> = ({ syncVersion = 0 }) => {
  const user = useAuthStore((state) => state.user)
  const accessibleCampuses = useAuthStore((state) => state.accessibleCampuses)
  const campusRestricted = useAuthStore((state) => state.campusRestricted)
  const currentCampus = useCampusStore((state) => state.currentCampus)
  const getAllCampuses = useCampusStore((state) => state.getAllCampuses)
  const getFilteredCampuses = useCampusStore((state) => state.getFilteredCampuses)
  const [data, setData] = useState<TrainingResultRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<TrainingResultRecord | null>(null)
  const [previewRecord, setPreviewRecord] = useState<TrainingResultRecord | null>(null)
  const [searchText, setSearchText] = useState('')
  const [departmentOptions, setDepartmentOptions] = useState<Array<{ label: string; value: string }>>([])
  const [selectedCampus, setSelectedCampus] = useState<string | undefined>(undefined)
  const [selectedDepartment, setSelectedDepartment] = useState<string | undefined>(undefined)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)

  const campusOptions = useMemo(() => {
    const campuses = campusRestricted ? getFilteredCampuses(accessibleCampuses) : getAllCampuses()
    return campuses.map((campus) => ({
      label: campus.name,
      value: campus.name,
    }))
  }, [accessibleCampuses, campusRestricted, getAllCampuses, getFilteredCampuses])

  const loadData = async (params?: { campus?: string; department?: string; search?: string }) => {
    setLoading(true)
    try {
      const records = await listTrainingResultsPaged({
        campus: params?.campus,
        department: params?.department,
        search: params?.search,
        page: currentPage,
        pageSize,
      })
      setData(records.items)
      setTotal(records.total)
    } catch (error) {
      message.error(getErrorMessage(error, '加载培训成绩汇总表失败'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData({
      campus: selectedCampus,
      department: selectedDepartment,
      search: searchText.trim() || undefined,
    })
  }, [searchText, selectedCampus, selectedDepartment, currentPage, pageSize, syncVersion])

  useEffect(() => {
    let active = true

    fetchEmployeeDepartments()
      .then((departments) => {
        if (!active) return
        const options = departments.map((department) => ({
          label: department,
          value: department,
        }))
        setDepartmentOptions(options)
      })
      .catch((error) => {
        if (!active) return
        console.error('加载部门列表失败', error)
        message.error(getErrorMessage(error, '加载部门列表失败'))
      })

    return () => {
      active = false
    }
  }, [])

  /** 新增 */
  const handleAdd = () => {
    setEditingRecord(null)
    setEditModalOpen(true)
  }

  /** 编辑 */
  const handleEdit = (record: TrainingResultRecord) => {
    setEditingRecord(record)
    setEditModalOpen(true)
  }

  /** 保存 */
  const handleSave = async (payload: TrainingResultPayload) => {
    setSubmitting(true)
    try {
      const savedRecord = editingRecord
        ? await updateTrainingResult(editingRecord.id, payload)
        : await createTrainingResult(payload)
      void savedRecord
      setEditModalOpen(false)
      setEditingRecord(null)
      if (!editingRecord && currentPage !== 1) {
        setCurrentPage(1)
      } else {
        await loadData({
          campus: selectedCampus,
          department: selectedDepartment,
          search: searchText.trim() || undefined,
        })
      }
      message.success(editingRecord ? '编辑成功' : '新增成功')
    } catch (error) {
      message.error(getErrorMessage(error, editingRecord ? '编辑失败' : '新增失败'))
    } finally {
      setSubmitting(false)
    }
  }

  /** 删除 */
  const handleDelete = async (id: number) => {
    try {
      await deleteTrainingResult(id)
      if (previewRecord?.id === id) {
        setPreviewRecord(null)
      }
      await loadData({
        campus: selectedCampus,
        department: selectedDepartment,
        search: searchText.trim() || undefined,
      })
      message.success('删除成功')
    } catch (error) {
      message.error(getErrorMessage(error, '删除失败'))
    }
  }

  /** 列定义 */
  const columns: ColumnsType<TrainingResultRecord> = [
    {
      title: '神殿',
      dataIndex: 'campus',
      key: 'campus',
      width: 80,
    },
    {
      title: '部门',
      dataIndex: 'department',
      key: 'department',
      width: 100,
    },
    {
      title: '培训日期',
      dataIndex: 'trainingDate',
      key: 'trainingDate',
      width: 120,
    },
    {
      title: '填报状态',
      key: 'fillStatus',
      width: 100,
      align: 'center' as const,
      render: (_: unknown, record: TrainingResultRecord) => (
        <Tag color={isPendingResultRecord(record) ? 'orange' : 'green'}>
          {isPendingResultRecord(record) ? '待填写' : '已填写'}
        </Tag>
      ),
    },
    {
      title: '时长(h)',
      dataIndex: 'trainingHours',
      key: 'trainingHours',
      width: 80,
      align: 'center' as const,
    },
    {
      title: '应到/实到',
      key: 'attendance',
      width: 100,
      align: 'center' as const,
      render: (_: unknown, r: TrainingResultRecord) => (
        <span>
          {r.expectedCount} / <Text strong>{r.actualCount}</Text>
        </span>
      ),
    },
    {
      title: '合格/不合格',
      key: 'passInfo',
      width: 110,
      align: 'center' as const,
      render: (_: unknown, r: TrainingResultRecord) => {
        return (
          <span>
            <Text type="success">{r.passCount}</Text> / <Text type="danger">{r.failCount}</Text>
          </span>
        )
      },
    },
    {
      title: '平均分',
      key: 'avg',
      width: 80,
      align: 'center' as const,
      render: (_: unknown, r: TrainingResultRecord) => <Text strong>{r.averageScore}</Text>,
      sorter: (a, b) => a.averageScore - b.averageScore,
    },
    {
      title: '合格率',
      key: 'passRate',
      width: 90,
      align: 'center' as const,
      render: (_: unknown, r: TrainingResultRecord) => {
        const rate = r.passRate
        return (
          <Tag color={rate >= 80 ? 'green' : rate >= 60 ? 'orange' : 'red'}>{rate.toFixed(2)}%</Tag>
        )
      },
      sorter: (a, b) => a.passRate - b.passRate,
    },
    {
      title: '总花费',
      dataIndex: 'totalCost',
      key: 'totalCost',
      width: 100,
      align: 'right' as const,
      render: (val: number) => `¥${val.toLocaleString()}`,
    },
    {
      title: '人均成本',
      key: 'avgCost',
      width: 100,
      align: 'right' as const,
      render: (_: unknown, r: TrainingResultRecord) => `¥${r.averageCost.toFixed(2)}`,
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: unknown, record: TrainingResultRecord) => (
        <Space>
          <Tooltip title="预览">
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => setPreviewRecord(record)}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="确认删除该条记录?"
            onConfirm={() => void handleDelete(record.id)}
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

  /** 展开行：显示参训人员明细 */
  const expandedRowRender = (record: TrainingResultRecord) => {
    const maxRank = record.trainees.length
    const innerColumns: ColumnsType<TrainingResultTraineeRecord> = [
      {
        title: '参训人员',
        dataIndex: 'name',
        key: 'name',
        width: 120,
      },
      {
        title: '理论成绩',
        dataIndex: 'theoryScore',
        key: 'theoryScore',
        width: 100,
        align: 'center' as const,
      },
      {
        title: '实操成绩',
        dataIndex: 'practiceScore',
        key: 'practiceScore',
        width: 100,
        align: 'center' as const,
      },
      {
        title: '综合得分',
        dataIndex: 'compositeScore',
        key: 'compositeScore',
        width: 100,
        align: 'center' as const,
        render: (val: number) => (
          <Text strong style={{ color: val < 60 ? '#ff4d4f' : '#389e0d' }}>
            {val}
          </Text>
        ),
      },
      {
        title: '排名',
        dataIndex: 'rank',
        key: 'rank',
        width: 80,
        align: 'center' as const,
        render: (val: number) => <Tag color={getRankTagColor(val, maxRank)}>第{val}名</Tag>,
      },
      {
        title: '备注',
        dataIndex: 'remark',
        key: 'remark',
        render: (text: string, t: TrainingResultTraineeRecord) => {
          if (t.compositeScore < 60) return <Text type="danger">不合格</Text>
          return text || '-'
        },
      },
    ]

    return (
      <Table
        columns={innerColumns}
        dataSource={record.trainees.map((item, index) => ({
          ...item,
          key: `${record.id}-${index}`,
        }))}
        rowKey="key"
        pagination={false}
        size="small"
        bordered
        rowClassName={(t: TrainingResultTraineeRecord) =>
          t.rank === 1 || t.rank === maxRank ? 'highlight-yellow-row' : ''
        }
      />
    )
  }

  return (
    <div>
      {/* 内联样式：第一名和倒数第一名黄色背景 */}
      <style>{`
        .highlight-yellow-row td {
          background-color: #fffbe6 !important;
        }
      `}</style>

      {/* 工具栏 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                新增成绩汇总
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={() =>
                  void loadData({
                    campus: selectedCampus,
                    department: selectedDepartment,
                    search: searchText.trim() || undefined,
                  })
                }
              >
                刷新
              </Button>
            </Space>
          </Col>
          <Col>
            <Space wrap>
              <Select
                allowClear
                showSearch
                placeholder="筛选神殿"
                style={{ width: 180 }}
                optionFilterProp="label"
                options={campusOptions}
                value={selectedCampus}
                onChange={(value) => {
                  setCurrentPage(1)
                  setSelectedCampus(value)
                }}
              />
              <Select
                allowClear
                showSearch
                placeholder="筛选部门"
                style={{ width: 180 }}
                optionFilterProp="label"
                options={departmentOptions}
                value={selectedDepartment}
                onChange={(value) => {
                  setCurrentPage(1)
                  setSelectedDepartment(value)
                }}
              />
              <Input
                placeholder="搜索神殿/部门/姓名..."
                prefix={<SearchOutlined />}
                allowClear
                style={{ width: 260 }}
                value={searchText}
                onChange={(e) => {
                  setCurrentPage(1)
                  setSearchText(e.target.value)
                }}
              />
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 列表 */}
      <Card>
        <Table
          loading={loading}
          columns={columns}
          dataSource={data}
          rowKey="id"
          bordered
          size="middle"
          pagination={{
            current: currentPage,
            pageSize,
            total,
            showSizeChanger: true,
            onChange: (page, size) => {
              setCurrentPage(page)
              setPageSize(size)
            },
          }}
          scroll={{ x: 1300 }}
          expandable={{
            expandedRowRender,
            rowExpandable: (r) => r.trainees.length > 0,
          }}
        />
      </Card>

      {/* 编辑弹窗 */}
      <ResultEditModal
        open={editModalOpen}
        loading={submitting}
        campusOptions={campusOptions}
        departmentOptions={departmentOptions}
        defaultCampus={currentCampus || user?.campus || undefined}
        defaultDepartment={user?.department || undefined}
        editingRecord={editingRecord}
        onCancel={() => {
          if (submitting) return
          setEditModalOpen(false)
          setEditingRecord(null)
        }}
        onOk={handleSave}
      />

      {/* 打印预览 */}
      <ResultPreviewModal
        open={!!previewRecord}
        record={previewRecord}
        onCancel={() => setPreviewRecord(null)}
      />
    </div>
  )
}

export default TrainingResults