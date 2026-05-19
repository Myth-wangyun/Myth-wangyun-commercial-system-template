/**
 * XX班级活动计划安排表
 */

import React, { useEffect, useState } from 'react'
import { App, Card, Table, Button, Space, Select, Input, Modal, Form, DatePicker } from 'antd'
import {
  ReloadOutlined,
  DownloadOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SaveOutlined,
  CalendarOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useCampusStore } from '@/stores/campusStore'
import { buildApiUrl } from '@/utils/apiBase'
import { fetchHomeroomTeachers } from '@/services/configMaster'
import dayjs from 'dayjs'

const { Option } = Select
const { TextArea } = Input

// 班级活动计划记录接口
interface ClassActivityPlanRecord {
  key: string
  time: string // 时间
  location: string // 地点
  activityForm: string // 活动形式
  mainContent: string // 主要内容
  responsible: string // 负责人
  expectedResult: string // 预期结果
  processKeyPoints: string // 过程关键点
  actualResult: string // 实标结果
}

interface ClassListItem {
  id: number
  班级名称: string
  神殿: string
  班主任?: string
  专业?: string
  学制?: string
  开班时间?: string
  学生人数?: number
  备注?: string
}

const ClassActivityPlanTable: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus, getAllCampuses } = useCampusStore()
  const campuses = getAllCampuses()

  const [selectedCampus, setSelectedCampus] = useState<string>(currentCampus || '')
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<ClassActivityPlanRecord | null>(null)
  const [form] = Form.useForm()
  const [classList, setClassList] = useState<ClassListItem[]>([])
  const [classListLoading, setClassListLoading] = useState(false)

  // 负责人下拉：来自配置中心「班主任管理」
  const [homeroomTeacherOptions, setHomeroomTeacherOptions] = useState<string[]>([])
  const [homeroomTeachersLoading, setHomeroomTeachersLoading] = useState(false)
  // 当前班级对应班主任（用于默认填充负责人）
  const [classTeacher, setClassTeacher] = useState<string>('')

  // 初始化数据
  const [dataSource, setDataSource] = useState<ClassActivityPlanRecord[]>([])
  const [yearSummaryData, setYearSummaryData] = useState<ClassActivityPlanRecord[]>([])
  const [loadingSummary, setLoadingSummary] = useState(false)
  const [showYearData, setShowYearData] = useState(false)

  const isDateInSelectedMonth = (date: dayjs.Dayjs) =>
    date.year() === selectedYear && date.month() + 1 === selectedMonth

  const disabledDate = (current: dayjs.Dayjs | null) =>
    !!current && !isDateInSelectedMonth(current)

  const hasMismatchedTimes = () => {
    const mismatched = dataSource.filter((row) => {
      if (!row.time) return false
      const parsed = dayjs(row.time)
      if (!parsed.isValid()) return true
      return !isDateInSelectedMonth(parsed)
    })
    if (mismatched.length > 0) {
      message.warning('发现存在活动时间不在当前筛选年月的数据，请切换月份后再保存。')
      return true
    }
    return false
  }

  // 表格列配置
  const columns: ColumnsType<ClassActivityPlanRecord> = [
    {
      title: '序号',
      key: 'serialNumber',
      width: 80,
      align: 'center',
      render: (_, __, index) => index + 1,
    },
    {
      title: '时间',
      dataIndex: 'time',
      key: 'time',
      width: 150,
      align: 'center',
      render: (text, record) => showYearData ? <div style={{ whiteSpace: 'pre-wrap' }}>{text || '-'}</div> : renderEditableCell(text, record, 'time'),
    },
    {
      title: '地点',
      dataIndex: 'location',
      key: 'location',
      width: 120,
      align: 'center',
      render: (text, record) => showYearData ? <div style={{ whiteSpace: 'pre-wrap' }}>{text || '-'}</div> : renderEditableCell(text, record, 'location'),
    },
    {
      title: '活动形式',
      dataIndex: 'activityForm',
      key: 'activityForm',
      width: 150,
      align: 'center',
      render: (text, record) => showYearData ? <div style={{ whiteSpace: 'pre-wrap' }}>{text || '-'}</div> : renderEditableCell(text, record, 'activityForm'),
    },
    {
      title: '主要内容',
      dataIndex: 'mainContent',
      key: 'mainContent',
      width: 200,
      align: 'left',
      render: (text, record) => showYearData ? <div style={{ whiteSpace: 'pre-wrap' }}>{text || '-'}</div> : renderEditableCell(text, record, 'mainContent', true),
    },
    {
      title: '负责人',
      dataIndex: 'responsible',
      key: 'responsible',
      width: 100,
      align: 'center',
      render: (text, record) => showYearData ? <div style={{ whiteSpace: 'pre-wrap' }}>{text || '-'}</div> : renderEditableCell(text, record, 'responsible'),
    },
    {
      title: '预期结果',
      dataIndex: 'expectedResult',
      key: 'expectedResult',
      width: 150,
      align: 'left',
      render: (text, record) => showYearData ? <div style={{ whiteSpace: 'pre-wrap' }}>{text || '-'}</div> : renderEditableCell(text, record, 'expectedResult', true),
    },
    {
      title: '过程关键点',
      dataIndex: 'processKeyPoints',
      key: 'processKeyPoints',
      width: 200,
      align: 'left',
      render: (text, record) => showYearData ? <div style={{ whiteSpace: 'pre-wrap' }}>{text || '-'}</div> : renderEditableCell(text, record, 'processKeyPoints', true),
    },
    {
      title: '实标结果',
      dataIndex: 'actualResult',
      key: 'actualResult',
      width: 150,
      align: 'left',
      render: (text, record) => showYearData ? <div style={{ whiteSpace: 'pre-wrap' }}>{text || '-'}</div> : renderEditableCell(text, record, 'actualResult', true),
    },
    ...(showYearData ? [] : [{
      title: '操作',
      key: 'action',
      width: 150,
      align: 'center' as const,
      fixed: 'right' as const,
      render: (_: any, record: ClassActivityPlanRecord) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.key)}
          >
            删除
          </Button>
        </Space>
      ),
    }]),
  ]

  // 渲染可编辑单元格
  const renderEditableCell = (
    text: string,
    record: ClassActivityPlanRecord,
    field: keyof ClassActivityPlanRecord,
    isTextArea: boolean = false,
  ) => {
    if (!editMode) {
      return <div style={{ whiteSpace: 'pre-wrap' }}>{text || '-'}</div>
    }

    if (field === 'time') {
      return (
        <DatePicker
          value={text ? dayjs(text) : null}
          disabledDate={disabledDate}
          onChange={(d) => {
            if (d && !isDateInSelectedMonth(d)) {
              message.warning('所选时间不在当前筛选年月，请切换月份后再录入。')
              return
            }
            handleCellChange(record.key, field, d ? d.format('YYYY-MM-DD') : '')
          }}
          style={{ width: '100%' }}
          allowClear
        />
      )
    }

    // “负责人”列改为下拉选择
    if (field === 'responsible') {
      return (
        <Select
          value={text}
          onChange={(value) => handleCellChange(record.key, field, value)}
          style={{ width: '100%', fontSize: '12px' }}
          loading={homeroomTeachersLoading}
          showSearch
        >
          {homeroomTeacherOptions.map((name) => (
            <Option key={name} value={name}>
              {name}
            </Option>
          ))}
        </Select>
      )
    }

    if (isTextArea) {
      return (
        <TextArea
          value={text}
          onChange={(e) => handleCellChange(record.key, field, e.target.value)}
          autoSize={{ minRows: 2, maxRows: 6 }}
          style={{ fontSize: '12px' }}
        />
      )
    }

    return (
      <Input
        value={text}
        onChange={(e) => handleCellChange(record.key, field, e.target.value)}
        style={{ fontSize: '12px' }}
      />
    )
  }

  // 处理单元格编辑
  const handleCellChange = (key: string, field: keyof ClassActivityPlanRecord, value: string) => {
    const newData = dataSource.map((item) => {
      if (item.key === key) {
        return { ...item, [field]: value }
      }
      return item
    })
    setDataSource(newData)
  }

  // 添加新行
  const handleAdd = () => {
    const newRecord: ClassActivityPlanRecord = {
      key: `${Date.now()}`,
      time: '',
      location: '',
      activityForm: '',
      mainContent: '',
      responsible: classTeacher || '',
      expectedResult: '',
      processKeyPoints: '',
      actualResult: '',
    }
    setDataSource([...dataSource, newRecord])
    message.success('已添加新行')
  }

  // 编辑行
  const handleEdit = (record: ClassActivityPlanRecord) => {
    setEditingRecord(record)
    form.setFieldsValue({
      ...record,
      time: record.time ? dayjs(record.time) : null,
    })
    setModalVisible(true)
  }

  // 删除行
  const handleDelete = (key: string) => {
    const newData = dataSource.filter((item) => item.key !== key)
    setDataSource(newData)
    message.success('已删除')
  }

  // 处理模态框提交
  const handleModalOk = async () => {
    try {
      const values = await form.validateFields()
      const formatted = {
        ...values,
        time: values.time ? (values.time as any).format('YYYY-MM-DD') : '',
      }
      if (editingRecord) {
        const newData = dataSource.map((item) => {
          if (item.key === editingRecord.key) {
            return { ...item, ...formatted }
          }
          return item
        })
        setDataSource(newData)
        message.success('更新成功')
      }
      setModalVisible(false)
      setEditingRecord(null)
      form.resetFields()
    } catch (error) {
      console.error('表单验证失败:', error)
    }
  }

  // 从后端加载班级列表
  const loadClassList = async (campus?: string) => {
    if (!campus) return
    try {
      setClassListLoading(true)
      const params = new URLSearchParams({ campus })
      const res = await fetch(`${buildApiUrl('/teaching-quality/class-list')}?${params.toString()}`)
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json() as ClassListItem[]
      setClassList(data)

      // 自动选择第一个班级
      if (data.length > 0 && !selectedClass) {
        setSelectedClass(data[0].班级名称)
      }
    } catch (e: any) {
      console.error('加载班级列表失败:', e)
      message.error('加载班级列表失败: ' + (e?.message || '未知错误'))
    } finally {
      setClassListLoading(false)
    }
  }

  // 加载全年汇总数据
  const loadYearSummary = async () => {
    if (!selectedCampus || !selectedClass) return
    setLoadingSummary(true)
    try {
      const allRows: ClassActivityPlanRecord[] = []
      // 加载全年12个月的数据
      for (let month = 1; month <= 12; month++) {
        try {
          const params = new URLSearchParams({
            campus: selectedCampus,
            class: selectedClass,
            year: String(selectedYear),
            month: String(month),
          })
          const res = await fetch(`${buildApiUrl('/teaching-quality/class-activity-plan')}?${params.toString()}`)
          if (res.ok) {
            const respData = await res.json() as {
              神殿名称: string
              班级名称: string
              年份: number
              月份: number
              行列表: Array<{
                序号: number
                时间?: string
                地点?: string
                活动形式?: string
                主要内容?: string
                负责人?: string
                预期结果?: string
                过程关键点?: string
                实标结果?: string
              }>
            }
            const mapped: ClassActivityPlanRecord[] = (respData.行列表 || []).map((r) => ({
              key: `${month}-${r.序号 ?? Math.random()}`,
              time: r.时间 || '',
              location: r.地点 || '',
              activityForm: r.活动形式 || '',
              mainContent: r.主要内容 || '',
              responsible: r.负责人 || '',
              expectedResult: r.预期结果 || '',
              processKeyPoints: r.过程关键点 || '',
              actualResult: r.实标结果 || '',
            }))
            allRows.push(...mapped)
          }
        } catch (e) {
          console.error(`加载${month}月数据失败:`, e)
        }
      }
      setYearSummaryData(allRows)
    } catch (e: any) {
      console.error('加载全年汇总失败:', e)
    } finally {
      setLoadingSummary(false)
    }
  }

  // 从后端加载数据
  const loadData = async () => {
    if (!selectedCampus || !selectedClass || !selectedYear || !selectedMonth) return
    try {
      setLoading(true)
      const params = new URLSearchParams({
        campus: selectedCampus,
        class: selectedClass,
        year: String(selectedYear),
        month: String(selectedMonth),
      })
      const res = await fetch(`${buildApiUrl('/teaching-quality/class-activity-plan')}?${params.toString()}`)
      if (!res.ok) throw new Error(await res.text())
      const respData = await res.json() as {
        神殿名称: string
        班级名称: string
        年份: number
        月份: number
        行列表: Array<{
          序号: number
          时间?: string
          地点?: string
          活动形式?: string
          主要内容?: string
          负责人?: string
          预期结果?: string
          过程关键点?: string
          实标结果?: string
        }>
      }

      const mapped: ClassActivityPlanRecord[] = (respData.行列表 || []).map((r) => ({
        key: String(r.序号 ?? Math.random()),
        time: r.时间 || '',
        location: r.地点 || '',
        activityForm: r.活动形式 || '',
        mainContent: r.主要内容 || '',
        responsible: r.负责人 || '',
        expectedResult: r.预期结果 || '',
        processKeyPoints: r.过程关键点 || '',
        actualResult: r.实标结果 || '',
      }))

      setDataSource(
        mapped.length
          ? mapped
          : [
              {
                key: '1',
                time: '',
                location: '',
                activityForm: '',
                mainContent: '',
                responsible: classTeacher || '',
                expectedResult: '',
                processKeyPoints: '',
                actualResult: '',
              },
            ],
      )
      // 同时加载全年汇总
      await loadYearSummary()
    } catch (e: any) {
      console.error(e)
      message.error('加载数据失败: ' + (e?.message || '未知错误'))
    } finally {
      setLoading(false)
    }
  }

  // 当神殿改变时，加载班级列表
  useEffect(() => {
    if (selectedCampus) {
      loadClassList(selectedCampus)
    } else {
      setClassList([])
      setSelectedClass('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCampus])

  // 从配置中心「班主任管理」加载可选负责人（按神殿过滤）
  const loadHomeroomTeachers = async (campus?: string) => {
    if (!campus) {
      setHomeroomTeacherOptions([])
      return
    }
    try {
      setHomeroomTeachersLoading(true)
      const list = await fetchHomeroomTeachers({ campus_name: campus, active: true })
      const names = Array.from(
        new Set((list || []).map((t) => String(t.name || '').trim()).filter(Boolean)),
      )
      setHomeroomTeacherOptions(names)
    } catch (e: any) {
      console.error('加载班主任列表失败:', e)
      message.error('加载班主任列表失败: ' + (e?.message || '未知错误'))
      setHomeroomTeacherOptions([])
    } finally {
      setHomeroomTeachersLoading(false)
    }
  }

  // 当神殿改变时，同时加载班级列表 + 班主任列表
  useEffect(() => {
    if (selectedCampus) {
      loadHomeroomTeachers(selectedCampus)
    } else {
      setHomeroomTeacherOptions([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCampus])

  // 当班级变化时，从当前神殿的班级列表中提取该班班主任，用于默认填充负责人
  useEffect(() => {
    if (!selectedClass) {
      setClassTeacher('')
      return
    }
    const cls = classList.find((c) => c.班级名称 === selectedClass)
    const teacher = String(cls?.班主任 || '').trim()
    setClassTeacher(teacher)

    // 若当前表格里“负责人”为空，则自动填入班主任
    if (teacher) {
      setDataSource((prev) =>
        prev.map((row) => (row.responsible ? row : { ...row, responsible: teacher })),
      )
    }
  }, [selectedClass, classList])

  // 当班级、年份、月份改变时，加载活动计划数据
  useEffect(() => {
    if (showYearData) {
      // 如果在全年视图，只需要重新加载全年数据
      loadYearSummary()
    } else {
      // 否则加载月度数据
      loadData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCampus, selectedClass, selectedYear, selectedMonth, showYearData])

  // 处理刷新
  const handleRefresh = () => {
    if (showYearData) {
      loadYearSummary()
    } else {
      loadData()
    }
    message.success('数据已刷新')
  }

  // 处理导出
  const handleExport = () => {
    message.info('导出功能开发中...')
  }

  // 处理保存
  const handleSave = async () => {
    if (!selectedCampus || !selectedClass) {
      message.warning('请先选择神殿和班级')
      return
    }
    if (hasMismatchedTimes()) return
    try {
      setSaving(true)
      const payload = {
        神殿名称: selectedCampus,
        班级名称: selectedClass,
        年份: selectedYear,
        月份: selectedMonth,
        行列表: dataSource.map((row, idx) => ({
          序号: idx + 1,
          时间: row.time || undefined,
          地点: row.location || undefined,
          活动形式: row.activityForm || undefined,
          主要内容: row.mainContent || undefined,
          负责人: row.responsible || undefined,
          预期结果: row.expectedResult || undefined,
          过程关键点: row.processKeyPoints || undefined,
          实标结果: row.actualResult || undefined,
        })),
      }

      const res = await fetch(buildApiUrl('/teaching-quality/class-activity-plan'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(await res.text())

      message.success('保存成功')
      setEditMode(false)
      await loadData()
    } catch (e: any) {
      console.error(e)
      message.error('保存失败: ' + (e?.message || '未知错误'))
    } finally {
      setSaving(false)
    }
  }

  // 处理编辑模式切换
  const handleEditToggle = () => {
    setEditMode(!editMode)
  }

  // 处理显示全年数据切换
  const handleToggleYearView = () => {
    if (!showYearData && yearSummaryData.length === 0) {
      // 如果还没有加载全年数据，先加载
      loadYearSummary()
    }
    setShowYearData(!showYearData)
  }

  return (
    <Card
      title={`${selectedClass || 'XX班级'}活动计划安排表${showYearData ? ` - ${selectedYear}年全年数据` : ''}`}
      extra={
        <Space>
          <Select
            style={{ width: 150 }}
            value={selectedCampus}
            onChange={setSelectedCampus}
            placeholder="选择神殿"
          >
            {campuses.map((campus) => (
              <Option key={campus.id} value={campus.name}>
                {campus.name}
              </Option>
            ))}
          </Select>
          <Select
            style={{ width: 120 }}
            value={selectedClass}
            onChange={setSelectedClass}
            placeholder="选择班级"
            loading={classListLoading}
            disabled={!selectedCampus || classListLoading}
          >
            {classList.map((cls) => (
              <Option key={cls.id} value={cls.班级名称}>
                {cls.班级名称}
              </Option>
            ))}
          </Select>
          <Select style={{ width: 120 }} value={selectedYear} onChange={setSelectedYear}>
            <Option value={2023}>2023年</Option>
            <Option value={2024}>2024年</Option>
            <Option value={2025}>2025年</Option>
            <Option value={2026}>2026年</Option>
          </Select>
          {!showYearData && (
            <Select style={{ width: 100 }} value={selectedMonth} onChange={setSelectedMonth}>
              {Array.from({ length: 12 }, (_, i) => (
                <Option key={i + 1} value={i + 1}>
                  {i + 1}月
                </Option>
              ))}
            </Select>
          )}
          <Button
            type={showYearData ? 'primary' : 'default'}
            icon={<CalendarOutlined />}
            onClick={handleToggleYearView}
            loading={loadingSummary}
            disabled={!selectedCampus || !selectedClass}
          >
            {showYearData ? '返回月度视图' : '查看全年数据'}
          </Button>
          {!showYearData && (
            <>
              <Button type="dashed" icon={<PlusOutlined />} onClick={handleAdd}>
                添加
              </Button>
              <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={saving}>
                保存
              </Button>
              <Button icon={<EditOutlined />} onClick={handleEditToggle} disabled={loading}>
                {editMode ? '退出编辑' : '编辑'}
              </Button>
            </>
          )}
          <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={loading}>
            刷新
          </Button>
          <Button icon={<DownloadOutlined />} onClick={handleExport}>
            导出
          </Button>
        </Space>
      }
    >
      <Table
        columns={columns}
        dataSource={showYearData ? yearSummaryData : dataSource}
        loading={showYearData ? loadingSummary : loading}
        pagination={showYearData ? { defaultPageSize: 50, showSizeChanger: true, showTotal: (total) => `共 ${total} 条记录` } : false}
        bordered
        scroll={{ x: 1400 }}
        size="small"
        rowKey="key"
        summary={() => {
          if (!showYearData) {
            const totalCount = yearSummaryData.length
            const activityFormCounts: Record<string, number> = {}
            yearSummaryData.forEach((row) => {
              if (row.activityForm) {
                activityFormCounts[row.activityForm] = (activityFormCounts[row.activityForm] || 0) + 1
              }
            })
            const activityFormSummary = Object.entries(activityFormCounts)
              .map(([form, count]) => `${form}: ${count}次`)
              .join('; ')

            return (
              <Table.Summary fixed>
                <Table.Summary.Row style={{ backgroundColor: '#f0f0f0', fontWeight: 'bold' }}>
                  <Table.Summary.Cell index={0} colSpan={1}>
                    全年汇总
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1} colSpan={1}>
                    共{totalCount}项活动
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2} colSpan={1}>
                    -
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3} colSpan={1}>
                    {activityFormSummary || '-'}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={4} colSpan={1}>
                    -
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={5} colSpan={1}>
                    -
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={6} colSpan={1}>
                    -
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={7} colSpan={1}>
                    -
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={8} colSpan={1}>
                    -
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={9} colSpan={1}>
                    -
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            )
          }
          return null
        }}
      />

      <style>{`
        .ant-table-cell {
          padding: 8px 4px !important;
          font-size: 12px;
        }
      `}</style>

      {/* 编辑模态框 */}
      <Modal
        title="编辑班级活动计划"
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => {
          setModalVisible(false)
          setEditingRecord(null)
          form.resetFields()
        }}
        width={800}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="time" label="时间" rules={[{ required: true, message: '请选择时间' }]}>
            <DatePicker style={{ width: '100%' }} disabledDate={disabledDate} />
          </Form.Item>

          <Form.Item
            name="location"
            label="地点"
            rules={[{ required: true, message: '请输入地点' }]}
          >
            <Input placeholder="例如：T003教室" />
          </Form.Item>

          <Form.Item
            name="activityForm"
            label="活动形式"
            rules={[{ required: true, message: '请输入活动形式' }]}
          >
            <Input placeholder="例如：主题班会、团建活动等" />
          </Form.Item>

          <Form.Item
            name="mainContent"
            label="主要内容"
            rules={[{ required: true, message: '请输入主要内容' }]}
          >
            <TextArea rows={3} placeholder="描述活动的主要内容" />
          </Form.Item>

          <Form.Item
            name="responsible"
            label="负责人"
            rules={[{ required: true, message: '请选择负责人' }]}
          >
            <Select
              placeholder="请选择负责人"
              loading={homeroomTeachersLoading}
              showSearch
              filterOption={(input, option) =>
                String(option?.value || '')
                  .toLowerCase()
                  .includes(String(input || '').toLowerCase())
              }
            >
              {homeroomTeacherOptions.map((name) => (
                <Option key={name} value={name}>
                  {name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="expectedResult" label="预期结果">
            <TextArea rows={2} placeholder="描述预期达到的效果" />
          </Form.Item>

          <Form.Item name="processKeyPoints" label="过程关键点">
            <TextArea rows={3} placeholder="描述活动过程中的关键环节和注意事项" />
          </Form.Item>

          <Form.Item name="actualResult" label="实标结果">
            <TextArea rows={2} placeholder="活动结束后填写实际达成的结果" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}

export default ClassActivityPlanTable
