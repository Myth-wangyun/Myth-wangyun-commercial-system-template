/**
 * 教化司交接列表 - 接收祈福司交接过来的报名/订座学员
 */

import React, { useState, useEffect, useCallback } from 'react'
import { App,
  Card,
  Table,
  Select,
  Button,
  Space,
  Modal,
  Tag,
  Input,
  Form,
  Statistic,
  Row,
  Col,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useCampusStore } from '@/stores/campusStore'
import { useAuthStore } from '@/stores/authStore'
import { fetchClasses, fetchHomeroomTeachers } from '@/services/configMaster'
import * as handoverApi from '@/pages/consult/type-count-system/handoverApi'
import dayjs from 'dayjs'

const { Option } = Select

interface HandoverRecord {
  交接ID: number
  咨询记录ID: number
  姓名: string
  性别: string
  电话: string
  学历: string
  报名专业: string
  已交学费: string
  量来源: string
  媒体来源: string
  咨询师: string
  状态: string
  神殿: string
  交接人: string
  交接时间: string
  交接备注: string
  处理状态: string
  分配班级: string
  分配班主任: string
  分配时间: string
  分配人: string
}

const HandoverListPage: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus, getAllCampuses } = useCampusStore()
  const { user } = useAuthStore()
  const allCampuses = getAllCampuses()
  
  const [loading, setLoading] = useState(false)
  const [records, setRecords] = useState<HandoverRecord[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  
  // 筛选条件
  const [filterCampus, setFilterCampus] = useState<string | undefined>(currentCampus || undefined)
  const [filterStatus, setFilterStatus] = useState<string | undefined>('待分配')
  
  // 统计数据
  const [stats, setStats] = useState({ 总数: 0, 待分配: 0, 已分配: 0 })
  
  // 分配班级弹窗
  const [assignModalVisible, setAssignModalVisible] = useState(false)
  const [selectedRecords, setSelectedRecords] = useState<number[]>([])
  const [assignLoading, setAssignLoading] = useState(false)
  const [assignForm] = Form.useForm()
  
  // 班级和班主任选项
  const [classOptions, setClassOptions] = useState<Array<{ className: string; campus: string }>>([])
  const [teacherOptions, setTeacherOptions] = useState<string[]>([])

  // 同步全局神殿选择器
  useEffect(() => {
    if (!currentCampus) return
    setFilterCampus(currentCampus)
    setPage(1)
  }, [currentCampus])

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const campusName = filterCampus || currentCampus || undefined
      const result = await handoverApi.getHandoverList({
        神殿: campusName,
        处理状态: filterStatus,
        page,
        page_size: pageSize,
      })
      setRecords(result.data)
      setTotal(result.total)
    } catch (error: any) {
      message.error('加载数据失败: ' + (error.message || '未知错误'))
    } finally {
      setLoading(false)
    }
  }, [filterCampus, filterStatus, page, pageSize, currentCampus])

  // 加载统计数据
  const loadStats = useCallback(async () => {
    try {
      const campusName = filterCampus || currentCampus || undefined
      const result = await handoverApi.getHandoverStats(campusName)
      setStats(result.data)
    } catch (error) {
      console.error('加载统计失败:', error)
    }
  }, [filterCampus, currentCampus])

  // 加载班级选项
  const loadClassOptions = useCallback(async () => {
    try {
      const campusName = filterCampus || currentCampus || ''
      if (!campusName) {
        setClassOptions([])
        return
      }
      const classes = await fetchClasses({ campus_name: campusName })
      setClassOptions(classes.map(c => ({ className: c.class_name, campus: c.campus_name })))
    } catch (error) {
      console.error('加载班级失败:', error)
    }
  }, [filterCampus, currentCampus])

  // 加载班主任选项
  const loadTeacherOptions = useCallback(async () => {
    try {
      const campusName = filterCampus || currentCampus || ''
      if (!campusName) {
        setTeacherOptions([])
        return
      }
      const teachers = await fetchHomeroomTeachers({ campus_name: campusName })
      setTeacherOptions(teachers.map((teacher) => teacher.name))
    } catch (error) {
      console.error('加载班主任失败:', error)
    }
  }, [filterCampus, currentCampus])

  useEffect(() => {
    loadData()
    loadStats()
  }, [loadData, loadStats])

  useEffect(() => {
    loadClassOptions()
    loadTeacherOptions()
  }, [loadClassOptions, loadTeacherOptions])

  // 处理分配班级
  const handleAssign = async () => {
    if (!user) {
      message.error('用户未登录')
      return
    }

    try {
      const values = await assignForm.validateFields()
      setAssignLoading(true)

      if (selectedRecords.length === 1) {
        // 单条分配
        const result = await handoverApi.assignClass(
          selectedRecords[0],
          values.班级名称,
          values.班主任,
          Number(user.id),
          user.name
        )
        if (result.success) {
          message.success(result.message)
        } else {
          message.error(result.message)
        }
      } else {
        // 批量分配
        const result = await handoverApi.batchAssignClass(
          selectedRecords,
          values.班级名称,
          values.班主任,
          Number(user.id),
          user.name
        )
        message.success(result.message)
      }

      setAssignModalVisible(false)
      setSelectedRecords([])
      assignForm.resetFields()
      loadData()
      loadStats()
    } catch (error: any) {
      message.error('分配失败: ' + (error.message || '未知错误'))
    } finally {
      setAssignLoading(false)
    }
  }

  const columns: ColumnsType<HandoverRecord> = [
    {
      title: '姓名',
      dataIndex: '姓名',
      width: 100,
    },
    {
      title: '性别',
      dataIndex: '性别',
      width: 60,
    },
    {
      title: '电话',
      dataIndex: '电话',
      width: 120,
    },
    {
      title: '报名专业',
      dataIndex: '报名专业',
      width: 120,
    },
    {
      title: '已交学费',
      dataIndex: '已交学费',
      width: 100,
    },
    {
      title: '状态',
      dataIndex: '状态',
      width: 80,
      render: (val: string) => (
        <Tag color={val === '报名' ? 'green' : 'blue'}>{val}</Tag>
      ),
    },
    {
      title: '量来源',
      dataIndex: '量来源',
      width: 100,
    },
    {
      title: '咨询师',
      dataIndex: '咨询师',
      width: 100,
    },
    {
      title: '神殿',
      dataIndex: '神殿',
      width: 100,
    },
    {
      title: '交接人',
      dataIndex: '交接人',
      width: 100,
    },
    {
      title: '交接时间',
      dataIndex: '交接时间',
      width: 150,
      render: (val: string) => val ? dayjs(val).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '处理状态',
      dataIndex: '处理状态',
      width: 100,
      render: (val: string) => (
        <Tag color={val === '待分配' ? 'orange' : 'green'}>{val}</Tag>
      ),
    },
    {
      title: '分配班级',
      dataIndex: '分配班级',
      width: 120,
    },
    {
      title: '分配班主任',
      dataIndex: '分配班主任',
      width: 100,
    },
    {
      title: '分配时间',
      dataIndex: '分配时间',
      width: 150,
      render: (val: string) => val ? dayjs(val).format('YYYY-MM-DD HH:mm') : '-',
    },
  ]

  return (
    <Card title="咨询量交接列表">
      {/* 统计信息 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Statistic title="总数" value={stats.总数} />
        </Col>
        <Col span={6}>
          <Statistic title="待分配" value={stats.待分配} valueStyle={{ color: '#faad14' }} />
        </Col>
        <Col span={6}>
          <Statistic title="已分配" value={stats.已分配} valueStyle={{ color: '#52c41a' }} />
        </Col>
      </Row>

      {/* 筛选栏 */}
      <Space style={{ marginBottom: 16 }}>
        <Select
          placeholder="选择神殿"
          value={filterCampus}
          onChange={setFilterCampus}
          allowClear
          style={{ width: 150 }}
        >
          {allCampuses.map((campus) => (
            <Option key={campus.name} value={campus.name}>{campus.name}</Option>
          ))}
        </Select>
        <Select
          placeholder="处理状态"
          value={filterStatus}
          onChange={setFilterStatus}
          allowClear
          style={{ width: 120 }}
        >
          <Option value="待分配">待分配</Option>
          <Option value="已分配">已分配</Option>
        </Select>
        <Button type="primary" onClick={() => { setPage(1); loadData(); loadStats(); }}>
          搜索
        </Button>
        <Button
          type="primary"
          disabled={selectedRecords.length === 0}
          onClick={() => setAssignModalVisible(true)}
        >
          分配班级 {selectedRecords.length > 0 && `(${selectedRecords.length})`}
        </Button>
      </Space>

      {/* 数据表格 */}
      <Table
        columns={columns}
        dataSource={records}
        rowKey="交接ID"
        loading={loading}
        scroll={{ x: 1600 }}
        rowSelection={{
          selectedRowKeys: selectedRecords,
          onChange: (keys) => setSelectedRecords(keys as number[]),
          getCheckboxProps: (record) => ({
            disabled: record.处理状态 !== '待分配',
          }),
        }}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条记录`,
          onChange: (p, ps) => {
            setPage(p)
            setPageSize(ps)
          },
        }}
      />

      {/* 分配班级弹窗 */}
      <Modal
        title={`分配班级（${selectedRecords.length} 条记录）`}
        open={assignModalVisible}
        onOk={handleAssign}
        onCancel={() => {
          setAssignModalVisible(false)
          assignForm.resetFields()
        }}
        confirmLoading={assignLoading}
        okText="确认分配"
        cancelText="取消"
      >
        <Form form={assignForm} layout="vertical">
          <Form.Item
            name="班级名称"
            label="选择班级"
            rules={[{ required: true, message: '请选择班级' }]}
          >
            <Select
              placeholder="请选择班级"
              showSearch
              optionFilterProp="children"
            >
              {classOptions.map(c => (
                <Option key={c.className} value={c.className}>
                  {c.className} ({c.campus})
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="班主任"
            label="班主任"
            rules={[{ required: true, message: '请选择班主任' }]}
          >
            <Select
              placeholder="请选择班主任"
              showSearch
              optionFilterProp="children"
            >
              {teacherOptions.map(t => (
                <Option key={t} value={t}>{t}</Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
        <div style={{ color: '#666', fontSize: 12, marginTop: 8 }}>
          分配后，学员信息将自动插入到对应班级的班档案表中。
        </div>
      </Modal>
    </Card>
  )
}

export default HandoverListPage
