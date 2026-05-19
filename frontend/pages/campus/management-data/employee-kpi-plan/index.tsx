/**
 * 神殿教化司员工KPI计划表页面
 */

import React, { useState, useMemo } from 'react'
import { App, Card, Table, Button, Space, Select, Tabs } from 'antd'
import { ReloadOutlined, DownloadOutlined, TrophyOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useCampusStore } from '@/stores/campusStore'

const { Option } = Select

// 员工KPI计划记录接口
interface EmployeeKpiPlanRecord {
  key: string
  name: string // 姓名
  projectIndicator: string // 项目指标：业务指标、管理指标
  kpiIndicator: string // KPI指标：就业管理、口碑、学生回款、学员流失率、学历管理
  kpiName: string // KPI指标名称
  calculationRule: string // 计算细则
  dataSource: string // 数据来源、考核
  weight: number // 权重
  projectDescription: string // 项目描述
  selfScore: number // 自我打分
  supervisorScore: number // 上级领导打分
  kpiValue: number // KPI值
  remarks: string // 备注
  rowType?: 'data' | 'total' // 行类型
}

const CampusEmployeeKpiPlanPage: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus, getAllCampuses, setCampus } = useCampusStore()
  const campuses = getAllCampuses()
  const [selectedCampus, setSelectedCampus] = useState<string>(currentCampus || '')
  const [activeTab, setActiveTab] = useState<string>('manager')

  // 创建初始化数据函数
  const createInitialData = (): EmployeeKpiPlanRecord[] => {
    const data: EmployeeKpiPlanRecord[] = [
      // 业务指标 - 就业管理
      {
        key: '1',
        name: '',
        projectIndicator: '业务指标',
        kpiIndicator: '就业管理',
        kpiName: '学生就业率(人数)',
        calculationRule: '10*实际就业学生数/目标就业学生数',
        dataSource: '校长/教质经理',
        weight: 15.0,
        projectDescription: '',
        selfScore: 0,
        supervisorScore: 9.66,
        kpiValue: 0,
        remarks: 'S32106+S32107班, 目标就业29人。实际28人',
        rowType: 'data',
      },
      {
        key: '2',
        name: '',
        projectIndicator: '业务指标',
        kpiIndicator: '就业管理',
        kpiName: '学生就业薪资(以回访为准)',
        calculationRule: '10*实际平均就业薪资/目标就业薪资',
        dataSource: '总部',
        weight: 15.0,
        projectDescription: '',
        selfScore: 0,
        supervisorScore: 10,
        kpiValue: 0,
        remarks: 'S32106+S32107班, 目标薪资6300元。实际平均薪资6520.65元',
        rowType: 'data',
      },
      // 业务指标 - 口碑
      {
        key: '3',
        name: '',
        projectIndicator: '业务指标',
        kpiIndicator: '口碑',
        kpiName: '部门实际口碑人数',
        calculationRule: '部门实际口碑人数/部门目标人数*10',
        dataSource: '神藏司',
        weight: 20.0,
        projectDescription: '',
        selfScore: 0,
        supervisorScore: 0,
        kpiValue: 0,
        remarks: '',
        rowType: 'data',
      },
      {
        key: '4',
        name: '',
        projectIndicator: '业务指标',
        kpiIndicator: '口碑',
        kpiName: '部门实际口碑回款',
        calculationRule: '部门实际口碑回款/部门目标口碑回款*10',
        dataSource: '神藏司',
        weight: 10.0,
        projectDescription: '',
        selfScore: 0,
        supervisorScore: 0,
        kpiValue: 0,
        remarks: '',
        rowType: 'data',
      },
      // 业务指标 - 学生回款
      {
        key: '5',
        name: '',
        projectIndicator: '业务指标',
        kpiIndicator: '学生回款',
        kpiName: '学费回款',
        calculationRule: '学校入学 (住宿) 欠费学生实际收款/欠费生应收回款 (校长出数据)',
        dataSource: '神藏司',
        weight: 10.0,
        projectDescription: '',
        selfScore: 0,
        supervisorScore: 0,
        kpiValue: 0,
        remarks: '',
        rowType: 'data',
      },
      // 管理指标 - 学员流失率
      {
        key: '6',
        name: '',
        projectIndicator: '管理指标',
        kpiIndicator: '学员流失率',
        kpiName: '学员流失率',
        calculationRule: '<1-流失人数 (新生+退费老生)/本月入学人数>*10',
        dataSource: '中心校长、神藏司',
        weight: 10.0,
        projectDescription: '',
        selfScore: 0,
        supervisorScore: 0,
        kpiValue: 0,
        remarks: '',
        rowType: 'data',
      },
      // 管理指标 - 学历管理
      {
        key: '7',
        name: '',
        projectIndicator: '管理指标',
        kpiIndicator: '学历管理',
        kpiName: '学历管理',
        calculationRule: '中专学籍资料完整，配合度高、妥善应对检查',
        dataSource: '总部',
        weight: 20.0,
        projectDescription: '',
        selfScore: 0,
        supervisorScore: 10,
        kpiValue: 0,
        remarks: '',
        rowType: 'data',
      },
    ]
    return data
  }

  // 第一个标签的数据源（教质经理KPI）
  const [dataSource1, setDataSource1] = useState<EmployeeKpiPlanRecord[]>(createInitialData)

  // 第二个标签的数据源（班主任KPI计划）- 创建班主任KPI数据（第一个表格）
  const createTeacherKpiData = (): EmployeeKpiPlanRecord[] => {
    const data: EmployeeKpiPlanRecord[] = [
      // 口碑
      {
        key: 't1',
        name: '马晓娟',
        projectIndicator: '',
        kpiIndicator: '口碑',
        kpiName: '部门实际口碑人数',
        calculationRule: '部门实际口碑人数/部门目标人数*10',
        dataSource: '神藏司',
        weight: 20.0,
        projectDescription: '',
        selfScore: 0,
        supervisorScore: 0,
        kpiValue: 0,
        remarks: '',
        rowType: 'data',
      },
      {
        key: 't2',
        name: '',
        projectIndicator: '',
        kpiIndicator: '口碑',
        kpiName: '部门实际口碑回款',
        calculationRule: '部门实际口碑回款/部门目标口碑回款*10',
        dataSource: '神藏司',
        weight: 0,
        projectDescription: '',
        selfScore: 0,
        supervisorScore: 0,
        kpiValue: 0,
        remarks: '',
        rowType: 'data',
      },
      {
        key: 't3',
        name: '',
        projectIndicator: '',
        kpiIndicator: '口碑',
        kpiName: '部门实际口碑量',
        calculationRule: '部门实际口碑量/目标口碑量*10',
        dataSource: '神藏司',
        weight: 0,
        projectDescription: '',
        selfScore: 0,
        supervisorScore: 0,
        kpiValue: 0,
        remarks: '',
        rowType: 'data',
      },
      // 学员流失率
      {
        key: 't4',
        name: '',
        projectIndicator: '',
        kpiIndicator: '学员流失率',
        kpiName: '学员流失率',
        calculationRule: '10-所带学员流失数',
        dataSource: '中心校长、神藏司',
        weight: 0,
        projectDescription: '',
        selfScore: 0,
        supervisorScore: 0,
        kpiValue: 0,
        remarks: '',
        rowType: 'data',
      },
      // 学生回款
      {
        key: 't5',
        name: '',
        projectIndicator: '',
        kpiIndicator: '学生回款',
        kpiName: '学费回款',
        calculationRule: '学校入学(住宿)欠费学生实际收款/欠费生应收回款*10',
        dataSource: '神藏司',
        weight: 20.0,
        projectDescription: '',
        selfScore: 0,
        supervisorScore: 0,
        kpiValue: 0,
        remarks: '',
        rowType: 'data',
      },
      {
        key: 't6',
        name: '',
        projectIndicator: '',
        kpiIndicator: '学生回款',
        kpiName: '宿舍费收支准确',
        calculationRule: '宿舍费实际收款/宿舍费应收*10',
        dataSource: '神藏司',
        weight: 0,
        projectDescription: '',
        selfScore: 0,
        supervisorScore: 0,
        kpiValue: 0,
        remarks: '',
        rowType: 'data',
      },
      // 日常管理
      {
        key: 't7',
        name: '',
        projectIndicator: '',
        kpiIndicator: '日常管理',
        kpiName: '神殿学生出勤率',
        calculationRule: '95%及以上10分, 85%及以上8.5分, 80%及以上...',
        dataSource: '教质副经理',
        weight: 20.0,
        projectDescription: '',
        selfScore: 0,
        supervisorScore: 0,
        kpiValue: 0,
        remarks: '班主任提供准确出勤数据,次数、出勤率,准时准确',
        rowType: 'data',
      },
      {
        key: 't8',
        name: '',
        projectIndicator: '',
        kpiIndicator: '日常管理',
        kpiName: '教室卫生评价',
        calculationRule: '优:10分, 良:8.5分, 可:6、 差:0',
        dataSource: '中心校长',
        weight: 0,
        projectDescription: '',
        selfScore: 0,
        supervisorScore: 0,
        kpiValue: 0,
        remarks: '',
        rowType: 'data',
      },
      {
        key: 't9',
        name: '',
        projectIndicator: '',
        kpiIndicator: '日常管理',
        kpiName: '宿舍管理',
        calculationRule: '晚上点名、卫生检督等',
        dataSource: '教质副经理',
        weight: 0,
        projectDescription: '',
        selfScore: 0,
        supervisorScore: 0,
        kpiValue: 0,
        remarks: '',
        rowType: 'data',
      },
      {
        key: 't10',
        name: '',
        projectIndicator: '',
        kpiIndicator: '日常管理',
        kpiName: '违规监督',
        calculationRule: '(班主任填写违规记录表天数/15)*10满分最高10',
        dataSource: '教质副经理',
        weight: 0,
        projectDescription: '',
        selfScore: 0,
        supervisorScore: 0,
        kpiValue: 0,
        remarks: '班主任提交数据准时准确,否则最终数据分数减半;数',
        rowType: 'data',
      },
      {
        key: 't11',
        name: '',
        projectIndicator: '',
        kpiIndicator: '日常管理',
        kpiName: '学生访谈率',
        calculationRule: '100%,有记录',
        dataSource: '教质副经理',
        weight: 0,
        projectDescription: '',
        selfScore: 0,
        supervisorScore: 0,
        kpiValue: 0,
        remarks: '班主任提交数据准时准确,否则最终数据分数减半;无',
        rowType: 'data',
      },
      // 学生档案完整率
      {
        key: 't12',
        name: '',
        projectIndicator: '',
        kpiIndicator: '学生档案完整率',
        kpiName: '学生档案完整率',
        calculationRule: '10*(纸质+电子档案)完整数量/<全校人数(新开班、合班、分...)',
        dataSource: '中心校长',
        weight: 0,
        projectDescription: '',
        selfScore: 0,
        supervisorScore: 0,
        kpiValue: 0,
        remarks: '',
        rowType: 'data',
      },
      // 投诉
      {
        key: 't13',
        name: '',
        projectIndicator: '',
        kpiIndicator: '投诉',
        kpiName: '投诉',
        calculationRule: '无入学在校生投诉或入学生投诉能妥善解决',
        dataSource: '教质副经理',
        weight: 10.0,
        projectDescription: '',
        selfScore: 0,
        supervisorScore: 0,
        kpiValue: 0,
        remarks: '所负责的班级',
        rowType: 'data',
      },
      // 岗位胜任度
      {
        key: 't14',
        name: '',
        projectIndicator: '',
        kpiIndicator: '岗位胜任度',
        kpiName: '岗位胜任度',
        calculationRule: '上级领导评价(工作有责任感,执行力强、服从性高)',
        dataSource: '教质副经理',
        weight: 10.0,
        projectDescription: '',
        selfScore: 0,
        supervisorScore: 0,
        kpiValue: 0,
        remarks: '',
        rowType: 'data',
      },
    ]
    return data
  }
  const [dataSource2, setDataSource2] = useState<EmployeeKpiPlanRecord[]>(createTeacherKpiData)

  // 第二个表格的数据源（班主任KPI计划）- 创建新表格数据
  const createTeacherKpiData2 = (): EmployeeKpiPlanRecord[] => {
    const data: EmployeeKpiPlanRecord[] = [
      {
        key: 't2-1',
        name: '',
        projectIndicator: '',
        kpiIndicator: '个人收入任务完成率',
        kpiName: '个人收入任务完成率',
        calculationRule: '10*实际收入/目标收入',
        dataSource: '神藏司',
        weight: 20.0,
        projectDescription: '',
        selfScore: 0,
        supervisorScore: 0,
        kpiValue: 0,
        remarks: '',
        rowType: 'data',
      },
      {
        key: 't2-2',
        name: '',
        projectIndicator: '',
        kpiIndicator: '口碑招生完成率',
        kpiName: '口碑招生完成率',
        calculationRule: '10*实际口碑招生数/目标口碑招生数',
        dataSource: '神藏司',
        weight: 20.0,
        projectDescription: '',
        selfScore: 0,
        supervisorScore: 0,
        kpiValue: 0,
        remarks: '',
        rowType: 'data',
      },
      {
        key: 't2-3',
        name: '',
        projectIndicator: '',
        kpiIndicator: '学员流失率',
        kpiName: '学员流失率',
        calculationRule: '10×(1-3×学校学生流失率)',
        dataSource: '神藏司',
        weight: 20.0,
        projectDescription: '',
        selfScore: 0,
        supervisorScore: 0,
        kpiValue: 0,
        remarks: '',
        rowType: 'data',
      },
      {
        key: 't2-4',
        name: '',
        projectIndicator: '',
        kpiIndicator: '日常管理',
        kpiName: '日常管理',
        calculationRule: '学员出勤纪律,班会、卫生巡检、组织学员活动、综合表现',
        dataSource: '教质经理',
        weight: 30.0,
        projectDescription: '',
        selfScore: 0,
        supervisorScore: 0,
        kpiValue: 0,
        remarks: '',
        rowType: 'data',
      },
      {
        key: 't2-5',
        name: '',
        projectIndicator: '',
        kpiIndicator: '岗位胜任度',
        kpiName: '岗位胜任度',
        calculationRule: '岗位胜任度',
        dataSource: '教质经理',
        weight: 10.0,
        projectDescription: '',
        selfScore: 0,
        supervisorScore: 0,
        kpiValue: 0,
        remarks: '',
        rowType: 'data',
      },
      // 总计行
      {
        key: 't2-total',
        name: '',
        projectIndicator: '',
        kpiIndicator: '总计',
        kpiName: '',
        calculationRule: '',
        dataSource: '总计',
        weight: 100.0,
        projectDescription: '',
        selfScore: 0,
        supervisorScore: 0,
        kpiValue: 0,
        remarks: '',
        rowType: 'total',
      },
    ]
    return data
  }
  const [dataSource2Table2, setDataSource2Table2] =
    useState<EmployeeKpiPlanRecord[]>(createTeacherKpiData2)

  // 根据当前标签获取数据源
  const currentDataSource = activeTab === 'manager' ? dataSource1 : dataSource2
  const setCurrentDataSource = activeTab === 'manager' ? setDataSource1 : setDataSource2

  // 计算姓名列的rowSpan（用于班主任KPI计划）
  const getNameRowSpan = (record: EmployeeKpiPlanRecord, index: number) => {
    if (activeTab !== 'teacher') return 1

    const dataRows = currentDataSource.filter((item) => item.rowType === 'data')
    const currentIndex = dataRows.findIndex((item) => item.key === record.key)
    if (currentIndex === -1) return 0

    // 只有第一行显示姓名，其他行不显示
    if (currentIndex === 0) {
      return dataRows.length // 第一行合并所有行
    }
    return 0 // 其他行不显示
  }

  // 计算项目指标列的rowSpan（用于教质经理KPI）
  const getProjectIndicatorRowSpan = (record: EmployeeKpiPlanRecord, index: number) => {
    if (activeTab === 'teacher') return 0 // 班主任KPI计划不显示项目指标列

    const dataRows = currentDataSource.filter((item) => item.rowType === 'data')
    const currentIndex = dataRows.findIndex((item) => item.key === record.key)
    if (currentIndex === -1) return 0

    // 检查是否是同一项目指标的第一行
    if (currentIndex > 0) {
      const prevRecord = dataRows[currentIndex - 1]
      if (prevRecord.projectIndicator === record.projectIndicator) {
        return 0 // 不是第一行，不显示
      }
    }

    // 计算同一项目指标有多少行
    let sameProjectCount = 1
    for (let i = currentIndex + 1; i < dataRows.length; i++) {
      if (dataRows[i].projectIndicator === record.projectIndicator) {
        sameProjectCount++
      } else {
        break
      }
    }

    return sameProjectCount
  }

  // 计算KPI指标列的rowSpan
  const getKpiIndicatorRowSpan = (record: EmployeeKpiPlanRecord, index: number) => {
    const dataRows = currentDataSource.filter((item) => item.rowType === 'data')
    const currentIndex = dataRows.findIndex((item) => item.key === record.key)
    if (currentIndex === -1) return 0

    // 检查是否是同一KPI指标的第一行
    if (currentIndex > 0) {
      const prevRecord = dataRows[currentIndex - 1]
      if (prevRecord.kpiIndicator === record.kpiIndicator) {
        return 0 // 不是第一行，不显示
      }
    }

    // 计算同一KPI指标有多少行
    let sameKpiCount = 1
    for (let i = currentIndex + 1; i < dataRows.length; i++) {
      if (dataRows[i].kpiIndicator === record.kpiIndicator) {
        sameKpiCount++
      } else {
        break
      }
    }

    return sameKpiCount
  }

  // 表头样式（黄色背景）
  const headerCellStyle: React.CSSProperties = {
    backgroundColor: '#fffacd',
    fontWeight: 'bold',
    textAlign: 'center',
  }

  // 计算第一个表格的KPI指标列rowSpan（用于班主任KPI计划第一个表格）
  const getKpiIndicatorRowSpan1 = (record: EmployeeKpiPlanRecord, index: number) => {
    const dataRows = dataSource2.filter((item) => item.rowType === 'data')
    const currentIndex = dataRows.findIndex((item) => item.key === record.key)
    if (currentIndex === -1) return 0

    // 检查是否是同一KPI指标的第一行
    if (currentIndex > 0) {
      const prevRecord = dataRows[currentIndex - 1]
      if (prevRecord.kpiIndicator === record.kpiIndicator) {
        return 0 // 不是第一行，不显示
      }
    }

    // 计算同一KPI指标有多少行
    let sameKpiCount = 1
    for (let i = currentIndex + 1; i < dataRows.length; i++) {
      if (dataRows[i].kpiIndicator === record.kpiIndicator) {
        sameKpiCount++
      } else {
        break
      }
    }

    return sameKpiCount
  }

  // 计算第一个表格的姓名列rowSpan（用于班主任KPI计划第一个表格）
  const getNameRowSpan1 = (record: EmployeeKpiPlanRecord, index: number) => {
    const dataRows = dataSource2.filter((item) => item.rowType === 'data')
    const currentIndex = dataRows.findIndex((item) => item.key === record.key)
    if (currentIndex === -1) return 0

    // 只有第一行显示姓名，其他行不显示
    if (currentIndex === 0) {
      return dataRows.length // 第一行合并所有行
    }
    return 0 // 其他行不显示
  }

  // 定义表格列（教质经理KPI和班主任KPI计划第一个表格）
  const columns: ColumnsType<EmployeeKpiPlanRecord> = useMemo(() => {
    const baseColumns: ColumnsType<EmployeeKpiPlanRecord> = []

    // 教质经理KPI显示姓名列
    if (activeTab === 'manager') {
      baseColumns.push({
        title: '姓名',
        dataIndex: 'name',
        key: 'name',
        width: 100,
        align: 'center',
        render: (value) => value || '',
      })
    }

    // 教质经理KPI显示项目指标列
    if (activeTab === 'manager') {
      baseColumns.push({
        title: '项目指标',
        dataIndex: 'projectIndicator',
        key: 'projectIndicator',
        width: 120,
        align: 'center',
        render: (value, record, index) => {
          const rowSpan = getProjectIndicatorRowSpan(record, index)
          return {
            children: value,
            props: {
              rowSpan: rowSpan > 0 ? rowSpan : 0,
            },
          }
        },
      })
    }

    // 班主任KPI计划第一个表格显示姓名列
    if (activeTab === 'teacher') {
      baseColumns.push({
        title: '姓名',
        dataIndex: 'name',
        key: 'name',
        width: 100,
        align: 'center',
        render: (value, record, index) => {
          const rowSpan = getNameRowSpan1(record, index)
          return {
            children: value || '',
            props: {
              rowSpan: rowSpan > 0 ? rowSpan : 0,
            },
          }
        },
      })
    }

    baseColumns.push(
      {
        title: 'KPI指标',
        dataIndex: 'kpiIndicator',
        key: 'kpiIndicator',
        width: 150,
        align: 'left',
        render: (value, record, index) => {
          if (activeTab === 'teacher') {
            // 班主任KPI计划第一个表格合并
            const rowSpan = getKpiIndicatorRowSpan1(record, index)
            return {
              children: value,
              props: {
                rowSpan: rowSpan > 0 ? rowSpan : 0,
              },
            }
          }
          // 教质经理KPI合并
          const rowSpan = getKpiIndicatorRowSpan(record, index)
          return {
            children: value,
            props: {
              rowSpan: rowSpan > 0 ? rowSpan : 0,
            },
          }
        },
      },
      {
        title: activeTab === 'teacher' ? '计算细则' : '计算细则',
        key: 'calculationRule',
        width: 400,
        align: 'left',
        render: (_, record) => {
          if (activeTab === 'teacher') {
            // 班主任KPI计划第一个表格显示格式：KPI名称：计算规则
            return `${record.kpiName}：${record.calculationRule}`
          }
          // 教质经理KPI显示格式：KPI名称：计算规则
          return `${record.kpiName}：${record.calculationRule}`
        },
      },
      {
        title: '数据来源、考核',
        dataIndex: 'dataSource',
        key: 'dataSource',
        width: 150,
        align: 'center',
        render: (value) => value,
      },
      {
        title: '权重',
        dataIndex: 'weight',
        key: 'weight',
        width: 100,
        align: 'center',
        render: (value) => (value > 0 ? `${value}%` : ''),
      },
    )

    // 根据标签添加不同的列
    if (activeTab === 'manager') {
      baseColumns.push(
        {
          title: '项目描述',
          dataIndex: 'projectDescription',
          key: 'projectDescription',
          width: 150,
          align: 'left',
          render: (value) => value || '',
        },
        {
          title: '自我打分',
          dataIndex: 'selfScore',
          key: 'selfScore',
          width: 100,
          align: 'center',
          render: (value) => value || '',
        },
        {
          title: '上级领导打分',
          dataIndex: 'supervisorScore',
          key: 'supervisorScore',
          width: 120,
          align: 'center',
          render: (value) => value || '',
        },
      )
    } else {
      baseColumns.push({
        title: '得分',
        dataIndex: 'supervisorScore',
        key: 'score',
        width: 100,
        align: 'center',
        render: (value) => value || '',
      })
    }

    // 公共列
    baseColumns.push({
      title: 'KPI值',
      dataIndex: 'kpiValue',
      key: 'kpiValue',
      width: 100,
      align: 'center',
      render: (value) => (value !== undefined && value !== null ? value.toFixed(2) : '0.00'),
    })

    // 教质经理KPI和班主任KPI计划第一个表格显示备注列
    if (activeTab === 'manager' || activeTab === 'teacher') {
      baseColumns.push({
        title: '备注',
        dataIndex: 'remarks',
        key: 'remarks',
        width: 300,
        align: 'left',
        render: (value) => value || '',
      })
    }

    return baseColumns
  }, [activeTab, currentDataSource, dataSource2])

  // 定义第二个表格的列（班主任KPI计划第二个表格）
  const columns2: ColumnsType<EmployeeKpiPlanRecord> = useMemo(() => {
    return [
      {
        title: 'KPI指标',
        dataIndex: 'kpiIndicator',
        key: 'kpiIndicator',
        width: 150,
        align: 'left',
        render: (value) => value,
      },
      {
        title: '计算说明',
        key: 'calculationRule',
        width: 400,
        align: 'left',
        render: (_, record) => {
          // 直接显示计算公式
          return record.calculationRule
        },
      },
      {
        title: '数据来源、考核人',
        dataIndex: 'dataSource',
        key: 'dataSource',
        width: 150,
        align: 'center',
        render: (value) => value,
      },
      {
        title: '权重',
        dataIndex: 'weight',
        key: 'weight',
        width: 100,
        align: 'center',
        render: (value) => (value > 0 ? `${value}%` : ''),
      },
      {
        title: '得分',
        dataIndex: 'supervisorScore',
        key: 'score',
        width: 100,
        align: 'center',
        render: (value) => value || '',
      },
      {
        title: 'KPI值',
        dataIndex: 'kpiValue',
        key: 'kpiValue',
        width: 100,
        align: 'center',
        render: (value) => (value !== undefined && value !== null ? value.toFixed(2) : '0.00'),
      },
    ]
  }, [])

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
        <TrophyOutlined style={{ marginRight: 8 }} />
        {selectedCampus || currentCampus || '神殿'}教化司员工KPI计划表
      </div>

      <Card>
        {/* 标签栏 */}
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'manager',
              label: '教质经理KPI',
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
                  <Table
                    columns={columns}
                    dataSource={currentDataSource}
                    pagination={false}
                    scroll={{ x: 'max-content', y: 600 }}
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
                  <style>{`
                    .ant-table-thead > tr > th {
                      background-color: #fffacd !important;
                      font-weight: bold;
                      text-align: center;
                    }
                    .ant-table-thead > tr:first-child > th {
                      background-color: #fffacd !important;
                    }
                  `}</style>
                </div>
              ),
            },
            {
              key: 'teacher',
              label: '班主任KPI计划',
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

                  {/* 第一个表格 */}
                  <div style={{ marginBottom: 24 }}>
                    <Table
                      columns={columns}
                      dataSource={dataSource2}
                      pagination={false}
                      scroll={{ x: 'max-content', y: 600 }}
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
                  </div>

                  {/* 第二个表格 */}
                  <div>
                    <Table
                      columns={columns2}
                      dataSource={dataSource2Table2}
                      pagination={false}
                      scroll={{ x: 'max-content', y: 600 }}
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
                  </div>

                  <style>{`
                    .ant-table-thead > tr > th {
                      background-color: #fffacd !important;
                      font-weight: bold;
                      text-align: center;
                    }
                    .ant-table-thead > tr:first-child > th {
                      background-color: #fffacd !important;
                    }
                  `}</style>
                </div>
              ),
            },
          ]}
        />
      </Card>
    </div>
  )
}

export default CampusEmployeeKpiPlanPage
