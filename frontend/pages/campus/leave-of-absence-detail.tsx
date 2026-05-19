import React, { useState, useEffect } from 'react'
import { App,
  Card,
  Table,
  Button,
  Space,
  Input,
  Typography,
  Row,
  Col,
  Statistic,
  Select,
  Tag,
  Modal,
  Form,
  DatePicker,
  InputNumber,
} from 'antd'
import {
  ReloadOutlined,
  DownloadOutlined,
  SearchOutlined,
  UserDeleteOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  TeamOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'

const { Title } = Typography
const { Option } = Select

// 休学明细数据接口
interface LeaveOfAbsenceRecord {
  key: string
  // 学员休学复学基本情况
  month: string // 月份
  serialNumber: number // 序号
  studentName: string // 学生姓名
  gender: string // 性别
  originalClass: string // 原班级
  originalHeadTeacher: string // 原班主任
  leaveStartDate: string // 休学开始日期
  plannedReturnDate: string // 应复学日期
  contactPhone: string // 联系电话
  actualReturnDate: string // 实复学日期
  returnClass: string // 复学班级
  returnHeadTeacher: string // 复学班级班主任

  // 学员基本情况
  enrollmentDate: string // 入学时间
  enrollmentAge: string // 入学年龄
  idCard: string // 身份证号
  consultant: string // 咨询师
  receivableTuition: number // 应收学费
  receivedTuition: number // 已收学费
  reportedMajor: string // 所报专业
  educationSystem: string // 学制
  hasRegistrationCommitment: string // 是否承诺注册学历
  registrationCommitmentDetails: string // 承诺注册学历、性质级别、名称
  hasRegistered: string // 是否已注册中专/大专
  registeredSchool: string // 所注册学校
  completedCoursesInfo: string // 已上课时数、周期时长
  completedCoursesNames: string // 所学过的课程名称
  remainingCoursesInfo: string // 剩余没学的课程名称及剩余课时数
  leaveDetailDescription: string // 学生休学情况说明（详细）
  studentParentThoughts: string // 目前学生和家长的想法（简单说结论）
  nextWorkPlan: string // 下一步对他的工作计划
  enrollmentAgreementStatus: string // 入学协议签署情况
  employmentWaiverStatement: string // 放弃就业声明
  remarks: string // 备注

  campus: string // 神殿（用于筛选，不显示在表格中）
}

// 模拟数据
const mockData: LeaveOfAbsenceRecord[] = [
  // 1月 - 记录1
  {
    key: '1',
    campus: '盛邦',
    month: '1月',
    serialNumber: 1,
    studentName: '张伟',
    gender: '男',
    originalClass: 'CS2024-01',
    originalHeadTeacher: '郭丽萍',
    leaveStartDate: '2024-01-10',
    plannedReturnDate: '2024-04-10',
    contactPhone: '13800138001',
    actualReturnDate: '2024-04-10',
    returnClass: 'CS2024-01',
    returnHeadTeacher: '郭丽萍',
    enrollmentDate: '2023-09-01',
    enrollmentAge: '18',
    idCard: '130102200605****',
    consultant: '李咨询师',
    receivableTuition: 25800,
    receivedTuition: 25800,
    reportedMajor: '计算机应用',
    educationSystem: '三年制',
    hasRegistrationCommitment: '是',
    registrationCommitmentDetails: '中专、国家承认、计算机应用',
    hasRegistered: '否',
    registeredSchool: '',
    completedCoursesInfo: '已上课200课时，周期4个月',
    completedCoursesNames: 'C语言基础、计算机组成原理',
    remainingCoursesInfo: '数据结构（80课时）、数据库原理（60课时）、Web开发（100课时）',
    leaveDetailDescription: '因家庭原因需要休学。学生父母工作调动，需要随父母到外地暂住一段时间。',
    studentParentThoughts: '家长表示会在3个月后安排好工作，让孩子按时返校复学。',
    nextWorkPlan: '定期电话回访，提前一周通知复学相关事宜。',
    enrollmentAgreementStatus: '已签署',
    employmentWaiverStatement: '未放弃',
    remarks: '已按时复学',
  },
  // 1月 - 记录2
  {
    key: '2',
    campus: '冀美',
    month: '1月',
    serialNumber: 2,
    studentName: '李明',
    gender: '男',
    originalClass: 'SOFT2024-01',
    originalHeadTeacher: '王芳',
    leaveStartDate: '2024-01-15',
    plannedReturnDate: '2024-07-15',
    contactPhone: '13800138002',
    actualReturnDate: '',
    returnClass: '',
    returnHeadTeacher: '',
    enrollmentDate: '2023-09-05',
    enrollmentAge: '17',
    idCard: '130202200706****',
    consultant: '王咨询师',
    receivableTuition: 25800,
    receivedTuition: 18000,
    reportedMajor: '软件技术',
    educationSystem: '三年制',
    hasRegistrationCommitment: '是',
    registrationCommitmentDetails: '中专、国家承认、软件技术',
    hasRegistered: '否',
    registeredSchool: '',
    completedCoursesInfo: '已上课180课时，周期4个月',
    completedCoursesNames: 'Java基础、面向对象编程',
    remainingCoursesInfo: 'Java高级（70课时）、数据库（60课时）、Web项目（120课时）',
    leaveDetailDescription: '因个人健康原因休学。学生身体状况需要静养调理，医生建议休息半年。',
    studentParentThoughts: '学生和家长都很重视学业，计划休养好后继续完成学业。',
    nextWorkPlan: '每月电话回访一次，了解恢复情况，鼓励学生坚持。',
    enrollmentAgreementStatus: '已签署',
    employmentWaiverStatement: '未放弃',
    remarks: '休学中',
  },
  // 1月 - 记录3
  {
    key: '3',
    campus: '石美',
    month: '1月',
    serialNumber: 3,
    studentName: '王芳',
    gender: '女',
    originalClass: 'NET2024-01',
    originalHeadTeacher: '刘强',
    leaveStartDate: '2024-01-20',
    plannedReturnDate: '2024-04-20',
    contactPhone: '13800138003',
    actualReturnDate: '2024-04-18',
    returnClass: 'NET2024-01',
    returnHeadTeacher: '刘强',
    enrollmentDate: '2023-09-10',
    enrollmentAge: '18',
    idCard: '130302200605****',
    consultant: '张咨询师',
    receivableTuition: 25800,
    receivedTuition: 25800,
    reportedMajor: '网络工程',
    educationSystem: '三年制',
    hasRegistrationCommitment: '是',
    registrationCommitmentDetails: '中专、国家承认、网络工程',
    hasRegistered: '否',
    registeredSchool: '',
    completedCoursesInfo: '已上课220课时，周期4个月',
    completedCoursesNames: '网络基础、计算机网络技术',
    remainingCoursesInfo: '路由交换（100课时）、网络安全（80课时）、Linux（90课时）',
    leaveDetailDescription: '因家庭突发变故休学。母亲生病住院，需要回家照顾。',
    studentParentThoughts: '家长理解孩子的孝心，会尽快安排好家务，让孩子返校学习。',
    nextWorkPlan: '定期回访，已按时复学。',
    enrollmentAgreementStatus: '已签署',
    employmentWaiverStatement: '未放弃',
    remarks: '已复学',
  },

  // 2月 - 记录1
  {
    key: '4',
    campus: '晋美',
    month: '2月',
    serialNumber: 4,
    studentName: '赵敏',
    gender: '女',
    originalClass: 'CLOUD2024-01',
    originalHeadTeacher: '赵丽',
    leaveStartDate: '2024-02-12',
    plannedReturnDate: '2024-08-12',
    contactPhone: '13800138004',
    actualReturnDate: '',
    returnClass: '',
    returnHeadTeacher: '',
    enrollmentDate: '2023-09-15',
    enrollmentAge: '17',
    idCard: '140102200706****',
    consultant: '赵咨询师',
    receivableTuition: 25800,
    receivedTuition: 20000,
    reportedMajor: '云计算',
    educationSystem: '三年制',
    hasRegistrationCommitment: '是',
    registrationCommitmentDetails: '中专、国家承认、云计算',
    hasRegistered: '否',
    registeredSchool: '',
    completedCoursesInfo: '已上课170课时，周期5个月',
    completedCoursesNames: 'Linux基础、云计算概论',
    remainingCoursesInfo: '虚拟化技术（80课时）、容器技术（70课时）、云平台管理（110课时）',
    leaveDetailDescription: '家庭经济困难需要打工赚学费。父母收入减少，家庭经济压力大。',
    studentParentThoughts: '学生计划打工半年赚取剩余学费，家长全力支持孩子完成学业。',
    nextWorkPlan: '帮助了解勤工俭学机会，保持联系，鼓励其坚持学业。',
    enrollmentAgreementStatus: '已签署',
    employmentWaiverStatement: '未放弃',
    remarks: '休学中',
  },
  // 2月 - 记录2
  {
    key: '5',
    campus: '原美',
    month: '2月',
    serialNumber: 5,
    studentName: '孙华',
    gender: '男',
    originalClass: 'NET2024-02',
    originalHeadTeacher: '孙强',
    leaveStartDate: '2024-02-18',
    plannedReturnDate: '2024-05-18',
    contactPhone: '13800138005',
    actualReturnDate: '2024-05-15',
    returnClass: 'NET2024-02',
    returnHeadTeacher: '孙强',
    enrollmentDate: '2023-09-20',
    enrollmentAge: '18',
    idCard: '130402200605****',
    consultant: '孙咨询师',
    receivableTuition: 25800,
    receivedTuition: 25800,
    reportedMajor: '网络工程',
    educationSystem: '三年制',
    hasRegistrationCommitment: '是',
    registrationCommitmentDetails: '中专、国家承认、网络工程',
    hasRegistered: '否',
    registeredSchool: '',
    completedCoursesInfo: '已上课200课时，周期5个月',
    completedCoursesNames: '网络基础、路由交换',
    remainingCoursesInfo: '网络安全（80课时）、Linux系统管理（90课时）',
    leaveDetailDescription:
      '因骨折需要住院治疗和康复。学生在体育活动中不慎受伤，医生建议休养3个月。',
    studentParentThoughts: '家长全力配合治疗，确保孩子康复后按时返校。',
    nextWorkPlan: '定期了解康复情况，已按时复学，安排补课计划。',
    enrollmentAgreementStatus: '已签署',
    employmentWaiverStatement: '未放弃',
    remarks: '已复学',
  },
  // 2月 - 记录3
  {
    key: '6',
    campus: '太美',
    month: '2月',
    serialNumber: 6,
    studentName: '周杰',
    gender: '男',
    originalClass: 'SOFT2024-02',
    originalHeadTeacher: '周明',
    leaveStartDate: '2024-02-25',
    plannedReturnDate: '2024-08-25',
    contactPhone: '13800138006',
    actualReturnDate: '',
    returnClass: '',
    returnHeadTeacher: '',
    enrollmentDate: '2023-09-25',
    enrollmentAge: '17',
    idCard: '130502200706****',
    consultant: '周咨询师',
    receivableTuition: 25800,
    receivedTuition: 22000,
    reportedMajor: '软件技术',
    educationSystem: '三年制',
    hasRegistrationCommitment: '是',
    registrationCommitmentDetails: '中专、国家承认、软件技术',
    hasRegistered: '否',
    registeredSchool: '',
    completedCoursesInfo: '已上课160课时，周期5个月',
    completedCoursesNames: 'Java基础、面向对象编程',
    remainingCoursesInfo: 'Java高级（70课时）、数据库（60课时）、Web项目（120课时）',
    leaveDetailDescription:
      '个人原因需要调整学习状态。学生反映对专业学习兴趣下降，需要时间重新规划。',
    studentParentThoughts: '学生希望利用休学期间思考职业规划，家长尊重孩子的选择。',
    nextWorkPlan: '定期沟通，提供职业规划指导，引导其重拾学习信心。',
    enrollmentAgreementStatus: '已签署',
    employmentWaiverStatement: '未放弃',
    remarks: '休学中',
  },

  // 3月 - 记录1
  {
    key: '7',
    campus: '桂美',
    month: '3月',
    serialNumber: 7,
    studentName: '吴芳',
    gender: '女',
    originalClass: 'NET2024-03',
    originalHeadTeacher: '吴丽',
    leaveStartDate: '2024-03-05',
    plannedReturnDate: '2024-09-05',
    contactPhone: '13800138007',
    actualReturnDate: '2024-09-01',
    returnClass: 'NET2024-03',
    returnHeadTeacher: '吴丽',
    enrollmentDate: '2023-09-01',
    enrollmentAge: '18',
    idCard: '130602200605****',
    consultant: '吴咨询师',
    receivableTuition: 14800,
    receivedTuition: 14800,
    reportedMajor: '网络工程',
    educationSystem: '三年制',
    hasRegistrationCommitment: '是',
    registrationCommitmentDetails: '中专、国家承认、网络工程',
    hasRegistered: '否',
    registeredSchool: '',
    completedCoursesInfo: '已上课220课时，周期6个月',
    completedCoursesNames: '网络基础、路由交换',
    remainingCoursesInfo: '网络安全（80课时）、Linux系统管理（90课时）',
    leaveDetailDescription: '家庭变故需要照顾家人。母亲生病需要照顾，学生表示需要回家半年。',
    studentParentThoughts: '家长理解学校政策，会尽快安排好家务，让孩子按时复学。',
    nextWorkPlan: '已按时复学，继续跟进学习进度。',
    enrollmentAgreementStatus: '已签署',
    employmentWaiverStatement: '未放弃',
    remarks: '已复学',
  },
  // 3月 - 记录2
  {
    key: '8',
    campus: '盛邦',
    month: '3月',
    serialNumber: 8,
    studentName: '郑强',
    gender: '男',
    originalClass: 'CS2024-02',
    originalHeadTeacher: '郭丽萍',
    leaveStartDate: '2024-03-12',
    plannedReturnDate: '2024-06-12',
    contactPhone: '13800138008',
    actualReturnDate: '2024-06-10',
    returnClass: 'CS2024-02',
    returnHeadTeacher: '郭丽萍',
    enrollmentDate: '2024-02-20',
    enrollmentAge: '18',
    idCard: '130104200605****',
    consultant: '郑咨询师',
    receivableTuition: 25800,
    receivedTuition: 25800,
    reportedMajor: '计算机应用',
    educationSystem: '三年制',
    hasRegistrationCommitment: '是',
    registrationCommitmentDetails: '中专、国家承认、计算机应用',
    hasRegistered: '否',
    registeredSchool: '',
    completedCoursesInfo: '已上课100课时，周期3个月',
    completedCoursesNames: 'C语言基础',
    remainingCoursesInfo:
      '组成原理（60课时）、数据结构（80课时）、操作系统（70课时）、数据库（60课时）',
    leaveDetailDescription: '突发急病住院。学生因急性阑尾炎住院，需要手术治疗和康复。',
    studentParentThoughts: '家长非常重视教育，会确保孩子康复后继续学业。',
    nextWorkPlan: '已按时复学，安排补课，帮助尽快跟上进度。',
    enrollmentAgreementStatus: '已签署',
    employmentWaiverStatement: '未放弃',
    remarks: '已复学',
  },
  // 3月 - 记录3
  {
    key: '9',
    campus: '冀美',
    month: '3月',
    serialNumber: 9,
    studentName: '王芳芳',
    gender: '女',
    originalClass: 'SOFT2024-01',
    originalHeadTeacher: '王芳',
    leaveStartDate: '2024-03-20',
    plannedReturnDate: '2024-09-20',
    contactPhone: '13800138009',
    actualReturnDate: '',
    returnClass: '',
    returnHeadTeacher: '',
    enrollmentDate: '2024-01-01',
    enrollmentAge: '17',
    idCard: '130204200706****',
    consultant: '王咨询',
    receivableTuition: 25800,
    receivedTuition: 15000,
    reportedMajor: '软件技术',
    educationSystem: '三年制',
    hasRegistrationCommitment: '是',
    registrationCommitmentDetails: '中专、国家承认、软件技术',
    hasRegistered: '否',
    registeredSchool: '',
    completedCoursesInfo: '已上课80课时，周期2个月',
    completedCoursesNames: 'Java基础',
    remainingCoursesInfo: 'Java高级（70课时）、数据库（60课时）、Web项目（120课时）',
    leaveDetailDescription: '经济困难需打工赚学费。家庭收入不足，需要打工赚取剩余学费。',
    studentParentThoughts: '学生计划打工半年，家长支持孩子完成学业。',
    nextWorkPlan: '帮助了解兼职机会，保持联系，鼓励坚持学业。',
    enrollmentAgreementStatus: '已签署',
    employmentWaiverStatement: '未放弃',
    remarks: '休学中',
  },

  // 4月 - 记录1
  {
    key: '10',
    campus: '石美',
    month: '4月',
    serialNumber: 10,
    studentName: '刘洋',
    gender: '男',
    originalClass: 'SOFT2024-03',
    originalHeadTeacher: '刘强',
    leaveStartDate: '2024-04-10',
    plannedReturnDate: '2024-10-10',
    contactPhone: '13800138010',
    actualReturnDate: '',
    returnClass: '',
    returnHeadTeacher: '',
    enrollmentDate: '2024-01-10',
    enrollmentAge: '18',
    idCard: '130304200605****',
    consultant: '刘咨询',
    receivableTuition: 25800,
    receivedTuition: 20000,
    reportedMajor: '软件技术',
    educationSystem: '三年制',
    hasRegistrationCommitment: '是',
    registrationCommitmentDetails: '中专、国家承认、软件技术',
    hasRegistered: '否',
    registeredSchool: '',
    completedCoursesInfo: '已上课110课时，周期3个月',
    completedCoursesNames: 'Java基础',
    remainingCoursesInfo: 'Java高级（70课时）、数据库（60课时）、Web项目（120课时）',
    leaveDetailDescription: '心理压力需要调整。学生学习压力大，需要时间调整心态。',
    studentParentThoughts: '家长支持孩子休学调整，希望重新找回学习状态。',
    nextWorkPlan: '定期关注心理状态，提供疏导，鼓励按时复学。',
    enrollmentAgreementStatus: '已签署',
    employmentWaiverStatement: '未放弃',
    remarks: '休学中',
  },
  // 4月 - 记录2
  {
    key: '11',
    campus: '晋美',
    month: '4月',
    serialNumber: 11,
    studentName: '陈美',
    gender: '女',
    originalClass: 'NET2024-04',
    originalHeadTeacher: '赵丽',
    leaveStartDate: '2024-04-15',
    plannedReturnDate: '2024-07-15',
    contactPhone: '13800138011',
    actualReturnDate: '2024-07-12',
    returnClass: 'NET2024-04',
    returnHeadTeacher: '赵丽',
    enrollmentDate: '2024-01-15',
    enrollmentAge: '17',
    idCard: '140104200706****',
    consultant: '陈咨询',
    receivableTuition: 25800,
    receivedTuition: 25800,
    reportedMajor: '网络工程',
    educationSystem: '三年制',
    hasRegistrationCommitment: '是',
    registrationCommitmentDetails: '中专、国家承认、网络工程',
    hasRegistered: '否',
    registeredSchool: '',
    completedCoursesInfo: '已上课130课时，周期3个月',
    completedCoursesNames: '网络基础、计算机网络技术',
    remainingCoursesInfo: '路由交换（100课时）、网络安全（80课时）、Linux（90课时）',
    leaveDetailDescription: '家人生病需要照顾。父亲突发疾病，需要回家照顾3个月。',
    studentParentThoughts: '家长表示会尽快安排好，让孩子按时复学。',
    nextWorkPlan: '已按时复学，继续跟进学习。',
    enrollmentAgreementStatus: '已签署',
    employmentWaiverStatement: '未放弃',
    remarks: '已复学',
  },
  // 4月 - 记录3
  {
    key: '12',
    campus: '原美',
    month: '4月',
    serialNumber: 12,
    studentName: '杨帆',
    gender: '男',
    originalClass: 'CLOUD2024-03',
    originalHeadTeacher: '孙强',
    leaveStartDate: '2024-04-20',
    plannedReturnDate: '2024-10-20',
    contactPhone: '13800138012',
    actualReturnDate: '',
    returnClass: '',
    returnHeadTeacher: '',
    enrollmentDate: '2024-01-20',
    enrollmentAge: '18',
    idCard: '130404200605****',
    consultant: '杨咨询',
    receivableTuition: 25800,
    receivedTuition: 18000,
    reportedMajor: '云计算',
    educationSystem: '三年制',
    hasRegistrationCommitment: '是',
    registrationCommitmentDetails: '中专、国家承认、云计算',
    hasRegistered: '否',
    registeredSchool: '',
    completedCoursesInfo: '已上课140课时，周期3个月',
    completedCoursesNames: 'Linux基础、云计算概论',
    remainingCoursesInfo: '虚拟化（80课时）、容器（70课时）、云平台（110课时）',
    leaveDetailDescription: '个人规划需要调整。学生对当前专业不太适应，需要时间重新思考。',
    studentParentThoughts: '学生希望休学期间深入了解专业，家长支持孩子的决定。',
    nextWorkPlan: '提供专业咨询，引导其明确职业方向，鼓励坚持学业。',
    enrollmentAgreementStatus: '已签署',
    employmentWaiverStatement: '未放弃',
    remarks: '休学中',
  },

  // 5月 - 记录1
  {
    key: '13',
    campus: '盛邦',
    month: '5月',
    serialNumber: 13,
    studentName: '黄磊',
    gender: '男',
    originalClass: 'CS2024-03',
    originalHeadTeacher: '郭丽萍',
    leaveStartDate: '2024-05-08',
    plannedReturnDate: '2024-08-08',
    contactPhone: '13800138013',
    actualReturnDate: '2024-08-05',
    returnClass: 'CS2024-03',
    returnHeadTeacher: '郭丽萍',
    enrollmentDate: '2023-09-20',
    enrollmentAge: '18',
    idCard: '130105200605****',
    consultant: '黄咨询师',
    receivableTuition: 25800,
    receivedTuition: 25800,
    reportedMajor: '计算机应用',
    educationSystem: '三年制',
    hasRegistrationCommitment: '是',
    registrationCommitmentDetails: '中专、国家承认、计算机应用',
    hasRegistered: '否',
    registeredSchool: '',
    completedCoursesInfo: '已上课240课时，周期8个月',
    completedCoursesNames: 'C语言、数据结构、操作系统',
    remainingCoursesInfo: '数据库（60课时）、Web开发（100课时）',
    leaveDetailDescription: '因疾病需要住院治疗。学生突发急性阑尾炎，需要手术治疗和康复。',
    studentParentThoughts: '家长表示会全力配合治疗，确保孩子康复后按时复学。',
    nextWorkPlan: '已按时复学，安排补课计划。',
    enrollmentAgreementStatus: '已签署',
    employmentWaiverStatement: '未放弃',
    remarks: '已复学',
  },
  // 5月 - 记录2
  {
    key: '14',
    campus: '冀美',
    month: '5月',
    serialNumber: 14,
    studentName: '林娜',
    gender: '女',
    originalClass: 'SOFT2024-02',
    originalHeadTeacher: '王芳',
    leaveStartDate: '2024-05-12',
    plannedReturnDate: '2024-11-12',
    contactPhone: '13800138014',
    actualReturnDate: '',
    returnClass: '',
    returnHeadTeacher: '',
    enrollmentDate: '2024-01-05',
    enrollmentAge: '17',
    idCard: '130205200706****',
    consultant: '林咨询师',
    receivableTuition: 25800,
    receivedTuition: 16000,
    reportedMajor: '软件技术',
    educationSystem: '三年制',
    hasRegistrationCommitment: '是',
    registrationCommitmentDetails: '中专、国家承认、软件技术',
    hasRegistered: '否',
    registeredSchool: '',
    completedCoursesInfo: '已上课90课时，周期4个月',
    completedCoursesNames: 'Java基础',
    remainingCoursesInfo: 'Java高级（70课时）、数据库（60课时）、Web项目（120课时）',
    leaveDetailDescription: '家庭经济困难需打工赚学费。家庭突遭变故，需要赚取剩余学费。',
    studentParentThoughts: '学生计划打工半年赚学费，家长支持孩子完成学业。',
    nextWorkPlan: '帮助了解兼职机会，保持联系，鼓励坚持学业。',
    enrollmentAgreementStatus: '已签署',
    employmentWaiverStatement: '未放弃',
    remarks: '休学中',
  },
  // 5月 - 记录3
  {
    key: '15',
    campus: '石美',
    month: '5月',
    serialNumber: 15,
    studentName: '马强',
    gender: '男',
    originalClass: 'NET2024-02',
    originalHeadTeacher: '刘强',
    leaveStartDate: '2024-05-20',
    plannedReturnDate: '2024-09-20',
    contactPhone: '13800138015',
    actualReturnDate: '',
    returnClass: '',
    returnHeadTeacher: '',
    enrollmentDate: '2024-01-10',
    enrollmentAge: '18',
    idCard: '130305200605****',
    consultant: '马咨询师',
    receivableTuition: 25800,
    receivedTuition: 25800,
    reportedMajor: '网络工程',
    educationSystem: '三年制',
    hasRegistrationCommitment: '是',
    registrationCommitmentDetails: '中专、国家承认、网络工程',
    hasRegistered: '否',
    registeredSchool: '',
    completedCoursesInfo: '已上课100课时，周期4个月',
    completedCoursesNames: '网络基础',
    remainingCoursesInfo: '路由交换（100课时）、网络安全（80课时）、Linux（90课时）',
    leaveDetailDescription: '心理压力需要调整。学生学习适应困难，需要时间调整。',
    studentParentThoughts: '家长支持孩子休学调整，希望重拾学习信心。',
    nextWorkPlan: '定期关注心理状态，提供心理疏导。',
    enrollmentAgreementStatus: '已签署',
    employmentWaiverStatement: '未放弃',
    remarks: '休学中',
  },

  // 6月 - 记录1
  {
    key: '16',
    campus: '原美',
    month: '6月',
    serialNumber: 16,
    studentName: '何洁',
    gender: '女',
    originalClass: 'CLOUD2024-02',
    originalHeadTeacher: '孙强',
    leaveStartDate: '2024-06-05',
    plannedReturnDate: '2024-09-05',
    contactPhone: '13800138016',
    actualReturnDate: '2024-09-01',
    returnClass: 'CLOUD2024-02',
    returnHeadTeacher: '孙强',
    enrollmentDate: '2024-01-15',
    enrollmentAge: '17',
    idCard: '130405200706****',
    consultant: '何咨询师',
    receivableTuition: 25800,
    receivedTuition: 25800,
    reportedMajor: '云计算',
    educationSystem: '三年制',
    hasRegistrationCommitment: '是',
    registrationCommitmentDetails: '中专、国家承认、云计算',
    hasRegistered: '否',
    registeredSchool: '',
    completedCoursesInfo: '已上课120课时，周期5个月',
    completedCoursesNames: 'Linux基础、云计算概论',
    remainingCoursesInfo: '虚拟化（80课时）、容器（70课时）、云平台（110课时）',
    leaveDetailDescription: '因疾病住院治疗。学生突发急性胃炎，需要住院治疗和调养。',
    studentParentThoughts: '家长全力配合治疗，确保孩子康复后按时返校。',
    nextWorkPlan: '已按时复学，安排补课。',
    enrollmentAgreementStatus: '已签署',
    employmentWaiverStatement: '未放弃',
    remarks: '已复学',
  },
  // 6月 - 记录2
  {
    key: '17',
    campus: '太美',
    month: '6月',
    serialNumber: 17,
    studentName: '周杰',
    gender: '男',
    originalClass: 'SOFT2024-02',
    originalHeadTeacher: '周明',
    leaveStartDate: '2024-06-12',
    plannedReturnDate: '2024-12-12',
    contactPhone: '13800138017',
    actualReturnDate: '',
    returnClass: '',
    returnHeadTeacher: '',
    enrollmentDate: '2023-09-25',
    enrollmentAge: '17',
    idCard: '130502200706****',
    consultant: '周咨询师',
    receivableTuition: 25800,
    receivedTuition: 22000,
    reportedMajor: '软件技术',
    educationSystem: '三年制',
    hasRegistrationCommitment: '是',
    registrationCommitmentDetails: '中专、国家承认、软件技术',
    hasRegistered: '否',
    registeredSchool: '',
    completedCoursesInfo: '已上课260课时，周期9个月',
    completedCoursesNames: 'Java基础、Java高级、数据库应用',
    remainingCoursesInfo: 'Web项目实战（120课时）',
    leaveDetailDescription:
      '个人原因需要调整学习状态。学生反映对专业学习兴趣下降，需要时间重新规划。',
    studentParentThoughts: '学生希望利用休学期间思考职业规划，家长尊重孩子的选择。',
    nextWorkPlan: '定期沟通，提供职业规划指导，引导其重拾学习信心。',
    enrollmentAgreementStatus: '已签署',
    employmentWaiverStatement: '未放弃',
    remarks: '休学中',
  },
  // 6月 - 记录3
  {
    key: '18',
    campus: '桂美',
    month: '6月',
    serialNumber: 18,
    studentName: '杜鹏',
    gender: '男',
    originalClass: 'CS2024-05',
    originalHeadTeacher: '吴丽',
    leaveStartDate: '2024-06-25',
    plannedReturnDate: '2024-09-25',
    contactPhone: '13800138018',
    actualReturnDate: '',
    returnClass: '',
    returnHeadTeacher: '',
    enrollmentDate: '2024-01-20',
    enrollmentAge: '18',
    idCard: '130603200605****',
    consultant: '杜咨询师',
    receivableTuition: 14800,
    receivedTuition: 14800,
    reportedMajor: '计算机应用',
    educationSystem: '三年制',
    hasRegistrationCommitment: '是',
    registrationCommitmentDetails: '中专、国家承认、计算机应用',
    hasRegistered: '否',
    registeredSchool: '',
    completedCoursesInfo: '已上课110课时，周期5个月',
    completedCoursesNames: 'C语言基础',
    remainingCoursesInfo:
      '组成原理（60课时）、数据结构（80课时）、操作系统（70课时）、数据库（60课时）',
    leaveDetailDescription: '心理压力需要调整。学生学习压力大，需要时间调整心态。',
    studentParentThoughts: '家长支持孩子休学调整，希望重拾学习信心。',
    nextWorkPlan: '定期关注心理状态，提供疏导。',
    enrollmentAgreementStatus: '已签署',
    employmentWaiverStatement: '未放弃',
    remarks: '休学中',
  },

  // 7月 - 记录1
  {
    key: '19',
    campus: '冀美',
    month: '7月',
    serialNumber: 19,
    studentName: '许芳',
    gender: '女',
    originalClass: 'NET2024-05',
    originalHeadTeacher: '王芳',
    leaveStartDate: '2024-07-05',
    plannedReturnDate: '2025-01-05',
    contactPhone: '13800138019',
    actualReturnDate: '',
    returnClass: '',
    returnHeadTeacher: '',
    enrollmentDate: '2024-01-25',
    enrollmentAge: '17',
    idCard: '130206200706****',
    consultant: '许咨询师',
    receivableTuition: 14800,
    receivedTuition: 14800,
    reportedMajor: '网络工程',
    educationSystem: '三年制',
    hasRegistrationCommitment: '是',
    registrationCommitmentDetails: '中专、国家承认、网络工程',
    hasRegistered: '否',
    registeredSchool: '',
    completedCoursesInfo: '已上课130课时，周期5.5个月',
    completedCoursesNames: '网络基础、路由交换',
    remainingCoursesInfo: '网络安全（80课时）、Linux系统管理（90课时）',
    leaveDetailDescription: '家庭变故需要照顾家人。母亲生病需要照顾，学生表示需要回家半年。',
    studentParentThoughts: '家长理解学校政策，会尽快安排好家务，让孩子按时复学。',
    nextWorkPlan: '每月回访一次，了解家庭情况，鼓励学生坚持完成学业。',
    enrollmentAgreementStatus: '已签署',
    employmentWaiverStatement: '未放弃',
    remarks: '休学中',
  },
  // 7月 - 记录2
  {
    key: '20',
    campus: '石美',
    month: '7月',
    serialNumber: 20,
    studentName: '姜涛',
    gender: '男',
    originalClass: 'CS2024-06',
    originalHeadTeacher: '刘强',
    leaveStartDate: '2024-07-12',
    plannedReturnDate: '2024-10-12',
    contactPhone: '13800138020',
    actualReturnDate: '',
    returnClass: '',
    returnHeadTeacher: '',
    enrollmentDate: '2024-02-01',
    enrollmentAge: '18',
    idCard: '130306200605****',
    consultant: '姜咨询师',
    receivableTuition: 25800,
    receivedTuition: 20000,
    reportedMajor: '计算机应用',
    educationSystem: '三年制',
    hasRegistrationCommitment: '是',
    registrationCommitmentDetails: '中专、国家承认、计算机应用',
    hasRegistered: '否',
    registeredSchool: '',
    completedCoursesInfo: '已上课120课时，周期5个月',
    completedCoursesNames: 'C语言基础',
    remainingCoursesInfo:
      '组成原理（60课时）、数据结构（80课时）、操作系统（70课时）、数据库（60课时）',
    leaveDetailDescription: '经济困难需打工赚学费。家庭收入减少，需要打工赚取剩余学费。',
    studentParentThoughts: '学生计划打工3个月赚学费，家长支持孩子完成学业。',
    nextWorkPlan: '帮助了解兼职机会，保持联系，鼓励坚持学业。',
    enrollmentAgreementStatus: '已签署',
    employmentWaiverStatement: '未放弃',
    remarks: '休学中',
  },
  // 7月 - 记录3
  {
    key: '21',
    campus: '晋美',
    month: '7月',
    serialNumber: 21,
    studentName: '唐艳',
    gender: '女',
    originalClass: 'SOFT2024-04',
    originalHeadTeacher: '赵丽',
    leaveStartDate: '2024-07-20',
    plannedReturnDate: '2024-10-20',
    contactPhone: '13800138021',
    actualReturnDate: '2024-10-18',
    returnClass: 'SOFT2024-04',
    returnHeadTeacher: '赵丽',
    enrollmentDate: '2024-02-05',
    enrollmentAge: '17',
    idCard: '140105200706****',
    consultant: '唐咨询师',
    receivableTuition: 25800,
    receivedTuition: 25800,
    reportedMajor: '软件技术',
    educationSystem: '三年制',
    hasRegistrationCommitment: '是',
    registrationCommitmentDetails: '中专、国家承认、软件技术',
    hasRegistered: '否',
    registeredSchool: '',
    completedCoursesInfo: '已上课115课时，周期5个月',
    completedCoursesNames: 'Java基础',
    remainingCoursesInfo: 'Java高级（70课时）、数据库（60课时）、Web项目（120课时）',
    leaveDetailDescription: '因疾病住院治疗。学生突发阑尾炎，需要手术和康复。',
    studentParentThoughts: '家长全力配合治疗，确保孩子康复后按时返校。',
    nextWorkPlan: '已按时复学，安排补课计划。',
    enrollmentAgreementStatus: '已签署',
    employmentWaiverStatement: '未放弃',
    remarks: '已复学',
  },

  // 8月 - 记录1
  {
    key: '22',
    campus: '太美',
    month: '8月',
    serialNumber: 22,
    studentName: '吕强',
    gender: '男',
    originalClass: 'CLOUD2024-04',
    originalHeadTeacher: '周明',
    leaveStartDate: '2024-08-05',
    plannedReturnDate: '2024-11-05',
    contactPhone: '13800138022',
    actualReturnDate: '2024-11-01',
    returnClass: 'CLOUD2024-04',
    returnHeadTeacher: '周明',
    enrollmentDate: '2024-02-20',
    enrollmentAge: '18',
    idCard: '130503200605****',
    consultant: '吕咨询师',
    receivableTuition: 25800,
    receivedTuition: 25800,
    reportedMajor: '云计算',
    educationSystem: '三年制',
    hasRegistrationCommitment: '是',
    registrationCommitmentDetails: '中专、国家承认、云计算',
    hasRegistered: '否',
    registeredSchool: '',
    completedCoursesInfo: '已上课120课时，周期6个月',
    completedCoursesNames: 'Linux基础、云计算概论',
    remainingCoursesInfo: '虚拟化（80课时）、容器（70课时）、云平台（110课时）',
    leaveDetailDescription: '突发急病住院。学生因急性肺炎住院，需要治疗和康复。',
    studentParentThoughts: '家长非常重视教育，会确保孩子康复后继续学业。',
    nextWorkPlan: '已提前复学，安排补课，帮助尽快跟上进度。',
    enrollmentAgreementStatus: '已签署',
    employmentWaiverStatement: '未放弃',
    remarks: '已复学',
  },
  // 8月 - 记录2
  {
    key: '23',
    campus: '桂美',
    month: '8月',
    serialNumber: 23,
    studentName: '宋丽',
    gender: '女',
    originalClass: 'SOFT2024-05',
    originalHeadTeacher: '吴丽',
    leaveStartDate: '2024-08-12',
    plannedReturnDate: '2025-02-12',
    contactPhone: '13800138023',
    actualReturnDate: '',
    returnClass: '',
    returnHeadTeacher: '',
    enrollmentDate: '2024-02-25',
    enrollmentAge: '17',
    idCard: '130604200706****',
    consultant: '宋咨询师',
    receivableTuition: 25800,
    receivedTuition: 16000,
    reportedMajor: '软件技术',
    educationSystem: '三年制',
    hasRegistrationCommitment: '是',
    registrationCommitmentDetails: '中专、国家承认、软件技术',
    hasRegistered: '否',
    registeredSchool: '',
    completedCoursesInfo: '已上课105课时，周期5.5个月',
    completedCoursesNames: 'Java基础',
    remainingCoursesInfo: 'Java高级（70课时）、数据库（60课时）、Web项目（120课时）',
    leaveDetailDescription: '经济困难需打工赚学费。家庭收入不足，需要打工赚取剩余学费。',
    studentParentThoughts: '学生计划打工半年赚学费，家长支持孩子完成学业。',
    nextWorkPlan: '帮助了解兼职机会，保持联系，鼓励坚持学业。',
    enrollmentAgreementStatus: '已签署',
    employmentWaiverStatement: '未放弃',
    remarks: '休学中',
  },
  // 8月 - 记录3
  {
    key: '24',
    campus: '盛邦',
    month: '8月',
    serialNumber: 24,
    studentName: '谢军',
    gender: '男',
    originalClass: 'NET2024-06',
    originalHeadTeacher: '郭丽萍',
    leaveStartDate: '2024-08-20',
    plannedReturnDate: '2024-11-20',
    contactPhone: '13800138024',
    actualReturnDate: '',
    returnClass: '',
    returnHeadTeacher: '',
    enrollmentDate: '2024-03-01',
    enrollmentAge: '18',
    idCard: '130106200605****',
    consultant: '谢咨询师',
    receivableTuition: 25800,
    receivedTuition: 25800,
    reportedMajor: '网络工程',
    educationSystem: '三年制',
    hasRegistrationCommitment: '是',
    registrationCommitmentDetails: '中专、国家承认、网络工程',
    hasRegistered: '否',
    registeredSchool: '',
    completedCoursesInfo: '已上课95课时，周期5个月',
    completedCoursesNames: '网络基础',
    remainingCoursesInfo: '路由交换（100课时）、网络安全（80课时）、Linux（90课时）',
    leaveDetailDescription: '心理压力需要调整。学生学习压力大，需要时间调整心态。',
    studentParentThoughts: '家长支持孩子休学调整，希望重拾学习信心。',
    nextWorkPlan: '定期关注心理状态，提供疏导。',
    enrollmentAgreementStatus: '已签署',
    employmentWaiverStatement: '未放弃',
    remarks: '休学中',
  },

  // 9月 - 记录1
  {
    key: '25',
    campus: '石美',
    month: '9月',
    serialNumber: 25,
    studentName: '韩梅',
    gender: '女',
    originalClass: 'CS2024-07',
    originalHeadTeacher: '刘强',
    leaveStartDate: '2024-09-05',
    plannedReturnDate: '2025-03-05',
    contactPhone: '13800138025',
    actualReturnDate: '',
    returnClass: '',
    returnHeadTeacher: '',
    enrollmentDate: '2024-03-01',
    enrollmentAge: '17',
    idCard: '130307200706****',
    consultant: '韩咨询师',
    receivableTuition: 25800,
    receivedTuition: 15000,
    reportedMajor: '计算机应用',
    educationSystem: '三年制',
    hasRegistrationCommitment: '是',
    registrationCommitmentDetails: '中专、国家承认、计算机应用',
    hasRegistered: '否',
    registeredSchool: '',
    completedCoursesInfo: '已上课100课时，周期6个月',
    completedCoursesNames: 'C语言基础',
    remainingCoursesInfo:
      '组成原理（60课时）、数据结构（80课时）、操作系统（70课时）、数据库（60课时）',
    leaveDetailDescription: '经济困难需打工赚学费。家庭收入不足，需要打工赚取剩余学费。',
    studentParentThoughts: '学生计划打工半年，家长支持孩子完成学业。',
    nextWorkPlan: '帮助了解兼职机会，保持联系，鼓励坚持学业。',
    enrollmentAgreementStatus: '已签署',
    employmentWaiverStatement: '未放弃',
    remarks: '休学中',
  },
  // 9月 - 记录2
  {
    key: '26',
    campus: '晋美',
    month: '9月',
    serialNumber: 26,
    studentName: '邓涛',
    gender: '男',
    originalClass: 'CLOUD2024-05',
    originalHeadTeacher: '赵丽',
    leaveStartDate: '2024-09-12',
    plannedReturnDate: '2024-12-12',
    contactPhone: '13800138026',
    actualReturnDate: '2024-12-10',
    returnClass: 'CLOUD2024-05',
    returnHeadTeacher: '赵丽',
    enrollmentDate: '2024-03-05',
    enrollmentAge: '18',
    idCard: '140106200605****',
    consultant: '邓咨询师',
    receivableTuition: 25800,
    receivedTuition: 25800,
    reportedMajor: '云计算',
    educationSystem: '三年制',
    hasRegistrationCommitment: '是',
    registrationCommitmentDetails: '中专、国家承认、云计算',
    hasRegistered: '否',
    registeredSchool: '',
    completedCoursesInfo: '已上课110课时，周期6个月',
    completedCoursesNames: 'Linux基础、云计算概论',
    remainingCoursesInfo: '虚拟化（80课时）、容器（70课时）、云平台（110课时）',
    leaveDetailDescription: '因疾病住院治疗。学生突发急病，需要住院治疗和康复。',
    studentParentThoughts: '家长全力配合治疗，确保孩子康复后按时返校。',
    nextWorkPlan: '已按时复学，安排补课。',
    enrollmentAgreementStatus: '已签署',
    employmentWaiverStatement: '未放弃',
    remarks: '已复学',
  },
  // 9月 - 记录3
  {
    key: '27',
    campus: '原美',
    month: '9月',
    serialNumber: 27,
    studentName: '曾丽',
    gender: '女',
    originalClass: 'SOFT2024-06',
    originalHeadTeacher: '孙强',
    leaveStartDate: '2024-09-20',
    plannedReturnDate: '2025-03-20',
    contactPhone: '13800138027',
    actualReturnDate: '',
    returnClass: '',
    returnHeadTeacher: '',
    enrollmentDate: '2024-03-10',
    enrollmentAge: '17',
    idCard: '130406200706****',
    consultant: '曾咨询师',
    receivableTuition: 25800,
    receivedTuition: 18000,
    reportedMajor: '软件技术',
    educationSystem: '三年制',
    hasRegistrationCommitment: '是',
    registrationCommitmentDetails: '中专、国家承认、软件技术',
    hasRegistered: '否',
    registeredSchool: '',
    completedCoursesInfo: '已上课105课时，周期6个月',
    completedCoursesNames: 'Java基础',
    remainingCoursesInfo: 'Java高级（70课时）、数据库（60课时）、Web项目（120课时）',
    leaveDetailDescription: '心理压力需要调整。学生学习压力大，需要时间调整心态。',
    studentParentThoughts: '家长支持孩子休学调整，希望重拾学习信心。',
    nextWorkPlan: '定期关注心理状态，提供疏导。',
    enrollmentAgreementStatus: '已签署',
    employmentWaiverStatement: '未放弃',
    remarks: '休学中',
  },

  // 10月 - 记录1
  {
    key: '28',
    campus: '桂美',
    month: '10月',
    serialNumber: 28,
    studentName: '彭飞',
    gender: '男',
    originalClass: 'NET2024-07',
    originalHeadTeacher: '吴丽',
    leaveStartDate: '2024-10-05',
    plannedReturnDate: '2025-04-05',
    contactPhone: '13800138028',
    actualReturnDate: '',
    returnClass: '',
    returnHeadTeacher: '',
    enrollmentDate: '2024-03-15',
    enrollmentAge: '18',
    idCard: '130605200605****',
    consultant: '彭咨询师',
    receivableTuition: 25800,
    receivedTuition: 20000,
    reportedMajor: '网络工程',
    educationSystem: '三年制',
    hasRegistrationCommitment: '是',
    registrationCommitmentDetails: '中专、国家承认、网络工程',
    hasRegistered: '否',
    registeredSchool: '',
    completedCoursesInfo: '已上课110课时，周期7个月',
    completedCoursesNames: '网络基础、路由交换',
    remainingCoursesInfo: '网络安全（80课时）、Linux（90课时）',
    leaveDetailDescription: '心理压力需要调整。学生学习压力大，需要时间调整心态。',
    studentParentThoughts: '家长支持孩子休学调整，希望重新找回学习状态。',
    nextWorkPlan: '定期关注心理状态，提供疏导，鼓励按时复学。',
    enrollmentAgreementStatus: '已签署',
    employmentWaiverStatement: '未放弃',
    remarks: '休学中',
  },
  // 10月 - 记录2
  {
    key: '29',
    campus: '盛邦',
    month: '10月',
    serialNumber: 29,
    studentName: '范静',
    gender: '女',
    originalClass: 'CS2024-08',
    originalHeadTeacher: '郭丽萍',
    leaveStartDate: '2024-10-12',
    plannedReturnDate: '2025-01-12',
    contactPhone: '13800138029',
    actualReturnDate: '',
    returnClass: '',
    returnHeadTeacher: '',
    enrollmentDate: '2024-03-20',
    enrollmentAge: '17',
    idCard: '130107200706****',
    consultant: '范咨询师',
    receivableTuition: 25800,
    receivedTuition: 25800,
    reportedMajor: '计算机应用',
    educationSystem: '三年制',
    hasRegistrationCommitment: '是',
    registrationCommitmentDetails: '中专、国家承认、计算机应用',
    hasRegistered: '否',
    registeredSchool: '',
    completedCoursesInfo: '已上课105课时，周期7个月',
    completedCoursesNames: 'C语言基础、组成原理',
    remainingCoursesInfo: '数据结构（80课时）、操作系统（70课时）、数据库（60课时）',
    leaveDetailDescription: '家庭变故需要照顾家人。父母有事，需要回家照顾。',
    studentParentThoughts: '家长理解学校政策，会尽快安排好家务，让孩子按时复学。',
    nextWorkPlan: '每月回访，了解家庭情况。',
    enrollmentAgreementStatus: '已签署',
    employmentWaiverStatement: '未放弃',
    remarks: '休学中',
  },
  // 10月 - 记录3
  {
    key: '30',
    campus: '冀美',
    month: '10月',
    serialNumber: 30,
    studentName: '曹强',
    gender: '男',
    originalClass: 'SOFT2024-07',
    originalHeadTeacher: '王芳',
    leaveStartDate: '2024-10-20',
    plannedReturnDate: '2025-02-20',
    contactPhone: '13800138030',
    actualReturnDate: '',
    returnClass: '',
    returnHeadTeacher: '',
    enrollmentDate: '2024-03-25',
    enrollmentAge: '18',
    idCard: '130207200605****',
    consultant: '曹咨询师',
    receivableTuition: 25800,
    receivedTuition: 17000,
    reportedMajor: '软件技术',
    educationSystem: '三年制',
    hasRegistrationCommitment: '是',
    registrationCommitmentDetails: '中专、国家承认、软件技术',
    hasRegistered: '否',
    registeredSchool: '',
    completedCoursesInfo: '已上课100课时，周期7个月',
    completedCoursesNames: 'Java基础',
    remainingCoursesInfo: 'Java高级（70课时）、数据库（60课时）、Web项目（120课时）',
    leaveDetailDescription: '经济困难需打工赚学费。家庭收入不足，需要打工赚取剩余学费。',
    studentParentThoughts: '学生计划打工4个月赚学费，家长支持孩子完成学业。',
    nextWorkPlan: '帮助了解兼职机会，保持联系。',
    enrollmentAgreementStatus: '已签署',
    employmentWaiverStatement: '未放弃',
    remarks: '休学中',
  },

  // 11月 - 记录1
  {
    key: '31',
    campus: '晋美',
    month: '11月',
    serialNumber: 31,
    studentName: '邹丽',
    gender: '女',
    originalClass: 'CLOUD2024-06',
    originalHeadTeacher: '赵丽',
    leaveStartDate: '2024-11-05',
    plannedReturnDate: '2025-02-05',
    contactPhone: '13800138031',
    actualReturnDate: '',
    returnClass: '',
    returnHeadTeacher: '',
    enrollmentDate: '2024-04-01',
    enrollmentAge: '17',
    idCard: '140107200706****',
    consultant: '邹咨询师',
    receivableTuition: 25800,
    receivedTuition: 25800,
    reportedMajor: '云计算',
    educationSystem: '三年制',
    hasRegistrationCommitment: '是',
    registrationCommitmentDetails: '中专、国家承认、云计算',
    hasRegistered: '否',
    registeredSchool: '',
    completedCoursesInfo: '已上课100课时，周期7个月',
    completedCoursesNames: 'Linux基础、云计算概论',
    remainingCoursesInfo: '虚拟化（80课时）、容器（70课时）、云平台（110课时）',
    leaveDetailDescription: '家人生病需要照顾。父亲突发疾病，需要回家照顾3个月。',
    studentParentThoughts: '家长表示会尽快安排好，让孩子按时复学。',
    nextWorkPlan: '每月回访，了解家庭情况，鼓励按时复学。',
    enrollmentAgreementStatus: '已签署',
    employmentWaiverStatement: '未放弃',
    remarks: '休学中',
  },
  // 11月 - 记录2
  {
    key: '32',
    campus: '原美',
    month: '11月',
    serialNumber: 32,
    studentName: '顾强',
    gender: '男',
    originalClass: 'SOFT2024-08',
    originalHeadTeacher: '孙强',
    leaveStartDate: '2024-11-12',
    plannedReturnDate: '2025-05-12',
    contactPhone: '13800138032',
    actualReturnDate: '',
    returnClass: '',
    returnHeadTeacher: '',
    enrollmentDate: '2024-04-05',
    enrollmentAge: '18',
    idCard: '130407200605****',
    consultant: '顾咨询师',
    receivableTuition: 25800,
    receivedTuition: 19000,
    reportedMajor: '软件技术',
    educationSystem: '三年制',
    hasRegistrationCommitment: '是',
    registrationCommitmentDetails: '中专、国家承认、软件技术',
    hasRegistered: '否',
    registeredSchool: '',
    completedCoursesInfo: '已上课95课时，周期7个月',
    completedCoursesNames: 'Java基础',
    remainingCoursesInfo: 'Java高级（70课时）、数据库（60课时）、Web项目（120课时）',
    leaveDetailDescription: '心理压力需要调整。学生学习压力大，需要时间调整心态。',
    studentParentThoughts: '家长支持孩子休学调整，希望重拾学习信心。',
    nextWorkPlan: '定期关注心理状态，提供疏导。',
    enrollmentAgreementStatus: '已签署',
    employmentWaiverStatement: '未放弃',
    remarks: '休学中',
  },
  // 11月 - 记录3
  {
    key: '33',
    campus: '太美',
    month: '11月',
    serialNumber: 33,
    studentName: '沈艳',
    gender: '女',
    originalClass: 'CS2024-09',
    originalHeadTeacher: '周明',
    leaveStartDate: '2024-11-20',
    plannedReturnDate: '2025-02-20',
    contactPhone: '13800138033',
    actualReturnDate: '',
    returnClass: '',
    returnHeadTeacher: '',
    enrollmentDate: '2024-04-10',
    enrollmentAge: '17',
    idCard: '130504200706****',
    consultant: '沈咨询师',
    receivableTuition: 25800,
    receivedTuition: 25800,
    reportedMajor: '计算机应用',
    educationSystem: '三年制',
    hasRegistrationCommitment: '是',
    registrationCommitmentDetails: '中专、国家承认、计算机应用',
    hasRegistered: '否',
    registeredSchool: '',
    completedCoursesInfo: '已上课90课时，周期7个月',
    completedCoursesNames: 'C语言基础',
    remainingCoursesInfo:
      '组成原理（60课时）、数据结构（80课时）、操作系统（70课时）、数据库（60课时）',
    leaveDetailDescription: '因疾病住院治疗。学生突发疾病，需要住院治疗和康复。',
    studentParentThoughts: '家长全力配合治疗，确保孩子康复后按时返校。',
    nextWorkPlan: '定期了解康复情况，安排复学。',
    enrollmentAgreementStatus: '已签署',
    employmentWaiverStatement: '未放弃',
    remarks: '休学中',
  },

  // 12月 - 记录1
  {
    key: '34',
    campus: '盛邦',
    month: '12月',
    serialNumber: 34,
    studentName: '岳军',
    gender: '男',
    originalClass: 'NET2024-08',
    originalHeadTeacher: '郭丽萍',
    leaveStartDate: '2024-12-05',
    plannedReturnDate: '2025-06-05',
    contactPhone: '13800138034',
    actualReturnDate: '',
    returnClass: '',
    returnHeadTeacher: '',
    enrollmentDate: '2024-04-15',
    enrollmentAge: '18',
    idCard: '130108200605****',
    consultant: '岳咨询师',
    receivableTuition: 25800,
    receivedTuition: 18000,
    reportedMajor: '网络工程',
    educationSystem: '三年制',
    hasRegistrationCommitment: '是',
    registrationCommitmentDetails: '中专、国家承认、网络工程',
    hasRegistered: '否',
    registeredSchool: '',
    completedCoursesInfo: '已上课85课时，周期8个月',
    completedCoursesNames: '网络基础',
    remainingCoursesInfo: '路由交换（100课时）、网络安全（80课时）、Linux（90课时）',
    leaveDetailDescription: '个人规划需要调整。学生对当前专业不太适应，需要时间重新思考职业方向。',
    studentParentThoughts: '学生希望休学期间深入了解专业，家长支持孩子的决定。',
    nextWorkPlan: '提供专业咨询，引导其明确职业方向，鼓励坚持学业。',
    enrollmentAgreementStatus: '已签署',
    employmentWaiverStatement: '未放弃',
    remarks: '休学中',
  },
  // 12月 - 记录2
  {
    key: '35',
    campus: '冀美',
    month: '12月',
    serialNumber: 35,
    studentName: '夏梅',
    gender: '女',
    originalClass: 'CS2024-10',
    originalHeadTeacher: '王芳',
    leaveStartDate: '2024-12-12',
    plannedReturnDate: '2025-03-12',
    contactPhone: '13800138035',
    actualReturnDate: '',
    returnClass: '',
    returnHeadTeacher: '',
    enrollmentDate: '2024-04-20',
    enrollmentAge: '17',
    idCard: '130208200706****',
    consultant: '夏咨询师',
    receivableTuition: 25800,
    receivedTuition: 22000,
    reportedMajor: '计算机应用',
    educationSystem: '三年制',
    hasRegistrationCommitment: '是',
    registrationCommitmentDetails: '中专、国家承认、计算机应用',
    hasRegistered: '否',
    registeredSchool: '',
    completedCoursesInfo: '已上课80课时，周期8个月',
    completedCoursesNames: 'C语言基础',
    remainingCoursesInfo:
      '组成原理（60课时）、数据结构（80课时）、操作系统（70课时）、数据库（60课时）',
    leaveDetailDescription: '经济困难需打工赚学费。家庭收入不足，需要打工赚取剩余学费。',
    studentParentThoughts: '学生计划打工3个月赚学费，家长支持孩子完成学业。',
    nextWorkPlan: '帮助了解兼职机会，保持联系，鼓励坚持学业。',
    enrollmentAgreementStatus: '已签署',
    employmentWaiverStatement: '未放弃',
    remarks: '休学中',
  },
  // 12月 - 记录3
  {
    key: '36',
    campus: '石美',
    month: '12月',
    serialNumber: 36,
    studentName: '侯强',
    gender: '男',
    originalClass: 'SOFT2024-09',
    originalHeadTeacher: '刘强',
    leaveStartDate: '2024-12-20',
    plannedReturnDate: '2025-04-20',
    contactPhone: '13800138036',
    actualReturnDate: '',
    returnClass: '',
    returnHeadTeacher: '',
    enrollmentDate: '2024-04-25',
    enrollmentAge: '18',
    idCard: '130308200605****',
    consultant: '侯咨询师',
    receivableTuition: 25800,
    receivedTuition: 25800,
    reportedMajor: '软件技术',
    educationSystem: '三年制',
    hasRegistrationCommitment: '是',
    registrationCommitmentDetails: '中专、国家承认、软件技术',
    hasRegistered: '否',
    registeredSchool: '',
    completedCoursesInfo: '已上课75课时，周期8个月',
    completedCoursesNames: 'Java基础',
    remainingCoursesInfo: 'Java高级（70课时）、数据库（60课时）、Web项目（120课时）',
    leaveDetailDescription: '心理压力需要调整。学生学习压力大，需要时间调整心态。',
    studentParentThoughts: '家长支持孩子休学调整，希望重拾学习信心。',
    nextWorkPlan: '定期关注心理状态，提供疏导，鼓励按时复学。',
    enrollmentAgreementStatus: '已签署',
    employmentWaiverStatement: '未放弃',
    remarks: '休学中',
  },
]

const CampusLeaveOfAbsenceDetailTable: React.FC = () => {
  const { message, modal } = App.useApp()
  const [searchText, setSearchText] = useState('')
  const [selectedCampus, setSelectedCampus] = useState<string>('全部')
  const [selectedMonth, setSelectedMonth] = useState<string>('全部')
  const [filteredData, setFilteredData] = useState<LeaveOfAbsenceRecord[]>(mockData)
  const [dataSource, setDataSource] = useState<LeaveOfAbsenceRecord[]>(mockData)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<LeaveOfAbsenceRecord | null>(null)
  const [form] = Form.useForm()

  // 处理搜索和筛选
  useEffect(() => {
    let result = dataSource

    // 按神殿筛选
    if (selectedCampus !== '全部') {
      result = result.filter((item) => item.campus === selectedCampus)
    }

    // 按月份筛选
    if (selectedMonth !== '全部') {
      result = result.filter((item) => item.month === selectedMonth)
    }

    // 按关键字搜索
    if (searchText) {
      result = result.filter(
        (item) =>
          item.studentName.toLowerCase().includes(searchText.toLowerCase()) ||
          item.idCard.toLowerCase().includes(searchText.toLowerCase()) ||
          item.contactPhone.toLowerCase().includes(searchText.toLowerCase()) ||
          item.originalClass.toLowerCase().includes(searchText.toLowerCase()) ||
          item.originalHeadTeacher.toLowerCase().includes(searchText.toLowerCase()),
      )
    }

    setFilteredData(result)
  }, [searchText, selectedCampus, selectedMonth, dataSource])

  // 计算统计数据
  const totalRecords = filteredData.length
  const returnedCount = filteredData.filter((item) => item.actualReturnDate !== '').length
  const onLeaveCount = filteredData.filter((item) => item.actualReturnDate === '').length
  const totalReceivable = filteredData.reduce((sum, item) => sum + item.receivableTuition, 0)
  const totalReceived = filteredData.reduce((sum, item) => sum + item.receivedTuition, 0)

  // 添加记录
  const handleAdd = () => {
    setEditingRecord(null)
    form.resetFields()
    setModalVisible(true)
  }

  // 编辑记录
  const handleEdit = (record: LeaveOfAbsenceRecord) => {
    setEditingRecord(record)
    form.setFieldsValue({
      ...record,
      enrollmentDate: record.enrollmentDate ? dayjs(record.enrollmentDate) : undefined,
      leaveStartDate: record.leaveStartDate ? dayjs(record.leaveStartDate) : undefined,
      plannedReturnDate: record.plannedReturnDate ? dayjs(record.plannedReturnDate) : undefined,
      actualReturnDate: record.actualReturnDate ? dayjs(record.actualReturnDate) : undefined,
    })
    setModalVisible(true)
  }

  // 删除记录
  const handleDelete = (record: LeaveOfAbsenceRecord) => {
    modal.confirm({
      title: '确认删除',
      content: `确定要删除学生"${record.studentName}"的休学记录吗？此操作不可恢复。`,
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        const newData = dataSource.filter((item) => item.key !== record.key)
        setDataSource(newData)
        message.success('删除成功')
      },
    })
  }

  // 保存记录
  const handleSave = async () => {
    try {
      const values = await form.validateFields()

      // 格式化日期
      if (values.enrollmentDate) {
        values.enrollmentDate = values.enrollmentDate.format('YYYY-MM-DD')
      }
      if (values.leaveStartDate) {
        values.leaveStartDate = values.leaveStartDate.format('YYYY-MM-DD')
      }
      if (values.plannedReturnDate) {
        values.plannedReturnDate = values.plannedReturnDate.format('YYYY-MM-DD')
      }
      if (values.actualReturnDate) {
        values.actualReturnDate = values.actualReturnDate.format('YYYY-MM-DD')
      }

      if (editingRecord) {
        // 更新记录
        const newData = dataSource.map((item) =>
          item.key === editingRecord.key ? { ...item, ...values } : item,
        )
        setDataSource(newData)
        message.success('更新成功')
      } else {
        // 添加新记录
        const maxSerialNumber = dataSource
          .filter((item) => item.campus === values.campus)
          .reduce((max, item) => Math.max(max, item.serialNumber), 0)

        const newRecord: LeaveOfAbsenceRecord = {
          key: `${Date.now()}`,
          serialNumber: maxSerialNumber + 1,
          ...values,
        }
        setDataSource([...dataSource, newRecord])
        message.success('添加成功')
      }

      setModalVisible(false)
      form.resetFields()
      setEditingRecord(null)
    } catch (error) {
      message.error('保存失败，请检查表单信息')
    }
  }

  // 取消编辑
  const handleCancel = () => {
    setModalVisible(false)
    form.resetFields()
    setEditingRecord(null)
  }

  // 表格列定义
  const columns: ColumnsType<LeaveOfAbsenceRecord> = [
    // 学员休学复学基本情况
    {
      title: '月份',
      dataIndex: 'month',
      key: 'month',
      width: 100,
      align: 'center',
      fixed: 'left',
    },
    {
      title: '序号',
      dataIndex: 'serialNumber',
      key: 'serialNumber',
      width: 60,
      align: 'center',
      fixed: 'left',
    },
    {
      title: '学生姓名',
      dataIndex: 'studentName',
      key: 'studentName',
      width: 100,
      align: 'center',
      fixed: 'left',
    },
    {
      title: '性别',
      dataIndex: 'gender',
      key: 'gender',
      width: 60,
      align: 'center',
    },
    {
      title: '原班级',
      dataIndex: 'originalClass',
      key: 'originalClass',
      width: 120,
      align: 'center',
    },
    {
      title: '原班主任',
      dataIndex: 'originalHeadTeacher',
      key: 'originalHeadTeacher',
      width: 120,
      align: 'center',
    },
    {
      title: '休学开始日期',
      dataIndex: 'leaveStartDate',
      key: 'leaveStartDate',
      width: 120,
      align: 'center',
    },
    {
      title: '应复学日期',
      dataIndex: 'plannedReturnDate',
      key: 'plannedReturnDate',
      width: 120,
      align: 'center',
    },
    {
      title: '联系电话',
      dataIndex: 'contactPhone',
      key: 'contactPhone',
      width: 130,
      align: 'center',
    },
    {
      title: '实复学日期',
      dataIndex: 'actualReturnDate',
      key: 'actualReturnDate',
      width: 120,
      align: 'center',
      render: (date: string) => date || '-',
    },
    {
      title: '复学班级',
      dataIndex: 'returnClass',
      key: 'returnClass',
      width: 120,
      align: 'center',
      render: (cls: string) => cls || '-',
    },
    {
      title: '复学班级班主任',
      dataIndex: 'returnHeadTeacher',
      key: 'returnHeadTeacher',
      width: 140,
      align: 'center',
      render: (teacher: string) => teacher || '-',
    },

    // 学员基本情况
    {
      title: '入学时间',
      dataIndex: 'enrollmentDate',
      key: 'enrollmentDate',
      width: 110,
      align: 'center',
    },
    {
      title: '入学年龄',
      dataIndex: 'enrollmentAge',
      key: 'enrollmentAge',
      width: 90,
      align: 'center',
    },
    {
      title: '身份证号',
      dataIndex: 'idCard',
      key: 'idCard',
      width: 160,
      align: 'center',
    },
    {
      title: '咨询师',
      dataIndex: 'consultant',
      key: 'consultant',
      width: 100,
      align: 'center',
    },
    {
      title: '应收学费',
      dataIndex: 'receivableTuition',
      key: 'receivableTuition',
      width: 120,
      align: 'right',
      render: (value: number) => `¥${value.toLocaleString()}`,
    },
    {
      title: '已收学费',
      dataIndex: 'receivedTuition',
      key: 'receivedTuition',
      width: 120,
      align: 'right',
      render: (value: number) => `¥${value.toLocaleString()}`,
    },
    {
      title: '所报专业',
      dataIndex: 'reportedMajor',
      key: 'reportedMajor',
      width: 120,
      align: 'center',
    },
    {
      title: '学制',
      dataIndex: 'educationSystem',
      key: 'educationSystem',
      width: 100,
      align: 'center',
    },
    {
      title: '是否承诺注册学历',
      dataIndex: 'hasRegistrationCommitment',
      key: 'hasRegistrationCommitment',
      width: 140,
      align: 'center',
      render: (value: string) => <Tag color={value === '是' ? 'green' : 'default'}>{value}</Tag>,
    },
    {
      title: '承诺注册学历、性质级别、名称',
      dataIndex: 'registrationCommitmentDetails',
      key: 'registrationCommitmentDetails',
      width: 220,
      align: 'center',
    },
    {
      title: '是否已注册中专/大专',
      dataIndex: 'hasRegistered',
      key: 'hasRegistered',
      width: 160,
      align: 'center',
      render: (value: string) => <Tag color={value === '是' ? 'green' : 'default'}>{value}</Tag>,
    },
    {
      title: '所注册学校',
      dataIndex: 'registeredSchool',
      key: 'registeredSchool',
      width: 180,
      align: 'center',
      render: (school: string) => school || '-',
    },
    {
      title: '已上课时数、周期时长',
      dataIndex: 'completedCoursesInfo',
      key: 'completedCoursesInfo',
      width: 180,
      align: 'center',
    },
    {
      title: '所学过的课程名称',
      dataIndex: 'completedCoursesNames',
      key: 'completedCoursesNames',
      width: 200,
      align: 'center',
    },
    {
      title: '剩余没学的课程名称及剩余课时数',
      dataIndex: 'remainingCoursesInfo',
      key: 'remainingCoursesInfo',
      width: 250,
      align: 'center',
    },
    {
      title: '学生休学情况说明（详细）',
      dataIndex: 'leaveDetailDescription',
      key: 'leaveDetailDescription',
      width: 300,
      align: 'left',
    },
    {
      title: '目前学生和家长的想法（简单说结论）',
      dataIndex: 'studentParentThoughts',
      key: 'studentParentThoughts',
      width: 250,
      align: 'left',
    },
    {
      title: '下一步对他的工作计划',
      dataIndex: 'nextWorkPlan',
      key: 'nextWorkPlan',
      width: 200,
      align: 'left',
    },
    {
      title: '入学协议签署情况',
      dataIndex: 'enrollmentAgreementStatus',
      key: 'enrollmentAgreementStatus',
      width: 140,
      align: 'center',
    },
    {
      title: '放弃就业声明',
      dataIndex: 'employmentWaiverStatement',
      key: 'employmentWaiverStatement',
      width: 120,
      align: 'center',
    },
    {
      title: '备注',
      dataIndex: 'remarks',
      key: 'remarks',
      width: 200,
      align: 'center',
      render: (remarks: string) => remarks || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      align: 'center',
      fixed: 'right',
      render: (_: any, record: LeaveOfAbsenceRecord) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ]

  const handleRefresh = () => {
    setSearchText('')
    setSelectedCampus('全部')
    setSelectedMonth('全部')
    setDataSource(mockData)
  }

  const handleExport = () => {
    console.log('导出数据')
    message.success('数据导出功能开发中')
  }

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
      <Card
        title={
          <Space>
            <UserDeleteOutlined style={{ fontSize: '20px', color: '#faad14' }} />
            <Title level={4} style={{ margin: 0 }}>
              神殿教质休学明细表
            </Title>
          </Space>
        }
        extra={
          <Space>
            <Select value={selectedCampus} onChange={setSelectedCampus} style={{ width: 120 }}>
              <Option value="全部">全部神殿</Option>
              <Option value="盛邦">盛邦</Option>
              <Option value="冀美">冀美</Option>
              <Option value="石美">石美</Option>
              <Option value="晋美">晋美</Option>
              <Option value="原美">原美</Option>
              <Option value="太美">太美</Option>
              <Option value="桂美">桂美</Option>
            </Select>
            <Select value={selectedMonth} onChange={setSelectedMonth} style={{ width: 120 }}>
              <Option value="全部">全部月份</Option>
              <Option value="1月">1月</Option>
              <Option value="2月">2月</Option>
              <Option value="3月">3月</Option>
              <Option value="4月">4月</Option>
              <Option value="5月">5月</Option>
              <Option value="6月">6月</Option>
              <Option value="7月">7月</Option>
              <Option value="8月">8月</Option>
              <Option value="9月">9月</Option>
              <Option value="10月">10月</Option>
              <Option value="11月">11月</Option>
              <Option value="12月">12月</Option>
            </Select>
            <Input
              placeholder="搜索姓名、身份证号、班级"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 240 }}
              allowClear
            />
            <Button icon={<PlusOutlined />} type="primary" onClick={handleAdd}>
              新增
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
              刷新
            </Button>
            <Button icon={<DownloadOutlined />} onClick={handleExport}>
              导出
            </Button>
          </Space>
        }
        style={{ marginBottom: '16px' }}
      >
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title="休学总人数"
              value={totalRecords}
              suffix="人"
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="休学中"
              value={onLeaveCount}
              suffix="人"
              valueStyle={{ color: '#faad14' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="已复学"
              value={returnedCount}
              suffix="人"
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="应收学费总额"
              value={totalReceivable}
              prefix="¥"
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
        </Row>
        <Row gutter={16} style={{ marginTop: '16px' }}>
          <Col span={6}>
            <Statistic
              title="已收学费总额"
              value={totalReceived}
              prefix="¥"
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
        </Row>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={filteredData}
          scroll={{ x: 5500, y: 600 }}
          pagination={{
            total: filteredData.length,
            defaultPageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          bordered
          size="middle"
        />
      </Card>

      {/* 新增/编辑 Modal */}
      <Modal
        title={editingRecord ? '编辑休学记录' : '新增休学记录'}
        open={modalVisible}
        onOk={handleSave}
        onCancel={handleCancel}
        width={1200}
        okText="保存"
        cancelText="取消"
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            gender: '男',
            educationSystem: '三年制',
            hasRegistrationCommitment: '是',
            hasRegistered: '否',
            enrollmentAgreementStatus: '已签署',
            employmentWaiverStatement: '未放弃',
            receivableTuition: 0,
            receivedTuition: 0,
          }}
        >
          {/* 基本信息 */}
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item
                name="campus"
                label="所属神殿"
                rules={[{ required: true, message: '请选择所属神殿' }]}
              >
                <Select placeholder="请选择所属神殿">
                  <Option value="盛邦">盛邦</Option>
                  <Option value="冀美">冀美</Option>
                  <Option value="石美">石美</Option>
                  <Option value="晋美">晋美</Option>
                  <Option value="原美">原美</Option>
                  <Option value="太美">太美</Option>
                  <Option value="桂美">桂美</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="month" label="月份">
                <Input placeholder="如：9月" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="studentName"
                label="学生姓名"
                rules={[{ required: true, message: '请输入学生姓名' }]}
              >
                <Input placeholder="请输入学生姓名" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="gender" label="性别">
                <Select>
                  <Option value="男">男</Option>
                  <Option value="女">女</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {/* 原班级信息 */}
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="originalClass" label="原班级">
                <Input placeholder="请输入原班级" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="originalHeadTeacher" label="原班主任">
                <Input placeholder="请输入原班主任" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="contactPhone"
                label="联系电话"
                rules={[
                  { required: true, message: '请输入联系电话' },
                  { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' },
                ]}
              >
                <Input placeholder="请输入联系电话" maxLength={11} />
              </Form.Item>
            </Col>
          </Row>

          {/* 休学信息 */}
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item
                name="leaveStartDate"
                label="休学开始日期"
                rules={[{ required: true, message: '请选择休学开始日期' }]}
              >
                <DatePicker style={{ width: '100%' }} placeholder="请选择休学开始日期" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="plannedReturnDate" label="应复学日期">
                <DatePicker style={{ width: '100%' }} placeholder="请选择应复学日期" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="actualReturnDate" label="实复学日期">
                <DatePicker style={{ width: '100%' }} placeholder="请选择实复学日期" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="returnClass" label="复学班级">
                <Input placeholder="请输入复学班级" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="returnHeadTeacher" label="复学班级班主任">
                <Input placeholder="请输入复学班级班主任" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="idCard"
                label="身份证号"
                rules={[
                  { required: true, message: '请输入身份证号' },
                  {
                    pattern:
                      /^\d{6}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/,
                    message: '请输入有效的身份证号',
                  },
                ]}
              >
                <Input placeholder="请输入身份证号" maxLength={18} />
              </Form.Item>
            </Col>
          </Row>

          {/* 学员基本情况 */}
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item
                name="enrollmentDate"
                label="入学时间"
                rules={[{ required: true, message: '请选择入学时间' }]}
              >
                <DatePicker style={{ width: '100%' }} placeholder="请选择入学时间" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="enrollmentAge" label="入学年龄">
                <Input placeholder="如：17、18" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="consultant" label="咨询师">
                <Input placeholder="请输入咨询师姓名" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="reportedMajor" label="所报专业">
                <Input placeholder="请输入所报专业" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="educationSystem" label="学制">
                <Select placeholder="请选择学制">
                  <Option value="三年制">三年制</Option>
                  <Option value="五年制">五年制</Option>
                  <Option value="一年制">一年制</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="receivableTuition"
                label="应收学费"
                rules={[{ required: true, message: '请输入应收学费' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="请输入应收学费"
                  min={0}
                  precision={0}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="receivedTuition"
                label="已收学费"
                rules={[{ required: true, message: '请输入已收学费' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="请输入已收学费"
                  min={0}
                  precision={0}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="hasRegistrationCommitment" label="是否承诺注册学历">
                <Select>
                  <Option value="是">是</Option>
                  <Option value="否">否</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="registrationCommitmentDetails" label="承诺注册学历、性质级别、名称">
                <Input placeholder="如：中专、国家承认、计算机应用" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="hasRegistered" label="是否已注册中专/大专">
                <Select>
                  <Option value="是">是</Option>
                  <Option value="否">否</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="registeredSchool" label="所注册学校">
                <Input placeholder="请输入所注册学校，未注册可不填" />
              </Form.Item>
            </Col>
          </Row>

          {/* 课程信息 */}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="completedCoursesInfo" label="已上课时数、周期时长">
                <Input placeholder="如：已上课200课时，周期3个月" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="completedCoursesNames" label="所学过的课程名称">
                <Input placeholder="请输入所学过的课程名称" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="remainingCoursesInfo" label="剩余没学的课程名称及剩余课时数">
                <Input.TextArea rows={2} placeholder="请输入剩余没学的课程名称及剩余课时数" />
              </Form.Item>
            </Col>
          </Row>

          {/* 休学详情 */}
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="leaveDetailDescription" label="学生休学情况说明（详细）">
                <Input.TextArea rows={3} placeholder="请详细说明学生休学的具体情况" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="studentParentThoughts" label="目前学生和家长的想法（简单说结论）">
                <Input.TextArea rows={2} placeholder="请简单说明学生和家长的想法" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="nextWorkPlan" label="下一步对他的工作计划">
                <Input.TextArea rows={2} placeholder="请输入下一步工作计划" />
              </Form.Item>
            </Col>
          </Row>

          {/* 其他信息 */}
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="enrollmentAgreementStatus" label="入学协议签署情况">
                <Select>
                  <Option value="已签署">已签署</Option>
                  <Option value="未签署">未签署</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="employmentWaiverStatement" label="放弃就业声明">
                <Select>
                  <Option value="未放弃">未放弃</Option>
                  <Option value="已放弃">已放弃</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="remarks" label="备注">
                <Input placeholder="请输入备注" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  )
}

export default CampusLeaveOfAbsenceDetailTable
