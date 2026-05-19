// 成考学籍注册花名册（已接入后端，支持按年/月筛选）

import React, { useEffect, useMemo, useState } from 'react'
import { App, Card, Table, Button, Space, Modal, Form, Input, Select, DatePicker, AutoComplete } from 'antd'
import dayjs from 'dayjs'
import type { ColumnsType } from 'antd/es/table'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { useCampusStore } from '@/stores/campusStore'
import { buildApiUrl } from '@/utils/apiBase'
import HomeroomTeacherSelect from '@/components/HomeroomTeacherSelect'
import { useStudentAutoFill } from './utils/useStudentAutoFill'
import { useClassFileRoster } from './utils/useClassFileRoster'

const { Option } = Select
const formatPickerValue = (value: unknown, format: string) => (dayjs.isDayjs(value) ? value.format(format) : '')

interface AdultExamRegistrationRecord {
  key?: string
  serialNumber: string
  studentName: string
  gender: string
  idCardNumber: string
  schoolName: string
  registrationTime: string
  graduationTime: string
  studentNumber: string
  studentRecordNumber: string
  educationSystem: string
  studyMode: string
  contactPhone: string
  headTeacher: string
}

const AdultExamRegistrationRoster: React.FC = () => {
  const { message, modal } = App.useApp()
  const { currentCampus } = useCampusStore()
  const [year, setYear] = useState<number>(new Date().getFullYear())
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1)

  const [dataSource, setDataSource] = useState<AdultExamRegistrationRecord[]>([])
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<AdultExamRegistrationRecord | null>(null)
  const [form] = Form.useForm<AdultExamRegistrationRecord>()

  const canIO = useMemo(() => Boolean(currentCampus && year && month), [currentCampus, year, month])

  // 使用自动填充 Hook
  const { getAutoCompleteOptions, handleAutoCompleteSelect } = useStudentAutoFill(form, {
    genderField: 'gender',
    idCardField: 'idCardNumber',
    phoneField: 'contactPhone',
  })

  const [studentNameSearchText, setStudentNameSearchText] = useState('')

  // 使用从班级档案获取数据的Hook
  const { fetchFromClassFile, loading: classFileLoading } = useClassFileRoster({
    category: 'adult-exam-registered',
    campus: currentCampus,
    mapFunction: (rawData, campus) => rawData.map((r: any, i: number) => ({
      key: String(r.serialNumber || `${i}-${r.studentName}`),
      serialNumber: r.serialNumber || String(i + 1),
      studentName: r.studentName || '',
      gender: r.gender || '',
      idCardNumber: r.idCardNumber || '',
      schoolName: r.schoolName || '',
      registrationTime: r.registrationTime || '',
      graduationTime: r.graduationTime || '',
      studentNumber: r.studentNumber || '',
      studentRecordNumber: r.studentRecordNumber || '',
      educationSystem: r.educationSystem || '',
      studyMode: r.studyMode || '',
      contactPhone: r.contactPhone || '',
      headTeacher: r.headTeacher || '',
    }))
  })

  const handleAdd = () => {
    setEditingRecord(null)
    form.resetFields()
    setIsModalVisible(true)
  }

  const handleEdit = (record: AdultExamRegistrationRecord) => {
    setEditingRecord(record)
    const mapForForm: any = {
      ...record,
      registrationTime: record.registrationTime ? dayjs(record.registrationTime, 'YYYY.MM') : undefined,
      graduationTime: record.graduationTime ? dayjs(record.graduationTime, 'YYYY.MM') : undefined,
    }
    form.setFieldsValue(mapForForm)
    setIsModalVisible(true)
  }

  const handleDelete = (serialNumber: string) => {
    modal.confirm({
      title: '确认删除',
      content: `确定要删除序号为 ${serialNumber} 的记录吗？`,
      onOk: () => {
        setDataSource((prev) => prev.filter((item) => item.serialNumber !== serialNumber))
        message.success('删除成功（未保存到服务器）')
      },
    })
  }

  const handleSaveModal = async () => {
    try {
      const values = await form.validateFields()
      const formatted = {
        ...values,
        registrationTime: formatPickerValue(values.registrationTime, 'YYYY.MM'),
        graduationTime: formatPickerValue(values.graduationTime, 'YYYY.MM'),
      }
      const newRecord: AdultExamRegistrationRecord = {
        ...editingRecord,
        ...formatted,
        key: values.serialNumber,
      }

      setDataSource((prev) => {
        const exists = prev.some((x) => x.serialNumber === newRecord.serialNumber)
        if (editingRecord || exists) {
          return prev.map((item) => (item.serialNumber === (editingRecord?.serialNumber || newRecord.serialNumber) ? newRecord : item))
        }
        return [...prev, newRecord]
      })

      message.success(editingRecord ? '编辑成功（未保存到服务器）' : '新增成功（未保存到服务器）')
      setIsModalVisible(false)
      form.resetFields()
    } catch {
      // 校验失败
    }
  }

  // 刷新（按年/月）
  const fetchFromServer = async () => {
    if (!canIO) {
      message.warning('请先选择神殿/年份/月')
      return
    }
    try {
      const res = await fetch(
        buildApiUrl(`/teaching-quality/adult-exam-registration-roster?campus=${encodeURIComponent(
          currentCampus!,
        )}&year=${year}&month=${month}`),
      )
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      const rows = (data?.行列表 || []) as any[]
      const mapped: AdultExamRegistrationRecord[] = rows.map((r: any, idx: number) => ({
        key: String(r.serialNumber ?? idx + 1),
        serialNumber: String(r.serialNumber ?? idx + 1),
        studentName: String(r.studentName || ''),
        gender: String(r.gender || ''),
        idCardNumber: String(r.idCardNumber || ''),
        schoolName: String(r.schoolName || ''),
        registrationTime: String(r.registrationTime || ''),
        graduationTime: String(r.graduationTime || ''),
        studentNumber: String(r.studentNumber || ''),
        studentRecordNumber: String(r.studentRecordNumber || ''),
        educationSystem: String(r.educationSystem || ''),
        studyMode: String(r.studyMode || ''),
        contactPhone: String(r.contactPhone || ''),
        headTeacher: String(r.headTeacher || ''),
      }))
      setDataSource(mapped)
      message.success('已刷新')
    } catch (e) {
      console.error(e)
      message.error('刷新失败')
    }
  }

  // 保存（按月覆盖写入）
  const saveToServer = async () => {
    if (!canIO) {
      message.warning('请先选择神殿/年份/月')
      return
    }
    try {
      const payload = {
        神殿名称: currentCampus!,
        年份: year,
        月份: month,
        行列表: dataSource.map((r) => ({
          serialNumber: Number(r.serialNumber || 0),
          studentName: r.studentName,
          gender: r.gender,
          idCardNumber: r.idCardNumber,
          schoolName: r.schoolName,
          registrationTime: r.registrationTime,
          graduationTime: r.graduationTime,
          studentNumber: r.studentNumber,
          studentRecordNumber: r.studentRecordNumber,
          educationSystem: r.educationSystem,
          studyMode: r.studyMode,
          contactPhone: r.contactPhone,
          headTeacher: r.headTeacher,
        })),
      }
      const res = await fetch(buildApiUrl('/teaching-quality/adult-exam-registration-roster'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(await res.text())
      message.success('保存成功')
      await fetchFromServer()
    } catch (e) {
      console.error(e)
      message.error('保存失败')
    }
  }

  useEffect(() => {
    if (currentCampus) {
      fetchFromServer()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCampus, year, month])

  const columns: ColumnsType<AdultExamRegistrationRecord> = [
    {
      title: '序号',
      dataIndex: 'serialNumber',
      key: 'serialNumber',
      width: 80,
      fixed: 'left',
    },
    {
      title: '姓名',
      dataIndex: 'studentName',
      key: 'studentName',
      width: 100,
      fixed: 'left',
    },
    {
      title: '性别',
      dataIndex: 'gender',
      key: 'gender',
      width: 70,
    },
    {
      title: '身份证件号',
      dataIndex: 'idCardNumber',
      key: 'idCardNumber',
      width: 190,
    },
    {
      title: '学校名称',
      dataIndex: 'schoolName',
      key: 'schoolName',
      width: 200,
    },
    {
      title: '注册时间',
      dataIndex: 'registrationTime',
      key: 'registrationTime',
      width: 120,
    },
    {
      title: '毕业时间',
      dataIndex: 'graduationTime',
      key: 'graduationTime',
      width: 120,
    },
    {
      title: '学号',
      dataIndex: 'studentNumber',
      key: 'studentNumber',
      width: 160,
    },
    {
      title: '学籍号',
      dataIndex: 'studentRecordNumber',
      key: 'studentRecordNumber',
      width: 160,
    },
    {
      title: '学制',
      dataIndex: 'educationSystem',
      key: 'educationSystem',
      width: 100,
    },
    {
      title: '学习形式',
      dataIndex: 'studyMode',
      key: 'studyMode',
      width: 100,
    },
    {
      title: '联系电话',
      dataIndex: 'contactPhone',
      key: 'contactPhone',
      width: 140,
    },
    {
      title: '班主任',
      dataIndex: 'headTeacher',
      key: 'headTeacher',
      width: 100,
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 160,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.serialNumber)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <Card
        title="成考学籍注册花名册"
        extra={
          <Space>
            <span>年份</span>
            <DatePicker
              picker="year"
              value={dayjs().year(year)}
              onChange={(d) => d && setYear(d.year())}
              style={{ width: 120 }}
            />
            <span>月份</span>
            <DatePicker
              picker="month"
              value={dayjs().year(year).month(month - 1)}
              onChange={(d) => {
                if (d) {
                  setYear(d.year())
                  setMonth(d.month() + 1)
                }
              }}
              style={{ width: 140 }}
            />
            <Button 
              onClick={() => fetchFromClassFile(setDataSource)} 
              disabled={!canIO}
              loading={classFileLoading}
            >
              从班级档案获取
            </Button>
            <Button onClick={fetchFromServer} disabled={!canIO}>
              刷新
            </Button>
            <Button type="primary" onClick={saveToServer} disabled={!canIO}>
              保存
            </Button>
            <Button type="dashed" icon={<PlusOutlined />} onClick={handleAdd}>
              新增记录
            </Button>
          </Space>
        }
      >
        <Table<AdultExamRegistrationRecord>
          bordered
          size="small"
          columns={columns}
          dataSource={dataSource}
          rowKey="serialNumber"
          pagination={false}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      <Modal
        open={isModalVisible}
        title={editingRecord ? '编辑记录' : '新增记录'}
        onOk={handleSaveModal}
        onCancel={() => {
          setIsModalVisible(false)
          form.resetFields()
        }}
        width={800}
        destroyOnClose
      >
        <Form<AdultExamRegistrationRecord> form={form} layout="vertical">
          <Space size="large" style={{ display: 'flex' }}>
            <Form.Item name="serialNumber" label="序号" rules={[{ required: true, message: '请输入序号' }]}>
              <Input />
            </Form.Item>
            <Form.Item name="studentName" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
              <AutoComplete
                placeholder="输入姓名搜索并选择学生"
                options={getAutoCompleteOptions(studentNameSearchText)}
                onSearch={setStudentNameSearchText}
                onSelect={handleAutoCompleteSelect}
                filterOption={false}
                style={{ width: '100%' }}
                dropdownStyle={{ minWidth: 500, maxWidth: 800 }}
                allowClear
              />
            </Form.Item>
            <Form.Item name="gender" label="性别" rules={[{ required: true, message: '请选择性别' }]}>
              <Select allowClear>
                <Option value="男">男</Option>
                <Option value="女">女</Option>
              </Select>
            </Form.Item>
          </Space>

          <Form.Item name="idCardNumber" label="身份证件号" rules={[{ required: true, message: '请输入身份证件号' }]}>
            <Input />
          </Form.Item>

          <Form.Item name="schoolName" label="学校名称" rules={[{ required: true, message: '请输入学校名称' }]}>
            <Input />
          </Form.Item>

          <Space size="large" style={{ display: 'flex' }}>
            <Form.Item name="registrationTime" label="注册时间">
              <DatePicker picker="month" format="YYYY.MM" style={{ width: 140 }} />
            </Form.Item>
            <Form.Item name="graduationTime" label="毕业时间">
              <DatePicker picker="month" format="YYYY.MM" style={{ width: 140 }} />
            </Form.Item>
          </Space>

          <Space size="large" style={{ display: 'flex' }}>
            <Form.Item name="studentNumber" label="学号">
              <Input />
            </Form.Item>
            <Form.Item name="studentRecordNumber" label="学籍号">
              <Input />
            </Form.Item>
          </Space>

          <Space size="large" style={{ display: 'flex' }}>
            <Form.Item name="educationSystem" label="学制">
              <Input placeholder="如：2.5年" />
            </Form.Item>
            <Form.Item name="studyMode" label="学习形式">
              <Input placeholder="如：全日制" />
            </Form.Item>
          </Space>

          <Space size="large" style={{ display: 'flex' }}>
            <Form.Item name="contactPhone" label="联系电话">
              <Input />
            </Form.Item>
            <Form.Item name="headTeacher" label="班主任">
              <HomeroomTeacherSelect campusName={currentCampus || undefined} />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </div>
  )
}

export default AdultExamRegistrationRoster
