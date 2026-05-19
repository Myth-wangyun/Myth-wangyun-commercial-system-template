// 学术->神殿 后端学员就业汇总表
import React, { useState, useEffect, useCallback } from 'react'
import { App,
  Alert,
  Card,
  Button,
  Modal,
  Space,
  Row,
  Col,
  Statistic,
  Select,
  DatePicker,
  Input,
  Form,
} from 'antd'
import {
  DownloadOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import { EmploymentSummaryService } from './service'
import { ExcelService } from '@/pages/academic/teaching-content/shared/services/excel'
import type { IEmploymentSummary, IEmploymentSummaryForm, IEmploymentStats } from './types'
import DataTable from './components/DataTable'
import DataForm from './components/DataForm'
import { useCampusStore } from '@/stores/campusStore'
import CampusSelector from '@/components/common/CampusSelector'
import { useConfigOptions } from '@/hooks/useConfigOptions'

const { RangePicker } = DatePicker
const { Option } = Select

const EmploymentSummaryPage: React.FC = () => {
  const { message, modal } = App.useApp()
  const { currentCampus, getAllCampuses } = useCampusStore()
  // 使用 useMemo 确保 activeCampus 在 currentCampus 变化时正确更新
  const activeCampus = React.useMemo(() => {
    return currentCampus ?? getAllCampuses()[0]?.name ?? '主神殿'
  }, [currentCampus, getAllCampuses])

  // 获取当前神殿的专业列表
  const { majors: majorOptions } = useConfigOptions({ campusName: activeCampus })

  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState<number | 'all'>(currentYear)
  const [availableYears, setAvailableYears] = useState<number[]>([currentYear])
  
  // 是否为历史合计模式
  const isHistoricalMode = selectedYear === 'all'

  const [form] = Form.useForm()
  const [data, setData] = useState<IEmploymentSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<IEmploymentSummary | null>(null)
  const [stats, setStats] = useState<IEmploymentStats | null>(null)
  const [filters, setFilters] = useState({
    major: undefined as string | undefined,
    dateRange: undefined as [Dayjs, Dayjs] | undefined,
    keyword: '',
  })

  // 加载可用年份列表
  const loadAvailableYears = useCallback(async () => {
    try {
      const years = await EmploymentSummaryService.getAvailableYears(activeCampus)
      setAvailableYears(years)
    } catch (error) {
      console.error('获取年份列表失败:', error)
    }
  }, [activeCampus])

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      // 如果是历史合计模式，获取历史汇总数据
      if (isHistoricalMode) {
        const historicalStats = await EmploymentSummaryService.getHistoricalSummary(activeCampus)
        setStats(historicalStats)
        setData([]) // 历史合计模式下不显示明细列表
        return
      }

      // 从后端获取当前神殿的数据，按年份筛选
      const yearFilter = typeof selectedYear === 'number' ? selectedYear : undefined
      let allData = await EmploymentSummaryService.getAll(activeCampus, yearFilter)

      // 应用专业筛选
      if (filters.major) {
        allData = allData.filter((item) => item.major === filters.major)
      }

      // 应用日期范围筛选
      if (filters.dateRange) {
        const [start, end] = filters.dateRange
        allData = allData.filter((item) => {
          const graduationTime = dayjs(item.graduationTime)
          return graduationTime.isAfter(start) && graduationTime.isBefore(end)
        })
      }

      // 应用关键词筛选
      if (filters.keyword) {
        allData = allData.filter(
          (item) =>
            item.className.includes(filters.keyword) ||
            item.instructor.includes(filters.keyword) ||
            item.classTeacher.includes(filters.keyword),
        )
      }

      setData(allData)

      // 计算统计数据（基于筛选后的数据）
      const statsData = calculateStats(allData)
      setStats(statsData)
    } catch (error) {
      console.error('加载数据失败:', error)
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }, [activeCampus, selectedYear, isHistoricalMode, filters])

  // 计算统计数据
  const calculateStats = (data: IEmploymentSummary[]): IEmploymentStats => {
    if (data.length === 0) {
      return {
        totalClasses: 0,
        totalGraduates: 0,
        totalEmployed: 0,
        avgEmploymentRate: 0,
        avgTargetSalary: 0,
        avgActualSalary: 0,
        totalSalaryOver10k: 0,
        avgAchievementRate: 0,
      }
    }

    const totalClasses = data.length
    const totalGraduates = data.reduce((sum, item) => sum + (item.archivedCount || 0), 0)
    const totalEmployed = data.reduce((sum, item) => sum + (item.actualEmployment || 0), 0)
    const totalTargetEmployment = data.reduce((sum, item) => sum + (item.targetEmployment || 0), 0)
    // 就业率 = 总实际就业人数 / 总目标就业人数 * 100
    const avgEmploymentRate = totalTargetEmployment > 0 
      ? (totalEmployed / totalTargetEmployment) * 100 
      : 0
    const avgTargetSalary = data.reduce((sum, item) => sum + (item.targetAvgSalary || 0), 0) / data.length
    const avgActualSalary = data.reduce((sum, item) => sum + (item.actualAvgSalary || 0), 0) / data.length
    const totalSalaryOver10k = data.reduce((sum, item) => sum + (item.salaryOver10k || 0), 0)
    const avgAchievementRate = data.reduce((sum, item) => sum + (item.achievementRate || 0), 0) / data.length

    return {
      totalClasses,
      totalGraduates,
      totalEmployed,
      avgEmploymentRate,
      avgTargetSalary,
      avgActualSalary,
      totalSalaryOver10k,
      avgAchievementRate,
    }
  }

  useEffect(() => {
    loadAvailableYears()
  }, [loadAvailableYears])

  useEffect(() => {
    loadData()
  }, [loadData])

  // 编辑数据
  const handleEdit = (record: IEmploymentSummary) => {
    setEditingRecord(record)
    setModalVisible(true)
  }

  // 查看详情
  const handleView = (record: IEmploymentSummary) => {
    modal.info({
      title: '就业数据详情',
      content: (
        <div>
          <p>
            <strong>神殿:</strong> {record.campus}
          </p>
          <p>
            <strong>专业:</strong> {record.major}
          </p>
          <p>
            <strong>学制:</strong> {record.programLength}
          </p>
          <p>
            <strong>班级名称:</strong> {record.className}
          </p>
          <p>
            <strong>授课教员:</strong> {record.instructor}
          </p>
          <p>
            <strong>班主任:</strong> {record.classTeacher}
          </p>
          <p>
            <strong>毕业时间:</strong> {record.graduationTime}
          </p>
          <p>
            <strong>目标平均就业薪资:</strong> ¥{record.targetAvgSalary.toLocaleString()}
          </p>
          <p>
            <strong>实际平均就业薪资:</strong> ¥{record.actualAvgSalary.toLocaleString()}
          </p>
          <p>
            <strong>达标率:</strong> {record.achievementRate.toFixed(2)}%
          </p>
          <p>
            <strong>档案人数:</strong> {record.archivedCount}
          </p>
          <p>
            <strong>目标就业人数:</strong> {record.targetEmployment}
          </p>
          <p>
            <strong>实际就业人数:</strong> {record.actualEmployment}
          </p>
          <p>
            <strong>就业率:</strong> {record.employmentRate.toFixed(2)}%
          </p>
          <p>
            <strong>薪资过万人数:</strong> {record.salaryOver10k}
          </p>
        </div>
      ),
      width: 600,
    })
  }

  // 提交表单
  const handleSubmit = async (values: IEmploymentSummaryForm) => {
    try {
      if (!editingRecord) {
        message.error('当前页面只支持维护已有班级的智慧司目标值')
        return
      }

      await EmploymentSummaryService.update(editingRecord.id, values)
      message.success('更新成功')
      setModalVisible(false)
      setEditingRecord(null)
      loadData()
    } catch (error) {
      message.error('更新失败')
    }
  }

  // 导出Excel
  const handleExport = async () => {
    try {
      const exportData = await EmploymentSummaryService.exportData()
      const columns = [
        '神殿',
        '专业',
        '学制',
        '班级名称',
        '授课教员',
        '班主任',
        '毕业时间',
        '目标平均就业薪资',
        '实际平均就业薪资',
        '达标率',
        '档案人数',
        '目标就业人数',
        '实际就业人数',
        '就业率',
        '薪资过万人数',
      ]

      ExcelService.exportExcel({
        fileName: '后端学员就业汇总表',
        sheetName: '就业汇总',
        columns,
        data: exportData,
      })
      message.success('导出成功')
    } catch (error) {
      message.error('导出失败')
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <Card 
        title={isHistoricalMode ? "后端学员就业汇总表 - 历史合计" : "后端学员就业汇总表"} 
        style={{ marginBottom: 16 }}
      >
        {/* 统计卡片 */}
        {stats && (
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="总班级数"
                  value={stats.totalClasses}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="总毕业生数"
                  value={stats.totalGraduates}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="平均就业率"
                  value={stats.avgEmploymentRate}
                  precision={1}
                  suffix="%"
                  valueStyle={{ color: '#cf1322' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="平均实际薪资"
                  value={stats.avgActualSalary}
                  prefix="¥"
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
          </Row>
        )}

        <Alert
          style={{ marginBottom: 16 }}
          type="info"
          showIcon
          message="实际就业明细来自教化司，智慧司在本页只维护目标就业人数和目标平均薪资。"
          description="本页直接读取后端 /class-employment-summary/。用户不需要先打开其他页面，后端会自动合并教质实际值与学术目标值。"
        />

        {/* 筛选条件 */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={4}>
            <span style={{ marginRight: 8 }}>当前神殿</span>
            <CampusSelector size="middle" useGlobalState={true} style={{ width: '100%' }} />
          </Col>
          <Col span={3}>
            <Select
              placeholder="选择年份"
              style={{ width: '100%' }}
              value={selectedYear}
              onChange={(value) => setSelectedYear(value)}
            >
              <Option value="all">历史合计</Option>
              {availableYears.map((year) => (
                <Option key={year} value={year}>
                  {year}年
                </Option>
              ))}
            </Select>
          </Col>
          <Col span={4}>
            <Select
              placeholder="选择专业"
              allowClear
              style={{ width: '100%' }}
              value={filters.major}
              onChange={(value) => setFilters({ ...filters, major: value })}
              disabled={isHistoricalMode}
            >
              {majorOptions.map((major) => (
                <Option key={major.key} value={major.value}>
                  {major.label}
                </Option>
              ))}
            </Select>
          </Col>
          <Col span={6}>
            <RangePicker
              style={{ width: '100%' }}
              value={filters.dateRange}
              disabled={isHistoricalMode}
              onChange={(dates) =>
                setFilters({
                  ...filters,
                  dateRange:
                    dates && dates[0] && dates[1]
                      ? ([dates[0], dates[1]] as [Dayjs, Dayjs])
                      : undefined,
                })
              }
            />
          </Col>
          <Col span={4}>
            <Input
              placeholder="搜索班级/教员"
              value={filters.keyword}
              onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
              disabled={isHistoricalMode}
            />
          </Col>
          <Col span={2}>
            <Button icon={<ReloadOutlined />} onClick={loadData}>
              刷新
            </Button>
          </Col>
        </Row>

        {/* 历史合计模式提示 */}
        {isHistoricalMode && (
          <div style={{ marginBottom: 16, padding: '12px 16px', background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 4 }}>
            <span style={{ color: '#52c41a' }}>📊 当前显示的是历史合计数据（汇总所有年份），仅供查看统计信息，不支持编辑操作。</span>
          </div>
        )}

        {/* 操作按钮 - 历史合计模式下隐藏 */}
        {!isHistoricalMode && (
        <div style={{ marginBottom: 16 }}>
          <Space>
            <Button icon={<DownloadOutlined />} onClick={handleExport}>
              导出Excel
            </Button>
          </Space>
        </div>
        )}

        {/* 数据表格 - 历史合计模式下隐藏操作列 */}
        <DataTable
          data={data}
          loading={loading}
          onEdit={isHistoricalMode ? undefined : handleEdit}
          onView={handleView}
        />
      </Card>

      {/* 新增/编辑模态框 */}
      <Modal
        title="编辑智慧司就业目标"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false)
          setEditingRecord(null)
        }}
        footer={null}
        width={1200}
        destroyOnHidden
      >
        <DataForm form={form} editingRecord={editingRecord} onSubmit={handleSubmit} />
        <div style={{ textAlign: 'right', marginTop: 16 }}>
          <Space>
            <Button
              onClick={() => {
                setModalVisible(false)
                setEditingRecord(null)
              }}
            >
              取消
            </Button>
            <Button type="primary" onClick={() => form.submit()}>
              保存目标
            </Button>
          </Space>
        </div>
      </Modal>
    </div>
  )
}

export default EmploymentSummaryPage
