import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { App, Card, Table, Input, InputNumber, Select, Space, Button, ConfigProvider, Popover, Tag, Modal, Form, DatePicker, Tabs } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { useCampusStore } from '@/stores/campusStore'
import { buildApiUrl } from '@/utils/apiBase'

// --- 类型定义 ---
// 后端返回的单个学生信息
interface StudentData {
  serialNumber: number
  studentName: string
  studentPhone: string
  parentPhone: string
  gender: string
  headTeacher: string
  checkInDate: string
  checkOutDate: string
  roomBedCount: number
  occupiedCount: number
  remainingBeds: number
  suitableNewBeds: number
  roomType: string
  isLiving: string
  unitPrice: number
  deposit: number
  y22DecAmount: number
  y22DecPeriod: string
  y22DecHeating: number
  y22DecNextAmount: number
  y22DecNextTime: string
  y23JanAmount: number
  y23JanPeriod: string
  y23JanHeating: number
  y23JanNextAmount: number
  y23JanNextTime: string
  y23FebAmount: number
  y23FebPeriod: string
  y23FebHeating: number
  y23FebNextAmount: number
  y23FebNextTime: string
  y23MarAmount: number
  y23MarPeriod: string
  y23MarHeating: number
  y23MarNextAmount: number
  y23MarNextTime: string
  y23AprAmount: number
  y23AprPeriod: string
  y23AprHeating: number
  y23AprNextAmount: number
  y23AprNextTime: string
  y23MayAmount: number
  y23MayPeriod: string
  y23MayHeating: number
  y23MayNextAmount: number
  y23MayNextTime: string
  y23JunAmount: number
  y23JunPeriod: string
  y23JunHeating: number
  y23JunNextAmount: number
  y23JunNextTime: string
  y23JulAmount: number
  y23JulPeriod: string
  y23JulHeating: number
  y23JulNextAmount: number
  y23JulNextTime: string
  y23AugAmount: number
  y23AugPeriod: string
  y23AugHeating: number
  y23AugNextAmount: number
  y23AugNextTime: string
  y23SepAmount: number
  y23SepPeriod: string
  y23SepHeating: number
  y23SepNextAmount: number
  y23SepNextTime: string
  y23OctAmount: number
  y23OctPeriod: string
  y23OctHeating: number
  y23OctNextAmount: number
  y23OctNextTime: string
  y23NovAmount: number
  y23NovPeriod: string
  y23NovHeating: number
  y23NovNextAmount: number
  y23NovNextTime: string
  y23DecAmount: number
  y23DecPeriod: string
  y23DecHeating: number
  y23DecNextAmount: number
  y23DecNextTime: string
  subtotal: number
  remarks: string
}

// 往任管理老师信息
interface PastManagerInfo {
  name: string // 管理老师姓名
  startDate: string // 开始日期
  endDate: string // 结束日期
}

// 后端返回的宿舍分组信息
interface DormitoryGroup {
  dormName: string
  manager?: string
  pastManagers?: PastManagerInfo[] // 往任管理老师列表（有序）
  students: StudentData[]
}

// 用于 Table 渲染的扁平化学生行数据结构
interface FlatStudentRow extends Partial<StudentData> {
  key: string // 唯一 key，用于 React
  dormName: string
  manager?: string
  pastManagers?: PastManagerInfo[] // 往任管理老师列表（有序）
  serialNumber?: number
  groupIndex: number // 分组索引，便于定位宿舍
  // 用于 rowSpan 计算
  isFirstInGroup: boolean
  groupSize: number
  isPlaceholder: boolean // 标记是否为空宿舍的占位行
  isGroupTotal?: boolean // 分组合计行
}

const YES_NO_OPTIONS = [
  { label: '是', value: '是' },
  { label: '否', value: '否' },
]

// 往任管理老师编辑组件
interface PastManagersEditorProps {
  managers: PastManagerInfo[]
  groupIndex: number
  onUpdate: (groupIndex: number, managerIndex: number, field: keyof PastManagerInfo, value: string) => void
  onAdd: (groupIndex: number, managerData?: PastManagerInfo) => void
  onRemove: (groupIndex: number, managerIndex: number) => void
}

const PastManagersEditor: React.FC<PastManagersEditorProps> = ({
  managers,
  groupIndex,
  onUpdate,
  onAdd,
  onRemove,
}) => {
  const { message, modal } = App.useApp()
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [form] = Form.useForm()

  const handleEdit = (index: number) => {
    const manager = managers[index]
    form.setFieldsValue({
      name: manager.name,
      startDate: manager.startDate ? dayjs(manager.startDate) : null,
      endDate: manager.endDate ? dayjs(manager.endDate) : null,
    })
    setEditingIndex(index)
  }

  const handleSave = () => {
    form.validateFields().then((values) => {
      if (editingIndex !== null && editingIndex >= 0) {
        onUpdate(groupIndex, editingIndex, 'name', values.name)
        onUpdate(groupIndex, editingIndex, 'startDate', values.startDate ? dayjs(values.startDate).format('YYYY-MM-DD') : '')
        onUpdate(groupIndex, editingIndex, 'endDate', values.endDate ? dayjs(values.endDate).format('YYYY-MM-DD') : '')
        setEditingIndex(null)
        form.resetFields()
        message.success('已更新')
      }
    })
  }

  const handleCancel = () => {
    setEditingIndex(null)
    form.resetFields()
  }

  const handleAdd = () => {
    form.setFieldsValue({
      name: '',
      startDate: null,
      endDate: null,
    })
    setEditingIndex(-1) // -1 表示新增
  }

  const handleAddSave = () => {
    form.validateFields().then((values) => {
      // 直接添加包含完整数据的记录
      const newManager: PastManagerInfo = {
        name: values.name,
        startDate: values.startDate ? dayjs(values.startDate).format('YYYY-MM-DD') : '',
        endDate: values.endDate ? dayjs(values.endDate).format('YYYY-MM-DD') : '',
      }
      onAdd(groupIndex, newManager)
      setEditingIndex(null)
      form.resetFields()
      message.success('已添加')
    }).catch((error) => {
      console.error('表单验证失败:', error)
    })
  }

  return (
    <div style={{ maxWidth: 500 }}>
      {managers.length === 0 && editingIndex !== -1 ? (
        <div style={{ color: '#999', padding: '8px 0', textAlign: 'center' }}>暂无往任管理老师</div>
      ) : (
        <div>
          {managers.map((m, idx) => (
            <div
              key={idx}
              style={{
                marginBottom: 12,
                padding: '12px',
                backgroundColor: editingIndex === idx ? '#e6f7ff' : '#f5f5f5',
                borderRadius: 4,
                border: editingIndex === idx ? '1px solid #1890ff' : '1px solid #d9d9d9',
              }}
            >
              {editingIndex === idx ? (
                <Form form={form} layout="vertical" size="small">
                  <Form.Item label={`第 ${idx + 1} 任管理老师`} name="name" rules={[{ required: true, message: '请输入管理老师姓名' }]}>
                    <Input placeholder="管理老师姓名" />
                  </Form.Item>
                  <Form.Item label="开始日期" name="startDate" rules={[{ required: true, message: '请选择开始日期' }]}>
                    <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" placeholder="选择开始日期" />
                  </Form.Item>
                  <Form.Item label="结束日期" name="endDate" rules={[{ required: true, message: '请选择结束日期' }]}>
                    <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" placeholder="选择结束日期" />
                  </Form.Item>
                  <Space>
                    <Button type="primary" size="small" onClick={handleSave}>
                      保存
                    </Button>
                    <Button size="small" onClick={handleCancel}>
                      取消
                    </Button>
                  </Space>
                </Form>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500, marginBottom: 4, fontSize: 14 }}>
                        {idx + 1}. {m.name || '（未填写）'}
                      </div>
                      <div style={{ fontSize: 12, color: '#666' }}>
                        {m.startDate || '（未填写）'} 至 {m.endDate || '（未填写）'}
                      </div>
                    </div>
                    <Space>
                      <Button
                        type="link"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(idx)}
                      >
                        编辑
                      </Button>
                      <Button
                        type="link"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => {
                          modal.confirm({
                            title: '确认删除',
                            content: '确定要删除这条往任管理老师记录吗？',
                            onOk: () => {
                              onRemove(groupIndex, idx)
                              message.success('已删除')
                            },
                          })
                        }}
                      >
                        删除
                      </Button>
                    </Space>
                  </div>
                </>
              )}
            </div>
          ))}
          {editingIndex === -1 && (
            <div
              style={{
                marginBottom: 12,
                padding: '12px',
                backgroundColor: '#e6f7ff',
                borderRadius: 4,
                border: '1px solid #1890ff',
              }}
            >
              <Form form={form} layout="vertical" size="small">
                <Form.Item label="新增往任管理老师" name="name" rules={[{ required: true, message: '请输入管理老师姓名' }]}>
                  <Input placeholder="管理老师姓名" />
                </Form.Item>
                <Form.Item label="开始日期" name="startDate" rules={[{ required: true, message: '请选择开始日期' }]}>
                  <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" placeholder="选择开始日期" />
                </Form.Item>
                <Form.Item label="结束日期" name="endDate" rules={[{ required: true, message: '请选择结束日期' }]}>
                  <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" placeholder="选择结束日期" />
                </Form.Item>
                <Space>
                  <Button type="primary" size="small" onClick={handleAddSave}>
                    保存
                  </Button>
                  <Button size="small" onClick={handleCancel}>
                    取消
                  </Button>
                </Space>
              </Form>
            </div>
          )}
        </div>
      )}
      {editingIndex === null && (
        <Button
          type="dashed"
          size="small"
          icon={<PlusOutlined />}
          onClick={handleAdd}
          style={{ width: '100%', marginTop: 8 }}
        >
          添加往任管理老师
        </Button>
      )}
    </div>
  )
}

// 需要参与小计计算的 12 个月缴费金额字段（不含上一年12月）
const MONTH_AMOUNT_KEYS = [
  'y23JanAmount',
  'y23FebAmount',
  'y23MarAmount',
  'y23AprAmount',
  'y23MayAmount',
  'y23JunAmount',
  'y23JulAmount',
  'y23AugAmount',
  'y23SepAmount',
  'y23OctAmount',
  'y23NovAmount',
  'y23DecAmount',
] as (keyof StudentData)[]

// 仅用于内部统一计算小计的函数：不要在渲染阶段频繁调用
const computeSubtotal = (s: Partial<StudentData>) =>
  MONTH_AMOUNT_KEYS.reduce((sum, k) => sum + (Number((s as any)[k]) || 0), 0)

// --- 组件定义 ---
interface StudentDormitoryDetailTableProps {
  title?: string
  apiPath: string // 例如：/campus-male-dormitory-detail
  genderFixed: '男' | '女'
}

const StudentDormitoryDetailTable: React.FC<StudentDormitoryDetailTableProps> = ({
  title = '住宿明细',
  apiPath,
  genderFixed,
}) => {
  const { message, modal } = App.useApp()
  const { currentCampus } = useCampusStore()
  const [year, setYear] = useState<number>(new Date().getFullYear())
  const [dormitoryGroups, setDormitoryGroups] = useState<DormitoryGroup[]>([])
  const [loading, setLoading] = useState(false)
  const [tableHeight, setTableHeight] = useState<number>(600)
  const [activeMonthTab, setActiveMonthTab] = useState<string>('y22Dec') // 当前选中的月份标签

  const canIO = useMemo(() => Boolean(currentCampus && year), [currentCampus, year])

  // 动态计算表格高度
  useEffect(() => {
    const updateHeight = () => {
      const height = window.innerHeight - 400
      setTableHeight(Math.max(height, 400)) // 最小高度400px
    }
    updateHeight()
    window.addEventListener('resize', updateHeight)
    return () => window.removeEventListener('resize', updateHeight)
  }, [])

  // 将分组数据扁平化以供 Table 使用（复用未变更行，稳定 record 引用，减少 BodyRow/Cell 渲染）
  const prevRowMapRef = useRef<Map<string, FlatStudentRow>>(new Map())
  const prevStudentRefMapRef = useRef<Map<string, StudentData | undefined>>(new Map())
  const flatDataSource = useMemo(() => {
    const flatList: FlatStudentRow[] = []
    const newRowMap = new Map<string, FlatStudentRow>()
    const newStudentRefMap = new Map<string, StudentData | undefined>()

    dormitoryGroups.forEach((group, groupIndex) => {
      if (group.students.length === 0) {
        const key = `group-${groupIndex}-placeholder`
        const placeholderRow: FlatStudentRow = {
          key,
          dormName: group.dormName,
          manager: group.manager,
          pastManagers: group.pastManagers || [],
          groupIndex,
          isFirstInGroup: true,
          groupSize: 2, // 包含合计行
          isPlaceholder: true,
        }
        flatList.push(placeholderRow)
        newRowMap.set(key, placeholderRow)
        newStudentRefMap.set(key, undefined)
        // 空宿舍也添加合计行（为 0）
        const totalKey = `group-${groupIndex}-total`
        const totalRow: FlatStudentRow = {
          key: totalKey,
          dormName: group.dormName,
          manager: group.manager,
          pastManagers: group.pastManagers || [],
          groupIndex,
          isFirstInGroup: false,
          groupSize: 0,
          isPlaceholder: false,
          isGroupTotal: true,
          subtotal: 0,
        }
        flatList.push(totalRow)
        newRowMap.set(totalKey, totalRow)
        newStudentRefMap.set(totalKey, undefined)
      } else {
        const size = group.students.length
        const totalSize = size + 1 // 加上合计行
        group.students.forEach((student, index) => {
          const key = `${group.dormName}-${student.serialNumber}`
          const isFirstInGroup = index === 0
          const prevRow = prevRowMapRef.current.get(key)
          const prevStudentRef = prevStudentRefMapRef.current.get(key)

          if (
            prevRow &&
            prevStudentRef === student &&
            prevRow.groupSize === totalSize &&
            prevRow.isFirstInGroup === isFirstInGroup
          ) {
            // 复用旧行
            const reused = { ...prevRow, groupIndex, groupSize: totalSize }
            flatList.push(reused)
            newRowMap.set(key, reused)
            newStudentRefMap.set(key, student)
          } else {
            const newRow: FlatStudentRow = {
              ...student,
              key,
              dormName: group.dormName,
              manager: group.manager,
              pastManagers: group.pastManagers || [],
              groupIndex,
              isFirstInGroup,
              groupSize: totalSize,
              isPlaceholder: false,
            }
            flatList.push(newRow)
            newRowMap.set(key, newRow)
            newStudentRefMap.set(key, student)
          }
        })
        // 分组合计行
        const totalKey = `group-${groupIndex}-total`
        // 这里尽量复用已经写入到 student.subtotal 的值，避免在渲染阶段重复计算 12 个月小计
        const totalValue = group.students.reduce(
          (sum, s) => sum + (typeof s.subtotal === 'number' ? s.subtotal : computeSubtotal(s)),
          0,
        )
        const totalRow: FlatStudentRow = {
          key: totalKey,
          dormName: group.dormName,
          manager: group.manager,
          pastManagers: group.pastManagers || [],
          groupIndex,
          serialNumber: undefined,
          isFirstInGroup: false,
          groupSize: 0,
          isPlaceholder: false,
          isGroupTotal: true,
          subtotal: totalValue,
        }
        flatList.push(totalRow)
        newRowMap.set(totalKey, totalRow)
        newStudentRefMap.set(totalKey, undefined)
      }
    })

    prevRowMapRef.current = newRowMap
    prevStudentRefMapRef.current = newStudentRefMap
    return flatList
  }, [dormitoryGroups])

  // 从服务器获取数据
  const fetchFromServer = useCallback(async () => {
    if (!canIO) {
      message.warning('请先选择神殿/年份')
      return
    }
    setLoading(true)
    try {
      const campusName = currentCampus!.endsWith('神殿') ? currentCampus! : `${currentCampus!}神殿`
      const res = await fetch(
        buildApiUrl(`/teaching-quality${apiPath}?campus=${encodeURIComponent(campusName)}&year=${year}`),
      )
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setDormitoryGroups((data?.宿舍列表 || []) as DormitoryGroup[])
      message.success('已刷新')
    } catch (e) {
      console.error(e)
      message.error('刷新失败')
    } finally {
      setLoading(false)
    }
  }, [canIO, currentCampus, apiPath, year])

  // 保存数据到服务器
  const saveToServer = useCallback(async () => {
    if (!canIO) {
      message.warning('请先选择神殿/年份')
      return
    }
    setLoading(true)
    try {
      const campusName = currentCampus!.endsWith('神殿') ? currentCampus! : `${currentCampus!}神殿`
      const payload = {
        神殿名称: campusName,
        年份: year,
        宿舍列表: dormitoryGroups, // 直接发送分组数据
      }
      const res = await fetch(buildApiUrl(`/teaching-quality${apiPath}`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(await res.text())
      message.success('保存成功')
      await fetchFromServer() // 保存后刷新
    } catch (e) {
      console.error(e)
      message.error('保存失败')
    } finally {
      setLoading(false)
    }
  }, [canIO, currentCampus, year, dormitoryGroups, apiPath, fetchFromServer])

  useEffect(() => {
    if (currentCampus) {
      fetchFromServer()
    }
  }, [currentCampus, year, fetchFromServer])

  // --- 数据变更处理 ---
  const handleStudentDataChange = useCallback(
    (
      dormName: string,
      serialNumber: number,
      field: keyof StudentData,
      value: string | number | null,
      groupIndex?: number,
    ) => {
      // 直接同步更新，避免对中文输入法（IME）产生干扰，确保可以正常输入汉字
      setDormitoryGroups((prevGroups) =>
        prevGroups.map((group, idx) => {
          // 优先使用 groupIndex 精确定位，避免每次输入都遍历所有宿舍分组
          const isTargetGroup =
            typeof groupIndex === 'number' ? idx === groupIndex : group.dormName === dormName
          if (!isTargetGroup) return group

          return {
            ...group,
            students: group.students.map((student) => {
              if (student.serialNumber !== serialNumber) return student

              const next = { ...student, [field]: value ?? '' } as StudentData

              // 仅当修改的是「月度缴费金额」字段时才重新计算小计，避免在修改姓名/电话等字段时做不必要的 12 个月求和
              if (MONTH_AMOUNT_KEYS.includes(field as any)) {
                next.subtotal = computeSubtotal(next)
              }

              // 检查实际缴费金额是否小于缴费单价
              if (field.toString().endsWith('Amount') && field !== 'y22DecNextAmount' && field !== 'y23JanNextAmount' && 
                  field !== 'y23FebNextAmount' && field !== 'y23MarNextAmount' && field !== 'y23AprNextAmount' && 
                  field !== 'y23MayNextAmount' && field !== 'y23JunNextAmount' && field !== 'y23JulNextAmount' && 
                  field !== 'y23AugNextAmount' && field !== 'y23SepNextAmount' && field !== 'y23OctNextAmount' && 
                  field !== 'y23NovNextAmount' && field !== 'y23DecNextAmount') {
                const actualAmount = Number(value) || 0
                const unitPrice = next.unitPrice || 0
                if (actualAmount > 0 && actualAmount < unitPrice) {
                  message.warning(`${student.studentName || '该学生'}的实际缴费金额(${actualAmount}元)小于缴费单价(${unitPrice}元/月)`)
                }
              }

              return next
            }),
          }
        }),
      )
    },
    [],
  )


  // 生成一个空的学生记录
  const createEmptyStudent = (serialNumber: number): StudentData => ({
    serialNumber,
    studentName: '',
    studentPhone: '',
    parentPhone: '',
    gender: genderFixed,
    headTeacher: '',
    checkInDate: '',
    checkOutDate: '',
    roomBedCount: 0,
    occupiedCount: 0,
    remainingBeds: 0,
    suitableNewBeds: 0,
    roomType: '',
    isLiving: '',
    unitPrice: 0,
    deposit: 0,
    y22DecAmount: 0,
    y22DecPeriod: '',
    y22DecHeating: 0,
    y22DecNextAmount: 0,
    y22DecNextTime: '',
    y23JanAmount: 0,
    y23JanPeriod: '',
    y23JanHeating: 0,
    y23JanNextAmount: 0,
    y23JanNextTime: '',
    y23FebAmount: 0,
    y23FebPeriod: '',
    y23FebHeating: 0,
    y23FebNextAmount: 0,
    y23FebNextTime: '',
    y23MarAmount: 0,
    y23MarPeriod: '',
    y23MarHeating: 0,
    y23MarNextAmount: 0,
    y23MarNextTime: '',
    y23AprAmount: 0,
    y23AprPeriod: '',
    y23AprHeating: 0,
    y23AprNextAmount: 0,
    y23AprNextTime: '',
    y23MayAmount: 0,
    y23MayPeriod: '',
    y23MayHeating: 0,
    y23MayNextAmount: 0,
    y23MayNextTime: '',
    y23JunAmount: 0,
    y23JunPeriod: '',
    y23JunHeating: 0,
    y23JunNextAmount: 0,
    y23JunNextTime: '',
    y23JulAmount: 0,
    y23JulPeriod: '',
    y23JulHeating: 0,
    y23JulNextAmount: 0,
    y23JulNextTime: '',
    y23AugAmount: 0,
    y23AugPeriod: '',
    y23AugHeating: 0,
    y23AugNextAmount: 0,
    y23AugNextTime: '',
    y23SepAmount: 0,
    y23SepPeriod: '',
    y23SepHeating: 0,
    y23SepNextAmount: 0,
    y23SepNextTime: '',
    y23OctAmount: 0,
    y23OctPeriod: '',
    y23OctHeating: 0,
    y23OctNextAmount: 0,
    y23OctNextTime: '',
    y23NovAmount: 0,
    y23NovPeriod: '',
    y23NovHeating: 0,
    y23NovNextAmount: 0,
    y23NovNextTime: '',
    y23DecAmount: 0,
    y23DecPeriod: '',
    y23DecHeating: 0,
    y23DecNextAmount: 0,
    y23DecNextTime: '',
    subtotal: 0,
    remarks: '',
  })

  // 新增宿舍
  const addDormitoryGroup = () => {
    setDormitoryGroups((prev) => [
      ...prev,
      { dormName: '', manager: '', pastManagers: [], students: [] },
    ])
  }

  // 处理宿舍分组信息变更（管理老师、宿舍名称）
  const handleGroupInfoChange = useCallback(
    (groupIndex: number, field: 'dormName' | 'manager', value: string) => {
      setDormitoryGroups((prev) =>
        prev.map((g, idx) => (idx === groupIndex ? { ...g, [field]: value } : g)),
      )
    },
    [],
  )

  // 添加往任管理老师
  const addPastManager = useCallback((groupIndex: number, managerData?: PastManagerInfo) => {
    setDormitoryGroups((prev) =>
      prev.map((g, idx) =>
        idx === groupIndex
          ? {
              ...g,
              pastManagers: [...(g.pastManagers || []), managerData || { name: '', startDate: '', endDate: '' }],
            }
          : g,
      ),
    )
  }, [])

  // 更新往任管理老师
  const updatePastManager = useCallback(
    (groupIndex: number, managerIndex: number, field: keyof PastManagerInfo, value: string) => {
      setDormitoryGroups((prev) =>
        prev.map((g, idx) => {
          if (idx !== groupIndex) return g
          const newManagers = [...(g.pastManagers || [])]
          newManagers[managerIndex] = { ...newManagers[managerIndex], [field]: value }
          return { ...g, pastManagers: newManagers }
        }),
      )
    },
    [],
  )

  // 删除往任管理老师
  const removePastManager = useCallback((groupIndex: number, managerIndex: number) => {
    setDormitoryGroups((prev) =>
      prev.map((g, idx) => {
        if (idx !== groupIndex) return g
        const newManagers = [...(g.pastManagers || [])]
        newManagers.splice(managerIndex, 1)
        return { ...g, pastManagers: newManagers }
      }),
    )
  }, [])

  // 新增该宿舍一名学生
  const addStudentToDorm = (groupIndex: number) => {
    setDormitoryGroups((prev) =>
      prev.map((g, idx) => {
        if (idx !== groupIndex) return g
        const nextSerial = (g.students.reduce((m, s) => Math.max(m, s.serialNumber), 0) || 0) + 1
        return { ...g, students: [...g.students, createEmptyStudent(nextSerial)] }
      }),
    )
  }

  // --- 列定义 ---
  // 月份配置列表
  const monthConfigs = useMemo(() => [
    { yearStr: String(year - 1), month: '12', monthKey: 'y22Dec', label: `${year - 1}年12月` },
    { yearStr: String(year), month: '1', monthKey: 'y23Jan', label: `${year}年1月` },
    { yearStr: String(year), month: '2', monthKey: 'y23Feb', label: `${year}年2月` },
    { yearStr: String(year), month: '3', monthKey: 'y23Mar', label: `${year}年3月` },
    { yearStr: String(year), month: '4', monthKey: 'y23Apr', label: `${year}年4月` },
    { yearStr: String(year), month: '5', monthKey: 'y23May', label: `${year}年5月` },
    { yearStr: String(year), month: '6', monthKey: 'y23Jun', label: `${year}年6月` },
    { yearStr: String(year), month: '7', monthKey: 'y23Jul', label: `${year}年7月` },
    { yearStr: String(year), month: '8', monthKey: 'y23Aug', label: `${year}年8月` },
    { yearStr: String(year), month: '9', monthKey: 'y23Sep', label: `${year}年9月` },
    { yearStr: String(year), month: '10', monthKey: 'y23Oct', label: `${year}年10月` },
    { yearStr: String(year), month: '11', monthKey: 'y23Nov', label: `${year}年11月` },
    { yearStr: String(year), month: '12', monthKey: 'y23Dec', label: `${year}年12月` },
  ], [year])

  // 生成当前选中月份的列
  const createCurrentMonthColumns = useCallback((monthKey: string, monthName: string) => {
    return {
      title: monthName,
      children: [
        {
          title: '实际缴费金额',
          dataIndex: `${monthKey}Amount`,
          key: `${monthKey}Amount`,
          width: 110,
          align: 'center' as const,
          render: (value: number, record: FlatStudentRow) => {
            if (record.isPlaceholder || record.isGroupTotal) return null
            
            const unitPrice = record.unitPrice || 0
            const actualAmount = value || 0
            const isWarning = actualAmount < unitPrice && actualAmount > 0
            
            return (
              <InputNumber
                min={0}
                value={actualAmount}
                status={isWarning ? 'error' : undefined}
                style={{ 
                  width: '100%', 
                  textAlign: 'center',
                  backgroundColor: isWarning ? '#fff1f0' : undefined,
                  borderColor: isWarning ? '#ff4d4f' : undefined
                }}
                onChange={(v) =>
                  handleStudentDataChange(
                    record.dormName,
                    record.serialNumber!,
                    `${monthKey}Amount` as keyof StudentData,
                    v,
                    record.groupIndex,
                  )
                }
              />
            )
          },
        },
        {
          title: '宿舍费周期',
          dataIndex: `${monthKey}Period`,
          key: `${monthKey}Period`,
          width: 120,
          align: 'center' as const,
          render: (text: string, record: FlatStudentRow) =>
            record.isPlaceholder || record.isGroupTotal ? null : (
              <Input
                value={text}
                style={{ textAlign: 'center' }}
                onChange={(e) =>
                  handleStudentDataChange(
                    record.dormName,
                    record.serialNumber!,
                    `${monthKey}Period` as keyof StudentData,
                    e.target.value,
                    record.groupIndex,
                  )
                }
              />
            ),
        },
        {
          title: '暖气费',
          dataIndex: `${monthKey}Heating`,
          key: `${monthKey}Heating`,
          width: 100,
          align: 'center' as const,
          render: (value: number, record: FlatStudentRow) =>
            record.isPlaceholder || record.isGroupTotal ? null : (
              <InputNumber
                min={0}
                value={value || 0}
                style={{ width: '100%', textAlign: 'center' }}
                onChange={(v) =>
                  handleStudentDataChange(
                    record.dormName,
                    record.serialNumber!,
                    `${monthKey}Heating` as keyof StudentData,
                    v,
                    record.groupIndex,
                  )
                }
              />
            ),
        },
        {
          title: '下次缴费金额',
          dataIndex: `${monthKey}NextAmount`,
          key: `${monthKey}NextAmount`,
          width: 120,
          align: 'center' as const,
          render: (value: number, record: FlatStudentRow) =>
            record.isPlaceholder || record.isGroupTotal ? null : (
              <InputNumber
                min={0}
                value={value || 0}
                style={{ width: '100%', textAlign: 'center' }}
                onChange={(v) =>
                  handleStudentDataChange(
                    record.dormName,
                    record.serialNumber!,
                    `${monthKey}NextAmount` as keyof StudentData,
                    v,
                    record.groupIndex,
                  )
                }
              />
            ),
        },
        {
          title: '下次收费时间',
          dataIndex: `${monthKey}NextTime`,
          key: `${monthKey}NextTime`,
          width: 120,
          align: 'center' as const,
          render: (text: string, record: FlatStudentRow) =>
            record.isPlaceholder || record.isGroupTotal ? null : (
              <Input
                value={text}
                onChange={(e) =>
                  handleStudentDataChange(
                    record.dormName,
                    record.serialNumber!,
                    `${monthKey}NextTime` as keyof StudentData,
                    e.target.value,
                    record.groupIndex,
                  )
                }
              />
            ),
        },
      ],
    }
  }, [handleStudentDataChange])

  // 根据当前选中的月份生成列
  const columns: ColumnsType<FlatStudentRow> = useMemo(() => {
    const currentMonthConfig = monthConfigs.find(m => m.monthKey === activeMonthTab) || monthConfigs[0]
    const currentMonthColumns = createCurrentMonthColumns(currentMonthConfig.monthKey, currentMonthConfig.label)

    return [
      {
        title: '宿舍名称',
        dataIndex: 'dormName',
        key: 'dormName',
        width: 180,
        align: 'center',
        onCell: (record: FlatStudentRow) => ({
          rowSpan: record.isFirstInGroup ? record.groupSize : 0,
        }),
        render: (_: any, record: FlatStudentRow) =>
          record.isFirstInGroup ? (
            <Space>
              <span style={{ fontWeight: 500, color: '#262626' }}>{record.dormName || '-'}</span>
              <Button type="link" icon={<PlusOutlined />} onClick={() => addStudentToDorm(record.groupIndex)}>
                新增学生
              </Button>
            </Space>
          ) : null,
      },
    {
      title: '管理老师',
      dataIndex: 'manager',
      key: 'manager',
      width: 140,
      align: 'center',
      onCell: (record: FlatStudentRow) => ({
        rowSpan: record.isFirstInGroup ? record.groupSize : 0,
      }),
        render: (_: any, record: FlatStudentRow) =>
        record.isFirstInGroup ? (
          <Input
            value={record.manager || ''}
            placeholder="管理老师"
            onChange={(e) => {
              e.stopPropagation()
              e.preventDefault()
              const value = e.target.value
              handleGroupInfoChange(record.groupIndex, 'manager', value)
            }}
            onPressEnter={(e) => {
              e.stopPropagation()
              e.currentTarget.blur()
            }}
            onClick={(e) => {
              e.stopPropagation()
            }}
            onFocus={(e) => {
              e.stopPropagation()
            }}
            onBlur={(e) => {
              e.stopPropagation()
            }}
            style={{ width: '100%' }}
            allowClear
            autoComplete="off"
          />
        ) : null,
    },
    {
      title: '往任管理老师',
      dataIndex: 'pastManagers',
      key: 'pastManagers',
      width: 200,
      align: 'center',
      onCell: (record: FlatStudentRow) => ({
        rowSpan: record.isFirstInGroup ? record.groupSize : 0,
      }),
      render: (_: any, record: FlatStudentRow) => {
        if (!record.isFirstInGroup) return null
        const managers = record.pastManagers || []

        return (
          <Popover
            content={
              <PastManagersEditor
                managers={managers}
                groupIndex={record.groupIndex}
                onUpdate={updatePastManager}
                onAdd={addPastManager}
                onRemove={removePastManager}
              />
            }
            title="往任管理老师列表（按时间顺序）"
            trigger="click"
            placement="right"
            overlayStyle={{ maxWidth: 550 }}
          >
            <div style={{ cursor: 'pointer', padding: '4px 8px', minHeight: 32 }}>
              {managers.length === 0 ? (
                <span style={{ color: '#999' }}>点击添加</span>
              ) : (
                <div>
                  {managers.map((m, idx) => (
                    <Tag key={idx} color="blue" style={{ marginBottom: 4, display: 'block' }}>
                      <div style={{ fontWeight: 500 }}>{idx + 1}. {m.name || '（未填写）'}</div>
                      <div style={{ fontSize: 11, marginTop: 2 }}>
                        {m.startDate || '（未填写）'} 至 {m.endDate || '（未填写）'}
                      </div>
                    </Tag>
                  ))}
                </div>
              )}
            </div>
          </Popover>
        )
      },
    },
    {
      title: '序号',
      dataIndex: 'serialNumber',
      key: 'serialNumber',
      width: 70,
      align: 'center',
      render: (value, record) => (record.isPlaceholder ? '' : value),
    },
    {
      title: '学员住宿基本情况',
      children: [
        {
          title: '姓名',
          dataIndex: 'studentName',
          key: 'studentName',
          width: 100,
          align: 'center',
          render: (text: string, record: FlatStudentRow) =>
            record.isPlaceholder || record.isGroupTotal ? null : (
              <Input
                value={text}
                style={{ textAlign: 'center' }}
                onChange={(e) =>
                  handleStudentDataChange(
                    record.dormName,
                    record.serialNumber!,
                    'studentName',
                    e.target.value,
                    record.groupIndex,
                  )
                }
              />
            ),
        },
        {
          title: '学生电话',
          dataIndex: 'studentPhone',
          key: 'studentPhone',
          width: 130,
          align: 'center',
          render: (text: string, record: FlatStudentRow) =>
            record.isPlaceholder || record.isGroupTotal ? null : (
              <Input
                value={text}
                style={{ textAlign: 'center' }}
                onChange={(e) =>
                  handleStudentDataChange(
                    record.dormName,
                    record.serialNumber!,
                    'studentPhone',
                    e.target.value,
                    record.groupIndex,
                  )
                }
              />
            ),
        },
        {
          title: '家长电话',
          dataIndex: 'parentPhone',
          key: 'parentPhone',
          width: 130,
          align: 'center',
          render: (text: string, record: FlatStudentRow) =>
            record.isPlaceholder || record.isGroupTotal ? null : (
              <Input
                value={text}
                onChange={(e) =>
                  handleStudentDataChange(
                    record.dormName,
                    record.serialNumber!,
                    'parentPhone',
                    e.target.value,
                    record.groupIndex,
                  )
                }
              />
            ),
        },
        {
          title: '性别',
          dataIndex: 'gender',
          key: 'gender',
          width: 80,
          align: 'center',
          render: (_, record) => (record.isPlaceholder || record.isGroupTotal ? null : <span>{genderFixed}</span>),
        },
        {
          title: '对应班主任',
          dataIndex: 'headTeacher',
          key: 'headTeacher',
          width: 110,
          align: 'center',
          render: (text: string, record: FlatStudentRow) =>
            record.isPlaceholder || record.isGroupTotal ? null : (
              <Input
                value={text}
                onChange={(e) =>
                  handleStudentDataChange(
                    record.dormName,
                    record.serialNumber!,
                    'headTeacher',
                    e.target.value,
                    record.groupIndex,
                  )
                }
              />
            ),
        },
        {
          title: '入住日期',
          dataIndex: 'checkInDate',
          key: 'checkInDate',
          width: 110,
          align: 'center',
          render: (text: string, record: FlatStudentRow) =>
            record.isPlaceholder || record.isGroupTotal ? null : (
              <Input
                value={text}
                onChange={(e) =>
                  handleStudentDataChange(
                    record.dormName,
                    record.serialNumber!,
                    'checkInDate',
                    e.target.value,
                    record.groupIndex,
                  )
                }
              />
            ),
        },
        {
          title: '搬出时间',
          dataIndex: 'checkOutDate',
          key: 'checkOutDate',
          width: 110,
          align: 'center',
          render: (text: string, record: FlatStudentRow) =>
            record.isPlaceholder || record.isGroupTotal ? null : (
              <Input
                value={text}
                onChange={(e) =>
                  handleStudentDataChange(
                    record.dormName,
                    record.serialNumber!,
                    'checkOutDate',
                    e.target.value,
                    record.groupIndex,
                  )
                }
              />
            ),
        },
        {
          title: '房间床位数',
          dataIndex: 'roomBedCount',
          key: 'roomBedCount',
          width: 110,
          align: 'center',
          onCell: (record: FlatStudentRow) => ({
            rowSpan: record.isFirstInGroup ? record.groupSize : 0,
          }),
          render: (value: number, record: FlatStudentRow) =>
            record.isPlaceholder ? null : record.isFirstInGroup ? (
              <InputNumber
                min={0}
                value={value || 0}
                style={{ width: '100%', textAlign: 'center' }}
                onChange={(v) =>
                  setDormitoryGroups((prev) =>
                    prev.map((g, idx) => {
                      if (idx !== record.groupIndex) return g
                      const newVal = Number(v) || 0
                      return {
                        ...g,
                        students: g.students.map((s) => ({
                          ...s,
                          roomBedCount: newVal,
                          remainingBeds: Math.max(0, newVal - (Number(s.occupiedCount) || 0)),
                        })),
                      }
                    }),
                  )
                }
              />
            ) : null,
        },
        {
          title: '已住宿人数',
          dataIndex: 'occupiedCount',
          key: 'occupiedCount',
          width: 110,
          align: 'center',
          onCell: (record: FlatStudentRow) => ({
            rowSpan: record.isFirstInGroup ? record.groupSize : 0,
          }),
          render: (value: number, record: FlatStudentRow) =>
            record.isPlaceholder ? null : record.isFirstInGroup ? (
              <InputNumber
                min={0}
                value={value || 0}
                style={{ width: '100%', textAlign: 'center' }}
                onChange={(v) =>
                  setDormitoryGroups((prev) =>
                    prev.map((g, idx) => {
                      if (idx !== record.groupIndex) return g
                      const newVal = Number(v) || 0
                      const room = g.students[0]?.roomBedCount || 0
                      return {
                        ...g,
                        students: g.students.map((s) => ({
                          ...s,
                          occupiedCount: newVal,
                          remainingBeds: Math.max(0, (Number(room) || 0) - newVal),
                        })),
                      }
                    }),
                  )
                }
              />
            ) : null,
        },
        {
          title: '剩余床位数',
          dataIndex: 'remainingBeds',
          key: 'remainingBeds',
          width: 110,
          align: 'center',
          onCell: (record: FlatStudentRow) => ({
            rowSpan: record.isFirstInGroup ? record.groupSize : 0,
          }),
          render: (value: number, record: FlatStudentRow) =>
            record.isPlaceholder ? null : record.isFirstInGroup ? (
              <InputNumber disabled value={value || 0} style={{ width: '100%', textAlign: 'center' }} />
            ) : null,
        },
        {
          title: '适合新生床位数',
          dataIndex: 'suitableNewBeds',
          key: 'suitableNewBeds',
          width: 130,
          align: 'center',
          onCell: (record: FlatStudentRow) => ({
            rowSpan: record.isFirstInGroup ? record.groupSize : 0,
          }),
          render: (value: number, record: FlatStudentRow) =>
            record.isPlaceholder || record.isGroupTotal ? null : record.isFirstInGroup ? (
              <InputNumber
                min={0}
                value={value || 0}
                style={{ width: '100%', textAlign: 'center' }}
                onChange={(v) =>
                  setDormitoryGroups((prev) =>
                    prev.map((g, idx) =>
                      idx === record.groupIndex
                        ? { ...g, students: g.students.map((s) => ({ ...s, suitableNewBeds: Number(v) || 0 })) }
                        : g,
                    ),
                  )
                }
              />
            ) : null,
        },
        {
          title: '入住房型（X人间/上铺/下铺）',
          dataIndex: 'roomType',
          key: 'roomType',
          width: 180,
          align: 'center',
          render: (text: string, record: FlatStudentRow) =>
            record.isPlaceholder || record.isGroupTotal ? null : (
              <Input
                value={text}
                onChange={(e) =>
                  handleStudentDataChange(
                    record.dormName,
                    record.serialNumber!,
                    'roomType',
                    e.target.value,
                    record.groupIndex,
                  )
                }
              />
            ),
        },
        {
          title: '是否住宿',
          dataIndex: 'isLiving',
          key: 'isLiving',
          width: 100,
          align: 'center',
          render: (value: string, record: FlatStudentRow) =>
            record.isPlaceholder || record.isGroupTotal ? null : (
              <Select
                allowClear
                options={YES_NO_OPTIONS}
                value={value || undefined}
                onChange={(v) =>
                  handleStudentDataChange(record.dormName, record.serialNumber!, 'isLiving', v, record.groupIndex)
                }
              />
            ),
        },
        {
          title: '缴费单价(元/月)',
          dataIndex: 'unitPrice',
          key: 'unitPrice',
          width: 100,
          align: 'center',
          render: (value: number, record: FlatStudentRow) =>
            record.isPlaceholder || record.isGroupTotal ? null : (
              <InputNumber
                min={0}
                value={value || 0}
                style={{ width: '100%', textAlign: 'center' }}
                onChange={(v) =>
                  handleStudentDataChange(record.dormName, record.serialNumber!, 'unitPrice', v, record.groupIndex)
                }
              />
            ),
        },
        {
          title: '实际缴纳押金',
          dataIndex: 'deposit',
          key: 'deposit',
          width: 140,
          align: 'center',
          render: (value: number, record: FlatStudentRow) =>
            record.isPlaceholder || record.isGroupTotal ? null : (
              <InputNumber
                min={0}
                value={value || 0}
                style={{ width: '100%', textAlign: 'center' }}
                onChange={(v) =>
                  handleStudentDataChange(record.dormName, record.serialNumber!, 'deposit', v, record.groupIndex)
                }
              />
            ),
        },
      ],
      },
      currentMonthColumns,
      {
        title: '住宿费小计',
      dataIndex: 'subtotal',
      key: 'subtotal',
      width: 120,
      align: 'center',
      render: (_: number, record: FlatStudentRow) =>
        record.isPlaceholder ? null : record.isGroupTotal ? (
          <InputNumber disabled value={record.subtotal || 0} style={{ width: '100%', textAlign: 'center', fontWeight: 600 }} />
        ) : (
          // 尽量直接使用已经写入到 record.subtotal 的值，避免每个单元格渲染时重复计算
          <InputNumber
            disabled
            value={typeof record.subtotal === 'number' ? record.subtotal : computeSubtotal(record)}
            style={{ width: '100%', textAlign: 'center' }}
          />
        ),
    },
    {
      title: '备注',
      dataIndex: 'remarks',
      key: 'remarks',
      width: 200,
      align: 'center',
      render: (text: string, record: FlatStudentRow) =>
        record.isPlaceholder || record.isGroupTotal ? null : (
          <Input.TextArea
            autoSize={{ minRows: 1, maxRows: 3 }}
            value={text}
            onChange={(e) =>
              handleStudentDataChange(record.dormName, record.serialNumber!, 'remarks', e.target.value)
            }
          />
        ),
    },
  ]
  }, [activeMonthTab, monthConfigs, createCurrentMonthColumns, handleGroupInfoChange, addStudentToDorm, handleStudentDataChange, genderFixed, computeSubtotal])

  return (
    <ConfigProvider wave={{ disabled: true }} theme={{ token: { motion: false } }}>
      <div style={{ padding: 24 }}>
        <Card
        title={title}
        style={{ backgroundColor: '#fff' }}
        extra={
          <Space>
            <span>年份</span>
            <InputNumber
              min={2000}
              max={2100}
              value={year}
              onChange={(v) => setYear(typeof v === 'number' ? v : new Date().getFullYear())}
              style={{ width: 100 }}
            />
            <Button onClick={fetchFromServer} disabled={!canIO} loading={loading}>
              刷新
            </Button>
            <Button type="dashed" icon={<PlusOutlined />} onClick={addDormitoryGroup}>
              新增宿舍
            </Button>
            <Button type="primary" onClick={saveToServer} disabled={!canIO} loading={loading}>
              保存
            </Button>
          </Space>
        }
      >
        <Tabs
          activeKey={activeMonthTab}
          onChange={setActiveMonthTab}
          type="card"
          style={{ marginBottom: 16 }}
          items={monthConfigs.map((config) => ({ key: config.monthKey, label: config.label }))}
        />
        <Table<FlatStudentRow>
          bordered
          size="small"
          columns={columns}
          dataSource={flatDataSource}
          pagination={false}
          // 使用固定表格布局，减轻浏览器在超宽表格下的布局计算压力
          tableLayout="fixed"
          rowKey="key"
          scroll={{ 
            x: 'max-content', 
            y: tableHeight,
            scrollToFirstRowOnChange: false
          }}
          style={{ 
            backgroundColor: '#f0f9ff',
          }}
          className="dormitory-detail-table"
          loading={loading}
          sticky={{ offsetHeader: 0 }}
        />
        <style>{`
          .dormitory-detail-table .ant-table,
          .dormitory-detail-table .ant-table th,
          .dormitory-detail-table .ant-table td {
            border-color: #595959 !important;
          }
          .dormitory-detail-table .ant-table-thead > tr > th {
            border-color: #404040 !important;
            border-width: 1px !important;
          }
          .dormitory-detail-table .ant-table-tbody > tr > td {
            border-color: #595959 !important;
            border-width: 1px !important;
          }
          .dormitory-detail-table .ant-table-bordered .ant-table-thead > tr > th,
          .dormitory-detail-table .ant-table-bordered .ant-table-tbody > tr > td {
            border-color: #595959 !important;
          }
        `}</style>
      </Card>
    </div>
    </ConfigProvider>
  )
}

export default StudentDormitoryDetailTable