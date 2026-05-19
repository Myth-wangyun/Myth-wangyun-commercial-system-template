/**
 * 咨询量录入表单组件
 */

import React, { useState, useEffect, useCallback } from 'react'
import {
  App,
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Space,
  Modal,
  Card,
  Row,
  Col,
  Tag,
  Descriptions,
  Alert,
  Checkbox,
  Divider,
  Radio,
  Tooltip,
  InputNumber,
} from 'antd'
import { PlusOutlined, SearchOutlined, WarningOutlined, EnvironmentOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import type { CreateConsultationRequest, DuplicateCheckResponse, ConsultationRecord, MediaHierarchyNode } from './types'
import * as api from './api'
import { getConsultantNames } from '@/services/consult/consultantList'
import { getPhoneLocation } from '@/services/consult/phoneLocation'
import { useCampusStore } from '@/stores/campusStore'

const { TextArea } = Input

/**
 * 神殿选择器组件 - 联动全局神殿选择器
 * 选择神殿时会同步更新左上角的全局神殿选择器
 */
function CampusSelect({ value, onChange }: { value?: string; onChange?: (value: string) => void }) {
  const { campuses, setCampus, currentCampus } = useCampusStore()
  
  const handleChange = (newValue: string) => {
    // 更新表单值
    onChange?.(newValue)
    // 同步更新全局神殿选择器
    setCampus(newValue)
  }
  
  return (
    <Select
      value={value || currentCampus || undefined}
      onChange={handleChange}
      placeholder="选择神殿"
      style={{ width: '100%' }}
    >
      {campuses.map(c => (
        <Select.Option key={c.id} value={c.name}>
          {c.name}
        </Select.Option>
      ))}
    </Select>
  )
}

interface Props {
  onSuccess?: () => void
  initialData?: Partial<CreateConsultationRequest>
  campus?: string
}

export default function ConsultationForm({ onSuccess, initialData, campus }: Props) {
  const { message, notification } = App.useApp()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [checkingDuplicate, setCheckingDuplicate] = useState(false)
  const [duplicateInfo, setDuplicateInfo] = useState<DuplicateCheckResponse | null>(null)
  const [showDuplicateModal, setShowDuplicateModal] = useState(false)
  
  // 选项数据
  const [statusOptions, setStatusOptions] = useState<string[]>([])
  const [educationOptions, setEducationOptions] = useState<string[]>([])
  const [intentionOptions, setIntentionOptions] = useState<string[]>([])
  const [categoryOptions, setCategoryOptions] = useState<string[]>([])
  const [consultantOptions, setConsultantOptions] = useState<string[]>([])
  const [channelStaffOptions, setChannelStaffOptions] = useState<string[]>([])
  
  // 电话归属地查询状态
  const [fetchingLocation, setFetchingLocation] = useState(false)
  const [locationInfo, setLocationInfo] = useState<string | null>(null)
  
  // 媒体来源层级数据
  const [mediaHierarchy, setMediaHierarchy] = useState<MediaHierarchyNode[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedSource, setSelectedSource] = useState<string | null>(null)

  // 派生选项：量来源列表（从层级数据第一级）
  const sourceOptions = React.useMemo(() => {
    return mediaHierarchy.map(n => n.name)
  }, [mediaHierarchy])

  // 派生选项：来源类别（根据选中的量来源筛选）
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

  // 加载选项数据
  useEffect(() => {
    const loadOptions = async () => {
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
      } catch (error) {
        console.error('加载选项数据失败:', error)
      }
    }
    loadOptions()
  }, [])
  
  // 加载咨询师列表（根据神殿）
  useEffect(() => {
    const loadConsultants = async () => {
      try {
        const consultants = await getConsultantNames(campus)
        setConsultantOptions(consultants)
      } catch (error) {
        console.error('加载咨询师列表失败:', error)
      }
    }
    if (campus) {
      loadConsultants()
    }
  }, [campus])

  // 加载渠道专员列表（根据神殿）
  useEffect(() => {
    const loadChannelStaff = async () => {
      try {
        const staff = await api.getChannelStaffOptions(campus)
        setChannelStaffOptions(staff)
      } catch (error) {
        console.error('加载渠道专员列表失败:', error)
      }
    }
    loadChannelStaff()
  }, [campus])

  // 初始化表单
  useEffect(() => {
    if (initialData) {
      form.setFieldsValue({
        ...initialData,
        登记日期: initialData.登记日期 ? dayjs(initialData.登记日期) : dayjs(),
      })
    } else {
      form.setFieldsValue({
        登记日期: dayjs(),
        神殿: campus,
      })
    }
  }, [initialData, campus, form])

  // 登记日期实时更新
  useEffect(() => {
    // 只在新建模式下（没有initialData）更新登记日期
    if (!initialData) {
      const timer = setInterval(() => {
        form.setFieldValue('登记日期', dayjs())
      }, 1000) // 每秒更新一次

      return () => clearInterval(timer)
    }
  }, [initialData, form])

  // 查询电话归属地并自动填充
  const handlePhoneLocationLookup = useCallback(async (phone: string) => {
    // 清理电话号码，只保留数字
    const cleanPhone = phone.replace(/\D/g, '')
    
    // 只有当电话号码长度足够时才查询（至少7位）
    if (cleanPhone.length < 7) {
      setLocationInfo(null)
      return
    }
    
    // 如果位置字段已有值，不自动覆盖
    const currentLocation = form.getFieldValue('位置')
    if (currentLocation && currentLocation.trim()) {
      return
    }
    
    setFetchingLocation(true)
    try {
      const result = await getPhoneLocation(cleanPhone)
      if (result.success && result.location) {
        form.setFieldValue('位置', result.location)
        setLocationInfo(`${result.location}${result.carrier ? ` (${result.carrier})` : ''}`)
      } else {
        setLocationInfo(null)
      }
    } catch (error) {
      console.error('查询归属地失败:', error)
      setLocationInfo(null)
    } finally {
      setFetchingLocation(false)
    }
  }, [form])

  // 检查重量
  const handleCheckDuplicate = async () => {
    const phone = form.getFieldValue('电话')
    const secondPhone = form.getFieldValue('第二电话')
    const weixin = form.getFieldValue('微信')
    
    if (!phone && !weixin) {
      message.warning('请先输入电话号码或微信号')
      return
    }
    
    setCheckingDuplicate(true)
    try {
      const result = await api.checkDuplicate(phone || '', secondPhone, weixin)
      setDuplicateInfo(result)
      
      if (result.是否重量) {
        setShowDuplicateModal(true)
      } else {
        message.success('未发现重量，可以录入')
      }
    } catch (error) {
      message.error('重量检查失败')
    } finally {
      setCheckingDuplicate(false)
    }
  }

  // 提交表单
  const handleSubmit = async (values: any) => {
    // 获取电话号码
    const phone = values.电话?.trim()
    const secondPhone = values.第二电话?.trim()
    const weixin = values.微信?.trim()
    
    // 如果没有电话也没有微信，提示用户
    if (!phone && !secondPhone && !weixin) {
      message.warning('请至少输入一个联系方式（电话、第二电话或微信）')
      return
    }
    
    setLoading(true)
    try {
      // 检查重复（电话联合查重 + 微信单独查重）
      if (phone || secondPhone || weixin) {
        const duplicateResult = await api.checkDuplicate(phone || '', secondPhone || '', weixin || '')
        if (duplicateResult.是否重量) {
          setDuplicateInfo(duplicateResult)
          setShowDuplicateModal(true)
          setLoading(false)
          return // 阻止录入
        }
      }
      
      // 如果没有选择具体来源（Level 3），但选了来源类别（Level 2），则用来源类别作为媒体来源
      if (!values.媒体来源 && values.来源类别) {
        values.媒体来源 = values.来源类别
      }
      
      // 处理checkbox值转换
      const data: CreateConsultationRequest = {
        ...values,
        登记日期: values.登记日期?.toISOString(),
        神殿: campus || values.神殿,
        // 标记字段转换
        是否无效量: values.是否无效量 ? 1 : 0,
        是否不算量: values.是否不算量 ? 1 : 0,
        是否上门: values.是否上门 ? 1 : 0,
        是否报名: values.是否报名 ? 1 : 0,
        是否订座: values.是否订座 ? 1 : 0,
        是否校园量: values.是否校园量 ? 1 : 0,
        上门时间: values.上门时间?.toISOString(),
        报名时间: values.报名时间?.toISOString(),
        // 报名相关字段
        长期短期: values.长期短期,
        课程: values.课程,
        全款: values.全款 ? 1 : 0,
        分期: values.分期 ? 1 : 0,
        分期备注: values.分期备注 || null,
        注册: values.注册 ? 1 : 0,
        贷款: values.贷款 ? 1 : 0,
        详细地址: values.详细地址,
        // 订座相关字段
        订座时间: values.订座时间?.toISOString(),
        订座金额: values.订座金额 || 0,
      }
      
      const result = await api.createConsultationRecord(data)
      
      notification.success({ message: '录入成功', description: '咨询量已成功录入系统', placement: 'topRight', duration: 3 })
      
      form.resetFields()
      form.setFieldsValue({
        登记日期: dayjs(),
        神殿: campus,
      })
      setDuplicateInfo(null)
      onSuccess?.()
    } catch (error: any) {
      notification.error({ message: '录入失败', description: error.response?.data?.detail || '请检查网络连接或联系管理员', placement: 'topRight', duration: 4 })
    } finally {
      setLoading(false)
    }
  }

  // 关闭重复提示弹窗
  const handleCloseDuplicateModal = () => {
    setShowDuplicateModal(false)
  }

  // 报名意向与是否报名联动
  const handleSignupLinkage = (changedValues: Record<string, any>, allValues: Record<string, any>) => {
    if ('报名意向' in changedValues) {
      const intention = allValues['报名意向']
      const isSignup = !!allValues['是否报名']
      if (intention === '已报名' && !isSignup) {
        form.setFieldsValue({ 是否报名: true })
      } else if (intention !== '已报名' && isSignup) {
        form.setFieldsValue({ 是否报名: false })
      }
    }

    if ('是否报名' in changedValues) {
      const isSignup = !!allValues['是否报名']
      const intention = allValues['报名意向']
      if (isSignup && intention !== '已报名') {
        form.setFieldsValue({ 报名意向: '已报名' })
      } else if (!isSignup && intention === '已报名') {
        form.setFieldsValue({ 报名意向: undefined })
      }
    }
  }

  return (
    <Card title="咨询量录入" className="consultation-form">
      {duplicateInfo?.是否重量 && (
        <Alert
          type="warning"
          icon={<WarningOutlined />}
          message={
            <span>
              检测到重量！该电话已有 <Tag color="orange">{duplicateInfo.咨询次数}</Tag> 次咨询记录
              {duplicateInfo.重量神殿 && (
                <>
                  (所属神殿：<Tag color="red">{duplicateInfo.重量神殿}</Tag>)
                </>
              )}
            </span>
          }
          style={{ marginBottom: 16 }}
          showIcon
        />
      )}
      
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        onValuesChange={handleSignupLinkage}
        initialValues={{
          登记日期: dayjs(),
          神殿: campus,
        }}
        size="small"
      >
        <Card size="small" style={{ marginBottom: 12 }}>
          <Row gutter={8}>
            {/* 电话（有微信时可选） */}
            <Col span={3}>
              <Form.Item
                name="电话"
                label="电话"
                dependencies={['微信']}
                rules={[
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const weixin = getFieldValue('微信')
                      if (!value && !weixin) {
                        return Promise.reject(new Error('请输入电话或微信'))
                      }
                      return Promise.resolve()
                    },
                  }),
                ]}
              >
                <Input
                  placeholder="电话号码"
                  onChange={() => form.validateFields(['微信'])}
                  onBlur={(e) => handlePhoneLocationLookup(e.target.value)}
                  addonAfter={
                    <Tooltip title={locationInfo || '输入电话后自动查询归属地'}>
                      <Button
                        type="link"
                        size="small"
                        icon={fetchingLocation ? <EnvironmentOutlined spin /> : <SearchOutlined />}
                        loading={checkingDuplicate}
                        onClick={handleCheckDuplicate}
                        style={{ padding: 0 }}
                      >
                        查重
                      </Button>
                    </Tooltip>
                  }
                />
              </Form.Item>
            </Col>
            
            {/* 咨询者姓名 */}
            <Col span={2}>
              <Form.Item name="咨询者姓名" label="姓名">
                <Input placeholder="姓名" />
              </Form.Item>
            </Col>

            {/* 性别 */}
            <Col span={3}>
              <Form.Item name="性别" label="性别">
                <Radio.Group>
                  <Radio value="男">男</Radio>
                  <Radio value="女">女</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>
            
            {/* 年龄 */}
            <Col span={2}>
              <Form.Item name="年龄" label="年龄">
                <Input placeholder="23" />
              </Form.Item>
            </Col>

             {/* 状态 */}
            <Col span={2}>
              <Form.Item name="状态" label="状态">
                <Select placeholder="状态" allowClear>
                  {statusOptions.map(opt => (
                    <Select.Option key={opt} value={opt}>{opt}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            {/* 学历 */}
            <Col span={2}>
              <Form.Item name="学历" label="学历">
                <Select placeholder="学历" allowClear>
                  {educationOptions.map(opt => (
                    <Select.Option key={opt} value={opt}>{opt}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            {/* 神殿 - 联动全局神殿选择器 */}
            <Col span={3}>
              <Form.Item name="神殿" label="神殿">
                <CampusSelect />
              </Form.Item>
            </Col>

            {/* 按钮 */}
            <Col span={3}>
               <Form.Item label=" " colon={false}>
                <Space>
                  <Button type="primary" htmlType="submit" loading={loading} icon={<PlusOutlined />}>
                    录入
                  </Button>
                  <Button onClick={() => form.resetFields()}>
                    重置
                  </Button>
                </Space>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={8}>
            {/* 量来源 */}
            <Col span={3}>
              <Form.Item name="量来源" label="量来源">
                <Select 
                  placeholder="来源" 
                  allowClear
                  onChange={(val) => {
                    setSelectedCategory(val)
                    setSelectedSource(null)
                    form.setFieldsValue({ '来源类别': undefined, '媒体来源': undefined })
                  }}
                >
                  {sourceOptions.map(opt => (
                    <Select.Option key={opt} value={opt}>{opt}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            {/* 来源类别 */}
            <Col span={3}>
              <Form.Item name="来源类别" label="来源类别">
                <Select 
                  placeholder="类别" 
                  allowClear
                  onChange={(val) => {
                    setSelectedSource(val)
                    form.setFieldsValue({ '媒体来源': undefined })
                  }}
                  disabled={!selectedCategory}
                >
                  {level2Options.map(node => (
                    <Select.Option key={node.name} value={node.name}>{node.name}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            
            {/* 具体来源 */}
            <Col span={3}>
              <Form.Item name="媒体来源" label="具体来源">
                <Select 
                  placeholder="具体来源" 
                  allowClear 
                  showSearch
                  disabled={!selectedSource}
                >
                  {level3Options.map(opt => (
                    <Select.Option key={opt} value={opt}>{opt}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            {/* 口碑提供人/新媒体介绍人（当量来源为口碑或神殿新媒体时显示） */}
            {(selectedCategory === '口碑' || selectedCategory === '神殿新媒体') && (
              <Col span={3}>
                <Form.Item 
                  name="口碑提供人" 
                  label={selectedCategory === '神殿新媒体' ? '新媒体介绍人' : '口碑提供人'}
                >
                  <Input 
                    placeholder={selectedCategory === '神殿新媒体' ? '新媒体介绍人姓名' : '口碑提供人姓名'} 
                    maxLength={50} 
                  />
                </Form.Item>
              </Col>
            )}

            {/* 县办/乡办/信息员/渠道专员（当量来源为渠道时显示） */}
            {selectedCategory === '渠道' && (
              <>
                <Col span={3}>
                  <Form.Item name="县办" label="县办">
                    <Input placeholder="县办" maxLength={50} />
                  </Form.Item>
                </Col>
                <Col span={3}>
                  <Form.Item name="乡办" label="乡办">
                    <Input placeholder="乡办" maxLength={50} />
                  </Form.Item>
                </Col>
                <Col span={3}>
                  <Form.Item name="信息员" label="信息员">
                    <Input placeholder="信息员" maxLength={50} />
                  </Form.Item>
                </Col>
                <Col span={3}>
                  <Form.Item name="渠道专员" label="渠道专员">
                    <Select
                      placeholder="渠道专员姓名"
                      allowClear
                      showSearch
                      filterOption={(input, option) =>
                        (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase()) ?? false
                      }
                    >
                      {channelStaffOptions.map(name => (
                        <Select.Option key={name} value={name}>{name}</Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </>
            )}

            {/* 关键字 */}
            <Col span={(selectedCategory === '口碑' || selectedCategory === '神殿新媒体' || selectedCategory === '渠道') ? 3 : 4}>
              <Form.Item name="关键字" label="关键字">
                <Input placeholder="关键字" maxLength={50} />
              </Form.Item>
            </Col>

             {/* 咨询类别 */}
            <Col span={3}>
              <Form.Item name="咨询类别" label="咨询类别">
                <Select placeholder="类别" allowClear>
                  {categoryOptions.map(opt => (
                    <Select.Option key={opt} value={opt}>{opt}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            
            {/* 报名意向 */}
            <Col span={3}>
              <Form.Item name="报名意向" label="报名意向">
                <Select placeholder="意向" allowClear>
                  {intentionOptions.map(opt => (
                    <Select.Option key={opt} value={opt}>{opt}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            {/* 登记日期 */}
            <Col span={4}>
              <Form.Item
                name="登记日期"
                label="登记日期"
                rules={[{ required: true, message: '请选择登记日期' }]}
              >
                <DatePicker
                  showTime
                  format="MM-DD HH:mm:ss"
                  style={{ width: '100%' }}
                  placeholder="时间"
                />
              </Form.Item>
            </Col>
            
            {/* 分量人 */}
            <Col span={2}>
              <Form.Item name="分量人" label="分量人">
                <Input placeholder="分量" />
              </Form.Item>
            </Col>
            
            {/* 咨询师 */}
            <Col span={2}>
              <Form.Item name="咨询师" label="咨询师">
                <Select
                  placeholder="选择咨询师"
                  allowClear
                  showSearch
                  optionFilterProp="children"
                >
                  {consultantOptions.map(opt => (
                    <Select.Option key={opt} value={opt}>{opt}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={8}>
            {/* 第二电话 */}
            <Col span={3}>
              <Form.Item name="第二电话" label="第二电话">
                <Input placeholder="电话2" />
              </Form.Item>
            </Col>
            {/* QQ */}
            <Col span={3}>
              <Form.Item name="QQ" label="QQ">
                <Input placeholder="QQ" />
              </Form.Item>
            </Col>
            {/* 微信 */}
            <Col span={3}>
              <Form.Item 
                name="微信" 
                label="微信"
                dependencies={['电话']}
                rules={[
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const phone = getFieldValue('电话')
                      if (!value && !phone) {
                        return Promise.reject(new Error('请输入微信或电话'))
                      }
                      return Promise.resolve()
                    },
                  }),
                ]}
              >
                <Input placeholder="微信" onChange={() => form.validateFields(['电话'])} />
              </Form.Item>
            </Col>
            {/* 抖音 */}
            <Col span={3}>
              <Form.Item name="抖音" label="抖音">
                <Input placeholder="抖音" />
              </Form.Item>
            </Col>
            {/* 快手 */}
            <Col span={3}>
              <Form.Item name="快手" label="快手">
                <Input placeholder="快手" />
              </Form.Item>
            </Col>
             {/* 家庭住址 - 根据电话归属地自动填充 */}
            <Col span={4}>
              <Form.Item 
                name="位置" 
                label={
                  <Space size={4}>
                    <span>家庭住址</span>
                    {locationInfo && (
                      <Tooltip title={`电话归属: ${locationInfo}`}>
                        <EnvironmentOutlined style={{ color: '#52c41a', fontSize: 12 }} />
                      </Tooltip>
                    )}
                  </Space>
                }
              >
                <Input 
                  placeholder={fetchingLocation ? '查询归属地中...' : '住址（自动填充）'} 
                  suffix={fetchingLocation ? <EnvironmentOutlined spin style={{ color: '#1890ff' }} /> : null}
                />
              </Form.Item>
            </Col>
            {/* 网聊专员 */}
            <Col span={5}>
              <Form.Item name="网聊专员" label="网聊专员">
                <Input placeholder="网聊专员" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={8}>
            {/* 咨询次数 */}
            <Col span={2}>
              <Form.Item name="咨询次数" label="咨询次数">
                <InputNumber min={1} placeholder="次数" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            
            {/* 代咨 */}
            <Col span={3}>
              <Form.Item name="代咨" label="代咨">
                <Input placeholder="代咨人" />
              </Form.Item>
            </Col>

            {/* 咨询结果 */}
            <Col span={8}>
              <Form.Item name="咨询结果" label="咨询结果">
                <Input placeholder="咨询结果" />
              </Form.Item>
            </Col>

            {/* 备注 */}
            <Col span={8}>
              <Form.Item name="备注" label="备注">
                <Input.TextArea 
                  placeholder="备注信息" 
                  autoSize={{ minRows: 1, maxRows: 6 }}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* 下方折叠面板 - 标记与追踪 */}
        <Card size="small" title="标记与追踪" className="compact-card" bodyStyle={{ padding: '8px 12px' }}>
          <Row gutter={8} align="middle">
             <Col span={2}>
               <div style={{fontWeight: 'bold'}}>标记:</div>
             </Col>
             <Col span={22}>
               <Space size="large" wrap>
                  <Form.Item name="是否无效量" valuePropName="checked" noStyle><Checkbox>无效量</Checkbox></Form.Item>
                  <Form.Item name="是否不算量" valuePropName="checked" noStyle><Checkbox>不算量</Checkbox></Form.Item>
                  <Form.Item name="是否上门" valuePropName="checked" noStyle><Checkbox>上门</Checkbox></Form.Item>
                  <Form.Item name="是否报名" valuePropName="checked" noStyle><Checkbox>报名</Checkbox></Form.Item>
                  <Form.Item name="是否订座" valuePropName="checked" noStyle><Checkbox>订座</Checkbox></Form.Item>
                  <Form.Item name="是否校园量" valuePropName="checked" noStyle><Checkbox>校园量</Checkbox></Form.Item>
               </Space>
             </Col>
          </Row>
          
          <Divider style={{ margin: '8px 0' }} dashed />

          <Row gutter={8}>
            <Col span={4}>
               <Form.Item name="无效原因" label="无效原因" noStyle><Input placeholder="无效原因" size="small" prefix="无效:" /></Form.Item>
            </Col>
            <Col span={4}>
               <Form.Item name="不算量原因" label="不算量原因" noStyle><Input placeholder="不算量原因" size="small" prefix="不算:" /></Form.Item>
            </Col>
            <Col span={4}>
               <Form.Item name="地区" noStyle><Input placeholder="地区" size="small" prefix="地区:" /></Form.Item>
            </Col>
            <Col span={4}>
               <Form.Item name="县" noStyle><Input placeholder="县" size="small" prefix="县:" /></Form.Item>
            </Col>
             <Col span={8}>
               <Form.Item name="目前状态" noStyle><Input placeholder="目前状态" size="small" prefix="状态:" /></Form.Item>
            </Col>
          </Row>
          
          <div style={{ margin: '8px 0' }} />

          <Row gutter={8}>
             <Col span={4}>
               <Form.Item name="上门时间" label="上门时间" noStyle><DatePicker showTime format="MM-DD HH:mm" placeholder="上门时间" size="small" style={{width:'100%'}} /></Form.Item>
            </Col>
            <Col span={4}>
               <Form.Item name="地区" noStyle><Input placeholder="地区" size="small" prefix="地区:" /></Form.Item>
            </Col>
            <Col span={4}>
               <Form.Item name="县" noStyle><Input placeholder="县" size="small" prefix="县:" /></Form.Item>
            </Col>
             <Col span={8}>
               <Form.Item name="目前状态" noStyle><Input placeholder="目前状态" size="small" prefix="状态:" /></Form.Item>
            </Col>
          </Row>

          {/* 报名相关 - 仅在勾选是否报名时显示 */}
          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => 
              prevValues.是否报名 !== currentValues.是否报名
            }
          >
            {({ getFieldValue }) => 
              getFieldValue('是否报名') ? (
                <>
                  <Divider style={{ margin: '8px 0' }} dashed orientation="left">报名信息</Divider>
                  <Row gutter={8}>
                    <Col span={4}>
                      <Form.Item name="报名时间" noStyle><DatePicker showTime format="MM-DD HH:mm" placeholder="报名时间" size="small" style={{width:'100%'}} /></Form.Item>
                    </Col>
                    <Col span={4}>
                      <Form.Item name="就读学校" noStyle><Input placeholder="就读学校" size="small" /></Form.Item>
                    </Col>
                    <Col span={4}>
                      <Form.Item name="报名专业" noStyle><Input placeholder="报名专业" size="small" /></Form.Item>
                    </Col>
                    <Col span={4}>
                      <Form.Item name="咨询时间" noStyle><Input placeholder="咨询时间" size="small" /></Form.Item>
                    </Col>
                    <Col span={4}>
                      <Form.Item name="长期短期" noStyle>
                        <Select placeholder="报名学制" size="small" allowClear style={{width:'100%'}}>
                          <Select.Option value="长期">长期</Select.Option>
                          <Select.Option value="短期">短期</Select.Option>
                          <Select.Option value="两年制">两年制</Select.Option>
                          <Select.Option value="三年制">三年制</Select.Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={4}>
                      <Form.Item name="课程" noStyle><Input placeholder="课程" size="small" /></Form.Item>
                    </Col>
                  </Row>
                  <div style={{ margin: '4px 0' }} />
                  <Row gutter={8} align="middle">
                    <Col span={3}>
                      <Form.Item name="全款" noStyle valuePropName="checked"><Checkbox>全款</Checkbox></Form.Item>
                    </Col>
                    <Col span={3}>
                      <Form.Item name="分期" noStyle valuePropName="checked"><Checkbox>分期</Checkbox></Form.Item>
                    </Col>
                    <Col span={3}>
                      <Form.Item name="注册" noStyle valuePropName="checked"><Checkbox>注册</Checkbox></Form.Item>
                    </Col>
                    <Col span={3}>
                      <Form.Item name="贷款" noStyle valuePropName="checked"><Checkbox>贷款</Checkbox></Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="详细地址" noStyle><Input placeholder="详细地址" size="small" /></Form.Item>
                    </Col>
                  </Row>
                  {/* 分期备注 - 仅在勾选分期时显示 */}
                  <Form.Item
                    noStyle
                    shouldUpdate={(prevValues, currentValues) => 
                      prevValues.分期 !== currentValues.分期
                    }
                  >
                    {({ getFieldValue }) => 
                      getFieldValue('分期') ? (
                        <Row gutter={8} style={{ marginTop: 4 }}>
                          <Col span={24}>
                            <Form.Item name="分期备注" noStyle>
                              <Input placeholder="分期备注（如分期方式、期数等）" size="small" />
                            </Form.Item>
                          </Col>
                        </Row>
                      ) : null
                    }
                  </Form.Item>
                </>
              ) : null
            }
          </Form.Item>

          {/* 订座相关 - 仅在勾选是否订座时显示 */}
          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => 
              prevValues.是否订座 !== currentValues.是否订座
            }
          >
            {({ getFieldValue }) => 
              getFieldValue('是否订座') ? (
                <>
                  <Divider style={{ margin: '8px 0' }} dashed orientation="left">订座信息</Divider>
                  <Row gutter={8}>
                    <Col span={6}>
                      <Form.Item name="订座时间" noStyle><DatePicker showTime format="MM-DD HH:mm" placeholder="订座时间" size="small" style={{width:'100%'}} /></Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item name="订座金额" noStyle><InputNumber placeholder="订座金额" size="small" min={0} style={{width:'100%'}} /></Form.Item>
                    </Col>
                  </Row>
                </>
              ) : null
            }
          </Form.Item>
        </Card>




      </Form>

      {/* 重复号码提示弹窗 */}
      <Modal
        title={<span><WarningOutlined style={{ color: '#ff4d4f' }} /> {duplicateInfo?.重量类型 === '微信重复' ? '微信号已存在，不允许重复录入' : '电话号码已存在，不允许重复录入'}</span>}
        open={showDuplicateModal}
        onCancel={handleCloseDuplicateModal}
        footer={[
          <Button key="close" type="primary" onClick={handleCloseDuplicateModal}>
            知道了
          </Button>,
        ]}
        width={600}
      >
        {duplicateInfo && (
          <div>
            <Alert
              type="error"
              message={`${duplicateInfo.重量类型 === '微信重复' ? '微信号' : '电话号码'}与已有记录重复（已有 ${duplicateInfo.咨询次数} 次咨询），不允许重复录入！${duplicateInfo.重量神殿 ? `重量神殿：${duplicateInfo.重量神殿}` : ''}`}
              description={duplicateInfo.重量类型 === '微信重复' ? `微信号「${duplicateInfo.重量微信}」在数据库中已存在，每个微信号只能录入一次。` : '电话号码或第二电话在数据库中已存在，每个电话号码只能录入一次。'}
              style={{ marginBottom: 16 }}
            />
            
            <Descriptions title="已有咨询信息" bordered column={2} size="small">
              <Descriptions.Item label="对象ID">{duplicateInfo.对象ID}</Descriptions.Item>
              <Descriptions.Item label="咨询次数">{duplicateInfo.咨询次数}</Descriptions.Item>
              <Descriptions.Item label="重复类型" span={2}>
                <Tag color={duplicateInfo.重量类型 === '微信重复' ? 'blue' : 'red'}>{duplicateInfo.重量类型 || '电话重复'}</Tag>
              </Descriptions.Item>
              {duplicateInfo.重量神殿 && (
                <Descriptions.Item label="所属神殿" span={2}>
                  <Tag color="volcano">{duplicateInfo.重量神殿}</Tag>
                </Descriptions.Item>
              )}
              {duplicateInfo.重量微信 && (
                <Descriptions.Item label="重复微信号" span={2}>
                  <Tag color="blue">{duplicateInfo.重量微信}</Tag>
                </Descriptions.Item>
              )}
              {duplicateInfo.电话列表 && duplicateInfo.电话列表.length > 0 && (
                <Descriptions.Item label="已录入电话" span={2}>
                  {duplicateInfo.电话列表.map(p => (
                    <Tag key={p} color="red">{p}</Tag>
                  ))}
                </Descriptions.Item>
              )}
              {duplicateInfo.最新咨询信息 && (
                <>
                  <Descriptions.Item label="咨询者姓名">
                    {duplicateInfo.最新咨询信息.咨询者姓名}
                  </Descriptions.Item>
                  <Descriptions.Item label="状态">
                    {duplicateInfo.最新咨询信息.状态}
                  </Descriptions.Item>
                  <Descriptions.Item label="咨询师">
                    {duplicateInfo.最新咨询信息.咨询师}
                  </Descriptions.Item>
                  <Descriptions.Item label="登记日期">
                    {duplicateInfo.最新咨询信息.登记日期}
                  </Descriptions.Item>
                </>
              )}
            </Descriptions>
            
            <div style={{ marginTop: 16, color: '#ff4d4f' }}>
              {duplicateInfo.重量类型 === '微信重复' ? '请检查微信号是否正确，或联系管理员处理。' : '请检查电话号码是否正确，或联系管理员处理。'}
            </div>
          </div>
        )}
      </Modal>
    </Card>
  )
}
