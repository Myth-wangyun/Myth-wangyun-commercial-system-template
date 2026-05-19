import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Row,
  Space,
  Tooltip,
  Typography,
  message,
} from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import {
  DeleteOutlined,
  EditOutlined,
  MinusCircleOutlined,
  PlusOutlined,
  PrinterOutlined,
  SearchOutlined,
  UserAddOutlined,
} from '@ant-design/icons'
import { useCampusStore } from '@/stores/campusStore'
import {
  createSocialInsuranceCostSummary,
  deleteSocialInsuranceCostSummary,
  getSocialInsuranceCostSummary,
  listSocialInsuranceCostSummaries,
  updateSocialInsuranceCostSummary,
  type SocialInsuranceCostSummaryPayload,
  type SocialInsuranceCostSummaryRecord,
} from '@/services/humanresources/socialInsuranceCostSummary'

const { Text } = Typography

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

interface EmployeeInsurance {
  serviceFee: number
  idNumber: string
  name: string
  injuryBase: number
  pensionBase: number
  unemploymentBase: number
  medicalBase: number
}

type SummaryCostRecord = SocialInsuranceCostSummaryRecord

const DEFAULT_INJURY_RATE_PERCENT = 0.7
const INJURY_RATE_STORAGE_KEY = 'humanresources-social-insurance-last-injury-rate'
const PERIOD_FORMAT = 'YYYY.M'
const PENSION_RATE = { enterprise: 0.16, personal: 0.08 }
const UNEMPLOYMENT_RATE = { enterprise: 0.007, personal: 0.003 }
const MEDICAL_RATE = { enterprise: 0.075, personal: 0.02 }

const SHEET_STYLE = `
  .insurance-sheet-wrap {
    background: linear-gradient(180deg, #fffef9 0%, #fff 100%);
    border: 1px solid #d8c9a6;
    border-radius: 14px;
    padding: 18px;
    box-shadow: 0 8px 24px rgba(120, 92, 38, 0.08);
  }

  .insurance-sheet-title {
    margin: 0 0 12px;
    text-align: center;
    font-size: 30px;
    line-height: 1.2;
    font-weight: 700;
    letter-spacing: 1px;
    color: #2f2413;
  }

  .insurance-sheet-subtitle {
    margin: 0 0 14px;
    text-align: center;
    color: #7b6a4c;
    font-size: 13px;
  }

  .insurance-sheet-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    background: #fff;
  }

  .insurance-sheet-table th,
  .insurance-sheet-table td {
    border: 1px solid #2e2a22;
    padding: 8px 6px;
    color: #231f18;
    font-size: 13px;
    line-height: 1.25;
    word-break: break-word;
  }

  .insurance-sheet-table thead th {
    background: #f4ecda;
    text-align: center;
    font-weight: 700;
  }

  .insurance-sheet-table thead tr:first-child th {
    background: #efe3c5;
  }

  .insurance-sheet-table tbody td {
    background: #fffdfa;
  }

  .insurance-sheet-table .sheet-group-header {
    font-size: 15px;
    letter-spacing: 0.5px;
  }

  .insurance-sheet-table .sheet-num {
    text-align: center;
  }

  .insurance-sheet-table .sheet-money {
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  .insurance-sheet-table .sheet-text-center {
    text-align: center;
  }

  .insurance-sheet-table .sheet-summary td {
    background: #f6e2a1;
    font-weight: 700;
  }

  .insurance-sheet-table .sheet-summary td.sheet-summary-label {
    background: #f2d886;
    text-align: center;
  }

  .insurance-sheet-table .sheet-muted {
    color: #6b6253;
  }

  @media print {
    body {
      margin: 0;
      padding: 12mm;
      background: #fff;
    }

    .insurance-sheet-wrap {
      box-shadow: none;
      border-radius: 0;
      border: none;
      padding: 0;
    }

    .insurance-sheet-title {
      font-size: 28px;
      margin-bottom: 10px;
    }

    .insurance-sheet-table th,
    .insurance-sheet-table td {
      font-size: 12px;
      padding: 6px 4px;
    }
  }
`

const r2 = (value: number) => Math.round(value * 100) / 100

const normalizeRatePercent = (value: number | null | undefined) => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    return DEFAULT_INJURY_RATE_PERCENT
  }

  return r2(value)
}

const getStoredInjuryRatePercent = () => {
  if (typeof window === 'undefined') return DEFAULT_INJURY_RATE_PERCENT

  const raw = window.localStorage.getItem(INJURY_RATE_STORAGE_KEY)
  if (!raw) return DEFAULT_INJURY_RATE_PERCENT

  const parsed = Number(raw)
  return normalizeRatePercent(parsed)
}

const setStoredInjuryRatePercent = (value: number) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(INJURY_RATE_STORAGE_KEY, String(normalizeRatePercent(value)))
}

const parsePeriodValue = (value?: string | null): Dayjs | null => {
  if (!value) return null

  const match = value.trim().match(/^(\d{4})[.-](\d{1,2})$/)
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2])
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return null
  }

  return dayjs(`${year}-${String(month).padStart(2, '0')}-01`)
}

const formatPeriodValue = (value: Dayjs | null | undefined) => {
  if (!value) return ''
  return value.format(PERIOD_FORMAT)
}

const formatMoney = (value: number | string | undefined | null) => {
  if (value === undefined || value === null || value === '') return ''
  const num = Number(value)
  if (!Number.isFinite(num)) return ''
  return num.toFixed(2)
}

const calcEmployee = (employee: EmployeeInsurance, injuryEnterpriseRate: number) => {
  const injuryEnterprise = r2(employee.injuryBase * (normalizeRatePercent(injuryEnterpriseRate) / 100))

  const pensionEnterprise = r2(employee.pensionBase * PENSION_RATE.enterprise)
  const pensionPersonal = r2(employee.pensionBase * PENSION_RATE.personal)
  const pensionTotal = r2(pensionEnterprise + pensionPersonal)

  const unemploymentEnterprise = r2(employee.unemploymentBase * UNEMPLOYMENT_RATE.enterprise)
  const unemploymentPersonal = r2(employee.unemploymentBase * UNEMPLOYMENT_RATE.personal)
  const unemploymentTotal = r2(unemploymentEnterprise + unemploymentPersonal)

  const medicalEnterprise = r2(employee.medicalBase * MEDICAL_RATE.enterprise)
  const medicalPersonal = r2(employee.medicalBase * MEDICAL_RATE.personal)
  const medicalTotal = r2(medicalEnterprise + medicalPersonal)

  return {
    injuryEnterprise,
    pensionTotal,
    pensionEnterprise,
    pensionPersonal,
    unemploymentTotal,
    unemploymentEnterprise,
    unemploymentPersonal,
    medicalTotal,
    medicalEnterprise,
    medicalPersonal,
  }
}

const calcSummary = (employees: EmployeeInsurance[], injuryEnterpriseRate: number) =>
  employees.reduce(
    (acc, employee) => {
      const calc = calcEmployee(employee, injuryEnterpriseRate)
      return {
        serviceFee: r2(acc.serviceFee + employee.serviceFee),
        injuryBase: r2(acc.injuryBase + employee.injuryBase),
        injuryEnterprise: r2(acc.injuryEnterprise + calc.injuryEnterprise),
        pensionBase: r2(acc.pensionBase + employee.pensionBase),
        pensionTotal: r2(acc.pensionTotal + calc.pensionTotal),
        pensionEnterprise: r2(acc.pensionEnterprise + calc.pensionEnterprise),
        pensionPersonal: r2(acc.pensionPersonal + calc.pensionPersonal),
        unemploymentBase: r2(acc.unemploymentBase + employee.unemploymentBase),
        unemploymentTotal: r2(acc.unemploymentTotal + calc.unemploymentTotal),
        unemploymentEnterprise: r2(acc.unemploymentEnterprise + calc.unemploymentEnterprise),
        unemploymentPersonal: r2(acc.unemploymentPersonal + calc.unemploymentPersonal),
        medicalBase: r2(acc.medicalBase + employee.medicalBase),
        medicalTotal: r2(acc.medicalTotal + calc.medicalTotal),
        medicalEnterprise: r2(acc.medicalEnterprise + calc.medicalEnterprise),
        medicalPersonal: r2(acc.medicalPersonal + calc.medicalPersonal),
      }
    },
    {
      serviceFee: 0,
      injuryBase: 0,
      injuryEnterprise: 0,
      pensionBase: 0,
      pensionTotal: 0,
      pensionEnterprise: 0,
      pensionPersonal: 0,
      unemploymentBase: 0,
      unemploymentTotal: 0,
      unemploymentEnterprise: 0,
      unemploymentPersonal: 0,
      medicalBase: 0,
      medicalTotal: 0,
      medicalEnterprise: 0,
      medicalPersonal: 0,
    },
  )

const defaultEmployee = (): Omit<EmployeeInsurance, 'key'> => ({
  serviceFee: 20,
  idNumber: '',
  name: '',
  injuryBase: 0,
  pensionBase: 0,
  unemploymentBase: 0,
  medicalBase: 0,
})

const getTitleText = (unitName?: string) => `${unitName?.trim() || 'XX单位'}社保费用汇总表`

interface InsuranceSummarySheetProps {
  record: SummaryCostRecord
}

const InsuranceSummarySheet: React.FC<InsuranceSummarySheetProps> = ({ record }) => {
  const summary = calcSummary(record.employees, record.injuryEnterpriseRate)
  const injuryRateLabel = `${normalizeRatePercent(record.injuryEnterpriseRate)}%`

  return (
    <div className="insurance-sheet-wrap">
      <style>{SHEET_STYLE}</style>
      <h2 className="insurance-sheet-title">{getTitleText(record.unitName)}</h2>
      <p className="insurance-sheet-subtitle">
        期间：{record.period || '-'}
        {record.remark ? ` ｜ 备注：${record.remark}` : ''}
      </p>
      <table className="insurance-sheet-table">
        <colgroup>
          <col style={{ width: 52 }} />
          <col style={{ width: 76 }} />
          <col style={{ width: 170 }} />
          <col style={{ width: 78 }} />
          <col style={{ width: 92 }} />
          <col style={{ width: 92 }} />
          <col style={{ width: 92 }} />
          <col style={{ width: 92 }} />
          <col style={{ width: 92 }} />
          <col style={{ width: 92 }} />
          <col style={{ width: 92 }} />
          <col style={{ width: 92 }} />
          <col style={{ width: 92 }} />
          <col style={{ width: 92 }} />
          <col style={{ width: 92 }} />
          <col style={{ width: 92 }} />
          <col style={{ width: 92 }} />
          <col style={{ width: 92 }} />
        </colgroup>
        <thead>
          <tr>
            <th rowSpan={2}>序号</th>
            <th rowSpan={2}>服务费<br />(元/月)</th>
            <th rowSpan={2}>身份证号</th>
            <th rowSpan={2}>姓名</th>
            <th colSpan={2} className="sheet-group-header">{record.period || '-'} 工伤保险</th>
            <th colSpan={4} className="sheet-group-header">{record.period || '-'} 养老保险</th>
            <th colSpan={4} className="sheet-group-header">{record.period || '-'} 失业保险</th>
            <th colSpan={4} className="sheet-group-header">{record.period || '-'} 医疗保险</th>
          </tr>
          <tr>
            <th>缴费基数</th>
            <th>企业{injuryRateLabel}</th>
            <th>缴费基数</th>
            <th>总比例24%</th>
            <th>企业16%</th>
            <th>个人8%</th>
            <th>缴费基数</th>
            <th>总比例1%</th>
            <th>企业0.7%</th>
            <th>个人0.3%</th>
            <th>缴费基数</th>
            <th>总比例9.5%</th>
            <th>企业7.5%</th>
            <th>个人2%</th>
          </tr>
        </thead>
        <tbody>
          {record.employees.map((employee, index) => {
            const calc = calcEmployee(employee, record.injuryEnterpriseRate)
            return (
              <tr key={`${record.id}-${index + 1}`}>
                <td className="sheet-num">{index + 1}</td>
                <td className="sheet-num">{formatMoney(employee.serviceFee)}</td>
                <td className="sheet-text-center">{employee.idNumber || ''}</td>
                <td className="sheet-text-center">{employee.name || ''}</td>
                <td className="sheet-money">{formatMoney(employee.injuryBase)}</td>
                <td className="sheet-money">{formatMoney(calc.injuryEnterprise)}</td>
                <td className="sheet-money">{formatMoney(employee.pensionBase)}</td>
                <td className="sheet-money">{formatMoney(calc.pensionTotal)}</td>
                <td className="sheet-money">{formatMoney(calc.pensionEnterprise)}</td>
                <td className="sheet-money">{formatMoney(calc.pensionPersonal)}</td>
                <td className="sheet-money">{formatMoney(employee.unemploymentBase)}</td>
                <td className="sheet-money">{formatMoney(calc.unemploymentTotal)}</td>
                <td className="sheet-money">{formatMoney(calc.unemploymentEnterprise)}</td>
                <td className="sheet-money">{formatMoney(calc.unemploymentPersonal)}</td>
                <td className="sheet-money">{formatMoney(employee.medicalBase)}</td>
                <td className="sheet-money">{formatMoney(calc.medicalTotal)}</td>
                <td className="sheet-money">{formatMoney(calc.medicalEnterprise)}</td>
                <td className="sheet-money">{formatMoney(calc.medicalPersonal)}</td>
              </tr>
            )
          })}
          <tr className="sheet-summary">
            <td className="sheet-summary-label">合计</td>
            <td className="sheet-num">{formatMoney(summary.serviceFee)}</td>
            <td colSpan={2} className="sheet-summary-label">各项社保基金费合计</td>
            <td className="sheet-money">{formatMoney(summary.injuryBase)}</td>
            <td className="sheet-money">{formatMoney(summary.injuryEnterprise)}</td>
            <td className="sheet-money">{formatMoney(summary.pensionBase)}</td>
            <td className="sheet-money">{formatMoney(summary.pensionTotal)}</td>
            <td className="sheet-money">{formatMoney(summary.pensionEnterprise)}</td>
            <td className="sheet-money">{formatMoney(summary.pensionPersonal)}</td>
            <td className="sheet-money">{formatMoney(summary.unemploymentBase)}</td>
            <td className="sheet-money">{formatMoney(summary.unemploymentTotal)}</td>
            <td className="sheet-money">{formatMoney(summary.unemploymentEnterprise)}</td>
            <td className="sheet-money">{formatMoney(summary.unemploymentPersonal)}</td>
            <td className="sheet-money">{formatMoney(summary.medicalBase)}</td>
            <td className="sheet-money">{formatMoney(summary.medicalTotal)}</td>
            <td className="sheet-money">{formatMoney(summary.medicalEnterprise)}</td>
            <td className="sheet-money">{formatMoney(summary.medicalPersonal)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

interface EditModalProps {
  open: boolean
  editingRecord: SummaryCostRecord | null
  rememberedInjuryRate: number
  confirmLoading: boolean
  onCancel: () => void
  onOk: (record: SocialInsuranceCostSummaryPayload) => Promise<void>
}

const EditModal: React.FC<EditModalProps> = ({
  open,
  editingRecord,
  rememberedInjuryRate,
  confirmLoading,
  onCancel,
  onOk,
}) => {
  const [form] = Form.useForm()

  React.useEffect(() => {
    if (!open) return

    if (editingRecord) {
      form.setFieldsValue({
        unitName: editingRecord.unitName,
        period: parsePeriodValue(editingRecord.period),
        injuryEnterpriseRate: normalizeRatePercent(editingRecord.injuryEnterpriseRate),
        remark: editingRecord.remark,
        employees: editingRecord.employees.map((employee) => ({
          serviceFee: employee.serviceFee,
          idNumber: employee.idNumber,
          name: employee.name,
          injuryBase: employee.injuryBase,
          pensionBase: employee.pensionBase,
          unemploymentBase: employee.unemploymentBase,
          medicalBase: employee.medicalBase,
        })),
      })
      return
    }

    form.resetFields()
    form.setFieldsValue({
      unitName: '',
      period: null,
      injuryEnterpriseRate: rememberedInjuryRate,
      remark: '',
      employees: [defaultEmployee()],
    })
  }, [editingRecord, form, open, rememberedInjuryRate])

  const handleOk = async () => {
    const values = await form.validateFields()
    const employees: EmployeeInsurance[] = (values.employees || []).map(
      (employee: EmployeeInsurance) => ({
        serviceFee: employee.serviceFee ?? 20,
        idNumber: employee.idNumber ?? '',
        name: employee.name ?? '',
        injuryBase: employee.injuryBase ?? 0,
        pensionBase: employee.pensionBase ?? 0,
        unemploymentBase: employee.unemploymentBase ?? 0,
        medicalBase: employee.medicalBase ?? 0,
      }),
    )

    await onOk({
      campus: editingRecord?.campus || '',
      unitName: values.unitName,
      period: formatPeriodValue(values.period),
      injuryEnterpriseRate: normalizeRatePercent(values.injuryEnterpriseRate),
      remark: values.remark ?? '',
      employees,
    })
  }

  return (
    <Modal
      title={editingRecord ? '编辑社保费用汇总表' : '新增社保费用汇总表'}
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      confirmLoading={confirmLoading}
      okText="保存"
      cancelText="取消"
      width={1180}
      destroyOnClose
      styles={{ body: { maxHeight: '76vh', overflowY: 'auto' } }}
    >
      <Form form={form} layout="vertical">
        <Card size="small" title="表头信息" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item
                name="unitName"
                label="单位名称"
                rules={[{ required: true, message: '请填写单位名称' }]}
                extra="支持自定义填写，打印表头会直接展示为“XX单位社保费用汇总表”"
              >
                <Input placeholder="如：河北主神殿、最高议事厅、XX单位" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="period"
                label="期间"
                rules={[{ required: true, message: '请填写期间' }]}
                extra="请选择年份和月份"
              >
                <DatePicker picker="month" format={PERIOD_FORMAT} style={{ width: '100%' }} placeholder="选择年月" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="injuryEnterpriseRate"
                label="工伤企业缴费比例(%)"
                rules={[{ required: true, message: '请填写工伤企业缴费比例' }]}
                extra="新增时会自动带出上次保存的比例"
              >
                <InputNumber min={0} precision={4} style={{ width: '100%' }} placeholder="如：0.7" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="remark" label="备注">
                <Input placeholder="可选备注，打印时显示在标题下方" />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Card size="small" title="社保明细录入">
          <div style={{ marginBottom: 12 }}>
            <Text type="secondary">
              总比例列会根据企业和个人金额自动推算，不再单独录入。表格结构将按打印版式直接生成。
            </Text>
          </div>
          <Form.List name="employees">
            {(fields, { add, remove }) => (
              <>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '60px 90px 220px 120px repeat(4, 1fr) 44px',
                    gap: 8,
                    marginBottom: 8,
                    padding: 10,
                    background: '#faf7ef',
                    border: '1px solid #eadfca',
                    borderRadius: 10,
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#6a5732',
                  }}
                >
                  <div>序号</div>
                  <div>服务费</div>
                  <div>身份证号</div>
                  <div>姓名</div>
                  <div>工伤基数</div>
                  <div>养老基数</div>
                  <div>失业基数</div>
                  <div>医疗基数</div>
                  <div />
                </div>
                {fields.map((field, index) => (
                  <div
                    key={field.key}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '60px 90px 220px 120px repeat(4, 1fr) 44px',
                      gap: 8,
                      marginBottom: 8,
                      padding: 10,
                      border: '1px solid #eee3cf',
                      borderRadius: 10,
                      background: '#fffdfa',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Text type="secondary">{index + 1}</Text>
                    </div>
                    <Form.Item name={[field.name, 'serviceFee']} style={{ marginBottom: 0 }}>
                      <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item name={[field.name, 'idNumber']} style={{ marginBottom: 0 }}>
                      <Input placeholder="身份证号" />
                    </Form.Item>
                    <Form.Item
                      name={[field.name, 'name']}
                      rules={[{ required: true, message: '请填写姓名' }]}
                      style={{ marginBottom: 0 }}
                    >
                      <Input placeholder="姓名" />
                    </Form.Item>
                    <Form.Item name={[field.name, 'injuryBase']} style={{ marginBottom: 0 }}>
                      <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item name={[field.name, 'pensionBase']} style={{ marginBottom: 0 }}>
                      <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item name={[field.name, 'unemploymentBase']} style={{ marginBottom: 0 }}>
                      <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item name={[field.name, 'medicalBase']} style={{ marginBottom: 0 }}>
                      <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      {fields.length > 1 ? (
                        <Button
                          type="text"
                          danger
                          icon={<MinusCircleOutlined />}
                          onClick={() => remove(field.name)}
                        />
                      ) : null}
                    </div>
                  </div>
                ))}
                <Button
                  type="dashed"
                  icon={<UserAddOutlined />}
                  block
                  onClick={() => add(defaultEmployee())}
                >
                  添加员工
                </Button>
              </>
            )}
          </Form.List>
        </Card>
      </Form>
    </Modal>
  )
}

interface PreviewModalProps {
  open: boolean
  record: SummaryCostRecord | null
  onCancel: () => void
}

const PreviewModal: React.FC<PreviewModalProps> = ({ open, record, onCancel }) => {
  const printRef = useRef<HTMLDivElement>(null)

  if (!record) return null

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=1400,height=900')
    if (!printWindow || !printRef.current) {
      message.error('无法打开打印窗口')
      return
    }

    printWindow.document.open()
    printWindow.document.write(`
      <html>
        <head>
          <title>${getTitleText(record.unitName)}</title>
          <style>${SHEET_STYLE}</style>
        </head>
        <body>${printRef.current.innerHTML}</body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
    }, 200)
  }

  return (
    <Modal
      title="打印预览 - 社保费用汇总表"
      open={open}
      onCancel={onCancel}
      width="96vw"
      style={{ top: 24 }}
      styles={{
        body: {
          maxHeight: '82vh',
          overflow: 'auto',
          padding: 16,
        },
      }}
      footer={[
        <Button key="close" onClick={onCancel}>
          关闭
        </Button>,
        <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>
          打印
        </Button>,
      ]}
    >
      <div
        style={{
          overflowX: 'auto',
          overflowY: 'visible',
          paddingBottom: 8,
        }}
      >
        <div
          ref={printRef}
          style={{
            minWidth: 1680,
          }}
        >
          <InsuranceSummarySheet record={record} />
        </div>
      </div>
    </Modal>
  )
}

const InsuranceCostSummary: React.FC = () => {
  const { currentCampus } = useCampusStore()
  const [data, setData] = useState<SummaryCostRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<SummaryCostRecord | null>(null)
  const [previewRecord, setPreviewRecord] = useState<SummaryCostRecord | null>(null)
  const [searchText, setSearchText] = useState('')
  const [rememberedInjuryRate, setRememberedInjuryRate] = useState(DEFAULT_INJURY_RATE_PERCENT)

  React.useEffect(() => {
    setRememberedInjuryRate(getStoredInjuryRatePercent())
  }, [])

  const loadRecords = useCallback(async () => {
    try {
      setLoading(true)
      const records = await listSocialInsuranceCostSummaries({
        campus: currentCampus || undefined,
      })
      setData(records)
    } catch (error) {
      console.error('加载社保费用汇总表失败', error)
      message.error(getErrorMessage(error, '加载社保费用汇总表失败'))
    } finally {
      setLoading(false)
    }
  }, [currentCampus])

  useEffect(() => {
    loadRecords()
  }, [loadRecords])

  const filteredData = useMemo(() => {
    const keyword = searchText.trim().toLowerCase()
    if (!keyword) return data

    return data.filter((record) => {
      const summaryText = `${record.unitName} ${record.period} ${record.remark}`.toLowerCase()
      const employeeMatched = record.employees.some((employee) =>
        `${employee.name} ${employee.idNumber}`.toLowerCase().includes(keyword),
      )
      return summaryText.includes(keyword) || employeeMatched
    })
  }, [data, searchText])

  const handleAdd = () => {
    setEditingRecord(null)
    setEditModalOpen(true)
  }

  const handleEdit = async (record: SummaryCostRecord) => {
    try {
      const detail = await getSocialInsuranceCostSummary(record.id)
      setEditingRecord(detail)
      setEditModalOpen(true)
    } catch (error) {
      message.error(getErrorMessage(error, '加载社保费用汇总详情失败'))
    }
  }

  const handleSave = async (payload: SocialInsuranceCostSummaryPayload) => {
    if (!currentCampus) {
      message.error('当前未选择神殿，无法保存社保费用汇总表')
      return
    }

    const normalizedRate = normalizeRatePercent(payload.injuryEnterpriseRate)
    try {
      setSaving(true)
      if (editingRecord) {
        await updateSocialInsuranceCostSummary(editingRecord.id, {
          ...payload,
          campus: editingRecord.campus || currentCampus,
          injuryEnterpriseRate: normalizedRate,
        })
        message.success('编辑成功')
      } else {
        await createSocialInsuranceCostSummary({
          ...payload,
          campus: currentCampus,
          injuryEnterpriseRate: normalizedRate,
        })
        message.success('新增成功')
      }
      setStoredInjuryRatePercent(normalizedRate)
      setRememberedInjuryRate(normalizedRate)
      setEditModalOpen(false)
      setEditingRecord(null)
      await loadRecords()
    } catch (error) {
      message.error(getErrorMessage(error, '保存社保费用汇总表失败'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteSocialInsuranceCostSummary(id)
      message.success('删除成功')
      await loadRecords()
    } catch (error) {
      message.error(getErrorMessage(error, '删除社保费用汇总表失败'))
    }
  }

  return (
    <div>
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle" gutter={[12, 12]}>
          <Col>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新增费用汇总
            </Button>
          </Col>
          <Col flex="320px">
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder="搜索单位、期间、姓名、身份证号"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
            />
          </Col>
        </Row>
      </Card>

      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        {filteredData.map((record) => {
          const summary = calcSummary(record.employees, record.injuryEnterpriseRate)
          return (
            <Card
              key={record.id}
              title={
                <Space>
                  <span>{getTitleText(record.unitName)}</span>
                  <Text type="secondary">期间：{record.period || '-'}</Text>
                  <Text type="secondary">人数：{record.employees.length}</Text>
                </Space>
              }
              extra={
                <Space>
                  <Text type="secondary">服务费合计：{formatMoney(summary.serviceFee)}</Text>
                  <Tooltip title="打印预览">
                    <Button
                      type="text"
                      icon={<PrinterOutlined />}
                      onClick={() => setPreviewRecord(record)}
                    />
                  </Tooltip>
                  <Tooltip title="编辑">
                    <Button type="text" icon={<EditOutlined />} onClick={() => void handleEdit(record)} />
                  </Tooltip>
                  <Popconfirm
                    title="确认删除该记录？"
                    okText="删除"
                    cancelText="取消"
                    onConfirm={() => handleDelete(record.id)}
                  >
                    <Tooltip title="删除">
                      <Button type="text" danger icon={<DeleteOutlined />} />
                    </Tooltip>
                  </Popconfirm>
                </Space>
              }
              bodyStyle={{ padding: 18 }}
            >
              <InsuranceSummarySheet record={record} />
            </Card>
          )
        })}
        {!filteredData.length ? (
          <Card>
            <div style={{ textAlign: 'center', padding: '36px 0', color: '#8a7a5d' }}>
              {loading ? '社保费用汇总表加载中...' : '暂无社保费用汇总记录'}
            </div>
          </Card>
        ) : null}
      </Space>

      <EditModal
        open={editModalOpen}
        editingRecord={editingRecord}
        rememberedInjuryRate={rememberedInjuryRate}
        confirmLoading={saving}
        onCancel={() => setEditModalOpen(false)}
        onOk={handleSave}
      />

      <PreviewModal
        open={!!previewRecord}
        record={previewRecord}
        onCancel={() => setPreviewRecord(null)}
      />
    </div>
  )
}

export default InsuranceCostSummary