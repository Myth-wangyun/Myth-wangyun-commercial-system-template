// 学术->学术经理 05-4主神殿教化司当月新生维稳明细表
import React, { useMemo, useState } from 'react'
import { App,
  Card,
  Table,
  Typography,
  Space,
  Select,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'

const { Title, Text } = Typography
const { Option } = Select

interface NewStudentStabilityRecord {
  id: string
  serial: number
  classTeacher: string
  studentName: string
  registrationDate: string
  reportDate: string
  major: string
  programLength: string
  tuitionDue: number
  registrationPayment: number
  additionalPayment: number
  outstandingAmount: number
  isFullPayment: string
  isLoan: string
  isOverClassHours: string
  trialPeriod: string
  isRefund: string
  refundDescription: string
  consultant: string
  isAccommodation: string
  dormName: string
  remark: string
}

type NewStudentStabilityFormValues = Omit<NewStudentStabilityRecord, 'id' | 'serial'>

const initialData: NewStudentStabilityRecord[] = [
  {
    id: 'record-1',
    serial: 1,
    classTeacher: '姜楠',
    studentName: '魏轩',
    registrationDate: '2025.7.28',
    reportDate: '2025.8.1',
    major: '网络云运维',
    programLength: '20个月',
    tuitionDue: 42800,
    registrationPayment: 42800,
    additionalPayment: 0,
    outstandingAmount: 0,
    isFullPayment: '是',
    isLoan: '否',
    isOverClassHours: '是',
    trialPeriod: '1.5天',
    isRefund: '否',
    refundDescription: '',
    consultant: '李金雷',
    isAccommodation: '是',
    dormName: '卓达玫瑰园12-2-201',
    remark: '',
  },
  {
    id: 'record-2',
    serial: 2,
    classTeacher: '姜楠',
    studentName: '',
    registrationDate: '',
    reportDate: '',
    major: '',
    programLength: '',
    tuitionDue: 0,
    registrationPayment: 0,
    additionalPayment: 0,
    outstandingAmount: 0,
    isFullPayment: '',
    isLoan: '',
    isOverClassHours: '',
    trialPeriod: '',
    isRefund: '',
    refundDescription: '',
    consultant: '',
    isAccommodation: '',
    dormName: '',
    remark: '',
  },
  {
    id: 'record-3',
    serial: 3,
    classTeacher: '姜楠',
    studentName: '',
    registrationDate: '',
    reportDate: '',
    major: '',
    programLength: '',
    tuitionDue: 0,
    registrationPayment: 0,
    additionalPayment: 0,
    outstandingAmount: 0,
    isFullPayment: '',
    isLoan: '',
    isOverClassHours: '',
    trialPeriod: '',
    isRefund: '',
    refundDescription: '',
    consultant: '',
    isAccommodation: '',
    dormName: '',
    remark: '',
  },
  {
    id: 'record-4',
    serial: 4,
    classTeacher: '姜楠',
    studentName: '',
    registrationDate: '',
    reportDate: '',
    major: '',
    programLength: '',
    tuitionDue: 0,
    registrationPayment: 0,
    additionalPayment: 0,
    outstandingAmount: 0,
    isFullPayment: '',
    isLoan: '',
    isOverClassHours: '',
    trialPeriod: '',
    isRefund: '',
    refundDescription: '',
    consultant: '',
    isAccommodation: '',
    dormName: '',
    remark: '',
  },
  {
    id: 'record-5',
    serial: 5,
    classTeacher: '李晓平',
    studentName: '',
    registrationDate: '',
    reportDate: '',
    major: '',
    programLength: '',
    tuitionDue: 0,
    registrationPayment: 0,
    additionalPayment: 0,
    outstandingAmount: 0,
    isFullPayment: '',
    isLoan: '',
    isOverClassHours: '',
    trialPeriod: '',
    isRefund: '',
    refundDescription: '',
    consultant: '',
    isAccommodation: '',
    dormName: '',
    remark: '',
  },
  {
    id: 'record-6',
    serial: 6,
    classTeacher: '李晓平',
    studentName: '',
    registrationDate: '',
    reportDate: '',
    major: '',
    programLength: '',
    tuitionDue: 0,
    registrationPayment: 0,
    additionalPayment: 0,
    outstandingAmount: 0,
    isFullPayment: '',
    isLoan: '',
    isOverClassHours: '',
    trialPeriod: '',
    isRefund: '',
    refundDescription: '',
    consultant: '',
    isAccommodation: '',
    dormName: '',
    remark: '',
  },
  {
    id: 'record-7',
    serial: 7,
    classTeacher: '李晓平',
    studentName: '',
    registrationDate: '',
    reportDate: '',
    major: '',
    programLength: '',
    tuitionDue: 0,
    registrationPayment: 0,
    additionalPayment: 0,
    outstandingAmount: 0,
    isFullPayment: '',
    isLoan: '',
    isOverClassHours: '',
    trialPeriod: '',
    isRefund: '',
    refundDescription: '',
    consultant: '',
    isAccommodation: '',
    dormName: '',
    remark: '',
  },
]

const columns: ColumnsType<NewStudentStabilityRecord> = [
  { title: '序号', dataIndex: 'serial', align: 'center', width: 80 },
  { title: '班主任姓名', dataIndex: 'classTeacher', align: 'center', width: 120 },
  { title: '新生姓名', dataIndex: 'studentName', align: 'center', width: 120 },
  { title: '报名时间', dataIndex: 'registrationDate', align: 'center', width: 140 },
  { title: '报道时间', dataIndex: 'reportDate', align: 'center', width: 140 },
  { title: '报名专业', dataIndex: 'major', align: 'center', width: 150 },
  { title: '报名学制', dataIndex: 'programLength', align: 'center', width: 120 },
  { title: '应收学费', dataIndex: 'tuitionDue', align: 'center', width: 120 },
  { title: '报名交费金额', dataIndex: 'registrationPayment', align: 'center', width: 140 },
  { title: '补款金额', dataIndex: 'additionalPayment', align: 'center', width: 120 },
  { title: '仍欠费金额', dataIndex: 'outstandingAmount', align: 'center', width: 140 },
  { title: '是否全款', dataIndex: 'isFullPayment', align: 'center', width: 120 },
  { title: '是否贷款', dataIndex: 'isLoan', align: 'center', width: 120 },
  { title: '是否过课时', dataIndex: 'isOverClassHours', align: 'center', width: 140 },
  { title: '试学周期', dataIndex: 'trialPeriod', align: 'center', width: 120 },
  { title: '是否退费', dataIndex: 'isRefund', align: 'center', width: 120 },
  { title: '退费情况说明', dataIndex: 'refundDescription', align: 'center', width: 180 },
  { title: '咨询师', dataIndex: 'consultant', align: 'center', width: 120 },
  { title: '是否住宿', dataIndex: 'isAccommodation', align: 'center', width: 120 },
  { title: '宿舍名', dataIndex: 'dormName', align: 'center', width: 150 },
  { title: '备注', dataIndex: 'remark', align: 'center', width: 160 },
]

const NewStudentMonthlyStabilityDetailPage: React.FC = () => {
  const { message } = App.useApp()
  const [dataSource, setDataSource] = useState<NewStudentStabilityRecord[]>(initialData)
  const [teacherFilter, setTeacherFilter] = useState<string | 'all'>('all')
  const [modalVisible, setModalVisible] = useState(false)
  const [form] = Form.useForm<NewStudentStabilityFormValues>()

  const teacherOptions = useMemo(() => {
    return Array.from(new Set(dataSource.map((item) => item.classTeacher).filter(Boolean)))
  }, [dataSource])

  const filteredData = useMemo(() => {
    if (teacherFilter === 'all') {
      return dataSource
    }
    return dataSource.filter((item) => item.classTeacher === teacherFilter)
  }, [dataSource, teacherFilter])

  const handleAddRecord = async () => {
    try {
      const values = await form.validateFields()
      setDataSource((prev) => {
        const nextSerial = prev.length + 1
        const newRecord: NewStudentStabilityRecord = {
          id: `record-${Date.now()}`,
          serial: nextSerial,
          ...values,
        }
        return [...prev, newRecord]
      })
      message.success('新增记录成功')
      setModalVisible(false)
      form.resetFields()
    } catch (error) {
      // 验证失败时不进行任何操作
    }
  }

  return (
    <Card bordered={false} style={{ backgroundColor: '#f5f7fa' }}>
      <Title level={4} style={{ marginBottom: 8 }}>
        05-4主神殿教化司当月新生维稳明细表
      </Title>
      <Text type="secondary">记录当月新生收费、住宿与退费情况，便于及时跟进与维稳</Text>

      <Space style={{ marginTop: 16, marginBottom: 16 }} wrap>
        <Space size="small">
          <Text strong>班主任：</Text>
          <Select<string | 'all'>
            value={teacherFilter}
            onChange={setTeacherFilter}
            style={{ width: 200 }}
            placeholder="请选择班主任"
          >
            <Option value="all">全部班主任</Option>
            {teacherOptions.map((teacher) => (
              <Option key={teacher} value={teacher}>
                {teacher}
              </Option>
            ))}
          </Select>
        </Space>
        <Button type="primary" onClick={() => setModalVisible(true)}>
          新增记录
        </Button>
      </Space>

      <Table<NewStudentStabilityRecord>
        bordered
        columns={columns}
        dataSource={filteredData}
        rowKey={(record) => record.id}
        pagination={false}
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: '暂无数据，请调整筛选条件' }}
      />

      <Modal
        title="新增新生维稳记录"
        open={modalVisible}
        onOk={handleAddRecord}
        onCancel={() => {
          form.resetFields()
          setModalVisible(false)
        }}
        width={720}
        destroyOnClose
      >
        <Form<NewStudentStabilityFormValues> form={form} layout="vertical" preserve={false}>
          <Space size="large" style={{ width: '100%' }} wrap>
            <Form.Item
              name="classTeacher"
              label="班主任姓名"
              rules={[{ required: true, message: '请输入班主任姓名' }]}
            >
              <Input placeholder="请输入班主任姓名" />
            </Form.Item>
            <Form.Item
              name="studentName"
              label="新生姓名"
              rules={[{ required: true, message: '请输入新生姓名' }]}
            >
              <Input placeholder="请输入新生姓名" />
            </Form.Item>
            <Form.Item name="registrationDate" label="报名时间">
              <Input placeholder="请输入报名时间，例如 2025.7.28" />
            </Form.Item>
            <Form.Item name="reportDate" label="报道时间">
              <Input placeholder="请输入报道时间，例如 2025.8.1" />
            </Form.Item>
            <Form.Item name="major" label="报名专业">
              <Input placeholder="请输入报名专业" />
            </Form.Item>
            <Form.Item name="programLength" label="报名学制">
              <Input placeholder="请输入报名学制，例如 20个月" />
            </Form.Item>
            <Form.Item name="tuitionDue" label="应收学费" initialValue={0}>
              <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入应收学费" />
            </Form.Item>
            <Form.Item name="registrationPayment" label="报名交费金额" initialValue={0}>
              <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入报名交费金额" />
            </Form.Item>
            <Form.Item name="additionalPayment" label="补款金额" initialValue={0}>
              <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入补款金额" />
            </Form.Item>
            <Form.Item name="outstandingAmount" label="仍欠费金额" initialValue={0}>
              <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入仍欠费金额" />
            </Form.Item>
            <Form.Item name="isFullPayment" label="是否全款">
              <Input placeholder="请输入 是/否" />
            </Form.Item>
            <Form.Item name="isLoan" label="是否贷款">
              <Input placeholder="请输入 是/否" />
            </Form.Item>
            <Form.Item name="isOverClassHours" label="是否过课时">
              <Input placeholder="请输入 是/否" />
            </Form.Item>
            <Form.Item name="trialPeriod" label="试学周期">
              <Input placeholder="请输入试学周期" />
            </Form.Item>
            <Form.Item name="isRefund" label="是否退费">
              <Input placeholder="请输入 是/否" />
            </Form.Item>
            <Form.Item name="refundDescription" label="退费情况说明">
              <Input placeholder="请输入退费情况说明" />
            </Form.Item>
            <Form.Item name="consultant" label="咨询师">
              <Input placeholder="请输入咨询师姓名" />
            </Form.Item>
            <Form.Item name="isAccommodation" label="是否住宿">
              <Input placeholder="请输入 是/否" />
            </Form.Item>
            <Form.Item name="dormName" label="宿舍名">
              <Input placeholder="请输入宿舍名" />
            </Form.Item>
            <Form.Item name="remark" label="备注">
              <Input.TextArea rows={2} placeholder="请输入备注" />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </Card>
  )
}

export default NewStudentMonthlyStabilityDetailPage
