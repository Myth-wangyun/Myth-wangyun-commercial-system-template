/**
 * 移动端 - 咨询量录入表单
 *
 * 与桌面端 ConsultationForm 共享相同后端 API，
 * 但采用垂直分区布局，适合单手操作。
 */
import React, { useState, useEffect, useCallback } from 'react'
import { App,
  Form, Input, Select, DatePicker, Button, Modal,
  Tag, Descriptions, Alert, Checkbox, Divider, Radio, Space,
  InputNumber, Collapse,
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  WarningOutlined,
  EnvironmentOutlined,
  DownOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import type {
  CreateConsultationRequest,
  DuplicateCheckResponse,
  MediaHierarchyNode,
} from '../types'
import * as api from '../api'
import { getConsultantNames } from '@/services/consult/consultantList'
import { getPhoneLocation } from '@/services/consult/phoneLocation'
import { useCampusStore } from '@/stores/campusStore'

import './MobileConsultationForm.css'

const { TextArea } = Input

interface Props {
  onSuccess?: () => void
  campus?: string
}

export default function MobileConsultationForm({ onSuccess, campus }: Props) {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [checkingDuplicate, setCheckingDuplicate] = useState(false)
  const [duplicateInfo, setDuplicateInfo] = useState<DuplicateCheckResponse | null>(null)
  const [showDuplicateModal, setShowDuplicateModal] = useState(false)

  // 选项
  const [statusOptions, setStatusOptions] = useState<string[]>([])
  const [educationOptions, setEducationOptions] = useState<string[]>([])
  const [intentionOptions, setIntentionOptions] = useState<string[]>([])
  const [categoryOptions, setCategoryOptions] = useState<string[]>([])
  const [consultantOptions, setConsultantOptions] = useState<string[]>([])
  const [channelStaffOptions, setChannelStaffOptions] = useState<string[]>([])

  // 电话归属
  const [fetchingLocation, setFetchingLocation] = useState(false)
  const [locationInfo, setLocationInfo] = useState<string | null>(null)

  // 媒体来源层级
  const [mediaHierarchy, setMediaHierarchy] = useState<MediaHierarchyNode[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedSource, setSelectedSource] = useState<string | null>(null)

  const sourceOptions = React.useMemo(
    () => mediaHierarchy.map(n => n.name),
    [mediaHierarchy],
  )
  const level2Options = React.useMemo(() => {
    if (!selectedCategory || !mediaHierarchy.length) return []
    const cat = mediaHierarchy.find(n => n.name === selectedCategory)
    return (cat?.children as MediaHierarchyNode[]) || []
  }, [selectedCategory, mediaHierarchy])
  const level3Options = React.useMemo(() => {
    if (!selectedSource || !level2Options.length) return []
    const src = level2Options.find(n => n.name === selectedSource)
    return (src?.children as string[]) || []
  }, [selectedSource, level2Options])

  // ---------- 数据加载 ----------
  useEffect(() => {
    ;(async () => {
      try {
        const [status, education, intention, category, hierarchy] = await Promise.all([
          api.getStatusOptions(),
          api.getEducationOptions(),
          api.getIntentionOptions(),
          api.getCategoryOptions(),
          api.getMediaSourceHierarchy(),
        ])
        setStatusOptions(status.data)
        setEducationOptions(education.data)
        setIntentionOptions(intention.data)
        setCategoryOptions(category.data)
        setMediaHierarchy(hierarchy.data)
      } catch (e) {
        console.error('加载选项失败', e)
      }
    })()
  }, [])

  useEffect(() => {
    if (campus) {
      getConsultantNames(campus).then(setConsultantOptions).catch(console.error)
    }
  }, [campus])

  useEffect(() => {
    api.getChannelStaffOptions(campus).then(setChannelStaffOptions).catch(console.error)
  }, [campus])

  useEffect(() => {
    form.setFieldsValue({ 登记日期: dayjs(), 神殿: campus })
  }, [campus, form])

  // 登记日期实时更新
  useEffect(() => {
    const timer = setInterval(() => form.setFieldValue('登记日期', dayjs()), 1000)
    return () => clearInterval(timer)
  }, [form])

  // ---------- 归属地查询 ----------
  const handlePhoneBlur = useCallback(
    async (phone: string) => {
      const clean = phone.replace(/\D/g, '')
      if (clean.length < 7) { setLocationInfo(null); return }
      const cur = form.getFieldValue('位置')
      if (cur?.trim()) return
      setFetchingLocation(true)
      try {
        const r = await getPhoneLocation(clean)
        if (r.success && r.location) {
          form.setFieldValue('位置', r.location)
          setLocationInfo(`${r.location}${r.carrier ? ` (${r.carrier})` : ''}`)
        }
      } catch { /* noop */ } finally { setFetchingLocation(false) }
    },
    [form],
  )

  // ---------- 重量检查 ----------
  const handleCheckDuplicate = async () => {
    const phone = form.getFieldValue('电话')
    const weixin = form.getFieldValue('微信')
    if (!phone && !weixin) { message.warning('请先输入电话号码或微信号'); return }
    setCheckingDuplicate(true)
    try {
      const r = await api.checkDuplicate(phone || '', form.getFieldValue('第二电话'), weixin)
      setDuplicateInfo(r)
      if (r.是否重量) setShowDuplicateModal(true)
      else message.success('未发现重量')
    } catch { message.error('查重失败') } finally { setCheckingDuplicate(false) }
  }

  // ---------- 提交 ----------
  const handleSubmit = async (values: any) => {
    const phone = values.电话?.trim()
    const secondPhone = values.第二电话?.trim()
    const weixin = values.微信?.trim()
    if (!phone && !secondPhone && !weixin) {
      message.warning('请至少输入一个联系方式')
      return
    }
    setLoading(true)
    try {
      if (phone || secondPhone || weixin) {
        const dup = await api.checkDuplicate(phone || '', secondPhone || '', weixin || '')
        if (dup.是否重量) { setDuplicateInfo(dup); setShowDuplicateModal(true); setLoading(false); return }
      }
      if (!values.媒体来源 && values.来源类别) values.媒体来源 = values.来源类别

      const data: CreateConsultationRequest = {
        ...values,
        登记日期: values.登记日期?.toISOString(),
        神殿: campus || values.神殿,
        是否无效量: values.是否无效量 ? 1 : 0,
        是否不算量: values.是否不算量 ? 1 : 0,
        是否上门: values.是否上门 ? 1 : 0,
        是否报名: values.是否报名 ? 1 : 0,
        是否订座: values.是否订座 ? 1 : 0,
        是否校园量: values.是否校园量 ? 1 : 0,
        上门时间: values.上门时间?.toISOString(),
        报名时间: values.报名时间?.toISOString(),
        长期短期: values.长期短期,
        课程: values.课程,
        全款: values.全款 ? 1 : 0,
        分期: values.分期 ? 1 : 0,
        分期备注: values.分期备注 || null,
        注册: values.注册 ? 1 : 0,
        贷款: values.贷款 ? 1 : 0,
        详细地址: values.详细地址,
        订座时间: values.订座时间?.toISOString(),
        订座金额: values.订座金额 || 0,
      }

      await api.createConsultationRecord(data)
      message.success('录入成功！')
      form.resetFields()
      form.setFieldsValue({ 登记日期: dayjs(), 神殿: campus })
      setDuplicateInfo(null)
      setSelectedCategory(null)
      setSelectedSource(null)
      onSuccess?.()
    } catch (e: any) {
      message.error(e.response?.data?.detail || '录入失败')
    } finally { setLoading(false) }
  }

  // 报名联动
  const handleValuesChange = (changed: Record<string, any>, all: Record<string, any>) => {
    if ('报名意向' in changed) {
      if (all['报名意向'] === '已报名' && !all['是否报名']) form.setFieldsValue({ 是否报名: true })
      else if (all['报名意向'] !== '已报名' && all['是否报名']) form.setFieldsValue({ 是否报名: false })
    }
    if ('是否报名' in changed) {
      if (all['是否报名'] && all['报名意向'] !== '已报名') form.setFieldsValue({ 报名意向: '已报名' })
      else if (!all['是否报名'] && all['报名意向'] === '已报名') form.setFieldsValue({ 报名意向: undefined })
    }
  }

  return (
    <div className="m-form-page">
      {duplicateInfo?.是否重量 && (
        <Alert
          type="warning"
          message={<>检测到重量！已有 <Tag color="orange">{duplicateInfo.咨询次数}</Tag> 次记录</>}
          style={{ margin: '0 0 12px' }}
          showIcon
          banner
        />
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        onValuesChange={handleValuesChange}
        initialValues={{ 登记日期: dayjs(), 神殿: campus }}
        requiredMark={false}
        className="m-form"
      >
        {/* ========= 基础信息 ========= */}
        <div className="m-section">
          <div className="m-section-title">基础信息</div>

          <Form.Item
            name="电话"
            label="电话"
            dependencies={['微信']}
            rules={[({ getFieldValue }) => ({
              validator(_, v) {
                if (!v && !getFieldValue('微信')) return Promise.reject('请输入电话或微信')
                return Promise.resolve()
              },
            })]}
          >
            <Input
              placeholder="输入手机号"
              inputMode="tel"
              onBlur={e => handlePhoneBlur(e.target.value)}
              suffix={
                <Button
                  type="link"
                  size="small"
                  loading={checkingDuplicate}
                  onClick={handleCheckDuplicate}
                  icon={<SearchOutlined />}
                >
                  查重
                </Button>
              }
            />
          </Form.Item>

          <div className="m-row-2">
            <Form.Item name="咨询者姓名" label="姓名">
              <Input placeholder="姓名" />
            </Form.Item>
            <Form.Item name="性别" label="性别">
              <Radio.Group>
                <Radio value="男">男</Radio>
                <Radio value="女">女</Radio>
              </Radio.Group>
            </Form.Item>
          </div>

          <div className="m-row-3">
            <Form.Item name="年龄" label="年龄">
              <Input placeholder="年龄" inputMode="numeric" />
            </Form.Item>
            <Form.Item name="状态" label="状态">
              <Select placeholder="状态" allowClear>
                {statusOptions.map(o => <Select.Option key={o} value={o}>{o}</Select.Option>)}
              </Select>
            </Form.Item>
            <Form.Item name="学历" label="学历">
              <Select placeholder="学历" allowClear>
                {educationOptions.map(o => <Select.Option key={o} value={o}>{o}</Select.Option>)}
              </Select>
            </Form.Item>
          </div>
        </div>

        {/* ========= 来源信息 ========= */}
        <div className="m-section">
          <div className="m-section-title">来源信息</div>

          <div className="m-row-3">
            <Form.Item name="量来源" label="量来源">
              <Select
                placeholder="来源"
                allowClear
                onChange={v => {
                  setSelectedCategory(v); setSelectedSource(null)
                  form.setFieldsValue({ 来源类别: undefined, 媒体来源: undefined })
                }}
              >
                {sourceOptions.map(o => <Select.Option key={o} value={o}>{o}</Select.Option>)}
              </Select>
            </Form.Item>
            <Form.Item name="来源类别" label="来源类别">
              <Select
                placeholder="类别"
                allowClear
                disabled={!selectedCategory}
                onChange={v => { setSelectedSource(v); form.setFieldsValue({ 媒体来源: undefined }) }}
              >
                {level2Options.map(n => <Select.Option key={n.name} value={n.name}>{n.name}</Select.Option>)}
              </Select>
            </Form.Item>
            <Form.Item name="媒体来源" label="具体来源">
              <Select placeholder="具体来源" allowClear showSearch disabled={!selectedSource}>
                {level3Options.map(o => <Select.Option key={o} value={o}>{o}</Select.Option>)}
              </Select>
            </Form.Item>
          </div>

          {/* 条件字段 */}
          {(selectedCategory === '口碑' || selectedCategory === '神殿新媒体') && (
            <Form.Item
              name="口碑提供人"
              label={selectedCategory === '神殿新媒体' ? '新媒体介绍人' : '口碑提供人'}
            >
              <Input placeholder="姓名" />
            </Form.Item>
          )}
          {selectedCategory === '渠道' && (
            <div className="m-row-3">
              <Form.Item name="县办" label="县办">
                <Input placeholder="县办" />
              </Form.Item>
              <Form.Item name="乡办" label="乡办">
                <Input placeholder="乡办" />
              </Form.Item>
              <Form.Item name="信息员" label="信息员">
                <Input placeholder="信息员" />
              </Form.Item>
            </div>
          )}
          {selectedCategory === '渠道' && (
            <div className="m-row-2">
              <Form.Item name="渠道专员" label="渠道专员">
                <Select placeholder="选择" allowClear showSearch optionFilterProp="children">
                  {channelStaffOptions.map(n => <Select.Option key={n} value={n}>{n}</Select.Option>)}
                </Select>
              </Form.Item>
            </div>
          )}

          <div className="m-row-2">
            <Form.Item name="咨询类别" label="咨询类别">
              <Select placeholder="类别" allowClear>
                {categoryOptions.map(o => <Select.Option key={o} value={o}>{o}</Select.Option>)}
              </Select>
            </Form.Item>
            <Form.Item name="报名意向" label="报名意向">
              <Select placeholder="意向" allowClear>
                {intentionOptions.map(o => <Select.Option key={o} value={o}>{o}</Select.Option>)}
              </Select>
            </Form.Item>
          </div>

          <Form.Item name="关键字" label="关键字">
            <Input placeholder="关键字" />
          </Form.Item>
        </div>

        {/* ========= 分配信息 ========= */}
        <div className="m-section">
          <div className="m-section-title">分配信息</div>
          <div className="m-row-2">
            <Form.Item name="咨询师" label="咨询师">
              <Select placeholder="选择咨询师" allowClear showSearch optionFilterProp="children">
                {consultantOptions.map(o => <Select.Option key={o} value={o}>{o}</Select.Option>)}
              </Select>
            </Form.Item>
            <Form.Item name="分量人" label="分量人">
              <Input placeholder="分量人" />
            </Form.Item>
          </div>
          <Form.Item
            name="登记日期"
            label="登记日期"
            rules={[{ required: true, message: '请选择日期' }]}
          >
            <DatePicker showTime format="MM-DD HH:mm:ss" style={{ width: '100%' }} />
          </Form.Item>
        </div>

        {/* ========= 更多信息（折叠） ========= */}
        <Collapse
          ghost
          className="m-collapse"
          items={[{
            key: 'more',
            label: '更多联系方式 & 备注',
            children: (
              <>
                <div className="m-row-2">
                  <Form.Item name="第二电话" label="第二电话">
                    <Input placeholder="电话2" inputMode="tel" />
                  </Form.Item>
                  <Form.Item
                    name="微信"
                    label="微信"
                    dependencies={['电话']}
                    rules={[({ getFieldValue }) => ({
                      validator(_, v) {
                        if (!v && !getFieldValue('电话')) return Promise.reject('请输入微信或电话')
                        return Promise.resolve()
                      },
                    })]}
                  >
                    <Input placeholder="微信" />
                  </Form.Item>
                </div>
                <div className="m-row-3">
                  <Form.Item name="QQ" label="QQ"><Input placeholder="QQ" /></Form.Item>
                  <Form.Item name="抖音" label="抖音"><Input placeholder="抖音" /></Form.Item>
                  <Form.Item name="快手" label="快手"><Input placeholder="快手" /></Form.Item>
                </div>
                <Form.Item name="位置" label="家庭住址">
                  <Input
                    placeholder={fetchingLocation ? '查询中...' : '住址'}
                    suffix={locationInfo ? <EnvironmentOutlined style={{ color: '#52c41a' }} /> : undefined}
                  />
                </Form.Item>
                <Form.Item name="网聊专员" label="网聊专员">
                  <Input placeholder="网聊专员" />
                </Form.Item>
                <div className="m-row-2">
                  <Form.Item name="咨询次数" label="咨询次数">
                    <InputNumber min={1} style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item name="代咨" label="代咨">
                    <Input placeholder="代咨人" />
                  </Form.Item>
                </div>
                <Form.Item name="咨询结果" label="咨询结果">
                  <Input placeholder="咨询结果" />
                </Form.Item>
                <Form.Item name="备注" label="备注">
                  <TextArea placeholder="备注" autoSize={{ minRows: 2, maxRows: 4 }} />
                </Form.Item>
              </>
            ),
          }]}
        />

        {/* ========= 标记 ========= */}
        <Collapse
          ghost
          className="m-collapse"
          items={[{
            key: 'marks',
            label: '标记与追踪',
            children: (
              <>
                <Space wrap size="middle" style={{ marginBottom: 12 }}>
                  <Form.Item name="是否无效量" valuePropName="checked" noStyle><Checkbox>无效量</Checkbox></Form.Item>
                  <Form.Item name="是否不算量" valuePropName="checked" noStyle><Checkbox>不算量</Checkbox></Form.Item>
                  <Form.Item name="是否上门" valuePropName="checked" noStyle><Checkbox>上门</Checkbox></Form.Item>
                  <Form.Item name="是否报名" valuePropName="checked" noStyle><Checkbox>报名</Checkbox></Form.Item>
                  <Form.Item name="是否订座" valuePropName="checked" noStyle><Checkbox>订座</Checkbox></Form.Item>
                  <Form.Item name="是否校园量" valuePropName="checked" noStyle><Checkbox>校园量</Checkbox></Form.Item>
                </Space>

                <Form.Item name="无效原因" label="无效原因"><Input placeholder="无效原因" /></Form.Item>
                <Form.Item name="不算量原因" label="不算量原因"><Input placeholder="不算量原因" /></Form.Item>
                <div className="m-row-2">
                  <Form.Item name="地区" label="地区"><Input placeholder="地区" /></Form.Item>
                  <Form.Item name="县" label="县"><Input placeholder="县" /></Form.Item>
                </div>
                <Form.Item name="目前状态" label="目前状态"><Input placeholder="目前状态" /></Form.Item>
                <Form.Item name="上门时间" label="上门时间">
                  <DatePicker showTime format="MM-DD HH:mm" style={{ width: '100%' }} />
                </Form.Item>

                {/* 报名相关 */}
                <Form.Item noStyle shouldUpdate={(p, c) => p.是否报名 !== c.是否报名}>
                  {({ getFieldValue }) =>
                    getFieldValue('是否报名') ? (
                      <>
                        <Divider orientation="left" plain>报名信息</Divider>
                        <Form.Item name="报名时间" label="报名时间">
                          <DatePicker showTime format="MM-DD HH:mm" style={{ width: '100%' }} />
                        </Form.Item>
                        <div className="m-row-2">
                          <Form.Item name="就读学校" label="就读学校"><Input placeholder="学校" /></Form.Item>
                          <Form.Item name="报名专业" label="专业"><Input placeholder="专业" /></Form.Item>
                        </div>
                        <div className="m-row-2">
                          <Form.Item name="长期短期" label="学制">
                            <Select placeholder="学制" allowClear>
                              <Select.Option value="长期">长期</Select.Option>
                              <Select.Option value="短期">短期</Select.Option>
                              <Select.Option value="两年制">两年制</Select.Option>
                              <Select.Option value="三年制">三年制</Select.Option>
                            </Select>
                          </Form.Item>
                          <Form.Item name="课程" label="课程"><Input placeholder="课程" /></Form.Item>
                        </div>
                        <Space wrap>
                          <Form.Item name="全款" valuePropName="checked" noStyle><Checkbox>全款</Checkbox></Form.Item>
                          <Form.Item name="分期" valuePropName="checked" noStyle><Checkbox>分期</Checkbox></Form.Item>
                          <Form.Item name="注册" valuePropName="checked" noStyle><Checkbox>注册</Checkbox></Form.Item>
                          <Form.Item name="贷款" valuePropName="checked" noStyle><Checkbox>贷款</Checkbox></Form.Item>
                        </Space>
                        <Form.Item name="详细地址" label="详细地址"><Input placeholder="详细地址" /></Form.Item>
                      </>
                    ) : null
                  }
                </Form.Item>

                {/* 订座相关 */}
                <Form.Item noStyle shouldUpdate={(p, c) => p.是否订座 !== c.是否订座}>
                  {({ getFieldValue }) =>
                    getFieldValue('是否订座') ? (
                      <>
                        <Divider orientation="left" plain>订座信息</Divider>
                        <div className="m-row-2">
                          <Form.Item name="订座时间" label="订座时间">
                            <DatePicker showTime format="MM-DD HH:mm" style={{ width: '100%' }} />
                          </Form.Item>
                          <Form.Item name="订座金额" label="金额">
                            <InputNumber min={0} style={{ width: '100%' }} />
                          </Form.Item>
                        </div>
                      </>
                    ) : null
                  }
                </Form.Item>
              </>
            ),
          }]}
        />

        {/* ========= 提交按钮 ========= */}
        <div className="m-submit-bar">
          <Button block type="primary" htmlType="submit" loading={loading} icon={<PlusOutlined />} size="large">
            录入咨询量
          </Button>
        </div>
      </Form>

      {/* 重量弹窗 */}
      <Modal
        title={<><WarningOutlined style={{ color: '#ff4d4f' }} /> {duplicateInfo?.重量类型 === '微信重复' ? '微信号已存在' : '电话已存在'}</>}
        open={showDuplicateModal}
        onCancel={() => setShowDuplicateModal(false)}
        footer={<Button type="primary" onClick={() => setShowDuplicateModal(false)}>知道了</Button>}
        width="90vw"
        centered
      >
        {duplicateInfo && (
          <>
            <Alert
              type="error"
              message={`${duplicateInfo.重量类型 === '微信重复' ? '微信号' : '电话号码'}重复，已有 ${duplicateInfo.咨询次数} 次咨询，不允许重复录入${duplicateInfo.重量神殿 ? `（重量神殿：${duplicateInfo.重量神殿}）` : ''}`}
              style={{ marginBottom: 12 }}
            />
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="对象 ID">{duplicateInfo.对象ID}</Descriptions.Item>
              <Descriptions.Item label="重复类型">
                <Tag color={duplicateInfo.重量类型 === '微信重复' ? 'blue' : 'red'}>{duplicateInfo.重量类型 || '电话重复'}</Tag>
              </Descriptions.Item>
              {duplicateInfo.重量神殿 && (
                <Descriptions.Item label="所属神殿">
                  <Tag color="volcano">{duplicateInfo.重量神殿}</Tag>
                </Descriptions.Item>
              )}
              {duplicateInfo.重量微信 && (
                <Descriptions.Item label="重复微信号">
                  <Tag color="blue">{duplicateInfo.重量微信}</Tag>
                </Descriptions.Item>
              )}
              {duplicateInfo.电话列表 && duplicateInfo.电话列表.length > 0 && (
                <Descriptions.Item label="电话">
                  {duplicateInfo.电话列表.map(p => <Tag key={p} color="red">{p}</Tag>)}
                </Descriptions.Item>
              )}
              {duplicateInfo.最新咨询信息 && (
                <>
                  <Descriptions.Item label="姓名">{duplicateInfo.最新咨询信息.咨询者姓名}</Descriptions.Item>
                  <Descriptions.Item label="咨询师">{duplicateInfo.最新咨询信息.咨询师}</Descriptions.Item>
                  <Descriptions.Item label="日期">{duplicateInfo.最新咨询信息.登记日期}</Descriptions.Item>
                </>
              )}
            </Descriptions>
          </>
        )}
      </Modal>
    </div>
  )
}
