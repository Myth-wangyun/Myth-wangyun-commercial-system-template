/**
 * 口碑招生计划与执行统计表页面
 * 格式：按日期横向展开的表格，包含访谈、活动、线上宣传三大部分
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
  InputNumber,
  Select,
  Row,
  Col,
} from 'antd'
import { ReloadOutlined, DownloadOutlined, EditOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useCampusStore } from '@/stores/campusStore'
import dayjs, { Dayjs } from 'dayjs'

const { Option } = Select
const { TextArea } = Input

// 每日数据接口
interface DailyData {
  [day: string]: string | number // 日期键值对，如 '1': '值'
}

// 表格行数据接口
interface ReputationWorkRecord {
  key: string
  category: string // 分类：访谈、活动、线上宣传
  event: string // 事件名称
  description: string // 详细内容
  [day: string]: string | number | DailyData // 动态日期列
}

const ReputationEnrollmentPlanStatisticsPage: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus, getAllCampuses, setCampus } = useCampusStore()
  const campuses = getAllCampuses()
  const [selectedCampus, setSelectedCampus] = useState<string>(currentCampus || '')
  const [selectedMonth, setSelectedMonth] = useState<Dayjs>(dayjs())
  const [homeroomTeacher, setHomeroomTeacher] = useState<string>('武泽芳')
  const [dataSource, setDataSource] = useState<ReputationWorkRecord[]>([])
  const [modalVisible, setModalVisible] = useState(false)
  const [editingCell, setEditingCell] = useState<{
    record: ReputationWorkRecord
    day: string
  } | null>(null)
  const [form] = Form.useForm()

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

  // 初始化数据
  useEffect(() => {
    initializeData()
  }, [selectedMonth])

  const initializeData = () => {
    const daysInMonth = selectedMonth.daysInMonth()
    const data: ReputationWorkRecord[] = [
      // 访谈部分
      {
        key: 'interview-new-count',
        category: '访谈',
        event: '访谈新生数量',
        description: '',
      },
      {
        key: 'interview-new-name',
        category: '访谈',
        event: '新生姓名',
        description: '',
      },
      {
        key: 'interview-new-record',
        category: '访谈',
        event: '是否填写访谈记录表',
        description: '',
      },
      {
        key: 'interview-old-count',
        category: '访谈',
        event: '访谈老生数量',
        description: '',
      },
      {
        key: 'interview-old-name',
        category: '访谈',
        event: '老生姓名',
        description: '',
      },
      {
        key: 'interview-old-record',
        category: '访谈',
        event: '是否填写访谈记录表',
        description: '',
      },
      {
        key: 'interview-graduate-count',
        category: '访谈',
        event: '访谈毕业生数量',
        description: '',
      },
      {
        key: 'interview-graduate-name',
        category: '访谈',
        event: '毕业生姓名',
        description: '',
      },
      {
        key: 'interview-graduate-record',
        category: '访谈',
        event: '是否填写访谈记录表',
        description: '',
      },
      {
        key: 'interview-parent-count',
        category: '访谈',
        event: '家长访谈数量',
        description: '',
      },
      {
        key: 'interview-parent-name',
        category: '访谈',
        event: '家长访谈姓名',
        description: '',
      },
      // 活动部分
      {
        key: 'activity-record',
        category: '活动',
        event: '是否填写活动记录表',
        description: '',
      },
      {
        key: 'activity-class',
        category: '活动',
        event: '活动班级/对象',
        description: '',
      },
      {
        key: 'activity-content',
        category: '活动',
        event: '活动内容',
        description: '',
      },
      {
        key: 'activity-publicity',
        category: '活动',
        event: '是否活动宣传',
        description: '',
      },
      // 线上宣传部分
      {
        key: 'online-wechat',
        category: '线上宣传',
        event: '朋友圈数量',
        description: '',
      },
      {
        key: 'online-douyin',
        category: '线上宣传',
        event: '抖音数量',
        description: '',
      },
      {
        key: 'online-kuaishou',
        category: '线上宣传',
        event: '快手数量',
        description: '',
      },
      {
        key: 'online-xiaohongshu',
        category: '线上宣传',
        event: '小红书数量',
        description: '',
      },
      // 当天合计
      {
        key: 'daily-total',
        category: '合计',
        event: '当天合计',
        description: '',
      },
    ]

    // 初始化所有日期列
    for (let day = 1; day <= daysInMonth; day++) {
      data.forEach((record) => {
        record[`day${day}`] = ''
      })
    }
    // 初始化合计列
    data.forEach((record) => {
      record.total = ''
    })

    // 设置示例数据（第8日和第9日）
    const setExampleData = (day: number, recordKey: string, value: string | number) => {
      const record = data.find((r) => r.key === recordKey)
      if (record) {
        record[`day${day}`] = value
      }
    }

    // 第8日数据
    setExampleData(8, 'interview-new-count', 1)
    setExampleData(8, 'interview-new-name', '武:常佩琪')
    setExampleData(8, 'interview-new-record', '是')
    setExampleData(8, 'interview-old-count', 6)
    setExampleData(
      8,
      'interview-old-name',
      '武:范方园、李翔宇; 袁:孙梓涵、周振宇; 娄:杨博文,李艺琳',
    )
    setExampleData(8, 'interview-old-record', '是')
    setExampleData(8, 'interview-graduate-count', 3)
    setExampleData(8, 'interview-graduate-name', '武:范家豪; 袁:卜一敏; 娄:崔晋豪')
    setExampleData(8, 'interview-graduate-record', '是')
    setExampleData(8, 'interview-parent-count', 4)
    setExampleData(
      8,
      'interview-parent-name',
      '武:唐泽霖妈妈、袁:孙颢爸爸、周振宇妈妈; 娄:罗均波妈妈',
    )
    setExampleData(8, 'activity-record', '是')
    setExampleData(8, 'activity-publicity', '是')
    setExampleData(8, 'online-wechat', 10)
    setExampleData(8, 'online-douyin', 4)
    setExampleData(8, 'online-kuaishou', 2)
    setExampleData(8, 'online-xiaohongshu', 1)
    setExampleData(8, 'daily-total', 17)

    // 第9日数据
    setExampleData(9, 'interview-new-count', 1)
    setExampleData(9, 'interview-new-name', '武:常佩琪')
    setExampleData(9, 'interview-new-record', '是')
    setExampleData(9, 'interview-old-count', 6)
    setExampleData(9, 'interview-old-name', '武杨程栋、贺囿凯; 袁:温灵慧、牛做; 娄:崔贤星、苏翰林')
    setExampleData(9, 'interview-old-record', '是')
    setExampleData(9, 'interview-graduate-count', 3)
    setExampleData(9, 'interview-graduate-name', '武:李国彪; 袁:白世杰; 娄:任圆凯')
    setExampleData(9, 'interview-graduate-record', '是')
    setExampleData(9, 'interview-parent-count', 4)
    setExampleData(
      9,
      'interview-parent-name',
      '武:贺囿凯妈妈、杨程栋妈妈; 袁:李依珂妈妈、郭钊妈妈; 娄:崔贤星妈妈、苏翰林妈妈',
    )
    setExampleData(9, 'activity-record', '是')
    setExampleData(9, 'activity-class', 'T003')
    setExampleData(9, 'activity-content', '励志文分享')
    setExampleData(9, 'activity-publicity', '是')
    setExampleData(9, 'online-wechat', 11)
    setExampleData(9, 'online-douyin', 2)
    setExampleData(9, 'online-kuaishou', 1)
    setExampleData(9, 'online-xiaohongshu', 1)
    setExampleData(9, 'daily-total', 15)

    setDataSource(data)
  }

  // 生成日期列和表格列定义
  const columns = useMemo(() => {
    const daysInMonth = selectedMonth.daysInMonth()
    const cols: ColumnsType<ReputationWorkRecord> = [
      {
        title: '事件',
        dataIndex: 'category',
        key: 'category',
        width: 120,
        fixed: 'left',
        align: 'center',
        render: (text: string, record: ReputationWorkRecord, index: number) => {
          // 只在每个类别的第一行显示类别名称
          const prevRecord = index > 0 ? dataSource[index - 1] : null
          const shouldShowCategory = !prevRecord || prevRecord.category !== record.category

          if (shouldShowCategory) {
            let color = '#666'
            if (record.category === '访谈') color = '#1890ff'
            else if (record.category === '活动') color = '#52c41a'
            else if (record.category === '线上宣传') color = '#faad14'
            else if (record.category === '合计') color = '#ff4d4f'

            // 计算该类别有多少行（从当前行开始计算）
            let sameCategoryCount = 1
            for (let i = index + 1; i < dataSource.length; i++) {
              if (dataSource[i].category === record.category) {
                sameCategoryCount++
              } else {
                break
              }
            }

            return {
              children: <div style={{ fontWeight: 'bold', color, padding: '8px' }}>{text}</div>,
              props: {
                rowSpan: sameCategoryCount,
              },
            }
          }

          return {
            children: null,
            props: {
              rowSpan: 0,
            },
          }
        },
      },
      {
        title: '详细内容',
        dataIndex: 'event',
        key: 'event',
        width: 200,
        fixed: 'left',
        render: (text: string, record: ReputationWorkRecord) => (
          <div
            style={{
              padding: '4px',
              minHeight: '32px',
              cursor: 'pointer',
              border: '1px solid transparent',
            }}
            onClick={() => {
              setEditingCell({ record, day: 'description' })
              form.setFieldsValue({
                value: text || '',
              })
              setModalVisible(true)
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.border = '1px solid #1890ff'
              e.currentTarget.style.backgroundColor = '#f0f9ff'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.border = '1px solid transparent'
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            {text || ''}
          </div>
        ),
      },
    ]

    // 添加日期列
    for (let day = 1; day <= daysInMonth; day++) {
      cols.push({
        title: `${day}`,
        dataIndex: `day${day}`,
        key: `day${day}`,
        width: 80,
        align: 'center',
        render: (text: string | number, record: ReputationWorkRecord) => {
          const value = text || ''
          return (
            <div
              style={{
                padding: '4px',
                minHeight: '32px',
                cursor: 'pointer',
                border: '1px solid transparent',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
              onClick={() => {
                setEditingCell({ record, day: `day${day}` })
                form.setFieldsValue({
                  value: value,
                })
                setModalVisible(true)
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.border = '1px solid #1890ff'
                e.currentTarget.style.backgroundColor = '#f0f9ff'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.border = '1px solid transparent'
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              {value || ''}
            </div>
          )
        },
      })
    }

    // 合计列
    cols.push({
      title: '合计',
      dataIndex: 'total',
      key: 'total',
      width: 100,
      align: 'center',
      render: (text: string | number, record: ReputationWorkRecord) => {
        let sum = 0
        for (let day = 1; day <= daysInMonth; day++) {
          const value = record[`day${day}`]
          if (typeof value === 'number') {
            sum += value
          } else if (typeof value === 'string' && !isNaN(Number(value)) && value !== '') {
            sum += Number(value)
          }
        }
        return sum > 0 ? sum : text || ''
      },
    })

    return cols
  }, [selectedMonth, form])

  // 保存编辑
  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      if (editingCell) {
        const { record, day } = editingCell
        const updatedData = dataSource.map((item) => {
          if (item.key === record.key) {
            return {
              ...item,
              [day]: values.value,
            }
          }
          return item
        })
        setDataSource(updatedData)
        message.success('保存成功')
      }
      setModalVisible(false)
      setEditingCell(null)
      form.resetFields()
    } catch (error) {
      console.error('Validation failed:', error)
    }
  }

  // 导出数据
  const handleExport = () => {
    message.info('导出功能开发中')
  }

  return (
    <div style={{ padding: 24 }}>
      <Card>
        {/* 表头信息 */}
        <Row
          gutter={16}
          style={{ marginBottom: 24, padding: 16, backgroundColor: '#f5f5f5', borderRadius: 8 }}
        >
          <Col span={6}>
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
          <Col span={6}>
            <strong>班主任姓名：</strong>
            <Input
              value={homeroomTeacher}
              onChange={(e) => setHomeroomTeacher(e.target.value)}
              style={{ width: 150, marginLeft: 8 }}
              placeholder="请输入班主任姓名"
            />
          </Col>
          <Col span={6}>
            <strong>月份：</strong>
            <DatePicker
              picker="month"
              value={selectedMonth}
              onChange={(date) => date && setSelectedMonth(date)}
              format="YYYY年MM月"
              style={{ width: 150, marginLeft: 8 }}
            />
          </Col>
        </Row>

        {/* 表格标题 */}
        <div
          style={{
            marginBottom: 16,
            textAlign: 'center',
            fontSize: '18px',
            fontWeight: 'bold',
            padding: '12px',
            backgroundColor: '#fff1f0',
            borderRadius: 4,
          }}
        >
          清美教育{selectedCampus || '神殿'}教化司口碑工作自查表
          {homeroomTeacher && ` - 班主任姓名: ${homeroomTeacher}`}
        </div>

        {/* 操作栏 */}
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => initializeData()}>
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
          dataSource={dataSource}
          pagination={false}
          bordered
          size="small"
          scroll={{ x: 'max-content', y: 600 }}
        />
      </Card>

      {/* 编辑模态框 */}
      <Modal
        title="编辑数据"
        open={modalVisible}
        onOk={handleSave}
        onCancel={() => {
          setModalVisible(false)
          setEditingCell(null)
          form.resetFields()
        }}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="value"
            label={editingCell?.day === 'description' ? '详细内容' : '数值'}
            rules={[{ required: true, message: '请输入内容' }]}
          >
            {editingCell?.day === 'description' ? (
              <TextArea rows={4} placeholder="请输入详细内容" />
            ) : (
              <Input placeholder="请输入数值或文本" />
            )}
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default ReputationEnrollmentPlanStatisticsPage
