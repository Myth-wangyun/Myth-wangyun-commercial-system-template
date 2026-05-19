//
import React, { useState, useEffect, useMemo } from 'react'
import { App, Card, Button, Modal, Space, Row, Col, Statistic, Select, Input, Form } from 'antd'
import {
  PlusOutlined,
  DownloadOutlined,
  UploadOutlined,
  ReloadOutlined,
  BarChartOutlined,
} from '@ant-design/icons'
import { EnrollmentSummaryService } from './service.ts'
import { ExcelService } from '@/pages/academic/teaching-content/shared/services/excel.ts'
import type { IEnrollmentSummary, IEnrollmentSummaryForm, IEnrollmentStats } from './types.ts'
import { getCampusOptions } from '@/config/campusConfig'
import EnrollmentTable from './EnrollmentTable.tsx'
import EnrollmentForm from './EnrollmentForm.tsx'

const { Option } = Select

const EnrollmentSummaryPage: React.FC = () => {
  const { message, modal } = App.useApp()
  const [form] = Form.useForm()
  const [data, setData] = useState<IEnrollmentSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<IEnrollmentSummary | null>(null)
  const [stats, setStats] = useState<IEnrollmentStats | null>(null)
  const [filters, setFilters] = useState({
    campus: undefined as string | undefined,
    year: undefined as number | undefined,
    keyword: '',
  })

  const campusOptions = useMemo(() => {
    return getCampusOptions().map(({ label }) => ({
      value: label.replace(/神殿$/, ''),
      label,
    }))
  }, [])

  // 加载数据
  const loadData = async () => {
    setLoading(true)
    try {
      let allData = await EnrollmentSummaryService.getAll()

      // 应用筛选
      if (filters.campus) {
        allData = allData.filter((item) => item.campus === filters.campus)
      }

      if (filters.year) {
        allData = allData.filter((item) => item.year === filters.year)
      }

      if (filters.keyword) {
        allData = allData.filter((item) => item.campus.includes(filters.keyword))
      }

      setData(allData)

      // 加载统计数据
      const statsData = await EnrollmentSummaryService.getStats()
      setStats(statsData)
    } catch (error) {
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [filters])

  // 新增数据
  const handleAdd = () => {
    setEditingRecord(null)
    setModalVisible(true)
    form.resetFields()
  }

  // 编辑数据
  const handleEdit = (record: IEnrollmentSummary) => {
    setEditingRecord(record)
    setModalVisible(true)
  }

  // 删除数据
  const handleDelete = async (id: string) => {
    try {
      await EnrollmentSummaryService.delete(id)
      message.success('删除成功')
      loadData()
    } catch (error) {
      message.error('删除失败')
    }
  }

  // 查看详情
  const handleView = (record: IEnrollmentSummary) => {
    modal.info({
      title: '招生数据详情',
      content: (
        <div>
          <p>
            <strong>神殿:</strong> {record.campus}
          </p>
          <p>
            <strong>月份:</strong> {record.month}月
          </p>
          <p>
            <strong>年份:</strong> {record.year}
          </p>
          <p>
            <strong>目标口碑量:</strong> {record.targetWOM}
          </p>
          <p>
            <strong>实际口碑量:</strong> {record.actualWOM}
          </p>
          <p>
            <strong>目标上门量:</strong> {record.targetWalkin}
          </p>
          <p>
            <strong>实际上门量:</strong> {record.actualWalkin}
          </p>
          <p>
            <strong>目标招生人数:</strong> {record.targetEnrollment}
          </p>
          <p>
            <strong>实际招生人数:</strong> {record.actualEnrollment}
          </p>
          <p>
            <strong>目标收入:</strong> ¥{record.targetRevenue.toLocaleString()}
          </p>
          <p>
            <strong>实际收入:</strong> ¥{record.actualRevenue.toLocaleString()}
          </p>
        </div>
      ),
      width: 600,
    })
  }

  // 提交表单
  const handleSubmit = async (values: IEnrollmentSummaryForm) => {
    try {
      if (editingRecord) {
        await EnrollmentSummaryService.update(editingRecord.id, values)
        message.success('更新成功')
      } else {
        await EnrollmentSummaryService.create(values)
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
      const exportData = await EnrollmentSummaryService.exportData()
      const columns = [
        '神殿aaa',
        '月份',
        '年份',
        '目标口碑量',
        '实际口碑量',
        '目标上门量',
        '实际上门量',
        '目标招生人数',
        '实际招生人数',
        '目标收入',
        '实际收入',
      ]

      ExcelService.exportExcel({
        fileName: '口碑招生汇总表',
        sheetName: '招生汇总',
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
        const importedData = await ExcelService.importExcel(file)
        await EnrollmentSummaryService.importData(importedData)
        message.success('导入成功')
        loadData()
      } catch (error) {
        message.error('导入失败')
      }
    }
    input.click()
  }

  return (
    <div style={{ padding: 24 }}>
      <Card title="test口碑招生汇总表" style={{ marginBottom: 16 }}>
        {/* 统计卡片 */}
        {stats && (
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="aaa总目标口碑量"
                  value={stats.totalTargetWOM}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="总实际口碑量"
                  value={stats.totalActualWOM}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="总目标招生人数"
                  value={stats.totalTargetEnrollment}
                  valueStyle={{ color: '#cf1322' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="总实际收入"
                  value={stats.totalActualRevenue}
                  prefix="¥"
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
          </Row>
        )}

        {/* 筛选条件 */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Select
              placeholder="选择神殿"
              allowClear
              style={{ width: '100%' }}
              value={filters.campus}
              onChange={(value) => setFilters({ ...filters, campus: value })}
            >
              {campusOptions.map(({ value, label }) => (
                <Option key={value} value={value}>
                  {label}
                </Option>
              ))}
            </Select>
          </Col>
          <Col span={6}>
            <Select
              placeholder="选择年份"
              allowClear
              style={{ width: '100%' }}
              value={filters.year}
              onChange={(value) => setFilters({ ...filters, year: value })}
            >
              {[2024, 2023, 2022, 2021, 2020].map((year) => (
                <Option key={year} value={year}>
                  {year}
                </Option>
              ))}
            </Select>
          </Col>
          <Col span={6}>
            <Input
              placeholder="搜索神殿"
              value={filters.keyword}
              onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
            />
          </Col>
          <Col span={6}>
            <Button icon={<ReloadOutlined />} onClick={loadData}>
              刷新
            </Button>
          </Col>
        </Row>

        {/* 操作按钮 */}
        <div style={{ marginBottom: 16 }}>
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新增数据
            </Button>
            <Button icon={<DownloadOutlined />} onClick={handleExport}>
              导出Excel
            </Button>
            <Button icon={<UploadOutlined />} onClick={handleImport}>
              导入Excel
            </Button>
            <Button icon={<BarChartOutlined />}>数据统计</Button>
          </Space>
        </div>

        {/* 数据表格 */}
        <EnrollmentTable
          data={data}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={handleView}
          onRefresh={loadData}
        />
      </Card>

      {/* 新增/编辑模态框 */}
      <Modal
        title={editingRecord ? '编辑数据' : '新增数据'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={1000}
        destroyOnHidden
      >
        <EnrollmentForm form={form} initialValues={editingRecord} onSubmit={handleSubmit} />
        <div style={{ textAlign: 'right', marginTop: 16 }}>
          <Space>
            <Button onClick={() => setModalVisible(false)}>取消</Button>
            <Button type="primary" onClick={() => form.submit()}>
              {editingRecord ? '更新' : '创建'}
            </Button>
          </Space>
        </div>
      </Modal>
    </div>
  )
}

export default EnrollmentSummaryPage
