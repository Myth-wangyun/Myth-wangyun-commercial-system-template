import React, { useEffect, useMemo, useState } from 'react'
import { App,
  Card,
  Tabs,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Switch,
  Select,
  DatePicker,
  InputNumber,
  Tag,
  Popconfirm,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useCampusStore } from '@/stores/campusStore'
import {
  fetchCampuses,
  fetchMajors,
  fetchTeachers,
  fetchClasses,
  fetchAssignments,
  createCampus,
  updateCampus,
  deleteCampus,
  createMajor,
  updateMajor,
  deleteMajor,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  createClass,
  updateClass,
  deleteClass,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  fetchCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  fetchHomeroomTeachers,
  createHomeroomTeacher,
  updateHomeroomTeacher,
  deleteHomeroomTeacher,
} from '@/services/configMaster'
import type {
  CampusProfile,
  MajorProfile,
  TeacherProfile,
  ClassProfile,
  AssignmentProfile,
  CourseProfile,
  HomeroomTeacherProfile,
} from '@/services/configMaster'

const { Option } = Select

type CampusFormValues = Partial<CampusProfile>
type MajorFormValues = Partial<MajorProfile> & { campus_code?: string }
type TeacherFormValues = Partial<TeacherProfile> & { campus_code?: string }
type ClassFormValues = Omit<Partial<ClassProfile>, 'start_date' | 'end_date'> & {
  campus_code?: string
  start_date?: dayjs.Dayjs | null
  end_date?: dayjs.Dayjs | null
}
type AssignmentFormValues = Omit<Partial<AssignmentProfile>, 'start_date' | 'end_date'> & {
  start_date?: dayjs.Dayjs | null
  end_date?: dayjs.Dayjs | null
}
type CourseFormValues = Partial<CourseProfile> & { campus_code?: string }
type HomeroomTeacherFormValues = Partial<HomeroomTeacherProfile> & { campus_code?: string }

// 兼容后端不同的主键字段命名，保障删除操作有正确的标识
const resolveKey = (record: any, keys: Array<string>) => {
  for (const k of keys) {
    const v = record?.[k]
    if (v !== undefined && v !== null && v !== '') return v
  }
  return undefined
}

const ConfigMasterPage: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus: selectedCampus } = useCampusStore()
  const [campuses, setCampuses] = useState<CampusProfile[]>([])
  const [majors, setMajors] = useState<MajorProfile[]>([])
  const [teachers, setTeachers] = useState<TeacherProfile[]>([])
  const [classes, setClasses] = useState<ClassProfile[]>([])
  const [assignments, setAssignments] = useState<AssignmentProfile[]>([])
  const [courses, setCourses] = useState<CourseProfile[]>([])
  const [homeroomTeachers, setHomeroomTeachers] = useState<HomeroomTeacherProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [teacherCampusFilter, setTeacherCampusFilter] = useState<string>('')
  const [majorCampusFilter, setMajorCampusFilter] = useState<string>('')
  const [homeroomCampusFilter, setHomeroomCampusFilter] = useState<string>('')
  const [classCampusFilter, setClassCampusFilter] = useState<string>('')
  const [courseCampusFilter, setCourseCampusFilter] = useState<string>('')
  const [assignmentTeacherFilter, setAssignmentTeacherFilter] = useState<number | undefined>(undefined)
  const [assignmentClassFilter, setAssignmentClassFilter] = useState<number | undefined>(undefined)

  const [campusModal, setCampusModal] = useState<{ open: boolean; record?: CampusProfile }>({
    open: false,
  })
  const [majorModal, setMajorModal] = useState<{ open: boolean; record?: MajorProfile }>({
    open: false,
  })
  const [teacherModal, setTeacherModal] = useState<{ open: boolean; record?: TeacherProfile }>({
    open: false,
  })
  const [classModal, setClassModal] = useState<{ open: boolean; record?: ClassProfile }>({
    open: false,
  })
  const [assignmentModal, setAssignmentModal] = useState<{
    open: boolean
    record?: AssignmentProfile
  }>({
    open: false,
  })
  const [courseModal, setCourseModal] = useState<{ open: boolean; record?: CourseProfile }>({
    open: false,
  })
  const [homeroomModal, setHomeroomModal] = useState<{
    open: boolean
    record?: HomeroomTeacherProfile
  }>({
    open: false,
  })

  const [campusForm] = Form.useForm<CampusFormValues>()
  const [majorForm] = Form.useForm<MajorFormValues>()
  const [teacherForm] = Form.useForm<TeacherFormValues>()
  const [classForm] = Form.useForm<ClassFormValues>()
  const [assignmentForm] = Form.useForm<AssignmentFormValues>()
  const [courseForm] = Form.useForm<CourseFormValues>()
  const [homeroomForm] = Form.useForm<HomeroomTeacherFormValues>()

  const campusMap = useMemo(
    () =>
      campuses.reduce<Record<string, CampusProfile>>((acc, curr) => {
        acc[curr.name] = curr
        return acc
      }, {}),
    [campuses],
  )
  const teacherMap = useMemo(
    () =>
      teachers.reduce<Record<number, TeacherProfile>>((acc, curr) => {
        acc[curr.id] = curr
        return acc
      }, {}),
    [teachers],
  )
  const filteredTeachers = useMemo(() => {
    if (!teacherCampusFilter) return teachers
    return teachers.filter(t => t.campus_code === teacherCampusFilter)
  }, [teachers, teacherCampusFilter])
  
  const filteredMajors = useMemo(() => {
    if (!majorCampusFilter) return majors
    return majors.filter(m => m.campus_name === majorCampusFilter)
  }, [majors, majorCampusFilter])
  
  const filteredHomeroomTeachers = useMemo(() => {
    if (!homeroomCampusFilter) return homeroomTeachers
    return homeroomTeachers.filter(t => t.campus_name === homeroomCampusFilter)
  }, [homeroomTeachers, homeroomCampusFilter])
  
  const filteredClasses = useMemo(() => {
    if (!classCampusFilter) return classes
    return classes.filter(c => c.campus_name === classCampusFilter)
  }, [classes, classCampusFilter])
  
  const filteredCourses = useMemo(() => {
    if (!courseCampusFilter) return courses
    return courses.filter(c => c.campus_name === courseCampusFilter)
  }, [courses, courseCampusFilter])
  
  const filteredAssignments = useMemo(() => {
    let result = assignments
    if (assignmentTeacherFilter !== undefined) {
      result = result.filter(a => a.teacher_id === assignmentTeacherFilter)
    }
    if (assignmentClassFilter !== undefined) {
      result = result.filter(a => a.class_id === assignmentClassFilter)
    }
    return result
  }, [assignments, assignmentTeacherFilter, assignmentClassFilter])
  
  const majorMap = useMemo(
    () =>
      majors.reduce<Record<number, MajorProfile>>((acc, curr) => {
        acc[curr.id] = curr
        return acc
      }, {}),
    [majors],
  )
  const homeroomMap = useMemo(
    () =>
      homeroomTeachers.reduce<Record<number, HomeroomTeacherProfile>>((acc, curr) => {
        acc[curr.id] = curr
        return acc
      }, {}),
    [homeroomTeachers],
  )

  const loadAll = async () => {
    try {
      setLoading(true)
      const [campusRes, majorRes, teacherRes, classRes, assignmentRes, courseRes] = await Promise.all([
        fetchCampuses(),
        fetchMajors(),
        fetchTeachers(),
        fetchClasses(),
        fetchAssignments(),
        fetchCourses(),
      ])
      let homeroomRes: HomeroomTeacherProfile[] = []
      try {
        homeroomRes = await fetchHomeroomTeachers()
      } catch (error) {
        console.error('加载班主任列表失败', error)
        message.warning('加载班主任列表失败')
      }
      setCampuses(campusRes)
      setMajors(majorRes)
      setTeachers(
        teacherRes.map((t) => ({
          ...t,
          campus_code: t.campus_name || t.campus_code,
          campus_name: t.campus_name || t.campus_code,
        })),
      )
      setClasses(classRes)
      setAssignments(assignmentRes)
      setCourses(courseRes)
      setHomeroomTeachers(homeroomRes)
    } catch (error) {
      console.error('加载配置数据失败', error)
      message.error('加载配置数据失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [])

  // 默认设置为当前选中的神殿（所有筛选器）
  useEffect(() => {
    if (selectedCampus && campuses.length > 0) {
      setTeacherCampusFilter(selectedCampus)
      setMajorCampusFilter(selectedCampus)
      setHomeroomCampusFilter(selectedCampus)
      setClassCampusFilter(selectedCampus)
      setCourseCampusFilter(selectedCampus)
    }
  }, [selectedCampus, campuses])

  const openCampusForm = (record?: CampusProfile) => {
    setCampusModal({ open: true, record })
    if (record) {
      campusForm.setFieldsValue(record)
    } else {
      campusForm.resetFields()
      campusForm.setFieldsValue({ is_active: true })
    }
  }

  const submitCampus = async () => {
    try {
      const values = await campusForm.validateFields()
      if (campusModal.record) {
        await updateCampus(campusModal.record.name, { ...values, is_active: true })
        message.success('已更新神殿')
      } else {
        await createCampus({ ...values, is_active: true })
        message.success('已新增神殿')
      }
      setCampusModal({ open: false })
      loadAll()
    } catch (error) {
      if (error?.errorFields) return
      message.error('保存神殿失败')
    }
  }

  const removeCampus = async (record: CampusProfile) => {
    console.debug('[config-master] 删除神殿 click', record)
    try {
      // 后端删除接口按“神殿名称”匹配，优先 name，其次 code
      const key = resolveKey(record, ['name', 'code'])
      if (!key) {
        message.error('缺少神殿标识，无法删除')
        return
      }
      await deleteCampus(String(key))
      message.success('已删除神殿')
      loadAll()
    } catch (error) {
      console.error('删除神殿失败', error)
      message.error('删除失败')
    }
  }

  const openMajorForm = (record?: MajorProfile) => {
    setMajorModal({ open: true, record })
    if (record) {
      const campus = campuses.find(c => c.name === (record as any).campus_name)
      majorForm.setFieldsValue({
        ...record,
        campus_code: campus?.name || (record as any).campus_name,
      })
    } else {
      majorForm.resetFields()
      // 新增时默认设置为当前选中的神殿
      majorForm.setFieldsValue({ campus_code: selectedCampus || undefined })
    }
  }

  const submitMajor = async () => {
    try {
      const values = await majorForm.validateFields()
      // 将 campus_code 转换为 campus_name
      const campus = campusMap[values.campus_code]
      if (!campus) {
        message.error('请选择有效的神殿')
        return
      }
      const payload = {
        ...values,
        campus_name: campus.name,
        campus_code: undefined, // 后端不需要
      }
      if (majorModal.record) {
        await updateMajor(majorModal.record.id, payload)
        message.success('已更新专业')
      } else {
        await createMajor(payload)
        message.success('已新增专业')
      }
      setMajorModal({ open: false })
      loadAll()
    } catch (error) {
      if (error?.errorFields) return
      message.error('保存专业失败')
    }
  }

  const removeMajor = async (record: MajorProfile) => {
    console.debug('[config-master] 删除专业 click', record)
    try {
      const key = resolveKey(record, ['id'])
      if (!key) {
        message.error('缺少专业标识，无法删除')
        return
      }
      await deleteMajor(Number(key))
      message.success('已删除专业')
      loadAll()
    } catch (error) {
      console.error('删除专业失败', error)
      message.error('删除失败')
    }
  }

  const openTeacherForm = (record?: TeacherProfile) => {
    setTeacherModal({ open: true, record })
    if (record) {
      const campus = campuses.find((c) => c.name === record.campus_name || c.code === record.campus_code)
      teacherForm.setFieldsValue({
        ...record,
        campus_code: campus?.name || record.campus_name || record.campus_code,
      })
    } else {
      teacherForm.resetFields()
      // 新增时默认设置为当前选中的神殿
      teacherForm.setFieldsValue({ participate_kpi: true, is_active: true, campus_code: selectedCampus || undefined })
    }
  }

  const submitTeacher = async () => {
    try {
      const values = await teacherForm.validateFields()
      if (!values.campus_code) {
        message.warning('请选择神殿')
        return
      }
      const campus = campusMap[values.campus_code]
      if (!campus) {
        message.error('请选择有效的神殿')
        return
      }
      const payload = {
        ...values,
        campus_name: campus.name,
        campus_code: undefined, // 后端不需要 code
      }
      if (teacherModal.record) {
        await updateTeacher(teacherModal.record.id, payload)
        message.success('已更新教员')
      } else {
        await createTeacher(payload)
        message.success('已新增教员')
      }
      setTeacherModal({ open: false })
      loadAll()
    } catch (error) {
      if (error?.errorFields) return
      message.error('保存教员失败')
    }
  }

  const removeTeacher = async (record: TeacherProfile) => {
    console.debug('[config-master] 删除教员 click', record)
    try {
      const key = resolveKey(record, ['id'])
      if (!key) {
        message.error('缺少教员标识，无法删除')
        return
      }
      await deleteTeacher(Number(key))
      message.success('已删除教员')
      loadAll()
    } catch (error) {
      console.error('删除教员失败', error)
      message.error('删除失败')
    }
  }

  const openClassForm = (record?: ClassProfile) => {
    setClassModal({ open: true, record })
    if (record) {
      const campus = campuses.find(c => c.name === (record as any).campus_name)
      classForm.setFieldsValue({
        ...record,
        campus_code: campus?.name || (record as any).campus_name,
        start_date: record.start_date ? dayjs(record.start_date) : null,
        end_date: record.end_date ? dayjs(record.end_date) : null,
      })
    } else {
      classForm.resetFields()
      // 新增时默认设置为当前选中的神殿
      classForm.setFieldsValue({ is_active: true, campus_code: selectedCampus || undefined })
    }
  }

  // 根据表单中选择的神殿筛选班主任
  const getFilteredHomeroomTeachersForForm = () => {
    const selectedCampusCode = classForm.getFieldValue('campus_code')
    if (!selectedCampusCode) {
      return homeroomTeachers
    }
    return homeroomTeachers.filter(t => t.campus_name === selectedCampusCode)
  }

  // 处理神殿变化，清空班主任选择
  const handleClassCampusChange = (campusCode: string) => {
    classForm.setFieldValue('homeroom_teacher_id', undefined)
  }

  const submitClass = async () => {
    try {
      const values = await classForm.validateFields()
      // 将 campus_code 转换为 campus_name
      const campus = campusMap[values.campus_code]
      if (!campus) {
        message.error('请选择有效的神殿')
        return
      }
      const payload = {
        ...values,
        campus_name: campus.name,
        campus_code: undefined, // 移除 campus_code，后端不需要
        start_date: values.start_date ? values.start_date.format('YYYY-MM-DD') : undefined,
        end_date: values.end_date ? values.end_date.format('YYYY-MM-DD') : undefined,
      }
      if (classModal.record) {
        await updateClass(classModal.record.id, payload)
        message.success('已更新班级')
      } else {
        await createClass(payload)
        message.success('已新增班级')
      }
      setClassModal({ open: false })
      loadAll()
    } catch (error) {
      if (error?.errorFields) return
      message.error('保存班级失败')
    }
  }

  const removeClass = async (record: ClassProfile) => {
    console.debug('[config-master] 删除班级 click', record)
    try {
      const key = resolveKey(record, ['id'])
      if (!key) {
        message.error('缺少班级标识，无法删除')
        return
      }
      await deleteClass(Number(key))
      message.success('已删除班级')
      loadAll()
    } catch (error) {
      console.error('删除班级失败', error)
      message.error('删除失败')
    }
  }

  const openAssignmentForm = (record?: AssignmentProfile) => {
    setAssignmentModal({ open: true, record })
    if (record) {
      assignmentForm.setFieldsValue({
        ...record,
        start_date: record.start_date ? dayjs(record.start_date) : null,
        end_date: record.end_date ? dayjs(record.end_date) : null,
      })
    } else {
      assignmentForm.resetFields()
      assignmentForm.setFieldsValue({ is_primary: false })
    }
  }

  const submitAssignment = async () => {
    try {
      const values = await assignmentForm.validateFields()
      const payload = {
        ...values,
        start_date: values.start_date ? values.start_date.format('YYYY-MM-DD') : undefined,
        end_date: values.end_date ? values.end_date.format('YYYY-MM-DD') : undefined,
      }
      if (assignmentModal.record) {
        await updateAssignment(assignmentModal.record.id, payload)
        message.success('已更新关联')
      } else {
        await createAssignment(payload)
        message.success('已新增关联')
      }
      setAssignmentModal({ open: false })
      loadAll()
    } catch (error) {
      if (error?.errorFields) return
      message.error('保存关联失败')
    }
  }

  const removeAssignment = async (record: AssignmentProfile) => {
    console.debug('[config-master] 删除关联 click', record)
    try {
      const key = resolveKey(record, ['id'])
      if (!key) {
        message.error('缺少关联标识，无法删除')
        return
      }
      await deleteAssignment(Number(key))
      message.success('已删除关联')
      loadAll()
    } catch (error) {
      console.error('删除关联失败', error)
      message.error('删除失败')
    }
  }

  const openCourseForm = (record?: CourseProfile) => {
    setCourseModal({ open: true, record })
    if (record) {
      const campus = campuses.find((c) => c.name === record.campus_name || c.code === record.campus_code)
      courseForm.setFieldsValue({
        ...record,
        campus_code: campus?.name || record.campus_name || record.campus_code,
      })
    } else {
      courseForm.resetFields()
      // 新增时默认设置为当前选中的神殿
      courseForm.setFieldsValue({ is_active: true, campus_code: selectedCampus || undefined })
    }
  }

  const submitCourse = async () => {
    try {
      const values = await courseForm.validateFields()
      const campus = campusMap[values.campus_code as string]
      if (!campus) {
        message.error('请选择有效的神殿')
        return
      }
      const payload = {
        ...values,
        campus_name: campus.name,
        campus_code: undefined,
      }
      if (courseModal.record) {
        await updateCourse(courseModal.record.id, payload)
        message.success('已更新课程')
      } else {
        await createCourse(payload)
        message.success('已新增课程')
      }
      setCourseModal({ open: false })
      loadAll()
    } catch (error) {
      if (error?.errorFields) return
      message.error('保存课程失败')
    }
  }

  const removeCourse = async (record: CourseProfile) => {
    console.debug('[config-master] 删除课程 click', record)
    try {
      const key = resolveKey(record, ['id'])
      if (!key) {
        message.error('缺少课程标识，无法删除')
        return
      }
      await deleteCourse(Number(key))
      message.success('已删除课程')
      loadAll()
    } catch (error) {
      console.error('删除课程失败', error)
      message.error('删除失败')
    }
  }

  // 班主任（独立表）
  const openHomeroomForm = (record?: HomeroomTeacherProfile) => {
    setHomeroomModal({ open: true, record })
    if (record) {
      const campus = campuses.find((c) => c.name === record.campus_name)
      homeroomForm.setFieldsValue({
        ...record,
        campus_code: campus?.name || record.campus_name,
      })
    } else {
      homeroomForm.resetFields()
      // 新增时默认设置为当前选中的神殿
      homeroomForm.setFieldsValue({ participate_kpi: true, is_active: true, title: '班主任', campus_code: selectedCampus || undefined })
    }
  }

  const submitHomeroomTeacher = async () => {
    try {
      const values = await homeroomForm.validateFields()
      const campus = campusMap[values.campus_code as string]
      if (!campus) {
        message.error('请选择有效的神殿')
        return
      }
      const { campus_code, ...rest } = values
      const payload = {
        ...rest,
        campus_name: campus.name,
        campus_code: undefined,
      }
      if (homeroomModal.record) {
        await updateHomeroomTeacher(homeroomModal.record.id, payload)
        message.success('已更新班主任')
      } else {
        await createHomeroomTeacher(payload)
        message.success('已新增班主任')
      }
      setHomeroomModal({ open: false })
      loadAll()
    } catch (error) {
      if (error?.errorFields) return
      message.error('保存班主任失败')
    }
  }

  const removeHomeroomTeacher = async (record: HomeroomTeacherProfile) => {
    try {
      await deleteHomeroomTeacher(record.id)
      message.success('已删除班主任')
      loadAll()
    } catch (error) {
      message.error('删除失败')
    }
  }

  const campusColumns: ColumnsType<CampusProfile> = [
    { title: '名称', dataIndex: 'name' },
    {
      title: '操作',
      key: 'action',
      width: 160,
      render: (_value, record) => (
        <Space>
          <Button size="small" onClick={() => openCampusForm(record)}>
            编辑
          </Button>
          <Button
            danger
            size="small"
            style={{ pointerEvents: 'auto' }}
            onClick={(e) => {
              e.stopPropagation()
              console.log('[config-master] 点击删除神殿按钮', record)
            }}
          >
            <Popconfirm
              title="确认删除该神殿？"
              okText="删除"
              cancelText="取消"
              onConfirm={(e) => {
                e?.stopPropagation()
                removeCampus(record)
              }}
              onCancel={(e) => e?.stopPropagation()}
            >
              <span>删除</span>
            </Popconfirm>
          </Button>
        </Space>
      ),
    },
  ]

  const majorColumns: ColumnsType<MajorProfile> = [
    {
      title: '神殿',
      dataIndex: 'campus_name',
      render: (name: string) => name,
    },
    { title: '名称', dataIndex: 'name' },
    {
      title: '操作',
      key: 'action',
      width: 160,
      render: (_value, record) => (
        <Space>
          <Button size="small" onClick={() => openMajorForm(record)}>
            编辑
          </Button>
          <Button
            size="small"
            danger
            style={{ pointerEvents: 'auto' }}
            onClick={(e) => {
              e.stopPropagation()
              console.log('[config-master] 点击删除专业按钮', record)
            }}
          >
            <Popconfirm
              title="确认删除该专业？"
              okText="删除"
              cancelText="取消"
              onConfirm={(e) => {
                e?.stopPropagation()
                removeMajor(record)
              }}
              onCancel={(e) => e?.stopPropagation()}
            >
              <span>删除</span>
            </Popconfirm>
          </Button>
        </Space>
      ),
    },
  ]

  const teacherColumns: ColumnsType<TeacherProfile> = [
    { title: '姓名', dataIndex: 'name' },
    {
      title: '神殿',
      dataIndex: 'campus_name',
      render: (_: string, record) => record.campus_name || record.campus_code || '',
    },
    { title: '职称', dataIndex: 'title' },
    { title: '手机号', dataIndex: 'phone' },
    {
      title: 'KPI',
      dataIndex: 'participate_kpi',
      render: (v: boolean) => <Tag color={v ? 'blue' : 'default'}>{v ? '参与' : '不参与'}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      render: (v: boolean) => <Tag color={v ? 'green' : 'red'}>{v ? '在职' : '停用'}</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_value, record) => (
        <Space>
          <Button size="small" onClick={() => openTeacherForm(record)}>
            编辑
          </Button>
          <Button
            danger
            size="small"
            style={{ pointerEvents: 'auto' }}
            onClick={(e) => {
              e.stopPropagation()
              console.log('[config-master] 点击删除教员按钮', record)
            }}
          >
            <Popconfirm
              title="确认删除该教员？"
              okText="删除"
              cancelText="取消"
              onConfirm={(e) => {
                e?.stopPropagation()
                removeTeacher(record)
              }}
              onCancel={(e) => e?.stopPropagation()}
            >
              <span>删除</span>
            </Popconfirm>
          </Button>
        </Space>
      ),
    },
  ]

  const classColumns: ColumnsType<ClassProfile> = [
    { title: '名称', dataIndex: 'class_name' },
    {
      title: '神殿',
      dataIndex: 'campus_name',
      render: (name: string) => name,
    },
    {
      title: '专业',
      dataIndex: 'major_name',
      render: (name?: string, record?: ClassProfile) => name || (record?.major_id ? majors.find((m) => m.id === record.major_id)?.name : '-') || '-',
    },
    {
      title: '班主任',
      dataIndex: 'homeroom_teacher_name',
      render: (name?: string, record?: ClassProfile) => name || (record?.homeroom_teacher_id ? homeroomMap[record.homeroom_teacher_id]?.name : '-') || '-',
    },
    {
      title: '学制',
      dataIndex: 'program_length',
      render: (v?: string) => v || '-',
    },
    { title: '开班日期', dataIndex: 'start_date', render: (v?: string) => v || '-' },
    { title: '学生人数', dataIndex: 'student_capacity', render: (v?: number) => v ?? '-' },
    {
      title: '状态',
      dataIndex: 'is_active',
      render: (v: boolean) => <Tag color={v ? 'green' : 'red'}>{v ? '在读' : '停用'}</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_value, record) => (
        <Space>
          <Button size="small" onClick={() => openClassForm(record)}>
            编辑
          </Button>
          <Button
            danger
            size="small"
            style={{ pointerEvents: 'auto' }}
            onClick={(e) => {
              e.stopPropagation()
              console.log('[config-master] 点击删除班级按钮', record)
            }}
          >
            <Popconfirm
              title="确认删除该班级？"
              okText="删除"
              cancelText="取消"
              onConfirm={(e) => {
                e?.stopPropagation()
                removeClass(record)
              }}
              onCancel={(e) => e?.stopPropagation()}
            >
              <span>删除</span>
            </Popconfirm>
          </Button>
        </Space>
      ),
    },
  ]

  const courseColumns: ColumnsType<CourseProfile> = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    { title: '课程名称', dataIndex: 'course_name' },
    {
      title: '神殿',
      dataIndex: 'campus_name',
      render: (_: string, record) => record.campus_name || record.campus_code || '',
    },
    {
      title: '关联专业',
      dataIndex: 'major_id',
      render: (id?: number | null) => {
        if (!id) return '—'
        const major = majorMap[id]
        if (!major) return id
        return `${major.name}（${major.campus_name}）`
      },
    },
    { title: '描述', dataIndex: 'description', ellipsis: true },
    {
      title: '启用',
      dataIndex: 'is_active',
      render: (v: boolean) => <Tag color={v ? 'green' : 'default'}>{v ? '是' : '否'}</Tag>,
    },
    { title: '更新时间', dataIndex: 'updated_at' },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_value, record) => (
        <Space>
          <Button size="small" onClick={() => openCourseForm(record)}>
            编辑
          </Button>
          <Button
            danger
            size="small"
            style={{ pointerEvents: 'auto' }}
            onClick={(e) => {
              e.stopPropagation()
              console.log('[config-master] 点击删除课程按钮', record)
            }}
          >
            <Popconfirm
              title="确认删除该课程？"
              okText="删除"
              cancelText="取消"
              onConfirm={(e) => {
                e?.stopPropagation()
                removeCourse(record)
              }}
              onCancel={(e) => e?.stopPropagation()}
            >
              <span>删除</span>
            </Popconfirm>
          </Button>
        </Space>
      ),
    },
  ]

  const assignmentColumns: ColumnsType<AssignmentProfile> = [
    {
      title: '教员',
      dataIndex: 'teacher_id',
      render: (id: number) => teacherMap[id]?.name || id,
    },
    {
      title: '班级',
      dataIndex: 'class_id',
      render: (id: number) => classes.find((item) => item.id === id)?.class_name || id,
    },
    { title: '角色', dataIndex: 'role' },
    {
      title: '是否负责强化',
      dataIndex: 'is_primary',
      render: (v: boolean) => <Tag color={v ? 'blue' : 'default'}>{v ? '是' : '否'}</Tag>,
    },
    {
      title: '时间',
      key: 'date',
      render: (_value, record) =>
        `${record.start_date || '—'} ~ ${record.end_date || ''}`.trim() || '—',
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_value, record) => (
        <Space>
          <Button size="small" onClick={() => openAssignmentForm(record)}>
            编辑
          </Button>
          <Button
            size="small"
            danger
            style={{ pointerEvents: 'auto' }}
            onClick={(e) => {
              e.stopPropagation()
              console.log('[config-master] 点击删除关联按钮', record)
            }}
          >
            <Popconfirm
              title="确认删除该关联？"
              okText="删除"
              cancelText="取消"
              onConfirm={(e) => {
                e?.stopPropagation()
                removeAssignment(record)
              }}
              onCancel={(e) => e?.stopPropagation()}
            >
              <span>删除</span>
            </Popconfirm>
          </Button>
        </Space>
      ),
    },
  ]

  const campusTab = (
    <>
      <Space style={{ marginBottom: 12 }}>
        <Button type="primary" onClick={() => openCampusForm()}>
          新增神殿
        </Button>
      </Space>
      <Table
        rowKey={(record) => resolveKey(record, ['name', 'id']) as React.Key}
        columns={campusColumns}
        dataSource={campuses}
        loading={loading}
      />
      <Modal
        title={campusModal.record ? '编辑神殿' : '新增神殿'}
        open={campusModal.open}
        onCancel={() => setCampusModal({ open: false })}
        onOk={submitCampus}
        destroyOnClose
      >
        <Form form={campusForm} layout="vertical">
          <Form.Item name="name" label="神殿名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )

  const majorTab = (
    <>
      <Space style={{ marginBottom: 12 }}>
        <Button type="primary" onClick={() => openMajorForm()}>
          新增专业
        </Button>
        <Select
          placeholder="筛选神殿"
          value={majorCampusFilter || undefined}
          onChange={(value) => setMajorCampusFilter(value || '')}
          style={{ width: 200 }}
          allowClear
        >
          <Option value="">全部神殿</Option>
          {campuses.map((c) => (
            <Option key={c.name} value={c.name}>
              {c.name}
            </Option>
          ))}
        </Select>
      </Space>
      <Table
        rowKey={(record) => resolveKey(record, ['id']) as React.Key}
        columns={majorColumns}
        dataSource={filteredMajors}
        loading={loading}
        scroll={{ x: 600 }}
      />
      <Modal
        title={majorModal.record ? '编辑专业' : '新增专业'}
        open={majorModal.open}
        onCancel={() => setMajorModal({ open: false })}
        onOk={submitMajor}
        destroyOnClose
      >
        <Form form={majorForm} layout="vertical">
          <Form.Item name="campus_code" label="所属神殿" rules={[{ required: true }]}>
            <Select placeholder="选择神殿">
              {campuses.map((c) => (
                <Option key={c.name} value={c.name}>
                  {c.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="name" label="专业名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )

  const teacherTab = (
    <>
      <Space style={{ marginBottom: 12 }}>
        <Button type="primary" onClick={() => openTeacherForm()}>
          新增教员
        </Button>
        <Select
          placeholder="筛选神殿"
          value={teacherCampusFilter || undefined}
          onChange={(value) => setTeacherCampusFilter(value || '')}
          style={{ width: 200 }}
          allowClear
        >
          <Option value="">全部神殿</Option>
          {campuses.map((c) => (
            <Option key={c.name} value={c.name}>
              {c.name}
            </Option>
          ))}
        </Select>
      </Space>
      <Table
        rowKey={(record) => resolveKey(record, ['id']) as React.Key}
        columns={teacherColumns}
        dataSource={filteredTeachers}
        loading={loading}
        scroll={{ x: 800 }}
      />
      <Modal
        title={teacherModal.record ? '编辑教员' : '新增教员'}
        open={teacherModal.open}
        onCancel={() => setTeacherModal({ open: false })}
        onOk={submitTeacher}
        destroyOnClose
        width={520}
      >
        <Form form={teacherForm} layout="vertical">
          <Form.Item name="name" label="姓名" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="campus_code" label="所属神殿" rules={[{ required: true }]}>
            <Select placeholder="选择神殿">
              {campuses.map((c) => (
                <Option key={c.name} value={c.name}>
                  {c.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="teacher_code" label="工号">
            <Input />
          </Form.Item>
          <Form.Item name="title" label="职位/职称">
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="电话">
            <Input />
          </Form.Item>
          <Form.Item name="email" label="邮箱">
            <Input />
          </Form.Item>
          <Form.Item name="specialty" label="专业方向">
            <Input />
          </Form.Item>
          <Form.Item name="participate_kpi" label="参与KPI" valuePropName="checked">
            <Switch defaultChecked />
          </Form.Item>
          <Form.Item name="is_active" label="在职状态" valuePropName="checked">
            <Switch defaultChecked />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )

  const classTab = (
    <>
      <Space style={{ marginBottom: 12 }}>
        <Button type="primary" onClick={() => openClassForm()}>
          新增班级
        </Button>
        <Select
          placeholder="筛选神殿"
          value={classCampusFilter || undefined}
          onChange={(value) => setClassCampusFilter(value || '')}
          style={{ width: 200 }}
          allowClear
        >
          <Option value="">全部神殿</Option>
          {campuses.map((c) => (
            <Option key={c.name} value={c.name}>
              {c.name}
            </Option>
          ))}
        </Select>
      </Space>
      <Table
        rowKey={(record) => resolveKey(record, ['id']) as React.Key}
        columns={classColumns}
        dataSource={filteredClasses}
        loading={loading}
        scroll={{ x: 1100 }}
      />
      <Modal
        title={classModal.record ? '编辑班级' : '新增班级'}
        open={classModal.open}
        onCancel={() => setClassModal({ open: false })}
        onOk={submitClass}
        destroyOnClose
        width={650}
      >
        <Form form={classForm} layout="vertical">
          <Form.Item name="class_name" label="班级名称" rules={[{ required: true }]}>
            <Input placeholder="如：T132、Y32、S32106" />
          </Form.Item>
          <Form.Item name="campus_code" label="神殿" rules={[{ required: true }]}>
            <Select placeholder="选择神殿" onChange={handleClassCampusChange}>
              {campuses.map((c) => (
                <Option key={c.name} value={c.name}>
                  {c.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="major_id" label="专业">
            <Select allowClear placeholder="选择专业">
              {majors.map((m) => (
                <Option key={m.id} value={m.id}>
                  {m.name}{m.campus_name ? ` (${m.campus_name})` : ''}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item 
            noStyle 
            shouldUpdate={(prevValues, currentValues) => prevValues.campus_code !== currentValues.campus_code}
          >
            {() => (
              <Form.Item name="homeroom_teacher_id" label="班主任">
                <Select allowClear placeholder="选择班主任">
                  {getFilteredHomeroomTeachersForForm().map((t) => (
                    <Option key={t.id} value={t.id}>
                      {t.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            )}
          </Form.Item>
          <Form.Item
            name="program_length"
            label="学制"
            rules={[{ required: true, message: '请选择学制' }]}
          >
            <Select placeholder="请选择学制" allowClear>
              <Option value="6个月">6个月</Option>
              <Option value="20个月">20个月</Option>
              <Option value="两年">两年</Option>
              <Option value="三年">三年</Option>
            </Select>
          </Form.Item>
          <Form.Item name="status" label="状态说明">
            <Input />
          </Form.Item>
          <Form.Item 
            label="开班日期" 
            name="start_date"
            rules={[{ required: true, message: '请选择开班日期' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="结课日期" name="end_date">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="学生人数" name="student_capacity">
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="is_active" label="启用状态" valuePropName="checked">
            <Switch defaultChecked />
          </Form.Item>
          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )

  const courseTab = (
    <>
      <Space style={{ marginBottom: 12 }}>
        <Button type="primary" onClick={() => openCourseForm()}>
          新增课程
        </Button>
        <Select
          placeholder="筛选神殿"
          value={courseCampusFilter || undefined}
          onChange={(value) => setCourseCampusFilter(value || '')}
          style={{ width: 200 }}
          allowClear
        >
          <Option value="">全部神殿</Option>
          {campuses.map((c) => (
            <Option key={c.name} value={c.name}>
              {c.name}
            </Option>
          ))}
        </Select>
      </Space>
      <Table
        rowKey={(record) => resolveKey(record, ['id']) as React.Key}
        columns={courseColumns}
        dataSource={filteredCourses}
        loading={loading}
        scroll={{ x: 800 }}
      />
      <Modal
        title={courseModal.record ? '编辑课程' : '新增课程'}
        open={courseModal.open}
        onCancel={() => setCourseModal({ open: false })}
        onOk={submitCourse}
        destroyOnClose
        width={520}
      >
        <Form form={courseForm} layout="vertical">
          <Form.Item name="campus_code" label="所属神殿" rules={[{ required: true }]}>
            <Select placeholder="选择神殿">
              {campuses.map((c) => (
                <Option key={c.name} value={c.name}>
                  {c.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="course_name" label="课程名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="major_id" label="关联专业">
            <Select allowClear placeholder="选择专业">
              {majors.map((m) => (
                <Option key={m.id} value={m.id}>
                  {m.name}（{m.campus_name}）
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="description" label="课程描述">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="is_active" label="启用状态" valuePropName="checked">
            <Switch defaultChecked />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )

  const homeroomColumns: ColumnsType<HomeroomTeacherProfile> = [
    { title: '姓名', dataIndex: 'name' },
    { title: '神殿', dataIndex: 'campus_name' },
    { title: '职称', dataIndex: 'title' },
    { title: '手机号', dataIndex: 'phone' },
    {
      title: 'KPI',
      dataIndex: 'participate_kpi',
      render: (v: boolean) => <Tag color={v ? 'blue' : 'default'}>{v ? '参与' : '不参与'}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      render: (v: boolean) => <Tag color={v ? 'green' : 'red'}>{v ? '在职' : '停用'}</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_value, record) => (
        <Space>
          <Button size="small" onClick={() => openHomeroomForm(record)}>
            编辑
          </Button>
          <Button size="small" danger style={{ pointerEvents: 'auto' }}>
            <Popconfirm
              title="确认删除该班主任？"
              okText="删除"
              cancelText="取消"
              onConfirm={(e) => {
                e?.stopPropagation()
                removeHomeroomTeacher(record)
              }}
              onCancel={(e) => e?.stopPropagation()}
            >
              <span>删除</span>
            </Popconfirm>
          </Button>
        </Space>
      ),
    },
  ]

  const homeroomTeacherTab = (
    <>
      <Space style={{ marginBottom: 12 }}>
        <Button type="primary" onClick={() => openHomeroomForm()}>
          新增班主任
        </Button>
        <Select
          placeholder="筛选神殿"
          value={homeroomCampusFilter || undefined}
          onChange={(value) => setHomeroomCampusFilter(value || '')}
          style={{ width: 200 }}
          allowClear
        >
          <Option value="">全部神殿</Option>
          {campuses.map((c) => (
            <Option key={c.name} value={c.name}>
              {c.name}
            </Option>
          ))}
        </Select>
      </Space>
      <Table
        rowKey={(record) => resolveKey(record, ['id']) as React.Key}
        columns={homeroomColumns}
        dataSource={filteredHomeroomTeachers}
        loading={loading}
        scroll={{ x: 800 }}
      />
      <Modal
        title={homeroomModal.record ? '编辑班主任' : '新增班主任'}
        open={homeroomModal.open}
        onCancel={() => setHomeroomModal({ open: false })}
        onOk={submitHomeroomTeacher}
        destroyOnClose
        width={520}
      >
        <Form form={homeroomForm} layout="vertical">
          <Form.Item name="name" label="姓名" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="campus_code" label="所属神殿" rules={[{ required: true }]}>
            <Select placeholder="选择神殿">
              {campuses.map((c) => (
                <Option key={c.name} value={c.name}>
                  {c.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="teacher_code" label="工号">
            <Input />
          </Form.Item>
          <Form.Item name="title" label="职位/职称">
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="电话">
            <Input />
          </Form.Item>
          <Form.Item name="email" label="邮箱">
            <Input />
          </Form.Item>
          <Form.Item name="specialty" label="专业方向">
            <Input />
          </Form.Item>
          <Form.Item name="participate_kpi" label="参与KPI" valuePropName="checked">
            <Switch defaultChecked />
          </Form.Item>
          <Form.Item name="is_active" label="在职状态" valuePropName="checked">
            <Switch defaultChecked />
          </Form.Item>
          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )

  const assignmentTab = (
    <>
      <Space style={{ marginBottom: 12 }}>
        <Button type="primary" onClick={() => openAssignmentForm()}>
          新增教员-班级关联
        </Button>
        <Select
          placeholder="筛选教员"
          value={assignmentTeacherFilter}
          onChange={(value) => setAssignmentTeacherFilter(value)}
          style={{ width: 200 }}
          allowClear
          showSearch
          optionFilterProp="children"
        >
          {teachers.map((t) => (
            <Option key={t.id} value={t.id}>
              {t.name}（{t.campus_name || t.campus_code || ''}）
            </Option>
          ))}
        </Select>
        <Select
          placeholder="筛选班级"
          value={assignmentClassFilter}
          onChange={(value) => setAssignmentClassFilter(value)}
          style={{ width: 200 }}
          allowClear
          showSearch
          optionFilterProp="children"
        >
          {classes.map((c) => (
            <Option key={c.id} value={c.id}>
              {c.class_name}（{c.campus_name || '未知神殿'}）
            </Option>
          ))}
        </Select>
      </Space>
      <Table
        rowKey={(record) => resolveKey(record, ['id']) as React.Key}
        columns={assignmentColumns}
        dataSource={filteredAssignments}
        loading={loading}
        scroll={{ x: 800 }}
      />
      <Modal
        title={assignmentModal.record ? '编辑关联' : '新增关联'}
        open={assignmentModal.open}
        onCancel={() => setAssignmentModal({ open: false })}
        onOk={submitAssignment}
        destroyOnClose
        width={520}
      >
        <Form form={assignmentForm} layout="vertical">
          <Form.Item name="teacher_id" label="教员" rules={[{ required: true }]}>
            <Select placeholder="选择教员" showSearch optionFilterProp="children">
              {(selectedCampus ? teachers.filter(t => t.campus_name === selectedCampus) : teachers).map((t) => (
                <Option key={t.id} value={t.id}>
                  {t.name}（{t.campus_name || t.campus_code || ''}）
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="class_id" label="班级" rules={[{ required: true }]}>
            <Select placeholder="选择班级" showSearch optionFilterProp="children">
              {(selectedCampus ? classes.filter(c => c.campus_name === selectedCampus) : classes).map((c) => (
                <Option key={c.id} value={c.id}>
                  {c.class_name}（{c.campus_name || '未知神殿'}）
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="role" label="角色" rules={[{ required: true }]}>
            <Input placeholder="如：班主任/授课教师" />
          </Form.Item>
          <Form.Item name="is_primary" label="是否负责强化" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="start_date" label="开始日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="end_date" label="结束日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <Tabs
          defaultActiveKey="campus"
          items={[
            { key: 'campus', label: '神殿管理', children: campusTab },
            { key: 'major', label: '专业管理', children: majorTab },
            { key: 'teacher', label: '教员管理', children: teacherTab },
            { key: 'homeroom', label: '班主任管理', children: homeroomTeacherTab },
            { key: 'class', label: '班级管理', children: classTab },
            { key: 'course', label: '课程管理', children: courseTab },
            { key: 'assignment', label: '教员-班级关联', children: assignmentTab },
          ]}
        />
      </Card>
    </div>
  )
}

export default ConfigMasterPage