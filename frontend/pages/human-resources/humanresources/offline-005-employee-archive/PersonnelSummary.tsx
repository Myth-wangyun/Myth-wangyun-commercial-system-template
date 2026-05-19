/**
 * 线下事业部年度核心数据看板-人员汇总表
 * 005 线下-员工档案表 TAB1
 *
 * 列结构（多级表头）：
 *   序号、劳动关系所属公司、实际工作所在公司、部门、岗位、岗位类别
 *   姓名、性别、民族、联系电话、籍贯、入职时间
 *   劳动合同签订、劳动合同终止、五险缴纳时间、岗位性质、离职时间
 *   身份证号、出生日期、政治面貌
 *   第一学历（学历/所学专业/毕业院校/备注）
 *   第二学历（学历/所学专业/毕业院校/备注）
 *   职称、户籍地址、现住址、紧急联系人
 *   银行卡信息（姓名/开户行/卡号）
 *   基础薪资、绩效薪资、提成方式、人事变动、奖励/福利、备注
 */
import React, { useState, useMemo } from 'react'
import {
  App,
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Radio,
  Space,
  Typography,
  Popconfirm,
  Tooltip,
  Row,
  Col,
  Divider,
  message,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PrinterOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import dayjs, { Dayjs } from 'dayjs'

const { Title, Text } = Typography
const { TextArea } = Input

/* ==================== 类型定义 ==================== */

/** 学历信息 */
interface EducationInfo {
  degree: string   // 学历
  major: string    // 所学专业
  school: string   // 毕业院校
  remark: string   // 备注
}

/** 银行卡信息 */
interface BankInfo {
  accountName: string  // 姓名
  bankName: string     // 开户行
  cardNumber: string   // 卡号
}

/** 员工档案记录 */
interface EmployeeArchiveRecord {
  id: number
  laborCompany: string        // 劳动关系所属公司
  workCompany: string         // 实际工作所在公司
  department: string          // 部门
  position: string            // 岗位
  positionCategory: string    // 岗位类别
  name: string                // 姓名
  gender: '男' | '女' | ''    // 性别
  ethnicity: string           // 民族
  phone: string               // 联系电话
  nativePlace: string         // 籍贯
  hireDate: string            // 入职时间
  contractSignDate: string    // 劳动合同签订
  contractEndDate: string     // 劳动合同终止
  insuranceStartDate: string  // 五险缴纳时间
  positionNature: string      // 岗位性质
  resignDate: string          // 离职时间
  idNumber: string            // 身份证号
  birthDate: string           // 出生日期
  politicalStatus: string     // 政治面貌
  firstEducation: EducationInfo
  secondEducation: EducationInfo
  title: string               // 职称
  householdAddress: string    // 户籍地址
  currentAddress: string      // 现住址
  emergencyContact: string    // 紧急联系人
  bankInfo: BankInfo
  baseSalary: number | null   // 基础薪资
  performanceSalary: number | null  // 绩效薪资
  commissionMethod: string    // 提成方式
  personnelChange: string     // 人事变动
  rewardWelfare: string       // 奖励/福利
  remark: string              // 备注
}

/* ==================== 常量选项 ==================== */

const DEGREE_OPTIONS = [
  { label: '初中及以下', value: '初中及以下' },
  { label: '高中/中专', value: '高中/中专' },
  { label: '大专', value: '大专' },
  { label: '本科', value: '本科' },
  { label: '硕士', value: '硕士' },
  { label: '博士', value: '博士' },
]

const POSITION_CATEGORY_OPTIONS = [
  { label: '管理', value: '管理' },
  { label: '教学', value: '教学' },
  { label: '行政', value: '行政' },
  { label: '市场', value: '市场' },
  { label: '后勤', value: '后勤' },
  { label: '技术', value: '技术' },
]

const POSITION_NATURE_OPTIONS = [
  { label: '全职', value: '全职' },
  { label: '兼职', value: '兼职' },
  { label: '实习', value: '实习' },
  { label: '劳务', value: '劳务' },
]

const POLITICAL_STATUS_OPTIONS = [
  { label: '群众', value: '群众' },
  { label: '共青团员', value: '共青团员' },
  { label: '中共党员', value: '中共党员' },
  { label: '预备党员', value: '预备党员' },
  { label: '民主党派', value: '民主党派' },
]

/* ==================== 编辑弹窗 ==================== */

interface EditModalProps {
  open: boolean
  editingRecord: EmployeeArchiveRecord | null
  onCancel: () => void
  onOk: (record: EmployeeArchiveRecord) => void
}

const EditModal: React.FC<EditModalProps> = ({ open, editingRecord, onCancel, onOk }) => {
  const [form] = Form.useForm()
  const isEdit = !!editingRecord

  React.useEffect(() => {
    if (open) {
      if (editingRecord) {
        form.setFieldsValue({
          ...editingRecord,
          hireDate: editingRecord.hireDate ? dayjs(editingRecord.hireDate) : undefined,
          contractSignDate: editingRecord.contractSignDate ? dayjs(editingRecord.contractSignDate) : undefined,
          contractEndDate: editingRecord.contractEndDate ? dayjs(editingRecord.contractEndDate) : undefined,
          insuranceStartDate: editingRecord.insuranceStartDate ? dayjs(editingRecord.insuranceStartDate) : undefined,
          resignDate: editingRecord.resignDate ? dayjs(editingRecord.resignDate) : undefined,
          birthDate: editingRecord.birthDate ? dayjs(editingRecord.birthDate) : undefined,
          firstDegree: editingRecord.firstEducation.degree,
          firstMajor: editingRecord.firstEducation.major,
          firstSchool: editingRecord.firstEducation.school,
          firstRemark: editingRecord.firstEducation.remark,
          secondDegree: editingRecord.secondEducation.degree,
          secondMajor: editingRecord.secondEducation.major,
          secondSchool: editingRecord.secondEducation.school,
          secondRemark: editingRecord.secondEducation.remark,
          bankAccountName: editingRecord.bankInfo.accountName,
          bankName: editingRecord.bankInfo.bankName,
          bankCardNumber: editingRecord.bankInfo.cardNumber,
        })
      } else {
        form.resetFields()
        form.setFieldsValue({ gender: '男' })
      }
    }
  }, [open, editingRecord, form])

  const dateVal = (v: Dayjs | undefined | null) => (v ? v.format('YYYY-MM-DD') : '')

  const handleOk = async () => {
    const v = await form.validateFields()
    const record: EmployeeArchiveRecord = {
      id: editingRecord?.id ?? Date.now(),
      laborCompany: v.laborCompany ?? '',
      workCompany: v.workCompany ?? '',
      department: v.department ?? '',
      position: v.position ?? '',
      positionCategory: v.positionCategory ?? '',
      name: v.name,
      gender: v.gender ?? '',
      ethnicity: v.ethnicity ?? '',
      phone: v.phone ?? '',
      nativePlace: v.nativePlace ?? '',
      hireDate: dateVal(v.hireDate),
      contractSignDate: dateVal(v.contractSignDate),
      contractEndDate: dateVal(v.contractEndDate),
      insuranceStartDate: dateVal(v.insuranceStartDate),
      positionNature: v.positionNature ?? '',
      resignDate: dateVal(v.resignDate),
      idNumber: v.idNumber ?? '',
      birthDate: dateVal(v.birthDate),
      politicalStatus: v.politicalStatus ?? '',
      firstEducation: {
        degree: v.firstDegree ?? '',
        major: v.firstMajor ?? '',
        school: v.firstSchool ?? '',
        remark: v.firstRemark ?? '',
      },
      secondEducation: {
        degree: v.secondDegree ?? '',
        major: v.secondMajor ?? '',
        school: v.secondSchool ?? '',
        remark: v.secondRemark ?? '',
      },
      title: v.title ?? '',
      householdAddress: v.householdAddress ?? '',
      currentAddress: v.currentAddress ?? '',
      emergencyContact: v.emergencyContact ?? '',
      bankInfo: {
        accountName: v.bankAccountName ?? '',
        bankName: v.bankName ?? '',
        cardNumber: v.bankCardNumber ?? '',
      },
      baseSalary: v.baseSalary ?? null,
      performanceSalary: v.performanceSalary ?? null,
      commissionMethod: v.commissionMethod ?? '',
      personnelChange: v.personnelChange ?? '',
      rewardWelfare: v.rewardWelfare ?? '',
      remark: v.remark ?? '',
    }
    onOk(record)
  }

  return (
    <Modal
      title={isEdit ? '编辑员工档案' : '新增员工档案'}
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      okText="保存"
      cancelText="取消"
      width={1050}
      destroyOnClose
      styles={{ body: { maxHeight: '72vh', overflowY: 'auto' } }}
    >
      <Form form={form} layout="vertical">
        {/* ---- 基本信息 ---- */}
        <Card size="small" title="基本信息" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="laborCompany" label="劳动关系所属公司">
                <Input placeholder="劳动关系所属公司" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="workCompany" label="实际工作所在公司">
                <Input placeholder="实际工作所在公司" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="department" label="部门">
                <Input placeholder="部门名称" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="position" label="岗位">
                <Input placeholder="具体岗位" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="positionCategory" label="岗位类别">
                <Select placeholder="选择类别" options={POSITION_CATEGORY_OPTIONS} allowClear />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="positionNature" label="岗位性质">
                <Select placeholder="选择性质" options={POSITION_NATURE_OPTIONS} allowClear />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请填写姓名' }]}>
                <Input placeholder="员工姓名" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="gender" label="性别">
                <Radio.Group>
                  <Radio value="男">男</Radio>
                  <Radio value="女">女</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="ethnicity" label="民族">
                <Input placeholder="如 汉族" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="phone" label="联系电话">
                <Input placeholder="手机号码" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="nativePlace" label="籍贯" extra="精确到市即可。">
                <Input placeholder="如：石家庄市" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="idNumber" label="身份证号">
                <Input placeholder="18位身份证号" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="birthDate" label="出生日期">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="politicalStatus" label="政治面貌">
                <Select placeholder="选择政治面貌" options={POLITICAL_STATUS_OPTIONS} allowClear />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="title" label="职称">
                <Input placeholder="如 中级教师" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="householdAddress" label="户籍地址" extra="精确到市即可。">
                <Input placeholder="户籍所在地填写到市即可，例如：石家庄市" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="currentAddress" label="现住址">
                <Input placeholder="目前居住详细地址" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="emergencyContact" label="紧急联系人">
                <Input placeholder="姓名及联系电话" />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* ---- 入职与合同信息 ---- */}
        <Card size="small" title="入职与合同信息" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="hireDate" label="入职时间">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="contractSignDate" label="劳动合同签订">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="contractEndDate" label="劳动合同终止">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="insuranceStartDate" label="五险缴纳时间">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="resignDate" label="离职时间">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={18}>
              <Form.Item name="personnelChange" label="人事变动">
                <Input placeholder="如 升职、调岗、降薪等" />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* ---- 学历信息 ---- */}
        <Card size="small" title="学历信息" style={{ marginBottom: 16 }}>
          <Text strong style={{ marginBottom: 8, display: 'block' }}>第一学历</Text>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="firstDegree" label="学历">
                <Select placeholder="选择学历" options={DEGREE_OPTIONS} allowClear />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="firstMajor" label="所学专业">
                <Input placeholder="专业名称" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="firstSchool" label="毕业院校">
                <Input placeholder="院校名称" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="firstRemark" label="备注">
                <Input placeholder="备注" />
              </Form.Item>
            </Col>
          </Row>
          <Divider style={{ margin: '8px 0' }} />
          <Text strong style={{ marginBottom: 8, display: 'block' }}>第二学历</Text>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="secondDegree" label="学历">
                <Select placeholder="选择学历" options={DEGREE_OPTIONS} allowClear />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="secondMajor" label="所学专业">
                <Input placeholder="专业名称" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="secondSchool" label="毕业院校">
                <Input placeholder="院校名称" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="secondRemark" label="备注">
                <Input placeholder="备注" />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* ---- 薪资与银行卡 ---- */}
        <Card size="small" title="薪资与银行卡信息">
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="baseSalary" label="基础薪资">
                <InputNumber min={0} style={{ width: '100%' }} placeholder="元/月" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="performanceSalary" label="绩效薪资">
                <InputNumber min={0} style={{ width: '100%' }} placeholder="元/月" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="commissionMethod" label="提成方式">
                <Input placeholder="提成规则说明" />
              </Form.Item>
            </Col>
          </Row>
          <Divider style={{ margin: '8px 0' }} />
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="bankAccountName" label="银行卡开户姓名">
                <Input placeholder="持卡人姓名" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="bankName" label="开户行">
                <Input placeholder="如 中国工商银行石家庄XX支行" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="bankCardNumber" label="银行卡号">
                <Input placeholder="银行卡号" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="rewardWelfare" label="奖励/福利">
                <Input placeholder="奖励或福利说明" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="remark" label="备注">
                <Input placeholder="其他备注" />
              </Form.Item>
            </Col>
          </Row>
        </Card>
      </Form>
    </Modal>
  )
}

/* ==================== 打印预览弹窗 ==================== */

interface PreviewModalProps {
  open: boolean
  data: EmployeeArchiveRecord[]
  onCancel: () => void
}

const PreviewModal: React.FC<PreviewModalProps> = ({ open, data, onCancel }) => {
  const handlePrint = () => window.print()

  const cs: React.CSSProperties = {
    border: '1px solid #2e7d32',
    padding: '3px 5px',
    fontSize: 10,
    lineHeight: 1.3,
    whiteSpace: 'nowrap',
  }
  const hs: React.CSSProperties = {
    ...cs,
    fontWeight: 'bold',
    background: '#e8f5e9',
    textAlign: 'center',
    color: '#1b5e20',
  }
  const gs: React.CSSProperties = { ...hs, background: '#c8e6c9' }

  return (
    <Modal
      title="打印预览 - 线下事业部年度核心数据看板-人员汇总表"
      open={open}
      onCancel={onCancel}
      width={1600}
      footer={[
        <Button key="cancel" onClick={onCancel}>关闭</Button>,
        <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>打印</Button>,
      ]}
    >
      <div className="print-area" style={{ overflowX: 'auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <Title level={4} style={{ margin: 0, color: '#1b5e20', letterSpacing: 3 }}>
            线下事业部年度核心数据看板-人员汇总表
          </Title>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid #2e7d32', minWidth: 3800 }}>
          <thead>
            <tr>
              <th style={hs} rowSpan={2}>序号</th>
              <th style={hs} rowSpan={2}>劳动关系所属公司</th>
              <th style={hs} rowSpan={2}>实际工作所在公司</th>
              <th style={hs} rowSpan={2}>部门</th>
              <th style={hs} rowSpan={2}>岗位</th>
              <th style={hs} rowSpan={2}>岗位类别</th>
              <th style={hs} rowSpan={2}>姓名</th>
              <th style={hs} rowSpan={2}>性别</th>
              <th style={hs} rowSpan={2}>民族</th>
              <th style={hs} rowSpan={2}>联系电话</th>
              <th style={hs} rowSpan={2}>籍贯</th>
              <th style={hs} rowSpan={2}>入职时间</th>
              <th style={hs} rowSpan={2}>劳动合同签订</th>
              <th style={hs} rowSpan={2}>劳动合同终止</th>
              <th style={hs} rowSpan={2}>五险缴纳时间</th>
              <th style={hs} rowSpan={2}>岗位性质</th>
              <th style={hs} rowSpan={2}>离职时间</th>
              <th style={hs} rowSpan={2}>身份证号</th>
              <th style={hs} rowSpan={2}>出生日期</th>
              <th style={hs} rowSpan={2}>政治面貌</th>
              <th style={gs} colSpan={4}>第一学历</th>
              <th style={gs} colSpan={4}>第二学历</th>
              <th style={hs} rowSpan={2}>职称</th>
              <th style={hs} rowSpan={2}>户籍地址</th>
              <th style={hs} rowSpan={2}>现住址</th>
              <th style={hs} rowSpan={2}>紧急联系人</th>
              <th style={gs} colSpan={3}>银行卡信息</th>
              <th style={hs} rowSpan={2}>基础薪资</th>
              <th style={hs} rowSpan={2}>绩效薪资</th>
              <th style={hs} rowSpan={2}>提成方式</th>
              <th style={hs} rowSpan={2}>人事变动</th>
              <th style={hs} rowSpan={2}>奖励/福利</th>
              <th style={hs} rowSpan={2}>备注</th>
            </tr>
            <tr>
              <th style={hs}>学历</th><th style={hs}>所学专业</th><th style={hs}>毕业院校</th><th style={hs}>备注</th>
              <th style={hs}>学历</th><th style={hs}>所学专业</th><th style={hs}>毕业院校</th><th style={hs}>备注</th>
              <th style={hs}>姓名</th><th style={hs}>开户行</th><th style={hs}>卡号</th>
            </tr>
          </thead>
          <tbody>
            {data.map((r, idx) => (
              <tr key={r.id}>
                <td style={{ ...cs, textAlign: 'center' }}>{idx + 1}</td>
                <td style={cs}>{r.laborCompany}</td>
                <td style={cs}>{r.workCompany}</td>
                <td style={cs}>{r.department}</td>
                <td style={cs}>{r.position}</td>
                <td style={cs}>{r.positionCategory}</td>
                <td style={cs}>{r.name}</td>
                <td style={{ ...cs, textAlign: 'center' }}>{r.gender}</td>
                <td style={cs}>{r.ethnicity}</td>
                <td style={cs}>{r.phone}</td>
                <td style={cs}>{r.nativePlace}</td>
                <td style={cs}>{r.hireDate}</td>
                <td style={cs}>{r.contractSignDate}</td>
                <td style={cs}>{r.contractEndDate}</td>
                <td style={cs}>{r.insuranceStartDate}</td>
                <td style={cs}>{r.positionNature}</td>
                <td style={cs}>{r.resignDate}</td>
                <td style={cs}>{r.idNumber}</td>
                <td style={cs}>{r.birthDate}</td>
                <td style={cs}>{r.politicalStatus}</td>
                <td style={cs}>{r.firstEducation.degree}</td>
                <td style={cs}>{r.firstEducation.major}</td>
                <td style={cs}>{r.firstEducation.school}</td>
                <td style={cs}>{r.firstEducation.remark}</td>
                <td style={cs}>{r.secondEducation.degree}</td>
                <td style={cs}>{r.secondEducation.major}</td>
                <td style={cs}>{r.secondEducation.school}</td>
                <td style={cs}>{r.secondEducation.remark}</td>
                <td style={cs}>{r.title}</td>
                <td style={cs}>{r.householdAddress}</td>
                <td style={cs}>{r.currentAddress}</td>
                <td style={cs}>{r.emergencyContact}</td>
                <td style={cs}>{r.bankInfo.accountName}</td>
                <td style={cs}>{r.bankInfo.bankName}</td>
                <td style={cs}>{r.bankInfo.cardNumber}</td>
                <td style={{ ...cs, textAlign: 'right' }}>{r.baseSalary ?? ''}</td>
                <td style={{ ...cs, textAlign: 'right' }}>{r.performanceSalary ?? ''}</td>
                <td style={cs}>{r.commissionMethod}</td>
                <td style={cs}>{r.personnelChange}</td>
                <td style={cs}>{r.rewardWelfare}</td>
                <td style={cs}>{r.remark}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  )
}

/* ==================== 主组件 ==================== */

const PersonnelSummary: React.FC = () => {
  const [data, setData] = useState<EmployeeArchiveRecord[]>([])
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<EmployeeArchiveRecord | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [searchText, setSearchText] = useState('')

  const filteredData = useMemo(() => {
    if (!searchText) return data
    const s = searchText.toLowerCase()
    return data.filter(
      (d) =>
        d.name.includes(s) ||
        d.laborCompany.includes(s) ||
        d.workCompany.includes(s) ||
        d.department.includes(s) ||
        d.position.includes(s) ||
        d.idNumber.includes(s) ||
        d.phone.includes(s)
    )
  }, [data, searchText])

  const handleAdd = () => { setEditingRecord(null); setEditModalOpen(true) }
  const handleEdit = (record: EmployeeArchiveRecord) => { setEditingRecord(record); setEditModalOpen(true) }
  const handleSave = (record: EmployeeArchiveRecord) => {
    setData((prev) => {
      const idx = prev.findIndex((d) => d.id === record.id)
      if (idx >= 0) { const next = [...prev]; next[idx] = record; return next }
      return [...prev, record]
    })
    setEditModalOpen(false)
    message.success(editingRecord ? '编辑成功' : '新增成功')
  }
  const handleDelete = (id: number) => {
    setData((prev) => prev.filter((d) => d.id !== id))
    message.success('删除成功')
  }

  const columns: any[] = [
    {
      title: '序号', key: '_index', width: 55, align: 'center', fixed: 'left',
      render: (_: unknown, __: unknown, idx: number) => idx + 1,
    },
    { title: '劳动关系所属公司', dataIndex: 'laborCompany', key: 'laborCompany', width: 140, ellipsis: true },
    { title: '实际工作所在公司', dataIndex: 'workCompany', key: 'workCompany', width: 140, ellipsis: true },
    { title: '部门', dataIndex: 'department', key: 'department', width: 90 },
    { title: '岗位', dataIndex: 'position', key: 'position', width: 100 },
    {
      title: '岗位类别', dataIndex: 'positionCategory', key: 'positionCategory', width: 80,
      filters: POSITION_CATEGORY_OPTIONS.map((o) => ({ text: o.label, value: o.value })),
      onFilter: (value: any, r: EmployeeArchiveRecord) => r.positionCategory === value,
    },
    { title: '姓名', dataIndex: 'name', key: 'name', width: 80, fixed: 'left' },
    { title: '性别', dataIndex: 'gender', key: 'gender', width: 55, align: 'center' },
    { title: '民族', dataIndex: 'ethnicity', key: 'ethnicity', width: 70 },
    { title: '联系电话', dataIndex: 'phone', key: 'phone', width: 120 },
    { title: '籍贯', dataIndex: 'nativePlace', key: 'nativePlace', width: 110, ellipsis: true },
    {
      title: '入职时间', dataIndex: 'hireDate', key: 'hireDate', width: 100,
      sorter: (a: EmployeeArchiveRecord, b: EmployeeArchiveRecord) => a.hireDate.localeCompare(b.hireDate),
    },
    { title: '劳动合同签订', dataIndex: 'contractSignDate', key: 'contractSignDate', width: 110 },
    { title: '劳动合同终止', dataIndex: 'contractEndDate', key: 'contractEndDate', width: 110 },
    { title: '五险缴纳时间', dataIndex: 'insuranceStartDate', key: 'insuranceStartDate', width: 110 },
    {
      title: '岗位性质', dataIndex: 'positionNature', key: 'positionNature', width: 80,
      filters: POSITION_NATURE_OPTIONS.map((o) => ({ text: o.label, value: o.value })),
      onFilter: (value: any, r: EmployeeArchiveRecord) => r.positionNature === value,
    },
    { title: '离职时间', dataIndex: 'resignDate', key: 'resignDate', width: 100 },
    { title: '身份证号', dataIndex: 'idNumber', key: 'idNumber', width: 170 },
    { title: '出生日期', dataIndex: 'birthDate', key: 'birthDate', width: 100 },
    { title: '政治面貌', dataIndex: 'politicalStatus', key: 'politicalStatus', width: 90 },
    {
      title: '第一学历',
      children: [
        { title: '学历', dataIndex: ['firstEducation', 'degree'], key: 'firstDegree', width: 75 },
        { title: '所学专业', dataIndex: ['firstEducation', 'major'], key: 'firstMajor', width: 100, ellipsis: true },
        { title: '毕业院校', dataIndex: ['firstEducation', 'school'], key: 'firstSchool', width: 120, ellipsis: true },
        { title: '备注', dataIndex: ['firstEducation', 'remark'], key: 'firstRemark', width: 80, ellipsis: true },
      ],
    },
    {
      title: '第二学历',
      children: [
        { title: '学历', dataIndex: ['secondEducation', 'degree'], key: 'secondDegree', width: 75 },
        { title: '所学专业', dataIndex: ['secondEducation', 'major'], key: 'secondMajor', width: 100, ellipsis: true },
        { title: '毕业院校', dataIndex: ['secondEducation', 'school'], key: 'secondSchool', width: 120, ellipsis: true },
        { title: '备注', dataIndex: ['secondEducation', 'remark'], key: 'secondRemark', width: 80, ellipsis: true },
      ],
    },
    { title: '职称', dataIndex: 'title', key: 'title', width: 90 },
    { title: '户籍地址', dataIndex: 'householdAddress', key: 'householdAddress', width: 150, ellipsis: true },
    { title: '现住址', dataIndex: 'currentAddress', key: 'currentAddress', width: 150, ellipsis: true },
    { title: '紧急联系人', dataIndex: 'emergencyContact', key: 'emergencyContact', width: 130, ellipsis: true },
    {
      title: '银行卡信息',
      children: [
        { title: '姓名', dataIndex: ['bankInfo', 'accountName'], key: 'bankAccountName', width: 90 },
        { title: '开户行', dataIndex: ['bankInfo', 'bankName'], key: 'bankName', width: 160, ellipsis: true },
        { title: '卡号', dataIndex: ['bankInfo', 'cardNumber'], key: 'bankCardNumber', width: 170 },
      ],
    },
    {
      title: '基础薪资', dataIndex: 'baseSalary', key: 'baseSalary', width: 90, align: 'right',
      sorter: (a: EmployeeArchiveRecord, b: EmployeeArchiveRecord) => (a.baseSalary ?? 0) - (b.baseSalary ?? 0),
      render: (v: number | null) => (v !== null && v !== undefined ? `¥${v}` : '-'),
    },
    {
      title: '绩效薪资', dataIndex: 'performanceSalary', key: 'performanceSalary', width: 90, align: 'right',
      render: (v: number | null) => (v !== null && v !== undefined ? `¥${v}` : '-'),
    },
    { title: '提成方式', dataIndex: 'commissionMethod', key: 'commissionMethod', width: 110, ellipsis: true },
    { title: '人事变动', dataIndex: 'personnelChange', key: 'personnelChange', width: 110, ellipsis: true },
    { title: '奖励/福利', dataIndex: 'rewardWelfare', key: 'rewardWelfare', width: 110, ellipsis: true },
    { title: '备注', dataIndex: 'remark', key: 'remark', width: 120, ellipsis: true },
    {
      title: '操作', key: 'action', width: 100, fixed: 'right',
      render: (_: unknown, record: EmployeeArchiveRecord) => (
        <Space>
          <Tooltip title="编辑">
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          </Tooltip>
          <Popconfirm
            title="确认删除该员工档案？"
            onConfirm={() => handleDelete(record.id)}
            okText="删除"
            cancelText="取消"
          >
            <Tooltip title="删除">
              <Button type="link" size="small" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                新增员工档案
              </Button>
              <Button
                icon={<PrinterOutlined />}
                onClick={() => setPreviewOpen(true)}
                disabled={data.length === 0}
              >
                打印预览
              </Button>
            </Space>
          </Col>
          <Col>
            <Input
              placeholder="搜索姓名/部门/岗位/电话/身份证..."
              prefix={<SearchOutlined />}
              allowClear
              style={{ width: 320 }}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Col>
        </Row>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          bordered
          size="small"
          pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
          scroll={{ x: 4200 }}
        />
      </Card>

      <EditModal
        open={editModalOpen}
        editingRecord={editingRecord}
        onCancel={() => setEditModalOpen(false)}
        onOk={handleSave}
      />

      <PreviewModal
        open={previewOpen}
        data={filteredData}
        onCancel={() => setPreviewOpen(false)}
      />
    </div>
  )
}

export default PersonnelSummary
