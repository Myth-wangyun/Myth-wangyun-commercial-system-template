import React, { useState, useEffect } from 'react'
import { App, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'

interface DailyData {
  date: string
  group: string
  className: string
  incomingCalls: number
  totalDialogs: number
  invalidDialogs: number
  validDialogs: number
  validDialogRate: string
  validDryDialogs: number
  dryDialogRate: string
  chatOutput: number
  chatOutputRate: string
  isYearSummary?: boolean
  isMonthSummary?: boolean
}

interface MonthlyStatisticsTabProps {
  year: string
  month: string
}

const MonthlyStatisticsTab: React.FC<MonthlyStatisticsTabProps> = ({ year, month }) => {
  const { message } = App.useApp()
  const [dataSource, setDataSource] = useState<DailyData[]>([])
  const [loading, setLoading] = useState(false)

  // 从后端加载月度统计数据
  const loadMonthlyStatistics = async () => {
    try {
      setLoading(true)
      
      // 获取年度统计数据
      const yearResponse = await fetch(`/api/v1/market/network-consultant/annual-statistics/${year}`)
      if (!yearResponse.ok) {
        throw new Error('加载年度统计数据失败')
      }
      const yearData = await yearResponse.json()
      
      // 获取所有12个月的员工配置和详细数据
      const allMonthsData: any = {}
      for (let m = 1; m <= 12; m++) {
        try {
          const configResponse = await fetch(`/api/v1/market/network-consultant/monthly-statistics/${year}/${m}`)
          if (configResponse.ok) {
            const configData = await configResponse.json()
            allMonthsData[m] = {
              group_a: configData.group_a || [],
              group_b: configData.group_b || []
            }
          }
        } catch (error) {
          console.error(`加载${m}月数据失败:`, error)
          allMonthsData[m] = {
            group_a: [],
            group_b: []
          }
        }
      }
      
      console.log('所有月份的详细数据:', allMonthsData)
      
      const initialData: DailyData[] = []
      
      // 计算年度汇总（所有月份的总和）
      const yearTotal = yearData.reduce((acc: any, item: any) => ({
        total_incoming_calls: acc.total_incoming_calls + item.total_incoming_calls,
        total_dialogs: acc.total_dialogs + item.total_dialogs,
        total_invalid_dialogs: acc.total_invalid_dialogs + item.total_invalid_dialogs,
        total_valid_dialogs: acc.total_valid_dialogs + item.total_valid_dialogs,
        total_valid_intervention_dialogs: acc.total_valid_intervention_dialogs + item.total_valid_intervention_dialogs,
        total_chat_output: acc.total_chat_output + item.total_chat_output,
      }), {
        total_incoming_calls: 0,
        total_dialogs: 0,
        total_invalid_dialogs: 0,
        total_valid_dialogs: 0,
        total_valid_intervention_dialogs: 0,
        total_chat_output: 0,
      })
      
      const yearValidDialogRate = yearTotal.total_dialogs > 0 
        ? `${((yearTotal.total_valid_dialogs / yearTotal.total_dialogs) * 100).toFixed(2)}%`
        : '#DIV/0!'
      const yearDryDialogRate = yearTotal.total_valid_dialogs > 0
        ? `${((yearTotal.total_valid_intervention_dialogs / yearTotal.total_valid_dialogs) * 100).toFixed(2)}%`
        : '#DIV/0!'
      const yearChatOutputRate = yearTotal.total_valid_intervention_dialogs > 0
        ? `${((yearTotal.total_chat_output / yearTotal.total_valid_intervention_dialogs) * 100).toFixed(2)}%`
        : '#DIV/0!'
      
      // 添加年度汇总行
      initialData.push({
        date: '年度',
        group: '汇总',
        className: '',
        incomingCalls: yearTotal.total_incoming_calls,
        totalDialogs: yearTotal.total_dialogs,
        invalidDialogs: yearTotal.total_invalid_dialogs,
        validDialogs: yearTotal.total_valid_dialogs,
        validDialogRate: yearValidDialogRate,
        validDryDialogs: yearTotal.total_valid_intervention_dialogs,
        dryDialogRate: yearDryDialogRate,
        chatOutput: yearTotal.total_chat_output,
        chatOutputRate: yearChatOutputRate,
        isYearSummary: true,
      })
      
      // 计算全年员工数据汇总（用于年度汇总行）
      const allMonthsEmployeeData: any = {}
      
      for (let m = 1; m <= 12; m++) {
        const mData = allMonthsData[m]
        
        // 汇总A组员工数据
        mData.group_a?.forEach((emp: any) => {
          const key = `A组-${emp.employee_name}`
          if (!allMonthsEmployeeData[key]) {
            allMonthsEmployeeData[key] = {
              employee_name: emp.employee_name,
              group: 'A组',
              incoming_calls: 0,
              total_dialogs: 0,
              invalid_dialogs: 0,
              valid_intervention_dialogs: 0,
              chat_output: 0,
            }
          }
          allMonthsEmployeeData[key].incoming_calls += emp.incoming_calls || 0
          allMonthsEmployeeData[key].total_dialogs += emp.total_dialogs || 0
          allMonthsEmployeeData[key].invalid_dialogs += emp.invalid_dialogs || 0
          allMonthsEmployeeData[key].valid_intervention_dialogs += emp.valid_intervention_dialogs || 0
          allMonthsEmployeeData[key].chat_output += emp.chat_output || 0
        })
        
        // 汇总B组员工数据
        mData.group_b?.forEach((emp: any) => {
          const key = `B组-${emp.employee_name}`
          if (!allMonthsEmployeeData[key]) {
            allMonthsEmployeeData[key] = {
              employee_name: emp.employee_name,
              group: 'B组',
              incoming_calls: 0,
              total_dialogs: 0,
              invalid_dialogs: 0,
              valid_intervention_dialogs: 0,
              chat_output: 0,
            }
          }
          allMonthsEmployeeData[key].incoming_calls += emp.incoming_calls || 0
          allMonthsEmployeeData[key].total_dialogs += emp.total_dialogs || 0
          allMonthsEmployeeData[key].invalid_dialogs += emp.invalid_dialogs || 0
          allMonthsEmployeeData[key].valid_intervention_dialogs += emp.valid_intervention_dialogs || 0
          allMonthsEmployeeData[key].chat_output += emp.chat_output || 0
        })
      }
      
      console.log('全年员工数据汇总:', allMonthsEmployeeData)
      
      // 收集所有出现过的员工（用于年度汇总行）
      const allGroupAEmployees = new Set<string>()
      const allGroupBEmployees = new Set<string>()
      
      Object.keys(allMonthsEmployeeData).forEach(key => {
        const empData = allMonthsEmployeeData[key]
        if (empData.group === 'A组') {
          allGroupAEmployees.add(empData.employee_name)
        } else if (empData.group === 'B组') {
          allGroupBEmployees.add(empData.employee_name)
        }
      })
      
      // 添加年度各组员工（显示全年汇总数据）
      Array.from(allGroupAEmployees).forEach((empName: string) => {
        const key = `A组-${empName}`
        const yearData = allMonthsEmployeeData[key] || {
          incoming_calls: 0,
          total_dialogs: 0,
          invalid_dialogs: 0,
          valid_intervention_dialogs: 0,
          chat_output: 0,
        }
        
        const validDialogs = yearData.total_dialogs - yearData.invalid_dialogs
        const validDialogRate = yearData.total_dialogs > 0 
          ? `${((validDialogs / yearData.total_dialogs) * 100).toFixed(2)}%`
          : '#DIV/0!'
        const dryDialogRate = validDialogs > 0
          ? `${((yearData.valid_intervention_dialogs / validDialogs) * 100).toFixed(2)}%`
          : '#DIV/0!'
        const chatOutputRate = yearData.valid_intervention_dialogs > 0
          ? `${((yearData.chat_output / yearData.valid_intervention_dialogs) * 100).toFixed(2)}%`
          : '#DIV/0!'
        
        initialData.push({
          date: '年度',
          group: 'A组',
          className: empName,
          incomingCalls: yearData.incoming_calls,
          totalDialogs: yearData.total_dialogs,
          invalidDialogs: yearData.invalid_dialogs,
          validDialogs: validDialogs,
          validDialogRate: validDialogRate,
          validDryDialogs: yearData.valid_intervention_dialogs,
          dryDialogRate: dryDialogRate,
          chatOutput: yearData.chat_output,
          chatOutputRate: chatOutputRate,
          isYearSummary: true,
        })
      })
      
      Array.from(allGroupBEmployees).forEach((empName: string) => {
        const key = `B组-${empName}`
        const yearData = allMonthsEmployeeData[key] || {
          incoming_calls: 0,
          total_dialogs: 0,
          invalid_dialogs: 0,
          valid_intervention_dialogs: 0,
          chat_output: 0,
        }
        
        const validDialogs = yearData.total_dialogs - yearData.invalid_dialogs
        const validDialogRate = yearData.total_dialogs > 0 
          ? `${((validDialogs / yearData.total_dialogs) * 100).toFixed(2)}%`
          : '#DIV/0!'
        const dryDialogRate = validDialogs > 0
          ? `${((yearData.valid_intervention_dialogs / validDialogs) * 100).toFixed(2)}%`
          : '#DIV/0!'
        const chatOutputRate = yearData.valid_intervention_dialogs > 0
          ? `${((yearData.chat_output / yearData.valid_intervention_dialogs) * 100).toFixed(2)}%`
          : '#DIV/0!'
        
        initialData.push({
          date: '年度',
          group: 'B组',
          className: empName,
          incomingCalls: yearData.incoming_calls,
          totalDialogs: yearData.total_dialogs,
          invalidDialogs: yearData.invalid_dialogs,
          validDialogs: validDialogs,
          validDialogRate: validDialogRate,
          validDryDialogs: yearData.valid_intervention_dialogs,
          dryDialogRate: dryDialogRate,
          chatOutput: yearData.chat_output,
          chatOutputRate: chatOutputRate,
          isYearSummary: true,
        })
      })
      
      // 添加各月份数据
      for (let m = 1; m <= 12; m++) {
        const monthStr = `${m}月`
        const currentMonthData = yearData[m - 1]
        
        // 月份汇总行
        const monthValidDialogRate = currentMonthData.valid_dialog_rate !== null
          ? `${currentMonthData.valid_dialog_rate.toFixed(2)}%`
          : '#DIV/0!'
        const monthDryDialogRate = currentMonthData.intervention_dialog_rate !== null
          ? `${currentMonthData.intervention_dialog_rate.toFixed(2)}%`
          : '#DIV/0!'
        const monthChatOutputRate = currentMonthData.chat_output_rate !== null
          ? `${currentMonthData.chat_output_rate.toFixed(2)}%`
          : '#DIV/0!'
        
        initialData.push({
          date: monthStr,
          group: '汇总',
          className: '',
          incomingCalls: currentMonthData.total_incoming_calls,
          totalDialogs: currentMonthData.total_dialogs,
          invalidDialogs: currentMonthData.total_invalid_dialogs,
          validDialogs: currentMonthData.total_valid_dialogs,
          validDialogRate: monthValidDialogRate,
          validDryDialogs: currentMonthData.total_valid_intervention_dialogs,
          dryDialogRate: monthDryDialogRate,
          chatOutput: currentMonthData.total_chat_output,
          chatOutputRate: monthChatOutputRate,
          isMonthSummary: true,
        })
        
        // 获取该月份的详细数据
        const monthDetailData = allMonthsData[m] || { group_a: [], group_b: [] }
        
        // 显示A组员工的详细数据
        monthDetailData.group_a?.forEach((emp: any) => {
          const empValidDialogRate = emp.valid_dialog_rate !== null
            ? `${emp.valid_dialog_rate.toFixed(2)}%`
            : '#DIV/0!'
          const empDryDialogRate = emp.intervention_dialog_rate !== null
            ? `${emp.intervention_dialog_rate.toFixed(2)}%`
            : '#DIV/0!'
          const empChatOutputRate = emp.chat_output_rate !== null
            ? `${emp.chat_output_rate.toFixed(2)}%`
            : '#DIV/0!'
          
          initialData.push({
            date: monthStr,
            group: 'A组',
            className: emp.employee_name,
            incomingCalls: emp.incoming_calls,
            totalDialogs: emp.total_dialogs,
            invalidDialogs: emp.invalid_dialogs,
            validDialogs: emp.valid_dialogs,
            validDialogRate: empValidDialogRate,
            validDryDialogs: emp.valid_intervention_dialogs,
            dryDialogRate: empDryDialogRate,
            chatOutput: emp.chat_output,
            chatOutputRate: empChatOutputRate,
            isMonthSummary: false,
          })
        })
        
        // 显示B组员工的详细数据
        monthDetailData.group_b?.forEach((emp: any) => {
          const empValidDialogRate = emp.valid_dialog_rate !== null
            ? `${emp.valid_dialog_rate.toFixed(2)}%`
            : '#DIV/0!'
          const empDryDialogRate = emp.intervention_dialog_rate !== null
            ? `${emp.intervention_dialog_rate.toFixed(2)}%`
            : '#DIV/0!'
          const empChatOutputRate = emp.chat_output_rate !== null
            ? `${emp.chat_output_rate.toFixed(2)}%`
            : '#DIV/0!'
          
          initialData.push({
            date: monthStr,
            group: 'B组',
            className: emp.employee_name,
            incomingCalls: emp.incoming_calls,
            totalDialogs: emp.total_dialogs,
            invalidDialogs: emp.invalid_dialogs,
            validDialogs: emp.valid_dialogs,
            validDialogRate: empValidDialogRate,
            validDryDialogs: emp.valid_intervention_dialogs,
            dryDialogRate: empDryDialogRate,
            chatOutput: emp.chat_output,
            chatOutputRate: empChatOutputRate,
            isMonthSummary: false,
          })
        })
      }
      
      setDataSource(initialData)
    } catch (error) {
      console.error('加载月度统计数据失败:', error)
      message.error('加载月度统计数据失败')
      
      // 加载失败时显示空数据（不显示默认员工）
      setDataSource([])
    } finally {
      setLoading(false)
    }
  }

  // 初始化数据（只依赖年份，加载全年数据）
  useEffect(() => {
    loadMonthlyStatistics()
  }, [year])

  const columns: ColumnsType<DailyData> = [
    {
      title: '月份',
      dataIndex: 'date',
      key: 'date',
      width: 100,
      fixed: 'left',
      align: 'center',
      onCell: (record, index) => {
        // 计算合并行数
        const currentDate = record.date
        const sameMonthCount = dataSource.filter(item => item.date === currentDate).length
        const firstIndex = dataSource.findIndex(item => item.date === currentDate)
        
        if (index === firstIndex) {
          return { rowSpan: sameMonthCount }
        }
        return { rowSpan: 0 }
      },
      render: (text: string) => text,
    },
    {
      title: '组别',
      dataIndex: 'group',
      key: 'group',
      width: 100,
      fixed: 'left',
      align: 'center',
      onCell: (record, index) => {
        // 如果是汇总行，不合并
        if (record.group === '汇总') {
          return {}
        }
        
        // 计算同一月份同一组的行数
        const currentDate = record.date
        const currentGroup = record.group
        const sameGroupCount = dataSource.filter(
          item => item.date === currentDate && item.group === currentGroup
        ).length
        const firstIndex = dataSource.findIndex(
          item => item.date === currentDate && item.group === currentGroup
        )
        
        if (index === firstIndex) {
          return { rowSpan: sameGroupCount }
        }
        return { rowSpan: 0 }
      },
      render: (text: string) => text,
    },
    {
      title: '网聊姓名',
      dataIndex: 'className',
      key: 'className',
      width: 100,
      fixed: 'left',
      align: 'center',
      render: (text: string) => text,
    },
    {
      title: '进线量',
      dataIndex: 'incomingCalls',
      key: 'incomingCalls',
      width: 100,
      align: 'center',
      render: (value: number) => <div>{value}</div>,
    },
    {
      title: '总对话',
      dataIndex: 'totalDialogs',
      key: 'totalDialogs',
      width: 100,
      align: 'center',
      render: (value: number) => <div>{value}</div>,
    },
    {
      title: '无效对话量',
      dataIndex: 'invalidDialogs',
      key: 'invalidDialogs',
      width: 120,
      align: 'center',
      render: (value: number) => <div>{value}</div>,
    },
    {
      title: '有效对话量',
      dataIndex: 'validDialogs',
      key: 'validDialogs',
      width: 120,
      align: 'center',
      render: (value: number) => <div>{value}</div>,
    },
    {
      title: '有效对话率',
      dataIndex: 'validDialogRate',
      key: 'validDialogRate',
      width: 120,
      align: 'center',
      render: (text: string) => (
        <div style={{ color: text === '#DIV/0!' ? '#999' : 'inherit' }}>
          {text}
        </div>
      ),
    },
    {
      title: '有效干预对话量',
      dataIndex: 'validDryDialogs',
      key: 'validDryDialogs',
      width: 140,
      align: 'center',
      render: (value: number) => <div>{value}</div>,
    },
    {
      title: '干预对话率',
      dataIndex: 'dryDialogRate',
      key: 'dryDialogRate',
      width: 120,
      align: 'center',
      render: (text: string) => (
        <div style={{ color: text === '#DIV/0!' ? '#999' : 'inherit' }}>
          {text}
        </div>
      ),
    },
    {
      title: '聊出量',
      dataIndex: 'chatOutput',
      key: 'chatOutput',
      width: 100,
      align: 'center',
      render: (value: number) => <div>{value}</div>,
    },
    {
      title: '聊出率',
      dataIndex: 'chatOutputRate',
      key: 'chatOutputRate',
      width: 100,
      align: 'center',
      render: (text: string) => (
        <div style={{ color: text === '#DIV/0!' ? '#999' : 'inherit' }}>
          {text}
        </div>
      ),
    },
  ]

  return (
    <div>
      <Table
        columns={columns}
        dataSource={dataSource}
        rowKey={(record, index) => `${record.date}-${record.group}-${record.className}-${index}`}
        pagination={false}
        bordered
        size="small"
        scroll={{ y: 600 }}
        loading={loading}
        rowClassName={(record) => {
          if (record.group === '汇总') {
            return 'summary-row'
          }
          return ''
        }}
      />
      <style>{`
        .summary-row {
          background-color:rgb(255, 192, 0) !important;
          font-weight: bold;
        }
        .summary-row:hover {
          background-color:rgb(255, 192, 0) !important;
        }
        .summary-row td {
          background-color:rgb(255, 255, 255) !important;
        }
        .ant-table-cell {
          padding: 4px 8px !important;
          text-align: center !important;
        }
        .ant-table-bordered .ant-table-cell {
          border-color: #666 !important;
        }
        .ant-table-bordered .ant-table-thead > tr > th {
          border-color: #666 !important;
        }
        .ant-table-bordered .ant-table-tbody > tr > td {
          border-color: #666 !important;
        }
      `}</style>
    </div>
  )
}

export default MonthlyStatisticsTab
