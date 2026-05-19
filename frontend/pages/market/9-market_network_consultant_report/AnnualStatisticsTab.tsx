import React, { useState, useEffect } from 'react'
import { App, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'

interface MonthlyData {
  month: string
  totalEntries: number
  totalDialogs: number
  invalidDialogs: number
  validDialogs: number
  validDialogRate: string
  validDryDialogs: number
  dryDialogRate: string
  chatOutput: number
  chatOutputRate: string
}

interface AnnualStatisticsTabProps {
  year: string
}

const AnnualStatisticsTab: React.FC<AnnualStatisticsTabProps> = ({ year }) => {
  const { message } = App.useApp()
  const [dataSource, setDataSource] = useState<MonthlyData[]>([])
  const [loading, setLoading] = useState(false)

  // 从后端加载年度统计数据
  const loadAnnualStatistics = async () => {
    try {
      setLoading(true)
      
      const response = await fetch(`/api/v1/market/network-consultant/annual-statistics/${year}`)
      
      if (!response.ok) {
        throw new Error('加载年度统计数据失败')
      }
      
      const apiData = await response.json()
      
      // 转换API数据为表格数据格式
      const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
      const monthlyData: MonthlyData[] = apiData.map((item: any, index: number) => {
        const validDialogRate = item.valid_dialog_rate !== null 
          ? `${item.valid_dialog_rate.toFixed(2)}%` 
          : '#DIV/0!'
        const dryDialogRate = item.intervention_dialog_rate !== null 
          ? `${item.intervention_dialog_rate.toFixed(2)}%` 
          : '#DIV/0!'
        const chatOutputRate = item.chat_output_rate !== null 
          ? `${item.chat_output_rate.toFixed(2)}%` 
          : '#DIV/0!'
        
        return {
          month: months[index],
          totalEntries: item.total_incoming_calls,
          totalDialogs: item.total_dialogs,
          invalidDialogs: item.total_invalid_dialogs,
          validDialogs: item.total_valid_dialogs,
          validDialogRate: validDialogRate,
          validDryDialogs: item.total_valid_intervention_dialogs,
          dryDialogRate: dryDialogRate,
          chatOutput: item.total_chat_output,
          chatOutputRate: chatOutputRate,
        }
      })
      
      // 计算总计
      const total = monthlyData.reduce(
        (acc, cur) => ({
          totalEntries: acc.totalEntries + cur.totalEntries,
          totalDialogs: acc.totalDialogs + cur.totalDialogs,
          invalidDialogs: acc.invalidDialogs + cur.invalidDialogs,
          validDryDialogs: acc.validDryDialogs + cur.validDryDialogs,
          chatOutput: acc.chatOutput + cur.chatOutput,
        }),
        { totalEntries: 0, totalDialogs: 0, invalidDialogs: 0, validDryDialogs: 0, chatOutput: 0 }
      )
      
      const totalValidDialogs = total.totalDialogs - total.invalidDialogs
      const totalValidDialogRate = total.totalDialogs > 0 
        ? `${((totalValidDialogs / total.totalDialogs) * 100).toFixed(2)}%`
        : '#DIV/0!'
      const totalDryDialogRate = totalValidDialogs > 0
        ? `${((total.validDryDialogs / totalValidDialogs) * 100).toFixed(2)}%`
        : '#DIV/0!'
      const totalChatOutputRate = total.validDryDialogs > 0
        ? `${((total.chatOutput / total.validDryDialogs) * 100).toFixed(2)}%`
        : '#DIV/0!'
      
      const totalRow: MonthlyData = {
        month: '总计',
        totalEntries: total.totalEntries,
        totalDialogs: total.totalDialogs,
        invalidDialogs: total.invalidDialogs,
        validDialogs: totalValidDialogs,
        validDialogRate: totalValidDialogRate,
        validDryDialogs: total.validDryDialogs,
        dryDialogRate: totalDryDialogRate,
        chatOutput: total.chatOutput,
        chatOutputRate: totalChatOutputRate,
      }
      
      setDataSource([totalRow, ...monthlyData])
    } catch (error) {
      console.error('加载年度统计数据失败:', error)
      message.error('加载年度统计数据失败')
      
      // 加载失败时显示空白数据
      const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
      const initialData: MonthlyData[] = [
        {
          month: '总计',
          totalEntries: 0,
          totalDialogs: 0,
          invalidDialogs: 0,
          validDialogs: 0,
          validDialogRate: '#DIV/0!',
          validDryDialogs: 0,
          dryDialogRate: '#DIV/0!',
          chatOutput: 0,
          chatOutputRate: '#DIV/0!',
        },
        ...months.map(month => ({
          month,
          totalEntries: 0,
          totalDialogs: 0,
          invalidDialogs: 0,
          validDialogs: 0,
          validDialogRate: '#DIV/0!',
          validDryDialogs: 0,
          dryDialogRate: '#DIV/0!',
          chatOutput: 0,
          chatOutputRate: '#DIV/0!',
        })),
      ]
      setDataSource(initialData)
    } finally {
      setLoading(false)
    }
  }

  // 初始化数据
  useEffect(() => {
    loadAnnualStatistics()
  }, [year])

  const columns: ColumnsType<MonthlyData> = [
    {
      title: '月份',
      dataIndex: 'month',
      key: 'month',
      width: 100,
      fixed: 'left',
      align: 'center',
      render: (text: string) => (
        <div style={{ 
          fontWeight: text === '总计' ? 'bold' : 'normal',
          backgroundColor: text === '总计' ? '#ffc000' : 'transparent',
          padding: '4px 8px'
        }}>
          {text}
        </div>
      ),
    },
    {
      title: '进线量',
      dataIndex: 'totalEntries',
      key: 'totalEntries',
      width: 100,
      align: 'center',
      render: (value: number, record) => (
        <div style={{ 
          fontWeight: record.month === '总计' ? 'bold' : 'normal',
          color: record.month === '总计' ? 'red' : 'inherit'
        }}>
          {value}
        </div>
      ),
    },
    {
      title: '总对话',
      dataIndex: 'totalDialogs',
      key: 'totalDialogs',
      width: 100,
      align: 'center',
      render: (value: number, record) => (
        <div style={{ 
          fontWeight: record.month === '总计' ? 'bold' : 'normal',
          color: record.month === '总计' ? 'red' : 'inherit'
        }}>
          {value}
        </div>
      ),
    },
    {
      title: '无效对话量',
      dataIndex: 'invalidDialogs',
      key: 'invalidDialogs',
      width: 120,
      align: 'center',
      render: (value: number, record) => (
        <div style={{ 
          fontWeight: record.month === '总计' ? 'bold' : 'normal',
          color: record.month === '总计' ? 'red' : 'inherit'
        }}>
          {value}
        </div>
      ),
    },
    {
      title: '有效对话量',
      dataIndex: 'validDialogs',
      key: 'validDialogs',
      width: 120,
      align: 'center',
      render: (value: number, record) => (
        <div style={{ 
          fontWeight: record.month === '总计' ? 'bold' : 'normal',
          color: record.month === '总计' ? 'red' : 'inherit'
        }}>
          {value}
        </div>
      ),
    },
    {
      title: '有效对话率',
      dataIndex: 'validDialogRate',
      key: 'validDialogRate',
      width: 120,
      align: 'center',
      render: (text: string, record) => (
        <div style={{ 
          fontWeight: record.month === '总计' ? 'bold' : 'normal',
          color: text === '#DIV/0!' ? '#999' : record.month === '总计' ? 'red' : 'inherit'
        }}>
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
      render: (value: number, record) => (
        <div style={{ 
          fontWeight: record.month === '总计' ? 'bold' : 'normal',
          color: record.month === '总计' ? 'red' : 'inherit'
        }}>
          {value}
        </div>
      ),
    },
    {
      title: '干预对话率',
      dataIndex: 'dryDialogRate',
      key: 'dryDialogRate',
      width: 120,
      align: 'center',
      render: (text: string, record) => (
        <div style={{ 
          fontWeight: record.month === '总计' ? 'bold' : 'normal',
          color: text === '#DIV/0!' ? '#999' : record.month === '总计' ? 'red' : 'inherit'
        }}>
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
      render: (value: number, record) => (
        <div style={{ 
          fontWeight: record.month === '总计' ? 'bold' : 'normal',
          color: record.month === '总计' ? 'red' : 'inherit'
        }}>
          {value}
        </div>
      ),
    },
    {
      title: '聊出率',
      dataIndex: 'chatOutputRate',
      key: 'chatOutputRate',
      width: 100,
      align: 'center',
      render: (text: string, record) => (
        <div style={{ 
          fontWeight: record.month === '总计' ? 'bold' : 'normal',
          color: text === '#DIV/0!' ? '#999' : record.month === '总计' ? 'red' : 'inherit'
        }}>
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
        rowKey="month"
        pagination={false}
        bordered
        size="small"
        scroll={{ x: 1200, y: 600 }}
        loading={loading}
        rowClassName={(record) => record.month === '总计' ? 'total-row' : ''}
      />
      <style>{`
        .total-row {
          background-color: #fff9e6 !important;
        }
        .total-row:hover {
          background-color: #fff9e6 !important;
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

export default AnnualStatisticsTab
