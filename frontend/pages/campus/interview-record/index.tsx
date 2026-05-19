/**
 * 访谈记录表页面
 * 学员访谈情况表 - 包含基础信息和动态月份列
 */

import React, { useState, useEffect, useMemo } from 'react'
import { App,
  Card,
  Table,
  Button,
  Space,
  Input,
  Modal,
  Form,
  DatePicker,
  Select,
  Row,
  Col,
  Tabs,
} from 'antd'
import {
  ReloadOutlined,
  DownloadOutlined,
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useCampusStore } from '@/stores/campusStore'
import dayjs, { Dayjs } from 'dayjs'

const { Option } = Select
const { TextArea } = Input

// 学员访谈记录接口
interface StudentInterviewRecord {
  key: string
  serialNumber: number // 序号
  name: string // 姓名
  consultant: string // 咨询师
  education: string // 学历
  hometown: string // 籍贯
  enrollmentDate: string // 入学时间 (YYYY-MM-DD)
  [monthKey: string]: string | number // 动态月份列，如 '2022年10月': '10.24学生说上课能听懂老...'
}

// 家长访谈记录接口（只有序号和姓名）
interface ParentInterviewRecord {
  key: string
  serialNumber: number // 序号
  name: string // 姓名
  [monthKey: string]: string | number // 动态月份列，如 '2022年10月': '9.28跟...'
}

// 毕业生访谈记录接口
interface GraduateInterviewRecord {
  key: string
  serialNumber: number // 序号
  name: string // 姓名
  className: string // 班级
  consultant: string // 咨询师
  education: string // 学历
  hometown: string // 籍贯
  enrollmentDate: string // 入学时间 (YYYY-MM-DD)
  [monthKey: string]: string | number // 动态月份列，如 '2022年10月': '10.24学生说上课能听懂老...'
}

// 学员访谈模拟数据
const studentMockData: StudentInterviewRecord[] = [
  {
    key: '1',
    serialNumber: 1,
    name: '赵文波',
    consultant: '石军芳',
    education: '初中毕业',
    hometown: '邯郸鸡泽',
    enrollmentDate: '2022-10-07',
    '2022年10月': '10.24学生说上课能听懂老师讲课，学习积极性较高',
    '2022年11月': '11.5学生反馈学习进度良好，对课程内容理解深入',
    '2022年12月': '12.10学生表示学习状态稳定，积极参与课堂互动',
    '2023年1月': '1.15学生反映学习效果显著，准备参加项目实战',
  },
]

// 家长访谈模拟数据（只有序号和姓名）
const parentMockData: ParentInterviewRecord[] = [
  {
    key: '1',
    serialNumber: 1,
    name: '赵文波',
    '2022年9月': '9.28跟',
    '2022年10月': '10.15家长反馈孩子学习状态良好，对学校教学很满意',
    '2022年11月': '11.8家长咨询孩子学习情况，希望了解课程进度',
    '2022年12月': '12.20家长表示孩子学习积极性提高，感谢老师指导',
  },
]

// 毕业生访谈模拟数据
const graduateMockData: GraduateInterviewRecord[] = [
  {
    key: '1',
    serialNumber: 1,
    name: '赵文波',
    className: '',
    consultant: '石军芳',
    education: '初中毕业',
    hometown: '邯郸鸡泽',
    enrollmentDate: '2022-10-07',
    '2022年10月': '10.24学生说上课能听懂老',
    '2023年6月': '6.15毕业生反馈已找到工作，薪资8000元，对学校表示感谢',
    '2023年7月': '7.5毕业生分享工作经历，表示学校课程对工作帮助很大',
    '2023年8月': '8.10毕业生回访，工作稳定，计划继续深造学习',
  },
]

const InterviewRecordPage: React.FC = () => {
  const { message, modal } = App.useApp()
  const { currentCampus, getAllCampuses, setCampus } = useCampusStore()
  const campuses = getAllCampuses()
  const [selectedCampus, setSelectedCampus] = useState<string>(currentCampus || '')
  const [activeTab, setActiveTab] = useState<string>('student')

  // 学员访谈数据
  const [studentDataSource, setStudentDataSource] =
    useState<StudentInterviewRecord[]>(studentMockData)
  const [studentSearchText, setStudentSearchText] = useState('')

  // 家长访谈数据
  const [parentDataSource, setParentDataSource] = useState<ParentInterviewRecord[]>(parentMockData)
  const [parentSearchText, setParentSearchText] = useState('')

  // 毕业生访谈数据
  const [graduateDataSource, setGraduateDataSource] =
    useState<GraduateInterviewRecord[]>(graduateMockData)
  const [graduateSearchText, setGraduateSearchText] = useState('')

  const [modalVisible, setModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<
    StudentInterviewRecord | ParentInterviewRecord | GraduateInterviewRecord | null
  >(null)
  const [editingMonth, setEditingMonth] = useState<string>('')
  const [editingType, setEditingType] = useState<'student' | 'parent' | 'graduate'>('student')
  const [form] = Form.useForm()

  // 根据当前标签获取对应的数据源
  const getCurrentDataSource = () => {
    switch (activeTab) {
      case 'student':
        return studentDataSource
      case 'parent':
        return parentDataSource
      case 'graduate':
        return graduateDataSource
      default:
        return studentDataSource
    }
  }

  // 根据当前标签设置对应的数据源
  const setCurrentDataSource = (
    data: StudentInterviewRecord[] | ParentInterviewRecord[] | GraduateInterviewRecord[],
  ) => {
    switch (activeTab) {
      case 'student':
        setStudentDataSource(data as StudentInterviewRecord[])
        break
      case 'parent':
        setParentDataSource(data as ParentInterviewRecord[])
        break
      case 'graduate':
        setGraduateDataSource(data as GraduateInterviewRecord[])
        break
    }
  }

  // 根据当前标签获取对应的搜索文本
  const getCurrentSearchText = () => {
    switch (activeTab) {
      case 'student':
        return studentSearchText
      case 'parent':
        return parentSearchText
      case 'graduate':
        return graduateSearchText
      default:
        return studentSearchText
    }
  }

  // 根据当前标签设置对应的搜索文本
  const setCurrentSearchText = (text: string) => {
    switch (activeTab) {
      case 'student':
        setStudentSearchText(text)
        break
      case 'parent':
        setParentSearchText(text)
        break
      case 'graduate':
        setGraduateSearchText(text)
        break
    }
  }

  // 当神殿改变时，更新全局store
  useEffect(() => {
    if (selectedCampus) {
      setCampus(selectedCampus)
    }
  }, [selectedCampus, setCampus])

  // 当全局神殿改变时，更新本地神殿
  useEffect(() => {
    if (currentCampus) {
      setSelectedCampus(currentCampus)
    }
  }, [currentCampus])

  // 神殿切换处理
  const handleCampusChange = (value: string) => {
    setSelectedCampus(value)
    setCampus(value)
  }

  // 搜索过滤
  const getFilteredData = () => {
    const dataSource = getCurrentDataSource()
    const searchText = getCurrentSearchText()

    if (activeTab === 'parent') {
      // 家长访谈只搜索姓名
      return dataSource.filter((item) =>
        (item as ParentInterviewRecord).name.toLowerCase().includes(searchText.toLowerCase()),
      )
    } else if (activeTab === 'graduate') {
      // 毕业生访谈搜索所有字段
      return dataSource.filter((item) => {
        const record = item as GraduateInterviewRecord
        return (
          record.name.toLowerCase().includes(searchText.toLowerCase()) ||
          record.className.toLowerCase().includes(searchText.toLowerCase()) ||
          record.consultant.toLowerCase().includes(searchText.toLowerCase()) ||
          record.education.toLowerCase().includes(searchText.toLowerCase()) ||
          record.hometown.toLowerCase().includes(searchText.toLowerCase())
        )
      })
    } else {
      // 学员访谈搜索所有字段
      return dataSource.filter((item) => {
        const record = item as StudentInterviewRecord
        return (
          record.name.toLowerCase().includes(searchText.toLowerCase()) ||
          record.consultant.toLowerCase().includes(searchText.toLowerCase()) ||
          record.education.toLowerCase().includes(searchText.toLowerCase()) ||
          record.hometown.toLowerCase().includes(searchText.toLowerCase())
        )
      })
    }
  }

  const filteredStudentData = studentDataSource.filter((record) => {
    const keyword = studentSearchText.toLowerCase()
    return (
      record.name.toLowerCase().includes(keyword) ||
      record.consultant.toLowerCase().includes(keyword) ||
      record.education.toLowerCase().includes(keyword) ||
      record.hometown.toLowerCase().includes(keyword)
    )
  })

  const filteredParentData = parentDataSource.filter((record) =>
    record.name.toLowerCase().includes(parentSearchText.toLowerCase()),
  )

  const filteredGraduateData = graduateDataSource.filter((record) => {
    const keyword = graduateSearchText.toLowerCase()
    return (
      record.name.toLowerCase().includes(keyword) ||
      record.className.toLowerCase().includes(keyword) ||
      record.consultant.toLowerCase().includes(keyword) ||
      record.education.toLowerCase().includes(keyword) ||
      record.hometown.toLowerCase().includes(keyword)
    )
  })

  // 获取所有出现的月份（从入学时间开始，往前推12个月或往后推12个月）
  const getMonthColumns = useMemo(() => {
    const months = new Set<string>()
    const dataSource = getCurrentDataSource()

    // 从所有记录中提取月份
    dataSource.forEach((record) => {
      Object.keys(record).forEach((key) => {
        if (key.match(/^\d{4}年\d{1,2}月$/)) {
          months.add(key)
        }
      })
    })

    // 如果没有月份，默认显示最近12个月
    if (months.size === 0) {
      const now = dayjs()
      for (let i = 0; i < 12; i++) {
        const month = now.subtract(i, 'month')
        months.add(month.format('YYYY年M月'))
      }
    }

    // 按时间排序（从早到晚）
    return Array.from(months).sort((a, b) => {
      const dateA = dayjs(a.replace(/年|月/g, '-'), 'YYYY-M')
      const dateB = dayjs(b.replace(/年|月/g, '-'), 'YYYY-M')
      return dateA.isBefore(dateB) ? -1 : 1
    })
  }, [activeTab, studentDataSource, parentDataSource, graduateDataSource])

  // 新增记录
  const handleAdd = () => {
    setEditingRecord(null)
    setEditingMonth('')
    setEditingType(activeTab as 'student' | 'parent' | 'graduate')
    form.resetFields()
    setModalVisible(true)
  }

  // 编辑基础信息
  const handleEditBasicInfo = (
    record: StudentInterviewRecord | ParentInterviewRecord | GraduateInterviewRecord,
  ) => {
    setEditingRecord(record)
    setEditingMonth('')
    setEditingType(activeTab as 'student' | 'parent' | 'graduate')

    if (activeTab === 'parent') {
      // 家长访谈只有姓名
      form.setFieldsValue({
        name: record.name,
      })
    } else if (activeTab === 'graduate') {
      // 毕业生访谈
      const gradRecord = record as GraduateInterviewRecord
      form.setFieldsValue({
        name: gradRecord.name,
        className: gradRecord.className,
        consultant: gradRecord.consultant,
        education: gradRecord.education,
        hometown: gradRecord.hometown,
        enrollmentDate: gradRecord.enrollmentDate ? dayjs(gradRecord.enrollmentDate) : null,
      })
    } else {
      // 学员访谈
      const studentRecord = record as StudentInterviewRecord
      form.setFieldsValue({
        name: studentRecord.name,
        consultant: studentRecord.consultant,
        education: studentRecord.education,
        hometown: studentRecord.hometown,
        enrollmentDate: studentRecord.enrollmentDate ? dayjs(studentRecord.enrollmentDate) : null,
      })
    }
    setModalVisible(true)
  }

  // 编辑月份记录
  const handleEditMonth = (
    record: StudentInterviewRecord | ParentInterviewRecord | GraduateInterviewRecord,
    month: string,
  ) => {
    setEditingRecord(record)
    setEditingMonth(month)
    setEditingType(activeTab as 'student' | 'parent' | 'graduate')
    form.setFieldsValue({
      monthContent: record[month] || '',
    })
    setModalVisible(true)
  }

  // 删除记录
  const handleDelete = (key: string) => {
    modal.confirm({
      title: '确认删除',
      content: '确定要删除这条记录吗？',
      onOk: () => {
        const dataSource = getCurrentDataSource()
        setCurrentDataSource(dataSource.filter((item) => item.key !== key))
        message.success('删除成功')
      },
    })
  }

  // 删除月份记录
  const handleDeleteMonth = (
    record: StudentInterviewRecord | ParentInterviewRecord | GraduateInterviewRecord,
    month: string,
  ) => {
    modal.confirm({
      title: '确认删除',
      content: `确定要删除${month}的记录吗？`,
      onOk: () => {
        const dataSource = getCurrentDataSource()
        setCurrentDataSource(
          dataSource.map((item) => {
            if (item.key === record.key) {
              const updated = { ...item }
              delete updated[month]
              return updated
            }
            return item
          }),
        )
        message.success('删除成功')
      },
    })
  }

  // 保存记录
  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      const dataSource = getCurrentDataSource()

      if (editingMonth) {
        // 编辑月份记录
        if (editingRecord) {
          setCurrentDataSource(
            dataSource.map((item) =>
              item.key === editingRecord.key
                ? {
                    ...item,
                    [editingMonth]: values.monthContent || '',
                  }
                : item,
            ),
          )
          message.success('更新成功')
        }
      } else {
        // 编辑基础信息或新增记录
        const enrollmentDate = values.enrollmentDate
          ? dayjs(values.enrollmentDate).format('YYYY-MM-DD')
          : ''

        if (editingRecord) {
          // 更新记录
          setCurrentDataSource(
            dataSource.map((item) =>
              item.key === editingRecord.key
                ? {
                    ...item,
                    name: values.name,
                    consultant: values.consultant,
                    education: values.education,
                    hometown: values.hometown,
                    enrollmentDate,
                  }
                : item,
            ),
          )
          message.success('更新成功')
        } else {
          // 新增记录
          if (editingType === 'parent') {
            // 家长访谈只有姓名
            const newRecord: ParentInterviewRecord = {
              key: `record-${Date.now()}`,
              serialNumber: dataSource.length + 1,
              name: values.name,
            }
            setCurrentDataSource([...dataSource, newRecord])
          } else if (editingType === 'graduate') {
            // 毕业生访谈
            const newRecord: GraduateInterviewRecord = {
              key: `record-${Date.now()}`,
              serialNumber: dataSource.length + 1,
              name: values.name,
              className: values.className || '',
              consultant: values.consultant,
              education: values.education,
              hometown: values.hometown,
              enrollmentDate,
            }
            setCurrentDataSource([...dataSource, newRecord])
          } else {
            // 学员访谈
            const newRecord: StudentInterviewRecord = {
              key: `record-${Date.now()}`,
              serialNumber: dataSource.length + 1,
              name: values.name,
              consultant: values.consultant,
              education: values.education,
              hometown: values.hometown,
              enrollmentDate,
            }
            setCurrentDataSource([...dataSource, newRecord])
          }
          message.success('新增成功')
        }
      }

      setModalVisible(false)
      form.resetFields()
      setEditingRecord(null)
      setEditingMonth('')
    } catch (error) {
      console.error('Validation failed:', error)
    }
  }

  // 导出数据
  const handleExport = () => {
    message.info('导出功能开发中')
  }

  // 学员访谈表格列定义
  const studentColumns: ColumnsType<StudentInterviewRecord> = useMemo(() => {
    const dataSource = studentDataSource
    const baseColumns: ColumnsType<StudentInterviewRecord> = [
      {
        title: '序号',
        dataIndex: 'serialNumber',
        key: 'serialNumber',
        width: 80,
        align: 'center',
        fixed: 'left',
      },
      {
        title: '姓名',
        dataIndex: 'name',
        key: 'name',
        width: 120,
        align: 'center',
        fixed: 'left',
        render: (text: string, record: StudentInterviewRecord) => (
          <div
            style={{
              padding: '4px',
              minHeight: '32px',
              cursor: 'pointer',
              border: '1px solid transparent',
            }}
            onClick={() => handleEditBasicInfo(record)}
            onMouseEnter={(e) => {
              e.currentTarget.style.border = '1px solid #1890ff'
              e.currentTarget.style.backgroundColor = '#f0f9ff'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.border = '1px solid transparent'
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            {text || '点击编辑'}
          </div>
        ),
      },
      {
        title: '咨询师',
        dataIndex: 'consultant',
        key: 'consultant',
        width: 120,
        align: 'center',
        render: (text: string, record: StudentInterviewRecord) => (
          <div
            style={{
              padding: '4px',
              minHeight: '32px',
              cursor: 'pointer',
              border: '1px solid transparent',
            }}
            onClick={() => handleEditBasicInfo(record)}
            onMouseEnter={(e) => {
              e.currentTarget.style.border = '1px solid #1890ff'
              e.currentTarget.style.backgroundColor = '#f0f9ff'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.border = '1px solid transparent'
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            {text || '点击编辑'}
          </div>
        ),
      },
      {
        title: '学历',
        dataIndex: 'education',
        key: 'education',
        width: 120,
        align: 'center',
        render: (text: string, record: StudentInterviewRecord) => (
          <div
            style={{
              padding: '4px',
              minHeight: '32px',
              cursor: 'pointer',
              border: '1px solid transparent',
            }}
            onClick={() => handleEditBasicInfo(record)}
            onMouseEnter={(e) => {
              e.currentTarget.style.border = '1px solid #1890ff'
              e.currentTarget.style.backgroundColor = '#f0f9ff'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.border = '1px solid transparent'
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            {text || '点击编辑'}
          </div>
        ),
      },
      {
        title: '籍贯',
        dataIndex: 'hometown',
        key: 'hometown',
        width: 150,
        align: 'center',
        render: (text: string, record: StudentInterviewRecord) => (
          <div
            style={{
              padding: '4px',
              minHeight: '32px',
              cursor: 'pointer',
              border: '1px solid transparent',
            }}
            onClick={() => handleEditBasicInfo(record)}
            onMouseEnter={(e) => {
              e.currentTarget.style.border = '1px solid #1890ff'
              e.currentTarget.style.backgroundColor = '#f0f9ff'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.border = '1px solid transparent'
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            {text || '点击编辑'}
          </div>
        ),
      },
      {
        title: '入学时间',
        dataIndex: 'enrollmentDate',
        key: 'enrollmentDate',
        width: 120,
        align: 'center',
        render: (text: string, record: StudentInterviewRecord) => {
          const formattedDate = text ? dayjs(text).format('YYYY.M.D') : ''
          return (
            <div
              style={{
                padding: '4px',
                minHeight: '32px',
                cursor: 'pointer',
                border: '1px solid transparent',
              }}
              onClick={() => handleEditBasicInfo(record)}
              onMouseEnter={(e) => {
                e.currentTarget.style.border = '1px solid #1890ff'
                e.currentTarget.style.backgroundColor = '#f0f9ff'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.border = '1px solid transparent'
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              {formattedDate || '点击编辑'}
            </div>
          )
        },
      },
    ]

    // 动态月份列
    const monthColumns: ColumnsType<StudentInterviewRecord> = getMonthColumns.map((month) => ({
      title: month,
      key: month,
      dataIndex: month,
      width: 200,
      align: 'center',
      render: (text: string, record: StudentInterviewRecord) => (
        <div style={{ position: 'relative', paddingRight: text ? '60px' : '0' }}>
          <div
            style={{
              padding: '4px',
              minHeight: '32px',
              cursor: 'pointer',
              border: '1px solid transparent',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
            onClick={() => handleEditMonth(record, month)}
            onMouseEnter={(e) => {
              e.currentTarget.style.border = '1px solid #1890ff'
              e.currentTarget.style.backgroundColor = '#f0f9ff'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.border = '1px solid transparent'
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            {text || '点击编辑'}
          </div>
          {text && (
            <Button
              type="link"
              danger
              size="small"
              icon={<DeleteOutlined />}
              style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                padding: '2px 4px',
                fontSize: '12px',
                zIndex: 10,
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
              }}
              onClick={(e) => {
                e.stopPropagation()
                handleDeleteMonth(record, month)
              }}
            >
              删除
            </Button>
          )}
        </div>
      ),
    }))

    // 操作列（删除整条记录）
    const actionColumn: ColumnsType<StudentInterviewRecord> = [
      {
        title: '操作',
        key: 'action',
        width: 100,
        align: 'center',
        fixed: 'right',
        render: (_, record: StudentInterviewRecord) => (
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.key)}
          >
            删除
          </Button>
        ),
      },
    ]

    return [...baseColumns, ...monthColumns, ...actionColumn]
  }, [getMonthColumns, studentDataSource])

  // 家长访谈表格列定义（只有序号和姓名）
  const parentColumns: ColumnsType<ParentInterviewRecord> = useMemo(() => {
    const dataSource = parentDataSource
    const baseColumns: ColumnsType<ParentInterviewRecord> = [
      {
        title: '序号',
        dataIndex: 'serialNumber',
        key: 'serialNumber',
        width: 80,
        align: 'center',
        fixed: 'left',
      },
      {
        title: '姓名',
        dataIndex: 'name',
        key: 'name',
        width: 120,
        align: 'center',
        fixed: 'left',
        render: (text: string, record: ParentInterviewRecord) => (
          <div
            style={{
              padding: '4px',
              minHeight: '32px',
              cursor: 'pointer',
              border: '1px solid transparent',
            }}
            onClick={() => handleEditBasicInfo(record)}
            onMouseEnter={(e) => {
              e.currentTarget.style.border = '1px solid #1890ff'
              e.currentTarget.style.backgroundColor = '#f0f9ff'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.border = '1px solid transparent'
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            {text || '点击编辑'}
          </div>
        ),
      },
    ]

    // 动态月份列
    const monthColumns: ColumnsType<ParentInterviewRecord> = getMonthColumns.map((month) => ({
      title: month,
      key: month,
      dataIndex: month,
      width: 200,
      align: 'center',
      render: (text: string, record: ParentInterviewRecord) => (
        <div style={{ position: 'relative', paddingRight: text ? '60px' : '0' }}>
          <div
            style={{
              padding: '4px',
              minHeight: '32px',
              cursor: 'pointer',
              border: '1px solid transparent',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
            onClick={() => handleEditMonth(record, month)}
            onMouseEnter={(e) => {
              e.currentTarget.style.border = '1px solid #1890ff'
              e.currentTarget.style.backgroundColor = '#f0f9ff'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.border = '1px solid transparent'
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            {text || '点击编辑'}
          </div>
          {text && (
            <Button
              type="link"
              danger
              size="small"
              icon={<DeleteOutlined />}
              style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                padding: '2px 4px',
                fontSize: '12px',
                zIndex: 10,
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
              }}
              onClick={(e) => {
                e.stopPropagation()
                handleDeleteMonth(record, month)
              }}
            >
              删除
            </Button>
          )}
        </div>
      ),
    }))

    // 操作列（删除整条记录）
    const actionColumn: ColumnsType<ParentInterviewRecord> = [
      {
        title: '操作',
        key: 'action',
        width: 100,
        align: 'center',
        fixed: 'right',
        render: (_, record: ParentInterviewRecord) => (
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.key)}
          >
            删除
          </Button>
        ),
      },
    ]

    return [...baseColumns, ...monthColumns, ...actionColumn]
  }, [getMonthColumns, parentDataSource])

  // 毕业生访谈表格列定义
  const graduateColumns: ColumnsType<GraduateInterviewRecord> = useMemo(() => {
    const dataSource = graduateDataSource
    const baseColumns: ColumnsType<GraduateInterviewRecord> = [
      {
        title: '序号',
        dataIndex: 'serialNumber',
        key: 'serialNumber',
        width: 80,
        align: 'center',
        fixed: 'left',
      },
      {
        title: '姓名',
        dataIndex: 'name',
        key: 'name',
        width: 120,
        align: 'center',
        fixed: 'left',
        render: (text: string, record: GraduateInterviewRecord) => (
          <div
            style={{
              padding: '4px',
              minHeight: '32px',
              cursor: 'pointer',
              border: '1px solid transparent',
            }}
            onClick={() => handleEditBasicInfo(record)}
            onMouseEnter={(e) => {
              e.currentTarget.style.border = '1px solid #1890ff'
              e.currentTarget.style.backgroundColor = '#f0f9ff'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.border = '1px solid transparent'
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            {text || '点击编辑'}
          </div>
        ),
      },
      {
        title: '班级',
        dataIndex: 'className',
        key: 'className',
        width: 150,
        align: 'center',
        render: (text: string, record: GraduateInterviewRecord) => (
          <div
            style={{
              padding: '4px',
              minHeight: '32px',
              cursor: 'pointer',
              border: '1px solid transparent',
            }}
            onClick={() => handleEditBasicInfo(record)}
            onMouseEnter={(e) => {
              e.currentTarget.style.border = '1px solid #1890ff'
              e.currentTarget.style.backgroundColor = '#f0f9ff'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.border = '1px solid transparent'
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            {text || '点击编辑'}
          </div>
        ),
      },
      {
        title: '咨询师',
        dataIndex: 'consultant',
        key: 'consultant',
        width: 120,
        align: 'center',
        render: (text: string, record: GraduateInterviewRecord) => (
          <div
            style={{
              padding: '4px',
              minHeight: '32px',
              cursor: 'pointer',
              border: '1px solid transparent',
            }}
            onClick={() => handleEditBasicInfo(record)}
            onMouseEnter={(e) => {
              e.currentTarget.style.border = '1px solid #1890ff'
              e.currentTarget.style.backgroundColor = '#f0f9ff'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.border = '1px solid transparent'
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            {text || '点击编辑'}
          </div>
        ),
      },
      {
        title: '学历',
        dataIndex: 'education',
        key: 'education',
        width: 120,
        align: 'center',
        render: (text: string, record: GraduateInterviewRecord) => (
          <div
            style={{
              padding: '4px',
              minHeight: '32px',
              cursor: 'pointer',
              border: '1px solid transparent',
            }}
            onClick={() => handleEditBasicInfo(record)}
            onMouseEnter={(e) => {
              e.currentTarget.style.border = '1px solid #1890ff'
              e.currentTarget.style.backgroundColor = '#f0f9ff'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.border = '1px solid transparent'
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            {text || '点击编辑'}
          </div>
        ),
      },
      {
        title: '籍贯',
        dataIndex: 'hometown',
        key: 'hometown',
        width: 150,
        align: 'center',
        render: (text: string, record: GraduateInterviewRecord) => (
          <div
            style={{
              padding: '4px',
              minHeight: '32px',
              cursor: 'pointer',
              border: '1px solid transparent',
            }}
            onClick={() => handleEditBasicInfo(record)}
            onMouseEnter={(e) => {
              e.currentTarget.style.border = '1px solid #1890ff'
              e.currentTarget.style.backgroundColor = '#f0f9ff'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.border = '1px solid transparent'
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            {text || '点击编辑'}
          </div>
        ),
      },
      {
        title: '入学时间',
        dataIndex: 'enrollmentDate',
        key: 'enrollmentDate',
        width: 120,
        align: 'center',
        render: (text: string, record: GraduateInterviewRecord) => {
          const formattedDate = text ? dayjs(text).format('YYYY.M.D') : ''
          return (
            <div
              style={{
                padding: '4px',
                minHeight: '32px',
                cursor: 'pointer',
                border: '1px solid transparent',
              }}
              onClick={() => handleEditBasicInfo(record)}
              onMouseEnter={(e) => {
                e.currentTarget.style.border = '1px solid #1890ff'
                e.currentTarget.style.backgroundColor = '#f0f9ff'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.border = '1px solid transparent'
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              {formattedDate || '点击编辑'}
            </div>
          )
        },
      },
    ]

    // 动态月份列
    const monthColumns: ColumnsType<GraduateInterviewRecord> = getMonthColumns.map((month) => ({
      title: month,
      key: month,
      dataIndex: month,
      width: 200,
      align: 'center',
      render: (text: string, record: GraduateInterviewRecord) => (
        <div style={{ position: 'relative', paddingRight: text ? '60px' : '0' }}>
          <div
            style={{
              padding: '4px',
              minHeight: '32px',
              cursor: 'pointer',
              border: '1px solid transparent',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
            onClick={() => handleEditMonth(record, month)}
            onMouseEnter={(e) => {
              e.currentTarget.style.border = '1px solid #1890ff'
              e.currentTarget.style.backgroundColor = '#f0f9ff'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.border = '1px solid transparent'
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            {text || '点击编辑'}
          </div>
          {text && (
            <Button
              type="link"
              danger
              size="small"
              icon={<DeleteOutlined />}
              style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                padding: '2px 4px',
                fontSize: '12px',
                zIndex: 10,
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
              }}
              onClick={(e) => {
                e.stopPropagation()
                handleDeleteMonth(record, month)
              }}
            >
              删除
            </Button>
          )}
        </div>
      ),
    }))

    // 操作列（删除整条记录）
    const actionColumn: ColumnsType<GraduateInterviewRecord> = [
      {
        title: '操作',
        key: 'action',
        width: 100,
        align: 'center',
        fixed: 'right',
        render: (_, record: GraduateInterviewRecord) => (
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.key)}
          >
            删除
          </Button>
        ),
      },
    ]

    return [...baseColumns, ...monthColumns, ...actionColumn]
  }, [getMonthColumns, graduateDataSource])

  // 根据当前标签获取对应的表格列
  const getCurrentColumns = () => {
    switch (activeTab) {
      case 'student':
        return studentColumns
      case 'parent':
        return parentColumns
      case 'graduate':
        return graduateColumns
      default:
        return studentColumns
    }
  }

  return (
    <div style={{ padding: 24 }}>
      {/* 页面标题 */}
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
        学员访谈情况表
      </div>

      <Card>
        {/* 表头信息 */}
        <Row
          gutter={16}
          style={{ marginBottom: 24, padding: 16, backgroundColor: '#f5f5f5', borderRadius: 8 }}
        >
          <Col span={4}>
            <strong>神殿名称：</strong>
            <Select
              value={selectedCampus}
              onChange={handleCampusChange}
              style={{ width: 150, marginLeft: 8 }}
            >
              {campuses.map((campus) => (
                <Option key={campus.id} value={campus.name}>
                  {campus.name}
                </Option>
              ))}
            </Select>
          </Col>
        </Row>

        {/* 标签栏 */}
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'student',
              label: '学员访谈',
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
                      <Input
                        placeholder="搜索姓名、咨询师、学历或籍贯"
                        prefix={<SearchOutlined />}
                        value={studentSearchText}
                        onChange={(e) => setStudentSearchText(e.target.value)}
                        style={{ width: 300 }}
                        allowClear
                      />
                    </Space>
                    <Space>
                      <Button icon={<ReloadOutlined />} onClick={() => setStudentSearchText('')}>
                        刷新
                      </Button>
                      <Button icon={<DownloadOutlined />} onClick={handleExport}>
                        导出
                      </Button>
                      <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                        新增记录
                      </Button>
                    </Space>
                  </div>

                  {/* 表格 */}
                  <Table
                    columns={studentColumns}
                    dataSource={filteredStudentData}
                    pagination={{
                      defaultPageSize: 10,
                      showSizeChanger: true,
                      showTotal: (total) => `共 ${total} 条记录`,
                    }}
                    bordered
                    scroll={{ x: 'max-content' }}
                  />
                </div>
              ),
            },
            {
              key: 'parent',
              label: '家长访谈',
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
                      <Input
                        placeholder="搜索姓名"
                        prefix={<SearchOutlined />}
                        value={parentSearchText}
                        onChange={(e) => setParentSearchText(e.target.value)}
                        style={{ width: 300 }}
                        allowClear
                      />
                    </Space>
                    <Space>
                      <Button icon={<ReloadOutlined />} onClick={() => setParentSearchText('')}>
                        刷新
                      </Button>
                      <Button icon={<DownloadOutlined />} onClick={handleExport}>
                        导出
                      </Button>
                      <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                        新增记录
                      </Button>
                    </Space>
                  </div>

                  {/* 表格 */}
                  <Table
                    columns={parentColumns}
                    dataSource={filteredParentData}
                    pagination={{
                      defaultPageSize: 10,
                      showSizeChanger: true,
                      showTotal: (total) => `共 ${total} 条记录`,
                    }}
                    bordered
                    scroll={{ x: 'max-content' }}
                  />
                </div>
              ),
            },
            {
              key: 'graduate',
              label: '毕业生访谈',
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
                      <Input
                        placeholder="搜索姓名、班级、咨询师、学历或籍贯"
                        prefix={<SearchOutlined />}
                        value={graduateSearchText}
                        onChange={(e) => setGraduateSearchText(e.target.value)}
                        style={{ width: 300 }}
                        allowClear
                      />
                    </Space>
                    <Space>
                      <Button icon={<ReloadOutlined />} onClick={() => setGraduateSearchText('')}>
                        刷新
                      </Button>
                      <Button icon={<DownloadOutlined />} onClick={handleExport}>
                        导出
                      </Button>
                      <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                        新增记录
                      </Button>
                    </Space>
                  </div>

                  {/* 表格 */}
                  <Table
                    columns={graduateColumns}
                    dataSource={filteredGraduateData}
                    pagination={{
                      defaultPageSize: 10,
                      showSizeChanger: true,
                      showTotal: (total) => `共 ${total} 条记录`,
                    }}
                    bordered
                    scroll={{ x: 'max-content' }}
                  />
                </div>
              ),
            },
          ]}
        />
      </Card>

      {/* 编辑模态框 */}
      <Modal
        title={editingMonth ? `编辑${editingMonth}记录` : editingRecord ? '编辑记录' : '新增记录'}
        open={modalVisible}
        onOk={handleSave}
        onCancel={() => {
          setModalVisible(false)
          form.resetFields()
          setEditingRecord(null)
          setEditingMonth('')
        }}
        width={800}
      >
        <Form form={form} layout="vertical">
          {editingMonth ? (
            // 编辑月份记录
            <Form.Item
              name="monthContent"
              label={`${editingMonth}访谈记录`}
              rules={[{ required: true, message: '请输入访谈记录内容' }]}
            >
              <TextArea
                rows={4}
                placeholder="请输入访谈记录内容，例如：10.24学生说上课能听懂老师讲课，学习积极性较高"
              />
            </Form.Item>
          ) : editingType === 'parent' ? (
            // 家长访谈只有姓名
            <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
              <Input placeholder="请输入姓名" />
            </Form.Item>
          ) : editingType === 'graduate' ? (
            // 毕业生访谈表单
            <>
              <Form.Item
                name="name"
                label="姓名"
                rules={[{ required: true, message: '请输入姓名' }]}
              >
                <Input placeholder="请输入姓名" />
              </Form.Item>
              <Form.Item name="className" label="班级">
                <Input placeholder="请输入班级" />
              </Form.Item>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="consultant"
                    label="咨询师"
                    rules={[{ required: true, message: '请输入咨询师' }]}
                  >
                    <Input placeholder="请输入咨询师" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="education"
                    label="学历"
                    rules={[{ required: true, message: '请输入学历' }]}
                  >
                    <Input placeholder="请输入学历，例如：初中毕业" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="hometown"
                    label="籍贯"
                    rules={[{ required: true, message: '请输入籍贯' }]}
                  >
                    <Input placeholder="请输入籍贯，例如：邯郸鸡泽" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="enrollmentDate"
                    label="入学时间"
                    rules={[{ required: true, message: '请选择入学时间' }]}
                  >
                    <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
                  </Form.Item>
                </Col>
              </Row>
            </>
          ) : (
            // 学员访谈表单
            <>
              <Form.Item
                name="name"
                label="姓名"
                rules={[{ required: true, message: '请输入姓名' }]}
              >
                <Input placeholder="请输入姓名" />
              </Form.Item>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="consultant"
                    label="咨询师"
                    rules={[{ required: true, message: '请输入咨询师' }]}
                  >
                    <Input placeholder="请输入咨询师" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="education"
                    label="学历"
                    rules={[{ required: true, message: '请输入学历' }]}
                  >
                    <Input placeholder="请输入学历，例如：初中毕业" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="hometown"
                    label="籍贯"
                    rules={[{ required: true, message: '请输入籍贯' }]}
                  >
                    <Input placeholder="请输入籍贯，例如：邯郸鸡泽" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="enrollmentDate"
                    label="入学时间"
                    rules={[{ required: true, message: '请选择入学时间' }]}
                  >
                    <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
                  </Form.Item>
                </Col>
              </Row>
            </>
          )}
        </Form>
      </Modal>
    </div>
  )
}

export default InterviewRecordPage
