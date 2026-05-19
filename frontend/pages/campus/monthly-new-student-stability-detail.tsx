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
  UserOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  DollarOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'

const { Title } = Typography
const { Option } = Select

// 当月新生维稳明细数据接口
interface MonthlyNewStudentStabilityDetailRecord {
  key: string
  serialNumber: number // 序号
  headTeacherName: string // 班主任姓名
  newStudentName: string // 新生姓名
  enrollmentDate: string // 报名时间
  reportDate: string // 报道时间
  enrollmentMajor: string // 报名专业
  enrollmentSystem: string // 报名学制
  tuitionReceivable: number // 应收学费
  enrollmentPayment: number // 报名交费金额
  supplementPayment: number // 补款金额
  arrearsAmount: number // 仍欠费金额
  isFullPayment: string // 是否全款
  hasLoan: string // 是否贷款
  hasPassedClass: string // 是否过课时
  trialPeriod: string // 试学周期
  isRefund: string // 是否退费
  refundDate: string // 退费时间
  refundDescription: string // 退费情况说明
  consultant: string // 咨询师
  hasAccommodation: string // 是否住宿
  dormitoryName: string // 宿舍名
  remarks: string // 备注
  campus: string // 神殿（用于筛选）
}

// 模拟数据
const mockData: MonthlyNewStudentStabilityDetailRecord[] = [
  // 主神殿
  {
    key: '1',
    serialNumber: 1,
    campus: '盛邦',
    headTeacherName: '魏轩',
    newStudentName: '王梅',
    enrollmentDate: '2025-07-28',
    reportDate: '2025-08-01',
    enrollmentMajor: '网络云运维',
    enrollmentSystem: '20个月',
    tuitionReceivable: 12800,
    enrollmentPayment: 0,
    supplementPayment: 0,
    arrearsAmount: 12800,
    isFullPayment: '否',
    hasLoan: '否',
    hasPassedClass: '否',
    trialPeriod: '1.5天',
    isRefund: '否',
    refundDate: '',
    refundDescription: '',
    consultant: '李金星',
    hasAccommodation: '否',
    dormitoryName: '',
    remarks: '',
  },
  {
    key: '2',
    serialNumber: 2,
    campus: '盛邦',
    headTeacherName: '魏轩',
    newStudentName: '张华',
    enrollmentDate: '2025-08-01',
    reportDate: '2025-08-05',
    enrollmentMajor: '云计算',
    enrollmentSystem: '三年制',
    tuitionReceivable: 13500,
    enrollmentPayment: 5000,
    supplementPayment: 0,
    arrearsAmount: 8500,
    isFullPayment: '否',
    hasLoan: '否',
    hasPassedClass: '是',
    trialPeriod: '2天',
    isRefund: '否',
    refundDate: '',
    refundDescription: '',
    consultant: '王咨询师',
    hasAccommodation: '是',
    dormitoryName: '盛邦12-2-201',
    remarks: '',
  },
  {
    key: '3',
    serialNumber: 3,
    campus: '盛邦',
    headTeacherName: '李晓平',
    newStudentName: '赵敏',
    enrollmentDate: '2025-08-05',
    reportDate: '2025-08-08',
    enrollmentMajor: '网络工程',
    enrollmentSystem: '三年制',
    tuitionReceivable: 14000,
    enrollmentPayment: 14000,
    supplementPayment: 0,
    arrearsAmount: 0,
    isFullPayment: '是',
    hasLoan: '否',
    hasPassedClass: '是',
    trialPeriod: '1天',
    isRefund: '否',
    refundDate: '',
    refundDescription: '',
    consultant: '张咨询师',
    hasAccommodation: '是',
    dormitoryName: '盛邦A栋301',
    remarks: '',
  },
  {
    key: '4',
    serialNumber: 4,
    campus: '盛邦',
    headTeacherName: '李晓平',
    newStudentName: '孙强',
    enrollmentDate: '2025-08-10',
    reportDate: '2025-08-12',
    enrollmentMajor: '云计算',
    enrollmentSystem: '三年制',
    tuitionReceivable: 12800,
    enrollmentPayment: 3000,
    supplementPayment: 0,
    arrearsAmount: 9800,
    isFullPayment: '否',
    hasLoan: '否',
    hasPassedClass: '否',
    trialPeriod: '3天',
    isRefund: '是',
    refundDate: '2025-08-20',
    refundDescription: '家庭原因退费，退还全部学费',
    consultant: '赵咨询师',
    hasAccommodation: '否',
    dormitoryName: '',
    remarks: '已退费',
  },

  // 永恒殿
  {
    key: '5',
    serialNumber: 1,
    campus: '冀美',
    headTeacherName: '王芳',
    newStudentName: '李伟',
    enrollmentDate: '2025-07-25',
    reportDate: '2025-07-28',
    enrollmentMajor: '云计算',
    enrollmentSystem: '三年制',
    tuitionReceivable: 13000,
    enrollmentPayment: 6000,
    supplementPayment: 2000,
    arrearsAmount: 5000,
    isFullPayment: '否',
    hasLoan: '否',
    hasPassedClass: '是',
    trialPeriod: '2天',
    isRefund: '否',
    refundDate: '',
    refundDescription: '',
    consultant: '孙咨询师',
    hasAccommodation: '是',
    dormitoryName: '冀美B栋201',
    remarks: '',
  },
  {
    key: '6',
    serialNumber: 2,
    campus: '冀美',
    headTeacherName: '王芳',
    newStudentName: '周杰',
    enrollmentDate: '2025-08-02',
    reportDate: '2025-08-04',
    enrollmentMajor: '网络工程',
    enrollmentSystem: '三年制',
    tuitionReceivable: 14500,
    enrollmentPayment: 14500,
    supplementPayment: 0,
    arrearsAmount: 0,
    isFullPayment: '是',
    hasLoan: '否',
    hasPassedClass: '是',
    trialPeriod: '1天',
    isRefund: '否',
    refundDate: '',
    refundDescription: '',
    consultant: '周咨询师',
    hasAccommodation: '是',
    dormitoryName: '冀美A栋105',
    remarks: '',
  },
  {
    key: '7',
    serialNumber: 3,
    campus: '冀美',
    headTeacherName: '张建国',
    newStudentName: '吴敏',
    enrollmentDate: '2025-08-08',
    reportDate: '2025-08-10',
    enrollmentMajor: '云计算',
    enrollmentSystem: '三年制',
    tuitionReceivable: 13200,
    enrollmentPayment: 4000,
    supplementPayment: 0,
    arrearsAmount: 9200,
    isFullPayment: '否',
    hasLoan: '是',
    hasPassedClass: '是',
    trialPeriod: '2天',
    isRefund: '否',
    refundDate: '',
    refundDescription: '',
    consultant: '吴咨询师',
    hasAccommodation: '否',
    dormitoryName: '',
    remarks: '',
  },

  // 慈悲殿
  {
    key: '8',
    serialNumber: 1,
    campus: '石美',
    headTeacherName: '刘强',
    newStudentName: '郑娟',
    enrollmentDate: '2025-07-30',
    reportDate: '2025-08-02',
    enrollmentMajor: '网络云运维',
    enrollmentSystem: '20个月',
    tuitionReceivable: 12500,
    enrollmentPayment: 12500,
    supplementPayment: 0,
    arrearsAmount: 0,
    isFullPayment: '是',
    hasLoan: '否',
    hasPassedClass: '是',
    trialPeriod: '1天',
    isRefund: '否',
    refundDate: '',
    refundDescription: '',
    consultant: '郑咨询师',
    hasAccommodation: '是',
    dormitoryName: '石美C栋302',
    remarks: '',
  },
  {
    key: '9',
    serialNumber: 2,
    campus: '石美',
    headTeacherName: '刘强',
    newStudentName: '钱涛',
    enrollmentDate: '2025-08-04',
    reportDate: '2025-08-06',
    enrollmentMajor: '云计算',
    enrollmentSystem: '三年制',
    tuitionReceivable: 13800,
    enrollmentPayment: 7000,
    supplementPayment: 1000,
    arrearsAmount: 5800,
    isFullPayment: '否',
    hasLoan: '否',
    hasPassedClass: '是',
    trialPeriod: '2天',
    isRefund: '否',
    refundDate: '',
    refundDescription: '',
    consultant: '钱咨询师',
    hasAccommodation: '是',
    dormitoryName: '石美A栋206',
    remarks: '',
  },
  {
    key: '10',
    serialNumber: 3,
    campus: '石美',
    headTeacherName: '陈敏',
    newStudentName: '孙华',
    enrollmentDate: '2025-08-12',
    reportDate: '2025-08-15',
    enrollmentMajor: '网络工程',
    enrollmentSystem: '三年制',
    tuitionReceivable: 14200,
    enrollmentPayment: 5000,
    supplementPayment: 0,
    arrearsAmount: 9200,
    isFullPayment: '否',
    hasLoan: '否',
    hasPassedClass: '否',
    trialPeriod: '3天',
    isRefund: '否',
    refundDate: '',
    refundDescription: '',
    consultant: '孙咨询师',
    hasAccommodation: '否',
    dormitoryName: '',
    remarks: '考虑中',
  },

  // 李大殿
  {
    key: '11',
    serialNumber: 1,
    campus: '晋美',
    headTeacherName: '赵丽',
    newStudentName: '周强',
    enrollmentDate: '2025-07-26',
    reportDate: '2025-07-29',
    enrollmentMajor: '云计算',
    enrollmentSystem: '三年制',
    tuitionReceivable: 13000,
    enrollmentPayment: 13000,
    supplementPayment: 0,
    arrearsAmount: 0,
    isFullPayment: '是',
    hasLoan: '否',
    hasPassedClass: '是',
    trialPeriod: '1天',
    isRefund: '否',
    refundDate: '',
    refundDescription: '',
    consultant: '周咨询师',
    hasAccommodation: '是',
    dormitoryName: '晋美A栋401',
    remarks: '',
  },
  {
    key: '12',
    serialNumber: 2,
    campus: '晋美',
    headTeacherName: '赵丽',
    newStudentName: '吴伟',
    enrollmentDate: '2025-08-06',
    reportDate: '2025-08-09',
    enrollmentMajor: '网络工程',
    enrollmentSystem: '三年制',
    tuitionReceivable: 14000,
    enrollmentPayment: 6000,
    supplementPayment: 2000,
    arrearsAmount: 6000,
    isFullPayment: '否',
    hasLoan: '否',
    hasPassedClass: '是',
    trialPeriod: '2天',
    isRefund: '否',
    refundDate: '',
    refundDescription: '',
    consultant: '吴咨询师',
    hasAccommodation: '是',
    dormitoryName: '晋美B栋203',
    remarks: '',
  },

  // 智慧阁
  {
    key: '13',
    serialNumber: 1,
    campus: '原美',
    headTeacherName: '孙明',
    newStudentName: '郑芳',
    enrollmentDate: '2025-07-29',
    reportDate: '2025-08-01',
    enrollmentMajor: '云计算',
    enrollmentSystem: '三年制',
    tuitionReceivable: 12800,
    enrollmentPayment: 12800,
    supplementPayment: 0,
    arrearsAmount: 0,
    isFullPayment: '是',
    hasLoan: '否',
    hasPassedClass: '是',
    trialPeriod: '1天',
    isRefund: '否',
    refundDate: '',
    refundDescription: '',
    consultant: '郑咨询师',
    hasAccommodation: '是',
    dormitoryName: '原美A栋305',
    remarks: '',
  },
  {
    key: '14',
    serialNumber: 2,
    campus: '原美',
    headTeacherName: '孙明',
    newStudentName: '钱敏',
    enrollmentDate: '2025-08-07',
    reportDate: '2025-08-10',
    enrollmentMajor: '网络云运维',
    enrollmentSystem: '20个月',
    tuitionReceivable: 13500,
    enrollmentPayment: 4500,
    supplementPayment: 0,
    arrearsAmount: 9000,
    isFullPayment: '否',
    hasLoan: '是',
    hasPassedClass: '否',
    trialPeriod: '2天',
    isRefund: '否',
    refundDate: '',
    refundDescription: '',
    consultant: '钱咨询师',
    hasAccommodation: '否',
    dormitoryName: '',
    remarks: '',
  },

  // 光明殿
  {
    key: '15',
    serialNumber: 1,
    campus: '太美',
    headTeacherName: '周华',
    newStudentName: '孙伟',
    enrollmentDate: '2025-07-31',
    reportDate: '2025-08-03',
    enrollmentMajor: '云计算',
    enrollmentSystem: '三年制',
    tuitionReceivable: 13200,
    enrollmentPayment: 13200,
    supplementPayment: 0,
    arrearsAmount: 0,
    isFullPayment: '是',
    hasLoan: '否',
    hasPassedClass: '是',
    trialPeriod: '1天',
    isRefund: '否',
    refundDate: '',
    refundDescription: '',
    consultant: '孙咨询师',
    hasAccommodation: '是',
    dormitoryName: '太美A栋501',
    remarks: '',
  },
  {
    key: '16',
    serialNumber: 2,
    campus: '太美',
    headTeacherName: '周华',
    newStudentName: '郑敏',
    enrollmentDate: '2025-08-09',
    reportDate: '2025-08-12',
    enrollmentMajor: '网络工程',
    enrollmentSystem: '三年制',
    tuitionReceivable: 14800,
    enrollmentPayment: 7000,
    supplementPayment: 1500,
    arrearsAmount: 6300,
    isFullPayment: '否',
    hasLoan: '否',
    hasPassedClass: '是',
    trialPeriod: '2天',
    isRefund: '否',
    refundDate: '',
    refundDescription: '',
    consultant: '周咨询师',
    hasAccommodation: '是',
    dormitoryName: '太美B栋304',
    remarks: '',
  },

  // 神恩殿
  {
    key: '17',
    serialNumber: 1,
    campus: '桂美',
    headTeacherName: '吴强',
    newStudentName: '钱华',
    enrollmentDate: '2025-08-01',
    reportDate: '2025-08-04',
    enrollmentMajor: '云计算',
    enrollmentSystem: '三年制',
    tuitionReceivable: 13000,
    enrollmentPayment: 13000,
    supplementPayment: 0,
    arrearsAmount: 0,
    isFullPayment: '是',
    hasLoan: '否',
    hasPassedClass: '是',
    trialPeriod: '1天',
    isRefund: '否',
    refundDate: '',
    refundDescription: '',
    consultant: '吴咨询师',
    hasAccommodation: '是',
    dormitoryName: '桂美A栋201',
    remarks: '',
  },
  {
    key: '18',
    serialNumber: 2,
    campus: '桂美',
    headTeacherName: '吴强',
    newStudentName: '孙丽',
    enrollmentDate: '2025-08-11',
    reportDate: '2025-08-14',
    enrollmentMajor: '网络云运维',
    enrollmentSystem: '20个月',
    tuitionReceivable: 12600,
    enrollmentPayment: 5000,
    supplementPayment: 0,
    arrearsAmount: 7600,
    isFullPayment: '否',
    hasLoan: '是',
    hasPassedClass: '是',
    trialPeriod: '3天',
    isRefund: '否',
    refundDate: '',
    refundDescription: '',
    consultant: '郑咨询师',
    hasAccommodation: '否',
    dormitoryName: '',
    remarks: '',
  },

  // 更多样例数据 - 1月
  {
    key: '19',
    serialNumber: 1,
    campus: '盛邦',
    headTeacherName: '魏轩',
    newStudentName: '王明',
    enrollmentDate: '2025-01-05',
    reportDate: '2025-01-08',
    enrollmentMajor: '网络云运维',
    enrollmentSystem: '20个月',
    tuitionReceivable: 12800,
    enrollmentPayment: 12800,
    supplementPayment: 0,
    arrearsAmount: 0,
    isFullPayment: '是',
    hasLoan: '否',
    hasPassedClass: '是',
    trialPeriod: '2天',
    isRefund: '否',
    refundDate: '',
    refundDescription: '',
    consultant: '李金星',
    hasAccommodation: '是',
    dormitoryName: '盛邦A栋101',
    remarks: '',
  },
  {
    key: '20',
    serialNumber: 2,
    campus: '盛邦',
    headTeacherName: '魏轩',
    newStudentName: '刘洋',
    enrollmentDate: '2025-01-12',
    reportDate: '2025-01-15',
    enrollmentMajor: '云计算',
    enrollmentSystem: '三年制',
    tuitionReceivable: 13500,
    enrollmentPayment: 8000,
    supplementPayment: 0,
    arrearsAmount: 5500,
    isFullPayment: '否',
    hasLoan: '否',
    hasPassedClass: '是',
    trialPeriod: '3天',
    isRefund: '否',
    refundDate: '',
    refundDescription: '',
    consultant: '王咨询师',
    hasAccommodation: '是',
    dormitoryName: '盛邦B栋202',
    remarks: '',
  },
  {
    key: '21',
    serialNumber: 1,
    campus: '冀美',
    headTeacherName: '王芳',
    newStudentName: '陈静',
    enrollmentDate: '2025-01-08',
    reportDate: '2025-01-10',
    enrollmentMajor: '网络工程',
    enrollmentSystem: '三年制',
    tuitionReceivable: 14500,
    enrollmentPayment: 14500,
    supplementPayment: 0,
    arrearsAmount: 0,
    isFullPayment: '是',
    hasLoan: '否',
    hasPassedClass: '是',
    trialPeriod: '1天',
    isRefund: '否',
    refundDate: '',
    refundDescription: '',
    consultant: '周咨询师',
    hasAccommodation: '是',
    dormitoryName: '冀美A栋105',
    remarks: '',
  },

  // 2月样例数据
  {
    key: '22',
    serialNumber: 3,
    campus: '盛邦',
    headTeacherName: '李晓平',
    newStudentName: '张伟',
    enrollmentDate: '2025-02-03',
    reportDate: '2025-02-06',
    enrollmentMajor: '云计算',
    enrollmentSystem: '三年制',
    tuitionReceivable: 14000,
    enrollmentPayment: 7000,
    supplementPayment: 2000,
    arrearsAmount: 5000,
    isFullPayment: '否',
    hasLoan: '否',
    hasPassedClass: '是',
    trialPeriod: '2天',
    isRefund: '否',
    refundDate: '',
    refundDescription: '',
    consultant: '张咨询师',
    hasAccommodation: '是',
    dormitoryName: '盛邦C栋303',
    remarks: '',
  },
  {
    key: '23',
    serialNumber: 4,
    campus: '盛邦',
    headTeacherName: '李晓平',
    newStudentName: '赵敏',
    enrollmentDate: '2025-02-10',
    reportDate: '2025-02-12',
    enrollmentMajor: '网络工程',
    enrollmentSystem: '三年制',
    tuitionReceivable: 13800,
    enrollmentPayment: 13800,
    supplementPayment: 0,
    arrearsAmount: 0,
    isFullPayment: '是',
    hasLoan: '否',
    hasPassedClass: '是',
    trialPeriod: '1天',
    isRefund: '否',
    refundDate: '',
    refundDescription: '',
    consultant: '赵咨询师',
    hasAccommodation: '是',
    dormitoryName: '盛邦A栋304',
    remarks: '',
  },
  {
    key: '24',
    serialNumber: 3,
    campus: '冀美',
    headTeacherName: '张建国',
    newStudentName: '周强',
    enrollmentDate: '2025-02-05',
    reportDate: '2025-02-08',
    enrollmentMajor: '云计算',
    enrollmentSystem: '三年制',
    tuitionReceivable: 13200,
    enrollmentPayment: 6000,
    supplementPayment: 0,
    arrearsAmount: 7200,
    isFullPayment: '否',
    hasLoan: '是',
    hasPassedClass: '是',
    trialPeriod: '2天',
    isRefund: '否',
    refundDate: '',
    refundDescription: '',
    consultant: '吴咨询师',
    hasAccommodation: '否',
    dormitoryName: '',
    remarks: '',
  },

  // 3月样例数据
  {
    key: '25',
    serialNumber: 5,
    campus: '盛邦',
    headTeacherName: '魏轩',
    newStudentName: '孙强',
    enrollmentDate: '2025-03-08',
    reportDate: '2025-03-11',
    enrollmentMajor: '网络云运维',
    enrollmentSystem: '20个月',
    tuitionReceivable: 12800,
    enrollmentPayment: 4000,
    supplementPayment: 0,
    arrearsAmount: 8800,
    isFullPayment: '否',
    hasLoan: '否',
    hasPassedClass: '否',
    trialPeriod: '3天',
    isRefund: '否',
    refundDate: '',
    refundDescription: '',
    consultant: '李金星',
    hasAccommodation: '否',
    dormitoryName: '',
    remarks: '',
  },
  {
    key: '26',
    serialNumber: 6,
    campus: '盛邦',
    headTeacherName: '李晓平',
    newStudentName: '吴敏',
    enrollmentDate: '2025-03-15',
    reportDate: '2025-03-18',
    enrollmentMajor: '云计算',
    enrollmentSystem: '三年制',
    tuitionReceivable: 13500,
    enrollmentPayment: 13500,
    supplementPayment: 0,
    arrearsAmount: 0,
    isFullPayment: '是',
    hasLoan: '否',
    hasPassedClass: '是',
    trialPeriod: '1天',
    isRefund: '否',
    refundDate: '',
    refundDescription: '',
    consultant: '王咨询师',
    hasAccommodation: '是',
    dormitoryName: '盛邦B栋205',
    remarks: '',
  },
  {
    key: '27',
    serialNumber: 4,
    campus: '冀美',
    headTeacherName: '王芳',
    newStudentName: '郑华',
    enrollmentDate: '2025-03-12',
    reportDate: '2025-03-14',
    enrollmentMajor: '网络工程',
    enrollmentSystem: '三年制',
    tuitionReceivable: 14500,
    enrollmentPayment: 9000,
    supplementPayment: 1000,
    arrearsAmount: 4500,
    isFullPayment: '否',
    hasLoan: '否',
    hasPassedClass: '是',
    trialPeriod: '2天',
    isRefund: '否',
    refundDate: '',
    refundDescription: '',
    consultant: '周咨询师',
    hasAccommodation: '是',
    dormitoryName: '冀美C栋306',
    remarks: '',
  },

  // 4月样例数据
  {
    key: '28',
    serialNumber: 7,
    campus: '盛邦',
    headTeacherName: '魏轩',
    newStudentName: '钱涛',
    enrollmentDate: '2025-04-05',
    reportDate: '2025-04-08',
    enrollmentMajor: '云计算',
    enrollmentSystem: '三年制',
    tuitionReceivable: 13800,
    enrollmentPayment: 13800,
    supplementPayment: 0,
    arrearsAmount: 0,
    isFullPayment: '是',
    hasLoan: '否',
    hasPassedClass: '是',
    trialPeriod: '1天',
    isRefund: '否',
    refundDate: '',
    refundDescription: '',
    consultant: '李金星',
    hasAccommodation: '是',
    dormitoryName: '盛邦A栋401',
    remarks: '',
  },
  {
    key: '29',
    serialNumber: 8,
    campus: '盛邦',
    headTeacherName: '李晓平',
    newStudentName: '周杰',
    enrollmentDate: '2025-04-10',
    reportDate: '2025-04-13',
    enrollmentMajor: '网络工程',
    enrollmentSystem: '三年制',
    tuitionReceivable: 14000,
    enrollmentPayment: 5000,
    supplementPayment: 0,
    arrearsAmount: 9000,
    isFullPayment: '否',
    hasLoan: '否',
    hasPassedClass: '否',
    trialPeriod: '3天',
    isRefund: '否',
    refundDate: '',
    refundDescription: '',
    consultant: '张咨询师',
    hasAccommodation: '否',
    dormitoryName: '',
    remarks: '',
  },

  // 5月样例数据
  {
    key: '30',
    serialNumber: 9,
    campus: '盛邦',
    headTeacherName: '魏轩',
    newStudentName: '吴伟',
    enrollmentDate: '2025-05-08',
    reportDate: '2025-05-11',
    enrollmentMajor: '网络云运维',
    enrollmentSystem: '20个月',
    tuitionReceivable: 12800,
    enrollmentPayment: 10000,
    supplementPayment: 0,
    arrearsAmount: 2800,
    isFullPayment: '否',
    hasLoan: '否',
    hasPassedClass: '是',
    trialPeriod: '2天',
    isRefund: '否',
    refundDate: '',
    refundDescription: '',
    consultant: '李金星',
    hasAccommodation: '是',
    dormitoryName: '盛邦B栋301',
    remarks: '',
  },
  {
    key: '31',
    serialNumber: 10,
    campus: '盛邦',
    headTeacherName: '李晓平',
    newStudentName: '郑娟',
    enrollmentDate: '2025-05-15',
    reportDate: '2025-05-18',
    enrollmentMajor: '云计算',
    enrollmentSystem: '三年制',
    tuitionReceivable: 13500,
    enrollmentPayment: 13500,
    supplementPayment: 0,
    arrearsAmount: 0,
    isFullPayment: '是',
    hasLoan: '否',
    hasPassedClass: '是',
    trialPeriod: '1天',
    isRefund: '否',
    refundDate: '',
    refundDescription: '',
    consultant: '王咨询师',
    hasAccommodation: '是',
    dormitoryName: '盛邦A栋502',
    remarks: '',
  },

  // 6月样例数据
  {
    key: '32',
    serialNumber: 11,
    campus: '盛邦',
    headTeacherName: '魏轩',
    newStudentName: '孙丽',
    enrollmentDate: '2025-06-05',
    reportDate: '2025-06-08',
    enrollmentMajor: '网络工程',
    enrollmentSystem: '三年制',
    tuitionReceivable: 14500,
    enrollmentPayment: 8000,
    supplementPayment: 2000,
    arrearsAmount: 4500,
    isFullPayment: '否',
    hasLoan: '否',
    hasPassedClass: '是',
    trialPeriod: '2天',
    isRefund: '否',
    refundDate: '',
    refundDescription: '',
    consultant: '李金星',
    hasAccommodation: '是',
    dormitoryName: '盛邦C栋403',
    remarks: '',
  },
  {
    key: '33',
    serialNumber: 12,
    campus: '盛邦',
    headTeacherName: '李晓平',
    newStudentName: '钱敏',
    enrollmentDate: '2025-06-12',
    reportDate: '2025-06-15',
    enrollmentMajor: '云计算',
    enrollmentSystem: '三年制',
    tuitionReceivable: 13800,
    enrollmentPayment: 13800,
    supplementPayment: 0,
    arrearsAmount: 0,
    isFullPayment: '是',
    hasLoan: '否',
    hasPassedClass: '是',
    trialPeriod: '1天',
    isRefund: '否',
    refundDate: '',
    refundDescription: '',
    consultant: '张咨询师',
    hasAccommodation: '是',
    dormitoryName: '盛邦A栋603',
    remarks: '',
  },
]

interface CampusMonthlyNewStudentStabilityDetailTableProps {
  selectedMonth?: number // 选中的月份（1-12），不传则显示所有月份
}

const CampusMonthlyNewStudentStabilityDetailTable: React.FC<
  CampusMonthlyNewStudentStabilityDetailTableProps
> = ({ selectedMonth }) => {
  const { message, modal } = App.useApp()
  const [searchText, setSearchText] = useState('')
  const [selectedCampus, setSelectedCampus] = useState<string>('全部')
  const [filteredData, setFilteredData] =
    useState<MonthlyNewStudentStabilityDetailRecord[]>(mockData)
  const [dataSource, setDataSource] = useState<MonthlyNewStudentStabilityDetailRecord[]>(mockData)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<MonthlyNewStudentStabilityDetailRecord | null>(
    null,
  )
  const [form] = Form.useForm()

  // 处理搜索和月份筛选
  useEffect(() => {
    let result = dataSource

    // 按月份筛选（如果指定了月份）
    if (selectedMonth !== undefined && selectedMonth >= 1 && selectedMonth <= 12) {
      // 从报名日期（enrollmentDate）中提取月份
      result = result.filter((item) => {
        if (item.enrollmentDate) {
          // 解析日期字符串（例如 "2025-08-01" -> 8）
          const dateMatch = item.enrollmentDate.match(/(\d{4})-(\d{2})/)
          if (dateMatch) {
            const monthNum = parseInt(dateMatch[2], 10)
            return monthNum === selectedMonth
          }
        }
        return false
      })
    }

    // 按神殿筛选
    if (selectedCampus !== '全部') {
      result = result.filter((item) => item.campus === selectedCampus)
    }

    // 按关键字搜索
    if (searchText) {
      result = result.filter(
        (item) =>
          item.headTeacherName.toLowerCase().includes(searchText.toLowerCase()) ||
          item.newStudentName.toLowerCase().includes(searchText.toLowerCase()) ||
          item.enrollmentMajor.toLowerCase().includes(searchText.toLowerCase()) ||
          item.consultant.toLowerCase().includes(searchText.toLowerCase()) ||
          item.dormitoryName.toLowerCase().includes(searchText.toLowerCase()),
      )
    }

    setFilteredData(result)
  }, [searchText, selectedCampus, dataSource, selectedMonth])

  // 计算统计数据
  const totalRecords = filteredData.length
  const fullPaymentCount = filteredData.filter((item) => item.isFullPayment === '是').length
  const refundCount = filteredData.filter((item) => item.isRefund === '是').length
  const totalTuition = filteredData.reduce((sum, item) => sum + item.enrollmentPayment, 0)
  const totalArrears = filteredData.reduce((sum, item) => sum + item.arrearsAmount, 0)
  const loanCount = filteredData.filter((item) => item.hasLoan === '是').length

  // 添加记录
  const handleAdd = () => {
    setEditingRecord(null)
    form.resetFields()
    setModalVisible(true)
  }

  // 编辑记录
  const handleEdit = (record: MonthlyNewStudentStabilityDetailRecord) => {
    setEditingRecord(record)
    form.setFieldsValue({
      ...record,
      enrollmentDate: record.enrollmentDate ? dayjs(record.enrollmentDate) : undefined,
      reportDate: record.reportDate ? dayjs(record.reportDate) : undefined,
      refundDate: record.refundDate ? dayjs(record.refundDate) : undefined,
    })
    setModalVisible(true)
  }

  // 删除记录
  const handleDelete = (record: MonthlyNewStudentStabilityDetailRecord) => {
    modal.confirm({
      title: '确认删除',
      content: `确定要删除新生"${record.newStudentName}"的维稳记录吗？此操作不可恢复。`,
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
      if (values.reportDate) {
        values.reportDate = values.reportDate.format('YYYY-MM-DD')
      }
      if (values.refundDate) {
        values.refundDate = values.refundDate.format('YYYY-MM-DD')
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

        const newRecord: MonthlyNewStudentStabilityDetailRecord = {
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
  const columns: ColumnsType<MonthlyNewStudentStabilityDetailRecord> = [
    {
      title: '序号',
      dataIndex: 'serialNumber',
      key: 'serialNumber',
      width: 60,
      align: 'center',
      fixed: 'left',
    },
    {
      title: '班主任姓名',
      dataIndex: 'headTeacherName',
      key: 'headTeacherName',
      width: 110,
      align: 'center',
      fixed: 'left',
    },
    {
      title: '新生姓名',
      dataIndex: 'newStudentName',
      key: 'newStudentName',
      width: 100,
      align: 'center',
      fixed: 'left',
    },
    {
      title: '报名时间',
      dataIndex: 'enrollmentDate',
      key: 'enrollmentDate',
      width: 110,
      align: 'center',
    },
    {
      title: '报道时间',
      dataIndex: 'reportDate',
      key: 'reportDate',
      width: 110,
      align: 'center',
      render: (date: string) => date || '-',
    },
    {
      title: '报名专业',
      dataIndex: 'enrollmentMajor',
      key: 'enrollmentMajor',
      width: 120,
      align: 'center',
    },
    {
      title: '报名学制',
      dataIndex: 'enrollmentSystem',
      key: 'enrollmentSystem',
      width: 100,
      align: 'center',
    },
    {
      title: '应收学费',
      dataIndex: 'tuitionReceivable',
      key: 'tuitionReceivable',
      width: 100,
      align: 'right',
      render: (value: number) => `¥${value.toLocaleString()}`,
    },
    {
      title: '报名交费金额',
      dataIndex: 'enrollmentPayment',
      key: 'enrollmentPayment',
      width: 120,
      align: 'right',
      render: (value: number) => (value > 0 ? `¥${value.toLocaleString()}` : '-'),
    },
    {
      title: '补款金额',
      dataIndex: 'supplementPayment',
      key: 'supplementPayment',
      width: 100,
      align: 'right',
      render: (value: number) => (value > 0 ? `¥${value.toLocaleString()}` : '-'),
    },
    {
      title: '仍欠费金额',
      dataIndex: 'arrearsAmount',
      key: 'arrearsAmount',
      width: 110,
      align: 'right',
      render: (value: number) =>
        value > 0 ? <span style={{ color: '#ff4d4f' }}>¥{value.toLocaleString()}</span> : '-',
    },
    {
      title: '是否全款',
      dataIndex: 'isFullPayment',
      key: 'isFullPayment',
      width: 90,
      align: 'center',
      render: (value: string) => <Tag color={value === '是' ? 'green' : 'orange'}>{value}</Tag>,
    },
    {
      title: '是否贷款',
      dataIndex: 'hasLoan',
      key: 'hasLoan',
      width: 90,
      align: 'center',
      render: (value: string) => <Tag color={value === '是' ? 'blue' : 'default'}>{value}</Tag>,
    },
    {
      title: '是否过课时',
      dataIndex: 'hasPassedClass',
      key: 'hasPassedClass',
      width: 100,
      align: 'center',
      render: (value: string) => <Tag color={value === '是' ? 'green' : 'default'}>{value}</Tag>,
    },
    {
      title: '试学周期',
      dataIndex: 'trialPeriod',
      key: 'trialPeriod',
      width: 100,
      align: 'center',
    },
    {
      title: '是否退费',
      dataIndex: 'isRefund',
      key: 'isRefund',
      width: 90,
      align: 'center',
      render: (value: string) => <Tag color={value === '是' ? 'red' : 'green'}>{value}</Tag>,
    },
    {
      title: '退费时间',
      dataIndex: 'refundDate',
      key: 'refundDate',
      width: 110,
      align: 'center',
      render: (date: string) => date || '-',
    },
    {
      title: '退费情况说明',
      dataIndex: 'refundDescription',
      key: 'refundDescription',
      width: 150,
      align: 'center',
      render: (desc: string) => desc || '-',
    },
    {
      title: '咨询师',
      dataIndex: 'consultant',
      key: 'consultant',
      width: 100,
      align: 'center',
    },
    {
      title: '是否住宿',
      dataIndex: 'hasAccommodation',
      key: 'hasAccommodation',
      width: 90,
      align: 'center',
      render: (value: string) => <Tag color={value === '是' ? 'cyan' : 'default'}>{value}</Tag>,
    },
    {
      title: '宿舍名',
      dataIndex: 'dormitoryName',
      key: 'dormitoryName',
      width: 150,
      align: 'center',
      render: (name: string) => name || '-',
    },
    {
      title: '备注',
      dataIndex: 'remarks',
      key: 'remarks',
      width: 150,
      align: 'center',
      render: (remarks: string) => remarks || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      align: 'center',
      fixed: 'right',
      render: (_: any, record: MonthlyNewStudentStabilityDetailRecord) => (
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
            <UserOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
            <Title level={4} style={{ margin: 0 }}>
              神殿教化司当月新生维稳明细表
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
            <Input
              placeholder="搜索姓名、专业、咨询师、宿舍"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 250 }}
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
          <Col span={4}>
            <Statistic
              title="总学生数"
              value={totalRecords}
              suffix="人"
              prefix={<UserOutlined style={{ color: '#1890ff' }} />}
            />
          </Col>
          <Col span={4}>
            <Statistic
              title="全款人数"
              value={fullPaymentCount}
              suffix="人"
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            />
          </Col>
          <Col span={4}>
            <Statistic
              title="退费人数"
              value={refundCount}
              suffix="人"
              prefix={<DeleteOutlined style={{ color: '#ff4d4f' }} />}
            />
          </Col>
          <Col span={4}>
            <Statistic
              title="贷款人数"
              value={loanCount}
              suffix="人"
              prefix={<DollarOutlined style={{ color: '#1890ff' }} />}
            />
          </Col>
          <Col span={4}>
            <Statistic
              title="已交学费"
              value={totalTuition}
              prefix="¥"
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col span={4}>
            <Statistic
              title="欠款总额"
              value={totalArrears}
              prefix="¥"
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Col>
        </Row>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={filteredData}
          scroll={{ x: 2800, y: 600 }}
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
        title={editingRecord ? '编辑新生维稳记录' : '新增新生维稳记录'}
        open={modalVisible}
        onOk={handleSave}
        onCancel={handleCancel}
        width={900}
        okText="保存"
        cancelText="取消"
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            isFullPayment: '否',
            hasLoan: '否',
            hasPassedClass: '否',
            isRefund: '否',
            hasAccommodation: '否',
            enrollmentPayment: 0,
            supplementPayment: 0,
            arrearsAmount: 0,
          }}
        >
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="campus"
                label="神殿"
                rules={[{ required: true, message: '请选择神殿' }]}
              >
                <Select placeholder="请选择神殿">
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
            <Col span={8}>
              <Form.Item
                name="headTeacherName"
                label="班主任姓名"
                rules={[{ required: true, message: '请输入班主任姓名' }]}
              >
                <Input placeholder="请输入班主任姓名" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="newStudentName"
                label="新生姓名"
                rules={[{ required: true, message: '请输入新生姓名' }]}
              >
                <Input placeholder="请输入新生姓名" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="enrollmentDate"
                label="报名时间"
                rules={[{ required: true, message: '请选择报名时间' }]}
              >
                <DatePicker style={{ width: '100%' }} placeholder="请选择报名时间" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="reportDate" label="报道时间">
                <DatePicker style={{ width: '100%' }} placeholder="请选择报道时间" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="enrollmentMajor"
                label="报名专业"
                rules={[{ required: true, message: '请输入报名专业' }]}
              >
                <Input placeholder="请输入报名专业" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="enrollmentSystem"
                label="报名学制"
                rules={[{ required: true, message: '请输入报名学制' }]}
              >
                <Input placeholder="如：三年制、20个月" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="tuitionReceivable"
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
            <Col span={8}>
              <Form.Item name="enrollmentPayment" label="报名交费金额">
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="请输入交费金额"
                  min={0}
                  precision={0}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="supplementPayment" label="补款金额">
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="请输入补款金额"
                  min={0}
                  precision={0}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="arrearsAmount" label="仍欠费金额">
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="请输入欠款金额"
                  min={0}
                  precision={0}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="trialPeriod" label="试学周期">
                <Input placeholder="如：1.5天" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="isFullPayment" label="是否全款">
                <Select>
                  <Option value="是">是</Option>
                  <Option value="否">否</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="hasLoan" label="是否贷款">
                <Select>
                  <Option value="是">是</Option>
                  <Option value="否">否</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="hasPassedClass" label="是否过课时">
                <Select>
                  <Option value="是">是</Option>
                  <Option value="否">否</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="isRefund" label="是否退费">
                <Select>
                  <Option value="是">是</Option>
                  <Option value="否">否</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="refundDate" label="退费时间">
                <DatePicker style={{ width: '100%' }} placeholder="请选择退费时间" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="refundDescription" label="退费情况说明">
                <Input placeholder="请输入退费情况说明" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="consultant"
                label="咨询师"
                rules={[{ required: true, message: '请输入咨询师' }]}
              >
                <Input placeholder="请输入咨询师姓名" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="hasAccommodation" label="是否住宿">
                <Select>
                  <Option value="是">是</Option>
                  <Option value="否">否</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="dormitoryName" label="宿舍名">
                <Input placeholder="如：盛邦A栋301" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="remarks" label="备注">
                <Input placeholder="请输入备注信息" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  )
}

export default CampusMonthlyNewStudentStabilityDetailTable
