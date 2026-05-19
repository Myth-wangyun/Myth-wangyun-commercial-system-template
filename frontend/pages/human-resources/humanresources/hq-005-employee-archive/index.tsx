import React, { useEffect, useMemo, useState } from 'react'
import {
  App,
  AutoComplete,
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Typography,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import dayjs, { type Dayjs } from 'dayjs'

import { useAuthStore } from '@/stores/authStore'
import {
  getEmployeeArchiveOptions,
  listEmployeeArchiveChangeLogs,
  listEmployeeArchives,
  type EmployeeArchiveChangeLogRecord,
  type EmployeeArchiveOptions,
  type EmployeeArchivePayload,
  type EmployeeArchiveRecord,
  updateEmployeeArchive,
} from '@/services/humanresources/employeeArchive'

const { Title, Text } = Typography

type FormValues = Omit<
  EmployeeArchivePayload,
  | 'entryDate'
  | 'contractSignDate'
  | 'contractEndDate'
  | 'birthDate'
  | 'baseSalary'
  | 'performanceSalary'
> & {
  entryDate?: Dayjs | null
  contractSignDate?: Dayjs | null
  contractEndDate?: Dayjs | null
  birthDate?: Dayjs | null
  baseSalary?: number | null
  performanceSalary?: number | null
}

const parseDate = (value?: string | null): Dayjs | null => (value ? dayjs(value) : null)
const formatDate = (value?: string | null) => (value ? dayjs(value).format('YYYY-MM-DD') : '-')
const formatDateTime = (value?: string | null) =>
  value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '-'
const formatMoney = (value?: number | null) => (value == null ? '-' : `¥${value}`)
const dateToValue = (value?: Dayjs | null) => (value ? value.format('YYYY-MM-DD') : null)
const POSITION_CATEGORY_OPTIONS = ['干部', '员工']
const POLITICAL_STATUS_OPTIONS = ['群众', '共青团员', '共产党员', '无党派人士', '其他']
const TITLE_NONE = '无'

const toValidBirthDate = (yearText: string, monthText: string, dayText: string): Dayjs | null => {
  const year = Number(yearText)
  const month = Number(monthText)
  const day = Number(dayText)
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null
  const date = new Date(year, month - 1, day)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null
  }
  return dayjs(date)
}

const extractBirthDateFromIdNumber = (value?: string | null): Dayjs | null => {
  const normalized = String(value || '')
    .trim()
    .toUpperCase()
  if (/^\d{17}[\dX]$/.test(normalized)) {
    return toValidBirthDate(
      normalized.slice(6, 10),
      normalized.slice(10, 12),
      normalized.slice(12, 14),
    )
  }
  if (/^\d{15}$/.test(normalized)) {
    return toValidBirthDate(
      `19${normalized.slice(6, 8)}`,
      normalized.slice(8, 10),
      normalized.slice(10, 12),
    )
  }
  return null
}

const formatChangeCell = (value?: string | null, fieldName?: string) => {
  if (!value) return '-'
  if (fieldName === 'base_salary' || fieldName === 'performance_salary') {
    return `¥${value}`
  }
  return value
}

const EditModal: React.FC<{
  open: boolean
  record: EmployeeArchiveRecord | null
  options: EmployeeArchiveOptions
  titleOptions: string[]
  changeLogs: EmployeeArchiveChangeLogRecord[]
  changeLogsLoading: boolean
  saving: boolean
  onCancel: () => void
  onOk: (userId: number, payload: EmployeeArchivePayload) => Promise<void>
}> = ({
  open,
  record,
  options,
  titleOptions,
  changeLogs,
  changeLogsLoading,
  saving,
  onCancel,
  onOk,
}) => {
  const [form] = Form.useForm<FormValues>()

  useEffect(() => {
    if (!open || !record) return
    form.setFieldsValue({
      name: record.name,
      department: record.department,
      position: record.position,
      phone: record.phone || undefined,
      gender: record.gender || undefined,
      entryDate: parseDate(record.entryDate),
      laborRelationCompany: record.laborRelationCompany || undefined,
      actualWorkCompany: record.actualWorkCompany || undefined,
      positionCategory: record.positionCategory || undefined,
      positionNature: undefined,
      ethnicity: record.ethnicity || undefined,
      nativePlace: record.nativePlace || undefined,
      contractSignDate: parseDate(record.contractSignDate),
      contractEndDate: parseDate(record.contractEndDate),
      idNumber: record.idNumber || undefined,
      birthDate: parseDate(record.birthDate),
      politicalStatus: record.politicalStatus || undefined,
      maritalStatus: record.maritalStatus || undefined,
      firstEducation: record.firstEducation || undefined,
      firstMajor: record.firstMajor || undefined,
      firstSchool: record.firstSchool || undefined,
      firstRemark: record.firstRemark || undefined,
      secondEducation: record.secondEducation || undefined,
      secondMajor: record.secondMajor || undefined,
      secondSchool: record.secondSchool || undefined,
      secondRemark: record.secondRemark || undefined,
      titleLevel: record.titleLevel || undefined,
      hukouAddress: record.hukouAddress || undefined,
      currentAddress: record.currentAddress || undefined,
      emergencyContactName: record.emergencyContactName || undefined,
      emergencyContactPhone: record.emergencyContactPhone || undefined,
      bankAccountName: record.bankAccountName || undefined,
      bankName: record.bankName || undefined,
      bankCardNumber: record.bankCardNumber || undefined,
      baseSalary: record.baseSalary ?? undefined,
      performanceSalary: record.performanceSalary ?? undefined,
      personnelChange: record.personnelChange || undefined,
      rewardWelfare: record.rewardWelfare || undefined,
      archiveRemark: record.archiveRemark || undefined,
    })
  }, [form, open, record])

  const syncBirthDateFromIdNumber = () => {
    const birthDate = extractBirthDateFromIdNumber(form.getFieldValue('idNumber'))
    if (!birthDate) return
    form.setFieldValue('birthDate', birthDate)
  }

  const changeLogColumns: ColumnsType<EmployeeArchiveChangeLogRecord> = [
    {
      title: '字段',
      dataIndex: 'fieldLabel',
      key: 'fieldLabel',
      width: 120,
    },
    {
      title: '变更前',
      dataIndex: 'oldValue',
      key: 'oldValue',
      width: 160,
      render: (value, item) => formatChangeCell(value, item.fieldName),
    },
    {
      title: '变更后',
      dataIndex: 'newValue',
      key: 'newValue',
      width: 160,
      render: (value, item) => formatChangeCell(value, item.fieldName),
    },
    {
      title: '来源',
      dataIndex: 'changeSourceLabel',
      key: 'changeSourceLabel',
      width: 130,
    },
    {
      title: '操作人',
      dataIndex: 'changedByName',
      key: 'changedByName',
      width: 120,
      render: (value) => value || '系统',
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: formatDateTime,
    },
  ]

  const submit = async () => {
    if (!record) return
    const values = await form.validateFields()
    await onOk(record.userId, {
      name: values.name,
      department: values.department,
      position: values.position,
      phone: values.phone,
      gender: values.gender,
      entryDate: dateToValue(values.entryDate),
      laborRelationCompany: values.laborRelationCompany,
      actualWorkCompany: values.actualWorkCompany,
      positionCategory: values.positionCategory,
      positionNature:
        record.canEditHrFields && record.positionNature === '停薪留职'
          ? (values.positionNature ?? null)
          : undefined,
      ethnicity: values.ethnicity,
      nativePlace: values.nativePlace,
      contractSignDate: dateToValue(values.contractSignDate),
      contractEndDate: dateToValue(values.contractEndDate),
      idNumber: values.idNumber,
      birthDate: dateToValue(values.birthDate),
      politicalStatus: values.politicalStatus,
      maritalStatus: values.maritalStatus,
      firstEducation: values.firstEducation,
      firstMajor: values.firstMajor,
      firstSchool: values.firstSchool,
      firstRemark: values.firstRemark,
      secondEducation: values.secondEducation,
      secondMajor: values.secondMajor,
      secondSchool: values.secondSchool,
      secondRemark: values.secondRemark,
      titleLevel: values.titleLevel,
      hukouAddress: values.hukouAddress,
      currentAddress: values.currentAddress,
      emergencyContactName: values.emergencyContactName,
      emergencyContactPhone: values.emergencyContactPhone,
      bankAccountName: values.bankAccountName,
      bankName: values.bankName,
      bankCardNumber: values.bankCardNumber,
      baseSalary: values.baseSalary ?? null,
      performanceSalary: values.performanceSalary ?? null,
      personnelChange: values.personnelChange,
      rewardWelfare: values.rewardWelfare,
      archiveRemark: values.archiveRemark,
    })
  }

  return (
    <Modal
      title={record ? `编辑员工档案 · ${record.name}` : '编辑员工档案'}
      open={open}
      onCancel={onCancel}
      onOk={submit}
      okText="保存"
      cancelText="取消"
      confirmLoading={saving}
      width={1180}
      destroyOnClose
      styles={{ body: { maxHeight: '72vh', overflowY: 'auto' } }}
    >
      <Form form={form} layout="vertical">
        <Card size="small" title="基础信息" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="laborRelationCompany" label="劳动关系所属公司">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="actualWorkCompany" label="实际工作所在公司">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="positionCategory" label="岗位类别">
                <Select
                  allowClear
                  options={POSITION_CATEGORY_OPTIONS.map((value) => ({ label: value, value }))}
                  placeholder="请选择岗位类别"
                />
              </Form.Item>
            </Col>
          </Row>
          {record?.canEditHrFields && record.positionNature === '停薪留职' ? (
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="positionNature"
                  label="岗位性质手动调整"
                  extra="停薪留职状态可手动恢复为正式。"
                >
                  <Select
                    allowClear
                    options={[{ label: '正式', value: '正式' }]}
                    placeholder="如需恢复，请选择正式"
                  />
                </Form.Item>
              </Col>
            </Row>
          ) : null}
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="department"
                label="部门"
                rules={[{ required: true, message: '请填写部门' }]}
              >
                <AutoComplete
                  options={options.departments.map((value) => ({ value }))}
                  filterOption
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="position"
                label="岗位"
                rules={[{ required: true, message: '请填写岗位' }]}
              >
                <AutoComplete
                  options={options.positions.map((value) => ({ value }))}
                  filterOption
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="name"
                label="姓名"
                rules={[{ required: true, message: '请填写姓名' }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="gender" label="性别">
                <Input />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="ethnicity" label="民族">
                <Input />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="phone"
                label="联系电话"
                rules={[{ required: true, message: '请填写联系电话' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="nativePlace"
                label="籍贯"
                extra="精确到市即可。"
                rules={[{ required: true, message: '请填写籍贯' }]}
              >
                <Input placeholder="如：石家庄市" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="entryDate"
                label="入职时间"
                rules={[{ required: true, message: '请选择入职时间' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="contractSignDate"
                label="劳动合同签订"
                rules={[{ required: true, message: '请选择劳动合同签订日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="contractEndDate"
                label="劳动合同终止"
                rules={[{ required: true, message: '请选择劳动合同终止日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Card size="small" title="个人资料信息" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="idNumber"
                label="身份证号"
                extra="填写完整身份证号后会自动带出出生日期。"
                rules={[
                  { required: true, message: '请填写身份证号' },
                  {
                    validator: (_, value) => {
                      if (!value) return Promise.resolve()
                      return extractBirthDateFromIdNumber(value)
                        ? Promise.resolve()
                        : Promise.reject(new Error('请输入15位或18位有效身份证号'))
                    },
                  },
                ]}
              >
                <Input onBlur={syncBirthDateFromIdNumber} maxLength={18} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="birthDate"
                label="出生日期"
                rules={[{ required: true, message: '请选择出生日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="politicalStatus" label="政治面貌">
                <Select
                  allowClear
                  options={POLITICAL_STATUS_OPTIONS.map((value) => ({ label: value, value }))}
                  placeholder="请选择政治面貌"
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="maritalStatus" label="婚姻状况">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="firstEducation" label="第一学历">
                <Input />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="firstMajor" label="所学专业">
                <Input />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="firstSchool" label="毕业院校">
                <Input />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="firstRemark" label="备注">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="secondEducation" label="第二学历" extra="选填，可不填。">
                <Input />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="secondMajor" label="所学专业">
                <Input />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="secondSchool" label="毕业院校">
                <Input />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="secondRemark" label="备注">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="titleLevel"
                label="职称"
                rules={[{ required: true, message: '请填写职称' }]}
              >
                <AutoComplete
                  options={titleOptions.map((value) => ({ value }))}
                  filterOption
                  placeholder="可选择已有职称，也可填写“无”"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="emergencyContactName" label="紧急联系人姓名">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="emergencyContactPhone" label="紧急联系人电话">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="bankAccountName" label="银行卡开户姓名">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="bankName" label="开户行">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="bankCardNumber" label="银行卡号">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="hukouAddress" label="户籍地址（同身份证住址）">
                <Input.TextArea rows={2} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="currentAddress" label="现住址（具体到门牌号）">
                <Input.TextArea rows={2} />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Card
          size="small"
          title="薪资与备注"
          extra={<Text type="secondary">保存后会自动追加基础薪资、绩效薪资、人事变动的变更记录</Text>}
        >
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="baseSalary" label="基础薪资">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="performanceSalary" label="绩效薪资">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="personnelChange" label="人事变动">
                <Input />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="rewardWelfare" label="奖励/福利">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="archiveRemark" label="备注">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Table<EmployeeArchiveChangeLogRecord>
            rowKey="id"
            size="small"
            bordered
            loading={changeLogsLoading}
            columns={changeLogColumns}
            dataSource={changeLogs}
            pagination={false}
            locale={{ emptyText: '暂无追加记录' }}
            scroll={{ x: 870, y: 220 }}
          />
        </Card>
      </Form>
    </Modal>
  )
}

interface EmployeeArchivePageProps {
  scope?: 'hq' | 'offline' | 'online'
  pageTitle?: string
}

interface TablePaginationState {
  current: number
  pageSize: number
}

const HqEmployeeArchive: React.FC<EmployeeArchivePageProps> = ({
  scope = 'hq',
  pageTitle = '最高议事厅核心数据看板-员工档案表',
}) => {
  const { message } = App.useApp()
  const currentUser = useAuthStore((state) => state.user)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [records, setRecords] = useState<EmployeeArchiveRecord[]>([])
  const [tablePagination, setTablePagination] = useState<TablePaginationState>({
    current: 1,
    pageSize: 20,
  })
  const [options, setOptions] = useState<EmployeeArchiveOptions>({
    departments: [],
    positions: [],
    positionCategories: ['干部', '员工'],
  })
  const [editingRecord, setEditingRecord] = useState<EmployeeArchiveRecord | null>(null)
  const [changeLogs, setChangeLogs] = useState<EmployeeArchiveChangeLogRecord[]>([])
  const [changeLogsLoading, setChangeLogsLoading] = useState(false)

  const loadData = async (searchKeyword?: string) => {
    setLoading(true)
    try {
      const list = await listEmployeeArchives(scope, {
        keyword: searchKeyword || undefined,
        includeInactive: true,
      })
      setRecords(list)
      setTablePagination((prev) => ({ ...prev, current: 1 }))
    } catch (error) {
      console.error(error)
      message.error('加载员工档案失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void getEmployeeArchiveOptions(scope)
      .then(setOptions)
      .catch((error) => {
        console.error(error)
      })
    loadData()
  }, [scope])

  useEffect(() => {
    if (!editingRecord) {
      setChangeLogs([])
      setChangeLogsLoading(false)
      return
    }

    let active = true
    setChangeLogsLoading(true)
    void listEmployeeArchiveChangeLogs(scope, editingRecord.userId)
      .then((items) => {
        if (!active) return
        setChangeLogs(items)
      })
      .catch((error) => {
        if (!active) return
        console.error(error)
        message.error('加载员工档案变更记录失败')
        setChangeLogs([])
      })
      .finally(() => {
        if (active) {
          setChangeLogsLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [editingRecord, message, scope])

  const filteredRecords = useMemo(() => {
    const normalized = keyword.trim().toLowerCase()
    if (!normalized) return records
    return records.filter((record) =>
      [
        record.name,
        record.department,
        record.position,
        record.phone,
        record.idNumber,
        record.laborRelationCompany,
        record.actualWorkCompany,
      ]
        .filter(Boolean)
        .some((item) => String(item).toLowerCase().includes(normalized)),
    )
  }, [keyword, records])

  const titleOptions = useMemo(() => {
    const values = new Set<string>([TITLE_NONE])
    records.forEach((record) => {
      const title = record.titleLevel?.trim()
      if (title) values.add(title)
    })
    return Array.from(values).sort((left, right) => {
      if (left === TITLE_NONE) return -1
      if (right === TITLE_NONE) return 1
      return left.localeCompare(right, 'zh-CN')
    })
  }, [records])

  const columns: ColumnsType<EmployeeArchiveRecord> = [
    {
      title: '序号',
      key: 'sequence',
      width: 80,
      fixed: 'left',
      align: 'center',
      render: (_value, _record, index) =>
        (tablePagination.current - 1) * tablePagination.pageSize + index + 1,
    },
    {
      title: '劳动关系所属公司',
      dataIndex: 'laborRelationCompany',
      key: 'laborRelationCompany',
      width: 150,
    },
    {
      title: '实际工作所在公司',
      dataIndex: 'actualWorkCompany',
      key: 'actualWorkCompany',
      width: 150,
    },
    { title: '部门', dataIndex: 'department', key: 'department', width: 100 },
    { title: '岗位', dataIndex: 'position', key: 'position', width: 120 },
    { title: '岗位类别', dataIndex: 'positionCategory', key: 'positionCategory', width: 90 },
    { title: '姓名', dataIndex: 'name', key: 'name', width: 100 },
    { title: '性别', dataIndex: 'gender', key: 'gender', width: 70, align: 'center' },
    { title: '民族', dataIndex: 'ethnicity', key: 'ethnicity', width: 90 },
    { title: '联系电话', dataIndex: 'phone', key: 'phone', width: 120 },
    { title: '籍贯', dataIndex: 'nativePlace', key: 'nativePlace', width: 120 },
    { title: '入职时间', dataIndex: 'entryDate', key: 'entryDate', width: 110, render: formatDate },
    {
      title: '劳动合同签订',
      dataIndex: 'contractSignDate',
      key: 'contractSignDate',
      width: 120,
      render: formatDate,
    },
    {
      title: '劳动合同终止',
      dataIndex: 'contractEndDate',
      key: 'contractEndDate',
      width: 120,
      render: formatDate,
    },
    {
      title: '五险缴纳时间',
      dataIndex: 'insuranceStartDate',
      key: 'insuranceStartDate',
      width: 120,
      render: formatDate,
    },
    { title: '岗位性质', dataIndex: 'positionNature', key: 'positionNature', width: 100 },
    { title: '离职时间', dataIndex: 'leaveDate', key: 'leaveDate', width: 110, render: formatDate },
    { title: '身份证号', dataIndex: 'idNumber', key: 'idNumber', width: 190 },
    { title: '出生日期', dataIndex: 'birthDate', key: 'birthDate', width: 110, render: formatDate },
    { title: '政治面貌', dataIndex: 'politicalStatus', key: 'politicalStatus', width: 100 },
    { title: '婚姻状况', dataIndex: 'maritalStatus', key: 'maritalStatus', width: 100 },
    { title: '第一学历', dataIndex: 'firstEducation', key: 'firstEducation', width: 100 },
    { title: '所学专业', dataIndex: 'firstMajor', key: 'firstMajor', width: 120 },
    { title: '毕业院校', dataIndex: 'firstSchool', key: 'firstSchool', width: 140 },
    { title: '备注', dataIndex: 'firstRemark', key: 'firstRemark', width: 110 },
    { title: '第二学历', dataIndex: 'secondEducation', key: 'secondEducation', width: 100 },
    { title: '所学专业', dataIndex: 'secondMajor', key: 'secondMajor', width: 120 },
    { title: '毕业院校', dataIndex: 'secondSchool', key: 'secondSchool', width: 140 },
    { title: '备注', dataIndex: 'secondRemark', key: 'secondRemark', width: 110 },
    { title: '职称', dataIndex: 'titleLevel', key: 'titleLevel', width: 120 },
    {
      title: '户籍地址（同身份证住址）',
      dataIndex: 'hukouAddress',
      key: 'hukouAddress',
      width: 220,
    },
    {
      title: '现住址（具体到门牌号）',
      dataIndex: 'currentAddress',
      key: 'currentAddress',
      width: 240,
    },
    {
      title: '紧急联系人姓名',
      dataIndex: 'emergencyContactName',
      key: 'emergencyContactName',
      width: 140,
    },
    {
      title: '紧急联系人电话',
      dataIndex: 'emergencyContactPhone',
      key: 'emergencyContactPhone',
      width: 160,
    },
    { title: '银行卡开户姓名', dataIndex: 'bankAccountName', key: 'bankAccountName', width: 150 },
    { title: '开户行', dataIndex: 'bankName', key: 'bankName', width: 180 },
    { title: '银行卡号', dataIndex: 'bankCardNumber', key: 'bankCardNumber', width: 180 },
    {
      title: '基础薪资',
      dataIndex: 'baseSalary',
      key: 'baseSalary',
      width: 120,
      render: formatMoney,
    },
    {
      title: '绩效薪资',
      dataIndex: 'performanceSalary',
      key: 'performanceSalary',
      width: 120,
      render: formatMoney,
    },
    { title: '人事变动', dataIndex: 'personnelChange', key: 'personnelChange', width: 140 },
    { title: '奖励/福利', dataIndex: 'rewardWelfare', key: 'rewardWelfare', width: 140 },
    { title: '备注', dataIndex: 'archiveRemark', key: 'archiveRemark', width: 160 },
    {
      title: '操作',
      key: 'actions',
      width: 100,
      fixed: 'right',
      render: (_value, record) =>
        record.canEdit ? (
          <Button type="link" size="small" onClick={() => setEditingRecord(record)}>
            编辑
          </Button>
        ) : null,
    },
  ]

  const handleSave = async (userId: number, payload: EmployeeArchivePayload) => {
    setSaving(true)
    try {
      const updated = await updateEmployeeArchive(scope, userId, payload)
      setRecords((prev) => prev.map((item) => (item.userId === updated.userId ? updated : item)))
      setEditingRecord(null)
      message.success('员工档案已更新')
    } catch (error: any) {
      console.error(error)
      message.error(error?.response?.data?.detail || error?.message || '更新失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <Card style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle" gutter={16}>
          <Col>
            <Space>
              <Title level={4} style={{ margin: 0 }}>
                {pageTitle}
              </Title>
              <Text type="secondary">当前登录人：{currentUser?.name || '-'}</Text>
            </Space>
          </Col>
          <Col>
            <Space>
              <Input
                allowClear
                prefix={<SearchOutlined />}
                placeholder="搜索姓名/部门/岗位/电话/身份证号"
                style={{ width: 320 }}
                value={keyword}
                onChange={(event) => {
                  setKeyword(event.target.value)
                  setTablePagination((prev) => ({ ...prev, current: 1 }))
                }}
              />
              <Button icon={<ReloadOutlined />} onClick={() => loadData(keyword)} loading={loading}>
                刷新
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card>
        <Table<EmployeeArchiveRecord>
          rowKey="userId"
          loading={loading}
          columns={columns}
          dataSource={filteredRecords}
          bordered
          size="small"
          pagination={{
            current: tablePagination.current,
            pageSize: tablePagination.pageSize,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (current, pageSize) => setTablePagination({ current, pageSize }),
          }}
          scroll={{ x: 7600 }}
        />
      </Card>

      <EditModal
        open={!!editingRecord}
        record={editingRecord}
        options={options}
        titleOptions={titleOptions}
        changeLogs={changeLogs}
        changeLogsLoading={changeLogsLoading}
        saving={saving}
        onCancel={() => setEditingRecord(null)}
        onOk={handleSave}
      />
    </div>
  )
}

export default HqEmployeeArchive
