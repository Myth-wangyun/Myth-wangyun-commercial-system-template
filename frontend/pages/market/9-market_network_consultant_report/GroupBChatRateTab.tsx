import React, { useState, useEffect } from 'react'
import { App, Table, InputNumber, Button, Space, Modal, Form, Input, Select } from 'antd'
import { SaveOutlined, ReloadOutlined, SyncOutlined, TeamOutlined, EditOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { getDailyChatOutputByConsultant } from './api'
import EmployeeConfigModal from './EmployeeConfigModal'

interface DailyGroupData {
  key: string
  date: string
  dateKey: string // 用于匹配的日期格式 YYYY-MM-DD
  weekDay: string
  shift: string
  employeeName: string
  incomingCalls: number
  totalDialogs: number
  invalidDialogs: number
  validDialogs: number
  validDialogRate: string
  validInterventionDialogs: number
  interventionDialogRate: string
  chatOutput: number
  chatOutputRate: string
  isSummary?: boolean
}

interface GroupBChatRateTabProps {
  year: string
  month: string
}

const GroupBChatRateTab: React.FC<GroupBChatRateTabProps> = ({ year, month }) => {
  const { message } = App.useApp()
  const [dataSource, setDataSource] = useState<DailyGroupData[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [syncingChatOutput, setSyncingChatOutput] = useState(false)
  const [employeeConfigVisible, setEmployeeConfigVisible] = useState(false)
  const [configuredEmployees, setConfiguredEmployees] = useState<string[]>(['员工1', '员工2', '员工3'])
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<DailyGroupData | null>(null)
  const [editForm] = Form.useForm()

  // 获取当月天数
  const getDaysInMonth = (year: string, month: string) => {
    return dayjs(`${year}-${month}`).daysInMonth()
  }

  // 获取星期几
  const getDayOfWeek = (year: string, month: string, day: number) => {
    const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
    const date = dayjs(`${year}-${month}-${String(day).padStart(2, '0')}`)
    return weekDays[date.day()]
  }

  // 从咨询量系统同步聊出量数据
  const syncChatOutputFromConsultation = async () => {
    try {
      setSyncingChatOutput(true)
      
      // 获取聊出量统计数据
      console.log('[B组同步] 开始获取聊出量, 年月:', year, month)
      const chatOutputMap = await getDailyChatOutputByConsultant(year, month)
      console.log('[B组同步] 获取到聊出量映射, 日期数量:', chatOutputMap.size)
      
      // 更新数据源中的聊出量
      setDataSource(prev => {
        const newData = [...prev]
        let updatedCount = 0
        let matchedCount = 0
        
        newData.forEach((record, index) => {
          if (record.isSummary) return
          
          // 根据日期和员工名称查找匹配的聊出量
          console.log(`[B组同步] 尝试匹配: 日期=${record.dateKey}, 员工=${record.employeeName}`)
          const dateStats = chatOutputMap.get(record.dateKey)
          if (dateStats) {
            matchedCount++
            const chatOutput = dateStats.get(record.employeeName)
            console.log(`[B组同步] 日期匹配成功, 查找员工=${record.employeeName}, 结果=${chatOutput}`)
            if (chatOutput !== undefined) {
              if (chatOutput !== record.chatOutput) {
                newData[index] = { ...record, chatOutput }
                updatedCount++
                console.log(`[B组同步] 更新聊出量: ${record.dateKey} - ${record.employeeName}: ${record.chatOutput} -> ${chatOutput}`)
              }
            }
          }
        })
        
        console.log(`[B组同步] 日期匹配成功数: ${matchedCount}, 更新记录数: ${updatedCount}`)
        
        // 重新计算汇总和比率
        const calculated = newData.map((record, index) => {
          if (record.isSummary) return record
          const rates = calculateRates(record)
          return {
            ...record,
            validDialogs: rates.validDialogs,
            validDialogRate: rates.validDialogRate,
            interventionDialogRate: rates.interventionDialogRate,
            chatOutputRate: rates.chatOutputRate,
          }
        })
        
        message.success(`已从咨询量系统同步聊出量数据，更新了 ${updatedCount} 条记录`)
        return calculateSummary(calculated)
      })
    } catch (error) {
      console.error('同步聊出量失败:', error)
      message.error('同步聊出量失败，请稍后重试')
    } finally {
      setSyncingChatOutput(false)
    }
  }

  // 加载人员配置
  const loadEmployeeConfig = async () => {
    try {
      const response = await fetch(
        `/api/v1/market/network-consultant/group-b/config/${year}/${month}`
      )
      
      if (response.ok) {
        const config = await response.json()
        if (config.employees && config.employees.length > 0) {
          setConfiguredEmployees(config.employees)
          return config.employees
        }
      }
    } catch (error) {
      console.error('加载人员配置失败:', error)
    }
    
    // 如果没有配置，使用默认值
    return configuredEmployees
  }

  // 保存人员配置
  const saveEmployeeConfig = async (employees: string[]) => {
    try {
      const response = await fetch(
        `/api/v1/market/network-consultant/group-b/config/${year}/${month}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ employees })
        }
      )
      
      if (!response.ok) {
        throw new Error('保存人员配置失败')
      }
      
      message.success('人员配置保存成功')
      setConfiguredEmployees(employees)
      setEmployeeConfigVisible(false)
      
      // 重新加载数据
      await loadDataFromDatabase()
    } catch (error) {
      console.error('保存人员配置失败:', error)
      message.error('保存人员配置失败')
    }
  }

  // 从数据库加载数据
  const loadDataFromDatabase = async () => {
    try {
      setLoading(true)
      
      // 先加载人员配置
      const employees = await loadEmployeeConfig()
      
      // 调用API获取数据
      const response = await fetch(
        `/api/v1/market/network-consultant/group-b/month/${year}/${month}`
      )
      
      if (!response.ok) {
        throw new Error('加载数据失败')
      }
      
      const dbData = await response.json()
      
      // 初始化数据结构
      const daysInMonth = getDaysInMonth(year, month)
      const initialData: DailyGroupData[] = []

      // 添加月度汇总行
      employees.forEach(employee => {
        initialData.push({
          key: `summary-${employee}`,
          date: '',
          dateKey: '',
          weekDay: '',
          shift: '',
          employeeName: employee,
          incomingCalls: 0,
          totalDialogs: 0,
          invalidDialogs: 0,
          validDialogs: 0,
          validDialogRate: '0%',
          validInterventionDialogs: 0,
          interventionDialogRate: '0%',
          chatOutput: 0,
          chatOutputRate: '0%',
          isSummary: true,
        })
      })

      // 为每一天创建数据
      for (let day = 1; day <= daysInMonth; day++) {
        const dayStr = `${parseInt(month)}月${day}日`
        const dateKey = `${year}-${month.padStart(2, '0')}-${String(day).padStart(2, '0')}`
        const weekDay = getDayOfWeek(year, month, day)
        
        employees.forEach(employee => {
          // 查找数据库中对应的记录
          const dbRecord = dbData.find((item: any) => {
            const itemDate = new Date(item.date)
            return itemDate.getDate() === day && item.employee_name === employee
          })
          
          if (dbRecord) {
            // 如果数据库中有数据，使用数据库的数据
            initialData.push({
              key: `${day}-${employee}`,
              date: dayStr,
              dateKey,
              weekDay: dbRecord.week_day || weekDay,
              shift: dbRecord.shift || '',
              employeeName: employee,
              incomingCalls: dbRecord.incoming_calls || 0,
              totalDialogs: dbRecord.total_dialogs || 0,
              invalidDialogs: dbRecord.invalid_dialogs || 0,
              validDialogs: dbRecord.valid_dialogs || 0,
              validDialogRate: dbRecord.valid_dialog_rate 
                ? `${dbRecord.valid_dialog_rate.toFixed(2)}%` 
                : '0%',
              validInterventionDialogs: dbRecord.valid_intervention_dialogs || 0,
              interventionDialogRate: dbRecord.intervention_dialog_rate 
                ? `${dbRecord.intervention_dialog_rate.toFixed(2)}%` 
                : '0%',
              chatOutput: dbRecord.chat_output || 0,
              chatOutputRate: dbRecord.chat_output_rate 
                ? `${dbRecord.chat_output_rate.toFixed(2)}%` 
                : '0%',
            })
          } else {
            // 如果数据库中没有数据，使用默认值
            initialData.push({
              key: `${day}-${employee}`,
              date: dayStr,
              dateKey,
              weekDay,
              shift: '',
              employeeName: employee,
              incomingCalls: 0,
              totalDialogs: 0,
              invalidDialogs: 0,
              validDialogs: 0,
              validDialogRate: '0%',
              validInterventionDialogs: 0,
              interventionDialogRate: '0%',
              chatOutput: 0,
              chatOutputRate: '0%',
            })
          }
        })
      }

      // 计算汇总数据
      const dataWithSummary = calculateSummary(initialData)
      setDataSource(dataWithSummary)
    } catch (error) {
      console.error('加载数据失败:', error)
      message.error('加载数据失败，显示空白数据')
      
      // 加载失败时显示空白数据
      const daysInMonth = getDaysInMonth(year, month)
      const employees = configuredEmployees
      const initialData: DailyGroupData[] = []

      employees.forEach(employee => {
        initialData.push({
          key: `summary-${employee}`,
          date: '',
          dateKey: '',
          weekDay: '',
          shift: '',
          employeeName: employee,
          incomingCalls: 0,
          totalDialogs: 0,
          invalidDialogs: 0,
          validDialogs: 0,
          validDialogRate: '0%',
          validInterventionDialogs: 0,
          interventionDialogRate: '0%',
          chatOutput: 0,
          chatOutputRate: '0%',
          isSummary: true,
        })
      })

      for (let day = 1; day <= daysInMonth; day++) {
        const dayStr = `${parseInt(month)}月${day}日`
        const dateKey = `${year}-${month.padStart(2, '0')}-${String(day).padStart(2, '0')}`
        const weekDay = getDayOfWeek(year, month, day)
        
        employees.forEach(employee => {
          initialData.push({
            key: `${day}-${employee}`,
            date: dayStr,
            dateKey,
            weekDay,
            shift: '',
            employeeName: employee,
            incomingCalls: 0,
            totalDialogs: 0,
            invalidDialogs: 0,
            validDialogs: 0,
            validDialogRate: '0%',
            validInterventionDialogs: 0,
            interventionDialogRate: '0%',
            chatOutput: 0,
            chatOutputRate: '0%',
          })
        })
      }

      setDataSource(initialData)
    } finally {
      setLoading(false)
    }
  }

  // 初始化数据并自动同步聊出量
  useEffect(() => {
    const initAndSync = async () => {
      await loadDataFromDatabase()
      // 加载完成后自动同步聊出量
    }
    initAndSync()
  }, [year, month])
  
  // 数据加载完成后自动同步聊出量
  useEffect(() => {
    // 如果数据已加载且未在同步中，自动同步聊出量
    if (dataSource.length > 0 && !loading && !syncingChatOutput) {
      // 使用一个标记避免重复同步
      const shouldAutoSync = dataSource.some(record => 
        !record.isSummary && record.chatOutput === 0
      )
      if (shouldAutoSync) {
        console.log('[B组] 数据加载完成，自动同步聊出量')
        syncChatOutputFromConsultation()
      }
    }
  }, [dataSource.length, loading]) // 当数据变化时检查是否需要同步

  // 计算公式
  const calculateRates = (record: DailyGroupData) => {
    const validDialogs = record.totalDialogs - record.invalidDialogs
    const validDialogRate = record.totalDialogs > 0 
      ? ((validDialogs / record.totalDialogs) * 100).toFixed(2) + '%'
      : '0%'
    
    const interventionDialogRate = validDialogs > 0
      ? ((record.validInterventionDialogs / validDialogs) * 100).toFixed(2) + '%'
      : '0%'
    
    // 聊出率 = 聊出量 ÷ 有效对话量
    const chatOutputRate = validDialogs > 0
      ? ((record.chatOutput / validDialogs) * 100).toFixed(2) + '%'
      : '0%'

    return {
      validDialogs,
      validDialogRate,
      interventionDialogRate,
      chatOutputRate,
    }
  }

  // 计算汇总数据
  const calculateSummary = (data: DailyGroupData[]) => {
    // 获取汇总行的索引和员工姓名
    const summaryRows = data.filter(item => item.isSummary)
    
    summaryRows.forEach((summaryRow, empIndex) => {
      const employeeName = summaryRow.employeeName
      
      // 找到该员工的所有非汇总行数据
      const employeeData = data.filter(item => 
        !item.isSummary && item.employeeName === employeeName
      )
      
      // 汇总各项数据
      const summaryData = employeeData.reduce((acc, item) => ({
        incomingCalls: acc.incomingCalls + item.incomingCalls,
        totalDialogs: acc.totalDialogs + item.totalDialogs,
        invalidDialogs: acc.invalidDialogs + item.invalidDialogs,
        validInterventionDialogs: acc.validInterventionDialogs + item.validInterventionDialogs,
        chatOutput: acc.chatOutput + item.chatOutput,
      }), {
        incomingCalls: 0,
        totalDialogs: 0,
        invalidDialogs: 0,
        validInterventionDialogs: 0,
        chatOutput: 0,
      })
      
      // 计算汇总的比率
      const validDialogs = summaryData.totalDialogs - summaryData.invalidDialogs
      const validDialogRate = summaryData.totalDialogs > 0 
        ? ((validDialogs / summaryData.totalDialogs) * 100).toFixed(2) + '%'
        : '0%'
      
      const interventionDialogRate = validDialogs > 0
        ? ((summaryData.validInterventionDialogs / validDialogs) * 100).toFixed(2) + '%'
        : '0%'
      
      // 聊出率 = 聊出量 ÷ 有效对话量
      const chatOutputRate = validDialogs > 0
        ? ((summaryData.chatOutput / validDialogs) * 100).toFixed(2) + '%'
        : '0%'
      
      // 更新汇总行
      const summaryIndex = empIndex
      data[summaryIndex] = {
        ...data[summaryIndex],
        incomingCalls: summaryData.incomingCalls,
        totalDialogs: summaryData.totalDialogs,
        invalidDialogs: summaryData.invalidDialogs,
        validDialogs: validDialogs,
        validDialogRate: validDialogRate,
        validInterventionDialogs: summaryData.validInterventionDialogs,
        interventionDialogRate: interventionDialogRate,
        chatOutput: summaryData.chatOutput,
        chatOutputRate: chatOutputRate,
      }
    })
    
    return data
  }

  // 更新数据
  const handleUpdate = (index: number, field: keyof DailyGroupData, value: number | string) => {
    setDataSource(prev => {
      const newData = [...prev]
      const updated = { ...newData[index], [field]: value }
      const calculated = calculateRates(updated)
      
      newData[index] = {
        ...updated,
        validDialogs: calculated.validDialogs,
        validDialogRate: calculated.validDialogRate,
        interventionDialogRate: calculated.interventionDialogRate,
        chatOutputRate: calculated.chatOutputRate,
      }

      // 重新计算汇总数据
      return calculateSummary(newData)
    })
  }

  // 打开编辑弹窗
  const handleEdit = (record: DailyGroupData) => {
    if (record.isSummary) {
      message.warning('汇总行不可编辑')
      return
    }
    setEditingRecord(record)
    editForm.setFieldsValue({
      date: record.date,
      weekDay: record.weekDay,
      shift: record.shift,
      employeeName: record.employeeName,
      incomingCalls: record.incomingCalls,
      totalDialogs: record.totalDialogs,
      invalidDialogs: record.invalidDialogs,
      validInterventionDialogs: record.validInterventionDialogs,
      chatOutput: record.chatOutput,
    })
    setEditModalVisible(true)
  }

  // 保存编辑
  const handleEditSave = async () => {
    try {
      const values = await editForm.validateFields()
      
      if (!editingRecord) return

      // 准备保存的数据
      const dayMatch = editingRecord.date.match(/(\d+)月(\d+)日/)
      let dateStr = ''
      if (dayMatch) {
        const dayNum = parseInt(dayMatch[2])
        const yearNum = parseInt(year)
        const monthNum = parseInt(month)
        dateStr = `${yearNum}-${String(monthNum).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
      }

      const recordToSave = {
        日期: dateStr,
        星期: editingRecord.weekDay,
        班次: values.shift || '',
        网聊姓名: values.employeeName,
        进线量: values.incomingCalls,
        总对话: values.totalDialogs,
        无效对话量: values.invalidDialogs,
        有效干预对话量: values.validInterventionDialogs,
        聊出量: values.chatOutput,
        是否汇总: 0,
      }

      // 调用API保存单条数据到数据库
      const response = await fetch('/api/v1/market/network-consultant/group-b/batch', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          year: parseInt(year),
          month: parseInt(month),
          records: [recordToSave]
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || '保存失败')
      }

      // 更新数据源
      setDataSource(prev => {
        const newData = [...prev]
        const index = newData.findIndex(item => item.key === editingRecord.key)
        
        if (index !== -1) {
          const updated = {
            ...newData[index],
            shift: values.shift,
            employeeName: values.employeeName,
            incomingCalls: values.incomingCalls,
            totalDialogs: values.totalDialogs,
            invalidDialogs: values.invalidDialogs,
            validInterventionDialogs: values.validInterventionDialogs,
            chatOutput: values.chatOutput,
          }
          
          const calculated = calculateRates(updated)
          newData[index] = {
            ...updated,
            validDialogs: calculated.validDialogs,
            validDialogRate: calculated.validDialogRate,
            interventionDialogRate: calculated.interventionDialogRate,
            chatOutputRate: calculated.chatOutputRate,
          }
        }
        
        return calculateSummary(newData)
      })

      message.success('数据已保存到数据库')
      setEditModalVisible(false)
      setEditingRecord(null)
      editForm.resetFields()
    } catch (error) {
      console.error('保存失败:', error)
      message.error(error instanceof Error ? error.message : '保存失败，请重试')
    }
  }

  const columns: ColumnsType<DailyGroupData> = [
    {
      title: '操作',
      key: 'action',
      width: 80,
      fixed: 'left',
      align: 'center',
      render: (_, record) => {
        if (record.isSummary) {
          return null
        }
        return (
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          >
            编辑
          </Button>
        )
      },
    },
    {
      title: '星期',
      dataIndex: 'weekDay',
      key: 'weekDay',
      width: 80,
      fixed: 'left',
      align: 'center',
      onCell: (record, index) => {
        // 汇总行：第一个员工显示并跨3列（星期、日期、班次），其他隐藏
        if (record.isSummary) {
          if (index === 0) {
            return { rowSpan: 3, colSpan: 3 }
          }
          return { rowSpan: 0 }
        }
        // 每天3个员工，合并单元格
        if ((index - 3) % 3 === 0) {
          return { rowSpan: 3 }
        }
        return { rowSpan: 0 }
      },
      render: (text: string, record) => {
        if (record.isSummary) {
          return `${parseInt(month)}月份 B组汇总`
        }
        return text
      },
    },
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      width: 100,
      fixed: 'left',
      align: 'center',
      onCell: (record, index) => {
        // 汇总行：被星期列合并，隐藏
        if (record.isSummary) {
          if (index === 0) {
            return { rowSpan: 3, colSpan: 0 }
          }
          return { rowSpan: 0 }
        }
        // 每天3个员工，合并单元格
        if ((index - 3) % 3 === 0) {
          return { rowSpan: 3 }
        }
        return { rowSpan: 0 }
      },
    },
    {
      title: '班次',
      dataIndex: 'shift',
      key: 'shift',
      width: 100,
      fixed: 'left',
      align: 'center',
      onCell: (record, index) => {
        // 汇总行：被星期列合并，隐藏
        if (record.isSummary) {
          if (index === 0) {
            return { rowSpan: 3, colSpan: 0 }
          }
          return { rowSpan: 0 }
        }
        // 每天3个员工，第一个员工显示班次并合并3行，其他隐藏
        if ((index - 3) % 3 === 0) {
          return { rowSpan: 3 }
        }
        return { rowSpan: 0 }
      },
      render: (value: string, record, index) => {
        // 汇总行不显示
        if (record.isSummary) {
          return null
        }
        // 只有第一个员工显示班次选择器
        if ((index - 3) % 3 === 0) {
          return (
            <select
              value={value}
              onChange={(e) => {
                // 更新当天所有员工的班次
                const newShift = e.target.value
                setDataSource(prev => {
                  const newData = [...prev]
                  // 找到当天的3个员工记录并更新班次
                  for (let i = 0; i < 3; i++) {
                    if (index + i < newData.length && !newData[index + i].isSummary) {
                      newData[index + i] = { ...newData[index + i], shift: newShift }
                    }
                  }
                  return newData
                })
              }}
              style={{ 
                width: '100%',
                border: 'none',
                textAlign: 'center',
                backgroundColor: 'transparent',
                cursor: 'pointer'
              }}
            >
              <option value="">请选择</option>
              <option value="早班">早班</option>
              <option value="晚班">晚班</option>
              <option value="全体">全体</option>
            </select>
          )
        }
        return null
      },
    },
    {
      title: '网聊姓名',
      dataIndex: 'employeeName',
      key: 'employeeName',
      width: 100,
      fixed: 'left',
      align: 'center',
      render: (value: string, record, index) => (
        <input
          type="text"
          value={value}
          onChange={(e) => handleUpdate(index, 'employeeName', e.target.value)}
          style={{ 
            width: '100%',
            border: 'none',
            textAlign: 'center',
            backgroundColor: 'transparent'
          }}
        />
      ),
    },
    {
      title: '进线量',
      dataIndex: 'incomingCalls',
      key: 'incomingCalls',
      width: 100,
      align: 'center',
      render: (value: number, record, index) => {
        if (record.isSummary) {
          return <div style={{ textAlign: 'center' }}>{value}</div>
        }
        return (
          <InputNumber
            min={0}
            value={value}
            onChange={(val) => handleUpdate(index, 'incomingCalls', val || 0)}
            style={{ width: '100%', textAlign: 'center' }}
            bordered={false}
            controls={false}
          />
        )
      },
    },
    {
      title: '总对话',
      dataIndex: 'totalDialogs',
      key: 'totalDialogs',
      width: 100,
      align: 'center',
      render: (value: number, record, index) => {
        if (record.isSummary) {
          return <div style={{ textAlign: 'center' }}>{value}</div>
        }
        return (
          <InputNumber
            min={0}
            value={value}
            onChange={(val) => handleUpdate(index, 'totalDialogs', val || 0)}
            style={{ width: '100%', textAlign: 'center' }}
            bordered={false}
            controls={false}
          />
        )
      },
    },
    {
      title: '无效对话量',
      dataIndex: 'invalidDialogs',
      key: 'invalidDialogs',
      width: 110,
      align: 'center',
      render: (value: number, record, index) => {
        if (record.isSummary) {
          return <div style={{ textAlign: 'center' }}>{value}</div>
        }
        return (
          <InputNumber
            min={0}
            value={value}
            onChange={(val) => handleUpdate(index, 'invalidDialogs', val || 0)}
            style={{ width: '100%', textAlign: 'center' }}
            bordered={false}
            controls={false}
          />
        )
      },
    },
    {
      title: '有效对话量',
      dataIndex: 'validDialogs',
      key: 'validDialogs',
      width: 110,
      align: 'center',
      render: (value: number) => <div style={{ textAlign: 'center' }}>{value}</div>,
    },
    {
      title: '有效对话率',
      dataIndex: 'validDialogRate',
      key: 'validDialogRate',
      width: 110,
      align: 'center',
      render: (text: string) => (
        <div style={{ color: text === '0%' ? '#999' : 'inherit', textAlign: 'center' }}>
          {text}
        </div>
      ),
    },
    {
      title: '有效干预对话量',
      dataIndex: 'validInterventionDialogs',
      key: 'validInterventionDialogs',
      width: 140,
      align: 'center',
      render: (value: number, record, index) => {
        if (record.isSummary) {
          return <div style={{ textAlign: 'center' }}>{value}</div>
        }
        return (
          <InputNumber
            min={0}
            value={value}
            onChange={(val) => handleUpdate(index, 'validInterventionDialogs', val || 0)}
            style={{ width: '100%', textAlign: 'center' }}
            bordered={false}
            controls={false}
          />
        )
      },
    },
    {
      title: '干预对话率',
      dataIndex: 'interventionDialogRate',
      key: 'interventionDialogRate',
      width: 110,
      align: 'center',
      render: (text: string) => (
        <div style={{ color: text === '0%' ? '#999' : 'inherit', textAlign: 'center' }}>
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
      render: (value: number, record, index) => {
        if (record.isSummary) {
          return <div style={{ textAlign: 'center' }}>{value}</div>
        }
        return (
          <InputNumber
            min={0}
            value={value}
            onChange={(val) => handleUpdate(index, 'chatOutput', val || 0)}
            style={{ width: '100%', textAlign: 'center' }}
            bordered={false}
            controls={false}
          />
        )
      },
    },
    {
      title: '聊出率',
      dataIndex: 'chatOutputRate',
      key: 'chatOutputRate',
      width: 100,
      align: 'center',
      render: (text: string) => (
        <div style={{ color: text === '0%' ? '#999' : 'inherit', textAlign: 'center' }}>
          {text}
        </div>
      ),
    },
  ]

  // 保存数据
  const handleSave = async () => {
    try {
      setSaving(true)
      
      // 准备保存的数据
      const records = dataSource
        .filter(item => !item.isSummary) // 排除汇总行
        .map(item => {
          // 解析日期字符串 "1月15日" -> Date对象
          const dayMatch = item.date.match(/(\d+)月(\d+)日/)
          let dateStr = ''
          if (dayMatch) {
            const dayNum = parseInt(dayMatch[2])
            // 使用传入的 year 和 month 参数构建日期
            const yearNum = parseInt(year)
            const monthNum = parseInt(month)
            // 格式化为 YYYY-MM-DD
            dateStr = `${yearNum}-${String(monthNum).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
          }
          
          return {
            日期: dateStr,
            星期: item.weekDay,
            班次: item.shift || '',
            网聊姓名: item.employeeName,
            进线量: item.incomingCalls,
            总对话: item.totalDialogs,
            无效对话量: item.invalidDialogs,
            有效干预对话量: item.validInterventionDialogs,
            聊出量: item.chatOutput,
            是否汇总: 0,
          }
        })
      
      // 调用API保存数据
      const response = await fetch('/api/v1/market/network-consultant/group-b/batch', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          year: parseInt(year),
          month: parseInt(month),
          records: records
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || '保存失败')
      }
      
      const result = await response.json()
      message.success(result.message || 'B组数据保存成功！')
      
      // 保存成功后重新计算汇总
      setDataSource(prev => calculateSummary([...prev]))
    } catch (error) {
      console.error('保存失败:', error)
      message.error(error instanceof Error ? error.message : '保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  // 刷新数据
  const handleRefresh = () => {
    message.info('正在刷新数据...')
    loadDataFromDatabase()
  }

  return (
    <div>
      <style>{`
        .ant-input-number-input {
          text-align: center !important;
        }
        .ant-table-cell {
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
      
      <Space style={{ marginBottom: 16 }}>
        <Button 
          type="primary" 
          icon={<SaveOutlined />} 
          onClick={handleSave}
          loading={saving}
        >
          保存数据
        </Button>
        <Button 
          icon={<TeamOutlined />} 
          onClick={() => setEmployeeConfigVisible(true)}
        >
          配置人员
        </Button>
        <Button 
          icon={<SyncOutlined />} 
          onClick={syncChatOutputFromConsultation}
          loading={syncingChatOutput}
        >
          同步聊出量
        </Button>
        <Button 
          icon={<ReloadOutlined />} 
          onClick={handleRefresh}
        >
          刷新
        </Button>
      </Space>

      <Table
        columns={columns}
        dataSource={dataSource}
        rowKey={(record) => record.key}
        pagination={false}
        bordered
        size="small"
        scroll={{ y: 600 }}
        loading={loading}
      />

      <EmployeeConfigModal
        visible={employeeConfigVisible}
        onCancel={() => setEmployeeConfigVisible(false)}
        onConfirm={saveEmployeeConfig}
        year={year}
        month={month}
        group="B"
        currentEmployees={configuredEmployees}
      />

      <Modal
        title="编辑数据"
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false)
          setEditingRecord(null)
          editForm.resetFields()
        }}
        onOk={handleEditSave}
        width={800}
        okText="保存"
        cancelText="取消"
        bodyStyle={{ maxHeight: '70vh', overflowY: 'auto' }}
      >
        <Form
          form={editForm}
          layout="vertical"
          style={{ marginTop: 10 }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Form.Item label="日期" style={{ marginBottom: 12 }}>
              <Input disabled value={editingRecord?.date} />
            </Form.Item>
            
            <Form.Item label="星期" style={{ marginBottom: 12 }}>
              <Input disabled value={editingRecord?.weekDay} />
            </Form.Item>

            <Form.Item
              label="班次"
              name="shift"
              style={{ marginBottom: 12 }}
            >
              <Select>
                <Select.Option value="">请选择</Select.Option>
                <Select.Option value="早班">早班</Select.Option>
                <Select.Option value="晚班">晚班</Select.Option>
                <Select.Option value="全体">全体</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="网聊姓名"
              name="employeeName"
              rules={[{ required: true, message: '请输入网聊姓名' }]}
              style={{ marginBottom: 12 }}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="进线量"
              name="incomingCalls"
              rules={[{ required: true, message: '请输入进线量' }]}
              style={{ marginBottom: 12 }}
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              label="总对话"
              name="totalDialogs"
              rules={[{ required: true, message: '请输入总对话' }]}
              style={{ marginBottom: 12 }}
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              label="无效对话量"
              name="invalidDialogs"
              rules={[{ required: true, message: '请输入无效对话量' }]}
              style={{ marginBottom: 12 }}
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              label="有效对话量"
              dependencies={['totalDialogs', 'invalidDialogs']}
              style={{ marginBottom: 12 }}
            >
              {({ getFieldValue }) => {
                const totalDialogs = getFieldValue('totalDialogs') || 0
                const invalidDialogs = getFieldValue('invalidDialogs') || 0
                const validDialogs = totalDialogs - invalidDialogs
                return <Input disabled value={validDialogs} />
              }}
            </Form.Item>

            <Form.Item
              label="有效干预对话量"
              name="validInterventionDialogs"
              rules={[{ required: true, message: '请输入有效干预对话量' }]}
              style={{ marginBottom: 12 }}
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              label="聊出量"
              name="chatOutput"
              rules={[{ required: true, message: '请输入聊出量' }]}
              style={{ marginBottom: 12 }}
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  )
}

export default GroupBChatRateTab
