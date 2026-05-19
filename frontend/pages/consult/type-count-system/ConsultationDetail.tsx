import React from 'react'
import {
  Drawer,
  Card,
  Descriptions,
  Tag,
  Timeline,
  Divider,
  Space,
  Badge,
  Typography,
  Row,
  Col,
  Statistic,
} from 'antd'
import {
  PhoneOutlined,
  UserOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  BookOutlined,
  TeamOutlined,
  GlobalOutlined,
  MessageOutlined,
  QqOutlined,
  WechatOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import type { FullConsultationInfo, ConsultationRecord } from './types'

const { Text, Title } = Typography

interface ConsultationDetailProps {
  visible: boolean
  onClose: () => void
  data: FullConsultationInfo | null
  loading?: boolean
}

// 状态标签渲染
const renderStatusTag = (value: number | undefined, trueText: string, falseText: string = '否') => {
  if (value === 1) {
    return <Tag color="green" icon={<CheckCircleOutlined />}>{trueText}</Tag>
  }
  return <Tag color="default">{falseText}</Tag>
}

// 布尔值渲染
const renderBooleanBadge = (value: number | undefined, label: string) => {
  return value === 1 ? (
    <Badge status="success" text={label} />
  ) : null
}

// 格式化金额
const formatMoney = (value: number | string | undefined) => {
  if (value === undefined || value === null || value === '') return '-'
  const num = typeof value === 'string' ? parseFloat(value) : value
  return `¥${num.toLocaleString()}`
}

// 格式化日期
const formatDate = (value: string | undefined) => {
  if (!value) return '-'
  return dayjs(value).format('YYYY-MM-DD')
}

const formatDateTime = (value: string | undefined) => {
  if (!value) return '-'
  return dayjs(value).format('YYYY-MM-DD HH:mm:ss')
}

// 详情记录卡片
const DetailRecordCard: React.FC<{ item: ConsultationRecord; isLatest: boolean }> = ({ item, isLatest }) => {
  return (
    <div style={{ marginBottom: 16 }}>
      {/* 头部标签 */}
      <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <Text strong style={{ fontSize: 14 }}>
          <CalendarOutlined style={{ marginRight: 4 }} />
          {formatDateTime(item.登记日期)}
        </Text>
        {isLatest && <Tag color="green">最新</Tag>}
        {item.是否无效量 === 1 && <Tag color="red">无效量</Tag>}
        {item.是否不算量 === 1 && <Tag color="orange">不算量</Tag>}
        {item.是否上门 === 1 && <Tag color="blue">已上门</Tag>}
        {item.是否报名 === 1 && <Tag color="cyan">已报名</Tag>}
        {item.是否订座 === 1 && <Tag color="purple">已订座</Tag>}
        {item.是否已交接 === 1 && <Tag color="geekblue">已交接</Tag>}
      </div>

      {/* 基本信息 */}
      <Card size="small" style={{ marginBottom: 12 }}>
        <Descriptions column={{ xs: 1, sm: 2, md: 3 }} size="small" bordered>
          <Descriptions.Item label={<><UserOutlined /> 咨询者姓名</>}>{item.咨询者姓名 || '-'}</Descriptions.Item>
          <Descriptions.Item label="性别">{item.性别 || '-'}</Descriptions.Item>
          <Descriptions.Item label="年龄">{item.年龄 || '-'}</Descriptions.Item>
          <Descriptions.Item label={<><PhoneOutlined /> 电话</>}>{item.电话 || '-'}</Descriptions.Item>
          <Descriptions.Item label="学历">{item.学历 || '-'}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color="blue">{item.状态 || '-'}</Tag>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 联系方式 */}
      {(item.QQ || item.微信 || item.抖音 || item.快手) && (
        <Card size="small" title={<><MessageOutlined /> 联系方式</>} style={{ marginBottom: 12 }}>
          <Space wrap size={[16, 8]}>
            {item.QQ && (
              <span><QqOutlined style={{ color: '#1677ff' }} /> QQ: {item.QQ}</span>
            )}
            {item.微信 && (
              <span><WechatOutlined style={{ color: '#07c160' }} /> 微信: {item.微信}</span>
            )}
            {item.抖音 && (
              <span>🎵 抖音: {item.抖音}</span>
            )}
            {item.快手 && (
              <span>📹 快手: {item.快手}</span>
            )}
          </Space>
        </Card>
      )}

      {/* 来源信息 */}
      <Card size="small" title={<><GlobalOutlined /> 来源信息</>} style={{ marginBottom: 12 }}>
        <Descriptions column={{ xs: 1, sm: 2, md: 3 }} size="small">
          <Descriptions.Item label="量来源">
            <Tag color="processing">{item.量来源 || '-'}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="媒体来源">{item.媒体来源 || '-'}</Descriptions.Item>
          <Descriptions.Item label="咨询类别">{item.咨询类别 || '-'}</Descriptions.Item>
          <Descriptions.Item label="关键字">{item.关键字 || '-'}</Descriptions.Item>
          <Descriptions.Item label="报名意向">{item.报名意向 || '-'}</Descriptions.Item>
          {(item.量来源 === '口碑' || item.量来源 === '神殿新媒体') && (
            <Descriptions.Item label={item.量来源 === '神殿新媒体' ? '新媒体介绍人' : '口碑提供人'}>
              {item.口碑提供人 || '-'}
            </Descriptions.Item>
          )}
        </Descriptions>
        
        {/* 标记 */}
        <div style={{ marginTop: 8 }}>
          <Space wrap>
            {item.是否校园量 === 1 && <Tag color="magenta">校园量</Tag>}
          </Space>
        </div>
      </Card>

      {/* 人员信息 */}
      <Card size="small" title={<><TeamOutlined /> 人员信息</>} style={{ marginBottom: 12 }}>
        <Descriptions column={{ xs: 1, sm: 2, md: 4 }} size="small">
          <Descriptions.Item label="咨询师">{item.咨询师 || '-'}</Descriptions.Item>
          <Descriptions.Item label="分量人">{item.分量人 || '-'}</Descriptions.Item>
          <Descriptions.Item label="录量人">{item.录量人 || '-'}</Descriptions.Item>
          <Descriptions.Item label="代咨">{item.代咨 || '-'}</Descriptions.Item>
          <Descriptions.Item label="网聊专员">{item.网聊专员 || '-'}</Descriptions.Item>
          <Descriptions.Item label="渠道专员">{item.渠道专员 || '-'}</Descriptions.Item>
          <Descriptions.Item label="县办">{item.县办 || '-'}</Descriptions.Item>
          <Descriptions.Item label="乡办">{item.乡办 || '-'}</Descriptions.Item>
          <Descriptions.Item label="信息员">{item.信息员 || '-'}</Descriptions.Item>
          <Descriptions.Item label="创建人">{item.创建人姓名 || '-'}</Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 地区信息 */}
      {(item.位置 || item.地区 || item.县 || item.详细地址) && (
        <Card size="small" title={<><EnvironmentOutlined /> 地区信息</>} style={{ marginBottom: 12 }}>
          <Descriptions column={{ xs: 1, sm: 2 }} size="small">
            <Descriptions.Item label="位置">{item.位置 || '-'}</Descriptions.Item>
            <Descriptions.Item label="地区">{item.地区 || '-'}</Descriptions.Item>
            <Descriptions.Item label="县/区">{item.县 || '-'}</Descriptions.Item>
            <Descriptions.Item label="详细地址">{item.详细地址 || '-'}</Descriptions.Item>
          </Descriptions>
        </Card>
      )}

      {/* 学校与状态 */}
      {(item.就读学校 || item.目前状态) && (
        <Card size="small" title={<><BookOutlined /> 学历状态</>} style={{ marginBottom: 12 }}>
          <Descriptions column={{ xs: 1, sm: 2 }} size="small">
            <Descriptions.Item label="就读学校">{item.就读学校 || '-'}</Descriptions.Item>
            <Descriptions.Item label="目前状态">{item.目前状态 || '-'}</Descriptions.Item>
          </Descriptions>
        </Card>
      )}

      {/* 上门/报名/订座信息 */}
      {(item.是否上门 === 1 || item.是否报名 === 1 || item.是否订座 === 1) && (
        <Card 
          size="small" 
          title={<><CheckCircleOutlined style={{ color: '#52c41a' }} /> 转化信息</>} 
          style={{ marginBottom: 12, borderColor: '#b7eb8f' }}
        >
          <Row gutter={16}>
            {item.是否上门 === 1 && (
              <Col xs={24} sm={8}>
                <Card size="small" style={{ background: '#f6ffed', borderColor: '#b7eb8f' }}>
                  <Statistic 
                    title="上门时间" 
                    value={formatDate(item.上门时间)} 
                    prefix={<CalendarOutlined />}
                    valueStyle={{ fontSize: 14 }}
                  />
                </Card>
              </Col>
            )}
            {item.是否报名 === 1 && (
              <Col xs={24} sm={8}>
                <Card size="small" style={{ background: '#e6f7ff', borderColor: '#91d5ff' }}>
                  <Statistic 
                    title="报名时间" 
                    value={formatDate(item.报名时间)} 
                    prefix={<CalendarOutlined />}
                    valueStyle={{ fontSize: 14 }}
                  />
                  {item.报名专业 && (
                    <div style={{ marginTop: 8 }}>
                      <Text type="secondary">报名专业: </Text>
                      <Tag color="blue">{item.报名专业}</Tag>
                    </div>
                  )}
                </Card>
              </Col>
            )}
            {item.是否订座 === 1 && (
              <Col xs={24} sm={8}>
                <Card size="small" style={{ background: '#f9f0ff', borderColor: '#d3adf7' }}>
                  <Statistic 
                    title="订座时间" 
                    value={formatDate(item.订座时间)} 
                    prefix={<CalendarOutlined />}
                    valueStyle={{ fontSize: 14 }}
                  />
                  {item.订座金额 && (
                    <div style={{ marginTop: 8 }}>
                      <Text type="secondary">订座金额: </Text>
                      <Text strong style={{ color: '#722ed1' }}>{formatMoney(item.订座金额)}</Text>
                    </div>
                  )}
                </Card>
              </Col>
            )}
          </Row>
        </Card>
      )}

      {/* 报名详情 - 付款方式 */}
      {item.是否报名 === 1 && (item.全款 === 1 || item.分期 === 1 || item.注册 === 1 || item.贷款 === 1 || item.长期短期 || item.课程) && (
        <Card 
          size="small" 
          title={<><DollarOutlined style={{ color: '#faad14' }} /> 报名详情</>}
          style={{ marginBottom: 12, borderColor: '#ffe58f' }}
        >
          <Descriptions column={{ xs: 1, sm: 2, md: 3 }} size="small">
            <Descriptions.Item label="付款方式">
              <Space wrap>
                {item.全款 === 1 && <Tag color="gold">全款</Tag>}
                {item.分期 === 1 && <Tag color="orange">分期</Tag>}
                {item.注册 === 1 && <Tag color="lime">注册</Tag>}
                {item.贷款 === 1 && <Tag color="red">贷款</Tag>}
                {!item.全款 && !item.分期 && !item.注册 && !item.贷款 && '-'}
              </Space>
            </Descriptions.Item>
            {item.分期 === 1 && item.分期备注 && (
              <Descriptions.Item label="分期备注" span={2}>
                <Text type="warning">{item.分期备注}</Text>
              </Descriptions.Item>
            )}
            <Descriptions.Item label="长期/短期">{item.长期短期 || '-'}</Descriptions.Item>
            <Descriptions.Item label="课程">{item.课程 || '-'}</Descriptions.Item>
            <Descriptions.Item label="咨询时间">{item.咨询时间 || '-'}</Descriptions.Item>
            <Descriptions.Item label="咨询结果">{item.咨询结果 || '-'}</Descriptions.Item>
            <Descriptions.Item label="已交学费">{formatMoney(item.已交学费)}</Descriptions.Item>
            <Descriptions.Item label="缴费金额">{formatMoney(item.缴费金额)}</Descriptions.Item>
          </Descriptions>
        </Card>
      )}

      {/* 交接信息 */}
      {item.是否已交接 === 1 && (
        <Card 
          size="small" 
          title={<><TeamOutlined style={{ color: '#1890ff' }} /> 交接信息</>}
          style={{ marginBottom: 12, borderColor: '#91d5ff' }}
        >
          <Descriptions column={{ xs: 1, sm: 2 }} size="small">
            <Descriptions.Item label="交接时间">{formatDateTime(item.交接时间)}</Descriptions.Item>
            <Descriptions.Item label="交接人">{item.交接人 || '-'}</Descriptions.Item>
          </Descriptions>
        </Card>
      )}

      {/* 无效/不算量原因 */}
      {(item.是否无效量 === 1 || item.是否不算量 === 1) && (
        <Card 
          size="small" 
          title={<><CloseCircleOutlined style={{ color: '#ff4d4f' }} /> 特殊标记</>}
          style={{ marginBottom: 12, borderColor: '#ffccc7' }}
        >
          <Descriptions column={{ xs: 1, sm: 2 }} size="small">
            {item.是否无效量 === 1 && (
              <Descriptions.Item label="无效原因">
                <Tag color="red">{item.无效原因 || '未填写'}</Tag>
              </Descriptions.Item>
            )}
            {item.是否不算量 === 1 && (
              <Descriptions.Item label="不算量原因">
                <Tag color="orange">{item.不算量原因 || '未填写'}</Tag>
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>
      )}

      {/* 备注 */}
      {item.备注 && (
        <Card size="small" title="备注" style={{ marginBottom: 12 }}>
          <Text>{item.备注}</Text>
        </Card>
      )}

      {/* 系统信息 */}
      <Card size="small" title={<><ClockCircleOutlined /> 系统信息</>}>
        <Descriptions column={{ xs: 1, sm: 2, md: 4 }} size="small">
          <Descriptions.Item label="记录ID">{item.记录ID}</Descriptions.Item>
          <Descriptions.Item label="神殿">{item.神殿 || '-'}</Descriptions.Item>
          <Descriptions.Item label="创建时间">{formatDateTime(item.创建时间)}</Descriptions.Item>
          <Descriptions.Item label="更新时间">{formatDateTime(item.更新时间)}</Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  )
}

const ConsultationDetail: React.FC<ConsultationDetailProps> = ({
  visible,
  onClose,
  data,
  loading = false,
}) => {
  if (!data) return null

  return (
    <Drawer
      title={
        <Space>
          <span>咨询详情</span>
          <Tag color="blue">对象ID: {data.主表信息.对象ID}</Tag>
        </Space>
      }
      open={visible}
      onClose={onClose}
      width={800}
      loading={loading}
      styles={{ body: { padding: '16px 24px', background: '#f5f5f5' } }}
    >
      {/* 主表概览 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[24, 16]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="咨询次数"
              value={data.主表信息.咨询次数}
              suffix="次"
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col xs={24} sm={12} md={9}>
            <div>
              <Text type="secondary">电话列表</Text>
              <div style={{ marginTop: 4 }}>
                {data.主表信息.电话列表.map((p) => (
                  <Tag key={p} icon={<PhoneOutlined />} color="blue" style={{ marginBottom: 4 }}>
                    {p}
                  </Tag>
                ))}
              </div>
            </div>
          </Col>
          <Col xs={24} sm={12} md={5}>
            <div>
              <Text type="secondary">最新咨询者</Text>
              <div style={{ marginTop: 4 }}>
                <Text strong style={{ fontSize: 16 }}>{data.主表信息.最新咨询者姓名 || '-'}</Text>
              </div>
            </div>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <div>
              <Text type="secondary">最新状态</Text>
              <div style={{ marginTop: 4 }}>
                <Tag color="processing">{data.主表信息.最新状态 || '-'}</Tag>
              </div>
            </div>
          </Col>
        </Row>
        
        {/* 咨询时间线 */}
        {data.主表信息.咨询日期列表 && data.主表信息.咨询日期列表.length > 0 && (
          <>
            <Divider style={{ margin: '16px 0' }} />
            <div>
              <Text type="secondary" style={{ marginBottom: 8, display: 'block' }}>
                <ClockCircleOutlined style={{ marginRight: 4 }} />
                咨询时间记录 ({data.主表信息.咨询日期列表.length} 次)
              </Text>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                {data.主表信息.咨询日期列表.map((date, index) => (
                  <Tag 
                    key={index} 
                    color={index === 0 ? 'green' : 'default'}
                    icon={<CalendarOutlined />}
                  >
                    第{data.主表信息.咨询日期列表.length - index}次: {formatDateTime(date)}
                  </Tag>
                ))}
              </div>
            </div>
          </>
        )}
        
        <Divider style={{ margin: '16px 0' }} />
        <Descriptions column={{ xs: 1, sm: 2, md: 4 }} size="small">
          <Descriptions.Item label="首次登记时间">
            {formatDateTime(data.主表信息.首次登记时间)}
          </Descriptions.Item>
          <Descriptions.Item label="首次分量人">{data.主表信息.首次分量人 || '-'}</Descriptions.Item>
          <Descriptions.Item label="首次咨询师">{data.主表信息.首次咨询师 || '-'}</Descriptions.Item>
          <Descriptions.Item label="神殿">{data.主表信息.神殿 || '-'}</Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 咨询历史 */}
      <Card title={<><ClockCircleOutlined /> 咨询历史明细 ({data.明细列表.length} 条)</>}>
        <Timeline
          items={data.明细列表.map((item, index) => ({
            color: index === 0 ? 'green' : 'blue',
            dot: index === 0 ? <CheckCircleOutlined style={{ fontSize: 16 }} /> : undefined,
            children: <DetailRecordCard item={item} isLatest={index === 0} />,
          }))}
        />
      </Card>
    </Drawer>
  )
}

export default ConsultationDetail
