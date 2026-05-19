/**
 * 晋升面试评价表 (PromotionInterview)
 *
 * 最高议事厅 -> 人事部 -> 基础数据 -> 人力资源规划 -> TAB4
 * XX神殿XX部门XXX员工晋升面试评价表
 *
 * 包含四大评价维度：价值观、业绩考核（三选一）、绩效指标、基础管理
 * 每项指标含三级评分档级、结果载体、评分，满分100分
 * 总分≥80分视为符合晋升条件
 */
import React, { useState, useCallback, useEffect, useMemo } from 'react'
import {
  App,
  Card,
  Form,
  Input,
  Button,
  DatePicker,
  Select,
  InputNumber,
  Space,
  Typography,
  Row,
  Col,
  Table,
  Modal,
  Tag,
  Tooltip,
  Alert,
  Radio,
  Statistic,
  Progress,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SaveOutlined,
  EyeOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import {
  createPromotionInterview,
  deletePromotionInterview,
  listPromotionInterviews,
  updatePromotionInterview,
  type PromotionInterviewPayload,
  type PromotionInterviewRecord,
} from '@/services/humanresources/promotionInterview'

const { Title, Text } = Typography
const { Option } = Select

// ======================== 评价维度数据定义 ========================

interface ScoreLevel {
  level: number
  description: string
  scoreRange: string
}

interface EvaluationCriteria {
  id: string
  name: string
  description: string
  maxScore: number
  scoreLevels: ScoreLevel[]
  evidence: string
}

interface EvaluationDimension {
  key: string
  name: string
  criteria: EvaluationCriteria[]
  note?: string
}

/** 完整的评价维度配置 */
const EVALUATION_DIMENSIONS: EvaluationDimension[] = [
  {
    key: 'values',
    name: '价值观',
    criteria: [
      {
        id: 'v1',
        name: '1. 恪守原则',
        description: '在工作中是否坚持遵循公司价值观，遵守相关法律法规和行业规范',
        maxScore: 10,
        scoreLevels: [
          { level: 1, description: '全面理解并严格遵循公司价值观在各项工作中的运用，未出现任何违规行为', scoreRange: '8-10分' },
          { level: 2, description: '基本能做到按章办事，在无外界监督的情况下，偶尔出现小疏忽但有限责任', scoreRange: '4-7分' },
          { level: 3, description: '常规工作按要求执行，但一旦涉及紧急、突发、高难度任务时易出现规避责任现象', scoreRange: '1-3分' },
        ],
        evidence: '面试问答记录、规章制度遵守情况、工作纪实',
      },
      {
        id: 'v2',
        name: '2. 信守责任',
        description: '是否在岗位的工作任务及结果承担责任，积极履行职责',
        maxScore: 10,
        scoreLevels: [
          { level: 1, description: '严格按照公司制度执行，敢于承担责任、不推诿，积极履行岗位职责', scoreRange: '8-10分' },
          { level: 2, description: '基本能做到按章办事，偶尔出现小疏忽但有限责任，意识松懈情况', scoreRange: '4-7分' },
          { level: 3, description: '意识松懈、懈怠情况', scoreRange: '1-3分' },
        ],
        evidence: '工作任务完成记录、责任事故处理记录',
      },
      {
        id: 'v3',
        name: '3. 做事先做人',
        description: '对事不对人，善于处理工作事务及同事、客户等沟通协作中是否以公正、平等、客观的态度对待不同的人和事',
        maxScore: 5,
        scoreLevels: [
          { level: 1, description: '以德为先，任事始终将做人放在首位，能够以公正、平等、客观的态度处理各类事务，善于从正反两方面看问题，为事不针对人', scoreRange: '4-5分' },
          { level: 2, description: '经常出现因事论事的状况，偶尔会因个人情绪波动而影响判断公正性', scoreRange: '2-3分' },
          { level: 3, description: '经常将个人情感或利益带入工作，常因人员关系差异而对事忽的解决方式产生不公', scoreRange: '1分' },
        ],
        evidence: '团队成员反馈、客户评价记录、冲突解决案例',
      },
      {
        id: 'v4',
        name: '4. 结果是导向，利润是尺度',
        description: '是否将公司业务的目标导向放在首位，以贡献的利润衡量工作价值',
        maxScore: 10,
        scoreLevels: [
          { level: 1, description: '在工作中将为公司创造利润作为衡量自身工作价值的关键标准，一切决策和行动都以结果为导向，追求最大化的经济效益', scoreRange: '8-10分' },
          { level: 2, description: '认识到利润是公司运营的重要指标，但会在部分非关键业务或短期项目中出现忽视重视前利益的现象', scoreRange: '4-7分' },
          { level: 3, description: '缺乏对公司利润目标的深刻理解，有时会因过度注重个人或局部利益而忽视对公司整体利润的影响', scoreRange: '1-3分' },
        ],
        evidence: '工作成果评估、项目效益分析报告',
      },
    ],
  },
  {
    key: 'performance',
    name: '业绩考核（关键岗位三选一）',
    note: '根据员工岗位性质，从以下三项中选择最相关的一项进行评分',
    criteria: [
      {
        id: 'p1',
        name: '1. 招生业绩',
        description: '是否完成或超额完成招生目标',
        maxScore: 20,
        scoreLevels: [
          { level: 1, description: '完成招生目标的110%以上', scoreRange: '15-20分' },
          { level: 2, description: '完成招生目标的100%-110%', scoreRange: '6-14分' },
          { level: 3, description: '未完成招生目标的80%以下', scoreRange: '1-5分' },
        ],
        evidence: '招生数据统计、报名记录',
      },
      {
        id: 'p2',
        name: '2. 教学业绩',
        description: '所教授课程的学员满意度及通过率',
        maxScore: 20,
        scoreLevels: [
          { level: 1, description: '学员满意度达到90%以上，通过率达到85%以上', scoreRange: '15-20分' },
          { level: 2, description: '学员满意度达到80%-90%，通过率达到80%-85%', scoreRange: '6-14分' },
          { level: 3, description: '学员满意度低于80%，通过率低于80%', scoreRange: '1-5分' },
        ],
        evidence: '学员满意度调查、考试成绩统计',
      },
      {
        id: 'p3',
        name: '3. 项目业绩',
        description: '参与或负责项目的完成情况及效果',
        maxScore: 20,
        scoreLevels: [
          { level: 1, description: '项目按时完成，成果超出预期，获得公司内部高度评价', scoreRange: '15-20分' },
          { level: 2, description: '项目按时完成，成果符合预期', scoreRange: '6-14分' },
          { level: 3, description: '项目延期或成果未达预期', scoreRange: '1-5分' },
        ],
        evidence: '项目进度报告、项目成果展示、内部评价记录',
      },
    ],
  },
  {
    key: 'kpi',
    name: '绩效指标',
    criteria: [
      {
        id: 'k1',
        name: '1. 工作效率',
        description: '完成工作任务的速度及及时性',
        maxScore: 10,
        scoreLevels: [
          { level: 1, description: '高效完成工作任务，经常提前完成', scoreRange: '8-10分' },
          { level: 2, description: '按时完成工作任务', scoreRange: '4-7分' },
          { level: 3, description: '经常拖延工作任务', scoreRange: '1-3分' },
        ],
        evidence: '工作任务完成记录、时间管理评估',
      },
      {
        id: 'k2',
        name: '2. 工作质量',
        description: '工作成果的准确性和专业性',
        maxScore: 10,
        scoreLevels: [
          { level: 1, description: '工作成果准确无误，专业性强，经常受到表扬', scoreRange: '8-10分' },
          { level: 2, description: '工作成果基本符合要求，偶尔有小错误', scoreRange: '4-7分' },
          { level: 3, description: '工作成果经常出现错误，需要多次修改', scoreRange: '1-3分' },
        ],
        evidence: '工作成果评估、表扬记录、错误记录',
      },
      {
        id: 'k3',
        name: '3. 创新能力',
        description: '在工作中提出新思路、新方法的情况',
        maxScore: 5,
        scoreLevels: [
          { level: 1, description: '经常提出创新性的想法，并成功应用于工作中，取得显著成效', scoreRange: '4-5分' },
          { level: 2, description: '偶尔提出创新想法，部分被采纳', scoreRange: '2-3分' },
          { level: 3, description: '很少提出创新想法', scoreRange: '1分' },
        ],
        evidence: '创新提案记录、应用效果评估',
      },
    ],
  },
  {
    key: 'management',
    name: '基础管理',
    criteria: [
      {
        id: 'm1',
        name: '1. 团队管理能力',
        description: '对团队成员的指导、激励及绩效管理',
        maxScore: 10,
        scoreLevels: [
          { level: 1, description: '有效管理团队，团队成员绩效优秀，团队氛围良好', scoreRange: '8-10分' },
          { level: 2, description: '基本管理团队，团队成员绩效达标', scoreRange: '4-7分' },
          { level: 3, description: '团队管理能力较弱，团队成员绩效不佳', scoreRange: '1-3分' },
        ],
        evidence: '团队绩效数据、团队成员反馈、团队氛围调查',
      },
      {
        id: 'm2',
        name: '2. 沟通协调能力',
        description: '与同事、上级及其他部门的沟通协作',
        maxScore: 5,
        scoreLevels: [
          { level: 1, description: '沟通协调能力强，能够有效解决冲突，促进合作', scoreRange: '4-5分' },
          { level: 2, description: '沟通协调能力一般，能够基本解决问题', scoreRange: '2-3分' },
          { level: 3, description: '沟通协调能力较弱，经常需要他人协助', scoreRange: '1分' },
        ],
        evidence: '沟通记录、冲突解决案例、合作项目评估',
      },
      {
        id: 'm3',
        name: '3. 规划与执行能力',
        description: '制定工作计划及执行的效果',
        maxScore: 5,
        scoreLevels: [
          { level: 1, description: '制定详细的工作计划，并高效执行，达成目标', scoreRange: '4-5分' },
          { level: 2, description: '制定工作计划，基本按计划执行', scoreRange: '2-3分' },
          { level: 3, description: '很少制定工作计划，执行效果差', scoreRange: '1分' },
        ],
        evidence: '工作计划文档、执行记录、目标达成情况',
      },
    ],
  },
]

// ======================== 接口定义 ========================

type InterviewRecord = PromotionInterviewRecord

type ErrorWithResponse = {
  response?: {
    data?: {
      detail?: string
    }
  }
  message?: string
}

const getErrorMessage = (error: unknown, fallback: string) => {
  const maybeError = error as ErrorWithResponse
  return maybeError.response?.data?.detail || maybeError.message || fallback
}

// ======================== 评分表单组件 ========================

const ScoreForm: React.FC<{
  form: ReturnType<typeof Form.useForm>[0]
  onFinish: (values: Record<string, unknown>) => void
}> = ({ form, onFinish }) => {
  const performanceType = Form.useWatch('performanceType', form) || 'p1'
  const scores = Form.useWatch('scores', form) || {}

  /** 计算总分 */
  const totalScore = useMemo(() => {
    let total = 0
    // 价值观
    for (const c of EVALUATION_DIMENSIONS[0].criteria) {
      total += (scores[c.id] as number) || 0
    }
    // 业绩考核（仅计算选择的那一项）
    total += (scores[performanceType] as number) || 0
    // 绩效指标
    for (const c of EVALUATION_DIMENSIONS[2].criteria) {
      total += (scores[c.id] as number) || 0
    }
    // 基础管理
    for (const c of EVALUATION_DIMENSIONS[3].criteria) {
      total += (scores[c.id] as number) || 0
    }
    return total
  }, [scores, performanceType])

  const passStatus = totalScore >= 80 ? 'success' : totalScore >= 60 ? 'normal' : 'exception'

  /** 渲染单个评价指标的评分行 */
  const renderCriteriaCard = (criteria: EvaluationCriteria, dimKey: string) => (
    <div
      key={criteria.id}
      style={{
        marginBottom: 16,
        border: '1px solid #f0f0f0',
        borderRadius: 8,
        overflow: 'hidden',
      }}
    >
      {/* 指标标题 */}
      <div style={{ background: '#fafafa', padding: '10px 16px', borderBottom: '1px solid #f0f0f0' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Text strong>{criteria.name}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 13 }}>{criteria.description}</Text>
          </Col>
          <Col>
            <Tag color="blue">满分 {criteria.maxScore} 分</Tag>
          </Col>
        </Row>
      </div>

      {/* 评分档级 */}
      <div style={{ padding: '12px 16px' }}>
        <Row gutter={16}>
          <Col span={16}>
            <div style={{ marginBottom: 8 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>评分档级：</Text>
            </div>
            {criteria.scoreLevels.map((sl) => (
              <div
                key={sl.level}
                style={{
                  padding: '6px 12px',
                  marginBottom: 4,
                  background: sl.level === 1 ? '#f6ffed' : sl.level === 2 ? '#fffbe6' : '#fff2f0',
                  borderRadius: 4,
                  fontSize: 13,
                  lineHeight: 1.6,
                }}
              >
                <Text
                  strong
                  style={{
                    color: sl.level === 1 ? '#52c41a' : sl.level === 2 ? '#faad14' : '#ff4d4f',
                    marginRight: 8,
                  }}
                >
                  {sl.scoreRange}
                </Text>
                {sl.description}
              </div>
            ))}
            <div style={{ marginTop: 8 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                结果载体：{criteria.evidence}
              </Text>
            </div>
          </Col>
          <Col span={8} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Form.Item
              name={['scores', criteria.id]}
              label="评分"
              rules={[
                { required: dimKey !== 'performance', message: '请打分' },
                {
                  type: 'number',
                  min: 0,
                  max: criteria.maxScore,
                  message: `分数范围 0-${criteria.maxScore}`,
                },
              ]}
              style={{ marginBottom: 0 }}
            >
              <InputNumber
                min={0}
                max={criteria.maxScore}
                precision={0}
                style={{ width: 120 }}
                size="large"
                placeholder={`0-${criteria.maxScore}`}
                addonAfter="分"
              />
            </Form.Item>
          </Col>
        </Row>
      </div>
    </div>
  )

  return (
    <Form form={form} layout="vertical" onFinish={onFinish} size="middle">
      {/* 标题 */}
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>员工晋升面试评价表</Title>
      </div>

      {/* 基本信息 */}
      <Card title="基本信息" size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
              <Input placeholder="请输入姓名" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="department" label="部门" rules={[{ required: true, message: '请选择部门' }]}>
              <Select placeholder="请选择部门">
                <Option value="最高议事厅">最高议事厅</Option>
                <Option value="智慧司">智慧司</Option>
                <Option value="教化司">教化司</Option>
                <Option value="市场部">市场部</Option>
                <Option value="祈福司">祈福司</Option>
                <Option value="人事部">人事部</Option>
                <Option value="神藏司">神藏司</Option>
                <Option value="线上事业部">线上事业部</Option>
                <Option value="线下事业部">线下事业部</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="position" label="岗位" rules={[{ required: true, message: '请输入岗位' }]}>
              <Input placeholder="请输入岗位" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="campus" label="所属神殿" rules={[{ required: true, message: '请选择神殿' }]}>
              <Select placeholder="请选择神殿">
                <Option value="主神殿">主神殿</Option>
                <Option value="永恒殿">永恒殿</Option>
                <Option value="慈悲殿">慈悲殿</Option>
                <Option value="李大殿">李大殿</Option>
                <Option value="智慧阁">智慧阁</Option>
                <Option value="光明殿">光明殿</Option>
                <Option value="神恩殿">神恩殿</Option>
                <Option value="天威殿">天威殿</Option>
                <Option value="最高议事厅">最高议事厅</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item name="interviewDate" label="面试日期" rules={[{ required: true, message: '请选择日期' }]}>
              <DatePicker style={{ width: '100%' }} placeholder="请选择日期" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="interviewer" label="面试评价人">
              <Input placeholder="请输入面试评价人" />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      {/* 评分总览 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={24} align="middle" justify="center">
          <Col>
            <Statistic title="当前总分" value={totalScore} suffix="/ 100" />
          </Col>
          <Col>
            <Progress
              type="circle"
              percent={totalScore}
              size={80}
              status={passStatus}
              format={(p) => `${p}分`}
            />
          </Col>
          <Col>
            <div>
              {totalScore >= 80 ? (
                <Tag color="success" style={{ fontSize: 14, padding: '4px 12px' }}>符合晋升条件</Tag>
              ) : totalScore > 0 ? (
                <Tag color="warning" style={{ fontSize: 14, padding: '4px 12px' }}>暂未达到晋升条件（≥80分）</Tag>
              ) : (
                <Tag style={{ fontSize: 14, padding: '4px 12px' }}>请开始评分</Tag>
              )}
            </div>
          </Col>
        </Row>
      </Card>

      {/* ===== 一、价值观（35分） ===== */}
      <Card
        title={<><Tag color="blue">满分35分</Tag> 一、价值观</>}
        size="small"
        style={{ marginBottom: 16 }}
      >
        {EVALUATION_DIMENSIONS[0].criteria.map((c) => renderCriteriaCard(c, 'values'))}
      </Card>

      {/* ===== 二、业绩考核（20分，三选一） ===== */}
      <Card
        title={<><Tag color="blue">满分20分</Tag> 二、业绩考核（关键岗位三选一）</>}
        size="small"
        style={{ marginBottom: 16 }}
      >
        <Alert
          type="info"
          showIcon
          message="请根据员工岗位性质，从以下三项中选择最相关的一项进行评分"
          style={{ marginBottom: 16 }}
        />
        <Form.Item name="performanceType" label="选择考核类型" initialValue="p1">
          <Radio.Group>
            <Radio.Button value="p1">招生业绩</Radio.Button>
            <Radio.Button value="p2">教学业绩</Radio.Button>
            <Radio.Button value="p3">项目业绩</Radio.Button>
          </Radio.Group>
        </Form.Item>
        {EVALUATION_DIMENSIONS[1].criteria
          .filter((c) => c.id === performanceType)
          .map((c) => renderCriteriaCard(c, 'performance'))}
      </Card>

      {/* ===== 三、绩效指标（25分） ===== */}
      <Card
        title={<><Tag color="blue">满分25分</Tag> 三、绩效指标</>}
        size="small"
        style={{ marginBottom: 16 }}
      >
        {EVALUATION_DIMENSIONS[2].criteria.map((c) => renderCriteriaCard(c, 'kpi'))}
      </Card>

      {/* ===== 四、基础管理（20分） ===== */}
      <Card
        title={<><Tag color="blue">满分20分</Tag> 四、基础管理</>}
        size="small"
        style={{ marginBottom: 16 }}
      >
        {EVALUATION_DIMENSIONS[3].criteria.map((c) => renderCriteriaCard(c, 'management'))}
      </Card>

      {/* 说明 */}
      <Alert
        type="info"
        showIcon
        message="说明"
        description={
          <div style={{ lineHeight: 2.2 }}>
            <div><Text strong>评分标准：</Text>每个指标根据实际情况进行评分，满分100分。</div>
            <div><Text strong>晋升要求：</Text>总分达到80分以上视为符合晋升条件。</div>
            <div><Text strong>结果载体：</Text>每个指标的评分依据应有具体的记录或数据支撑，如工作日志记录、日常工作表、招生数据统计、学员满意度调查等。</div>
          </div>
        }
      />
    </Form>
  )
}

// ======================== 打印预览 ========================

const PrintPreview: React.FC<{ record: InterviewRecord }> = ({ record }) => {
  const cell: React.CSSProperties = {
    border: '1px solid #333',
    padding: '6px 8px',
    fontSize: 12,
    lineHeight: 1.6,
    verticalAlign: 'top',
  }
  const label: React.CSSProperties = {
    ...cell,
    background: '#f5f5f5',
    fontWeight: 600,
    textAlign: 'center',
  }

  const performanceDim = EVALUATION_DIMENSIONS[1]
  const selectedPerf = performanceDim.criteria.find(c => c.id === record.performanceType) || performanceDim.criteria[0]

  /** 渲染评价维度的行 */
  const renderDimensionRows = (dim: EvaluationDimension, criteriaList: EvaluationCriteria[]) => {
    return criteriaList.map((criteria, idx) => (
      <tr key={criteria.id}>
        {idx === 0 && (
          <td
            rowSpan={criteriaList.length}
            style={{
              ...label,
              writingMode: 'vertical-rl',
              letterSpacing: 4,
              width: '6%',
            }}
          >
            {dim.name}
          </td>
        )}
        <td style={{ ...cell, width: '18%' }}>
          <Text strong>{criteria.name}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 11 }}>{criteria.description}</Text>
        </td>
        <td style={{ ...cell, width: '42%' }}>
          {criteria.scoreLevels.map((sl) => (
            <div key={sl.level} style={{ marginBottom: 2, fontSize: 11 }}>
              {sl.level}. {sl.description}（{sl.scoreRange}）
            </div>
          ))}
        </td>
        <td style={{ ...cell, width: '18%', fontSize: 11 }}>{criteria.evidence}</td>
        <td style={{ ...cell, width: '8%', textAlign: 'center', fontWeight: 600, fontSize: 14 }}>
          {record.scores[criteria.id] ?? '-'}
        </td>
      </tr>
    ))
  }

  return (
    <div style={{ padding: '16px 24px', fontFamily: 'SimSun, serif' }}>
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <Title level={4} style={{ margin: 0 }}>
          {record.campus || 'XX神殿'}{record.department || 'XX部门'}{record.name || 'XXX'}员工晋升面试评价表
        </Title>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid #333', tableLayout: 'fixed' }}>
        <thead>
          <tr>
            <th style={{ ...label, width: '6%' }}>评价维度</th>
            <th style={{ ...label, width: '18%' }}>评价指标</th>
            <th style={{ ...label, width: '42%' }}>评分档级</th>
            <th style={{ ...label, width: '18%' }}>结果载体</th>
            <th style={{ ...label, width: '8%' }}>评分</th>
          </tr>
        </thead>
        <tbody>
          {/* 价值观 */}
          {renderDimensionRows(EVALUATION_DIMENSIONS[0], EVALUATION_DIMENSIONS[0].criteria)}
          {/* 业绩考核（仅显示选择项） */}
          {renderDimensionRows(EVALUATION_DIMENSIONS[1], [selectedPerf])}
          {/* 绩效指标 */}
          {renderDimensionRows(EVALUATION_DIMENSIONS[2], EVALUATION_DIMENSIONS[2].criteria)}
          {/* 基础管理 */}
          {renderDimensionRows(EVALUATION_DIMENSIONS[3], EVALUATION_DIMENSIONS[3].criteria)}
          {/* 总分 */}
          <tr>
            <td colSpan={4} style={{ ...label, textAlign: 'right', paddingRight: 16 }}>总分</td>
            <td style={{ ...cell, textAlign: 'center', fontWeight: 700, fontSize: 16, color: record.totalScore >= 80 ? '#52c41a' : '#ff4d4f' }}>
              {record.totalScore}
            </td>
          </tr>
        </tbody>
      </table>

      <div style={{ marginTop: 12, fontSize: 12, lineHeight: 2 }}>
        <Text strong>说明：</Text><br />
        <Text>评分标准：每个指标根据实际情况进行评分，满分100分。</Text><br />
        <Text>晋升要求：总分达到80分以上视为符合晋升条件。</Text><br />
        <Text>结果载体：每个指标的评分依据应有具体的记录或数据支撑，如工作日志记录、日常工作表、招生数据统计、学员满意度调查等。</Text>
      </div>
    </div>
  )
}

// ======================== 主组件 ========================

const PromotionInterview: React.FC = () => {
  const { message, modal } = App.useApp()
  const [form] = Form.useForm()
  const [data, setData] = useState<InterviewRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [previewVisible, setPreviewVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<InterviewRecord | null>(null)
  const [previewRecord, setPreviewRecord] = useState<InterviewRecord | null>(null)
  const isPendingScoring = useCallback((record: InterviewRecord) => {
    const scoreValues = Object.values(record.scores || {})
    return (
      record.status === 'draft' &&
      record.totalScore === 0 &&
      scoreValues.length > 0 &&
      scoreValues.every((value) => !value)
    )
  }, [])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const records = await listPromotionInterviews()
      setData(records)
    } catch (error) {
      message.error(getErrorMessage(error, '加载晋升面试评价失败'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const handleAdd = useCallback(() => {
    setEditingRecord(null)
    form.resetFields()
    setModalVisible(true)
  }, [form])

  const handleEdit = useCallback((record: InterviewRecord) => {
    setEditingRecord(record)
    form.setFieldsValue({
      ...record,
      interviewDate: record.interviewDate ? dayjs(record.interviewDate) : undefined,
    })
    setModalVisible(true)
  }, [form])

  const handlePreview = useCallback((record: InterviewRecord) => {
    setPreviewRecord(record)
    setPreviewVisible(true)
  }, [])

  const handleDelete = useCallback((record: InterviewRecord) => {
    modal.confirm({
      title: '确认删除',
      content: '确定要删除这条晋升面试评价吗？',
      okText: '确定',
      cancelText: '取消',
      okType: 'danger',
      onOk: async () => {
        try {
          await deletePromotionInterview(record.id)
          setData(prev => prev.filter(item => item.id !== record.id))
          if (previewRecord?.id === record.id) {
            setPreviewVisible(false)
            setPreviewRecord(null)
          }
          message.success('删除成功')
        } catch (error) {
          message.error(getErrorMessage(error, '删除晋升面试评价失败'))
        }
      },
    })
  }, [previewRecord])

  const handleFinish = useCallback(async (values: Record<string, unknown>) => {
    const scoreValues = (values.scores || {}) as Record<string, number>
    const perfType = (values.performanceType || 'p1') as 'p1' | 'p2' | 'p3'
    const dateVal = values.interviewDate as dayjs.Dayjs | undefined

    const payload: PromotionInterviewPayload = {
      name: (values.name as string) || '',
      department: (values.department as string) || '',
      position: (values.position as string) || '',
      campus: (values.campus as string) || '',
      interviewDate: dateVal ? dateVal.format('YYYY-MM-DD') : '',
      interviewer: (values.interviewer as string) || '',
      performanceType: perfType,
      scores: scoreValues,
      status: editingRecord?.status || 'draft',
    }

    setSubmitting(true)
    try {
      if (editingRecord) {
        const record = await updatePromotionInterview(editingRecord.id, payload)
        setData(prev => prev.map(item => (item.id === editingRecord.id ? record : item)))
        if (previewRecord?.id === record.id) {
          setPreviewRecord(record)
        }
        message.success('更新成功')
      } else {
        const record = await createPromotionInterview(payload)
        setData(prev => [record, ...prev])
        message.success('新建成功')
      }
      setModalVisible(false)
      form.resetFields()
    } catch (error) {
      message.error(getErrorMessage(error, editingRecord ? '更新晋升面试评价失败' : '创建晋升面试评价失败'))
    } finally {
      setSubmitting(false)
    }
  }, [editingRecord, form, previewRecord])

  const columns: ColumnsType<InterviewRecord> = [
    { title: '序号', width: 60, align: 'center', render: (_v, _r, i) => i + 1 },
    { title: '姓名', dataIndex: 'name', width: 90 },
    { title: '部门', dataIndex: 'department', width: 100 },
    { title: '岗位', dataIndex: 'position', width: 100 },
    { title: '所属神殿', dataIndex: 'campus', width: 100 },
    { title: '面试日期', dataIndex: 'interviewDate', width: 110 },
    {
      title: '评价人',
      dataIndex: 'interviewer',
      width: 90,
      render: (value: string) => value?.trim() || <Text type="secondary">待填写</Text>,
    },
    {
      title: '总分',
      dataIndex: 'totalScore',
      width: 80,
      align: 'center',
      render: (v: number) => (
        <Text strong style={{ color: v >= 80 ? '#52c41a' : v >= 60 ? '#faad14' : '#ff4d4f', fontSize: 16 }}>
          {v}
        </Text>
      ),
      sorter: (a, b) => a.totalScore - b.totalScore,
    },
    {
      title: '晋升结果',
      width: 100,
      align: 'center',
      render: (_v, r) =>
        isPendingScoring(r) ? (
          <Tag color="processing">待评分</Tag>
        ) : r.totalScore >= 80 ? (
          <Tag color="success">达标</Tag>
        ) : (
          <Tag color="error">未达标</Tag>
        ),
    },
    {
      title: '操作',
      width: 150,
      align: 'center',
      fixed: 'right',
      render: (_v, record) => (
        <Space size="small">
          <Tooltip title="查看"><Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handlePreview(record)} /></Tooltip>
          <Tooltip title="编辑"><Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} /></Tooltip>
          <Tooltip title="删除"><Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)} /></Tooltip>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <TeamOutlined style={{ fontSize: 20 }} />
              <Title level={5} style={{ margin: 0 }}>员工晋升面试评价表</Title>
              <Text type="secondary">共 {data.length} 条记录</Text>
            </Space>
          </Col>
          <Col>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新建晋升面试评价</Button>
          </Col>
        </Row>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, showTotal: t => `共 ${t} 条` }}
          scroll={{ x: 1200 }}
          locale={{ emptyText: '暂无晋升面试评价，点击"新建晋升面试评价"创建' }}
        />
      </Card>

      <Modal
        title={editingRecord ? '编辑晋升面试评价' : '新建晋升面试评价'}
        open={modalVisible}
        onCancel={() => { if (!submitting) { setModalVisible(false); form.resetFields() } }}
        width={1060}
        footer={[
          <Button key="cancel" disabled={submitting} onClick={() => { setModalVisible(false); form.resetFields() }}>取消</Button>,
          <Button key="save" type="primary" loading={submitting} icon={<SaveOutlined />} onClick={() => form.submit()}>保存</Button>,
        ]}
        destroyOnClose
      >
        <div style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: 8 }}>
          <ScoreForm form={form} onFinish={handleFinish} />
        </div>
      </Modal>

      <Modal
        title="晋升面试评价表预览"
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        width={960}
        footer={[
          <Button key="close" onClick={() => setPreviewVisible(false)}>关闭</Button>,
          <Button key="print" type="primary" onClick={() => window.print()}>打印</Button>,
        ]}
      >
        {previewRecord && <PrintPreview record={previewRecord} />}
      </Modal>
    </div>
  )
}

export default PromotionInterview
