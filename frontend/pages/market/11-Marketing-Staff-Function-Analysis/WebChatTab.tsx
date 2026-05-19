import React, { useMemo, useState, useEffect, useCallback } from 'react'
import { App, Table, InputNumber, Divider, Button, Modal, Form, Input, Space, Popconfirm, Spin } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SaveOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { marketStaffFunctionService, type StaffEmployeeData } from '@/services/market/marketStaffFunction'

interface WebChatTabProps {
  year: string
  month: string
}

// 员工类型
interface Employee {
  key: string
  name: string
}

// 功能分析行数据类型
interface FunctionAnalysisRow {
  id: number
  category: string
  categoryRowSpan?: number // 类别合并行数
  functionItem: string
  detailRequirement: string
  fullScore: number
  [key: string]: any
}

// 评分标准行数据类型
interface ScoringStandardRow {
  id: number
  category: string
  categoryRowSpan?: number // 类别合并行数
  scoringItem: string
  scoringStandard: string
}

// 网聊功能分析数据
const webChatData: FunctionAnalysisRow[] = [
  // 核心业务能力 (1-4行，共4行)
  { id: 1, category: '核心业务能力', categoryRowSpan: 4, functionItem: '咨询量排名', detailRequirement: '年度咨询量总数排名', fullScore: 10 },
  { id: 2, category: '核心业务能力', functionItem: '聊出率排名', detailRequirement: '年度聊出率排名', fullScore: 10 },
  { id: 3, category: '核心业务能力', functionItem: '干预率排名', detailRequirement: '年度干预率排名', fullScore: 10 },
  { id: 4, category: '核心业务能力', functionItem: '对话数排名', detailRequirement: '年度对话数排名', fullScore: 5 },
  // 一般业务能力 (5-8行，共4行)
  { id: 5, category: '一般业务能力', categoryRowSpan: 4, functionItem: '学习+培训', detailRequirement: '自身学习+培训分享能力', fullScore: 5 },
  { id: 6, category: '一般业务能力', functionItem: '总进线数', detailRequirement: '年度网络总进线情况', fullScore: 5 },
  { id: 7, category: '一般业务能力', functionItem: '临时工作', detailRequirement: '临时工作服从情况', fullScore: 5 },
  { id: 8, category: '一般业务能力', functionItem: '数据分析', detailRequirement: '个人总结计划能力', fullScore: 5 },
  // 价值观 (9-17行，共9行)
  { id: 9, category: '价值观', categoryRowSpan: 9, functionItem: '责任心', detailRequirement: '对待工作有责任心。', fullScore: 5 },
  { id: 10, category: '价值观', functionItem: '执行力', detailRequirement: '能认真执行上级领导的各项安排', fullScore: 5 },
  { id: 11, category: '价值观', functionItem: '吃苦耐劳', detailRequirement: '不辞辛苦，任劳任怨', fullScore: 5 },
  { id: 12, category: '价值观', functionItem: '团队精神', detailRequirement: '有大局观，个人利益服从集体利益', fullScore: 5 },
  { id: 13, category: '价值观', functionItem: '职业化', detailRequirement: '工装、出勤、自律性、职业化等', fullScore: 5 },
  { id: 14, category: '价值观', functionItem: '向内归因', detailRequirement: '主动从自身找原因，不推诿给他人', fullScore: 5 },
  { id: 15, category: '价值观', functionItem: '结果导向', detailRequirement: '有目标感和结果意识', fullScore: 5 },
  { id: 16, category: '价值观', functionItem: '情绪管理', detailRequirement: '情绪稳定不大喜大悲', fullScore: 5 },
  { id: 17, category: '价值观', functionItem: '沟通能力', detailRequirement: '对上级、对同事、对学生的沟通方式', fullScore: 5 },
  // 附加 (18行，共1行)
  { id: 18, category: '附加', categoryRowSpan: 1, functionItem: '可异地调度', detailRequirement: '能到外地出差1年以上。', fullScore: 0 },
]

// 评分标准数据
const scoringStandardData: ScoringStandardRow[] = [
  // 核心业务能力 (1-4行，共4行)
  { id: 1, category: '核心业务能力', categoryRowSpan: 4, scoringItem: '咨询量排名', scoringStandard: '年度总咨询量排名第一为优，年度总咨询量排名第二、三为良，年度总咨询量排名第四为合格，年度总咨询量排名第五为差' },
  { id: 2, category: '核心业务能力', scoringItem: '聊出率排名', scoringStandard: '年度聊出率排名第一为优，年度聊出率排名第二、三良，年度聊出率排名第四为合格，年度聊出率排名第五为差' },
  { id: 3, category: '核心业务能力', scoringItem: '干预率排名', scoringStandard: '年度干预率排名第一为优，年度干预率排名第二、三为良，年度干预率排名第四第合格，年度干预率排名第五为差' },
  { id: 4, category: '核心业务能力', scoringItem: '对话数排名', scoringStandard: '年度总对话数排名第一为优，年度总对话数排名第二、三为良，年度总对话数排名第四为合格，年度总对话数排名第五为差' },
  // 一般业务能力 (5-8行，共4行)
  { id: 5, category: '一般业务能力', categoryRowSpan: 4, scoringItem: '学习+培训', scoringStandard: '上级领导进行打分' },
  { id: 6, category: '一般业务能力', scoringItem: '总进线数', scoringStandard: '年度二次咨询提醒个数第一为优，年度二次咨询提醒个数第二、三为良，年度二次咨询提醒个数第四为合格，年度二次咨询提醒个数第五为差' },
  { id: 7, category: '一般业务能力', scoringItem: '临时工作', scoringStandard: '上级领导进行打分' },
  { id: 8, category: '一般业务能力', scoringItem: '数据分析', scoringStandard: '个人总结计划能力' },
  // 价值观 (9-17行，共9行)
  { id: 9, category: '价值观', categoryRowSpan: 9, scoringItem: '责任心', scoringStandard: '上级领导进行打分' },
  { id: 10, category: '价值观', scoringItem: '执行力', scoringStandard: '上级领导进行打分' },
  { id: 11, category: '价值观', scoringItem: '吃苦耐劳', scoringStandard: '上级领导进行打分' },
  { id: 12, category: '价值观', scoringItem: '团队精神', scoringStandard: '上级领导进行打分' },
  { id: 13, category: '价值观', scoringItem: '职业化', scoringStandard: '上级领导进行打分' },
  { id: 14, category: '价值观', scoringItem: '向内归因', scoringStandard: '上级领导进行打分' },
  { id: 15, category: '价值观', scoringItem: '结果导向', scoringStandard: '上级领导进行打分' },
  { id: 16, category: '价值观', scoringItem: '情绪管理', scoringStandard: '上级领导进行打分' },
  { id: 17, category: '价值观', scoringItem: '沟通能力', scoringStandard: '上级领导进行打分' },
  // 附加 (18行，共1行)
  { id: 18, category: '附加', categoryRowSpan: 1, scoringItem: '可异地调度', scoringStandard: '上级领导进行打分' },
]

// 默认员工列表
const defaultEmployees: Employee[] = [
  { key: 'lvYuye', name: '吕玉策' },
  { key: 'liangYuchao', name: '梁玉超' },
  { key: 'shangBingyu', name: '商冰雨' },
  { key: 'fuZheng', name: '傅政' },
  { key: 'zhangXiaoxiao', name: '张肖肖' },
]

const WebChatTab: React.FC<WebChatTabProps> = ({ year, month }) => {
  const { message } = App.useApp()
  // 加载状态
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  // 员工列表状态
  const [employees, setEmployees] = useState<Employee[]>(defaultEmployees)
  // 员工得分状态 { rowId: { employeeKey: score } }
  const [scores, setScores] = useState<Record<number, Record<string, number>>>({})
  // 弹窗状态
  const [modalVisible, setModalVisible] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [form] = Form.useForm()

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const response = await marketStaffFunctionService.webChat.getData(year)
      
      // 如果有数据，更新状态
      if (response.employees && response.employees.length > 0) {
        const loadedEmployees: Employee[] = response.employees.map(emp => ({
          key: emp.employee_key,
          name: emp.employee_name,
        }))
        setEmployees(loadedEmployees)

        // 转换得分数据格式
        const loadedScores: Record<number, Record<string, number>> = {}
        response.employees.forEach(emp => {
          Object.entries(emp.scores || {}).forEach(([rowId, score]) => {
            const rid = Number(rowId)
            if (!loadedScores[rid]) {
              loadedScores[rid] = {}
            }
            loadedScores[rid][emp.employee_key] = score
          })
        })
        setScores(loadedScores)
      }
    } catch (error) {
      console.error('加载数据失败:', error)
    } finally {
      setLoading(false)
    }
  }, [year])

  // 保存数据
  const handleSave = async () => {
    setSaving(true)
    try {
      const employeesData: StaffEmployeeData[] = employees.map(emp => {
        const empScores: Record<number, number> = {}
        webChatData.forEach(row => {
          const score = scores[row.id]?.[emp.key]
          if (score !== undefined && score !== 0) {
            empScores[row.id] = score
          }
        })
        return {
          employee_key: emp.key,
          employee_name: emp.name,
          scores: empScores,
        }
      })

      await marketStaffFunctionService.webChat.save({
        year,
        employees: employeesData,
      })
      message.success('保存成功')
    } catch (error) {
      console.error('保存失败:', error)
      message.error('保存失败')
    } finally {
      setSaving(false)
    }
  }

  // 年份变化时重新加载数据
  useEffect(() => {
    loadData()
  }, [loadData])

  // 更新员工得分
  const handleScoreChange = (rowId: number, employeeKey: string, value: number | null) => {
    setScores(prev => ({
      ...prev,
      [rowId]: {
        ...prev[rowId],
        [employeeKey]: value ?? 0
      }
    }))
  }

  // 计算员工总分
  const calculateEmployeeTotal = (employeeKey: string): number => {
    let total = 0
    webChatData.forEach(row => {
      const score = scores[row.id]?.[employeeKey] ?? 0
      total += score
    })
    return total
  }

  // 添加员工
  const handleAddEmployee = () => {
    setEditingEmployee(null)
    form.resetFields()
    setModalVisible(true)
  }

  // 编辑员工
  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee)
    form.setFieldsValue({ name: employee.name })
    setModalVisible(true)
  }

  // 删除员工
  const handleDeleteEmployee = (key: string) => {
    if (employees.length <= 1) {
      message.warning('至少保留一名员工')
      return
    }
    setEmployees(employees.filter(emp => emp.key !== key))
    // 清除该员工的得分数据
    setScores(prev => {
      const newScores = { ...prev }
      Object.keys(newScores).forEach(rowId => {
        if (newScores[Number(rowId)]) {
          delete newScores[Number(rowId)][key]
        }
      })
      return newScores
    })
    message.success('删除成功')
  }

  // 保存员工
  const handleSaveEmployee = () => {
    form.validateFields().then(values => {
      if (editingEmployee) {
        // 编辑
        setEmployees(employees.map(emp => 
          emp.key === editingEmployee.key ? { ...emp, name: values.name } : emp
        ))
        message.success('修改成功')
      } else {
        // 新增
        const newKey = `employee_${Date.now()}`
        setEmployees([...employees, { key: newKey, name: values.name }])
        message.success('添加成功')
      }
      setModalVisible(false)
      form.resetFields()
    })
  }

  // 计算合计行（包含员工总分）
  const dataWithTotal = useMemo(() => {
    const totalRow: FunctionAnalysisRow = {
      id: 0,
      category: '合计',
      functionItem: '',
      detailRequirement: '',
      fullScore: webChatData.reduce((sum, row) => sum + row.fullScore, 0),
    }
    // 为每个员工计算总分
    employees.forEach(emp => {
      totalRow[emp.key] = calculateEmployeeTotal(emp.key)
    })
    return [...webChatData, totalRow]
  }, [employees, scores])

  // 渲染可编辑数字单元格
  const renderEditableCell = (
    value: number | null | undefined, 
    record: FunctionAnalysisRow, 
    employeeKey: string,
    isTotal: boolean = false
  ) => {
    if (isTotal) {
      return <span style={{ fontWeight: 'bold' }}>{value ?? 0}</span>
    }
    return (
      <InputNumber
        value={scores[record.id]?.[employeeKey] ?? value ?? null}
        style={{ width: '100%' }}
        size="small"
        controls={false}
        min={0}
        max={record.fullScore || 10}
        onChange={(val) => handleScoreChange(record.id, employeeKey, val)}
      />
    )
  }

  // 功能分析表格列定义
  const functionColumns: ColumnsType<FunctionAnalysisRow> = useMemo(() => {
    const baseColumns: ColumnsType<FunctionAnalysisRow> = [
      {
        title: '序号',
        dataIndex: 'id',
        key: 'id',
        width: 50,
        align: 'center',
        render: (value, record) => record.category === '合计' ? '' : value,
      },
      {
        title: '类别',
        dataIndex: 'category',
        key: 'category',
        width: 100,
        align: 'center',
        onCell: (record) => {
          if (record.category === '合计') {
            return {}
          }
          // 使用 categoryRowSpan 来控制合并
          if (record.categoryRowSpan) {
            return { rowSpan: record.categoryRowSpan }
          }
          return { rowSpan: 0 }
        },
        render: (value) => value,
      },
      {
        title: '功能项目',
        dataIndex: 'functionItem',
        key: 'functionItem',
        width: 120,
        align: 'center',
      },
      {
        title: '详细要求',
        dataIndex: 'detailRequirement',
        key: 'detailRequirement',
        width: 250,
        align: 'center',
      },
      {
        title: '满分',
        dataIndex: 'fullScore',
        key: 'fullScore',
        width: 60,
        align: 'center',
      },
    ]

    // 添加员工列（带操作按钮）
    const employeeColumns = employees.map(emp => ({
      title: (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <span>{emp.name}</span>
          <Space size={4}>
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEditEmployee(emp)}
              style={{ padding: 0, height: 'auto', fontSize: 12 }}
            />
            <Popconfirm
              title="确定删除该员工吗？"
              onConfirm={() => handleDeleteEmployee(emp.key)}
              okText="确定"
              cancelText="取消"
            >
              <Button
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
                style={{ padding: 0, height: 'auto', fontSize: 12 }}
              />
            </Popconfirm>
          </Space>
        </div>
      ),
      dataIndex: emp.key,
      key: emp.key,
      width: 100,
      align: 'center' as const,
      render: (value: number | null | undefined, record: FunctionAnalysisRow) =>
        renderEditableCell(value, record, emp.key, record.category === '合计'),
    }))

    // 添加"添加员工"列
    const addColumn = {
      title: (
        <Button
          type="dashed"
          size="small"
          icon={<PlusOutlined />}
          onClick={handleAddEmployee}
        >
          添加
        </Button>
      ),
      key: 'add',
      width: 80,
      align: 'center' as const,
      render: () => null,
    }

    return [...baseColumns, ...employeeColumns, addColumn]
  }, [employees, scores])

  // 评分标准表格列定义
  const scoringColumns: ColumnsType<ScoringStandardRow> = [
    {
      title: '序号',
      dataIndex: 'id',
      key: 'id',
      width: 50,
      align: 'center',
    },
    {
      title: '类别',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      align: 'center',
      onCell: (record) => {
        // 使用 categoryRowSpan 来控制合并
        if (record.categoryRowSpan) {
          return { rowSpan: record.categoryRowSpan }
        }
        return { rowSpan: 0 }
      },
      render: (value) => value,
    },
    {
      title: '评分标准',
      dataIndex: 'scoringItem',
      key: 'scoringItem',
      width: 120,
      align: 'center',
    },
    {
      title: (
        <div>
          <div style={{ textAlign: 'center' }}>评分标准</div>
          <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: '12px', marginTop: 4 }}>
            <span>优</span>
            <span>良</span>
            <span>合格</span>
            <span>差</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: '11px', color: '#666' }}>
            <span>10分则9-10/5分则5</span>
            <span>10分则7-8/5分则4</span>
            <span>10分支6/5分则3</span>
            <span>10分则0-4/5分则0-2</span>
          </div>
        </div>
      ),
      dataIndex: 'scoringStandard',
      key: 'scoringStandard',
      align: 'center',
    },
  ]

  return (
    <Spin spinning={loading}>
      <div>
        <div
          style={{
            marginBottom: 16,
            textAlign: 'center',
            fontSize: '16px',
            fontWeight: 'bold',
            padding: '8px',
            backgroundColor: '#b4c6e7',
            border: '1px solid #000',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ flex: 1, textAlign: 'center' }}>{year}年市场部-网聊功能分析表</span>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSave}
            loading={saving}
          >
            保存
          </Button>
        </div>

        <Table
          columns={functionColumns}
          dataSource={dataWithTotal}
          rowKey="id"
          pagination={false}
          bordered
          size="small"
          scroll={{ x: 1200 + employees.length * 100 }}
          rowClassName={(record) => record.category === '合计' ? 'total-row' : ''}
        />

        <Divider />

        <div
          style={{
            marginBottom: 16,
            textAlign: 'center',
            fontSize: '14px',
            fontWeight: 'bold',
            padding: '6px',
            backgroundColor: '#b4c6e7',
            border: '1px solid #000',
          }}
        >
          评分标准
        </div>

        <Table
          columns={scoringColumns}
          dataSource={scoringStandardData}
          rowKey="id"
          pagination={false}
          bordered
          size="small"
          scroll={{ x: 800 }}
        />

        {/* 员工编辑弹窗 */}
        <Modal
          title={editingEmployee ? '编辑员工' : '添加员工'}
          open={modalVisible}
          onOk={handleSaveEmployee}
          onCancel={() => {
            setModalVisible(false)
            form.resetFields()
          }}
          okText="保存"
          cancelText="取消"
        >
          <Form form={form} layout="vertical">
            <Form.Item
              name="name"
              label="员工姓名"
              rules={[{ required: true, message: '请输入员工姓名' }]}
            >
              <Input placeholder="请输入员工姓名" />
            </Form.Item>
          </Form>
        </Modal>

        <style>{`
          .ant-table-container table { border-color: #000 !important; }
          .ant-table-thead > tr > th {
            background-color: #b4c6e7 !important;
            border-color: #000 !important;
            font-weight: bold;
            text-align: center !important;
          }
          .ant-table-tbody > tr > td { border-color: #000 !important; }
          .ant-table-cell { padding: 4px 8px !important; }
          .total-row { background-color: #fff2cc !important; }
          .total-row td { background-color: #fff2cc !important; }
          .ant-input-number {
            border: none !important;
            box-shadow: none !important;
          }
          .ant-input-number-input {
            text-align: center;
          }
        `}</style>
      </div>
    </Spin>
  )
}

export default WebChatTab
