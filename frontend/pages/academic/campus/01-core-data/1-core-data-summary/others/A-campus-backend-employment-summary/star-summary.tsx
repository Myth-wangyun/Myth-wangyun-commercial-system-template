import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { App,
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Space,
  Popconfirm,
  Row,
  Col,
  Statistic,
  Typography,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import type { ColumnsType } from 'antd/es/table'
import { useCampusStore } from '@/stores/campusStore'
import {
  STORAGE_KEYS,
  MAJOR_LIST,
  PROGRAM_LENGTHS,
} from '@/pages/academic/teaching-content/constants'
import {
  loadCampusData,
  saveCampusData,
  shortCampusName,
} from '@/pages/academic/teaching-content/shared/campusStorage'
import CampusSelector from '@/components/common/CampusSelector'
import { employmentStarService } from '@/services/employmentStar'
import type { EmploymentStarRecord as BackendEmploymentStarRecord, EmploymentStarStats } from '@/types/employment-star'

const { Title } = Typography
const { Option } = Select

type Gender = '男' | '女'

interface EmploymentStarRecord {
  id: string
  serialNumber: number
  campus: string
  studentName: string
  gender: Gender
  graduationAge: number
  education: string
  major: string
  programLength: string
  className: string
  onboardingDate: string
  employmentRegion: string
  employer: string
  jobPosition: string
  salary: number
}

interface EmploymentStarFormData {
  studentName: string
  gender: Gender
  graduationAge: number
  education: string
  major: string
  programLength: string
  className: string
  onboardingDate: dayjs.Dayjs | null
  employmentRegion: string
  employer: string
  jobPosition: string
  salary: number
}

const DEFAULT_ROWS = 8
const EDUCATION_OPTIONS = ['中专', '高中', '大专', '本科', '研究生']

const createDefaultRecords = (campusShort: string): EmploymentStarRecord[] =>
  Array.from({ length: DEFAULT_ROWS }, (_, index) => ({
    id: `${Date.now()}-${index}`,
    serialNumber: index + 1,
    campus: campusShort,
    studentName: '',
    gender: '男',
    graduationAge: 0,
    education: '',
    major: '',
    programLength: '',
    className: '',
    onboardingDate: '',
    employmentRegion: '',
    employer: '',
    jobPosition: '',
    salary: 0,
  }))

const formatCurrency = (value: number): string => (value ? `¥${value.toLocaleString()}` : '')

const CampusEmploymentStarSummary: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus, getAllCampuses } = useCampusStore()
  const activeCampus = currentCampus ?? getAllCampuses()[0]?.name ?? '主神殿'
  const campusShort = shortCampusName(activeCampus)

  // 年份筛选相关状态
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState<number | 'all'>(currentYear)
  const [availableYears, setAvailableYears] = useState<number[]>([currentYear])
  const isHistoricalMode = selectedYear === 'all'
  const [historicalStats, setHistoricalStats] = useState<EmploymentStarStats | null>(null)

  const [dataSource, setDataSource] = useState<EmploymentStarRecord[]>(() =>
    createDefaultRecords(campusShort),
  )
  const [modalVisible, setModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<EmploymentStarRecord | null>(null)
  const [form] = Form.useForm<EmploymentStarFormData>()
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)

  // 加载可用年份列表
  const loadAvailableYears = useCallback(async () => {
    try {
      const years = await employmentStarService.getAvailableYears(activeCampus)
      setAvailableYears(years)
    } catch (error) {
      console.error('获取年份列表失败:', error)
    }
  }, [activeCampus])

  // 加载历史汇总数据
  const loadHistoricalData = useCallback(async () => {
    setLoading(true)
    try {
      const stats = await employmentStarService.getHistoricalSummary(activeCampus)
      setHistoricalStats(stats)
      setDataSource([]) // 历史合计模式下不显示明细列表
    } catch (error) {
      console.error('获取历史汇总数据失败:', error)
      message.error('获取历史汇总数据失败')
    } finally {
      setLoading(false)
    }
  }, [activeCampus])

  // 加载数据
  const loadData = useCallback(async () => {
    // 如果是历史合计模式，加载汇总数据
    if (isHistoricalMode) {
      await loadHistoricalData()
      return
    }

    const fallback = createDefaultRecords(campusShort)
    setLoading(true)
    try {
      // 1) 优先从后端读取已保存的就业明星汇总表
      const backendStars = await employmentStarService.getSavedEmploymentStarsData(activeCampus)
      if (backendStars && backendStars.length > 0) {
        const baseTime = Date.now()
        // 按年份筛选
        const yearFilter = typeof selectedYear === 'number' ? selectedYear : undefined
        const filteredStars = yearFilter
          ? backendStars.filter((s) => {
              if (!s.entryTime) return false
              const itemYear = parseInt(s.entryTime.substring(0, 4), 10)
              return itemYear === yearFilter
            })
          : backendStars
        
        const mapped: EmploymentStarRecord[] = filteredStars.map((s, index) => ({
          id: `${baseTime}-${index}`,
          serialNumber: s.serialNumber || index + 1,
          campus: campusShort,
          studentName: s.studentName,
          gender: (s.gender as Gender) || '男',
          graduationAge: s.graduationAge || 0,
          education: s.highestEducation || '',
          major: s.major || '',
          programLength: s.programLength || '',
          className: s.className || '',
          onboardingDate: s.entryTime ? dayjs(s.entryTime).format('YYYY-MM') : '',
          employmentRegion: s.employmentRegion || '',
          employer: s.employer || '',
          jobPosition: s.jobPosition || '',
          salary: s.employmentSalary || 0,
        }))
        setDataSource(mapped)
        return
      }
    } catch (error) {
      console.error('加载后端就业明星汇总表失败:', error)
    } finally {
      setLoading(false)
    }

    // 2) 如果后端没有数据，则使用本地缓存或默认行
    const loaded = loadCampusData<EmploymentStarRecord[]>(
      STORAGE_KEYS.CAMPUS_EMPLOYMENT_STAR_SUMMARY,
      activeCampus,
      fallback,
    )
    // 按年份筛选本地数据
    const yearFilter = typeof selectedYear === 'number' ? selectedYear : undefined
    const filteredData = yearFilter && loaded
      ? loaded.filter((item) => {
          if (!item.onboardingDate) return false
          const itemYear = parseInt(item.onboardingDate.substring(0, 4), 10)
          return itemYear === yearFilter
        })
      : loaded
    setDataSource(filteredData && filteredData.length > 0 ? filteredData : fallback)
  }, [activeCampus, campusShort, selectedYear, isHistoricalMode, loadHistoricalData])

  // 加载年份列表
  useEffect(() => {
    loadAvailableYears()
  }, [loadAvailableYears])

  // 监听神殿和年份变化
  useEffect(() => {
    loadData()
  }, [loadData])

  // 保存数据（非历史合计模式）
  useEffect(() => {
    if (!isHistoricalMode && dataSource.length > 0) {
      saveCampusData(STORAGE_KEYS.CAMPUS_EMPLOYMENT_STAR_SUMMARY, activeCampus, dataSource)
    }
  }, [dataSource, activeCampus, isHistoricalMode])

  const handleAdd = () => {
    setEditingRecord(null)
    form.resetFields()
    form.setFieldsValue({
      gender: '男',
      graduationAge: 20,
      education: EDUCATION_OPTIONS[0],
      major: MAJOR_LIST[0],
      programLength: PROGRAM_LENGTHS[0],
      onboardingDate: null,
      salary: 0,
    })
    setModalVisible(true)
  }

  const handleAutoGenerateFromBackend = async () => {
    try {
      const backendStars = await employmentStarService.getEmploymentStarsData(activeCampus)
      if (!backendStars || backendStars.length === 0) {
        message.info('未找到薪资大于等于1万的就业明星记录')
        return
      }

      const baseTime = Date.now()
      const mapped = backendStars.map((s, index) => ({
        id: `${baseTime}-${index}`,
        serialNumber: index + 1,
        campus: campusShort,
        studentName: s.studentName,
        gender: (s.gender as Gender) || '男',
        graduationAge: s.graduationAge || 0,
        education: s.highestEducation || '',
        major: s.major || '',
        programLength: s.programLength || '',
        className: s.className || '',
        onboardingDate: s.entryTime ? dayjs(s.entryTime).format('YYYY-MM') : '',
        employmentRegion: s.employmentRegion || '',
        employer: s.employer || '',
        jobPosition: s.jobPosition || '',
        salary: s.employmentSalary || 0,
      }))

      setDataSource(mapped)
      message.success('已根据就业明细自动生成就业明星记录')
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('自动生成就业明星失败:', error)
      message.error('自动生成就业明星失败，请检查后端就业明细数据')
    }
  }

  const handleEdit = (record: EmploymentStarRecord) => {
    setEditingRecord(record)
    form.setFieldsValue({
      ...record,
      onboardingDate: record.onboardingDate ? dayjs(record.onboardingDate) : null,
    })
    setModalVisible(true)
  }

  const handleDelete = (id: string) => {
    setDataSource((prev) =>
      prev
        .filter((item) => item.id !== id)
        .map((item, index) => ({ ...item, serialNumber: index + 1 })),
    )
    message.success('删除成功')
  }

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      const normalized: EmploymentStarRecord = {
        id: editingRecord?.id || `${Date.now()}`,
        serialNumber: editingRecord?.serialNumber || dataSource.length + 1,
        campus: campusShort,
        studentName: values.studentName.trim(),
        gender: values.gender,
        graduationAge: Number(values.graduationAge) || 0,
        education: values.education,
        major: values.major,
        programLength: values.programLength,
        className: values.className.trim(),
        onboardingDate: values.onboardingDate ? values.onboardingDate.format('YYYY-MM') : '',
        employmentRegion: values.employmentRegion.trim(),
        employer: values.employer.trim(),
        jobPosition: values.jobPosition.trim(),
        salary: Number(values.salary) || 0,
      }

      setDataSource((prev) => {
        if (editingRecord) {
          return prev.map((item) => (item.id === editingRecord.id ? normalized : item))
        }

        return [...prev, normalized].map((item, index) => ({
          ...item,
          serialNumber: index + 1,
        }))
      })

      form.resetFields()
      setModalVisible(false)
      message.success(editingRecord ? '更新成功' : '添加成功')
    } catch {
      // ignore
    }
  }

  const handleSaveToBackend = async () => {
    if (!activeCampus) {
      message.warning('请先选择神殿')
      return
    }
    const nonEmpty = dataSource.filter((item) => item.studentName && item.salary)
    if (nonEmpty.length === 0) {
      message.warning('当前没有可保存的就业明星数据')
      return
    }
    try {
      setSaving(true)
      const payload: BackendEmploymentStarRecord[] = nonEmpty.map((item, index) => ({
        key: `star-${item.serialNumber || index + 1}`,
        studentName: item.studentName,
        gender: item.gender,
        graduationAge: item.graduationAge,
        highestEducation: item.education,
        major: item.major,
        programLength: item.programLength,
        className: item.className,
        entryTime: item.onboardingDate ? dayjs(item.onboardingDate).format('YYYY-MM') : '',
        employmentRegion: item.employmentRegion,
        employer: item.employer,
        jobPosition: item.jobPosition,
        employmentSalary: item.salary,
        campus: activeCampus,
        serialNumber: item.serialNumber,
      }))
      await employmentStarService.saveEmploymentStarsData(activeCampus, payload)
      message.success('已保存到后端就业明星汇总表')
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('保存就业明星失败:', error)
      message.error('保存失败，请稍后重试')
    } finally {
      setSaving(false)
    }
  }

  const statistics = useMemo(() => {
    const count = dataSource.filter((item) => item.studentName).length
    const totalSalary = dataSource.reduce((sum, item) => sum + item.salary, 0)
    return {
      starCount: count,
      totalSalary,
      averageSalary: count > 0 ? totalSalary / count : 0,
    }
  }, [dataSource])

  const columns: ColumnsType<EmploymentStarRecord> = [
    {
      title: '序号',
      dataIndex: 'serialNumber',
      key: 'serialNumber',
      width: 70,
      align: 'center',
    },
    {
      title: '学员姓名',
      dataIndex: 'studentName',
      key: 'studentName',
      width: 120,
      align: 'center',
    },
    {
      title: '性别',
      dataIndex: 'gender',
      key: 'gender',
      width: 80,
      align: 'center',
    },
    {
      title: '毕业年龄',
      dataIndex: 'graduationAge',
      key: 'graduationAge',
      width: 100,
      align: 'center',
      render: (value) => (value ? `${value}` : ''),
    },
    {
      title: '最高学历',
      dataIndex: 'education',
      key: 'education',
      width: 110,
      align: 'center',
    },
    {
      title: '专业',
      dataIndex: 'major',
      key: 'major',
      width: 110,
      align: 'center',
    },
    {
      title: '学制',
      dataIndex: 'programLength',
      key: 'programLength',
      width: 110,
      align: 'center',
    },
    {
      title: '班级名称',
      dataIndex: 'className',
      key: 'className',
      width: 120,
      align: 'center',
    },
    {
      title: '入职时间',
      dataIndex: 'onboardingDate',
      key: 'onboardingDate',
      width: 120,
      align: 'center',
      render: (value) => (value ? dayjs(value).format('YYYY-MM') : ''),
    },
    {
      title: '就业地区',
      dataIndex: 'employmentRegion',
      key: 'employmentRegion',
      width: 120,
      align: 'center',
    },
    {
      title: '就业单位',
      dataIndex: 'employer',
      key: 'employer',
      width: 200,
    },
    {
      title: '就业岗位',
      dataIndex: 'jobPosition',
      key: 'jobPosition',
      width: 150,
      align: 'center',
    },
    {
      title: '就业薪资',
      dataIndex: 'salary',
      key: 'salary',
      width: 140,
      align: 'center',
      render: formatCurrency,
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      fixed: 'right',
      align: 'center',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm title="确定删除该记录？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" icon={<DeleteOutlined />} danger size="small">
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  // 历史合计模式下使用 historicalStats
  const displayStats = isHistoricalMode && historicalStats
    ? {
        starCount: historicalStats.totalStars || 0,
        totalSalary: (historicalStats.totalStars || 0) * (historicalStats.averageSalary || 0),
        averageSalary: historicalStats.averageSalary || 0,
        highestSalary: historicalStats.highestSalary || 0,
        lowestSalary: historicalStats.lowestSalary || 0,
      }
    : {
        ...statistics,
        highestSalary: dataSource.length > 0 ? Math.max(...dataSource.map((s) => s.salary || 0)) : 0,
        lowestSalary: dataSource.length > 0 ? Math.min(...dataSource.filter((s) => s.salary > 0).map((s) => s.salary)) : 0,
      }

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <Title level={4} style={{ margin: 0 }}>
            {activeCampus}后端就业明星汇总表{isHistoricalMode ? ' - 历史合计' : ''}
          </Title>
          <Space>
            <Select
              value={selectedYear}
              onChange={(value) => setSelectedYear(value)}
              style={{ width: 120 }}
            >
              <Option value="all">历史合计</Option>
              {availableYears.map((year) => (
                <Option key={year} value={year}>{year}年</Option>
              ))}
            </Select>
            <CampusSelector />
          </Space>
        </div>

        {/* 历史合计模式提示 */}
        {isHistoricalMode && (
          <div style={{ marginBottom: 16, padding: '12px 16px', background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 4 }}>
            <span style={{ color: '#52c41a' }}>📊 当前显示的是历史合计数据（汇总所有年份），仅供查看统计信息，不支持编辑操作。</span>
          </div>
        )}

        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Statistic title="明星人数" value={displayStats.starCount} />
          </Col>
          <Col span={6}>
            <Statistic title="平均薪资" value={formatCurrency(displayStats.averageSalary)} />
          </Col>
          <Col span={6}>
            <Statistic title="最高薪资" value={formatCurrency(displayStats.highestSalary)} />
          </Col>
          <Col span={6}>
            <Statistic title="最低薪资" value={formatCurrency(displayStats.lowestSalary)} />
          </Col>
        </Row>

        {/* 操作按钮 - 历史合计模式下隐藏 */}
        {!isHistoricalMode && (
        <div style={{ marginBottom: 16 }}>
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              添加就业明星
            </Button>
            <Button onClick={handleAutoGenerateFromBackend}>
              从就业明细自动生成就业明星
            </Button>
            <Button type="primary" onClick={handleSaveToBackend} loading={saving}>
              保存到后端
            </Button>
          </Space>
        </div>
        )}

        {/* 数据表格 - 历史合计模式下隐藏 */}
        {!isHistoricalMode && (
        <Table<EmploymentStarRecord>
          columns={columns}
          dataSource={dataSource}
          rowKey="id"
          bordered
          pagination={false}
          loading={loading}
          scroll={{ x: 1400 }}
          summary={() => (
            <Table.Summary fixed>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0}>合计/平均</Table.Summary.Cell>
                <Table.Summary.Cell index={1} />
                <Table.Summary.Cell index={2} />
                <Table.Summary.Cell index={3} />
                <Table.Summary.Cell index={4} />
                <Table.Summary.Cell index={5} />
                <Table.Summary.Cell index={6} />
                <Table.Summary.Cell index={7} />
                <Table.Summary.Cell index={8}>{statistics.starCount}</Table.Summary.Cell>
                <Table.Summary.Cell index={9} />
                <Table.Summary.Cell index={10} />
                <Table.Summary.Cell index={11} />
                <Table.Summary.Cell index={12}>
                  {formatCurrency(statistics.totalSalary)}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={13}>
                  {formatCurrency(statistics.averageSalary)}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={14} />
              </Table.Summary.Row>
            </Table.Summary>
          )}
        />
        )}
      </Card>

      <Modal
        title={editingRecord ? '编辑就业明星' : '添加就业明星'}
        open={modalVisible}
        onCancel={() => {
          form.resetFields()
          setModalVisible(false)
        }}
        onOk={handleSave}
        destroyOnHidden
        width={700}
      >
        <Form<EmploymentStarFormData> form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="学员姓名"
                name="studentName"
                rules={[{ required: true, message: '请输入学员姓名' }]}
              >
                <Input placeholder="请输入学员姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="性别"
                name="gender"
                rules={[{ required: true, message: '请选择性别' }]}
              >
                <Select>
                  <Option value="男">男</Option>
                  <Option value="女">女</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="毕业年龄"
                name="graduationAge"
                rules={[{ required: true, message: '请输入毕业年龄' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="最高学历"
                name="education"
                rules={[{ required: true, message: '请选择最高学历' }]}
              >
                <Select placeholder="请选择学历">
                  {EDUCATION_OPTIONS.map((item) => (
                    <Option key={item} value={item}>
                      {item}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="专业"
                name="major"
                rules={[{ required: true, message: '请选择专业' }]}
              >
                <Select placeholder="请选择专业">
                  {MAJOR_LIST.map((item) => (
                    <Option key={item} value={item}>
                      {item}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="学制"
                name="programLength"
                rules={[{ required: true, message: '请选择学制' }]}
              >
                <Select placeholder="请选择学制">
                  {PROGRAM_LENGTHS.map((item) => (
                    <Option key={item} value={item}>
                      {item}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="班级名称"
                name="className"
                rules={[{ required: true, message: '请输入班级名称' }]}
              >
                <Input placeholder="如 Y32" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="入职时间" name="onboardingDate">
                <DatePicker picker="month" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="就业地区"
                name="employmentRegion"
                rules={[{ required: true, message: '请输入就业地区' }]}
              >
                <Input placeholder="请输入就业地区" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="就业单位"
                name="employer"
                rules={[{ required: true, message: '请输入就业单位' }]}
              >
                <Input placeholder="请输入就业单位" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="就业岗位"
                name="jobPosition"
                rules={[{ required: true, message: '请输入就业岗位' }]}
              >
                <Input placeholder="请输入就业岗位" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="就业薪资"
                name="salary"
                rules={[{ required: true, message: '请输入就业薪资' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} addonBefore="¥" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  )
}

export default CampusEmploymentStarSummary
