/**
 * 神殿教化司提升升学页面
 * 包含标签栏：升学计划表、升学访谈表
 */

import React, { useState, useMemo } from 'react'
import { App,
  Card,
  Table,
  Button,
  Space,
  Input,
  Modal,
  Form,
  DatePicker,
  Select,
  Popconfirm,
  Tabs,
} from 'antd'
import {
  ReloadOutlined,
  DownloadOutlined,
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  RiseOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useCampusStore } from '@/stores/campusStore'
import dayjs, { Dayjs } from 'dayjs'

const { Option } = Select
const { TextArea } = Input

// 提升升学计划记录接口
interface PromotionEducationRecord {
  key: string
  date: string // 日期
  dayOfWeek: string // 星期
  coreTask: '活动' | '访谈' | '班会' // 核心任务
  specificOperation: string // 具体操作和说明
  location: string // 实施地点
  implementer: string // 实施者
  deliverables: string // 交付内容
  supervisor: string // 监督人
  completionStatus: '已完成' | '进行中' | '未开始' // 完成情况
}

// 升学访谈记录接口
interface PromotionInterviewRecord {
  key: string
  serialNumber: number // 序号
  studentName: string // 姓名
  interviewContent: string // 访谈内容
  resistancePoints: string // 抗拒点
  isClearAdmission: '是' | '否' | '待定' // 是否明确升学
}

// 模拟数据
const mockData: PromotionEducationRecord[] = [
  {
    key: '1',
    date: '2024-01-15',
    dayOfWeek: '星期一',
    coreTask: '活动',
    specificOperation: '春季招生宣传讲座',
    location: '神殿礼堂',
    implementer: '张老师',
    deliverables: '吸引50名潜在学员',
    supervisor: '李主任',
    completionStatus: '已完成',
  },
  {
    key: '2',
    date: '2024-01-16',
    dayOfWeek: '星期二',
    coreTask: '访谈',
    specificOperation: '与潜在学员进行一对一咨询',
    location: '咨询室',
    implementer: '王老师',
    deliverables: '完成10名学员咨询记录',
    supervisor: '李主任',
    completionStatus: '进行中',
  },
  {
    key: '3',
    date: '2024-01-17',
    dayOfWeek: '星期三',
    coreTask: '班会',
    specificOperation: '组织班级座谈会，讨论升学计划',
    location: '教室',
    implementer: '赵老师',
    deliverables: '完成座谈会记录',
    supervisor: '李主任',
    completionStatus: '未开始',
  },
]

const mockInterviewData: PromotionInterviewRecord[] = [
  {
    key: '1',
    serialNumber: 1,
    studentName: '张三',
    interviewContent: '了解学员对升学计划的看法和期望，学员表示愿意继续升学深造',
    resistancePoints: '担心学费问题',
    isClearAdmission: '是',
  },
  {
    key: '2',
    serialNumber: 2,
    studentName: '李四',
    interviewContent: '与家长沟通学员升学意向和家庭支持情况，家长支持学员继续升学',
    resistancePoints: '时间安排有冲突',
    isClearAdmission: '待定',
  },
  {
    key: '3',
    serialNumber: 3,
    studentName: '王五',
    interviewContent: '了解毕业生升学情况和就业意向，毕业生计划继续深造',
    resistancePoints: '暂无',
    isClearAdmission: '是',
  },
  {
    key: '4',
    serialNumber: 4,
    studentName: '赵六',
    interviewContent: '学员对升学计划感兴趣，但需要进一步了解课程内容',
    resistancePoints: '对课程内容不够了解',
    isClearAdmission: '否',
  },
  {
    key: '5',
    serialNumber: 5,
    studentName: '孙七',
    interviewContent: '家长表示需要考虑家庭经济状况，暂时无法确定',
    resistancePoints: '经济压力较大',
    isClearAdmission: '待定',
  },
]

const CampusPromotionEducationPage: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore()
  const [activeTab, setActiveTab] = useState<string>('plan')

  // 升学计划表相关状态
  const [planDataSource, setPlanDataSource] = useState<PromotionEducationRecord[]>(mockData)
  const [planSearchText, setPlanSearchText] = useState('')
  const [planModalVisible, setPlanModalVisible] = useState(false)
  const [planEditingRecord, setPlanEditingRecord] = useState<PromotionEducationRecord | null>(null)
  const [planForm] = Form.useForm()

  // 升学访谈表相关状态
  const [interviewDataSource, setInterviewDataSource] =
    useState<PromotionInterviewRecord[]>(mockInterviewData)
  const [interviewSearchText, setInterviewSearchText] = useState('')
  const [interviewModalVisible, setInterviewModalVisible] = useState(false)
  const [interviewEditingRecord, setInterviewEditingRecord] =
    useState<PromotionInterviewRecord | null>(null)
  const [interviewForm] = Form.useForm()

  // 根据日期获取星期
  const getDayOfWeek = (date: Dayjs | null): string => {
    if (!date) return ''
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
    return weekdays[date.day()]
  }

  // ========== 升学计划表相关函数 ==========
  const planFilteredData = useMemo(() => {
    if (!planSearchText) return planDataSource
    return planDataSource.filter((item) =>
      Object.values(item).some((value) =>
        String(value).toLowerCase().includes(planSearchText.toLowerCase()),
      ),
    )
  }, [planDataSource, planSearchText])

  const getCoreTaskRowSpan = (record: PromotionEducationRecord, index: number) => {
    const sameCategoryRecords = planDataSource.filter((item) => item.coreTask === record.coreTask)
    const firstIndex = planDataSource.findIndex((item) => item.coreTask === record.coreTask)

    if (index === firstIndex) {
      return sameCategoryRecords.length
    }
    return 0
  }

  const planColumns: ColumnsType<PromotionEducationRecord> = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      align: 'center',
    },
    {
      title: '星期',
      dataIndex: 'dayOfWeek',
      key: 'dayOfWeek',
      width: 100,
      align: 'center',
    },
    {
      title: '核心任务 (what)',
      dataIndex: 'coreTask',
      key: 'coreTask',
      width: 120,
      align: 'center',
      render: (text: string, record: PromotionEducationRecord, index: number) => {
        const rowSpan = getCoreTaskRowSpan(record, planDataSource.indexOf(record))
        return {
          children: text,
          props: {
            rowSpan: rowSpan,
          },
        }
      },
    },
    {
      title: '具体操作和说明 (how)',
      dataIndex: 'specificOperation',
      key: 'specificOperation',
      width: 250,
      align: 'left',
    },
    {
      title: '实施地点',
      dataIndex: 'location',
      key: 'location',
      width: 150,
      align: 'center',
    },
    {
      title: '实施者 (who)',
      dataIndex: 'implementer',
      key: 'implementer',
      width: 120,
      align: 'center',
    },
    {
      title: '交付内容',
      dataIndex: 'deliverables',
      key: 'deliverables',
      width: 200,
      align: 'left',
    },
    {
      title: '监督人',
      dataIndex: 'supervisor',
      key: 'supervisor',
      width: 120,
      align: 'center',
    },
    {
      title: '完成情况',
      dataIndex: 'completionStatus',
      key: 'completionStatus',
      width: 120,
      align: 'center',
      render: (text: string) => {
        let color = '#999'
        if (text === '已完成') color = '#52c41a'
        else if (text === '进行中') color = '#1890ff'
        else if (text === '未开始') color = '#faad14'
        return <span style={{ color }}>{text}</span>
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      align: 'center',
      fixed: 'right',
      render: (_: any, record: PromotionEducationRecord) => (
        <Space size="small">
          <Button type="link" icon={<EditOutlined />} onClick={() => handlePlanEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这条记录吗？"
            onConfirm={() => handlePlanDelete(record.key)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const handlePlanAdd = () => {
    setPlanEditingRecord(null)
    planForm.resetFields()
    setPlanModalVisible(true)
  }

  const handlePlanEdit = (record: PromotionEducationRecord) => {
    setPlanEditingRecord(record)
    planForm.setFieldsValue({
      date: record.date ? dayjs(record.date) : null,
      dayOfWeek: record.dayOfWeek,
      coreTask: record.coreTask,
      specificOperation: record.specificOperation,
      location: record.location,
      implementer: record.implementer,
      deliverables: record.deliverables,
      supervisor: record.supervisor,
      completionStatus: record.completionStatus,
    })
    setPlanModalVisible(true)
  }

  const handlePlanDelete = (key: string) => {
    setPlanDataSource(planDataSource.filter((item) => item.key !== key))
    message.success('删除成功')
  }

  const handlePlanSave = async () => {
    try {
      const values = await planForm.validateFields()
      const dateValue = values.date as Dayjs

      const newRecord: PromotionEducationRecord = {
        key: planEditingRecord?.key || Date.now().toString(),
        date: dateValue ? dateValue.format('YYYY-MM-DD') : '',
        dayOfWeek: values.dayOfWeek || getDayOfWeek(dateValue),
        coreTask: values.coreTask,
        specificOperation: values.specificOperation || '',
        location: values.location || '',
        implementer: values.implementer || '',
        deliverables: values.deliverables || '',
        supervisor: values.supervisor || '',
        completionStatus: values.completionStatus || '未开始',
      }

      if (planEditingRecord) {
        setPlanDataSource(
          planDataSource.map((item) => (item.key === planEditingRecord.key ? newRecord : item)),
        )
        message.success('更新成功')
      } else {
        setPlanDataSource([...planDataSource, newRecord])
        message.success('新增成功')
      }

      setPlanModalVisible(false)
      planForm.resetFields()
      setPlanEditingRecord(null)
    } catch (error) {
      console.error('验证失败:', error)
    }
  }

  // ========== 升学访谈表相关函数 ==========
  const interviewFilteredData = useMemo(() => {
    if (!interviewSearchText) return interviewDataSource
    return interviewDataSource.filter((item) =>
      Object.values(item).some((value) =>
        String(value).toLowerCase().includes(interviewSearchText.toLowerCase()),
      ),
    )
  }, [interviewDataSource, interviewSearchText])

  const interviewColumns: ColumnsType<PromotionInterviewRecord> = [
    {
      title: '序号',
      dataIndex: 'serialNumber',
      key: 'serialNumber',
      width: 80,
      align: 'center',
    },
    {
      title: '姓名',
      dataIndex: 'studentName',
      key: 'studentName',
      width: 120,
      align: 'center',
    },
    {
      title: '访谈内容',
      dataIndex: 'interviewContent',
      key: 'interviewContent',
      width: 400,
      align: 'left',
    },
    {
      title: '抗拒点',
      dataIndex: 'resistancePoints',
      key: 'resistancePoints',
      width: 200,
      align: 'left',
    },
    {
      title: '是否明确升学',
      dataIndex: 'isClearAdmission',
      key: 'isClearAdmission',
      width: 150,
      align: 'center',
      render: (text: string) => {
        let color = '#999'
        if (text === '是') color = '#52c41a'
        else if (text === '否') color = '#ff4d4f'
        else if (text === '待定') color = '#faad14'
        return <span style={{ color, fontWeight: 'bold' }}>{text}</span>
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      align: 'center',
      fixed: 'right',
      render: (_: any, record: PromotionInterviewRecord) => (
        <Space size="small">
          <Button type="link" icon={<EditOutlined />} onClick={() => handleInterviewEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这条记录吗？"
            onConfirm={() => handleInterviewDelete(record.key)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const handleInterviewAdd = () => {
    setInterviewEditingRecord(null)
    interviewForm.resetFields()
    setInterviewModalVisible(true)
  }

  const handleInterviewEdit = (record: PromotionInterviewRecord) => {
    setInterviewEditingRecord(record)
    interviewForm.setFieldsValue({
      serialNumber: record.serialNumber,
      studentName: record.studentName,
      interviewContent: record.interviewContent,
      resistancePoints: record.resistancePoints,
      isClearAdmission: record.isClearAdmission,
    })
    setInterviewModalVisible(true)
  }

  const handleInterviewDelete = (key: string) => {
    setInterviewDataSource(interviewDataSource.filter((item) => item.key !== key))
    message.success('删除成功')
  }

  const handleInterviewSave = async () => {
    try {
      const values = await interviewForm.validateFields()

      // 如果没有指定序号，自动生成
      let serialNumber = values.serialNumber
      if (!serialNumber) {
        const maxSerialNumber =
          interviewDataSource.length > 0
            ? Math.max(...interviewDataSource.map((item) => item.serialNumber))
            : 0
        serialNumber = maxSerialNumber + 1
      }

      const newRecord: PromotionInterviewRecord = {
        key: interviewEditingRecord?.key || Date.now().toString(),
        serialNumber: serialNumber,
        studentName: values.studentName || '',
        interviewContent: values.interviewContent || '',
        resistancePoints: values.resistancePoints || '',
        isClearAdmission: values.isClearAdmission || '待定',
      }

      if (interviewEditingRecord) {
        setInterviewDataSource(
          interviewDataSource.map((item) =>
            item.key === interviewEditingRecord.key ? newRecord : item,
          ),
        )
        message.success('更新成功')
      } else {
        setInterviewDataSource([...interviewDataSource, newRecord])
        message.success('新增成功')
      }

      setInterviewModalVisible(false)
      interviewForm.resetFields()
      setInterviewEditingRecord(null)
    } catch (error) {
      console.error('验证失败:', error)
    }
  }

  // 表格头部样式 - 升学计划表使用浅绿色，升学访谈表使用金黄色
  const planTableHeaderStyle = {
    backgroundColor: '#d9f7be',
    fontWeight: 'bold' as const,
    textAlign: 'center' as const,
  }

  const interviewTableHeaderStyle = {
    backgroundColor: '#fffbe6',
    fontWeight: 'bold' as const,
    textAlign: 'center' as const,
  }

  return (
    <div style={{ padding: 24 }}>
      {/* 页面标题 */}
      <div
        style={{
          marginBottom: 24,
          textAlign: 'center',
          fontSize: '20px',
          fontWeight: 'bold',
          padding: '16px',
          backgroundColor: '#fff1f0',
          borderRadius: 4,
          border: '1px solid #ffccc7',
        }}
      >
        <RiseOutlined style={{ marginRight: 8 }} />
        {currentCampus || '神殿'}教化司提升升学
      </div>

      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'plan',
              label: '升学计划表',
              children: (
                <div>
                  {/* 操作栏 */}
                  <div
                    style={{
                      marginBottom: 16,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Space>
                      <Input
                        placeholder="搜索日期、核心任务、实施者、监督人等"
                        prefix={<SearchOutlined />}
                        value={planSearchText}
                        onChange={(e) => setPlanSearchText(e.target.value)}
                        style={{ width: 300 }}
                        allowClear
                      />
                    </Space>
                    <Space>
                      <Button icon={<ReloadOutlined />} onClick={() => setPlanSearchText('')}>
                        刷新
                      </Button>
                      <Button
                        icon={<DownloadOutlined />}
                        onClick={() => message.info('导出功能开发中...')}
                      >
                        导出
                      </Button>
                      <Button type="primary" icon={<PlusOutlined />} onClick={handlePlanAdd}>
                        新增记录
                      </Button>
                    </Space>
                  </div>

                  {/* 表格 */}
                  <Table
                    columns={planColumns}
                    dataSource={planFilteredData}
                    pagination={{
                      defaultPageSize: 20,
                      showSizeChanger: true,
                      showTotal: (total) => `共 ${total} 条记录`,
                    }}
                    bordered
                    scroll={{ x: 1500 }}
                    components={{
                      header: {
                        cell: (props: any) => (
                          <th {...props} style={{ ...props.style, ...planTableHeaderStyle }} />
                        ),
                      },
                    }}
                  />
                </div>
              ),
            },
            {
              key: 'interview',
              label: '升学访谈表',
              children: (
                <div>
                  {/* 操作栏 */}
                  <div
                    style={{
                      marginBottom: 16,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Space>
                      <Input
                        placeholder="搜索姓名、访谈内容、抗拒点等"
                        prefix={<SearchOutlined />}
                        value={interviewSearchText}
                        onChange={(e) => setInterviewSearchText(e.target.value)}
                        style={{ width: 300 }}
                        allowClear
                      />
                    </Space>
                    <Space>
                      <Button icon={<ReloadOutlined />} onClick={() => setInterviewSearchText('')}>
                        刷新
                      </Button>
                      <Button
                        icon={<DownloadOutlined />}
                        onClick={() => message.info('导出功能开发中...')}
                      >
                        导出
                      </Button>
                      <Button type="primary" icon={<PlusOutlined />} onClick={handleInterviewAdd}>
                        新增记录
                      </Button>
                    </Space>
                  </div>

                  {/* 表格 */}
                  <Table
                    columns={interviewColumns}
                    dataSource={interviewFilteredData}
                    pagination={{
                      defaultPageSize: 20,
                      showSizeChanger: true,
                      showTotal: (total) => `共 ${total} 条记录`,
                    }}
                    bordered
                    scroll={{ x: 1200 }}
                    components={{
                      header: {
                        cell: (props: any) => (
                          <th {...props} style={{ ...props.style, ...interviewTableHeaderStyle }} />
                        ),
                      },
                    }}
                  />
                </div>
              ),
            },
          ]}
        />
      </Card>

      {/* 升学计划表编辑/新增弹窗 */}
      <Modal
        title={planEditingRecord ? '编辑升学计划记录' : '新增升学计划记录'}
        open={planModalVisible}
        onOk={handlePlanSave}
        onCancel={() => {
          setPlanModalVisible(false)
          planForm.resetFields()
          setPlanEditingRecord(null)
        }}
        width={800}
        okText="保存"
        cancelText="取消"
      >
        <Form form={planForm} layout="vertical">
          <Form.Item name="date" label="日期" rules={[{ required: true, message: '请选择日期' }]}>
            <DatePicker
              style={{ width: '100%' }}
              onChange={(date) => {
                if (date) {
                  planForm.setFieldsValue({ dayOfWeek: getDayOfWeek(date) })
                }
              }}
            />
          </Form.Item>
          <Form.Item name="dayOfWeek" label="星期">
            <Input readOnly />
          </Form.Item>
          <Form.Item
            name="coreTask"
            label="核心任务 (what)"
            rules={[{ required: true, message: '请选择核心任务' }]}
          >
            <Select>
              <Option value="活动">活动</Option>
              <Option value="访谈">访谈</Option>
              <Option value="班会">班会</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="specificOperation"
            label="具体操作和说明 (how)"
            rules={[{ required: true, message: '请输入具体操作和说明' }]}
          >
            <TextArea rows={3} placeholder="请输入具体操作和说明" />
          </Form.Item>
          <Form.Item name="location" label="实施地点">
            <Input placeholder="请输入实施地点" />
          </Form.Item>
          <Form.Item name="implementer" label="实施者 (who)">
            <Input placeholder="请输入实施者" />
          </Form.Item>
          <Form.Item name="deliverables" label="交付内容">
            <TextArea rows={2} placeholder="请输入交付内容" />
          </Form.Item>
          <Form.Item name="supervisor" label="监督人">
            <Input placeholder="请输入监督人" />
          </Form.Item>
          <Form.Item
            name="completionStatus"
            label="完成情况"
            rules={[{ required: true, message: '请选择完成情况' }]}
          >
            <Select>
              <Option value="已完成">已完成</Option>
              <Option value="进行中">进行中</Option>
              <Option value="未开始">未开始</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 升学访谈表编辑/新增弹窗 */}
      <Modal
        title={interviewEditingRecord ? '编辑升学访谈记录' : '新增升学访谈记录'}
        open={interviewModalVisible}
        onOk={handleInterviewSave}
        onCancel={() => {
          setInterviewModalVisible(false)
          interviewForm.resetFields()
          setInterviewEditingRecord(null)
        }}
        width={800}
        okText="保存"
        cancelText="取消"
      >
        <Form form={interviewForm} layout="vertical">
          <Form.Item name="serialNumber" label="序号">
            <Input type="number" placeholder="留空则自动生成" />
          </Form.Item>
          <Form.Item
            name="studentName"
            label="姓名"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="请输入姓名" />
          </Form.Item>
          <Form.Item
            name="interviewContent"
            label="访谈内容"
            rules={[{ required: true, message: '请输入访谈内容' }]}
          >
            <TextArea rows={4} placeholder="请输入访谈内容" />
          </Form.Item>
          <Form.Item name="resistancePoints" label="抗拒点">
            <TextArea rows={3} placeholder="请输入抗拒点" />
          </Form.Item>
          <Form.Item
            name="isClearAdmission"
            label="是否明确升学"
            rules={[{ required: true, message: '请选择是否明确升学' }]}
          >
            <Select>
              <Option value="是">是</Option>
              <Option value="否">否</Option>
              <Option value="待定">待定</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default CampusPromotionEducationPage
