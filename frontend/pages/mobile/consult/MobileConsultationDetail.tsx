/**
 * 移动端 - 咨询详情页
 *
 * 功能：
 * 1. 查看咨询记录完整信息（基本信息、来源信息、分配信息、标记等）
 * 2. 查看沟通记录列表（含距上次联络天数）
 * 3. 新增/编辑沟通记录
 * 4. 快捷拨打电话
 * 5. 支持从 location.state.tab 决定初始展示的 Tab
 */

import React, { useState, useEffect, useCallback } from 'react'
import { App,
  Card,
  Tabs,
  Tag,
  Button,
  Space,
  Descriptions,
  Divider,
  Drawer,
  Form,
  Input,
  DatePicker,
  Radio,
  Select,
  Spin,
  Empty,
  Popconfirm,
} from 'antd'
import {
  ArrowLeftOutlined,
  PhoneOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import dayjs from 'dayjs'
import * as api from '@/pages/consult/type-count-system/api'
import * as phoneApi from '@/pages/consult/type-count-system/phoneStatsApi'
import type { ConsultationRecord } from '@/pages/consult/type-count-system/types'
import type { CommunicationRecord } from '@/pages/consult/type-count-system/phoneStatsApi'
import './MobileConsultationDetail.css'

// 报名意向颜色
const intentionColors: Record<string, string> = {
  强意向: 'success',
  中意向: 'processing',
  弱意向: 'warning',
  无意向: 'default',
  已报名: 'cyan',
  联系不上: 'error',
}

// 沟通方式颜色
const methodColors: Record<string, string> = {
  电话: 'blue',
  网聊: 'green',
  当面: 'orange',
}

// 报名意愿标签
const intentionLabels: Record<string, string> = {
  A: 'A-强',
  B: 'B-中',
  C: 'C-弱',
  D: 'D-无',
}

export default function MobileConsultationDetail() {
  const { message } = App.useApp()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()

  // 从 location.state 读取初始 tab
  const initialTab =
    (location.state as Record<string, unknown>)?.tab === 'communication' ? 'communication' : 'info'

  const [loading, setLoading] = useState(true)
  const [record, setRecord] = useState<ConsultationRecord | null>(null)
  const [activeTab, setActiveTab] = useState(initialTab)

  // 沟通记录
  const [commRecords, setCommRecords] = useState<CommunicationRecord[]>([])
  const [commLoading, setCommLoading] = useState(false)

  // 新增/编辑沟通记录
  const [drawerVisible, setDrawerVisible] = useState(false)
  const [editingComm, setEditingComm] = useState<CommunicationRecord | null>(null)
  const [saving, setSaving] = useState(false)
  const [form] = Form.useForm()

  // 加载咨询记录详情
  const loadRecord = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const recordId = parseInt(id)
      const data = await api.getConsultationRecord(recordId)
      setRecord(data)
    } catch (error) {
      console.error('加载咨询记录失败:', error)
      message.error('加载咨询记录失败')
    } finally {
      setLoading(false)
    }
  }, [id])

  // 加载沟通记录
  const loadCommRecords = useCallback(async () => {
    if (!id) return
    setCommLoading(true)
    try {
      const recordId = parseInt(id)
      const result = await phoneApi.getCommunicationsByRecordId(recordId)
      if (result.success) {
        setCommRecords(result.data || [])
      }
    } catch (error) {
      console.error('加载沟通记录失败:', error)
    } finally {
      setCommLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadRecord()
    loadCommRecords()
  }, [loadRecord, loadCommRecords])

  // 拨打电话
  const handleCall = () => {
    if (record?.电话) {
      window.location.href = `tel:${record.电话}`
    } else {
      message.warning('无电话号码')
    }
  }

  // 返回
  const handleBack = () => {
    navigate(-1)
  }

  // 计算距上次联络天数
  const getDaysSinceLastContact = () => {
    if (commRecords.length === 0) return null
    const sorted = [...commRecords].sort(
      (a, b) => dayjs(b.沟通时间).valueOf() - dayjs(a.沟通时间).valueOf(),
    )
    return dayjs().diff(dayjs(sorted[0].沟通时间), 'day')
  }

  // 新增沟通记录
  const handleAddComm = () => {
    setEditingComm(null)
    form.resetFields()
    form.setFieldsValue({
      沟通时间: dayjs(),
      沟通方式: '电话',
    })
    setDrawerVisible(true)
  }

  // 编辑沟通记录
  const handleEditComm = (comm: CommunicationRecord) => {
    setEditingComm(comm)
    form.setFieldsValue({
      ...comm,
      沟通时间: dayjs(comm.沟通时间),
      预定回访时间: comm.预定回访时间 ? dayjs(comm.预定回访时间) : undefined,
    })
    setDrawerVisible(true)
  }

  // 保存沟通记录
  const handleSaveComm = async () => {
    try {
      const values = await form.validateFields()
      setSaving(true)

      const data = {
        ...values,
        沟通时间: values.沟通时间.format('YYYY-MM-DD HH:mm:ss'),
        预定回访时间: values.预定回访时间?.format('YYYY-MM-DD HH:mm:ss'),
        记录ID: parseInt(id!),
      }

      if (editingComm) {
        await phoneApi.updateCommunicationRecord(editingComm.沟通ID, data)
        message.success('更新成功')
      } else {
        await phoneApi.createCommunicationRecord(data)
        message.success('添加成功')
      }

      setDrawerVisible(false)
      loadCommRecords()
    } catch (error) {
      console.error('保存失败:', error)
      message.error('保存失败')
    } finally {
      setSaving(false)
    }
  }

  // 删除沟通记录
  const handleDeleteComm = async (沟通ID: number) => {
    try {
      await phoneApi.deleteCommunicationRecord(沟通ID)
      message.success('删除成功')
      loadCommRecords()
    } catch {
      message.error('删除失败')
    }
  }

  // 渲染基本信息
  const renderBasicInfo = () => {
    if (!record) return null

    return (
      <div className="m-detail-section">
        {/* 基本信息 */}
        <Card size="small" className="info-card">
          <div className="person-header">
            <div className="person-name">
              <span className="name">{record.咨询者姓名 || '未知'}</span>
              {record.咨询类别 && (
                <Tag
                  color={
                    record.咨询类别 === '私域'
                      ? 'purple'
                      : record.咨询类别 === '再'
                        ? 'orange'
                        : 'green'
                  }
                >
                  {record.咨询类别}
                </Tag>
              )}
              <Tag color={intentionColors[record.报名意向 || '无意向']}>
                {record.报名意向 || '无意向'}
              </Tag>
            </div>
            <Button type="primary" icon={<PhoneOutlined />} onClick={handleCall}>
              拨打
            </Button>
          </div>

          <Descriptions column={2} size="small" bordered className="info-desc">
            <Descriptions.Item label="电话" span={2}>
              <a href={`tel:${record.电话}`}>{record.电话}</a>
            </Descriptions.Item>
            <Descriptions.Item label="性别">{record.性别 || '-'}</Descriptions.Item>
            <Descriptions.Item label="年龄">{record.年龄 || '-'}</Descriptions.Item>
            <Descriptions.Item label="学历">{record.学历 || '-'}</Descriptions.Item>
            <Descriptions.Item label="状态">{record.状态 || '-'}</Descriptions.Item>
            <Descriptions.Item label="位置" span={2}>
              {record.位置 || '-'}
            </Descriptions.Item>
            {record.地区 && <Descriptions.Item label="地区">{record.地区}</Descriptions.Item>}
            {record.县 && <Descriptions.Item label="县">{record.县}</Descriptions.Item>}
            {record.详细地址 && (
              <Descriptions.Item label="详细地址" span={2}>
                {record.详细地址}
              </Descriptions.Item>
            )}
            {record.就读学校 && (
              <Descriptions.Item label="就读学校" span={2}>
                {record.就读学校}
              </Descriptions.Item>
            )}
            {record.目前状态 && (
              <Descriptions.Item label="目前状态">{record.目前状态}</Descriptions.Item>
            )}
          </Descriptions>
        </Card>

        {/* 来源信息 */}
        <Card size="small" className="info-card" title="来源信息">
          <Descriptions column={2} size="small" bordered>
            <Descriptions.Item label="量来源">{record.量来源 || '-'}</Descriptions.Item>
            <Descriptions.Item label="来源类别">{record.来源类别 || '-'}</Descriptions.Item>
            <Descriptions.Item label="媒体来源" span={2}>
              {record.媒体来源 || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="关键字" span={2}>
              {record.关键字 || '-'}
            </Descriptions.Item>
            {record.平台 && (
              <Descriptions.Item label="平台" span={2}>
                {record.平台}
              </Descriptions.Item>
            )}
            {record.口碑提供人 && (
              <Descriptions.Item label="口碑提供人" span={2}>
                {record.口碑提供人}
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>

        {/* 分配信息 */}
        <Card size="small" className="info-card" title="分配与跟进">
          <Descriptions column={2} size="small" bordered>
            <Descriptions.Item label="咨询师">{record.咨询师 || '-'}</Descriptions.Item>
            <Descriptions.Item label="分量人">{record.分量人 || '-'}</Descriptions.Item>
            <Descriptions.Item label="录量人">{record.录量人 || '-'}</Descriptions.Item>
            <Descriptions.Item label="咨询次数">{record.咨询次数 || 0}</Descriptions.Item>
            <Descriptions.Item label="登记日期" span={2}>
              {record.登记日期 ? dayjs(record.登记日期).format('YYYY-MM-DD') : '-'}
            </Descriptions.Item>
            {record.代咨 && (
              <Descriptions.Item label="代咨" span={2}>
                {record.代咨}
              </Descriptions.Item>
            )}
            {record.网聊专员 && (
              <Descriptions.Item label="网聊专员">{record.网聊专员}</Descriptions.Item>
            )}
            {record.渠道专员 && (
              <Descriptions.Item label="渠道专员">{record.渠道专员}</Descriptions.Item>
            )}
            {record.县办 && <Descriptions.Item label="县办">{record.县办}</Descriptions.Item>}
            {record.乡办 && <Descriptions.Item label="乡办">{record.乡办}</Descriptions.Item>}
            {record.信息员 && <Descriptions.Item label="信息员">{record.信息员}</Descriptions.Item>}
          </Descriptions>
        </Card>

        {/* 标记 */}
        <Card size="small" className="info-card" title="标记状态">
          <Space wrap size={[8, 8]}>
            {record.是否上门 === 1 && (
              <Tag color="cyan">
                上门 {record.上门时间 ? dayjs(record.上门时间).format('MM-DD') : ''}
              </Tag>
            )}
            {record.是否报名 === 1 && (
              <Tag color="green">
                报名 {record.报名时间 ? dayjs(record.报名时间).format('MM-DD') : ''}
              </Tag>
            )}
            {record.是否订座 === 1 && (
              <Tag color="purple">
                订座 {record.订座时间 ? dayjs(record.订座时间).format('MM-DD') : ''}
                {record.订座金额 ? ` ¥${record.订座金额}` : ''}
              </Tag>
            )}
            {record.是否无效量 === 1 && <Tag color="red">无效量: {record.无效原因 || '-'}</Tag>}
            {record.是否不算量 === 1 && (
              <Tag color="orange">不算量: {record.不算量原因 || '-'}</Tag>
            )}
            {record.是否校园量 === 1 && <Tag color="blue">校园量</Tag>}
            {record.网转上门 === 1 && <Tag color="geekblue">网转上门</Tag>}
            {record.网络新媒体 === 1 && <Tag color="geekblue">网络新媒体</Tag>}
            {record.口碑上门 === 1 && <Tag color="lime">口碑上门</Tag>}
            {record.渠道上门 === 1 && <Tag color="volcano">渠道上门</Tag>}
            {record.校园新渠道 === 1 && <Tag color="magenta">校园新渠道</Tag>}
            {record.新媒体来源 === 1 && <Tag color="cyan">新媒体来源</Tag>}
            {record.是否退费 === 1 && <Tag color="red">退费 ¥{record.退费金额 || 0}</Tag>}
          </Space>
          {record.是否上门 !== 1 &&
            record.是否报名 !== 1 &&
            record.是否订座 !== 1 &&
            record.是否无效量 !== 1 &&
            record.是否不算量 !== 1 &&
            record.是否校园量 !== 1 && (
              <Empty description="暂无标记" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
        </Card>

        {/* 报名信息 */}
        {record.是否报名 === 1 && (
          <Card size="small" className="info-card" title="报名信息">
            <Descriptions column={2} size="small" bordered>
              <Descriptions.Item label="报名专业">{record.报名专业 || '-'}</Descriptions.Item>
              <Descriptions.Item label="长期/短期">{record.长期短期 || '-'}</Descriptions.Item>
              <Descriptions.Item label="课程">{record.课程 || '-'}</Descriptions.Item>
              <Descriptions.Item label="已交学费">{record.已交学费 || '-'}</Descriptions.Item>
              {record.全款 != null && (
                <Descriptions.Item label="全款">¥{record.全款}</Descriptions.Item>
              )}
              {record.分期 != null && (
                <Descriptions.Item label="分期">¥{record.分期}</Descriptions.Item>
              )}
              {record.注册 != null && (
                <Descriptions.Item label="注册">¥{record.注册}</Descriptions.Item>
              )}
              {record.贷款 != null && (
                <Descriptions.Item label="贷款">¥{record.贷款}</Descriptions.Item>
              )}
              {record.缴费金额 != null && (
                <Descriptions.Item label="缴费金额" span={2}>
                  ¥{record.缴费金额}
                </Descriptions.Item>
              )}
              {record.分期备注 && (
                <Descriptions.Item label="分期备注" span={2}>
                  {record.分期备注}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>
        )}

        {/* 交接信息 */}
        {record.是否已交接 === 1 && (
          <Card size="small" className="info-card" title="交接信息">
            <Descriptions column={2} size="small" bordered>
              <Descriptions.Item label="交接人">{record.交接人 || '-'}</Descriptions.Item>
              <Descriptions.Item label="交接时间">
                {record.交接时间 ? dayjs(record.交接时间).format('YYYY-MM-DD') : '-'}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        )}

        {/* 其他联系方式 */}
        {(record.微信 || record.QQ || record.抖音 || record.快手) && (
          <Card size="small" className="info-card" title="其他联系方式">
            <Descriptions column={2} size="small" bordered>
              {record.微信 && <Descriptions.Item label="微信">{record.微信}</Descriptions.Item>}
              {record.QQ && <Descriptions.Item label="QQ">{record.QQ}</Descriptions.Item>}
              {record.抖音 && <Descriptions.Item label="抖音">{record.抖音}</Descriptions.Item>}
              {record.快手 && <Descriptions.Item label="快手">{record.快手}</Descriptions.Item>}
            </Descriptions>
          </Card>
        )}

        {/* 咨询结果与备注 */}
        {(record.咨询结果 || record.备注) && (
          <Card size="small" className="info-card" title="咨询结果与备注">
            {record.咨询结果 && (
              <div className="remark-section">
                <div className="remark-label">咨询结果</div>
                <div className="remark-text">{record.咨询结果}</div>
              </div>
            )}
            {record.备注 && (
              <div className="remark-section">
                <div className="remark-label">备注</div>
                <div className="remark-text">{record.备注}</div>
              </div>
            )}
          </Card>
        )}
      </div>
    )
  }

  // 渲染沟通记录列表
  const renderCommunicationRecords = () => {
    const daysSince = getDaysSinceLastContact()
    const sortedRecords = [...commRecords].sort(
      (a, b) => dayjs(b.沟通时间).valueOf() - dayjs(a.沟通时间).valueOf(),
    )

    return (
      <div className="m-comm-section">
        {/* 联络概况 */}
        <div className="comm-summary">
          <div className="summary-item">
            <span className="label">总沟通次数</span>
            <span className="value">{commRecords.length}</span>
          </div>
          <div className="summary-item">
            <span className="label">电话</span>
            <span className="value">{commRecords.filter((c) => c.沟通方式 === '电话').length}</span>
          </div>
          <div className="summary-item">
            <span className="label">网聊</span>
            <span className="value">{commRecords.filter((c) => c.沟通方式 === '网聊').length}</span>
          </div>
          <div className="summary-item">
            <span className="label">当面</span>
            <span className="value">{commRecords.filter((c) => c.沟通方式 === '当面').length}</span>
          </div>
          {daysSince !== null && (
            <div className={`summary-item days-since ${daysSince > 7 ? 'warning' : 'ok'}`}>
              <span className="label">距上次联络</span>
              <span className="value">{daysSince}天</span>
            </div>
          )}
        </div>

        {/* 新增按钮 */}
        <div className="comm-actions">
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddComm} block>
            新增沟通记录
          </Button>
        </div>

        {/* 沟通记录列表 */}
        {commLoading ? (
          <div className="loading-wrapper">
            <Spin />
          </div>
        ) : sortedRecords.length === 0 ? (
          <Empty description="暂无沟通记录" />
        ) : (
          <div className="comm-list">
            {sortedRecords.map((comm) => (
              <Card key={comm.沟通ID} size="small" className="comm-card">
                <div className="comm-card-header">
                  <Space>
                    <Tag color={methodColors[comm.沟通方式]}>{comm.沟通方式}</Tag>
                    <span className="comm-time">
                      {dayjs(comm.沟通时间).format('YYYY-MM-DD HH:mm')}
                    </span>
                    {comm.用时 > 0 && (
                      <span className="comm-duration">
                        <ClockCircleOutlined /> {comm.用时}分钟
                      </span>
                    )}
                  </Space>
                  <Space size="small">
                    <Button
                      size="small"
                      type="text"
                      icon={<EditOutlined />}
                      onClick={() => handleEditComm(comm)}
                    />
                    <Popconfirm
                      title="确定删除？"
                      onConfirm={() => handleDeleteComm(comm.沟通ID)}
                      okText="确定"
                      cancelText="取消"
                    >
                      <Button size="small" type="text" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                  </Space>
                </div>

                {/* 沟通内容 */}
                {comm.咨询内容 && <div className="comm-content">{comm.咨询内容}</div>}

                {/* 分析信息 */}
                <div className="comm-analysis">
                  {comm.报名意愿 && (
                    <Tag>意愿: {intentionLabels[comm.报名意愿] || comm.报名意愿}</Tag>
                  )}
                  {comm.需求点 && <Tag color="blue">需求: {comm.需求点}</Tag>}
                  {comm.关注点 && <Tag color="green">关注: {comm.关注点}</Tag>}
                  {comm.抗拒点 && <Tag color="red">抗拒: {comm.抗拒点}</Tag>}
                  {comm.课程意向 && <Tag color="purple">课程: {comm.课程意向}</Tag>}
                  {comm.联系不上 === 1 && <Tag color="error">联系不上</Tag>}
                </div>

                {/* 咨询结果 */}
                {comm.咨询结果 && (
                  <div className="comm-result">
                    <span className="label">结果：</span>
                    {comm.咨询结果}
                  </div>
                )}

                {/* 条件评估 */}
                {(comm.有需求 != null ||
                  comm.有钱 != null ||
                  comm.有时间 != null ||
                  comm.有支持 != null) && (
                  <div className="comm-conditions">
                    {comm.有需求 === 1 && <Tag color="success">有需求</Tag>}
                    {comm.有需求 === 0 && <Tag>无需求</Tag>}
                    {comm.有钱 === 1 && <Tag color="success">有钱</Tag>}
                    {comm.有钱 === 0 && <Tag>无钱</Tag>}
                    {comm.有时间 === 1 && <Tag color="success">有时间</Tag>}
                    {comm.有时间 === 0 && <Tag>无时间</Tag>}
                    {comm.有支持 === 1 && <Tag color="success">有支持</Tag>}
                    {comm.有支持 === 0 && <Tag>无支持</Tag>}
                  </div>
                )}

                {/* 预定回访时间 */}
                {comm.预定回访时间 && (
                  <div className="comm-revisit">
                    <ClockCircleOutlined /> 预定回访：
                    {dayjs(comm.预定回访时间).format('YYYY-MM-DD HH:mm')}
                  </div>
                )}

                {/* 咨询师 */}
                {comm.咨询师 && (
                  <div className="comm-consultant">
                    <UserOutlined /> {comm.咨询师}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="mobile-consultation-detail">
        <div className="m-detail-header">
          <Button icon={<ArrowLeftOutlined />} onClick={handleBack} type="text" />
          <h2>咨询详情</h2>
          <div />
        </div>
        <div className="loading-wrapper">
          <Spin size="large" tip="加载中..." />
        </div>
      </div>
    )
  }

  if (!record) {
    return (
      <div className="mobile-consultation-detail">
        <div className="m-detail-header">
          <Button icon={<ArrowLeftOutlined />} onClick={handleBack} type="text" />
          <h2>咨询详情</h2>
          <div />
        </div>
        <Empty description="未找到该咨询记录" />
      </div>
    )
  }

  return (
    <div className="mobile-consultation-detail">
      {/* 顶部导航 */}
      <div className="m-detail-header">
        <Button icon={<ArrowLeftOutlined />} onClick={handleBack} type="text">
          返回
        </Button>
        <h2>{record.咨询者姓名 || '咨询详情'}</h2>
        <Button type="primary" icon={<PhoneOutlined />} size="small" onClick={handleCall}>
          拨打
        </Button>
      </div>

      {/* Tab切换 */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        className="m-detail-tabs"
        items={[
          {
            key: 'info',
            label: '基本信息',
            children: renderBasicInfo(),
          },
          {
            key: 'communication',
            label: `沟通记录 (${commRecords.length})`,
            children: renderCommunicationRecords(),
          },
        ]}
      />

      {/* 新增/编辑沟通记录抽屉 */}
      <Drawer
        title={editingComm ? '编辑沟通记录' : '新增沟通记录'}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        placement="bottom"
        height="85vh"
        footer={
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={() => setDrawerVisible(false)}>取消</Button>
            <Button type="primary" onClick={handleSaveComm} loading={saving}>
              保存
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="沟通时间"
            label="沟通时间"
            rules={[{ required: true, message: '请选择沟通时间' }]}
          >
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="沟通方式"
            label="沟通方式"
            rules={[{ required: true, message: '请选择沟通方式' }]}
          >
            <Radio.Group>
              <Radio.Button value="电话">电话</Radio.Button>
              <Radio.Button value="网聊">网聊</Radio.Button>
              <Radio.Button value="当面">当面</Radio.Button>
            </Radio.Group>
          </Form.Item>

          <Form.Item name="用时" label="用时（分钟）">
            <Input type="number" placeholder="沟通用时" />
          </Form.Item>

          <Form.Item name="咨询内容" label="沟通内容">
            <Input.TextArea rows={4} placeholder="请输入沟通内容" />
          </Form.Item>

          <Form.Item name="咨询结果" label="咨询结果">
            <Input.TextArea rows={2} placeholder="请输入咨询结果" />
          </Form.Item>

          <Form.Item name="报名意愿" label="报名意愿">
            <Radio.Group>
              <Radio.Button value="A">A-强</Radio.Button>
              <Radio.Button value="B">B-中</Radio.Button>
              <Radio.Button value="C">C-弱</Radio.Button>
              <Radio.Button value="D">D-无</Radio.Button>
            </Radio.Group>
          </Form.Item>

          <Divider plain>需求分析</Divider>

          <Form.Item name="需求点" label="需求点">
            <Input placeholder="客户需求" />
          </Form.Item>
          <Form.Item name="关注点" label="关注点">
            <Input placeholder="客户关注" />
          </Form.Item>
          <Form.Item name="抗拒点" label="抗拒点">
            <Input placeholder="客户抗拒" />
          </Form.Item>
          <Form.Item name="课程意向" label="课程意向">
            <Input placeholder="意向课程" />
          </Form.Item>

          <Divider plain>条件评估</Divider>

          <Space wrap>
            <Form.Item name="有需求" label="有需求" valuePropName="checked" noStyle>
              <Select placeholder="有需求" style={{ width: 100 }} allowClear>
                <Select.Option value={1}>是</Select.Option>
                <Select.Option value={0}>否</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item name="有钱" noStyle>
              <Select placeholder="有钱" style={{ width: 100 }} allowClear>
                <Select.Option value={1}>是</Select.Option>
                <Select.Option value={0}>否</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item name="有时间" noStyle>
              <Select placeholder="有时间" style={{ width: 100 }} allowClear>
                <Select.Option value={1}>是</Select.Option>
                <Select.Option value={0}>否</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item name="有支持" noStyle>
              <Select placeholder="有支持" style={{ width: 100 }} allowClear>
                <Select.Option value={1}>是</Select.Option>
                <Select.Option value={0}>否</Select.Option>
              </Select>
            </Form.Item>
          </Space>

          <Form.Item name="联系不上" label="联系不上" style={{ marginTop: 16 }}>
            <Radio.Group>
              <Radio value={0}>否</Radio>
              <Radio value={1}>是</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item name="预定回访时间" label="预定回访时间">
            <DatePicker showTime style={{ width: '100%' }} placeholder="选择预定回访时间" />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  )
}
