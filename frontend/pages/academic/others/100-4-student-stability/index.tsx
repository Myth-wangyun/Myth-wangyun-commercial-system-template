// 神殿新生维稳汇总表主页面
import React, { useState, useEffect } from 'react'
import { App, Card, Button, Modal, Space, Row, Col, Statistic, Select, Input, Form } from 'antd'
import {
  PlusOutlined,
  DownloadOutlined,
  UploadOutlined,
  ReloadOutlined,
  BarChartOutlined,
} from '@ant-design/icons'
import { StudentStabilityService } from './service.ts'
import { ExcelService } from '@/pages/academic/teaching-content/shared/services/excel.ts'
import type { IStudentStability, IStudentStabilityForm, IStudentStabilityStats } from './types.ts'
import { CAMPUS_LIST } from '@/pages/academic/teaching-content/constants.ts'
import DataTable from './components/DataTable.tsx'
import DataForm from './components/DataForm.tsx'

const { Option } = Select

const StudentStabilityPage: React.FC = () => {
  const { message, modal } = App.useApp()
  const [form] = Form.useForm()
  const [data, setData] = useState<IStudentStability[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<IStudentStability | null>(null)
  const [stats, setStats] = useState<IStudentStabilityStats | null>(null)
  const [filters, setFilters] = useState({
    campus: undefined as string | undefined,
    keyword: '',
  })

  // 加载数据
  const loadData = async () => {
    setLoading(true)
    try {
      let allData = await StudentStabilityService.getAll()

      // 应用筛选
      if (filters.campus) {
        allData = allData.filter((item) => item.campus === filters.campus)
      }

      if (filters.keyword) {
        allData = allData.filter((item) => item.campus.includes(filters.keyword))
      }

      setData(allData)

      // 加载统计数据
      const statsData = await StudentStabilityService.getStats()
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
  const handleEdit = (record: IStudentStability) => {
    setEditingRecord(record)
    setModalVisible(true)
  }

  // 删除数据
  const handleDelete = async (id: string) => {
    try {
      await StudentStabilityService.delete(id)
      message.success('删除成功')
      loadData()
    } catch (error) {
      message.error('删除失败')
    }
  }

  // 查看详情
  const handleView = (record: IStudentStability) => {
    modal.info({
      title: '新生维稳数据详情',
      content: (
        <div>
          <p>
            <strong>神殿:</strong> {record.campus}
          </p>
          <p>
            <strong>交接人数:</strong> {record.handoverCount}
          </p>
          <p>
            <strong>入学人数:</strong> {record.enrollmentCount}
          </p>
          <p>
            <strong>退费人数:</strong> {record.refundCount}
          </p>
          <p>
            <strong>退费率:</strong> {record.refundRate.toFixed(2)}%
          </p>
          <p>
            <strong>维稳率:</strong> {(100 - record.refundRate).toFixed(2)}%
          </p>
        </div>
      ),
      width: 500,
    })
  }

  // 提交表单
  const handleSubmit = async (values: IStudentStabilityForm) => {
    try {
      if (editingRecord) {
        await StudentStabilityService.update(editingRecord.id, values)
        message.success('更新成功')
      } else {
        await StudentStabilityService.create(values)
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
      const exportData = await StudentStabilityService.exportData()
      const columns = ['神殿', '交接人数', '入学人数', '退费人数', '退费率']

      ExcelService.exportExcel({
        fileName: '新生维稳汇总表',
        sheetName: '维稳汇总',
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
        await StudentStabilityService.importData(importedData)
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
      <Card title="新生维稳汇总表" style={{ marginBottom: 16 }}>
        {/* 统计卡片 */}
        {stats && (
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="总交接人数"
                  value={stats.totalHandoverCount}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="总入学人数"
                  value={stats.totalEnrollmentCount}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="总退费人数"
                  value={stats.totalRefundCount}
                  valueStyle={{ color: '#cf1322' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="平均维稳率"
                  value={stats.stabilityRate}
                  suffix="%"
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
              {CAMPUS_LIST.map((campus) => (
                <Option key={campus} value={campus}>
                  {campus}
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
          <Col span={4}>
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
        <DataTable
          data={data}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={handleView}
        />
      </Card>

      {/* 新增/编辑模态框 */}
      <Modal
        title={editingRecord ? '编辑数据' : '新增数据'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={800}
        destroyOnHidden
      >
        <DataForm form={form} editingRecord={editingRecord} onSubmit={handleSubmit} />
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

export default StudentStabilityPage
