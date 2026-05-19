import React, { useState, useEffect } from 'react'
import {
  Table,
  Card,
  Typography,
  Space,
  Input,
  Button,
  Row,
  Col,
  Statistic,
  Select,
  Tabs,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  SearchOutlined,
  ReloadOutlined,
  DownloadOutlined,
  UserOutlined,
  TeamOutlined,
  DollarOutlined,
} from '@ant-design/icons'

const { Option } = Select

// 定义学员就业信息接口
interface StudentEmploymentRecord {
  key: string
  name: string // 姓名
  gender: string // 性别
  age: number // 年龄
  reportedMajor: string // 所报专业
  education: string // 学历
  specialization: string // 专业
  graduationSchool: string // 毕业学校
  highestCertificate: string // 目前所获最高学历证书及性质
  phone: string // 联系电话
  address: string // 通信地址
  entryDate: string // 入职时间
  employmentArea: string // 就业地区
  employmentUnit: string // 就业单位
  employmentPosition: string // 就业岗位
  probationSalary: number // 试用期薪资
  regularSalary: number // 转正薪资
  followUpSalary: number // 回访考核薪资
  classId: string // 班级ID
}

// 模拟数据 - 包含多个班级的学员数据
const mockStudentData: StudentEmploymentRecord[] = [
  // CS2024-01班级 (云计算)
  {
    key: '1',
    classId: 'CS2024-01',
    name: '董春本',
    gender: '男',
    age: 19,
    reportedMajor: '云计算',
    education: '中专',
    specialization: '云计算',
    graduationSchool: '石家庄市第一职业中专',
    highestCertificate: '中专毕业证书',
    phone: '13075200387',
    address: '河北省石家庄市',
    entryDate: '2024-06-20',
    employmentArea: '北京',
    employmentUnit: '北京宝通伟业科技有限公司',
    employmentPosition: '同事工程师',
    probationSalary: 4000,
    regularSalary: 6000,
    followUpSalary: 6300,
  },
  {
    key: '2',
    classId: 'CS2024-01',
    name: '刘金合',
    gender: '男',
    age: 20,
    reportedMajor: '云计算',
    education: '中专',
    specialization: '云计算',
    graduationSchool: '邢台市职业技术学校',
    highestCertificate: '中专毕业证书',
    phone: '13663110421',
    address: '河北省邢台市',
    entryDate: '2024-06-26',
    employmentArea: '北京',
    employmentUnit: '北京新点软广化有限公司',
    employmentPosition: '售后工程师',
    probationSalary: 4900,
    regularSalary: 6000,
    followUpSalary: 6000,
  },
  {
    key: '3',
    classId: 'CS2024-01',
    name: '李继云',
    gender: '男',
    age: 19,
    reportedMajor: '云计算',
    education: '中专',
    specialization: '云计算',
    graduationSchool: '保定市第二职业中专',
    highestCertificate: '中专毕业证书',
    phone: '18732197815',
    address: '河北省保定市',
    entryDate: '2024-06-26',
    employmentArea: '上海',
    employmentUnit: '上海远古电器技术有限公司',
    employmentPosition: '同事工程师',
    probationSalary: 7000,
    regularSalary: 7000,
    followUpSalary: 7000,
  },
  {
    key: '4',
    classId: 'CS2024-01',
    name: '刘洋强',
    gender: '男',
    age: 19,
    reportedMajor: '云计算',
    education: '中专',
    specialization: '云计算',
    graduationSchool: '沧州市职业技术学校',
    highestCertificate: '中专毕业证书',
    phone: '15531202164',
    address: '河北省沧州市',
    entryDate: '2024-07-01',
    employmentArea: '北京',
    employmentUnit: '北京诚盛嘉业科技有限公司',
    employmentPosition: '同事工程师',
    probationSalary: 5600,
    regularSalary: 7000,
    followUpSalary: 7000,
  },
  {
    key: '5',
    classId: 'CS2024-01',
    name: '郝耀田',
    gender: '男',
    age: 19,
    reportedMajor: '云计算',
    education: '中专',
    specialization: '云计算',
    graduationSchool: '唐山市职业中专',
    highestCertificate: '中专毕业证书',
    phone: '17532621286',
    address: '河北省唐山市',
    entryDate: '2024-07-02',
    employmentArea: '北京',
    employmentUnit: '上海云时科技有限公司',
    employmentPosition: '同事工程师',
    probationSalary: 5250,
    regularSalary: 6500,
    followUpSalary: 6500,
  },
  {
    key: '6',
    classId: 'CS2024-01',
    name: '宁详乾',
    gender: '男',
    age: 20,
    reportedMajor: '云计算',
    education: '中专',
    specialization: '云计算',
    graduationSchool: '廊坊市职业技术学校',
    highestCertificate: '中专毕业证书',
    phone: '17631669731',
    address: '河北省廊坊市',
    entryDate: '2024-07-05',
    employmentArea: '北京',
    employmentUnit: '北京泰美时代科技有限公司',
    employmentPosition: '同事工程师',
    probationSalary: 5600,
    regularSalary: 7000,
    followUpSalary: 7000,
  },
  {
    key: '7',
    classId: 'CS2024-01',
    name: '侯国宝',
    gender: '男',
    age: 19,
    reportedMajor: '云计算',
    education: '中专',
    specialization: '云计算',
    graduationSchool: '承德市职业中专',
    highestCertificate: '中专毕业证书',
    phone: '16032702306',
    address: '河北省承德市',
    entryDate: '2024-07-03',
    employmentArea: '上海',
    employmentUnit: '上海居家成科技工程有限公司',
    employmentPosition: '同事工程师',
    probationSalary: 5600,
    regularSalary: 7000,
    followUpSalary: 7000,
  },
  {
    key: '8',
    classId: 'CS2024-01',
    name: '云冥',
    gender: '男',
    age: 20,
    reportedMajor: '云计算',
    education: '中专',
    specialization: '云计算',
    graduationSchool: '张家口市职业技术学校',
    highestCertificate: '中专毕业证书',
    phone: '15711118290',
    address: '河北省张家口市',
    entryDate: '2024-07-08',
    employmentArea: '北京',
    employmentUnit: '北京京杰云途科技有限公司',
    employmentPosition: '同事工程师',
    probationSalary: 4800,
    regularSalary: 6000,
    followUpSalary: 8000,
  },
  {
    key: '9',
    classId: 'CS2024-01',
    name: '廖培豪',
    gender: '男',
    age: 20,
    reportedMajor: '云计算',
    education: '中专',
    specialization: '云计算',
    graduationSchool: '秦皇岛市职业中专',
    highestCertificate: '中专毕业证书',
    phone: '18148825801',
    address: '河北省秦皇岛市',
    entryDate: '2024-07-11',
    employmentArea: '上海',
    employmentUnit: '上海华智利创春季科技有限公司',
    employmentPosition: '运维工程师',
    probationSalary: 6000,
    regularSalary: 7500,
    followUpSalary: 8000,
  },
  {
    key: '10',
    classId: 'CS2024-01',
    name: '齐少启',
    gender: '男',
    age: 19,
    reportedMajor: '云计算',
    education: '中专',
    specialization: '云计算',
    graduationSchool: '衡水市职业技术学校',
    highestCertificate: '中专毕业证书',
    phone: '15674977039',
    address: '河北省衡水市',
    entryDate: '2024-07-19',
    employmentArea: '北京',
    employmentUnit: '北京思宏宏美科技有限公司',
    employmentPosition: '运维工程师',
    probationSalary: 6000,
    regularSalary: 8160,
    followUpSalary: 8160,
  },
  {
    key: '11',
    classId: 'CS2024-01',
    name: '王政雄',
    gender: '男',
    age: 19,
    reportedMajor: '云计算',
    education: '中专',
    specialization: '云计算',
    graduationSchool: '邯郸市职业中专',
    highestCertificate: '中专毕业证书',
    phone: '19226093159',
    address: '河北省邯郸市',
    entryDate: '2024-07-26',
    employmentArea: '北京',
    employmentUnit: '北京燕联凌万志科技有限公司',
    employmentPosition: '售后工程师',
    probationSalary: 5000,
    regularSalary: 5000,
    followUpSalary: 5000,
  },
  {
    key: '12',
    classId: 'CS2024-01',
    name: '姚宣睿',
    gender: '男',
    age: 19,
    reportedMajor: '云计算',
    education: '中专',
    specialization: '云计算',
    graduationSchool: '石家庄市第二职业中专',
    highestCertificate: '中专毕业证书',
    phone: '18633080206',
    address: '河北省石家庄市',
    entryDate: '2024-07-29',
    employmentArea: '北京',
    employmentUnit: '北京积瑞盈贸易科技有限公司',
    employmentPosition: '同事工程师',
    probationSalary: 6000,
    regularSalary: 7000,
    followUpSalary: 7000,
  },
  {
    key: '13',
    classId: 'CS2024-01',
    name: '黄少博',
    gender: '男',
    age: 19,
    reportedMajor: '云计算',
    education: '中专',
    specialization: '云计算',
    graduationSchool: '保定市职业技术学校',
    highestCertificate: '中专毕业证书',
    phone: '18891088148',
    address: '河北省保定市',
    entryDate: '2024-08-01',
    employmentArea: '北京',
    employmentUnit: '北京宜美睿杨科技有限公司',
    employmentPosition: '运维工程师',
    probationSalary: 7000,
    regularSalary: 8000,
    followUpSalary: 8000,
  },
  {
    key: '14',
    classId: 'CS2024-01',
    name: '张明辉',
    gender: '男',
    age: 20,
    reportedMajor: '云计算',
    education: '中专',
    specialization: '云计算',
    graduationSchool: '沧州市第一职业中专',
    highestCertificate: '中专毕业证书',
    phone: '15831156789',
    address: '河北省沧州市',
    entryDate: '2024-08-05',
    employmentArea: '北京',
    employmentUnit: '北京中科软件科技有限公司',
    employmentPosition: '运维工程师',
    probationSalary: 5500,
    regularSalary: 7000,
    followUpSalary: 7500,
  },
  {
    key: '15',
    classId: 'CS2024-01',
    name: '王建国',
    gender: '男',
    age: 19,
    reportedMajor: '云计算',
    education: '中专',
    specialization: '云计算',
    graduationSchool: '唐山市第一职业中专',
    highestCertificate: '中专毕业证书',
    phone: '15233445566',
    address: '河北省唐山市',
    entryDate: '2024-08-08',
    employmentArea: '上海',
    employmentUnit: '上海云帆科技有限公司',
    employmentPosition: '网络工程师',
    probationSalary: 6500,
    regularSalary: 8000,
    followUpSalary: 8500,
  },
  {
    key: '16',
    classId: 'CS2024-01',
    name: '李建华',
    gender: '男',
    age: 20,
    reportedMajor: '云计算',
    education: '中专',
    specialization: '云计算',
    graduationSchool: '廊坊市职业中专',
    highestCertificate: '中专毕业证书',
    phone: '13699887755',
    address: '河北省廊坊市',
    entryDate: '2024-08-10',
    employmentArea: '北京',
    employmentUnit: '北京中软国际科技服务有限公司',
    employmentPosition: '运维工程师',
    probationSalary: 5800,
    regularSalary: 7200,
    followUpSalary: 7800,
  },
  {
    key: '17',
    classId: 'CS2024-01',
    name: '赵永强',
    gender: '男',
    age: 19,
    reportedMajor: '云计算',
    education: '中专',
    specialization: '云计算',
    graduationSchool: '承德市职业技术学校',
    highestCertificate: '中专毕业证书',
    phone: '18032556677',
    address: '河北省承德市',
    entryDate: '2024-08-12',
    employmentArea: '北京',
    employmentUnit: '北京东方通科技股份有限公司',
    employmentPosition: '同事工程师',
    probationSalary: 5200,
    regularSalary: 6500,
    followUpSalary: 7000,
  },
  {
    key: '18',
    classId: 'CS2024-01',
    name: '刘德华',
    gender: '男',
    age: 20,
    reportedMajor: '云计算',
    education: '中专',
    specialization: '云计算',
    graduationSchool: '张家口市职业中专',
    highestCertificate: '中专毕业证书',
    phone: '15531223344',
    address: '河北省张家口市',
    entryDate: '2024-08-15',
    employmentArea: '北京',
    employmentUnit: '北京神州数码信息服务股份有限公司',
    employmentPosition: '售后工程师',
    probationSalary: 5600,
    regularSalary: 7000,
    followUpSalary: 7500,
  },
  {
    key: '19',
    classId: 'CS2024-01',
    name: '孙建民',
    gender: '男',
    age: 19,
    reportedMajor: '云计算',
    education: '中专',
    specialization: '云计算',
    graduationSchool: '秦皇岛市职业技术学校',
    highestCertificate: '中专毕业证书',
    phone: '13933445566',
    address: '河北省秦皇岛市',
    entryDate: '2024-08-18',
    employmentArea: '上海',
    employmentUnit: '上海华腾软件系统有限公司',
    employmentPosition: '网络工程师',
    probationSalary: 6200,
    regularSalary: 7600,
    followUpSalary: 8200,
  },
  {
    key: '20',
    classId: 'CS2024-01',
    name: '周文斌',
    gender: '男',
    age: 20,
    reportedMajor: '云计算',
    education: '中专',
    specialization: '云计算',
    graduationSchool: '衡水市职业中专',
    highestCertificate: '中专毕业证书',
    phone: '15032667788',
    address: '河北省衡水市',
    entryDate: '2024-08-20',
    employmentArea: '北京',
    employmentUnit: '北京华胜天成科技股份有限公司',
    employmentPosition: '运维工程师',
    probationSalary: 5400,
    regularSalary: 6800,
    followUpSalary: 7400,
  },

  // ACC2024-01班级 (网络工程)
  {
    key: '21',
    classId: 'ACC2024-01',
    name: '陈志远',
    gender: '男',
    age: 19,
    reportedMajor: '网络工程',
    education: '中专',
    specialization: '网络工程',
    graduationSchool: '北京市工业技师学院',
    highestCertificate: '中专毕业证书',
    phone: '13712345678',
    address: '北京市丰台区',
    entryDate: '2024-06-22',
    employmentArea: '北京',
    employmentUnit: '北京联想信息技术有限公司',
    employmentPosition: '网络工程师',
    probationSalary: 5500,
    regularSalary: 7000,
    followUpSalary: 7500,
  },
  {
    key: '22',
    classId: 'ACC2024-01',
    name: '杨海峰',
    gender: '男',
    age: 20,
    reportedMajor: '网络工程',
    education: '中专',
    specialization: '网络工程',
    graduationSchool: '天津市第一职业技术学校',
    highestCertificate: '中专毕业证书',
    phone: '15912345678',
    address: '天津市河西区',
    entryDate: '2024-06-28',
    employmentArea: '北京',
    employmentUnit: '北京华为数字技术有限公司',
    employmentPosition: '运维工程师',
    probationSalary: 6000,
    regularSalary: 7500,
    followUpSalary: 8000,
  },
  {
    key: '23',
    classId: 'ACC2024-01',
    name: '张艳丽',
    gender: '女',
    age: 19,
    reportedMajor: '网络工程',
    education: '中专',
    specialization: '网络工程',
    graduationSchool: '石家庄市职业技术学校',
    highestCertificate: '中专毕业证书',
    phone: '13534567890',
    address: '河北省石家庄市',
    entryDate: '2024-07-02',
    employmentArea: '北京',
    employmentUnit: '北京中国电信股份有限公司',
    employmentPosition: '网络工程师',
    probationSalary: 5200,
    regularSalary: 6500,
    followUpSalary: 7000,
  },
  {
    key: '24',
    classId: 'ACC2024-01',
    name: '王伟',
    gender: '男',
    age: 20,
    reportedMajor: '网络工程',
    education: '中专',
    specialization: '网络工程',
    graduationSchool: '邯郸市职业技术学校',
    highestCertificate: '中专毕业证书',
    phone: '18132456789',
    address: '河北省邯郸市',
    entryDate: '2024-07-05',
    employmentArea: '北京',
    employmentUnit: '北京航天科工信息技术有限公司',
    employmentPosition: '运维工程师',
    probationSalary: 5800,
    regularSalary: 7200,
    followUpSalary: 7800,
  },
  {
    key: '25',
    classId: 'ACC2024-01',
    name: '李建',
    gender: '男',
    age: 19,
    reportedMajor: '网络工程',
    education: '中专',
    specialization: '网络工程',
    graduationSchool: '邢台市职业中专',
    highestCertificate: '中专毕业证书',
    phone: '13243567890',
    address: '河北省邢台市',
    entryDate: '2024-07-10',
    employmentArea: '上海',
    employmentUnit: '上海浪潮软件股份有限公司',
    employmentPosition: '同事工程师',
    probationSalary: 6200,
    regularSalary: 7600,
    followUpSalary: 8200,
  },
  {
    key: '26',
    classId: 'ACC2024-01',
    name: '张凯',
    gender: '男',
    age: 20,
    reportedMajor: '网络工程',
    education: '中专',
    specialization: '网络工程',
    graduationSchool: '保定市职业中专',
    highestCertificate: '中专毕业证书',
    phone: '15634567891',
    address: '河北省保定市',
    entryDate: '2024-07-12',
    employmentArea: '北京',
    employmentUnit: '北京用友软件股份有限公司',
    employmentPosition: '网络工程师',
    probationSalary: 5600,
    regularSalary: 7000,
    followUpSalary: 7600,
  },
  {
    key: '27',
    classId: 'ACC2024-01',
    name: '刘芳',
    gender: '女',
    age: 19,
    reportedMajor: '网络工程',
    education: '中专',
    specialization: '网络工程',
    graduationSchool: '唐山市职业技术学校',
    highestCertificate: '中专毕业证书',
    phone: '13845678902',
    address: '河北省唐山市',
    entryDate: '2024-07-15',
    employmentArea: '北京',
    employmentUnit: '北京启明星辰信息安全技术有限公司',
    employmentPosition: '售后工程师',
    probationSalary: 5400,
    regularSalary: 6800,
    followUpSalary: 7400,
  },
  {
    key: '28',
    classId: 'ACC2024-01',
    name: '马超',
    gender: '男',
    age: 20,
    reportedMajor: '网络工程',
    education: '中专',
    specialization: '网络工程',
    graduationSchool: '廊坊市职业技术学校',
    highestCertificate: '中专毕业证书',
    phone: '15156789013',
    address: '河北省廊坊市',
    entryDate: '2024-07-18',
    employmentArea: '上海',
    employmentUnit: '上海宝信软件股份有限公司',
    employmentPosition: '运维工程师',
    probationSalary: 6000,
    regularSalary: 7500,
    followUpSalary: 8100,
  },
  {
    key: '29',
    classId: 'ACC2024-01',
    name: '吴静',
    gender: '女',
    age: 19,
    reportedMajor: '网络工程',
    education: '中专',
    specialization: '网络工程',
    graduationSchool: '秦皇岛市职业中专',
    highestCertificate: '中专毕业证书',
    phone: '13667890124',
    address: '河北省秦皇岛市',
    entryDate: '2024-07-20',
    employmentArea: '北京',
    employmentUnit: '北京东软集团股份有限公司',
    employmentPosition: '网络工程师',
    probationSalary: 5500,
    regularSalary: 6900,
    followUpSalary: 7500,
  },
  {
    key: '30',
    classId: 'ACC2024-01',
    name: '徐明',
    gender: '男',
    age: 20,
    reportedMajor: '网络工程',
    education: '中专',
    specialization: '网络工程',
    graduationSchool: '承德市职业中专',
    highestCertificate: '中专毕业证书',
    phone: '18978901235',
    address: '河北省承德市',
    entryDate: '2024-07-22',
    employmentArea: '北京',
    employmentUnit: '北京文思海辉技术有限公司',
    employmentPosition: '同事工程师',
    probationSalary: 5800,
    regularSalary: 7200,
    followUpSalary: 7800,
  },
  {
    key: '31',
    classId: 'ACC2024-01',
    name: '周丽',
    gender: '女',
    age: 19,
    reportedMajor: '网络工程',
    education: '中专',
    specialization: '网络工程',
    graduationSchool: '张家口市职业技术学校',
    highestCertificate: '中专毕业证书',
    phone: '15189012346',
    address: '河北省张家口市',
    entryDate: '2024-07-25',
    employmentArea: '北京',
    employmentUnit: '北京赛门铁克科技有限公司',
    employmentPosition: '售后工程师',
    probationSalary: 5300,
    regularSalary: 6600,
    followUpSalary: 7200,
  },
  {
    key: '32',
    classId: 'ACC2024-01',
    name: '孙强',
    gender: '男',
    age: 20,
    reportedMajor: '网络工程',
    education: '中专',
    specialization: '网络工程',
    graduationSchool: '衡水市职业技术学校',
    highestCertificate: '中专毕业证书',
    phone: '13390123457',
    address: '河北省衡水市',
    entryDate: '2024-07-28',
    employmentArea: '上海',
    employmentUnit: '上海汉得信息技术股份有限公司',
    employmentPosition: '运维工程师',
    probationSalary: 6100,
    regularSalary: 7600,
    followUpSalary: 8200,
  },
  {
    key: '33',
    classId: 'ACC2024-01',
    name: '陈娜',
    gender: '女',
    age: 19,
    reportedMajor: '网络工程',
    education: '中专',
    specialization: '网络工程',
    graduationSchool: '沧州市职业中专',
    highestCertificate: '中专毕业证书',
    phone: '17701234568',
    address: '河北省沧州市',
    entryDate: '2024-08-02',
    employmentArea: '北京',
    employmentUnit: '北京金山软件股份有限公司',
    employmentPosition: '网络工程师',
    probationSalary: 5700,
    regularSalary: 7100,
    followUpSalary: 7700,
  },
  {
    key: '34',
    classId: 'ACC2024-01',
    name: '郑涛',
    gender: '男',
    age: 20,
    reportedMajor: '网络工程',
    education: '中专',
    specialization: '网络工程',
    graduationSchool: '石家庄市第三职业中专',
    highestCertificate: '中专毕业证书',
    phone: '15512345679',
    address: '河北省石家庄市',
    entryDate: '2024-08-05',
    employmentArea: '北京',
    employmentUnit: '北京高伟达软件股份有限公司',
    employmentPosition: '同事工程师',
    probationSalary: 5900,
    regularSalary: 7300,
    followUpSalary: 7900,
  },
  {
    key: '35',
    classId: 'ACC2024-01',
    name: '何玲',
    gender: '女',
    age: 19,
    reportedMajor: '网络工程',
    education: '中专',
    specialization: '网络工程',
    graduationSchool: '保定市第三职业技术学校',
    highestCertificate: '中专毕业证书',
    phone: '13823456780',
    address: '河北省保定市',
    entryDate: '2024-08-08',
    employmentArea: '上海',
    employmentUnit: '上海科泰世纪科技股份有限公司',
    employmentPosition: '售后工程师',
    probationSalary: 5600,
    regularSalary: 7000,
    followUpSalary: 7600,
  },
  {
    key: '36',
    classId: 'ACC2024-01',
    name: '冯军',
    gender: '男',
    age: 20,
    reportedMajor: '网络工程',
    education: '中专',
    specialization: '网络工程',
    graduationSchool: '唐山市第二职业中专',
    highestCertificate: '中专毕业证书',
    phone: '15934567891',
    address: '河北省唐山市',
    entryDate: '2024-08-10',
    employmentArea: '北京',
    employmentUnit: '北京超图软件股份有限公司',
    employmentPosition: '运维工程师',
    probationSalary: 6000,
    regularSalary: 7500,
    followUpSalary: 8100,
  },
  {
    key: '37',
    classId: 'ACC2024-01',
    name: '姜梅',
    gender: '女',
    age: 19,
    reportedMajor: '网络工程',
    education: '中专',
    specialization: '网络工程',
    graduationSchool: '廊坊市第二职业中专',
    highestCertificate: '中专毕业证书',
    phone: '18145678902',
    address: '河北省廊坊市',
    entryDate: '2024-08-13',
    employmentArea: '北京',
    employmentUnit: '北京数字政通科技股份有限公司',
    employmentPosition: '网络工程师',
    probationSalary: 5500,
    regularSalary: 6900,
    followUpSalary: 7500,
  },
  {
    key: '38',
    classId: 'ACC2024-01',
    name: '邓辉',
    gender: '男',
    age: 20,
    reportedMajor: '网络工程',
    education: '中专',
    specialization: '网络工程',
    graduationSchool: '秦皇岛市第二职业技术学校',
    highestCertificate: '中专毕业证书',
    phone: '13656789013',
    address: '河北省秦皇岛市',
    entryDate: '2024-08-15',
    employmentArea: '上海',
    employmentUnit: '上海万达信息股份有限公司',
    employmentPosition: '同事工程师',
    probationSalary: 5800,
    regularSalary: 7200,
    followUpSalary: 7800,
  },
  {
    key: '39',
    classId: 'ACC2024-01',
    name: '薛芬',
    gender: '女',
    age: 19,
    reportedMajor: '网络工程',
    education: '中专',
    specialization: '网络工程',
    graduationSchool: '承德市第二职业技术学校',
    highestCertificate: '中专毕业证书',
    phone: '15167890124',
    address: '河北省承德市',
    entryDate: '2024-08-18',
    employmentArea: '北京',
    employmentUnit: '北京同方股份有限公司',
    employmentPosition: '售后工程师',
    probationSalary: 5400,
    regularSalary: 6800,
    followUpSalary: 7400,
  },
  {
    key: '40',
    classId: 'ACC2024-01',
    name: '范鹏',
    gender: '男',
    age: 20,
    reportedMajor: '网络工程',
    education: '中专',
    specialization: '网络工程',
    graduationSchool: '张家口市第二职业中专',
    highestCertificate: '中专毕业证书',
    phone: '18978901235',
    address: '河北省张家口市',
    entryDate: '2024-08-20',
    employmentArea: '北京',
    employmentUnit: '北京久其软件股份有限公司',
    employmentPosition: '运维工程师',
    probationSalary: 5700,
    regularSalary: 7100,
    followUpSalary: 7700,
  },

  // Y32班数据
  {
    key: '41',
    classId: 'Y32',
    name: '张三',
    gender: '男',
    age: 19,
    reportedMajor: '云计算',
    education: '中专',
    specialization: '云计算',
    graduationSchool: '石家庄市职业技术学校',
    highestCertificate: '中专毕业证书',
    phone: '13800138001',
    address: '河北省石家庄市',
    entryDate: '2024-06-15',
    employmentArea: '北京',
    employmentUnit: '北京科技有限公司',
    employmentPosition: '运维工程师',
    probationSalary: 4500,
    regularSalary: 6000,
    followUpSalary: 6500,
  },
  {
    key: '42',
    classId: 'Y32',
    name: '李四',
    gender: '女',
    age: 20,
    reportedMajor: '云计算',
    education: '中专',
    specialization: '云计算',
    graduationSchool: '保定市职业技术学校',
    highestCertificate: '中专毕业证书',
    phone: '13800138002',
    address: '河北省保定市',
    entryDate: '2024-06-20',
    employmentArea: '北京',
    employmentUnit: '北京软件股份有限公司',
    employmentPosition: '开发工程师',
    probationSalary: 5000,
    regularSalary: 6500,
    followUpSalary: 7000,
  },
  {
    key: '43',
    classId: 'Y32',
    name: '王五',
    gender: '男',
    age: 19,
    reportedMajor: '云计算',
    education: '中专',
    specialization: '云计算',
    graduationSchool: '唐山市职业技术学校',
    highestCertificate: '中专毕业证书',
    phone: '13800138003',
    address: '河北省唐山市',
    entryDate: '2024-06-25',
    employmentArea: '上海',
    employmentUnit: '上海信息科技有限公司',
    employmentPosition: '运维工程师',
    probationSalary: 4800,
    regularSalary: 6200,
    followUpSalary: 6800,
  },
  {
    key: '44',
    classId: 'Y32',
    name: '赵六',
    gender: '女',
    age: 20,
    reportedMajor: '云计算',
    education: '中专',
    specialization: '云计算',
    graduationSchool: '邯郸市职业技术学校',
    highestCertificate: '中专毕业证书',
    phone: '13800138004',
    address: '河北省邯郸市',
    entryDate: '2024-07-01',
    employmentArea: '北京',
    employmentUnit: '北京科技股份有限公司',
    employmentPosition: '测试工程师',
    probationSalary: 4200,
    regularSalary: 5800,
    followUpSalary: 6300,
  },
  {
    key: '45',
    classId: 'Y32',
    name: '钱七',
    gender: '男',
    age: 19,
    reportedMajor: '云计算',
    education: '中专',
    specialization: '云计算',
    graduationSchool: '邢台市职业技术学校',
    highestCertificate: '中专毕业证书',
    phone: '13800138005',
    address: '河北省邢台市',
    entryDate: '2024-07-05',
    employmentArea: '北京',
    employmentUnit: '北京信息技术有限公司',
    employmentPosition: '开发工程师',
    probationSalary: 4900,
    regularSalary: 6400,
    followUpSalary: 6900,
  },
  {
    key: '46',
    classId: 'Y32',
    name: '孙八',
    gender: '女',
    age: 20,
    reportedMajor: '云计算',
    education: '中专',
    specialization: '云计算',
    graduationSchool: '沧州市职业技术学校',
    highestCertificate: '中专毕业证书',
    phone: '13800138006',
    address: '河北省沧州市',
    entryDate: '2024-07-10',
    employmentArea: '上海',
    employmentUnit: '上海软件技术有限公司',
    employmentPosition: '运维工程师',
    probationSalary: 4700,
    regularSalary: 6100,
    followUpSalary: 6600,
  },

  // Y33班数据
  {
    key: '47',
    classId: 'Y33',
    name: '周九',
    gender: '男',
    age: 19,
    reportedMajor: '网络工程',
    education: '中专',
    specialization: '网络工程',
    graduationSchool: '廊坊市职业技术学校',
    highestCertificate: '中专毕业证书',
    phone: '13800138007',
    address: '河北省廊坊市',
    entryDate: '2024-06-18',
    employmentArea: '北京',
    employmentUnit: '北京网络科技有限公司',
    employmentPosition: '网络工程师',
    probationSalary: 4600,
    regularSalary: 5900,
    followUpSalary: 6400,
  },
  {
    key: '48',
    classId: 'Y33',
    name: '吴十',
    gender: '女',
    age: 20,
    reportedMajor: '网络工程',
    education: '中专',
    specialization: '网络工程',
    graduationSchool: '承德市职业技术学校',
    highestCertificate: '中专毕业证书',
    phone: '13800138008',
    address: '河北省承德市',
    entryDate: '2024-06-22',
    employmentArea: '北京',
    employmentUnit: '北京通信技术有限公司',
    employmentPosition: '网络工程师',
    probationSalary: 4800,
    regularSalary: 6200,
    followUpSalary: 6700,
  },
  {
    key: '49',
    classId: 'Y33',
    name: '郑十一',
    gender: '男',
    age: 19,
    reportedMajor: '网络工程',
    education: '中专',
    specialization: '网络工程',
    graduationSchool: '张家口市职业技术学校',
    highestCertificate: '中专毕业证书',
    phone: '13800138009',
    address: '河北省张家口市',
    entryDate: '2024-06-28',
    employmentArea: '上海',
    employmentUnit: '上海网络股份有限公司',
    employmentPosition: '运维工程师',
    probationSalary: 5000,
    regularSalary: 6500,
    followUpSalary: 7000,
  },
  {
    key: '50',
    classId: 'Y33',
    name: '王十二',
    gender: '女',
    age: 20,
    reportedMajor: '网络工程',
    education: '中专',
    specialization: '网络工程',
    graduationSchool: '秦皇岛市职业技术学校',
    highestCertificate: '中专毕业证书',
    phone: '13800138010',
    address: '河北省秦皇岛市',
    entryDate: '2024-07-03',
    employmentArea: '北京',
    employmentUnit: '北京互联网科技有限公司',
    employmentPosition: '网络工程师',
    probationSalary: 4700,
    regularSalary: 6100,
    followUpSalary: 6600,
  },
  {
    key: '51',
    classId: 'Y33',
    name: '冯十三',
    gender: '男',
    age: 19,
    reportedMajor: '网络工程',
    education: '中专',
    specialization: '网络工程',
    graduationSchool: '衡水市职业技术学校',
    highestCertificate: '中专毕业证书',
    phone: '13800138011',
    address: '河北省衡水市',
    entryDate: '2024-07-08',
    employmentArea: '北京',
    employmentUnit: '北京科技网络有限公司',
    employmentPosition: '系统工程师',
    probationSalary: 4900,
    regularSalary: 6300,
    followUpSalary: 6800,
  },
  {
    key: '52',
    classId: 'Y33',
    name: '陈十四',
    gender: '女',
    age: 20,
    reportedMajor: '网络工程',
    education: '中专',
    specialization: '网络工程',
    graduationSchool: '石家庄市第二职业技术学校',
    highestCertificate: '中专毕业证书',
    phone: '13800138012',
    address: '河北省石家庄市',
    entryDate: '2024-07-12',
    employmentArea: '上海',
    employmentUnit: '上海网络科技有限公司',
    employmentPosition: '网络工程师',
    probationSalary: 4800,
    regularSalary: 6200,
    followUpSalary: 6700,
  },

  // Y34班数据
  {
    key: '53',
    classId: 'Y34',
    name: '褚十五',
    gender: '男',
    age: 19,
    reportedMajor: '云计算',
    education: '中专',
    specialization: '云计算',
    graduationSchool: '保定市第二职业技术学校',
    highestCertificate: '中专毕业证书',
    phone: '13800138013',
    address: '河北省保定市',
    entryDate: '2024-06-17',
    employmentArea: '北京',
    employmentUnit: '北京云计算科技有限公司',
    employmentPosition: '云运维工程师',
    probationSalary: 5200,
    regularSalary: 6700,
    followUpSalary: 7200,
  },
  {
    key: '54',
    classId: 'Y34',
    name: '卫十六',
    gender: '女',
    age: 20,
    reportedMajor: '云计算',
    education: '中专',
    specialization: '云计算',
    graduationSchool: '唐山市第二职业技术学校',
    highestCertificate: '中专毕业证书',
    phone: '13800138014',
    address: '河北省唐山市',
    entryDate: '2024-06-21',
    employmentArea: '北京',
    employmentUnit: '北京大数据科技有限公司',
    employmentPosition: '数据工程师',
    probationSalary: 5100,
    regularSalary: 6600,
    followUpSalary: 7100,
  },
  {
    key: '55',
    classId: 'Y34',
    name: '蒋十七',
    gender: '男',
    age: 19,
    reportedMajor: '云计算',
    education: '中专',
    specialization: '云计算',
    graduationSchool: '邯郸市第二职业技术学校',
    highestCertificate: '中专毕业证书',
    phone: '13800138015',
    address: '河北省邯郸市',
    entryDate: '2024-06-26',
    employmentArea: '上海',
    employmentUnit: '上海云计算股份有限公司',
    employmentPosition: '云开发工程师',
    probationSalary: 5300,
    regularSalary: 6800,
    followUpSalary: 7300,
  },
  {
    key: '56',
    classId: 'Y34',
    name: '沈十八',
    gender: '女',
    age: 20,
    reportedMajor: '云计算',
    education: '中专',
    specialization: '云计算',
    graduationSchool: '邢台市第二职业技术学校',
    highestCertificate: '中专毕业证书',
    phone: '13800138016',
    address: '河北省邢台市',
    entryDate: '2024-07-02',
    employmentArea: '北京',
    employmentUnit: '北京云计算服务有限公司',
    employmentPosition: '运维工程师',
    probationSalary: 5000,
    regularSalary: 6500,
    followUpSalary: 7000,
  },
  {
    key: '57',
    classId: 'Y34',
    name: '韩十九',
    gender: '男',
    age: 19,
    reportedMajor: '云计算',
    education: '中专',
    specialization: '云计算',
    graduationSchool: '沧州市第二职业技术学校',
    highestCertificate: '中专毕业证书',
    phone: '13800138017',
    address: '河北省沧州市',
    entryDate: '2024-07-06',
    employmentArea: '北京',
    employmentUnit: '北京云平台技术有限公司',
    employmentPosition: '云平台工程师',
    probationSalary: 5400,
    regularSalary: 6900,
    followUpSalary: 7400,
  },
  {
    key: '58',
    classId: 'Y34',
    name: '杨二十',
    gender: '女',
    age: 20,
    reportedMajor: '云计算',
    education: '中专',
    specialization: '云计算',
    graduationSchool: '廊坊市第二职业技术学校',
    highestCertificate: '中专毕业证书',
    phone: '13800138018',
    address: '河北省廊坊市',
    entryDate: '2024-07-11',
    employmentArea: '上海',
    employmentUnit: '上海云服务科技有限公司',
    employmentPosition: '云运维工程师',
    probationSalary: 5200,
    regularSalary: 6700,
    followUpSalary: 7200,
  },
]

// 班级列表（用于下拉选择框）
const classList = [
  { id: 'CS2024-01', name: 'CS2024-01班（云计算）' },
  { id: 'ACC2024-01', name: 'ACC2024-01班（网络工程）' },
  { id: 'Y32', name: 'Y32班' },
  { id: 'Y33', name: 'Y33班' },
  { id: 'Y34', name: 'Y34班' },
]

// 标签栏班级列表（与"学员就业目标与结果汇总表"页面保持一致）
const classTabs = [
  { key: 'summary', label: '汇总' },
  { key: 'Y32', label: 'Y32班' },
  { key: 'Y33', label: 'Y33班' },
  { key: 'Y34', label: 'Y34班' },
]

const CampusClassEmploymentInfoTable: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const [searchText, setSearchText] = useState('')
  // 从URL参数读取班级，如果没有则使用默认值
  const urlClass = searchParams.get('class')
  // 如果URL参数是Y32、Y33、Y34，直接使用；否则默认显示汇总（所有数据）
  const initialClass = urlClass || 'summary'
  const [selectedClass, setSelectedClass] = useState<string>(initialClass)

  // 根据选中的班级过滤数据（汇总显示所有Y32、Y33、Y34班的数据）
  const getFilteredData = (classKey: string) => {
    if (classKey === 'summary') {
      // 汇总模式：显示Y32、Y33、Y34班的所有数据
      return mockStudentData.filter((item) => ['Y32', 'Y33', 'Y34'].includes(item.classId))
    } else {
      // 具体班级：只显示该班级的数据
      return mockStudentData.filter((item) => item.classId === classKey)
    }
  }

  const [filteredData, setFilteredData] = useState<StudentEmploymentRecord[]>(
    getFilteredData(initialClass),
  )

  // 当URL参数变化时，更新选中的班级
  useEffect(() => {
    if (urlClass && classTabs.some((cls) => cls.key === urlClass)) {
      setSelectedClass(urlClass)
      const classData = getFilteredData(urlClass)
      setFilteredData(classData)
      setSearchText('')
    } else if (!urlClass) {
      // 如果没有URL参数，显示汇总
      setSelectedClass('summary')
      const classData = getFilteredData('summary')
      setFilteredData(classData)
      setSearchText('')
    }
  }, [urlClass])

  // 处理班级标签切换
  const handleClassTabChange = (key: string) => {
    setSelectedClass(key)
    setSearchText('')
    const classData = getFilteredData(key)
    setFilteredData(classData)
    // 更新URL参数（如果是汇总，可以不带参数或带summary参数）
    if (key === 'summary') {
      navigate('/campus/class-employment-info', { replace: true })
    } else {
      const newSearchParams = new URLSearchParams(searchParams)
      newSearchParams.set('class', key)
      navigate(`?${newSearchParams.toString()}`, { replace: true })
    }
  }

  const handleClassChange = (classId: string) => {
    // 使用相同的处理逻辑
    handleClassTabChange(classId)
  }

  const handleSearch = (value: string) => {
    setSearchText(value)
    const baseData = getFilteredData(selectedClass)

    if (value) {
      const lowercasedValue = value.toLowerCase()
      const filtered = baseData.filter(
        (record) =>
          record.name.toLowerCase().includes(lowercasedValue) ||
          record.reportedMajor.toLowerCase().includes(lowercasedValue) ||
          record.employmentUnit.toLowerCase().includes(lowercasedValue),
      )
      setFilteredData(filtered)
    } else {
      setFilteredData(baseData)
    }
  }

  const handleRefresh = () => {
    setSearchText('')
    const classData = getFilteredData(selectedClass)
    setFilteredData(classData)
  }

  const handleExport = () => {
    console.log('导出数据')
  }

  const studentColumns: ColumnsType<StudentEmploymentRecord> = [
    {
      title: '序号',
      dataIndex: 'key',
      key: 'key',
      width: 70,
      fixed: 'left',
      render: (text, record, index) => index + 1,
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 100,
      fixed: 'left',
    },
    {
      title: '性别',
      dataIndex: 'gender',
      key: 'gender',
      width: 70,
    },
    {
      title: '年龄',
      dataIndex: 'age',
      key: 'age',
      width: 70,
    },
    {
      title: '所报专业',
      dataIndex: 'reportedMajor',
      key: 'reportedMajor',
      width: 150,
    },
    {
      title: '学历',
      dataIndex: 'education',
      key: 'education',
      width: 100,
    },
    {
      title: '专业',
      dataIndex: 'specialization',
      key: 'specialization',
      width: 120,
    },
    {
      title: '毕业学校',
      dataIndex: 'graduationSchool',
      key: 'graduationSchool',
      width: 150,
    },
    {
      title: '目前所获最高学历证书及性质',
      dataIndex: 'highestCertificate',
      key: 'highestCertificate',
      width: 220,
    },
    {
      title: '联系电话',
      dataIndex: 'phone',
      key: 'phone',
      width: 130,
    },
    {
      title: '通信地址',
      dataIndex: 'address',
      key: 'address',
      width: 200,
    },
    {
      title: '入职时间',
      dataIndex: 'entryDate',
      key: 'entryDate',
      width: 120,
    },
    {
      title: '就业地区',
      dataIndex: 'employmentArea',
      key: 'employmentArea',
      width: 120,
    },
    {
      title: '就业单位',
      dataIndex: 'employmentUnit',
      key: 'employmentUnit',
      width: 180,
    },
    {
      title: '就业岗位',
      dataIndex: 'employmentPosition',
      key: 'employmentPosition',
      width: 150,
    },
    {
      title: '试用期薪资',
      dataIndex: 'probationSalary',
      key: 'probationSalary',
      width: 120,
      render: (value) => (value ? `¥${value}` : '-'),
    },
    {
      title: '转正薪资',
      dataIndex: 'regularSalary',
      key: 'regularSalary',
      width: 120,
      render: (value) => (value ? `¥${value}` : '-'),
    },
    {
      title: '回访考核薪资',
      dataIndex: 'followUpSalary',
      key: 'followUpSalary',
      width: 130,
      render: (value) => (value ? `¥${value}` : '-'),
    },
  ]

  // 计算当前班级的统计数据
  const totalStudents = filteredData.length
  const avgProbationSalary =
    totalStudents > 0
      ? Math.round(
          filteredData.reduce((sum, item) => sum + item.probationSalary, 0) / totalStudents,
        )
      : 0
  const avgRegularSalary =
    totalStudents > 0
      ? Math.round(filteredData.reduce((sum, item) => sum + item.regularSalary, 0) / totalStudents)
      : 0
  const avgFollowUpSalary =
    totalStudents > 0
      ? Math.round(filteredData.reduce((sum, item) => sum + item.followUpSalary, 0) / totalStudents)
      : 0

  return (
    <div style={{ padding: 24 }}>
      {/* 班级标签栏 */}
      <Card
        style={{
          marginBottom: 16,
          backgroundColor: '#fff',
        }}
      >
        <Tabs
          activeKey={selectedClass}
          onChange={handleClassTabChange}
          type="card"
          items={classTabs.map((tab) => ({ key: tab.key, label: tab.label }))}
        />
      </Card>

      {/* 关键指标卡片 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title="当前班级学员人数"
              value={totalStudents}
              suffix="人"
              prefix={<UserOutlined style={{ color: '#1890ff' }} />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="平均试用期薪资"
              value={avgProbationSalary}
              suffix="元"
              prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="平均转正薪资"
              value={avgRegularSalary}
              suffix="元"
              prefix={<DollarOutlined style={{ color: '#faad14' }} />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="平均回访考核薪资"
              value={avgFollowUpSalary}
              suffix="元"
              prefix={<DollarOutlined style={{ color: '#722ed1' }} />}
            />
          </Col>
        </Row>
      </Card>

      {/* 学员就业信息表 */}
      <Card
        title={`神殿班级就业信息表 - ${selectedClass === 'summary' ? '汇总' : classTabs.find((c) => c.key === selectedClass)?.label || ''}`}
        extra={
          <Space>
            <Select value={selectedClass} onChange={handleClassChange} style={{ width: 200 }}>
              {classTabs.map((tab) => (
                <Option key={tab.key} value={tab.key}>
                  {tab.label}
                </Option>
              ))}
            </Select>
            <Input.Search
              placeholder="搜索姓名/专业/单位"
              onSearch={handleSearch}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 200 }}
              allowClear
            />
            <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
              刷新
            </Button>
            <Button icon={<DownloadOutlined />} onClick={handleExport}>
              导出
            </Button>
          </Space>
        }
      >
        <Table
          columns={studentColumns}
          dataSource={filteredData}
          pagination={false}
          bordered
          scroll={{ x: 'max-content' }}
        />
      </Card>
    </div>
  )
}

export default CampusClassEmploymentInfoTable
