// 中专1年制需注册花名册

import React, { useEffect, useMemo, useState } from 'react'
import { App, Card, Table, Button, Space, Modal, Form, Input, Select, DatePicker, AutoComplete } from 'antd'
import dayjs from 'dayjs'
import type { ColumnsType } from 'antd/es/table'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { useCampusStore } from '@/stores/campusStore'
import { buildApiUrl } from '@/utils/apiBase'
import { useStudentAutoFill } from './utils/useStudentAutoFill'
import { useClassFileRoster } from './utils/useClassFileRoster'

const { Option } = Select

interface Secondary1YearToRegisterRecord {
  key: string
  pendingRegistrationTime: string
  studentName: string
  gender: string
  idCardNumber: string
  major: string
  educationSystem: string
  className: string
  nation: string
  politicalStatus: string
  householdType: string
  contactPhone: string
  householdAddress: string
  enrollmentTarget: string
  isMigrantChild: string
  registrationYear: string
  scholarshipStatus: string
  parentName1: string
  parentPhone1: string
  parentName2: string
  parentPhone2: string
  campus: string
  headTeacher: string
}

const Secondary1YearToRegisterRoster: React.FC = () => {
  const { message, modal } = App.useApp()
  const { currentCampus } = useCampusStore()
  const [dataSource, setDataSource] = useState<Secondary1YearToRegisterRecord[]>([])
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<Secondary1YearToRegisterRecord | null>(null)
  const [form] = Form.useForm<Secondary1YearToRegisterRecord>()

  const canIO = useMemo(() => Boolean(currentCampus), [currentCampus])

  // 使用自动填充 Hook
  const { getAutoCompleteOptions, handleAutoCompleteSelect } = useStudentAutoFill(form, {
    genderField: 'gender',
    idCardField: 'idCardNumber',
    phoneField: 'contactPhone',
    parentPhoneField: 'parentPhone1',
  })

  const [studentNameSearchText, setStudentNameSearchText] = useState('')

  // 使用从班级档案获取数据的Hook
  const { fetchFromClassFile, loading: classFileLoading } = useClassFileRoster({
    category: 'secondary-1year-to-register',
    campus: currentCampus,
    mapFunction: (rawData, campus) => rawData.map((r: any, i: number) => ({
      key: `${i}-${r.studentName}`,
      pendingRegistrationTime: r.pendingRegistrationTime || '',
      studentName: r.studentName || '',
      gender: r.gender || '',
      idCardNumber: r.idCardNumber || '',
      major: r.major || '',
      educationSystem: r.educationSystem || '',
      className: r.className || '',
      nation: r.nation || '',
      politicalStatus: r.politicalStatus || '',
      householdType: r.householdType || '',
      contactPhone: r.contactPhone || '',
      householdAddress: r.householdAddress || '',
      enrollmentTarget: r.enrollmentTarget || '',
      isMigrantChild: r.isMigrantChild || '',
      registrationYear: r.registrationYear || '',
      scholarshipStatus: r.scholarshipStatus || '',
      parentName1: r.parentName1 || '',
      parentPhone1: r.parentPhone1 || '',
      parentName2: r.parentName2 || '',
      parentPhone2: r.parentPhone2 || '',
      campus: campus,
      headTeacher: r.headTeacher || '',
    }))
  })

  const handleAdd = () => {
    setEditingRecord(null)
    form.resetFields()
    form.setFieldsValue({ campus: currentCampus || '' } as any)
    setIsModalVisible(true)
  }

  const handleEdit = (record: Secondary1YearToRegisterRecord) => {
    setEditingRecord(record)
    form.setFieldsValue({
      ...record,
      pendingRegistrationTime: record.pendingRegistrationTime ? dayjs(record.pendingRegistrationTime, 'YYYY-MM-DD') : undefined,
    } as any)
    setIsModalVisible(true)
  }

  const handleDelete = (key: string) => {
    modal.confirm({
      title: '确认删除',
      content: '确定要删除这条记录吗？',
      onOk: () => {
        setDataSource((prev) => prev.filter((item) => item.key !== key))
        message.success('删除成功（未保存到服务器）')
      },
    })
  }

  const handleSaveModal = async () => {
    try {
      const values = await form.validateFields()
      const formatted = {
        ...values,
        pendingRegistrationTime: values.pendingRegistrationTime ? (values.pendingRegistrationTime as any).format('YYYY-MM-DD') : '',
      }
      const newRecord: Secondary1YearToRegisterRecord = {
        ...editingRecord,
        ...formatted,
        key: editingRecord?.key || Date.now().toString(),
        campus: values.campus || currentCampus || '',
      }

      setDataSource((prev) => {
        if (editingRecord) {
          return prev.map((item) => (item.key === editingRecord.key ? newRecord : item))
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

  const fetchFromServer = async () => {
    if (!canIO) {
      message.warning('请先选择神殿')
      return
    }
    try {
      const res = await fetch(
        buildApiUrl(`/teaching-quality/secondary-1year-to-register-roster?campus=${encodeURIComponent(currentCampus!)}`),
      )
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      const rows = (data?.行列表 || []) as any[]
      const mapped: Secondary1YearToRegisterRecord[] = rows.map((r: any, i: number) => ({
        key: `${i}-${r.idCardNumber || r.studentName || ''}`,
        pendingRegistrationTime: r.pendingRegistrationTime || '',
        studentName: r.studentName || '',
        gender: r.gender || '',
        idCardNumber: r.idCardNumber || '',
        major: r.major || '',
        educationSystem: r.educationSystem || '',
        className: r.className || '',
        nation: r.nation || '',
        politicalStatus: r.politicalStatus || '',
        householdType: r.householdType || '',
        contactPhone: r.contactPhone || '',
        householdAddress: r.householdAddress || '',
        enrollmentTarget: r.enrollmentTarget || '',
        isMigrantChild: r.isMigrantChild || '',
        registrationYear: r.registrationYear || '',
        scholarshipStatus: r.scholarshipStatus || '',
        parentName1: r.parentName1 || '',
        parentPhone1: r.parentPhone1 || '',
        parentName2: r.parentName2 || '',
        parentPhone2: r.parentPhone2 || '',
        campus: currentCampus || '',
        headTeacher: r.headTeacher || '',
      }))
      setDataSource(mapped)
      message.success('已刷新')
    } catch (e) {
      console.error(e)
      message.error('刷新失败')
    }
  }

  const saveToServer = async () => {
    if (!canIO) {
      message.warning('请先选择神殿')
      return
    }
    try {
      const payload = {
        神殿名称: currentCampus!,
        行列表: dataSource.map((r) => ({
          pendingRegistrationTime: r.pendingRegistrationTime,
          studentName: r.studentName,
          gender: r.gender,
          idCardNumber: r.idCardNumber,
          major: r.major,
          educationSystem: r.educationSystem,
          className: r.className,
          nation: r.nation,
          politicalStatus: r.politicalStatus,
          householdType: r.householdType,
          contactPhone: r.contactPhone,
          householdAddress: r.householdAddress,
          enrollmentTarget: r.enrollmentTarget,
          isMigrantChild: r.isMigrantChild,
          registrationYear: r.registrationYear,
          scholarshipStatus: r.scholarshipStatus,
          parentName1: r.parentName1,
          parentPhone1: r.parentPhone1,
          parentName2: r.parentName2,
          parentPhone2: r.parentPhone2,
          headTeacher: r.headTeacher,
        })),
      }
      const res = await fetch(buildApiUrl('/teaching-quality/secondary-1year-to-register-roster'), {
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
    if (currentCampus) fetchFromServer()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCampus])

  const columns: ColumnsType<Secondary1YearToRegisterRecord> = [
    {
      title: '需注册时间',
      dataIndex: 'pendingRegistrationTime',
      key: 'pendingRegistrationTime',
      width: 140,
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
      title: '专业',
      dataIndex: 'major',
      key: 'major',
      width: 140,
    },
    {
      title: '学制',
      dataIndex: 'educationSystem',
      key: 'educationSystem',
      width: 100,
    },
    {
      title: '班级',
      dataIndex: 'className',
      key: 'className',
      width: 120,
    },
    {
      title: '民族',
      dataIndex: 'nation',
      key: 'nation',
      width: 100,
    },
    {
      title: '政治面貌',
      dataIndex: 'politicalStatus',
      key: 'politicalStatus',
      width: 120,
    },
    {
      title: '户口性质',
      dataIndex: 'householdType',
      key: 'householdType',
      width: 120,
    },
    {
      title: '联系电话',
      dataIndex: 'contactPhone',
      key: 'contactPhone',
      width: 140,
    },
    {
      title: '户口所在地',
      dataIndex: 'householdAddress',
      key: 'householdAddress',
      width: 220,
    },
    {
      title: '招生对象',
      dataIndex: 'enrollmentTarget',
      key: 'enrollmentTarget',
      width: 160,
    },
    {
      title: '是否随迁子女',
      dataIndex: 'isMigrantChild',
      key: 'isMigrantChild',
      width: 130,
    },
    {
      title: '注册年份',
      dataIndex: 'registrationYear',
      key: 'registrationYear',
      width: 120,
    },
    {
      title: '是否享受助学金（曾经/现在/即将享受）',
      dataIndex: 'scholarshipStatus',
      key: 'scholarshipStatus',
      width: 260,
    },
    {
      title: '家长姓名1',
      dataIndex: 'parentName1',
      key: 'parentName1',
      width: 120,
    },
    {
      title: '家长1电话',
      dataIndex: 'parentPhone1',
      key: 'parentPhone1',
      width: 140,
    },
    {
      title: '家长姓名2',
      dataIndex: 'parentName2',
      key: 'parentName2',
      width: 120,
    },
    {
      title: '家长2电话',
      dataIndex: 'parentPhone2',
      key: 'parentPhone2',
      width: 140,
    },
    {
      title: '神殿归属',
      dataIndex: 'campus',
      key: 'campus',
      width: 100,
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
            onClick={() => handleDelete(record.key)}
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
        title="中专1年制需注册花名册"
        extra={
          <Space>
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
        <Table<Secondary1YearToRegisterRecord>
          bordered
          size="small"
          columns={columns}
          dataSource={dataSource}
          rowKey="key"
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
        width={900}
      >
        <Form<Secondary1YearToRegisterRecord> form={form} layout="vertical">
          <Form.Item name="pendingRegistrationTime" label="需注册时间">
            <DatePicker format="YYYY-MM-DD" style={{ width: 160 }} />
          </Form.Item>

          <Space size="large" style={{ display: 'flex' }}>
            <Form.Item
              name="studentName"
              label="姓名"
              rules={[{ required: true, message: '请输入姓名' }]}
            >
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
            <Form.Item
              name="gender"
              label="性别"
              rules={[{ required: true, message: '请选择性别' }]}
            >
              <Select allowClear>
                <Option value="男">男</Option>
                <Option value="女">女</Option>
              </Select>
            </Form.Item>
          </Space>

          <Form.Item
            name="idCardNumber"
            label="身份证件号"
            rules={[{ required: true, message: '请输入身份证件号' }]}
          >
            <Input />
          </Form.Item>

          <Space size="large" style={{ display: 'flex' }}>
            <Form.Item name="major" label="专业">
              <Input />
            </Form.Item>
            <Form.Item name="educationSystem" label="学制">
              <Input placeholder="如：一年制" />
            </Form.Item>
            <Form.Item name="className" label="班级">
              <Input />
            </Form.Item>
          </Space>

          <Space size="large" style={{ display: 'flex' }}>
            <Form.Item name="nation" label="民族">
              <Input />
            </Form.Item>
            <Form.Item name="politicalStatus" label="政治面貌">
              <Input />
            </Form.Item>
            <Form.Item name="householdType" label="户口性质">
              <Input />
            </Form.Item>
          </Space>

          <Form.Item name="contactPhone" label="联系电话">
            <Input />
          </Form.Item>

          <Form.Item name="householdAddress" label="户口所在地">
            <Input />
          </Form.Item>

          <Space size="large" style={{ display: 'flex' }}>
            <Form.Item name="enrollmentTarget" label="招生对象">
              <Input placeholder="如：应届初中毕业生" />
            </Form.Item>
            <Form.Item name="isMigrantChild" label="是否随迁子女">
              <Select allowClear>
                <Option value="是">是</Option>
                <Option value="否">否</Option>
              </Select>
            </Form.Item>
            <Form.Item name="registrationYear" label="注册年份">
              <Input placeholder="如：202409" />
            </Form.Item>
          </Space>

          <Form.Item name="scholarshipStatus" label="是否享受助学金（曾经/现在/即将享受）">
            <Input />
          </Form.Item>

          <Space size="large" style={{ display: 'flex' }}>
            <Form.Item name="parentName1" label="家长姓名1">
              <Input />
            </Form.Item>
            <Form.Item name="parentPhone1" label="家长1电话">
              <Input />
            </Form.Item>
          </Space>

          <Space size="large" style={{ display: 'flex' }}>
            <Form.Item name="parentName2" label="家长姓名2">
              <Input />
            </Form.Item>
            <Form.Item name="parentPhone2" label="家长2电话">
              <Input />
            </Form.Item>
          </Space>

          <Space size="large" style={{ display: 'flex' }}>
            <Form.Item name="campus" label="神殿归属">
              <Input />
            </Form.Item>
            <Form.Item name="headTeacher" label="班主任">
              <Input />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </div>
  )
}

export default Secondary1YearToRegisterRoster
