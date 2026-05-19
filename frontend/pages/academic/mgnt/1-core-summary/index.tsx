// 01_最高议事厅智慧司核心数据汇总表
import React, { useState, useEffect, useMemo } from 'react'
import { App,
  Card,
  Table,
  Button,
  Space,
  Typography,
  Row,
  Col,
  Statistic,
  Modal,
  Form,
  InputNumber,
  Select,
  Tabs,
} from 'antd'
import {
  PlusOutlined,
  ReloadOutlined,
  DownloadOutlined,
  UploadOutlined,
  EditOutlined,
  DeleteOutlined,
  FileTextOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { ExcelService } from '@/pages/academic/teaching-content/shared/services/excel'
import AllCampusLevelPages from '../campus-level/AllCampusLevelPages'
import { useCampusStore, getCampusNamesWithFallback } from '@/stores/campusStore'
import type { CoreSummaryRecord, CoreSummaryStats } from './types'
import { CoreSummaryService } from './service'
import { sortCampuses } from '@/utils/campusSort'

const { Title, Text } = Typography
const { Option } = Select

// 本页切换为只读：数据来自“神殿 · 1. 神殿核心数据汇总”
const READ_ONLY = true

const CoreSummaryPage: React.FC = () => {
  const { message, modal } = App.useApp()
  const { getAllCampuses } = useCampusStore()
  const [data, setData] = useState<CoreSummaryRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<CoreSummaryRecord | null>(null)
  const [stats, setStats] = useState<CoreSummaryStats | null>(null)
  const [selectedYear, setSelectedYear] = useState<number | 'all'>(new Date().getFullYear())
  const [form] = Form.useForm()
  const campuses = getAllCampuses()
  const campusOptions = useMemo(() => {
    const fallback = getCampusNamesWithFallback().map((n) => n.replace(/神殿$/, '') || n)
    const resolved = campuses
      .map((c) => c.name.replace(/神殿$/, '') || c.name)
      .filter(Boolean)
    const names = resolved.length ? Array.from(new Set(resolved)) : fallback
    // 使用 sortCampuses 对神殿名称进行排序
    return sortCampuses(names.map((name) => ({ label: name, value: name })), 'label')
  }, [campuses])
  
  // 生成年份选项（从2020到当前年份+1，加上历史合计）
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear()
    const years: (number | 'all')[] = ['all']  // 历史合计放在最前面
    for (let y = currentYear + 1; y >= 2020; y--) {
      years.push(y)
    }
    return years
  }, [])
  // 顶部选择功能已挪到 AcademicCoreBusinessSummaryAll 页，这里不再重复渲染 Tabs

  // 加载数据
  const loadData = async (year?: number | 'all') => {
    setLoading(true)
    try {
      const records = await CoreSummaryService.getAll(year ?? selectedYear)
      setData(records)

      const statsData = await CoreSummaryService.getStats(records)
      setStats(statsData)
    } catch (error) {
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData(selectedYear)
  }, [selectedYear])

  // 新增
  const handleAdd = () => {
    setEditingRecord(null)
    form.resetFields()
    setModalVisible(true)
  }

  // 编辑
  const handleEdit = (record: CoreSummaryRecord) => {
    setEditingRecord(record)
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  // 删除
  const handleDelete = (record: CoreSummaryRecord) => {
    modal.confirm({
      title: '确认删除',
      content: `确定要删除 ${record.campus} 的数据吗？`,
      onOk: async () => {
        try {
          await CoreSummaryService.delete(record.id)
          message.success('删除成功')
          loadData()
        } catch (error) {
          message.error('删除失败')
        }
      },
    })
  }

  // 提交表单
  const handleSubmit = async (values: any) => {
    try {
      if (editingRecord) {
        await CoreSummaryService.update(editingRecord.id, values)
        message.success('更新成功')
      } else {
        await CoreSummaryService.create(values)
        message.success('创建成功')
      }
      setModalVisible(false)
      loadData()
    } catch (error) {
      message.error(editingRecord ? '更新失败' : '创建失败')
    }
  }

  // 导出Excel
  const handleExport = async () => {
    try {
      const exportData = data.map((item, index) => ({
        序号: index + 1,
        神殿: item.campus,
        在校生人数: item.enrolledStudents,
        班级数量: item.classCount,
        智慧司人数: item.academicStaffCount,
        干部人数: item.cadreCount,
        员工人数: item.employeeCount,
        就业班级数量: item.employmentClassCount,
        毕业生人数: item.graduateCount,
        就业率: `${item.employmentRate}%`,
        就业薪资: item.employmentSalary,
        薪资过万人数: item.highSalaryCount,
        口碑招生人数: item.wordOfMouthEnrollments,
        口碑招生收入: item.wordOfMouthRevenue,
        新生入学人数: item.newStudentEnrollments,
        新生流失人数: item.newStudentAttrition,
        实际招聘人数: item.recruitmentCount,
        离职人数: item.offboardingCount,
      }))

      const columns = [
        '序号',
        '神殿',
        '在校生人数',
        '班级数量',
        '智慧司人数',
        '干部人数',
        '员工人数',
        '就业班级数量',
        '毕业生人数',
        '就业率',
        '就业薪资',
        '薪资过万人数',
        '口碑招生人数',
        '口碑招生收入',
        '新生入学人数',
        '新生流失人数',
        '实际招聘人数',
        '离职人数',
      ]

      ExcelService.exportExcel({
        fileName: '01_最高议事厅智慧司核心数据汇总表',
        sheetName: '核心数据汇总',
        columns,
        data: exportData,
      })
      message.success('导出成功')
    } catch (error) {
      message.error('导出失败')
    }
  }

  // 导入Excel
  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.xlsx,.xls'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      try {
        setLoading(true)
        const importedData = await ExcelService.importExcel(file)

        const convertedData = importedData.map((item: any) => ({
          campus: item['神殿'] || item.campus || '',
          enrolledStudents: Number(item['在校生人数'] || item.enrolledStudents || 0),
          classCount: Number(item['班级数量'] || item.classCount || 0),
          academicStaffCount: Number(item['智慧司人数'] || item.academicStaffCount || 0),
          cadreCount: Number(item['干部人数'] || item.cadreCount || 0),
          employeeCount: Number(item['员工人数'] || item.employeeCount || 0),
          employmentClassCount: Number(item['就业班级数量'] || item.employmentClassCount || 0),
          graduateCount: Number(item['毕业生人数'] || item.graduateCount || 0),
          employmentRate: parseFloat(
            (item['就业率'] || item.employmentRate || '0').toString().replace('%', ''),
          ),
          employmentSalary: Number(item['就业薪资'] || item.employmentSalary || 0),
          highSalaryCount: Number(item['薪资过万人数'] || item.highSalaryCount || 0),
          wordOfMouthEnrollments: Number(item['口碑招生人数'] || item.wordOfMouthEnrollments || 0),
          wordOfMouthRevenue: Number(item['口碑招生收入'] || item.wordOfMouthRevenue || 0),
          newStudentEnrollments: Number(item['新生入学人数'] || item.newStudentEnrollments || 0),
          newStudentAttrition: Number(item['新生流失人数'] || item.newStudentAttrition || 0),
        }))

        let successCount = 0
        let failCount = 0
        for (const record of convertedData) {
          try {
            await CoreSummaryService.create(record)
            successCount++
          } catch (error) {
            console.error('导入单条数据失败:', error)
            failCount++
          }
        }

        if (successCount > 0) {
          message.success(
            `导入成功，共导入 ${successCount} 条数据${failCount > 0 ? `，失败 ${failCount} 条` : ''}`,
          )
        } else {
          message.error(`导入失败，共失败 ${failCount} 条数据`)
        }
        loadData()
      } catch (error) {
        console.error('导入失败:', error)
        message.error('导入失败: ' + (error instanceof Error ? error.message : '未知错误'))
      } finally {
        setLoading(false)
      }
    }
    input.click()
  }

  // 表格列定义
  const columnsBase: ColumnsType<CoreSummaryRecord> = [
    {
      title: '序号',
      dataIndex: 'serialNumber',
      key: 'serialNumber',
      width: 60,
      align: 'center',
      fixed: 'left',
    },
    {
      title: '神殿',
      dataIndex: 'campus',
      key: 'campus',
      width: 80,
      align: 'center',
      fixed: 'left',
    },
    {
      title: '在校生人数',
      dataIndex: 'enrolledStudents',
      key: 'enrolledStudents',
      width: 110,
      align: 'center',
    },
    {
      title: '班级数量',
      dataIndex: 'classCount',
      key: 'classCount',
      width: 90,
      align: 'center',
    },
    {
      title: '智慧司人数',
      dataIndex: 'academicStaffCount',
      key: 'academicStaffCount',
      width: 110,
      align: 'center',
    },
    {
      title: '干部人数',
      dataIndex: 'cadreCount',
      key: 'cadreCount',
      width: 90,
      align: 'center',
    },
    {
      title: '员工人数',
      dataIndex: 'employeeCount',
      key: 'employeeCount',
      width: 90,
      align: 'center',
    },
    {
      title: '就业班级数量',
      dataIndex: 'employmentClassCount',
      key: 'employmentClassCount',
      width: 120,
      align: 'center',
    },
    {
      title: '毕业生人数',
      dataIndex: 'graduateCount',
      key: 'graduateCount',
      width: 110,
      align: 'center',
    },
    {
      title: '就业率',
      dataIndex: 'employmentRate',
      key: 'employmentRate',
      width: 90,
      align: 'center',
      render: (value) => (value || value === 0 ? `${(value * 100).toFixed(1)}%` : '-'),
    },
    {
      title: '就业薪资',
      dataIndex: 'employmentSalary',
      key: 'employmentSalary',
      width: 100,
      align: 'center',
      render: (value) => (value || value === 0 ? `¥${value.toLocaleString()}` : '-'),
    },
    {
      title: '薪资过万人数',
      dataIndex: 'highSalaryCount',
      key: 'highSalaryCount',
      width: 120,
      align: 'center',
    },
    {
      title: '口碑招生人数',
      dataIndex: 'wordOfMouthEnrollments',
      key: 'wordOfMouthEnrollments',
      width: 120,
      align: 'center',
    },
    {
      title: '口碑招生收入',
      dataIndex: 'wordOfMouthRevenue',
      key: 'wordOfMouthRevenue',
      width: 120,
      align: 'center',
      render: (value) => (value || value === 0 ? `¥${value.toLocaleString()}` : '-'),
    },
    {
      title: '新生入学人数',
      dataIndex: 'newStudentEnrollments',
      key: 'newStudentEnrollments',
      width: 120,
      align: 'center',
    },
    {
      title: '新生流失人数',
      dataIndex: 'newStudentAttrition',
      key: 'newStudentAttrition',
      width: 120,
      align: 'center',
    },
    {
      title: '实际招聘人数',
      dataIndex: 'recruitmentCount',
      key: 'recruitmentCount',
      width: 120,
      align: 'center',
    },
    {
      title: '离职人数',
      dataIndex: 'offboardingCount',
      key: 'offboardingCount',
      width: 100,
      align: 'center',
    },
  ]

  const columns: ColumnsType<CoreSummaryRecord> = READ_ONLY
    ? columnsBase // 不附加"操作"列
    : [
        ...columnsBase,
        {
          title: '操作',
          key: 'action',
          width: 120,
          align: 'center',
          fixed: 'right',
          render: (_, record) => (
            <Space size="small">
              <Button
                type="link"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
                size="small"
              >
                编辑
              </Button>
              <Button
                type="link"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDelete(record)}
                size="small"
              >
                删除
              </Button>
            </Space>
          ),
        },
      ]

  // 计算合计行
  const summaryRow = () => {
    if (data.length === 0) return null

    const totals = data.reduce(
      (acc, curr) => ({
        enrolledStudents: acc.enrolledStudents + curr.enrolledStudents,
        classCount: acc.classCount + curr.classCount,
        academicStaffCount: acc.academicStaffCount + curr.academicStaffCount,
        cadreCount: acc.cadreCount + curr.cadreCount,
        employeeCount: acc.employeeCount + curr.employeeCount,
        employmentClassCount: acc.employmentClassCount + curr.employmentClassCount,
        graduateCount: acc.graduateCount + curr.graduateCount,
        employmentTargetCount: acc.employmentTargetCount + (curr.employmentTargetCount || 0),
        employmentActualCount: acc.employmentActualCount + (curr.employmentActualCount || 0),
        employmentSalarySum: acc.employmentSalarySum + curr.employmentSalary,
        highSalaryCount: acc.highSalaryCount + curr.highSalaryCount,
        wordOfMouthEnrollments: acc.wordOfMouthEnrollments + curr.wordOfMouthEnrollments,
        wordOfMouthRevenue: acc.wordOfMouthRevenue + curr.wordOfMouthRevenue,
        newStudentEnrollments: acc.newStudentEnrollments + curr.newStudentEnrollments,
        newStudentAttrition: acc.newStudentAttrition + curr.newStudentAttrition,
        recruitmentCount: acc.recruitmentCount + curr.recruitmentCount,
        offboardingCount: acc.offboardingCount + curr.offboardingCount,
      }),
      {
        enrolledStudents: 0,
        classCount: 0,
        academicStaffCount: 0,
        cadreCount: 0,
        employeeCount: 0,
        employmentClassCount: 0,
        graduateCount: 0,
        employmentTargetCount: 0,
        employmentActualCount: 0,
        employmentSalarySum: 0,
        highSalaryCount: 0,
        wordOfMouthEnrollments: 0,
        wordOfMouthRevenue: 0,
        newStudentEnrollments: 0,
        newStudentAttrition: 0,
        recruitmentCount: 0,
        offboardingCount: 0,
      },
    )

    // 动态生成单元格，避免只读模式下列数不一致
    let i = 0
    // 合计就业率 = 所有神殿所有班的就业人数总和 / 所有神殿所有班的需就业人数总和
    const avgRate = totals.employmentTargetCount > 0
      ? `${((totals.employmentActualCount / totals.employmentTargetCount) * 100).toFixed(1)}%`
      : '-'
    const avgSalary =
      data.length > 0 ? Math.round(totals.employmentSalarySum / data.length).toLocaleString() : '0'
    
    // 调试输出
    console.log('就业率计算调试:', {
      employmentTargetCount: totals.employmentTargetCount,
      employmentActualCount: totals.employmentActualCount,
      avgRate,
      dataLength: data.length,
      sampleData: data.slice(0, 3).map(d => ({
        campus: d.campus,
        employmentTargetCount: d.employmentTargetCount,
        employmentActualCount: d.employmentActualCount,
        employmentRate: d.employmentRate
      }))
    })

    return (
      <Table.Summary fixed="bottom">
        <Table.Summary.Row style={{ backgroundColor: '#fafafa', fontWeight: 'bold' }}>
          <Table.Summary.Cell index={i++} align="center">
            合计/平均
          </Table.Summary.Cell>
          <Table.Summary.Cell index={i++} align="center">
            -
          </Table.Summary.Cell>
          <Table.Summary.Cell index={i++} align="center">
            {totals.enrolledStudents}
          </Table.Summary.Cell>
          <Table.Summary.Cell index={i++} align="center">
            {totals.classCount}
          </Table.Summary.Cell>
          <Table.Summary.Cell index={i++} align="center">
            {totals.academicStaffCount}
          </Table.Summary.Cell>
          <Table.Summary.Cell index={i++} align="center">
            {totals.cadreCount}
          </Table.Summary.Cell>
          <Table.Summary.Cell index={i++} align="center">
            {totals.employeeCount}
          </Table.Summary.Cell>
          <Table.Summary.Cell index={i++} align="center">
            {totals.employmentClassCount}
          </Table.Summary.Cell>
          <Table.Summary.Cell index={i++} align="center">
            {totals.graduateCount}
          </Table.Summary.Cell>
          <Table.Summary.Cell index={i++} align="center">
            {avgRate}
          </Table.Summary.Cell>
          <Table.Summary.Cell index={i++} align="center">
            ¥{avgSalary}
          </Table.Summary.Cell>
          <Table.Summary.Cell index={i++} align="center">
            {totals.highSalaryCount}
          </Table.Summary.Cell>
          <Table.Summary.Cell index={i++} align="center">
            {totals.wordOfMouthEnrollments}
          </Table.Summary.Cell>
          <Table.Summary.Cell index={i++} align="center">
            ¥{totals.wordOfMouthRevenue.toLocaleString()}
          </Table.Summary.Cell>
          <Table.Summary.Cell index={i++} align="center">
            {totals.newStudentEnrollments}
          </Table.Summary.Cell>
          <Table.Summary.Cell index={i++} align="center">
            {totals.newStudentAttrition}
          </Table.Summary.Cell>
          <Table.Summary.Cell index={i++} align="center">
            {totals.recruitmentCount}
          </Table.Summary.Cell>
          <Table.Summary.Cell index={i++} align="center">
            {totals.offboardingCount}
          </Table.Summary.Cell>
          {!READ_ONLY && (
            <Table.Summary.Cell index={i++} align="center">
              -
            </Table.Summary.Cell>
          )}
        </Table.Summary.Row>
      </Table.Summary>
    )
  }

  return (
    <div style={{ padding: 24 }}>
      {/* 顶部标题/Tabs 已在父页统一显示，这里仅渲染核心数据内容 */}
      <>
        {/* 统计卡片 */}
        {stats && (
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="总在校生人数"
                  value={stats.totalEnrolledStudents}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="总班级数量"
                  value={stats.totalClasses}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="平均就业率"
                  value={stats.avgEmploymentRate}
                  suffix="%"
                  precision={1}
                  valueStyle={{ color: '#cf1322' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="总口碑收入"
                  value={stats.totalRevenue}
                  prefix="¥"
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
          </Row>
        )}
      </>

      {/* 操作按钮 */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 8 }}>
          <Text type="secondary">数据自动汇总自各业务表（班级档案、教员档案、就业汇总、口碑招生、新生维稳等），本页为只读。</Text>
        </div>
        <Space>
          <span>选择年份：</span>
          <Select
            value={selectedYear}
            onChange={(value) => setSelectedYear(value)}
            style={{ width: 120 }}
          >
            {yearOptions.map((year) => (
              <Option key={year} value={year}>
                {year === 'all' ? '历史合计' : `${year}年`}
              </Option>
            ))}
          </Select>
          <Button icon={<ReloadOutlined />} onClick={() => loadData(selectedYear)}>
            刷新
          </Button>
          <Button icon={<DownloadOutlined />} onClick={handleExport}>
            导出Excel
          </Button>
        </Space>
      </Card>

      {/* 数据表格 */}
      <Card>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{
            defaultPageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
          }}
          scroll={{ x: 2000, y: 600 }}
          sticky
          size="small"
          bordered
          summary={summaryRow}
        />
      </Card>

      {/* 编辑/新增模态框 */}
      {!READ_ONLY && (
        <Modal
          title={editingRecord ? '编辑数据' : '新增数据'}
          open={modalVisible}
          onCancel={() => setModalVisible(false)}
          footer={null}
          width={800}
          destroyOnHidden
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="campus"
                  label="神殿"
                  rules={[{ required: true, message: '请选择神殿' }]}
                >
                  <Select placeholder="请选择神殿">
                    {campusOptions.map((option) => (
                      <Option key={option.value} value={option.value}>
                        {option.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="enrolledStudents"
                  label="在校生人数"
                  rules={[{ required: true, message: '请输入在校生人数' }]}
                >
                  <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入在校生人数" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="classCount"
                  label="班级数量"
                  rules={[{ required: true, message: '请输入班级数量' }]}
                >
                  <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入班级数量" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="academicStaffCount"
                  label="智慧司人数"
                  rules={[{ required: true, message: '请输入智慧司人数' }]}
                >
                  <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入智慧司人数" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="cadreCount"
                  label="干部人数"
                  rules={[{ required: true, message: '请输入干部人数' }]}
                >
                  <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入干部人数" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="employeeCount"
                  label="员工人数"
                  rules={[{ required: true, message: '请输入员工人数' }]}
                >
                  <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入员工人数" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="employmentClassCount"
                  label="就业班级数量"
                  rules={[{ required: true, message: '请输入就业班级数量' }]}
                >
                  <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入就业班级数量" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="graduateCount"
                  label="毕业生人数"
                  rules={[{ required: true, message: '请输入毕业生人数' }]}
                >
                  <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入毕业生人数" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="employmentRate"
                  label="就业率 (%)"
                  rules={[{ required: true, message: '请输入就业率' }]}
                >
                  <InputNumber
                    min={0}
                    max={100}
                    style={{ width: '100%' }}
                    placeholder="请输入就业率"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="employmentSalary"
                  label="就业薪资"
                  rules={[{ required: true, message: '请输入就业薪资' }]}
                >
                  <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入就业薪资" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="highSalaryCount"
                  label="薪资过万人数"
                  rules={[{ required: true, message: '请输入薪资过万人数' }]}
                >
                  <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入薪资过万人数" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="wordOfMouthEnrollments"
                  label="口碑招生人数"
                  rules={[{ required: true, message: '请输入口碑招生人数' }]}
                >
                  <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入口碑招生人数" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="wordOfMouthRevenue"
                  label="口碑招生收入"
                  rules={[{ required: true, message: '请输入口碑招生收入' }]}
                >
                  <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入口碑招生收入" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="newStudentEnrollments"
                  label="新生入学人数"
                  rules={[{ required: true, message: '请输入新生入学人数' }]}
                >
                  <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入新生入学人数" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="newStudentAttrition"
                  label="新生流失人数"
                  rules={[{ required: true, message: '请输入新生流失人数' }]}
                >
                  <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入新生流失人数" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">
                  {editingRecord ? '更新' : '创建'}
                </Button>
                <Button onClick={() => setModalVisible(false)}>取消</Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      )}
    </div>
  )
}

export default CoreSummaryPage
