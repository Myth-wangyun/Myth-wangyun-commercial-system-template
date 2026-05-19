// 教化司 神殿 -> 学员就业 -> 班级档案表 -> 班级列表
// 从 config.classes 获取班级数据，同时自动同步到 teaching_quality.班级列表
import React, { useState, useEffect } from 'react'
import { App,
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Popconfirm,
  DatePicker,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FileTextOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useNavigate } from 'react-router-dom'
import { useCampusStore } from '@/stores/campusStore'
import dayjs from 'dayjs'
import { 
  fetchClasses, 
  createClass, 
  updateClass, 
  deleteClass,
  fetchHomeroomTeachers,
  fetchMajors,
  type ClassProfile,
  type HomeroomTeacherProfile,
  type MajorProfile,
} from '@/services/configMaster'

const { Option } = Select

// 兼容旧的中文字段接口
interface ClassInfo {
  id: number
  班级名称: string
  神殿: string
  班主任: string
  班主任id?: number
  专业: string
  专业id?: number
  学制: string
  开班时间: string
  学生人数: number
  备注: string
  创建时间: string
  更新时间: string
}

interface ClassListPageProps {
  onClassSelect?: (className: string, campus: string) => void
}

// 将 ClassProfile 转换为 ClassInfo（中文字段）
const convertToClassInfo = (profile: ClassProfile): ClassInfo => ({
  id: profile.id,
  班级名称: profile.class_name,
  神殿: profile.campus_name,
  班主任: profile.homeroom_teacher_name || '',
  班主任id: profile.homeroom_teacher_id || undefined,
  专业: profile.major_name || '',
  专业id: profile.major_id || undefined,
  学制: profile.program_length || '',
  开班时间: profile.start_date || '',
  学生人数: profile.student_capacity || 0,
  备注: profile.notes || '',
  创建时间: profile.created_at || '',
  更新时间: profile.updated_at || '',
})

const ClassListPage: React.FC<ClassListPageProps> = ({ onClassSelect }) => {
  const { message } = App.useApp()
  const navigate = useNavigate()
  const { currentCampus } = useCampusStore()
  const [dataSource, setDataSource] = useState<ClassInfo[]>([])
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<ClassInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [homeroomTeachers, setHomeroomTeachers] = useState<HomeroomTeacherProfile[]>([])
  const [majors, setMajors] = useState<MajorProfile[]>([])
  const [form] = Form.useForm()

  // 统一神殿名称比较：去掉"神殿"后缀并去空格
  const normalizeCampusName = (name?: string | null) => (name ?? '').replace(/神殿$/, '').trim()

  // 从配置中心加载班级数据
  const loadData = async () => {
    setLoading(true)
    try {
      const campusName = normalizeCampusName(currentCampus)
      console.log('[班级列表] 从配置中心加载班级数据, 神殿:', campusName)
      
      const classes = await fetchClasses({ campus_name: campusName, active: true })
      console.log('[班级列表] 获取到班级数据:', classes.length, '条')
      
      // 转换为中文字段格式
      const classInfoList = classes.map(convertToClassInfo)
      setDataSource(classInfoList)
    } catch (error) {
      console.error('加载数据失败:', error)
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  // 加载班主任和专业列表
  const loadOptions = async () => {
    try {
      const campusName = normalizeCampusName(currentCampus)
      const [teachers, majorList] = await Promise.all([
        fetchHomeroomTeachers({ campus_name: campusName, active: true }),
        fetchMajors({ campus_name: campusName, active: true }),
      ])
      setHomeroomTeachers(teachers)
      setMajors(majorList)
    } catch (error) {
      console.error('加载选项失败:', error)
    }
  }

  useEffect(() => {
    loadData()
    loadOptions()
  }, [currentCampus])

  // 打开新增/编辑对话框
  const handleAdd = () => {
    setEditingRecord(null)
    form.resetFields()
    form.setFieldsValue({
      campus_name: normalizeCampusName(currentCampus),
      is_active: true,
    })
    setIsModalVisible(true)
  }

  const handleEdit = (record: ClassInfo) => {
    setEditingRecord(record)
    form.setFieldsValue({
      class_name: record.班级名称,
      campus_name: record.神殿,
      homeroom_teacher_id: record.班主任id,
      major_id: record.专业id,
      program_length: record.学制,
      start_date: record.开班时间 ? dayjs(record.开班时间) : null,
      student_capacity: record.学生人数,
      notes: record.备注,
      is_active: true,
    })
    setIsModalVisible(true)
  }

  // 提交表单 (新增或编辑)
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      
      // 获取班主任和专业名称
      const selectedTeacher = homeroomTeachers.find(t => t.id === values.homeroom_teacher_id)
      const selectedMajor = majors.find(m => m.id === values.major_id)
      
      const payload: Partial<ClassProfile> = {
        class_name: values.class_name,
        campus_name: values.campus_name,
        homeroom_teacher_id: values.homeroom_teacher_id || null,
        homeroom_teacher_name: selectedTeacher?.name || values.homeroom_teacher_name || null,
        major_id: values.major_id || null,
        major_name: selectedMajor?.name || values.major_name || null,
        program_length: values.program_length || null,
        start_date: values.start_date ? values.start_date.format('YYYY-MM-DD') : null,
        student_capacity: Number(values.student_capacity) || 0,
        notes: values.notes || null,
        is_active: true,
      }

      if (editingRecord) {
        await updateClass(editingRecord.id, payload)
        message.success('编辑成功')
      } else {
        await createClass(payload)
        message.success('新增成功')
      }
      
      setIsModalVisible(false)
      loadData() // 重新加载数据
    } catch (error) {
      console.error('提交失败:', error)
      message.error((error as Error).message || '提交失败')
    }
  }

  // 删除
  const handleDelete = async (id: number) => {
    try {
      await deleteClass(id)
      message.success('删除成功')
      loadData() // 重新加载数据
    } catch (error) {
      console.error('删除失败:', error)
      message.error('删除失败')
    }
  }

  // 查看班级档案
  const handleViewClassFile = (record: ClassInfo) => {
    if (onClassSelect) {
      onClassSelect(record.班级名称, record.神殿)
    } else {
      navigate(
        `/teaching-quality/campus/class-file-record?class=${encodeURIComponent(record.班级名称)}&campus=${encodeURIComponent(record.神殿)}`,
      )
    }
  }

  const columns: ColumnsType<ClassInfo> = [
    {
      title: '序号',
      key: 'serialNumber',
      width: 70,
      align: 'center',
      render: (_, __, index) => index + 1,
    },
    { title: '班级名称', dataIndex: '班级名称', key: 'className', width: 150, align: 'center' },
    { title: '神殿', dataIndex: '神殿', key: 'campus', width: 120, align: 'center' },
    { title: '班主任', dataIndex: '班主任', key: 'headTeacher', width: 120, align: 'center' },
    { title: '专业', dataIndex: '专业', key: 'major', width: 150, align: 'center' },
    { title: '学制', dataIndex: '学制', key: 'programLength', width: 120, align: 'center' },
    { title: '开班时间', dataIndex: '开班时间', key: 'openingDate', width: 120, align: 'center' },
    { title: '学生人数', dataIndex: '学生人数', key: 'studentCount', width: 100, align: 'center' },
    { title: '备注', dataIndex: '备注', key: 'remark', width: 200, align: 'left', ellipsis: true },
    {
      title: '操作',
      key: 'action',
      width: 200,
      align: 'center',
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" icon={<FileTextOutlined />} onClick={() => handleViewClassFile(record)}>查看档案</Button>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm title="确定要删除这个班级吗？" onConfirm={() => handleDelete(record.id)} okText="确定" cancelText="取消">
            <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <Card
        title="班级列表"
        extra={
          <Space>
            <Button onClick={loadData}>刷新</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增班级</Button>
          </Space>
        }
      >
        <Table<ClassInfo>
          columns={columns}
          dataSource={dataSource}
          rowKey="id"
          loading={loading}
          pagination={{ defaultPageSize: 20, showSizeChanger: true, showTotal: (total) => `共 ${total} 个班级` }}
          scroll={{ x: 1200 }}
          size="small"
          bordered
        />
      </Card>

      <Modal
        title={editingRecord ? '编辑班级' : '新增班级'}
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={() => setIsModalVisible(false)}
        width={600}
        okText="保存"
        cancelText="取消"
        maskClosable={false}
      >
        <Form form={form} layout="vertical" initialValues={{ student_capacity: 0, is_active: true }}>
          <Form.Item name="class_name" label="班级名称" rules={[{ required: true, message: '请输入班级名称' }]}>
            <Input placeholder="如：T132、Y32、S32106" />
          </Form.Item>
          <Form.Item name="campus_name" label="神殿" rules={[{ required: true, message: '请输入神殿' }]}>
            <Input placeholder="如：盛邦、晋美" disabled />
          </Form.Item>
          <Form.Item name="homeroom_teacher_id" label="班主任">
            <Select allowClear placeholder="选择班主任" showSearch optionFilterProp="children">
              {homeroomTeachers.map((t) => (
                <Option key={t.id} value={t.id}>{t.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="major_id" label="专业">
            <Select allowClear placeholder="选择专业" showSearch optionFilterProp="children">
              {majors.map((m) => (
                <Option key={m.id} value={m.id}>{m.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="program_length" label="学制">
            <Input placeholder="请输入学制，例如：1年、1.5年、两年制" />
          </Form.Item>
          <Form.Item name="start_date" label="开班时间">
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item name="student_capacity" label="学生人数">
            <Input type="number" min={0} placeholder="请输入学生人数" />
          </Form.Item>
          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={3} placeholder="请输入备注信息" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default ClassListPage
