/**
 * 神殿教化司员工功能分析表页面
 */

import React, { useState, useMemo } from 'react'
import { App, Card, Table, Button, Space, Select, Tabs } from 'antd'
import { ReloadOutlined, DownloadOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useCampusStore } from '@/stores/campusStore'

const { Option } = Select

// 班主任功能分析记录接口（第二个标签使用）
interface TeacherFunctionAnalysisRecord {
  key: string
  serialNumber: number // 序号
  category: string // 类别：核心业务能力、一般业务能力、价值观、其他
  functionItem: string // 功能项目
  detailedRequirement: string // 详细要求
  fullScore: number // 满分
  [key: string]: any // 动态员工列（如张三、李四等）
  rowType?: 'data' | 'total' // 行类型
}

// 员工功能分析记录接口（第一个标签使用）
interface EmployeeFunctionAnalysisRecord {
  key: string
  month: number | string // 月份（1-12 或 "合计/平均"）
  employeeName: string // 员工姓名
  // 带班
  classLoad: number // 带班量
  classStudentCount: number // 带班人数
  // 带宿舍
  dormitoryLoad: number // 带宿舍量
  dormitoryStudentCount: number // 带宿舍人数
  // 其他指标
  averageAttendanceRate: number // 学生平均出勤率
  dailyInterviewRate: number // 日常访谈率
  parentInterviewRate: number // 家长访谈率
  qualityClassCount: number // 素质课次数
  activityOrganizationCount: number // 活动组织次数
  // 就业
  employmentRate: number // 就业率
  averageEmploymentSalary: number // 就业平均薪资
  employmentCount: number // 就业人数
  // 口碑
  reputationEnrollmentCount: number // 口碑报名人数
  reputationRevenue: number // 口碑收入
  // 异动
  fluctuationCount: number // 异动人数
  fluctuationRate: number // 异动率
  // 退费
  refundCount: number // 退费人数
  refundRate: number // 退费率
  // 升学
  enrollmentRate: number // 升学率
  rowType?: 'data' | 'total' // 行类型
}

const CampusEmployeeFunctionAnalysisPage: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus, getAllCampuses, setCampus } = useCampusStore()
  const campuses = getAllCampuses()
  const [selectedCampus, setSelectedCampus] = useState<string>(currentCampus || '')
  const [activeTab, setActiveTab] = useState<string>('business')

  // 初始化数据：每个月3个员工（张三、李四、王五），共12个月
  const employees = ['张三', '李四', '王五']

  // 创建数据初始化函数
  const createInitialData = (): EmployeeFunctionAnalysisRecord[] => {
    const data: EmployeeFunctionAnalysisRecord[] = []

    // 生成12个月的数据
    for (let month = 1; month <= 12; month++) {
      employees.forEach((name, index) => {
        data.push({
          key: `${month}-${index}`,
          month,
          employeeName: name,
          classLoad: 0,
          classStudentCount: 0,
          dormitoryLoad: 0,
          dormitoryStudentCount: 0,
          averageAttendanceRate: 0,
          dailyInterviewRate: 0,
          parentInterviewRate: 0,
          qualityClassCount: 0,
          activityOrganizationCount: 0,
          employmentRate: 0,
          averageEmploymentSalary: 0,
          employmentCount: 0,
          reputationEnrollmentCount: 0,
          reputationRevenue: 0,
          fluctuationCount: 0,
          fluctuationRate: 0,
          refundCount: 0,
          refundRate: 0,
          enrollmentRate: 0,
          rowType: 'data',
        })
      })
    }

    // 添加合计/平均行
    data.push({
      key: 'total',
      month: '合计/平均',
      employeeName: '',
      classLoad: 0,
      classStudentCount: 0,
      dormitoryLoad: 0,
      dormitoryStudentCount: 0,
      averageAttendanceRate: 0,
      dailyInterviewRate: 0,
      parentInterviewRate: 0,
      qualityClassCount: 0,
      activityOrganizationCount: 0,
      employmentRate: 0,
      averageEmploymentSalary: 0,
      employmentCount: 0,
      reputationEnrollmentCount: 0,
      reputationRevenue: 0,
      fluctuationCount: 0,
      fluctuationRate: 0,
      refundCount: 0,
      refundRate: 0,
      enrollmentRate: 0,
      rowType: 'total',
    })

    return data
  }

  // 第一个标签的数据源（班主任业务功能分析表）
  const [dataSource1, setDataSource1] =
    useState<EmployeeFunctionAnalysisRecord[]>(createInitialData)

  // 第二个标签的数据源（班主任功能分析表）
  const employees2 = ['张三', '李四'] // 员工列表
  const createTeacherFunctionData = (): TeacherFunctionAnalysisRecord[] => {
    const data: TeacherFunctionAnalysisRecord[] = [
      // 核心业务能力
      {
        key: '1',
        serialNumber: 1,
        category: '核心业务能力',
        functionItem: '学员就业',
        detailedRequirement: '就业率和就业薪资高。',
        fullScore: 10,
        rowType: 'data',
        张三: 0,
        李四: 0,
      },
      {
        key: '2',
        serialNumber: 2,
        category: '核心业务能力',
        functionItem: '口碑招生',
        detailedRequirement: '口碑招生和收入高。',
        fullScore: 10,
        rowType: 'data',
        张三: 0,
        李四: 0,
      },
      {
        key: '3',
        serialNumber: 3,
        category: '核心业务能力',
        functionItem: '新生维稳',
        detailedRequirement: '新生流失较少。',
        fullScore: 10,
        rowType: 'data',
        张三: 0,
        李四: 0,
      },
      {
        key: '4',
        serialNumber: 4,
        category: '核心业务能力',
        functionItem: '解决问题',
        detailedRequirement: '处理退费、异动、问题学生和家长得当',
        fullScore: 10,
        rowType: 'data',
        张三: 0,
        李四: 0,
      },
      // 一般业务能力
      {
        key: '5',
        serialNumber: 5,
        category: '一般业务能力',
        functionItem: '沟通协调',
        detailedRequirement: '与上级,同级、下级及学生和家长沟通协调顺畅,知分寸',
        fullScore: 5,
        rowType: 'data',
        张三: 0,
        李四: 0,
      },
      {
        key: '6',
        serialNumber: 6,
        category: '一般业务能力',
        functionItem: '教务管理',
        detailedRequirement: '档案、表格、考试、证书等数据整理认真细致不出错',
        fullScore: 5,
        rowType: 'data',
        张三: 0,
        李四: 0,
      },
      {
        key: '7',
        serialNumber: 7,
        category: '一般业务能力',
        functionItem: '宿舍管理',
        detailedRequirement: '认真负责,无投诉',
        fullScore: 5,
        rowType: 'data',
        张三: 0,
        李四: 0,
      },
      {
        key: '8',
        serialNumber: 8,
        category: '一般业务能力',
        functionItem: '责任心',
        detailedRequirement: '对待学生,对待工作有责任心。',
        fullScore: 5,
        rowType: 'data',
        张三: 0,
        李四: 0,
      },
      {
        key: '9',
        serialNumber: 9,
        category: '一般业务能力',
        functionItem: '执行力',
        detailedRequirement: '能认真执行上级领导的各项安排。',
        fullScore: 5,
        rowType: 'data',
        张三: 0,
        李四: 0,
      },
      // 价值观
      {
        key: '10',
        serialNumber: 10,
        category: '价值观',
        functionItem: '吃苦耐劳',
        detailedRequirement: '不辞辛苦,任劳任怨。',
        fullScore: 5,
        rowType: 'data',
        张三: 0,
        李四: 0,
      },
      {
        key: '11',
        serialNumber: 11,
        category: '价值观',
        functionItem: '团队精神',
        detailedRequirement: '有大局观,个人利益服从集体利益。',
        fullScore: 5,
        rowType: 'data',
        张三: 0,
        李四: 0,
      },
      {
        key: '12',
        serialNumber: 12,
        category: '价值观',
        functionItem: '职业行为',
        detailedRequirement: '工装、出勤、自律性、职业化等。',
        fullScore: 5,
        rowType: 'data',
        张三: 0,
        李四: 0,
      },
      {
        key: '13',
        serialNumber: 13,
        category: '价值观',
        functionItem: '向内归因',
        detailedRequirement: '主动从自身找原因,不推诿给他人。',
        fullScore: 5,
        rowType: 'data',
        张三: 0,
        李四: 0,
      },
      // 其他
      {
        key: '14',
        serialNumber: 14,
        category: '其他',
        functionItem: '可出差',
        detailedRequirement: '能到外地出差1年以上。',
        fullScore: 15,
        rowType: 'data',
        张三: 0,
        李四: 0,
      },
      // 合计行
      {
        key: 'total',
        serialNumber: 0,
        category: '',
        functionItem: '合计',
        detailedRequirement: '',
        fullScore: 100,
        rowType: 'total',
        张三: 0,
        李四: 0,
      },
    ]
    return data
  }
  const [dataSource2, setDataSource2] =
    useState<TeacherFunctionAnalysisRecord[]>(createTeacherFunctionData)

  // 计算第二个表格类别列的rowSpan
  const getCategoryRowSpan = (record: TeacherFunctionAnalysisRecord, index: number) => {
    if (record.rowType === 'total') {
      return 1
    }

    // 计算当前类别有多少行
    const dataRows = (dataSource2 as TeacherFunctionAnalysisRecord[]).filter(
      (item) => item.rowType === 'data',
    )
    const currentIndex = dataRows.findIndex((item) => item.key === record.key)
    if (currentIndex === -1) return 0

    // 检查是否是同一类别的第一行
    if (currentIndex > 0) {
      const prevRecord = dataRows[currentIndex - 1]
      if (prevRecord.category === record.category) {
        return 0 // 不是第一行，不显示
      }
    }

    // 计算同一类别有多少行
    let sameCategoryCount = 1
    for (let i = currentIndex + 1; i < dataRows.length; i++) {
      if (dataRows[i].category === record.category) {
        sameCategoryCount++
      } else {
        break
      }
    }

    return sameCategoryCount
  }

  // 计算月份列的rowSpan
  const getMonthRowSpan = (record: EmployeeFunctionAnalysisRecord, index: number) => {
    if (record.rowType === 'total') {
      return 1
    }

    // 每个月有3个员工，所以rowSpan为3
    // 只有每月的第一个员工行显示月份，其他两行不显示
    const dataRows = dataSource1.filter((item) => item.rowType === 'data')
    const dataIndex = dataRows.findIndex((item) => item.key === record.key)
    if (dataIndex === -1) return 0

    const monthIndex = dataIndex % 3
    if (monthIndex === 0) {
      return 3 // 每月的第一行显示月份，rowSpan=3
    }
    return 0 // 其他行不显示
  }

  // 计算合计/平均行的值
  const calculateTotalRow = useMemo(() => {
    const dataRows = dataSource1.filter((item) => item.rowType === 'data')
    const totalRow = dataSource1.find((item) => item.rowType === 'total')

    if (!totalRow || dataRows.length === 0) return totalRow

    // 计算总和
    const totals = dataRows.reduce(
      (acc, item) => ({
        classLoad: acc.classLoad + item.classLoad,
        classStudentCount: acc.classStudentCount + item.classStudentCount,
        dormitoryLoad: acc.dormitoryLoad + item.dormitoryLoad,
        dormitoryStudentCount: acc.dormitoryStudentCount + item.dormitoryStudentCount,
        qualityClassCount: acc.qualityClassCount + item.qualityClassCount,
        activityOrganizationCount: acc.activityOrganizationCount + item.activityOrganizationCount,
        employmentCount: acc.employmentCount + item.employmentCount,
        reputationEnrollmentCount: acc.reputationEnrollmentCount + item.reputationEnrollmentCount,
        reputationRevenue: acc.reputationRevenue + item.reputationRevenue,
        fluctuationCount: acc.fluctuationCount + item.fluctuationCount,
        refundCount: acc.refundCount + item.refundCount,
      }),
      {
        classLoad: 0,
        classStudentCount: 0,
        dormitoryLoad: 0,
        dormitoryStudentCount: 0,
        qualityClassCount: 0,
        activityOrganizationCount: 0,
        employmentCount: 0,
        reputationEnrollmentCount: 0,
        reputationRevenue: 0,
        fluctuationCount: 0,
        refundCount: 0,
      },
    )

    // 计算平均值
    const count = dataRows.length
    totalRow.averageAttendanceRate =
      dataRows.reduce((sum, item) => sum + item.averageAttendanceRate, 0) / count
    totalRow.dailyInterviewRate =
      dataRows.reduce((sum, item) => sum + item.dailyInterviewRate, 0) / count
    totalRow.parentInterviewRate =
      dataRows.reduce((sum, item) => sum + item.parentInterviewRate, 0) / count
    totalRow.employmentRate = dataRows.reduce((sum, item) => sum + item.employmentRate, 0) / count
    totalRow.averageEmploymentSalary =
      dataRows.reduce((sum, item) => sum + item.averageEmploymentSalary, 0) / count
    totalRow.fluctuationRate = dataRows.reduce((sum, item) => sum + item.fluctuationRate, 0) / count
    totalRow.refundRate = dataRows.reduce((sum, item) => sum + item.refundRate, 0) / count
    totalRow.enrollmentRate = dataRows.reduce((sum, item) => sum + item.enrollmentRate, 0) / count

    // 赋值总和
    Object.assign(totalRow, totals)

    return totalRow
  }, [dataSource1])

  // 表头样式（浅绿色/黄色背景）
  const headerCellStyle: React.CSSProperties = {
    backgroundColor: '#f0ffe0',
    fontWeight: 'bold',
    textAlign: 'center',
  }

  // 定义表格列
  const columns: ColumnsType<EmployeeFunctionAnalysisRecord> = [
    {
      title: '月份',
      dataIndex: 'month',
      key: 'month',
      width: 80,
      fixed: 'left',
      align: 'center',
      render: (value, record, index) => {
        const rowSpan = getMonthRowSpan(record, index)

        if (record.rowType === 'total') {
          return {
            children: <span style={{ color: 'red', fontWeight: 'bold' }}>合计/平均</span>,
            props: { rowSpan: 1 },
          }
        }

        return {
          children: value,
          props: {
            rowSpan: rowSpan > 0 ? rowSpan : 0,
          },
        }
      },
    },
    {
      title: '姓名',
      dataIndex: 'employeeName',
      key: 'employeeName',
      width: 100,
      fixed: 'left',
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'total') {
          return ''
        }
        return value
      },
    },
    {
      title: '带班量',
      dataIndex: 'classLoad',
      key: 'classLoad',
      width: 100,
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'total') {
          return <span style={{ fontWeight: 'bold' }}>{value}</span>
        }
        return value || 0
      },
    },
    {
      title: '带班人数',
      dataIndex: 'classStudentCount',
      key: 'classStudentCount',
      width: 100,
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'total') {
          return <span style={{ fontWeight: 'bold' }}>{value}</span>
        }
        return value || 0
      },
    },
    {
      title: '带宿舍量',
      dataIndex: 'dormitoryLoad',
      key: 'dormitoryLoad',
      width: 100,
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'total') {
          return <span style={{ fontWeight: 'bold' }}>{value}</span>
        }
        return value || 0
      },
    },
    {
      title: '带宿舍人数',
      dataIndex: 'dormitoryStudentCount',
      key: 'dormitoryStudentCount',
      width: 100,
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'total') {
          return <span style={{ fontWeight: 'bold' }}>{value}</span>
        }
        return value || 0
      },
    },
    {
      title: '学生平均出勤率',
      dataIndex: 'averageAttendanceRate',
      key: 'averageAttendanceRate',
      width: 120,
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'total') {
          return <span style={{ fontWeight: 'bold' }}>{value.toFixed(2)}%</span>
        }
        return value > 0 ? `${value.toFixed(2)}%` : ''
      },
    },
    {
      title: '日常访谈率',
      dataIndex: 'dailyInterviewRate',
      key: 'dailyInterviewRate',
      width: 100,
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'total') {
          return <span style={{ fontWeight: 'bold' }}>{value.toFixed(2)}%</span>
        }
        return value > 0 ? `${value.toFixed(2)}%` : ''
      },
    },
    {
      title: '家长访谈率',
      dataIndex: 'parentInterviewRate',
      key: 'parentInterviewRate',
      width: 100,
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'total') {
          return <span style={{ fontWeight: 'bold' }}>{value.toFixed(2)}%</span>
        }
        return value > 0 ? `${value.toFixed(2)}%` : ''
      },
    },
    {
      title: '素质课次数',
      dataIndex: 'qualityClassCount',
      key: 'qualityClassCount',
      width: 100,
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'total') {
          return <span style={{ fontWeight: 'bold' }}>{value}</span>
        }
        return value || 0
      },
    },
    {
      title: '活动组织次数',
      dataIndex: 'activityOrganizationCount',
      key: 'activityOrganizationCount',
      width: 120,
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'total') {
          return <span style={{ fontWeight: 'bold' }}>{value}</span>
        }
        return value || 0
      },
    },
    {
      title: '就业率',
      dataIndex: 'employmentRate',
      key: 'employmentRate',
      width: 100,
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'total') {
          return <span style={{ fontWeight: 'bold' }}>{value.toFixed(2)}%</span>
        }
        return value > 0 ? `${value.toFixed(2)}%` : ''
      },
    },
    {
      title: '就业平均薪资',
      dataIndex: 'averageEmploymentSalary',
      key: 'averageEmploymentSalary',
      width: 120,
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'total') {
          return <span style={{ fontWeight: 'bold' }}>{value.toFixed(2)}</span>
        }
        return value > 0 ? value.toFixed(2) : ''
      },
    },
    {
      title: '就业人数',
      dataIndex: 'employmentCount',
      key: 'employmentCount',
      width: 100,
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'total') {
          return <span style={{ fontWeight: 'bold' }}>{value}</span>
        }
        return value || 0
      },
    },
    {
      title: '口碑报名人数',
      dataIndex: 'reputationEnrollmentCount',
      key: 'reputationEnrollmentCount',
      width: 120,
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'total') {
          return <span style={{ fontWeight: 'bold' }}>{value}</span>
        }
        return value || 0
      },
    },
    {
      title: '口碑收入',
      dataIndex: 'reputationRevenue',
      key: 'reputationRevenue',
      width: 100,
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'total') {
          return <span style={{ fontWeight: 'bold' }}>{value.toFixed(2)}</span>
        }
        return value > 0 ? value.toFixed(2) : ''
      },
    },
    {
      title: '异动人数',
      dataIndex: 'fluctuationCount',
      key: 'fluctuationCount',
      width: 100,
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'total') {
          return <span style={{ fontWeight: 'bold' }}>{value}</span>
        }
        return value || 0
      },
    },
    {
      title: '异动率',
      dataIndex: 'fluctuationRate',
      key: 'fluctuationRate',
      width: 100,
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'total') {
          return <span style={{ fontWeight: 'bold' }}>{value.toFixed(2)}%</span>
        }
        return value > 0 ? `${value.toFixed(2)}%` : ''
      },
    },
    {
      title: '退费人数',
      dataIndex: 'refundCount',
      key: 'refundCount',
      width: 100,
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'total') {
          return <span style={{ fontWeight: 'bold' }}>{value}</span>
        }
        return value || 0
      },
    },
    {
      title: '退费率',
      dataIndex: 'refundRate',
      key: 'refundRate',
      width: 100,
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'total') {
          return <span style={{ fontWeight: 'bold' }}>{value.toFixed(2)}%</span>
        }
        return value > 0 ? `${value.toFixed(2)}%` : ''
      },
    },
    {
      title: '升学率',
      dataIndex: 'enrollmentRate',
      key: 'enrollmentRate',
      width: 100,
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'total') {
          return <span style={{ fontWeight: 'bold' }}>{value.toFixed(2)}%</span>
        }
        return value > 0 ? `${value.toFixed(2)}%` : ''
      },
    },
  ]

  // 第二个表格的列定义（班主任功能分析表）
  const columns2: ColumnsType<TeacherFunctionAnalysisRecord> = [
    {
      title: '序号',
      dataIndex: 'serialNumber',
      key: 'serialNumber',
      width: 80,
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'total') {
          return <span style={{ fontWeight: 'bold' }}>合计</span>
        }
        return value
      },
    },
    {
      title: '类别',
      dataIndex: 'category',
      key: 'category',
      width: 150,
      align: 'center',
      render: (value, record, index) => {
        if (record.rowType === 'total') {
          return ''
        }
        const rowSpan = getCategoryRowSpan(record, index)
        return {
          children: value,
          props: {
            rowSpan: rowSpan > 0 ? rowSpan : 0,
          },
        }
      },
    },
    {
      title: '功能项目',
      dataIndex: 'functionItem',
      key: 'functionItem',
      width: 150,
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'total') {
          return <span style={{ fontWeight: 'bold' }}>{value}</span>
        }
        return value
      },
    },
    {
      title: '详细要求',
      dataIndex: 'detailedRequirement',
      key: 'detailedRequirement',
      width: 400,
      align: 'left',
      render: (value, record) => {
        if (record.rowType === 'total') {
          return ''
        }
        return value
      },
    },
    {
      title: '满分',
      dataIndex: 'fullScore',
      key: 'fullScore',
      width: 100,
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'total') {
          return <span style={{ fontWeight: 'bold' }}>{value}</span>
        }
        return value
      },
    },
    // 动态员工列
    ...employees2.map((emp) => ({
      title: emp,
      dataIndex: emp,
      key: emp,
      width: 100,
      align: 'center' as const,
      render: (value: number, record: TeacherFunctionAnalysisRecord) => {
        if (record.rowType === 'total') {
          // 计算合计：该员工所有项目的分数总和
          const dataRows = (dataSource2 as TeacherFunctionAnalysisRecord[]).filter(
            (item) => item.rowType === 'data',
          )
          const total = dataRows.reduce((sum, item) => sum + (item[emp] || 0), 0)
          return <span style={{ fontWeight: 'bold' }}>{total}</span>
        }
        return value || 0
      },
    })),
  ]

  const updatedBusinessDataSource = useMemo(() => {
    const data = [...dataSource1]
    const totalIndex = data.findIndex((item) => item.rowType === 'total')
    if (totalIndex >= 0 && calculateTotalRow) {
      data[totalIndex] = calculateTotalRow
    }
    return data
  }, [dataSource1, calculateTotalRow])

  const updatedFunctionDataSource = useMemo(() => {
    const data = [...dataSource2]
    const totalIndex = data.findIndex((item) => item.rowType === 'total')
    if (totalIndex >= 0) {
      const totalRow = { ...data[totalIndex] }
      const dataRows = data.filter((item) => item.rowType === 'data')
      employees2.forEach((emp) => {
        totalRow[emp] = dataRows.reduce((sum, item) => sum + (item[emp] || 0), 0)
      })
      data[totalIndex] = totalRow
    }
    return data
  }, [dataSource2, employees2])

  // 刷新数据
  const handleRefresh = () => {
    message.success('数据已刷新')
  }

  // 导出数据
  const handleExport = () => {
    message.info('导出功能开发中...')
  }

  // 神殿选择变化
  const handleCampusChange = (value: string) => {
    setSelectedCampus(value)
    setCampus(value)
  }

  // 渲染表格内容
  const renderTable = () => (
    <>
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
          <span>神殿：</span>
          <Select
            value={selectedCampus}
            onChange={handleCampusChange}
            style={{ width: 200 }}
            placeholder="请选择神殿"
          >
            {campuses.map((campus) => (
              <Option key={campus.name} value={campus.name}>
                {campus.name}
              </Option>
            ))}
          </Select>
        </Space>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
            刷新
          </Button>
          <Button icon={<DownloadOutlined />} onClick={handleExport}>
            导出
          </Button>
        </Space>
      </div>

      {/* 表格 */}
      {activeTab === 'business' ? (
        <Table
          columns={columns}
          dataSource={updatedBusinessDataSource}
          pagination={false}
          scroll={{ x: 'max-content' }}
          bordered
          size="small"
          rowKey="key"
          components={{
            header: {
              cell: (props: any) => {
                const mergedProps = {
                  ...props,
                  style: {
                    ...props.style,
                    ...headerCellStyle,
                  },
                }
                return <th {...mergedProps} />
              },
            },
          }}
        />
      ) : (
        <Table
          columns={columns2}
          dataSource={updatedFunctionDataSource}
          pagination={false}
          scroll={{ x: 'max-content' }}
          bordered
          size="small"
          rowKey="key"
          components={{
            header: {
              cell: (props: any) => {
                const mergedProps = {
                  ...props,
                  style: {
                    ...props.style,
                    ...headerCellStyle,
                  },
                }
                return <th {...mergedProps} />
              },
            },
          }}
        />
      )}
      <style>{`
        .ant-table-thead > tr > th {
          background-color: ${activeTab === 'function' ? '#fffacd' : '#f0ffe0'} !important;
          font-weight: bold;
          text-align: center;
        }
        .ant-table-thead > tr:first-child > th {
          background-color: ${activeTab === 'function' ? '#fffacd' : '#f0ffe0'} !important;
        }
      `}</style>
    </>
  )

  return (
    <div style={{ padding: 24 }}>
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
        {selectedCampus || currentCampus || '神殿'}教化司员工功能分析表
      </div>

      <Card>
        {/* 标签栏 */}
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'business',
              label: '班主任业务功能分析表',
              children: renderTable(),
            },
            {
              key: 'function',
              label: '班主任功能分析表',
              children: renderTable(),
            },
          ]}
        />
      </Card>
    </div>
  )
}

export default CampusEmployeeFunctionAnalysisPage
