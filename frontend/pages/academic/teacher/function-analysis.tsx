// 教员功能分析表页面 (032)
import React, { useState, useEffect } from 'react'
import { App,
  Card,
  Table,
  Button,
  Space,
  Typography,
  Row,
  Col,
  Statistic,
  Alert,
  Spin,
  Progress,
  Tag,
  Select,
  Input,
  Form,
  Modal,
  Rate,
  Divider,
} from 'antd'
import {
  ReloadOutlined,
  DownloadOutlined,
  UserOutlined,
  PlusOutlined,
  EditOutlined,
  EyeOutlined,
  StarOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useCampusStore } from '@/stores/campusStore'

const { Title, Text } = Typography
const { Option } = Select
const { Search } = Input
const { TextArea } = Input

// 功能评价数据接口
interface FunctionEvaluation {
  id: string
  teacherName: string
  evaluationPeriod: string
  evaluator: string
  values: {
    responsibility: number // 责任心
    execution: number // 执行力
    diligence: number // 任劳任怨
    teamSpirit: number // 团队精神
    professionalEthics: number // 职业道德
  }
  businessCapability: {
    technicalAbility: number // 技术能力
    innovationCapability: number // 创新能力
    teachingRnd: number // 教学研发
    teachingImplementation: number // 教学实施
    teachingEvaluation: number // 教学测评
    employmentStatus: number // 就业情况
    reputation: number // 口碑
    newStudentStability: number // 新生维稳
    recruitmentCapability: number // 招聘能力
  }
  teamBuilding: {
    businessTrainingCapability: number // 业务培养能力
    valuesTrainingCapability: number // 价值观培养能力
    employeeInterviewCapability: number // 员工访谈能力
    assessmentCapability: number // 考核能力
    evaluationCapability: number // 评价能力
    workPlanningCapability: number // 工作规划能力
    prestigeAndAffinity: number // 威望及亲和力
  }
  managementCapability: {
    exemplaryCapability: number // 示范能力
    leadershipCapability: number // 领导能力
    workMethods: number // 工作方法
    workControlCapability: number // 工作控制能力
  }
  totalScore: number
  averageScore: number
  evaluationDate: string
  remarks: string
}

const TeacherFunctionAnalysis: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<FunctionEvaluation[]>([])
  const [filteredData, setFilteredData] = useState<FunctionEvaluation[]>([])
  const [selectedRecord, setSelectedRecord] = useState<FunctionEvaluation | null>(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [modalType, setModalType] = useState<'view' | 'edit' | 'add'>('view')
  const [form] = Form.useForm()

  // 模拟功能评价数据
  const mockData: FunctionEvaluation[] = [
    {
      id: '1',
      teacherName: '杜鹏涛',
      evaluationPeriod: '2024年第一季度',
      evaluator: '学术经理',
      values: {
        responsibility: 4,
        execution: 4,
        diligence: 4,
        teamSpirit: 3,
        professionalEthics: 4,
      },
      businessCapability: {
        technicalAbility: 4,
        innovationCapability: 3,
        teachingRnd: 4,
        teachingImplementation: 4,
        teachingEvaluation: 4,
        employmentStatus: 3,
        reputation: 4,
        newStudentStability: 4,
        recruitmentCapability: 3,
      },
      teamBuilding: {
        businessTrainingCapability: 4,
        valuesTrainingCapability: 3,
        employeeInterviewCapability: 4,
        assessmentCapability: 4,
        evaluationCapability: 3,
        workPlanningCapability: 4,
        prestigeAndAffinity: 4,
      },
      managementCapability: {
        exemplaryCapability: 4,
        leadershipCapability: 3,
        workMethods: 4,
        workControlCapability: 4,
      },
      totalScore: 88,
      averageScore: 3.67,
      evaluationDate: '2024-03-31',
      remarks:
        '整体表现优秀，在技术能力和教学实施方面表现突出，建议在创新能力和领导能力方面进一步提升。',
    },
    {
      id: '2',
      teacherName: '张志恒',
      evaluationPeriod: '2024年第一季度',
      evaluator: '学术经理',
      values: {
        responsibility: 4,
        execution: 4,
        diligence: 4,
        teamSpirit: 4,
        professionalEthics: 4,
      },
      businessCapability: {
        technicalAbility: 4,
        innovationCapability: 4,
        teachingRnd: 4,
        teachingImplementation: 4,
        teachingEvaluation: 4,
        employmentStatus: 4,
        reputation: 4,
        newStudentStability: 4,
        recruitmentCapability: 4,
      },
      teamBuilding: {
        businessTrainingCapability: 4,
        valuesTrainingCapability: 4,
        employeeInterviewCapability: 4,
        assessmentCapability: 4,
        evaluationCapability: 4,
        workPlanningCapability: 4,
        prestigeAndAffinity: 4,
      },
      managementCapability: {
        exemplaryCapability: 4,
        leadershipCapability: 4,
        workMethods: 4,
        workControlCapability: 4,
      },
      totalScore: 100,
      averageScore: 4.0,
      evaluationDate: '2024-03-31',
      remarks: '表现卓越，各项指标均达到满分，是团队中的标杆人物。',
    },
    {
      id: '3',
      teacherName: '姜东亮',
      evaluationPeriod: '2024年第一季度',
      evaluator: '学术经理',
      values: {
        responsibility: 4,
        execution: 3,
        diligence: 4,
        teamSpirit: 4,
        professionalEthics: 4,
      },
      businessCapability: {
        technicalAbility: 4,
        innovationCapability: 3,
        teachingRnd: 3,
        teachingImplementation: 4,
        teachingEvaluation: 4,
        employmentStatus: 3,
        reputation: 4,
        newStudentStability: 3,
        recruitmentCapability: 3,
      },
      teamBuilding: {
        businessTrainingCapability: 3,
        valuesTrainingCapability: 3,
        employeeInterviewCapability: 3,
        assessmentCapability: 3,
        evaluationCapability: 3,
        workPlanningCapability: 3,
        prestigeAndAffinity: 4,
      },
      managementCapability: {
        exemplaryCapability: 3,
        leadershipCapability: 3,
        workMethods: 3,
        workControlCapability: 3,
      },
      totalScore: 75,
      averageScore: 3.13,
      evaluationDate: '2024-03-31',
      remarks: '基础能力扎实，但在执行力和创新能力方面需要加强，建议参加相关培训。',
    },
  ]

  useEffect(() => {
    loadData()
  }, [currentCampus])

  const loadData = async () => {
    setLoading(true)
    try {
      // 模拟API调用
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setData(mockData)
      setFilteredData(mockData)
      console.log('📊 教员功能分析数据加载完成')
    } catch (error) {
      console.error('❌ 加载教员功能分析数据失败:', error)
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    loadData()
  }

  const handleExport = () => {
    message.success('导出成功')
  }

  const handleView = (record: FunctionEvaluation) => {
    setSelectedRecord(record)
    setModalType('view')
    setModalVisible(true)
  }

  const handleEdit = (record: FunctionEvaluation) => {
    setSelectedRecord(record)
    setModalType('edit')
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleAdd = () => {
    setSelectedRecord(null)
    setModalType('add')
    form.resetFields()
    setModalVisible(true)
  }

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields()
      if (modalType === 'add') {
        const newRecord: FunctionEvaluation = {
          id: Date.now().toString(),
          ...values,
          totalScore: calculateTotalScore(values),
          averageScore: calculateTotalScore(values) / 25,
        }
        setData([newRecord, ...data])
        setFilteredData([newRecord, ...filteredData])
        message.success('新增成功')
      } else if (modalType === 'edit' && selectedRecord) {
        const updatedRecord = {
          ...selectedRecord,
          ...values,
          totalScore: calculateTotalScore(values),
          averageScore: calculateTotalScore(values) / 25,
        }
        setData(data.map((item) => (item.id === selectedRecord.id ? updatedRecord : item)))
        setFilteredData(
          filteredData.map((item) => (item.id === selectedRecord.id ? updatedRecord : item)),
        )
        message.success('更新成功')
      }
      setModalVisible(false)
    } catch (error) {
      console.error('表单验证失败:', error)
    }
  }

  const calculateTotalScore = (values: any) => {
    let total = 0
    // 价值观 (5项 * 4分 = 20分)
    total +=
      (values.values?.responsibility || 0) +
      (values.values?.execution || 0) +
      (values.values?.diligence || 0) +
      (values.values?.teamSpirit || 0) +
      (values.values?.professionalEthics || 0)

    // 业务能力 (9项 * 4分 = 36分)
    total +=
      (values.businessCapability?.technicalAbility || 0) +
      (values.businessCapability?.innovationCapability || 0) +
      (values.businessCapability?.teachingRnd || 0) +
      (values.businessCapability?.teachingImplementation || 0) +
      (values.businessCapability?.teachingEvaluation || 0) +
      (values.businessCapability?.employmentStatus || 0) +
      (values.businessCapability?.reputation || 0) +
      (values.businessCapability?.newStudentStability || 0) +
      (values.businessCapability?.recruitmentCapability || 0)

    // 团队建设 (7项 * 4分 = 28分)
    total +=
      (values.teamBuilding?.businessTrainingCapability || 0) +
      (values.teamBuilding?.valuesTrainingCapability || 0) +
      (values.teamBuilding?.employeeInterviewCapability || 0) +
      (values.teamBuilding?.assessmentCapability || 0) +
      (values.teamBuilding?.evaluationCapability || 0) +
      (values.teamBuilding?.workPlanningCapability || 0) +
      (values.teamBuilding?.prestigeAndAffinity || 0)

    // 管理能力 (4项 * 4分 = 16分)
    total +=
      (values.managementCapability?.exemplaryCapability || 0) +
      (values.managementCapability?.leadershipCapability || 0) +
      (values.managementCapability?.workMethods || 0) +
      (values.managementCapability?.workControlCapability || 0)

    return total
  }

  const handleSearch = (value: string) => {
    if (!value) {
      setFilteredData(data)
    } else {
      const filtered = data.filter(
        (item) =>
          item.teacherName.toLowerCase().includes(value.toLowerCase()) ||
          item.evaluator.toLowerCase().includes(value.toLowerCase()),
      )
      setFilteredData(filtered)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 3.5) return '#52c41a'
    if (score >= 3.0) return '#faad14'
    if (score >= 2.5) return '#fa8c16'
    return '#ff4d4f'
  }

  const getScoreTag = (score: number) => {
    if (score >= 3.5) return <Tag color="green">优秀</Tag>
    if (score >= 3.0) return <Tag color="orange">良好</Tag>
    if (score >= 2.5) return <Tag color="blue">合格</Tag>
    return <Tag color="red">待改进</Tag>
  }

  const columns: ColumnsType<FunctionEvaluation> = [
    {
      title: '教员姓名',
      dataIndex: 'teacherName',
      key: 'teacherName',
      width: 120,
      align: 'center',
      fixed: 'left',
    },
    {
      title: '评价周期',
      dataIndex: 'evaluationPeriod',
      key: 'evaluationPeriod',
      width: 120,
      align: 'center',
    },
    {
      title: '评价人',
      dataIndex: 'evaluator',
      key: 'evaluator',
      width: 100,
      align: 'center',
    },
    {
      title: '价值观平均分',
      key: 'valuesAvg',
      width: 130,
      align: 'center',
      render: (_, record) => {
        const avg =
          (record.values.responsibility +
            record.values.execution +
            record.values.diligence +
            record.values.teamSpirit +
            record.values.professionalEthics) /
          5
        return (
          <div>
            <Progress
              percent={(avg / 4) * 100}
              size="small"
              strokeColor={getScoreColor(avg)}
              showInfo={false}
            />
            <Text style={{ color: getScoreColor(avg) }}>{avg.toFixed(2)}</Text>
          </div>
        )
      },
    },
    {
      title: '业务能力平均分',
      key: 'businessAvg',
      width: 130,
      align: 'center',
      render: (_, record) => {
        const avg =
          (record.businessCapability.technicalAbility +
            record.businessCapability.innovationCapability +
            record.businessCapability.teachingRnd +
            record.businessCapability.teachingImplementation +
            record.businessCapability.teachingEvaluation +
            record.businessCapability.employmentStatus +
            record.businessCapability.reputation +
            record.businessCapability.newStudentStability +
            record.businessCapability.recruitmentCapability) /
          9
        return (
          <div>
            <Progress
              percent={(avg / 4) * 100}
              size="small"
              strokeColor={getScoreColor(avg)}
              showInfo={false}
            />
            <Text style={{ color: getScoreColor(avg) }}>{avg.toFixed(2)}</Text>
          </div>
        )
      },
    },
    {
      title: '团队建设平均分',
      key: 'teamAvg',
      width: 130,
      align: 'center',
      render: (_, record) => {
        const avg =
          (record.teamBuilding.businessTrainingCapability +
            record.teamBuilding.valuesTrainingCapability +
            record.teamBuilding.employeeInterviewCapability +
            record.teamBuilding.assessmentCapability +
            record.teamBuilding.evaluationCapability +
            record.teamBuilding.workPlanningCapability +
            record.teamBuilding.prestigeAndAffinity) /
          7
        return (
          <div>
            <Progress
              percent={(avg / 4) * 100}
              size="small"
              strokeColor={getScoreColor(avg)}
              showInfo={false}
            />
            <Text style={{ color: getScoreColor(avg) }}>{avg.toFixed(2)}</Text>
          </div>
        )
      },
    },
    {
      title: '管理能力平均分',
      key: 'managementAvg',
      width: 130,
      align: 'center',
      render: (_, record) => {
        const avg =
          (record.managementCapability.exemplaryCapability +
            record.managementCapability.leadershipCapability +
            record.managementCapability.workMethods +
            record.managementCapability.workControlCapability) /
          4
        return (
          <div>
            <Progress
              percent={(avg / 4) * 100}
              size="small"
              strokeColor={getScoreColor(avg)}
              showInfo={false}
            />
            <Text style={{ color: getScoreColor(avg) }}>{avg.toFixed(2)}</Text>
          </div>
        )
      },
    },
    {
      title: '总分',
      dataIndex: 'totalScore',
      key: 'totalScore',
      width: 80,
      align: 'center',
      sorter: (a, b) => a.totalScore - b.totalScore,
      render: (value: number) => (
        <Text style={{ color: getScoreColor(value / 25), fontWeight: 'bold' }}>{value}</Text>
      ),
    },
    {
      title: '平均分',
      dataIndex: 'averageScore',
      key: 'averageScore',
      width: 100,
      align: 'center',
      sorter: (a, b) => a.averageScore - b.averageScore,
      render: (value: number) => (
        <div>
          <Progress
            percent={(value / 4) * 100}
            size="small"
            strokeColor={getScoreColor(value)}
            showInfo={false}
          />
          <Text style={{ color: getScoreColor(value) }}>{value.toFixed(2)}</Text>
          {getScoreTag(value)}
        </div>
      ),
    },
    {
      title: '评价日期',
      dataIndex: 'evaluationDate',
      key: 'evaluationDate',
      width: 120,
      align: 'center',
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      align: 'center',
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" icon={<EyeOutlined />} onClick={() => handleView(record)}>
            查看
          </Button>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
        </Space>
      ),
    },
  ]

  // 计算统计数据
  const stats = {
    totalEvaluations: filteredData.length,
    avgTotalScore:
      filteredData.length > 0
        ? filteredData.reduce((sum, item) => sum + item.totalScore, 0) / filteredData.length
        : 0,
    avgAverageScore:
      filteredData.length > 0
        ? filteredData.reduce((sum, item) => sum + item.averageScore, 0) / filteredData.length
        : 0,
    excellentCount: filteredData.filter((item) => item.averageScore >= 3.5).length,
    goodCount: filteredData.filter((item) => item.averageScore >= 3.0 && item.averageScore < 3.5)
      .length,
  }

  if (loading && data.length === 0) {
    return (
      <div className="text-center py-5">
        <Spin size="large" />
        <div className="mt-3">
          <Text type="secondary">加载教员功能分析数据中...</Text>
        </div>
      </div>
    )
  }

  return (
    <div className="teacher-function-analysis">
      {/* 页面标题 */}
      <div className="mb-4">
        <Title level={2}>
          <StarOutlined className="me-2" />
          教员功能分析表
        </Title>
        <Text type="secondary">最高议事厅智慧司学术经理功能评价表</Text>
      </div>

      {/* 神殿信息提示 */}
      {currentCampus && (
        <Alert message={`当前神殿: ${currentCampus}`} type="info" showIcon className="mb-4" />
      )}

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} className="mb-4">
        <Col xs={24} sm={12} md={6}>
          <Card className="text-center">
            <Statistic
              title="评价总数"
              value={stats.totalEvaluations}
              prefix={<UserOutlined className="text-primary" />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="text-center">
            <Statistic
              title="平均总分"
              value={stats.avgTotalScore}
              prefix={<StarOutlined className="text-success" />}
              valueStyle={{ color: '#52c41a' }}
              precision={1}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="text-center">
            <Statistic
              title="平均分"
              value={stats.avgAverageScore}
              prefix={<StarOutlined className="text-warning" />}
              valueStyle={{ color: '#faad14' }}
              precision={2}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="text-center">
            <Statistic
              title="优秀人数"
              value={stats.excellentCount}
              prefix={<StarOutlined className="text-info" />}
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 搜索和筛选 */}
      <Card className="mb-4">
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <Search placeholder="搜索教员姓名或评价人" onSearch={handleSearch} allowClear />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select placeholder="选择评价周期" style={{ width: '100%' }} allowClear>
              <Option value="2024年第一季度">2024年第一季度</Option>
              <Option value="2024年第二季度">2024年第二季度</Option>
              <Option value="2024年第三季度">2024年第三季度</Option>
              <Option value="2024年第四季度">2024年第四季度</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select placeholder="选择评价等级" style={{ width: '100%' }} allowClear>
              <Option value="excellent">优秀 (≥3.5)</Option>
              <Option value="good">良好 (3.0-3.5)</Option>
              <Option value="qualified">合格 (2.5-3.0)</Option>
              <Option value="improve">待改进 (&lt;2.5)</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Space>
              <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
                刷新
              </Button>
              <Button icon={<PlusOutlined />} type="primary" onClick={handleAdd}>
                新增评价
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 操作按钮 */}
      <Card className="mb-4">
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Button icon={<DownloadOutlined />} onClick={handleExport}>
                导出Excel
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 功能分析数据表格 */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
          }}
          scroll={{ x: 1500 }}
          size="small"
          bordered
        />
      </Card>

      {/* 详情/编辑模态框 */}
      <Modal
        title={modalType === 'view' ? '查看详情' : modalType === 'edit' ? '编辑评价' : '新增评价'}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
        width={1000}
        okText={modalType === 'view' ? '关闭' : '确定'}
        cancelText="取消"
      >
        {modalType === 'view' && selectedRecord ? (
          <div>
            <Row gutter={16}>
              <Col span={12}>
                <Card title="基本信息" size="small">
                  <p>
                    <strong>教员姓名：</strong>
                    {selectedRecord.teacherName}
                  </p>
                  <p>
                    <strong>评价周期：</strong>
                    {selectedRecord.evaluationPeriod}
                  </p>
                  <p>
                    <strong>评价人：</strong>
                    {selectedRecord.evaluator}
                  </p>
                  <p>
                    <strong>评价日期：</strong>
                    {selectedRecord.evaluationDate}
                  </p>
                  <p>
                    <strong>总分：</strong>
                    <Text
                      style={{
                        color: getScoreColor(selectedRecord.averageScore),
                        fontWeight: 'bold',
                      }}
                    >
                      {selectedRecord.totalScore}
                    </Text>
                  </p>
                  <p>
                    <strong>平均分：</strong>
                    <Text
                      style={{
                        color: getScoreColor(selectedRecord.averageScore),
                        fontWeight: 'bold',
                      }}
                    >
                      {selectedRecord.averageScore.toFixed(2)}
                    </Text>
                  </p>
                </Card>
              </Col>
              <Col span={12}>
                <Card title="评价等级" size="small">
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    {getScoreTag(selectedRecord.averageScore)}
                    <div style={{ marginTop: '10px' }}>
                      <Progress
                        type="circle"
                        percent={(selectedRecord.averageScore / 4) * 100}
                        strokeColor={getScoreColor(selectedRecord.averageScore)}
                        format={() => `${selectedRecord.averageScore.toFixed(2)}分`}
                      />
                    </div>
                  </div>
                </Card>
              </Col>
            </Row>

            <Divider />

            <Row gutter={16}>
              <Col span={12}>
                <Card title="价值观 (满分20分)" size="small">
                  <p>
                    <strong>责任心：</strong>
                    <Rate disabled value={selectedRecord.values.responsibility} />
                  </p>
                  <p>
                    <strong>执行力：</strong>
                    <Rate disabled value={selectedRecord.values.execution} />
                  </p>
                  <p>
                    <strong>任劳任怨：</strong>
                    <Rate disabled value={selectedRecord.values.diligence} />
                  </p>
                  <p>
                    <strong>团队精神：</strong>
                    <Rate disabled value={selectedRecord.values.teamSpirit} />
                  </p>
                  <p>
                    <strong>职业道德：</strong>
                    <Rate disabled value={selectedRecord.values.professionalEthics} />
                  </p>
                </Card>
              </Col>
              <Col span={12}>
                <Card title="业务能力 (满分36分)" size="small">
                  <p>
                    <strong>技术能力：</strong>
                    <Rate disabled value={selectedRecord.businessCapability.technicalAbility} />
                  </p>
                  <p>
                    <strong>创新能力：</strong>
                    <Rate disabled value={selectedRecord.businessCapability.innovationCapability} />
                  </p>
                  <p>
                    <strong>教学研发：</strong>
                    <Rate disabled value={selectedRecord.businessCapability.teachingRnd} />
                  </p>
                  <p>
                    <strong>教学实施：</strong>
                    <Rate
                      disabled
                      value={selectedRecord.businessCapability.teachingImplementation}
                    />
                  </p>
                  <p>
                    <strong>教学测评：</strong>
                    <Rate disabled value={selectedRecord.businessCapability.teachingEvaluation} />
                  </p>
                  <p>
                    <strong>就业情况：</strong>
                    <Rate disabled value={selectedRecord.businessCapability.employmentStatus} />
                  </p>
                  <p>
                    <strong>口碑：</strong>
                    <Rate disabled value={selectedRecord.businessCapability.reputation} />
                  </p>
                  <p>
                    <strong>新生维稳：</strong>
                    <Rate disabled value={selectedRecord.businessCapability.newStudentStability} />
                  </p>
                  <p>
                    <strong>招聘能力：</strong>
                    <Rate
                      disabled
                      value={selectedRecord.businessCapability.recruitmentCapability}
                    />
                  </p>
                </Card>
              </Col>
            </Row>

            <Divider />

            <Row gutter={16}>
              <Col span={12}>
                <Card title="团队建设 (满分28分)" size="small">
                  <p>
                    <strong>业务培养能力：</strong>
                    <Rate disabled value={selectedRecord.teamBuilding.businessTrainingCapability} />
                  </p>
                  <p>
                    <strong>价值观培养能力：</strong>
                    <Rate disabled value={selectedRecord.teamBuilding.valuesTrainingCapability} />
                  </p>
                  <p>
                    <strong>员工访谈能力：</strong>
                    <Rate
                      disabled
                      value={selectedRecord.teamBuilding.employeeInterviewCapability}
                    />
                  </p>
                  <p>
                    <strong>考核能力：</strong>
                    <Rate disabled value={selectedRecord.teamBuilding.assessmentCapability} />
                  </p>
                  <p>
                    <strong>评价能力：</strong>
                    <Rate disabled value={selectedRecord.teamBuilding.evaluationCapability} />
                  </p>
                  <p>
                    <strong>工作规划能力：</strong>
                    <Rate disabled value={selectedRecord.teamBuilding.workPlanningCapability} />
                  </p>
                  <p>
                    <strong>威望及亲和力：</strong>
                    <Rate disabled value={selectedRecord.teamBuilding.prestigeAndAffinity} />
                  </p>
                </Card>
              </Col>
              <Col span={12}>
                <Card title="管理能力 (满分16分)" size="small">
                  <p>
                    <strong>示范能力：</strong>
                    <Rate
                      disabled
                      value={selectedRecord.managementCapability.exemplaryCapability}
                    />
                  </p>
                  <p>
                    <strong>领导能力：</strong>
                    <Rate
                      disabled
                      value={selectedRecord.managementCapability.leadershipCapability}
                    />
                  </p>
                  <p>
                    <strong>工作方法：</strong>
                    <Rate disabled value={selectedRecord.managementCapability.workMethods} />
                  </p>
                  <p>
                    <strong>工作控制能力：</strong>
                    <Rate
                      disabled
                      value={selectedRecord.managementCapability.workControlCapability}
                    />
                  </p>
                </Card>
              </Col>
            </Row>

            <Divider />

            <Card title="评价备注" size="small">
              <Text>{selectedRecord.remarks}</Text>
            </Card>
          </div>
        ) : (
          <Form form={form} layout="vertical">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="teacherName"
                  label="教员姓名"
                  rules={[{ required: true, message: '请输入教员姓名' }]}
                >
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="evaluationPeriod"
                  label="评价周期"
                  rules={[{ required: true, message: '请选择评价周期' }]}
                >
                  <Select>
                    <Option value="2024年第一季度">2024年第一季度</Option>
                    <Option value="2024年第二季度">2024年第二季度</Option>
                    <Option value="2024年第三季度">2024年第三季度</Option>
                    <Option value="2024年第四季度">2024年第四季度</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="evaluator"
                  label="评价人"
                  rules={[{ required: true, message: '请输入评价人' }]}
                >
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="evaluationDate"
                  label="评价日期"
                  rules={[{ required: true, message: '请选择评价日期' }]}
                >
                  <Input />
                </Form.Item>
              </Col>
            </Row>

            <Divider>价值观评价 (每项满分4分)</Divider>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name={['values', 'responsibility']} label="责任心">
                  <Rate />
                </Form.Item>
                <Form.Item name={['values', 'execution']} label="执行力">
                  <Rate />
                </Form.Item>
                <Form.Item name={['values', 'diligence']} label="任劳任怨">
                  <Rate />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name={['values', 'teamSpirit']} label="团队精神">
                  <Rate />
                </Form.Item>
                <Form.Item name={['values', 'professionalEthics']} label="职业道德">
                  <Rate />
                </Form.Item>
              </Col>
            </Row>

            <Divider>业务能力评价 (每项满分4分)</Divider>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name={['businessCapability', 'technicalAbility']} label="技术能力">
                  <Rate />
                </Form.Item>
                <Form.Item name={['businessCapability', 'innovationCapability']} label="创新能力">
                  <Rate />
                </Form.Item>
                <Form.Item name={['businessCapability', 'teachingRnd']} label="教学研发">
                  <Rate />
                </Form.Item>
                <Form.Item name={['businessCapability', 'teachingImplementation']} label="教学实施">
                  <Rate />
                </Form.Item>
                <Form.Item name={['businessCapability', 'teachingEvaluation']} label="教学测评">
                  <Rate />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name={['businessCapability', 'employmentStatus']} label="就业情况">
                  <Rate />
                </Form.Item>
                <Form.Item name={['businessCapability', 'reputation']} label="口碑">
                  <Rate />
                </Form.Item>
                <Form.Item name={['businessCapability', 'newStudentStability']} label="新生维稳">
                  <Rate />
                </Form.Item>
                <Form.Item name={['businessCapability', 'recruitmentCapability']} label="招聘能力">
                  <Rate />
                </Form.Item>
              </Col>
            </Row>

            <Divider>团队建设评价 (每项满分4分)</Divider>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name={['teamBuilding', 'businessTrainingCapability']}
                  label="业务培养能力"
                >
                  <Rate />
                </Form.Item>
                <Form.Item
                  name={['teamBuilding', 'valuesTrainingCapability']}
                  label="价值观培养能力"
                >
                  <Rate />
                </Form.Item>
                <Form.Item
                  name={['teamBuilding', 'employeeInterviewCapability']}
                  label="员工访谈能力"
                >
                  <Rate />
                </Form.Item>
                <Form.Item name={['teamBuilding', 'assessmentCapability']} label="考核能力">
                  <Rate />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name={['teamBuilding', 'evaluationCapability']} label="评价能力">
                  <Rate />
                </Form.Item>
                <Form.Item name={['teamBuilding', 'workPlanningCapability']} label="工作规划能力">
                  <Rate />
                </Form.Item>
                <Form.Item name={['teamBuilding', 'prestigeAndAffinity']} label="威望及亲和力">
                  <Rate />
                </Form.Item>
              </Col>
            </Row>

            <Divider>管理能力评价 (每项满分4分)</Divider>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name={['managementCapability', 'exemplaryCapability']} label="示范能力">
                  <Rate />
                </Form.Item>
                <Form.Item name={['managementCapability', 'leadershipCapability']} label="领导能力">
                  <Rate />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name={['managementCapability', 'workMethods']} label="工作方法">
                  <Rate />
                </Form.Item>
                <Form.Item
                  name={['managementCapability', 'workControlCapability']}
                  label="工作控制能力"
                >
                  <Rate />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="remarks" label="评价备注">
              <TextArea rows={4} />
            </Form.Item>
          </Form>
        )}
      </Modal>

      {/* 说明信息 */}
      <Alert
        message="功能评价说明"
        description={
          <div>
            <p>
              • <strong>价值观</strong>：责任心、执行力、任劳任怨、团队精神、职业道德 (满分20分)
            </p>
            <p>
              • <strong>业务能力</strong>
              ：技术能力、创新能力、教学研发、教学实施、教学测评、就业情况、口碑、新生维稳、招聘能力
              (满分36分)
            </p>
            <p>
              • <strong>团队建设</strong>
              ：业务培养能力、价值观培养能力、员工访谈能力、考核能力、评价能力、工作规划能力、威望及亲和力
              (满分28分)
            </p>
            <p>
              • <strong>管理能力</strong>：示范能力、领导能力、工作方法、工作控制能力 (满分16分)
            </p>
            <p>
              • <strong>总分</strong>：100分，平均分 = 总分 ÷ 25项
            </p>
            <p>
              • <strong>评价等级</strong>
              ：优秀(≥3.5分)、良好(3.0-3.5分)、合格(2.5-3.0分)、待改进(&lt;2.5分)
            </p>
          </div>
        }
        type="info"
        showIcon
        className="mt-4"
      />
    </div>
  )
}

export default TeacherFunctionAnalysis
