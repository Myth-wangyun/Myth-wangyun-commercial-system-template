/**
 * 就业期计划和监督表页面
 */

import React, { useState } from 'react'
import { App,
  Card,
  Table,
  Button,
  Space,
  Select,
  Input,
  Modal,
  Form,
  DatePicker,
  InputNumber,
  Row,
  Col,
  Descriptions,
  Tabs,
} from 'antd'
import {
  CalendarOutlined,
  ReloadOutlined,
  DownloadOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useCampusStore } from '@/stores/campusStore'
import dayjs, { Dayjs } from 'dayjs'

const { Option } = Select
const { TextArea } = Input

// 定义数据接口
interface EmploymentPeriodPlanRecord {
  key: string
  serialNumber: number // 序号
  date?: string // 日期
  formLocation?: string // 形式/地点
  workContent?: string // 工作内容
  workGoal?: string // 工作目标
  howToDo?: string // 如何做
  actualWorkResult?: string // 实际工作结果
  classTeacher?: string // 班主任
  instructor?: string // 教员
  supervisor?: string // 监督人
  remarks?: string // 备注
}

// 入职计划数据接口
interface OnboardingPlanRecord {
  key: string
  serialNumber: number // 序号
  name: string // 姓名
  gender: string // 性别
  currentAge?: number // 目前年龄
  currentEducation?: string // 现有学历
  expectedEmploymentRegion?: string // 预计就业地区
  targetPosition?: string // 目标岗位
  targetSalary?: number // 目标薪资
  responsibleClassTeacher?: string // 负责班主任
  responsibleInstructor?: string // 负责教员
  dailyProgress?: Record<string, string> // 每天的进度，key是日期（如"1日"）
  weeklySummary1?: string // 第1周总结（10日后）
  weeklySummary2?: string // 第2周总结（17日后）
  weeklySummary3?: string // 第3周总结（24日后）
  weeklySummary4?: string // 第4周总结（31日后）
}

// 模拟数据
const mockData: EmploymentPeriodPlanRecord[] = [
  {
    key: '1',
    serialNumber: 1,
    date: '2024-10-13',
    formLocation: '线上/招聘平台',
    workContent: '发布就业信息，筛选简历',
    workGoal: '收集20份简历',
    howToDo: '在智联招聘、BOSS直聘等平台发布职位信息',
    actualWorkResult: '收集到18份简历',
    classTeacher: '张远平',
    instructor: '何汕',
    supervisor: '李主任',
    remarks: '完成度较好',
  },
  {
    key: '2',
    serialNumber: 2,
    date: '2024-10-15',
    formLocation: '线下/企业走访',
    workContent: '走访合作企业',
    workGoal: '走访3家企业，达成合作意向',
    howToDo: '提前预约，准备企业资料和学生简历',
    actualWorkResult: '走访了3家企业，2家达成合作意向',
    classTeacher: '张远平',
    instructor: '何汕',
    supervisor: '李主任',
    remarks: '进展顺利',
  },
  {
    key: '3',
    serialNumber: 3,
    date: '2024-10-18',
    formLocation: '线上/电话沟通',
    workContent: '电话面试安排',
    workGoal: '安排10个学生电话面试',
    howToDo: '联系企业HR，协调学生时间',
    actualWorkResult: '安排了8个学生电话面试',
    classTeacher: '张远平',
    instructor: '何汕',
    supervisor: '李主任',
    remarks: '部分学生时间冲突',
  },
  {
    key: '4',
    serialNumber: 4,
    date: '2024-10-22',
    formLocation: '线下/现场面试',
    workContent: '组织现场面试',
    workGoal: '5个学生参加现场面试',
    howToDo: '陪同学生前往企业，现场指导',
    actualWorkResult: '5个学生参加面试，3个通过',
    classTeacher: '张远平',
    instructor: '何汕',
    supervisor: '李主任',
    remarks: '面试通过率60%',
  },
  {
    key: '5',
    serialNumber: 5,
    date: '2024-10-25',
    formLocation: '线上/跟进',
    workContent: '面试结果跟进',
    workGoal: '跟进所有面试结果',
    howToDo: '电话联系企业和学生，了解面试情况',
    actualWorkResult: '已跟进所有面试，2个学生收到offer',
    classTeacher: '张远平',
    instructor: '何汕',
    supervisor: '李主任',
    remarks: '需继续跟进其他面试',
  },
]

const CampusEmploymentPeriodPlanPage: React.FC = () => {
  const { message, modal } = App.useApp()
  const { currentCampus, getAllCampuses, setCampus } = useCampusStore()
  const [selectedCampus, setSelectedCampus] = useState<string>(currentCampus || '')
  const [selectedClass, setSelectedClass] = useState<string>('T126班')
  const [activeTab, setActiveTab] = useState<string>('employment-period')
  const [dataSource, setDataSource] = useState<EmploymentPeriodPlanRecord[]>(mockData)
  const [onboardingDataSource, setOnboardingDataSource] = useState<OnboardingPlanRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [isOnboardingModalVisible, setIsOnboardingModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<EmploymentPeriodPlanRecord | null>(null)
  const [editingOnboardingRecord, setEditingOnboardingRecord] =
    useState<OnboardingPlanRecord | null>(null)
  const [form] = Form.useForm()
  const [onboardingForm] = Form.useForm()
  const [searchText, setSearchText] = useState('')
  const [onboardingSearchText, setOnboardingSearchText] = useState('')


  // 就业计划信息
  const [requiredEmploymentCount, setRequiredEmploymentCount] = useState<number>(4)
  const [employmentPeriodStart, setEmploymentPeriodStart] = useState<Dayjs>(dayjs('2024-10-13'))
  const [employmentPeriodEnd, setEmploymentPeriodEnd] = useState<Dayjs>(dayjs('2024-11-21'))
  const [targetAvgSalary, setTargetAvgSalary] = useState<number>(6500)
  const [responsibleClassTeacher, setResponsibleClassTeacher] = useState<string>('张远平')
  const [responsibleInstructor, setResponsibleInstructor] = useState<string>('何汕')

  // 神殿列表
  const campuses = getAllCampuses().map((campus) => ({
    id: campus.name.replace('神殿', ''),
    name: campus.name,
  }))

  // 入职计划模拟数据
  const onboardingMockData: OnboardingPlanRecord[] = [
    {
      key: '1',
      serialNumber: 1,
      name: '张三',
      gender: '男',
      currentAge: 20,
      currentEducation: '高中',
      expectedEmploymentRegion: '北京',
      targetPosition: 'linux运维工程师为主,网工为辅',
      targetSalary: 8500,
      responsibleClassTeacher: '张远平',
      responsibleInstructor: '何汕',
      dailyProgress: (() => {
        const progress: Record<string, string> = {}
        for (let i = 1; i <= 31; i++) {
          progress[`${i}日`] = ''
        }
        return progress
      })(),
      weeklySummary1: '',
      weeklySummary2: '',
      weeklySummary3: '',
      weeklySummary4: '',
    },
    {
      key: '2',
      serialNumber: 2,
      name: '李四',
      gender: '女',
      currentAge: 19,
      currentEducation: '初中',
      expectedEmploymentRegion: '上海',
      targetPosition: '前端开发工程师',
      targetSalary: 8000,
      responsibleClassTeacher: '张远平',
      responsibleInstructor: '何汕',
      dailyProgress: (() => {
        const progress: Record<string, string> = {}
        for (let i = 1; i <= 31; i++) {
          progress[`${i}日`] = ''
        }
        return progress
      })(),
      weeklySummary1: '',
      weeklySummary2: '',
      weeklySummary3: '',
      weeklySummary4: '',
    },
    {
      key: '3',
      serialNumber: 3,
      name: '王五',
      gender: '男',
      currentAge: 21,
      currentEducation: '高中',
      expectedEmploymentRegion: '深圳',
      targetPosition: 'Java开发工程师',
      targetSalary: 9000,
      responsibleClassTeacher: '张远平',
      responsibleInstructor: '何汕',
      dailyProgress: (() => {
        const progress: Record<string, string> = {}
        for (let i = 1; i <= 31; i++) {
          progress[`${i}日`] = ''
        }
        return progress
      })(),
      weeklySummary1: '',
      weeklySummary2: '',
      weeklySummary3: '',
      weeklySummary4: '',
    },
  ]

  // 初始化入职数据
  React.useEffect(() => {
    if (onboardingDataSource.length === 0) {
      setOnboardingDataSource(onboardingMockData)
    }
  }, [])

  // 筛选就业期数据
  const filteredData = dataSource.filter((item) => {
    const matchSearch =
      !searchText ||
      item.workContent?.includes(searchText) ||
      item.workGoal?.includes(searchText) ||
      item.classTeacher?.includes(searchText) ||
      item.instructor?.includes(searchText)
    return matchSearch
  })

  // 筛选入职数据
  const filteredOnboardingData = onboardingDataSource.filter((item) => {
    const matchSearch =
      !onboardingSearchText ||
      item.name?.includes(onboardingSearchText) ||
      item.expectedEmploymentRegion?.includes(onboardingSearchText) ||
      item.targetPosition?.includes(onboardingSearchText) ||
      item.responsibleClassTeacher?.includes(onboardingSearchText) ||
      item.responsibleInstructor?.includes(onboardingSearchText)
    return matchSearch
  })

  const handleEdit = (record: EmploymentPeriodPlanRecord) => {
    setEditingRecord(record)
    form.setFieldsValue({
      ...record,
      date: record.date ? dayjs(record.date) : null,
    })
    setIsModalVisible(true)
  }

  const handleAdd = () => {
    setEditingRecord(null)
    form.resetFields()
    setIsModalVisible(true)
  }

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      const newRecord: EmploymentPeriodPlanRecord = {
        ...values,
        key: editingRecord?.key || Date.now().toString(),
        date: values.date ? values.date.format('YYYY-MM-DD') : undefined,
        classTeacher: responsibleClassTeacher,
        instructor: responsibleInstructor,
      }

      if (activeTab === 'employment-period') {
        if (editingRecord) {
          const updatedData = dataSource.map((item) =>
            item.key === editingRecord.key ? newRecord : item,
          )
          updatedData.forEach((item, index) => {
            item.serialNumber = index + 1
          })
          setDataSource(updatedData)
        } else {
          const newData = [...dataSource, { ...newRecord, serialNumber: dataSource.length + 1 }]
          setDataSource(newData)
        }
      } else {
        const onboardingRecord: OnboardingPlanRecord = {
          key: newRecord.key,
          serialNumber: newRecord.serialNumber,
          name: (form.getFieldValue('name') as string) || '',
          gender: (form.getFieldValue('gender') as string) || '',
          currentAge: form.getFieldValue('currentAge') as number | undefined,
          currentEducation: form.getFieldValue('currentEducation') as string | undefined,
          expectedEmploymentRegion: form.getFieldValue('expectedEmploymentRegion') as string | undefined,
          targetPosition: form.getFieldValue('targetPosition') as string | undefined,
          targetSalary: form.getFieldValue('targetSalary') as number | undefined,
          responsibleClassTeacher: form.getFieldValue('responsibleClassTeacher') as string | undefined,
          responsibleInstructor: form.getFieldValue('responsibleInstructor') as string | undefined,
          dailyProgress:
            editingRecord && 'dailyProgress' in editingRecord
              ? (editingRecord.dailyProgress as Record<string, string> | undefined)
              : {},
          weeklySummary1:
            editingRecord && 'weeklySummary1' in editingRecord
              ? (editingRecord.weeklySummary1 as string | undefined)
              : undefined,
          weeklySummary2:
            editingRecord && 'weeklySummary2' in editingRecord
              ? (editingRecord.weeklySummary2 as string | undefined)
              : undefined,
          weeklySummary3:
            editingRecord && 'weeklySummary3' in editingRecord
              ? (editingRecord.weeklySummary3 as string | undefined)
              : undefined,
          weeklySummary4:
            editingRecord && 'weeklySummary4' in editingRecord
              ? (editingRecord.weeklySummary4 as string | undefined)
              : undefined,
        }

        if (editingRecord) {
          const updatedData = onboardingDataSource.map((item) =>
            item.key === editingRecord.key ? onboardingRecord : item,
          )
          updatedData.forEach((item, index) => {
            item.serialNumber = index + 1
          })
          setOnboardingDataSource(updatedData)
        } else {
          const newData = [
            ...onboardingDataSource,
            { ...onboardingRecord, serialNumber: onboardingDataSource.length + 1 },
          ]
          setOnboardingDataSource(newData)
        }
      }

      message.success(editingRecord ? '编辑成功' : '新增成功')

      setIsModalVisible(false)
      form.resetFields()
    } catch (error) {
      console.error('Validation failed:', error)
    }
  }

  const handleDelete = (key: string) => {
    modal.confirm({
      title: '确认删除',
      content: '确定要删除这条记录吗？',
      onOk: () => {
        if (activeTab === 'employment-period') {
          const updatedData = dataSource.filter((item) => item.key !== key)
          updatedData.forEach((item, index) => {
            item.serialNumber = index + 1
          })
          setDataSource(updatedData)
        } else {
          const updatedData = onboardingDataSource.filter((item) => item.key !== key)
          updatedData.forEach((item, index) => {
            item.serialNumber = index + 1
          })
          setOnboardingDataSource(updatedData)
        }
        message.success('删除成功')
      },
    })
  }

  // 入职计划的增删改功能
  const [editingDayKey, setEditingDayKey] = useState<string>('')
  const [editingDayProgress, setEditingDayProgress] = useState<string>('')
  const [isDayProgressModalVisible, setIsDayProgressModalVisible] = useState(false)

  const handleOnboardingEdit = (record: OnboardingPlanRecord, dayKey?: string) => {
    if (dayKey) {
      // 编辑某一天的数据
      const currentProgress = record.dailyProgress?.[dayKey] || ''
      setEditingDayKey(dayKey)
      setEditingDayProgress(currentProgress)
      setEditingOnboardingRecord(record)
      setIsDayProgressModalVisible(true)
    } else {
      // 编辑基本信息
      setEditingOnboardingRecord(record)
      onboardingForm.setFieldsValue(record)
      setIsOnboardingModalVisible(true)
    }
  }

  const handleDayProgressSave = () => {
    if (editingOnboardingRecord && editingDayKey) {
      const newData = onboardingDataSource.map((item) => {
        if (item.key === editingOnboardingRecord.key) {
          if (editingDayKey.startsWith('weeklySummary')) {
            // 保存周总结（支持weeklySummary1-4）
            return {
              ...item,
              [editingDayKey]: editingDayProgress,
            }
          } else {
            // 保存每日进度
            return {
              ...item,
              dailyProgress: {
                ...item.dailyProgress,
                [editingDayKey]: editingDayProgress,
              },
            }
          }
        }
        return item
      })
      setOnboardingDataSource(newData)
      message.success('保存成功')
      setIsDayProgressModalVisible(false)
      setEditingDayKey('')
      setEditingDayProgress('')
      setEditingOnboardingRecord(null)
    }
  }

  const handleOnboardingAdd = () => {
    setEditingOnboardingRecord(null)
    onboardingForm.resetFields()
    const initialDailyProgress: Record<string, string> = {}
    for (let i = 1; i <= 31; i++) {
      initialDailyProgress[`${i}日`] = ''
    }
    onboardingForm.setFieldsValue({
      responsibleClassTeacher: responsibleClassTeacher,
      responsibleInstructor: responsibleInstructor,
      dailyProgress: initialDailyProgress,
    })
    setIsOnboardingModalVisible(true)
  }

  const handleOnboardingSave = async () => {
    try {
      const values = await onboardingForm.validateFields()
      const dailyProgress: Record<string, string> = {}
      for (let i = 1; i <= 31; i++) {
        dailyProgress[`${i}日`] = values[`day${i}`] || ''
      }

      const newRecord: OnboardingPlanRecord = {
        ...values,
        key: editingOnboardingRecord?.key || Date.now().toString(),
        dailyProgress,
        weeklySummary1: values.weeklySummary1 || '',
        weeklySummary2: values.weeklySummary2 || '',
        weeklySummary3: values.weeklySummary3 || '',
        weeklySummary4: values.weeklySummary4 || '',
        responsibleClassTeacher: responsibleClassTeacher,
        responsibleInstructor: responsibleInstructor,
      }

      if (editingOnboardingRecord) {
        const updatedData = onboardingDataSource.map((item) =>
          item.key === editingOnboardingRecord.key ? newRecord : item,
        )
        setOnboardingDataSource(updatedData)
        message.success('编辑成功')
      } else {
        const newData = [
          ...onboardingDataSource,
          { ...newRecord, serialNumber: onboardingDataSource.length + 1 },
        ]
        setOnboardingDataSource(newData)
        message.success('新增成功')
      }

      setIsOnboardingModalVisible(false)
      onboardingForm.resetFields()
    } catch (error) {
      console.error('Validation failed:', error)
    }
  }

  const handleOnboardingDelete = (key: string) => {
    modal.confirm({
      title: '确认删除',
      content: '确定要删除这条记录吗？',
      onOk: () => {
        const updatedData = onboardingDataSource.filter((item) => item.key !== key)
        updatedData.forEach((item, index) => {
          item.serialNumber = index + 1
        })
        setOnboardingDataSource(updatedData)
        message.success('删除成功')
      },
    })
  }

  const handleRefresh = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      message.success('数据已刷新')
    }, 500)
  }

  const handleExport = () => {
    message.info('导出功能开发中...')
  }

  const columns: ColumnsType<EmploymentPeriodPlanRecord> = [
    {
      title: '序号',
      dataIndex: 'serialNumber',
      key: 'serialNumber',
      width: 80,
      align: 'center',
      fixed: 'left',
    },
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      align: 'center',
      render: (text) => text || '-',
    },
    {
      title: '形式/地点',
      dataIndex: 'formLocation',
      key: 'formLocation',
      width: 150,
      render: (text) => text || '-',
    },
    {
      title: '工作内容',
      dataIndex: 'workContent',
      key: 'workContent',
      width: 200,
      render: (text) => text || '-',
    },
    {
      title: '工作目标',
      dataIndex: 'workGoal',
      key: 'workGoal',
      width: 180,
      render: (text) => text || '-',
    },
    {
      title: '如何做',
      dataIndex: 'howToDo',
      key: 'howToDo',
      width: 250,
      render: (text) => text || '-',
    },
    {
      title: '实际工作结果',
      dataIndex: 'actualWorkResult',
      key: 'actualWorkResult',
      width: 200,
      render: (text) => text || '-',
    },
    {
      title: '班主任',
      dataIndex: 'classTeacher',
      key: 'classTeacher',
      width: 100,
      align: 'center',
      render: (text) => text || '-',
    },
    {
      title: '教员',
      dataIndex: 'instructor',
      key: 'instructor',
      width: 100,
      align: 'center',
      render: (text) => text || '-',
    },
    {
      title: '监督人',
      dataIndex: 'supervisor',
      key: 'supervisor',
      width: 100,
      align: 'center',
      render: (text) => text || '-',
    },
    {
      title: '备注',
      dataIndex: 'remarks',
      key: 'remarks',
      width: 150,
      render: (text) => text || '-',
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          >
            编辑
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.key)}
            size="small"
          >
            删除
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title={
          <Space>
            <CalendarOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
            <span>
              {selectedCampus}教化司{selectedClass}就业期计划和监督表
            </span>
          </Space>
        }
        extra={
          <Space>
            <Select
              value={selectedCampus}
              onChange={(value) => {
                setSelectedCampus(value)
                setCampus(value)
              }}
              style={{ width: 150 }}
            >
              {campuses.map((campus) => (
                <Option key={campus.id} value={campus.name}>
                  {campus.name}
                </Option>
              ))}
            </Select>
            <Select value={selectedClass} onChange={setSelectedClass} style={{ width: 120 }}>
              <Option value="T126班">T126班</Option>
              <Option value="T127班">T127班</Option>
              <Option value="T128班">T128班</Option>
            </Select>
            <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
              刷新
            </Button>
            <Button icon={<DownloadOutlined />} onClick={handleExport}>
              导出
            </Button>
            {activeTab === 'employment-period' ? (
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                新增记录
              </Button>
            ) : (
              <Button type="primary" icon={<PlusOutlined />} onClick={handleOnboardingAdd}>
                新增学生
              </Button>
            )}
          </Space>
        }
      >
        {/* 标签栏 */}
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          type="card"
          style={{ marginBottom: 16 }}
          items={[
            {
              key: 'employment-period',
              label: '就业期计划和监督表',
              children: (<>
            {/* 头部信息 */}
            <Card type="inner" style={{ marginBottom: 16 }}>
              <Descriptions bordered column={3} size="small">
                <Descriptions.Item label="班级名称">{selectedClass}</Descriptions.Item>
                <Descriptions.Item label="需就业人数">
                  <InputNumber
                    value={requiredEmploymentCount}
                    onChange={(value) => setRequiredEmploymentCount(value || 0)}
                    min={0}
                    style={{ width: '100%' }}
                  />
                </Descriptions.Item>
                <Descriptions.Item label="就业周期">
                  <Space>
                    <DatePicker
                      value={employmentPeriodStart}
                      onChange={(date) => date && setEmploymentPeriodStart(date)}
                      format="YYYY-MM-DD"
                      size="small"
                    />
                    <span>-</span>
                    <DatePicker
                      value={employmentPeriodEnd}
                      onChange={(date) => date && setEmploymentPeriodEnd(date)}
                      format="YYYY-MM-DD"
                      size="small"
                    />
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="目标平均薪资">
                  <InputNumber
                    value={targetAvgSalary}
                    onChange={(value) => setTargetAvgSalary(value || 0)}
                    min={0}
                    style={{ width: '100%' }}
                    prefix="¥"
                  />
                </Descriptions.Item>
                <Descriptions.Item label="负责班主任">
                  <Input
                    value={responsibleClassTeacher}
                    onChange={(e) => setResponsibleClassTeacher(e.target.value)}
                    style={{ width: '100%' }}
                    size="small"
                  />
                </Descriptions.Item>
                <Descriptions.Item label="负责教员">
                  <Input
                    value={responsibleInstructor}
                    onChange={(e) => setResponsibleInstructor(e.target.value)}
                    style={{ width: '100%' }}
                    size="small"
                  />
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* 搜索栏 */}
            <Space style={{ marginBottom: 16 }}>
              <Input
                placeholder="搜索工作内容/目标/班主任/教员"
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 300 }}
                allowClear
              />
            </Space>

            {/* 表格 */}
            <Table
              columns={columns}
              dataSource={filteredData}
              loading={loading}
              scroll={{ x: 1800, y: 600 }}
              pagination={false}
              bordered
            />
              </>),
            },
            {
              key: 'onboarding-period',
              label: '入职计划和监督表',
              children: (<>
            {/* 头部信息 */}
            <Card type="inner" style={{ marginBottom: 16 }}>
              <Descriptions bordered column={3} size="small">
                <Descriptions.Item label="班级名称">{selectedClass}</Descriptions.Item>
                <Descriptions.Item label="需就业人数">
                  <InputNumber
                    value={requiredEmploymentCount}
                    onChange={(value) => setRequiredEmploymentCount(value || 0)}
                    min={0}
                    style={{ width: '100%' }}
                  />
                </Descriptions.Item>
                <Descriptions.Item label="入职周期">
                  <Space>
                    <DatePicker
                      value={employmentPeriodEnd}
                      onChange={(date) => date && setEmploymentPeriodEnd(date)}
                      format="YYYY-MM-DD"
                      size="small"
                    />
                    <span>-</span>
                    <DatePicker
                      value={dayjs().add(30, 'day')}
                      format="YYYY-MM-DD"
                      size="small"
                      disabled
                    />
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="目标平均薪资">
                  <InputNumber
                    value={targetAvgSalary}
                    onChange={(value) => setTargetAvgSalary(value || 0)}
                    min={0}
                    style={{ width: '100%' }}
                    prefix="¥"
                  />
                </Descriptions.Item>
                <Descriptions.Item label="负责班主任">
                  <Input
                    value={responsibleClassTeacher}
                    onChange={(e) => setResponsibleClassTeacher(e.target.value)}
                    style={{ width: '100%' }}
                    size="small"
                  />
                </Descriptions.Item>
                <Descriptions.Item label="负责教员">
                  <Input
                    value={responsibleInstructor}
                    onChange={(e) => setResponsibleInstructor(e.target.value)}
                    style={{ width: '100%' }}
                    size="small"
                  />
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* 填写说明 */}
            <Card type="inner" style={{ marginBottom: 16, backgroundColor: '#fffbe6' }}>
              <div style={{ fontSize: '14px', lineHeight: '24px' }}>
                <strong>就业进度填写：</strong>
                <br />
                1. <strong>入职填写</strong>：地区、单位,岗位,薪资,其他
                <br />
                2. <strong>试岗填写</strong>：地区,单位,岗位,薪资,试岗时间,情况
                <br />
                3. <strong>约面试单位填写</strong>：几个面试,地区,单位,岗位,薪资,时间,其他情况
              </div>
            </Card>

            {/* 搜索栏 */}
            <Space style={{ marginBottom: 16 }}>
              <Input
                placeholder="搜索姓名/地区/岗位/班主任/教员"
                prefix={<SearchOutlined />}
                value={onboardingSearchText}
                onChange={(e) => setOnboardingSearchText(e.target.value)}
                style={{ width: 300 }}
                allowClear
              />
            </Space>

            {/* 入职计划表格 */}
            <Table
              columns={(() => {
                // 创建入职计划的表格列
                const baseColumns: ColumnsType<OnboardingPlanRecord> = [
                  {
                    title: '序号',
                    dataIndex: 'serialNumber',
                    key: 'serialNumber',
                    width: 70,
                    align: 'center',
                    fixed: 'left',
                  },
                  {
                    title: '姓名',
                    dataIndex: 'name',
                    key: 'name',
                    width: 100,
                    fixed: 'left',
                    render: (text, record) => (
                      <Space>
                        <span>{text}</span>
                        <Button
                          type="link"
                          icon={<EditOutlined />}
                          onClick={() => handleOnboardingEdit(record)}
                          size="small"
                        />
                      </Space>
                    ),
                  },
                  {
                    title: '性别',
                    dataIndex: 'gender',
                    key: 'gender',
                    width: 70,
                    align: 'center',
                  },
                  {
                    title: '目前年龄',
                    dataIndex: 'currentAge',
                    key: 'currentAge',
                    width: 90,
                    align: 'center',
                    render: (text) => text || '-',
                  },
                  {
                    title: '现有学历',
                    dataIndex: 'currentEducation',
                    key: 'currentEducation',
                    width: 100,
                    align: 'center',
                    render: (text) => text || '-',
                  },
                  {
                    title: '预计就业地区',
                    dataIndex: 'expectedEmploymentRegion',
                    key: 'expectedEmploymentRegion',
                    width: 120,
                    align: 'center',
                    render: (text) => text || '-',
                  },
                  {
                    title: '目标岗位',
                    dataIndex: 'targetPosition',
                    key: 'targetPosition',
                    width: 250,
                    render: (text) => text || '-',
                  },
                  {
                    title: '目标薪资',
                    dataIndex: 'targetSalary',
                    key: 'targetSalary',
                    width: 100,
                    align: 'right',
                    render: (text) => (text ? `¥${text.toLocaleString()}` : '-'),
                  },
                  {
                    title: '负责班主任',
                    dataIndex: 'responsibleClassTeacher',
                    key: 'responsibleClassTeacher',
                    width: 110,
                    align: 'center',
                    render: (text) => text || '-',
                  },
                  {
                    title: '负责教员',
                    dataIndex: 'responsibleInstructor',
                    key: 'responsibleInstructor',
                    width: 100,
                    align: 'center',
                    render: (text) => text || '-',
                  },
                ]

                // 10月份每日列 - 补充完整1日到31日
                const dayColumns: any[] = []

                // 创建日期列的通用函数
                const createDayColumn = (day: number) => ({
                  title: `${day}日`,
                  key: `day${day}`,
                  dataIndex: `day${day}`,
                  width: 90,
                  align: 'center',
                  render: (_: any, record: OnboardingPlanRecord) => {
                    const dayKey = `${day}日`
                    const progress = record.dailyProgress?.[dayKey] || ''
                    return (
                      <div
                        style={{
                          minHeight: '40px',
                          padding: '4px',
                          cursor: 'pointer',
                          border: '1px dashed #d9d9d9',
                          borderRadius: '4px',
                          fontSize: '11px',
                          wordBreak: 'break-word',
                          whiteSpace: 'pre-wrap',
                        }}
                        onClick={() => handleOnboardingEdit(record, dayKey)}
                        title={progress || '点击填写'}
                      >
                        {progress || (
                          <span style={{ color: '#999', fontSize: '11px' }}>点击填写</span>
                        )}
                      </div>
                    )
                  },
                })

                // 创建周总结列的通用函数
                const createWeeklySummaryColumn = (weekNum: number) => ({
                  title: '周总结',
                  key: `weeklySummary${weekNum}`,
                  width: 140,
                  align: 'center',
                  render: (_: any, record: OnboardingPlanRecord) => {
                    const summary =
                      (record[`weeklySummary${weekNum}` as keyof OnboardingPlanRecord] as string) ||
                      ''
                    return (
                      <div
                        style={{
                          minHeight: '40px',
                          padding: '4px',
                          cursor: 'pointer',
                          border: '1px dashed #d9d9d9',
                          borderRadius: '4px',
                          fontSize: '11px',
                          wordBreak: 'break-word',
                          whiteSpace: 'pre-wrap',
                        }}
                        onClick={() => {
                          setEditingOnboardingRecord(record)
                          setIsDayProgressModalVisible(true)
                          setEditingDayKey(`weeklySummary${weekNum}`)
                          setEditingDayProgress(summary)
                        }}
                        title={summary || '点击填写'}
                      >
                        {summary || (
                          <span style={{ color: '#999', fontSize: '11px' }}>点击填写</span>
                        )}
                      </div>
                    )
                  },
                })

                // 第1周：1日到10日，然后周总结1
                for (let i = 1; i <= 10; i++) {
                  dayColumns.push(createDayColumn(i))
                }
                dayColumns.push(createWeeklySummaryColumn(1))

                // 第2周：11日到17日，然后周总结2
                for (let i = 11; i <= 17; i++) {
                  dayColumns.push(createDayColumn(i))
                }
                dayColumns.push(createWeeklySummaryColumn(2))

                // 第3周：18日到24日，然后周总结3
                for (let i = 18; i <= 24; i++) {
                  dayColumns.push(createDayColumn(i))
                }
                dayColumns.push(createWeeklySummaryColumn(3))

                // 第4周：25日到31日，然后周总结4
                for (let i = 25; i <= 31; i++) {
                  dayColumns.push(createDayColumn(i))
                }
                dayColumns.push(createWeeklySummaryColumn(4))

                // 操作列
                const actionColumn: any[] = [
                  {
                    title: '操作',
                    key: 'action',
                    fixed: 'right',
                    width: 100,
                    render: (_: any, record: OnboardingPlanRecord) => (
                      <Button
                        type="link"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleOnboardingDelete(record.key)}
                        size="small"
                      >
                        删除
                      </Button>
                    ),
                  },
                ]

                // 合并列（使用嵌套表头，10月份包含所有日期列和周总结列）
                return [
                  ...baseColumns,
                  {
                    title: '10月份',
                    children: dayColumns,
                  },
                  ...actionColumn,
                ]
              })()}
              dataSource={filteredOnboardingData}
              loading={loading}
              scroll={{ x: 4000, y: 600 }}
              pagination={false}
              bordered
              size="small"
            />
              </>),
            },
          ]}
        />
      </Card>

      {/* 就业期计划编辑/新增弹窗 */}
      <Modal
        title={editingRecord ? '编辑计划记录' : '新增计划记录'}
        open={isModalVisible}
        onOk={handleSave}
        onCancel={() => {
          setIsModalVisible(false)
          form.resetFields()
        }}
        width={800}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="date" label="日期">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="formLocation" label="形式/地点">
                <Input placeholder="例如：线上/招聘平台" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="workContent" label="工作内容">
            <TextArea rows={2} placeholder="请输入工作内容" />
          </Form.Item>

          <Form.Item name="workGoal" label="工作目标">
            <TextArea rows={2} placeholder="请输入工作目标" />
          </Form.Item>

          <Form.Item name="howToDo" label="如何做">
            <TextArea rows={3} placeholder="请输入具体实施方法" />
          </Form.Item>

          <Form.Item name="actualWorkResult" label="实际工作结果">
            <TextArea rows={2} placeholder="请输入实际工作结果" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="classTeacher" label="班主任">
                <Input defaultValue={responsibleClassTeacher} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="instructor" label="教员">
                <Input defaultValue={responsibleInstructor} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="supervisor" label="监督人">
                <Input placeholder="请输入监督人" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="remarks" label="备注">
            <TextArea rows={2} placeholder="请输入备注信息" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 入职计划编辑/新增弹窗 */}
      <Modal
        title={editingOnboardingRecord ? '编辑学生信息' : '新增学生'}
        open={isOnboardingModalVisible}
        onOk={handleOnboardingSave}
        onCancel={() => {
          setIsOnboardingModalVisible(false)
          onboardingForm.resetFields()
        }}
        width={1000}
        okText="保存"
        cancelText="取消"
      >
        <Form form={onboardingForm} layout="vertical">
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="name"
                label="姓名"
                rules={[{ required: true, message: '请输入姓名' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="gender"
                label="性别"
                rules={[{ required: true, message: '请选择性别' }]}
              >
                <Select>
                  <Option value="男">男</Option>
                  <Option value="女">女</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="currentAge" label="目前年龄">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="currentEducation" label="现有学历">
                <Select>
                  <Option value="初中">初中</Option>
                  <Option value="高中">高中</Option>
                  <Option value="其他">其他</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="expectedEmploymentRegion" label="预计就业地区">
                <Input placeholder="例如：北京" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="targetSalary" label="目标薪资">
                <InputNumber style={{ width: '100%' }} min={0} prefix="¥" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="targetPosition" label="目标岗位">
            <TextArea rows={2} placeholder="例如：linux运维工程师为主,网工为辅" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="responsibleClassTeacher" label="负责班主任">
                <Input defaultValue={responsibleClassTeacher} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="responsibleInstructor" label="负责教员">
                <Input defaultValue={responsibleInstructor} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* 编辑日期进度/周总结的弹窗 */}
      <Modal
        title={
          editingDayKey?.startsWith('weeklySummary')
            ? `编辑第${editingDayKey.replace('weeklySummary', '')}周总结`
            : `编辑${editingDayKey}的进度`
        }
        open={isDayProgressModalVisible}
        onOk={handleDayProgressSave}
        onCancel={() => {
          setIsDayProgressModalVisible(false)
          setEditingDayKey('')
          setEditingDayProgress('')
          setEditingOnboardingRecord(null)
        }}
        width={600}
        okText="保存"
        cancelText="取消"
      >
        <div style={{ marginBottom: 16, fontSize: '12px', color: '#666' }}>
          <div>
            <strong>填写格式：</strong>
          </div>
          <div>
            1. <strong>入职填写</strong>：地区、单位,岗位,薪资,其他
          </div>
          <div>
            2. <strong>试岗填写</strong>：地区,单位,岗位,薪资,试岗时间,情况
          </div>
          <div>
            3. <strong>约面试单位填写</strong>：几个面试,地区,单位,岗位,薪资,时间,其他情况
          </div>
        </div>
        <TextArea
          value={editingDayProgress}
          onChange={(e) => setEditingDayProgress(e.target.value)}
          rows={6}
          placeholder={
            editingDayKey?.startsWith('weeklySummary') ? '请输入周总结' : '请填写进度信息'
          }
          autoFocus
        />
      </Modal>
    </div>
  )
}

export default CampusEmploymentPeriodPlanPage
