/**
 * 培训满意度调查 - TAB2
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
  Space,
  Typography,
  Popconfirm,
  Tag,
  Tooltip,
  Row,
  Col,
  Radio,
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
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import { useAuthStore } from '@/stores/authStore'
import { fetchEmployeeDepartments } from '@/services/configMaster'
import {
  createTrainingSatisfactionSurvey,
  deleteTrainingSatisfactionSurvey,
  listTrainingSatisfactionSurveysPaged,
  updateTrainingSatisfactionSurvey,
  type TrainingSatisfactionPayload,
  type TrainingSatisfactionRecord,
  type TrainingSatisfactionScoreLevel,
} from '@/services/humanresources/trainingSatisfaction'

const { Title, Text } = Typography
const { TextArea } = Input

interface ScoreItem {
  key: string
  no: number
  text: string
  section: '课程内容' | '培训师' | '培训方式'
}

type SurveyScoreLevel = Exclude<TrainingSatisfactionScoreLevel, 0>

interface SectionDef {
  title: string
  label: ScoreItem['section']
  keys: string[]
  maxScore: number
  pointMap: Record<SurveyScoreLevel, number>
}

const SCORE_ITEMS: ScoreItem[] = [
  { key: 'q1', no: 1, text: '课程适合我的工作和个人发展需要；', section: '课程内容' },
  { key: 'q2', no: 2, text: '课程内容深度适中，易于理解；', section: '课程内容' },
  { key: 'q3', no: 3, text: '课程内容切合实际、便于应用；', section: '课程内容' },
  { key: 'q4', no: 4, text: '课程内容符合我工作岗位上的技能操作', section: '课程内容' },
  { key: 'q5', no: 5, text: '课程内容让我提升对安全意识的理解与防范', section: '课程内容' },
  {
    key: 'q6',
    no: 6,
    text: '仪表标准、品行端正，形象良好，语言表达能力清晰；',
    section: '培训师',
  },
  { key: 'q7', no: 7, text: '对课程培训充分讲解让学员更能容易用接受；', section: '培训师' },
  { key: 'q8', no: 8, text: '表达内容清晰、易于理解与接受，讲师态度友善；', section: '培训师' },
  { key: 'q9', no: 9, text: '对培训内容有独特精辟见解；', section: '培训师' },
  { key: 'q10', no: 10, text: '课堂气氛良好有吸引力；', section: '培训师' },
  { key: 'q11', no: 11, text: '案例讲解与数据分析适用易懂；', section: '培训师' },
  {
    key: 'q12',
    no: 12,
    text: '运用课程内容方法和培训工具，讲授培训课程，实现培训目标；',
    section: '培训师',
  },
  {
    key: 'q13',
    no: 13,
    text: '将培训内容结合到实际工作中，提升班组效益及团队合作精神；',
    section: '培训师',
  },
  {
    key: 'q14',
    no: 14,
    text: '培训方式：态度和动机在内的成果，技能获得与学习及工作中应用，内容生动多样，鼓励参与；',
    section: '培训方式',
  },
]

const SCORE_LEVELS: SurveyScoreLevel[] = [5, 4, 3, 2, 1]

const SCORE_LEVEL_LABELS: Record<SurveyScoreLevel, string> = {
  5: '很满意',
  4: '满意',
  3: '一般',
  2: '差',
  1: '很差',
}

const SECTION_DEFS: SectionDef[] = [
  {
    title: '一、课程内容',
    label: '课程内容',
    keys: ['q1', 'q2', 'q3', 'q4', 'q5'],
    maxScore: 40,
    pointMap: { 5: 8, 4: 6, 3: 4, 2: 2, 1: 0 },
  },
  {
    title: '二、培训师',
    label: '培训师',
    keys: ['q6', 'q7', 'q8', 'q9', 'q10', 'q11', 'q12', 'q13'],
    maxScore: 56,
    pointMap: { 5: 7, 4: 5, 3: 3, 2: 1, 1: 0 },
  },
  {
    title: '三、培训方式',
    label: '培训方式',
    keys: ['q14'],
    maxScore: 4,
    pointMap: { 5: 4, 4: 3, 3: 2, 2: 1, 1: 0 },
  },
]

const SECTION_BY_KEY = Object.fromEntries(
  SECTION_DEFS.flatMap((section) => section.keys.map((key) => [key, section])),
) as Record<string, SectionDef>

const getWeightedScore = (key: string, level?: number | null) => {
  if (!level) {
    return 0
  }
  const section = SECTION_BY_KEY[key]
  return section?.pointMap[level as SurveyScoreLevel] ?? 0
}

const getSectionTotal = (scores: Record<string, number | undefined>, keys: string[]) =>
  keys.reduce((sum, key) => sum + getWeightedScore(key, scores[key]), 0)

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

const isPendingSurveyRecord = (record: TrainingSatisfactionRecord) => record.totalScore === 0

type SurveyEditModalProps = {
  open: boolean
  loading: boolean
  departmentOptions: Array<{ label: string; value: string }>
  defaultDepartment?: string | null
  editingRecord: TrainingSatisfactionRecord | null
  onCancel: () => void
  onOk: (payload: TrainingSatisfactionPayload) => Promise<void>
}

const SurveyEditModal: React.FC<SurveyEditModalProps> = ({
  open,
  loading,
  departmentOptions,
  defaultDepartment,
  editingRecord,
  onCancel,
  onOk,
}) => {
  const [form] = Form.useForm()
  const isEdit = !!editingRecord
  const [, forceRender] = useState(0)

  useEffect(() => {
    if (!open) {
      return
    }

    if (editingRecord) {
      form.setFieldsValue({
        department: editingRecord.department,
        trainingDate: editingRecord.trainingDate ? dayjs(editingRecord.trainingDate) : undefined,
        trainingLocation: editingRecord.trainingLocation,
        courseContent: editingRecord.courseContent,
        trainer: editingRecord.trainer,
        ...editingRecord.scores,
        openQ4: editingRecord.openQ4,
        openQ5: editingRecord.openQ5,
        openQ6: editingRecord.openQ6,
        remark: editingRecord.remark || undefined,
      })
      return
    }

    form.resetFields()
    form.setFieldsValue({
      department: defaultDepartment || undefined,
    })
  }, [defaultDepartment, editingRecord, form, open])

  const getSectionSum = (keys: string[]) => {
    const values = form.getFieldsValue(keys)
    return getSectionTotal(values, keys)
  }

  const handleOk = async () => {
    const values = await form.validateFields()
    const scores: Record<string, TrainingSatisfactionScoreLevel> = {} as Record<
      string,
      TrainingSatisfactionScoreLevel
    >
    SCORE_ITEMS.forEach((item) => {
      scores[item.key] = values[item.key]
    })

    await onOk({
      department: values.department,
      trainingDate: values.trainingDate.format('YYYY-MM-DD'),
      trainingLocation: values.trainingLocation,
      courseContent: values.courseContent,
      trainer: values.trainer,
      scores,
      openQ4: values.openQ4 || undefined,
      openQ5: values.openQ5 || undefined,
      openQ6: values.openQ6 || undefined,
      remark: values.remark || undefined,
    })
  }

  return (
    <Modal
      title={isEdit ? '编辑培训满意度调查' : '新增培训满意度调查'}
      open={open}
      onCancel={onCancel}
      onOk={() => void handleOk()}
      okText="保存"
      cancelText="取消"
      confirmLoading={loading}
      width={900}
      destroyOnClose
      styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
    >
      <Form form={form} layout="vertical" onValuesChange={() => forceRender((count) => count + 1)}>
        <Card size="small" title="基本信息" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={8}>
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
            <Col span={8}>
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
            <Col span={8}>
              <Form.Item
                name="trainingLocation"
                label="培训地点"
                rules={[{ required: true, message: '请填写培训地点' }]}
              >
                <Input placeholder="请填写培训地点" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="courseContent"
                label="课程内容"
                rules={[{ required: true, message: '请填写课程内容' }]}
              >
                <Input placeholder="请填写课程内容" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="trainer"
                label="培训讲师"
                rules={[{ required: true, message: '请填写培训讲师' }]}
              >
                <Input placeholder="请填写培训讲师" />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {SECTION_DEFS.map((section) => {
          const items = SCORE_ITEMS.filter((item) => section.keys.includes(item.key))
          const sectionSum = getSectionSum(section.keys)

          return (
            <Card
              key={section.title}
              size="small"
              title={section.title}
              extra={
                <Text strong>
                  合计：
                  <Text type="danger" style={{ fontSize: 16 }}>
                    {sectionSum}
                  </Text>
                  {' / '}
                  {section.maxScore}{' '}
                  分
                </Text>
              }
              style={{ marginBottom: 16 }}
            >
              <div style={{ marginBottom: 8 }}>
                <Space size="large">
                  {SCORE_LEVELS.map((level) => (
                    <Text key={level} type="secondary">
                      {SCORE_LEVEL_LABELS[level]} {section.pointMap[level]}分
                    </Text>
                  ))}
                </Space>
              </div>
              {items.map((item) => (
                <Form.Item
                  key={item.key}
                  name={item.key}
                  label={`${item.no}. ${item.text}`}
                  rules={[{ required: true, message: '请选择评分' }]}
                >
                  <Radio.Group>
                    {SCORE_LEVELS.map((level) => (
                      <Radio key={level} value={level}>
                        {SCORE_LEVEL_LABELS[level]}({section.pointMap[level]}分)
                      </Radio>
                    ))}
                  </Radio.Group>
                </Form.Item>
              ))}
            </Card>
          )
        })}

        <Card size="small" title="开放性问题" style={{ marginBottom: 16 }}>
          <Form.Item
            name="openQ4"
            label="四、在本次的培训中，您最大的收获是什么？哪些地方您觉得是您需要改善的？"
          >
            <TextArea rows={3} placeholder="请填写" />
          </Form.Item>
          <Form.Item name="openQ5" label="五、您希望多久接受一次公司的培训？">
            <Input placeholder="请填写" />
          </Form.Item>
          <Form.Item
            name="openQ6"
            label="六、您对当前培训工作有何改进建议？（如：培训内容、规模、时间、安排、频率、方式等）"
          >
            <TextArea rows={3} placeholder="请填写" />
          </Form.Item>
        </Card>

        <Form.Item name="remark" label="备注">
          <TextArea rows={2} placeholder="可选备注" />
        </Form.Item>
      </Form>
    </Modal>
  )
}

type SurveyPreviewModalProps = {
  open: boolean
  record: TrainingSatisfactionRecord | null
  onCancel: () => void
}

const SurveyPreviewModal: React.FC<SurveyPreviewModalProps> = ({ open, record, onCancel }) => {
  if (!record) return null

  const handlePrint = () => {
    window.print()
  }

  const renderSectionRows = (section: SectionDef) =>
    SCORE_ITEMS.filter((item) => section.keys.includes(item.key)).map((item) => {
      const score = record.scores[item.key]
      return (
        <tr key={item.key}>
          <td
            style={{
              padding: '8px 12px',
              borderBottom: '1px solid #e8e8e8',
              textAlign: 'left',
            }}
          >
            {item.no}. {item.text}
          </td>
          {SCORE_LEVELS.map((value) => (
            <td
              key={value}
              style={{
                padding: '8px',
                borderBottom: '1px solid #e8e8e8',
                textAlign: 'center',
                width: 70,
              }}
            >
              {score === value ? '■' : '□'}
            </td>
          ))}
        </tr>
      )
    })

  const renderSubtotalRow = (total: number, maxScore: number) => (
    <tr style={{ background: '#fafafa' }}>
      <td
        style={{
          padding: '8px 12px',
          borderBottom: '1px solid #e8e8e8',
          textAlign: 'right',
          fontWeight: 'bold',
        }}
      >
        合计
      </td>
      <td
        colSpan={5}
        style={{
          padding: '8px 12px',
          borderBottom: '1px solid #e8e8e8',
          textAlign: 'right',
          fontWeight: 'bold',
        }}
      >
        {total} / {maxScore} 分
      </td>
    </tr>
  )

  const renderSectionTable = (section: SectionDef, total: number) => (
    <table
      key={section.title}
      style={{
        width: '100%',
        borderCollapse: 'collapse',
        border: '1px solid #d9d9d9',
        marginBottom: 16,
      }}
    >
      <thead>
        <tr style={{ background: '#e6f7ff' }}>
          <th
            colSpan={6}
            style={{
              padding: '8px 12px',
              fontWeight: 'bold',
              borderBottom: '1px solid #d9d9d9',
              textAlign: 'left',
            }}
          >
            {section.title}
          </th>
        </tr>
        <tr style={{ background: '#fafafa' }}>
          <th
            style={{
              padding: '8px 12px',
              borderBottom: '2px solid #d9d9d9',
              textAlign: 'left',
            }}
          />
          {SCORE_LEVELS.map((level) => (
            <th
              key={level}
              style={{
                padding: '8px',
                borderBottom: '2px solid #d9d9d9',
                textAlign: 'center',
                width: 70,
              }}
            >
              {SCORE_LEVEL_LABELS[level]}
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                {section.pointMap[level]}分
              </Text>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {renderSectionRows(section)}
        {renderSubtotalRow(total, section.maxScore)}
      </tbody>
    </table>
  )

  return (
    <Modal
      title="打印预览 - 培训满意度调查"
      open={open}
      onCancel={onCancel}
      width={900}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          关闭
        </Button>,
        <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>
          打印
        </Button>,
      ]}
    >
      <div className="print-area" style={{ padding: '0 16px' }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <Title level={3} style={{ margin: 0 }}>
            培训满意度调查
          </Title>
        </div>

        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            marginBottom: 16,
          }}
        >
          <tbody>
            <tr>
              <td style={{ padding: '6px 0', width: '33%' }}>
                <Text strong>部门：</Text> {record.department}
              </td>
              <td style={{ padding: '6px 0', width: '33%' }}>
                <Text strong>培训日期：</Text> {record.trainingDate}
              </td>
              <td style={{ padding: '6px 0', width: '34%' }}>
                <Text strong>培训地点：</Text> {record.trainingLocation}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '6px 0' }}>
                <Text strong>课程内容：</Text> {record.courseContent}
              </td>
              <td style={{ padding: '6px 0' }}>
                <Text strong>培训讲师：</Text> {record.trainer}
              </td>
              <td style={{ padding: '6px 0' }}>
                <Text strong>分数：</Text>{' '}
                <Text type="danger" strong>
                  {record.totalScore} / 100
                </Text>
              </td>
            </tr>
          </tbody>
        </table>

        {renderSectionTable(SECTION_DEFS[0], record.sectionTotals.courseContent)}
        {renderSectionTable(SECTION_DEFS[1], record.sectionTotals.trainer)}
        {renderSectionTable(SECTION_DEFS[2], record.sectionTotals.trainingMethod)}

        <div style={{ marginTop: 20 }}>
          <div style={{ marginBottom: 16 }}>
            <Text strong>
              四、在本次的培训中，您最大的收获是什么？哪些地方您觉得是您需要改善的？
            </Text>
            <div
              style={{
                marginTop: 6,
                padding: '8px 12px',
                minHeight: 60,
                border: '1px solid #d9d9d9',
                borderRadius: 4,
                background: '#fafafa',
                whiteSpace: 'pre-wrap',
              }}
            >
              {record.openQ4 || '（未填写）'}
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <Text strong>五、您希望多久接受一次公司的培训？</Text>
            <div
              style={{
                marginTop: 6,
                padding: '8px 12px',
                minHeight: 40,
                border: '1px solid #d9d9d9',
                borderRadius: 4,
                background: '#fafafa',
              }}
            >
              {record.openQ5 || '（未填写）'}
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <Text strong>
              六、您对当前培训工作有何改进建议？（如：培训内容、规模、时间、安排、频率、方式等）
            </Text>
            <div
              style={{
                marginTop: 6,
                padding: '8px 12px',
                minHeight: 60,
                border: '1px solid #d9d9d9',
                borderRadius: 4,
                background: '#fafafa',
                whiteSpace: 'pre-wrap',
              }}
            >
              {record.openQ6 || '（未填写）'}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}

type TrainingSatisfactionProps = {
  syncVersion?: number
}

const TrainingSatisfaction: React.FC<TrainingSatisfactionProps> = ({ syncVersion = 0 }) => {
  const user = useAuthStore((state) => state.user)
  const [data, setData] = useState<TrainingSatisfactionRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<TrainingSatisfactionRecord | null>(null)
  const [previewRecord, setPreviewRecord] = useState<TrainingSatisfactionRecord | null>(null)
  const [searchText, setSearchText] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [departmentOptions, setDepartmentOptions] = useState<Array<{ label: string; value: string }>>([])

  const loadData = async (params?: { page?: number; pageSize?: number; search?: string }) => {
    setLoading(true)
    try {
      const records = await listTrainingSatisfactionSurveysPaged({
        search: params?.search ?? (searchText.trim() || undefined),
        page: params?.page ?? currentPage,
        pageSize: params?.pageSize ?? pageSize,
      })
      setData(records.items)
      setTotal(records.total)
    } catch (error) {
      message.error(getErrorMessage(error, '加载培训满意度调查失败'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [currentPage, pageSize, searchText, syncVersion])

  useEffect(() => {
    let active = true

    fetchEmployeeDepartments()
      .then((departments) => {
        if (!active) return
        setDepartmentOptions(
          departments.map((department) => ({
            label: department,
            value: department,
          })),
        )
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

  const handleAdd = () => {
    setEditingRecord(null)
    setEditModalOpen(true)
  }

  const handleEdit = (record: TrainingSatisfactionRecord) => {
    setEditingRecord(record)
    setEditModalOpen(true)
  }

  const handleSave = async (payload: TrainingSatisfactionPayload) => {
    setSubmitting(true)
    try {
      const savedRecord = editingRecord
        ? await updateTrainingSatisfactionSurvey(editingRecord.id, payload)
        : await createTrainingSatisfactionSurvey(payload)
      void savedRecord
      setEditModalOpen(false)
      setEditingRecord(null)
      if (!editingRecord && currentPage !== 1) {
        setCurrentPage(1)
      } else {
        await loadData()
      }
      message.success(editingRecord ? '编辑成功' : '新增成功')
    } catch (error) {
      message.error(getErrorMessage(error, editingRecord ? '编辑失败' : '新增失败'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteTrainingSatisfactionSurvey(id)
      if (previewRecord?.id === id) {
        setPreviewRecord(null)
      }
      await loadData()
      message.success('删除成功')
    } catch (error) {
      message.error(getErrorMessage(error, '删除失败'))
    }
  }

  const columns: ColumnsType<TrainingSatisfactionRecord> = [
    {
      title: '部门',
      dataIndex: 'department',
      key: 'department',
      width: 130,
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
      align: 'center',
      render: (_: unknown, record: TrainingSatisfactionRecord) => (
        <Tag color={isPendingSurveyRecord(record) ? 'orange' : 'green'}>
          {isPendingSurveyRecord(record) ? '待填写' : '已填写'}
        </Tag>
      ),
    },
    {
      title: '课程内容',
      dataIndex: 'courseContent',
      key: 'courseContent',
      width: 170,
      ellipsis: true,
    },
    {
      title: '培训讲师',
      dataIndex: 'trainer',
      key: 'trainer',
      width: 110,
    },
    {
      title: '培训地点',
      dataIndex: 'trainingLocation',
      key: 'trainingLocation',
      width: 140,
      ellipsis: true,
    },
    {
      title: '课程内容得分(40分)',
      dataIndex: ['sectionTotals', 'courseContent'],
      key: 'courseContentScore',
      width: 110,
      align: 'center',
      render: (value: number) => (
        <Text strong style={{ color: '#1677ff' }}>
          {value}
        </Text>
      ),
      sorter: (a, b) => a.sectionTotals.courseContent - b.sectionTotals.courseContent,
    },
    {
      title: '培训师得分(56分)',
      dataIndex: ['sectionTotals', 'trainer'],
      key: 'trainerScore',
      width: 100,
      align: 'center',
      render: (value: number) => (
        <Text strong style={{ color: '#13c2c2' }}>
          {value}
        </Text>
      ),
      sorter: (a, b) => a.sectionTotals.trainer - b.sectionTotals.trainer,
    },
    {
      title: '培训方式得分(4分)',
      dataIndex: ['sectionTotals', 'trainingMethod'],
      key: 'methodScore',
      width: 110,
      align: 'center',
      render: (value: number) => (
        <Text strong style={{ color: '#52c41a' }}>
          {value}
        </Text>
      ),
      sorter: (a, b) => a.sectionTotals.trainingMethod - b.sectionTotals.trainingMethod,
    },
    {
      title: '总分(100分)',
      dataIndex: 'totalScore',
      key: 'totalScore',
      width: 90,
      align: 'center',
      render: (value: number) => (
        <Text strong type="danger">
          {value}
        </Text>
      ),
      sorter: (a, b) => a.totalScore - b.totalScore,
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: unknown, record) => (
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
            title="确认删除该调查记录?"
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

  return (
    <div>
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                新增满意度调查
              </Button>
              <Button icon={<ReloadOutlined />} onClick={() => void loadData()}>
                刷新
              </Button>
            </Space>
          </Col>
          <Col>
            <Input
              placeholder="搜索部门/课程/讲师..."
              prefix={<SearchOutlined />}
              allowClear
              style={{ width: 260 }}
              value={searchText}
              onChange={(event) => {
                setCurrentPage(1)
                setSearchText(event.target.value)
              }}
            />
          </Col>
        </Row>
      </Card>

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
          scroll={{ x: 1400 }}
        />
      </Card>

      <SurveyEditModal
        open={editModalOpen}
        loading={submitting}
        departmentOptions={departmentOptions}
        defaultDepartment={user?.department || undefined}
        editingRecord={editingRecord}
        onCancel={() => {
          if (submitting) return
          setEditModalOpen(false)
          setEditingRecord(null)
        }}
        onOk={handleSave}
      />

      <SurveyPreviewModal
        open={!!previewRecord}
        record={previewRecord}
        onCancel={() => setPreviewRecord(null)}
      />
    </div>
  )
}

export default TrainingSatisfaction