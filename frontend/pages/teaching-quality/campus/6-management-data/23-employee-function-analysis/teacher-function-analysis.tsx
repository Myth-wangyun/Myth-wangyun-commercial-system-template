/**
 * 班主任功能分析表
 */

import React, { useState, useMemo } from 'react'
import { App, Card, Table, Button, Space, Select } from 'antd'
import { ReloadOutlined, DownloadOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useCampusStore } from '@/stores/campusStore'

const { Option } = Select

// 班主任功能分析记录接口
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

const TeacherFunctionAnalysisPage: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus, getAllCampuses, setCampus } = useCampusStore()
  const campuses = getAllCampuses()
  const [selectedCampus, setSelectedCampus] = useState<string>(currentCampus || '')

  // 员工列表
  const employees = ['张三', '李四']

  // 创建数据初始化函数
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

  const [dataSource, setDataSource] =
    useState<TeacherFunctionAnalysisRecord[]>(createTeacherFunctionData)

  // 计算类别列的rowSpan
  const getCategoryRowSpan = (record: TeacherFunctionAnalysisRecord, index: number) => {
    if (record.rowType === 'total') {
      return 1
    }

    // 计算当前类别有多少行
    const dataRows = dataSource.filter((item) => item.rowType === 'data')
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

  // 表头样式（浅黄色背景）
  const headerCellStyle: React.CSSProperties = {
    backgroundColor: '#fffacd',
    fontWeight: 'bold',
    textAlign: 'center',
  }

  // 定义表格列
  const columns: ColumnsType<TeacherFunctionAnalysisRecord> = [
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
    ...employees.map((emp) => ({
      title: emp,
      dataIndex: emp,
      key: emp,
      width: 100,
      align: 'center' as const,
      render: (value: number, record: TeacherFunctionAnalysisRecord) => {
        if (record.rowType === 'total') {
          // 计算合计：该员工所有项目的分数总和
          const dataRows = dataSource.filter((item) => item.rowType === 'data')
          const total = dataRows.reduce((sum, item) => sum + (item[emp] || 0), 0)
          return <span style={{ fontWeight: 'bold' }}>{total}</span>
        }
        return value || 0
      },
    })),
  ]

  // 更新合计行
  const updatedDataSource = useMemo(() => {
    const data = [...dataSource]
    const totalIndex = data.findIndex((item) => item.rowType === 'total')
    if (totalIndex >= 0) {
      const totalRow = data[totalIndex]
      const dataRows = data.filter((item) => item.rowType === 'data')
      // 计算每个员工的合计分数
      employees.forEach((emp) => {
        const total = dataRows.reduce((sum, item) => sum + (item[emp] || 0), 0)
        totalRow[emp] = total
      })
      data[totalIndex] = totalRow
    }
    return data
  }, [dataSource])

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
        {selectedCampus || currentCampus || '神殿'}教化司班主任功能分析表
      </div>

      <Card>
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
          dataSource={updatedDataSource}
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
      </Card>
    </div>
  )
}

export default TeacherFunctionAnalysisPage
