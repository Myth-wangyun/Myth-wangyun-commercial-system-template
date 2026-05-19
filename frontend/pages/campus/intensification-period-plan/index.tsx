/**
 * 强化期计划和监督表页面
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
} from 'antd'
import {
  ThunderboltOutlined,
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
interface IntensificationPeriodPlanRecord {
  key: string
  serialNumber: number // 序号
  date?: string // 日期
  dayOfWeek?: string // 星期
  workContent?: string // 工作内容
  formLocation?: string // 形式/地点
  workGoal?: string // 工作目标
  howToDo?: string // 如何做
  actualWorkResult?: string // 实际工作结果
  followUpGoal?: string // 后期跟进目标
  participants?: string // 参与人
  organizer?: string // 组织者
  supervisor?: string // 监督人
  evaluationResult?: string // 评价结果
}

// 模拟数据
const mockData: IntensificationPeriodPlanRecord[] = [
  {
    key: '1',
    serialNumber: 1,
    date: '2024-08-26',
    dayOfWeek: '一',
    workContent: '就业启动会：了解就业地区、岗位、薪资，了解自己需求',
    formLocation: '线下/教室',
    workGoal: '学生明确就业方向和自身定位',
    howToDo: '组织全体学生参加，讲解就业政策、流程和要求',
    actualWorkResult: '学生基本了解就业流程和要求',
    followUpGoal: '持续跟踪学生就业意向变化',
    participants: '后端校长刘积家,学术何汕,教质张远平',
    organizer: '张远平',
    supervisor: '刘积家',
    evaluationResult: '',
  },
  {
    key: '2',
    serialNumber: 2,
    date: '2024-08-27',
    dayOfWeek: '二',
    workContent: '简历整体结构讲解',
    formLocation: '线上/教学平台',
    workGoal: '学生掌握简历的基本结构和要求',
    howToDo: 'PPT讲解简历各部分内容和要求',
    actualWorkResult: '学生基本掌握简历结构',
    followUpGoal: '督促学生完成初稿',
    participants: '学术何汕、伍瑶,教质张远平',
    organizer: '张远平',
    supervisor: '刘积家',
    evaluationResult: '',
  },
  {
    key: '3',
    serialNumber: 3,
    date: '2024-08-28',
    dayOfWeek: '三',
    workContent: '简历撰写技巧讲解',
    formLocation: '线上/教学平台',
    workGoal: '学生掌握简历撰写的基本技巧',
    howToDo: '讲解简历语言表达、关键词提炼等技巧',
    actualWorkResult: '学生掌握了基本撰写技巧',
    followUpGoal: '收集学生简历初稿',
    participants: '学术何汕,教质张远平',
    organizer: '张远平',
    supervisor: '刘积家',
    evaluationResult: '',
  },
  {
    key: '4',
    serialNumber: 4,
    date: '2024-08-29',
    dayOfWeek: '四',
    workContent: '压力面试第一轮',
    formLocation: '线下/面试室',
    workGoal: '评估学生面试表现，发现问题',
    howToDo: '模拟真实面试环境，提问常见面试问题',
    actualWorkResult: '学生回答问题合格率较低',
    followUpGoal: '归纳总结问题，要求学生改进',
    participants: '后端校长刘积家,学术伍瑶,教质姜楠、张远平',
    organizer: '张远平',
    supervisor: '刘积家',
    evaluationResult: '',
  },
  {
    key: '5',
    serialNumber: 5,
    date: '2024-08-30',
    dayOfWeek: '五',
    workContent: '简历收集与初步审核',
    formLocation: '线上/教学平台',
    workGoal: '收集所有学生简历初稿并进行初步审核',
    howToDo: '要求学生提交简历，逐一检查格式和内容',
    actualWorkResult: '收集到所有学生简历，发现部分格式问题',
    followUpGoal: '针对问题逐一反馈修改意见',
    participants: '学术何汕,教质张远平',
    organizer: '张远平',
    supervisor: '刘积家',
    evaluationResult: '',
  },
  {
    key: '6',
    serialNumber: 6,
    date: '2024-09-02',
    dayOfWeek: '一',
    workContent: '简历格式专项指导第一课',
    formLocation: '线上/教学平台',
    workGoal: '规范学生简历格式',
    howToDo: '详细讲解简历格式要求，展示标准模板',
    actualWorkResult: '学生了解了标准格式要求',
    followUpGoal: '要求学生按照格式要求修改简历',
    participants: '学术何汕,教质张远平',
    organizer: '张远平',
    supervisor: '刘积家',
    evaluationResult: '',
  },
  {
    key: '7',
    serialNumber: 7,
    date: '2024-09-03',
    dayOfWeek: '二',
    workContent: '简历格式专项指导第二课',
    formLocation: '线上/教学平台',
    workGoal: '强化简历格式规范',
    howToDo: '一对一检查简历格式，纠正错误',
    actualWorkResult: '大部分学生格式已规范',
    followUpGoal: '继续跟进剩余学生的格式问题',
    participants: '学术何汕,教质张远平',
    organizer: '张远平',
    supervisor: '刘积家',
    evaluationResult: '',
  },
  {
    key: '8',
    serialNumber: 8,
    date: '2024-09-04',
    dayOfWeek: '三',
    workContent: '简历格式专项指导第三课',
    formLocation: '线上/教学平台',
    workGoal: '完善简历格式细节',
    howToDo: '检查细节问题，如间距、字体、对齐等',
    actualWorkResult: '简历格式基本达到要求',
    followUpGoal: '准备进行简历内容优化',
    participants: '学术何汕,教质张远平',
    organizer: '张远平',
    supervisor: '刘积家',
    evaluationResult: '',
  },
  {
    key: '9',
    serialNumber: 9,
    date: '2024-09-05',
    dayOfWeek: '四',
    workContent: '压力面试第二轮',
    formLocation: '线下/面试室',
    workGoal: '综合面试表现回顾,提出问题,学生能够流畅回答',
    howToDo: '学生回答问题合格率较低,进行问题归纳总结,要求学生进一步改进,背出问题的答案',
    actualWorkResult: '部分学生表现有所提升',
    followUpGoal: '继续跟进改进情况',
    participants: '后端校长刘积家,学术伍瑶,教质姜楠、张远平',
    organizer: '张远平',
    supervisor: '刘积家',
    evaluationResult: '',
  },
  {
    key: '10',
    serialNumber: 10,
    date: '2024-09-06',
    dayOfWeek: '五',
    workContent: '简历格式专项指导第四课',
    formLocation: '线上/教学平台',
    workGoal: '最终检查简历格式，确保无误',
    howToDo: '全面检查所有学生简历，确保格式标准化',
    actualWorkResult: '所有学生简历格式已规范化',
    followUpGoal: '转入简历内容优化阶段',
    participants: '学术何汕,教质张远平',
    organizer: '张远平',
    supervisor: '刘积家',
    evaluationResult: '',
  },
  {
    key: '11',
    serialNumber: 11,
    date: '2024-09-09',
    dayOfWeek: '一',
    workContent: '压力面试第三轮',
    formLocation: '线下/面试室',
    workGoal: '学生能够流畅回答常见问题',
    howToDo: '针对前两轮问题，强化训练',
    actualWorkResult: '学生回答流畅度有所提升',
    followUpGoal: '',
    participants: '后端校长刘积家,学术伍瑶,教质姜楠、张远平',
    organizer: '张远平',
    supervisor: '刘积家',
    evaluationResult: '',
  },
  {
    key: '12',
    serialNumber: 12,
    date: '2024-09-10',
    dayOfWeek: '二',
    workContent: '简历内容优化指导',
    formLocation: '线上/教学平台',
    workGoal: '优化简历内容，突出亮点',
    howToDo: '讲解如何描述项目经验、技能等，突出个人优势',
    actualWorkResult: '学生了解了内容优化方法',
    followUpGoal: '要求学生优化简历内容',
    participants: '学术何汕,教质张远平',
    organizer: '张远平',
    supervisor: '刘积家',
    evaluationResult: '',
  },
  {
    key: '13',
    serialNumber: 13,
    date: '2024-09-11',
    dayOfWeek: '三',
    workContent: '压力面试第四轮',
    formLocation: '线下/面试室',
    workGoal: '进一步提升面试表现',
    howToDo: '模拟技术面试场景，深入提问技术问题',
    actualWorkResult: '学生在技术问题回答上有待提高',
    followUpGoal: '加强技术知识复习',
    participants: '后端校长刘积家,学术伍瑶,教质姜楠、张远平',
    organizer: '张远平',
    supervisor: '刘积家',
    evaluationResult: '',
  },
  {
    key: '14',
    serialNumber: 14,
    date: '2024-09-12',
    dayOfWeek: '四',
    workContent: '简历内容修订反馈',
    formLocation: '线上/教学平台',
    workGoal: '针对优化后的简历进行反馈',
    howToDo: '逐一检查优化后的简历，给出修改建议',
    actualWorkResult: '简历内容质量有所提升',
    followUpGoal: '继续完善简历内容',
    participants: '学术何汕,教质张远平',
    organizer: '张远平',
    supervisor: '刘积家',
    evaluationResult: '',
  },
  {
    key: '15',
    serialNumber: 15,
    date: '2024-09-13',
    dayOfWeek: '五',
    workContent: '压力面试第五轮',
    formLocation: '线下/面试室',
    workGoal: '综合评估面试能力',
    howToDo: '全面模拟面试流程，包括自我介绍、技术问答、项目介绍',
    actualWorkResult: '学生整体表现明显提升',
    followUpGoal: '继续保持并强化练习',
    participants: '后端校长刘积家,学术伍瑶,教质姜楠、张远平',
    organizer: '张远平',
    supervisor: '刘积家',
    evaluationResult: '',
  },
  {
    key: '16',
    serialNumber: 16,
    date: '2024-09-16',
    dayOfWeek: '一',
    workContent: '简历检查与问答熟悉',
    formLocation: '线上/教学平台',
    workGoal: '确保简历准确无误，熟悉常见问答',
    howToDo: '检查简历准确性，组织学生背诵常见面试问答',
    actualWorkResult: '简历已准确，问答掌握程度提高',
    followUpGoal: '继续强化问答训练',
    participants: '学术何汕,教质张远平',
    organizer: '张远平',
    supervisor: '刘积家',
    evaluationResult: '',
  },
  {
    key: '17',
    serialNumber: 17,
    date: '2024-09-17',
    dayOfWeek: '二',
    workContent: '专业技术强化',
    formLocation: '线下/教室',
    workGoal: '强化技术知识，提升面试竞争力',
    howToDo: '组织技术知识点复习，重点讲解高频面试题',
    actualWorkResult: '学生技术知识掌握更加扎实',
    followUpGoal: '持续复习技术知识点',
    participants: '学术何汕、伍瑶,教质张远平',
    organizer: '张远平',
    supervisor: '刘积家',
    evaluationResult: '',
  },
  {
    key: '18',
    serialNumber: 18,
    date: '2024-09-18',
    dayOfWeek: '三',
    workContent: '压力面试第六轮',
    formLocation: '线下/面试室',
    workGoal: '综合面试表现回顾,提出问题,学生能够流畅回答',
    howToDo: '综合面试表现回顾,提出问题,学生能够流畅回答',
    actualWorkResult: '学生整体表现良好，基本达到要求',
    followUpGoal: '准备正式面试',
    participants: '后端校长刘积家,学术伍瑶,教质姜楠、张远平',
    organizer: '张远平',
    supervisor: '刘积家',
    evaluationResult: '',
  },
  {
    key: '19',
    serialNumber: 19,
    date: '2024-09-19',
    dayOfWeek: '四',
    workContent: '讲解如何上传简历,在使用过程需要注意哪些细节',
    formLocation: '线上/教学平台',
    workGoal: '学生掌握在线简历上传流程',
    howToDo: '演示各大招聘平台的简历上传流程，讲解注意事项',
    actualWorkResult: '学生掌握了简历上传方法',
    followUpGoal: '要求学生完成在线简历上传',
    participants: '学术何汕,教质张远平',
    organizer: '张远平',
    supervisor: '刘积家',
    evaluationResult: '',
  },
  {
    key: '20',
    serialNumber: 20,
    date: '2024-09-20',
    dayOfWeek: '五',
    workContent: '专业技术强化',
    formLocation: '线下/教室',
    workGoal: '继续强化技术知识',
    howToDo: '深入讲解技术难点，组织技术问答练习',
    actualWorkResult: '学生技术理解更加深入',
    followUpGoal: '持续进行技术强化',
    participants: '学术何汕、伍瑶,教质张远平',
    organizer: '张远平',
    supervisor: '刘积家',
    evaluationResult: '',
  },
  {
    key: '21',
    serialNumber: 21,
    date: '2024-09-23',
    dayOfWeek: '一',
    workContent: '组织学生上传简历,针对面试问题汇总抽查,简历投递',
    formLocation: '线上/招聘平台',
    workGoal:
      '能够流畅进行完整的面试,回答人事问题以及专业技术问题,不卡光,打招呼次数达到上限150次,至少约1个面试',
    howToDo:
      '1. 在线简历准确无误; 2. 对面试问题掌握扎实,运用自如; 3. 按要求打招呼足够次数,继续投递、约面试',
    actualWorkResult: '部分学生已完成简历上传并开始投递',
    followUpGoal: '持续跟进简历投递情况和面试邀请',
    participants: '学术何汕、伍瑶,教质张远平',
    organizer: '张远平',
    supervisor: '刘积家',
    evaluationResult: '',
  },
  {
    key: '22',
    serialNumber: 22,
    date: '2024-09-24',
    dayOfWeek: '二',
    workContent: '学生简历投递追踪',
    formLocation: '线上/招聘平台',
    workGoal: '跟踪学生简历投递情况',
    howToDo: '检查学生投递记录，统计投递数量和反馈情况',
    actualWorkResult: '学生投递积极性较高，但反馈率偏低',
    followUpGoal: '优化投递策略，提高反馈率',
    participants: '学术何汕,教质张远平',
    organizer: '张远平',
    supervisor: '刘积家',
    evaluationResult: '',
  },
  {
    key: '23',
    serialNumber: 23,
    date: '2024-09-25',
    dayOfWeek: '三',
    workContent: '根据调整后的话术进行线上沟通投递简历达150次,至少约面试1次,保持好就业积极性',
    formLocation: '线上/招聘平台',
    workGoal: '根据调整后的话术进行线上沟通投递简历达150次,至少约面试1次,保持好就业积极性',
    howToDo: '持续跟进学生邀约面试及面试情况,根据学生简历沟通和邀约面试情况及时做心理辅导',
    actualWorkResult: '部分学生达到投递目标，获得面试邀请',
    followUpGoal: '跟进面试结果，持续投递',
    participants: '学术何汕、伍瑶,教质张远平',
    organizer: '张远平',
    supervisor: '刘积家',
    evaluationResult: '',
  },
  {
    key: '24',
    serialNumber: 24,
    date: '2024-09-26',
    dayOfWeek: '四',
    workContent: '学生简历投递追踪',
    formLocation: '线上/招聘平台',
    workGoal: '持续跟踪投递和面试情况',
    howToDo: '统计投递数据，分析投递效果，调整策略',
    actualWorkResult: '投递数量持续增长，面试邀请有所增加',
    followUpGoal: '继续保持投递积极性',
    participants: '学术何汕,教质张远平',
    organizer: '张远平',
    supervisor: '刘积家',
    evaluationResult: '',
  },
  {
    key: '25',
    serialNumber: 25,
    date: '2024-09-27',
    dayOfWeek: '五',
    workContent: '学生简历投递追踪',
    formLocation: '线上/招聘平台',
    workGoal: '持续跟进投递和面试进度',
    howToDo: '检查每日投递记录，跟进面试安排，提供指导',
    actualWorkResult: '学生投递积极性保持良好',
    followUpGoal: '持续跟进面试结果',
    participants: '学术何汕,教质张远平',
    organizer: '张远平',
    supervisor: '刘积家',
    evaluationResult: '',
  },
  {
    key: '26',
    serialNumber: 26,
    date: '2024-09-30',
    dayOfWeek: '一',
    workContent: '面试技巧强化训练',
    formLocation: '线下/面试室',
    workGoal: '强化面试技巧，提升通过率',
    howToDo: '模拟真实面试场景，针对性地进行技巧训练',
    actualWorkResult: '学生面试技巧进一步提升',
    followUpGoal: '继续保持训练，准备正式面试',
    participants: '后端校长刘积家,学术伍瑶,教质姜楠、张远平',
    organizer: '张远平',
    supervisor: '刘积家',
    evaluationResult: '',
  },
  {
    key: '27',
    serialNumber: 27,
    date: '2024-10-08',
    dayOfWeek: '二',
    workContent: '毕业班会：心态建设、就业安排、高校安排、外出注意事项、提要求',
    formLocation: '线下/教室',
    workGoal: '完成毕业前各项准备工作',
    howToDo: '组织毕业班会，讲解毕业流程、就业安排、高校选择等事项',
    actualWorkResult: '学生了解了毕业和就业相关安排',
    followUpGoal: '跟进学生毕业手续办理',
    participants: '后端校长刘积家,学术何汕、伍瑶,教质张远平、姜楠',
    organizer: '张远平',
    supervisor: '刘积家',
    evaluationResult: '',
  },
  {
    key: '28',
    serialNumber: 28,
    date: '2024-10-10',
    dayOfWeek: '四',
    workContent: '强化期总结与就业安排',
    formLocation: '线下/教室',
    workGoal: '总结强化期成果，安排后续就业工作',
    howToDo: '回顾强化期各项活动，总结成果和不足，制定后续就业计划',
    actualWorkResult: '强化期工作顺利完成，学生已做好就业准备',
    followUpGoal: '转入就业期，持续跟进学生就业情况',
    participants: '后端校长刘积家,学术何汕、伍瑶,教质张远平、姜楠',
    organizer: '张远平',
    supervisor: '刘积家',
    evaluationResult: '强化期工作圆满完成，学生就业准备工作到位',
  },
]

const CampusIntensificationPeriodPlanPage: React.FC = () => {
  const { message, modal } = App.useApp()
  const { currentCampus, getAllCampuses, setCampus } = useCampusStore()
  const [selectedCampus, setSelectedCampus] = useState<string>(currentCampus || '')
  const [selectedClass, setSelectedClass] = useState<string>('T4班')
  const [dataSource, setDataSource] = useState<IntensificationPeriodPlanRecord[]>(mockData)
  const [loading, setLoading] = useState(false)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<IntensificationPeriodPlanRecord | null>(null)
  const [form] = Form.useForm()
  const [searchText, setSearchText] = useState('')

  const campuses = getAllCampuses().map((campus) => ({
    id: campus.name.replace('神殿', ''),
    name: campus.name,
  }))

  // 就业计划信息
  const [requiredEmploymentCount, setRequiredEmploymentCount] = useState<number>(4)
  const [intensificationPeriod, setIntensificationPeriod] = useState<number>(25)
  const [graduationDate, setGraduationDate] = useState<Dayjs>(dayjs('2024-10-10'))
  const [employmentPeriodStart, setEmploymentPeriodStart] = useState<Dayjs>(dayjs('2024-10-13'))
  const [employmentPeriodEnd, setEmploymentPeriodEnd] = useState<Dayjs>(dayjs('2024-11-21'))
  const [targetAvgSalary, setTargetAvgSalary] = useState<number>(6500)
  const [responsibleClassTeacher, setResponsibleClassTeacher] = useState<string>('张远平')
  const [responsibleInstructor, setResponsibleInstructor] = useState<string>('何汕')

  // 星期映射
  const dayOfWeekMap: Record<number, string> = {
    0: '日',
    1: '一',
    2: '二',
    3: '三',
    4: '四',
    5: '五',
    6: '六',
  }

  // 筛选数据
  const filteredData = dataSource.filter((item) => {
    const matchSearch =
      !searchText ||
      item.workContent?.includes(searchText) ||
      item.workGoal?.includes(searchText) ||
      item.organizer?.includes(searchText) ||
      item.supervisor?.includes(searchText)
    return matchSearch
  })

  const handleEdit = (record: IntensificationPeriodPlanRecord) => {
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
    form.setFieldsValue({
      organizer: responsibleClassTeacher,
      supervisor: '刘积家',
    })
    setIsModalVisible(true)
  }

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      const dateStr = values.date ? dayjs(values.date).format('YYYY-MM-DD') : ''
      const dayOfWeek = values.date ? dayOfWeekMap[dayjs(values.date).day()] : ''

      const newRecord: IntensificationPeriodPlanRecord = {
        ...values,
        date: dateStr,
        dayOfWeek,
        key: editingRecord?.key || Date.now().toString(),
      }

      if (editingRecord) {
        const updatedData = dataSource.map((item) =>
          item.key === editingRecord.key ? newRecord : item,
        )
        setDataSource(updatedData)
        message.success('编辑成功')
      } else {
        const newData = [...dataSource, { ...newRecord, serialNumber: dataSource.length + 1 }]
        setDataSource(newData)
        message.success('新增成功')
      }

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
        const updatedData = dataSource.filter((item) => item.key !== key)
        updatedData.forEach((item, index) => {
          item.serialNumber = index + 1
        })
        setDataSource(updatedData)
        message.success('删除成功')
      },
    })
  }

  const handleRefresh = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      message.success('刷新成功')
    }, 500)
  }

  const handleExport = () => {
    message.success('导出功能开发中...')
  }

  const columns: ColumnsType<IntensificationPeriodPlanRecord> = [
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
      title: '星期',
      dataIndex: 'dayOfWeek',
      key: 'dayOfWeek',
      width: 80,
      align: 'center',
      render: (text) => text || '-',
    },
    {
      title: '工作内容',
      dataIndex: 'workContent',
      key: 'workContent',
      width: 250,
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
      title: '工作目标',
      dataIndex: 'workGoal',
      key: 'workGoal',
      width: 200,
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
      title: '后期跟进目标',
      dataIndex: 'followUpGoal',
      key: 'followUpGoal',
      width: 180,
      render: (text) => text || '-',
    },
    {
      title: '参与人',
      dataIndex: 'participants',
      key: 'participants',
      width: 200,
      render: (text) => text || '-',
    },
    {
      title: '组织者',
      dataIndex: 'organizer',
      key: 'organizer',
      width: 120,
      align: 'center',
      render: (text) => text || '-',
    },
    {
      title: '监督人',
      dataIndex: 'supervisor',
      key: 'supervisor',
      width: 120,
      align: 'center',
      render: (text) => text || '-',
    },
    {
      title: '评价结果',
      dataIndex: 'evaluationResult',
      key: 'evaluationResult',
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
            <ThunderboltOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
            <span>
              {selectedCampus}教化司{selectedClass}强化期计划和监督表
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
              <Option value="T4班">T4班</Option>
              <Option value="T5班">T5班</Option>
              <Option value="T6班">T6班</Option>
            </Select>
            <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
              刷新
            </Button>
            <Button icon={<DownloadOutlined />} onClick={handleExport}>
              导出
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新增记录
            </Button>
          </Space>
        }
      >
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
            <Descriptions.Item label="强化周期">
              <InputNumber
                value={intensificationPeriod}
                onChange={(value) => setIntensificationPeriod(value || 0)}
                min={0}
                suffix="天"
                style={{ width: '100%' }}
              />
            </Descriptions.Item>
            <Descriptions.Item label="毕业时间">
              <DatePicker
                value={graduationDate}
                onChange={(date) => date && setGraduationDate(date)}
                format="YYYY-MM-DD"
                size="small"
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
            placeholder="搜索工作内容/目标/组织者/监督人"
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
          scroll={{ x: 2200, y: 600 }}
          pagination={false}
          bordered
        />
      </Card>

      {/* 编辑/新增弹窗 */}
      <Modal
        title={editingRecord ? '编辑计划记录' : '新增计划记录'}
        open={isModalVisible}
        onOk={handleSave}
        onCancel={() => {
          setIsModalVisible(false)
          form.resetFields()
        }}
        width={1000}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="date"
                label="日期"
                rules={[{ required: true, message: '请选择日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="formLocation" label="形式/地点">
                <Input placeholder="例如：线上/教学平台" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="workContent"
            label="工作内容"
            rules={[{ required: true, message: '请输入工作内容' }]}
          >
            <TextArea rows={2} placeholder="请输入工作内容" />
          </Form.Item>

          <Form.Item
            name="workGoal"
            label="工作目标"
            rules={[{ required: true, message: '请输入工作目标' }]}
          >
            <TextArea rows={2} placeholder="请输入工作目标" />
          </Form.Item>

          <Form.Item
            name="howToDo"
            label="如何做"
            rules={[{ required: true, message: '请输入如何做' }]}
          >
            <TextArea rows={3} placeholder="请输入具体执行方法和步骤" />
          </Form.Item>

          <Form.Item name="actualWorkResult" label="实际工作结果">
            <TextArea rows={2} placeholder="请输入实际工作结果" />
          </Form.Item>

          <Form.Item name="followUpGoal" label="后期跟进目标">
            <TextArea rows={2} placeholder="请输入后期跟进目标" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="participants" label="参与人">
                <Input placeholder="例如：后端校长刘积家,学术何汕,教质张远平" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="organizer" label="组织者">
                <Input defaultValue={responsibleClassTeacher} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="supervisor" label="监督人">
                <Input defaultValue="刘积家" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="evaluationResult" label="评价结果">
            <TextArea rows={2} placeholder="请输入评价结果" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default CampusIntensificationPeriodPlanPage
